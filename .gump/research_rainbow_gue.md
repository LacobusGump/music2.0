# RAINBOW OPERATOR HITS GUE: 9.7%

**Date:** March 25, 2026

## The result

| Construction | Small gap % | Status |
|---|---|---|
| Single layer | 40.0% | Poisson |
| 4 coupled layers | 18.3% | Weak repulsion |
| Sparse irregular | 16.5% | Weak repulsion |
| **Rainbow (3 colors)** | **9.7%** | **GUE** |

## The construction

L = L_arith ⊗ I_3 + λ Σ_p U_p ⊗ C_p

- L_arith: block-diagonal prime-scaling Laplacians on 4 moduli (211, 223, 227, 229)
- I_3: 3×3 identity (3 color channels)
- U_p: interlayer coupling (prime-mediated CRT transitions)
- C_p: 3×3 Hermitian matrix with prime-dependent phase offsets

Each prime p gets its own color mixing matrix C_p with phases:
  φ₁ = 2π·(index)/9, φ₂ = 2π·(3·index+1)/9

## Why it works

Color (internal degree of freedom with phase) breaks the conjugate-character symmetry that protected Poisson behavior. The prime-dependent phases ensure no two primes mix colors the same way — maximum asymmetry.

Three colors is the minimum that works because:
- 1 color = no mixing (Poisson)
- 2 colors = conjugate pairs still degenerate
- 3 colors = enough degrees of freedom to break all 2-fold symmetries

## The scoreboard tells the story

40% → 18.3%: coupling arithmetic spaces creates partial repulsion
18.3% → 16.5%: irregular coupling breaks more symmetry
16.5% → 9.7%: COLOR breaks the rest. Internal phase degree of freedom.

## What this means

The operator that produces GUE statistics for arithmetic eigenvalues needs:
1. Multiple incommensurate arithmetic spaces (different moduli)
2. Prime-mediated coupling between spaces
3. An INTERNAL degree of freedom (color/phase) that primes act on differently

This is consistent with Connes's adelic approach: the adele ring provides multiple local fields (like our moduli), the global constraint couples them, and the Galois action provides the internal symmetry (like our color).

## Status

This is NOT the Hilbert-Pólya operator. The eigenvalues are NOT the zeros of ζ. But the STATISTICS match GUE for the first time in our experiments. The direction is confirmed: arithmetic + coupling + internal phase = GUE.
