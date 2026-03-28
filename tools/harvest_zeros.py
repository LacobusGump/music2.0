# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""Fast parallel zero harvester. Outputs γ values to file."""
import multiprocessing, time, sys, mpmath

def harvest_batch(args):
    start_k, end_k = args
    mpmath.mp.dps = 20
    results = []
    for k in range(start_k, end_k + 1):
        g = float(mpmath.im(mpmath.zetazero(k)))
        results.append(g)
    return results

def main():
    target = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    cores = multiprocessing.cpu_count()
    batch = target // cores

    ranges = []
    for i in range(cores):
        s = i * batch + 1
        e = (i + 1) * batch if i < cores - 1 else target
        ranges.append((s, e))

    print(f"Harvesting {target} zeros across {cores} cores...")
    t0 = time.time()

    with multiprocessing.Pool(cores) as pool:
        batches = pool.map(harvest_batch, ranges)

    # Flatten and sort
    all_zeros = []
    for b in batches:
        all_zeros.extend(b)
    all_zeros.sort()

    elapsed = time.time() - t0
    rate = len(all_zeros) / elapsed * 60

    outfile = f"tools/zeros_{target}.txt"
    with open(outfile, 'w') as f:
        for g in all_zeros:
            f.write(f"{g:.15g}\n")

    print(f"Done: {len(all_zeros)} zeros in {elapsed:.1f}s ({rate:.0f}/min)")
    print(f"Saved to {outfile}")
    print(f"Range: {all_zeros[0]:.4f} to {all_zeros[-1]:.4f}")

if __name__ == '__main__':
    main()
