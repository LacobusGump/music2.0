/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - TEXTURE MIND AGENT
 * Ambient texture and soundscape decision-making agent
 * ═══════════════════════════════════════════════════════════════════════════
 */

const TextureMind = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // TEXTURE LIBRARIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Texture types organized by era
     */
    const TEXTURE_LIBRARY = {
        genesis: {
            void_hum: {
                name: 'Void Hum',
                description: 'Deep cosmic hum from the void',
                baseFreq: 30,
                harmonics: [1, 2, 3, 5, 7],
                harmonicAmps: [1, 0.5, 0.25, 0.1, 0.05],
                filterFreq: 200,
                filterQ: 2,
                lfoRate: 0.1,
                lfoDepth: 10,
                attack: 4,
                release: 6,
                pan: 0,
                intensity: 0.3
            },
            stellar_wind: {
                name: 'Stellar Wind',
                description: 'Filtered noise like cosmic wind',
                type: 'noise',
                noiseType: 'pink',
                filterFreq: 400,
                filterQ: 8,
                lfoRate: 0.05,
                lfoDepth: 200,
                attack: 3,
                release: 5,
                pan: 0,
                intensity: 0.2
            },
            primordial_pulse: {
                name: 'Primordial Pulse',
                description: 'Slow pulsing tone',
                baseFreq: 55,
                harmonics: [1, 2],
                harmonicAmps: [1, 0.3],
                filterFreq: 300,
                filterQ: 4,
                lfoRate: 0.25,
                lfoDepth: 0.5,
                lfoTarget: 'amplitude',
                attack: 2,
                release: 4,
                pan: 0,
                intensity: 0.25
            },
            cosmic_dust: {
                name: 'Cosmic Dust',
                description: 'Granular particles floating',
                type: 'granular',
                density: 3,
                grainDuration: 0.5,
                pitchRange: [100, 400],
                scatter: 0.8,
                attack: 0.1,
                release: 0.3,
                pan: 'random',
                intensity: 0.15
            },
            emergence_tone: {
                name: 'Emergence Tone',
                description: 'Rising harmonic series',
                baseFreq: 40,
                harmonics: [1, 2, 3, 4, 5, 6, 7, 8],
                harmonicAmps: [1, 0.7, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1],
                harmonicDrift: 0.02,
                filterFreq: 500,
                filterQ: 3,
                lfoRate: 0.08,
                lfoDepth: 15,
                attack: 5,
                release: 8,
                pan: 0,
                intensity: 0.35
            }
        },

        primordial: {
            cave_ambience: {
                name: 'Cave Ambience',
                description: 'Reverberant cave atmosphere',
                type: 'noise',
                noiseType: 'brown',
                filterFreq: 600,
                filterQ: 4,
                reverb: 0.8,
                reverbDecay: 4,
                lfoRate: 0.03,
                lfoDepth: 100,
                attack: 2,
                release: 4,
                pan: 0,
                intensity: 0.25
            },
            water_flow: {
                name: 'Water Flow',
                description: 'Gurgling water sounds',
                type: 'noise',
                noiseType: 'white',
                filterFreq: 800,
                filterQ: 12,
                filterType: 'bandpass',
                lfoRate: 2,
                lfoDepth: 400,
                secondaryLfo: {
                    rate: 0.1,
                    depth: 200,
                    target: 'filterFreq'
                },
                attack: 0.5,
                release: 1,
                pan: 0.3,
                intensity: 0.2
            },
            wind_howl: {
                name: 'Wind Howl',
                description: 'Wind through caves',
                type: 'noise',
                noiseType: 'pink',
                filterFreq: 1200,
                filterQ: 20,
                filterType: 'bandpass',
                lfoRate: 0.15,
                lfoDepth: 600,
                resonance: 15,
                attack: 2,
                release: 3,
                pan: 'sweep',
                panRate: 0.1,
                intensity: 0.3
            },
            earth_rumble: {
                name: 'Earth Rumble',
                description: 'Low frequency earth sounds',
                baseFreq: 25,
                harmonics: [1, 1.5, 2, 3],
                harmonicAmps: [1, 0.4, 0.3, 0.1],
                filterFreq: 150,
                filterQ: 2,
                distortion: 0.2,
                lfoRate: 0.5,
                lfoDepth: 5,
                attack: 3,
                release: 5,
                pan: 0,
                intensity: 0.4
            },
            creature_calls: {
                name: 'Creature Calls',
                description: 'Distant animal sounds',
                type: 'granular',
                density: 0.5,
                grainDuration: 1.5,
                pitchRange: [200, 1200],
                pitchCurve: 'random',
                scatter: 0.9,
                reverb: 0.6,
                attack: 0.2,
                release: 0.8,
                pan: 'random',
                intensity: 0.15
            },
            fire_crackle: {
                name: 'Fire Crackle',
                description: 'Campfire crackling',
                type: 'impulse',
                density: 8,
                pitchRange: [2000, 8000],
                filterFreq: 4000,
                filterQ: 1,
                attack: 0.001,
                release: 0.1,
                pan: 'random',
                panRange: 0.3,
                intensity: 0.2
            }
        },

        tribal: {
            jungle_atmosphere: {
                name: 'Jungle Atmosphere',
                description: 'Dense jungle ambience',
                layers: [
                    { type: 'noise', noiseType: 'pink', filterFreq: 2000, amp: 0.3 },
                    { type: 'noise', noiseType: 'brown', filterFreq: 400, amp: 0.2 }
                ],
                lfoRate: 0.02,
                lfoDepth: 0.3,
                reverb: 0.5,
                attack: 3,
                release: 4,
                pan: 0,
                intensity: 0.3
            },
            tribal_chant_bg: {
                name: 'Tribal Chant Background',
                description: 'Distant vocal textures',
                type: 'formant',
                vowels: ['ah', 'oh', 'eh'],
                vowelRate: 0.1,
                baseFreq: 150,
                harmonics: 12,
                formants: {
                    ah: [800, 1200, 2500],
                    oh: [400, 800, 2400],
                    eh: [500, 1800, 2500]
                },
                reverb: 0.7,
                attack: 2,
                release: 3,
                pan: 0,
                intensity: 0.2
            },
            drum_resonance: {
                name: 'Drum Resonance',
                description: 'Sympathetic drum vibrations',
                baseFreq: 80,
                harmonics: [1, 2.3, 3.5, 4.7],
                harmonicAmps: [1, 0.4, 0.2, 0.1],
                filterFreq: 400,
                filterQ: 8,
                decay: 2,
                triggerRate: 0.5,
                attack: 0.01,
                release: 2,
                pan: 0,
                intensity: 0.25
            },
            night_insects: {
                name: 'Night Insects',
                description: 'Chirping insects',
                type: 'impulse',
                density: 20,
                pitchRange: [3000, 8000],
                pattern: 'rhythmic',
                patternRate: 4,
                filterFreq: 6000,
                filterQ: 4,
                attack: 0.001,
                release: 0.05,
                pan: 'random',
                intensity: 0.15
            },
            storm_distant: {
                name: 'Distant Storm',
                description: 'Far away thunder and rain',
                layers: [
                    { type: 'noise', noiseType: 'brown', filterFreq: 200, amp: 0.4 },
                    { type: 'noise', noiseType: 'white', filterFreq: 4000, amp: 0.1 }
                ],
                rumbleRate: 0.02,
                rumbleDepth: 0.8,
                reverb: 0.9,
                attack: 4,
                release: 6,
                pan: 0,
                intensity: 0.35
            }
        },

        sacred: {
            cathedral_air: {
                name: 'Cathedral Air',
                description: 'Vast reverberant space',
                type: 'noise',
                noiseType: 'pink',
                filterFreq: 1000,
                filterQ: 2,
                reverb: 0.95,
                reverbDecay: 8,
                reverbPreDelay: 0.1,
                lfoRate: 0.01,
                lfoDepth: 100,
                attack: 4,
                release: 8,
                pan: 0,
                intensity: 0.2
            },
            organ_sustain: {
                name: 'Organ Sustain',
                description: 'Pipe organ held tones',
                baseFreq: 65,
                harmonics: [1, 2, 3, 4, 5, 6, 8, 10, 12],
                harmonicAmps: [1, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2, 0.15, 0.1],
                filterFreq: 2000,
                filterQ: 1,
                tremolo: {
                    rate: 5,
                    depth: 0.1
                },
                reverb: 0.8,
                attack: 3,
                release: 5,
                pan: 0,
                intensity: 0.4
            },
            choir_whisper: {
                name: 'Choir Whisper',
                description: 'Breathy choral texture',
                type: 'formant',
                vowels: ['oo', 'ah', 'ee'],
                vowelRate: 0.05,
                baseFreq: 220,
                harmonics: 16,
                breathiness: 0.4,
                formants: {
                    oo: [300, 800, 2200],
                    ah: [800, 1200, 2500],
                    ee: [300, 2300, 3000]
                },
                vibrato: {
                    rate: 5,
                    depth: 8
                },
                reverb: 0.85,
                attack: 2,
                release: 4,
                pan: 0,
                intensity: 0.3
            },
            bell_shimmer: {
                name: 'Bell Shimmer',
                description: 'Sustained bell harmonics',
                type: 'bell',
                baseFreq: 440,
                partials: [1, 2.0, 2.4, 3.0, 4.5, 6.8],
                partialAmps: [1, 0.6, 0.4, 0.3, 0.2, 0.1],
                decay: 8,
                shimmerRate: 0.5,
                shimmerDepth: 0.02,
                reverb: 0.9,
                attack: 0.01,
                release: 8,
                pan: 0,
                intensity: 0.25
            },
            sacred_drone: {
                name: 'Sacred Drone',
                description: 'Perfect fifth drone',
                voices: [
                    { freq: 110, amp: 1 },
                    { freq: 165, amp: 0.7 },
                    { freq: 220, amp: 0.5 }
                ],
                harmonics: [1, 2, 3, 4],
                filterFreq: 800,
                filterQ: 4,
                lfoRate: 0.03,
                lfoDepth: 1,
                reverb: 0.7,
                attack: 5,
                release: 8,
                pan: 0,
                intensity: 0.35
            },
            incense_swirl: {
                name: 'Incense Swirl',
                description: 'Ethereal swirling texture',
                type: 'granular',
                density: 8,
                grainDuration: 0.3,
                pitchRange: [400, 2000],
                pitchQuantize: 'pentatonic',
                scatter: 0.6,
                pan: 'sweep',
                panRate: 0.08,
                reverb: 0.8,
                attack: 0.05,
                release: 0.2,
                intensity: 0.2
            }
        },

        modern: {
            analog_warmth: {
                name: 'Analog Warmth',
                description: 'Vintage synth hum',
                baseFreq: 55,
                harmonics: [1, 2, 3],
                harmonicAmps: [1, 0.5, 0.2],
                filterFreq: 600,
                filterQ: 2,
                saturation: 0.3,
                noiseFloor: 0.02,
                lfoRate: 0.1,
                lfoDepth: 1,
                attack: 2,
                release: 3,
                pan: 0,
                intensity: 0.25
            },
            tape_hiss: {
                name: 'Tape Hiss',
                description: 'Vintage tape machine noise',
                type: 'noise',
                noiseType: 'white',
                filterFreq: 8000,
                filterQ: 0.5,
                filterType: 'highshelf',
                saturation: 0.1,
                wow: {
                    rate: 0.3,
                    depth: 0.01
                },
                attack: 0.5,
                release: 1,
                pan: 0,
                intensity: 0.08
            },
            sub_layer: {
                name: 'Sub Layer',
                description: 'Deep sub-bass texture',
                baseFreq: 35,
                harmonics: [1],
                harmonicAmps: [1],
                filterFreq: 80,
                filterQ: 4,
                saturation: 0.4,
                lfoRate: 0.25,
                lfoDepth: 2,
                attack: 2,
                release: 4,
                pan: 0,
                intensity: 0.5
            },
            pad_wash: {
                name: 'Pad Wash',
                description: 'Lush synth pad texture',
                type: 'supersaw',
                voices: 7,
                detune: 15,
                baseFreq: 220,
                filterFreq: 2000,
                filterQ: 2,
                filterEnv: {
                    attack: 1,
                    decay: 2,
                    sustain: 0.6,
                    release: 4
                },
                chorus: {
                    rate: 0.5,
                    depth: 0.3
                },
                reverb: 0.7,
                attack: 3,
                release: 5,
                pan: 0,
                intensity: 0.35
            },
            glitch_texture: {
                name: 'Glitch Texture',
                description: 'Digital artifacts and glitches',
                type: 'glitch',
                density: 4,
                bitDepth: 8,
                sampleRate: 22050,
                filterFreq: 4000,
                filterQ: 8,
                probability: 0.3,
                attack: 0.001,
                release: 0.1,
                pan: 'random',
                intensity: 0.15
            },
            vinyl_crackle: {
                name: 'Vinyl Crackle',
                description: 'Record surface noise',
                type: 'impulse',
                density: 30,
                pitchRange: [1000, 6000],
                filterFreq: 3000,
                filterQ: 1,
                saturation: 0.2,
                stereoWidth: 0.8,
                attack: 0.001,
                release: 0.02,
                pan: 'random',
                intensity: 0.1
            },
            white_noise_bed: {
                name: 'White Noise Bed',
                description: 'Filtered noise layer',
                type: 'noise',
                noiseType: 'white',
                filterFreq: 6000,
                filterQ: 2,
                filterType: 'lowpass',
                lfoRate: 0.05,
                lfoDepth: 2000,
                attack: 2,
                release: 3,
                pan: 0,
                intensity: 0.12
            },
            shimmer_reverb: {
                name: 'Shimmer Reverb',
                description: 'Pitch-shifted reverb tail',
                baseFreq: 440,
                harmonics: [1, 2],
                harmonicAmps: [0.5, 0.3],
                pitchShift: 12,
                reverb: 0.95,
                reverbDecay: 10,
                feedback: 0.6,
                filterFreq: 4000,
                attack: 0.1,
                release: 10,
                pan: 0,
                intensity: 0.2
            }
        }
    };

    /**
     * Texture combinations for layering
     */
    const TEXTURE_COMBINATIONS = {
        genesis: {
            cosmic_ambience: ['void_hum', 'stellar_wind', 'cosmic_dust'],
            emergence_bed: ['emergence_tone', 'primordial_pulse'],
            void_space: ['void_hum', 'stellar_wind']
        },
        primordial: {
            cave_dwelling: ['cave_ambience', 'water_flow', 'fire_crackle'],
            wilderness: ['wind_howl', 'creature_calls', 'earth_rumble'],
            primal_night: ['cave_ambience', 'creature_calls', 'fire_crackle']
        },
        tribal: {
            ritual_ground: ['jungle_atmosphere', 'tribal_chant_bg', 'drum_resonance'],
            night_ceremony: ['night_insects', 'tribal_chant_bg', 'fire_crackle'],
            storm_ritual: ['storm_distant', 'drum_resonance', 'tribal_chant_bg']
        },
        sacred: {
            cathedral_mass: ['cathedral_air', 'organ_sustain', 'choir_whisper'],
            meditation_space: ['sacred_drone', 'bell_shimmer', 'incense_swirl'],
            divine_presence: ['cathedral_air', 'choir_whisper', 'bell_shimmer']
        },
        modern: {
            lo_fi_bed: ['analog_warmth', 'tape_hiss', 'vinyl_crackle'],
            synth_atmosphere: ['pad_wash', 'sub_layer', 'shimmer_reverb'],
            digital_decay: ['glitch_texture', 'white_noise_bed', 'tape_hiss']
        }
    };

    /**
     * Zone to texture mapping
     */
    const ZONE_TEXTURE_MAP = {
        genesis: {
            'top-left': 'void_hum',
            'top-center': 'stellar_wind',
            'top-right': 'cosmic_dust',
            'middle-left': 'primordial_pulse',
            'center': 'emergence_tone',
            'middle-right': 'cosmic_dust',
            'bottom-left': 'void_hum',
            'bottom-center': 'primordial_pulse',
            'bottom-right': 'stellar_wind'
        },
        primordial: {
            'top-left': 'wind_howl',
            'top-center': 'creature_calls',
            'top-right': 'wind_howl',
            'middle-left': 'cave_ambience',
            'center': 'fire_crackle',
            'middle-right': 'cave_ambience',
            'bottom-left': 'earth_rumble',
            'bottom-center': 'water_flow',
            'bottom-right': 'earth_rumble'
        },
        tribal: {
            'top-left': 'night_insects',
            'top-center': 'tribal_chant_bg',
            'top-right': 'night_insects',
            'middle-left': 'jungle_atmosphere',
            'center': 'drum_resonance',
            'middle-right': 'jungle_atmosphere',
            'bottom-left': 'storm_distant',
            'bottom-center': 'tribal_chant_bg',
            'bottom-right': 'storm_distant'
        },
        sacred: {
            'top-left': 'choir_whisper',
            'top-center': 'bell_shimmer',
            'top-right': 'choir_whisper',
            'middle-left': 'cathedral_air',
            'center': 'organ_sustain',
            'middle-right': 'cathedral_air',
            'bottom-left': 'sacred_drone',
            'bottom-center': 'incense_swirl',
            'bottom-right': 'sacred_drone'
        },
        modern: {
            'top-left': 'shimmer_reverb',
            'top-center': 'pad_wash',
            'top-right': 'shimmer_reverb',
            'middle-left': 'analog_warmth',
            'center': 'sub_layer',
            'middle-right': 'analog_warmth',
            'bottom-left': 'glitch_texture',
            'bottom-center': 'vinyl_crackle',
            'bottom-right': 'tape_hiss'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TEXTURE MIND CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class TextureMindAgent {
        constructor() {
            this.agentId = 'texture-mind';
            this.name = 'Texture Mind';
            this.type = 'texture';

            // Current state
            this.currentEra = 'genesis';
            this.activeTextures = new Map();
            this.textureNodes = new Map();
            this.activeCombination = null;

            // Parameters
            this.masterVolume = 0.3;
            this.crossfadeTime = 2;
            this.maxActiveTextures = 4;

            // Zone tracking
            this.currentZone = 'center';
            this.zoneHistory = [];
            this.zoneDwellTimes = {};

            // Modulation state
            this.modulationTargets = new Map();
            this.lfoNodes = new Map();

            // Decision parameters
            this.decisionInterval = 2000;
            this.lastDecision = 0;
            this.reactivity = 0.5;

            // Learning state
            this.texturePreferences = {};
            this.combinationHistory = [];

            // Initialize preferences
            this._initPreferences();
        }

        /**
         * Initialize texture preferences
         */
        _initPreferences() {
            for (const era of Object.keys(TEXTURE_LIBRARY)) {
                this.texturePreferences[era] = {};
                for (const textureName of Object.keys(TEXTURE_LIBRARY[era])) {
                    this.texturePreferences[era][textureName] = {
                        weight: 1,
                        usageCount: 0,
                        lastUsed: 0,
                        avgDuration: 0,
                        zoneAssociations: {}
                    };
                }
            }
        }

        /**
         * Set audio context
         */
        setAudioContext(ctx) {
            this.audioContext = ctx;
            this._initMasterChain();
        }

        /**
         * Initialize master output chain
         */
        _initMasterChain() {
            if (!this.audioContext) return;

            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;

            // Master filter for overall texture control
            this.masterFilter = this.audioContext.createBiquadFilter();
            this.masterFilter.type = 'lowpass';
            this.masterFilter.frequency.value = 8000;
            this.masterFilter.Q.value = 1;

            // Compressor for leveling
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 4;
            this.compressor.attack.value = 0.1;
            this.compressor.release.value = 0.25;

            // Connect chain
            this.masterGain.connect(this.masterFilter);
            this.masterFilter.connect(this.compressor);
            this.compressor.connect(this.audioContext.destination);
        }

        /**
         * Set current era
         */
        setEra(era) {
            if (era === this.currentEra) return;

            const oldEra = this.currentEra;
            this.currentEra = era;

            // Crossfade to new era textures
            this._transitionToEra(oldEra, era);
        }

        /**
         * Transition textures between eras
         */
        _transitionToEra(fromEra, toEra) {
            // Fade out current textures
            for (const [id, texture] of this.activeTextures) {
                this._fadeOutTexture(id, this.crossfadeTime);
            }

            // Start default textures for new era after crossfade
            setTimeout(() => {
                this._startEraDefaults(toEra);
            }, this.crossfadeTime * 500);
        }

        /**
         * Start default textures for an era
         */
        _startEraDefaults(era) {
            const combinations = TEXTURE_COMBINATIONS[era];
            if (!combinations) return;

            // Pick a default combination
            const combinationNames = Object.keys(combinations);
            const defaultCombo = combinationNames[0];

            this.activateCombination(defaultCombo);
        }

        /**
         * Update zone position
         */
        updateZone(zone) {
            if (zone === this.currentZone) return;

            const oldZone = this.currentZone;
            this.currentZone = zone;

            // Track zone history
            this.zoneHistory.push({
                zone,
                timestamp: Date.now()
            });

            // Keep history limited
            if (this.zoneHistory.length > 50) {
                this.zoneHistory.shift();
            }

            // Update zone dwell time
            if (!this.zoneDwellTimes[zone]) {
                this.zoneDwellTimes[zone] = 0;
            }

            // React to zone change
            this._onZoneChange(oldZone, zone);
        }

        /**
         * Handle zone change
         */
        _onZoneChange(fromZone, toZone) {
            // Get zone-specific texture
            const zoneTextures = ZONE_TEXTURE_MAP[this.currentEra];
            if (!zoneTextures) return;

            const targetTexture = zoneTextures[toZone];
            if (!targetTexture) return;

            // Check if we should add this texture
            if (Math.random() < this.reactivity) {
                // Add zone texture if not already active
                if (!this.activeTextures.has(targetTexture)) {
                    this._addTexture(targetTexture, 0.5);
                } else {
                    // Boost existing texture
                    this._boostTexture(targetTexture, 1.2);
                }
            }

            // Update learning
            this._updateZoneAssociation(toZone, targetTexture);
        }

        /**
         * Update zone-texture association for learning
         */
        _updateZoneAssociation(zone, texture) {
            const prefs = this.texturePreferences[this.currentEra]?.[texture];
            if (!prefs) return;

            if (!prefs.zoneAssociations[zone]) {
                prefs.zoneAssociations[zone] = 0;
            }
            prefs.zoneAssociations[zone]++;
        }

        /**
         * Activate a texture combination
         */
        activateCombination(combinationName) {
            const combinations = TEXTURE_COMBINATIONS[this.currentEra];
            if (!combinations || !combinations[combinationName]) return;

            const textures = combinations[combinationName];

            // Store active combination
            this.activeCombination = combinationName;
            this.combinationHistory.push({
                name: combinationName,
                era: this.currentEra,
                timestamp: Date.now()
            });

            // Fade out textures not in new combination
            for (const [id, texture] of this.activeTextures) {
                if (!textures.includes(id)) {
                    this._fadeOutTexture(id, this.crossfadeTime);
                }
            }

            // Fade in new textures
            for (const textureName of textures) {
                if (!this.activeTextures.has(textureName)) {
                    this._addTexture(textureName, 1);
                }
            }
        }

        /**
         * Add a texture to the mix
         */
        _addTexture(textureName, intensity = 1) {
            const textureConfig = TEXTURE_LIBRARY[this.currentEra]?.[textureName];
            if (!textureConfig) return null;

            // Check max textures
            if (this.activeTextures.size >= this.maxActiveTextures) {
                // Remove oldest/quietest texture
                this._removeWeakestTexture();
            }

            // Create texture nodes
            const nodes = this._createTextureNodes(textureConfig, intensity);
            if (!nodes) return null;

            // Store texture
            this.activeTextures.set(textureName, {
                config: textureConfig,
                nodes,
                intensity,
                startTime: Date.now()
            });

            // Update preferences
            this._updateTextureUsage(textureName);

            return nodes;
        }

        /**
         * Create audio nodes for a texture
         */
        _createTextureNodes(config, intensity) {
            if (!this.audioContext) return null;

            const nodes = {
                sources: [],
                filters: [],
                gains: [],
                effects: []
            };

            const now = this.audioContext.currentTime;
            const targetGain = config.intensity * intensity * this.masterVolume;

            // Create based on texture type
            switch (config.type) {
                case 'noise':
                    nodes.sources.push(this._createNoiseSource(config));
                    break;
                case 'granular':
                    nodes.sources.push(this._createGranularSource(config));
                    break;
                case 'impulse':
                    nodes.sources.push(this._createImpulseSource(config));
                    break;
                case 'formant':
                    nodes.sources.push(this._createFormantSource(config));
                    break;
                case 'bell':
                    nodes.sources.push(this._createBellSource(config));
                    break;
                case 'supersaw':
                    nodes.sources.push(this._createSupersawSource(config));
                    break;
                case 'glitch':
                    nodes.sources.push(this._createGlitchSource(config));
                    break;
                default:
                    // Default: harmonic tone
                    nodes.sources.push(this._createHarmonicSource(config));
            }

            // Create filter
            const filter = this.audioContext.createBiquadFilter();
            filter.type = config.filterType || 'lowpass';
            filter.frequency.value = config.filterFreq || 1000;
            filter.Q.value = config.filterQ || 1;
            nodes.filters.push(filter);

            // Create output gain with envelope
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(targetGain, now + (config.attack || 1));
            nodes.gains.push(gain);

            // Add LFO modulation if specified
            if (config.lfoRate) {
                this._addLfoModulation(nodes, config);
            }

            // Connect chain
            for (const source of nodes.sources) {
                if (source) {
                    source.connect(filter);
                }
            }
            filter.connect(gain);
            gain.connect(this.masterGain);

            // Start sources
            for (const source of nodes.sources) {
                if (source && source.start) {
                    source.start(now);
                }
            }

            return nodes;
        }

        /**
         * Create noise source
         */
        _createNoiseSource(config) {
            if (!this.audioContext) return null;

            const bufferSize = this.audioContext.sampleRate * 2;
            const buffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

            for (let channel = 0; channel < 2; channel++) {
                const data = buffer.getChannelData(channel);

                if (config.noiseType === 'pink') {
                    // Pink noise using Voss-McCartney algorithm
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
                } else if (config.noiseType === 'brown') {
                    // Brown noise
                    let lastOut = 0;
                    for (let i = 0; i < bufferSize; i++) {
                        const white = Math.random() * 2 - 1;
                        data[i] = (lastOut + (0.02 * white)) / 1.02;
                        lastOut = data[i];
                        data[i] *= 3.5;
                    }
                } else {
                    // White noise
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                }
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            return source;
        }

        /**
         * Create harmonic tone source
         */
        _createHarmonicSource(config) {
            if (!this.audioContext) return null;

            const merger = this.audioContext.createChannelMerger(1);
            const harmonics = config.harmonics || [1];
            const amps = config.harmonicAmps || harmonics.map(() => 1);

            for (let i = 0; i < harmonics.length; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = config.baseFreq * harmonics[i];
                gain.gain.value = (amps[i] || 0.5) * 0.2;

                osc.connect(gain);
                gain.connect(merger);
                osc.start();
            }

            return merger;
        }

        /**
         * Create granular source
         */
        _createGranularSource(config) {
            if (!this.audioContext) return null;

            // Granular synthesis using scheduled grains
            const merger = this.audioContext.createChannelMerger(1);
            const density = config.density || 5;

            // Schedule grains periodically
            const scheduleGrain = () => {
                if (!this.audioContext) return;

                const now = this.audioContext.currentTime;
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                // Random pitch within range
                const minPitch = config.pitchRange?.[0] || 200;
                const maxPitch = config.pitchRange?.[1] || 800;
                osc.frequency.value = minPitch + Math.random() * (maxPitch - minPitch);
                osc.type = 'sine';

                // Grain envelope
                const grainDuration = config.grainDuration || 0.2;
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.1, now + grainDuration * 0.1);
                gain.gain.linearRampToValueAtTime(0, now + grainDuration);

                osc.connect(gain);
                gain.connect(merger);

                osc.start(now);
                osc.stop(now + grainDuration);
            };

            // Initial grains
            for (let i = 0; i < density; i++) {
                setTimeout(scheduleGrain, i * (1000 / density));
            }

            // Continue scheduling (stored for cleanup)
            this._grainInterval = setInterval(scheduleGrain, 1000 / density);

            return merger;
        }

        /**
         * Create impulse source (clicks/crackles)
         */
        _createImpulseSource(config) {
            if (!this.audioContext) return null;

            const merger = this.audioContext.createChannelMerger(1);
            const density = config.density || 10;

            const scheduleImpulse = () => {
                if (!this.audioContext) return;

                const now = this.audioContext.currentTime;
                const bufferSize = Math.floor(this.audioContext.sampleRate * 0.01);
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);

                // Create impulse
                const minPitch = config.pitchRange?.[0] || 1000;
                const maxPitch = config.pitchRange?.[1] || 4000;
                const freq = minPitch + Math.random() * (maxPitch - minPitch);

                for (let i = 0; i < bufferSize; i++) {
                    const t = i / this.audioContext.sampleRate;
                    const env = Math.exp(-t * 50);
                    data[i] = Math.sin(2 * Math.PI * freq * t) * env * Math.random();
                }

                const source = this.audioContext.createBufferSource();
                const gain = this.audioContext.createGain();
                source.buffer = buffer;
                gain.gain.value = 0.05;

                source.connect(gain);
                gain.connect(merger);
                source.start(now);
            };

            // Schedule impulses
            const interval = 1000 / density + Math.random() * (500 / density);
            this._impulseInterval = setInterval(scheduleImpulse, interval);

            return merger;
        }

        /**
         * Create formant source (vocal-like)
         */
        _createFormantSource(config) {
            if (!this.audioContext) return null;

            const merger = this.audioContext.createChannelMerger(1);
            const baseFreq = config.baseFreq || 150;
            const numHarmonics = config.harmonics || 12;
            const vowel = config.vowels?.[0] || 'ah';
            const formants = config.formants?.[vowel] || [800, 1200, 2500];

            // Create harmonic series
            for (let h = 1; h <= numHarmonics; h++) {
                const freq = baseFreq * h;
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                // Calculate formant amplitude
                let amp = 0;
                for (const formant of formants) {
                    const distance = Math.abs(freq - formant);
                    amp += Math.exp(-distance / 100);
                }
                gain.gain.value = amp * 0.1 / numHarmonics;

                osc.connect(gain);
                gain.connect(merger);
                osc.start();
            }

            return merger;
        }

        /**
         * Create bell source
         */
        _createBellSource(config) {
            if (!this.audioContext) return null;

            const merger = this.audioContext.createChannelMerger(1);
            const baseFreq = config.baseFreq || 440;
            const partials = config.partials || [1, 2, 2.4, 3, 4.5, 6.8];
            const amps = config.partialAmps || partials.map((_, i) => 1 / (i + 1));
            const decay = config.decay || 4;

            const now = this.audioContext.currentTime;

            for (let i = 0; i < partials.length; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = baseFreq * partials[i];

                // Bell envelope - exponential decay
                const partialDecay = decay * (1 - i * 0.1);
                gain.gain.setValueAtTime(amps[i] * 0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + partialDecay);

                osc.connect(gain);
                gain.connect(merger);
                osc.start(now);
            }

            return merger;
        }

        /**
         * Create supersaw source
         */
        _createSupersawSource(config) {
            if (!this.audioContext) return null;

            const merger = this.audioContext.createChannelMerger(1);
            const voices = config.voices || 7;
            const detune = config.detune || 15;
            const baseFreq = config.baseFreq || 220;

            for (let i = 0; i < voices; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sawtooth';

                // Spread detuning
                const detuneAmount = ((i - (voices - 1) / 2) / ((voices - 1) / 2)) * detune;
                osc.frequency.value = baseFreq;
                osc.detune.value = detuneAmount;

                gain.gain.value = 0.15 / voices;

                osc.connect(gain);
                gain.connect(merger);
                osc.start();
            }

            return merger;
        }

        /**
         * Create glitch source
         */
        _createGlitchSource(config) {
            if (!this.audioContext) return null;

            const merger = this.audioContext.createChannelMerger(1);
            const density = config.density || 4;
            const probability = config.probability || 0.3;

            const scheduleGlitch = () => {
                if (!this.audioContext || Math.random() > probability) return;

                const now = this.audioContext.currentTime;
                const duration = 0.01 + Math.random() * 0.05;
                const bufferSize = Math.floor(this.audioContext.sampleRate * duration);
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);

                // Generate glitchy content
                const glitchType = Math.floor(Math.random() * 3);

                for (let i = 0; i < bufferSize; i++) {
                    switch (glitchType) {
                        case 0: // Bit crush
                            data[i] = Math.floor(Math.random() * 8) / 8 * 2 - 1;
                            break;
                        case 1: // Sample repeat
                            data[i] = Math.sin(2 * Math.PI * (i % 50) / 50);
                            break;
                        case 2: // Noise burst
                            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 3);
                            break;
                    }
                }

                const source = this.audioContext.createBufferSource();
                const gain = this.audioContext.createGain();
                source.buffer = buffer;
                gain.gain.value = 0.1;

                source.connect(gain);
                gain.connect(merger);
                source.start(now);
            };

            this._glitchInterval = setInterval(scheduleGlitch, 1000 / density);

            return merger;
        }

        /**
         * Add LFO modulation to nodes
         */
        _addLfoModulation(nodes, config) {
            if (!this.audioContext) return;

            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();

            lfo.type = 'sine';
            lfo.frequency.value = config.lfoRate;
            lfoGain.gain.value = config.lfoDepth;

            lfo.connect(lfoGain);

            // Connect to appropriate target
            const target = config.lfoTarget || 'filter';

            if (target === 'filter' && nodes.filters.length > 0) {
                lfoGain.connect(nodes.filters[0].frequency);
            } else if (target === 'amplitude' && nodes.gains.length > 0) {
                lfoGain.connect(nodes.gains[0].gain);
            }

            lfo.start();

            nodes.lfo = lfo;
            nodes.lfoGain = lfoGain;
        }

        /**
         * Fade out a texture
         */
        _fadeOutTexture(textureName, fadeTime) {
            const texture = this.activeTextures.get(textureName);
            if (!texture || !texture.nodes) return;

            const now = this.audioContext?.currentTime || 0;
            const gains = texture.nodes.gains;

            for (const gain of gains) {
                gain.gain.linearRampToValueAtTime(0, now + fadeTime);
            }

            // Schedule cleanup
            setTimeout(() => {
                this._cleanupTexture(textureName);
            }, fadeTime * 1000 + 100);
        }

        /**
         * Cleanup texture nodes
         */
        _cleanupTexture(textureName) {
            const texture = this.activeTextures.get(textureName);
            if (!texture || !texture.nodes) return;

            // Stop and disconnect sources
            for (const source of texture.nodes.sources) {
                if (source) {
                    try {
                        if (source.stop) source.stop();
                        source.disconnect();
                    } catch (e) {}
                }
            }

            // Disconnect other nodes
            for (const filter of texture.nodes.filters) {
                filter.disconnect();
            }
            for (const gain of texture.nodes.gains) {
                gain.disconnect();
            }

            // Stop LFO if present
            if (texture.nodes.lfo) {
                try {
                    texture.nodes.lfo.stop();
                    texture.nodes.lfo.disconnect();
                    texture.nodes.lfoGain.disconnect();
                } catch (e) {}
            }

            this.activeTextures.delete(textureName);
        }

        /**
         * Boost texture intensity
         */
        _boostTexture(textureName, multiplier) {
            const texture = this.activeTextures.get(textureName);
            if (!texture || !texture.nodes) return;

            const now = this.audioContext?.currentTime || 0;
            const currentGain = texture.intensity * texture.config.intensity * this.masterVolume;
            const newGain = Math.min(currentGain * multiplier, 0.8);

            for (const gain of texture.nodes.gains) {
                gain.gain.linearRampToValueAtTime(newGain, now + 0.5);
            }

            texture.intensity *= multiplier;
        }

        /**
         * Remove weakest active texture
         */
        _removeWeakestTexture() {
            let weakest = null;
            let lowestIntensity = Infinity;

            for (const [name, texture] of this.activeTextures) {
                if (texture.intensity < lowestIntensity) {
                    lowestIntensity = texture.intensity;
                    weakest = name;
                }
            }

            if (weakest) {
                this._fadeOutTexture(weakest, 1);
            }
        }

        /**
         * Update texture usage preferences
         */
        _updateTextureUsage(textureName) {
            const prefs = this.texturePreferences[this.currentEra]?.[textureName];
            if (!prefs) return;

            prefs.usageCount++;
            prefs.lastUsed = Date.now();
        }

        /**
         * Make decision about textures
         */
        makeDecision() {
            const now = Date.now();
            if (now - this.lastDecision < this.decisionInterval) return null;
            this.lastDecision = now;

            const decision = {
                action: null,
                texture: null,
                combination: null,
                reason: ''
            };

            // Analyze current state
            const activeCount = this.activeTextures.size;
            const zoneTexture = ZONE_TEXTURE_MAP[this.currentEra]?.[this.currentZone];

            // Decision logic
            if (activeCount === 0) {
                // No textures - start default combination
                decision.action = 'start_combination';
                decision.combination = Object.keys(TEXTURE_COMBINATIONS[this.currentEra])[0];
                decision.reason = 'No active textures, starting defaults';
            } else if (activeCount < 2 && Math.random() < 0.3) {
                // Add variety
                decision.action = 'add_texture';
                decision.texture = this._selectNewTexture();
                decision.reason = 'Adding variety to texture mix';
            } else if (Math.random() < 0.1) {
                // Occasionally change combination
                decision.action = 'change_combination';
                decision.combination = this._selectNewCombination();
                decision.reason = 'Evolving texture atmosphere';
            }

            // Execute decision
            if (decision.action) {
                this._executeDecision(decision);
            }

            return decision;
        }

        /**
         * Select a new texture to add
         */
        _selectNewTexture() {
            const available = Object.keys(TEXTURE_LIBRARY[this.currentEra] || {});
            const active = Array.from(this.activeTextures.keys());

            const candidates = available.filter(t => !active.includes(t));
            if (candidates.length === 0) return null;

            // Weight by preferences
            const weights = candidates.map(t => {
                const prefs = this.texturePreferences[this.currentEra]?.[t];
                return prefs ? prefs.weight : 1;
            });

            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalWeight;

            for (let i = 0; i < candidates.length; i++) {
                random -= weights[i];
                if (random <= 0) return candidates[i];
            }

            return candidates[0];
        }

        /**
         * Select a new combination
         */
        _selectNewCombination() {
            const combinations = Object.keys(TEXTURE_COMBINATIONS[this.currentEra] || {});
            const current = this.activeCombination;

            const candidates = combinations.filter(c => c !== current);
            if (candidates.length === 0) return combinations[0];

            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        /**
         * Execute a texture decision
         */
        _executeDecision(decision) {
            switch (decision.action) {
                case 'add_texture':
                    if (decision.texture) {
                        this._addTexture(decision.texture, 0.7);
                    }
                    break;
                case 'start_combination':
                case 'change_combination':
                    if (decision.combination) {
                        this.activateCombination(decision.combination);
                    }
                    break;
            }
        }

        /**
         * Perceive current state
         */
        perceive() {
            return {
                era: this.currentEra,
                zone: this.currentZone,
                activeTextures: Array.from(this.activeTextures.keys()),
                activeCombination: this.activeCombination,
                textureCount: this.activeTextures.size,
                zoneHistory: this.zoneHistory.slice(-5)
            };
        }

        /**
         * Set master volume
         */
        setVolume(value) {
            this.masterVolume = Math.max(0, Math.min(1, value));
            if (this.masterGain) {
                this.masterGain.gain.linearRampToValueAtTime(
                    this.masterVolume,
                    this.audioContext.currentTime + 0.1
                );
            }
        }

        /**
         * Set reactivity level
         */
        setReactivity(value) {
            this.reactivity = Math.max(0, Math.min(1, value));
        }

        /**
         * Get available textures for current era
         */
        getAvailableTextures() {
            return Object.keys(TEXTURE_LIBRARY[this.currentEra] || {});
        }

        /**
         * Get available combinations for current era
         */
        getAvailableCombinations() {
            return Object.keys(TEXTURE_COMBINATIONS[this.currentEra] || {});
        }

        /**
         * Start a specific texture manually
         */
        startTexture(textureName, intensity = 1) {
            return this._addTexture(textureName, intensity);
        }

        /**
         * Stop a specific texture manually
         */
        stopTexture(textureName, fadeTime = 1) {
            this._fadeOutTexture(textureName, fadeTime);
        }

        /**
         * Stop all textures
         */
        stopAll(fadeTime = 2) {
            for (const [name] of this.activeTextures) {
                this._fadeOutTexture(name, fadeTime);
            }
        }

        /**
         * Cleanup and destroy
         */
        destroy() {
            // Clear intervals
            if (this._grainInterval) clearInterval(this._grainInterval);
            if (this._impulseInterval) clearInterval(this._impulseInterval);
            if (this._glitchInterval) clearInterval(this._glitchInterval);

            // Stop all textures
            this.stopAll(0.1);

            // Disconnect master chain
            if (this.masterGain) this.masterGain.disconnect();
            if (this.masterFilter) this.masterFilter.disconnect();
            if (this.compressor) this.compressor.disconnect();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    // Create singleton instance
    const instance = new TextureMindAgent();

    // Register with agent factory if available
    if (typeof AgentFactory !== 'undefined') {
        AgentFactory.register('texture-mind', () => instance);
    }

    return {
        // Instance access
        instance,

        // Configuration access
        TEXTURE_LIBRARY,
        TEXTURE_COMBINATIONS,
        ZONE_TEXTURE_MAP,

        // Methods
        setAudioContext: (ctx) => instance.setAudioContext(ctx),
        setEra: (era) => instance.setEra(era),
        updateZone: (zone) => instance.updateZone(zone),
        activateCombination: (name) => instance.activateCombination(name),
        makeDecision: () => instance.makeDecision(),
        perceive: () => instance.perceive(),
        setVolume: (v) => instance.setVolume(v),
        setReactivity: (v) => instance.setReactivity(v),
        getAvailableTextures: () => instance.getAvailableTextures(),
        getAvailableCombinations: () => instance.getAvailableCombinations(),
        startTexture: (name, intensity) => instance.startTexture(name, intensity),
        stopTexture: (name, fadeTime) => instance.stopTexture(name, fadeTime),
        stopAll: (fadeTime) => instance.stopAll(fadeTime),
        destroy: () => instance.destroy()
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextureMind;
}
