"""Build a project (case study) page from its data file.

    python tools/build_work.py content/work/clay-and-glaze.json

Reads the project's JSON (copy, theme, which deck slides go where), and writes
website/work/<slug>/index.html. Images are expected in website/assets/work/<slug>/ as
<prefix>-NN-1920.webp and <prefix>-NN-960.webp (NN = slide number). Shared parts (analytics
snippet, footer) are copied from the homepage so the pages never drift apart.
Placeholders written as [[LIKE THIS]] in the data are left out of the page and listed at the end.
"""
import html, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / 'website'
data = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'))
slug, prefix = data['slug'], data.get('prefix', 'cg')
IMG = f'../../assets/work/{slug}'
e = lambda s: html.escape(s, quote=True)
todo = []
def known(v, label):
    if re.search(r'\[\[.*?\]\]', v): todo.append(f'{label}: {v}'); return False
    return True

def fig(n, cap, sizes='(max-width: 760px) 100vw, 50vw', cls=''):
    return (f'<figure class="cs-fig {cls}" data-reveal-cs>'
            f'<button class="cs-zoom" type="button" data-full="{IMG}/{prefix}-{n:02d}-1920.webp" data-cap="{e(cap)}" aria-label="Enlarge: {e(cap)}">'
            f'<img src="{IMG}/{prefix}-{n:02d}-960.webp" srcset="{IMG}/{prefix}-{n:02d}-960.webp 960w, {IMG}/{prefix}-{n:02d}-1920.webp 1920w" sizes="{sizes}" width="1920" height="1080" alt="{e(cap)}" loading="lazy">'
            f'</button><figcaption>{e(cap)}</figcaption></figure>')
def row(items, full=False):
    sizes = '(max-width: 760px) 100vw, 92vw' if len(items) == 1 or full else '(max-width: 760px) 100vw, 46vw'
    return f'<div class="cs-row cs-row--{len(items)}">' + ''.join(fig(n, c, sizes) for n, c in items) + '</div>'

home = (SITE / 'index.html').read_text(encoding='utf-8')
analytics = home[home.index('  <script>\n    !function(t,e)'):home.index('</script>', home.index('!function(t,e)')) + len('</script>')]
footer = home[home.index('  <footer class="ft"'):home.index('</footer>') + len('</footer>')]
footer = re.sub(r'href="#(?!top)([\w-]+)"', r'href="../../#\1"', footer)

t, ov, st, idn, col, out = data['theme'], data['overview'], data['story'], data['identity'], data['collateral'], data['final']
# Display face for the title and quotes; Playfair unless the project's own type says otherwise.
font = data.get('font', {'family': 'Playfair Display', 'css': 'Playfair+Display:wght@400;500', 'weight': 400})
lab = lambda sec, default: e(sec.get('label', default))
meta = ''.join(f'<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>' for k, v in data['meta'] if known(v, k))
brief = ''.join(f'<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>' for k, v in ov['brief'])
chips = ''.join(f'<li class="cs-chip" style="--c:{hx}"><span class="cs-swatch"></span><b>{e(name)}</b><span>{e(sub)}</span><code>{hx}</code></li>' for name, sub, hx in idn['palette'])

page = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(data['client'])} | Girgit Labs</title>
  <meta name="description" content="{e(data['client'])}: {e(data['outcome'])}">
  <meta name="theme-color" content="{t['dark']}">
  <link rel="icon" href="../../assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={font['css']}&amp;display=swap">
  <link rel="preconnect" href="https://api.fontshare.com" crossorigin>
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700,900&amp;display=swap">
  <link rel="stylesheet" href="../../css/site.css">
  <link rel="stylesheet" href="../../css/hero.css">
  <link rel="stylesheet" href="../../css/footer.css">
  <link rel="stylesheet" href="../../css/case.css">
  <script type="module" src="../../js/case.js"></script>
{analytics}
</head>
<body class="cs" style="--cs-dark:{t['dark']};--cs-paper:{t['paper']};--cs-ink:{t['ink']};--cs-accent:{t['accent']};--cs-accent2:{t['accent2']};--cs-accent3:{t['accent3']};--cs-light:{t.get('light', '#F4E9DC')};--cs-tint:{t.get('tint', '#EBD3BC')};--cs-display:'{font['family']}';--cs-display-weight:{font['weight']}">
  <a class="skip" href="#main">Skip to content</a>
  <header class="nav cs-nav" id="top">
    <a class="nav-logo" href="../../" aria-label="Girgit Labs, home"><img src="../../assets/girgit-wordmark.svg" width="112" height="30" alt=""></a>
    <nav aria-label="Main"><ul class="nav-links" role="list"><li><a class="pill" href="../../#work">all work</a></li><li><a class="pill" href="../../#what">what we do</a></li></ul></nav>
    <a class="pill pill--ink" href="../../#talk">↳ let's talk</a>
  </header>

  <main id="main">
    <!-- Case study: {e(data['client'])}. Built by tools/build_work.py from content/work/{slug}.json. -->
    <section class="cs-hero" aria-labelledby="cs-title">
      <div class="cs-wrap">
        <p class="cs-kicker"><a href="../../#work">Selected work</a> <span aria-hidden="true">/</span> Case study</p>
        <h1 class="cs-title" id="cs-title">{e(data['client'])}</h1>
        <p class="cs-outcome">{e(data['outcome'])}</p>
        <dl class="cs-meta">{meta}</dl>
      </div>
      <div class="cs-hero-img">{fig(data['hero'], data.get('heroCap', data['client'] + ', the final mark'), '100vw', 'cs-fig--hero')}</div>
    </section>

    <section class="cs-sec" aria-labelledby="cs-overview">
      <div class="cs-wrap cs-split">
        <div><p class="cs-label">01 · Overview</p><h2 class="cs-h2" id="cs-overview">The project</h2><p class="cs-lede" data-reveal-cs>{e(ov['lede'])}</p></div>
        <dl class="cs-brief" data-reveal-cs>{brief}</dl>
      </div>
    </section>

    <section class="cs-sec cs-sec--dark" aria-labelledby="cs-story">
      <div class="cs-wrap">
        <p class="cs-label">02 · {lab(st, 'Brand story')}</p>
        <h2 class="cs-h2 cs-serif" id="cs-story">{e(st['title'])}</h2>
        <p class="cs-text" data-reveal-cs>{e(st['text'])}</p>
        {row([st['lead']]) if st.get('lead') else ''}
        {row([[n, 'Brand voice'] for n in st['voice']]) if st.get('voice') else ''}
      </div>
    </section>

    <section class="cs-sec" aria-labelledby="cs-identity">
      <div class="cs-wrap">
        <p class="cs-label">03 · {lab(idn, 'Identity system')}</p>
        <h2 class="cs-h2 cs-serif" id="cs-identity">{e(idn['title'])}</h2>
        <p class="cs-text" data-reveal-cs>{e(idn['text'])}</p>
        {row(idn['concepts']) if idn.get('concepts') else ''}
        {row(idn['combine']) if idn.get('combine') else ''}
        {row([idn['construction']]) if idn.get('construction') else ''}
        <div class="cs-palette" data-reveal-cs><p class="cs-sub">Colour</p><ul class="cs-chips" role="list">{chips}</ul></div>
        {row([[idn['paletteSlide'], 'Colour palette']]) if idn.get('paletteSlide') else ''}
        {''.join(row(p) for p in idn.get('pairs', []))}
        {row([idn['single']]) if idn.get('single') else ''}
      </div>
    </section>

    <section class="cs-sec cs-sec--tint" aria-labelledby="cs-collateral">
      <div class="cs-wrap">
        <p class="cs-label">04 · {lab(col, 'Collateral')}</p>
        <h2 class="cs-h2 cs-serif" id="cs-collateral">{e(col['title'])}</h2>
        <p class="cs-text" data-reveal-cs>{e(col['text'])}</p>
        {''.join(row(r) for r in col['rows'])}
      </div>
    </section>

    <section class="cs-sec cs-sec--dark cs-outcome-sec" aria-labelledby="cs-outcome">
      <div class="cs-wrap">
        <p class="cs-label">05 · Final outcome</p>
        <h2 class="cs-h2" id="cs-outcome">{e(out.get('title', 'The brand, together'))}</h2>
        {row([[out['image'], data['client'] + ', mark and name']]) if out.get('image') else ''}
        <blockquote class="cs-quote cs-serif" data-reveal-cs>{e(out['quote'])}</blockquote>
      </div>
    </section>

    <section class="cs-next" aria-labelledby="cs-next">
      <div class="cs-wrap cs-next-in">
        <p class="cs-label">Next</p>
        <h2 class="cs-next-title" id="cs-next">Got a good idea? <span>Let's make it real.</span></h2>
        <p class="cs-next-actions"><a class="cs-btn cs-btn--primary" href="../../#talk">Start a project</a><a class="cs-btn" href="../../#work">More work</a></p>
        <p class="cs-next-note">More case studies are on their way.</p>
      </div>
    </section>
  </main>

  <dialog class="cs-lightbox" aria-label="Image viewer">
    <figure><img alt=""><figcaption></figcaption></figure>
    <button class="cs-lb-btn cs-lb-prev" type="button" aria-label="Previous image">←</button>
    <button class="cs-lb-btn cs-lb-next" type="button" aria-label="Next image">→</button>
    <button class="cs-lb-btn cs-lb-close" type="button" aria-label="Close">✕</button>
  </dialog>

{footer}
</body>
</html>
'''
# A project page shows at most four images (house rule).
shown = len(re.findall(r'class="cs-zoom"', page))
if shown > 4: sys.exit(f'{slug}: {shown} images; project pages use at most 4. Trim the data file.')
out_dir = SITE / 'work' / slug
out_dir.mkdir(parents=True, exist_ok=True)
(out_dir / 'index.html').write_text(page, encoding='utf-8', newline='\n')
print('wrote', out_dir / 'index.html')
for line in todo: print('left out (fill in the data file):', line)
