"""Tile the shortlist screenshots into labelled contact sheets (4x4, numbered tiles).

    python scripts/research/sheets.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

shots = sorted(Path("docs/research/shots").glob("*.jpg"))
font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 20)
TW, TH, COLS = 480, 300, 4
for n, start in enumerate(range(0, len(shots), 16)):
    batch = shots[start : start + 16]
    rows = (len(batch) + COLS - 1) // COLS
    sheet = Image.new("RGB", (TW * COLS, TH * rows), "black")
    for k, p in enumerate(batch):
        im = Image.open(p).convert("RGB").resize((TW, TH))
        d = ImageDraw.Draw(im)
        label = p.stem[:30]
        d.rectangle([0, 0, 12 + 11 * len(label), 30], fill=(0, 0, 0))
        d.text((6, 4), label, fill="white", font=font)
        sheet.paste(im, ((k % COLS) * TW, (k // COLS) * TH))
    out = Path(f"docs/research/sheet-{n}.jpg")
    sheet.save(out, quality=82)
    print(out, len(batch))
