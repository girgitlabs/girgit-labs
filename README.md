# Girgit Labs website

The studio site for Girgit Labs: a static site (plain HTML, CSS and JavaScript, no build step) deployed on
Cloudflare Pages, with one Pages Function for the contact form.

## Structure

```
index.html            Home page
404.html              Not-found page
work/<project>/       Case studies (Clay & Glaze, LD Screw, Moshi)
css/                  Styles. system.css loads last and holds the shared design system and overrides
js/                   One module per section, all imported by js/site.js (home) or js/case.js (case studies)
assets/img/           Images (clay Girgit renders, lab stills)
assets/video/         What-we-do film clips
assets/work/          Case-study images and the square work covers
functions/api/        Cloudflare Pages Function: POST /api/contact (sends enquiries through Resend)
_headers, _redirects  Cloudflare Pages caching, security headers and redirects
robots.txt, sitemap.xml, llms.txt, manifest.json
serve.py              Local preview server (not used in production)
```

## Run locally

```bash
python serve.py
```

Then open http://127.0.0.1:5178. Every response is sent with no-store, so a plain refresh shows each edit.

## Deploy (Cloudflare Pages)

- Build command: none. Output directory: `/` (the repository root).
- Environment variables (Settings > Environment variables), see `.env.example`:
  - `RESEND_API_KEY` (mark as a Secret)
  - `CONTACT_TO`
  - `CONTACT_FROM` (optional, must be a sender domain verified in Resend)
- Until the contact variables are set, the form answers 503 and asks visitors to email instead.

## Caching

`_headers` caches everything under `/assets/` for a year as immutable. When an image changes, give it a
new filename (for example `-v2`) rather than replacing the file in place. CSS and JS revalidate on every
deploy; their `?v=` query strings in the HTML and in `js/site.js` / `js/case.js` are bumped with each change.
