"""Contact boards for the still test: python art/stills/board.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

D = Path(__file__).resolve().parents[2] / "docs/direction/stills"
FONT = ImageFont.truetype("arialbd.ttf", 22)
PAPER = (251, 250, 247)


def board(rows, cell_w, out, label_h=40, pad=24):
    """rows: list of lists of (file, caption). Images scaled to cell_w, rows top-aligned."""
    grid = [[(Image.open(D / f).convert("RGB"), c) for f, c in r] for r in rows]
    grid = [[(im.resize((cell_w, round(im.height * cell_w / im.width)), Image.LANCZOS), c) for im, c in r] for r in grid]
    cols = max(len(r) for r in grid)
    heights = [max(im.height for im, _ in r) + label_h for r in grid]
    W = pad + cols * (cell_w + pad)
    H = pad + sum(h + pad for h in heights)
    sheet = Image.new("RGB", (W, H), (226, 224, 218))
    draw = ImageDraw.Draw(sheet)
    y = pad
    for r, h in zip(grid, heights):
        x = pad
        for im, cap in r:
            draw.text((x, y + 6), cap, fill=(30, 30, 30), font=FONT)
            sheet.paste(im, (x, y + label_h))
            x += cell_w + pad
        y += h + pad
    sheet.save(D / out, quality=88)
    print(out, sheet.size)


board([[(f"cover-{c}-t{t}-desktop-fold.png", f"Cover {c.upper()} · type {t}") for t in (1, 2, 3)] for c in ("a", "b")],
      720, "board-covers.jpg")
board([[("cover-a-t1-phone-fold.png", "Cover A · phone"), ("cover-b-t1-phone-fold.png", "Cover B · phone"),
        ("gst-t1-phone.png", "GST · phone (full)"), ("frontier-t1-phone.png", "FRONTIER · phone (full)")]],
      390, "board-phone.jpg")
board([[("gst-t1-desktop-grey.png", "GST · greyscale"), ("frontier-t1-desktop-grey.png", "FRONTIER · greyscale")]],
      960, "board-grey.jpg")
