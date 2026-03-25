#!/usr/bin/env python3
"""
Rainbow Operator — 1000-Zero Preregistered Experiment
FROZEN PROTOCOL: see .gump/preregistration_1000zero.md

Run: python3 rainbow_1000zero.py
Results written to: .gump/research_1000zero_results.md
"""

import numpy as np
from scipy.linalg import eigvalsh
from scipy.stats import pearsonr, ks_2samp
import time
import sys
import os

# Import operator builder from validation suite
sys.path.insert(0, os.path.dirname(__file__))
from rainbow_validate import build_operator, unfold_eigenvalues, MODULI, PRIMES

# ─────────────────────────────────────────────────────────────
# STEP 0: Generate 1000 zeta zeros (LOCKED)
# ─────────────────────────────────────────────────────────────

def get_1000_zeros():
    """Compute first 1000 nontrivial zeta zeros via mpmath."""
    cache_path = os.path.join(os.path.dirname(__file__), '.zeta_zeros_1000.npy')
    if os.path.exists(cache_path):
        zeros = np.load(cache_path)
        if len(zeros) == 1000:
            print(f"  Loaded 1000 zeros from cache.")
            return zeros

    print(f"  Computing 1000 zeta zeros via mpmath (one-time, ~2-5 min)...")
    import mpmath
    mpmath.mp.dps = 25
    zeros = np.array([float(mpmath.zetazero(n).imag) for n in range(1, 1001)])
    np.save(cache_path, zeros)
    print(f"  Saved to cache. Range: [{zeros[0]:.6f}, {zeros[-1]:.6f}]")
    return zeros


# ─────────────────────────────────────────────────────────────
# STEP 1: Build operator and unfold (LOCKED)
# ─────────────────────────────────────────────────────────────

def build_and_unfold(primes_acting, label=""):
    """Build operator with given primes, return unfolded positive eigenvalues."""
    eigs = build_operator(primes=primes_acting)
    pos = eigs[eigs > 0.01]
    unfolded = unfold_eigenvalues(pos, poly_deg=5)
    return unfolded


# ─────────────────────────────────────────────────────────────
# STEP 2: Scoring functions (LOCKED)
# ─────────────────────────────────────────────────────────────

def primary_score(unfolded, zn):
    """
    Mean correlation over non-overlapping windows of length 1000.
    Eliminates shift-search freedom entirely.
    """
    window = len(zn) + 1  # 1000 eigenvalues -> 999 spacings
    N = len(unfolded)
    n_windows = N // window
    if n_windows == 0:
        return float('nan'), 0

    corrs = []
    for i in range(n_windows):
        start = i * window
        sample = unfolded[start:start + window]
        eg = np.diff(sample)
        if np.any(eg <= 1e-12):
            continue
        en = eg / np.mean(eg)
        n = min(len(en), len(zn))
        if n < 10:
            continue
        r, _ = pearsonr(en[:n], zn[:n])
        corrs.append(r)

    if not corrs:
        return float('nan'), 0
    return float(np.mean(corrs)), len(corrs)


def secondary_score(unfolded, zn):
    """
    Best single-window correlation (exploratory only, NOT for significance).
    Slide in steps of 100.
    """
    window = len(zn) + 1
    N = len(unfolded)
    best = -1.0
    best_start = 0

    for start in range(0, N - window, 100):
        sample = unfolded[start:start + window]
        eg = np.diff(sample)
        if np.any(eg <= 1e-12):
            continue
        en = eg / np.mean(eg)
        n = min(len(en), len(zn))
        if n < 10:
            continue
        r, _ = pearsonr(en[:n], zn[:n])
        if r > best:
            best = r
            best_start = start

    return float(best), best_start


def tertiary_score(unfolded, zn):
    """
    KS test: compare distribution of unfolded spacings (bulk 50%)
    against distribution of normalized zeta zero spacings.
    """
    N = len(unfolded)
    bulk = unfolded[N // 4: 3 * N // 4]
    gaps = np.diff(bulk)
    gaps = gaps[gaps > 1e-12]
    en = gaps / np.mean(gaps)
    stat, pval = ks_2samp(en, zn)
    return float(stat), float(pval)


# ─────────────────────────────────────────────────────────────
# STEP 3: Null families (LOCKED seeds)
# ─────────────────────────────────────────────────────────────

def get_null_families():
    """Return all null families as specified in preregistration."""
    families = {}

    # N1: Real primes (baseline)
    families["N1: Real primes"] = PRIMES

    # N2: Composites
    families["N2: Composites"] = [4, 6, 9, 15, 21, 25, 33, 35, 39, 45, 49, 51, 55]

    # N3-N7: Random odd sets with fixed seeds
    for i, seed in enumerate([2026, 2027, 2028, 2029, 2030]):
        rng = np.random.default_rng(seed)
        odds = list(range(3, 56, 2))
        chosen = sorted(rng.choice(odds, size=13, replace=False).tolist())
        families[f"N{i+3}: Random odd (seed={seed})"] = chosen

    # N8: Shifted primes (prime + 1, breaks primality)
    families["N8: Shifted primes (p+1)"] = [p + 2 for p in PRIMES]  # +2 to stay odd-ish
    # Actually per prereg: [4,5,8,10,14,16,20,22,26,32,34,40,44]
    families["N8: Shifted primes (p+1)"] = [4, 5, 8, 10, 14, 16, 20, 22, 26, 32, 34, 40, 44]

    # N9: Log-matched (same ln-spacing, non-prime)
    # ln(primes) spacing replicated with non-prime values
    ln_primes = np.log(PRIMES)
    ln_gaps = np.diff(ln_primes)
    start = np.log(6)  # start from composite 6
    ln_vals = [start]
    for g in ln_gaps:
        ln_vals.append(ln_vals[-1] + g)
    log_matched = [int(round(np.exp(v))) for v in ln_vals]
    # Ensure no primes sneak in
    from rainbow_validate import is_prime
    log_matched = [x if not is_prime(x) else x + 1 for x in log_matched]
    families["N9: Log-matched non-prime"] = log_matched

    # N10: Small primes only
    families["N10: Small primes [2..11]"] = [2, 3, 5, 7, 11]

    # N11: Large primes only
    families["N11: Large primes [23..47]"] = [23, 29, 31, 37, 41, 43, 47]

    return families


# ─────────────────────────────────────────────────────────────
# STEP 4: Significance tests (LOCKED)
# ─────────────────────────────────────────────────────────────

def permutation_test(unfolded, zn, n_perms=1000):
    """Test A: permutation test on primary score."""
    rng = np.random.default_rng(42)
    real_score, n_win = primary_score(unfolded, zn)

    perm_scores = []
    for i in range(n_perms):
        perm_zn = rng.permutation(zn)
        ps, _ = primary_score(unfolded, perm_zn)
        if not np.isnan(ps):
            perm_scores.append(ps)

    perm_scores = np.array(perm_scores)
    p_val = np.mean(perm_scores >= real_score)

    return real_score, p_val, perm_scores


def bootstrap_ci(unfolded, zn, n_boot=500):
    """Test C: bootstrap CI on primary score."""
    rng = np.random.default_rng(99)
    window = len(zn) + 1
    N = len(unfolded)
    n_windows = N // window

    # Get per-window correlations
    window_corrs = []
    for i in range(n_windows):
        start = i * window
        sample = unfolded[start:start + window]
        eg = np.diff(sample)
        if np.any(eg <= 1e-12):
            continue
        en = eg / np.mean(eg)
        n = min(len(en), len(zn))
        if n < 10:
            continue
        r, _ = pearsonr(en[:n], zn[:n])
        window_corrs.append(r)

    window_corrs = np.array(window_corrs)
    if len(window_corrs) < 2:
        return float('nan'), float('nan'), window_corrs

    boot_means = []
    for b in range(n_boot):
        sample = rng.choice(window_corrs, size=len(window_corrs), replace=True)
        boot_means.append(np.mean(sample))

    boot_means = np.array(boot_means)
    ci_lo = np.percentile(boot_means, 2.5)
    ci_hi = np.percentile(boot_means, 97.5)
    return ci_lo, ci_hi, window_corrs


# ─────────────────────────────────────────────────────────────
# STEP 5: Surrogate spectra (LOCKED)
# ─────────────────────────────────────────────────────────────

def surrogate_scores(unfolded, zn):
    """S1-S3: GUE, shuffled, Poisson surrogates."""
    rng = np.random.default_rng(314)
    results = {}

    # S1: GUE surrogates (Wigner surmise spacings)
    gue_scores = []
    for trial in range(100):
        s = rng.rayleigh(scale=np.sqrt(2 / np.pi), size=999)
        s = s / np.mean(s)
        ps, _ = primary_score(unfolded, s)
        if not np.isnan(ps):
            gue_scores.append(ps)
    results["S1: GUE"] = np.array(gue_scores)

    # S2: Shuffled spacings
    shuf_scores = []
    for trial in range(1000):
        perm = rng.permutation(zn)
        ps, _ = primary_score(unfolded, perm)
        if not np.isnan(ps):
            shuf_scores.append(ps)
    results["S2: Shuffled"] = np.array(shuf_scores)

    # S3: Poisson surrogates
    poi_scores = []
    for trial in range(100):
        s = rng.exponential(1.0, size=999)
        s = s / np.mean(s)
        ps, _ = primary_score(unfolded, s)
        if not np.isnan(ps):
            poi_scores.append(ps)
    results["S3: Poisson"] = np.array(poi_scores)

    return results


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║   PREREGISTERED EXPERIMENT: 1000-Zero Validation                   ║")
    print("║   Protocol: .gump/preregistration_1000zero.md                      ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")

    t_start = time.time()
    output_lines = []

    def log(s=""):
        print(s)
        output_lines.append(s)

    # ── Get zeros ──
    log("\n  STEP 0: Load 1000 zeta zeros")
    zeros = get_1000_zeros()
    zn = np.diff(zeros) / np.mean(np.diff(zeros))
    log(f"  Zeros: {len(zeros)}, Spacings: {len(zn)}")
    log(f"  Mean spacing: {np.mean(np.diff(zeros)):.6f}")
    log(f"  Spacing range: [{np.min(zn):.4f}, {np.max(zn):.4f}]")

    # ── Build and score all null families ──
    log(f"\n{'='*70}")
    log(f"  STEP 1: Score All Null Families")
    log(f"{'='*70}")

    families = get_null_families()
    family_results = {}

    log(f"\n  {'Family':<35} {'Freqs':<20} {'Primary':>10} {'#Win':>5} {'Secondary':>10} {'KS':>8} {'KS-p':>10}")
    log(f"  {'-'*102}")

    for name, freqs in families.items():
        t0 = time.time()
        valid = [f for f in freqs if f > 1]
        if len(valid) < 3:
            log(f"  {name:<35} SKIP (too few valid freqs)")
            continue

        try:
            unfolded = build_and_unfold(valid, name)
            ps, nw = primary_score(unfolded, zn)
            ss, ss_start = secondary_score(unfolded, zn)
            ks_stat, ks_pval = tertiary_score(unfolded, zn)
            dt = time.time() - t0

            freq_str = str(valid[:5]) + ("..." if len(valid) > 5 else "")
            log(f"  {name:<35} {freq_str:<20} {ps:>10.6f} {nw:>5} {ss:>10.4f} {ks_stat:>8.4f} {ks_pval:>10.4e}  ({dt:.0f}s)")

            family_results[name] = {
                "primary": ps, "n_windows": nw, "secondary": ss,
                "ks_stat": ks_stat, "ks_pval": ks_pval,
                "unfolded": unfolded, "freqs": valid
            }
        except Exception as e:
            log(f"  {name:<35} ERROR: {e}")

    # ── Significance tests (on N1 only) ──
    log(f"\n{'='*70}")
    log(f"  STEP 2: Significance Tests (N1: Real Primes)")
    log(f"{'='*70}")

    n1 = family_results.get("N1: Real primes")
    if n1 is None:
        log("  ERROR: N1 not computed!")
        return

    unfolded_n1 = n1["unfolded"]

    # Test A: Permutation
    log(f"\n  ── Test A: Permutation Test (n=1000) ──")
    real_ps, perm_p, perm_scores = permutation_test(unfolded_n1, zn, n_perms=1000)
    log(f"  N1 primary score:       {real_ps:.6f}")
    log(f"  Permutation mean:       {np.mean(perm_scores):.6f} ± {np.std(perm_scores):.6f}")
    log(f"  Permutation max:        {np.max(perm_scores):.6f}")
    log(f"  Permutation p-value:    {perm_p:.4f}  ({int(np.sum(perm_scores >= real_ps))}/{len(perm_scores)})")

    # Test B: Rank among families
    log(f"\n  ── Test B: Rank Among Null Families ──")
    all_primaries = [(name, r["primary"]) for name, r in family_results.items()]
    all_primaries.sort(key=lambda x: -x[1])
    for rank, (name, ps) in enumerate(all_primaries, 1):
        marker = " ◄" if "Real primes" in name else ""
        log(f"  {rank:>3}. {name:<35} {ps:>10.6f}{marker}")

    n1_rank = next(i for i, (name, _) in enumerate(all_primaries, 1) if "Real primes" in name)
    log(f"\n  N1 rank: {n1_rank} of {len(all_primaries)}")

    # Test C: Bootstrap CI
    log(f"\n  ── Test C: Bootstrap 95% CI ──")
    ci_lo, ci_hi, window_corrs = bootstrap_ci(unfolded_n1, zn)
    log(f"  Per-window correlations: {window_corrs}")
    log(f"  Bootstrap 95% CI:       [{ci_lo:.6f}, {ci_hi:.6f}]")

    # Test D: Bonferroni
    log(f"\n  ── Test D: Bonferroni Correction ──")
    n_families = len(family_results)
    bonf_p = min(perm_p * n_families, 1.0) if perm_p > 0 else n_families / 1000
    log(f"  Raw p:                  {perm_p:.4f}")
    log(f"  Bonferroni (×{n_families}):       {bonf_p:.4f}")
    log(f"  Significant at 0.05?    {'YES' if bonf_p < 0.05 else 'NO'}")

    # Test E: KS comparison
    log(f"\n  ── Test E: KS Test Comparison ──")
    log(f"  {'Family':<35} {'KS stat':>10} {'p-value':>12}")
    log(f"  {'-'*60}")
    ks_results = [(name, r["ks_stat"], r["ks_pval"]) for name, r in family_results.items()]
    ks_results.sort(key=lambda x: x[1])
    for name, ks, ksp in ks_results:
        marker = " ◄" if "Real primes" in name else ""
        log(f"  {name:<35} {ks:>10.4f} {ksp:>12.4e}{marker}")

    # ── Surrogate spectra ──
    log(f"\n{'='*70}")
    log(f"  STEP 3: Surrogate Spectra")
    log(f"{'='*70}")

    surr = surrogate_scores(unfolded_n1, zn)
    for name, scores in surr.items():
        log(f"\n  {name}:")
        log(f"    Mean:  {np.mean(scores):.6f} ± {np.std(scores):.6f}")
        log(f"    Range: [{np.min(scores):.6f}, {np.max(scores):.6f}]")
        exceed = np.mean(scores >= real_ps)
        log(f"    Fraction >= N1 score: {exceed:.4f}")

    # ── Decision ──
    log(f"\n{'='*70}")
    log(f"  DECISION (per preregistered criteria)")
    log(f"{'='*70}")

    null_primaries = [r["primary"] for name, r in family_results.items() if "Real primes" not in name]
    null_mean = np.mean(null_primaries) if null_primaries else 0

    s1_scores = surr.get("S1: GUE", np.array([0]))
    s1_mean = np.mean(s1_scores)
    s1_std = np.std(s1_scores)

    c1 = n1_rank == 1
    c2 = perm_p < 0.01
    c3 = bonf_p < 0.05
    c4 = ci_lo > null_mean if not np.isnan(ci_lo) else False
    c5 = real_ps > s1_mean + 2 * s1_std

    criteria = [c1, c2, c3, c4, c5]
    n_pass = sum(criteria)

    log(f"\n  Criterion 1 (N1 ranks #1 among families):        {'PASS' if c1 else 'FAIL'}  (rank={n1_rank})")
    log(f"  Criterion 2 (permutation p < 0.01):               {'PASS' if c2 else 'FAIL'}  (p={perm_p:.4f})")
    log(f"  Criterion 3 (Bonferroni p < 0.05):                {'PASS' if c3 else 'FAIL'}  (p={bonf_p:.4f})")
    log(f"  Criterion 4 (CI lower > null mean):               {'PASS' if c4 else 'FAIL'}  (CI_lo={ci_lo:.4f}, null_mean={null_mean:.4f})")
    log(f"  Criterion 5 (N1 > GUE mean + 2σ):                {'PASS' if c5 else 'FAIL'}  ({real_ps:.4f} vs {s1_mean + 2*s1_std:.4f})")

    log(f"\n  Criteria passed: {n_pass}/5")
    if n_pass == 5:
        log(f"  VERDICT: SUCCESS — Zeta-specificity demonstrated.")
    elif n_pass >= 3:
        log(f"  VERDICT: PARTIAL — Suggestive but not conclusive.")
    else:
        log(f"  VERDICT: FAILURE — No demonstrated zeta-specificity.")
        log(f"           Operator produces GUE-class statistics via universality.")
        log(f"           Still a valid toy Hecke construction.")

    # ── Save results ──
    dt_total = time.time() - t_start
    log(f"\n  Total runtime: {dt_total/60:.1f} minutes")

    results_path = os.path.join(os.path.dirname(__file__), '..', '.gump', 'research_1000zero_results.md')
    with open(results_path, 'w') as f:
        f.write("# 1000-Zero Experiment Results\n")
        f.write(f"# Generated {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Protocol: preregistration_1000zero.md\n\n")
        f.write("```\n")
        f.write("\n".join(output_lines))
        f.write("\n```\n")

    log(f"\n  Results saved to .gump/research_1000zero_results.md")
    log(f"  Protocol: .gump/preregistration_1000zero.md")


if __name__ == "__main__":
    main()
