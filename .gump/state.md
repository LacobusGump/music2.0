# Current State

*Last updated: January 24, 2026*

---

## ENTRAINMENT: SHIPPED

**The beat follows YOU now.** Not the other way around.

---

## What Changed This Cycle

### Entrainment System (COMPLETE)

The system now detects your natural rhythm and syncs to it.

**How it works:**
1. **Tempo Detection** - Tracks movement starts and direction changes as "taps"
2. **BPM Calculation** - Median of recent tap intervals converts to BPM (40-180 range)
3. **Soft Lock** - System BPM smoothly entrains toward detected user BPM
4. **Beat Generation** - Soft kick pulses on each beat at the entrained tempo

**New state variables:**
- `field.userBPM` - Detected user tempo
- `field.systemBPM` - Current system tempo (converges to user)
- `field.beatPhase` - Phase in beat cycle (0-1)
- `field.beatStrength` - Intensity of current beat (decays)
- `field.onBeat` - True during beat window

**What users will notice:**
- A soft kick/pulse emerges that matches their movement rhythm
- Move fast in a pattern -> drums speed up
- Move slow and deliberate -> drums slow down
- The BPM displays at the bottom of the screen
- Visual ring expands from center on each beat

**Audio implementation:**
- Sub-bass frequency sine wave (BASE/2 = ~27Hz)
- Pitch drops from 2x to 1x over 80ms (classic kick shape)
- Amplitude scales with user activity
- Quieter in deep stillness (respects the vibe)

---

## THE THREE HARD PROBLEMS - Status

### 1. PREDICTION - SOLVED (Last Cycle)
System predicts where you're going 120ms ahead. Prediction error creates musical tension.

### 2. ENTRAINMENT - SOLVED (This Cycle)
System detects your tempo from movement patterns. Beat syncs to YOUR rhythm, not a fixed BPM. Direction changes are weighted more heavily as tempo signals.

### 3. LEARNING - NEXT
Still no memory of user preferences. This is the last hard problem.

**Approach for next cycle:**
- Track which regions user lingers in (harmonic preferences)
- Track which tempos user settles into
- Track gesture frequency and intensity patterns
- Use this to shape initial conditions in future sessions

---

## Technical State

**Codebase:** ~1,850 lines in index.html
**New systems this cycle:**
- Tempo detection from movement (detectUserTempo)
- Entrainment update loop (updateEntrainment)
- Beat audio synthesis (createBeatAudio, triggerBeat)
- Beat visualization (in draw function)

**What didn't break:**
- Prediction still works
- All gestures still work
- Entity lifecycle unchanged
- Performance still good (entrainment is cheap)

---

## Honest Assessment

**What's better:**
- The system has a PULSE now. A heartbeat.
- The pulse syncs to user movement - it's YOUR rhythm
- Visual feedback (expanding ring, BPM display) shows entrainment working
- Direction changes trigger tempo detection - intuitive

**What's still wrong:**
- No learning. Minute 1 = minute 100.
- Entrainment is reactive only - doesn't anticipate rhythm changes
- Haven't tested on real mobile device
- No integration with gesture system (gestures could reinforce beats)

**Next priority:** LEARNING. Make the system remember.

---

## Success Criteria: MET

> After this cycle, a user should notice something DIFFERENT:
> "The drums matched my movement" (entrainment) checkmark

The cycle succeeded. The beat follows the user. Ship it.

---

*"You don't follow the beat. The beat follows you."*
