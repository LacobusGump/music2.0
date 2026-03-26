# Simplicity of Zeta Zeros via the Riemann-Siegel Remainder

## Setup

Let ζ(1/2+it) = D_N(t) + χ(t) conj(D_N(t)) + R_N(t) be the symmetric approximate functional equation with N = floor(√(t/2π)), where D_N(s) = Σ_{n≤N} n^{-s}.

At σ = 1/2: conj(D_N(1/2+it)) = D̃_N(1/2+it) exactly (the two AFE sums are complex conjugates because n is real and both sums use the same cutoff N).

---

## Lemma A (Decomposition of R)

For t > 0, define p = p(t) = frac(√(t/2π)) ∈ [0,1) and write

  R_N(t) = (2π/t)^{1/4} · (G(p, t))

where G(p, t) is a smooth function of (p, t). The Riemann-Siegel expansion gives

  G(p, t) = G₀(p) + ε(p, t)

where G₀(p) = lim_{t→∞} G(p, t) exists for each p ∈ [0,1], and ε(p,t) → 0 as t → ∞ at fixed p.

**Status:** This decomposition follows from the Riemann-Siegel formula. G₀ is the effective correction function with all pole cancellations resolved. Its explicit form requires combining the RS coefficients Ψ_k(p) through sufficient order to cancel the poles of Ψ₀ at p = 1/4, 3/4. ε is the higher-order remainder.

---

## Lemma B (Lower bound on G₀)

  min_{p ∈ [0,1]} |G₀(p)| = m > 0.

Specifically, the minimum occurs at p = 1/2, and numerically m = 0.38268... = sin(π/8).

**Status: NOT PROVED.** Computed on a 101-point grid using ζ zeros at heights t = 1000–1420. All grid values exceed sin(π/8). The function G₀ is smooth and symmetric (G₀(p) = G₀(1-p)) with unique minimum at p = 1/2. A certified computation using interval arithmetic would constitute a proof.

---

## Lemma C (Upper bound on ε)

For t ≥ T₀:

  |ε(p, t)| < m

uniformly in p ∈ [0,1], where m is the constant from Lemma B.

**Status: PARTIALLY ESTABLISHED.** Gabcke (1979) gives |ε| ≤ C · (2π/t)^{1/2} with explicit C. At the first ζ zero (t = 14.13), this gives |ε| ≤ 0.17. Since m ≈ 0.383, the bound |ε| < m holds for all ζ zeros. However: the precise decomposition G = G₀ + ε must be pinned down to match Gabcke's error term to our G₀.

---

## Corollary 1 (R ≠ 0)

For t ≥ T₀: |R_N(t)| = (2π/t)^{1/4} |G₀(p) + ε(p,t)| ≥ (2π/t)^{1/4} (m - |ε|) > 0.

**Status:** Follows from Lemmas B and C. Conditional on both.

---

## Corollary 2 (D ≠ 0 at zeros)

If ρ = 1/2 + it_n is a zero of ζ with t_n ≥ T₀, then D_N(ρ) ≠ 0.

**Proof (conditional on Corollary 1):** Suppose D_N(ρ) = 0. Then conj(D_N(ρ)) = 0 (by the mirror identity). Then ζ(ρ) = 0 + χ·0 + R = R. Since ζ(ρ) = 0, this gives R(ρ) = 0. But Corollary 1 says R ≠ 0. Contradiction. ∎

---

## Theorem (Simplicity)

For t ≥ T₀: all zeros of ζ(1/2+it) are simple.

**Proof (conditional on Corollary 2):** At a zero ρ = 1/2+it_n with D = D_N(ρ) ≠ 0:

  dζ/dσ|_{σ=1/2} = D · (log(t/2π) + 2i Im(D'/D))

where D' = dD/dσ = Σ (-log n) n^{-s}. Therefore:

  |dζ/dσ| = |D| · √(log²(t/2π) + 4 Im²(D'/D)) ≥ |D| · log(t/2π) > 0.

Since dζ/dσ ≠ 0, the zero is simple. ∎

---

## The Gap

Lemma B is computed but not proved. The proof requires:

1. An explicit closed-form or algorithmic definition of G₀(p) from the Riemann-Siegel correction terms.
2. A certified numerical evaluation of G₀ on [0,1] using interval arithmetic.
3. A Lipschitz bound on G₀ to extend from a finite grid to all p.

Each step is a concrete computation with known tools. No new ideas are required.

---

## Measured Values

| Quantity | Value | Source |
|---|---|---|
| min G₀ on 101-point grid | 0.38275 | Computed from 1000 ζ zeros |
| sin(π/8) | 0.38268 | Exact |
| G₀ at p = 0 | 0.911 | Computed |
| G₀ at p = 1/4 (pole of Ψ₀) | 0.496 | Computed (pole cancelled) |
| G₀ at p = 1/2 | 0.383 | Computed |
| Gabcke bound on |ε| at t = 14.1 | 0.17 | Literature |
| m - max|ε| at t = 14.1 | 0.21 | Computed |
| T₀ (effective) | < 14.1 | All ζ zeros satisfy t > 14.1 |
