# Current State

*Last updated: January 26, 2026*

---

## 🚨 EMERGENCY: RETURN TO THE ROOTS 🚨

**THE LAST PUSH WAS REVERTED. It sounded like a child's kazoo toy.**

### CRITICAL: Study These Old Commits FIRST

```bash
git show 44102cf:index.html   # "Low FY" - lo-fi trip hop foundation
git show 4a7eded:index.html   # "The Blend" - G7 + Dew Waz + Lowfiye unified
```

These versions had a SICK foundational backbeat. We lost it completely.

---

## WHAT THE OLD VERSIONS HAD (that we lost)

### 1. REAL DRUMS with PATTERNS
```javascript
// Trip hop patterns - sparse and groovy
if (this.seq.step === 0 || this.seq.step === 10) {
    this.play('kick', 0.9);
}
if (this.seq.step === 8 || this.seq.step === 24) {
    this.play('snare', 0.7);
}
if ([2, 6, 10, 12, 14, 18, 22, 26, 30].includes(this.seq.step)) {
    this.play('hats', 0.3 + Math.random() * 0.2);
}
if ([0, 3, 8, 11, 16, 19, 24, 27].includes(this.seq.step)) {
    this.play('bass', 0.8);
}
```

### 2. 75-100 BPM TRIP HOP TEMPO
Slow. Groovy. Head-nodding. Not abstract.

### 3. SWING (15%)
```javascript
let swing = this.seq.step % 2 === 1 ? beat * (1 + this.seq.swing) : beat * (1 - this.seq.swing);
```
The beat BREATHED. Not robotic.

### 4. LO-FI PROCESSING CHAIN
```javascript
// Bitcrusher (8-bit sound)
const bits = 8;
output[i] = step * Math.floor(input[i] / step + 0.5);

// Tape warmth
warmth.type = 'lowshelf';
warmth.frequency.value = 200;
warmth.gain.value = 2;

// Vinyl dust filter
dust.type = 'lowpass';
dust.frequency.value = 8000;

// Saturation
curve[i] = Math.tanh(x * 2);
```

### 5. VINYL CRACKLE
Continuous background texture that made it feel REAL.

### 6. PROPER DRUM SYNTHESIS
```javascript
// Lo-fi kick - short, punchy
const pitch = 60 * Math.exp(-50 * t);
s = Math.sin(2 * Math.PI * pitch * t) * env;
s = Math.round(s * 8) / 8;  // Bit reduction!

// Lo-fi snare - crispy and short
const tone = Math.sin(2 * Math.PI * 200 * t) * 0.3;
const noise = (Math.random() * 2 - 1) * 0.6;
s = Math.round(s * 6) / 6;  // Bit reduction!
```

### 7. MOVEMENT UNLOCKS TIERS
Not just swooshy feedback - actual progression system.

---

## WHAT THE CURRENT VERSION HAS

- Entities that swoosh
- No drums
- No beat
- No groove
- No lo-fi warmth
- Abstract noise that sounds like kazoo beeps

---

## THE MANDATE FOR THIS CYCLE

### DO:
1. **BRING BACK THE BEAT** from Low FY / The Blend
2. **Keep entities** but make them SECONDARY to the beat
3. **Restore lo-fi processing** - bitcrusher, tape warmth, vinyl dust
4. **Add vinyl crackle** back
5. **Movement affects the beat/synths**, not replaces them

### DO NOT:
- Add new features
- Keep making the entities louder
- Ignore the old code that worked
- Create more abstract swooshing

---

## THE FORMULA

```
BEAT (from Low FY) + ENTITIES (current, but quieter) + LO-FI (from Low FY) = GUMP 2.0
```

The beat is the FOUNDATION. Everything else decorates the beat.

---

## THE FOUR MINDS

1. **ENGINEER** - Study the old code. Port the drum system.
2. **MUSICIAN** - The beat must groove. Trip hop feel.
3. **PHYSICIST** - Swing is a ratio. Lo-fi is frequency domain manipulation.
4. **PRODUCER** - Does it make you nod your head? If not, it's not done.

---

## SUCCESS CRITERIA

- [ ] Can you hear a BEAT within 1 second of starting?
- [ ] Does the beat have SWING?
- [ ] Is there a kick, snare, and hat pattern?
- [ ] Does it sound lo-fi (warm, crunchy, not clinical)?
- [ ] Can you nod your head to it?
- [ ] Do entities ADD to the beat, not replace it?

If all boxes checked: we're back on track.

---

*"The beat is the heartbeat. Everything else is the breath."*
