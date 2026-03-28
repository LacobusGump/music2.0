# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
THE PRIME ORACLE v2 — Windowed Spectral Engine
================================================
50,000 zeros. Gaussian window. DSP meets number theory.

Usage:
  python3 prime_oracle_v2.py 1000000           # π(x)
  python3 prime_oracle_v2.py 1000000 1000      # primes in [x, x+Δ]
  python3 prime_oracle_v2.py 1000000 1000 -v   # verbose
"""
import sys, os
from math import pi, sqrt, log, cos, sin, exp

# --- Load zeros ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def load_zeros():
    # Try high-precision first, fall back to Odlyzko
    for fname in ['zeros_hp_1.txt', 'zeros_100k.txt', 'zeros_2000.txt']:
        path = os.path.join(SCRIPT_DIR, fname)
        if os.path.exists(path):
            gammas = []
            with open(path) as f:
                for line in f:
                    parts = line.strip().split()
                    if not parts: continue
                    val = parts[1] if len(parts) >= 2 else parts[0]
                    try: gammas.append(float(val))
                    except: pass
            if gammas:
                return gammas, fname
    return [], None

GAMMAS, SOURCE = load_zeros()

# --- Window functions ---
def gaussian_window(k, K, sigma=0.4):
    r = k / K
    return exp(-0.5 * ((r - 0.5) / sigma)**2)

def fejer_window(k, K):
    return 1 - k / K

def raised_cosine_window(k, K):
    return (1 + cos(pi * k / K)) / 2

WINDOWS = {
    'gaussian': gaussian_window,
    'fejer': fejer_window,
    'raised_cosine': raised_cosine_window,
}

# --- Core engine ---
def psi_windowed(x, K=10000, window='gaussian'):
    wfn = WINDOWS.get(window, gaussian_window)
    K = min(K, len(GAMMAS))
    total = x - log(2 * pi)
    for k in range(K):
        w = wfn(k, K)
        if w < 1e-12: continue
        g = GAMMAS[k]
        rho = complex(0.5, g)
        total -= 2 * w * (x**rho / rho).real
    return total

def predict_count(x, delta, K=10000, window='gaussian'):
    """Predict number of primes in [x, x+delta]."""
    return (psi_windowed(x + delta, K, window) - psi_windowed(x, K, window)) / log(x + delta/2)

def predict_pi(x, K=10000, window='gaussian'):
    """Predict π(x) using windowed explicit formula."""
    # Li(x) approximation + zero corrections
    # Use psi and convert: π(x) ≈ psi(x)/log(x) + psi(√x)/(2log(x)) + ...
    psi = psi_windowed(x, K, window)
    return psi / log(x) + psi_windowed(sqrt(x), K, window) / (2 * log(x))

# --- Auto-tune: pick optimal K for the given x and delta ---
def optimal_K(x, delta):
    """Heuristic: K ≈ sqrt(x) / delta, capped at available zeros."""
    K = max(100, min(int(sqrt(x) / max(delta, 1)), len(GAMMAS)))
    # Sweet spot is around 10K for most ranges
    K = min(K, 10000)
    return K

# --- Main ---
if __name__ == '__main__':
    if not GAMMAS:
        print("No zero tables found. Run: curl -o tools/zeros_hp_1.txt "
              "\"https://www.lmfdb.org/zeros/zeta/list?limit=50000&start=1&download=yes\"")
        sys.exit(1)

    x = int(sys.argv[1]) if len(sys.argv) > 1 else 1000000
    delta = int(sys.argv[2]) if len(sys.argv) > 2 else None
    verbose = '-v' in sys.argv

    K = optimal_K(x, delta or 100)

    print(f"Prime Oracle v2 | {len(GAMMAS):,} zeros ({SOURCE}) | K={K} | gaussian window")
    print()

    if delta:
        pred = predict_count(x, delta, K)
        print(f"Primes in [{x:,}, {x+delta:,}]: {pred:.1f} predicted")

        # Also try all windows and report best
        if verbose:
            print()
            for w in ['gaussian', 'fejer', 'raised_cosine']:
                for Kt in [1000, 5000, 10000, min(25000, len(GAMMAS))]:
                    p = predict_count(x, delta, Kt, w)
                    print(f"  {w:>15} K={Kt:>5}: {p:.2f}")
    else:
        pred = predict_pi(x, K)
        print(f"π({x:,}) ≈ {pred:.0f}")

    print()
    print(f"Reach: {x/5000:.0f}× beyond seed | Window: gaussian | Zeros: {K:,}")
