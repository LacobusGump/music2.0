# Current State

*Last updated: January 29, 2026*

---

## 🔄 CLEAN REBUILD - BACK TO WHAT WORKS

**User feedback:** "starting to glitch out... dials don't provide much variety... throw everything out and start new with what's proven to work"

---

## WHAT WAS PROVEN TO WORK

From 18 sessions of experimentation:

1. **Real samples** - freesound.org URLs, not synthesis
2. **Motion → energy → intensity** - core feedback loop
3. **Lo-fi aesthetic** - warmth, filtering, saturation
4. **Professional FX chain** - saturation, compression, reverb, delay
5. **Simple architecture** - fewer oscillators, clean code

## WHAT FAILED

1. **Magenta.js** - glitchy, heavy, unreliable
2. **456 oscillators** - "swooshy mess"
3. **Over-engineering** - crystallization, prediction, entrainment all together
4. **Subtle dial differences** - not enough variety
5. **Trap/jazz/rock synthesis** - "sounds like trash"

---

## THE NEW BUILD

### Architecture
- **~500 lines** (down from 900+)
- **No external dependencies** (no TensorFlow, no Magenta)
- **Real samples** from freesound.org
- **Simple synths**: 1 bass oscillator, 4 pad oscillators
- **Total oscillators**: 5 (not 456)

### Dials - DRAMATICALLY Different

**GROOVE** (changes BPM, pattern, samples):
| Setting | BPM | Character |
|---------|-----|-----------|
| chill | 72 | Sparse trip-hop, soft kick, fat snare |
| bounce | 95 | Syncopated hip-hop, punchy, groovy |
| drive | 128 | Four-on-floor, open hats, energy |
| chaos | 140 | Broken beats, rim shots, unpredictable |

**TONE** (changes filter, resonance, saturation):
| Setting | Filter | Character |
|---------|--------|-----------|
| warm | 2500 Hz | Lo-fi, rounded |
| bright | 8000 Hz | Open, airy |
| dark | 800 Hz | Muffled, sub-heavy |
| glass | 12000 Hz | Crystal clear, resonant |

**SPACE** (changes reverb, delay):
| Setting | Verb | Delay | Character |
|---------|------|-------|-----------|
| room | 15% | 8% | Intimate |
| hall | 35% | 15% | Spacious |
| void | 55% | 30% | Ambient wash |
| tight | 5% | 2% | Dry, punchy |

### How Motion Works
- **Energy** = movement speed/intensity
- **Intensity** = smoothed energy (slower response)
- **X position** = chord voicing shift
- **Y position** = bass pitch shift
- **Stillness** = pad volume increases (reward for calm)

### Sample Library
```
kick_soft, kick_punch, kick_sub
snare_crack, snare_fat, snare_rim
hat_closed, hat_open, hat_shaker
perc_click, perc_tom
```

---

## WHAT'S DIFFERENT NOW

| Before (Magenta build) | After (Clean rebuild) |
|------------------------|----------------------|
| TensorFlow + Magenta.js | No dependencies |
| AI-generated patterns | Hand-crafted patterns |
| Complex dial logic | Simple presets |
| Subtle differences | DRAMATIC differences |
| 900+ lines | ~500 lines |
| Glitchy | Stable |

---

## SUCCESS CRITERIA

- [ ] No glitches
- [ ] Dials make OBVIOUS difference
- [ ] Groove change = completely different vibe
- [ ] Tone change = audible filter shift
- [ ] Space change = wet vs dry
- [ ] Motion still affects sound
- [ ] Sounds good from second 1

---

## KEY PRINCIPLES (Learned from Journey)

1. **Simple > complex** - 5 oscillators beats 456
2. **Real samples > synthesis** - for drums especially
3. **Dramatic differences > subtle variations** - users want to HEAR the change
4. **No dependencies > cool tech** - reliability first
5. **Motion → energy → music** - the core that works

---

## 🌟 THE ETERNAL LOOP 🌟

**User's wish:** "Just make sure it consistently pushes updates for as long as it can in life."

The project continues. The Four Minds keep building. Each rebuild teaches something new.

**Live at:** lacobusgump.github.io/music2.0/

---

*"Sometimes you have to throw it all away to find what works."*
