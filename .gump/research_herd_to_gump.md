# Herd Dynamics to GUMP: Actionable Design Connections

**March 23, 2026**

Research source: `research_herd_dynamics.md`
Architecture source: `v2_architecture.md`
First principles source: `GUMP_FIRST_PRINCIPLES.md`

---

## 1. Nudge Theory as Lens Design

**Finding:** Defaults are the strongest nudge -- organ donation rates swing from 15% to 85% by changing opt-in to opt-out (Thaler & Sunstein 2008). System 1 takes the path of least resistance.

**GUMP implication:** Each lens IS a nudge. It sets defaults (scale, BPM range, peak threshold, voice, filter range, reverb mix, gravity strength) that make specific musical outcomes likely without forbidding any option.

**Modules affected:**
- `lens.js` -- every parameter in the lens config object is a default, not a constraint. `gravityStrength: 0.7` nudges toward consonance. `gravityStrength: 0.1` permits dissonance. Neither forbids anything.
- `harmony.js` -- `gravitateDegree()` pull strength is the nudge force. The user's tilt always has final say. The lens sets how hard the system pulls toward sweet spots.
- `flow.js` -- `response.peakThreshold`, `response.melodicEnergy`, `response.stillnessTimeout` -- these are choice architecture. A low threshold means the system responds to gentle movement (nudging engagement). A high threshold requires commitment (nudging intention).

**Specific design rule:** When designing a new lens, design it as choice architecture. Ask: "What outcome does this default make most likely?" not "What does this default force?"

---

## 2. Aggregate Predictability as Outfit Mode Design

**Finding:** Individual humans are unpredictable. In aggregate, they follow statistical laws -- the same way gas molecules are chaotic individually but produce deterministic temperature, pressure, and volume (Anderson 1972, Pentland 2014).

**GUMP implication:** Outfit mode (two phones pairing) should not force synchronization. It should provide the coupling channel and let coupled oscillator physics do the work. The Kuramoto model predicts that above a critical coupling strength, synchronization emerges spontaneously.

**Modules affected:**
- `identity.js` -- the musical fingerprint captures each user's "natural frequency" (naturalTempo, pitchCenter, energyArcType). Two fingerprints compute compatibility. This IS the natural frequency ratio in the Kuramoto model.
- `identity.js` -- `compatibility()` function. High compatibility (tempo ratio near integer) = fast entrainment. Low compatibility = slow drift toward a ratio. Neither is wrong.
- `flow.js` -- in Outfit mode, the partner's body.energy and peaked events arrive as a second voice. flow.js does NOT average the two signals (that would be forcing). It lets both voices coexist, and the users' bodies drift toward each other through the mirror neuron / behavioral speed contagion pathway (Watanabe 2007).

**Specific design rule:** Surowiecki's four conditions map directly to Outfit design:
1. **Diversity** -- two users with different fingerprints produce a richer signal than two identical users.
2. **Independence** -- each phone runs its own flow.js. No phone controls the other.
3. **Decentralization** -- P2P, not server-mediated. No conductor phone.
4. **Aggregation** -- the shared audio space IS the aggregation mechanism.

Remove any condition and Outfit mode fails the same way crowds fail: imitation cascades, groupthink, or noise.

---

## 3. Information Cascades and the First 30 Seconds

**Finding:** Once an information cascade starts, public information stops accumulating. Early movers determine the path for all followers, even if the collective has better information (Bikhchandani, Hirshleifer, Welch 1992). Cascades are fragile -- a single well-informed arrival can break them.

**GUMP implication:** The first 30 seconds of a GUMP session are the wet pour -- the moment the system's character is established. The user's first movements anchor their expectation of what the instrument does. If the first response is wrong (too much, too little, wrong timbre, wrong latency), the user cascades into "this doesn't work" and nothing afterward can rescue it.

**Modules affected:**
- `flow.js` -- Session Phase 0 (listening, 0-30s). Drums are suppressed (`drumPresence = 0`). The system listens before it speaks. This prevents the cascade of overwhelming the user with complexity before they have a mental model.
- `rhythm.js` -- Drum arrival system. Phase 0 = no drums. Phase 1 (30-90s) = ghost of a shaker. The drums are earned, not given. This ensures the user's first cascade is "my movement makes melody" not "the machine is playing drums at me."
- `harmony.js` -- `silenceSeed` stores the last degree before void. When the user returns from stillness, the first note is harmonically connected to their last note. This prevents the cascade-breaking shock of a random reentry pitch.
- `body.js` -- `motionProfile.isReturning` flag. Returning users have already formed their cascade. Their thresholds can be calibrated to their established expectations.

**Specific design rule:** The wet pour must establish exactly one message: "you are making this." Everything else can arrive later. If the user believes the music is generated FOR them (not BY them), the cascade is wrong and the whole session is lost.

---

## 4. Loss Aversion and the Void Drone

**Finding:** Losing X hurts approximately 2x as much as gaining X feels good (Kahneman & Tversky 1979). This is not a quirk -- it is a population-level law.

**GUMP implication:** When the user stops moving and the music fades, they experience loss. Complete silence amplifies the loss. The void drone (0.1 Hz cardiovascular resonance breathing) fills the silence with the body's own resting frequency, converting perceived loss into perceived arrival. Silence becomes a destination, not a punishment.

**Modules affected:**
- `sound.js` -- The void drone routes to masterHPF, bypassing masterGain. When masterGain fades to 0 (silence), the void persists. This is the critical routing decision that addresses loss aversion: the user never reaches zero.
- `body.js` -- `voidState` machine: PRESENT -> SETTLING -> VOID -> TRANSCENDENT. Each state is a deeper level of stillness. `breathPhase` (0 to 2*PI at 0.1 Hz) modulates the void drone. The descent into stillness is framed as gain (transcendence), not loss (silence).
- `flow.js` -- `fadeGain` ramps down smoothly. The fade time is set by `response.fadeTime` in the lens config. Gradual loss is tolerated better than sudden loss (the certainty effect from prospect theory). A 3-second fade feels like settling. An instant cut feels like death.

**Specific design rule:** Frame silence as arrival, never as absence. The value function is asymmetric -- losing the music hurts more than gaining it felt good. The void drone ensures the user is always gaining something (calm, breath, presence) even when the active music is gone.

---

## 5. Self-Organized Criticality: GUMP as Sandpile

**Finding:** Drop grains of sand one at a time onto a pile. Small avalanches happen often, large avalanches happen rarely, and the size distribution follows a power law. The system tunes itself to the critical state without external adjustment (Bak, Tang, Wiesenfeld 1987). The temporal signature of this state is 1/f noise.

**GUMP implication:** The user's movements are grains of sand. Musical phrases are avalanches. The system should self-organize to criticality -- producing frequent small musical events (a note, a filter shift) and rare large ones (a chord bloom, a grokking moment, a drum arrival) in a power law distribution.

**Modules affected:**
- `body.js` -- Multi-scale energy tracking (micro/short/medium/long ring buffers at Fibonacci sizes 5/34/233/1597). These capture the sandpile at different scales. A gesture is a single grain. A phrase is a local avalanche. A session arc is a large avalanche. The system sees all scales simultaneously.
- `body.js` -- `PinkNoise` generator (Voss-McCartney algorithm). 1/f IS the temporal signature of the critical state. The pink noise generator provides the statistical backbone.
- `rhythm.js` -- 1/f micro-timing offsets on drum hits. Each hit deviates 10-30ms from the grid. The deviations are 1/f-correlated, not random. This makes the rhythm sound alive because it IS at the critical state.
- `flow.js` -- `GrokDetector` catches the phase transition -- the moment the user's input-output correlation suddenly jumps. This is the large avalanche. flow.js responds by opening the filter and blooming the reverb. Rare, unpredictable at the individual level, but statistically inevitable given enough grains.
- `harmony.js` -- Harmonic rhythm (root -> color -> tension) follows the same logic. Most of the time you are at root (small avalanche). Color chords are medium avalanches. Tension chords are rare, large, and the resolution back to root is the avalanche completing.

**Specific design rule:** Never schedule big moments. Let them emerge from accumulated small inputs. The sandpile tunes itself. If you force a climax, you break criticality.

---

## 6. The Berlyne Curve as Aggregate Preference Function

**Finding:** Hedonic value follows an inverted-U: maximum pleasure at moderate complexity (Berlyne 1971). Too simple = boredom. Too complex = distraction. This is not just an individual effect -- the aggregate peak is narrower and stronger than individual peaks, amplified by social sharing dynamics (Chmiel & Schubert 2017). 1/f IS the Berlyne optimum expressed in the frequency domain.

**GUMP implication:** The BerlyneTracker in body.js monitors real-time complexity and feeds flow.js a steering signal. When complexity drops too low, flow.js adds a layer (a chord tone, a drum ghost, a filter shift). When complexity climbs too high, flow.js removes a layer. The system orbits the peak of the inverted-U.

**Modules affected:**
- `body.js` -- `BerlyneTracker` constructor. Tracks current complexity estimate (a composite of harmonic tension, rhythmic density, timbral density, energy variability). Outputs an imbalance score: negative = too simple, positive = too complex.
- `flow.js` -- `updateBerlyne(dt)`. Reads the imbalance and gently steers. "Gently" is critical -- the steering is a nudge, not a correction. Aggressive correction would oscillate around the peak. Gentle steering orbits it.
- `flow.js` -- Prodigy system. `filterBias`, `dynamicRange`, `reverbBias` all serve as Berlyne regulators. Rising energy arc + low complexity = open the filter (add complexity). Falling arc + high complexity = close the filter (reduce complexity).
- `lens.js` -- Each lens defines its own Berlyne sweet spot via `response.densityThresholds` [low, mid, high]. Grid's sweet spot is higher complexity than Tundra's. The curve shape is universal; the peak location is lens-specific.

**Specific design rule:** The Berlyne tracker is the system's taste. It is the aggregate preference function operating in real time on a single user. It works because the inverted-U is a population-level law -- what one person finds optimally complex, most people find optimally complex. The tracker does not personalize (that would require learning individual preferences). It targets the statistical peak.

---

## 7. Mosh Pit Physics: 50 Phones at a Concert

**Finding:** Concert crowds exhibit two collective states: mosh pit (disordered gas-like) and circle pit (ordered vortex). Both emerge from simple flocking rules. Low flocking strength = mosh. High flocking strength = circle pit. Velocity distributions match an ideal gas (Silverberg et al. 2013).

**GUMP implication:** When 50 people use GUMP at a concert, the same phase transition applies. Low coupling (everyone on headphones, no shared audio) = mosh pit dynamics -- 50 independent instruments, each interesting alone, collectively noise. High coupling (shared speakers, Outfit pairing chains, visible movement) = circle pit dynamics -- spontaneous vortex of synchronized musical output.

**Modules affected (future, not yet built):**
- `identity.js` -- scales from dyadic (2 users) to network (N users). The fingerprint exchange protocol must work as a mesh, not just a pair. Each node sends its identity to neighbors, not to all.
- `flow.js` -- needs a coupling strength parameter that scales with proximity. Close = strong coupling = vortex likely. Far = weak coupling = independent instruments.
- `rhythm.js` -- in multi-user mode, each user's body tempo is one oscillator in a Kuramoto network. The model predicts a sharp phase transition: below critical coupling, incoherence. Above it, frequency locking. The tempo that emerges is not anyone's tempo -- it is the network's temperature.
- `sound.js` -- spatial audio becomes critical. 50 instruments in mono is mud. 50 instruments spatialized by physical position is an orchestra.

**Additional findings that apply:**
- Audience physiological synchronization (Merrill et al. 2023) -- heart rates, respiration, and movement synchronize across audiences. 50 GUMP users will synchronize physiologically BEFORE their phones exchange data. The biological coupling is the foundation; the technological coupling amplifies it.
- Hit prediction accuracy increases 10-60% when social variables are added to audio features. In a 50-person GUMP network, the social dynamics (who is near whom, who is moving like whom) will shape the aggregate output more than any individual's input.

**Specific design rule for multi-user:** Design for the phase transition, not for either state. The system should enable both mosh (independent creative chaos) and circle pit (synchronized collective flow) and let the users' coupling strength determine which emerges. Do not force coherence. Do not prevent it.

---

## Summary: The Seven Connections

| # | Behavioral Economics Finding | GUMP Design Decision | Primary Module |
|---|------------------------------|---------------------|----------------|
| 1 | Defaults are the strongest nudge | Lenses ARE choice architecture | lens.js |
| 2 | Aggregate predictability from individual chaos | Outfit mode provides coupling, not control | identity.js |
| 3 | Information cascades are set by early movers | First 30s = wet pour, melody only, no drums | flow.js Phase 0 |
| 4 | Loss aversion: losing hurts 2x gaining | Void drone converts silence from loss to arrival | sound.js void routing |
| 5 | Self-organized criticality = power law events | Movements = grains, phrases = avalanches, never schedule climaxes | body.js multi-scale |
| 6 | Berlyne inverted-U = aggregate preference peak | BerlyneTracker steers complexity toward the statistical sweet spot | body.js + flow.js |
| 7 | Mosh pit physics: gas -> vortex transition | Multi-user mode must enable both states via coupling strength | identity.js (future) |

---

## One Unifying Principle

Every connection above reduces to the same insight from the research: **individual behavior is unpredictable, but the conditions that produce good aggregate outcomes are designable.**

GUMP does not predict what the user will do. It designs the conditions -- the defaults, the coupling channels, the arrival sequence, the loss mitigation, the complexity steering, the self-organizing architecture -- so that whatever the user does, the statistical laws produce music.

This is exactly Surowiecki's framework applied to a single-user instrument: ensure diversity (many possible outputs from the same input), independence (the body leads, the system follows), decentralization (no module controls another), and aggregation (flow.js compiles all signals into one musical output). When all four hold, the crowd of one produces wisdom.
