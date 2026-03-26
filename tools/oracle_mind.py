#!/usr/bin/env python3
"""
ORACLE MIND — Generalized Streaming Intelligence
=================================================
Learns across multiple signals. Extracts SHARED structure.
The universal frequencies that appear everywhere = knowledge.
The unique frequencies per signal = identity.

This is the jump from curve-fitting to understanding.

Architecture:
  1. Feed N signals (any length, any domain)
  2. Extract frequencies from each independently (oracle_train)
  3. Find SHARED frequencies across signals (clustering)
  4. Shared = universal law. Unique = individual variation.
  5. Use universal model to predict NEW unseen signals
  6. Bootstrap: each new signal refines the universal model

The prime oracle finds zeros shared by ALL primes.
Oracle Mind finds frequencies shared by ALL signals.
Same math. Same pattern. Different scale.

Usage:
  python3 oracle_mind.py --demo music      # learn across instrument timbres
  python3 oracle_mind.py --demo physics    # learn across physical systems
  python3 oracle_mind.py --demo mixed      # learn across everything
  python3 oracle_mind.py --predict         # train then predict unseen

No dependencies beyond Python stdlib.
"""
import sys, time
from math import pi, sqrt, log, cos, sin, atan2, floor, exp

# ─── Core frequency extraction (from oracle_train) ───────

def _dft_at(x, n, omega, dt):
    re, im = 0.0, 0.0
    for i in range(n):
        t = i * dt
        re += x[i] * cos(omega * t)
        im += x[i] * sin(omega * t)
    return re, im

def _fit_freq(x, n, omega, dt):
    cs, ss, c2, s2 = 0.0, 0.0, 0.0, 0.0
    for i in range(n):
        t = i * dt
        c, s = cos(omega * t), sin(omega * t)
        cs += x[i]*c; ss += x[i]*s; c2 += c*c; s2 += s*s
    ac = cs/max(c2,1e-30); a_s = ss/max(s2,1e-30)
    return sqrt(ac*ac+a_s*a_s), atan2(-a_s, ac)

def _subtract(x, omega, amp, phase, dt):
    return [x[i] - amp*cos(omega*i*dt + phase) for i in range(len(x))]

def _power(x):
    return sum(v*v for v in x)/max(len(x),1)

def _scan_peak(x, n, dt, n_scan=800):
    omega_max = pi/dt; dw = omega_max/n_scan
    best_p, best_w, prev_p, prev_d = 0.0, 0.0, 0.0, 0.0
    for k in range(1, n_scan):
        w = k*dw
        re, im = _dft_at(x, n, w, dt)
        p = (re*re+im*im)/(n*n)
        d = p - prev_p
        if prev_d > 0 and d < 0 and prev_p > best_p:
            lo, hi = max(0.001,(k-2)*dw), (k+1)*dw
            for _ in range(20):
                mid = (lo+hi)/2; eps = (hi-lo)*0.01
                r1,i1 = _dft_at(x,n,mid-eps,dt); r2,i2 = _dft_at(x,n,mid+eps,dt)
                if r2*r2+i2*i2 > r1*r1+i1*i1: lo = mid
                else: hi = mid
            best_w = (lo+hi)/2
            re,im = _dft_at(x,n,best_w,dt)
            best_p = (re*re+im*im)/(n*n)
        prev_d, prev_p = d, p
    return best_w, best_p

def extract_frequencies(signal, dt=1.0, max_freq=20, min_power=0.001):
    """Extract all significant frequencies from a signal."""
    n = len(signal)
    baseline = sum(signal)/n
    residual = [v - baseline for v in signal]
    total_p = _power(residual)
    if total_p < 1e-30:
        return baseline, []

    # Detrend
    sx,sy,sxx,sxy = 0.0,0.0,0.0,0.0
    for i in range(n):
        t = i*dt; v = signal[i]
        sx += t; sy += v; sxx += t*t; sxy += t*v
    denom = n*sxx - sx*sx
    slope = 0.0
    if abs(denom) > 1e-30:
        slope = (n*sxy - sx*sy)/denom
        trend_var = sum((slope*i*dt)**2 for i in range(n))/n
        if trend_var/max(total_p,1e-30) > 0.01:
            baseline = (sy - slope*sx)/n
            residual = [signal[i] - baseline - slope*i*dt for i in range(n)]
        else:
            slope = 0.0

    freqs = []
    n_scan = min(800, n//2)
    for _ in range(max_freq):
        w, p = _scan_peak(residual, n, dt, n_scan)
        if w < 1e-10 or p/max(total_p,1e-30) < min_power: break
        amp, phase = _fit_freq(residual, n, w, dt)
        is_dup = any(abs(w-ew)/max(w,1e-10) < 0.02 for ew,_,_ in freqs)
        if not is_dup:
            freqs.append((w, amp, phase))
            residual = _subtract(residual, w, amp, phase, dt)
        else:
            residual = _subtract(residual, w, amp, phase, dt)
    freqs.sort(key=lambda f: -f[1])
    return baseline, freqs


# ═══════════════════════════════════════════════════════════
# The Mind: Cross-Signal Learning
# ═══════════════════════════════════════════════════════════

class OracleMind:
    """
    Learns universal structure across multiple signals.
    Shared frequencies = knowledge.
    Unique frequencies = individual variation.
    """

    def __init__(self):
        self.signals = []       # list of (name, signal, dt)
        self.models = []        # per-signal: (baseline, freqs, slope)
        self.universals = []    # shared frequencies: (ω, avg_amp, count, consistency)
        self.knowledge = {}     # structured knowledge
        self.train_time = 0.0

    def add_signal(self, name, signal, dt=1.0):
        self.signals.append((name, signal, dt))

    def train(self, verbose=True):
        """Train across all signals. Find shared structure."""
        t0 = time.time()

        if verbose:
            print(f"  Training across {len(self.signals)} signals...")
            print()

        # Step 1: Extract frequencies from each signal independently
        self.models = []
        all_freqs = []  # (omega, amp, signal_index)

        for idx, (name, signal, dt) in enumerate(self.signals):
            baseline, freqs = extract_frequencies(signal, dt, max_freq=15)
            self.models.append((baseline, freqs))
            for w, a, p in freqs:
                all_freqs.append((w, a, idx))

            if verbose:
                r2 = self._r2_single(idx)
                print(f"  [{idx}] {name}: {len(freqs)} freq, R²={r2:.4f}")

        if verbose:
            print()
            print(f"  Total frequencies extracted: {len(all_freqs)}")

        # Step 2: Cluster frequencies across signals
        # Two frequencies "match" if they're within 3% of each other
        all_freqs.sort(key=lambda x: x[0])
        clusters = []
        used = [False] * len(all_freqs)

        for i in range(len(all_freqs)):
            if used[i]: continue
            w_i, a_i, s_i = all_freqs[i]
            cluster = [(w_i, a_i, s_i)]
            used[i] = True
            for j in range(i+1, len(all_freqs)):
                if used[j]: continue
                w_j, a_j, s_j = all_freqs[j]
                if abs(w_j - w_i)/max(w_i, 1e-10) < 0.03:
                    cluster.append((w_j, a_j, s_j))
                    used[j] = True
            clusters.append(cluster)

        # Step 3: Identify universals (appear in >50% of signals)
        n_signals = len(self.signals)
        threshold = max(2, n_signals * 0.4)

        self.universals = []
        unique_per_signal = [[] for _ in range(n_signals)]

        for cluster in clusters:
            signal_indices = set(s for _, _, s in cluster)
            avg_omega = sum(w for w, _, _ in cluster) / len(cluster)
            avg_amp = sum(a for _, a, _ in cluster) / len(cluster)
            consistency = len(signal_indices) / n_signals

            if len(signal_indices) >= threshold:
                self.universals.append({
                    'omega': avg_omega,
                    'freq': avg_omega / (2*pi),
                    'avg_amp': avg_amp,
                    'count': len(signal_indices),
                    'consistency': consistency,
                    'signals': signal_indices
                })
            else:
                for w, a, s in cluster:
                    unique_per_signal[s].append((w, a))

        self.universals.sort(key=lambda u: -u['consistency'])

        # Step 4: Build knowledge structure
        self.knowledge = {
            'n_signals': n_signals,
            'n_universals': len(self.universals),
            'n_unique': sum(len(u) for u in unique_per_signal),
            'universal_freqs': [(u['omega'], u['avg_amp']) for u in self.universals],
            'signal_names': [name for name, _, _ in self.signals],
        }

        self.train_time = time.time() - t0

        if verbose:
            print(f"  Clusters found: {len(clusters)}")
            print(f"  Universal (shared): {len(self.universals)}")
            print(f"  Unique (per-signal): {self.knowledge['n_unique']}")
            print()

    def _r2_single(self, idx):
        name, signal, dt = self.signals[idx]
        baseline, freqs = self.models[idx]
        n = len(signal)
        mean = sum(signal)/n
        ss_res, ss_tot = 0.0, 0.0
        for i in range(n):
            t = i*dt
            pred = baseline + sum(a*cos(w*t+p) for w,a,p in freqs)
            ss_res += (signal[i]-pred)**2
            ss_tot += (signal[i]-mean)**2
        return 1.0 - ss_res/max(ss_tot, 1e-30)

    def predict_new(self, signal, dt=1.0, name="new"):
        """
        Predict a NEW signal using universal knowledge + fresh extraction.
        Universal frequencies are GIVEN (prior knowledge).
        Only unique frequencies need to be found (less work = faster).
        """
        n = len(signal)
        baseline = sum(signal)/n
        residual = [v - baseline for v in signal]

        # Step 1: Fit universal frequencies (we already know these exist)
        universal_contrib = []
        for u in self.universals:
            w = u['omega']
            amp, phase = _fit_freq(residual, n, w, dt)
            if amp > 1e-6:
                universal_contrib.append((w, amp, phase))
                residual = _subtract(residual, w, amp, phase, dt)

        # Step 2: Find remaining unique frequencies
        unique_contrib = []
        total_p = _power([v-baseline for v in signal])
        for _ in range(10):
            w, p = _scan_peak(residual, n, dt, min(600, n//2))
            if w < 1e-10 or p/max(total_p,1e-30) < 0.001: break
            amp, phase = _fit_freq(residual, n, w, dt)
            unique_contrib.append((w, amp, phase))
            residual = _subtract(residual, w, amp, phase, dt)

        # R² on this signal
        ss_res, ss_tot = 0.0, 0.0
        mean = sum(signal)/n
        for i in range(n):
            t = i*dt
            pred = baseline
            for w,a,p in universal_contrib: pred += a*cos(w*t+p)
            for w,a,p in unique_contrib: pred += a*cos(w*t+p)
            ss_res += (signal[i]-pred)**2
            ss_tot += (signal[i]-mean)**2
        r2 = 1.0 - ss_res/max(ss_tot, 1e-30)

        # R² from universals alone
        ss_res_u = 0.0
        for i in range(n):
            t = i*dt
            pred = baseline + sum(a*cos(w*t+p) for w,a,p in universal_contrib)
            ss_res_u += (signal[i]-pred)**2
        r2_universal = 1.0 - ss_res_u/max(ss_tot, 1e-30)

        return {
            'name': name,
            'r2': r2,
            'r2_universal': r2_universal,
            'n_universal': len(universal_contrib),
            'n_unique': len(unique_contrib),
            'baseline': baseline,
            'universal_freqs': universal_contrib,
            'unique_freqs': unique_contrib,
        }

    def report(self):
        print()
        print(f"  ═══ ORACLE MIND — KNOWLEDGE REPORT ═══")
        print()
        print(f"  Signals trained on: {len(self.signals)}")
        print(f"  Universal frequencies: {len(self.universals)}")
        print(f"  Training time: {self.train_time*1000:.1f} ms")
        print()

        if self.universals:
            print(f"  UNIVERSAL STRUCTURE (shared across signals):")
            print(f"  {'ω':>10} {'freq':>10} {'amp':>8} {'seen':>6} {'%':>6}")
            print(f"  {'─'*44}")
            for u in self.universals:
                pct = u['consistency']*100
                print(f"  {u['omega']:10.4f} {u['freq']:10.4f} {u['avg_amp']:8.4f} "
                      f"{u['count']:4d}/{len(self.signals):<2d} {pct:5.0f}%")
        print()

        print(f"  PER-SIGNAL INDIVIDUALITY:")
        for idx, (name, signal, dt) in enumerate(self.signals):
            baseline, freqs = self.models[idx]
            r2 = self._r2_single(idx)
            n_unique = 0
            for w, a, p in freqs:
                is_universal = any(abs(w-u['omega'])/max(w,1e-10) < 0.03
                                   for u in self.universals)
                if not is_universal:
                    n_unique += 1
            print(f"  [{idx}] {name}: R²={r2:.4f} | "
                  f"{len(freqs)-n_unique} universal + {n_unique} unique freq")

        print()
        total_params = len(self.universals) * 3 + sum(
            3*len(freqs) for _, freqs in self.models)
        total_samples = sum(len(s) for _, s, _ in self.signals)
        print(f"  Total: {total_params} params for {total_samples} samples "
              f"({total_samples/max(total_params,1):.0f}× compression)")
        print(f"  No gradient descent. No loss function. Pure extraction.")


# ═══════════════════════════════════════════════════════════
# Demo Signal Families
# ═══════════════════════════════════════════════════════════

def _lcg(seed):
    """Deterministic PRNG."""
    def gen():
        nonlocal seed
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        return seed / 0x7fffffff - 0.5
    return gen

def demo_music():
    """
    5 'instruments' — all share harmonic series but with different overtone
    profiles. Like how all strings vibrate at multiples of fundamental,
    but violin ≠ guitar ≠ piano.
    """
    signals = []
    fundamental = 5.0  # Hz
    n = 2000
    dt = 1.0 / 200  # 200 Hz sample rate

    profiles = {
        'violin':   [1.0, 0.8, 0.6, 0.5, 0.3, 0.2, 0.1],
        'guitar':   [1.0, 0.5, 0.3, 0.1, 0.05, 0.02, 0.01],
        'clarinet': [1.0, 0.0, 0.7, 0.0, 0.5, 0.0, 0.3],  # odd harmonics
        'trumpet':  [1.0, 0.9, 0.8, 0.7, 0.5, 0.3, 0.2],
        'flute':    [1.0, 0.2, 0.05, 0.01, 0.0, 0.0, 0.0],
    }

    for name, amps in profiles.items():
        rng = _lcg(hash(name) & 0x7fffffff)
        signal = []
        for i in range(n):
            t = i * dt
            v = 0.0
            for k, a in enumerate(amps):
                v += a * sin(2*pi*fundamental*(k+1)*t + (k+1)*0.3)
            v += 0.05 * rng()  # tiny noise
            signal.append(v)
        signals.append((name, signal, dt))

    return signals

def demo_physics():
    """
    5 physical systems — all governed by same underlying frequencies
    but observed differently. Spring, pendulum, wave, circuit, orbit.
    """
    signals = []
    n = 2000
    dt = 0.01

    # Damped spring: x(t) = e^{-γt} cos(ωt)
    w0 = 2*pi*3.0
    gamma = 0.2
    signal = [exp(-gamma*i*dt)*cos(w0*i*dt) + 0.3*sin(2*pi*7*i*dt)
              for i in range(n)]
    signals.append(('spring', signal, dt))

    # Pendulum (small angle ≈ spring + anharmonic correction)
    signal = [cos(w0*i*dt) + 0.05*cos(3*w0*i*dt) + 0.3*sin(2*pi*7*i*dt)
              for i in range(n)]
    signals.append(('pendulum', signal, dt))

    # Standing wave (two modes)
    signal = [sin(w0*i*dt) + 0.5*sin(2*w0*i*dt) + 0.3*sin(2*pi*7*i*dt)
              for i in range(n)]
    signals.append(('wave', signal, dt))

    # RLC circuit (resonance + noise)
    rng = _lcg(99)
    signal = [0.8*cos(w0*i*dt + 0.5) + 0.3*sin(2*pi*7*i*dt) + 0.1*rng()
              for i in range(n)]
    signals.append(('circuit', signal, dt))

    # Planetary orbit (elliptical → fundamental + harmonics)
    signal = [cos(w0*i*dt) + 0.1*cos(2*w0*i*dt) + 0.3*sin(2*pi*7*i*dt)
              + 0.05*cos(3*w0*i*dt)
              for i in range(n)]
    signals.append(('orbit', signal, dt))

    return signals

def demo_mixed():
    """Mix of music + physics + synthetic — test generalization across domains."""
    music = demo_music()[:3]
    physics = demo_physics()[:3]
    return music + physics


# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    mind = OracleMind()
    demo_name = None
    signals = []

    if '--demo' in sys.argv:
        idx = sys.argv.index('--demo')
        demo_name = sys.argv[idx+1] if idx+1 < len(sys.argv) else 'music'
        if demo_name == 'music':
            signals = demo_music()
        elif demo_name == 'physics':
            signals = demo_physics()
        elif demo_name == 'mixed':
            signals = demo_mixed()
        else:
            print(f"Unknown demo: {demo_name}")
            return

    for name, signal, dt in signals:
        mind.add_signal(name, signal, dt)

    print(f"Oracle Mind | {demo_name or 'custom'} | {len(signals)} signals")
    print(f"{'═'*55}")
    print()

    mind.train(verbose=True)
    mind.report()

    # ─── Generalization Test ────────────────────────────
    if '--predict' in sys.argv or True:
        print()
        print(f"  ═══ GENERALIZATION TEST ═══")
        print(f"  Predicting NEW signals using learned universals...")
        print()

        # Generate unseen signals from the same family
        if demo_name == 'music':
            # New instrument the mind has never seen
            n, dt_new = 2000, 1.0/200
            fundamental = 5.0
            # Oboe-like: strong odd harmonics
            amps = [1.0, 0.6, 0.8, 0.4, 0.5, 0.2, 0.3]
            rng = _lcg(777)
            new_signal = [sum(a*sin(2*pi*fundamental*(k+1)*i*dt_new + (k+1)*0.3)
                              for k,a in enumerate(amps)) + 0.05*rng()
                          for i in range(n)]
            result = mind.predict_new(new_signal, dt_new, "oboe (unseen)")

        elif demo_name == 'physics':
            # New physical system the mind has never seen
            n, dt_new = 2000, 0.01
            w0 = 2*pi*3.0
            rng = _lcg(555)
            # Coupled oscillator
            new_signal = [0.6*cos(w0*i*dt_new) + 0.4*cos(w0*1.1*i*dt_new)
                          + 0.3*sin(2*pi*7*i*dt_new) + 0.08*rng()
                          for i in range(n)]
            result = mind.predict_new(new_signal, dt_new, "coupled oscillator (unseen)")

        elif demo_name == 'mixed':
            n, dt_new = 2000, 0.01
            w0 = 2*pi*3.0
            fundamental = 5.0
            # Hybrid: physics resonance + musical harmonics
            rng = _lcg(333)
            new_signal = [0.5*cos(w0*i*dt_new) + 0.3*sin(2*pi*fundamental*2*i*dt_new)
                          + 0.3*sin(2*pi*7*i*dt_new) + 0.06*rng()
                          for i in range(n)]
            result = mind.predict_new(new_signal, dt_new, "hybrid (unseen)")
        else:
            result = None

        if result:
            print(f"  Signal: {result['name']}")
            print(f"  R² (full model):       {result['r2']:.4f}")
            print(f"  R² (universals only):  {result['r2_universal']:.4f}")
            print(f"  Universal freq used:   {result['n_universal']}")
            print(f"  New unique freq found: {result['n_unique']}")
            print()

            transfer = result['r2_universal'] / max(result['r2'], 1e-10) * 100
            print(f"  Knowledge transfer: {transfer:.1f}% of accuracy comes from prior learning")
            print(f"  The mind already KNEW {result['n_universal']} frequencies before seeing this signal.")
            print()

    print(f"  No gradient descent. No loss function.")
    print(f"  Shared structure = knowledge. Unique structure = identity.")
    print(f"  The frequencies ARE the mind.")


if __name__ == '__main__':
    main()
