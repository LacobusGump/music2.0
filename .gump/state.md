# Current State

*Last updated: March 14, 2026 — BUILD 99*

---

## What GUMP Is Right Now

A modular, phone-based musical instrument. Tilt = melody. Motion = rhythm. Stillness = silence. The body IS the composition.

**Live:** lacobusgump.github.io/music2.0/

---

## Architecture

```
index.html          — Bootstrap, screens, HTML/CSS. BUILD number lives here.
js/sensor.js        — Accelerometer, gyroscope, touch
js/brain.js         — Kalman filter, 7 LIF spiking neurons, void state, energy
js/audio.js         — v53: 13 synth engines + EDM synths, 808 kick rewrite, drums, void drone, EQ, effects chain
js/follow.js        — v88: THE ENGINE. Body → music. Journey (organic stage evolution) + Grid (EDM).
js/lens.js          — v59: 7 timbral palettes (The Conductor, Blue Hour, Drift,
                           Tundra, Still Water, Dark Matter, Grid)
js/organism.js      — Visual: harmonic polar creature on black canvas
js/app.js           — State machine, main loop, wires sensors → Follow
```

**Script versions in index.html must match actual files. When deploying, bump ?v=N on the changed file AND bump BUILD in index.html.**

---

## Signal Chain (audio.js)

```
synths → sidechainGain → compressor → masterGain → masterHPF →
  eqLowShelf → eqMidPeak → eqHighShelf → masterLP → masterLimiter →
  spatialPanner → destination

drums → drumCompressor → drumLP → masterHPF (merges here)

void drone → voidGain → masterHPF   ← IMPORTANT: bypasses masterGain
                                       so void plays during silence
```

---

## The 7 Lenses

Each lens: harmony (root + mode), palette (voice assignments), space (reverb/delay), response (thresholds), motion (primary driver), emotion (tension arc, phrase shape), groove (drum DNA).

| Lens | Mode | Continuous Voice | Peak Voice | Feel |
|------|------|-----------------|------------|------|
| Journey | evolves | mono→strings→piano→fm | piano→reverse | Organic, evolving |
| Grid | phrygian | gridstack (supersaw) | massive | EDM/tactile |

**Journey stages** (each ~2.5min, 30s crossfade):
1. Drift: dorian, mono triangle, intimate piano
2. Still Water: lydian, strings (vibrato), flowing
3. Tundra: picardy, sparse piano, vast silence
4. Dark Matter: phrygian, reverse/FM, glitch groove

**melodicEnergy per lens** — minimum Brain.short.energy() to fire tilt melody:
- Conductor: 0.9 (almost disabled — peaks only)
- Grid: 0.45
- Drift: 0.12
- Tundra: 0.38 + melodicMinDelta:2
- Still Water: 0.18
- Dark Matter: 0.55

**tensionArc: true** on Tundra and Still Water — deceptive cadence Zimmer technique.

---

## Key Systems in follow.js

### Three-Act Musical Arc (checkActAdvance)
- Act I (0-90s engaged): Original mode, sparse
- Act II (90-300s): Sus4 — scale[2] = scale[3], the 3rd replaced by 4th → floating/unresolved
- Act III (300s+): Home mode restored + parallel sub-octave peak voice

`sessionEngagedTime` only counts active (non-silent) play.

### Deceptive Cadence Tension Arc (updateTensionArc)
Tundra + Still Water only. State machine: idle → building → near-miss → resolving → cooldown.
- Near-miss: V bass note → 2.2s → VI (not I) = "almost"
- Each miss tightens reverb. After 3 misses: V → I in three registers simultaneously = BOOM
- Cooldown: 40s before repeating

### Harmonic Gravity (updateHarmonicGravity)
Bass-only V→I cadence. Timer advances ONLY when Brain.short.energy() > 0.10.
After 18-26s of active play: V bass note announced → 8-12s → V→I resolution.

### Harmonic Rhythm (updateHarmonicRhythm)
Foundation bass walks I→IV/V→I every 8-16s. Timer only advances when energy > 0.12.
Fires double bass notes (octave -1 AND -2) for physical depth.

### Melodic Energy Gate (updateTiltPitch)
Per-lens minimum motion required to fire tilt melody. Stops the "continuous keyboard lead"
that made all lenses sound the same. Each lens has distinct melodic behavior.

### Void System (updateVoid)
`voidPresence` (0→1) builds during stillness (8s to full), decays on motion.
- Fast exit (rate 0.018) when energy > 0.6, slow exit (0.007) for gentle re-entry.
- 6 cosmic partials with independent amp + pitch LFOs (rolling sea effect)
- 3 wind bands (160/600/2200Hz) with amplitude LFOs
- Void routes to masterHPF, NOT masterGain — plays during silence.

### Autonomy Gates (BUILD 81)
Music waits for YOU. All autonomous timer systems check Brain.short.energy():
- harmonic rhythm: pauses at < 0.12
- harmonic gravity: pauses at < 0.10
- call & response: only triggers at > 0.25, cancels if user goes still

### Peak Kick (no tempo lock required)
James tilts, doesn't bounce — tempoLocked may never fire for him.
Peak kick fires on every significant motion peak without requiring tempo lock.

---

## What's Working

- Tilt → melody with per-lens character
- Motion → rhythm with per-lens groove DNA
- Stillness → real silence (not quiet drone)
- Void: cosmic sea of sound during deep stillness
- Three-act arc evolving over session
- Deceptive cadence tension build for Tundra + Still Water
- 7 lenses each feel distinct (different voices, melodic energy, groove)
- Grid: TikTok supersaw with resonant sweep (360ms decay)
- Still Water: strings voice with vibrato (confirmed by James: "much better")
- Spatial: gentle tilt pan ±0.22, no LFO, left=left right=right
- Foundation bass: doubled at -1 and -2 octaves
- Voice files in gump/voice/ (ElevenLabs) — see CLAUDE.md for full list
- **Grid EDM Engine (BUILD 82)**: Full bypass of organic pipeline. Fixed 128bpm clock.
  Tilt = LP filter cutoff (DJ knob). Motion energy = layer stacking. Peak = trigger drop.
  Phase machine: intro → build → drop → breakdown → build cycle.
  New 808 kick: 4-layer (click + body + sub tail + saturation).
  New synths: riser, impact, edmSub, edmPad. API: setMasterFilter, setSidechainDepth.

---

## Open / Pending

### Kick Drum (HIGH PRIORITY — deferred)
James said "kick is gross and makes or breaks every song." Explicitly deferred to a dedicated
session. DO NOT just tweak parameters — this needs a proper redesign conversation.
Reference: what specifically is "gross" (too clicky? no body? wrong kit per lens?).

### Lens Distinctiveness (ongoing)
Melodic energy gate was the primary fix for "all lenses have the same keyboard lead."
May need deeper pass — Conductor should NEVER do tilt melody (only peaks), Blue Hour
conversations should happen in silences, Tundra restraint is the entire point.

### Music Too Autonomous (partially fixed BUILD 81)
Energy gates help. But harmonic rhythm and gravity still fire on timers even if light movement.
If still feels too autonomous: consider raising minimum energy thresholds or adding
`phraseActive` check so chord walks only happen mid-phrase.

---

## Testing

Open index.html in browser. On mobile: needs HTTPS (GitHub Pages works).
Local dev: `npx serve .` then access via local IP on phone.

Primary test device: iPhone 15 (James). Tilt is primary input, touch secondary.

---

## Key Historical Context

- Commit `88d4c32` (G7 Fly) had great motion feel — study if motion ever feels dead
- DO NOT re-introduce root drift (ARC_JOURNEY) — was causing melody to chase up indefinitely
- DO NOT re-enable epigenetic rootSemiTarget drift — same problem
- Spatial LFO was killed — was causing random pan jumps. Tilt-only pan now.
- voidGain MUST connect to masterHPF not masterGain (masterGain → 0 during silence)
