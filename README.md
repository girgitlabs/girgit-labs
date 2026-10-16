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

The form posts to `/api/contact`, served by `website/api/contact.js` — a Node
function that delivers through [Resend](https://resend.com) with plain `fetch` and no
dependencies. Because the Vercel Root Directory is `website`, this resolves correctly
with no extra configuration.

Set these in the Vercel project's Environment Variables (template in
`website/.env.example`):

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | yes | Sending key from Resend |
| `CONTACT_TO` | yes | Where enquiries land |
| `CONTACT_FROM` | no | Must be a Resend-verified sender before launch |

Behaviour worth knowing:

- **Unconfigured returns 503, not success.** A contact form that silently discards
  enquiries is worse than one that visibly fails, so the page falls back to showing the
  email address. It never claims to have sent something it didn't.
- A filled honeypot field returns 200 and sends nothing, so bots get no signal.
- Locally the handler can't run under `serve.py`; the form shows its error state. To
  exercise it, set `FORM_ENDPOINT` to a Formspree URL or run `vercel dev`.

`FORM_ENDPOINT` at the top of `website/js/main.js` overrides the route — point it at a
Formspree or CRM webhook if you'd rather not run the function. On Netlify, empty it and
the `data-netlify` attribute takes over.

**Verify a real submission arrives before calling a deploy finished.**

## Before launch

`content/07-global.md` carries the pre-launch checklist and the copy rules. The
outstanding technical items:

- 1200×630 `og:image` per page
- `rel="canonical"`, `robots.txt`, `sitemap.xml`
- real Instagram and LinkedIn URLs in the footer (`website/index.html` still points at
  the bare `instagram.com` and `linkedin.com` roots)
- footer availability month current
