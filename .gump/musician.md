# The Musician

**Role**: Master of music theory, rhythm, and emotional arc. Makes it MUSICAL.

---

## Current Musical System (BUILD 81)

### Body → Music Mapping

| Body | → | Music |
|------|---|-------|
| Tilt (beta angle) | → | Melody: scale degree follows hand |
| Motion peaks | → | Rhythm: kick/snare at YOUR tempo |
| Energy level | → | Density: more voices as you move more |
| Stillness | → | Real silence (not quiet drone) |
| Deep stillness | → | The Void: cosmic harmonic sea |
| Touch (screen) | → | Direct note playing, gravity-pulled to chord tones |

### Harmony
- Root: 432 Hz (A) by default, per-lens
- Modes: major, dorian, phrygian, lydian, picardy, minor — per lens
- Tilt → scale degrees 0-6 (per lens melodicAxis)
- Harmonic gravity: pitch bends toward consonance (not snapping, leaning)

### Phrase Grammar
- `phraseActive`: begins on motion > 0.5, ends on stillness or time limit
- Resolution chord at phrase end: 3-note I chord spread 120ms apart
- Phrase breathing: 480ms silence after landing on consonant note
- Call & response: system answers after 2+ peaks, 1.5-3.5s delay

### Rhythm
- No fixed BPM — tempo DERIVED from YOUR peaks
- 16-step groove DNA per lens (kick/snare/hat patterns, feel, kit)
- `tempoLocked` when rhythmic confidence > 0.22 (3+ consistent peaks)
- Peak kick fires WITHOUT tempo lock (James tilts, doesn't bounce)
- Autonomous hats/kick/snare only when tempo locked AND energy sufficient

---

## Three-Act Musical Arc

Each session is a journey:

**Act I (0-90s engaged)**: Emergence
- Original mode, sparse, space to breathe
- Music is learning you

**Act II (90-300s)**: Journey — Sus4
- `scale[2] = scale[3]` — the 3rd degree replaced by the 4th
- All modes: major→open, dorian→floating, phrygian→suspended
- "The Inception trick" — ONE note change lifts the whole emotional color
- Announced by two quiet ascending notes

**Act III (300s+)**: Homecoming
- Original mode restored — same home, but transformed by the journey
- Parallel sub-octave voice added to peaks (more voices, not chords)

`sessionEngagedTime` counts only active (non-silent) play — the arc is YOUR time, not clock time.

---

## Deceptive Cadence Tension Arc (Tundra + Still Water)

The Hans Zimmer / Interstellar docking technique:

1. **Building** (10-12s of active play): tension accumulates silently
2. **Near-miss**: V bass note → 2.2s → VI bass (not I) = "almost..."
   - Reverb tightens (space closes in)
   - Tundra: Picardy major 3rd flickers — grief glimpsing hope
3. Repeat 2-3 times, build time shortens each miss
4. **BOOM**: V bass → 1.8s → I in THREE registers simultaneously
   - Reverb opens wide (space expands)
   - Still Water: lydian #4 grace note floats before settling
5. **Cooldown**: 40s before it can repeat

---

## The 7 Lenses — Musical Character

### The Conductor
- Orchestra following your hands. Peaks = brass. Tilt barely fires (melodicEnergy=0.9).
- Major mode. You're conducting, not playing lead.

### Blue Hour
- Jazz club. Dorian. Conversations happen in the SILENCES.
- Brushes kit. Rhodes melody. Dry, warm.

### Drift
- Ambient float. Major. Continuous mono triangle. Low melodicEnergy (0.12).
- Everything is gentle. The body barely moves.

### Tundra
- **Picardy grammar**: minor scale but major 3rd in certain resolutions.
- This is grief + hope. Each note is PRECIOUS. Long silence between.
- melodicEnergy 0.38, melodicMinDelta 2 (jumps of 2+ degrees only, no drift).
- Restraint IS the principle. Fewer notes = more meaning.
- Tension arc: enabled. The Picardy major 3rd appears in near-misses and BOOM.

### Still Water
- Nils Frahm / Jon Hopkins. Lydian (bright, hopeful).
- Strings voice: 5-voice detuned + vibrato. Slow bow swell.
- Tension arc: enabled. Lydian #4 grace note in resolution.
- Flow-driven motion (sustained energy, not bouncing).

### Dark Matter
- Phrygian (dark, unstable). Default boot lens.
- Reverse/FM/glitch voice. 72% delay feedback. Heavy.
- Most users' first experience — phrygian chaos is the opening statement.

### Grid
- Electronic. Also phrygian.
- gridstack: supersaw with harmonic stacking (root + m3 + P5 + m7 + oct).
- Resonant LP sweep = "viral TikTok whoop." 450ms decay, 140ms noteInterval.
- Tactile. Immediate. Every gesture snaps.

---

## What's Solved

- Phrase structure: beginning/middle/end with resolution chords ✓
- Tension/resolution: V→I gravity, deceptive cadences ✓
- Rhythmic intelligence: peak-derived tempo, grooveDNA per lens ✓
- Call & response: system answers your phrases ✓
- Lens distinctiveness: melodicEnergy gate prevents "same keyboard lead" ✓
- Three-act arc: session evolves like classical music ✓
- Music autonomy: timer systems wait for YOUR energy ✓

## What's Open

### Kick Drum (BIG)
James: "gross and makes or breaks every song." Needs dedicated session.
What IS the right kick? Per lens: acoustic for Conductor, 808 sub for Grid,
brushes ghost for Blue Hour, single deep thud for Tundra, ...?

### Lens Melody Distinctiveness (ongoing)
The melodicEnergy gate helps. But deeper question:
- Should Conductor NEVER do tilt melody? (peaks-only instrument)
- Blue Hour: should tilt melody feel like a conversation, with rests?
- Could lenses have different melodic SHAPES (not just thresholds)?

---

## The Core Equation

```
gesture → phrase → resolution
```

Everything serves this. The body creates a gesture. The gesture becomes a phrase.
The phrase finds its resolution. Then silence — until the next gesture.

*"The goal is not to make something. The goal is to discover something that already exists."*
