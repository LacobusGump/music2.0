#!/usr/bin/env python3
"""
ORACLE AI — The Streaming Learner
==================================
Learns and predicts in one forward pass. No gradient descent.
No stored weights. No backward pass. No training loop.

How it works (same pattern as the prime oracle):
  1. SCAN: slide through signal, detect resonant frequencies via sign changes
  2. EXTRACT: bisect to find exact frequency, amplitude, phase — on the fly
  3. PREDICT: each frequency immediately contributes to the prediction sum
  4. DONE: one pass through the data = fully trained model

This is the explicit formula applied to arbitrary signals:
  f(t) ≈ baseline + Σ_k A_k cos(ω_k t + φ_k)

Just as: π(x) = Li(x) - Σ_ρ x^ρ/(ρ log x) + ...

The zeros ARE the model. No weights needed.

Usage:
  python3 oracle_ai.py --demo sine          # learn a sine wave
  python3 oracle_ai.py --demo market         # learn noisy market-like signal
  python3 oracle_ai.py --demo speech         # learn speech-like signal
  python3 oracle_ai.py --demo composite      # learn sum of 7 frequencies
  python3 oracle_ai.py --file data.csv       # learn from CSV (one value per line)
  python3 oracle_ai.py --file data.csv --col 2  # use column 2

No dependencies beyond Python stdlib. Trains in milliseconds.
"""
import sys, time, os
from math import pi, sqrt, log, cos, sin, atan2, floor, exp

# ─── Core: Streaming Frequency Extractor ─────────────────

class OracleAI:
    """
    One-pass streaming learner.
    Extracts frequencies from signal the way the zero factory
    extracts zeros from Z(t): scan for sign changes, bisect, use immediately.
    """

    def __init__(self, signal, dt=1.0):
        """
        signal: list of float values (the time series)
        dt: time step between samples
        """
        self.signal = signal
        self.N = len(signal)
        self.dt = dt
        self.T = self.N * dt  # total duration

        # Extracted model (filled by learn())
        self.baseline = 0.0
        self.frequencies = []  # list of (omega, amplitude, phase)
        self.residual_power = 0.0
        self.learn_time = 0.0

    def _autocorrelation(self, x, max_lag=None):
        """Fast autocorrelation via direct sum."""
        n = len(x)
        if max_lag is None:
            max_lag = n // 2
        mean = sum(x) / n
        var = sum((v - mean)**2 for v in x)
        if var < 1e-30:
            return [1.0] + [0.0] * (max_lag - 1)
        ac = []
        for lag in range(max_lag):
            s = sum((x[i] - mean) * (x[i + lag] - mean) for i in range(n - lag))
            ac.append(s / var)
        return ac

    def _find_peaks_in_autocorr(self, ac):
        """Find peaks in autocorrelation = dominant periods."""
        peaks = []
        for i in range(2, len(ac) - 1):
            if ac[i] > ac[i-1] and ac[i] > ac[i+1] and ac[i] > 0.05:
                # Bisect-refine using parabolic interpolation
                a, b, c = ac[i-1], ac[i], ac[i+1]
                offset = 0.5 * (a - c) / (a - 2*b + c) if abs(a - 2*b + c) > 1e-12 else 0.0
                peaks.append((i + offset, ac[i]))
        peaks.sort(key=lambda p: -p[1])
        return peaks

    def _fit_single_frequency(self, residual, omega):
        """
        Fit A*cos(ωt + φ) to residual signal.
        Closed-form solution via projection (no iteration needed).
        """
        n = len(residual)
        # Project onto cos(ωt) and sin(ωt) basis
        cos_sum = 0.0
        sin_sum = 0.0
        cos2_sum = 0.0
        sin2_sum = 0.0
        for i in range(n):
            t = i * self.dt
            c = cos(omega * t)
            s = sin(omega * t)
            cos_sum += residual[i] * c
            sin_sum += residual[i] * s
            cos2_sum += c * c
            sin2_sum += s * s

        # Amplitude and phase from projection coefficients
        a_cos = cos_sum / max(cos2_sum, 1e-30)
        a_sin = sin_sum / max(sin2_sum, 1e-30)
        amplitude = sqrt(a_cos**2 + a_sin**2)
        phase = atan2(-a_sin, a_cos)

        return amplitude, phase

    def _subtract_frequency(self, residual, omega, amp, phase):
        """Remove a frequency component from residual."""
        return [residual[i] - amp * cos(omega * i * self.dt + phase)
                for i in range(len(residual))]

    def _scan_spectrum(self, residual, n_scan=2000):
        """
        Scan for dominant frequency via Z(t)-style sign change detection.
        Instead of scanning Z(t), we scan the DFT magnitude.
        """
        n = len(residual)
        best_power = 0.0
        best_omega = 0.0

        # Scan frequency range: 0 to Nyquist
        omega_max = pi / self.dt
        d_omega = omega_max / n_scan

        prev_deriv = 0.0
        prev_power = 0.0

        for k in range(1, n_scan):
            omega = k * d_omega
            # Compute power at this frequency (DFT magnitude²)
            re = 0.0
            im = 0.0
            for i in range(n):
                t = i * self.dt
                re += residual[i] * cos(omega * t)
                im += residual[i] * sin(omega * t)
            power = (re*re + im*im) / (n * n)

            # Detect peak via sign change of derivative (just like Z(t) zeros!)
            deriv = power - prev_power
            if prev_deriv > 0 and deriv < 0 and prev_power > best_power:
                # Peak found — bisect to refine
                lo_omega = (k - 2) * d_omega if k > 1 else 0.001
                hi_omega = (k + 1) * d_omega
                for _ in range(30):
                    mid = (lo_omega + hi_omega) / 2
                    # Evaluate power at mid ± epsilon
                    eps = (hi_omega - lo_omega) * 0.01
                    p_lo = self._quick_power(residual, mid - eps)
                    p_hi = self._quick_power(residual, mid + eps)
                    if p_hi > p_lo:
                        lo_omega = mid
                    else:
                        hi_omega = mid
                best_omega = (lo_omega + hi_omega) / 2
                best_power = self._quick_power(residual, best_omega)

            prev_deriv = deriv
            prev_power = power

        return best_omega, best_power

    def _quick_power(self, residual, omega):
        """Quick DFT power at a single frequency."""
        re = 0.0
        im = 0.0
        for i in range(len(residual)):
            t = i * self.dt
            re += residual[i] * cos(omega * t)
            im += residual[i] * sin(omega * t)
        n = len(residual)
        return (re*re + im*im) / (n * n)

    def learn(self, max_frequencies=50, min_power_ratio=0.001, method='auto'):
        """
        ONE PASS. Extract all frequencies. Build the model.

        This is the training step — but there's no backward pass,
        no gradient descent, no loss function. Just frequency extraction.

        Like the oracle: scan → detect → bisect → use → next.
        """
        t0 = time.time()

        # Step 0: Baseline (DC component)
        self.baseline = sum(self.signal) / self.N

        # Work with zero-mean signal
        residual = [v - self.baseline for v in self.signal]
        total_power = sum(v*v for v in residual) / self.N

        if total_power < 1e-30:
            self.learn_time = time.time() - t0
            return

        self.frequencies = []
        extracted = 0

        # Choose method based on signal length
        if method == 'auto':
            method = 'autocorr' if self.N > 500 else 'scan'

        if method == 'autocorr':
            # Method 1: Autocorrelation peaks → fast for long signals
            max_lag = min(self.N // 2, 5000)
            ac = self._autocorrelation(residual, max_lag)
            peaks = self._find_peaks_in_autocorr(ac)

            for period_samples, strength in peaks[:max_frequencies]:
                if period_samples < 2:
                    continue
                omega = 2 * pi / (period_samples * self.dt)
                amp, phase = self._fit_single_frequency(residual, omega)

                power_ratio = (amp * amp / 2) / total_power
                if power_ratio < min_power_ratio:
                    continue

                self.frequencies.append((omega, amp, phase))
                residual = self._subtract_frequency(residual, omega, amp, phase)
                extracted += 1

        # Method 2: Direct spectral scan (always run to catch what autocorr misses)
        remaining_power = sum(v*v for v in residual) / self.N
        scan_rounds = max_frequencies - extracted

        for _ in range(scan_rounds):
            if remaining_power / total_power < min_power_ratio:
                break

            omega, power = self._scan_spectrum(residual,
                                                n_scan=min(1000, self.N // 2))
            if omega < 1e-10 or power / total_power < min_power_ratio:
                break

            amp, phase = self._fit_single_frequency(residual, omega)
            self.frequencies.append((omega, amp, phase))
            residual = self._subtract_frequency(residual, omega, amp, phase)
            remaining_power = sum(v*v for v in residual) / self.N
            extracted += 1

        self.residual_power = sum(v*v for v in residual) / self.N
        self.learn_time = time.time() - t0

        # Sort by amplitude (strongest first)
        self.frequencies.sort(key=lambda f: -f[1])

    def predict(self, t):
        """
        Predict signal value at time t.
        This is the explicit formula: baseline + Σ A_k cos(ω_k t + φ_k)
        """
        value = self.baseline
        for omega, amp, phase in self.frequencies:
            value += amp * cos(omega * t + phase)
        return value

    def predict_range(self, t_start, t_end, n_points):
        """Predict over a range of times."""
        dt = (t_end - t_start) / max(n_points - 1, 1)
        return [(t_start + i * dt, self.predict(t_start + i * dt))
                for i in range(n_points)]

    def forecast(self, n_steps):
        """Forecast n_steps beyond the training data."""
        t_end = self.N * self.dt
        return [(t_end + i * self.dt, self.predict(t_end + i * self.dt))
                for i in range(n_steps)]

    def error_on_training(self):
        """Compute reconstruction error on training data."""
        total_err = 0.0
        total_var = 0.0
        for i in range(self.N):
            t = i * self.dt
            pred = self.predict(t)
            err = self.signal[i] - pred
            total_err += err * err
            total_var += (self.signal[i] - self.baseline) ** 2
        rmse = sqrt(total_err / self.N)
        r_squared = 1.0 - total_err / max(total_var, 1e-30)
        return rmse, r_squared

    def summary(self):
        """Print model summary."""
        rmse, r2 = self.error_on_training()
        total_power = sum((v - self.baseline)**2 for v in self.signal) / self.N
        explained = 1.0 - self.residual_power / max(total_power, 1e-30)

        print(f"  Oracle AI Model Summary")
        print(f"  {'─' * 40}")
        print(f"  Signal:      {self.N} samples, dt={self.dt}")
        print(f"  Baseline:    {self.baseline:.6f}")
        print(f"  Frequencies: {len(self.frequencies)} extracted")
        print(f"  R²:          {r2:.6f}")
        print(f"  RMSE:        {rmse:.6f}")
        print(f"  Explained:   {explained*100:.1f}%")
        print(f"  Learn time:  {self.learn_time*1000:.1f} ms")
        print()

        if self.frequencies:
            print(f"  {'ω':>10} {'freq (Hz)':>10} {'amp':>10} {'phase':>8} {'power%':>8}")
            print(f"  {'─' * 50}")
            for omega, amp, phase in self.frequencies[:20]:
                freq = omega / (2 * pi)
                power_pct = (amp**2 / 2) / max(total_power, 1e-30) * 100
                print(f"  {omega:10.4f} {freq:10.4f} {amp:10.4f} {phase:+8.3f} {power_pct:7.1f}%")
            if len(self.frequencies) > 20:
                print(f"  ... and {len(self.frequencies) - 20} more")

    def export_model(self):
        """Export model as compact dict — this IS the 'weights'."""
        return {
            'baseline': self.baseline,
            'frequencies': [(w, a, p) for w, a, p in self.frequencies],
            'dt': self.dt,
            'N_train': self.N
        }


# ─── Demo Signals ────────────────────────────────────────

def demo_sine(n=1000):
    """Simple sine wave — should be learned perfectly."""
    return [sin(2 * pi * 3.7 * i / n) for i in range(n)]

def demo_composite(n=2000):
    """Sum of 7 frequencies at different amplitudes."""
    freqs = [1.0, 2.3, 5.7, 11.1, 17.0, 31.4, 50.0]
    amps = [1.0, 0.7, 0.5, 0.3, 0.2, 0.15, 0.1]
    signal = []
    for i in range(n):
        t = i / n * 10  # 10 seconds
        v = sum(a * sin(2*pi*f*t + f) for f, a in zip(freqs, amps))
        signal.append(v)
    return signal, 10.0 / n

def demo_market(n=2000):
    """Market-like signal: trend + cycles + noise."""
    # LCG for reproducible "randomness" (no imports needed)
    seed = 42
    def lcg():
        nonlocal seed
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        return (seed / 0x7fffffff - 0.5) * 2  # [-1, 1]

    signal = []
    for i in range(n):
        t = i / n * 100
        # Trend
        trend = 100 + 0.5 * t
        # Business cycle (~20 period)
        cycle1 = 8 * sin(2*pi*t/20)
        # Seasonal (~5 period)
        cycle2 = 3 * sin(2*pi*t/5 + 1.2)
        # Fast oscillation
        cycle3 = 1.5 * sin(2*pi*t/1.3 + 0.7)
        # Noise
        noise = 2 * lcg()
        signal.append(trend + cycle1 + cycle2 + cycle3 + noise)
    return signal, 100.0 / n

def demo_speech(n=4000):
    """Speech-like signal: formants + pitch + amplitude envelope."""
    signal = []
    for i in range(n):
        t = i / 8000  # 8kHz sample rate, 0.5s
        # Pitch (fundamental ~150Hz with vibrato)
        f0 = 150 + 5 * sin(2*pi*5*t)
        # Formants
        f1 = 0.8 * sin(2*pi*f0*t)
        f2 = 0.4 * sin(2*pi*2.5*f0*t)
        f3 = 0.2 * sin(2*pi*4*f0*t)
        # Amplitude envelope
        env = 0.5 * (1 + sin(2*pi*3*t))
        signal.append(env * (f1 + f2 + f3))
    return signal, 1.0 / 8000


# ─── CLI ─────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    signal = None
    dt = 1.0
    name = "custom"

    if '--demo' in sys.argv:
        idx = sys.argv.index('--demo')
        demo_name = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else 'sine'

        if demo_name == 'sine':
            signal = demo_sine(1000)
            dt = 1.0 / 1000
            name = "pure sine (3.7 Hz)"
        elif demo_name == 'composite':
            signal, dt = demo_composite(2000)
            name = "7-frequency composite"
        elif demo_name == 'market':
            signal, dt = demo_market(2000)
            name = "market-like (trend + cycles + noise)"
        elif demo_name == 'speech':
            signal, dt = demo_speech(4000)
            name = "speech-like (formants + pitch)"
        else:
            print(f"Unknown demo: {demo_name}")
            print("Available: sine, composite, market, speech")
            return

    elif '--file' in sys.argv:
        idx = sys.argv.index('--file')
        filepath = sys.argv[idx + 1]
        col = 0
        if '--col' in sys.argv:
            col = int(sys.argv[sys.argv.index('--col') + 1])

        with open(filepath) as f:
            lines = f.readlines()
        signal = []
        for line in lines:
            parts = line.strip().split(',')
            if len(parts) > col:
                try:
                    signal.append(float(parts[col]))
                except ValueError:
                    continue
        name = os.path.basename(filepath)
    else:
        print(__doc__)
        return

    if not signal or len(signal) < 10:
        print("Need at least 10 data points.")
        return

    print(f"Oracle AI | {name} | {len(signal)} samples")
    print()

    # ═══ THE TRAINING STEP ═══
    # One line. One pass. Done.
    ai = OracleAI(signal, dt=dt)
    ai.learn()

    ai.summary()

    # Forecast
    n_forecast = min(200, len(signal) // 4)
    forecast = ai.forecast(n_forecast)

    print()
    print(f"  Forecast ({n_forecast} steps beyond training data):")
    print(f"  {'step':>6} {'predicted':>12}")
    print(f"  {'─' * 20}")
    for i in range(0, min(10, n_forecast)):
        t, v = forecast[i]
        print(f"  {i+1:6d} {v:12.4f}")
    if n_forecast > 10:
        print(f"  ... ({n_forecast - 10} more)")

    # Model size
    model = ai.export_model()
    n_params = 1 + 3 * len(model['frequencies'])  # baseline + (ω, A, φ) per freq
    print()
    print(f"  Model size: {n_params} parameters (vs {len(signal)} data points)")
    print(f"  Compression: {len(signal) / max(n_params, 1):.0f}×")
    print()
    print(f"  No gradient descent. No backward pass. No loss function.")
    print(f"  One forward pass. {ai.learn_time*1000:.1f} ms. Done.")


if __name__ == '__main__':
    main()
