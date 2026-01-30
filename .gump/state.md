# Current State

*Last updated: January 29, 2026*

---

## JAZZ ORCHESTRA - AI AGENTS THAT LISTEN

**The Vision Realized:** Multiple AI agents acting like jazz musicians, listening to each other and developing the music.

---

## WHAT WE BUILT

### AI Integration
- **Puter.js** - Free Kimi K2.5 access, no API keys, works in browser
- **One script tag** - `<script src="https://js.puter.com/v2/"></script>`
- **No backend needed** - Pure client-side AI

### The Four Musicians

| Agent | Listens To | Decides |
|-------|-----------|---------|
| **DrumMind** | Energy, tension, other instruments | steady, push, pull-back, fill, drop, accent |
| **BassMind** | Drums, lead, direction | root, walk, climb, descend, pedal, rest |
| **PadMind** | Drums, bass, activity | close, spread, shell, rich, sparse, out |
| **LeadMind** | Everyone, tension, motion | develop, contrast, space, peak, echo, rest |

### How They "Listen"

The `bandState` object is the shared musical memory:
```javascript
bandState = {
    drums: { density, lastFill, energy, pattern },
    bass: { register, activity, walking },
    pad: { voicing, volume },
    lead: { active, register, developing, motif },

    // The "conversation"
    recentEvents: [...],  // What just happened
    tension: 0-1,         // Building or releasing
    direction: 'building' | 'releasing' | 'floating'
}
```

### Jazz Principles Encoded

1. **Call and Response** - Agents log musical events; others react
2. **Tension Arc** - Direction naturally shifts: building -> releasing -> floating
3. **Motif Development** - Lead stores and transforms melodic ideas
4. **Register Conversation** - Bass climbs, lead might descend in response
5. **Trading Space** - Agents can choose to "rest" and let others shine

### AI Decision Flow

Every ~4 seconds, one agent asks Kimi K2:
```
"You are a jazz [instrument]. Energy: 70%, tension: 45%, direction: building.
Bass is walking. Drums are pushing. Recent: lead developed idea, bass started walking.
What's your next move? Reply with ONLY one word from: [options]"
```

The AI returns a single word decision that maps to musical parameters.

---

## WHAT'S PRESERVED FROM PEAK VERSION

- Real samples from freesound.org
- Euclidean pattern engine
- Motion -> energy -> intensity feedback
- Lo-fi FX chain (saturation, reverb, delay, compression)
- All three dials (pulse, depth, haze)
- Orb system for melodies
- Vinyl texture

---

## HOW MOTION STILL WORKS

Motion is the "world" that instigates:
- **Energy** = movement speed -> affects intensity, hat density, filter
- **Position X** = chord voicing shift, evolution parameter
- **Position Y** = bass pitch shift, melody register
- **Stillness** = pad swells (reward for calm)

But now motion ALSO affects the AI:
- High energy -> tension builds faster
- Low energy -> AI might choose "space" or "rest"
- The AI reacts to the world you create

---

## UI ELEMENTS

### Dials (Bottom)
- **pulse**: dust (72 BPM) / gold (88 BPM) / drive (122 BPM) / off
- **depth**: sub / thick / warm / off
- **haze**: clear / fog / glass / heat

### Band Status (Top Left)
Shows what each AI musician is doing:
```
drums: pushing
bass: walking
pad: spread
lead: developing
/ 67%  <- direction and tension
```

---

## SUCCESS CRITERIA

- [x] Dials still work
- [x] Motion still affects sound
- [x] Lo-fi vibe preserved
- [x] AI makes musical decisions
- [x] Agents "hear" each other via shared state
- [x] Decisions affect audio parameters
- [x] Visual feedback shows AI activity
- [ ] Actually sounds like jazz conversation (TESTING NEEDED)
- [ ] No glitches
- [ ] AI calls don't cause lag

---

## KNOWN CONSIDERATIONS

1. **AI Latency** - Calls take 100ms-2s, so decisions are phrase-level, not note-level
2. **Puter.js requires user action** - May need initial consent popup
3. **Fallback** - If AI fails, uses generative patterns (still sounds good)

---

## NEXT STEPS IF NEEDED

1. **Tune the prompts** - Make AI responses more musically appropriate
2. **Add more agent personality** - Different "players" with distinct styles
3. **Better call/response** - More reactive listening between agents
4. **Microphone input** - Let the AI "hear" external sound
5. **Longer memory** - AI remembers what happened in previous phrases

---

*"Jazz is about the conversation, not the notes."*

**Live at:** lacobusgump.github.io/music2.0/

