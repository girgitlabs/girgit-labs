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

Hosted on **Cloudflare Pages**, connected to this GitHub repository. Every push to
`main` redeploys automatically.

### Why Cloudflare and not Vercel

One visit costs **~9 MB**, almost all of it the background film. Vercel meters data
transfer (100 GB on Hobby) and **prohibits commercial use on Hobby entirely** — a studio
selling design services is squarely commercial, so Hobby was never an option and Pro is
$20/month. Cloudflare charges nothing for bandwidth and nothing for static asset
requests, on any plan. That is the whole argument: this site's bill stays flat as it
grows, because video is not a metered resource.

### Project settings

This is a plain static site. There is no build step.

| Setting | Value |
|---|---|
| Production branch | `main` |
| **Root directory** | **`website`** |
| Build command | *(leave empty)* |
| Build output directory | `website` |

The root directory is the setting that matters: the repository root is not the site
root, because `content/` and `video-prompt.txt` sit alongside it. Point Cloudflare at
the repository root and it will find no `index.html` and serve a 404.

The site is served at `www.girgitlabs.design` — a `CNAME` at the DNS provider pointing
at the `*.pages.dev` address — deliberately **instead of** the apex, because
`girgitlabs.design` carries live email and a `CNAME` on a subdomain cannot disturb mail
records.

### The contact form

The form posts to `/api/contact`, served by `website/functions/api/contact.js` — a
Cloudflare Pages Function that delivers through [Resend](https://resend.com) with plain
`fetch` and no dependencies. Pages routes a `functions/` directory automatically, so
files landing at `website/functions/api/contact.js` resolve to `/api/contact` with no
extra configuration.

Set these in the Cloudflare Pages project, Settings > Environment variables (template in
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
- Locally the function can't run under `serve.py`; the form shows its error state. To
  exercise it, set `FORM_ENDPOINT` to a Formspree URL or run `npx wrangler pages dev .`

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
