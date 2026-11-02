---
trigger: always_on
---

# Ship only the latest Girgit Labs site

- `website/` is the latest site and the only source of truth. The repository root is a mirror of it.
- The latest homepage has `<meta name="girgit-site-version" content="v2-latest ...">`. Anything without it is an old build.
- Before any commit or push, run `python tools/check_site.py --sync`. Push only when it prints `OK`.
- Never restore the "mascot" homepage (commit 90c32bc) or the drawn-chameleon lab (`js/lab-scene.js`, `js/girgit.js`).
- Full details: `AGENTS.md`. To ship, run the `/deploy` workflow.
