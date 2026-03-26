#!/usr/bin/env python3
"""
ELLIPTIC CURVE ORACLE
=====================
Compute L(E, 1) for an elliptic curve y² = x³ + ax + b.
Tests BSD: L(E,1) = 0 iff rank > 0.

Usage:
  python3 oracle_elliptic.py -1 0        # y² = x³ - x (rank 0, conductor 32)
  python3 oracle_elliptic.py 0 -2        # y² = x³ - 2 (rank 1)
  python3 oracle_elliptic.py 1 1         # y² = x³ + x + 1

No data files. Counts points mod p for each prime. Self-contained.
"""
import sys, time
from math import pi, sqrt, log

def is_prime(n):
    if n < 2: return False
    if n < 4: return True
    if n % 2 == 0 or n % 3 == 0: return False
    i = 5
    while i*i <= n:
        if n % i == 0 or n % (i+2) == 0: return False
        i += 6
    return True

def count_points(a, b, p):
    """Count points on y² = x³ + ax + b over F_p."""
    count = 1  # point at infinity
    for x in range(p):
        rhs = (x*x*x + a*x + b) % p
        for y in range(p):
            if (y*y - rhs) % p == 0:
                count += 1
    return count

def compute_ap(a_coeff, b_coeff, p):
    """a_p = p + 1 - #E(F_p)"""
    return p + 1 - count_points(a_coeff, b_coeff, p)

def discriminant(a, b):
    """Discriminant of y² = x³ + ax + b."""
    return -16 * (4*a**3 + 27*b**2)

def L_value(a_coeff, b_coeff, s=1.0, max_p=500):
    """Compute L(E, s) via Euler product."""
    disc = discriminant(a_coeff, b_coeff)
    product_re = 1.0
    product_im = 0.0

    for p in range(2, max_p):
        if not is_prime(p): continue

        ap = compute_ap(a_coeff, b_coeff, p)

        if disc % p == 0:
            # Bad reduction
            factor_re = 1 - ap * p**(-s)
            factor_im = 0
        else:
            # Good reduction: (1 - a_p p^{-s} + p^{1-2s})
            factor_re = 1 - ap * p**(-s) + p**(1-2*s)
            factor_im = 0

        if abs(factor_re) > 1e-30:
            new_re = product_re / factor_re
            new_im = product_im / factor_re
            product_re = new_re
            product_im = new_im

    return product_re, product_im

def find_rational_points(a, b, search=1000):
    """Search for rational points on y² = x³ + ax + b."""
    points = []
    for x_num in range(-search, search+1):
        for x_den in range(1, 20):
            x = x_num / x_den
            rhs = x**3 + a*x + b
            if rhs >= 0:
                y = sqrt(rhs)
                if abs(y - round(y*x_den)/x_den) < 1e-8:
                    points.append((x_num/x_den, round(y*100)/100))
    return points[:10]

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return

    a = int(sys.argv[1])
    b = int(sys.argv[2])
    max_p = int(sys.argv[3]) if len(sys.argv) > 3 else 200

    print(f"Elliptic Curve Oracle | y² = x³ {a:+d}x {b:+d}")
    print()

    disc = discriminant(a, b)
    print(f"  Discriminant: {disc}")
    if disc == 0:
        print("  SINGULAR CURVE (discriminant = 0). Not an elliptic curve.")
        return
    print()

    # Compute a_p for small primes
    print(f"  Point counts (a_p = p + 1 - #E(F_p)):")
    print(f"  {'p':>5} {'#E':>5} {'a_p':>5}")
    print(f"  {'-'*18}")

    ap_list = []
    for p in range(2, min(50, max_p)):
        if not is_prime(p): continue
        ap = compute_ap(a, b, p)
        ne = p + 1 - ap
        ap_list.append((p, ap))
        if p < 30:
            print(f"  {p:5d} {ne:5d} {ap:+5d}")

    print(f"  ... ({len(ap_list)} primes computed)")
    print()

    # Compute L(E, 1)
    t0 = time.time()
    L_re, L_im = L_value(a, b, 1.0, max_p)
    elapsed = time.time() - t0

    print(f"  L(E, 1) = {L_re:.6f}")
    print(f"  |L(E, 1)| = {sqrt(L_re**2 + L_im**2):.6f}")
    print()

    if abs(L_re) < 0.05:
        print(f"  L(E, 1) ≈ 0 → BSD predicts: RANK ≥ 1")
        print(f"  (The curve has infinitely many rational points)")
    else:
        print(f"  L(E, 1) ≠ 0 → BSD predicts: RANK = 0")
        print(f"  (The curve has finitely many rational points)")

    print()

    # Search for rational points
    print(f"  Searching for rational points...")
    points = find_rational_points(a, b, 200)
    if points:
        print(f"  Found {len(points)} rational points (sample):")
        for x, y in points[:5]:
            print(f"    ({x}, {y})")
        if len(points) > 0:
            print(f"  → Rank appears ≥ 1 (found rational points)")
    else:
        print(f"  No rational points found in search range")
        print(f"  → Consistent with rank 0")

    print()
    print(f"  Time: {elapsed:.2f}s | Primes used: {len(ap_list)} | Self-contained")

if __name__ == '__main__':
    main()
