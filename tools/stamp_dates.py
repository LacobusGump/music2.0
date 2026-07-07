#!/usr/bin/env python3
"""
stamp_dates.py — write/refresh "written / last edited" dates on every research
page, pulled directly from git history. Never estimates a date; every value
here is git's own recorded timestamp for that file. Rerunnable at any time —
idempotent, safe to run again after future edits to refresh "last edited".

Usage: python3 tools/stamp_dates.py [--dry-run]
"""
import subprocess, glob, re, sys

DRY_RUN = '--dry-run' in sys.argv

# Redirect stubs — no real authored content, nothing to date.
SKIP_NO_CONTENT = {
    'research/earth-cell/index.html', 'research/for-taelin/index.html',
    'research/math/index.html', 'research/planetary-geometry/index.html',
    'research/sacsayhuaman/index.html', 'research/sleep-dreams/index.html',
    'research/the-jumps/index.html', 'research/the-shape-keepers/index.html',
    'research/why-137/index.html',
}

# Explicitly excluded per instruction — leave calendar-decode alone entirely.
SKIP_EXPLICIT = {'research/calendar-decode/index.html'}

# Pages where the first <h1> is a password-gate overlay title, not the real
# content title — anchor to the second </h1> instead of the first.
SECOND_H1 = {
    'research/crop-circles/index.html', 'research/leedskalnin/index.html',
    'research/loo9/index.html', 'research/shroud/index.html',
    'research/sirius-thesis/index.html',
}

STAMP_OPEN = '<!-- DATE_STAMP -->'
STAMP_CLOSE = '<!-- /DATE_STAMP -->'


def git_date(args, path):
    out = subprocess.run(['git', 'log'] + args + ['--', path],
                          capture_output=True, text=True, check=True).stdout.strip()
    return out.split('\n')[-1] if out else None


def get_dates(path):
    created = git_date(['--follow', '--diff-filter=A', '--format=%ad', '--date=short'], path)
    edited = git_date(['-1', '--format=%ad', '--date=short'], path)
    return created, edited


def make_stamp(created, edited):
    text = f'written {created}' if created == edited else f'written {created} &middot; last edited {edited}'
    return (f'{STAMP_OPEN}<div style="font-family:\'Courier New\',monospace;font-size:0.68em;'
            f'color:rgba(139,74,46,0.42);margin:2px 0 16px;letter-spacing:0.02em;">{text}</div>{STAMP_CLOSE}')


def insert_stamp(content, stamp, use_second_h1):
    # idempotent: replace an existing stamp if present
    existing = re.search(re.escape(STAMP_OPEN) + '.*?' + re.escape(STAMP_CLOSE), content, re.DOTALL)
    if existing:
        return content[:existing.start()] + stamp + content[existing.end():]
    h1_closes = [m.end() for m in re.finditer(r'</h1>', content)]
    if not h1_closes:
        return None
    idx = h1_closes[1] if (use_second_h1 and len(h1_closes) > 1) else h1_closes[0]
    return content[:idx] + '\n' + stamp + content[idx:]


def main():
    files = sorted(glob.glob('research/**/index.html', recursive=True))
    updated, skipped, errors = 0, 0, []
    for f in files:
        if f in SKIP_NO_CONTENT or f in SKIP_EXPLICIT:
            skipped += 1
            continue
        created, edited = get_dates(f)
        if not created or not edited:
            errors.append(f)
            continue
        stamp = make_stamp(created, edited)
        content = open(f, encoding='utf-8').read()
        new_content = insert_stamp(content, stamp, f in SECOND_H1)
        if new_content is None:
            errors.append(f)
            continue
        if new_content != content:
            if not DRY_RUN:
                open(f, 'w', encoding='utf-8').write(new_content)
            updated += 1
    print(f"Updated: {updated}, skipped (explicit/no-content): {skipped}, errors: {len(errors)}")
    for e in errors:
        print("  ERROR:", e)


if __name__ == '__main__':
    main()
