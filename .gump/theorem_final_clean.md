# Coherence Stability for Euler Product Phases
## A theorem with its boundary

---

### Theorem

Let P = {p₁,...,p_N} be a finite set of primes, Ŵ: ℝ → ℝ₊ a positive Schwartz function. Define M_{ij} = (log p_i)(log p_j)(p_ip_j)^{-1/2} Ŵ(log(p_i/p_j)) and F(φ) = Σ M_{ij} cos(φ_i - φ_j).

**(a)** F is uniquely maximized by constant phases. Proof: M entrywise positive.

**(b)** Stability: F ≥ (1-δ)F_max implies Σ w_i(φ_i - φ̄)² ≤ 2δF_max/λ₂(L), where L = D-M is the graph Laplacian and λ₂ its spectral gap.

**(c)** λ₂(L) > 0 for any finite prime set with Ŵ of sufficient width.

### The boundary

The stability constant C = √(2F_max/λ₂) grows as √N. The ratio λ₂/F_max → 0 as N → ∞. The theorem is genuinely finite: it does not extend to an infinite-prime version with the same stability constant under any tested renormalization (raw, normalized Laplacian, weighted norm, adaptive σ_W).

### Where it lives

This theorem naturally belongs to:

**1. Pretentious number theory.** The "pretentious distance" of Granville-Soundararajan measures how close a multiplicative function f is to another g: D(f,g;x)² = Σ_{p≤x} (1-Re(f(p)g̅(p)))/p. Our F is closely related: F_max - F(a) = Σ M_{ij}(1-cos(φ_i-φ_j)), which is a weighted pretentious distance from the trivial character. The stability theorem says: small pretentious distance → nearly constant phases.

**2. Short Euler products.** The partial Euler product ζ_N(s) = Π_{p≤N}(1-p^{-s})^{-1} is used in sieve methods, zero-density estimates, and mollifier constructions. Our theorem quantifies how phase decoherence in the short product weakens these tools. The spectral gap of L controls the quality of the mollifier.

**3. Large sieve and phase alignment.** The large sieve inequality bounds |Σ a_n e(nα)|² integrated over α. Our F is the analogous object for prime-indexed sums over multiplicative characters. The theorem gives a prime-specific large sieve stability bound.

### What it does not do

It does not connect to zero locations. The fundamental obstacle is that ζ is one function — its zeros are poles on both the Hadamard and Euler sides of any identity, and no transform can separate them. The coherence functional lives entirely on the prime side.

### Numerical values

| N | F_max | λ₂(L) | C | λ₂/F_max |
|---|---|---|---|---|
| 5 | 12.6 | 1.82 | 3.73 | 0.144 |
| 10 | 48.1 | 2.78 | 5.88 | 0.058 |
| 20 | 151.9 | 3.59 | 9.20 | 0.024 |
| 50 | 586.6 | 4.31 | 16.5 | 0.007 |
| 100 | 1492.2 | 4.60 | 25.5 | 0.003 |
