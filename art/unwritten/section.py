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

# ---------------------------------------------------------------- pilasters: plinth, attic base, reeded shaft, capital
stone = Mesh()
for px in (0.0, X1 + PIL_W / 2):
    hw = PIL_W / 2
    stone.box(px - hw - 0.13, -PIL_P - 0.13, 0, px + hw + 0.13, 0, 0.35)  # plinth block
    u_path = [Vector((px - hw, 0, 0)), Vector((px - hw, -PIL_P, 0)), Vector((px + hw, -PIL_P, 0)), Vector((px + hw, 0, 0))]
    stone.moulding([p + Z * 0.35 for p in u_path], kit.base_profile(0.12))
    z_shaft0, z_shaft1 = 0.35 + 0.275, Z_CASE1
    stone.box(px - hw, -PIL_P, z_shaft0, px + hw, 0, z_shaft1)
    stone.moulding([p + Z * z_shaft1 for p in u_path], kit.capital_profile(0.13))
    # Five convex reeds on the face, stopped short of base and capital as a mason would.
    reeds = Mesh()
    for k in range(5):
        x = px - hw + 0.09 + k * (PIL_W - 0.18) / 4
        reeds.lathe([(0.0, 0.0), (0.026, 0.02), (0.026, 4.2), (0.0, 4.22)], Vector((x, -PIL_P, z_shaft0 + 0.32)), 16)
    reeds.build(f"reeds_{px:.1f}", M.stone, col, smooth=True)
stone.build("pilasters", M.stone, col)

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

# ---------------------------------------------------------------- shelf case
case = Mesh()
case.box(X0, -0.02, Z_CASE0, X1, 0, Z_CASE1)  # back panel
case.box(X0, -CASE_D + 0.04, Z_CASE0, X1, 0, Z_CASE0 + 0.1)  # recessed kick
pitch, boards = 0.42, []
z = Z_CASE0 + 0.1
while z < Z_CASE1 - 0.2:
    case.box(X0, -CASE_D, z, X1, 0, z + 0.028)
    case.moulding([Vector((X0, -CASE_D, z)), Vector((X1, -CASE_D, z))], [(0.0, 0.0), (0.01, 0.0)] + kit.arc(0.01, 0.014, 0.014, -90, 90, 5)[1:] + [(0.0, 0.028)])  # lipped front edge
    boards.append(z + 0.028)
    z += pitch
case.moulding([Vector((X0, -CASE_D, Z_CASE1 - 0.115)), Vector((X1, -CASE_D, Z_CASE1 - 0.115))], kit.cornice_profile(0.09))
case.box(X0, -CASE_D, Z_CASE1 - 0.115, X1, 0, Z_CASE1)
case.build("shelf_case", M.wood, col)

# ---------------------------------------------------------------- books
B = Mesh()
PAPER, GILT = len(M.books), len(M.books) + 1
STYLES = {  # (heights, widths, fill, palette size, bands probability, lean probability)
    "archive": ((0.29, 0.31), (0.034, 0.05), 0.97, 2, 0.9, 0.0),
    "antique": ((0.21, 0.35), (0.028, 0.08), 0.92, 6, 0.55, 0.04),
    "folio": ((0.34, 0.385), (0.05, 0.09), 0.9, 3, 0.4, 0.03),
    "sparse": ((0.2, 0.33), (0.025, 0.07), 0.62, 5, 0.3, 0.25),
}


def binding():
    return random.choices(range(len(M.books)), weights=M.book_weights)[0]


def book(x, z, w, h, d, recess, lean, slot, bands):
    """A bound volume standing on a shelf at (x, z): spine toward the room (−Y), leaning about Y."""
    across = X * math.cos(lean) + Z * math.sin(lean)
    up = Z * math.cos(lean) - X * math.sin(lean)
    out = -Y
    o = Vector((x, -CASE_D + recess + d, z))  # rear bottom corner: the spine ends `recess` behind the shelf front
    B.slot = slot
    t = 0.0025  # board thickness
    for s in (t / 2, w - t / 2):  # boards
        B.obox(o + across * s + out * (d / 2) + up * (h / 2), across, out, up, t, d, h)
    B.slot = PAPER  # page block, inset from the boards and the fore-edge
    B.obox(o + across * (w / 2) + out * (d / 2 - 0.003) + up * (h / 2), across, out, up, w - 2 * t, d - 0.006, h - 0.008)
    # Rounded spine: a curved strip bulging toward the room, swept up the height.
    bulge = min(0.009, 0.18 * w)
    outer = [(w * k / 8, d + bulge * math.sin(math.pi * k / 8)) for k in range(9)]
    inner = [(u, v - 0.0022) for u, v in reversed(outer)]
    spine = outer + inner
    B.slot = slot
    B.sweep([(o + up * 0.0, across, out), (o + up * h, across, out)], spine)
    if bands:  # raised bands across the spine, each edged with a gilt rule
        for k in range(4):
            zb = h * (0.2 + 0.17 * k)
            band = [(u, v + 0.0025) for u, v in outer] + [(u, v - 0.001) for u, v in reversed(outer)]
            B.slot = slot
            B.sweep([(o + up * zb, across, out), (o + up * (zb + 0.007), across, out)], band)
            B.slot = GILT
            for zz in (zb - 0.004, zb + 0.009):
                rule = [(u, v + 0.0006) for u, v in outer] + [(u, v - 0.0005) for u, v in reversed(outer)]
                B.sweep([(o + up * zz, across, out), (o + up * (zz + 0.0012), across, out)], rule)
        B.slot = GILT  # title label
        lbl = [(u, v + 0.0012) for u, v in outer[1:-1]] + [(u, v - 0.0004) for u, v in reversed(outer[1:-1])]
        B.sweep([(o + up * (h * 0.82), across, out), (o + up * (h * 0.86), across, out)], lbl)


for i, zb in enumerate(boards):
    style = random.choices(list(STYLES), weights=(3, 5, 2, 2))[0]
    (h0, h1), (w0, w1), fill, npal, pband, plean = STYLES[style]
    palette = [binding() for _ in range(npal)]
    x = X0 + 0.01
    limit = (pitch - 0.028) - 0.012
    while x < X1 - 0.08:
        if random.random() > fill:  # a gap; the next book leans back into it, resting on its corner
            w = random.uniform(w0, w1)
            h = min(random.uniform(h0, h1), limit)
            lean = math.radians(random.uniform(8, 16)) if random.random() < 0.6 + plean else 0.0
            x += max(random.uniform(0.04, 0.22), h * math.sin(lean) + 0.012)
            book(x, zb, w, h, random.uniform(0.2, 0.27), random.uniform(0.01, 0.05), lean, random.choice(palette), random.random() < pband)
            x += w + 0.003
            continue
        if style == "sparse" and random.random() < 0.05:  # a short stack lying flat
            zz = zb
            for _ in range(random.randint(2, 4)):
                tt = random.uniform(0.03, 0.055)
                B.slot = random.choice(palette)
                B.box(x, -CASE_D + random.uniform(0.02, 0.05), zz, x + random.uniform(0.24, 0.3), -CASE_D + 0.27, zz + tt * 0.96)
                zz += tt
            x += 0.32
            continue
        w = random.uniform(w0, w1)
        h = min(random.uniform(h0, h1), limit)
        lean = math.radians(random.uniform(-1.2, 1.2)) * (random.random() < 0.5)
        recess = random.uniform(0.008, 0.03) if random.random() > 0.2 else random.uniform(0.05, 0.09)
        book(x, zb, w, h, random.uniform(0.18, 0.27), recess, lean, random.choice(palette), random.random() < pband)
        x += w + random.uniform(0.0, 0.002)
B.build("books", M.books + [M.paper, M.gilt], col)

# ---------------------------------------------------------------- brass sconce on the left pilaster
s = Mesh()
sx, sy, sz = 0.0, -PIL_P, 2.55
s.lathe([(0.0, 0.0), (0.075, 0.0), (0.08, 0.012), (0.07, 0.022), (0.0, 0.026)], Vector((sx, sy, sz)), 32, axis_up=-Y)  # backplate
arm = [Vector((sx, sy - 0.02, sz)), Vector((sx, sy - 0.16, sz + 0.02)), Vector((sx, sy - 0.24, sz + 0.1)), Vector((sx, sy - 0.25, sz + 0.16))]
frames = []
for i_, p in enumerate(arm):
    t_ = (arm[min(i_ + 1, 3)] - arm[max(i_ - 1, 0)]).normalized()
    u_ = t_.cross(X).normalized()
    frames.append((p, X, u_))
s.sweep(frames, [(0.009 * math.cos(2 * math.pi * k / 12), 0.009 * math.sin(2 * math.pi * k / 12)) for k in range(12)])
s.lathe([(0.0, 0.0), (0.035, 0.0), (0.04, 0.015), (0.022, 0.035), (0.0, 0.04)], Vector((sx, sy - 0.25, sz + 0.15)), 24)  # cup
s.build("sconce", M.brass, col, smooth=True)
glass = bpy.data.materials.new("frosted_glass")
glass.use_nodes = True
gb = glass.node_tree.nodes["Principled BSDF"]
gb.inputs["Base Color"].default_value = (1.0, 0.93, 0.82, 1)
gb.inputs["Transmission Weight"].default_value = 1.0
gb.inputs["Roughness"].default_value = 0.45
sh = Mesh()
sh.lathe([(0.0, 0.0), (0.03, 0.0), (0.05, 0.06), (0.052, 0.14), (0.045, 0.17), (0.0, 0.17)], Vector((sx, sy - 0.25, sz + 0.19)), 32)
sh.build("shade", glass, col, smooth=True)
bulb = Mesh()
bulb.lathe([(0.0, 0.0), (0.012, 0.01), (0.014, 0.04), (0.0, 0.055)], Vector((sx, sy - 0.25, sz + 0.21)), 16)
bulb.build("bulb", M.bulb, col, smooth=True)


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
po.location = (sx, sy - 0.25, sz + 0.24)
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
    "PILASTER": camera("PILASTER", (1.05, -2.1, 2.45), (0.05, -0.45, 2.55), 40, level=False),
}
os.makedirs(a["out"], exist_ok=True)
for key in os.environ.get("CAMS", "SECTION,BOOKS,PILASTER").split(","):
    sc.camera = CAMS[key]
    c.render(sc, os.path.join(a["out"], f"{key.lower()}.png"))
