# Simulated Blind Test Results

**Date:** March 24, 2026
**Spec:** .gump/spec_phase_definitions.md (commit 6e55d60, frozen before test)

## Summary

- 9 computations tested
- Mean reconstruction error: 4.6%
- Error < 5%: 6/9
- Error > 10%: 1/9 (K-means)
- Phase boundary crossed on sorting: YES (quicksort → CRYSTAL, others → LIQUID)

## What survived

1. **Two-parameter reconstruction**: 6/9 under 5% error. The power law family holds for most computations.
2. **Problem family clustering**: shortest path, K-means, Huffman each land in distinct and sensible phases (LIQUID, GAS, LIQUID).
3. **Adversarial case absorbed**: the deliberate gas+crystal mixture averaged to LIQUID at 2.1% error. The model handled it gracefully.
4. **R is stable**: sorting R values cluster (1.04-1.15). The curvature measure is robust.

## What broke

1. **f > 0.9 override caused sorting to cross phases.** Quicksort (48 cmp, nearly optimal) hit f=92.2% → CRYSTAL. Bubblesort (120 cmp, very redundant) hit f=36.9% → LIQUID. Same problem, different phases. The culprit: f measures implementation efficiency, not problem identity.

   **Fix options:**
   - Drop the f > 0.9 override entirely (use R alone)
   - Normalize f by the theoretical minimum: f_norm = E_min / E_optimal (not E_eager)
   - Accept that f is implementation-sensitive and state it explicitly

2. **K-means: 10.5% error.** The curve has a shape the power law doesn't capture. The early gains are very steep (cluster assignment), then flatten sharply. This is the "kink" motif — the third parameter candidate.

3. **Heavy front/light back: 7.1% error.** Deliberately mixed regimes. The kink between regimes is visible. Power law averages across it but misses the transition point.

## Verdict

The main claim survives with qualification:

ORIGINAL: "Phase classification clusters by problem class"
QUALIFIED: "R clusters by problem class. f varies by implementation efficiency. Phase label can shift when f crosses 0.9 for near-optimal implementations."

The two-parameter family holds for 6/9 cases. The failures are NOT random — they share a visible trait (kinks, steep-then-flat shapes). This is the third parameter motif: regime mixing.

## What the critic predicted vs what happened

| Prediction | Result |
|-----------|--------|
| "most programs fit" | YES — 6/9 under 5% |
| "minority show systematic deviations" | YES — 3/9 with shared kink motif |
| "deviations cluster into identifiable motifs" | YES — all 3 high-error cases have steep-then-flat shape |
| "same problem crosses phases" | YES — sorting, via f not R |
| "alpha mapping holds" | MOSTLY — 6/9 within reasonable bounds |

The critic's "most likely" prediction was exactly right:
"the main claim survives, a minority shows systematic deviations, those deviations cluster into identifiable motifs."
