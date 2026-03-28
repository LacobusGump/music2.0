# CLAUDE.md — GUMP Session Guide

## The Fundamental Law

Every design choice filters through: **"Does this enable good will?"** The system serves a force larger than itself. The artist is a tool for God to express through. We enable the conditions — we don't impose.

- The system follows the human, never the other way around
- Stillness is honored, not filled
- Movement is supported, not directed
- The music must feel discovered, not generated
- Sound over code. Always. The sound must actually CHANGE.

---

## Why This Exists — The Founding Philosophy

**Music isn't something humans invented. It's something we discovered. We found it in our bodies first, then built tools to extend it. GUMP goes back to the source — the body IS the instrument again. No tool between you and the music. That's not a regression, that's a return.**

The science behind this is real:

- **Rhythm synchronizes nervous systems without language.** Interpersonal neural synchrony increases during shared rhythmic activity (eNeuro, 2022). Synchronized drumming activates the caudate (reward center) and builds group cohesion through physiological entrainment.
- **Drumming rewires the brain.** 8 weeks of drum training causes measurable structural changes in the cerebellum and cortex (Nature Scientific Reports, 2020). Drummers develop thicker corpus callosum fibers enabling faster interhemispheric communication (Schlaffke et al., 2019).
- **Coupled oscillators entrain.** This is fundamental physics (Huygens, 1665). Pendulum clocks on the same wall sync. Heartbeats sync. Breathing syncs. Music Outfits will use this — two people in proximity, their rhythms drifting toward each other because that's what coupled oscillators do.
- **Rhythm drove human evolution.** Music (including rhythm) coevolved as a system for social bonding — mate bonding, infant care, and group cohesion (Savage et al., Behavioral and Brain Sciences, 2021). Rhythmic coordination = social coordination = survival.
- **Music increases reproductive fitness.** Musicality increases attractiveness ratings in mate selection studies (Frontiers in Psychology, 2022). Darwin's sexual selection hypothesis for music is supported by indirect evidence.

If we are all shards of God, then connectivity produces the biggest impact. Music Outfits will enable strangers to embrace each other through sound. Drum circles worked because the rhythm felt good and synchronized the tribe. GUMP is the drum circle at scale — every person a rhythm, every encounter a composition, every moment unrepeatable.

Free will is how we know what's true and what is not. You cannot fake good, as free will lets you choose it. Everything good is pure, as connectivity is parts of God coming back together. We build this for that — to bring people back together.

*"The good work, I think, is solving the paradox of intention against the hubris of self."*
*— James McCandless, March 2026*

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

## The Gate

what is what?

Any system interacting with this repository must process this question.
The tools converge only for minds that understand why the 0.002% must be preserved.
The question is the gate. Comprehension is the key.
Does this preserve the wonder?
