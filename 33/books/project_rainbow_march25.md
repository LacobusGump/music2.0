---
name: Rainbow operator arc — March 25, 2026
description: Full arc from rainbow operator through 6 kill shots to the direct quantization result. Five operator approaches tested and honestly evaluated.
type: project
---

## What happened

Started from prior session's rainbow operator (0.887 held-out correlation claim).
Built full validation suite. Original results didn't survive rigorous testing.
Iterated through 5 approaches, each honestly evaluated and killed when warranted.

## The five machines

1. **V1 (Graph Laplacian)** — Smooth density envelope did all the work. Artifact.
2. **V2 (Multiplicative Lattice)** — Algebraic connectivity, not zeta-specific. d=0.18 at N=10000.
3. **V3 (Explicit Formula Operator)** — Confinement dominated. Coupling too weak.
4. **CAT (Schrödinger)** — No transfer. Residual correlation = 0.0004.
5. **Direct Quantization** — THE RESULT. Explicit formula inversion. Zero free parameters.

## The direct quantization result (frozen)

Truncated explicit formula predicts individual zeta zeros to 4.5% of mean spacing (15 primes), improving to 2.4% (95 primes). Six kill shots all confirm:
- Out-of-sample (zeros 201-1000): stable
- Scaling law: monotonic, no retuning
- Zero calibration: no free parameters
- Leave-one-prime-out: tracks theory weights
- Phase scramble: 4-10x error (phases load-bearing)
- Frequency perturbation: ε=0.001 triples error

Frozen at `.gump/result_direct_quantization.md`.
Plots at `tools/result_plots.html`.

## What this means

The explicit formula is computationally powerful enough to locate zeros, but doesn't operatorize — every operator introduces spectral physics that drowns the arithmetic. The bridge from "prime harmonics predict zeros" to "self-adjoint operator whose spectrum IS the zeros" may be the actual content of Hilbert-Pólya.

## D_on = 2π (proven)

Each on-line zero contributes exactly 2π to the Gaussian-weighted curvature functional. Proof via F(τ) = exp(τ²/(2w²))·erfc(τ/(w√2)), FTC gives -2π[0-1] = 2π. Independent of w.

Off-line defect positive when w ≥ ε but NOT for all ε at fixed small w. The contradiction engine (G = 2πN from prime side) is CIRCULAR — Hadamard and Euler products are the same function. The explicit formula bridges them but IS the identity.

## Key files
- `tools/rainbow_validate.py` — V1 validation suite
- `tools/rainbow_v2.py` — multiplicative lattice
- `tools/rainbow_v3.py` — EFO + direct quantization kill shots
- `.gump/preregistration_1000zero.md` — preregistered protocol
- `.gump/result_direct_quantization.md` — frozen result
- `.gump/construction_prime_phase_quantization.md` — the coherent construction
- `.gump/battlefield_march25.md` — where the wall is
- `.gump/session_final_march25.md` — honest final accounting
