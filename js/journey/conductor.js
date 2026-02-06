/**
 * GUMP CONDUCTOR v3 - Instant & Fluid
 *
 * NO DELAY. NO BOXES. Just continuous space.
 *
 * X = pitch (left=low, right=high) - SMOOTH, not stepped
 * Y = note in scale
 * TILT = vibrato + brightness
 *
 * Touch = instant sound
 * Move = melody follows your finger
 * Energy builds → groove descends
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
        needsTiltPermission: false,

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

    // No rigid sections - continuous fluid space

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
        // Check if iOS requires permission (iOS 13+)
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS - will request on first touch
            state.needsTiltPermission = true;
            console.log('[Conductor] iOS - tilt permission needed, will ask on first tap');
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            // Android/desktop - just enable
            state.tiltPermission = true;
            window.addEventListener('deviceorientation', onTilt, true);
            console.log('[Conductor] Tilt enabled (non-iOS)');
        } else {
            console.log('[Conductor] No tilt support');
        }
    }

    async function onTouchStart(e) {
        // iOS TILT PERMISSION - must happen FIRST, BEFORE preventDefault
        if (state.needsTiltPermission && !state.tiltPermission) {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    state.tiltPermission = true;
                    state.needsTiltPermission = false;
                    window.addEventListener('deviceorientation', onTilt, true);
                    notify('TILT ON!');
                    console.log('[Conductor] TILT GRANTED');
                }
            } catch (err) {
                console.error('[Conductor] Tilt error:', err);
                state.needsTiltPermission = false; // Don't keep asking
            }
        }

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

        // INSTANT response
        playNote(x, y, 0.7);

        state.energy = Math.min(1, state.energy + 0.03);
    }

    function moveGesture(x, y) {
        if (!state.touching) return;

        const now = performance.now();
        const dx = x - state.touchX;
        const dy = y - state.touchY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only play if moved enough (prevents retriggering)
        if (dist > 0.008) {
            const velocity = Math.min(1, dist * 15);
            playNote(x, y, 0.3 + velocity * 0.4);

            state.lastTouchX = state.touchX;
            state.lastTouchY = state.touchY;
            state.touchX = x;
            state.touchY = y;

            state.energy = Math.min(1, state.energy + dist * 0.3);
        }

        state.lastGestureTime = now;
    }

    function endGesture() {
        state.touching = false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOUND GENERATION - Where position becomes music
    // ═══════════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════════
    // INSTANT, FLUID NOTE - no boxes, just continuous space
    // ═══════════════════════════════════════════════════════════════════════

    function playNote(x, y, velocity) {
        if (!ctx) return;

        const act = ACTS[state.act];
        const now = ctx.currentTime;

        // CONTINUOUS mapping - no rigid zones
        // X = octave (smooth blend from low to high)
        // Y = note in scale
        const octave = 2 + x * 3;  // Ranges from octave 2 to 5
        const scaleIndex = Math.floor((1 - y) * act.scale.length);
        const note = act.scale[Math.min(scaleIndex, act.scale.length - 1)];
        const freq = act.root * Math.pow(2, (note + octave * 12 - 36) / 12);

        // Brightness from X position (right = brighter)
        const brightness = 0.3 + x * 0.7;

        // Attack from velocity (faster movement = snappier)
        const attack = 0.005;  // INSTANT

        // Create voice
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.value = freq;
        osc2.frequency.value = freq;
        osc2.detune.value = 7;

        // Vibrato from tilt
        if (Math.abs(state.tiltX) > 0.1) {
            const vib = ctx.createOscillator();
            vib.frequency.value = 5;
            const vibGain = ctx.createGain();
            vibGain.gain.value = freq * 0.006 * Math.abs(state.tiltX);
            vib.connect(vibGain);
            vibGain.connect(osc1.frequency);
            vibGain.connect(osc2.frequency);
            vib.start(now);
            vib.stop(now + 0.5);
        }

        // Filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300 + brightness * 3000 + Math.max(0, state.tiltY) * 2000;
        filter.Q.value = 0.8;

        // INSTANT envelope
        const env = ctx.createGain();
        env.gain.setValueAtTime(velocity * 0.22, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + (1 - velocity) * 0.2);

        // Pan from X and tilt
        const panner = ctx.createStereoPanner();
        panner.pan.value = (x - 0.5) * 0.5 + state.tiltX * 0.4;

        // Connect
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(env);
        env.connect(panner);
        panner.connect(masterGain);
        panner.connect(reverbNode);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
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
