# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
THE PROJECTOR
=============
The explicit formula as a projection operator.
Feed it ANY sequence. It projects toward primes.

Forward:  sequence → spectral zeros (compression)
Backward: zeros → predicted sequence (expansion)
Iterate:  converges toward prime-like structure

Usage:
  python3 projector.py                        # demo with primes
  python3 projector.py --input squares        # project squares
  python3 projector.py --input random         # project random
  python3 projector.py --input fibonacci      # project fibonacci
  python3 projector.py --input custom 4,9,16,25,36  # custom sequence
  python3 projector.py --rounds 5             # iterate 5 times

  from projector import Projector
  p = Projector([2,3,5,7,11,13,17,19,23])
  p.iterate(3)
  p.report()
"""
import sys, os, math, random

class Projector:
    def __init__(self, values, name='input'):
        self.original = sorted(v for v in values if v > 1)
        self.name = name
        self.history = [{'label': f'Round 0 ({name})', 'values': self.original,
                         'variance': self._var(self.original), 'n': len(self.original)}]
        self.current = self.original

    def _var(self, values):
        if len(values) < 5: return None
        spacings = [values[i+1]-values[i] for i in range(len(values)-1)]
        mean = sum(spacings) / len(spacings) if spacings else 1
        if mean <= 0: return 0
        spacings = [s/mean for s in spacings]
        m = sum(spacings) / len(spacings)
        return sum((s-m)**2 for s in spacings) / len(spacings)

    def _classify(self, var):
        if var is None: return '???'
        if var < 0.01: return 'PERIODIC'
        if var < 0.25: return 'SUPER-GUE'
        if var < 0.40: return 'GUE'
        if var < 0.65: return 'INTERMEDIATE'
        if var < 1.2: return 'POISSON'
        return 'CLUSTERED'

    def forward(self, values=None, X=None, gamma_max=150):
        """Sequence → spectral zeros (compression toward GUE)."""
        if values is None: values = self.current
        if X is None: X = max(200, len(values) * 2)

        weights, log_vals, raw_vals = [], [], []
        for v in values:
            if v > 1:
                weights.append(math.log(v) / math.sqrt(v))
                log_vals.append(math.log(v))
                raw_vals.append(v)

        if not weights: return []

        zeros = []
        prev2, prev1 = 0, 0
        steps = int((gamma_max - 2) / 0.04)
        for i in range(steps):
            t = 2 + i * 0.04
            s = sum(w * math.exp(-v/X) * math.cos(t * lv)
                    for w, v, lv in zip(weights, raw_vals, log_vals) if v <= 5*X)
            if i >= 2 and prev1 < prev2 and prev1 < s and prev1 < -0.3:
                zeros.append(2 + (i-1) * 0.04)
            prev2, prev1 = prev1, s

        return zeros

    def backward(self, zeros=None, x_max=None):
        """Spectral zeros → predicted sequence (expansion)."""
        if zeros is None: zeros = self.current_zeros
        if x_max is None: x_max = max(self.original) * 1.5 if self.original else 5000
        K = min(80, len(zeros))
        if K < 3: return []

        peaks = []
        prev2, prev1 = 0, 0
        step = 0.5
        n_steps = int(x_max * 2)
        for i in range(n_steps):
            x = 5 + i * step
            sig = 1.0
            for g in zeros[:K]:
                rho = complex(0.5, g)
                try:
                    sig -= 2 * (x**(rho-1)).real
                except: pass
            if i >= 2 and prev1 > prev2 and prev1 > sig and prev1 > 0.8:
                val = int(round(5 + (i-1) * step))
                if val > 1:
                    peaks.append(val)
            prev2, prev1 = prev1, sig

        return sorted(set(peaks))

    def step(self):
        """One forward+backward iteration."""
        # Forward
        zeros = self.forward()
        var_z = self._var(zeros)
        self.current_zeros = zeros
        self.history.append({
            'label': f'Round {len(self.history)//2 + 1}a (zeros)',
            'values': zeros, 'variance': var_z, 'n': len(zeros)
        })

        if len(zeros) < 3:
            return False

        # Backward
        predicted = self.backward(zeros)
        var_p = self._var(predicted)
        self.current = predicted
        self.history.append({
            'label': f'Round {len(self.history)//2 + 1}b (predicted)',
            'values': predicted, 'variance': var_p, 'n': len(predicted)
        })

        return len(predicted) >= 5

    def iterate(self, rounds=3):
        """Run multiple forward+backward iterations."""
        for r in range(rounds):
            ok = self.step()
            if not ok:
                print(f"  Stopped at round {r+1} (too few values)")
                break

    def compare_to_primes(self):
        """How prime-like is the current sequence?"""
        def is_prime(n):
            if n < 2: return False
            if n < 4: return True
            if n % 2 == 0 or n % 3 == 0: return False
            i = 5
            while i*i <= n:
                if n % i == 0 or n % (i+2) == 0: return False
                i += 6
            return True

        if not self.current: return 0, 0, 0
        actual_primes = [v for v in self.current if is_prime(v)]
        precision = len(actual_primes) / len(self.current) if self.current else 0

        max_val = max(self.current) if self.current else 100
        all_primes = [p for p in range(2, max_val+1) if is_prime(p)]
        found = sum(1 for p in all_primes if any(abs(p-v) <= 1 for v in self.current))
        recall = found / len(all_primes) if all_primes else 0

        return precision, recall, len(actual_primes)

    def report(self):
        """Full projection report."""
        print(f"The Projector — Explicit Formula Iteration")
        print(f"  Input: {self.name} ({len(self.original)} values)")
        print()

        print(f"  {'Step':<30} {'N':>6} {'Variance':>10} {'Class':>15}")
        print(f"  {'-'*65}")

        for h in self.history:
            var = h['variance']
            var_str = f"{var:.4f}" if var is not None else "N/A"
            cls = self._classify(var)
            bar = '█' * int(var * 15) if var and var < 5 else '█' * 15
            print(f"  {h['label']:<30} {h['n']:>6} {var_str:>10} {cls:>15} {bar}")

        print()

        # Compare final to primes
        prec, rec, n_primes = self.compare_to_primes()
        print(f"  Final sequence vs actual primes:")
        print(f"    Precision: {prec:.1%} of predicted values are prime")
        print(f"    Recall:    {rec:.1%} of actual primes found")
        print(f"    Primes in output: {n_primes}")
        print()

        # Variance trajectory
        vars_only = [h['variance'] for h in self.history if h['variance'] is not None]
        if len(vars_only) >= 2:
            print(f"  Variance trajectory: {' → '.join(f'{v:.3f}' for v in vars_only)}")
            if vars_only[-1] is not None and vars_only[0] is not None:
                if vars_only[-1] < vars_only[0]:
                    print(f"  Direction: COMPRESSING toward rigidity")
                else:
                    print(f"  Direction: EXPANDING toward randomness")


def generate_input(kind, custom=None):
    """Generate various input sequences."""
    def is_prime(n):
        if n < 2: return False
        if n < 4: return True
        if n % 2 == 0 or n % 3 == 0: return False
        i = 5
        while i*i <= n:
            if n % i == 0 or n % (i+2) == 0: return False
            i += 6
        return True

    if kind == 'primes':
        return [p for p in range(2, 5001) if is_prime(p)], 'primes'
    elif kind == 'squares':
        return [n*n for n in range(2, 300)], 'squares'
    elif kind == 'random':
        random.seed(42)
        return sorted(random.sample(range(2, 10000), 500)), 'random integers'
    elif kind == 'fibonacci':
        fibs = [2, 3]
        while fibs[-1] < 50000:
            fibs.append(fibs[-1] + fibs[-2])
        return fibs, 'fibonacci'
    elif kind == 'triangular':
        return [n*(n+1)//2 for n in range(2, 300)], 'triangular numbers'
    elif kind == 'powers2':
        return [2**k for k in range(2, 25)], 'powers of 2'
    elif kind == 'composites':
        return [n for n in range(4, 5000) if not is_prime(n)], 'composites'
    elif kind == 'semiprimes':
        semis = []
        for n in range(4, 10000):
            factors = 0
            m = n
            for p in range(2, int(math.sqrt(n))+1):
                while m % p == 0:
                    factors += 1
                    m //= p
            if m > 1: factors += 1
            if factors == 2: semis.append(n)
        return semis[:500], 'semiprimes'
    elif kind == 'custom' and custom:
        vals = [int(x) for x in custom.split(',') if x.strip()]
        return vals, 'custom'
    else:
        return [p for p in range(2, 5001) if is_prime(p)], 'primes'


if __name__ == '__main__':
    kind = 'primes'
    rounds = 3
    custom = None

    if '--input' in sys.argv:
        idx = sys.argv.index('--input')
        kind = sys.argv[idx+1] if idx+1 < len(sys.argv) else 'primes'
        if kind == 'custom' and idx+2 < len(sys.argv):
            custom = sys.argv[idx+2]

    if '--rounds' in sys.argv:
        idx = sys.argv.index('--rounds')
        rounds = int(sys.argv[idx+1]) if idx+1 < len(sys.argv) else 3

    values, name = generate_input(kind, custom)

    print(f"Input: {name} ({len(values)} values)")
    print(f"Rounds: {rounds}")
    print()

    proj = Projector(values, name)
    proj.iterate(rounds)
    proj.report()
