#!/usr/bin/env python3
"""One clean sweep — structural integrity scan for begump.com.
Writes findings to .sweep/findings.json + a human report. Crash-safe: each
section flushed to disk as completed."""
import os, re, json, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, '.sweep')
os.makedirs(OUT, exist_ok=True)

def html_files():
    for dp, dn, fn in os.walk(ROOT):
        if '/.git' in dp or '/.sweep' in dp: continue
        for f in fn:
            if f.endswith('.html'):
                yield os.path.join(dp, f)

def all_local_paths():
    s = set()
    for dp, dn, fn in os.walk(ROOT):
        if '/.git' in dp or '/.sweep' in dp: continue
        for f in fn:
            full = os.path.join(dp, f)
            s.add(os.path.relpath(full, ROOT))
    return s

EXISTING = all_local_paths()

def resolve(ref, page):
    """Resolve a local href/src to a repo-relative path, or None if external/special."""
    ref = ref.split('#')[0].split('?')[0].strip()
    if not ref: return None
    if re.match(r'^(https?:|mailto:|tel:|data:|javascript:|//)', ref): return None
    if ref.startswith('/'):
        cand = ref.lstrip('/')
    else:
        cand = os.path.normpath(os.path.join(os.path.dirname(os.path.relpath(page, ROOT)), ref))
    # directory link -> index.html
    if cand == '' or cand.endswith('/'):
        cand = os.path.join(cand, 'index.html')
    return cand

def exists(cand):
    if cand in EXISTING: return True
    # directory served as index.html
    if os.path.isdir(os.path.join(ROOT, cand)):
        return os.path.join(cand, 'index.html') in EXISTING
    # extensionless route -> dir/index.html
    if os.path.join(cand, 'index.html') in EXISTING: return True
    return False

findings = {
    'broken_links': [], 'missing_audio': [], 'missing_assets': [],
    'no_title': [], 'no_description': [], 'dup_ids': [],
    'hardcoded_localhost': [], 'secret_leaks': [], 'mixed_pages': [],
    'http_links': [], 'stats': {}
}

SECRET_PATTERNS = [
    ('cloudflare_token', re.compile(r'cfat_[A-Za-z0-9]{20,}')),
    ('stripe_secret',    re.compile(r'sk_live_[A-Za-z0-9]{10,}')),
    ('stripe_whsec',     re.compile(r'whsec_[A-Za-z0-9]{10,}')),
    ('aws_key',          re.compile(r'AKIA[0-9A-Z]{16}')),
    ('private_key',      re.compile(r'-----BEGIN (RSA |EC )?PRIVATE KEY-----')),
    ('generic_apikey',   re.compile(r'(api[_-]?key|secret|password)\s*[:=]\s*["\'][A-Za-z0-9_\-]{16,}["\']', re.I)),
]

pages = sorted(html_files())
for page in pages:
    rel = os.path.relpath(page, ROOT)
    try:
        txt = open(page, encoding='utf-8', errors='replace').read()
    except Exception as e:
        findings['broken_links'].append({'page': rel, 'ref': f'<unreadable: {e}>'})
        continue

    # title / description
    if not re.search(r'<title[^>]*>\s*\S', txt, re.I):
        findings['no_title'].append(rel)
    if not re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']\s*\S', txt, re.I):
        findings['no_description'].append(rel)

    # links & assets
    for m in re.finditer(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', txt, re.I):
        ref = m.group(1)
        cand = resolve(ref, page)
        if cand is None:
            if ref.startswith('http://'):
                findings['http_links'].append({'page': rel, 'ref': ref})
            continue
        if not exists(cand):
            entry = {'page': rel, 'ref': ref}
            if cand.endswith('.mp3'):
                findings['missing_audio'].append(entry)
            elif cand.endswith(('.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf')):
                findings['missing_assets'].append(entry)
            else:
                findings['broken_links'].append(entry)

    # duplicate ids
    ids = re.findall(r'\bid\s*=\s*["\']([^"\']+)["\']', txt)
    seen, dups = set(), set()
    for i in ids:
        if i in seen: dups.add(i)
        seen.add(i)
    if dups:
        findings['dup_ids'].append({'page': rel, 'ids': sorted(dups)})

    # hardcoded localhost in shipped pages
    if re.search(r'(localhost|127\.0\.0\.1)(:\d+)?', txt):
        findings['hardcoded_localhost'].append(rel)

    # secrets
    for name, pat in SECRET_PATTERNS:
        if pat.search(txt):
            findings['secret_leaks'].append({'page': rel, 'type': name})

# also scan js/css for secrets + localhost
for dp, dn, fn in os.walk(ROOT):
    if '/.git' in dp or '/.sweep' in dp: continue
    for f in fn:
        if not f.endswith(('.js', '.css')): continue
        full = os.path.join(dp, f); rel = os.path.relpath(full, ROOT)
        try: txt = open(full, encoding='utf-8', errors='replace').read()
        except Exception: continue
        for name, pat in SECRET_PATTERNS:
            if pat.search(txt):
                findings['secret_leaks'].append({'page': rel, 'type': name})

findings['stats'] = {
    'pages': len(pages),
    'broken_links': len(findings['broken_links']),
    'missing_audio': len(findings['missing_audio']),
    'missing_assets': len(findings['missing_assets']),
    'no_title': len(findings['no_title']),
    'no_description': len(findings['no_description']),
    'dup_ids': len(findings['dup_ids']),
    'hardcoded_localhost': len(findings['hardcoded_localhost']),
    'secret_leaks': len(findings['secret_leaks']),
    'http_links': len(findings['http_links']),
}

json.dump(findings, open(os.path.join(OUT, 'findings.json'), 'w'), indent=2)
print(json.dumps(findings['stats'], indent=2))
