"""The open-mouth Girgit for the tongue flick (Section 05 invitation).

1. Cut him out of the black background: near-black pixels connected to the border are background;
   the edge gets a soft alpha from brightness, un-mixed from black so no dark fringe stays.
2. Fill the Gemini sparkle (bottom-right, on his tail) from the clay around it.
3. Align him to the closed-mouth image (girgit-cta.webp) with a similarity transform found from
   matching features on his body, so swapping the two never makes him jump.
4. Give the bottom the same soft cut as the closed image, and save girgit-cta-open.webp.

usage: python girgit_open.py <open.webp> <girgit-cta.webp> <out.webp> <preview.png>
"""
import sys
import numpy as np, cv2
from PIL import Image

src, closed_path, out, prev = sys.argv[1:5]
im = np.array(Image.open(src).convert('RGB')).astype(np.float32)
H, W = im.shape[:2]
hi = im.max(2)

# 1. Background: near-black, connected to the border.
dark = (hi < 34).astype(np.uint8)
n, lab = cv2.connectedComponents(dark)
border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
bg = np.isin(lab, list(border))
fg = (~bg).astype(np.uint8) * 255
nn, lab2, st, _ = cv2.connectedComponentsWithStats(fg)
fg = (lab2 == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8) * 255
# Soft edge: within a few px of the background, alpha follows brightness (the render's rim light).
near = cv2.dilate((fg == 0).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & (fg > 0)
alpha = (fg / 255).astype(np.float32)
alpha[near] = np.clip((hi[near] - 26) / 60, 0, 1)
alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7)
rgb = np.clip(im / np.maximum(alpha, 0.08)[..., None], 0, 255)          # un-mix from black
rgb = np.where(alpha[..., None] > 0.97, im, rgb)

# 2. The sparkle: light, unsaturated pixels in the bottom-right corner, on his tail.
lo = im.min(2)
sp = ((hi - lo) < 50) & (hi > 150)
sp[: int(H * 0.82), :] = False; sp[:, : int(W * 0.9)] = False
spm = cv2.dilate(sp.astype(np.uint8) * 255, np.ones((11, 11), np.uint8))
rgb = cv2.inpaint(rgb.astype(np.uint8), spm, 13, cv2.INPAINT_TELEA).astype(np.float32)
print('sparkle pixels filled', int((spm > 0).sum()))

# 3. Align to the closed-mouth image.
closed = np.array(Image.open(closed_path).convert('RGBA'))
CH, CW = closed.shape[:2]
g1 = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY)
g2 = cv2.cvtColor(closed[..., :3], cv2.COLOR_RGB2GRAY)
m1 = ((alpha > 0.9) * 255).astype(np.uint8); m2 = ((closed[..., 3] > 230) * 255).astype(np.uint8)
m1[int(H * 0.5):, : int(W * 0.35)] = 0                                   # skip the mouth and jaw: they differ
orb = cv2.ORB_create(6000)
k1, d1 = orb.detectAndCompute(g1, m1); k2, d2 = orb.detectAndCompute(g2, m2)
matches = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2), key=lambda x: x.distance)[:800]
a = np.float32([k1[m.queryIdx].pt for m in matches]); b = np.float32([k2[m.trainIdx].pt for m in matches])
M, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=3)
s = np.hypot(M[0, 0], M[1, 0])
print('align: scale %.4f  rotation %.2f deg  shift (%.1f, %.1f)  inliers %d of %d' % (s, np.degrees(np.arctan2(M[1, 0], M[0, 0])), M[0, 2], M[1, 2], int(inl.sum()), len(matches)))
rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
warped = cv2.warpAffine(rgba, M, (CW, CH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

# 4. The same soft bottom cut as the closed image (its foliage cut sits at the canvas bottom).
yy = np.arange(CH, dtype=np.float32)[:, None]
keep = np.clip((CH - 2 - yy) / 14, 0, 1)
warped[..., 3] = (warped[..., 3].astype(np.float32) * keep).astype(np.uint8)
Image.fromarray(warped, 'RGBA').save(out, quality=88, method=6)

# Where his open mouth is, in the closed image's coordinates (the front of the gape).
mouth_src = np.float32([[[W * 0.045, H * 0.56]]])
mouth = cv2.transform(mouth_src, M)[0, 0]
print('open mouth front at (%.0f, %.0f) of %d x %d' % (mouth[0], mouth[1], CW, CH))

# Preview: the two overlaid (closed in magenta, open in green) to check alignment.
c = closed[..., 3] > 128; o = warped[..., 3] > 128
viz = np.zeros((CH, CW, 3), np.uint8); viz[c] = (255, 0, 255); viz[o] = (60, 220, 60); viz[c & o] = (240, 240, 240)
bgv = np.full((CH, CW, 4), (20, 33, 24, 255), np.uint8); im2 = Image.fromarray(bgv, 'RGBA'); im2.alpha_composite(Image.fromarray(warped, 'RGBA'))
row = np.hstack([viz, np.array(im2.convert('RGB'))])
Image.fromarray(row).resize((row.shape[1] // 2, row.shape[0] // 2)).save(prev)
