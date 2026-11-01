"""Cut Girgit (the supplied three-quarter render) out of its warm beige studio background for
Section 03, and find his pupils for the live eyes.

The general cutout.py removes light *neutral* backgrounds; these renders sit on warm beige,
so here the background is every pixel that is not green (g - b small) and connected to the
image border. Girgit is strongly green, so the split is clean; his floor shadow is dropped
(the jungle has its own light). Writes website/assets/img/hide/girgit-hide.webp + .json.

usage: python cutout_hide.py <three-quarter-view-girgit.jpg>
"""
import sys, json, pathlib
import numpy as np, cv2
from PIL import Image

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent / 'website' / 'assets' / 'img' / 'hide'
OUT.mkdir(parents=True, exist_ok=True)

src = np.array(Image.open(sys.argv[1]).convert('RGB'))
h, w = src.shape[:2]
r, g, b = [src[..., i].astype(np.int16) for i in range(3)]
notgreen = ((g - b) < 40).astype(np.uint8)

# Background: not-green pixels connected to the border.
n, lab = cv2.connectedComponents(notgreen)
border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
bg = np.isin(lab, list(border))
# Backdrop trapped between his legs: big, bright, not-green pieces that don't touch the border.
n2, lab2, st2, _ = cv2.connectedComponentsWithStats(notgreen)
lum = src.mean(axis=2)
for i in range(1, n2):
    if st2[i, cv2.CC_STAT_AREA] > 1500 and lum[lab2 == i].mean() > 165:
        bg |= lab2 == i
fg = (~bg).astype(np.uint8)
# Keep the largest piece (Girgit), close small gaps, then a soft 1px edge pulled slightly in,
# so no beige fringe survives.
n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
fg = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8) * 255
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
fg = cv2.erode(fg, np.ones((3, 3), np.uint8))
alpha = cv2.GaussianBlur(fg, (0, 0), 1.0)

x, y, bw, bh = cv2.boundingRect(fg)
pad = 8
x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(w, x + bw + pad), min(h, y + bh + pad)
rgba = np.dstack([src, alpha])[y0:y1, x0:x1]
im = Image.fromarray(rgba, 'RGBA')
scale = 1100 / im.size[0]
im = im.resize((1100, round(im.size[1] * scale)), Image.LANCZOS)
im.save(OUT / 'girgit-hide.webp', quality=88, method=6)

# Pupils: dark blobs inside the body (brown-black, with a highlight), largest two.
crop = src[y0:y1, x0:x1].astype(np.int16)
dark = ((crop.max(axis=2) < 75) & (rgba[..., 3] > 200)).astype(np.uint8)
dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, lab, st, cen = cv2.connectedComponentsWithStats(dark)
blobs = sorted([(st[i, cv2.CC_STAT_AREA], cen[i]) for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 40], key=lambda t: -t[0])[:4]
W, H = im.size
info = {'width': W, 'height': H, 'pupils': [{'cx': round(c[0] * scale / W * 100, 2), 'cy': round(c[1] * scale / H * 100, 2), 'r': round(np.sqrt(a / np.pi) * scale / W * 100, 2)} for a, c in blobs]}
json.dump(info, open(OUT / 'girgit-hide.json', 'w'), indent=1)
print(json.dumps(info))
