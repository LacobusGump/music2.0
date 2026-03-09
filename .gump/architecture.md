# GUMP: THE EMERGENCE - System Architecture

## Overview

A 50,000+ line musical emergence system where user movement through a zone grid creates evolving music across five eras of human sonic history.

---

## CORE PHILOSOPHY

The grid is not just a controller - it's a **living musical score**.

- User movements create **patterns**
- Patterns trigger **musical events**
- Events accumulate into **unlocks**
- Unlocks evolve the **era**
- Eras transform the **entire sonic palette**

---

## FILE STRUCTURE

```
music2.0/
├── index.html              # Entry point, loads modules
├── css/
│   └── emergence.css       # All styling
├── js/
│   ├── core/
│   │   ├── state.js        # Global state machine
│   │   ├── grid.js         # 9-zone grid system
│   │   ├── patterns.js     # Pattern recognition engine
│   │   ├── unlocks.js      # Unlock system and combos
│   │   └── events.js       # Event bus for system communication
│   │
│   ├── audio/
│   │   ├── engine.js       # Web Audio context and routing
│   │   ├── synthesis.js    # Oscillator factories
│   │   ├── drums.js        # Drum synthesis (808, organic, tribal)
│   │   ├── bass.js         # Bass synthesis (sub, 808, synth)
│   │   ├── harmony.js      # Pad and chord synthesis
│   │   ├── melody.js       # Lead and melodic synthesis
│   │   ├── effects.js      # Reverb, delay, compression, etc.
│   │   ├── samples.js      # Sample loading and playback
│   │   └── mixer.js        # Channel mixing and dynamics
│   │
│   ├── agents/
│   │   ├── base.js         # Agent base class
│   │   ├── conductor.js    # Meta-agent that coordinates others
│   │   ├── drum-mind.js    # Rhythm decisions
│   │   ├── bass-mind.js    # Bass decisions
│   │   ├── harmony-mind.js # Chord decisions
│   │   ├── lead-mind.js    # Melody decisions
│   │   ├── texture-mind.js # Atmosphere decisions
│   │   └── dynamics-mind.js # Volume/intensity decisions
│   │
│   ├── eras/
│   │   ├── base.js         # Era base class
│   │   ├── genesis.js      # Era 1: Creation
│   │   ├── primordial.js   # Era 2: First sounds
│   │   ├── tribal.js       # Era 3: Rhythm emerges
│   │   ├── sacred.js       # Era 4: Harmony discovered
│   │   └── modern.js       # Era 5: 2026 production
│   │
│   ├── visuals/
│   │   ├── renderer.js     # Main canvas renderer
│   │   ├── particles.js    # Particle system
│   │   ├── grid-viz.js     # Grid visualization
│   │   ├── waveform.js     # Audio visualization
│   │   └── effects.js      # Visual effects (glow, trails)
│   │
│   └── main.js             # Application entry point
│
└── assets/
    ├── samples/            # Audio samples (if any)
    └── fonts/              # Custom fonts (if any)
```

---

## THE GRID SYSTEM

### 9-Zone Layout

```
┌─────────┬─────────┬─────────┐
│    NW   │    N    │   NE    │
│ (0,0)   │  (1,0)  │  (2,0)  │
├─────────┼─────────┼─────────┤
│    W    │ CENTER  │    E    │
│ (0,1)   │  (1,1)  │  (2,1)  │
├─────────┼─────────┼─────────┤
│   SW    │    S    │   SE    │
│ (0,2)   │  (1,2)  │  (2,2)  │
└─────────┴─────────┴─────────┘
```

### Zone Properties

Each zone has:
- **Position** (x, y) - grid coordinates
- **Energy** - accumulated from dwell time
- **Heat** - recent activity level
- **Affinity** - what musical elements it attracts
- **State** - inactive, warming, active, cooling

### Zone Musical Mappings

| Zone | Primary Role | Secondary Role |
|------|-------------|----------------|
| CENTER | Root/Tonic | Anchor point |
| N | High frequencies | Brightness |
| S | Low frequencies | Depth |
| E | Attack/Transients | Energy |
| W | Decay/Sustain | Space |
| NE | Harmonics | Shimmer |
| NW | Breath/LFO | Movement |
| SE | Rhythm | Pulse |
| SW | Sub bass | Foundation |

---

## PATTERN RECOGNITION

### Pattern Types

1. **Point Patterns** - Dwell in zones
   - DWELL_SHORT (0.5-1s) - Touch
   - DWELL_MEDIUM (1-3s) - Activate
   - DWELL_LONG (3-5s) - Lock
   - DWELL_DEEP (5s+) - Transcend

2. **Path Patterns** - Movement between zones
   - LINE_HORIZONTAL (W → E or E → W)
   - LINE_VERTICAL (N → S or S → N)
   - LINE_DIAGONAL (corner to corner)
   - CROSS (+ shape through center)
   - X_CROSS (X shape through center)

3. **Shape Patterns** - Complex paths
   - TRIANGLE (3 zones forming triangle)
   - SQUARE (4 corners in sequence)
   - CIRCLE (clockwise or counter)
   - SPIRAL (inward or outward)
   - FIGURE_8 (infinity pattern)

4. **Rhythm Patterns** - Timing of movements
   - PULSE (regular intervals)
   - ACCELERANDO (speeding up)
   - RITARDANDO (slowing down)
   - SYNCOPATION (off-beat emphasis)

5. **Combo Patterns** - Multiple simultaneous patterns
   - Pattern + Pattern = Combo
   - Combos unlock special content

### Pattern Buffer

```javascript
patternBuffer = {
    zones: [],           // Last N zone visits
    times: [],           // Timestamps of visits
    durations: [],       // Dwell times
    velocities: [],      // Movement speeds
    directions: [],      // Movement angles
    maxLength: 100,      // Buffer size
}
```

### Pattern Matching Engine

- Sliding window over buffer
- Multiple pattern detectors running in parallel
- Confidence scores for partial matches
- Combo detection when multiple patterns overlap

---

## ERA SYSTEM

### Era 1: GENESIS (Creation)

**Narrative:** "Let there be light" - the first vibration

**Sounds:**
- Single sine wave emerges from silence
- Frequency slowly descends from inaudible
- First overtones appear
- Silence between sounds is sacred

**Unlocks:**
- THE VOID - silence with potential
- FIRST LIGHT - single pure tone
- FIRST SHADOW - octave below
- BREATH - slow amplitude pulse
- OVERTONES - harmonic series emerges

**Progression to Era 2:**
- Unlock 5+ Genesis elements
- Dwell in CENTER for 10+ seconds total
- Create a CROSS pattern

---

### Era 2: PRIMORDIAL (First Sounds)

**Narrative:** Before language, before rhythm - raw expression

**Sounds:**
- Vocal-like tones (formants)
- Breath and wind
- Water and flow
- First resonances

**Unlocks:**
- BREATH - filtered noise, breathing rhythm
- VOICE - formant-filtered oscillator
- WATER - flowing noise with resonance
- WIND - high filtered noise
- RESONANCE - feedback loop tones

**Progression to Era 3:**
- Unlock 5+ Primordial elements
- Create rhythmic pattern (3+ pulses in tempo)
- Path through S zone 5+ times

---

### Era 3: TRIBAL (Rhythm Emerges)

**Narrative:** The first drums, the first dance

**Sounds:**
- Organic percussion (wood, skin, stone)
- Body percussion
- First polyrhythms
- Deep 808-style bass emerges

**Unlocks:**
- HEARTBEAT - steady pulse
- FOOTSTEPS - alternating low hits
- HANDCLAP - transient snap
- WOOD - resonant knock
- SKIN - deep drum hit
- STONE - high click
- CALL - rhythmic vocal pattern
- RESPONSE - answering pattern
- POLY - cross-rhythms

**Progression to Era 4:**
- Establish steady tempo (10+ bars)
- Unlock CALL and RESPONSE
- Create FIGURE_8 pattern

---

### Era 4: SACRED (Harmony Discovered)

**Narrative:** The discovery of intervals, the birth of music

**Sounds:**
- Pure intervals (5ths, 4ths, 3rds)
- Simple chords
- Drone with melody
- First scales

**Unlocks:**
- FIFTH - perfect 5th interval
- FOURTH - perfect 4th
- THIRD - major 3rd
- DRONE - sustained root
- SCALE - pentatonic emerges
- MELODY - simple melodic phrases
- CHORD - triad harmony
- RESOLUTION - tension/release

**Progression to Era 5:**
- Create chord progression (4+ chord changes)
- Dwell in all 9 zones at least once
- Unlock RESOLUTION

---

### Era 5: MODERN (2026 Production)

**Narrative:** The full palette - everything unlocked

**Sounds:**
- 808 bass (deep, rich, distorted options)
- Modern drums (trap, house, ambient)
- Synth pads
- Leads and arps
- Full effects chain
- AI agents at full power

**Unlocks:**
- 808_DEEP - sub bass that rattles
- 808_DIST - distorted low end
- TRAP_HAT - rapid hi-hats
- TRAP_SNARE - snappy snare
- SYNTH_PAD - lush pads
- SYNTH_LEAD - cutting lead
- ARP - arpeggiated patterns
- SIDECHAIN - pumping effect
- FULL_PRODUCTION - everything available

---

## AI AGENT SYSTEM

### Agent Architecture

Each agent has:
- **Perception** - What it listens to
- **Memory** - What it remembers
- **Personality** - How it makes decisions
- **Expression** - What it controls

### The Conductor

The meta-agent that coordinates:
- Monitors all other agents
- Resolves conflicts
- Maintains musical coherence
- Manages transitions

### DrumMind

```javascript
DrumMind = {
    perception: {
        userEnergy: true,
        userTempo: true,
        currentBeat: true,
        otherAgents: ['BassMind'],
    },
    personality: {
        style: 'adaptive',      // minimal, driving, adaptive
        complexity: 0.5,        // 0-1
        swingAmount: 0.15,      // 0-0.5
        fillProbability: 0.1,   // 0-1
    },
    decisions: [
        'pattern',      // which drum pattern
        'intensity',    // how hard
        'variation',    // how much to vary
        'fill',         // whether to fill
    ],
}
```

### BassMind

```javascript
BassMind = {
    perception: {
        rootNote: true,
        drumPattern: true,
        harmonyState: true,
        userPosition: true,
    },
    personality: {
        style: 'supportive',    // minimal, walking, supportive, driving
        octaveRange: 2,
        rhythmSync: 0.8,        // how locked to drums
        slideProbability: 0.3,
    },
    decisions: [
        'note',         // which note
        'rhythm',       // rhythm pattern
        'articulation', // slide, staccato, sustained
        'intensity',
    ],
}
```

### HarmonyMind

```javascript
HarmonyMind = {
    perception: {
        rootNote: true,
        bassNote: true,
        melodyNote: true,
        userDwell: true,
    },
    personality: {
        style: 'responsive',
        voicingDensity: 0.6,    // how many notes in chord
        tension: 0.3,           // how dissonant
        movementSpeed: 0.5,     // how fast chords change
    },
    decisions: [
        'chord',        // which chord
        'voicing',      // how to voice it
        'rhythm',       // sustained vs rhythmic
        'transition',   // how to move to next
    ],
}
```

### LeadMind

```javascript
LeadMind = {
    perception: {
        harmony: true,
        rhythm: true,
        userMovement: true,
        silenceLength: true,
    },
    personality: {
        style: 'conversational',
        phraseLength: 4,        // bars
        restProbability: 0.4,
        rangeOctaves: 2,
        ornamentProbability: 0.2,
    },
    decisions: [
        'phrase',       // melodic phrase
        'timing',       // when to play
        'dynamics',     // how loud
        'articulation', // how to play notes
    ],
}
```

### TextureMind

```javascript
TextureMind = {
    perception: {
        era: true,
        overallEnergy: true,
        userDwellPattern: true,
        timeInSession: true,
    },
    personality: {
        style: 'atmospheric',
        density: 0.5,
        movement: 0.3,
        brightness: 0.5,
    },
    decisions: [
        'layers',       // which texture layers
        'mix',          // how loud
        'modulation',   // LFO rates etc
        'space',        // reverb/delay
    ],
}
```

### DynamicsMind

```javascript
DynamicsMind = {
    perception: {
        allAgents: true,
        userEnergy: true,
        patternRecognition: true,
        sessionPhase: true,
    },
    personality: {
        style: 'dramatic',
        contrastAmount: 0.6,
        buildDuration: 16,      // bars
        dropProbability: 0.1,
    },
    decisions: [
        'masterVolume',
        'compression',
        'buildState',   // building, dropping, sustaining
        'filter',       // master filter state
    ],
}
```

---

## GRID PATTERN → MUSIC MAPPINGS

### Single Zone Activations

| Zone | Short Dwell | Medium Dwell | Long Dwell |
|------|-------------|--------------|------------|
| CENTER | Root pulse | Root lock | Era check |
| N | Brightness + | High harmony | Shimmer |
| S | Sub + | Bass lock | 808 engage |
| E | Attack + | Transient layer | Rhythm accent |
| W | Space + | Reverb swell | Ambient pad |
| NE | Arp trigger | Arp sustained | Arp evolve |
| NW | LFO engage | Filter sweep | Modulation |
| SE | Hat pattern | Full kit | Drum fill |
| SW | Sub drop | Bass growl | Floor shake |

### Path Patterns

| Pattern | Musical Effect |
|---------|---------------|
| N → S | Frequency sweep down |
| S → N | Frequency sweep up |
| W → E | Filter open |
| E → W | Filter close |
| CENTER → any | Note trigger |
| any → CENTER | Note resolve |
| CROSS (+) | Chord change |
| X_CROSS | Key change |
| SQUARE (corners) | 4-bar phrase |
| TRIANGLE | Triplet feel |
| CIRCLE_CW | Build |
| CIRCLE_CCW | Drop |

### Combo Patterns

| Combo | Effect |
|-------|--------|
| N+S simultaneous | Octave layer |
| E+W simultaneous | Stereo width |
| All corners touched | Full arrangement |
| CENTER hold + paths | Drone mode |
| Rapid zone switching | Glitch/stutter |
| Slow methodical | Ambient mode |

---

## SOUND DESIGN SPECIFICATIONS

### 808 Bass

```javascript
Bass808 = {
    oscillator: {
        type: 'sine',
        frequency: computed,    // from note
    },
    pitchEnvelope: {
        attack: 0.001,
        decay: 0.15,
        amount: 1.5,           // octaves
    },
    amplitudeEnvelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.7,
        release: 0.8,
    },
    distortion: {
        enabled: true,
        amount: computed,      // from era
        type: 'tanh',
    },
    filter: {
        type: 'lowpass',
        frequency: 120,
        resonance: 0.5,
    },
}
```

### Organic Drums

```javascript
OrganicKick = {
    bodyOsc: {
        frequency: 55,
        pitchDecay: 0.15,
        pitchAmount: 100,      // Hz
    },
    clickOsc: {
        frequency: 3500,
        decay: 0.01,
    },
    noiseLayer: {
        filter: 200,
        decay: 0.02,
        amount: 0.1,
    },
    envelope: {
        attack: 0.001,
        decay: 0.4,
    },
}

OrganicSnare = {
    toneOsc: {
        frequency: 200,
        decay: 0.08,
    },
    noiseLayer: {
        filterHigh: 4000,
        filterLow: 200,
        decay: 0.15,
    },
    envelope: {
        attack: 0.001,
        decay: 0.2,
    },
}

OrganicHat = {
    oscillators: [
        { freq: 3987, decay: 0.03 },
        { freq: 4890, decay: 0.025 },
        { freq: 6589, decay: 0.02 },
        { freq: 7893, decay: 0.015 },
    ],
    highpass: 7000,
    envelope: {
        attack: 0.001,
        decay: 0.05,    // closed
        // decay: 0.3,  // open
    },
}
```

### Synth Pad

```javascript
SynthPad = {
    oscillators: [
        { type: 'sawtooth', detune: -7 },
        { type: 'sawtooth', detune: 0 },
        { type: 'sawtooth', detune: 7 },
        { type: 'sawtooth', detune: -12 },
        { type: 'sawtooth', detune: 12 },
    ],
    filter: {
        type: 'lowpass',
        frequency: 2000,
        resonance: 0.3,
        lfoAmount: 500,
        lfoRate: 0.1,
    },
    envelope: {
        attack: 0.5,
        decay: 0.3,
        sustain: 0.7,
        release: 2.0,
    },
    chorus: {
        rate: 0.5,
        depth: 0.3,
        mix: 0.5,
    },
}
```

---

## VISUAL SPECIFICATIONS

### Grid Visualization

Each zone displays:
- Background glow (based on heat)
- Border pulse (based on activity)
- Connection lines to adjacent active zones
- Particle emissions when activated

### Particle System

Particles are emitted when:
- Zones activate
- Patterns complete
- Era transitions occur
- Musical peaks happen

Particle properties:
- Color (based on era and zone)
- Size (based on energy)
- Velocity (based on movement)
- Lifetime (based on dwell)

### Color Palette by Era

| Era | Primary | Secondary | Accent |
|-----|---------|-----------|--------|
| Genesis | White | Black | Gold |
| Primordial | Earth tones | Dark green | Amber |
| Tribal | Orange | Brown | Red |
| Sacred | Purple | Blue | White |
| Modern | Cyan | Magenta | White |

---

## PERFORMANCE CONSIDERATIONS

### Audio

- Use AudioWorklet for custom processing
- Limit simultaneous voices (max 32)
- Reuse oscillators where possible
- Careful garbage collection (avoid allocations in audio thread)

### Visuals

- RequestAnimationFrame for all rendering
- Canvas 2D for simplicity (WebGL if needed)
- Limit particles (max 500)
- Object pooling for particles

### Memory

- Limit pattern buffer size
- Clean up old audio nodes
- Lazy load era-specific sounds

---

## IMPLEMENTATION ORDER

### Phase 1: Core Infrastructure
1. State management
2. Grid system
3. Basic audio engine
4. Pattern buffer (no recognition yet)
5. Basic visuals

### Phase 2: Genesis Era
1. Genesis sounds
2. Genesis unlocks
3. Dwell detection
4. Basic pattern recognition

### Phase 3: Evolution Path
1. Era transitions
2. Primordial sounds
3. Tribal sounds
4. Pattern → music mappings

### Phase 4: AI Agents
1. Agent base class
2. DrumMind
3. BassMind
4. Conductor

### Phase 5: Full System
1. All eras complete
2. All agents complete
3. All patterns recognized
4. Full visual polish

### Phase 6: 2026 Production
1. 808 bass system
2. Modern drums
3. Synth sounds
4. Full effects chain
5. Final mix

---

*"From silence, the first vibration. From pattern, music emerges."*
