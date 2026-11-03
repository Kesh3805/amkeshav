/*
  The hero shot, shared by the Cycles poster and the WebGL chamber.

  The Cycles camera is level (pitch 0) with vertical lens shift, so verticals stay vertical. Three has no
  lens shift; the same frustum comes from `setViewOffset` over a virtual "full frame" the size of the
  poster, cropped exactly like the poster's CSS `object-fit: cover` crop. Pure math, no three import, so
  it is testable in node.
*/

export type Vec3 = [number, number, number];
export type SensorFit = "HORIZONTAL" | "VERTICAL" | "AUTO";

export type Shot = {
  /** Three (glTF) space: +Y up. */
  position: Vec3;
  direction: Vec3;
  /** Vertical field of view in degrees, unshifted, at the frame's aspect. */
  fovV: number;
  /** The rendered frame (the poster) in pixels; only its aspect matters. */
  frame: { width: number; height: number };
  /** Blender lens shift, in units of the sensor-fit dimension. */
  shiftX: number;
  shiftY: number;
  sensorFit: SensorFit;
};

export type View = {
  aspect: number;
  fov: number;
  fullWidth: number;
  fullHeight: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

/** hero-poster.webp is 1920×1080. */
export const POSTER_FRAME = { width: 1920, height: 1080 } as const;

/*
  Must mirror Unwritten.module.css: `object-position: 0% 50%` by default, `56% 50%` under this query.
  The WebGL frame has to crop where the poster crops, or the handoff jumps.
*/
export const NARROW_QUERY = "(max-width: 720px), (max-aspect-ratio: 1/1)";
export const anchorFor = (narrow: boolean) => (narrow ? { x: 0.56, y: 0.5 } : { x: 0, y: 0.5 });

const DEG = 180 / Math.PI;

const num = (v: unknown): number | undefined => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const vec3 = (v: unknown): Vec3 | undefined => {
  if (Array.isArray(v) && v.length >= 3) {
    const [x, y, z] = v.map(num);
    return x !== undefined && y !== undefined && z !== undefined ? [x, y, z] : undefined;
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const [x, y, z] = [num(o.x), num(o.y), num(o.z)];
    return x !== undefined && y !== undefined && z !== undefined ? [x, y, z] : undefined;
  }
  return undefined;
};

const first = (o: Record<string, unknown>, ...keys: string[]) => {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Blender (+Z up, −Y forward-ish) → glTF/three (+Y up). */
export const zUpToYUp = ([x, y, z]: Vec3): Vec3 => [x, z, -y];

const len = (v: Vec3) => Math.hypot(v[0], v[1], v[2]);

function isZUp(o: Record<string, unknown>, dir: Vec3): boolean {
  const up = first(o, "up_axis", "up", "space", "coords", "coordinate_system", "axes");
  const upVec = vec3(up);
  if (upVec) return Math.abs(upVec[2]) > Math.abs(upVec[1]);
  if (typeof up === "string") {
    const s = up.toLowerCase();
    if (s.includes("blender")) return true;
    if (/gltf|three|webgl|y[-_ ]?up|^\+?y$/.test(s)) return false;
    if (/z[-_ ]?up|^\+?z$/.test(s)) return true;
  }
  // No declaration: the camera is level, so whichever up axis has no component is the up axis.
  const l = len(dir);
  return Math.abs(dir[2]) < 1e-4 * l && Math.abs(dir[1]) > 1e-4 * l;
}

function parseFit(v: unknown): SensorFit {
  const s = typeof v === "string" ? v.toUpperCase() : "";
  return s === "HORIZONTAL" || s === "VERTICAL" ? s : "AUTO";
}

function parseFrame(o: Record<string, unknown>): { width: number; height: number } {
  const res = first(o, "resolution", "frame", "size");
  let w: number | undefined;
  let h: number | undefined;
  if (Array.isArray(res)) [w, h] = [num(res[0]), num(res[1])];
  else if (isRecord(res)) [w, h] = [num(first(res, "width", "x", "w")), num(first(res, "height", "y", "h"))];
  w ??= num(o.resolution_x);
  h ??= num(o.resolution_y);
  if (w && h && w > 0 && h > 0) return { width: w, height: h };
  const aspect = num(first(o, "aspect", "aspect_ratio", "aspectRatio"));
  if (aspect && aspect > 0) return { width: POSTER_FRAME.width, height: POSTER_FRAME.width / aspect };
  return { ...POSTER_FRAME };
}

/** Is the sensor's fitted dimension the frame's width? */
const fitsWidth = (fit: SensorFit, frame: { width: number; height: number }) =>
  fit === "HORIZONTAL" || (fit === "AUTO" && frame.width >= frame.height);

/**
 * Tolerant parser for chamber-camera.json. Accepts `{position, direction | target, fov_v_deg | fov_h_deg |
 * lens(+sensor_width), shift_y, shift_x, sensor_fit, resolution | aspect, up_axis}`, optionally wrapped in
 * `{camera}` or `{cameras: {HERO | CAM_HERO}}`, in Blender (+Z up) or glTF (+Y up) space. Null if unusable.
 */
export function parseShot(raw: unknown): Shot | null {
  if (!isRecord(raw)) return null;
  let o: Record<string, unknown> = raw;
  if (isRecord(raw.camera)) o = raw.camera;
  else if (isRecord(raw.cameras)) {
    const c = raw.cameras.HERO ?? raw.cameras.CAM_HERO;
    if (isRecord(c)) o = c;
  }

  const pos = vec3(first(o, "position", "location", "pos", "origin"));
  if (!pos) return null;
  let dir = vec3(first(o, "direction", "dir", "forward", "look"));
  const target = vec3(first(o, "target", "look_at", "lookAt"));
  if (!dir && target) dir = [target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]];
  if (!dir || len(dir) < 1e-9) return null;

  const frame = parseFrame(o);
  const sensorFit = parseFit(first(o, "sensor_fit", "sensorFit"));

  let fovV = num(first(o, "fov_v_deg", "fov_y_deg", "fovy_deg", "vfov_deg", "fov_deg", "fov"));
  const yfovRad = num(first(o, "yfov", "fov_v_rad"));
  if (fovV === undefined && yfovRad !== undefined) fovV = yfovRad * DEG;
  const toV = (hDeg: number) => 2 * Math.atan(Math.tan(hDeg / 2 / DEG) * (frame.height / frame.width)) * DEG;
  if (fovV === undefined) {
    const h = num(first(o, "fov_h_deg", "fov_x_deg", "hfov_deg"));
    if (h !== undefined) fovV = toV(h);
  }
  if (fovV === undefined) {
    const lens = num(first(o, "lens", "lens_mm", "focal_length"));
    const sensor = num(first(o, "sensor_width", "sensor_width_mm", "sensor")) ?? 36;
    if (lens && lens > 0) {
      const fitted = 2 * Math.atan(sensor / 2 / lens) * DEG;
      fovV = fitsWidth(sensorFit, frame) ? toV(fitted) : fitted;
    }
  }
  if (fovV === undefined || !(fovV > 1 && fovV < 179)) return null;

  const zUp = isZUp(o, dir);
  return {
    position: zUp ? zUpToYUp(pos) : pos,
    direction: zUp ? zUpToYUp(dir) : dir,
    fovV,
    frame,
    shiftX: num(first(o, "shift_x", "shiftX")) ?? 0,
    shiftY: num(first(o, "shift_y", "shiftY")) ?? 0,
    sensorFit,
  };
}

/**
 * The projection for a `width`×`height` viewport: the shot's full frame scaled to cover the viewport,
 * cropped at `anchor` (CSS object-position fractions), then moved by the lens shift. Feed it to
 * `camera.aspect`, `camera.fov` and `camera.setViewOffset`.
 */
export function frameView(shot: Shot, width: number, height: number, anchor: { x: number; y: number }): View {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const { width: fw, height: fh } = shot.frame;
  const scale = Math.max(w / fw, h / fh);
  const fullWidth = fw * scale;
  const fullHeight = fh * scale;
  // Blender expresses shift in units of the fitted sensor dimension; positive Y moves the window up.
  const fitted = fitsWidth(shot.sensorFit, shot.frame) ? fullWidth : fullHeight;
  return {
    aspect: fw / fh,
    fov: shot.fovV,
    fullWidth,
    fullHeight,
    offsetX: (fullWidth - w) * anchor.x + shot.shiftX * fitted,
    offsetY: (fullHeight - h) * anchor.y - shot.shiftY * fitted,
    width: w,
    height: h,
  };
}

/** The closed FRONTIER volume on the reading desk, as fractions of the poster frame; about 30 px wide. */
export const FRONTIER_BOOK = { x: 0.4755, y: 0.827, width: 30 } as const;

/**
 * Where a point of the poster (fractions of its frame) lands in a `width`×`height` box covered by the
 * poster at `anchor` (CSS object-position fractions), and how many screen px one poster px becomes.
 */
export function posterPoint(fx: number, fy: number, width: number, height: number, anchor: { x: number; y: number }) {
  const { width: fw, height: fh } = POSTER_FRAME;
  const scale = Math.max(width / fw, height / fh);
  return {
    x: fx * fw * scale - (fw * scale - width) * anchor.x,
    y: fy * fh * scale - (fh * scale - height) * anchor.y,
    scale,
  };
}
