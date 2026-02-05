// ═══════════════════════════════════════════════════════════════════════════
// GUMP AUDIO ENGINE
// ═══════════════════════════════════════════════════════════════════════════
//
// The core audio system built on Web Audio API.
// Manages context, routing, effects, and all sound generation.
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpAudio = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // AUDIO CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const CONSTANTS = Object.freeze({
        // Base frequency (A0)
        BASE_FREQ: 27.5,

        // Sample rate (will be set from context)
        SAMPLE_RATE: 44100,

        // Master volume limits
        MAX_MASTER_VOLUME: 0.95,
        MIN_MASTER_VOLUME: 0,

        // Voice management
        MAX_VOICES: 64,
        VOICE_STEAL_TIME: 0.01,

        // Default BPM
        DEFAULT_BPM: 90,

        // Latency target (seconds)
        LATENCY_TARGET: 0.01,

        // MIDI note numbers
        MIDI: {
            A0: 21,
            C1: 24,
            A1: 33,
            C2: 36,
            A2: 45,
            C3: 48,
            A3: 57,
            C4: 60,  // Middle C
            A4: 69,  // A440
            C5: 72,
        },
    });

    // Scales and chords
    const SCALES = {
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10],
        pentatonic: [0, 2, 4, 7, 9],
        pentatonic_minor: [0, 3, 5, 7, 10],
        blues: [0, 3, 5, 6, 7, 10],
        dorian: [0, 2, 3, 5, 7, 9, 10],
        phrygian: [0, 1, 3, 5, 7, 8, 10],
        lydian: [0, 2, 4, 6, 7, 9, 11],
        mixolydian: [0, 2, 4, 5, 7, 9, 10],
        locrian: [0, 1, 3, 5, 6, 8, 10],
        chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    };

    const CHORDS = {
        major: [0, 4, 7],
        minor: [0, 3, 7],
        diminished: [0, 3, 6],
        augmented: [0, 4, 8],
        sus2: [0, 2, 7],
        sus4: [0, 5, 7],
        major7: [0, 4, 7, 11],
        minor7: [0, 3, 7, 10],
        dom7: [0, 4, 7, 10],
        dim7: [0, 3, 6, 9],
        add9: [0, 4, 7, 14],
        power: [0, 7, 12],
    };

    // ═══════════════════════════════════════════════════════════════════════
    // AUDIO STATE
    // ═══════════════════════════════════════════════════════════════════════

    const audioState = {
        // Context
        ctx: null,
        isInitialized: false,
        isRunning: false,
        isSuspended: true,

        // Master chain
        masterGain: null,
        masterCompressor: null,
        masterLimiter: null,
        masterFilter: null,
        analyser: null,

        // Effects sends
        reverbSend: null,
        delaySend: null,
        reverbGain: null,
        delayGain: null,
        reverb: null,
        delay: null,

        // Channel groups
        channels: {
            drums: null,
            bass: null,
            synth: null,
            pads: null,
            leads: null,
            fx: null,
            ambient: null,
        },

        // Voice pool
        voicePool: [],
        activeVoices: new Map(),
        voiceCount: 0,

        // Timing
        bpm: 90,
        beatsPerBar: 4,
        currentBeat: 0,
        currentBar: 0,
        beatPhase: 0,
        nextBeatTime: 0,
        schedulerInterval: null,
        scheduleAheadTime: 0.1,  // seconds
        lookahead: 25,           // ms

        // Sidechain
        sidechainActive: false,
        sidechainEnvelope: null,
        sidechainTargets: [],

        // Analysis
        analyserData: null,
        frequencyData: null,
        waveformData: null,

        // State
        masterVolume: 0.8,
        filterCutoff: 20000,
        filterResonance: 0.5,
        reverbMix: 0.3,
        delayMix: 0.2,
        delayTime: 0.375,  // dotted 8th at 90bpm
        delayFeedback: 0.4,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async function init() {
        if (audioState.isInitialized) {
            console.log('Audio already initialized');
            return true;
        }

        try {
            // Use pre-created iOS context if available, otherwise create new
            if (window._iosAudioContext) {
                audioState.ctx = window._iosAudioContext;
                console.log('Using pre-created iOS AudioContext');
            } else {
                audioState.ctx = new (window.AudioContext || window.webkitAudioContext)({
                    latencyHint: 'interactive',
                });
                console.log('Created new AudioContext');
            }

            const ctx = audioState.ctx;
            audioState.sampleRate = ctx.sampleRate;

            // Create master chain
            await createMasterChain();

            // Create effect sends
            await createEffects();

            // Create channel groups
            createChannels();

            // Create voice pool
            createVoicePool();

            // Setup analyser
            setupAnalyser();

            // Setup scheduler
            setupScheduler();

            audioState.isInitialized = true;

            console.log('Audio engine initialized');
            console.log(`Sample rate: ${ctx.sampleRate}`);
            console.log(`Base latency: ${ctx.baseLatency || 'unknown'}`);

            // Emit event
            if (typeof window !== 'undefined' && window.GumpEvents) {
                window.GumpEvents.emit('audio.ready', {
                    sampleRate: ctx.sampleRate,
                    latency: ctx.baseLatency,
                });
            }

            return true;

        } catch (error) {
            console.error('Failed to initialize audio:', error);
            if (typeof window !== 'undefined' && window.GumpEvents) {
                window.GumpEvents.emit('audio.error', { error: error.message });
            }
            return false;
        }
    }

    async function createMasterChain() {
        const ctx = audioState.ctx;

        // Master filter (for global filter sweeps)
        audioState.masterFilter = ctx.createBiquadFilter();
        audioState.masterFilter.type = 'lowpass';
        audioState.masterFilter.frequency.value = 20000;
        audioState.masterFilter.Q.value = 0.5;

        // Master compressor
        audioState.masterCompressor = ctx.createDynamicsCompressor();
        audioState.masterCompressor.threshold.value = -12;
        audioState.masterCompressor.knee.value = 6;
        audioState.masterCompressor.ratio.value = 4;
        audioState.masterCompressor.attack.value = 0.005;
        audioState.masterCompressor.release.value = 0.15;

        // Limiter (aggressive compressor)
        audioState.masterLimiter = ctx.createDynamicsCompressor();
        audioState.masterLimiter.threshold.value = -1;
        audioState.masterLimiter.knee.value = 0;
        audioState.masterLimiter.ratio.value = 20;
        audioState.masterLimiter.attack.value = 0.001;
        audioState.masterLimiter.release.value = 0.05;

        // Master gain
        audioState.masterGain = ctx.createGain();
        audioState.masterGain.gain.value = audioState.masterVolume;

        // Connect master chain
        audioState.masterFilter.connect(audioState.masterCompressor);
        audioState.masterCompressor.connect(audioState.masterLimiter);
        audioState.masterLimiter.connect(audioState.masterGain);
        audioState.masterGain.connect(ctx.destination);
    }

    async function createEffects() {
        const ctx = audioState.ctx;

        // ─────────────────────────────────────────────────────────────────
        // REVERB
        // ─────────────────────────────────────────────────────────────────

        // Create impulse response
        const reverbLength = 4;  // seconds
        const reverbBuffer = createReverbImpulse(reverbLength, 2.5);

        audioState.reverb = ctx.createConvolver();
        audioState.reverb.buffer = reverbBuffer;

        audioState.reverbGain = ctx.createGain();
        audioState.reverbGain.gain.value = audioState.reverbMix;

        audioState.reverbSend = ctx.createGain();
        audioState.reverbSend.gain.value = 1;

        // Reverb chain
        audioState.reverbSend.connect(audioState.reverb);
        audioState.reverb.connect(audioState.reverbGain);
        audioState.reverbGain.connect(audioState.masterFilter);

        // ─────────────────────────────────────────────────────────────────
        // DELAY
        // ─────────────────────────────────────────────────────────────────

        audioState.delay = ctx.createDelay(2.0);
        audioState.delay.delayTime.value = audioState.delayTime;

        const delayFeedback = ctx.createGain();
        delayFeedback.gain.value = audioState.delayFeedback;

        const delayFilter = ctx.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 3000;

        audioState.delayGain = ctx.createGain();
        audioState.delayGain.gain.value = audioState.delayMix;

        audioState.delaySend = ctx.createGain();
        audioState.delaySend.gain.value = 1;

        // Delay chain with feedback
        audioState.delaySend.connect(audioState.delay);
        audioState.delay.connect(delayFilter);
        delayFilter.connect(delayFeedback);
        delayFeedback.connect(audioState.delay);
        delayFilter.connect(audioState.delayGain);
        audioState.delayGain.connect(audioState.masterFilter);

        // Store for later access
        audioState.delayFeedbackNode = delayFeedback;
        audioState.delayFilterNode = delayFilter;
    }

    function createReverbImpulse(duration, decay) {
        const ctx = audioState.ctx;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;

                // Early reflections
                let sample = 0;
                if (i < sampleRate * 0.05) {
                    sample = (Math.random() * 2 - 1) * 0.5;
                }

                // Diffuse tail
                sample += (Math.random() * 2 - 1) * Math.exp(-t * decay);

                // Add some modulation
                sample *= 1 + Math.sin(t * 0.5) * 0.1;

                data[i] = sample * 0.5;
            }
        }

        return buffer;
    }

    function createChannels() {
        const ctx = audioState.ctx;

        const channelNames = ['drums', 'bass', 'synth', 'pads', 'leads', 'fx', 'ambient'];

        channelNames.forEach(name => {
            const channel = ctx.createGain();
            channel.gain.value = 1.0;

            // Each channel connects to master filter and effect sends
            channel.connect(audioState.masterFilter);

            // Store channel
            audioState.channels[name] = channel;
        });

        // Set default channel volumes
        audioState.channels.drums.gain.value = 0.9;
        audioState.channels.bass.gain.value = 0.85;
        audioState.channels.synth.gain.value = 0.7;
        audioState.channels.pads.gain.value = 0.5;
        audioState.channels.leads.gain.value = 0.6;
        audioState.channels.fx.gain.value = 0.4;
        audioState.channels.ambient.gain.value = 0.3;
    }

    function createVoicePool() {
        // Voice pool for efficient voice management
        audioState.voicePool = [];
        audioState.activeVoices.clear();
        audioState.voiceCount = 0;
    }

    function setupAnalyser() {
        const ctx = audioState.ctx;

        audioState.analyser = ctx.createAnalyser();
        audioState.analyser.fftSize = 2048;
        audioState.analyser.smoothingTimeConstant = 0.8;

        audioState.masterGain.connect(audioState.analyser);

        // Create data arrays
        audioState.frequencyData = new Uint8Array(audioState.analyser.frequencyBinCount);
        audioState.waveformData = new Uint8Array(audioState.analyser.frequencyBinCount);
    }

    function setupScheduler() {
        // Beat scheduler for precise timing
        audioState.nextBeatTime = 0;
        audioState.schedulerInterval = setInterval(scheduler, audioState.lookahead);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULER
    // ═══════════════════════════════════════════════════════════════════════

    function scheduler() {
        if (!audioState.isRunning) return;

        const ctx = audioState.ctx;
        const currentTime = ctx.currentTime;

        // Schedule beats ahead
        while (audioState.nextBeatTime < currentTime + audioState.scheduleAheadTime) {
            scheduleBeat(audioState.nextBeatTime);
            advanceBeat();
        }
    }

    function scheduleBeat(time) {
        // Emit beat event (for visualization and other systems)
        if (typeof window !== 'undefined' && window.GumpEvents) {
            window.GumpEvents.emit('music.beat', {
                beat: audioState.currentBeat,
                bar: audioState.currentBar,
                time: time,
            });
        }

        // Trigger sidechain if active
        if (audioState.sidechainActive && audioState.currentBeat === 0) {
            triggerSidechain(time);
        }
    }

    function advanceBeat() {
        const secondsPerBeat = 60 / audioState.bpm;
        audioState.nextBeatTime += secondsPerBeat;

        audioState.currentBeat++;
        if (audioState.currentBeat >= audioState.beatsPerBar) {
            audioState.currentBeat = 0;
            audioState.currentBar++;

            // Emit bar event
            if (typeof window !== 'undefined' && window.GumpEvents) {
                window.GumpEvents.emit('music.bar', {
                    bar: audioState.currentBar,
                });
            }
        }
    }

    function triggerSidechain(time) {
        for (const target of audioState.sidechainTargets) {
            if (target.gain) {
                target.gain.setValueAtTime(0.2, time);
                target.gain.linearRampToValueAtTime(1, time + 0.15);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PLAYBACK CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function mdbg(msg) {
        console.log(msg);
        const el = document.getElementById('mobile-debug');
        if (el) el.innerHTML = msg + '<br>' + el.innerHTML.slice(0, 400);
    }

    async function start() {
        mdbg('engine.start()');
        if (!audioState.isInitialized) {
            mdbg('engine not init, calling init');
            await init();
        }

        const ctx = audioState.ctx;
        mdbg('ctx state: ' + ctx.state);

        // iOS: Don't await resume - it can hang. Just call it and continue.
        if (ctx.state === 'suspended') {
            mdbg('calling resume (no await)...');
            ctx.resume().then(() => {
                mdbg('resume resolved: ' + ctx.state);
            }).catch(e => {
                mdbg('resume err: ' + e.message);
            });
            // Give it a moment
            await new Promise(r => setTimeout(r, 100));
            mdbg('after resume wait, state: ' + ctx.state);
        }

        mdbg('playing silent buffer...');
        // iOS audio unlock - play silent buffer to unlock audio
        try {
            const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
            const silentSource = ctx.createBufferSource();
            silentSource.buffer = silentBuffer;
            silentSource.connect(ctx.destination);
            silentSource.start(0);
            mdbg('silent buffer played');
        } catch (e) {
            mdbg('silent err: ' + e.message);
        }

        audioState.isRunning = true;
        audioState.isSuspended = false;
        audioState.nextBeatTime = ctx.currentTime;

        mdbg('playing startup drone...');
        // Play startup drone through routing
        try {
            const startupOsc = ctx.createOscillator();
            const startupGain = ctx.createGain();
            startupOsc.type = 'sine';
            startupOsc.frequency.value = 110;
            startupGain.gain.value = 0.25;

            startupOsc.connect(startupGain);
            startupGain.connect(audioState.channels.synth);

            const now = ctx.currentTime;
            startupGain.gain.setValueAtTime(0, now);
            startupGain.gain.linearRampToValueAtTime(0.25, now + 0.5);
            startupGain.gain.setValueAtTime(0.25, now + 1.5);
            startupGain.gain.exponentialRampToValueAtTime(0.001, now + 3);

            startupOsc.start(now);
            startupOsc.stop(now + 3.1);
            mdbg('drone started');
        } catch (e) {
            mdbg('drone err: ' + e.message);
        }
        mdbg('engine.start() done');
    }

    function stop() {
        audioState.isRunning = false;

        // Stop all voices
        for (const voice of audioState.activeVoices.values()) {
            releaseVoice(voice);
        }

        console.log('Audio stopped');
    }

    async function suspend() {
        if (audioState.ctx) {
            await audioState.ctx.suspend();
            audioState.isSuspended = true;
        }
    }

    async function resume() {
        if (audioState.ctx) {
            await audioState.ctx.resume();
            audioState.isSuspended = false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOICE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    function createVoice(type = 'synth', options = {}) {
        const ctx = audioState.ctx;
        if (!ctx) {
            console.error('Cannot create voice: Audio context not available');
            return null;
        }

        const voice = {
            id: audioState.voiceCount++,
            type,
            isActive: true,
            startTime: ctx.currentTime,

            // Nodes
            oscillators: [],
            filter: null,
            envelope: null,
            output: null,
        };

        // Create based on type
        switch (type) {
            case 'sine':
            case 'square':
            case 'sawtooth':
            case 'triangle':
                createBasicVoice(voice, type, options);
                break;

            case 'supersaw':
                createSupersawVoice(voice, options);
                break;

            case 'noise':
                createNoiseVoice(voice, options);
                break;

            case 'formant':
                createFormantVoice(voice, options);
                break;

            default:
                createBasicVoice(voice, 'sine', options);
        }

        audioState.activeVoices.set(voice.id, voice);
        return voice;
    }

    function createBasicVoice(voice, waveform, options) {
        const ctx = audioState.ctx;
        const {
            freq = 440,
            detune = 0,
            volume = 0.5,
            attack = 0.01,
            decay = 0.1,
            sustain = 0.7,
            release = 0.3,
            filterFreq = 5000,
            filterQ = 1,
            channel = 'synth',
        } = options;

        // Oscillator
        const osc = ctx.createOscillator();
        osc.type = waveform;
        osc.frequency.value = freq;
        osc.detune.value = detune;

        // Filter
        voice.filter = ctx.createBiquadFilter();
        voice.filter.type = 'lowpass';
        voice.filter.frequency.value = filterFreq;
        voice.filter.Q.value = filterQ;

        // Envelope
        voice.envelope = ctx.createGain();
        voice.envelope.gain.value = 0;

        // Apply ADSR
        const now = ctx.currentTime;
        voice.envelope.gain.setValueAtTime(0, now);
        voice.envelope.gain.linearRampToValueAtTime(volume, now + attack);
        voice.envelope.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);

        // Output gain
        voice.output = ctx.createGain();
        voice.output.gain.value = 1;

        // Connect
        osc.connect(voice.filter);
        voice.filter.connect(voice.envelope);
        voice.envelope.connect(voice.output);
        voice.output.connect(audioState.channels[channel] || audioState.channels.synth);

        // Connect to effects
        voice.output.connect(audioState.reverbSend);
        voice.output.connect(audioState.delaySend);

        osc.start();
        voice.oscillators.push(osc);

        // Store ADSR for release
        voice.adsr = { attack, decay, sustain, release };
        voice.volume = volume;
    }

    function createSupersawVoice(voice, options) {
        const ctx = audioState.ctx;
        const {
            freq = 440,
            voices = 7,
            detune = 15,
            volume = 0.4,
            attack = 0.05,
            decay = 0.2,
            sustain = 0.6,
            release = 0.5,
            filterFreq = 3000,
            filterQ = 0.5,
            channel = 'synth',
        } = options;

        // Create multiple detuned oscillators
        const detuneSpread = [-1, -0.67, -0.33, 0, 0.33, 0.67, 1].slice(0, voices);

        voice.filter = ctx.createBiquadFilter();
        voice.filter.type = 'lowpass';
        voice.filter.frequency.value = filterFreq;
        voice.filter.Q.value = filterQ;

        voice.envelope = ctx.createGain();
        voice.envelope.gain.value = 0;

        voice.output = ctx.createGain();
        voice.output.gain.value = 1;

        for (let i = 0; i < voices; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = detuneSpread[i] * detune;

            const oscGain = ctx.createGain();
            oscGain.gain.value = 1 / voices;

            osc.connect(oscGain);
            oscGain.connect(voice.filter);

            osc.start();
            voice.oscillators.push(osc);
        }

        voice.filter.connect(voice.envelope);
        voice.envelope.connect(voice.output);
        voice.output.connect(audioState.channels[channel] || audioState.channels.synth);
        voice.output.connect(audioState.reverbSend);

        // Apply ADSR
        const now = ctx.currentTime;
        voice.envelope.gain.setValueAtTime(0, now);
        voice.envelope.gain.linearRampToValueAtTime(volume, now + attack);
        voice.envelope.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);

        voice.adsr = { attack, decay, sustain, release };
        voice.volume = volume;
    }

    function createNoiseVoice(voice, options) {
        const ctx = audioState.ctx;
        const {
            type = 'white',
            volume = 0.3,
            attack = 0.01,
            decay = 0.1,
            sustain = 0.5,
            release = 0.3,
            filterFreq = 5000,
            filterQ = 1,
            channel = 'fx',
        } = options;

        // Create noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'white') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        } else if (type === 'pink') {
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            }
        } else if (type === 'brown') {
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        voice.filter = ctx.createBiquadFilter();
        voice.filter.type = 'lowpass';
        voice.filter.frequency.value = filterFreq;
        voice.filter.Q.value = filterQ;

        voice.envelope = ctx.createGain();
        voice.envelope.gain.value = 0;

        voice.output = ctx.createGain();
        voice.output.gain.value = 1;

        source.connect(voice.filter);
        voice.filter.connect(voice.envelope);
        voice.envelope.connect(voice.output);
        voice.output.connect(audioState.channels[channel] || audioState.channels.fx);

        source.start();
        voice.source = source;

        const now = ctx.currentTime;
        voice.envelope.gain.setValueAtTime(0, now);
        voice.envelope.gain.linearRampToValueAtTime(volume, now + attack);
        voice.envelope.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);

        voice.adsr = { attack, decay, sustain, release };
        voice.volume = volume;
    }

    function createFormantVoice(voice, options) {
        const ctx = audioState.ctx;
        const {
            freq = 110,
            formants = [
                { freq: 700, Q: 10, gain: 1 },
                { freq: 1200, Q: 12, gain: 0.7 },
                { freq: 2500, Q: 15, gain: 0.5 },
            ],
            volume = 0.3,
            attack = 0.1,
            decay = 0.1,
            sustain = 0.8,
            release = 0.3,
            vibrato = { rate: 5, depth: 3 },
            channel = 'leads',
        } = options;

        // Base oscillator (sawtooth for vocal-like harmonics)
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        // Vibrato LFO
        const vibLfo = ctx.createOscillator();
        vibLfo.frequency.value = vibrato.rate;
        const vibGain = ctx.createGain();
        vibGain.gain.value = vibrato.depth;
        vibLfo.connect(vibGain);
        vibGain.connect(osc.frequency);
        vibLfo.start();

        // Create formant filters
        voice.formantFilters = [];
        const merger = ctx.createGain();

        for (const f of formants) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = f.freq;
            filter.Q.value = f.Q;

            const filterGain = ctx.createGain();
            filterGain.gain.value = f.gain;

            osc.connect(filter);
            filter.connect(filterGain);
            filterGain.connect(merger);

            voice.formantFilters.push({ filter, gain: filterGain });
        }

        voice.envelope = ctx.createGain();
        voice.envelope.gain.value = 0;

        voice.output = ctx.createGain();
        voice.output.gain.value = 1;

        merger.connect(voice.envelope);
        voice.envelope.connect(voice.output);
        voice.output.connect(audioState.channels[channel] || audioState.channels.leads);
        voice.output.connect(audioState.reverbSend);

        osc.start();
        voice.oscillators.push(osc);
        voice.vibLfo = vibLfo;

        const now = ctx.currentTime;
        voice.envelope.gain.setValueAtTime(0, now);
        voice.envelope.gain.linearRampToValueAtTime(volume, now + attack);
        voice.envelope.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);

        voice.adsr = { attack, decay, sustain, release };
        voice.volume = volume;
    }

    function releaseVoice(voice) {
        if (!voice || !voice.isActive) return;

        const ctx = audioState.ctx;
        const now = ctx.currentTime;
        const release = voice.adsr?.release || 0.3;

        voice.isActive = false;

        // Release envelope
        if (voice.envelope) {
            voice.envelope.gain.cancelScheduledValues(now);
            voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, now);
            voice.envelope.gain.linearRampToValueAtTime(0, now + release);
        }

        // Schedule cleanup
        setTimeout(() => {
            cleanupVoice(voice);
        }, release * 1000 + 100);
    }

    function cleanupVoice(voice) {
        // Stop oscillators
        for (const osc of voice.oscillators) {
            try { osc.stop(); } catch (e) {}
            try { osc.disconnect(); } catch (e) {}
        }

        // Stop noise source
        if (voice.source) {
            try { voice.source.stop(); } catch (e) {}
            try { voice.source.disconnect(); } catch (e) {}
        }

        // Stop LFOs
        if (voice.vibLfo) {
            try { voice.vibLfo.stop(); } catch (e) {}
        }

        // Disconnect nodes
        if (voice.filter) try { voice.filter.disconnect(); } catch (e) {}
        if (voice.envelope) try { voice.envelope.disconnect(); } catch (e) {}
        if (voice.output) try { voice.output.disconnect(); } catch (e) {}

        // Remove from active voices
        audioState.activeVoices.delete(voice.id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HIGH-LEVEL SOUND API
    // ═══════════════════════════════════════════════════════════════════════

    function playTone(freq, duration = 1, options = {}) {
        if (!audioState.isInitialized || !audioState.ctx) {
            console.error('Audio not initialized');
            return null;
        }

        console.log('playTone called:', freq, 'Hz, duration:', duration, 'options:', options);

        const voice = createVoice(options.waveform || 'sine', {
            freq,
            ...options,
        });

        if (!voice) {
            console.error('Failed to create voice');
            return null;
        }

        console.log('Voice created successfully, id:', voice.id);

        if (duration > 0) {
            setTimeout(() => releaseVoice(voice), duration * 1000);
        }

        return voice;
    }

    function playChord(rootFreq, intervals = [0, 4, 7], duration = 2, options = {}) {
        const voices = [];

        for (const interval of intervals) {
            const freq = rootFreq * Math.pow(2, interval / 12);
            const voice = createVoice(options.waveform || 'sine', {
                freq,
                volume: (options.volume || 0.3) / intervals.length,
                ...options,
            });
            voices.push(voice);
        }

        if (duration > 0) {
            setTimeout(() => {
                for (const voice of voices) {
                    releaseVoice(voice);
                }
            }, duration * 1000);
        }

        return voices;
    }

    function playScale(rootFreq, scale = 'pentatonic', direction = 'up', options = {}) {
        const intervals = SCALES[scale] || SCALES.pentatonic;
        const notes = direction === 'up' ? intervals : [...intervals].reverse();

        const {
            duration = 0.2,
            gap = 0.05,
        } = options;

        notes.forEach((interval, i) => {
            setTimeout(() => {
                const freq = rootFreq * Math.pow(2, interval / 12);
                playTone(freq, duration, options);
            }, i * (duration + gap) * 1000);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function midiToFreq(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    function freqToMidi(freq) {
        return Math.round(12 * Math.log2(freq / 440) + 69);
    }

    function noteNameToFreq(noteName) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const match = noteName.match(/^([A-G]#?)(\d+)$/);
        if (!match) return 440;

        const note = match[1];
        const octave = parseInt(match[2]);
        const noteIndex = notes.indexOf(note);
        const midiNote = (octave + 1) * 12 + noteIndex;

        return midiToFreq(midiNote);
    }

    function beatsToSeconds(beats) {
        return beats * (60 / audioState.bpm);
    }

    function secondsToBeats(seconds) {
        return seconds * (audioState.bpm / 60);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PARAMETER SETTERS
    // ═══════════════════════════════════════════════════════════════════════

    function setMasterVolume(volume, rampTime = 0.05) {
        audioState.masterVolume = Math.max(0, Math.min(1, volume));
        if (audioState.masterGain) {
            const now = audioState.ctx.currentTime;
            audioState.masterGain.gain.setTargetAtTime(audioState.masterVolume, now, rampTime);
        }
    }

    function setFilterCutoff(freq, rampTime = 0.05) {
        audioState.filterCutoff = Math.max(20, Math.min(20000, freq));
        if (audioState.masterFilter) {
            const now = audioState.ctx.currentTime;
            audioState.masterFilter.frequency.setTargetAtTime(audioState.filterCutoff, now, rampTime);
        }
    }

    function setFilterResonance(q, rampTime = 0.05) {
        audioState.filterResonance = Math.max(0.1, Math.min(20, q));
        if (audioState.masterFilter) {
            const now = audioState.ctx.currentTime;
            audioState.masterFilter.Q.setTargetAtTime(audioState.filterResonance, now, rampTime);
        }
    }

    function setReverbMix(mix, rampTime = 0.1) {
        audioState.reverbMix = Math.max(0, Math.min(1, mix));
        if (audioState.reverbGain) {
            const now = audioState.ctx.currentTime;
            audioState.reverbGain.gain.setTargetAtTime(audioState.reverbMix, now, rampTime);
        }
    }

    function setDelayMix(mix, rampTime = 0.1) {
        audioState.delayMix = Math.max(0, Math.min(1, mix));
        if (audioState.delayGain) {
            const now = audioState.ctx.currentTime;
            audioState.delayGain.gain.setTargetAtTime(audioState.delayMix, now, rampTime);
        }
    }

    function setDelayTime(time, rampTime = 0.1) {
        audioState.delayTime = Math.max(0.01, Math.min(2, time));
        if (audioState.delay) {
            const now = audioState.ctx.currentTime;
            audioState.delay.delayTime.setTargetAtTime(audioState.delayTime, now, rampTime);
        }
    }

    function setBpm(bpm) {
        audioState.bpm = Math.max(40, Math.min(200, bpm));

        // Update delay time to match tempo (dotted 8th)
        const beatTime = 60 / audioState.bpm;
        setDelayTime(beatTime * 0.75);
    }

    function setChannelVolume(channel, volume, rampTime = 0.05) {
        if (audioState.channels[channel]) {
            const now = audioState.ctx.currentTime;
            audioState.channels[channel].gain.setTargetAtTime(volume, now, rampTime);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════

    function getFrequencyData() {
        if (!audioState.analyser) return null;
        audioState.analyser.getByteFrequencyData(audioState.frequencyData);
        return audioState.frequencyData;
    }

    function getWaveformData() {
        if (!audioState.analyser) return null;
        audioState.analyser.getByteTimeDomainData(audioState.waveformData);
        return audioState.waveformData;
    }

    function getAverageLevel() {
        const data = getFrequencyData();
        if (!data) return 0;

        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum / (data.length * 255);
    }

    function getBassLevel() {
        const data = getFrequencyData();
        if (!data) return 0;

        // Bass is roughly first 5% of frequency bins
        const bassEnd = Math.floor(data.length * 0.05);
        let sum = 0;
        for (let i = 0; i < bassEnd; i++) {
            sum += data[i];
        }
        return sum / (bassEnd * 255);
    }

    function getMidLevel() {
        const data = getFrequencyData();
        if (!data) return 0;

        // Mids are roughly 5-30% of frequency bins
        const midStart = Math.floor(data.length * 0.05);
        const midEnd = Math.floor(data.length * 0.3);
        let sum = 0;
        for (let i = midStart; i < midEnd; i++) {
            sum += data[i];
        }
        return sum / ((midEnd - midStart) * 255);
    }

    function getHighLevel() {
        const data = getFrequencyData();
        if (!data) return 0;

        // Highs are roughly 30-100% of frequency bins
        const highStart = Math.floor(data.length * 0.3);
        let sum = 0;
        for (let i = highStart; i < data.length; i++) {
            sum += data[i];
        }
        return sum / ((data.length - highStart) * 255);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIDECHAIN
    // ═══════════════════════════════════════════════════════════════════════

    function enableSidechain(targets = []) {
        audioState.sidechainActive = true;
        audioState.sidechainTargets = targets.map(name =>
            audioState.channels[name]
        ).filter(Boolean);
    }

    function disableSidechain() {
        audioState.sidechainActive = false;
        audioState.sidechainTargets = [];

        // Reset gains
        for (const target of audioState.sidechainTargets) {
            if (target.gain) {
                target.gain.setValueAtTime(1, audioState.ctx.currentTime);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Constants
        CONSTANTS,
        SCALES,
        CHORDS,

        // Initialization
        init,

        // Playback
        start,
        stop,
        suspend,
        resume,

        // Voices
        createVoice,
        releaseVoice,

        // High-level
        playTone,
        playChord,
        playScale,

        // Parameters
        setMasterVolume,
        setFilterCutoff,
        setFilterResonance,
        setReverbMix,
        setDelayMix,
        setDelayTime,
        setBpm,
        setChannelVolume,

        // Sidechain
        enableSidechain,
        disableSidechain,

        // Analysis
        getFrequencyData,
        getWaveformData,
        getAverageLevel,
        getBassLevel,
        getMidLevel,
        getHighLevel,

        // Utilities
        midiToFreq,
        freqToMidi,
        noteNameToFreq,
        beatsToSeconds,
        secondsToBeats,

        // State access
        get context() { return audioState.ctx; },
        get isInitialized() { return audioState.isInitialized; },
        get isRunning() { return audioState.isRunning; },
        get bpm() { return audioState.bpm; },
        get currentBeat() { return audioState.currentBeat; },
        get currentBar() { return audioState.currentBar; },
        get channels() { return audioState.channels; },
        get state() { return audioState; },
    });
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpAudio;
}
