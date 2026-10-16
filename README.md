# Girgit Labs

Website and site content for [girgitlabs.com](https://girgitlabs.com).

## Layout

| Path | What it is |
|---|---|
| `website/` | The site. Plain HTML, CSS and JS — no framework, no build step required. |
| `content/` | The approved site copy, as markdown. Source of truth for wording. |
| `video-prompt.txt` | The generation prompt for the background film. |

## The site

`website/index.html` is **generated**. Edit `website/src/index.template.html`, then:

```bash
cd website
python build.py
```

The build inlines the logo paths from `website/src/logo-data/`. Those data files are
committed on purpose — the build breaks without them.

### Preview locally

```bash
cd website
python serve.py
```

Then open http://127.0.0.1:5178.

Use `serve.py`, not `python -m http.server`. The background film is scrubbed by scroll
position, which needs HTTP Range requests to seek; Python's stock server ignores them.
Every production host supports Range natively, so this only matters locally.

## Deploying

Hosted on Vercel, importing this repository.

> **Root Directory must be set to `website`.**

The repository root is not the site root — `content/` and `video-prompt.txt` live
alongside it. Without that setting Vercel will find no `index.html` and serve a 404.

- Framework preset: **Other**
- Build command: **none**
- Output directory: **default**

### The contact form

The form posts to a third-party endpoint, not to this repo. On Netlify the
`data-netlify` attribute handles it; on any other host you must set `FORM_ENDPOINT`
near the top of `website/js/main.js`.

With `FORM_ENDPOINT` empty the browser posts to `/`, which a static host answers with
a 405 — **the form then fails silently.** Verify a real submission arrives before
considering a deploy finished.

## Before launch

`content/07-global.md` carries the pre-launch checklist and the copy rules. The
outstanding technical items:

- 1200×630 `og:image` per page
- `rel="canonical"`, `robots.txt`, `sitemap.xml`
- real Instagram and LinkedIn URLs in the footer (`website/index.html` still points at
  the bare `instagram.com` and `linkedin.com` roots)
- footer availability month current
