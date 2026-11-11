"use client";

/* eslint-disable react-hooks/immutability -- the camera, lights and probe state are three.js objects and refs mutated from effects and the R3F frame loop, outside React render; that is the intended pattern. */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { anchorFor, frameView, NARROW_QUERY, parseShot, POSTER_FRAME, type SensorFit, type Shot, type Vec3 } from "./chamberCamera";
import { setStanceDriver, type BookView, type Stance } from "./stance";
import { FRAME_BUDGET_MS, HIGH_DPR_MAX, type SceneTier } from "./quality";

type Props = { base: string; tier: SceneTier; onReady: () => void; onFail: () => void };
/** `lightmapped`: meshes that carry a baked lightmap (0 for a GLB exported without BAKE=1). `env`: the
    reflection probe, or null if chamber-env.hdr is missing. `lut`: the master's view transform, or null
    (three's own AgX then). `veil`: the master's residual at the Threshold (see the grade), or null. */
type Loaded = {
  model: THREE.Group;
  shot: Shot;
  lightmapped: number;
  env: THREE.DataTexture | null;
  lut: THREE.Data3DTexture | null;
  veil: THREE.DataTexture | null;
};

/** Probe orientation (radians about +Y) and strength; set by eye against the poster's brass. */
const ENV_ROTATION_Y = 0;
const ENV_INTENSITY = 1;
/** ±10 cm of camera travel at the edges of the window. */
const PARALLAX_M = 0.1;
/** Exponential damping rate (1/s) for the parallax. */
const DAMPING = 4;
/** First-frames timing check: frames ignored (shader warm-up), then frames measured. */
const PROBE_SKIP = 4;
const PROBE_FRAMES = 20;

/*
  Baked lighting (art/unwritten/bake_web.py). A baked node's glTF extras carry `lightmap` (a PNG path
  relative to the GLB, on UV1) and `lightmap_ev`. The PNG stores sRGB_OETF(min(1, E · 2^ev)) of the Cycles
  diffuse lighting E, so the texture is decoded as sRGB and scaled back by 2^−ev; three shades a lightMap as
  albedo · intensity · texel / π, hence the π.
*/
const LIGHTMAP_PATH = /^lightmaps\/[\w.-]+\.png$/;
/** Artistic trim on the decoded lightmaps (1 = the bake as-is). NEXT_PUBLIC_UNWRITTEN_LM_INTENSITY sets it at build time. */
const LIGHTMAP_INTENSITY = (() => {
  const v = Number(process.env.NEXT_PUBLIC_UNWRITTEN_LM_INTENSITY);
  return Number.isFinite(v) && v > 0 ? v : 1;
})();
/** The fill that remains for meshes without a lightmap (metals, glass, bulbs) once a bake exists. */
const FILL_HEMI = 0.25;
const FILL_KEY = 0.6;
/** The sconces' frosted shades glow from the 45 W bulb inside (hero-006); three's transmission would cost
    a pass and render them dull, so they become unlit emitters at this linear radiance, warm (2700 K). */
const SHADE_GLOW = new THREE.Color(1.0, 0.72, 0.45).multiplyScalar(6);

const OBSIDIAN = "#141512";
/** The reading desk, in three space (Blender (0, −1.45, 0.92) with Z up). */
const DESK = new THREE.Vector3(0, 0.92, 1.45);
const UP = new THREE.Vector3(0, 1, 0);

/* ---------------------------------------------------------------- loading */

/**
  Blender's AgX view with the "AgX - Punchy" look as a 3D LUT (art/unwritten/agx_lut.py): N wide, N² tall,
  row = b·N + g, so the RGBA readback is already Data3DTexture order. Raw, not colour-managed: the texels are
  the master's sRGB-encoded output, written straight to the canvas.
*/
async function loadLut(url: string): Promise<THREE.Data3DTexture | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const img = await createImageBitmap(await res.blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none" });
    const n = img.width;
    if (n !== LUT_SIZE || img.height !== n * n) return null;
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = n * n;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    img.close();
    const tex = new THREE.Data3DTexture(new Uint8Array(ctx.getImageData(0, 0, n, n * n).data.buffer), n, n, n);
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = tex.wrapR = THREE.ClampToEdgeWrapping;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;
    return tex;
  } catch {
    return null;
  }
}

async function fetchShot(url: string): Promise<Shot | null> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    return res.ok ? parseShot(await res.json()) : null;
  } catch {
    return null;
  }
}

/** Fallback: the GLB's own CAM_HERO. glTF drops lens shift, so it is read from extras when exported. */
function shotFromGltf(gltf: GLTF): Shot | null {
  gltf.scene.updateMatrixWorld(true);
  const node = gltf.scene.getObjectByName("CAM_HERO");
  const found: THREE.PerspectiveCamera[] = [];
  node?.traverse((o) => {
    if (o instanceof THREE.PerspectiveCamera) found.push(o);
  });
  const cam =
    found[0] ??
    gltf.cameras.find(
      (c): c is THREE.PerspectiveCamera =>
        c instanceof THREE.PerspectiveCamera && (c.name === "CAM_HERO" || c.parent?.name === "CAM_HERO"),
    );
  if (!cam) return null;
  const extras: Record<string, unknown> = { ...cam.parent?.userData, ...node?.userData, ...cam.userData };
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const fit = typeof extras.sensor_fit === "string" ? extras.sensor_fit.toUpperCase() : "";
  const aspect = cam.aspect > 0 && Number.isFinite(cam.aspect) ? cam.aspect : POSTER_FRAME.width / POSTER_FRAME.height;
  return {
    position: cam.getWorldPosition(new THREE.Vector3()).toArray(),
    direction: cam.getWorldDirection(new THREE.Vector3()).toArray(),
    fovV: cam.fov,
    frame: { width: POSTER_FRAME.width, height: POSTER_FRAME.width / aspect },
    shiftX: n(extras.shift_x),
    shiftY: n(extras.shift_y),
    sensorFit: (fit === "HORIZONTAL" || fit === "VERTICAL" ? fit : "AUTO") as SensorFit,
  };
}

/**
  Swap each lightmapped mesh to an unlit MeshBasicMaterial carrying the bake: three has no per-light
  masking, and Basic's lightMap term is exactly Standard's diffuse lightmap term (albedo · E / π) without the
  punctual lights, so the fill rig cannot double-light baked surfaces. A missing PNG leaves that mesh lit.
*/
async function applyLightmaps(root: THREE.Object3D, base: string): Promise<number> {
  const jobs: { mesh: THREE.Mesh; std: THREE.MeshStandardMaterial; path: string; ev: number }[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    const { lightmap: path, lightmap_ev: ev } = o.userData as { lightmap?: unknown; lightmap_ev?: unknown };
    if (!mesh.isMesh || typeof path !== "string" || !LIGHTMAP_PATH.test(path)) return;
    if (typeof ev !== "number" || !Number.isFinite(ev)) return;
    if (!(mesh.material instanceof THREE.MeshStandardMaterial)) return;
    jobs.push({ mesh, std: mesh.material, path, ev });
  });
  const loader = new THREE.TextureLoader();
  const done = await Promise.all(
    jobs.map(async ({ mesh, std, path, ev }) => {
      try {
        const tex = await loader.loadAsync(`${base}/unwritten/${path}`);
        tex.flipY = false; // glTF UV convention, as GLTFLoader's own textures
        tex.channel = 1; // TEXCOORD_1 = the "lightmap" UV layer
        tex.colorSpace = THREE.SRGBColorSpace;
        // No mipmaps: an atlas's coarse levels average neighbouring islands, and edge-on faces (pilaster
        // arrises) sampled them as dashed, sky-blue lines. Lightmaps are low-frequency; bilinear is enough.
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        mesh.material = new THREE.MeshBasicMaterial({
          name: std.name,
          color: std.color,
          map: std.map,
          side: std.side,
          transparent: std.transparent,
          opacity: std.opacity,
          lightMap: tex,
          lightMapIntensity: LIGHTMAP_INTENSITY * Math.PI * 2 ** -ev,
        });
        return true;
      } catch {
        return false;
      }
    }),
  );
  return done.filter(Boolean).length;
}

function dispose(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
      m.dispose();
    }
  });
}

/** Null on any failure: a missing chamber.glb (404) must leave the poster in place, silently. */
async function loadChamber(base: string): Promise<Loaded | null> {
  // The exporter's DRACO=1 build: the decoder is three's own (examples/jsm/libs/draco, the full build, all
  // three files from that one folder), copied to public/unwritten/draco/.
  const draco = new DRACOLoader().setDecoderPath(`${base}/unwritten/draco/`);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setDRACOLoader(draco);
  try {
    const [gltf, jsonShot, env, lut, veil] = await Promise.all([
      loader.loadAsync(`${base}/unwritten/chamber.glb`),
      fetchShot(`${base}/unwritten/chamber-camera.json`),
      // The reflection probe (ruling E): an equirect of the frozen lighting from just above the desk
      // (chamber.py CAMS=PANO). Optional: without it the metals keep the fill only.
      new HDRLoader().loadAsync(`${base}/unwritten/chamber-env.hdr`).catch(() => null),
      loadLut(`${base}/unwritten/agx-punchy.png`),
      new HDRLoader().loadAsync(`${base}/unwritten/chamber-veil.hdr`).catch(() => null),
    ]);
    const shot = jsonShot ?? shotFromGltf(gltf);
    if (!shot) {
      dispose(gltf.scene);
      env?.dispose();
      lut?.dispose();
      veil?.dispose();
      return null;
    }
    // Lighting is the bake plus the rig below; drop any punctual lights the exporter wrote so the look
    // stays deterministic.
    const exported: THREE.Object3D[] = [];
    gltf.scene.traverse((o) => {
      if (o instanceof THREE.Light) exported.push(o);
      if (o.userData.invisible === true) o.visible = false; // HIT_FOLIO: the exporter's click proxy
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    for (const l of exported) l.removeFromParent();
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material) || mesh.material.name !== "frosted_glass") return;
      mesh.material.dispose();
      mesh.material = new THREE.MeshBasicMaterial({ name: "frosted_glass", color: SHADE_GLOW });
    });
    const lightmapped = await applyLightmaps(gltf.scene, base);
    if (veil) {
      veil.minFilter = veil.magFilter = THREE.LinearFilter;
      veil.generateMipmaps = false;
    }
    return { model: gltf.scene, shot, lightmapped, env, lut, veil };
  } catch {
    return null;
  } finally {
    draco.dispose(); // its decoder workers are only needed while parsing
  }
}

/* ---------------------------------------------------------------- the shaft */

/*
  The haze the bake cannot carry: daylight from the oculus through height-thinned air (chamber.py's haze
  volume). A cone from the oculus (2.2 m) to the floor (the 4° sun's spread), drawn additively: the light
  scales with the path length through it (√(1 − x²) across the beam, x = 0 at its axis) and thins with
  height. It adds light, never occludes, and writes no depth. Values are set by eye against hero-006.
*/
const OCULUS = new THREE.Vector3(0, 23.9, 0); // chamber.py R_OCULUS 2.2 m at dome_z(2.2), Blender (0, 0, 23.9)
const POOL = new THREE.Vector3(0, 0, 1.51); // the sun line through the desk (0, −1.45, 0.92), carried to the floor
const SHAFT_RADIUS = 2.2; // at the oculus; the 4° sun spreads it to ≈ 3.0 m at the floor
const SHAFT_RADIUS_FLOOR = 2.2 + 24 * Math.tan((2 * Math.PI) / 180);
const SHAFT_COLOR = new THREE.Color("#ffe8cf"); // 5100 K
const SHAFT_STRENGTH = 0.09;

/** `gate` scales the shaft; 1 − the veil's weight, since at the Threshold the veil already carries it. */
function Shaft({ gate }: { gate: { value: number } }) {
  const { mesh, material } = useMemo(() => {
    const axis = new THREE.Vector3().subVectors(POOL, OCULUS);
    const length = axis.length();
    const geometry = new THREE.CylinderGeometry(SHAFT_RADIUS, SHAFT_RADIUS_FLOOR, length, 64, 1, true) // top = the oculus end;
    const material = new THREE.ShaderMaterial({
      uniforms: { color: { value: SHAFT_COLOR }, strength: { value: SHAFT_STRENGTH }, top: { value: OCULUS.y }, gate },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV; varying float vY;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vY = w.y;
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - w.xyz);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 color; uniform float strength; uniform float top; uniform float gate;
        varying vec3 vN; varying vec3 vV; varying float vY;
        void main() {
          float facing = abs(dot(normalize(vN), normalize(vV)));      // 1 on the axis, 0 at the rim
          float path = pow(facing, 2.5);                               // √(1 − x²), steepened: a penumbra, not a wall
          float h = clamp(vY / top, 0.0, 1.0);
          float air = mix(1.0, 0.25, h * h) * smoothstep(0.0, 0.6, vY); // height-thinned; no seam at the floor
          gl_FragColor = vec4(color * strength * gate * path * air, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
      toneMapped: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "SHAFT";
    mesh.position.copy(OCULUS).addScaledVector(axis, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, axis.clone().normalize().negate());
    mesh.renderOrder = 10;
    return { mesh, material };
  }, [gate]);
  useEffect(() => () => {
    mesh.geometry.dispose();
    material.dispose();
  }, [mesh, material]);
  return <primitive object={mesh} />;
}

/* ---------------------------------------------------------------- the grade */

/*
  The master's look, end to end: the scene renders scene-linear into a half-float target (three skips tone
  mapping for render targets), then one pass applies Blender's view (the LUT, at the master's EV) and
  finish.py's lens: lateral CA, the cos⁴-like vignette and luminance-weighted grain, all placed on the
  poster's full frame rather than the visible crop, so the crossfade lands on the same pixels.

  The veil: what a diffuse bake and unlit materials cannot carry (the haze's in-scatter along every view
  ray, glossy reflections), measured once as the master's scene-linear light minus this scene's at the
  Threshold (art/unwritten/veil.py), blurred and stored as a small Radiance HDR on the poster's frame. It
  is added before the view transform at full weight at the Threshold and fades out as a stance flight
  leaves it, while the shaft cone fades in to carry the haze from other viewpoints.
*/
const LUT_SIZE = 48;
const LOG_LO = -12.47393; // AgX Log's lg2 allocation (Blender config.ocio)
const LOG_HI = 12.5260688117;
const EXPOSURE = 2 ** -0.3; // the master's EV −0.3 (hero-006)
/** finish.py strength (the poster is finish.py at 1). */
const FINISH = 1;
/** MSAA for the scene target; the canvas itself is created without antialiasing when the grade runs. */
const TARGET_SAMPLES = 4;
/*
  Away from the Threshold the veil can't hold, so the haze's in-scatter becomes a depth term: AIR · (1 −
  e^(−d / AIR_LENGTH)). Fitted against Cycles at the Desk stance (art/unwritten/airfit.py, 11 Nov): there the
  camera stands at the sun shaft's edge, so every view ray crosses lit haze and the in-scatter is nearly
  flat with distance (≈ 0.09 linear at 3 m and at 15 m alike), hence the short length. It weighs 1 − the
  veil's weight, like the cone, so the Threshold stays the veil's.
*/
const AIR = new THREE.Color(0.111, 0.087, 0.078);
const AIR_LENGTH = 1;

/** The visible crop as a window (x, y, w, h; y up) on the poster frame, and that frame's aspect. */
type GradeWindow = { frame: THREE.Vector4; aspect: { value: number } };

const GRADE_FRAGMENT = /* glsl */ `
  precision highp sampler3D;
  uniform sampler2D scene; uniform sampler3D lut;
  uniform float exposure; uniform float finish; uniform vec4 frame; uniform float aspect;
  uniform sampler2D veil; uniform float veilWeight;
  uniform sampler2D depth; uniform float near; uniform float far; uniform vec3 air; uniform float airWeight;
  varying vec2 vUv;
  const float N = ${LUT_SIZE.toFixed(1)};
  vec3 add;
  vec3 view(vec3 lin) {
    vec3 c = clamp((log2(max((lin + add) * exposure, vec3(1e-10))) - (${LOG_LO})) / ${(LOG_HI - LOG_LO).toFixed(7)}, 0.0, 1.0);
    return texture(lut, c * ((N - 1.0) / N) + 0.5 / N).rgb;
  }
  vec2 toView(vec2 f) { return (f - frame.xy) / frame.zw; }   // poster frame (y up) -> this canvas
  float gauss(vec2 p) {                                         // Box-Muller from two hashes
    vec2 u = fract(sin(vec2(dot(p, vec2(12.9898, 78.233)), dot(p, vec2(39.3468, 11.135)))) * 43758.5453);
    return sqrt(-2.0 * log(max(u.x, 1e-6))) * cos(6.2831853 * u.y);
  }
  void main() {
    vec2 d = frame.xy + vUv * frame.zw - 0.5;                   // from the poster's centre
    vec2 n = 2.0 * d;
    float r2 = (n.x * n.x * aspect * aspect + n.y * n.y) / (aspect * aspect + 1.0);
    float ca = 0.0016 * finish;
    float z = texture(depth, vUv).x;
    float dist = near * far / (far - z * (far - near));            // perspective depth -> view distance (m)
    add = veilWeight * texture(veil, d + 0.5).rgb + airWeight * air * (1.0 - exp(-dist / ${AIR_LENGTH.toFixed(1)}));
    vec3 o = view(texture(scene, vUv).rgb);
    o.r = view(texture(scene, toView(0.5 + d * (1.0 + ca))).rgb).r;
    o.b = view(texture(scene, toView(0.5 + d * (1.0 - ca))).rgb).b;
    o *= 1.0 - 0.38 * finish * pow(r2, 1.4);
    float lum = (o.r + o.g + o.b) / 3.0;
    o += gauss(gl_FragCoord.xy) * 0.012 * finish * (0.35 + 0.65 * (1.0 - lum));
    gl_FragColor = vec4(clamp(o, 0.0, 1.0), 1.0);
  }`;

const DRAWING = new THREE.Vector2();
const BLACK = new THREE.DataTexture(new Uint8Array(4), 1, 1);
BLACK.needsUpdate = true;
/** The veil fades out over this much camera travel (m) from the Threshold; parallax stays inside the first. */
const VEIL_NEAR = 0.15;
const VEIL_FAR = 2.5;

function Grade({ lut, veil, weight, airWeight, win }: { lut: THREE.Data3DTexture; veil: THREE.Texture | null; weight: { value: number }; airWeight: { value: number }; win: GradeWindow }) {
  const { gl, scene: world, camera: eye, invalidate } = useThree();
  const pass = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: TARGET_SAMPLES, depthTexture: new THREE.DepthTexture(1, 1) });
    const material = new THREE.ShaderMaterial({
      uniforms: {
        scene: { value: target.texture },
        lut: { value: lut },
        exposure: { value: EXPOSURE },
        finish: { value: FINISH },
        frame: { value: win.frame },
        aspect: win.aspect,
        veil: { value: veil ?? BLACK },
        veilWeight: weight,
        depth: { value: target.depthTexture },
        near: { value: 0.05 },
        far: { value: 250 },
        air: { value: AIR },
        airWeight,
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: GRADE_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    return { target, material, quad, post: new THREE.Scene().add(quad), ortho: new THREE.OrthographicCamera() };
  }, [lut, veil, weight, airWeight, win]);

  // Development only (?dump): the scene-linear frame without the shaft, 2×2-averaged, for veil.py. With
  // { full: true } it is what the grade sees before the view transform away from the Threshold: the shaft at
  // its gate plus the air term, and a fourth channel holding the view distance (m).
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !new URLSearchParams(window.location.search).has("dump")) return;
    const w = window as unknown as { __unwrittenLinear?: (o?: { full?: boolean }) => { w: number; h: number; ch: number; data: string } };
    w.__unwrittenLinear = ({ full = false } = {}) => {
      const px = gl.getDrawingBufferSize(new THREE.Vector2());
      const rt = new THREE.WebGLRenderTarget(px.x, px.y, { type: THREE.FloatType, depthTexture: full ? new THREE.DepthTexture(px.x, px.y) : undefined });
      const shaft = world.getObjectByName("SHAFT");
      if (shaft && !full) shaft.visible = false;
      gl.setRenderTarget(rt);
      gl.render(world, eye);
      let read = rt;
      let resolve: { out: THREE.WebGLRenderTarget; material: THREE.ShaderMaterial; quad: THREE.Mesh } | null = null;
      if (full) {
        const pc = eye as THREE.PerspectiveCamera;
        const material = new THREE.ShaderMaterial({
          uniforms: { scene: { value: rt.texture }, depth: { value: rt.depthTexture }, near: { value: pc.near }, far: { value: pc.far }, air: { value: AIR }, airWeight },
          vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
          fragmentShader: /* glsl */ `
            uniform sampler2D scene; uniform sampler2D depth; uniform float near; uniform float far; uniform vec3 air; uniform float airWeight;
            varying vec2 vUv;
            void main() {
              float z = texture(depth, vUv).x;
              float dist = near * far / (far - z * (far - near));
              gl_FragColor = vec4(texture(scene, vUv).rgb + airWeight * air * (1.0 - exp(-dist / ${AIR_LENGTH.toFixed(1)})), dist);
            }`,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
        });
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        quad.frustumCulled = false;
        const out = new THREE.WebGLRenderTarget(px.x, px.y, { type: THREE.FloatType });
        gl.setRenderTarget(out);
        gl.render(quad, new THREE.OrthographicCamera());
        read = out;
        resolve = { out, material, quad };
      }
      const buf = new Float32Array(px.x * px.y * 4);
      gl.readRenderTargetPixels(read, 0, 0, px.x, px.y, buf);
      gl.setRenderTarget(null);
      if (shaft) shaft.visible = true;
      rt.depthTexture?.dispose();
      rt.dispose();
      if (resolve) {
        resolve.out.dispose();
        resolve.material.dispose();
        resolve.quad.geometry.dispose();
      }
      const hw = px.x >> 1;
      const hh = px.y >> 1;
      const ch = full ? 4 : 3;
      const out = new Float32Array(hw * hh * ch);
      const at = (y: number, x: number, c: number) => buf[(y * px.x + x) * 4 + c];
      for (let y = 0; y < hh; y++)
        for (let x = 0; x < hw; x++)
          for (let c = 0; c < ch; c++)
            out[(y * hw + x) * ch + c] = (at(2 * y, 2 * x, c) + at(2 * y, 2 * x + 1, c) + at(2 * y + 1, 2 * x, c) + at(2 * y + 1, 2 * x + 1, c)) / 4;
      const bytes = new Uint8Array(out.buffer);
      let bin = "";
      for (let k = 0; k < bytes.length; k += 0x8000) bin += String.fromCharCode(...bytes.subarray(k, k + 0x8000));
      return { w: hw, h: hh, ch, data: btoa(bin) }; // rows bottom-up
    };
    (window as unknown as { __unwrittenHide?: (prefix: string) => void }).__unwrittenHide = (prefix) => {
      world.traverse((o) => {
        if (o.name.startsWith(prefix)) o.visible = false;
      });
      invalidate();
    };
    (window as unknown as { __unwrittenMeshes?: () => string[] }).__unwrittenMeshes = () => {
      const rows: string[] = [];
      world.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if ((o as THREE.Mesh).isMesh && m) rows.push(`${o.name} ${m.type} lm=${m.lightMap ? m.lightMapIntensity.toFixed(3) : "-"} map=${m.map ? "y" : "-"} color=${m.color?.getHexString()} vis=${o.visible}`);
      });
      return rows;
    };
    return () => {
      delete w.__unwrittenLinear;
    };
  }, [gl, world, eye, invalidate, airWeight]);

  useEffect(() => () => {
    pass.target.depthTexture?.dispose();
    pass.target.dispose();
    pass.material.dispose();
    pass.quad.geometry.dispose();
  }, [pass]);

  // Priority 1 takes rendering over from R3F: the scene into the target, then the grade onto the canvas.
  useFrame(({ scene, camera }) => {
    const pc = camera as THREE.PerspectiveCamera;
    pass.material.uniforms.near.value = pc.near;
    pass.material.uniforms.far.value = pc.far;
    const px = gl.getDrawingBufferSize(DRAWING);
    if (pass.target.width !== px.x || pass.target.height !== px.y) pass.target.setSize(px.x, px.y);
    gl.setRenderTarget(pass.target);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(pass.post, pass.ortho);
  }, 1);
  return null;
}

/* ---------------------------------------------------------------- stances */

/*
  Ruling B: Threshold → Desk → Book on one authored track, no orbit. A pose is a camera position, a view
  direction, a horizontal field of view (the poster's sensor fit is horizontal) and a Blender-style vertical
  lens shift. The Threshold is the poster's CAM_HERO; the Desk stays level with a little downward shift, so
  the verticals hold until the last moment; only the Book looks down, at the volume itself.
*/
type Pose = { pos: THREE.Vector3; dir: THREE.Vector3; hfov: number; shiftY: number };
type Track = { pos: THREE.CatmullRomCurve3; dir: THREE.CatmullRomCurve3; lens: THREE.CatmullRomCurve3 };
type Flight = { track: Track; start: number; ms: number; to: Stance; resolve: (v: BookView | null) => void };

const DEG = Math.PI / 180;
const STANCE_IN_MS = 2600;
const STANCE_OUT_MS = 2000;
/** A reader's eye height, 3.3 m back from the desk, level, 35 mm-ish. */
const DESK_POSE: Pose = { pos: new THREE.Vector3(-0.35, 1.52, 4.75), dir: new THREE.Vector3(0.06, 0, -1).normalize(), hfov: 58 * DEG, shiftY: -0.1 };
/** The Book stance: a three-quarter view from the reader's side of the desk, 1.4 m from the volume and
    looking down at it about 27°, so the lamp and the leather stay in frame. */
const BOOK_FROM = new THREE.Vector3(0.45, 0.62, 1.15);
const BOOK_HFOV = 40 * DEG;
const LOOK = new THREE.Vector3();

const clonePose = (p: Pose): Pose => ({ pos: p.pos.clone(), dir: p.dir.clone(), hfov: p.hfov, shiftY: p.shiftY });

function thresholdPose(shot: Shot): Pose {
  const aspect = shot.frame.width / shot.frame.height;
  return {
    pos: new THREE.Vector3().fromArray(shot.position),
    dir: new THREE.Vector3().fromArray(shot.direction).normalize(),
    hfov: 2 * Math.atan(Math.tan((shot.fovV * DEG) / 2) * aspect),
    shiftY: shot.shiftY,
  };
}

/** The pose as a Shot, so frameView crops it exactly as it crops the poster. */
function shotAt(p: Pose, base: Shot): Shot {
  const aspect = base.frame.width / base.frame.height;
  return {
    ...base,
    position: p.pos.toArray() as Vec3,
    direction: p.dir.toArray() as Vec3,
    fovV: (2 * Math.atan(Math.tan(p.hfov / 2) / aspect)) / DEG,
    shiftY: p.shiftY,
  };
}

/** The Book pose, from the FRONTIER volume's own meshes; null (no stances) if the model has none. */
function bookPose(model: THREE.Object3D): (Pose & { box: THREE.Box3 }) | null {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3();
  model.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.name.startsWith("FOLIO_FRONTIER")) box.expandByObject(o);
  });
  if (box.isEmpty()) return null;
  const c = box.getCenter(new THREE.Vector3());
  const pos = c.clone().add(BOOK_FROM);
  return { pos, dir: c.clone().sub(pos).normalize(), hfov: BOOK_HFOV, shiftY: 0, box };
}

function stanceTrack(poses: Pose[]): Track {
  return {
    pos: new THREE.CatmullRomCurve3(poses.map((p) => p.pos.clone()), false, "centripetal"),
    dir: new THREE.CatmullRomCurve3(poses.map((p) => p.dir.clone()), false, "centripetal"),
    lens: new THREE.CatmullRomCurve3(poses.map((p) => new THREE.Vector3(p.hfov, p.shiftY, 0))),
  };
}

function sampleTrack(t: Track, u: number, out: Pose) {
  t.pos.getPoint(u, out.pos);
  t.dir.getPoint(u, out.dir).normalize();
  const lens = t.lens.getPoint(u, LOOK);
  out.hfov = lens.x;
  out.shiftY = lens.y;
}

/* ---------------------------------------------------------------- scene */

const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia(NARROW_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

function Chamber({ loaded, tier, onReady, onFail }: { loaded: Loaded; tier: SceneTier; onReady: () => void; onFail: () => void }) {
  const { gl, scene, camera, size, invalidate, setDpr } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const narrow = useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW_QUERY).matches, () => false);

  const sun = useRef<THREE.DirectionalLight>(null);
  const deskTarget = useMemo(() => new THREE.Object3D(), []);
  const rest = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3(1, 0, 0));
  const aim = useRef({ x: 0, y: 0 });
  const offset = useRef({ x: 0, y: 0 });
  const onScreen = useRef(true);
  const probe = useRef({ phase: "compile" as "compile" | "run" | "done", last: 0, samples: [] as number[], tier });
  const baked = loaded.lightmapped > 0;
  const gradeWindow = useMemo<GradeWindow>(() => ({ frame: new THREE.Vector4(0, 0, 1, 1), aspect: { value: 16 / 9 } }), []);
  const threshold = useMemo(() => thresholdPose(loaded.shot), [loaded]);
  const book = useMemo(() => bookPose(loaded.model), [loaded]);
  // Development only (?stance=desk|book): start at that pose, to judge the off-Threshold air against Cycles
  // (chamber.py CAMS=WEB_DESK / WEB_BOOK, art/unwritten/airfit.py).
  const devStance = process.env.NODE_ENV !== "production" ? new URLSearchParams(window.location.search).get("stance") : null;
  const pose = useRef<Pose>(clonePose(devStance === "desk" ? DESK_POSE : devStance === "book" && book ? book : threshold));
  const flight = useRef<Flight | null>(null);
  const [live, setLive] = useState(false);
  const veilWeight = useMemo(() => ({ value: loaded.veil && loaded.lut ? 1 : 0 }), [loaded]);
  const shaftGate = useMemo(() => ({ value: 1 - veilWeight.value }), [veilWeight]);

  // Place the camera at a pose and reproduce the poster's crop and lens shift (at the Threshold, exactly the
  // poster). Runs on resize and every frame of a stance flight.
  const place = useCallback((p: Pose) => {
    const shot = shotAt(p, loaded.shot);
    rest.current.copy(p.pos);
    cam.position.copy(rest.current);
    cam.up.copy(UP);
    cam.lookAt(LOOK.copy(p.dir).add(rest.current));
    right.current.set(1, 0, 0).applyQuaternion(cam.quaternion);
    cam.near = 0.05;
    cam.far = 250;
    const anchor = anchorFor(narrow);
    const v = frameView(shot, size.width, size.height, anchor);
    cam.aspect = v.aspect;
    cam.fov = v.fov;
    cam.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height);
    // The poster crops by object-position alone (its lens shift is already in the image), so the grade's
    // window on it leaves the shift out.
    const sx = v.width / v.fullWidth;
    const sy = v.height / v.fullHeight;
    gradeWindow.frame.set(((v.fullWidth - v.width) * anchor.x) / v.fullWidth, 1 - ((v.fullHeight - v.height) * anchor.y) / v.fullHeight - sy, sx, sy);
    gradeWindow.aspect.value = v.aspect;
  }, [loaded.shot, cam, size.width, size.height, narrow, gradeWindow]);

  useEffect(() => {
    place(pose.current);
    invalidate();
  }, [place, invalidate]);

  // The stance driver, once the chamber is live and the book is found: each request flies from wherever the
  // camera is, through the Desk, to the target; a newer request supersedes (and resolves null) an older one.
  useEffect(() => {
    if (!live || !book) return;
    const unregister = setStanceDriver(
      (to) =>
        new Promise<BookView | null>((resolve) => {
          flight.current?.resolve(null);
          const target = to === "book" ? book : threshold;
          flight.current = { track: stanceTrack([clonePose(pose.current), DESK_POSE, target]), start: -1, ms: to === "book" ? STANCE_IN_MS : STANCE_OUT_MS, to, resolve };
          invalidate();
        }),
    );
    return () => {
      unregister();
      flight.current?.resolve(null);
      flight.current = null;
    };
  }, [live, book, threshold, invalidate]);

  /** The book as seen from the camera now, in px within the canvas (= the chamber's frame). */
  const bookView = (): BookView | null => {
    if (!book) return null;
    cam.updateMatrixWorld();
    const at = (v: THREE.Vector3) => {
      const p = v.clone().project(cam);
      return { x: ((p.x + 1) / 2) * size.width, y: ((1 - p.y) / 2) * size.height };
    };
    const c = at(book.box.getCenter(new THREE.Vector3()));
    const l = at(new THREE.Vector3(book.box.min.x, book.box.max.y, (book.box.min.z + book.box.max.z) / 2));
    const r = at(new THREE.Vector3(book.box.max.x, book.box.max.y, (book.box.min.z + book.box.max.z) / 2));
    const pitch = Math.asin(Math.min(1, Math.max(-1, -pose.current.dir.y))) / DEG;
    return { x: c.x, y: c.y, book: Math.hypot(r.x - l.x, r.y - l.y), tilt: Math.min(80, Math.max(20, 90 - pitch)) };
  };

  // Reflections for the unbaked metals and glass: the probe, prefiltered once. The lightmapped meshes are
  // MeshBasicMaterial and ignore it, so the bake is not double-counted. The PANO camera uses Blender's
  // environment-texture convention (image centre = Blender −Y = three +Z); ENV_ROTATION_Y lines it up.
  useEffect(() => {
    if (!loaded.env) return;
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromEquirectangular(loaded.env);
    pmrem.dispose();
    scene.environment = rt.texture;
    scene.environmentRotation.set(0, ENV_ROTATION_Y, 0);
    scene.environmentIntensity = ENV_INTENSITY;
    invalidate();
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [loaded.env, gl, scene, invalidate]);

  // Compile shaders first so the timing check measures rendering, not program linking.
  useEffect(() => {
    let gone = false;
    gl.compileAsync(scene, cam)
      .catch(() => undefined)
      .then(() => {
        if (gone) return;
        probe.current.phase = "run";
        invalidate();
      });
    return () => {
      gone = true;
    };
  }, [gl, scene, cam, invalidate]);

  // Only render while the canvas is on screen and the tab is visible; a lost context falls back to the poster.
  useEffect(() => {
    const el = gl.domElement;
    let intersecting = true;
    const update = () => {
      onScreen.current = intersecting && !document.hidden;
      if (onScreen.current) invalidate();
    };
    const io = new IntersectionObserver(([e]) => {
      intersecting = e.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    const lost = (e: Event) => {
      e.preventDefault();
      onFail();
    };
    el.addEventListener("webglcontextlost", lost);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      el.removeEventListener("webglcontextlost", lost);
    };
  }, [gl, invalidate, onFail]);

  // Pointer parallax. The layer never mounts under reduced motion, so this is the only motion there is.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      aim.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      aim.current.y = 1 - (e.clientY / window.innerHeight) * 2;
      if (onScreen.current) invalidate();
    };
    const home = () => {
      aim.current.x = 0;
      aim.current.y = 0;
      invalidate();
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", home);
    window.addEventListener("blur", home);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", home);
      window.removeEventListener("blur", home);
    };
  }, [invalidate]);

  useFrame((_, delta) => {
    // First-frames timing check, while the layer is still transparent over the poster.
    const p = probe.current;
    if (p.phase === "run") {
      const now = performance.now();
      if (p.last) p.samples.push(now - p.last);
      p.last = now;
      if (p.samples.length >= PROBE_SKIP + PROBE_FRAMES) {
        const ms = p.samples.slice(PROBE_SKIP).sort((a, b) => a - b)[Math.floor(PROBE_FRAMES / 2)];
        if (ms <= FRAME_BUDGET_MS) {
          p.phase = "done";
          onReady(); // this frame renders before the 600 ms crossfade begins
          setLive(true);
        } else if (p.tier === "high") {
          p.tier = "mid";
          setDpr(1);
          if (sun.current) sun.current.castShadow = false;
          p.samples = [];
          p.last = 0;
        } else {
          p.phase = "done";
          onFail();
          return;
        }
      }
      if (p.phase === "run") invalidate();
    }

    // A stance flight moves the rest pose; the parallax below rides on top of it.
    const f = flight.current;
    if (f) {
      const now = performance.now();
      if (f.start < 0) f.start = now;
      const t = Math.min(1, (now - f.start) / f.ms);
      sampleTrack(f.track, t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2, pose.current);
      place(pose.current);
      if (t >= 1) {
        flight.current = null;
        f.resolve(f.to === "book" ? bookView() : null);
      } else invalidate();
    }

    if (loaded.veil && loaded.lut) {
      veilWeight.value = 1 - THREE.MathUtils.smoothstep(pose.current.pos.distanceTo(threshold.pos), VEIL_NEAR, VEIL_FAR);
      shaftGate.value = 1 - veilWeight.value;
    }

    // Damped parallax: translate only, so the level camera keeps its verticals.
    const o = offset.current;
    const tx = aim.current.x * PARALLAX_M;
    const ty = aim.current.y * PARALLAX_M;
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * DAMPING);
    o.x += (tx - o.x) * k;
    o.y += (ty - o.y) * k;
    cam.position.copy(rest.current).addScaledVector(right.current, o.x).addScaledVector(UP, o.y);
    if (Math.abs(tx - o.x) > 1e-4 || Math.abs(ty - o.y) > 1e-4) {
      if (onScreen.current) invalidate();
    } else {
      o.x = tx;
      o.y = ty;
    }
  });

  return (
    <>
      <color attach="background" args={[OBSIDIAN]} />
      <primitive object={loaded.model} />
      {baked && <Shaft gate={shaftGate} />}
      {loaded.lut && <Grade lut={loaded.lut} veil={loaded.veil} weight={veilWeight} airWeight={shaftGate} win={gradeWindow} />}

      {/* TEMPORARY rig (ruling E): a warm hemisphere and one "oculus" key from almost straight above, aimed
          at the desk. With a bake it drops to a faint, shadowless fill that only reaches the meshes without a
          lightmap (the baked ones are unlit MeshBasicMaterial); without one it is the whole lighting. */}
      <hemisphereLight args={["#f2d8b0", "#2a2118", baked ? FILL_HEMI : 0.8]} />
      <primitive object={deskTarget} position={DESK} />
      <directionalLight
        ref={sun}
        target={deskTarget}
        position={[DESK.x + 0.6, 22, DESK.z - 0.4]}
        color="#fff0d8"
        intensity={baked ? FILL_KEY : 3}
        castShadow={tier === "high" && !baked}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
    </>
  );
}

/* ---------------------------------------------------------------- canvas */

class Guard extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ChamberScene({ base, tier, onReady, onFail }: Props) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  // Load before creating a WebGL context: a missing model never costs a context.
  useEffect(() => {
    let gone = false;
    loadChamber(base).then((r) => {
      if (gone) {
        if (r) {
          dispose(r.model);
          r.env?.dispose();
          r.lut?.dispose();
          r.veil?.dispose();
        }
      } else if (r) setLoaded(r);
      else onFail();
    });
    return () => {
      gone = true;
    };
  }, [base, onFail]);

  useEffect(() => () => {
    if (loaded) {
      dispose(loaded.model);
      loaded.env?.dispose();
      loaded.lut?.dispose();
      loaded.veil?.dispose();
    }
  }, [loaded]);

  if (!loaded) return null;
  return (
    <Guard onFail={onFail}>
      <Canvas
        frameloop="demand"
        dpr={tier === "high" ? [1, HIGH_DPR_MAX] : 1}
        shadows={tier === "high" ? "percentage" : false /* PCFSoftShadowMap was removed in three r18x */}
        camera={{ manual: true, near: 0.05, far: 250 }}
        gl={{ antialias: !loaded.lut /* with the grade, its scene target carries the MSAA */, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          // Used only without the LUT: three's AgX, a different curve from Blender's and without Punchy.
          gl.toneMapping = THREE.AgXToneMapping;
          gl.toneMappingExposure = EXPOSURE;
        }}
        aria-hidden
      >
        <Chamber loaded={loaded} tier={tier} onReady={onReady} onFail={onFail} />
      </Canvas>
    </Guard>
  );
}
