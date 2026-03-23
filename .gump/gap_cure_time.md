# Cure Time Gap Analysis

**Concept:** Music needs 6-8 repetitions before random sounds become music (Margulis 2014). A GUMP session should start "wet" (open, malleable) and gradually "cure" (crystallize around the user's patterns).

---

## 1. Does the session start wide-open and gradually tighten?

**Partially. Three things tighten; the main parameters don't.**

What exists:
- `_sessionPhase` (flow.js:63) has three phases: listening (0-3s), alive (3-12s), evolution (12s+). Phase 0 caps `fadeCeiling` at 0.45, phase 1 at 0.72, phase 2 at 1.0 (flow.js:426-428). This controls *volume*, not musical openness.
- `gravitateDegree()` (harmony.js:427-457) constrains phase 0 to triad tones [0,2,4] only. After phase 0, the full scale opens. This is binary — not a gradual loosening.
- Peak handler (flow.js:1116) gates peaks behind `_sessionPhase === 0` — no peak voices in phase 0.

**Gap:** The tightening is backwards. Phase 0 is the most *constrained* (triad-only), not the most open. For cure time, phase 0 should be the *widest* — any note is fine because the user is exploring. The system should tighten toward the user's discovered vocabulary, not start tight and open up.

Missing: No parameter narrows available scale degrees, note interval, or sweet spot pull as the session matures. `DEFAULT_SWEET_SPOT_PULL` is a constant 0.45 (harmony.js:288). `noteInterval` is fixed per lens config (flow.js:500). Neither evolves with session time.

---

## 2. Does motif memory kick in after enough repetitions?

**Yes, but it has no concept of repetition count or cure threshold.**

What exists:
- Motif buffer records intervals every 4 notes (harmony.js:267-268, 382-391). Stores up to 6 motifs (`MOTIF_MAX`, harmony.js:268).
- `applyMotifGravity()` (harmony.js:518-538) matches recent intervals against stored motifs and applies 30% pull (`MOTIF_PULL = 0.30`, harmony.js:269).

**Gap:** The pull strength is constant from the first match. Margulis says 6-8 repetitions create the sense of musicality. The motif system should:
- Track how many times each motif has been repeated (currently not tracked — motifs are just stored and pattern-matched).
- Scale `MOTIF_PULL` from ~0.05 on first appearance to ~0.50 after 6+ repetitions.
- Have a "cured motif" category where heavily-repeated patterns become the harmonic identity of this session.

Currently: `_motifs` is a flat array with no repetition counter (harmony.js:271). Each motif is stored once, old ones are shifted off (harmony.js:389). A motif played 20 times looks the same as one played once.

---

## 3. Does harmonic gravity strengthen over time?

**No. Gravity parameters are static.**

What exists:
- `DEFAULT_SWEET_SPOT_PULL = 0.45` (harmony.js:288) — never changes.
- `MOTIF_PULL = 0.30` (harmony.js:269) — constant.
- `_gravityTonicDur = 20` (harmony.js:242) — resets to 18-28s random after each cycle (harmony.js:712), not session-aware.
- Harmonic rhythm min interval is always 4000ms (harmony.js:611).
- `gravitateDegree()` has no session-time weighting.

**Gap:** None of these strengthen as the session matures. For cure time:
- Sweet spot pull should increase from ~0.25 (wet) to ~0.60 (cured) over the first 2-3 minutes.
- Harmonic gravity tonic duration should shorten as the user develops a center — the music "knows where home is" faster.
- The tension-resolution pull (harmony.js:442-449, the 70% pull toward resolution tones) should strengthen as the session develops a melodic center.

---

## 4. Is there a session arc from exploration to identity to music?

**There is a three-act arc, but it changes scale content, not openness.**

What exists:
- Three-act system (flow.js:1271-1285): Act 0 = emergence (0-90s), Act 1 = sus4 (90-300s, replaces 3rd with 4th), Act 2 = homecoming (300s+, restores original mode).
- Epigenetic evolution (flow.js:1252-1264): Advances generations based on accumulated energy. Increases `spaceMix`, `massiveFloor`, raises `energyGate`. This is a *growth* arc, not a cure arc.
- Journey stages (flow.js:1340-1417): Timer-driven crossfade between 4 stages (Drift, Still Water, Tundra, Dark Matter). These change palette/voice/mode — they're landscape changes, not crystallization.
- Prodigy (flow.js:614-739): Tracks energy arc (rising/falling/plateau). Makes mix decisions (reverb, filter, dynamic range). No concept of session maturity or pattern recognition.

**Gap:** The arc changes *what* the music is (scale, voices, reverb) but not *how tightly it holds to the user's patterns*. The journey is scenic, not personal. Nothing says "you've been playing 3-5-1 for two minutes, that's now YOUR melody." The three-act system is clock-driven (90s, 300s) rather than repetition-driven.

---

## 5. Does Prodigy track energy arc for a cure trajectory?

**No. Prodigy is reactive, not accumulative.**

What exists:
- `_prodigy.energyHistory` (flow.js:98) — 16-sample rolling window, ~4 seconds of data.
- Arc classification: rising/falling/plateau/neutral (flow.js:640-644). Purely instantaneous.
- `_prodigy.degreeHeat` (flow.js:104) — tracks which degrees are used most, with 0.995 decay. This is the closest thing to pattern memory, but it's not exposed or used for cure logic.
- Moment recognition (flow.js:717-735) — fires once per 30s when conditions align. Not cure-related.

**Gap:** `degreeHeat` (flow.js:104) could be the foundation of cure time, but it currently only accumulates — nothing reads it back to influence gravity, motif pull, or session arc. It decays at 0.995 per frame (~16ms), which means half-life of ~2.2 seconds. Far too fast for cure time (needs half-life of 30-60 seconds to track session-level patterns).

---

## Summary: What Cure Time Needs

| Need | Current State | Required Change |
|------|--------------|-----------------|
| Wide-open start | Phase 0 is triad-locked (narrow) | Invert: start with low gravity, full scale |
| Gradual tightening | No parameter evolves with session | `sweetSpotPull`, `MOTIF_PULL`, `gravitateDegree` pull must increase over 2-3 min |
| Repetition counting | Motifs stored without rep count | Add `count` field to each motif, scale pull by count |
| Cure threshold | Nothing fires at 6-8 reps | When a motif hits 6 reps, promote it to "identity motif" with stronger pull |
| Session-aware gravity | All gravity params are constant | `_gravityTonicDur`, `DEFAULT_SWEET_SPOT_PULL`, resolution pull must read session maturity |
| degreeHeat as memory | Exists but unused, decays too fast | Slow decay to 0.9998, feed back into gravitateDegree and motif system |
| Arc: explore -> identity -> music | Three-act is scale-change, not pattern-change | New arc driven by motif repetition count, not clock |

**The engine has all the raw materials. The motif system, degreeHeat, sweet spots, and gravity are all in place. What's missing is the wire that connects repetition count to these parameters — the cure trajectory itself.**

Key files: `js/flow.js` (session arc, prodigy), `js/harmony.js` (motif memory, gravity, sweet spots).
