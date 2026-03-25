#!/usr/bin/env python3
"""
Rainbow V2 — Asymptotic Scaling Test (Sparse)

The question: does the prime advantage in GUE ramp slope persist at large N,
or do all families converge?

Method:
  - Sparse multiplicative lattice (lil_matrix → csc)
  - ARPACK shift-invert for ~1000 bulk interior eigenvalues
  - SFF ramp slope as primary metric
  - 20 null families per N for uncertainty estimation
  - Effect size: (prime_slope - null_mean) / null_std
"""

import numpy as np
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import eigsh
from scipy.stats import pearsonr
import time
import sys
import os
import warnings
warnings.filterwarnings('ignore')

sys.path.insert(0, os.path.dirname(__file__))
from rainbow_v2 import (spectral_form_factor, sff_ramp_slope, sff_ramp_mse,
                         sieve_primes, von_mangoldt, unfold_eigenvalues_poly)

# ─────────────────────────────────────────────────────────────
# Sparse multiplicative operator
# ─────────────────────────────────────────────────────────────

def build_sparse_multiplicative(N_states, freq_set=None):
    """
    Build sparse multiplicative lattice.
    H[n,m] = Λ(m/n) if n|m, symmetrized.
    If freq_set given, only allow ratios that are powers of elements in freq_set.
    """
    prime_list = sieve_primes(N_states)
    primes_set = set(prime_list)

    H = lil_matrix((N_states, N_states))
    nnz = 0

    for n in range(1, N_states + 1):
        # Iterate over multiples of n
        for m in range(2 * n, N_states + 1, n):
            ratio = m // n

            if freq_set is not None:
                allowed = False
                for f in freq_set:
                    if f < 2:
                        continue
                    r = ratio
                    while r % f == 0:
                        r //= f
                    if r == 1:
                        allowed = True
                        break
                if not allowed:
                    continue

            weight = von_mangoldt(ratio, primes_set, prime_list)
            if weight > 0:
                H[n-1, m-1] = weight
                H[m-1, n-1] = weight
                nnz += 2

    return H.tocsc(), nnz


def extract_bulk_eigenvalues(H, n_eigs=1000):
    """
    Extract interior eigenvalues using shift-invert.
    Targets eigenvalues near sigma=0 (middle of spectrum).
    """
    N = H.shape[0]
    k = min(n_eigs, N - 2)
    if k < 20:
        return None

    try:
        # Shift-invert around 0 to get interior eigenvalues
        eigs = eigsh(H, k=k, sigma=0.0, which='LM',
                     return_eigenvectors=False, maxiter=5000)
        return np.sort(eigs)
    except Exception:
        try:
            # Fallback: try a small shift
            eigs = eigsh(H, k=k, sigma=0.1, which='LM',
                         return_eigenvectors=False, maxiter=5000)
            return np.sort(eigs)
        except Exception:
            return None


def eigs_to_sff_slope(eigs):
    """Full pipeline: eigenvalues → unfolded spacings → SFF → ramp slope."""
    if eigs is None or len(eigs) < 30:
        return None, None, None

    # Take positive eigenvalues, unfold
    pos = eigs[eigs > 1e-8]
    if len(pos) < 30:
        pos = eigs[np.abs(eigs) > 1e-8]
    if len(pos) < 30:
        return None, None, None

    unf = unfold_eigenvalues_poly(pos, deg=3)
    spacings = np.diff(unf)
    spacings = spacings[spacings > 1e-12]
    if len(spacings) < 20:
        return None, None, None

    spacings = spacings / np.mean(spacings)

    taus, K = spectral_form_factor(spacings, tau_max=2.0, n_tau=200)
    slope, intercept = sff_ramp_slope(taus, K, fit_range=(0.1, 0.8))
    mse = sff_ramp_mse(taus, K, fit_range=(0.05, 0.9))

    return slope, mse, len(spacings)


# ─────────────────────────────────────────────────────────────
# Null family generators
# ─────────────────────────────────────────────────────────────

def generate_null_families(n_families=20, base_seed=3000):
    """Generate diverse null families."""
    families = []

    from rainbow_validate import is_prime

    PRIMES_13 = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41]

    # 8 random odd sets
    for i in range(8):
        rng = np.random.default_rng(base_seed + i)
        odds = list(range(3, 56, 2))
        chosen = sorted(rng.choice(odds, size=13, replace=False).tolist())
        families.append((f"rand_odd_{i}", chosen))

    # 4 log-matched fakes (different offsets)
    for i, offset in enumerate([0.10, 0.15, 0.20, 0.30]):
        ln_p = np.log(PRIMES_13)
        target_ln = ln_p + offset
        candidates = [int(round(np.exp(v))) for v in target_ln]
        fake = []
        seen = set()
        for c in candidates:
            if c < 2: c = 4
            while is_prime(c) or c in seen: c += 1
            seen.add(c)
            fake.append(c)
        families.append((f"log_match_{i}", sorted(fake)))

    # 2 composite sets
    families.append(("composites_A", [4, 6, 9, 15, 21, 25, 33, 35, 39, 45, 49, 51, 55]))
    families.append(("composites_B", [6, 10, 14, 15, 22, 26, 34, 35, 38, 46, 51, 55, 57]))

    # 2 semiprime sets (products of two primes)
    families.append(("semiprimes", [6, 10, 14, 15, 21, 22, 26, 33, 34, 35, 38, 39, 46]))

    # 2 prime power sets
    families.append(("prime_powers", [2, 3, 4, 5, 7, 8, 9, 11, 13, 16, 25, 27, 32]))

    # 1 shifted primes
    families.append(("shifted_p+1", [4, 5, 8, 10, 14, 16, 20, 22, 26, 32, 34, 40, 44]))

    return families


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────

def header(s):
    print(f"\n{'='*70}")
    print(f"  {s}")
    print(f"{'='*70}\n")


def main():
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║   RAINBOW V2 — ASYMPTOTIC SCALING (SPARSE)                        ║")
    print("║   Does the prime advantage persist at large N?                     ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")

    REAL_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41]
    N_EIGS_TARGET = 1000

    null_families = generate_null_families(n_families=20)

    all_families = [("PRIMES", REAL_PRIMES)] + null_families

    # Track results across scales
    scale_results = {}

    for N in [1000, 3000, 5000, 10000]:
        header(f"N = {N}")

        n_eigs = min(N_EIGS_TARGET, N // 3)

        results = {}
        print(f"  {'Family':<20} {'NNZ':>8} {'#eigs':>6} {'#sp':>5} {'Slope':>8} {'MSE_GUE':>10} {'Time':>6}")
        print(f"  {'-'*68}")

        for label, freqs in all_families:
            t0 = time.time()
            H, nnz = build_sparse_multiplicative(N, freq_set=freqs)
            eigs = extract_bulk_eigenvalues(H, n_eigs=n_eigs)
            slope, mse, n_sp = eigs_to_sff_slope(eigs)
            dt = time.time() - t0

            if slope is not None:
                results[label] = {"slope": slope, "mse": mse, "n_sp": n_sp, "nnz": nnz}
                show_label = label[:20]
                print(f"  {show_label:<20} {nnz:>8} {len(eigs) if eigs is not None else 0:>6} {n_sp:>5} {slope:>+8.4f} {mse:>10.4f} {dt:>5.0f}s")
            else:
                print(f"  {label:<20} {nnz:>8} {'FAIL':>6}")

        # ── Summary for this N ──
        prime_slope = results.get("PRIMES", {}).get("slope")
        if prime_slope is None:
            continue

        null_slopes = [r["slope"] for k, r in results.items() if k != "PRIMES" and r.get("slope") is not None]
        if not null_slopes:
            continue

        null_slopes = np.array(null_slopes)
        null_mean = np.mean(null_slopes)
        null_std = np.std(null_slopes)
        gap = prime_slope - null_mean
        effect_size = gap / null_std if null_std > 0 else float('inf')

        # Rescale by variance: normalized slope
        prime_mse = results["PRIMES"]["mse"]
        null_mses = [r["mse"] for k, r in results.items() if k != "PRIMES" and r.get("mse") is not None]

        print(f"\n  ── N={N} Summary ──")
        print(f"  Prime slope:           {prime_slope:+.4f}")
        print(f"  Null mean ± std:       {null_mean:+.4f} ± {null_std:.4f}")
        print(f"  Gap (prime - null):    {gap:+.4f}")
        print(f"  Effect size (Cohen d): {effect_size:+.2f}")
        print(f"  Prime rank:            {1 + np.sum(null_slopes >= prime_slope)} of {1 + len(null_slopes)}")
        print(f"  Prime MSE vs GUE:      {prime_mse:.4f}")
        print(f"  Null MSE mean:         {np.mean(null_mses):.4f}")

        # Null distribution
        n_above = np.sum(null_slopes >= prime_slope)
        print(f"  Nulls >= prime slope:  {n_above}/{len(null_slopes)}")

        scale_results[N] = {
            "prime_slope": prime_slope,
            "null_mean": null_mean,
            "null_std": null_std,
            "gap": gap,
            "effect_size": effect_size,
            "prime_rank": 1 + int(np.sum(null_slopes >= prime_slope)),
            "n_nulls": len(null_slopes),
        }

    # ── Asymptotic trend ──
    header("ASYMPTOTIC TREND")
    print(f"  {'N':>6} {'Prime slope':>12} {'Null mean':>12} {'Gap':>10} {'Effect (d)':>12} {'Rank':>8}")
    print(f"  {'-'*62}")
    for N in sorted(scale_results.keys()):
        r = scale_results[N]
        print(f"  {N:>6} {r['prime_slope']:>+12.4f} {r['null_mean']:>+12.4f} {r['gap']:>+10.4f} {r['effect_size']:>+12.2f} {r['prime_rank']:>4}/{r['n_nulls']+1}")

    # ── Verdict ──
    header("VERDICT")
    if len(scale_results) >= 2:
        Ns = sorted(scale_results.keys())
        gaps = [scale_results[N]["gap"] for N in Ns]
        effects = [scale_results[N]["effect_size"] for N in Ns]

        gap_trend = np.polyfit(Ns, gaps, 1)[0]
        effect_trend = np.polyfit(Ns, effects, 1)[0]

        print(f"  Gap trend (slope per 1000 N):     {gap_trend * 1000:+.4f}")
        print(f"  Effect size trend:                {effect_trend * 1000:+.4f}")
        print()

        if gap_trend > 0:
            print(f"  FUTURE A: Gap GROWING. Prime advantage strengthens with N.")
        elif gap_trend < -0.0001:
            print(f"  FUTURE B: Gap SHRINKING. Families converging.")
        else:
            print(f"  INCONCLUSIVE: Gap stable. Need larger N to decide.")

        # Is primes consistently #1?
        ranks = [scale_results[N]["prime_rank"] for N in Ns]
        print(f"  Prime ranks across scales: {ranks}")
        if all(r == 1 for r in ranks):
            print(f"  Primes rank #1 at every scale tested.")
        else:
            print(f"  Primes do NOT consistently lead.")


if __name__ == "__main__":
    main()
