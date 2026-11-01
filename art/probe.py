import bpy, time
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 32
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 960, 540
bpy.ops.mesh.primitive_cube_add(size=2)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); cam.location=(5,-5,4); cam.rotation_euler=(1.1,0,0.785); sc.camera=cam
l = bpy.data.objects.new("l", bpy.data.lights.new("l","AREA")); l.data.energy=800; l.location=(3,-2,5); sc.collection.objects.link(l)
sc.render.filepath = "//renders/probe.png"
t=time.time(); bpy.ops.render.render(write_still=True); print("RENDER_SECONDS", round(time.time()-t,1))
