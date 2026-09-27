"""Round button with the orb mark ringed by THE UPSKILLING LABS (top) and AMBASSADOR (bottom).
Sizes follow Sticker Mule's templates; every measurement scales with the button face."""
import math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, __import__("os").path.dirname(__file__))
from button_art import make, guides, DPI   # tools/button_art.py

FONT = "/home/claude/theupskillinglabs/brandkit/downloads/Geologica-VariableFont.ttf"
MID = (511.19, 485.02)                      # the orb's centre, reference px: the orb is centred, the swoosh doesn't count
RMID = 484.902                              # farthest point of the mark (the swoosh tip) from the orb centre
# Sticker Mule templates: face diameter and cut-line diameter, inches (1.25" measured at 300 dpi, 1.5" at 600 dpi)
SIZES = {"1.25": dict(face=1.25, cut=1.623, canvas=1.75), "1.5": dict(face=1.5, cut=1.83, canvas=2.0)}
# the layout, designed on the 1.25" face (radius 15.875 mm) and scaled to other sizes
BASE_FACE_R = 15.875
MARK_R0 = 11.2                              # mm: the mark sits inside this
BAND0 = (12.25, 14.05)                      # mm: the text ring, inside the flat of the face
DOT_R0 = 0.32
TRACK = 0.16                                # letter-spacing, em
WHITE, TEAL = (242, 244, 244, 255), (0, 190, 200, 255)
SS = 4                                      # supersample the text layer

def font(size_px, weight):
    f = ImageFont.truetype(FONT, size_px)
    f.set_variation_by_axes([weight, 0, 0, 0])
    return f

def cap_height(f):
    b = f.getbbox("H", anchor="ls")
    return -b[1]

def arc_text(layer, text, f, colour, r_base, centre_deg, outward, px_mm):
    """Set text on an arc. outward=True: tops point out (top of the button, reading left to right
    clockwise); False: tops point in (bottom, reading left to right counter-clockwise)."""
    N = layer.size[0]; c = N / 2
    em = f.size
    adv = [f.getlength(ch) + TRACK * em for ch in text]
    total = sum(adv) - TRACK * em
    r = r_base * px_mm
    span = total / r                          # radians
    d = ImageDraw.Draw(layer)
    pos = 0.0
    for ch, a in zip(text, adv):
        mid_s = pos + (a - TRACK * em) / 2    # glyph centre along the arc
        if outward:
            th = math.radians(centre_deg) + span / 2 - mid_s / r
            rot = math.degrees(th) - 90
        else:
            th = math.radians(centre_deg) - span / 2 + mid_s / r
            rot = math.degrees(th) + 90
        pos += a
        if ch == " ":
            continue
        g = Image.new("RGBA", (em * 3, em * 3), (0, 0, 0, 0))
        ImageDraw.Draw(g).text((em * 1.5, em * 1.5), ch, font=f, fill=colour, anchor="ms")
        g = g.rotate(rot, resample=Image.BICUBIC, center=(em * 1.5, em * 1.5))
        x = c + r * math.cos(th); y = c - r * math.sin(th)
        layer.alpha_composite(g, (int(round(x - em * 1.5)), int(round(y - em * 1.5))))
    return math.degrees(span)

def dot(layer, deg, r_mm, rad_mm, colour, px_mm):
    N = layer.size[0]; c = N / 2
    x = c + r_mm * px_mm * math.cos(math.radians(deg)); y = c - r_mm * px_mm * math.sin(math.radians(deg))
    rr = rad_mm * px_mm
    ImageDraw.Draw(layer).ellipse([x - rr, y - rr, x + rr, y + rr], fill=colour)

def build(size="1.25"):
    z = SIZES[size]
    k = z["face"] / 1.25
    FACE_R = BASE_FACE_R * k
    MARK_R = MARK_R0 * k
    BAND = (BAND0[0] * k, BAND0[1] * k)
    art, s = make(MID, (RMID, MARK_R / FACE_R), z["face"], z["cut"], canvas_in=z["canvas"])
    N = art.size[0]
    px_mm = DPI / 25.4 * SS
    layer = Image.new("RGBA", (N * SS, N * SS), (0, 0, 0, 0))
    cap = (BAND[1] - BAND[0]) * px_mm
    # size the font so its cap height fills the band
    size = 40
    while cap_height(font(size, 600)) < cap:
        size += 1
    f_name, f_role = font(size, 600), font(size, 700)
    top = arc_text(layer, "THE UPSKILLING LABS", f_name, WHITE, BAND[0], 90, True, px_mm)
    bot = arc_text(layer, "AMBASSADOR", f_role, WHITE, BAND[1], -90, False, px_mm)
    mid_r = (BAND[0] + BAND[1]) / 2
    for deg in (180 - (180 - top) / 4 - top / 2 + 0, ):
        pass
    # separators halfway between the ends of the two arcs, each side
    gap_l = ((90 + top / 2) + (270 - bot / 2)) / 2
    gap_r = ((90 - top / 2) + (-90 + bot / 2)) / 2
    for deg in (gap_l, gap_r):
        dot(layer, deg, mid_r, DOT_R0 * k, WHITE, px_mm)
    layer = layer.resize((N, N), Image.LANCZOS)
    out = art.convert("RGBA"); out.alpha_composite(layer)
    info = {"font_px@600": size / SS, "font_pt": round(size / SS / DPI * 72, 2), "cap_mm": round(cap / px_mm, 2),
            "top_span_deg": round(top, 1), "bottom_span_deg": round(bot, 1), "separators_deg": (round(gap_l, 1), round(gap_r, 1))}
    return out.convert("RGB"), info

if __name__ == "__main__":
    size = sys.argv[1] if len(sys.argv) > 1 else "1.25"
    out = sys.argv[2] if len(sys.argv) > 2 else "/home/claude/work/out2"
    z = SIZES[size]
    img, info = build(size)
    img.save(f"{out}/ambassador-button-{size}in.png", dpi=(DPI, DPI))
    guides(img, z["face"], z["cut"]).save(f"{out}/ambassador-button-{size}in-guides.png", dpi=(DPI, DPI))
    print(info, img.size)
