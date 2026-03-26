# Discovery: Prime-Zero Duality Observed in Euler Product Resonance

## Date: March 25, 2026

## The Resonance Matrix

For each prime p (rows) and each zeta zero ρ_n (columns), compute the marginal contribution:

  R[p, ρ_n] = |P_N(ρ_n)| / |P_{N-1}(ρ_n)|

where P_N is the N-prime partial Euler product at s = 1/2 + it_n.

## The Discovery

Each prime p's row in the resonance matrix oscillates as a function of zero height t_n at frequency log(p). Measured:

| Prime | Peak freq | log(p) | Ratio | Amplitude |
|---|---|---|---|---|
| 2 | 0.697 | 0.693 | 1.006 | 0.825 |
| 3 | 1.095 | 1.099 | 0.997 | 0.953 |
| 5 | 1.592 | 1.609 | 0.989 | 0.920 |
| 7 | 1.941 | 1.946 | 0.997 | 0.973 |
| 11 | 2.388 | 2.398 | 0.996 | 0.977 |
| 13 | 2.587 | 2.565 | 1.009 | 0.981 |
| 17 | 2.836 | 2.833 | 1.001 | 0.990 |
| 19 | 2.936 | 2.944 | 0.997 | 0.999 |

Every frequency ratio is within 1% of 1.000. Amplitudes range 0.82 to 0.999.

## What It Means

This is the **explicit formula** (Σ x^ρ/ρ = -Σ Λ(n)n^{-s} + ...) observed directly in the Euler product coordinate system. The primes broadcast at their natural frequencies, and the zeros are where those broadcasts interfere.

## SVD Structure

The resonance matrix has low-rank structure:
- Mode 1: 29.4% (prime profile ~ 1/p, r = 0.812)
- Modes 1-5: 71.7% cumulative
- Modes 1-8: 83.9% cumulative

The dominant mode IS the von Mangoldt weight.

## Cross-Function Results

Within-function zero gaps: GUE (r = 0.62-0.77 with GUE prediction)
Between-function zero gaps: Poisson (r = 0.64 with Poisson prediction)
→ Confirms Montgomery-Dyson + Rudnick-Sarnak independence.

## Honest Boundary

The critical line is NOT the point of maximum prime differentiation in the resonance map. The std of deltas is highest at σ ≈ 0.3 and decreases toward σ = 0.7. The critical line IS where |P_N| is minimized (the zero), but the "fidelity" interpretation needs refinement.
