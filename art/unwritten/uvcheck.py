# Lightmap UV overlap per mesh in a chamber GLB: texels (at each mesh's own lightmap size, from its PNG, or
# 256 when it has none) whose centre falls inside more than one UV1 triangle. Overlapping texels are
# written by more than one face in the bake, so any overlap above noise is a defect.
#   blender -b --factory-startup -P art/unwritten/uvcheck.py -- <chamber.glb> [lightmaps dir]
import os
import sys
import bpy
import numpy as np

args = sys.argv[sys.argv.index("--") + 1:]
glb = os.path.abspath(args[0])
lm_dir = os.path.abspath(args[1]) if len(args) > 1 else os.path.join(os.path.dirname(glb), "lightmaps")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)

rows = []
for o in sorted((o for o in bpy.data.objects if o.type == "MESH"), key=lambda o: o.name):
    me = o.data
    if len(me.uv_layers) < 2:
        continue
    png = os.path.join(lm_dir, o.name.split(".")[0] + ".png")
    side = bpy.data.images.load(png).size[0] if os.path.exists(png) else 256
    me.calc_loop_triangles()
    n = len(me.loop_triangles)
    li = np.empty(n * 3, np.int64)
    me.loop_triangles.foreach_get("loops", li)
    uv = np.empty(len(me.loops) * 2, np.float32)
    me.uv_layers[1].data.foreach_get("uv", uv)
    tri = uv.reshape(-1, 2)[li].reshape(n, 3, 2).astype(np.float64) * side
    count = np.zeros((side, side), np.int32)
    for a, b, c in tri:
        x0, y0 = np.maximum(np.floor(np.minimum(np.minimum(a, b), c)).astype(int), 0)
        x1, y1 = np.minimum(np.ceil(np.maximum(np.maximum(a, b), c)).astype(int), side)
        if x1 <= x0 or y1 <= y0:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5)
        def edge(p, q):
            return (q[0] - p[0]) * (gy - p[1]) - (q[1] - p[1]) * (gx - p[0])
        e1, e2, e3 = edge(a, b), edge(b, c), edge(c, a)
        inside = ((e1 > 0) & (e2 > 0) & (e3 > 0)) | ((e1 < 0) & (e2 < 0) & (e3 < 0))
        count[y0:y1, x0:x1] += inside
    used = (count > 0).sum()
    over = (count > 1).sum()
    rows.append((o.name, side, int(used), int(over)))
    print(f"UVCHECK {o.name:44s} {side:5d} px  texels {used:8d}  overlapped {over:7d}  ({100 * over / max(used, 1):5.1f} %)", flush=True)
tot_u = sum(r[2] for r in rows)
tot_o = sum(r[3] for r in rows)
print(f"UVCHECK TOTAL texels {tot_u}, overlapped {tot_o} ({100 * tot_o / max(tot_u, 1):.2f} %)")
