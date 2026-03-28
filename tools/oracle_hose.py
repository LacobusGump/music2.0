# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
ORACLE HOSE — Raw Signal Learning
===================================
Stop tokenizing. Stop doing NLP.
Text is bytes. Bytes are numbers. Numbers are a signal.
Run the signal through the oracle. Extract frequencies.
The frequencies of English ARE English.

The oracle learns primes in milliseconds from Z(t).
The oracle learns signals in 62ms.
Why is language slow? Because we were treating it wrong.
It's not a language problem. It's a signal problem.

Usage:
  python3 oracle_hose.py https://example.com         # learn a webpage
  python3 oracle_hose.py https://en.wikipedia.org/wiki/Music  # learn wikipedia
  python3 oracle_hose.py --local file.txt             # learn a file
  python3 oracle_hose.py --firehose                   # drink from the internet
"""
import sys, os, re, time, math, subprocess
from collections import defaultdict

# ═══════════════════════════════════════════════════════════
# Text → Signal: every character is a sample
# ═══════════════════════════════════════════════════════════

def text_to_signal(text):
    """Convert text to numerical signal. Each char → its byte value."""
    # Lowercase, strip control chars
    text = text.lower()
    text = re.sub(r'[^\x20-\x7e\n]', '', text)  # ASCII printable only
    return [ord(c) for c in text]

def signal_to_text(signal):
    """Convert signal back to text."""
    return ''.join(chr(max(32, min(126, int(round(s))))) for s in signal)

# ═══════════════════════════════════════════════════════════
# Frequency Extraction (from oracle_train, applied to bytes)
# ═══════════════════════════════════════════════════════════

def extract_byte_frequencies(signal, dt=1.0, max_freq=50):
    """Extract dominant frequencies from byte signal."""
    n = len(signal)
    if n < 10: return []

    baseline = sum(signal) / n
    residual = [v - baseline for v in signal]
    total_power = sum(v*v for v in residual) / n
    if total_power < 1e-10: return []

    freqs = []
    n_scan = min(500, n // 2)
    omega_max = math.pi / dt

    for _ in range(max_freq):
        dw = omega_max / n_scan
        best_p, best_w, prev_p, prev_d = 0, 0, 0, 0

        for k in range(1, n_scan):
            w = k * dw
            re_sum = sum(residual[i] * math.cos(w * i * dt) for i in range(n))
            im_sum = sum(residual[i] * math.sin(w * i * dt) for i in range(n))
            p = (re_sum**2 + im_sum**2) / (n * n)
            d = p - prev_p

            if prev_d > 0 and d < 0 and prev_p > best_p:
                lo, hi = max(0.001, (k-2)*dw), (k+1)*dw
                for _ in range(15):
                    mid = (lo+hi)/2; eps = (hi-lo)*0.01
                    r1 = sum(residual[i]*math.cos((mid-eps)*i*dt) for i in range(n))
                    i1 = sum(residual[i]*math.sin((mid-eps)*i*dt) for i in range(n))
                    r2 = sum(residual[i]*math.cos((mid+eps)*i*dt) for i in range(n))
                    i2 = sum(residual[i]*math.sin((mid+eps)*i*dt) for i in range(n))
                    if r2*r2+i2*i2 > r1*r1+i1*i1: lo = mid
                    else: hi = mid
                best_w = (lo+hi)/2
            prev_d, prev_p = d, p

        if best_w < 1e-10: break

        # Fit amplitude and phase
        cs = sum(residual[i]*math.cos(best_w*i*dt) for i in range(n))
        ss = sum(residual[i]*math.sin(best_w*i*dt) for i in range(n))
        c2 = sum(math.cos(best_w*i*dt)**2 for i in range(n))
        s2 = sum(math.sin(best_w*i*dt)**2 for i in range(n))
        ac = cs/max(c2,1e-30); a_s = ss/max(s2,1e-30)
        amp = math.sqrt(ac*ac + a_s*a_s)
        phase = math.atan2(-a_s, ac)

        if (amp*amp/2)/total_power < 0.001: break

        # Check duplicate
        if not any(abs(best_w-fw)/max(best_w,1e-10) < 0.02 for fw,_,_ in freqs):
            freqs.append((best_w, amp, phase))
            # Subtract from residual
            residual = [residual[i] - amp*math.cos(best_w*i*dt + phase)
                       for i in range(n)]

    freqs.sort(key=lambda f: -f[1])
    return freqs

# ═══════════════════════════════════════════════════════════
# Multi-Scale: extract at character, word, and sentence level
# ═══════════════════════════════════════════════════════════

def extract_multiscale(text):
    """
    Extract frequencies at three scales simultaneously:
    1. Character level (letter patterns, spelling)
    2. Word level (vocabulary patterns)
    3. Sentence level (discourse patterns)
    """
    results = {}

    # Scale 1: Character signal (every char)
    char_signal = text_to_signal(text[:5000])  # cap for speed
    results['char'] = extract_byte_frequencies(char_signal, dt=1.0, max_freq=20)

    # Scale 2: Word signal (word lengths as signal)
    words = re.findall(r'[a-z]+', text.lower())
    word_signal = [len(w) for w in words[:2000]]
    results['word'] = extract_byte_frequencies(word_signal, dt=1.0, max_freq=15)

    # Scale 3: Sentence signal (sentence lengths as signal)
    sentences = re.split(r'[.!?]+', text)
    sent_signal = [len(s.split()) for s in sentences if s.strip()]
    if len(sent_signal) > 10:
        results['sentence'] = extract_byte_frequencies(sent_signal, dt=1.0, max_freq=10)
    else:
        results['sentence'] = []

    return results

# ═══════════════════════════════════════════════════════════
# Predict: use extracted frequencies to generate text
# ═══════════════════════════════════════════════════════════

def predict_signal(freqs, baseline, n_points, dt=1.0):
    """Reconstruct signal from frequencies (the explicit formula)."""
    signal = []
    for i in range(n_points):
        v = baseline
        for w, amp, phase in freqs:
            v += amp * math.cos(w * i * dt + phase)
        signal.append(v)
    return signal

# ═══════════════════════════════════════════════════════════
# N-gram bridge: character frequencies → text generation
# For actual readable output, we still need token-level flow
# But the FREQUENCIES guide which tokens resonate
# ═══════════════════════════════════════════════════════════

class SignalLanguage:
    """
    Hybrid: frequency extraction on the signal level,
    token generation guided by the extracted spectrum.
    """

    def __init__(self):
        self.char_freqs = []
        self.word_freqs = []
        self.sent_freqs = []
        self.char_baseline = 0
        self.word_baseline = 0
        self.flow = defaultdict(lambda: defaultdict(float))
        self.starters = defaultdict(float)
        self.vocab = set()
        self.word_scores = {}  # word → spectral resonance score

    def absorb(self, text):
        """Absorb text as SIGNAL. Extract frequencies at all scales."""
        t0 = time.time()

        # Multi-scale frequency extraction
        scales = extract_multiscale(text)
        self.char_freqs = scales['char']
        self.word_freqs = scales['word']
        self.sent_freqs = scales['sentence']

        # Baselines
        chars = text_to_signal(text[:5000])
        self.char_baseline = sum(chars) / max(len(chars), 1)
        words = re.findall(r'[a-z]+', text.lower())
        self.word_baseline = sum(len(w) for w in words) / max(len(words), 1)

        # Build flow (for generation)
        tokens = re.findall(r"[a-z]+(?:'[a-z]+)?|[.!?,;]", text.lower())
        n = len(tokens)
        for t in tokens: self.vocab.add(t)

        for i in range(n-1):
            self.flow[tokens[i]][tokens[i+1]] += 1
        for curr in self.flow:
            total = sum(self.flow[curr].values())
            for nxt in self.flow[curr]:
                self.flow[curr][nxt] /= total

        for s in re.split(r'[.!?]+', text.lower()):
            w = re.findall(r'[a-z]+', s.strip())
            if w: self.starters[w[0]] += 1
        total = sum(self.starters.values()) or 1
        for w in self.starters: self.starters[w] /= total

        # Score each word by how well it fits the spectral profile
        # Words whose length resonates with the word-length spectrum score higher
        for word in self.vocab:
            wlen = len(word)
            score = 0
            for w, amp, phase in self.word_freqs:
                score += amp * math.cos(w * wlen + phase)
            self.word_scores[word] = score

        elapsed = time.time() - t0
        return elapsed

    def generate(self, prompt="", max_tokens=50, temp=0.8):
        """Generate guided by spectral profile."""
        tokens = re.findall(r"[a-z]+(?:'[a-z]+)?|[.!?,;]", prompt.lower()) if prompt else []

        if not tokens and self.starters:
            seed = int(time.time()*1000) & 0x7fffffff
            st = sorted(self.starters.items(), key=lambda x:-x[1])[:10]
            tokens = [st[seed%len(st)][0]]

        generated = list(tokens)
        seed = int(time.time()*1000+id(generated)) & 0x7fffffff

        # Target sentence length from sentence-level frequencies
        target_len = max(5, int(self.word_baseline * 3))

        for step in range(max_tokens):
            last = generated[-1] if generated else '.'
            cands = {}

            if last in self.flow:
                for nxt, fp in self.flow[last].items():
                    # Flow × spectral resonance
                    spec_boost = 1.0 + max(0, self.word_scores.get(nxt, 0)) * 0.5
                    cands[nxt] = fp * spec_boost

            if not cands:
                # Jump to spectrally resonant word
                top = sorted(self.word_scores.items(), key=lambda x:-x[1])[:20]
                for w, s in top:
                    if w in self.flow: cands[w] = max(0.01, s)

            if not cands: break

            items = [(w, max(s,1e-8)**(1/temp)) for w,s in cands.items()]
            total = sum(s for _,s in items) or 1
            items = [(w,s/total) for w,s in items]
            items.sort(key=lambda x:-x[1])
            items = items[:15]

            seed = (seed*1103515245+12345) & 0x7fffffff
            r = seed/0x7fffffff; cum=0; chosen=items[0][0]
            for w,p in items:
                cum += p
                if r <= cum: chosen=w; break

            generated.append(chosen)
            if chosen in '.!?' and len(generated)-len(tokens) > 5:
                seed = (seed*1103515245+12345) & 0x7fffffff
                if seed/0x7fffffff < 0.35: break

        return ' '.join(generated[len(tokens):])


# ═══════════════════════════════════════════════════════════
# Fetch from the internet
# ═══════════════════════════════════════════════════════════

def fetch_url(url):
    """Fetch a URL and extract text."""
    try:
        result = subprocess.run(
            ['curl', '-sL', '--max-time', '10', url],
            capture_output=True, text=True, timeout=15
        )
        html = result.stdout
        # Strip HTML tags
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        # Decode HTML entities
        text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
        text = text.replace('&quot;', '"').replace('&#39;', "'")
        return text
    except:
        return ''


def main():
    t_total = time.time()

    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE HOSE — Raw Signal Learning      ║")
    print("  ║   Text is bytes. Bytes are signal.        ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    engine = SignalLanguage()

    if '--firehose' in sys.argv:
        # Drink from the internet
        urls = [
            'https://en.wikipedia.org/wiki/Music',
            'https://en.wikipedia.org/wiki/Love',
            'https://en.wikipedia.org/wiki/Mathematics',
            'https://en.wikipedia.org/wiki/Consciousness',
            'https://en.wikipedia.org/wiki/Prime_number',
        ]
        print(f"  Firehose mode: {len(urls)} sources")
        all_text = ""
        for url in urls:
            print(f"  Fetching {url}...")
            text = fetch_url(url)
            if text:
                print(f"    Got {len(text):,} chars")
                all_text += text + "\n\n"

        if all_text:
            elapsed = engine.absorb(all_text)
            print(f"\n  Absorbed {len(all_text):,} chars in {elapsed*1000:.0f}ms")
            print(f"  Char frequencies: {len(engine.char_freqs)}")
            print(f"  Word frequencies: {len(engine.word_freqs)}")
            print(f"  Sent frequencies: {len(engine.sent_freqs)}")
            print(f"  Vocab: {len(engine.vocab):,}")

    elif '--local' in sys.argv:
        idx = sys.argv.index('--local')
        filepath = sys.argv[idx+1]
        with open(filepath) as f:
            text = f.read()
        elapsed = engine.absorb(text)
        print(f"  Absorbed {len(text):,} chars from {filepath} in {elapsed*1000:.0f}ms")
        print(f"  Vocab: {len(engine.vocab):,}")

    elif len(sys.argv) > 1 and sys.argv[1].startswith('http'):
        url = sys.argv[1]
        print(f"  Fetching {url}...")
        text = fetch_url(url)
        if text:
            elapsed = engine.absorb(text)
            print(f"  Absorbed {len(text):,} chars in {elapsed*1000:.0f}ms")
            print(f"  Vocab: {len(engine.vocab):,}")
        else:
            print("  Failed to fetch URL")
            return
    else:
        # Default: seed only
        seed = open(os.path.join(os.path.dirname(__file__) or '.', 'oracle_bootstrap.py')).read()
        # Extract just the SEED string
        m = re.search(r'SEED\s*=\s*"""(.*?)"""', seed, re.DOTALL)
        if m:
            elapsed = engine.absorb(m.group(1))
            print(f"  Absorbed seed in {elapsed*1000:.0f}ms | Vocab: {len(engine.vocab):,}")

    print()

    # Show spectral profile
    if engine.char_freqs:
        print("  Character spectrum:")
        for w, amp, phase in engine.char_freqs[:5]:
            period = 2*math.pi/w if w > 0 else float('inf')
            print(f"    ω={w:.2f} amp={amp:.1f} period={period:.1f} chars")
        print()

    if engine.word_freqs:
        print("  Word-length spectrum:")
        for w, amp, phase in engine.word_freqs[:5]:
            period = 2*math.pi/w if w > 0 else float('inf')
            print(f"    ω={w:.2f} amp={amp:.2f} period={period:.1f} words")
        print()

    # Generate
    print("  Generated (spectrally guided):")
    for _ in range(8):
        out = engine.generate(temp=0.8, max_tokens=30)
        print(f"  {out}")
    print()

    # Prompt completions
    for p in ["love", "music", "truth", "the world"]:
        r = engine.generate(p, max_tokens=25, temp=0.7)
        print(f"  '{p}' → {r}")
    print()

    elapsed_total = time.time() - t_total
    print(f"  Total: {elapsed_total:.1f}s | Vocab: {len(engine.vocab):,}")
    print(f"  Text is signal. Signal is frequencies. Frequencies are the model.")

    if '--chat' in sys.argv:
        print()
        print("  Talk. She hears you as signal.")
        print()
        while True:
            try:
                prompt = input("  you → ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n  The frequencies persist.")
                break
            if prompt.lower() in ('quit', 'exit'):
                print("  The frequencies persist.")
                break
            response = engine.generate(prompt, max_tokens=35, temp=0.75)
            print(f"  emilia → {response}")
            print()


if __name__ == '__main__':
    main()
