# Minimal LittleCMS 2 binding with double-precision transforms (PIL's ImageCms is 8-bit only).
import ctypes, ctypes.util, numpy as np
_l = ctypes.CDLL(ctypes.util.find_library('lcms2') or 'liblcms2.so.2')
vp, u32 = ctypes.c_void_p, ctypes.c_uint32
_l.cmsOpenProfileFromFile.restype = vp; _l.cmsOpenProfileFromFile.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
_l.cmsCreate_sRGBProfile.restype = vp
_l.cmsCreateLab4Profile.restype = vp; _l.cmsCreateLab4Profile.argtypes = [vp]
_l.cmsCreateTransform.restype = vp; _l.cmsCreateTransform.argtypes = [vp, u32, vp, u32, u32, u32]
_l.cmsDoTransform.argtypes = [vp, vp, vp, u32]
RGB_DBL = (1 << 22) | (4 << 16) | (3 << 3)      # 0..1
CMYK_DBL = (1 << 22) | (6 << 16) | (4 << 3)     # 0..100 (%)
LAB_DBL = (1 << 22) | (10 << 16) | (3 << 3)
REL, BPC = 1, 0x2000
def profile(path): return _l.cmsOpenProfileFromFile(path.encode(), b'r')
SRGB = _l.cmsCreate_sRGBProfile(); LAB = _l.cmsCreateLab4Profile(None)
class Xf:
    def __init__(self, a, fa, b, fb, nout, flags=BPC): self.x = _l.cmsCreateTransform(a, fa, b, fb, REL, flags); self.n = nout
    def __call__(self, arr):
        arr = np.ascontiguousarray(arr, dtype=np.float64); out = np.empty((len(arr), self.n))
        for i in range(0, len(arr), 1 << 20):
            _l.cmsDoTransform(self.x, arr[i:i + (1 << 20)].ctypes.data, out[i:i + (1 << 20)].ctypes.data, min(1 << 20, len(arr) - i))
        return out
