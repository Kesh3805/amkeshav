"use client";

/* eslint-disable react-hooks/immutability -- the camera, lights and probe state are three.js objects and refs mutated from effects and the R3F frame loop, outside React render; that is the intended pattern. */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { anchorFor, frameView, NARROW_QUERY, parseShot, POSTER_FRAME, type SensorFit, type Shot } from "./chamberCamera";
import { FRAME_BUDGET_MS, HIGH_DPR_MAX, type SceneTier } from "./quality";

type Props = { base: string; tier: SceneTier; onReady: () => void; onFail: () => void };
/** `lightmapped`: meshes that carry a baked lightmap (0 for a GLB exported without BAKE=1). `env`: the
    reflection probe, or null if chamber-env.hdr is missing. */
type Loaded = { model: THREE.Group; shot: Shot; lightmapped: number; env: THREE.DataTexture | null };

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

const OBSIDIAN = "#141512";
/** The reading desk, in three space (Blender (0, −1.45, 0.92) with Z up). */
const DESK = new THREE.Vector3(0, 0.92, 1.45);
const UP = new THREE.Vector3(0, 1, 0);

/* ---------------------------------------------------------------- loading */

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
    const [gltf, jsonShot, env] = await Promise.all([
      loader.loadAsync(`${base}/unwritten/chamber.glb`),
      fetchShot(`${base}/unwritten/chamber-camera.json`),
      // The reflection probe (ruling E): an equirect of the frozen lighting from just above the desk
      // (chamber.py CAMS=PANO). Optional: without it the metals keep the fill only.
      new HDRLoader().loadAsync(`${base}/unwritten/chamber-env.hdr`).catch(() => null),
    ]);
    const shot = jsonShot ?? shotFromGltf(gltf);
    if (!shot) {
      dispose(gltf.scene);
      env?.dispose();
      return null;
    }
    // Lighting is the bake plus the rig below; drop any punctual lights the exporter wrote so the look
    // stays deterministic.
    const exported: THREE.Object3D[] = [];
    gltf.scene.traverse((o) => {
      if (o instanceof THREE.Light) exported.push(o);
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    for (const l of exported) l.removeFromParent();
    const lightmapped = await applyLightmaps(gltf.scene, base);
    return { model: gltf.scene, shot, lightmapped, env };
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

function Shaft() {
  const { mesh, material } = useMemo(() => {
    const axis = new THREE.Vector3().subVectors(POOL, OCULUS);
    const length = axis.length();
    const geometry = new THREE.CylinderGeometry(SHAFT_RADIUS, SHAFT_RADIUS_FLOOR, length, 64, 1, true) // top = the oculus end;
    const material = new THREE.ShaderMaterial({
      uniforms: { color: { value: SHAFT_COLOR }, strength: { value: SHAFT_STRENGTH }, top: { value: OCULUS.y } },
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
        uniform vec3 color; uniform float strength; uniform float top;
        varying vec3 vN; varying vec3 vV; varying float vY;
        void main() {
          float facing = abs(dot(normalize(vN), normalize(vV)));      // 1 on the axis, 0 at the rim
          float path = pow(facing, 2.5);                               // √(1 − x²), steepened: a penumbra, not a wall
          float h = clamp(vY / top, 0.0, 1.0);
          float air = mix(1.0, 0.25, h * h) * smoothstep(0.0, 0.6, vY); // height-thinned; no seam at the floor
          gl_FragColor = vec4(color * strength * path * air, 1.0);
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
    mesh.position.copy(OCULUS).addScaledVector(axis, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, axis.clone().normalize().negate());
    mesh.renderOrder = 10;
    return { mesh, material };
  }, []);
  useEffect(() => () => {
    mesh.geometry.dispose();
    material.dispose();
  }, [mesh, material]);
  return <primitive object={mesh} />;
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

  // Place the camera and reproduce the poster's crop and lens shift. Runs again on resize.
  useEffect(() => {
    const { shot } = loaded;
    rest.current.fromArray(shot.position);
    cam.position.copy(rest.current);
    cam.up.copy(UP);
    cam.lookAt(new THREE.Vector3().fromArray(shot.direction).add(rest.current));
    right.current.set(1, 0, 0).applyQuaternion(cam.quaternion);
    cam.near = 0.05;
    cam.far = 250;
    const v = frameView(shot, size.width, size.height, anchorFor(narrow));
    cam.aspect = v.aspect;
    cam.fov = v.fov;
    cam.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height);
    invalidate();
  }, [loaded, cam, size.width, size.height, narrow, invalidate]);

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
      {baked && <Shaft />}

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
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.AgXToneMapping;
          gl.toneMappingExposure = 2 ** -0.3; // the master's EV −0.3 (hero-006, AgX in Blender)
        }}
        aria-hidden
      >
        <Chamber loaded={loaded} tier={tier} onReady={onReady} onFail={onFail} />
      </Canvas>
    </Guard>
  );
}
