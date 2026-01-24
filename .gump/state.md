# Current State

*Last updated: January 23, 2026*

---

## MODE: CAREFUL BREAKTHROUGHS

Two updates per day. 12 hours between cycles.
Think deeply. Ship carefully. **DON'T BREAK WHAT WORKS.**

Previous cycles broke the vibe. We reverted. Don't let it happen again.

---

## THE GOLDEN RULE

**PRESERVE THE VIBE.** The current app feels good. Enhance it, don't replace it.

Before shipping ANY change:
1. Load index.html locally
2. Move around, listen
3. Does it still feel musical?
4. Only then commit and push

---

## Where We Are

### Foundation (WORKING - PROTECT THIS)
- [x] Web Audio synthesis (oscillators, filters, effects)
- [x] Device motion/orientation capture
- [x] Touch input mapping
- [x] Visual feedback (canvas)
- [x] Purdie shuffle drum pattern
- [x] Position-based harmony (X=root, Y=chord quality)
- [x] Blooming notes from stillness
- [x] Continuous melody from movement
- [x] Reverb + delay effects chain
- [x] Gesture buffer (500ms rolling window)
- [x] Gesture detection (SHAKE, SWIPE, HOLD, CIRCLE)
- [x] Gesture musical responses
- [x] Swipe always responds (position-based fallback)
- [x] Circle single-entity fallback (rhythmic pulse)

**Live at**: lacobusgump.github.io/music2.0/

---

## JUST COMPLETED

### Code Review & Observation Cycle

Reviewed the full codebase. All gesture systems are working correctly:

- **SHAKE**: Finds nearby entities, applies tremolo. Works.
- **SWIPE**: Creates melodic run. Falls back to field position when no entity nearby. Works.
- **CIRCLE**: Arpeggiates nearby entities. Falls back to rhythmic pulse for single entity. Works.
- **HOLD**: Deepens reverb, boosts nearby entities. Works.

Gesture thresholds look reasonable:
- `SHAKE_ENERGY: 0.15` - requires intentional shaking
- `SWIPE_VELOCITY: 0.08`, `SWIPE_LINEARITY: 0.7` - catches clear directional swipes
- `CIRCLE_ROTATION: 1.5π` (270°) - needs 3/4 of a circle
- `HOLD_DURATION: 400ms` - patience rewarded
- `COOLDOWN: 200ms` - prevents gesture spam

**Observation**: The system is stable. No code changes needed this cycle.

---

## NEXT TASK (ONE THING ONLY)

### Harmonic Gravity (Gentle)

Ready for implementation in next cycle. The concept:

- Notes near the cursor gently bend toward consonant intervals
- Not snapping (robotic), but *leaning* (organic)
- The system develops *taste* - prefers consonance, allows dissonance
- User can fight against the gravity for tension

**Implementation approach** (from dialogue.md):
- Model harmonic space as potential energy landscape
- Tonic is bottom of a well
- Moving away costs energy
- System applies gentle restoring force (pitch bend toward nearest consonance)

**Key constraint**: This must be SUBTLE. If it's too aggressive, it will break the vibe. Start with almost imperceptible bending and increase only if it feels right

---

## FUTURE TARGETS (NOT YET)

Save these for later cycles:
- Prediction (momentum-based)
- Entrainment (detect user's rhythm)
- Harmonic gravity (spring physics)
- Microphone input

One thing at a time. Don't rush.

---

## What Works (NEVER BREAK THESE)

- The Purdie shuffle groove feel
- Stillness → blooming notes reward
- Position → harmony mapping
- The visual feedback aesthetic
- The overall musical vibe
- **Gesture → sound mappings (NEW)**

---

## What Broke Before

Previous cycles tried to add prediction and harmonic gravity too aggressively.
They rewrote too much. The app stopped feeling musical.

**Lesson**: Add TO the system. Don't redesign it.

---

## The Three Minds' Focus

| Mind | Task | Rule |
|------|------|------|
| Engineer | Test and tune | Monitor for issues |
| Musician | Listen critically | Does it feel musical? |
| Physicist | Wait | Not this cycle |

---

*"The vibe is sacred. Protect it."*
