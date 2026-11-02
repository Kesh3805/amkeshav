# Photographic finish for Cycles stills: optical vignetting, lateral chromatic aberration toward the
# corners, and luminance-weighted grain, so a frame reads as a lens image rather than a clean render.
#   python art/unwritten/finish.py <in.png> <out.png> [strength=1.0]
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
k = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
img = np.asarray(Image.open(src).convert("RGB"), dtype=np.float32) / 255.0
h, w, _ = img.shape
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
cx, cy = (w - 1) / 2, (h - 1) / 2
nx, ny = (xx - cx) / cx, (yy - cy) / cy
r2 = (nx * nx * (w / h) ** 2 + ny * ny) / ((w / h) ** 2 + 1)  # 0 at centre, 1 at the corners


def sample(channel, scale):
    """Resample one channel radially about the centre (nearest neighbour is enough at < 2 px)."""
    sx = np.clip(cx + (xx - cx) * scale, 0, w - 1).astype(np.int32)
    sy = np.clip(cy + (yy - cy) * scale, 0, h - 1).astype(np.int32)
    return channel[sy, sx]


ca = 0.0016 * k  # ~1.5 px of red/blue separation in the corners of a 1920 frame
out = np.stack([sample(img[..., 0], 1 + ca), img[..., 1], sample(img[..., 2], 1 - ca)], axis=-1)
out *= (1.0 - 0.38 * k * r2 ** 1.4)[..., None]  # cos⁴-like falloff, gentle in the middle
rng = np.random.default_rng(1102)
lum = out.mean(axis=-1, keepdims=True)
grain = rng.normal(0.0, 1.0, (h, w, 1)).astype(np.float32)
out += grain * (0.012 * k) * (0.35 + 0.65 * (1 - lum))  # grain shows most in the shadows, like film
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(dst)
print("WROTE", dst)
