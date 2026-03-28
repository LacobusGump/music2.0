# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""Parallel zero certification using Arb ball arithmetic."""
import multiprocessing
import time
import sys

def certify_batch(args):
    """Certify a batch of zeros. Each worker imports its own libs."""
    start_k, end_k = args
    from flint import arb, ctx
    import mpmath

    ctx.prec = 150
    mpmath.mp.dps = 35
    pi_arb = arb.pi()
    sin_pi8 = (pi_arb / 8).sin()

    results = []
    for k in range(start_k, end_k + 1):
        try:
            t = mpmath.im(mpmath.zetazero(k))
            N = int(mpmath.floor(mpmath.sqrt(t / (2 * mpmath.pi))))
            t_a = arb(mpmath.nstr(t, 30))
            th_a = arb(mpmath.nstr(mpmath.siegeltheta(t), 30))
            Z = arb(0)
            for n in range(1, N + 1):
                Z += 2 / arb(n).sqrt() * (th_a - t_a * arb(n).log()).cos()
            F = abs(Z) * (t_a / (2 * pi_arb)) ** arb('0.25')
            passed = (F - sin_pi8) > 0
            results.append((k, True, passed))
        except Exception as e:
            results.append((k, False, str(e)))
    return results

def main():
    target = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    cores = multiprocessing.cpu_count()

    print(f"Certifying zeros 1 to {target} across {cores} cores...")

    # Split into batches
    batch_size = target // cores
    ranges = []
    for i in range(cores):
        start = i * batch_size + 1
        end = (i + 1) * batch_size if i < cores - 1 else target
        ranges.append((start, end))

    t0 = time.time()

    with multiprocessing.Pool(cores) as pool:
        all_results = pool.map(certify_batch, ranges)

    elapsed = time.time() - t0

    # Flatten and count
    total = 0
    passed = 0
    failed_list = []
    errors = []

    for batch in all_results:
        for k, ok, result in batch:
            total += 1
            if ok and result:
                passed += 1
            elif ok and not result:
                failed_list.append(k)
            else:
                errors.append((k, result))

    rate = total / elapsed * 60 if elapsed > 0 else 0

    print(f"\n{'='*50}")
    print(f"CERTIFICATION RESULTS")
    print(f"{'='*50}")
    print(f"Total zeros tested: {total}")
    print(f"Certified (F > sin(pi/8)): {passed}")
    print(f"Failed: {len(failed_list)}")
    print(f"Errors: {len(errors)}")
    print(f"Time: {elapsed:.1f}s")
    print(f"Rate: {rate:.0f} zeros/minute")
    print(f"Cores used: {cores}")

    if failed_list:
        print(f"\nFailed zeros: {failed_list[:20]}")
    if errors:
        print(f"\nErrors: {errors[:5]}")

    # Write results to file
    with open('tools/certification_results.txt', 'w') as f:
        f.write(f"Zeros certified: {passed}/{total}\n")
        f.write(f"Failures: {len(failed_list)}\n")
        f.write(f"Errors: {len(errors)}\n")
        f.write(f"Time: {elapsed:.1f}s\n")
        f.write(f"Rate: {rate:.0f} zeros/minute\n")
        f.write(f"Cores: {cores}\n")
        if failed_list:
            f.write(f"Failed: {failed_list}\n")
        if errors:
            f.write(f"Errors: {errors}\n")

    print(f"\nResults saved to tools/certification_results.txt")

if __name__ == '__main__':
    main()
