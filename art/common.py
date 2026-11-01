# Shared scene setup for the art plates. Imported by each scene script.
import bpy, math, sys


def args(defaults):
    """Positional args after `--`: out, width, height, samples, mood."""
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    keys = ["out", "w", "h", "samples", "mood"]
    out = dict(defaults)
    for k, v in zip(keys, argv):
        out[k] = type(defaults[k])(v)
    return out


def setup(a, look="AgX - Medium High Contrast", exposure=0.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = a["samples"]
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.render.resolution_x, sc.render.resolution_y = a["w"], a["h"]
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = look
    sc.view_settings.exposure = exposure
    sc.render.film_transparent = False
    return sc


def node(nt, kind, **inputs):
    n = nt.nodes.new(kind)
    for k, v in inputs.items():
        n.inputs[k].default_value = v
    return n


def concrete(name, base, rough=0.75, bump=0.25, scale=30.0, streaks=False, aggregate=False):
    """Matte cast material: mottled albedo, fine bump, optional board streaks / aggregate."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = rough
    tc = nt.nodes.new("ShaderNodeTexCoord")

    mottle = node(nt, "ShaderNodeTexNoise", Scale=2.5, Detail=8.0)
    nt.links.new(tc.outputs["Object"], mottle.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (base[0] * 0.78, base[1] * 0.78, base[2] * 0.76, 1)
    ramp.color_ramp.elements[1].color = (base[0] * 1.06, base[1] * 1.06, base[2] * 1.05, 1)
    nt.links.new(mottle.outputs["Fac"], ramp.inputs["Fac"])
    color = ramp.outputs["Color"]

    if aggregate:
        vor = node(nt, "ShaderNodeTexVoronoi", Scale=scale * 6)
        nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
        speck = nt.nodes.new("ShaderNodeValToRGB")
        speck.color_ramp.elements[0].position = 0.0
        speck.color_ramp.elements[0].color = (0.25, 0.24, 0.22, 1)
        speck.color_ramp.elements[1].position = 0.06
        speck.color_ramp.elements[1].color = (1, 1, 1, 1)
        nt.links.new(vor.outputs["Distance"], speck.inputs["Fac"])
        mul = nt.nodes.new("ShaderNodeMix")
        mul.data_type = "RGBA"
        mul.blend_type = "MULTIPLY"
        mul.inputs["Factor"].default_value = 0.6
        nt.links.new(color, mul.inputs["A"])
        nt.links.new(speck.outputs["Color"], mul.inputs["B"])
        color = mul.outputs["Result"]

    if streaks:
        wave = node(nt, "ShaderNodeTexWave", Scale=1.2, Distortion=3.0, Detail=4.0)
        wave.bands_direction = "Z"
        nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 0.12
        nt.links.new(color, mix.inputs["A"])
        nt.links.new(wave.outputs["Color"], mix.inputs["B"])
        color = mix.outputs["Result"]

    nt.links.new(color, bsdf.inputs["Base Color"])
    fine = node(nt, "ShaderNodeTexNoise", Scale=scale, Detail=14.0)
    nt.links.new(tc.outputs["Object"], fine.inputs["Vector"])
    b = node(nt, "ShaderNodeBump", Strength=bump)
    nt.links.new(fine.outputs["Fac"], b.inputs["Height"])
    nt.links.new(b.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def flat(name, color, rough=0.5, metallic=0.0, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


def haze(sc, location, size, density, color):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    box = bpy.context.active_object
    box.name = "haze"
    box.scale = size
    m = bpy.data.materials.new("haze")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes["Principled BSDF"])
    vol = node(nt, "ShaderNodeVolumePrincipled", Density=density, Color=(*color, 1))
    nt.links.new(vol.outputs["Volume"], nt.nodes["Material Output"].inputs["Volume"])
    box.data.materials.append(m)
    sc.cycles.volume_step_rate = 3
    return box


def sky(sc, strength, elevation_deg, rotation_deg, dust=2.0):
    world = bpy.data.worlds.new("w")
    sc.world = world
    world.use_nodes = True
    wn = world.node_tree
    s = wn.nodes.new("ShaderNodeTexSky")
    for t in ("MULTIPLE_SCATTERING", "NISHITA", "HOSEK_WILKIE"):
        try:
            s.sky_type = t
            break
        except TypeError:
            continue
    for attr, v in (("sun_elevation", math.radians(elevation_deg)), ("sun_rotation", math.radians(rotation_deg)),
                    ("altitude", 30), ("air_density", 1.2), ("dust_density", dust), ("sun_disc", False)):
        try:
            setattr(s, attr, v)
        except AttributeError:
            pass
    bg = wn.nodes["Background"]
    bg.inputs["Strength"].default_value = strength
    wn.links.new(s.outputs["Color"], bg.inputs["Color"])
    return s


def sun(sc, energy, color, elevation_deg, azimuth_deg, angle_deg=1.0):
    o = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sc.collection.objects.link(o)
    o.data.energy = energy
    o.data.color = color
    o.data.angle = math.radians(angle_deg)
    # Point the light along the direction it travels: from azimuth, down at elevation.
    o.rotation_euler = (math.radians(90 - elevation_deg), 0, math.radians(azimuth_deg + 90))
    return o


def camera(sc, location, rotation_deg, lens, focus=None, fstop=None, shift_y=0.0):
    data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.location = location
    cam.rotation_euler = tuple(math.radians(v) for v in rotation_deg)
    data.lens = lens
    data.shift_y = shift_y
    data.clip_end = 1000
    if focus:
        data.dof.use_dof = True
        data.dof.focus_distance = focus
        data.dof.aperture_fstop = fstop or 2.8
    return cam


def render(sc, out):
    sc.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print("WROTE", out)


def sun_toward(sc, energy, color, direction, angle_deg=1.0):
    """A sun whose light travels along `direction` (x, y, z), z negative = downward."""
    from mathutils import Vector
    o = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sc.collection.objects.link(o)
    o.data.energy = energy
    o.data.color = color
    o.data.angle = math.radians(angle_deg)
    o.rotation_euler = Vector(direction).normalized().to_track_quat("-Z", "Y").to_euler()
    return o


def aim(cam, target):
    from mathutils import Vector
    d = Vector(target) - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def backdrop(sc, color, strength):
    """A plain luminous background: overcast dawn rather than a blue sky."""
    world = bpy.data.worlds.new("w")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*color, 1)
    bg.inputs["Strength"].default_value = strength
