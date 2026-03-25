# The Sieve's R: Constant at 1/e?

**Date:** March 24, 2026

## Finding

The sieve of Eratosthenes, treated as a computation, has R ≈ 0.366 ± 0.015 across 3 orders of magnitude (N=50 to N=10,000). This is GAS phase.

R is constant. The sieve's curvature is a structural invariant of the prime distribution.

## The 1/e connection

R_sieve = 0.366. 1/e = 0.3679. Difference: 0.002 (within noise).

1/e appears in:
- Secretary problem / optimal stopping: reject first N/e, then pick
- Derangement probability: fraction with no fixed point
- Mertens' theorem: Π(1-1/p) ~ e^{-γ}/ln(N)

The sieve IS an optimal stopping problem: small primes do disproportionate work (eliminate half, third, fifth of numbers). By prime ~√N, most composites are already found. The "early work dominates" signature is exactly GAS phase.

## What this means

The prime distribution's compressibility is a structural constant ≈ 1/e. This means:

1. The sieve's "early primes" capture ~1-1/e ≈ 63% of the total composite elimination with the first fraction of steps
2. The remaining primes add diminishing returns — the GAS curve
3. This ratio is SCALE-INVARIANT — same R at N=50 and N=10,000

## Status

SUGGESTIVE, not proven. The 1/e connection needs:
- Larger N (100K, 1M) to confirm stability
- Analytical derivation of R for the sieve from Mertens' theorem
- Comparison to other sieves (Atkin, segmented, wheel)

If R_sieve = 1/e exactly, that would connect the phase framework directly to the prime number theorem through Mertens' constant.
