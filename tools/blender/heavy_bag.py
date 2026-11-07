"""Heavy bag model for GAVANA's /bag scene, built in Blender and exported as glTF.

Run with Blender (or the `bpy` Python module):
    blender --background --python tools/blender/heavy_bag.py
    # or: python -I tools/blender/heavy_bag.py   (with `pip install bpy`)

Writes public/models/heavy-bag.glb. The scene code (components/bag/HeavyBagScene.js)
takes the mesh named "Bag" and draws it with its own GLSL leather / impact shader,
so only the shape matters here: a 1.1 m x 0.18 m-radius bag with rounded ends,
a bevelled top cap and three stitched bands, origin at the bag's centre, Y up.
"""

import math
import os

import bpy
import bmesh

HEIGHT = 1.1
RADIUS = 0.18
SEGMENTS = 48       # around
RINGS = 30          # along the height — the shader dents vertices, so it needs some
ROUND = 0.035       # how much the top and bottom edges are rounded (m)
BANDS = (0.28, 0.0, -0.28)   # stitched band heights (m from centre)
BAND_DEPTH = 0.004

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "models", "heavy-bag.glb")


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def radius_at(y):
    """Bag profile: straight side, rounded towards the ends, slight belly, band grooves."""
    half = HEIGHT / 2
    r = RADIUS * (1.0 + 0.02 * math.cos(math.pi * y / HEIGHT))   # a little fuller in the middle
    edge = half - abs(y)
    if edge < ROUND:                                              # rounded ends
        t = 1 - edge / ROUND
        r -= ROUND * (1 - math.sqrt(max(0.0, 1 - t * t)))
    for b in BANDS:
        if abs(y - b) < 0.012:
            r -= BAND_DEPTH * (1 - abs(y - b) / 0.012)
    return r


def build_bag():
    mesh = bpy.data.meshes.new("Bag")
    bm = bmesh.new()
    half = HEIGHT / 2
    rings = []
    for k in range(RINGS + 1):
        y = half - HEIGHT * k / RINGS
        r = radius_at(y)
        ring = [bm.verts.new((r * math.cos(2 * math.pi * i / SEGMENTS), y, r * math.sin(2 * math.pi * i / SEGMENTS)))
                for i in range(SEGMENTS)]
        rings.append(ring)
    for k in range(RINGS):
        a, b = rings[k], rings[k + 1]
        for i in range(SEGMENTS):
            j = (i + 1) % SEGMENTS
            bm.faces.new((a[i], a[j], b[j], b[i]))
    # Caps: fan to a centre vertex, slightly domed.
    for ring, y, sign in ((rings[0], half, 1), (rings[-1], -half, -1)):
        c = bm.verts.new((0.0, y + sign * 0.01, 0.0))
        for i in range(SEGMENTS):
            j = (i + 1) % SEGMENTS
            bm.faces.new((ring[i], ring[j], c) if sign > 0 else (ring[j], ring[i], c))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new("Bag", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def build_straps():
    """Four straps from the top rim up to the swivel point, as a separate mesh ("Straps")."""
    mesh = bpy.data.meshes.new("Straps")
    bm = bmesh.new()
    half = HEIGHT / 2
    apex = (0.0, half + 0.2, 0.0)
    w = 0.012
    for i in range(4):
        a = math.pi / 4 + i * math.pi / 2
        foot = (math.cos(a) * (RADIUS - 0.02), half + 0.005, math.sin(a) * (RADIUS - 0.02))
        # A thin flat strip, widened sideways (perpendicular to its direction around the bag).
        sx, sz = -math.sin(a) * w, math.cos(a) * w
        v = [bm.verts.new((foot[0] - sx, foot[1], foot[2] - sz)), bm.verts.new((foot[0] + sx, foot[1], foot[2] + sz)),
             bm.verts.new((apex[0] + sx * 0.4, apex[1], apex[2] + sz * 0.4)), bm.verts.new((apex[0] - sx * 0.4, apex[1], apex[2] - sz * 0.4))]
        bm.faces.new(v)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("Straps", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def main():
    reset()
    build_bag()
    build_straps()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    # Blender is Z-up; our mesh was built Y-up, so export without the Y-up conversion.
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_yup=False,
                              export_apply=True, export_materials="NONE")
    print("wrote", os.path.relpath(OUT))


if __name__ == "__main__":
    main()
