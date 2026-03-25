# The Sieve's R: CORRECTED

**Date:** March 24, 2026

## Initial finding (discrete model)

R ≈ 0.366 ± 0.015 across N=50 to N=10,000. Looked constant. Looked like 1/e.

## Correction (continuous Mertens frontier)

R is NOT constant. It decreases with N:

| N | R (exact) | R (analytical) |
|---|-----------|---------------|
| 10² | 0.625 | 0.680 |
| 10³ | 0.494 | 0.531 |
| 10⁴ | 0.407 | 0.439 |
| 10⁵ | 0.354 | 0.376 |
| 10⁶ | — | 0.330 |
| 10²⁰ | — | 0.131 |

R → 0 as N → ∞. The 1/e claim is KILLED.

## What IS real

1. The sieve is GAS at every scale (R < 1 always). Small primes do disproportionate work.
2. R decreases with N: the sieve becomes MORE compressible at larger scales.
3. Scaling: R ~ C·ln(ln(N))/ln(N), from Mertens' theorem.
4. This connects R to the prime number theorem: density ~ 1/ln(N) drives increasing gas-ness.

## What was wrong

The discrete model (each prime = one operation) had too few data points. The constant R was an artifact of discretization, not a structural invariant. The continuous frontier is the correct test.

## Lesson

Always use the highest-resolution frontier. Discrete approximations can hide scale dependence.
