#!/usr/bin/env python3
"""Compute zeros of L(s, χ₄) by sign changes of Re[L(1/2+it)]."""
import multiprocessing, time, sys
from math import log, cos, sin, sqrt

def chi4(n):
    r = n % 4
    if r == 1: return 1
    if r == 3: return -1
    return 0

def L_real(t, N=8000):
    """Re[L(1/2+it, χ₄)] computed from Dirichlet series."""
    total = 0.0
    for n in range(1, N + 1):
        c = chi4(n)
        if c == 0: continue
        total += c * n**(-0.5) * cos(-t * log(n))
    return total

def find_zeros_batch(args):
    t_start, t_end, resolution, N = args
    zeros = []
    prev = L_real(t_start, N)
    t = t_start + resolution
    while t <= t_end:
        val = L_real(t, N)
        if prev * val < 0:
            # Bisect
            lo, hi = t - resolution, t
            for _ in range(50):
                mid = (lo + hi) / 2
                if L_real(lo, N) * L_real(mid, N) < 0:
                    hi = mid
                else:
                    lo = mid
            zeros.append((lo + hi) / 2)
        prev = val
        t += resolution
    return zeros

def main():
    gamma_max = float(sys.argv[1]) if len(sys.argv) > 1 else 5000
    cores = multiprocessing.cpu_count()
    resolution = 0.02
    N_terms = 8000

    chunk = (gamma_max - 0.1) / cores
    ranges = [(0.1 + i*chunk, 0.1 + (i+1)*chunk, resolution, N_terms) for i in range(cores)]

    print(f"Computing L(s,χ₄) zeros up to γ={gamma_max} across {cores} cores...")
    t0 = time.time()

    with multiprocessing.Pool(cores) as pool:
        batches = pool.map(find_zeros_batch, ranges)

    all_zeros = sorted(z for batch in batches for z in batch)
    elapsed = time.time() - t0

    outfile = f"tools/L_zeros_{len(all_zeros)}.txt"
    with open(outfile, 'w') as f:
        for g in all_zeros:
            f.write(f"{g:.12f}\n")

    print(f"Found {len(all_zeros)} zeros in {elapsed:.1f}s")
    print(f"Saved to {outfile}")
    print(f"Range: {all_zeros[0]:.4f} to {all_zeros[-1]:.4f}")

if __name__ == '__main__':
    main()
