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



# ---------- small finds and details (all named in Swarnkar and Bal 2023-24) ----------
def mk(name, col, rough=0.6, metal=0.0, noise=0.0):
    return mat(name, col, rough=rough, noise=noise, metal=metal)


redware = None


def frag(loc, m, r=0.16, k=0, flat=False):
    """A curved pot fragment cut from a bowl shell, resting on the surface."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=32, ring_count=16, location=(0, 0, 0))
    sh = bpy.context.object
    so = sh.modifiers.new("s", "SOLIDIFY")
    so.thickness = r * 0.07
    bpy.ops.object.modifier_apply(modifier="s")
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, r * 0.9))
    cu = bpy.context.object
    cu.scale = (r * (0.35 + 0.1 * (k % 3)), r * (0.28 + 0.08 * (k % 2)), r * 0.4)
    cu.rotation_euler.z = k * 0.9
    bo = sh.modifiers.new("i", "BOOLEAN")
    bo.object = cu
    bo.operation = "INTERSECT"
    bpy.context.view_layer.objects.active = sh
    bpy.ops.object.modifier_apply(modifier="i")
    bpy.data.objects.remove(cu)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    if flat:
        sh.rotation_euler.x = math.pi
    bpy.context.view_layer.update()
    mz = min((sh.matrix_world @ v.co).z for v in sh.data.vertices)
    sh.location = (loc[0], loc[1], sh.location.z - mz + loc[2] + 0.001)
    sh.rotation_euler.z = random.random() * 6
    sh.data.materials.clear()
    sh.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    return sh


def bead(loc, m, r=0.035, ghat=False):
    if ghat:  # double cone
        for sgn in (1, -1):
            bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r * 0.35, depth=r * 1.1,
                                            location=(loc[0], loc[1], loc[2] + r * 0.9 + sgn * r * 0.55),
                                            rotation=(0 if sgn > 0 else math.pi, 0, 0), vertices=16)
            bpy.context.object.data.materials.append(m)
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(loc[0], loc[1], loc[2] + r))
        bpy.context.object.data.materials.append(m)
        bpy.ops.object.shade_smooth()


def disc(loc, r, h, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=32)
    bpy.context.object.data.materials.append(m)
    return bpy.context.object


def pot(loc, m, r=0.12, h=0.22, neck=0.55):
    """A simple wheel-made pot from a lathed profile."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(loc[0], loc[1], loc[2] + h * 0.45), segments=32, ring_count=16)
    b = bpy.context.object
    b.scale = (1, 1, h / (2 * r))
    b.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    bpy.ops.mesh.primitive_cylinder_add(radius=r * neck * 0.6, depth=h * 0.25, location=(loc[0], loc[1], loc[2] + h * 0.92), vertices=24)
    bpy.context.object.data.materials.append(m)
    bpy.ops.mesh.primitive_torus_add(major_radius=r * neck * 0.62, minor_radius=r * 0.06, location=(loc[0], loc[1], loc[2] + h * 1.04))
    bpy.context.object.data.materials.append(m)


def inclusions(i):
    """Pebbles and pottery chips showing in the cut faces of layer i."""
    rs = random.Random(100 + i)
    pal = [(0.42, 0.40, 0.37), (0.55, 0.30, 0.18), (0.30, 0.29, 0.28), (0.62, 0.55, 0.45)]
    mats_ = [mat(f"inc{i}_{j}", c, rough=0.8, noise=0.2) for j, c in enumerate(pal)]
    t = LAYERS[i][1]
    for n in range(14):
        z = bases[i] + 0.06 + rs.random() * (t - 0.12)
        if rs.random() < 0.6:
            loc = (-W / 2 + 0.1 + rs.random() * (W - 0.2), -D / 2 - 0.004, z)
        else:
            loc = (W / 2 + 0.004, -D / 2 + 0.1 + rs.random() * (D - 0.2), z)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.018 + rs.random() * 0.03, location=loc)
        o = bpy.context.object
        o.scale = (1, 1, 0.5 + rs.random() * 0.4)
        o.rotation_euler = (rs.random(), rs.random(), rs.random())
        o.data.materials.append(mats_[n % len(mats_)])


def extras(s, z0):
    red = mk("redware", (0.60, 0.26, 0.15), rough=0.55)
    blackish = mk("blackware", (0.12, 0.11, 0.10), rough=0.5)
    nbpw = mk("nbpw", (0.03, 0.03, 0.035), rough=0.08)
    tc = mk("tc2", (0.66, 0.36, 0.20), rough=0.75, noise=0.2)
    charcoal = mat("burnt", (0.08, 0.06, 0.05), rough=0.95, noise=0.4, scale=12)
    stonew = mk("stonew", (0.36, 0.34, 0.31), rough=0.4, noise=0.15)
    glassb = mk("glassbead", (0.15, 0.45, 0.40), rough=0.1)
    if s == 2:   # grey, blackish and red ware fragments beside the PGW
        for k, (x, y) in enumerate([(-1.55, 0.05), (-0.45, -0.1), (0.85, 0.65), (1.75, -0.1), (0.25, -0.15)]):
            frag((x, y, z0), red if k % 2 == 0 else blackish, r=0.2, k=k)
    if s == 3:   # NBPW sherds, ghat-shaped beads, terracotta disc, sling balls
        for k, (x, y) in enumerate([(0.9, -0.45), (1.3, -0.2), (1.6, -0.55)]):
            frag((x, y, z0), nbpw, r=0.2, k=k)
        for k in range(4):
            bead((0.3 + k * 0.14, -0.55, z0), tc, r=0.05, ghat=True)
        disc((0.45, 0.75, z0 + 0.012), 0.09, 0.024, tc)
        for k in range(3):
            bead((1.2 + k * 0.13, 0.75, z0), tc, r=0.05)
    if s == 4:   # burnt patches, beads, a stone weight
        for x, y, r in [(0.2, -0.45, 0.32), (1.4, 0.55, 0.22)]:
            disc((x, y, z0 + 0.003), r, 0.006, charcoal)
        for k in range(5):
            bead((-1.65 + k * 0.12, -0.15, z0), tc if k % 2 else glassb, r=0.04)
        b = box("weight", (0.6, -0.2, z0 + 0.05), (0.12, 0.12, 0.1), stonew, bevel=0.03)
    if s == 5:   # small carinated pot and glass beads inside a room
        pot((-1.0, 0.15, z0), red, r=0.1, h=0.17)
        pot((0.0, 0.2, z0), stonew, r=0.09, h=0.15, neck=0.8)
        for k in range(4):
            bead((0.9 + k * 0.1, 0.0, z0), glassb, r=0.035)
    if s == 6:   # brick-jelly floor, terracotta dice, red-slipped vase
        floor = mat("brickjelly", (0.55, 0.24, 0.15), rough=0.9, noise=0.5, scale=90)
        box("brickjelly", (0.1, -0.3, z0 + 0.008), (2.4, 1.0, 0.016), floor)
        for k in range(2):
            box("die", (-0.6 + k * 0.12, -0.45, z0 + 0.05), (0.06, 0.06, 0.06), tc, bevel=0.008).rotation_euler.z = k * 0.6
        pot((-1.3, -0.35, z0 + 0.016), red, r=0.11, h=0.24)
    if s == 7:   # a pot with a flanged rim beside the dabbers
        pot((-1.2, -0.45, z0), red, r=0.12, h=0.2, neck=0.9)
    if s == 8:   # two post-holes and a heap of knife-edged bowls
        for x in (-1.1, -0.6):
            disc((x, -0.2, z0 + 0.002), 0.07, 0.004, mat("hole", (0.02, 0.015, 0.01), rough=1))
        for k in range(7):
            bx, by = -0.25 + (k % 4) * 0.2, -0.55 + (k // 4) * 0.2
            bpy.ops.mesh.primitive_cone_add(radius1=0.05, radius2=0.13, depth=0.08, end_fill_type="NOTHING",
                                            location=(bx, by, z0 + 0.045 + (0.05 if k == 6 else 0)),
                                            rotation=(0.25 if k % 2 else -0.2, 0.15 * (k % 3), 0), vertices=40)
            o = bpy.context.object
            sol = o.modifiers.new("s", "SOLIDIFY")
            sol.thickness = 0.012
            o.data.materials.append(red)
            bpy.ops.object.shade_smooth()
    if s == 9:   # chillums and a ring-based pot
        for k in range(3):
            bpy.ops.mesh.primitive_cone_add(radius1=0.022, radius2=0.06, depth=0.16, location=(1.2 + k * 0.16, -0.5, z0 + 0.03),
                                            rotation=(math.pi / 2, 0, 0.4 + k * 0.5), vertices=24)
            bpy.context.object.data.materials.append(mk("chillum", (0.28, 0.27, 0.26), rough=0.6))
        pot((1.55, 0.1, z0), red, r=0.12, h=0.22)
    if s == 10:  # blue-and-white porcelain and green glass bottle fragments
        bw = bpy.data.materials.new("bluewhite")
        bw.use_nodes = True
        nt = bw.node_tree
        bs = nt.nodes["Principled BSDF"]
        bs.inputs["Roughness"].default_value = 0.15
        tco = nt.nodes.new("ShaderNodeTexCoord")
        wv = nt.nodes.new("ShaderNodeTexWave")
        nt.links.new(tco.outputs["Object"], wv.inputs["Vector"])
        wv.inputs["Scale"].default_value = 45
        wv.inputs["Distortion"].default_value = 9
        rp = nt.nodes.new("ShaderNodeValToRGB")
        rp.color_ramp.elements[0].color = (0.05, 0.12, 0.45, 1)
        rp.color_ramp.elements[1].position = 0.62
        rp.color_ramp.elements[1].color = (0.92, 0.93, 0.95, 1)
        nt.links.new(wv.outputs["Fac"], rp.inputs["Fac"])
        nt.links.new(rp.outputs["Color"], bs.inputs["Base Color"])
        for k, (x, y) in enumerate([(1.0, -0.6), (1.35, -0.35), (0.7, -0.75)]):
            frag((x, y, z0), bw, r=0.18, k=k)
        g = bpy.data.materials.new("greenglass")
        g.use_nodes = True
        gb = g.node_tree.nodes["Principled BSDF"]
        gb.inputs["Base Color"].default_value = (0.25, 0.55, 0.30, 1)
        gb.inputs["Roughness"].default_value = 0.05
        gb.inputs["Transmission Weight"].default_value = 0.8
        for k, (x, y) in enumerate([(-1.2, -0.6), (-0.9, -0.75)]):
            disc((x, y, z0 + 0.04), 0.045, 0.12, g, rot=(math.pi / 2, 0, k * 1.2))

for _i in range(n_layers):
    inclusions(_i)
if STAGE <= 10:
    stage_objects(STAGE)
    extras(STAGE, on_top(STAGE - 1))
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
    # Fit the whole block in frame: back the camera away along a fixed direction until every
    # object (not the ground) projects inside x 110..970 px and below the text area (y >= 640 px).
    from bpy_extras.object_utils import world_to_camera_view
    target = Vector((0, 0, TOP - 0.2))
    dirv = Vector((3.4, -4.6, 2.4)).normalized()
    cam.data.lens = 34
    pts3 = []
    for ob in scene.objects:
        if ob.type == "MESH" and ob.name not in ("Plane",) and ob.dimensions.x < 30:
            pts3 += [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    dist = 5.0
    while dist < 60:
        cam.location = target + dirv * dist
        cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
        bpy.context.view_layer.update()
        ok = True
        for p3 in pts3:
            v = world_to_camera_view(scene, cam, p3)
            px, py = v.x * 1080, (1 - v.y) * 1920
            if p3.z >= bases[max(0, n_layers - 2)] and (px < 110 or px > 970 or py < (700 if STAGE == 10 else 640)):
                ok = False
                break
        if ok:
            break
        dist += 0.25
    print("FIT dist", round(dist, 2))
else:
    target = Vector((0.6, 0, tops[-1] * 0.86))
    cam.location = Vector((6.2, -11.5, tops[-1] * 0.70 + 1.4))
    cam.data.lens = 27
if STAGE > 10:
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

if STAGE <= 10:
    bpy.ops.object.empty_add(location=(0, 0, TOP))
    cam.data.dof.use_dof = True
    cam.data.dof.focus_object = bpy.context.object
    cam.data.dof.aperture_fstop = 5.6

scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("WROTE", OUT)
