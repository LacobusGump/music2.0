/**
 * GUMP Strings Engine
 *
 * Ethereal, organic string sounds.
 * Single violin → full orchestra based on conducting.
 *
 * Uses synthesis designed to sound organic:
 * - Multiple detuned oscillators (natural beating)
 * - Body resonance simulation
 * - Bow noise
 * - Dynamic vibrato
 */

const GumpStrings = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let reverbNode = null;

    const activeVoices = new Map();
    let voiceId = 0;

    // String instrument definitions
    const STRINGS = {
        violin: { range: [196, 1568], formants: [500, 1500, 3000], brightness: 0.7 },
        viola: { range: [131, 1047], formants: [400, 1200, 2500], brightness: 0.5 },
        cello: { range: [65, 698], formants: [300, 900, 2000], brightness: 0.4 },
        bass: { range: [41, 294], formants: [200, 600, 1500], brightness: 0.3 }
    };

    // Current scale (will be updated by arc)
    let currentScale = [0, 2, 4, 5, 7, 9, 11];  // Major scale
    let rootNote = 220;  // A3

    function init(audioContext, destination) {
        ctx = audioContext;

        // Create master gain
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.6;

        // Create reverb (convolution would be better, using algorithmic for now)
        reverbNode = createReverb();
        masterGain.connect(reverbNode);
        reverbNode.connect(destination || ctx.destination);

        console.log('[Strings] Initialized');
    }

    function createReverb() {
        // Simple algorithmic reverb using delays
        const convolver = ctx.createConvolver();

        // Generate impulse response
        const length = ctx.sampleRate * 3;  // 3 second reverb
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Exponential decay with some randomness
                data[i] = (Math.random() * 2 - 1) *
                          Math.pow(1 - i / length, 2) *
                          (1 + Math.random() * 0.3);
            }
        }

        convolver.buffer = impulse;

        // Mix dry/wet
        const dryGain = ctx.createGain();
        const wetGain = ctx.createGain();
        dryGain.gain.value = 0.4;
        wetGain.gain.value = 0.6;

        const merger = ctx.createGain();
        dryGain.connect(merger);
        wetGain.connect(convolver);
        convolver.connect(merger);

        // Return a node that acts like the reverb
        const input = ctx.createGain();
        input.connect(dryGain);
        input.connect(wetGain);

        input._output = merger;
        input.connect = (dest) => merger.connect(dest);

        return input;
    }

    /**
     * Play a string note with conducting parameters
     */
    function play(options = {}) {
        if (!ctx) return null;

        const {
            instrument = 'violin',
            note = 0,           // Scale degree (0-6) or raw frequency
            octave = 0,         // Octave offset
            dynamics = 0.5,     // 0-1, soft to loud
            articulation = 0.5, // 0-1, legato to staccato
            vibrato = 0.3,      // 0-1, vibrato depth
            duration = null,    // null = sustain until release
            pan = 0             // -1 to 1
        } = options;

        const stringDef = STRINGS[instrument] || STRINGS.violin;

        // Calculate frequency from scale degree
        let freq;
        if (typeof note === 'number' && note < 20) {
            // Scale degree
            const semitone = currentScale[note % currentScale.length];
            const octaveOffset = Math.floor(note / currentScale.length) + octave;
            freq = rootNote * Math.pow(2, (semitone + octaveOffset * 12) / 12);
        } else {
            freq = note;  // Raw frequency
        }

        // Clamp to instrument range
        freq = Math.max(stringDef.range[0], Math.min(stringDef.range[1], freq));

        const id = ++voiceId;
        const now = ctx.currentTime;

        // Create voice
        const voice = createStringVoice(freq, stringDef, dynamics, articulation, vibrato, pan);
        activeVoices.set(id, voice);

        // Register with voice manager
        if (typeof GumpVoiceManager !== 'undefined') {
            GumpVoiceManager.register(voice.source, voice.output, {
                type: 'strings',
                zone: 'journey'
            });
        }

        // Handle duration
        if (duration) {
            setTimeout(() => release(id), duration * 1000);
        }

        return id;
    }

    function createStringVoice(freq, stringDef, dynamics, articulation, vibrato, pan) {
        const now = ctx.currentTime;

        // Multiple detuned oscillators for richness
        const oscs = [];
        const numOscs = 3;
        const detuneAmount = 4;  // cents

        for (let i = 0; i < numOscs; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            osc.detune.value = (i - 1) * detuneAmount;  // -4, 0, +4 cents
            oscs.push(osc);
        }

        // Vibrato LFO
        const vibratoLfo = ctx.createOscillator();
        vibratoLfo.type = 'sine';
        vibratoLfo.frequency.value = 5 + Math.random();  // ~5Hz with variation

        const vibratoGain = ctx.createGain();
        vibratoGain.gain.value = freq * 0.01 * vibrato;  // Pitch variation

        vibratoLfo.connect(vibratoGain);
        oscs.forEach(osc => vibratoGain.connect(osc.frequency));

        // Bow noise (filtered noise)
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = freq * 2;
        noiseFilter.Q.value = 2;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.02 * dynamics;  // Subtle bow noise

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        // Body resonance (formant filter)
        const bodyFilter = ctx.createBiquadFilter();
        bodyFilter.type = 'peaking';
        bodyFilter.frequency.value = stringDef.formants[0];
        bodyFilter.Q.value = 2;
        bodyFilter.gain.value = 6;

        // Brightness filter
        const brightnessFilter = ctx.createBiquadFilter();
        brightnessFilter.type = 'lowpass';
        brightnessFilter.frequency.value = 2000 + stringDef.brightness * 6000 * dynamics;

        // Main gain
        const mainGain = ctx.createGain();
        mainGain.gain.value = 0;

        // Pan
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;

        // Connect oscillators
        oscs.forEach(osc => osc.connect(bodyFilter));
        noiseGain.connect(bodyFilter);
        bodyFilter.connect(brightnessFilter);
        brightnessFilter.connect(mainGain);
        mainGain.connect(panner);
        panner.connect(masterGain);

        // Envelope
        const attackTime = 0.1 + (1 - articulation) * 0.3;  // Legato = slow attack
        const targetGain = 0.15 * dynamics;

        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(targetGain, now + attackTime);

        // Start oscillators
        oscs.forEach(osc => osc.start(now));
        vibratoLfo.start(now);
        noise.start(now);

        return {
            oscs,
            vibratoLfo,
            noise,
            mainGain,
            brightnessFilter,
            panner,
            output: mainGain,
            source: oscs[0],  // For voice manager
            freq,
            startTime: now
        };
    }

    function release(id, fadeTime = 0.3) {
        const voice = activeVoices.get(id);
        if (!voice) return;

        const now = ctx.currentTime;

        // Fade out
        voice.mainGain.gain.cancelScheduledValues(now);
        voice.mainGain.gain.setValueAtTime(voice.mainGain.gain.value, now);
        voice.mainGain.gain.linearRampToValueAtTime(0, now + fadeTime);

        // Stop and cleanup
        setTimeout(() => {
            try {
                voice.oscs.forEach(osc => osc.stop());
                voice.vibratoLfo.stop();
                voice.noise.stop();
            } catch (e) {}
            activeVoices.delete(id);
        }, fadeTime * 1000 + 50);
    }

    function releaseAll(fadeTime = 0.5) {
        for (const id of activeVoices.keys()) {
            release(id, fadeTime);
        }
    }

    /**
     * Play a chord based on conducting
     */
    function playChord(conducting) {
        const { section, dynamics, articulation, expression } = conducting;

        // Section determines instrument blend
        const instruments = [];
        if (section < 0.25) instruments.push('bass', 'cello');
        else if (section < 0.5) instruments.push('cello', 'viola');
        else if (section < 0.75) instruments.push('viola', 'violin');
        else instruments.push('violin');

        // Play notes from current scale based on dynamics
        const numNotes = Math.floor(1 + dynamics * 3);  // 1-4 notes

        const voices = [];
        for (let i = 0; i < numNotes; i++) {
            const note = i * 2;  // Root, 3rd, 5th, 7th
            const instrument = instruments[i % instruments.length];
            const pan = (section - 0.5) * 2;  // Pan based on position

            const id = play({
                instrument,
                note,
                dynamics: dynamics * (1 - i * 0.15),  // Softer for higher notes
                articulation,
                vibrato: expression?.vibrato || 0.3,
                pan
            });

            if (id) voices.push(id);
        }

        return voices;
    }

    /**
     * Update based on conducting input
     */
    function updateFromConducting(conducting) {
        // Could modulate existing voices here
        const { expression } = conducting;

        // Update vibrato on active voices
        if (expression && expression.vibrato !== undefined) {
            for (const voice of activeVoices.values()) {
                if (voice.vibratoGain) {
                    voice.vibratoGain.gain.value = voice.freq * 0.01 * expression.vibrato;
                }
            }
        }
    }

    function setScale(scale, root) {
        currentScale = scale;
        rootNote = root;
    }

    function setReverbMix(wet) {
        // Adjust reverb mix if needed
    }

    return Object.freeze({
        init,
        play,
        release,
        releaseAll,
        playChord,
        updateFromConducting,
        setScale,
        setReverbMix,
        get activeCount() { return activeVoices.size; }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpStrings = GumpStrings;
}
