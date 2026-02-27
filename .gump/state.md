# Current State

*Last updated: February 25, 2026*

---

## Architecture (Ground-Up Rewrite)

7-file modular codebase:

```
index.html          — Bootstrap, screens, HTML/CSS
js/sensor.js        — Accelerometer, gyroscope, touch, weather, time
js/brain.js         — Kalman filter, Fibonacci ring buffers, 7 LIF spiking neurons, void state machine
js/voice.js         — 6 audio layers, per-lens synthesis, drums, effects chain, gesture responses
js/lens.js          — 6 artist presets with full musical configuration
js/organism.js      — Visual creature on canvas
js/app.js           — State machine (LISTEN → LENS → PLAY), main loop
```

---

## The 6 Lenses

Each lens defines a complete musical universe:

| Lens | Character | Instrument | Drums | Feel |
|------|-----------|------------|-------|------|
| The Conductor | Full orchestral build | Simple triangle | Acoustic | Straight |
| Charlie Parker in Paris | Jazz voicings, walking bass | Piano (touch) / Upright (auto) | Brushes (late) | Swing |
| Gospel Sunday | 808 sub, warm organ, deep pump | Organ (drawbar harmonics) | 808 kit | Shuffle |
| Tundra | Glacial ambient, infinite space | Bell (inharmonic partials) | None | Rubato |
| Pocket Drummer | Drums dominate, lo-fi | Stab (resonant filter) | 808 (loud, DnB) | Swing |
| Dark Matter | Chromatic tension, alien | Glitch (distorted, unstable) | Glitch | Straight |

---

## Per-Lens Synthesis Engine

6 distinct instrument synthesizers:
- **synthPiano**: Detuned triangle pair + 2x harmonic + hammer click noise transient
- **synthUpright**: Triangle + sine sub + formant at 700Hz + string buzz noise
- **synthOrgan**: 5 sine drawbar harmonics (1x-5.33x) + Leslie vibrato LFO
- **synthBell**: 5 inharmonic partials (1, 2.4, 4.1, 5.3, 6.7) + long decay
- **synthStab**: Square + sine through resonant LP sweep (Q=8, 6kHz->250Hz)
- **synthGlitch**: Random waveform + pitch drift LFO + tanh distortion

---

## Audio Pipeline

```
Oscillator layers → Per-layer filter → Per-layer gain → Sidechain gain → Saturator → Compressor → Master → Output
                                                    ↘ Reverb send → Convolver (lens-specific IR) → Master
                                                    ↘ Delay send → Delay → LP Filter → Feedback loop → Master
Drum bus → Drum compressor → Master
Crackle → Master
```

---

## Evolution Stages

Driven by `totalMotion` flywheel (accumulated movement over time):

```
EMERGING (0)        → Pad + atmosphere, light autoplay
FLOWING (100)       → +Bass, more layers unlock, root shifts up 5th
SURGING (400)       → +Strings, drums fill out, +5th again
TRANSCENDENT (800)  → +Choir/shimmer, full expression, +5th
```

---

## Motion Pipeline

Three-source motion input (fixed for desktop/iOS-without-accelerometer):
1. **Accelerometer**: Kalman filtered, gravity subtracted
2. **Touch drag velocity**: `(delta * 25)` injected into linear acceleration
3. **Tilt rate**: `(delta * 0.15)` injected into linear acceleration

All feed into: magnitude → Fibonacci ring buffers (5, 34, 233, 1597) → 7 LIF spiking neurons → void state machine → pattern classifier

---

## iOS Permission Handling (Fixed)

- Motion/orientation requested via `Promise.all` (simultaneous, not chained)
- Weather/geolocation deferred AFTER motion permissions resolve
- `retryPermissions()` called on every user gesture (touch/click)
- Visible red help banner if denied with Safari fix instructions
- Permission state tracked and shown in debug panel

---

## Recent Session (Feb 25, 2026)

### Fixed
1. **Gesture response "blinko" sound**: Old system fired 6-8 bare oscillator notes per brain spike with no cooldown, drowning everything. Replaced with 3 quieter functions using per-lens synthesis, 400ms global cooldown, max 3 notes.
2. **Charlie Parker mix balance**: Bass drone was 0.5 (dominant constant tone) drowning walking bass notes at 0.15 velocity. Fixed: drone → 0.10, walking bass vel → 0.25, autoplay density → 0.85 for consistent walking feel.
3. **Per-lens instrument presence**: Piano attack boosted 1.5x, organ brightened with gospel quint, bell partials enriched, stab filter sweep made more aggressive.
4. **Touch note velocity**: Boosted from 0.18 to 0.25 base across all lenses.

### Previously Fixed This Session
- iOS motion permissions (Promise.all, deferred weather, retry on gesture)
- Touch/tilt injection into brain motion pipeline
- Per-lens note synthesis system (6 instruments)
- Style-aware autoplay (walking/sparse/arpeggio/random)
- Autoplay swing timing for jazz/shuffle feels

---

## What's Next

### Immediate
1. **Test on iPhone** — Verify the blinko fix and mix balance make jazz piano audible
2. **Test all 6 lenses** — Confirm each sounds genuinely different
3. **Pocket detection** — Phone-in-pocket mode (walking rhythm)

### Medium-term
4. **Microphone input** — onset detection, ambient awareness
5. **Natural language lens creation** — AI interprets artist descriptions into lens parameters
6. **Movement-only mode** — No screen, just body to sound

---

*"The goal is not to make something. The goal is to discover something that already exists."*

**Live at:** lacobusgump.github.io/music2.0/
