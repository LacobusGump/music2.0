# Current State

*Last updated: March 2, 2026*

---

## THIS IS MUSIC 2.0 (v11)

**The fundamental inversion**: Music dances to the user. The user does not dance to the music.

There is NO clock. There are NO pre-written patterns. No BPM. No motifs. No chord progressions.
Your body IS the composition. The music FOLLOWS you.

---

## Architecture

```
index.html          — Bootstrap, screens, HTML/CSS
js/sensor.js        — Accelerometer, gyroscope, touch, weather, time
js/brain.js         — Kalman filter, Fibonacci ring buffers, 7 LIF spiking neurons, void state
js/audio.js         — Pure sound: 13 synth engines, 5 drum voices, 4-band per-lens EQ, effects
js/follow.js        — THE ENGINE: body → music. Peak detection, tilt→pitch, stillness→silence
js/lens.js          — 6 timbral palettes (not behavior configs — just WHAT sounds respond)
js/organism.js      — Visual creature on canvas
js/app.js           — State machine, main loop, wires body data → Follow engine
```

**Key difference from every previous version**: follow.js has no `setInterval`, no beat counter, no autonomous clock. It reads your body on every animation frame and responds.

---

## How It Works

### Your Body → Music

| Your Body | → | Music Response |
|-----------|---|----------------|
| **Motion peaks** (steps, bounces, gestures) | → | Rhythmic hits at YOUR tempo |
| **Tilt** (phone angle) | → | Pitch follows your hand (actual notes, not filter) |
| **Twist** (gyro rotation) | → | Filter/timbre expression |
| **Energy** (how much you move) | → | Density (more movement = more voices) |
| **Stillness** (you stop) | → | REAL SILENCE (not quiet drone — actual silence) |
| **Gesture type** (shake/sweep/circle/toss) | → | Musical response matched to gesture |
| **Touch** (screen tap/drag) | → | Direct note playing |

### Peak-Derived Rhythm
- Brain's spiking neurons detect motion peaks
- Inter-peak intervals = YOUR tempo (derived, not set)
- Subdivisions play BETWEEN your peaks at YOUR tempo
- When peaks are periodic → rhythmic response
- When peaks are irregular → textural response
- When no peaks → silence

### Tilt → Pitch
- Phone tilt (beta angle) maps to scale degrees
- Not a filter sweep — actual NOTES following your hand
- Center position (45°) = root note
- Tilt forward = ascending, tilt back = descending
- Only fires when degree changes (not continuous spam)

### Stillness → Silence
- Real silence, not quiet drone
- After 1.5-2.5 seconds of stillness (per lens), music resolves and fades
- Resolution note plays when silence begins ("the music knows you stopped")
- First note when you start again is gentle ("oh, you're here")

---

## The 6 Timbral Palettes

Each lens defines WHAT sounds respond to your body. Not WHEN or HOW.

| Lens | Your Peaks → | Your Tilt → | Feel |
|------|-------------|------------|------|
| **Conductor** | Brass accents | Organ melody | Orchestra following your hands |
| **Blue Hour** | Walking bass | Rhodes melody | Smoky jazz, your walk is the bass |
| **Gospel Sunday** | 808 sub | Organ | Church warmth, building praise |
| **Tundra** | Single bell | Sparse pluck | Vast silence, each note precious |
| **Pocket Drummer** | 808 kick | FM stabs | Your body IS the drum machine |
| **Dark Matter** | Massive 808 | Cascading Rhodes | Weight and shimmer through delay |

---

## Audio Pipeline (audio.js)

```
Synth engines → LP filter → Sidechain gain → Saturator (asymmetric tube) → Compressor → 4-Band EQ → Output
Drum bus → Drum compressor → Drum LP (3500) → Master
4-Band Per-Lens EQ: lowShelf → midPeak → highShelf → masterLP (per-lens tone object)
```

---

## What's Next

### Immediate
1. **Test on iPhone** — Does your walk create a walking bass? Does stopping create silence?
2. **Tune response sensitivity** — peakThreshold, tiltRange, noteInterval per lens
3. **The moment test** — Stop your phone. Does the music resolve? Start again. Does it feel alive?

### Medium-term
4. **Microphone input** — Your voice enters the music
5. **Movement-only mode** — No screen, just body to sound
6. **Harmonic gravity** — Touch notes bend toward consonance
7. **Natural language lens creation** — Describe a sound, AI builds the palette

---

*"MUSIC 2.0: Music dances to the user. The user does not dance to the music."*

**Live at:** lacobusgump.github.io/music2.0/
