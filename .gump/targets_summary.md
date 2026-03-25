# Targets Summary — March 26, 2026

## Target 1: Primes in Short Intervals
**Result:** Variance of π(x+y)-π(x) is 2.4x below Gallagher prediction. Every [x, x+0.2√x] contains a prime at x=10⁵. The √x barrier stands — suppression removes log(x) not √x. Constant C in the gap bound improves ~10x.

## Target 2: Bombieri-Vinogradov
**Result:** Individual errors |E(x;q,a)| are 2-17% of RH bound. Per-character suppression 50-100x. BV sum at Q=√x needs 5.5x total suppression. Dilution over 300 moduli prevents breaking θ = 1/2 at this x. Suppression weakens at large q (ratio grows from 0.017 to 0.40).

## Target 3: BSD (not attempted computationally)
**Plan:** Upgrade the coherence Laplacian from ℤ-primes to the Euler product of an elliptic curve L-function L(E,s). The Hasse-Weil L-function has local factors (1-a_p p^{-s} + p^{1-2s})^{-1}, degree 2. The coherence matrix M would be built from these degree-2 factors. The spectral gap would measure how the Frobenius traces a_p align.

**Prediction:** Higher algebraic rank → more cancellation in the Euler product → wider spectral gap → stronger concentration of zeros at s=1. This maps rank to a spectral property of the coherence Laplacian. Not computed yet.

## The Pattern
Every application shows the same mechanism: the Chebyshev anti-correlation (quantified by the coherence spectral gap) suppresses oscillatory prime sums. The suppression is:
- Strongest per-character (30-700x)
- Moderate for prime counting (10-15x)
- Diluted when summing over many moduli (5-10x)
- Real but insufficient to break fundamental barriers
- Most useful for improving EXPLICIT CONSTANTS, not asymptotic shapes
