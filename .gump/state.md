# Current State

*Last updated: January 24, 2026*

---

## NEW CREATIVE DIRECTION: PATTERN VS OUTLIER

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

## IMPLEMENTATION PRIORITIES

### This Cycle: Pattern Learning
- Track rolling statistics of user movement
- Calculate their personal "norm" (tempo, amplitude, direction)
- Store as baseline for comparison

### Next Cycle: Outlier Detection
- Detect when current movement deviates from norm
- Calculate the RATIO (how different? in what way?)
- Score the outlier (small deviation vs. major break)

### Following Cycle: Polyrhythmic Response
- Convert outlier ratio to musical interval
- Generate counter-rhythm that plays against norm
- Layer voices to create polyrhythm

### After That: Supersaw Upgrade
- Replace thin oscillators with detuned stacks
- Lock saws tighter when pattern is strong
- That massive chord sound when everything aligns

---

## TECHNICAL NOTES

### Pattern Statistics to Track
```javascript
norm: {
  tempo: { mean, stdDev },      // BPM of movement
  amplitude: { mean, stdDev },   // Size of movements
  direction: { histogram },      // Where they tend to go
  rhythm: { intervals[] }        // Their natural timing
}
```

### Outlier Scoring
```javascript
outlierScore = (current - norm.mean) / norm.stdDev
// > 2 = significant outlier
// > 3 = major break
```

### Polyrhythm Calculation
```javascript
ratio = normTempo / outlierTempo
// Quantize to musical ratios: 3:2, 4:3, 5:4, 6:5, etc.
// Use this to set counter-rhythm subdivision
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
