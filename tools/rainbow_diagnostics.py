#!/usr/bin/env python3
"""
Rainbow Operator — Five Diagnostics
1. Shift variants (shift=0, avg over all shifts, best shift)
2. Full cross-correlation curves for all families
3. Order permutation test (preserve spacing values, shuffle sequence)
4. Cross-spectrum (spectral coherence)
5. Matched fake family (same cardinality, range, log-spacing as primes)
"""

import numpy as np
from scipy.linalg import eigvalsh
from scipy.stats import pearsonr
import time
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from rainbow_validate import build_operator, unfold_eigenvalues, MODULI, PRIMES

# ─────────────────────────────────────────────────────────────
# Load zeros
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

def build_unfolded(primes_acting):
    eigs = build_operator(primes=primes_acting)
    pos = eigs[eigs > 0.01]
    return unfold_eigenvalues(pos, poly_deg=5)

def header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

# ─────────────────────────────────────────────────────────────
# DIAGNOSTIC 1: Shift variants
# ─────────────────────────────────────────────────────────────

def diagnostic_1(unfolded, zn):
    header("DIAGNOSTIC 1: Shift Variants")

    N = len(unfolded)
    W = len(zn)  # 999

    # Shift 0 (first window)
    sample = unfolded[:W + 1]
    eg = np.diff(sample)
    en = eg / np.mean(eg)
    r0, p0 = pearsonr(en[:W], zn[:W])
    print(f"  Shift 0 (start of spectrum):    r = {r0:.6f}  p = {p0:.4e}")

    # All valid shifts, step=1
    all_corrs = []
    for start in range(0, N - W, 1):
        sample = unfolded[start:start + W + 1]
        eg = np.diff(sample)
        if np.any(eg <= 1e-12):
            all_corrs.append(np.nan)
            continue
        en = eg / np.mean(eg)
        r, _ = pearsonr(en[:W], zn[:W])
        all_corrs.append(r)

    all_corrs = np.array(all_corrs)
    valid = all_corrs[~np.isnan(all_corrs)]

    r_avg = np.mean(valid)
    r_best = np.max(valid)
    r_worst = np.min(valid)
    best_idx = np.nanargmax(all_corrs)

    print(f"  Average over all {len(valid)} shifts: r = {r_avg:.6f}")
    print(f"  Best shift (idx={best_idx}):        r = {r_best:.6f}")
    print(f"  Worst shift:                    r = {r_worst:.6f}")
    print(f"  Std across shifts:              σ = {np.std(valid):.6f}")
    print(f"  Fraction positive:              {np.mean(valid > 0):.4f}")

    # Histogram of shift correlations
    bins = np.linspace(-0.15, 0.20, 36)
    hist, edges = np.histogram(valid, bins=bins)
    print(f"\n  Distribution of r across all shifts:")
    max_h = max(hist)
    for i in range(len(hist)):
        bar = '█' * int(40 * hist[i] / max_h) if max_h > 0 else ''
        lo = edges[i]
        hi = edges[i + 1]
        print(f"    [{lo:+.3f},{hi:+.3f}) {hist[i]:>4} {bar}")

    return all_corrs, r_avg, r_best


# ─────────────────────────────────────────────────────────────
# DIAGNOSTIC 2: Cross-correlation curves for all families
# ─────────────────────────────────────────────────────────────

def diagnostic_2(zn):
    header("DIAGNOSTIC 2: Cross-Correlation Curves (all families)")

    families = {
        "N1: Real primes": PRIMES,
        "N2: Composites": [4, 6, 9, 15, 21, 25, 33, 35, 39, 45, 49, 51, 55],
        "N8: Shifted primes": [4, 5, 8, 10, 14, 16, 20, 22, 26, 32, 34, 40, 44],
        "N9: Log-matched": None,  # built below
        "N10: Small primes": [2, 3, 5, 7, 11],
        "N11: Large primes": [23, 29, 31, 37, 41, 43, 47],
        "DIAG5: Matched fake": None,  # built in diagnostic 5
    }

    # Build N9 log-matched
    from rainbow_validate import is_prime
    ln_primes = np.log(PRIMES)
    ln_gaps = np.diff(ln_primes)
    start = np.log(6)
    ln_vals = [start]
    for g in ln_gaps:
        ln_vals.append(ln_vals[-1] + g)
    log_matched = [int(round(np.exp(v))) for v in ln_vals]
    log_matched = [x if not is_prime(x) else x + 1 for x in log_matched]
    families["N9: Log-matched"] = log_matched

    # Build matched fake (diagnostic 5 family)
    families["DIAG5: Matched fake"] = build_matched_fake()

    W = len(zn)
    step = 10  # coarser step for speed

    print(f"  Computing cross-correlation curves (step={step})...\n")

    family_curves = {}
    for name, freqs in families.items():
        if freqs is None:
            continue
        valid = [f for f in freqs if f > 1]
        if len(valid) < 3:
            continue

        t0 = time.time()
        unf = build_unfolded(valid)
        N = len(unf)

        corrs = []
        shifts = []
        for s in range(0, N - W, step):
            sample = unf[s:s + W + 1]
            eg = np.diff(sample)
            if np.any(eg <= 1e-12):
                continue
            en = eg / np.mean(eg)
            r, _ = pearsonr(en[:W], zn[:W])
            corrs.append(r)
            shifts.append(s)

        corrs = np.array(corrs)
        dt = time.time() - t0

        avg = np.mean(corrs)
        best = np.max(corrs)
        frac_pos = np.mean(corrs > 0)

        print(f"  {name:<25} avg={avg:+.6f}  best={best:+.6f}  pos={frac_pos:.3f}  N={len(unf)}  ({dt:.0f}s)")
        family_curves[name] = (shifts, corrs)

    # Side-by-side comparison at key percentiles
    print(f"\n  {'Family':<25} {'p5':>8} {'p25':>8} {'p50':>8} {'p75':>8} {'p95':>8} {'mean':>8}")
    print(f"  {'-'*79}")
    for name, (_, corrs) in family_curves.items():
        p5, p25, p50, p75, p95 = np.percentile(corrs, [5, 25, 50, 75, 95])
        avg = np.mean(corrs)
        print(f"  {name:<25} {p5:>+8.4f} {p25:>+8.4f} {p50:>+8.4f} {p75:>+8.4f} {p95:>+8.4f} {avg:>+8.4f}")

    return family_curves


# ─────────────────────────────────────────────────────────────
# DIAGNOSTIC 3: Order permutation (preserve values, shuffle sequence)
# ─────────────────────────────────────────────────────────────

def diagnostic_3(unfolded, zn, n_perms=2000):
    header("DIAGNOSTIC 3: Order Permutation Test")
    print(f"  Preserve spacing VALUES, shuffle their SEQUENCE.")
    print(f"  Tests: does the ORDER of zeta spacings matter, or just the distribution?\n")

    rng = np.random.default_rng(555)
    W = len(zn)

    # Real score: average over all shifts
    N = len(unfolded)
    real_corrs = []
    for s in range(0, N - W, 1):
        sample = unfolded[s:s + W + 1]
        eg = np.diff(sample)
        if np.any(eg <= 1e-12):
            continue
        en = eg / np.mean(eg)
        r, _ = pearsonr(en[:W], zn[:W])
        real_corrs.append(r)
    real_avg = np.mean(real_corrs)

    # Permuted: shuffle zn, recompute avg-over-shifts
    # (This is expensive with step=1, so use step=10 for permutations)
    perm_avgs = []
    for trial in range(n_perms):
        perm_zn = rng.permutation(zn)
        corrs = []
        for s in range(0, N - W, 10):
            sample = unfolded[s:s + W + 1]
            eg = np.diff(sample)
            if np.any(eg <= 1e-12):
                continue
            en = eg / np.mean(eg)
            r, _ = pearsonr(en[:W], perm_zn[:W])
            corrs.append(r)
        perm_avgs.append(np.mean(corrs))

    perm_avgs = np.array(perm_avgs)
    p_val = np.mean(perm_avgs >= real_avg)

    print(f"  Real avg-over-shifts:     {real_avg:.6f}")
    print(f"  Permuted mean:            {np.mean(perm_avgs):.6f} ± {np.std(perm_avgs):.6f}")
    print(f"  Permuted max:             {np.max(perm_avgs):.6f}")
    print(f"  Permuted min:             {np.min(perm_avgs):.6f}")
    print(f"  p-value (order matters):  {p_val:.4f}  ({int(np.sum(perm_avgs >= real_avg))}/{n_perms})")

    # How many σ away?
    if np.std(perm_avgs) > 0:
        z_score = (real_avg - np.mean(perm_avgs)) / np.std(perm_avgs)
        print(f"  Z-score:                  {z_score:.2f}")

    return real_avg, perm_avgs, p_val


# ─────────────────────────────────────────────────────────────
# DIAGNOSTIC 4: Cross-spectrum
# ─────────────────────────────────────────────────────────────

def diagnostic_4(unfolded, zn):
    header("DIAGNOSTIC 4: Cross-Spectrum / Spectral Coherence")

    W = len(zn)

    # Use the best-matching window for spectral analysis
    N = len(unfolded)
    best_r = -1
    best_start = 0
    for s in range(0, N - W, 1):
        sample = unfolded[s:s + W + 1]
        eg = np.diff(sample)
        if np.any(eg <= 1e-12):
            continue
        en = eg / np.mean(eg)
        r, _ = pearsonr(en[:W], zn[:W])
        if r > best_r:
            best_r = r
            best_start = s

    sample = unfolded[best_start:best_start + W + 1]
    eg = np.diff(sample)
    en = eg / np.mean(eg)

    # FFT of both sequences
    fft_eig = np.fft.rfft(en[:W] - np.mean(en[:W]))
    fft_zeta = np.fft.rfft(zn[:W] - np.mean(zn[:W]))
    freqs = np.fft.rfftfreq(W)

    # Cross-spectrum
    cross = fft_eig * np.conj(fft_zeta)
    power_eig = np.abs(fft_eig) ** 2
    power_zeta = np.abs(fft_zeta) ** 2

    # Coherence (smoothed over bands of 20)
    band = 20
    n_bands = len(freqs) // band
    print(f"  Best-window r = {best_r:.6f} at shift {best_start}")
    print(f"  Spectral coherence (smoothed over {band}-freq bands):\n")
    print(f"  {'Freq band':<20} {'Coherence':>10} {'Phase (deg)':>12} {'Cross-power':>12}")
    print(f"  {'-'*58}")

    coh_vals = []
    for b in range(min(n_bands, 25)):
        lo = b * band + 1  # skip DC
        hi = (b + 1) * band + 1
        if hi > len(cross):
            break
        cx = np.mean(cross[lo:hi])
        pe = np.mean(power_eig[lo:hi])
        pz = np.mean(power_zeta[lo:hi])
        coh = np.abs(cx) ** 2 / (pe * pz) if pe * pz > 0 else 0
        phase = np.angle(cx, deg=True)
        cp = np.abs(cx)
        coh_vals.append(coh)
        f_lo = freqs[lo] if lo < len(freqs) else 0
        f_hi = freqs[min(hi, len(freqs) - 1)]
        print(f"  [{f_lo:.4f}, {f_hi:.4f}]    {coh:>10.4f} {phase:>+12.1f} {cp:>12.2f}")

    print(f"\n  Mean coherence:  {np.mean(coh_vals):.4f}")
    print(f"  Max coherence:   {np.max(coh_vals):.4f}")

    # Also: full cross-correlation function (lag analysis)
    print(f"\n  Cross-correlation at different lags:")
    print(f"  {'Lag':>6} {'r':>10}")
    print(f"  {'-'*18}")
    for lag in [0, 1, 2, 5, 10, 20, 50, 100, -1, -2, -5, -10]:
        if lag >= 0:
            a = en[lag:W]
            b = zn[:W - lag]
        else:
            a = en[:W + lag]
            b = zn[-lag:W]
        if len(a) < 10:
            continue
        r, _ = pearsonr(a, b)
        marker = " ◄" if lag == 0 else ""
        print(f"  {lag:>+6} {r:>+10.6f}{marker}")

    return coh_vals


# ─────────────────────────────────────────────────────────────
# DIAGNOSTIC 5: Matched fake family
# ─────────────────────────────────────────────────────────────

def build_matched_fake():
    """
    Same cardinality (13), same range (~2-41),
    approximately same log-spacing as primes, but NOT primes.
    """
    # Log-spacing of primes: ln(2), ln(3), ..., ln(41)
    ln_p = np.log(PRIMES)
    # Target: 13 non-prime values with same log-spacing pattern
    # Start from a different base that avoids primes
    from rainbow_validate import is_prime

    # Strategy: shift the log positions by a small offset, round to integers,
    # exclude primes, adjust minimally
    offset = 0.15  # small log shift
    target_ln = ln_p + offset
    candidates = [int(round(np.exp(v))) for v in target_ln]

    # Replace any primes with nearest non-prime
    result = []
    for c in candidates:
        if c < 2:
            c = 4
        while is_prime(c):
            c += 1
        result.append(c)

    # Ensure unique
    seen = set()
    final = []
    for r in result:
        while r in seen:
            r += 1
            while is_prime(r):
                r += 1
        seen.add(r)
        final.append(r)

    return sorted(final)


def diagnostic_5(zn):
    header("DIAGNOSTIC 5: Matched Fake Family")

    fake = build_matched_fake()
    print(f"  Real primes:  {PRIMES}")
    print(f"  Matched fake: {fake}")
    print(f"  (Same count={len(fake)}, similar range, similar log-spacing, NO primes)\n")

    # Log-spacing comparison
    ln_real = np.log(PRIMES)
    ln_fake = np.log(fake)
    print(f"  Log-spacing comparison:")
    print(f"  {'Prime':>6} {'ln(p)':>8} {'Fake':>6} {'ln(f)':>8} {'Δln':>8}")
    print(f"  {'-'*40}")
    for i in range(len(PRIMES)):
        dl = ln_fake[i] - ln_real[i] if i < len(fake) else float('nan')
        print(f"  {PRIMES[i]:>6} {ln_real[i]:>8.4f} {fake[i]:>6} {ln_fake[i]:>8.4f} {dl:>+8.4f}")

    # Build and score
    print(f"\n  Building operators...")
    t0 = time.time()
    unf_real = build_unfolded(PRIMES)
    unf_fake = build_unfolded(fake)

    W = len(zn)

    # Average-over-shifts for both
    def avg_over_shifts(unf, target, step=10):
        N = len(unf)
        corrs = []
        for s in range(0, N - W, step):
            sample = unf[s:s + W + 1]
            eg = np.diff(sample)
            if np.any(eg <= 1e-12):
                continue
            en = eg / np.mean(eg)
            r, _ = pearsonr(en[:W], target[:W])
            corrs.append(r)
        return np.array(corrs)

    real_corrs = avg_over_shifts(unf_real, zn)
    fake_corrs = avg_over_shifts(unf_fake, zn)
    dt = time.time() - t0

    print(f"  Done ({dt:.0f}s)\n")

    print(f"  {'Metric':<30} {'Real primes':>14} {'Matched fake':>14} {'Delta':>10}")
    print(f"  {'-'*72}")
    print(f"  {'Mean r (all shifts)':<30} {np.mean(real_corrs):>+14.6f} {np.mean(fake_corrs):>+14.6f} {np.mean(real_corrs)-np.mean(fake_corrs):>+10.6f}")
    print(f"  {'Median r':<30} {np.median(real_corrs):>+14.6f} {np.median(fake_corrs):>+14.6f} {np.median(real_corrs)-np.median(fake_corrs):>+10.6f}")
    print(f"  {'Best r':<30} {np.max(real_corrs):>+14.6f} {np.max(fake_corrs):>+14.6f} {np.max(real_corrs)-np.max(fake_corrs):>+10.6f}")
    print(f"  {'Std r':<30} {np.std(real_corrs):>14.6f} {np.std(fake_corrs):>14.6f}")
    print(f"  {'Frac positive':<30} {np.mean(real_corrs>0):>14.4f} {np.mean(fake_corrs>0):>14.4f}")
    print(f"  {'N shifts':<30} {len(real_corrs):>14} {len(fake_corrs):>14}")

    # Welch's t-test between the two distributions
    from scipy.stats import ttest_ind
    t_stat, t_pval = ttest_ind(real_corrs, fake_corrs, equal_var=False)
    print(f"\n  Welch's t-test (real vs fake): t = {t_stat:.4f}, p = {t_pval:.4e}")
    print(f"  Effect size (Cohen's d):       {(np.mean(real_corrs) - np.mean(fake_corrs)) / np.sqrt((np.std(real_corrs)**2 + np.std(fake_corrs)**2)/2):.4f}")

    return real_corrs, fake_corrs


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║   RAINBOW OPERATOR — FIVE DIAGNOSTICS                             ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")

    t_start = time.time()

    # Load zeros
    print("\n  Loading 1000 zeta zeros...")
    zeros = load_zeros()
    zn = np.diff(zeros) / np.mean(np.diff(zeros))
    print(f"  999 normalized spacings ready.")

    # Build baseline operator
    print("  Building baseline operator...")
    unfolded = build_unfolded(PRIMES)
    print(f"  {len(unfolded)} unfolded positive eigenvalues.\n")

    # Run all 5 diagnostics
    all_corrs, r_avg, r_best = diagnostic_1(unfolded, zn)
    family_curves = diagnostic_2(zn)
    real_avg, perm_avgs, perm_p = diagnostic_3(unfolded, zn)
    coh_vals = diagnostic_4(unfolded, zn)
    real_corrs, fake_corrs = diagnostic_5(zn)

    # Summary
    header("SUMMARY")
    print(f"  D1 — Shift=0: {all_corrs[0]:.6f}, Avg: {r_avg:.6f}, Best: {r_best:.6f}")
    print(f"  D2 — Primes lead all families in mean cross-correlation? See table above.")
    print(f"  D3 — Order permutation p-value: {perm_p:.4f} (does sequence matter?)")
    print(f"  D4 — Mean spectral coherence: {np.mean(coh_vals):.4f}")
    print(f"  D5 — Primes vs matched fake delta: {np.mean(real_corrs) - np.mean(fake_corrs):+.6f}")

    dt = time.time() - t_start
    print(f"\n  Total runtime: {dt/60:.1f} minutes")


if __name__ == "__main__":
    main()
