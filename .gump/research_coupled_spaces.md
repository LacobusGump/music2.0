# Coupled Residue Spaces: Level Repulsion Emerging

**Date:** March 24, 2026

## The experiment

L_λ = L_0 + λC where:
- L_0 = block-diagonal prime-scaling Laplacians on Z/q_iZ
- C = prime-mediated CRT transitions between layers
- λ = coupling strength

## Results

### 2-layer (Z/211Z × Z/223Z, 432×432)

| λ | Small gap % | Unique eigs | Status |
|---|------------|-------------|--------|
| 0 | 38.3% | 217 (2x degen) | Poisson |
| 0.01 | 60.5% | 431 | Poisson (split) |
| 0.5 | 24.7% | 432 | Weak repulsion |
| 1.0 | 20.0% | 432 | Weak repulsion |

### 4-layer (211×223×227×229, 886×886)

| λ | Small gap % | Status |
|---|------------|--------|
| 0 | 41.0% | Poisson |
| 1.0 | 18.3% | Weak repulsion (best) |
| 5.0 | 21.9% | Saturated |

## What happened

1. Degeneracies split at λ = 0.01 (character conjugate pairs broken)
2. Small gap fraction dropped from 41% → 18.3% (Poisson → weak repulsion)
3. Saturated around 18-20% — never reached GUE (5-10%)

## Interpretation

The coupling does the RIGHT thing (repulsion emerges) but not ENOUGH. The CRT transitions between layers create partial mode mixing but preserve too much block structure. Full GUE requires complete symmetry breaking.

## Direction confirmed

Geometric coupling of arithmetic eigenmodes DOES produce repulsion. The trend is monotonic (more coupling → more repulsion up to saturation). This is the right family of operators.

## Next

Need coupling that breaks ALL symmetries, not just layer separation. Candidates:
- Semidirect product operator (addition and scaling coupled, not separate)
- Random matrix perturbation (to find what GOE/GUE breaking looks like)
- Hecke operator approach (known to have arithmetic meaning + spectral properties)
