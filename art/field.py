# THE TEST SITE — TC-S1 as a place you could photograph.
# 200 survey fins on a gridded concrete apron, one per scenario against EDF:
# 170 toppled (losses), 15 leaning (ties), 15 standing (wins).
# Counts are the experiment's; positions are a fixed shuffle.
import bpy, math, os, random, sys
sys.path.insert(0, os.path.dirname(bpy.data.filepath) or os.path.dirname(__file__))
import common as c

a = c.args({"out": "//renders/field.png", "w": 1920, "h": 1080, "samples": 96, "mood": "day"})
day = a["mood"] == "day"
sc = c.setup(a, look="AgX - Medium High Contrast", exposure=-0.35 if day else 0.6)
rng = random.Random(11)

PX, PY = 1.25, 1.7  # grid pitch, matching the painted survey lines


def apron():
    m = c.concrete("apron", (0.36, 0.34, 0.31), rough=0.88, bump=0.12, scale=40, aggregate=True)
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    base = bsdf.inputs["Base Color"].links[0].from_socket
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])

    def line(axis, pitch, offset):
        add = c.node(nt, "ShaderNodeMath")
        add.operation = "ADD"
        add.inputs[1].default_value = offset
        nt.links.new(sep.outputs[axis], add.inputs[0])
        div = c.node(nt, "ShaderNodeMath")
        div.operation = "DIVIDE"
        div.inputs[1].default_value = pitch
        nt.links.new(add.outputs[0], div.inputs[0])
        fr = c.node(nt, "ShaderNodeMath")
        fr.operation = "FRACT"
        nt.links.new(div.outputs[0], fr.inputs[0])
        lt = c.node(nt, "ShaderNodeMath")
        lt.operation = "LESS_THAN"
        lt.inputs[1].default_value = 0.012 / pitch
        nt.links.new(fr.outputs[0], lt.inputs[0])
        return lt.outputs[0]

    mx = c.node(nt, "ShaderNodeMath")
    mx.operation = "MAXIMUM"
    nt.links.new(line("X", PX, PX / 2), mx.inputs[0])
    nt.links.new(line("Y", PY, PY / 2), mx.inputs[1])
    # Worn paint: break the lines up with noise.
    wear = c.node(nt, "ShaderNodeTexNoise", Scale=9.0, Detail=6.0)
    mul = c.node(nt, "ShaderNodeMath")
    mul.operation = "MULTIPLY"
    nt.links.new(mx.outputs[0], mul.inputs[0])
    nt.links.new(wear.outputs["Fac"], mul.inputs[1])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    nt.links.new(mul.outputs[0], mix.inputs["Factor"])
    nt.links.new(base, mix.inputs["A"])
    mix.inputs["B"].default_value = (0.72, 0.7, 0.64, 1)
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    return m


def fin_material():
    m = c.concrete("fin", (0.6, 0.58, 0.53), rough=0.82, bump=0.35, scale=26)
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    base = bsdf.inputs["Base Color"].links[0].from_socket
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    # A machined dark band near the top of every fin: an instrument, not a stone.
    lo = c.node(nt, "ShaderNodeMath")
    lo.operation = "GREATER_THAN"
    lo.inputs[1].default_value = 0.3
    hi = c.node(nt, "ShaderNodeMath")
    hi.operation = "LESS_THAN"
    hi.inputs[1].default_value = 0.37
    nt.links.new(sep.outputs["Z"], lo.inputs[0])
    nt.links.new(sep.outputs["Z"], hi.inputs[0])
    band = c.node(nt, "ShaderNodeMath")
    band.operation = "MULTIPLY"
    nt.links.new(lo.outputs[0], band.inputs[0])
    nt.links.new(hi.outputs[0], band.inputs[1])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    nt.links.new(band.outputs[0], mix.inputs["Factor"])
    nt.links.new(base, mix.inputs["A"])
    mix.inputs["B"].default_value = (0.1, 0.1, 0.1, 1)
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    return m


bpy.ops.mesh.primitive_plane_add(size=500)
ground = bpy.context.active_object
ground.data.materials.append(apron())

FW, FD, FH = 0.26, 0.13, 0.95
bpy.ops.mesh.primitive_cube_add(size=1)
proto = bpy.context.active_object
proto.scale = (FW, FD, FH)
bpy.ops.object.transform_apply(scale=True)
b = proto.modifiers.new("bevel", "BEVEL")
b.width = 0.01
b.segments = 2
fin_m = fin_material()
proto.data.materials.append(fin_m)

outcomes = ["loss"] * 170 + ["tie"] * 15 + ["win"] * 15
rng.shuffle(outcomes)
cols = 20
push = math.radians(-24)  # they fell the same way, as if from one direction
for i, o in enumerate(outcomes):
    cx, cy = i % cols, i // cols
    x = (cx - cols / 2 + 0.5) * PX
    y = cy * PY + 2.0
    ob = proto.copy()
    sc.collection.objects.link(ob)
    yaw = rng.uniform(-0.05, 0.05)
    if o == "win":
        ob.location = (x, y, FH / 2)
        ob.rotation_euler = (0, 0, yaw)
    elif o == "tie":
        lean = math.radians(rng.uniform(16, 26))
        ob.rotation_euler = (lean, 0, push + yaw)
        ob.location = (x - math.sin(push) * math.sin(lean) * FH / 2, y + math.cos(push) * math.sin(lean) * FH / 2, math.cos(lean) * FH / 2 + 0.01)
    else:
        h = push + rng.uniform(-0.18, 0.18)
        ob.rotation_euler = (math.radians(90), 0, h)
        ob.location = (x - math.sin(h) * FH / 2, y + math.cos(h) * FH / 2, FD / 2)
bpy.data.objects.remove(proto)

if day:
    c.backdrop(sc, (0.78, 0.74, 0.68), 0.55)
    c.sun_toward(sc, 7.0, (1.0, 0.9, 0.78), (0.86, 0.36, -0.13), angle_deg=0.5)
    c.haze(sc, (0, 120, 8), (400, 220, 16), 0.006, (0.95, 0.92, 0.88))
else:
    c.backdrop(sc, (0.06, 0.08, 0.16), 0.6)
    c.sun_toward(sc, 0.4, (0.6, 0.7, 1.0), (0.82, 0.4, -0.45), angle_deg=1.5)
    c.haze(sc, (0, 120, 8), (400, 220, 16), 0.01, (0.4, 0.48, 0.78))

cam = c.camera(sc, (-2.2, -1.4, 0.48), (0, 0, 0), 70, focus=6.2, fstop=4.0)
c.aim(cam, (0.8, 30, 0.35))
c.render(sc, a["out"])
