# Session 2 Final State — March 26, 2026

## The One-Sentence Diagnosis

An off-line zero creates a pole in the σ-averaged zero-side function that the prime side (smooth for σ > 0) cannot match. The gap between this observation and a proof of RH is exactly: the mean-value identity connecting them is asymptotic (with error O(T^{1-2σ})), not exact.

## What was built this session

1. **Beurling-Selberg analysis:** Per-zero deficit h(iγ) - Re h(a+iγ) > 0 for ĥ ≥ 0. External inequality from Fourier analysis. But single h insufficient (quartet counting absorbs deficit).

2. **Fission test:** Deficiency killing is generic to multi-shift operators, not prime-specific. Primes have highest growth rate (0.78 vs 0.34-0.60) but aren't unique.

3. **Marginal gain curve:** log(RMSE) ∝ -Σ(1/p) at R² > 0.98 (Mertens structure). The coefficient c ∈ [1.0, 1.8] is non-universal, explained by anti-correlation of consecutive errors (ρ(1) ≈ -0.35).

4. **1/ln(2) killed:** The exponent drifts across zero windows and K_max. Numerology.

5. **Quadratic structure Λ*Λ:** Constrains zero SPACING (pair correlation), uses (ln p)². Stronger than linear Λ, but Montgomery's pair correlation result assumes RH.

6. **The pole argument:** Δ_self(a,ε) = 2ε²/(a(a²-ε²)) has pole at a=ε. Δ_pair is smooth. Δ_total ≢ 0. But the mean-value identity is asymptotic, so the error absorbs the pole.

## The three upgrade paths

To turn the pole argument into a proof, need one of:

1. **Exact transform:** An identity (not asymptotic) where the zero side has the pole structure and the prime side is provably smooth. Possibly a Mellin transform or spectral identity that's exact by construction.

2. **Coercive inequality:** A bound showing the error term O(T^{1-2σ}) CANNOT have the same singularity profile as the displaced-zero pole. The error comes from off-diagonal pairs; the pole comes from the diagonal self-term. These have different structures.

3. **Function-space rigidity:** A theorem showing that in the space of valid error functions (determined by Dirichlet series structure), no element can mimic a 1/(σ-σ₀) pole. This would use the specific arithmetic of Λ(n).

## What carries forward from both sessions

- θ_p = -Im log(1-p^{-s}): the atom (exact, session 1)
- D_on = 2π: per-zero curvature constant (proven, session 1)
- Direct quantization: 4.5%, 6 kill shots (frozen, session 1)
- Mertens convergence law: log(RMSE) ∝ -Σ(1/p) (robust, session 2)
- Anti-correlation structure: ρ(1) ≈ -0.35, explains non-universal c (session 2)
- The pole argument: Δ_self has pole, Δ_pair smooth, Δ_total ≢ 0 (session 2)
- Complete terrain map from atom through every known criterion (both sessions)

## What's definitively killed

- Five operator approaches (V1-V4 + prime-shift): spectrum doesn't match ζ zeros
- Encoding efficiency as RH evidence: it's the explicit formula, not RH
- 1/ln(2) exponent: numerology
- Single test function Weil approach: quartet counting absorbs deficit
- Curvature functional as contradiction engine: circular
- Deficiency killing as prime-specific: generic to multi-shift operators
