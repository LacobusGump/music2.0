# Operator Test Bench: Falsification Rig for RH Candidates

**Date:** March 24, 2026

## What we have

A test bench that scores any candidate operator against the known zeros. Not the operator itself — the rig to test operators.

## Must-have tests (score every candidate)

1. **Self-adjoint**: eigenvalues must be real
2. **Level repulsion**: small gap fraction < 15% (GUE range, not Poisson)
3. **Zero fit error**: first 20 zeros to < 1% error
4. **Boundary sensitivity**: spectrum must change nontrivially with boundary/domain
5. **Prime connection**: explicit route from spectrum back to primes or explicit formula

## What failed

- Berry-Keating discretized (naive grid): evenly spaced eigenvalues, no structure. Wrong boundary conditions.
- Prime cosine matrix: small gap fraction 34.5% (Poisson-like, no repulsion). Wrong construction.

## What we learned

1. The operator is not a naive prime matrix. Primes are input, not the spectral object.
2. xp is the right mixing (multiplication × differentiation) but the spectrum lives or dies on boundary conditions.
3. The boundary condition is where additive and multiplicative are forced to agree.

## The locked insight

The missing ingredient is likely not the bulk operator alone, but the spectral boundary condition that converts a multiplicative input into an additive eigenvalue law.

## The phase framework constraint

The operator should produce eigenvalues in the CRYSTAL phase (R > 1):
- Back-loaded, collectively entangled
- Not decomposable into individual prime contributions
- The functional equation's s ↔ (1-s) symmetry should emerge from the operator's self-adjointness

## Status

The bench is built. The search is defined. No candidate has passed yet. The next idea goes through the same rig.
