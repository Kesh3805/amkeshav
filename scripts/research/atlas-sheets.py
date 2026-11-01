"""One contact sheet per atlas site: every desktop frame in capture order, then the two mobile frames."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = "docs/research/atlas"
FONT = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 15)
W, H, MW = 480, 300, 139  # desktop tile, and mobile tile width at the same height
sites = json.load(open(os.path.join(ROOT, "sites.json"), encoding="utf-8"))["sites"]
only = sys.argv[1:]

for s in sites:
    d = os.path.join(ROOT, s["id"])
    if (only and s["id"] not in only) or not os.path.isdir(d):
        continue
    frames = sorted(f for f in os.listdir(d) if f.endswith(".jpg") and f[0].isdigit())
    mobile = sorted(f for f in os.listdir(d) if f.startswith("m") and f.endswith(".jpg"))
    cols = 4
    rows = -(-len(frames) // cols) or 1
    sheet = Image.new("RGB", (cols * W + 2 * MW + 30, rows * (H + 22) + 40), (24, 24, 24))
    draw = ImageDraw.Draw(sheet)
    draw.text((8, 10), f"{s['id']}  ·  {s['group']}  ·  {s['url']}", fill=(240, 240, 240), font=FONT)
    for i, f in enumerate(frames):
        x, y = (i % cols) * W, 40 + (i // cols) * (H + 22)
        sheet.paste(Image.open(os.path.join(d, f)).convert("RGB").resize((W - 4, H)), (x, y + 18))
        draw.text((x + 2, y), f[:-4], fill=(200, 200, 120), font=FONT)
    for j, f in enumerate(mobile):
        x = cols * W + 10 + j * (MW + 10)
        im = Image.open(os.path.join(d, f)).convert("RGB")
        sheet.paste(im.resize((MW, int(im.height * MW / im.width))), (x, 58))
        draw.text((x, 40), f[:-4], fill=(200, 200, 120), font=FONT)
    sheet.save(os.path.join(ROOT, f"sheet-{s['id']}.jpg"), quality=70)
    print("sheet", s["id"])
