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
    // SOUND TRIGGERS
    // ═══════════════════════════════════════════════════════════════════════

    // Track active sounds per unlock
    const activeSounds = new Map();

    function triggerPatternResponse(pattern, data) {
        const musical = pattern.musical;
        if (!musical) return;

        const currentEra = GumpUnlocks.currentEra;

        switch (musical.effect) {
            case 'filter_sweep':
                // Sweep master filter
                const direction = data.direction === 'right' ? 'up' : 'down';
                const targetFreq = direction === 'up' ? 5000 : 500;
                GumpAudio.setFilterCutoff(targetFreq, 0.3);
                break;

            case 'frequency_sweep':
                // Frequency based on direction
                const freqMult = data.direction === 'up' ? 2 : 0.5;
                // Could modulate active sounds
                break;

            case 'chord_change':
                if (currentEra === 'sacred' || currentEra === 'modern') {
                    // Play a chord change
                    const rootFreq = GumpAudio.midiToFreq(48);  // C3
                    GumpAudio.playChord(rootFreq, GumpAudio.CHORDS.major, 2, {
                        waveform: 'sawtooth',
                        volume: 0.2,
                        channel: 'pads',
                    });
                }
                break;

            case 'key_change':
                // Shift root note
                break;

            case 'build':
                if (currentEra === 'tribal' || currentEra === 'modern') {
                    // Start building intensity
                    GumpAudio.setFilterCutoff(8000, 2);
                    GumpAudio.setMasterVolume(0.9, 2);
                }
                break;

            case 'drop':
                if (currentEra === 'tribal' || currentEra === 'modern') {
                    // Drop - big impact
                    GumpDrums.play808Deep({ volume: 1.0 });
                    GumpBass.play808Long({ freq: 36, volume: 0.9 });
                    GumpAudio.setFilterCutoff(500, 0.1);
                }
                break;

            case 'pendulum':
                // Oscillating sound
                break;

            case 'starburst':
                // Multiple directions at once
                break;
        }
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

        // Era name (top center)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillText(era.toUpperCase(), w / 2, 30);

        // Zone name (bottom right)
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillText(zone, w - 20, h - 20);

        // Dwell bar (bottom)
        const dwellPercent = Math.min(1, dwellTime / 3);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, h - 2, w, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, h - 2, w * dwellPercent, 2);

        // Unlocked items (bottom left)
        const unlocked = Array.from(GumpUnlocks.state.unlocked)
            .filter(id => {
                const u = GumpUnlocks.getUnlock(id);
                return u && u.era === era;
            });

        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';

        unlocked.slice(-5).forEach((id, i) => {
            const u = GumpUnlocks.getUnlock(id);
            const isLocked = GumpUnlocks.isLocked(id);
            ctx.fillStyle = isLocked ?
                'rgba(255, 215, 0, 0.3)' :
                'rgba(255, 255, 255, 0.15)';
            ctx.fillText(u?.name || id, 20, h - 40 - i * 15);
        });
    }

    function drawDebug(ctx, w, h) {
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

        const fps = 1 / app.deltaTime;
        const lines = [
            `FPS: ${fps.toFixed(1)}`,
            `Pos: ${app.x.toFixed(2)}, ${app.y.toFixed(2)}`,
            `Vel: ${app.vx.toFixed(2)}, ${app.vy.toFixed(2)}`,
            `Zone: ${GumpState.get('grid.currentZone')}`,
            `Era: ${GumpUnlocks.currentEra}`,
            `Unlocks: ${GumpUnlocks.state.unlocked.size}`,
            `Patterns: ${GumpPatterns.state.patternHistory.length}`,
            `BPM: ${GumpPatterns.getDetectedBpm().bpm.toFixed(0)}`,
        ];

        lines.forEach((line, i) => {
            ctx.fillText(line, 10, 20 + i * 14);
        });
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
