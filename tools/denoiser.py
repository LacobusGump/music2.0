# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
UNIVERSAL SIGNAL DENOISER
=========================
Uses the SNR law to automatically select optimal spectral window.
Works on any signal with a spectral decomposition.

Usage:
  from denoiser import Denoiser
  d = Denoiser(noisy_signal, sample_rate=1000)
  clean = d.denoise()
  d.report()

  python3 denoiser.py input.txt --rate 1000
  python3 denoiser.py --demo
"""
import sys, os, math

class Denoiser:
    def __init__(self, data, sample_rate=1.0):
        self.data = list(data)
        self.n = len(self.data)
        self.rate = sample_rate
        self._spectrum = None

    def fft_real(self, x):
        """Simple DFT for real signals (no numpy needed)."""
        N = len(x)
        freqs = []
        for k in range(N // 2):
            re = sum(x[n] * math.cos(2*math.pi*k*n/N) for n in range(N))
            im = -sum(x[n] * math.sin(2*math.pi*k*n/N) for n in range(N))
            freqs.append((re, im))
        return freqs

    def ifft_real(self, freqs, N):
        """Inverse DFT back to real signal."""
        result = []
        for n in range(N):
            val = 0
            for k, (re, im) in enumerate(freqs):
                val += re * math.cos(2*math.pi*k*n/N) - im * math.sin(2*math.pi*k*n/N)
                if k > 0 and k < len(freqs) - 1:
                    val += re * math.cos(2*math.pi*k*n/N) - im * math.sin(2*math.pi*k*n/N)
            result.append(val / N)
        return result

    def spectrum(self):
        """Compute power spectrum."""
        if self._spectrum: return self._spectrum
        # Use subset for speed
        chunk = min(self.n, 1024)
        freqs = self.fft_real(self.data[:chunk])
        self._spectrum = [(math.sqrt(re**2 + im**2), k * self.rate / chunk) for k, (re, im) in enumerate(freqs)]
        return self._spectrum

    def estimate_snr(self):
        """Estimate SNR from the spectrum."""
        spec = self.spectrum()
        if not spec: return 1.0
        powers = [mag**2 for mag, freq in spec]
        if not powers: return 1.0
        # Signal: top 10% of spectrum. Noise: bottom 50%.
        sorted_p = sorted(powers, reverse=True)
        n = len(sorted_p)
        signal_power = sum(sorted_p[:max(n//10, 1)]) / max(n//10, 1)
        noise_power = sum(sorted_p[n//2:]) / max(n//2, 1)
        return signal_power / max(noise_power, 1e-15)

    def optimal_window(self):
        """Select window based on SNR law."""
        snr = self.estimate_snr()
        if snr > 100: return 'rect', snr
        if snr > 10: return 'fejer', snr
        if snr > 1: return 'raised_cos', snr
        return 'hann', snr

    def apply_window(self, spectrum, window_name, K=None):
        """Apply spectral window to frequency domain."""
        if K is None:
            K = len(spectrum)

        def w(k, K):
            r = k / K
            if window_name == 'rect': return 1.0
            if window_name == 'fejer': return max(0, 1 - r)
            if window_name == 'hann': return 0.5 * (1 - math.cos(2*math.pi*r)) if r < 1 else 0
            if window_name == 'raised_cos': return (1 + math.cos(math.pi*r))/2 if r < 1 else 0
            return 1.0

        return [(mag * w(k, K), freq) for k, (mag, freq) in enumerate(spectrum)]

    def denoise(self, K=None):
        """Denoise the signal using optimal window."""
        window_name, snr = self.optimal_window()
        chunk = min(self.n, 1024)
        freqs = self.fft_real(self.data[:chunk])

        if K is None:
            K = len(freqs)

        def w(k):
            r = k / K
            if window_name == 'rect': return 1.0
            if window_name == 'fejer': return max(0, 1 - r)
            if window_name == 'hann': return 0.5 * (1 - math.cos(2*math.pi*r)) if r < 1 else 0
            if window_name == 'raised_cos': return (1 + math.cos(math.pi*r))/2 if r < 1 else 0
            return 1.0

        windowed = [(re * w(k), im * w(k)) for k, (re, im) in enumerate(freqs)]

        # Reconstruct
        result = []
        for n in range(chunk):
            val = 0
            for k, (re, im) in enumerate(windowed):
                val += re * math.cos(2*math.pi*k*n/chunk) - im * math.sin(2*math.pi*k*n/chunk)
            result.append(2 * val / chunk)

        self._window_used = window_name
        self._snr = snr
        return result

    def report(self):
        snr = self.estimate_snr()
        window, _ = self.optimal_window()
        print(f"Universal Denoiser")
        print(f"  Data points: {self.n}")
        print(f"  Sample rate: {self.rate}")
        print(f"  Estimated SNR: {snr:.1f}")
        print(f"  Optimal window: {window}")
        print(f"  SNR law: {'rect (>100)' if snr > 100 else 'fejer (10-100)' if snr > 10 else 'raised_cos (1-10)' if snr > 1 else 'hann (<1)'}")


def demo():
    import random
    random.seed(42)
    n = 1024
    # Clean signal: two sinusoids
    clean = [math.sin(2*math.pi*5*t/n) + 0.5*math.sin(2*math.pi*13*t/n) for t in range(n)]
    # Add noise
    noisy = [c + random.gauss(0, 0.3) for c in clean]

    d = Denoiser(noisy, sample_rate=n)
    d.report()
    denoised = d.denoise()

    # Compute improvement
    noise_before = sum((noisy[i] - clean[i])**2 for i in range(n)) / n
    noise_after = sum((denoised[i] - clean[i])**2 for i in range(min(len(denoised), n))) / min(len(denoised), n)
    print(f"  MSE before: {noise_before:.4f}")
    print(f"  MSE after:  {noise_after:.4f}")
    print(f"  Improvement: {noise_before/max(noise_after, 1e-10):.1f}×")


if __name__ == '__main__':
    if '--demo' in sys.argv:
        demo()
    elif len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        rate = 1.0
        if '--rate' in sys.argv:
            rate = float(sys.argv[sys.argv.index('--rate') + 1])
        with open(sys.argv[1]) as f:
            data = [float(line.strip()) for line in f if line.strip()]
        d = Denoiser(data, rate)
        d.report()
    else:
        print(__doc__)
