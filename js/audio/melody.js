/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - MELODY & LEAD SYNTHESIS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Comprehensive lead, melody, and monophonic synthesis.
 * From primordial tones to modern synth leads with full expression control.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpMelody = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        maxVoices: 8,
        defaultPortamento: 0.05,
        maxPortamento: 0.5,
        vibratoRate: 5.0,
        vibratoDepth: 20,
        bendRange: 200,  // cents
        filterRange: { min: 50, max: 18000 },
        velocityCurve: 0.7  // 0-1, lower = more linear
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LEAD TYPES
    // ═══════════════════════════════════════════════════════════════════════

    const LEAD_TYPES = {
        // ─────────────────────────────────────────────────────────────────
        // GENESIS ERA - Pure tones
        // ─────────────────────────────────────────────────────────────────

        primordial_tone: {
            name: 'Primordial Tone',
            era: 'genesis',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.8 },
                { type: 'sine', detune: 1200, gain: 0.15 }  // Octave overtone
            ],
            filter: { type: 'lowpass', frequency: 2000, Q: 1, envelope: 0.3 },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.8 },
            vibrato: { rate: 4, depth: 10, delay: 0.5 },
            portamento: 0.1,
            effects: { reverb: 0.5, delay: 0.2 }
        },

        first_voice: {
            name: 'First Voice',
            era: 'genesis',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.6 },
                { type: 'triangle', detune: 5, gain: 0.3 }
            ],
            filter: { type: 'bandpass', frequency: 1200, Q: 3, envelope: 0.4 },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.6 },
            vibrato: { rate: 5, depth: 15, delay: 0.3 },
            portamento: 0.08,
            effects: { reverb: 0.6, delay: 0.3 }
        },

        ethereal_whistle: {
            name: 'Ethereal Whistle',
            era: 'genesis',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.5 },
                { type: 'sine', detune: 1200, gain: 0.25 },
                { type: 'sine', detune: 1902, gain: 0.15 }
            ],
            noise: { type: 'white', gain: 0.08, filter: { type: 'highpass', frequency: 4000, Q: 1 } },
            filter: { type: 'bandpass', frequency: 2500, Q: 5, envelope: 0.5 },
            envelope: { attack: 0.08, decay: 0.15, sustain: 0.7, release: 0.5 },
            vibrato: { rate: 6, depth: 25, delay: 0.2 },
            portamento: 0.15,
            effects: { reverb: 0.7, delay: 0.4 }
        },

        // ─────────────────────────────────────────────────────────────────
        // PRIMORDIAL ERA - Natural sounds
        // ─────────────────────────────────────────────────────────────────

        breath_lead: {
            name: 'Breath Lead',
            era: 'primordial',
            oscillators: [
                { type: 'triangle', detune: 0, gain: 0.5 },
                { type: 'sine', detune: -5, gain: 0.3 }
            ],
            noise: { type: 'pink', gain: 0.2, filter: { type: 'bandpass', frequency: 1000, Q: 2 } },
            filter: { type: 'lowpass', frequency: 1500, Q: 4, envelope: 0.6 },
            envelope: { attack: 0.12, decay: 0.25, sustain: 0.5, release: 0.7 },
            vibrato: { rate: 4, depth: 12, delay: 0.4 },
            portamento: 0.1,
            effects: { reverb: 0.5, delay: 0.2 }
        },

        wind_voice: {
            name: 'Wind Voice',
            era: 'primordial',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.4 },
                { type: 'triangle', detune: 7, gain: 0.25 }
            ],
            noise: { type: 'white', gain: 0.25, filter: { type: 'bandpass', frequency: 2000, Q: 3 } },
            filter: { type: 'bandpass', frequency: 1800, Q: 5, envelope: 0.7 },
            envelope: { attack: 0.15, decay: 0.3, sustain: 0.4, release: 0.9 },
            vibrato: { rate: 3, depth: 20, delay: 0.3 },
            portamento: 0.12,
            effects: { reverb: 0.65, delay: 0.35 }
        },

        water_song: {
            name: 'Water Song',
            era: 'primordial',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.55 },
                { type: 'sine', detune: 702, gain: 0.2 },  // Fifth
                { type: 'triangle', detune: 1200, gain: 0.15 }
            ],
            filter: { type: 'lowpass', frequency: 2500, Q: 8, envelope: 0.8 },
            envelope: { attack: 0.02, decay: 0.5, sustain: 0.3, release: 1.2 },
            vibrato: { rate: 5, depth: 30, delay: 0.1 },
            portamento: 0.05,
            effects: { reverb: 0.75, delay: 0.5 }
        },

        bird_call: {
            name: 'Bird Call',
            era: 'primordial',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.6 },
                { type: 'sine', detune: 1200, gain: 0.25 }
            ],
            filter: { type: 'bandpass', frequency: 3000, Q: 4, envelope: 0.9 },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 },
            vibrato: { rate: 12, depth: 50, delay: 0 },
            portamento: 0,
            pitchEnvelope: { depth: 400, decay: 0.1 },
            effects: { reverb: 0.5, delay: 0.3 }
        },

        // ─────────────────────────────────────────────────────────────────
        // TRIBAL ERA - Ritualistic voices
        // ─────────────────────────────────────────────────────────────────

        chant_voice: {
            name: 'Chant Voice',
            era: 'tribal',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.15 },
                { type: 'sawtooth', detune: 5, gain: 0.15 },
                { type: 'sine', detune: 0, gain: 0.35 }
            ],
            formant: { vowels: ['ah', 'oh'], morphRate: 0.5 },
            filter: { type: 'lowpass', frequency: 2000, Q: 3, envelope: 0.5 },
            envelope: { attack: 0.08, decay: 0.2, sustain: 0.65, release: 0.6 },
            vibrato: { rate: 5, depth: 18, delay: 0.25 },
            portamento: 0.08,
            effects: { reverb: 0.55, delay: 0.2 }
        },

        flute_primitive: {
            name: 'Primitive Flute',
            era: 'tribal',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.5 },
                { type: 'triangle', detune: 3, gain: 0.25 }
            ],
            noise: { type: 'white', gain: 0.1, filter: { type: 'highpass', frequency: 3000, Q: 1 } },
            filter: { type: 'lowpass', frequency: 3500, Q: 2, envelope: 0.3 },
            envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.4 },
            vibrato: { rate: 5.5, depth: 22, delay: 0.15 },
            portamento: 0.06,
            effects: { reverb: 0.5, delay: 0.25 }
        },

        horn_call: {
            name: 'Horn Call',
            era: 'tribal',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.2 },
                { type: 'square', detune: 0, gain: 0.1 },
                { type: 'sine', detune: -1200, gain: 0.2 }
            ],
            filter: { type: 'lowpass', frequency: 1200, Q: 2, envelope: 0.6 },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.8 },
            vibrato: { rate: 4, depth: 15, delay: 0.5 },
            portamento: 0.15,
            effects: { reverb: 0.6, delay: 0.3 }
        },

        spirit_whistle: {
            name: 'Spirit Whistle',
            era: 'tribal',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.45 },
                { type: 'sine', detune: 1200, gain: 0.2 },
                { type: 'sine', detune: 702, gain: 0.15 }
            ],
            noise: { type: 'white', gain: 0.12, filter: { type: 'bandpass', frequency: 5000, Q: 3 } },
            filter: { type: 'bandpass', frequency: 4000, Q: 6, envelope: 0.4 },
            envelope: { attack: 0.02, decay: 0.15, sustain: 0.5, release: 0.7 },
            vibrato: { rate: 7, depth: 35, delay: 0.1 },
            portamento: 0.03,
            effects: { reverb: 0.7, delay: 0.45 }
        },

        // ─────────────────────────────────────────────────────────────────
        // SACRED ERA - Harmonic leads
        // ─────────────────────────────────────────────────────────────────

        organ_lead: {
            name: 'Organ Lead',
            era: 'sacred',
            oscillators: [
                { type: 'sine', detune: -1200, gain: 0.3 },
                { type: 'sine', detune: 0, gain: 0.4 },
                { type: 'sine', detune: 1200, gain: 0.2 },
                { type: 'sine', detune: 1902, gain: 0.1 }
            ],
            filter: { type: 'lowpass', frequency: 4000, Q: 0.7, envelope: 0.2 },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.5 },
            vibrato: { rate: 6, depth: 10, delay: 0.3 },
            portamento: 0.02,
            effects: { reverb: 0.6, delay: 0.15 }
        },

        choir_lead: {
            name: 'Choir Lead',
            era: 'sacred',
            oscillators: [
                { type: 'sawtooth', detune: -5, gain: 0.1 },
                { type: 'sawtooth', detune: 0, gain: 0.12 },
                { type: 'sawtooth', detune: 5, gain: 0.1 },
                { type: 'sine', detune: 0, gain: 0.25 }
            ],
            formant: { vowels: ['ah', 'oh', 'ee'], morphRate: 0.3 },
            filter: { type: 'lowpass', frequency: 3000, Q: 2, envelope: 0.4 },
            envelope: { attack: 0.15, decay: 0.3, sustain: 0.7, release: 0.8 },
            vibrato: { rate: 5, depth: 20, delay: 0.4 },
            portamento: 0.1,
            effects: { reverb: 0.7, delay: 0.25 }
        },

        string_lead: {
            name: 'String Lead',
            era: 'sacred',
            oscillators: [
                { type: 'sawtooth', detune: -8, gain: 0.15 },
                { type: 'sawtooth', detune: 0, gain: 0.18 },
                { type: 'sawtooth', detune: 8, gain: 0.15 }
            ],
            filter: { type: 'lowpass', frequency: 4500, Q: 1.5, envelope: 0.3 },
            envelope: { attack: 0.12, decay: 0.25, sustain: 0.7, release: 0.6 },
            vibrato: { rate: 5.5, depth: 15, delay: 0.35 },
            portamento: 0.08,
            effects: { reverb: 0.55, delay: 0.2 }
        },

        bell_lead: {
            name: 'Bell Lead',
            era: 'sacred',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.45 },
                { type: 'sine', detune: 1200, gain: 0.25 },
                { type: 'sine', detune: 2400, gain: 0.15 },
                { type: 'sine', detune: 3102, gain: 0.08 }  // Non-harmonic
            ],
            filter: { type: 'highpass', frequency: 300, Q: 0.7, envelope: 0.2 },
            envelope: { attack: 0.005, decay: 1.5, sustain: 0.1, release: 2.0 },
            vibrato: { rate: 0, depth: 0, delay: 0 },
            portamento: 0,
            effects: { reverb: 0.8, delay: 0.5 }
        },

        flute_sacred: {
            name: 'Sacred Flute',
            era: 'sacred',
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.55 },
                { type: 'triangle', detune: 5, gain: 0.2 },
                { type: 'sine', detune: 1200, gain: 0.12 }
            ],
            noise: { type: 'white', gain: 0.06, filter: { type: 'highpass', frequency: 5000, Q: 1 } },
            filter: { type: 'lowpass', frequency: 5000, Q: 1.5, envelope: 0.25 },
            envelope: { attack: 0.06, decay: 0.12, sustain: 0.75, release: 0.45 },
            vibrato: { rate: 5, depth: 18, delay: 0.2 },
            portamento: 0.04,
            effects: { reverb: 0.6, delay: 0.3 }
        },

        // ─────────────────────────────────────────────────────────────────
        // MODERN ERA - Synth leads
        // ─────────────────────────────────────────────────────────────────

        saw_lead: {
            name: 'Saw Lead',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: -12, gain: 0.2 },
                { type: 'sawtooth', detune: 0, gain: 0.25 },
                { type: 'sawtooth', detune: 12, gain: 0.2 }
            ],
            filter: { type: 'lowpass', frequency: 3000, Q: 4, envelope: 0.7 },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
            vibrato: { rate: 5, depth: 15, delay: 0.3 },
            portamento: 0.03,
            effects: { reverb: 0.35, delay: 0.25 }
        },

        square_lead: {
            name: 'Square Lead',
            era: 'modern',
            oscillators: [
                { type: 'square', detune: 0, gain: 0.25 },
                { type: 'square', detune: -1200, gain: 0.15 }
            ],
            filter: { type: 'lowpass', frequency: 2500, Q: 5, envelope: 0.6 },
            envelope: { attack: 0.005, decay: 0.15, sustain: 0.7, release: 0.25 },
            vibrato: { rate: 5.5, depth: 12, delay: 0.25 },
            portamento: 0.02,
            pwm: { rate: 0.5, depth: 0.3 },
            effects: { reverb: 0.3, delay: 0.2 }
        },

        supersaw_lead: {
            name: 'Supersaw Lead',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: -25, gain: 0.12 },
                { type: 'sawtooth', detune: -12, gain: 0.15 },
                { type: 'sawtooth', detune: 0, gain: 0.18 },
                { type: 'sawtooth', detune: 12, gain: 0.15 },
                { type: 'sawtooth', detune: 25, gain: 0.12 },
                { type: 'sawtooth', detune: -1200, gain: 0.1 },
                { type: 'sawtooth', detune: 1200, gain: 0.08 }
            ],
            filter: { type: 'lowpass', frequency: 4000, Q: 2, envelope: 0.5 },
            envelope: { attack: 0.01, decay: 0.25, sustain: 0.65, release: 0.35 },
            vibrato: { rate: 5, depth: 10, delay: 0.4 },
            portamento: 0.025,
            effects: { reverb: 0.4, delay: 0.3 }
        },

        acid_lead: {
            name: 'Acid Lead',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.35 }
            ],
            filter: { type: 'lowpass', frequency: 800, Q: 15, envelope: 0.95 },
            envelope: { attack: 0.002, decay: 0.15, sustain: 0.3, release: 0.2 },
            filterEnvelope: { attack: 0.002, decay: 0.3, sustain: 0.2, amount: 6000 },
            vibrato: { rate: 0, depth: 0, delay: 0 },
            portamento: 0.05,
            saturation: { amount: 0.4, type: 'tube' },
            effects: { reverb: 0.2, delay: 0.35 }
        },

        fm_lead: {
            name: 'FM Lead',
            era: 'modern',
            fm: {
                carrierType: 'sine',
                modulatorType: 'sine',
                ratio: 2,
                index: 3,
                indexEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.4 }
            },
            filter: { type: 'lowpass', frequency: 6000, Q: 1, envelope: 0.3 },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
            vibrato: { rate: 5, depth: 12, delay: 0.3 },
            portamento: 0.02,
            effects: { reverb: 0.35, delay: 0.25 }
        },

        sync_lead: {
            name: 'Sync Lead',
            era: 'modern',
            sync: {
                masterType: 'sawtooth',
                slaveType: 'sawtooth',
                ratio: 2.5,
                ratioEnvelope: { attack: 0.01, decay: 0.2, sustain: 1.5, amount: 3 }
            },
            filter: { type: 'lowpass', frequency: 5000, Q: 2, envelope: 0.4 },
            envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.3 },
            vibrato: { rate: 5, depth: 10, delay: 0.25 },
            portamento: 0.02,
            effects: { reverb: 0.3, delay: 0.2 }
        },

        pluck_lead: {
            name: 'Pluck Lead',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.3 },
                { type: 'triangle', detune: 5, gain: 0.2 }
            ],
            filter: { type: 'lowpass', frequency: 1000, Q: 3, envelope: 0.9 },
            filterEnvelope: { attack: 0.001, decay: 0.15, sustain: 0.1, amount: 8000 },
            envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.2 },
            vibrato: { rate: 0, depth: 0, delay: 0 },
            portamento: 0,
            effects: { reverb: 0.35, delay: 0.3 }
        },

        wobble_lead: {
            name: 'Wobble Lead',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.25 },
                { type: 'square', detune: -1200, gain: 0.2 }
            ],
            filter: { type: 'lowpass', frequency: 400, Q: 12, envelope: 0.3 },
            lfo: { rate: 4, depth: 3000, target: 'filter', sync: true },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.3 },
            vibrato: { rate: 0, depth: 0, delay: 0 },
            portamento: 0.03,
            saturation: { amount: 0.3, type: 'soft' },
            effects: { reverb: 0.25, delay: 0.15 }
        },

        chip_lead: {
            name: 'Chip Lead',
            era: 'modern',
            oscillators: [
                { type: 'square', detune: 0, gain: 0.35 }
            ],
            filter: { type: 'lowpass', frequency: 8000, Q: 0.7, envelope: 0.1 },
            envelope: { attack: 0.001, decay: 0.1, sustain: 0.6, release: 0.1 },
            vibrato: { rate: 6, depth: 20, delay: 0.15 },
            portamento: 0,
            arpeggio: { enabled: true, rate: 8, pattern: [0, 12, 7, 12] },
            effects: { reverb: 0.2, delay: 0.25 }
        },

        talk_lead: {
            name: 'Talk Lead',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: -5, gain: 0.15 },
                { type: 'sawtooth', detune: 0, gain: 0.18 },
                { type: 'sawtooth', detune: 5, gain: 0.15 }
            ],
            formant: { vowels: ['ah', 'ee', 'oh', 'oo'], morphRate: 2 },
            filter: { type: 'lowpass', frequency: 3500, Q: 3, envelope: 0.5 },
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.4 },
            vibrato: { rate: 5, depth: 15, delay: 0.3 },
            portamento: 0.05,
            effects: { reverb: 0.4, delay: 0.25 }
        },

        distorted_lead: {
            name: 'Distorted Lead',
            era: 'modern',
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.2 },
                { type: 'square', detune: 7, gain: 0.15 },
                { type: 'sawtooth', detune: -1200, gain: 0.15 }
            ],
            filter: { type: 'lowpass', frequency: 2000, Q: 3, envelope: 0.6 },
            envelope: { attack: 0.005, decay: 0.2, sustain: 0.65, release: 0.3 },
            vibrato: { rate: 5, depth: 12, delay: 0.25 },
            portamento: 0.02,
            saturation: { amount: 0.6, type: 'hard' },
            effects: { reverb: 0.3, delay: 0.2 }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FORMANT DEFINITIONS
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
    // SCALE DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════

    const SCALES = {
        chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10],
        harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
        melodicMinor: [0, 2, 3, 5, 7, 9, 11],
        dorian: [0, 2, 3, 5, 7, 9, 10],
        phrygian: [0, 1, 3, 5, 7, 8, 10],
        lydian: [0, 2, 4, 6, 7, 9, 11],
        mixolydian: [0, 2, 4, 5, 7, 9, 10],
        locrian: [0, 1, 3, 5, 6, 8, 10],
        pentatonicMajor: [0, 2, 4, 7, 9],
        pentatonicMinor: [0, 3, 5, 7, 10],
        blues: [0, 3, 5, 6, 7, 10],
        wholeTone: [0, 2, 4, 6, 8, 10],
        diminished: [0, 2, 3, 5, 6, 8, 9, 11],
        arabic: [0, 1, 4, 5, 7, 8, 11],
        japanese: [0, 1, 5, 7, 8],
        hungarian: [0, 2, 3, 6, 7, 8, 11]
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
    const voiceHistory = [];  // For legato
    let nextVoiceId = 0;

    // Current settings
    let currentLeadType = 'saw_lead';
    let currentScale = 'pentatonicMinor';
    let currentRoot = 440;  // A4
    let currentOctave = 4;
    let portamentoTime = 0.05;
    let monoMode = true;  // Leads are typically mono
    let legatoMode = true;

    // Expression controls
    let pitchBend = 0;  // -1 to 1
    let modWheel = 0;   // 0 to 1
    let aftertouch = 0; // 0 to 1
    let expression = 1; // 0 to 1

    // Vibrato state
    let vibratoLFO = null;
    let vibratoGain = null;

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(ctx) {
        audioContext = ctx;

        // Create master gain
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.8;

        // Create effects
        createEffectsChain();

        // Create global vibrato LFO
        createVibratoLFO();

        // Connect to GumpAudio if available
        if (typeof GumpAudio !== 'undefined' && GumpAudio.getChannelInput) {
            masterGain.connect(GumpAudio.getChannelInput('leads'));
        } else {
            masterGain.connect(audioContext.destination);
        }

        console.log('[GumpMelody] Initialized');
    }

    function createEffectsChain() {
        // Reverb
        reverbSend = audioContext.createGain();
        reverbSend.gain.value = 0.35;

        convolver = audioContext.createConvolver();
        createImpulseResponse();

        reverbSend.connect(convolver);
        convolver.connect(masterGain);

        // Delay
        delaySend = audioContext.createGain();
        delaySend.gain.value = 0.25;

        delayNode = audioContext.createDelay(2.0);
        delayNode.delayTime.value = 0.25;

        const delayFeedback = audioContext.createGain();
        delayFeedback.gain.value = 0.35;

        const delayFilter = audioContext.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 4000;

        delaySend.connect(delayNode);
        delayNode.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayFilter.connect(masterGain);
    }

    function createImpulseResponse() {
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * 2;
        const impulse = audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const decay = Math.exp(-4 * t);
                data[i] = (Math.random() * 2 - 1) * decay * 0.5;
            }
        }

        convolver.buffer = impulse;
    }

    function createVibratoLFO() {
        vibratoLFO = audioContext.createOscillator();
        vibratoLFO.type = 'sine';
        vibratoLFO.frequency.value = CONFIG.vibratoRate;

        vibratoGain = audioContext.createGain();
        vibratoGain.gain.value = 0;  // Will be set per voice

        vibratoLFO.connect(vibratoGain);
        vibratoLFO.start();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOICE CREATION
    // ═══════════════════════════════════════════════════════════════════════

    function createVoice(frequency, leadDef, velocity = 0.8) {
        const voice = {
            id: nextVoiceId++,
            frequency,
            targetFrequency: frequency,
            velocity,
            oscillators: [],
            filter: null,
            output: null,
            noise: null,
            vibratoGain: null,
            vibratoDelay: null,
            saturation: null,
            formants: [],
            dryGain: null,
            reverbGain: null,
            delayGain: null,
            isReleasing: false,
            releaseTime: 0,
            fmModulator: null,
            fmModGain: null
        };

        // Create output
        voice.output = audioContext.createGain();
        voice.output.gain.value = 0;

        // Create oscillators based on lead type
        if (leadDef.fm) {
            createFMVoice(voice, frequency, leadDef, velocity);
        } else if (leadDef.sync) {
            createSyncVoice(voice, frequency, leadDef, velocity);
        } else {
            createStandardVoice(voice, frequency, leadDef, velocity);
        }

        // Create noise if defined
        if (leadDef.noise) {
            voice.noise = createNoiseSource(leadDef.noise);
        }

        // Create filter
        voice.filter = audioContext.createBiquadFilter();
        voice.filter.type = leadDef.filter.type;
        voice.filter.frequency.value = leadDef.filter.frequency;
        voice.filter.Q.value = leadDef.filter.Q;

        // Create vibrato
        if (leadDef.vibrato && leadDef.vibrato.depth > 0) {
            createVoiceVibrato(voice, leadDef.vibrato);
        }

        // Create formant filters if defined
        if (leadDef.formant) {
            createFormantFilters(voice, leadDef.formant);
        }

        // Create saturation if defined
        if (leadDef.saturation) {
            voice.saturation = createSaturation(leadDef.saturation);
        }

        // Create LFO if defined (for wobble etc)
        if (leadDef.lfo) {
            createVoiceLFO(voice, leadDef.lfo);
        }

        // Create effect sends
        voice.dryGain = audioContext.createGain();
        voice.dryGain.gain.value = 1 - leadDef.effects.reverb * 0.5;

        voice.reverbGain = audioContext.createGain();
        voice.reverbGain.gain.value = leadDef.effects.reverb;

        voice.delayGain = audioContext.createGain();
        voice.delayGain.gain.value = leadDef.effects.delay;

        // Connect signal chain
        connectVoiceChain(voice, leadDef);

        return voice;
    }

    function createStandardVoice(voice, frequency, leadDef, velocity) {
        leadDef.oscillators.forEach(oscDef => {
            const osc = audioContext.createOscillator();
            osc.type = oscDef.type;
            osc.frequency.value = frequency * Math.pow(2, oscDef.detune / 1200);

            const oscGain = audioContext.createGain();
            oscGain.gain.value = oscDef.gain * velocity;

            osc.connect(oscGain);
            voice.oscillators.push({ osc, gain: oscGain, detune: oscDef.detune });
        });
    }

    function createFMVoice(voice, frequency, leadDef, velocity) {
        const fm = leadDef.fm;

        // Carrier oscillator
        const carrier = audioContext.createOscillator();
        carrier.type = fm.carrierType;
        carrier.frequency.value = frequency;

        const carrierGain = audioContext.createGain();
        carrierGain.gain.value = velocity * 0.5;

        carrier.connect(carrierGain);

        // Modulator oscillator
        voice.fmModulator = audioContext.createOscillator();
        voice.fmModulator.type = fm.modulatorType;
        voice.fmModulator.frequency.value = frequency * fm.ratio;

        // Modulation depth
        voice.fmModGain = audioContext.createGain();
        voice.fmModGain.gain.value = frequency * fm.index;

        voice.fmModulator.connect(voice.fmModGain);
        voice.fmModGain.connect(carrier.frequency);

        voice.oscillators.push({ osc: carrier, gain: carrierGain, detune: 0 });
    }

    function createSyncVoice(voice, frequency, leadDef, velocity) {
        // Note: Web Audio doesn't natively support oscillator sync
        // We simulate it with a combination of oscillators
        const sync = leadDef.sync;

        const master = audioContext.createOscillator();
        master.type = sync.masterType;
        master.frequency.value = frequency;

        const masterGain = audioContext.createGain();
        masterGain.gain.value = velocity * 0.3;
        master.connect(masterGain);

        const slave = audioContext.createOscillator();
        slave.type = sync.slaveType;
        slave.frequency.value = frequency * sync.ratio;

        const slaveGain = audioContext.createGain();
        slaveGain.gain.value = velocity * 0.4;
        slave.connect(slaveGain);

        voice.oscillators.push(
            { osc: master, gain: masterGain, detune: 0 },
            { osc: slave, gain: slaveGain, detune: 0, isSync: true, ratio: sync.ratio }
        );
    }

    function createVoiceVibrato(voice, vibratoDef) {
        voice.vibratoGain = audioContext.createGain();
        voice.vibratoGain.gain.value = 0;  // Will ramp up after delay

        // Create delay envelope
        voice.vibratoDelay = vibratoDef.delay;

        // Connect to oscillators
        voice.oscillators.forEach(o => {
            vibratoLFO.connect(voice.vibratoGain);
            voice.vibratoGain.connect(o.osc.detune);
        });

        // Store vibrato params
        voice.vibratoParams = vibratoDef;
    }

    function createFormantFilters(voice, formantDef) {
        // Will morph between vowels if multiple defined
        if (Array.isArray(formantDef.vowels)) {
            formantDef.vowels.forEach((vowel, idx) => {
                const formantData = FORMANTS[vowel];
                if (formantData) {
                    const filters = formantData.map(f => {
                        const filter = audioContext.createBiquadFilter();
                        filter.type = 'bandpass';
                        filter.frequency.value = f.freq;
                        filter.Q.value = f.Q;

                        const gain = audioContext.createGain();
                        gain.gain.value = idx === 0 ? f.gain : 0;

                        return { filter, gain, targetFreq: f.freq };
                    });
                    voice.formants.push({ vowel, filters });
                }
            });
        }
    }

    function createVoiceLFO(voice, lfoDef) {
        const lfo = audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = lfoDef.rate;

        const lfoGain = audioContext.createGain();
        lfoGain.gain.value = lfoDef.depth;

        lfo.connect(lfoGain);

        if (lfoDef.target === 'filter') {
            lfoGain.connect(voice.filter.frequency);
        }

        voice.lfo = lfo;
        voice.lfoGain = lfoGain;
    }

    function createNoiseSource(noiseDef) {
        const bufferSize = audioContext.sampleRate * 2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

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
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        let output = source;
        if (noiseDef.filter) {
            const filter = audioContext.createBiquadFilter();
            filter.type = noiseDef.filter.type;
            filter.frequency.value = noiseDef.filter.frequency;
            filter.Q.value = noiseDef.filter.Q;
            source.connect(filter);
            output = filter;
        }

        const gain = audioContext.createGain();
        gain.gain.value = noiseDef.gain;
        output.connect(gain);

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

    function connectVoiceChain(voice, leadDef) {
        // Connect oscillators to filter
        voice.oscillators.forEach(o => {
            o.gain.connect(voice.filter);
        });

        // Connect noise
        if (voice.noise) {
            voice.noise.output.connect(voice.filter);
        }

        let signalPath = voice.filter;

        // Add formants if present
        if (voice.formants.length > 0) {
            const formantMix = audioContext.createGain();
            formantMix.gain.value = 0.5;

            voice.formants.forEach(formantSet => {
                formantSet.filters.forEach(f => {
                    voice.filter.connect(f.filter);
                    f.filter.connect(f.gain);
                    f.gain.connect(formantMix);
                });
            });

            const dryPath = audioContext.createGain();
            dryPath.gain.value = 0.5;
            voice.filter.connect(dryPath);

            const merge = audioContext.createGain();
            formantMix.connect(merge);
            dryPath.connect(merge);
            signalPath = merge;
        }

        // Add saturation
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

    // ═══════════════════════════════════════════════════════════════════════
    // VOICE LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════

    function startVoice(voice, leadDef, when = 0) {
        const now = when || audioContext.currentTime;
        const env = leadDef.envelope;

        // Start oscillators
        voice.oscillators.forEach(o => {
            o.osc.start(now);
        });

        // Start FM modulator
        if (voice.fmModulator) {
            voice.fmModulator.start(now);
        }

        // Start LFO
        if (voice.lfo) {
            voice.lfo.start(now);
        }

        // Start noise
        if (voice.noise) {
            voice.noise.start();
        }

        // Apply amplitude envelope
        voice.output.gain.setValueAtTime(0, now);
        voice.output.gain.linearRampToValueAtTime(voice.velocity * expression, now + env.attack);
        voice.output.gain.linearRampToValueAtTime(
            voice.velocity * expression * env.sustain,
            now + env.attack + env.decay
        );

        // Apply filter envelope
        if (leadDef.filterEnvelope) {
            const fEnv = leadDef.filterEnvelope;
            const startFreq = leadDef.filter.frequency;
            const peakFreq = Math.min(startFreq + fEnv.amount, CONFIG.filterRange.max);

            voice.filter.frequency.setValueAtTime(startFreq, now);
            voice.filter.frequency.linearRampToValueAtTime(peakFreq, now + fEnv.attack);
            voice.filter.frequency.exponentialRampToValueAtTime(
                startFreq + (peakFreq - startFreq) * fEnv.sustain,
                now + fEnv.attack + fEnv.decay
            );
        } else if (leadDef.filter.envelope > 0) {
            const startFreq = leadDef.filter.frequency * 0.3;
            const peakFreq = leadDef.filter.frequency;

            voice.filter.frequency.setValueAtTime(startFreq, now);
            voice.filter.frequency.linearRampToValueAtTime(peakFreq, now + env.attack * leadDef.filter.envelope);
        }

        // Apply FM index envelope
        if (voice.fmModGain && leadDef.fm && leadDef.fm.indexEnvelope) {
            const iEnv = leadDef.fm.indexEnvelope;
            const startIndex = voice.frequency * leadDef.fm.index;
            const peakIndex = startIndex * 1.5;

            voice.fmModGain.gain.setValueAtTime(startIndex, now);
            voice.fmModGain.gain.linearRampToValueAtTime(peakIndex, now + iEnv.attack);
            voice.fmModGain.gain.linearRampToValueAtTime(
                startIndex * iEnv.sustain,
                now + iEnv.attack + iEnv.decay
            );
        }

        // Apply vibrato delay
        if (voice.vibratoGain && voice.vibratoParams) {
            const vib = voice.vibratoParams;
            voice.vibratoGain.gain.setValueAtTime(0, now);
            voice.vibratoGain.gain.setValueAtTime(0, now + vib.delay);
            voice.vibratoGain.gain.linearRampToValueAtTime(vib.depth, now + vib.delay + 0.1);
        }

        // Apply pitch envelope if defined
        if (leadDef.pitchEnvelope) {
            const pEnv = leadDef.pitchEnvelope;
            voice.oscillators.forEach(o => {
                o.osc.detune.setValueAtTime(o.detune + pEnv.depth, now);
                o.osc.detune.exponentialRampToValueAtTime(
                    o.detune + 1,  // Can't go to 0
                    now + pEnv.decay
                );
            });
        }
    }

    function releaseVoice(voice, leadDef) {
        if (voice.isReleasing) return;
        voice.isReleasing = true;

        const now = audioContext.currentTime;
        const release = leadDef.envelope.release;
        voice.releaseTime = now + release;

        // Release amplitude
        voice.output.gain.cancelScheduledValues(now);
        voice.output.gain.setValueAtTime(voice.output.gain.value, now);
        voice.output.gain.linearRampToValueAtTime(0, now + release);

        // Release filter
        voice.filter.frequency.cancelScheduledValues(now);
        voice.filter.frequency.setValueAtTime(voice.filter.frequency.value, now);
        voice.filter.frequency.linearRampToValueAtTime(
            leadDef.filter.frequency * 0.5,
            now + release
        );

        // Fade vibrato
        if (voice.vibratoGain) {
            voice.vibratoGain.gain.cancelScheduledValues(now);
            voice.vibratoGain.gain.linearRampToValueAtTime(0, now + release * 0.5);
        }

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

        if (voice.fmModulator) {
            try { voice.fmModulator.stop(); } catch (e) {}
        }

        if (voice.lfo) {
            try { voice.lfo.stop(); } catch (e) {}
        }

        if (voice.noise) {
            try { voice.noise.stop(); } catch (e) {}
        }
    }

    function glideVoice(voice, newFrequency, leadDef) {
        const now = audioContext.currentTime;
        const glideTime = leadDef.portamento || portamentoTime;

        voice.targetFrequency = newFrequency;

        voice.oscillators.forEach(o => {
            const targetFreq = newFrequency * Math.pow(2, o.detune / 1200);
            o.osc.frequency.cancelScheduledValues(now);
            o.osc.frequency.setValueAtTime(o.osc.frequency.value, now);
            o.osc.frequency.linearRampToValueAtTime(targetFreq, now + glideTime);
        });

        // Update FM modulator if present
        if (voice.fmModulator && leadDef.fm) {
            voice.fmModulator.frequency.cancelScheduledValues(now);
            voice.fmModulator.frequency.setValueAtTime(voice.fmModulator.frequency.value, now);
            voice.fmModulator.frequency.linearRampToValueAtTime(
                newFrequency * leadDef.fm.ratio,
                now + glideTime
            );
        }

        voice.frequency = newFrequency;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC METHODS - NOTE CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function noteOn(frequency, velocity = 0.8, type = null) {
        const leadType = type || currentLeadType;
        const leadDef = LEAD_TYPES[leadType];

        if (!leadDef) {
            console.warn(`[GumpMelody] Unknown lead type: ${leadType}`);
            return null;
        }

        // Apply velocity curve
        velocity = Math.pow(velocity, CONFIG.velocityCurve);

        // Mono mode handling
        if (monoMode && activeVoices.size > 0) {
            const lastVoice = Array.from(activeVoices.values()).pop();
            if (lastVoice && legatoMode && !lastVoice.voice.isReleasing) {
                // Legato - glide to new note
                glideVoice(lastVoice.voice, frequency, leadDef);
                voiceHistory.push({ frequency, velocity, id: lastVoice.voice.id });
                return lastVoice.voice.id;
            } else {
                // Retrigger - stop all and play new
                stopAll();
            }
        }

        // Create and start new voice
        const voice = createVoice(frequency, leadDef, velocity);
        startVoice(voice, leadDef);
        activeVoices.set(voice.id, { voice, leadDef });

        voiceHistory.push({ frequency, velocity, id: voice.id });
        if (voiceHistory.length > 10) voiceHistory.shift();

        return voice.id;
    }

    function noteOff(voiceId = null) {
        if (voiceId !== null) {
            const active = activeVoices.get(voiceId);
            if (active) {
                releaseVoice(active.voice, active.leadDef);
            }
        } else if (monoMode) {
            // In mono mode, release all
            activeVoices.forEach((active) => {
                releaseVoice(active.voice, active.leadDef);
            });
        }
    }

    function stopAll() {
        activeVoices.forEach((active) => {
            releaseVoice(active.voice, active.leadDef);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC METHODS - EXPRESSION CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function setPitchBend(value) {
        // value: -1 to 1
        pitchBend = Math.max(-1, Math.min(1, value));
        const cents = pitchBend * CONFIG.bendRange;

        activeVoices.forEach(active => {
            active.voice.oscillators.forEach(o => {
                o.osc.detune.setTargetAtTime(
                    o.detune + cents,
                    audioContext.currentTime,
                    0.01
                );
            });
        });
    }

    function setModWheel(value) {
        // value: 0 to 1
        modWheel = Math.max(0, Math.min(1, value));

        // Modulate vibrato depth
        activeVoices.forEach(active => {
            if (active.voice.vibratoGain && active.voice.vibratoParams) {
                const baseDepth = active.voice.vibratoParams.depth;
                active.voice.vibratoGain.gain.setTargetAtTime(
                    baseDepth * (1 + modWheel),
                    audioContext.currentTime,
                    0.05
                );
            }
        });
    }

    function setAftertouch(value) {
        // value: 0 to 1
        aftertouch = Math.max(0, Math.min(1, value));

        // Modulate filter and vibrato
        activeVoices.forEach(active => {
            const baseCutoff = active.leadDef.filter.frequency;
            const targetCutoff = baseCutoff * (1 + aftertouch * 0.5);

            active.voice.filter.frequency.setTargetAtTime(
                targetCutoff,
                audioContext.currentTime,
                0.05
            );
        });
    }

    function setExpression(value) {
        // value: 0 to 1
        expression = Math.max(0, Math.min(1, value));

        activeVoices.forEach(active => {
            const targetGain = active.voice.velocity * expression *
                active.leadDef.envelope.sustain;

            active.voice.output.gain.setTargetAtTime(
                targetGain,
                audioContext.currentTime,
                0.05
            );
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC METHODS - SOUND CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function setLeadType(type) {
        if (LEAD_TYPES[type]) {
            currentLeadType = type;
            return true;
        }
        return false;
    }

    function setPortamento(time) {
        portamentoTime = Math.max(0, Math.min(CONFIG.maxPortamento, time));
    }

    function setMonoMode(enabled) {
        monoMode = enabled;
        if (monoMode && activeVoices.size > 1) {
            // Keep only the most recent voice
            const voices = Array.from(activeVoices.entries());
            const lastVoice = voices[voices.length - 1];

            voices.slice(0, -1).forEach(([id, active]) => {
                releaseVoice(active.voice, active.leadDef);
            });
        }
    }

    function setLegatoMode(enabled) {
        legatoMode = enabled;
    }

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
        // value: 0-1
        const Q = 0.5 + value * 20;

        activeVoices.forEach(active => {
            active.voice.filter.Q.setTargetAtTime(
                Q,
                audioContext.currentTime,
                0.05
            );
        });
    }

    function setReverbMix(value) {
        reverbSend.gain.setTargetAtTime(value, audioContext.currentTime, 0.1);
    }

    function setDelayMix(value) {
        delaySend.gain.setTargetAtTime(value, audioContext.currentTime, 0.1);
    }

    function setDelayTime(value) {
        if (delayNode) {
            delayNode.delayTime.setTargetAtTime(value, audioContext.currentTime, 0.1);
        }
    }

    function setMasterGain(value) {
        if (masterGain) {
            masterGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.1);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC METHODS - SCALE & PITCH
    // ═══════════════════════════════════════════════════════════════════════

    function setScale(scaleName) {
        if (SCALES[scaleName]) {
            currentScale = scaleName;
            return true;
        }
        return false;
    }

    function setRoot(frequency) {
        currentRoot = frequency;
    }

    function setOctave(octave) {
        currentOctave = Math.max(0, Math.min(8, octave));
    }

    function getScaleNote(degree, octaveOffset = 0) {
        const scale = SCALES[currentScale] || SCALES.chromatic;
        const scaleLength = scale.length;

        const octaves = Math.floor(degree / scaleLength);
        const noteInScale = degree % scaleLength;
        const semitones = scale[noteInScale] + (octaves * 12);

        const baseFreq = currentRoot * Math.pow(2, (currentOctave - 4 + octaveOffset));
        return baseFreq * Math.pow(2, semitones / 12);
    }

    function quantizeToScale(frequency) {
        const scale = SCALES[currentScale] || SCALES.chromatic;
        const semitones = 12 * Math.log2(frequency / currentRoot);
        const octave = Math.floor(semitones / 12);
        const noteInOctave = semitones - (octave * 12);

        // Find closest scale degree
        let closestDegree = scale[0];
        let minDistance = Math.abs(noteInOctave - scale[0]);

        scale.forEach(degree => {
            const distance = Math.abs(noteInOctave - degree);
            if (distance < minDistance) {
                minDistance = distance;
                closestDegree = degree;
            }
        });

        return currentRoot * Math.pow(2, (octave * 12 + closestDegree) / 12);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC METHODS - QUERY
    // ═══════════════════════════════════════════════════════════════════════

    function getLeadTypes() {
        return Object.keys(LEAD_TYPES);
    }

    function getLeadsByEra(era) {
        return Object.entries(LEAD_TYPES)
            .filter(([_, def]) => def.era === era)
            .map(([name, _]) => name);
    }

    function getScales() {
        return Object.keys(SCALES);
    }

    function getActiveVoiceCount() {
        return activeVoices.size;
    }

    function getCurrentState() {
        return {
            leadType: currentLeadType,
            scale: currentScale,
            root: currentRoot,
            octave: currentOctave,
            monoMode,
            legatoMode,
            portamento: portamentoTime,
            pitchBend,
            modWheel,
            aftertouch,
            expression,
            activeVoices: activeVoices.size
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE-REACTIVE METHODS
    // ═══════════════════════════════════════════════════════════════════════

    function reactToZone(zone, intensity = 1.0) {
        const zoneEffects = {
            'top-left': { filter: 0.7, vibrato: 0.3 },
            'top-center': { filter: 0.8, vibrato: 0.5 },
            'top-right': { filter: 0.9, vibrato: 0.4 },
            'center-left': { filter: 0.5, vibrato: 0.6 },
            'center': { filter: 0.6, vibrato: 0.5 },
            'center-right': { filter: 0.7, vibrato: 0.4 },
            'bottom-left': { filter: 0.3, vibrato: 0.7 },
            'bottom-center': { filter: 0.4, vibrato: 0.6 },
            'bottom-right': { filter: 0.5, vibrato: 0.5 }
        };

        const effects = zoneEffects[zone] || zoneEffects.center;

        setFilterCutoff(effects.filter * intensity);
        setModWheel(effects.vibrato * intensity);
    }

    function getZoneLeadSuggestion(zone, era) {
        const suggestions = {
            genesis: {
                'center': 'primordial_tone',
                'top-center': 'first_voice',
                'top-left': 'ethereal_whistle',
                default: 'primordial_tone'
            },
            primordial: {
                'center': 'breath_lead',
                'top-center': 'wind_voice',
                'bottom-center': 'water_song',
                'top-right': 'bird_call',
                default: 'breath_lead'
            },
            tribal: {
                'center': 'chant_voice',
                'top-center': 'flute_primitive',
                'bottom-center': 'horn_call',
                'center-right': 'spirit_whistle',
                default: 'chant_voice'
            },
            sacred: {
                'center': 'organ_lead',
                'top-center': 'choir_lead',
                'bottom-center': 'string_lead',
                'top-left': 'bell_lead',
                'top-right': 'flute_sacred',
                default: 'organ_lead'
            },
            modern: {
                'center': 'saw_lead',
                'top-center': 'supersaw_lead',
                'bottom-center': 'acid_lead',
                'top-left': 'fm_lead',
                'top-right': 'pluck_lead',
                'bottom-left': 'wobble_lead',
                'bottom-right': 'distorted_lead',
                'center-left': 'square_lead',
                'center-right': 'chip_lead',
                default: 'saw_lead'
            }
        };

        const eraSuggestions = suggestions[era] || suggestions.modern;
        return eraSuggestions[zone] || eraSuggestions.default;
    }

    function getZoneScaleSuggestion(zone) {
        const scaleMap = {
            'top-left': 'lydian',
            'top-center': 'major',
            'top-right': 'mixolydian',
            'center-left': 'dorian',
            'center': 'pentatonicMinor',
            'center-right': 'phrygian',
            'bottom-left': 'minor',
            'bottom-center': 'harmonicMinor',
            'bottom-right': 'blues'
        };

        return scaleMap[zone] || 'pentatonicMinor';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ARPEGGIATOR
    // ═══════════════════════════════════════════════════════════════════════

    let arpState = {
        active: false,
        pattern: [0, 4, 7, 12],
        rate: 8,  // notes per beat
        direction: 'up',  // up, down, updown, random
        octaves: 1,
        currentIndex: 0,
        intervalId: null,
        heldNotes: [],
        currentNote: null
    };

    function startArpeggiator(pattern = null, rate = 8, direction = 'up') {
        if (arpState.active) stopArpeggiator();

        arpState.active = true;
        arpState.pattern = pattern || arpState.pattern;
        arpState.rate = rate;
        arpState.direction = direction;
        arpState.currentIndex = 0;

        const intervalMs = (60000 / (GumpState?.get('music.bpm') || 120)) / (rate / 4);

        arpState.intervalId = setInterval(() => {
            if (arpState.heldNotes.length === 0) return;

            // Release previous note
            if (arpState.currentNote) {
                noteOff(arpState.currentNote);
            }

            // Calculate next note
            const baseNote = arpState.heldNotes[0];
            const patternLength = arpState.pattern.length;
            let patternIndex = arpState.currentIndex % patternLength;

            switch (arpState.direction) {
                case 'down':
                    patternIndex = patternLength - 1 - patternIndex;
                    break;
                case 'updown':
                    const cycle = patternLength * 2 - 2;
                    const pos = arpState.currentIndex % cycle;
                    patternIndex = pos < patternLength ? pos : cycle - pos;
                    break;
                case 'random':
                    patternIndex = Math.floor(Math.random() * patternLength);
                    break;
            }

            const semitones = arpState.pattern[patternIndex];
            const frequency = baseNote * Math.pow(2, semitones / 12);

            arpState.currentNote = noteOn(frequency, 0.7);
            arpState.currentIndex++;

        }, intervalMs);
    }

    function stopArpeggiator() {
        if (arpState.intervalId) {
            clearInterval(arpState.intervalId);
            arpState.intervalId = null;
        }

        if (arpState.currentNote) {
            noteOff(arpState.currentNote);
            arpState.currentNote = null;
        }

        arpState.active = false;
        arpState.currentIndex = 0;
    }

    function arpNoteOn(frequency) {
        arpState.heldNotes.push(frequency);
    }

    function arpNoteOff(frequency) {
        const index = arpState.heldNotes.indexOf(frequency);
        if (index > -1) {
            arpState.heldNotes.splice(index, 1);
        }

        if (arpState.heldNotes.length === 0) {
            if (arpState.currentNote) {
                noteOff(arpState.currentNote);
                arpState.currentNote = null;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // Initialization
        init,

        // Note control
        noteOn,
        noteOff,
        stopAll,

        // Expression
        setPitchBend,
        setModWheel,
        setAftertouch,
        setExpression,

        // Sound control
        setLeadType,
        setPortamento,
        setMonoMode,
        setLegatoMode,
        setFilterCutoff,
        setFilterResonance,
        setReverbMix,
        setDelayMix,
        setDelayTime,
        setMasterGain,

        // Scale & pitch
        setScale,
        setRoot,
        setOctave,
        getScaleNote,
        quantizeToScale,

        // Query
        getLeadTypes,
        getLeadsByEra,
        getScales,
        getActiveVoiceCount,
        getCurrentState,

        // Zone reactive
        reactToZone,
        getZoneLeadSuggestion,
        getZoneScaleSuggestion,

        // Arpeggiator
        startArpeggiator,
        stopArpeggiator,
        arpNoteOn,
        arpNoteOff,

        // Configuration
        CONFIG,
        LEAD_TYPES,
        SCALES
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpMelody;
}
