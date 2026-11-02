---
description: Check that the latest Girgit Labs site is in place, then commit and push it to main (Cloudflare Pages redeploys)
---

// turbo-all

1. Sync the root mirror from `website/` and check this is the latest site:
   `python tools/check_site.py --sync`
   If it prints `NOT the latest site`, stop and fix what it lists (see AGENTS.md). Do not continue.

2. Stage everything: `git add -A`

3. Commit, if anything changed: `git commit -m "Deploy latest site"`
   (skip this step if git reports nothing to commit)

4. Push: `git push origin main`

5. Confirm: `git status -sb` shows `main` level with `origin/main`. Cloudflare Pages redeploys from the push.
