# The Threshold veil for the WebGL chamber: what the web scene cannot carry at the poster's viewpoint (the
# haze's in-scatter along each view ray, glossy reflections, anything the diffuse bake misses), measured as
#     residual = master (Cycles, scene-linear) − web (three, scene-linear, shaft off)
# low-passed so parallax and edge mis-registration never show, and written as a Radiance HDR on the poster's
# frame (top row first). ChamberScene adds it before the view transform at the Threshold only.
#   1. pnpm dev, then: node scripts/unwritten/dump.mjs <web.bin>   (?dump: 960×540 float32 RGB, rows bottom-up)
#   2. blender -b -P art/unwritten/veil.py -- <master.exr> <web.bin> <out.hdr> [SIZE=240]   (VEIL_CAP=0.2)
# Negative residual (the web brighter than the master) is dropped: RGBE has no sign, and an additive veil
# only ever adds light. The report says how much was dropped.
import sys
import numpy as np
import bpy

args = sys.argv[sys.argv.index("--") + 1:]
exr, web_bin, out = args[:3]
W = int(args[3]) if len(args) > 3 else 240
H = W * 9 // 16

im = bpy.data.images.load(exr)
mw, mh = im.size
m = np.empty(mw * mh * 4, np.float32)
im.pixels.foreach_get(m)
master = m.reshape(mh, mw, 4)[..., :3]  # rows bottom-up, like the dump
web = np.fromfile(web_bin, np.float32).reshape(540, 960, 3)


def box(a, w, h):
    """Area-average down to h × w (integer factors)."""
    fy, fx = a.shape[0] // h, a.shape[1] // w
    return a[: h * fy, : w * fx].reshape(h, fy, w, fx, 3).mean(axis=(1, 3))


def blur(a, r=2):
    """Separable box blur, three times (≈ Gaussian, round rather than square), edges clamped."""
    for _ in range(3):
        for ax in (0, 1):
            p = np.pad(a, [(r, r) if i == ax else (0, 0) for i in range(3)], mode="edge")
            c = np.cumsum(p, axis=ax, dtype=np.float64)
            c = np.concatenate([np.zeros_like(np.take(c, [0], axis=ax)), c], axis=ax)
            n = a.shape[ax]
            a = ((np.take(c, range(2 * r + 1, 2 * r + 1 + n), axis=ax) - np.take(c, range(0, n), axis=ax)) / (2 * r + 1)).astype(np.float32)
    return a


CAP = float(__import__("os").environ.get("VEIL_CAP", "0.2"))  # linear luminance; compact sources (lamps) stay sharp in the scene, not smeared into the veil
res = box(master, W, H) - box(web, W, H)
l = res @ np.array([0.2126, 0.7152, 0.0722], np.float32)
res *= np.minimum(1.0, CAP / np.maximum(l, 1e-6))[..., None]
res = blur(res)
pos = np.maximum(res, 0)
lum = lambda a: a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
print(f"VEIL {W}x{H}: master mean {lum(box(master, W, H)).mean():.4f}, web mean {lum(box(web, W, H)).mean():.4f}, "
      f"veil mean {lum(pos).mean():.4f}, dropped negative {lum(np.minimum(res, 0)).mean():.4f}")
for name, (x0, y0, x1, y1) in {"pool": (.38, .05, .62, .30), "desk": (.42, .14, .58, .28), "shelvesL": (.05, .40, .30, .75), "dome": (.30, .80, .70, 1.0)}.items():
    sl = (slice(int(y0 * H), int(y1 * H)), slice(int(x0 * W), int(x1 * W)))  # y measured from the bottom
    print(f"  {name:9s} master {lum(box(master, W, H)[sl]).mean():.4f}  web {lum(box(web, W, H)[sl]).mean():.4f}  veil {lum(pos[sl]).mean():.4f}")

# Radiance RGBE, top row first, flat (uncompressed) scanlines.
v = pos[::-1]
mx = v.max(axis=-1)
e = np.ceil(np.log2(np.maximum(mx, 1e-32))).astype(np.int32)
scale = np.where(mx > 1e-32, 256.0 / np.exp2(e), 0)
rgbe = np.zeros((H, W, 4), np.uint8)
rgbe[..., :3] = np.clip(v * scale[..., None], 0, 255).astype(np.uint8)
rgbe[..., 3] = np.where(mx > 1e-32, e + 128, 0).astype(np.uint8)
with open(out, "wb") as f:
    f.write(b"#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n" + f"-Y {H} +X {W}\n".encode() + rgbe.tobytes())
print("WROTE", out)
