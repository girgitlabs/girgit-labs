"""Cut the white studio background out of the generated renders.

- Background = light, neutral pixels connected to the image border (flood fill), so
  white details inside an object (eyes, the Mac screen) are never touched.
- Light grey floor shadows in that region become see-through ink shadows, so they
  work on any page colour.
- Crops tight, resizes for the web, writes WebP with alpha to website/assets/img/.
- Optional white "sticker" edge (Mark Levin / Daisy style) for collage pieces.

Run from this folder:  python cutout.py
"""
import pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent / 'website' / 'assets' / 'img'
OUT.mkdir(parents=True, exist_ok=True)
INK = (28, 26, 23)

# name: (max size in px, sticker edge?)
JOBS = {
    'cham-hero': (1200, False), 'cham-lime': (1200, False), 'cham-sleep': (1000, False), 'cham-peek': (1000, False),
    'photo-chameleon': (1100, True), 'prop-mac': (900, True),
    'prop-drop': (700, False), 'prop-squiggle': (700, False), 'prop-hourglass': (800, False), 'prop-seven': (800, False),
}


def cut(img: Image.Image, shadows=True) -> Image.Image:
    rgb = np.asarray(img.convert('RGB')).astype(np.int16)
    lo, hi = rgb.min(axis=2), rgb.max(axis=2)
    light = (lo > 170) & ((hi - lo) < 16)                    # light and neutral: candidate background

    # Flood fill from every light border pixel, so only background connected to the edge is removed.
    # .copy(): fromarray shares numpy's read-only buffer, and flood fill would silently write nothing.
    mask = Image.fromarray(np.where(light, 255, 0).astype(np.uint8), 'L').copy()
    w, h = mask.size
    m = mask.load()
    for x in range(w):
        for y in (0, h - 1):
            if m[x, y] == 255:
                ImageDraw.floodfill(mask, (x, y), 128)
    for y in range(h):
        for x in (0, w - 1):
            if m[x, y] == 255:
                ImageDraw.floodfill(mask, (x, y), 128)
    bg = np.asarray(mask) == 128

    lum = rgb.mean(axis=2)
    alpha = np.full(lum.shape, 255.0)
    # Background: pure white is fully transparent; greys become a soft ink shadow.
    shade = np.clip((246 - lum) / (246 - 170), 0, 1) ** 1.15
    alpha[bg] = shade[bg] * 200 if shadows else 0   # photos: grey studio backdrop, no floor shadow
    out = np.dstack([rgb.astype(np.uint8), alpha.astype(np.uint8)])
    out[bg, 0], out[bg, 1], out[bg, 2] = INK
    rgba = Image.fromarray(out, 'RGBA')

    # Soften the hard edge between object and background by one pixel.
    a = rgba.getchannel('A').filter(ImageFilter.GaussianBlur(0.6))
    rgba.putalpha(a)
    return rgba


def crop(rgba: Image.Image, pad=0.03) -> Image.Image:
    a = np.asarray(rgba.getchannel('A'))
    ys, xs = np.where(a > 10)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    p = int(max(rgba.size) * pad)
    return rgba.crop((max(0, x0 - p), max(0, y0 - p), min(rgba.width, x1 + p), min(rgba.height, y1 + p)))


def sticker(rgba: Image.Image, edge: int) -> Image.Image:
    solid = rgba.getchannel('A').point(lambda v: 255 if v > 140 else 0)
    big = Image.new('L', (rgba.width + edge * 2, rgba.height + edge * 2), 0)
    big.paste(solid, (edge, edge))
    grown = big.filter(ImageFilter.MaxFilter(edge * 2 + 1)).filter(ImageFilter.GaussianBlur(1))
    base = Image.new('RGBA', big.size, (255, 255, 255, 0))
    base.putalpha(grown)
    base.alpha_composite(rgba, (edge, edge))
    return base


for name, (size, edge) in JOBS.items():
    src = HERE / f'{name}.webp'
    img = crop(cut(Image.open(src), shadows=not name.startswith('photo')))
    img.thumbnail((size, size), Image.LANCZOS)
    if edge:
        img = sticker(img, max(8, size // 60))
    dst = OUT / f'{name}.webp'
    img.save(dst, 'WEBP', quality=84, method=6)
    print(f'{name:16} {img.width}x{img.height}  {dst.stat().st_size // 1024} KB')
