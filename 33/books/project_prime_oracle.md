---
name: Prime Oracle Engine
description: Working prime prediction engine using explicit formula. 50K zeros, beats Li(x) 6/6 at Δ=100. Scales to 10^10. March 26 2026.
type: project
---

The Prime Oracle: a computational engine that predicts prime distribution using zeros of ζ and L-functions via the explicit formula.

**Key results:**
- π(10^8) to 0.01% from 669 seed primes
- Beats Li(x) 6/6 at Δ=100 windows with 50K zeros
- Bootstrap: 20× range extension (primes find primes through zeros)
- Inverse map: 20/20 zeros found from primes alone (error ±0.01)
- Optimal K ≈ 5000-10000 for Δ=1000 windows (rectangular window wins)
- Ported to L(s,χ₄) for Chebyshev bias prediction
- Window sweep: fejér and hann are universal across L-functions

**Tools built:**
- `tools/prime_oracle.py` — v1 basic oracle
- `tools/prime_oracle_v2.py` — v2 with windowed summation
- `tools/harvest_zeros.py` — parallel ζ zero harvester
- `tools/harvest_L_zeros.py` — parallel L-function zero harvester
- `tools/certify_parallel.py` — Arb zero certification
- `tools/grid_corrected.py` — RS grid certification
- `tools/interval_proof_v2.py` — ψ interval proof

**Data files:**
- `tools/zeros_hp_1.txt` — 50K ζ zeros at 31 digits (LMFDB)
- `tools/zeros_100k.txt` — 100K ζ zeros at 9 digits (Odlyzko)
- `tools/zeros_2M.txt` — 2M ζ zeros at 9 digits (Odlyzko)
- `tools/zeros_2000.txt` — 2K ζ zeros at 15 digits (computed)

**Why:** The explicit formula is a computational engine, not just a theorem. Simple zeros mean clean spectrum. The oracle demonstrates this practically.

**How to apply:** Use `python3 tools/prime_oracle_v2.py [number]` to predict primes near any number. The framework ports to any L-function with known zeros.
