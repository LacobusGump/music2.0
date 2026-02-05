// ═══════════════════════════════════════════════════════════════════════════
// GUMP - THE EMERGENCE
// ═══════════════════════════════════════════════════════════════════════════
//
// Main application entry point.
// Orchestrates all systems: grid, patterns, audio, unlocks, visuals.
//
// ═══════════════════════════════════════════════════════════════════════════

const GUMP = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // APPLICATION STATE
    // ═══════════════════════════════════════════════════════════════════════

    const app = {
        isInitialized: false,
        isRunning: false,
        isPaused: false,

        // Timing
        lastTime: 0,
        deltaTime: 0,
        elapsedTime: 0,
        frameCount: 0,

        // Canvas
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        dpr: 1,

        // Input
        inputMode: 'mouse',  // mouse, touch, motion
        hasMotion: false,
        hasMic: false,

        // Position (normalized 0-1)
        x: 0.5,
        y: 0.5,
        targetX: 0.5,
        targetY: 0.5,

        // Velocity
        vx: 0,
        vy: 0,

        // Debug
        debugMode: false,
        showFPS: false,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL EVOLUTION SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    //
    // The music evolves the longer you play. Start sparse, end cinematic.
    // Inspired by Hans Zimmer - whisper to ROAR.
    //

    const evolution = {
        // Session progression
        sessionTime: 0,
        phase: 0,  // 0=awakening, 1=discovery, 2=journey, 3=transcendence

        // Intensity builds with sustained activity
        intensity: 0,
        peakIntensity: 0,
        intensityVelocity: 0,

        // Harmonic state
        currentChord: 0,  // Index into progression
        chordProgress: 0,
        rootNote: 55,  // A1

        // The chord progression (i - IV - v - I in A minor = Am - D - Em - A)
        progression: [0, 5, 7, 0],  // Semitones from root
        chordQualities: ['minor', 'major', 'minor', 'major'],

        // Breathing
        breathPhase: 0,
        breathRate: 0.15,  // Cycles per second

        // Layers that unlock over time
        layers: {
            melody: false,      // Unlocks at phase 1
            harmony: false,     // Unlocks at phase 1
            bass: false,        // Unlocks at phase 2
            rhythm: false,      // Unlocks at phase 2
            orchestral: false,  // Unlocks at phase 3
        },

        // Gesture tracking
        gestureBuffer: [],
        lastGestureTime: 0,

        // Easter egg tracking
        zonesVisited: new Set(),
        zoneVisitOrder: [],
        lastZoneVisitTime: 0,
        cornerSequence: [],
        stillnessTime: 0,
        shakeIntensity: 0,
        circleProgress: 0,

        // Easter egg states
        easterEggs: {
            journeyComplete: false,
            meditationMode: false,
            orbitMode: false,
            earthquakeTriggered: false,
            infinityMode: false,
            ritualComplete: false,
        },

        // Call and response
        systemCalling: false,
        callTime: 0,
        lastResponseTime: 0,
        dialogueCount: 0,
    };

    // Phase thresholds (in seconds)
    const PHASE_THRESHOLDS = [0, 30, 120, 300];  // 0s, 30s, 2min, 5min
    const PHASE_NAMES = ['awakening', 'discovery', 'journey', 'transcendence'];

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function init() {
        if (app.isInitialized) {
            return true;
        }

        console.log('Initializing GUMP...');

        try {
            setupCanvas();
            setupInput();
            setupEventListeners();
            GumpState.startSession();

            // Initialize audio (don't let failure stop the app)
            try {
                const audioInitialized = await GumpAudio.init();
                if (audioInitialized) {
                    GumpDrums.init(GumpAudio.context, GumpAudio.channels.drums);
                    GumpBass.init(GumpAudio.context, GumpAudio.channels.bass);
                }
            } catch (audioError) {
                console.error('Audio init failed:', audioError);
            }

            app.isInitialized = true;
            console.log('GUMP initialized');
            return true;

        } catch (error) {
            console.error('Failed to initialize GUMP:', error);
            return false;
        }
    }

    function setupCanvas() {
        app.canvas = document.getElementById('c');
        app.ctx = app.canvas.getContext('2d');

        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        app.dpr = window.devicePixelRatio || 1;
        app.width = window.innerWidth;
        app.height = window.innerHeight;

        app.canvas.width = app.width * app.dpr;
        app.canvas.height = app.height * app.dpr;
        app.canvas.style.width = app.width + 'px';
        app.canvas.style.height = app.height + 'px';

        app.ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0);
    }

    function setupInput() {
        const canvas = app.canvas;

        // Mouse
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mouseup', onMouseUp);

        // Touch
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd, { passive: false });

        // Motion
        if (window.DeviceMotionEvent) {
            // Check for iOS permission requirement
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                // Will request on first interaction
            } else {
                window.addEventListener('devicemotion', onDeviceMotion);
                app.hasMotion = true;
            }
        }
    }

    async function requestMotionPermission() {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('devicemotion', onDeviceMotion);
                    app.hasMotion = true;
                    return true;
                }
            } catch (error) {
                console.error('Motion permission denied:', error);
            }
        }
        return false;
    }

    function setupEventListeners() {
        // Pattern detected
        GumpEvents.on('pattern.detected', onPatternDetected);

        // Zone threshold reached
        GumpEvents.on('zone.threshold', onZoneThreshold);

        // Unlock events
        GumpEvents.on('unlock.complete', onUnlock);
        GumpEvents.on('unlock.activate', onUnlockActivate);
        GumpEvents.on('unlock.deactivate', onUnlockDeactivate);

        // Era change
        GumpEvents.on('era.change', onEraChange);

        // Music events
        GumpEvents.on('music.beat', onBeat);
        GumpEvents.on('music.bar', onBar);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INPUT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function onMouseMove(e) {
        app.inputMode = 'mouse';
        app.targetX = e.clientX / app.width;
        app.targetY = e.clientY / app.height;
    }

    function onMouseDown(e) {
        // Could trigger special actions
    }

    function onMouseUp(e) {
        // Could trigger special actions
    }

    function onTouchStart(e) {
        e.preventDefault();
        app.inputMode = 'touch';

        if (e.touches.length > 0) {
            app.targetX = e.touches[0].clientX / app.width;
            app.targetY = e.touches[0].clientY / app.height;
        }

        // Request motion permission on first touch (iOS)
        if (!app.hasMotion && typeof DeviceMotionEvent.requestPermission === 'function') {
            requestMotionPermission();
        }
    }

    function onTouchMove(e) {
        e.preventDefault();

        if (e.touches.length > 0) {
            app.targetX = e.touches[0].clientX / app.width;
            app.targetY = e.touches[0].clientY / app.height;
        }
    }

    function onTouchEnd(e) {
        e.preventDefault();
    }

    function onDeviceMotion(e) {
        const accel = e.accelerationIncludingGravity;
        if (!accel) return;

        app.inputMode = 'motion';

        // Convert acceleration to position
        // ax: left/right tilt, ay: forward/back tilt
        const ax = (accel.x || 0) / 10;
        const ay = (accel.y || 0) / 10;

        // Map to 0-1 range
        app.targetX = Math.max(0, Math.min(1, 0.5 + ax * 0.8));
        app.targetY = Math.max(0, Math.min(1, 0.5 - ay * 0.8));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function onPatternDetected(data) {
        const { pattern, confidence } = data;

        console.log(`Pattern: ${pattern.id} (${(confidence * 100).toFixed(0)}%)`);

        // Trigger musical response based on pattern
        triggerPatternResponse(pattern, data);
    }

    function onZoneThreshold(data) {
        const { zone, threshold } = data;

        console.log(`Zone ${zone} reached ${threshold}`);

        // Trigger zone-specific sounds
        triggerZoneSound(zone, threshold);
    }

    function onUnlock(data) {
        const { id, unlock } = data;

        console.log(`Unlocked: ${unlock.name}`);

        // Flash visual feedback
        flashUnlock(unlock);

        // Activate the sound
        GumpUnlocks.activateUnlock(id);
    }

    function onUnlockActivate(data) {
        const { id } = data;
        const unlock = GumpUnlocks.getUnlock(id);

        if (unlock && unlock.sound) {
            activateUnlockSound(id, unlock);
        }
    }

    function onUnlockDeactivate(data) {
        const { id } = data;
        deactivateUnlockSound(id);
    }

    function onEraChange(data) {
        const { from, to } = data;

        console.log(`Era change: ${from} -> ${to}`);

        // Update visuals
        updateEraVisuals(to);

        // Trigger era transition sound
        triggerEraTransition(from, to);
    }

    function onBeat(data) {
        const { beat, bar } = data;

        // Pulse visual on beat
        if (beat === 0) {
            // Downbeat - stronger pulse
        }
    }

    function onBar(data) {
        const { bar } = data;

        // Check for bar-based patterns
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SHAPE-BASED MUSIC LAYER SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Each shape you trace UNLOCKS a persistent musical layer.
    // More shapes = richer music. This IS Music 2.0.
    //

    const musicLayers = {
        // Layer states
        active: new Set(),
        voices: new Map(),  // layerId -> voice/interval

        // Root note (A2 = 110Hz)
        root: 110,

        // Chord progression state
        chordIndex: 0,
        progression: [
            { root: 0, type: 'minor' },      // Am
            { root: 5, type: 'major' },      // D
            { root: 7, type: 'minor' },      // Em
            { root: 0, type: 'major' },      // A
        ],

        // Layer definitions - SHAPES unlock these
        definitions: {
            // PATH patterns unlock basic textures
            'path_horizontal': { layer: 'pad_filter', name: 'Filter Pad' },
            'path_vertical': { layer: 'pad_pitch', name: 'Pitch Pad' },
            'path_up': { layer: 'arp_up', name: 'Rising Arp' },
            'path_down': { layer: 'arp_down', name: 'Falling Arp' },

            // SHAPE patterns unlock rich layers
            'shape_triangle_top': { layer: 'triad', name: 'Triad' },
            'shape_triangle_down': { layer: 'triad_inv', name: 'Inverted Triad' },
            'shape_square': { layer: 'progression', name: 'Chord Progression', triggerBWAAAM: true },
            'shape_cross_plus': { layer: 'rhythm', name: 'Rhythm' },
            'shape_cross_x': { layer: 'counter_rhythm', name: 'Counter Rhythm' },
            'shape_circle_cw': { layer: 'build', name: 'Build' },
            'shape_circle_ccw': { layer: 'release', name: 'Release' },
            'shape_figure_8': { layer: 'infinity', name: 'Infinity Drone' },
            'shape_spiral_in': { layer: 'focus', name: 'Focus' },
            'shape_spiral_out': { layer: 'expand', name: 'Expansion' },

            // SPECIAL patterns unlock cinematic elements
            'special_pendulum_ns': { layer: 'pendulum_bass', name: 'Pendulum Bass' },
            'special_pendulum_ew': { layer: 'pendulum_filter', name: 'Pendulum Filter' },
            'special_star': { layer: 'starburst', name: 'Starburst', triggerBWAAAM: true },

            // COMBO patterns unlock the full orchestra - THE BIG MOMENTS
            'combo_corners_all': { layer: 'full_pad', name: 'Full Pad', triggerBWAAAM: true },
            'combo_edges_all': { layer: 'full_rhythm', name: 'Full Rhythm', triggerBWAAAM: true },
            'combo_all_zones': { layer: 'transcendence', name: 'Transcendence', triggerTranscendence: true },
        },
    };

    // Track active sounds per unlock
    const activeSounds = new Map();

    function triggerPatternResponse(pattern, data) {
        const patternId = pattern.id;
        const layerDef = musicLayers.definitions[patternId];

        if (layerDef) {
            // Check for BWAAAM trigger (the big moment)
            if (layerDef.triggerBWAAAM) {
                triggerTheBWAAAM();
            }

            // Check for transcendence trigger
            if (layerDef.triggerTranscendence) {
                triggerTranscendence();
            }

            if (!musicLayers.active.has(layerDef.layer)) {
                // NEW LAYER UNLOCKED
                unlockMusicLayer(layerDef.layer, layerDef.name);
            }
        }

        // Also trigger immediate response based on pattern type
        triggerImmediatePatternSound(pattern, data);
    }

    function unlockMusicLayer(layerId, layerName) {
        if (musicLayers.active.has(layerId)) return;

        console.log(`LAYER UNLOCKED: ${layerName}`);
        musicLayers.active.add(layerId);

        // Start the persistent layer sound
        startMusicLayer(layerId);

        // Visual/audio feedback for unlock
        playLayerUnlockFanfare(layerId);
    }

    function startMusicLayer(layerId) {
        const root = musicLayers.root;

        switch (layerId) {
            case 'pad_filter':
                // Slow filter sweep pad
                startFilterPad(root);
                break;

            case 'pad_pitch':
                // Pitch-shifting pad
                startPitchPad(root);
                break;

            case 'arp_up':
                // Rising arpeggiator
                startArpeggiator(root, 'up');
                break;

            case 'arp_down':
                // Falling arpeggiator
                startArpeggiator(root, 'down');
                break;

            case 'triad':
                // Basic triad layer
                startTriadLayer(root, 'root');
                break;

            case 'triad_inv':
                // Inverted triad
                startTriadLayer(root, 'first');
                break;

            case 'progression':
                // Full chord progression
                startProgressionLayer(root);
                break;

            case 'rhythm':
                // Rhythmic pulse
                startRhythmLayer(root);
                break;

            case 'counter_rhythm':
                // Counter rhythm
                startCounterRhythmLayer(root);
                break;

            case 'build':
                // Building tension
                startBuildLayer(root);
                break;

            case 'infinity':
                // Infinite sustaining drone
                startInfinityDrone(root);
                break;

            case 'pendulum_bass':
                // Oscillating bass
                startPendulumBass(root);
                break;

            case 'starburst':
                // Starburst effect
                triggerStarburst(root);
                break;

            case 'full_pad':
                // Full orchestral pad
                startFullPad(root);
                break;

            case 'transcendence':
                // Everything at once
                triggerTranscendence(root);
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER IMPLEMENTATIONS - CINEMATIC SOUNDS
    // ═══════════════════════════════════════════════════════════════════════

    function startFilterPad(root) {
        // Rich, evolving pad with filter movement
        const voice = GumpAudio.createVoice?.('supersaw', {
            freq: root,
            voices: 7,
            detune: 15,
            volume: 0.15,
            attack: 2,
            filterFreq: 800,
        });

        if (voice) {
            musicLayers.voices.set('pad_filter', voice);
        }

        // Also play a one-shot pad swell
        GumpAudio.playChord?.(root, [0, 7, 12], 8, {
            volume: 0.2,
            attack: 2,
            release: 4,
            waveform: 'sawtooth',
            channel: 'pads',
        });
    }

    function startPitchPad(root) {
        GumpAudio.playChord?.(root * 2, [0, 4, 7], 10, {
            volume: 0.15,
            attack: 3,
            release: 5,
            waveform: 'triangle',
            channel: 'pads',
        });
    }

    function startArpeggiator(root, direction) {
        const notes = direction === 'up' ? [0, 4, 7, 12, 16, 12, 7, 4] : [16, 12, 7, 4, 0, 4, 7, 12];
        let noteIndex = 0;

        const interval = setInterval(() => {
            if (!musicLayers.active.has(direction === 'up' ? 'arp_up' : 'arp_down')) {
                clearInterval(interval);
                return;
            }

            const semitone = notes[noteIndex];
            const freq = root * 2 * Math.pow(2, semitone / 12);

            GumpAudio.playTone?.(freq, 0.2, {
                volume: 0.2,
                attack: 0.01,
                release: 0.15,
            });

            noteIndex = (noteIndex + 1) % notes.length;
        }, 150);

        musicLayers.voices.set(direction === 'up' ? 'arp_up' : 'arp_down', interval);
    }

    function startTriadLayer(root, inversion) {
        const intervals = inversion === 'root' ? [0, 4, 7] : [4, 7, 12];

        GumpAudio.playChord?.(root, intervals, 6, {
            volume: 0.2,
            attack: 1,
            release: 3,
            waveform: 'sawtooth',
        });

        // Add shimmer
        GumpAudio.playChord?.(root * 4, [0, 4, 7], 5, {
            volume: 0.08,
            attack: 2,
            release: 3,
        });
    }

    function startProgressionLayer(root) {
        let chordIndex = 0;

        const playNextChord = () => {
            if (!musicLayers.active.has('progression')) return;

            const chord = musicLayers.progression[chordIndex];
            const chordRoot = root * Math.pow(2, chord.root / 12);
            const intervals = chord.type === 'major' ? [0, 4, 7] : [0, 3, 7];

            // Rich chord voicing
            GumpAudio.playChord?.(chordRoot, intervals, 3.5, {
                volume: 0.25,
                attack: 0.5,
                release: 2,
                waveform: 'sawtooth',
                channel: 'pads',
            });

            // Bass note
            GumpBass.playSubBass?.({ freq: chordRoot / 2, duration: 3, volume: 0.3 });

            chordIndex = (chordIndex + 1) % musicLayers.progression.length;

            // Schedule next chord
            setTimeout(playNextChord, 4000);
        };

        playNextChord();
        musicLayers.voices.set('progression', true);
    }

    function startRhythmLayer(root) {
        let beat = 0;

        const interval = setInterval(() => {
            if (!musicLayers.active.has('rhythm')) {
                clearInterval(interval);
                return;
            }

            // 4-on-the-floor with variations
            if (beat % 4 === 0) {
                GumpDrums.playOrganicKick?.({ volume: 0.5 });
            }
            if (beat % 4 === 2) {
                GumpDrums.playSnare808?.({ volume: 0.3 });
            }
            if (beat % 2 === 1) {
                GumpDrums.playHiHat?.({ type: 'closed', volume: 0.2 });
            }

            beat++;
        }, 250); // 240 BPM in 16ths = 60 BPM

        musicLayers.voices.set('rhythm', interval);
    }

    function startCounterRhythmLayer(root) {
        let beat = 0;

        const interval = setInterval(() => {
            if (!musicLayers.active.has('counter_rhythm')) {
                clearInterval(interval);
                return;
            }

            // Off-beat hits
            if (beat % 4 === 1 || beat % 4 === 3) {
                GumpDrums.playClick?.({ volume: 0.25 });
            }
            if (beat % 8 === 3) {
                GumpDrums.playClap?.({ volume: 0.3 });
            }

            beat++;
        }, 250);

        musicLayers.voices.set('counter_rhythm', interval);
    }

    function startBuildLayer(root) {
        // Rising tension - filter opens, volume builds
        GumpAudio.setFilterCutoff?.(200, 0);

        let buildPhase = 0;
        const interval = setInterval(() => {
            if (!musicLayers.active.has('build') || buildPhase > 100) {
                clearInterval(interval);
                return;
            }

            const filterFreq = 200 + buildPhase * 80;
            GumpAudio.setFilterCutoff?.(filterFreq, 0.1);

            if (buildPhase % 10 === 0) {
                GumpAudio.playTone?.(root * (1 + buildPhase / 100), 0.3, {
                    volume: 0.1 + buildPhase / 500,
                    attack: 0.01,
                });
            }

            buildPhase++;
        }, 100);

        musicLayers.voices.set('build', interval);
    }

    function startInfinityDrone(root) {
        // Endless sustaining harmonics
        const harmonics = [1, 1.5, 2, 3, 4];

        harmonics.forEach((ratio, i) => {
            GumpAudio.playTone?.(root * ratio, 30, {
                volume: 0.1 / (i + 1),
                attack: 3,
                release: 5,
                waveform: i === 0 ? 'sawtooth' : 'sine',
            });
        });
    }

    function startPendulumBass(root) {
        let phase = 0;

        const interval = setInterval(() => {
            if (!musicLayers.active.has('pendulum_bass')) {
                clearInterval(interval);
                return;
            }

            // Oscillate between root and fifth
            const freq = phase % 2 === 0 ? root / 2 : root / 2 * 1.5;
            GumpBass.playSubBass?.({ freq, duration: 0.8, volume: 0.35 });

            phase++;
        }, 1000);

        musicLayers.voices.set('pendulum_bass', interval);
    }

    function triggerStarburst(root) {
        // Explosion of notes in all directions
        const notes = [0, 2, 4, 5, 7, 9, 11, 12];

        notes.forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * 2 * Math.pow(2, semitone / 12);
                GumpAudio.playTone?.(freq, 0.4, {
                    volume: 0.25,
                    attack: 0.01,
                    release: 0.3,
                });
            }, i * 50);
        });

        // Impact
        GumpDrums.play808Deep?.({ volume: 0.7 });
    }

    function startFullPad(root) {
        // Massive orchestral pad - multiple octaves
        [-1, 0, 1, 2].forEach(octave => {
            const freq = root * Math.pow(2, octave);
            GumpAudio.playChord?.(freq, [0, 4, 7], 15, {
                volume: 0.1,
                attack: 4,
                release: 6,
                waveform: 'sawtooth',
            });
        });
    }

    function triggerTranscendence(root) {
        console.log('TRANSCENDENCE ACHIEVED');

        // THE ULTIMATE MOMENT - triggers THE BWAAAM
        triggerTheBWAAAM();

        // Then build the full orchestra on top
        setTimeout(() => {
            // Massive chord stack
            [-1, 0, 1, 2, 3].forEach((octave, i) => {
                setTimeout(() => {
                    const freq = root * Math.pow(2, octave);
                    GumpAudio.playChord?.(freq, [0, 4, 7, 11], 8, {
                        volume: 0.15,
                        attack: 0.5 + i * 0.5,
                        release: 4,
                        waveform: 'sawtooth',
                    });
                }, i * 200);
            });
        }, 500);
    }

    function playLayerUnlockFanfare(layerId) {
        const root = musicLayers.root * 2;

        // Quick ascending notes
        [0, 4, 7, 12].forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * Math.pow(2, semitone / 12);
                GumpAudio.playTone?.(freq, 0.2, {
                    volume: 0.3,
                    attack: 0.01,
                    release: 0.15,
                });
            }, i * 80);
        });
    }

    function triggerImmediatePatternSound(pattern, data) {
        const musical = pattern.musical;
        if (!musical) return;

        // Quick immediate feedback based on pattern type
        switch (musical.effect) {
            case 'filter_sweep':
            case 'filter_open':
                GumpAudio.setFilterCutoff?.(4000, 0.3);
                break;
            case 'filter_close':
                GumpAudio.setFilterCutoff?.(500, 0.3);
                break;
            case 'ascend':
                playQuickScale(musicLayers.root * 2, 'up');
                break;
            case 'descend':
                playQuickScale(musicLayers.root * 2, 'down');
                break;
            case 'drop':
                GumpDrums.play808Deep?.({ volume: 0.8 });
                GumpBass.play808Long?.({ freq: musicLayers.root / 2, volume: 0.7 });
                break;
        }
    }

    function playQuickScale(root, direction) {
        const scale = [0, 2, 4, 5, 7];
        const notes = direction === 'up' ? scale : [...scale].reverse();

        notes.forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * Math.pow(2, semitone / 12);
                GumpAudio.playTone?.(freq, 0.15, {
                    volume: 0.25,
                    attack: 0.01,
                    release: 0.1,
                });
            }, i * 60);
        });
    }

    // Reset all layers (called when holding center)
    function resetMusicLayers() {
        // Stop all intervals
        for (const [layerId, voice] of musicLayers.voices.entries()) {
            if (typeof voice === 'number') {
                clearInterval(voice);
            }
        }

        musicLayers.active.clear();
        musicLayers.voices.clear();
        musicLayers.chordIndex = 0;

        console.log('Music layers reset');
    }

    // Track continuous sound state
    let continuousVoice = null;
    let lastContinuousFreq = 0;

    // Instant sound when entering a zone
    function playZoneEntrySound(zone, localX, localY) {
        const currentEra = GumpUnlocks.currentEra;
        const zoneProps = GumpGrid.getZoneProperties(zone);

        // More musical frequency based on zone - use pentatonic scale
        const pentatonic = [0, 2, 4, 7, 9]; // C D E G A
        const zoneToNote = {
            'nw': 9,  // A (high)
            'n': 7,   // G
            'ne': 4,  // E
            'w': 2,   // D
            'center': 0, // C (root)
            'e': 4,   // E
            'sw': -3, // A (low)
            's': -5,  // G (low)
            'se': 2,  // D
        };

        const rootFreq = 220; // A3
        const semitones = zoneToNote[zone] || 0;
        const baseFreq = rootFreq * Math.pow(2, semitones / 12);

        // Play a clear, musical tone on zone entry
        GumpAudio.playTone(baseFreq, 0.4, {
            volume: 0.4,
            attack: 0.01,
            decay: 0.15,
            sustain: 0.5,
            release: 0.25,
            channel: 'synth',
        });

        // Add an octave shimmer for brightness
        GumpAudio.playTone(baseFreq * 2, 0.3, {
            volume: 0.15,
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 0.2,
            channel: 'synth',
        });

        // In later eras, add percussion
        if (currentEra === 'tribal' || currentEra === 'modern') {
            if (zone === 's' || zone === 'sw' || zone === 'se') {
                GumpDrums.playOrganicKick?.({ volume: 0.5 });
            } else if (zone === 'n' || zone === 'nw' || zone === 'ne') {
                GumpDrums.playHiHat?.({ type: 'closed', volume: 0.35 });
            } else if (zone === 'e' || zone === 'w') {
                GumpDrums.playClick?.({ volume: 0.3 });
            }
        }
    }

    // Continuous sound based on position (plays as you move)
    function updateContinuousSound(x, y, vx, vy) {
        if (!GumpAudio.isInitialized) return;

        const speed = Math.sqrt(vx * vx + vy * vy);

        // Only play when moving at reasonable speed
        if (speed > 0.3) {
            // Map Y position to frequency (higher = higher pitch)
            const minFreq = 110;  // A2
            const maxFreq = 440;  // A4
            const targetFreq = minFreq + (1 - y) * (maxFreq - minFreq);

            // Map X position to filter (left = dark, right = bright)
            const filterFreq = 500 + x * 4000;

            // Map speed to volume
            const volume = Math.min(0.35, speed * 0.15);

            // Play short tones based on movement
            if (Math.abs(targetFreq - lastContinuousFreq) > 20) {
                GumpAudio.playTone(targetFreq, 0.1, {
                    volume: volume,
                    attack: 0.005,
                    decay: 0.05,
                    sustain: 0.3,
                    release: 0.05,
                    filterFreq: filterFreq,
                    channel: 'synth',
                });
                lastContinuousFreq = targetFreq;
            }
        }
    }

    // Fast movement triggers special sounds
    function checkVelocitySounds(vx, vy, x, y) {
        const speed = Math.sqrt(vx * vx + vy * vy);

        // Fast swipe triggers a sweep sound
        if (speed > 2) {
            const direction = Math.abs(vx) > Math.abs(vy) ? 'horizontal' : 'vertical';

            if (direction === 'horizontal') {
                // Filter sweep based on direction
                const startFreq = vx > 0 ? 200 : 2000;
                const endFreq = vx > 0 ? 2000 : 200;
                GumpAudio.setFilterCutoff?.(endFreq, 0.2);
            } else {
                // Pitch based on direction
                const baseFreq = vy > 0 ? 440 : 220;
                GumpAudio.playTone(baseFreq, 0.15, {
                    volume: 0.25,
                    attack: 0.01,
                    release: 0.1,
                });
            }
        }
    }

    function triggerZoneSound(zone, threshold) {
        const currentEra = GumpUnlocks.currentEra;
        const zoneProps = GumpGrid.getZoneProperties(zone);

        // Era-specific zone sounds
        switch (currentEra) {
            case 'genesis':
                triggerGenesisZoneSound(zone, threshold, zoneProps);
                break;
            case 'primordial':
                triggerPrimordialZoneSound(zone, threshold, zoneProps);
                break;
            case 'tribal':
                triggerTribalZoneSound(zone, threshold, zoneProps);
                break;
            case 'sacred':
                triggerSacredZoneSound(zone, threshold, zoneProps);
                break;
            case 'modern':
                triggerModernZoneSound(zone, threshold, zoneProps);
                break;
        }
    }

    function triggerGenesisZoneSound(zone, threshold, props) {
        const baseFreq = 55 * (1 + (1 - props.coords.y) * 1);

        if (threshold === 'touch') {
            // Brief tone with harmonics
            GumpAudio.playTone(baseFreq, 0.5, { volume: 0.35, attack: 0.01 });
            GumpAudio.playTone(baseFreq * 2, 0.4, { volume: 0.15, attack: 0.02 });
        } else if (threshold === 'activate') {
            // Rich sustained tone - this is a reward
            GumpAudio.playTone(baseFreq, 3, {
                volume: 0.4,
                attack: 0.3,
                decay: 0.5,
                sustain: 0.7,
                release: 1.5,
            });
            // Add fifth
            GumpAudio.playTone(baseFreq * 1.5, 2.5, {
                volume: 0.2,
                attack: 0.5,
                release: 1,
            });
            // Add octave shimmer
            GumpAudio.playTone(baseFreq * 2, 2, {
                volume: 0.15,
                attack: 0.8,
                release: 1,
            });
        } else if (threshold === 'lock') {
            // Deep lock-in sound
            GumpAudio.playChord(baseFreq, [0, 7, 12], 4, {
                volume: 0.35,
                attack: 0.5,
                waveform: 'triangle',
            });
        }
    }

    function triggerPrimordialZoneSound(zone, threshold, props) {
        if (threshold === 'activate') {
            // Organic sounds based on zone
            if (zone === 's' || zone === 'sw') {
                // Low rumble
                GumpBass.playSubBass({ freq: 36, duration: 2, volume: 0.3 });
            } else if (zone === 'n' || zone === 'ne') {
                // High breath
                GumpAudio.createVoice('noise', {
                    type: 'pink',
                    filterFreq: 3000,
                    volume: 0.15,
                    attack: 0.5,
                    release: 1,
                });
            }
        }
    }

    function triggerTribalZoneSound(zone, threshold, props) {
        if (threshold === 'touch') {
            // Quick hit
            switch (zone) {
                case 's':
                case 'sw':
                    GumpDrums.playTribalKick({ volume: 0.5 });
                    break;
                case 'n':
                case 'nw':
                    GumpDrums.playClap({ volume: 0.4 });
                    break;
                case 'e':
                case 'ne':
                    GumpDrums.playClick({ volume: 0.3 });
                    break;
                case 'w':
                    GumpDrums.playWoodBlock({ volume: 0.4 });
                    break;
                case 'se':
                    GumpDrums.playHiHat({ type: 'closed', volume: 0.3 });
                    break;
                case 'center':
                    GumpDrums.playOrganicKick({ volume: 0.6 });
                    break;
            }
        } else if (threshold === 'activate') {
            // Sustained pattern or 808
            if (zone === 'sw') {
                GumpBass.play808Bass({ freq: 36, volume: 0.7, duration: 2 });
            }
        }
    }

    function triggerSacredZoneSound(zone, threshold, props) {
        const rootFreq = 55;  // A1

        if (threshold === 'activate') {
            switch (zone) {
                case 'center':
                    // Root drone
                    GumpAudio.playTone(rootFreq, 4, {
                        waveform: 'sawtooth',
                        volume: 0.2,
                        attack: 1,
                    });
                    break;
                case 'n':
                    // Fifth
                    GumpAudio.playTone(rootFreq * 1.5, 2, { volume: 0.2 });
                    break;
                case 'e':
                    // Third
                    GumpAudio.playTone(rootFreq * 1.25, 2, { volume: 0.2 });
                    break;
                case 'w':
                    // Fourth
                    GumpAudio.playTone(rootFreq * 1.333, 2, { volume: 0.2 });
                    break;
            }
        }
    }

    function triggerModernZoneSound(zone, threshold, props) {
        if (threshold === 'touch') {
            switch (zone) {
                case 's':
                case 'sw':
                    GumpDrums.play808Deep({ volume: 0.7 });
                    GumpBass.play808Bass({ freq: 36, volume: 0.6, duration: 1 });
                    break;
                case 'n':
                    GumpDrums.playSnare808({ volume: 0.5 });
                    break;
                case 'ne':
                    GumpDrums.playTrapHat({ roll: true, rollCount: 4, volume: 0.3 });
                    break;
                case 'e':
                    GumpDrums.playHiHat({ type: 'open', volume: 0.3 });
                    break;
                case 'se':
                    GumpDrums.playClap({ volume: 0.4 });
                    break;
            }
        } else if (threshold === 'activate') {
            if (zone === 'sw') {
                GumpBass.play808Long({ freq: 32, volume: 0.8 });
            } else if (zone === 'w') {
                // Pad swell
                const rootFreq = 55;
                GumpAudio.playChord(rootFreq, [0, 4, 7, 12], 4, {
                    waveform: 'sawtooth',
                    volume: 0.15,
                    attack: 1,
                    channel: 'pads',
                });
            }
        }
    }

    function activateUnlockSound(id, unlock) {
        if (!unlock.sound) return;

        const sound = unlock.sound;
        const ctx = GumpAudio.context;
        if (!ctx) return;

        let soundObj = null;

        switch (sound.type) {
            case 'tone':
            case 'ambient':
                soundObj = GumpAudio.playTone(sound.freq, null, {
                    waveform: sound.waveform || 'sine',
                    volume: sound.volume || 0.3,
                    attack: sound.envelope?.attack || 0.5,
                    release: sound.envelope?.release || 1,
                });
                break;

            case 'sub':
                soundObj = GumpBass.playSubBass({
                    freq: sound.freq || 55,
                    volume: sound.volume || 0.3,
                });
                break;

            case '808':
            case '808_modern':
                soundObj = GumpBass.play808Bass({
                    freq: sound.freq || 36,
                    volume: sound.volume || 0.5,
                    distortion: sound.distortion || 0.2,
                });
                break;

            case 'harmonics':
                // Play harmonic series
                if (sound.harmonics) {
                    soundObj = [];
                    sound.harmonics.forEach((ratio, i) => {
                        const voice = GumpAudio.playTone(
                            sound.baseFreq * ratio,
                            null,
                            {
                                volume: sound.volumes[i] || 0.1,
                                attack: sound.envelope?.attack || 1,
                            }
                        );
                        soundObj.push(voice);
                    });
                }
                break;

            case 'noise':
                soundObj = GumpAudio.createVoice('noise', {
                    type: sound.noiseType || 'white',
                    filterFreq: sound.filter?.freq || 1000,
                    volume: sound.volume || 0.2,
                });
                break;

            case 'formant':
                soundObj = GumpAudio.createVoice('formant', {
                    freq: sound.freq || 110,
                    formants: sound.formants,
                    volume: sound.volume || 0.2,
                    vibrato: sound.vibrato,
                });
                break;

            case 'shimmer':
                soundObj = [];
                if (sound.freqs) {
                    for (const freq of sound.freqs) {
                        const voice = GumpAudio.playTone(freq, null, {
                            volume: sound.volume || 0.05,
                            attack: 2,
                            detune: (Math.random() - 0.5) * (sound.detuneRange || 10),
                        });
                        soundObj.push(voice);
                    }
                }
                break;

            case 'chord':
                const rootFreq = GumpAudio.midiToFreq(48);
                soundObj = GumpAudio.playChord(rootFreq, sound.intervals, null, {
                    volume: sound.volume || 0.2,
                });
                break;

            case 'supersaw':
                soundObj = GumpAudio.createVoice('supersaw', {
                    freq: 110,
                    voices: sound.voices || 7,
                    detune: sound.detune || 15,
                    filterFreq: sound.filter?.freq || 3000,
                    volume: sound.volume || 0.2,
                });
                break;
        }

        if (soundObj) {
            activeSounds.set(id, soundObj);
        }
    }

    function deactivateUnlockSound(id) {
        const soundObj = activeSounds.get(id);
        if (!soundObj) return;

        if (Array.isArray(soundObj)) {
            for (const voice of soundObj) {
                if (voice && typeof voice.releaseNote === 'function') {
                    voice.releaseNote();
                } else if (voice) {
                    GumpAudio.releaseVoice(voice);
                }
            }
        } else if (soundObj.releaseNote) {
            soundObj.releaseNote();
        } else {
            GumpAudio.releaseVoice(soundObj);
        }

        activeSounds.delete(id);
    }

    function triggerEraTransition(from, to) {
        // Fade out all active sounds
        for (const [id, soundObj] of activeSounds.entries()) {
            deactivateUnlockSound(id);
        }

        // Play transition sound
        switch (to) {
            case 'primordial':
                // Rising from genesis
                GumpAudio.playTone(55, 3, { volume: 0.3, attack: 1, release: 2 });
                break;
            case 'tribal':
                // First beat
                setTimeout(() => {
                    GumpDrums.playOrganicKick({ volume: 0.8 });
                }, 500);
                break;
            case 'sacred':
                // First chord
                setTimeout(() => {
                    GumpAudio.playChord(55, [0, 7, 12], 4, { volume: 0.3, attack: 2 });
                }, 500);
                break;
            case 'modern':
                // 808 drop
                setTimeout(() => {
                    GumpDrums.play808Deep({ volume: 1.0 });
                    GumpBass.play808Long({ freq: 32, volume: 0.9 });
                }, 500);
                break;
        }
    }

    function flashUnlock(unlock) {
        // Visual feedback for unlock - handled in render
    }

    function updateEraVisuals(era) {
        // Update color palette based on era
        const palettes = {
            genesis: {
                primary: '#ffffff',
                secondary: '#000000',
                accent: '#ffd700',
                bg: '#000000',
            },
            primordial: {
                primary: '#8b7355',
                secondary: '#2d4a3e',
                accent: '#daa520',
                bg: '#0a0a05',
            },
            tribal: {
                primary: '#ff6600',
                secondary: '#663300',
                accent: '#ff3300',
                bg: '#0a0500',
            },
            sacred: {
                primary: '#9966ff',
                secondary: '#333366',
                accent: '#ffffff',
                bg: '#050010',
            },
            modern: {
                primary: '#00ffcc',
                secondary: '#ff00ff',
                accent: '#ffffff',
                bg: '#000000',
            },
        };

        const palette = palettes[era] || palettes.genesis;
        GumpState.set('visual.colorPrimary', palette.primary);
        GumpState.set('visual.colorSecondary', palette.secondary);
        GumpState.set('visual.colorAccent', palette.accent);
        GumpState.set('visual.backgroundColor', palette.bg);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL EVOLUTION ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    function updateEvolution(dt, x, y, vx, vy, currentZone) {
        const speed = Math.sqrt(vx * vx + vy * vy);

        // Update session time and phase
        evolution.sessionTime += dt;
        let newPhase = 0;
        for (let i = PHASE_THRESHOLDS.length - 1; i >= 0; i--) {
            if (evolution.sessionTime >= PHASE_THRESHOLDS[i]) {
                newPhase = i;
                break;
            }
        }

        // Phase transition
        if (newPhase !== evolution.phase && newPhase >= 0) {
            onPhaseChange(evolution.phase, newPhase);
            evolution.phase = newPhase;
        }

        // Update intensity (builds with activity, decays slowly)
        const activityBoost = speed * 0.1;
        const decay = 0.02;
        evolution.intensityVelocity += (activityBoost - evolution.intensityVelocity) * 0.1;
        evolution.intensity = Math.min(1, Math.max(0,
            evolution.intensity + evolution.intensityVelocity * dt - decay * dt
        ));
        evolution.peakIntensity = Math.max(evolution.peakIntensity, evolution.intensity);

        // Update breathing
        evolution.breathPhase += evolution.breathRate * dt * Math.PI * 2;

        // Update chord progression based on zone
        updateHarmony(currentZone, dt);

        // Track stillness for easter eggs
        if (speed < 0.1) {
            evolution.stillnessTime += dt;
        } else {
            evolution.stillnessTime = 0;
        }

        // Track shake intensity
        if (speed > 3) {
            evolution.shakeIntensity = Math.min(1, evolution.shakeIntensity + dt * 2);
        } else {
            evolution.shakeIntensity = Math.max(0, evolution.shakeIntensity - dt);
        }

        // Apply breathing to master volume
        const breathAmount = 0.05; // ±5% volume swell
        const breathValue = Math.sin(evolution.breathPhase) * breathAmount;
        if (GumpAudio.isInitialized && evolution.phase > 0) {
            const baseVolume = 0.7 + evolution.intensity * 0.2;
            GumpAudio.setMasterVolume?.(baseVolume + breathValue, 0.1);
        }

        // Intensity-based layers
        updateIntensityLayers();

        // Check for THE DROP
        checkForTheDrop();

        // Call and response system
        updateCallAndResponse(dt, speed);
    }

    function onPhaseChange(from, to) {
        console.log(`Phase change: ${PHASE_NAMES[from]} → ${PHASE_NAMES[to]}`);

        // Unlock layers based on phase
        if (to >= 1) {
            evolution.layers.melody = true;
            evolution.layers.harmony = true;
            playPhaseUnlockSound(1);
        }
        if (to >= 2) {
            evolution.layers.bass = true;
            evolution.layers.rhythm = true;
            playPhaseUnlockSound(2);
        }
        if (to >= 3) {
            evolution.layers.orchestral = true;
            playPhaseUnlockSound(3);
        }
    }

    function playPhaseUnlockSound(phase) {
        const rootFreq = evolution.rootNote;

        switch (phase) {
            case 1:
                // Discovery - gentle chord swell
                GumpAudio.playChord(rootFreq * 2, [0, 4, 7], 3, {
                    volume: 0.25,
                    attack: 0.5,
                    release: 2,
                    waveform: 'triangle',
                });
                break;
            case 2:
                // Journey - bass enters with power
                GumpBass.playSubBass?.({ freq: rootFreq, duration: 2, volume: 0.4 });
                setTimeout(() => {
                    GumpDrums.playOrganicKick?.({ volume: 0.6 });
                }, 500);
                break;
            case 3:
                // Transcendence - full orchestral swell
                playOrchestralSwell();
                break;
        }
    }

    function playOrchestralSwell() {
        const root = evolution.rootNote;

        // Layer 1: Sub bass
        GumpBass.play808Long?.({ freq: root / 2, volume: 0.5 });

        // Layer 2: Root power chord
        GumpAudio.playChord(root, [0, 7, 12], 4, {
            volume: 0.3,
            attack: 1,
            waveform: 'sawtooth',
            channel: 'pads',
        });

        // Layer 3: High shimmer
        GumpAudio.playChord(root * 4, [0, 4, 7, 11], 3, {
            volume: 0.15,
            attack: 1.5,
            release: 2,
        });

        // Drum hit
        setTimeout(() => {
            GumpDrums.play808Deep?.({ volume: 0.8 });
        }, 1000);
    }

    function updateHarmony(zone, dt) {
        // Map zones to chord degrees
        const zoneToChord = {
            'center': 0,  // i (home)
            'n': 2,       // v
            's': 2,       // v
            'e': 1,       // IV
            'w': 1,       // IV
            'ne': 3,      // I
            'nw': 1,      // IV
            'se': 2,      // v
            'sw': 0,      // i
        };

        const targetChord = zoneToChord[zone] ?? 0;

        // Smooth chord transitions
        if (targetChord !== evolution.currentChord) {
            evolution.chordProgress += dt * 0.5;
            if (evolution.chordProgress >= 1) {
                evolution.currentChord = targetChord;
                evolution.chordProgress = 0;

                // Play chord change sound if we have harmony unlocked
                if (evolution.layers.harmony) {
                    playChordChange(targetChord);
                }
            }
        }
    }

    function playChordChange(chordIndex) {
        const root = evolution.rootNote;
        const semitones = evolution.progression[chordIndex];
        const quality = evolution.chordQualities[chordIndex];
        const freq = root * Math.pow(2, semitones / 12);

        const intervals = quality === 'major' ? [0, 4, 7] : [0, 3, 7];

        // Subtle chord pad
        GumpAudio.playChord(freq * 2, intervals, 2, {
            volume: 0.12 + evolution.intensity * 0.1,
            attack: 0.3,
            release: 1,
            waveform: 'triangle',
            channel: 'pads',
        });
    }

    function updateIntensityLayers() {
        // Low intensity: just melodic tones
        // Medium: add bass pulse
        // High: add rhythmic elements
        // Max: full orchestral

        if (evolution.intensity > 0.7 && evolution.layers.orchestral) {
            // High intensity - trigger occasional hits
            if (Math.random() < 0.01) {
                const root = evolution.rootNote;
                GumpAudio.playTone(root * 2, 0.5, {
                    volume: 0.2,
                    attack: 0.01,
                    release: 0.3,
                });
            }
        }
    }

    let dropCooldown = 0;
    function checkForTheDrop() {
        dropCooldown = Math.max(0, dropCooldown - 0.016);

        // THE DROP: When intensity hits max after building
        if (evolution.intensity > 0.95 &&
            evolution.peakIntensity > 0.9 &&
            evolution.sessionTime > 60 &&
            dropCooldown === 0) {

            triggerTheDrop();
            dropCooldown = 30; // 30 second cooldown
            evolution.intensity = 0.3; // Reset intensity after drop
        }
    }

    function triggerTheDrop() {
        console.log('THE DROP!');

        const root = evolution.rootNote;

        // Silence for anticipation
        GumpAudio.setMasterVolume?.(0.2, 0.1);

        setTimeout(() => {
            // THE BWAAAM
            GumpDrums.play808Deep?.({ volume: 1.0 });
            GumpBass.play808Long?.({ freq: root / 2, volume: 1.0 });

            // Massive chord
            GumpAudio.playChord(root, [0, 7, 12, 19], 4, {
                volume: 0.5,
                attack: 0.01,
                release: 3,
                waveform: 'sawtooth',
            });

            // High stab
            GumpAudio.playChord(root * 4, [0, 4, 7], 2, {
                volume: 0.3,
                attack: 0.01,
                release: 1,
            });

            // Restore volume
            GumpAudio.setMasterVolume?.(0.9, 0.5);
        }, 200);
    }

    function updateCallAndResponse(dt, speed) {
        // System occasionally calls
        if (!evolution.systemCalling &&
            evolution.phase >= 1 &&
            Math.random() < 0.002 &&
            evolution.sessionTime - evolution.lastResponseTime > 10) {

            evolution.systemCalling = true;
            evolution.callTime = evolution.sessionTime;
            playSystemCall();
        }

        // Check for response (movement within 3 seconds of call)
        if (evolution.systemCalling) {
            const timeSinceCall = evolution.sessionTime - evolution.callTime;

            if (speed > 0.5 && timeSinceCall > 0.5 && timeSinceCall < 3) {
                // Response received
                evolution.systemCalling = false;
                evolution.lastResponseTime = evolution.sessionTime;
                evolution.dialogueCount++;
                playDialogueResponse();
            } else if (timeSinceCall > 3) {
                // No response, cancel
                evolution.systemCalling = false;
            }
        }
    }

    function playSystemCall() {
        const root = evolution.rootNote * 2;
        const phrases = [
            [0, 4, 7],      // Arpeggio up
            [7, 4, 0],      // Arpeggio down
            [0, 2, 4],      // Scale fragment
            [0, 7, 12],     // Fifth leap
        ];

        const phrase = phrases[evolution.dialogueCount % phrases.length];

        phrase.forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * Math.pow(2, semitone / 12);
                GumpAudio.playTone(freq, 0.3, {
                    volume: 0.3,
                    attack: 0.01,
                    decay: 0.1,
                    release: 0.2,
                });
            }, i * 150);
        });
    }

    function playDialogueResponse() {
        const root = evolution.rootNote * 2;

        // Respond with a resolving phrase
        const response = [12, 11, 7, 0]; // Descending resolution

        response.forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * Math.pow(2, semitone / 12);
                GumpAudio.playTone(freq, 0.4, {
                    volume: 0.25,
                    attack: 0.01,
                    release: 0.3,
                });
            }, i * 200);
        });

        // Reward for dialogue
        if (evolution.dialogueCount >= 3) {
            setTimeout(() => {
                GumpAudio.playChord(root, [0, 4, 7, 12], 2, {
                    volume: 0.2,
                    attack: 0.3,
                    release: 1,
                });
            }, 800);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EASTER EGG DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function checkEasterEggs(zone, x, y, vx, vy, dt) {
        const now = evolution.sessionTime;

        // Track zone visits
        if (zone && !evolution.zonesVisited.has(zone)) {
            evolution.zonesVisited.add(zone);
            evolution.zoneVisitOrder.push(zone);
            evolution.lastZoneVisitTime = now;
        }

        // === EASTER EGG 1: Journey Complete ===
        // Visit all 9 zones within 15 seconds
        if (evolution.zonesVisited.size === 9 &&
            !evolution.easterEggs.journeyComplete &&
            now - evolution.lastZoneVisitTime < 15) {

            evolution.easterEggs.journeyComplete = true;
            triggerJourneyComplete();
        }

        // Reset zone tracking if too much time passes
        if (now - evolution.lastZoneVisitTime > 15 && evolution.zonesVisited.size < 9) {
            evolution.zonesVisited.clear();
            evolution.zoneVisitOrder = [];
        }

        // === EASTER EGG 2: Meditation Mode ===
        // Stay in center for 10+ seconds
        if (zone === 'center' && evolution.stillnessTime > 10 &&
            !evolution.easterEggs.meditationMode) {

            evolution.easterEggs.meditationMode = true;
            triggerMeditationMode();
        }

        // Exit meditation if you move
        if (evolution.easterEggs.meditationMode && evolution.stillnessTime < 1) {
            evolution.easterEggs.meditationMode = false;
        }

        // RESET music layers when dwelling in center for 8+ seconds
        if (zone === 'center' && evolution.stillnessTime > 8 && musicLayers.active.size > 0) {
            resetMusicLayers();
            evolution.stillnessTime = 0; // Prevent repeat reset
        }

        // === EASTER EGG 3: Earthquake ===
        // Rapid shaking
        if (evolution.shakeIntensity > 0.8 && !evolution.easterEggs.earthquakeTriggered) {
            evolution.easterEggs.earthquakeTriggered = true;
            triggerEarthquake();

            // Reset after cooldown
            setTimeout(() => {
                evolution.easterEggs.earthquakeTriggered = false;
            }, 10000);
        }

        // === EASTER EGG 4: Ritual (clockwise corners) ===
        const corners = ['nw', 'ne', 'se', 'sw'];
        if (corners.includes(zone)) {
            const lastCorner = evolution.cornerSequence[evolution.cornerSequence.length - 1];
            if (zone !== lastCorner) {
                evolution.cornerSequence.push(zone);
                if (evolution.cornerSequence.length > 4) {
                    evolution.cornerSequence.shift();
                }

                // Check for clockwise: nw -> ne -> se -> sw
                if (evolution.cornerSequence.join(',') === 'nw,ne,se,sw' &&
                    !evolution.easterEggs.ritualComplete) {
                    evolution.easterEggs.ritualComplete = true;
                    triggerRitual();
                }
            }
        }

        // === EASTER EGG 5: Circle/Orbit Detection ===
        detectCircleGesture(x, y, dt);
    }

    let circlePoints = [];
    function detectCircleGesture(x, y, dt) {
        circlePoints.push({ x, y, t: evolution.sessionTime });

        // Keep last 2 seconds of points
        const cutoff = evolution.sessionTime - 2;
        circlePoints = circlePoints.filter(p => p.t > cutoff);

        if (circlePoints.length < 20) return;

        // Calculate center of points
        const cx = circlePoints.reduce((s, p) => s + p.x, 0) / circlePoints.length;
        const cy = circlePoints.reduce((s, p) => s + p.y, 0) / circlePoints.length;

        // Calculate average distance from center
        const avgDist = circlePoints.reduce((s, p) => {
            return s + Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        }, 0) / circlePoints.length;

        // Calculate variance in distance (should be low for a circle)
        const variance = circlePoints.reduce((s, p) => {
            const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
            return s + (dist - avgDist) ** 2;
        }, 0) / circlePoints.length;

        // Check if points form a rough circle (low variance, decent radius)
        if (variance < 0.01 && avgDist > 0.15 && avgDist < 0.4) {
            evolution.circleProgress += dt;

            if (evolution.circleProgress > 2 && !evolution.easterEggs.orbitMode) {
                evolution.easterEggs.orbitMode = true;
                triggerOrbitMode();
            }
        } else {
            evolution.circleProgress = Math.max(0, evolution.circleProgress - dt * 0.5);
            if (evolution.circleProgress < 0.5) {
                evolution.easterEggs.orbitMode = false;
            }
        }
    }

    // === Easter Egg Sound Triggers ===

    function triggerJourneyComplete() {
        console.log('Easter Egg: Journey Complete!');

        const root = evolution.rootNote;

        // Triumphant fanfare
        const fanfare = [0, 4, 7, 12, 16, 12, 7, 4, 0];
        fanfare.forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * 2 * Math.pow(2, semitone / 12);
                GumpAudio.playTone(freq, 0.3, {
                    volume: 0.35,
                    attack: 0.01,
                    release: 0.2,
                });
            }, i * 100);
        });

        // Final chord
        setTimeout(() => {
            GumpAudio.playChord(root * 2, [0, 4, 7, 12], 3, {
                volume: 0.4,
                attack: 0.1,
                release: 2,
            });
        }, 900);

        // Boost intensity as reward
        evolution.intensity = Math.min(1, evolution.intensity + 0.3);
    }

    function triggerMeditationMode() {
        console.log('Easter Egg: Meditation Mode');

        const root = evolution.rootNote;

        // Deep, peaceful drone
        GumpAudio.playTone(root, 10, {
            volume: 0.2,
            attack: 2,
            release: 3,
            waveform: 'sine',
        });

        // Perfect fifth above
        GumpAudio.playTone(root * 1.5, 10, {
            volume: 0.1,
            attack: 3,
            release: 3,
        });

        // High octave shimmer
        GumpAudio.playTone(root * 4, 8, {
            volume: 0.05,
            attack: 4,
            release: 3,
        });
    }

    function triggerEarthquake() {
        console.log('Easter Egg: Earthquake!');

        const root = evolution.rootNote;

        // Massive sub bass
        GumpBass.play808Long?.({ freq: root / 4, volume: 1.0 });
        GumpBass.playSubBass?.({ freq: root / 2, duration: 2, volume: 0.8 });

        // Drum chaos
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                GumpDrums.playOrganicKick?.({ volume: 0.5 + Math.random() * 0.3 });
                if (i % 2 === 0) {
                    GumpDrums.playSnare808?.({ volume: 0.4 });
                }
            }, i * 100);
        }

        // Low rumble tone
        GumpAudio.playTone(root / 2, 2, {
            volume: 0.4,
            attack: 0.01,
            release: 1,
            waveform: 'sawtooth',
            filterFreq: 200,
        });
    }

    function triggerRitual() {
        console.log('Easter Egg: Ritual Complete!');

        const root = evolution.rootNote;

        // Mystical chord progression
        const progression = [
            { chord: [0, 3, 7], time: 0 },      // minor
            { chord: [0, 4, 7], time: 600 },    // major
            { chord: [0, 3, 7, 10], time: 1200 }, // minor 7
            { chord: [0, 4, 7, 11], time: 1800 }, // major 7
        ];

        progression.forEach(({ chord, time }) => {
            setTimeout(() => {
                GumpAudio.playChord(root * 2, chord, 1.5, {
                    volume: 0.3,
                    attack: 0.2,
                    release: 1,
                    waveform: 'triangle',
                });
            }, time);
        });

        // Reset corner sequence
        evolution.cornerSequence = [];
        setTimeout(() => {
            evolution.easterEggs.ritualComplete = false;
        }, 5000);
    }

    let orbitArpInterval = null;
    function triggerOrbitMode() {
        console.log('Easter Egg: Orbit Mode!');

        const root = evolution.rootNote * 2;
        const arpNotes = [0, 4, 7, 12, 7, 4]; // Up and down arpeggio
        let noteIndex = 0;

        // Clear any existing arpeggiator
        if (orbitArpInterval) clearInterval(orbitArpInterval);

        orbitArpInterval = setInterval(() => {
            if (!evolution.easterEggs.orbitMode) {
                clearInterval(orbitArpInterval);
                orbitArpInterval = null;
                return;
            }

            const freq = root * Math.pow(2, arpNotes[noteIndex] / 12);
            GumpAudio.playTone(freq, 0.15, {
                volume: 0.25,
                attack: 0.01,
                release: 0.1,
            });

            noteIndex = (noteIndex + 1) % arpNotes.length;
        }, 120); // ~8th notes at 125bpm
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GESTURE → PHRASE SYSTEM
    // ═══════════════════════════════════════════════════════════════════════

    function detectAndPlayGesture(x, y, vx, vy, dt) {
        const speed = Math.sqrt(vx * vx + vy * vy);

        // Add to gesture buffer
        evolution.gestureBuffer.push({ x, y, vx, vy, t: evolution.sessionTime });

        // Keep last 1.5 seconds
        const cutoff = evolution.sessionTime - 1.5;
        evolution.gestureBuffer = evolution.gestureBuffer.filter(p => p.t > cutoff);

        if (evolution.gestureBuffer.length < 10) return;

        // Analyze gesture
        const gesture = analyzeGesture();

        if (gesture && evolution.sessionTime - evolution.lastGestureTime > 1) {
            playGesturePhrase(gesture);
            evolution.lastGestureTime = evolution.sessionTime;
        }
    }

    function analyzeGesture() {
        const points = evolution.gestureBuffer;
        if (points.length < 10) return null;

        // Calculate total movement
        let totalDx = 0, totalDy = 0;
        let maxSpeed = 0;

        for (let i = 1; i < points.length; i++) {
            totalDx += points[i].x - points[i - 1].x;
            totalDy += points[i].y - points[i - 1].y;
            const speed = Math.sqrt(points[i].vx ** 2 + points[i].vy ** 2);
            maxSpeed = Math.max(maxSpeed, speed);
        }

        const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

        // Classify gesture
        if (maxSpeed > 4 && Math.abs(totalDx) > 0.3) {
            return totalDx > 0 ? 'swipe_right' : 'swipe_left';
        }
        if (maxSpeed > 4 && Math.abs(totalDy) > 0.3) {
            return totalDy > 0 ? 'swipe_down' : 'swipe_up';
        }
        if (maxSpeed < 0.3 && totalDist < 0.05) {
            return 'hold';
        }
        if (maxSpeed > 2) {
            return 'fast_movement';
        }

        return null;
    }

    function playGesturePhrase(gesture) {
        const root = evolution.rootNote * 2;

        switch (gesture) {
            case 'swipe_right':
                // Ascending scale run
                playScaleRun(root, 'up');
                break;

            case 'swipe_left':
                // Descending scale run
                playScaleRun(root, 'down');
                break;

            case 'swipe_up':
                // Rising arpeggio
                playArpeggio(root, 'up');
                break;

            case 'swipe_down':
                // Falling arpeggio
                playArpeggio(root, 'down');
                break;

            case 'hold':
                // Sustained chord
                playSustainedChord(root);
                break;

            case 'fast_movement':
                // Energetic burst
                playEnergeticBurst(root);
                break;
        }
    }

    function playScaleRun(root, direction) {
        const scale = [0, 2, 4, 5, 7, 9, 11, 12]; // Major scale
        const notes = direction === 'up' ? scale : [...scale].reverse();

        notes.forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * Math.pow(2, semitone / 12);
                GumpAudio.playTone(freq, 0.15, {
                    volume: 0.3,
                    attack: 0.005,
                    release: 0.1,
                });
            }, i * 60);
        });
    }

    function playArpeggio(root, direction) {
        const chord = [0, 4, 7, 12, 16]; // Major with extensions
        const notes = direction === 'up' ? chord : [...chord].reverse();

        notes.forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * Math.pow(2, semitone / 12);
                GumpAudio.playTone(freq, 0.25, {
                    volume: 0.3,
                    attack: 0.01,
                    release: 0.15,
                });
            }, i * 80);
        });
    }

    function playSustainedChord(root) {
        GumpAudio.playChord(root, [0, 4, 7], 2, {
            volume: 0.25,
            attack: 0.3,
            release: 1.5,
            waveform: 'triangle',
        });
    }

    function playEnergeticBurst(root) {
        // Quick burst of notes
        const burst = [0, 12, 7, 4, 0, 12];
        burst.forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * Math.pow(2, semitone / 12);
                GumpAudio.playTone(freq, 0.1, {
                    volume: 0.25,
                    attack: 0.005,
                    release: 0.05,
                });
            }, i * 40);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN UPDATE LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function update(dt) {
        // Smooth input position
        const smoothing = 0.15;
        const prevX = app.x;
        const prevY = app.y;

        app.x += (app.targetX - app.x) * smoothing;
        app.y += (app.targetY - app.y) * smoothing;

        // Calculate velocity
        app.vx = (app.x - prevX) / dt;
        app.vy = (app.y - prevY) / dt;

        // Update state
        GumpState.updateInput(app.x, app.y, dt);
        GumpState.updateSession(dt);

        // Update grid
        const gridResult = GumpGrid.update(app.x, app.y, dt, GumpState);

        // Play sound on zone entry (immediate feedback)
        if (gridResult.transition) {
            playZoneEntrySound(gridResult.transition.to, gridResult.localX, gridResult.localY);
        }

        // Continuous sound while moving
        updateContinuousSound(app.x, app.y, app.vx, app.vy);

        // Check for fast movements
        checkVelocitySounds(app.vx, app.vy, app.x, app.y);

        // === MUSICAL EVOLUTION SYSTEMS ===
        try {
            // Update the evolution engine (phases, intensity, breathing, harmony)
            if (gridResult && gridResult.zone) {
                updateEvolution(dt, app.x, app.y, app.vx || 0, app.vy || 0, gridResult.zone);
                checkEasterEggs(gridResult.zone, app.x, app.y, app.vx || 0, app.vy || 0, dt);
            }
            // Detect gestures and play phrases
            detectAndPlayGesture(app.x, app.y, app.vx || 0, app.vy || 0, dt);
        } catch (e) {
            console.error('Evolution system error:', e);
        }

        // Add pattern data
        GumpPatterns.addPosition(app.x, app.y, app.vx, app.vy, Date.now());

        if (gridResult.transition) {
            GumpPatterns.addZoneVisit(
                gridResult.transition.from,
                Date.now(),
                GumpGrid.getZoneState(gridResult.transition.from)?.dwellTime || 0
            );
        }

        // Detect patterns
        const activeZones = new Set(GumpGrid.getActiveZones());
        const patterns = GumpPatterns.detectPatterns(activeZones, dt);

        // Check unlocks
        const unlockContext = {
            currentZone: gridResult.zone,
            zoneStates: GumpGrid.state.zones,
            activeZones,
            patterns: GumpPatterns.getActivePatterns(),
            activePatterns: GumpPatterns.getActivePatterns(),
            currentEra: GumpUnlocks.currentEra,
        };
        GumpUnlocks.checkUnlocks(unlockContext);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════════

    function render() {
        const ctx = app.ctx;
        const w = app.width;
        const h = app.height;

        // Clear with fade
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, w, h);

        // Draw grid
        drawGrid(ctx, w, h);

        // Draw zone indicators
        drawZones(ctx, w, h);

        // Draw connections
        drawConnections(ctx, w, h);

        // Draw cursor
        drawCursor(ctx, w, h);

        // Draw UI
        drawUI(ctx, w, h);

        // Draw debug info
        if (app.debugMode) {
            drawDebug(ctx, w, h);
        }
    }

    function drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;

        // Vertical lines (thirds)
        ctx.beginPath();
        ctx.moveTo(w * 0.333, 0);
        ctx.lineTo(w * 0.333, h);
        ctx.moveTo(w * 0.666, 0);
        ctx.lineTo(w * 0.666, h);
        ctx.stroke();

        // Horizontal lines (thirds)
        ctx.beginPath();
        ctx.moveTo(0, h * 0.333);
        ctx.lineTo(w, h * 0.333);
        ctx.moveTo(0, h * 0.666);
        ctx.lineTo(w, h * 0.666);
        ctx.stroke();
    }

    function drawZones(ctx, w, h) {
        const zones = GumpGrid.state.zones;
        const zoneWidth = w / 3;
        const zoneHeight = h / 3;

        for (const [zoneId, zoneState] of Object.entries(zones)) {
            const props = GumpGrid.getZoneProperties(zoneId);
            const x = props.coords.x * zoneWidth;
            const y = props.coords.y * zoneHeight;

            // Zone glow based on activity
            const heat = zoneState.heat;
            const energy = zoneState.energy;
            const glow = zoneState.glowIntensity;

            if (glow > 0.01) {
                const gradient = ctx.createRadialGradient(
                    x + zoneWidth / 2, y + zoneHeight / 2, 0,
                    x + zoneWidth / 2, y + zoneHeight / 2, Math.min(zoneWidth, zoneHeight) / 2
                );

                gradient.addColorStop(0, `rgba(255, 255, 255, ${glow * 0.15})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, zoneWidth, zoneHeight);
            }

            // Active zone indicator
            if (zoneState.isActive) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + glow * 0.2})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 5, y + 5, zoneWidth - 10, zoneHeight - 10);
            }

            // Locked zone indicator
            if (zoneState.isLocked) {
                ctx.fillStyle = `rgba(255, 215, 0, ${0.05 + glow * 0.1})`;
                ctx.fillRect(x + 10, y + 10, zoneWidth - 20, zoneHeight - 20);
            }
        }
    }

    function drawConnections(ctx, w, h) {
        const connections = GumpGrid.state.connections;
        const zoneWidth = w / 3;
        const zoneHeight = h / 3;

        ctx.lineWidth = 2;

        for (const [key, strength] of connections.entries()) {
            const [zone1, zone2] = key.split('_');
            const props1 = GumpGrid.getZoneProperties(zone1);
            const props2 = GumpGrid.getZoneProperties(zone2);

            if (!props1 || !props2) continue;

            const x1 = props1.coords.x * zoneWidth + zoneWidth / 2;
            const y1 = props1.coords.y * zoneHeight + zoneHeight / 2;
            const x2 = props2.coords.x * zoneWidth + zoneWidth / 2;
            const y2 = props2.coords.y * zoneHeight + zoneHeight / 2;

            ctx.strokeStyle = `rgba(255, 255, 255, ${strength * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    function drawCursor(ctx, w, h) {
        const x = app.x * w;
        const y = app.y * h;

        const energy = GumpState.get('input.energy') || 0;
        const zone = GumpState.get('grid.currentZone');
        const zoneState = GumpGrid.getZoneState(zone);
        const dwellTime = zoneState?.dwellTime || 0;

        // Base size
        let size = 6 + energy * 20;

        // Dwell glow
        if (dwellTime > 0.5) {
            const glowSize = size + dwellTime * 10;
            const glowAlpha = Math.min(0.3, dwellTime * 0.05);

            ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
            ctx.beginPath();
            ctx.arc(x, y, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cursor dot
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + energy * 0.4})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Velocity trail
        if (Math.abs(app.vx) > 0.1 || Math.abs(app.vy) > 0.1) {
            const trailLength = Math.min(50, Math.sqrt(app.vx * app.vx + app.vy * app.vy) * 30);
            const trailX = x - app.vx * 0.05 * w;
            const trailY = y - app.vy * 0.05 * h;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();
        }
    }

    function drawUI(ctx, w, h) {
        const era = GumpUnlocks.currentEra;
        const zone = GumpState.get('grid.currentZone');
        const zoneState = GumpGrid.getZoneState(zone);
        const dwellTime = zoneState?.dwellTime || 0;

        ctx.font = '10px monospace';
        ctx.textAlign = 'center';

        // Phase name (top center) - shows musical evolution
        const phaseName = (PHASE_NAMES && PHASE_NAMES[evolution.phase]) ? PHASE_NAMES[evolution.phase] : 'awakening';
        const phaseAlpha = 0.1 + (evolution.intensity || 0) * 0.15;
        ctx.fillStyle = `rgba(255, 255, 255, ${phaseAlpha})`;
        ctx.fillText(phaseName.toUpperCase(), w / 2, 30);

        // Intensity ring around center
        if (evolution.intensity > 0.1) {
            const ringRadius = 30 + evolution.intensity * 50;
            const ringAlpha = evolution.intensity * 0.2;
            const breath = Math.sin(evolution.breathPhase) * 0.05;

            ctx.strokeStyle = `rgba(255, ${200 - evolution.intensity * 150}, 100, ${ringAlpha + breath})`;
            ctx.lineWidth = 1 + evolution.intensity * 2;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Zone name (bottom right)
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillText(zone, w - 20, h - 20);

        // Session time (top right)
        const mins = Math.floor(evolution.sessionTime / 60);
        const secs = Math.floor(evolution.sessionTime % 60);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, w - 20, 30);

        // Dwell bar (bottom)
        const dwellPercent = Math.min(1, dwellTime / 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, h - 2, w, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, h - 2, w * dwellPercent, 2);

        // Intensity bar (top)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, 0, w, 2);
        const intensityColor = evolution.intensity > 0.9 ?
            'rgba(255, 100, 100, 0.5)' :  // Red when near drop
            `rgba(255, 200, 100, ${0.2 + evolution.intensity * 0.3})`;
        ctx.fillStyle = intensityColor;
        ctx.fillRect(0, 0, w * evolution.intensity, 2);

        // Easter egg indicators (small dots in corners when active)
        if (evolution.easterEggs.meditationMode) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        if (evolution.easterEggs.orbitMode) {
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
            ctx.lineWidth = 2;
            const orbitRadius = 40 + Math.sin(evolution.sessionTime * 3) * 10;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, orbitRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // UNLOCKED LAYERS (left side)
        ctx.textAlign = 'left';
        ctx.font = '9px monospace';
        const layers = Array.from(musicLayers.active);
        if (layers.length > 0) {
            ctx.fillStyle = 'rgba(100, 255, 150, 0.3)';
            ctx.fillText('LAYERS:', 20, h - 100);
            layers.slice(-6).forEach((layer, i) => {
                const def = Object.values(musicLayers.definitions).find(d => d.layer === layer);
                const name = def?.name || layer;
                ctx.fillStyle = 'rgba(100, 255, 150, 0.5)';
                ctx.fillText(`◆ ${name}`, 20, h - 85 + i * 12);
            });
        }

        // Journey progress (bottom left)
        if (evolution.zonesVisited.size > 0 && evolution.zonesVisited.size < 9) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.fillText(`Journey: ${evolution.zonesVisited.size}/9`, 20, h - 20);
        } else if (evolution.easterEggs.journeyComplete) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.fillText('Journey Complete', 20, h - 20);
        }

        // Reset indicator (when dwelling in center)
        if (zone === 'center' && dwellTime > 3) {
            const resetProgress = Math.min(1, (dwellTime - 3) / 5);
            ctx.fillStyle = `rgba(255, 100, 100, ${resetProgress * 0.5})`;
            ctx.textAlign = 'center';
            ctx.fillText('RESET ' + Math.floor(resetProgress * 100) + '%', w / 2, h / 2 + 80);
        }

        // Dialogue indicator
        if (evolution.systemCalling) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText('?', w / 2, h / 2 - 60);
        }
    }

    function drawDebug(ctx, w, h) {
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

        const fps = 1 / app.deltaTime;
        const lines = [
            `FPS: ${fps.toFixed(1)}`,
            `Phase: ${PHASE_NAMES[evolution.phase]}`,
            `Intensity: ${(evolution.intensity * 100).toFixed(0)}%`,
            `Session: ${Math.floor(evolution.sessionTime)}s`,
            `Zone: ${GumpState.get('grid.currentZone')}`,
            `Chord: ${evolution.chordQualities[evolution.currentChord]}`,
            `Zones visited: ${evolution.zonesVisited.size}/9`,
            `Dialogue: ${evolution.dialogueCount}`,
        ];

        lines.forEach((line, i) => {
            ctx.fillText(line, 10, 20 + i * 14);
        });

        // Draw intensity bar
        const barWidth = 100;
        const barHeight = 4;
        const barX = 10;
        const barY = 20 + lines.length * 14 + 5;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = `rgba(255, ${255 - evolution.intensity * 200}, 100, 0.8)`;
        ctx.fillRect(barX, barY, barWidth * evolution.intensity, barHeight);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function frame(timestamp) {
        if (!app.isRunning) return;

        // Calculate delta time
        if (app.lastTime === 0) {
            app.lastTime = timestamp;
        }
        app.deltaTime = Math.min(0.1, (timestamp - app.lastTime) / 1000);
        app.lastTime = timestamp;
        app.elapsedTime += app.deltaTime;
        app.frameCount++;

        if (!app.isPaused) {
            // Update
            update(app.deltaTime);

            // Render
            render();
        }

        // Continue loop
        requestAnimationFrame(frame);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    async function start() {
        if (!app.isInitialized) {
            await init();
        }

        // Start audio (don't let failure stop the app)
        try {
            if (GumpAudio.isInitialized) {
                await GumpAudio.start();

                // === THE CINEMATIC ENTRANCE ===
                // This is the moment that hooks people
                playCinematicEntrance();

                // Activate unlocked sounds
                for (const id of GumpUnlocks.state.unlocked) {
                    const unlock = GumpUnlocks.getUnlock(id);
                    if (unlock && unlock.sound) {
                        GumpUnlocks.activateUnlock(id);
                        try {
                            activateUnlockSound(id, unlock);
                        } catch (e) {
                            console.error('Sound activation failed:', id, e);
                        }
                    }
                }
            }
        } catch (audioError) {
            console.error('Audio start failed:', audioError);
        }

        // ALWAYS start the render loop
        app.isRunning = true;
        app.lastTime = 0;

        requestAnimationFrame(frame);

        console.log('GUMP started');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // THE CINEMATIC ENTRANCE - First 5 seconds that hook you
    // ═══════════════════════════════════════════════════════════════════════

    function playCinematicEntrance() {
        const root = 55; // A1

        // Phase 1: Deep sub emerges (0-2s)
        GumpBass.playSubBass?.({ freq: root / 2, duration: 6, volume: 0.4 });

        // Phase 2: Pad swell begins (0.5s)
        setTimeout(() => {
            GumpAudio.playChord?.(root, [0, 7, 12], 5, {
                volume: 0.2,
                attack: 2,
                release: 2,
                waveform: 'sawtooth',
            });
        }, 500);

        // Phase 3: Higher harmonics join (1.5s)
        setTimeout(() => {
            GumpAudio.playChord?.(root * 2, [0, 4, 7], 4, {
                volume: 0.15,
                attack: 1.5,
                release: 2,
                waveform: 'triangle',
            });
        }, 1500);

        // Phase 4: Tension build (2.5s)
        setTimeout(() => {
            GumpAudio.playChord?.(root * 4, [0, 5, 7, 11], 3, {
                volume: 0.1,
                attack: 1,
                release: 1.5,
            });
            // Rising filter
            GumpAudio.setFilterCutoff?.(500, 0);
            GumpAudio.setFilterCutoff?.(4000, 2);
        }, 2500);

        // Phase 5: THE BWAAAM (4.5s)
        setTimeout(() => {
            triggerTheBWAAAM();
        }, 4500);

        // Haptic feedback on iOS
        if (navigator.vibrate) {
            // Pulse pattern: build... build... BWAAAM
            setTimeout(() => navigator.vibrate(50), 500);
            setTimeout(() => navigator.vibrate(100), 1500);
            setTimeout(() => navigator.vibrate(200), 2500);
            setTimeout(() => navigator.vibrate(500), 4500);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // THE BWAAAM - The Inception Sound
    // ═══════════════════════════════════════════════════════════════════════

    let bwaamCooldown = 0;

    function triggerTheBWAAAM() {
        if (bwaamCooldown > 0) return;
        bwaamCooldown = 5; // 5 second cooldown

        console.log('THE BWAAAM');
        const root = 55;

        // Layer 1: MASSIVE sub hit
        GumpBass.play808Long?.({ freq: root / 2, volume: 1.0 });

        // Layer 2: Brass stab (detuned saws)
        [-0.1, 0, 0.1].forEach(detune => {
            GumpAudio.playChord?.(root * Math.pow(2, detune/12), [0, 7, 12, 19], 4, {
                volume: 0.25,
                attack: 0.01,
                release: 3,
                waveform: 'sawtooth',
            });
        });

        // Layer 3: High brass
        GumpAudio.playChord?.(root * 4, [0, 4, 7], 3, {
            volume: 0.2,
            attack: 0.01,
            release: 2,
            waveform: 'sawtooth',
        });

        // Layer 4: Sub octave
        GumpAudio.playTone?.(root / 4, 5, {
            volume: 0.3,
            attack: 0.01,
            release: 4,
            waveform: 'sine',
        });

        // Drum hit
        GumpDrums.play808Deep?.({ volume: 1.0 });

        // Filter sweep down (the "waaaa" decay)
        GumpAudio.setFilterCutoff?.(8000, 0);
        setTimeout(() => {
            GumpAudio.setFilterCutoff?.(500, 3);
        }, 100);

        // Screen flash effect (CSS)
        triggerScreenFlash();

        // Haptic
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 300]);
        }

        // Decay cooldown
        setTimeout(() => { bwaamCooldown = 0; }, 5000);
    }

    function triggerScreenFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            inset: 0;
            background: white;
            opacity: 0.8;
            pointer-events: none;
            z-index: 9999;
            transition: opacity 0.5s ease-out;
        `;
        document.body.appendChild(flash);

        requestAnimationFrame(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 500);
        });
    }

    function stop() {
        app.isRunning = false;
        GumpAudio.stop();
        console.log('GUMP stopped');
    }

    function pause() {
        app.isPaused = true;
    }

    function resume() {
        app.isPaused = false;
    }

    function toggleDebug() {
        app.debugMode = !app.debugMode;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,
        start,
        stop,
        pause,
        resume,
        toggleDebug,
        requestMotionPermission,

        // State access
        get isInitialized() { return app.isInitialized; },
        get isRunning() { return app.isRunning; },
        get isPaused() { return app.isPaused; },
        get state() { return app; },

        // Sub-systems
        State: typeof GumpState !== 'undefined' ? GumpState : null,
        Grid: typeof GumpGrid !== 'undefined' ? GumpGrid : null,
        Patterns: typeof GumpPatterns !== 'undefined' ? GumpPatterns : null,
        Events: typeof GumpEvents !== 'undefined' ? GumpEvents : null,
        Unlocks: typeof GumpUnlocks !== 'undefined' ? GumpUnlocks : null,
        Audio: typeof GumpAudio !== 'undefined' ? GumpAudio : null,
        Drums: typeof GumpDrums !== 'undefined' ? GumpDrums : null,
        Bass: typeof GumpBass !== 'undefined' ? GumpBass : null,
    });
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GUMP;
}
