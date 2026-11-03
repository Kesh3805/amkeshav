# THE UNWRITTEN — Chamber 001 → glTF for the WebGL phase (draft).
#
#   SAVE_BLEND=<dir>/chamber.blend CAMS=NONE blender -b -P art/unwritten/chamber.py -- <dir> 960 540 8
#   blender -b <dir>/chamber.blend -P art/unwritten/export_web.py -- <out.glb>
#
# Writes <out.glb> and <out>-camera.json. The .blend is not saved back; everything here is destructive.
# BAKE=1 also bakes diffuse lightmaps (bake_web.py: LM_MAX, LM_SAMPLES, LM_EV, LM_HAZE) into <out dir>/lightmaps/
# and tags each baked node with glTF extras {"lightmap": "lightmaps/<node>.png", "lightmap_ev": EV}.
# Order: 1 batches → 2 UVs → (bake) → 3 flatten → 4 export → 5 camera.
#
# 1. Batches: every render-visible mesh is evaluated (the entrance boolean applied), split by material and
#    joined per (top-level collection, material); if that exceeds MAX_BATCHES, the material with the most
#    batches is merged across collections until it fits. Render-hidden helpers (boolean cutters) and volume
#    -only objects (haze) are dropped. HIT_FOLIO is kept alone, with extras {"invisible": true} and an
#    untouched material, as the web's click proxy.
# 2. UVs: UV0 "UVMap" is created as a box projection in world metres / the material's tile size (the
#    1/Scale of its Mapping node when it samples an image, else 1 m), matching kit.pbr's object-space box
#    projection (all chamber objects sit at the identity transform). UV1 "lightmap" is a Smart UV Project
#    per batch with a 4 px island gap at that batch's lightmap size (bake_web.sizes, by surface area).
#    glTF drops UV names: TEXCOORD_0 = UVMap, TEXCOORD_1 = lightmap.
# 3. Materials: each node tree is replaced by a bare Principled BSDF whose constants are *estimated by
#    walking the original graph* (see estimate()): image textures → mean of the (linearised) scan, noise /
#    wave → 0.5, local AO → 0.9, Map Range / Math / Mix / RGB-to-BW / colour ramps evaluated on those
#    estimates. The kit's tint recipe (scan luminance ÷ SCAN_MEAN ≈ 1, × tint, mixed with `keep` of the
#    scan) therefore lands on ≈ tint·(1−keep) + scan_mean·keep. Normal maps, bevels, bump, anisotropy are
#    dropped. No texture baking here (diffuse lightmaps: BAKE=1, see bake_web.py).
#
#    Mapping (linear RGB), measured on the test export of 3 Nov 2026 (MATMAP lines print it every run):
#    material             source recipe                                  base colour (linear)      rough  metal
#    limestone            pbr beige_wall_001 2.2 m, #9A9284 keep .55    (0.332, 0.274, 0.207)     0.77   0
#    masonry              pbr sandstone_blocks_08 2.4 m, #A39A8A .50    (0.372, 0.306, 0.215)     0.70   0
#    floor_limestone_0..3 pbr beige_wall_001 1.3 m, #5F574C..#736A5C   (0.193, 0.154, 0.113) ..  0.48   0
#                                                                        (0.231, 0.186, 0.136)
#    room_stone           pbr sandstone_blocks_08 1.6 m, #776E61 .50    (0.281, 0.223, 0.148)     0.74   0
#    walnut               pbr dark_wood 1.6 m, #231B16 keep 0           (0.017, 0.011, 0.008)     0.46   0
#    desk_leather         pbr brown_leather 0.09 m, #16241B .08        (0.014, 0.019, 0.011)     0.51   0
#    folio_oxide          pbr brown_leather 0.12 m, #3E1712 .05         (0.051, 0.010, 0.006)     0.62   0
#    binding_0..9         pbr brown_leather 0.06..0.132 m, BINDINGS     ~tint·.88 + scan·.12      0.48..0.85 0
#                         e.g. binding_0 #5A1A16 → (0.103, 0.013, 0.008), binding_7 vellum → (0.449, 0.358, 0.231)
#    brass                aged_brass: AO≈0.9 mixes #5E4A32→#BFA16B      (0.447, 0.304, 0.126)     0.37   1
#    gilt                 gold_leaf #D4AF6A, noise roughness .22–.42    (0.658, 0.429, 0.144)     0.32   1
#    page_edges           wave → ramp #B7A98C..#D9CDB3                  (0.584, 0.504, 0.357)     0.85   0
#    abyss_enamel         polished(#273B43): noise ramp ×0.6..×1.5      (0.021, 0.046, 0.059)     0.24   0
#    bulb                 emissive (1, .75, .48) ×25                    same + emission, KHR_materials_emissive_strength
#    frosted_glass        transmission 1, rough .45                     (1.0, 0.93, 0.82) + KHR_materials_transmission
#    joint_dust           flat                                          (0.110, 0.097, 0.083)     0.95   0
#    HIT_FOLIO            → HIT_PROXY (placeholder; the web hides the node)
#    (Exact values are printed as MATMAP lines on every run.)
# 4. Export: GLB, +Y up, no Draco, cameras on (only CAM_HERO is selected), lights off, extras on.
# 5. Camera JSON for three.js; see camera_json() for the lens-shift recipe.
import bpy, bmesh, json, math, os, sys
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bake_web

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else os.path.join(os.path.dirname(bpy.data.filepath), "chamber.glb"))
HERO, HIT = "CAM_HERO", "HIT_FOLIO"
MAX_BATCHES = 78  # + HIT_FOLIO stays under 80 meshes
LM_ANGLE = 66.0
BAKE = os.environ.get("BAKE", "") not in ("", "0")
sc = bpy.context.scene
os.makedirs(os.path.dirname(OUT), exist_ok=True)


# ---------------------------------------------------------------- 3. material estimation
_img_mean = {}


def image_mean(img):
    """Mean RGB of an image in linear space (sRGB scans are decoded first). Strided for speed."""
    if img.name not in _img_mean:
        px = np.empty(len(img.pixels), dtype=np.float32)
        img.pixels.foreach_get(px)
        rgb = px.reshape(-1, img.channels)[::7, :3].astype(np.float64)
        if img.colorspace_settings.name == "sRGB":
            rgb = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
        _img_mean[img.name] = tuple(float(x) for x in rgb.mean(axis=0))
    return _img_mean[img.name]


def as_rgb(v):
    return tuple(v) if isinstance(v, tuple) else (v, v, v)


def as_f(v):
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2] if isinstance(v, tuple) else v


def lerp(a, b, t):
    if isinstance(a, tuple) or isinstance(b, tuple):
        a, b = as_rgb(a), as_rgb(b)
        return tuple(x + (y - x) * t for x, y in zip(a, b))
    return a + (b - a) * t


def sock(node, ident):
    return next(s for s in node.inputs if s.identifier == ident)


def estimate(socket, depth=0):
    """Constant estimate of what an input socket receives: float, or an (r, g, b) tuple."""
    if not socket.is_linked or depth > 24:
        dv = getattr(socket, "default_value", 0.0)
        try:
            return tuple(dv[:3]) if len(dv) >= 3 else float(dv[0])
        except TypeError:
            return float(dv)
    link = socket.links[0]
    n, out = link.from_node, link.from_socket
    t = n.type
    ev = lambda s: estimate(s, depth + 1)
    if t == "TEX_IMAGE" and n.image:
        return image_mean(n.image) if out.name == "Color" else 1.0
    if t in ("TEX_NOISE", "TEX_WAVE", "TEX_MUSGRAVE", "TEX_GRADIENT", "TEX_MAGIC", "TEX_CHECKER"):
        return 0.5 if out.name == "Fac" else (0.5, 0.5, 0.5)
    if t == "TEX_VORONOI":
        return 0.3
    if t == "AMBIENT_OCCLUSION":
        return 0.9 if out.name == "AO" else ev(n.inputs["Color"])
    if t == "RGBTOBW":
        return as_f(ev(n.inputs["Color"]))
    if t == "VALTORGB":
        c = n.color_ramp.evaluate(max(0.0, min(1.0, as_f(ev(n.inputs["Fac"])))))
        return tuple(c[:3]) if out.name == "Color" else c[3]
    if t == "MAP_RANGE":
        v = as_f(ev(n.inputs["Value"]))
        f0, f1 = as_f(ev(n.inputs["From Min"])), as_f(ev(n.inputs["From Max"]))
        t0, t1 = as_f(ev(n.inputs["To Min"])), as_f(ev(n.inputs["To Max"]))
        k = (v - f0) / (f1 - f0) if f1 != f0 else 0.0
        if n.clamp:
            k = max(0.0, min(1.0, k))
        return t0 + (t1 - t0) * k
    if t == "MATH":
        a, b = as_f(ev(n.inputs[0])), as_f(ev(n.inputs[1]))
        return {"MULTIPLY": a * b, "ADD": a + b, "SUBTRACT": a - b, "DIVIDE": a / b if b else a,
                "MAXIMUM": max(a, b), "MINIMUM": min(a, b), "POWER": a ** b if a > 0 else 0.0}.get(n.operation, a)
    if t == "MIX":
        rgba = n.data_type == "RGBA"
        f = as_f(ev(sock(n, "Factor_Float")))
        if n.clamp_factor:
            f = max(0.0, min(1.0, f))
        a = ev(sock(n, "A_Color" if rgba else "A_Float"))
        b = ev(sock(n, "B_Color" if rgba else "B_Float"))
        if rgba and n.blend_type == "MULTIPLY":
            b = tuple(x * y for x, y in zip(as_rgb(a), as_rgb(b)))
        elif rgba and n.blend_type == "ADD":
            b = tuple(x + y for x, y in zip(as_rgb(a), as_rgb(b)))
        return lerp(a, b, f)
    if t == "MIX_RGB":
        f = as_f(ev(n.inputs["Fac"]))
        a, b = ev(n.inputs["Color1"]), ev(n.inputs["Color2"])
        if n.blend_type == "MULTIPLY":
            b = tuple(x * y for x, y in zip(as_rgb(a), as_rgb(b)))
        return lerp(a, b, f)
    if t in ("REROUTE",):
        return ev(n.inputs[0])
    if t in ("VALUE", "RGB"):
        dv = out.default_value
        return float(dv) if t == "VALUE" else tuple(dv[:3])
    return 0.5  # unknown generator: assume mid-range


def principled_of(mat):
    """The Principled BSDF that drives the material output's Surface, or None (volumes, emission-only)."""
    if not mat or not mat.node_tree:
        return None
    out = next((n for n in mat.node_tree.nodes if n.type == "OUTPUT_MATERIAL" and n.is_active_output), None)
    out = out or next((n for n in mat.node_tree.nodes if n.type == "OUTPUT_MATERIAL"), None)
    if not out or not out.inputs["Surface"].is_linked:
        return None
    n = out.inputs["Surface"].links[0].from_node
    return n if n.type == "BSDF_PRINCIPLED" else None


def tile_size(mat):
    """Metres per texture tile: 1/Mapping.Scale when the material samples an image, else 1 m."""
    nodes = mat.node_tree.nodes if mat and mat.node_tree else []
    if not any(n.type == "TEX_IMAGE" for n in nodes):
        return 1.0
    mp = next((n for n in nodes if n.type == "MAPPING"), None)
    s = mp.inputs["Scale"].default_value[0] if mp else 1.0
    return 1.0 / s if s else 1.0


def flatten(mat):
    """Replace the node tree with a bare Principled BSDF holding constant estimates. Returns the record."""
    b = principled_of(mat)
    rec = {"tile_m": round(tile_size(mat), 4)}
    vals = {
        "Base Color": as_rgb(estimate(b.inputs["Base Color"])),
        "Roughness": max(0.0, min(1.0, as_f(estimate(b.inputs["Roughness"])))),
        "Metallic": max(0.0, min(1.0, as_f(estimate(b.inputs["Metallic"])))),
        "Transmission Weight": as_f(estimate(b.inputs["Transmission Weight"])),
        "Emission Color": as_rgb(estimate(b.inputs["Emission Color"])),
        "Emission Strength": as_f(estimate(b.inputs["Emission Strength"])),
        "Alpha": as_f(estimate(b.inputs["Alpha"])),
    }
    nt = mat.node_tree
    nt.nodes.clear()
    nb = nt.nodes.new("ShaderNodeBsdfPrincipled")
    no = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(nb.outputs["BSDF"], no.inputs["Surface"])
    for k, v in vals.items():
        nb.inputs[k].default_value = (*v, 1.0) if isinstance(v, tuple) else v
    mat.diffuse_color = (*vals["Base Color"], 1.0)  # viewport / fallback
    rec.update({"base": [round(x, 4) for x in vals["Base Color"]], "rough": round(vals["Roughness"], 3),
                "metal": round(vals["Metallic"], 3)})
    if vals["Transmission Weight"] > 0:
        rec["transmission"] = round(vals["Transmission Weight"], 3)
    if vals["Emission Strength"] > 0 and max(vals["Emission Color"]) > 0:
        rec["emission"] = [round(x, 3) for x in vals["Emission Color"]]
        rec["emission_strength"] = round(vals["Emission Strength"], 2)
    return rec


# ---------------------------------------------------------------- 1. batches
def top_collection(ob):
    for col in sc.collection.children_recursive:
        if ob.name in col.objects:
            return col.name
    return "SCENE"


def ctx(objs, active):
    return bpy.context.temp_override(active_object=active, object=active, selected_objects=objs,
                                     selected_editable_objects=objs)


deps = bpy.context.evaluated_depsgraph_get()
sources, dropped, volumes = [], [], []
for ob in list(sc.objects):
    if ob.type != "MESH":
        continue
    if ob.name == HIT:
        continue
    surf = [s.material for s in ob.material_slots if principled_of(s.material)]
    if ob.hide_render or not surf:
        dropped.append(ob.name)
        if not ob.hide_render:
            volumes.append(ob)  # haze: not exported, optionally kept for the bake
        continue
    sources.append(ob)
print("DROPPED", dropped)

work = bpy.data.collections.new("WEB_EXPORT")
sc.collection.children.link(work)


def bake_copy(ob, name):
    """A world-space, modifier-applied copy of `ob` in the work collection."""
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(deps), preserve_all_data_layers=True, depsgraph=deps)
    me.transform(ob.matrix_world)
    cp = bpy.data.objects.new(name, me)
    work.objects.link(cp)
    return cp


pieces = {}  # (collection, material name) -> [objects]
for ob in sources:
    col = top_collection(ob)
    cp = bake_copy(ob, ob.name + "_web")
    me = cp.data
    used = sorted({p.material_index for p in me.polygons})
    mats = [me.materials[i] if i < len(me.materials) else None for i in range(len(me.materials))]
    for i in used:
        mat = mats[i] if i < len(mats) else None
        if not principled_of(mat):
            continue
        if len(used) == 1:
            part = cp
        else:  # split this slot out with bmesh
            bm = bmesh.new()
            bm.from_mesh(me)
            bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index != i], context="FACES")
            pm = bpy.data.meshes.new(f"{ob.name}_{mat.name}")
            bm.to_mesh(pm)
            bm.free()
            part = bpy.data.objects.new(pm.name, pm)
            work.objects.link(part)
        part.data.materials.clear()
        part.data.materials.append(mat)
        part.data.polygons.foreach_set("material_index", [0] * len(part.data.polygons))
        pieces.setdefault((col, mat.name), []).append(part)
    if len(used) > 1 or not any(cp in v for v in pieces.values()):
        bpy.data.objects.remove(cp)

# Budget: fold the material with the most per-collection batches into one, until under MAX_BATCHES.
while len(pieces) > MAX_BATCHES:
    by_mat = {}
    for col, mn in pieces:
        by_mat.setdefault(mn, []).append(col)
    mn = max(by_mat, key=lambda k: len(by_mat[k]))
    merged = sum((pieces.pop((col, mn)) for col in by_mat[mn]), [])
    pieces[("ALL", mn)] = merged

batches = []
for (col, mn), objs in sorted(pieces.items()):
    head = objs[0]
    if len(objs) > 1:
        with ctx(objs, head):
            bpy.ops.object.join()
    head.name = head.data.name = f"{col.replace('C01_', '')}__{mn}"
    batches.append(head)


def cull_hidden_book_faces(ob):
    """Rotunda books (one box each, WEB=1) show their spine, top and ends; the back sits against the case and
    the bottom on the shelf. Those faces bake black, and in an atlas of thousands of boxes their texels bleed
    into the spines, so they go. Only the rotunda's own shelves: the sideways room's gravity is not −Z."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    dead = []
    for f in bm.faces:
        c, n = f.calc_center_median(), f.normal
        radial = c.xy.normalized() if c.xy.length > 1e-6 else c.xy
        if n.z < -0.7 or (n.x * radial.x + n.y * radial.y) > 0.7:
            dead.append(f)
    bmesh.ops.delete(bm, geom=dead, context="FACES")
    bm.to_mesh(ob.data)
    bm.free()
    print(f"CULL {ob.name}: {len(dead)} hidden book faces removed", flush=True)


def cull_floor_bottoms(ob):
    """The flags are slabs. Under a top-down lightmap projection a slab's bottom face lands on its top's texels,
    and it faces the open sky under the floor: it bakes bright and overwrote the tops (the pool vanished).
    Bottoms are never seen, so they go."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    dead = [f for f in bm.faces if f.normal.z < -0.7]
    bmesh.ops.delete(bm, geom=dead, context="FACES")
    bm.to_mesh(ob.data)
    bm.free()
    print(f"CULL {ob.name}: {len(dead)} floor bottoms removed", flush=True)


for ob in batches:
    if ob.name.startswith("SHELVES__binding"):
        cull_hidden_book_faces(ob)
    elif ob.name.startswith(("SHELL__floor", "SHELL__joint")):
        cull_floor_bottoms(ob)

# HIT_FOLIO: separate, flagged, never merged.
hit_src = sc.objects.get(HIT)
hit = None
if hit_src:
    hit = bake_copy(hit_src, "HIT_FOLIO_web")
    hit_src.name = "HIT_FOLIO_src"
    hit.name = hit.data.name = HIT
    hit["invisible"] = True
    hit["role"] = "click-proxy"

# ---------------------------------------------------------------- 2. UVs
def box_uv(me, tile):
    """UV0: per-face dominant-axis projection of world coordinates, one UV unit = `tile` metres."""
    uv = me.uv_layers.new(name="UVMap")
    nl = len(me.loops)
    if not nl:
        return
    co = np.empty(len(me.vertices) * 3, dtype=np.float64)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    lv = np.empty(nl, dtype=np.int64)
    me.loops.foreach_get("vertex_index", lv)
    fn = np.empty(len(me.polygons) * 3, dtype=np.float64)
    me.polygons.foreach_get("normal", fn)
    fn = np.abs(fn.reshape(-1, 3))
    ls = np.empty(len(me.polygons), dtype=np.int64)
    lt = np.empty(len(me.polygons), dtype=np.int64)
    me.polygons.foreach_get("loop_start", ls)
    me.polygons.foreach_get("loop_total", lt)
    axis = np.repeat(np.argmax(fn, axis=1), lt)  # dominant normal axis per loop
    p = co[lv] / tile
    out = np.where(axis[:, None] == 0, p[:, [1, 2]], np.where(axis[:, None] == 1, p[:, [0, 2]], p[:, [0, 1]]))
    uv.data.foreach_set("uv", out.astype(np.float32).ravel())


def uv_fill(me, layer):
    """Fraction of the UV square covered by `layer`'s islands."""
    me.calc_loop_triangles()
    nt = len(me.loop_triangles)
    if not nt:
        return 0.0
    uv = np.empty(len(me.loops) * 2, dtype=np.float64)
    me.uv_layers[layer].data.foreach_get("uv", uv)
    lt = np.empty(nt * 3, dtype=np.int64)
    me.loop_triangles.foreach_get("loops", lt)
    t = uv.reshape(-1, 2)[lt].reshape(-1, 3, 2)
    a, b = t[:, 1] - t[:, 0], t[:, 2] - t[:, 0]
    return float(0.5 * np.abs(a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0]).sum())


LM_MIN_FILL = 0.3  # below this, the island gap is eating the atlas (many small islands, e.g. book spines)


def lightmap_uv(ob, side):
    """UV1: Smart UV Project with a bake_web.LM_PAD_PX gap at this mesh's lightmap size; the gap halves
    while the islands fill less than LM_MIN_FILL of the square, down to 0.5 px and then 0 (thousands of book
    faces: touching islands bleed a little at their edges, which beats islands too small to own a texel).
    Returns (gap px, fill)."""
    me = ob.data
    lm = me.uv_layers.new(name="lightmap")
    me.uv_layers.active = lm
    gaps = [bake_web.LM_PAD_PX / 2 ** k for k in range(4)] + [0.0]  # 4, 2, 1, 0.5, 0 px
    with ctx([ob], ob):
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        for gap in gaps:
            bpy.ops.uv.smart_project(angle_limit=math.radians(LM_ANGLE), island_margin=bake_web.island_margin(side, gap),
                                     margin_method="FRACTION", area_weight=0.0, correct_aspect=True,
                                     scale_to_bounds=False)
            bpy.ops.object.mode_set(mode="OBJECT")
            fill = uv_fill(me, "lightmap")
            if fill >= LM_MIN_FILL or gap == gaps[-1]:
                break
            bpy.ops.object.mode_set(mode="EDIT")
    me.uv_layers.active = me.uv_layers["UVMap"]
    me.uv_layers["UVMap"].active_render = True
    return gap, fill


def planar_lightmap_uv(ob):
    """UV1 for the floor: a top-down projection over the mesh's XY bounds. Smart UV made every flag its own
    island of a texel or two, so the pool came out as lit and unlit flags; a planar map keeps the light
    continuous across the joints. Bevels and flag sides collapse onto the top's texels."""
    me = ob.data
    lm = me.uv_layers.new(name="lightmap")
    co = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", co)
    xy = co.reshape(-1, 3)[:, :2]
    lo, span = xy.min(axis=0), float((xy.max(axis=0) - xy.min(axis=0)).max()) or 1.0
    vi = np.empty(len(me.loops), dtype=np.int64)
    me.loops.foreach_get("vertex_index", vi)
    pad = 2 * bake_web.LM_PAD_PX / 1024
    uv = pad + (xy[vi] - lo) / span * (1 - 2 * pad)
    lm.data.foreach_set("uv", uv.astype(np.float32).ravel())
    me.uv_layers.active = me.uv_layers["UVMap"]
    me.uv_layers["UVMap"].active_render = True
    return 0.0, uv_fill(me, "lightmap")


PLANAR = ("SHELL__floor", "SHELL__joint")

import time
lm_side = bake_web.sizes(batches + ([hit] if hit else []))
for ob in batches + ([hit] if hit else []):
    t0 = time.time()
    me = ob.data
    for l in list(me.uv_layers):
        if l.name not in ("UVMap",):
            me.uv_layers.remove(l)
    if "UVMap" not in me.uv_layers:
        box_uv(me, round(tile_size(me.materials[0]), 4) if me.materials and ob is not hit else 1.0)
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    gap, fill = planar_lightmap_uv(ob) if ob.name.startswith(PLANAR) else lightmap_uv(ob, lm_side[ob.name])
    print(f"UV {ob.name}: {len(me.polygons)} faces, lightmap {lm_side[ob.name]} px, gap {gap:g} px, "
          f"fill {fill:.2f}, {time.time() - t0:.1f}s", flush=True)


# ---------------------------------------------------------------- 2b. lightmap bake (BAKE=1, before flattening)
def bakeable(mat):
    """Diffuse surfaces only: metals, transmissive glass and emitters have no useful diffuse lighting."""
    b = principled_of(mat)
    em = as_f(estimate(b.inputs["Emission Strength"])) * max(as_rgb(estimate(b.inputs["Emission Color"])))
    return (as_f(estimate(b.inputs["Metallic"])) < 0.5 and as_f(estimate(b.inputs["Transmission Weight"])) < 0.5
            and em <= 0)


if BAKE:
    to_bake = [ob for ob in batches if bakeable(ob.data.materials[0])]
    print("LIGHTMAP skipped (metal / glass / emitter):", [ob.name for ob in batches if ob not in to_bake])
    keep_haze = os.environ.get("LM_HAZE", "") not in ("", "0")
    hide = sources + ([hit] if hit else []) + ([] if keep_haze else volumes)
    bake_web.bake(to_bake, lm_side, os.path.dirname(OUT), hide=hide)


# ---------------------------------------------------------------- 3. flatten materials (after batching, UVs and the bake)
matmap = {}
for ob in batches:
    mat = ob.data.materials[0]
    if mat.name not in matmap:
        matmap[mat.name] = flatten(mat)
if hit:
    pm = bpy.data.materials.new("HIT_PROXY")
    pm.diffuse_color = (1, 0, 1, 0.0)
    hit.data.materials.clear()
    hit.data.materials.append(pm)
for k, v in sorted(matmap.items()):
    print("MATMAP", k, json.dumps(v))


# ---------------------------------------------------------------- 5. camera JSON
def camera_json(cam):
    d = cam.data
    W, H = sc.render.resolution_x * sc.render.pixel_aspect_x, sc.render.resolution_y * sc.render.pixel_aspect_y
    aspect = W / H
    fit = d.sensor_fit if d.sensor_fit != "AUTO" else ("HORIZONTAL" if W >= H else "VERTICAL")
    if fit == "HORIZONTAL":
        hfov = 2 * math.atan(d.sensor_width / 2 / d.lens)
        vfov = 2 * math.atan(math.tan(hfov / 2) / aspect)
    else:
        vfov = 2 * math.atan(d.sensor_height / 2 / d.lens)
        hfov = 2 * math.atan(math.tan(vfov / 2) * aspect)
    mw = cam.matrix_world
    pos = mw.translation
    fwd = (mw.to_3x3() @ Vector((0, 0, -1))).normalized()
    up = (mw.to_3x3() @ Vector((0, 1, 0))).normalized()
    yup = lambda v: [round(v.x, 5), round(v.z, 5), round(-v.y, 5)]  # Blender Z-up → glTF/three Y-up
    # Blender lens shift is a fraction of the sensor-fit dimension (width here). In NDC the window moves
    # by 2·shift·(fit dimension / other dimension); positive shift_y frames higher.
    shift_ndc_y = 2 * d.shift_y * (aspect if fit == "HORIZONTAL" else 1.0)
    shift_ndc_x = 2 * d.shift_x * (1.0 if fit == "HORIZONTAL" else 1 / aspect)
    return {
        "name": HERO,
        # Flat fields read by src/components/unwritten/chamberCamera.ts (three coordinates, +Y up).
        "up_axis": "y", "position": yup(pos), "direction": yup(fwd),
        "fov_v_deg": round(math.degrees(vfov), 5), "aspect": round(aspect, 6), "sensor_fit": fit,
        "shift_x": round(d.shift_x, 6), "shift_y": round(d.shift_y, 6),
        "blender": {"position_zup": [round(x, 5) for x in pos], "rotation_euler_xyz": [round(x, 6) for x in cam.rotation_euler],
                    "lens_mm": d.lens, "sensor_width_mm": d.sensor_width, "sensor_fit": d.sensor_fit,
                    "shift_x": round(d.shift_x, 6), "shift_y": round(d.shift_y, 6), "clip": [d.clip_start, d.clip_end]},
        "render": {"width": sc.render.resolution_x, "height": sc.render.resolution_y, "aspect": round(aspect, 6)},
        "three": {
            "position": yup(pos), "direction": yup(fwd), "up": yup(up),
            "target_1m": yup(pos + fwd),
            "fov_vertical_deg_at_render_aspect": round(math.degrees(vfov), 5),
            "fov_horizontal_deg": round(math.degrees(hfov), 5),
            "sensor_fit": fit,
            "near": d.clip_start, "far": d.clip_end,
            "projection_offset_ndc": [round(shift_ndc_x, 6), round(shift_ndc_y, 6)],
        },
        "howto": (
            "PerspectiveCamera at three.position looking along three.direction (lookAt(target_1m)), up = three.up. "
            "Sensor fit is HORIZONTAL: hold the horizontal FOV and on every resize set "
            "fov = 2*atan(tan(hfov/2)/aspect) in degrees. The glTF camera's yfov is only right at the render aspect. "
            "Lens shift is NOT in the glTF. Reproduce it either with "
            "cam.setViewOffset(w, h, -shift_x*w, -shift_y*w, w, h) (w,h = canvas px; shifts are fractions of the "
            "width because fit is horizontal; negative offsetY moves the window up) or, after updateProjectionMatrix(), "
            "cam.projectionMatrix.elements[8] += 2*shift_x; cam.projectionMatrix.elements[9] += 2*shift_y*aspect; "
            "then projectionMatrixInverse.copy(projectionMatrix).invert(). Verticals stay parallel because the "
            "camera pitch is 0 (level=True in chamber.py)."
        ),
    }


cam = sc.objects.get(HERO)
cam_rec = camera_json(cam) if cam else None

# ---------------------------------------------------------------- 4. export
for o in bpy.context.view_layer.objects:
    o.select_set(False)
export = batches + ([hit] if hit else [])
for o in export:
    o.select_set(True)
if cam:
    cam.select_set(True)
bpy.context.view_layer.objects.active = export[0]
opts = dict(filepath=OUT, export_format="GLB", use_selection=True, export_cameras=True, export_lights=False,
            export_yup=True, export_draco_mesh_compression_enable=bool(os.environ.get("DRACO")), export_draco_mesh_compression_level=7,
            export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12, export_extras=True, export_apply=False,
            export_texcoords=True, export_normals=True, export_materials="EXPORT", export_animations=False,
            export_all_vertex_colors=False, export_vertex_color="NONE")
known = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
skipped = [k for k in opts if k not in known]
if skipped:
    print("GLTF option(s) not in this exporter, skipped:", skipped)
bpy.ops.export_scene.gltf(**{k: v for k, v in opts.items() if k in known})

tris = 0
for o in export:
    o.data.calc_loop_triangles()
    tris += len(o.data.loop_triangles)
mats = {m.name for o in export for m in o.data.materials if m}
size = os.path.getsize(OUT)
by_col = {}
for o in batches:
    by_col[o.name.split("__")[0]] = by_col.get(o.name.split("__")[0], 0) + len(o.data.loop_triangles)
print("STATS", json.dumps({"glb": OUT, "meshes": len(export), "triangles": tris, "materials": len(mats),
                           "bytes": size, "MB": round(size / 2 ** 20, 2)}))
print("TRIS_BY_COLLECTION", json.dumps(dict(sorted(by_col.items(), key=lambda kv: -kv[1]))))
print("TOP_BATCHES", json.dumps({o.name: len(o.data.loop_triangles) for o in sorted(batches, key=lambda o: -len(o.data.loop_triangles))[:10]}))
if cam_rec:
    cj = os.path.splitext(OUT)[0] + "-camera.json"
    with open(cj, "w") as fh:
        json.dump(cam_rec, fh, indent=2)
    print("CAMERA", cj)
else:
    print("WARNING: no", HERO, "in the scene")
