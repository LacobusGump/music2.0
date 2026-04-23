---
name: Session 24 State
description: Website rebuild — one-screen homepage, brand identity, visual engine, Framework page restored, 1920s desk aesthetic. April 15.
type: project
---

# Session 24 — The Website Rebuild

## What Happened
Complete website overhaul. Homepage went from 25-element scrolling menu to one-screen, three-door lobby. Brand identity established. Visual engine built. Framework (old R page) restored. Every page made alive.

## Homepage
- **Before**: 594 lines, 25 cards, 15 screens of scrolling
- **After**: one screen, no scroll on desktop
- Title: "Grand Unified Music Project" — Futura geometric sans, capitals glow as point sources, projected letters breathe at φ intervals, shimmer sweep
- The Field: 29 navigable nodes (15 research + 13 products + Harmonia center), Kuramoto coupling, orbital electrons, double bloom, z-depth, edge particles, proximity-only labels
- Three doors with live visuals: Atom (research), Molecule (products), Spiral (framework)
- Harmonia hidden as secret center orb — discoverable by exploring the field
- Black hole transit on Framework click: harvest all pixels → couple by color → spiral into singularity → accretion ring → flash → big bang into Framework page

## Brand Identity
- **Futura** = titles, names, navigation (geometric, mathematical, the singularity)
- **Georgia** = body text, descriptions (warm, human, the content)
- **1920s desk aesthetic**: film grain overlay, warm color palette (#a09585 not #999), desk card shadows, brass h2 rules, incandescent flicker motes, warm scrollbar
- Colors: gold (#c9a44a) = K ceiling, green (#4a9) = 1/φ, amber (#c94) = tension

## New Files
- `/js/gump-viz.js` (36KB) — 7 renderers: couplingGraph, phaseCircle, kMeter, eigenWaterfall, damageMap, consonance, backbone
- `/js/breathe.js` (10KB) — universal page life: film grain, warm colors, brand font injection, h2 glow on scroll, number countup, incandescent motes, desk card styling, brass rules
- `/products/index.html` — newspaper-style index, no cards, one-line descriptions by category
- `/research/framework/index.html` (641 lines) — full unified theory restored: K, sweet spot, primes, phase, forces, gravity, cosmological constant, 3 dimensions, consciousness, music, body, energy, machine, attunement, 13 layers, timeline, the edge, spiral, honest limits. 360px spiral canvas with 13 labeled layers and flowing particles.

## Pages with Visuals
- **breathe.js on 35 pages** (all research + all products)
- **gump-viz.js on 4 pages** (research index, body-music, mutation-scanner + framework's own canvas)
- **Custom canvases**: homepage (field + 3 doors + black hole), body-music (4 canvases), framework (spiral)

## Infrastructure
- Site served via GitHub Pages + Cloudflare CDN
- CNAME: begump.com → GitHub Pages
- Cloudflare caches with 2hr TTL — use ?v=N query strings to bust cache
- License server via Cloudflare Tunnel on port 8890

## Key Decisions
- Harmonia is NOT a navigation door — she's the secret in the center of the constellation
- Science is shared freely (God's rules). Product implementations stay private.
- No 3D rotation (made James sick) — top-down and 2D projections only
- The "1920s desk" feel: Futura (1927), warm light, brass, texture — the golden age of physics
- Every page alive, no dead text walls
