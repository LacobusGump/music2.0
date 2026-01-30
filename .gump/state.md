# Current State

*Last updated: January 30, 2026*

---

## JAZZ ORCHESTRA 2.0 - AI AGENTS THAT LISTEN + REAL SAMPLES + MIC INPUT

**The Vision Realized:** Multiple AI agents acting like jazz musicians, listening to each other, responding to YOUR movement, and reacting to the WORLD through microphone input.

---

## WHAT'S NEW (January 30)

### Real Drum Samples
- Kicked synthesized garbage to the curb
- Using high-quality samples from freesound.org
- 6 drum sounds: kick, snare, hat, hatOpen, rim, perc
- Pitch and pan variation for natural feel

### Complex Rhythm Patterns
- **16th note resolution** - no more boring quarter notes
- **Swing timing** - delays every other 16th for groove
- **Multiple patterns** based on AI decision:
  - `steady` - classic jazz with ghost notes
  - `push` - driving 16ths, more kicks
  - `pull-back` - sparse, minimal
  - `fill` - drum fills
  - `drop` - near silence, just hints
  - `accent` - syncopated with rim accents

### Microphone Input
- **Mic level** influences instrument velocity
- **Frequency bands** (low/mid/high) analyzed
- **Onset detection** - claps/taps trigger lead notes
- Green indicator in top-right shows mic activity
- External sound becomes part of the music

### AI Agents (Groq + LLama 3.1 8B)
Four AI musicians, each thinking every 2 seconds:

| Agent | Listens To | Decides |
|-------|-----------|---------|
| **DrumMind** | Energy, tension, mic | steady, push, pull-back, fill, drop, accent |
| **BassMind** | Drums, direction | root, walk, climb, descend, pedal, rest |
| **PadMind** | Stillness, tension | close, spread, shell, rich, sparse, out |
| **LeadMind** | Everyone, mic, motion | develop, contrast, space, peak, echo, rest |

---

## HOW IT ALL WORKS TOGETHER

```
Your Movement  ─┬─> world.energy ─┬─> Drum velocity
                │                 ├─> Lead probability
                │                 └─> AI context
                │
Microphone ────┬─> micLevel ──────┬─> Extra velocity
               │                  ├─> Onset triggers lead
               │                  └─> AI context ("mic active")
               │
Stillness ─────┴─> world.stillness -> Pad volume/filter

AI Agents ─────> Decisions every 2s -> Pattern/voicing changes

Motion + Mic + AI = The music adapts to YOUR world
```

---

## THE DRUM PATTERNS (16 steps = 1 bar)

```javascript
steady: {
    kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],  // Jazz feel
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],  // 2 and 4
    hat:   [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],  // 8ths
    ghost: [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1],  // Ghost snares
}
```

---

## VISUAL FEEDBACK

- **Center breath** - pulses with rhythm
- **Tension ring** - orange when building, blue when releasing
- **Energy ring** - grows with movement
- **Mic ring** - green ring pulses with external sound
- **Mic indicator** - top right, green when mic active

---

## STATUS DISPLAY (top left)

Shows real-time AI decisions:
```
drums: push
bass: walk
pad: spread
lead: develop
↗ 67%    <- direction and tension
```

---

## SUCCESS CRITERIA

- [x] Real drum samples loaded from freesound
- [x] 16th note resolution with swing
- [x] Complex drum patterns with ghost notes
- [x] AI makes musical decisions every 2 seconds
- [x] Microphone input analyzed and integrated
- [x] Mic onset triggers musical events
- [x] Visual feedback for all inputs
- [ ] Test on mobile with motion sensors
- [ ] Verify samples load reliably
- [ ] Tune AI prompts for better musicality

---

## KNOWN CONSIDERATIONS

1. **Sample Loading** - Fetches from freesound CDN, has fallback synthesis
2. **AI Latency** - 100-500ms for Groq calls, runs in background
3. **Mic Permissions** - Browser will prompt, graceful fallback if denied
4. **CORS** - freesound CDN allows cross-origin, should work

---

## NEXT STEPS IF NEEDED

1. **Better samples** - Find higher quality or host our own
2. **More AI personality** - Tune prompts for different "player" styles
3. **Faster AI** - Could reduce interval for more reactive changes
4. **GPS/Weather** - Add location-based mood (cold = haunted)
5. **Form awareness** - AI knows where in the song structure

---

*"The music listens to you. You listen to the music. The world becomes the song."*

**Live at:** lacobusgump.github.io/music2.0/
