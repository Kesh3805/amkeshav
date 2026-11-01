"""The finalist board: one strongest frame per finalist, numbered, in a 3x4 grid, plus one image per finalist
pairing its first frame with its best moment. Reads docs/research/atlas/finalists.json."""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = "docs/research/atlas"
BIG = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
SMALL = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
finalists = json.load(open(os.path.join(ROOT, "finalists.json"), encoding="utf-8"))["finalists"]

W, H, PAD = 720, 450, 16
board = Image.new("RGB", (3 * W + 4 * PAD, 4 * (H + 64) + PAD), (18, 18, 18))
draw = ImageDraw.Draw(board)
for i, f in enumerate(finalists):
    x, y = PAD + (i % 3) * (W + PAD), PAD + (i // 3) * (H + 64)
    board.paste(Image.open(os.path.join(ROOT, f["id"], f["best"] + ".jpg")).convert("RGB").resize((W, H)), (x, y))
    draw.text((x, y + H + 8), f"{i + 1}. {f['name']}", fill=(245, 245, 245), font=BIG)
    draw.text((x, y + H + 36), f["idea"][:78], fill=(170, 170, 170), font=SMALL)
board.save(os.path.join(ROOT, "finalists-board.jpg"), quality=78)

os.makedirs(os.path.join(ROOT, "finalists"), exist_ok=True)
for i, f in enumerate(finalists):
    frames = [f["first"], f["best"]] + f.get("more", [])
    out = Image.new("RGB", (len(frames) * (W + PAD) + PAD, H + 2 * PAD + 40), (18, 18, 18))
    d = ImageDraw.Draw(out)
    d.text((PAD, 10), f"{i + 1}. {f['name']} — {f['url']}", fill=(245, 245, 245), font=BIG)
    for j, fr in enumerate(frames):
        out.paste(Image.open(os.path.join(ROOT, f["id"], fr + ".jpg")).convert("RGB").resize((W, H)), (PAD + j * (W + PAD), 44))
    out.save(os.path.join(ROOT, "finalists", f"{i + 1:02d}-{f['id']}.jpg"), quality=78)
print("board +", len(finalists), "finalist strips")
