# Shared kit for THE UNWRITTEN scenes: a mesh accumulator with moulding sweeps and lathe turning,
# classical moulding profiles, and the scanned-PBR material set. Imported by section.py (and, once the
# section passes review, by chamber.py).
import bpy, bmesh, math, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(os.path.dirname(HERE), "textures")
X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
# Mean linear luminance of each 2K colour map, so a tint keeps the scan's detail without its brightness.
SCAN_MEAN = {"beige_wall_001": 0.273, "sandstone_blocks_08": 0.300, "marble_01": 0.349,
             "dark_wood": 0.042, "brown_leather": 0.037, "metal_plate": 0.035}


def srgb(h):
    """Hex swatch → linear RGB."""
    v = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in v)


def arc(cx, cy, r, a0, a1, n):
    """Points on a circular arc in a 2D profile, angles in degrees."""
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * k / n)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * k / n))) for k in range(n + 1)]


class Mesh:
    """Accumulates parts into one mesh. `slot` selects which of the object's materials the next parts use."""

    def __init__(self):
        self.v, self.f, self.mi, self.slot = [], [], [], 0

    def _face(self, f):
        self.f.append(f)
        self.mi.append(self.slot)

    def obox(self, centre, ax, ay, az, sx, sy, sz):
        b = len(self.v)
        for i in (-1, 1):
            for j in (-1, 1):
                for k in (-1, 1):
                    self.v.append(centre + ax * (i * sx / 2) + ay * (j * sy / 2) + az * (k * sz / 2))
        for q in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
            self._face(tuple(b + i for i in q))

    def box(self, x0, y0, z0, x1, y1, z1):
        self.obox(Vector(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)), X, Y, Z, x1 - x0, y1 - y0, z1 - z0)

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

    def moulding(self, path, profile, up=Z, closed=False):
        """Run a moulding profile [(out, up)] along a polyline with true mitres at the corners.
        `out` points away from the path's left side (the side a wall would be on)."""
        frames = []
        n = len(path)
        for i, p in enumerate(path):
            if closed or 0 < i < n - 1:
                t_in = (p - path[i - 1]).normalized()
                t_out = (path[(i + 1) % n] - p).normalized()
                bis = (t_in + t_out).normalized()
                side = bis.cross(up).normalized()
                side_in = t_in.cross(up).normalized()
                side = side / max(0.2, side.dot(side_in))  # mitre: stretch so both faces meet on the bisector
            else:
                t = (path[1] - path[0]) if i == 0 else (path[-1] - path[-2])
                side = t.normalized().cross(up).normalized()
            frames.append((p, side, up))
        self.sweep(frames, profile, closed=closed)

    def tube(self, points, radii, sides=16):
        """A round tube along a smooth path with rotation-minimising frames; `radii` tapers per point."""
        frames, n_prev = [], None
        for i, p in enumerate(points):
            t = (points[min(i + 1, len(points) - 1)] - points[max(i - 1, 0)]).normalized()
            if n_prev is None:
                ref = Z if abs(t.dot(Z)) < 0.9 else X
                n_prev = t.cross(ref).normalized()
            n = (n_prev - t * n_prev.dot(t)).normalized()  # parallel transport: no twist along the arm
            frames.append((p, n, t.cross(n).normalized()))
            n_prev = n
        b = len(self.v)
        for (p, n, bn), r in zip(frames, radii):
            for k in range(sides):
                a = 2 * math.pi * k / sides
                self.v.append(p + n * (r * math.cos(a)) + bn * (r * math.sin(a)))
        for s in range(len(points) - 1):
            for k in range(sides):
                q = (k + 1) % sides
                self._face((b + s * sides + k, b + s * sides + q, b + (s + 1) * sides + q, b + (s + 1) * sides + k))

    def lathe(self, profile, base, steps=24, axis_up=Z):
        """Turn an (r, h) outline about a vertical axis at `base` (balusters, finials, bobs)."""
        ref = X if abs(axis_up.dot(X)) < 0.9 else Y
        a1 = axis_up.cross(ref).normalized()
        a2 = axis_up.cross(a1).normalized()
        frames = []
        for s in range(steps):
            t = 2 * math.pi * s / steps
            frames.append((base, a1 * math.cos(t) + a2 * math.sin(t), axis_up))
        self.sweep(frames, profile, closed=True)

    def build(self, name, mats, coll, smooth=False):
        mats = mats if isinstance(mats, (list, tuple)) else [mats]
        me = bpy.data.meshes.new(name)
        me.from_pydata([tuple(v) for v in self.v], [], self.f)
        me.polygons.foreach_set("material_index", self.mi)
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
        if smooth:  # smooth turned/curved parts, keep hard edges sharp
            me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
            me.set_sharp_from_angle(angle=math.radians(40))
        ob = bpy.data.objects.new(name, me)
        coll.objects.link(ob)
        for m in mats:
            ob.data.materials.append(m)
        return ob


# ---------------------------------------------------------------- classical profiles: (out, up), metres
def base_profile(proj=0.12):
    """Attic base: plinth, lower torus, scotia, upper torus, fillet — returns to the shaft face at u = 0."""
    p = [(0.0, 0.0), (proj, 0.0), (proj, 0.08)]
    p += arc(proj - 0.035, 0.115, 0.035, -90, 90, 8)[1:]  # lower torus
    p += [(proj - 0.05, 0.15)]
    p += arc(proj - 0.03, 0.185, 0.035, -90, -270, 8)[1:]  # scotia (concave)
    p += arc(proj - 0.065, 0.24, 0.02, -90, 90, 6)[1:]  # upper torus
    p += [(0.012, 0.26), (0.012, 0.275), (0.0, 0.275)]
    return p


def capital_profile(proj=0.13):
    """Astragal, echinus (ovolo) and a thick abacus with a cavetto under its lip."""
    p = [(0.0, 0.0), (0.02, 0.0)]
    p += arc(0.02, 0.025, 0.025, -90, 90, 6)[1:]  # astragal
    p += [(0.01, 0.05), (0.01, 0.07)]
    p += arc(0.01, 0.17, 0.10, -90, 0, 8)[1:]  # echinus: quarter round swelling outward
    p += [(proj - 0.02, 0.17), (proj - 0.02, 0.19)]
    p += arc(proj, 0.19, 0.02, 180, 90, 4)[1:]  # cavetto lip
    p += [(proj, 0.3), (0.0, 0.3)]
    return p


def cornice_profile(proj=0.09):
    """Cyma recta crown over a fillet and bead: the shelf-case cornice."""
    p = [(0.0, 0.0), (0.015, 0.0)]
    p += arc(0.015, 0.012, 0.012, -90, 90, 5)[1:]  # bead
    p += [(0.02, 0.024), (0.02, 0.035)]
    p += [(0.02 + (proj - 0.03) * (0.5 - 0.5 * math.cos(math.pi * k / 10)), 0.035 + 0.06 * k / 10) for k in range(1, 11)]  # cyma
    p += [(proj, 0.095), (proj, 0.115), (0.0, 0.115)]
    return p


def rail_profile():
    """Moulded handrail section: (across, up), centred on the rail line."""
    return [(-0.05, 0.0), (0.05, 0.0), (0.055, 0.02)] + arc(0.0, 0.03, 0.055, 10, 170, 10)[1:] + [(-0.055, 0.02)]


def baluster_profile(h=0.84):
    """Turned baluster (r, height) from the foot up, vase-shaped with a bead and a square-ish block at each end."""
    k = h / 0.84
    pts = [(0.0, 0.0), (0.045, 0.0), (0.045, 0.06 * k), (0.035, 0.07 * k), (0.03, 0.09 * k)]
    pts += [(0.03 + 0.03 * math.sin(math.pi * t / 12), (0.1 + 0.42 * t / 12) * k) for t in range(13)]  # vase belly
    pts += [(0.018, 0.56 * k), (0.016, 0.66 * k), (0.026, 0.68 * k), (0.016, 0.70 * k), (0.02, 0.76 * k),
            (0.045, 0.78 * k), (0.045, h), (0.0, h)]
    return pts


# ---------------------------------------------------------------- materials
def principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    return m, nt, nt.nodes["Principled BSDF"], nt.nodes.new("ShaderNodeTexCoord")


def pbr(name, asset, tile_m, tint=None, keep=0.0, rough=(0.0, 1.0), normal=1.0, metallic=0.0, bevel=0.01, seed=0, contrast=1.0):
    """Scanned CC0 PBR set (art/textures/fetch.py), box-projected in object space at real-world scale:
    one tile spans `tile_m` metres. `tint` recolours the scan while `keep` of its own colour survives;
    roughness is remapped into `rough`; normal map and a shading bevel are chained so edges catch light."""
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

    colour = img("diff", True).outputs["Color"]
    if tint is not None:
        bw = nt.nodes.new("ShaderNodeRGBToBW")
        nt.links.new(colour, bw.inputs["Color"])
        detail = nt.nodes.new("ShaderNodeMath")
        detail.operation = "MULTIPLY"
        detail.inputs[1].default_value = contrast / SCAN_MEAN[asset]
        nt.links.new(bw.outputs["Val"], detail.inputs[0])
        if contrast != 1.0:  # 1 + contrast·(bw/mean − 1): keep the scan's pattern, scale its swing
            off = nt.nodes.new("ShaderNodeMath")
            off.operation = "ADD"
            off.inputs[1].default_value = 1.0 - contrast
            nt.links.new(detail.outputs["Value"], off.inputs[0])
            detail = off
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
    rm = nt.nodes.new("ShaderNodeMapRange")
    rm.inputs["To Min"].default_value, rm.inputs["To Max"].default_value = rough
    nt.links.new(img("rough", False).outputs["Color"], rm.inputs["Value"])
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


def bezier(p0, p1, p2, p3, n):
    """Points on a cubic Bézier."""
    out = []
    for k in range(n + 1):
        t = k / n
        out.append(p0 * (1 - t) ** 3 + p1 * (3 * t * (1 - t) ** 2) + p2 * (3 * t * t * (1 - t)) + p3 * t ** 3)
    return out


def aged_brass(name):
    """Gemini's recipe for library brass, no scan: brass darkening to oil-rubbed bronze in crevices (local AO),
    handling-worn stretched roughness, radial anisotropy so brushed highlights wrap turned parts, and fine
    tooling scratches from a Voronoi edge field."""
    m, nt, bsdf, tc = principled(name)
    ao = nt.nodes.new("ShaderNodeAmbientOcclusion")
    ao.samples, ao.only_local = 8, True
    ao.inputs["Distance"].default_value = 0.03
    cav = nt.nodes.new("ShaderNodeMapRange")
    cav.inputs["From Min"].default_value, cav.inputs["From Max"].default_value = 0.45, 1.0
    nt.links.new(ao.outputs["AO"], cav.inputs["Value"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["A"].default_value = (*srgb("#5E4A32"), 1)
    mix.inputs["B"].default_value = (*srgb("#BFA16B"), 1)
    nt.links.new(cav.outputs["Result"], mix.inputs["Factor"])
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (18.0, 18.0, 110.0)  # stretched: wear runs along the handled direction
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    wear = nt.nodes.new("ShaderNodeTexNoise")
    wear.inputs["Detail"].default_value = 6.0
    nt.links.new(mp.outputs["Vector"], wear.inputs["Vector"])
    rr = nt.nodes.new("ShaderNodeMapRange")
    rr.inputs["To Min"].default_value, rr.inputs["To Max"].default_value = 0.28, 0.46
    nt.links.new(wear.outputs["Fac"], rr.inputs["Value"])
    nt.links.new(rr.outputs["Result"], bsdf.inputs["Roughness"])
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Anisotropic"].default_value = 0.65
    tan = nt.nodes.new("ShaderNodeTangent")
    tan.direction_type, tan.axis = "RADIAL", "Z"
    nt.links.new(tan.outputs["Tangent"], bsdf.inputs["Tangent"])
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 420.0
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    line = nt.nodes.new("ShaderNodeMapRange")
    line.inputs["From Min"].default_value, line.inputs["From Max"].default_value = 0.0, 0.04
    line.inputs["To Min"].default_value, line.inputs["To Max"].default_value = 1.0, 0.0
    nt.links.new(vor.outputs["Distance"], line.inputs["Value"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value, bump.inputs["Distance"].default_value = 0.12, 0.0002
    nt.links.new(line.outputs["Result"], bump.inputs["Height"])
    bev = nt.nodes.new("ShaderNodeBevel")
    bev.samples, bev.inputs["Radius"].default_value = 8, 0.0012
    nt.links.new(bev.outputs["Normal"], bump.inputs["Normal"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def gold_leaf(name):
    """Tooled gold leaf: bright, slightly soft, with fine pitting rather than a scanned plate's streaks."""
    m, nt, bsdf, tc = principled(name)
    bsdf.inputs["Base Color"].default_value = (*srgb("#D4AF6A"), 1)
    bsdf.inputs["Metallic"].default_value = 1.0
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value, n.inputs["Detail"].default_value = 900.0, 4.0
    nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value, mr.inputs["To Max"].default_value = 0.22, 0.42
    nt.links.new(n.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], bsdf.inputs["Roughness"])
    return m


def paper(name):
    """Page edges: warm off-white, matte, with faint layering along the stack."""
    m, nt, bsdf, tc = principled(name)
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 160.0
    wave.inputs["Distortion"].default_value = 2.0
    wave.bands_direction = "X"
    nt.links.new(tc.outputs["Object"], wave.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*srgb("#B7A98C"), 1)
    ramp.color_ramp.elements[1].color = (*srgb("#D9CDB3"), 1)
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85
    return m


def frosted(name):
    m, nt, bsdf, tc = principled(name)
    bsdf.inputs["Base Color"].default_value = (1.0, 0.93, 0.82, 1)
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.45
    return m


def emissive(name, rgb, strength):
    m, nt, bsdf, tc = principled(name)
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Emission Color"].default_value = (*rgb, 1)
    bsdf.inputs["Emission Strength"].default_value = strength
    return m


BINDINGS = (  # (hex, roughness range, weight): calf, morocco, buckram, vellum
    ("#5A1A16", (0.35, 0.7), 14), ("#3B1410", (0.45, 0.8), 10), ("#1F3326", (0.5, 0.85), 8),
    ("#18233F", (0.45, 0.8), 8), ("#6B4A2B", (0.3, 0.65), 12), ("#3A2618", (0.4, 0.75), 14),
    ("#151515", (0.25, 0.6), 6), ("#B9A88A", (0.65, 0.95), 5), ("#1E3A3D", (0.5, 0.85), 4), ("#7A3A1E", (0.35, 0.7), 9),
)


def materials():
    class M:
        pass

    M.stone = pbr("limestone", "beige_wall_001", 2.2, tint=srgb("#9A9284"), keep=0.55, rough=(0.55, 0.9), normal=0.8, bevel=0.012)
    M.masonry = pbr("masonry", "sandstone_blocks_08", 2.4, tint=srgb("#A39A8A"), keep=0.5, rough=(0.5, 0.9), normal=1.0, bevel=0.012)
    M.floor = pbr("floor", "marble_01", 3.0, tint=srgb("#2A2A27"), keep=0.15, rough=(0.08, 0.32), normal=0.4, bevel=0.004)
    M.wood = pbr("walnut", "dark_wood", 1.6, tint=srgb("#231B16"), keep=0.0, rough=(0.3, 0.55), normal=0.4, bevel=0.004, contrast=0.45)  # quiet, dark, oiled
    M.brass = aged_brass("brass")
    M.gilt = gold_leaf("gilt")
    M.paper = paper("page_edges")
    M.bulb = emissive("bulb", (1.0, 0.75, 0.48), 25.0)
    M.glass = frosted("frosted_glass")
    M.books = [pbr(f"binding_{k}", "brown_leather", 0.06 + 0.008 * k, tint=srgb(h), keep=0.12, rough=rr, normal=0.9, bevel=0.0015, seed=k)
               for k, (h, rr, _) in enumerate(BINDINGS)]
    M.book_weights = [w for *_, w in BINDINGS]
    return M
