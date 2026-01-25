# Current State

*Last updated: January 24, 2026*

---

## THREE PILLARS: COMPLETE ✓

All three hard problems have been solved:

1. **PREDICTION** ✓ - System anticipates where you're going (120ms lookahead)
2. **ENTRAINMENT** ✓ - Beat syncs to your natural movement tempo
3. **LEARNING** ✓ - System tracks your pattern, responds to deviations

---

## PATTERN VS OUTLIER: IMPLEMENTED

**The system learns YOUR pattern. Then it plays your DEVIATIONS against it.**

---

## THE VISION

### The Core Idea
1. **Establish the norm**: Repetitive motion creates a baseline - tempo, direction, amplitude
2. **Detect outliers**: When you break YOUR pattern, the system notices
3. **Calculate the relationship**: The outlier isn't chaos - it's a RATIO against the norm
4. **Express as polyrhythm**: If your norm is 4 and your outlier suggests 3, you get 4:3 polyrhythm
5. **Custom music emerges**: From the tension between your pattern and your deviations

### NOT This
- ❌ Stop moving = dissolve to chaos
- ❌ Outlier = random destabilization

### YES This
- ✅ Outlier = new voice that plays AGAINST the established pattern
- ✅ The relationship between norm and deviation IS the music
- ✅ Polyrhythms, cross-rhythms, tension/resolution from YOUR movement

---

## HOW IT WORKS

### 1. Pattern Learning
Track user's movement over time:
- Average tempo (time between direction changes)
- Typical amplitude (how far they move)
- Common directions (where they tend to go)
- Rhythm signature (their natural subdivisions)

This becomes the **NORM** - their personal baseline.

### 2. Outlier Detection
When movement deviates significantly from the norm:
- Sudden tempo change (moved faster/slower than usual)
- Amplitude spike (bigger movement than typical)
- Direction break (went somewhere unexpected)
- Rhythm anomaly (timing that doesn't fit their pattern)

This is the **OUTLIER** - the interesting moment.

### 3. Musical Calculation
Don't just react - CALCULATE the relationship:

```
If norm tempo = 120 BPM
And outlier suggests 90 BPM
Ratio = 120:90 = 4:3
→ Create a 4:3 polyrhythm
```

The outlier becomes a NEW VOICE playing against the established groove.

### 4. Polyrhythmic Expression
Layer the outlier rhythm OVER the norm:
- Norm continues as the base pulse
- Outlier creates a counter-rhythm
- Together they form polyrhythm (3:2, 4:3, 5:4, etc.)
- The tension between them IS the music

### 5. Advanced Reading Techniques
Build custom algorithms to find:
- Correlating rhythms (what polyrhythm does this outlier imply?)
- Harmonic relationships (if norm is root, what interval is the outlier?)
- Timbral connections (how should the outlier SOUND different?)

---

## THE SOUND

### Current: Dark, spooky, machine-like (KEEP THIS)

### Add: Massive detuned supersaws when patterns lock
- Multiple oscillators per voice (5-7 saws)
- Stacked 5ths (root + 5th + octave)
- That "clearing" moment when chaos → locked chord
- The viral synth wall-of-sound

### New: Polyrhythmic layers from outliers
- Norm = main pulse (kick, bass)
- Outlier = counter-rhythm (hi-hats, arps, ghost notes)
- The two interlock to create groove

---

## IMPLEMENTATION STATUS

### ✓ COMPLETED: Pattern Learning
- Rolling statistics of tempo, amplitude, direction, rhythm
- ~5 second window (300 samples at 60fps)
- Confidence score (0-1) shows pattern establishment
- Updates every 3 frames for performance

### ✓ COMPLETED: Outlier Detection
- Detects when current movement deviates from norm
- Calculates outlier score (Z-score: σ from mean)
- Identifies outlier TYPE (tempo, amplitude, direction)
- Calculates RATIO for polyrhythm generation
- Threshold: >2σ = significant, >3σ = major break

### ✓ COMPLETED: Polyrhythmic Response
- Counter-voice emerges when outlier detected
- Runs at polyrhythm subdivision of main beat
- Quantizes to musical ratios (3:2, 4:3, 5:4, etc.)
- Different timbres for different outlier types
- Fades when pattern normalizes

### ✓ COMPLETED: Supersaw Upgrade
- 7 detuned sawtooth oscillators per entity (was 2 sine/triangle)
- Variable detune: 3-25 cents based on pattern confidence
- Lock-in: detune tightens when pattern is strong (>70% confidence)
- Stacked 5ths: 5th appears at 80%, octave at 90% confidence
- Visual feedback: golden rings, white flash, edge glow when locked
- That massive wall-of-sound when everything aligns

### 🔴 BUG: Mobile Scaling
- On phone, only top-left corner is visible
- Canvas/viewport scaling is wrong
- PRIORITY FIX before next features

### NEXT CYCLE: Order from Chaos (Cell Division Philosophy)

**User feedback**: "We need to find order within the chaos with repetition. Think about how a cell splits the chaos in that only to then form a rather simple end point, in that the simplicity of the full organ is its complexity finished."

**The Insight**:
- A cell divides chaotically, but the end result (an organ) is simple in form, complex in function
- Repetition doesn't just create pattern - it CRYSTALLIZES chaos into structure
- The journey: chaos → repetition → crystallized simplicity → emergent complexity
- Like how a heart is "simple" (pump) but emerged from billions of chaotic cell divisions

**Musical Translation**:
- Start chaotic (many voices, detuned, unpredictable)
- Repetition causes CONVERGENCE (voices align, harmonies lock)
- End state is SIMPLE but POWERFUL (one massive chord, one clear rhythm)
- The simplicity IS the complexity finished
- Then... the cycle can begin again (new chaos from order)

**Implementation Ideas**:
- Track repetition count, not just pattern confidence
- More repetitions = MORE convergence (voices literally merge)
- Ultimate lock-in state: everything becomes ONE voice, ONE pulse
- That moment of crystallization should feel earned, profound
- Then entropy slowly returns, inviting new exploration

### FUTURE: Persistence
- localStorage for cross-session memory
- Harmonic preferences learned over time
- Truly personalized instrument

### FUTURE: Microphone Input
- Pitch detection or onset detection
- Hum to harmonize
- Clap to trigger

---

## TECHNICAL NOTES

### Pattern Statistics (IMPLEMENTED)
```javascript
patternStats = {
  tempoSamples: [],           // Time between direction changes
  tempoMean, tempoStdDev,

  amplitudeSamples: [],       // Movement size (0-1 normalized)
  amplitudeMean, amplitudeStdDev,

  directionHist: [8],         // Compass histogram with decay
  dominantDirection,

  rhythmSamples: [],          // Time between movement onsets
  rhythmMean, rhythmStdDev,

  isValid,                    // Pattern established?
  confidence,                 // 0-1 confidence score

  outlierScore,               // Current Z-score
  outlierType,                // 'tempo'|'amplitude'|'direction'
  outlierRatio                // For polyrhythm calculation
}
```

### Outlier Scoring (IMPLEMENTED)
```javascript
// Each type has its own Z-score
tempoZ = abs(currentTempo - tempoMean) / tempoStdDev
ampZ = abs(currentAmp - ampMean) / ampStdDev
// Highest Z-score determines outlier type
outlierScore = max(tempoZ, ampZ, directionScore)
// > 2 = significant outlier, > 3 = major break
```

### Polyrhythm Calculation (IMPLEMENTED)
```javascript
ratio = currentTempo / tempoMean  // or amplitude ratio
// Quantize to nearest musical ratio:
const polyrhythms = [
  { ratio: 1.5, name: '3:2' },
  { ratio: 1.333, name: '4:3' },
  { ratio: 1.25, name: '5:4' },
  { ratio: 1.2, name: '6:5' },
  // ... etc
]
// Counter-rhythm runs at: systemBPM * subdivision
```

---

## WHAT SUCCESS LOOKS LIKE

1. Move repetitively → system learns your pattern, base groove locks in
2. Make an unexpected move → system detects the outlier
3. The outlier becomes a counter-rhythm → polyrhythm emerges
4. Keep both patterns going → complex interlocking groove
5. The music is YOURS - born from your consistency AND your surprises

---

## SOUND REFERENCES

- J Dilla's drunk drums (grid + deviation = groove)
- Steve Reich phasing (two patterns drifting against each other)
- Aphex Twin polyrhythms (complex ratios, still grooving)
- That massive supersaw lock-in moment

---

*"Your pattern is the question. Your outlier is the answer."*
