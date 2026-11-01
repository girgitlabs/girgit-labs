"""Section 03 assets from the supplied clay renders.

- jungle plate: the Gemini sparkle (bottom-right) is filled from the surrounding leaf.
- leaves on magenta: keyed (alpha from how magenta a pixel is), magenta spill removed from the
  edges, split into one WebP per leaf.
- Girgit on magenta: keyed the same way; the clay foliage he stands in is cut away below a
  line under his body (the scene's own leaves cover that line).

usage: python hide_assets.py <in_dir> <out_dir> <preview_dir>
"""
import sys, os, json
import numpy as np, cv2
from PIL import Image

src, out, prev = sys.argv[1:4]
os.makedirs(out, exist_ok=True); os.makedirs(prev, exist_ok=True)
load = lambda n: np.array(Image.open(os.path.join(src, n)).convert('RGB')).astype(np.float32)
MAG = np.array([255, 0, 255], np.float32)

def key(img):
    """Alpha from magenta-ness, then un-mix the magenta out of the edge pixels."""
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    m = np.minimum(r, b) - g                               # magenta ~ +255, leaves and Girgit < 0
    a = np.clip((70 - m) / 90, 0, 1)
    safe = np.maximum(a, 0.05)[..., None]
    rgb = np.clip((img - (1 - a[..., None]) * MAG) / safe, 0, 255)
    # any pink left in the edge: pull red and blue down to the green level
    edge = (a < 0.98)[..., None]
    rgb = np.where(edge, np.stack([np.minimum(rgb[..., 0], rgb[..., 1] * 1.05), rgb[..., 1], np.minimum(rgb[..., 2], rgb[..., 1] * 1.05)], -1), rgb)
    return rgb, a

def sparkle_mask(img, x0, y0):
    """The Gemini sparkle: light, unsaturated pixels in the bottom-right corner."""
    hi, lo = img.max(2), img.min(2)
    m = ((hi - lo) < 45) & (hi > 140)
    m[:y0, :] = False; m[:, :x0] = False
    return cv2.dilate(m.astype(np.uint8) * 255, np.ones((9, 9), np.uint8))

# 1. Jungle plate: fill the sparkle from the leaf around it.
plate = load('jungle-plate.webp')
H, W = plate.shape[:2]
sm = sparkle_mask(plate, int(W * 0.9), int(H * 0.86))
fixed = cv2.inpaint(plate.astype(np.uint8), sm, 11, cv2.INPAINT_TELEA)
Image.fromarray(fixed).save(os.path.join(out, 'jungle.webp'), quality=84, method=6)
Image.fromarray(np.hstack([plate.astype(np.uint8)[int(H*0.8):, int(W*0.8):], fixed[int(H*0.8):, int(W*0.8):]])).save(os.path.join(prev, 'plate-corner.png'))
print('plate: sparkle pixels filled', int((sm > 0).sum()))

# 2. Leaves: key, then one file per leaf.
leaves = load('leaves-magenta.webp')
rgb, a = key(leaves)
solid = (a > 0.5).astype(np.uint8)
n, lab, st, cen = cv2.connectedComponentsWithStats(solid)
info = []
for i in range(1, n):
    x, y, w, h, area = st[i]
    if area < 4000: continue                              # specks (and the keyed-out sparkle)
    pad = 6
    x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(W, x + w + pad), min(H, y + h + pad)
    own = cv2.dilate((lab == i).astype(np.uint8), np.ones((5, 5), np.uint8))[y0:y1, x0:x1]
    alpha = (a[y0:y1, x0:x1] * own * 255).astype(np.uint8)
    tile = np.dstack([rgb[y0:y1, x0:x1].astype(np.uint8), alpha])
    k = len(info) + 1
    Image.fromarray(tile, 'RGBA').save(os.path.join(out, f'leaf-{k:02d}.webp'), quality=88, method=6)
    info.append({'file': f'leaf-{k:02d}.webp', 'w': int(x1 - x0), 'h': int(y1 - y0), 'cx': round(float(cen[i][0]), 1), 'cy': round(float(cen[i][1]), 1)})
json.dump(info, open(os.path.join(out, 'leaves.json'), 'w'), indent=1)
print('leaves:', len(info))

# 3. Girgit: key; preview the mask so the cut under him can be chosen.
gir = load('girgit-magenta.webp')
grgb, ga = key(gir)
Image.fromarray((ga * 255).astype(np.uint8)).save(os.path.join(prev, 'girgit-alpha.png'))
np.save(os.path.join(prev, 'girgit-rgb.npy'), grgb.astype(np.uint8)); np.save(os.path.join(prev, 'girgit-a.npy'), ga)
