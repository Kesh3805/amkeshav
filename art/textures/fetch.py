# Fetch the CC0 Poly Haven texture sets used by art/unwritten/chamber.py (2K JPG: colour, roughness,
# OpenGL normal, displacement). The images are not committed; run this once before a hero render.
#   python art/textures/fetch.py
import json, os, urllib.request

SETS = {
    "beige_wall_001": "architecture: pilasters, galleries, arches, dome",
    "sandstone_blocks_08": "masonry of the two turning rooms",
    "marble_01": "honed floor, tinted dark",
    "dark_wood": "shelving, desks",
    "brown_leather": "book bindings and the folio, tinted per book",
    "metal_plate": "wear and roughness breakup on brass",
}
MAPS = {"Diffuse": "diff", "Rough": "rough", "nor_gl": "nor_gl", "Displacement": "disp"}
HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "amkeshav-art-pipeline/1.0 (+https://github.com/Kesh3805/amkeshav)"}  # the API rejects bare clients


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA))


for asset in SETS:
    with get(f"https://api.polyhaven.com/files/{asset}") as r:
        files = json.load(r)
    os.makedirs(os.path.join(HERE, asset), exist_ok=True)
    for key, short in MAPS.items():
        url = files[key]["2k"]["jpg"]["url"]
        out = os.path.join(HERE, asset, f"{short}.jpg")
        if not os.path.exists(out):
            with get(url) as r, open(out, "wb") as fh:
                fh.write(r.read())
        print(asset, short, os.path.getsize(out) // 1024, "KB")
