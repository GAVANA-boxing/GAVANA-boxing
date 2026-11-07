"""Boxing gym environment for GAVANA's 3D scenes, built in Blender and exported as glTF.

Run:  python -I tools/blender/gym.py        (with `pip install bpy`)
  or: blender --background --python tools/blender/gym.py

Writes public/models/gym.glb — the room the heavy bag (/bag) hangs in: concrete
floor, brick back wall with tall bright windows, a ring with corner pads and
three ropes a side, a GAVANA apron, a rack of spare bags and hanging lamps.
Coordinates are built Y-up in metres (exported without the Y-up conversion);
the bag hangs at the origin and the camera looks from +z, so the ring sits
behind it at -z. Lamp bulbs and windows use emissive materials; the scene adds
light shafts and dust in GLSL (lib/three/shaders.js).
"""

import math
import os

import bpy
import bmesh

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "models", "gym.glb")

RING_C = (0.0, -5.6)     # ring centre (x, z)
RING = 5.4               # canvas size (m)
DECK = 0.9               # canvas height above the floor
POST_H = 1.45            # post height above the canvas
ROPES = (0.42, 0.82, 1.22)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


_mats = {}


def mat(name, color, emit=0.0, rough=0.8, metal=0.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emit
    _mats[name] = m
    return m


def box(name, size, loc, material):
    """Axis-aligned box: size (x, y, z) in metres, loc = centre, Y up."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = v.co.x * size[0] + loc[0]
        v.co.y = v.co.y * size[1] + loc[1]
        v.co.z = v.co.z * size[2] + loc[2]
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(material)
    bpy.context.collection.objects.link(ob)
    return ob


def tube(name, a, b, r, material, sides=10):
    """Cylinder from point a to point b (Y-up coordinates)."""
    ax, ay, az = a
    bx, by, bz = b
    d = (bx - ax, by - ay, bz - az)
    length = math.sqrt(sum(c * c for c in d))
    # Orthonormal frame around the axis.
    ux, uy, uz = (c / length for c in d)
    hx, hy, hz = (0.0, 1.0, 0.0) if abs(uy) < 0.9 else (1.0, 0.0, 0.0)
    px, py, pz = uy * hz - uz * hy, uz * hx - ux * hz, ux * hy - uy * hx
    n = math.sqrt(px * px + py * py + pz * pz)
    px, py, pz = px / n, py / n, pz / n
    qx, qy, qz = uy * pz - uz * py, uz * px - ux * pz, ux * py - uy * px
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for end in (a, b):
        ring = []
        for i in range(sides):
            t = 2 * math.pi * i / sides
            c, s = math.cos(t) * r, math.sin(t) * r
            ring.append(bm.verts.new((end[0] + px * c + qx * s, end[1] + py * c + qy * s, end[2] + pz * c + qz * s)))
        rings.append(ring)
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((rings[0][i], rings[0][j], rings[1][j], rings[1][i]))
    bm.faces.new(rings[0])
    bm.faces.new(list(reversed(rings[1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(material)
    bpy.context.collection.objects.link(ob)
    return ob


def text(name, body, loc, size, material, rot_y=0.0):
    bpy.ops.object.text_add(location=(0, 0, 0))
    t = bpy.context.object
    t.data.body = body
    t.data.align_x = "CENTER"
    t.data.size = size
    t.data.extrude = 0.004
    bpy.ops.object.convert(target="MESH")
    ob = bpy.context.object
    ob.name = name
    # Blender text lies in its XY plane facing +Z — in our Y-up coordinates that is
    # already upright and facing the camera (+z), so it only needs moving.
    ob.location = loc
    ob.data.materials.clear()
    ob.data.materials.append(material)
    return ob


def build():
    concrete = mat("Concrete", (0.12, 0.12, 0.13), rough=0.95)
    brick = mat("Brick", (0.28, 0.12, 0.09), rough=0.9)
    window = mat("Window", (0.85, 0.9, 1.0), emit=2.2)
    canvas = mat("Canvas", (0.55, 0.58, 0.62), rough=0.85)
    apron = mat("Apron", (0.45, 0.04, 0.04), rough=0.7)
    white = mat("White", (0.92, 0.92, 0.92))
    red = mat("Red", (0.75, 0.05, 0.04), rough=0.5)
    blue = mat("Blue", (0.05, 0.18, 0.7), rough=0.5)
    steel = mat("Steel", (0.6, 0.6, 0.64), rough=0.35, metal=0.9)
    dark = mat("Dark", (0.05, 0.05, 0.06), rough=0.6)
    bagleather = mat("BagLeather", (0.32, 0.05, 0.05), rough=0.55)
    bulb = mat("Bulb", (1.0, 0.86, 0.6), emit=6.0)

    # Room
    box("Floor", (16, 0.1, 18), (0, -0.05, -3), concrete)
    box("BackWall", (16, 6, 0.3), (0, 3, -11.5), brick)
    box("LeftWall", (0.3, 6, 18), (-8, 3, -3), brick)
    for i, x in enumerate((-5.2, -1.8, 1.8, 5.2)):
        box(f"Window{i}", (2.2, 2.6, 0.05), (x, 3.4, -11.32), window)
        box(f"WindowBar{i}", (0.08, 2.6, 0.08), (x, 3.4, -11.28), dark)

    # Ring
    cx, cz = RING_C
    half = RING / 2
    box("RingDeck", (RING + 0.6, DECK, RING + 0.6), (cx, DECK / 2, cz), apron)
    box("RingCanvas", (RING + 0.4, 0.04, RING + 0.4), (cx, DECK + 0.02, cz), canvas)
    text("ApronText", "GAVANA", (cx, DECK * 0.42, cz + half + 0.31), 0.32, white)
    corners = [(-1, 1, red), (1, 1, white), (1, -1, blue), (-1, -1, white)]
    posts = []
    for i, (sx, sz, pad) in enumerate(corners):
        x, z = cx + sx * half, cz + sz * half
        tube(f"Post{i}", (x, DECK, z), (x, DECK + POST_H, z), 0.05, steel)
        box(f"Pad{i}", (0.22, POST_H - 0.2, 0.22), (x, DECK + POST_H / 2 + 0.05, z), pad)
        posts.append((x, z))
    rope_mats = (red, white, blue)
    for i in range(4):
        (x0, z0), (x1, z1) = posts[i], posts[(i + 1) % 4]
        for k, h in enumerate(ROPES):
            tube(f"Rope{i}_{k}", (x0, DECK + h, z0), (x1, DECK + h, z1), 0.022, rope_mats[k])
    # Steps up to the red corner
    for k in range(3):
        box(f"Step{k}", (1.0, 0.3, 0.35), (cx - half - 0.2 - 0.0, 0.15 + k * 0.3, cz + half + 0.75 - k * 0.35), dark)

    # Bag rack along the left wall: a beam and two spare bags
    box("RackBeam", (0.15, 0.15, 6), (-6.6, 3.1, -3.5), steel)
    for i, z in enumerate((-1.8, -5.2)):
        tube(f"RackChain{i}", (-6.6, 3.1, z), (-6.6, 2.25, z), 0.01, steel)
        tube(f"RackBag{i}", (-6.6, 2.2, z), (-6.6, 1.05, z), 0.17, bagleather, sides=20)

    # Hanging lamps over the ring and the bag
    for i, (x, z) in enumerate(((cx - 1.4, cz), (cx + 1.4, cz), (0.0, 0.2))):
        tube(f"LampCord{i}", (x, 6.0, z), (x, 4.3, z), 0.008, dark)
        bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.38, radius2=0.08, depth=0.3, location=(0, 0, 0))
        shade = bpy.context.object
        shade.name = f"LampShade{i}"
        # Cone axis is Blender Z (wide end at -Z); rotate it onto our Y axis with the
        # wide end down: (x, y, z) -> (x, z, -y) is a proper rotation, so normals stay outward.
        for v in shade.data.vertices:
            x0, y0, z0 = v.co.x, v.co.y, v.co.z
            v.co.x, v.co.y, v.co.z = x0, z0, -y0
        shade.location = (x, 4.15, z)
        shade.data.materials.append(dark)
        box(f"LampBulb{i}", (0.16, 0.06, 0.16), (x, 4.02, z), bulb)


def main():
    reset()
    build()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_yup=False, export_apply=True)
    print("wrote", os.path.relpath(OUT), os.path.getsize(OUT) // 1024, "KB")


if __name__ == "__main__":
    main()
