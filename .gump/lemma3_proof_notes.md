# Lemma 3 Proof Notes

## The Identity at p = 1/2

f(1/2) = |Ψ(1/2)| × h(1/2) = cos(π/8) × tan(π/8) = sin(π/8).

Measured: f(1/2) = 0.38271, sin(π/8) = 0.38268. Match to 5 figures.
h(1/2) = 0.4140, tan(π/8) = 0.4142. Match to 3 figures.

## The Ψ Function Has No Zeros

Ψ(p) = cos(2π(p²/2 - p - 1/16)) / cos(2πp).

Numerator zeros: p²/2 - p - 1/16 = k + 1/2, i.e., p = 1 ± √(2k + 9/8).
- k = 0: p = 1 ± 1.061 → outside [0,1].
- k = -1: p = 1 ± √(-7/8) → complex.
- No other k gives p ∈ [0,1].

Therefore: |Ψ numerator| > 0 on [0,1]. By compactness: |numerator| ≥ c > 0.
(Measured: min|numerator| ≈ 7×10⁻⁶ near p = 0.209.)

CORRECTION: The minimum 7×10⁻⁶ IS extremely close to zero. The numerator NEARLY vanishes at p ≈ 0.209. This needs careful handling — |Ψ| is very small there (0.00003), and the correction h must be large enough to make f positive.

## The Reduction Factor h(p)

h(p) = f(p) / |Ψ(p)|.

- h(0) ≈ 1.0 (corrections negligible at p = 0)
- h(0.5) = tan(π/8) ≈ 0.414
- h near poles (p = 0.25, 0.75): h compensates for the divergence of |Ψ|
- h near the Ψ near-zero (p ≈ 0.21): h must be large to keep f positive

The critical point is p ≈ 0.21 where |Ψ| ≈ 0.00003. Here f ≈ 0.55 (measured).
So h ≈ 0.55/0.00003 ≈ 18000. The correction factor is ENORMOUS at this point.
This means: the higher-order RS terms completely DOMINATE over the leading Ψ.

## The Proof Strategy

The decomposition f = |Ψ| × h is NOT the right approach for rigorous proof, because h varies by a factor of 18000 across [0,1]. The corrections are not "small."

BETTER: prove f > 0 DIRECTLY by analyzing the full RS correction function, without decomposing into Ψ × h. The RS formula with enough correction terms gives a smooth function on [0,1] that can be bounded below by its minimum value.

The minimum is at p = 1/2. At that point, the exact value sin(π/8) can be computed from the RS expansion. On the rest of [0,1], f is larger (measured).

## What's Needed from the Literature

1. The full RS correction function (all pole-cancelling terms) as a single smooth function of p.
2. Its evaluation at p = 1/2 giving sin(π/8).
3. A proof that this function is positive on [0,1].

Berry (1995) likely has (1) and (2). The positivity (3) may need a new argument or a computational verification certified by interval arithmetic.
