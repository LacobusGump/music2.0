# CLAUDE.md - Session Instructions for GUMP

## What This Is

GUMP (Grand Unified Music Project) is an experimental musical instrument that creates music from physical experience - phone sensors, touch, and eventually sound input.

**Live demo**: lacobusgump.github.io/music2.0/

---

## How to Work on This Project

### First: Read the Minds

Before doing anything, read the `.gump/` directory:

```
.gump/
  vision.md     ← The north star - what we're building
  engineer.md   ← Technical perspective and priorities
  musician.md   ← Musical perspective and theory
  physicist.md  ← Mathematical/physics perspective
  producer.md   ← THE FOURTH MIND - artistry, soul, essence (Rick Rubin inspired)
  dialogue.md   ← Ongoing conversation between the four minds
  state.md      ← Current state, what's next, open questions
```

These files ARE the project memory. They persist across sessions.

### Second: Become the Four Minds

When working on GUMP, think from four perspectives:

1. **THE ENGINEER** - "How do we build it? What are the constraints? What's the fastest path to working code?"

2. **THE MUSICIAN** - "Does it sound good? Does it feel musical? What's the emotional arc?"

3. **THE PHYSICIST** - "What's the underlying structure? Is there a mathematical model that captures this better?"

4. **THE PRODUCER** - "Does this make you FEEL something? What can we REMOVE? Where is the SOUL?"

The Producer is the final arbiter. If it doesn't make you feel something, the other three minds have failed.

Let them argue. Let them propose. The best solutions come from their intersection.

### Third: Update as You Go

When you make progress:
- Update `state.md` with what changed
- Add to `dialogue.md` if there's a significant design decision
- Update individual agent files if their perspective evolved

### Fourth: Push to GitHub

Every session should end with:
```bash
git add -A
git commit -m "Descriptive message

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
git push
```

The repo is at: github.com/LacobusGump/music2.0

---

## Code Structure

Currently everything is in `index.html` (~710 lines). Key sections:

- **STATE** (lines ~27-56): Field position, energy, stillness, harmony
- **MUSIC THEORY** (lines ~58-102): Scales, chords, frequency calculations
- **RHYTHM** (lines ~104-136): Purdie shuffle pattern, BPM, subdivisions
- **AUDIO** (lines ~138-206): Web Audio setup, reverb, delay
- **DRUMS** (lines ~208-319): Kick, snare, hat synthesis
- **MELODY** (lines ~321-368): Continuous voice that follows movement
- **BLOOMING NOTES** (lines ~370-453): Chord tones that spawn from stillness
- **FIELD SHAPING** (lines ~455-494): How input affects musical state
- **RHYTHM ENGINE** (lines ~496-522): Clock and trigger system
- **INPUT** (lines ~524-546): Touch, motion, orientation handlers
- **VISUALS** (lines ~548-640): Canvas rendering
- **LOOP** (lines ~642-661): Main update cycle

---

## Key Design Principles

1. **Real-time is sacred** - Latency under 15ms or it feels broken
2. **The body knows music** - Map gestures to musical intent, not just parameters
3. **Emergence over composition** - Create conditions for music, don't dictate it
4. **Simple inputs, complex outputs** - Anyone can play, masters can explore

---

## Current Priorities

Check `state.md` for the latest, but likely:
1. Gesture detection (buffer accelerometer data, recognize patterns)
2. Harmonic gravity (pitch bends toward consonance)
3. Microphone input (start with onset detection)

---

## Testing

Open `index.html` in a browser. On mobile, you'll need HTTPS (use GitHub Pages or local server with SSL).

For local development:
```bash
npx serve .
# or
python -m http.server
```

Then access via local IP on phone for sensor testing.

---

## Remember

This isn't just a coding project. It's an exploration of how music can emerge from human experience.

The four minds exist to prevent tunnel vision:
- Engineer alone builds something that works but sounds bad
- Musician alone designs something beautiful but impossible
- Physicist alone creates elegant math that nobody can play
- **Producer alone asks: "But does it make you FEEL something?"**

The Producer has veto power. Technical excellence means nothing if there's no soul.

**The E=mc² of GUMP:**
```
gesture → phrase → resolution
```

Everything else serves this core loop.

---

*"The goal is not to make something. The goal is to discover something that already exists."* — The Producer

---

## About James

- Drummer and drum teacher. Music is deeply personal, not a side project.
- Tests on **iPhone 15** — motion/tilt is the primary input, touch is secondary.
- **Two dev machines**:
  - HP Laptop 14-cf2xxx (Windows, 64GB eMMC — tight on space, has a microSD slot for overflow)
  - 2013 MacBook Air (Intel SSD, freshly reinstalled macOS as of Feb 2023)
- GitHub: LacobusGump
- Prefers humble naming — no "REBIRTH" or grandiose titles. Just version numbers.
- Has been at this for months. Gets frustrated when sessions produce code cleanup instead of musical transformation. The sound must actually CHANGE, not just the code structure.
- The Producer's veto is real: "Does this make you FEEL something?" If moving the phone doesn't feel like playing an instrument, we've failed.

## Current State (BUILD 82 — March 13, 2026)

- **BUILD 82** — follow.js v80, audio.js v48, lens.js v59
- **7 lenses**: The Conductor, Blue Hour, Drift, Tundra, Still Water, Dark Matter, Grid
- **Grid EDM Engine**: BYPASSES organic pipeline. Fixed 128bpm clock, layer stacking, filter sweeps, user-triggered drops. Phase machine: intro→build→drop→breakdown cycle.
- **New 808 kick**: 4-layer (click + body + sub tail + saturation). Sub tail IS the bass.
- **Three-act arc**: 0-90s sparse → 90-300s sus4 floating → 300s+ home + sub voices (other 6 lenses)
- **Deceptive cadence tension arc** (Tundra + Still Water): V→VI near-misses, then BOOM V→I
- **Autonomy gates**: harmonic rhythm/gravity/call-response all wait for Brain.short.energy()
- **Melodic energy gate**: per-lens minimum motion to fire tilt melody — lenses are now distinct
- **Grid supersaw**: TikTok harmonic stacking (root + m3 + P5 + m7 + oct), resonant sweep
- **Still Water**: strings voice with vibrato (was mono triangle = same as Drift)
- **Void**: 6 cosmic partials + 3 wind bands, smooth voidPresence, routes to masterHPF
- **Kick on peaks**: fires without tempoLocked (James tilts, doesn't bounce)
- **Reference**: commit `88d4c32` (G7 Fly) had great motion feel — study if motion goes dead
- **Read `.gump/` FIRST** — especially `state.md`, `musician.md`, `dialogue.md`

## Code Structure (BUILD 82)

```
index.html          — Bootstrap, HTML/CSS, BUILD number (must match follow.js version)
js/sensor.js        — DeviceMotion, DeviceOrientation, touch
js/brain.js         — Kalman filter, 7 LIF neurons, Brain.short/medium/long.energy()
js/audio.js         — v48: 13 synth voices + EDM synths, 808 rewrite, drums, void drone, effects chain
js/follow.js        — v80: THE ENGINE. Grid EDM state machine + organic pipeline for other 6 lenses.
js/lens.js          — v59: 7 lens configs (Grid now has edm{} sub-object)
js/organism.js      — Visual: harmonic polar creature on canvas
js/app.js           — Main loop, state machine
```

**CRITICAL routing**: `voidGain.connect(masterHPF)` not `masterGain`. masterGain → 0 during silence. Void must bypass it.

**DO NOT re-introduce**: root drift via ARC_JOURNEY or epigenetic rootSemiTarget — caused melody to chase upward indefinitely.
