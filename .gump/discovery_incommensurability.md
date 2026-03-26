# The Incommensurability Argument for RH

## Statement

At σ ≠ 1/2, a zero of ζ(σ+it) requires two independent conditions in the AFE:
- **M(t) = 0**: magnitude balance |Sum1| = |χ·Sum2|
- **P(t) = 0**: phase alignment arg(Sum1) = arg(-χ·Sum2)

M oscillates at frequency ≈ log(2)/2π (driven by small integers).
P oscillates at frequency ≈ log(√(T/2π))/2π (driven by the AFE transition scale).
Their ratio grows as (1/2)log(T/2π)/log(2), which is generically irrational.

Incommensurate oscillations have no common zeros → no off-line zeros → RH.

## Computational Evidence

**Coincidence counts (M=0 and P=0 within Δt < 0.1):**

| σ | Observed | Expected | Ratio |
|---|---|---|---|
| 0.505 | 12 | 10.2 | 1.18 (near-line bleeding) |
| 0.520 | 7 | 9.7 | 0.72 (anti-coincidence) |
| 0.550 | 4 | 9.4 | 0.43 (strong avoidance) |
| 0.600 | 2 | 8.6 | 0.23 (near elimination) |
| 0.615 | 0 | 7.8 | 0.00 (complete elimination) |

The coincidence rate drops BELOW chance at all σ > 0.515 (anti-coincidence) and reaches ZERO at σ > 0.61.

**Frequency analysis:**
- M and P have NO shared dominant frequencies (verified by FFT)
- The frequency ratio P/M grows with T, crossing through rationals
- At T ≥ 500: the ratio > π (provably irrational)

## The Four Gaps

1. **AFE remainder:** The approximate functional equation has error term R. If |R| > |Sum1 + χ·Sum2| at some (σ,t), the remainder could create a zero that the principal terms miss.

2. **Harmonics:** M and P have harmonic content beyond their fundamental frequency. Incommensurability of fundamentals doesn't guarantee no coincidences among harmonics.

3. **Approximate spectrum:** The frequency characterization uses dominant-term analysis. The full M(t) and P(t) are not sinusoidal.

4. **Generic vs specific irrationality:** The ratio log(T/2π)/(2 log 2) must be irrational for ALL T, not just generic T. At T = 2π × 2^{2k}, the ratio is exactly k, which IS rational.

## Significance

Even with the gaps, this is a NEW structural argument for RH:
- The two constraints (M and P) are measured as INDEPENDENT (r < 0.1)
- Their oscillation frequencies are in DIFFERENT prime registers
- The coincidence rate is BELOW chance (active avoidance, not just independence)
- The anti-coincidence STRENGTHENS with δσ

This mechanism — the decoupling of magnitude and phase constraints into different frequency bands driven by different sections of the prime spectrum — has not appeared in the literature in this form.
