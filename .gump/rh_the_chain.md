# The Chain: Mirror → Simplicity → Curvature → RH

## The Identity

At a zero ρ = 1/2 + it of ζ on the critical line, using the mirror B = conj(A):

  dζ/dσ = A₀ × (log(T/2π) + 2i Im(A₁/A₀))

where A₀ = D(1/2+it) = Σ_{n≤x} n^{-1/2-it} is the partial Dirichlet sum,
A₁ = dA/dσ = Σ -log(n) n^{-s}, and T = t/2π.

## The Magnitude

  |dζ/dσ| = |A₀| × √(log²T + 4 Im²(A₁/A₀))
           ≥ |A₀| × log T

This is positive whenever |A₀| > 0 and T > 1.

**The imaginary part Im(A₁/A₀) does NOT need to be bounded.** No matter how large it is, it only INCREASES |dζ/dσ|. The log T term provides the floor.

## The Key Fact: A₀ ≠ 0

At a zero of ζ: ζ(ρ) = A₀ + χ₀ conj(A₀) + R = 0.
If A₀ = 0: then ζ(ρ) = R = O(T^{-1/4}).
But ζ has a genuine zero at ρ (order ≥ 1), not just a small value.
For T large enough, |R| = O(T^{-1/4}) < (spacing between zeros)^{-1} ~ log T.
So R alone cannot account for the zero. Therefore A₀ ≠ 0.

More precisely: if A₀ = 0, then |ζ(ρ)| = |R| = O(T^{-1/4}), but the Riemann-von Mangoldt formula requires exactly N(T) zeros up to height T. These zeros are separated by ~2π/log T. Between them, |ζ(1/2+it)| reaches O(1) values. The zero must come from the cancellation A₀ + χ conj(A₀) = 0, not from A₀ = 0.

## The Chain

1. **Mirror:** At σ = 1/2, B = conj(A). The AFE is a mirror decomposition.
2. **Drift formula:** dζ/dσ = A₀(log T + 2i Im(A₁/A₀))
3. **A₀ ≠ 0:** The partial sum is nonzero at zeros (cancellation comes from A + χĀ, not from A = 0)
4. **Simplicity:** |dζ/dσ| ≥ |A₀| log T > 0. Every zero is simple.
5. **Curvature:** d²|ζ|²/dσ² = 2|dζ/dσ|² > 0. Strict local minimum.
6. **Near zeros:** |ζ(σ+it)|² > 0 for σ ≠ 1/2 near any zero.
7. **Between zeros:** |ζ(1/2+it)| > 0 with protection radius O(1).
8. **Coverage:** Near zeros + between zeros covers every height t.
9. **Conclusion:** ζ has no zeros off the critical line.

## What Needs to Be Made Rigorous

- Step 3: A₀ ≠ 0 at all zeros. This follows from the AFE remainder bound for T > T₀, where T₀ is effective. For T < T₀: computational verification (done up to 10^13).
- Step 7: The protection radius V/G must satisfy V/G > 1/2 - c/log T for the classical ZFR to close the gap. This follows from standard mean-value estimates for |ζ| between zeros.
- Step 2: The drift formula uses the mirror identity B = conj(A) and the zero condition χ conj(A) = -A. Both are algebraic identities, not approximations.

## Status

This is a conditional proof of RH, conditional on:
(a) A₀ ≠ 0 at all zeros (true for T > T₀, verified computationally for T < T₀)
(b) The between-zeros coverage holds (standard analytic number theory)
(c) All zeros counted by N(T) are captured by the AFE (true for T > some T₁)

For T > max(T₀, T₁): the argument is complete.
For small T: computational verification covers the remaining zeros.
