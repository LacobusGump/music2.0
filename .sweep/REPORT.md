# begump.com — Clean Sweep, 2026-06-03

> RESOLVED (commit fceba263, deployed + verified live):
> - Double gate removed from 40 pages — paid-user lockout fixed, dup IDs 42→0. CONFIRMED bug: unlock page sets only `gump_paid` cookie, old gate checked only `gump_key`.
> - Dead sitemap entry `research/logical-qubits/` removed.
> - `research/unlock/` set to noindex (utility page).
> - The "37 missing descriptions" was 19 noindex + 17 redirect stubs (correct by design) + 1 unlock (now noindex). SEO surface is clean.
> - NOTE (by design, not fixed): gate password `hm.<3` and unlock key `gump3dollars2026` are in client source — soft honor-system gate, not DRM.
> - Benign/left alone: outfit `stage-name`, radio `prompt-x` (same element re-rendered, not real DOM dupes).


Scope: 290 HTML pages, 104 JS/CSS, 216 audio. Structural integrity, intention→execution, inside-out.

## Clean (the good news)
- **Zero secret leaks** — no Cloudflare/Stripe/AWS keys, no private keys, no api-key strings in any HTML/JS.
- **Zero insecure `http://` links.**
- **Sitemap**: 217 URLs, only 1 broken target.
- No broken internal page links except a deliberate template scaffold.

---

## 1. HEADLINE — double gate on 48 pages (access + revenue bug)
Every pay-gated page carries TWO stacked gate scripts:
- **Gate A** (old): password-only (`hm.<3`), checks only `localStorage gump_key`.
- **Gate B** (new): Stripe **$3 unlock** OR password, checks `gump_paid` cookie AND `gump_key`.

Both run on load. Both inject `g-hide`, `g-gate`, `g-pw`, and redefine `window._gChk` → the 42 duplicate-ID findings.

**Impact:** Gate B honors the paid cookie and bails, but Gate A doesn't know about paying — so it rebuilds the password wall on top. **A user who paid $3 (cookie only, no localStorage) is still locked out.** Severity depends on whether the Stripe return flow also sets `gump_key` in localStorage (couldn't confirm — the cookie is set server-side, no static setter in repo).

**Fix (safe):** Gate B is a strict superset of Gate A — it preserves the exact `hm.<3` password path AND the `gump_key` localStorage check. Removing Gate A (the first `<script>` block) fixes the lockout and the dup IDs with no loss of function.

**Affected:** 48 pages (37 live research + outfit + radio + others). Needs careful batch edit + verification that the password path still works after.

## 2. Sitemap points to a missing page
`https://begump.com/research/logical-qubits/` is in `sitemap.xml` but the page doesn't exist → 404 for crawlers. Trivial: remove the line (or restore the page if it was renamed).

## 3. 37 real research/product pages missing `<meta description>`
SEO gap on live pages incl. `autism`, `als-fus`, `cancer-inverse`, `grokking`, `parkinsons`, `reversible-computing`, `quantum-ec`. Session 34 SEO pass didn't cover these. Medium priority — each needs a one-line hand-written description (not auto-generated).

## 4. Minor / legacy
- `template/index.html` — scaffold with placeholder `/a/ /b/ /c/` links + relative `toggle.js`/`breathe.js`. It's the page-builder template; harmless but should be `noindex` if deployed.
- `v1/index.html` — legacy, missing favicon/apple-touch-icon. Old version page.

---

## Intentional — "problems we like" (no action)
- `letters/lower.mp3` 404 — guarded by `LIVE=false`, a door held for an unrendered song.
- `og-card.html` no title — OG share-image template, not a page.
- `fine_structure/.lake/...` missing CSS — Lean build cache, not deployed.
- `quantum-uptime` localhost:1370 — page content about the live server.
