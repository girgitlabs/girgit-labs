"""Find Girgit's eyes in the hero render and export a mask for live vector pupils.

The render (website/assets/img/cham-hero.webp) is a still image. To give the
observer real, independent eye movement without faking a 3D model, we:
  1. find the cream eye-white regions (two largest light, low-saturation blobs),
  2. fill each blob's holes (the baked-in pupil and highlight),
  3. save that as an alpha mask the same size as the render,
  4. write each eye's centre and radius (as % of the image) to eyes.json.
The page then paints a cream eyeball + moving pupil, clipped to this mask.

Run from this folder:  python eyes.py
"""
import json
import pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = pathlib.Path(__file__).parent
IMG = HERE.parent / 'website' / 'assets' / 'img'
src = Image.open(IMG / 'cham-hero.webp').convert('RGBA')
rgb = np.asarray(src.convert('RGB')).astype(np.int16)
alpha = np.asarray(src.getchannel('A'))
w, h = src.size

lo, hi = rgb.min(axis=2), rgb.max(axis=2)
cream = (lo > 105) & ((hi - lo) < 70) & (alpha > 200)   # includes the eye's shaded beige edge

def find_blobs(cond):
    """Connected light blobs (flood-fill labelling), largest first."""
    lab = Image.fromarray(np.where(cond, 255, 0).astype(np.uint8), 'L').copy()
    px = lab.load()
    ys, xs = np.where(cond)
    colour = 1
    for y, x in zip(ys[::5], xs[::5]):
        if px[int(x), int(y)] == 255 and colour < 250:
            ImageDraw.floodfill(lab, (int(x), int(y)), colour)
            colour += 1
    arr = np.asarray(lab)
    out = []
    for c in range(1, colour):
        m = arr == c
        if m.sum() > 400:
            out.append((int(m.sum()), c, m))
    return sorted(out, key=lambda b: -b[0])


# Near eye: loose range (keeps its shaded beige edge), largest blob in the top third.
loose = find_blobs(cream)
near = next(b for b in loose if np.where(b[2])[0].mean() < h * 0.36)
# Far eye: strict cream range, largest blob in the right third (the body's sheen is also light).
strict = find_blobs((lo > 150) & ((hi - lo) < 45) & (alpha > 200))
far = next(b for b in strict if np.where(b[2])[1].mean() > w * 0.66)
# Far eye: fit a circle to its visible right-hand edge (rightmost light pixel per row),
# keep light pixels inside it, and trim back from the head's edge so the sheen can't leak in.
fy, fx = np.where(far[2])
rows = np.unique(fy)
ex = np.array([fx[fy == r].max() for r in rows], float)
ey = rows.astype(float)
A = np.c_[2 * ex, 2 * ey, np.ones_like(ex)]
(fcx, fcy, k), *_ = np.linalg.lstsq(A, ex ** 2 + ey ** 2, rcond=None)
fr = np.sqrt(k + fcx ** 2 + fcy ** 2)
gy, gx = np.mgrid[0:h, 0:w]
disk = (gx - fcx) ** 2 + (gy - fcy) ** 2 <= (fr - 1.5) ** 2
left = np.median([fx[fy == r].min() for r in rows])
far = (far[0], far[1], disk & (lo > 95) & (alpha > 200) & (gx > left + 8))
eyes = [near, far]

mask = np.zeros((h, w), bool)
info = []
for n, c, m in eyes:
    yy, xx = np.where(m)
    x0, x1, y0, y1 = xx.min(), xx.max(), yy.min(), yy.max()
    # Fill holes (baked pupil + highlight): pixels in the bbox not reachable from its border.
    box = Image.fromarray(np.where(m[y0:y1 + 1, x0:x1 + 1], 0, 255).astype(np.uint8), 'L').copy()
    bw, bh = box.size
    bp = box.load()
    for bx in range(bw):
        for by in (0, bh - 1):
            if bp[bx, by] == 255:
                ImageDraw.floodfill(box, (bx, by), 128)
    for by in range(bh):
        for bx in (0, bw - 1):
            if bp[bx, by] == 255:
                ImageDraw.floodfill(box, (bx, by), 128)
    filled = np.asarray(box) != 128
    fill_img = Image.fromarray((filled * 255).astype(np.uint8), 'L').filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(7))
    filled = np.asarray(fill_img) > 127
    if m is near[2]:
        # The near eye is a near-perfect circle: fit it, so the mask has a clean round edge.
        cx, cy = (x1 - x0) / 2, (y1 - y0) / 2
        r = max(x1 - x0, y1 - y0) / 2 + 1.5
        gy, gx = np.mgrid[0:filled.shape[0], 0:filled.shape[1]]
        filled = (gx - cx) ** 2 + (gy - cy) ** 2 <= r ** 2
    else:
        cy, cx = np.mean(np.where(filled), axis=1)
        r = np.sqrt(filled.sum() / np.pi)
    mask[y0:y1 + 1, x0:x1 + 1] |= filled
    info.append({'cx': round((x0 + cx) / w * 100, 2), 'cy': round((y0 + cy) / h * 100, 2),
                 'r': round(r / w * 100, 2), 'area': int(filled.sum())})

# Big (near) eye first.
info.sort(key=lambda e: -e['area'])
m_img = Image.fromarray((mask * 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.8))
out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
out.putalpha(m_img)
out.save(IMG / 'cham-hero-eyes.png', optimize=True)
(IMG / 'cham-hero-eyes.json').write_text(json.dumps({'width': w, 'height': h, 'eyes': info}, indent=2))
print(json.dumps(info))

# Review image: the render with both eye masks tinted, and test pupils drawn at offsets.
rev = src.copy()
tint = Image.new('RGBA', (w, h), (255, 22, 140, 110))
rev.alpha_composite(Image.composite(tint, Image.new('RGBA', (w, h), (0, 0, 0, 0)), m_img))
d = ImageDraw.Draw(rev)
for e, (ox, oy) in zip(info, [(-0.45, -0.1), (0.5, 0.2)]):
    cx, cy, r = e['cx'] / 100 * w, e['cy'] / 100 * h, e['r'] / 100 * w
    pr = r * 0.32
    px_, py_ = cx + ox * r, cy + oy * r
    d.ellipse([px_ - pr, py_ - pr, px_ + pr, py_ + pr], fill=(17, 17, 17, 255))
rev.save(HERE / '_eyes-review.png')
