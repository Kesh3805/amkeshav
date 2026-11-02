# THE UNWRITTEN — production section test (ChatGPT's realism brief, Gate A).
# One 4–6 m bay of the chamber built to production standard: a reeded limestone pilaster with attic base
# and capital, a walnut shelf case with lipped shelves and a cornice, books as bound volumes (boards,
# rounded spine, page block, raised bands, gilt), a gallery with turned balusters and a brass rail, and a
# brass sconce. Flat wall here; once this passes close-up review the same kit goes onto the rotunda.
#
#   blender -b -P art/unwritten/section.py -- <out-dir> <w> <h> <samples>
#   CAMS=SECTION,BOOKS,PILASTER (default all)    EV=<stops>
import bpy, math, os, sys, random
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, HERE)
import common as c
import kit
import bay
from kit import Mesh, X, Y, Z, srgb

a = c.args({"out": os.path.join(HERE, "..", "renders", "unwritten", "section"), "w": 1280, "h": 720, "samples": 64, "mood": "hero"})
a["out"] = os.path.abspath(a["out"])
sc = c.setup(a, exposure=float(os.environ.get("EV", "0.0")))
sc.cycles.diffuse_bounces, sc.cycles.glossy_bounces, sc.cycles.max_bounces = 4, 4, 8
random.seed(1102)
M = kit.materials()
col = sc.collection

PIL_W, PIL_P = 0.62, 0.42  # pilaster width and projection from the wall
BAY = 3.68  # clear width between pilaster faces
X0, X1 = PIL_W / 2, PIL_W / 2 + BAY  # shelf case between the two pilasters
CASE_D, Z_CASE0, Z_CASE1 = 0.45, 0.35, 5.55
Z_GAL = 6.15

# ---------------------------------------------------------------- floor and wall
m = Mesh()
m.box(-12, -14, -0.2, 16, 0.6, 0)
m.build("floor", M.floor, col)
m = Mesh()
m.box(-12, 0, 0, 16, 0.6, 12)
m.build("wall", M.masonry, col)  # coursed ashlar behind the cases

# ---------------------------------------------------------------- pilasters, case and books (bay.py)
F = bay.Frame((0, 0, 0), X, Y)
stone, reeds = Mesh(), Mesh()
for px in (0.0, X1 + PIL_W / 2):
    bay.pilaster(stone, reeds, F, px, Z_CASE1 + 0.3, PIL_W, PIL_P)
stone.build("pilasters", M.stone, col)
reeds.build("reeds", M.stone, col, smooth=True)

# ---------------------------------------------------------------- gallery: slab, fascia moulding, turned balusters, brass rail
g = Mesh()
g.box(-6.0, -1.7, Z_GAL - 0.3, 11.0, 0, Z_GAL)
front = [Vector((-6.0, -1.7, Z_GAL - 0.3)), Vector((11.0, -1.7, Z_GAL - 0.3))]  # runs +X so the profile faces the room
g.moulding(front, [(x, -y) for x, y in kit.cornice_profile(0.1)][::-1])  # crown hung beneath the slab edge
g.box(-6.0, -1.68, Z_GAL, 11.0, -1.56, Z_GAL + 0.1)  # baluster plinth rail
g.build("gallery", M.stone, col)
bal = Mesh()
x = -5.9
while x < 10.9:
    bal.lathe(kit.baluster_profile(0.84), Vector((x, -1.62, Z_GAL + 0.1)), 20)
    x += 0.2
bal.build("balusters", M.stone, col, smooth=True)
rail = Mesh()
rail.moulding([Vector((-6.0, -1.62, Z_GAL + 0.94)), Vector((11.0, -1.62, Z_GAL + 0.94))], kit.rail_profile(), up=Z)
rail.build("rail", M.brass, col, smooth=True)

# ---------------------------------------------------------------- shelf case and books
wood = Mesh()
pitch = 0.42
tops = bay.case(wood, F, X0, X1, Z_CASE0, Z_CASE1, CASE_D, pitch)
wood.build("shelf_case", M.wood, col)
books = bay.Books(M, random.Random(1102))
books.fill(F, X0, X1, tops, pitch, CASE_D)
books.build("books", col)

# ---------------------------------------------------------------- brass sconce on the left pilaster
s, sh, bl = Mesh(), Mesh(), Mesh()
top = bay.sconce(s, sh, bl, F, 0.0, 2.55) - Z * 0.09
s.build("sconce", M.brass, col, smooth=True)
sh.build("shade", M.glass, col, smooth=True)
bl.build("bulb", M.bulb, col, smooth=True)


def area(name, pos, target, kelvin, watts, sx_, sy_):
    d = bpy.data.lights.new(name, "AREA")
    d.shape, d.size, d.size_y, d.energy = "RECTANGLE", sx_, sy_, watts
    try:
        d.use_temperature, d.temperature = True, kelvin
    except AttributeError:
        pass
    o = bpy.data.objects.new(name, d)
    col.objects.link(o)
    o.location = pos
    o.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    o.visible_camera = False
    return o


# Daylight from the oculus, high and to the front left; a raking light along the wall shows the stone;
# the sconce answers in tungsten. A dim cool world keeps the shadows from going dead.
area("oculus_daylight", (-1.5, -7.0, 10.0), (2.0, 0.0, 2.0), 5600, 420, 3.0, 3.0)
area("rake", (-3.4, -1.2, 4.4), (3.0, 0.0, 2.6), 4600, 420, 1.6, 6.0)
pt = bpy.data.lights.new("sconce_lamp", "POINT")
pt.energy, pt.shadow_soft_size = 35, 0.015
try:
    pt.use_temperature, pt.temperature = True, 2700
except AttributeError:
    pt.color = (1.0, 0.7, 0.42)
po = bpy.data.objects.new("sconce_lamp", pt)
col.objects.link(po)
po.location = top + Z * 0.09
c.backdrop(sc, srgb("#8DA2BF"), 0.05)


def camera(name, pos, target, lens, level=True):
    d = bpy.data.cameras.new(name)
    d.lens, d.sensor_width, d.sensor_fit, d.clip_end = lens, 36, "HORIZONTAL", 100
    o = bpy.data.objects.new(name, d)
    col.objects.link(o)
    o.location = pos
    if level:
        v = Vector(target) - Vector(pos)
        flat = Vector((v.x, v.y, 0))
        c.aim(o, Vector(pos) + flat)
        d.shift_y = (lens / 36.0) * (v.z / flat.length)
    else:
        c.aim(o, target)
    return o


CAMS = {
    "SECTION": camera("SECTION", (2.2, -7.6, 1.45), (2.2, 0.0, 3.55), 21),
    "BOOKS": camera("BOOKS", (2.3, -1.25, 1.62), (2.0, 0.0, 1.45), 50, level=False),
    "SCONCE": camera("SCONCE", (0.55, -1.05, 2.78), (0.0, -0.6, 2.66), 60, level=False),
    "PILASTER": camera("PILASTER", (1.05, -2.1, 2.45), (0.05, -0.45, 2.55), 40, level=False),
}
os.makedirs(a["out"], exist_ok=True)
for key in os.environ.get("CAMS", "SECTION,BOOKS,PILASTER,SCONCE").split(","):
    sc.camera = CAMS[key]
    c.render(sc, os.path.join(a["out"], f"{key.lower()}.png"))
