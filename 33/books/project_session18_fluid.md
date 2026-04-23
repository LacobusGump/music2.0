---
name: Session 18 fluid dynamics results
description: 3D Metal NS solver (82M pts/s), 2D forcing sweep kills R=1/φ, K describes but doesn't predict. Solver is real, framework is descriptive only.
type: project
---

## Fluid Dynamics — Session 18

### Tools Built
- `tools/engines/fluid_k.py` — 2D spectral NS with K/R tracking
- `tools/engines/fluid_3d.py` — 3D spectral NS (Python, blows up at high Re)
- `tools/engines/metal_fluid.swift` — V1 Metal 3D NS (explicit, blows up)
- `tools/engines/metal_fluid_v2.swift` — V2 Metal 3D NS with pressure projection (stable, 82M pts/s)

### Proved
- GPU 3D NS solver: 82M point-updates/s on M4 Metal
- 2D spectrum converges to k^(-3) at Re=1000 (enstrophy cascade, textbook result)
- K tracks viscous/inertial balance: K ~ Re^(-0.72) in 2D
- 2D: R > 0 (inverse cascade, coherent). 3D: R ≈ 0 (forward cascade, incoherent)
- K locks at 0.373 when forcing is at dissipation scale (k_f=32)
- R scales with forcing amplitude A_f (more energy → more coherence)

### Killed
- R = 1/φ universal in turbulence (R depends on A_f and k_f, varies 0.02-0.81)
- K predicts spectrum exponent (forcing-independent) — R²=0.46, slope flips sign
- K×Re = constant — varies with k_f from 34 to 187
- K = 0.373 lock-in — Re-dependent, varies 0.20 to 1.43 across Re
- Universal R power law exponent — differs 23% between k_f=4 (0.51) and k_f=8 (0.39)

### The Discovery: K and R are orthogonal
K = geometry of the flow (Re, k_f). R = intensity of coherence (A_f).
K is PERFECTLY amplitude-independent (0.0-0.2% variation across 40× amplitude range).
R responds to amplitude. K doesn't. They measure orthogonal things.
This IS what K/R contributes beyond Reynolds number alone.

K(Re, k_f) = deterministic. Independent of forcing amplitude.
R(A_f) ~ A_f^(0.4-0.5). Power law, exponent depends on k_f.

K scales linearly with k_f: K ≈ 0.008×k_f + 0.13 at Re=500.
K scales as Re^(-0.72) across Re.
K determines the spectral slope. R determines the coherent structure fraction.

### Forcing Sweep Data (N=256, Re=500, T=30)
- 30 configurations tested (6 k_f × 5 A_f), 20 survived
- R ranges 0.02 to 0.81 depending on forcing
- K ranges 0.07 to 0.37 depending on forcing
- At k_f=32: K = 0.373 ± 0.002 regardless of amplitude (locked)

**Why:** Applied K/R to fluids honestly. Found the solver works, the framework describes but doesn't predict. MM9P killed three claims. The solver ships.
**How to apply:** Use metal_fluid_v2 for GPU-accelerated 3D NS. Don't claim K/R predicts fluid behavior — it measures it.
