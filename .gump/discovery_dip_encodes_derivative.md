# What the Euler Product Dip Encodes

## The dip at a zero of ζ(s) carries three pieces of information:

### 1. Height scaling: |P_200(ρ)| ~ t^{0.33}
The partial Euler product magnitude at zeros grows with height at approximately the convexity bound exponent (theoretical: t^{1/4} = 0.250, measured: 0.329). The excess may be logarithmic corrections from the finite Euler product tail.

### 2. Local zero structure: r = +0.28 (height-corrected dip vs spacing)
After removing the height trend, more isolated zeros (larger gaps to neighbors) have deeper dips. This encodes |ζ'(ρ)|, the derivative at the zero, which GUE random matrix theory connects to the spacing distribution.

### 3. Dip shape (curvature): r = +0.84 with dip depth
The curvature of |P_N| at the dip minimum correlates very strongly with the depth. Sharp V-shaped dips (high curvature) are deeper. The shape of the dip is a robust encoding of the zero's character.

## The factorization of the dip metric

For pairs of L-functions, the dip metric decomposes ADDITIVELY:

  d_dip ≈ 1.4 × d_pretentious - 0.26 × log(q₁q₂) + 3.4    (R² = 0.334)

- The pretentious distance (character similarity at primes) contributes positively
- The conductor product contributes negatively (larger conductors → closer in dip space)
- These are INDEPENDENT contributions

## Conductor extraction
|P_200(zero)| ~ (qt)^{0.246}. The partial Euler product at a zero "remembers" the analytic conductor through the approximate functional equation's transition scale √(qt/2π).

## Physical picture
The Euler product partial sum at a zero is the ratio: |P_N| ≈ |ζ'(ρ)| / |tail_N|. The tail factor depends on N and t (global). The derivative |ζ'(ρ)| depends on the local zero environment (GUE). The dip separates these: height scaling captures the tail, the residual captures the derivative.
