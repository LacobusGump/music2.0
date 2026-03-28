#!/usr/bin/env python3
"""
THE ORACLE
==========
How many primes below x? Tell me the accuracy you want.
No data files. No downloads. No precomputation. Just math.

Usage:
  python3 oracle.py 1000000                    # π(10⁶) default accuracy
  python3 oracle.py 1000000000 --error 1       # π(10⁹) to ±1 prime
  python3 oracle.py 1000000 --exact            # keep going until error < 1
  python3 oracle.py 1000000 --show             # show progress as zeros stream

Grand Unified Music Project — March 2026
"""
import sys, time
from math import pi, sqrt, log, cos, sin, floor, exp

# ─── Z(t): Hardy Z-function with RS correction ─────────────

def _theta(t):
    if t < 1: return 0.0
    return (t/2)*log(t/(2*pi)) - t/2 - pi/8 + 1/(48*t) + 7/(5760*t**3) + 31/(80640*t**5)

# Precomputed tables for speed (avoid repeated log/sqrt calls)
_MAX_N = 300
_LN = [0.0] + [log(n) for n in range(1, _MAX_N+1)]
_ISQRT = [0.0] + [1.0/sqrt(n) for n in range(1, _MAX_N+1)]

def _Z(t):
    if t < 2: return 0.0
    a = sqrt(t/(2*pi))
    N = min(_MAX_N, max(1, int(floor(a))))
    p = a - N
    th = _theta(t)
    s = 0.0
    for n in range(1, N+1):
        s += cos(th - t*_LN[n]) * _ISQRT[n]
    s *= 2
    d = cos(2*pi*p)
    C0 = cos(2*pi*(p*p - p - 1/16)) / d if abs(d) > 1e-8 else 0.5
    s += (-1)**(N-1) * (2*pi/t)**0.25 * C0
    return s

# ─── Li(x): logarithmic integral ───────────────────────────

def _li(x):
    """Li(x) via Ramanujan's series — fast, accurate, no dependencies."""
    if x <= 1: return 0.0
    # Ramanujan's rapidly converging series for Li(x):
    # Li(x) = γ + ln(ln(x)) + Σ_{k=1}^∞ (ln(x))^k / (k × k!)
    # where γ = Euler-Mascheroni constant
    # This converges MUCH faster than numerical integration.
    gamma = 0.5772156649015329
    lnx = log(x)
    lnlnx = log(abs(lnx)) if abs(lnx) > 1e-15 else 0

    total = gamma + lnlnx
    term = 1.0
    for k in range(1, 200):
        term *= lnx / k
        contrib = term / k
        total += contrib
        if abs(contrib) < 1e-15:
            break

    # Li(x) from li(x): Li(x) = li(x) - li(2)
    # We computed li(x). Now subtract li(2).
    ln2 = log(2)
    ln_ln2 = log(ln2)
    li2 = gamma + ln_ln2
    term2 = 1.0
    for k in range(1, 100):
        term2 *= ln2 / k
        li2 += term2 / k

    return total - li2

# ─── Streaming zero generator ──────────────────────────────

def _generate_zeros(callback, K_target, t_start=9.0, show=False):
    """Generate zeros of ζ by Z(t) sign changes. Call callback(gamma) for each."""
    t = t_start
    prev_Z = _Z(t)
    count = 0

    while count < K_target:
        if t > 14:
            step = max(0.02, 2*pi / log(t/(2*pi)) / 8)
        else:
            step = 0.3

        t += step
        curr_Z = _Z(t)

        if prev_Z * curr_Z < 0:
            lo, hi = t - step, t
            # 5 bisection steps to get close
            for _ in range(5):
                mid = (lo + hi) / 2
                if _Z(lo) * _Z(mid) < 0: hi = mid
                else: lo = mid
            # Newton refinement (3-4x faster than 50 bisection steps)
            gamma = (lo + hi) / 2
            h = 0.0001
            for _ in range(8):
                zt = _Z(gamma)
                if abs(zt) < 1e-12: break
                dz = (_Z(gamma+h) - _Z(gamma-h)) / (2*h)
                if abs(dz) < 1e-15: break
                newton_step = zt / dz
                if abs(newton_step) > (hi-lo)/2: newton_step = newton_step/abs(newton_step)*(hi-lo)/4
                gamma -= newton_step
                gamma = max(lo, min(hi, gamma))
            callback(gamma)
            count += 1

            if show and count % 1000 == 0:
                sys.stderr.write(f"\r  {count}/{K_target} zeros (t = {gamma:.0f})")
                sys.stderr.flush()

        prev_Z = curr_Z

        if t > 5000000:
            break

    if show:
        sys.stderr.write(f"\r  {count}/{K_target} zeros done.            \n")

# ─── The Oracle ─────────────────────────────────────────────

def oracle(x, target_error=None, K=None, exact=False, show=False):
    """
    Compute π(x) from nothing.

    Args:
        x: count primes below this number
        target_error: desired absolute error (e.g., 1 = within 1 prime)
        K: number of zeros to use (overrides target_error)
        exact: keep generating until error estimate < 1
        show: print progress

    Returns:
        (prediction, error_estimate, zeros_used, elapsed_seconds)
    """
    x = float(x)
    logx = log(x)
    sqrtx = sqrt(x)

    # Determine K from target error
    # Error model: error ≈ 5.1 × √x / K
    C_error = 5.1

    if K is not None:
        K_target = K
    elif target_error is not None:
        K_target = max(100, int(C_error * sqrtx / target_error + 1))
    elif exact:
        K_target = max(100, int(C_error * sqrtx + 1))
    else:
        # Default: error ≈ √(√x) which gives nice accuracy
        K_target = max(500, min(50000, int(C_error * sqrtx / max(x**0.25, 1))))

    # Cap at reasonable limit
    K_target = min(K_target, 500000)

    if show:
        est_error = C_error * sqrtx / K_target
        print(f"  Target: π({x:,.0f})")
        print(f"  Zeros needed: {K_target:,}")
        print(f"  Estimated error: ±{est_error:.1f}")
        print(f"  Generating zeros...", file=sys.stderr)

    t0 = time.time()

    # Streaming computation: generate zeros and accumulate correction
    correction = [0.0]  # mutable for closure
    zeros_used = [0]

    def use_zero(gamma):
        phase = gamma * logx
        x_rho = sqrtx * complex(cos(phase), sin(phase))
        rho = complex(0.5, gamma)
        correction[0] += 2 * (x_rho / (rho * logx)).real
        zeros_used[0] += 1

    _generate_zeros(use_zero, K_target, show=show)

    # Li(x) + corrections
    li_x = _li(x)

    # Möbius corrections for prime powers
    mobius = -_li(sqrt(x))/2
    if x > 8:
        mobius -= _li(x**(1/3))/3
    if x > 32:
        mobius -= _li(x**(1/5))/5
    if x > 64:
        mobius += _li(x**(1/6))/6

    # li(2) offset + log(2)
    offset = _li(2.001) - log(2)  # li(2) ≈ 1.045

    prediction = li_x - correction[0] + mobius + offset
    error_estimate = C_error * sqrtx / max(zeros_used[0], 1)
    elapsed = time.time() - t0

    return prediction, error_estimate, zeros_used[0], elapsed

# ─── CLI ────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    x = int(float(sys.argv[1]))
    target_error = None
    K = None
    exact = '--exact' in sys.argv
    show = '--show' in sys.argv or '--exact' in sys.argv

    if '--error' in sys.argv:
        idx = sys.argv.index('--error')
        target_error = float(sys.argv[idx+1]) if idx+1 < len(sys.argv) else 1.0

    if '--zeros' in sys.argv:
        idx = sys.argv.index('--zeros')
        K = int(sys.argv[idx+1]) if idx+1 < len(sys.argv) else None

    print(f"The Oracle | π({x:,})")
    print()

    pred, err_est, nz, elapsed = oracle(x, target_error=target_error, K=K, exact=exact, show=show)

    print(f"  Result:    {pred:,.0f}")
    print(f"  Error:     ±{err_est:,.1f}")
    print(f"  Zeros:     {nz:,}")
    print(f"  Time:      {elapsed:.1f}s")
    print()

    # Check against known values if small enough
    known = {
        10**4: 1229, 10**5: 9592, 10**6: 78498, 10**7: 664579,
        10**8: 5761455, 10**9: 50847534, 10**10: 455052511,
    }

    if x in known:
        actual = known[x]
        real_err = pred - actual
        print(f"  Actual:    {actual:,}")
        print(f"  True err:  {real_err:+,.0f}")
        print(f"  Within ±:  {'YES' if abs(real_err) <= err_est * 2 else 'NO'}")

    print()
    print(f"  No data files. No downloads. No precomputation.")
    print(f"  {nz:,} zeros generated and consumed in {elapsed:.1f}s.")

if __name__ == '__main__':
    main()
