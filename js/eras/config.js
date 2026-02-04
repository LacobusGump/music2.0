/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - ERA CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Complete configuration for each musical era.
 * Defines sounds, patterns, visuals, and behaviors for each era.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpEraConfig = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // ERA DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════

    const ERAS = {
        // ─────────────────────────────────────────────────────────────────
        // GENESIS - The void before sound
        // ─────────────────────────────────────────────────────────────────
        genesis: {
            name: 'Genesis',
            description: 'The emergence from silence. The first vibrations.',
            order: 0,

            // Timing
            bpmRange: { min: 40, max: 70 },
            defaultBPM: 55,

            // Musical characteristics
            music: {
                scale: 'chromatic',
                rootNote: 55,           // A1
                octaveRange: [1, 3],
                harmony: 'drone',
                rhythm: 'none',
                density: 0.1,
                complexity: 0.1
            },

            // Sound palette
            sounds: {
                drums: {
                    enabled: false,
                    types: [],
                    patterns: ['pulse', 'breath']
                },
                bass: {
                    enabled: true,
                    types: ['sine', 'sub'],
                    patterns: ['void', 'pulse', 'breath']
                },
                harmony: {
                    enabled: true,
                    types: ['void_drone', 'first_light', 'shimmer_pad', 'overtone_cloud'],
                    chords: ['power']
                },
                melody: {
                    enabled: false,
                    types: ['primordial_tone', 'first_voice'],
                    patterns: ['single_tone', 'breath']
                }
            },

            // Effects
            effects: {
                reverb: { preset: 'ambient', wet: 0.7 },
                delay: { preset: 'ambient', wet: 0.4 },
                filter: { type: 'lowpass', frequency: 400, Q: 1 }
            },

            // Visuals
            visuals: {
                backgroundColor: { r: 0, g: 0, b: 0 },
                primaryColor: '#1a1a2e',
                secondaryColor: '#16213e',
                accentColor: '#0f3460',
                glowColor: '#e94560',
                particleDensity: 0.1,
                gridOpacity: 0.05
            },

            // Zone behaviors
            zones: {
                'center': { musical: 'root', visual: 'glow' },
                'top-center': { musical: 'octave', visual: 'shimmer' },
                'bottom-center': { musical: 'sub', visual: 'pulse' }
            },

            // Unlock requirements
            unlockRequirements: {
                total: 5,
                required: ['void', 'first_light', 'pulse']
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // PRIMORDIAL - Natural sounds emerge
        // ─────────────────────────────────────────────────────────────────
        primordial: {
            name: 'Primordial',
            description: 'The sounds of nature. Wind, water, breath.',
            order: 1,

            bpmRange: { min: 50, max: 90 },
            defaultBPM: 70,

            music: {
                scale: 'pentatonicMinor',
                rootNote: 55,
                octaveRange: [1, 4],
                harmony: 'fifths',
                rhythm: 'organic',
                density: 0.25,
                complexity: 0.25
            },

            sounds: {
                drums: {
                    enabled: true,
                    types: ['tribal', 'organic', 'wood'],
                    patterns: ['heartbeat', 'water', 'footsteps']
                },
                bass: {
                    enabled: true,
                    types: ['sine', 'sub', 'pluck'],
                    patterns: ['earth', 'water', 'heartbeat']
                },
                harmony: {
                    enabled: true,
                    types: ['breath_texture', 'wind_pad', 'water_resonance', 'earth_hum', 'cave_echo'],
                    chords: ['power', 'sus2', 'sus4']
                },
                melody: {
                    enabled: true,
                    types: ['breath_lead', 'wind_voice', 'water_song', 'bird_call'],
                    patterns: ['call', 'response', 'bird', 'wind']
                }
            },

            effects: {
                reverb: { preset: 'cave', wet: 0.6 },
                delay: { preset: 'ambient', wet: 0.35 },
                filter: { type: 'lowpass', frequency: 800, Q: 2 }
            },

            visuals: {
                backgroundColor: { r: 10, g: 10, b: 10 },
                primaryColor: '#1a1a1a',
                secondaryColor: '#2d2d2d',
                accentColor: '#3d5a80',
                glowColor: '#98c1d9',
                particleDensity: 0.2,
                gridOpacity: 0.08
            },

            zones: {
                'center': { musical: 'root', visual: 'breath' },
                'top-center': { musical: 'fifth', visual: 'wind' },
                'bottom-center': { musical: 'sub', visual: 'earth' },
                'center-left': { musical: 'fourth', visual: 'water' },
                'center-right': { musical: 'second', visual: 'fire' }
            },

            unlockRequirements: {
                total: 8,
                required: ['breath_noise', 'voice', 'resonance']
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // TRIBAL - Rhythm awakens
        // ─────────────────────────────────────────────────────────────────
        tribal: {
            name: 'Tribal',
            description: 'The heartbeat of humanity. Rhythm and ritual.',
            order: 2,

            bpmRange: { min: 80, max: 130 },
            defaultBPM: 100,

            music: {
                scale: 'minor',
                rootNote: 55,
                octaveRange: [1, 5],
                harmony: 'modal',
                rhythm: 'polyrhythmic',
                density: 0.5,
                complexity: 0.5
            },

            sounds: {
                drums: {
                    enabled: true,
                    types: ['tribal', 'organic', 'conga', 'wood', 'shaker'],
                    patterns: ['ritual', 'trance', 'ceremony', 'polyrhythm']
                },
                bass: {
                    enabled: true,
                    types: ['sub', 'pluck', 'saw'],
                    patterns: ['ritual', 'trance', 'dance', 'polyrhythm']
                },
                harmony: {
                    enabled: true,
                    types: ['ritual_drone', 'chant_pad', 'fire_texture', 'night_pad', 'spirit_voice'],
                    chords: ['minor', 'power', 'sus4']
                },
                melody: {
                    enabled: true,
                    types: ['chant_voice', 'flute_primitive', 'horn_call', 'spirit_whistle'],
                    patterns: ['chant', 'ritual', 'dance', 'trance']
                }
            },

            effects: {
                reverb: { preset: 'chamber', wet: 0.45 },
                delay: { preset: 'slap', wet: 0.25 },
                filter: { type: 'lowpass', frequency: 2000, Q: 3 }
            },

            visuals: {
                backgroundColor: { r: 15, g: 10, b: 5 },
                primaryColor: '#1c1c1c',
                secondaryColor: '#2e2e2e',
                accentColor: '#8b4513',
                glowColor: '#ff6b35',
                particleDensity: 0.4,
                gridOpacity: 0.12
            },

            zones: {
                'center': { musical: 'root', visual: 'fire' },
                'top-center': { musical: 'fifth', visual: 'spirit' },
                'bottom-center': { musical: 'root_low', visual: 'earth' },
                'top-left': { musical: 'seventh', visual: 'moon' },
                'top-right': { musical: 'fourth', visual: 'sun' },
                'bottom-left': { musical: 'third', visual: 'water' },
                'bottom-right': { musical: 'sixth', visual: 'wind' },
                'center-left': { musical: 'second', visual: 'drum_left' },
                'center-right': { musical: 'flat_seventh', visual: 'drum_right' }
            },

            unlockRequirements: {
                total: 12,
                required: ['heartbeat', 'drum', '808', 'polyrhythm']
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // SACRED - Harmony discovered
        // ─────────────────────────────────────────────────────────────────
        sacred: {
            name: 'Sacred',
            description: 'The mathematics of music. Harmony and resolution.',
            order: 3,

            bpmRange: { min: 60, max: 100 },
            defaultBPM: 80,

            music: {
                scale: 'major',
                rootNote: 110,          // A2
                octaveRange: [2, 5],
                harmony: 'functional',
                rhythm: 'measured',
                density: 0.4,
                complexity: 0.6
            },

            sounds: {
                drums: {
                    enabled: true,
                    types: ['acoustic', 'rim', 'shaker'],
                    patterns: ['processional', 'hymnal', 'meditation']
                },
                bass: {
                    enabled: true,
                    types: ['sine', 'sub'],
                    patterns: ['processional', 'hymnal', 'meditation']
                },
                harmony: {
                    enabled: true,
                    types: ['organ_pad', 'choir_pad', 'string_pad', 'glass_harmonica', 'bell_pad'],
                    chords: ['major', 'minor', 'maj7', 'min7', 'sus4', 'add9']
                },
                melody: {
                    enabled: true,
                    types: ['organ_lead', 'choir_lead', 'string_lead', 'bell_lead', 'flute_sacred'],
                    patterns: ['hymn', 'prayer', 'ascent', 'descend']
                }
            },

            effects: {
                reverb: { preset: 'cathedral', wet: 0.6 },
                delay: { preset: 'quarter', wet: 0.2 },
                filter: { type: 'lowpass', frequency: 5000, Q: 0.7 },
                chorus: { rate: 0.5, depth: 0.003, wet: 0.3 }
            },

            visuals: {
                backgroundColor: { r: 5, g: 5, b: 15 },
                primaryColor: '#0d0d1a',
                secondaryColor: '#1a1a33',
                accentColor: '#4a148c',
                glowColor: '#ce93d8',
                particleDensity: 0.3,
                gridOpacity: 0.1
            },

            zones: {
                'center': { musical: 'tonic', visual: 'light' },
                'top-center': { musical: 'dominant', visual: 'ascend' },
                'bottom-center': { musical: 'subdominant', visual: 'ground' },
                'top-left': { musical: 'relative_minor', visual: 'mystery' },
                'top-right': { musical: 'leading', visual: 'resolution' },
                'bottom-left': { musical: 'supertonic', visual: 'motion' },
                'bottom-right': { musical: 'mediant', visual: 'color' },
                'center-left': { musical: 'submediant', visual: 'depth' },
                'center-right': { musical: 'subtonic', visual: 'tension' }
            },

            unlockRequirements: {
                total: 15,
                required: ['drone', 'fifth', 'scale', 'chord', 'resolution']
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // MODERN - Contemporary production
        // ─────────────────────────────────────────────────────────────────
        modern: {
            name: 'Modern',
            description: 'The full spectrum. 2026 production aesthetics.',
            order: 4,

            bpmRange: { min: 70, max: 160 },
            defaultBPM: 120,

            music: {
                scale: 'minor',
                rootNote: 55,
                octaveRange: [0, 6],
                harmony: 'contemporary',
                rhythm: 'electronic',
                density: 0.7,
                complexity: 0.8
            },

            sounds: {
                drums: {
                    enabled: true,
                    types: ['808_deep', '808_short', '808_distorted', 'trap', 'clap', 'rim'],
                    patterns: ['basic808', 'trap', 'boom', 'four_on_floor', 'halftime', 'breakbeat']
                },
                bass: {
                    enabled: true,
                    types: ['808', '808_deep', 'sub', 'saw', 'reese', 'wobble'],
                    patterns: ['trap_basic', 'trap_bounce', 'deep_808', 'wobble', 'boom_bap', 'synth_bass']
                },
                harmony: {
                    enabled: true,
                    types: ['analog_pad', 'supersaw_pad', 'digital_pad', 'wavetable_pad', 'dark_pad', 'ambient_pad', 'warm_pad'],
                    chords: ['minor', 'maj7', 'min7', 'add9', 'sus2', 'power']
                },
                melody: {
                    enabled: true,
                    types: ['saw_lead', 'square_lead', 'supersaw_lead', 'acid_lead', 'fm_lead', 'pluck_lead', 'wobble_lead', 'chip_lead'],
                    patterns: ['riff', 'hook', 'arpeggio', 'synth', 'acid', 'chip']
                }
            },

            effects: {
                reverb: { preset: 'plate', wet: 0.35 },
                delay: { preset: 'ping_pong', wet: 0.3 },
                filter: { type: 'lowpass', frequency: 8000, Q: 2 },
                compressor: { threshold: -12, ratio: 8, attack: 0.003, release: 0.1 },
                distortion: { preset: 'warm', wet: 0.2 }
            },

            visuals: {
                backgroundColor: { r: 5, g: 5, b: 5 },
                primaryColor: '#0a0a0a',
                secondaryColor: '#141414',
                accentColor: '#1f1f1f',
                glowColor: '#00ff88',
                particleDensity: 0.6,
                gridOpacity: 0.15
            },

            zones: {
                'center': { musical: 'root', visual: 'pulse' },
                'top-center': { musical: 'lead', visual: 'energy' },
                'bottom-center': { musical: '808', visual: 'bass_drop' },
                'top-left': { musical: 'arp_high', visual: 'sparkle' },
                'top-right': { musical: 'fx', visual: 'sweep' },
                'bottom-left': { musical: 'sub', visual: 'rumble' },
                'bottom-right': { musical: 'stab', visual: 'hit' },
                'center-left': { musical: 'pad', visual: 'atmosphere' },
                'center-right': { musical: 'perc', visual: 'rhythm' }
            },

            unlockRequirements: {
                total: 20,
                required: ['808_deep', '808_distorted', 'synth_pad', 'synth_lead', 'sidechain']
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ERA PROGRESSION
    // ═══════════════════════════════════════════════════════════════════════

    const ERA_ORDER = ['genesis', 'primordial', 'tribal', 'sacred', 'modern'];

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSITION EFFECTS
    // ═══════════════════════════════════════════════════════════════════════

    const ERA_TRANSITIONS = {
        'genesis_to_primordial': {
            duration: 8,    // beats
            type: 'crossfade',
            visualEffect: 'dawn',
            soundEffect: 'breath_in'
        },
        'primordial_to_tribal': {
            duration: 4,
            type: 'build',
            visualEffect: 'fire_ignite',
            soundEffect: 'heartbeat_start'
        },
        'tribal_to_sacred': {
            duration: 8,
            type: 'ascend',
            visualEffect: 'light_rays',
            soundEffect: 'choir_swell'
        },
        'sacred_to_modern': {
            duration: 4,
            type: 'drop',
            visualEffect: 'flash',
            soundEffect: '808_drop'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function getEra(eraName) {
        return ERAS[eraName] || null;
    }

    function getEraByOrder(order) {
        return ERAS[ERA_ORDER[order]] || null;
    }

    function getNextEra(currentEra) {
        const currentIndex = ERA_ORDER.indexOf(currentEra);
        if (currentIndex < 0 || currentIndex >= ERA_ORDER.length - 1) {
            return null;
        }
        return ERA_ORDER[currentIndex + 1];
    }

    function getPreviousEra(currentEra) {
        const currentIndex = ERA_ORDER.indexOf(currentEra);
        if (currentIndex <= 0) {
            return null;
        }
        return ERA_ORDER[currentIndex - 1];
    }

    function getEraTransition(fromEra, toEra) {
        const key = `${fromEra}_to_${toEra}`;
        return ERA_TRANSITIONS[key] || {
            duration: 4,
            type: 'crossfade',
            visualEffect: 'fade',
            soundEffect: 'swoosh'
        };
    }

    function getEraCount() {
        return ERA_ORDER.length;
    }

    function getAllEras() {
        return ERA_ORDER.map(name => ({ name, ...ERAS[name] }));
    }

    function getEraSounds(eraName, category) {
        const era = ERAS[eraName];
        if (!era || !era.sounds[category]) {
            return [];
        }
        return era.sounds[category].types || [];
    }

    function getEraPatterns(eraName, category) {
        const era = ERAS[eraName];
        if (!era || !era.sounds[category]) {
            return [];
        }
        return era.sounds[category].patterns || [];
    }

    function getEraEffects(eraName) {
        const era = ERAS[eraName];
        return era ? era.effects : {};
    }

    function getEraVisuals(eraName) {
        const era = ERAS[eraName];
        return era ? era.visuals : {};
    }

    function getEraZoneConfig(eraName, zoneName) {
        const era = ERAS[eraName];
        if (!era || !era.zones[zoneName]) {
            return { musical: 'root', visual: 'default' };
        }
        return era.zones[zoneName];
    }

    function isEraUnlocked(eraName, unlockedItems) {
        const era = ERAS[eraName];
        if (!era) return false;

        const requirements = era.unlockRequirements;
        if (!requirements) return true;

        // Check required unlocks
        for (const required of requirements.required) {
            if (!unlockedItems.has(required)) {
                return false;
            }
        }

        return true;
    }

    function getEraProgress(eraName, unlockedItems) {
        const era = ERAS[eraName];
        if (!era) return 0;

        const requirements = era.unlockRequirements;
        if (!requirements) return 1;

        let count = 0;
        for (const required of requirements.required) {
            if (unlockedItems.has(required)) {
                count++;
            }
        }

        return count / requirements.required.length;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // Era access
        getEra,
        getEraByOrder,
        getNextEra,
        getPreviousEra,
        getEraTransition,
        getEraCount,
        getAllEras,

        // Era components
        getEraSounds,
        getEraPatterns,
        getEraEffects,
        getEraVisuals,
        getEraZoneConfig,

        // Progression
        isEraUnlocked,
        getEraProgress,

        // Direct access
        ERAS,
        ERA_ORDER,
        ERA_TRANSITIONS
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpEraConfig;
}
