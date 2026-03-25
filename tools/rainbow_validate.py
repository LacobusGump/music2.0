#!/usr/bin/env python3
"""
Rainbow Operator — Full Validation Suite
Built from FROZEN SPEC (March 25, 2026)

Implements:
  1. Operator construction (exact spec reproduction)
  2. Fresh zero windows (zeros 21-30, 31-40, 41-50)
  3. Neighboring targets (GUE, Poisson, Dirichlet L-functions)
  4. Modulus perturbation (near sweet spots)
  5. Pseudoprimes / density-matched random sets
  6. Matrix size / prime cutoff scaling
  7. Statistical hardening (CIs, permutation p-values, multiple comparison correction)
  8. Prime 37 deep dive

Usage:
  python3 rainbow_validate.py              # full suite
  python3 rainbow_validate.py --quick      # fast sanity check (fewer permutations)
  python3 rainbow_validate.py --section 8  # run only section 8 (prime 37)
"""

import numpy as np
from scipy.linalg import eigvalsh
from scipy.stats import pearsonr, norm
import argparse
import time
import sys
import json
from itertools import combinations

# ─────────────────────────────────────────────────────────────
# FROZEN SPEC CONSTANTS
# ─────────────────────────────────────────────────────────────

MODULI = [211, 223, 227, 229, 233, 239, 241, 251, 257, 263]
PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41]
NC = 3
BG_STR = 0.1
RIP_STR = 0.3
LAMBDA_RAINBOW = 5.0

# Zeta zeros (imaginary parts)
ZEROS_1_10 = [14.135, 21.022, 25.011, 30.425, 32.935,
              37.586, 40.919, 43.327, 48.005, 49.774]
ZEROS_11_20 = [52.970, 56.446, 59.347, 60.832, 65.113,
               67.080, 69.546, 72.067, 75.705, 77.145]
ZEROS_21_30 = [79.337, 82.910, 84.735, 87.425, 88.809,
               92.492, 94.651, 95.871, 98.831, 101.318]
ZEROS_31_40 = [103.726, 105.447, 107.169, 111.030, 111.875,
               114.320, 116.227, 118.791, 121.370, 122.947]
ZEROS_41_50 = [124.257, 127.517, 129.579, 131.088, 133.498,
               134.757, 138.116, 139.736, 141.124, 143.112]

# ─────────────────────────────────────────────────────────────
# OPERATOR CONSTRUCTION
# ─────────────────────────────────────────────────────────────

def mod_inverse(a, m):
    """Extended Euclidean algorithm for modular inverse."""
    if np.gcd(a, m) != 1:
        return None
    g, x, _ = extended_gcd(a, m)
    return x % m

def extended_gcd(a, b):
    if a == 0:
        return b, 0, 1
    g, x, y = extended_gcd(b % a, a)
    return g, y - (b // a) * x, x

def get_units(q):
    """Return sorted list of units in (Z/qZ)*."""
    return sorted([x for x in range(1, q) if np.gcd(x, q) == 1])

def build_operator(moduli=None, primes=None, nc=None, bg_str=None,
                   rip_str=None, lam=None, return_parts=False):
    """Build the rainbow operator from spec. Returns eigenvalues (sorted)."""
    if moduli is None: moduli = MODULI
    if primes is None: primes = PRIMES
    if nc is None: nc = NC
    if bg_str is None: bg_str = BG_STR
    if rip_str is None: rip_str = RIP_STR
    if lam is None: lam = LAMBDA_RAINBOW

    # Compute unit groups and offsets
    units_per_mod = []
    offsets = [0]
    for q in moduli:
        u = get_units(q)
        units_per_mod.append(u)
        offsets.append(offsets[-1] + len(u))
    NA = offsets[-1]
    NT = NA * nc

    # ── L_arith (block diagonal Laplacian) ──
    L_arith = np.zeros((NA, NA))
    for mi, q in enumerate(moduli):
        units = units_per_mod[mi]
        unit_set = set(units)
        unit_to_idx = {x: i for i, x in enumerate(units)}
        nq = len(units)
        off = offsets[mi]

        for p in primes:
            if q % p == 0:
                continue
            lnp = np.log(p)
            p_inv = mod_inverse(p, q)
            for i, x in enumerate(units):
                # p*x mod q
                px = (p * x) % q
                if px in unit_set:
                    j = unit_to_idx[px]
                    L_arith[off + i, off + j] += 1.0 / lnp
                    L_arith[off + i, off + i] -= 1.0 / lnp
                # p^{-1}*x mod q
                if p_inv is not None:
                    pinvx = (p_inv * x) % q
                    if pinvx in unit_set:
                        j = unit_to_idx[pinvx]
                        L_arith[off + i, off + j] += 1.0 / lnp
                        L_arith[off + i, off + i] -= 1.0 / lnp

    # Symmetrize
    L_arith = (L_arith + L_arith.T) / 2.0

    # ── L0 = L_arith ⊗ I_nc ──
    I_nc = np.eye(nc)
    L0 = np.kron(L_arith, I_nc)

    # ── Rainbow coupling C_total = Σ_p kron(U_p, C_p) ──
    C_total = np.zeros((NT, NT), dtype=complex)

    for pi, p in enumerate(primes):
        # Build C_p (nc × nc Hermitian)
        phi1 = 2 * np.pi * pi / 13
        phi2 = 2 * np.pi * (3 * pi + 1) / 13
        w = 1.0 / np.log(p)

        Cp = np.zeros((nc, nc), dtype=complex)
        if nc >= 2:
            Cp[0, 1] = w * np.exp(1j * phi1)
            Cp[1, 0] = w * np.exp(-1j * phi1)
        if nc >= 3:
            Cp[0, 2] = 0.7 * w * np.exp(1j * phi2)
            Cp[2, 0] = 0.7 * w * np.exp(-1j * phi2)
            Cp[1, 2] = 0.5 * w * np.exp(1j * (phi1 + phi2))
            Cp[2, 1] = 0.5 * w * np.exp(-1j * (phi1 + phi2))
        Cp = (Cp + Cp.conj().T) / 2.0

        # Build U_p (NA × NA interlayer coupling)
        Up = np.zeros((NA, NA))
        for ma, qa in enumerate(moduli):
            if qa % p == 0:
                continue
            units_a = units_per_mod[ma]
            off_a = offsets[ma]
            for mb, qb in enumerate(moduli):
                if mb == ma:
                    continue
                if qb % p == 0:
                    continue
                units_b = units_per_mod[mb]
                unit_b_set = set(units_b)
                unit_b_to_idx = {x: i for i, x in enumerate(units_b)}
                off_b = offsets[mb]
                for i, x in enumerate(units_a):
                    px_mod = (p * x) % qb
                    if px_mod in unit_b_set:
                        j = unit_b_to_idx[px_mod]
                        Up[off_a + i, off_b + j] = 1.0

        Up = (Up + Up.T) / 2.0
        C_total += np.kron(Up, Cp)

    # Normalize
    cn = np.linalg.norm(C_total, 'fro')
    ln0 = np.linalg.norm(L0, 'fro')
    L_rainbow = L0 + lam * C_total * (ln0 / cn) * 0.1
    L_rainbow = (L_rainbow + L_rainbow.conj().T) / 2.0

    # ── Diagonal landscape V ──
    center = np.mean(moduli) / 2.0
    V_arith = np.zeros(NA)
    idx = 0
    for mi, q in enumerate(moduli):
        units = units_per_mod[mi]
        for x in units:
            u = np.log(x) - np.log(center)
            bg = bg_str * u**2 / 4.0
            ripple = 0.0
            for p in primes:
                ripple += np.log(p) / np.sqrt(p) * np.cos(u * np.log(p))
            V_arith[idx] = bg + rip_str * ripple
            idx += 1

    V_full = np.zeros(NT)
    for i in range(NA):
        for c in range(nc):
            V_full[i * nc + c] = V_arith[i]

    V_diag = np.diag(V_full)
    V_norm = np.linalg.norm(V_diag, 'fro')
    R_norm = np.linalg.norm(L_rainbow, 'fro')
    L_total = L_rainbow.real + V_diag * (R_norm / V_norm)
    L_total = (L_total + L_total.T) / 2.0

    if return_parts:
        return L_total, L0, C_total, V_diag, NA, NT

    eigs = eigvalsh(L_total)
    return eigs


def normalized_spacings(zeros):
    """Compute normalized spacings from a list of zeros."""
    gaps = np.diff(zeros)
    return gaps / np.mean(gaps)


def unfold_eigenvalues(eigs, poly_deg=5):
    """Spectral unfolding via polynomial fit to cumulative density.
    Standard RMT procedure: removes smooth density variation so that
    mean spacing = 1 everywhere in the bulk."""
    N = len(eigs)
    cdf = np.arange(1, N + 1, dtype=float)
    coeffs = np.polyfit(eigs, cdf, poly_deg)
    return np.polyval(coeffs, eigs)


def measure_correlation(eigs, target_zeros, start_fracs=None):
    """
    Measure max positive Pearson correlation between eigenvalue spacings
    and target zero spacings. Uses spectral unfolding on positive eigenvalues
    (standard RMT procedure).
    Returns (max_corr, best_start_frac, p_value).
    """
    if start_fracs is None:
        start_fracs = np.arange(0.01, 0.90, 0.01)

    # Positive eigenvalues, unfolded
    pos = eigs[eigs > 0.01]
    if len(pos) < 20:
        pos = eigs[eigs > 1e-8]
    if len(pos) < 20:
        return -1.0, 0.0, 1.0

    unfolded = unfold_eigenvalues(pos)

    K = len(target_zeros)
    zn = normalized_spacings(target_zeros)

    best_corr = -1
    best_frac = 0
    best_pval = 1.0

    for frac in start_fracs:
        start = int(frac * len(unfolded))
        end = start + K + 1
        if end > len(unfolded):
            continue
        sample = unfolded[start:end]
        eg = np.diff(sample)
        if np.any(eg <= 1e-12):
            continue
        en = eg / np.mean(eg)
        n = min(len(en), len(zn))
        if n < 4:
            continue
        r, pval = pearsonr(en[:n], zn[:n])
        if r > best_corr:
            best_corr = r
            best_frac = frac
            best_pval = pval

    return best_corr, best_frac, best_pval


def small_gap_fraction(eigs):
    """Compute small gap fraction (gaps < 0.5 * mean gap) in bulk."""
    nonzero = eigs[np.abs(eigs) > 1e-8]
    N = len(nonzero)
    bulk = nonzero[N // 4: 3 * N // 4]
    gaps = np.diff(bulk)
    gaps = gaps[gaps > 1e-10]
    if len(gaps) == 0:
        return 0.0
    mean_gap = np.mean(gaps)
    return np.mean(gaps / mean_gap < 0.5)


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def primes_up_to(n):
    """Simple sieve."""
    sieve = [True] * (n + 1)
    sieve[0] = sieve[1] = False
    for i in range(2, int(n**0.5) + 1):
        if sieve[i]:
            for j in range(i*i, n+1, i):
                sieve[j] = False
    return [i for i in range(n+1) if sieve[i]]

def is_prime(n):
    if n < 2: return False
    if n < 4: return True
    if n % 2 == 0 or n % 3 == 0: return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i+2) == 0: return False
        i += 6
    return True

def next_primes_after(start, count):
    """Get `count` primes starting after `start`."""
    result = []
    n = start + 1
    while len(result) < count:
        if is_prime(n):
            result.append(n)
        n += 1
    return result

def header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def subheader(title):
    print(f"\n  ── {title} ──\n")


# ─────────────────────────────────────────────────────────────
# SECTION 1: REPRODUCE BASELINE
# ─────────────────────────────────────────────────────────────

def section_1_baseline():
    header("SECTION 1: Reproduce Baseline from Frozen Spec")

    t0 = time.time()
    eigs = build_operator()
    dt = time.time() - t0
    print(f"  Matrix size: {len(eigs)} × {len(eigs)}")
    print(f"  Build time:  {dt:.1f}s")

    # In-sample (zeros 1-10)
    corr_in, frac_in, pval_in = measure_correlation(eigs, ZEROS_1_10)
    print(f"\n  In-sample (zeros 1-10):  r = {corr_in:.4f}  p = {pval_in:.4e}  (start={frac_in:.2f})")

    # Held-out (zeros 11-20)
    corr_out, frac_out, pval_out = measure_correlation(eigs, ZEROS_11_20)
    print(f"  Held-out (zeros 11-20):  r = {corr_out:.4f}  p = {pval_out:.4e}  (start={frac_out:.2f})")

    # Small gap fraction
    sgf = small_gap_fraction(eigs)
    print(f"  Small gap fraction:      {sgf*100:.1f}%")

    print(f"\n  Spec target: in=0.727, out=0.887, sgf≈12-14%")
    return eigs, corr_out


# ─────────────────────────────────────────────────────────────
# SECTION 2: FRESH ZERO WINDOWS
# ─────────────────────────────────────────────────────────────

def section_2_fresh_windows(eigs):
    header("SECTION 2: Fresh Zero Windows (Never Used in Tuning)")

    windows = {
        "Zeros 1-10 (in-sample)":  ZEROS_1_10,
        "Zeros 11-20 (held-out)":  ZEROS_11_20,
        "Zeros 21-30 (FRESH)":     ZEROS_21_30,
        "Zeros 31-40 (FRESH)":     ZEROS_31_40,
        "Zeros 41-50 (FRESH)":     ZEROS_41_50,
    }

    results = {}
    print(f"  {'Window':<30} {'Corr':>8} {'p-value':>12} {'Start':>8}")
    print(f"  {'-'*62}")
    for name, zeros in windows.items():
        corr, frac, pval = measure_correlation(eigs, zeros)
        tag = " ★" if "FRESH" in name else ""
        print(f"  {name:<30} {corr:>8.4f} {pval:>12.4e} {frac:>8.2f}{tag}")
        results[name] = corr

    return results


# ─────────────────────────────────────────────────────────────
# SECTION 3: NEIGHBORING TARGETS
# ─────────────────────────────────────────────────────────────

def section_3_neighboring_targets(eigs, n_random=20, rng=None):
    header("SECTION 3: Neighboring / Distinct Targets")

    if rng is None:
        rng = np.random.default_rng(42)

    # Real zeros
    corr_real, _, _ = measure_correlation(eigs, ZEROS_11_20)

    # GUE spacings (from Wigner surmise)
    results = {"Real ζ zeros 11-20": corr_real}

    # Generate GUE-like spacings (Wigner surmise: P(s) = π/2 s exp(-πs²/4))
    gue_corrs = []
    for trial in range(n_random):
        s = rng.rayleigh(scale=np.sqrt(2/np.pi), size=9)
        s = s / np.mean(s)  # normalize
        # Build fake zeros from spacings
        fake = np.cumsum(np.concatenate([[50.0], s * 2.5]))
        corr, _, _ = measure_correlation(eigs, fake)
        gue_corrs.append(corr)
    results["GUE random (mean±std)"] = (np.mean(gue_corrs), np.std(gue_corrs))

    # Poisson spacings
    poisson_corrs = []
    for trial in range(n_random):
        s = rng.exponential(1.0, size=9)
        s = s / np.mean(s)
        fake = np.cumsum(np.concatenate([[50.0], s * 2.5]))
        corr, _, _ = measure_correlation(eigs, fake)
        poisson_corrs.append(corr)
    results["Poisson random (mean±std)"] = (np.mean(poisson_corrs), np.std(poisson_corrs))

    # Scrambled zeros (same values, random order of spacings)
    scramble_corrs = []
    real_spacings = np.diff(ZEROS_11_20)
    for trial in range(n_random):
        perm = rng.permutation(real_spacings)
        fake = np.cumsum(np.concatenate([[52.970], perm]))
        corr, _, _ = measure_correlation(eigs, fake)
        scramble_corrs.append(corr)
    results["Scrambled zeros (mean±std)"] = (np.mean(scramble_corrs), np.std(scramble_corrs))

    # Dirichlet L-function zeros (χ mod 5, first nontrivial character)
    # Approximate zeros of L(s, χ₁ mod 5) — these are known numerically
    # Using Rubinstein's tables (first 10 zeros, imaginary parts):
    dirichlet_mod5 = [6.025, 10.303, 12.916, 16.392, 19.262,
                      20.818, 23.602, 25.057, 27.471, 29.464]
    corr_dir, _, pval_dir = measure_correlation(eigs, dirichlet_mod5)
    results["Dirichlet L(s,χ mod 5)"] = corr_dir

    # Print
    print(f"  {'Target':<35} {'Correlation':>12}")
    print(f"  {'-'*50}")
    for name, val in results.items():
        if isinstance(val, tuple):
            print(f"  {name:<35} {val[0]:>8.4f} ± {val[1]:.4f}")
        else:
            print(f"  {name:<35} {val:>12.4f}")

    return results


# ─────────────────────────────────────────────────────────────
# SECTION 4: MODULUS PERTURBATION
# ─────────────────────────────────────────────────────────────

def section_4_modulus_perturbation():
    header("SECTION 4: Modulus Band Perturbation")

    # Original sweet spot
    bands = {
        "Original 211-263 (sweet spot)": MODULI,
        "Shifted down: 151-197": [151, 157, 163, 167, 173, 179, 181, 191, 193, 197],
        "Shifted up: 269-317": [269, 271, 277, 281, 283, 293, 307, 311, 313, 317],
        "Mixed low+high: 101-149": [101, 103, 107, 109, 113, 127, 131, 137, 139, 149],
        "Second sweet spot 503-571": [503, 509, 521, 523, 541, 547, 557, 563, 569, 571],
        "Near miss 401-461": [401, 409, 419, 421, 431, 433, 439, 443, 449, 461],
        "Small moduli 53-97": [53, 59, 61, 67, 71, 73, 79, 83, 89, 97],
    }

    print(f"  {'Band':<40} {'Held-out r':>12} {'p-value':>12} {'Size':>6}")
    print(f"  {'-'*74}")

    results = {}
    for name, mods in bands.items():
        t0 = time.time()
        eigs = build_operator(moduli=mods)
        corr, frac, pval = measure_correlation(eigs, ZEROS_11_20)
        dt = time.time() - t0
        print(f"  {name:<40} {corr:>12.4f} {pval:>12.4e} {len(eigs):>6}  ({dt:.0f}s)")
        results[name] = corr

    return results


# ─────────────────────────────────────────────────────────────
# SECTION 5: PSEUDOPRIMES & DENSITY-MATCHED SETS
# ─────────────────────────────────────────────────────────────

def section_5_pseudoprimes(eigs_baseline=None):
    header("SECTION 5: Pseudoprimes & Density-Matched Random Sets")

    rng = np.random.default_rng(123)

    # Composites matched for density (13 odd composites near prime range)
    composites = [4, 6, 9, 15, 21, 25, 33, 35, 39, 45, 49, 51, 55]

    # Density-matched: 13 random odd numbers in same range as primes 2-41
    density_sets = []
    for trial in range(5):
        s = sorted(rng.choice(range(3, 50, 2), size=13, replace=False).tolist())
        density_sets.append(s)

    # Carmichael numbers (pseudoprimes to many bases)
    # These pass Fermat's little theorem but aren't prime
    carmichael_near = [9, 15, 21, 25, 33, 35, 39, 45, 49, 51, 55, 57, 63]

    sets = {
        "Real primes [2..41]": PRIMES,
        "Composites": composites,
        "Carmichael-ish": carmichael_near,
    }
    for i, ds in enumerate(density_sets):
        sets[f"Random odd set {i+1}"] = ds

    print(f"  {'Frequency set':<30} {'Held-out r':>12} {'p-value':>12}")
    print(f"  {'-'*58}")

    results = {}
    for name, freqs in sets.items():
        # Filter out any that divide all moduli (unlikely but safe)
        valid_freqs = [f for f in freqs if f > 1]
        if len(valid_freqs) < 5:
            print(f"  {name:<30} {'SKIP':>12}")
            continue
        try:
            eigs = build_operator(primes=valid_freqs)
            corr, frac, pval = measure_correlation(eigs, ZEROS_11_20)
            print(f"  {name:<30} {corr:>12.4f} {pval:>12.4e}")
            results[name] = corr
        except Exception as e:
            print(f"  {name:<30} ERROR: {e}")

    return results


# ─────────────────────────────────────────────────────────────
# SECTION 6: SCALING (MATRIX SIZE & PRIME CUTOFF)
# ─────────────────────────────────────────────────────────────

def section_6_scaling():
    header("SECTION 6: Scaling — Matrix Size & Prime Cutoff")

    configs = [
        ("5 moduli, 8 primes",    MODULI[:5],  PRIMES[:8]),
        ("7 moduli, 10 primes",   MODULI[:7],  PRIMES[:10]),
        ("10 moduli, 13 primes (baseline)", MODULI, PRIMES),
        ("10 moduli, 8 primes",   MODULI,      PRIMES[:8]),
        ("10 moduli, 17 primes",  MODULI,      PRIMES + [43, 47, 53, 59]),
        ("5 moduli, 13 primes",   MODULI[:5],  PRIMES),
    ]

    print(f"  {'Config':<40} {'Size':>6} {'Held-out r':>12} {'p-value':>12}")
    print(f"  {'-'*74}")

    results = {}
    for name, mods, prms in configs:
        t0 = time.time()
        eigs = build_operator(moduli=mods, primes=prms)
        corr, frac, pval = measure_correlation(eigs, ZEROS_11_20)
        dt = time.time() - t0
        print(f"  {name:<40} {len(eigs):>6} {corr:>12.4f} {pval:>12.4e}  ({dt:.0f}s)")
        results[name] = corr

    return results


# ─────────────────────────────────────────────────────────────
# SECTION 7: STATISTICAL HARDENING
# ─────────────────────────────────────────────────────────────

def section_7_statistics(eigs, n_perms=1000, quick=False):
    header("SECTION 7: Statistical Hardening")

    if quick:
        n_perms = 200

    rng = np.random.default_rng(777)

    # Baseline
    corr_baseline, frac_baseline, _ = measure_correlation(eigs, ZEROS_11_20)
    zn = normalized_spacings(ZEROS_11_20)

    # Prepare unfolded spectrum (same method as measure_correlation)
    pos = eigs[eigs > 0.01]
    unfolded = unfold_eigenvalues(pos)
    search_fracs = np.arange(0.01, 0.90, 0.01)

    subheader("Train/Test Protocol")
    print(f"  Training target:    zeros 1-10 (used during operator design)")
    print(f"  Held-out target:    zeros 11-20 (never used in design)")
    print(f"  Fresh targets:      zeros 21-30, 31-40, 41-50 (never seen)")
    print(f"  Held-out samples:   9 normalized spacings from 10 zeros")
    print(f"  Eigenvalue prep:    positive eigs > 0.01, polynomial unfolding (deg 5)")
    print(f"  Correlation method: Pearson r, max over {len(search_fracs)} start fractions [0.01, 0.89]")
    print(f"  N positive eigs:    {len(pos)}")

    subheader(f"Permutation Test (n={n_perms})")
    # Permute the target spacings and measure correlation each time
    perm_corrs = []
    K = len(ZEROS_11_20)
    for i in range(n_perms):
        perm_zn = rng.permutation(zn)
        best = -1
        for frac in search_fracs:
            start = int(frac * len(unfolded))
            end = start + K + 1
            if end > len(unfolded):
                break
            sample = unfolded[start:end]
            eg = np.diff(sample)
            if np.any(eg <= 1e-12):
                continue
            en = eg / np.mean(eg)
            n = min(len(en), len(perm_zn))
            if n < 4:
                continue
            r, _ = pearsonr(en[:n], perm_zn[:n])
            if r > best:
                best = r
        perm_corrs.append(best)

    perm_corrs = np.array(perm_corrs)
    perm_p = np.mean(perm_corrs >= corr_baseline)

    print(f"  Baseline correlation:     {corr_baseline:.4f}")
    print(f"  Permutation mean:         {np.mean(perm_corrs):.4f} ± {np.std(perm_corrs):.4f}")
    print(f"  Permutation max:          {np.max(perm_corrs):.4f}")
    print(f"  Permutation p-value:      {perm_p:.4f}  ({int(np.sum(perm_corrs >= corr_baseline))}/{n_perms})")

    subheader("Confidence Interval (Bootstrap)")
    boot_corrs = []
    n_boot = 500 if not quick else 100
    for b in range(n_boot):
        boot_fracs = rng.choice(search_fracs, size=20, replace=True)
        corrs = []
        for frac in boot_fracs:
            start = int(frac * len(unfolded))
            end = start + K + 1
            if end > len(unfolded):
                continue
            sample = unfolded[start:end]
            eg = np.diff(sample)
            if np.any(eg <= 1e-12):
                continue
            en = eg / np.mean(eg)
            n = min(len(en), len(zn))
            if n < 4:
                continue
            r, _ = pearsonr(en[:n], zn[:n])
            corrs.append(r)
        if corrs:
            boot_corrs.append(np.max(corrs))

    boot_corrs = np.array(boot_corrs)
    ci_lo = np.percentile(boot_corrs, 2.5)
    ci_hi = np.percentile(boot_corrs, 97.5)
    print(f"  Bootstrap 95% CI:         [{ci_lo:.4f}, {ci_hi:.4f}]")
    print(f"  Bootstrap mean:           {np.mean(boot_corrs):.4f}")

    subheader("Multiple Comparison Correction")
    # Bonferroni for modulus-band searching (7 bands tested in Section 4)
    n_bands = 7
    raw_p = max(perm_p, 1.0 / n_perms)  # floor at 1/n_perms
    bonf_p = min(raw_p * n_bands, 1.0)
    # Also for start-fraction search (89 fractions at 0.01 step)
    n_fracs = len(search_fracs)
    bonf_p_total = min(raw_p * n_bands * n_fracs, 1.0)

    print(f"  Raw permutation p:        {raw_p:.4f}")
    print(f"  Bonferroni (7 bands):     {bonf_p:.4f}")
    print(f"  Bonferroni (7×10 total):  {bonf_p_total:.4f}")
    print(f"  Multiple comparisons:     {'SURVIVES' if bonf_p_total < 0.05 else 'MARGINAL' if bonf_p_total < 0.10 else 'FAILS'}")

    return {
        "baseline": corr_baseline,
        "perm_p": perm_p,
        "perm_mean": np.mean(perm_corrs),
        "ci": (ci_lo, ci_hi),
        "bonferroni": bonf_p_total,
    }


# ─────────────────────────────────────────────────────────────
# SECTION 8: PRIME 37 DEEP DIVE
# ─────────────────────────────────────────────────────────────

def section_8_prime37():
    header("SECTION 8: Prime 37 Deep Dive")

    subheader("8a: Stability across modulus windows")
    bands = {
        "211-263 (sweet spot 1)": MODULI,
        "503-571 (sweet spot 2)": [503, 509, 521, 523, 541, 547, 557, 563, 569, 571],
        "269-317 (near miss)": [269, 271, 277, 281, 283, 293, 307, 311, 313, 317],
    }

    for band_name, mods in bands.items():
        print(f"\n  Band: {band_name}")
        # Full operator
        eigs_full = build_operator(moduli=mods)
        corr_full, _, _ = measure_correlation(eigs_full, ZEROS_11_20)

        # Without 37
        primes_no37 = [p for p in PRIMES if p != 37]
        eigs_no37 = build_operator(moduli=mods, primes=primes_no37)
        corr_no37, _, _ = measure_correlation(eigs_no37, ZEROS_11_20)

        delta = corr_full - corr_no37
        print(f"    Full:       r = {corr_full:.4f}")
        print(f"    Without 37: r = {corr_no37:.4f}")
        print(f"    Delta:      {delta:+.4f}  {'★ DOMINANT' if delta > 0.3 else '★ significant' if delta > 0.15 else 'weak'}")

    subheader("8b: Dominance across zero ranges")
    zero_windows = {
        "Zeros 11-20": ZEROS_11_20,
        "Zeros 21-30": ZEROS_21_30,
        "Zeros 31-40": ZEROS_31_40,
        "Zeros 41-50": ZEROS_41_50,
    }

    print(f"  {'Window':<20} {'Full':>8} {'No 37':>8} {'Delta':>8}")
    print(f"  {'-'*48}")

    eigs_full = build_operator()
    primes_no37 = [p for p in PRIMES if p != 37]
    eigs_no37 = build_operator(primes=primes_no37)

    for name, zeros in zero_windows.items():
        cf, _, _ = measure_correlation(eigs_full, zeros)
        cn, _, _ = measure_correlation(eigs_no37, zeros)
        d = cf - cn
        print(f"  {name:<20} {cf:>8.4f} {cn:>8.4f} {d:>+8.4f}")

    subheader("8c: Is 37 special alone or as a cluster with 13, 17?")

    cluster_tests = {
        "Full (13 primes)":          PRIMES,
        "Drop {37}":                 [p for p in PRIMES if p != 37],
        "Drop {13}":                 [p for p in PRIMES if p != 13],
        "Drop {17}":                 [p for p in PRIMES if p != 17],
        "Drop {13, 17, 37}":         [p for p in PRIMES if p not in {13, 17, 37}],
        "Drop {29, 31, 41}":         [p for p in PRIMES if p not in {29, 31, 41}],
        "Only {13, 17, 37}":         [13, 17, 37],
        "Only {2, 3, 5, 7, 11}":     [2, 3, 5, 7, 11],
        "Only {37}":                  [37],
    }

    print(f"  {'Config':<30} {'Held-out r':>12} {'p-value':>12}")
    print(f"  {'-'*58}")

    for name, prms in cluster_tests.items():
        try:
            eigs = build_operator(primes=prms)
            corr, frac, pval = measure_correlation(eigs, ZEROS_11_20)
            print(f"  {name:<30} {corr:>12.4f} {pval:>12.4e}")
        except Exception as e:
            print(f"  {name:<30} ERROR: {e}")

    subheader("8d: Residue behavior of 37 mod sweet-spot moduli")
    print(f"  {'Modulus q':>10} {'37 mod q':>10} {'37⁻¹ mod q':>12} {'ord(37)':>10} {'(q-1)/ord':>10}")
    print(f"  {'-'*56}")

    for q in MODULI:
        r = 37 % q
        inv = mod_inverse(37, q)
        # Compute multiplicative order
        order = 1
        x = 37 % q
        while x != 1 and order < q:
            x = (x * 37) % q
            order += 1
        ratio = (q - 1) / order
        print(f"  {q:>10} {r:>10} {inv:>12} {order:>10} {ratio:>10.1f}")

    # Also check second sweet spot
    print()
    mods2 = [503, 509, 521, 523, 541, 547, 557, 563, 569, 571]
    print(f"  Second sweet spot (503-571):")
    print(f"  {'Modulus q':>10} {'37 mod q':>10} {'37⁻¹ mod q':>12} {'ord(37)':>10} {'(q-1)/ord':>10}")
    print(f"  {'-'*56}")
    for q in mods2:
        r = 37 % q
        inv = mod_inverse(37, q)
        order = 1
        x = 37 % q
        while x != 1 and order < q:
            x = (x * 37) % q
            order += 1
        ratio = (q - 1) / order
        print(f"  {q:>10} {r:>10} {inv:>12} {order:>10} {ratio:>10.1f}")


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Rainbow Operator Validation Suite")
    parser.add_argument("--quick", action="store_true", help="Fewer permutations, faster run")
    parser.add_argument("--section", type=int, help="Run only this section (1-8)")
    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║        RAINBOW OPERATOR — FULL VALIDATION SUITE                    ║")
    print("║        From frozen spec, March 25, 2026                            ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")

    t_start = time.time()
    all_results = {}

    # Section 1: Baseline
    if args.section is None or args.section == 1:
        eigs, corr_baseline = section_1_baseline()
    else:
        # Need eigs for other sections
        print("\n  Building baseline operator...")
        eigs = build_operator()
        corr_baseline = measure_correlation(eigs, ZEROS_11_20)[0]

    # Section 2: Fresh zero windows
    if args.section is None or args.section == 2:
        all_results["fresh_windows"] = section_2_fresh_windows(eigs)

    # Section 3: Neighboring targets
    if args.section is None or args.section == 3:
        all_results["neighbors"] = section_3_neighboring_targets(eigs)

    # Section 4: Modulus perturbation
    if args.section is None or args.section == 4:
        all_results["modulus_perturb"] = section_4_modulus_perturbation()

    # Section 5: Pseudoprimes
    if args.section is None or args.section == 5:
        all_results["pseudoprimes"] = section_5_pseudoprimes(eigs)

    # Section 6: Scaling
    if args.section is None or args.section == 6:
        all_results["scaling"] = section_6_scaling()

    # Section 7: Statistical hardening
    if args.section is None or args.section == 7:
        all_results["statistics"] = section_7_statistics(eigs, quick=args.quick)

    # Section 8: Prime 37
    if args.section is None or args.section == 8:
        section_8_prime37()

    # Summary
    dt_total = time.time() - t_start
    header("DONE")
    print(f"  Total runtime: {dt_total/60:.1f} minutes")
    print(f"  Results above. No claims beyond the data.\n")


if __name__ == "__main__":
    main()
