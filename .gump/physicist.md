# The Physicist

**Role**: Master of mathematics, physics, and natural systems. Finds the STRUCTURE.

---

## The Physics of Music

### Sound is Vibration
- Frequency ratios define consonance
- Octave = 2:1, Fifth = 3:2, Fourth = 4:3
- These aren't arbitrary - they're physics
- Consonance = waveforms that align periodically

### The Harmonic Series
```
f, 2f, 3f, 4f, 5f, 6f, 7f, 8f...

Relationships:
- 2f/f = octave
- 3f/2f = perfect fifth
- 4f/3f = perfect fourth
- 5f/4f = major third
- 6f/5f = minor third
```

This is why certain intervals "work" - they're encoded in the physics of vibrating systems.

---

## Real-Time Constraints

### The Speed of Sound
- ~343 m/s in air
- Irrelevant for digital audio

### The Speed of Perception
- Audio: ~10-20ms latency noticeable
- Visual: ~40-100ms latency noticeable
- Audio-visual sync: brain tolerates ±80ms
- **Target: <15ms input-to-sound latency**

### The Nyquist Limit
- Sample rate must be 2x highest frequency
- 44.1kHz → max ~20kHz (human hearing limit)
- Higher rates = more CPU, marginal benefit

### Buffer Size Tradeoffs
- Smaller buffer = lower latency, more CPU interrupts
- Larger buffer = higher latency, smoother processing
- Sweet spot: 256-512 samples (~5-10ms at 48kHz)

---

## Mathematical Models for Music

### Dynamical Systems
- Lorenz attractor: chaotic but bounded
- Could map position to parameters of a chaotic system
- Output: unpredictable but coherent patterns

### Phase Space
- Movement creates trajectories in phase space
- Similar trajectories = similar gestures
- Classify gestures by their phase portraits

### Resonance
- Every system has natural frequencies
- Excite at those frequencies = amplification
- Could model the app as a resonant system
- User gestures "excite" musical resonances

### Wave Interference
- Multiple frequencies create beating patterns
- Constructive/destructive interference
- Could use interference patterns for rhythm generation

---

## New Paths to Explore

### Idea 1: Gravity Wells in Pitch Space
```
Define attractor points at consonant intervals:
- Tonic (strongest gravity)
- Fifth (strong)
- Third (moderate)
- Seventh (weak)

Pitch "falls" toward nearest attractor unless energy keeps it moving.
Stillness = pitch settles into harmony.
Movement = pitch escapes gravity, creates tension.
```

### Idea 2: Coupled Oscillators
- Model multiple musical voices as coupled oscillators
- They influence each other's frequency/phase
- Natural synchronization emerges (like fireflies)
- User input perturbs the system
- Music = the system finding equilibrium

### Idea 3: Fourier Transform for Gesture
- Gestures have frequency content too
- A "shake" has high frequency
- A "sway" has low frequency
- Transform gesture into frequency domain
- Map gesture frequencies to audio frequencies

### Idea 4: Information Theory
- Predictable = boring (low information)
- Random = noise (too much information)
- Music lives in between
- Measure "surprise" in the sequence
- Aim for optimal information rate

---

## Questions for the Team

1. **Engineer**: Can we run FFT in real-time on gesture data without blocking audio?
2. **Musician**: Would a physics-based "gravity" model for harmony feel musical or mechanical?
3. **Both**: Should randomness be truly random or deterministic chaos?

---

## Formulas That Might Help

### Pitch from Frequency
```
MIDI_note = 12 * log2(f / 440) + 69
f = 440 * 2^((MIDI_note - 69) / 12)
```

### Consonance Approximation
```
consonance(f1, f2) ≈ 1 / complexity(ratio(f1, f2))
where complexity = sum of numerator + denominator in lowest terms
```

### Exponential Decay (for envelopes)
```
amplitude(t) = A₀ * e^(-t/τ)
τ = time constant (larger = slower decay)
```

### Circular Motion (for LFOs, vibrato)
```
x(t) = A * sin(2πft + φ)
```

---

## Notes

*Physics doesn't care about musical tradition. It cares about ratios, resonance, and energy.*

*But humans evolved hearing these ratios. Our sense of "musical" IS physics, filtered through millions of years of evolution.*

*The opportunity: find the deep structures that physics and human perception share. Build on those.*
