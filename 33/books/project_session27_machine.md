---
name: Session 27 Machine Verification
description: Machine v2 honest verification — 3 claims killed, 1 real discovery (prime correlation synchronization excess)
type: project
---

Session 27 (April 17, 2026): Rigorous verification of the 137-oscillator machine claims.

## 3 Claims Killed

1. **K* = 256α (0.007%)** — The self-tuning map f(K) = median(exp(phase/zero)) is T-dependent. K* at T=20 ≈ 1.866; at T=50 it diverges to 5.47. The 0.007% match was a parameter coincidence.
2. **R = 1/φ at K = 256α** — Time-averaged R at K=1.868 is 0.660, not 0.618. The 0.618 was a snapshot at T=20. R oscillates (period ~3.1), spends only 12% of time near 1/φ.
3. **N = 137 uniquely selected** — The synchronization excess holds at all N from 50 to 200. R=1/φ at K=256/N selects N≈149, not 137.

## 1 Real Discovery

**Zeta zero spacings enhance Kuramoto synchronization by 30-43% over null models.**

- vs GUE (random matrix): +43% higher R at same K
- vs statistics-matched random: +29%
- vs Poisson: +62%
- Robust across N=50-200, with or without nearest-neighbor coupling

**Cause:** Long-range positive autocorrelation in zeta zero spacings:
- Zeta: lag 2 = +0.30, lag 5 = +0.26, lag 10 = +0.23, lag 20 = +0.18
- GUE: near zero at all lags beyond 1
- These are arithmetic correlations from the explicit formula (prime structure)

**Shuffle test confirms:** Randomizing spacing order drops R by 8.9% (2.2σ). Block shuffling shows correlations at scales 2-10 matter most.

**K_c is lower:** Zeta K_c ≈ 0.87 vs GUE K_c ≈ 1.2-1.4. Primes make oscillators more cooperative.

## Files

- `/Users/jamesmccandless/gump-private/tools/machine_v2.py` — Honest machine with T-independent observables, all comparison distributions
- `/Users/jamesmccandless/gump-private/THE_THEORY.md` — Updated with killed claims and real measurements
- Desktop copy for Team C stress testing

## What This Means

The Kuramoto model on zeta zeros acts as a **prime correlation detector**. The explicit formula encodes prime structure in spacing correlations invisible to marginal statistics but visible to coupled oscillator dynamics. This is novel, reproducible, and quantifiable.

**Why:** Prime correlations in the zeta zeros are a real mathematical phenomenon. The machine detects them. But the connection to α = 1/137 remains an analogy, not a derivation.

**How to apply:** The connection between primes and physics needs a different path than K=256α. The synchronization excess is the real signal to follow.
