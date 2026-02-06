/**
 * GUMP CONDUCTOR - The One True System
 *
 * You are conducting an orchestra with your phone.
 *
 * THE VISION:
 * - Dreamy strings EMERGE from silence automatically
 * - Your finger SHAPES the sound (position = dynamics/section)
 * - Phone tilt ADDS expression (vibrato, swell, pan)
 * - Energy builds through 5 acts
 * - Groove descends when you're ready
 *
 * INNOCENCE → AMBITION → HARDSHIPS → PREVAIL → FADE
 *
 * Hans Zimmer: whisper to ROAR.
 */

const GumpConductor = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let reverbNode = null;
    let reverbGain = null;
    let compressor = null;

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        initialized: false,
        active: false,

        // The 5 acts
        act: 'innocence',
        actStartTime: 0,
        journeyStartTime: 0,

        // Energy system
        energy: 0,
        peakReached: false,

        // Input
        touching: false,
        touchX: 0.5,
        touchY: 0.5,
        touchVelocity: 0,

        // Tilt (from device orientation)
        tiltX: 0,  // Left/right (-1 to 1)
        tiltY: 0,  // Forward/back (-1 to 1)
        tiltPermission: false,

        // Expression derived from input
        dynamics: 0.3,      // How loud (0-1)
        section: 0.5,       // Which instruments (0=bass, 1=violin)
        vibrato: 0,         // From tilt oscillation
        swell: 0,           // From forward tilt
        pan: 0,             // From left/right tilt

        // Ambient strings (always playing, you shape them)
        ambientVoices: [],
        lastNoteTime: 0,
        currentChord: 0,

        // Groove state
        grooveActive: false,
        grooveTempo: 82,
        grooveStep: 0,
        nextStepTime: 0
    };

    // ═══════════════════════════════════════════════════════════════════════
    // THE 5 ACTS
    // ═══════════════════════════════════════════════════════════════════════

    const ACTS = {
        innocence: {
            name: 'innocence',
            minDuration: 8000,
            energyThreshold: 0,
            scale: [0, 2, 4, 7, 9],      // Pentatonic - pure, simple
            root: 220,                    // A3
            reverbMix: 0.7,
            brightness: 0.3,
            tempo: null,                  // Rubato - no fixed tempo
            groove: false
        },
        ambition: {
            name: 'ambition',
            minDuration: 12000,
            energyThreshold: 0.2,
            scale: [0, 2, 4, 5, 7, 9, 11], // Major - hopeful
            root: 220,
            reverbMix: 0.5,
            brightness: 0.5,
            tempo: 82,
            groove: true
        },
        hardships: {
            name: 'hardships',
            minDuration: 15000,
            energyThreshold: 0.4,
            scale: [0, 2, 3, 5, 7, 8, 10], // Natural minor - struggle
            root: 196,                     // G - darker
            reverbMix: 0.4,
            brightness: 0.6,
            tempo: 88,
            groove: true
        },
        prevail: {
            name: 'prevail',
            minDuration: 12000,
            energyThreshold: 0.65,
            scale: [0, 2, 4, 5, 7, 9, 11], // Major - triumph
            root: 247,                     // B - bright
            reverbMix: 0.45,
            brightness: 0.8,
            tempo: 94,
            groove: true
        },
        fade: {
            name: 'fade',
            minDuration: 10000,
            energyThreshold: 0,            // Triggered by energy DROP
            scale: [0, 2, 4, 7, 9],        // Back to pentatonic
            root: 220,
            reverbMix: 0.75,
            brightness: 0.25,
            tempo: 72,
            groove: false                  // Groove fades out
        }
    };

    // Chord progressions for each act
    const PROGRESSIONS = {
        innocence: [[0, 4, 7], [0, 4, 7], [2, 5, 9], [0, 4, 7]],  // Simple I chord
        ambition: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], // I - IV - V - I
        hardships: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [0, 3, 7]], // i - iv - III - i
        prevail: [[0, 4, 7, 11], [5, 9, 12], [7, 11, 14], [0, 4, 7, 11]], // Imaj7
        fade: [[0, 4, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]]  // Rest on I
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(audioContext) {
        if (state.initialized) return;

        ctx = audioContext;

        // Build audio chain
        createAudioChain();

        // Set up input listeners
        setupInputListeners();

        // Request tilt permission
        requestTiltPermission();

        state.initialized = true;
        state.active = true;
        state.journeyStartTime = performance.now();
        state.actStartTime = state.journeyStartTime;

        // Start the ambient strings
        startAmbientStrings();

        // Start the update loop
        requestAnimationFrame(update);

        console.log('[Conductor] The orchestra awaits. Touch to conduct. Tilt to express.');
    }

    function createAudioChain() {
        // Compressor for glue
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        // Master gain
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.7;

        // Create reverb
        createReverb();

        // Connect: masterGain → compressor → destination
        masterGain.connect(compressor);
        compressor.connect(ctx.destination);
    }

    function createReverb() {
        // Concert hall reverb - 4 second tail
        const length = ctx.sampleRate * 4;
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / ctx.sampleRate;
                // Multi-stage decay
                const early = Math.exp(-t * 3) * 0.4;
                const late = Math.exp(-t * 0.7) * 0.6;
                const diffusion = (Math.random() * 2 - 1);
                data[i] = diffusion * (early + late) * (1 - Math.pow(i / length, 0.3));
            }
        }

        const convolver = ctx.createConvolver();
        convolver.buffer = impulse;

        reverbGain = ctx.createGain();
        reverbGain.gain.value = 0.6;

        reverbNode = ctx.createGain();
        reverbNode.gain.value = 0.7;  // Reverb send amount

        reverbNode.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(compressor);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INPUT HANDLING
    // ═══════════════════════════════════════════════════════════════════════

    function setupInputListeners() {
        // Touch
        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: false });

        // Mouse (for desktop testing)
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function requestTiltPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ - need to request on user gesture
            const requestOnTouch = async () => {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        state.tiltPermission = true;
                        window.addEventListener('deviceorientation', onTilt, true);
                        showNotification('Tilt enabled! Tilt phone for expression.');
                        console.log('[Conductor] Tilt permission granted!');
                    }
                } catch (e) {
                    console.warn('[Conductor] Tilt permission denied:', e);
                }
                document.removeEventListener('touchstart', requestOnTouch);
            };
            document.addEventListener('touchstart', requestOnTouch, { once: true });
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            // Non-iOS - just add listener
            state.tiltPermission = true;
            window.addEventListener('deviceorientation', onTilt, true);
        }
    }

    function onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        state.touching = true;
        state.touchX = touch.clientX / window.innerWidth;
        state.touchY = touch.clientY / window.innerHeight;

        // Boost energy on touch
        state.energy = Math.min(1, state.energy + 0.05);
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (!state.touching || e.touches.length === 0) return;

        const touch = e.touches[0];
        const newX = touch.clientX / window.innerWidth;
        const newY = touch.clientY / window.innerHeight;

        // Calculate velocity
        const dx = newX - state.touchX;
        const dy = newY - state.touchY;
        state.touchVelocity = Math.sqrt(dx * dx + dy * dy) * 60;

        state.touchX = newX;
        state.touchY = newY;

        // Build energy from movement
        state.energy = Math.min(1, state.energy + state.touchVelocity * 0.02);
    }

    function onTouchEnd(e) {
        e.preventDefault();
        state.touching = false;
        state.touchVelocity = 0;
    }

    function onMouseDown(e) {
        state.touching = true;
        state.touchX = e.clientX / window.innerWidth;
        state.touchY = e.clientY / window.innerHeight;
        state.energy = Math.min(1, state.energy + 0.05);
    }

    function onMouseMove(e) {
        if (!state.touching) return;
        const newX = e.clientX / window.innerWidth;
        const newY = e.clientY / window.innerHeight;
        const dx = newX - state.touchX;
        const dy = newY - state.touchY;
        state.touchVelocity = Math.sqrt(dx * dx + dy * dy) * 60;
        state.touchX = newX;
        state.touchY = newY;
        state.energy = Math.min(1, state.energy + state.touchVelocity * 0.02);
    }

    function onMouseUp(e) {
        state.touching = false;
        state.touchVelocity = 0;
    }

    function onTilt(e) {
        // gamma = left/right tilt (-90 to 90)
        // beta = forward/back tilt (-180 to 180, usually -90 to 90 when upright)
        state.tiltX = Math.max(-1, Math.min(1, (e.gamma || 0) / 45));
        state.tiltY = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 45));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function update(timestamp) {
        if (!state.active) return;

        const now = timestamp || performance.now();
        const actDuration = now - state.actStartTime;

        // Update expression from input
        updateExpression();

        // Energy decay when not touching
        if (!state.touching) {
            state.energy *= 0.995;
        }

        // Check for act transitions
        checkActTransition(actDuration);

        // Update ambient strings with expression
        updateAmbientStrings();

        // Run groove if active
        if (state.grooveActive) {
            runGroove();
        }

        requestAnimationFrame(update);
    }

    function updateExpression() {
        // Position → dynamics and section
        if (state.touching) {
            // Y position = dynamics (top = soft, bottom = loud)
            state.dynamics = 0.2 + state.touchY * 0.8;
            // X position = section (left = bass, right = violin)
            state.section = state.touchX;
        }

        // Tilt → expression
        state.vibrato = Math.abs(state.tiltX) * 0.8;  // Side tilt = vibrato
        state.swell = Math.max(0, state.tiltY) * 0.6; // Forward tilt = swell
        state.pan = state.tiltX * 0.7;                // Side tilt = pan
    }

    function checkActTransition(actDuration) {
        const currentAct = ACTS[state.act];

        // Don't transition until minimum duration
        if (actDuration < currentAct.minDuration) return;

        let nextActName = null;

        if (state.act === 'innocence' && state.energy >= ACTS.ambition.energyThreshold) {
            nextActName = 'ambition';
        } else if (state.act === 'ambition' && state.energy >= ACTS.hardships.energyThreshold) {
            nextActName = 'hardships';
        } else if (state.act === 'hardships' && state.energy >= ACTS.prevail.energyThreshold) {
            nextActName = 'prevail';
            state.peakReached = true;
        } else if (state.act === 'prevail' && state.peakReached && state.energy < 0.3) {
            nextActName = 'fade';
        }

        if (nextActName) {
            transitionToAct(nextActName);
        }
    }

    function transitionToAct(actName) {
        const oldAct = ACTS[state.act];
        const newAct = ACTS[actName];

        console.log(`[Conductor] ${state.act} → ${actName}`);
        showNotification(actName.toUpperCase());

        state.act = actName;
        state.actStartTime = performance.now();

        // Update reverb
        if (reverbNode) {
            reverbNode.gain.setTargetAtTime(newAct.reverbMix, ctx.currentTime, 0.5);
        }

        // Handle groove
        if (newAct.groove && !state.grooveActive) {
            startGroove(newAct.tempo);
        } else if (!newAct.groove && state.grooveActive) {
            stopGroove();
        } else if (state.grooveActive && newAct.tempo) {
            state.grooveTempo = newAct.tempo;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AMBIENT STRINGS - The Soul of Innocence
    // ═══════════════════════════════════════════════════════════════════════

    function startAmbientStrings() {
        // Start with a quiet, evolving pad
        playAmbientChord();
    }

    function updateAmbientStrings() {
        const now = performance.now();
        const act = ACTS[state.act];

        // Play new chord every 4-8 seconds
        const chordInterval = 4000 + (1 - state.energy) * 4000;
        if (now - state.lastNoteTime > chordInterval) {
            state.lastNoteTime = now;
            state.currentChord = (state.currentChord + 1) % 4;
            playAmbientChord();
        }
    }

    function playAmbientChord() {
        const act = ACTS[state.act];
        const progression = PROGRESSIONS[state.act];
        const chordNotes = progression[state.currentChord];

        // Clean up old voices
        fadeOutOldVoices();

        // Create new voices for this chord
        chordNotes.forEach((interval, i) => {
            const freq = act.root * Math.pow(2, interval / 12);
            playStringVoice(freq, i, chordNotes.length);
        });
    }

    function playStringVoice(freq, voiceIndex, totalVoices) {
        if (!ctx) return;

        const now = ctx.currentTime;
        const act = ACTS[state.act];

        // Duration based on act and energy
        const duration = 6 + (1 - state.energy) * 4;

        // === OSCILLATORS (4 detuned for richness) ===
        const oscs = [];
        const numOscs = 4;

        for (let i = 0; i < numOscs; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            // Subtle detune for natural chorusing
            osc.detune.value = (i - 1.5) * 6 + (Math.random() - 0.5) * 3;
            oscs.push(osc);
        }

        // === VIBRATO LFO ===
        const vibratoLfo = ctx.createOscillator();
        vibratoLfo.type = 'sine';
        vibratoLfo.frequency.value = 4.5 + Math.random() * 1;

        const vibratoGain = ctx.createGain();
        // Vibrato depth from tilt
        vibratoGain.gain.value = freq * 0.004 * (0.3 + state.vibrato * 0.7);

        vibratoLfo.connect(vibratoGain);
        oscs.forEach(osc => vibratoGain.connect(osc.frequency));

        // === FILTER (brightness) ===
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        const baseCutoff = 400 + act.brightness * 2000;
        const dynamicCutoff = baseCutoff + state.dynamics * 1500 + state.swell * 2000;
        filter.frequency.value = dynamicCutoff;
        filter.Q.value = 0.7;

        // === ENVELOPE ===
        const envelope = ctx.createGain();
        const baseVolume = 0.12 / totalVoices;
        const dynamicVolume = baseVolume * (0.4 + state.dynamics * 0.6);

        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(dynamicVolume, now + 2);  // 2s attack
        envelope.gain.setValueAtTime(dynamicVolume, now + duration - 2.5);
        envelope.gain.linearRampToValueAtTime(0, now + duration);

        // === PANNING ===
        const panner = ctx.createStereoPanner();
        // Spread voices across stereo, modulated by tilt
        const basePan = (voiceIndex / (totalVoices - 1 || 1)) * 0.6 - 0.3;
        panner.pan.value = Math.max(-1, Math.min(1, basePan + state.pan));

        // === ROUTING ===
        const merger = ctx.createGain();
        merger.gain.value = 1 / numOscs;

        oscs.forEach(osc => osc.connect(merger));
        merger.connect(filter);
        filter.connect(envelope);
        envelope.connect(panner);
        panner.connect(masterGain);
        panner.connect(reverbNode);  // Send to reverb

        // === START ===
        oscs.forEach(osc => osc.start(now));
        vibratoLfo.start(now);

        // === STOP ===
        oscs.forEach(osc => osc.stop(now + duration + 0.1));
        vibratoLfo.stop(now + duration + 0.1);

        // Track voice for cleanup
        state.ambientVoices.push({
            oscs,
            vibratoLfo,
            envelope,
            endTime: now + duration
        });
    }

    function fadeOutOldVoices() {
        const now = ctx.currentTime;

        // Keep only voices that haven't ended
        state.ambientVoices = state.ambientVoices.filter(voice => {
            return voice.endTime > now;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GROOVE ENGINE - Purdie Shuffle with Weight
    // ═══════════════════════════════════════════════════════════════════════

    function startGroove(tempo) {
        state.grooveActive = true;
        state.grooveTempo = tempo;
        state.grooveStep = 0;
        state.nextStepTime = ctx.currentTime + 0.1;

        console.log('[Conductor] Groove descends at', tempo, 'BPM');
        showNotification('The groove descends...');
    }

    function stopGroove() {
        state.grooveActive = false;
        console.log('[Conductor] Groove fades');
    }

    function runGroove() {
        const now = ctx.currentTime;

        while (state.nextStepTime < now + 0.1) {
            scheduleGrooveStep(state.grooveStep, state.nextStepTime);

            // Calculate step duration with swing
            const secondsPerStep = (60 / state.grooveTempo) / 4;  // 16th notes
            const swing = 0.18;  // Purdie shuffle swing

            let stepDuration = secondsPerStep;
            if (state.grooveStep % 2 === 0) {
                stepDuration *= (1 + swing);
            } else {
                stepDuration *= (1 - swing);
            }

            state.nextStepTime += stepDuration;
            state.grooveStep = (state.grooveStep + 1) % 16;
        }
    }

    function scheduleGrooveStep(step, time) {
        const act = ACTS[state.act];
        const intensity = state.energy * 0.5 + 0.3;

        // Kick pattern
        const kickPattern = [1, 0, 0, 0.3, 0, 0, 0.7, 0, 1, 0, 0, 0.3, 0, 0, 0, 0];
        if (kickPattern[step] > 0) {
            playKick(time, kickPattern[step] * intensity);
        }

        // Snare pattern with ghost notes (Purdie shuffle)
        const snarePattern = [0, 0, 0, 0, 1, 0, 0.2, 0.25, 0, 0, 0.2, 0, 1, 0, 0.25, 0.2];
        if (snarePattern[step] > 0) {
            playSnare(time, snarePattern[step] * intensity);
        }

        // Hi-hat pattern
        const hatPattern = [0.8, 0.4, 0.6, 0.35, 0.8, 0.4, 0.6, 0.35, 0.8, 0.4, 0.6, 0.35, 0.8, 0.4, 0.7, 0.4];
        if (hatPattern[step] > 0) {
            playHat(time, hatPattern[step] * intensity * 0.6);
        }
    }

    function playKick(time, velocity) {
        const now = time;

        // === DEEP SUB ===
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(110, now);
        sub.frequency.exponentialRampToValueAtTime(28, now + 0.15);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(velocity * 0.9, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        // === CLICK ===
        const click = ctx.createOscillator();
        click.type = 'triangle';
        click.frequency.setValueAtTime(800, now);
        click.frequency.exponentialRampToValueAtTime(80, now + 0.015);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(velocity * 0.5, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        // === SATURATION ===
        const saturator = ctx.createWaveShaper();
        saturator.curve = makeSaturationCurve(6);

        sub.connect(subGain);
        click.connect(clickGain);
        subGain.connect(saturator);
        clickGain.connect(saturator);
        saturator.connect(masterGain);

        sub.start(now);
        sub.stop(now + 0.8);
        click.start(now);
        click.stop(now + 0.03);
    }

    function playSnare(time, velocity) {
        const now = time;
        const isGhost = velocity < 0.4;

        // === BODY ===
        const body = ctx.createOscillator();
        body.type = 'triangle';
        body.frequency.setValueAtTime(isGhost ? 180 : 200, now);
        body.frequency.exponentialRampToValueAtTime(80, now + 0.04);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(velocity * 0.4, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        // === NOISE ===
        const noiseLen = isGhost ? 0.05 : 0.12;
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = isGhost ? 3500 : 2500;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(velocity * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);

        body.connect(bodyGain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        bodyGain.connect(masterGain);
        noiseGain.connect(masterGain);

        body.start(now);
        body.stop(now + 0.15);
        noise.start(now);
        noise.stop(now + noiseLen);
    }

    function playHat(time, velocity) {
        const now = time;

        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 9000;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noise.start(now);
        noise.stop(now + 0.05);
    }

    function makeSaturationCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
        }
        return curve;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function showNotification(msg) {
        const notif = document.getElementById('notification');
        if (notif) {
            notif.textContent = msg;
            notif.classList.add('visible');
            setTimeout(() => notif.classList.remove('visible'), 2500);
        }
    }

    function stop() {
        state.active = false;
        state.grooveActive = false;

        // Fade out master
        if (masterGain) {
            masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
        }
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

        getState() {
            return {
                act: state.act,
                energy: state.energy,
                dynamics: state.dynamics,
                section: state.section,
                vibrato: state.vibrato,
                swell: state.swell,
                pan: state.pan,
                touching: state.touching,
                grooveActive: state.grooveActive,
                tiltPermission: state.tiltPermission
            };
        }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpConductor = GumpConductor;
}
