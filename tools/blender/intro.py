"""GAVANA cinematic intro — rebuilt in 3D with Blender (Cycles) from the 2D canvas version.

Run:  python -I tools/blender/intro.py [--frames A-B] [--preview] [--out DIR]
      (needs `pip install bpy`; renders PNG frames to DIR, default /tmp/gavana-intro)
Then: tools/blender/encode-intro.sh DIR   → public/intro/gavana-intro.{mp4,webm} + poster

Same timeline as the canvas intro (8 s): a chrome GAVANA wordmark lights up, the red glove mascot
hops in, taps the G twice, lands the hero punch (letters shake, shockwave), the letters lock back,
a crimson light sweeps across and the glove takes its stance. Everything the canvas drew in 2D is
real geometry here: bevelled extruded letters, a glossy studio floor that reflects them, a spot
light cone, motion blur. "BOXING" and the tagline are NOT rendered — the app overlays them so they
can be localized (MN / KO / EN). Audio is synthesized in the app, in sync with the video.
"""

import math
import os
import sys

import bpy

# ── Timeline (seconds) — mirrors the canvas intro ─────────────────────────
FPS = 30
END = 8.4
HT = 4.67          # hero impact
LOGO_T = 7.22      # stance landing
SETTLE0 = 5.42

TAU = math.tau


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def lerp(a, b, t):
    return a + (b - a) * t


E = {
    "lin": lambda x: x,
    "in": lambda x: x * x,
    "out": lambda x: 1 - (1 - x) * (1 - x),
    "inOut": lambda x: 2 * x * x if x < 0.5 else 1 - pow(-2 * x + 2, 2) / 2,
    "inC": lambda x: x ** 3,
    "outC": lambda x: 1 - pow(1 - x, 3),
    "ioC": lambda x: 4 * x ** 3 if x < 0.5 else 1 - pow(-2 * x + 2, 3) / 2,
    "outQ": lambda x: 1 - pow(1 - x, 5),
    "outBack": lambda x: 1 + 2.70158 * pow(x - 1, 3) + 1.70158 * pow(x - 1, 2),
    "sine": lambda x: -(math.cos(math.pi * x) - 1) / 2,
}


def kf(t, K):
    if t <= K[0][0]:
        return K[0][1]
    for i in range(1, len(K)):
        b = K[i]
        if t <= b[0]:
            a = K[i - 1]
            d = b[0] - a[0]
            p = 1 if d <= 0 else (t - a[0]) / d
            return a[1] + (b[1] - a[1]) * E[b[2] if len(b) > 2 else "inOut"](p)
    return K[-1][1]


# ── Wordmark (original angular glyphs, cap height 200 canvas units) ───────
GLYPHS = {
    "G": (170, [[36, -200, 170, -200, 170, -156, 60, -156, 44, -140, 44, -60, 60, -44, 126, -44, 126, -60, 86, -60, 86, -100, 170, -100, 170, 0, 36, 0, 0, -36, 0, -164]]),
    "A": (180, [[0, 0, 64, -200, 116, -200, 180, 0, 134, 0, 120, -46, 60, -46, 46, 0], [72, -86, 108, -86, 90, -146]]),
    "V": (184, [[0, -200, 48, -200, 92, -62, 136, -200, 184, -200, 118, 0, 66, 0]]),
    "N": (168, [[0, 0, 0, -200, 46, -200, 122, -82, 122, -200, 168, -200, 168, 0, 122, 0, 46, -118, 46, 0]]),
}
LS, GAP, WORD_CX = 0.82, 22, 70
WORD = "GAVANA"
LET = []
_total = sum(GLYPHS[c][0] for c in WORD) + GAP * (len(WORD) - 1)
_x = WORD_CX - _total * LS / 2
for ch in WORD:
    w, polys = GLYPHS[ch]
    LET.append({"ch": ch, "w": w, "polys": polys, "x": _x})
    _x += (w + GAP) * LS
WORD_LEFT = LET[0]["x"]
WORD_RIGHT = LET[-1]["x"] + LET[-1]["w"] * LS
HX, HY = WORD_LEFT + 8, -108

IMP = [dict(t=3.11, i=0, x=5, y=1, r=0.018, z=9, w=32, big=False), dict(t=3.552, i=0, x=9, y=2, r=0.03, z=8, w=30, big=False)]
for i in range(6):
    IMP.append(dict(t=HT + i * 0.05, i=i, x=30 * 0.78 ** i, y=14 * 0.8 ** i, r=0.09 * 0.85 ** i, z=1.8, w=12.5 + i * 0.9, big=True))


def letter_state(i, t):
    x = y = r = flash = 0.0
    for m in IMP:
        if m["i"] != i:
            continue
        tau = t - m["t"]
        if tau <= 0:
            continue
        env = 1.0
        if m["big"]:
            ts = SETTLE0 + i * 0.06
            if t > ts:
                env = 1 - E["ioC"](clamp((t - ts) / 0.4))
        d = math.exp(-m["z"] * tau) * env
        x += m["x"] * math.sin(m["w"] * tau) * d
        r += m["r"] * math.sin(m["w"] * 1.13 * tau) * d
        y -= m["y"] * abs(math.sin(m["w"] * 0.9 * tau)) * d
        flash += math.exp(-16 * tau) * (1 if m["big"] else 0.35)
    tl = SETTLE0 + 0.4 + i * 0.06
    if t > tl:
        k = t - tl
        y += 2.2 * math.exp(-22 * k) * math.sin(34 * k)
        flash += 0.4 * math.exp(-18 * k)
    return x, y, r, flash


# ── Mascot choreography ─────────────────────────────────────────────────
GS = 1.1
START = -900
HOPS = [[1.00, 1.28, 62], [1.32, 1.60, 54], [1.64, 1.92, 40], [2.48, 2.58, 7], [2.60, 2.70, 6], [6.12, 6.28, 12], [7.00, 7.22, 30]]
GX = [[0, START], [1.00, START], [1.28, -800, "lin"], [1.32, -800], [1.60, -668, "lin"], [1.64, -668], [1.92, -528, "lin"],
      [2.48, -528], [2.58, -519, "inOut"], [2.60, -519], [2.70, -512, "inOut"], [3.05, -512], [3.11, -494, "outQ"], [3.16, -496],
      [3.32, -512, "ioC"], [3.40, -514], [3.48, -519, "inOut"], [3.55, -498, "outQ"], [3.60, -499], [3.82, -512, "ioC"],
      [4.00, -512], [4.22, -520, "inOut"], [4.58, -518, "inOut"], [4.67, -500, "outQ"], [4.74, -500], [5.05, -548, "outC"],
      [5.20, -541, "out"], [7.00, -541], [7.22, -530, "lin"]]
ROT = [[0, 0], [1.92, 0], [2.06, -0.07, "out"], [2.36, -0.09, "inOut"], [2.52, 0.05, "inOut"], [2.64, -0.01, "inOut"],
       [2.76, 0.03, "inOut"], [2.97, -0.15, "ioC"], [3.05, -0.17], [3.11, 0.34, "outQ"], [3.16, 0.31], [3.32, -0.02, "ioC"],
       [3.40, -0.06, "inOut"], [3.48, -0.22, "inOut"], [3.55, 0.42, "outQ"], [3.60, 0.39], [3.82, 0, "ioC"], [4.0, 0],
       [4.22, -0.24, "ioC"], [4.30, -0.04, "out"], [4.58, -0.34, "ioC"], [4.67, 0.62, "outQ"], [4.74, 0.6],
       [4.95, -0.28, "outC"], [5.10, 0.12, "out"], [5.26, -0.06, "inOut"], [5.42, 0, "inOut"], [6.12, 0],
       [7.0, 0], [7.1, -0.1, "inOut"], [7.3, 0.13, "outBack"], [7.5, 0.11, "inOut"]]
SX = [[0, 1], [3.05, 1], [3.11, 1.18, "outQ"], [3.16, 1.13], [3.32, 1, "ioC"], [3.48, 0.95, "inOut"], [3.55, 1.24, "outQ"],
      [3.60, 1.17], [3.82, 1, "ioC"], [4.58, 0.92, "ioC"], [4.67, 1.3, "outQ"], [4.74, 1.27], [4.92, 1, "outC"]]
SY = [[0, 1], [2.78, 1], [2.98, 0.9, "ioC"], [3.05, 0.9], [3.11, 0.95, "outQ"], [3.32, 1, "ioC"], [3.48, 0.9, "inOut"],
      [3.55, 0.96, "outQ"], [3.82, 1, "ioC"], [4.0, 1], [4.22, 0.76, "ioC"], [4.27, 1.2, "outQ"], [4.45, 1, "out"], [4.58, 1.04],
      [4.67, 0.94, "outQ"], [4.74, 0.95], [4.9, 1.05, "out"], [5.05, 1, "in"], [7.3, 1], [7.55, 0.96, "inOut"]]
LOOKX = [[1.0, 1], [2.0, 0.7], [2.4, 0.85], [2.6, 1], [5.1, 1], [5.4, 0.9], [6.1, 0.7], [6.95, 1], [7.25, 0.12, "out"]]
LOOKY = [[1.0, 0.1], [1.95, 0], [2.08, -0.95, "out"], [2.38, -0.8], [2.55, -0.1, "inOut"], [2.9, 0.05], [4.25, -0.35],
         [4.6, -0.4], [4.75, -0.2], [5.15, -0.6, "out"], [5.6, -0.5], [6.1, -0.3], [7.25, 0.1, "out"]]
BROW = [[0, 0.1], [2.6, 0.1], [2.88, 1, "inOut"], [4.9, 1], [5.12, -0.9, "outC"], [5.85, -0.7], [6.25, 0.35, "inOut"],
        [7.15, 0.35], [7.35, 0.95, "out"]]
WIDE = [[0, 1], [5.02, 1], [5.14, 1.22, "outBack"], [5.85, 1.2], [6.25, 1, "inOut"], [7.15, 1], [7.3, 0.92, "out"]]
BLINKS = [2.40, 3.93, 5.74, 7.66]


def hop_h(t):
    for a, b, h in HOPS:
        if a < t < b:
            p = (t - a) / (b - a)
            return 4 * h * p * (1 - p)
    if 4.25 < t < 5.05:
        if t < 4.62:
            return 82 * E["out"]((t - 4.25) / 0.37)
        if t < 4.74:
            return 82 + 3 * E["sine"]((t - 4.62) / 0.12)
        return 85 * (1 - E["in"]((t - 4.74) / 0.31))
    return 0.0


def hop_squash(t):
    s = 0.0
    for a, b, h in HOPS:
        k = min(1, h / 50)
        if a - 0.07 < t <= a:
            s -= 0.16 * k * math.sin(math.pi * (t - (a - 0.07)) / 0.07)
        if a < t < b:
            p = (t - a) / (b - a)
            s += 0.13 * k * abs(1 - 2 * p)
        if b <= t < b + 0.6:
            tau = t - b
            s -= 0.22 * k * math.sin(min(1, tau / 0.035) * math.pi / 2) * math.exp(-10 * tau) * math.cos(16 * tau)
    if 4.8 < t < 5.05:
        s += 0.1 * E["in"]((t - 4.8) / 0.25)
    if 5.05 <= t < 5.8:
        tau = t - 5.05
        s -= 0.28 * math.sin(min(1, tau / 0.03) * math.pi / 2) * math.exp(-9 * tau) * math.cos(15 * tau)
    return s


def hop_rot(t):
    r = 0.0
    for a, b, h in HOPS:
        k = min(1, h / 50)
        if a < t < b:
            r += 0.1 * k * math.sin(math.pi * (t - a) / (b - a))
        elif b <= t < b + 0.6:
            tau = t - b
            r += 0.07 * k * math.exp(-9 * tau) * math.sin(15 * tau)
    return r


def blink(t):
    o = 1.0
    for b in BLINKS:
        d = t - b
        if 0 < d < 0.14:
            o = min(o, abs(d - 0.07) / 0.07)
    return clamp(o)


def glove_state(t):
    h = hop_h(t)
    x = kf(t, GX)
    r = kf(t, ROT) + hop_rot(t)
    sy = kf(t, SY) + hop_squash(t)
    sx = kf(t, SX) + (1 - sy) * 0.7
    if t > 7.5:
        k = clamp((t - 7.5) / 0.5)
        ph = (t - 7.5) * 1.75 * TAU
        bb = 0.5 - 0.5 * math.cos(ph)
        sy -= 0.03 * k * bb
        sx += 0.02 * k * bb
        r += 0.02 * k * math.sin(ph)
    return dict(x=x, h=h, r=r, sx=sx, sy=sy, lx=kf(t, LOOKX), ly=kf(t, LOOKY), open=blink(t), brow=kf(t, BROW), wide=kf(t, WIDE))


# ── Camera / light timeline ─────────────────────────────────────────────
ZOOM = [[0, 1.07], [2.2, 1.0, "ioC"], [4.66, 1.0], [4.71, 1.03, "outQ"], [5.3, 1.0, "ioC"], [7.1, 1.0], [8.4, 0.985, "ioC"]]
CAMX = [[0, 40], [1.5, 0, "ioC"], [2.6, -40, "ioC"], [4.6, -40], [5.6, -20, "ioC"], [7.2, -14, "ioC"]]
SHAKES = [[3.11, 2.2, 14], [3.552, 3.6, 13], [HT, 15, 5.5], [LOGO_T, 4, 9]]


def spot_level(t):
    if t < 0.18:
        s = 0.0
    elif t < 0.24:
        s = 0.55 * E["out"]((t - 0.18) / 0.06)
    elif t < 0.30:
        s = 0.55 - 0.45 * ((t - 0.24) / 0.06)
    else:
        s = 0.1 + 0.9 * E["outC"](clamp((t - 0.30) / 0.7))
    if t > HT:
        s += 0.28 * math.exp(-9 * (t - HT))
    if t > LOGO_T:
        s += 0.12 * math.exp(-6 * (t - LOGO_T))
    return s


def shake(t):
    x = y = 0.0
    for t0, a, d in SHAKES:
        tau = t - t0
        if tau < 0 or tau > 1.6:
            continue
        m = a * math.exp(-d * tau)
        x += m * (math.sin(tau * 83) * 0.6 + math.sin(tau * 131 + 1.3) * 0.4)
        y += m * (math.sin(tau * 97 + 2.1) * 0.6 + math.sin(tau * 149 + 0.7) * 0.4)
    return x, y


def sweep(t):
    if t < 6.05 or t > 7.05:
        return None
    p = clamp((t - 6.1) / 0.85)
    return lerp(WORD_LEFT - 280, WORD_RIGHT + 280, E["ioC"](p)), math.sin(math.pi * clamp((t - 6.05) / 1.0))


# canvas units → metres: x/100 along X, up = -y/100 along Z, depth along Y
U = 0.01


# ── Scene building ──────────────────────────────────────────────────────
def mat(name, color, metallic=0.0, rough=0.5, emit=None, emit_strength=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.08
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = emit_strength
    return m


def additive(name, color, strength, fade_z=False):
    """Emission added on top of what's behind (light cone / shockwave).
    fade_z: brightest at the top of the object, gone at the bottom (a beam through haze)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    add = nt.nodes.new("ShaderNodeAddShader")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color, 1)
    em.inputs["Strength"].default_value = strength
    nt.links.new(tr.outputs[0], add.inputs[0])
    nt.links.new(em.outputs[0], add.inputs[1])
    nt.links.new(add.outputs[0], out.inputs["Surface"])
    if fade_z:
        tc = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.0
        ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
        ramp.color_ramp.elements[1].position = 1.0
        ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
        # Facing ratio: dimmer at the silhouette so the cone reads as soft volume.
        lw = nt.nodes.new("ShaderNodeLayerWeight")
        mul = nt.nodes.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        inv = nt.nodes.new("ShaderNodeMath")
        inv.operation = "SUBTRACT"
        inv.inputs[0].default_value = 1.0
        nt.links.new(tc.outputs["Generated"], sep.inputs[0])
        nt.links.new(sep.outputs["Z"], ramp.inputs["Fac"])
        nt.links.new(lw.outputs["Facing"], inv.inputs[1])
        nt.links.new(ramp.outputs["Color"], mul.inputs[0])
        nt.links.new(inv.outputs[0], mul.inputs[1])
        strength_node = nt.nodes.new("ShaderNodeMath")
        strength_node.operation = "MULTIPLY"
        strength_node.inputs[1].default_value = strength
        nt.links.new(mul.outputs[0], strength_node.inputs[0])
        nt.links.new(strength_node.outputs[0], em.inputs["Strength"])
        return m, strength_node.inputs[1]
    return m, em


def build_letter(L, chrome):
    cu = bpy.data.curves.new(f"L_{L['ch']}", "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    cu.extrude = 0.16
    cu.bevel_depth = 0.035
    cu.bevel_resolution = 3
    for poly in L["polys"]:
        sp = cu.splines.new("POLY")
        pts = [(poly[k] * LS * U, -poly[k + 1] * LS * U) for k in range(0, len(poly), 2)]
        sp.points.add(len(pts) - 1)
        for p, (x, y) in zip(sp.points, pts):
            p.co = (x, y, 0, 1)
        sp.use_cyclic_u = True
    ob = bpy.data.objects.new(f"Letter{L['ch']}", cu)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(chrome)
    ob.rotation_euler = (math.pi / 2, 0, 0)   # stand the 2D outline up: curve Y → world Z
    return ob


def build_glove(red, cuff_band, eye_white, pupil, brow):
    root = bpy.data.objects.new("Glove", None)
    bpy.context.collection.objects.link(root)

    def add(prim, name, mtl, parent=root, location=(0, 0, 0), scale=(1, 1, 1), rotation=(0, 0, 0), **kw):
        # Object-level transform (the operator's own `scale` gets baked into the mesh in Blender 5,
        # which would break the per-frame eye / pupil animation below).
        getattr(bpy.ops.mesh, prim)(**kw)
        o = bpy.context.object
        o.name = name
        o.data.materials.append(mtl)
        o.parent = parent
        o.location, o.scale, o.rotation_euler = location, scale, rotation
        bpy.ops.object.shade_smooth()
        return o

    s = GS * U
    # Fist body (canvas: centred ~ (11, -78), ~105 × 100 units), thumb on the camera side.
    add("primitive_uv_sphere_add", "GloveBody", red, segments=48, ring_count=24, radius=1,
        location=(11 * s, 0, 78 * s), scale=(52 * s, 44 * s, 50 * s))
    add("primitive_uv_sphere_add", "GloveThumb", red, segments=32, ring_count=16, radius=1,
        location=(-26 * s, -30 * s, 70 * s), scale=(13 * s, 13 * s, 26 * s), rotation=(0, 0.35, 0))
    add("primitive_cylinder_add", "GloveCuff", red, vertices=40, radius=1, depth=36 * s,
        location=(0, 0, 18 * s), scale=(29 * s, 29 * s, 1))
    add("primitive_cylinder_add", "GloveBand", cuff_band, vertices=40, radius=1, depth=8 * s,
        location=(0, 0, 21 * s), scale=(30 * s, 30 * s, 1))
    eyes = []
    for k, (ex, ey, rx, ry) in enumerate([(17, -84, 6.3, 8.8), (35.5, -82.6, 5.6, 8.1)]):
        # On the front of the fist (toward the camera), a little proud of the surface.
        eye = add("primitive_uv_sphere_add", f"Eye{k}", eye_white, segments=24, ring_count=12, radius=1,
                  location=(ex * s, -44 * s, -ey * s), scale=(rx * 1.25 * s, 5 * s, ry * 1.25 * s))
        pup = add("primitive_uv_sphere_add", f"Pupil{k}", pupil, parent=eye, segments=16, ring_count=8, radius=0.56,
                  location=(0, -0.9, 0), scale=(1, 0.3, 1))
        br = add("primitive_cube_add", f"Brow{k}", brow, size=1,
                 location=(ex * s, -47 * s, (-ey + ry * 1.25 + 4.2) * s), scale=(13 * s, 3 * s, 2.8 * s))
        eyes.append((eye, pup, br, tuple(eye.scale)))
    return root, eyes


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 12
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = 1, int(round(END * FPS))
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.45
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"
    sc.render.film_transparent = False

    world = bpy.data.worlds.new("Studio")
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.004, 0.004, 0.005, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

    chrome = mat("Chrome", (0.86, 0.87, 0.9), metallic=1.0, rough=0.16, emit=(1, 1, 1), emit_strength=0.0)
    red = mat("GloveRed", (0.62, 0.03, 0.05), rough=0.32, coat=0.6)
    band = mat("CuffBand", (0.9, 0.88, 0.84), rough=0.4)
    eye_white = mat("EyeWhite", (0.95, 0.93, 0.9), rough=0.25)
    pupil = mat("Pupil", (0.02, 0.005, 0.006), rough=0.2)
    brow_m = mat("Brow", (0.08, 0.008, 0.01), rough=0.6)
    floor_m = mat("Floor", (0.012, 0.012, 0.014), rough=0.18, coat=0.4)

    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
    floor = bpy.context.object
    floor.name = "Floor"
    floor.data.materials.append(floor_m)

    letters = [build_letter(L, chrome) for L in LET]
    glove, eyes = build_glove(red, band, eye_white, pupil, brow_m)

    # Key spot light over the wordmark + its visible cone (additive, cheaper than volumes).
    bpy.ops.object.light_add(type="SPOT", location=((WORD_CX - 60) * U, -1.2, 7.5))
    spot = bpy.context.object
    spot.data.spot_size = math.radians(62)
    spot.data.spot_blend = 0.55
    spot.data.shadow_soft_size = 0.4
    spot.rotation_euler = (math.radians(9), 0, 0)
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=4.4, radius2=0.35, depth=7.6, end_fill_type="NOTHING",
                                    location=((WORD_CX - 60) * U, 0.6, 3.8))
    cone = bpy.context.object
    cone.name = "LightCone"
    cone_m, cone_em = additive("ConeGlow", (1.0, 0.96, 0.9), 0.0, fade_z=True)
    cone.data.materials.append(cone_m)
    cone.visible_shadow = False

    # Soft fill from the front, crimson rim from behind, and the crimson sweep light.
    bpy.ops.object.light_add(type="AREA", location=(0, -9, 3.5))
    fill = bpy.context.object
    fill.data.size = 8
    fill.data.energy = 0
    fill.rotation_euler = (math.radians(75), 0, 0)
    bpy.ops.object.light_add(type="AREA", location=(3, 4, 3))
    rim = bpy.context.object
    rim.data.color = (1, 0.08, 0.12)
    rim.data.size = 6
    rim.rotation_euler = (math.radians(-60), 0, math.radians(20))
    rim.visible_glossy = False      # light the letters' edges, but don't show up as a slab in the floor
    fill.visible_glossy = False
    # Chrome needs something bright to reflect: a big softbox above the camera that only
    # reflections (and diffuse light) can see — never the camera, never the floor slab look.
    # Vertical chrome faces mirror what's behind the camera at about its height, so the
    # softbox stands there (camera-invisible), with a darker band through the middle like
    # the canvas chrome gradient: bright top strip, dark horizon, bright lower strip.
    bpy.ops.mesh.primitive_plane_add(size=1, location=(-0.4, -26, 3.6))
    softbox = bpy.context.object
    softbox.name = "Softbox"
    softbox.scale = (44, 3.2, 1)
    softbox.rotation_euler = (math.radians(90), 0, 0)
    softbox_m, softbox_em = additive("SoftboxLight", (1.0, 0.98, 0.95), 0.0)
    softbox.data.materials.append(softbox_m)
    softbox.visible_camera = False
    softbox.visible_shadow = False
    bpy.ops.mesh.primitive_plane_add(size=1, location=(-0.4, -26, 0.9))
    low = bpy.context.object
    low.name = "SoftboxLow"
    low.scale = (44, 1.6, 1)
    low.rotation_euler = (math.radians(90), 0, 0)
    low.data.materials.append(softbox_m)
    low.visible_camera = False
    low.visible_shadow = False
    # The crimson sweep: a red softbox that slides left → right in front of the wordmark.
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -24, 2.2))
    sweep_l = bpy.context.object
    sweep_l.name = "CrimsonSweep"
    sweep_l.scale = (7, 6, 1)
    sweep_l.rotation_euler = (math.radians(90), 0, 0)
    sweep_m, sweep_em = additive("SweepLight", (1.0, 0.06, 0.12), 0.0)
    sweep_l.data.materials.append(sweep_m)
    sweep_l.visible_camera = False
    sweep_l.visible_shadow = False

    # Hero shockwave: a ring around the impact point and one across the floor.
    shock_m, shock_em = additive("Shock", (1.0, 0.85, 0.85), 0.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.025, major_segments=96, minor_segments=8,
                                     location=(HX * U, -0.3, -HY * U), rotation=(math.pi / 2, 0, 0))
    ring = bpy.context.object
    ring.data.materials.append(shock_m)
    ring.visible_shadow = False
    floor_shock_m, floor_shock_em = additive("FloorShock", (1.0, 1.0, 1.0), 0.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.02, major_segments=128, minor_segments=6,
                                     location=((HX + 20) * U, 0, 0.02))
    floor_ring = bpy.context.object
    floor_ring.data.materials.append(floor_shock_m)
    floor_ring.visible_shadow = False

    bpy.ops.object.camera_add()
    cam = bpy.context.object
    sc.camera = cam
    cam.data.lens = 40
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = 5.6
    return dict(sc=sc, letters=letters, glove=glove, eyes=eyes, chrome=chrome, spot=spot, cone_em=cone_em, fill=fill, rim=rim,
                sweep=sweep_l, sweep_em=sweep_em, softbox_em=softbox_em, ring=ring, shock_em=shock_em, floor_ring=floor_ring, floor_shock_em=floor_shock_em, cam=cam)


def animate(S):
    sc = S["sc"]
    chrome_bsdf = S["chrome"].node_tree.nodes["Principled BSDF"]
    for f in range(sc.frame_start, sc.frame_end + 1):
        t = (f - 1) / FPS
        spot = spot_level(t)

        # Letters: shake / rotate around the bottom corner like the canvas version.
        flash_max = 0.0
        for i, (L, ob) in enumerate(zip(LET, S["letters"])):
            x, y, r, flash = letter_state(i, t)
            flash_max = max(flash_max, flash)
            pivot = L["w"] * LS * U if r > 0 else 0.0
            # rotation about world Y (depth) keeping the pivot corner in place
            px = pivot - (pivot * math.cos(r))
            pz = pivot * math.sin(r)
            ob.location = ((L["x"] + x) * U + px, 0, -y * U + pz)
            ob.rotation_euler = (math.pi / 2, r, 0)
            ob.keyframe_insert("location", frame=f)
            ob.keyframe_insert("rotation_euler", frame=f)
        chrome_bsdf.inputs["Emission Strength"].default_value = 0.6 * min(1.0, flash_max)
        chrome_bsdf.inputs["Emission Strength"].keyframe_insert("default_value", frame=f)

        # Glove
        G = glove_state(t)
        g = S["glove"]
        g.location = (G["x"] * U, 0.0, G["h"] * U)
        g.rotation_euler = (0, G["r"], 0)
        g.scale = (G["sx"], G["sx"], G["sy"])
        for k in ("location", "rotation_euler", "scale"):
            g.keyframe_insert(k, frame=f)
        for eye, pup, br, base in S["eyes"]:
            eye.scale = (base[0] * G["wide"], base[1], base[2] * G["wide"] * max(0.08, G["open"]))
            eye.keyframe_insert("scale", frame=f)
            pup.location = (G["lx"] * 0.36, -0.9, -G["ly"] * 0.42)
            pup.keyframe_insert("location", frame=f)
            br.rotation_euler = (0, -0.25 * G["brow"], 0)
            br.keyframe_insert("rotation_euler", frame=f)

        # Lights
        S["spot"].data.energy = 2600 * spot
        S["spot"].data.keyframe_insert("energy", frame=f)
        S["cone_em"].default_value = 0.09 * min(1.2, spot)
        S["cone_em"].keyframe_insert("default_value", frame=f)
        S["fill"].data.energy = 260 * min(1.0, spot)
        S["fill"].data.keyframe_insert("energy", frame=f)
        S["rim"].data.energy = 160 * min(1.0, spot) * (1 + 1.2 * clamp((t - 6.0) / 0.5))
        S["rim"].data.keyframe_insert("energy", frame=f)
        sw = sweep(t)
        S["sweep"].location.x = (sw[0] if sw else WORD_LEFT - 300) * U * 2.4
        S["sweep"].keyframe_insert("location", frame=f)
        S["sweep_em"].inputs["Strength"].default_value = 26 * (sw[1] if sw else 0.0)
        S["sweep_em"].inputs["Strength"].keyframe_insert("default_value", frame=f)
        S["softbox_em"].inputs["Strength"].default_value = 1.15 * min(1.1, spot)
        S["softbox_em"].inputs["Strength"].keyframe_insert("default_value", frame=f)

        # Shockwaves after the hero punch
        tau = t - HT
        k = tau / 0.42
        if 0 <= k < 1:
            r = (220 * E["outQ"](k) + 8) * U
            S["ring"].scale = (r * 0.42, r, 1)
            S["shock_em"].inputs["Strength"].default_value = 18 * (1 - k) ** 2
        else:
            S["ring"].scale = (0.001, 0.001, 1)
            S["shock_em"].inputs["Strength"].default_value = 0.0
        S["ring"].keyframe_insert("scale", frame=f)
        S["shock_em"].inputs["Strength"].keyframe_insert("default_value", frame=f)
        k2 = tau / 0.9
        if 0 <= k2 < 1:
            rx = (60 + 1100 * E["outC"](k2)) * U
            S["floor_ring"].scale = (rx, rx * 0.5, 1)
            S["floor_shock_em"].inputs["Strength"].default_value = 6 * (1 - k2) ** 2
        else:
            S["floor_ring"].scale = (0.001, 0.001, 1)
            S["floor_shock_em"].inputs["Strength"].default_value = 0.0
        S["floor_ring"].keyframe_insert("scale", frame=f)
        S["floor_shock_em"].inputs["Strength"].keyframe_insert("default_value", frame=f)

        # Camera: the canvas zoom / pan / impact shake, seen slightly from above so the floor reflects.
        zoom, camx = kf(t, ZOOM), kf(t, CAMX)
        shx, shy = shake(t)
        cx = (camx + shx) * U
        cz = 1.15 + shy * U
        dist = 17.5 / zoom
        cam = S["cam"]
        cam.location = (cx, -dist, cz + 1.0)
        cam.rotation_euler = (math.atan2(dist, 1.0) , shx * 0.0009, 0)
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
        cam.data.dof.focus_distance = dist
        cam.data.dof.keyframe_insert("focus_distance", frame=f)

    # Every value above is set per frame; constant interpolation avoids overshoot between keys.
    for ob in bpy.data.objects:
        ad = ob.animation_data
        if ad and ad.action:
            for fc in getattr(ad.action, "fcurves", []):
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"


def main():
    args = sys.argv[1:]
    out = args[args.index("--out") + 1] if "--out" in args else "/tmp/gavana-intro"
    S = build()
    animate(S)
    sc = S["sc"]
    if "--preview" in args:
        sc.render.resolution_percentage = 50
        sc.cycles.samples = 8
        sc.render.use_motion_blur = False
    if "--frames" in args:
        a, b = args[args.index("--frames") + 1].split("-")
        sc.frame_start, sc.frame_end = int(a), int(b)
    os.makedirs(out, exist_ok=True)
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = os.path.join(out, "f_")
    if "--save-blend" in args:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, "gavana-intro.blend"))
    bpy.ops.render.render(animation=True)
    print("rendered", sc.frame_start, "-", sc.frame_end, "→", out)


if __name__ == "__main__":
    main()
