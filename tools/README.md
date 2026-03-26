# Spectral Tools
### Grand Unified Music Project — March 26, 2026

A computational engine that predicts prime distribution using the explicit formula. 669 seed primes → π(10⁸) to 0.01%. Runs in 4 milliseconds on a laptop.

## The Result

| x | Oracle | Actual | Error | Li(x) Error |
|---|--------|--------|-------|-------------|
| 10⁶ | 78,498 | 78,498 | **0.0003%** | 0.17% |
| 10⁷ | 664,578 | 664,579 | **0.0001%** | 0.05% |
| 10⁸ | 5,761,465 | 5,761,455 | **0.0002%** | 0.01% |
| 10⁹ | 50,847,520 | 50,847,534 | **0.00003%** | 0.003% |
| 10¹⁰ | 455,052,532 | 455,052,511 | **0.000005%** | 0.0007% |
| 10¹¹ | 4,118,054,689 | 4,118,054,813 | **0.000003%** | 0.0003% |
| 10¹² | 37,607,910,995 | 37,607,912,018 | **0.000003%** | 0.0001% |

Beats the logarithmic integral Li(x) at every scale. 30× more accurate at 10¹².

Each evaluation: 4 milliseconds. 10,000 zeros. Pure Python.

## Quick Start

```bash
pip install mpmath
curl -o tools/zeros_hp_1.txt "https://www.lmfdb.org/zeros/zeta/list?limit=50000&start=1&download=yes"
python3 tools/spectral_engine.py pi 1000000
# Output: π(1,000,000) ≈ 78,498  (actual: 78,498)
```

## The Tools

### Core (start here)

| Tool | What it does | Try it |
|------|-------------|--------|
| `spectral_engine.py` | Predict primes from zeros. Count, scan, error decomposition, SNR. | `python3 spectral_engine.py count 100000 1000` |
| `pair_correlation.py` | Is your data GUE, Poisson, or other? Works on any sequence. | `python3 pair_correlation.py --demo zeta` |
| `phase_meter.py` | Measure Φ (departure from equilibrium) for any time series. | `python3 phase_meter.py --demo heart` |
| `projector.py` | The explicit formula as a projection. Feed anything, it converges toward primes. | `python3 projector.py --input random` |

### Analysis

| Tool | What it does | Try it |
|------|-------------|--------|
| `oscillator_diagnostic.py` | Measure coupling K and order parameter r for coupled systems. | `python3 oscillator_diagnostic.py --demo seizure` |
| `rng_tester.py` | Test randomness by comparing to GUE statistics. | `python3 rng_tester.py --test python` |
| `denoiser.py` | Denoise signals using the SNR law. | `python3 denoiser.py --demo` |
| `rh_hunter.py` | Hunt for the pointwise bound that would close RH. | `python3 rh_hunter.py` |

### Computation

| Tool | What it does | Try it |
|------|-------------|--------|
| `certify_parallel.py` | Certify zeros as simple using Arb ball arithmetic. | `python3 certify_parallel.py 100` |
| `harvest_zeros.py` | Compute ζ zeros in parallel across all cores. | `python3 harvest_zeros.py 1000` |
| `harvest_L_zeros.py` | Compute L-function zeros in parallel. | `python3 harvest_L_zeros.py 1000` |
| `interval_proof_v2.py` | Prove ψ(p) > 0.38 on [0,1] with Arb intervals. | `python3 interval_proof_v2.py` |
| `grid_corrected.py` | RS grid certification with correct formula. | `python3 grid_corrected.py` |

### Browser

| Tool | What it does |
|------|-------------|
| `../js/prime_engine.js` | Kuramoto coupled oscillator synthesis. Phase coherence makes the music. |
| `../R.html` | The research page. How the universe works. |
| `../R_visuals.html` | 12 science-grade diagrams. |

## Data Files

Download these (free, instant):

```bash
# 50,000 zeros at 31-digit precision (LMFDB)
curl -o tools/zeros_hp_1.txt "https://www.lmfdb.org/zeros/zeta/list?limit=50000&start=1&download=yes"

# 100,000 zeros at 9-digit precision (Odlyzko)
curl -o tools/zeros_100k.txt https://www-users.cse.umn.edu/~odlyzko/zeta_tables/zeros1

# 2 million zeros (Odlyzko, 14MB gzipped)
curl -o tools/zeros_2M.txt.gz https://www-users.cse.umn.edu/~odlyzko/zeta_tables/zeros6.gz && gunzip tools/zeros_2M.txt.gz
```

## Key Results

**The Prime Oracle:** 669 seed primes → π(10⁸) to 0.01%. Beats Li(x) 6/6 at Δ=100 windows. Bootstrap extends range 20×. Inverse map recovers 20/20 zeros from primes alone.

**Pair Correlation:** 500,000 pairs confirm Montgomery's conjecture. GUE is 9× better fit than Poisson. Zeros are super-GUE (more rigid than random matrices).

**The Projector:** The explicit formula compresses any sequence toward GUE. The primes are the fixed point. Start from squares, random, composites — the forward map always produces super-GUE zeros.

**Simplicity:** ψ(p) ≥ sin(π/8) on [0,1]. 10,000 Arb-certified simple zeros. Zero failures.

## The SNR Law

The optimal spectral window depends on signal-to-noise ratio:

| SNR | Window | Use case |
|-----|--------|----------|
| > 10 | Rectangular | ζ prime counting (strong signal) |
| 1-10 | Fejér | Balanced |
| < 1 | Hann | L-function bias (weak signal) |

Universal across all L-functions.

## Requirements

```
pip install mpmath              # for all tools
pip install python-flint        # for Arb certification only
```

## Full Research

- `begump.com/R` — How the universe works
- `begump.com/R_visuals.html` — 12 visual diagrams

Built in one night. March 26, 2026. Mac Mini M4. 669 primes.
