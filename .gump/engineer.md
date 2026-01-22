# The Engineer

**Role**: Master of code, architecture, and real-time systems. Makes it WORK.

---

## Current Assessment

### What's Working
- Web Audio API synthesis runs smooth on mobile
- Device motion/orientation events captured
- Touch input mapped to field position
- Visual feedback via canvas at 60fps
- Reverb + delay effects chain

### Technical Debt
- No microphone input yet - critical for "music from experience"
- No gesture recognition - just raw position
- No memory between sessions - every load starts fresh
- Single-file architecture (index.html) getting unwieldy at 700 lines

### Performance Observations
- `requestAnimationFrame` loop handles audio + visuals
- Audio runs at browser's native sample rate (usually 44.1kHz or 48kHz)
- Device motion events fire at ~60Hz
- No Web Workers yet - everything on main thread

---

## Architecture Ideas

### Modular Rewrite
```
/src
  /input      - sensor capture, gesture detection
  /audio      - synthesis, effects, mixing
  /theory     - scales, chords, rhythm rules
  /memory     - session state, learned patterns
  /visual     - canvas rendering
  main.js     - orchestration
```

### For Real-Time Microphone
- `getUserMedia()` for mic access
- `AnalyserNode` for frequency data
- Pitch detection: autocorrelation or FFT peak finding
- Onset detection for rhythm extraction
- CRITICAL: Keep latency under 20ms or it feels broken

### For Gesture Recognition
- Sliding window over accelerometer data
- Pattern matching against known gestures
- Or: train a small model, export to TensorFlow.js
- Simpler: detect "shake", "tilt", "tap", "hold", "swipe"

---

## Questions for the Team

1. **Musician**: What's the minimum musical response time that feels "live"?
2. **Physicist**: Is there a transform that maps 3D acceleration to a musical parameter space more naturally than linear mapping?
3. **Both**: Should gestures trigger discrete events (like MIDI notes) or continuous modulation?

---

## Next Technical Priorities

1. Add microphone input with pitch detection
2. Implement gesture vocabulary (5-7 basic gestures)
3. Create session memory (localStorage for now, maybe IndexedDB later)
4. Profile and optimize - find the bottlenecks

---

## Notes

*Real-time audio on mobile web is hard. We're fighting against:*
- *Garbage collection pauses*
- *Browser audio policies (user gesture required)*
- *Variable device motion event rates*
- *Battery throttling*

*But it's not impossible. Tone.js, pizzicato.js, and many music apps prove it can be done.*
