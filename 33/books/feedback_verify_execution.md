---
name: Verify Execution Not Just Intent
description: Don't claim changes are live without verifying the actual deployed output. Cloudflare cache, z-index bugs, CSS specificity. Session 24 lesson.
type: feedback
---

# Verify Execution, Not Just Intent

Writing code ≠ deploying code ≠ code actually working.

**Why:** In Session 24, multiple "shipped" changes were invisible to the user:
1. breathe.js motes rendered behind opaque body background (z-index:-1 behind #08080d body)
2. Brand font CSS was overridden by page inline styles (same specificity)
3. Cloudflare served 2-hour cached versions of updated files
4. Spiral door had brown tint from rgba trail effect while other doors cleared properly

**How to apply:**
- After pushing, verify from ORIGIN (lacobusgump.github.io) not just Cloudflare (begump.com)
- Use cache-busting query strings (?v=N) when updating JS files served through CDN
- Test CSS changes against inline page styles — use !important when injecting via JS
- Check z-index stacking against opaque backgrounds
- When James says "it doesn't look like anything changed" — he's right. Debug, don't explain.
- Don't say "pushed" until you've confirmed the live output matches intent
