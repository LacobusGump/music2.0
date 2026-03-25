# Theorem: Coherence Stability for Euler Product Phases

---

## Statement

Let P = {p₁, ..., p_N} be a finite set of primes. Let Ŵ: ℝ → ℝ₊ be a positive Schwartz function. Define the Gram matrix M ∈ ℝ^{N×N} by:

$$M_{ij} = \frac{\log p_i \cdot \log p_j}{\sqrt{p_i p_j}} \cdot \hat{W}(\log(p_i/p_j))$$

For phases φ = (φ₁, ..., φ_N) ∈ ℝ^N, define the coherence functional:

$$F(\phi) = \sum_{i,j=1}^{N} M_{ij} \cos(\phi_i - \phi_j)$$

Then:

**(a) Uniqueness.** F is uniquely maximized by constant phase configurations φ_i = c for all i. The maximum value is F_max = Σ_{ij} M_{ij}.

**(b) Stability.** Let L = D - M be the graph Laplacian, where D = diag(Σ_j M_{ij}). Let λ₂(L) > 0 be the spectral gap. If F(φ) ≥ (1-δ)F_max for some δ ∈ (0,1), then:

$$\sum_i w_i (\phi_i - \bar{\phi})^2 \leq \frac{2\delta \cdot F_{\max}}{\lambda_2(L)}$$

where w_i = Σ_j M_{ij} and φ̄ = (Σ w_i φ_i)/(Σ w_i) is the weighted mean phase.

---

## Proof

**(a)** Since Ŵ > 0, log p_i > 0, and (p_i p_j)^{-1/2} > 0, every entry M_{ij} is strictly positive. The function cos(φ_i - φ_j) ≤ 1 with equality iff φ_i = φ_j. Since M_{ij} > 0, we have:

F(φ) = Σ M_{ij} cos(φ_i - φ_j) ≤ Σ M_{ij} · 1 = F_max

with equality iff cos(φ_i - φ_j) = 1 for all pairs, i.e., φ_i = φ_j for all i,j. ∎

**(b)** The deficit:

F_max - F(φ) = Σ M_{ij} (1 - cos(φ_i - φ_j))

Using 1 - cos(x) ≥ x²/2 - x⁴/24 ≥ x²/4 for |x| ≤ π:

F_max - F(φ) ≥ (1/4) Σ M_{ij} (φ_i - φ_j)²

The right side is (1/2) φ^T L φ where L is the graph Laplacian (using the identity Σ M_{ij}(φ_i-φ_j)² = 2φ^T L φ). Since the kernel of L is the constant vector:

φ^T L φ ≥ λ₂(L) · ||φ - φ̄||²_w

where ||·||_w is the weighted norm. Therefore:

δ · F_max ≥ F_max - F(φ) ≥ (λ₂(L)/2) · ||φ - φ̄||²_w ∎

---

## Numerical Values (σ_W = 0.5)

| N (primes) | F_max | λ₂(L) | C = √(2F_max/λ₂) |
|---|---|---|---|
| 5 | 12.6 | 1.82 | 3.73 |
| 10 | 48.1 | 2.78 | 5.88 |
| 20 | 151.9 | 3.59 | 9.20 |
| 40 | 428.5 | 4.18 | 14.32 |

The stability constant C grows as ~√N. The spectral gap λ₂ grows logarithmically. F_max grows as ~N².

---

## Interpretation

The functional F measures the second moment of the prime-weighted exponential sum Σ a_p (log p)/p^{1/2+it} over a smoothing window W. It is maximized when all Euler phases a_p = e^{iφ_p} are aligned (φ_p constant), corresponding to the Riemann zeta function (trivial character) up to global rotation.

Any non-constant phase pattern (Dirichlet character with non-trivial twisting, random phases, etc.) strictly reduces F. The reduction is quantitatively controlled: near-maximal coherence forces near-constant phases, with the stability measured by the spectral gap of the prime-pair interaction Laplacian.

---

## Open Problem: Infinite-Volume Limit

The stability constant C ~ √N diverges as N → ∞. The natural renormalization is to replace F with:

$$\tilde{F}(\phi) = \frac{F(\phi)}{F_{\max}} = \frac{\sum M_{ij}\cos(\phi_i - \phi_j)}{\sum M_{ij}}$$

This satisfies 0 ≤ F̃ ≤ 1 with F̃ = 1 iff constant phase. The stability becomes:

$$\sum_i \tilde{w}_i (\phi_i - \bar\phi)^2 \leq \frac{2\delta}{\lambda_2(L)/F_{\max}}$$

Whether λ₂(L)/F_max has a positive limit as N → ∞ determines if the stability survives the infinite-prime limit.

Numerical evidence: λ₂/F_max = 0.14, 0.058, 0.024, 0.010 for N = 5, 10, 20, 40. This ratio is DECREASING. If it converges to 0, the stability vanishes in the limit.

The question: is there a DIFFERENT normalization where the stability persists?
