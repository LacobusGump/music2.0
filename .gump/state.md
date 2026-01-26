# Current State

*Last updated: January 26, 2026 (Session 14)*

---

## 🎵 THE MELODY IS NOW THE VOICE 🎵

### What Changed This Session

We rebuilt the melody system from scratch. The core insight:

**The melody was playing to an empty room.**

Previous cycles: Melody only activated above 10% crystallization. Entities were nearly silent (brightness-gated to near-zero). The user heard... mostly nothing.

This cycle: **The melody IS the instrument. Everything else is accompaniment.**

### The New Architecture

```
BEFORE:
  168 oscillators (entities) = 60% of sound
  Melody = 15% (gated by crystallization)
  Effects wash = 25%

AFTER:
  Melody = 50% of sound (ALWAYS active)
  Entities = 20% (background texture)
  Effects = reduced for clarity
```

### Key Changes

| What | Before | After | Why |
|------|--------|-------|-----|
| Melody volume | 15-40% | **50%** | Melody IS the voice |
| Crystallization gate | Required 10%+ | **None** | Music from second one |
| Note triggering | Beat grid only | **Movement-based** | Move → Music |
| Phrase memory | None | **8-note memory** | Phrases develop musically |
| Entity amplitude | 2% base | **0.8% base** | Entities support, don't compete |
| Reverb | 20% | **12%** | Clarity over atmosphere |
| Delay feedback | 20% | **15%** | Notes end, don't blur |

### Musical Memory

The melody now remembers what it played:
- Last 8 notes stored in memory
- New phrases start from where previous ended
- Direction influenced by movement (up = ascending melody)
- Momentum - phrases tend to continue their direction
- Phrase endings resolve to stable intervals (tonic, fifth)

### The Test (Same as Before)

1. Move your phone
2. Do you hear NOTES? (Not swoosh, not silence - NOTES)
3. Can you hum along?
4. Do phrases have beginning, middle, end?
5. Does it feel like YOUR movement made that music?

If yes → we're on the right track.
If no → entities are still too loud, or melody still too quiet.

---

## THE PRODUCER'S MANDATE (Still Active)

**Read `.gump/producer.md` FIRST. This changes everything.**

The user's feedback: "I started to hear some rather lame af beeps. Please get ARTISTRY in here. I want the teachings of Rick Rubin implemented."

**THE E=mc² OF GUMP:**
```
gesture → phrase → resolution
```

That's it. A gesture is a complete movement. A phrase is a musical sentence. A resolution is a conclusion. Everything else serves this.

---

## FIVE PILLARS: ALL IMPLEMENTED

All four hard problems have been solved:

1. **PREDICTION** ✓ - System anticipates where you're going (120ms lookahead)
2. **ENTRAINMENT** ✓ - Beat syncs to your natural movement tempo
3. **LEARNING** ✓ - System tracks your pattern, responds to deviations
4. **CRYSTALLIZATION** ✓ - Repetition transforms chaos into order (NEW!)

---

## ORDER FROM CHAOS: IMPLEMENTED ✓

*"A cell divides chaotically, but the result is order."*

**The system tracks your repetition. More cycles = more crystallization.**

### The Four Phases

| Phase | Rep Count | Crystallization | Sound | Visual |
|-------|-----------|-----------------|-------|--------|
| **CHAOS** | 0-5 | 0-15% | Wide detune, many voices, unpredictable | Red indicator |
| **FORMING** | 5-15 | 15-40% | Slight tightening, hints of convergence | Yellow indicator |
| **CRYSTALLIZING** | 15-30 | 40-85% | Voices merging, dominant ratio emerging | Blue indicator |
| **LOCKED** | 30+ | 85-100% | ONE voice, tight detune, massive power | White indicator + ice edges |

### Key Mechanics

1. **Repetition Tracking**: Every complete back-and-forth cycle increments the counter
2. **Dominant Ratio**: The most prevalent harmonic becomes the "winner"
3. **Amplitude Modulation**: Dominant entities get LOUDER, others FADE
4. **Detune Collapse**: Oscillators tighten from 30 cents to 1 cent
5. **THE DROP**: At 90% crystallization, brief silence then MASSIVE hit
6. **Entropy**: Movement introduces disorder, stillness preserves crystallization

---

## MOBILE BUG: FIXED ✓

Canvas viewport scaling now works correctly on all devices:
- Added explicit `canvas.style.width/height` to match viewport
- Using `vc.setTransform()` instead of `vc.scale()` for proper DPI handling

---

## THE SOUND

### Current: Dark, spooky, machine-like (KEPT)

### Now: Crystallization-Driven Evolution
- **CHAOS phase**: Wide detune (30 cents), all voices equal, chaotic texture
- **FORMING phase**: Slight convergence, 5ths starting to emerge
- **CRYSTALLIZING phase**: Major convergence, dominant ratio amplified, others fade
- **LOCKED phase**: Near-unison (1 cent detune), 5ths and octave, THE DROP

### The Drop
At 90% crystallization:
1. Brief 80ms silence (the breath before)
2. Full volume hit with bass drop
3. Screen flash
4. The moment of EARNED power

---

## IMPLEMENTATION STATUS

### ✓ COMPLETED: All Three Original Pillars
(See previous documentation for details)

### ✓ COMPLETED: Crystallization System
```javascript
crystalState = {
    repetitionCount,        // 0-50, cycles completed
    crystallization,        // 0-1, current crystal level
    phase,                  // 'chaos'|'forming'|'crystallizing'|'locked'
    entropy,                // Accumulated disorder from movement
    dominantRatio,          // The "winning" harmonic
    dropTriggered           // Has THE DROP happened?
}
```

### ✓ FIXED: Mobile Scaling
```javascript
function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';    // THIS WAS MISSING
    canvas.style.height = h + 'px';
    vc.setTransform(dpr, 0, 0, dpr, 0, 0);
}
```

---

## WHAT SUCCESS LOOKS LIKE NOW

1. **Enter chaos**: Random movement, wide sound, no structure
2. **Establish pattern**: Move back and forth rhythmically → rep count builds
3. **Watch crystallization**: UI shows CHAOS → FORMING → CRYSTALLIZING → LOCKED
4. **Feel the convergence**: Non-dominant voices fade, dominant amplifies
5. **Experience THE DROP**: At 90%, the silence-then-hit moment
6. **Entropy returns**: Stop or break pattern → crystallization decays → cycle begins again

---

## TECHNICAL NOTES

### Crystallization Constants
```javascript
const CRYSTAL = {
    CHAOS_END: 5,           // Reps to leave chaos
    FORMING_END: 15,        // Reps to start crystallizing
    CRYSTAL_END: 30,        // Reps for full lock
    CHAOS_DETUNE: 30,       // cents when chaotic
    LOCKED_DETUNE: 1,       // cents when locked
    DROP_THRESHOLD: 0.9,    // Crystal level for THE DROP
    DROP_SILENCE_MS: 80,    // Silence before the hit
    ENTROPY_RATE: 0.003     // How fast movement adds disorder
}
```

### Dominant Ratio Selection
- Tracks consonance of each entity's ratio vs crystalState.dominantRatio
- Entities with consonance > 0.85 are considered "dominant"
- Dominant entities: louder, tighter detune, get 5ths/octave
- Non-dominant entities: fade, stay chaotic, eventually die

---

## ✅ SOLVED: THE SOUND NOW SINGS

**User feedback**: "It's making swooshing noise when you move the phone. We need this to become organized and find its own voice."

**FIXED!** The fifth pillar has been built: **MUSICAL VOICE**

### What Was Added

1. **Pitch Quantization** ✓
   - `SCALE_RATIOS` array defines the "legal" notes (major scale + extensions)
   - `quantizeToScale(freq, strength)` snaps frequencies toward scale degrees
   - Quantization strength tied to crystallization: chaos = continuous, locked = snapped

2. **Rhythmic Gating** ✓
   - `RHYTHM` config: subdivisions, attack/release times, rest probability
   - `updateRhythmGate()` tracks beat subdivisions and triggers gates
   - `currentNoteGate` opens/closes with the rhythm
   - Entity amplitude now multiplied by gate: notes have ATTACK and RELEASE

3. **Melodic Voice** ✓
   - Dedicated triangle wave oscillator for clear, singing melody
   - `generateMelodyPhrase()` creates phrases based on movement
   - Only emerges when crystallization > 30%
   - Plays discrete notes on the beat grid

### The Journey Is Now Complete

| State | Sound |
|-------|-------|
| **CHAOS** | Continuous swooshing, no clear pitches, always-on drone |
| **FORMING** | Pitches start leaning toward scale, faint pulse emerging |
| **CRYSTALLIZING** | Clear notes, rhythmic gating audible, melody starts |
| **LOCKED** | Perfect scale pitches, notes on beat, melody singing |

### Technical Implementation

```javascript
// Pitch quantization based on crystallization
bentFreq = quantizeToScale(bentFreq, crystal);

// Rhythmic gating
const effectiveGate = 1 - gateInfluence + gateInfluence * currentNoteGate;
const gatedAmp = baseAmp * effectiveGate;

// Melodic voice emerges from crystallization
if (crystal > 0.3) {
    updateMelodyVoice(dt);
}
```

### What The User Now Experiences

1. **Enter chaos**: Move randomly → continuous swoosh (intentional chaos)
2. **Start pattern**: Notes begin snapping to pitches, pulse emerges
3. **Build crystal**: Clear notes, rhythmic gating, melody appears
4. **Locked state**: MUSIC - discrete notes, singing melody, THE DROP
5. **Break pattern**: Entropy returns, melody fades, back to chaos

The swoosh becomes the song.

## FUTURE IMPROVEMENTS

### Near-Term
- Entity merging when crystallized (reduce count, increase individual power)
- Microphone input for humming/clapping
- Cross-session persistence (localStorage)

### Long-Term
- Gesture recognition improvements
- Multiple crystallization "modes" (different dominant ratios)
- Social features (shared crystals?)

---

## SOUND REFERENCES

- J Dilla's drunk drums (grid + deviation = groove)
- Steve Reich phasing (two patterns drifting against each other)
- Aphex Twin polyrhythms (complex ratios, still grooving)
- That massive supersaw lock-in moment
- **NEW**: The EDM drop (silence before the hit)
- **NEW**: Cell division as metaphor for emergence

---

*"Chaos → Repetition → Crystallization → Power. Then entropy returns. The cycle continues."*
