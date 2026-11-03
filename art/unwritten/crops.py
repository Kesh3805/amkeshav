# Gate crops for a hero frame (ChatGPT's realism brief): 100 % crops of the named regions, plus a matched
# before/after lighting comparison against the previous hero.
#   python art/unwritten/crops.py <hero.png> <out-dir> [<previous-hero.png>]
# Regions are fractions of the frame (left, top, right, bottom) for the CAM_HERO composition.
import os, sys
from PIL import Image, ImageDraw, ImageFont

REGIONS = {
    "desk": (0.36, 0.72, 0.64, 1.0),
    "anomaly": (0.44, 0.30, 0.90, 0.56),
    "pilaster-wall": (0.70, 0.40, 0.98, 0.90),
    "books": (0.04, 0.50, 0.30, 0.86),
    "sconce": (0.0, 0.20, 0.16, 0.48),
    "instrument": (0.06, 0.0, 0.32, 0.32),
}

src, out = sys.argv[1], sys.argv[2]
prev = sys.argv[3] if len(sys.argv) > 3 else None
os.makedirs(out, exist_ok=True)
img = Image.open(src).convert("RGB")
W, H = img.size
for name, (l, t, r, b) in REGIONS.items():
    img.crop((int(l * W), int(t * H), int(r * W), int(b * H))).save(os.path.join(out, f"crop-{name}.png"))
    print("crop", name)

if prev:
    old = Image.open(prev).convert("RGB").resize((W, H), Image.LANCZOS)
    l, t, r, b = (0.30, 0.20, 0.75, 1.0)  # the shaft, the desk and the first turning room
    box = (int(l * W), int(t * H), int(r * W), int(b * H))
    a_, b_ = old.crop(box), img.crop(box)
    sheet = Image.new("RGB", (a_.width * 2 + 12, a_.height + 40), (10, 10, 10))
    sheet.paste(a_, (0, 40))
    sheet.paste(b_, (a_.width + 12, 40))
    d = ImageDraw.Draw(sheet)
    f = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 22)
    name = lambda p: os.path.splitext(os.path.basename(p))[0]
    d.text((10, 8), name(prev), fill=(235, 226, 212), font=f)
    d.text((a_.width + 22, 8), name(src), fill=(235, 226, 212), font=f)
    sheet.save(os.path.join(out, "lighting-comparison.png"))
    print("comparison")
