# GUMP — Provisional Patent Application
## Body-Enabled Dynamic Music Generation System
### Filed by: James Drum | Date: March 2026

---

> **Filing instructions:** Go to USPTO.gov → Patent Center → File a New Application → Provisional Application for Patent.
> You qualify as a **micro entity** — fee is **$160** (not $320).
> Paste this document as your specification. Add drawings if you have them (optional for provisional).
> You have **12 months** from filing to convert to a full patent.

---

## TITLE OF INVENTION

**System and Method for Real-Time Dynamic Music Generation from Continuous Human Body Motion Using Fluid Dynamics Sensor Mapping, Spiking Neural Network Motion Classification, and Proximity-Based Musical Identity Fingerprinting for Multi-User Interaction**

---

## FIELD OF THE INVENTION

This invention relates to musical instrument systems, and more particularly to methods and systems for generating real-time dynamic music from continuous human body motion sensed by a mobile device, including fluid dynamics-based sensor-to-pitch mapping, spiking neural network motion classification, and a proximity-based musical identity fingerprint for peer-to-peer multi-user musical interaction.

---

## BACKGROUND

Traditional musical instruments require deliberate physical interaction with discrete input mechanisms (keys, strings, drums). Digital audio workstations and music applications similarly require intentional discrete input. No prior art exists for a system in which the continuous natural motion of the human body — walking, tilting, swaying, stillness — is mapped to real-time musical output through a physics-based simulation layer, classified through spiking neural networks, and used to generate a persistent musical identity fingerprint unique to each individual's movement patterns.

Prior art in motion-to-music systems uses threshold-based triggering (shake = sound) rather than continuous fluid physics modeling. No prior art teaches the combination of: (1) water-bottle fluid dynamics for sensor-to-pitch mapping, (2) Leaky Integrate-and-Fire spiking neural networks for real-time motion archetype classification, (3) emergent musical identity fingerprinting from continuous motion data, and (4) proximity-based musical interaction between multiple identity fingerprints.

---

## SUMMARY OF THE INVENTION

The present invention provides a body-enabled musical instrument system comprising:

1. A mobile device with inertial measurement sensors (accelerometer, gyroscope, orientation sensors)
2. A fluid dynamics simulation layer ("water bottle physics") mapping sensor data to pitch and filter parameters
3. A spiking neural network layer classifying motion into musical archetypes in real time
4. A musical intelligence system ("Prodigy") tracking energy arc and adjusting audio parameters
5. An emergent drum system stamping user motion peaks to a 16-step rhythm grid
6. A musical identity fingerprint system derived from the above, unique per user per session
7. A proximity-based peer-to-peer interaction system using fingerprint exchange for multi-user musical interaction

---

## DETAILED DESCRIPTION OF THE PREFERRED EMBODIMENT

### 1. Sensor Input Layer

The system receives continuous data from mobile device sensors:
- **Device orientation** (alpha, beta, gamma axes via DeviceOrientation API)
- **Device motion** (acceleration and rotational rate via DeviceMotion API)
- **Touch input** (screen touch position and pressure as secondary input)

Beta axis (front-to-back tilt) is clamped to [-90, 90] degrees and serves as the primary melodic input. The system normalizes tilt to a [0, 1] range for downstream processing.

### 2. Fluid Dynamics Sensor Mapping (Novel Contribution #1)

**The Water Bottle Physics System** (implemented as `Brain.WaterDynamic`):

Rather than mapping sensor values directly to pitch, the invention uses a physics simulation of fluid in a container. The "water level" in the simulated container is influenced by device tilt, with the following physics parameters:
- **Gravity coefficient** (default: 1.8): Rate at which fluid responds to tilt changes
- **Damping coefficient** (default: 0.93): Momentum decay, creating physical inertia
- **Wall bounce coefficient** (default: 0.35): Elastic response at extremes of range
- **Turbulence detection**: Measures variance in fluid surface for audio effect modulation
- **Stacking detection**: Detects when fluid reaches container walls for percussion triggering

This produces pitch movement that feels physically real — a musician tilting the device experiences the same lag, momentum, and bounce as water moving in a bottle. Two separate fluid simulations run in parallel: one for pitch mapping, one for filter frequency mapping.

**Wall bounce → percussion**: When the pitch fluid simulation detects a "stacking" rising edge (fluid reaching container wall), the system triggers a percussion event (shaker sound) with velocity proportional to turbulence, creating a natural relationship between physical extreme motion and rhythmic accent.

**Turbulence → reverb**: Filter fluid turbulence is added to the reverb depth parameter, creating more spatial audio during rapid fluid movement.

### 3. Spiking Neural Network Motion Classification (Novel Contribution #2)

The system implements 7 **Leaky Integrate-and-Fire (LIF) spiking neurons**, each tuned to a specific motion pattern. Each neuron accumulates charge from motion data and fires when a threshold is exceeded, decaying between inputs:

| Neuron | Motion Pattern | Threshold | Decay |
|--------|---------------|-----------|-------|
| Stillness | No motion | Low | Slow |
| Shake | High-frequency acceleration | Medium | Fast |
| Sweep | Smooth continuous tilt | Medium | Medium |
| Circle | Rotational gyroscope pattern | High | Medium |
| Pendulum | Oscillating back-and-forth | Medium | Slow |
| Rock | Low-frequency sway | Low | Slow |
| Toss | Sharp peak acceleration | High | Fast |

Neuron firing patterns are used to:
- Select musical scale and mode (tonal quality follows motion quality)
- Modulate voice assignments and synthesis parameters
- Contribute to motion archetype classification (see Section 4)
- Contribute to the musical identity fingerprint (see Section 6)

### 4. Musical Intelligence System — Prodigy

The Prodigy system tracks:
- **Energy arc** (rising / falling / plateau / volatile) over a rolling 4-second window
- **Degree heat map**: which scale degrees the user gravitates toward across a session
- **Dynamic range**: difference between minimum and maximum energy levels
- **Rhythm confidence**: consistency of motion timing

Prodigy adjusts in real time:
- Filter bias (cutoff frequency center)
- Reverb depth and decay
- Voice mix and harmonic density
- Scale degree availability

### 5. Emergent Drum System

User motion peaks are stamped onto a 16-step rhythm grid:
- **Kick drum**: mirrors user peak rhythm (when you move hard, kick fires)
- **Shaker**: fills gaps between kick events (complementary rhythm)
- **Snare**: fires on polyrhythmic complements to kick pattern

The drum pattern is not pre-programmed — it emerges from the user's movement pattern in real time and updates as motion patterns change.

### 6. Musical Identity Fingerprint (Novel Contribution #3)

The system derives a persistent musical identity fingerprint from accumulated session data. This fingerprint comprises approximately 40 numerical parameters:

```
fingerprint = {
  tempo: float,              // derived natural BPM from motion peaks
  groove: float[16],         // 16-step accent pattern (normalized peak rhythm)
  archetype: string,         // primary motion archetype classification
  archetypeConfidence: float, // consistency of archetype
  energy: {
    mean: float,             // average energy level
    variance: float,         // energy volatility
    burstRatio: float,       // ratio of burst to sustained energy
  },
  harmonic: {
    center: int,             // preferred scale degree (0-6)
    range: int,              // harmonic exploration width
    heat: float[7],          // 7-degree harmonic heat map
  },
  space: {
    stillnessRatio: float,   // ratio of silent to active time
    phraseLength: float,     // average musical phrase duration
  },
  tilt: {
    center: float,           // natural device hold position (normalized)
    range: float,            // typical tilt range of motion
  },
}
```

This fingerprint is unique to each individual's movement patterns and serves as a "sonic identity" — a musical signature derived from how a person naturally moves their body. The fingerprint may be persisted across sessions via local storage.

### 7. Proximity-Based Multi-User Musical Interaction (Novel Contribution #4)

The system supports exchange of musical identity fingerprints between multiple devices via peer-to-peer communication (WebRTC, Bluetooth mesh, or WiFi Direct). When two devices exchange fingerprints:

- **Distance model**: Proximity is estimated via signal strength (RSSI) or explicit distance input
  - 20ft: Harmonic shadow — recipient hears a subtle harmonic presence below their own pitch
  - 10ft: Filter reaction — each device's filter opens wider in response to the other's presence
  - 5ft: Tempo entrainment — BPM values drift toward each other (coupled oscillator model)
  - Contact: Full merge — combined motion drives unified audio output

- **Identity negotiation**: Energy-weighted blending determines relative influence. Neither identity dominates; higher energy has more influence on shared audio state.

- **Musical memory**: When a stored fingerprint is recognized (cosine similarity > 0.8), a harmonic callback is triggered — a brief musical reference to the harmonic material from the previous shared session.

- **Outfit customization**: Users may modify fingerprint parameters directly, adjusting their sonic identity. Selectable parameters include tonal preference, energy profile, and rhythmic density.

### 8. Lens System (Preset Architecture)

The system supports multiple distinct musical "lenses" — preset configurations defining the complete synthesis, harmonic, and behavioral parameters:

- **Journey**: Organic evolution through 4 stages (Drift → Still Water → Tundra → Dark Matter)
- **Grid**: EDM-style build/drop/breakdown cycles with descending root progression
- **Ascension**: Detuned unison synthesizer wall with evolving chord progression (I→IV→V→I→IV→vi→V→I)

---

## CLAIMS

1. A system for real-time dynamic music generation comprising: a mobile device with inertial measurement sensors; a fluid dynamics simulation layer mapping sensor orientation data to musical pitch and filter parameters; and an audio synthesis engine generating continuous musical output based on said fluid dynamics simulation.

2. The system of claim 1, wherein the fluid dynamics simulation models a fluid in a container, with gravity, damping, and wall-bounce parameters, such that pitch movement exhibits physical inertia, momentum, and elastic wall response.

3. The system of claim 1, further comprising a spiking neural network layer with a plurality of Leaky Integrate-and-Fire neurons, each tuned to a distinct motion pattern, classifying continuous body motion into musical archetypes.

4. The system of claim 3, wherein neuron firing patterns influence musical scale selection, synthesis voice assignment, and musical parameter modulation.

5. A method for generating a musical identity fingerprint from continuous body motion data, comprising: receiving continuous inertial measurement sensor data from a mobile device worn or held by a user; deriving motion-based parameters including natural tempo, groove accent pattern, motion archetype, energy profile, harmonic center, and spatial parameters; and composing said parameters into a fingerprint data structure representing the user's individual movement signature.

6. The method of claim 5, further comprising persisting said fingerprint across sessions and comparing fingerprints between sessions to provide musical recognition of previously encountered fingerprints.

7. A method for proximity-based musical interaction between a plurality of users, each user associated with a mobile device and a musical identity fingerprint as described in claim 5, comprising: exchanging fingerprints between devices via wireless communication; estimating proximity between devices; and modifying the audio output of each device based on said proximity and the fingerprint of the proximate device, such that users perceive each other's sonic presence through changes in their own audio experience.

8. The method of claim 7, wherein proximity modifies audio output according to a distance model in which: at a first distance, a harmonic presence derived from the proximate fingerprint is added below the primary pitch; at a second shorter distance, filter parameters of each device open in response to the other's presence; at a third shorter distance, tempo parameters of each device drift toward the other's natural tempo; and at a fourth shortest distance, combined motion from both devices drives unified audio output.

9. The method of claim 7, further comprising detecting when a proximate fingerprint matches a stored previously-encountered fingerprint, and triggering a harmonic callback derived from musical material from the prior shared session.

10. The system of claim 1, further comprising an emergent drum system that stamps user motion peaks to a 16-step rhythm grid, generating kick, shaker, and snare patterns derived entirely from user motion without pre-programmed rhythmic templates.

---

## BRIEF DESCRIPTION OF DRAWINGS

*(Drawings optional for provisional — include if available)*

- FIG. 1: System architecture block diagram
- FIG. 2: Fluid dynamics simulation — pitch water and filter water in parallel
- FIG. 3: Spiking neural network layer — 7 LIF neurons with motion inputs
- FIG. 4: Musical identity fingerprint data structure
- FIG. 5: Proximity-based multi-user interaction — distance model diagram

---

## ABSTRACT

A body-enabled musical instrument system generates real-time dynamic music from continuous human body motion. Device orientation and motion sensors feed a fluid dynamics simulation ("water bottle physics") that maps physical tilt to pitch and filter parameters with realistic inertia, momentum, and elastic response. A spiking neural network with 7 Leaky Integrate-and-Fire neurons classifies motion patterns into musical archetypes. A musical intelligence system tracks energy arc and adjusts harmonic and spatial audio parameters. An emergent drum system derives rhythm from user motion peaks. The system derives a persistent musical identity fingerprint — a ~40-parameter signature unique to each individual's movement patterns — enabling proximity-based multi-user musical interaction in which users perceive each other's sonic presence through changes in their own audio output, with tempo entrainment, harmonic blending, and musical memory of prior shared sessions.

---

*Inventor: James Drum*
*Date of invention: March 19, 2026*
*Documentation: github.com/LacobusGump/music2.0 (timestamped commit history)*
