# Current State

*Last updated: February 25, 2026*

---

## Architecture (Ground-Up Rewrite)

7-file modular codebase:

```
index.html          — Bootstrap, screens, HTML/CSS
js/sensor.js        — Accelerometer, gyroscope, touch, weather, time
js/brain.js         — Kalman filter, Fibonacci ring buffers, 7 LIF spiking neurons, void state machine
js/voice.js         — 13 synthesis engines, 6 audio layers, drums, touch phrases, motif melody, effects chain
js/lens.js          — 6 presets with full musical configuration + melodic DNA + per-lens synth assignments
js/organism.js      — Visual creature on canvas
js/app.js           — State machine (LISTEN → LENS → PLAY), main loop, touch velocity tracking
```

---

## The 6 Lenses

Each lens defines a complete musical universe — genuinely distinct synthesis, instruments, and character:

| Lens | Synth Engine | Pad Sound | Melody | Drums | Bass | Unique Features |
|------|-------------|-----------|--------|-------|------|-----------------|
| The Conductor | **Brass** (3 detuned saws + filter bite + delayed vibrato) | Sawtooth + vibrato (string ensemble, 3 voices) | Brass fanfare melody | Timpani + sparse percussion | Sub (orchestral) | dynamicFloor 0.3 = pianissimo when still, full roar in motion |
| The Blue Hour | **Electric Piano** (FM synthesis + tremolo, Rhodes character) | Triangle quartal voicing (dark, filtered) | Jazz epiano with chord voicings (3rd+7th shell) | Jazz ride cymbal + brushes | Walking bass (upright synth) | motifChord: true, ride patterns, swing feel |
| Gospel Sunday | Touch: **Organ** / Motif: **Choir** (formant vocal synthesis) | Sawtooth maj7 | Call (organ) and Response (vocal choir formant) | 808 kit with clap snare | 808 deep sub | Call-and-response: organ touch + choir melody, shuffle, sidechain |
| Tundra | **Plucked String** (noise excitation + resonant bandpass) | Sine low register (-1 oct, 600Hz) — WARM drone | Frozen harp plucks (octave 2) — CRISP contrast | None | None | Warm bed + crystalline plucks = counterintuitive warmth |
| Pocket Drummer | **FM Synthesis** (ratio 5, index 8 — metallic DnB stabs) | Triangle (dark, minimal, 500Hz filter) | Broken FM fragments (16th notes) | 808 polyrhythms (drumGain 2.2) | 808 clean sub | Metallic FM stabs, polyrhythmic patterns change per stage |
| Dark Matter | **Electric Piano** (cascading arpeggios through 52% delay) | Triangle add9 voicing | Cascading epiano arpeggios = In Rainbows texture | Acoustic (sparse, late) | 808 massive sub | saturation 0.4, FM through heavy delay = shimmering cascade |

---

## 13 Synthesis Engines

### Original 7
- **synthPiano**: Detuned triangle pair + 2x harmonic + hammer click noise transient
- **synthUpright**: Triangle + sine sub + formant at 700Hz + string buzz noise
- **synthOrgan**: 5 sine drawbar harmonics (1x-5.33x) + Leslie vibrato LFO
- **synthBell**: 5 inharmonic partials (1, 2.4, 4.1, 5.3, 6.7) + long decay
- **synthStab**: Square + sine through resonant LP sweep (Q=8, 6kHz→250Hz)
- **synthGlitch**: Random waveform + pitch drift LFO + tanh distortion
- **synthSimple**: Single oscillator fallback

### New 6
- **synthFM**: DX7-style FM synthesis. Carrier + modulator, ratio/index configurable per lens. Mod index envelope decays = bright metallic attack → warm sustain. Second carrier at 2x for overtone richness.
- **synthEPiano**: Rhodes/Wurlitzer. Two FM pairs (fundamental tine + octave bark), tremolo LFO at 4.8Hz. Warm, bell-like, with characteristic wobble.
- **synthPluck**: Physical model plucked string. Noise burst excitation through high-Q bandpass (resonant body) + second harmonic + triangle resonator for pitch stability. Harp/guitar/pizzicato.
- **synthBrass**: Cinematic brass section. 3 detuned sawtooths, slow filter attack (the "blat"), delayed vibrato that fades in after attack. The Zimmer sound.
- **synthSub808**: Chest-shaking 808 bass hit. Sine with 3x→1x pitch envelope, sub-octave, lowpass at 120Hz, 1.8s decay tail.
- **synthFormantNote**: Vocal synthesis. Sawtooth through parallel vowel formant bandpass filters (F1=700, F2=1100, F3=2400). Morph LFO shifts between "Ah" and "Oh". Sounds like a human voice.

---

## Touch Phrase System

`playTouchPhrase(tx, ty, vx, vy)` — velocity-aware touch interaction:
- **Fast movement** (speed > 1.5): Scalar runs of 3-5 notes ascending/descending in swipe direction
- **Medium movement** (speed > 0.5): Grace note + main note (ornament)
- **Slow/stationary**: Single sustained note
- Touch history tracking (last 8 notes) for future harmonic gravity
- Touch resonance bloom: playing a note briefly opens pad filter (sympathetic resonance)

App.js tracks touch velocity via `prevTouchX/Y/Time` → `touchVX/VY` calculation on touchmove.

---

## Dynamic Expression Systems

- **Whisper to Roar**: masterGain driven by totalMotion. `dynamicFloor` per lens (0.3 = intimate, 0.6 = always present)
- **Tension Arc**: Sustained energy compresses filter, stillness releases. Creates claustrophobia → relief cycle.
- **Organic Breathing**: Two LFOs at golden-ratio-offset frequencies (never exactly repeats) modulate pad/atmosphere/bass gains
- **Living Melody**: Energy-based note skipping (low energy = more silence), velocity scaling, octave doubling in TRANSCENDENT
- **Humanized Drums**: ±7ms timing offset, ±13% velocity variation per hit — no two hits identical

---

## Formant Choir Layer

`buildChoir(root, lens)` — not just filtered sawtooths, actual vocal synthesis:
- Parallel bandpass filters at vowel frequencies ("Ah": F1=750, F2=1150, F3=2400)
- Formant morph LFO slowly shifts vowel between "Ah" and "Oh"
- Configurable voicing intervals per lens (`choirVoicing`)

---

## Audio Pipeline

```
Oscillator layers → Per-layer filter → Per-layer gain → Breathing LFO → Sidechain gain → Saturator → Compressor → Master → Output
                                                    ↘ Reverb send → Convolver (lens-specific IR) → Master
                                                    ↘ Delay send → Delay → LP Filter → Feedback loop → Master
Drum bus (ride/timpani/kick/snare/hat) → Drum compressor → Master
Crackle → Master
Motif melody → synthesizeNote() → per-lens synth engine → same chain
Touch phrases → playTouchPhrase() → velocity-aware → per-lens synth engine → same chain
Walking bass → synthUpright() → sidechain + reverb
```

---

## What's Next

### Immediate
1. **Test on iPhone** — Verify each lens sounds genuinely different with new synth engines
2. **Fine-tune volumes/velocities** — Brass, FM, and epiano may need balancing after hearing on speakers
3. **Walking bass dynamics** — Blue Hour bass should respond to motion intensity

### Medium-term
4. **Microphone input** — onset detection, ambient awareness
5. **Natural language lens creation** — AI interprets artist descriptions into lens parameters
6. **Movement-only mode** — No screen, just body to sound
7. **Harmonic gravity** — Touch notes bend toward consonant intervals based on touch history

---

*"The goal is not to make something. The goal is to discover something that already exists."*

**Live at:** lacobusgump.github.io/music2.0/
