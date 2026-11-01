import * as THREE from "three";

/*
  A 2.5D camera over a rendered plate. Each pixel's nearness (from a ray-cast depth map) decides how
  fast it moves when the virtual camera dollies, so near surfaces sweep past and the far end barely
  moves — parallax rather than a flat zoom. The inverse mapping is solved with a few fixed-point
  steps so occluding edges stay put instead of smearing.
*/

export type ShotState = {
  zoom: number; // 2D zoom about the focal point
  dolly: number; // depth-weighted push toward the focal point
  shiftX: number; // camera slide, scaled by nearness
  shiftY: number;
  exposure: number; // >1 blooms toward warm white
  opacity: number;
  focalX: number; // focal point in image UV, origin top-left
  focalY: number;
  // Light with a visible source: a warm disc of radius glowR (in screen heights) around glowX/Y.
  glow: number;
  glowR: number;
  glowX: number;
  glowY: number;
  // Reveal mask around maskX/Y: mode 1 shows the plate outside maskR, -1 inside it, 0 everywhere.
  mask: number;
  maskR: number;
  maskX: number;
  maskY: number;
};

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform sampler2D uDepth;
  uniform vec2 uCover;     // scale applied to UVs so the 16:9 plate covers the viewport
  uniform vec2 uFocal;
  uniform float uZoom;
  uniform float uDolly;
  uniform vec2 uShift;
  uniform float uExposure;
  uniform float uOpacity;
  uniform float uAspect;   // viewport width / height
  uniform vec3 uGlow;      // strength, radius, unused
  uniform vec2 uGlowC;
  uniform vec3 uMask;      // mode, radius, unused
  uniform vec2 uMaskC;

  float dist(vec2 a, vec2 b) {
    vec2 d = a - b;
    d.x *= uAspect;
    return length(d);
  }

  void main() {
    vec2 uv = (vUv - 0.5) * uCover + 0.5;
    vec2 f = vec2(uFocal.x, 1.0 - uFocal.y);
    vec2 p = uv;
    for (int i = 0; i < 6; i++) {
      float n = texture2D(uDepth, p).r;
      float s = uZoom * (1.0 + uDolly * n * n);
      p = f + (uv - f) / s - uShift * n;
    }
    p = clamp(p, 0.0005, 0.9995);
    vec3 col = texture2D(uTex, p).rgb;
    // Exposure past 1 rolls toward a warm white: light is the passage between scenes.
    float e = max(uExposure - 1.0, 0.0);
    col = col * min(uExposure, 1.0) + vec3(1.0, 0.95, 0.88) * (1.0 - exp(-e * 1.4));
    // A whisper of vignette keeps the eye centred.
    vec2 q = vUv - 0.5;
    col *= 1.0 - dot(q, q) * 0.18;

    // Screen position with origin top-left, matching how focal points are written.
    vec2 sp = vec2(vUv.x, 1.0 - vUv.y);
    vec3 warm = vec3(1.0, 0.95, 0.88);
    if (uGlow.x > 0.0) {
      float r = dist(sp, uGlowC) / max(uGlow.y, 0.0001);
      float g = exp(-r * r * 2.2);  // light falls off, it doesn't stop at an edge
      col = mix(col, warm, g * uGlow.x);
    }
    float a = uOpacity;
    if (uMask.x != 0.0) {
      float d = dist(sp, uMaskC);
      float soft = 0.12 + uMask.y * 0.25;
      float inside = 1.0 - smoothstep(uMask.y - soft, uMask.y, d);
      a *= uMask.x > 0.0 ? 1.0 - inside : inside;
    }
    gl_FragColor = vec4(col, a);
  }
`;

export class DepthStage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  layers: { mat: THREE.ShaderMaterial; state: ShotState }[] = [];
  private aspect = 16 / 9;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    // The shader passes the plates' sRGB values through untouched, so no output conversion either.
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  }

  async add(plate: string, depth: string, state: ShotState) {
    const loader = new THREE.TextureLoader();
    const [tex, dep] = await Promise.all([loader.loadAsync(plate), loader.loadAsync(depth)]);
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    dep.colorSpace = THREE.NoColorSpace;
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthTest: false,
      uniforms: {
        uTex: { value: tex },
        uDepth: { value: dep },
        uCover: { value: new THREE.Vector2(1, 1) },
        uFocal: { value: new THREE.Vector2(0.5, 0.5) },
        uZoom: { value: 1 },
        uDolly: { value: 0 },
        uShift: { value: new THREE.Vector2() },
        uExposure: { value: 1 },
        uOpacity: { value: 1 },
        uAspect: { value: 16 / 9 },
        uGlow: { value: new THREE.Vector3() },
        uGlowC: { value: new THREE.Vector2(0.5, 0.5) },
        uMask: { value: new THREE.Vector3() },
        uMaskC: { value: new THREE.Vector2(0.5, 0.5) },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    mesh.renderOrder = this.layers.length;
    this.scene.add(mesh);
    this.layers.push({ mat, state });
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    const view = w / h;
    // "cover": shrink the UV span on the axis that overflows.
    const cover = view > this.aspect ? new THREE.Vector2(1, this.aspect / view) : new THREE.Vector2(view / this.aspect, 1);
    for (const l of this.layers) {
      l.mat.uniforms.uCover.value.copy(cover);
      l.mat.uniforms.uAspect.value = view;
    }
  }

  render() {
    for (const { mat, state } of this.layers) {
      const u = mat.uniforms;
      u.uZoom.value = state.zoom;
      u.uDolly.value = state.dolly;
      u.uShift.value.set(state.shiftX, -state.shiftY);
      u.uExposure.value = state.exposure;
      u.uOpacity.value = state.opacity;
      u.uFocal.value.set(state.focalX, state.focalY);
      u.uGlow.value.set(state.glow, state.glowR, 0);
      u.uGlowC.value.set(state.glowX, state.glowY);
      u.uMask.value.set(state.mask, state.maskR, 0);
      u.uMaskC.value.set(state.maskX, state.maskY);
      (mat as THREE.ShaderMaterial).visible = state.opacity > 0.001;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    for (const { mat } of this.layers) {
      mat.uniforms.uTex.value.dispose();
      mat.uniforms.uDepth.value.dispose();
      mat.dispose();
    }
    this.renderer.dispose();
  }
}
