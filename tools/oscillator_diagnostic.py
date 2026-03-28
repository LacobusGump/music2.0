# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
COUPLED OSCILLATOR DIAGNOSTIC
==============================
Measures coupling K, natural frequencies ω, order parameter r
for any multi-channel oscillating system.

Usage:
  from oscillator_diagnostic import OscillatorDiagnostic
  od = OscillatorDiagnostic(channels)  # channels = list of time series
  od.report()

  python3 oscillator_diagnostic.py --demo healthy_heart
  python3 oscillator_diagnostic.py --demo seizure
  python3 oscillator_diagnostic.py --demo music_ensemble
"""
import sys, math, random

class OscillatorDiagnostic:
    def __init__(self, channels, sample_rate=1000):
        self.channels = [list(ch) for ch in channels]
        self.n_channels = len(channels)
        self.n_samples = min(len(ch) for ch in channels) if channels else 0
        self.rate = sample_rate

    def extract_phases(self, channel):
        """Extract instantaneous phase via zero crossings."""
        mean = sum(channel) / len(channel)
        phases = []
        current_phase = 0
        for i in range(len(channel) - 1):
            if (channel[i] - mean) * (channel[i+1] - mean) < 0:
                current_phase += math.pi
            phases.append(current_phase)
        phases.append(current_phase)
        return phases

    def order_parameter(self, t=None):
        """Kuramoto order parameter r(t) = |1/N Σ e^{iθ_k}|."""
        all_phases = [self.extract_phases(ch) for ch in self.channels]
        if t is not None:
            re = sum(math.cos(ph[t]) for ph in all_phases) / self.n_channels
            im = sum(math.sin(ph[t]) for ph in all_phases) / self.n_channels
            return math.sqrt(re**2 + im**2)

        # Time-averaged
        rs = []
        step = max(1, self.n_samples // 500)
        for t in range(0, self.n_samples, step):
            re = sum(math.cos(ph[t]) for ph in all_phases) / self.n_channels
            im = sum(math.sin(ph[t]) for ph in all_phases) / self.n_channels
            rs.append(math.sqrt(re**2 + im**2))
        return sum(rs) / len(rs) if rs else 0

    def pairwise_coherence(self):
        """Mean pairwise phase coherence (PLV)."""
        all_phases = [self.extract_phases(ch) for ch in self.channels]
        plvs = []
        for i in range(self.n_channels):
            for j in range(i+1, self.n_channels):
                # PLV = |<e^{i(θ_i - θ_j)}>|
                re_sum, im_sum = 0, 0
                step = max(1, self.n_samples // 500)
                count = 0
                for t in range(0, self.n_samples, step):
                    dphi = all_phases[i][t] - all_phases[j][t]
                    re_sum += math.cos(dphi)
                    im_sum += math.sin(dphi)
                    count += 1
                if count > 0:
                    plv = math.sqrt((re_sum/count)**2 + (im_sum/count)**2)
                    plvs.append(plv)
        return sum(plvs) / len(plvs) if plvs else 0

    def estimate_frequencies(self):
        """Estimate natural frequency of each channel."""
        freqs = []
        for ch in self.channels:
            mean = sum(ch) / len(ch)
            crossings = sum(1 for i in range(len(ch)-1)
                          if (ch[i]-mean)*(ch[i+1]-mean) < 0)
            freq = crossings / 2 / (len(ch) / self.rate)
            freqs.append(freq)
        return freqs

    def estimate_K(self):
        """Estimate coupling constant K from order parameter and frequency spread."""
        freqs = self.estimate_frequencies()
        if not freqs: return None
        mean_f = sum(freqs) / len(freqs)
        spread = math.sqrt(sum((f-mean_f)**2 for f in freqs) / len(freqs))
        r = self.order_parameter()

        # From Kuramoto theory: r = sqrt(1 - K_c/K) for K > K_c
        # K_c = 2/(π × g(0)) ≈ 2 × spread × π
        K_c = 2 * spread * math.pi if spread > 0 else 1
        if r > 0.05:
            K = K_c / (1 - r**2) if r < 0.99 else K_c * 100
        else:
            K = K_c * 0.5  # below transition
        return K, K_c

    def regime(self):
        r = self.order_parameter()
        K_info = self.estimate_K()
        if K_info is None: return "unknown"
        K, K_c = K_info
        ratio = K / K_c if K_c > 0 else 0

        if r < 0.1: return "INCOHERENT (below transition, K < K_c)"
        if r < 0.3: return "PARTIAL SYNC (near transition)"
        if r < 0.7: return "SYNCHRONIZED (healthy coherence)"
        if r < 0.95: return "STRONG LOCK (flow state / binding)"
        return "HYPER-LOCKED (pathological? check for seizure/artifact)"

    def report(self):
        print(f"Coupled Oscillator Diagnostic")
        print(f"  Channels: {self.n_channels}")
        print(f"  Samples: {self.n_samples}")
        print(f"  Sample rate: {self.rate} Hz")
        print()

        freqs = self.estimate_frequencies()
        if freqs:
            print(f"  Natural frequencies:")
            for i, f in enumerate(freqs):
                print(f"    Ch {i+1}: {f:.2f} Hz")
            mean_f = sum(freqs) / len(freqs)
            spread = math.sqrt(sum((f-mean_f)**2 for f in freqs) / len(freqs))
            print(f"  Mean: {mean_f:.2f} Hz, Spread: {spread:.2f} Hz")
        print()

        r = self.order_parameter()
        print(f"  Order parameter r: {r:.4f}")
        plv = self.pairwise_coherence()
        print(f"  Mean PLV: {plv:.4f}")

        K_info = self.estimate_K()
        if K_info:
            K, K_c = K_info
            print(f"  Estimated K: {K:.2f}")
            print(f"  Critical K_c: {K_c:.2f}")
            print(f"  K/K_c: {K/K_c:.2f}" if K_c > 0 else "  K/K_c: ∞")
        print()
        print(f"  Regime: {self.regime()}")


def demo(kind='healthy_heart'):
    random.seed(42)
    n = 5000
    rate = 1000

    if kind == 'healthy_heart':
        # 4 cardiac channels: SA node, AV node, His bundle, ventricle
        # Coupled with slight delays
        channels = []
        for delay in [0, 5, 10, 20]:
            ch = [math.sin(2*math.pi*1.2*(t-delay)/rate + 0.1*math.sin(2*math.pi*0.25*t/rate))
                  + random.gauss(0, 0.1) for t in range(n)]
            channels.append(ch)
        print("Demo: Healthy heart (4 channels, coupled)")

    elif kind == 'seizure':
        # 8 EEG channels: hyper-synchronized at 20 Hz
        channels = []
        for i in range(8):
            phase_noise = random.gauss(0, 0.05)  # very little phase noise
            ch = [math.sin(2*math.pi*20*t/rate + phase_noise*t/rate)
                  + random.gauss(0, 0.02) for t in range(n)]
            channels.append(ch)
        print("Demo: Seizure (8 EEG channels, hyper-locked)")

    elif kind == 'music_ensemble':
        # 3 musicians: slightly different tempos that entrain
        channels = []
        for i, base_freq in enumerate([2.0, 2.01, 1.99]):
            coupling = 0.3
            phase = random.uniform(0, 2*math.pi)
            ch = []
            for t in range(n):
                phase += 2*math.pi*base_freq/rate
                # Couple to mean of others (simplified)
                phase += coupling * math.sin(2*math.pi*2.0*t/rate - phase) / rate
                ch.append(math.sin(phase) + random.gauss(0, 0.15))
            channels.append(ch)
        print("Demo: Music ensemble (3 musicians entraining)")

    elif kind == 'decoupled':
        # 5 independent oscillators (no coupling)
        channels = []
        for i in range(5):
            freq = random.uniform(8, 12)  # alpha band
            ch = [math.sin(2*math.pi*freq*t/rate + random.gauss(0, 0.5))
                  + random.gauss(0, 0.3) for t in range(n)]
            channels.append(ch)
        print("Demo: Decoupled oscillators (5 independent)")

    else:
        channels = [[random.gauss(0, 1) for _ in range(n)] for _ in range(4)]
        print("Demo: Random noise")

    od = OscillatorDiagnostic(channels, rate)
    od.report()


if __name__ == '__main__':
    if '--demo' in sys.argv:
        kind = sys.argv[sys.argv.index('--demo') + 1] if len(sys.argv) > sys.argv.index('--demo') + 1 else 'healthy_heart'
        demo(kind)
    else:
        print(__doc__)
