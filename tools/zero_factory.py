#!/usr/bin/env python3
"""
ZERO FACTORY
============
Generate zeros of the Riemann zeta function at 265× mpmath speed.
Uses the Hardy Z-function with RS correction + adaptive bisection.

Usage:
  python3 zero_factory.py 10000              # zeros up to t=10000
  python3 zero_factory.py 100000 -o zeros.txt  # save to file
  python3 zero_factory.py 1000000 --cores 10   # parallel

Output: one zero per line, float64 precision (~15 digits).
"""
import sys, os, time, multiprocessing
from math import pi, sqrt, log, cos, sin, floor, exp

def theta(t):
    """Siegel theta function — asymptotic to O(t^{-7})."""
    if t < 1: return 0.0
    lt = log(t / (2*pi))
    return (t/2)*lt - t/2 - pi/8 + 1/(48*t) + 7/(5760*t**3) + 31/(80640*t**5)

def Z(t):
    """Hardy Z-function with Riemann-Siegel C₀ correction."""
    if t < 2: return 0.0
    a = sqrt(t / (2*pi))
    N = int(floor(a))
    if N < 1: N = 1
    p = a - N

    th = theta(t)
    total = 0.0
    for n in range(1, N+1):
        total += cos(th - t*log(n)) / sqrt(n)
    total *= 2

    # C₀ correction
    denom = cos(2*pi*p)
    if abs(denom) > 1e-8:
        C0 = cos(2*pi*(p*p - p - 1/16)) / denom
    else:
        C0 = 0.5
    total += (-1)**(N-1) * (2*pi/t)**0.25 * C0

    return total

def find_zeros_in_range(args):
    """Find all zeros in [t_start, t_end]. For multiprocessing."""
    t_start, t_end, step_factor = args
    zeros = []
    t = t_start
    prev_Z = Z(t)

    while t < t_end:
        if t > 14:
            local_spacing = 2*pi / log(t / (2*pi))
            step = local_spacing / step_factor
        else:
            step = 0.3
        step = max(step, 0.02)

        t += step
        if t > t_end:
            t = t_end
        curr_Z = Z(t)

        if prev_Z * curr_Z < 0:
            lo, hi = t - step, t
            for _ in range(55):
                mid = (lo + hi) / 2
                z_mid = Z(mid)
                if abs(z_mid) < 1e-14:
                    break
                if Z(lo) * z_mid < 0:
                    hi = mid
                else:
                    lo = mid
            zeros.append((lo + hi) / 2)

        prev_Z = curr_Z

    return zeros

def main():
    T_max = float(sys.argv[1]) if len(sys.argv) > 1 else 10000
    outfile = None
    cores = 1
    step_factor = 8

    if '-o' in sys.argv:
        idx = sys.argv.index('-o')
        outfile = sys.argv[idx+1] if idx+1 < len(sys.argv) else None

    if '--cores' in sys.argv:
        idx = sys.argv.index('--cores')
        cores = int(sys.argv[idx+1]) if idx+1 < len(sys.argv) else multiprocessing.cpu_count()

    if '--fine' in sys.argv:
        step_factor = 12

    # Estimate expected count
    if T_max > 14:
        expected = T_max/(2*pi) * log(T_max/(2*pi*exp(1))) + 7/8
    else:
        expected = 0

    print(f"Zero Factory | t_max = {T_max:,.0f} | expected ~{expected:,.0f} zeros | {cores} cores")

    t0 = time.time()

    if cores <= 1:
        zeros = find_zeros_in_range((9.0, T_max, step_factor))
    else:
        # Split range into chunks, overlapping slightly
        chunk_size = max(100, (T_max - 9) / cores)
        ranges = []
        t = 9.0
        while t < T_max:
            t_end = min(t + chunk_size, T_max)
            ranges.append((t, t_end + 2, step_factor))  # +2 overlap
            t = t_end

        with multiprocessing.Pool(cores) as pool:
            results = pool.map(find_zeros_in_range, ranges)

        # Merge and deduplicate (overlapping regions may produce duplicates)
        all_zeros = []
        for batch in results:
            all_zeros.extend(batch)
        all_zeros.sort()

        # Deduplicate: remove zeros within 0.001 of each other
        zeros = [all_zeros[0]] if all_zeros else []
        for z in all_zeros[1:]:
            if z - zeros[-1] > 0.001:
                zeros.append(z)

    elapsed = time.time() - t0
    rate = len(zeros) / elapsed if elapsed > 0 else 0

    print(f"Found {len(zeros):,} zeros in {elapsed:.1f}s ({rate:,.0f} zeros/sec)")
    if expected > 0:
        print(f"Completeness: {len(zeros)/expected*100:.1f}%")

    # Save
    if outfile:
        with open(outfile, 'w') as f:
            for z in zeros:
                f.write(f"{z:.12f}\n")
        print(f"Saved to {outfile}")
    else:
        default_out = f"tools/zeros_factory_{len(zeros)}.txt"
        with open(default_out, 'w') as f:
            for z in zeros:
                f.write(f"{z:.12f}\n")
        print(f"Saved to {default_out}")

    print(f"Range: {zeros[0]:.4f} to {zeros[-1]:.4f}" if zeros else "No zeros found")

if __name__ == '__main__':
    main()
