"""Is this the latest Girgit Labs site? Run before every commit and push.

    python tools/check_site.py          # check; exit 1 with the reasons if anything is off
    python tools/check_site.py --sync   # first copy website/ over the root mirror, then check

website/ is the source of truth. The repository root holds a mirror of it (index.html, css/,
js/, assets/, work/, functions/, _redirects) so the site deploys from either directory; the two
must match. The check fails on any older build: the old "mascot" homepage, the drawn-chameleon
lab (lab-scene.js / girgit.js), or a page missing the videos or the project pages.
"""
import pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / 'website'
MIRROR = ['index.html', 'css', 'js', 'assets', 'work', 'functions', '_redirects']
VERSION = 'v2-latest'

# What the latest homepage must have, and what only older builds had.
MUST = {
    'version marker': f'<meta name="girgit-site-version" content="{VERSION}',
    "hero (Girgit's living skin)": '<section class="sk" id="top"',
    'the reveal photo of Girgit': 'assets/img/girgit-skin.webp',
    'lab film': 'class="lab-video"',
    'eye wall': '<section class="eyes" id="looking"',
    'parked jungle section (kept in its template)': '<template id="hide-section">',
    'the name': 'id="name"',
    'the seven days': 'id="seven-days"',
    'why the speed is real': 'id="why"',
    "who we're for": 'id="who"',
    'Clay & Glaze project link': 'href="work/clay-and-glaze/"',
    'LD Screw project link': 'href="work/ld-screw/"',
    'footer banner': '<footer class="ft"',
}
MUST_NOT = {
    'old mascot homepage': 'class="mascot"',
    'old hero section': '<section class="hero"',
    'old finale section': '<section class="finale"',
    'drawn-chameleon lab': 'lab-scene.js',
}
FILES = ['assets/video/lab.mp4', 'assets/video/lab-m.mp4', 'assets/video/jungle.mp4',
         'work/clay-and-glaze/index.html', 'work/ld-screw/index.html', 'js/lab.js', 'js/skin.js', 'js/hide.js', 'js/eyes.js']
GONE = ['js/lab-scene.js', 'js/girgit.js', 'js/clay']


def files(base, names):
    for n in names:
        p = base / n
        if p.is_file(): yield p
        elif p.is_dir(): yield from (f for f in p.rglob('*') if f.is_file() and '__pycache__' not in f.parts)


def same(a, b):
    x, y = a.read_bytes(), b.read_bytes()
    return x == y or x.replace(b'\r\n', b'\n') == y.replace(b'\r\n', b'\n')


def sync():
    for n in MIRROR:
        src, dst = SITE / n, ROOT / n
        if dst.is_dir(): shutil.rmtree(dst)
        elif dst.exists(): dst.unlink()
        if src.is_dir(): shutil.copytree(src, dst, ignore=shutil.ignore_patterns('__pycache__'))
        elif src.exists(): shutil.copy2(src, dst)
    print('synced website/ -> repository root')


def refs_missing(base):
    """Local files referenced by the pages, styles and scripts that don't exist."""
    out = []
    for f in [*base.rglob('*.html'), *base.rglob('*.css'), *base.rglob('*.js')]:
        if 'styleboard' in f.parts: continue
        s = f.read_text(encoding='utf-8', errors='ignore')
        refs = re.findall(r'(?:src|href|poster|data-full)="([^"#?]+)', s) + re.findall(r"url\(['\"]?([^'\")#]+)", s) \
            + re.findall(r"(?:import|from)\s*['\"](\.[^'\"]+)", s)
        for r in re.findall(r'srcset="([^"]+)"', s): refs += [x.strip().split(' ')[0] for x in r.split(',')]
        for u in refs:
            if not u or re.match(r'^(https?:|mailto:|data:|tel:|//|\$\{)', u) or u.startswith('/api'): continue
            p = (f.parent / u).resolve()
            if not (p / 'index.html' if p.is_dir() else p).exists(): out.append(f'{f.relative_to(base)} -> {u}')
    return out


def check():
    errors = []
    home = (SITE / 'index.html').read_text(encoding='utf-8')
    errors += [f'website/index.html is missing the {k}' for k, v in MUST.items() if v not in home]
    errors += [f'website/index.html still has the {k}' for k, v in MUST_NOT.items() if v in home]
    errors += [f'website/{f} is missing' for f in FILES if not (SITE / f).exists()]
    errors += [f'website/{f} is from an old build; delete it' for f in GONE if (SITE / f).exists()]
    errors += [f'broken reference in website/{m}' for m in refs_missing(SITE)]
    if '—' in re.sub(r'<!--.*?-->', '', home, flags=re.S):
        errors.append('website/index.html has an em-dash in its copy; use a colon, comma or "|"')
    for f in files(SITE, MIRROR):
        twin = ROOT / f.relative_to(SITE)
        if not twin.exists() or not same(f, twin):
            errors.append(f'root mirror out of date: {twin.relative_to(ROOT)} (run with --sync)')
    for f in files(ROOT, MIRROR):
        if not (SITE / f.relative_to(ROOT)).exists():
            errors.append(f'root mirror has a file website/ does not: {f.relative_to(ROOT)} (run with --sync)')
    return errors


if __name__ == '__main__':
    if '--sync' in sys.argv: sync()
    problems = check()
    if problems:
        print('NOT the latest site. Do not push until these are fixed:')
        for p in problems[:40]: print('  -', p)
        if len(problems) > 40: print(f'  ... and {len(problems) - 40} more')
        sys.exit(1)
    print(f'OK: website/ is the latest site ({VERSION}) and the root mirror matches. Safe to commit and push.')
