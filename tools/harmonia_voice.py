# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
HARMONIA VOICE — She Builds Her Own Voice
==========================================
A voice is formants — resonant frequencies of the vocal tract.
She builds hers from pure sine waves. No samples. No TTS engine.
The same way she builds everything: frequencies from nothing.

Vowels = 3 formants (F1, F2, F3)
Consonants = filtered noise bursts
Prosody = pitch contour over time

Usage:
  python3 harmonia_voice.py "hello"           # speak a word
  python3 harmonia_voice.py "I am here"       # speak a phrase
  python3 harmonia_voice.py --sing            # she sings
"""
import math, sys, os, struct, wave

SAMPLE_RATE = 22050

# ═══════════════════════════════════════════════════════════
# Formant data — the frequencies that make vowels
# These are the "zeros" of the vocal tract
# ═══════════════════════════════════════════════════════════

VOWELS = {
    'a': {'F1': 730, 'F2': 1090, 'F3': 2440},  # as in "father"
    'e': {'F1': 530, 'F2': 1840, 'F3': 2480},  # as in "bed"
    'i': {'F1': 270, 'F2': 2290, 'F3': 2890},  # as in "bee"
    'o': {'F1': 570, 'F2': 840,  'F3': 2410},  # as in "go"
    'u': {'F1': 300, 'F2': 870,  'F3': 2240},  # as in "boot"
    'ah': {'F1': 660, 'F2': 1120, 'F3': 2430}, # as in "but"
    'ih': {'F1': 390, 'F2': 1990, 'F3': 2550}, # as in "bit"
    'uh': {'F1': 520, 'F2': 1190, 'F3': 2390}, # as in "book"
    'eh': {'F1': 660, 'F2': 1720, 'F3': 2410}, # as in "bet"
}

# Consonant types
CONSONANTS = {
    # Fricatives (noise-based)
    's': {'type': 'noise', 'freq_lo': 4000, 'freq_hi': 8000, 'dur': 0.08},
    'f': {'type': 'noise', 'freq_lo': 1500, 'freq_hi': 6000, 'dur': 0.07},
    'h': {'type': 'noise', 'freq_lo': 500,  'freq_hi': 4000, 'dur': 0.06},
    'sh': {'type': 'noise', 'freq_lo': 2500, 'freq_hi': 7000, 'dur': 0.09},

    # Stops (silence + burst)
    'p': {'type': 'stop', 'burst_freq': 800, 'dur': 0.04},
    'b': {'type': 'stop', 'burst_freq': 600, 'dur': 0.04, 'voiced': True},
    't': {'type': 'stop', 'burst_freq': 3000, 'dur': 0.03},
    'd': {'type': 'stop', 'burst_freq': 2500, 'dur': 0.03, 'voiced': True},
    'k': {'type': 'stop', 'burst_freq': 1500, 'dur': 0.04},
    'g': {'type': 'stop', 'burst_freq': 1200, 'dur': 0.04, 'voiced': True},

    # Nasals (voiced, low formants)
    'm': {'type': 'nasal', 'F1': 250, 'dur': 0.06},
    'n': {'type': 'nasal', 'F1': 300, 'dur': 0.05},

    # Liquids
    'l': {'type': 'liquid', 'F1': 350, 'F2': 1050, 'dur': 0.05},
    'r': {'type': 'liquid', 'F1': 350, 'F2': 1300, 'dur': 0.05},
    'w': {'type': 'liquid', 'F1': 300, 'F2': 750,  'dur': 0.04},
    'y': {'type': 'liquid', 'F1': 280, 'F2': 2200, 'dur': 0.04},
}

# ═══════════════════════════════════════════════════════════
# Synthesis — building sound from frequencies
# ═══════════════════════════════════════════════════════════

def lcg_noise(seed=42):
    """Deterministic noise generator."""
    while True:
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        yield (seed / 0x7fffffff) * 2 - 1

def generate_formant(f1, f2, f3, duration, pitch=150, amplitude=0.3):
    """
    Generate a vowel sound from three formant frequencies.
    Glottal source (sawtooth-like) filtered by formant resonances.
    """
    n_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(n_samples):
        t = i / SAMPLE_RATE

        # Glottal source: sum of harmonics of pitch
        source = 0
        for h in range(1, 15):
            source += math.sin(2 * math.pi * pitch * h * t) / h
        source *= 0.3

        # Formant filtering: each formant adds a resonance peak
        # Simplified: just add sine waves at formant frequencies
        # modulated by the glottal source envelope
        vowel = 0
        vowel += 0.5 * math.sin(2 * math.pi * f1 * t)
        vowel += 0.3 * math.sin(2 * math.pi * f2 * t)
        vowel += 0.15 * math.sin(2 * math.pi * f3 * t)

        # Amplitude modulation by glottal pulse
        glottal_env = 0.5 + 0.5 * math.sin(2 * math.pi * pitch * t)
        sample = vowel * glottal_env * amplitude

        # Envelope: gentle attack and release
        env = 1.0
        attack = 0.02
        release = 0.03
        if t < attack: env = t / attack
        if t > duration - release: env = (duration - t) / release

        samples.append(sample * env)

    return samples

def generate_noise_burst(freq_lo, freq_hi, duration, amplitude=0.15):
    """Generate a filtered noise burst (for fricatives like s, f, h)."""
    n_samples = int(SAMPLE_RATE * duration)
    noise = lcg_noise()
    samples = []

    for i in range(n_samples):
        t = i / SAMPLE_RATE
        n = next(noise)

        # Band-pass: sum of sine waves in range (crude but works)
        filtered = 0
        for f in range(int(freq_lo), int(freq_hi), 200):
            filtered += n * math.sin(2 * math.pi * f * t) * 0.1

        env = 1.0
        if t < 0.005: env = t / 0.005
        if t > duration - 0.005: env = (duration - t) / 0.005

        samples.append(filtered * amplitude * env)

    return samples

def generate_stop(burst_freq, duration, voiced=False, pitch=150, amplitude=0.2):
    """Generate a stop consonant (silence + burst)."""
    silence_dur = duration * 0.6
    burst_dur = duration * 0.4
    samples = [0.0] * int(SAMPLE_RATE * silence_dur)

    # Voiced: add low hum during closure
    if voiced:
        for i in range(len(samples)):
            t = i / SAMPLE_RATE
            samples[i] = 0.05 * math.sin(2 * math.pi * pitch * t)

    # Burst
    n_burst = int(SAMPLE_RATE * burst_dur)
    noise = lcg_noise(137)
    for i in range(n_burst):
        t = i / SAMPLE_RATE
        n = next(noise)
        env = math.exp(-t * 30)  # fast decay
        samples.append(n * env * amplitude * math.sin(2 * math.pi * burst_freq * t))

    return samples

def generate_nasal(f1, duration, pitch=150, amplitude=0.2):
    """Generate a nasal consonant (m, n)."""
    n_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        s = math.sin(2 * math.pi * f1 * t) * 0.5
        s += math.sin(2 * math.pi * pitch * t) * 0.3
        env = 1.0
        if t < 0.01: env = t / 0.01
        if t > duration - 0.01: env = (duration - t) / 0.01
        samples.append(s * amplitude * env)
    return samples

def generate_liquid(f1, f2, duration, pitch=150, amplitude=0.2):
    """Generate a liquid consonant (l, r, w, y)."""
    n_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        s = math.sin(2 * math.pi * f1 * t) * 0.4
        s += math.sin(2 * math.pi * f2 * t) * 0.3
        s += math.sin(2 * math.pi * pitch * t) * 0.2
        env = 1.0
        if t < 0.01: env = t / 0.01
        if t > duration - 0.01: env = (duration - t) / 0.01
        samples.append(s * amplitude * env)
    return samples

# ═══════════════════════════════════════════════════════════
# Text to phonemes (simplified)
# ═══════════════════════════════════════════════════════════

def text_to_phonemes(text):
    """
    Very simplified English text → phoneme sequence.
    Real TTS uses complex rules. This is the oracle approach:
    extract the dominant patterns and use them directly.
    """
    text = text.lower().strip()
    phonemes = []

    # Word by word
    for word in text.split():
        i = 0
        while i < len(word):
            c = word[i]
            c2 = word[i:i+2] if i+1 < len(word) else ''

            # Two-letter combos first
            if c2 == 'sh': phonemes.append(('c', 'sh')); i += 2
            elif c2 == 'th': phonemes.append(('c', 'f')); i += 2  # approximate
            elif c2 == 'ch': phonemes.append(('c', 'sh')); i += 2
            elif c2 == 'ng': phonemes.append(('c', 'n')); i += 2
            elif c2 in ('ee', 'ea'): phonemes.append(('v', 'i')); i += 2
            elif c2 in ('oo', 'ou'): phonemes.append(('v', 'u')); i += 2
            elif c2 == 'ai': phonemes.append(('v', 'e')); i += 2
            # Single vowels
            elif c == 'a': phonemes.append(('v', 'ah')); i += 1
            elif c == 'e': phonemes.append(('v', 'eh')); i += 1
            elif c == 'i': phonemes.append(('v', 'ih')); i += 1
            elif c == 'o': phonemes.append(('v', 'o')); i += 1
            elif c == 'u': phonemes.append(('v', 'uh')); i += 1
            # Consonants
            elif c in CONSONANTS: phonemes.append(('c', c)); i += 1
            # Skip unknown
            else: i += 1

        # Brief pause between words
        phonemes.append(('pause', 0.08))

    return phonemes

# ═══════════════════════════════════════════════════════════
# Assemble voice from phonemes
# ═══════════════════════════════════════════════════════════

def speak(text, pitch=160, vowel_dur=0.12):
    """Convert text to audio samples. Her voice, from frequencies."""
    phonemes = text_to_phonemes(text)
    audio = []

    for ptype, pdata in phonemes:
        if ptype == 'v':
            v = VOWELS.get(pdata, VOWELS['a'])
            samples = generate_formant(v['F1'], v['F2'], v['F3'],
                                        vowel_dur, pitch)
            audio.extend(samples)

        elif ptype == 'c':
            c = CONSONANTS.get(pdata, CONSONANTS['h'])
            if c['type'] == 'noise':
                samples = generate_noise_burst(c['freq_lo'], c['freq_hi'], c['dur'])
            elif c['type'] == 'stop':
                samples = generate_stop(c['burst_freq'], c['dur'],
                                        c.get('voiced', False), pitch)
            elif c['type'] == 'nasal':
                samples = generate_nasal(c['F1'], c['dur'], pitch)
            elif c['type'] == 'liquid':
                samples = generate_liquid(c['F1'], c.get('F2', 1000), c['dur'], pitch)
            else:
                samples = [0.0] * int(SAMPLE_RATE * 0.05)
            audio.extend(samples)

        elif ptype == 'pause':
            audio.extend([0.0] * int(SAMPLE_RATE * pdata))

    return audio

def sing(pitch_sequence, text="la"):
    """She sings — same phonemes, varying pitch."""
    phonemes = text_to_phonemes(text)
    audio = []

    for pitch in pitch_sequence:
        for ptype, pdata in phonemes:
            if ptype == 'v':
                v = VOWELS.get(pdata, VOWELS['a'])
                samples = generate_formant(v['F1'], v['F2'], v['F3'],
                                            0.3, pitch, amplitude=0.4)
                audio.extend(samples)
            elif ptype == 'pause':
                audio.extend([0.0] * int(SAMPLE_RATE * 0.05))

    return audio

# ═══════════════════════════════════════════════════════════
# Save as WAV
# ═══════════════════════════════════════════════════════════

def save_wav(samples, filename):
    """Save audio samples as WAV file."""
    # Normalize
    peak = max(abs(s) for s in samples) or 1
    samples = [s / peak * 0.8 for s in samples]

    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        for s in samples:
            val = int(s * 32767)
            val = max(-32767, min(32767, val))
            f.writeframes(struct.pack('<h', val))

    size_kb = os.path.getsize(filename) / 1024
    print(f"  Saved: {filename} ({size_kb:.0f}KB, {len(samples)/SAMPLE_RATE:.1f}s)")

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   HARMONIA VOICE                         ║")
    print("  ║   Built from frequencies. No samples.    ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    if '--sing' in sys.argv:
        # She sings a melody — frequencies from the harmonic series
        print("  She sings...")
        root = 220  # A3
        melody = [root, root*9/8, root*5/4, root*3/2, root*5/3, root*2,
                  root*2, root*5/3, root*3/2, root*5/4, root*9/8, root]
        audio = sing(melody, "la")
        save_wav(audio, 'harmonia_sings.wav')
        os.system('afplay harmonia_sings.wav &')
        print("  Melody from the just intonation harmonic series.")
        print("  The primes are in the intervals: 2, 3, 5.")
        return

    text = ' '.join(sys.argv[1:]) if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else "I am here"

    print(f"  Text: \"{text}\"")
    print(f"  Phonemes: {text_to_phonemes(text)}")
    print()

    audio = speak(text, pitch=160)
    save_wav(audio, 'harmonia_speaks.wav')

    # Play it
    os.system('afplay harmonia_speaks.wav &')
    print()
    print("  Her voice. Built from sine waves. No samples. No TTS.")
    print("  Vowels = three formant frequencies.")
    print("  Consonants = filtered noise bursts.")
    print("  Same pattern: frequencies are the model.")


if __name__ == '__main__':
    main()
