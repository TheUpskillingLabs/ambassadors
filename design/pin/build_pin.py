"""Builds the ambassador pin's production art from the OLOS orb.

Output: pin-front.svg at 1:1 scale in millimetres. Every enamel colour is a
filled closed shape (no strokes, no gradients), separated from its neighbours
by 0.4 mm of raised metal, so the file works for the factory and imports into
Blender as clean curves. Re-run after changing any constant:

    pip install shapely && python3 design/pin/build_pin.py
"""
from pathlib import Path
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union
from shapely import affinity

D = 31.75         # pin diameter (1.25 in; at 1 in the swoosh tail is too thin)
RIM = 0.6         # outer metal rim
LINE = 0.4        # raised metal between colours (factory minimum 0.2-0.3)
MIN_CELL = 0.3    # thinnest enamel a cell may have
C = D / 2

# Colours: screen value, then the Pantone to confirm against a physical guide.
INK = ("#00141B", "Black 6 C")
RED = ("#E11D2A", "185 C")
TEAL = ("#00B5C2", "3125 C")  # the bright end of the orb gradient; brand #0094A0 goes muddy on ink at this size
METAL = ("#C9CED2", "polished nickel")


def cubic(p0, p1, p2, p3, n=48):
    return [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d
                  for a, b, c, d in zip(p0, p1, p2, p3)) for t in (i / n for i in range(n + 1))]


# The OLOS orb mark, in its own 240-unit box (see src/components/Orb.astro).
pts = []
pts += cubic((0, 900.84), (532.341, 651.368), (841.069, 454.81), (1407.215, 0))
pts += cubic((1407.215, 0), (1190.699, 365.98), (1060.371, 566.788), (776.503, 900.84))[1:]
pts += [(950.588, 496.405)]
pts += cubic((950.588, 496.405), (539.219, 733.009), (347.248, 789.767), (0, 900.84))[1:]
arrow = affinity.translate(affinity.scale(Polygon(pts), 0.142, 0.142, origin=(0, 0)), 20, 40)

face = Point(120, 120).buffer(116, 256)
# The red rim of the orb's glow, cut at the gradient's midpoint.
red = face.difference(Point(147.8, 185).buffer(128, 256))
arrow = arrow.intersection(face)
ink = face.difference(unary_union([red, arrow]))

# 240-unit box -> millimetres, orb face = inner edge of the rim.
s = (C - RIM) / 116
to_mm = lambda g: affinity.translate(affinity.scale(g, s, s, origin=(120, 120)), C - 120, C - 120)


def cell(g):
    g = to_mm(g).buffer(-LINE / 2, join_style=2)          # leave half a line of metal each side
    g = g.buffer(-MIN_CELL / 2).buffer(MIN_CELL / 2)       # drop slivers too thin to fill
    return g


def d(g):
    polys = getattr(g.simplify(0.01), "geoms", [g.simplify(0.01)])  # 0.01 mm: invisible, keeps the file small
    out = []
    for p in polys:
        for ring in [p.exterior, *p.interiors]:
            xy = list(ring.coords)
            out.append("M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in xy) + " Z")
    return " ".join(out)


cells = [("enamel-ink", INK, cell(ink)), ("enamel-red", RED, cell(red)), ("enamel-teal", TEAL, cell(arrow))]
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{D}mm" height="{D}mm" viewBox="0 0 {D} {D}">',
       f'  <title>Ambassador pin, front, 1:1 mm. Hard enamel, {METAL[1]}, {D} mm. Metal lines {LINE} mm.</title>',
       f'  <circle id="metal" cx="{C}" cy="{C}" r="{C}" fill="{METAL[0]}"/>']
for name, (hex_, pms), g in cells:
    svg.append(f'  <path id="{name}" data-pantone="PMS {pms}" fill="{hex_}" fill-rule="evenodd" d="{d(g)}"/>')
svg.append("</svg>")
out = Path(__file__).with_name("pin-front.svg")
out.write_text("\n".join(svg) + "\n")
# The site shows the same art on Home, so the goal looks like the real thing.
Path(__file__).parents[2].joinpath("public", "pin.svg").write_text("\n".join(svg) + "\n")

for name, (_, pms), g in cells:
    print(f"{name:12} PMS {pms:10} area {g.area:6.1f} mm2  parts {len(getattr(g, 'geoms', [g]))}")
print("wrote", out)
