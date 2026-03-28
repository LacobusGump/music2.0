# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
PAIR CORRELATION ANALYZER
=========================
Feed it any sequence of numbers. It tells you: GUE, Poisson, or other.
Works on: zeta zeros, L-function zeros, nuclear levels, spike times,
heartbeats, market prices, anything with spacings.

Usage:
  python3 pair_correlation.py zeros_hp_1.txt         # file of values
  python3 pair_correlation.py --demo gue              # synthetic GUE
  python3 pair_correlation.py --demo poisson          # synthetic Poisson
  python3 pair_correlation.py --demo primes           # prime numbers
  python3 pair_correlation.py --demo zeta             # zeta zeros (needs file)

  from pair_correlation import SpectralAnalyzer
  sa = SpectralAnalyzer(data)
  sa.report()
"""
import sys, os, math, random

class SpectralAnalyzer:
    def __init__(self, values, normalize=True):
        self.raw = sorted(values)
        self.n = len(self.raw)
        self.spacings = self._compute_spacings(normalize)

    def _compute_spacings(self, normalize):
        if self.n < 3: return []
        raw_spacings = [self.raw[i+1] - self.raw[i] for i in range(self.n - 1)]
        if normalize:
            mean = sum(raw_spacings) / len(raw_spacings)
            return [s / mean for s in raw_spacings] if mean > 0 else raw_spacings
        return raw_spacings

    def pair_correlation(self, n_bins=50, x_max=4.0):
        """Compute R₂(x) from all nearby pairs."""
        dx = x_max / n_bins
        bins = [0] * n_bins

        # Use normalized cumulative positions
        positions = [0]
        for s in self.spacings:
            positions.append(positions[-1] + s)

        n_use = min(len(positions), 30000)
        n_pairs = 0
        for i in range(n_use):
            for j in range(i+1, min(i+30, n_use)):
                d = positions[j] - positions[i]
                if d > x_max: break
                b = int(d / dx)
                if 0 <= b < n_bins:
                    bins[b] += 1
                    n_pairs += 1

        total_length = positions[n_use-1] if n_use > 1 else 1
        density = n_use / total_length if total_length > 0 else 1

        result = []
        for i in range(n_bins):
            x = (i + 0.5) * dx
            data = bins[i] / (n_use * dx * density) if n_use * dx * density > 0 else 0
            gue = 1 - (math.sin(math.pi*x)/(math.pi*x))**2 if x > 0.001 else 0
            poisson = 1.0
            result.append({'x': x, 'R2': data, 'gue': gue, 'poisson': poisson})
        return result

    def spacing_distribution(self, n_bins=50, s_max=4.0):
        """Nearest-neighbor spacing distribution p(s)."""
        ds = s_max / n_bins
        bins = [0] * n_bins
        for s in self.spacings:
            b = int(s / ds)
            if 0 <= b < n_bins:
                bins[b] += 1
        result = []
        for i in range(n_bins):
            s = (i + 0.5) * ds
            data = bins[i] / (len(self.spacings) * ds) if self.spacings else 0
            wigner = (math.pi/2) * s * math.exp(-math.pi*s*s/4)
            poisson = math.exp(-s)
            result.append({'s': s, 'ps': data, 'wigner': wigner, 'poisson': poisson})
        return result

    def moments(self):
        """Variance, skewness, kurtosis of spacings."""
        if len(self.spacings) < 10: return {}
        mean = sum(self.spacings) / len(self.spacings)
        var = sum((s-mean)**2 for s in self.spacings) / len(self.spacings)
        std = math.sqrt(var) if var > 0 else 1
        skew = sum((s-mean)**3 for s in self.spacings) / (len(self.spacings) * std**3)
        kurt = sum((s-mean)**4 for s in self.spacings) / (len(self.spacings) * std**4) - 3
        return {'mean': mean, 'variance': var, 'skewness': skew, 'kurtosis': kurt}

    def number_variance(self, L_values=None):
        """Number variance Σ²(L)."""
        if L_values is None:
            L_values = [0.5, 1, 2, 5, 10]
        positions = [0]
        for s in self.spacings:
            positions.append(positions[-1] + s)

        results = []
        for L in L_values:
            counts = []
            step = max(1, len(positions) // 2000)
            for i in range(0, len(positions) - 50, step):
                count = sum(1 for j in range(i, min(i+int(L*3)+10, len(positions)))
                           if positions[j] - positions[i] <= L)
                counts.append(count)
            if counts:
                mean_c = sum(counts) / len(counts)
                var_c = sum((c-mean_c)**2 for c in counts) / len(counts)
            else:
                var_c = 0
            gamma_e = 0.5772
            gue = max(0.001, (2/math.pi**2) * (math.log(2*math.pi*L) + gamma_e + 1 - math.pi**2/8))
            results.append({'L': L, 'sigma2': var_c, 'gue': gue, 'poisson': L})
        return results

    def classify(self):
        """Classify: GUE, Poisson, Picket Fence, or Other."""
        m = self.moments()
        if not m: return 'insufficient data'
        var = m['variance']
        # Level repulsion test
        small_frac = sum(1 for s in self.spacings if s < 0.3) / len(self.spacings) if self.spacings else 0

        if var < 0.05:
            return 'PICKET FENCE (nearly periodic)'
        elif var < 0.35 and small_frac < 0.15:
            return 'GUE (quantum chaotic / random matrix)'
        elif 0.35 < var < 0.7:
            return 'INTERMEDIATE (between GUE and Poisson)'
        elif var > 0.7 and small_frac > 0.2:
            return 'POISSON (uncorrelated / random)'
        else:
            return f'OTHER (var={var:.3f}, repulsion={small_frac:.3f})'

    def gue_score(self):
        """0 to 1 score. 1 = perfect GUE."""
        m = self.moments()
        if not m: return 0
        var_score = 1 - min(abs(m['variance'] - 0.286) / 0.286, 1)
        small_frac = sum(1 for s in self.spacings if s < 0.3) / max(len(self.spacings), 1)
        rep_score = 1 - min(abs(small_frac - 0.03) / 0.03, 1)
        return max(0, (var_score + rep_score) / 2)

    def report(self):
        """Full analysis report."""
        print(f"Pair Correlation Analyzer")
        print(f"  Values: {self.n:,}")
        print(f"  Spacings: {len(self.spacings):,}")
        print()

        m = self.moments()
        if m:
            print(f"  Spacing moments:")
            print(f"    Mean:      {m['mean']:.6f} (normalized to 1)")
            print(f"    Variance:  {m['variance']:.6f}  (GUE: 0.286, Poisson: 1.0)")
            print(f"    Skewness:  {m['skewness']:.6f}  (GUE: ~0.165)")
            print(f"    Kurtosis:  {m['kurtosis']:.6f}  (GUE: ~0.049)")
            print()

        # Classification
        print(f"  Classification: {self.classify()}")
        print(f"  GUE score: {self.gue_score():.3f}")
        print()

        # Spacing distribution comparison
        sd = self.spacing_distribution(30, 3.0)
        wigner_wins = sum(1 for d in sd if abs(d['ps']-d['wigner']) < abs(d['ps']-d['poisson']))
        print(f"  Spacing distribution: Wigner wins {wigner_wins}/30 bins")
        print()

        # Pair correlation
        pc = self.pair_correlation(30, 3.0)
        gue_dev = sum(abs(d['R2']-d['gue']) for d in pc) / len(pc)
        poi_dev = sum(abs(d['R2']-d['poisson']) for d in pc) / len(pc)
        print(f"  Pair correlation:")
        print(f"    Mean |R₂ - GUE|:     {gue_dev:.6f}")
        print(f"    Mean |R₂ - Poisson|: {poi_dev:.6f}")
        print(f"    GUE is {poi_dev/gue_dev:.1f}× better fit" if gue_dev > 0 else "")
        print()

        # Number variance
        nv = self.number_variance()
        print(f"  Number variance Σ²(L):")
        for d in nv:
            closer = 'GUE' if abs(d['sigma2']-d['gue']) < abs(d['sigma2']-d['poisson']) else 'Poisson'
            print(f"    L={d['L']:5.1f}: Σ²={d['sigma2']:.4f} (GUE:{d['gue']:.4f}, Poi:{d['poisson']:.1f}) → {closer}")


def load_file(path):
    """Load values from a file (one per line, or 'index value' format)."""
    values = []
    with open(path) as f:
        for line in f:
            if line.startswith('#'): continue
            parts = line.strip().split()
            if not parts: continue
            try:
                val = float(parts[-1])  # take last column
                values.append(val)
            except:
                try:
                    val = float(parts[0])
                    values.append(val)
                except:
                    pass
    return values


def demo(kind):
    random.seed(42)
    n = 5000

    if kind == 'gue':
        print("Demo: Synthetic GUE (Wigner surmise spacings)")
        # Generate spacings from Wigner surmise via rejection sampling
        values = [0]
        for _ in range(n):
            while True:
                s = random.expovariate(1) * 1.5
                p_accept = (math.pi/2) * s * math.exp(-math.pi*s*s/4) / (0.8 * math.exp(-s*0.7))
                if random.random() < min(p_accept, 1):
                    values.append(values[-1] + s)
                    break
        return values

    elif kind == 'poisson':
        print("Demo: Poisson process (random, uncorrelated)")
        values = [0]
        for _ in range(n):
            values.append(values[-1] + random.expovariate(1))
        return values

    elif kind == 'primes':
        print("Demo: Prime numbers (the original sequence)")
        def is_prime(n):
            if n < 2: return False
            if n < 4: return True
            if n % 2 == 0 or n % 3 == 0: return False
            i = 5
            while i*i <= n:
                if n % i == 0 or n % (i+2) == 0: return False
                i += 6
            return True
        return [p for p in range(2, 50000) if is_prime(p)]

    elif kind == 'zeta':
        print("Demo: Zeta zeros")
        for f in ['zeros_hp_1.txt', 'zeros_100k.txt', 'zeros_2000.txt']:
            path = os.path.join(os.path.dirname(os.path.abspath(__file__)), f)
            if os.path.exists(path):
                return load_file(path)
        print("No zero file found. Place zeros_hp_1.txt in tools/")
        return []

    elif kind == 'heartbeat':
        print("Demo: Healthy heartbeat (1/f variability)")
        values = [0]
        x = 800
        for _ in range(n):
            x += random.gauss(0, 12) + 8*math.sin(len(values)*0.08) + 3*math.sin(len(values)*0.25)
            x = max(600, min(1000, x))
            values.append(values[-1] + x)
        return values

    return [random.random() * n for _ in range(n)]


if __name__ == '__main__':
    if '--demo' in sys.argv:
        kind = sys.argv[sys.argv.index('--demo') + 1] if len(sys.argv) > sys.argv.index('--demo') + 1 else 'gue'
        values = demo(kind)
    elif len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        print(f"Loading: {sys.argv[1]}")
        values = load_file(sys.argv[1])
    else:
        print(__doc__)
        sys.exit(0)

    if not values:
        print("No data loaded.")
        sys.exit(1)

    sa = SpectralAnalyzer(values)
    sa.report()
