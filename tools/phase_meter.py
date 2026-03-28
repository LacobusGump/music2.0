# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
PHASE COHERENCE METER
=====================
Measures Φ_prime: departure from GUE equilibrium.
Works on any time series that oscillates.

Usage:
  from phase_meter import PhaseMeter
  pm = PhaseMeter(data)        # data = list of floats (time series)
  pm.phi_prime()               # → departure from GUE
  pm.report()                  # → full analysis

  # CLI
  python3 phase_meter.py data.txt          # one value per line
  python3 phase_meter.py --demo heart      # synthetic demo
  python3 phase_meter.py --demo brain
  python3 phase_meter.py --demo random
"""
import sys, os, math, random

class PhaseMeter:
    def __init__(self, data):
        self.data = list(data)
        self.n = len(self.data)
        self._spacings = None
        self._norm_spacings = None

    def zero_crossings(self):
        """Find zero-crossings (or mean-crossings) of the signal."""
        mean = sum(self.data) / self.n
        crossings = []
        for i in range(self.n - 1):
            if (self.data[i] - mean) * (self.data[i+1] - mean) < 0:
                # Linear interpolation
                frac = abs(self.data[i] - mean) / (abs(self.data[i] - mean) + abs(self.data[i+1] - mean))
                crossings.append(i + frac)
        return crossings

    def spacings(self):
        """Normalized spacings between zero crossings."""
        if self._norm_spacings is not None:
            return self._norm_spacings
        crossings = self.zero_crossings()
        if len(crossings) < 3:
            return []
        raw = [crossings[i+1] - crossings[i] for i in range(len(crossings)-1)]
        mean_s = sum(raw) / len(raw)
        self._norm_spacings = [s / mean_s for s in raw] if mean_s > 0 else raw
        return self._norm_spacings

    def spacing_variance(self):
        """Variance of normalized spacings. GUE ≈ 0.286, Poisson = 1.0."""
        s = self.spacings()
        if len(s) < 5: return None
        mean = sum(s) / len(s)
        return sum((x - mean)**2 for x in s) / len(s)

    def level_repulsion(self):
        """Fraction of small spacings (s < 0.3). GUE ≈ 0.03, Poisson ≈ 0.26."""
        s = self.spacings()
        if not s: return None
        return sum(1 for x in s if x < 0.3) / len(s)

    def number_variance(self, L=5):
        """Number variance Σ²(L). GUE ~ log(L), Poisson = L."""
        crossings = self.zero_crossings()
        if len(crossings) < 20: return None
        mean_spacing = (crossings[-1] - crossings[0]) / (len(crossings) - 1)
        window = L * mean_spacing
        counts = []
        for start in range(0, len(crossings) - 10, 5):
            x0 = crossings[start]
            count = sum(1 for c in crossings if x0 <= c < x0 + window)
            counts.append(count)
        if not counts: return None
        mean_c = sum(counts) / len(counts)
        return sum((c - mean_c)**2 for c in counts) / len(counts)

    def phi_prime(self):
        """Φ_prime: departure from GUE. 0 = random, >0 = coherent."""
        var = self.spacing_variance()
        if var is None: return None
        gue_var = 0.286
        repulsion = self.level_repulsion()
        gue_repulsion = 0.03

        # Φ combines spacing variance departure and repulsion departure
        var_departure = abs(var - gue_var) / gue_var
        rep_departure = abs(repulsion - gue_repulsion) / max(gue_repulsion, 0.001) if repulsion is not None else 0

        return math.sqrt(var_departure**2 + rep_departure**2)

    def regime(self):
        """Classify the signal regime."""
        phi = self.phi_prime()
        var = self.spacing_variance()
        rep = self.level_repulsion()
        if phi is None: return "insufficient data"
        if var is not None and var < 0.15: return "OVER-LOCKED (pathological rigidity)"
        if var is not None and var > 0.8: return "NEAR-RANDOM (Poisson-like)"
        if phi < 0.5: return "NEAR-GUE (equilibrium)"
        if phi < 2.0: return "HEALTHY COHERENCE (sweet spot)"
        if phi < 5.0: return "STRONG COHERENCE (flow/binding)"
        return "EXTREME COHERENCE (check for artifacts)"

    def report(self):
        """Print full analysis."""
        print(f"Phase Coherence Meter")
        print(f"  Data points: {self.n}")
        crossings = self.zero_crossings()
        print(f"  Zero crossings: {len(crossings)}")
        print(f"  Spacing variance: {self.spacing_variance():.4f}" if self.spacing_variance() else "  Spacing variance: N/A")
        print(f"    (GUE = 0.286, Poisson = 1.0)")
        rep = self.level_repulsion()
        print(f"  Level repulsion P(s<0.3): {rep:.4f}" if rep else "  Level repulsion: N/A")
        print(f"    (GUE = 0.03, Poisson = 0.26)")
        phi = self.phi_prime()
        print(f"  Φ_prime: {phi:.3f}" if phi else "  Φ_prime: N/A")
        nv = self.number_variance()
        print(f"  Number variance Σ²(5): {nv:.3f}" if nv else "  Number variance: N/A")
        print(f"  Regime: {self.regime()}")


def demo(kind='heart'):
    random.seed(42)
    n = 5000
    if kind == 'heart':
        # Healthy heart: 1/f-like with respiratory coupling
        data = []
        x = 0
        for i in range(n):
            x += 0.1 + 0.05*math.sin(2*math.pi*i/80) + 0.02*math.sin(2*math.pi*i/20) + random.gauss(0, 0.01)
            data.append(math.sin(x))
    elif kind == 'brain':
        # Gamma oscillation with binding events
        data = []
        for i in range(n):
            gamma = math.sin(2*math.pi*40*i/1000)
            theta = 0.3*math.sin(2*math.pi*6*i/1000)
            binding = 0.5*math.sin(2*math.pi*40*i/1000) if 1000 < i < 1500 or 3000 < i < 3800 else 0
            data.append(gamma + theta + binding + random.gauss(0, 0.2))
    elif kind == 'random':
        data = [random.gauss(0, 1) for _ in range(n)]
    elif kind == 'seizure':
        data = [math.sin(2*math.pi*20*i/1000 + 0.1*random.gauss(0,1)) for i in range(n)]
    else:
        data = [random.gauss(0, 1) for _ in range(n)]
    return data


if __name__ == '__main__':
    if '--demo' in sys.argv:
        kind = sys.argv[sys.argv.index('--demo') + 1] if len(sys.argv) > sys.argv.index('--demo') + 1 else 'heart'
        print(f"Demo: {kind}")
        data = demo(kind)
        pm = PhaseMeter(data)
        pm.report()
    elif len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1]) as f:
            data = [float(line.strip()) for line in f if line.strip()]
        pm = PhaseMeter(data)
        pm.report()
    else:
        print(__doc__)
