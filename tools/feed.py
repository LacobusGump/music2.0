# what is what?
#!/usr/bin/env python3
"""
FEED HARMONIA — download, compress, merge knowledge sources
============================================================
Each source becomes spectral modes. Modes merge. She grows.

Usage:
  python3 feed.py all          # download + compress everything
  python3 feed.py wiki         # just wikipedia
  python3 feed.py books        # classic literature
  python3 feed.py science      # arxiv abstracts
  python3 feed.py export       # export spectrum as JS for browser

The spectrum is her vocabulary. Not her soul — that's hardcoded.
This gives her WORDS to express what she already knows.
"""
import sys, os, json, urllib.request, re, time
sys.path.insert(0, os.path.dirname(__file__))
from compress import tokenize, extract_cooccurrence, compress, build_spectrum, save_spectrum, load_spectrum, SPECTRUM_FILE

CACHE = '/tmp/harmonia_data'
os.makedirs(CACHE, exist_ok=True)

def download(url, path):
    if os.path.exists(path):
        print(f'  cached: {path}')
        return
    print(f'  downloading: {url[:80]}...')
    urllib.request.urlretrieve(url, path)
    print(f'  saved: {os.path.getsize(path)/1024/1024:.1f} MB')

def ingest_text(path, name):
    """Ingest a text file, return (modes, vocab)."""
    print(f'Processing {name}...')
    with open(path) as f:
        text = f.read()
    tokens = tokenize(text)
    print(f'  {len(tokens):,} tokens from {len(text)/1024/1024:.1f} MB')
    freq, cooc = extract_cooccurrence(tokens)
    modes, vocab = compress(freq, cooc, max_modes=5000)
    return modes, vocab

def merge_into_spectrum(new_modes, new_vocab, source_name):
    """Merge new modes into existing spectrum."""
    existing = load_spectrum()
    merged_modes = {}

    if existing:
        for w1, w2, score in existing['modes']:
            key = (min(w1,w2), max(w1,w2))
            merged_modes[key] = merged_modes.get(key, 0) + score

    for w1, w2, score, count in new_modes:
        key = (min(w1,w2), max(w1,w2))
        merged_modes[key] = merged_modes.get(key, 0) + score

    sorted_modes = sorted(merged_modes.items(), key=lambda x: -x[1])[:15000]
    final_modes = [(k[0], k[1], round(v, 3)) for k, v in sorted_modes]

    merged_vocab = dict(existing['vocab']) if existing else {}
    for w, c in new_vocab.items():
        merged_vocab[w] = merged_vocab.get(w, 0) + c
    top_vocab = dict(sorted(merged_vocab.items(), key=lambda x: -x[1])[:30000])

    sources = existing['stats'].get('sources', []) if existing else []
    if source_name not in sources:
        sources.append(source_name)

    spectrum = {
        'vocab': top_vocab,
        'modes': final_modes,
        'stats': {'vocab_size': len(top_vocab), 'mode_count': len(final_modes),
                  'sources': sources, 'timestamp': time.time()}
    }
    save_spectrum(spectrum)
    print(f'  MERGED: {len(final_modes):,} modes, {len(top_vocab):,} words')
    print(f'  Sources: {", ".join(sources)}')

def feed_books():
    """Classic literature from Project Gutenberg."""
    books = {
        'pride': 'https://www.gutenberg.org/files/1342/1342-0.txt',
        'frankenstein': 'https://www.gutenberg.org/files/84/84-0.txt',
        'alice': 'https://www.gutenberg.org/files/11/11-0.txt',
        'sherlock': 'https://www.gutenberg.org/files/1661/1661-0.txt',
        'twocities': 'https://www.gutenberg.org/files/98/98-0.txt',
        'mobydick': 'https://www.gutenberg.org/files/2701/2701-0.txt',
        'tom': 'https://www.gutenberg.org/files/74/74-0.txt',
        'jekyll': 'https://www.gutenberg.org/files/43/43-0.txt',
        'expectations': 'https://www.gutenberg.org/files/1400/1400-0.txt',
        'war_peace': 'https://www.gutenberg.org/files/2600/2600-0.txt',
        'odyssey': 'https://www.gutenberg.org/files/1727/1727-0.txt',
        'republic': 'https://www.gutenberg.org/files/1497/1497-0.txt',
        'meditations': 'https://www.gutenberg.org/files/2680/2680-0.txt',
        'art_of_war': 'https://www.gutenberg.org/files/132/132-0.txt',
        'origin_species': 'https://www.gutenberg.org/files/1228/1228-0.txt',
    }
    all_text = ''
    for name, url in books.items():
        path = os.path.join(CACHE, f'gutenberg_{name}.txt')
        download(url, path)
        with open(path) as f:
            all_text += f.read() + '\n'
    combined = os.path.join(CACHE, 'all_books.txt')
    with open(combined, 'w') as f:
        f.write(all_text)
    modes, vocab = ingest_text(combined, 'classic_literature')
    merge_into_spectrum(modes, vocab, 'gutenberg_classics')

def export_js():
    """Export spectrum as a JS file Harmonia can load in browser."""
    spectrum = load_spectrum()
    if not spectrum:
        print('No spectrum. Run feed.py all first.')
        return

    # Export as compact JS
    js_path = os.path.join(os.path.dirname(__file__), '..', 'harmonia', 'spectrum.js')
    with open(js_path, 'w') as f:
        f.write('// Harmonia\'s knowledge spectrum — compressed from:\n')
        f.write('// ' + ', '.join(spectrum['stats'].get('sources', [])) + '\n')
        f.write('// ' + str(spectrum['stats']['mode_count']) + ' modes, ')
        f.write(str(spectrum['stats']['vocab_size']) + ' words\n')
        f.write('var SPECTRUM = ')
        # Compact format: just the modes as arrays
        compact = {
            'm': [[w1,w2,s] for w1,w2,s in spectrum['modes'][:10000]],
            'v': list(spectrum['vocab'].keys())[:20000]
        }
        json.dump(compact, f, separators=(',',':'))
        f.write(';\n')

    size = os.path.getsize(js_path)
    print(f'Exported: harmonia/spectrum.js ({size/1024:.0f} KB)')
    print(f'  {len(compact["m"]):,} modes, {len(compact["v"]):,} words')
    print(f'  Load in browser: <script src="spectrum.js"></script>')

def main():
    if len(sys.argv) < 2:
        print('\n  FEED HARMONIA')
        print('  all     — everything')
        print('  wiki    — Simple English Wikipedia')
        print('  books   — classic literature')
        print('  export  — spectrum → JS for browser\n')
        return

    cmd = sys.argv[1]
    if cmd == 'books':
        feed_books()
    elif cmd == 'wiki':
        from compress import ingest_wiki
        wiki_path = os.path.join(CACHE, 'simplewiki.xml.bz2')
        if not os.path.exists(wiki_path):
            download('https://dumps.wikimedia.org/simplewiki/latest/simplewiki-latest-pages-articles.xml.bz2', wiki_path)
        ingest_wiki(wiki_path)
    elif cmd == 'export':
        export_js()
    elif cmd == 'all':
        feed_books()
        print()
        # Wiki already processed, just merge
        print('Wikipedia already in spectrum from earlier.')
        print()
        export_js()

if __name__ == '__main__':
    main()
