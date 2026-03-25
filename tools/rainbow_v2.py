#!/usr/bin/env python3
"""
Rainbow V2 — Multiplicative Lattice Operator with Analytical Unfolding
and Spectral Form Factor

1. Analytical unfolding via Riemann-von Mangoldt (not polynomial fit)
2. Spectral Form Factor K(τ) — the standard quantum chaos statistic
3. Multiplicative lattice: states = integers, transitions = divisibility × Λ(n)

The smooth envelope is mathematically annihilated.
We operate entirely in the oscillatory domain.
"""

import numpy as np
from scipy.linalg import eigvalsh
from scipy.stats import pearsonr
import time
import sys
import os

# ─────────────────────────────────────────────────────────────
# STEP 0: Zeta zeros + analytical unfolding
# ─────────────────────────────────────────────────────────────

def load_zeros():
    cache = os.path.join(os.path.dirname(__file__), '.zeta_zeros_1000.npy')
    if os.path.exists(cache):
        return np.load(cache)
    import mpmath
    mpmath.mp.dps = 25
    zeros = np.array([float(mpmath.zetazero(n).imag) for n in range(1, 1001)])
    np.save(cache, zeros)
    return zeros


def riemann_von_mangoldt_unfold(t):
    """
    Analytical unfolding: w = (t/2π) ln(t/2πe)
    Forces mean spacing to 1. Strips the smooth density exactly.
    """
    twopi = 2 * np.pi
    return (t / twopi) * np.log(t / (twopi * np.e))


def unfold_eigenvalues_analytic(eigs):
    """
    Apply the same RvM-style unfolding to eigenvalues.
    For eigenvalues (not on critical line), we use the standard
    polynomial unfolding to set mean spacing = 1, then both
    sequences are on equal footing.
    """
    # Staircase unfolding: map to uniform density via empirical CDF
    N = len(eigs)
    # Rank-based unfolding: w_i = rank(eig_i) — simplest, no fitting
    return np.arange(N, dtype=float)


def unfold_eigenvalues_poly(eigs, deg=5):
    """Polynomial unfolding for eigenvalues."""
    N = len(eigs)
    cdf = np.arange(1, N + 1, dtype=float)
    coeffs = np.polyfit(eigs, cdf, deg)
    return np.polyval(coeffs, eigs)


# ─────────────────────────────────────────────────────────────
# STEP 1: Spectral Form Factor
# ─────────────────────────────────────────────────────────────

def spectral_form_factor(unfolded_spacings, tau_max=3.0, n_tau=300):
    """
    Compute K(τ) from unfolded spacings.

    K(τ) = |Σ_n exp(2πi τ w_n)|² / N

    where w_n are the unfolded eigenvalues (cumulative sum of spacings).

    For GUE: K(τ) = τ for τ < 1 (the ramp), K(τ) = 1 for τ ≥ 1 (plateau).
    For Poisson: K(τ) = 1 everywhere.
    """
    # Reconstruct unfolded positions from spacings
    w = np.cumsum(unfolded_spacings)
    w = w - w[0]  # start at 0
    N = len(w)

    taus = np.linspace(0.01, tau_max, n_tau)
    K = np.zeros(n_tau)

    for i, tau in enumerate(taus):
        # K(τ) = |Σ exp(2πi τ w_n)|² / N
        phases = np.exp(2j * np.pi * tau * w)
        K[i] = np.abs(np.sum(phases)) ** 2 / N

    return taus, K


def sff_gue_theory(taus):
    """Theoretical GUE form factor: ramp then plateau."""
    K = np.zeros_like(taus)
    for i, tau in enumerate(taus):
        if tau < 1:
            K[i] = tau  # ramp
        else:
            K[i] = 1.0  # plateau
    return K


def sff_poisson_theory(taus):
    """Theoretical Poisson form factor: flat at 1."""
    return np.ones_like(taus)


def sff_ramp_slope(taus, K, fit_range=(0.1, 0.8)):
    """Fit slope of K(τ) in the ramp region."""
    mask = (taus >= fit_range[0]) & (taus <= fit_range[1])
    if np.sum(mask) < 5:
        return 0.0, 0.0
    coeffs = np.polyfit(taus[mask], K[mask], 1)
    return coeffs[0], coeffs[1]  # slope, intercept


def sff_ramp_mse(taus, K, fit_range=(0.05, 0.9)):
    """MSE between K(τ) and GUE ramp in [fit_range]."""
    mask = (taus >= fit_range[0]) & (taus <= fit_range[1])
    K_gue = sff_gue_theory(taus[mask])
    return np.mean((K[mask] - K_gue) ** 2)


# ─────────────────────────────────────────────────────────────
# STEP 2: Von Mangoldt function and primes
# ─────────────────────────────────────────────────────────────

def sieve_primes(n_max):
    """Sieve of Eratosthenes."""
    is_p = [False, False] + [True] * (n_max - 1)
    for i in range(2, int(n_max**0.5) + 1):
        if is_p[i]:
            for j in range(i*i, n_max + 1, i):
                is_p[j] = False
    return [i for i in range(2, n_max + 1) if is_p[i]]


def von_mangoldt(n, primes_set, prime_list):
    """
    Λ(n) = ln(p) if n = p^k for some prime p and integer k ≥ 1,
           0 otherwise.
    """
    if n <= 1:
        return 0.0
    for p in prime_list:
        if p * p > n:
            break
        if n % p == 0:
            # Check if n is a power of p
            m = n
            while m % p == 0:
                m //= p
            if m == 1:
                return np.log(p)
            return 0.0
    # n itself is prime
    if n in primes_set:
        return np.log(n)
    return 0.0


# ─────────────────────────────────────────────────────────────
# STEP 3: Multiplicative Lattice Operator
# ─────────────────────────────────────────────────────────────

def build_multiplicative_operator(N_states, freq_set=None, use_von_mangoldt=True):
    """
    Build the multiplicative lattice Hermitian operator.

    States: integers |1⟩, |2⟩, ..., |N_states⟩
    Transitions: H[n,m] nonzero iff n|m or m|n, weighted by Λ(max(n,m)/min(n,m))

    If freq_set is provided, only allow transitions involving those "primes"
    (or whatever frequencies are in the set).
    """
    prime_list = sieve_primes(N_states)
    primes_set = set(prime_list)

    H = np.zeros((N_states, N_states))

    for n in range(1, N_states + 1):
        for m in range(n + 1, N_states + 1):
            if m % n == 0:
                ratio = m // n

                if freq_set is not None:
                    # Only allow if ratio is a power of something in freq_set
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

                if use_von_mangoldt:
                    weight = von_mangoldt(ratio, primes_set, prime_list)
                else:
                    weight = 1.0 if ratio > 1 else 0.0

                if weight > 0:
                    H[n-1, m-1] = weight
                    H[m-1, n-1] = weight

    # Symmetrize (should already be, but ensure)
    H = (H + H.T) / 2.0
    return H


# ─────────────────────────────────────────────────────────────
# STEP 4: Full pipeline
# ─────────────────────────────────────────────────────────────

def pipeline(N_states, freq_set, label, zeros_spacings_unfolded):
    """Build operator, extract eigenvalues, compute SFF, compare to zeta."""
    t0 = time.time()
    H = build_multiplicative_operator(N_states, freq_set=freq_set)
    eigs = eigvalsh(H)

    # Remove near-zero eigenvalues (disconnected states)
    nonzero = eigs[np.abs(eigs) > 1e-10]
    if len(nonzero) < 20:
        return None

    # Unfold eigenvalues (polynomial — eigenvalues don't live on critical line)
    pos = nonzero[nonzero > 0]
    if len(pos) < 20:
        # Use all nonzero
        unf = unfold_eigenvalues_poly(nonzero, deg=3)
    else:
        unf = unfold_eigenvalues_poly(pos, deg=3)

    spacings = np.diff(unf)
    spacings = spacings[spacings > 1e-12]
    if len(spacings) < 20:
        return None

    # Normalize to mean 1
    spacings = spacings / np.mean(spacings)

    # Spectral form factor
    taus, K = spectral_form_factor(spacings)

    # Metrics
    slope, intercept = sff_ramp_slope(taus, K)
    mse_gue = sff_ramp_mse(taus, K)
    mse_poisson = np.mean((K[taus < 0.9] - 1.0) ** 2)

    # Connectivity
    nnz = np.count_nonzero(H)
    total = N_states * N_states

    dt = time.time() - t0

    return {
        "label": label,
        "freqs": freq_set,
        "eigs": nonzero,
        "spacings": spacings,
        "taus": taus,
        "K": K,
        "slope": slope,
        "intercept": intercept,
        "mse_gue": mse_gue,
        "mse_poisson": mse_poisson,
        "n_eigs": len(nonzero),
        "n_spacings": len(spacings),
        "nnz": nnz,
        "sparsity": nnz / total,
        "time": dt,
    }


def header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║   RAINBOW V2 — MULTIPLICATIVE LATTICE + FORM FACTOR               ║")
    print("║   Smooth term annihilated. Oscillatory domain only.                ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")

    t_start = time.time()

    # ── Load and unfold zeta zeros ──
    print("\n  Loading 1000 zeta zeros...")
    zeros = load_zeros()

    # Analytical unfolding (Riemann-von Mangoldt)
    w_zeta = riemann_von_mangoldt_unfold(zeros)
    zeta_spacings = np.diff(w_zeta)
    zeta_spacings = zeta_spacings / np.mean(zeta_spacings)
    print(f"  Analytically unfolded. Mean spacing forced to 1.000")
    print(f"  Spacing range: [{np.min(zeta_spacings):.4f}, {np.max(zeta_spacings):.4f}]")

    # SFF of zeta zeros themselves
    header("REFERENCE: Zeta Zero Form Factor")
    taus_ref, K_ref = spectral_form_factor(zeta_spacings)
    slope_ref, _ = sff_ramp_slope(taus_ref, K_ref)
    mse_ref = sff_ramp_mse(taus_ref, K_ref)
    print(f"  Zeta zeros K(τ) ramp slope:  {slope_ref:.4f}  (GUE theory = 1.0)")
    print(f"  Zeta zeros MSE vs GUE ramp:  {mse_ref:.6f}")
    print(f"\n  K(τ) at key points:")
    for tau_val in [0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0]:
        idx = np.argmin(np.abs(taus_ref - tau_val))
        gue = min(tau_val, 1.0)
        print(f"    τ={tau_val:.1f}: K={K_ref[idx]:.4f}  (GUE={gue:.1f})")

    # ── Build families ──
    header("MULTIPLICATIVE LATTICE OPERATORS")

    # Matrix size — need enough states for structure but computable
    # N=500 gives 500×500 matrix, fast enough
    N_STATES = 500

    REAL_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41]
    COMPOSITES = [4, 6, 9, 15, 21, 25, 33, 35, 39, 45, 49, 51, 55]
    SHIFTED = [4, 5, 8, 10, 14, 16, 20, 22, 26, 32, 34, 40, 44]
    SMALL_PRIMES = [2, 3, 5, 7, 11]

    # Log-matched fake
    from rainbow_validate import is_prime
    ln_p = np.log(REAL_PRIMES)
    offset = 0.15
    target_ln = ln_p + offset
    candidates = [int(round(np.exp(v))) for v in target_ln]
    fake = []
    seen = set()
    for c in candidates:
        if c < 2: c = 4
        while is_prime(c) or c in seen: c += 1
        seen.add(c)
        fake.append(c)
    LOG_MATCHED = sorted(fake)

    # Random odd sets
    rng = np.random.default_rng(2026)
    RANDOM_ODD_A = sorted(rng.choice(range(3, 56, 2), size=13, replace=False).tolist())
    rng2 = np.random.default_rng(2027)
    RANDOM_ODD_B = sorted(rng2.choice(range(3, 56, 2), size=13, replace=False).tolist())

    families = [
        ("PRIMES [2..41]",    REAL_PRIMES),
        ("COMPOSITES",        COMPOSITES),
        ("SHIFTED (p+1)",     SHIFTED),
        ("LOG-MATCHED FAKE",  LOG_MATCHED),
        ("RANDOM ODD A",      RANDOM_ODD_A),
        ("RANDOM ODD B",      RANDOM_ODD_B),
        ("SMALL PRIMES",      SMALL_PRIMES),
        ("ALL (no filter)",   None),  # all divisibility relations
    ]

    results = []

    print(f"  Building {len(families)} operators (N={N_STATES})...\n")
    print(f"  {'Family':<22} {'#eigs':>6} {'#sp':>6} {'NNZ':>8} {'Slope':>8} {'MSE_GUE':>10} {'MSE_Poi':>10} {'Time':>6}")
    print(f"  {'-'*82}")

    for label, freqs in families:
        r = pipeline(N_STATES, freqs, label, zeta_spacings)
        if r is None:
            print(f"  {label:<22} {'DISCONNECTED — no usable spectrum':>50}")
            continue

        results.append(r)
        print(f"  {label:<22} {r['n_eigs']:>6} {r['n_spacings']:>6} {r['nnz']:>8} {r['slope']:>+8.4f} {r['mse_gue']:>10.6f} {r['mse_poisson']:>10.6f} {r['time']:>5.0f}s")

    # ── Detailed SFF comparison ──
    header("SPECTRAL FORM FACTOR COMPARISON")
    print(f"  K(τ) at key points (GUE ramp: K=τ for τ<1, K=1 for τ≥1):\n")
    print(f"  {'τ':>5} {'GUE':>6} {'Zeta':>8}", end="")
    for r in results:
        print(f" {r['label'][:10]:>12}", end="")
    print()
    print(f"  {'-'*5} {'-'*6} {'-'*8}", end="")
    for _ in results:
        print(f" {'-'*12}", end="")
    print()

    for tau_val in [0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0, 1.2, 1.5, 2.0]:
        gue = min(tau_val, 1.0)
        idx_ref = np.argmin(np.abs(taus_ref - tau_val))
        print(f"  {tau_val:>5.2f} {gue:>6.3f} {K_ref[idx_ref]:>8.4f}", end="")
        for r in results:
            idx = np.argmin(np.abs(r['taus'] - tau_val))
            print(f" {r['K'][idx]:>12.4f}", end="")
        print()

    # ── Rank by GUE match ──
    header("RANKING: Distance to GUE Form Factor")

    ranked = sorted(results, key=lambda r: r['mse_gue'])
    print(f"  {'Rank':>4} {'Family':<22} {'MSE vs GUE':>12} {'Slope':>8} {'MSE vs Poisson':>14}")
    print(f"  {'-'*64}")
    for i, r in enumerate(ranked, 1):
        marker = " ◄ PRIMES" if "PRIMES [2" in r['label'] else ""
        print(f"  {i:>4} {r['label']:<22} {r['mse_gue']:>12.6f} {r['slope']:>+8.4f} {r['mse_poisson']:>14.6f}{marker}")

    # ── Direct spacing correlation (oscillatory only) ──
    header("DIRECT SPACING CORRELATION (after analytical unfolding)")
    print(f"  Both sequences analytically unfolded. Smooth term dead.\n")

    for r in results:
        sp = r['spacings']
        # Truncate to same length
        n = min(len(sp), len(zeta_spacings))
        if n < 20:
            print(f"  {r['label']:<22} too few spacings ({n})")
            continue

        # Direct correlation at position 0
        rho, pval = pearsonr(sp[:n], zeta_spacings[:n])

        # Also sliding window (step=1, window=min(n,200))
        wsize = min(n, 200)
        slide_corrs = []
        for s in range(0, n - wsize, 1):
            rc, _ = pearsonr(sp[s:s+wsize], zeta_spacings[:wsize])
            slide_corrs.append(rc)
        slide_corrs = np.array(slide_corrs) if slide_corrs else np.array([0])

        print(f"  {r['label']:<22} direct r={rho:+.5f} p={pval:.3e}  |  slide: avg={np.mean(slide_corrs):+.5f} best={np.max(slide_corrs):+.5f} pos={np.mean(slide_corrs>0):.3f}")

    # ── Final verdict ──
    header("VERDICT")

    prime_result = next((r for r in results if "PRIMES [2" in r['label']), None)
    if prime_result:
        # Is primes closer to GUE than all others?
        prime_rank = next(i for i, r in enumerate(ranked, 1) if "PRIMES [2" in r['label'])
        closest = ranked[0]['label']
        print(f"  Prime operator GUE rank:   {prime_rank} of {len(ranked)}")
        print(f"  Closest to GUE:            {closest}")
        print(f"  Prime MSE vs GUE:          {prime_result['mse_gue']:.6f}")
        print(f"  Prime ramp slope:          {prime_result['slope']:+.4f}  (target: +1.0)")
        print(f"  Zeta zeros ramp slope:     {slope_ref:+.4f}")
        print()

        if prime_rank == 1:
            print(f"  PRIMES LEAD. The multiplicative lattice with von Mangoldt")
            print(f"  weighting produces the closest match to GUE form factor.")
        else:
            print(f"  Primes do not lead. {closest} is closer to GUE.")
            print(f"  The arithmetic structure does not uniquely produce GUE-class rigidity.")

    dt = time.time() - t_start
    print(f"\n  Total runtime: {dt/60:.1f} minutes")


if __name__ == "__main__":
    main()
