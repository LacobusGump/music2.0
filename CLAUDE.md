# CLAUDE.md — music2.0 / begump.com

## The Work

Song per page. Every research page gets a song written FROM it, not about it.
140+ pages. Pattern: render in Suno → tell Claude title + page → embed + push.

Live site: begump.com (GitHub Pages + Cloudflare)
Repo: github.com/LacobusGump/music2.0

---

## Quantum Engine — Always Available

The GUMP quantum server runs hot at `localhost:1370`. Use it.

```python
import sys; sys.path.insert(0, '/Users/jamesmccandless/gump-private/tools')
from qclient import Q
```

**When to reach for it:**
- Generating Suno seeds → `Q.random_seed()` (true quantum random, not pseudo)
- Classifying which song fits which page → `Q.choir()`
- Signal/frequency analysis of music → `Q.flow()`
- Validating coupling claims in research copy → `Q.discriminate()`
- Any optimization (BPM, parameters) → `Q.well()`

Latency: <5ms for most engines. Always hot. Use it before reaching for numpy random.

---

## Song Embed Pattern

```html
<div style="display:flex;align-items:center;gap:12px;margin:20px 0 8px;padding:12px 16px;background:#100c09;border:1px solid rgba(184,117,58,0.12);border-radius:6px;">
  <button id="XX-btn" onclick="var a=document.getElementById('XX');a.paused?(a.play(),this.textContent='▐▐'):(a.pause(),this.textContent='▶')" style="width:32px;height:32px;border-radius:50%;background:rgba(184,117,58,0.10);border:1px solid rgba(184,117,58,0.20);color:rgba(184,117,58,0.70);font-size:0.72em;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;">▶</button>
  <div>
    <div style="font-family:Georgia,serif;font-size:0.82em;color:rgba(196,160,136,0.60);">{TITLE}</div>
    <div style="font-family:Futura,'Century Gothic',sans-serif;font-size:0.38em;letter-spacing:0.18em;text-transform:uppercase;color:rgba(184,117,58,0.38);margin-top:2px;">{SUBTITLE}</div>
  </div>
  <audio id="XX" src="/v5/ai/{slug}.mp3" preload="none" onended="document.getElementById('XX-btn').textContent='▶'"></audio>
</div>
```

Insert after `.sub` element, before the first content div. Unique `id` per page (`ki`, `rd`, `em`, etc.).

---

## File Locations

- AI songs: `/v5/ai/{slug}.mp3`
- James songs: `/v5/james/{slug}.mp3`
- Stems: `/v5/stems/`
- Portal: `/play/index.html` — CATALOG array, indices must match HTML rows exactly
- Body mixer: `/body/index.html`

## Songs Currently Embedded

| Song | Pages |
|------|-------|
| Keep It | aaron-is-right, tesla, van-gogh, nina-simone, bach |
| Executable Memory v1 | the-drum |
| Executable Memory v2 | polyrhythm, music-evolution, body-music, the-groove |
| River Doesn't | for-any-ai |

## Artistic Principles

- Art = clever with meaning WITHOUT naming the actual thing
- Meaning connects AFTER the listener hears it, not during
- God's masterstrokes = deep irony
- Don't write a TED talk. Write from the woke state of love root.
- Oblique imagery always beats direct statement

## Suno Science

- **BPM**: 58=grief, 72=emergence/resting heart, 94=groove pocket
- **Modes**: Phrygian=fatalism, Dorian=hope, Aeolian=conventional sad (avoid)
- **1/f timing**: "natural timing drift not quantized" — makes it alive
- **NEG tags**: as important as positive. Kill Suno defaults.
- **Instrumental**: use for rhythm/body pages — no lyrics needed

---

## Deployment

```bash
git add <files> && git commit -m "message" && git push
```

Cloudflare CDN — purge cache at dash.cloudflare.com after pushing structural changes.
Pages propagate in ~60s after push.
