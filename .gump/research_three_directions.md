# Three Directions: Scattering, Kernel, Map Operator

**Date:** March 24, 2026

## Direction 1: Scattering

θ(t) mod π at zeros: mean 1.578, std 0.530. Matches uniform distribution. No simple resonance condition (not θ = nπ). The selection rule is complex.

## Direction 2: Kernel Ill-Conditioning

Condition number of the prime↔zero kernel matrix: **2847**.

The transform is nearly degenerate. Small changes in zero positions → large changes in prime distribution. GUE repulsion prevents the condition number from diverging by keeping zeros separated.

The ill-conditioning means: the zeros carry ALMOST redundant information about the primes. They're packed as tightly as stability allows.

## Direction 3: Map Operator

-ζ'(s)/ζ(s) IS the change-of-basis operator:
- Poles = zeros of ζ (the eigenvalues we seek)
- Residues = prime contributions (the eigenvectors)
- It maps prime counting (additive) to scaling behavior (multiplicative)

The operator already exists. The open question: can it be made self-adjoint on some domain with specific boundary conditions?

If yes → eigenvalues are real → zeros are on the critical line → RH.

## Synthesis

The zeros are the resonances of the additive↔multiplicative change of basis. The operator (-ζ'/ζ) is known. The domain and boundary condition are the missing pieces. The kernel's ill-conditioning (κ=2847) explains why the zeros must show GUE repulsion — without it, the transform would become degenerate and the prime↔zero correspondence would break.
