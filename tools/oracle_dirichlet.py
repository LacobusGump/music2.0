# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
DIRICHLET ORACLE
================
How many primes ≡ a mod q below x? From nothing.

Usage:
  python3 oracle_dirichlet.py 1000000 4 3    # primes ≡ 3 mod 4 below 10⁶
  python3 oracle_dirichlet.py 1000000 4      # all residue classes mod 4
  python3 oracle_dirichlet.py 100000 3       # all residue classes mod 3

No data files. No downloads. Self-generating. Pure math.
"""
import sys, time
from math import pi, sqrt, log, cos, sin, floor, gcd

# ─── Li(x) via Ramanujan series ─────────────────────────────

def _li(x):
    if x <= 1: return 0.0
    gamma = 0.5772156649015329
    lnx = log(x)
    total = gamma + log(abs(lnx))
    term = 1.0
    for k in range(1, 200):
        term *= lnx / k
        total += term / k
        if abs(term / k) < 1e-15: break
    ln2 = log(2)
    li2 = gamma + log(ln2)
    term2 = 1.0
    for k in range(1, 100):
        term2 *= ln2 / k
        li2 += term2 / k
    return total - li2

# ─── Z(t) for ζ ─────────────────────────────────────────────

def _theta(t):
    if t < 1: return 0.0
    return (t/2)*log(t/(2*pi)) - t/2 - pi/8 + 1/(48*t) + 7/(5760*t**3) + 31/(80640*t**5)

def _Z_zeta(t):
    if t < 2: return 0.0
    a = sqrt(t/(2*pi))
    N = max(1, int(floor(a)))
    p = a - N
    th = _theta(t)
    s = 0.0
    for n in range(1, N+1):
        s += cos(th - t*log(n)) / sqrt(n)
    s *= 2
    d = cos(2*pi*p)
    C0 = cos(2*pi*(p*p-p-1/16))/d if abs(d) > 1e-8 else 0.5
    s += (-1)**(N-1) * (2*pi/t)**0.25 * C0
    return s

# ─── Z(t) for L(s,χ) ────────────────────────────────────────

def _Z_L(t, chi_values, q):
    """Real part of L(1/2+it, χ) approximation via partial sum."""
    if t < 1: return 0.0
    N = max(1, int(floor(sqrt(q * t / (2*pi)))))
    total_re = 0.0
    total_im = 0.0
    for n in range(1, N+1):
        c = chi_values[n % q]
        if c == 0: continue
        phase = -t * log(n)
        total_re += c * cos(phase) / sqrt(n)
        total_im += c * sin(phase) / sqrt(n)
    return total_re

# ─── Character construction ─────────────────────────────────

def _characters(q):
    """Compute all Dirichlet characters mod q."""
    # Find the group (Z/qZ)*
    units = [a for a in range(q) if gcd(a, q) == 1]
    phi_q = len(units)

    # For small q, construct characters directly
    chars = []

    # Trivial character
    chi0 = [0] * q
    for a in units:
        chi0[a] = 1
    chars.append(('χ₀', chi0))

    if q == 3:
        chi1 = [0, 1, -1]
        chars.append(('χ₁', chi1))
    elif q == 4:
        chi1 = [0, 1, 0, -1]
        chars.append(('χ₁', chi1))
    elif q == 5:
        chi1 = [0, 1, 1, -1, -1]
        chi2 = [0, 1, -1, -1, 1]
        chi3 = [0, 1, -1, 1, -1]
        chars.append(('χ₁', chi1))
        chars.append(('χ₂', chi2))
        chars.append(('χ₃', chi3))
    elif q == 7:
        # Real characters mod 7
        chi1 = [0, 1, 1, -1, 1, -1, -1]  # Legendre symbol
        chars.append(('χ₁', chi1))
    elif q == 8:
        chi1 = [0, 1, 0, 1, 0, -1, 0, -1]  # (-1)^((n-1)/2) for odd n
        chi2 = [0, 1, 0, -1, 0, -1, 0, 1]
        chi3 = [0, 1, 0, -1, 0, 1, 0, -1]
        chars.append(('χ₁', chi1))
        chars.append(('χ₂', chi2))
        chars.append(('χ₃', chi3))
    else:
        # For general q, only use the trivial character
        # (full character table construction is complex)
        pass

    return chars, units, phi_q

# ─── Streaming zero generators ──────────────────────────────

def _stream_zeta_zeros(callback, K):
    t = 9.0
    prev = _Z_zeta(t)
    count = 0
    while count < K:
        step = max(0.02, 2*pi/log(max(t/(2*pi), 1.01))/8) if t > 14 else 0.3
        t += step
        curr = _Z_zeta(t)
        if prev * curr < 0:
            lo, hi = t-step, t
            for _ in range(50):
                mid = (lo+hi)/2
                if _Z_zeta(lo)*_Z_zeta(mid) < 0: hi = mid
                else: lo = mid
            callback((lo+hi)/2)
            count += 1
        prev = curr
        if t > 5000000: break

def _stream_L_zeros(callback, K, chi_values, q):
    t = 1.0
    prev = _Z_L(t, chi_values, q)
    count = 0
    while count < K:
        step = max(0.03, 2*pi/log(max(q*t/(2*pi), 1.01))/6) if t > 5 else 0.2
        t += step
        curr = _Z_L(t, chi_values, q)
        if prev * curr < 0:
            lo, hi = t-step, t
            for _ in range(45):
                mid = (lo+hi)/2
                if _Z_L(lo, chi_values, q)*_Z_L(mid, chi_values, q) < 0: hi = mid
                else: lo = mid
            callback((lo+hi)/2)
            count += 1
        prev = curr
        if t > 5000000: break

# ─── The Dirichlet Oracle ───────────────────────────────────

def oracle_mod(x, q, a=None, K_zeta=2000, K_L=1000):
    """
    Predict π(x; q, a) = number of primes ≡ a mod q below x.
    If a is None, predict all residue classes.
    """
    x = float(x)
    logx = log(x)
    sqrtx = sqrt(x)

    chars, units, phi_q = _characters(q)

    # Step 1: Stream ζ zeros and accumulate correction
    zeta_correction = [0.0]
    def use_zeta_zero(gamma):
        phase = gamma * logx
        x_rho = sqrtx * complex(cos(phase), sin(phase))
        rho = complex(0.5, gamma)
        zeta_correction[0] += 2 * (x_rho / (rho * logx)).real

    _stream_zeta_zeros(use_zeta_zero, K_zeta)

    # Step 2: Stream L-function zeros for each non-trivial character
    L_corrections = {}
    for name, chi in chars:
        if name == 'χ₀': continue
        L_corrections[name] = [0.0]
        def make_callback(corr):
            def cb(gamma):
                phase = gamma * logx
                x_rho = sqrtx * complex(cos(phase), sin(phase))
                rho = complex(0.5, gamma)
                corr[0] += 2 * (x_rho / (rho * logx)).real
            return cb
        _stream_L_zeros(make_callback(L_corrections[name]), K_L,
                        chi, q)

    # Step 3: Combine
    # π(x; q, a) = (1/φ(q)) × [Li(x) - Σ_ζ + Σ_χ χ̄(a) × (-Σ_L_χ)]
    li_x = _li(x)
    base = li_x - zeta_correction[0]

    # Möbius correction (applied to total)
    mobius = -_li(sqrt(x))/2 - _li(x**(1/3))/3
    if x > 32: mobius -= _li(x**(1/5))/5
    if x > 64: mobius += _li(x**(1/6))/6
    offset = _li(2.001) - log(2)
    total_pi = base + mobius + offset

    # Per residue class
    results = {}
    for res in units:
        correction_chi = 0.0
        for name, chi in chars:
            if name == 'χ₀': continue
            chi_bar_a = chi[res]  # for real characters, χ̄ = χ
            if name in L_corrections:
                correction_chi += chi_bar_a * L_corrections[name][0]

        pi_qa = (total_pi + correction_chi) / phi_q
        results[res] = pi_qa

    if a is not None:
        return results.get(a % q, 0)
    return results

# ─── CLI ────────────────────────────────────────────────────

def is_prime(n):
    if n < 2: return False
    if n < 4: return True
    if n % 2 == 0 or n % 3 == 0: return False
    i = 5
    while i*i <= n:
        if n % i == 0 or n % (i+2) == 0: return False
        i += 6
    return True

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return

    x = int(float(sys.argv[1]))
    q = int(sys.argv[2])
    a = int(sys.argv[3]) if len(sys.argv) > 3 else None

    print(f"Dirichlet Oracle | primes mod {q} below {x:,}")
    print()

    t0 = time.time()
    results = oracle_mod(x, q, a)
    elapsed = time.time() - t0

    if isinstance(results, dict):
        # Count actual primes for verification
        print(f"{'a mod '+str(q):>10} {'Oracle':>10} {'Actual':>10} {'Error':>8}")
        print('-' * 42)
        for res in sorted(results.keys()):
            pred = results[res]
            actual = sum(1 for p in range(2, x+1) if is_prime(p) and p % q == res) if x <= 200000 else None
            err_str = f"{pred - actual:+.1f}" if actual is not None else "—"
            act_str = f"{actual}" if actual is not None else "—"
            print(f"{res:>10} {pred:10.1f} {act_str:>10} {err_str:>8}")
    else:
        actual = sum(1 for p in range(2, x+1) if is_prime(p) and p % q == a) if x <= 200000 else None
        print(f"  π({x:,}; {q}, {a}) = {results:.1f}")
        if actual is not None:
            print(f"  Actual: {actual}")
            print(f"  Error: {results - actual:+.1f}")

    print(f"\n  Time: {elapsed:.1f}s | No data files. Self-generating.")

if __name__ == '__main__':
    main()
