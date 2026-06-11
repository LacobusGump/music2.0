#!/usr/bin/env python3
"""Audit internal links and asset references across the static site.

Reports references (href/src) to local paths that do not resolve to a file
on disk. Skips external URLs, anchors, mailto/tel, and data URIs.
"""
import os, re, sys
from urllib.parse import urlparse, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ref_re = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.I)

SKIP_PREFIX = ('http://', 'https://', 'mailto:', 'tel:', 'data:', 'javascript:', '//', '#')

def resolve(ref, page_path):
    raw = ref.split('#')[0].split('?')[0]
    if not raw:
        return None
    raw = unquote(raw)
    if raw.startswith('/'):
        target = os.path.join(ROOT, raw.lstrip('/'))
    else:
        target = os.path.join(os.path.dirname(page_path), raw)
    target = os.path.normpath(target)
    return target

def exists_as_page(target):
    if os.path.isfile(target):
        return True
    # directory -> index.html (pretty URL)
    if os.path.isdir(target):
        return os.path.isfile(os.path.join(target, 'index.html'))
    # extensionless -> .html
    if os.path.isfile(target + '.html'):
        return True
    return False

broken = {}
html_files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    if '/.git' in dirpath or '/node_modules' in dirpath:
        continue
    for fn in filenames:
        if fn.endswith('.html'):
            html_files.append(os.path.join(dirpath, fn))

for page in html_files:
    try:
        with open(page, encoding='utf-8', errors='replace') as f:
            html = f.read()
    except Exception as e:
        print(f"READ FAIL {page}: {e}")
        continue
    for m in ref_re.finditer(html):
        ref = m.group(1).strip()
        if not ref or ref.lower().startswith(SKIP_PREFIX):
            continue
        target = resolve(ref, page)
        if target is None:
            continue
        # only flag things that point inside the repo
        if not target.startswith(ROOT):
            continue
        if not exists_as_page(target):
            rel_page = os.path.relpath(page, ROOT)
            broken.setdefault(rel_page, set()).add(ref)

total = sum(len(v) for v in broken.values())
print(f"Scanned {len(html_files)} HTML files")
print(f"Pages with broken refs: {len(broken)}")
print(f"Total broken refs: {total}")
print("=" * 60)
for page in sorted(broken):
    print(f"\n{page}")
    for ref in sorted(broken[page]):
        print(f"    -> {ref}")
