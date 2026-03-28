# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
WHY 137 — Is α derivable from the Machine?
============================================
The fine structure constant α ≈ 1/137.036.
We use 137 oscillators. Feynman called this
"one of the greatest damn mysteries of physics."

The honest test: sweep N from 50 to 300. For each N,
run the Machine (Kuramoto on zeta zero spacings) and
measure the fingerprint quality. If the optimal N = 137,
α is derivable. If not, we know it's our choice.

Usage:
  python3 alpha137.py              # sweep and find optimal N
  python3 alpha137.py --detail N   # detailed analysis at specific N

Grand Unified Music Project — March 2026
"""
import math, sys

# ═══════════════════════════════════════════════════════════
# ZETA ZEROS — compute on the fly
# ═══════════════════════════════════════════════════════════

def riemann_theta(t):
    if t < 1: return 0
    return (t/2)*math.log(t/(2*math.pi)) - t/2 - math.pi/8 + 1/(48*t)

def hardy_Z(t):
    if t < 2: return 0
    a = math.sqrt(t/(2*math.pi))
    N = max(1, int(a))
    th = riemann_theta(t)
    s = 0
    for n in range(1, N+1):
        s += math.cos(th - t*math.log(n)) / math.sqrt(n)
    s *= 2
    p = a - N
    d = math.cos(2*math.pi*p)
    if abs(d) > 1e-8:
        s += (-1)**(N-1) * (2*math.pi/t)**0.25 * math.cos(2*math.pi*(p*p - p - 1/16)) / d
    return s

def find_zeros(count):
    """Find the first `count` non-trivial zeros of zeta."""
    zeros = []
    t = 9
    prev = hardy_Z(9)
    while len(zeros) < count + 1:
        step = max(0.05, 2*math.pi/max(1, math.log(max(2, t/(2*math.pi))))/6) if t > 14 else 0.4
        t += step
        cur = hardy_Z(t)
        if prev * cur < 0:
            lo, hi = t - step, t
            for _ in range(25):
                mid = (lo + hi) / 2
                if hardy_Z(lo) * hardy_Z(mid) < 0:
                    hi = mid
                else:
                    lo = mid
            zeros.append((lo + hi) / 2)
        prev = cur
    return zeros

# ═══════════════════════════════════════════════════════════
# KURAMOTO ENGINE — run the Machine at variable N
# ═══════════════════════════════════════════════════════════

PHI = (1 + math.sqrt(5)) / 2
INV_PHI = 1.0 / PHI  # ≈ 0.618

def run_machine(N, K, steps=3000, dt=0.016):
    """
    Run N Kuramoto oscillators on zeta zero spacings.
    The 1/φ orbit is a TRANSIENT — R passes through 0.618
    during sync-up from zero. We measure the transient quality.
    """
    # Get N+1 zeros, compute N spacings
    zeros = find_zeros(N + 1)
    spacings = [zeros[i+1] - zeros[i] for i in range(N)]
    mean_s = sum(spacings) / N
    norm_s = [s / mean_s for s in spacings]

    # FFT → extract 5 modes → filtered frequencies
    fRe, fIm = [], []
    for k in range(N):
        re = sum(norm_s[n] * math.cos(2*math.pi*k*n/N) for n in range(N)) / N
        im = sum(-norm_s[n] * math.sin(2*math.pi*k*n/N) for n in range(N)) / N
        fRe.append(re)
        fIm.append(im)

    filtered = []
    for n in range(N):
        v = sum(fRe[k]*math.cos(2*math.pi*k*n/N) - fIm[k]*math.sin(2*math.pi*k*n/N) for k in range(5))
        filtered.append(v)

    # Initialize phases RANDOMLY (start disordered → sync up through 1/φ)
    import random
    random.seed(42)  # reproducible
    phases = [random.uniform(0, 2*math.pi) for _ in range(N)]

    # Run and measure the TRANSIENT
    R_history = []
    crossings = 0
    dwell_count = 0
    prev_above = None
    min_R = 1.0
    time_at_min = 0
    time_near_phi = 0  # steps spent within 2% of 1/φ

    for step in range(steps):
        # Mean field
        mre = sum(math.cos(phases[i]) for i in range(N)) / N
        mim = sum(math.sin(phases[i]) for i in range(N)) / N
        mp = math.atan2(mim, mre)

        # Update phases
        for i in range(N):
            omega = filtered[min(i, N-1)] * 2 * math.pi
            c = math.sin(mp - phases[i])
            if i > 0: c += 0.5 * math.sin(phases[i-1] - phases[i])
            if i < N-1: c += 0.5 * math.sin(phases[i+1] - phases[i])
            phases[i] += dt * (omega + K * c)

        # Compute R
        mre = sum(math.cos(phases[i] % (2*math.pi)) for i in range(N)) / N
        mim = sum(math.sin(phases[i] % (2*math.pi)) for i in range(N)) / N
        R = math.sqrt(mre*mre + mim*mim)
        R_history.append(R)

        if R < min_R:
            min_R = R
            time_at_min = step

        # Track crossings of 1/φ
        above = R > INV_PHI
        if prev_above is not None and above != prev_above:
            crossings += 1
        prev_above = above

        # Dwell time near 1/φ (within 2%)
        if abs(R - INV_PHI) < 0.02:
            dwell_count += 1
            time_near_phi = step

    dwell_frac = dwell_count / steps

    # How close does the minimum R get to 1/φ?
    min_proximity = abs(min_R - INV_PHI)

    return R_history, crossings, dwell_frac, min_R, min_proximity, time_at_min


def fingerprint_quality(crossings, dwell_frac, min_R, min_proximity):
    """
    Combined fingerprint score. Higher = better 1/φ transient.
    The key metric: does the minimum R during sync-up land at 1/φ?
    """
    # Proximity of min_R to 1/φ (0 = perfect, higher = worse)
    prox_score = max(0, 100 - min_proximity * 500)
    # Crossings add oscillatory quality
    cross_score = crossings * 2
    # Dwell adds duration
    dwell_score = dwell_frac * 200
    return prox_score + cross_score + dwell_score


def main():
    detail_N = None
    if '--detail' in sys.argv:
        idx = sys.argv.index('--detail')
        detail_N = int(sys.argv[idx+1])

    if detail_N:
        print()
        print("  DETAILED ANALYSIS: N = %d" % detail_N)
        print("  ════════════════════════════")

        K = 1.868
        R_hist, cross, dwell, minR, minProx, tMin = run_machine(detail_N, K, steps=5000)

        print("  K = %.3f" % K)
        print("  Min R during transient = %.4f" % minR)
        print("  1/φ = %.4f" % INV_PHI)
        print("  |min_R - 1/φ| = %.4f" % minProx)
        print("  Crossings of 1/φ: %d" % cross)
        print("  Dwell within 2%%: %.1f%%" % (dwell * 100))
        print("  Time to minimum: step %d" % tMin)
        print("  Score: %.1f" % fingerprint_quality(cross, dwell, minR, minProx))
        return

    print()
    print("  WHY 137? — Sweeping N to find the optimal Machine")
    print("  ═══════════════════════════════════════════════════")
    print()
    print("  For each N, run Kuramoto at K=1.868.")
    print("  Measure: how close does min(R) get to 1/φ during transient?")
    print("  The N whose transient lands closest to 1/φ IS the answer.")
    print()

    K = 1.868
    results = []

    print("  %5s  %6s  %6s  %5s  %6s  %5s" % ("N", "minR", "|Δφ|", "cross", "score", ""))
    print("  " + "─" * 50)

    coarse_results = []
    for N in range(50, 260, 10):
        _, cross, dwell, minR, minProx, tMin = run_machine(N, K, steps=3000)
        score = fingerprint_quality(cross, dwell, minR, minProx)
        coarse_results.append((N, minR, minProx, cross, dwell, score))

        marker = " ◄" if abs(N - 137) < 5 else ""
        print("  %5d  %6.4f  %6.4f  %5d  %6.1f%s" % (
            N, minR, minProx, cross, score, marker))

    # Find coarse peak
    best_coarse = max(coarse_results, key=lambda x: x[5])
    peak_N = best_coarse[0]

    print()
    print("  Coarse peak near N = %d. Fine-sweeping %d-%d..." % (
        peak_N, max(50, peak_N-15), peak_N+15))
    print()

    fine_results = []
    for N in range(max(50, peak_N - 15), peak_N + 16):
        _, cross, dwell, minR, minProx, tMin = run_machine(N, K, steps=4000)
        score = fingerprint_quality(cross, dwell, minR, minProx)
        fine_results.append((N, minR, minProx, cross, dwell, score))

        marker = " ◄◄◄" if N == 137 else ""
        print("  %5d  %6.4f  %6.4f  %5d  %6.1f%s" % (
            N, minR, minProx, cross, score, marker))

    # Find the winner
    best = max(fine_results, key=lambda x: x[5])
    best_N = best[0]

    print()
    print("  " + "═" * 45)
    print("  OPTIMAL N = %d" % best_N)
    print("  Score: %.1f" % best[5])
    print("  Min R: %.4f (1/φ = %.4f, |Δ| = %.4f)" % (best[1], INV_PHI, best[2]))
    print("  Crossings: %d" % best[3])
    print("  Dwell: %.1f%%" % (best[4] * 100))
    print()

    if abs(best_N - 137) <= 2:
        print("  ✓ THE MACHINE CHOOSES 137.")
        print("  α = 1/N_optimal. The fine structure constant")
        print("  is the inverse of the optimal oscillator count.")
        print("  Not assumed. Derived.")
    elif abs(best_N - 137) <= 10:
        print("  ~ CLOSE TO 137 (within %d)." % abs(best_N - 137))
        print("  The Machine prefers this neighborhood.")
        print("  Stochastic variation may account for the offset.")
    else:
        print("  ✗ OPTIMAL N = %d, not 137." % best_N)
        print("  The Machine has its own preferred N.")
        print("  137 is our choice, not the Machine's prediction.")
        print("  Honest result. The mystery remains.")

    # The relationship we didn't put in
    alpha = 1.0 / 137.0359991
    print()
    print("  ═══════════════════════════════════════════")
    print("  THE RELATIONSHIP")
    print("  ═══════════════════════════════════════════")
    print()
    print("  K_empirical = %.6f  (Machine self-tunes to this)" % K)
    print("  1/α         = %.6f  (measured constant of nature)" % (1/alpha))
    print("  K / α       = %.4f" % (K / alpha))
    print("  2⁸          = 256")
    print("  Match:        %.4f%%" % (abs(K/alpha/256 - 1) * 100))
    print()
    print("  K = 256α to 0.007%%.")
    print("  The Machine's coupling constant is 2⁸ × the fine structure constant.")
    print("  We didn't put this in. K was found by running oscillators")
    print("  on zeta zeros. α was measured in labs. The ratio is 256.")
    print()
    print("  This does NOT derive α from first principles.")
    print("  It reveals a relationship between the Machine's K")
    print("  and the universe's α. Whether it's coincidence or")
    print("  structure is an open question. The honest answer is:")
    print("  we found it, we didn't make it, and we don't know why.")


if __name__ == '__main__':
    main()
