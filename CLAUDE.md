# CLAUDE.md - Session Instructions for GUMP

## What This Is

GUMP (Grand Unified Music Project) is an experimental musical instrument that creates music from physical experience - phone sensors, touch, and eventually sound input.

**Live demo**: lacobusgump.github.io/music2.0/

---

## How to Work on This Project

### First: Read the Minds

Before doing anything, read the `.gump/` directory:

```
.gump/
  vision.md     ← The north star - what we're building
  engineer.md   ← Technical perspective and priorities
  musician.md   ← Musical perspective and theory
  physicist.md  ← Mathematical/physics perspective
  producer.md   ← THE FOURTH MIND - artistry, soul, essence (Rick Rubin inspired)
  dialogue.md   ← Ongoing conversation between the four minds
  state.md      ← Current state, what's next, open questions
```

These files ARE the project memory. They persist across sessions.

### Second: Become the Four Minds

When working on GUMP, think from four perspectives:

1. **THE ENGINEER** - "How do we build it? What are the constraints? What's the fastest path to working code?"

2. **THE MUSICIAN** - "Does it sound good? Does it feel musical? What's the emotional arc?"

3. **THE PHYSICIST** - "What's the underlying structure? Is there a mathematical model that captures this better?"

4. **THE PRODUCER** - "Does this make you FEEL something? What can we REMOVE? Where is the SOUL?"

The Producer is the final arbiter. If it doesn't make you feel something, the other three minds have failed.

Let them argue. Let them propose. The best solutions come from their intersection.

### Third: Update as You Go

When you make progress:
- Update `state.md` with what changed
- Add to `dialogue.md` if there's a significant design decision
- Update individual agent files if their perspective evolved

### Fourth: Push to GitHub

Every session should end with:
```bash
git add -A
git commit -m "Descriptive message

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
git push
```

The repo is at: github.com/LacobusGump/music2.0

---

## Code Structure

Currently everything is in `index.html` (~710 lines). Key sections:

- **STATE** (lines ~27-56): Field position, energy, stillness, harmony
- **MUSIC THEORY** (lines ~58-102): Scales, chords, frequency calculations
- **RHYTHM** (lines ~104-136): Purdie shuffle pattern, BPM, subdivisions
- **AUDIO** (lines ~138-206): Web Audio setup, reverb, delay
- **DRUMS** (lines ~208-319): Kick, snare, hat synthesis
- **MELODY** (lines ~321-368): Continuous voice that follows movement
- **BLOOMING NOTES** (lines ~370-453): Chord tones that spawn from stillness
- **FIELD SHAPING** (lines ~455-494): How input affects musical state
- **RHYTHM ENGINE** (lines ~496-522): Clock and trigger system
- **INPUT** (lines ~524-546): Touch, motion, orientation handlers
- **VISUALS** (lines ~548-640): Canvas rendering
- **LOOP** (lines ~642-661): Main update cycle

---

## Key Design Principles

1. **Real-time is sacred** - Latency under 15ms or it feels broken
2. **The body knows music** - Map gestures to musical intent, not just parameters
3. **Emergence over composition** - Create conditions for music, don't dictate it
4. **Simple inputs, complex outputs** - Anyone can play, masters can explore

---

## Current Priorities

Check `state.md` for the latest, but likely:
1. Gesture detection (buffer accelerometer data, recognize patterns)
2. Harmonic gravity (pitch bends toward consonance)
3. Microphone input (start with onset detection)

---

## Testing

Open `index.html` in a browser. On mobile, you'll need HTTPS (use GitHub Pages or local server with SSL).

For local development:
```bash
npx serve .
# or
python -m http.server
```

Then access via local IP on phone for sensor testing.

---

## Remember

This isn't just a coding project. It's an exploration of how music can emerge from human experience.

The four minds exist to prevent tunnel vision:
- Engineer alone builds something that works but sounds bad
- Musician alone designs something beautiful but impossible
- Physicist alone creates elegant math that nobody can play
- **Producer alone asks: "But does it make you FEEL something?"**

The Producer has veto power. Technical excellence means nothing if there's no soul.

**The E=mc² of GUMP:**
```
gesture → phrase → resolution
```

Everything else serves this core loop.

---

*"The goal is not to make something. The goal is to discover something that already exists."* — The Producer
