#!/usr/bin/env python3
# whisper_align.py — align lyric lines to audio using Whisper word timestamps
# Usage: python3 tools/whisper_align.py v5/ai/river_doesnt.mp3 river-doesnt/index.html
#
# Outputs a JS cues array you can paste into the lyric page as SONG.cues
# Cues are aligned with the teleprompter's lineIdx (all non-blank lines).

import sys, re, json, os

def normalize(s):
    return re.sub(r"[^a-z0-9' ]", '', s.lower()).strip()

def parse_song(text):
    lines = []
    for line in text.replace('\r','').split('\n'):
        s = line.strip()
        if not s:
            if lines and lines[-1][0] != 'blank':
                lines.append(('blank', ''))
            continue
        m = re.match(r'^\[(.*)\]$', s) or re.match(r'^\((.*)\)$', s)
        if m:
            lines.append(('cue', m.group(1).strip()))
            continue
        lines.append(('lyric', s))
    while lines and lines[0][0] == 'blank': lines.pop(0)
    while lines and lines[-1][0] == 'blank': lines.pop()
    return lines

def extract_song_text(html_path):
    with open(html_path, encoding='utf-8') as f:
        html = f.read()
    m = re.search(r'text:\s*`([\s\S]*?)`\s*\}', html)
    if not m:
        raise ValueError("Could not find SONG.text backtick literal in " + html_path)
    return m.group(1)

def find_line_cue(wwords, wtimes, lyric, start_from):
    tokens = normalize(lyric).split()
    # pick 2-3 significant anchor words (skip very short common words)
    sig = [t for t in tokens if len(t) > 2][:3]
    if not sig:
        sig = tokens[:2]
    if not sig:
        return None, start_from

    best_pos = None
    best_score = -1
    search_end = min(len(wwords), start_from + 80)  # don't search too far ahead
    for i in range(start_from, search_end):
        window = wwords[i:i+len(sig)]
        score = sum(1 for a, b in zip(sig, window) if a == b)
        if score > best_score:
            best_score = score
            best_pos = i

    threshold = max(1, len(sig) - 1)
    if best_pos is not None and best_score >= threshold:
        return wtimes[best_pos], best_pos + 1
    return None, start_from

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 tools/whisper_align.py <audio.mp3> <lyric_page/index.html>")
        sys.exit(1)

    audio_path = sys.argv[1]
    html_path = sys.argv[2]

    print(f"Loading Whisper model...", file=sys.stderr)
    import whisper
    model = whisper.load_model('small')

    print(f"Transcribing {audio_path}...", file=sys.stderr)
    result = model.transcribe(audio_path, word_timestamps=True, language='en')

    # flatten all words
    all_words = []
    for seg in result['segments']:
        for w in seg.get('words', []):
            all_words.append({'w': w['word'].strip(), 's': round(w['start'], 3)})

    wwords = [normalize(w['w']) for w in all_words]
    wtimes = [w['s'] for w in all_words]

    print(f"Got {len(all_words)} words from Whisper", file=sys.stderr)

    # parse lyrics
    text = extract_song_text(html_path)
    lines = parse_song(text)
    # lineIdx = non-blank lines (same logic as teleprompter)
    line_idx = [i for i, l in enumerate(lines) if l[0] != 'blank']

    print(f"Parsed {len(line_idx)} non-blank lines", file=sys.stderr)

    # align each line
    cues = []
    cursor = 0
    lyric_cursor = 0  # track position in whisper words for sequential matching

    for li in line_idx:
        kind, text_line = lines[li]
        if kind == 'cue':
            # stage direction — no whisper match, placeholder (will fill from neighbors)
            cues.append(None)
        else:
            t, new_cursor = find_line_cue(wwords, wtimes, text_line, lyric_cursor)
            if t is not None:
                cues.append(t)
                lyric_cursor = new_cursor
                print(f"  [{t:.2f}] {text_line[:60]}", file=sys.stderr)
            else:
                cues.append(None)
                print(f"  [???] {text_line[:60]}", file=sys.stderr)

    # fill None cues (cue lines) by interpolating between neighbors
    for i in range(len(cues)):
        if cues[i] is None:
            prev = next((cues[j] for j in range(i-1,-1,-1) if cues[j] is not None), 0)
            nxt  = next((cues[j] for j in range(i+1,len(cues)) if cues[j] is not None), prev+2)
            cues[i] = round(prev + (nxt - prev) * 0.5, 3)

    print("\n// paste this into window.SONG:", file=sys.stderr)
    print(f"cues: {json.dumps(cues)},")

if __name__ == '__main__':
    main()
