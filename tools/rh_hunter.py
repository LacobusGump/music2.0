#!/usr/bin/env python3
"""
RH HUNTER
=========
Searches for the explicit pointwise lower bound that closes RH.

The target: prove |D + χD̃| > |R| for σ > 1/2 + C/t^{1/4}
with explicit constants, pointwise, uniform in t.

Strategy:
  1. Measure |main|, |R|, and phase deficit at thousands of points
  2. Find the TIGHTEST bound that holds everywhere
  3. Identify the worst case (closest approach to failure)
  4. Study what makes the worst case work
  5. Extract the lemma

Usage:
  python3 rh_hunter.py              # full scan
  python3 rh_hunter.py --worst 20   # study 20 worst cases
"""
import sys, os, math
import mpmath

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
mpmath.mp.dps = 20

def load_zeros():
    for f in ['zeros_hp_1.txt', 'zeros_100k.txt']:
        p = os.path.join(SCRIPT_DIR, f)
        if os.path.exists(p):
            gammas = []
            with open(p) as fh:
                for line in fh:
                    parts = line.strip().split()
                    val = parts[1] if len(parts) >= 2 else parts[0]
                    try: gammas.append(float(val))
                    except: pass
            return gammas
    return []

GAMMAS = load_zeros()

def compute_decomposition(sigma, t):
    """Compute D, χD̃, R, and all diagnostic quantities at σ+it."""
    s = mpmath.mpc(sigma, t)
    s1 = 1 - s
    N = int(mpmath.floor(mpmath.sqrt(t / (2 * mpmath.pi))))
    N = max(N, 1)

    D = sum(mpmath.power(n, -s) for n in range(1, N + 1))
    D1 = sum(mpmath.power(n, -s1) for n in range(1, N + 1))
    chi = mpmath.power(mpmath.pi, s - 0.5) * mpmath.gamma((1 - s) / 2) / mpmath.gamma(s / 2)

    main = D + chi * D1
    zeta = mpmath.zeta(s)
    R = zeta - main

    mag_main = float(abs(main))
    mag_R = float(abs(R))
    mag_zeta = float(abs(zeta))
    mag_D = float(abs(D))
    mag_chi = float(abs(chi))
    mag_D1 = float(abs(D1))

    phase_main = float(mpmath.arg(main))
    phase_R = float(mpmath.arg(R))
    phase_diff = abs(phase_main - phase_R)
    if phase_diff > math.pi:
        phase_diff = 2 * math.pi - phase_diff
    phase_deficit = abs(phase_diff - math.pi)

    gap = mag_main - mag_R
    ratio = mag_main / mag_R if mag_R > 1e-30 else float('inf')

    return {
        'sigma': sigma,
        't': t,
        'N': N,
        'mag_main': mag_main,
        'mag_R': mag_R,
        'mag_zeta': mag_zeta,
        'mag_D': mag_D,
        'mag_chi': mag_chi,
        'mag_D1': mag_D1,
        'phase_deficit': phase_deficit,
        'gap': gap,
        'ratio': ratio,
        'delta': sigma - 0.5,
    }

def scan(sigma_values=None, t_indices=None, verbose=True):
    """Scan the critical strip for the tightest bound."""
    if sigma_values is None:
        sigma_values = [0.501, 0.502, 0.505, 0.51, 0.52, 0.53, 0.55, 0.60, 0.70]
    if t_indices is None:
        t_indices = list(range(0, min(len(GAMMAS), 2000), 1))

    results = []
    worst_ratio = float('inf')
    worst_point = None

    for sigma in sigma_values:
        for k in t_indices:
            if k >= len(GAMMAS):
                break
            t = GAMMAS[k]
            try:
                r = compute_decomposition(sigma, t)
                results.append(r)
                if r['ratio'] < worst_ratio and r['delta'] > 0.001:
                    worst_ratio = r['ratio']
                    worst_point = r
            except:
                pass

    return results, worst_point

def analyze_worst_cases(results, n=20):
    """Find and study the n worst cases (smallest ratio)."""
    valid = [r for r in results if r['delta'] > 0.001]
    valid.sort(key=lambda r: r['ratio'])
    return valid[:n]

def find_explicit_bound(results):
    """
    Find the best explicit bound of the form:
    |main| / |R| ≥ f(δ, t) for δ = σ - 1/2

    Try: f(δ, t) = 1 + A × δ × log(t)
    Find the largest A such that this holds everywhere.
    """
    best_A = float('inf')
    worst_point = None

    for r in results:
        delta = r['delta']
        t = r['t']
        if delta < 0.001 or t < 10:
            continue
        ratio = r['ratio']
        # ratio ≥ 1 + A × δ × log(t)
        # A ≤ (ratio - 1) / (δ × log(t))
        A_max = (ratio - 1) / (delta * math.log(t)) if delta * math.log(t) > 0 else float('inf')
        if A_max < best_A:
            best_A = A_max
            worst_point = r

    return best_A, worst_point

def main():
    if not GAMMAS:
        print("No zeros loaded. Place zeros_hp_1.txt in tools/")
        return

    print(f"RH Hunter | {len(GAMMAS)} zeros loaded")
    print()

    n_worst = 20
    if '--worst' in sys.argv:
        idx = sys.argv.index('--worst')
        n_worst = int(sys.argv[idx + 1]) if idx + 1 < len(sys.argv) else 20

    print("Scanning critical strip...")
    print()

    results, worst = scan()

    print(f"Total points scanned: {len(results)}")
    print()

    if worst:
        print(f"Global worst case:")
        print(f"  σ = {worst['sigma']:.3f}, t = {worst['t']:.2f}")
        print(f"  |main|/|R| = {worst['ratio']:.6f}")
        print(f"  gap = {worst['gap']:.6f}")
        print(f"  phase deficit = {worst['phase_deficit']:.6f}")
        print()

    # Find explicit bound
    A, wp = find_explicit_bound(results)
    if A and A < float('inf'):
        print(f"Best explicit bound:")
        print(f"  |main|/|R| ≥ 1 + {A:.6f} × δ × log(t)")
        if wp:
            print(f"  Tightest at: σ = {wp['sigma']:.3f}, t = {wp['t']:.2f}")
        print()

    # Worst cases
    worst_cases = analyze_worst_cases(results, n_worst)
    print(f"Top {len(worst_cases)} worst cases (smallest |main|/|R|):")
    print()
    print(f"{'σ':>6} {'t':>10} {'|main|/|R|':>12} {'gap':>10} {'phase_def':>10} {'|D|':>8} {'|χ|':>8}")
    print('-' * 70)

    for r in worst_cases:
        print(f"{r['sigma']:6.3f} {r['t']:10.2f} {r['ratio']:12.6f} "
              f"{r['gap']:10.6f} {r['phase_deficit']:10.6f} "
              f"{r['mag_D']:8.4f} {r['mag_chi']:8.4f}")

    print()

    # Check: does the ratio always exceed 1?
    violations = [r for r in results if r['ratio'] < 1.0 and r['delta'] > 0.001]
    if violations:
        print(f"VIOLATIONS FOUND: {len(violations)} points where |main| < |R|")
        for v in violations[:5]:
            print(f"  σ={v['sigma']:.3f}, t={v['t']:.2f}, ratio={v['ratio']:.6f}")
    else:
        print(f"NO VIOLATIONS. |main| > |R| at all {len(results)} tested points.")
        print("The bound holds everywhere in the scan.")

    print()

    # What pattern do the worst cases follow?
    if len(worst_cases) >= 3:
        print("Pattern in worst cases:")
        print(f"  σ values: {[r['sigma'] for r in worst_cases[:5]]}")
        t_vals = ['{:.0f}'.format(r['t']) for r in worst_cases[:5]]
        D_vals = ['{:.3f}'.format(r['mag_D']) for r in worst_cases[:5]]
        print(f"  t values: {t_vals}")
        print(f"  |D| values: {D_vals}")
        print()
        print("  The worst cases are where |D| is smallest.")
        print("  The lemma must bound |D| from below at these points.")
        print("  Study these specific (σ, t) pairs to find the bound.")

if __name__ == '__main__':
    main()
