// ═══════════════════════════════════════════════════════════════════════════
// GUMP - MAGENTA AI ENGINE
// ═══════════════════════════════════════════════════════════════════════════
//
// Integrates TensorFlow.js Magenta models for AI-driven music generation.
// FREE, client-side, no API key needed.
//
// Models used:
// - MusicVAE: Generates melodic sequences with interpolation
// - DrumsRNN: AI drum pattern generation
// - GrooVAE: Humanizes mechanical patterns (adds groove)
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpMagentaEngine = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        initialized: false,
        modelsLoaded: false,
        loading: false,

        // Loaded models
        models: {
            drumsRnn: null,
            groovae: null,
            musicVae: null,
        },

        // Generated patterns cache
        cache: {
            drumPatterns: [],
            melodies: [],
            grooves: [],
        },

        // Current generation state
        current: {
            temperature: 0.9,      // Creativity level
            stepsPerQuarter: 4,    // 16th notes
            qpm: 85,               // Quarter notes per minute
        },

        // Callbacks
        onPatternGenerated: null,
        onMelodyGenerated: null,
    };

    // CDN URLs for Magenta.js models (Google hosted, free)
    const MODEL_URLS = {
        drumsRnn: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn',
        groovae: 'https://storage.googleapis.com/magentadata/js/checkpoints/groovae/tap2drum_1bar',
        musicVaeMel: 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small',
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function init() {
        if (state.initialized || state.loading) return state.initialized;

        state.loading = true;
        console.log('[MagentaEngine] Initializing...');

        try {
            // Check if Magenta.js is available (needs to be loaded externally)
            if (typeof mm === 'undefined') {
                console.log('[MagentaEngine] Loading Magenta.js from CDN...');
                await loadMagentaScript();
            }

            if (typeof mm === 'undefined') {
                console.warn('[MagentaEngine] Magenta.js not available, using fallback');
                state.loading = false;
                return false;
            }

            state.initialized = true;
            console.log('[MagentaEngine] Base initialized, models will load on demand');

        } catch (error) {
            console.error('[MagentaEngine] Init failed:', error);
            state.loading = false;
            return false;
        }

        state.loading = false;
        return true;
    }

    async function loadMagentaScript() {
        return new Promise((resolve, reject) => {
            // Load Magenta.js core
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@magenta/music@1.23.1/es6/core.js';
            script.type = 'module';
            script.onload = () => {
                console.log('[MagentaEngine] Magenta core loaded');
                // Also load music_rnn for drums
                const rnnScript = document.createElement('script');
                rnnScript.src = 'https://cdn.jsdelivr.net/npm/@magenta/music@1.23.1/es6/music_rnn.js';
                rnnScript.type = 'module';
                rnnScript.onload = resolve;
                rnnScript.onerror = reject;
                document.head.appendChild(rnnScript);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function loadDrumsModel() {
        if (state.models.drumsRnn) return state.models.drumsRnn;

        if (typeof mm === 'undefined' || !mm.MusicRNN) {
            console.warn('[MagentaEngine] MusicRNN not available');
            return null;
        }

        console.log('[MagentaEngine] Loading DrumsRNN...');
        try {
            state.models.drumsRnn = new mm.MusicRNN(MODEL_URLS.drumsRnn);
            await state.models.drumsRnn.initialize();
            console.log('[MagentaEngine] DrumsRNN loaded');
            return state.models.drumsRnn;
        } catch (error) {
            console.error('[MagentaEngine] DrumsRNN load failed:', error);
            return null;
        }
    }

    async function loadGrooveModel() {
        if (state.models.groovae) return state.models.groovae;

        if (typeof mm === 'undefined' || !mm.MusicVAE) {
            console.warn('[MagentaEngine] MusicVAE not available for GrooVAE');
            return null;
        }

        console.log('[MagentaEngine] Loading GrooVAE...');
        try {
            state.models.groovae = new mm.MusicVAE(MODEL_URLS.groovae);
            await state.models.groovae.initialize();
            console.log('[MagentaEngine] GrooVAE loaded');
            return state.models.groovae;
        } catch (error) {
            console.error('[MagentaEngine] GrooVAE load failed:', error);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DRUM GENERATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate a drum pattern using AI
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generated pattern in GUMP format
     */
    async function generateDrumPattern(options = {}) {
        const {
            bars = 2,
            temperature = 0.9,
            style = 'default',      // 'minimal', 'tribal', 'trap', 'jazz', 'chaos'
            seed = null,
        } = options;

        // Try AI generation first
        const model = await loadDrumsModel();
        if (model) {
            try {
                const pattern = await generateWithDrumsRNN(model, { bars, temperature, style, seed });
                if (pattern) return pattern;
            } catch (e) {
                console.warn('[MagentaEngine] AI generation failed, using procedural:', e);
            }
        }

        // Fallback to procedural generation
        return generateProceduralDrumPattern({ bars, style, temperature });
    }

    async function generateWithDrumsRNN(model, options) {
        const { bars, temperature, style, seed } = options;
        const stepsPerBar = 16;
        const totalSteps = bars * stepsPerBar;

        // Create seed sequence if not provided
        let seedSequence = seed;
        if (!seedSequence) {
            seedSequence = createSeedSequence(style);
        }

        // Generate continuation
        const generated = await model.continueSequence(
            seedSequence,
            totalSteps,
            temperature,
            [DRUM_MAPPING.kick, DRUM_MAPPING.snare, DRUM_MAPPING.hihat]
        );

        // Convert to GUMP format
        return convertMagentaToGump(generated, bars);
    }

    function createSeedSequence(style) {
        // Magenta NoteSequence format
        const sequence = {
            quantizationInfo: { stepsPerQuarter: 4 },
            notes: [],
            totalQuantizedSteps: 8,
        };

        // Seed patterns by style
        const seeds = {
            minimal: [
                { pitch: 36, startStep: 0, endStep: 1 },  // Kick on 1
            ],
            tribal: [
                { pitch: 36, startStep: 0, endStep: 1 },
                { pitch: 36, startStep: 6, endStep: 7 },
                { pitch: 42, startStep: 3, endStep: 4 },
            ],
            trap: [
                { pitch: 36, startStep: 0, endStep: 1 },
                { pitch: 38, startStep: 4, endStep: 5 },
                { pitch: 42, startStep: 2, endStep: 3 },
                { pitch: 42, startStep: 6, endStep: 7 },
            ],
            jazz: [
                { pitch: 36, startStep: 0, endStep: 1 },
                { pitch: 51, startStep: 2, endStep: 3 },  // Ride
                { pitch: 51, startStep: 5, endStep: 6 },
            ],
            chaos: [
                { pitch: 36, startStep: 0, endStep: 1 },
                { pitch: 38, startStep: 3, endStep: 4 },
                { pitch: 36, startStep: 5, endStep: 6 },
            ],
            default: [
                { pitch: 36, startStep: 0, endStep: 1 },
                { pitch: 38, startStep: 4, endStep: 5 },
            ],
        };

        const seedNotes = seeds[style] || seeds.default;
        sequence.notes = seedNotes.map(n => ({
            pitch: n.pitch,
            quantizedStartStep: n.startStep,
            quantizedEndStep: n.endStep,
            velocity: 80 + Math.random() * 40,
            isDrum: true,
        }));

        return sequence;
    }

    // Drum MIDI mapping
    const DRUM_MAPPING = {
        kick: 36,
        snare: 38,
        hihat: 42,
        openHat: 46,
        tom1: 45,
        tom2: 47,
        ride: 51,
        crash: 49,
    };

    const REVERSE_DRUM_MAPPING = {
        36: 'kick',
        38: 'snare',
        40: 'snare',  // Electric snare
        42: 'hihat',
        44: 'hihat',  // Pedal hat
        46: 'openHat',
        45: 'tom',
        47: 'tom',
        48: 'tom',
        49: 'crash',
        51: 'hihat',  // Ride as hat
    };

    function convertMagentaToGump(sequence, bars) {
        const stepsPerBar = 16;
        const totalSteps = bars * stepsPerBar;

        // Initialize pattern
        const pattern = {
            kick: new Array(totalSteps).fill(0),
            snare: new Array(totalSteps).fill(0),
            hihat: new Array(totalSteps).fill(0),
            openHat: new Array(totalSteps).fill(0),
            perc: new Array(totalSteps).fill(0),
            bars: bars,
        };

        // Fill from Magenta notes
        if (sequence && sequence.notes) {
            for (const note of sequence.notes) {
                const step = note.quantizedStartStep % totalSteps;
                const velocity = (note.velocity || 80) / 127;
                const value = velocity > 0.7 ? 2 : 1;  // Accent if loud

                const instrument = REVERSE_DRUM_MAPPING[note.pitch];
                if (instrument && pattern[instrument]) {
                    pattern[instrument][step] = Math.max(pattern[instrument][step], value);
                }
            }
        }

        return pattern;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PROCEDURAL GENERATION (Fallback + Enhanced)
    // ═══════════════════════════════════════════════════════════════════════

    function generateProceduralDrumPattern(options = {}) {
        const { bars = 2, style = 'default', temperature = 0.5 } = options;
        const stepsPerBar = 16;
        const totalSteps = bars * stepsPerBar;

        const pattern = {
            kick: new Array(totalSteps).fill(0),
            snare: new Array(totalSteps).fill(0),
            hihat: new Array(totalSteps).fill(0),
            openHat: new Array(totalSteps).fill(0),
            perc: new Array(totalSteps).fill(0),
            bars: bars,
        };

        // Style-specific generation
        switch (style) {
            case 'minimal':
                generateMinimalPattern(pattern, temperature);
                break;
            case 'tribal':
                generateTribalPattern(pattern, temperature);
                break;
            case 'trap':
                generateTrapPattern(pattern, temperature);
                break;
            case 'jazz':
                generateJazzPattern(pattern, temperature);
                break;
            case 'chaos':
                generateChaosPattern(pattern, temperature);
                break;
            case 'cinematic':
                generateCinematicPattern(pattern, temperature);
                break;
            case 'electronic':
                generateElectronicPattern(pattern, temperature);
                break;
            case 'ambient':
                generateAmbientPattern(pattern, temperature);
                break;
            default:
                generateDefaultPattern(pattern, temperature);
        }

        // Apply humanization
        humanizePattern(pattern, temperature * 0.3);

        return pattern;
    }

    function generateMinimalPattern(pattern, temp) {
        const len = pattern.kick.length;
        for (let i = 0; i < len; i += 16) {
            // Sparse kick
            pattern.kick[i] = 2;
            if (Math.random() < temp * 0.3) {
                pattern.kick[i + 8] = 1;
            }
        }
    }

    function generateTribalPattern(pattern, temp) {
        const len = pattern.kick.length;
        // 3-against-4 polyrhythm
        for (let i = 0; i < len; i++) {
            // Kick on 5-beat cycle
            if (i % 5 === 0) pattern.kick[i] = Math.random() < 0.8 ? 2 : 0;
            // Snare on 3-beat cycle
            if (i % 3 === 0 && i % 6 !== 0) pattern.snare[i] = Math.random() < 0.6 ? 1 : 0;
            // Perc on offbeats
            if (i % 2 === 1 && Math.random() < 0.4 + temp * 0.3) {
                pattern.perc[i] = 1;
            }
        }
    }

    function generateTrapPattern(pattern, temp) {
        const len = pattern.kick.length;
        for (let bar = 0; bar < len / 16; bar++) {
            const offset = bar * 16;
            // Trap kick - heavy syncopation
            pattern.kick[offset + 0] = 2;
            if (Math.random() < 0.6) pattern.kick[offset + 6] = 2;
            if (Math.random() < 0.4) pattern.kick[offset + 10] = 1;
            if (Math.random() < 0.5) pattern.kick[offset + 14] = 1;

            // Snare on 4 and 12
            pattern.snare[offset + 4] = 2;
            pattern.snare[offset + 12] = 2;

            // Rolling hi-hats
            for (let i = 0; i < 16; i++) {
                if (Math.random() < 0.8 + temp * 0.2) {
                    pattern.hihat[offset + i] = Math.random() < 0.3 ? 2 : 1;
                }
            }

            // Hat rolls on 6-7 and 14-15
            if (Math.random() < 0.5) {
                pattern.hihat[offset + 6] = 2;
                pattern.hihat[offset + 7] = 2;
            }
        }
    }

    function generateJazzPattern(pattern, temp) {
        const len = pattern.kick.length;
        // Swing feel - emphasize offbeats
        for (let i = 0; i < len; i++) {
            const beatPos = i % 4;
            // Walking feel
            if (i % 8 === 0) pattern.kick[i] = 2;
            if (i % 8 === 3 && Math.random() < 0.6) pattern.kick[i] = 1;

            // Cross-stick ghost notes
            if (beatPos === 2 && Math.random() < 0.4) pattern.snare[i] = 1;

            // Ride pattern
            if (i % 2 === 0 || (i % 4 === 3 && Math.random() < 0.7)) {
                pattern.hihat[i] = Math.random() < 0.3 ? 2 : 1;
            }
        }
    }

    function generateChaosPattern(pattern, temp) {
        const len = pattern.kick.length;
        // Unpredictable, but with underlying pulse
        for (let i = 0; i < len; i++) {
            if (i % 16 === 0) pattern.kick[i] = 2;  // Anchor

            // Random elements based on temperature
            if (Math.random() < temp * 0.5) {
                pattern.kick[i] = Math.max(pattern.kick[i], Math.random() < 0.3 ? 2 : 1);
            }
            if (Math.random() < temp * 0.4) {
                pattern.snare[i] = Math.random() < 0.2 ? 2 : 1;
            }
            if (Math.random() < temp * 0.6) {
                pattern.hihat[i] = 1;
            }
            if (Math.random() < temp * 0.2) {
                pattern.perc[i] = 1;
            }
        }
    }

    function generateCinematicPattern(pattern, temp) {
        const len = pattern.kick.length;
        // Epic, building feel
        for (let bar = 0; bar < len / 16; bar++) {
            const offset = bar * 16;
            const intensity = (bar + 1) / (len / 16);  // Builds over time

            // Big kicks on downbeats
            pattern.kick[offset + 0] = 2;
            if (intensity > 0.5) pattern.kick[offset + 8] = 2;

            // Snare builds
            if (intensity > 0.3) pattern.snare[offset + 4] = 1;
            if (intensity > 0.6) pattern.snare[offset + 12] = 2;

            // Driving 8ths on hats when intensity high
            if (intensity > 0.5) {
                for (let i = 0; i < 16; i += 2) {
                    pattern.hihat[offset + i] = 1;
                }
            }

            // Toms for fills
            if (bar % 4 === 3 && bar > 0) {
                pattern.perc[offset + 12] = 2;
                pattern.perc[offset + 14] = 2;
            }
        }
    }

    function generateElectronicPattern(pattern, temp) {
        const len = pattern.kick.length;
        // Four on the floor with variations
        for (let i = 0; i < len; i++) {
            // Kick on every quarter
            if (i % 4 === 0) pattern.kick[i] = 2;

            // Snare on 2 and 4
            if (i % 8 === 4) pattern.snare[i] = 2;

            // Offbeat hats
            if (i % 4 === 2) pattern.openHat[i] = Math.random() < 0.7 ? 1 : 0;

            // Closed hats on 8ths/16ths
            if (i % 2 === 0) pattern.hihat[i] = 1;
            if (Math.random() < temp * 0.5) pattern.hihat[i] = Math.max(pattern.hihat[i], 1);
        }
    }

    function generateAmbientPattern(pattern, temp) {
        const len = pattern.kick.length;
        // Very sparse, breathing
        for (let bar = 0; bar < len / 16; bar++) {
            const offset = bar * 16;

            // Occasional deep kick
            if (bar % 2 === 0 || Math.random() < 0.3) {
                pattern.kick[offset] = 2;
            }

            // Subtle texture
            if (Math.random() < 0.3) {
                pattern.perc[offset + 8] = 1;
            }
        }
    }

    function generateDefaultPattern(pattern, temp) {
        const len = pattern.kick.length;
        for (let bar = 0; bar < len / 16; bar++) {
            const offset = bar * 16;

            // Basic backbeat
            pattern.kick[offset + 0] = 2;
            pattern.kick[offset + 8] = Math.random() < 0.7 ? 2 : 0;

            pattern.snare[offset + 4] = 2;
            pattern.snare[offset + 12] = 2;

            // 8th note hats
            for (let i = 0; i < 16; i += 2) {
                pattern.hihat[offset + i] = 1;
            }

            // Variation on last bar of 4
            if (bar % 4 === 3) {
                pattern.kick[offset + 10] = 1;
                pattern.snare[offset + 13] = 1;
            }
        }
    }

    function humanizePattern(pattern, amount) {
        // Add slight velocity variations
        for (const key of Object.keys(pattern)) {
            if (!Array.isArray(pattern[key])) continue;

            for (let i = 0; i < pattern[key].length; i++) {
                if (pattern[key][i] > 0) {
                    // Slight ghost note chance
                    if (Math.random() < amount * 0.2) {
                        pattern[key][i] = Math.max(1, pattern[key][i] - 1);
                    }
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GROOVE HUMANIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Humanize a mechanical pattern using GrooVAE or procedural
     * @param {Object} pattern - GUMP format pattern
     * @returns {Promise<Object>} Humanized pattern with timing offsets
     */
    async function humanizeWithGroove(pattern) {
        const model = await loadGrooveModel();

        if (model) {
            try {
                // Convert to Magenta format
                const magentaSeq = convertGumpToMagenta(pattern);

                // Apply groove
                const grooved = await model.encode(magentaSeq)
                    .then(z => model.decode(z));

                // Extract timing offsets
                return extractGrooveTimings(grooved, pattern);
            } catch (e) {
                console.warn('[MagentaEngine] GrooVAE failed:', e);
            }
        }

        // Procedural humanization fallback
        return proceduralHumanize(pattern);
    }

    function convertGumpToMagenta(pattern) {
        const notes = [];
        const stepsPerQuarter = 4;

        for (const [instrument, steps] of Object.entries(pattern)) {
            if (!Array.isArray(steps)) continue;

            const pitch = DRUM_MAPPING[instrument] || 36;

            for (let i = 0; i < steps.length; i++) {
                if (steps[i] > 0) {
                    notes.push({
                        pitch: pitch,
                        quantizedStartStep: i,
                        quantizedEndStep: i + 1,
                        velocity: steps[i] === 2 ? 100 : 70,
                        isDrum: true,
                    });
                }
            }
        }

        return {
            quantizationInfo: { stepsPerQuarter },
            notes: notes,
            totalQuantizedSteps: pattern.kick?.length || 32,
        };
    }

    function extractGrooveTimings(groovedSeq, originalPattern) {
        const timings = {};

        for (const key of Object.keys(originalPattern)) {
            if (!Array.isArray(originalPattern[key])) continue;
            timings[key] = new Array(originalPattern[key].length).fill(0);
        }

        // Extract micro-timing from grooved sequence
        if (groovedSeq && groovedSeq.notes) {
            for (const note of groovedSeq.notes) {
                const instrument = REVERSE_DRUM_MAPPING[note.pitch];
                if (instrument && timings[instrument]) {
                    const step = Math.round(note.quantizedStartStep);
                    if (step < timings[instrument].length) {
                        // Timing offset in ms (subtle swing)
                        timings[instrument][step] = (note.startTime - step * 0.125) * 1000;
                    }
                }
            }
        }

        return {
            pattern: originalPattern,
            timings: timings,
        };
    }

    function proceduralHumanize(pattern) {
        const timings = {};

        for (const key of Object.keys(pattern)) {
            if (!Array.isArray(pattern[key])) continue;

            timings[key] = pattern[key].map((val, i) => {
                if (val === 0) return 0;

                // Add swing to offbeat 16ths
                if (i % 2 === 1) {
                    return 10 + Math.random() * 20;  // 10-30ms late (swing)
                }

                // Slight random push/pull
                return (Math.random() - 0.5) * 10;  // ±5ms
            });
        }

        return {
            pattern: pattern,
            timings: timings,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STYLE MORPHING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Morph between two patterns
     * @param {Object} patternA - Source pattern
     * @param {Object} patternB - Target pattern
     * @param {number} amount - 0-1 blend amount
     * @returns {Object} Blended pattern
     */
    function morphPatterns(patternA, patternB, amount) {
        const result = {};

        for (const key of Object.keys(patternA)) {
            if (!Array.isArray(patternA[key])) {
                result[key] = patternA[key];
                continue;
            }

            const stepsA = patternA[key];
            const stepsB = patternB[key] || new Array(stepsA.length).fill(0);

            result[key] = stepsA.map((a, i) => {
                const b = stepsB[i] || 0;

                // Probabilistic blend
                if (a === b) return a;

                const threshold = amount;
                if (b > 0 && Math.random() < threshold) {
                    return b;
                }
                if (a > 0 && Math.random() < (1 - threshold)) {
                    return a;
                }

                return Math.random() < amount ? b : a;
            });
        }

        result.bars = patternA.bars || patternB.bars || 2;
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN LIBRARY FOR MUSICAL WORLDS
    // ═══════════════════════════════════════════════════════════════════════

    const WORLD_PATTERNS = {
        genesis: () => generateProceduralDrumPattern({ style: 'minimal', temperature: 0.2 }),
        tribal: () => generateProceduralDrumPattern({ style: 'tribal', temperature: 0.7 }),
        electronic: () => generateProceduralDrumPattern({ style: 'electronic', temperature: 0.5 }),
        jazz: () => generateProceduralDrumPattern({ style: 'jazz', temperature: 0.8 }),
        cinematic: () => generateProceduralDrumPattern({ style: 'cinematic', temperature: 0.6 }),
        chaos: () => generateProceduralDrumPattern({ style: 'chaos', temperature: 0.9 }),
        ambient: () => generateProceduralDrumPattern({ style: 'ambient', temperature: 0.3 }),
        trap: () => generateProceduralDrumPattern({ style: 'trap', temperature: 0.7 }),
    };

    function getPatternForWorld(worldName) {
        const generator = WORLD_PATTERNS[worldName] || WORLD_PATTERNS.genesis;
        return generator();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Initialization
        init,
        get isInitialized() { return state.initialized; },
        get isLoading() { return state.loading; },

        // Model loading
        loadDrumsModel,
        loadGrooveModel,

        // Drum generation
        generateDrumPattern,
        generateProceduralDrumPattern,

        // Humanization
        humanizeWithGroove,
        proceduralHumanize,

        // Morphing
        morphPatterns,

        // Musical Worlds
        getPatternForWorld,
        WORLD_PATTERNS,

        // Settings
        setTemperature: (t) => state.current.temperature = t,
        setBpm: (bpm) => state.current.qpm = bpm,

        // State access
        get state() { return state; },
    });

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpMagentaEngine;
}
