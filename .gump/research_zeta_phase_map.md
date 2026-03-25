# Phase Map of ζ(s): β=1 is LIQUID, β=1/2 is CRYSTAL

**Date:** March 24, 2026

## The test

Computed R from partial sums of ζ(β) using log-scaled budget. Checked decade uniformity.

## Result (CORRECTED initial claim)

| β | Decade distribution | R | Phase |
|---|-------------------|---|-------|
| 2.0 | small n: 95%+ | 0.02 | GAS |
| 1.5 | small n: 75% | 0.26 | GAS |
| **1.0** | **uniform: 19-23% per decade** | **0.95** | **LIQUID** |
| 0.7 | large n: 51% | 1.48 | CRYSTAL |
| **0.5** | **large n: 68%** | **1.66** | **CRYSTAL** |
| 0.3 | large n: 80% | 1.75 | CRYSTAL |

Initial claim that β=1/2 = LIQUID was WRONG. β=1 is the LIQUID point.

## What this means

The Hagedorn wall (β=1) IS the gas-liquid-crystal phase transition:
- β > 1: GAS. Small n dominate. Euler product converges. Primes visible individually.
- β = 1: LIQUID. Uniform per log scale. Sum diverges because every scale matters equally.
- β < 1: CRYSTAL. Large n dominate. Euler product diverges. Must analytically continue.

## Obstruction Theorem reframed

The Euler product is a GAS-phase tool (decomposes over individual primes).
Zeros live at β=1/2, deep in CRYSTAL territory (R=1.66).
GAS tools cannot see CRYSTAL structure. Phase mismatch, not a wall.
Crystal lenses (functional equation, Riemann-Siegel formula) work in this region.

## RH in phase language

The zeros at β=1/2 are the shadow of the β=1 phase transition, projected by the functional equation's symmetry s ↔ (1-s). The functional equation maps β=1+ε to β=-ε; the midpoint β=1/2 is the fixed point of this symmetry.

Not a proof. A reframing that identifies the PHASE of the region where zeros live and explains why Euler-product-based approaches cannot reach them.
