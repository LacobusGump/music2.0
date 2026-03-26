/**
 * PRIME ENGINE — Phase Coherence Music Synthesis
 * ================================================
 * Everything is oscillators on S¹.
 * Coupling K is controlled by the body.
 * Music IS the departure from GUE.
 * Silence IS equilibrium.
 *
 * This replaces traditional synthesis with coupled oscillator physics.
 * The body moves → K changes → phases lock → you hear music.
 * No filters. No mixing. Just phase coherence.
 *
 * Based on: Kuramoto model, GUE statistics, prime number theory.
 * Built: March 26, 2026. One night. 669 primes.
 */

const PrimeEngine = (() => {

    // ─── THE CIRCLE ──────────────────────────────────────────
    // S¹ = the unit circle. Everything lives here.

    const TAU = 2 * Math.PI;
    const S1 = {
        wrap: (phase) => ((phase % TAU) + TAU) % TAU,
        distance: (a, b) => {
            const d = Math.abs(a - b) % TAU;
            return d > Math.PI ? TAU - d : d;
        },
        mean: (phases) => {
            const re = phases.reduce((s, p) => s + Math.cos(p), 0) / phases.length;
            const im = phases.reduce((s, p) => s + Math.sin(p), 0) / phases.length;
            return Math.atan2(im, re);
        }
    };

    // ─── ORDER PARAMETER ─────────────────────────────────────
    // r = |1/N Σ e^{iθ_k}| = Kuramoto coherence
    // r = 0: GUE equilibrium (silence)
    // r = 1: perfect lock (maximum departure)

    function orderParameter(phases) {
        const N = phases.length;
        if (N === 0) return 0;
        const re = phases.reduce((s, p) => s + Math.cos(p), 0) / N;
        const im = phases.reduce((s, p) => s + Math.sin(p), 0) / N;
        return Math.sqrt(re * re + im * im);
    }

    // ─── Φ_PRIME ─────────────────────────────────────────────
    // Departure from GUE equilibrium.
    // This IS the music. This IS the feeling.

    function phiPrime(phases) {
        const r = orderParameter(phases);
        // GUE has r ≈ 1/√N for N oscillators
        const N = phases.length;
        const r_gue = 1 / Math.sqrt(Math.max(N, 1));
        // Φ' = how far above GUE baseline
        return Math.max(0, (r - r_gue) / (1 - r_gue));
    }

    // ─── OSCILLATOR ──────────────────────────────────────────
    // A single voice on the circle.

    class Oscillator {
        constructor(freq, amp = 1.0) {
            this.freq = freq;          // natural frequency (Hz)
            this.omega = freq * TAU;   // angular velocity
            this.phase = Math.random() * TAU;  // start random (GUE)
            this.amp = amp;
        }

        // The sound of this oscillator at its current phase
        sample() {
            return this.amp * Math.sin(this.phase);
        }
    }

    // ─── COUPLED OSCILLATOR BANK ─────────────────────────────
    // N oscillators on S¹, coupled by K.
    // K = 0: silence (GUE, independent, incoherent)
    // K > K_c: music (phases lock, coherence, departure from random)

    class OscillatorBank {
        constructor(config = {}) {
            this.oscillators = [];
            this.K = 0;                    // coupling constant (body controls this)
            this.K_c = 1;                  // critical coupling (transition point)
            this.dt = 1 / 44100;           // time step (audio sample rate)
            this.phi = 0;                  // current Φ_prime
            this.r = 0;                    // current order parameter

            // Sweet spot boundaries
            this.K_low = config.K_low || 0.5;    // below = too quiet
            this.K_high = config.K_high || 15;    // above = too locked (harsh)
            this.K_sweet = config.K_sweet || 5;   // the groove zone
        }

        // Add oscillators with prime-related frequencies
        addPrimeVoices(fundamental, count = 7) {
            // Use the first `count` primes as frequency ratios
            const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
            for (let i = 0; i < count && i < primes.length; i++) {
                const freq = fundamental * primes[i] / primes[0];
                const amp = 1.0 / Math.sqrt(primes[i]); // amplitude falls as 1/√p
                this.oscillators.push(new Oscillator(freq, amp));
            }
            this._updateKc();
        }

        // Add oscillators for a specific chord (phase coherence relationships)
        addChord(root, ratios, amp = 0.5) {
            for (const ratio of ratios) {
                this.oscillators.push(new Oscillator(root * ratio, amp));
            }
            this._updateKc();
        }

        // Add oscillators with specific emotional character
        addMood(root, mood = 'neutral') {
            const moods = {
                // Major: 4:5:6 — clean lock, joy
                joy:       [1, 5/4, 3/2, 2, 5/2],
                // Minor: 10:12:15 — partial lock, sadness
                sadness:   [1, 6/5, 3/2, 2, 12/5],
                // Sus4: 6:8:9 — open, unresolved yearning
                yearning:  [1, 4/3, 3/2, 2, 8/3],
                // Power: 2:3 — raw primal
                power:     [1, 3/2, 2, 3, 4],
                // Tritone: unstable, dark
                tension:   [1, 45/32, 3/2, 2, 45/16],
                // Neutral: octaves and fifths only
                neutral:   [1, 3/2, 2, 3, 4],
            };
            const ratios = moods[mood] || moods.neutral;
            for (const ratio of ratios) {
                const amp = 0.5 / Math.sqrt(ratio);
                this.oscillators.push(new Oscillator(root * ratio, amp));
            }
            this._updateKc();
        }

        _updateKc() {
            // K_c depends on frequency spread
            const freqs = this.oscillators.map(o => o.freq);
            const mean = freqs.reduce((a, b) => a + b, 0) / freqs.length;
            const spread = Math.sqrt(freqs.reduce((s, f) => s + (f - mean) ** 2, 0) / freqs.length);
            this.K_c = TAU * spread / Math.max(freqs.length, 1);
        }

        // ─── THE KURAMOTO STEP ───────────────────────────────
        // This is where the physics happens.
        // Each oscillator's phase evolves:
        //   dθ_k/dt = ω_k + (K/N) Σ sin(θ_j - θ_k)

        step() {
            const N = this.oscillators.length;
            if (N === 0) return;

            const phases = this.oscillators.map(o => o.phase);

            for (let k = 0; k < N; k++) {
                const osc = this.oscillators[k];

                // Coupling: pull toward the mean phase
                let coupling = 0;
                for (let j = 0; j < N; j++) {
                    coupling += Math.sin(phases[j] - osc.phase);
                }
                coupling *= this.K / N;

                // Evolve phase
                osc.phase = S1.wrap(osc.phase + (osc.omega + coupling) * this.dt);
            }

            // Update coherence measures
            this.r = orderParameter(this.oscillators.map(o => o.phase));
            this.phi = phiPrime(this.oscillators.map(o => o.phase));
        }

        // ─── THE SOUND ───────────────────────────────────────
        // The output is the SUM of all oscillators.
        // When phases are random (GUE): destructive interference → quiet
        // When phases lock: constructive interference → loud
        // The COHERENCE creates the volume. Not a gain knob. Physics.

        sample() {
            this.step();
            let out = 0;
            for (const osc of this.oscillators) {
                out += osc.sample();
            }
            // Normalize by √N (so GUE gives ~1, lock gives ~√N)
            return out / Math.sqrt(Math.max(this.oscillators.length, 1));
        }

        // ─── STATE ───────────────────────────────────────────

        getState() {
            return {
                r: this.r,
                phi: this.phi,
                K: this.K,
                K_c: this.K_c,
                K_ratio: this.K / Math.max(this.K_c, 0.001),
                N: this.oscillators.length,
                regime: this.K < this.K_low ? 'silence' :
                        this.K < this.K_c ? 'emerging' :
                        this.K < this.K_sweet * 1.5 ? 'groove' :
                        this.K < this.K_high ? 'intense' : 'overdriven',
                phases: this.oscillators.map(o => o.phase),
                freqs: this.oscillators.map(o => o.freq),
            };
        }
    }

    // ─── THE BODY MAPPER ─────────────────────────────────────
    // Maps sensor input to coupling constant K.
    // Stillness → K = 0 (GUE, silence)
    // Movement → K increases (phases lock, music emerges)
    // The body IS the coupling.

    class BodyMapper {
        constructor() {
            this.energy = 0;       // smoothed motion energy
            this.tilt = 0;         // device tilt (-1 to 1)
            this.smoothing = 0.95; // momentum (water bottle feel)
        }

        // Process sensor data → coupling constant K
        update(accel, tilt) {
            // Energy from acceleration magnitude
            const rawEnergy = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
            this.energy = this.smoothing * this.energy + (1 - this.smoothing) * rawEnergy;
            this.tilt = this.smoothing * this.tilt + (1 - this.smoothing) * tilt;

            return this;
        }

        // Convert energy to coupling K
        // Stillness: K ≈ 0 (silence, GUE)
        // Gentle motion: K ≈ K_c (music emerging)
        // Strong motion: K >> K_c (intense coherence)
        getK(K_c = 1) {
            // Exponential mapping: small motion → big effect near K_c
            return K_c * Math.exp(this.energy * 3 - 1.5);
        }

        // Convert tilt to frequency shift
        // Tilt up: higher root frequency (brighter)
        // Tilt down: lower root frequency (darker)
        getRootShift() {
            // ±1 octave from tilt
            return Math.pow(2, this.tilt);
        }

        // Convert motion character to mood
        // Smooth motion: major/joy
        // Jerky motion: tension
        // Swaying: yearning
        getMood() {
            // Simplified: based on energy level
            if (this.energy < 0.1) return 'neutral';
            if (this.energy < 0.3) return 'sadness';
            if (this.energy < 0.6) return 'yearning';
            if (this.energy < 1.0) return 'joy';
            return 'power';
        }
    }

    // ─── COHERENCE VISUALIZER DATA ───────────────────────────
    // Output data for visualization (organism.js can use this)

    class CoherenceVisualizer {
        constructor(bank) {
            this.bank = bank;
        }

        // Get particle positions on the unit circle
        getParticles() {
            return this.bank.oscillators.map((osc, i) => ({
                x: Math.cos(osc.phase),
                y: Math.sin(osc.phase),
                size: osc.amp,
                freq: osc.freq,
                index: i,
            }));
        }

        // Get the mean phase (center of mass on S¹)
        getMeanPhase() {
            const phases = this.bank.oscillators.map(o => o.phase);
            return S1.mean(phases);
        }

        // Get coherence color
        // GUE (random): cool blue
        // Partial lock: warm amber
        // Full lock: white hot
        getColor() {
            const phi = this.bank.phi;
            if (phi < 0.1) return { h: 220, s: 80, l: 30 };  // deep blue (silence)
            if (phi < 0.3) return { h: 200, s: 70, l: 40 };  // blue (emerging)
            if (phi < 0.6) return { h: 40, s: 90, l: 50 };   // amber (groove)
            if (phi < 0.8) return { h: 30, s: 100, l: 60 };  // orange (intense)
            return { h: 20, s: 100, l: 80 };                  // white-hot (locked)
        }
    }

    // ─── PUBLIC API ──────────────────────────────────────────

    return {
        S1,
        orderParameter,
        phiPrime,
        Oscillator,
        OscillatorBank,
        BodyMapper,
        CoherenceVisualizer,

        // Quick start: create a complete engine
        create(config = {}) {
            const root = config.root || 220;  // A3
            const mood = config.mood || 'neutral';

            const bank = new OscillatorBank(config);
            bank.addMood(root, mood);

            const body = new BodyMapper();
            const viz = new CoherenceVisualizer(bank);

            return {
                bank,
                body,
                viz,

                // Main loop: call this every audio frame
                process(accel, tilt) {
                    body.update(accel, tilt);
                    bank.K = body.getK(bank.K_c);
                    return bank.sample();
                },

                // Get current state for UI/visualization
                state() {
                    return {
                        ...bank.getState(),
                        particles: viz.getParticles(),
                        color: viz.getColor(),
                        meanPhase: viz.getMeanPhase(),
                    };
                },
            };
        },

        // The fundamental law, in code
        law: `
            Stillness = GUE = silence = equilibrium.
            Movement = coupling = coherence = music.
            The system follows the human.
            The human follows the music.
            The music follows the primes.
            The primes follow nothing.
        `,
    };
})();

// Export for both browser and Node
if (typeof module !== 'undefined') module.exports = PrimeEngine;
if (typeof window !== 'undefined') window.PrimeEngine = PrimeEngine;
