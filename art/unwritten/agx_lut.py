# Blender's own AgX view + look as a 3D LUT for the web, so the WebGL chamber grades exactly like the master.
# three's AgXToneMapping is a different curve (16.5 stops, Rec.2020, no look); this bakes the OCIO pipeline the
# stills used: Linear Rec.709 → display sRGB, view AgX, look "AgX - Punchy".
#   blender -b -P art/unwritten/agx_lut.py -- <out.bin> [N=48] [check.exr check.png ev]
# Input domain: per-channel log2 shaper over [LO, HI] (AgX's own 25 stops), N³ grid. Output: sRGB-encoded uint8,
# laid out N wide × N² tall with row = b·N + g, so an RGBA readback is already Data3DTexture order.
# Then: python -c "import numpy as n,PIL.Image as I; I.fromarray(n.fromfile('lut.bin',n.uint8).reshape(48*48,48,3)).save('public/unwritten/agx-punchy.png')"
# Checked against hero-006 (EXR at EV −0.3 vs Blender's PNG): N=48 is off by 0.42 codes mean, 1.3 at p99.
import os, sys
import numpy as np
import bpy
import PyOpenColorIO as OCIO

LO, HI = -12.47393, 12.5260688117
args = sys.argv[sys.argv.index("--") + 1:]
out = args[0]
N = int(args[1]) if len(args) > 1 else 48
LOOK = os.environ.get("VIEW_LOOK", "AgX - Punchy")

cfg = OCIO.Config.CreateFromFile(os.path.join(bpy.utils.resource_path("LOCAL"), "datafiles", "colormanagement", "config.ocio"))
vp = OCIO.LegacyViewingPipeline()
vp.setDisplayViewTransform(OCIO.DisplayViewTransform(src="Linear Rec.709", display="sRGB", view="AgX"))
vp.setLooksOverrideEnabled(True)
vp.setLooksOverride(LOOK)
cpu = vp.getProcessor(cfg).getDefaultCPUProcessor()


def view(lin):
    """Exact OCIO view of an (n, 3) scene-linear array."""
    a = np.array(lin, dtype=np.float32).reshape(-1)  # a copy: applyRGB works in place
    cpu.applyRGB(a)
    return a.reshape(-1, 3)


t = np.linspace(0.0, 1.0, N, dtype=np.float32)
b, g, r = np.meshgrid(t, t, t, indexing="ij")  # r fastest
grid = np.stack([r, g, b], axis=-1).reshape(-1, 3)
lut = np.clip(view(np.exp2(grid * (HI - LO) + LO)), 0.0, 1.0)
q = (lut * 255.0 + 0.5).astype(np.uint8)
q.tofile(out)
print(f"WROTE {out} N={N} look={LOOK!r}")

if len(args) >= 5:  # validate: LUT (trilinear, like the GPU) vs exact OCIO vs Blender's own PNG
    exr, png, ev = args[2], args[3], float(args[4])

    def pixels(path, raw):
        im = bpy.data.images.load(path)
        if raw:
            im.colorspace_settings.name = "Non-Color"
        a = np.empty(im.size[0] * im.size[1] * 4, np.float32)
        im.pixels.foreach_get(a)
        return a.reshape(-1, 4)[:, :3]

    lin = pixels(exr, False)[::7] * 2.0 ** ev  # every 7th pixel is plenty
    ref = pixels(png, True)[::7]
    exact = np.clip(view(lin), 0, 1)
    c = np.clip((np.log2(np.maximum(lin, 1e-10)) - LO) / (HI - LO), 0, 1) * (N - 1)
    i0 = np.minimum(np.floor(c).astype(int), N - 2)
    f = c - i0
    L = (q.astype(np.float32) / 255.0).reshape(N, N, N, 3)  # [b, g, r]
    acc = np.zeros_like(lin)
    for db in (0, 1):
        for dg in (0, 1):
            for dr in (0, 1):
                w = (f[:, 2] if db else 1 - f[:, 2]) * (f[:, 1] if dg else 1 - f[:, 1]) * (f[:, 0] if dr else 1 - f[:, 0])
                acc += w[:, None] * L[i0[:, 2] + db, i0[:, 1] + dg, i0[:, 0] + dr]
    for name, x in (("exact-vs-png", exact), ("lut-vs-exact", acc), ("lut-vs-png", acc)):
        y = ref if name.endswith("png") else exact
        d = np.abs(x - y) * 255
        print(f"CHECK {name}: mean {d.mean():.2f}  p99 {np.percentile(d, 99):.2f}  max {d.max():.1f} (8-bit codes)")
