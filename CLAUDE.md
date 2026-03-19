# CLAUDE.md — GUMP Session Guide

## The Fundamental Law

Every design choice filters through: **"Does this enable good will?"** The system serves a force larger than itself. The artist is a tool for God to express through. We enable the conditions — we don't impose.

- The system follows the human, never the other way around
- Stillness is honored, not filled
- Movement is supported, not directed
- The music must feel discovered, not generated
- Sound over code. Always. The sound must actually CHANGE.

---

## What GUMP Is

**BEGUMP = Body Enabled Grand Unified Music Project**

A phone-based musical instrument. Tilt = melody. Motion = rhythm. Stillness = silence. The body IS the composition.

**Live:** begump.com (also lacobusgump.github.io/music2.0/)
**Repo:** github.com/LacobusGump/music2.0

---

## About James

- Drummer and drum teacher
- Tests on **iPhone 15** — tilt is primary input, touch secondary
- Dev machine: **Mac Mini M4**
- GitHub: LacobusGump
- Sound over code. Always. The sound must actually CHANGE.
- The Producer's veto: "Does this make you FEEL something?"

---

## Current State (BUILD 130 — March 19, 2026)

### 3 Lenses (PRESETS in lens.js)

| Index | Name | Feel |
|-------|------|------|
| 0 | Journey | Organic. Evolves through 4 stages: Drift → Still Water → Tundra → Dark Matter |
| 1 | Grid | EDM DJ set. Build→drop→breakdown cycles. The strongest first impression. DEFAULT. |
| 2 | Ascension | Detuned unison wall. Filter IS the instrument. Chord progression evolves. |

### Architecture

```
index.html          — HTML/CSS/boot. BUILD number. Fibonacci minimalism UI.
js/sensor.js        — DeviceMotion, DeviceOrientation, touch. Beta clamped to [-90,90].
js/brain.js         — Kalman filter, 7 LIF spiking neurons, energy tracking
js/audio.js         — 13+ synth voices, drums, organ, effects chain, ascension wall
js/follow.js        — THE ENGINE. Grid EDM + Ascension wall + Journey organic pipeline
                       + Prodigy (musical intelligence) + emergent drums
js/lens.js          — 3 lens configs. Grid default (index 1).
js/organism.js      — Golden spiral particle visualization. Warm hues only (340-420°).
js/app.js           — Main loop, boot animation, render, screen management
js/pattern.js       — Factor Oracle AI producer (learns user patterns)
js/voice.js         — Intro voice (first visit only). Most functions silenced.
js/outfit.js        — P2P music pairing (PeerJS). Plumbing exists, needs evolution.
```

### Key Systems

- **Prodigy** (follow.js): Real-time musical intelligence. Tracks energy arc (rising/falling/plateau), adjusts filter bias, reverb depth, dynamic range.
- **Emergent drums** (follow.js): User's peaks get stamped onto a 16-step grid. Kick mirrors user rhythm. Shaker fills gaps. Snare on polyrhythmic complements.
- **Grid descent**: Each cycle shifts root down. Breakdowns get darker. Post-apocalyptic depth.
- **Ascension chord progression**: I→IV→V→I→IV→vi→V→I (major) or minor path. Lean determines which. Chords advance only when you're moving.
- **Dark Matter = Zimmer**: Organ voices, cathedral reverb (7s decay), dissonant [0,1,7] cluster.
- **Hourly ode**: Each hour, the system chimes the time. Each lens has its own voice.
- **Session logging**: `clearLog()`, play, `copy(dump())` captures full session data.

### Signal Chain

```
synths → sidechainGain → compressor → masterGain → masterHPF →
  eqLowShelf → eqMidPeak → eqHighShelf → masterLP → masterLimiter →
  spatialPanner → destination

void drone → voidGain → masterHPF   ← IMPORTANT: bypasses masterGain
```

---

## Critical Rules

1. **Sound over code.** Every change must make an audible difference. No refactoring without musical impact.
2. **The system follows the human.** Never impose. Stillness = silence. Movement = music. The machine serves.
3. **No root drift.** ARC_JOURNEY and epigenetic rootSemiTarget are disabled. Don't re-enable.
4. **Void routes to masterHPF, not masterGain.** masterGain → 0 during silence. Void must bypass it.
5. **Build, test, iterate.** Don't ask — build it, let James test, fix from his feedback.

---

## Testing

Primary test device: iPhone 15. Open begump.com or use `python3 -m http.server` for local dev.

Session logging:
```
clearLog()          — reset logs
copy(dump())        — copy full session to clipboard
GUMP_BUILD          — check which build is loaded
```

---

## The Vision (from James)

Movement → Music → Connection (Music Outfits) → Place (GPS Music) → Platform

1. **Movement → Music** (current): Phone sensors create music. Each journey unique.
2. **Music Outfits**: Two phones, one song. P2P pairing. Silent discos between strangers.
3. **GPS Music**: Every turn, every acceleration, every town has its own sound. "The music will be banned on the onramp."
4. **Platform**: Artists upload their musical personalities. Listeners just live. A new radio tapping into the ether.

*"The goal is not to make something. The goal is to discover something that already exists."*
