# Current State

*Last updated: February 21, 2026*

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

## v36 Lo-Fi Kanye Drums

Simple hip-hop patterns with subtle swing (1.08:0.92):

```
Kick:  [1, 0, 0, 0, 0, 0, .4, 0, .9, 0, 0, 0, 0, 0, 0, 0]   // 1 + ghost on &3
Snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]       // clap on 2+4
Hats:  [.5, 0, .3, 0, .5, 0, .3, 0, .5, 0, .3, 0, .5, 0, .3, 0] // sparse 8ths
```

- Kick: warm 808 sine sub (50→28Hz, 1.2s ring) — the sub IS the bass
- Snare: sine body + dark bandpass noise — warm snap, not sizzle
- Hats: just dark filtered noise — subtle ticks in the back
- Drum bus: tape saturation tanh(1.5), compression 4:1/-18dB (glue not slam)
- Sidechain: deep pump (0.15 gain, 0.25s recovery) — classic Kanye
- Vinyl crackle: brown noise texture, routes through sidechain, ducks with kick

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

## Version History (Recent)

- **v36-LOFI-KANYE** — Strip the drums, find the soul. Warm 808s, simple patterns, tape saturation, vinyl crackle, deep sidechain pump.
- **v35-MUSICAL-DNA** — RPG character build. Movement shapes 5 personality traits that bias every musical parameter.
- **v34-LIVING-ORGANISM** — Evolving visual cursor + warping grid.
- **v33-MUSICAL-INTELLIGENCE** — Massive drums (now replaced), compound reactivity, tilt expression, sidechain, musical context.

## The Platform Vision (NEW — February 21, 2026)

**Music 2.0 is not just an instrument. It's a platform.**

Three layers:
1. **The Engine** — movement → music (what we're building now)
2. **The Artist Channel** — musicians upload "musical personalities" (artistic lenses) defined in natural language
3. **The Listener** — just lives their life, subscribed to artist channels that score their reality

See `vision.md` for the full platform architecture.

## Next Steps

### Immediate (Engine)
1. **Pocket detection** — accelerometer thresholds for phone-in-pocket mode (trigger bangs from walking rhythm)
2. **Context inputs** — time of day, weather API, ambient noise → feed into musical decisions
3. **Movement-only mode** — no screen, no visuals, just body → sound (this felt better in early pd experiments)

### Medium-term (Toward Platform)
4. **Musical Lens system** — define a "lens" as a configuration object: scales, densities, response curves, silence behavior, energy mappings
5. **Natural language → lens** — AI interprets artist descriptions ("Charlie Parker if he grew up in Paris") into lens parameters
6. **Lens import/export** — shareable JSON that defines how life sounds through your artistic vision

### Long-term (Platform)
7. **Artist studio** — conversational refinement of lenses ("mornings are too busy, let it breathe before 10am")
8. **Channel subscriptions** — listeners subscribe to artist lenses
9. **Context API** — weather, time, social signals feed into the engine alongside movement

---

*"The goal is not to make something. The goal is to discover something that already exists."*

**Live at:** lacobusgump.github.io/music2.0/
