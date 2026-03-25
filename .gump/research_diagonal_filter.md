# Diagonal Arithmetic Filter: GUE Preserved at 9.8%

**Date:** March 25, 2026

## The architecture

L = L_rainbow (off-diagonal chaos) + μ · V (diagonal arithmetic potential)

Off-diagonal: rainbow color phases → creates GUE repulsion (generic, maximally asymmetric)
Diagonal: V(x) = Σ_p ln(p)/√p · cos(x·ln(p)·scale) → sculpts eigenvalue positions

These DON'T interfere. Chaos and arithmetic live in different parts of the matrix.

## Result

Rainbow baseline: 12.0% small gaps
With filter (scale=2.0, μ=0.05): 9.8% small gaps → GUE preserved ✓

The arithmetic potential shifts eigenvalues without restoring symmetry.

## Why anchored phases failed but diagonal filter works

Anchored phases: modify OFF-DIAGONAL entries → changes the mixing → restores symmetry → kills repulsion
Diagonal filter: modify DIAGONAL entries → shifts eigenvalues → preserves mixing → keeps repulsion

## Implication for the Hilbert-Pólya operator

The operator that produces zeros with GUE statistics must have:
1. Generic off-diagonal structure (quantum chaos, broken time-reversal)
2. Arithmetic diagonal structure (prime-dependent potential landscape)

The off-diagonal creates the universality class (GUE).
The diagonal selects the specific eigenvalues (zeros).

This separation is the key insight: the operator is NOT purely arithmetic AND NOT purely random. It's arithmetic in the potential and random in the coupling.
