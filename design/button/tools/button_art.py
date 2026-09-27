"""Sticker Mule round-button artwork from the orb mark (brandkit/assets/orb-mark.png)."""
import numpy as np, sys
from PIL import Image, ImageDraw, ImageFilter
SRC = "/home/claude/theupskillinglabs/brandkit/assets/orb-mark.png"
DPI = 600
# Sticker Mule template geometry (measured from their 1.25" template at 300 dpi):
# cut line 1.623" across, button face edge 1.25" across.
# template sizes live in button_art_text.py

def make(centre, fill, face_in, cut_in, canvas_in=1.75, seed=7):
    """centre: point in ref px to put at the button centre; fill: how much of the
    face diameter the enclosing radius R_fill (ref px) should occupy."""
    ref = Image.open(SRC).convert("RGB")
    R_px_ref, share = fill
    face_px = face_in * DPI
    s = (share * face_px / 2) / R_px_ref                 # output px per ref px
    N = int(round(canvas_in * DPI))
    # background: ink with the reference's grain (mean/std measured from its corners)
    rng = np.random.default_rng(seed)
    bg = np.stack([np.full((N, N), 0.0), rng.normal(18.78, 0.99, (N, N)), rng.normal(26.34, 1.0, (N, N))], 2)
    canvas = Image.fromarray(bg.clip(0, 255).astype(np.uint8))
    W = int(round(1024 * s))
    scaled = ref.resize((W, W), Image.LANCZOS)
    ox = int(round(N / 2 - centre[0] * s)); oy = int(round(N / 2 - centre[1] * s))
    # feathered paste so the edge of the source image doesn't show
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).rectangle([6, 6, W - 7, W - 7], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(4))
    canvas.paste(scaled, (ox, oy), mask)
    return canvas, s

def guides(img, face_in, cut_in):
    g = img.copy().convert("RGB"); d = ImageDraw.Draw(g); N = g.size[0]
    for dia, col in ((face_in, (255, 255, 255)), (cut_in, (80, 120, 255))):
        r = dia * DPI / 2
        d.ellipse([N / 2 - r, N / 2 - r, N / 2 + r, N / 2 + r], outline=col, width=3)
    return g
