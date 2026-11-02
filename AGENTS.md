# Girgit Labs site: instructions for coding agents (Antigravity, Claude Code, others)

## Which version is the latest

- **`website/` is the latest site and the only source of truth.** Edit there.
- The repository root holds a mirror of it (`index.html`, `css/`, `js/`, `assets/`, `work/`,
  `functions/`, `_redirects`) so the site deploys from either directory. Never edit the mirror by
  hand; copy `website/` over it with `python tools/check_site.py --sync`.
- The latest homepage carries `<meta name="girgit-site-version" content="v2-latest ...">`.
  A page without that marker is an older build.
- What the latest site has: the split-screen hero, the Adaptation Lab film
  (`assets/video/lab.mp4`, `lab-m.mp4`), the hide-and-seek jungle (`assets/video/jungle.mp4`),
  the eye wall, services, the work grid linking to `work/clay-and-glaze/` and `work/ld-screw/`,
  and the framed footer banner. Contact email: connect@girgitlabs.design.

## Older builds: never restore these

- The "mascot" homepage from commit `90c32bc` (`<section class="hero">`, `class="mascot"`,
  `<section class="finale">`). It replaced the latest homepage by mistake on 2026-11-01.
- The drawn-chameleon lab (`js/lab-scene.js`, `js/girgit.js`, commit `bb15417` and earlier).
  The owner rejected code-drawn chameleons; Girgit only appears through the supplied 3D renders
  and the video cut from them.
- If a merge or restore brings any of these back, take `website/index.html`, `css/site.css` and
  `js/site.js` from the last commit where `python tools/check_site.py` passes.

## Before every commit and push

```bash
python tools/check_site.py --sync
```

It syncs the root mirror, then checks the homepage is the latest, the videos and project pages
exist, every referenced file is present and the copy has no em-dashes. If it prints
`NOT the latest site`, fix what it lists; do not push. The `/deploy` workflow
(`.agent/workflows/deploy.md`) runs the whole sequence: check, commit, push.

## Deploying

Cloudflare Pages, connected to `github.com/girgitlabs/girgit-labs`. Every push to `main`
redeploys. No build step. After pushing, confirm the deployment succeeded: the live page source
must contain the `girgit-site-version` marker.

## Copy rules

- No em-dashes anywhere in site copy, titles or meta descriptions.
- Project pages are generated: edit `content/work/<slug>.json`, then run
  `python tools/build_work.py content/work/<slug>.json`, then `python tools/check_site.py --sync`.
  At most 4 images per project page.
