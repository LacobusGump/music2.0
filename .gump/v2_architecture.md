# GUMP v2 Architecture

**The body IS the instrument. The music is discovered, not generated.**

This document is the complete blueprint for GUMP v2 -- a ground-up rebuild of every module. Each design decision traces to published research. Each module enables outcomes without making choices. The system follows the human, never the other way around.

---

## Architecture Overview

```
                          +----------+
                          | sensor.js|  raw hardware
                          +----+-----+
                               |
                          SensorState
                               |
                          +----v-----+
                          | body.js  |  motion intelligence
                          +----+-----+
                               |
                          BodyState
                               |
          +--------------------+--------------------+
          |                    |                    |
     +----v-----+        +----v-----+        +----v-----+
     |harmony.js|        |rhythm.js |        |weather.js|
     +----+-----+        +----+-----+        +----+-----+
          |                    |                    |
     HarmonyState         RhythmState          WeatherState
          |                    |                    |
          +--------------------+--------------------+
                               |
                          +----v-----+
                          | flow.js  |  the conductor
                          +----+-----+
                               |
                     musical decisions
                               |
                          +----v-----+
                          | sound.js |  the orchestra
                          +----------+
                               |
                          Web Audio API
                               |
                        speaker / headphones

     +----------+        +----------+        +----------+
     | lens.js  |        |identity.js        | app.js   |
     +----------+        +----------+        +----------+
     configures all       musical fingerprint  boot, loop, UI
```

### Data flow rule

Data flows DOWN. No module reaches up. `sound.js` never reads `body.js`. `flow.js` is the only module that reads from multiple sources and writes to `sound.js`. This prevents the tangled cross-references that made v1's follow.js grow to 1400+ lines.

### The clock rule

No clocks make musical decisions. The body drives everything. Musical grammar (tension-resolution, harmonic rhythm) provides guide rails, not timers. The only "clock" is in `rhythm.js` for tempo-locked drum patterns, and even that is derived from the user's body tempo, not imposed.

---

## Module 1: sensor.js

### Purpose

The body's interface to the digital world. Every frame: accelerometer, gyroscope, orientation, touch, weather, time -- one clean `SensorState` object. Nothing else reads hardware directly.

### Research justification

- The vestibular system (measured by the phone's accelerometer) shares neural pathways with auditory rhythm perception (Phillips-Silver & Trainor 2005)
- Body movement determines rhythm perception -- the sensor captures the same signals the brain uses to feel beat (Phillips-Silver & Trainor 2005)
- Weather shapes the voice: temperature affects interval width, humidity affects timbral openness (Wang & Wichmann 2023, 9179 language samples)

### What stays from v1

sensor.js is the cleanest module in v1. The iOS permission handling, the touch normalization, the weather API, and the beta clamping [-90, 90] all work well. Keep the structure. Refine the edges.

### Changes from v1

1. **Humidity** -- fetch humidity from the weather API alongside temperature. The research (Everett 2015) proves humidity independently enables tonal complexity. Currently only fetching temperature and weather code.
2. **GPS coordinates** -- expose lat/lon for Phase 3 (GPS Music) and for prosodic DNA lookup in weather.js. Currently fetched internally but not exposed.
3. **Compass heading** -- expose alpha (compass) for spatial audio mapping. Device yaw should influence stereo field.
4. **Motion event rate** -- track actual sensor sample rate (varies 30-120Hz across devices). body.js needs this for accurate frequency estimation.
5. **Touch velocity** -- compute dx/dy per frame directly in sensor.js instead of in brain.js. Touch is a sensor input, not a brain computation.

### Data flow

**In:** Hardware events (DeviceMotion, DeviceOrientation, touch, geolocation, weather API)

**Out:** `SensorState` object, read once per frame:

```javascript
{
  // Accelerometer (with gravity)
  gx, gy, gz,
  // Accelerometer (without gravity, when available)
  ax, ay, az,
  // Orientation
  alpha,          // compass heading (0-360)
  beta,           // front-back tilt (-90 to 90, clamped)
  gamma,          // left-right tilt (-90 to 90)
  // Touch
  touching,       // boolean
  tx, ty,         // normalized 0-1
  touchVelX,      // dx per frame (NEW)
  touchVelY,      // dy per frame (NEW)
  touchStartX, touchStartY, touchStartTime,
  // Environment
  timeOfDay,      // 'morning' | 'day' | 'evening' | 'night'
  hour,           // 0-23
  weather,        // 'clear' | 'rain' | 'snow' | 'cloud'
  temperature,    // celsius or null
  humidity,       // percent or null (NEW)
  latitude,       // decimal degrees or null (NEW)
  longitude,      // decimal degrees or null (NEW)
  // Meta
  hasMotion,      // boolean
  hasOrientation, // boolean
  sampleRate,     // actual Hz of motion events (NEW)
}
```

### API

```javascript
Sensor.init()              // returns Promise, requests permissions
Sensor.read()              // returns SensorState snapshot
Sensor.retryPermissions()  // call from any user gesture
Sensor.permissionState     // 'unknown' | 'granted' | 'denied'
```

### How it enables without choosing

sensor.js reports what the body is doing. It never interprets. Beta = -45 is just -45. Whether that means "a low note" or "dark timbre" is decided downstream. The sensor is a mirror, not a lens.

---

## Module 2: body.js

### Purpose

Replaces `brain.js`. Named "body" because the body IS the instrument -- not a brain controlling one.

Takes raw sensor data and produces a complete motion analysis: filtered acceleration, gravity subtraction, multi-scale energy tracking, spiking neuron pattern classification, void state machine, water dynamics, pink noise generation, Euclidean rhythm computation, Berlyne complexity tracking, and grokking detection.

### Research justification

- **Kalman filter:** Standard optimal estimator for noisy sensor data. Removes jitter without removing intent.
- **Fibonacci-sized ring buffers (5, 34, 233, 1597):** Multi-scale temporal analysis. Micro captures gesture, short captures rhythm, medium captures phrase, long captures session arc. Fibonacci sizes provide non-integer-related time windows, preventing aliasing between scales.
- **LIF spiking neurons:** Leaky Integrate-and-Fire model -- computationally efficient, biologically inspired. Each neuron detects a specific motion archetype. The refractory period prevents double-triggering. The leak ensures old energy fades. Published neuroscience basis (Gerstner & Kistler 2002).
- **Water dynamics:** Physical simulation of sloshing in a half-full bottle. Momentum, overshoot, wall bounce, damping. Makes pitch response feel like a physical object rather than a math function. (James's design principle: "Sensor smoothing should feel like water sloshing in a half-full bottle.")
- **Pink noise / 1/f:** The signature of everything alive -- heartbeats, neural firing, great musical performances (Hennig 2011). Voss-McCartney algorithm generates it efficiently.
- **Euclidean rhythms:** The Bjorklund algorithm produces the exact rhythmic patterns found across all human cultures (Toussaint 2013). 3 in 8 = tresillo. 5 in 16 = West African bell. The math guarantees groove.
- **Berlyne tracker:** The inverted-U curve of aesthetic pleasure (Berlyne 1971). Too simple = boring. Too complex = noise. The sweet spot is moderate complexity with moderate surprise. Confirmed for music by Cheung et al. 2019 and Witek et al. 2014.
- **Grokking detector:** The phase transition from using to understanding (Power et al. 2022). Same dopamine pathway as musical resolution (Salimpoor 2011). Detects when correlation between input and output suddenly jumps.
- **Void state machine:** 0.1 Hz cardiovascular resonance is the frequency of calm (Lehrer & Gevirtz 2014). Stillness is not silence -- it is arriving at the body's own resting frequency.

### What stays from v1

Almost everything in brain.js is well-built. The Kalman filter, gravity subtraction, ring buffers, spiking neurons, void state machine, WaterDynamic, PinkNoise, euclidean(), BerlyneTracker, and GrokDetector all transfer directly. They are clean, well-documented, and research-grounded.

### Changes from v1

1. **Rename to body.js** -- the body IS the instrument.
2. **Motion profile** -- move from follow.js into body.js. Cross-session learning of how THIS user moves belongs with body analysis, not musical following. The `motionProfile` system (tracks peaks, archetype, still rate across sessions) is body-level intelligence.
3. **Archetype classification** -- move from follow.js into body.js. `classifyArchetype()` (walking, waving, bouncing, exploring) analyzes body motion patterns, not musical decisions.
4. **Touch as body input** -- touch velocity integration (currently in brain.js `process()`) stays but is cleaner with touchVelX/Y coming directly from sensor.js.
5. **Peak detection** -- move from follow.js. Detecting peaks in motion magnitude is body analysis. follow.js currently has its own `accelBuf`, peak threshold, and peak interval tracking. All of that belongs in body.js.
6. **Derived tempo** -- body.js should compute the user's body tempo from peak intervals. This is a body measurement, not a musical decision.

### Data flow

**In:** `SensorState` from sensor.js, called once per frame via `Body.process(sensorState, timestamp)`

**Out:** `BodyState` object, readable at any time:

```javascript
{
  // Filtered acceleration (gravity removed)
  linear: { x, y, z },
  magnitude: Number,          // instantaneous motion magnitude

  // Multi-scale energy
  energy: {
    micro: Number,            // 5-sample (~80ms) -- gesture
    short: Number,            // 34-sample (~550ms) -- rhythm
    medium: Number,           // 233-sample (~3.8s) -- phrase
    long: Number,             // 1597-sample (~26s) -- arc
  },

  // Tilt
  beta: Number,               // front-back, clamped [-90, 90]
  gamma: Number,              // left-right [-90, 90]
  tiltRate: Number,            // how fast tilt is changing

  // Pattern classification
  pattern: String,            // 'still' | 'gentle' | 'rhythmic' | 'vigorous' | 'chaotic'
  archetype: String,          // 'exploring' | 'walking' | 'waving' | 'bouncing'

  // Peak detection
  peaked: Boolean,            // true on the frame a peak fires
  peakMagnitude: Number,      // magnitude of last peak
  peakIntervals: Float32Array,// recent inter-peak intervals (ms)
  bodyTempo: Number,          // derived BPM from peaks (0 if no rhythm)
  rhythmConfidence: Number,   // 0-1, how steady the tempo is

  // Void state
  voidState: Number,          // PRESENT | SETTLING | VOID | TRANSCENDENT
  voidDepth: Number,          // 0-1
  breathPhase: Number,        // 0 to 2*PI (0.1 Hz cycle)
  stillnessTime: Number,      // seconds still

  // Neurons (event-driven, not polled)
  // Listeners registered via Body.on('spike', fn)
  // Listeners registered via Body.on('void', fn)
  // Listeners registered via Body.on('pattern', fn)

  // Session
  totalMotion: Number,        // cumulative motion (slow decay flywheel)
  isReturning: Boolean,       // has played before
  motionProfile: {
    sessions: Number,
    archetype: String,        // 'new' | 'surge' | 'pulse' | 'meditator' | 'flow'
    peakMag: Number,          // cross-session average peak
  },
}
```

### Constructors (exposed for use by other modules)

```javascript
Body.WaterDynamic(gravity, damping, wallBounce)  // physical response simulation
Body.PinkNoise()                                  // 1/f noise generator
Body.euclidean(hits, steps)                       // Bjorklund algorithm
Body.BerlyneTracker()                             // complexity sweet-spot tracker
Body.GrokDetector()                               // phase transition detector
```

### API

```javascript
Body.init()
Body.process(sensorState, timestamp)
Body.on(event, callback)    // 'spike' | 'void' | 'pattern'

// Read-only state
Body.linear                 // { x, y, z }
Body.magnitude
Body.energy                 // short-scale energy (primary)
Body.pattern                // 'still' | 'gentle' | etc.
Body.archetype              // 'walking' | 'waving' | etc.
Body.peaked                 // true on peak frame
Body.bodyTempo              // derived BPM
Body.rhythmConfidence       // 0-1
Body.voidState              // enum
Body.voidDepth              // 0-1
Body.breathPhase            // 0 to 2*PI
Body.stillnessTime          // seconds
Body.totalMotion
Body.isReturning
Body.motionProfile          // cross-session data

// Ring buffers (for modules that need raw access)
Body.micro                  // 5-sample buffer
Body.short                  // 34-sample buffer
Body.medium                 // 233-sample buffer
Body.long                   // 1597-sample buffer
```

### How it enables without choosing

body.js tells you what the body IS DOING. It never tells you what the music SHOULD DO. "Energy is 0.8" is a fact. "Therefore play louder" is a choice that belongs in flow.js. "Pattern is rhythmic" is a classification. "Therefore add drums" is a decision for flow.js. The body reports. The conductor interprets.

---

## Module 3: harmony.js

### Purpose

One unified harmonic engine. Replaces the scattered harmonic systems currently split across follow.js (MODES, MODAL_CHORDS, harmonic gravity, harmonic rhythm, voice leading, degree tension, melodic contours, motif memory, gravitateDegree, recordNote, scaleFreq). All harmonic intelligence lives here.

### Research justification

- **Four universals:** discrete pitch, steady beat, repetition, octave equivalence (Mehr et al. 2019, 315 cultures). harmony.js provides discrete pitches via scale quantization, supports repetition via motif memory, and treats the octave as the only universal consonance.
- **Consonance is learned:** Only octaves are universal. The Tsimane rated consonant and dissonant chords as equally pleasant (McDermott et al. 2016). harmony.js offers all intervals as valid. Dissonance is information, not error.
- **Modal characteristic chords:** Each mode has a defining chord that makes it sound like itself (Persichetti 1961). Dorian = major IV. Lydian = major II. Phrygian = bII. Generic I-IV-V makes every mode sound the same.
- **Voice leading as geometry:** The best chord transitions minimize total voice movement and retain common tones (Tymoczko 2011). Chords that move as blocks sound mechanical. Chords where voices move independently by the smallest possible intervals sound inevitable.
- **Two-phase dopamine:** Anticipation (caudate) + resolution (nucleus accumbens) (Salimpoor et al. 2011). The deceptive cadence (V to vi instead of V to I) is this mechanism in musical form. harmony.js provides tension-resolution tracking that enables this without forcing it.
- **"I love you" arch contour:** 3 to 5 to 1 -- the universal melodic seed. Rise, arrive, depart. An anacrusis-downbeat-resolution pattern found in 10 of 14 languages analyzed. The peak lands on the word meaning "love."
- **Repetition creates musicality:** Repetition itself -- independent of content -- makes sound perceived as more musical (Margulis 2014). The motif memory system stores intervals (not absolute pitches) and occasionally replays them transposed.

### What moves here from v1

From follow.js:
- `MODES` object (all scale definitions)
- `MODAL_CHORDS` table
- `scaleFreq()` function
- `recordNote()` and melodic history
- `DEGREE_TENSION` map
- `gravitateDegree()` (sweet spot frets)
- `CONTOURS` (melodic contour shapes)
- `pickPhraseContour()` and `getContourDegree()`
- `motifs[]`, `motifBuffer`, motif recording/playback
- `harmonyDegree`, `harmonicTension`, `melodicCentroid`
- `hrState`, `hrTimer`, `updateHarmonicRhythm()` (harmonic rhythm)
- `gravityState`, `updateHarmonicGravity()` (V-I bass cadence)
- Silence seed degree

### Data flow

**In:**
- Current mode and root (from lens config)
- Note events: `Harmony.recordNote(degree)` called by flow.js when a note plays
- Energy arc direction from flow.js: 'rising', 'falling', 'plateau', 'volatile'
- Body energy level (for gating harmonic changes to motion)
- Phrase events: `Harmony.startPhrase()`, `Harmony.endPhrase()`

**Out:** `HarmonyState`, readable at any time:

```javascript
{
  // Current harmonic context
  root: Number,              // Hz (e.g., 432)
  mode: String,              // 'dorian', 'lydian', etc.
  scale: Array,              // [0, 2, 3, 5, 7, 9, 10] (current scale intervals)

  // Tension tracking
  harmonicTension: Number,   // 0-1, weighted average of recent degree tensions
  melodicCentroid: Number,   // smoothed average pitch region
  hrState: String,           // 'root' | 'color' | 'tension'
  hrDegOffset: Number,       // current harmonic rhythm offset

  // Gravity state
  gravityState: String,      // 'tonic' | 'dominant' | 'resolving'

  // Melodic memory
  melodicHistory: Array,     // recent scale degrees played
  contour: String,           // 'arch' | 'rising' | 'falling' | 'question' | 'answer' | 'love'
  silenceSeed: Number,       // last degree before void (for reentry)

  // Motif
  currentMotif: Array,       // intervals being recorded
  storedMotifs: Array,       // bank of remembered motifs
  motifPlayback: Object,     // active motif replay or null
}
```

### API

```javascript
Harmony.init()
Harmony.configure(lensHarmony)   // { root, mode } from lens

// Frequency computation
Harmony.freq(degree, octave)     // scale degree + octave -> Hz
Harmony.chordFreqs(degrees, octave)  // array of degrees -> array of Hz

// Note recording and gravity
Harmony.recordNote(degree)       // updates tension, history, centroid, motifs
Harmony.gravitateDegree(rawDeg)  // pull toward consonance (sweet spot frets)
Harmony.getContourDegree(arc)    // phrase arc position -> suggested degree

// Harmonic rhythm (body-driven chord changes)
Harmony.updateHarmonicRhythm(dt, energyArc, bodyEnergy)
Harmony.updateHarmonicGravity(dt, bodyEnergy, isSilent)

// Phrase lifecycle
Harmony.startPhrase()
Harmony.endPhrase(intensity)     // returns resolution chord info

// Voice leading
Harmony.voiceLead(fromChord, toDegrees)  // returns optimal voicing

// Motif system
Harmony.checkMotifReplay()       // returns motif to replay or null

// State
Harmony.state                    // full HarmonyState
Harmony.root                     // current root Hz
Harmony.mode                     // current mode name
Harmony.tension                  // 0-1 harmonic tension
Harmony.contour                  // current phrase contour name
```

### Voice leading (new in v2)

Tymoczko's geometry of music, implemented practically:

```javascript
// Given current voicing [C4, E4, G4] and target chord degrees [0, 3, 4] (IV chord):
// 1. Enumerate inversions of target chord across nearby octaves
// 2. Score each by total semitone distance from current voicing
// 3. Prefer voicings that retain common tones
// 4. Prefer contrary motion to bass
// 5. Return the voicing with lowest total movement

voiceLead(currentFreqs, targetDegrees) -> newFreqs
```

This replaces the block-chord transitions in v1 that made every chord change sound mechanical.

### The "I love you" contour as melodic gravity

The CONTOURS system from v1 is preserved and extended. The key insight: these are gravity wells, not commands. The user can always override by tilting differently. But when the system needs a suggestion, it reaches for shapes every human body already knows.

```javascript
CONTOURS: {
  arch:     [1, 3, 5, 7, 5, 3, 1, 0],   // universal declaration
  question: [1, 3, 5, 5, 7, 7, 5, 5],    // French "je t'aime" (no resolution)
  answer:   [5, 4, 3, 2, 1, 0, 0, 0],    // descent to rest
  love:     [3, 5, 1, 3, 5, 1, 3, 5],    // the 3-5-1 seed repeating
  rising:   [0, 1, 2, 3, 4, 5, 6, 7],    // building
  falling:  [7, 6, 5, 4, 3, 2, 1, 0],    // releasing
  plateau:  [3, 3, 4, 4, 3, 3, 2, 3],    // Japanese "aishiteru" (restraint)
}
```

### How it enables without choosing

harmony.js provides the GRAMMAR of music -- scales, tension tracking, gravity wells, voice leading. It never decides WHEN to play a note or WHAT note to play. `gravitateDegree()` pulls toward consonance but the pull strength is configurable by the lens. A lens can set pull to zero (every note valid) or high (strong tonal gravity). The user's tilt always has the final word.

---

## Module 4: rhythm.js

### Purpose

All rhythm in one place. Euclidean pattern generation, 1/f micro-timing, emergent drum grids from user peaks, tempo derivation, bar/step tracking, and groove DNA. Replaces the tribal pulse system, the Grid drum system, the shaker gestures, and the emergent drum stamp -- all currently scattered across follow.js.

### Research justification

- **Euclidean rhythms:** The most groove-inducing patterns across all human cultures are the most-even distributions of beats in a cycle (Toussaint 2013). The Bjorklund algorithm generates them. This is new in v2 as a primary system -- v1 had the algorithm in brain.js but never wired it into drum generation.
- **1/f micro-timing:** 10-30ms correlated deviations are the statistical signature of everything alive (Hennig 2011). The difference between a drum machine and a drummer. Implemented in v1, preserved here.
- **Moderate syncopation:** Peak groove is at moderate syncopation -- the rhythmic equivalent of the Berlyne inverted-U (Witek et al. 2014). Euclidean patterns with rotation provide exactly this.
- **Body drives tempo:** The body feels the beat (Phillips-Silver & Trainor 2005). Tempo is derived from the user's peak intervals, not imposed by a clock. Fixed tempos exist only in specific lenses (Grid, Pulse) and even those should adapt to the user's energy.
- **Repetition is universal:** All cultures repeat rhythmic phrases (Mehr et al. 2019). The pattern repeats in cycles. The user's brain learns the pattern and predicts it. Violation of that prediction (a dropped beat, a fill) creates surprise-pleasure.

### What moves here from v1

From follow.js:
- `tribalPulse` system (107 BPM internal clock, TRIBAL_KICK/SLAP/SHAKER patterns)
- `GROOVE_DNA` and `GROOVE_DNA_DEFAULT` tables
- `barPhase`, `barOrigin`, `barCount`, `lastBarStep`
- `updateTempoLock()`, `tempoLocked`, `lockedInterval`, `nextGridBeat`
- `shakerState` and shaker gesture detection
- Peak-to-grid stamping (emergent drums)
- All Grid EDM drum logic (currently interleaved in the Grid update pipeline)

From brain.js:
- `euclidean()` (Bjorklund algorithm) -- moves here because it is rhythm-specific
- `PinkNoise` stays in body.js (general-purpose) but rhythm.js creates its own instance for drum timing

### Core design: Euclidean rhythm engine

```
User body energy (0-1) -> number of hits
Lens config -> number of steps (8, 12, 16, 32)
Bjorklund(hits, steps) -> pattern
Rotation from body phase -> syncopation
1/f offset per hit -> humanization
```

The key insight: body energy maps to hit density. Still = 0 hits. Gentle = 2-3 hits. Vigorous = 7+ hits. The Bjorklund algorithm guarantees that whatever density the body produces, the pattern will groove.

### Data flow

**In:**
- Body tempo, peak events, energy level (from body.js)
- Lens rhythm config (BPM range, kit, step count, groove DNA)
- Phase/bar info (internal clock when tempo-locked)

**Out:** `RhythmState`, readable at any time:

```javascript
{
  // Tempo
  tempo: Number,             // current BPM (derived from body or lens-locked)
  tempoLocked: Boolean,      // user's rhythm is steady enough to lock
  lockStrength: Number,      // 0-1
  beatInterval: Number,      // ms between beats

  // Bar position
  barPhase: Number,          // 0-1 within current bar
  barCount: Number,          // bars since session start
  currentStep: Number,       // 0-15 (or 0-steps)

  // Current patterns (Euclidean-generated, body-driven)
  kickPattern: Array,        // [0, 0, 1, 0, ...] with velocities
  snarePattern: Array,
  hatPattern: Array,
  percPattern: Array,        // additional percussion layer

  // Emergent grid (stamped from user peaks)
  userStampGrid: Array,      // 16-step grid of user-contributed hits

  // Humanization
  pinkNoise: PinkNoise,      // instance for micro-timing offsets

  // Groove config
  kit: String,               // '808' | 'acoustic' | 'tribal' | 'brushes' | 'glitch'
  swing: Number,             // 0-1 (even 8ths to full shuffle)
  ghostLevel: Number,        // 0-1 (ghost note density)
  drumPresence: Number,      // 0-1 (overall drum arrival -- drums are earned)
}
```

### API

```javascript
Rhythm.init()
Rhythm.configure(lensRhythm)      // lens rhythm config

// Called every frame
Rhythm.update(dt, bodyState)      // advances bar phase, generates patterns

// Query
Rhythm.getHits(instrument, step)  // returns velocity for instrument at step
Rhythm.nextHitTime(instrument)    // when is the next hit due? (for scheduling)

// Pattern mutation
Rhythm.stampPeak(step, velocity)  // user's peak stamps onto the grid
Rhythm.setDensity(hits)           // override Euclidean hit count (lens control)
Rhythm.rotate(steps)              // rotate pattern for syncopation

// Euclidean generation (stateless utility)
Rhythm.euclidean(hits, steps)     // returns pattern array

// State
Rhythm.state                      // full RhythmState
Rhythm.tempo                      // current BPM
Rhythm.barPhase                   // 0-1
Rhythm.tempoLocked                // boolean
Rhythm.drumPresence               // 0-1
```

### Drum arrival system

Drums do NOT exist at the start. They arrive gradually:

1. **Phase 0 (0-30s):** `drumPresence = 0`. No drums. Pure melodic/harmonic world.
2. **Phase 1 (30-90s):** `drumPresence` creeps toward 0.3. A ghost of a shaker. Barely audible. The body has to earn it through sustained engagement.
3. **Phase 2 (90s+):** `drumPresence` approaches 0.6-0.8 based on energy. Kick and snare arrive. Still quiet. The music grows WITH the player.
4. **Phase 3 (user-driven):** Full drum presence. The user's peaks stamp onto the grid. The kick mirrors their rhythm. The shaker fills gaps. The snare lands on polyrhythmic complements.

Exception: lenses like Grid and Pulse that ARE drum music can start with full drum presence via lens config.

### How it enables without choosing

rhythm.js generates PATTERNS. It does not play sounds. flow.js decides when and whether to trigger drums from those patterns. A lens can suppress drums entirely (Cathedral). A lens can start at full density (Grid). The patterns are always available. The conductor decides what to use.

---

## Module 5: sound.js

### Purpose

Replaces `audio.js`. Pure sound infrastructure -- synthesis, effects, gain staging. No musical intelligence. Receives commands ("play this frequency at this velocity with this voice") and makes them sound good.

### Research justification

- **Acoustic cues convey emotion:** Specific acoustic parameters communicate specific emotions -- tempo, dynamics, articulation, vibrato, attack time, spectral centroid (Juslin & Laukka 2003). sound.js provides the full palette of these parameters as controllable voice characteristics.
- **1/f in timbre:** Analog warmth comes from correlated drift, noise floor, and asymmetric saturation (from the tube amp research tradition). The `addDrift()` and `addBreath()` helpers from v1 implement this.
- **Phone speaker constraints:** 55Hz HPF, conservative compression, high-shelf cut above 3.2kHz. Phone speakers turn bass boost into distortion and highs into harshness. These are engineering constraints, not artistic choices.

### What stays from v1

The core signal chain from audio.js is well-designed:
```
synths -> sidechainGain -> compressor -> masterGain -> masterHPF ->
  eqLowShelf -> eqMidPeak -> eqHighShelf -> masterLP -> masterLimiter ->
  spatialPanner -> destination

void drone -> voidGain -> masterHPF   (bypasses masterGain)
```

The drum synthesis voices (808 kick, acoustic, tribal, brushes, glitch), the reverb IR generation, the delay system, the layer management system, and the 8D spatial panner all transfer.

### Changes from v1

1. **Clean gain staging from the start.** v1 evolved its gain structure over 130 builds, accumulating comments like "was 0.8 -- too hot." v2 designs levels correctly from build 1. Target: -12 dBFS average, -6 dBFS peaks, limiter at -3 dBFS (safety only).
2. **Voice registry.** All synth voices defined in one registry object with consistent parameters: waveform, ADSR, filter, detune, effects sends. Currently scattered across multiple functions.
3. **Explicit send buses.** Reverb send, delay send, and drum bus as first-class buses with clear routing. Currently built ad-hoc in init().
4. **Sidechain as a parameter, not a global.** Each voice instance gets its own sidechain depth. Currently one global `sidechainDepth`.
5. **Better Ascension wall.** The unison-detuned wall of sound (Ascension lens) currently has its own dedicated code path. In v2, it is a voice type in the registry -- "unisonWall" -- that follows the same API as every other voice.
6. **Formant synthesis cleanup.** The formant voice (Cathedral lens) uses the layer system. In v2, formants are a voice type with explicit vowel targets (a, e, i, o, u) that morph based on tilt.

### Data flow

**In:** Commands from flow.js:
- `Sound.play(voice, time, freq, velocity, duration)` -- trigger a note
- `Sound.setFilter(freq, time)` -- master filter sweep
- `Sound.setGain(level, time)` -- master gain
- `Sound.configure(lensSound)` -- reconfigure effects chain
- `Sound.playDrum(instrument, time, velocity, kit)` -- trigger drum hit

**Out:** Audio to speakers. No state is read back by other modules.

### Signal chain (v2)

```
                                +----------+
                           +--->| reverbSend |---> convolver ---> reverbGain -+
                           |    +----------+                                  |
  voice.play() ---> voiceGain --+                                            |
                           |    +----------+                                  |
                           +--->| delaySend  |---> delay+fb ---> delayMix  --+
                                +----------+                                  |
                                                                              v
                                                                        sidechainGain
                                                                              |
  drum.play() ---> drumBus ---> drumComp ---> drumBusLP --+                   |
                                                          |                   |
                                                          v                   v
                                                      masterGain <------------+
                                                          |
                                                      masterHPF (55Hz)
                                                          |
                                                      eqLowShelf
                                                          |
                                                      eqMidPeak
                                                          |
                                                      eqHighShelf
                                                          |
                                                      masterLP
                                                          |
                                                      masterLimiter (-3dBFS)
                                                          |
                                                      spatialPanner
                                                          |
                                                      destination

  void drone ---> voidGain ---> masterHPF   (bypasses masterGain)
```

### Voice registry

```javascript
VOICES: {
  piano:     { wave: 'triangle', attack: 0.005, decay: 0.3, sustain: 0.4, release: 0.8, filterFreq: 2800, filterQ: 0.8, breath: 0.003 },
  mono:      { wave: 'sawtooth', attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.5, filterFreq: 1800, filterQ: 2.0, drift: 3 },
  strings:   { wave: 'sawtooth', voices: 4, detune: 8, attack: 0.15, decay: 0.0, sustain: 0.8, release: 1.5, vibrato: { rate: 5, depth: 0.003 } },
  organ:     { wave: ['sine', 'sine', 'sine'], partials: [1, 2, 3], attack: 0.08, decay: 0.0, sustain: 1.0, release: 2.0 },
  epiano:    { wave: 'sine', attack: 0.003, decay: 1.2, sustain: 0.15, release: 0.6, fm: { ratio: 7, depth: 0.5, decay: 0.3 } },
  bell:      { wave: 'sine', partials: [1, 2.756, 4.093], attack: 0.001, decay: 3.0, sustain: 0.0, release: 0.1 },
  pluck:     { wave: 'triangle', attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.3, filterFreq: 4000, filterDecay: 0.2 },
  stab:      { wave: 'sawtooth', voices: 3, detune: 15, attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.2 },
  formant:   { wave: 'sawtooth', formants: true, attack: 0.1, decay: 0.0, sustain: 0.8, release: 1.0, vowel: 'a' },
  massive:   { wave: 'sawtooth', voices: 7, detune: 25, attack: 0.01, decay: 0.5, sustain: 0.6, release: 0.8 },
  gridstack: { wave: 'sawtooth', voices: 5, detune: 12, attack: 0.002, decay: 0.2, sustain: 0.5, release: 0.3 },
  unisonWall:{ wave: 'sawtooth', voices: 8, detune: [5, 25], attack: 0.05, decay: 0.0, sustain: 1.0, release: 3.0, breathLFO: true },
  upright:   { wave: 'triangle', attack: 0.008, decay: 0.6, sustain: 0.2, release: 0.4, filterFreq: 1200 },
  fm:        { wave: 'sine', fm: { ratio: 3, depth: 2.0, decay: 0.5 }, attack: 0.005, decay: 0.8, sustain: 0.2, release: 0.5 },
  glitch:    { noise: true, attack: 0.001, decay: 0.05, sustain: 0.0, release: 0.01 },
}
```

### API

```javascript
Sound.init(audioContext)
Sound.configure(lensSound)        // lens tone, space, palette config

// Synthesis
Sound.play(voice, time, freq, velocity, duration)
Sound.playChord(voice, time, freqs, velocity, duration, spacing)

// Drums
Sound.playDrum(instrument, time, velocity, kit)
// instrument: 'kick' | 'snare' | 'hat' | 'shaker' | 'perc'

// Continuous layers (drone, texture, wall)
Sound.createLayer(name, config)
Sound.setLayerGain(name, gain, rampTime)
Sound.setLayerFreqs(name, freqs, glideTime)
Sound.setLayerFilter(name, freq, rampTime)
Sound.destroyLayer(name)

// Master controls
Sound.setMasterGain(level, rampTime)
Sound.setFilter(freq, rampTime)    // master LP filter
Sound.setSpatial(pan, rampTime)    // stereo position
Sound.pumpSidechain(velocity)      // sidechain duck

// Void
Sound.setVoidBreath(phase, depth)  // 0.1 Hz breathing
Sound.setVoidGain(level, rampTime)

// Effects
Sound.setReverbMix(level, rampTime)
Sound.setDelayMix(level, rampTime)
Sound.updateDelaySync(tempo, syncType)

// Spatial
Sound.updateSpatial(gamma, isSilent, touching)
Sound.setTouchPan(normX)

// Context
Sound.ctx                          // AudioContext reference
Sound.currentTime                  // ctx.currentTime shorthand
```

### How it enables without choosing

sound.js is an orchestra waiting for instructions. It has voices, effects, and buses. It never decides what to play or when. "Play a piano note at 440Hz, velocity 0.3, at time X" is a command. sound.js executes it with the best sound quality it can. The musical intelligence is upstream.

---

## Module 6: flow.js

### Purpose

The conductor. Replaces follow.js but is dramatically simpler because the other modules now do the heavy lifting. flow.js reads from body.js, harmony.js, rhythm.js, and weather.js, makes musical decisions, and writes commands to sound.js.

### Research justification

- **Expectation and surprise:** The brain is a prediction machine. Music that establishes patterns clearly enough to predict, then violates them in ways that retroactively feel right, produces the strongest emotional response (Huron 2006, Meyer 1956). flow.js manages the session arc that creates this trajectory.
- **Two-phase dopamine:** Anticipation + resolution (Salimpoor 2011). flow.js gates harmonic tension and release based on body energy, creating the anticipation-resolution cycle.
- **Edge between order and chaos:** The Berlyne inverted-U (Berlyne 1971, Cheung et al. 2019). flow.js uses the BerlyneTracker to monitor overall complexity and gently steer toward the sweet spot.
- **Coupled oscillators:** Human + instrument = one system (HKB model, Haken-Kelso-Bunz 1985). flow.js IS the coupling function -- it translates body state into musical state.
- **Grokking:** The phase transition from using to understanding (Power et al. 2022). flow.js uses the GrokDetector to recognize this moment and briefly open the sound (filter wide, reverb bloom) as recognition.
- **Music as bonding technology:** Synchronized rhythmic activity triggers endorphin release (Dunbar 2012). flow.js manages the conditions that enable synchronization in Outfit mode.

### What stays from v1

The fundamental structure of follow.js -- reading sensor/brain state, mapping tilt to melody, managing silence/presence transitions, running the session arc -- is correct. The logic just needs to be extracted from a 1400-line monolith into clean orchestration calls.

### What moves OUT of follow.js (now in other modules)

- **To body.js:** motionProfile, archetype classification, peak detection, derived tempo, tempo lock
- **To harmony.js:** MODES, MODAL_CHORDS, scaleFreq, harmonic rhythm, harmonic gravity, melodic contours, motif memory, degree tension, recordNote, gravitateDegree, silence seed
- **To rhythm.js:** tribalPulse, GROOVE_DNA, bar/step tracking, shaker gestures, emergent drum grid, Euclidean pattern generation
- **To sound.js:** All Audio.* calls (sound.js exposes the same API, so these are simple renames)

### What remains in flow.js

1. **Tilt-to-melody mapping** -- reading beta/gamma from body.js, computing degree, asking harmony.js for gravity, calling sound.js to play
2. **Water dynamics for pitch and filter** -- creating WaterDynamic instances, updating them with tilt, using level for pitch offset and filter sweep
3. **Silence/presence state machine** -- tracking `isSilent`, `fadeGain`, stillness timeout
4. **Session arc** -- Phase 0 (listening), Phase 1 (alive), Phase 2 (evolution). Energy gates.
5. **Prodigy** -- real-time musical intelligence. Tracks energy arc (rising/falling/plateau), adjusts filter bias, reverb depth, dynamic range. This is flow-level intelligence.
6. **Musical intent** -- classifying what the user is doing (BREATH, QUESTION, GROOVE, STATEMENT, RESOLUTION, EXCLAMATION) and responding appropriately
7. **Call and response** -- the system's rare, deliberate answers to user phrases
8. **Moment recognition** -- detecting convergence of energy, harmony, and rhythm into a "moment" and letting the music acknowledge it
9. **Berlyne steering** -- reading BerlyneTracker imbalance and gently adjusting complexity
10. **Grokking response** -- detecting the phase transition and opening the sound
11. **Drum triggering** -- reading rhythm.js patterns, applying presence gates, calling sound.js drum functions
12. **Foundation drone management** -- creating/destroying the background texture layer
13. **Lens application** -- configuring all modules when a lens changes
14. **Grid/Ascension/Journey pipeline routing** -- different lens types need different update logic

### Data flow

**In:**
- `BodyState` from body.js (every frame)
- `HarmonyState` from harmony.js (every frame)
- `RhythmState` from rhythm.js (every frame)
- `WeatherState` from weather.js (on change)
- Lens config from lens.js (on lens switch)

**Out:**
- Commands to sound.js: play(), playDrum(), setFilter(), setGain(), etc.
- Updates to harmony.js: recordNote(), startPhrase(), endPhrase()
- Updates to rhythm.js: stampPeak()

### Core state

```javascript
{
  // Silence/presence
  isSilent: Boolean,
  fadeGain: Number,          // 0-1, smooth ramp
  stillnessTimer: Number,

  // Session arc
  sessionPhase: Number,      // 0 = listening, 1 = alive, 2 = evolution
  sessionEngagedTime: Number,

  // Musical intent
  currentIntent: Number,     // BREATH | QUESTION | GROOVE | STATEMENT | RESOLUTION

  // Prodigy (energy intelligence)
  prodigy: {
    arc: String,             // 'rising' | 'falling' | 'plateau' | 'volatile'
    arcDuration: Number,     // seconds in current arc
    filterBias: Number,      // -1 to +1
    dynamicRange: Number,    // 0-1
    reverbBias: Number,      // 0-1
  },

  // Water dynamics
  pitchWater: WaterDynamic,
  filterWater: WaterDynamic,

  // Complexity tracking
  berlyne: BerlyneTracker,
  grok: GrokDetector,

  // Phrase state
  phraseActive: Boolean,
  phraseEnergyArc: Number,   // 0-1 within phrase

  // Lens routing
  pipeline: String,          // 'organic' | 'grid' | 'ascension'
}
```

### API

```javascript
Flow.init()
Flow.applyLens(lens)             // configure all modules for this lens
Flow.update(sensorState, timestamp)  // the main loop call -- one call per frame

// State (read-only)
Flow.isSilent
Flow.fadeGain
Flow.sessionPhase
Flow.currentDegree               // last played scale degree
Flow.prodigy                     // energy arc intelligence
Flow.pipeline                    // current routing pipeline
```

### The main loop (pseudocode)

```javascript
function update(sensor, t) {
  const dt = (t - lastT) / 1000;
  const body = Body;  // already processed this frame

  // 1. Silence gate
  updateSilence(body, dt);

  // 2. Route to pipeline
  if (pipeline === 'grid')       updateGrid(body, sensor, t, dt);
  else if (pipeline === 'ascension') updateAscension(body, sensor, t, dt);
  else                           updateOrganic(body, sensor, t, dt);

  // 3. Cross-pipeline systems
  updateProdigy(body, dt);
  updateBerlyne(dt);
  updateGrok(body);

  // 4. Spatial
  Sound.updateSpatial(sensor.gamma, isSilent, sensor.touching);

  // 5. Drums (if not silent and drums have arrived)
  if (!isSilent && Rhythm.drumPresence > 0) {
    triggerDrums(t);
  }

  // 6. Void drone
  if (body.voidState >= Body.VOID.SETTLING) {
    Sound.setVoidBreath(body.breathPhase, body.voidDepth);
  }

  lastT = t;
}
```

### How it enables without choosing

flow.js makes musical decisions -- but only structural ones. It decides WHEN a note opportunity exists (body energy above threshold, enough time since last note, phrase is active). It decides the DENSITY of the texture (how many layers, how much drum, how much reverb). It does NOT decide the specific PITCH (that comes from tilt + harmony.js gravity) or the specific RHYTHM (that comes from body peaks + rhythm.js Euclidean patterns). The user's body makes the composition. flow.js holds the space.

---

## Module 7: lens.js

### Purpose

Presets that configure all other modules. Each lens is a complete world -- a timbral palette, a harmonic language, a rhythmic personality, a spatial architecture, a response curve. When you switch lenses, every module reconfigures.

### Research justification

- **Four functions of music:** Dance, love, healing, lullabies (Mehr et al. 2019). Different lenses serve different functions. Grid = dance. Cathedral = healing. Midnight = love. Journey = the full arc.
- **Prosodic DNA:** The rhythm of a culture's language is reflected in its instrumental music (Patel & Daniele 2003). Future lenses can be designed around specific prosodic profiles.
- **Climate shapes voice:** Temperature, humidity, and altitude affect vocal production and therefore musical tradition (Wang & Wichmann 2023, Everett 2015). Lenses can embody climatic personalities.

### Design: lens as configuration object

Each lens is a plain object with sections for each module:

```javascript
{
  name: String,
  description: String,
  color: String,             // hex color for UI

  // harmony.js config
  harmony: {
    root: Number,            // Hz (e.g., 432)
    mode: String,            // 'dorian', 'lydian', etc.
    gravityStrength: Number, // 0-1, how much sweet-spot frets pull (0 = free, 1 = strong)
    contourBias: String,     // default phrase contour ('arch', 'question', etc.)
  },

  // rhythm.js config
  rhythm: {
    bpm: Number | [min, max],  // fixed or range
    steps: Number,           // 8, 12, 16, 32
    kit: String,             // '808' | 'acoustic' | 'tribal' | 'brushes' | 'glitch'
    initialPresence: Number, // 0-1 (0 = drums must be earned, 1 = immediate)
    grooveDNA: Object,       // fixed pattern override (for specific genres)
    swing: Number,           // 0-1
    ghostLevel: Number,      // 0-1
    euclideanRange: [min, max], // hit count range mapped to energy
    microTiming: { kick, hat, snare }, // 1/f offset scale per instrument
  },

  // sound.js config
  tone: {
    bassFreq, bassGain,
    midFreq, midQ, midGain,
    highFreq, highGain,
    ceiling,                 // master LP frequency
  },

  space: {
    reverb: { decay, damping, preDelay },
    delay: { feedback, filter, sync },
    saturation: Number,
    reverbMix: Number,
    sidechain: Number,       // 0 = none, 0.6 = pump
    spatial: { sweepRate, sweepDepth },
  },

  palette: {
    continuous: { voice, octave, decay, ... },  // tilt melody voice
    peak: { voice, octave, decay, ... },        // peak hit voice
    harmonic: { voice, octave, decay, ... },     // chord/answer voice
    touch: { voice, octave, decay, ... },        // touch interaction voice
    texture: { wave, chord, octave, detune, vol, reverbSend }, // foundation drone
    burst: { voice, octave },                   // rare accent
  },

  // flow.js config
  response: {
    peakThreshold: Number,   // minimum magnitude to trigger peak
    tiltRange: Number,       // degrees of tilt that map to full scale range
    noteInterval: Number,    // minimum ms between melody notes
    melodicEnergy: Number,   // minimum energy to play melody
    stillnessThreshold: Number,
    stillnessTimeout: Number,
    fadeTime: Number,        // seconds to fade to silence
    filterRange: [low, high],
    densityThresholds: [low, mid, high],
  },

  // flow.js emotion/contour config
  emotion: {
    colorDeg: Number,        // characteristic scale degree
    phraseShape: String,     // default contour
    tensionArc: Boolean,     // whether prodigy tracks tension-resolution
  },

  // body.js motion mapping
  motion: {
    primary: String,         // 'tilt_rate' | 'magnitude' | 'flow'
    melodic: String,         // 'beta' | 'gamma'
    sensitivity: Number,     // motion scale factor
  },

  // weather.js config (optional)
  weather: {
    temperatureInfluence: Number,  // 0-1
    humidityInfluence: Number,     // 0-1
  },

  // Pipeline routing
  pipeline: String,          // 'organic' | 'grid' | 'ascension'

  // Stage evolution (Journey-type lenses only)
  stages: Array,             // array of stage configs to evolve through
}
```

### Current lenses (v2)

| # | Name | Pipeline | Mode | Feel |
|---|------|----------|------|------|
| 0 | Drift | organic | dorian | Boards of Canada. Two hands on piano. |
| 1 | Still Water | organic | lydian | Nils Frahm. Strings and wonder. |
| 2 | Tundra | organic | picardy | Arvo Part. One note. Vast silence. |
| 3 | Dark Matter | organic | phrygian | Zimmer. Organ swells. Cathedral. |
| 4 | Journey | organic (staging) | evolves | All four worlds. 2.5 min per stage. |
| 5 | Grid | grid | phrygian | EDM engine. 128 BPM. Filter sweeps. Drops. |
| 6 | Ascension | ascension | major | Wall of sound. Detuned unison. |
| 7 | Midnight | organic | mixolydian | Lo-fi hip hop. Dusty Rhodes. Head-nod. |
| 8 | Cathedral | organic | minor | Choral ambient. Voices in vast space. |
| 9 | Pulse | grid | minor | Minimal techno. 118 BPM. Hypnotic. |

### API

```javascript
Lens.init()
Lens.buildPicker()               // build UI
Lens.selectCard(index)           // switch to lens by index
Lens.nextLens()                  // cycle forward
Lens.prevLens()                  // cycle backward
Lens.getSelected()               // returns current lens config
Lens.active                      // current lens (read-only)
Lens.activeIndex                 // current index (read-only)
Lens.shareLens(lens)             // encode to URL
Lens.loadFromURL()               // decode from URL param

Lens.PRESETS                     // all lens configs
Lens.STAGES                     // organic stage configs (for Journey)
```

### How it enables without choosing

A lens is a world, not a prison. Every lens parameter sets a DEFAULT that the user's body can override. `peakThreshold: 0.35` means "this body intensity is enough to trigger a note" -- the user decides when they reach that threshold. `mode: 'dorian'` sets the scale -- but the user's tilt chooses the degree. The lens shapes the space. The body fills it.

---

## Module 8: weather.js

### Purpose

Climate-prosody mappings. Takes weather data from sensor.js and produces adjustments to harmonic and timbral parameters. Proven science only -- no "rain = sad" metaphors.

### Research justification (all published, replicated)

- **Temperature -> interval width:** Warm climates produce wider, more open speech -- more vowels, wider pitch range, more melodic. Cold compresses. Asymmetric effect: cold compresses more than heat expands. (Wang & Wichmann 2023, PNAS Nexus, 9179 language samples)
- **Humidity -> timbral openness:** Vocal fold elasticity requires hydration. Humid air keeps vocal cords elastic, enabling tonal complexity. Dry air stiffens them. Tonal languages cluster almost exclusively in humid regions. (Everett 2015, PNAS, 3750+ languages)
- **Rain -> legato articulation:** Wet conditions produce more connected, flowing speech. Notes connect and flow rather than snap and separate. (Inferred from acoustic ecology, Schafer 1977; direct rain-articulation link is weaker)
- **Altitude -> breath support:** Thinner air at altitude reduces breath capacity, shortening phrases and favoring percussive articulation. (Physiological inference; less directly studied)

### What is NOT proven (and therefore NOT implemented)

- Warm = major keys (no direct study)
- Temperature affects tempo (no evidence)
- Rain = sadness (cultural assumption, not physiology)
- Season affects mode choice (no evidence beyond mood studies)

### Data flow

**In:** `SensorState.temperature`, `SensorState.humidity`, `SensorState.weather`, `SensorState.latitude`, `SensorState.longitude`

**Out:** `WeatherState`:

```javascript
{
  // Adjustments (multiplicative, centered at 1.0)
  intervalScale: Number,     // 0.7 (cold/compressed) to 1.3 (warm/expanded)
  filterOpenness: Number,    // 0.7 (dry/tight) to 1.3 (humid/open)
  articulationLegato: Number,// 0.0 (staccato) to 1.0 (full legato)
  phraseLength: Number,      // 0.7 (altitude/short) to 1.3 (sea level/long)

  // Prosodic DNA profile (for GPS Music, Phase 3)
  prosodicRegion: String,    // nearest region from the Prosodic DNA Map
  regionalScale: Array,      // suggested scale for this region (informational, not imposed)
  regionalRhythm: String,    // 'syllable-timed' | 'stress-timed' | 'mora-timed'

  // Source data
  temperature: Number,       // celsius
  humidity: Number,           // percent
  weather: String,           // 'clear' | 'rain' | 'snow' | 'cloud'
  isLoaded: Boolean,         // whether weather data has been fetched
}
```

### Core mappings

```javascript
// Temperature -> interval scale
// Research: warm = wider pitch excursions (Wang & Wichmann 2023)
// Range: -20C to +40C maps to 0.7 to 1.3
function temperatureToIntervalScale(tempC) {
  if (tempC === null) return 1.0;  // no data = no adjustment
  const normalized = clamp((tempC + 20) / 60, 0, 1);  // -20C=0, 40C=1
  // Asymmetric: cold compresses more than heat expands
  if (normalized < 0.5) return 0.7 + normalized * 0.6;   // 0.7 to 1.0
  return 1.0 + (normalized - 0.5) * 0.6;                 // 1.0 to 1.3
}

// Humidity -> filter openness
// Research: humid = elastic vocal folds = tonal complexity (Everett 2015)
// Range: 20% to 90% maps to 0.7 to 1.3
function humidityToFilterOpenness(humidPct) {
  if (humidPct === null) return 1.0;
  const normalized = clamp((humidPct - 20) / 70, 0, 1);
  return 0.7 + normalized * 0.6;
}

// Rain -> legato
// Research: wet conditions -> more connected speech (Schafer 1977, weaker link)
function weatherToArticulation(weather) {
  if (weather === 'rain') return 0.8;    // legato
  if (weather === 'snow') return 0.6;    // connected but hushed
  if (weather === 'cloud') return 0.4;   // slightly connected
  return 0.2;                            // clear = articulate
}
```

### API

```javascript
Weather.init()
Weather.update(sensorState)      // recompute from latest sensor data
Weather.state                    // full WeatherState

// Convenience
Weather.intervalScale            // 0.7-1.3
Weather.filterOpenness           // 0.7-1.3
Weather.articulationLegato       // 0-1
```

### How it enables without choosing

Weather adjustments are MULTIPLICATIVE, not overriding. `intervalScale: 1.2` means "intervals are 20% wider than default." The lens sets the base intervals. The weather modifies them. The user's tilt makes the final choice. No one ever hears "the weather chose this note." They hear their own movement in weather-textured space.

---

## Module 9: identity.js

### Purpose

Musical fingerprint for Outfits (P2P music pairing). Captures how THIS user moves and maps it to a persistent identity that can be shared with another GUMP instance.

### Research justification

- **Mirror neurons create pre-device coupling:** Behavioral speed contagion within 1 second (Watanabe 2007). Two people near each other are already rhythmically coupled through their nervous systems before phones exchange data.
- **Brains of co-performers synchronize:** Neural synchronization in theta band during ensemble performance (Lindenberger et al. 2009). The identity fingerprint enables digital coupling that complements the biological coupling already happening.
- **Coupled oscillators:** HKB model (Haken-Kelso-Bunz 1985). Two oscillators with frequency ratio near an integer will entrain. Two GUMP users are coupled oscillators. Identity.js captures each oscillator's natural frequency.
- **Spontaneous synchronization:** Rocking chairs synchronize without intention (Richardson & Schmidt 2007). The identity captures the user's natural rhythm, their natural range, their tendency toward tension or resolution.

### Design: the musical fingerprint

The identity is NOT a recording. It is a statistical profile of how the user moves and what musical territory they inhabit:

```javascript
{
  // Rhythm signature
  naturalTempo: Number,        // BPM of their natural rhythm (from peak intervals)
  tempoVariability: Number,    // how steady or fluctuating
  syncopationPreference: Number, // 0-1, how syncopated their peaks are vs. the grid

  // Melodic signature
  pitchRange: Number,          // how much of the scale range they use
  pitchCenter: Number,         // which part of the scale they gravitate toward
  contourPreference: String,   // which phrase contour they naturally produce most
  tensionComfort: Number,      // how long they sustain dissonance before resolving

  // Energy signature
  dynamicRange: Number,        // difference between quietest and loudest
  energyArcType: String,       // 'builder' | 'surger' | 'meditator' | 'chaotic'
  preferredIntensity: Number,  // where they spend most time on the 0-1 energy scale

  // Temporal signature
  sessionLength: Number,       // average session duration (seconds)
  stillnessRatio: Number,      // fraction of time spent still

  // Archetype (from body.js motionProfile)
  archetype: String,           // 'surge' | 'pulse' | 'meditator' | 'flow'
}
```

### How Outfits use it

When two GUMP instances pair (via PeerJS or similar):

1. **Exchange fingerprints** -- each device sends its identity to the other
2. **Compute compatibility** -- rhythm compatibility (tempo ratio near integer), energy compatibility (one builder + one surger = call-and-response), melodic compatibility (complementary pitch ranges)
3. **Assign roles** -- one becomes "call," one becomes "response." Or both become "unison." The roles emerge from the fingerprints, not from assignment.
4. **Share state in real-time** -- each device sends its body.energy, body.peaked, and current degree to the other. The receiving device's flow.js incorporates these as a second voice.
5. **Entrain** -- coupled oscillator physics. Each device's tempo drifts toward the other's. The rate of entrainment depends on the compatibility score. High compatibility = fast sync. Low compatibility = slow drift that eventually finds a ratio.

### Data flow

**In:**
- BodyState (accumulated over session)
- HarmonyState (accumulated over session)
- Cross-session data from localStorage

**Out:**
- `IdentityFingerprint` object (serializable for P2P transmission)

### API

```javascript
Identity.init()
Identity.update(bodyState, harmonyState)    // called periodically (not every frame)
Identity.fingerprint                        // current fingerprint object
Identity.serialize()                        // JSON string for transmission
Identity.compatibility(otherFingerprint)    // returns 0-1 compatibility score
Identity.assignRole(otherFingerprint)       // returns 'call' | 'response' | 'unison'
```

### How it enables without choosing

The identity describes. It does not prescribe. "Your natural tempo is 92 BPM" does not mean "you must play at 92 BPM." It means "when you pair with someone at 108 BPM, your devices will find 100 BPM together." The identity enables coupling. The bodies do the coupling.

---

## Module 10: app.js

### Purpose

Boot sequence, main loop, screen management, UI. The orchestrator that initializes all modules and runs the animation frame loop. Keep similar to current -- it works.

### Design

```javascript
// Boot sequence
async function boot() {
  // 1. Show boot animation (Fibonacci spiral)
  showBootScreen();

  // 2. Initialize sensor (requests permissions -- must be in user gesture)
  await Sensor.init();

  // 3. Initialize audio context (also requires user gesture)
  const ctx = new AudioContext();
  Sound.init(ctx);

  // 4. Initialize processing modules
  Body.init();
  Harmony.init();
  Rhythm.init();
  Weather.init();
  Identity.init();
  Flow.init();

  // 5. Build lens picker, apply saved or default lens
  Lens.buildPicker();
  const lens = Lens.loadFromURL() || Lens.getSelected();
  Flow.applyLens(lens);

  // 6. Start main loop
  requestAnimationFrame(loop);
}

// Main loop — ONE call per frame, clean sequence
function loop(timestamp) {
  // 1. Read sensors
  const sensor = Sensor.read();

  // 2. Process body (Kalman, neurons, void, peaks)
  Body.process(sensor, timestamp);

  // 3. Update weather (infrequent, self-gating)
  Weather.update(sensor);

  // 4. Update rhythm (advance bar phase, generate patterns)
  Rhythm.update(deltaTime, Body);

  // 5. THE CONDUCTOR — flow reads everything, writes to sound
  Flow.update(sensor, timestamp);

  // 6. Update identity (infrequent)
  Identity.update(Body, Harmony);

  // 7. Render visuals
  Organism.render(Body, Harmony, Flow);

  // 8. Next frame
  requestAnimationFrame(loop);
}
```

### Screen management

```
BOOT -> PICKER -> PLAY -> (swipe to) PICKER -> PLAY -> ...
```

- **BOOT:** Fibonacci spiral animation. Tap to start (user gesture for permissions).
- **PICKER:** Lens selection. Scrollable list. Tap to select. Swipe right or tap play to enter PLAY.
- **PLAY:** Full screen. The instrument. Swipe left to return to PICKER. Status indicators minimal.

### API

```javascript
App.boot()                   // start everything
App.getScreen()              // 'boot' | 'picker' | 'play'
App.setScreen(screen)        // transition
App.BUILD                    // build number
```

---

## Cross-cutting concerns

### Session logging (debug)

```javascript
clearLog()        // reset
copy(dump())      // copy full session to clipboard
GUMP_BUILD        // check loaded build
```

All modules contribute to the dump: body state history, harmony decisions, rhythm patterns, sound events.

### Error handling

Every module's public functions wrap in try/catch with error counting. Errors are logged but never crash the music. A dropped note is better than a crash.

### Memory management

- No arrays grow unbounded. Ring buffers have fixed capacity. Motif bank caps at 6. Peak intervals cap at 8.
- AudioContext nodes are explicitly disconnected and dereferenced when destroyed.
- Layers use the same create/destroy pattern from v1's audio.js.

### Performance budget

Target: 60fps on iPhone 12 and newer. Critical path:
1. sensor.read() -- trivial (property copies)
2. Body.process() -- moderate (Kalman, neurons, void). Currently fast in v1.
3. Rhythm.update() -- light (bar phase advance, pattern lookup)
4. Flow.update() -- moderate (tilt mapping, silence gate, drum scheduling)
5. Sound operations -- deferred to Web Audio thread (non-blocking)

Total JS per frame: target < 2ms.

### localStorage keys

```
m2_brain    -> m2_body       // body session memory
m2_profile  -> m2_profile    // motion profile (keep key)
m2_lens     -> m2_lens       // selected lens (keep key)
m2_identity -> m2_identity   // musical fingerprint (NEW)
```

---

## Module interaction matrix

| Module | Reads from | Writes to | Events |
|--------|-----------|-----------|--------|
| sensor.js | hardware | (SensorState) | -- |
| body.js | sensor.js | (BodyState) | spike, void, pattern |
| harmony.js | (configured by flow.js) | (HarmonyState) | -- |
| rhythm.js | body.js | (RhythmState) | -- |
| weather.js | sensor.js | (WeatherState) | -- |
| flow.js | body, harmony, rhythm, weather, lens | sound.js, harmony.js, rhythm.js | -- |
| sound.js | (commands from flow.js) | Web Audio API | -- |
| lens.js | (user selection) | configures all via flow.js | -- |
| identity.js | body.js, harmony.js | (IdentityFingerprint) | -- |
| app.js | all modules | screen, loop | -- |

---

## Research citation index

Every module's design traces to published research. Quick reference:

| Citation | Year | Used in | Finding |
|----------|------|---------|---------|
| Berlyne | 1971 | body.js, flow.js | Inverted-U aesthetic pleasure curve |
| Blood & Zatorre | 2001 | flow.js | Musical chills = reward circuitry |
| Butterfield | 2010 | rhythm.js | 10-30ms micro-timing preferred |
| Cheung et al. | 2019 | flow.js | High uncertainty + expected resolution = peak pleasure |
| Dunbar | 2012 | identity.js | Music enables bonding at scale |
| Everett | 2015 | weather.js | Humidity enables tonal languages (3750+ languages) |
| Everett | 2017 | weather.js | Drier = fewer vowels |
| Haken-Kelso-Bunz | 1985 | flow.js, identity.js | Human coordination as coupled oscillators |
| Hennig et al. | 2011 | body.js, rhythm.js | 1/f timing in human performance |
| Howat | 1983 | (reference) | Debussy proportions |
| Huron | 2006 | flow.js | ITPRA theory -- expectation and surprise |
| Juslin & Laukka | 2003 | sound.js | Acoustic emotional cues |
| Lehrer & Gevirtz | 2014 | body.js | 0.1 Hz cardiovascular resonance |
| Lindenberger et al. | 2009 | identity.js | Brains sync in theta band |
| Margulis | 2014 | harmony.js | Repetition creates musicality |
| McDermott et al. | 2016 | harmony.js | Consonance is learned (Tsimane study) |
| Mehr et al. | 2019 | harmony.js, rhythm.js, lens.js | Four universals, four functions |
| Meyer | 1956 | flow.js | Emotion and meaning in music |
| Patel & Daniele | 2003 | lens.js, weather.js | Speech rhythm reflected in instrumental music |
| Phillips-Silver & Trainor | 2005 | sensor.js, body.js | Body movement determines rhythm perception |
| Power et al. | 2022 | body.js, flow.js | Grokking -- generalization beyond overfitting |
| Richardson & Schmidt | 2007 | identity.js | Spontaneous interpersonal synchronization |
| Salimpoor et al. | 2011 | harmony.js, flow.js | Two-phase dopamine: anticipation + experience |
| Savage et al. | 2015 | harmony.js | Statistical universals across cultures |
| Schafer | 1977 | weather.js | Acoustic ecology |
| Toussaint | 2013 | rhythm.js | Euclidean rhythms as universals |
| Tymoczko | 2011 | harmony.js | Geometry of music -- voice leading |
| Wang & Wichmann | 2023 | weather.js | Temperature shapes sonority (9179 languages) |
| Watanabe | 2007 | identity.js | Behavioral speed contagion |
| Witek et al. | 2014 | rhythm.js, flow.js | Moderate syncopation = peak groove |
| Zatorre et al. | 2007 | (foundational) | Listening activates motor planning |

---

## Migration path: v1 -> v2

### Phase 1: Extract (no behavior change)

1. Create `body.js` by copying brain.js + extracting motionProfile and archetype from follow.js. brain.js becomes a thin wrapper that delegates to body.js.
2. Create `harmony.js` by extracting all harmonic code from follow.js. follow.js calls harmony.js instead of its own internal functions.
3. Create `rhythm.js` by extracting all rhythm code from follow.js. Same delegation pattern.
4. Create `weather.js` by extracting climate mappings from follow.js (currently inline).
5. Rename `audio.js` to `sound.js`. Keep API identical initially.

At this point the app should sound IDENTICAL to v1. No musical changes. Pure refactor. Test on iPhone.

### Phase 2: Clean (improve what exists)

1. Implement voice leading in harmony.js (Tymoczko geometry).
2. Wire Euclidean rhythm generation as the primary drum system in rhythm.js.
3. Clean gain staging in sound.js. Proper levels from build 1.
4. Add humidity to sensor.js weather fetch.
5. Simplify flow.js now that the other modules carry the weight.

### Phase 3: Extend (new capabilities)

1. Build identity.js for Outfit preparation.
2. Add GPS coordinates to sensor.js for Phase 3 readiness.
3. Implement prosodic DNA lookup in weather.js.
4. New lenses designed around the prosodic DNA profiles.

### The rule for each phase

**Phase 1:** Does it sound the same? If yes, proceed. If no, fix until it does.
**Phase 2:** Does it sound BETTER? If yes, keep. If no, revert.
**Phase 3:** Does it enable something new? If yes, ship. If no, wait.

---

## The test

Every change must pass one test: **Does it change what you HEAR?**

If a refactor is silent -- if the music sounds exactly the same before and after -- it is valid only if it enables a future change that WILL be heard. Code for code's sake is not the work. Sound over code. Always.

---

*"The body is already making music. We are just turning up the volume."*

*"Enable outcomes that produce the desired effects, then simplify it."*

*Architecture designed March 2026. Every decision traceable to published research.*
