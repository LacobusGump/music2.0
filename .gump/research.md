# GUMP Research Foundation — March 21, 2026

**"We are not building anything. We are discovering through evidence what God's movements sound like."**

This document captures all research conducted in the March 19-21, 2026 sessions. It is the foundation for every design decision going forward. Cowork, Claude Code, and any future collaborator should read this before writing a line of code.

---

## The Founding Philosophy

"Don't frame your intentions as 'make choices.' Enable outcomes that produce the desired effects then simplify it."

We don't build a system that produces GOOD music. We build a system that produces HONEST music — and trust that honesty IS good. Static isn't the enemy — it's information. Dissonance isn't wrong — it's what makes resolution feel true. The instrument doesn't filter out the ugly. It makes space for ALL of it. The human decides what's beautiful by how they move through it.

"The good work, I think, is solving the paradox of intention against the hubris of self." — James McCandless

---

## Part 1: What Makes Music Universally Good

### The Physics Layer

**The wave equation is the same at every scale.** Guitar strings, electron orbitals, Planck-scale strings in string theory — all governed by ∂²u/∂t² = c²(∂²u/∂x²). Nature uses one equation. The overtone series (f, 2f, 3f, 4f...) emerges from boundary conditions on any bounded vibrating system. Consonance is perceived when frequency ratios are small integers (2:1 octave, 3:2 fifth, 4:3 fourth). These ratios aren't human inventions — they're the minimum-energy states of coupled oscillation. The same math that makes atoms stable makes chords stable.

**Entrainment is universal physics.** Huygens (1665): pendulum clocks on the same wall synchronize. Coupled oscillators find efficient states at integer frequency ratios. This is the physical basis for rhythm, groove, and Outfits (P2P musical pairing).

**Key distinction:** String theory strings vibrate at 10^-35 meters in 9+ dimensions. A guitar string vibrates at 0.63 meters in 3 dimensions. The math connects them. The physics is 35 orders of magnitude apart. We describe the pattern. We don't claim to understand why it repeats.

### The Neuroscience Layer

**Two-phase dopamine (Salimpoor et al. 2011):** Dopamine releases during ANTICIPATION (caudate nucleus) and EXPERIENCE (nucleus accumbens). The deceptive cadence (V→vi instead of V→I, then eventual real resolution) is this mechanism in musical form. GUMP's tension arc already implements this.

**The edge between order and chaos (Berlyne 1971, Cheung et al. 2019):** High uncertainty + expected resolution = peak pleasure. Not too predictable (boring), not too surprising (noise). The sweet spot is moderate complexity with moderate surprise. The inverted-U curve.

**Expectation and surprise (Huron 2006, Meyer 1956):** The brain is a prediction machine. Music that establishes patterns clearly enough to predict, then violates those predictions in ways that retroactively feel right, produces the strongest emotional response.

**Repetition creates musicality (Margulis 2014):** Repetition itself — independent of content — makes sound perceived as more musical. The motif memory system (gravitational, not playback) is the correct implementation.

### The Music Theory Layer

**1/f micro-timing (Hennig 2011, Butterfield 2010):** The difference between a drum machine and a drummer is 10-30ms timing deviations that are CORRELATED (each partly shaped by the previous one — pink noise, not random noise). This is the statistical signature of heartbeats, neural firing, ocean waves, and great musical performances. The ear evolved to recognize 1/f as the signature of something alive. **IMPLEMENTED in BUILD 160.**

**Euclidean rhythms (Toussaint 2013):** The most groove-inducing rhythmic patterns across ALL human cultures are mathematically the most-even distributions of beats within a cycle. The Bjorklund algorithm generates them. 3 in 8 = tresillo. 5 in 16 = West African bell pattern. **Not yet implemented — high priority.**

**Voice leading as geometry (Tymoczko 2011):** The best chord transitions minimize total voice movement and retain common tones. Chords that move as blocks sound mechanical. Chords where voices move independently by the smallest possible intervals sound inevitable. **Partially implemented in Ascension progressions.**

**Moderate syncopation = peak groove (Witek et al. 2014):** Too little syncopation = boring. Too much = confusing. Moderate syncopation is the rhythmic equivalent of the Berlyne inverted-U.

### The Anthropology Layer

**Statistical universals (Savage et al. 2015, Mehr et al. 2019):** Across 315 cultures: discrete pitch (not continuous gliding), isochronous beat (steady pulse), and repetition are universal. These are not Western conventions — they are human constants.

**Music as bonding technology (Dunbar 2012):** Music enables social bonding at scale. Synchronized rhythmic activity triggers endorphin and oxytocin release. The drum circle is not a cultural artifact — it's a biological mechanism.

**Brains of co-performers synchronize (Lindenberger et al. 2009):** Neural synchronization in the theta band during ensemble performance. This is the scientific basis for Outfits.

### The Embodiment Layer

**The body feels the beat (Phillips-Silver & Trainor 2005):** Body movement determines rhythm perception. The vestibular system and the auditory system share neural pathways. GUMP's phone accelerometer captures the same vestibular signals the brain naturally links to sound.

**Listening activates motor planning (Zatorre et al. 2007):** When you hear music, your motor cortex activates as if you were playing. GUMP closes this loop — motor execution produces the heard sound.

**Acoustic cues convey emotion (Juslin & Laukka 2003):** Specific acoustic parameters communicate specific emotions: tempo, dynamics, articulation, vibrato, attack time, spectral centroid. The motion classification system detects these patterns — mapping them to acoustic cues is the link.

---

## Part 2: Quantum/String Theory Connections

### What's REAL (same mathematics)
- The wave equation governs guitar strings, electron orbitals, and theoretical fundamental strings. Same equation. Different scales.
- The quantum harmonic oscillator produces equally-spaced energy levels — the same eigenvalue structure as the musical overtone series.
- Resonance math (Lorentzian curve, energy transfer) is identical in classical acoustics and quantum systems.

### What's HONEST (where it breaks down)
- Hydrogen doesn't sing a major chord. Its emission spectrum (1/n²) produces G#, C#, D#, E, F — not a recognizable chord.
- String theory is unverified experimentally as of 2026.
- Two phones on WiFi is classical correlation, not quantum entanglement.
- The connection is through MATH, not physics. Nature uses the same small set of mathematical structures at every scale. We can describe this. We cannot explain why.

### The design principle
GUMP is not a quantum instrument. It is a tool for human expression built from the same mathematical patterns nature uses to build atoms. The eigenvalue structure that produces discrete notes from continuous tilt IS the same math that produces discrete energy levels. We don't need to understand WHY this pattern repeats. We build honestly on it.

---

## Part 3: The "I Love You" Melody Discovery

### The finding
Across 14 languages, the melodic contour of "I love you" converges on an ARCH shape: rise → peak → fall. The peak almost always lands on the word meaning "love."

10 of 14 languages use this arch. The dominant pitches map to E, G, C — a major triad.

### The universal seed
Three notes: **approach → ARRIVE → depart.** Scale degrees 3→5→1. An anacrusis-downbeat-resolution pattern. The most fundamental pattern in Western music — and apparently in human emotional declaration.

### The outliers
- **French "Je t'aime"** — pure rise, no fall. A half-cadence. Asks for a response.
- **Japanese "Aishiteru"** — nearly flat. A drone. The meaning is in restraint, not melody.
- **Mandarin "Wǒ ài nǐ"** — each syllable IS its own melody. Three micro-songs.

### The hypothesis (untested)
Regional music may be shaped by the prosodic contour of "I love you" in the local language. If validated, GPS Music (Phase 3) could root each region's palette in the melodic shape of love spoken there. Walk through Tokyo = "aishiteru" contour. Walk through Moscow = "ya tebya lyublyu."

### Key data
| Language | Degrees | Shape |
|----------|---------|-------|
| English | 3-5-1 | Arch ↗↘ |
| Russian | 3-2-3-5-3 | Ramp ↗↘ |
| French | 1-5 | Rise ↗ |
| Spanish | 2-5-3 | Arch ↗↘ |
| Arabic | 1-5-3-1 | Full Arch ↗↘ |
| Japanese | 1-3-3-3-1 | Plateau ─ |
| Korean | 3-5-3 | Arch ↗↘ |
| German | 3-5-3-1 | Arch ↗↘ |
| Italian | 2-5-3 | Arch ↗↘ |
| Hawaiian | 3-5-3-1-1-3-2 | Wave ↗↘↗↘ |

---

## Part 4: Climate-Prosody Connection

### Proven (published, replicated)
- **Warm climates produce more sonorous/open speech** — wider vowels, wider pitch ranges (Wang & Wichmann 2023 PNAS Nexus, 9179 language samples)
- **Humidity enables tonal complexity** — vocal fold elasticity requires hydration (Everett 2015 PNAS, 3750+ languages)
- **Cold compresses more than heat expands** — asymmetric effect (Wang & Wichmann 2023)
- **Dry climates reduce vowel ratio** (Everett 2017 Frontiers)

### Applied to GUMP weather.js (BUILD 160)
- Temperature → interval width (warm = wider pitch excursions)
- Humidity → timbral openness (humid = open filter)
- Rain → legato articulation (notes connect and flow)
- Not "rain = sad." Rain = how a body makes sound through wet air.

### Not proven
- Warm = major keys (no direct study)
- Temperature affects tempo (no evidence)

---

## Part 5: The Seven Connections

Seven cross-domain connections discovered March 21, 2026:

### 1. The Body's Own Chord
Heart:breath:gait lock into integer ratios (4:1, 2:1, 3:1). Same math as consonance. NOT overtone series (separate oscillators, not partials). But integer-ratio coupling is real coupled-oscillator physics.

### 2. Motion Is Music We Can't Hear
Walking = 2 Hz. Swaying = 0.5 Hz. Below hearing (20 Hz min). GUMP transposes sub-audible body frequencies to audible range. A frequency microscope.

### 3. Emotion IS Frequency (partially)
0.1 Hz cardiovascular resonance → calm is SOLID (Lehrer & Gevirtz 2014, clinical). Music tempo → arousal is robust. Discrete emotion frequencies NOT proven. **0.1 Hz void breathing IMPLEMENTED in BUILD 160.**

### 4. Golden Ratio in Hearing
MOSTLY FALSE. Cochlea is NOT a golden spiral (Manoussaki 2006). Phrase climax in 55-70% zone is real but phi isn't special. Debussy proportions genuinely striking (Howat 1983). Logarithmic perception and small-integer ratios are the REAL math of hearing.

### 5. Silence as Carrier Wave
METAPHOR. Beautiful design principle. Void drone is artistically correct. Not physics.

### 6. Nobody Leads the Dance
REAL. HKB model (Haken-Kelso-Bunz 1985): human-instrument systems ARE coupled oscillators. Phase locking, bifurcation, mode entrainment. Same math as physical oscillators. Published, measured, replicated.

### 7. Mirror Neuron Pre-Connection
REAL. Behavioral speed contagion within 1 second (Watanabe 2007). Rocking chair spontaneous sync (Richardson & Schmidt 2007). Visual coupling drives it. Two GUMP users near each other are musically coupled through their nervous systems BEFORE phones exchange data.

---

## Part 6: The Six Chains — How It All Connects

1. **Consonance = minimum-energy state** of coupled oscillation. Same math stabilizes atoms and chords.
2. **Love sounds like a breath** — declaration, breathing, phrases, dopamine all follow the arch. Same process, different scales.
3. **Proximity IS music** — mirror neurons + speed contagion + entrainment = bodies near each other are already coupled. Phones reveal, not create.
4. **Stillness = fundamental frequency** — 0.1 Hz cardiovascular resonance. Stopping isn't leaving the music — it's arriving at the body's own resonance.
5. **Weather changes what the body can say** — physics of how voice responds to air. Proven across 9000+ languages.
6. **Life IS 1/f noise** — heartbeats, neural firing, great performances. The edge between order and chaos. The ear recognizes it as alive.

**The thread:** Bounded oscillation seeking its most efficient state. The same pattern at every scale. GUMP focuses the shadow into a range the ear can hear.

---

## Part 7: What's Implemented vs What's Next

### Implemented (BUILD 160)
- 1/f micro-timing on all drums (pink noise correlated offsets)
- 0.1 Hz void drone breathing (cardiovascular resonance)
- Weather → interval width + articulation (climate-prosody science)
- Sweet spot frets (gravitational wells at scale degrees)
- Motif memory as gravity (not playback)
- Silence memory (seed from last note before void)
- Moment recognition (Prodigy detects convergence)
- Modal harmony (mode-specific characteristic chords)
- Prodigy wired into velocity, timing, note selection
- Water bottle dynamics for pitch and filter
- Ascension phase machine (DJ intelligence)

### Next priorities
- Euclidean rhythm generator (Bjorklund algorithm)
- Voice leading optimization (Tymoczko geometry)
- "I love you" contour as melodic seed system
- Identity fingerprint → Outfit pairing
- Timbral tension tracking (spectral brightness follows energy arc)
- Performance noise (attack artifacts, string slides)

---

## Key Sources

| Domain | Researcher(s) | Year | Finding |
|--------|--------------|------|---------|
| Consonance | Plomp & Levelt | 1965 | Critical bandwidth basis |
| Reward | Blood & Zatorre | 2001 | Musical chills = reward circuitry |
| Dopamine | Salimpoor et al. | 2011 | Two-phase: anticipation + experience |
| Surprise | Cheung et al. | 2019 | High uncertainty + expected resolution = peak pleasure |
| Expectation | Huron | 2006 | ITPRA theory (Sweet Anticipation) |
| Emotion | Meyer | 1956 | Emotion and Meaning in Music |
| Repetition | Margulis | 2014 | Repetition creates musicality |
| Timing | Hennig et al. | 2011 | 1/f timing in human performance |
| Timing | Butterfield | 2010 | 10-30ms micro-timing preferred |
| Rhythm | Toussaint | 2013 | Euclidean rhythms as universals |
| Groove | Witek et al. | 2014 | Moderate syncopation = peak groove |
| Voice leading | Tymoczko | 2011 | Geometry of music |
| Universals | Savage et al. | 2015 | Statistical universals across cultures |
| Universals | Mehr et al. | 2019 | 315 cultures |
| Bonding | Dunbar | 2012 | Music enables bonding at scale |
| Neural sync | Lindenberger et al. | 2009 | Brains sync in theta band |
| Embodiment | Phillips-Silver & Trainor | 2005 | Body movement determines rhythm perception |
| Motor | Zatorre et al. | 2007 | Listening activates motor planning |
| Expression | Juslin & Laukka | 2003 | Acoustic emotional cues |
| Climate | Wang & Wichmann | 2023 | Temperature shapes sonority (9179 languages) |
| Climate | Everett | 2015 | Humidity enables tonal languages (PNAS) |
| Climate | Everett | 2017 | Drier = fewer vowels |
| Ecology | Schafer | 1977 | Acoustic ecology |
| HRV | Lehrer & Gevirtz | 2014 | 0.1 Hz cardiovascular resonance |
| Fear | Karalis et al. | 2016 | 4 Hz prefrontal-amygdala oscillations |
| Coupled | Haken-Kelso-Bunz | 1985 | Human coordination as coupled oscillators |
| Mirror | Watanabe | 2007 | Behavioral speed contagion |
| Sync | Richardson & Schmidt | 2007 | Spontaneous interpersonal synchronization |
| Cochlea | Manoussaki et al. | 2006 | Cochlear shape and low-frequency hearing |
| Golden ratio | Howat | 1983 | Debussy in Proportion |
| Oscillators | Doelling & Poeppel | 2015 | Cortical entrainment to music |

---

*"Tracking the shadow of God's movements through the body, and letting the sound be what it is."*
