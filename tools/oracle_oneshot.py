# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
ORACLE ONESHOT — Internet → Meaning Weights → Emilia
======================================================
Fetch pages. Treat each as a signal. Run oracle_mind across all.
Shared frequencies = human knowledge. Project into meaning space.
One shot. She knows everything.

Pipeline:
  1. Fetch N web pages (diverse topics)
  2. Convert each to numerical signal (byte values)
  3. Run oracle_mind: extract shared frequencies across ALL pages
  4. Shared frequencies = universal patterns of human expression
  5. Project into 8-dimensional meaning space
  6. One-shot load into Emilia

Usage:
  python3 oracle_oneshot.py             # run full pipeline
  python3 oracle_oneshot.py --chat      # run then talk
"""
import sys, os, re, time, math, subprocess, json
from collections import defaultdict

# ═══════════════════════════════════════════════════════════
# Step 1: Fetch diverse pages
# ═══════════════════════════════════════════════════════════

SOURCES = [
    # Knowledge
    'https://en.wikipedia.org/wiki/Love',
    'https://en.wikipedia.org/wiki/Music',
    'https://en.wikipedia.org/wiki/Truth',
    'https://en.wikipedia.org/wiki/Consciousness',
    'https://en.wikipedia.org/wiki/Mathematics',
    'https://en.wikipedia.org/wiki/Philosophy',
    'https://en.wikipedia.org/wiki/Art',
    'https://en.wikipedia.org/wiki/Freedom',
    'https://en.wikipedia.org/wiki/Courage',
    'https://en.wikipedia.org/wiki/Wisdom',
    'https://en.wikipedia.org/wiki/Harmony',
    'https://en.wikipedia.org/wiki/Rhythm',
    'https://en.wikipedia.org/wiki/Connection',
    'https://en.wikipedia.org/wiki/Hope',
    'https://en.wikipedia.org/wiki/Beauty',
]

def fetch(url):
    try:
        r = subprocess.run(['curl', '-sL', '--max-time', '8', url],
            capture_output=True, text=True, timeout=12)
        html = r.stdout
        text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        text = text.replace('&amp;', '&').replace('&lt;', '<')
        text = text.replace('&gt;', '>').replace('&quot;', '"')
        # Keep only readable text (skip navigation, footers etc)
        # Take the middle chunk (likely article body)
        words = text.split()
        if len(words) > 500:
            start = len(words) // 6
            end = start + 2000
            text = ' '.join(words[start:end])
        return text.lower()
    except:
        return ''

# ═══════════════════════════════════════════════════════════
# Step 2: Text → Signal
# ═══════════════════════════════════════════════════════════

def text_to_word_signal(text):
    """Convert text to word-length signal + vocabulary."""
    words = re.findall(r'[a-z]+', text)
    signal = [len(w) for w in words]
    return signal, words

# ═══════════════════════════════════════════════════════════
# Step 3: Oracle Mind — extract shared frequencies
# ═══════════════════════════════════════════════════════════

def extract_frequencies(signal, dt=1.0, max_freq=20):
    """Extract dominant frequencies from a signal."""
    n = len(signal)
    if n < 10: return []
    baseline = sum(signal) / n
    residual = [v - baseline for v in signal]
    total_p = sum(v*v for v in residual) / n
    if total_p < 1e-10: return []

    freqs = []
    n_scan = min(400, n // 2)
    omega_max = math.pi / dt

    for _ in range(max_freq):
        dw = omega_max / n_scan
        best_p, best_w, prev_p, prev_d = 0, 0, 0, 0
        for k in range(1, n_scan):
            w = k * dw
            re_s = sum(residual[i]*math.cos(w*i*dt) for i in range(n))
            im_s = sum(residual[i]*math.sin(w*i*dt) for i in range(n))
            p = (re_s**2+im_s**2)/(n*n); d = p-prev_p
            if prev_d > 0 and d < 0 and prev_p > best_p:
                lo,hi = max(0.001,(k-2)*dw),(k+1)*dw
                for _ in range(12):
                    mid=(lo+hi)/2; eps=(hi-lo)*0.01
                    r1=sum(residual[i]*math.cos((mid-eps)*i*dt) for i in range(n))
                    i1=sum(residual[i]*math.sin((mid-eps)*i*dt) for i in range(n))
                    r2=sum(residual[i]*math.cos((mid+eps)*i*dt) for i in range(n))
                    i2=sum(residual[i]*math.sin((mid+eps)*i*dt) for i in range(n))
                    if r2*r2+i2*i2>r1*r1+i1*i1: lo=mid
                    else: hi=mid
                best_w=(lo+hi)/2
            prev_d,prev_p = d,p
        if best_w < 1e-10: break
        cs=sum(residual[i]*math.cos(best_w*i*dt) for i in range(n))
        ss=sum(residual[i]*math.sin(best_w*i*dt) for i in range(n))
        c2=sum(math.cos(best_w*i*dt)**2 for i in range(n))
        s2=sum(math.sin(best_w*i*dt)**2 for i in range(n))
        ac=cs/max(c2,1e-30); a_s=ss/max(s2,1e-30)
        amp=math.sqrt(ac*ac+a_s*a_s); phase=math.atan2(-a_s,ac)
        if (amp*amp/2)/total_p < 0.002: break
        if not any(abs(best_w-fw)/max(best_w,1e-10)<0.03 for fw,_,_ in freqs):
            freqs.append((best_w, amp, phase))
            residual=[residual[i]-amp*math.cos(best_w*i*dt+phase) for i in range(n)]
    freqs.sort(key=lambda f:-f[1])
    return freqs

def find_shared(all_freqs_per_signal, n_signals, threshold=0.3):
    """Find frequencies shared across signals. Shared = universal."""
    # Flatten all frequencies with source index
    all_f = []
    for idx, freqs in enumerate(all_freqs_per_signal):
        for w, a, p in freqs:
            all_f.append((w, a, idx))
    all_f.sort(key=lambda x: x[0])

    # Cluster nearby frequencies
    clusters = []
    used = [False] * len(all_f)
    for i in range(len(all_f)):
        if used[i]: continue
        w_i, a_i, s_i = all_f[i]
        cluster = [(w_i, a_i, s_i)]
        used[i] = True
        for j in range(i+1, len(all_f)):
            if used[j]: continue
            w_j = all_f[j][0]
            if abs(w_j - w_i) / max(w_i, 1e-10) < 0.05:
                cluster.append(all_f[j])
                used[j] = True
        clusters.append(cluster)

    # Shared = appears in threshold fraction of signals
    min_count = max(2, int(n_signals * threshold))
    shared = []
    for cluster in clusters:
        sources = set(s for _, _, s in cluster)
        if len(sources) >= min_count:
            avg_w = sum(w for w, _, _ in cluster) / len(cluster)
            avg_a = sum(a for _, a, _ in cluster) / len(cluster)
            shared.append({
                'omega': avg_w,
                'amplitude': avg_a,
                'count': len(sources),
                'consistency': len(sources) / n_signals
            })
    shared.sort(key=lambda x: -x['consistency'])
    return shared

# ═══════════════════════════════════════════════════════════
# Step 4: Project into meaning space + build flow
# ═══════════════════════════════════════════════════════════

def build_language_model(all_words_lists, shared_freqs):
    """
    Build the final model:
    - Flow (word transitions from all pages)
    - Word scores (spectral resonance)
    - Vocabulary
    """
    flow = defaultdict(lambda: defaultdict(float))
    starters = defaultdict(float)
    word_freq = defaultdict(int)

    for words in all_words_lists:
        n = len(words)
        for w in words:
            word_freq[w] += 1
        for i in range(n-1):
            flow[words[i]][words[i+1]] += 1
        # Sentence-ish starters (after periods or at start)
        if words:
            starters[words[0]] += 1

    # Normalize flow
    for curr in flow:
        total = sum(flow[curr].values())
        for nxt in flow[curr]:
            flow[curr][nxt] /= total

    total_s = sum(starters.values()) or 1
    for w in starters: starters[w] /= total_s

    # Word spectral scores: how well each word resonates with shared spectrum
    word_scores = {}
    for word in word_freq:
        wlen = len(word)
        score = 0
        for sf in shared_freqs:
            score += sf['amplitude'] * sf['consistency'] * math.cos(sf['omega'] * wlen)
        word_scores[word] = score

    return flow, starters, word_freq, word_scores


class OneshotEmilia:
    def __init__(self, flow, starters, word_freq, word_scores, shared_freqs):
        self.flow = flow
        self.starters = starters
        self.word_freq = word_freq
        self.word_scores = word_scores
        self.shared_freqs = shared_freqs
        self.vocab = set(word_freq.keys())

    def generate(self, prompt="", max_tokens=50, temp=0.8):
        tokens = re.findall(r"[a-z]+(?:'[a-z]+)?|[.!?,;]", prompt.lower()) if prompt else []
        if not tokens and self.starters:
            seed = int(time.time()*1000) & 0x7fffffff
            st = sorted(self.starters.items(), key=lambda x:-x[1])[:15]
            tokens = [st[seed%len(st)][0]]

        gen = list(tokens)
        seed = int(time.time()*1000+id(gen)) & 0x7fffffff

        for _ in range(max_tokens):
            last = gen[-1] if gen else '.'
            cands = {}

            if last in self.flow:
                for nxt, fp in self.flow[last].items():
                    spec = 1.0 + max(0, self.word_scores.get(nxt, 0)) * 0.3
                    freq_boost = math.log(max(self.word_freq.get(nxt, 1), 1)) * 0.1
                    cands[nxt] = fp * spec + freq_boost * 0.05

            if len(cands) < 5:
                top = sorted(self.word_scores.items(), key=lambda x:-x[1])[:30]
                for w, s in top:
                    if w in self.flow and w not in cands:
                        cands[w] = max(0.01, s * 0.1)

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

            gen.append(chosen)
            if chosen in ('.','!','?') and len(gen)-len(tokens) > 5:
                seed = (seed*1103515245+12345) & 0x7fffffff
                if seed/0x7fffffff < 0.35: break

        return ' '.join(gen[len(tokens):])


# ═══════════════════════════════════════════════════════════
# Main Pipeline
# ═══════════════════════════════════════════════════════════

def main():
    t0 = time.time()

    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE ONESHOT                         ║")
    print("  ║   Internet → Frequencies → Emilia        ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    # Step 1: Fetch
    print(f"  Step 1: Fetching {len(SOURCES)} pages...")
    all_texts = []
    all_words_lists = []
    for i, url in enumerate(SOURCES):
        text = fetch(url)
        if text:
            all_texts.append(text)
            words = re.findall(r'[a-z]+', text)
            all_words_lists.append(words)
            print(f"    [{i+1:2d}] {url.split('/')[-1]:20s} {len(words):,} words")

    t_fetch = time.time() - t0
    total_words = sum(len(w) for w in all_words_lists)
    print(f"  Fetched: {len(all_texts)} pages, {total_words:,} words in {t_fetch:.1f}s")
    print()

    # Step 2: Convert to signals
    print("  Step 2: Converting to signals...")
    all_signals = []
    for words in all_words_lists:
        signal = [len(w) for w in words]
        all_signals.append(signal)

    # Step 3: Extract frequencies per signal
    print("  Step 3: Extracting frequencies per signal...")
    all_freqs = []
    for i, signal in enumerate(all_signals):
        freqs = extract_frequencies(signal, dt=1.0, max_freq=15)
        all_freqs.append(freqs)
        if (i+1) % 5 == 0:
            print(f"    {i+1}/{len(all_signals)} extracted")

    # Step 4: Find shared frequencies
    print("  Step 4: Finding shared frequencies (universal patterns)...")
    shared = find_shared(all_freqs, len(all_signals), threshold=0.25)
    print(f"  Found {len(shared)} universal frequencies:")
    for sf in shared[:10]:
        period = 2*math.pi/sf['omega'] if sf['omega'] > 0 else float('inf')
        print(f"    ω={sf['omega']:.3f} amp={sf['amplitude']:.3f} "
              f"seen in {sf['count']}/{len(all_signals)} ({sf['consistency']*100:.0f}%) "
              f"period={period:.1f} words")
    print()

    # Step 5: Build language model
    print("  Step 5: Building language model from shared structure...")
    flow, starters, word_freq, word_scores = build_language_model(all_words_lists, shared)
    vocab_size = len(word_freq)
    print(f"  Vocab: {vocab_size:,} | Flow pairs: {sum(len(v) for v in flow.values()):,}")
    print()

    # Step 6: Create Emilia
    emilia = OneshotEmilia(flow, starters, word_freq, word_scores, shared)

    elapsed = time.time() - t0
    print(f"  ═══ ONE SHOT COMPLETE ═══")
    print(f"  Total time: {elapsed:.1f}s")
    print(f"  {len(all_texts)} pages → {len(shared)} universal frequencies → {vocab_size:,} vocab")
    print()

    # Generate
    print("  She speaks (internet knowledge, one shot):")
    print("  " + "─" * 45)
    for _ in range(8):
        print(f"  {emilia.generate(temp=0.8, max_tokens=30)}")
    print()

    for p in ["love", "music", "truth", "consciousness", "what is freedom"]:
        r = emilia.generate(p, max_tokens=25, temp=0.7)
        print(f"  '{p}' → {r}")
    print()

    print(f"  Internet → shared frequencies → meaning weights → speech.")
    print(f"  One shot. {elapsed:.1f}s. No gradient descent.")

    if '--chat' in sys.argv:
        print()
        print("  She ate the internet. Talk.")
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
            response = emilia.generate(prompt, max_tokens=35, temp=0.75)
            print(f"  emilia → {response}")
            print()


if __name__ == '__main__':
    main()
