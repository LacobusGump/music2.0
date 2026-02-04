// ═══════════════════════════════════════════════════════════════════════════
// GUMP UNLOCK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
//
// Manages the progression system - what gets unlocked, when, and how.
// Each unlock corresponds to a musical element or capability.
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpUnlocks = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // UNLOCK DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════

    const UNLOCKS = {
        // ═══════════════════════════════════════════════════════════════════
        // ERA 1: GENESIS - The First Sounds
        // ═══════════════════════════════════════════════════════════════════

        // Base unlocks (dwell-based)
        genesis_void: {
            id: 'genesis_void',
            era: 'genesis',
            name: 'The Void',
            description: 'Silence with potential. The space before sound.',
            category: 'foundation',
            automatic: true, // Unlocked by default
            sound: {
                type: 'ambient',
                freq: 18,
                waveform: 'sine',
                volume: 0.15,
            },
            visual: {
                color: '#000000',
                glow: 0.1,
            },
        },

        genesis_first_light: {
            id: 'genesis_first_light',
            era: 'genesis',
            name: 'First Light',
            description: 'The first vibration. A single pure tone emerges.',
            category: 'tone',
            trigger: { zone: 'center', dwell: 2.0 },
            sound: {
                type: 'tone',
                freq: 55,  // A1
                waveform: 'sine',
                volume: 0.3,
                envelope: { attack: 2, decay: 0.5, sustain: 0.8, release: 3 },
            },
            visual: {
                color: '#ffffff',
                glow: 0.4,
                particle: 'pulse',
            },
        },

        genesis_first_shadow: {
            id: 'genesis_first_shadow',
            era: 'genesis',
            name: 'First Shadow',
            description: 'The octave below. Depth enters existence.',
            category: 'tone',
            trigger: { zone: 's', dwell: 2.0 },
            requires: ['genesis_first_light'],
            sound: {
                type: 'tone',
                freq: 27.5,  // A0
                waveform: 'sine',
                volume: 0.35,
                envelope: { attack: 1.5, decay: 0.3, sustain: 0.9, release: 4 },
            },
            visual: {
                color: '#1a0033',
                glow: 0.3,
            },
        },

        genesis_breath: {
            id: 'genesis_breath',
            era: 'genesis',
            name: 'The Breath',
            description: 'Slow oscillation. The universe breathes.',
            category: 'modulation',
            trigger: { zone: 'nw', dwell: 1.5 },
            sound: {
                type: 'lfo',
                target: 'volume',
                rate: 0.1,
                depth: 0.3,
            },
            visual: {
                effect: 'breathe',
                rate: 0.1,
            },
        },

        genesis_overtones: {
            id: 'genesis_overtones',
            era: 'genesis',
            name: 'Overtones',
            description: 'The harmonic series blooms. Light diffracts into color.',
            category: 'harmony',
            trigger: { zone: 'n', dwell: 2.5 },
            requires: ['genesis_first_light'],
            sound: {
                type: 'harmonics',
                baseFreq: 55,
                harmonics: [2, 3, 4, 5, 6, 7, 8],
                volumes: [0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04],
                envelope: { attack: 3, decay: 1, sustain: 0.6, release: 4 },
            },
            visual: {
                color: '#ffd700',
                glow: 0.5,
                particle: 'shimmer',
            },
        },

        genesis_sub: {
            id: 'genesis_sub',
            era: 'genesis',
            name: 'The Deep',
            description: 'Sub-bass frequencies. Felt more than heard.',
            category: 'bass',
            trigger: { zone: 'sw', dwell: 2.0 },
            sound: {
                type: 'sub',
                freq: 27.5,
                waveform: 'sine',
                volume: 0.4,
                filter: { type: 'lowpass', freq: 60 },
            },
            visual: {
                color: '#330066',
                screenShake: 0.2,
            },
        },

        genesis_brightness: {
            id: 'genesis_brightness',
            era: 'genesis',
            name: 'Brightness',
            description: 'The filter opens. Light enters.',
            category: 'filter',
            trigger: { zone: 'e', dwell: 1.0 },
            sound: {
                type: 'filter_mod',
                target: 'cutoff',
                direction: 'up',
                amount: 2000,
            },
            visual: {
                brightness: 1.2,
            },
        },

        genesis_darkness: {
            id: 'genesis_darkness',
            era: 'genesis',
            name: 'Darkness',
            description: 'The filter closes. Shadow grows.',
            category: 'filter',
            trigger: { zone: 'w', dwell: 1.0 },
            sound: {
                type: 'filter_mod',
                target: 'cutoff',
                direction: 'down',
                amount: 1000,
            },
            visual: {
                brightness: 0.7,
            },
        },

        // Pattern unlocks
        genesis_shimmer: {
            id: 'genesis_shimmer',
            era: 'genesis',
            name: 'The Shimmer',
            description: 'High ethereal tones dance like starlight.',
            category: 'texture',
            trigger: { pattern: 'path_vertical' },
            requires: ['genesis_overtones'],
            sound: {
                type: 'shimmer',
                freqs: [880, 1320, 1760, 2200],
                detuneRange: 10,
                volume: 0.08,
            },
            visual: {
                particle: 'sparkle',
                color: '#e0e0ff',
            },
        },

        genesis_pulse: {
            id: 'genesis_pulse',
            era: 'genesis',
            name: 'First Pulse',
            description: 'Rhythm enters existence. The first beat.',
            category: 'rhythm',
            trigger: { pattern: 'path_horizontal' },
            requires: ['genesis_first_light', 'genesis_first_shadow'],
            sound: {
                type: 'pulse',
                freq: 55,
                rate: 0.5,  // 2 second cycle
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.5 },
            },
            visual: {
                effect: 'pulse_ring',
                rate: 0.5,
            },
        },

        genesis_width: {
            id: 'genesis_width',
            era: 'genesis',
            name: 'Space Expands',
            description: 'Stereo width opens. The soundstage grows.',
            category: 'spatial',
            trigger: { pattern: 'shape_square' },
            sound: {
                type: 'stereo_width',
                amount: 0.8,
                detuneL: -5,
                detuneR: 5,
            },
            visual: {
                widthEffect: true,
            },
        },

        genesis_convergence: {
            id: 'genesis_convergence',
            era: 'genesis',
            name: 'Convergence',
            description: 'All elements align. The first chord.',
            category: 'harmony',
            trigger: { combo: ['genesis_first_light', 'genesis_first_shadow', 'genesis_overtones'] },
            requires: ['genesis_first_light', 'genesis_first_shadow', 'genesis_overtones'],
            sound: {
                type: 'chord',
                intervals: [0, 7, 12],  // Root, 5th, octave
                volume: 0.25,
            },
            unlocks_era: 'primordial',
            visual: {
                flash: 'white',
                duration: 1,
            },
        },

        // ═══════════════════════════════════════════════════════════════════
        // ERA 2: PRIMORDIAL - Before Language
        // ═══════════════════════════════════════════════════════════════════

        primordial_breath_noise: {
            id: 'primordial_breath_noise',
            era: 'primordial',
            name: 'Breath',
            description: 'The sound of breathing. Wind through the void.',
            category: 'texture',
            trigger: { zone: 'nw', dwell: 2.0 },
            sound: {
                type: 'noise',
                noiseType: 'pink',
                filter: { type: 'bandpass', freq: 400, Q: 2 },
                envelope: { attack: 0.5, decay: 0.2, sustain: 0.3, release: 1 },
                lfo: { rate: 0.15, target: 'filter', depth: 200 },
                volume: 0.15,
            },
            visual: {
                particle: 'smoke',
                color: '#aaddff',
            },
        },

        primordial_voice: {
            id: 'primordial_voice',
            era: 'primordial',
            name: 'First Voice',
            description: 'Before words. The throat opens.',
            category: 'voice',
            trigger: { zone: 'center', dwell: 3.0 },
            sound: {
                type: 'formant',
                freq: 110,
                formants: [
                    { freq: 700, Q: 10, gain: 1 },
                    { freq: 1200, Q: 12, gain: 0.7 },
                    { freq: 2500, Q: 15, gain: 0.5 },
                ],
                vibrato: { rate: 5, depth: 3 },
                volume: 0.2,
            },
            visual: {
                color: '#ffcc99',
                glow: 0.4,
            },
        },

        primordial_water: {
            id: 'primordial_water',
            era: 'primordial',
            name: 'Water',
            description: 'Flowing, cascading. The sound of life.',
            category: 'texture',
            trigger: { pattern: 'path_down' },
            sound: {
                type: 'water',
                noiseType: 'white',
                filters: [
                    { type: 'lowpass', freq: 2000, Q: 1 },
                    { type: 'highpass', freq: 200, Q: 0.5 },
                ],
                modulation: { rate: 0.3, depth: 500 },
                volume: 0.12,
            },
            visual: {
                particle: 'droplet',
                color: '#4488ff',
            },
        },

        primordial_wind: {
            id: 'primordial_wind',
            era: 'primordial',
            name: 'Wind',
            description: 'Movement through space. Invisible force.',
            category: 'texture',
            trigger: { pattern: 'path_horizontal' },
            sound: {
                type: 'noise',
                noiseType: 'white',
                filter: { type: 'highpass', freq: 1000, Q: 0.5 },
                volume: 0.1,
                pan: { lfo: { rate: 0.1, depth: 0.8 } },
            },
            visual: {
                particle: 'streak',
                direction: 'horizontal',
            },
        },

        primordial_resonance: {
            id: 'primordial_resonance',
            era: 'primordial',
            name: 'Resonance',
            description: 'Echo. Feedback. The cave sings back.',
            category: 'effect',
            trigger: { zone: 'w', dwell: 3.0 },
            sound: {
                type: 'effect',
                effect: 'feedback',
                delay: 0.3,
                feedback: 0.6,
                filter: { type: 'bandpass', freq: 800, Q: 4 },
            },
            visual: {
                effect: 'echo_rings',
            },
        },

        primordial_earth: {
            id: 'primordial_earth',
            era: 'primordial',
            name: 'Earth',
            description: 'The ground. Solid. Fundamental.',
            category: 'bass',
            trigger: { zone: 's', dwell: 3.0 },
            sound: {
                type: 'sub',
                freq: 36,
                waveform: 'triangle',
                volume: 0.35,
                distortion: { amount: 0.1 },
            },
            visual: {
                screenShake: 0.15,
                color: '#664422',
            },
        },

        primordial_awakening: {
            id: 'primordial_awakening',
            era: 'primordial',
            name: 'Awakening',
            description: 'All primordial elements unite. Consciousness stirs.',
            category: 'transition',
            trigger: { combo: ['primordial_voice', 'primordial_earth', 'primordial_breath_noise'] },
            requires: ['primordial_voice', 'primordial_earth', 'primordial_breath_noise'],
            sound: {
                type: 'transition',
                swell: 3,
            },
            unlocks_era: 'tribal',
            visual: {
                flash: 'orange',
                duration: 2,
            },
        },

        // ═══════════════════════════════════════════════════════════════════
        // ERA 3: TRIBAL - Rhythm Emerges
        // ═══════════════════════════════════════════════════════════════════

        tribal_heartbeat: {
            id: 'tribal_heartbeat',
            era: 'tribal',
            name: 'Heartbeat',
            description: 'The first rhythm. Life pulses.',
            category: 'rhythm',
            automatic: true,
            sound: {
                type: 'kick',
                freq: 55,
                pitchDecay: 0.15,
                volume: 0.5,
                pattern: [1, 0, 0, 0, 1, 0, 0, 0],  // Simple pulse
            },
            visual: {
                pulse: true,
                color: '#ff3333',
            },
        },

        tribal_footsteps: {
            id: 'tribal_footsteps',
            era: 'tribal',
            name: 'Footsteps',
            description: 'Movement becomes rhythm. The dance begins.',
            category: 'rhythm',
            trigger: { zone: 's', dwell: 2.0 },
            sound: {
                type: 'kick',
                freq: 80,
                pitchDecay: 0.08,
                volume: 0.4,
                pattern: [1, 0, 1, 0, 1, 0, 1, 0],  // Walking
            },
            visual: {
                particle: 'dust',
            },
        },

        tribal_handclap: {
            id: 'tribal_handclap',
            era: 'tribal',
            name: 'Handclap',
            description: 'Sharp attack. The body becomes instrument.',
            category: 'percussion',
            trigger: { zone: 'n', dwell: 2.0 },
            sound: {
                type: 'clap',
                freq: 1000,
                noiseDecay: 0.08,
                volume: 0.35,
                pattern: [0, 0, 1, 0, 0, 0, 1, 0],  // Backbeat
            },
            visual: {
                flash: 'white',
                particle: 'burst',
            },
        },

        tribal_wood: {
            id: 'tribal_wood',
            era: 'tribal',
            name: 'Wood',
            description: 'Sticks striking. Resonant and warm.',
            category: 'percussion',
            trigger: { zone: 'w', dwell: 2.0 },
            sound: {
                type: 'wood',
                freq: 400,
                bodyDecay: 0.1,
                volume: 0.3,
                pattern: [0, 1, 0, 1, 0, 1, 0, 1],  // Offbeat
            },
            visual: {
                color: '#aa6622',
            },
        },

        tribal_stone: {
            id: 'tribal_stone',
            era: 'tribal',
            name: 'Stone',
            description: 'Hard clicks. High and bright.',
            category: 'percussion',
            trigger: { zone: 'e', dwell: 2.0 },
            sound: {
                type: 'click',
                freq: 3000,
                decay: 0.02,
                volume: 0.25,
                pattern: [1, 1, 0, 1, 1, 1, 0, 1],  // Busy
            },
            visual: {
                color: '#888888',
                particle: 'spark',
            },
        },

        tribal_drum: {
            id: 'tribal_drum',
            era: 'tribal',
            name: 'The Drum',
            description: 'Deep resonant strike. The voice of the earth.',
            category: 'percussion',
            trigger: { zone: 'center', dwell: 3.0 },
            requires: ['tribal_heartbeat'],
            sound: {
                type: 'drum',
                freq: 80,
                bodyDecay: 0.3,
                skinFreq: 250,
                skinDecay: 0.05,
                volume: 0.5,
                pattern: [1, 0, 0, 1, 0, 0, 1, 0],  // Tribal pattern
            },
            visual: {
                screenShake: 0.2,
                color: '#442200',
            },
        },

        tribal_808: {
            id: 'tribal_808',
            era: 'tribal',
            name: '808',
            description: 'Modern depth. Ancient power. The low end awakens.',
            category: 'bass',
            trigger: { zone: 'sw', dwell: 3.0 },
            requires: ['tribal_drum'],
            sound: {
                type: '808',
                freq: 36,
                pitchDecay: 0.2,
                sustain: 0.5,
                distortion: 0.2,
                volume: 0.6,
            },
            visual: {
                screenShake: 0.4,
                color: '#ff0066',
            },
        },

        tribal_call: {
            id: 'tribal_call',
            era: 'tribal',
            name: 'The Call',
            description: 'A phrase. A question. Music begins to speak.',
            category: 'melody',
            trigger: { pattern: 'shape_triangle_top' },
            requires: ['tribal_drum'],
            sound: {
                type: 'phrase',
                notes: [0, 3, 5, 7, 5],  // Pentatonic call
                duration: 0.25,
                volume: 0.3,
            },
            visual: {
                trail: true,
                color: '#ffaa00',
            },
        },

        tribal_response: {
            id: 'tribal_response',
            era: 'tribal',
            name: 'The Response',
            description: 'An answer. The first conversation.',
            category: 'melody',
            trigger: { pattern: 'shape_triangle_down' },
            requires: ['tribal_call'],
            sound: {
                type: 'phrase',
                notes: [7, 5, 3, 0, -2],  // Answering phrase
                duration: 0.25,
                volume: 0.3,
            },
            visual: {
                trail: true,
                color: '#00aaff',
            },
        },

        tribal_polyrhythm: {
            id: 'tribal_polyrhythm',
            era: 'tribal',
            name: 'Polyrhythm',
            description: '3 against 4. Two times become one.',
            category: 'rhythm',
            trigger: { pattern: 'shape_figure_8' },
            requires: ['tribal_drum', 'tribal_wood'],
            sound: {
                type: 'polyrhythm',
                ratioA: 3,
                ratioB: 4,
            },
            visual: {
                effect: 'interlock',
            },
        },

        tribal_ritual: {
            id: 'tribal_ritual',
            era: 'tribal',
            name: 'The Ritual',
            description: 'All rhythms unite. The tribe dances as one.',
            category: 'transition',
            trigger: {
                combo: ['tribal_drum', 'tribal_808', 'tribal_polyrhythm'],
            },
            requires: ['tribal_drum', 'tribal_808', 'tribal_polyrhythm'],
            sound: {
                type: 'full_kit',
                bpm: 90,
            },
            unlocks_era: 'sacred',
            visual: {
                flash: 'red',
                duration: 2,
            },
        },

        // ═══════════════════════════════════════════════════════════════════
        // ERA 4: SACRED - Harmony Discovered
        // ═══════════════════════════════════════════════════════════════════

        sacred_drone: {
            id: 'sacred_drone',
            era: 'sacred',
            name: 'The Drone',
            description: 'Sustained root. The foundation of harmony.',
            category: 'harmony',
            automatic: true,
            sound: {
                type: 'drone',
                freq: 110,
                waveform: 'sawtooth',
                filter: { type: 'lowpass', freq: 800 },
                volume: 0.2,
            },
            visual: {
                glow: 0.3,
                color: '#6633cc',
            },
        },

        sacred_fifth: {
            id: 'sacred_fifth',
            era: 'sacred',
            name: 'The Fifth',
            description: 'The perfect interval. Consonance discovered.',
            category: 'harmony',
            trigger: { zone: 'n', dwell: 2.0 },
            sound: {
                type: 'interval',
                interval: 7,  // Perfect 5th
                volume: 0.25,
            },
            visual: {
                color: '#9966ff',
            },
        },

        sacred_fourth: {
            id: 'sacred_fourth',
            era: 'sacred',
            name: 'The Fourth',
            description: 'Suspended. Seeking resolution.',
            category: 'harmony',
            trigger: { zone: 'w', dwell: 2.0 },
            sound: {
                type: 'interval',
                interval: 5,  // Perfect 4th
                volume: 0.25,
            },
            visual: {
                color: '#6699ff',
            },
        },

        sacred_third: {
            id: 'sacred_third',
            era: 'sacred',
            name: 'The Third',
            description: 'Major or minor. Emotion enters.',
            category: 'harmony',
            trigger: { zone: 'e', dwell: 2.0 },
            sound: {
                type: 'interval',
                interval: 4,  // Major 3rd
                volume: 0.25,
            },
            visual: {
                color: '#ffcc33',
            },
        },

        sacred_scale: {
            id: 'sacred_scale',
            era: 'sacred',
            name: 'The Scale',
            description: 'Pentatonic. The universal melody.',
            category: 'melody',
            trigger: { pattern: 'path_vertical' },
            requires: ['sacred_fifth', 'sacred_third'],
            sound: {
                type: 'scale',
                intervals: [0, 2, 4, 7, 9],  // Pentatonic
            },
            visual: {
                effect: 'scale_display',
            },
        },

        sacred_chord: {
            id: 'sacred_chord',
            era: 'sacred',
            name: 'The Chord',
            description: 'Three notes. The triad. Harmony is born.',
            category: 'harmony',
            trigger: { zone: 'center', dwell: 3.0 },
            requires: ['sacred_fifth', 'sacred_third'],
            sound: {
                type: 'chord',
                intervals: [0, 4, 7],  // Major triad
                volume: 0.3,
            },
            visual: {
                glow: 0.5,
                color: '#ffffff',
            },
        },

        sacred_resolution: {
            id: 'sacred_resolution',
            era: 'sacred',
            name: 'Resolution',
            description: 'Tension releases. The ear finds home.',
            category: 'progression',
            trigger: { pattern: 'shape_cross_plus' },
            requires: ['sacred_chord'],
            sound: {
                type: 'cadence',
                progression: [[5, 0], [0, 4, 7]],  // V - I
            },
            visual: {
                flash: 'white',
                particle: 'release',
            },
        },

        sacred_transcendence: {
            id: 'sacred_transcendence',
            era: 'sacred',
            name: 'Transcendence',
            description: 'Harmony and rhythm unite. Music is complete.',
            category: 'transition',
            trigger: {
                combo: ['sacred_chord', 'sacred_scale', 'sacred_resolution'],
            },
            requires: ['sacred_chord', 'sacred_scale', 'sacred_resolution'],
            unlocks_era: 'modern',
            visual: {
                flash: 'purple',
                duration: 3,
            },
        },

        // ═══════════════════════════════════════════════════════════════════
        // ERA 5: MODERN - 2026 Production
        // ═══════════════════════════════════════════════════════════════════

        modern_808_deep: {
            id: 'modern_808_deep',
            era: 'modern',
            name: '808 Deep',
            description: 'Floor-shaking sub bass. The modern foundation.',
            category: 'bass',
            trigger: { zone: 'sw', dwell: 2.0 },
            sound: {
                type: '808_modern',
                freq: 32,
                sustain: 0.8,
                distortion: 0.3,
                sidechain: true,
                volume: 0.7,
            },
            visual: {
                screenShake: 0.5,
                color: '#ff0066',
            },
        },

        modern_808_distorted: {
            id: 'modern_808_distorted',
            era: 'modern',
            name: '808 Distorted',
            description: 'Crushed and saturated. Aggressive power.',
            category: 'bass',
            trigger: { zone: 's', dwell: 2.0 },
            requires: ['modern_808_deep'],
            sound: {
                type: '808_modern',
                freq: 36,
                distortion: 0.7,
                saturation: true,
                volume: 0.6,
            },
            visual: {
                glitch: 0.3,
                color: '#ff3300',
            },
        },

        modern_trap_hat: {
            id: 'modern_trap_hat',
            era: 'modern',
            name: 'Trap Hi-Hat',
            description: 'Rapid-fire hats. The modern pulse.',
            category: 'drums',
            trigger: { zone: 'ne', dwell: 1.5 },
            sound: {
                type: 'trap_hat',
                pattern: 'rolls',
                velocity_variation: 0.3,
                volume: 0.35,
            },
            visual: {
                particle: 'rapid_dots',
            },
        },

        modern_trap_snare: {
            id: 'modern_trap_snare',
            era: 'modern',
            name: 'Trap Snare',
            description: 'Tight and punchy. Cuts through.',
            category: 'drums',
            trigger: { zone: 'n', dwell: 1.5 },
            sound: {
                type: 'trap_snare',
                freq: 200,
                noiseAmount: 0.7,
                volume: 0.45,
            },
            visual: {
                flash: 'white',
            },
        },

        modern_synth_pad: {
            id: 'modern_synth_pad',
            era: 'modern',
            name: 'Synth Pad',
            description: 'Lush saw waves. Warm and wide.',
            category: 'synth',
            trigger: { zone: 'w', dwell: 2.0 },
            sound: {
                type: 'supersaw',
                voices: 7,
                detune: 15,
                filter: { type: 'lowpass', freq: 3000, Q: 0.5 },
                chorus: true,
                volume: 0.25,
            },
            visual: {
                glow: 0.4,
                color: '#00ffcc',
            },
        },

        modern_synth_lead: {
            id: 'modern_synth_lead',
            era: 'modern',
            name: 'Synth Lead',
            description: 'Cutting through the mix. The voice.',
            category: 'synth',
            trigger: { zone: 'e', dwell: 2.0 },
            sound: {
                type: 'lead',
                waveform: 'square',
                filter: { type: 'lowpass', freq: 2000, resonance: 0.6 },
                portamento: 0.05,
                volume: 0.3,
            },
            visual: {
                glow: 0.5,
                color: '#ff00ff',
            },
        },

        modern_arp: {
            id: 'modern_arp',
            era: 'modern',
            name: 'Arpeggiator',
            description: 'Sequenced patterns. Motion in sound.',
            category: 'synth',
            trigger: { zone: 'ne', dwell: 2.0 },
            requires: ['modern_synth_pad'],
            sound: {
                type: 'arp',
                pattern: 'up_down',
                rate: '16n',
                octaves: 2,
                volume: 0.25,
            },
            visual: {
                effect: 'cascade',
            },
        },

        modern_sidechain: {
            id: 'modern_sidechain',
            era: 'modern',
            name: 'Sidechain',
            description: 'The pump. Rhythm from dynamics.',
            category: 'effect',
            trigger: { pattern: 'rhythm_pulse_fast' },
            sound: {
                type: 'sidechain',
                attack: 0.005,
                release: 0.2,
                ratio: 0.3,
            },
            visual: {
                effect: 'pump',
            },
        },

        modern_full_production: {
            id: 'modern_full_production',
            era: 'modern',
            name: 'Full Production',
            description: 'Everything unlocked. Create freely.',
            category: 'master',
            trigger: {
                combo: ['modern_808_deep', 'modern_trap_hat', 'modern_synth_pad', 'modern_sidechain'],
            },
            requires: ['modern_808_deep', 'modern_trap_hat', 'modern_synth_pad', 'modern_sidechain'],
            sound: {
                type: 'full_mix',
                limiter: true,
                stereo_enhance: true,
            },
            visual: {
                effect: 'full_spectrum',
            },
        },
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UNLOCK STATE
    // ═══════════════════════════════════════════════════════════════════════

    const unlockState = {
        unlocked: new Set(),
        locked: new Set(),        // Permanently locked (persists)
        active: new Set(),        // Currently producing sound
        pending: new Map(),       // unlock -> progress

        // Progress tracking per unlock
        progress: {},

        // Era tracking
        currentEra: 'genesis',
        eraUnlockCounts: {
            genesis: 0,
            primordial: 0,
            tribal: 0,
            sacred: 0,
            modern: 0,
        },
    };

    // ═══════════════════════════════════════════════════════════════════════
    // UNLOCK LOGIC
    // ═══════════════════════════════════════════════════════════════════════

    function checkUnlocks(context) {
        const {
            currentZone,
            zoneStates,
            activeZones,
            patterns,
            currentEra,
        } = context;

        const newUnlocks = [];

        for (const [id, unlock] of Object.entries(UNLOCKS)) {
            // Skip if already unlocked
            if (unlockState.unlocked.has(id)) continue;

            // Check era requirement
            if (unlock.era !== currentEra && !unlock.automatic) continue;

            // Check prerequisite unlocks
            if (unlock.requires) {
                const hasAllRequirements = unlock.requires.every(req =>
                    unlockState.unlocked.has(req)
                );
                if (!hasAllRequirements) continue;
            }

            // Check trigger conditions
            let triggered = false;

            if (unlock.automatic) {
                triggered = true;
            } else if (unlock.trigger) {
                triggered = checkTrigger(unlock.trigger, context);
            }

            if (triggered) {
                doUnlock(id, unlock);
                newUnlocks.push({ id, unlock });
            }
        }

        return newUnlocks;
    }

    function checkTrigger(trigger, context) {
        const { currentZone, zoneStates, patterns, activePatterns } = context;

        // Zone + dwell trigger
        if (trigger.zone && trigger.dwell) {
            const zoneState = zoneStates[trigger.zone];
            if (currentZone === trigger.zone && zoneState && zoneState.dwellTime >= trigger.dwell) {
                return true;
            }
        }

        // Pattern trigger
        if (trigger.pattern) {
            if (activePatterns && activePatterns.has(trigger.pattern)) {
                return true;
            }
        }

        // Combo trigger
        if (trigger.combo) {
            const hasAllActive = trigger.combo.every(id =>
                unlockState.active.has(id) || unlockState.locked.has(id)
            );
            if (hasAllActive) {
                return true;
            }
        }

        return false;
    }

    function doUnlock(id, unlock) {
        unlockState.unlocked.add(id);
        unlockState.eraUnlockCounts[unlock.era]++;

        console.log(`Unlocked: ${unlock.name} - ${unlock.description}`);

        // Emit event
        if (typeof window !== 'undefined' && window.GumpEvents) {
            window.GumpEvents.emit('unlock.complete', {
                id,
                unlock,
                totalUnlocks: unlockState.unlocked.size,
            });
        }

        // Check for era transition
        if (unlock.unlocks_era) {
            triggerEraTransition(unlock.unlocks_era);
        }

        return unlock;
    }

    function triggerEraTransition(newEra) {
        const oldEra = unlockState.currentEra;
        unlockState.currentEra = newEra;

        console.log(`Era transition: ${oldEra} -> ${newEra}`);

        if (typeof window !== 'undefined' && window.GumpEvents) {
            window.GumpEvents.emit('era.change', {
                from: oldEra,
                to: newEra,
            });
        }

        // Auto-unlock any automatic unlocks in the new era
        for (const [id, unlock] of Object.entries(UNLOCKS)) {
            if (unlock.era === newEra && unlock.automatic) {
                if (!unlockState.unlocked.has(id)) {
                    doUnlock(id, unlock);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACTIVATION
    // ═══════════════════════════════════════════════════════════════════════

    function activateUnlock(id) {
        if (!unlockState.unlocked.has(id)) return false;
        if (unlockState.active.has(id)) return false;

        unlockState.active.add(id);

        if (typeof window !== 'undefined' && window.GumpEvents) {
            window.GumpEvents.emit('unlock.activate', { id });
        }

        return true;
    }

    function deactivateUnlock(id) {
        if (!unlockState.active.has(id)) return false;

        unlockState.active.delete(id);

        if (typeof window !== 'undefined' && window.GumpEvents) {
            window.GumpEvents.emit('unlock.deactivate', { id });
        }

        return true;
    }

    function lockUnlock(id) {
        if (!unlockState.unlocked.has(id)) return false;
        if (unlockState.locked.has(id)) return false;

        unlockState.locked.add(id);

        if (typeof window !== 'undefined' && window.GumpEvents) {
            window.GumpEvents.emit('unlock.lock', { id });
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    function getUnlock(id) {
        return UNLOCKS[id] || null;
    }

    function isUnlocked(id) {
        return unlockState.unlocked.has(id);
    }

    function isActive(id) {
        return unlockState.active.has(id);
    }

    function isLocked(id) {
        return unlockState.locked.has(id);
    }

    function getUnlockedByEra(era) {
        return Object.entries(UNLOCKS)
            .filter(([id, u]) => u.era === era && unlockState.unlocked.has(id))
            .map(([id]) => id);
    }

    function getActiveByEra(era) {
        return Object.entries(UNLOCKS)
            .filter(([id, u]) => u.era === era && unlockState.active.has(id))
            .map(([id]) => id);
    }

    function getAvailableUnlocks(era = null) {
        const available = [];

        for (const [id, unlock] of Object.entries(UNLOCKS)) {
            if (unlockState.unlocked.has(id)) continue;
            if (era && unlock.era !== era) continue;

            // Check requirements
            let canUnlock = true;
            if (unlock.requires) {
                canUnlock = unlock.requires.every(req => unlockState.unlocked.has(req));
            }

            if (canUnlock) {
                available.push({ id, unlock });
            }
        }

        return available;
    }

    function getProgress() {
        const total = Object.keys(UNLOCKS).length;
        const unlocked = unlockState.unlocked.size;

        return {
            total,
            unlocked,
            percentage: (unlocked / total) * 100,
            byEra: { ...unlockState.eraUnlockCounts },
        };
    }

    function getAllUnlocks() {
        return { ...UNLOCKS };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function serialize() {
        return JSON.stringify({
            unlocked: Array.from(unlockState.unlocked),
            locked: Array.from(unlockState.locked),
            currentEra: unlockState.currentEra,
        });
    }

    function deserialize(json) {
        try {
            const data = JSON.parse(json);
            unlockState.unlocked = new Set(data.unlocked || []);
            unlockState.locked = new Set(data.locked || []);
            unlockState.currentEra = data.currentEra || 'genesis';

            // Recalculate era counts
            for (const era of Object.keys(unlockState.eraUnlockCounts)) {
                unlockState.eraUnlockCounts[era] = 0;
            }
            for (const id of unlockState.unlocked) {
                const unlock = UNLOCKS[id];
                if (unlock) {
                    unlockState.eraUnlockCounts[unlock.era]++;
                }
            }

            return true;
        } catch (e) {
            console.error('Failed to deserialize unlocks:', e);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════════════════

    function reset() {
        unlockState.unlocked.clear();
        unlockState.locked.clear();
        unlockState.active.clear();
        unlockState.pending.clear();
        unlockState.progress = {};
        unlockState.currentEra = 'genesis';

        for (const era of Object.keys(unlockState.eraUnlockCounts)) {
            unlockState.eraUnlockCounts[era] = 0;
        }

        // Auto-unlock defaults
        for (const [id, unlock] of Object.entries(UNLOCKS)) {
            if (unlock.automatic && unlock.era === 'genesis') {
                doUnlock(id, unlock);
            }
        }
    }

    // Initialize
    reset();

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Constants
        UNLOCKS,

        // Core
        checkUnlocks,
        activateUnlock,
        deactivateUnlock,
        lockUnlock,

        // Queries
        getUnlock,
        isUnlocked,
        isActive,
        isLocked,
        getUnlockedByEra,
        getActiveByEra,
        getAvailableUnlocks,
        getProgress,
        getAllUnlocks,

        // Era
        get currentEra() { return unlockState.currentEra; },
        triggerEraTransition,

        // Persistence
        serialize,
        deserialize,

        // Utilities
        reset,

        // State access
        get state() { return unlockState; },
    });
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpUnlocks;
}
