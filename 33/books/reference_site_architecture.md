---
name: Website Architecture Reference
description: How begump.com is served, file locations, JS systems, cache behavior. Essential for deployments.
type: reference
---

# Site Architecture

## Hosting
- **GitHub Pages** from `LacobusGump/music2.0` repo, `main` branch
- **Cloudflare CDN** in front (2hr cache TTL, `cf-cache-status: HIT`)
- **CNAME**: begump.com → GitHub Pages
- **Origin URL**: lacobusgump.github.io/music2.0/
- **License server only**: Cloudflare Tunnel to localhost:8890

## Deploying
1. `git push origin main` → GitHub Pages auto-builds (~30s)
2. Cloudflare cache may serve stale for up to 2 hours
3. **Cache busting**: use `?v=N` on JS file references (increment N on change)
4. **Verify from origin**: `curl -sL https://lacobusgump.github.io/music2.0/path`
5. **Purge cache**: Cloudflare dashboard → Caching → Purge Everything (if James has access)

## JS Systems
| File | Size | What | Loaded on |
|------|------|------|-----------|
| breathe.js?v=2 | 10KB | Universal page life: grain, warmth, brand font, motes, h2 glow, countup | 35 inner pages |
| gump-viz.js | 36KB | 7 renderers: couplingGraph, phaseCircle, kMeter, eigenWaterfall, damageMap, consonance, backbone | 3 research pages |
| transit.js | 7KB | Page transitions: dissolve + assemble | All pages |
| biofeedback.js | 10KB | Body coupling from phone sensors | Biofeedback toybox |

## Homepage (index.html) — self-contained
- Inline spectral engine: 29-node Kuramoto field
- Inline door visuals: atom, molecule, spiral canvases
- Inline black hole transit: Framework door special effect
- Does NOT load breathe.js (has its own visual system)
- Futura font applied directly in CSS

## Key Directories
- `/research/` — 16 studies + framework
- `/products/` — 13 products + index
- `/harmonia/` — AI interface (own visual system)
- `/toybox/` — interactive demos
- `/js/` — shared scripts
