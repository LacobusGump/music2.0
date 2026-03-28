# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
LISTEN — Prime Signal Scanner
===============================
The oracle detects primes from pure math.
This tool detects prime PATTERNS in any signal.

If intelligence exists above us, it speaks in structure.
The simplest structure that proves intelligence: primes.
No natural process produces only primes.

What this does:
  1. Takes any signal (audio, radio, or raw data)
  2. Extracts spectral peaks via FFT
  3. Tests whether peak intervals encode primes
  4. Scores the signal's "mathematical intent"

What a prime signal looks like:
  - Pulses at intervals of 2, 3, 5, 7, 11, 13...
  - Spectral peaks at prime-frequency ratios
  - Phase coherence at prime harmonics only

Usage:
  python3 listen.py --generate          # create a prime beacon signal (what to look for)
  python3 listen.py --scan file.wav     # scan any audio for prime patterns
  python3 listen.py --scan file.raw     # scan raw float data
  python3 listen.py --hydrogen          # scan the hydrogen line (1420.405 MHz)
  python3 listen.py --live              # continuous scan mode (microphone)

Grand Unified Music Project — March 2026
"""

import sys, os, math, struct, time, json
from math import pi, sqrt, log, cos, sin, floor, ceil

# ═══════════════════════════════════════════════════════════
# THE PRIME DETECTOR — from the Oracle
# ═══════════════════════════════════════════════════════════

def is_prime(n):
    """Deterministic primality test."""
    if n < 2: return False
    if n < 4: return True
    if n % 2 == 0 or n % 3 == 0: return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0: return False
        i += 6
    return True

PRIMES_100 = [p for p in range(2, 550) if is_prime(p)]  # first 100 primes

def prime_sequence_score(intervals, tolerance=0.2):
    """
    Given a sequence of intervals between peaks,
    test how well they match prime numbers.

    Strategy: try multiple possible base units.
    The right base unit makes every interval a prime.

    Returns: (score 0-1, matched_primes, total_tested)
    """
    if len(intervals) < 3:
        return 0.0, [], 0

    positive = [i for i in intervals if i > 0]
    if not positive:
        return 0.0, [], 0

    best_score = 0
    best_primes = []
    best_tested = 0

    # Try multiple base units: each interval / each small prime
    candidates = set()
    for iv in positive:
        for p in [2, 3, 5, 7, 11, 13]:
            candidates.add(iv / p)
    # Also try the smallest interval itself
    candidates.add(min(positive))
    # And GCD-style: smallest / 2
    candidates.add(min(positive) / 2)

    for base in candidates:
        if base <= 0: continue
        normalized = [i / base for i in positive]

        matched = []
        tested = 0

        for val in normalized:
            nearest_int = round(val)
            if nearest_int < 2 or nearest_int > 100: continue
            tested += 1

            if abs(val - nearest_int) / max(nearest_int, 1) < tolerance:
                if is_prime(nearest_int):
                    matched.append(nearest_int)

        if tested == 0: continue
        score = len(matched) / tested

        if score > best_score:
            best_score = score
            best_primes = matched
            best_tested = tested

    return best_score, best_primes, best_tested

def prime_ratio_score(frequencies):
    """
    Test whether frequency RATIOS are prime.
    A civilization might encode primes as ratios, not intervals.
    """
    if len(frequencies) < 2:
        return 0.0, []

    f0 = min(f for f in frequencies if f > 0)
    ratios = sorted(set(round(f / f0, 1) for f in frequencies if f > 0))

    prime_ratios = []
    tested = 0
    for r in ratios:
        nearest = round(r)
        if nearest < 2: continue
        tested += 1
        if abs(r - nearest) < 0.2 and is_prime(nearest):
            prime_ratios.append(nearest)

    if tested == 0:
        return 0.0, []

    return len(prime_ratios) / tested, prime_ratios


# ═══════════════════════════════════════════════════════════
# FFT — pure Python (no numpy needed)
# ═══════════════════════════════════════════════════════════

def fft(x):
    """Cooley-Tukey FFT. Input length must be power of 2."""
    N = len(x)
    if N <= 1: return x
    if N % 2 != 0:
        # Pad to next power of 2
        N2 = 1
        while N2 < N: N2 *= 2
        x = list(x) + [0] * (N2 - N)
        N = N2

    even = fft(x[0::2])
    odd = fft(x[1::2])

    T = [complex(cos(-2*pi*k/N), sin(-2*pi*k/N)) * odd[k] for k in range(N//2)]
    return [even[k] + T[k] for k in range(N//2)] + [even[k] - T[k] for k in range(N//2)]

def find_spectral_peaks(data, sample_rate=1.0, n_peaks=50, min_prominence=0.1):
    """FFT → power spectrum → peak detection."""
    # Pad to power of 2
    N = len(data)
    N2 = 1
    while N2 < N: N2 *= 2
    padded = list(data) + [0.0] * (N2 - N)

    # Apply Hann window
    for i in range(N):
        padded[i] *= 0.5 * (1 - cos(2*pi*i/(N-1)))

    # FFT
    spectrum = fft(padded)

    # Power spectrum (first half)
    power = [abs(spectrum[i])**2 for i in range(N2//2)]
    max_power = max(power) if power else 1
    if max_power == 0: max_power = 1
    power = [p / max_power for p in power]

    # Frequency axis
    freqs = [i * sample_rate / N2 for i in range(N2//2)]

    # Find peaks (simple: higher than both neighbors)
    peaks = []
    for i in range(2, len(power) - 2):
        if (power[i] > power[i-1] and power[i] > power[i+1] and
            power[i] > power[i-2] and power[i] > power[i+2] and
            power[i] > min_prominence):
            peaks.append((freqs[i], power[i]))

    # Sort by power, take top n
    peaks.sort(key=lambda x: -x[1])
    return peaks[:n_peaks]


# ═══════════════════════════════════════════════════════════
# GENERATE — what a prime beacon sounds like
# ═══════════════════════════════════════════════════════════

def generate_prime_beacon(filename='prime_beacon.wav', duration=10, sample_rate=44100):
    """
    Generate an audio file encoding the first 25 primes.

    Method: pulse at time intervals proportional to primes.
    Each pulse is a short sine burst at the hydrogen line
    frequency (scaled down to audio: 1420.405 Hz).

    This is what we're listening FOR.
    """
    hydrogen_audio = 1420.405  # Hz — the hydrogen line, scaled to audio

    samples = int(duration * sample_rate)
    data = [0.0] * samples

    # Encode primes as pulse times
    # Base unit = 0.15 seconds
    base = 0.15
    current_time = 0.5  # start after 0.5s

    primes_used = []
    for p in PRIMES_100[:25]:
        pulse_time = current_time
        pulse_start = int(pulse_time * sample_rate)
        pulse_duration = int(0.05 * sample_rate)  # 50ms pulse

        if pulse_start + pulse_duration >= samples:
            break

        # Sine burst at hydrogen frequency
        for i in range(pulse_duration):
            t = i / sample_rate
            envelope = sin(pi * i / pulse_duration)  # smooth envelope
            data[pulse_start + i] += envelope * sin(2 * pi * hydrogen_audio * t) * 0.5

        primes_used.append(p)
        current_time += p * base  # next pulse at prime interval

    # Also encode primes as simultaneous frequencies
    # f_n = base_freq × prime_n
    base_freq = 100  # Hz
    for i, p in enumerate(PRIMES_100[:12]):
        freq = base_freq * p
        amp = 0.08 / (i + 1)  # decreasing amplitude
        for s in range(samples):
            t = s / sample_rate
            data[s] += amp * sin(2 * pi * freq * t)

    # Normalize
    mx = max(abs(d) for d in data) or 1
    data = [d / mx * 0.9 for d in data]

    # Write WAV
    write_wav(filename, data, sample_rate)

    print(f"  Generated: {filename}")
    print(f"  Duration:  {duration}s at {sample_rate} Hz")
    print(f"  Encoding:  {len(primes_used)} primes as pulse intervals")
    print(f"  Primes:    {primes_used}")
    print(f"  Carrier:   {hydrogen_audio} Hz (hydrogen line)")
    print(f"  Harmonics: first 12 primes × {base_freq} Hz")
    print()
    print(f"  This is the signature. If it exists in nature, it's not nature.")

    return primes_used


def write_wav(filename, data, sample_rate):
    """Write mono 16-bit WAV."""
    n = len(data)
    with open(filename, 'wb') as f:
        # Header
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + n * 2))
        f.write(b'WAVE')
        f.write(b'fmt ')
        f.write(struct.pack('<IHHIIHH', 16, 1, 1, sample_rate, sample_rate * 2, 2, 16))
        f.write(b'data')
        f.write(struct.pack('<I', n * 2))
        for d in data:
            sample = max(-32768, min(32767, int(d * 32767)))
            f.write(struct.pack('<h', sample))


# ═══════════════════════════════════════════════════════════
# SCAN — look for prime patterns in any signal
# ═══════════════════════════════════════════════════════════

def read_wav(filename):
    """Read mono WAV file, return (data, sample_rate)."""
    with open(filename, 'rb') as f:
        riff = f.read(4)
        if riff != b'RIFF':
            raise ValueError("Not a WAV file")
        f.read(4)  # size
        wave = f.read(4)
        if wave != b'WAVE':
            raise ValueError("Not a WAV file")

        sample_rate = 44100
        channels = 1
        bits = 16
        data = []

        while True:
            chunk_id = f.read(4)
            if len(chunk_id) < 4: break
            chunk_size = struct.unpack('<I', f.read(4))[0]

            if chunk_id == b'fmt ':
                fmt_data = f.read(chunk_size)
                fmt = struct.unpack('<HHIIHH', fmt_data[:16])
                channels = fmt[1]
                sample_rate = fmt[2]
                bits = fmt[5]
            elif chunk_id == b'data':
                raw = f.read(chunk_size)
                if bits == 16:
                    n_samples = len(raw) // 2
                    samples = struct.unpack('<' + 'h' * n_samples, raw)
                    # Take first channel only
                    if channels > 1:
                        samples = samples[::channels]
                    data = [s / 32768.0 for s in samples]
                elif bits == 8:
                    data = [(b - 128) / 128.0 for b in raw]
                break
            else:
                f.read(chunk_size)

    return data, sample_rate


def energy_onsets(data, sample_rate, window_ms=50, hop_ms=10, threshold_factor=3.0):
    """
    Energy-based onset detection. Immune to noise.
    Computes energy in sliding windows, detects sharp increases.
    """
    win = int(window_ms * sample_rate / 1000)
    hop = int(hop_ms * sample_rate / 1000)
    onsets = []

    # Compute energy curve
    energies = []
    times = []
    for start in range(0, len(data) - win, hop):
        e = sum(d*d for d in data[start:start+win]) / win
        energies.append(e)
        times.append(start / sample_rate)

    if len(energies) < 5:
        return []

    # Running median for adaptive threshold
    median_win = 20
    for i in range(median_win, len(energies)):
        window = sorted(energies[i-median_win:i])
        median = window[len(window)//2]
        if median == 0: median = 1e-10

        # Onset = energy spike well above local median
        if energies[i] > median * threshold_factor and energies[i] > energies[i-1] * 1.5:
            # Don't double-count (minimum 80ms between onsets)
            if not onsets or times[i] - onsets[-1] > 0.08:
                onsets.append(times[i])

    return onsets


def scan_signal(data, sample_rate=44100, verbose=True):
    """
    The scanner. Takes signal data, returns intelligence score.

    Tests:
    1. Spectral peaks → prime frequency ratios?
    2. Energy onsets → prime time intervals?
    3. Hydrogen line presence?
    4. Zeta zero encoding?
    5. Combined score
    """
    results = {}

    if verbose:
        print(f"  Scanning {len(data)} samples at {sample_rate} Hz...")
        print(f"  Duration: {len(data)/sample_rate:.1f}s")
        print()

    # ─── TEST 1: Spectral prime ratios ───
    if verbose: print("  Test 1: Spectral prime ratios")

    # Use large chunks for frequency resolution, high prominence
    chunk_size = min(len(data), 16384)
    all_peaks = []

    for start in range(0, len(data) - chunk_size, chunk_size):
        chunk = data[start:start + chunk_size]
        peaks = find_spectral_peaks(chunk, sample_rate, n_peaks=15, min_prominence=0.2)
        all_peaks.extend(peaks)

    # Deduplicate (merge within 3 Hz)
    merged = []
    if all_peaks:
        all_peaks.sort(key=lambda x: x[0])
        merged = [all_peaks[0]]
        for f, p in all_peaks[1:]:
            if abs(f - merged[-1][0]) < 3:
                if p > merged[-1][1]:
                    merged[-1] = (f, p)
            else:
                merged.append((f, p))

        # Only keep genuinely strong peaks (top 20 by power)
        merged.sort(key=lambda x: -x[1])
        merged = merged[:20]
        merged.sort(key=lambda x: x[0])

        peak_freqs = [f for f, p in merged]

        ratio_score, prime_ratios = prime_ratio_score(peak_freqs)
        results['spectral_ratio_score'] = ratio_score
        results['spectral_prime_ratios'] = prime_ratios

        if verbose:
            print(f"    Strong peaks: {len(merged)}")
            print(f"    Frequencies: {[f'{f:.1f}' for f,_ in merged[:10]]}")
            print(f"    Prime ratios: {prime_ratios}")
            print(f"    Score: {ratio_score:.2%}")
    else:
        results['spectral_ratio_score'] = 0
        results['spectral_prime_ratios'] = []
        if verbose: print("    No peaks found")

    print()

    # ─── TEST 2: Temporal prime intervals (energy-based) ───
    if verbose: print("  Test 2: Temporal prime intervals")

    onsets = energy_onsets(data, sample_rate, window_ms=30, hop_ms=5, threshold_factor=4.0)

    if len(onsets) >= 4:
        intervals = [onsets[i+1] - onsets[i] for i in range(len(onsets)-1)]

        interval_score, matched_primes, tested = prime_sequence_score(intervals)
        results['interval_score'] = interval_score
        results['interval_primes'] = matched_primes

        if verbose:
            print(f"    Energy onsets: {len(onsets)}")
            print(f"    Intervals (s): {[f'{i:.3f}' for i in intervals[:20]]}")
            print(f"    Prime matches: {matched_primes}")
            print(f"    Score: {interval_score:.2%}")
    else:
        results['interval_score'] = 0
        results['interval_primes'] = []
        if verbose: print(f"    Onsets found: {len(onsets)} (need ≥4)")

    print()

    # ─── TEST 3: Hydrogen line presence ───
    if verbose: print("  Test 3: Hydrogen line signature")

    hydrogen = 1420.405
    hydrogen_found = False
    hydrogen_power = 0

    if merged:
        for f, p in merged:
            for harmonic in [1, 2, 3, 4, 5]:
                target = hydrogen / harmonic
                if abs(f - target) < 2:
                    hydrogen_found = True
                    hydrogen_power = max(hydrogen_power, p)
                    if verbose: print(f"    ◆ HYDROGEN at {f:.1f} Hz (÷{harmonic}, power {p:.3f})")

    results['hydrogen_detected'] = hydrogen_found
    results['hydrogen_power'] = hydrogen_power

    if not hydrogen_found and verbose:
        print("    No hydrogen signature")

    print()

    # ─── TEST 4: Zeta zero encoding ───
    if verbose: print("  Test 4: Zeta zero signature")

    # The first few zeta zeros (imaginary parts)
    ZETA_ZEROS = [14.135, 21.022, 25.011, 30.425, 32.935, 37.586, 40.919, 43.327, 48.005, 49.774]
    zeta_matches = 0
    zeta_tested = 0

    if len(onsets) >= 4:
        # Check if intervals encode zeta zeros
        intervals_norm = intervals[:len(ZETA_ZEROS)]
        if intervals_norm:
            base = min(i for i in intervals_norm if i > 0)
            normalized = [i/base for i in intervals_norm]

            for i, val in enumerate(normalized):
                if i >= len(ZETA_ZEROS): break
                zeta_tested += 1
                target = ZETA_ZEROS[i] / ZETA_ZEROS[0]  # normalize to first zero
                if abs(val - target) / max(target, 0.01) < 0.2:
                    zeta_matches += 1

    zeta_score = zeta_matches / max(zeta_tested, 1)
    results['zeta_score'] = zeta_score
    results['zeta_matches'] = zeta_matches

    if verbose:
        if zeta_tested > 0:
            print(f"    Tested: {zeta_tested} intervals against ζ zeros")
            print(f"    Matches: {zeta_matches}")
            print(f"    Score: {zeta_score:.2%}")
            if zeta_score > 0.5:
                print(f"    ◆◆◆ ZETA ZEROS DETECTED — this is the deepest handshake ◆◆◆")
        else:
            print("    Not enough onsets for zeta test")

    print()

    # ─── COMBINED SCORE ───
    spectral_w = 0.3
    interval_w = 0.3
    hydrogen_w = 0.15
    zeta_w = 0.25

    combined = (
        results.get('spectral_ratio_score', 0) * spectral_w +
        results.get('interval_score', 0) * interval_w +
        (1.0 if hydrogen_found else 0.0) * hydrogen_w +
        results.get('zeta_score', 0) * zeta_w
    )

    results['combined_score'] = combined

    if combined > 0.7:
        classification = "◆◆◆ STRONG MATHEMATICAL STRUCTURE — investigate immediately ◆◆◆"
    elif combined > 0.4:
        classification = "◆ Possible mathematical encoding — interesting"
    elif combined > 0.15:
        classification = "Weak patterns — likely natural"
    else:
        classification = "No mathematical structure detected — noise"

    results['classification'] = classification

    if verbose:
        print("  ═══════════════════════════════════")
        print(f"  Combined score:  {combined:.2%}")
        print(f"  Classification:  {classification}")
        print("  ═══════════════════════════════════")

    return results


# ═══════════════════════════════════════════════════════════
# HYDROGEN LINE — simulated receiver
# ═══════════════════════════════════════════════════════════

def scan_hydrogen(duration=30, verbose=True):
    """
    Simulate receiving at the hydrogen line.

    We can't tune to 1420 MHz from a Mac Mini.
    But we can:
    1. Generate what the hydrogen line SOUNDS like (noise + 21cm emission)
    2. Inject what a prime signal WOULD look like at that frequency
    3. Test whether our scanner can detect it
    4. Establish the detection threshold

    When we get real data (RTL-SDR, Breakthrough Listen archive),
    this same scanner processes it.
    """
    sample_rate = 44100
    samples = int(duration * sample_rate)

    if verbose:
        print("  Hydrogen Line Receiver (1420.405 MHz)")
        print("  ─────────────────────────────────────")
        print(f"  Simulated integration: {duration}s")
        print()

    # Cosmic background noise (Gaussian)
    import random
    noise = [random.gauss(0, 0.3) for _ in range(samples)]

    # The hydrogen line emission (narrow peak)
    hydrogen_audio = 1420.405  # scaled to audio
    for i in range(samples):
        t = i / sample_rate
        noise[i] += 0.05 * sin(2 * pi * hydrogen_audio * t)  # weak natural emission

    if verbose:
        print("  Scanning natural hydrogen emission...")
        print()

    natural_results = scan_signal(noise, sample_rate, verbose=verbose)

    print()
    print("  Now injecting prime beacon into hydrogen band...")
    print()

    # Inject a prime signal (as if an intelligence is transmitting)
    signal = list(noise)  # copy
    base = 0.15
    current_time = 1.0
    for p in PRIMES_100[:20]:
        pulse_start = int(current_time * sample_rate)
        pulse_len = int(0.03 * sample_rate)
        if pulse_start + pulse_len >= samples: break
        for i in range(pulse_len):
            t = i / sample_rate
            env = sin(pi * i / pulse_len)
            signal[pulse_start + i] += env * sin(2 * pi * hydrogen_audio * t) * 0.4
        current_time += p * base

    # Also add prime frequency harmonics
    for i, p in enumerate(PRIMES_100[:8]):
        freq = hydrogen_audio / 10 * p  # prime multiples of H/10
        amp = 0.06 / (i + 1)
        for s in range(samples):
            t = s / sample_rate
            signal[s] += amp * sin(2 * pi * freq * t)

    beacon_results = scan_signal(signal, sample_rate, verbose=verbose)

    print()
    print("  ═══════════════════════════════════════════════")
    print("  COMPARISON")
    print(f"  Natural noise:     {natural_results['combined_score']:.2%}")
    print(f"  With prime beacon: {beacon_results['combined_score']:.2%}")
    print(f"  Detection delta:   {beacon_results['combined_score'] - natural_results['combined_score']:.2%}")
    print()

    if beacon_results['combined_score'] > natural_results['combined_score'] + 0.15:
        print("  The scanner WORKS. It distinguishes mathematical")
        print("  structure from cosmic noise. When we get real data,")
        print("  the same math applies.")
    else:
        print("  Detection threshold needs tuning.")

    print()
    print("  Next: point this at real data.")
    print("  Sources: Breakthrough Listen archive, RTL-SDR, GBT public releases.")
    print("  The math is ready. The data is waiting.")

    return natural_results, beacon_results


# ═══════════════════════════════════════════════════════════
# LIVE MODE — listen through microphone
# ═══════════════════════════════════════════════════════════

def live_scan():
    """
    Continuous scan mode.
    Requires pyaudio (pip install pyaudio) for mic input.
    Falls back to reading stdin as raw audio.
    """
    print("  LIVE SCAN MODE")
    print("  ──────────────")

    try:
        import pyaudio
        pa = pyaudio.PyAudio()
        stream = pa.open(format=pyaudio.paFloat32, channels=1,
                        rate=44100, input=True, frames_per_buffer=8192)

        print("  Listening... (Ctrl+C to stop)")
        print()

        while True:
            raw = stream.read(8192, exception_on_overflow=False)
            data = list(struct.unpack('f' * 8192, raw))

            peaks = find_spectral_peaks(data, 44100, n_peaks=15, min_prominence=0.1)
            if peaks:
                freqs = [f for f, p in peaks]
                score, primes = prime_ratio_score(freqs)

                bar = '█' * int(score * 40)
                status = f"  Score: {score:.0%} {bar}"
                if primes:
                    status += f"  primes: {primes[:5]}"

                # Check hydrogen
                for f, p in peaks:
                    if abs(f - 1420.405) < 3:
                        status += "  ◆ HYDROGEN"

                print(f"\r{status:<80}", end='', flush=True)

            time.sleep(0.05)

    except ImportError:
        print("  pyaudio not installed. Install with: pip install pyaudio")
        print("  Or pipe raw audio: sox input.wav -t raw -r 44100 -e float -b 32 - | python3 listen.py --live")
    except KeyboardInterrupt:
        print("\n\n  Scan stopped.")


# ═══════════════════════════════════════════════════════════
# TARGETS — where to point first
# ═══════════════════════════════════════════════════════════

def show_targets():
    """The most probable targets, ranked by physics."""
    print("""
  ═══ WHERE TO LISTEN ═══

  The question isn't whether intelligence exists.
  The question is which frequency, which direction, which encoding.

  Physics constrains the answer:

  FREQUENCY (from lowest noise to highest information):
  ┌─────────────────────────────────────────────────────┐
  │ 1. Water Hole: 1420-1662 MHz                        │
  │    H + OH = H₂O. Cosmic noise minimum.              │
  │    Every radio civilization finds this.              │
  │                                                     │
  │ 2. Hydrogen ×π: 4462.336 MHz                        │
  │    Mathematical signature on universal carrier.      │
  │    "We know math. We chose this on purpose."         │
  │                                                     │
  │ 3. Formaldehyde: 4830 MHz                           │
  │    Simplest organic molecule in space.               │
  │    Where this exists, prebiotic chemistry happens.   │
  │                                                     │
  │ 4. CMB peak: 160.2 GHz                              │
  │    The background radiation of the Big Bang.         │
  │    A civilization might modulate THIS.               │
  └─────────────────────────────────────────────────────┘

  ENCODING (what proves it's not natural):
  ┌─────────────────────────────────────────────────────┐
  │ 1. Prime intervals                                   │
  │    Pulses at 2,3,5,7,11,13... No star does this.    │
  │                                                     │
  │ 2. Prime frequency ratios                            │
  │    Harmonics at f₀×2, f₀×3, f₀×5, f₀×7...          │
  │    Overtone series uses ALL integers.                │
  │    Prime-only harmonics = artificial.                │
  │                                                     │
  │ 3. Zeta zeros                                        │
  │    Encode the imaginary parts of ζ zeros:            │
  │    14.135, 21.022, 25.011, 30.425...                 │
  │    This says: "We know the Riemann hypothesis."      │
  │    The deepest handshake in mathematics.             │
  │                                                     │
  │ 4. Physical constants                                │
  │    α = 1/137.036, π, e, √2                          │
  │    Binary-encoded in pulse timing.                   │
  └─────────────────────────────────────────────────────┘

  DIRECTION (nearest candidates):
  ┌─────────────────────────────────────────────────────┐
  │ 1. TRAPPIST-1  — 40 ly, 7 rocky planets, 3 in HZ   │
  │ 2. Proxima Cen — 4.2 ly, rocky planet in HZ         │
  │ 3. Kepler-442b — 1206 ly, most Earth-like known     │
  │ 4. K2-18b      — 124 ly, JWST found CH₄ + CO₂      │
  │ 5. Galactic center — if they're old, they're there  │
  └─────────────────────────────────────────────────────┘

  DATA SOURCES (real, public, downloadable):
  ┌─────────────────────────────────────────────────────┐
  │ Breakthrough Listen Open Data Archive               │
  │   seti.berkeley.edu/listen                          │
  │   Format: HDF5 (.h5), filterbank (.fil)             │
  │   Coverage: 1-12 GHz, 60+ targets                   │
  │                                                     │
  │ NRAO VLA Sky Survey (NVSS)                          │
  │   1.4 GHz all-sky survey                             │
  │                                                     │
  │ Green Bank 20cm Survey                              │
  │   1.4 GHz hydrogen line data                         │
  │                                                     │
  │ RTL-SDR (hardware: $25)                             │
  │   24 MHz - 1766 MHz direct reception                 │
  │   COVERS the hydrogen line directly                  │
  └─────────────────────────────────────────────────────┘

  The scanner is ready.
  The math is ready.
  The data exists.

  Next step: download Breakthrough Listen data for TRAPPIST-1
  and run this scanner on it.
""")


# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    if len(sys.argv) < 2:
        print()
        print("  LISTEN — Prime Signal Scanner")
        print("  ═════════════════════════════")
        print()
        print("  The oracle detects primes from pure math.")
        print("  This tool detects prime patterns in any signal.")
        print()
        print("  Commands:")
        print("    --generate         Create a prime beacon (what we're looking for)")
        print("    --scan file.wav    Scan any audio for prime patterns")
        print("    --hydrogen         Simulated hydrogen line scan")
        print("    --targets          Where physics says to look")
        print("    --live             Continuous microphone scan")
        print()
        show_targets()
        return

    cmd = sys.argv[1]

    if cmd == '--generate':
        print()
        print("  Generating prime beacon signal...")
        print()
        outfile = sys.argv[2] if len(sys.argv) > 2 else 'prime_beacon.wav'
        generate_prime_beacon(outfile)

    elif cmd == '--scan':
        if len(sys.argv) < 3:
            print("  Usage: python3 listen.py --scan <file.wav>")
            return
        filename = sys.argv[2]
        print()
        print(f"  Scanning: {filename}")
        print()

        if filename.endswith('.wav'):
            data, sr = read_wav(filename)
        elif filename.endswith('.raw'):
            with open(filename, 'rb') as f:
                raw = f.read()
            data = list(struct.unpack('f' * (len(raw)//4), raw))
            sr = 44100
        else:
            print(f"  Unsupported format. Use .wav or .raw")
            return

        scan_signal(data, sr)

    elif cmd == '--hydrogen':
        print()
        scan_hydrogen()

    elif cmd == '--targets':
        show_targets()

    elif cmd == '--live':
        live_scan()

    else:
        print(f"  Unknown command: {cmd}")
        print(f"  Run without arguments for help.")

if __name__ == '__main__':
    main()
