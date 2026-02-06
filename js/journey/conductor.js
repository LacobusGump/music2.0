/**
 * GUMP CONDUCTOR v2 - Music That Dances To You
 *
 * YOUR GESTURES UNRAVEL THE MUSIC:
 *
 * POSITION:
 *   X = Register (left=bass, right=treble) + which instruments
 *   Y = Note in scale (top=high, bottom=low)
 *
 * MOVEMENT:
 *   Slow = legato swells, sustained pads
 *   Fast = staccato plucks, arpeggios
 *   Sweeps = melodic runs following your path
 *
 * TILT:
 *   Left/Right = vibrato depth + stereo pan
 *   Forward = filter opens (brightness)
 *
 * ZONES:
 *   Where you are affects the harmony
 *   Moving between zones creates chord changes
 *
 * ENERGY:
 *   Builds from movement → unlocks groove → climax → resolution
 */

const GumpConductor = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let reverbNode = null;
    let compressor = null;

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        initialized: false,
        active: false,

        // Acts
        act: 'innocence',
        actStartTime: 0,
        journeyStartTime: 0,

        // Energy
        energy: 0,
        peakReached: false,

        // Touch input
        touching: false,
        touchX: 0.5,
        touchY: 0.5,
        lastTouchX: 0.5,
        lastTouchY: 0.5,
        touchVelocity: 0,
        touchDirection: 0,  // Angle of movement

        // Gesture tracking
        gesturePoints: [],
        lastGestureTime: 0,
        gestureType: null,  // 'sweep', 'hold', 'tap'

        // Tilt
        tiltX: 0,
        tiltY: 0,
        tiltPermission: false,

        // Musical state
        currentHarmony: 0,  // Which chord in progression
        lastMelodyNote: null,
        activeVoices: [],
        lastNoteTime: 0,
        ambientDrone: null,

        // Groove
        grooveActive: false,
        grooveTempo: 82,
        grooveStep: 0,
        nextStepTime: 0,
        grooveIntensity: 0
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════

    const ACTS = {
        innocence: {
            name: 'innocence',
            minDuration: 10000,
            energyThreshold: 0,
            scale: [0, 2, 4, 7, 9],           // Pentatonic
            chords: [[0, 4, 7], [0, 4, 7], [2, 5, 9], [4, 7, 11]],
            root: 220,
            reverbMix: 0.7,
            brightness: 0.3,
            groove: false
        },
        ambition: {
            name: 'ambition',
            minDuration: 15000,
            energyThreshold: 0.2,
            scale: [0, 2, 4, 5, 7, 9, 11],    // Major
            chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]],
            root: 220,
            reverbMix: 0.5,
            brightness: 0.5,
            tempo: 82,
            groove: true
        },
        hardships: {
            name: 'hardships',
            minDuration: 18000,
            energyThreshold: 0.4,
            scale: [0, 2, 3, 5, 7, 8, 10],    // Natural minor
            chords: [[0, 3, 7], [5, 8, 12], [7, 10, 14], [0, 3, 7]],
            root: 196,
            reverbMix: 0.4,
            brightness: 0.6,
            tempo: 88,
            groove: true
        },
        prevail: {
            name: 'prevail',
            minDuration: 15000,
            energyThreshold: 0.6,
            scale: [0, 2, 4, 5, 7, 9, 11],    // Major
            chords: [[0, 4, 7, 11], [5, 9, 12], [7, 11, 14], [0, 4, 7, 11]],
            root: 247,
            reverbMix: 0.45,
            brightness: 0.8,
            tempo: 94,
            groove: true
        },
        fade: {
            name: 'fade',
            minDuration: 12000,
            energyThreshold: 0,
            scale: [0, 2, 4, 7, 9],           // Back to pentatonic
            chords: [[0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]],
            root: 220,
            reverbMix: 0.75,
            brightness: 0.25,
            tempo: 72,
            groove: false
        }
    };

    // Instrument characters based on X position
    const SECTIONS = {
        bass:   { range: [0, 0.2], octave: 2, attack: 0.15, brightness: 0.2, type: 'bass' },
        cello:  { range: [0.2, 0.4], octave: 3, attack: 0.1, brightness: 0.35, type: 'strings' },
        viola:  { range: [0.4, 0.6], octave: 3, attack: 0.08, brightness: 0.5, type: 'strings' },
        violin: { range: [0.6, 0.8], octave: 4, attack: 0.05, brightness: 0.7, type: 'strings' },
        high:   { range: [0.8, 1.0], octave: 5, attack: 0.03, brightness: 0.85, type: 'pluck' }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(audioContext) {
        if (state.initialized) return;

        ctx = audioContext;
        createAudioChain();
        setupInputListeners();
        requestTiltPermission();

        state.initialized = true;
        state.active = true;
        state.journeyStartTime = performance.now();
        state.actStartTime = state.journeyStartTime;

        // Start ambient drone
        startAmbientDrone();

        // Start update loop
        requestAnimationFrame(update);

        console.log('[Conductor] Ready - your gestures unravel the music');
    }

    function createAudioChain() {
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.knee.value = 10;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.2;

        masterGain = ctx.createGain();
        masterGain.gain.value = 0.7;

        createReverb();

        masterGain.connect(compressor);
        compressor.connect(ctx.destination);
    }

    function createReverb() {
        const length = ctx.sampleRate * 3.5;
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                const t = i / ctx.sampleRate;
                const decay = Math.exp(-t * 1.2) * 0.7 + Math.exp(-t * 4) * 0.3;
                data[i] = (Math.random() * 2 - 1) * decay * (1 - i / length * 0.3);
            }
        }

        const convolver = ctx.createConvolver();
        convolver.buffer = impulse;

        reverbNode = ctx.createGain();
        reverbNode.gain.value = 0.5;

        const reverbOut = ctx.createGain();
        reverbOut.gain.value = 0.6;

        reverbNode.connect(convolver);
        convolver.connect(reverbOut);
        reverbOut.connect(compressor);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INPUT HANDLING
    // ═══════════════════════════════════════════════════════════════════════

    function setupInputListeners() {
        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: false });
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function requestTiltPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            const request = async () => {
                try {
                    const perm = await DeviceOrientationEvent.requestPermission();
                    if (perm === 'granted') {
                        state.tiltPermission = true;
                        window.addEventListener('deviceorientation', onTilt, true);
                        notify('Tilt enabled!');
                    }
                } catch (e) { console.warn('Tilt denied:', e); }
                document.removeEventListener('touchstart', request);
            };
            document.addEventListener('touchstart', request, { once: true });
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            state.tiltPermission = true;
            window.addEventListener('deviceorientation', onTilt, true);
        }
    }

    function onTouchStart(e) {
        e.preventDefault();
        const t = e.touches[0];
        startGesture(t.clientX / window.innerWidth, t.clientY / window.innerHeight);
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const t = e.touches[0];
            moveGesture(t.clientX / window.innerWidth, t.clientY / window.innerHeight);
        }
    }

    function onTouchEnd(e) {
        e.preventDefault();
        endGesture();
    }

    function onMouseDown(e) {
        startGesture(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    }

    function onMouseMove(e) {
        if (state.touching) {
            moveGesture(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
        }
    }

    function onMouseUp() {
        endGesture();
    }

    function onTilt(e) {
        state.tiltX = Math.max(-1, Math.min(1, (e.gamma || 0) / 45));
        state.tiltY = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 45));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GESTURE PROCESSING - This is where music emerges
    // ═══════════════════════════════════════════════════════════════════════

    function startGesture(x, y) {
        state.touching = true;
        state.touchX = x;
        state.touchY = y;
        state.lastTouchX = x;
        state.lastTouchY = y;
        state.gesturePoints = [{ x, y, time: performance.now() }];
        state.lastGestureTime = performance.now();

        // Immediate response - play a note at this position
        playMelodicNote(x, y, 0.7, 'attack');

        // Boost energy
        state.energy = Math.min(1, state.energy + 0.03);
    }

    function moveGesture(x, y) {
        if (!state.touching) return;

        const now = performance.now();
        const dx = x - state.lastTouchX;
        const dy = y - state.lastTouchY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dt = (now - state.lastGestureTime) / 1000;

        // Calculate velocity and direction
        state.touchVelocity = dt > 0 ? dist / dt : 0;
        state.touchDirection = Math.atan2(dy, dx);

        // Record gesture path
        state.gesturePoints.push({ x, y, time: now });
        if (state.gesturePoints.length > 30) state.gesturePoints.shift();

        // Determine gesture type based on velocity
        if (state.touchVelocity > 0.8) {
            state.gestureType = 'sweep';
        } else if (state.touchVelocity < 0.1) {
            state.gestureType = 'hold';
        } else {
            state.gestureType = 'move';
        }

        // MUSICAL RESPONSE based on gesture type
        if (state.gestureType === 'sweep' && dist > 0.02) {
            // Fast sweep = trigger melodic run
            playMelodicNote(x, y, 0.5 + state.touchVelocity * 0.3, 'staccato');
        } else if (state.gestureType === 'hold') {
            // Holding = swell the current sound
            updateHeldNote(x, y);
        } else if (dist > 0.015) {
            // Normal movement = legato melody
            playMelodicNote(x, y, 0.4, 'legato');
        }

        // Zone-based harmony changes
        const newHarmony = getHarmonyFromPosition(x, y);
        if (newHarmony !== state.currentHarmony) {
            state.currentHarmony = newHarmony;
            playHarmonyChange(newHarmony);
        }

        // Update state
        state.lastTouchX = state.touchX;
        state.lastTouchY = state.touchY;
        state.touchX = x;
        state.touchY = y;
        state.lastGestureTime = now;

        // Build energy from movement
        state.energy = Math.min(1, state.energy + dist * 0.5);
    }

    function endGesture() {
        if (!state.touching) return;

        // Analyze the complete gesture
        const gestureDuration = performance.now() - state.gesturePoints[0]?.time || 0;
        const totalDist = calculateGestureLength();

        // Quick tap = pluck
        if (gestureDuration < 200 && totalDist < 0.05) {
            playPluck(state.touchX, state.touchY, 0.8);
        }
        // Long hold = release swell
        else if (state.gestureType === 'hold' && gestureDuration > 500) {
            releaseHeldNote();
        }

        state.touching = false;
        state.gestureType = null;
        state.touchVelocity = 0;
    }

    function calculateGestureLength() {
        let len = 0;
        for (let i = 1; i < state.gesturePoints.length; i++) {
            const dx = state.gesturePoints[i].x - state.gesturePoints[i-1].x;
            const dy = state.gesturePoints[i].y - state.gesturePoints[i-1].y;
            len += Math.sqrt(dx * dx + dy * dy);
        }
        return len;
    }

    function getHarmonyFromPosition(x, y) {
        // Divide screen into 4 harmonic zones
        const zone = Math.floor(x * 2) + Math.floor(y * 2) * 2;
        return zone % 4;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOUND GENERATION - Where position becomes music
    // ═══════════════════════════════════════════════════════════════════════

    function playMelodicNote(x, y, velocity, articulation) {
        if (!ctx) return;

        const act = ACTS[state.act];
        const section = getSectionFromX(x);
        const note = getNoteFromY(y, act.scale, section.octave);
        const freq = act.root * Math.pow(2, note / 12);

        const now = ctx.currentTime;

        // Different articulations
        let attack, sustain, release;
        if (articulation === 'staccato') {
            attack = 0.01;
            sustain = 0.05;
            release = 0.1;
        } else if (articulation === 'legato') {
            attack = 0.08;
            sustain = 0.2;
            release = 0.3;
        } else { // attack
            attack = 0.02;
            sustain = 0.15;
            release = 0.2;
        }

        // Create the voice based on section type
        if (section.type === 'bass') {
            playBassNote(freq, velocity, attack, sustain, release);
        } else if (section.type === 'pluck') {
            playPluckNote(freq, velocity);
        } else {
            playStringNote(freq, velocity, attack, sustain, release, section);
        }

        state.lastMelodyNote = { freq, time: now };
    }

    function getSectionFromX(x) {
        for (const [name, sec] of Object.entries(SECTIONS)) {
            if (x >= sec.range[0] && x < sec.range[1]) {
                return { ...sec, name };
            }
        }
        return SECTIONS.viola;
    }

    function getNoteFromY(y, scale, octave) {
        // Y position maps to scale degree (inverted: top = high)
        const normalY = 1 - y;
        const scaleIndex = Math.floor(normalY * scale.length);
        const note = scale[Math.min(scaleIndex, scale.length - 1)];
        return note + (octave * 12);
    }

    function playStringNote(freq, velocity, attack, sustain, release, section) {
        const now = ctx.currentTime;
        const duration = attack + sustain + release;

        // Multiple detuned oscillators
        const oscs = [];
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = (i - 1) * 8 + (Math.random() - 0.5) * 4;
            oscs.push(osc);
        }

        // Vibrato from tilt
        const vibrato = ctx.createOscillator();
        vibrato.frequency.value = 5 + Math.random();
        const vibGain = ctx.createGain();
        vibGain.gain.value = freq * 0.003 * (0.3 + Math.abs(state.tiltX) * 0.7);
        vibrato.connect(vibGain);
        oscs.forEach(o => vibGain.connect(o.frequency));

        // Filter - brightness from tilt Y and section
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        const brightness = section.brightness + Math.max(0, state.tiltY) * 0.3;
        filter.frequency.value = 400 + brightness * 3000 + velocity * 2000;
        filter.Q.value = 1;

        // Envelope
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(velocity * 0.2, now + attack);
        env.gain.setValueAtTime(velocity * 0.2, now + attack + sustain);
        env.gain.linearRampToValueAtTime(0, now + duration);

        // Pan from tilt
        const panner = ctx.createStereoPanner();
        panner.pan.value = state.tiltX * 0.6;

        // Connect
        const mix = ctx.createGain();
        mix.gain.value = 1 / oscs.length;
        oscs.forEach(o => o.connect(mix));
        mix.connect(filter);
        filter.connect(env);
        env.connect(panner);
        panner.connect(masterGain);
        panner.connect(reverbNode);

        // Start
        oscs.forEach(o => { o.start(now); o.stop(now + duration + 0.1); });
        vibrato.start(now);
        vibrato.stop(now + duration + 0.1);
    }

    function playBassNote(freq, velocity, attack, sustain, release) {
        const now = ctx.currentTime;
        const duration = attack + sustain + release;

        // Sub oscillator
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = freq / 2;

        // Body
        const body = ctx.createOscillator();
        body.type = 'triangle';
        body.frequency.value = freq;

        // Filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200 + velocity * 400;

        // Envelope
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(velocity * 0.35, now + attack);
        env.gain.linearRampToValueAtTime(velocity * 0.25, now + attack + sustain);
        env.gain.linearRampToValueAtTime(0, now + duration);

        // Connect
        sub.connect(filter);
        body.connect(filter);
        filter.connect(env);
        env.connect(masterGain);

        sub.start(now); sub.stop(now + duration + 0.1);
        body.start(now); body.stop(now + duration + 0.1);
    }

    function playPluckNote(freq, velocity) {
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 8, now);
        filter.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.1);

        const env = ctx.createGain();
        env.gain.setValueAtTime(velocity * 0.3, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(filter);
        filter.connect(env);
        env.connect(masterGain);
        env.connect(reverbNode);

        osc.start(now); osc.stop(now + 0.5);
    }

    function playPluck(x, y, velocity) {
        const act = ACTS[state.act];
        const section = getSectionFromX(x);
        const note = getNoteFromY(y, act.scale, section.octave);
        const freq = act.root * Math.pow(2, note / 12);
        playPluckNote(freq, velocity);
    }

    function playHarmonyChange(harmonyIndex) {
        const act = ACTS[state.act];
        const chord = act.chords[harmonyIndex];
        if (!chord) return;

        const now = ctx.currentTime;

        // Soft pad for harmony change
        chord.forEach((interval, i) => {
            const freq = act.root * Math.pow(2, interval / 12);

            setTimeout(() => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;

                const env = ctx.createGain();
                env.gain.setValueAtTime(0, ctx.currentTime);
                env.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
                env.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);

                osc.connect(env);
                env.connect(reverbNode);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 2.5);
            }, i * 50);  // Slight arpeggio
        });
    }

    function updateHeldNote(x, y) {
        // Modulate ambient drone based on hold position
        // Could add pitch bend, filter sweep, etc.
    }

    function releaseHeldNote() {
        // Release any held sounds with a swell
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AMBIENT DRONE - The foundation
    // ═══════════════════════════════════════════════════════════════════════

    function startAmbientDrone() {
        if (!ctx) return;

        const act = ACTS[state.act];
        const now = ctx.currentTime;

        // Very quiet foundation
        const drone = ctx.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = act.root / 2;

        const droneGain = ctx.createGain();
        droneGain.gain.value = 0;
        droneGain.gain.linearRampToValueAtTime(0.06, now + 3);

        const droneFilter = ctx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 200;

        drone.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(masterGain);
        droneGain.connect(reverbNode);

        drone.start(now);

        state.ambientDrone = { osc: drone, gain: droneGain, filter: droneFilter };
    }

    function updateAmbientDrone() {
        if (!state.ambientDrone) return;

        const act = ACTS[state.act];
        const targetFreq = act.root / 2;

        // Slowly shift drone to match current act
        state.ambientDrone.osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 2);

        // Energy affects drone volume
        const targetVol = 0.04 + state.energy * 0.06;
        state.ambientDrone.gain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.5);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GROOVE ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    function startGroove(tempo) {
        state.grooveActive = true;
        state.grooveTempo = tempo;
        state.grooveStep = 0;
        state.nextStepTime = ctx.currentTime + 0.1;
        state.grooveIntensity = 0.3;

        notify('Groove descends...');
    }

    function stopGroove() {
        state.grooveActive = false;
    }

    function runGroove() {
        if (!state.grooveActive) return;

        const now = ctx.currentTime;

        while (state.nextStepTime < now + 0.1) {
            scheduleGrooveStep(state.grooveStep, state.nextStepTime);

            const stepDur = (60 / state.grooveTempo) / 4;
            const swing = 0.18;
            const swungDur = stepDur * (state.grooveStep % 2 === 0 ? 1 + swing : 1 - swing);

            state.nextStepTime += swungDur;
            state.grooveStep = (state.grooveStep + 1) % 16;
        }

        // Groove intensity follows energy
        state.grooveIntensity += (state.energy * 0.8 - state.grooveIntensity) * 0.02;
    }

    function scheduleGrooveStep(step, time) {
        const int = state.grooveIntensity;

        // Kick
        const kicks = [1, 0, 0, 0.3, 0, 0, 0.6, 0, 1, 0, 0, 0.3, 0, 0, 0, 0];
        if (kicks[step] > 0) playKick(time, kicks[step] * int);

        // Snare with ghosts
        const snares = [0, 0, 0, 0, 1, 0, 0.2, 0.25, 0, 0, 0.2, 0, 1, 0, 0.25, 0.2];
        if (snares[step] > 0) playSnare(time, snares[step] * int);

        // Hats
        const hats = [0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.4];
        if (hats[step] > 0) playHat(time, hats[step] * int * 0.5);
    }

    function playKick(time, vel) {
        const sub = ctx.createOscillator();
        sub.frequency.setValueAtTime(100, time);
        sub.frequency.exponentialRampToValueAtTime(30, time + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vel * 0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        sub.connect(gain);
        gain.connect(masterGain);

        sub.start(time); sub.stop(time + 0.6);
    }

    function playSnare(time, vel) {
        const body = ctx.createOscillator();
        body.type = 'triangle';
        body.frequency.setValueAtTime(180, time);
        body.frequency.exponentialRampToValueAtTime(80, time + 0.03);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(vel * 0.35, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const noiseFilt = ctx.createBiquadFilter();
        noiseFilt.type = 'highpass';
        noiseFilt.frequency.value = 2500;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(vel * 0.4, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        body.connect(bodyGain); bodyGain.connect(masterGain);
        noise.connect(noiseFilt); noiseFilt.connect(noiseGain); noiseGain.connect(masterGain);

        body.start(time); body.stop(time + 0.1);
        noise.start(time); noise.stop(time + 0.1);
    }

    function playHat(time, vel) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buf;

        const filt = ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 9000;
        filt.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vel * 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        noise.connect(filt); filt.connect(gain); gain.connect(masterGain);
        noise.start(time); noise.stop(time + 0.05);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function update(timestamp) {
        if (!state.active) return;

        const now = timestamp || performance.now();
        const actDuration = now - state.actStartTime;

        // Energy decay
        if (!state.touching) {
            state.energy *= 0.997;
        }

        // Check act transitions
        checkActTransition(actDuration);

        // Update ambient drone
        updateAmbientDrone();

        // Run groove if active
        if (state.grooveActive) {
            runGroove();
        }

        requestAnimationFrame(update);
    }

    function checkActTransition(actDuration) {
        const act = ACTS[state.act];
        if (actDuration < act.minDuration) return;

        let next = null;

        if (state.act === 'innocence' && state.energy >= ACTS.ambition.energyThreshold) {
            next = 'ambition';
        } else if (state.act === 'ambition' && state.energy >= ACTS.hardships.energyThreshold) {
            next = 'hardships';
        } else if (state.act === 'hardships' && state.energy >= ACTS.prevail.energyThreshold) {
            next = 'prevail';
            state.peakReached = true;
        } else if (state.act === 'prevail' && state.peakReached && state.energy < 0.25) {
            next = 'fade';
        }

        if (next) transitionToAct(next);
    }

    function transitionToAct(actName) {
        console.log(`[Conductor] ${state.act} → ${actName}`);
        notify(actName.toUpperCase());

        state.act = actName;
        state.actStartTime = performance.now();

        const act = ACTS[actName];

        // Handle groove
        if (act.groove && !state.grooveActive) {
            startGroove(act.tempo);
        } else if (!act.groove && state.grooveActive) {
            stopGroove();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function notify(msg) {
        const el = document.getElementById('notification');
        if (el) {
            el.textContent = msg;
            el.classList.add('visible');
            setTimeout(() => el.classList.remove('visible'), 2000);
        }
    }

    function stop() {
        state.active = false;
        state.grooveActive = false;
        if (masterGain) masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,
        stop,
        get isActive() { return state.active; },
        get currentAct() { return state.act; },
        get energy() { return state.energy; },
        get tiltEnabled() { return state.tiltPermission; },
        getState() { return { ...state }; }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpConductor = GumpConductor;
}
