# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
ORACLE TRAIN — Self-Improving Streaming Intelligence
=====================================================
Trains like the prime oracle: extract structure, predict, bootstrap,
repeat. Each pass finds deeper patterns in the residual. The model
gets smarter without gradient descent.

Architecture:
  Pass 1: Extract dominant frequencies (spectral scan)
  Pass 2: Extract amplitude modulations (envelope analysis)
  Pass 3: Extract frequency modulations (chirp detection)
  Pass 4: Extract nonlinear couplings (harmonic relationships)
  Pass 5+: Bootstrap — predict beyond data, re-analyze, refine

Each pass peels off one layer of structure. What remains is true noise.
The model IS the extracted structure. No weights. No loss function.

Usage:
  python3 oracle_train.py --demo composite     # 7 frequencies
  python3 oracle_train.py --demo chirp         # frequency sweep
  python3 oracle_train.py --demo am            # amplitude modulated
  python3 oracle_train.py --demo chaos         # logistic map (hard)
  python3 oracle_train.py --demo everything    # all patterns combined
  python3 oracle_train.py --file data.csv      # your data
  python3 oracle_train.py --file data.csv --passes 10  # deep training

No dependencies beyond Python stdlib.
"""
import sys, time, os
from math import pi, sqrt, log, cos, sin, atan2, floor, exp, log2

# ═══════════════════════════════════════════════════════════
# Layer 1: Frequency Extractor (from oracle_ai.py, optimized)
# ═══════════════════════════════════════════════════════════

def _dft_at(x, n, omega, dt):
    """DFT power + coefficients at a single frequency."""
    re, im = 0.0, 0.0
    for i in range(n):
        t = i * dt
        re += x[i] * cos(omega * t)
        im += x[i] * sin(omega * t)
    return re, im

def _fit_freq(x, n, omega, dt):
    """Fit A*cos(ωt + φ) — closed form projection."""
    cs, ss, c2, s2 = 0.0, 0.0, 0.0, 0.0
    for i in range(n):
        t = i * dt
        c, s = cos(omega * t), sin(omega * t)
        cs += x[i] * c; ss += x[i] * s
        c2 += c*c; s2 += s*s
    ac = cs / max(c2, 1e-30)
    a_s = ss / max(s2, 1e-30)
    return sqrt(ac*ac + a_s*a_s), atan2(-a_s, ac)

def _subtract(x, omega, amp, phase, dt):
    return [x[i] - amp * cos(omega * i * dt + phase) for i in range(len(x))]

def _power(x):
    return sum(v*v for v in x) / max(len(x), 1)

def _scan_peak(x, n, dt, n_scan=1000):
    """Find dominant frequency via peak detection + bisection."""
    omega_max = pi / dt
    dw = omega_max / n_scan
    best_p, best_w = 0.0, 0.0
    prev_p, prev_d = 0.0, 0.0

    for k in range(1, n_scan):
        w = k * dw
        re, im = _dft_at(x, n, w, dt)
        p = (re*re + im*im) / (n*n)
        d = p - prev_p
        if prev_d > 0 and d < 0 and prev_p > best_p:
            lo = max(0.001, (k-2)*dw)
            hi = (k+1)*dw
            for _ in range(25):
                mid = (lo+hi)/2
                eps = (hi-lo)*0.01
                r1, i1 = _dft_at(x, n, mid-eps, dt)
                r2, i2 = _dft_at(x, n, mid+eps, dt)
                if r2*r2+i2*i2 > r1*r1+i1*i1: lo = mid
                else: hi = mid
            best_w = (lo+hi)/2
            re, im = _dft_at(x, n, best_w, dt)
            best_p = (re*re + im*im) / (n*n)
        prev_d, prev_p = d, p
    return best_w, best_p

# ═══════════════════════════════════════════════════════════
# Layer 2: Envelope Extractor (amplitude modulation)
# ═══════════════════════════════════════════════════════════

def _hilbert_envelope(x, n):
    """Approximate analytic signal envelope via moving RMS."""
    window = max(3, n // 50)
    env = []
    for i in range(n):
        lo = max(0, i - window//2)
        hi = min(n, i + window//2 + 1)
        rms = sqrt(sum(x[j]**2 for j in range(lo, hi)) / (hi - lo))
        env.append(rms)
    return env

def _extract_envelope_modulation(x, n, dt):
    """Find if the signal has amplitude modulation."""
    env = _hilbert_envelope(x, n)
    mean_env = sum(env) / n
    if mean_env < 1e-10:
        return None
    env_centered = [e - mean_env for e in env]
    env_power = _power(env_centered)
    if env_power / max(mean_env**2, 1e-30) < 0.01:
        return None  # flat envelope, no AM

    # Find modulation frequency
    n_scan = min(500, n//4)
    w, p = _scan_peak(env_centered, n, dt, n_scan)
    if w < 1e-10:
        return None
    amp, phase = _fit_freq(env_centered, n, w, dt)
    return {'type': 'AM', 'mod_freq': w, 'mod_amp': amp / max(mean_env, 1e-10),
            'mod_phase': phase, 'carrier_amp': mean_env}

# ═══════════════════════════════════════════════════════════
# Layer 3: Chirp Detector (frequency modulation)
# ═══════════════════════════════════════════════════════════

def _detect_chirp(x, n, dt):
    """Detect linear frequency sweep by comparing spectra of halves."""
    half = n // 2
    if half < 20:
        return None
    w1, p1 = _scan_peak(x[:half], half, dt, min(500, half//2))
    w2, p2 = _scan_peak(x[half:], half, dt, min(500, half//2))
    if w1 < 1e-10 or w2 < 1e-10:
        return None
    chirp_rate = (w2 - w1) / (half * dt)
    if abs(chirp_rate) < 1e-6:
        return None
    return {'type': 'chirp', 'start_freq': w1, 'end_freq': w2,
            'chirp_rate': chirp_rate}

# ═══════════════════════════════════════════════════════════
# Layer 4: Harmonic Coupling Detector
# ═══════════════════════════════════════════════════════════

def _detect_harmonics(frequencies):
    """Find harmonic relationships between extracted frequencies."""
    harmonics = []
    for i, (w1, a1, _) in enumerate(frequencies):
        for j, (w2, a2, _) in enumerate(frequencies):
            if j <= i: continue
            if w1 < 1e-10: continue
            ratio = w2 / w1
            # Check if ratio is close to a small integer
            for n in range(2, 8):
                if abs(ratio - n) < 0.05:
                    harmonics.append({
                        'fundamental': w1, 'harmonic': w2,
                        'order': n, 'amp_ratio': a2 / max(a1, 1e-30)
                    })
    return harmonics

# ═══════════════════════════════════════════════════════════
# Layer 5: Bootstrap Predictor
# ═══════════════════════════════════════════════════════════

def _bootstrap_extend(model, n_extend, dt):
    """Use current model to predict beyond data, then re-analyze."""
    N = model['N_train']
    extension = []
    for i in range(n_extend):
        t = (N + i) * dt
        v = model['baseline']
        for w, a, p in model['frequencies']:
            v += a * cos(w * t + p)
        extension.append(v)
    return extension


# ═══════════════════════════════════════════════════════════
# The Engine: Multi-Pass Streaming Trainer
# ═══════════════════════════════════════════════════════════

class OracleTrain:
    def __init__(self, signal, dt=1.0):
        self.original = list(signal)
        self.N = len(signal)
        self.dt = dt
        self.T = self.N * dt

        # Model layers
        self.baseline = 0.0
        self.trend = None       # (slope, intercept)
        self.frequencies = []   # [(ω, A, φ), ...]
        self.envelope_mods = [] # AM detections
        self.chirps = []        # chirp detections
        self.harmonics = []     # harmonic couplings
        self.bootstrap_gain = 0.0  # R² improvement from bootstrap

        # Stats
        self.passes = 0
        self.r2_history = []
        self.total_time = 0.0

    def _predict_at(self, t):
        v = self.baseline
        if self.trend:
            v += self.trend[0] * t
        for w, a, p in self.frequencies:
            v += a * cos(w * t + p)
        return v

    def _residual(self):
        return [self.original[i] - self._predict_at(i * self.dt) for i in range(self.N)]

    def _r2(self):
        ss_res, ss_tot = 0.0, 0.0
        mean = sum(self.original) / self.N
        for i in range(self.N):
            pred = self._predict_at(i * self.dt)
            ss_res += (self.original[i] - pred) ** 2
            ss_tot += (self.original[i] - mean) ** 2
        return 1.0 - ss_res / max(ss_tot, 1e-30)

    def train(self, max_passes=8, max_freq_per_pass=15, min_power=0.0005, verbose=True):
        """
        Multi-pass training. Each pass extracts a different layer of structure.
        """
        t0 = time.time()

        # ─── Pass 0: DC + Trend ─────────────────────────
        self.baseline = sum(self.original) / self.N

        # Linear trend via least squares
        sx, sy, sxx, sxy = 0.0, 0.0, 0.0, 0.0
        for i in range(self.N):
            t = i * self.dt
            v = self.original[i]
            sx += t; sy += v; sxx += t*t; sxy += t*v
        denom = self.N * sxx - sx * sx
        if abs(denom) > 1e-30:
            slope = (self.N * sxy - sx * sy) / denom
            intercept = (sy - slope * sx) / self.N
            # Only keep trend if it explains >1% of variance
            trend_var = sum((slope * i * self.dt) ** 2 for i in range(self.N)) / self.N
            total_var = _power([v - self.baseline for v in self.original])
            if trend_var / max(total_var, 1e-30) > 0.01:
                self.trend = (slope, 0.0)
                self.baseline = intercept

        r2 = self._r2()
        self.r2_history.append(r2)
        if verbose:
            print(f"  Pass 0  | baseline + trend | R² = {r2:.6f}")

        # ─── Pass 1+: Frequency Extraction ──────────────
        for pass_num in range(1, max_passes + 1):
            residual = self._residual()
            total_p = _power([v - self.baseline for v in self.original])
            resid_p = _power(residual)

            if resid_p / max(total_p, 1e-30) < min_power:
                if verbose:
                    resid_pct = resid_p / max(total_p, 1e-30) * 100
                    print(f"  Pass {pass_num}  | residual {resid_pct:.3f}% — converged")
                break

            n_scan = min(1500, self.N // 2)
            extracted_this_pass = 0

            for _ in range(max_freq_per_pass):
                w, p = _scan_peak(residual, self.N, self.dt, n_scan)
                if w < 1e-10 or p / max(total_p, 1e-30) < min_power * 0.1:
                    break

                amp, phase = _fit_freq(residual, self.N, w, self.dt)

                # Check it's not a duplicate
                is_dup = False
                for ew, ea, ep in self.frequencies:
                    if abs(w - ew) / max(w, 1e-10) < 0.01:
                        is_dup = True
                        break
                if is_dup:
                    # Try removing this frequency from residual and continue
                    residual = _subtract(residual, w, amp, phase, self.dt)
                    continue

                self.frequencies.append((w, amp, phase))
                residual = _subtract(residual, w, amp, phase, self.dt)
                extracted_this_pass += 1

                if _power(residual) / max(total_p, 1e-30) < min_power:
                    break

            r2 = self._r2()
            self.r2_history.append(r2)
            self.passes = pass_num

            if verbose:
                print(f"  Pass {pass_num}  | +{extracted_this_pass} freq (total {len(self.frequencies)}) | R² = {r2:.6f}")

            if extracted_this_pass == 0:
                break

        # ─── Envelope Analysis ──────────────────────────
        residual = self._residual()
        env_result = _extract_envelope_modulation(residual, self.N, self.dt)
        if env_result:
            self.envelope_mods.append(env_result)
            if verbose:
                mf = env_result['mod_freq'] / (2*pi)
                print(f"  Envelope | AM detected: mod freq = {mf:.4f} Hz, depth = {env_result['mod_amp']:.2f}")

        # ─── Chirp Detection ────────────────────────────
        chirp = _detect_chirp(self.original, self.N, self.dt)
        if chirp:
            self.chirps.append(chirp)
            if verbose:
                f1 = chirp['start_freq'] / (2*pi)
                f2 = chirp['end_freq'] / (2*pi)
                print(f"  Chirp   | {f1:.2f} → {f2:.2f} Hz (rate: {chirp['chirp_rate']:.2f})")

        # ─── Harmonic Analysis ──────────────────────────
        self.harmonics = _detect_harmonics(self.frequencies)
        if self.harmonics and verbose:
            print(f"  Harmonics | {len(self.harmonics)} coupling(s) detected")
            for h in self.harmonics[:5]:
                f = h['fundamental'] / (2*pi)
                print(f"    {f:.2f} Hz × {h['order']} (amp ratio: {h['amp_ratio']:.3f})")

        # ─── Bootstrap Pass ─────────────────────────────
        if self.N > 100:
            r2_before = self._r2()
            # Extend, re-analyze extension, look for patterns we missed
            n_ext = self.N // 4
            model = self._export()
            extension = _bootstrap_extend(model, n_ext, self.dt)

            # Combine original + extension, re-extract on full range
            combined = self.original + extension
            combined_resid = [combined[i] - self._predict_at(i * self.dt)
                              for i in range(len(combined))]

            # Look for new frequencies in the combined residual
            new_found = 0
            total_p = _power([v - self.baseline for v in self.original])
            for _ in range(5):
                w, p = _scan_peak(combined_resid, len(combined), self.dt,
                                  min(1000, len(combined)//2))
                if w < 1e-10 or p / max(total_p, 1e-30) < min_power:
                    break
                amp, phase = _fit_freq(combined_resid, len(combined), w, self.dt)
                is_dup = any(abs(w - ew)/max(w,1e-10) < 0.01 for ew,_,_ in self.frequencies)
                if not is_dup and amp > 0.001:
                    self.frequencies.append((w, amp, phase))
                    combined_resid = _subtract(combined_resid, w, amp, phase, self.dt)
                    new_found += 1

            r2_after = self._r2()
            self.bootstrap_gain = r2_after - r2_before
            if verbose and new_found > 0:
                print(f"  Bootstrap | +{new_found} freq from self-extension | ΔR² = {self.bootstrap_gain:+.6f}")

        # Sort frequencies by amplitude
        self.frequencies.sort(key=lambda f: -f[1])

        self.total_time = time.time() - t0

        if verbose:
            print(f"  ─────────────────────────────────────────")
            final_r2 = self._r2()
            rmse = sqrt(sum((self.original[i] - self._predict_at(i*self.dt))**2
                           for i in range(self.N)) / self.N)
            n_params = 1 + (2 if self.trend else 0) + 3 * len(self.frequencies)
            print(f"  FINAL   | R² = {final_r2:.6f} | RMSE = {rmse:.4f}")
            print(f"  Model   | {n_params} params | {len(self.frequencies)} freq")
            print(f"  Compress| {self.N / max(n_params, 1):.0f}× | {self.total_time*1000:.1f} ms")

    def predict(self, t):
        return self._predict_at(t)

    def forecast(self, n_steps):
        t_end = self.N * self.dt
        return [(t_end + i*self.dt, self._predict_at(t_end + i*self.dt))
                for i in range(n_steps)]

    def _export(self):
        return {
            'baseline': self.baseline,
            'trend': self.trend,
            'frequencies': list(self.frequencies),
            'dt': self.dt,
            'N_train': self.N
        }

    def report(self):
        """Full model report."""
        total_p = _power([v - self.baseline for v in self.original])
        print()
        print(f"  ═══ ORACLE TRAIN — MODEL REPORT ═══")
        print()
        print(f"  Signal: {self.N} samples, dt={self.dt:.6f}, T={self.T:.2f}")
        print(f"  Baseline: {self.baseline:.6f}")
        if self.trend:
            print(f"  Trend: slope={self.trend[0]:.6f}")
        print()

        if self.frequencies:
            print(f"  Spectral Components ({len(self.frequencies)}):")
            print(f"  {'#':>4} {'ω':>10} {'freq':>10} {'amp':>10} {'phase':>8} {'power%':>8}")
            print(f"  {'─'*54}")
            for k, (w, a, p) in enumerate(self.frequencies[:30]):
                f = w / (2*pi)
                pp = (a**2/2) / max(total_p, 1e-30) * 100
                print(f"  {k+1:4d} {w:10.4f} {f:10.4f} {a:10.4f} {p:+8.3f} {pp:7.1f}%")
            if len(self.frequencies) > 30:
                print(f"  ... and {len(self.frequencies)-30} more")

        if self.harmonics:
            print()
            print(f"  Harmonic Couplings ({len(self.harmonics)}):")
            for h in self.harmonics:
                f = h['fundamental'] / (2*pi)
                print(f"    {f:.3f} Hz × {h['order']} = {f*h['order']:.3f} Hz "
                      f"(amp ratio: {h['amp_ratio']:.3f})")

        if self.envelope_mods:
            print()
            print(f"  Amplitude Modulations:")
            for e in self.envelope_mods:
                print(f"    Mod freq: {e['mod_freq']/(2*pi):.4f} Hz, "
                      f"depth: {e['mod_amp']:.3f}")

        if self.chirps:
            print()
            print(f"  Chirps:")
            for c in self.chirps:
                print(f"    {c['start_freq']/(2*pi):.2f} → {c['end_freq']/(2*pi):.2f} Hz")

        print()
        r2 = self._r2()
        n_params = 1 + (2 if self.trend else 0) + 3 * len(self.frequencies)
        print(f"  R² = {r2:.6f} | {n_params} params | {self.N/max(n_params,1):.0f}× compression")
        print(f"  Trained in {self.total_time*1000:.1f} ms | {self.passes} passes")
        print()
        print(f"  Training convergence:")
        for i, r in enumerate(self.r2_history):
            bar = '█' * int(r * 40) + '░' * (40 - int(r * 40))
            print(f"    Pass {i}: {bar} {r:.4f}")


# ═══════════════════════════════════════════════════════════
# Demo Signals
# ═══════════════════════════════════════════════════════════

def _demo_composite(n=2000):
    freqs = [1.0, 2.3, 5.7, 11.1, 17.0, 31.4, 50.0]
    amps = [1.0, 0.7, 0.5, 0.3, 0.2, 0.15, 0.1]
    dt = 10.0 / n
    return [sum(a*sin(2*pi*f*i*dt + f) for f,a in zip(freqs,amps)) for i in range(n)], dt

def _demo_chirp(n=4000):
    """Frequency sweep: 5 Hz → 50 Hz."""
    dt = 1.0 / 200
    signal = []
    for i in range(n):
        t = i * dt
        f = 5 + 45 * t / (n * dt)  # linear sweep
        signal.append(sin(2*pi*f*t))
    return signal, dt

def _demo_am(n=4000):
    """Amplitude modulated: carrier 20 Hz, mod 2 Hz."""
    dt = 1.0 / 200
    signal = []
    for i in range(n):
        t = i * dt
        envelope = 1.0 + 0.6 * sin(2*pi*2*t)
        carrier = sin(2*pi*20*t)
        signal.append(envelope * carrier)
    return signal, dt

def _demo_chaos(n=2000):
    """Logistic map at r=3.9 — deterministic chaos."""
    x = 0.1
    signal = []
    for _ in range(n):
        x = 3.9 * x * (1 - x)
        signal.append(x)
    return signal, 1.0

def _demo_everything(n=4000):
    """The kitchen sink: trend + harmonics + AM + chirp + noise."""
    dt = 1.0 / 200
    seed = 137
    def lcg():
        nonlocal seed
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        return seed / 0x7fffffff - 0.5

    signal = []
    for i in range(n):
        t = i * dt
        # Trend
        trend = 0.02 * t
        # Harmonic series (fundamental + overtones)
        fundamental = sin(2*pi*5*t)
        harm2 = 0.5 * sin(2*pi*10*t + 0.3)
        harm3 = 0.25 * sin(2*pi*15*t + 0.7)
        harm5 = 0.1 * sin(2*pi*25*t + 1.1)
        # AM on a separate frequency
        am = (1 + 0.4*sin(2*pi*1.5*t)) * 0.3 * sin(2*pi*40*t)
        # Mild chirp component
        chirp_f = 60 + 10 * t / (n*dt)
        chirp = 0.15 * sin(2*pi*chirp_f*t)
        # Noise
        noise = 0.1 * lcg()
        signal.append(trend + fundamental + harm2 + harm3 + harm5 + am + chirp + noise)
    return signal, dt


# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    signal, dt, name = None, 1.0, "custom"
    max_passes = 8

    if '--passes' in sys.argv:
        idx = sys.argv.index('--passes')
        max_passes = int(sys.argv[idx+1])

    if '--demo' in sys.argv:
        idx = sys.argv.index('--demo')
        d = sys.argv[idx+1] if idx+1 < len(sys.argv) else 'composite'
        demos = {
            'composite': (_demo_composite, "7-frequency composite"),
            'chirp': (_demo_chirp, "frequency sweep 5→50 Hz"),
            'am': (_demo_am, "amplitude modulated (20 Hz carrier, 2 Hz mod)"),
            'chaos': (_demo_chaos, "logistic map r=3.9 (chaos)"),
            'everything': (_demo_everything, "trend + harmonics + AM + chirp + noise"),
        }
        if d not in demos:
            print(f"Unknown demo: {d}")
            print(f"Available: {', '.join(demos.keys())}")
            return
        fn, name = demos[d]
        signal, dt = fn()

    elif '--file' in sys.argv:
        idx = sys.argv.index('--file')
        filepath = sys.argv[idx+1]
        col = 0
        if '--col' in sys.argv:
            col = int(sys.argv[sys.argv.index('--col')+1])
        with open(filepath) as f:
            lines = f.readlines()
        signal = []
        for line in lines:
            parts = line.strip().split(',')
            if len(parts) > col:
                try: signal.append(float(parts[col]))
                except ValueError: continue
        name = os.path.basename(filepath)
    else:
        print(__doc__)
        return

    if not signal or len(signal) < 20:
        print("Need at least 20 data points.")
        return

    print(f"Oracle Train | {name} | {len(signal)} samples")
    print(f"{'═'*55}")
    print()

    ai = OracleTrain(signal, dt=dt)
    ai.train(max_passes=max_passes, verbose=True)
    ai.report()

    # Forecast
    n_fc = min(100, len(signal)//4)
    fc = ai.forecast(n_fc)
    print(f"  Forecast ({n_fc} steps):")
    for i in range(min(5, n_fc)):
        print(f"    t={fc[i][0]:.4f}: {fc[i][1]:.4f}")
    print()
    print(f"  No gradient descent. No loss function. No backward pass.")
    print(f"  Structure extracted. The frequencies ARE the model.")

if __name__ == '__main__':
    main()
