# Leather grain for the web: the scan's luminance swing and normal map, which the exporter flattens away
# (export_web.py: one base colour per material). Only the two leathers the Book stance sees at 1.2–1.4 m.
#   python art/unwritten/detail_web.py        (needs art/textures/, from art/textures/fetch.py)
# Writes public/unwritten/detail/:
#   <material>.jpg       albedo detail, LINEAR, stored as ratio / 2 (the web doubles the base colour): the
#                        kit's recipe 1 + contrast·(bw / mean − 1), weighted by (1 − keep), normalised to a
#                        mean of exactly 1 so region brightness does not move
#   <asset>-normal.jpg   the scan's OpenGL normal map, downsized
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
TEX = os.path.join(ROOT, "art", "textures")
OUT = os.path.join(ROOT, "public", "unwritten", "detail")
SIZE = 512
# chamber.py: kit.pbr(name, asset, tile, ..., keep, contrast)
MATERIALS = {
    "folio_oxide": ("brown_leather", 0.05, 1.0),
    "desk_leather": ("brown_leather", 0.08, 1.15),
}


def linear(srgb):
    return np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)


os.makedirs(OUT, exist_ok=True)
for name, (asset, keep, contrast) in MATERIALS.items():
    diff = np.asarray(Image.open(os.path.join(TEX, asset, "diff.jpg")).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)) / 255.0
    bw = linear(diff) @ np.array([0.2126, 0.7152, 0.0722])
    ratio = 1.0 + (1.0 - keep) * contrast * (bw / bw.mean() - 1.0)
    ratio = np.clip(ratio / ratio.mean(), 0.0, 2.0)
    Image.fromarray(np.round(ratio / 2 * 255).astype(np.uint8), "L").save(os.path.join(OUT, f"{name}.jpg"), quality=90)
    print(f"DETAIL {name}: ratio p5 {np.percentile(ratio, 5):.2f} p95 {np.percentile(ratio, 95):.2f}")
for asset in sorted({a for a, _, _ in MATERIALS.values()}):
    nor = Image.open(os.path.join(TEX, asset, "nor_gl.jpg")).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    nor.save(os.path.join(OUT, f"{asset}-normal.jpg"), quality=92)
    print(f"NORMAL {asset}")
