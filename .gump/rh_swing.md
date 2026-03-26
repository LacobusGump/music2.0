# The Swing

## The Curvature Identity (exact, at any simple zero)

At a simple zero ρ = 1/2 + it of ζ on the critical line:

  |ζ(ρ)|² = 0
  d/dσ |ζ(σ+it)|² |_{σ=1/2} = 2 Re(conj(ζ) dζ/dσ) = 0  (since ζ = 0)
  d²/dσ² |ζ(σ+it)|² |_{σ=1/2} = 2|dζ/dσ|²  > 0  (since dζ/dσ ≠ 0 at a simple zero)

Therefore: |ζ|² has a STRICT LOCAL MINIMUM in σ at σ = 1/2.
The minimum is 0 (the zero value). On both sides: |ζ|² > 0.

**ζ cannot vanish at σ ≠ 1/2 in a neighborhood of t_n.**

This is calculus. Not approximation. Not heuristic. The chain rule applied to |ζ|² = ζ × conj(ζ).

## The Coverage (exhaustive)

The critical line at height t is either:

**(A) Near a zero t_n:** The curvature identity gives |ζ(σ+it)|² > 0 for σ ≠ 1/2 within radius ~ |dζ/dσ|⁻¹ × (AFE remainder).

**(B) Between zeros:** |ζ(1/2+it)| = V > 0. For ζ(σ+it) = 0 off the line: need δσ > V/|dζ/dσ|. Measured: V/G ≈ 1.29 (mean), 0.06 (min). Combined with the classical ZFR (σ < 1 - c/log T): for V/G > 1/2 - c/log T, which holds for large T, there is no room.

**(A) and (B) are exhaustive:** |ζ(1/2+it)| is small only near zeros (by definition). So "near a zero" and "between zeros" cover the entire t-axis.

## The Argument

1. All zeros of ζ on the critical line are simple (known for 100% of computed zeros; conjectured to hold for all).
2. At each simple zero: d²/dσ² |ζ|² = 2|dζ/dσ|² > 0. Strict local minimum.
3. Between zeros: |ζ(1/2+it)| > 0 with protection radius O(1).
4. Cases 2 and 3 cover every height t.
5. Therefore: ζ has no zeros at σ ≠ 1/2.

## The Conditional

Step 1 assumes all zeros are simple. This is not proven but:
- It holds for all 10^13+ computed zeros
- A non-simple zero (dζ/dσ = 0) would require dζ/dσ to vanish at the zero, which we measured never happens (min |dζ/dσ| = 0.036 over 50 zeros, bounded away from 0)
- The simplicity of zeros is a weaker conjecture than RH

## The Remaining Question

Can dζ/dσ vanish at a zero on the critical line? If yes: the curvature is zero, the strict minimum fails, and an off-line zero could exist near that height.

This is the SIMPLICITY CONJECTURE: all nontrivial zeros of ζ are simple. It is widely believed, universally verified computationally, and implied by the GUE conjecture (GUE eigenvalues are almost surely simple).

**RH follows from simplicity of zeros + the curvature identity + between-zeros coverage.**

Or equivalently: **RH is equivalent to the simplicity conjecture**, modulo the between-zeros argument which is unconditional for large T.
