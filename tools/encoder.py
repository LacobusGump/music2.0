#!/usr/bin/env python3
"""
ENCODER/DECODER — The Zeros' Own Language
==========================================
1. Decompose zero spacings into spectral components (FFT)
2. Build probe signal from top components (encode)
3. Cross-correlate probe with original (interference)
4. Surviving frequencies = the communication language

Usage:
  python3 encoder.py              # full analysis
  python3 encoder.py --zeros 500  # more zeros = higher resolution
  python3 encoder.py --audio      # render the surviving signal as audio

Grand Unified Music Project — March 2026
"""
import sys, math, struct, time

sys.path.insert(0, '.')
from oracle import _generate_zeros

def encode_decode(num_zeros=300, verbose=True):
    """The full encode/decode pipeline."""

    # Generate zeros
    zeros = []
    _generate_zeros(lambda g: zeros.append(g), num_zeros)
    if verbose: print(f"  Zeros: {len(zeros)}")

    # Spacings
    spacings = [zeros[i+1]-zeros[i] for i in range(len(zeros)-1)]
    N = len(spacings)
    mean_s = sum(spacings)/N
    norm = [s/mean_s for s in spacings]

    # FFT of spacings
    spectrum = []
    for k in range(N//2):
        re = sum(norm[n]*math.cos(2*math.pi*k*n/N) for n in range(N))
        im = sum(norm[n]*math.sin(2*math.pi*k*n/N) for n in range(N))
        mag = math.sqrt(re*re+im*im)/N
        phase = math.atan2(im, re)
        spectrum.append((k, mag, phase))

    spectrum_sorted = sorted(spectrum, key=lambda x: -x[1])

    if verbose:
        print(f"\n  Top spectral components:")
        for k, mag, phase in spectrum_sorted[:10]:
            print(f"    k={k:3d}  mag={mag:.6f}  phase={phase:+.4f}")

    # Encode: probe from top 10
    top = spectrum_sorted[:10]
    probe = []
    for n in range(N):
        val = sum(mag*math.cos(2*math.pi*k*n/N - phase) for k, mag, phase in top)
        probe.append(val)

    # Cross-correlate
    corr = []
    for lag in range(N):
        c = sum(probe[n]*norm[(n+lag)%N] for n in range(N))/N
        corr.append(c)

    # Peak detection
    peaks = sorted(range(N), key=lambda i: -corr[i])[:20]
    peaks.sort()

    if verbose:
        print(f"\n  Correlation peak lags: {peaks[:10]}")

    # Interference spectrum
    surv = []
    for k in range(min(20, N//2)):
        re = sum(corr[n]*math.cos(2*math.pi*k*n/N) for n in range(N))
        im = sum(corr[n]*math.sin(2*math.pi*k*n/N) for n in range(N))
        mag = math.sqrt(re*re+im*im)/N
        surv.append((k, mag))

    surv.sort(key=lambda x: -x[1])
    surviving = [k for k, _ in surv[:5]]

    if verbose:
        print(f"  Surviving frequencies: {surviving}")

    return {
        'zeros': zeros,
        'spacings': spacings,
        'spectrum': spectrum_sorted,
        'probe': probe,
        'correlation': corr,
        'peak_lags': peaks,
        'surviving_freqs': surviving,
    }


def render_audio(result, filename='zero_language.wav', duration=10, sample_rate=44100):
    """Render the surviving frequencies as audio."""
    samples = int(duration * sample_rate)
    data = [0.0] * samples

    surviving = result['surviving_freqs']
    spectrum = result['spectrum']

    # Map surviving spectral components to audio frequencies
    base_freq = 220  # A3

    for k, mag, phase in spectrum[:10]:
        if k == 0: continue
        freq = base_freq * k
        if freq > 4000: continue
        amp = mag * 0.3

        for i in range(samples):
            t = i / sample_rate
            data[i] += amp * math.sin(2 * math.pi * freq * t + phase)

    # Also encode the correlation peaks as rhythmic pulses
    peak_lags = result['peak_lags']
    mean_spacing = sum(result['spacings'])/len(result['spacings'])

    for lag in peak_lags[:10]:
        pulse_time = lag * mean_spacing * 0.08  # scale to audio time
        if pulse_time >= duration: continue
        pulse_start = int(pulse_time * sample_rate)
        pulse_len = int(0.05 * sample_rate)
        for i in range(min(pulse_len, samples - pulse_start)):
            env = math.sin(math.pi * i / pulse_len)
            data[pulse_start + i] += env * 0.3 * math.sin(2 * math.pi * 440 * i / sample_rate)

    # Normalize
    mx = max(abs(d) for d in data) or 1
    data = [d/mx*0.9 for d in data]

    # Write WAV
    with open(filename, 'wb') as f:
        n = len(data)
        f.write(b'RIFF')
        f.write(struct.pack('<I', 36 + n*2))
        f.write(b'WAVE')
        f.write(b'fmt ')
        f.write(struct.pack('<IHHIIHH', 16, 1, 1, sample_rate, sample_rate*2, 2, 16))
        f.write(b'data')
        f.write(struct.pack('<I', n*2))
        for d in data:
            f.write(struct.pack('<h', max(-32768, min(32767, int(d*32767)))))

    print(f"  Audio: {filename} ({duration}s)")


if __name__ == '__main__':
    nz = 300
    if '--zeros' in sys.argv:
        idx = sys.argv.index('--zeros')
        nz = int(sys.argv[idx+1])

    print("  THE ENCODER/DECODER")
    print("  ═══════════════════")
    print()

    result = encode_decode(nz)

    if '--audio' in sys.argv:
        print()
        render_audio(result)

    print()
    print("  The surviving signal after round-trip interference")
    print("  is the communication language. Low modes. Prime lags.")
    print("  The zeros talk in bass frequencies at prime intervals.")
