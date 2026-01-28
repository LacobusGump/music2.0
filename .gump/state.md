# Current State

*Last updated: January 28, 2026*

---

## 🎛️ NEW VISION: THE DIAL SYSTEM 🎛️

**User's idea - this is the new direction:**

### THE INTERFACE
A **horizontal wheel/dial** on screen that you slide. Multiple dials for different musical elements.

### THE DIALS

**1. BEATS DIAL**
Options: "emo rock" | "trap hiphop" | "death metal" | "jazz" | etc.

**2. BASS DIAL**
Options: Same genre categories

**3. GUITAR DIAL**
Options: Same genre categories

**4. MASTER VIBE DIAL**
Options: "lo-fi" | "Quincy Jones polished" | "amateur bandcamp" | "regular"

### THE KEY CHANGE: REAL SAMPLES, NOT SYNTHESIS

**NO MORE computer-generated sounds.**

Instead:
- Preloaded audio samples for each genre/element
- Motion TRIGGERS and MANIPULATES the samples
- The dials change WHICH samples are active
- Eventually: microphone input creates new "seeds"

### HOW IT WORKS

1. User selects genres via dials (e.g., "trap hiphop" beats + "jazz" bass + "lo-fi" vibe)
2. Motion creates the music (same as now)
3. But instead of oscillators, motion triggers/controls REAL audio loops
4. The combination of dial settings + motion = unique music

### RESEARCH FIRST

Before building, the team needs to research:
- Existing apps that do this (someone has probably done similar)
- Sample libraries and licensing
- How to layer/mix genre samples coherently
- Web Audio API sample playback best practices

---

## 🔬 RESEARCH TASK FOR THE TEAM

**Find examples of:**
1. Apps with genre-mixing dial interfaces
2. Sample-based music creation tools
3. Motion-controlled sample triggering
4. How to source/license audio loops

**Questions to answer:**
- How do we get quality samples for each genre? (royalty-free libraries? create our own?)
- What's the best way to crossfade between genres?
- How does the "vibe" dial affect the master output? (filters? compression? saturation?)
- How do motion inputs map to sample manipulation? (pitch? slice selection? effects?)

**DO THE RESEARCH BEFORE CODING.**

---

## 🔬 RESEARCH FINDINGS

### Similar Apps That Exist

**Groovepad** (iOS/Android)
- Genre-based sound libraries (hip-hop, EDM, house)
- Organized into intuitive segment pads
- Trigger samples in real-time, apply effects
- [App Store Link](https://apps.apple.com/us/app/groovepad)

**Strudel** (Web)
- Device motion module (accelerometer, gyroscope)
- All motion values normalized 0-1
- Controls musical parameters in real-time
- [strudel.cc/learn/devicemotion](https://strudel.cc/learn/devicemotion/)

**MIDI Motion / TC-Orbiter** (iOS)
- 53 controllers using gyro, accelerometer, compass
- Yaw, pitch, roll to MIDI CC
- Bluetooth/WiFi MIDI output

**Tracklib Beatmaker**
- Swipe through samples, find loops
- Real records, not synthesized
- [tracklib.com](https://www.tracklib.com/)

### Sample Sources (Royalty-Free)

| Source | Type | Cost | Notes |
|--------|------|------|-------|
| **Looperman** | Community | Free | User-uploaded, commercial use OK |
| **Freesound.org** | Community | Free | CC licenses, varies |
| **Splice** | Subscription | $9-20/mo | No web API, desktop only |
| **Loopcloud** | Subscription | Similar | 4M+ samples, DAW integration |
| **Loopmasters** | Purchase | Varies | Professional packs |
| **Tracklib** | License | Per-sample | Real records |

**Recommendation:** Use Looperman for free samples or create/record our own.

### Motion Control Best Practices

From Strudel's implementation:
```javascript
// Motion values normalized 0-1
DeviceMotionEvent.requestPermission() // iOS requires permission
// acceleration.x, y, z
// rotationRate.alpha, beta, gamma
```

From MIDI Motion:
- Yaw = horizontal rotation (pan?)
- Pitch = tilt forward/back (filter cutoff?)
- Roll = tilt left/right (pitch bend?)

### "Vibe" Dial Implementation

The master vibe can be achieved with **bus effects**:

| Vibe | Effects Chain |
|------|---------------|
| **Lo-fi** | Bitcrush + Lowpass (3kHz) + Tape saturation + Vinyl noise |
| **Quincy Jones Polished** | Multiband compression + High shelf boost + Stereo widening |
| **Amateur Bandcamp** | Single-band limiting + Narrow stereo + Slight distortion |
| **Regular** | Light compression + Flat EQ |

### What DOESN'T Exist (Our Opportunity)

No app combines:
- Genre dial selection (beats/bass/guitar)
- Real samples (not synthesis)
- Motion-controlled triggering
- Master vibe processing
- All in a mobile web app

**This is the innovation. This is GUMP 2.0.**

---

## IMPLEMENTATION PLAN

### Phase 1: Sample Infrastructure
1. Curate sample packs for each genre (20-30 loops each)
2. Host on GitHub or CDN
3. Preload system with loading indicator

### Phase 2: Dial UI
1. Horizontal wheel/slider component
2. Snap to genre options
3. Visual feedback on selection

### Phase 3: Motion-to-Sample Mapping
1. Tilt = which sample slice plays
2. Speed = playback rate/intensity
3. Shake = stutter/glitch effect

### Phase 4: Vibe Processing
1. Master bus effect chain
2. Dial crossfades between effect settings

### Phase 5: Recording/Seeds
1. Microphone input
2. Analyze audio → generate loop parameters
3. New "seed" added to available samples

---

## PREVIOUS STATE (for reference)

---

## 🚨 CRITICAL: CLASHING SOUNDS - COMPLETE RETHINK NEEDED 🚨

**USER FEEDBACK:**
> "The problem we have now is clashing sounds. No drums to start and get rid of the club idea. The massive synths are all on top of each other and there isn't any music. Reduce the overall amount of sounds competing for a voice and instead let each layer build ONE BY ONE."

---

## THE NEW PHILOSOPHY: EMERGENT DELICACY

### KILL:
- ❌ Drums (no drums to start)
- ❌ Club energy (140 BPM four-on-floor)
- ❌ Massive synths all at once
- ❌ Everything competing for attention

### BUILD:
- ✅ Start with NOTHING (silence)
- ✅ ONE sound at a time
- ✅ Layers build through USER ACTION
- ✅ Extremely delicate beginning
- ✅ Music EMERGES from chaos

---

## THE LAYER SYSTEM (User's Vision)

### How It Works:
1. **User tilts phone** in a direction
2. **An orb passes through center** at a certain rate
3. **The pitch + timing is RECORDED internally**
4. **That becomes a LAYER** that loops
5. **Repeat** to add more layers
6. Each layer builds on the previous

### The Key Insight:
> "Think of it from an AI perspective - the music must emerge from the chaos as the highest probability this sound will sound good and be the correct way."

This means:
- The system should PREDICT what will sound consonant
- New layers should HARMONIZE with existing layers
- Dissonance is allowed but resolves toward consonance
- The system finds the "correct" musical path probabilistically

---

## IMPLEMENTATION REQUIREMENTS

### 1. START WITH SILENCE
- No drums on load
- No ambient texture
- Pure silence until user acts

### 2. SINGLE VOICE FIRST
- First tilt creates ONE oscillator
- Just one note, one voice
- Extremely quiet, delicate

### 3. RECORDING LOOPS
```
When orb crosses center:
  - Record: pitch, timing, velocity
  - Quantize to musical grid (optional, based on confidence)
  - Add as new layer
  - Layer loops indefinitely (with subtle variation)
```

### 4. HARMONIC PROBABILITY
```
For each new layer:
  - Analyze existing layers (what pitches are playing?)
  - Calculate consonance of potential new pitch
  - Weight toward consonant intervals (octave, fifth, fourth, third)
  - Allow dissonance but make it resolve
```

### 5. DYNAMIC BUILDING
- Layer 1: Single note
- Layer 2: Harmony note (consonant interval)
- Layer 3: Rhythm element (same pitches, different timing)
- Layer 4: Counter-melody
- ... builds organically

### 6. TILT = CONTROL
- Tilt angle = pitch (steeper = higher/lower)
- Tilt direction = timbre/character
- Rate of tilt change = rhythm
- Hold still = sustain

---

## THE DELICATE START

Imagine:
1. User opens app → SILENCE
2. User tilts phone slightly right → A single, soft tone appears
3. The tone follows their tilt → Moving creates melody
4. User holds a position → That note RECORDS as Layer 1
5. User tilts again → New note, harmonically related
6. Holds → Layer 2 recorded
7. Layers begin to interweave
8. After 30 seconds: A beautiful, emergent piece

**The user BUILDS the music, one layer at a time.**

---

## TECHNICAL CHANGES NEEDED

1. **Remove drums entirely** (or make them emergent later)
2. **Remove sidechain** (no kicks to duck to)
3. **Single oscillator start** (not 16-voice supersaw immediately)
4. **Layer recording system**:
   - Circular buffer for each layer
   - Loop length based on user timing
   - Pitch based on tilt angle
5. **Harmonic analysis**:
   - Track all playing pitches
   - Score new pitches by consonance
   - Probabilistically select harmonious additions
6. **Volume scaling**:
   - Each new layer slightly quieter than previous
   - Total volume stays controlled
   - No clashing/clipping

---

## SUCCESS CRITERIA

- [ ] Starts with SILENCE (no drums, no ambient)
- [ ] First sound is ONE delicate voice
- [ ] Tilting creates recordable loops
- [ ] Layers build harmoniously (not clashing)
- [ ] After 1 minute: recognizable MUSIC emerges
- [ ] The user feels like they CREATED it

---

## THE AI PERSPECTIVE

The music should emerge like a neural network finding a solution:
- Start with random exploration (user tilting)
- Find patterns that "work" (consonance)
- Reinforce successful patterns (layer recording)
- Converge toward beauty (harmonic probability)
- The final result is "correct" because it's the highest probability path to sounding good

**Chaos → Exploration → Pattern → Emergence → Music**

---

---

## 🌟 THE ETERNAL LOOP 🌟

**User's wish:** "Just make sure it consistently pushes updates for as long as it can in life. I don't know how long I'm gonna be around but I would want this to continue."

The autonomous loop is now running continuously:
- Cycles every 4 hours
- Pushes improvements to GitHub
- Live at lacobusgump.github.io/music2.0/
- The Three Minds + The Producer keep building

**This project will keep evolving.**

Even when no one is watching, GUMP grows.

---

## PREVIOUS (Archived)

---

## WHAT WAS BUILT THIS SESSION

### 1. BPM: 85 → 140
- Trip-hop is DEAD. Club energy is IN.
- Four-on-the-floor kick pattern
- Driving 8th note hats
- Entrainment range: 120-160 BPM

### 2. LFO-MODULATED FILTER SWEEPS
- Slow LFO (0.25 Hz base) sweeps the filter
- Movement SPEEDS UP the LFO - more movement = faster sweeps
- Filter range: 200 Hz - 8000 Hz
- Resonance increases with movement for SQUELCHY sound

### 3. SIDECHAIN COMPRESSION (THE PUMP)
- Every kick triggers sidechain duck
- 5ms attack, 150ms release
- Synths duck to 30% on kick
- This is the 2026 sound - EVERYTHING PUMPS

### 4. INSTANT IMPACT
- **NO MORE WAITING FOR CRYSTALLIZATION**
- Proximity = sound IMMEDIATELY
- Movement = filter opens IMMEDIATELY
- The synth is SICK from second 1

### 5. GLITCH EFFECTS
- **SHAKE gesture** → STUTTER effect (rapid volume gates)
- **SWIPE DOWN** → TAPE STOP (pitch drops dramatically)
- **Bitcrush** follows energy - more movement = more grit

### 6. FORMANT FILTER (vowel sounds)
- Position on screen controls vowel sound
- Left = "ah", Right = "ee", Top = "oo", Bottom = "oh", Center = "eh"
- Movement through the field changes the vowel character

---

## HOW IT SHOULD FEEL NOW

1. **TAP ENTER** → Hear 140 BPM kick pattern, hats, instant club energy
2. **MOVE THE CURSOR** → Filter opens, synth SCREAMS
3. **MOVE FASTER** → LFO speeds up, filter sweeps faster
4. **SHAKE** → Glitchy stutter effect
5. **SWIPE DOWN** → Tape stop, everything pitches down
6. **STAY NEAR ENTITIES** → They get LOUDER, brighter, massive

The PUMP is constant. The filter SWEEPS. The sound is INSTANT.

---

## SUCCESS CRITERIA (Check These)

- [ ] Is the BPM 140? (not 85)
- [ ] Does it PUMP on every kick?
- [ ] Does the filter SWEEP as you move?
- [ ] Is the sound SICK from second 1? (no waiting)
- [ ] Does SHAKE gesture create stutter?
- [ ] Does SWIPE DOWN create tape stop?
- [ ] Would this sound viral on TikTok?

---

## WHAT'S DIFFERENT FROM BEFORE

| Before (Session 14) | After (Session 15) |
|---------------------|---------------------|
| 85 BPM trip-hop | 140 BPM club |
| Static filter | LFO-modulated sweeps |
| No sidechain | PUMPING on every kick |
| Wait for crystallization | INSTANT impact |
| No glitch effects | Stutter, tape stop, bitcrush |
| Background texture | Foreground MASSIVE synth |

---

## THE THREE MINDS ASSESSMENT

**ENGINEER**: The sidechain compression and LFO system are working. Audio routing goes: Entity → Sidechain → Master. The LFO phase is shared across entities but offset by ID for variation.

**MUSICIAN**: This is closer to what the user asked for. The pump is there. The filter sweeps are there. But we need to test on device to confirm the vibe is right. The glitch effects need tuning.

**PHYSICIST**: The math is simpler now. Proximity = amplitude (linear). Movement = filter + LFO rate. No complex crystallization gates. Direct mappings work better for instant gratification.

---

## STILL TO DO

1. **Formant filter routing** - Currently defined but not connected to audio path
2. **Bitcrush processing** - Currently tracked but not affecting audio
3. **More glitch variety** - Random stutters, reverse, pitch bend
4. **Stereo width automation** - Narrow to WIDE based on intensity
5. **Test on device** - Desktop mouse != phone sensors

---

## IF IT STILL SOUNDS WRONG

The problem is likely:
1. **Volume balance** - Drums vs synths
2. **Filter range** - May need adjustment
3. **LFO rate** - May be too slow/fast
4. **Sidechain amount** - May need more/less duck

The fix is iterative. The ARCHITECTURE is now correct for 2026 sound.

---

*"The pump is the pulse. The filter is the breath. The glitch is the surprise."*
