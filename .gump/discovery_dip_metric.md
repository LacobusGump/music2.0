# The Dip Metric on L-Functions

## Definition
For each L-function L(s, χ), compute dip profiles at its zeros: for each zero at height t, evaluate the 200-prime partial Euler product magnitude for every candidate character. The centroid of these profiles defines a point in profile space. The Euclidean distance between centroids defines the dip metric d_dip(L₁, L₂).

## What it correlates with

| Quantity | r with dip metric |
|---|---|
| Pretentious distance D(χ₁, χ₂) | +0.33 (raw) / +0.17 (rank) |
| Character overlap (fraction same χ(p)) | -0.30 (raw) / -0.21 (rank) |
| Kronecker correlation | -0.24 (rank) |
| Shared prime factors (gcd > 1) | +0.18 |
| **log(q₁ × q₂) — RESIDUAL after pretentious** | **-0.57** |

## The two components

1. **Character geometry**: The dip metric partially recovers the pretentious distance. L-functions with similar characters (agreeing at many primes) have similar dip profiles.

2. **Conductor scale**: After removing the pretentious component, the residual correlates with log(conductor product) at r = -0.57. Larger conductors → closer in dip space. This reflects zero density: higher conductor → denser zeros → more averaged profiles → less distinctive.

## What's new

The pretentious distance (Granville-Soundararajan) lives on the prime side and doesn't see the conductor directly. The dip metric lives on the zero side and sees BOTH the character pattern AND the conductor through zero density. The conductor-dependent component is information from the zero side with no direct prime-side counterpart in the pretentious framework.

## Blind identification accuracy

| Window size | Accuracy |
|---|---|
| k=1 (single zero) | 42% (chance = 17%) |
| k=5 | 62% |
| k=9 | 83% |
| Centroid argmin | 100% (every family correctly self-identifies) |

## Honest boundary
- The r = 0.33 correlation with pretentious distance is moderate, not strong
- R² = 0.03 for the rank-based metric: not an isometry
- The metric is noisier than the pretentious distance
- The conductor signal (r = -0.57) could be an artifact of zero density normalization
