---
name: push
description: Commit and push to GitHub — bumps BUILD, deploys to begump.com
disable-model-invocation: true
---

Deploy GUMP to production (GitHub Pages → begump.com).

Steps:
1. Run syntax check on all 10 v2 modules first. If any fail, STOP and fix.
2. Check git status for uncommitted changes.
3. Ask James for a commit message theme (or use $ARGUMENTS if provided).
4. Bump the BUILD number in index.html and update all script tag version params to match.
5. Stage the changed files (be specific — no `git add .`).
6. Commit with the message.
7. Push to origin main.
8. Report the commit hash and remind James to check begump.com in ~60 seconds.

IMPORTANT: Never force push. Never skip hooks. Always show James the diff before committing.
