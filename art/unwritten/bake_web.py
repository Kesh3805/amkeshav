# THE UNWRITTEN — Chamber 001 web lightmaps: Cycles DIFFUSE (direct + indirect, no colour) on UV1.
#
# Used by export_web.py when BAKE=1 (it imports this module after batching + UVs, before flattening):
#   BAKE=1 blender -b <dir>/chamber.blend -P art/unwritten/export_web.py -- <out.glb>
# or, the same thing, run this file as the script (it sets BAKE=1 and runs export_web.py):
#   blender -b <dir>/chamber.blend -P art/unwritten/bake_web.py -- <out.glb>
#
# Env:
#   LM_MAX      largest lightmap side in px (default 1024). Each mesh gets LM_MAX·sqrt(area / largest area),
#               rounded to a power of two, clamped to [min(64, LM_MAX), LM_MAX].
#   LM_SAMPLES  Cycles samples for the bake (default 64). CPU only.
#   LM_EV       encode exposure in stops (see below), for every map. Unset = auto, PER MAP: the LM_PCT
#               (default 97: a few sky-facing faces must not set a whole map's exposure) percentile of the map's brightest channel lands on code 1.0 (rounded down to
#               a 1/4 stop); each node's lightmap_ev carries its own EV.
#   LM_HAZE     1 keeps the volume-only objects (haze) visible during the bake; default hides them (slow on
#               CPU, and the shafts belong in the air, not on the surfaces).
#
# What is baked: Cycles DIFFUSE with pass_filter {DIRECT, INDIRECT} and no COLOR, i.e. the diffuse lighting
# D such that Cycles' diffuse radiance = albedo · D. The scene's real lights, emissive bulbs and world
# light it; the original (pre-batch) objects and the click proxy are hidden so nothing is doubled.
# Metals, transmissive glass and emitters are not baked (their diffuse pass is zero / meaningless); the web
# gives them the faint fill instead.
#
# Encode (8-bit RGB PNG, no gAMA/iCCP chunk), per channel, L = the linear bake value:
#     v = sRGB_OETF( clamp(L · 2^EV, 0, 1) )          sRGB_OETF(x) = 12.92·x            if x ≤ 0.0031308
#                                                                    1.055·x^(1/2.4) − 0.055 otherwise
# Decode in three: texture.colorSpace = SRGBColorSpace (the GPU applies the inverse, before filtering), then
#     L = decoded · 2^−EV,   and since three's lightMap is irradiance (shaded as albedo · E / π):
#     material.lightMapIntensity = π · 2^−EV
# The sRGB curve is the "log-ish" part: ~0.4 % steps across the mid-tones, ~12 stops above code 1, so no
# shader patch is needed. Anything brighter than 2^−EV clips (auto EV clips the top 0.5 %).
#
# glTF carriage (approach (a)): the exporter cannot express lightMap, so every baked node gets custom
# properties → glTF node extras → three Object3D.userData:
#     lightmap     "lightmaps/<node>.png", relative to the GLB
#     lightmap_ev  EV (float)
# UV1 is the "lightmap" UV layer = TEXCOORD_1 = three's `uv1` (texture.channel = 1). PNGs are written next
# to the GLB in lightmaps/.
import bpy, math, os, re, struct, sys, zlib
import numpy as np

LM_PAD_PX = 4  # bake margin and island gap, in pixels of each mesh's own lightmap
LM_MIN = 64


def env_f(name, default):
    v = os.environ.get(name, "").strip()
    return float(v) if v else default


LM_PCT = env_f("LM_PCT", 97.0)  # per-map auto EV: this percentile of the brightest channel lands on code 1.0
LM_BLUR = env_f("LM_BLUR", 1.0)  # masked blur radius in px (two box passes), 0 = off


def sizes(objs):
    """{object name: lightmap side in px}, by world surface area (objects are already in world space)."""
    lm_max = int(env_f("LM_MAX", 1024))
    lo = min(LM_MIN, lm_max)
    area = {o.name: sum(p.area for p in o.data.polygons) for o in objs}
    top = max(area.values(), default=0.0) or 1.0
    out = {}
    for n, a in area.items():
        # The desk, the folio and the floor carry the frame's focus: more texels than their area earns.
        boost = 4.0 if n.startswith(("DESK", "FOLIO")) else 1.0
        s = lm_max * math.sqrt(max(a, 1e-9) / top) * boost
        if n.startswith(("SHELL__floor", "SHELL__joint")):
            s = lm_max  # planar UV over the whole floor (export_web.planar_lightmap_uv): each map spans 26 m
        out[n] = int(max(lo, min(lm_max, 2 ** round(math.log2(max(s, 1.0))))))
    return out


def island_margin(side, px=LM_PAD_PX):
    """smart_project margin (margin_method FRACTION, i.e. of the UV square) for a `px` gap at `side`."""
    return px / side


def srgb_oetf(x):
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(np.maximum(x, 0.0031308), 1 / 2.4) - 0.055)


def masked_blur(px, r):
    """Denoise a bake: two box passes of radius r over covered texels only (alpha > 0.5), renormalised by the
    blurred coverage, so nothing bleeds in from the empty gutter. Islands are LM_PAD_PX apart, so r ≤ 2 stays
    on its own island almost everywhere."""
    if r <= 0:
        return px
    k = int(round(r))
    m = (px[..., 3] > 0.5).astype(np.float64)
    rgb = px[..., :3].astype(np.float64) * m[..., None]

    def box(a, axis):
        c = np.cumsum(np.pad(a, [(k + 1, k) if i == axis else (0, 0) for i in range(a.ndim)], mode="edge"), axis=axis)
        hi = np.take(c, range(2 * k + 1, c.shape[axis]), axis=axis)
        lo = np.take(c, range(0, c.shape[axis] - 2 * k - 1), axis=axis)
        return (hi - lo) / (2 * k + 1)

    for _ in range(2):
        rgb, m2 = box(box(rgb, 0), 1), box(box(m, 0), 1)
    w = np.maximum(m2, 1e-6)[..., None]
    out = px.copy()
    cov = px[..., 3] > 0.5
    out[..., :3] = np.where(cov[..., None], rgb / w, px[..., :3])
    return out


def write_png(path, rgb8):
    """8-bit RGB PNG; rgb8 is (h, w, 3) uint8 with row 0 at the top. No colour chunks: browsers pass it raw."""
    h, w, _ = rgb8.shape
    raw = b"".join(b"\x00" + rgb8[y].tobytes() for y in range(h))

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    with open(path, "wb") as fh:
        fh.write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
                 + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def bake(objs, side, out_dir, hide=(), rel="lightmaps"):
    """Bake every object in `objs` (single material each, UV layer "lightmap") in ONE Cycles bake call,
    write the PNGs to <out_dir>/<rel>/ and set the `lightmap` / `lightmap_ev` custom properties.
    `side` comes from sizes(); `hide` are objects to take out of the render during the bake."""
    sc = bpy.context.scene
    lm_dir = os.path.join(out_dir, rel)
    os.makedirs(lm_dir, exist_ok=True)
    objs = [o for o in objs if o.data.materials and o.data.materials[0] and "lightmap" in o.data.uv_layers]
    if not objs:
        print("LIGHTMAP nothing to bake")
        return {}

    prev = dict(engine=sc.render.engine, device=sc.cycles.device, samples=sc.cycles.samples,
                hidden=[(o, o.hide_render) for o in hide])
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = int(env_f("LM_SAMPLES", 64))
    for o in hide:
        o.hide_render = True

    # Materials are shared between batches, and Cycles bakes into the active image node of each object's
    # material: give every object a private copy for the duration of the bake.
    jobs = []
    for o in objs:
        s = side[o.name]
        img = bpy.data.images.new(f"LM_{o.name}", s, s, alpha=True, float_buffer=True)
        img.generated_color = (0.0, 0.0, 0.0, 0.0)
        orig = o.data.materials[0]
        tmp = orig.copy()
        o.data.materials[0] = tmp
        nt = tmp.node_tree
        for n in nt.nodes:
            n.select = False
        node = nt.nodes.new("ShaderNodeTexImage")
        node.image = img
        node.select = True
        nt.nodes.active = node
        jobs.append((o, orig, tmp, img))

    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    import time
    t0 = time.time()
    print(f"LIGHTMAP baking {len(objs)} meshes, {sc.cycles.samples} spp, sizes "
          f"{sorted(set(side[o.name] for o in objs))}", flush=True)
    try:
        bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=LM_PAD_PX,
                            margin_type="ADJACENT_FACES", use_clear=True, use_selected_to_active=False,
                            target="IMAGE_TEXTURES", uv_layer="lightmap")
    finally:
        for o, orig, tmp, _ in jobs:
            o.data.materials[0] = orig
            bpy.data.materials.remove(tmp)
        for o, h in prev["hidden"]:
            o.hide_render = h
        sc.render.engine, sc.cycles.device, sc.cycles.samples = prev["engine"], prev["device"], prev["samples"]
    print(f"LIGHTMAP bake {time.time() - t0:.1f}s", flush=True)

    # Linear float results; covered texels (baked + margin) have alpha > 0 (the clear colour is 0, 0, 0, 0).
    data = {}
    for o, _, _, img in jobs:
        s = img.size[0]
        px = np.empty(s * s * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        px = masked_blur(px.reshape(s, s, 4), LM_BLUR)
        data[o.name] = (o, img, px)

    # One EV for every map let the floor's daylight pool set the exposure, and the shelves came out at mean
    # code 2: banding. Each node carries its own lightmap_ev, so each map gets its own auto EV.
    fixed = os.environ.get("LM_EV", "").strip()

    def auto_ev(px):
        peak = px[..., :3].max(axis=2)[px[..., 3] > 0.5]
        p = float(np.percentile(peak, LM_PCT)) if peak.size else 1.0
        return math.floor(-math.log2(max(p, 1e-6)) * 4) / 4

    report = {}
    for name, (o, img, px) in data.items():
        ev = float(fixed) if fixed else auto_ev(px)
        v = srgb_oetf(np.clip(px[..., :3].astype(np.float64) * 2.0 ** ev, 0.0, 1.0))
        rgb8 = np.round(v * 255.0).astype(np.uint8)[::-1]  # Blender rows are bottom-up; PNG is top-down
        fname = re.sub(r"[^A-Za-z0-9_.-]", "_", name) + ".png"
        cov = px[..., 3] > 0.5
        mean = float(rgb8[cov[::-1]].mean()) if cov.any() else 0.0
        bpy.data.images.remove(img)
        if not rgb8.any():
            print(f"LIGHTMAP {name}: all black, not attached", flush=True)
            continue
        write_png(os.path.join(lm_dir, fname), rgb8)
        o["lightmap"] = f"{rel}/{fname}"
        o["lightmap_ev"] = ev
        report[name] = {"ev": ev, "px": rgb8.shape[0], "coverage": round(float(cov.mean()), 3), "mean_code": round(mean, 1),
                        "max_code": int(rgb8.max()),
                        "clipped": round(float((px[..., :3].max(axis=2)[cov] * 2.0 ** ev > 1).mean()) if cov.any() else 0.0, 4)}
        print("LIGHTMAP", name, report[name], flush=True)
    return report


if __name__ == "__main__":  # `blender -b x.blend -P bake_web.py -- out.glb` = BAKE=1 export_web.py
    os.environ["BAKE"] = "1"
    here = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(here, "export_web.py")
    with open(path) as fh:
        exec(compile(fh.read(), path, "exec"), {"__name__": "__main__", "__file__": path})
