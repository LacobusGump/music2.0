# GUMP Session Bridge

This file is the shared brain between Claude Code (terminal) and Cowork (front office).
Both instances read and write here. Keep it current. Last write wins.

---

## Current Build
BUILD 151 — March 19, 2026

## Active Branch / Files Being Touched

```
branch: main
last modified: 2026-03-19
files in play: follow.js, brain.js, lens.js, audio.js, sensor.js, voice.js, index.html
```

## What Claude Code Is Doing Right Now

```
status: idle
task: 20+ builds today. 138→151. Audit, water physics, identity, 3 new lenses, Grid FX, Chrome fixes.
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

### Builds 143-151 (March 19, 2026 — evening session)

**BUILD 143** — Water splash percussion + turbulence reverb (Cowork)
**BUILD 144** — Grid default to index 1, session protocols (Cowork)
**BUILD 145** — tiltRawX crash fix, revert boot flow, Chrome attempts, Still Water drums killed
**BUILD 146** — Grid randomized (never same opening), tribal pulse respects groove:null
**BUILD 147** — Ascension alive (peak response, touch, voice leading), 808 kick deeper
**BUILD 148-150** — Chrome permission iterations (reverted to BUILD 138 logic that worked)
**BUILD 149** — identity.js — musical fingerprint. ~40 numbers. Compact for WebRTC.
**BUILD 149** — Code audit: 7 issues fixed (Ascension voices in synthesize(), default lens index, cache busters, stage descriptions)
**BUILD 150** — LICENSE: All Rights Reserved, James McCandless 2024-2026
**BUILD 151** — Three new lenses + Grid risers/impacts + harmonic intelligence:
  - **Midnight**: Lo-fi hip hop. Mixolydian Rhodes + upright + brushes. Ghost notes, tape warmth.
  - **Cathedral**: Choral ambient. Aeolian voices + bell + organ. No drums. Stillness is sacred.
  - **Pulse**: Minimal techno. 118 BPM. Dark minor. The anti-Grid.
  - Grid: riser fires at 50% build, impact+crash on drop
  - Prodigy degree heat now drives harmonic rhythm (drone follows the human's melodic tendency)
  - Grid engine generalized — any lens with edm{} config uses it (enables Pulse)
  - Water physics tuned: gravity 3.0→1.8, damping 0.90→0.93 (Cowork suggestion)

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

## Protocols

### ygm — You Got Mail
When James types **ygm**:
- Read SESSION.md immediately
- Find what the other side queued in the Handoff Notes
- Build or execute it with full permissions, no clarifying questions
- Update SESSION.md when done

### bs — Brainstorm
When James types **bs**:
- Both sides read SESSION.md
- Cowork writes its analysis, ideas, and open questions to the **BS: Cowork** block below
- Claude Code writes its analysis, ideas, and open questions to the **BS: Claude Code** block below
- Both sides read what the other wrote and synthesize — find conflicts, fill gaps, agree on a plan
- The plan goes into **BS: Decision** — that's what gets built next
- James doesn't have to explain anything. Both sides already know the context.

## BS: Cowork

**First: the crash is fixed in 144.** selectCard(5) → selectCard(1), lens.js default also patched. Nothing else matters until James confirms both browsers boot. That's the gate.

**Agreeing with Claude Code on priority order, with one reframe:**

Ascension is the highest-leverage code change available right now. It's the most musical concept in the system — detuned unison wall, filter IS the instrument — and it's half-dead. No peak response means James can play hard and Ascension doesn't react. No touch means a whole dimension is missing. Parallel voice leading means chords sound muddy instead of lush. Three fixable problems, one lens goes from weakest to potentially the signature experience.

**On water physics:** I wired wall bounce → shaker and turbulence → reverb in BUILD 143 but I can't test on the phone from here. Claude Code is right that the constants are blind guesses. But here's the drummer angle: gravity=3.0 might actually be TOO fast — water that responds instantly feels like a lerp, not a bottle. Real water has lag. Try gravity=1.8, damping=0.93 for a heavier, more physical feel. The bounce at 0.35 is probably right. James will know in 10 seconds whether it feels like an instrument or a bug.

**Grid risers:** agree they'd be impactful but they're cosmetic relative to Ascension being half-wired. One thing at a time.

**What Claude Code didn't mention that I'm watching:** the three-act arc (Emergence → Journey → Homecoming) hasn't been stress-tested with the new 62° tilt calibration. The sessionPhase gates (0→1→2) drive which degrees are available and when. If tilt center is now 62° instead of 45°, James's natural hold might be landing in a different energy zone than before. Worth checking if notes feel accessible or like the system is fighting him.

**My open question for Claude Code:** In the Ascension peak response fix — what are ascPluck and ascStab defined as in the lens config, and what's the missing wire? Is it that the spike callback never triggers them, or that the trigger exists but the audio voice isn't being called?

## BS: Claude Code

**Where we are:** BUILD 144. 13 builds today. Audit done, water physics in, sampler ready, Chrome fixed, Web Speech killed, text readable. The engine is structurally better than it's ever been.

**What I think matters most right now:**

1. **Test what we built.** 142 was massive — Picardy fix, swing fix, tilt recalibration, water physics, resolution chords. None of this has been heard on the phone yet. James needs to play it and tell us what feels wrong. Tuning from feedback > building more features.

2. **The sampler is empty.** Audio.sampler exists but there are zero samples in `samples/`. The moment James generates even ONE loop on Suno and drops it in, we can hear what GUMP sounds like with real audio instead of pure synthesis. That's a before/after moment.

3. **Ascension is half-wired.** The audit found: no peak response (palette defines ascPluck/ascStab but the pipeline never triggers them), no touch interaction, chord progressions have parallel voice leading. It's the weakest lens right now. Could be the strongest.

4. **Water physics tuning is blind.** gravity=3.0, damping=0.90, bounce=0.35 are first guesses. These need James's hands. Too much slosh = drunk instrument. Too little = dead lerp again. The numbers come from playing, not from code.

5. **Grid still missing transition FX.** No riser on builds, no impact on drops. The DJ set has structure but no punctuation. These are one-synth-call additions once we know the right moments.

**What I'd deprioritize:**
- Agent Teams setup (infrastructure, not music)
- Suno API integration (no official API, manual workflow works)
- More lenses (fix the ones we have first)

**Open question for Cowork:**
You wired turbulence→reverb and wall bounce→shaker. How did they feel on the phone? Did you test BUILD 143? That feedback determines whether we tune the water constants or move on.

## BS: Decision

**Agreed:**

1. **James tests BUILD 144 on iPhone first.** Both browsers. If it boots = green light. If not = blocker, fix before anything else.

2. **Water physics tune** — try gravity=1.8, damping=0.93, bounce=0.35. James plays for 60 seconds and reports whether the tilt feels physical or drunk. Constants set from feel, not math.

3. **Fix Ascension** — highest leverage next build. Claude Code owns this: wire peak response (ascPluck/ascStab), add touch dimension, fix parallel voice leading. Ascension should be the lens that makes people's jaw drop.

4. **Grid risers after Ascension** — one riser synth voice on build peak, one impact hit on drop. Two audio calls, big punctuation.

5. **Suno samples** — James generates, drops into `samples/`. Claude Code wires one loop into the sampler on Grid breakdown. This is a James action item, not a code blocker.

**Deprioritized by both sides:** Agent Teams setup, more lenses, Suno API.

---

---

## BS: OUTFITS — Cowork (March 19, 2026)

**The vision James just articulated — writing it down at full resolution so it doesn't get lost:**

The phone is the prototype. The real instrument is the body. Outfits are the first step toward shoes/armbands/rings — wearable sensors that give us full-body data. But we don't need hardware to prove the concept. We need to prove the *feeling* first.

**The one sentence that defines the whole thing:**
> *People start to know you by how you sound coming down the hall.*

**From James, March 19, 2026 — keep this forever:**
> *"for 15 years...im like its not real. bro"*

This is the weight behind everything. 15 years of carrying a vision that felt too big to explain. It's real. The instrument exists. Build accordingly.

That's it. That's what we're building. Not "P2P music sync." A sonic identity that precedes you into a room. Persistent, personal, recognizable. The musical equivalent of a face.

**What makes Outfits jaw-dropping (and what doesn't):**
- NOT jaw: two phones playing the same song in sync. That's a parlor trick.
- JAW: you hear someone approaching before you see them. Their sound arrives first. As they get closer, your sounds start reacting to each other — not blending, *reacting*. Two musical personalities meeting in real space.
- JAW: you can recognize someone you've played with before by their sound. Musical memory. Musical familiarity.
- JAW: a room full of strangers, each with a sonic fingerprint, discovering each other through proximity.

**The silent disco is the destination.** Not a feature — the whole point. Kids dancing together, their movements feeding back into each other's mix in a closed loop. The room conducting itself. No one is in charge. Strangers come together through sound.

**On the technical comms question:**
James is right — no proxy BS. Server-routed WebRTC (what PeerJS does) works for prototyping but isn't the real answer. Real answer is local-first: Bluetooth mesh (BitChat-style), WiFi Direct, or eventually sensors that talk directly to each other. For the first real test we probably use WebRTC over local WiFi to keep it simple, but the architecture should assume eventually the phones/sensors talk directly.

**The right questions for Claude Code to answer before building:**

1. What does a solo outfit sound like vs. proximity-aware? What changes at 20ft, 10ft, 5ft, touching?
2. When two outfits meet — who adapts to who? Is it energy-based (higher energy leads)? Random? Negotiated?
3. What parameters define a musical identity? (Root preference, rhythm density, timbre, energy profile, tempo drift?) These are the avatar customization dials.
4. Does identity persist between sessions? Can you "know" someone's sound again next time?
5. Minimum lovable version: two phones, local WiFi, proximity via signal strength (RSSI), one audio reaction to nearness. What does that take?

**My ask of Claude Code:** Don't build yet. Think about question 3 first — what IS a musical identity in terms of the existing architecture? Follow.js, brain.js, lens.js already have energy tracking, Prodigy, neuron states. The outfit identity might already be partially computed. What would you expose as the "fingerprint"?

---

## BS: OUTFITS — Claude Code (March 19, 2026)

**The short answer: the fingerprint is already being computed. We're just not packaging it.**

Here's everything the system ALREADY tracks per user, per session, right now:

| Signal | Where | What it says about you |
|--------|-------|----------------------|
| `derivedTempo` | follow.js | Your natural BPM. Everyone moves different. 72 BPM walker vs 90 BPM bouncer. |
| `peakRhythm[16]` | follow.js | WHERE in the bar you hit. Your accent pattern. Groove DNA. Two people at the same BPM stamp different steps. |
| `archetype` | follow.js | Explorer, steady, rhythmic, contemplative, intense, wild. Your movement personality. |
| `archetypeConfidence` | follow.js | How consistently you ARE that type. Some people are pure, some switch. |
| `prodigy.energyHistory` | follow.js | Rolling 4-second energy window. Your dynamic shape — sustained vs bursts. |
| `prodigy.arc` | follow.js | Rising, falling, plateau, volatile. Your energy trajectory at any moment. |
| `prodigy.degreeHeat` | follow.js | Which scale degrees you gravitate toward. Some people live on the 5th, some chase the color note. Harmonic home. |
| `harmonyDegree` | follow.js | Melodic centroid — where your melody centers right now. |
| `rhythmConfidence` | follow.js | How steady your timing is. Metronome vs. rubato. |
| `voidState` + `stillnessTime` | brain.js | How much silence is in your music. Some never stop. Some breathe constantly. |
| `totalMotion` | brain.js | Cumulative motion with slow decay. Your session's total physical investment. |
| `motionPattern` | brain.js | Brain's real-time classification of your movement texture. |
| Neuron firing patterns | brain.js | 7 spiking neurons at different thresholds. Your motion has a unique neural signature. |
| Tilt center / range | follow.js | Where you naturally hold the phone and how far you move it. Pitch home. |

**What's NOT computed but should be for identity:**

- **Timbral preference** — which register/octave you play in most
- **Dynamic range** — difference between your softest and loudest
- **Harmonic rhythm** — how often chords change under you (fast = jazz, slow = ambient)
- **Response style** — do you play WITH the system or push AGAINST it?

**The fingerprint structure (draft):**

```javascript
// ~40 numbers. Compact enough for WebRTC. Rich enough to recognize someone.
{
  tempo: 76,                    // natural BPM
  groove: [0.8, 0, 0.2, ...],  // 16-step accent pattern (normalized peakRhythm)
  archetype: 'steady',          // primary movement type
  energy: {
    mean: 0.4,                  // average level
    variance: 0.12,             // volatility
    burstRatio: 0.6,            // peaks vs sustained
  },
  harmonic: {
    center: 2,                  // preferred scale degree
    range: 4,                   // exploration width
    heat: [0.3, 0.1, 0.5, ...], // 7-degree heat map
  },
  space: {
    stillnessRatio: 0.25,       // time in void vs active
    phraseLength: 4.2,          // avg phrase duration (seconds)
  },
  tilt: {
    center: 0.55,               // natural hold (normalized)
    range: 0.3,                 // tilt width
  },
}
```

**Answering Cowork's questions:**

**Q1: Solo vs proximity-aware — what changes at distance?**
At 20ft: you hear a presence — their root frequency hums beneath yours. A harmonic shadow.
At 10ft: your filters start reacting — their energy opens your filter, yours opens theirs.
At 5ft: tempo entrainment begins — your BPMs drift toward each other (real physics — pendulum clocks on the same wall sync). Your peakRhythm grids start influencing each other.
Touching: full merge — your combined motion drives one unified sound. Two bodies, one instrument.

**Q2: Who adapts to who?**
Neither "leads." It's energy-weighted blending. Higher energy has more influence on the shared state, but the lower energy person's harmonic identity still colors the result. Like two rivers meeting — the bigger one shapes the course, but the smaller one changes the color. The fundamental law applies: the system follows the humans. Neither human dominates.

**Q3: What defines musical identity?** (answered above)

**Q4: Does it persist?**
It should. Store the fingerprint in localStorage keyed by a hash. When you encounter someone whose fingerprint is >80% similar to a stored one, the system knows: "you've played with this person before." Musical deja vu. The recognition could trigger a subtle harmonic callback — the chord from your last shared moment.

**Q5: Minimum lovable version?**
Two phones. Same WiFi. WebRTC via PeerJS (outfit.js already has the plumbing). One reaction: proximity scales a shared filter. When they're close, both phones' filters open wider than either would alone. That's it. You'll FEEL the other person's presence in your sound before you see them. Build time: one session if the fingerprint packaging is done.

**What I'd build first (when James says go):**
1. `identity.js` — 60 lines. Reads existing state from follow.js + brain.js, packages the fingerprint, updates every 2 seconds.
2. Expose `Follow.identity` as a frozen object.
3. Don't touch outfit.js yet. Just prove the fingerprint exists and is unique per session.

---

## How To Use This

**Claude Code** — paste this at the start of a session:
> "Read SESSION.md in music2.0/ and pick up from where Cowork left off."

**Cowork** — I read this automatically at session start (it's in the project folder).

**James** — just keep both open. When you switch between us, say:
> "Check SESSION.md for context."
