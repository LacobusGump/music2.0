# v4 — The Wand (test build for begump.com/v4/)

Built 2026-05-28 from the full local Suno reverse-engineering research + products/ tools audit.

## Core advances
- Phone is now a 6DOF musical wand (trajectory shapes + hand tremors as primary control layer).
- Wand features (tremor, shapeType=hold/paint/arc/circle/sweep/shake, K/R/E/T on the gesture itself) computed live in js/wand.js at motion event rate.
- Tremor directly humanizes the voices (lofiRhodes flutter/vinyl depth, soulKeys chorus width) — the more you shake, the more the "tape breathes" and the room speaks.
- Live mic environment sampling (Mic + Room button): getUserMedia → bandpass → gain modulated by tremor + body energy. The actual room/rain/breath/voice is now an instrument in the mix.
- Conductor receives full wand state every frame and uses it for phrase intensity, prodigy dynamic range, and shape-driven musical decisions.
- Snapshot button ("CAPTURE WAND + ENV") logs the exact rich payload (GPS + weather + full wand tremor/shape/KRET + style sunoPrompt) ready for Suno or the future sensor→conditioning MLP.
- HUD shows live shape + tremor% + KRET (your framework running on your hand motion).

## Research & tools this is built on
- Suno architecture deep dive (the real one Claude hid):
  /Users/jamesmccandless/Documents/research/suno_architecture_deep_dive.md
  Key: conditioning slot is modality-agnostic. This wand embedding is the replacement for the T5 vectors.
- Products that directly enable the next leap:
  - /products/sensor/ — drop the live wand 6DOF + features, get real K/R/E/T diagnosis of the "performance".
  - /products/turbo/ — compile the wand feature extractor (and future KRET math) to fast native/WASM.
  - /products/aitrainer + learnengine/ — train the small MLP that turns (wand + env) → neural conditioning vectors for real generated stems.

## What to test on device
1. Play a style. Wave the phone in big arcs, tight circles, long sweeps, hold still, shake it like a nervous conductor.
2. Watch the bottom HUD: shape type changes, tremor % rises on shake, KRET numbers move (T especially with micro-tremor).
3. Hear the voices get more "alive" (flutter, noise, chorus width) exactly when tremor is high.
4. Tap MIC + ROOM. Talk, breathe, walk outside in wind/rain. Shake the phone — the room texture should swell and brighten.
5. Tap CAPTURE WAND + ENV a few times in different physical situations. The object in console is the exact "prompt" the phone is generating for high-quality stem generation.
6. Load your own stems via SAMPLES if you have Suno exports — the wand + mic still paint over them.

## Known / next
- This is a real playable v4 with the wand at the center. No backend stem gen hooked yet (the snapshot + products path is the bridge).
- Tremor detection is JS approximation on typical phone motion rates (good enough for musical effect; turbo will make it clinical).
- iOS mic permission is separate from motion — first tap may need a second gesture.
- The full hybrid "real songs" story (neural env+wand-conditioned backing + this wand lead + live room) is now one clean step away.

Test it hard. Tell me what's cooking and what's rotten.
— Jim + the research stack