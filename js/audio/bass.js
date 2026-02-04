// ═══════════════════════════════════════════════════════════════════════════
// GUMP BASS SYNTHESIS
// ═══════════════════════════════════════════════════════════════════════════
//
// Deep, rich bass synthesis including:
// - 808 bass (sustained, gliding)
// - Sub bass (pure sine)
// - Synth bass (saw, square)
// - Reese bass (detuned saws)
// - FM bass
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpBass = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // BASS CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const BASS_TYPES = {
        SUB: 'sub',
        BASS_808: '808',
        BASS_808_LONG: '808_long',
        BASS_808_SLIDE: '808_slide',
        SAW: 'saw',
        SQUARE: 'square',
        REESE: 'reese',
        FM: 'fm',
        WOBBLE: 'wobble',
        PLUCK: 'pluck',
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BASS STATE
    // ═══════════════════════════════════════════════════════════════════════

    const bassState = {
        ctx: null,
        output: null,

        // Active bass notes
        activeNotes: new Map(),

        // Current parameters
        currentFreq: 55,
        glideTime: 0.1,
        volume: 0.7,

        // Distortion
        distortion: null,
        distortionAmount: 0.2,

        // Filter
        filter: null,
        filterFreq: 500,
        filterQ: 2,

        // LFO for wobble
        lfo: null,
        lfoGain: null,
        lfoRate: 4,
        lfoDepth: 0.5,

        // Mono mode
        monoMode: true,
        lastNote: null,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(audioContext, outputNode) {
        bassState.ctx = audioContext;
        bassState.output = outputNode || audioContext.destination;

        // Create shared distortion
        bassState.distortion = createDistortion(bassState.distortionAmount);

        // Create shared filter
        bassState.filter = audioContext.createBiquadFilter();
        bassState.filter.type = 'lowpass';
        bassState.filter.frequency.value = bassState.filterFreq;
        bassState.filter.Q.value = bassState.filterQ;

        // Create LFO for wobble effects
        bassState.lfo = audioContext.createOscillator();
        bassState.lfo.type = 'sine';
        bassState.lfo.frequency.value = bassState.lfoRate;

        bassState.lfoGain = audioContext.createGain();
        bassState.lfoGain.gain.value = 0;  // Off by default

        bassState.lfo.connect(bassState.lfoGain);
        bassState.lfo.start();

        console.log('Bass synthesis initialized');
    }

    function createDistortion(amount = 0.2) {
        const ctx = bassState.ctx;
        const waveshaper = ctx.createWaveShaper();
        waveshaper.curve = makeDistortionCurve(amount * 400);
        waveshaper.oversample = '4x';
        return waveshaper;
    }

    function makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) /
                       (Math.PI + amount * Math.abs(x));
        }

        return curve;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUB BASS
    // ═══════════════════════════════════════════════════════════════════════

    function playSubBass(options = {}) {
        const ctx = bassState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 55,
            volume = 0.7,
            attack = 0.01,
            decay = 0.1,
            sustain = 0.8,
            release = 0.3,
            duration = null,  // null = sustain until release
            time = now,
        } = options;

        // Stop previous note in mono mode
        if (bassState.monoMode && bassState.lastNote) {
            releaseNote(bassState.lastNote);
        }

        // Create oscillator
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        // Create gain for envelope
        const envelope = ctx.createGain();
        envelope.gain.value = 0;

        // Apply ADSR
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volume, time + attack);
        envelope.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);

        // Low pass filter to ensure pure sub
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 100;
        filter.Q.value = 0.7;

        // Connect
        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(bassState.output);

        osc.start(time);

        const note = {
            id: Date.now(),
            type: 'sub',
            osc,
            envelope,
            filter,
            freq,
            volume,
            adsr: { attack, decay, sustain, release },
            startTime: time,
        };

        bassState.activeNotes.set(note.id, note);
        bassState.lastNote = note;
        bassState.currentFreq = freq;

        // Auto-release if duration specified
        if (duration) {
            setTimeout(() => releaseNote(note), duration * 1000);
        }

        return note;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 808 BASS
    // ═══════════════════════════════════════════════════════════════════════

    function play808Bass(options = {}) {
        const ctx = bassState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 55,
            volume = 0.8,
            pitchDecay = 0.15,
            pitchAmount = 0.5,      // Octaves
            attack = 0.005,
            decay = 0.2,
            sustain = 0.6,
            release = 0.4,
            distortion = 0.2,
            filterFreq = 200,
            duration = null,
            time = now,
        } = options;

        // Stop previous note in mono mode
        if (bassState.monoMode && bassState.lastNote) {
            releaseNote(bassState.lastNote);
        }

        // Main oscillator with pitch envelope
        const osc = ctx.createOscillator();
        osc.type = 'sine';

        const startFreq = freq * Math.pow(2, pitchAmount);
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + pitchDecay);

        // Sub oscillator (one octave down)
        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.value = freq * 0.5;

        const subGain = ctx.createGain();
        subGain.gain.value = 0.4;

        // Harmonic oscillator (for presence)
        const harmOsc = ctx.createOscillator();
        harmOsc.type = 'triangle';
        harmOsc.frequency.value = freq;

        const harmGain = ctx.createGain();
        harmGain.gain.value = 0.15;

        // Main envelope
        const envelope = ctx.createGain();
        envelope.gain.value = 0;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volume, time + attack);
        envelope.gain.setValueAtTime(volume, time + attack);
        envelope.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);

        // Distortion
        const dist = createDistortion(distortion);

        // Filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 1;

        // Output gain
        const output = ctx.createGain();
        output.gain.value = 1;

        // Connect main path through distortion
        osc.connect(dist);
        dist.connect(filter);
        filter.connect(envelope);

        // Connect sub directly (clean)
        subOsc.connect(subGain);
        subGain.connect(envelope);

        // Connect harmonic through filter
        harmOsc.connect(harmGain);
        harmGain.connect(filter);

        envelope.connect(output);
        output.connect(bassState.output);

        // Start oscillators
        osc.start(time);
        subOsc.start(time);
        harmOsc.start(time);

        const note = {
            id: Date.now(),
            type: '808',
            osc,
            subOsc,
            harmOsc,
            envelope,
            filter,
            output,
            freq,
            volume,
            adsr: { attack, decay, sustain, release },
            startTime: time,
        };

        bassState.activeNotes.set(note.id, note);
        bassState.lastNote = note;
        bassState.currentFreq = freq;

        if (duration) {
            setTimeout(() => releaseNote(note), duration * 1000);
        }

        return note;
    }

    function play808Long(options = {}) {
        return play808Bass({
            ...options,
            decay: 0.5,
            sustain: 0.8,
            release: 1.0,
            pitchDecay: 0.2,
        });
    }

    function play808Slide(options = {}) {
        const note = play808Bass(options);

        // Enable glide to next note
        note.glide = true;
        note.glideTime = options.glideTime || bassState.glideTime;

        return note;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SAW BASS
    // ═══════════════════════════════════════════════════════════════════════

    function playSawBass(options = {}) {
        const ctx = bassState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 55,
            volume = 0.6,
            attack = 0.01,
            decay = 0.15,
            sustain = 0.7,
            release = 0.2,
            filterFreq = 800,
            filterEnvAmount = 2000,
            filterDecay = 0.2,
            duration = null,
            time = now,
        } = options;

        if (bassState.monoMode && bassState.lastNote) {
            releaseNote(bassState.lastNote);
        }

        // Main saw oscillator
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        // Sub oscillator
        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.value = freq * 0.5;

        const subGain = ctx.createGain();
        subGain.gain.value = 0.3;

        // Filter with envelope
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq + filterEnvAmount, time);
        filter.frequency.exponentialRampToValueAtTime(filterFreq, time + filterDecay);
        filter.Q.value = 3;

        // Amplitude envelope
        const envelope = ctx.createGain();
        envelope.gain.value = 0;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volume, time + attack);
        envelope.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);

        // Connect
        osc.connect(filter);
        subOsc.connect(subGain);
        subGain.connect(filter);
        filter.connect(envelope);
        envelope.connect(bassState.output);

        osc.start(time);
        subOsc.start(time);

        const note = {
            id: Date.now(),
            type: 'saw',
            osc,
            subOsc,
            filter,
            envelope,
            freq,
            volume,
            adsr: { attack, decay, sustain, release },
            startTime: time,
        };

        bassState.activeNotes.set(note.id, note);
        bassState.lastNote = note;
        bassState.currentFreq = freq;

        if (duration) {
            setTimeout(() => releaseNote(note), duration * 1000);
        }

        return note;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SQUARE BASS
    // ═══════════════════════════════════════════════════════════════════════

    function playSquareBass(options = {}) {
        const ctx = bassState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 55,
            volume = 0.5,
            pulseWidth = 0.5,  // 0.5 = square
            attack = 0.01,
            decay = 0.1,
            sustain = 0.8,
            release = 0.15,
            filterFreq = 600,
            duration = null,
            time = now,
        } = options;

        if (bassState.monoMode && bassState.lastNote) {
            releaseNote(bassState.lastNote);
        }

        // Use two saws to create pulse width
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = freq;

        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.value = freq;

        // Phase offset for pulse width
        const phaseDelay = ctx.createDelay();
        phaseDelay.delayTime.value = (1 / freq) * pulseWidth;

        const inverter = ctx.createGain();
        inverter.gain.value = -1;

        // Filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 2;

        // Envelope
        const envelope = ctx.createGain();
        envelope.gain.value = 0;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volume, time + attack);
        envelope.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);

        // Connect
        osc1.connect(filter);
        osc2.connect(phaseDelay);
        phaseDelay.connect(inverter);
        inverter.connect(filter);
        filter.connect(envelope);
        envelope.connect(bassState.output);

        osc1.start(time);
        osc2.start(time);

        const note = {
            id: Date.now(),
            type: 'square',
            osc: osc1,
            osc2,
            filter,
            envelope,
            freq,
            volume,
            adsr: { attack, decay, sustain, release },
            startTime: time,
        };

        bassState.activeNotes.set(note.id, note);
        bassState.lastNote = note;
        bassState.currentFreq = freq;

        if (duration) {
            setTimeout(() => releaseNote(note), duration * 1000);
        }

        return note;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REESE BASS
    // ═══════════════════════════════════════════════════════════════════════

    function playReeseBass(options = {}) {
        const ctx = bassState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 55,
            volume = 0.6,
            detune = 15,          // Cents
            voices = 2,
            attack = 0.02,
            decay = 0.1,
            sustain = 0.9,
            release = 0.3,
            filterFreq = 400,
            filterLfoRate = 0.5,
            filterLfoDepth = 200,
            duration = null,
            time = now,
        } = options;

        if (bassState.monoMode && bassState.lastNote) {
            releaseNote(bassState.lastNote);
        }

        const oscillators = [];
        const detuneValues = [-detune, detune];

        // Create detuned oscillators
        for (let i = 0; i < voices; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = detuneValues[i % detuneValues.length];
            oscillators.push(osc);
        }

        // Mixer for oscillators
        const mixer = ctx.createGain();
        mixer.gain.value = 1 / voices;

        // Filter with LFO
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 4;

        // Filter LFO
        const filterLfo = ctx.createOscillator();
        filterLfo.type = 'sine';
        filterLfo.frequency.value = filterLfoRate;

        const filterLfoGain = ctx.createGain();
        filterLfoGain.gain.value = filterLfoDepth;

        filterLfo.connect(filterLfoGain);
        filterLfoGain.connect(filter.frequency);
        filterLfo.start(time);

        // Envelope
        const envelope = ctx.createGain();
        envelope.gain.value = 0;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volume, time + attack);
        envelope.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);

        // Connect oscillators
        for (const osc of oscillators) {
            osc.connect(mixer);
            osc.start(time);
        }

        mixer.connect(filter);
        filter.connect(envelope);
        envelope.connect(bassState.output);

        const note = {
            id: Date.now(),
            type: 'reese',
            oscillators,
            filterLfo,
            filter,
            envelope,
            freq,
            volume,
            adsr: { attack, decay, sustain, release },
            startTime: time,
        };

        bassState.activeNotes.set(note.id, note);
        bassState.lastNote = note;
        bassState.currentFreq = freq;

        if (duration) {
            setTimeout(() => releaseNote(note), duration * 1000);
        }

        return note;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FM BASS
    // ═══════════════════════════════════════════════════════════════════════

    function playFMBass(options = {}) {
        const ctx = bassState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 55,
            volume = 0.6,
            modulationRatio = 2,
            modulationIndex = 3,
            attack = 0.01,
            decay = 0.2,
            sustain = 0.6,
            release = 0.2,
            modDecay = 0.3,
            duration = null,
            time = now,
        } = options;

        if (bassState.monoMode && bassState.lastNote) {
            releaseNote(bassState.lastNote);
        }

        // Carrier oscillator
        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.value = freq;

        // Modulator oscillator
        const modulator = ctx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = freq * modulationRatio;

        // Modulation depth with envelope
        const modGain = ctx.createGain();
        const modAmount = freq * modulationIndex;
        modGain.gain.setValueAtTime(modAmount, time);
        modGain.gain.exponentialRampToValueAtTime(modAmount * 0.1, time + modDecay);

        // Connect modulator to carrier frequency
        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        // Amplitude envelope
        const envelope = ctx.createGain();
        envelope.gain.value = 0;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volume, time + attack);
        envelope.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);

        // Low pass filter to tame high frequencies
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.7;

        // Connect
        carrier.connect(filter);
        filter.connect(envelope);
        envelope.connect(bassState.output);

        carrier.start(time);
        modulator.start(time);

        const note = {
            id: Date.now(),
            type: 'fm',
            carrier,
            modulator,
            modGain,
            filter,
            envelope,
            freq,
            volume,
            adsr: { attack, decay, sustain, release },
            startTime: time,
        };

        bassState.activeNotes.set(note.id, note);
        bassState.lastNote = note;
        bassState.currentFreq = freq;

        if (duration) {
            setTimeout(() => releaseNote(note), duration * 1000);
        }

        return note;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WOBBLE BASS
    // ═══════════════════════════════════════════════════════════════════════

    function playWobbleBass(options = {}) {
        const ctx = bassState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 55,
            volume = 0.7,
            wobbleRate = 4,        // Hz
            wobbleDepth = 0.8,     // 0-1
            attack = 0.01,
            decay = 0.1,
            sustain = 0.9,
            release = 0.2,
            filterFreq = 300,
            filterRange = 2000,
            duration = null,
            time = now,
        } = options;

        if (bassState.monoMode && bassState.lastNote) {
            releaseNote(bassState.lastNote);
        }

        // Main oscillator (saw for rich harmonics)
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        // Sub oscillator
        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.value = freq * 0.5;

        const subGain = ctx.createGain();
        subGain.gain.value = 0.4;

        // Wobble LFO
        const wobbleLfo = ctx.createOscillator();
        wobbleLfo.type = 'sine';
        wobbleLfo.frequency.value = wobbleRate;

        const wobbleLfoGain = ctx.createGain();
        wobbleLfoGain.gain.value = filterRange * wobbleDepth;

        // Filter (target of LFO)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 8;  // High resonance for wobble

        wobbleLfo.connect(wobbleLfoGain);
        wobbleLfoGain.connect(filter.frequency);

        // Amplitude envelope
        const envelope = ctx.createGain();
        envelope.gain.value = 0;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volume, time + attack);
        envelope.gain.linearRampToValueAtTime(volume * sustain, time + attack + decay);

        // Connect
        osc.connect(filter);
        subOsc.connect(subGain);
        subGain.connect(filter);
        filter.connect(envelope);
        envelope.connect(bassState.output);

        osc.start(time);
        subOsc.start(time);
        wobbleLfo.start(time);

        const note = {
            id: Date.now(),
            type: 'wobble',
            osc,
            subOsc,
            wobbleLfo,
            filter,
            envelope,
            freq,
            volume,
            adsr: { attack, decay, sustain, release },
            startTime: time,
        };

        bassState.activeNotes.set(note.id, note);
        bassState.lastNote = note;
        bassState.currentFreq = freq;

        if (duration) {
            setTimeout(() => releaseNote(note), duration * 1000);
        }

        return note;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PLUCK BASS
    // ═══════════════════════════════════════════════════════════════════════

    function playPluckBass(options = {}) {
        const ctx = bassState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 55,
            volume = 0.7,
            attack = 0.005,
            decay = 0.4,
            filterDecay = 0.15,
            filterStart = 3000,
            filterEnd = 200,
            duration = null,
            time = now,
        } = options;

        if (bassState.monoMode && bassState.lastNote) {
            releaseNote(bassState.lastNote);
        }

        // Main oscillator
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        // Filter with fast decay
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterStart, time);
        filter.frequency.exponentialRampToValueAtTime(filterEnd, time + filterDecay);
        filter.Q.value = 2;

        // Amplitude envelope (fast decay)
        const envelope = ctx.createGain();
        envelope.gain.value = 0;
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(volume, time + attack);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + decay);

        // Connect
        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(bassState.output);

        osc.start(time);
        osc.stop(time + decay + 0.1);

        const note = {
            id: Date.now(),
            type: 'pluck',
            osc,
            filter,
            envelope,
            freq,
            volume,
            adsr: { attack, decay, sustain: 0, release: 0 },
            startTime: time,
            autoRelease: true,
        };

        bassState.activeNotes.set(note.id, note);
        bassState.currentFreq = freq;

        // Auto cleanup
        setTimeout(() => {
            bassState.activeNotes.delete(note.id);
        }, decay * 1000 + 200);

        return note;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NOTE CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function releaseNote(note) {
        if (!note) return;

        const ctx = bassState.ctx;
        const now = ctx.currentTime;
        const release = note.adsr?.release || 0.2;

        // Apply release envelope
        if (note.envelope) {
            note.envelope.gain.cancelScheduledValues(now);
            note.envelope.gain.setValueAtTime(note.envelope.gain.value, now);
            note.envelope.gain.exponentialRampToValueAtTime(0.001, now + release);
        }

        // Stop oscillators after release
        const stopTime = now + release + 0.1;

        if (note.osc) {
            try { note.osc.stop(stopTime); } catch (e) {}
        }
        if (note.osc2) {
            try { note.osc2.stop(stopTime); } catch (e) {}
        }
        if (note.subOsc) {
            try { note.subOsc.stop(stopTime); } catch (e) {}
        }
        if (note.harmOsc) {
            try { note.harmOsc.stop(stopTime); } catch (e) {}
        }
        if (note.carrier) {
            try { note.carrier.stop(stopTime); } catch (e) {}
        }
        if (note.modulator) {
            try { note.modulator.stop(stopTime); } catch (e) {}
        }
        if (note.wobbleLfo) {
            try { note.wobbleLfo.stop(stopTime); } catch (e) {}
        }
        if (note.filterLfo) {
            try { note.filterLfo.stop(stopTime); } catch (e) {}
        }
        if (note.oscillators) {
            for (const osc of note.oscillators) {
                try { osc.stop(stopTime); } catch (e) {}
            }
        }

        // Schedule cleanup
        setTimeout(() => {
            cleanupNote(note);
        }, release * 1000 + 200);

        // Remove from active notes
        bassState.activeNotes.delete(note.id);

        if (bassState.lastNote === note) {
            bassState.lastNote = null;
        }
    }

    function cleanupNote(note) {
        // Disconnect all nodes
        const nodes = [
            note.osc, note.osc2, note.subOsc, note.harmOsc,
            note.carrier, note.modulator, note.wobbleLfo, note.filterLfo,
            note.filter, note.envelope, note.output, note.modGain,
        ];

        for (const node of nodes) {
            if (node) {
                try { node.disconnect(); } catch (e) {}
            }
        }

        if (note.oscillators) {
            for (const osc of note.oscillators) {
                try { osc.disconnect(); } catch (e) {}
            }
        }
    }

    function glideToFreq(freq, time = null) {
        const ctx = bassState.ctx;
        const now = time || ctx.currentTime;
        const glideTime = bassState.glideTime;

        if (bassState.lastNote) {
            const note = bassState.lastNote;

            // Glide main oscillator
            if (note.osc) {
                note.osc.frequency.setValueAtTime(note.osc.frequency.value, now);
                note.osc.frequency.exponentialRampToValueAtTime(freq, now + glideTime);
            }

            // Glide sub oscillator
            if (note.subOsc) {
                note.subOsc.frequency.setValueAtTime(note.subOsc.frequency.value, now);
                note.subOsc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + glideTime);
            }

            // Glide all oscillators (for reese, etc.)
            if (note.oscillators) {
                for (const osc of note.oscillators) {
                    osc.frequency.setValueAtTime(osc.frequency.value, now);
                    osc.frequency.exponentialRampToValueAtTime(freq, now + glideTime);
                }
            }

            bassState.currentFreq = freq;
        }
    }

    function stopAll() {
        for (const note of bassState.activeNotes.values()) {
            releaseNote(note);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UNIFIED PLAY FUNCTION
    // ═══════════════════════════════════════════════════════════════════════

    function play(bassType, options = {}) {
        switch (bassType) {
            case BASS_TYPES.SUB:
                return playSubBass(options);
            case BASS_TYPES.BASS_808:
                return play808Bass(options);
            case BASS_TYPES.BASS_808_LONG:
                return play808Long(options);
            case BASS_TYPES.BASS_808_SLIDE:
                return play808Slide(options);
            case BASS_TYPES.SAW:
                return playSawBass(options);
            case BASS_TYPES.SQUARE:
                return playSquareBass(options);
            case BASS_TYPES.REESE:
                return playReeseBass(options);
            case BASS_TYPES.FM:
                return playFMBass(options);
            case BASS_TYPES.WOBBLE:
                return playWobbleBass(options);
            case BASS_TYPES.PLUCK:
                return playPluckBass(options);
            default:
                console.warn(`Unknown bass type: ${bassType}`);
                return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PARAMETER CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function setGlideTime(time) {
        bassState.glideTime = Math.max(0.01, Math.min(1, time));
    }

    function setMonoMode(enabled) {
        bassState.monoMode = enabled;
    }

    function setDistortion(amount) {
        bassState.distortionAmount = Math.max(0, Math.min(1, amount));
        bassState.distortion = createDistortion(bassState.distortionAmount);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Constants
        TYPES: BASS_TYPES,

        // Init
        init,

        // Individual synths
        playSubBass,
        play808Bass,
        play808Long,
        play808Slide,
        playSawBass,
        playSquareBass,
        playReeseBass,
        playFMBass,
        playWobbleBass,
        playPluckBass,

        // Unified
        play,

        // Control
        releaseNote,
        glideToFreq,
        stopAll,
        setGlideTime,
        setMonoMode,
        setDistortion,

        // State
        get currentFreq() { return bassState.currentFreq; },
        get lastNote() { return bassState.lastNote; },
        get activeNotes() { return bassState.activeNotes; },
        get state() { return bassState; },
    });
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpBass;
}
