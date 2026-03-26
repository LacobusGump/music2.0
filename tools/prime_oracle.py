#!/usr/bin/env python3
"""
THE PRIME ORACLE
================
Give it a number. It tells you the primes nearby.
Not by checking divisibility. By LISTENING to the zeros.

How it works:
  1. Starts with small primes (up to 5,000)
  2. Finds the hidden frequencies (zeros of ζ)
  3. Uses those frequencies to predict where primes are

Usage:
  python3 prime_oracle.py 1000000
  python3 prime_oracle.py 1000000 50   (window size, default 100)
"""
import sys
from math import pi, sqrt, log, cos, sin, exp

def is_prime(n):
    if n < 2: return False
    if n < 4: return True
    if n % 2 == 0 or n % 3 == 0: return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0: return False
        i += 6
    return True

# --- PHASE 1: Build the seed ---
print("🌱 Loading seed primes (up to 5,000)...")
SEED_PRIMES = [p for p in range(2, 5001) if is_prime(p)]
print(f"   {len(SEED_PRIMES)} primes loaded.")

# --- PHASE 2: Find the frequencies (zeros) ---
print("🔊 Listening for frequencies...")

def find_zeros(prime_list, X=2000, gamma_max=200):
    zeros = []
    prev2, prev1 = 0, 0
    for i in range(int((gamma_max - 10) / 0.02)):
        t = 10.0 + i * 0.02
        s = sum(
            log(p) / sqrt(p) * exp(-p / X) * cos(t * log(p))
            for p in prime_list if p <= 5 * X
        )
        if i >= 2 and prev1 < prev2 and prev1 < s and prev1 < -2:
            zeros.append(10.0 + (i - 1) * 0.02)
        prev2, prev1 = prev1, s
    return zeros

GAMMAS = find_zeros(SEED_PRIMES)
print(f"   {len(GAMMAS)} frequencies found.")
print()

# --- PHASE 3: The prediction engine ---
def prime_signal(x):
    """How 'prime-like' is x? Higher = more likely prime."""
    total = 1.0
    for gamma in GAMMAS:
        rho = complex(0.5, gamma)
        term = x ** (rho - 1)
        total -= 2 * term.real
    return total

def predict_count(x, delta):
    """Predict number of primes in [x, x+delta]."""
    def psi_wave(xv):
        total = xv - log(2 * pi)
        for g in GAMMAS:
            rho = complex(0.5, g)
            total -= 2 * (xv ** rho / rho).real
        return total
    return (psi_wave(x + delta) - psi_wave(x)) / log(x + delta / 2)

def find_primes_in_window(x, delta, resolution=0.25):
    """Find likely prime locations in [x, x+delta]."""
    candidates = []
    prev2_s, prev1_s = 0, 0
    prev1_x = x

    for i in range(int(delta / resolution) + 1):
        xi = x + i * resolution
        s = prime_signal(xi)

        if i >= 2 and prev1_s > prev2_s and prev1_s > s and prev1_s > 1.0:
            # Peak — likely prime nearby
            loc = int(round(prev1_x))
            # Check odd numbers near the peak
            for offset in range(-2, 3):
                n = loc + offset
                if n >= x and n <= x + delta and n > 1 and n % 2 != 0:
                    candidates.append(n)

        prev2_s = prev1_s
        prev1_s = s
        prev1_x = xi

    # Deduplicate and sort
    return sorted(set(candidates))

# --- MAIN ---
if __name__ == '__main__':
    target = int(sys.argv[1]) if len(sys.argv) > 1 else 100000
    window = int(sys.argv[2]) if len(sys.argv) > 2 else 100

    x = target
    delta = window

    print(f"🎯 Target: primes in [{x:,}, {x + delta:,}]")
    print(f"   (using {len(GAMMAS)} frequencies from {len(SEED_PRIMES)} seed primes)")
    print()

    # Prediction
    pred_count = predict_count(x, delta)
    print(f"📊 Predicted count: {pred_count:.1f} primes")

    # Find candidates
    candidates = find_primes_in_window(x, delta)

    # Verify against truth
    actual_primes = [n for n in range(x, x + delta + 1) if is_prime(n)]
    actual_count = len(actual_primes)

    print(f"✅ Actual count:    {actual_count} primes")
    print(f"   Count error:     {pred_count - actual_count:+.1f}")
    print()

    # Check candidate accuracy
    if candidates:
        hits = sum(1 for c in candidates if is_prime(c))
        print(f"🔍 Prime candidates found: {len(candidates)}")
        print(f"   Actually prime:         {hits} ({100*hits//len(candidates)}% precision)")
        print(f"   Primes detected:        {hits}/{actual_count} ({100*hits//max(actual_count,1)}% recall)")
        print()

        # Show them
        print("   Candidates:")
        for c in candidates[:30]:
            tag = "✓ PRIME" if is_prime(c) else "✗"
            print(f"      {c:>10,}  {tag}")
        if len(candidates) > 30:
            print(f"      ... and {len(candidates) - 30} more")
    print()

    # The reach
    reach = x / 5000
    print(f"🚀 Reach: {reach:.0f}× beyond seed range")
    print(f"   669 primes → {len(GAMMAS)} frequencies → predictions at {x:,}")
