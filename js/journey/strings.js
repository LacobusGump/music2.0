/**
 * GUMP Strings Engine v2
 *
 * Ethereal, expressive string orchestra.
 * Every gesture shapes the sound.
 *
 * Position X = Section (bass → violin)
 * Position Y = Dynamics (soft → loud)
 * Velocity = Articulation (legato → staccato)
 * Tilt = Expression (vibrato, swell, pan)
 */

const GumpStrings = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let reverbSend = null;
    let reverbReturn = null;

    const voices = new Map();
    let voiceId = 0;

    // Instrument definitions with more character
    const INSTRUMENTS = {
        bass: {
            name: 'Contrabass',
            range: [41, 247],      // E1 to B3
            baseOctave: 2,
            formants: [80, 250, 600],
            brightness: 0.25,
            attack: 0.15,
            body: 0.9
        },
        cello: {
            name: 'Cello',
            range: [65, 523],      // C2 to C5
            baseOctave: 3,
            formants: [200, 600, 1200],
            brightness: 0.4,
            attack: 0.1,
            body: 0.7
        },
        viola: {
            name: 'Viola',
            range: [131, 880],     // C3 to A5
            baseOctave: 4,
            formants: [350, 900, 2000],
            brightness: 0.55,
            attack: 0.08,
            body: 0.5
        },
        violin: {
            name: 'Violin',
            range: [196, 2093],    // G3 to C7
            baseOctave: 4,
            formants: [500, 1500, 3500],
            brightness: 0.7,
            attack: 0.05,
            body: 0.3
        }
    };

    // Current musical context
    let scale = [0, 2, 4, 5, 7, 9, 11];  // Major
    let root = 220;  // A3

    // For continuous conducting
    let lastConducting = null;
    let sustainedVoices = new Map();

    function init(audioContext, destination) {
        ctx = audioContext;

        // Master gain
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.7;

        // Create lush reverb
        createReverb();

        masterGain.connect(destination || ctx.destination);

        // Subscribe to conducting events
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('conducting.start', onConductingStart);
            GumpEvents.on('conducting.move', onConductingMove);
            GumpEvents.on('conducting.update', onConductingUpdate);
            GumpEvents.on('conducting.end', onConductingEnd);
        }

        console.log('[Strings] Orchestra ready');
    }

    function createReverb() {
        // Convolution reverb with generated impulse
        const length = ctx.sampleRate * 3.5;  // 3.5 second tail
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / ctx.sampleRate;
                // Multi-stage decay for concert hall feel
                const earlyDecay = Math.exp(-t * 2) * 0.3;
                const lateDecay = Math.exp(-t * 0.8) * 0.7;
                const diffusion = (Math.random() * 2 - 1);

                data[i] = diffusion * (earlyDecay + lateDecay) *
                         (1 - Math.pow(i / length, 0.5));

                // Add some modulation for richness
                if (i > ctx.sampleRate * 0.05) {
                    data[i] *= 1 + Math.sin(i * 0.001) * 0.1;
                }
            }
        }

        const convolver = ctx.createConvolver();
        convolver.buffer = impulse;

        // Reverb send/return
        reverbSend = ctx.createGain();
        reverbSend.gain.value = 0.4;

        reverbReturn = ctx.createGain();
        reverbReturn.gain.value = 0.6;

        reverbSend.connect(convolver);
        convolver.connect(reverbReturn);
        reverbReturn.connect(masterGain);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONDUCTING RESPONSE
    // ═══════════════════════════════════════════════════════════════════════

    function onConductingStart(data) {
        const { position, expression } = data;
        lastConducting = data;

        // Start initial voice based on position
        startConductedVoice(position, expression);
    }

    function onConductingMove(data) {
        const { position, expression, gesture } = data;
        lastConducting = data;

        // Update existing voices with new expression
        updateVoicesExpression(expression);

        // Trigger new notes on significant movement
        if (expression.articulation > 0.3) {
            triggerArticulatedNote(position, expression);
        }
    }

    function onConductingUpdate(data) {
        // Continuous updates for smooth expression
        const { expression } = data;
        updateVoicesExpression(expression);
    }

    function onConductingEnd(data) {
        // Fade out sustained voices
        fadeOutAllVoices(0.8);
        lastConducting = null;
    }

    function startConductedVoice(position, expression) {
        const instrument = getInstrumentFromPosition(position.x);
        const note = getNoteFromPosition(position.y, instrument);

        playNote({
            instrument: instrument.name.toLowerCase(),
            freq: note.freq,
            dynamics: expression.dynamics,
            articulation: 0.2,  // Start legato
            vibrato: expression.vibrato,
            pan: expression.pan,
            sustain: true  // Hold until conducting ends
        });
    }

    function triggerArticulatedNote(position, expression) {
        const instrument = getInstrumentFromPosition(position.x);
        const note = getNoteFromPosition(position.y, instrument);

        // Don't trigger if too similar to recent notes
        const recentFreqs = Array.from(sustainedVoices.values()).map(v => v.freq);
        const tooSimilar = recentFreqs.some(f => Math.abs(f - note.freq) < 20);

        if (!tooSimilar) {
            playNote({
                instrument: instrument.name.toLowerCase(),
                freq: note.freq,
                dynamics: expression.dynamics,
                articulation: expression.articulation,
                vibrato: expression.vibrato,
                pan: expression.pan,
                duration: 0.3 + (1 - expression.articulation) * 1.5
            });
        }
    }

    function getInstrumentFromPosition(x) {
        // X position determines instrument section
        if (x < 0.2) return INSTRUMENTS.bass;
        if (x < 0.4) return INSTRUMENTS.cello;
        if (x < 0.65) return INSTRUMENTS.viola;
        return INSTRUMENTS.violin;
    }

    function getNoteFromPosition(y, instrument) {
        // Y position (inverted) selects note from scale
        const normalY = 1 - y;  // 0 = bottom/low, 1 = top/high

        // Map to 2 octaves of the scale
        const totalNotes = scale.length * 2;
        const noteIndex = Math.floor(normalY * totalNotes);
        const scaleNote = scale[noteIndex % scale.length];
        const octaveOffset = Math.floor(noteIndex / scale.length);

        const midiNote = scaleNote + (instrument.baseOctave + octaveOffset) * 12;
        const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

        return { freq, midiNote, scaleNote, octaveOffset };
    }

    function updateVoicesExpression(expression) {
        for (const [id, voice] of sustainedVoices) {
            if (!voice.nodes) continue;

            const now = ctx.currentTime;

            // Update vibrato
            if (voice.nodes.vibratoGain) {
                const vibratoDepth = voice.freq * 0.008 * expression.vibrato;
                voice.nodes.vibratoGain.gain.setTargetAtTime(vibratoDepth, now, 0.1);
            }

            // Update dynamics/volume
            if (voice.nodes.mainGain) {
                const targetVol = voice.baseVolume * (0.5 + expression.dynamics * 0.5);
                voice.nodes.mainGain.gain.setTargetAtTime(targetVol, now, 0.15);
            }

            // Update brightness based on swell
            if (voice.nodes.brightnessFilter) {
                const cutoff = 1000 + expression.swell * 4000 + expression.dynamics * 3000;
                voice.nodes.brightnessFilter.frequency.setTargetAtTime(cutoff, now, 0.2);
            }

            // Update pan
            if (voice.nodes.panner) {
                voice.nodes.panner.pan.setTargetAtTime(expression.pan, now, 0.1);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOICE SYNTHESIS
    // ═══════════════════════════════════════════════════════════════════════

    function playNote(options) {
        if (!ctx) return null;

        const {
            instrument = 'violin',
            freq = 440,
            dynamics = 0.5,
            articulation = 0.5,
            vibrato = 0.3,
            pan = 0,
            duration = null,
            sustain = false
        } = options;

        const inst = INSTRUMENTS[instrument] || INSTRUMENTS.violin;
        const id = ++voiceId;
        const now = ctx.currentTime;

        // === OSCILLATORS ===
        // Multiple detuned oscillators for natural chorusing
        const numOscs = 4;
        const oscs = [];
        const oscGains = [];

        for (let i = 0; i < numOscs; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            // Slight detune for natural beating (like real strings)
            const detuneCents = (i - (numOscs - 1) / 2) * 6;
            osc.detune.value = detuneCents + (Math.random() - 0.5) * 2;

            const oscGain = ctx.createGain();
            oscGain.gain.value = 0.3 / numOscs;

            osc.connect(oscGain);
            oscs.push(osc);
            oscGains.push(oscGain);
        }

        // === VIBRATO LFO ===
        const vibratoLfo = ctx.createOscillator();
        vibratoLfo.type = 'sine';
        vibratoLfo.frequency.value = 5.2 + Math.random() * 0.6;  // Natural variation

        const vibratoGain = ctx.createGain();
        vibratoGain.gain.value = freq * 0.008 * vibrato;

        vibratoLfo.connect(vibratoGain);
        oscs.forEach(osc => vibratoGain.connect(osc.frequency));

        // === BOW NOISE ===
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = freq * 3;
        noiseFilter.Q.value = 1.5;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.015 * dynamics * inst.body;

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        // === BODY RESONANCE ===
        const bodyFilter = ctx.createBiquadFilter();
        bodyFilter.type = 'peaking';
        bodyFilter.frequency.value = inst.formants[0];
        bodyFilter.Q.value = 3;
        bodyFilter.gain.value = 4;

        const bodyFilter2 = ctx.createBiquadFilter();
        bodyFilter2.type = 'peaking';
        bodyFilter2.frequency.value = inst.formants[1];
        bodyFilter2.Q.value = 2;
        bodyFilter2.gain.value = 2;

        // === BRIGHTNESS ===
        const brightnessFilter = ctx.createBiquadFilter();
        brightnessFilter.type = 'lowpass';
        brightnessFilter.frequency.value = 800 + inst.brightness * 4000 + dynamics * 3000;
        brightnessFilter.Q.value = 0.7;

        // === ENVELOPE ===
        const mainGain = ctx.createGain();
        const baseVolume = 0.18 * dynamics;
        mainGain.gain.value = 0;

        // Attack time based on articulation
        const attackTime = inst.attack + (1 - articulation) * 0.2;

        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(baseVolume, now + attackTime);

        // === PANNING ===
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;

        // === ROUTING ===
        const merger = ctx.createGain();

        oscGains.forEach(g => g.connect(bodyFilter));
        noiseGain.connect(bodyFilter);
        bodyFilter.connect(bodyFilter2);
        bodyFilter2.connect(brightnessFilter);
        brightnessFilter.connect(mainGain);
        mainGain.connect(panner);
        panner.connect(masterGain);
        panner.connect(reverbSend);  // Send to reverb

        // === START ===
        oscs.forEach(osc => osc.start(now));
        vibratoLfo.start(now);
        noise.start(now);

        // Store voice data
        const voice = {
            id,
            freq,
            baseVolume,
            instrument,
            startTime: now,
            sustain,
            nodes: {
                oscs,
                oscGains,
                vibratoLfo,
                vibratoGain,
                noise,
                noiseGain,
                bodyFilter,
                brightnessFilter,
                mainGain,
                panner
            }
        };

        voices.set(id, voice);

        if (sustain) {
            sustainedVoices.set(id, voice);
        }

        // Handle duration
        if (duration && !sustain) {
            setTimeout(() => fadeOutVoice(id, 0.3), duration * 1000);
        }

        // Register with voice manager
        if (typeof GumpVoiceManager !== 'undefined') {
            GumpVoiceManager.register(oscs[0], mainGain, {
                type: 'strings',
                zone: 'journey'
            });
        }

        return id;
    }

    function fadeOutVoice(id, fadeTime = 0.5) {
        const voice = voices.get(id);
        if (!voice || !voice.nodes) return;

        const now = ctx.currentTime;
        const { mainGain, oscs, vibratoLfo, noise } = voice.nodes;

        // Fade out
        mainGain.gain.cancelScheduledValues(now);
        mainGain.gain.setValueAtTime(mainGain.gain.value, now);
        mainGain.gain.linearRampToValueAtTime(0, now + fadeTime);

        // Cleanup after fade
        setTimeout(() => {
            try {
                oscs.forEach(osc => osc.stop());
                vibratoLfo.stop();
                noise.stop();
            } catch (e) {}

            voices.delete(id);
            sustainedVoices.delete(id);
        }, fadeTime * 1000 + 50);
    }

    function fadeOutAllVoices(fadeTime = 0.5) {
        for (const id of voices.keys()) {
            fadeOutVoice(id, fadeTime);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    function setScale(newScale, newRoot) {
        scale = newScale;
        root = newRoot;
    }

    function setReverbMix(wetAmount) {
        if (reverbSend) {
            reverbSend.gain.value = wetAmount;
        }
    }

    return Object.freeze({
        init,
        playNote,
        fadeOutVoice,
        fadeOutAllVoices,
        setScale,
        setReverbMix,

        get activeVoices() { return voices.size; },
        get sustainedVoices() { return sustainedVoices.size; }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpStrings = GumpStrings;
}
