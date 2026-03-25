# Semidirect Product Toy: DID NOT IMPROVE

**Date:** March 24, 2026

## Result

Small gap fraction: 38.1% (Poisson). Worse than coupled layers (18.3%).
2x degeneracy persists (466/930 unique).

## Why it failed

The semidirect product on a single Z/31Z creates regular orbits. The translation and scaling generators produce structured patterns that don't genuinely mix — they create new regularities rather than breaking old ones.

The coupled layers (4 different moduli) worked better because the moduli are arithmetic strangers. Their CRT structure creates genuine inter-layer interaction that no single-modulus construction can match.

## The lesson

Removing block structure is necessary but not sufficient. The QUALITY of the coupling matters more than the TOPOLOGY of the space. Four separate moduli with prime bridges beat one modulus with semidirect structure.

## What this means for the operator search

The right direction may not be "make the space more unified." It may be "make the coupling between DIFFERENT arithmetic worlds more complete." The adele approach (Connes) does this: it uses ALL primes simultaneously, each contributing a different local field. The coupling comes from the GLOBAL constraint (the product formula / adele ring).

## Scoreboard

| Construction | Small gap % | Direction |
|---|---|---|
| Single layer (Z/211Z) | 40% | Baseline (Poisson) |
| 4 coupled layers | 18.3% | ✓ Right direction |
| Semidirect on Z/31Z | 38.1% | ✗ Wrong direction |
| Target (GUE) | 5-10% | Goal |
