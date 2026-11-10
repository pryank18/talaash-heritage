"""Jaisa Tha #1, Purana Qila: a cutaway of the mound, one still per stage.
Usage: python3 scene.py STAGE [SAMPLES]   (STAGE 1..11; 11 = full column wide shot)
Stages: 1 silt, 2 pre-Mauryan, 3 Mauryan, 4 Sunga, 5 Kushan, 6 Gupta, 7 post-Gupta,
8 Rajput, 9 Sultanate, 10 Mughal, 11 whole column. Reconstruction, not to scale.
"""
import bpy, math, random, sys
from mathutils import Vector

STAGE = int(sys.argv[-2]) if len(sys.argv) > 2 and sys.argv[-2].isdigit() else int(sys.argv[-1])
SAMPLES = int(sys.argv[-1]) if len(sys.argv) > 2 and sys.argv[-2].isdigit() else 48
OUT = f"/home/claude/jaisatha/frames/stage{STAGE:02d}.png"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 1080, 1920
scene.render.film_transparent = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Punchy"
random.seed(7)

W, D = 4.0, 2.2          # column width (x) and depth (y)
LAYERS = [               # name, thickness, base colour (soil); distinct per period, not to scale
    ("silt", 0.9, (0.80, 0.66, 0.30)),
    ("premaurya", 0.75, (0.40, 0.40, 0.41)),
    ("maurya", 0.85, (0.64, 0.40, 0.22)),
    ("sunga", 0.7, (0.38, 0.28, 0.18)),
    ("kushan", 0.8, (0.70, 0.36, 0.20)),
    ("gupta", 0.7, (0.48, 0.30, 0.22)),
    ("postgupta", 0.6, (0.62, 0.50, 0.34)),
    ("rajput", 0.8, (0.33, 0.32, 0.31)),
    ("sultanate", 0.7, (0.74, 0.68, 0.54)),
    ("mughal", 0.6, (0.56, 0.47, 0.38)),
]
tops = []
z = 0.0
for _, t, _ in LAYERS:
    z += t
    tops.append(z)
bases = [0.0] + tops[:-1]


def mat(name, col, rough=0.85, noise=0.0, scale=40.0, metal=0.0, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if noise:
        tc = nt.nodes.new("ShaderNodeTexCoord")
        n = nt.nodes.new("ShaderNodeTexNoise")
        nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = 8
        r = nt.nodes.new("ShaderNodeValToRGB")
        r.color_ramp.elements[0].color = (*(c * (1 - noise) for c in col), 1)
        r.color_ramp.elements[1].color = (*(min(1, c * (1 + noise * 0.6)) for c in col), 1)
        nt.links.new(n.outputs["Fac"], r.inputs["Fac"])
        nt.links.new(r.outputs["Color"], b.inputs["Base Color"])
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.25
        nt.links.new(n.outputs["Fac"], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = 0.6
    return m


def box(name, loc, size, m, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        bv = o.modifiers.new("b", "BEVEL")
        bv.width = bevel
        bv.segments = 2
    o.data.materials.append(m)
    return o


def stone(loc, r, m):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=loc)
    o = bpy.context.object
    for v in o.data.vertices:
        v.co *= 0.75 + random.random() * 0.5
    o.scale = (1, 0.8 + random.random() * 0.4, 0.55 + random.random() * 0.3)
    o.rotation_euler = (random.random(), random.random(), random.random() * 3)
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    return o


# ---------- the column ----------
n_layers = min(STAGE, 10)
for i in range(n_layers):
    name, t, col = LAYERS[i]
    highlight = (i == n_layers - 1 and STAGE <= 10)
    m = mat(f"soil_{name}", col, noise=0.35, scale=25 + i * 3)
    o = box(f"layer_{name}", (0, 0, bases[i] + t / 2), (W, D, t), m, bevel=0.01)
    # a thin darker seam on top of each layer reads as a floor or occupation surface
    seam = mat(f"seam_{name}", tuple(c * 0.55 for c in col), noise=0.2)
    box(f"seam_{name}", (0, 0, tops[i] - 0.03), (W + 0.006, D + 0.006, 0.03), seam)
    if highlight:
        glow = mat("rim", (0.87, 0.65, 0.22), rough=0.4, emit=(0.87, 0.65, 0.22))
        for dx, dy, sx, sy in ((0, -D / 2 - 0.006, W + 0.02, 0.012), (W / 2 + 0.006, 0, 0.012, D + 0.02)):
            box("rim", (dx, dy, tops[i] - 0.01), (sx, sy, 0.012), glow)

TOP = tops[n_layers - 1]

terr = mat("terracotta", (0.63, 0.30, 0.16), noise=0.25, scale=60)
burnt = mat("burntbrick", (0.55, 0.22, 0.13), noise=0.3, scale=70)
mud = mat("mudbrick", (0.52, 0.40, 0.27), noise=0.35, scale=50)
rubble = mat("rubble", (0.55, 0.52, 0.47), noise=0.4, scale=30)
grey = mat("pgw", (0.34, 0.34, 0.35), rough=0.45, noise=0.1)
paint = mat("pgwpaint", (0.05, 0.05, 0.05), rough=0.5)
copper = mat("copper", (0.42, 0.30, 0.18), rough=0.35, metal=0.9)
lime = mat("lime", (0.86, 0.84, 0.78), noise=0.15, scale=20)
glaze = mat("glaze", (0.12, 0.42, 0.45), rough=0.12)
quartz = mat("quartzite", (0.58, 0.56, 0.52), noise=0.35, scale=18)
sand = mat("redsand", (0.62, 0.27, 0.16), noise=0.25, scale=30)


def on_top(i):
    return tops[i]


def bricks_wall(x0, y0, length, axis, height, m, z0, brick=(0.36, 0.18, 0.09), jitter=0.0):
    """Courses of bricks along x (axis 'x') or y."""
    bl, bw, bh = brick
    courses = int(height / bh)
    for c in range(courses):
        off = (bl / 2) if c % 2 else 0
        n = int(length / bl)
        for k in range(n):
            p = -length / 2 + off + k * bl + bl / 2
            if p > length / 2 - bl / 2 + 0.001:
                continue
            j = (random.random() - 0.5) * jitter
            loc = (x0 + p, y0 + j, z0 + c * bh + bh / 2) if axis == "x" else (x0 + j, y0 + p, z0 + c * bh + bh / 2)
            size = (bl * 0.96, bw, bh * 0.9) if axis == "x" else (bw, bl * 0.96, bh * 0.9)
            box("brick", loc, size, m, bevel=0.008)


# ---------- objects for the stage in focus (and, on the wide shot, a few markers) ----------
def stage_objects(s):
    z0 = on_top(s - 1)
    if s == 1:  # silt ripples
        for k in range(9):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.09, depth=W * 0.9, location=(0, -0.8 + k * 0.2, z0 + 0.005),
                                                rotation=(0, math.pi / 2, 0))
            o = bpy.context.object
            o.scale = (0.22, 1, 1)
            o.data.materials.append(mat("ripple", (0.80, 0.69, 0.42), noise=0.2))
    if s == 2:  # painted grey ware sherds: curved grey fragments with black painted bands
        pgw = bpy.data.materials.new("pgw_painted")
        pgw.use_nodes = True
        nt = pgw.node_tree
        bsdf = nt.nodes["Principled BSDF"]
        bsdf.inputs["Roughness"].default_value = 0.45
        tc = nt.nodes.new("ShaderNodeTexCoord")
        wv = nt.nodes.new("ShaderNodeTexWave")
        wv.inputs["Scale"].default_value = 9.0
        wv.inputs["Distortion"].default_value = 0.0
        nt.links.new(tc.outputs["Object"], wv.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.interpolation = "CONSTANT"
        ramp.color_ramp.elements[0].color = (0.04, 0.04, 0.04, 1)
        ramp.color_ramp.elements[1].position = 0.18
        ramp.color_ramp.elements[1].color = (0.20, 0.20, 0.21, 1)
        nt.links.new(wv.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
        spots = [(-1.3, -0.45), (-0.75, 0.35), (-0.15, -0.5), (0.45, 0.15), (1.05, -0.35), (1.45, 0.5), (0.0, 0.6)]
        for k, (x, y) in enumerate(spots):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.34, segments=48, ring_count=24, location=(0, 0, 0))
            shell = bpy.context.object
            sol = shell.modifiers.new("s", "SOLIDIFY")
            sol.thickness = 0.022
            bpy.ops.object.modifier_apply(modifier="s")
            bpy.ops.mesh.primitive_cube_add(location=(0.03 * (k % 3), 0.02 * (k % 2), 0.3))
            cut = bpy.context.object
            cut.scale = (0.12 + 0.03 * (k % 3), 0.09 + 0.02 * (k % 2), 0.12)
            cut.rotation_euler.z = k * 0.7
            bo = shell.modifiers.new("i", "BOOLEAN")
            bo.object = cut
            bo.operation = "INTERSECT"
            bpy.context.view_layer.objects.active = shell
            bpy.ops.object.modifier_apply(modifier="i")
            bpy.data.objects.remove(cut)
            # move the fragment so it rests on the surface, convex side up
            bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
            minz = min((shell.matrix_world @ v.co).z for v in shell.data.vertices)
            shell.location = (x, y, shell.location.z - minz + z0 + 0.001)
            shell.rotation_euler.z = random.random() * 6
            shell.data.materials.clear()
            shell.data.materials.append(pgw)
            bpy.ops.object.shade_smooth()
    if s == 3:  # ring well, cut by the front face, sinking into the pre-Mauryan layer
        for k in range(14):
            zr = z0 - 0.02 - k * 0.09
            bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=0.085, location=(-0.6, -D / 2 + 0.36, zr), vertices=48)
            ring = bpy.context.object
            sol = ring.modifiers.new("s", "SOLIDIFY")
            sol.thickness = -0.06
            bpy.ops.object.modifier_apply(modifier="s")
            ring.data.materials.append(terr)
            bpy.ops.mesh.primitive_cylinder_add(radius=0.33, depth=0.2, location=(-0.6, -D / 2 + 0.36, zr))
            hole = bpy.context.object
            bo = ring.modifiers.new("h", "BOOLEAN")
            bo.object = hole
            bo.operation = "DIFFERENCE"
            bpy.context.view_layer.objects.active = ring
            bpy.ops.object.modifier_apply(modifier="h")
            bpy.data.objects.remove(hole)
        # tiled drain
        for k in range(8):
            box("tile", (0.6 + k * 0.17 - 0.6, 0.35, z0 + 0.01), (0.16, 0.22, 0.02), terr, bevel=0.005)
    if s == 4:  # mud-brick and rubble walls, copper coins
        bricks_wall(-0.4, 0.2, 2.2, "x", 0.36, mud, z0)
        for k in range(10):
            stone((1.1 + random.random() * 0.6, -0.4 + random.random() * 0.8, z0 + 0.06), 0.09, rubble)
        for k in range(5):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.008, location=(-1.2 + k * 0.17, -0.55, z0 + 0.006))
            bpy.context.object.data.materials.append(copper)
    if s == 5:  # three rooms in burnt brick
        h = 0.36
        bricks_wall(0, 0.75, 3.0, "x", h, burnt, z0)
        bricks_wall(0, -0.55, 3.0, "x", h, burnt, z0)
        for x in (-1.5, -0.5, 0.5, 1.5):
            bricks_wall(x, 0.1, 1.3, "y", h, burnt, z0)
    if s == 6:  # burnt brick building and the Gaja Lakshmi medallion (shown as a plain roundel)
        bricks_wall(-0.5, 0.5, 2.4, "x", 0.45, burnt, z0)
        bricks_wall(-1.7, 0.0, 1.0, "y", 0.45, burnt, z0)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.05, location=(0.9, -0.35, z0 + 0.3), rotation=(math.pi / 2.3, 0, 0.3))
        med = bpy.context.object
        med.data.materials.append(terr)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.19, minor_radius=0.015, location=med.location, rotation=med.rotation_euler)
        bpy.context.object.data.materials.append(terr)
        box("stand", (0.9, -0.3, z0 + 0.1), (0.1, 0.1, 0.2), mat("wood", (0.25, 0.17, 0.1)))
    if s == 7:  # brick-bat walls, terracotta dabbers
        for k in range(14):
            box("bat", (-1.6 + k * 0.17, 0.4 + (random.random() - 0.5) * 0.04, z0 + 0.06 + (k % 2) * 0.1),
                (0.16, 0.18 + random.random() * 0.05, 0.09), burnt, bevel=0.01).rotation_euler.z = (random.random() - 0.5) * 0.3
        for k in range(14):
            box("bat", (-0.4, -0.9 + k * 0.1, z0 + 0.05 + (k % 2) * 0.09),
                (0.17, 0.09, 0.09), burnt, bevel=0.01).rotation_euler.z = (random.random() - 0.5) * 0.3
        for k in range(6):
            x, y = 0.5 + (k % 3) * 0.35, -0.5 + (k // 3) * 0.35
            bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.14, location=(x, y, z0 + 0.07))
            bpy.context.object.data.materials.append(terr)
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(x, y, z0 + 0.15))
            o = bpy.context.object
            o.scale = (1, 1, 0.55)
            o.data.materials.append(terr)
            bpy.ops.object.shade_smooth()
    if s == 8:  # wide stone wall and a covered stele for the Vishnu image (no figure shown)
        for c in range(3):
            for k in range(8):
                box("block", (-1.75 + k * 0.5 + (c % 2) * 0.25, 0.45, z0 + 0.12 + c * 0.24),
                    (0.47, 0.75, 0.22), quartz, bevel=0.03)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.12, location=(0.9, -0.5, z0 + 0.65), rotation=(math.pi / 2, 0, 0))
        top = bpy.context.object
        top.data.materials.append(rubble)
        box("stele", (0.9, -0.5, z0 + 0.33), (0.44, 0.12, 0.64), rubble, bevel=0.02)
        cloth = mat("cloth", (0.75, 0.62, 0.40), rough=0.95, noise=0.15)
        box("cloth", (0.9, -0.57, z0 + 0.42), (0.48, 0.02, 0.62), cloth, bevel=0.01)
    if s == 9:  # rubble walls, lime floor, glazed pots
        for k in range(16):
            stone((-1.6 + k * 0.21, 0.6, z0 + 0.1 + (k % 3) * 0.04), 0.12, rubble)
        box("lime", (0.3, -0.25, z0 + 0.008), (2.6, 1.0, 0.016), lime)
        for k, x in enumerate((-0.4, 0.2, 0.8)):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(x, -0.35, z0 + 0.16))
            o = bpy.context.object
            o.scale = (1, 1, 1.15)
            o.data.materials.append(glaze)
            bpy.ops.object.shade_smooth()
            bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.08, location=(x, -0.35, z0 + 0.33))
            bpy.context.object.data.materials.append(glaze)
    if s == 10:  # rampart with crenellations and a gateway
        box("rampart", (0, 0.45, z0 + 0.55), (W, 0.7, 1.1), quartz, bevel=0.02)
        for k in range(9):
            box("merlon", (-1.8 + k * 0.45, 0.2, z0 + 1.2), (0.25, 0.2, 0.22), quartz, bevel=0.01)
        box("gate", (0, 0.09, z0 + 0.55), (1.0, 0.04, 1.08), sand)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=0.2, location=(0, 0.08, z0 + 0.62), rotation=(math.pi / 2, 0, 0))
        arch = bpy.context.object
        box("door", (0, 0.08, z0 + 0.31), (0.6, 0.2, 0.62), mat("shadow", (0.05, 0.04, 0.03)))
        arch.data.materials.append(mat("shadow2", (0.05, 0.04, 0.03)))
        for x in (-1.9, 1.9):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=1.35, location=(x, 0.5, z0 + 0.67), vertices=12)
            bpy.context.object.data.materials.append(quartz)


if STAGE <= 10:
    stage_objects(STAGE)
else:
    stage_objects(10)

# ---------- ground, light, world ----------
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -0.001))
bpy.context.object.data.materials.append(mat("ground", (0.09, 0.085, 0.08), rough=1))
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.035, 0.032, 0.03, 1)
bg.inputs["Strength"].default_value = 1.0
bpy.ops.object.light_add(type="SUN", location=(4, -6, 10))
sun = bpy.context.object
sun.data.energy = 3.2
sun.data.angle = math.radians(8)
sun.data.color = (1.0, 0.92, 0.80)
sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(35))
bpy.ops.object.light_add(type="AREA", location=(-5, -4, TOP + 3))
fill = bpy.context.object
fill.data.energy = 600
fill.data.size = 6
fill.data.color = (0.75, 0.82, 1.0)
fill.rotation_euler = (math.radians(60), 0, math.radians(-50))

# ---------- camera ----------
bpy.ops.object.camera_add()
cam = bpy.context.object
scene.camera = cam
cam.data.lens = 38
if STAGE <= 10:
    lift = {8: 0.35, 10: 1.75}.get(STAGE, 0.0)
    target = Vector((0, 0, TOP - 0.35 + lift))
    cam.location = Vector((3.4, -4.6, TOP + 2.2 + lift * 0.6))
else:
    target = Vector((0.6, 0, tops[-1] * 0.86))
    cam.location = Vector((6.2, -11.5, tops[-1] * 0.70 + 1.4))
    cam.data.lens = 27
d = target - cam.location
cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

if STAGE == 11:
    import json
    from bpy_extras.object_utils import world_to_camera_view
    bpy.context.view_layer.update()
    pts = {}
    for i, (name, t, _) in enumerate(LAYERS):
        v = world_to_camera_view(scene, cam, Vector((W / 2, D / 2, bases[i] + t / 2)))
        pts[name] = [round(v.x * 1080), round((1 - v.y) * 1920)]
    v = world_to_camera_view(scene, cam, Vector((W / 2, -D / 2, tops[-1] + 1.2)))
    pts["fort"] = [round(v.x * 1080), round((1 - v.y) * 1920)]
    v = world_to_camera_view(scene, cam, Vector((W / 2, -D / 2, 0)))
    pts["base"] = [round(v.x * 1080), round((1 - v.y) * 1920)]
    json.dump(pts, open("/home/claude/jaisatha/frames/stage11_layers.json", "w"))
    print("LAYERS", pts)

scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("WROTE", OUT)
