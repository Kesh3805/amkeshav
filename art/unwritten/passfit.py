# What the web's diffuse bake can and cannot carry at a stance, region by region: the Cycles master's passes
# (chamber.py CAMS=WEB_DESK,WEB_BOOK EXR=1 PASSES=1) against the web frame there (scripts/unwritten/desk.mjs),
# in scene-linear luminance.
#   diffuse = DiffCol · (DiffDir + DiffInd)   what a perfect lightmap reproduces
#   glossy  = GlossCol · (GlossDir + GlossInd)
#   volume  = VolumeDir + VolumeInd            the haze's in-scatter (the web's air term and shaft cone)
#   web     = the web frame minus its air term (the shaft cone stays)
# web / diffuse above 1 on a surface is the diffuse the master loses to its specular layer (Principled is
# energy-conserving; an unlit lightmapped material is not).
#   STANCE=desk|book blender -b -P art/unwritten/passfit.py -- <passes.exr> <web.bin> [AIR_R,AIR_G,AIR_B] [AIR_LENGTH]
import os
import sys
import numpy as np
import OpenImageIO as oiio

args = sys.argv[sys.argv.index("--") + 1:]
exr, web_bin = args[:2]
AIR = np.array([float(v) for v in (args[2] if len(args) > 2 else "0.111,0.087,0.078").split(",")], np.float32)
AIR_LENGTH = float(args[3]) if len(args) > 3 else 1.0
LUM = np.array([0.2126, 0.7152, 0.0722], np.float32)

# Blender 5 writes a multi-part EXR: one part per pass, channels "ViewLayer.<Pass Name>.R/G/B".
passes = {}
inp = oiio.ImageInput.open(exr)
n = 0
while inp.seek_subimage(n, 0):
    ch = list(inp.spec().channelnames)
    data = inp.read_image(n, 0, 0, len(ch), oiio.FLOAT)  # (h, w, channels), rows top-down
    for i, c in enumerate(ch):
        passes.setdefault(c.rsplit(".", 1)[0].split(".", 1)[-1], {})[c.rsplit(".", 1)[1]] = data[..., i]
    n += 1
inp.close()


def layer(name):
    p = passes[name]
    return np.stack([p["R"], p["G"], p["B"]], axis=-1)


combined = layer("Combined")
diffuse = layer("Diffuse Color") * (layer("Diffuse Direct") + layer("Diffuse Indirect"))
glossy = layer("Glossy Color") * (layer("Glossy Direct") + layer("Glossy Indirect"))
volume = layer("Volume Direct") + layer("Volume Indirect")
emit = layer("Emission")
H, W = combined.shape[:2]

w4 = np.fromfile(web_bin, np.float32).reshape(540, 960, 4)[::-1]  # dump rows are bottom-up
web = w4[..., :3] - AIR * (1 - np.exp(-w4[..., 3] / AIR_LENGTH))[..., None]
assert web.shape == combined.shape, (web.shape, combined.shape)

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

L = lambda a, sl: float((a[sl] @ LUM).mean())
print(f"{'region':13s} {'combined':>8s} {'diffuse':>8s} {'glossy':>8s} {'volume':>8s} {'emit':>7s} {'web':>8s} {'web/diff':>8s}")
for name, (x0, y0, x1, y1) in REGIONS.items():
    sl = (slice(int((1 - y1) * H), int((1 - y0) * H)), slice(int(x0 * W), int(x1 * W)))  # y from the bottom
    d = L(diffuse, sl)
    print(f"{name:13s} {L(combined, sl):8.4f} {d:8.4f} {L(glossy, sl):8.4f} {L(volume, sl):8.4f} {L(emit, sl):7.4f} "
          f"{L(web, sl):8.4f} {L(web, sl) / max(d, 1e-6):8.2f}")

# Diffuse split into albedo (Diffuse Color) and lighting (Direct + Indirect), for comparing with the web's
# material colour and lightmap separately.
print(f"\n{'region':13s} {'DiffCol':>8s} {'DiffDir':>8s} {'DiffInd':>8s}   (linear luminance)")
for name, (x0, y0, x1, y1) in REGIONS.items():
    sl = (slice(int((1 - y1) * H), int((1 - y0) * H)), slice(int(x0 * W), int(x1 * W)))
    print(f"{name:13s} {L(layer('Diffuse Color'), sl):8.4f} {L(layer('Diffuse Direct'), sl):8.4f} {L(layer('Diffuse Indirect'), sl):8.4f}")
