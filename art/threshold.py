# THRESHOLD — the name as architecture, recognised half a second late.
# Low wide lens on a polished concrete floor; the letters of KESHAV stand ~14 m tall,
# turned away from the lens so they read as receding walls. The blue cube is the only colour.
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(bpy.data.filepath) or os.path.dirname(__file__))
import common as c

a = c.args({"out": "//renders/threshold.png", "w": 1920, "h": 1080, "samples": 96, "mood": "dawn"})
dawn = a["mood"] == "dawn"
sc = c.setup(a, exposure=-0.1 if dawn else 0.4)

# Floor
bpy.ops.mesh.primitive_plane_add(size=600)
floor = bpy.context.active_object
floor.data.materials.append(c.concrete("floor", (0.3, 0.29, 0.27), rough=0.38, bump=0.06, scale=60, aggregate=True))

# The name, as cast walls
font = bpy.data.fonts.load(r"C:\Windows\Fonts\ariblk.ttf")
txt = bpy.data.curves.new("name", "FONT")
txt.body = "KESHAV"
txt.font = font
txt.size = 19.0
txt.space_character = 1.12
txt.extrude = 1.4
txt.bevel_depth = 0.03
word = bpy.data.objects.new("name", txt)
sc.collection.objects.link(word)
# Reading direction runs away from the lens (+Y); faces look toward +X, where the camera stands.
word.rotation_euler = (math.radians(90), 0, math.radians(90))
word.location = (0.0, 2.5, 0)
bpy.context.view_layer.objects.active = word
word.select_set(True)
bpy.ops.object.convert(target="MESH")
word.data.materials.append(c.concrete("walls", (0.58, 0.56, 0.52), rough=0.9, bump=0.5, scale=24, streaks=False))

# The full stop: small, sharp, off-centre — the only colour in the frame.
bpy.ops.mesh.primitive_cube_add(size=0.17, location=(3.45, 1.35, 0.085))
cube = bpy.context.active_object
bev = cube.modifiers.new("bevel", "BEVEL")
bev.width = 0.005
bev.segments = 3
cube.rotation_euler = (0, 0, math.radians(-22))
# Backlit, the cube would go navy; a faint self-luminance keeps it the signal colour.
cube.data.materials.append(c.flat("signal", (0.022, 0.028, 1.0), rough=0.38, emission=(0.03, 0.04, 1.0), strength=0.9))

# Light: a low sun from the far end of the word, travelling toward the lens and grazing the faces,
# so the cast texture and the counters go deep and the letters' shadows reach back across the floor.
if dawn:
    c.backdrop(sc, (0.62, 0.6, 0.58), 0.07)
    c.sun_toward(sc, 20.0, (1.0, 0.82, 0.6), (-0.36, -0.9, -0.24), angle_deg=0.3)
    c.haze(sc, (0, 75, 14), (260, 110, 32), 0.02, (0.98, 0.94, 0.88))
else:
    c.backdrop(sc, (0.1, 0.13, 0.22), 0.6)
    c.sun_toward(sc, 0.7, (0.55, 0.66, 1.0), (-0.3, -0.94, -0.35), angle_deg=2)
    c.haze(sc, (0, 75, 12), (260, 110, 28), 0.05, (0.4, 0.48, 0.78))

# The focal event: a warm light inside the K's counter, so only the void's inner walls and floor glow.
door = bpy.data.objects.new("door", bpy.data.lights.new("door", "POINT"))
sc.collection.objects.link(door)
door.data.shadow_soft_size = 0.6
door.data.energy = 1800 if dawn else 1000
door.data.color = (1.0, 0.78, 0.52) if dawn else (0.6, 0.7, 1.0)
door.location = (0.0, 7.7, 1.0)

cam = c.camera(sc, (4.0, -0.9, 0.26), (0, 0, 0), 20, focus=2.4, fstop=2.2)
c.aim(cam, (-0.6, 11.0, 3.4))
if os.environ.get("PROBE"):
    # Ray-cast through given pixels to find where the counter actually is in world space.
    from bpy_extras.view3d_utils import region_2d_to_vector_3d  # noqa: F401 (kept for reference)
    from mathutils import Vector
    deps = bpy.context.evaluated_depsgraph_get()
    cam.data.sensor_fit = "HORIZONTAL"
    frame = [cam.matrix_world @ v for v in cam.data.view_frame(scene=sc)]
    for px, py in [(0.55, 0.45), (0.55, 0.62), (0.57, 0.7), (0.53, 0.55)]:
        top = frame[3].lerp(frame[0], px)
        bot = frame[2].lerp(frame[1], px)
        target = top.lerp(bot, py)
        d = (target - cam.location).normalized()
        hit, loc, nrm, idx, obj, mat = sc.ray_cast(deps, cam.location, d)
        print("PROBE", px, py, hit, obj.name if obj else None, tuple(round(v, 2) for v in loc), tuple(round(v, 2) for v in nrm))
else:
    c.render(sc, a["out"])
