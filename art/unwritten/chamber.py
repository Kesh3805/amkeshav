# THE UNWRITTEN — Chamber 001, "The Rotunda of Reversal".
# Contract: ChatGPT's production spec v1.0 (2 Nov 2026) as amended by the round 1–3 rulings in
# docs/unwritten/README.md (Gemini's critique relayed by Claude).
# Blender metres, Z up, origin at the floor centre, +Y north (away from the entrance),
# azimuth θ measured clockwise from +Y toward +X, so a point at radius r is (r sinθ, r cosθ).
#
#   blender -b -P art/unwritten/chamber.py -- <out-dir> <w> <h> <samples>
#   LOOK=hero|clay   lit materials with the oculus shaft and haze (default), or the greybox
#   CAMS=HERO,A_IN24,B,C,...   which cameras to render (default HERO)
#   EV=<stops>       exposure; SAVE_BLEND=<path> also saves the .blend
import bpy, bmesh, math, os, sys, json, random
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
sys.path.insert(0, HERE)
import common as c
import kit
import bay
from types import SimpleNamespace

LOOK = os.environ.get("LOOK", "hero")
a = c.args({"out": os.path.join(HERE, "..", "renders", "unwritten"), "w": 1280, "h": 720, "samples": 48, "mood": LOOK})
a["out"] = os.path.abspath(a["out"])
sc = c.setup(a, exposure=float(os.environ.get("EV", "0.0" if LOOK == "hero" else "-0.7")))
if LOOK == "hero":  # Punchy keeps hue in bright areas, so sunlit oxblood and green leather stay themselves
    sc.view_settings.look = os.environ.get("VIEW_LOOK", "AgX - Punchy")
sc.cycles.volume_bounces = 1
random.seed(1102)

R_WALL, R_WALL_OUT, Z_SPRING, Z_CROWN, R_OCULUS = 13.2, 14.1, 18.2, 24.0, 2.2
R_SHELF0, R_SHELF1, R_PIL = 11.55, 12.95, 11.35
GALLERY_Z, R_GAL0, R_GAL1 = (6.15, 12.15), 9.7, 11.2
TIERS = ((0.7, 5.55), (6.75, 11.4), (12.65, 17.35))
ENTRANCE_BAY = 8  # θ = 180°

# The anomaly (rulings, 2 Nov): one level corridor envelope on the lower ring, 1.5 m wide (matching the
# ring) and 2.2 m tall, whose walking surface is the floor, then the outer wall, then the ceiling.
CORR_R, CORR_HW, CORR_Z, CORR_H, CORR_TH = (R_GAL0 + R_GAL1) / 2, (R_GAL1 - R_GAL0) / 2, GALLERY_Z[0], 2.2, (-18.0, 72.0)
ROOM_U = (1 / 3, 2 / 3)  # the two stone rooms where the orientation turns
ROOM_LEN = 2.8
INVERTED_NICHES = {(3, 1), (4, 1)}  # (bay, tier): θ = 67.5° and 90°, the tier beside the inverted segment


def polar(r, th_deg, z=0.0):
    t = math.radians(th_deg)
    return Vector((r * math.sin(t), r * math.cos(t), z))


def radial(th_deg):
    t = math.radians(th_deg)
    return Vector((math.sin(t), math.cos(t), 0.0))


def tangent(th_deg):
    t = math.radians(th_deg)
    return Vector((math.cos(t), -math.sin(t), 0.0))


X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))


class Mesh:
    """Accumulates boxes and swept profiles into one mesh, so thousands of parts stay one object.
    `slot` selects which of the object's materials the next parts use."""

    def __init__(self):
        self.v, self.f, self.mi, self.slot = [], [], [], 0

    def _face(self, f):
        self.f.append(f)
        self.mi.append(self.slot)

    def obox(self, centre, ax, ay, az, sx, sy, sz):
        """An oriented box: full sizes along the three (unit) axes."""
        b = len(self.v)
        for i in (-1, 1):
            for j in (-1, 1):
                for k in (-1, 1):
                    self.v.append(centre + ax * (i * sx / 2) + ay * (j * sy / 2) + az * (k * sz / 2))
        for q in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
            self._face(tuple(b + i for i in q))

    def box_at(self, r, th, z, tw, rd, h):
        """A box centred at (r, θ, z): tw along the tangent, rd along the radius, h tall."""
        self.obox(polar(r, th, z), tangent(th), radial(th), Z, tw, rd, h)

    def sweep(self, frames, profile, cap=True, closed=False):
        """Sweep a closed 2D profile [(u, v)] through frames [(origin, U, V)]."""
        b, n = len(self.v), len(profile)
        for o, U, V in frames:
            for u, v in profile:
                self.v.append(o + U * u + V * v)
        count = len(frames)
        for s in range(count - (0 if closed else 1)):
            t = (s + 1) % count
            for p in range(n):
                q = (p + 1) % n
                self._face((b + s * n + p, b + s * n + q, b + t * n + q, b + t * n + p))
        if cap and not closed:
            self._face(tuple(b + p for p in range(n)))
            last = b + (count - 1) * n
            self._face(tuple(last + p for p in reversed(range(n))))

    def revolve(self, profile, th0, th1, steps, full=False):
        """Revolve a closed (r, z) profile around the Z axis between two azimuths."""
        count = steps if full else steps + 1
        span = 360.0 if full else th1 - th0
        frames = [(Vector((0, 0, 0)), radial(th0 + span * s / steps), Z) for s in range(count)]
        self.sweep(frames, profile, closed=full)

    def build(self, name, mats, coll):
        mats = mats if isinstance(mats, (list, tuple)) else [mats]
        me = bpy.data.meshes.new(name)
        me.from_pydata([tuple(v) for v in self.v], [], self.f)
        me.polygons.foreach_set("material_index", self.mi)
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new(name, me)
        coll.objects.link(ob)
        for m in mats:
            ob.data.materials.append(m)
        return ob


def collection(name):
    col = bpy.data.collections.new(name)
    sc.collection.children.link(col)
    return col


def rect(r0, r1, z0, z1):
    return [(r0, z0), (r1, z0), (r1, z1), (r0, z1)]


def srgb(h):
    """Hex swatch → linear RGB."""
    v = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in v)


# ---------------------------------------------------------------- materials
def principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    return m, nt, nt.nodes["Principled BSDF"], nt.nodes.new("ShaderNodeTexCoord")


def varied(nt, bsdf, tc, socket, lo, hi, scale, detail=6.0):
    """Drive a scalar socket between lo and hi with object-space noise, so nothing is uniform."""
    n = c.node(nt, "ShaderNodeTexNoise", Scale=scale, Detail=detail)
    nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value, mr.inputs["To Max"].default_value = lo, hi
    nt.links.new(n.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], bsdf.inputs[socket])


def walnut(name):
    m, nt, bsdf, tc = principled(name)
    wave = c.node(nt, "ShaderNodeTexWave", Scale=1.4, Distortion=4.0, Detail=8.0, **{"Detail Scale": 2.0})
    wave.bands_direction = "Z"
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.022, 0.012, 0.008, 1)
    ramp.color_ramp.elements[1].color = (0.05, 0.029, 0.018, 1)
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    varied(nt, bsdf, tc, "Roughness", 0.32, 0.55, 9.0)
    return m


def polished(name, base, lo=0.12, hi=0.34):
    """Honed dark stone: near-black, with roughness that wanders so reflections break up."""
    m, nt, bsdf, tc = principled(name)
    mottle = c.node(nt, "ShaderNodeTexNoise", Scale=1.6, Detail=10.0)
    nt.links.new(tc.outputs["Object"], mottle.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*[x * 0.6 for x in base], 1)
    ramp.color_ramp.elements[1].color = (*[x * 1.5 for x in base], 1)
    nt.links.new(mottle.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    varied(nt, bsdf, tc, "Roughness", lo, hi, 0.8)
    return m


def brass(name):
    m, nt, bsdf, tc = principled(name)
    bsdf.inputs["Base Color"].default_value = (*srgb("#C9A06A"), 1)
    bsdf.inputs["Metallic"].default_value = 1.0
    varied(nt, bsdf, tc, "Roughness", 0.18, 0.42, 14.0)
    return m


def leather(name, color, rough=0.62):
    m, nt, bsdf, tc = principled(name)
    mottle = c.node(nt, "ShaderNodeTexNoise", Scale=40.0, Detail=8.0)
    nt.links.new(tc.outputs["Object"], mottle.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*[x * 0.7 for x in color], 1)
    ramp.color_ramp.elements[1].color = (*[x * 1.25 for x in color], 1)
    nt.links.new(mottle.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    return m


TEX = os.path.join(os.path.dirname(HERE), "textures")
# Mean linear luminance of each 2K colour map, so a tint keeps the scan's detail without its brightness.
SCAN_MEAN = {"beige_wall_001": 0.273, "sandstone_blocks_08": 0.300, "marble_01": 0.349,
             "dark_wood": 0.042, "brown_leather": 0.037, "metal_plate": 0.035}


def pbr(name, asset, tile_m, tint=None, keep=0.0, rough=(0.0, 1.0), normal=1.0, metallic=0.0, bevel=0.01, seed=0):
    """Scanned CC0 PBR set (art/textures/fetch.py), box-projected in object space so it lands at real-world
    scale without UVs: one texture tile spans `tile_m` metres. `tint` recolours the scan while `keep` of its
    own colour survives (books share one leather scan); roughness is remapped into `rough`; the normal map
    and a shading bevel are chained so edges catch light."""
    m, nt, bsdf, tc = principled(name)
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / tile_m,) * 3
    mp.inputs["Location"].default_value = (seed * 0.37, seed * 0.61, seed * 0.13)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])

    def img(kind, colour):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(os.path.join(TEX, asset, f"{kind}.jpg"), check_existing=True)
        t.image.colorspace_settings.name = "sRGB" if colour else "Non-Color"
        t.projection, t.projection_blend = "BOX", 0.3
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t

    diff = img("diff", True)
    colour = diff.outputs["Color"]
    if tint is not None:
        bw = nt.nodes.new("ShaderNodeRGBToBW")
        nt.links.new(colour, bw.inputs["Color"])
        detail = nt.nodes.new("ShaderNodeMath")
        detail.operation = "MULTIPLY"
        detail.inputs[1].default_value = 1.0 / SCAN_MEAN[asset]  # the scan's luminance, normalised around 1
        nt.links.new(bw.outputs["Val"], detail.inputs[0])
        mul = nt.nodes.new("ShaderNodeMix")
        mul.data_type, mul.blend_type = "RGBA", "MULTIPLY"
        mul.inputs["Factor"].default_value = 1.0
        mul.inputs["A"].default_value = (*tint, 1)
        nt.links.new(detail.outputs["Value"], mul.inputs["B"])
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.inputs["Factor"].default_value = keep
        nt.links.new(mul.outputs["Result"], mix.inputs["A"])
        nt.links.new(colour, mix.inputs["B"])
        colour = mix.outputs["Result"]
    nt.links.new(colour, bsdf.inputs["Base Color"])
    r = img("rough", False)
    rm = nt.nodes.new("ShaderNodeMapRange")
    rm.inputs["To Min"].default_value, rm.inputs["To Max"].default_value = rough
    nt.links.new(r.outputs["Color"], rm.inputs["Value"])
    nt.links.new(rm.outputs["Result"], bsdf.inputs["Roughness"])
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = normal
    nt.links.new(img("nor_gl", False).outputs["Color"], nm.inputs["Color"])
    bev = nt.nodes.new("ShaderNodeBevel")
    bev.samples, bev.inputs["Radius"].default_value = 8, bevel
    nt.links.new(nm.outputs["Normal"], bev.inputs["Normal"])
    nt.links.new(bev.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Metallic"].default_value = metallic
    return m


if LOOK == "hero":
    M = kit.materials()
    STONE, MASONRY, WOOD, METAL = M.stone, M.masonry, M.wood, M.brass
    # hero-004 read the pool as pale tile: one tint and near-black joints. Each flag now draws from four
    # quarried tints, the scan keeps its own figure, and the joints are dust rather than shadow.
    # Contrast 1.6 (ChatGPT, hero-005): the pool needs real figure to reveal. Slots 4–7 are the same four
    # stones worn by footfall around the desk and along the approach: a touch darker and more polished.
    TINTS = ("#5F574C", "#665B4E", "#6B6358", "#736A5C")  # dark → light, for the drift
    # FLOOR_LIFT scales every flag's albedo: the floor has to return enough of the pool to light the room.
    FLOOR_LIFT = float(os.environ.get("FLOOR_LIFT", "2.6"))
    lift = lambda rgb, k=1.0: tuple(min(1.0, v * k * FLOOR_LIFT) for v in rgb)
    FLOORS = [kit.pbr(f"floor_limestone_{i}", "beige_wall_001", 1.3, tint=lift(srgb(t)), keep=0.35, rough=(0.28, 0.6), normal=0.8, bevel=0.005, seed=i, contrast=1.6)
              for i, t in enumerate(TINTS)]
    FLOORS += [kit.pbr(f"floor_worn_{i}", "beige_wall_001", 1.3, tint=lift(srgb(t), 0.9), keep=0.35, rough=(0.16, 0.4), normal=0.5, bevel=0.005, seed=i, contrast=1.6)
               for i, t in enumerate(TINTS)]
    FLOOR = FLOORS[0]
    ROOM_STONE = kit.pbr("room_stone", "sandstone_blocks_08", 1.6, tint=srgb("#776E61"), keep=0.5, rough=(0.55, 0.92), normal=1.3, bevel=0.012, contrast=1.3)
    FOLIO = kit.pbr("folio_oxide", "brown_leather", 0.12, tint=srgb("#3E1712"), keep=0.05, rough=(0.42, 0.72), normal=0.9, bevel=0.004)
    ENAMEL = polished("abyss_enamel", srgb("#273B43"), 0.18, 0.3)
    BOOKS, BOOK_WEIGHTS = M.books, M.book_weights
else:
    STONE = FLOOR = WOOD = MASONRY = ROOM_STONE = c.flat("clay", (0.52, 0.51, 0.49), rough=0.85)
    FLOORS = [FLOOR] * 8
    METAL = c.flat("clay_brass", (0.62, 0.58, 0.5), rough=0.35, metallic=1.0)
    FOLIO = c.flat("clay_folio", (0.42, 0.25, 0.22), rough=0.7)
    ENAMEL = c.flat("clay_books", (0.26, 0.255, 0.25), rough=0.8)
    BOOKS, BOOK_WEIGHTS = [ENAMEL], (1,)
    M = SimpleNamespace(books=BOOKS, book_weights=BOOK_WEIGHTS, paper=STONE, gilt=METAL, stone=STONE, masonry=MASONRY, wood=WOOD, brass=METAL)
WARM_BULB = c.flat("bulb", (1, 0.8, 0.55), emission=(1.0, 0.72, 0.42), strength=40.0)
JOINT = c.flat("joint_dust", (0.11, 0.097, 0.083), rough=0.95)


def round_edges(mat, radius):
    """Shading-only bevel: every box corner gets a rounded specular edge without adding geometry.
    Chains in front of any existing bump so both survive."""
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    bev = nt.nodes.new("ShaderNodeBevel")
    bev.samples = 8
    bev.inputs["Radius"].default_value = radius
    link = next((l for l in nt.links if l.to_socket == bsdf.inputs["Normal"]), None)
    if link:  # existing bump: feed the bevel normal into the bump's Normal input
        bump = link.from_node
        if "Normal" in bump.inputs:
            nt.links.new(bev.outputs["Normal"], bump.inputs["Normal"])
    else:
        nt.links.new(bev.outputs["Normal"], bsdf.inputs["Normal"])


if LOOK == "hero":
    sc.cycles.diffuse_bounces, sc.cycles.glossy_bounces, sc.cycles.max_bounces = 4, 4, 8


def pick_book():
    return random.choices(range(len(BOOKS)), weights=BOOK_WEIGHTS)[0]


# ---------------------------------------------------------------- shell
shell = collection("C01_SHELL")
# Floor (Gemini): honed French limestone flags, 900 × 600 mm in staggered running bond, each one dished a
# few millimetres by centuries of footfall, set over a dusty bed that shows in the joints.
m = Mesh()
m.revolve([(0.0, -0.4), (R_WALL_OUT, -0.4), (R_WALL_OUT, -0.006), (0.0, -0.006)], 0, 0, 128, full=True)
m.build("C01_FLOOR_BED", JOINT, shell)
flags = kit.Mesh()
FLOOR_RNG = random.Random(7)
FW, FD, GAP = 0.9, 0.6, 0.004
rows = int(2 * 12.6 / FD) + 1
for row in range(rows):
    y0 = -12.6 + row * FD
    off = (FW / 2) * (row % 2)
    x = -12.6 - off
    while x < 12.6:
        cx_, cy_ = x + FW / 2, y0 + FD / 2
        if math.hypot(cx_, cy_) < 12.3:
            # Correlated drift (ChatGPT): neighbouring flags come from the same bed of the quarry, with a
            # little jitter; its own stream so the shelves keep their layout.
            drift = 0.5 + 0.25 * math.sin(cx_ * 0.29 + cy_ * 0.13) + 0.2 * math.sin(cy_ * 0.41 - cx_ * 0.17 + 1.3)
            flags.slot = min(3, max(0, int((drift + FLOOR_RNG.gauss(0, 0.12)) * 4)))
            # Footfall: a ring round the desk where readers stand, and the line in from the entrance.
            ring = abs(math.hypot(cx_ / 1.35, (cy_ + 1.45) / 1.0) - 1.3)  # ~0.5 m off the desk edge, inside the pool
            lane = abs(cx_ + 0.3) if cy_ < -2.4 else 9.0
            wear = max(0.0, 1 - ring / 0.7) if ring < lane else max(0.0, 1 - lane / 0.9)
            if FLOOR_RNG.random() < wear * 0.85:
                flags.slot += 4
            b = len(flags.v)
            dish = random.uniform(0.0015, 0.0035)
            for j in range(3):  # 3 × 3 top grid: corners proud, the centre worn down
                for i in range(3):
                    depth = dish * (1 - abs(i - 1)) * (1 - abs(j - 1)) + dish * 0.35 * ((i == 1) ^ (j == 1))
                    flags.v.append(Vector((x + GAP / 2 + (FW - GAP) * i / 2, y0 + GAP / 2 + (FD - GAP) * j / 2, -depth)))
            for j in range(2):
                for i in range(2):
                    flags._face((b + j * 3 + i, b + j * 3 + i + 1, b + (j + 1) * 3 + i + 1, b + (j + 1) * 3 + i))
            corners = [b, b + 2, b + 8, b + 6]
            bb = len(flags.v)
            for k_ in corners:
                q = flags.v[k_]
                flags.v.append(Vector((q.x, q.y, -0.05)))
            ring = [b, b + 1, b + 2, b + 5, b + 8, b + 7, b + 6, b + 3]
            low = {b: bb, b + 2: bb + 1, b + 8: bb + 2, b + 6: bb + 3}
            for a_, c_ in ((b, b + 2), (b + 2, b + 8), (b + 8, b + 6), (b + 6, b)):  # sides
                mid = {(b, b + 2): b + 1, (b + 2, b + 8): b + 5, (b + 8, b + 6): b + 7, (b + 6, b): b + 3}[(a_, c_)]
                flags._face((a_, mid, c_, low[c_], low[a_]))
            flags._face((bb + 3, bb + 2, bb + 1, bb))
        x += FW
flags.build("C01_FLOOR", FLOORS, shell)

m = Mesh()
m.revolve(rect(R_WALL, R_WALL_OUT, 0, Z_SPRING), 0, 0, 128, full=True)
wall = m.build("C01_WALL", STONE, shell)  # one closed ring, so the entrance boolean stays manifold

# Entrance: an arched opening 3.4 m × 5.8 m at the south, cut through the wall.
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -13.6, (5.8 - 1.7) / 2))
cut = bpy.context.active_object
cut.scale = (3.4, 3.4, 5.8 - 1.7)
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=1.7, depth=3.4, location=(0, -13.6, 5.8 - 1.7), rotation=(math.radians(90), 0, 0))
arch = bpy.context.active_object
for cutter in (cut, arch):
    mod = wall.modifiers.new("entrance", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    cutter.hide_render = cutter.hide_viewport = True

# ---------------------------------------------------------------- 16 faceted bays (bay.py)
# Each bay is a flat facet of a 16-sided wall at apothem BAY_A, so the case fronts meet the gallery
# walkways (r = 11.2). Giant-order reeded pilasters stand at the facet corners from floor to springline.
BAY_A, CASE_D = 11.65, 0.45
HALF_CHORD = BAY_A * math.tan(math.radians(11.25))
CASE_TIERS = ((0.35, 5.55), (GALLERY_Z[0], 11.55), (GALLERY_Z[1], 17.6))
ENT_W, ENT_H = 3.4, 5.8
shelves = collection("C01_SHELVES")
stone_m, reeds_m, wall_m, wood_m = kit.Mesh(), kit.Mesh(), kit.Mesh(), kit.Mesh()
frame_count = 0
for i in range(16):
    th_c = i * 22.5
    T = tangent(th_c)
    f = bay.Frame(polar(BAY_A, th_c) - T * HALF_CHORD, T, radial(th_c))
    L = 2 * HALF_CHORD
    # The pilaster stands on the corner between facets i−1 and i, square to the bisector, so it closes
    # both case ends instead of following one facet (code review, 2 Nov).
    th_k = th_c - 11.25
    bay.pilaster(stone_m, reeds_m, bay.Frame(polar(BAY_A / math.cos(math.radians(11.25)), th_k), tangent(th_k), radial(th_k)), 0.0, Z_SPRING, 0.62, 0.42)
    if i == ENTRANCE_BAY:
        # Ashlar around the entrance, with a semicircular arch of 13 voussoirs and a keystone.
        x0, x1 = HALF_CHORD - ENT_W / 2, HALF_CHORD + ENT_W / 2
        f.box(wall_m, 0, 0, 0, x0, 0.5, Z_SPRING)
        f.box(wall_m, x1, 0, 0, L, 0.5, Z_SPRING)
        f.box(wall_m, x0, 0, ENT_H + 0.55, x1, 0.5, Z_SPRING)
        rad = ENT_W / 2
        for k in range(13):
            a0, a1 = math.pi * k / 13, math.pi * (k + 1) / 13
            am = (a0 + a1) / 2
            mid = f.p(HALF_CHORD + (rad + 0.25) * math.cos(am), 0.2, ENT_H - rad + (rad + 0.25) * math.sin(am))
            radial_dir = f.dir(math.cos(am), 0, math.sin(am))
            tang_dir = f.dir(-math.sin(am), 0, math.cos(am))
            wall_m.obox(mid - f.N * (0.06 if k == 6 else 0.0), tang_dir, f.N, radial_dir, (rad + 0.25) * (a1 - a0) - 0.012, 0.55 + (0.12 if k == 6 else 0), 0.5)
        for side in (-1, 1):  # spandrels between the arch and the square head
            for k in range(6):
                zz = ENT_H - rad + rad * k / 6
                half = math.sqrt(max(0.0, (rad + 0.5) ** 2 - (zz - (ENT_H - rad)) ** 2))
                xa = HALF_CHORD + side * half
                xb = x1 if side > 0 else x0
                f.box(wall_m, min(xa, xb), 0.05, zz, max(xa, xb), 0.45, zz + rad / 6 + 0.01)
        # The passage through to the outer wall.
        for xs in (x0, x1):
            f.box(wall_m, xs - (0.3 if xs == x0 else 0), 0.5, 0, xs + (0.3 if xs == x1 else 0), 3.0, ENT_H + 0.55)
        f.box(wall_m, x0 - 0.3, 0.5, ENT_H, x1 + 0.3, 3.0, ENT_H + 0.6)
    else:
        f.box(wall_m, 0, 0, 0, L, 0.5, Z_SPRING)  # coursed ashlar facet behind the cases
    for t, (z0, z1) in enumerate(CASE_TIERS):
        if i == ENTRANCE_BAY and t == 0:
            continue
        frame_count += 1
        tops = bay.case(wood_m, f, 0.41, L - 0.41, z0, z1, CASE_D)  # clear of the bisector-square pilasters
        # Bays behind the hero camera carry simple books; everything the camera sees gets bound volumes.
        simple = LOOK != "hero" or 100 < th_c < 260 or bool(os.environ.get("WEB"))  # WEB=1: one box per book for the GLB
        b = bay.Books(M, random.Random(1102 + 31 * i + t), simple=simple)
        b.fill(f, 0.41, L - 0.41, tops, 0.42, CASE_D, flip=(i, t) in INVERTED_NICHES)
        b.build(f"C01_BOOKS_{i:02d}_{t}", shelves)
stone_m.build("C01_PILASTERS", STONE, shell)
reeds_m.build("C01_REEDS", STONE, shell, smooth=True)
wall_m.build("C01_BAY_WALLS", MASONRY, shell)
wood_m.build("C01_SHELF_CASES", WOOD, shelves)
m = Mesh()
m.revolve(rect(BAY_A - 0.6, R_WALL_OUT, Z_SPRING - 0.05, Z_SPRING + 0.3), 0, 0, 128, full=True)  # springline ledge under the dome
m.build("C01_SPRING_LEDGE", STONE, shell)

# ---------------------------------------------------------------- conventional galleries
galleries = collection("C01_GALLERIES")


def gallery(name, z, th0, th1, full):
    g = Mesh()
    steps = 128 if full else max(8, int((th1 - th0) / 2.5))
    g.revolve(rect(R_GAL0, R_GAL1, z - 0.28, z), th0, th1, steps, full)
    g.revolve(rect(R_GAL0 - 0.04, R_GAL0 + 0.12, z - 0.5, z - 0.28), th0, th1, steps, full)  # fascia
    g.slot = 1
    g.revolve(rect(R_GAL0 - 0.05, R_GAL0 + 0.09, z + 0.98, z + 1.04), th0, th1, steps, full)  # brass top rail
    g.slot = 0
    g.revolve(rect(R_GAL0 - 0.02, R_GAL0 + 0.06, z + 0.08, z + 0.14), th0, th1, steps, full)  # bottom rail
    span = 360.0 if full else th1 - th0
    n = int(math.radians(span) * R_GAL0 / 0.22)
    for k in range(n):
        g.box_at(R_GAL0 + 0.02, th0 + span * (k + 0.5) / n, z + 0.56, 0.05, 0.05, 0.84)
    return g.build(name, [STONE, METAL], galleries)


gallery("C01_GALLERY_LOWER", GALLERY_Z[0], CORR_TH[1], 360 + CORR_TH[0], False)
gallery("C01_GALLERY_UPPER", GALLERY_Z[1], 0, 0, True)

# ---------------------------------------------------------------- the anomaly: a corridor that turns
returning = collection("C01_GALLERY_RETURNING")
th0, th1 = CORR_TH
ARC_LEN = math.radians(th1 - th0) * CORR_R
ROOM_DU = ROOM_LEN / ARC_LEN / 2


def theta(u):
    return th0 + (th1 - th0) * u


def walk_frame(seg, u):
    """For segment 0 / 1 / 2: centre of the walking surface, its width axis W and its 'up' n."""
    th = theta(u)
    N, base = radial(th), polar(CORR_R, th, CORR_Z)
    if seg == 0:
        return base, N, Z  # floor
    if seg == 1:
        return base + N * CORR_HW + Z * (CORR_H / 2), Z, -N  # outer wall
    return base + Z * CORR_H, N, -Z  # ceiling


def half_width(seg):
    return CORR_H / 2 if seg == 1 else CORR_HW


SPANS = [(0.0, ROOM_U[0] - ROOM_DU), (ROOM_U[0] + ROOM_DU, ROOM_U[1] - ROOM_DU), (ROOM_U[1] + ROOM_DU, 1.0)]
rib = Mesh()
for seg, (u0, u1) in enumerate(SPANS):
    hw = half_width(seg)
    steps = max(6, int(60 * (u1 - u0)))
    frames = [walk_frame(seg, u0 + (u1 - u0) * s / steps) for s in range(steps + 1)]
    rib.sweep(frames, [(-hw, -0.3), (hw, -0.3), (hw, 0.0), (-hw, 0.0)])  # the walking slab
    rib.sweep(frames, [(-hw + 0.15, -0.55), (hw - 0.15, -0.55), (hw - 0.15, -0.3), (-hw + 0.15, -0.3)])  # soffit beam
    # Balustrade on the open edge (the upper edge of the wall segment), brass top rail.
    edges = (hw - 0.04,) if seg == 1 else (-hw + 0.04,)
    for e in edges:
        rib.slot = 1
        rib.sweep(frames, [(e - 0.07, 0.98), (e + 0.07, 0.98), (e + 0.07, 1.04), (e - 0.07, 1.04)])
        rib.slot = 0
        rib.sweep(frames, [(e - 0.03, 0.08), (e + 0.03, 0.08), (e + 0.03, 0.14), (e - 0.03, 0.14)])
        n_posts = int((u1 - u0) * ARC_LEN / 0.22)
        for k in range(n_posts):
            u = u0 + (u1 - u0) * (k + 0.5) / n_posts
            o, W, n = walk_frame(seg, u)
            rib.obox(o + W * e + n * 0.56, tangent(theta(u)), W, n, 0.05, 0.05, 0.84)
    # A low bookcase along the back edge, with books standing on it in the segment's own gravity.
    back = hw - 0.25 if seg != 1 else -(hw - 0.25)
    steps_b = int((u1 - u0) * ARC_LEN / 0.06)
    s = 0
    u = u0 + 0.02
    while u < u1 - 0.02:
        o, W, n = walk_frame(seg, u)
        T = tangent(theta(u))
        w = random.uniform(0.03, 0.075) / ARC_LEN
        rib.slot = 2
        rib.obox(o + W * back + n * 0.45, T, W, n, w * ARC_LEN + 0.002, 0.42, 0.9)
        rib.slot = 3 + pick_book()
        h = random.uniform(0.22, 0.36)
        rib.obox(o + W * back + n * (0.9 + h / 2), T, W, n, w * ARC_LEN * 0.92, 0.24, h)
        u += w
    rib.slot = 0

# The two stone rooms where the walking surface turns: thick-walled, open at both ends to the
# corridor, with a doorway on the side that faces the rotunda: upright in the first, sideways in the second.
ROOM_LIGHTS = []
MASONRY_SLOT = 3 + len(BOOKS)
rib.slot = MASONRY_SLOT
for k, u in enumerate(ROOM_U):
    th = theta(u)
    T, N = tangent(th), radial(th)
    o = polar(CORR_R, th, CORR_Z + CORR_H / 2)
    wall_t, out_w, out_h = 0.32, 2 * CORR_HW + 0.64, CORR_H + 0.64
    rib.obox(o - Z * (CORR_H / 2 + wall_t / 2), T, N, Z, ROOM_LEN, out_w, wall_t)  # floor slab
    rib.obox(o + Z * (CORR_H / 2 + wall_t / 2), T, N, Z, ROOM_LEN, out_w, wall_t)  # roof slab
    rib.obox(o + N * (CORR_HW + wall_t / 2), T, N, Z, ROOM_LEN, wall_t, CORR_H)  # back wall
    # Front wall with a doorway: 1.0 × 1.9 upright in room one, 1.9 × 1.0 sideways in room two.
    dw, dh = (1.0, 1.9) if k == 0 else (1.9, 1.0)
    fo = o - N * (CORR_HW + wall_t / 2)
    side = (ROOM_LEN - dw) / 2
    for s_ in (-1, 1):
        rib.obox(fo + T * s_ * (dw / 2 + side / 2), T, N, Z, side, wall_t, CORR_H)
    top = (CORR_H - dh) / 2
    for s_ in (-1, 1):
        rib.obox(fo + Z * s_ * (dh / 2 + top / 2), T, N, Z, dw, wall_t, top)
    # Cornice and plinth bands so the rooms read as masonry.
    for s_ in (-1, 1):
        rib.obox(o + Z * s_ * (CORR_H / 2 + wall_t + 0.06), T, N, Z, ROOM_LEN + 0.16, out_w + 0.16, 0.12)
    # Carving: corner pilasters, rusticated courses, and an architrave + keystone + pediment around the
    # doorway that follow the doorway's own "up". Room two's pediment sits on its side.
    face = fo - N * (wall_t / 2 + 0.03)
    # Quoins: alternating long and short dressed stones up both front corners, proud of the wall face.
    n_q = 7
    q_h = (CORR_H + 0.64) / n_q
    for s_ in (-1, 1):
        for j in range(n_q):
            w_q = 0.46 if j % 2 == 0 else 0.3
            zq = -(CORR_H + 0.64) / 2 + q_h * (j + 0.5)
            rib.obox(face + T * s_ * (ROOM_LEN / 2 - w_q / 2 + 0.02) + Z * zq, T, N, Z, w_q, 0.09, q_h - 0.014)
    for zc in (-0.75, -0.25, 0.25, 0.75):
        if abs(zc) * 2 > dh + 0.1:  # rustication only above and below the opening
            for s_ in (-1, 1):
                rib.obox(face + Z * zc * CORR_H / 2 * 1.9 + T * s_ * (ROOM_LEN / 4 + dw / 4), T, N, Z, ROOM_LEN / 2 - dw / 2 - 0.3, 0.05, 0.05)
    up, across, du, da = (Z, T, dh, dw) if k == 0 else (T, Z, dw, dh)
    fr = face - N * 0.02
    for s_ in (-1, 1):  # architrave
        rib.obox(fr + up * s_ * (du / 2 + 0.07), across, N, up, da + 0.28, 0.06, 0.14)
        rib.obox(fr + across * s_ * (da / 2 + 0.07), across, N, up, 0.14, 0.06, du + 0.28)
    rib.obox(fr + up * (du / 2 + 0.12), across, N, up, 0.16, 0.08, 0.24)  # keystone
    # A ring of nine voussoirs over the head, with a projecting keystone: the arch follows the doorway's
    # own "up", so in room two it springs sideways.
    rad = da / 2 + 0.16
    for j in range(9):
        a0, a1 = math.pi * j / 9, math.pi * (j + 1) / 9
        am = (a0 + a1) / 2
        r_dir = across * math.cos(am) + up * math.sin(am)
        t_dir = -across * math.sin(am) + up * math.cos(am)
        key = j == 4
        rib.obox(fr + up * (du / 2) + r_dir * (rad + 0.12) - N * (0.04 if key else 0.0), t_dir, N, r_dir,
                 rad * (a1 - a0) - 0.014, 0.08 + (0.06 if key else 0.0), 0.26 + (0.08 if key else 0.0))
    ROOM_LIGHTS.append(o + up * (0.75 if k == 0 else 0.85))  # under its own ceiling: falloff, not a lightbox

# ChatGPT (hero-005): the sideways room needs corroborating evidence, readable from the entrance. Its "up"
# is +T, so a shelf on the back wall carries books that stand along +T, and a plumb hangs along −T.
th2 = theta(ROOM_U[1])
T2, N2 = tangent(th2), radial(th2)
side_back = polar(CORR_R, th2, CORR_Z + CORR_H / 2) + N2 * CORR_HW
SIDE_ROOM = SimpleNamespace(back=side_back, T=T2, N=N2)
rib.slot = 2
rib.obox(side_back - N2 * 0.13 - T2 * 0.55 + Z * 0.5, T2, N2, Z, 0.035, 0.26, 0.95)  # the shelf, its face to +T
rib.obox(side_back - N2 * 0.13 - T2 * 0.55 + Z * 0.5 + T2 * 0.12 + Z * 0.49, T2, N2, Z, 0.24, 0.26, 0.03)  # bookend cheek
side_rng = random.Random(23)
zb = 0.05
while zb < 0.48:
    w_b, h_b, d_b = side_rng.uniform(0.035, 0.065), side_rng.uniform(0.2, 0.34), side_rng.uniform(0.15, 0.22)
    rib.slot = 3 + side_rng.choices(range(len(BOOKS)), weights=BOOK_WEIGHTS)[0]
    rib.obox(side_back - N2 * (d_b / 2 + 0.02) - T2 * (0.5325 - h_b / 2) + Z * (zb + w_b / 2), T2, N2, Z, h_b, d_b, w_b - 0.003)
    zb += w_b
# A plain row turned 90° could pass for a flat pile; a leaner can't. One book tips back against the row in
# the room's own gravity, and a short stack lies flat (in that gravity) at the end of the shelf.
a_l, h_l, w_l, d_l = math.radians(20), 0.27, 0.05, 0.19
h_dir, w_dir = T2 * math.cos(a_l) - Z * math.sin(a_l), T2 * math.sin(a_l) + Z * math.cos(a_l)
p_l = side_back - N2 * (d_l / 2 + 0.02) - T2 * 0.5325 + Z * (zb + h_l * math.sin(a_l) + 0.004)
rib.slot = 3 + side_rng.choices(range(len(BOOKS)), weights=BOOK_WEIGHTS)[0]
rib.obox(p_l + h_dir * h_l / 2 + w_dir * w_l / 2, h_dir, N2, w_dir, h_l, d_l, w_l)
t_s = 0.5325
for j in range(3):
    t_b, z_len = side_rng.uniform(0.03, 0.05), side_rng.uniform(0.2, 0.26)
    rib.slot = 3 + side_rng.choices(range(len(BOOKS)), weights=BOOK_WEIGHTS)[0]
    rib.obox(side_back - N2 * 0.12 - T2 * (t_s - t_b / 2) + Z * (0.968 - z_len / 2 - side_rng.uniform(0.0, 0.006)), T2, N2, Z, t_b - 0.002, 0.18, z_len)
    t_s -= t_b
rib.slot = 0
# Gemini: a twin of the reading desk bolted to the wall segment, so it juts sideways into the room.
o, W, n = walk_frame(1, 0.47)
T = tangent(theta(0.47))
rib.slot = 2
rib.obox(o + n * 0.88, T, W, n, 2.4, 1.3, 0.08)
for sx in (-0.85, 0.85):
    rib.obox(o + n * 0.42 + T * sx, T, W, n, 0.55, 1.15, 0.84)
rib.slot = 0
rib.build("C01_GALLERY_RETURNING", [STONE, METAL, WOOD] + BOOKS + [ROOM_STONE], returning)

# ---------------------------------------------------------------- dome, ribs, oculus
dome_c = collection("C01_DOME")


def dome_z(r):
    return Z_SPRING + (Z_CROWN - Z_SPRING) * math.sqrt(max(0.0, 1 - (r / R_WALL) ** 2))


rs = [R_WALL - (R_WALL - R_OCULUS) * k / 48 for k in range(49)]
m = Mesh()
m.revolve([(r, dome_z(r)) for r in rs] + [(r, dome_z(r) + 0.35) for r in reversed(rs)], 0, 0, 128, full=True)
m.revolve(rect(R_OCULUS - 0.05, R_OCULUS + 0.35, dome_z(R_OCULUS) - 0.15, dome_z(R_OCULUS) + 0.05), 0, 0, 96, full=True)
for k in range(1, 4):  # coffer rings between the ribs
    r = R_WALL - (R_WALL - R_OCULUS) * k / 4
    m.revolve(rect(r - 0.12, r + 0.12, dome_z(r) - 0.22, dome_z(r) + 0.02), 0, 0, 96, full=True)
m.build("C01_DOME", STONE, dome_c)
m = Mesh()
m.revolve(rect(R_OCULUS + 0.4, R_OCULUS + 0.55, dome_z(R_OCULUS + 0.5) - 0.12, dome_z(R_OCULUS + 0.5) - 0.02), 0, 0, 96, full=True)
m.build("C01_OCULUS_RING", METAL, dome_c)
m = Mesh()
for i in range(16):
    th = (i + 0.5) * 22.5
    pts = [polar(r, th, dome_z(r) - 0.12) for r in [R_WALL - (R_WALL - R_OCULUS - 0.4) * k / 30 for k in range(31)]]
    for p0, p1 in zip(pts, pts[1:]):
        d = p1 - p0
        m.obox((p0 + p1) / 2, d.normalized(), tangent(th), d.normalized().cross(tangent(th)), d.length + 0.02, 0.35, 0.26)
m.build("C01_DOME_RIBS", STONE, dome_c)

# ---------------------------------------------------------------- desk, lamp, instrument, folio
desk_c = collection("C01_DESK")
m = kit.Mesh()
bay.reading_desk(m, (0.0, -1.45))
DESK_LEATHER = kit.pbr("desk_leather", "brown_leather", 0.09, tint=srgb("#16241B"), keep=0.08, rough=(0.3, 0.62), normal=1.8, bevel=0.002, contrast=1.15) if LOOK == "hero" else FOLIO  # hero-004 read as felt: grain lives in the sheen
m.build("C01_READING_DESK", [WOOD, DESK_LEATHER, M.gilt, METAL], desk_c, smooth=True)
# A turned brass reading lamp standing on the desk: weighted base, column, arm, and a deep shade over the page.
LAMP_HEAD = Vector((-0.42, -1.2, 1.5))
m = kit.Mesh()
base = Vector((-0.82, -1.0, 0.92))
m.lathe([(0.0, 0.0), (0.1, 0.0), (0.105, 0.012), (0.085, 0.03), (0.04, 0.045), (0.025, 0.06), (0.0, 0.06)], base, 40)
m.tube([base + Z * 0.05, base + Z * 0.58], [0.011, 0.011], 16)
arm = kit.bezier(base + Z * 0.58, base + Z * 0.66, LAMP_HEAD + Vector((-0.2, 0.1, 0.06)), LAMP_HEAD + Z * 0.04, 24)
m.tube(arm, [0.009] * len(arm), 14)
m.lathe([(0.0, 0.0), (0.016, 0.0), (0.016, 0.03), (0.0, 0.03)], base + Z * 0.56, 16)  # knuckle
m.lathe([(0.0, 0.06), (0.03, 0.06), (0.09, 0.0), (0.095, -0.01), (0.07, -0.004), (0.026, 0.05), (0.0, 0.05)], LAMP_HEAD - Z * 0.04, 40)  # shade
m.build("C01_DESK_LAMP", METAL, desk_c, smooth=True)
m = kit.Mesh()
m.lathe([(0.0, 0.0), (0.016, 0.006), (0.018, 0.03), (0.0, 0.045)], LAMP_HEAD - Z * 0.06, 16)
m.build("C01_DESK_LAMP_BULB", M.bulb if LOOK == "hero" else WARM_BULB, desk_c, smooth=True)

inst = collection("C01_MERIDIAN_INDEX")
CENTRE = Vector((-4.3, -2.2, 6.4))  # ruled 2 Nov: left, out of the anomaly's silhouette; lowered to stay whole in the hero frame
for k, (r, rot) in enumerate(((1.225, (0, 0, 0)), (1.13, (61, 0, 22)), (1.04, (-26, 45, 0)))):
    m = Mesh()
    m.revolve(rect(r - 0.035, r, -0.05, 0.05), 0, 0, 128, full=True)
    for g in range(72):  # engraved gradations
        m.box_at(r - 0.04, g * 5.0, 0.0, 0.008, 0.012, 0.07 if g % 6 else 0.1)
    ring = m.build(f"C01_INDEX_RING_{k + 1}", METAL, inst)
    ring.location = CENTRE
    ring.rotation_mode = "XYZ"
    ring.rotation_euler = tuple(math.radians(v) for v in rot)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.135, location=CENTRE, segments=48, ring_count=24)
core = bpy.context.active_object
core.name = "C01_INDEX_CORE"
for col in core.users_collection:
    col.objects.unlink(core)
inst.objects.link(core)
core.data.materials.append(ENAMEL)
bpy.ops.object.shade_smooth()
m = Mesh()
# Two slender rods from the outer ring's crown up to the oculus ring, splayed so they read as engineered.
az = math.degrees(math.atan2(CENTRE.x, CENTRE.y))
for side in (-1, 1):
    top = polar(R_OCULUS + 0.47, az + side * 28, dome_z(R_OCULUS + 0.5) - 0.12)
    bot = CENTRE + Vector((side * 0.22, 0, 1.225))
    d = top - bot
    ax = d.normalized()
    m.obox((top + bot) / 2, ax, ax.orthogonal().normalized(), ax.cross(ax.orthogonal()).normalized(), d.length, 0.03, 0.03)
m.build("C01_INDEX_RODS", METAL, inst)

folio = collection("C01_FOLIO_FRONTIER")
m = kit.Mesh()
bay.folio(m, (0.0, -1.36), z=0.9216)
m.build("C01_FOLIO_FRONTIER", [FOLIO, M.paper, M.gilt], folio, smooth=True)
m = Mesh()
m.obox(Vector((0, -1.36, 0.94)), X, Y, Z, 0.52, 0.64, 0.04)  # HIT_FOLIO click proxy, never rendered
hit = m.build("HIT_FOLIO", STONE, folio)
hit.hide_render = True

# ---------------------------------------------------------------- plumb lines: the proof of local gravity
props = collection("C01_PLUMB_LINES")
m = Mesh()


m = kit.Mesh()
bay.plumb(m, Vector((0.85, -1.75, 0.9216)), Z, X)
for seg, u in ((0, 0.14), (1, 0.6), (2, 0.86)):
    o, W, n = walk_frame(seg, u)
    bay.plumb(m, o + W * (0.15 if seg != 1 else 0.3), n, tangent(theta(u)), 3.0)
# The sideways room's plumb: a bracket off the back wall, the line and bob falling along −T, scaled to read
# at ~9 m from the entrance.
p0 = SIDE_ROOM.back + SIDE_ROOM.T * 0.8 + Z * 0.25
p1 = p0 - SIDE_ROOM.N * 0.6
m.tube([p0, p1], [0.014, 0.012], 12)
m.lathe([(0.0, 0.0), (0.03, 0.0), (0.03, 0.02), (0.0, 0.02)], p0 - SIDE_ROOM.N * 0.01, 16, axis_up=-SIDE_ROOM.N)  # rose
m.tube([p1, p1 - SIDE_ROOM.T * 0.95], [0.0025, 0.0025], 6)
bob = p1 - SIDE_ROOM.T * 0.95
m.lathe([(0.0, 0.0), (0.03, -0.01), (0.055, -0.06), (0.04, -0.11), (0.0, -0.17)], bob, 24, axis_up=SIDE_ROOM.T)
m.build("C01_PLUMB_LINES", METAL, props, smooth=True)

# ---------------------------------------------------------------- lighting
lights = collection("C01_LIGHTS")


def kelvin(k):
    """Approximate blackbody linear RGB (Tanner Helland), for when the light has no temperature API."""
    t = k / 100.0
    r = 255 if t <= 66 else 329.698727446 * (t - 60) ** -0.1332047592
    g = 99.4708025861 * math.log(t) - 161.1195681661 if t <= 66 else 288.1221695283 * (t - 60) ** -0.0755148492
    b = 255 if t >= 66 else (0 if t <= 19 else 138.5177312231 * math.log(t - 10) - 305.0447927307)
    return tuple(max(0.0, min(1.0, x / 255.0)) ** 2.2 for x in (r, g, b))


def light(name, kind, pos, target, kelvin_k, watts, size=None, size_y=None, shape="RECTANGLE"):
    data = bpy.data.lights.new(name, kind)
    data.energy = watts
    try:
        data.use_temperature = True
        data.temperature = kelvin_k
    except AttributeError:
        data.color = kelvin(kelvin_k)
    if kind == "AREA":
        data.shape = shape
        data.size = size
        if size_y:
            data.size_y = size_y
    elif kind == "POINT":
        data.shadow_soft_size = 0.06
    ob = bpy.data.objects.new(name, data)
    lights.objects.link(ob)
    ob.location = pos
    if target is not None:
        ob.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    ob.visible_camera = False
    return ob


# Six crafted sconces on pilaster faces at walkway height of the lower gallery, clear of the anomaly's arc.
sconce_brass, sconce_glass, sconce_bulb = kit.Mesh(), kit.Mesh(), kit.Mesh()
SCONCES = []
for i in (5, 7, 10, 12, 14, 15):
    T_ = tangent(i * 22.5)
    th_k = i * 22.5 - 11.25  # the corner pilaster, square to its bisector
    f_ = bay.Frame(polar(BAY_A / math.cos(math.radians(11.25)), th_k), tangent(th_k), radial(th_k))
    SCONCES.append(bay.sconce(sconce_brass, sconce_glass, sconce_bulb, f_, 0.0, GALLERY_Z[0] + 1.45))
if LOOK == "hero":
    # Gemini's rig: one brutal source. Daylight falls through the oculus as a hard shaft onto the desk;
    # most of the chamber lives in shadow. Warm practicals answer it; the turning rooms glow from inside.
    oc = Vector((0, 0, dome_z(R_OCULUS)))
    shaft = c.sun_toward(sc, float(os.environ.get("SUN", "24.0")), kelvin(int(os.environ.get("SUN_K", "5100"))), tuple(Vector((0, -1.45, 0.92)) - oc), angle_deg=float(os.environ.get("SUN_ANGLE", "4.0")))
    shaft.name = "L01_OCULUS_SHAFT"
    c.backdrop(sc, srgb("#9DB4D6"), float(os.environ.get("SKY", "22")))  # sky through the oculus and the entrance; its fill is what makes the pool daylight
    # SKY_HAZE=0 keeps the sky out of the haze: it fills the floor and the desk, the haze stays the sun's.
    sc.world.cycles_visibility.scatter = os.environ.get("SKY_HAZE", "0") != "0"
    light("L02_CORRIDOR_GRAZE", "AREA", (7.5, -2.0, 3.5), polar(CORR_R, 27, CORR_Z + 1.1), 3600, 120, 1.5, 0.8)
    light("L04_DESK_PRACTICAL", "SPOT", LAMP_HEAD - Z * 0.05, None, 2750, float(os.environ.get("DESK_W", "40"))).data.spot_size = math.radians(110)
    for k, p in enumerate(SCONCES):
        light(f"L05_SCONCE_{k + 1}", "POINT", p, None, 2700, 45)
    for k, p in enumerate(ROOM_LIGHTS):
        light(f"L07_ROOM_{k + 1}", "POINT", p, None, 2700, 70)  # 220 W turned the doorways into lightboxes
    # Each segment is lit from its own local ceiling, so the light itself obeys the turning gravity.
    for seg, (u0, u1) in enumerate(SPANS):
        um = (u0 + u1) / 2
        o, W, n = walk_frame(seg, um)
        length = (u1 - u0) * ARC_LEN * 0.8
        lt = light(f"L09_CORRIDOR_{seg + 1}", "AREA", o + n * 2.05, o, 2900, 90, 0.35, length)
        lt.rotation_euler = (-n).to_track_quat("-Z", "Y").to_euler()
        lt.rotation_mode = "QUATERNION"
        t = tangent(theta(um))
        lt.rotation_quaternion = (-n).to_track_quat("-Z", "Y") if abs(t.dot((-n).to_track_quat("-Z", "Y") @ Vector((0, 1, 0)))) > 0.7 else (-n).to_track_quat("-Z", "X")
    light("L08_ABYSS_BOUNCE", "AREA", (0, 0, 0.05), (0, 0, 10), 9000, 120, 8.0, shape="DISK")  # never obviously blue
    # Haze with drifting density, so the shaft has the texture of real air rather than a uniform cylinder.
    haze = c.haze(sc, (0, 0, 12.0), (26.0, 26.0, 24.0), 1.0, (0.92, 0.94, 0.97))
    nt = haze.data.materials[0].node_tree
    vol = next(n for n in nt.nodes if n.type == "PRINCIPLED_VOLUME")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    noise = c.node(nt, "ShaderNodeTexNoise", Scale=0.9, Detail=4.0, Roughness=0.6)
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    shape = nt.nodes.new("ShaderNodeMapRange")
    shape.inputs["From Min"].default_value, shape.inputs["From Max"].default_value = 0.35, 0.75
    base = float(os.environ.get("HAZE", "0.009"))
    shape.inputs["To Min"].default_value, shape.inputs["To Max"].default_value = base * 0.15, base * 2.2
    nt.links.new(noise.outputs["Fac"], shape.inputs["Value"])
    # Dust settles: the air thins with height, so the column is densest near the floor and clears
    # around the gallery band, where it would otherwise veil the first turning room.
    xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], xyz.inputs["Vector"])
    fall = nt.nodes.new("ShaderNodeMapRange")
    fall.inputs["From Min"].default_value, fall.inputs["From Max"].default_value = -0.5, 0.0
    fall.inputs["To Min"].default_value, fall.inputs["To Max"].default_value = 1.0, 0.3
    nt.links.new(xyz.outputs["Z"], fall.inputs["Value"])
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    nt.links.new(shape.outputs["Result"], mul.inputs[0])
    nt.links.new(fall.outputs["Result"], mul.inputs[1])
    nt.links.new(mul.outputs["Value"], vol.inputs["Density"])
    sconce_brass.build("C01_SCONCES", METAL, lights, smooth=True)
    sconce_glass.build("C01_SCONCE_SHADES", M.glass, lights, smooth=True)
    sconce_bulb.build("C01_SCONCE_BULBS", M.bulb, lights, smooth=True)
else:
    light("L01_OCULUS_KEY", "AREA", (0, 0, 24.15), (0, -0.4, 5.0), 6100, 3500, 4.2, shape="DISK")
    light("L02_GALLERY_GRAZE", "AREA", (8.2, -0.7, 15.6), (5.7, 6.5, 12.1), 3900, 1800, 4.0, 1.8)
    light("L03_DEEP_FILL", "AREA", (-8.0, 1.5, 12.5), (-0.5, 1.4, 6.0), 4300, 850, 4.0, 2.0)
    light("L04_DESK_PRACTICAL", "AREA", (-0.65, -1.0, 2.25), (0, -1.4, 0.96), 2750, 110, 0.5, 0.35)
    for k, p in enumerate(SCONCES):
        light(f"L05_SCONCE_{k + 1}", "POINT", p, None, 2700, 35)
    c.backdrop(sc, (0.78, 0.82, 0.9), 0.08)

# ---------------------------------------------------------------- cameras
cams = collection("C01_CAMERAS")


def camera(name, pos, target, lens, level=False):
    data = bpy.data.cameras.new(name)
    data.lens, data.sensor_width, data.sensor_fit, data.clip_end = lens, 36, "HORIZONTAL", 200
    ob = bpy.data.objects.new(name, data)
    cams.objects.link(ob)
    ob.location = pos
    if level:
        # Pitch 0° keeps verticals parallel; lens shift puts the target where the pitch would have.
        d = Vector(target) - Vector(pos)
        flat = Vector((d.x, d.y, 0))
        c.aim(ob, Vector(pos) + flat)
        data.shift_y = (lens / 36.0) * (d.z / flat.length)
    else:
        c.aim(ob, target)
    return ob


A_POS, A_TGT = (-2.0, -12.4, 1.78), (0.8, 2.3, 6.9)
A_IN = (-1.0, -12.4, 1.78)  # inside the 3.4 m entrance; the contract's x = −2.0 sat behind a pilaster
CAMS = {
    "A": camera("CAM_A", A_POS, A_TGT, 19),
    "A_LEVEL": camera("CAM_A_LEVEL", A_POS, A_TGT, 19, level=True),
    "A_IN": camera("CAM_A_IN", A_IN, A_TGT, 19, level=True),
    "A_IN24": camera("CAM_A_IN24", A_IN, A_TGT, 24, level=True),
    "A_IN28": camera("CAM_A_IN28", A_IN, A_TGT, 28, level=True),
    # The hero: A_IN at 24 mm, aimed a little lower so the pool of light on the floor stays in frame.
    "HERO": camera("CAM_HERO", A_IN, (0.8, 2.3, float(os.environ.get("HERO_TZ", "4.8"))), 24, level=True),
    "B": camera("CAM_B", (3.6, -5.5, 2.55), (0.0, -1.45, 1.05), 38),
    "DESK": camera("CAM_DESK", (1.25, -3.05, 1.3), (0.1, -1.45, 0.75), 45),
    "C": camera("CAM_C", (0.52, -2.47, 1.67), (0.0, -1.36, 0.98), 68),
}
# The web's reflection probe: an equirect from just above the desk (run it alone, CAMS=PANO EXR=1 at 2:1).
# Rotation (90°, 0, −90°) is Blender's environment-texture convention, so the EXR maps like a world HDRI.
PANO_Z = float(os.environ.get("PANO_Z", "3.0"))  # high enough that the desk doesn't fill the lower hemisphere
CAMS["PANO"] = camera("CAM_PANO", (0.0, -1.45, PANO_Z), (0.0, 5.0, PANO_Z), 24)
CAMS["PANO"].data.type, CAMS["PANO"].data.panorama_type = "PANO", "EQUIRECTANGULAR"
CAMS["PANO"].rotation_euler = (math.pi / 2, 0.0, -math.pi / 2)
# The web's Desk stance (ChamberScene's DESK_POSE: three (x, y, z) is Blender (x, −z, y)), to judge the
# off-Threshold air term against Cycles: level, 58° horizontal, lens shift −0.1.
WD_POS, WD_DIR = Vector((-0.35, -4.75, 1.52)), Vector((0.06, 1.0, 0.0)).normalized()
CAMS["WEB_DESK"] = camera("CAM_WEB_DESK", tuple(WD_POS), tuple(WD_POS + 3.3 * WD_DIR), 18.0 / math.tan(math.radians(29.0)), level=True)
CAMS["WEB_DESK"].data.shift_y = -0.1
# ... and the Book stance (bookPose): from the FRONTIER volume's box centre + BOOK_FROM, 40° horizontal.
bpy.context.view_layer.update()
_fc = [o.matrix_world @ Vector(v) for o in sc.objects if o.name.startswith("C01_FOLIO_FRONTIER") and o.type == "MESH" for v in o.bound_box]
if _fc:
    _c = (Vector(map(min, *[tuple(p) for p in _fc])) + Vector(map(max, *[tuple(p) for p in _fc]))) / 2
    CAMS["WEB_BOOK"] = camera("CAM_WEB_BOOK", tuple(_c + Vector((0.45, -1.15, 0.62))), tuple(_c), 18.0 / math.tan(math.radians(20.0)))

# ---------------------------------------------------------------- manifest + renders
os.makedirs(a["out"], exist_ok=True)
manifest = {
    "look": LOOK,
    "seed": 1102,
    "shelf_frames": frame_count,
    "shelf_frames_note": "48 in the contract; the entrance replaces bay 8's lower frame",
    "pilasters": 16,
    "vault_arches": 16,
    "dome_ribs": 16,
    "returning_corridor": {"radius": CORR_R, "z": [CORR_Z, CORR_Z + CORR_H], "theta": CORR_TH, "arc_m": round(ARC_LEN, 2), "rooms_at_u": ROOM_U},
    "objects": sorted(o.name for o in sc.objects if o.type == "MESH" and not o.hide_render),
    "cameras": {k: {"location": list(v.location), "rotation_euler": list(v.rotation_euler), "lens": v.data.lens, "shift_y": round(v.data.shift_y, 4)} for k, v in CAMS.items()},
}
with open(os.path.join(a["out"], f"{LOOK}-manifest.json"), "w") as fh:
    json.dump(manifest, fh, indent=2)
print("MANIFEST", json.dumps({k: manifest[k] for k in ("look", "shelf_frames", "returning_corridor")}))

if os.environ.get("SAVE_BLEND"):
    bpy.ops.wm.save_as_mainfile(filepath=os.environ["SAVE_BLEND"])
if os.environ.get("RAYCHECK"):
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    for o in sc.objects:
        if o.name.startswith("haze"):
            o.hide_viewport = True
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    start = Vector((0, -1.45, 1.0))
    d = (Vector((0, 0, dome_z(R_OCULUS))) - Vector((0, -1.45, 0.92))).normalized()
    hit, loc, nrm, idx, obj, mtx = sc.ray_cast(deps, start, d, distance=100)
    print("RAY", hit, tuple(round(x, 2) for x in loc) if hit else None, obj.name if hit else None)
    w = sc.objects["C01_WALL"].evaluated_get(deps)
    print("WALL faces after boolean", len(w.data.polygons))
for key in [k for k in os.environ.get("CAMS", "HERO").split(",") if k and k != "NONE"]:
    sc.camera = CAMS[key]
    # BORDERS=name:x0,y0,x1,y1;... renders only those regions of the HERO frame (image fractions, top-left
    # origin): matched gate crops at full resolution without paying for the whole frame.
    regions = [r.split(":") for r in os.environ.get("BORDERS", "").split(";") if r] if key == "HERO" else []
    for name, box in regions:
        x0, y0, x1, y1 = (float(v) for v in box.split(","))
        r_ = sc.render
        r_.use_border, r_.use_crop_to_border = True, True
        r_.border_min_x, r_.border_max_x, r_.border_min_y, r_.border_max_y = x0, x1, 1 - y1, 1 - y0
        # SKIES=0.9,2.5,... repeats each region per sky-fill strength, so one scene build answers a sweep.
        # SHAFTS=24@1.2,14@3.5,... does the same for the oculus sun (strength@angle in degrees).
        for sky in [v for v in os.environ.get("SKIES", "").split(",") if v] or [None]:
            if sky is not None:
                sc.world.node_tree.nodes["Background"].inputs["Strength"].default_value = float(sky)
            for sh in [v for v in os.environ.get("SHAFTS", "").split(",") if v] or [None]:
                if sh is not None:
                    e_, ang = sh.split("@")
                    shaft.data.energy, shaft.data.angle = float(e_), math.radians(float(ang))
                tag = (f"-sky{sky}" if sky else "") + (f"-sun{sh}" if sh else "")
                c.render(sc, os.path.join(a["out"], f"{LOOK}-{key}-{name}{tag}.png"))
    sc.render.use_border = False
    if regions:
        continue
    c.render(sc, os.path.join(a["out"], f"{LOOK}-{key}.png"))
    if os.environ.get("EXR"):  # scene-linear master for grading (ChatGPT's brief: EXR intermediate)
        fmt = sc.render.image_settings
        fmt.file_format, fmt.color_depth = "OPEN_EXR", "32"
        bpy.data.images["Render Result"].save_render(os.path.join(a["out"], f"{LOOK}-{key}.exr"))
        fmt.file_format, fmt.color_depth = "PNG", "8"
