# Kill Test: Representation Invariance

**Date:** March 24, 2026
**Question:** Does the phase classification hold across different implementations of the same function?

## Result: CLUSTERING HOLDS

| Problem | Implementations | Areas | Phase | Drift |
|---------|----------------|-------|-------|-------|
| Sorting 8 | merge, bubble, selection, insertion | 0.897-0.934 | ALL CRYSTAL | ±0.04 |
| Sorting 5 (optimal) | 7 comparisons | 0.999 | CRYSTAL | — |
| Search 64 | linear, linear-2x (redundant) | 0.521-0.589 | BOTH LIQUID | ±0.07 |
| Filter 32 | threshold, compare | 0.516-0.644 | BOTH LIQUID | ±0.13 |
| Parity | 32, 64, 128 bit | 0.998-1.000 | ALL CRYSTAL | ±0.002 |

## Key findings

1. **Phases cluster by problem, not by implementation.** No implementation crosses phase boundaries.

2. **Drift exists but is bounded.** Worst drift: filter (0.516 vs 0.644 = ±0.13). Still within LIQUID phase.

3. **The minimum erasure (floor) is perfectly invariant.** Sorting → log₂(8!) = 15.3. Search → log₂(64) = 6. Parity → N-1. The floor is the problem's intrinsic information content.

4. **The area measures how far above the floor an implementation sits.** More redundant implementations (bubble sort, linear-2x search) have slightly lower area because they have more compressible slack.

5. **Optimal implementations approach area → 1.0.** The 7-comparison optimal sort has area = 0.999. Binary search has area = 1.000. When the implementation is already optimal, there's nothing to compress.

## The claim (survived)

The phase classification is a **robust statistical property of the computational problem**, not an exact invariant. Different implementations of the same problem cluster within the same phase, with bounded drift proportional to the implementation's redundancy.

Reframe: "phase is a robust property, not a point estimate." The phase boundaries (0.3, 0.7) could be refined with more data, but the clustering is real.

## What this means

Before optimizing ANY computation:
1. Compute the area (one number)
2. If CRYSTAL (> 0.7): don't bother, the cost is structural
3. If LIQUID (0.3-0.7): optimize selectively, moderate payoff
4. If GAS (< 0.3): optimize aggressively, huge payoff

This recommendation holds regardless of HOW the computation is implemented.
