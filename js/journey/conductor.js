/**
 * GUMP CONDUCTOR - Lo-Fi Kanye Drums + Musical Intelligence
 *
 * Dreamy strings + warm 808 subs + lo-fi tape warmth + sidechain pump
 * Touch to play, tilt for expression, MOTION drives the flywheel
 *
 * G7 Flywheel: accelerometer → motion buffer → pattern classification
 *   → energy/BPM/layer modulation. The more you move, the more unfolds.
 *
 * v36: Strip the drums, find the soul.
 * Warm 808 sub kick (rings out), dark lo-fi snare, subtle noise hats.
 * Simple patterns (kick on 1, clap on 2+4), gentle swing.
 * Tape saturation, glue compression, vinyl crackle texture.
 * Deep sidechain pump — classic Kanye/College Dropout feel.
 */

const GumpConductor = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let compressor = null;
    let lofiFilter = null;  // Master lo-fi filter — tilt controls this

    // v33 Drum bus — persistent nodes, created once in init
    let drumBus = null;
    let drumSaturator = null;
    let drumCompressor = null;
    let sidechainGain = null;  // All non-drum audio routes through this; kick ducks it

    // v36: Vinyl crackle nodes — created/destroyed with groove
    let crackleSource = null;
    let crackleGain = null;
    let crackleLFO = null;
    let crackleLFOGain = null;

    const state = {
        initialized: false,
        touching: false,
        touchX: 0.5,
        touchY: 0.5,
        tiltX: 0,
        tiltY: 0,
        tiltGranted: false,
        motionGranted: false,
        energy: 0,
        groovePlaying: false,
        grooveStep: 0,
        nextStepTime: 0,
        tempo: 85,

        // G7 Flywheel — motion memory
        motion: 0,              // smoothed current motion
        motionHistory: [],      // 150-sample ring buffer
        totalMotion: 0,         // accumulated (never resets)
        lastMotionTime: 0,      // for void detection
        lastAccel: { x: 0, y: 0, z: 0 },
        motionPattern: 'still', // still/gentle/rhythmic/vigorous/chaotic
        avgMotion: 0,
        intensity: 0,           // variance of motion
        smoothSpeed: 0,

        // Lo-fi filter state
        filterFreq: 3000,

        // v32 Neuromorphic state
        lastOrientation: null,
        frameCount: 0,
        voidAudioActive: false,
        lastAppreciationCheck: 0,
        welcomeBackPlayed: false,
        lastDiscoveryTime: 0,
        lastConsistencyTime: 0,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // v33 MUSICAL CONTEXT — The connective tissue between gestures
    // ═══════════════════════════════════════════════════════════════════════

    const musicalContext = {
        lastGesture: null,
        lastGestureTime: 0,
        gesturesSinceStillness: 0,

        harmonicRoot: 432,          // drifts with tension
        rootSemitoneOffset: 0,      // up to tritone at max tension
        tensionLevel: 0,            // STDP prediction + ESN surprise
        rhythmicPhase: 0,           // position in 4-bar phrase (0-63)

        userIntervalHistory: [],    // last 16 intervals between events
        detectedUserBPM: 0,         // if user taps rhythmically
        rhythmicDensity: 0.5,       // driven by tiltY
        harmonicTension: 0,         // driven by tiltX

        expressionDepth: 0.5,       // driven by tiltY
        predictedNextGesture: null, // from STDP weights
        predictionConfidence: 0,
        wasPredicted: false,        // did current gesture match prediction?

        momentumDirection: 'still', // building/sustaining/resolving/still
        emotionalArc: 0.5,         // blends energy + tension + tilt
    };

    // Maj7 pentatonic — pushing 3rds, 5ths, 7ths for heaven-tier harmony
    // v35: Mutable — MusicalDNA overrides based on trait archetype
    let scale = [0, 2, 4, 7, 9, 11, 12, 14, 16, 19, 23, 24];

    // ═══════════════════════════════════════════════════════════════════════
    // v32 THRESHOLD CONSTANTS — Clear thresholds for open-ended results
    // ═══════════════════════════════════════════════════════════════════════

    const THRESHOLDS = {
        // Energy tiers
        ENERGY_SILENT:  0.00,
        ENERGY_WHISPER: 0.10,
        ENERGY_BREATHE: 0.25,
        ENERGY_FLOW:    0.45,
        ENERGY_SURGE:   0.65,
        ENERGY_PEAK:    0.85,

        // Void depth thresholds
        VOID_SETTLE:    0.2,
        VOID_DEEP:      0.5,
        VOID_SACRED:    0.8,
        VOID_TRANSCEND: 1.0,

        // Gesture-to-music parameters
        SHAKE_TRILL_RATE: 12,       // alternations per second
        CIRCLE_ARP_SPEED: 0.5,     // seconds per arpeggio cycle
        SWEEP_GLISS_RANGE: 24,     // semitones
        ROCK_VIBRATO_DEPTH: 15,    // cents
        TOSS_REVERB_TAIL: 3.0,     // seconds
    };

    // ═══════════════════════════════════════════════════════════════════════
    // v32 VOID AUDIO STATE — Nodes managed across enter/update/exit
    // ═══════════════════════════════════════════════════════════════════════

    const voidAudio = {
        oscillators: [],
        gains: [],
        filter: null,
        masterGainNode: null,
        overtoneOsc: null,
        overtoneGain: null,
        active: false,
        currentDepth: 0,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════

    function init(audioContext) {
        if (state.initialized) return;
        ctx = audioContext;

        // Compressor for glue
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.ratio.value = 4;
        compressor.connect(ctx.destination);

        // Tape warmth waveshaper — subtle saturation adds harmonics
        const waveshaper = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i / 128) - 1;
            curve[i] = Math.tanh(x * 1.4);
        }
        waveshaper.curve = curve;
        waveshaper.oversample = '2x';
        waveshaper.connect(compressor);

        // Master lo-fi filter — tilt Y sweeps this
        lofiFilter = ctx.createBiquadFilter();
        lofiFilter.type = 'lowpass';
        lofiFilter.frequency.value = 3000;
        lofiFilter.Q.value = 0.7;
        lofiFilter.connect(waveshaper);

        masterGain = ctx.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(lofiFilter);

        // v36: Drum bus — warm tape saturation + glue compression
        drumBus = ctx.createGain();
        drumBus.gain.value = 1.0;

        drumSaturator = ctx.createWaveShaper();
        const drumCurve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i / 128) - 1;
            drumCurve[i] = Math.tanh(x * 1.5);
        }
        drumSaturator.curve = drumCurve;
        drumSaturator.oversample = '4x';

        drumCompressor = ctx.createDynamicsCompressor();
        drumCompressor.threshold.value = -18;
        drumCompressor.ratio.value = 4;
        drumCompressor.attack.value = 0.003;
        drumCompressor.release.value = 0.15;
        drumCompressor.knee.value = 3;

        drumBus.connect(drumSaturator);
        drumSaturator.connect(drumCompressor);
        drumCompressor.connect(masterGain);

        // v33: Sidechain gain — all non-drum audio routes through here; kick ducks it
        sidechainGain = ctx.createGain();
        sidechainGain.gain.value = 1.0;
        sidechainGain.connect(masterGain);

        // Touch handlers
        document.addEventListener('touchstart', onTouch, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: false });
        document.addEventListener('mousedown', onMouse);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        state.initialized = true;
        state.lastMotionTime = Date.now();

        // Start ambient pad
        playAmbientPad();

        // v32: Initialize neuromorphic modules (guarded)
        if (typeof GumpMotionBrain !== 'undefined') {
            GumpMotionBrain.init();
            console.log('[Conductor] MotionBrain connected');
        }
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            GumpNeuromorphicMemory.init();
            console.log('[Conductor] NeuromorphicMemory connected');
        }

        // v32: Register spike listener for gesture-to-music
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('motion.spike', onMotionSpike);
        }

        // Start update loop
        update();

        console.log('[Conductor] v36-LOFI-KANYE Ready — warm 808s, dark texture, sidechain pump');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TOUCH + TILT + MOTION PERMISSIONS
    // iOS: must request BEFORE preventDefault (Radiohead fix)
    // ═══════════════════════════════════════════════════════════════════════

    async function onTouch(e) {
        // Request BOTH motion AND orientation on first touch — BEFORE preventDefault
        if (!state.motionGranted) {
            if (typeof DeviceMotionEvent !== 'undefined') {
                if (typeof DeviceMotionEvent.requestPermission === 'function') {
                    try {
                        const p = await DeviceMotionEvent.requestPermission();
                        if (p === 'granted') {
                            state.motionGranted = true;
                            window.addEventListener('devicemotion', onDeviceMotion);
                            showMsg('MOTION ON');
                        }
                    } catch(err) {
                        console.log('Motion denied');
                    }
                } else {
                    // Android / desktop — just listen
                    state.motionGranted = true;
                    window.addEventListener('devicemotion', onDeviceMotion);
                }
            }
        }

        if (!state.tiltGranted) {
            if (typeof DeviceOrientationEvent !== 'undefined') {
                if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                    try {
                        const p = await DeviceOrientationEvent.requestPermission();
                        if (p === 'granted') {
                            state.tiltGranted = true;
                            window.addEventListener('deviceorientation', onTilt);
                            showMsg('TILT ON');
                        }
                    } catch(err) {
                        console.log('Tilt denied');
                    }
                } else {
                    state.tiltGranted = true;
                    window.addEventListener('deviceorientation', onTilt);
                }
            }
        }

        e.preventDefault();
        state.touching = true;
        const t = e.touches[0];
        state.touchX = t.clientX / window.innerWidth;
        state.touchY = t.clientY / window.innerHeight;

        playNote(state.touchX, state.touchY, 0.7);
        state.energy = Math.min(1, state.energy + 0.05);
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (!state.touching) return;
        const t = e.touches[0];
        const x = t.clientX / window.innerWidth;
        const y = t.clientY / window.innerHeight;

        const dist = Math.sqrt((x - state.touchX) ** 2 + (y - state.touchY) ** 2);
        if (dist > 0.01) {
            playNote(x, y, 0.4 + dist * 3);
            state.touchX = x;
            state.touchY = y;
            state.energy = Math.min(1, state.energy + dist * 0.5);
        }
    }

    function onTouchEnd(e) {
        e.preventDefault();
        state.touching = false;
    }

    function onMouse(e) {
        state.touching = true;
        state.touchX = e.clientX / window.innerWidth;
        state.touchY = e.clientY / window.innerHeight;
        playNote(state.touchX, state.touchY, 0.7);
        state.energy = Math.min(1, state.energy + 0.05);
    }

    function onMouseMove(e) {
        if (!state.touching) return;
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        const dist = Math.sqrt((x - state.touchX) ** 2 + (y - state.touchY) ** 2);
        if (dist > 0.01) {
            playNote(x, y, 0.4 + dist * 3);
            state.touchX = x;
            state.touchY = y;
            state.energy = Math.min(1, state.energy + dist * 0.5);
        }
    }

    function onMouseUp() {
        state.touching = false;
    }

    function onTilt(e) {
        state.tiltX = (e.gamma || 0) / 45;  // -1 to 1
        state.tiltY = ((e.beta || 45) - 45) / 45;

        // v32: Capture orientation for MotionBrain
        state.lastOrientation = {
            alpha: e.alpha || 0,
            beta: e.beta || 0,
            gamma: e.gamma || 0,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // G7 FLYWHEEL — Device Motion → Buffer → Pattern → Energy
    // ═══════════════════════════════════════════════════════════════════════

    function onDeviceMotion(e) {
        const acc = e.accelerationIncludingGravity;
        if (!acc || acc.x === null) return;

        // Delta acceleration (G7 pattern)
        const dx = Math.abs((acc.x || 0) - state.lastAccel.x);
        const dy = Math.abs((acc.y || 0) - state.lastAccel.y);
        const dz = Math.abs((acc.z || 0) - state.lastAccel.z);

        const newMotion = Math.sqrt(dx * dx + dy * dy + dz * dz) * 0.6;

        // EMA smoothing (G7: 80/20)
        state.motion = state.motion * 0.8 + newMotion * 0.2;

        // Push to history buffer
        state.motionHistory.push(state.motion);
        if (state.motionHistory.length > 150) state.motionHistory.shift();

        // Accumulate total (the flywheel never resets)
        state.totalMotion += state.motion * 0.016; // ~60fps

        // Track activity
        if (state.motion > 0.3) {
            state.lastMotionTime = Date.now();
        }

        // Motion feeds energy (the core flywheel linkage)
        if (state.motion > 0.5) {
            state.energy = Math.min(1, state.energy + state.motion * 0.003);
        }

        state.lastAccel = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 };

        // v32: Feed raw sensor data to MotionBrain for neuromorphic processing
        if (typeof GumpMotionBrain !== 'undefined') {
            GumpMotionBrain.process(
                { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 },
                state.lastOrientation,
                Date.now()
            );
        }

        // v32: Step ESN with current state vector
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            const brainAvailable = typeof GumpMotionBrain !== 'undefined';
            const linearMag = brainAvailable ?
                Math.sqrt(
                    GumpMotionBrain.linearAccel.x ** 2 +
                    GumpMotionBrain.linearAccel.y ** 2 +
                    GumpMotionBrain.linearAccel.z ** 2
                ) : state.motion;
            const shortEnergy = brainAvailable ? GumpMotionBrain.short.energy : state.avgMotion;
            const voidDepth = brainAvailable ? GumpMotionBrain.voidDepth : 0;
            const tiltMag = Math.sqrt(state.tiltX * state.tiltX + state.tiltY * state.tiltY);

            // Find dominant neuron (highest membrane potential)
            let dominantNeuron = 0;
            if (brainAvailable) {
                const neurons = GumpMotionBrain.neurons;
                let maxMembrane = 0;
                let idx = 0;
                for (const n of Object.values(neurons)) {
                    if (n.membrane > maxMembrane) {
                        maxMembrane = n.membrane;
                        dominantNeuron = idx;
                    }
                    idx++;
                }
                dominantNeuron = dominantNeuron / 7; // normalize to 0-1
            }

            GumpNeuromorphicMemory.stepESN([
                linearMag, shortEnergy, voidDepth, dominantNeuron, tiltMag
            ]);
            GumpNeuromorphicMemory.trainESN(shortEnergy);
        }
    }

    function classifyMotion() {
        const hist = state.motionHistory;
        if (hist.length < 20) return;

        // Running statistics
        let sum = 0;
        for (let i = 0; i < hist.length; i++) sum += hist[i];
        state.avgMotion = sum / hist.length;

        let varSum = 0;
        for (let i = 0; i < hist.length; i++) {
            varSum += Math.abs(hist[i] - state.avgMotion);
        }
        state.intensity = varSum / hist.length;

        const avg = state.avgMotion;
        const v = state.intensity;

        // G7 pattern classification
        if (avg < 0.3) state.motionPattern = 'still';
        else if (avg < 0.8 && v < 0.5) state.motionPattern = 'gentle';
        else if (v < 1.5 && avg >= 0.8) state.motionPattern = 'rhythmic';
        else if (avg > 1.5 && v < 3) state.motionPattern = 'vigorous';
        else if (v >= 3) state.motionPattern = 'chaotic';

        // Smooth speed for external reads
        state.smoothSpeed = state.smoothSpeed * 0.9 + Math.min(1, avg * 0.3) * 0.1;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOUNDS — Dreamy strings with lo-fi warmth
    // ═══════════════════════════════════════════════════════════════════════

    // Fibonacci detune spread (cents) — 5 voices: -8, -3, 0, +3, +8
    const SAW_DETUNE = [-8, -3, 0, 3, 8];

    function playNote(x, y, velocity) {
        const now = ctx.currentTime;
        const dest = sidechainGain || masterGain; // v33: route through sidechain

        // v33: Octave range from expressionDepth (tiltY): 2-4 octaves
        const maxOctaves = 2 + Math.floor(musicalContext.expressionDepth * 2);
        const octave = 2 + Math.floor(x * maxOctaves);
        const noteIndex = Math.floor((1 - y) * scale.length);
        let note = scale[Math.min(noteIndex, scale.length - 1)];

        // v33: Chromatic tension — when harmonicTension > 0.4, chance to sharpen/flatten
        if (musicalContext.harmonicTension > 0.4 && Math.random() < 0.5) {
            note += (Math.random() < 0.5) ? 1 : -1; // ±1 semitone
        }

        // v33: Root follows musicalContext.harmonicRoot (not fixed 110Hz)
        const rootFreq = musicalContext.harmonicRoot / 4; // harmonicRoot is ~432, /4 gives ~108
        const freq = rootFreq * Math.pow(2, (note + octave * 12) / 12);
        const dur = 0.3 + (1 - velocity) * 0.5;

        // Per-note filter: position + tilt + energy
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600 + x * 3000 + Math.max(0, state.tiltY) * 2000 + state.energy * 1500;
        filter.Q.value = 0.8 + velocity * 0.5 + musicalContext.harmonicTension * 2;

        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(velocity * 0.12, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        filter.connect(noteGain);
        noteGain.connect(dest);

        // 5-saw detuned supersaw — heaven-tier unison
        for (let i = 0; i < 5; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = SAW_DETUNE[i] + (Math.random() - 0.5) * 2;
            osc.connect(filter);
            osc.start(now);
            osc.stop(now + dur + 0.1);
        }

        // Sub sine one octave down for body
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = freq * 0.5;
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(velocity * 0.04, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);
        sub.connect(subGain);
        subGain.connect(dest);
        sub.start(now);
        sub.stop(now + dur);

        // v33: Stochastic harmony — probability increases with tension
        const tension = musicalContext.tensionLevel;
        const fifthChance = 0.3 + tension * 0.3;  // 30%-60%
        const seventhChance = 0.2 + tension * 0.4; // 20%-60%

        if (Math.random() < fifthChance) {
            const fifth = ctx.createOscillator();
            fifth.type = 'triangle';
            fifth.frequency.value = freq * 1.498; // just 5th (slightly flat for warmth)
            const fGain = ctx.createGain();
            fGain.gain.setValueAtTime(velocity * 0.025, now);
            fGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.7);
            fifth.connect(filter);
            fifth.start(now);
            fifth.stop(now + dur);
        }
        if (Math.random() < seventhChance) {
            const seventh = ctx.createOscillator();
            seventh.type = 'triangle';
            // v33: Use b7 (1.778) when tense, maj7 (1.888) when relaxed
            seventh.frequency.value = freq * (tension > 0.4 ? 1.778 : 1.888);
            const sGain = ctx.createGain();
            sGain.gain.setValueAtTime(velocity * 0.018, now);
            sGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.5);
            seventh.connect(filter);
            seventh.start(now);
            seventh.stop(now + dur);
        }
    }

    function playAmbientPad() {
        if (!ctx) return;
        const now = ctx.currentTime;

        // Lush pad: A2 root + E3 fifth + G#3 major 7th + B3 add9
        // A=432Hz tuning: A2=108, E3=162, G#3=204.1, B3=242.7
        const padVoices = [108, 162, 204.1, 242.7];

        // Shared filter for pad warmth
        const padFilter = ctx.createBiquadFilter();
        padFilter.type = 'lowpass';
        // v35: DNA pad filter + volume bias
        const dnaPadBias = (typeof GumpMusicalDNA !== 'undefined') ? GumpMusicalDNA.getBias() : null;
        padFilter.frequency.value = 500 + (dnaPadBias ? dnaPadBias.filterBase * 0.15 : 0);
        padFilter.Q.value = 0.6;
        padFilter.connect(sidechainGain || masterGain);

        const padGain = ctx.createGain();
        const padVol = dnaPadBias ? 0.035 * dnaPadBias.padVolume / 0.5 : 0.035;
        padGain.gain.setValueAtTime(0, now);
        padGain.gain.linearRampToValueAtTime(Math.min(0.08, padVol), now + 5);
        padGain.connect(padFilter);

        padVoices.forEach(function(f) {
            // 3 detuned saws per voice for shimmer
            for (let d = -1; d <= 1; d++) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = f;
                osc.detune.value = d * 5 + (Math.random() - 0.5) * 2;

                const voiceGain = ctx.createGain();
                voiceGain.gain.value = 0.08; // quiet per-voice
                osc.connect(voiceGain);
                voiceGain.connect(padGain);
                osc.start(now);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GROOVE — Lo-fi 808s + vinyl crackle
    // ═══════════════════════════════════════════════════════════════════════

    function startGroove() {
        if (state.groovePlaying) return;
        state.groovePlaying = true;
        state.nextStepTime = ctx.currentTime + 0.1;
        showMsg('GROOVE');

        // v36: Vinyl crackle — brown noise through BP 800Hz + LP 2kHz
        if (ctx && sidechainGain && !crackleSource) {
            const bufLen = ctx.sampleRate * 4; // 4 seconds, looped
            const crackleBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
            const data = crackleBuf.getChannelData(0);
            // Brown noise: integrated white noise
            let last = 0;
            for (let i = 0; i < bufLen; i++) {
                const white = Math.random() * 2 - 1;
                last = (last + (0.02 * white)) / 1.02;
                data[i] = last * 3.5;
            }

            crackleSource = ctx.createBufferSource();
            crackleSource.buffer = crackleBuf;
            crackleSource.loop = true;

            const crackleBP = ctx.createBiquadFilter();
            crackleBP.type = 'bandpass';
            crackleBP.frequency.value = 800;
            crackleBP.Q.value = 0.5;

            const crackleLP = ctx.createBiquadFilter();
            crackleLP.type = 'lowpass';
            crackleLP.frequency.value = 2000;

            crackleGain = ctx.createGain();
            crackleGain.gain.value = 0.015;

            // Random amplitude modulation for occasional pops
            crackleLFO = ctx.createOscillator();
            crackleLFO.type = 'sine';
            crackleLFO.frequency.value = 0.3 + Math.random() * 0.7; // slow random wobble
            crackleLFOGain = ctx.createGain();
            crackleLFOGain.gain.value = 0.008;
            crackleLFO.connect(crackleLFOGain);
            crackleLFOGain.connect(crackleGain.gain);

            crackleSource.connect(crackleBP);
            crackleBP.connect(crackleLP);
            crackleLP.connect(crackleGain);
            crackleGain.connect(sidechainGain); // ducks with kick

            crackleSource.start();
            crackleLFO.start();
        }
    }

    function stopGroove() {
        state.groovePlaying = false;

        // v36: Destroy vinyl crackle
        if (crackleSource) {
            try { crackleSource.stop(); } catch(e) {}
            try { crackleSource.disconnect(); } catch(e) {}
            crackleSource = null;
        }
        if (crackleLFO) {
            try { crackleLFO.stop(); } catch(e) {}
            try { crackleLFO.disconnect(); } catch(e) {}
            crackleLFO = null;
        }
        if (crackleLFOGain) {
            try { crackleLFOGain.disconnect(); } catch(e) {}
            crackleLFOGain = null;
        }
        if (crackleGain) {
            try { crackleGain.disconnect(); } catch(e) {}
            crackleGain = null;
        }
    }

    function runGroove() {
        if (!state.groovePlaying) return;

        while (state.nextStepTime < ctx.currentTime + 0.1) {
            const step = state.grooveStep;
            const t = state.nextStepTime;
            // v35: DNA drum velocity multiplier
            const dnaVel = (typeof GumpMusicalDNA !== 'undefined') ?
                GumpMusicalDNA.getBias().drumVelocity : 1.0;
            const intensity = (0.4 + state.energy * 0.5) * dnaVel;

            // Kick — 1 + ghost on &3
            const kicks  = [1,0,0,0, 0,0,0.4,0, 0.9,0,0,0, 0,0,0,0];
            if (kicks[step]) playKick(t, kicks[step] * intensity);

            // Snare — clap on 2+4
            const snares = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
            if (snares[step]) playSnare(t, snares[step] * intensity);

            // Hats — sparse 8ths
            const hats = [0.5,0,0.3,0, 0.5,0,0.3,0, 0.5,0,0.3,0, 0.5,0,0.3,0];
            if (hats[step]) playHat(t, hats[step] * intensity);

            // Subtle swing — barely perceptible bounce
            const stepDur = (60 / state.tempo) / 4;
            const swing = step % 2 === 0 ? 1.08 : 0.92;
            state.nextStepTime += stepDur * swing;
            state.grooveStep = (step + 1) % 16;
        }
    }

    function playKick(time, vel) {
        // v36: Warm 808 kick — long sine sub + soft sine body through lowpass

        // Layer 1: Sub — sine 50→28Hz, long 808 sustain (the sub IS the bass)
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(50, time);
        sub.frequency.exponentialRampToValueAtTime(28, time + 0.8);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(vel * 0.8, time);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
        sub.connect(subGain);
        subGain.connect(drumBus);
        sub.start(time);
        sub.stop(time + 1.3);

        // Layer 2: Body — sine 80→40Hz through lowpass 200Hz, 0.12s (warm punch)
        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(80, time);
        body.frequency.exponentialRampToValueAtTime(40, time + 0.12);
        const bodyLP = ctx.createBiquadFilter();
        bodyLP.type = 'lowpass';
        bodyLP.frequency.value = 200;
        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(vel * 0.5, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        body.connect(bodyLP);
        bodyLP.connect(bodyGain);
        bodyGain.connect(drumBus);
        body.start(time);
        body.stop(time + 0.25);

        // Sidechain duck: deep pump (0.15 gain), slow recovery (0.25s)
        if (sidechainGain) {
            sidechainGain.gain.setValueAtTime(0.15, time);
            sidechainGain.gain.linearRampToValueAtTime(1.0, time + 0.25);
        }
    }

    function playSnare(time, vel) {
        // v36: Lo-fi snare — warm sine body + dark short noise

        // Layer 1: Body — single sine at 200Hz, 80ms decay
        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(200, time);
        body.frequency.exponentialRampToValueAtTime(120, time + 0.05);
        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(vel * 0.45, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        body.connect(bodyGain);
        bodyGain.connect(drumBus);
        body.start(time);
        body.stop(time + 0.1);

        // Layer 2: Dark noise — bandpass 2500Hz Q=0.8 + lowpass 4000Hz, 120ms
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const noiseBP = ctx.createBiquadFilter();
        noiseBP.type = 'bandpass';
        noiseBP.frequency.value = 2500;
        noiseBP.Q.value = 0.8;
        const noiseLP = ctx.createBiquadFilter();
        noiseLP.type = 'lowpass';
        noiseLP.frequency.value = 4000;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(vel * 0.35, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        noise.connect(noiseBP);
        noiseBP.connect(noiseLP);
        noiseLP.connect(noiseGain);
        noiseGain.connect(drumBus);
        noise.start(time);
        noise.stop(time + 0.15);
    }

    function playHat(time, vel) {
        // v36: Dark filtered noise hat — subtle tick, sits in the back

        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const hatBP = ctx.createBiquadFilter();
        hatBP.type = 'bandpass';
        hatBP.frequency.value = 3500;
        hatBP.Q.value = 1.0;

        const hatLP = ctx.createBiquadFilter();
        hatLP.type = 'lowpass';
        hatLP.frequency.value = 5000;

        const hatGain = ctx.createGain();
        hatGain.gain.setValueAtTime(vel * 0.12, time);
        hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        noise.connect(hatBP);
        hatBP.connect(hatLP);
        hatLP.connect(hatGain);
        hatGain.connect(drumBus);

        noise.start(time);
        noise.stop(time + 0.05);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // v32 VOID AUDIO SYSTEM — 432Hz Healing Drone
    // Stillness is not silence. Stillness is the void.
    // ═══════════════════════════════════════════════════════════════════════

    function enterVoidAudio() {
        if (voidAudio.active || !ctx) return;

        const now = ctx.currentTime;

        // Master gain for void layer
        voidAudio.masterGainNode = ctx.createGain();
        voidAudio.masterGainNode.gain.setValueAtTime(0, now);
        voidAudio.masterGainNode.gain.linearRampToValueAtTime(0.06, now + 4); // slow 4s fade
        voidAudio.masterGainNode.connect(masterGain);

        // Lowpass filter for breath modulation
        voidAudio.filter = ctx.createBiquadFilter();
        voidAudio.filter.type = 'lowpass';
        voidAudio.filter.frequency.value = 400;
        voidAudio.filter.Q.value = 1.0;
        voidAudio.filter.connect(voidAudio.masterGainNode);

        // Three frequency centers: sub-octave, fundamental, perfect fifth
        // A=432Hz tuning — each with ±3 cent detuned pair for lush unison
        const voidFreqs = [
            { freq: 216, vol: 0.4 },   // sub-octave
            { freq: 432, vol: 1.0 },   // fundamental
            { freq: 648, vol: 0.35 },  // perfect fifth
        ];
        voidFreqs.forEach(function(v) {
            // Detuned pair: -3 cents, center, +3 cents
            [-3, 0, 3].forEach(function(detune) {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = v.freq;
                osc.detune.value = detune;

                const gain = ctx.createGain();
                gain.gain.value = v.vol * 0.35;

                osc.connect(gain);
                gain.connect(voidAudio.filter);

                osc.start(now);
                voidAudio.oscillators.push(osc);
                voidAudio.gains.push(gain);
            });
        });

        voidAudio.active = true;
        console.log('[Conductor] Void audio entered — 432Hz drone');
    }

    function updateVoidAudio(depth, breathPhase) {
        if (!voidAudio.active || !ctx) return;

        const now = ctx.currentTime;

        // Depth modulates volume (deeper = slightly louder, more present)
        // v35: DNA contemplation trait amplifies void drone depth
        const voidAmp = (typeof GumpMusicalDNA !== 'undefined') ?
            GumpMusicalDNA.getBias().gestureAmplifiers.void : 1;
        if (voidAudio.masterGainNode) {
            const targetVol = (0.03 + depth * 0.04) * voidAmp; // amplified by contemplation
            voidAudio.masterGainNode.gain.setTargetAtTime(targetVol, now, 0.5);
        }

        // Breath phase modulates filter: 400-1200Hz sweep (like slow breathing)
        if (voidAudio.filter) {
            const breathVal = (Math.sin(breathPhase) + 1) * 0.5; // 0-1
            const filterTarget = 400 + breathVal * 800;
            voidAudio.filter.frequency.setTargetAtTime(filterTarget, now, 0.3);
        }

        // At depth > 0.9 (TRANSCENDENT), add higher overtone
        if (depth > 0.9 && !voidAudio.overtoneOsc) {
            voidAudio.overtoneOsc = ctx.createOscillator();
            voidAudio.overtoneOsc.type = 'sine';
            voidAudio.overtoneOsc.frequency.value = 864; // 432 * 2

            voidAudio.overtoneGain = ctx.createGain();
            voidAudio.overtoneGain.gain.setValueAtTime(0, now);
            voidAudio.overtoneGain.gain.linearRampToValueAtTime(0.3, now + 3);

            voidAudio.overtoneOsc.connect(voidAudio.overtoneGain);
            voidAudio.overtoneGain.connect(voidAudio.filter);
            voidAudio.overtoneOsc.start(now);
        }

        // Remove overtone if depth drops below 0.8
        if (depth < 0.8 && voidAudio.overtoneOsc) {
            try {
                voidAudio.overtoneGain.gain.setTargetAtTime(0, now, 0.5);
                const oscRef = voidAudio.overtoneOsc;
                setTimeout(function() { try { oscRef.stop(); } catch(e) {} }, 2000);
            } catch(e) {}
            voidAudio.overtoneOsc = null;
            voidAudio.overtoneGain = null;
        }

        voidAudio.currentDepth = depth;
    }

    function exitVoidAudio() {
        if (!voidAudio.active || !ctx) return;

        const now = ctx.currentTime;

        // Slow fade out (1.5s time constant)
        if (voidAudio.masterGainNode) {
            voidAudio.masterGainNode.gain.setTargetAtTime(0, now, 1.5);
        }

        // Cleanup after 4s fade
        const oscs = voidAudio.oscillators.slice();
        const overtone = voidAudio.overtoneOsc;
        const nodes = [voidAudio.masterGainNode, voidAudio.filter,
                       voidAudio.overtoneGain].filter(Boolean);

        setTimeout(function() {
            oscs.forEach(function(o) { try { o.stop(); } catch(e) {} });
            if (overtone) { try { overtone.stop(); } catch(e) {} }
            nodes.forEach(function(n) { try { n.disconnect(); } catch(e) {} });
        }, 4000);

        // Reset state
        voidAudio.oscillators = [];
        voidAudio.gains = [];
        voidAudio.filter = null;
        voidAudio.masterGainNode = null;
        voidAudio.overtoneOsc = null;
        voidAudio.overtoneGain = null;
        voidAudio.active = false;
        voidAudio.currentDepth = 0;

        console.log('[Conductor] Void audio exiting — fade out');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // v33 GESTURE-TO-MUSIC — Context-Aware Compound Reactivity
    // Each gesture reads musicalContext to shape its response differently.
    // ═══════════════════════════════════════════════════════════════════════

    function onMotionSpike(data) {
        if (!ctx || !masterGain) return;

        const now = Date.now();
        const dest = sidechainGain || masterGain;

        // 1. Track interval between gestures → push to userIntervalHistory
        if (musicalContext.lastGestureTime > 0) {
            const interval = now - musicalContext.lastGestureTime;
            musicalContext.userIntervalHistory.push(interval);
            if (musicalContext.userIntervalHistory.length > 16) {
                musicalContext.userIntervalHistory.shift();
            }
        }

        // 2. Check if gesture was predicted by STDP
        musicalContext.wasPredicted = (
            musicalContext.predictedNextGesture === data.neuron &&
            musicalContext.predictionConfidence > 0.3
        );

        // 3. Update gesture counters
        musicalContext.gesturesSinceStillness++;
        musicalContext.lastGesture = data.neuron;
        musicalContext.lastGestureTime = now;

        // Reset gesturesSinceStillness on stillness
        if (data.neuron === 'stillness') {
            musicalContext.gesturesSinceStillness = 0;
            return; // stillness handled by void system
        }

        // 4. Context-aware dispatch
        const afterStillness = musicalContext.gesturesSinceStillness <= 1;
        const highTension = musicalContext.tensionLevel > 0.4;
        const predicted = musicalContext.wasPredicted;
        const resolving = musicalContext.momentumDirection === 'resolving';

        // v35: DNA gesture amplifiers — each gesture scaled by its trait
        const dnaAmps = (typeof GumpMusicalDNA !== 'undefined') ?
            GumpMusicalDNA.getBias().gestureAmplifiers :
            { shake: 1, sweep: 1, pendulum: 1, void: 1, surprise: 1 };

        switch (data.neuron) {
            case 'shake':
                if (predicted) {
                    playHarmonicContinuation(data.firingRate * dnaAmps.shake);
                } else if (highTension) {
                    playTrill(data.firingRate * dnaAmps.shake, true); // dissonant
                } else if (afterStillness) {
                    playTrill(data.firingRate * 0.5 * dnaAmps.shake, false); // gentle awakening
                } else {
                    playTrill(data.firingRate * dnaAmps.shake, false);
                }
                break;
            case 'circle':
                if (resolving) {
                    playArpeggio(data.energy * dnaAmps.sweep, 'resolving');
                } else if (predicted) {
                    playArpeggio(data.energy * dnaAmps.sweep, 'continuation');
                } else {
                    playArpeggio(data.energy * dnaAmps.sweep, 'normal');
                }
                break;
            case 'sweep':
                if (afterStillness || musicalContext.momentumDirection === 'building') {
                    playGlissando(data.magnitude * dnaAmps.sweep, 'ascending');
                } else if (resolving) {
                    playGlissando(data.magnitude * dnaAmps.sweep, 'descending');
                } else {
                    playGlissando(data.magnitude * dnaAmps.sweep, 'normal');
                }
                break;
            case 'pendulum':
                if (musicalContext.detectedUserBPM > 0) {
                    playSyncedPulse(data.firingRate * dnaAmps.pendulum, musicalContext.detectedUserBPM);
                } else {
                    playPendulumPulse(data.firingRate * dnaAmps.pendulum);
                }
                break;
            case 'rock':
                applyVibratoModulation(data.firingRate * dnaAmps.pendulum, musicalContext.tensionLevel);
                break;
            case 'toss':
                playTossImpact(data.energy * dnaAmps.surprise, musicalContext.emotionalArc);
                break;
        }
    }

    // ── SHAKE → Trill (with optional dissonance) ──
    function playTrill(firingRate, dissonant) {
        const now = ctx.currentTime;
        const dest = sidechainGain || masterGain;
        const rate = Math.min(THRESHOLDS.SHAKE_TRILL_RATE, 6 + firingRate * 4);
        const interval = 1 / rate;
        const baseFreq = musicalContext.harmonicRoot;

        // Dissonant mode: minor 2nd (1 semitone) or tritone (6 semitones)
        const trillInterval = dissonant ?
            (Math.random() < 0.5 ? 1 : 6) : 2; // major 2nd normally

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 4000 + musicalContext.expressionDepth * 3000;
        filter.Q.value = dissonant ? 3 : 1;
        filter.connect(dest);

        for (let i = 0; i < 8; i++) {
            const t = now + i * interval;
            const freq = baseFreq * Math.pow(2, ((i % 2) * trillInterval) / 12);

            [-5, 0, 5].forEach(function(detune) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = detune;

                const gain = ctx.createGain();
                const vol = 0.02 * (1 - i * 0.1);
                gain.gain.setValueAtTime(Math.max(0.002, vol), t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + interval * 0.9);

                osc.connect(gain);
                gain.connect(filter);
                osc.start(t);
                osc.stop(t + interval);
            });
        }
    }

    // ── CIRCLE → Arpeggio (normal / continuation / resolving) ──
    function playArpeggio(energy, mode) {
        const now = ctx.currentTime;
        const dest = sidechainGain || masterGain;
        const baseFreq = musicalContext.harmonicRoot / 2;
        const speed = THRESHOLDS.CIRCLE_ARP_SPEED;

        // Mode determines interval pattern
        let intervals;
        if (mode === 'continuation') {
            // Extend upward: root, 3rd, 5th, 7th, 9th, 11th, 13th
            intervals = [0, 4, 7, 11, 14, 17, 21, 24];
        } else if (mode === 'resolving') {
            // Descend to root: oct, 7th, 5th, 3rd, root, root-5th, root-oct
            intervals = [24, 21, 19, 16, 12, 7, 4, 0];
        } else {
            // Normal: root, 3rd, 5th, 7th, oct, 7th, 5th, 3rd
            intervals = [0, 4, 7, 11, 12, 11, 7, 4];
        }

        const noteDur = speed / intervals.length;

        const arpFilter = ctx.createBiquadFilter();
        arpFilter.type = 'lowpass';
        arpFilter.frequency.value = 3500 + musicalContext.expressionDepth * 3000;
        arpFilter.connect(dest);

        intervals.forEach(function(semitone, i) {
            const t = now + i * noteDur;
            const freq = baseFreq * Math.pow(2, semitone / 12);

            [-5, 0, 5].forEach(function(detune) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = detune;

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.018 * Math.min(1, (energy || 0.3) + 0.3), t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 1.5);

                osc.connect(gain);
                gain.connect(arpFilter);
                osc.start(t);
                osc.stop(t + noteDur * 2);
            });
        });
    }

    // ── SWEEP → Glissando (ascending / descending / normal) ──
    function playGlissando(magnitude, direction) {
        const now = ctx.currentTime;
        const dest = sidechainGain || masterGain;
        const range = THRESHOLDS.SWEEP_GLISS_RANGE;
        const baseFreq = musicalContext.harmonicRoot;
        const duration = 0.4 + (magnitude || 0) * 0.1;

        let startFreq, endFreq;
        if (direction === 'ascending') {
            startFreq = baseFreq * Math.pow(2, -range / 24);
            endFreq = baseFreq * Math.pow(2, range / 12);
        } else if (direction === 'descending') {
            startFreq = baseFreq * Math.pow(2, range / 12);
            endFreq = baseFreq * Math.pow(2, -range / 24);
        } else {
            startFreq = baseFreq * Math.pow(2, -range / 24);
            endFreq = baseFreq * Math.pow(2, range / 24);
        }

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.linearRampToValueAtTime(4000, now + duration * 0.5);
        filter.frequency.linearRampToValueAtTime(1500, now + duration);
        filter.Q.value = 1.5 + musicalContext.harmonicTension * 3;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);

        filter.connect(gain);
        gain.connect(dest);

        SAW_DETUNE.forEach(function(detune) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
            osc.detune.value = detune;
            osc.connect(filter);
            osc.start(now);
            osc.stop(now + duration + 0.2);
        });
    }

    // ── PENDULUM → Pulse (basic, non-synced) ──
    function playPendulumPulse(firingRate) {
        const now = ctx.currentTime;
        const dest = sidechainGain || masterGain;
        const pulseRate = Math.max(0.5, Math.min(3, firingRate || 1));
        const interval = 1 / pulseRate;
        const rootFreq = musicalContext.harmonicRoot / 2;

        for (let i = 0; i < 4; i++) {
            const t = now + i * interval;

            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = rootFreq;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + interval * 0.5);

            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + interval);
        }
    }

    // ── v33 NEW: Synced Pulse — locks to detected user tempo ──
    function playSyncedPulse(firingRate, userBPM) {
        const now = ctx.currentTime;
        const dest = sidechainGain || masterGain;
        const beatInterval = 60 / userBPM;
        const rootFreq = musicalContext.harmonicRoot / 2;
        const fifthFreq = rootFreq * 1.498;
        const tension = musicalContext.tensionLevel;

        const pulseFilter = ctx.createBiquadFilter();
        pulseFilter.type = 'lowpass';
        pulseFilter.frequency.value = 2000 + musicalContext.expressionDepth * 3000;
        pulseFilter.connect(dest);

        // 4 beats: root on 1/3, fifth on 2/4
        for (let i = 0; i < 4; i++) {
            const t = now + i * beatInterval;
            const freq = (i % 2 === 0) ? rootFreq : fifthFreq;

            [-3, 0, 3].forEach(function(detune) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = detune;

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.025, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + beatInterval * 0.4);

                osc.connect(gain);
                gain.connect(pulseFilter);
                osc.start(t);
                osc.stop(t + beatInterval * 0.5);
            });

            // At tension > 0.3: syncopated off-beat echoes
            if (tension > 0.3) {
                const offT = t + beatInterval * 0.5;
                const echoOsc = ctx.createOscillator();
                echoOsc.type = 'triangle';
                echoOsc.frequency.value = freq * 2; // octave up echo

                const echoGain = ctx.createGain();
                echoGain.gain.setValueAtTime(0.012 * tension, offT);
                echoGain.gain.exponentialRampToValueAtTime(0.001, offT + beatInterval * 0.2);

                echoOsc.connect(echoGain);
                echoGain.connect(pulseFilter);
                echoOsc.start(offT);
                echoOsc.stop(offT + beatInterval * 0.3);
            }
        }
    }

    // ── ROCK → Vibrato (depth scales with tension) ──
    function applyVibratoModulation(firingRate, tension) {
        if (!lofiFilter || !ctx) return;

        const now = ctx.currentTime;
        const dest = sidechainGain || masterGain;
        // Depth scales with tension: 15-45 cents
        const depth = THRESHOLDS.ROCK_VIBRATO_DEPTH + (tension || 0) * 30;
        const duration = 2.0;
        const vibratoRate = 3 + (firingRate || 0) * 2;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = musicalContext.harmonicRoot;

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = vibratoRate;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = depth;

        lfo.connect(lfoGain);
        lfoGain.connect(osc.detune);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.setTargetAtTime(0.001, now + duration * 0.5, duration * 0.3);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(now);
        lfo.start(now);
        osc.stop(now + duration);
        lfo.stop(now + duration);
    }

    // ── TOSS → Impact (brightness scales with emotional arc) ──
    function playTossImpact(energy, emotionalArc) {
        const now = ctx.currentTime;
        const dest = sidechainGain || masterGain;
        const tailTime = THRESHOLDS.TOSS_REVERB_TAIL;
        const arc = emotionalArc || 0.5;

        // Impact: noise burst — brightness from arc
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const bufData = buf.getChannelData(0);
        for (let i = 0; i < bufData.length; i++) {
            bufData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buf;

        // Brightness filter on impact
        const impactFilter = ctx.createBiquadFilter();
        impactFilter.type = 'lowpass';
        impactFilter.frequency.value = 2000 + arc * 6000; // brighter with higher arc
        impactFilter.Q.value = 1 + arc * 2;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2 * Math.min(1, (energy || 0.5) + 0.3), now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        // Resonant body
        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(200 + arc * 100, now);
        body.frequency.exponentialRampToValueAtTime(60, now + 0.2);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(0.15, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + tailTime);

        // Tail: long sine decay at harmonic root
        const tail = ctx.createOscillator();
        tail.type = 'sine';
        tail.frequency.value = musicalContext.harmonicRoot;

        const tailGain = ctx.createGain();
        tailGain.gain.setValueAtTime(0, now);
        tailGain.gain.linearRampToValueAtTime(0.04, now + 0.05);
        tailGain.gain.exponentialRampToValueAtTime(0.001, now + tailTime);

        const tailFilter = ctx.createBiquadFilter();
        tailFilter.type = 'lowpass';
        tailFilter.frequency.setValueAtTime(3000 + arc * 3000, now);
        tailFilter.frequency.exponentialRampToValueAtTime(200, now + tailTime);

        noise.connect(impactFilter);
        impactFilter.connect(noiseGain);
        noiseGain.connect(dest);
        body.connect(bodyGain);
        bodyGain.connect(dest);
        tail.connect(tailFilter);
        tailFilter.connect(tailGain);
        tailGain.connect(dest);

        noise.start(now);
        noise.stop(now + 0.15);
        body.start(now);
        body.stop(now + tailTime + 0.1);
        tail.start(now);
        tail.stop(now + tailTime + 0.1);
    }

    // ── v33 NEW: Harmonic Continuation — system agrees with predicted gesture ──
    function playHarmonicContinuation(firingRate) {
        const now = ctx.currentTime;
        const dest = sidechainGain || masterGain;
        const rootFreq = musicalContext.harmonicRoot / 2;
        const tension = musicalContext.tensionLevel;

        // Sustained chord: root + 3rd + 5th, add b7 if tense
        const chordFreqs = [
            rootFreq,                          // root
            rootFreq * Math.pow(2, 4/12),      // major 3rd
            rootFreq * 1.498,                  // just 5th
        ];
        if (tension > 0.3) {
            chordFreqs.push(rootFreq * Math.pow(2, 10/12)); // b7
        }

        const chordFilter = ctx.createBiquadFilter();
        chordFilter.type = 'lowpass';
        chordFilter.frequency.setValueAtTime(1500, now);
        chordFilter.frequency.linearRampToValueAtTime(3500, now + 0.5);
        chordFilter.connect(dest);

        chordFreqs.forEach(function(freq) {
            [-4, 0, 4].forEach(function(detune) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = detune;

                const gain = ctx.createGain();
                // Gentle attack — the system AGREES with you
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.015, now + 0.3);
                gain.gain.setTargetAtTime(0.001, now + 1.5, 0.5);

                osc.connect(gain);
                gain.connect(chordFilter);
                osc.start(now);
                osc.stop(now + 3);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // v32 PERSONAL APPRECIATION — The Machine Recognizes You
    // ═══════════════════════════════════════════════════════════════════════

    function checkAppreciation() {
        if (!ctx || !masterGain) return;
        const now = ctx.currentTime;

        // ── RETURNING USER: Welcome back harmonic (iv→I resolution) ──
        if (!state.welcomeBackPlayed &&
            typeof GumpNeuromorphicMemory !== 'undefined' &&
            GumpNeuromorphicMemory.isReturningUser) {

            state.welcomeBackPlayed = true;
            playWelcomeBack(now);
            showMsg('WELCOME BACK');
            console.log('[Conductor] Welcome back — playing harmonic resolution');
        }

        // ── NEW GESTURE DISCOVERED: Ascending arpeggio ──
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            const newGestures = GumpNeuromorphicMemory.newGesturesThisSession;
            if (newGestures.length > 0 && (now - state.lastDiscoveryTime) > 10) {
                state.lastDiscoveryTime = now;
                playDiscoveryArpeggio(now);
                showMsg('DISCOVERED: ' + newGestures[newGestures.length - 1].toUpperCase());
            }
        }

        // ── PATTERN CONSISTENCY: Layer in a new voice ──
        if (typeof GumpNeuromorphicMemory !== 'undefined' &&
            (now - state.lastConsistencyTime) > 60) {
            const seq = GumpNeuromorphicMemory.sessionMemory.gestureSequence;
            if (seq.length >= 10) {
                const last5 = seq.slice(-5);
                const prev5 = seq.slice(-10, -5);
                const last5Set = new Set(last5);
                const prev5Set = new Set(prev5);
                let overlap = 0;
                for (const g of last5) {
                    if (prev5Set.has(g)) overlap++;
                }
                if (overlap >= 4) { // 80%+ consistency
                    state.lastConsistencyTime = now;
                    playConsistencyVoice(now);
                }
            }
        }

        // ── PATTERN BREAK: Surprise filter burst ──
        if (typeof GumpNeuromorphicMemory !== 'undefined' &&
            GumpNeuromorphicMemory.detectPatternBreak()) {
            const surprise = GumpNeuromorphicMemory.surprise;
            if (surprise > 0.3 && lofiFilter) {
                // Brief filter sweep — surprise!
                const freq = lofiFilter.frequency.value;
                lofiFilter.frequency.setValueAtTime(freq, now);
                lofiFilter.frequency.linearRampToValueAtTime(
                    Math.min(12000, freq + surprise * 6000), now + 0.1
                );
                lofiFilter.frequency.setTargetAtTime(freq, now + 0.15, 0.3);
            }
        }
    }

    function playWelcomeBack(now) {
        // iv→I harmonic resolution: Dm7 → Amaj7 (432Hz tuning)
        // Dm7: D, F, A, C → Amaj7: A, C#, E, G# — pushing 7ths
        const ivChord = [288.33, 343.17, 432, 513.74]; // D, F, A, C
        const IChord = [216, 272.54, 324, 408.24];      // A, C#, E, G#

        const welcomeFilter = ctx.createBiquadFilter();
        welcomeFilter.type = 'lowpass';
        welcomeFilter.frequency.setValueAtTime(800, now);
        welcomeFilter.frequency.linearRampToValueAtTime(3000, now + 2);
        welcomeFilter.connect(sidechainGain || masterGain);

        // Play iv7 chord — detuned saws for lush entry
        ivChord.forEach(function(f) {
            [-3, 0, 3].forEach(function(detune) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = f;
                osc.detune.value = detune;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.015, now + 0.5);
                gain.gain.setTargetAtTime(0.001, now + 1.5, 0.3);
                osc.connect(gain);
                gain.connect(welcomeFilter);
                osc.start(now);
                osc.stop(now + 3);
            });
        });

        // Resolve to Imaj7 chord after 1.5s
        IChord.forEach(function(f) {
            [-3, 0, 3].forEach(function(detune) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = f;
                osc.detune.value = detune;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now + 1.5);
                gain.gain.linearRampToValueAtTime(0.018, now + 2.0);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 5);
                osc.connect(gain);
                gain.connect(welcomeFilter);
                osc.start(now + 1.5);
                osc.stop(now + 5.5);
            });
        });
    }

    function playDiscoveryArpeggio(now) {
        // Ascending arpeggio — Fibonacci timing: 0.08, 0.13, 0.21, 0.34s gaps
        const baseFreq = 432;
        const intervals = [0, 7, 12, 19, 24]; // unison, 5th, oct, oct+5th, 2oct
        const fibGaps = [0, 0.08, 0.21, 0.42, 0.76]; // cumulative Fibonacci-ish

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 5000;
        filter.connect(sidechainGain || masterGain);

        intervals.forEach(function(semitone, i) {
            const t = now + fibGaps[i];
            const freq = baseFreq * Math.pow(2, semitone / 12);

            // Detuned saw pair for shimmer
            [-4, 0, 4].forEach(function(detune) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = detune;

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.02, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

                osc.connect(gain);
                gain.connect(filter);
                osc.start(t);
                osc.stop(t + 0.7);
            });
        });
    }

    function playConsistencyVoice(now) {
        // Warm sustained chord — the machine notices your consistency
        // E + B (5th) at A=432 for open voicing
        const freqs = [324, 486]; // E3 + B3

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        filter.connect(sidechainGain || masterGain);

        freqs.forEach(function(f) {
            [-4, 0, 4].forEach(function(detune) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = f;
                osc.detune.value = detune;

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.008, now + 2);
                gain.gain.setTargetAtTime(0.001, now + 8, 2);

                osc.connect(gain);
                gain.connect(filter);
                osc.start(now);
                osc.stop(now + 14);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // v33 MUSICAL CONTEXT UPDATE — Reads the brain, shapes every response
    // ═══════════════════════════════════════════════════════════════════════

    function updateMusicalContext() {
        const now = Date.now();

        // Read STDP prediction for last gesture
        if (musicalContext.lastGesture &&
            typeof GumpNeuromorphicMemory !== 'undefined') {
            const pred = GumpNeuromorphicMemory.getPrediction(musicalContext.lastGesture);
            musicalContext.predictedNextGesture = pred.gesture;
            musicalContext.predictionConfidence = pred.confidence;
        }

        // Blend ESN surprise + prediction confidence into tension
        let targetTension = 0;
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            const surprise = GumpNeuromorphicMemory.surprise;
            const conf = musicalContext.predictionConfidence;
            // High surprise = high tension, high confidence = moderate tension (anticipation)
            targetTension = surprise * 0.6 + conf * 0.3 + musicalContext.harmonicTension * 0.1;
            // v35: DNA base tension offset
            if (typeof GumpMusicalDNA !== 'undefined') {
                targetTension += GumpMusicalDNA.getBias().baseTension;
            }
        }
        musicalContext.tensionLevel += (targetTension - musicalContext.tensionLevel) * 0.05;

        // Drift harmonicRoot based on tension (high tension = up to tritone shift)
        // Tritone = 6 semitones above base 432Hz
        musicalContext.rootSemitoneOffset += (musicalContext.tensionLevel * 6 - musicalContext.rootSemitoneOffset) * 0.02;
        musicalContext.harmonicRoot = 432 * Math.pow(2, musicalContext.rootSemitoneOffset / 12);

        // Detect user BPM from interval history
        const intervals = musicalContext.userIntervalHistory;
        if (intervals.length >= 4) {
            const recentIntervals = intervals.slice(-8);
            const mean = recentIntervals.reduce(function(a, b) { return a + b; }, 0) / recentIntervals.length;
            let variance = 0;
            for (let i = 0; i < recentIntervals.length; i++) {
                variance += (recentIntervals[i] - mean) * (recentIntervals[i] - mean);
            }
            variance /= recentIntervals.length;
            const stddev = Math.sqrt(variance);
            const cv = mean > 0 ? stddev / mean : 1; // coefficient of variation

            if (cv < 0.3 && mean > 200 && mean < 2000) {
                // Rhythmic tapping detected
                musicalContext.detectedUserBPM = 60000 / mean;
            } else {
                musicalContext.detectedUserBPM *= 0.95; // decay toward 0
            }
        }

        // Compute momentum direction from energy + tension + gesture count
        const gestures = musicalContext.gesturesSinceStillness;
        if (gestures === 0) {
            musicalContext.momentumDirection = 'still';
        } else if (state.energy > 0.5 && musicalContext.tensionLevel > 0.3) {
            musicalContext.momentumDirection = 'building';
        } else if (state.energy > 0.3 && musicalContext.tensionLevel < 0.2) {
            musicalContext.momentumDirection = 'sustaining';
        } else if (state.energy < 0.2) {
            musicalContext.momentumDirection = 'resolving';
        }

        // Smooth emotional arc: blend energy + tension + tilt influence
        const targetArc = (state.energy * 0.4 + musicalContext.tensionLevel * 0.3 +
            (musicalContext.expressionDepth) * 0.3);
        musicalContext.emotionalArc += (targetArc - musicalContext.emotionalArc) * 0.03;

        // Advance rhythmic phase (position in 4-bar = 64 steps)
        if (state.groovePlaying) {
            musicalContext.rhythmicPhase = state.grooveStep;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // v33 TILT EXPRESSION — Musical expression from phone orientation
    // ═══════════════════════════════════════════════════════════════════════

    function applyTiltExpression() {
        if (!lofiFilter || !ctx) return;

        // ── tiltX → Harmonic Tension ──
        const absTiltX = Math.abs(state.tiltX);
        musicalContext.harmonicTension = Math.min(1, absTiltX);
        // Drive filter resonance: more tilt = more acidic, up to Q=8
        // v35: DNA filterQ as floor
        const dnaQFloor = (typeof GumpMusicalDNA !== 'undefined') ?
            GumpMusicalDNA.getBias().filterQ : 0.7;
        if (absTiltX > 0.2) {
            lofiFilter.Q.setTargetAtTime(
                Math.max(dnaQFloor, 0.7 + absTiltX * 7.3),  // DNA floor or tilt-driven
                ctx.currentTime, 0.1
            );
        } else {
            lofiFilter.Q.setTargetAtTime(dnaQFloor, ctx.currentTime, 0.3);
        }

        // ── tiltY → Multi-Dimensional Expression ──
        const brightness = (state.tiltY + 1) * 0.5; // 0=dark, 1=bright
        musicalContext.expressionDepth = Math.max(0, Math.min(1, brightness));
        musicalContext.rhythmicDensity = 0.2 + brightness * 0.8; // 0.2 to 1.0

        // Filter frequency: enhanced range with energy contribution
        // v35: DNA filter bias blended in
        const dnaFilterBias = (typeof GumpMusicalDNA !== 'undefined') ?
            GumpMusicalDNA.getBias().filterBase : 0;
        const target = 1500 + brightness * 7000 + state.energy * 3500 + dnaFilterBias * 0.3;
        state.filterFreq += (target - state.filterFreq) * 0.08;
        lofiFilter.frequency.setValueAtTime(
            Math.min(14000, Math.max(600, state.filterFreq)),
            ctx.currentTime
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE LOOP — Flywheel + expression + neuromorphic integration
    // ═══════════════════════════════════════════════════════════════════════

    function update() {
        // Classify motion pattern from buffer
        classifyMotion();

        // Energy decay — gentle
        if (!state.touching && state.motion < 0.3) {
            state.energy *= 0.995;
        }

        // Start/stop groove based on energy
        // v35: DNA groove threshold (lower for rhythm-heavy characters)
        const grooveThresh = (typeof GumpMusicalDNA !== 'undefined') ?
            GumpMusicalDNA.getBias().grooveThreshold : 0.3;
        if (state.energy > grooveThresh && !state.groovePlaying) {
            startGroove();
        }
        if (state.energy < 0.05 && state.groovePlaying) {
            stopGroove();
        }

        // BPM adapts to motion (G7 pattern)
        if (state.motionHistory.length > 20) {
            // v35: DNA tempo bias replaces fixed base
            const dnaBias = (typeof GumpMusicalDNA !== 'undefined') ? GumpMusicalDNA.getBias() : null;
            let baseBPM = (dnaBias ? dnaBias.tempo : 80) + state.avgMotion * 8 + state.intensity * 5;
            // Motion pattern shifts BPM
            if (state.motionPattern === 'rhythmic') baseBPM += 5;
            else if (state.motionPattern === 'vigorous') baseBPM += 10;
            else if (state.motionPattern === 'chaotic') baseBPM += 15;
            // Smooth transition
            state.tempo = state.tempo * 0.95 + baseBPM * 0.05;
            state.tempo = Math.max(60, Math.min(140, state.tempo));
        }

        // v35: DNA-driven drum bus gain + scale update
        if (typeof GumpMusicalDNA !== 'undefined') {
            const dnaBiasUpdate = GumpMusicalDNA.getBias();
            if (drumBus) {
                drumBus.gain.setTargetAtTime(
                    dnaBiasUpdate.drumGain,
                    ctx.currentTime, 0.5
                );
            }
            // Update active scale from DNA
            scale = dnaBiasUpdate.scale;
        }

        // v33: Tilt expression (replaces simple filter sweep)
        applyTiltExpression();

        // v33: Update musical context (reads brain, shapes every response)
        updateMusicalContext();

        // Run groove
        if (state.groovePlaying) {
            runGroove();
        }

        // ═══════════════════════════════════════════════════════════════
        // v32: NEUROMORPHIC UPDATE — Void audio, surprise, appreciation
        // ═══════════════════════════════════════════════════════════════

        state.frameCount++;

        // Void audio management (driven by MotionBrain void state)
        if (typeof GumpMotionBrain !== 'undefined') {
            const brainVoidState = GumpMotionBrain.voidState;
            const voidDepth = GumpMotionBrain.voidDepth;
            const breathPhase = GumpMotionBrain.voidBreathPhase;

            // Enter void when settling begins (state >= SETTLING)
            if (brainVoidState >= GumpMotionBrain.VOID_STATES.SETTLING) {
                if (!voidAudio.active) {
                    enterVoidAudio();
                }
                updateVoidAudio(voidDepth, breathPhase);
            } else {
                // Exit void when back to PRESENT
                if (voidAudio.active) {
                    exitVoidAudio();
                }
            }
        }

        // ESN surprise → filter modulation (high surprise = brief brightness)
        if (typeof GumpNeuromorphicMemory !== 'undefined' && lofiFilter) {
            const surprise = GumpNeuromorphicMemory.surprise;
            if (surprise > 0.5) {
                // Add a sparkle of brightness proportional to surprise
                const boost = surprise * 1500;
                state.filterFreq = Math.min(12000, state.filterFreq + boost * 0.02);
            }

            // Periodic tick for memory maintenance
            GumpNeuromorphicMemory.tick(Date.now());
        }

        // Personal appreciation check (every ~120 frames ≈ 2 seconds)
        if (state.frameCount % 120 === 0) {
            checkAppreciation();
        }

        requestAnimationFrame(update);
    }

    function showMsg(txt) {
        const el = document.getElementById('notification');
        if (el) {
            el.textContent = txt;
            el.classList.add('visible');
            setTimeout(() => el.classList.remove('visible'), 1500);
        }
    }

    return Object.freeze({
        init,
        THRESHOLDS,
        get energy() { return state.energy; },
        get tiltGranted() { return state.tiltGranted; },
        get motionGranted() { return state.motionGranted; },
        get motionPattern() { return state.motionPattern; },
        get smoothSpeed() { return state.smoothSpeed; },
        get voidActive() { return voidAudio.active; },
        get musicalContext() { return musicalContext; },
    });

})();

if (typeof window !== 'undefined') {
    window.GumpConductor = GumpConductor;
}
