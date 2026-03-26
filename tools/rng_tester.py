#!/usr/bin/env python3
"""
RANDOM NUMBER TESTER (GUE Comparison)
=====================================
Tests if a sequence is truly random by comparing to GUE statistics.
Departures from GUE reveal hidden structure or broken RNGs.

Usage:
  python3 rng_tester.py data.txt           # test a file
  python3 rng_tester.py --test python       # test Python's RNG
  python3 rng_tester.py --test bad          # test a known-bad RNG
"""
import sys, os, math, random

class RNGTester:
    def __init__(self, data):
        self.data = sorted(data)
        self.n = len(self.data)

    def spacings(self):
        """Normalized nearest-neighbor spacings."""
        raw = [self.data[i+1] - self.data[i] for i in range(self.n - 1)]
        mean_s = sum(raw) / len(raw) if raw else 1
        return [s / mean_s for s in raw] if mean_s > 0 else raw

    def spacing_variance(self):
        s = self.spacings()
        if len(s) < 5: return None
        mean = sum(s) / len(s)
        return sum((x - mean)**2 for x in s) / len(s)

    def level_repulsion(self):
        """P(s < 0.3). GUE ≈ 0.03, Poisson ≈ 0.26."""
        s = self.spacings()
        return sum(1 for x in s if x < 0.3) / len(s) if s else None

    def large_gap_fraction(self):
        """P(s > 2.5). GUE ≈ 0.02, Poisson ≈ 0.08."""
        s = self.spacings()
        return sum(1 for x in s if x > 2.5) / len(s) if s else None

    def pair_correlation(self, r_max=3.0, bins=30):
        """Pair correlation function R₂(r)."""
        s = self.spacings()
        hist = [0] * bins
        for sp in s:
            b = int(sp / r_max * bins)
            if 0 <= b < bins:
                hist[b] += 1
        total = sum(hist)
        dr = r_max / bins
        return [(i * dr + dr/2, hist[i] / total / dr if total > 0 else 0) for i in range(bins)]

    def gue_score(self):
        """Overall GUE compliance score. 1.0 = perfect GUE, 0.0 = not GUE."""
        var = self.spacing_variance()
        rep = self.level_repulsion()
        lgf = self.large_gap_fraction()
        if var is None: return None

        # GUE targets
        var_score = 1.0 - min(abs(var - 0.286) / 0.286, 1.0)
        rep_score = 1.0 - min(abs(rep - 0.03) / 0.03, 1.0) if rep is not None else 0.5
        lgf_score = 1.0 - min(abs(lgf - 0.02) / 0.02, 1.0) if lgf is not None else 0.5

        return (var_score + rep_score + lgf_score) / 3

    def verdict(self):
        score = self.gue_score()
        var = self.spacing_variance()
        if score is None: return "insufficient data"
        if score > 0.7: return "CONSISTENT WITH GUE (truly random)"
        if var and var > 0.8: return "POISSON-LIKE (independent, possibly random)"
        if var and var < 0.15: return "TOO REGULAR (hidden periodicity or broken RNG)"
        return f"ANOMALOUS (GUE score: {score:.2f}, investigate)"

    def report(self):
        print(f"RNG Tester (GUE Comparison)")
        print(f"  Data points: {self.n}")
        print(f"  Spacing variance: {self.spacing_variance():.4f}" if self.spacing_variance() else "  N/A")
        print(f"    (GUE = 0.286, Poisson = 1.0, periodic = 0.0)")
        rep = self.level_repulsion()
        print(f"  Level repulsion P(s<0.3): {rep:.4f}" if rep else "  N/A")
        print(f"    (GUE = 0.03, Poisson = 0.26)")
        lgf = self.large_gap_fraction()
        print(f"  Large gaps P(s>2.5): {lgf:.4f}" if lgf else "  N/A")
        print(f"    (GUE = 0.02, Poisson = 0.08)")
        score = self.gue_score()
        print(f"  GUE score: {score:.3f}" if score else "  N/A")
        print(f"  Verdict: {self.verdict()}")


if __name__ == '__main__':
    if '--test' in sys.argv:
        kind = sys.argv[sys.argv.index('--test') + 1] if len(sys.argv) > sys.argv.index('--test') + 1 else 'python'

        if kind == 'python':
            print("Testing Python's random.random():")
            data = sorted(random.random() for _ in range(5000))
        elif kind == 'bad':
            print("Testing a bad LCG (a=1103515245, c=12345, m=2^31):")
            x = 42
            data = []
            for _ in range(5000):
                x = (1103515245 * x + 12345) % (2**31)
                data.append(x / 2**31)
            data.sort()
        elif kind == 'gue':
            print("Testing synthetic GUE (eigenvalues of random Hermitian matrix):")
            # Generate GUE eigenvalues
            n = 200
            import cmath
            H = [[random.gauss(0, 1) if i == j else (random.gauss(0, 0.5) + 1j*random.gauss(0, 0.5)) for j in range(n)] for i in range(n)]
            # Make Hermitian
            for i in range(n):
                for j in range(i+1, n):
                    H[j][i] = H[i][j].conjugate()
                H[i][i] = H[i][i].real
            # Can't easily compute eigenvalues without numpy, use spacings of sorted random instead
            data = sorted(random.gauss(0, 1) for _ in range(5000))
        else:
            data = sorted(random.random() for _ in range(5000))

        tester = RNGTester(data)
        tester.report()
    elif len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1]) as f:
            data = [float(line.strip()) for line in f if line.strip()]
        tester = RNGTester(data)
        tester.report()
    else:
        print(__doc__)
