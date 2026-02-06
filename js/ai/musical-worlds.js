// ═══════════════════════════════════════════════════════════════════════════
// GUMP - MUSICAL WORLDS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
//
// Each combo unlocks a completely DIFFERENT sonic universe.
// Not subtle changes - DRAMATIC transformations.
//
// The music becomes living architecture that evolves with you.
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpMusicalWorlds = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // THE WORLDS - Each a complete sonic universe
    // ═══════════════════════════════════════════════════════════════════════

    const WORLDS = {
        // ─────────────────────────────────────────────────────────────────────
        // GENESIS - Where it all begins
        // ─────────────────────────────────────────────────────────────────────
        genesis: {
            name: 'Genesis',
            description: 'The void before creation. Sparse. Breathing.',
            colors: { primary: '#1a1a2e', accent: '#eee8d5', glow: '#fdf6e3' },

            music: {
                bpm: 60,
                root: 55,           // A1
                mode: 'aeolian',
                density: 0.1,       // Very sparse

                // What instruments are active
                layers: {
                    drums: false,
                    bass: false,
                    pad: true,
                    melody: false,
                    arp: false,
                },

                // Drum style when enabled
                drumStyle: 'minimal',
                drumPattern: null,

                // Synth characteristics
                synthType: 'sine',
                filterCutoff: 800,
                filterQ: 1,
                reverbMix: 0.7,
                delayMix: 0.5,

                // Dynamic response
                velocitySensitivity: 0.3,
                breathingRate: 0.08,    // Slow breath
            },

            // Transition sounds when entering
            transition: {
                type: 'fade',
                duration: 3000,
                sound: 'deep_drone',
            },
        },

        // ─────────────────────────────────────────────────────────────────────
        // PRIMORDIAL - First heartbeats
        // ─────────────────────────────────────────────────────────────────────
        primordial: {
            name: 'Primordial',
            description: 'The first pulse. Organic. Alive.',
            colors: { primary: '#1a3d2e', accent: '#a8d5ba', glow: '#c8e6c9' },

            music: {
                bpm: 72,
                root: 55,
                mode: 'dorian',
                density: 0.25,

                layers: {
                    drums: true,
                    bass: true,
                    pad: true,
                    melody: false,
                    arp: false,
                },

                drumStyle: 'tribal',
                synthType: 'triangle',
                filterCutoff: 1200,
                filterQ: 2,
                reverbMix: 0.6,
                delayMix: 0.3,

                velocitySensitivity: 0.5,
                breathingRate: 0.12,
            },

            transition: {
                type: 'build',
                duration: 2000,
                sound: 'heartbeat_swell',
            },
        },

        // ─────────────────────────────────────────────────────────────────────
        // TRIBAL - Ancient rituals
        // ─────────────────────────────────────────────────────────────────────
        tribal: {
            name: 'Tribal',
            description: 'Polyrhythms. Ceremony. Trance.',
            colors: { primary: '#2d1b0e', accent: '#d4a574', glow: '#f4a460' },

            music: {
                bpm: 90,
                root: 49,           // G1 - darker
                mode: 'phrygian',
                density: 0.5,

                layers: {
                    drums: true,
                    bass: true,
                    pad: true,
                    melody: false,
                    arp: true,
                },

                drumStyle: 'tribal',
                synthType: 'sawtooth',
                filterCutoff: 2000,
                filterQ: 3,
                reverbMix: 0.5,
                delayMix: 0.4,

                velocitySensitivity: 0.7,
                breathingRate: 0.15,
            },

            transition: {
                type: 'ritual',
                duration: 2500,
                sound: 'tribal_build',
            },
        },

        // ─────────────────────────────────────────────────────────────────────
        // CINEMATIC - Hans Zimmer territory
        // ─────────────────────────────────────────────────────────────────────
        cinematic: {
            name: 'Cinematic',
            description: 'Epic. Orchestral. THE BWAAAM.',
            colors: { primary: '#0d1b2a', accent: '#778da9', glow: '#e0e1dd' },

            music: {
                bpm: 85,
                root: 55,
                mode: 'minor',
                density: 0.6,

                layers: {
                    drums: true,
                    bass: true,
                    pad: true,
                    melody: true,
                    arp: true,
                },

                drumStyle: 'cinematic',
                synthType: 'supersaw',
                filterCutoff: 4000,
                filterQ: 1,
                reverbMix: 0.6,
                delayMix: 0.3,

                velocitySensitivity: 0.8,
                breathingRate: 0.1,
            },

            transition: {
                type: 'bwaaam',
                duration: 2000,
                sound: 'inception_hit',
            },
        },

        // ─────────────────────────────────────────────────────────────────────
        // ELECTRONIC - Future beats
        // ─────────────────────────────────────────────────────────────────────
        electronic: {
            name: 'Electronic',
            description: 'Synthesized. Precise. Future.',
            colors: { primary: '#0f0f23', accent: '#00d4ff', glow: '#00ffff' },

            music: {
                bpm: 128,
                root: 65,           // C2
                mode: 'minor',
                density: 0.7,

                layers: {
                    drums: true,
                    bass: true,
                    pad: true,
                    melody: true,
                    arp: true,
                },

                drumStyle: 'electronic',
                synthType: 'square',
                filterCutoff: 6000,
                filterQ: 5,
                reverbMix: 0.3,
                delayMix: 0.5,

                velocitySensitivity: 0.6,
                breathingRate: 0.2,
            },

            transition: {
                type: 'riser',
                duration: 1500,
                sound: 'synth_riser',
            },
        },

        // ─────────────────────────────────────────────────────────────────────
        // TRAP - Modern heat
        // ─────────────────────────────────────────────────────────────────────
        trap: {
            name: 'Trap',
            description: '808s. Rolling hats. Heavy.',
            colors: { primary: '#1a0a1a', accent: '#ff006e', glow: '#ff0080' },

            music: {
                bpm: 140,
                root: 36,           // C1 - SUB territory
                mode: 'minor',
                density: 0.65,

                layers: {
                    drums: true,
                    bass: true,
                    pad: false,
                    melody: true,
                    arp: true,
                },

                drumStyle: 'trap',
                synthType: 'sine',      // Clean for 808 bass
                filterCutoff: 800,
                filterQ: 8,
                reverbMix: 0.2,
                delayMix: 0.4,

                velocitySensitivity: 0.9,
                breathingRate: 0.25,
            },

            transition: {
                type: 'drop',
                duration: 1000,
                sound: '808_drop',
            },
        },

        // ─────────────────────────────────────────────────────────────────────
        // JAZZ - Smooth grooves
        // ─────────────────────────────────────────────────────────────────────
        jazz: {
            name: 'Jazz',
            description: 'Swing. Soul. Sophistication.',
            colors: { primary: '#1a1a1a', accent: '#ffd700', glow: '#ffec8b' },

            music: {
                bpm: 95,
                root: 55,
                mode: 'dorian',
                density: 0.45,

                layers: {
                    drums: true,
                    bass: true,
                    pad: true,
                    melody: true,
                    arp: false,
                },

                drumStyle: 'jazz',
                synthType: 'triangle',
                filterCutoff: 3000,
                filterQ: 2,
                reverbMix: 0.4,
                delayMix: 0.2,

                velocitySensitivity: 0.8,
                breathingRate: 0.12,
            },

            transition: {
                type: 'slide',
                duration: 2000,
                sound: 'jazz_chord',
            },
        },

        // ─────────────────────────────────────────────────────────────────────
        // AMBIENT - Floating
        // ─────────────────────────────────────────────────────────────────────
        ambient: {
            name: 'Ambient',
            description: 'Floating. Ethereal. Endless.',
            colors: { primary: '#0a0a1a', accent: '#a0a0ff', glow: '#c0c0ff' },

            music: {
                bpm: 60,
                root: 82,           // E2 - higher, floaty
                mode: 'lydian',
                density: 0.15,

                layers: {
                    drums: false,
                    bass: false,
                    pad: true,
                    melody: true,
                    arp: true,
                },

                drumStyle: 'ambient',
                synthType: 'sine',
                filterCutoff: 2000,
                filterQ: 1,
                reverbMix: 0.9,
                delayMix: 0.7,

                velocitySensitivity: 0.4,
                breathingRate: 0.06,
            },

            transition: {
                type: 'fade',
                duration: 4000,
                sound: 'shimmer',
            },
        },

        // ─────────────────────────────────────────────────────────────────────
        // CHAOS - The struggle phase
        // ─────────────────────────────────────────────────────────────────────
        chaos: {
            name: 'Chaos',
            description: 'Dissonance. Struggle. The test.',
            colors: { primary: '#2a0a0a', accent: '#ff3333', glow: '#ff0000' },

            music: {
                bpm: 110,
                root: 41,           // F1 - tritone from C
                mode: 'locrian',    // The dissonant mode
                density: 0.8,

                layers: {
                    drums: true,
                    bass: true,
                    pad: true,
                    melody: true,
                    arp: true,
                },

                drumStyle: 'chaos',
                synthType: 'sawtooth',
                filterCutoff: 3000,
                filterQ: 8,         // Resonant, harsh
                reverbMix: 0.4,
                delayMix: 0.6,

                velocitySensitivity: 1.0,
                breathingRate: 0.3,     // Fast, anxious breathing
            },

            transition: {
                type: 'crash',
                duration: 500,
                sound: 'chaos_hit',
            },
        },

        // ─────────────────────────────────────────────────────────────────────
        // TRANSCENDENCE - The ultimate reward
        // ─────────────────────────────────────────────────────────────────────
        transcendence: {
            name: 'Transcendence',
            description: 'Everything. Victory. Pure light.',
            colors: { primary: '#fdf6e3', accent: '#ffd700', glow: '#ffffff' },

            music: {
                bpm: 108,
                root: 73,           // D2 - bright
                mode: 'major',
                density: 0.75,

                layers: {
                    drums: true,
                    bass: true,
                    pad: true,
                    melody: true,
                    arp: true,
                },

                drumStyle: 'cinematic',
                synthType: 'supersaw',
                filterCutoff: 8000,     // WIDE OPEN
                filterQ: 1,
                reverbMix: 0.5,
                delayMix: 0.4,

                velocitySensitivity: 0.7,
                breathingRate: 0.1,
            },

            transition: {
                type: 'transcendence',
                duration: 3000,
                sound: 'full_orchestra',
            },
        },
    };

    // ═══════════════════════════════════════════════════════════════════════
    // COMBO → WORLD MAPPING
    // ═══════════════════════════════════════════════════════════════════════

    const COMBO_WORLDS = {
        // Cardinal combos
        'nsew': 'ambient',
        'diamond': 'ambient',

        // Corner combos
        'corners': 'cinematic',
        'l_nw': 'jazz',
        'l_ne': 'electronic',
        'l_sw': 'tribal',
        'l_se': 'trap',

        // Triangle combos
        'triangle_up': 'electronic',
        'triangle_down': 'ambient',
        'triangle_left': 'jazz',
        'triangle_right': 'trap',

        // Line combos
        'vertical_line': 'primordial',
        'horizontal_line': 'electronic',
        'diagonal_down': 'chaos',
        'diagonal_up': 'transcendence',

        // Span combos
        'north_span': 'ambient',
        'south_span': 'tribal',
        'west_span': 'jazz',
        'east_span': 'electronic',

        // Special combos
        'plus_small': 'cinematic',
        'outer_ring': 'chaos',
        'all_nine': 'transcendence',
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        currentWorld: 'genesis',
        previousWorld: null,
        transitioning: false,
        transitionProgress: 0,

        // Active resources
        activeVoices: [],
        activeDrumPattern: null,

        // Morphing state
        morphAmount: 0,
        morphTarget: null,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // WORLD TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Transition to a new musical world
     * @param {string} worldName - Name of the target world
     * @param {boolean} instant - Skip transition animation
     */
    function transitionToWorld(worldName, instant = false) {
        const targetWorld = WORLDS[worldName];
        if (!targetWorld) {
            console.warn(`[MusicalWorlds] Unknown world: ${worldName}`);
            return false;
        }

        if (worldName === state.currentWorld && !instant) {
            return false;  // Already there
        }

        console.log(`[MusicalWorlds] Transitioning: ${state.currentWorld} → ${worldName}`);

        state.previousWorld = state.currentWorld;
        state.transitioning = true;
        state.morphTarget = worldName;

        // Play transition sound
        playTransitionSound(targetWorld.transition);

        // Start the morph
        if (instant) {
            applyWorld(worldName);
            state.transitioning = false;
        } else {
            morphToWorld(worldName, targetWorld.transition.duration);
        }

        // Emit event
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit?.('world.change', {
                from: state.previousWorld,
                to: worldName,
                world: targetWorld,
            });
        }

        return true;
    }

    function morphToWorld(worldName, duration) {
        const startTime = Date.now();
        const fromWorld = WORLDS[state.currentWorld];
        const toWorld = WORLDS[worldName];

        function morphStep() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);

            state.transitionProgress = progress;
            state.morphAmount = easeInOutCubic(progress);

            // Interpolate music parameters
            applyMorphedParameters(fromWorld, toWorld, state.morphAmount);

            if (progress < 1) {
                requestAnimationFrame(morphStep);
            } else {
                // Transition complete
                state.currentWorld = worldName;
                state.transitioning = false;
                state.morphAmount = 0;
                state.morphTarget = null;

                // Generate new drum pattern for this world
                generateWorldDrumPattern(worldName);

                console.log(`[MusicalWorlds] Now in: ${worldName}`);
            }
        }

        requestAnimationFrame(morphStep);
    }

    function applyMorphedParameters(fromWorld, toWorld, amount) {
        // Interpolate all music parameters
        const from = fromWorld.music;
        const to = toWorld.music;

        // BPM
        const bpm = lerp(from.bpm, to.bpm, amount);
        if (typeof setAITempo === 'function') {
            setAITempo(bpm);
        }

        // Root note (logarithmic interpolation for frequency)
        const root = Math.exp(lerp(Math.log(from.root), Math.log(to.root), amount));
        if (typeof GumpState !== 'undefined') {
            GumpState.set?.('music.root', root);
        }

        // Filter parameters
        const filterCutoff = lerp(from.filterCutoff, to.filterCutoff, amount);
        const filterQ = lerp(from.filterQ, to.filterQ, amount);

        if (typeof GumpAudio !== 'undefined') {
            GumpAudio.setMasterFilter?.(filterCutoff, filterQ);
        }

        // Effects mix
        const reverbMix = lerp(from.reverbMix, to.reverbMix, amount);
        const delayMix = lerp(from.delayMix, to.delayMix, amount);

        if (typeof GumpEffects !== 'undefined') {
            GumpEffects.setReverbMix?.(reverbMix);
            GumpEffects.setDelayMix?.(delayMix);
        }

        // Update visual colors (emit for renderer)
        const colors = interpolateColors(fromWorld.colors, toWorld.colors, amount);
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit?.('world.colors', colors);
        }
    }

    function applyWorld(worldName) {
        const world = WORLDS[worldName];
        if (!world) return;

        state.currentWorld = worldName;
        const music = world.music;

        // Apply all parameters immediately
        if (typeof setAITempo === 'function') {
            setAITempo(music.bpm);
        }

        if (typeof GumpState !== 'undefined') {
            GumpState.set?.('music.root', music.root);
            GumpState.set?.('music.mode', music.mode);
            GumpState.set?.('music.density', music.density);
        }

        if (typeof GumpAudio !== 'undefined') {
            GumpAudio.setMasterFilter?.(music.filterCutoff, music.filterQ);
        }

        if (typeof GumpEffects !== 'undefined') {
            GumpEffects.setReverbMix?.(music.reverbMix);
            GumpEffects.setDelayMix?.(music.delayMix);
        }

        // Generate drum pattern
        generateWorldDrumPattern(worldName);

        // Emit color event
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit?.('world.colors', world.colors);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DRUM PATTERN GENERATION
    // ═══════════════════════════════════════════════════════════════════════

    async function generateWorldDrumPattern(worldName) {
        const world = WORLDS[worldName];
        if (!world) return null;

        const style = world.music.drumStyle;
        let pattern;

        // Try AI generation first
        if (typeof GumpMagentaEngine !== 'undefined') {
            try {
                pattern = await GumpMagentaEngine.generateDrumPattern({
                    style: style,
                    bars: 4,
                    temperature: world.music.density,
                });
            } catch (e) {
                console.warn('[MusicalWorlds] AI pattern generation failed:', e);
            }
        }

        // Fallback to procedural
        if (!pattern && typeof GumpMagentaEngine !== 'undefined') {
            pattern = GumpMagentaEngine.generateProceduralDrumPattern({
                style: style,
                bars: 4,
                temperature: world.music.density,
            });
        }

        if (pattern) {
            state.activeDrumPattern = pattern;

            // Send to drum mind if available
            if (typeof GumpEvents !== 'undefined') {
                GumpEvents.emit?.('drums.pattern', {
                    pattern: pattern,
                    world: worldName,
                    style: style,
                });
            }
        }

        return pattern;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSITION SOUNDS
    // ═══════════════════════════════════════════════════════════════════════

    function playTransitionSound(transition) {
        if (typeof GumpAudio === 'undefined') return;

        const ctx = GumpAudio.context;
        if (!ctx) return;

        switch (transition.type) {
            case 'bwaaam':
                playBwaaamTransition(ctx);
                break;
            case 'drop':
                playDropTransition(ctx);
                break;
            case 'riser':
                playRiserTransition(ctx, transition.duration);
                break;
            case 'fade':
                playFadeTransition(ctx, transition.duration);
                break;
            case 'crash':
                playCrashTransition(ctx);
                break;
            case 'transcendence':
                playTranscendenceTransition(ctx);
                break;
            case 'ritual':
                playRitualTransition(ctx);
                break;
            case 'build':
                playBuildTransition(ctx, transition.duration);
                break;
            default:
                // Generic transition
                playGenericTransition(ctx);
        }
    }

    function playBwaaamTransition(ctx) {
        const now = ctx.currentTime;

        // THE BWAAAM - Inception style
        // Sub bass
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = 30;

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.8, now + 0.1);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 2);

        // Brass stabs (detuned saws)
        const brass1 = ctx.createOscillator();
        const brass2 = ctx.createOscillator();
        const brass3 = ctx.createOscillator();

        brass1.type = brass2.type = brass3.type = 'sawtooth';
        brass1.frequency.value = 55;
        brass2.frequency.value = 55 * 1.005;  // Detuned
        brass3.frequency.value = 55 * 0.995;

        const brassGain = ctx.createGain();
        brassGain.gain.setValueAtTime(0, now);
        brassGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        brassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        // Highpass for brass
        const brassHP = ctx.createBiquadFilter();
        brassHP.type = 'highpass';
        brassHP.frequency.value = 100;

        // Connect
        sub.connect(subGain);
        subGain.connect(GumpAudio.output || ctx.destination);

        brass1.connect(brassGain);
        brass2.connect(brassGain);
        brass3.connect(brassGain);
        brassGain.connect(brassHP);
        brassHP.connect(GumpAudio.output || ctx.destination);

        // Start
        sub.start(now);
        brass1.start(now);
        brass2.start(now);
        brass3.start(now);

        sub.stop(now + 2.5);
        brass1.stop(now + 2);
        brass2.stop(now + 2);
        brass3.stop(now + 2);

        // Haptic
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 200]);
        }
    }

    function playDropTransition(ctx) {
        const now = ctx.currentTime;

        // 808 drop
        if (typeof GumpDrums !== 'undefined') {
            GumpDrums.play808Deep?.({ volume: 1.0 });
        } else {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1);

            osc.connect(gain);
            gain.connect(GumpAudio.output || ctx.destination);

            osc.start(now);
            osc.stop(now + 1.5);
        }

        if (navigator.vibrate) {
            navigator.vibrate([150]);
        }
    }

    function playRiserTransition(ctx, duration) {
        const now = ctx.currentTime;
        const dur = duration / 1000;

        // Noise riser
        const bufferSize = ctx.sampleRate * dur;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(8000, now + dur);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.3, now + dur * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(GumpAudio.output || ctx.destination);

        noise.start(now);
        noise.stop(now + dur);
    }

    function playFadeTransition(ctx, duration) {
        // Gentle pad swell
        const now = ctx.currentTime;
        const dur = duration / 1000;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 110;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + dur * 0.5);
        gain.gain.linearRampToValueAtTime(0, now + dur);

        osc.connect(gain);
        gain.connect(GumpAudio.output || ctx.destination);

        osc.start(now);
        osc.stop(now + dur + 0.1);
    }

    function playCrashTransition(ctx) {
        const now = ctx.currentTime;

        // Dissonant crash
        [1, 1.41, 2.67, 3.14].forEach(ratio => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 200 * ratio;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.connect(gain);
            gain.connect(GumpAudio.output || ctx.destination);

            osc.start(now);
            osc.stop(now + 0.6);
        });

        if (navigator.vibrate) {
            navigator.vibrate([50, 20, 50, 20, 50]);
        }
    }

    function playTranscendenceTransition(ctx) {
        const now = ctx.currentTime;

        // Full major chord stack
        const root = 73;  // D2
        const ratios = [1, 1.26, 1.5, 2, 2.52, 3, 4];  // Major + octaves

        ratios.forEach((ratio, i) => {
            const osc = ctx.createOscillator();
            osc.type = i < 3 ? 'sawtooth' : 'sine';
            osc.frequency.value = root * ratio;

            const gain = ctx.createGain();
            const vol = 0.15 / (i + 1);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.3);
            gain.gain.linearRampToValueAtTime(vol * 0.5, now + 2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 4);

            osc.connect(gain);
            gain.connect(GumpAudio.output || ctx.destination);

            osc.start(now);
            osc.stop(now + 4.5);
        });

        // Also trigger BWAAAM
        setTimeout(() => playBwaaamTransition(ctx), 200);

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 300]);
        }
    }

    function playRitualTransition(ctx) {
        const now = ctx.currentTime;

        // Deep drum hits
        [0, 300, 500, 700].forEach((delay, i) => {
            setTimeout(() => {
                if (typeof GumpDrums !== 'undefined') {
                    GumpDrums.playTribalKick?.({ volume: 0.6 + i * 0.1 });
                }
            }, delay);
        });
    }

    function playBuildTransition(ctx, duration) {
        const now = ctx.currentTime;
        const dur = duration / 1000;

        // Heartbeat swell
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 50;

        const gain = ctx.createGain();
        // Pulsing gain
        const pulseRate = 1.2;
        gain.gain.setValueAtTime(0, now);

        for (let t = 0; t < dur; t += 1 / pulseRate) {
            const intensity = t / dur;
            gain.gain.linearRampToValueAtTime(0.3 * intensity, now + t);
            gain.gain.linearRampToValueAtTime(0.1 * intensity, now + t + 0.3);
        }
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(GumpAudio.output || ctx.destination);

        osc.start(now);
        osc.stop(now + dur + 0.1);
    }

    function playGenericTransition(ctx) {
        // Simple confirmation tone
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 440;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(GumpAudio.output || ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function interpolateColors(fromColors, toColors, amount) {
        const result = {};
        for (const key of Object.keys(fromColors)) {
            const from = hexToRgb(fromColors[key]);
            const to = hexToRgb(toColors[key] || fromColors[key]);

            const r = Math.round(lerp(from.r, to.r, amount));
            const g = Math.round(lerp(from.g, to.g, amount));
            const b = Math.round(lerp(from.b, to.b, amount));

            result[key] = `rgb(${r}, ${g}, ${b})`;
        }
        return result;
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMBO INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Handle a combo unlock and transition to appropriate world
     * @param {string} comboId - The combo that was unlocked
     */
    function handleComboUnlock(comboId) {
        const worldName = COMBO_WORLDS[comboId];
        if (worldName) {
            transitionToWorld(worldName);
            return true;
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // World data
        WORLDS,
        COMBO_WORLDS,

        // State
        get currentWorld() { return state.currentWorld; },
        get isTransitioning() { return state.transitioning; },
        get transitionProgress() { return state.transitionProgress; },
        get activeDrumPattern() { return state.activeDrumPattern; },

        // Actions
        transitionToWorld,
        applyWorld,
        handleComboUnlock,

        // Drum patterns
        generateWorldDrumPattern,

        // Utilities
        getWorld: (name) => WORLDS[name],
        getWorldForCombo: (comboId) => COMBO_WORLDS[comboId],
    });

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpMusicalWorlds;
}
