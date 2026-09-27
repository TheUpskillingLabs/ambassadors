# Separate the button art to CMYK as the closest colour match to the RGB original.
#
# For every colour in the art:
#   1. Start from the profile's own separation of the nearest printable colour of the same hue (lighter or darker,
#      more or less saturated), which gives smooth, conventional ink builds.
#   2. Refine directly in CMYK: step cyan, magenta and yellow up or down in any combination, down to one 8-bit level,
#      keeping any move that lowers the CIEDE2000 difference from the screen colour, under a 300% total-ink limit. Black
#      stays where the profile's separation put it, so the result stays a smooth function of the colour and the art's
#      grain doesn't turn into ink noise. This reaches colours the profile's separation tables miss, mostly the darks.
# Colours are compared after black-point compensation, so the art's near-black is matched relative to the paper's deepest
# black, and paper white stands in for the screen's white. Colour maths runs in double precision through LittleCMS.
#
# usage (from design/button): python3 tools/build_cmyk.py <rgb art.png> <output name stem> [cmyk profile.icc]
# The default profile is GRACoL 2013 (CRPC6), the US coated-press reference:
#   https://www.color.org/registry/profiles/GRACoL2013_CRPC6.icc
import sys, os, time
import numpy as np
from PIL import Image, ImageCms
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lcms import profile, Xf, SRGB, LAB, RGB_DBL, CMYK_DBL, LAB_DBL
SRC = sys.argv[1] if len(sys.argv) > 1 else 'ambassador-button-1.5in.png'
STEM = sys.argv[2] if len(sys.argv) > 2 else SRC.rsplit('.', 1)[0]
PROFILE = sys.argv[3] if len(sys.argv) > 3 else '/home/claude/work/icc/GRACoL2013_CRPC6.icc'   # set to your copy
TAC = 300 * 2.55                      # total ink limit, in 8-bit units
src = Image.open(SRC).convert('RGB'); dpi = src.info.get('dpi', (600, 600))
A = np.asarray(src); uniq, inv = np.unique(A.reshape(-1, 3), axis=0, return_inverse=True); inv = inv.reshape(-1); N = len(uniq)
prof = profile(PROFILE)
rgb_lab = Xf(SRGB, RGB_DBL, LAB, LAB_DBL, 3)
lab_cmyk = Xf(LAB, LAB_DBL, prof, CMYK_DBL, 4)
cmyk_lab = Xf(prof, CMYK_DBL, LAB, LAB_DBL, 3)
def printed(cm8): return cmyk_lab(cm8 / 2.55)          # 8-bit CMYK -> Lab as printed (relative to the paper)

def de2000(l1, l2):
    L1, a1, b1 = l1.T; L2, a2, b2 = l2.T
    C1 = np.hypot(a1, b1); C2 = np.hypot(a2, b2); Cb = (C1 + C2) / 2
    G = 0.5 * (1 - np.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p = (1 + G) * a1; a2p = (1 + G) * a2
    C1p = np.hypot(a1p, b1); C2p = np.hypot(a2p, b2)
    h1p = np.degrees(np.arctan2(b1, a1p)) % 360; h2p = np.degrees(np.arctan2(b2, a2p)) % 360
    dLp = L2 - L1; dCp = C2p - C1p
    dh = h2p - h1p; dh = np.where(dh > 180, dh - 360, np.where(dh < -180, dh + 360, dh)); dh = np.where(C1p * C2p == 0, 0, dh)
    dHp = 2 * np.sqrt(C1p * C2p) * np.sin(np.radians(dh / 2))
    Lbp = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2; hs = h1p + h2p
    hbp = np.where(C1p * C2p == 0, hs, np.where(np.abs(h1p - h2p) <= 180, hs / 2, np.where(hs < 360, (hs + 360) / 2, (hs - 360) / 2)))
    T = 1 - 0.17 * np.cos(np.radians(hbp - 30)) + 0.24 * np.cos(np.radians(2 * hbp)) + 0.32 * np.cos(np.radians(3 * hbp + 6)) - 0.20 * np.cos(np.radians(4 * hbp - 63))
    dtheta = 30 * np.exp(-((hbp - 275) / 25) ** 2)
    RC = 2 * np.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    SL = 1 + 0.015 * (Lbp - 50) ** 2 / np.sqrt(20 + (Lbp - 50) ** 2); SC = 1 + 0.045 * Cbp; SH = 1 + 0.015 * Cbp * T
    RT = -np.sin(np.radians(2 * dtheta)) * RC
    return np.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH))

def limit(cm):                         # scale down builds over the total-ink limit
    t = cm.sum(1); over = t > TAC; cm = cm.copy(); cm[over] *= (TAC / t[over])[:, None]; return cm

t0 = time.time()
target = rgb_lab(uniq / 255.0)
# 1. the profile's separation of the nearest same-hue printable colour
best = np.full(N, np.inf); bcm = np.zeros((N, 4))
for dl in np.arange(-40, 12.1, 2.0):
    for s in np.arange(0.5, 1.201, 0.05):
        cand = target.copy(); cand[:, 0] = np.clip(cand[:, 0] + dl, 0, 100); cand[:, 1:] *= s
        cm = np.round(limit(lab_cmyk(cand) * 2.55)); e = de2000(target, printed(cm))
        m = e < best; best[m] = e[m]; bcm[m] = cm[m]
print('start', round(best.mean(), 3), round(time.time() - t0, 1), 's')
# 2. refine directly in CMYK. Black stays where the profile put it, so the separation stays a smooth function of the
#    colour (the art's grain doesn't turn into ink noise); cyan, magenta and yellow move in any combination.
dirs = np.array([d for d in np.array(np.meshgrid(*[[-1, 0, 1]] * 3, indexing='ij')).reshape(3, -1).T if d.any()], float)
dirs = np.column_stack([dirs, np.zeros(len(dirs))])
for step in (16, 8, 4, 2, 1):
    active = np.arange(N)
    while len(active):
        cand = np.clip(bcm[active][None] + step * dirs[:, None], 0, 255).reshape(-1, 4)
        e = de2000(np.tile(target[active], (len(dirs), 1)), printed(cand)).reshape(len(dirs), -1)
        e[(cand.sum(1) > TAC).reshape(len(dirs), -1)] = np.inf
        k = e.argmin(0); eb = e[k, np.arange(len(active))]
        imp = eb < best[active] - 1e-3
        idx = active[imp]; sel = k[imp], np.nonzero(imp)[0]
        bcm[idx] = cand.reshape(len(dirs), -1, 4)[sel]; best[idx] = eb[imp]
        active = idx
print('refined', round(best.mean(), 3), 'max', round(best.max(), 2), round(time.time() - t0, 1), 's')
white = uniq.min(1) >= 250; bcm[white] = 0
out = bcm[inv].reshape(A.shape[0], A.shape[1], 4).astype(np.uint8)
cmyk = Image.fromarray(out, 'CMYK')
icc = open(PROFILE, 'rb').read()
cmyk.save(f'{STEM}-CMYK.tif', compression='tiff_lzw', dpi=dpi, icc_profile=icc)
# print preview: how the file should print, including the paper's black (no black-point compensation)
pil_prof = ImageCms.getOpenProfile(PROFILE)
t_prev = ImageCms.buildTransform(pil_prof, ImageCms.createProfile('sRGB'), 'CMYK', 'RGB', renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC)
ImageCms.applyTransform(cmyk, t_prev).save(f'{STEM}-print-preview.png', dpi=dpi)
e_px = best[inv]
print('per-pixel dE2000: mean', round(e_px.mean(), 2), 'p99', round(np.percentile(e_px, 99), 2), 'max', round(e_px.max(), 2))

# the PDF to upload: the CMYK image on a page the size of the art, at full resolution, lossless, with the profile embedded
import img2pdf
side = img2pdf.in_to_pt(cmyk.size[0] / dpi[0])
with open(f'{STEM}-CMYK.pdf', 'wb') as fh:
    fh.write(img2pdf.convert(open(f'{STEM}-CMYK.tif', 'rb').read(), layout_fun=img2pdf.get_layout_fun((side, side))))
print('wrote', f'{STEM}-CMYK.tif', f'{STEM}-CMYK.pdf', f'{STEM}-print-preview.png')
