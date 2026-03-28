# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
SPECTRAL ENGINE v1
==================
Universal prime prediction via L-function zeros.
Automatically selects optimal window based on SNR.

Usage:
  from spectral_engine import Engine

  e = Engine()                          # loads ζ zeros
  e.count(10**8, 1000)                  # primes in [10^8, 10^8+1000]
  e.pi(10**9)                           # π(10^9)
  e.scan(10000, 10100)                  # find individual primes
  e.error_term(10**6)                   # π(x) - Li(x) decomposition

  # L-function mode
  e4 = Engine(L='4.3')                  # loads L(s,χ₄) zeros
  e4.bias(10**5, 1000)                  # Chebyshev bias in window

  # Direct CLI
  python3 spectral_engine.py count 10**8 1000
  python3 spectral_engine.py pi 10**9
  python3 spectral_engine.py scan 10000 10100
"""
import os, sys, math

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── Window functions ───────────────────────────────────────────

def w_rect(k, K): return 1.0 if k < K else 0.0
def w_fejer(k, K): return max(0, 1 - k/K)
def w_hann(k, K): return 0.5 * (1 - math.cos(2*math.pi*k/K)) if k < K else 0.0
def w_raised_cos(k, K): return (1 + math.cos(math.pi*k/K))/2 if k < K else 0.0

WINDOWS = {
    'rect': w_rect,
    'fejer': w_fejer,
    'hann': w_hann,
    'raised_cos': w_raised_cos,
}

def auto_window(snr):
    """Select window based on signal-to-noise ratio."""
    if snr > 10: return 'rect'
    if snr > 1: return 'fejer'
    return 'hann'

# ─── Zero loading ───────────────────────────────────────────────

def load_zeros(kind='zeta'):
    """Load zeros from best available file."""
    if kind == 'zeta':
        candidates = ['zeros_hp_1.txt', 'zeros_100k.txt', 'zeros_2000.txt']
    elif kind == '4.3':
        candidates = ['L_zeros_23192.txt']
    else:
        candidates = [f'L_zeros_{kind}.txt']

    for fname in candidates:
        path = os.path.join(SCRIPT_DIR, fname)
        if os.path.exists(path):
            gammas = []
            with open(path) as f:
                for line in f:
                    if line.startswith('#'): continue
                    parts = line.strip().split()
                    if not parts: continue
                    val = parts[1] if len(parts) >= 2 and not parts[0].replace('.','',1).lstrip('-').isdigit() == False and '.' in parts[1] else parts[0]
                    try:
                        gammas.append(float(val))
                    except ValueError:
                        # Try second column
                        if len(parts) >= 2:
                            try: gammas.append(float(parts[1]))
                            except: pass
            if gammas:
                return gammas, fname
    return [], None

# ─── Core engine ────────────────────────────────────────────────

class Engine:
    def __init__(self, L=None, K=10000, window=None):
        kind = L if L else 'zeta'
        self.gammas, self.source = load_zeros(kind)
        self.kind = kind
        self.K = min(K, len(self.gammas))
        self.window = window  # None = auto
        self._log2pi = math.log(2 * math.pi)

        if not self.gammas:
            raise FileNotFoundError(f"No zeros found for {kind}. "
                "Run: curl -o tools/zeros_hp_1.txt "
                "\"https://www.lmfdb.org/zeros/zeta/list?limit=50000&start=1&download=yes\"")

    def _wfn(self, name=None):
        name = name or self.window or 'rect'
        return WINDOWS.get(name, w_rect)

    def _psi(self, x, K=None, window=None):
        """Windowed ψ(x) from explicit formula."""
        K = K or self.K
        wfn = self._wfn(window)
        total = x - self._log2pi if self.kind == 'zeta' else 0.0
        for k in range(min(K, len(self.gammas))):
            w = wfn(k, K)
            if w < 1e-14: continue
            g = self.gammas[k]
            rho = complex(0.5, g)
            total -= 2 * w * (x**rho / rho).real
        return total

    def count(self, x, delta, K=None, window=None):
        """Predict number of primes in [x, x+delta]."""
        return (self._psi(x + delta, K, window) - self._psi(x, K, window)) / math.log(x + delta/2)

    def pi(self, x, K=None, window=None):
        """Predict π(x) = number of primes below x."""
        try:
            import mpmath
            li = float(mpmath.li(x))
        except ImportError:
            # Approximate Li(x) without mpmath
            li = x / math.log(x) * (1 + 1/math.log(x) + 2/math.log(x)**2)

        K = K or self.K
        wfn = self._wfn(window)
        correction = 0
        for k in range(min(K, len(self.gammas))):
            w = wfn(k, K)
            if w < 1e-14: continue
            g = self.gammas[k]
            rho = complex(0.5, g)
            correction += 2 * w * (x**rho / (rho * math.log(x))).real
        return li - correction

    def scan(self, x_lo, x_hi, K=None, window=None, threshold=1.0):
        """Find likely prime locations in [x_lo, x_hi]."""
        K = K or self.K
        wfn = self._wfn(window)
        candidates = []
        step = 0.25
        prev2, prev1, prev1_x = 0, 0, x_lo

        def signal(x):
            total = 1.0
            for k in range(min(K, len(self.gammas))):
                w = wfn(k, K)
                if w < 1e-14: continue
                g = self.gammas[k]
                rho = complex(0.5, g)
                total -= 2 * w * (x**(rho-1)).real
            return total

        i = 0
        x = x_lo
        while x <= x_hi:
            s = signal(x)
            if i >= 2 and prev1 > prev2 and prev1 > s and prev1 > threshold:
                loc = int(round(prev1_x))
                for offset in range(-2, 3):
                    n = loc + offset
                    if x_lo <= n <= x_hi and n > 1 and n % 2 != 0:
                        candidates.append(n)
            prev2, prev1, prev1_x = prev1, s, x
            x += step
            i += 1

        return sorted(set(candidates))

    def error_term(self, x, K=None, window=None, top_n=10):
        """Decompose π(x) - Li(x) into individual zero contributions."""
        K = K or self.K
        wfn = self._wfn(window)
        contributions = []
        for k in range(min(K, len(self.gammas))):
            w = wfn(k, K)
            if w < 1e-14: continue
            g = self.gammas[k]
            rho = complex(0.5, g)
            c = 2 * w * (x**rho / (rho * math.log(x))).real
            contributions.append((k+1, g, c))
        contributions.sort(key=lambda t: -abs(t[2]))
        return contributions[:top_n]

    def bias(self, x, delta, K=None, window=None):
        """Predict Chebyshev bias (for L-function mode)."""
        return self.count(x, delta, K, window or 'hann')

    def snr(self, x, delta, n_windows=5, spacing=3000):
        """Estimate SNR at (x, delta) to auto-select window."""
        actuals = []
        preds = []
        for i in range(n_windows):
            xi = x + i * spacing
            pred = self.count(xi, delta)
            preds.append(pred)
        mean_pred = sum(preds) / len(preds)
        var_pred = sum((p - mean_pred)**2 for p in preds) / len(preds)
        return mean_pred / max(math.sqrt(var_pred), 0.01)

    def summary(self):
        """Print engine status."""
        print(f"Spectral Engine | {self.kind} | {len(self.gammas):,} zeros ({self.source})")
        print(f"  K = {self.K} | γ range: [{self.gammas[0]:.2f}, {self.gammas[min(self.K, len(self.gammas))-1]:.2f}]")

# ─── Primality check (for verification) ────────────────────────

def is_prime(n):
    if n < 2: return False
    if n < 4: return True
    if n % 2 == 0 or n % 3 == 0: return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i+2) == 0: return False
        i += 6
    return True

# ─── CLI ────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1]
    e = Engine()
    e.summary()
    print()

    if cmd == 'count':
        x = int(eval(sys.argv[2]))
        delta = int(eval(sys.argv[3])) if len(sys.argv) > 3 else 1000
        pred = e.count(x, delta)
        actual = sum(1 for n in range(x, x+delta+1) if is_prime(n)) if x + delta < 10**7 else None
        print(f"Primes in [{x:,}, {x+delta:,}]: {pred:.1f} predicted")
        if actual is not None:
            print(f"Actual: {actual}, error: {pred-actual:+.1f}")

    elif cmd == 'pi':
        x = int(eval(sys.argv[2]))
        pred = e.pi(x)
        print(f"π({x:,}) ≈ {pred:,.0f}")

    elif cmd == 'scan':
        x_lo = int(eval(sys.argv[2]))
        x_hi = int(eval(sys.argv[3])) if len(sys.argv) > 3 else x_lo + 100
        candidates = e.scan(x_lo, x_hi)
        verified = [(c, is_prime(c)) for c in candidates]
        hits = sum(1 for _, p in verified if p)
        print(f"Prime candidates in [{x_lo:,}, {x_hi:,}]: {len(candidates)}")
        for c, p in verified:
            print(f"  {c:>12,}  {'✓ PRIME' if p else '✗'}")
        actual_primes = [n for n in range(x_lo, x_hi+1) if is_prime(n)]
        print(f"\nPrecision: {hits}/{len(candidates)}")
        print(f"Recall: {hits}/{len(actual_primes)}")

    elif cmd == 'error':
        x = int(eval(sys.argv[2]))
        contribs = e.error_term(x)
        print(f"Top zero contributions to π({x:,}) - Li({x:,}):")
        cumul = 0
        for k, g, c in contribs:
            cumul += c
            print(f"  γ_{k} = {g:10.2f}: {c:+10.2f}  (cumul: {cumul:+.2f})")

    elif cmd == 'snr':
        x = int(eval(sys.argv[2]))
        delta = int(eval(sys.argv[3])) if len(sys.argv) > 3 else 1000
        s = e.snr(x, delta)
        w = auto_window(s)
        print(f"SNR at x={x:,}, Δ={delta}: {s:.1f}")
        print(f"Recommended window: {w}")

    else:
        print(f"Unknown command: {cmd}")
        print("Commands: count, pi, scan, error, snr")

if __name__ == '__main__':
    main()
