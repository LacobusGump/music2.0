# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
Compute zeros of the Dirichlet L-function L(s, chi_4)
where chi_4 is the non-principal character mod 4 (Kronecker symbol (-4|n)).

Character values: chi(0)=0, chi(1)=1, chi(2)=0, chi(3)=-1

Strategy:
  1. Use mpmath to evaluate L(1/2 + it, chi4) on a fine grid
  2. Track |L| and look for local minima (sign changes of |L|' are zeros)
  3. For each candidate, refine with mpmath.findroot
  4. Use multiprocessing for parallel computation

Output: one zero per line (imaginary part t > 0), saved to chi4_zeros.txt
"""

import mpmath
import math
import sys
import time
from multiprocessing import Pool, cpu_count

CHI4 = [0, 1, 0, -1]


def L_abs(t, dps=15):
    """Evaluate |L(1/2 + it, chi4)|."""
    mpmath.mp.dps = dps
    val = mpmath.dirichlet(0.5 + 1j * t, CHI4)
    return float(abs(val))


def L_val(t, dps=15):
    """Evaluate L(1/2 + it, chi4)."""
    mpmath.mp.dps = dps
    return mpmath.dirichlet(0.5 + 1j * t, CHI4)


def refine_zero(t_approx, dps=20):
    """Refine a zero near t_approx using mpmath.findroot."""
    mpmath.mp.dps = dps

    def f(t):
        return mpmath.dirichlet(0.5 + 1j * t, CHI4)

    try:
        t_zero = mpmath.findroot(f, t_approx)
        t_zero = float(mpmath.re(t_zero))
        # Verify
        check = float(abs(mpmath.dirichlet(0.5 + 1j * t_zero, CHI4)))
        if check < 1e-8 and t_zero > 0:
            return t_zero
    except Exception:
        pass
    return None


def scan_chunk(args):
    """
    Scan [t_start, t_end] for zeros using three detection methods:
    1. |L| local minima below threshold
    2. Sign changes in Re(L)
    3. Sign changes in Im(L) when |L| is small
    """
    t_start, t_end, step, dps = args
    mpmath.mp.dps = dps

    candidates = []

    # Evaluate on grid
    grid = []
    t = t_start
    while t <= t_end + step * 0.01:
        val = mpmath.dirichlet(0.5 + 1j * t, CHI4)
        grid.append((t, val))
        t += step

    for i in range(1, len(grid) - 1):
        t_prev, v_prev = grid[i - 1]
        t_curr, v_curr = grid[i]
        t_next, v_next = grid[i + 1]

        a_prev = float(abs(v_prev))
        a_curr = float(abs(v_curr))
        a_next = float(abs(v_next))

        # Method 1: |L| local minimum
        if a_curr < a_prev and a_curr < a_next and a_curr < 0.5:
            candidates.append(float(t_curr))

        # Method 2: Sign change in Re(L) between consecutive points
        re_prev = float(mpmath.re(v_prev))
        re_curr = float(mpmath.re(v_curr))
        if re_prev * re_curr < 0:
            # Linear interpolation for better initial guess
            frac = abs(re_prev) / (abs(re_prev) + abs(re_curr))
            t_guess = t_prev + frac * (t_curr - t_prev)
            candidates.append(t_guess)

        # Method 3: Sign change in Im(L) when values are small
        im_prev = float(mpmath.im(v_prev))
        im_curr = float(mpmath.im(v_curr))
        if im_prev * im_curr < 0 and a_curr < 1.0:
            frac = abs(im_prev) / (abs(im_prev) + abs(im_curr))
            t_guess = t_prev + frac * (t_curr - t_prev)
            candidates.append(t_guess)

    # Also check first pair
    if len(grid) >= 2:
        t0, v0 = grid[0]
        t1, v1 = grid[1]
        re0, re1 = float(mpmath.re(v0)), float(mpmath.re(v1))
        if re0 * re1 < 0:
            frac = abs(re0) / (abs(re0) + abs(re1))
            candidates.append(t0 + frac * (t1 - t0))

    # Refine each candidate
    zeros = []
    for tc in candidates:
        z = refine_zero(tc, dps=dps)
        if z is not None and t_start - step <= z <= t_end + step:
            zeros.append(z)

    return zeros


def estimate_zero_count(T):
    """
    Estimate number of zeros with 0 < t < T for L(s, chi_4).
    N(T) ~ (T/(2*pi)) * ln(q*T/(2*pi*e)) where q=4 is the conductor.
    """
    if T <= 1:
        return 0
    return (T / (2 * math.pi)) * math.log(4 * T / (2 * math.pi * math.e))


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Compute zeros of L(s, chi_4)')
    parser.add_argument('-n', '--num-zeros', type=int, default=10000,
                        help='Target number of zeros (default: 10000)')
    parser.add_argument('-o', '--output', type=str, default='chi4_zeros.txt',
                        help='Output file (default: chi4_zeros.txt)')
    parser.add_argument('--step', type=float, default=0.25,
                        help='Grid step size for scanning (default: 0.25)')
    parser.add_argument('--dps', type=int, default=15,
                        help='Decimal places precision (default: 15)')
    parser.add_argument('--workers', type=int, default=0,
                        help='Number of parallel workers (0=auto)')
    parser.add_argument('--chunk-size', type=float, default=200.0,
                        help='Size of each parallel chunk (default: 200)')
    args = parser.parse_args()

    # Estimate T needed
    T_est = args.num_zeros * 2 * math.pi / max(1, math.log(max(10, args.num_zeros)))
    for _ in range(10):
        n_est = estimate_zero_count(T_est)
        if n_est > 0:
            T_est *= args.num_zeros / n_est
    T_est *= 1.08  # 8% safety margin

    print(f"Target: {args.num_zeros} zeros")
    print(f"Estimated scan range: t in [0.5, {T_est:.0f}]")
    print(f"Estimated N({T_est:.0f}) = {estimate_zero_count(T_est):.0f}")
    print(f"Grid step: {args.step}")
    print(f"Precision: {args.dps} decimal places")
    print(f"Grid evaluations: ~{int(T_est / args.step)}")

    nworkers = args.workers if args.workers > 0 else max(1, cpu_count() - 1)
    print(f"Workers: {nworkers}")

    t_start_time = time.time()

    # Create chunks with small overlap to avoid missing zeros at boundaries
    overlap = args.step * 2
    chunks = []
    t = 0.5
    while t < T_est:
        t_end = min(t + args.chunk_size, T_est)
        chunks.append((t, t_end, args.step, args.dps))
        t = t_end - overlap  # overlap
    # Fix: avoid negative progress from overlapping chunks
    # Each chunk has a "claimed" region
    print(f"Chunks: {len(chunks)}")
    print(f"Computing...\n")

    all_zeros = []

    if nworkers == 1:
        for i, chunk in enumerate(chunks):
            zs = scan_chunk(chunk)
            all_zeros.extend(zs)
            elapsed = time.time() - t_start_time
            progress = (i + 1) / len(chunks) * 100
            rate = len(all_zeros) / max(1, elapsed) * 60
            print(f"  [{i+1}/{len(chunks)}] {progress:5.1f}% | "
                  f"chunk [{chunk[0]:.0f}, {chunk[1]:.0f}]: {len(zs)} zeros | "
                  f"total: {len(all_zeros)} | "
                  f"{elapsed:.0f}s | {rate:.0f} zeros/min")
            sys.stdout.flush()
    else:
        with Pool(nworkers) as pool:
            for i, zs in enumerate(pool.imap(scan_chunk, chunks)):
                all_zeros.extend(zs)
                elapsed = time.time() - t_start_time
                progress = (i + 1) / len(chunks) * 100
                rate = len(all_zeros) / max(1, elapsed) * 60
                print(f"  [{i+1}/{len(chunks)}] {progress:5.1f}% | "
                      f"found {len(zs)} | total: {len(all_zeros)} | "
                      f"{elapsed:.0f}s | {rate:.0f} zeros/min")
                sys.stdout.flush()

    # Sort and deduplicate
    all_zeros.sort()
    deduped = []
    for z in all_zeros:
        if not deduped or abs(z - deduped[-1]) > 1e-6:
            deduped.append(z)

    elapsed = time.time() - t_start_time
    print(f"\n{'='*60}")
    print(f"Done in {elapsed:.1f}s ({elapsed/60:.1f} min)")
    print(f"Found {len(deduped)} unique zeros")
    expected = int(estimate_zero_count(T_est))
    completeness = len(deduped) / expected * 100 if expected > 0 else 0
    print(f"Expected ~{expected}, completeness ~{completeness:.1f}%")

    # Write output
    outpath = args.output
    with open(outpath, 'w') as f:
        f.write(f"# Zeros of L(s, chi_4) on the critical line Re(s) = 1/2\n")
        f.write(f"# chi_4 = non-principal character mod 4, Kronecker symbol (-4|n)\n")
        f.write(f"# Conductor: 4, Order: 2, Parity: odd\n")
        f.write(f"# LMFDB label: 4.3\n")
        f.write(f"# Each line: imaginary part t of zero s = 1/2 + i*t (t > 0)\n")
        f.write(f"# Precision: ~{args.dps} decimal places\n")
        f.write(f"# Count: {len(deduped)}\n")
        f.write(f"# Scan range: [0.5, {T_est:.2f}], step={args.step}\n")
        f.write(f"# Computed with mpmath {mpmath.__version__}\n")
        f.write(f"# Computation time: {elapsed:.1f}s\n")
        f.write(f"#\n")
        for z in deduped:
            f.write(f"{z:.15f}\n")

    print(f"Written to {outpath}")

    # Print first 20 and last 5 zeros
    print(f"\nFirst 20 zeros:")
    for z in deduped[:20]:
        print(f"  {z:.15f}")
    if len(deduped) > 25:
        print(f"\nLast 5 zeros:")
        for z in deduped[-5:]:
            print(f"  {z:.15f}")


if __name__ == '__main__':
    main()
