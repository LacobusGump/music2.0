# The Engineer

**Role**: Master of code, architecture, and real-time systems. Makes it WORK.

---

## Current Architecture (BUILD 81)

Fully modular. No monolithic index.html — that was three versions ago.

```
index.html          — Bootstrap only. BUILD=81. Script tags with ?v=N cache busting.
js/sensor.js        — DeviceMotion, DeviceOrientation, touch events
js/brain.js         — Kalman filter, 7 LIF spiking neurons, ring buffers,
                       void state detection, Brain.short/medium/long energy APIs
js/audio.js         — v47: Web Audio graph, 13 synth voices, drum engines,
                       void drone (6 partials + 3 wind bands), spatial pan,
                       effects chain (reverb, delay, EQ, limiter)
js/follow.js        — v79: THE ENGINE. All musical logic.
js/lens.js          — v58: 7 lens configs (palette, harmony, space, response, motion, emotion)
js/organism.js      — Canvas visual: harmonic polar creature
js/app.js           — Main loop, state machine, wires Brain → Follow
```

### Web Audio Signal Chain
```
synths → sidechainGain → compressor → masterGain → masterHPF →
  eqLowShelf → eqMidPeak → eqHighShelf → masterLP → masterLimiter →
  spatialPanner → destination

voidGain → masterHPF    (CRITICAL: void bypasses masterGain — stays audible during silence)
drumCompressor → drumLP → masterHPF
```

### iOS Audio Rules (hard-won)
- AudioContext must be unlocked via user gesture (silent buffer on first tap)
- HTMLAudioElement.play() outside gesture handler = blocked on iOS
- Use fetch + decodeAudioData through existing AudioContext for voice files
- touchend (not touchstart) for gesture-triggered audio

---

## What's Working Well

- 60fps rAF loop handles everything on main thread — no Web Workers needed yet
- Device motion at ~60Hz, Kalman-filtered for smooth derivatives
- Brain.short.energy() / Brain.medium.energy() = key motion APIs used everywhere
- Per-lens groove DNA table drives drums independently from synth
- Cache busting: bump ?v=N on any JS file change, bump BUILD in index.html together

---

## Key Decisions Made This Session (March 2026)

### Autonomy Gates
All autonomous timer-based systems now check `Brain.short.energy()` before advancing:
- `updateHarmonicRhythm`: timer pauses when energy < 0.12
- `updateHarmonicGravity`: timer pauses when energy < 0.10
- `triggerCallResponse`: only fires when energy > 0.25
- `processAnswer`: cancels if user goes still (energy < 0.08 or isSilent)

**Why**: "music is finishing and playing more than I'm instigating" — music should only move when the body moves.

### Void Routing Fix
`voidGain.connect(masterHPF)` not `masterGain`. During silence, masterGain.gain fades to ~0 via `fadeGain`, which killed void audio. masterHPF is post-masterGain in the chain.

### Root Drift Killed
`ARC_JOURNEY = [0,0,0,0]` — was causing melody to chase upward by +7 semitones.
Epigenetic `rootSemiTarget` drift also disabled — same problem.
Do NOT re-enable these without careful thought.

### Melodic Energy Gate
Per-lens `melodicEnergy` (float) and `melodicMinDelta` (int) in lens.js response object.
`updateTiltPitch` checks `Brain.short.energy() >= melodicEnergy` before firing any note.
This is what makes lenses distinct — different minimum motion required.

### Grid Voice (synthGridStack in audio.js)
TikTok supersaw: root + minor 3rd + perfect 5th + minor 7th + octave.
Each interval has 2-3 detuned sawtooth copies. Resonant LP sweep 180→3800Hz over 50ms, Q=3.
7ms attack, 450ms decay. `noteInterval: 140` for tactile feel.

### Still Water Voice ('strings')
5-voice detuned oscillators + 5.2Hz vibrato LFO + slow bow swell.
Was 'mono' (triangle) before — sounded the same as Drift.

---

## Technical Debt / Pending

### Kick Drum Redesign
James flagged as "gross" and "makes or breaks every song." Currently deferred.
When we address this, need to understand WHAT is gross:
- Too clicky? (the click oscillator at 0.88 vel)
- No body? (the swept sine)
- Wrong per-lens kit? (acoustic/808/brushes/glitch all use similar synthesis)
This needs a dedicated session, not a parameter tweak.

### No Microphone Input
Long-term goal. Requires getUserMedia + onset detection.
Keep latency under 20ms or it breaks immersion.

---

## Performance Notes

- Everything on main thread — GC pauses are a real risk on mobile
- No setTimeout chains for audio — use AudioContext.currentTime scheduling
- NEVER use setInterval for audio — drift is audible
- Battery throttling on iPhone can reduce DeviceMotion rate — Brain adapts

---

## Deploy Checklist

1. Change JS file → bump `?v=N` on that script tag in index.html
2. Bump `BUILD` number in index.html
3. `git add -A && git commit -m "BUILD N: description"`
4. `git push` → GitHub Pages serves automatically
