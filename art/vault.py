# THE VAULT — GST returns read model as a place.
# The old read path is the hall: every bay, every aisle, on every request.
# The new one is a single bay, pulled out and lit: one row, fetched by key.
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(bpy.data.filepath) or os.path.dirname(__file__))
import common as c

a = c.args({"out": "//renders/vault.png", "w": 1920, "h": 1080, "samples": 96, "mood": "day"})
day = a["mood"] == "day"
sc = c.setup(a, look="AgX - Medium High Contrast", exposure=0.6 if day else 0.9)

AISLE = 4.4          # aisle width (m)
DEPTH = 140.0        # hall length
CELL_W, CELL_H = 0.84, 0.44
ROWS = 21            # bays stacked to ~9.3 m
COLS = int(DEPTH / CELL_W)

steel = c.flat("steel", (0.4, 0.42, 0.44), rough=0.5, metallic=0.35)
backing = c.flat("backing", (0.05, 0.05, 0.055), rough=0.8)
floor_m = c.concrete("floor", (0.16, 0.16, 0.16), rough=0.18, bump=0.03, scale=50, aggregate=True)
ceiling_m = c.flat("ceiling", (0.04, 0.04, 0.045), rough=0.9)
slot_m = c.flat("slot", (1, 1, 1), emission=(0.82, 0.9, 1.0) if day else (1.0, 0.72, 0.45), strength=16.0 if day else 9.0)


def wall(side):
    x = side * AISLE / 2
    # Dark backing so the gaps between bay fronts read as joints.
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x + side * 0.12, DEPTH / 2, ROWS * CELL_H / 2))
    back = bpy.context.active_object
    back.rotation_euler = (0, math.radians(90), 0)
    back.scale = (ROWS * CELL_H, DEPTH, 1)
    back.data.materials.append(backing)
    # One bay front, arrayed along the hall and up the wall.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, CELL_W / 2, CELL_H / 2))
    f = bpy.context.active_object
    f.scale = (0.06, CELL_W - 0.05, CELL_H - 0.05)
    bpy.ops.object.transform_apply(scale=True)
    bev = f.modifiers.new("bev", "BEVEL")
    bev.width = 0.006
    bev.segments = 2
    # A recessed pull line on every front.
    ar = f.modifiers.new("cols", "ARRAY")
    ar.use_relative_offset = False
    ar.use_constant_offset = True
    ar.constant_offset_displace = (0, CELL_W, 0)
    ar.count = COLS
    ar2 = f.modifiers.new("rows", "ARRAY")
    ar2.use_relative_offset = False
    ar2.use_constant_offset = True
    ar2.constant_offset_displace = (0, 0, CELL_H)
    ar2.count = ROWS
    f.data.materials.append(steel)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x - side * 0.035, CELL_W / 2, CELL_H * 0.72))
    lab = bpy.context.active_object
    lab.scale = (0.012, CELL_W * 0.34, CELL_H * 0.11)
    bpy.ops.object.transform_apply(scale=True)
    for name, off, n in (("cols", (0, CELL_W, 0), COLS), ("rows", (0, 0, CELL_H), ROWS)):
        m = lab.modifiers.new(name, "ARRAY")
        m.use_relative_offset = False
        m.use_constant_offset = True
        m.constant_offset_displace = off
        m.count = n
    lab.data.materials.append(backing)


wall(-1)
wall(1)

bpy.ops.mesh.primitive_plane_add(size=1, location=(0, DEPTH / 2, 0))
fl = bpy.context.active_object
fl.scale = (AISLE + 2, DEPTH + 10, 1)
fl.data.materials.append(floor_m)

ceil_z = ROWS * CELL_H + 0.3
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, DEPTH / 2, ceil_z))
ce = bpy.context.active_object
ce.scale = (AISLE + 2, DEPTH + 10, 1)
ce.rotation_euler = (math.radians(180), 0, 0)
ce.data.materials.append(ceiling_m)
for sx in (-0.9, 0.9):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(sx, DEPTH / 2, ceil_z - 0.02))
    s = bpy.context.active_object
    s.scale = (0.14, DEPTH, 1)
    s.rotation_euler = (math.radians(180), 0, 0)
    s.data.materials.append(slot_m)

# The far end: a pale wall that the haze dissolves into.
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, DEPTH, ceil_z / 2))
end = bpy.context.active_object
end.scale = (AISLE + 2, ceil_z, 1)
end.rotation_euler = (math.radians(90), 0, 0)
end.data.materials.append(c.flat("end", (1, 1, 1), emission=(0.8, 0.86, 0.95), strength=1.4))

# The one row: a bay ~12 m in, left wall, fourth from the floor — pulled out and lit from inside.
col, row = 14, 2
y = col * CELL_W + CELL_W / 2
z = row * CELL_H + CELL_H / 2
PULL = 1.7
bpy.ops.mesh.primitive_cube_add(size=1, location=(-AISLE / 2 + PULL / 2 - 0.03, y, z))
tray = bpy.context.active_object
tray.scale = (PULL, CELL_W - 0.035, CELL_H - 0.035)
bpy.ops.object.transform_apply(scale=True)
tray.data.materials.append(steel)
tb = tray.modifiers.new("bev", "BEVEL")
tb.width = 0.006
# Hollow the top so the light inside spills up into the haze.
bpy.ops.mesh.primitive_cube_add(size=1, location=(-AISLE / 2 + PULL / 2 + 0.02, y, z + 0.06))
cut = bpy.context.active_object
cut.scale = (PULL - 0.12, CELL_W - 0.13, CELL_H)
bool_mod = tray.modifiers.new("hollow", "BOOLEAN")
bool_mod.object = cut
bool_mod.operation = "DIFFERENCE"
cut.hide_render = True
cut.hide_viewport = True
glow = bpy.data.objects.new("glow", bpy.data.lights.new("glow", "AREA"))
sc.collection.objects.link(glow)
glow.data.shape = "RECTANGLE"
glow.data.size = PULL - 0.2
glow.data.size_y = CELL_W - 0.2
glow.data.energy = 140 if day else 180
glow.data.color = (1.0, 0.97, 0.92)
glow.location = (-AISLE / 2 + PULL / 2, y, z - 0.12)
glow.rotation_euler = (math.radians(180), 0, math.radians(90))  # area lights face -Z; flip to shine up
# The record inside the tray: a pale sheet catching the light.
bpy.ops.mesh.primitive_plane_add(size=1, location=(-AISLE / 2 + PULL / 2, y, z - 0.2))
sheet = bpy.context.active_object
sheet.scale = (PULL - 0.3, CELL_W - 0.3, 1)
sheet.data.materials.append(c.flat("record", (1, 1, 1), emission=(1, 0.97, 0.92), strength=2.2))
# A narrow beam rising from the open bay, visible only in the haze.
beam = bpy.data.objects.new("beam", bpy.data.lights.new("beam", "SPOT"))
sc.collection.objects.link(beam)
beam.data.energy = 2600 if day else 3400
beam.data.spot_size = math.radians(16)
beam.data.spot_blend = 0.6
beam.data.color = (1.0, 0.97, 0.92)
beam.location = (-AISLE / 2 + PULL / 2, y, z - 0.05)
beam.rotation_euler = (math.radians(180), 0, 0)

c.backdrop(sc, (0, 0, 0), 0)
c.haze(sc, (0, DEPTH / 2, ceil_z / 2), (AISLE + 1, DEPTH, ceil_z), 0.026 if day else 0.04, (0.9, 0.94, 1.0) if day else (1.0, 0.85, 0.7))

cam = c.camera(sc, (0, -3.0, 1.62), (0, 0, 0), 32)
c.aim(cam, (-0.35, 60, 2.2))
if os.environ.get("DEPTH"):
    c.depth_map(sc, cam, 480, 270, os.environ["DEPTH"])
else:
    c.render(sc, a["out"])
