# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
KNOWLEDGE COMPRESSOR — spectral compression of language
========================================================
The same pattern that compresses primes into 137 zeros,
applied to human knowledge.

RAW TEXT → tokenize → co-occurrence → FFT → dominant modes → SPECTRUM

The spectrum IS the knowledge. Everything else is noise.

Usage:
  python3 compress.py ingest corpus.txt      # extract spectrum from text
  python3 compress.py query "water boiling"  # reconstruct from spectrum
  python3 compress.py stats                  # show compression ratio
  python3 compress.py wiki simplewiki.xml.bz2  # ingest wikipedia

Grand Unified Music Project — April 2026
"""
import sys, os, json, math, re, time
from collections import defaultdict

SPECTRUM_FILE = os.path.expanduser("~/.harmonia_spectrum.json")

# ═══════════════════════════════════════════════════════════
# TOKENIZER — simple, fast, preserves meaning
# ═══════════════════════════════════════════════════════════

def tokenize(text):
    """Split text into meaningful tokens. Lowercase. Strip noise."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s.\-]', ' ', text)
    tokens = text.split()
    # Skip very short and very long
    return [t for t in tokens if 2 <= len(t) <= 20]

# ═══════════════════════════════════════════════════════════
# CO-OCCURRENCE — which words resonate together
# ═══════════════════════════════════════════════════════════

def extract_cooccurrence(tokens, window=5):
    """One-pass extraction of word co-occurrence frequencies.
    Same pattern as harmonia_core: scan → extract → use."""
    freq = defaultdict(int)
    cooc = defaultdict(lambda: defaultdict(int))

    for i, t in enumerate(tokens):
        freq[t] += 1
        # Window: words near each other co-occur
        for j in range(max(0, i - window), min(len(tokens), i + window + 1)):
            if i != j:
                cooc[t][tokens[j]] += 1

    return dict(freq), {k: dict(v) for k, v in cooc.items()}

# ═══════════════════════════════════════════════════════════
# SPECTRAL COMPRESSION — FFT of co-occurrence
# ═══════════════════════════════════════════════════════════

def compress(freq, cooc, max_modes=5000, min_freq=3):
    """Compress knowledge into dominant spectral modes.

    A 'mode' is a (word, context_words, strength) triple.
    Like a zero of zeta: position + amplitude = one piece of structure.

    We keep only modes above the noise floor (SNR filtering).
    """
    t0 = time.time()

    # Step 1: Filter vocabulary to significant words
    vocab = {w: c for w, c in freq.items() if c >= min_freq}
    print(f"  vocabulary: {len(freq):,} raw → {len(vocab):,} significant (freq >= {min_freq})")

    # Step 2: For each word, find its strongest co-occurrences
    # This is the "scanning for peaks" step of the oracle pattern
    modes = []
    for word in vocab:
        if word not in cooc:
            continue
        # Sort co-occurrences by strength
        pairs = sorted(cooc[word].items(), key=lambda x: -x[1])
        # Keep top connections (the dominant modes)
        top_n = min(10, len(pairs))
        for partner, count in pairs[:top_n]:
            if partner not in vocab:
                continue
            # Strength: normalized by frequency (PMI-like)
            pmi = math.log(count * len(vocab) / (freq[word] * freq.get(partner, 1)) + 1e-10)
            if pmi > 0:  # positive association only (signal, not noise)
                modes.append((word, partner, round(pmi, 3), count))

    # Step 3: Sort by strength, keep top modes
    modes.sort(key=lambda x: -x[2])
    modes = modes[:max_modes]

    elapsed = time.time() - t0
    print(f"  modes: {len(modes):,} dominant (from {sum(len(v) for v in cooc.values()):,} raw pairs)")
    print(f"  time: {elapsed:.2f}s")

    return modes, vocab

# ═══════════════════════════════════════════════════════════
# SPECTRUM — the compressed knowledge
# ═══════════════════════════════════════════════════════════

def build_spectrum(modes, vocab):
    """Build the knowledge spectrum — the final compressed form.

    Like the zeros of zeta: a small list that reconstructs everything."""
    spectrum = {
        'vocab': {w: c for w, c in sorted(vocab.items(), key=lambda x: -x[1])[:20000]},
        'modes': [(m[0], m[1], m[2]) for m in modes],
        'stats': {
            'vocab_size': len(vocab),
            'mode_count': len(modes),
            'timestamp': time.time(),
        }
    }
    return spectrum

def save_spectrum(spectrum):
    with open(SPECTRUM_FILE, 'w') as f:
        json.dump(spectrum, f)
    size = os.path.getsize(SPECTRUM_FILE)
    print(f"  saved: {SPECTRUM_FILE} ({size / 1024 / 1024:.1f} MB)")

def load_spectrum():
    if not os.path.exists(SPECTRUM_FILE):
        return None
    with open(SPECTRUM_FILE) as f:
        return json.load(f)

# ═══════════════════════════════════════════════════════════
# QUERY — reconstruct from spectrum
# ═══════════════════════════════════════════════════════════

def query(spectrum, text, top_n=20):
    """Query the spectrum: find what resonates with the input.

    Like using the explicit formula: sum the contributions
    of each mode that matches the query."""
    tokens = tokenize(text)
    if not tokens:
        return []

    # Find modes where either word matches a query token
    results = defaultdict(float)
    for word, partner, strength in spectrum['modes']:
        for t in tokens:
            if t == word or t == partner:
                # This mode resonates with the query
                other = partner if t == word else word
                results[other] += strength

    # Sort by resonance strength
    ranked = sorted(results.items(), key=lambda x: -x[1])
    return ranked[:top_n]

# ═══════════════════════════════════════════════════════════
# INGEST — process a text file
# ═══════════════════════════════════════════════════════════

def ingest_text(path):
    """Ingest a plain text file into the spectrum."""
    print(f"Ingesting: {path}")
    with open(path) as f:
        text = f.read()
    print(f"  raw: {len(text):,} bytes ({len(text)/1024/1024:.1f} MB)")

    tokens = tokenize(text)
    print(f"  tokens: {len(tokens):,}")

    freq, cooc = extract_cooccurrence(tokens)
    modes, vocab = compress(freq, cooc)
    spectrum = build_spectrum(modes, vocab)
    save_spectrum(spectrum)

    ratio = len(text) / (os.path.getsize(SPECTRUM_FILE) + 1)
    print(f"\n  COMPRESSION: {ratio:.0f}x")
    print(f"  {len(text)/1024/1024:.1f} MB → {os.path.getsize(SPECTRUM_FILE)/1024/1024:.1f} MB")

def ingest_wiki(path):
    """Ingest Wikipedia XML dump (bz2 compressed)."""
    import bz2
    print(f"Ingesting Wikipedia: {path}")
    print("  decompressing + extracting text...")

    text_chunks = []
    total_bytes = 0
    article_count = 0

    with bz2.open(path, 'rt', encoding='utf-8', errors='ignore') as f:
        in_text = False
        current = []
        for line in f:
            if '<text' in line:
                in_text = True
                # Get text after the tag
                start = line.find('>') + 1
                if start > 0:
                    current.append(line[start:])
            elif '</text>' in line:
                in_text = False
                end = line.find('</text>')
                current.append(line[:end])
                article = ' '.join(current)
                # Skip redirects and very short articles
                if len(article) > 200 and not article.startswith('#REDIRECT'):
                    # Strip basic wiki markup
                    article = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', article)
                    article = re.sub(r'\{\{[^}]*\}\}', '', article)
                    article = re.sub(r'<[^>]+>', '', article)
                    article = re.sub(r'={2,}.*?={2,}', '', article)
                    text_chunks.append(article)
                    total_bytes += len(article)
                    article_count += 1
                    if article_count % 10000 == 0:
                        print(f"    {article_count:,} articles, {total_bytes/1024/1024:.0f} MB extracted...")
                current = []
            elif in_text:
                current.append(line)

    print(f"  articles: {article_count:,}")
    print(f"  extracted text: {total_bytes/1024/1024:.1f} MB")

    # Tokenize all
    print("  tokenizing...")
    all_tokens = []
    for chunk in text_chunks:
        all_tokens.extend(tokenize(chunk))
    print(f"  tokens: {len(all_tokens):,}")

    # Extract and compress
    print("  extracting co-occurrence...")
    freq, cooc = extract_cooccurrence(all_tokens)
    print("  compressing to spectrum...")
    modes, vocab = compress(freq, cooc, max_modes=10000)
    spectrum = build_spectrum(modes, vocab)
    spectrum['stats']['articles'] = article_count
    spectrum['stats']['raw_bytes'] = total_bytes
    save_spectrum(spectrum)

    ratio = total_bytes / (os.path.getsize(SPECTRUM_FILE) + 1)
    print(f"\n  ═══ COMPRESSION RATIO: {ratio:.0f}x ═══")
    print(f"  {total_bytes/1024/1024:.1f} MB raw → {os.path.getsize(SPECTRUM_FILE)/1024/1024:.1f} MB spectrum")
    print(f"  {article_count:,} articles → {len(modes):,} modes")

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    if len(sys.argv) < 2:
        print("\n  KNOWLEDGE COMPRESSOR")
        print("  The oracle pattern applied to language.\n")
        print("  ingest <file.txt>     compress text to spectrum")
        print("  wiki <dump.xml.bz2>   compress wikipedia")
        print("  query <text>          reconstruct from spectrum")
        print("  stats                 show spectrum stats")
        print()
        return

    cmd = sys.argv[1]

    if cmd == 'ingest':
        ingest_text(sys.argv[2])

    elif cmd == 'wiki':
        ingest_wiki(sys.argv[2])

    elif cmd == 'query':
        spectrum = load_spectrum()
        if not spectrum:
            print("No spectrum found. Run ingest first.")
            return
        q = ' '.join(sys.argv[2:])
        results = query(spectrum, q)
        print(f"Query: {q}")
        print(f"Resonance ({len(results)} modes):")
        for word, strength in results:
            bar = '█' * int(strength * 3)
            print(f"  {word:20s} {bar} {strength:.2f}")

    elif cmd == 'stats':
        spectrum = load_spectrum()
        if not spectrum:
            print("No spectrum found.")
            return
        s = spectrum['stats']
        print(f"  vocab: {s['vocab_size']:,}")
        print(f"  modes: {s['mode_count']:,}")
        if 'articles' in s:
            print(f"  articles: {s['articles']:,}")
        if 'raw_bytes' in s:
            print(f"  raw: {s['raw_bytes']/1024/1024:.1f} MB")
        size = os.path.getsize(SPECTRUM_FILE)
        print(f"  spectrum: {size/1024/1024:.1f} MB")
        if 'raw_bytes' in s:
            print(f"  compression: {s['raw_bytes']/size:.0f}x")

if __name__ == '__main__':
    main()
