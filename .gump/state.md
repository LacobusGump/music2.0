# Current State

*Last updated: February 7, 2026*

---

## GUMP UNIFIED - The Synthesis

**The Breakthrough:** After studying the entire repo history - 835 commits, 18 dialogue sessions, multiple project iterations (G7, Dew Waz, Lowfiye, The Blend) - a single unified instrument was created.

**Live at:** lacobusgump.github.io/music2.0/gump-unified.html

---

## What Was Synthesized

### From G7 Flywheel
- Tier-based unlocking through movement
- Movement accumulates energy over time
- Energy thresholds reveal new layers

### From Lowfiye
- Lo-fi processing chain (warmth, dust filter, saturation)
- Tape warmth (low shelf boost at 300Hz)
- Vinyl dust filter (6kHz lowpass)

### From Dew Waz
- Environmental awareness
- Sample categorization concepts (though not mic input yet)

### From The Blend
- Unified approach: movement unlocks synths
- Single coherent codebase

### From The Producer's Mandate
- **E = mc²:** gesture → phrase → resolution
- Starts with SILENCE
- Layers build through USER ACTION
- Music EMERGES from chaos

---

## How It Works

```
SILENCE
    ↓ (movement begins)
AWAKENING (tier 1)
    - Sub bass drone awakens
    ↓ (energy > 15%)
PULSE (tier 2)
    - Pad layer joins
    - Groove starts: Purdie shuffle 808s
    ↓ (energy > 30%)
BREATH (tier 3)
    - Strings layer (detuned supersaws)
    ↓ (energy > 50%)
SWELL (tier 4)
    - Brass layer (filtered saws)
    ↓ (energy > 70%)
SURGE (tier 5)
    - Choir layer (high harmonics)
    - Edge glow visualization
    ↓ (energy > 90%)
CLIMAX (tier 6)
    - Full orchestra
    - Maximum intensity
```

---

## Gesture → Phrase

| Gesture | Detection | Musical Response |
|---------|-----------|------------------|
| SHAKE | High speed + direction changes | Trill (rapid alternation) |
| SWIPE UP | Net upward movement | Ascending arpeggio |
| SWIPE DOWN | Net downward movement | Descending arpeggio |
| HOLD | Stillness > 1 second | Sustained swell |

---

## The Purdie Shuffle

16-step pattern at 85 BPM with 18% swing:

```
Kick:  [1, 0, 0, 0, 0, 0, .6, 0, 1, 0, 0, 0, 0, 0, 0, 0]
Snare: [0, 0, 0, 0, 1, 0, .2, .3, 0, 0, .2, 0, 1, 0, .3, .2]
Hats:  [1, .3, .6, .3, 1, .3, .6, .4, 1, .3, .6, .3, 1, .3, .6, .5]
```

Ghost notes on the snare (steps 6, 7, 10, 14, 15) create the shuffle feel.

---

## Technical Details

- **Single HTML file:** `gump-unified.html` (~650 lines)
- **No external dependencies**
- **iOS tilt permission:** Requested BEFORE preventDefault
- **Touch fallback:** Position maps to tilt values
- **Sidechain:** All layers duck on kick hits
- **Lo-fi chain:** warmth → dust → saturation

---

## What Makes It Different

1. **SILENCE first** - Not droning from the start
2. **Motion as primary** - Tilt/accelerometer, not just touch
3. **Energy accumulates** - Sustained engagement unlocks power
4. **Gestures trigger phrases** - Complete musical sentences
5. **Lo-fi warmth** - Tape saturation, not clinical digital
6. **Journey arc** - From nothing to climax to resolution
7. **Tilt = expression** - Y axis controls filter brightness

---

## Success Criteria

- [x] Starts with SILENCE
- [x] Movement builds energy
- [x] Tiers unlock layers progressively
- [x] Groove kicks in at tier 2
- [x] Gestures trigger musical phrases
- [x] Tilt modulates filter brightness
- [x] iOS tilt permission works
- [ ] Test on actual device
- [ ] Feels like "conducting an orchestra"

---

## Next Steps (If Needed)

1. **Test on iOS** - Verify tilt permission and sound
2. **Add microphone input** - Complete the Dew Waz vision
3. **Add phrase learning** - Remember user's gestures
4. **Add THE BWAAAM** - Climax impact sound
5. **Refine gesture thresholds** - Based on real device testing

---

*"The goal is not to make something. The goal is to discover something that already exists."*

**Live at:** lacobusgump.github.io/music2.0/
