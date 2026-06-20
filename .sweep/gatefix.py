#!/usr/bin/env python3
"""Remove the dead old-gate (Gate A) and dedupe the new-gate (Gate B).
Content-preserving: never authors gate code, only deletes redundant blocks.

Classify each inline <script> block:
  - external (src=)            -> keep
  - contains 'gump_paid'       -> Gate B (new). Keep FIRST, drop later identical dupes.
  - '_gChk'+'gump_key', no paid -> Gate A (old, dead). DROP.
  - anything else              -> keep
"""
import re, sys, hashlib

SCRIPT = re.compile(r'[ \t]*<script\b[^>]*>.*?</script>\n?', re.S)

def is_external(block):
    head = block[:block.find('>')]
    return ' src=' in head or ' src ' in head

def classify(inner):
    if 'gump_paid' in inner: return 'B'
    if '_gChk' in inner and 'gump_key' in inner: return 'A'
    return 'keep'

def clean(text):
    out, last, seenB = [], 0, set()
    removed = {'A': 0, 'Bdup': 0}
    for m in SCRIPT.finditer(text):
        block = m.group(0)
        out.append(text[last:m.start()]); last = m.end()
        if is_external(block):
            out.append(block); continue
        inner = re.search(r'<script\b[^>]*>(.*)</script>', block, re.S).group(1)
        kind = classify(inner)
        if kind == 'A':
            removed['A'] += 1; continue                      # drop dead gate
        if kind == 'B':
            h = hashlib.md5(inner.encode()).hexdigest()
            if h in seenB:
                removed['Bdup'] += 1; continue               # drop identical dupe
            seenB.add(h); out.append(block); continue
        out.append(block)
    out.append(text[last:])
    return ''.join(out), removed

def main():
    apply = '--apply' in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith('--')]
    for fp in files:
        t = open(fp, encoding='utf-8').read()
        new, rm = clean(t)
        gb = new.count('gump_paid') and 'gump_paid' in new
        status = f"A-removed={rm['A']} Bdup-removed={rm['Bdup']} gateB-present={'gump_paid' in new}"
        if apply and new != t:
            open(fp, 'w', encoding='utf-8').write(new)
            print(f"FIXED {fp}  {status}")
        else:
            print(f"{'WOULD-FIX' if new!=t else 'no-change'} {fp}  {status}")

if __name__ == '__main__':
    main()
