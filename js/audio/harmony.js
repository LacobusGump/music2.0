/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - HARMONY SYNTHESIS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Comprehensive pad, chord, and harmonic texture synthesis.
 * Supports the full evolution from primordial drones to modern synth pads.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpHarmony = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        maxVoices: 16,
        defaultAttack: 0.3,
        defaultDecay: 0.5,
        defaultSustain: 0.7,
        defaultRelease: 1.5,
        maxDetune: 50,
        filterRange: { min: 100, max: 15000 },
        lfoRates: { slow: 0.1, medium: 0.5, fast: 2.0, tremolo: 6.0 },
        reverbMix: 0.4
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PAD TYPE DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Each pad type defines how the sound is constructed and shaped.
     * These range from primordial textures to modern production pads.
     */
    const PAD_TYPES = {
        // ─────────────────────────────────────────────────────────────────
        // GENESIS ERA - Primordial textures
        // ─────────────────────────────────────────────────────────────────

        void_drone: {
            name: 'Void Drone',
            era: 'genesis',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.5 },
                { type: 'sine', detune: -1200, gain: 0.3 }  // Octave below
            ],
            filter: { type: 'lowpass', frequency: 200, Q: 1 },
            envelope: { attack: 3.0, decay: 2.0, sustain: 0.8, release: 4.0 },
            lfo: { rate: 0.05, depth: 10, target: 'detune' },
            effects: { reverb: 0.8, delay: 0.3 }
        },

        first_light: {
            name: 'First Light',
            era: 'genesis',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.4 },
                { type: 'triangle', detune: 7, gain: 0.2 },
                { type: 'sine', detune: 1200, gain: 0.15 }  // Octave above
            ],
            filter: { type: 'lowpass', frequency: 800, Q: 2 },
            envelope: { attack: 2.0, decay: 1.0, sustain: 0.6, release: 3.0 },
            lfo: { rate: 0.1, depth: 20, target: 'filter' },
            effects: { reverb: 0.7, delay: 0.4 }
        },

        shimmer_pad: {
            name: 'Shimmer Pad',
            era: 'genesis',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.3 },
                { type: 'sine', detune: 1200, gain: 0.2 },
                { type: 'sine', detune: 1907, gain: 0.15 },  // Perfect fifth + octave
                { type: 'triangle', detune: 2400, gain: 0.1 }
            ],
            filter: { type: 'bandpass', frequency: 2000, Q: 0.5 },
            envelope: { attack: 1.5, decay: 0.8, sustain: 0.7, release: 2.5 },
            lfo: { rate: 0.2, depth: 100, target: 'filter' },
            effects: { reverb: 0.9, delay: 0.5 }
        },

        overtone_cloud: {
            name: 'Overtone Cloud',
            era: 'genesis',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.4 },
                { type: 'sine', detune: 702, gain: 0.25 },   // Perfect fifth
                { type: 'sine', detune: 1200, gain: 0.2 },   // Octave
                { type: 'sine', detune: 1902, gain: 0.15 },  // Octave + fifth
                { type: 'sine', detune: 2400, gain: 0.1 },   // Two octaves
                { type: 'sine', detune: 2786, gain: 0.08 }   // Two octaves + major third
            ],
            filter: { type: 'lowpass', frequency: 4000, Q: 1 },
            envelope: { attack: 2.5, decay: 1.5, sustain: 0.5, release: 4.0 },
            lfo: { rate: 0.08, depth: 50, target: 'gain' },
            effects: { reverb: 0.85, delay: 0.6 }
        },

        // ─────────────────────────────────────────────────────────────────
        // PRIMORDIAL ERA - Natural resonances
        // ─────────────────────────────────────────────────────────────────

        breath_texture: {
            name: 'Breath Texture',
            era: 'primordial',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.1 },
                { type: 'sawtooth', detune: 5, gain: 0.1 }
            ],
            noise: { type: 'pink', gain: 0.3, filter: { type: 'bandpass', frequency: 800, Q: 2 } },
            filter: { type: 'lowpass', frequency: 600, Q: 4 },
            envelope: { attack: 0.8, decay: 0.5, sustain: 0.4, release: 1.5 },
            lfo: { rate: 0.15, depth: 200, target: 'filter' },
            effects: { reverb: 0.5, delay: 0.2 }
        },

        wind_pad: {
            name: 'Wind Pad',
            era: 'primordial',
            oscillators: [
                { type: 'triangle', detune: 0, gain: 0.2 },
                { type: 'sine', detune: -5, gain: 0.15 }
            ],
            noise: { type: 'white', gain: 0.25, filter: { type: 'highpass', frequency: 400, Q: 1 } },
            filter: { type: 'bandpass', frequency: 1200, Q: 3 },
            envelope: { attack: 1.2, decay: 0.8, sustain: 0.5, release: 2.0 },
            lfo: { rate: 0.3, depth: 400, target: 'filter' },
            effects: { reverb: 0.6, delay: 0.3 }
        },

        water_resonance: {
            name: 'Water Resonance',
            era: 'primordial',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.35 },
                { type: 'sine', detune: 7, gain: 0.25 },
                { type: 'triangle', detune: 1200, gain: 0.15 }
            ],
            filter: { type: 'lowpass', frequency: 1500, Q: 8 },
            envelope: { attack: 0.5, decay: 1.0, sustain: 0.6, release: 2.5 },
            lfo: { rate: 0.4, depth: 500, target: 'filter' },
            effects: { reverb: 0.75, delay: 0.45 }
        },

        earth_hum: {
            name: 'Earth Hum',
            era: 'primordial',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.5 },
                { type: 'sine', detune: -1200, gain: 0.4 },
                { type: 'triangle', detune: -2400, gain: 0.2 }
            ],
            filter: { type: 'lowpass', frequency: 300, Q: 2 },
            envelope: { attack: 2.0, decay: 1.0, sustain: 0.8, release: 3.0 },
            lfo: { rate: 0.05, depth: 5, target: 'detune' },
            effects: { reverb: 0.5, delay: 0.1 }
        },

        cave_echo: {
            name: 'Cave Echo',
            era: 'primordial',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.3 },
                { type: 'sine', detune: 702, gain: 0.2 },
                { type: 'triangle', detune: 1200, gain: 0.15 }
            ],
            filter: { type: 'bandpass', frequency: 500, Q: 5 },
            envelope: { attack: 0.8, decay: 2.0, sustain: 0.4, release: 4.0 },
            lfo: { rate: 0.1, depth: 100, target: 'filter' },
            effects: { reverb: 0.95, delay: 0.7 }
        },

        // ─────────────────────────────────────────────────────────────────
        // TRIBAL ERA - Ritualistic textures
        // ─────────────────────────────────────────────────────────────────

        ritual_drone: {
            name: 'Ritual Drone',
            era: 'tribal',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.15 },
                { type: 'sawtooth', detune: -7, gain: 0.15 },
                { type: 'sine', detune: -1200, gain: 0.3 }
            ],
            filter: { type: 'lowpass', frequency: 800, Q: 3 },
            envelope: { attack: 1.5, decay: 1.0, sustain: 0.7, release: 2.5 },
            lfo: { rate: 0.2, depth: 150, target: 'filter' },
            effects: { reverb: 0.6, delay: 0.35 }
        },

        chant_pad: {
            name: 'Chant Pad',
            era: 'tribal',
            oscillators: [
                { type: 'triangle', detune: 0, gain: 0.25 },
                { type: 'sine', detune: 386, gain: 0.15 },   // Major third
                { type: 'sine', detune: 702, gain: 0.2 }     // Perfect fifth
            ],
            formant: { vowel: 'ah', intensity: 0.3 },
            filter: { type: 'bandpass', frequency: 1000, Q: 2 },
            envelope: { attack: 0.6, decay: 0.8, sustain: 0.6, release: 2.0 },
            lfo: { rate: 0.25, depth: 50, target: 'filter' },
            effects: { reverb: 0.55, delay: 0.25 }
        },

        fire_texture: {
            name: 'Fire Texture',
            era: 'tribal',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.12 },
                { type: 'sawtooth', detune: 3, gain: 0.12 },
                { type: 'square', detune: -1200, gain: 0.08 }
            ],
            noise: { type: 'brown', gain: 0.2, filter: { type: 'highpass', frequency: 200, Q: 1 } },
            filter: { type: 'lowpass', frequency: 2000, Q: 2 },
            envelope: { attack: 0.4, decay: 0.6, sustain: 0.5, release: 1.5 },
            lfo: { rate: 3.0, depth: 300, target: 'filter' },
            effects: { reverb: 0.45, delay: 0.15 }
        },

        night_pad: {
            name: 'Night Pad',
            era: 'tribal',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.35 },
                { type: 'sine', detune: 702, gain: 0.2 },
                { type: 'triangle', detune: -1200, gain: 0.25 }
            ],
            filter: { type: 'lowpass', frequency: 600, Q: 1.5 },
            envelope: { attack: 2.0, decay: 1.5, sustain: 0.6, release: 3.5 },
            lfo: { rate: 0.08, depth: 80, target: 'filter' },
            effects: { reverb: 0.7, delay: 0.4 }
        },

        spirit_voice: {
            name: 'Spirit Voice',
            era: 'tribal',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.3 },
                { type: 'sine', detune: 12, gain: 0.25 },
                { type: 'triangle', detune: 1200, gain: 0.15 }
            ],
            formant: { vowel: 'oh', intensity: 0.4 },
            filter: { type: 'bandpass', frequency: 800, Q: 4 },
            envelope: { attack: 0.8, decay: 1.0, sustain: 0.5, release: 2.5 },
            lfo: { rate: 0.15, depth: 120, target: 'filter' },
            effects: { reverb: 0.8, delay: 0.5 }
        },

        // ─────────────────────────────────────────────────────────────────
        // SACRED ERA - Harmonic complexity
        // ─────────────────────────────────────────────────────────────────

        organ_pad: {
            name: 'Organ Pad',
            era: 'sacred',
            oscillators: [
                { type: 'sine', detune: -1200, gain: 0.35 },  // 16'
                { type: 'sine', detune: 0, gain: 0.4 },       // 8'
                { type: 'sine', detune: 1200, gain: 0.25 },   // 4'
                { type: 'sine', detune: 1902, gain: 0.15 },   // 2 2/3'
                { type: 'sine', detune: 2400, gain: 0.12 },   // 2'
                { type: 'sine', detune: 2786, gain: 0.08 }    // 1 3/5'
            ],
            filter: { type: 'lowpass', frequency: 3000, Q: 0.7 },
            envelope: { attack: 0.3, decay: 0.5, sustain: 0.8, release: 1.5 },
            lfo: { rate: 5.5, depth: 8, target: 'detune' },  // Leslie effect
            effects: { reverb: 0.65, delay: 0.2 }
        },

        choir_pad: {
            name: 'Choir Pad',
            era: 'sacred',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.08 },
                { type: 'sawtooth', detune: 5, gain: 0.08 },
                { type: 'sawtooth', detune: -5, gain: 0.08 },
                { type: 'sine', detune: 0, gain: 0.2 }
            ],
            formant: { vowel: 'ah', intensity: 0.5 },
            filter: { type: 'lowpass', frequency: 2500, Q: 2 },
            envelope: { attack: 0.5, decay: 0.8, sustain: 0.7, release: 2.0 },
            lfo: { rate: 0.2, depth: 100, target: 'filter' },
            effects: { reverb: 0.75, delay: 0.3 }
        },

        string_pad: {
            name: 'String Pad',
            era: 'sacred',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.12 },
                { type: 'sawtooth', detune: -8, gain: 0.12 },
                { type: 'sawtooth', detune: 8, gain: 0.12 },
                { type: 'sawtooth', detune: -1200, gain: 0.08 }
            ],
            filter: { type: 'lowpass', frequency: 4000, Q: 1 },
            envelope: { attack: 0.4, decay: 0.6, sustain: 0.75, release: 1.8 },
            lfo: { rate: 0.18, depth: 60, target: 'filter' },
            effects: { reverb: 0.55, delay: 0.15 }
        },

        glass_harmonica: {
            name: 'Glass Harmonica',
            era: 'sacred',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.4 },
                { type: 'sine', detune: 1200, gain: 0.2 },
                { type: 'triangle', detune: 2400, gain: 0.1 }
            ],
            filter: { type: 'bandpass', frequency: 3000, Q: 3 },
            envelope: { attack: 0.2, decay: 1.5, sustain: 0.4, release: 3.0 },
            lfo: { rate: 4.0, depth: 15, target: 'detune' },  // Vibrato
            effects: { reverb: 0.85, delay: 0.5 }
        },

        bell_pad: {
            name: 'Bell Pad',
            era: 'sacred',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.35 },
                { type: 'sine', detune: 1200, gain: 0.25 },
                { type: 'sine', detune: 2400, gain: 0.15 },
                { type: 'sine', detune: 3102, gain: 0.1 }    // Non-harmonic partial
            ],
            filter: { type: 'highpass', frequency: 500, Q: 0.7 },
            envelope: { attack: 0.01, decay: 2.0, sustain: 0.3, release: 4.0 },
            lfo: { rate: 0.1, depth: 30, target: 'gain' },
            effects: { reverb: 0.9, delay: 0.6 }
        },

        // ─────────────────────────────────────────────────────────────────
        // MODERN ERA - Production pads
        // ─────────────────────────────────────────────────────────────────

        analog_pad: {
            name: 'Analog Pad',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.15 },
                { type: 'sawtooth', detune: -12, gain: 0.15 },
                { type: 'sawtooth', detune: 12, gain: 0.15 },
                { type: 'square', detune: -1200, gain: 0.1 }
            ],
            filter: { type: 'lowpass', frequency: 2000, Q: 4 },
            envelope: { attack: 0.3, decay: 0.5, sustain: 0.7, release: 1.5 },
            lfo: { rate: 0.25, depth: 300, target: 'filter' },
            effects: { reverb: 0.5, delay: 0.25 }
        },

        supersaw_pad: {
            name: 'Supersaw Pad',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: -24, gain: 0.1 },
                { type: 'sawtooth', detune: -12, gain: 0.12 },
                { type: 'sawtooth', detune: 0, gain: 0.15 },
                { type: 'sawtooth', detune: 12, gain: 0.12 },
                { type: 'sawtooth', detune: 24, gain: 0.1 },
                { type: 'sawtooth', detune: -1200, gain: 0.08 },
                { type: 'sawtooth', detune: 1200, gain: 0.06 }
            ],
            filter: { type: 'lowpass', frequency: 3500, Q: 2 },
            envelope: { attack: 0.2, decay: 0.4, sustain: 0.75, release: 1.2 },
            lfo: { rate: 0.15, depth: 200, target: 'filter' },
            effects: { reverb: 0.55, delay: 0.35 }
        },

        digital_pad: {
            name: 'Digital Pad',
            era: 'modern',
            oscillators: [
                { type: 'square', detune: 0, gain: 0.1 },
                { type: 'square', detune: 7, gain: 0.1 },
                { type: 'triangle', detune: 1200, gain: 0.15 },
                { type: 'sine', detune: -1200, gain: 0.2 }
            ],
            filter: { type: 'lowpass', frequency: 2500, Q: 3 },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 1.0 },
            lfo: { rate: 0.3, depth: 150, target: 'filter' },
            effects: { reverb: 0.4, delay: 0.3 }
        },

        wavetable_pad: {
            name: 'Wavetable Pad',
            era: 'modern',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.3 },
                { type: 'sawtooth', detune: 0, gain: 0.15 },
                { type: 'triangle', detune: 7, gain: 0.2 }
            ],
            wavetable: { morph: true, rate: 0.1 },
            filter: { type: 'lowpass', frequency: 3000, Q: 2 },
            envelope: { attack: 0.25, decay: 0.5, sustain: 0.7, release: 1.5 },
            lfo: { rate: 0.1, depth: 0.5, target: 'wavetable' },
            effects: { reverb: 0.5, delay: 0.2 }
        },

        dark_pad: {
            name: 'Dark Pad',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.12 },
                { type: 'sawtooth', detune: -15, gain: 0.12 },
                { type: 'square', detune: -1200, gain: 0.15 },
                { type: 'sine', detune: -2400, gain: 0.2 }
            ],
            filter: { type: 'lowpass', frequency: 800, Q: 5 },
            envelope: { attack: 0.5, decay: 1.0, sustain: 0.6, release: 2.0 },
            lfo: { rate: 0.1, depth: 200, target: 'filter' },
            effects: { reverb: 0.65, delay: 0.4 }
        },

        ambient_pad: {
            name: 'Ambient Pad',
            era: 'modern',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.25 },
                { type: 'triangle', detune: 5, gain: 0.2 },
                { type: 'sine', detune: 1200, gain: 0.15 },
                { type: 'sine', detune: 702, gain: 0.12 }
            ],
            filter: { type: 'lowpass', frequency: 2000, Q: 1 },
            envelope: { attack: 1.5, decay: 1.0, sustain: 0.7, release: 3.0 },
            lfo: { rate: 0.08, depth: 100, target: 'filter' },
            effects: { reverb: 0.85, delay: 0.5 }
        },

        texture_pad: {
            name: 'Texture Pad',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.08 },
                { type: 'sawtooth', detune: -20, gain: 0.08 },
                { type: 'sawtooth', detune: 20, gain: 0.08 }
            ],
            noise: { type: 'pink', gain: 0.15, filter: { type: 'bandpass', frequency: 2000, Q: 1 } },
            filter: { type: 'lowpass', frequency: 4000, Q: 1.5 },
            envelope: { attack: 0.8, decay: 0.6, sustain: 0.65, release: 2.0 },
            lfo: { rate: 0.12, depth: 250, target: 'filter' },
            effects: { reverb: 0.7, delay: 0.35 }
        },

        warm_pad: {
            name: 'Warm Pad',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.1 },
                { type: 'sawtooth', detune: -8, gain: 0.1 },
                { type: 'sawtooth', detune: 8, gain: 0.1 },
                { type: 'sine', detune: -1200, gain: 0.25 }
            ],
            filter: { type: 'lowpass', frequency: 1500, Q: 2 },
            envelope: { attack: 0.4, decay: 0.6, sustain: 0.7, release: 1.8 },
            lfo: { rate: 0.2, depth: 180, target: 'filter' },
            saturation: { amount: 0.2, type: 'soft' },
            effects: { reverb: 0.5, delay: 0.2 }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CHORD DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════

    const CHORD_TYPES = {
        // Basic triads
        major: [0, 4, 7],
        minor: [0, 3, 7],
        diminished: [0, 3, 6],
        augmented: [0, 4, 8],

        // Suspended
        sus2: [0, 2, 7],
        sus4: [0, 5, 7],

        // Seventh chords
        maj7: [0, 4, 7, 11],
        min7: [0, 3, 7, 10],
        dom7: [0, 4, 7, 10],
        dim7: [0, 3, 6, 9],
        min7b5: [0, 3, 6, 10],
        minMaj7: [0, 3, 7, 11],
        aug7: [0, 4, 8, 10],

        // Extended chords
        maj9: [0, 4, 7, 11, 14],
        min9: [0, 3, 7, 10, 14],
        dom9: [0, 4, 7, 10, 14],
        add9: [0, 4, 7, 14],
        madd9: [0, 3, 7, 14],

        // Elevenths
        maj11: [0, 4, 7, 11, 14, 17],
        min11: [0, 3, 7, 10, 14, 17],
        dom11: [0, 4, 7, 10, 14, 17],

        // Thirteenths
        maj13: [0, 4, 7, 11, 14, 21],
        min13: [0, 3, 7, 10, 14, 21],
        dom13: [0, 4, 7, 10, 14, 21],

        // Power and drone
        power: [0, 7],
        power8: [0, 7, 12],

        // Modal clusters
        quartal: [0, 5, 10],
        quintal: [0, 7, 14],

        // Jazz voicings
        shell3: [0, 4, 10],      // 3rd and 7th
        shell7: [0, 3, 10],      // minor 3rd and 7th
        rootless9: [4, 7, 10, 14],

        // Ambient clusters
        cluster2: [0, 2, 4],
        cluster3: [0, 1, 2],
        openVoice: [0, 7, 16, 19]  // Wide spread
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VOICING PATTERNS
    // ═══════════════════════════════════════════════════════════════════════

    const VOICING_PATTERNS = {
        close: {
            name: 'Close Position',
            octaveSpread: 0,
            inversion: 0
        },
        open: {
            name: 'Open Position',
            octaveSpread: 1,
            dropVoice: 1
        },
        drop2: {
            name: 'Drop 2',
            octaveSpread: 1,
            dropVoice: 2
        },
        drop3: {
            name: 'Drop 3',
            octaveSpread: 1,
            dropVoice: 3
        },
        spread: {
            name: 'Spread Voicing',
            octaveSpread: 2,
            alternating: true
        },
        cluster: {
            name: 'Cluster',
            octaveSpread: 0,
            tight: true
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FORMANT FILTERS
    // ═══════════════════════════════════════════════════════════════════════

    const FORMANTS = {
        ah: [
            { freq: 800, Q: 10, gain: 1.0 },
            { freq: 1200, Q: 10, gain: 0.5 },
            { freq: 2500, Q: 10, gain: 0.3 }
        ],
        ee: [
            { freq: 270, Q: 10, gain: 1.0 },
            { freq: 2300, Q: 10, gain: 0.5 },
            { freq: 3000, Q: 10, gain: 0.3 }
        ],
        oh: [
            { freq: 500, Q: 10, gain: 1.0 },
            { freq: 800, Q: 10, gain: 0.5 },
            { freq: 2500, Q: 10, gain: 0.2 }
        ],
        oo: [
            { freq: 300, Q: 10, gain: 1.0 },
            { freq: 870, Q: 10, gain: 0.3 },
            { freq: 2250, Q: 10, gain: 0.2 }
        ],
        eh: [
            { freq: 530, Q: 10, gain: 1.0 },
            { freq: 1850, Q: 10, gain: 0.5 },
            { freq: 2500, Q: 10, gain: 0.3 }
        ]
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    let audioContext = null;
    let masterGain = null;
    let reverbSend = null;
    let delaySend = null;
    let convolver = null;
    let delayNode = null;

    const activeVoices = new Map();
    const voicePool = [];
    let nextVoiceId = 0;

    // Current state
    let currentPadType = 'void_drone';
    let currentChordType = 'power';
    let currentVoicing = 'close';
    let currentRoot = 220;  // A3

    // Modulation sources
    const modulationSources = {
        lfo1: null,
        lfo2: null,
        envelope: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(ctx) {
        audioContext = ctx;

        // Create master gain
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.7;

        // Create effects sends
        createEffectsChain();

        // Create modulation sources
        createModulationSources();

        // Connect to GumpAudio if available
        if (typeof GumpAudio !== 'undefined' && GumpAudio.getChannelInput) {
            masterGain.connect(GumpAudio.getChannelInput('pads'));
        } else {
            masterGain.connect(audioContext.destination);
        }

        console.log('[GumpHarmony] Initialized');
    }

    function createEffectsChain() {
        // Reverb send
        reverbSend = audioContext.createGain();
        reverbSend.gain.value = 0.4;

        // Create convolver for reverb
        convolver = audioContext.createConvolver();
        createImpulseResponse();

        reverbSend.connect(convolver);
        convolver.connect(masterGain);

        // Delay send
        delaySend = audioContext.createGain();
        delaySend.gain.value = 0.3;

        delayNode = audioContext.createDelay(2.0);
        delayNode.delayTime.value = 0.375;  // Dotted eighth at 120bpm

        const delayFeedback = audioContext.createGain();
        delayFeedback.gain.value = 0.4;

        const delayFilter = audioContext.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 3000;

        delaySend.connect(delayNode);
        delayNode.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayFilter.connect(masterGain);
    }

    function createImpulseResponse() {
        // Generate synthetic impulse response
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * 3;  // 3 second reverb
        const impulse = audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Exponential decay with diffusion
                const t = i / sampleRate;
                const decay = Math.exp(-3 * t);
                const diffusion = (Math.random() * 2 - 1) * decay;

                // Add early reflections
                let early = 0;
                const earlyTimes = [0.01, 0.02, 0.035, 0.05, 0.08];
                const earlyGains = [0.7, 0.5, 0.4, 0.3, 0.2];
                earlyTimes.forEach((time, idx) => {
                    if (Math.abs(t - time) < 0.001) {
                        early = earlyGains[idx] * (channel === 0 ? 1 : -1);
                    }
                });

                data[i] = diffusion * 0.5 + early;
            }
        }

        convolver.buffer = impulse;
    }

    function createModulationSources() {
        // LFO 1 - Slow modulation
        modulationSources.lfo1 = audioContext.createOscillator();
        modulationSources.lfo1.type = 'sine';
        modulationSources.lfo1.frequency.value = 0.1;
        modulationSources.lfo1.start();

        // LFO 2 - Faster modulation
        modulationSources.lfo2 = audioContext.createOscillator();
        modulationSources.lfo2.type = 'triangle';
        modulationSources.lfo2.frequency.value = 0.5;
        modulationSources.lfo2.start();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOICE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    function createVoice(frequency, padDef, velocity = 0.8) {
        const voice = {
            id: nextVoiceId++,
            frequency,
            velocity,
            oscillators: [],
            filter: null,
            filterEnv: null,
            ampEnv: null,
            lfo: null,
            lfoGain: null,
            output: null,
            noise: null,
            formants: [],
            saturation: null,
            dryGain: null,
            reverbGain: null,
            delayGain: null,
            isReleasing: false,
            releaseTime: 0
        };

        // Create output node
        voice.output = audioContext.createGain();
        voice.output.gain.value = 0;

        // Create oscillators
        padDef.oscillators.forEach(oscDef => {
            const osc = audioContext.createOscillator();
            osc.type = oscDef.type;
            osc.frequency.value = frequency * Math.pow(2, oscDef.detune / 1200);

            const oscGain = audioContext.createGain();
            oscGain.gain.value = oscDef.gain * velocity;

            osc.connect(oscGain);
            voice.oscillators.push({ osc, gain: oscGain, detune: oscDef.detune });
        });

        // Create noise if defined
        if (padDef.noise) {
            voice.noise = createNoiseSource(padDef.noise);
        }

        // Create filter
        voice.filter = audioContext.createBiquadFilter();
        voice.filter.type = padDef.filter.type;
        voice.filter.frequency.value = padDef.filter.frequency;
        voice.filter.Q.value = padDef.filter.Q;

        // Create formant filters if defined
        if (padDef.formant) {
            const formantDef = FORMANTS[padDef.formant.vowel];
            if (formantDef) {
                formantDef.forEach(f => {
                    const formantFilter = audioContext.createBiquadFilter();
                    formantFilter.type = 'bandpass';
                    formantFilter.frequency.value = f.freq;
                    formantFilter.Q.value = f.Q;

                    const formantGain = audioContext.createGain();
                    formantGain.gain.value = f.gain * padDef.formant.intensity;

                    voice.formants.push({ filter: formantFilter, gain: formantGain });
                });
            }
        }

        // Create LFO for modulation
        if (padDef.lfo) {
            voice.lfo = audioContext.createOscillator();
            voice.lfo.type = 'sine';
            voice.lfo.frequency.value = padDef.lfo.rate;

            voice.lfoGain = audioContext.createGain();
            voice.lfoGain.gain.value = padDef.lfo.depth;

            voice.lfo.connect(voice.lfoGain);

            // Route LFO to target
            switch (padDef.lfo.target) {
                case 'filter':
                    voice.lfoGain.connect(voice.filter.frequency);
                    break;
                case 'detune':
                    voice.oscillators.forEach(o => {
                        voice.lfoGain.connect(o.osc.detune);
                    });
                    break;
                case 'gain':
                    voice.lfoGain.connect(voice.output.gain);
                    break;
            }
        }

        // Create saturation if defined
        if (padDef.saturation) {
            voice.saturation = createSaturation(padDef.saturation);
        }

        // Create effect sends
        voice.dryGain = audioContext.createGain();
        voice.dryGain.gain.value = 1 - padDef.effects.reverb * 0.5;

        voice.reverbGain = audioContext.createGain();
        voice.reverbGain.gain.value = padDef.effects.reverb;

        voice.delayGain = audioContext.createGain();
        voice.delayGain.gain.value = padDef.effects.delay;

        // Connect signal chain
        connectVoiceChain(voice, padDef);

        return voice;
    }

    function connectVoiceChain(voice, padDef) {
        // Connect oscillators to filter
        voice.oscillators.forEach(o => {
            o.gain.connect(voice.filter);
        });

        // Connect noise if present
        if (voice.noise) {
            voice.noise.output.connect(voice.filter);
        }

        let signalPath = voice.filter;

        // Add formants in parallel if present
        if (voice.formants.length > 0) {
            const formantMix = audioContext.createGain();
            formantMix.gain.value = 0.5;

            voice.formants.forEach(f => {
                voice.filter.connect(f.filter);
                f.filter.connect(f.gain);
                f.gain.connect(formantMix);
            });

            const dryPath = audioContext.createGain();
            dryPath.gain.value = 0.5;
            voice.filter.connect(dryPath);

            const merge = audioContext.createGain();
            formantMix.connect(merge);
            dryPath.connect(merge);

            signalPath = merge;
        }

        // Add saturation if present
        if (voice.saturation) {
            signalPath.connect(voice.saturation.input);
            signalPath = voice.saturation.output;
        }

        // Connect to output
        signalPath.connect(voice.output);

        // Connect to effect sends
        voice.output.connect(voice.dryGain);
        voice.output.connect(voice.reverbGain);
        voice.output.connect(voice.delayGain);

        voice.dryGain.connect(masterGain);
        voice.reverbGain.connect(reverbSend);
        voice.delayGain.connect(delaySend);
    }

    function createNoiseSource(noiseDef) {
        const bufferSize = audioContext.sampleRate * 2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate noise based on type
        switch (noiseDef.type) {
            case 'white':
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                break;

            case 'pink':
                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                    b6 = white * 0.115926;
                }
                break;

            case 'brown':
                let lastOut = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    data[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = data[i];
                    data[i] *= 3.5;
                }
                break;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Create noise filter if defined
        let output = source;
        if (noiseDef.filter) {
            const filter = audioContext.createBiquadFilter();
            filter.type = noiseDef.filter.type;
            filter.frequency.value = noiseDef.filter.frequency;
            filter.Q.value = noiseDef.filter.Q;

            source.connect(filter);
            output = filter;
        }

        // Create gain for noise level
        const gain = audioContext.createGain();
        gain.gain.value = noiseDef.gain;

        if (output === source) {
            source.connect(gain);
        } else {
            output.connect(gain);
        }

        return {
            source,
            output: gain,
            start: () => source.start(),
            stop: () => source.stop()
        };
    }

    function createSaturation(satDef) {
        const input = audioContext.createGain();
        const output = audioContext.createGain();

        const waveshaper = audioContext.createWaveShaper();

        // Generate distortion curve
        const samples = 44100;
        const curve = new Float32Array(samples);
        const amount = satDef.amount;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2 / samples) - 1;

            switch (satDef.type) {
                case 'soft':
                    curve[i] = Math.tanh(x * (1 + amount * 2));
                    break;
                case 'hard':
                    curve[i] = Math.max(-1, Math.min(1, x * (1 + amount * 5)));
                    break;
                case 'tube':
                    curve[i] = (3 + amount * 10) * x / (1 + (3 + amount * 10) * Math.abs(x));
                    break;
                default:
                    curve[i] = x;
            }
        }

        waveshaper.curve = curve;
        waveshaper.oversample = '2x';

        input.connect(waveshaper);
        waveshaper.connect(output);

        return { input, output };
    }

    function startVoice(voice, padDef, when = 0) {
        const now = when || audioContext.currentTime;
        const env = padDef.envelope;

        // Start oscillators
        voice.oscillators.forEach(o => {
            o.osc.start(now);
        });

        // Start noise
        if (voice.noise) {
            voice.noise.start();
        }

        // Start LFO
        if (voice.lfo) {
            voice.lfo.start(now);
        }

        // Apply envelope
        voice.output.gain.setValueAtTime(0, now);
        voice.output.gain.linearRampToValueAtTime(voice.velocity, now + env.attack);
        voice.output.gain.linearRampToValueAtTime(
            voice.velocity * env.sustain,
            now + env.attack + env.decay
        );

        // Apply filter envelope
        const filterStart = padDef.filter.frequency * 0.5;
        const filterPeak = padDef.filter.frequency;

        voice.filter.frequency.setValueAtTime(filterStart, now);
        voice.filter.frequency.linearRampToValueAtTime(filterPeak, now + env.attack * 0.5);
    }

    function releaseVoice(voice, padDef) {
        if (voice.isReleasing) return;
        voice.isReleasing = true;

        const now = audioContext.currentTime;
        const release = padDef.envelope.release;
        voice.releaseTime = now + release;

        // Release amplitude
        voice.output.gain.cancelScheduledValues(now);
        voice.output.gain.setValueAtTime(voice.output.gain.value, now);
        voice.output.gain.linearRampToValueAtTime(0, now + release);

        // Release filter
        voice.filter.frequency.cancelScheduledValues(now);
        voice.filter.frequency.setValueAtTime(voice.filter.frequency.value, now);
        voice.filter.frequency.linearRampToValueAtTime(
            padDef.filter.frequency * 0.3,
            now + release
        );

        // Schedule cleanup
        setTimeout(() => {
            stopVoice(voice);
            activeVoices.delete(voice.id);
        }, release * 1000 + 100);
    }

    function stopVoice(voice) {
        voice.oscillators.forEach(o => {
            try { o.osc.stop(); } catch (e) {}
        });

        if (voice.noise) {
            try { voice.noise.stop(); } catch (e) {}
        }

        if (voice.lfo) {
            try { voice.lfo.stop(); } catch (e) {}
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHORD GENERATION
    // ═══════════════════════════════════════════════════════════════════════

    function getChordFrequencies(root, chordType, voicing = 'close') {
        const intervals = CHORD_TYPES[chordType] || CHORD_TYPES.major;
        const voicingDef = VOICING_PATTERNS[voicing] || VOICING_PATTERNS.close;

        let frequencies = intervals.map(interval => {
            return root * Math.pow(2, interval / 12);
        });

        // Apply voicing
        if (voicingDef.dropVoice && frequencies.length >= voicingDef.dropVoice) {
            const dropped = frequencies[voicingDef.dropVoice - 1];
            frequencies[voicingDef.dropVoice - 1] = dropped / 2;
        }

        if (voicingDef.octaveSpread > 0) {
            frequencies = frequencies.map((freq, idx) => {
                if (voicingDef.alternating) {
                    return freq * Math.pow(2, (idx % 2) * voicingDef.octaveSpread);
                }
                return freq;
            });
        }

        return frequencies.sort((a, b) => a - b);
    }

    function transposeChord(frequencies, semitones) {
        const factor = Math.pow(2, semitones / 12);
        return frequencies.map(f => f * factor);
    }

    function invertChord(frequencies, inversion) {
        const result = [...frequencies];
        for (let i = 0; i < inversion; i++) {
            const lowest = result.shift();
            result.push(lowest * 2);
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC METHODS - PAD CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function playPad(type, frequency, velocity = 0.8) {
        const padDef = PAD_TYPES[type];
        if (!padDef) {
            console.warn(`[GumpHarmony] Unknown pad type: ${type}`);
            return null;
        }

        const voice = createVoice(frequency, padDef, velocity);
        startVoice(voice, padDef);
        activeVoices.set(voice.id, { voice, padDef });

        return voice.id;
    }

    function stopPad(voiceId) {
        const active = activeVoices.get(voiceId);
        if (active) {
            releaseVoice(active.voice, active.padDef);
        }
    }

    function playChord(type, padType, root, chordType, voicing = 'close', velocity = 0.8) {
        const frequencies = getChordFrequencies(root, chordType, voicing);
        const voiceIds = [];

        frequencies.forEach((freq, idx) => {
            // Slightly vary velocity for natural feel
            const v = velocity * (0.9 + Math.random() * 0.1);
            // Slightly stagger timing
            setTimeout(() => {
                const id = playPad(padType, freq, v);
                if (id !== null) voiceIds.push(id);
            }, idx * 10);
        });

        return voiceIds;
    }

    function stopChord(voiceIds) {
        voiceIds.forEach(id => stopPad(id));
    }

    function stopAll() {
        activeVoices.forEach((active, id) => {
            releaseVoice(active.voice, active.padDef);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC METHODS - REAL-TIME MODULATION
    // ═══════════════════════════════════════════════════════════════════════

    function setFilterCutoff(value) {
        // value: 0-1
        const freq = CONFIG.filterRange.min +
            (value * (CONFIG.filterRange.max - CONFIG.filterRange.min));

        activeVoices.forEach(active => {
            active.voice.filter.frequency.setTargetAtTime(
                freq,
                audioContext.currentTime,
                0.05
            );
        });
    }

    function setFilterResonance(value) {
        // value: 0-1, maps to Q 0.5-20
        const Q = 0.5 + value * 19.5;

        activeVoices.forEach(active => {
            active.voice.filter.Q.setTargetAtTime(
                Q,
                audioContext.currentTime,
                0.05
            );
        });
    }

    function setReverbMix(value) {
        // value: 0-1
        reverbSend.gain.setTargetAtTime(value, audioContext.currentTime, 0.1);

        activeVoices.forEach(active => {
            active.voice.reverbGain.gain.setTargetAtTime(
                value,
                audioContext.currentTime,
                0.1
            );
        });
    }

    function setDelayMix(value) {
        // value: 0-1
        delaySend.gain.setTargetAtTime(value, audioContext.currentTime, 0.1);

        activeVoices.forEach(active => {
            active.voice.delayGain.gain.setTargetAtTime(
                value,
                audioContext.currentTime,
                0.1
            );
        });
    }

    function setDelayTime(value) {
        // value in seconds
        if (delayNode) {
            delayNode.delayTime.setTargetAtTime(value, audioContext.currentTime, 0.1);
        }
    }

    function setMasterGain(value) {
        if (masterGain) {
            masterGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.1);
        }
    }

    function modulateVoices(param, value) {
        activeVoices.forEach(active => {
            switch (param) {
                case 'detune':
                    active.voice.oscillators.forEach(o => {
                        o.osc.detune.setTargetAtTime(
                            o.detune + value,
                            audioContext.currentTime,
                            0.05
                        );
                    });
                    break;

                case 'gain':
                    active.voice.output.gain.setTargetAtTime(
                        active.voice.velocity * value,
                        audioContext.currentTime,
                        0.05
                    );
                    break;
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC METHODS - QUERY
    // ═══════════════════════════════════════════════════════════════════════

    function getPadTypes() {
        return Object.keys(PAD_TYPES);
    }

    function getPadsByEra(era) {
        return Object.entries(PAD_TYPES)
            .filter(([_, def]) => def.era === era)
            .map(([name, _]) => name);
    }

    function getChordTypes() {
        return Object.keys(CHORD_TYPES);
    }

    function getVoicingTypes() {
        return Object.keys(VOICING_PATTERNS);
    }

    function getActiveVoiceCount() {
        return activeVoices.size;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DRONE SYSTEM
    // ═══════════════════════════════════════════════════════════════════════

    let activeDrone = null;

    function startDrone(padType, frequency, velocity = 0.5) {
        if (activeDrone) {
            stopDrone();
        }

        activeDrone = {
            voiceId: playPad(padType, frequency, velocity),
            padType,
            frequency,
            velocity
        };

        return activeDrone.voiceId;
    }

    function stopDrone() {
        if (activeDrone) {
            stopPad(activeDrone.voiceId);
            activeDrone = null;
        }
    }

    function morphDrone(targetPadType, duration = 2.0) {
        if (!activeDrone) return;

        const currentVoice = activeVoices.get(activeDrone.voiceId);
        if (!currentVoice) return;

        // Crossfade to new drone
        const newVoiceId = playPad(targetPadType, activeDrone.frequency, 0);
        const newVoice = activeVoices.get(newVoiceId);

        if (!newVoice) return;

        const now = audioContext.currentTime;

        // Fade out old
        currentVoice.voice.output.gain.setTargetAtTime(0, now, duration / 3);

        // Fade in new
        newVoice.voice.output.gain.setTargetAtTime(
            activeDrone.velocity,
            now,
            duration / 3
        );

        // Update reference
        setTimeout(() => {
            stopPad(activeDrone.voiceId);
            activeDrone.voiceId = newVoiceId;
            activeDrone.padType = targetPadType;
        }, duration * 1000);
    }

    function shiftDroneFrequency(targetFrequency, duration = 1.0) {
        if (!activeDrone) return;

        const currentVoice = activeVoices.get(activeDrone.voiceId);
        if (!currentVoice) return;

        const ratio = targetFrequency / activeDrone.frequency;
        const cents = Math.log2(ratio) * 1200;

        currentVoice.voice.oscillators.forEach(o => {
            o.osc.detune.linearRampToValueAtTime(
                o.detune + cents,
                audioContext.currentTime + duration
            );
        });

        activeDrone.frequency = targetFrequency;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHORD PROGRESSION SYSTEM
    // ═══════════════════════════════════════════════════════════════════════

    let progressionState = {
        active: false,
        currentChord: null,
        voiceIds: [],
        padType: 'analog_pad',
        voicing: 'close',
        root: 220
    };

    function startProgression(padType, root = 220, voicing = 'close') {
        progressionState = {
            active: true,
            currentChord: null,
            voiceIds: [],
            padType,
            voicing,
            root
        };
    }

    function playProgressionChord(chordType, velocity = 0.8) {
        if (!progressionState.active) return [];

        // Release previous chord
        if (progressionState.voiceIds.length > 0) {
            stopChord(progressionState.voiceIds);
        }

        // Play new chord
        progressionState.voiceIds = playChord(
            'progression',
            progressionState.padType,
            progressionState.root,
            chordType,
            progressionState.voicing,
            velocity
        );

        progressionState.currentChord = chordType;

        return progressionState.voiceIds;
    }

    function transposeProgression(semitones) {
        progressionState.root *= Math.pow(2, semitones / 12);

        if (progressionState.currentChord) {
            playProgressionChord(progressionState.currentChord);
        }
    }

    function stopProgression() {
        if (progressionState.voiceIds.length > 0) {
            stopChord(progressionState.voiceIds);
        }
        progressionState.active = false;
        progressionState.voiceIds = [];
        progressionState.currentChord = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE-REACTIVE METHODS
    // ═══════════════════════════════════════════════════════════════════════

    function reactToZone(zone, intensity = 1.0) {
        // Modulate based on zone position
        const zoneEffects = {
            'top-left': { filter: 0.3, reverb: 0.8 },
            'top-center': { filter: 0.5, reverb: 0.6 },
            'top-right': { filter: 0.7, reverb: 0.4 },
            'center-left': { filter: 0.4, reverb: 0.5 },
            'center': { filter: 0.5, reverb: 0.5 },
            'center-right': { filter: 0.6, reverb: 0.5 },
            'bottom-left': { filter: 0.2, reverb: 0.7 },
            'bottom-center': { filter: 0.3, reverb: 0.6 },
            'bottom-right': { filter: 0.4, reverb: 0.5 }
        };

        const effects = zoneEffects[zone] || zoneEffects.center;

        setFilterCutoff(effects.filter * intensity);
        setReverbMix(effects.reverb * intensity);
    }

    function getZonePadSuggestion(zone, era) {
        const suggestions = {
            genesis: {
                'center': 'void_drone',
                'top-center': 'first_light',
                'top-left': 'shimmer_pad',
                'top-right': 'overtone_cloud',
                default: 'void_drone'
            },
            primordial: {
                'center': 'breath_texture',
                'top-center': 'wind_pad',
                'bottom-center': 'earth_hum',
                'center-left': 'water_resonance',
                'center-right': 'cave_echo',
                default: 'breath_texture'
            },
            tribal: {
                'center': 'ritual_drone',
                'top-center': 'chant_pad',
                'bottom-center': 'fire_texture',
                'center-left': 'night_pad',
                'center-right': 'spirit_voice',
                default: 'ritual_drone'
            },
            sacred: {
                'center': 'organ_pad',
                'top-center': 'choir_pad',
                'bottom-center': 'string_pad',
                'center-left': 'glass_harmonica',
                'center-right': 'bell_pad',
                default: 'organ_pad'
            },
            modern: {
                'center': 'analog_pad',
                'top-center': 'supersaw_pad',
                'bottom-center': 'dark_pad',
                'top-left': 'digital_pad',
                'top-right': 'ambient_pad',
                'bottom-left': 'warm_pad',
                'bottom-right': 'texture_pad',
                default: 'analog_pad'
            }
        };

        const eraSuggestions = suggestions[era] || suggestions.modern;
        return eraSuggestions[zone] || eraSuggestions.default;
    }

    function getZoneChordSuggestion(zone) {
        const chordMap = {
            'top-left': 'maj7',
            'top-center': 'major',
            'top-right': 'add9',
            'center-left': 'min7',
            'center': 'power',
            'center-right': 'sus4',
            'bottom-left': 'minor',
            'bottom-center': 'dom7',
            'bottom-right': 'min7b5'
        };

        return chordMap[zone] || 'power';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // Initialization
        init,

        // Pad control
        playPad,
        stopPad,
        playChord,
        stopChord,
        stopAll,

        // Real-time modulation
        setFilterCutoff,
        setFilterResonance,
        setReverbMix,
        setDelayMix,
        setDelayTime,
        setMasterGain,
        modulateVoices,

        // Query
        getPadTypes,
        getPadsByEra,
        getChordTypes,
        getVoicingTypes,
        getActiveVoiceCount,

        // Drone system
        startDrone,
        stopDrone,
        morphDrone,
        shiftDroneFrequency,

        // Chord progression
        startProgression,
        playProgressionChord,
        transposeProgression,
        stopProgression,

        // Zone reactive
        reactToZone,
        getZonePadSuggestion,
        getZoneChordSuggestion,

        // Configuration
        CONFIG,
        PAD_TYPES,
        CHORD_TYPES,
        VOICING_PATTERNS
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpHarmony;
}
