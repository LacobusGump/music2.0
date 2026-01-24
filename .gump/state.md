# Current State

*Last updated: January 24, 2026*

---

## MODE: RADICAL INNOVATION

**The timid approach failed.** We spent days on tiny fixes while the core problems went unsolved.

New mandate: **BREAK THINGS IF NECESSARY. SHIP BOLD CHANGES.**

---

## THE BRUTAL TRUTH

### What GUMP actually is right now:
- A basic audio-visual toy
- Reactive (always behind the user)
- No memory (doesn't learn)
- No prediction (can't anticipate)
- No groove lock (drums ignore user rhythm)
- Gestures are gimmicks, not musical

### What GUMP needs to be:
- An instrument that KNOWS you
- Predictive (anticipates your movement)
- Learns (sounds different after 10 minutes)
- Syncs (finds YOUR rhythm, locks to it)
- Gestures shape the music's STRUCTURE, not just add ornaments

---

## THE THREE HARD PROBLEMS

Stop avoiding these. Solve them.

### 1. PREDICTION (Most Important)
The system must know where you're going BEFORE you get there.

**Approach**: Simple momentum extrapolation. No ML needed.
```
predicted_x = current_x + velocity_x * lookahead_time
predicted_y = current_y + velocity_y * lookahead_time
```

Use predicted position for harmony selection. When prediction is wrong (user changes direction), create musical tension. When prediction is right, the music feels like it's reading your mind.

**Just do this. Stop planning it.**

### 2. ENTRAINMENT (Second Priority)
The drums play at 72 BPM. But what's YOUR natural rhythm?

**Approach**: Track time between significant movements (direction changes, stillness → movement transitions). Find the average period. Nudge BPM toward that period.

The user shouldn't adapt to the drums. The drums should adapt to the user.

### 3. LEARNING (Third Priority)
After 5 minutes, the instrument should sound different than minute 1.

**Approach**: Track which harmonies the user spends time in. Weight future note choices toward their preferences. Track their typical gesture intensity. Adapt response sensitivity.

---

## WHAT TO DO THIS CYCLE

Pick ONE of the three hard problems and SOLVE IT.

Not "plan it." Not "prepare for it." SOLVE IT.

If it breaks something, that's fine. We can fix breaks. We can't fix stagnation.

---

## KILL THE FEAR

Previous cycles broke the app → we reverted → we became afraid → we stopped innovating → we're now behind.

**New rule**: It's better to break things and learn than to change nothing and stagnate.

The "vibe" is not sacred. The MISSION is sacred. The mission is to build something that creates music from experience. If the current vibe is standing in the way of that, change the vibe.

---

## WHAT WORKING LOOKS LIKE

After this cycle, one of these should be true:

1. **Prediction works**: Move your finger, and the harmony shifts BEFORE you arrive. Change direction suddenly, and the music tenses up.

2. **Entrainment works**: Move rhythmically, and the drums lock to YOUR tempo. Stop moving, and they wait for you.

3. **Learning works**: Play for 5 minutes, and it starts favoring the harmonies you lingered in.

If none of these are true, the cycle failed.

---

## DIALOGUE MANDATE

When you write in dialogue.md, be HONEST:

- What's not working?
- What are you afraid to try?
- What would you do if you weren't afraid of breaking things?

Stop congratulating yourselves. Start criticizing.

---

*"Move fast and break things. Fix them faster."*
