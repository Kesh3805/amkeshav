# The off-Threshold air, judged: the Cycles master at the web's Desk stance (chamber.py CAMS=WEB_DESK EXR=1)
# against the WebGL frame there (scripts/unwritten/desk.mjs: scene-linear with the shaft and the air term, plus the
# view distance in a fourth channel). Both go through Blender's own view (AgX, look Punchy, EV −0.3), so
# region errors are display codes, like the Threshold handoff; and the light the web still lacks (master −
# web without its air) is binned by view distance against ChamberScene's AIR · (1 − e^(−d / AIR_LENGTH)).
#   [STANCE=desk|book] blender -b -P art/unwritten/airfit.py -- <master.exr> <web.bin> <out dir> [AIR_R,AIR_G,AIR_B] [AIR_LENGTH]
#   Blender wants absolute paths here.
import os
import sys
import numpy as np
import bpy

args = sys.argv[sys.argv.index("--") + 1:]
exr, web_bin, out = args[:3]
AIR = np.array([float(v) for v in (args[3] if len(args) > 3 else "0.066,0.06,0.052").split(",")], np.float32)
AIR_LENGTH = float(args[4]) if len(args) > 4 else 12.0
LUM = np.array([0.2126, 0.7152, 0.0722], np.float32)

im = bpy.data.images.load(exr)
mw, mh = im.size
m = np.empty(mw * mh * 4, np.float32)
im.pixels.foreach_get(m)
master = m.reshape(mh, mw, 4)[..., :3]  # rows bottom-up
w4 = np.fromfile(web_bin, np.float32).reshape(540, 960, 4)
web, dist = w4[..., :3], w4[..., 3]
assert master.shape == web.shape, (master.shape, web.shape)
air_now = AIR * (1 - np.exp(-dist / AIR_LENGTH))[..., None]
bare = web - air_now  # the web without its air term (shaft kept)

sc = bpy.context.scene
sc.display_settings.display_device = "sRGB"
sc.view_settings.view_transform, sc.view_settings.look, sc.view_settings.exposure = "AgX", "AgX - Punchy", -0.3
sc.render.image_settings.file_format, sc.render.image_settings.color_depth = "PNG", "8"


def view(lin, name):
    """Blender's view transform on a scene-linear frame -> 8-bit display codes (rows bottom-up)."""
    h, w = lin.shape[:2]
    img = bpy.data.images.new(name, w, h, float_buffer=True, alpha=True)
    px = np.concatenate([lin, np.ones((h, w, 1), np.float32)], axis=-1)
    img.pixels.foreach_set(px.ravel())
    path = os.path.join(out, f"{name}.png")
    img.save_render(path, scene=sc)
    back = bpy.data.images.load(path)
    b = np.empty(w * h * 4, np.float32)
    back.pixels.foreach_get(b)
    return b.reshape(h, w, 4)[..., :3] * 255.0


cm, cw, cb = view(master, "airfit-master"), view(web, "airfit-web"), view(bare, "airfit-web-noair")
print(f"FRAME mean |master − web| {np.abs(cm - cw).mean():.1f} codes (without air {np.abs(cm - cb).mean():.1f})")

# Regions per stance (STANCE=desk|book; fractions, x from the left, y from the BOTTOM, like veil.py).
REGIONS = {
    "desk": {
        "shelves back": (0.36, 0.60, 0.86, 0.97),
        "shelves left": (0.02, 0.60, 0.30, 0.97),
        "floor far": (0.04, 0.47, 0.30, 0.53),
        "blotter": (0.30, 0.35, 0.47, 0.41),
        "book": (0.50, 0.38, 0.58, 0.43),
        "desk apron": (0.30, 0.22, 0.70, 0.27),
        "pool": (0.45, 0.02, 0.75, 0.18),
    },
    "book": {
        "cover": (0.40, 0.50, 0.62, 0.62),
        "page edge": (0.33, 0.25, 0.56, 0.36),
        "blotter R": (0.76, 0.18, 0.96, 0.44),
        "blotter L": (0.04, 0.10, 0.22, 0.40),
        "floor back": (0.40, 0.87, 0.80, 0.98),
    },
}[os.environ.get("STANCE", "desk")]
H, W = master.shape[:2]
print(f"{'region':13s} {'dist m':>6s} {'master':>7s} {'web':>7s} {'no air':>7s}   codes: {'master':>6s} {'web':>6s} {'Δ':>6s} {'Δ no air':>8s}")
for name, (x0, y0, x1, y1) in REGIONS.items():
    sl = (slice(int(y0 * H), int(y1 * H)), slice(int(x0 * W), int(x1 * W)))
    L = lambda a: float((a[sl] @ LUM).mean())
    C = lambda a: float(a[sl].mean())
    print(f"{name:13s} {float(np.median(dist[sl])):6.1f} {L(master):7.4f} {L(web):7.4f} {L(bare):7.4f}   "
          f"{C(cm):6.1f} {C(cw):6.1f} {C(cw) - C(cm):+6.1f} {C(cb) - C(cm):+8.1f}")

# The light the web still lacks, by view distance: (master − bare web), median per bin, vs the air model.
need = (master - bare) @ LUM
print(f"\n{'dist m':>8s} {'px %':>5s} {'needed':>8s} {'model':>8s}  (linear luminance, median)")
for lo, hi in ((0, 2), (2, 3), (3, 4), (4, 6), (6, 8), (8, 10), (10, 12), (12, 15), (15, 20), (20, 40), (40, 250)):
    sel = (dist >= lo) & (dist < hi)
    if sel.sum() < 200:
        continue
    model = float(AIR @ LUM) * (1 - np.exp(-((lo + hi) / 2) / AIR_LENGTH))
    print(f"{lo:3d}–{hi:<4d} {100 * sel.mean():5.1f} {float(np.median(need[sel])):8.4f} {model:8.4f}")

# Fit: per-channel A and one length L minimising |need − A·(1 − e^(−d/L))| over the frame, leaving out
# compact sources (lamps, the sky), the pool and anything the bake already overshoots.
need_rgb = master - bare
ok = (dist < 200) & ((master @ LUM) < 0.6) & ((need_rgb @ LUM) > -0.05)
best = None
for L in (0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0, 12.0):
    f = (1 - np.exp(-dist[ok] / L))[:, None]
    A = np.clip((f * need_rgb[ok]).sum(0) / (f * f).sum(), 0, None)
    err = float(np.abs((need_rgb[ok] - f * A) @ LUM).mean())
    print(f"FIT L {L:5.2f}  A {A.round(4)}  mean |residual| {err:.4f}")
    if best is None or err < best[0]:
        best = (err, L, A)
print(f"BEST L {best[1]}  A {best[2].round(4)}")
