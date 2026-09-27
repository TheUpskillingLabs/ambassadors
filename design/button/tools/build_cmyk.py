# Separate the button art to CMYK (FOGRA39 coated) as the closest colour match to the RGB original.
# For every colour in the art it searches printable colours of the same hue (lighter or darker, more or less
# saturated) and keeps the one with the smallest CIEDE2000 difference from the screen colour. Colours are compared
# after black-point compensation, so the art's near-black is matched by the paper's deepest black.
# usage (from design/button): python3 tools/build_cmyk.py <rgb art.png> <output name stem>
from PIL import Image, ImageCms, ImageFilter
import numpy as np, sys, time
SRC = sys.argv[1] if len(sys.argv) > 1 else 'ambassador-button-1.5in.png'
STEM = sys.argv[2] if len(sys.argv) > 2 else SRC.rsplit('.', 1)[0]
FOGRA = '/usr/share/texlive/texmf-dist/tex/generic/colorprofiles/FOGRA39L_coated.icc'
src = Image.open(SRC).convert('RGB'); dpi = src.info.get('dpi', (600, 600))
A = np.asarray(src); flat = A.reshape(-1, 3)
uniq, inv = np.unique(flat, axis=0, return_inverse=True); inv = inv.reshape(-1); N = len(uniq)
srgb = ImageCms.createProfile('sRGB'); lab = ImageCms.createProfile('LAB', 5000)
fogra = ImageCms.getOpenProfile(FOGRA)
RI = ImageCms.Intent.RELATIVE_COLORIMETRIC; BPC = ImageCms.Flags.BLACKPOINTCOMPENSATION
t_rgb_lab = ImageCms.buildTransform(srgb, lab, 'RGB', 'LAB', renderingIntent=RI, flags=BPC)
t_lab_cmyk = ImageCms.buildTransform(lab, fogra, 'LAB', 'CMYK', renderingIntent=RI, flags=BPC)
t_cmyk_lab = ImageCms.buildTransform(fogra, lab, 'CMYK', 'LAB', renderingIntent=RI, flags=BPC)
t_cmyk_rgb = ImageCms.buildTransform(fogra, srgb, 'CMYK', 'RGB', renderingIntent=RI)
def img(arr, mode): return Image.fromarray(arr.reshape(1, -1, arr.shape[-1]).astype(np.uint8), mode)
def lab_float(im):
    x = np.asarray(im).reshape(-1, 3).astype(float); ab = np.where(x[:, 1:] >= 128, x[:, 1:] - 256, x[:, 1:])
    return np.column_stack([x[:, 0] * 100 / 255, ab])
def lab_bytes(L):
    return np.column_stack([np.clip(np.round(L[:, 0] * 255 / 100), 0, 255), np.clip(np.round(L[:, 1:]), -128, 127) % 256])
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
    Lbp = (L1 + L2) / 2; Cbp = (C1p + C2p) / 2
    hs = h1p + h2p
    hbp = np.where(C1p * C2p == 0, hs, np.where(np.abs(h1p - h2p) <= 180, hs / 2, np.where(hs < 360, (hs + 360) / 2, (hs - 360) / 2)))
    T = 1 - 0.17 * np.cos(np.radians(hbp - 30)) + 0.24 * np.cos(np.radians(2 * hbp)) + 0.32 * np.cos(np.radians(3 * hbp + 6)) - 0.20 * np.cos(np.radians(4 * hbp - 63))
    dtheta = 30 * np.exp(-((hbp - 275) / 25) ** 2)
    RC = 2 * np.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    SL = 1 + 0.015 * (Lbp - 50) ** 2 / np.sqrt(20 + (Lbp - 50) ** 2); SC = 1 + 0.045 * Cbp; SH = 1 + 0.015 * Cbp * T
    RT = -np.sin(np.radians(2 * dtheta)) * RC
    return np.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH))

src_lab = lab_float(ImageCms.applyTransform(img(uniq, 'RGB'), t_rgb_lab))
def evaluate(cand):
    cm = np.asarray(ImageCms.applyTransform(img(lab_bytes(cand), 'LAB'), t_lab_cmyk)).reshape(-1, 4).astype(float)
    got = lab_float(ImageCms.applyTransform(img(cm, 'CMYK'), t_cmyk_lab))
    return cm, got, de2000(src_lab, got)
t0 = time.time()
best = np.full(N, np.inf); bcm = np.zeros((N, 4)); bdl = np.zeros(N); bs = np.ones(N)
for dl in np.arange(-40, 12.1, 2.0):
    for s in np.arange(0.5, 1.201, 0.05):
        cand = src_lab.copy(); cand[:, 0] = np.clip(cand[:, 0] + dl, 0, 100); cand[:, 1:] *= s
        cm, got, e = evaluate(cand)
        m = e < best; best[m] = e[m]; bcm[m] = cm[m]; bdl[m] = dl; bs[m] = s
# refine around each colour's best
for ddl in np.arange(-1.5, 1.51, 0.5):
    for ds in np.arange(-0.04, 0.041, 0.02):
        cand = src_lab.copy(); cand[:, 0] = np.clip(cand[:, 0] + bdl + ddl, 0, 100); cand[:, 1:] *= (bs + ds)[:, None]
        cm, got, e = evaluate(cand)
        m = e < best; best[m] = e[m]; bcm[m] = cm[m]
print('search', round(time.time() - t0, 1), 's')
white = uniq.min(1) >= 250
bcm[white] = 0
tac = bcm.sum(1); over = tac > 300 * 2.55; bcm[over] *= (300 * 2.55 / tac[over])[:, None]
out = bcm[inv].reshape(A.shape[0], A.shape[1], 4).round().astype(np.uint8)
cmyk = Image.fromarray(out, 'CMYK')
cmyk_s = cmyk
cmyk_s.save(f'{STEM}-CMYK.tif', compression='tiff_lzw', dpi=dpi, icc_profile=fogra.tobytes())
ImageCms.applyTransform(cmyk_s, t_cmyk_rgb).save(f'{STEM}-print-preview.png', dpi=dpi)
print('per-colour dE2000: mean', round(best.mean(), 2))

# the PDF to upload: the CMYK image on a page the size of the art, at full resolution, lossless
import img2pdf
side = img2pdf.in_to_pt(cmyk_s.size[0] / dpi[0])
with open(f'{STEM}-CMYK.pdf', 'wb') as fh:
    fh.write(img2pdf.convert(open(f'{STEM}-CMYK.tif', 'rb').read(), layout_fun=img2pdf.get_layout_fun((side, side))))
print('wrote', f'{STEM}-CMYK.tif', f'{STEM}-CMYK.pdf', f'{STEM}-print-preview.png')
