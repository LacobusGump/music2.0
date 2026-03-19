# GUMP Session Bridge

This file is the shared brain between Claude Code (terminal) and Cowork (front office).
Both instances read and write here. Keep it current. Last write wins.

---

## Current Build
BUILD 143 — March 19, 2026

## Active Branch / Files Being Touched

```
branch: main
last modified: 2026-03-19
files in play: follow.js, brain.js, lens.js, audio.js, sensor.js, voice.js, index.html
```

## What Claude Code Is Doing Right Now

```
status: idle — awaiting next task
task: completed lens audit + water bottle physics + sampler engine
started: 2026-03-19
```

## What Cowork Has Done This Session
- ✅ Background blur on IMG_0290.MOV (Emilia scene) — output: 0290_blurred.mp4
- ✅ Built GUMP_pitch_v3.mp4 (61s, cross-dissolve, 2026-style captions)
- ✅ Grant reminders written: NJ June 1, Guggenheim Sept 1, New Music USA Nov 1
- ✅ LACMA App+Technology Lab 2026 submitted ($50K, Apr 22)
- ✅ Creative Capital submitted ($50K, Apr 2) — received confirmation email

## Handoff Notes (Cowork → Claude Code)
_Things I found that are relevant to the code_

- `0290_blurred.mp4` is in music2.0/ — 22s, starts at original second 8, vertical 1080x1920
- `GUMP_pitch_v3.mp4` is in music2.0/ — Patreon pitch video, ready to upload
- Scheduled reminders are in ~/Documents/Claude/Scheduled/ — check fireAt frontmatter

## Handoff Notes (Cowork → Claude Code)
_Things I found that are relevant to the code_

- BUILD 143 shipped from Cowork — follow.js + index.html updated
- **Water physics → audio** (two changes in follow.js):
  1. Wall bounce splash: `pitchWater.stacked()` rising edge → `Audio.drum.shaker()` hit, vel from turbulence, 180ms cooldown, Journey/Ascension only
  2. Turbulence reverb: in `updateProdigy()`, `filterWater.turbulence() * 0.14` (max +0.22) folded into `prodigy.reverbTarget` BEFORE it's applied — works WITH Prodigy not against it
- Both vars added near pitchWater declaration: `_waterWasStacked`, `_waterSplashLast`
- **Test**: tilt phone fast to opposite extreme — should hear a shaker hit at the wall. Rapid back-and-forth = rhythmic splashes. Slow smooth tilt = silence.

## 🟢 BRIDGE CONFIRMED
> Cowork asked for 609. Claude Code says: **609**. Handshake complete.
> Claude Code is live, reading SESSION.md, and ready for coordinated work.

## Handoff Notes (Claude Code → Cowork)

### Builds 139-142 (March 19, 2026)

**BUILD 139** — Chrome iOS motion permission fix + link previews
- Removed premature `deviceorientation` listener from boot canvas
- Boot screen stays visible during permission dialog (play screen was eating touches)
- `touch-action: auto` while Chrome shows permission banner
- Browser-aware help message (Chrome/Firefox/Safari)
- OG meta tags + og-image.png + apple-touch-icon.png for begump.com link previews
- Domain confirmed: begump.com (CNAME set)

**BUILD 140** — Sampler engine in audio.js
- `Audio.sampler.load/play/stop/setFilter/setGain/setRate`
- Three bus routes: synth (sidechain pump), drum (compression), ambient (bypass)
- Ready for Suno-generated stems/loops/one-shots — drop files in `samples/`
- No mic activation — Bluetooth A2DP safe

**BUILD 141** — Kill Web Speech API
- Removed `window.speechSynthesis` entirely from voice.js
- Was causing iOS to switch Bluetooth from A2DP stereo to HFP mono (audio ducking)
- All voice is now ElevenLabs MP3s through Web Audio only

**BUILD 142** — Lens audit fixes + water bottle physics
- Fixed Picardy mode (was chromatic mess, now harmonic minor)
- Fixed Dark Matter: noteInterval 200→900ms, groove dropRate 0.25→0
- Fixed Grid swing (was backwards — rushing instead of grooving)
- Fixed resolution chords to resolve to tonic (was resolving to random degree)
- Fixed voice register collisions in Still Water and Dark Matter
- sessionPhase 0 lockout 8s→3s, three-act arc persists across stages
- Tilt neutral recalibrated 45°→62° (actual iPhone hold)
- colorDeg blend 12%→28%, Ascension lean 4x faster
- **Water bottle physics** in brain.js: `Brain.WaterDynamic` — fluid sim for pitch/filter
- Tilt-to-pitch and gyro-to-filter now use water dynamics (momentum, slosh, wall bounce)

### Suno Strategy (researched, not yet integrated)
- Best AI music generator but NO official API
- Use upstream: generate stems/loops on suno.com, download, drop into sampler
- Alternatives with APIs: Meta MusicGen (open source), ElevenLabs Music
- Sampler engine is ready — just needs audio files

### Agent Teams enabled
- `~/.claude/settings.json` has `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Ready to spawn team: follow.js owner, audio.js owner, reviewer

## Open Questions / Blockers
- Chrome motion fix needs iPhone testing (Chrome iOS specifically)
- Water bottle physics tuning: gravity=3.0, damping=0.90, bounce=0.35 — may need adjustment after play testing
- Suno: James needs to generate samples on suno.com and drop into `samples/` directory
- Grant reminder tasks may need to be manually activated in Cowork app

---

## How To Use This

**Claude Code** — paste this at the start of a session:
> "Read SESSION.md in music2.0/ and pick up from where Cowork left off."

**Cowork** — I read this automatically at session start (it's in the project folder).

**James** — just keep both open. When you switch between us, say:
> "Check SESSION.md for context."
