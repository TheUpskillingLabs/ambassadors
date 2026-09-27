# Separate the button art to CMYK (FOGRA39 coated) with a chroma-first gamut map:
# the screen teal is far outside what ink can print; a plain ICC conversion keeps its lightness and prints it pale.
# Here each colour may darken (up to 45 L*) to keep its saturation, choosing the printable colour closest by
# CIE94 with lightness weighted half (kL = 2), so the glows stay vivid in print.
from PIL import Image, ImageCms
import numpy as np, sys
KL = float(sys.argv[1]) if len(sys.argv) > 1 else 3.0
TAG = sys.argv[2] if len(sys.argv) > 2 else ''
SRC = 'ambassador-button-1.25in.png'   # run from design/button
FOGRA = '/usr/share/texlive/texmf-dist/tex/generic/colorprofiles/FOGRA39L_coated.icc'
src = Image.open(SRC).convert('RGB')
dpi = src.info.get('dpi', (600, 600))
A = np.asarray(src)
flat = A.reshape(-1, 3)
uniq, inv = np.unique(flat, axis=0, return_inverse=True)
inv = inv.reshape(-1)
N = len(uniq)
srgb = ImageCms.createProfile('sRGB'); lab = ImageCms.createProfile('LAB', 5000)   # D50, like the print profile
fogra = ImageCms.getOpenProfile(FOGRA)
RI = ImageCms.Intent.RELATIVE_COLORIMETRIC
BPC = ImageCms.Flags.BLACKPOINTCOMPENSATION
t_rgb_lab = ImageCms.buildTransform(srgb, lab, 'RGB', 'LAB', renderingIntent=RI, flags=BPC)
t_lab_cmyk = ImageCms.buildTransform(lab, fogra, 'LAB', 'CMYK', renderingIntent=RI, flags=BPC)
t_cmyk_lab = ImageCms.buildTransform(fogra, lab, 'CMYK', 'LAB', renderingIntent=RI, flags=BPC)
t_cmyk_rgb = ImageCms.buildTransform(fogra, srgb, 'CMYK', 'RGB', renderingIntent=RI)   # proof without BPC: shows the paper's real black

def img(arr, mode):
    return Image.fromarray(arr.reshape(1, -1, arr.shape[-1]).astype(np.uint8), mode)
def lab_float(im):   # PIL LAB (8-bit): L 0..255 -> 0..100, a/b stored as signed bytes
    x = np.asarray(im).reshape(-1, 3).astype(float)
    ab = np.where(x[:, 1:] >= 128, x[:, 1:] - 256, x[:, 1:])
    return np.column_stack([x[:, 0] * 100 / 255, ab])
def lab_bytes(L):
    ab = np.clip(np.round(L[:, 1:]), -128, 127) % 256
    return np.column_stack([np.clip(np.round(L[:, 0] * 255 / 100), 0, 255), ab])

src_lab = lab_float(ImageCms.applyTransform(img(uniq, 'RGB'), t_rgb_lab))
def de94(l1, l2, kL=2.0):
    dL = l1[:, 0] - l2[:, 0]
    C1 = np.hypot(l1[:, 1], l1[:, 2]); C2 = np.hypot(l2[:, 1], l2[:, 2])
    dC = C1 - C2
    da = l1[:, 1] - l2[:, 1]; db = l1[:, 2] - l2[:, 2]
    dH2 = np.maximum(da * da + db * db - dC * dC, 0)
    SC = 1 + 0.045 * C1; SH = 1 + 0.015 * C1
    return np.sqrt((dL / kL) ** 2 + (dC / SC) ** 2 + dH2 / SH ** 2)

best_err = np.full(N, np.inf); best_cmyk = np.zeros((N, 4))
for d in np.arange(0, 45.1, 1.5):
    cand = src_lab.copy(); cand[:, 0] = np.maximum(cand[:, 0] - d, 0)
    cm = np.asarray(ImageCms.applyTransform(img(lab_bytes(cand), 'LAB'), t_lab_cmyk)).reshape(-1, 4).astype(float)
    got = lab_float(ImageCms.applyTransform(img(cm, 'CMYK'), t_cmyk_lab))
    e = de94(src_lab, got, KL) + 0.02 * d          # a whisper of preference for not darkening
    better = e < best_err
    best_err[better] = e[better]; best_cmyk[better] = cm[better]

# paper white stays paper white; cap total ink at 300 %
white = (uniq.min(1) >= 250)
best_cmyk[white] = 0
tac = best_cmyk.sum(1)
over = tac > 300 * 2.55
best_cmyk[over] *= (300 * 2.55 / tac[over])[:, None]
out = best_cmyk[inv].reshape(A.shape[0], A.shape[1], 4).round().astype(np.uint8)
cmyk = Image.fromarray(out, 'CMYK')
# smooth the per-colour choices spatially a touch, so neighbouring gradient steps can't jump
from PIL import ImageFilter
cmyk_s = Image.merge('CMYK', [ch.filter(ImageFilter.GaussianBlur(0.6)) for ch in cmyk.split()])
# ...but not across the white lettering: keep its pixels (and their anti-aliased edges) exactly as mapped, paper white inside
light = (A.min(2) >= 200)[:, :, None]
cmyk_s = Image.fromarray(np.where(light, out, np.asarray(cmyk_s)).astype(np.uint8), 'CMYK')
cmyk_s.save(f'button_cmyk{TAG}.tif', compression='tiff_lzw', dpi=dpi, icc_profile=fogra.tobytes())
proof = ImageCms.applyTransform(cmyk_s, t_cmyk_rgb)
proof.save(f'proof_mapped{TAG}.png')
# the plain ICC conversion, for comparison
plain = ImageCms.applyTransform(src, ImageCms.buildTransform(srgb, fogra, 'RGB', 'CMYK', renderingIntent=RI, flags=BPC))
ImageCms.applyTransform(plain, t_cmyk_rgb).save('proof_plain.png')
c = np.asarray(cmyk_s).astype(float) / 2.55
print('max TAC %', round(c.sum(2).max()), ' mean err', round(best_err.mean(), 2))
