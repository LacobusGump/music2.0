/**
 * GUMP CONDUCTOR — The Instrument Engine
 *
 * A layered orchestra that responds to your body, evolves over time,
 * and sounds like a real space.
 *
 * LAYERS: pad, atmosphere, bass, strings, shimmer, choir
 * EFFECTS: convolver reverb, dotted-eighth delay, tape saturation, sidechain pump
 * EVOLUTION: EMERGING → FLOWING → SURGING → TRANSCENDENT
 * EXPRESSION: tilt = filter + reverb, touch = notes, motion = layers
 */

const GumpConductor = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // AUDIO NODES
    // ═══════════════════════════════════════════════════════════════════════

    let ctx = null;

    // Master chain: masterGain → lofiFilter → waveshaper → compressor → destination
    let masterGain = null;
    let compressor = null;
    let lofiFilter = null;

    // Sidechain: all non-drum audio ducks on kick
    let sidechainGain = null;

    // Drum bus: drumBus → saturator → drumComp → masterGain
    let drumBus = null;
    let drumSaturator = null;
    let drumCompressor = null;

    // Convolver reverb
    let convolver = null;
    let reverbSend = null;

    // Delay line (dotted-eighth, LP in feedback loop)
    let delayNode = null;
    let delayFeedback = null;
    let delayFilter = null;
    let delayMix = null;
    let delaySend = null;

    // Vinyl crackle (created/destroyed with groove)
    let crackleSource = null;
    let crackleGain = null;
    let crackleLFO = null;
    let crackleLFOGain = null;

    // Orchestra layers
    const layers = {
        pad:        { gain: null, wet: 0.40, nodes: [] },
        atmosphere: { gain: null, wet: 0.30, nodes: [] },
        bass:       { gain: null, wet: 0.10, nodes: [], oscs: [], filter: null },
        strings:    { gain: null, wet: 0.45, nodes: [] },
        shimmer:    { gain: null, wet: 0.55, nodes: [] },
        choir:      { gain: null, wet: 0.50, nodes: [] },
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

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

        // G7 Flywheel
        motion: 0,
        motionHistory: [],
        totalMotion: 0,
        lastMotionTime: 0,
        lastAccel: { x: 0, y: 0, z: 0 },
        motionPattern: 'still',
        avgMotion: 0,
        intensity: 0,
        smoothSpeed: 0,

        // Filter
        filterFreq: 2000,

        // Evolution
        evolutionStage: 'EMERGING',
        lastStage: 'EMERGING',
        stageHarmonicShift: 0,

        // Neuromorphic
        lastOrientation: null,
        frameCount: 0,
        welcomeBackPlayed: false,
        lastDiscoveryTime: 0,
        lastConsistencyTime: 0,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL CONTEXT
    // ═══════════════════════════════════════════════════════════════════════

    const musicalContext = {
        lastGesture: null,
        lastGestureTime: 0,
        gesturesSinceStillness: 0,
        harmonicRoot: 432,
        rootSemitoneOffset: 0,
        tensionLevel: 0,
        rhythmicPhase: 0,
        userIntervalHistory: [],
        detectedUserBPM: 0,
        rhythmicDensity: 0.5,
        harmonicTension: 0,
        expressionDepth: 0.5,
        predictedNextGesture: null,
        predictionConfidence: 0,
        wasPredicted: false,
        momentumDirection: 'still',
        emotionalArc: 0.5,
    };

    // Mutable scale — DNA overrides
    let scale = [0, 2, 4, 7, 9, 11, 12, 14, 16, 19, 23, 24];

    const SAW_DETUNE = [-8, -3, 0, 3, 8];

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const THRESHOLDS = {
        ENERGY_SILENT:  0.00,
        ENERGY_WHISPER: 0.10,
        ENERGY_BREATHE: 0.25,
        ENERGY_FLOW:    0.45,
        ENERGY_SURGE:   0.65,
        ENERGY_PEAK:    0.85,
        VOID_SETTLE:    0.2,
        VOID_DEEP:      0.5,
        VOID_SACRED:    0.8,
        VOID_TRANSCEND: 1.0,
        SHAKE_TRILL_RATE: 12,
        CIRCLE_ARP_SPEED: 0.5,
        SWEEP_GLISS_RANGE: 24,
        ROCK_VIBRATO_DEPTH: 15,
        TOSS_REVERB_TAIL: 3.0,
    };

    const STAGES = {
        EMERGING:     { threshold: 0,   bpmBoost: 0,  shift: 0 },
        FLOWING:      { threshold: 100, bpmBoost: 3,  shift: 7 },
        SURGING:      { threshold: 400, bpmBoost: 8,  shift: 14 },
        TRANSCENDENT: { threshold: 800, bpmBoost: 12, shift: 19 },
    };

    // Stage-dependent drum patterns (16 steps)
    const DRUM_PATTERNS = {
        FLOWING: {
            kick:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            hat:   [0.3,0,0,0, 0.3,0,0,0, 0.3,0,0,0, 0.3,0,0,0],
        },
        SURGING: {
            kick:  [1,0,0,0, 0,0,0.4,0, 0.9,0,0,0, 0,0,0,0],
            snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            hat:   [0.5,0,0.3,0, 0.5,0,0.3,0, 0.5,0,0.3,0, 0.5,0,0.3,0],
        },
        TRANSCENDENT: {
            kick:  [1,0,0,0, 0,0,0.4,0, 0.9,0,0,0, 0,0,0.3,0],
            snare: [0,0,0,0, 1,0,0,0.15, 0,0,0,0, 1,0,0,0.2],
            hat:   [0.5,0.15,0.3,0.15, 0.5,0.15,0.3,0.15, 0.5,0.15,0.3,0.15, 0.5,0.15,0.3,0.15],
        },
    };

    // ═══════════════════════════════════════════════════════════════════════
    // VOID AUDIO STATE
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
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    function createReverbBuffer(time) {
        const len = ctx.sampleRate * time;
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const data = buf.getChannelData(c);
            for (let i = 0; i < len; i++) {
                const t = i / len;
                // Early reflections: burst in first 30ms
                const early = (i < ctx.sampleRate * 0.03) ? 0.5 : 0;
                // Late reverb: cubic decay
                const late = Math.pow(1 - t, 3) * 0.3;
                data[i] = (Math.random() * 2 - 1) * (early + late);
            }
        }
        return buf;
    }

    function connectLayerToMix(layer) {
        // Route layer gain → sidechain (dry) + reverb (wet)
        const dry = ctx.createGain();
        dry.gain.value = 1.0 - layer.wet;
        const wet = ctx.createGain();
        wet.gain.value = layer.wet;
        layer.gain.connect(dry);
        layer.gain.connect(wet);
        dry.connect(sidechainGain);
        wet.connect(reverbSend);
        layer._dry = dry;
        layer._wet = wet;
    }

    function dest() {
        return sidechainGain || masterGain;
    }

    function showMsg(txt) {
        const el = document.getElementById('notification');
        if (el) {
            el.textContent = txt;
            el.classList.add('visible');
            setTimeout(function() { el.classList.remove('visible'); }, 2000);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INIT — Build the complete audio graph
    // ═══════════════════════════════════════════════════════════════════════

    function init(audioContext) {
        if (state.initialized) return;
        ctx = audioContext;

        // ── Master chain ──
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.ratio.value = 4;
        compressor.connect(ctx.destination);

        const waveshaper = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i / 128) - 1;
            curve[i] = Math.tanh(x * 1.4);
        }
        waveshaper.curve = curve;
        waveshaper.oversample = '2x';
        waveshaper.connect(compressor);

        lofiFilter = ctx.createBiquadFilter();
        lofiFilter.type = 'lowpass';
        lofiFilter.frequency.value = 2000;
        lofiFilter.Q.value = 0.7;
        lofiFilter.connect(waveshaper);

        masterGain = ctx.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(lofiFilter);

        // ── Sidechain ──
        sidechainGain = ctx.createGain();
        sidechainGain.gain.value = 1.0;
        sidechainGain.connect(masterGain);

        // ── Drum bus ──
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

        // ── Convolver reverb (3s tail, big space) ──
        convolver = ctx.createConvolver();
        convolver.buffer = createReverbBuffer(3.0);

        reverbSend = ctx.createGain();
        reverbSend.gain.value = 0.20; // starts intimate (EMERGING)

        reverbSend.connect(convolver);
        convolver.connect(masterGain);

        // Drums: small reverb send
        const drumWet = ctx.createGain();
        drumWet.gain.value = 0.08;
        drumCompressor.connect(drumWet);
        drumWet.connect(reverbSend);

        // ── Delay line (dotted-eighth, LP in feedback for darkening repeats) ──
        delayNode = ctx.createDelay(1.5);
        delayNode.delayTime.value = (60 / state.tempo) * 0.75; // dotted-eighth

        delayFilter = ctx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 3000;

        delayFeedback = ctx.createGain();
        delayFeedback.gain.value = 0.35;

        delayMix = ctx.createGain();
        delayMix.gain.value = 0.22;

        delaySend = ctx.createGain();
        delaySend.gain.value = 0.25;

        // Delay routing: send → delay → filter → feedback → delay (loop)
        //                                      → mix → masterGain
        delaySend.connect(delayNode);
        delayNode.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayFilter.connect(delayMix);
        delayMix.connect(masterGain);
        // Delay also feeds reverb for cascading echoes
        const delayToReverb = ctx.createGain();
        delayToReverb.gain.value = 0.15;
        delayMix.connect(delayToReverb);
        delayToReverb.connect(reverbSend);

        // ── Create all orchestra layers ──
        buildPadLayer();
        buildAtmosphereLayer();
        buildBassLayer();
        buildStringsLayer();
        buildShimmerLayer();
        buildChoirLayer();

        // ── Input listeners ──
        document.addEventListener('touchstart', onTouch, { passive: false, capture: true });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: false });
        document.addEventListener('mousedown', onMouse);
        document.addEventListener('mousemove', onMouseDrag);
        document.addEventListener('mouseup', onMouseUp);

        // Motion/tilt: attach immediately (permissions granted by bootstrap)
        if (window._motionGranted) {
            state.motionGranted = true;
            window.addEventListener('devicemotion', onDeviceMotion);
        }
        if (window._orientationGranted) {
            state.tiltGranted = true;
            window.addEventListener('deviceorientation', onTilt);
        }
        setupMouseMotionFallback();

        // Neuromorphic modules
        if (typeof GumpMotionBrain !== 'undefined') {
            GumpMotionBrain.init();
        }
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            GumpNeuromorphicMemory.init();
        }
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('motion.spike', onMotionSpike);
        }

        state.initialized = true;
        state.lastMotionTime = Date.now();

        // Start the update loop
        update();
        console.log('[Conductor] v40 — Orchestra ready');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER BUILDERS — Each creates persistent oscillators routed through
    //                   the reverb/dry mix. Gain starts at 0; activation
    //                   crossfades via setTargetAtTime.
    // ═══════════════════════════════════════════════════════════════════════

    function buildPadLayer() {
        const L = layers.pad;
        L.gain = ctx.createGain();
        L.gain.gain.value = 0;
        connectLayerToMix(L);

        const now = ctx.currentTime;

        // Pad filter: warm LP, starts low, evolution opens it
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.6;
        filter.connect(L.gain);
        L.filter = filter;

        // 5 voices: A1(sub), A2, E3, G#3(maj7th), B3(9th)
        // 432Hz tuning
        const voices = [54, 108, 162, 204.1, 242.7];
        voices.forEach(function(freq) {
            // 5 detuned saws per voice = 25 total oscillators
            SAW_DETUNE.forEach(function(det) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = det + (Math.random() - 0.5) * 2;
                const g = ctx.createGain();
                g.gain.value = (freq < 80) ? 0.04 : 0.06; // sub quieter
                osc.connect(g);
                g.connect(filter);
                osc.start(now);
                L.nodes.push(osc);
            });
        });

        // Pad fades in over 5 seconds
        L.gain.gain.setValueAtTime(0, now);
        L.gain.gain.linearRampToValueAtTime(0.06, now + 5);
    }

    function buildAtmosphereLayer() {
        const L = layers.atmosphere;
        L.gain = ctx.createGain();
        L.gain.gain.value = 0;
        connectLayerToMix(L);

        // Two noise bands for depth: low rumble + high air

        // Band 1: Low rumble — brown noise → BP 300Hz
        const lowBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
        const lowData = lowBuf.getChannelData(0);
        let prev = 0;
        for (let i = 0; i < lowData.length; i++) {
            prev = (prev + (Math.random() * 2 - 1) * 0.02) / 1.02;
            lowData[i] = prev * 3.5;
        }
        const lowSrc = ctx.createBufferSource();
        lowSrc.buffer = lowBuf;
        lowSrc.loop = true;
        const lowBP = ctx.createBiquadFilter();
        lowBP.type = 'bandpass';
        lowBP.frequency.value = 300;
        lowBP.Q.value = 0.6;
        const lowGain = ctx.createGain();
        lowGain.gain.value = 0.7;
        lowSrc.connect(lowBP);
        lowBP.connect(lowGain);
        lowGain.connect(L.gain);
        lowSrc.start();

        // Slow LFO on low band filter
        const lowLFO = ctx.createOscillator();
        lowLFO.type = 'sine';
        lowLFO.frequency.value = 0.07 + Math.random() * 0.08;
        const lowLFOG = ctx.createGain();
        lowLFOG.gain.value = 100;
        lowLFO.connect(lowLFOG);
        lowLFOG.connect(lowBP.frequency);
        lowLFO.start();

        // Band 2: High air — white noise → BP 5000Hz
        const hiBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
        const hiData = hiBuf.getChannelData(0);
        for (let i = 0; i < hiData.length; i++) hiData[i] = Math.random() * 2 - 1;
        const hiSrc = ctx.createBufferSource();
        hiSrc.buffer = hiBuf;
        hiSrc.loop = true;
        const hiBP = ctx.createBiquadFilter();
        hiBP.type = 'bandpass';
        hiBP.frequency.value = 5000;
        hiBP.Q.value = 0.4;
        const hiGain = ctx.createGain();
        hiGain.gain.value = 0.3;
        hiSrc.connect(hiBP);
        hiBP.connect(hiGain);
        hiGain.connect(L.gain);
        hiSrc.start();

        // Slow LFO on high band
        const hiLFO = ctx.createOscillator();
        hiLFO.type = 'sine';
        hiLFO.frequency.value = 0.12 + Math.random() * 0.1;
        const hiLFOG = ctx.createGain();
        hiLFOG.gain.value = 1500;
        hiLFO.connect(hiLFOG);
        hiLFOG.connect(hiBP.frequency);
        hiLFO.start();

        L.nodes.push(lowSrc, lowLFO, hiSrc, hiLFO);

        // Atmosphere: always on, very quiet
        L.gain.gain.setValueAtTime(0, ctx.currentTime);
        L.gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 3);
    }

    function buildBassLayer() {
        const L = layers.bass;
        L.gain = ctx.createGain();
        L.gain.gain.value = 0;
        connectLayerToMix(L);

        // Sub sine pair with slight detune for warm beating
        const bassFilter = ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 120;
        bassFilter.Q.value = 1.5;
        bassFilter.connect(L.gain);
        L.filter = bassFilter;

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 54; // A1
        osc1.connect(bassFilter);
        osc1.start();

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 54.12; // slight detune
        osc2.connect(bassFilter);
        osc2.start();

        // Third oscillator: triangle one octave up for presence
        const osc3 = ctx.createOscillator();
        osc3.type = 'triangle';
        osc3.frequency.value = 108;
        const triGain = ctx.createGain();
        triGain.gain.value = 0.15;
        osc3.connect(triGain);
        triGain.connect(bassFilter);
        osc3.start();

        // Slow filter LFO for movement
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.06;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 35;
        lfo.connect(lfoG);
        lfoG.connect(bassFilter.frequency);
        lfo.start();

        L.oscs = [osc1, osc2, osc3];
        L.nodes.push(osc1, osc2, osc3, lfo);
    }

    function buildStringsLayer() {
        const L = layers.strings;
        L.gain = ctx.createGain();
        L.gain.gain.value = 0;
        connectLayerToMix(L);

        // Filter: brighter than typical strings, evolution will open further
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1800;
        filter.Q.value = 0.4;
        filter.connect(L.gain);
        L.filter = filter;

        // 3 voices: root A3, 3rd C#4, 5th E4
        const voices = [216, 272.54, 324];
        voices.forEach(function(freq) {
            // 5 detuned saws per voice
            SAW_DETUNE.forEach(function(det) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = det + (Math.random() - 0.5) * 4;
                const g = ctx.createGain();
                g.gain.value = 0.035;
                osc.connect(g);
                g.connect(filter);
                osc.start();
                L.nodes.push(osc);
            });
        });
    }

    function buildShimmerLayer() {
        const L = layers.shimmer;
        L.gain = ctx.createGain();
        L.gain.gain.value = 0;
        connectLayerToMix(L);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 8000;
        filter.Q.value = 0.3;
        filter.connect(L.gain);

        // High triangles: A5, E6, A6 — the sparkle
        [864, 1296, 1728].forEach(function(freq, idx) {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 10;

            // Amplitude tremolo: sine LFO modulating per-voice gain
            const voiceGain = ctx.createGain();
            voiceGain.gain.value = 0.025;
            const trem = ctx.createOscillator();
            trem.type = 'sine';
            trem.frequency.value = 2.5 + idx * 0.7; // 2.5, 3.2, 3.9 Hz
            const tremG = ctx.createGain();
            tremG.gain.value = 0.012;
            trem.connect(tremG);
            tremG.connect(voiceGain.gain);
            trem.start();

            osc.connect(voiceGain);
            voiceGain.connect(filter);
            osc.start();
            L.nodes.push(osc, trem);
        });
    }

    function buildChoirLayer() {
        const L = layers.choir;
        L.gain = ctx.createGain();
        L.gain.gain.value = 0;
        connectLayerToMix(L);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2500;
        filter.Q.value = 0.4;
        filter.connect(L.gain);

        // 3 sines: root A3, major 3rd C#4, 5th E4 — human-like vibrato each
        [216, 272.54, 324].forEach(function(freq) {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            // Per-voice vibrato: slightly different rate+depth for organic feel
            const vib = ctx.createOscillator();
            vib.type = 'sine';
            vib.frequency.value = 4.5 + Math.random() * 1.5;
            const vibG = ctx.createGain();
            vibG.gain.value = 4 + Math.random() * 4; // 4-8 cents
            vib.connect(vibG);
            vibG.connect(osc.detune);
            vib.start();

            const voiceGain = ctx.createGain();
            voiceGain.gain.value = 0.04;
            osc.connect(voiceGain);
            voiceGain.connect(filter);
            osc.start();
            L.nodes.push(osc, vib);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVOLUTION — totalMotion thresholds change the character of everything
    // ═══════════════════════════════════════════════════════════════════════

    function updateEvolution() {
        const total = state.totalMotion;
        let newStage = 'EMERGING';

        if (total >= STAGES.TRANSCENDENT.threshold) newStage = 'TRANSCENDENT';
        else if (total >= STAGES.SURGING.threshold) newStage = 'SURGING';
        else if (total >= STAGES.FLOWING.threshold) newStage = 'FLOWING';

        if (newStage !== state.evolutionStage) {
            state.lastStage = state.evolutionStage;
            state.evolutionStage = newStage;
            state.stageHarmonicShift = STAGES[newStage].shift;
            showMsg(newStage);
            console.log('[Conductor] Stage → ' + newStage + ' (totalMotion: ' + total.toFixed(0) + ')');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER ACTIVATION — Motion pattern + evolution stage → what you hear
    // ═══════════════════════════════════════════════════════════════════════

    function updateLayers() {
        if (!ctx) return;
        const now = ctx.currentTime;
        const p = state.motionPattern;
        const s = state.evolutionStage;

        // Target gains for each layer
        const t = {
            pad: 0.06,        // always on
            atmosphere: 0.03, // always on
            bass: 0,
            strings: 0,
            shimmer: 0,
            choir: 0,
        };

        // Motion pattern activates layers
        var moving = (p === 'gentle' || p === 'rhythmic' || p === 'vigorous' || p === 'chaotic');
        var intense = (p === 'rhythmic' || p === 'vigorous' || p === 'chaotic');
        var wild = (p === 'vigorous' || p === 'chaotic');

        if (moving) t.bass = 0.14;
        if (intense) t.strings = 0.07;
        if (wild) t.shimmer = 0.05;

        // Evolution stage boosts layers (even without motion)
        if (s === 'FLOWING' || s === 'SURGING' || s === 'TRANSCENDENT') {
            t.bass = Math.max(t.bass, 0.10);
            t.strings = Math.max(t.strings, 0.03);
            t.atmosphere = 0.04;
        }
        if (s === 'SURGING' || s === 'TRANSCENDENT') {
            t.strings = Math.max(t.strings, 0.08);
            t.shimmer = Math.max(t.shimmer, 0.04);
            t.pad = 0.07;
        }
        if (s === 'TRANSCENDENT') {
            t.choir = 0.06;
            t.shimmer = Math.max(t.shimmer, 0.06);
            t.pad = 0.08;
            t.atmosphere = 0.05;
        }

        // Void override: everything fades except atmosphere whisper
        if (voidAudio.active) {
            t.pad = 0.02;
            t.bass = 0;
            t.strings = 0;
            t.shimmer = 0;
            t.choir = 0;
            t.atmosphere = 0.015;
        }

        // Smooth crossfade (longer for stage transitions, shorter for motion)
        var tc = (state.lastStage !== state.evolutionStage) ? 2.0 : 0.5;
        for (var name in t) {
            if (layers[name] && layers[name].gain) {
                layers[name].gain.gain.setTargetAtTime(t[name], now, tc);
            }
        }

        // Reverb amount rises with evolution
        var reverbTargets = {
            EMERGING: 0.20,
            FLOWING: 0.28,
            SURGING: 0.33,
            TRANSCENDENT: 0.38,
        };
        if (reverbSend && !voidAudio.active) {
            // Base from stage, modulated by tilt later in applyTiltExpression
            reverbSend.gain.setTargetAtTime(reverbTargets[s] || 0.20, now, 1.0);
        }

        // Pad filter opens with evolution
        if (layers.pad.filter) {
            var padFilterTargets = {
                EMERGING: 800,
                FLOWING: 1500,
                SURGING: 2500,
                TRANSCENDENT: 4000,
            };
            layers.pad.filter.frequency.setTargetAtTime(
                padFilterTargets[s] || 800, now, 2.0
            );
        }

        // Bass tracks harmonic root + stage shift
        if (layers.bass.oscs && layers.bass.oscs.length > 0) {
            var rootFreq = musicalContext.harmonicRoot / 8;
            var bassFreq = Math.max(25, Math.min(80, rootFreq));
            layers.bass.oscs[0].frequency.setTargetAtTime(bassFreq, now, 0.3);
            layers.bass.oscs[1].frequency.setTargetAtTime(bassFreq * 1.002, now, 0.3);
            if (layers.bass.oscs[2]) {
                layers.bass.oscs[2].frequency.setTargetAtTime(bassFreq * 2, now, 0.3);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INPUT — Touch, mouse, tilt, devicemotion
    // ═══════════════════════════════════════════════════════════════════════

    function onTouch(e) {
        // Fallback permission attachment
        if (!state.motionGranted && window._motionGranted) {
            state.motionGranted = true;
            window.addEventListener('devicemotion', onDeviceMotion);
        }
        if (!state.tiltGranted && window._orientationGranted) {
            state.tiltGranted = true;
            window.addEventListener('deviceorientation', onTilt);
        }
        e.preventDefault();
        state.touching = true;
        var t = e.touches[0];
        state.touchX = t.clientX / window.innerWidth;
        state.touchY = t.clientY / window.innerHeight;
        playNote(state.touchX, state.touchY, 0.7);
        state.energy = Math.min(1, state.energy + 0.05);
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (!state.touching) return;
        var t = e.touches[0];
        var x = t.clientX / window.innerWidth;
        var y = t.clientY / window.innerHeight;
        var dist = Math.sqrt((x - state.touchX) ** 2 + (y - state.touchY) ** 2);
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

    function onMouseDrag(e) {
        if (!state.touching) return;
        var x = e.clientX / window.innerWidth;
        var y = e.clientY / window.innerHeight;
        var dist = Math.sqrt((x - state.touchX) ** 2 + (y - state.touchY) ** 2);
        if (dist > 0.01) {
            playNote(x, y, 0.4 + dist * 3);
            state.touchX = x;
            state.touchY = y;
            state.energy = Math.min(1, state.energy + dist * 0.5);
        }
    }

    function onMouseUp() { state.touching = false; }

    function onTilt(e) {
        state.tiltX = (e.gamma || 0) / 45;
        state.tiltY = ((e.beta || 45) - 45) / 45;
        state.lastOrientation = {
            alpha: e.alpha || 0,
            beta: e.beta || 0,
            gamma: e.gamma || 0,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // G7 FLYWHEEL — Device motion → buffer → pattern → energy
    // ═══════════════════════════════════════════════════════════════════════

    function onDeviceMotion(e) {
        var acc = e.accelerationIncludingGravity;
        if (!acc || acc.x === null) return;

        var dx = Math.abs((acc.x || 0) - state.lastAccel.x);
        var dy = Math.abs((acc.y || 0) - state.lastAccel.y);
        var dz = Math.abs((acc.z || 0) - state.lastAccel.z);
        var newMotion = Math.sqrt(dx * dx + dy * dy + dz * dz) * 0.6;

        state.motion = state.motion * 0.8 + newMotion * 0.2;
        state.motionHistory.push(state.motion);
        if (state.motionHistory.length > 150) state.motionHistory.shift();
        state.totalMotion += state.motion * 0.016;

        if (state.motion > 0.3) state.lastMotionTime = Date.now();
        if (state.motion > 0.5) {
            state.energy = Math.min(1, state.energy + state.motion * 0.003);
        }

        state.lastAccel = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 };

        // Feed neuromorphic brain
        if (typeof GumpMotionBrain !== 'undefined') {
            GumpMotionBrain.process(
                { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 },
                state.lastOrientation,
                Date.now()
            );
        }

        // Step ESN
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            var brainOk = typeof GumpMotionBrain !== 'undefined';
            var linearMag = brainOk ?
                Math.sqrt(
                    GumpMotionBrain.linearAccel.x ** 2 +
                    GumpMotionBrain.linearAccel.y ** 2 +
                    GumpMotionBrain.linearAccel.z ** 2
                ) : state.motion;
            var shortEnergy = brainOk ? GumpMotionBrain.short.energy : state.avgMotion;
            var voidDepth = brainOk ? GumpMotionBrain.voidDepth : 0;
            var tiltMag = Math.sqrt(state.tiltX * state.tiltX + state.tiltY * state.tiltY);

            var dominantNeuron = 0;
            if (brainOk) {
                var neurons = GumpMotionBrain.neurons;
                var maxM = 0, idx = 0;
                for (var n of Object.values(neurons)) {
                    if (n.membrane > maxM) { maxM = n.membrane; dominantNeuron = idx; }
                    idx++;
                }
                dominantNeuron /= 7;
            }

            GumpNeuromorphicMemory.stepESN([linearMag, shortEnergy, voidDepth, dominantNeuron, tiltMag]);
            GumpNeuromorphicMemory.trainESN(shortEnergy);
        }
    }

    function classifyMotion() {
        var hist = state.motionHistory;
        if (hist.length < 20) return;

        var sum = 0;
        for (var i = 0; i < hist.length; i++) sum += hist[i];
        state.avgMotion = sum / hist.length;

        var varSum = 0;
        for (var i = 0; i < hist.length; i++) varSum += Math.abs(hist[i] - state.avgMotion);
        state.intensity = varSum / hist.length;

        var avg = state.avgMotion, v = state.intensity;
        if (avg < 0.3) state.motionPattern = 'still';
        else if (avg < 0.8 && v < 0.5) state.motionPattern = 'gentle';
        else if (v < 1.5 && avg >= 0.8) state.motionPattern = 'rhythmic';
        else if (avg > 1.5 && v < 3) state.motionPattern = 'vigorous';
        else if (v >= 3) state.motionPattern = 'chaotic';

        state.smoothSpeed = state.smoothSpeed * 0.9 + Math.min(1, avg * 0.3) * 0.1;
    }

    function setupMouseMotionFallback() {
        var last = { x: 0, y: 0, time: 0 };
        window.addEventListener('mousemove', function(e) {
            if (!state.initialized) return;
            var now = Date.now();
            var dt = Math.max(1, now - last.time);
            var vx = (e.clientX - last.x) / dt * 100;
            var vy = (e.clientY - last.y) / dt * 100;
            var mm = Math.sqrt(vx * vx + vy * vy) * 0.3;

            state.motion = state.motion * 0.8 + mm * 0.2;
            state.motionHistory.push(state.motion);
            if (state.motionHistory.length > 150) state.motionHistory.shift();
            state.totalMotion += state.motion * 0.016;

            if (state.motion > 0.3) state.lastMotionTime = now;
            if (state.motion > 0.5) {
                state.energy = Math.min(1, state.energy + state.motion * 0.003);
            }

            // Simulate tilt from mouse if no real tilt
            if (!state.tiltGranted || !window._orientationGranted) {
                state.tiltX = ((e.clientX / window.innerWidth) - 0.5) * 2;
                state.tiltY = ((e.clientY / window.innerHeight) - 0.5) * 2;
            }

            if (typeof GumpMotionBrain !== 'undefined' && mm > 0.1) {
                GumpMotionBrain.process(
                    { x: vx * 0.01, y: vy * 0.01, z: 9.8 },
                    state.lastOrientation || { alpha: 0, beta: 0, gamma: 0 },
                    now
                );
            }

            last = { x: e.clientX, y: e.clientY, time: now };
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PLAY NOTE — The cross-product instrument (tilt × touch × motion)
    // ═══════════════════════════════════════════════════════════════════════

    function playNote(x, y, velocity) {
        var now = ctx.currentTime;
        var output = dest();

        // Scale from DNA or default
        var bias = (typeof GumpMusicalDNA !== 'undefined') ? GumpMusicalDNA.getBias() : null;
        var activeScale = bias ? bias.scale : scale;

        // Tilt shifts scale position
        var tiltShift = Math.floor(musicalContext.harmonicTension * activeScale.length * 0.25);
        var noteIdx = Math.floor((1 - y) * activeScale.length) + tiltShift;
        noteIdx = Math.max(0, Math.min(activeScale.length - 1, noteIdx));
        var note = activeScale[noteIdx];

        // Chromatic tension
        if (musicalContext.harmonicTension > 0.4 && Math.random() < 0.5) {
            note += (Math.random() < 0.5) ? 1 : -1;
        }

        // Register: tiltY × touchX
        var baseOctave = 3;
        var tiltOctave = Math.floor(musicalContext.expressionDepth * 2);
        var touchOctave = Math.floor(x * 2);
        var octave = baseOctave + Math.floor((tiltOctave + touchOctave) / 2);

        var rootFreq = musicalContext.harmonicRoot / 4;
        var freq = rootFreq * Math.pow(2, (note + octave * 12) / 12);

        // Articulation: motion speed × touch velocity
        var attack = 0.005 + (1 - velocity) * 0.05 * (1 - state.smoothSpeed);
        var release = 0.1 + (1 - state.smoothSpeed) * 0.3;
        var dur = attack + release + 0.2;

        // Per-note filter
        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600 + x * 3000 + Math.max(0, state.tiltY) * 2000 + state.energy * 1500;
        filter.Q.value = 0.8 + velocity * 0.5 + musicalContext.harmonicTension * 2;

        var noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(velocity * 0.12, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        filter.connect(noteGain);
        noteGain.connect(output);

        // Route to reverb + delay for space and echo
        if (reverbSend) noteGain.connect(reverbSend);
        if (delaySend) noteGain.connect(delaySend);

        // 5-saw detuned supersaw
        for (var i = 0; i < 5; i++) {
            var osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = SAW_DETUNE[i] + (Math.random() - 0.5) * 2;
            osc.connect(filter);
            osc.start(now);
            osc.stop(now + dur + 0.1);
        }

        // Sub sine one octave down
        var sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = freq * 0.5;
        var subGain = ctx.createGain();
        subGain.gain.setValueAtTime(velocity * 0.04, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);
        sub.connect(subGain);
        subGain.connect(output);
        sub.start(now);
        sub.stop(now + dur);

        // Stochastic harmony
        var tension = musicalContext.tensionLevel;
        if (Math.random() < 0.3 + tension * 0.3) {
            var fifth = ctx.createOscillator();
            fifth.type = 'triangle';
            fifth.frequency.value = freq * 1.498;
            var fG = ctx.createGain();
            fG.gain.setValueAtTime(velocity * 0.025, now);
            fG.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.7);
            fifth.connect(filter);
            fifth.start(now);
            fifth.stop(now + dur);
        }
        if (Math.random() < 0.2 + tension * 0.4) {
            var seventh = ctx.createOscillator();
            seventh.type = 'triangle';
            seventh.frequency.value = freq * (tension > 0.4 ? 1.778 : 1.888);
            var sG = ctx.createGain();
            sG.gain.setValueAtTime(velocity * 0.018, now);
            sG.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.5);
            seventh.connect(filter);
            seventh.start(now);
            seventh.stop(now + dur);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DRUMS — Warm 808 kick, lo-fi snare, dark hat
    // ═══════════════════════════════════════════════════════════════════════

    function playKick(time, vel) {
        var sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(50, time);
        sub.frequency.exponentialRampToValueAtTime(28, time + 0.8);
        var subGain = ctx.createGain();
        subGain.gain.setValueAtTime(vel * 0.8, time);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
        sub.connect(subGain);
        subGain.connect(drumBus);
        sub.start(time);
        sub.stop(time + 1.3);

        var body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(80, time);
        body.frequency.exponentialRampToValueAtTime(40, time + 0.12);
        var bodyLP = ctx.createBiquadFilter();
        bodyLP.type = 'lowpass';
        bodyLP.frequency.value = 200;
        var bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(vel * 0.5, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        body.connect(bodyLP);
        bodyLP.connect(bodyGain);
        bodyGain.connect(drumBus);
        body.start(time);
        body.stop(time + 0.25);

        // Sidechain duck
        if (sidechainGain) {
            sidechainGain.gain.setValueAtTime(0.15, time);
            sidechainGain.gain.linearRampToValueAtTime(1.0, time + 0.25);
        }
    }

    function playSnare(time, vel) {
        var body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(200, time);
        body.frequency.exponentialRampToValueAtTime(120, time + 0.05);
        var bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(vel * 0.45, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        body.connect(bodyGain);
        bodyGain.connect(drumBus);
        body.start(time);
        body.stop(time + 0.1);

        var noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        var noiseData = noiseBuf.getChannelData(0);
        for (var i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
        var noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2500;
        bp.Q.value = 0.8;
        var lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 4000;
        var nG = ctx.createGain();
        nG.gain.setValueAtTime(vel * 0.35, time);
        nG.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        noise.connect(bp);
        bp.connect(lp);
        lp.connect(nG);
        nG.connect(drumBus);
        noise.start(time);
        noise.stop(time + 0.15);
    }

    function playHat(time, vel) {
        var noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        var noiseData = noiseBuf.getChannelData(0);
        for (var i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
        var noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 3500;
        bp.Q.value = 1.0;
        var lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 5000;
        var g = ctx.createGain();
        g.gain.setValueAtTime(vel * 0.12, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        noise.connect(bp);
        bp.connect(lp);
        lp.connect(g);
        g.connect(drumBus);
        noise.start(time);
        noise.stop(time + 0.05);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GROOVE — Stage-dependent drum patterns + vinyl crackle
    // ═══════════════════════════════════════════════════════════════════════

    function startGroove() {
        if (state.groovePlaying) return;
        state.groovePlaying = true;
        state.nextStepTime = ctx.currentTime + 0.1;

        // Vinyl crackle
        if (ctx && sidechainGain && !crackleSource) {
            var bufLen = ctx.sampleRate * 4;
            var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
            var data = buf.getChannelData(0);
            var last = 0;
            for (var i = 0; i < bufLen; i++) {
                last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02;
                data[i] = last * 3.5;
            }
            crackleSource = ctx.createBufferSource();
            crackleSource.buffer = buf;
            crackleSource.loop = true;
            var bp = ctx.createBiquadFilter();
            bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 0.5;
            var lp = ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 2000;
            crackleGain = ctx.createGain();
            crackleGain.gain.value = 0.015;
            crackleLFO = ctx.createOscillator();
            crackleLFO.type = 'sine';
            crackleLFO.frequency.value = 0.3 + Math.random() * 0.7;
            crackleLFOGain = ctx.createGain();
            crackleLFOGain.gain.value = 0.008;
            crackleLFO.connect(crackleLFOGain);
            crackleLFOGain.connect(crackleGain.gain);
            crackleSource.connect(bp);
            bp.connect(lp);
            lp.connect(crackleGain);
            crackleGain.connect(sidechainGain);
            crackleSource.start();
            crackleLFO.start();
        }
    }

    function stopGroove() {
        state.groovePlaying = false;
        if (crackleSource) { try { crackleSource.stop(); } catch(e) {} crackleSource = null; }
        if (crackleLFO) { try { crackleLFO.stop(); } catch(e) {} crackleLFO = null; }
        if (crackleLFOGain) { try { crackleLFOGain.disconnect(); } catch(e) {} crackleLFOGain = null; }
        if (crackleGain) { try { crackleGain.disconnect(); } catch(e) {} crackleGain = null; }
    }

    function runGroove() {
        if (!state.groovePlaying) return;

        // Pick the right pattern for the current stage
        var pattern = DRUM_PATTERNS[state.evolutionStage];
        if (!pattern) return; // EMERGING = no drums

        while (state.nextStepTime < ctx.currentTime + 0.1) {
            var step = state.grooveStep;
            var t = state.nextStepTime;
            var dnaVel = (typeof GumpMusicalDNA !== 'undefined') ?
                GumpMusicalDNA.getBias().drumVelocity : 1.0;
            var intensity = (0.4 + state.energy * 0.5) * dnaVel;

            if (pattern.kick[step]) playKick(t, pattern.kick[step] * intensity);
            if (pattern.snare[step]) playSnare(t, pattern.snare[step] * intensity);
            if (pattern.hat[step]) playHat(t, pattern.hat[step] * intensity);

            // Swing
            var stepDur = (60 / state.tempo) / 4;
            var swing = (step % 2 === 0) ? 1.08 : 0.92;
            state.nextStepTime += stepDur * swing;
            state.grooveStep = (step + 1) % 16;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOID AUDIO — 432Hz healing drone (stillness is not silence)
    // ═══════════════════════════════════════════════════════════════════════

    function enterVoidAudio() {
        if (voidAudio.active || !ctx) return;
        var now = ctx.currentTime;

        voidAudio.masterGainNode = ctx.createGain();
        voidAudio.masterGainNode.gain.setValueAtTime(0, now);
        voidAudio.masterGainNode.gain.linearRampToValueAtTime(0.06, now + 4);
        voidAudio.masterGainNode.connect(masterGain);

        voidAudio.filter = ctx.createBiquadFilter();
        voidAudio.filter.type = 'lowpass';
        voidAudio.filter.frequency.value = 400;
        voidAudio.filter.Q.value = 1.0;
        voidAudio.filter.connect(voidAudio.masterGainNode);

        // Three freq centers: sub-octave, fundamental, fifth
        var voidFreqs = [
            { freq: 216, vol: 0.4 },
            { freq: 432, vol: 1.0 },
            { freq: 648, vol: 0.35 },
        ];
        voidFreqs.forEach(function(v) {
            [-3, 0, 3].forEach(function(detune) {
                var osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = v.freq;
                osc.detune.value = detune;
                var g = ctx.createGain();
                g.gain.value = v.vol * 0.35;
                osc.connect(g);
                g.connect(voidAudio.filter);
                osc.start(now);
                voidAudio.oscillators.push(osc);
                voidAudio.gains.push(g);
            });
        });

        voidAudio.active = true;
    }

    function updateVoidAudio(depth, breathPhase) {
        if (!voidAudio.active || !ctx) return;
        var now = ctx.currentTime;

        var voidAmp = (typeof GumpMusicalDNA !== 'undefined') ?
            GumpMusicalDNA.getBias().gestureAmplifiers.void : 1;
        if (voidAudio.masterGainNode) {
            voidAudio.masterGainNode.gain.setTargetAtTime(
                (0.03 + depth * 0.04) * voidAmp, now, 0.5
            );
        }
        if (voidAudio.filter) {
            var breathVal = (Math.sin(breathPhase) + 1) * 0.5;
            voidAudio.filter.frequency.setTargetAtTime(400 + breathVal * 800, now, 0.3);
        }

        if (depth > 0.9 && !voidAudio.overtoneOsc) {
            voidAudio.overtoneOsc = ctx.createOscillator();
            voidAudio.overtoneOsc.type = 'sine';
            voidAudio.overtoneOsc.frequency.value = 864;
            voidAudio.overtoneGain = ctx.createGain();
            voidAudio.overtoneGain.gain.setValueAtTime(0, now);
            voidAudio.overtoneGain.gain.linearRampToValueAtTime(0.3, now + 3);
            voidAudio.overtoneOsc.connect(voidAudio.overtoneGain);
            voidAudio.overtoneGain.connect(voidAudio.filter);
            voidAudio.overtoneOsc.start(now);
        }
        if (depth < 0.8 && voidAudio.overtoneOsc) {
            try {
                voidAudio.overtoneGain.gain.setTargetAtTime(0, now, 0.5);
                var ref = voidAudio.overtoneOsc;
                setTimeout(function() { try { ref.stop(); } catch(e) {} }, 2000);
            } catch(e) {}
            voidAudio.overtoneOsc = null;
            voidAudio.overtoneGain = null;
        }

        voidAudio.currentDepth = depth;
    }

    function exitVoidAudio() {
        if (!voidAudio.active || !ctx) return;
        var now = ctx.currentTime;
        if (voidAudio.masterGainNode) {
            voidAudio.masterGainNode.gain.setTargetAtTime(0, now, 1.5);
        }
        var oscs = voidAudio.oscillators.slice();
        var overtone = voidAudio.overtoneOsc;
        var nodes = [voidAudio.masterGainNode, voidAudio.filter, voidAudio.overtoneGain].filter(Boolean);
        setTimeout(function() {
            oscs.forEach(function(o) { try { o.stop(); } catch(e) {} });
            if (overtone) try { overtone.stop(); } catch(e) {}
            nodes.forEach(function(n) { try { n.disconnect(); } catch(e) {} });
        }, 4000);
        voidAudio.oscillators = [];
        voidAudio.gains = [];
        voidAudio.filter = null;
        voidAudio.masterGainNode = null;
        voidAudio.overtoneOsc = null;
        voidAudio.overtoneGain = null;
        voidAudio.active = false;
        voidAudio.currentDepth = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GESTURE-TO-MUSIC — Context-aware compound reactivity
    // ═══════════════════════════════════════════════════════════════════════

    function onMotionSpike(data) {
        if (!ctx || !masterGain) return;
        var now = Date.now();

        if (musicalContext.lastGestureTime > 0) {
            var interval = now - musicalContext.lastGestureTime;
            musicalContext.userIntervalHistory.push(interval);
            if (musicalContext.userIntervalHistory.length > 16) {
                musicalContext.userIntervalHistory.shift();
            }
        }

        musicalContext.wasPredicted = (
            musicalContext.predictedNextGesture === data.neuron &&
            musicalContext.predictionConfidence > 0.3
        );
        musicalContext.gesturesSinceStillness++;
        musicalContext.lastGesture = data.neuron;
        musicalContext.lastGestureTime = now;

        if (data.neuron === 'stillness') {
            musicalContext.gesturesSinceStillness = 0;
            return;
        }

        var afterStillness = musicalContext.gesturesSinceStillness <= 1;
        var highTension = musicalContext.tensionLevel > 0.4;
        var predicted = musicalContext.wasPredicted;
        var resolving = musicalContext.momentumDirection === 'resolving';

        var dnaAmps = (typeof GumpMusicalDNA !== 'undefined') ?
            GumpMusicalDNA.getBias().gestureAmplifiers :
            { shake: 1, sweep: 1, pendulum: 1, void: 1, surprise: 1 };

        switch (data.neuron) {
            case 'shake':
                if (predicted) playHarmonicContinuation(data.firingRate * dnaAmps.shake);
                else if (highTension) playTrill(data.firingRate * dnaAmps.shake, true);
                else if (afterStillness) playTrill(data.firingRate * 0.5 * dnaAmps.shake, false);
                else playTrill(data.firingRate * dnaAmps.shake, false);
                break;
            case 'circle':
                if (resolving) playArpeggio(data.energy * dnaAmps.sweep, 'resolving');
                else if (predicted) playArpeggio(data.energy * dnaAmps.sweep, 'continuation');
                else playArpeggio(data.energy * dnaAmps.sweep, 'normal');
                break;
            case 'sweep':
                if (afterStillness || musicalContext.momentumDirection === 'building')
                    playGlissando(data.magnitude * dnaAmps.sweep, 'ascending');
                else if (resolving)
                    playGlissando(data.magnitude * dnaAmps.sweep, 'descending');
                else
                    playGlissando(data.magnitude * dnaAmps.sweep, 'normal');
                break;
            case 'pendulum':
                if (musicalContext.detectedUserBPM > 0)
                    playSyncedPulse(data.firingRate * dnaAmps.pendulum, musicalContext.detectedUserBPM);
                else
                    playPendulumPulse(data.firingRate * dnaAmps.pendulum);
                break;
            case 'rock':
                applyVibratoModulation(data.firingRate * dnaAmps.pendulum, musicalContext.tensionLevel);
                break;
            case 'toss':
                playTossImpact(data.energy * dnaAmps.surprise, musicalContext.emotionalArc);
                break;
        }
    }

    // ── SHAKE → Trill ──
    function playTrill(firingRate, dissonant) {
        var now = ctx.currentTime;
        var output = dest();
        var rate = Math.min(THRESHOLDS.SHAKE_TRILL_RATE, 6 + firingRate * 4);
        var interval = 1 / rate;
        var baseFreq = musicalContext.harmonicRoot;
        var brightness = musicalContext.expressionDepth;

        var trillInterval;
        if (dissonant || brightness < 0.3) trillInterval = (Math.random() < 0.5) ? 1 : 6;
        else if (brightness > 0.7) trillInterval = (Math.random() < 0.5) ? 7 : 5;
        else trillInterval = 2;

        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 4000 + brightness * 3000;
        filter.Q.value = dissonant ? 3 : 1;
        filter.connect(output);
        if (delaySend) filter.connect(delaySend);

        for (var i = 0; i < 8; i++) {
            var t = now + i * interval;
            var freq = baseFreq * Math.pow(2, ((i % 2) * trillInterval) / 12);
            [-5, 0, 5].forEach(function(detune) {
                var osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = detune;
                var g = ctx.createGain();
                var vol = 0.02 * (1 - i * 0.1);
                g.gain.setValueAtTime(Math.max(0.002, vol), t);
                g.gain.exponentialRampToValueAtTime(0.001, t + interval * 0.9);
                osc.connect(g);
                g.connect(filter);
                osc.start(t);
                osc.stop(t + interval);
            });
        }
    }

    // ── CIRCLE → Arpeggio ──
    function playArpeggio(energy, mode) {
        var now = ctx.currentTime;
        var output = dest();
        var baseFreq = musicalContext.harmonicRoot / 2;
        var speed = THRESHOLDS.CIRCLE_ARP_SPEED;

        var intervals;
        if (mode === 'continuation') intervals = [0, 4, 7, 11, 14, 17, 21, 24];
        else if (mode === 'resolving') intervals = [24, 21, 19, 16, 12, 7, 4, 0];
        else intervals = [0, 4, 7, 11, 12, 11, 7, 4];

        var noteDur = speed / intervals.length;

        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3500 + musicalContext.expressionDepth * 3000;
        filter.connect(output);
        if (delaySend) filter.connect(delaySend);

        intervals.forEach(function(semitone, i) {
            var t = now + i * noteDur;
            var freq = baseFreq * Math.pow(2, semitone / 12);
            [-5, 0, 5].forEach(function(detune) {
                var osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = detune;
                var g = ctx.createGain();
                g.gain.setValueAtTime(0.018 * Math.min(1, (energy || 0.3) + 0.3), t);
                g.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 1.5);
                osc.connect(g);
                g.connect(filter);
                osc.start(t);
                osc.stop(t + noteDur * 2);
            });
        });
    }

    // ── SWEEP → Glissando ──
    function playGlissando(magnitude, direction) {
        var now = ctx.currentTime;
        var output = dest();
        var range = THRESHOLDS.SWEEP_GLISS_RANGE;
        var baseFreq = musicalContext.harmonicRoot;
        var duration = 0.4 + (magnitude || 0) * 0.1;

        var startFreq, endFreq;
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

        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.linearRampToValueAtTime(4000, now + duration * 0.5);
        filter.frequency.linearRampToValueAtTime(1500, now + duration);
        filter.Q.value = 1.5 + musicalContext.harmonicTension * 3;

        var g = ctx.createGain();
        g.gain.setValueAtTime(0.05, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);
        filter.connect(g);
        g.connect(output);
        if (delaySend) g.connect(delaySend);

        SAW_DETUNE.forEach(function(detune) {
            var osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
            osc.detune.value = detune;
            osc.connect(filter);
            osc.start(now);
            osc.stop(now + duration + 0.2);
        });
    }

    // ── PENDULUM → Pulse ──
    function playPendulumPulse(firingRate) {
        var now = ctx.currentTime;
        var output = dest();
        var pulseRate = Math.max(0.5, Math.min(3, firingRate || 1));
        var interval = 1 / pulseRate;
        var rootFreq = musicalContext.harmonicRoot / 2;

        for (var i = 0; i < 4; i++) {
            var t = now + i * interval;
            var osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = rootFreq;
            var g = ctx.createGain();
            g.gain.setValueAtTime(0.1, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + interval * 0.5);
            osc.connect(g);
            g.connect(output);
            osc.start(t);
            osc.stop(t + interval);
        }
    }

    // ── PENDULUM → Synced Pulse ──
    function playSyncedPulse(firingRate, userBPM) {
        var now = ctx.currentTime;
        var output = dest();
        var beatInterval = 60 / userBPM;
        var rootFreq = musicalContext.harmonicRoot / 2;
        var fifthFreq = rootFreq * 1.498;
        var tension = musicalContext.tensionLevel;

        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000 + musicalContext.expressionDepth * 3000;
        filter.connect(output);

        for (var i = 0; i < 4; i++) {
            var t = now + i * beatInterval;
            var freq = (i % 2 === 0) ? rootFreq : fifthFreq;
            [-3, 0, 3].forEach(function(detune) {
                var osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = detune;
                var g = ctx.createGain();
                g.gain.setValueAtTime(0.025, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + beatInterval * 0.4);
                osc.connect(g);
                g.connect(filter);
                osc.start(t);
                osc.stop(t + beatInterval * 0.5);
            });

            if (tension > 0.3) {
                var offT = t + beatInterval * 0.5;
                var echo = ctx.createOscillator();
                echo.type = 'triangle';
                echo.frequency.value = freq * 2;
                var eG = ctx.createGain();
                eG.gain.setValueAtTime(0.012 * tension, offT);
                eG.gain.exponentialRampToValueAtTime(0.001, offT + beatInterval * 0.2);
                echo.connect(eG);
                eG.connect(filter);
                echo.start(offT);
                echo.stop(offT + beatInterval * 0.3);
            }
        }
    }

    // ── ROCK → Vibrato ──
    function applyVibratoModulation(firingRate, tension) {
        if (!lofiFilter || !ctx) return;
        var now = ctx.currentTime;
        var output = dest();
        var depth = THRESHOLDS.ROCK_VIBRATO_DEPTH + (tension || 0) * 30;
        var duration = 2.0;
        var vibratoRate = 3 + (firingRate || 0) * 2;

        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = musicalContext.harmonicRoot;
        var lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = vibratoRate;
        var lfoG = ctx.createGain();
        lfoG.gain.value = depth;
        lfo.connect(lfoG);
        lfoG.connect(osc.detune);

        var g = ctx.createGain();
        g.gain.setValueAtTime(0.04, now);
        g.gain.setTargetAtTime(0.001, now + duration * 0.5, duration * 0.3);
        osc.connect(g);
        g.connect(output);
        osc.start(now); lfo.start(now);
        osc.stop(now + duration); lfo.stop(now + duration);
    }

    // ── TOSS → Impact ──
    function playTossImpact(energy, emotionalArc) {
        var now = ctx.currentTime;
        var output = dest();
        var tailTime = THRESHOLDS.TOSS_REVERB_TAIL;
        var arc = emotionalArc || 0.5;

        var buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        var bufData = buf.getChannelData(0);
        for (var i = 0; i < bufData.length; i++) {
            bufData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
        }
        var noise = ctx.createBufferSource();
        noise.buffer = buf;
        var impFilt = ctx.createBiquadFilter();
        impFilt.type = 'lowpass';
        impFilt.frequency.value = 2000 + arc * 6000;
        impFilt.Q.value = 1 + arc * 2;
        var nG = ctx.createGain();
        nG.gain.setValueAtTime(0.2 * Math.min(1, (energy || 0.5) + 0.3), now);
        nG.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        var body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(200 + arc * 100, now);
        body.frequency.exponentialRampToValueAtTime(60, now + 0.2);
        var bG = ctx.createGain();
        bG.gain.setValueAtTime(0.15, now);
        bG.gain.exponentialRampToValueAtTime(0.001, now + tailTime);

        var tail = ctx.createOscillator();
        tail.type = 'sine';
        tail.frequency.value = musicalContext.harmonicRoot;
        var tG = ctx.createGain();
        tG.gain.setValueAtTime(0, now);
        tG.gain.linearRampToValueAtTime(0.04, now + 0.05);
        tG.gain.exponentialRampToValueAtTime(0.001, now + tailTime);
        var tF = ctx.createBiquadFilter();
        tF.type = 'lowpass';
        tF.frequency.setValueAtTime(3000 + arc * 3000, now);
        tF.frequency.exponentialRampToValueAtTime(200, now + tailTime);

        noise.connect(impFilt); impFilt.connect(nG); nG.connect(output);
        body.connect(bG); bG.connect(output);
        tail.connect(tF); tF.connect(tG); tG.connect(output);
        // Impact through reverb for drama
        if (reverbSend) { nG.connect(reverbSend); tG.connect(reverbSend); }

        noise.start(now); noise.stop(now + 0.15);
        body.start(now); body.stop(now + tailTime + 0.1);
        tail.start(now); tail.stop(now + tailTime + 0.1);
    }

    // ── Harmonic Continuation (predicted gesture) ──
    function playHarmonicContinuation(firingRate) {
        var now = ctx.currentTime;
        var output = dest();
        var rootFreq = musicalContext.harmonicRoot / 2;
        var tension = musicalContext.tensionLevel;

        var chordFreqs = [rootFreq, rootFreq * Math.pow(2, 4/12), rootFreq * 1.498];
        if (tension > 0.3) chordFreqs.push(rootFreq * Math.pow(2, 10/12));

        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.linearRampToValueAtTime(3500, now + 0.5);
        filter.connect(output);

        chordFreqs.forEach(function(freq) {
            [-4, 0, 4].forEach(function(detune) {
                var osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = detune;
                var g = ctx.createGain();
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.015, now + 0.3);
                g.gain.setTargetAtTime(0.001, now + 1.5, 0.5);
                osc.connect(g);
                g.connect(filter);
                osc.start(now);
                osc.stop(now + 3);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // APPRECIATION — The machine recognizes you
    // ═══════════════════════════════════════════════════════════════════════

    function checkAppreciation() {
        if (!ctx || !masterGain) return;
        var now = ctx.currentTime;

        // Returning user: iv→I resolution
        if (!state.welcomeBackPlayed &&
            typeof GumpNeuromorphicMemory !== 'undefined' &&
            GumpNeuromorphicMemory.isReturningUser) {
            state.welcomeBackPlayed = true;
            playWelcomeBack(now);
            showMsg('WELCOME BACK');
        }

        // New gesture discovered
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            var newGestures = GumpNeuromorphicMemory.newGesturesThisSession;
            if (newGestures.length > 0 && (now - state.lastDiscoveryTime) > 10) {
                state.lastDiscoveryTime = now;
                playDiscoveryArpeggio(now);
                showMsg('DISCOVERED: ' + newGestures[newGestures.length - 1].toUpperCase());
            }
        }

        // Pattern consistency
        if (typeof GumpNeuromorphicMemory !== 'undefined' &&
            (now - state.lastConsistencyTime) > 60) {
            var seq = GumpNeuromorphicMemory.sessionMemory.gestureSequence;
            if (seq.length >= 10) {
                var last5 = seq.slice(-5);
                var prev5 = seq.slice(-10, -5);
                var prev5Set = new Set(prev5);
                var overlap = 0;
                for (var i = 0; i < last5.length; i++) {
                    if (prev5Set.has(last5[i])) overlap++;
                }
                if (overlap >= 4) {
                    state.lastConsistencyTime = now;
                    playConsistencyVoice(now);
                }
            }
        }

        // Pattern break: surprise filter burst
        if (typeof GumpNeuromorphicMemory !== 'undefined' &&
            GumpNeuromorphicMemory.detectPatternBreak()) {
            var surprise = GumpNeuromorphicMemory.surprise;
            if (surprise > 0.3 && lofiFilter) {
                var freq = lofiFilter.frequency.value;
                lofiFilter.frequency.setValueAtTime(freq, now);
                lofiFilter.frequency.linearRampToValueAtTime(
                    Math.min(12000, freq + surprise * 6000), now + 0.1
                );
                lofiFilter.frequency.setTargetAtTime(freq, now + 0.15, 0.3);
            }
        }
    }

    function playWelcomeBack(now) {
        var ivChord = [288.33, 343.17, 432, 513.74];
        var IChord = [216, 272.54, 324, 408.24];
        var output = dest();

        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(3000, now + 2);
        filter.connect(output);
        if (reverbSend) filter.connect(reverbSend);

        ivChord.forEach(function(f) {
            [-3, 0, 3].forEach(function(det) {
                var osc = ctx.createOscillator();
                osc.type = 'sawtooth'; osc.frequency.value = f; osc.detune.value = det;
                var g = ctx.createGain();
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.015, now + 0.5);
                g.gain.setTargetAtTime(0.001, now + 1.5, 0.3);
                osc.connect(g); g.connect(filter);
                osc.start(now); osc.stop(now + 3);
            });
        });

        IChord.forEach(function(f) {
            [-3, 0, 3].forEach(function(det) {
                var osc = ctx.createOscillator();
                osc.type = 'sawtooth'; osc.frequency.value = f; osc.detune.value = det;
                var g = ctx.createGain();
                g.gain.setValueAtTime(0, now + 1.5);
                g.gain.linearRampToValueAtTime(0.018, now + 2.0);
                g.gain.exponentialRampToValueAtTime(0.001, now + 5);
                osc.connect(g); g.connect(filter);
                osc.start(now + 1.5); osc.stop(now + 5.5);
            });
        });
    }

    function playDiscoveryArpeggio(now) {
        var baseFreq = 432;
        var intervals = [0, 7, 12, 19, 24];
        var fibGaps = [0, 0.08, 0.21, 0.42, 0.76];
        var output = dest();

        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 5000;
        filter.connect(output);
        if (delaySend) filter.connect(delaySend);

        intervals.forEach(function(semitone, i) {
            var t = now + fibGaps[i];
            var freq = baseFreq * Math.pow(2, semitone / 12);
            [-4, 0, 4].forEach(function(det) {
                var osc = ctx.createOscillator();
                osc.type = 'sawtooth'; osc.frequency.value = freq; osc.detune.value = det;
                var g = ctx.createGain();
                g.gain.setValueAtTime(0.02, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                osc.connect(g); g.connect(filter);
                osc.start(t); osc.stop(t + 0.7);
            });
        });
    }

    function playConsistencyVoice(now) {
        var freqs = [324, 486];
        var output = dest();
        var filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        filter.connect(output);
        if (reverbSend) filter.connect(reverbSend);

        freqs.forEach(function(f) {
            [-4, 0, 4].forEach(function(det) {
                var osc = ctx.createOscillator();
                osc.type = 'sawtooth'; osc.frequency.value = f; osc.detune.value = det;
                var g = ctx.createGain();
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.008, now + 2);
                g.gain.setTargetAtTime(0.001, now + 8, 2);
                osc.connect(g); g.connect(filter);
                osc.start(now); osc.stop(now + 14);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL CONTEXT UPDATE
    // ═══════════════════════════════════════════════════════════════════════

    function updateMusicalContext() {
        // STDP prediction
        if (musicalContext.lastGesture && typeof GumpNeuromorphicMemory !== 'undefined') {
            var pred = GumpNeuromorphicMemory.getPrediction(musicalContext.lastGesture);
            musicalContext.predictedNextGesture = pred.gesture;
            musicalContext.predictionConfidence = pred.confidence;
        }

        // Tension from surprise + prediction
        var targetTension = 0;
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            var surprise = GumpNeuromorphicMemory.surprise;
            var conf = musicalContext.predictionConfidence;
            targetTension = surprise * 0.6 + conf * 0.3 + musicalContext.harmonicTension * 0.1;
            if (typeof GumpMusicalDNA !== 'undefined') {
                targetTension += GumpMusicalDNA.getBias().baseTension;
            }
        }
        musicalContext.tensionLevel += (targetTension - musicalContext.tensionLevel) * 0.05;

        // Harmonic root drifts with tension + evolution stage shift
        musicalContext.rootSemitoneOffset +=
            (musicalContext.tensionLevel * 6 - musicalContext.rootSemitoneOffset) * 0.02;
        var totalShift = musicalContext.rootSemitoneOffset + state.stageHarmonicShift;
        musicalContext.harmonicRoot = 432 * Math.pow(2, totalShift / 12);

        // Detect user BPM
        var intervals = musicalContext.userIntervalHistory;
        if (intervals.length >= 4) {
            var recent = intervals.slice(-8);
            var mean = recent.reduce(function(a, b) { return a + b; }, 0) / recent.length;
            var variance = 0;
            for (var i = 0; i < recent.length; i++) {
                variance += (recent[i] - mean) * (recent[i] - mean);
            }
            variance /= recent.length;
            var cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
            if (cv < 0.3 && mean > 200 && mean < 2000) {
                musicalContext.detectedUserBPM = 60000 / mean;
            } else {
                musicalContext.detectedUserBPM *= 0.95;
            }
        }

        // Momentum direction
        var gestures = musicalContext.gesturesSinceStillness;
        if (gestures === 0) musicalContext.momentumDirection = 'still';
        else if (state.energy > 0.5 && musicalContext.tensionLevel > 0.3) musicalContext.momentumDirection = 'building';
        else if (state.energy > 0.3 && musicalContext.tensionLevel < 0.2) musicalContext.momentumDirection = 'sustaining';
        else if (state.energy < 0.2) musicalContext.momentumDirection = 'resolving';

        // Emotional arc
        var targetArc = state.energy * 0.4 + musicalContext.tensionLevel * 0.3 +
            musicalContext.expressionDepth * 0.3;
        musicalContext.emotionalArc += (targetArc - musicalContext.emotionalArc) * 0.03;

        if (state.groovePlaying) musicalContext.rhythmicPhase = state.grooveStep;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TILT EXPRESSION — Stage-aware filter + reverb modulation
    // ═══════════════════════════════════════════════════════════════════════

    function applyTiltExpression() {
        if (!lofiFilter || !ctx) return;

        // tiltX → harmonic tension + filter resonance
        var absTiltX = Math.abs(state.tiltX);
        musicalContext.harmonicTension = Math.min(1, absTiltX);
        var dnaQFloor = (typeof GumpMusicalDNA !== 'undefined') ?
            GumpMusicalDNA.getBias().filterQ : 0.7;
        if (absTiltX > 0.2) {
            lofiFilter.Q.setTargetAtTime(
                Math.max(dnaQFloor, 0.7 + absTiltX * 7.3), ctx.currentTime, 0.1
            );
        } else {
            lofiFilter.Q.setTargetAtTime(dnaQFloor, ctx.currentTime, 0.3);
        }

        // tiltY → expression depth + filter frequency
        var brightness = (state.tiltY + 1) * 0.5;
        musicalContext.expressionDepth = Math.max(0, Math.min(1, brightness));
        musicalContext.rhythmicDensity = 0.2 + brightness * 0.8;

        // tiltY → reverb send modulation (on top of stage base)
        if (reverbSend) {
            var stageBase = { EMERGING: 0.20, FLOWING: 0.28, SURGING: 0.33, TRANSCENDENT: 0.38 };
            var base = stageBase[state.evolutionStage] || 0.20;
            var reverbTarget = base + (1 - brightness) * 0.12; // tilt back = more reverb
            reverbSend.gain.setTargetAtTime(reverbTarget, ctx.currentTime, 0.3);
        }

        // Filter: range expands with evolution stage
        var stageFilterCeiling = {
            EMERGING: 4000,
            FLOWING: 7000,
            SURGING: 10000,
            TRANSCENDENT: 14000,
        };
        var ceiling = stageFilterCeiling[state.evolutionStage] || 4000;
        var dnaFilterBias = (typeof GumpMusicalDNA !== 'undefined') ?
            GumpMusicalDNA.getBias().filterBase : 0;
        var target = 800 + brightness * ceiling + state.energy * 2000 + dnaFilterBias * 0.3;
        state.filterFreq += (target - state.filterFreq) * 0.08;
        lofiFilter.frequency.setValueAtTime(
            Math.min(14000, Math.max(400, state.filterFreq)), ctx.currentTime
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function update() {
        classifyMotion();

        // Energy decay
        if (!state.touching && state.motion < 0.3) {
            state.energy *= 0.995;
        }

        // BPM adapts to motion + evolution stage
        if (state.motionHistory.length > 20) {
            var dnaBias = (typeof GumpMusicalDNA !== 'undefined') ? GumpMusicalDNA.getBias() : null;
            var baseBPM = (dnaBias ? dnaBias.tempo : 80) + state.avgMotion * 8 + state.intensity * 5;
            if (state.motionPattern === 'rhythmic') baseBPM += 5;
            else if (state.motionPattern === 'vigorous') baseBPM += 10;
            else if (state.motionPattern === 'chaotic') baseBPM += 15;
            baseBPM += (STAGES[state.evolutionStage] || STAGES.EMERGING).bpmBoost;
            state.tempo = state.tempo * 0.95 + baseBPM * 0.05;
            state.tempo = Math.max(60, Math.min(140, state.tempo));
        }

        // Groove: starts from FLOWING stage, driven by motion/touch/energy
        var neurons = typeof GumpMotionBrain !== 'undefined' ? GumpMotionBrain.neurons : null;
        var rhythmicity = (neurons && neurons.pendulum && neurons.pendulum.firing) ? 0.8 : state.smoothSpeed * 0.5;
        var touchBoost = state.touching ? 1.5 : 0.5;
        var grooveIntensity = Math.min(1, Math.max(rhythmicity * touchBoost, state.energy));
        var dnaBiasG = (typeof GumpMusicalDNA !== 'undefined') ? GumpMusicalDNA.getBias() : null;
        var grooveThresh = dnaBiasG ? dnaBiasG.grooveThreshold : 0.3;

        // Only allow groove from FLOWING stage onwards
        var stageAllowsGroove = (state.evolutionStage !== 'EMERGING');
        if (stageAllowsGroove && grooveIntensity > grooveThresh && !state.groovePlaying) {
            startGroove();
        }
        if ((!stageAllowsGroove || grooveIntensity < 0.05) && state.groovePlaying) {
            stopGroove();
        }

        // DNA-driven drum bus gain + scale
        if (typeof GumpMusicalDNA !== 'undefined') {
            var dnaBiasU = GumpMusicalDNA.getBias();
            if (drumBus) drumBus.gain.setTargetAtTime(dnaBiasU.drumGain, ctx.currentTime, 0.5);
            scale = dnaBiasU.scale;
        }

        // Weather/context
        if (typeof GumpContext !== 'undefined') {
            var ctxData = GumpContext.get();
            if (ctxData.warmth !== undefined && lofiFilter) {
                state.filterFreq += (ctxData.warmth - 0.5) * 0.6;
            }
            if (ctxData.storminess > 0.3 && lofiFilter) {
                lofiFilter.Q.setTargetAtTime(
                    Math.max(lofiFilter.Q.value, ctxData.storminess * 2), ctx.currentTime, 1.0
                );
            }
        }

        // Expression + musical context
        applyTiltExpression();
        updateMusicalContext();

        // Evolution + layer activation
        updateEvolution();
        updateLayers();

        // Delay syncs to BPM (dotted-eighth)
        if (delayNode) {
            var dottedEighth = (60 / state.tempo) * 0.75;
            delayNode.delayTime.setTargetAtTime(
                Math.max(0.05, Math.min(1.2, dottedEighth)), ctx.currentTime, 0.1
            );
        }

        // Groove
        if (state.groovePlaying) runGroove();

        // ── Neuromorphic: void, surprise, appreciation ──
        state.frameCount++;

        if (typeof GumpMotionBrain !== 'undefined') {
            var brainVoidState = GumpMotionBrain.voidState;
            var voidDepth = GumpMotionBrain.voidDepth;
            var breathPhase = GumpMotionBrain.voidBreathPhase;
            if (brainVoidState >= GumpMotionBrain.VOID_STATES.SETTLING) {
                if (!voidAudio.active) enterVoidAudio();
                updateVoidAudio(voidDepth, breathPhase);
            } else {
                if (voidAudio.active) exitVoidAudio();
            }
        }

        if (typeof GumpNeuromorphicMemory !== 'undefined' && lofiFilter) {
            var surprise = GumpNeuromorphicMemory.surprise;
            if (surprise > 0.5) {
                state.filterFreq = Math.min(12000, state.filterFreq + surprise * 30);
            }
            GumpNeuromorphicMemory.tick(Date.now());
        }

        if (state.frameCount % 120 === 0) checkAppreciation();

        requestAnimationFrame(update);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORTS
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init: init,
        THRESHOLDS: THRESHOLDS,
        get energy() { return state.energy; },
        get tiltGranted() { return state.tiltGranted; },
        get motionGranted() { return state.motionGranted; },
        get motionPattern() { return state.motionPattern; },
        get smoothSpeed() { return state.smoothSpeed; },
        get voidActive() { return voidAudio.active; },
        get musicalContext() { return musicalContext; },
        get evolutionStage() { return state.evolutionStage; },
        get totalMotion() { return state.totalMotion; },
        get layers() { return layers; },
    });

})();

if (typeof window !== 'undefined') {
    window.GumpConductor = GumpConductor;
}
