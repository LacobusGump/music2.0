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

    // Phase thresholds (in seconds) - THE HERO'S JOURNEY
    // Life gets dark before it gets brighter
    const PHASE_THRESHOLDS = [0, 30, 90, 180, 300, 420];
    const PHASE_NAMES = [
        'awakening',    // 0-30s:   Hope, wonder, simple beauty
        'discovery',    // 30-90s:  Exploring, curiosity, building
        'descent',      // 90s-3m:  Things darken, tension creeps in
        'struggle',     // 3-5m:    The low point, chaos, dissonance
        'rise',         // 5-7m:    Fighting back, hope returns
        'transcendence' // 7m+:     Brighter than ever, full catharsis
    ];

    // Musical characteristics for each phase
    const PHASE_MOOD = {
        awakening:    { brightness: 0.7, tension: 0.0, chaos: 0.0, hope: 1.0, rootShift: 0 },
        discovery:    { brightness: 0.8, tension: 0.1, chaos: 0.0, hope: 0.9, rootShift: 0 },
        descent:      { brightness: 0.4, tension: 0.5, chaos: 0.2, hope: 0.5, rootShift: -5 },  // Down a 4th
        struggle:     { brightness: 0.1, tension: 0.9, chaos: 0.7, hope: 0.1, rootShift: -7 },  // Down a 5th (darkest)
        rise:         { brightness: 0.6, tension: 0.4, chaos: 0.1, hope: 0.8, rootShift: -2 },  // Coming back up
        transcendence:{ brightness: 1.0, tension: 0.0, chaos: 0.0, hope: 1.0, rootShift: 5 },   // Up a 4th (brightest)
    };

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

                    // Initialize voice manager for interruption control
                    if (typeof GumpVoiceManager !== 'undefined') {
                        GumpVoiceManager.init(GumpAudio.context);
                    }

                    // Initialize recording system
                    if (typeof GumpRecorder !== 'undefined') {
                        GumpRecorder.init();
                    }

                    // Initialize audio capture
                    if (typeof GumpAudioCapture !== 'undefined' && GumpAudio.masterGain) {
                        GumpAudioCapture.init(GumpAudio.context, GumpAudio.masterGain);
                    }

                    // Load saved phrases
                    if (typeof GumpPhraseLibrary !== 'undefined') {
                        GumpPhraseLibrary.loadFromPersistence();

                        // Connect phrase library to conductor for call-and-response
                        GumpPhraseLibrary.onPhraseAdded((phrase) => {
                            // Notify conductor of new learned phrase
                            if (typeof aiMusicians !== 'undefined' && aiMusicians.conductor) {
                                aiMusicians.conductor.handleMessage({
                                    type: 'phrase.learned',
                                    data: { phrase }
                                });
                            }

                            console.log('[GUMP] Phrase learned:', phrase.id);
                        });
                    }

                    // Initialize Journey System (the conducting experience)
                    if (typeof GumpJourney !== 'undefined') {
                        GumpJourney.init(GumpAudio.context);
                        console.log('[GUMP] Journey system ready - music will dance to you');
                    }

                    console.log('[GUMP] Recording & voice systems initialized');
                }
            } catch (audioError) {
                console.error('Audio init failed:', audioError);
            }

            // OLD SYSTEMS DISABLED - Journey system replaces them
            // initializeAIMusicians();
            // initializeMagentaAI();
            // initializeMusicalWorlds();

            // Journey system is initialized in the audio block above
            console.log('[GUMP] Using Journey system (old AI musicians disabled)');

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
        // Gesture events - zone-based routing
        GumpEvents.on('gesture.start', onGestureStart);
        GumpEvents.on('gesture.end', onGestureEnd);

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
        app.gestureActive = true;
        const x = e.clientX / app.width;
        const y = e.clientY / app.height;
        const zone = GumpGrid.getZoneFromPosition?.(x, y) || 'center';

        GumpEvents.emit('gesture.start', { x, y, zone, inputMode: 'mouse' });
    }

    function onMouseUp(e) {
        app.gestureActive = false;
        GumpEvents.emit('gesture.end', { inputMode: 'mouse' });
    }

    function onTouchStart(e) {
        e.preventDefault();
        app.inputMode = 'touch';
        app.gestureActive = true;

        if (e.touches.length > 0) {
            app.targetX = e.touches[0].clientX / app.width;
            app.targetY = e.touches[0].clientY / app.height;

            const zone = GumpGrid.getZoneFromPosition?.(app.targetX, app.targetY) || 'center';
            GumpEvents.emit('gesture.start', {
                x: app.targetX,
                y: app.targetY,
                zone,
                inputMode: 'touch'
            });
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
        app.gestureActive = false;
        GumpEvents.emit('gesture.end', { inputMode: 'touch' });
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

    // Zone-based gesture handling for PLAY vs CONDUCT zones
    function onGestureStart(data) {
        const { x, y, zone } = data;

        console.log('[GUMP] Gesture start:', zone, 'at', x.toFixed(2), y.toFixed(2));

        // Get zone mode configuration
        const zoneMode = GumpGrid.getZoneMode?.(zone);
        console.log('[GUMP] Zone mode:', zoneMode);

        if (!zoneMode) {
            console.warn('[GUMP] No zone mode for:', zone);
            return;
        }

        if (zoneMode.mode === 'play') {
            // PLAY zones trigger sounds directly
            console.log('[GUMP] PLAY zone:', zoneMode.instrument);
            handlePlayZone(zone, zoneMode.instrument, x, y);
        } else if (zoneMode.mode === 'conduct') {
            // CONDUCT zones adjust parameters
            console.log('[GUMP] CONDUCT zone:', zoneMode.param);
            handleConductZone(zone, zoneMode.param, x, y);
        }
    }

    function onGestureEnd(data) {
        // Gesture ended - voice manager handles fading (via its own listener)
        // Reset any conduct parameters if needed
    }

    // Handle PLAY zone - trigger direct sounds and emit note events
    function handlePlayZone(zone, instrument, x, y) {
        const root = GumpMusicalWorlds?.getRoot?.() || 110;
        const scale = GumpMusicalWorlds?.getScale?.() || [0, 2, 4, 5, 7, 9, 11];

        // Map position to note
        const scaleIndex = Math.floor(y * scale.length);
        const octave = Math.floor((1 - x) * 2) + 1;
        const semitone = scale[Math.min(scaleIndex, scale.length - 1)];
        const freq = root * octave * Math.pow(2, semitone / 12);
        const velocity = 0.5 + x * 0.4;

        switch (instrument) {
            case 'melody':
                // Play melodic note
                GumpAudio.playTone?.(freq, 0.4, {
                    volume: velocity * 0.5,
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.2
                });

                // Emit note event for recording
                GumpEvents.emit('note.played', {
                    note: semitone + (octave * 12),
                    velocity,
                    position: { x, y, zone },
                    freq,
                    instrument: 'melody'
                });
                break;

            case 'drums':
                // Trigger drums based on Y position
                const drumVel = 0.5 + y * 0.3;
                if (y < 0.33) {
                    GumpDrums.playHat?.('closed', drumVel);
                } else if (y < 0.66) {
                    GumpDrums.playSnare?.('808', drumVel);
                } else {
                    GumpDrums.playKick?.('808', drumVel);
                }

                // Emit drum event for recording
                GumpEvents.emit('note.played', {
                    note: y < 0.33 ? 42 : (y < 0.66 ? 38 : 36), // GM drum map
                    velocity: drumVel,
                    position: { x, y, zone },
                    instrument: 'drums'
                });
                break;

            case 'rhythm':
                // Tap rhythms - wood block / click sounds
                const rhythmVel = 0.4 + y * 0.3;
                if (x < 0.5) {
                    GumpDrums.playWoodBlock?.({ volume: rhythmVel });
                } else {
                    GumpDrums.playClick?.({ volume: rhythmVel });
                }

                // Emit rhythm event
                GumpEvents.emit('note.played', {
                    note: x < 0.5 ? 76 : 77, // Wood blocks in GM
                    velocity: rhythmVel,
                    position: { x, y, zone },
                    instrument: 'rhythm'
                });
                break;
        }
    }

    // Handle CONDUCT zone - adjust AI/effect parameters
    function handleConductZone(zone, param, x, y) {
        // Value based on position (y=0 is top = max, y=1 is bottom = min)
        const value = 1 - y;

        switch (param) {
            case 'brightness':
                // Adjust filter brightness/cutoff
                if (GumpAudio.setFilterCutoff) {
                    GumpAudio.setFilterCutoff(200 + value * 8000);
                }
                break;

            case 'bass':
                // Adjust bass intensity
                if (GumpMusicalWorlds?.adjustParameter) {
                    GumpMusicalWorlds.adjustParameter('bassIntensity', value);
                }
                break;

            case 'release':
                // Adjust decay/reverb
                if (GumpAudio.setReverbMix) {
                    GumpAudio.setReverbMix(value * 0.8);
                }
                break;

            case 'modulation':
                // Adjust LFO depth
                if (GumpAudio.setLFODepth) {
                    GumpAudio.setLFODepth(value);
                }
                break;

            case 'arpeggio':
                // Adjust arpeggio rate/density
                if (GumpMusicalWorlds?.adjustParameter) {
                    GumpMusicalWorlds.adjustParameter('arpeggioRate', value);
                }
                break;

            case 'sub':
                // Adjust sub bass presence
                if (GumpMusicalWorlds?.adjustParameter) {
                    GumpMusicalWorlds.adjustParameter('subBass', value);
                }
                break;
        }

        // Emit conduct event for the AI to respond to
        GumpEvents.emit('conduct.gesture', {
            zone,
            param,
            value,
            position: { x, y }
        });
    }

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
    // AI MUSICIAN SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    //
    // The AI minds drive the music. They listen, they respond, they evolve.
    //

    const aiMusicians = {
        initialized: false,
        drumMind: null,
        bassMind: null,
        conductor: null,

        // Rhythm clock
        clock: {
            bpm: 85,
            step: 0,
            bar: 0,
            interval: null,
            swingAmount: 0.15,
        },

        // Phase-to-pattern mapping
        phasePatterns: {
            awakening: { era: 'genesis', patterns: ['pulse', 'breath'], density: 0.2 },
            discovery: { era: 'primordial', patterns: ['heartbeat', 'water'], density: 0.4 },
            descent: { era: 'tribal', patterns: ['ritual', 'ceremony'], density: 0.5 },
            struggle: { era: 'tribal', patterns: ['polyrhythm', 'trance'], density: 0.7 },
            rise: { era: 'modern', patterns: ['breakbeat', 'boom'], density: 0.6 },
            transcendence: { era: 'modern', patterns: ['trap', 'four_on_floor'], density: 0.8 },
        },
    };

    function initializeAIMusicians() {
        try {
            // Initialize drum mind if available
            if (typeof GumpDrumMind !== 'undefined') {
                aiMusicians.drumMind = GumpDrumMind.getInstance();
                if (aiMusicians.drumMind) {
                    aiMusicians.drumMind.start();
                    console.log('DrumMind AI initialized');
                }
            }

            // Initialize bass mind if available
            if (typeof GumpBassMind !== 'undefined') {
                aiMusicians.bassMind = GumpBassMind.getInstance?.();
                if (aiMusicians.bassMind) {
                    aiMusicians.bassMind.start();
                    console.log('BassMind AI initialized');
                }
            }

            // Initialize conductor if available
            if (typeof GumpConductor !== 'undefined') {
                aiMusicians.conductor = GumpConductor.getInstance?.();
                if (aiMusicians.conductor) {
                    aiMusicians.conductor.start();
                    console.log('Conductor AI initialized');
                }
            }

            aiMusicians.initialized = true;
        } catch (e) {
            console.warn('AI Musicians init error:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAGENTA AI INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function initializeMagentaAI() {
        if (typeof GumpMagentaEngine === 'undefined') {
            console.log('[GUMP] Magenta engine not available');
            return;
        }

        try {
            // Initialize async - don't block
            GumpMagentaEngine.init().then(success => {
                if (success) {
                    console.log('[GUMP] Magenta AI engine ready');
                    // Pre-generate some patterns for the current world
                    if (typeof GumpMusicalWorlds !== 'undefined') {
                        const world = GumpMusicalWorlds.currentWorld || 'genesis';
                        GumpMusicalWorlds.generateWorldDrumPattern(world);
                    }
                }
            });
        } catch (e) {
            console.warn('[GUMP] Magenta init error:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL WORLDS INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function initializeMusicalWorlds() {
        if (typeof GumpMusicalWorlds === 'undefined') {
            console.log('[GUMP] Musical Worlds not available');
            return;
        }

        console.log('[GUMP] Musical Worlds system ready');

        // Listen for world change events
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('world.change', onWorldChange);
            GumpEvents.on('world.colors', onWorldColorsChange);
            GumpEvents.on('drums.pattern', onDrumsPatternChange);
        }

        // Start in genesis world
        GumpMusicalWorlds.applyWorld('genesis');
    }

    function onWorldChange(data) {
        const { from, to, world } = data;
        console.log(`[GUMP] World changed: ${from} → ${to}`);

        // Update visual theme
        if (world.colors) {
            updateVisualTheme(world.colors);
        }

        // Update phase display text
        const eraDisplay = document.getElementById('era-display');
        if (eraDisplay) {
            eraDisplay.textContent = world.name;
            eraDisplay.style.color = world.colors?.accent || 'rgba(255,255,255,0.3)';
        }
    }

    function onWorldColorsChange(colors) {
        updateVisualTheme(colors);
    }

    function onDrumsPatternChange(data) {
        // Store the new pattern for playback
        aiMusicians.currentAIPattern = data.pattern;
        console.log(`[GUMP] New drum pattern for ${data.world}: ${data.style}`);
    }

    function updateVisualTheme(colors) {
        // Update CSS custom properties or canvas rendering
        if (colors.primary) {
            document.body.style.background = colors.primary;
        }
    }

    function startAIRhythm() {
        if (aiMusicians.clock.interval) return;

        const clock = aiMusicians.clock;
        const msPerStep = (60000 / clock.bpm) / 4;  // 16th notes

        clock.interval = setInterval(() => {
            // Apply swing to even steps
            const isSwungStep = clock.step % 2 === 1;
            const swingDelay = isSwungStep ? clock.swingAmount * msPerStep : 0;

            setTimeout(() => {
                triggerAIStep(clock.step, clock.bar);
            }, swingDelay);

            clock.step++;
            if (clock.step >= 16) {
                clock.step = 0;
                clock.bar++;
                onAIBarChange(clock.bar);
            }
        }, msPerStep);

        console.log('AI Rhythm started at', clock.bpm, 'BPM');
    }

    function stopAIRhythm() {
        if (aiMusicians.clock.interval) {
            clearInterval(aiMusicians.clock.interval);
            aiMusicians.clock.interval = null;
        }
    }

    function triggerAIStep(step, bar) {
        // Get current phase mood
        const phaseName = PHASE_NAMES[evolution.phase] || 'awakening';
        const mood = PHASE_MOOD[phaseName] || PHASE_MOOD.awakening;
        const phaseConfig = aiMusicians.phasePatterns[phaseName] || aiMusicians.phasePatterns.awakening;

        // ═══════════════════════════════════════════════════════════════
        // PRIORITY: AI-GENERATED PATTERNS FROM MUSICAL WORLDS
        // ═══════════════════════════════════════════════════════════════
        if (aiMusicians.currentAIPattern) {
            playAIGeneratedDrums(step, bar, aiMusicians.currentAIPattern, mood);
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // FALLBACK: AI DRUM MIND AGENT
        // ═══════════════════════════════════════════════════════════════
        if (aiMusicians.drumMind) {
            GumpEvents?.emit?.('step', { step, bar, mood, phaseConfig });
            return;
        }

        // ═══════════════════════════════════════════════════════════════
        // FINAL FALLBACK: Phase-based procedural drums
        // ═══════════════════════════════════════════════════════════════
        playPhaseBasedDrums(step, bar, phaseName, mood, phaseConfig);
    }

    /**
     * Play drums from AI-generated pattern
     * This is where the magic happens - patterns that actually GROOVE
     */
    function playAIGeneratedDrums(step, bar, pattern, mood) {
        const volume = 0.4 + mood.tension * 0.3;
        const totalSteps = pattern.kick?.length || 32;
        const patternStep = (bar * 16 + step) % totalSteps;

        // Play each instrument if it has a hit on this step
        if (pattern.kick && pattern.kick[patternStep] > 0) {
            const vel = pattern.kick[patternStep] === 2 ? 1.0 : 0.7;
            // Choose kick type based on current world
            const world = GumpMusicalWorlds?.currentWorld || 'genesis';
            switch (world) {
                case 'trap':
                    GumpDrums.play808Deep?.({ volume: volume * vel });
                    break;
                case 'tribal':
                    GumpDrums.playTribalKick?.({ volume: volume * vel });
                    break;
                case 'electronic':
                    GumpDrums.play808Short?.({ volume: volume * vel });
                    break;
                case 'jazz':
                    GumpDrums.playOrganicKick?.({ volume: volume * vel * 0.8 });
                    break;
                case 'cinematic':
                    GumpDrums.play808Deep?.({ volume: volume * vel });
                    break;
                case 'chaos':
                    GumpDrums.play808Distorted?.({ volume: volume * vel });
                    break;
                default:
                    GumpDrums.play808Kick?.({ volume: volume * vel });
            }
        }

        if (pattern.snare && pattern.snare[patternStep] > 0) {
            const vel = pattern.snare[patternStep] === 2 ? 1.0 : 0.7;
            GumpDrums.playSnare808?.({ volume: volume * vel });
        }

        if (pattern.hihat && pattern.hihat[patternStep] > 0) {
            const vel = pattern.hihat[patternStep] === 2 ? 0.5 : 0.35;
            GumpDrums.playHiHat?.({ type: 'closed', volume: volume * vel });
        }

        if (pattern.openHat && pattern.openHat[patternStep] > 0) {
            const vel = pattern.openHat[patternStep] === 2 ? 0.6 : 0.4;
            GumpDrums.playHiHat?.({ type: 'open', volume: volume * vel });
        }

        if (pattern.perc && pattern.perc[patternStep] > 0) {
            const vel = pattern.perc[patternStep] === 2 ? 0.5 : 0.35;
            const world = GumpMusicalWorlds?.currentWorld || 'genesis';
            if (world === 'tribal') {
                GumpDrums.playConga?.({ volume: volume * vel });
            } else {
                GumpDrums.playWoodBlock?.({ volume: volume * vel });
            }
        }
    }

    function playPhaseBasedDrums(step, bar, phaseName, mood, phaseConfig) {
        const volume = 0.3 + mood.tension * 0.3;
        const density = phaseConfig.density;

        // Different patterns for different phases - NOT just 2 and 4
        switch (phaseName) {
            case 'awakening':
                // Minimal - just occasional deep pulses
                if (step === 0 && Math.random() < 0.7) {
                    GumpDrums.play808Sub?.({ volume: volume * 0.6 });
                }
                break;

            case 'discovery':
                // Heartbeat - organic, human
                if (step === 0 || step === 7) {
                    GumpDrums.playOrganicKick?.({ volume: volume * 0.7 });
                }
                if (step === 3 || step === 11) {
                    GumpDrums.playClick?.({ volume: volume * 0.3 });
                }
                break;

            case 'descent':
                // Ritual - polyrhythmic, tribal
                // 3-against-4 feel
                if (step % 5 === 0) {
                    GumpDrums.playTribalKick?.({ volume: volume * 0.8 });
                }
                if (step % 3 === 0 && step !== 0) {
                    GumpDrums.playWoodBlock?.({ volume: volume * 0.4, freq: 600 + step * 50 });
                }
                if (step === 4 || step === 12) {
                    GumpDrums.playSnare808?.({ volume: volume * 0.5, noiseAmount: 0.3 });
                }
                break;

            case 'struggle':
                // Chaos - syncopated, aggressive, unpredictable
                const chaosRoll = Math.random();
                if (step === 0 || step === 6 || step === 10) {
                    GumpDrums.play808Distorted?.({ volume: volume });
                }
                if (step === 4 || step === 13) {
                    GumpDrums.playSnare808?.({ volume: volume * 0.8 });
                }
                // Random ghost notes for chaos
                if (chaosRoll < mood.chaos * 0.4) {
                    GumpDrums.playHiHat?.({ type: 'closed', volume: volume * 0.3 });
                }
                // Occasional crash
                if (step === 0 && bar % 4 === 0) {
                    GumpDrums.playHiHat?.({ type: 'open', volume: volume * 0.5 });
                }
                break;

            case 'rise':
                // Building - driving, forward momentum
                // Kick pattern that pushes forward
                if (step === 0 || step === 3 || step === 8 || step === 11) {
                    GumpDrums.play808Short?.({ volume: volume * 0.8 });
                }
                if (step === 4 || step === 12) {
                    GumpDrums.playSnare808?.({ volume: volume * 0.7 });
                }
                // Hi-hats driving
                if (step % 2 === 0) {
                    GumpDrums.playHiHat?.({ type: 'closed', volume: volume * 0.4 });
                }
                // Build intensity with fills every 4 bars
                if (bar % 4 === 3 && step >= 12) {
                    GumpDrums.playSnare808?.({ volume: volume * 0.5 });
                }
                break;

            case 'transcendence':
                // Triumph - full, powerful, but breathing
                if (step === 0 || step === 8) {
                    GumpDrums.play808Deep?.({ volume: volume });
                }
                if (step === 4) {
                    GumpDrums.play808Short?.({ volume: volume * 0.5 });
                }
                if (step === 4 || step === 12) {
                    GumpDrums.playClap?.({ volume: volume * 0.6 });
                }
                // Driving hi-hats
                GumpDrums.playHiHat?.({
                    type: step % 4 === 2 ? 'open' : 'closed',
                    volume: volume * (step % 2 === 0 ? 0.4 : 0.25)
                });
                break;
        }
    }

    function onAIBarChange(bar) {
        const phaseName = PHASE_NAMES[evolution.phase] || 'awakening';
        const phaseConfig = aiMusicians.phasePatterns[phaseName];

        // Update drum mind with current context
        if (aiMusicians.drumMind) {
            aiMusicians.drumMind.handleMessage?.({
                type: 'dynamics.change',
                data: { dynamics: evolution.intensity }
            });
        }

        // Every 8 bars, consider pattern variation
        if (bar % 8 === 7) {
            if (aiMusicians.drumMind) {
                aiMusicians.drumMind.triggerFill?.(evolution.intensity);
            } else {
                // Play a fill
                playDrumFill(phaseName);
            }
        }
    }

    function playDrumFill(phaseName) {
        const mood = PHASE_MOOD[phaseName] || PHASE_MOOD.awakening;
        const volume = 0.4 + mood.tension * 0.3;

        // Quick fill based on phase
        switch (phaseName) {
            case 'struggle':
                // Chaotic fill
                [0, 80, 160, 200, 250, 300, 350].forEach((delay, i) => {
                    setTimeout(() => {
                        if (i % 2 === 0) {
                            GumpDrums.playSnare808?.({ volume: volume * (0.5 + i * 0.1) });
                        } else {
                            GumpDrums.play808Distorted?.({ volume: volume * 0.6 });
                        }
                    }, delay);
                });
                break;

            case 'rise':
                // Building fill - snare roll
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        GumpDrums.playSnare808?.({ volume: volume * (0.3 + i * 0.1) });
                    }, i * 60);
                }
                break;

            case 'transcendence':
                // Triumphant fill
                [0, 100, 200, 350].forEach((delay, i) => {
                    setTimeout(() => {
                        GumpDrums.playTom?.({ freq: 200 - i * 40, volume: volume });
                    }, delay);
                });
                setTimeout(() => {
                    GumpDrums.play808Deep?.({ volume: volume });
                    GumpDrums.playHiHat?.({ type: 'open', volume: volume * 0.6 });
                }, 450);
                break;

            default:
                // Simple fill
                setTimeout(() => GumpDrums.playSnare808?.({ volume: volume * 0.6 }), 0);
                setTimeout(() => GumpDrums.playSnare808?.({ volume: volume * 0.8 }), 150);
                setTimeout(() => GumpDrums.playOrganicKick?.({ volume: volume }), 300);
        }
    }

    function setAITempo(bpm) {
        const wasPlaying = aiMusicians.clock.interval !== null;
        if (wasPlaying) stopAIRhythm();
        aiMusicians.clock.bpm = Math.max(40, Math.min(180, bpm));
        if (wasPlaying) startAIRhythm();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE COMBO UNLOCK SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Visit combinations of zones to unlock unique music presets.
    // Zones glow yellow when part of an active combo.
    // Each combo = a different musical world.
    //

    const comboSystem = {
        // Track visited zones in current session
        visitedZones: new Set(),
        activeCombo: null,
        comboTimeout: null,
        lastVisitTime: 0,

        // Visual state for each zone
        zoneGlow: {},  // zone -> glow intensity (0-1)

        // Unlocked combos persist
        unlockedCombos: new Set(),

        // All possible combos and their music presets
        combos: {
            // Cardinal directions - NSEW combos
            'nsew': {
                zones: ['n', 's', 'e', 'w'],
                name: 'The Cross',
                preset: 'ambient_cross',
                sound: { style: 'ambient', root: 55, mode: 'dorian', bpm: 70 }
            },
            'corners': {
                zones: ['nw', 'ne', 'sw', 'se'],
                name: 'Four Corners',
                preset: 'epic_corners',
                sound: { style: 'cinematic', root: 65, mode: 'minor', bpm: 90 }
            },

            // Triangles
            'triangle_up': {
                zones: ['sw', 'n', 'se'],
                name: 'Rising Triangle',
                preset: 'uplifting',
                sound: { style: 'uplifting', root: 82, mode: 'major', bpm: 120 }
            },
            'triangle_down': {
                zones: ['nw', 's', 'ne'],
                name: 'Falling Triangle',
                preset: 'melancholy',
                sound: { style: 'melancholy', root: 49, mode: 'phrygian', bpm: 65 }
            },
            'triangle_left': {
                zones: ['nw', 'w', 'sw'],
                name: 'West Triangle',
                preset: 'mysterious',
                sound: { style: 'mysterious', root: 55, mode: 'locrian', bpm: 75 }
            },
            'triangle_right': {
                zones: ['ne', 'e', 'se'],
                name: 'East Triangle',
                preset: 'energetic',
                sound: { style: 'energetic', root: 73, mode: 'mixolydian', bpm: 130 }
            },

            // Lines
            'vertical_line': {
                zones: ['n', 'center', 's'],
                name: 'Vertical Flow',
                preset: 'vertical',
                sound: { style: 'flowing', root: 55, mode: 'aeolian', bpm: 85 }
            },
            'horizontal_line': {
                zones: ['w', 'center', 'e'],
                name: 'Horizontal Flow',
                preset: 'horizontal',
                sound: { style: 'pulsing', root: 65, mode: 'lydian', bpm: 100 }
            },
            'diagonal_down': {
                zones: ['nw', 'center', 'se'],
                name: 'Descending Path',
                preset: 'descent',
                sound: { style: 'dark', root: 41, mode: 'phrygian', bpm: 60 }
            },
            'diagonal_up': {
                zones: ['sw', 'center', 'ne'],
                name: 'Ascending Path',
                preset: 'ascent',
                sound: { style: 'bright', root: 98, mode: 'major', bpm: 110 }
            },

            // L-shapes
            'l_nw': {
                zones: ['n', 'w', 'sw'],
                name: 'Northwest Hook',
                preset: 'hook_nw',
                sound: { style: 'jazz', root: 55, mode: 'dorian', bpm: 95 }
            },
            'l_ne': {
                zones: ['n', 'e', 'se'],
                name: 'Northeast Hook',
                preset: 'hook_ne',
                sound: { style: 'funk', root: 65, mode: 'mixolydian', bpm: 105 }
            },
            'l_sw': {
                zones: ['s', 'w', 'nw'],
                name: 'Southwest Hook',
                preset: 'hook_sw',
                sound: { style: 'tribal', root: 49, mode: 'aeolian', bpm: 80 }
            },
            'l_se': {
                zones: ['s', 'e', 'ne'],
                name: 'Southeast Hook',
                preset: 'hook_se',
                sound: { style: 'electronic', root: 82, mode: 'minor', bpm: 128 }
            },

            // Plus patterns
            'plus_small': {
                zones: ['n', 's', 'e', 'w', 'center'],
                name: 'Inner Cross',
                preset: 'centered',
                sound: { style: 'meditative', root: 55, mode: 'major', bpm: 60 }
            },

            // Edge + corner combos
            'north_span': {
                zones: ['nw', 'n', 'ne'],
                name: 'Northern Span',
                preset: 'cold',
                sound: { style: 'cold', root: 73, mode: 'phrygian', bpm: 70 }
            },
            'south_span': {
                zones: ['sw', 's', 'se'],
                name: 'Southern Span',
                preset: 'warm',
                sound: { style: 'warm', root: 49, mode: 'lydian', bpm: 85 }
            },
            'west_span': {
                zones: ['nw', 'w', 'sw'],
                name: 'Western Span',
                preset: 'ancient',
                sound: { style: 'ancient', root: 41, mode: 'dorian', bpm: 55 }
            },
            'east_span': {
                zones: ['ne', 'e', 'se'],
                name: 'Eastern Span',
                preset: 'future',
                sound: { style: 'future', root: 98, mode: 'lydian', bpm: 140 }
            },

            // Special combos
            'all_nine': {
                zones: ['nw', 'n', 'ne', 'w', 'center', 'e', 'sw', 's', 'se'],
                name: 'Complete Unity',
                preset: 'transcendence',
                sound: { style: 'transcendent', root: 55, mode: 'major', bpm: 108 }
            },
            'outer_ring': {
                zones: ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'],
                name: 'Outer Ring',
                preset: 'orbital',
                sound: { style: 'orbital', root: 65, mode: 'aeolian', bpm: 118 }
            },
            'diamond': {
                zones: ['n', 'e', 's', 'w'],
                name: 'Diamond',
                preset: 'crystal',
                sound: { style: 'crystal', root: 110, mode: 'major', bpm: 125 }
            },
        },

        // Preset sound definitions
        presetSounds: {
            ambient_cross: () => playAmbientCrossPreset(),
            epic_corners: () => playEpicCornersPreset(),
            uplifting: () => playUpliftingPreset(),
            melancholy: () => playMelancholyPreset(),
            transcendence: () => playTranscendencePreset(),
        }
    };

    function onZoneVisit(zone) {
        const now = Date.now();
        comboSystem.visitedZones.add(zone);
        comboSystem.lastVisitTime = now;

        // Update zone glow
        comboSystem.zoneGlow[zone] = 1.0;

        // Clear timeout and set new one (2 second window to complete combo)
        if (comboSystem.comboTimeout) {
            clearTimeout(comboSystem.comboTimeout);
        }
        comboSystem.comboTimeout = setTimeout(() => {
            checkAndTriggerCombo();
            fadeZoneGlows();
        }, 2000);

        // Check for combo matches in real-time
        checkComboProgress();
    }

    function checkComboProgress() {
        const visited = comboSystem.visitedZones;

        // Find matching combos
        for (const [comboId, combo] of Object.entries(comboSystem.combos)) {
            const required = new Set(combo.zones);
            const matches = [...required].filter(z => visited.has(z));

            if (matches.length === required.size) {
                // COMBO UNLOCKED
                triggerComboUnlock(comboId, combo);
            } else if (matches.length >= 2) {
                // Partial match - glow the remaining zones as hints
                hintRemainingZones(combo.zones, visited);
            }
        }
    }

    function checkAndTriggerCombo() {
        // Reset after timeout
        comboSystem.visitedZones.clear();
    }

    function triggerComboUnlock(comboId, combo) {
        if (comboSystem.unlockedCombos.has(comboId) && Date.now() - comboSystem.lastVisitTime < 500) {
            // Already unlocked recently, don't spam
            return;
        }

        console.log(`COMBO UNLOCKED: ${combo.name}`);
        comboSystem.activeCombo = combo;
        comboSystem.unlockedCombos.add(comboId);

        // Visual feedback - all zones in combo glow bright
        combo.zones.forEach(zone => {
            comboSystem.zoneGlow[zone] = 1.0;
        });

        // ═══════════════════════════════════════════════════════════════
        // MUSICAL WORLDS INTEGRATION - Dramatic style shifts!
        // ═══════════════════════════════════════════════════════════════
        if (typeof GumpMusicalWorlds !== 'undefined') {
            // Let Musical Worlds handle the transition (includes sound)
            const worldTriggered = GumpMusicalWorlds.handleComboUnlock(comboId);
            if (!worldTriggered) {
                // Fallback if no world mapping
                playComboUnlockSound(combo);
                applyMusicPreset(combo);
            }
        } else {
            // Fallback to old behavior
            playComboUnlockSound(combo);
            applyMusicPreset(combo);
        }

        // Clear for next combo
        setTimeout(() => {
            comboSystem.visitedZones.clear();
            comboSystem.activeCombo = null;
        }, 500);

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([50, 30, 100]);
        }
    }

    function hintRemainingZones(requiredZones, visitedZones) {
        // Subtle glow on zones needed to complete combo
        requiredZones.forEach(zone => {
            if (!visitedZones.has(zone)) {
                comboSystem.zoneGlow[zone] = Math.max(comboSystem.zoneGlow[zone] || 0, 0.3);
            }
        });
    }

    function fadeZoneGlows() {
        for (const zone of Object.keys(comboSystem.zoneGlow)) {
            comboSystem.zoneGlow[zone] *= 0.9;
            if (comboSystem.zoneGlow[zone] < 0.05) {
                delete comboSystem.zoneGlow[zone];
            }
        }
    }

    function playComboUnlockSound(combo) {
        const root = combo.sound.root || 55;

        // Fanfare based on combo style
        switch (combo.sound.style) {
            case 'cinematic':
                GumpBass.play808Long?.({ freq: root / 2, volume: 0.6 });
                triggerTheBWAAAM();
                break;

            case 'uplifting':
                // Major arpeggio up
                [0, 4, 7, 12].forEach((semi, i) => {
                    setTimeout(() => {
                        GumpAudio.playTone?.(root * Math.pow(2, semi/12), 0.5, { volume: 0.3, attack: 0.01 });
                    }, i * 80);
                });
                break;

            case 'melancholy':
                // Minor chord swell
                GumpAudio.playChord?.(root, [0, 3, 7], 3, { volume: 0.25, attack: 0.5, waveform: 'triangle' });
                break;

            case 'transcendent':
                triggerTheBWAAAM();
                setTimeout(() => triggerTranscendence(), 500);
                break;

            default:
                // Generic unlock sound
                GumpAudio.playTone?.(root * 2, 0.3, { volume: 0.25, attack: 0.01 });
                GumpDrums.playClick?.({ volume: 0.3 });
        }
    }

    function applyMusicPreset(combo) {
        const sound = combo.sound;

        // Adjust AI rhythm BPM
        if (sound.bpm) {
            setAITempo(sound.bpm);
        }

        // Adjust root note
        if (sound.root) {
            evolution.rootNote = sound.root;
            musicLayers.root = sound.root;
        }

        // Set chord quality based on mode
        if (sound.mode) {
            applyMode(sound.mode);
        }

        console.log(`Applied preset: ${combo.preset} (${sound.style}, ${sound.bpm} BPM)`);
    }

    function applyMode(modeName) {
        // Mode intervals (semitones from root)
        const modes = {
            major:      [0, 2, 4, 5, 7, 9, 11],
            minor:      [0, 2, 3, 5, 7, 8, 10],
            dorian:     [0, 2, 3, 5, 7, 9, 10],
            phrygian:   [0, 1, 3, 5, 7, 8, 10],
            lydian:     [0, 2, 4, 6, 7, 9, 11],
            mixolydian: [0, 2, 4, 5, 7, 9, 10],
            aeolian:    [0, 2, 3, 5, 7, 8, 10],
            locrian:    [0, 1, 3, 5, 6, 8, 10],
        };

        const scale = modes[modeName] || modes.minor;
        // Store for melody generation
        evolution.currentScale = scale;
        evolution.currentMode = modeName;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN LEARNING SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Notices when you play something sick and saves it.
    // Your best moves become building blocks.
    //

    const patternMemory = {
        // Learned patterns
        learned: [],
        maxLearned: 20,

        // Current recording buffer
        recording: {
            active: false,
            zones: [],
            timestamps: [],
            startTime: 0,
        },

        // Thresholds for "sick" detection
        sicknessThresholds: {
            minZones: 4,           // At least 4 zones
            maxDuration: 5000,     // Complete within 5 seconds
            minSpeed: 0.3,         // Moving at decent speed
            uniqueZones: 3,        // At least 3 different zones
        },

        // Playback state
        playingBack: null,
    };

    function startPatternRecording() {
        patternMemory.recording = {
            active: true,
            zones: [],
            timestamps: [],
            velocities: [],
            startTime: Date.now(),
        };
    }

    function recordPatternStep(zone, velocity) {
        if (!patternMemory.recording.active) return;

        const now = Date.now();
        const relativeTime = now - patternMemory.recording.startTime;

        patternMemory.recording.zones.push(zone);
        patternMemory.recording.timestamps.push(relativeTime);
        patternMemory.recording.velocities.push(velocity || 1);

        // Check if pattern is getting too long
        if (relativeTime > patternMemory.sicknessThresholds.maxDuration) {
            finishPatternRecording();
        }
    }

    function finishPatternRecording() {
        if (!patternMemory.recording.active) return;

        const recording = patternMemory.recording;
        recording.active = false;

        // Evaluate if this pattern is "sick"
        const sickness = evaluatePatternSickness(recording);

        if (sickness.isSick) {
            learnPattern(recording, sickness);
        }
    }

    function evaluatePatternSickness(recording) {
        const thresholds = patternMemory.sicknessThresholds;

        // Basic checks
        if (recording.zones.length < thresholds.minZones) {
            return { isSick: false, reason: 'too_short' };
        }

        const duration = recording.timestamps[recording.timestamps.length - 1];
        if (duration > thresholds.maxDuration) {
            return { isSick: false, reason: 'too_slow' };
        }

        const uniqueZones = new Set(recording.zones).size;
        if (uniqueZones < thresholds.uniqueZones) {
            return { isSick: false, reason: 'not_varied' };
        }

        // Calculate rhythm consistency
        const intervals = [];
        for (let i = 1; i < recording.timestamps.length; i++) {
            intervals.push(recording.timestamps[i] - recording.timestamps[i-1]);
        }

        // Check for rhythmic pattern (consistent intervals)
        const avgInterval = intervals.reduce((a,b) => a+b, 0) / intervals.length;
        let rhythmScore = 0;
        for (const interval of intervals) {
            const ratio = interval / avgInterval;
            // Good ratios: 0.5, 1, 2 (half time, normal, double)
            if (Math.abs(ratio - 0.5) < 0.2 || Math.abs(ratio - 1) < 0.2 || Math.abs(ratio - 2) < 0.2) {
                rhythmScore++;
            }
        }
        const rhythmConsistency = rhythmScore / intervals.length;

        // Check for shape (does it form a recognizable pattern?)
        const shapeScore = detectShapeInRecording(recording);

        // Overall sickness score
        const sicknessScore = (rhythmConsistency * 0.4) + (shapeScore * 0.3) + (uniqueZones / 9 * 0.3);

        return {
            isSick: sicknessScore > 0.5,
            score: sicknessScore,
            rhythmConsistency,
            shapeScore,
            uniqueZones,
            duration,
        };
    }

    function detectShapeInRecording(recording) {
        // Check if the zone sequence forms a known shape
        const zones = recording.zones;

        // Simple shape detection
        const zoneSet = new Set(zones);

        // Check for common patterns
        if (arraysMatchLoose(zones, ['nw', 'ne', 'se', 'sw']) ||
            arraysMatchLoose(zones, ['n', 's', 'e', 'w'])) {
            return 1.0; // Perfect square or cross
        }

        if (zones.length >= 3 && zoneSet.size >= 3) {
            // Check for triangle-ish patterns
            return 0.6;
        }

        if (zones.length >= 6 && zoneSet.size >= 5) {
            // Complex pattern
            return 0.8;
        }

        return 0.3;
    }

    function arraysMatchLoose(arr1, arr2) {
        if (arr1.length < arr2.length) return false;
        const set1 = new Set(arr1);
        return arr2.every(item => set1.has(item));
    }

    function learnPattern(recording, sickness) {
        const pattern = {
            id: `learned_${Date.now()}`,
            zones: [...recording.zones],
            timestamps: [...recording.timestamps],
            velocities: [...recording.velocities],
            sickness: sickness,
            playCount: 0,
            createdAt: Date.now(),
        };

        patternMemory.learned.push(pattern);

        // Keep only the best patterns
        if (patternMemory.learned.length > patternMemory.maxLearned) {
            // Sort by sickness score and keep top
            patternMemory.learned.sort((a, b) => b.sickness.score - a.sickness.score);
            patternMemory.learned = patternMemory.learned.slice(0, patternMemory.maxLearned);
        }

        console.log(`SICK PATTERN LEARNED: ${pattern.id} (score: ${sickness.score.toFixed(2)})`);

        // Visual/audio feedback
        playPatternLearnedFeedback(sickness.score);
    }

    function playPatternLearnedFeedback(score) {
        // Celebratory sound based on how sick the pattern was
        const root = evolution.rootNote || 55;

        if (score > 0.8) {
            // Super sick - full fanfare
            [0, 4, 7, 12, 16].forEach((semi, i) => {
                setTimeout(() => {
                    GumpAudio.playTone?.(root * Math.pow(2, semi/12), 0.4, {
                        volume: 0.2,
                        attack: 0.01,
                        waveform: 'triangle'
                    });
                }, i * 60);
            });
            GumpDrums.playClap?.({ volume: 0.4 });
        } else {
            // Good pattern - simple confirmation
            GumpAudio.playTone?.(root * 2, 0.2, { volume: 0.15, attack: 0.01 });
        }

        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    function playbackLearnedPattern(patternId) {
        const pattern = patternMemory.learned.find(p => p.id === patternId);
        if (!pattern) return;

        pattern.playCount++;
        patternMemory.playingBack = pattern;

        // Play the pattern as sound sequence
        const root = evolution.rootNote || 55;
        const zoneToFreq = {
            'nw': root * 2,
            'n': root * 2.25,
            'ne': root * 2.5,
            'w': root * 1.5,
            'center': root * 1.75,
            'e': root * 2,
            'sw': root * 1.125,
            's': root * 1.25,
            'se': root * 1.5,
        };

        pattern.zones.forEach((zone, i) => {
            setTimeout(() => {
                const freq = zoneToFreq[zone] || root;
                const velocity = pattern.velocities[i] || 1;

                GumpAudio.playTone?.(freq, 0.2, {
                    volume: 0.15 * velocity,
                    attack: 0.01,
                    waveform: 'triangle'
                });

                // Also light up the zone
                comboSystem.zoneGlow[zone] = 0.8;
            }, pattern.timestamps[i]);
        });

        // Clear playback state after done
        const duration = pattern.timestamps[pattern.timestamps.length - 1] + 500;
        setTimeout(() => {
            patternMemory.playingBack = null;
        }, duration);
    }

    function getLearnedPatterns() {
        return patternMemory.learned.map(p => ({
            id: p.id,
            zones: p.zones.length,
            score: p.sickness.score,
            playCount: p.playCount,
        }));
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
        // AI rhythm now handles drums - this layer just enables the flag
        // The actual drum patterns come from playPhaseBasedDrums()
        console.log('Rhythm layer activated - AI drums enabled');

        // Boost the AI rhythm intensity when this layer is unlocked
        if (aiMusicians.clock.interval) {
            // Already running - just note that rhythm layer is now active
        } else {
            // Start it if not already running
            startAIRhythm();
        }
    }

    function startCounterRhythmLayer(root) {
        // Counter rhythm adds polyrhythmic percussion texture
        // Plays a 3-against-4 pattern for that tribal/complex feel
        let step = 0;

        const interval = setInterval(() => {
            if (!musicLayers.active.has('counter_rhythm')) {
                clearInterval(interval);
                return;
            }

            // Polyrhythmic pattern - accents every 3 steps against the 4-beat
            if (step % 3 === 0) {
                const phaseName = PHASE_NAMES[evolution.phase] || 'awakening';
                const volume = 0.2 + (PHASE_MOOD[phaseName]?.tension || 0) * 0.2;

                // Vary the percussion based on position in cycle
                const cyclePos = (step / 3) % 4;
                switch (cyclePos) {
                    case 0:
                        GumpDrums.playWoodBlock?.({ volume, freq: 800 });
                        break;
                    case 1:
                        GumpDrums.playClick?.({ volume: volume * 0.8 });
                        break;
                    case 2:
                        GumpDrums.playWoodBlock?.({ volume: volume * 0.9, freq: 600 });
                        break;
                    case 3:
                        GumpDrums.playShaker?.({ volume: volume * 0.6 });
                        break;
                }
            }

            step++;
        }, 125); // Faster for 16th note feel

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

        // Get current mood
        const phaseName = PHASE_NAMES[evolution.phase] || 'awakening';
        const mood = PHASE_MOOD[phaseName] || PHASE_MOOD.awakening;

        // Apply breathing to master volume (breathing rate changes with tension)
        const breathRate = 0.15 + mood.tension * 0.2;  // Faster breathing when tense
        evolution.breathPhase += dt * breathRate * Math.PI * 2;
        const breathAmount = 0.05 + mood.chaos * 0.1;  // More variation during chaos
        const breathValue = Math.sin(evolution.breathPhase) * breathAmount;

        if (GumpAudio.isInitialized && evolution.phase > 0) {
            // Volume affected by mood brightness
            const baseVolume = 0.5 + mood.brightness * 0.3 + evolution.intensity * 0.2;
            GumpAudio.setMasterVolume?.(baseVolume + breathValue, 0.1);
        }

        // Apply continuous mood effects
        applyMoodEffects(mood, dt);

        // Intensity-based layers
        updateIntensityLayers();

        // Check for THE DROP
        checkForTheDrop();

        // Call and response system
        updateCallAndResponse(dt, speed);
    }

    function applyMoodEffects(mood, dt) {
        // During struggle, occasionally play dissonant tones
        if (mood.chaos > 0.5 && Math.random() < mood.chaos * 0.02) {
            const root = evolution.rootNote;
            // Random dissonant interval (minor 2nd, tritone, major 7th)
            const dissonantIntervals = [1, 6, 11];
            const interval = dissonantIntervals[Math.floor(Math.random() * dissonantIntervals.length)];
            const freq = root * Math.pow(2, interval / 12) * (2 + Math.random() * 2);

            GumpAudio.playTone?.(freq, 0.5 + Math.random(), {
                volume: 0.05 + mood.chaos * 0.1,
                attack: 0.01,
                release: 0.5,
                waveform: 'sawtooth',
            });
        }

        // During struggle, occasional rumbles
        if (mood.tension > 0.7 && Math.random() < 0.005) {
            GumpBass.playSubBass?.({
                freq: evolution.rootNote / 4,
                duration: 1 + Math.random() * 2,
                volume: 0.2 + mood.tension * 0.2
            });
        }

        // During hope phases, occasional sparkles
        if (mood.hope > 0.7 && mood.brightness > 0.6 && Math.random() < 0.01) {
            const sparkleFreq = evolution.rootNote * (4 + Math.random() * 4);
            GumpAudio.playTone?.(sparkleFreq, 0.3, {
                volume: 0.1,
                attack: 0.01,
                release: 0.3,
                waveform: 'triangle',
            });
        }
    }

    function onPhaseChange(from, to) {
        const fromName = PHASE_NAMES[from] || 'awakening';
        const toName = PHASE_NAMES[to] || 'awakening';
        console.log(`Phase change: ${fromName} → ${toName}`);

        // Get the mood for this phase
        const mood = PHASE_MOOD[toName] || PHASE_MOOD.awakening;

        // Apply root note shift (creates harmonic journey)
        const baseRoot = 55;  // A1
        evolution.rootNote = baseRoot * Math.pow(2, mood.rootShift / 12);

        // Apply filter based on brightness (darker = more filtered)
        const filterFreq = 200 + mood.brightness * 8000;
        GumpAudio.setFilterCutoff?.(filterFreq, 2);

        // Unlock layers progressively
        if (to >= 1) {
            evolution.layers.melody = true;
            evolution.layers.harmony = true;
        }
        if (to >= 2) {
            evolution.layers.bass = true;
            evolution.layers.rhythm = true;
        }
        if (to >= 4) {  // Rise and beyond
            evolution.layers.orchestral = true;
        }

        // ═══════════════════════════════════════════════════════════════
        // MUSICAL WORLDS - Auto-transition based on Hero's Journey phase
        // This creates DRAMATIC shifts as time progresses!
        // ═══════════════════════════════════════════════════════════════
        if (typeof GumpMusicalWorlds !== 'undefined') {
            const phaseToWorld = {
                'awakening': 'genesis',
                'discovery': 'primordial',
                'descent': 'tribal',
                'struggle': 'chaos',
                'rise': 'cinematic',
                'transcendence': 'transcendence',
            };

            const targetWorld = phaseToWorld[toName];
            if (targetWorld && GumpMusicalWorlds.currentWorld !== targetWorld) {
                console.log(`[Hero's Journey] Phase ${toName} → World ${targetWorld}`);
                GumpMusicalWorlds.transitionToWorld(targetWorld);
                // Musical Worlds handles its own transition sounds, skip legacy
                return;
            }
        }

        // Fallback: Play transition sound based on where we're going
        playPhaseTransition(toName, mood);
    }

    function playPhaseTransition(phaseName, mood) {
        const root = evolution.rootNote;

        switch (phaseName) {
            case 'awakening':
                // Gentle beginning
                GumpAudio.playChord?.(root * 2, [0, 4, 7], 3, {
                    volume: 0.2,
                    attack: 1,
                    release: 2,
                    waveform: 'triangle',
                });
                break;

            case 'discovery':
                // Hopeful expansion
                GumpAudio.playChord?.(root * 2, [0, 4, 7, 11], 3, {
                    volume: 0.25,
                    attack: 0.5,
                    release: 2,
                    waveform: 'triangle',
                });
                break;

            case 'descent':
                // Things get darker - minor chord, lower, filtered
                playDescentTransition(root);
                break;

            case 'struggle':
                // The low point - dissonance, chaos
                playStruggleTransition(root);
                break;

            case 'rise':
                // Hope returns - building energy
                playRiseTransition(root);
                break;

            case 'transcendence':
                // The triumph - brighter than ever
                playTranscendenceTransition(root);
                break;
        }
    }

    function playDescentTransition(root) {
        // Descending into darkness
        // Minor chord with lowered 5th (diminished feel)
        GumpAudio.playChord?.(root, [0, 3, 6], 4, {
            volume: 0.3,
            attack: 0.1,
            release: 3,
            waveform: 'sawtooth',
        });

        // Low rumble
        GumpBass.playSubBass?.({ freq: root / 2, duration: 4, volume: 0.3 });

        // Distant thunder
        setTimeout(() => {
            GumpDrums.play808Deep?.({ volume: 0.4 });
        }, 1000);

        // Filter sweep down (things getting muffled)
        GumpAudio.setFilterCutoff?.(4000, 0);
        setTimeout(() => GumpAudio.setFilterCutoff?.(800, 3), 100);

        if (navigator.vibrate) {
            navigator.vibrate([50, 100, 50, 100, 200]);
        }
    }

    function playStruggleTransition(root) {
        // The darkest moment - chaos and dissonance
        // Tritone - the devil's interval
        const tritone = root * Math.pow(2, 6/12);

        // Dissonant cluster
        GumpAudio.playChord?.(root / 2, [0, 1, 6, 7], 5, {
            volume: 0.35,
            attack: 0.05,
            release: 4,
            waveform: 'sawtooth',
        });

        // Clashing tones
        GumpAudio.playTone?.(tritone, 3, {
            volume: 0.2,
            attack: 0.5,
            release: 2,
            waveform: 'square',
        });

        // Heavy sub chaos
        GumpBass.play808Long?.({ freq: root / 4, volume: 0.6 });

        // Aggressive drums
        [0, 200, 350, 600, 800].forEach((delay, i) => {
            setTimeout(() => {
                GumpDrums.play808Distorted?.({ volume: 0.3 + i * 0.1 });
            }, delay);
        });

        // Very dark filter
        GumpAudio.setFilterCutoff?.(400, 2);

        // Intense vibration
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100, 50, 300]);
        }

        // Screen darkens (add dark overlay)
        triggerDarknessOverlay();
    }

    function playRiseTransition(root) {
        // Hope returns - ascending energy

        // Start low, sweep up
        GumpAudio.setFilterCutoff?.(500, 0);

        // Ascending chord sequence
        const ascent = [0, 2, 4, 5, 7];
        ascent.forEach((semitone, i) => {
            setTimeout(() => {
                const freq = root * Math.pow(2, semitone / 12);
                GumpAudio.playTone?.(freq * 2, 2, {
                    volume: 0.15 + i * 0.05,
                    attack: 0.05,
                    release: 1.5,
                    waveform: 'triangle',
                });
            }, i * 300);
        });

        // Building bass
        setTimeout(() => {
            GumpBass.playSubBass?.({ freq: root, duration: 3, volume: 0.4 });
        }, 500);

        // Building drums
        setTimeout(() => {
            GumpDrums.playOrganicKick?.({ volume: 0.5 });
        }, 800);
        setTimeout(() => {
            GumpDrums.playOrganicKick?.({ volume: 0.6 });
        }, 1200);

        // Filter opens up
        setTimeout(() => GumpAudio.setFilterCutoff?.(2000, 1), 500);
        setTimeout(() => GumpAudio.setFilterCutoff?.(5000, 2), 1500);

        // Hopeful vibration
        if (navigator.vibrate) {
            navigator.vibrate([50, 100, 100, 100, 200]);
        }

        // Remove darkness overlay
        removeDarknessOverlay();
    }

    function playTranscendenceTransition(root) {
        // The ultimate triumph - brighter than ever

        // Brief pause for anticipation
        setTimeout(() => {
            // THE BWAAAM but triumphant
            triggerTheBWAAAM();

            // Then the full orchestra
            setTimeout(() => {
                // Massive major chord stack
                const majorChord = [0, 4, 7, 12, 16, 19];  // Major with extensions
                [-1, 0, 1, 2].forEach((octave, i) => {
                    setTimeout(() => {
                        GumpAudio.playChord?.(root * Math.pow(2, octave), majorChord, 6, {
                            volume: 0.2,
                            attack: 0.3 + i * 0.2,
                            release: 5,
                            waveform: 'sawtooth',
                        });
                    }, i * 150);
                });

                // Bright filter
                GumpAudio.setFilterCutoff?.(12000, 3);
            }, 500);
        }, 500);

        // Full brightness
        triggerScreenFlash();

        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 500]);
        }
    }

    function triggerDarknessOverlay() {
        // Remove any existing
        const existing = document.getElementById('darkness-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'darkness-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0);
            pointer-events: none;
            z-index: 100;
            transition: background 3s ease;
        `;
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.style.background = 'rgba(0, 0, 0, 0.5)';
        });
    }

    function removeDarknessOverlay() {
        const overlay = document.getElementById('darkness-overlay');
        if (overlay) {
            overlay.style.background = 'rgba(0, 0, 0, 0)';
            setTimeout(() => overlay.remove(), 3000);
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
            // Emit zone change event for voice manager
            GumpEvents.emit('zone.change', {
                from: gridResult.transition.from,
                to: gridResult.transition.to
            });

            playZoneEntrySound(gridResult.transition.to, gridResult.localX, gridResult.localY);

            // COMBO SYSTEM: Track zone visits for combo detection
            onZoneVisit(gridResult.transition.to);

            // PATTERN LEARNING: Record zone transitions
            const speed = Math.sqrt((app.vx || 0) * (app.vx || 0) + (app.vy || 0) * (app.vy || 0));
            if (speed > 0.1) {
                // Start recording if not already
                if (!patternMemory.recording.active) {
                    startPatternRecording();
                }
                recordPatternStep(gridResult.transition.to, speed);
            }
        } else if (patternMemory.recording.active && Date.now() - patternMemory.recording.startTime > 1000) {
            // If we stop transitioning for 1 second, finish recording
            const timeSinceLastStep = Date.now() - (patternMemory.recording.timestamps[patternMemory.recording.timestamps.length - 1] || 0) - patternMemory.recording.startTime;
            if (timeSinceLastStep > 1000) {
                finishPatternRecording();
            }
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

            // COMBO SYSTEM: Zone glow for combo progress (yellow/gold)
            const comboGlow = comboSystem.zoneGlow[zoneId] || 0;
            if (comboGlow > 0.01) {
                const comboGradient = ctx.createRadialGradient(
                    x + zoneWidth / 2, y + zoneHeight / 2, 0,
                    x + zoneWidth / 2, y + zoneHeight / 2, Math.min(zoneWidth, zoneHeight) * 0.6
                );

                // Yellow/gold glow for combo zones
                comboGradient.addColorStop(0, `rgba(255, 215, 0, ${comboGlow * 0.4})`);
                comboGradient.addColorStop(0.5, `rgba(255, 180, 0, ${comboGlow * 0.2})`);
                comboGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

                ctx.fillStyle = comboGradient;
                ctx.fillRect(x, y, zoneWidth, zoneHeight);

                // Border glow
                ctx.strokeStyle = `rgba(255, 215, 0, ${comboGlow * 0.6})`;
                ctx.lineWidth = 2 + comboGlow * 2;
                ctx.strokeRect(x + 2, y + 2, zoneWidth - 4, zoneHeight - 4);
            }
        }

        // Fade zone glows each frame
        fadeZoneGlows();
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

        // Get current mood for visual styling
        const phaseName = (PHASE_NAMES && PHASE_NAMES[evolution.phase]) ? PHASE_NAMES[evolution.phase] : 'awakening';
        const mood = PHASE_MOOD[phaseName] || PHASE_MOOD.awakening;

        ctx.font = '10px monospace';
        ctx.textAlign = 'center';

        // Phase name (top center) - color reflects mood
        const phaseAlpha = 0.15 + (evolution.intensity || 0) * 0.2;
        // Color shifts: bright = white/gold, dark = red/purple
        const r = Math.floor(255 * (0.5 + mood.brightness * 0.5));
        const g = Math.floor(255 * mood.brightness * mood.hope);
        const b = Math.floor(255 * (mood.tension * 0.5 + mood.brightness * 0.3));
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${phaseAlpha})`;
        ctx.fillText(phaseName.toUpperCase(), w / 2, 30);

        // During struggle, add subtitle
        if (phaseName === 'struggle') {
            ctx.font = '8px monospace';
            ctx.fillStyle = 'rgba(150, 50, 50, 0.3)';
            ctx.fillText('hold on...', w / 2, 45);
        } else if (phaseName === 'rise') {
            ctx.font = '8px monospace';
            ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
            ctx.fillText('rising...', w / 2, 45);
        } else if (phaseName === 'transcendence') {
            ctx.font = '8px monospace';
            ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
            ctx.fillText('∞', w / 2, 45);
        }

        ctx.font = '10px monospace';

        // Intensity ring around center - color affected by mood
        if (evolution.intensity > 0.1) {
            const ringRadius = 30 + evolution.intensity * 50;
            const ringAlpha = evolution.intensity * 0.2;
            const breath = Math.sin(evolution.breathPhase) * 0.05;

            // Ring color: warm during hope, cold/red during struggle
            const ringR = Math.floor(255 * (0.5 + mood.tension * 0.5));
            const ringG = Math.floor(200 * mood.hope * mood.brightness);
            const ringB = Math.floor(100 * mood.brightness);
            ctx.strokeStyle = `rgba(${ringR}, ${ringG}, ${ringB}, ${ringAlpha + breath})`;
            ctx.lineWidth = 1 + evolution.intensity * 2;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            // During chaos, add erratic secondary rings
            if (mood.chaos > 0.3) {
                const chaosOffset = Math.sin(Date.now() / 100) * mood.chaos * 20;
                ctx.strokeStyle = `rgba(150, 50, 50, ${mood.chaos * 0.2})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(w / 2 + chaosOffset, h / 2, ringRadius * 0.8, 0, Math.PI * 2);
                ctx.stroke();
            }
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

        // Start AI rhythm after cinematic entrance settles (6 seconds)
        setTimeout(() => {
            // Generate initial drum pattern for genesis world
            if (typeof GumpMusicalWorlds !== 'undefined') {
                GumpMusicalWorlds.generateWorldDrumPattern('genesis').then(pattern => {
                    if (pattern) {
                        aiMusicians.currentAIPattern = pattern;
                        console.log('[GUMP] Genesis drum pattern ready');
                    }
                });
            }

            startAIRhythm();
        }, 6000);

        console.log('GUMP started - v16 Musical Worlds');
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
