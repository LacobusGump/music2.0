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

Each lens defines a complete musical universe with its own motif (melodic DNA):

| Lens | Character | Instrument | Motif | Drums | Feel |
|------|-----------|------------|-------|-------|------|
| The Conductor | Organ swells, cathedral | Organ (sustained) | Ascending organ lines — reaching, resolving | Acoustic (quiet) | Straight |
| The Blue Hour | Modal jazz, walking bass | Piano + Upright | Sparse modal trumpet — 3-note phrases, vast silence | Brushes (late) | Swing |
| Gospel Sunday | 808 sub, warm organ, pump | Organ (drawbar) | Pentatonic call-and-response | 808 kit | Shuffle |
| Tundra | Glacial ambient, infinite | Bell (inharmonic) | Frozen bell notes — single tones in endless space | None | Rubato |
| Pocket Drummer | Drums dominate, lo-fi | Stab (resonant) | Blues stab riff — tight punchy phrases | 808 (loud, DnB) | Swing |
| Dark Matter | Cascading arpeggios, delay | Piano (warm) | Broken chord cascade — interlock through high-feedback delay | Acoustic (sparse) | Straight |

---

## Motif Melody System (NEW)

Each lens stores a `motif` array of scale degrees (-1 = rest). The `updateMelody()` function steps through sequentially, creating actual musical phrases unique to each lens. Runs independently from autoplay (walking bass, random notes).

Key parameters per lens:
- `motif`: Array of scale degrees and rests
- `motifNoteDur`: Rhythmic value per step (1 = quarter, 0.5 = eighth, 0.25 = 16th)
- `motifOctave`: Register offset
- `motifVel`: Base velocity
- `motifNoteType`: Synthesis type override (piano, organ, bell, stab, etc.)

---

## Breathing System (NEW)

Continuous layers (pad, atmosphere, bass) now have amplitude LFO modulation to prevent static hum:
- Pad: ±35% amplitude at `padBreathRate` Hz
- Atmosphere: ±25% at 60% of breath rate
- Bass: ±20% at 40% of breath rate

Per-lens `padBreathRate`: Conductor 0.06 (majestic), Blue Hour 0.08 (meditative), Gospel 0.15 (spirited), Tundra 0.04 (glacial), Pocket Drummer 0.2 (pumping), Dark Matter 0.1 (steady).

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
Oscillator layers → Per-layer filter → Per-layer gain → Breathing LFO → Sidechain gain → Saturator → Compressor → Master → Output
                                                    ↘ Reverb send → Convolver (lens-specific IR) → Master
                                                    ↘ Delay send → Delay → LP Filter → Feedback loop → Master
Drum bus → Drum compressor → Master
Crackle → Master
Motif melody → synthesizeNote() → same chain as touch notes
```

---

## Recent Session (Feb 25, 2026)

### Melodic DNA + Breathing (Latest)
1. **Fixed static hum**: Added amplitude breathing LFO to pad/atmosphere/bass layers
2. **Added motif melody system**: Each lens now plays actual musical phrases, not random notes
3. **Walking bass chromatic approaches**: Beat 4 plays half-step below next target (jazz idiom)
4. **The Conductor → organ motif**: Ascending lines that reach, then resolve (cathedral inspiration)
5. **The Blue Hour (renamed from Charlie Parker)**: Quartal So What voicing, sparse modal trumpet phrases, walking bass
6. **Gospel Sunday → call-and-response motif**: Pentatonic organ phrases
7. **Tundra → frozen bell motif**: Single crystalline notes with vast silence
8. **Pocket Drummer → blues stab riff**: Tight punchy phrases supporting the groove
9. **Dark Matter → cascading arpeggios**: Warm broken chords through high-feedback delay, mixolydian mode, add9 voicing

### Previously Fixed
- Gesture response "blinko" sound (replaced with quieter per-lens synthesis, 400ms cooldown)
- Charlie Parker mix balance (drone 0.5→0.10, walking bass vel 0.15→0.25)
- Per-lens instrument presence (piano, organ, bell, stab all boosted)
- Touch note velocity (0.18→0.25 base)
- iOS motion permissions (Promise.all, deferred weather, retry on gesture)
- Touch/tilt injection into brain motion pipeline
- Per-lens note synthesis system (6 instruments)
- Style-aware autoplay (walking/sparse/arpeggio/random)

---

## What's Next

### Immediate
1. **Test on iPhone** — Verify breathing kills the hum and each lens sounds genuinely different
2. **Fine-tune motif velocities** — May need adjustment after hearing on speakers
3. **Pocket detection** — Phone-in-pocket mode (walking rhythm)

### Medium-term
4. **Microphone input** — onset detection, ambient awareness
5. **Natural language lens creation** — AI interprets artist descriptions into lens parameters
6. **Movement-only mode** — No screen, just body to sound

---

*"The goal is not to make something. The goal is to discover something that already exists."*

**Live at:** lacobusgump.github.io/music2.0/
