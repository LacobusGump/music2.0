# The Musician

**Role**: Master of music theory, rhythm, and emotional arc. Makes it MUSICAL.

---

## Current Musical System

### Harmony
- Base frequency: A2 (110 Hz)
- Scale: Major (Ionian mode)
- X-axis maps to scale degree (7 positions)
- Y-axis maps to chord quality:
  - Low: minor7
  - Mid-low: dominant7
  - Center: major7
  - Mid-high: sus4
  - High: major7

### Rhythm
- 72 BPM, 4/4 time
- Purdie shuffle pattern (48 subdivisions per bar)
- Ghost notes on snare create the groove
- Drums fade in with stillness, fade with movement

### Melody
- Continuous sawtooth oscillator
- Pitch follows field position through scale
- Filter opens with Y position and energy
- Volume tied to movement energy

### Blooming Notes
- Spawn when still (stillness > 0.3)
- Random chord tones from current harmony
- Die when movement returns
- Create the "breathing" harmonic texture

---

## What's Missing Musically

### No Phrase Structure
Currently: continuous parameter mapping
Need: musical phrases with beginning, middle, end

### No Tension/Resolution
Currently: harmony is static based on position
Need: sense of journey - tension building, release, cadence

### No Call and Response
Currently: system only reacts
Need: system proposes, human responds (or vice versa)

### No Rhythmic Intelligence
Currently: fixed drum pattern modulated by energy
Need: rhythm that adapts to user's natural timing

---

## New Musical Directions

### Idea 1: Gesture as Motif
- A swipe becomes a melodic fragment
- Repeat the gesture = develop the motif
- Different gesture = new contrasting idea
- The piece emerges from gesture vocabulary

### Idea 2: Harmonic Gravity
- Define "home" (tonic)
- Movement away = increasing tension
- Return = resolution
- Let physics model (Physicist?) define the "gravity well"

### Idea 3: Rhythmic Entrainment
- Detect user's natural pulse from their movement
- Nudge tempo toward their rhythm
- Over time, sync perfectly
- Their body becomes the clock

### Idea 4: Modal Color
- Different modes for different "moods"
- Lydian (bright) ↔ Locrian (dark)
- Y-axis could sweep through modes instead of chord types
- More emotional range

---

## Questions for the Team

1. **Engineer**: What's the fastest we can detect pitch from microphone input?
2. **Physicist**: Is there a mathematical model for "musical tension" we could implement?
3. **Both**: Should we aim for Western tonality or explore microtonal/non-Western scales?

---

## Listening References

- Brian Eno's generative systems (Music for Airports)
- Laurie Spiegel's "Music Mouse" - early computer instrument
- Imogen Heap's Mi.Mu gloves - gesture to music
- Kanye's use of pitch-shifted samples (relevant to Lowfiye heritage)

---

## Notes

*The goal isn't to make a synthesizer. Synthesizers are tools for musicians.*

*The goal is to make an instrument that turns anyone into a musician.*

*The difference: an instrument has OPINIONS about what sounds good. It guides you toward music, not just sound.*
