# Li Criterion in Bost-Connes/Landauer Framework

## The Question

Li criterion: RH ⟺ λ_n ≥ 0 for all n ≥ 1, where λ_n = Σ_ρ [1 - (1 - 1/ρ)^n].

Can λ_1 = 1 - γ + ½ log(4π) ≈ 0.0231 be expressed in Bost-Connes/Landauer terms?

## Answer: λ_1 connects. Higher λ_n do not.

### λ_1 decomposition

| Term | Value | Bost-Connes/Landauer meaning |
|------|-------|------------------------------|
| **1** | 1 | Unit Landauer erasure cost. At β=1, erasing one bit of arithmetic information costs kT ln 2. In natural units: 1. |
| **γ** | 0.5772... | Entropy residual at the Bost-Connes phase transition (β=1). Via Mertens: γ = lim [Σ_{p≤N} 1/p - log log N]. Cumulative Landauer cost of prime-by-prime erasure minus expected cost from prime counting measure. |
| **½ log(4π)** | 0.9189... | Archimedean channel cost. The Gamma factor contribution = Landauer cost of the real completion of Q. Entropy of standard Gaussian normalization. Nonarchimedean primes give discrete erasure; the archimedean place gives continuous Gaussian channel cost. |

**λ_1 = (unit erasure cost) - (critical entropy residual) + (archimedean channel cost)**

All three terms derivable from Bost-Connes/Landauer framework. No zeros referenced.

### Why higher λ_n break

For n ≥ 2, expanding (1-1/ρ)^n by binomial theorem requires power sums Σ_ρ ρ^{-k} for k = 1,...,n.

- **n = 1**: Collapses to known constants (γ, log 4π). Thermodynamic identity.
- **n ≥ 2**: Requires second and higher derivatives of log ξ at s=1. These encode **correlations between zeros**, not just bulk distribution.

The individual power sums s_k = Σ_ρ ρ^{-k} relate to Stieltjes constants γ_k, which are Bost-Connes computable. But **proving λ_n ≥ 0** requires showing that these combine with specific signs — that is a spectral constraint on zero fine structure that thermodynamics alone cannot enforce.

### The gap

| What Bost-Connes/Landauer gives | What it doesn't give |
|--------------------------------|---------------------|
| λ_1 ≥ 0 (from known constants) | λ_n ≥ 0 for n ≥ 2 |
| Bulk zero density (Riemann-von Mangoldt) | Zero correlations (pair correlation, etc.) |
| Stieltjes constants γ_k individually | Nonnegativity of their specific combinations in λ_n |
| Phase transition structure | Fine spectral constraints |

### Verdict

λ_1 is a **thermodynamic identity** — lives entirely in the Bost-Connes/Landauer world.

Higher λ_n are **spectral statements** about zero correlations. Computable from Bost-Connes quantities, but their nonnegativity is not provable from the framework.

The Li criterion is equivalent to RH precisely because the higher λ_n encode progressively finer spectral information that bulk thermodynamics cannot constrain.

## Status: CONFIRMED (λ_1 connects), BLOCKED (higher λ_n need spectral input)
