"""Builds the ambassador pin's production art from The Upskilling Labs orb mark.

Reference: brandkit/assets/orb-mark.png (github.com/TheUpskillingLabs/brandkit),
the orb on ink, 1024 px. Everything in REF below is in that image's pixels (y
down) and was traced from it:
  - the orb: a circle fit to its edge (575 edge points, 1.1 px rms);
  - the swoosh: four cubic Beziers fit to its edges (within 2 px);
  - the gradient: the teal and the red each fade out towards the middle. Each
    edge is a circle fit to where that colour falls to 30% of full, about
    where the eye stops reading it as teal or red.
The mark reads as teal above, ink through the middle, red below, with the
swoosh on top. The swoosh breaks out of the orb at both ends, like the NASA
meatball it pays homage to, so the pin is die-cut to the mark's silhouette
rather than a plain round.

Output: pin-front.svg at 1:1 scale in millimetres, and the same cells for the
3D model (the ART block in blender/ambassador_pin.py). Every enamel colour is a
filled closed shape (no strokes, no gradients), separated from its neighbours
by 0.4 mm of raised metal, so the file works for the factory and imports into
Blender as clean curves. Re-run after changing any constant:

    pip install shapely && python3 design/pin/build_pin.py
"""
from pathlib import Path
import re
from shapely.geometry import Point, Polygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union
from shapely import affinity

WIDTH = 31.75     # overall width, swoosh tail to tip, rim included (1.25 in)
RIM = 0.6         # metal border around the mark's silhouette
LINE = 0.4        # raised metal between colours (factory minimum 0.2-0.3)
MIN_CELL = 0.3    # thinnest enamel a cell may have
FILLET = 0.3      # rounds the inside corners where the swoosh leaves the orb
GROW = 0.1        # the enamel swoosh is the logo's full swoosh plus this much each side; its
                  # metal line sits outside it, so the filled swoosh keeps the logo's proportions
                  # and the tail and tip stay filled until they are thinner than 0.1 mm in the logo

# Colours: screen value, then the Pantone to confirm against a physical guide.
INK = ("#00141B", "Black 6 C")      # brand ink: the dark band through the middle
TEAL = ("#0094A0", "320 C")         # brand teal: the orb's upper cap
SWOOSH = ("#00B5C2", "3125 C")      # the swoosh reads brighter than the orb in the mark
RED = ("#E11D2A", "485 C")          # brand red: the orb's lower lobe
# Polished nickel. For gold plating use ("#D4AF37", "polished gold").
METAL = ("#C9CED2", "polished nickel")

# ── Traced from orb-mark.png (px, y down) ──────────────────────────────────
REF = {
    "orb": (511.19, 485.02, 347.93),              # centre x, centre y, radius
    "swoosh": [                                    # tail > tip > barb > notch > tail
        ((157.24, 631.88), (468.07, 494.62), (622.12, 376.33), (882.04, 172.61)),   # upper edge
        ((882.04, 172.61), (762.30, 368.19), (737.04, 403.95), (562.85, 629.60)),   # outer edge of the barb
        ((562.85, 629.60), (593.82, 561.60), (623.41, 492.90), (651.61, 423.53)),   # inner edge of the barb
        ((651.61, 423.53), (477.63, 522.08), (361.31, 564.39), (157.24, 631.88)),   # lower edge
    ],
    "teal_edge": (303.6, -91.3, 454.1),           # teal cap = orb inside this circle
    "red_edge": (124.7, -434.4, 1123.9),          # red cap = orb outside this circle
}


def cubic(p0, p1, p2, p3, n=64):
    return [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d
                  for a, b, c, d in zip(p0, p1, p2, p3)) for t in (i / n for i in range(n + 1))]


def disc(c, res=512):
    return Point(c[0], c[1]).buffer(c[2], res)


def regions(ref=REF):
    """The mark as flat colour regions, in reference px (before metal lines)."""
    pts = []
    for seg in ref["swoosh"]:
        pts += cubic(*seg)[1:] if pts else cubic(*seg)
    swoosh = Polygon(pts).buffer(0)
    face = disc(ref["orb"])
    teal = face.intersection(disc(ref["teal_edge"])).difference(swoosh)
    red = face.difference(disc(ref["red_edge"])).difference(swoosh)
    ink = face.difference(unary_union([teal, red, swoosh]))
    return face, swoosh, {"ink": ink, "teal": teal, "swoosh": swoosh, "red": red}


def build(ref=REF, width=WIDTH):
    face, swoosh, reg = regions(ref)
    minx, _, maxx, _ = swoosh.union(face).bounds
    s = (width - 2 * RIM) / (maxx - minx)                     # px -> mm (sets the orb's size)
    ox, oy, _ = ref["orb"]
    to_mm = lambda g: affinity.scale(affinity.translate(g, -ox, -oy), s, -s, origin=(0, 0))  # centred on the orb, y up
    fill = lambda g: g.buffer(-MIN_CELL / 2).buffer(MIN_CELL / 2)  # drop slivers too thin to fill

    sw = to_mm(swoosh)
    keep_out = sw.buffer(GROW + LINE, 32)                      # the swoosh's metal line, outside the logo's swoosh
    outline = unary_union([to_mm(face).buffer(RIM, 64), sw.buffer(GROW + LINE / 2 + RIM, 32)])
    outline = outline.buffer(FILLET, 32).buffer(-FILLET, 32)

    def cell(g):
        g = to_mm(g).buffer(-LINE / 2, join_style=2)          # half a line of metal between neighbours
        return fill(g.difference(keep_out))

    cells = {k: cell(g) for k, g in reg.items() if k != "swoosh"}
    cells["swoosh"] = fill(sw.buffer(GROW, 32))
    # One field for the whole orb (ink with teal and red glows fading into it): the glow finish.
    cells["orb"] = fill(to_mm(face).buffer(-LINE / 2, 64).difference(keep_out))
    return outline, cells, s


COLOURS = {"ink": INK, "teal": TEAL, "swoosh": SWOOSH, "red": RED}


def polys(g):
    return [p for p in getattr(g, "geoms", [g]) if not p.is_empty]


def main():
    outline, cells, s = build()
    x0, y0, x1, y1 = outline.bounds
    W, H = x1 - x0, y1 - y0
    svg_xy = lambda x, y: (x - x0, y1 - y)                    # mm, y up -> SVG, y down

    def d(g):
        out = []
        for p in polys(g.simplify(0.01)):                      # 0.01 mm: invisible, keeps the file small
            for ring in [p.exterior, *p.interiors]:
                xy = [svg_xy(x, y) for x, y in ring.coords]
                out.append("M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in xy) + " Z")
        return " ".join(out)

    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.2f}mm" height="{H:.2f}mm" viewBox="0 0 {W:.2f} {H:.2f}">',
           f'  <title>Ambassador pin, front, 1:1 mm. Hard enamel, {METAL[1]}, die-cut to the orb mark, {W:.2f} x {H:.2f} mm. Metal lines {LINE} mm.</title>',
           f'  <path id="metal" fill="{METAL[0]}" d="{d(outline)}"/>']
    for name, (hex_, pms) in COLOURS.items():
        svg.append(f'  <path id="enamel-{name}" data-pantone="PMS {pms}" fill="{hex_}" fill-rule="evenodd" d="{d(cells[name])}"/>')
    svg.append("</svg>")
    text = "\n".join(svg) + "\n"
    here = Path(__file__)
    here.with_name("pin-front.svg").write_text(text)
    # The site shows the same art on Home, so the goal looks like the real thing.
    site = here.parents[2] / "public" / "pin.svg"
    if site.parent.exists():
        site.write_text(text)

    # The 3D model: the same shapes in mm, centred on the orb, y up, counter-clockwise.
    def ring_src(p, tol):
        p = orient(Polygon(p.simplify(tol).exterior.coords), 1.0)
        ring = []
        for x, y in p.exterior.coords[:-1]:
            pt = (round(x, 3), round(y, 3))
            if not ring or pt != ring[-1]:
                ring.append(pt)
        return "[" + ", ".join(f"({x}, {y})" for x, y in ring) + "]"

    art = []
    for name in COLOURS:
        rings = []
        for p in polys(cells[name]):
            assert not p.interiors, f"{name}: a cell with a hole needs a curve, not a prism"
            rings.append("        " + ring_src(p, 0.005) + ",")
        art.append(f'    "{name}": [\n' + "\n".join(rings) + "\n    ],")
    (body,) = polys(outline)
    orb = ",\n".join("    " + ring_src(p, 0.002) for p in polys(cells["orb"]))
    block = ("ART = {\n" + "\n".join(art) + "\n}\n"
             "# The die-cut silhouette: the body's outline, same frame.\n"
             "OUTLINE = " + ring_src(body, 0.001) + "\n"
             "# The glow finish: the whole orb as one field (ink, with teal and red glowing into it),\n"
             "# split only by the swoosh's metal line.\n"
             "ORB = [\n" + orb + ",\n]\n")
    blend = here.with_name("blender") / "ambassador_pin.py"
    src = blend.read_text()
    src, n = re.subn(r"^ART = \{.*?(?=# ── END ART)", lambda m: block, src, count=1, flags=re.S | re.M)
    assert n == 1, "ART block not found in blender/ambassador_pin.py"
    blend.write_text(src)

    print(f"pin {W:.2f} x {H:.2f} mm, orb {2 * REF['orb'][2] * s:.2f} mm across, scale {s:.5f} mm/px")
    for name, (_, pms) in COLOURS.items():
        g = cells[name]
        print(f"enamel-{name:7} PMS {pms:10} area {g.area:6.1f} mm2  parts {len(polys(g))}")
    print("wrote", here.with_name("pin-front.svg"))


if __name__ == "__main__":
    main()
