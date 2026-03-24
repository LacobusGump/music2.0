# Third Parameter: Knee Location b*

**Date:** March 24, 2026

## Finding

The knee location b* (where the Pareto curve changes regime most sharply) is the third parameter. Two-segment fitting at b* collapses error on multi-regime computations.

## Evidence

| Computation | 1-seg error | b* | 2-seg error | Improvement |
|------------|------------|-----|------------|-------------|
| K-means | 10.4% | 0.35 | 1.7% | 84% |
| Search | 2.9% | 0.09 | 0.0% | 100% |
| Filter | 0.6% | 0.02 | 0.0% | 100% |
| Bubblesort | 7.7% | 0.83 | 6.9% | 11% |
| Parity | 0.0% | 0.98 | 0.0% | 0% |

## Interpretation

K-means has two regimes:
- b < 0.35: steep savings from cluster assignment (gas-like within this segment)
- b > 0.35: flat — refinement iterations add little (crystal-like within this segment)

The knee at 0.35 marks the transition. The single power law averages across both regimes. The two-segment fit captures each regime independently.

Bubblesort does NOT have a sharp knee. Its 7.7% error is from smooth curvature mismatch, not regime transition. The third parameter doesn't help here — bubblesort's deviation is a fourth-parameter candidate (curvature smoothness).

## The three-parameter system

1. **R** — phase (problem structure, intrinsic)
2. **f** — efficiency (implementation, extrinsic)
3. **b*** — knee location (regime transition, 0 = no knee, 0 < b* < 1 = multi-regime)

For single-regime computations: b* ≈ 0 or 1 (trivial knee, 2 parameters suffice).
For multi-regime computations: b* marks the transition (3 parameters needed).

## Detection

b* is found by:
1. Fit 2-parameter model
2. Compute residuals at each budget point
3. Find maximum second derivative of residuals
4. That's b*

No hand-tuning. The residuals point to the knee.

## What this means

The model does not fail randomly. It fails specifically on computations with regime transitions, and the transition point b* is the missing parameter. Adding b* reduces K-means error from 10.4% to 1.7%.

Version 1: (R, f) — two parameters, 96% accuracy on most computations
Version 2: (R, f, b*) — three parameters, handles multi-regime computations
