#!/usr/bin/env python3
"""
Rainbow V3 — Explicit Formula Operator (EFO)

The explicit formula tells us the oscillatory correction to the zero
counting function is:

  R(t) = -(1/π) Σ_p Σ_k sin(t·k·ln(p)) / (k·p^{k/2})

V3 encodes these EXACT harmonics as the coupling structure of a
Hermitian operator. The eigenvalues of this operator should reconstruct
zero positions if the explicit formula is sufficient.

The test: replace the explicit formula amplitudes/frequencies with
wrong ones and show the matching breaks. No smooth envelope to lean on,
no connectivity crutch.

Architecture:
  States:     |u_1⟩ ... |u_N⟩, uniformly spaced in [u_min, u_max]
  Diagonal:   u_i² / 4  (harmonic confinement — sets density of states)
  Coupling:   Σ_p Σ_k  A_pk · cos((u_i - u_j) · k · ln(p))
              where A_pk = ln(p) / (k · p^{k/2})
              These are the EXACT explicit formula coefficients.

The diagonal is the smooth term (Riemann-von Mangoldt gives ~u²/4 density).
The off-diagonal is the oscillatory correction (the prime harmonics).
The eigenvalues should be the zeros.
"""

import numpy as np
from scipy.linalg import eigvalsh
from scipy.stats import pearsonr
import time
import sys
import os
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────────────────────
# Zeros
# ─────────────────────────────────────────────────────────────

def load_zeros(n=1000):
    cache = os.path.join(os.path.dirname(__file__), '.zeta_zeros_1000.npy')
    if os.path.exists(cache):
        z = np.load(cache)
        return z[:n]
    import mpmath
    mpmath.mp.dps = 25
    z = np.array([float(mpmath.zetazero(i).imag) for i in range(1, n+1)])
    np.save(cache, z)
    return z

def sieve(n):
    is_p = [False, False] + [True] * (n - 1)
    for i in range(2, int(n**0.5) + 1):
        if is_p[i]:
            for j in range(i*i, n+1, i):
                is_p[j] = False
    return [i for i in range(2, n+1) if is_p[i]]


# ─────────────────────────────────────────────────────────────
# Phase 1: Characterize the oscillatory target
# ─────────────────────────────────────────────────────────────

def riemann_von_mangoldt(t):
    """Smooth zero counting function: N(t) ≈ (t/2π)ln(t/2πe) + 7/8"""
    return (t / (2*np.pi)) * np.log(t / (2*np.pi*np.e)) + 7.0/8.0

def oscillatory_residual(zeros):
    """
    Compute the oscillatory residual of the zero staircase.
    R(t_n) = n - N_smooth(t_n)
    """
    n = np.arange(1, len(zeros) + 1)
    N_smooth = riemann_von_mangoldt(zeros)
    return n - N_smooth

def explicit_formula_prediction(t, primes, K_max=3):
    """
    Compute the explicit formula oscillatory term:
    R(t) ≈ -(1/π) Σ_p Σ_k sin(t·k·ln(p)) / (k·p^{k/2}) + 1/π · arg Γ(1/4 + it/2)

    We use just the prime sum part.
    """
    result = 0.0
    for p in primes:
        lnp = np.log(p)
        for k in range(1, K_max + 1):
            result -= np.sin(t * k * lnp) / (k * p**(k/2.0))
    return result / np.pi

def fourier_analyze_residual(residual, zeros, freq_range=(0, 5), n_freq=2000):
    """
    Compute the Fourier power spectrum of the oscillatory residual.
    Peaks should appear at ln(2), ln(3), ln(5), ...
    """
    freqs = np.linspace(freq_range[0], freq_range[1], n_freq)
    # Lomb-Scargle style: residual is sampled at irregular points (the zeros)
    power = np.zeros(n_freq)
    for i, f in enumerate(freqs):
        c = np.sum(residual * np.cos(2 * np.pi * f * zeros))
        s = np.sum(residual * np.sin(2 * np.pi * f * zeros))
        power[i] = (c**2 + s**2) / len(zeros)
    return freqs, power


# ─────────────────────────────────────────────────────────────
# Phase 2: Build the Explicit Formula Operator
# ─────────────────────────────────────────────────────────────

def build_efo(N_states, u_min, u_max, primes, K_max=3,
              coupling_strength=1.0, confinement=1.0,
              amplitudes=None, frequencies=None):
    """
    Build the Explicit Formula Operator.

    H[i,j] = δ_ij · confinement · u_i²/4
            + coupling_strength · Σ_p Σ_k A_pk · cos((u_i - u_j) · ω_pk)

    where by default:
      A_pk = ln(p) / (k · p^{k/2})     [explicit formula amplitudes]
      ω_pk = k · ln(p)                   [explicit formula frequencies]

    Custom amplitudes/frequencies can be passed for null testing.
    """
    u = np.linspace(u_min, u_max, N_states)
    du = u[1] - u[0]

    # Build Hamiltonian
    H = np.zeros((N_states, N_states))

    # Diagonal: confinement
    for i in range(N_states):
        H[i, i] = confinement * u[i]**2 / 4.0

    # Off-diagonal (and diagonal correction): prime harmonics
    if amplitudes is None or frequencies is None:
        amps = []
        freqs_list = []
        for p in primes:
            lnp = np.log(p)
            for k in range(1, K_max + 1):
                amps.append(np.log(p) / (k * p**(k/2.0)))
                freqs_list.append(k * lnp)
        amplitudes = np.array(amps)
        frequencies = np.array(freqs_list)

    # Vectorized construction
    for idx in range(len(amplitudes)):
        A = amplitudes[idx]
        omega = frequencies[idx]
        for i in range(N_states):
            for j in range(i, N_states):
                val = coupling_strength * A * np.cos((u[i] - u[j]) * omega)
                H[i, j] += val
                if i != j:
                    H[j, i] += val

    return H, u


def efo_eigenvalues(H):
    """Compute and sort eigenvalues."""
    return eigvalsh(H)


# ─────────────────────────────────────────────────────────────
# Phase 3: Compare eigenvalue fluctuations to zero fluctuations
# ─────────────────────────────────────────────────────────────

def compare_fluctuations(eigs, zeros, primes_for_fourier):
    """
    Compare the oscillatory part of the eigenvalue staircase
    to the oscillatory part of the zero staircase.
    """
    # For eigenvalues: unfold analytically (polynomial), get residual
    N_e = len(eigs)
    n_e = np.arange(1, N_e + 1)
    # Polynomial unfolding (the eigenvalue smooth density isn't RvM)
    coeffs = np.polyfit(eigs, n_e, 5)
    N_smooth_e = np.polyval(coeffs, eigs)
    resid_e = n_e - N_smooth_e

    # For zeros: analytical unfolding
    N_z = len(zeros)
    resid_z = oscillatory_residual(zeros)

    # Fourier spectra of both residuals
    freq_range = (0, 4)
    n_freq = 1000
    freqs = np.linspace(freq_range[0], freq_range[1], n_freq)

    # Eigenvalue residual spectrum
    power_e = np.zeros(n_freq)
    for i, f in enumerate(freqs):
        c = np.sum(resid_e * np.cos(2 * np.pi * f * eigs))
        s = np.sum(resid_e * np.sin(2 * np.pi * f * eigs))
        power_e[i] = (c**2 + s**2) / N_e

    # Zero residual spectrum
    power_z = np.zeros(n_freq)
    for i, f in enumerate(freqs):
        c = np.sum(resid_z * np.cos(2 * np.pi * f * zeros))
        s = np.sum(resid_z * np.sin(2 * np.pi * f * zeros))
        power_z[i] = (c**2 + s**2) / N_z

    # Normalize
    power_e = power_e / np.max(power_e) if np.max(power_e) > 0 else power_e
    power_z = power_z / np.max(power_z) if np.max(power_z) > 0 else power_z

    # Correlation of power spectra
    r_spectrum, p_spectrum = pearsonr(power_e, power_z)

    # Peak locations (should be at ln(p)/(2π) for the zeros)
    from scipy.signal import find_peaks
    peaks_e, _ = find_peaks(power_e, height=0.1, distance=20)
    peaks_z, _ = find_peaks(power_z, height=0.1, distance=20)

    return {
        'freqs': freqs,
        'power_e': power_e,
        'power_z': power_z,
        'r_spectrum': r_spectrum,
        'p_spectrum': p_spectrum,
        'peaks_e': freqs[peaks_e] if len(peaks_e) > 0 else [],
        'peaks_z': freqs[peaks_z] if len(peaks_z) > 0 else [],
        'resid_e': resid_e,
        'resid_z': resid_z,
    }


# ─────────────────────────────────────────────────────────────
# Phase 4: Null families
# ─────────────────────────────────────────────────────────────

def make_null_amplitudes(primes, K_max, null_type, rng=None):
    """Generate null amplitude/frequency sets."""
    if rng is None:
        rng = np.random.default_rng(42)

    real_amps = []
    real_freqs = []
    for p in primes:
        lnp = np.log(p)
        for k in range(1, K_max + 1):
            real_amps.append(np.log(p) / (k * p**(k/2.0)))
            real_freqs.append(k * lnp)
    real_amps = np.array(real_amps)
    real_freqs = np.array(real_freqs)

    if null_type == "shuffled_amps":
        # Same frequencies, shuffled amplitudes
        return rng.permutation(real_amps), real_freqs

    elif null_type == "random_freqs":
        # Same amplitudes, random frequencies in same range
        rand_freqs = rng.uniform(real_freqs.min(), real_freqs.max(), size=len(real_freqs))
        return real_amps, np.sort(rand_freqs)

    elif null_type == "flat_amps":
        # All amplitudes equal (no prime weighting), same frequencies
        flat = np.ones_like(real_amps) * np.mean(real_amps)
        return flat, real_freqs

    elif null_type == "composite_freqs":
        # Replace ln(p) with ln(composite)
        composites = [4, 6, 9, 10, 14, 15, 21, 22, 25, 26, 33, 34, 35]
        comp_amps = []
        comp_freqs = []
        for c in composites[:len(primes)]:
            lnc = np.log(c)
            for k in range(1, K_max + 1):
                comp_amps.append(np.log(c) / (k * c**(k/2.0)))
                comp_freqs.append(k * lnc)
        return np.array(comp_amps), np.array(comp_freqs)

    elif null_type == "wrong_exponent":
        # Use p^{k/3} instead of p^{k/2} — wrong critical line
        wrong_amps = []
        for p in primes:
            for k in range(1, K_max + 1):
                wrong_amps.append(np.log(p) / (k * p**(k/3.0)))
        return np.array(wrong_amps), real_freqs

    elif null_type == "wrong_line_k4":
        # Use p^{k/4} — even more wrong
        wrong_amps = []
        for p in primes:
            for k in range(1, K_max + 1):
                wrong_amps.append(np.log(p) / (k * p**(k/4.0)))
        return np.array(wrong_amps), real_freqs

    elif null_type == "no_coupling":
        # Zero coupling — pure confinement
        return np.zeros_like(real_amps), real_freqs

    else:
        return real_amps, real_freqs


# ─────────────────────────────────────────────────────────────
# Phase 5: Spectral Form Factor comparison
# ─────────────────────────────────────────────────────────────

def sff(spacings, tau_max=2.0, n_tau=200):
    w = np.cumsum(spacings); w -= w[0]; N = len(w)
    taus = np.linspace(0.01, tau_max, n_tau)
    K = np.zeros(n_tau)
    for i, tau in enumerate(taus):
        phases = np.exp(2j * np.pi * tau * w)
        K[i] = np.abs(np.sum(phases))**2 / N
    return taus, K

def sff_ramp_slope(taus, K):
    mask = (taus >= 0.1) & (taus <= 0.8)
    if np.sum(mask) < 5: return 0.0
    return np.polyfit(taus[mask], K[mask], 1)[0]

def sff_mse_gue(taus, K):
    mask = (taus >= 0.05) & (taus <= 0.9)
    K_gue = np.minimum(taus[mask], 1.0)
    return np.mean((K[mask] - K_gue)**2)


# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────

def header(s):
    print(f"\n{'='*70}")
    print(f"  {s}")
    print(f"{'='*70}\n")

def main():
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║   RAINBOW V3 — EXPLICIT FORMULA OPERATOR                          ║")
    print("║   Encoding exact prime harmonics. Oscillatory domain only.         ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")

    sys.stdout.reconfigure(line_buffering=True)
    t_start = time.time()

    # ── Load zeros ──
    zeros = load_zeros(1000)
    primes_list = sieve(200)  # primes up to 200 for harmonics
    primes_13 = primes_list[:13]  # [2..41] for operator
    print(f"  Loaded {len(zeros)} zeros, {len(primes_13)} primes for operator", flush=True)

    # ── Phase 1: Ground truth ──
    header("PHASE 1: Oscillatory Residual of Zeta Zeros")

    resid = oscillatory_residual(zeros)
    print(f"  Residual range: [{resid.min():.4f}, {resid.max():.4f}]")
    print(f"  Residual std:   {resid.std():.4f}")

    # Check explicit formula prediction
    ef_pred = np.array([explicit_formula_prediction(t, primes_list[:50], K_max=5) for t in zeros])
    r_ef, p_ef = pearsonr(resid, ef_pred)
    print(f"  Explicit formula correlation with residual: r={r_ef:.4f} p={p_ef:.2e}")

    # Fourier spectrum
    freqs, power = fourier_analyze_residual(resid, zeros, freq_range=(0, 1.0), n_freq=2000)
    print(f"\n  Fourier peaks in oscillatory residual:")
    print(f"  (Should appear at ln(p)/(2π): ln2/2π=0.110, ln3=0.175, ln5=0.256, ln7=0.310)")

    from scipy.signal import find_peaks
    peaks, props = find_peaks(power, height=np.max(power)*0.05, distance=10)
    for pk in peaks[:15]:
        f = freqs[pk]
        # Check if near ln(p)/(2π)
        match = ""
        for p in [2,3,5,7,11,13,17,19,23,29,31,37]:
            if abs(f - np.log(p)/(2*np.pi)) < 0.01:
                match = f" ← ln({p})/2π = {np.log(p)/(2*np.pi):.4f}"
                break
        print(f"    f={f:.4f}  power={power[pk]:.4f}{match}")

    # ── Phase 2: Build EFO and null variants ──
    header("PHASE 2: Explicit Formula Operators")

    # Operator parameters
    # u range should cover roughly where the first ~500 eigenvalues live
    # The zero density at height t is ~ln(t/2π)/(2π), so 1000 zeros span t up to ~1420
    # We want eigenvalues in a similar range
    N_STATES = 800
    U_MIN = 5.0
    U_MAX = 200.0
    K_MAX = 3

    # Scan coupling strength to find best match
    header("PHASE 2a: Coupling Strength Scan")
    print(f"  N={N_STATES}, u=[{U_MIN},{U_MAX}], K_max={K_MAX}, {len(primes_13)} primes")
    print(f"  Scanning coupling strength...\n", flush=True)

    # Quick scan
    best_r = -1
    best_cs = 0
    zn = np.diff(zeros) / np.mean(np.diff(zeros))

    for cs in [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]:
        t0 = time.time()
        H, u = build_efo(N_STATES, U_MIN, U_MAX, primes_13, K_MAX,
                         coupling_strength=cs, confinement=1.0)
        eigs = efo_eigenvalues(H)

        # Unfold and get spacings
        pos = eigs[eigs > eigs[len(eigs)//4]]  # upper 75%
        if len(pos) < 50: continue
        coeffs = np.polyfit(pos, np.arange(len(pos)), 3)
        unf = np.polyval(coeffs, pos)
        sp = np.diff(unf)
        sp = sp[sp > 1e-12]
        sp = sp / np.mean(sp)

        # SFF
        taus, K = sff(sp)
        slope = sff_ramp_slope(taus, K)
        mse = sff_mse_gue(taus, K)

        dt = time.time() - t0
        print(f"  cs={cs:<6.3f}  slope={slope:+.4f}  mse_gue={mse:.4f}  #sp={len(sp)}  ({dt:.1f}s)", flush=True)

        if slope > best_r and slope < 2.0:
            best_r = slope
            best_cs = cs

    print(f"\n  Best coupling: {best_cs} (slope={best_r:.4f})")

    # ── Phase 3: Full comparison with nulls ──
    header("PHASE 3: EFO vs Null Operators")

    null_types = [
        "real",             # actual explicit formula
        "shuffled_amps",    # same freqs, wrong amp assignment
        "random_freqs",     # same amps, random frequencies
        "flat_amps",        # equal amplitudes
        "composite_freqs",  # composite frequencies instead of prime
        "wrong_exponent",   # p^{k/3} instead of p^{k/2}
        "wrong_line_k4",    # p^{k/4}
        "no_coupling",      # pure confinement (no harmonics)
    ]

    rng = np.random.default_rng(42)

    print(f"  Building {len(null_types)} operators at cs={best_cs}...\n")
    print(f"  {'Type':<20} {'Slope':>8} {'MSE_GUE':>10} {'Spec r':>8} {'#sp':>5}")
    print(f"  {'-'*55}")

    results = {}
    for nt in null_types:
        t0 = time.time()
        if nt == "real":
            H, u = build_efo(N_STATES, U_MIN, U_MAX, primes_13, K_MAX,
                             coupling_strength=best_cs, confinement=1.0)
        else:
            amps, fqs = make_null_amplitudes(primes_13, K_MAX, nt, rng=rng)
            H, u = build_efo(N_STATES, U_MIN, U_MAX, primes_13, K_MAX,
                             coupling_strength=best_cs, confinement=1.0,
                             amplitudes=amps, frequencies=fqs)

        eigs = efo_eigenvalues(H)

        # Unfold
        pos = eigs[eigs > eigs[len(eigs)//4]]
        if len(pos) < 50:
            print(f"  {nt:<20} SKIP (too few eigs)")
            continue
        coeffs = np.polyfit(pos, np.arange(len(pos)), 3)
        unf = np.polyval(coeffs, pos)
        sp = np.diff(unf)
        sp = sp[sp > 1e-12]
        sp = sp / np.mean(sp)

        # SFF
        taus, K = sff(sp)
        slope = sff_ramp_slope(taus, K)
        mse = sff_mse_gue(taus, K)

        # Spectral comparison
        comp = compare_fluctuations(eigs, zeros[:min(len(eigs), len(zeros))], primes_13)

        dt = time.time() - t0
        print(f"  {nt:<20} {slope:>+8.4f} {mse:>10.4f} {comp['r_spectrum']:>+8.4f} {len(sp):>5}  ({dt:.1f}s)", flush=True)

        results[nt] = {
            'slope': slope, 'mse': mse,
            'r_spectrum': comp['r_spectrum'],
            'peaks_e': comp['peaks_e'],
            'n_sp': len(sp)
        }

    # ── Phase 4: Multiple random null draws ──
    header("PHASE 4: Null Distribution (20 random draws)")

    random_slopes = []
    random_mses = []
    random_specr = []

    for trial in range(20):
        seed_rng = np.random.default_rng(7000 + trial)

        # Random frequencies, same amplitude structure
        amps, fqs = make_null_amplitudes(primes_13, K_MAX, "random_freqs", rng=seed_rng)
        H, u = build_efo(N_STATES, U_MIN, U_MAX, primes_13, K_MAX,
                         coupling_strength=best_cs, confinement=1.0,
                         amplitudes=amps, frequencies=fqs)
        eigs = efo_eigenvalues(H)

        pos = eigs[eigs > eigs[len(eigs)//4]]
        if len(pos) < 50: continue
        coeffs = np.polyfit(pos, np.arange(len(pos)), 3)
        unf = np.polyval(coeffs, pos)
        sp = np.diff(unf); sp = sp[sp > 1e-12]; sp = sp/np.mean(sp)

        taus, K = sff(sp)
        slope = sff_ramp_slope(taus, K)
        mse = sff_mse_gue(taus, K)
        comp = compare_fluctuations(eigs, zeros[:min(len(eigs), len(zeros))], primes_13)

        random_slopes.append(slope)
        random_mses.append(mse)
        random_specr.append(comp['r_spectrum'])

    random_slopes = np.array(random_slopes)
    random_mses = np.array(random_mses)
    random_specr = np.array(random_specr)

    real = results.get("real", {})

    print(f"  Real (primes) slope:     {real.get('slope', 0):+.4f}")
    print(f"  Random null mean±std:    {np.mean(random_slopes):+.4f} ± {np.std(random_slopes):.4f}")
    print(f"  Gap:                     {real.get('slope',0) - np.mean(random_slopes):+.4f}")

    if np.std(random_slopes) > 0:
        d = (real.get('slope',0) - np.mean(random_slopes)) / np.std(random_slopes)
        p_val = np.mean(random_slopes >= real.get('slope', 0))
        print(f"  Effect size (d):         {d:+.2f}")
        print(f"  p-value:                 {p_val:.4f}")

    print(f"\n  Spectral correlation:")
    print(f"  Real:                    {real.get('r_spectrum', 0):+.4f}")
    print(f"  Random null mean±std:    {np.mean(random_specr):+.4f} ± {np.std(random_specr):.4f}")
    if np.std(random_specr) > 0:
        d2 = (real.get('r_spectrum',0) - np.mean(random_specr)) / np.std(random_specr)
        p2 = np.mean(random_specr >= real.get('r_spectrum', 0))
        print(f"  Effect size (d):         {d2:+.2f}")
        print(f"  p-value:                 {p2:.4f}")

    # ── Verdict ──
    header("VERDICT")

    if real:
        print(f"  EFO slope:           {real['slope']:+.4f}  (GUE target: +1.0)")
        print(f"  EFO MSE vs GUE:      {real['mse']:.4f}")
        print(f"  EFO spectral corr:   {real['r_spectrum']:+.4f}")
        print()

        # Does the explicit formula encoding outperform every null?
        null_slopes = [r['slope'] for k, r in results.items() if k != 'real']
        if null_slopes and real['slope'] > max(null_slopes):
            print(f"  Real primes BEAT all named nulls on SFF slope.")
        else:
            beaten_by = [k for k, r in results.items() if k != 'real' and r['slope'] >= real['slope']]
            print(f"  Real primes beaten by: {beaten_by}")

        null_specr = [r['r_spectrum'] for k, r in results.items() if k != 'real']
        if null_specr and real['r_spectrum'] > max(null_specr):
            print(f"  Real primes BEAT all named nulls on spectral correlation.")
        else:
            beaten_by2 = [k for k, r in results.items() if k != 'real' and r['r_spectrum'] >= real['r_spectrum']]
            print(f"  Spectral corr beaten by: {beaten_by2}")

    dt = time.time() - t_start
    print(f"\n  Total runtime: {dt/60:.1f} minutes")


if __name__ == "__main__":
    main()
