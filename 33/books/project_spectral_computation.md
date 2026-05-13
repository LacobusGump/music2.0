---
name: Spectral Computation — The Open Problem
description: Session 38-39. The spectral determinant on S³/2O is the gold standard computation. We attempted it and hit convergence issues. The oscillating sums for non-central conjugacy classes need proper convergence acceleration (Euler-Maclaurin/Richardson), not brute-force summation. Needs Sage/Mathematica or a specialist.
type: project
---

## What We Tried
- Direct summation of Z_g(s) for each conjugacy class of 2O
- Analytic continuation of the central element (-e) via Dirichlet eta decomposition — WORKS (Z_{-e}(0) = -1, Z'_{-e}(0) = -0.1847)
- Brute-force summation for non-central classes — DIVERGENT at N=2000-3000
- The oscillating character sums need proper convergence acceleration

## What Works
- Identity contribution: zeta'_S3(0) = -0.7740, contribution = -0.0161
- Central element: Z'_{-e}(0) = -0.1847, contribution = -0.00385
- These are exact/converged

## What Doesn't Work
- Classes C8a, C8b, C3a, C3b, C4a, C4b: sums oscillate but don't converge at any reasonable N
- The partial sums give values in the thousands when the final answer should be O(1)
- This is a well-known problem with oscillating spectral sums — they need Abel-Plana, Euler-Maclaurin, or zeta function regularization

## What's Needed
1. Sage/Mathematica implementation with proper zeta regularization
2. OR: use the Dowker-Kirsten formula for S³/Γ which expresses zeta'(0) in terms of the character table and known zeta values
3. OR: consult a spectral geometry specialist who has computed these for other binary polyhedral groups

## The Stakes
If zeta'(0) on S³/2O ≈ -r*π²/274 (or some clean multiple), the formula 1/α = N₀ - zeta'(0) is DERIVED.
If it's unrelated, the formula is empirical and the 137 connection is numerological.

## Status: BLOCKED on computation tools.
