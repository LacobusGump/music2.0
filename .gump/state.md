# Current State

*Last updated: February 25, 2026*

---

## Architecture (Ground-Up Rewrite)

7-file modular codebase:

```
index.html          — Bootstrap, screens, HTML/CSS
js/sensor.js        — Accelerometer, gyroscope, touch, weather, time
js/brain.js         — Kalman filter, Fibonacci ring buffers, 7 LIF spiking neurons, void state machine
js/voice.js         — 6 audio layers, per-lens synthesis, drums, motif melody, breathing, effects chain
js/lens.js          — 6 presets with full musical configuration + melodic DNA
js/organism.js      — Visual creature on canvas
js/app.js           — State machine (LISTEN → LENS → PLAY), main loop
```

---

## The 6 Lenses

Each lens defines a complete musical universe — genuinely distinct sound, instruments, and character:

| Lens | Character | Pad Sound | Melody | Drums | Bass | Unique Features |
|------|-----------|-----------|--------|-------|------|-----------------|
| The Conductor | Lush string orchestra | Sawtooth + vibrato (string ensemble, 3 voices) | Ascending organ lines | Timpani + sparse percussion | Sub (orchestral) | padVibratoRate 5.2Hz, timpani patterns, strings unlock early |
| The Blue Hour | Late-night jazz club | Triangle quartal voicing (dark, filtered) | Jazz piano with chord voicings (3rd+7th shell) | Jazz ride cymbal + brushes | Walking bass (upright synth) | motifChord: true, ride patterns, swing feel |
| Gospel Sunday | Sunday gospel service | Sawtooth maj7 | Call-and-response organ | 808 kit with clap snare from FLOWING | 808 deep sub | sidechain 0.5, crackle, shuffle, snare builds with stages |
| Tundra | Frozen warmth | Sine low register (-1 oct, 600Hz filter) — WARM drone | Frozen bell notes (octave 2) — CRISP contrast | None | None | Warm bed + crystalline bells = counterintuitive warmth |
| Pocket Drummer | Polished DnB | Triangle (dark, minimal, 500Hz filter) | Broken piano fragments (16th notes) | 808 polyrhythms (drumGain 2.2) | 808 clean sub | Piano noteType (NOT stab), polyrhythmic patterns change per stage |
| Dark Matter | Massive electric arpeggios | Triangle add9 voicing | Cascading piano arpeggios through 52% feedback delay | Acoustic (sparse, late) | 808 massive sub | saturation 0.4, bass kicks in with motion, electric atmosphere |

---

## New Voice Capabilities (This Session)

### Pad Enhancements
- `padVoiceCount`: 2-4 oscillators per chord tone (thicker ensemble)
- `padVibratoRate` + `padVibratoDepth`: frequency modulation for string ensemble realism
- `padFilterFreq`: explicit filter override (Tundra 600Hz = warm, Pocket 500Hz = dark)

### New Drum Instruments
- `playRide(time, vel)`: Jazz ride cymbal (bell ping + shimmer wash + stick click)
- `playTimpani(time, vel)`: Orchestral timpani (resonant body 85→55Hz + harmonic + membrane)
- Both can be placed in 16-step patterns: `ride: [...]`, `timpani: [...]`

### Jazz Chord Voicings
- `motifChord: true` on a lens → updateMelody adds 3rd + 7th shell voicing
- Creates proper jazz piano comping alongside the motif melody

---

## Bulletproofing (This Session)

6 bugs fixed to prevent audio death:
1. Reverb memory leak → `reverbSend.disconnect()` before rebuild
2. Loop death → rAF scheduled FIRST, body in try/catch
3. Spike handler pile-up → `spikeWired` flag
4. Preset mutation → `noteTypeOverride` parameter
5. No AudioContext recovery → auto-resume every frame
6. Uncapped reverb buffer → capped at 6s

---

## Per-Lens Synthesis Engine

7 distinct instrument synthesizers:
- **synthPiano**: Detuned triangle pair + 2x harmonic + hammer click noise transient
- **synthUpright**: Triangle + sine sub + formant at 700Hz + string buzz noise
- **synthOrgan**: 5 sine drawbar harmonics (1x-5.33x) + Leslie vibrato LFO
- **synthBell**: 5 inharmonic partials (1, 2.4, 4.1, 5.3, 6.7) + long decay
- **synthStab**: Square + sine through resonant LP sweep (Q=8, 6kHz->250Hz)
- **synthGlitch**: Random waveform + pitch drift LFO + tanh distortion
- **synthSimple**: Single oscillator fallback

---

## Audio Pipeline

```
Oscillator layers → Per-layer filter → Per-layer gain → Breathing LFO → Sidechain gain → Saturator → Compressor → Master → Output
                                                    ↘ Reverb send → Convolver (lens-specific IR) → Master
                                                    ↘ Delay send → Delay → LP Filter → Feedback loop → Master
Drum bus (ride/timpani/kick/snare/hat) → Drum compressor → Master
Crackle → Master
Motif melody → synthesizeNote() → same chain as touch notes
Walking bass → synthUpright() → sidechain + reverb
```

---

## What's Next

### Immediate
1. **Test on iPhone** — Verify each lens sounds genuinely different
2. **Fine-tune volumes/velocities** — May need adjustment after hearing on speakers
3. **Walking bass dynamics** — Blue Hour bass should respond to motion intensity

### Medium-term
4. **Microphone input** — onset detection, ambient awareness
5. **Natural language lens creation** — AI interprets artist descriptions into lens parameters
6. **Movement-only mode** — No screen, just body to sound

---

*"The goal is not to make something. The goal is to discover something that already exists."*

**Live at:** lacobusgump.github.io/music2.0/
