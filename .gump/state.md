# Current State

*Last updated: January 21, 2026*

---

## Autonomous Mode: ACTIVE

The Three Minds now run continuously via `gump-loop.js`. Each cycle:
1. Reads context from `.gump/` files
2. Picks the highest priority task
3. Makes changes, commits, pushes
4. Updates this file

**To start**: `npm install && npm start`
**Single run**: `npm run once`

---

## Where We Are

### Completed Milestones
- [x] Basic Web Audio synthesis (oscillators, filters, effects)
- [x] Device motion/orientation capture
- [x] Touch input mapping
- [x] Visual feedback system (canvas)
- [x] Purdie shuffle drum pattern
- [x] Position-based harmony (X=root, Y=chord quality)
- [x] Blooming notes from stillness
- [x] Continuous melody from movement
- [x] Reverb + delay effects chain

### Current Version
- **Commit**: 5a7c07e "Position is harmony. Stillness blooms. Movement is melody."
- **Lines of code**: ~710 (single index.html file)
- **Live at**: lacobusgump.github.io/music2.0/

---

## What's Next

### Immediate Priorities (This Session)
1. [ ] Implement gesture buffer (store 500ms of accelerometer data)
2. [ ] Basic gesture detection: tap, swipe, shake, hold
3. [ ] Harmonic gravity model (pitch bends toward consonance)

### Short-Term Goals
- [ ] Microphone input (start with onset detection, not full pitch)
- [ ] Session memory (localStorage - remember user patterns)
- [ ] Modular code architecture (split index.html into modules)

### Medium-Term Goals
- [ ] Gesture-to-phrase mapping (each gesture triggers musical response)
- [ ] Pitch detection from microphone
- [ ] User pattern learning (the app adapts to YOUR gestures)

### Long-Term Vision
- [ ] Cross-session memory (your instrument evolves over weeks)
- [ ] Social/shared experiences (jam with others?)
- [ ] Hardware integration (MIDI out? Custom controllers?)

---

## Open Questions

1. **Architecture**: Stay single-file for simplicity, or modularize for maintainability?
   - *Leaning toward*: Modularize when we add microphone input

2. **Gesture vocabulary**: How many gestures before it's overwhelming?
   - *Leaning toward*: Start with 5 (tap, swipe, shake, hold, circle)

3. **Harmonic system**: Western 12-tone, or explore microtonal?
   - *Leaning toward*: Stay 12-tone for now, but design for extensibility

4. **Memory scope**: How much should the app remember?
   - *Leaning toward*: Session-level first, then persistent if it proves valuable

---

## Experiments Tried

### What Worked
- Purdie shuffle ghost notes (creates groove feel)
- Stillness → spawning notes (reward for patience)
- Y-axis → filter frequency (intuitive bright/dark mapping)
- Delay feedback tied to energy (movement creates echoes)

### What Didn't Work
- Direct position → pitch (too twitchy, no musicality)
- Fixed chord types per Y region (too discrete, needs smoothing)
- Full velocity → volume mapping (too sensitive to noise)

### What We Haven't Tried Yet
- Gesture recognition
- Microphone input
- Harmonic gravity
- Mode switching (Lydian ↔ Locrian spectrum)
- Rhythmic entrainment (app syncs to user's pulse)

---

## Technical Notes

### Performance Observations
- Runs smooth on iPhone 12+ and modern Android
- Older devices may struggle with visual effects
- Battery drain is noticeable after ~10 min continuous use

### Known Issues
- Device motion permission UI varies by browser
- Some Android browsers have inconsistent accelerometer access
- Safari sometimes requires user gesture before audio plays

### Dependencies
- None (vanilla JS, Web Audio API, Canvas)
- No build step required
- Works offline once loaded

---

## The Three Minds' Assignments

| Agent | Current Focus | Status |
|-------|--------------|--------|
| Engineer | Gesture buffer implementation | Ready to code |
| Musician | Gesture → musical response mapping | Designing |
| Physicist | Harmonic gravity math | Formulating |

---

*Next session: Implement gesture detection prototype*
