# Bay builders for THE UNWRITTEN, written once in a bay's local frame so the same production assets go
# into the flat section test and into each of the rotunda's 16 faceted bays.
#
# A Frame maps local (x, y, z) to world: x runs along the bay, y points into the wall (the room is at
# y < 0, the wall face at y = 0), z is up. Every bay gets its own random stream, so no two bays share a
# book sequence, gap or lean (Gemini's "twin-bay syndrome").
import math
from mathutils import Vector
import kit

Z = Vector((0, 0, 1))


class Frame:
    def __init__(self, origin, along, into):
        self.o, self.T, self.N = Vector(origin), Vector(along).normalized(), Vector(into).normalized()

    def p(self, x, y, z):
        return self.o + self.T * x + self.N * y + Z * z

    def box(self, m, x0, y0, z0, x1, y1, z1):
        m.obox(self.p((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), self.T, self.N, Z, x1 - x0, y1 - y0, z1 - z0)

    def dir(self, x, y, z):
        return self.T * x + self.N * y + Z * z


def pilaster(stone, reeds, f, px, z_top, w=0.62, proj=0.42, reed_count=5):
    """Plinth, attic base, reeded shaft and capital, centred at x = px on the wall face; capital ends at z_top."""
    hw = w / 2
    f.box(stone, px - hw - 0.13, -proj - 0.13, 0, px + hw + 0.13, 0, 0.35)
    u_path = [f.p(px - hw, 0, 0), f.p(px - hw, -proj, 0), f.p(px + hw, -proj, 0), f.p(px + hw, 0, 0)]
    stone.moulding([q + Z * 0.35 for q in u_path], kit.base_profile(0.12))
    z0, z1 = 0.35 + 0.275, z_top - 0.3
    f.box(stone, px - hw, -proj, z0, px + hw, 0, z1)
    stone.moulding([q + Z * z1 for q in u_path], kit.capital_profile(0.13))
    length = z1 - z0 - 0.64
    for k in range(reed_count):  # convex reeds, stopped short of base and capital
        x = px - hw + 0.09 + k * (w - 0.18) / (reed_count - 1)
        reeds.lathe([(0.0, 0.0), (0.026, 0.02), (0.026, length - 0.02), (0.0, length)], f.p(x, -proj, z0 + 0.32), 16)


def case(wood, f, x0, x1, z0, z1, depth=0.45, pitch=0.42):
    """Walnut case: back, kick, lipped shelves and a cornice. Returns the shelf-top heights."""
    f.box(wood, x0, -0.02, z0, x1, 0, z1)
    f.box(wood, x0, -depth + 0.04, z0, x1, 0, z0 + 0.1)
    lip = [(0.0, 0.0), (0.01, 0.0)] + kit.arc(0.01, 0.014, 0.014, -90, 90, 5)[1:] + [(0.0, 0.028)]
    tops, z = [], z0 + 0.1
    while z < z1 - 0.2:
        f.box(wood, x0, -depth, z, x1, 0, z + 0.028)
        wood.moulding([f.p(x0, -depth, z), f.p(x1, -depth, z)], lip)
        tops.append(z + 0.028)
        z += pitch
    wood.moulding([f.p(x0, -depth, z1 - 0.115), f.p(x1, -depth, z1 - 0.115)], kit.cornice_profile(0.09))
    f.box(wood, x0, -depth, z1 - 0.115, x1, 0, z1)
    return tops


STYLES = {  # heights, widths, fill, palette size, bands probability, lean probability
    "archive": ((0.29, 0.31), (0.034, 0.05), 0.97, 2, 0.9, 0.0),
    "antique": ((0.21, 0.35), (0.028, 0.08), 0.92, 6, 0.55, 0.04),
    "folio": ((0.34, 0.385), (0.05, 0.09), 0.9, 3, 0.4, 0.03),
    "sparse": ((0.2, 0.33), (0.025, 0.07), 0.62, 5, 0.3, 0.25),
}


class Books:
    """Books as bound volumes into one mesh. Material slots: bindings 0..n-1, then paper, then gilt."""

    def __init__(self, M, rng, simple=False):
        self.m = kit.Mesh()
        self.M, self.rng, self.simple = M, rng, simple
        self.PAPER, self.GILT = len(M.books), len(M.books) + 1

    def binding(self):
        return self.rng.choices(range(len(self.M.books)), weights=self.M.book_weights)[0]

    def volume(self, f, x, z, w, h, d, spine_y, lean, slot, bands, flip=False):
        """One book standing at local (x, z) with its spine at y = spine_y, leaning about the wall normal.
        flip = the book hangs from the shelf above (inverted gravity)."""
        B = self.m
        sz = -1.0 if flip else 1.0
        across = f.dir(math.cos(lean), 0, math.sin(lean) * sz)
        up = f.dir(-math.sin(lean), 0, math.cos(lean) * sz)
        out = -f.N
        o = f.p(x, spine_y + d, z)  # rear bottom corner
        B.slot = slot
        if self.simple:  # distant bays: a single box per book is enough at that size on screen
            B.obox(o + across * (w / 2) + out * (d / 2) + up * (h / 2), across, out, up, w * 0.96, d, h)
            return
        t, rc = 0.0025, 0.005
        board = [(d, 0.0), (rc, 0.0)] + kit.arc(rc, rc, rc, -90, -180, 5)[1:] + [(0.0, h - rc)] + kit.arc(rc, h - rc, rc, 180, 90, 5)[1:] + [(d, h)]
        for s0 in (0.0, w - t):
            B.sweep([(o + across * s0, out, up), (o + across * (s0 + t), out, up)], board)
        B.slot = self.PAPER
        B.obox(o + across * (w / 2) + out * (d / 2 + 0.0015) + up * (h / 2), across, out, up, w - 2 * t, d - 0.0052, h - 0.006)
        bulge = min(0.009, 0.18 * w)
        outer = [(w * k / 8, d + bulge * math.sin(math.pi * k / 8)) for k in range(9)]
        B.slot = slot
        B.sweep([(o, across, out), (o + up * h, across, out)], outer + [(u, v - 0.0022) for u, v in reversed(outer)])
        # Headcaps: the leather rolled over at head and tail, so the spine never ends in a cut edge.
        cap = [o + across * u + out * (v - 0.001) for u, v in outer[1:-1]]
        for zc in (0.0022, h - 0.0022):
            B.tube([q + up * zc for q in cap], [0.0024] * len(cap), 8)
        if bands:
            for k in range(4):
                zb = h * (0.2 + 0.17 * k)
                B.slot = slot
                B.sweep([(o + up * zb, across, out), (o + up * (zb + 0.007), across, out)],
                        [(u, v + 0.0025) for u, v in outer] + [(u, v - 0.001) for u, v in reversed(outer)])
                B.slot = self.GILT
                for zz in (zb - 0.004, zb + 0.009):
                    B.sweep([(o + up * zz, across, out), (o + up * (zz + 0.0012), across, out)],
                            [(u, v + 0.0006) for u, v in outer] + [(u, v - 0.0005) for u, v in reversed(outer)])
            B.slot = self.GILT
            B.sweep([(o + up * (h * 0.82), across, out), (o + up * (h * 0.86), across, out)],
                    [(u, v + 0.0012) for u, v in outer[1:-1]] + [(u, v - 0.0004) for u, v in reversed(outer[1:-1])])

    def shelf(self, f, x0, x1, z, room, depth=0.45, flip=False):
        """Fill one shelf from x0 to x1 standing on z (or hanging from z when flipped); room = clear height."""
        r = self.rng
        style = r.choices(list(STYLES), weights=(3, 5, 2, 2))[0]
        (h0, h1), (w0, w1), fill, npal, pband, plean = STYLES[style]
        palette = [self.binding() for _ in range(npal)]
        limit = room - 0.012
        x = x0 + 0.01
        while x < x1 - 0.08:
            w, h = r.uniform(w0, w1), min(r.uniform(h0, h1), limit)
            if r.random() > fill and not flip:  # a gap; the next book leans back into it
                lean = math.radians(r.uniform(8, 16)) if r.random() < 0.6 + plean else 0.0
                x += max(r.uniform(0.04, 0.22), h * math.sin(lean) + 0.012)
                if x + w > x1:
                    break
                self.volume(f, x, z, w, h, r.uniform(0.2, 0.27), -depth + r.uniform(0.01, 0.05), lean, r.choice(palette), r.random() < pband)
                x += w + 0.003
                continue
            if style == "sparse" and not flip and r.random() < 0.05:  # a short stack lying flat
                zz = z
                for _ in range(r.randint(2, 4)):
                    tt = r.uniform(0.03, 0.055)
                    self.m.slot = r.choice(palette)
                    f.box(self.m, x, -depth + r.uniform(0.02, 0.05), zz, x + r.uniform(0.24, 0.3), -depth + 0.27, zz + tt * 0.96)
                    zz += tt
                x += 0.32
                continue
            if x + w > x1:
                break
            lean = math.radians(r.uniform(-1.2, 1.2)) * (r.random() < 0.5)
            recess = r.uniform(0.008, 0.03) if r.random() > 0.2 else r.uniform(0.05, 0.09)
            self.volume(f, x, z, w, h, r.uniform(0.18, 0.27), -depth + recess, lean, r.choice(palette), r.random() < pband, flip)
            x += w + r.uniform(0.0, 0.002)

    def fill(self, f, x0, x1, tops, pitch=0.42, depth=0.45, flip=False):
        for z in tops:
            if flip:  # hang from the underside of the board above
                self.shelf(f, x0, x1, z + pitch - 0.028, pitch - 0.028, depth, flip=True)
            else:
                self.shelf(f, x0, x1, z, pitch - 0.028, depth)

    def build(self, name, coll):
        return self.m.build(name, self.M.books + [self.M.paper, self.M.gilt], coll)


def sconce(brass, glass, bulb, f, px, z, proj=0.448):
    """A turned brass wall sconce on a pilaster face at (px, z): ogee rose, swan-neck arm with a collar,
    cup and bobeche, frosted shade and a bulb. Returns where its lamp light belongs."""
    def at(dy, dz):
        return f.p(px, -proj - dy, z + dz)

    rose = [(0.0, 0.0), (0.085, 0.0), (0.088, 0.004)] + [(0.088 - 0.03 * (0.5 - 0.5 * math.cos(math.pi * k / 8)), 0.004 + 0.018 * k / 8) for k in range(1, 9)]
    rose += [(0.05, 0.024), (0.032, 0.028), (0.03, 0.034), (0.034, 0.038), (0.03, 0.046), (0.0, 0.048)]
    brass.lathe(rose, at(0, 0), 48, axis_up=-f.N)
    arm = kit.bezier(at(0.044, 0), at(0.21, -0.015), at(0.29, 0.03), at(0.285, 0.14), 40)
    brass.tube(arm, [0.0115 - 0.0035 * k / 40 for k in range(41)], 20)
    brass.lathe([(0.0, -0.008), (0.015, -0.008), (0.018, -0.004), (0.018, 0.004), (0.015, 0.008), (0.0, 0.008)],
                arm[14], 24, axis_up=(arm[15] - arm[13]).normalized())
    top = arm[-1]
    brass.lathe([(0.0, 0.0), (0.012, 0.0), (0.02, 0.012), (0.024, 0.03)] + kit.arc(0.05, 0.03, 0.006, 180, 0, 6)
                + [(0.05, 0.036), (0.028, 0.04), (0.028, 0.05), (0.0, 0.05)], top - Z * 0.005, 40)
    glass.lathe([(0.0, 0.0), (0.026, 0.0), (0.05, 0.06), (0.052, 0.14), (0.045, 0.17), (0.0, 0.17)], top + Z * 0.045, 40)
    bulb.lathe([(0.0, 0.0), (0.012, 0.01), (0.014, 0.04), (0.0, 0.055)], top + Z * 0.06, 16)
    return top + Z * 0.09


def reading_desk(m, centre, length=2.4, depth=1.3, top_z=0.92):
    """A library reading table. Material slots: 0 walnut, 1 leather, 2 gilt, 3 brass.
    Moulded thumbnail edge on a 50 mm top, tooled leather inset with a gilt fillet, a recessed frieze with
    two drawers a side and turned brass knobs, four turned baluster legs on bun feet, an H-stretcher."""
    cx, cy = centre[0], centre[1]
    X_, Y_ = Vector((1, 0, 0)), Vector((0, 1, 0))
    hl, hd, t = length / 2, depth / 2, 0.05

    def box(x0, y0, z0, x1, y1, z1):
        m.obox(Vector((cx + (x0 + x1) / 2, cy + (y0 + y1) / 2, (z0 + z1) / 2)), X_, Y_, Z, x1 - x0, y1 - y0, z1 - z0)

    m.slot = 0
    box(-hl + 0.02, -hd + 0.02, top_z - t, hl - 0.02, hd - 0.02, top_z)
    edge = [Vector((cx - hl + 0.02, cy - hd + 0.02, top_z - t)), Vector((cx + hl - 0.02, cy - hd + 0.02, top_z - t)),
            Vector((cx + hl - 0.02, cy + hd - 0.02, top_z - t)), Vector((cx - hl + 0.02, cy + hd - 0.02, top_z - t))]
    thumbnail = [(0.0, 0.0), (0.012, 0.0)] + kit.arc(0.012, 0.025, 0.025, -90, 0, 6)[1:] + [(0.037, 0.03)] + kit.arc(0.022, 0.03, 0.015, 0, 90, 4)[1:] + [(0.0, t)]
    m.moulding(edge, thumbnail, closed=True)
    m.slot = 1  # leather inset, a millimetre proud so its edge reads
    il, idp = length - 0.36, depth - 0.34
    box(-il / 2, -idp / 2, top_z, il / 2, idp / 2, top_z + 0.0012)
    m.slot = 2  # gilt fillet around the leather
    for (x0, y0, x1, y1) in ((-il / 2 + 0.02, -idp / 2 + 0.02, il / 2 - 0.02, -idp / 2 + 0.026), (-il / 2 + 0.02, idp / 2 - 0.026, il / 2 - 0.02, idp / 2 - 0.02),
                             (-il / 2 + 0.02, -idp / 2 + 0.02, -il / 2 + 0.026, idp / 2 - 0.02), (il / 2 - 0.026, -idp / 2 + 0.02, il / 2 - 0.02, idp / 2 - 0.02)):
        box(x0, y0, top_z + 0.0012, x1, y1, top_z + 0.0016)
    m.slot = 0  # frieze, set back under the top, with drawer fronts and knobs
    fz0, fz1, inset = top_z - t - 0.13, top_z - t, 0.06
    box(-hl + inset, -hd + inset, fz0, hl - inset, hd - inset, fz1)
    for side in (-1, 1):
        for dx in (-0.48, 0.48):
            box(dx - 0.42, side * (hd - inset) - 0.004 * (side < 0), fz0 + 0.018, dx + 0.42, side * (hd - inset) + 0.004 * (side > 0), fz1 - 0.018)
            m.slot = 3
            m.lathe([(0.0, 0.0), (0.012, 0.0), (0.014, 0.006), (0.008, 0.012), (0.016, 0.022), (0.012, 0.03), (0.0, 0.032)],
                    Vector((cx + dx, cy + side * (hd - inset + 0.004), (fz0 + fz1) / 2)), 20, axis_up=Y_ * side)
            m.slot = 0
    leg = [(0.0, 0.0), (0.05, 0.0), (0.056, 0.03), (0.05, 0.06), (0.032, 0.075), (0.03, 0.11)]
    leg += [(0.03 + 0.022 * math.sin(math.pi * k / 10), 0.11 + 0.32 * k / 10) for k in range(11)]  # baluster
    leg += [(0.024, 0.46), (0.036, 0.48), (0.024, 0.5), (0.028, 0.58), (0.045, 0.6), (0.045, fz0), (0.0, fz0)]
    for sx in (-1, 1):
        for sy in (-1, 1):
            foot = Vector((cx + sx * (hl - inset - 0.02), cy + sy * (hd - inset - 0.02), 0.0))
            m.lathe(leg, foot + Z * 0.04, 24)
            m.slot = 3  # cast brass sabot under each foot (Gemini)
            m.lathe([(0.0, 0.0), (0.054, 0.0), (0.058, 0.01), (0.054, 0.035), (0.05, 0.045), (0.0, 0.045)], foot, 32)
            m.slot = 0
    for sx in (-1, 1):  # H-stretcher: two side rails and a centre rail
        box(sx * (hl - inset - 0.02) - 0.02, -hd + inset + 0.02, 0.17, sx * (hl - inset - 0.02) + 0.02, hd - inset - 0.02, 0.22)
    box(-hl + inset + 0.02, -0.02, 0.17, hl - inset - 0.02, 0.02, 0.22)


def folio(m, centre, width=0.34, length=0.46, thick=0.075, z=0.92):
    """The FRONTIER volume lying closed on the desk, spine to the left (−X). Slots: 0 leather, 1 paper, 2 gilt.
    Rounded fore-edge corners, 3 mm squares, a rounded spine with five raised bands, and a gilt double rule
    with a central ring on the upper board. No baked title: the real title lives in HTML."""
    X_, Y_ = Vector((1, 0, 0)), Vector((0, 1, 0))
    o = Vector((centre[0] - width / 2, centre[1] - length / 2, z))  # spine-side, tail corner, on the desk
    bt, rc = 0.004, 0.01
    plan = [(0.0, 0.0), (width - rc, 0.0)] + kit.arc(width - rc, rc, rc, -90, 0, 5)[1:] + [(width, length - rc)] + kit.arc(width - rc, length - rc, rc, 0, 90, 5)[1:] + [(0.0, length)]
    m.slot = 0
    for z0 in (0.0, thick - bt):  # lower and upper boards
        m.sweep([(o + Z * z0, X_, Y_), (o + Z * (z0 + bt), X_, Y_)], plan)
    m.slot = 1
    m.obox(o + Vector((width / 2 + 0.0005, length / 2, thick / 2)), X_, Y_, Z, width - 0.004, length - 0.006, thick - 2 * bt)
    m.slot = 0  # rounded spine, swept along the book's length
    spine = [(0.0, 0.0)] + [(-0.009 * math.sin(math.pi * k / 10), thick * k / 10) for k in range(1, 10)] + [(0.0, thick), (0.0022, thick), (0.0022, 0.0)]
    m.sweep([(o, X_, Z), (o + Y_ * length, X_, Z)], spine)
    for k in range(5):
        yb = length * (0.14 + 0.18 * k)
        band = [(0.002, -0.0015)] + [(-0.012 * math.sin(math.pi * j / 10), thick * j / 10) for j in range(1, 10)] + [(0.002, thick + 0.0015)]
        m.sweep([(o + Y_ * yb, X_, Z), (o + Y_ * (yb + 0.008), X_, Z)], band)
    m.slot = 2
    top = o + Z * (thick + 0.0002)
    for inset in (0.018, 0.026):  # double gilt rule
        w_, l_ = width - 2 * inset, length - 2 * inset
        c_ = top + Vector((width / 2, length / 2, 0))
        for (dx, dy, sx, sy) in ((0, -l_ / 2, w_, 0.0016), (0, l_ / 2, w_, 0.0016), (-w_ / 2, 0, 0.0016, l_), (w_ / 2, 0, 0.0016, l_)):
            m.obox(c_ + Vector((dx, dy, 0.0002)), X_, Y_, Z, sx, sy, 0.0004)
    ring = [top + Vector((width / 2 + 0.045 * math.cos(2 * math.pi * k / 48), length / 2 + 0.045 * math.sin(2 * math.pi * k / 48), 0.0004)) for k in range(49)]
    m.tube(ring, [0.0011] * len(ring), 6)


def plumb(m, base, up, along, k=1.0):
    """A turned brass plumb stand on a surface whose local 'up' is `up`: a weighted foot, a column, an arm,
    a fine line and a turned bob hanging along −up (the proof of that surface's gravity)."""
    up, along = up.normalized(), along.normalized()
    m.lathe([(0.0, 0.0), (0.05 * k, 0.0), (0.052 * k, 0.01 * k), (0.035 * k, 0.025 * k), (0.012 * k, 0.035 * k), (0.0, 0.035 * k)], base, 32, axis_up=up)
    m.tube([base + up * 0.03 * k, base + up * 0.6 * k], [0.009 * k, 0.007 * k], 14)
    m.lathe([(0.0, 0.0), (0.012 * k, 0.0), (0.014 * k, 0.012 * k), (0.0, 0.03 * k)], base + up * 0.6 * k, 20, axis_up=up)  # finial
    arm0, arm1 = base + up * 0.58 * k, base + up * 0.58 * k + along * 0.18 * k
    m.tube([arm0, arm1], [0.005 * k, 0.005 * k], 10)
    m.tube([arm1, arm1 - up * 0.36 * k], [0.0008 * k, 0.0008 * k], 6)  # the line
    bob = arm1 - up * 0.36 * k
    m.lathe([(0.0, 0.0), (0.012 * k, -0.004 * k), (0.022 * k, -0.025 * k), (0.016 * k, -0.045 * k), (0.0, -0.07 * k)], bob, 24, axis_up=up)
