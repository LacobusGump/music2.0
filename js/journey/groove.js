/**
 * GUMP Groove Engine
 *
 * 808s, heaven gate pads, Purdie shuffle.
 * Emerges in Act 2 (Ambition), intensifies through Hardships and Prevail.
 *
 * The beat that descends from heaven.
 */

const GumpGroove = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;

    const state = {
        playing: false,
        tempo: 85,
        currentBeat: 0,
        swing: 0.15,  // Purdie shuffle swing
        intensity: 0,
        lastBeatTime: 0,
        scheduledEvents: [],
        activeElements: new Map()
    };

    // Purdie shuffle pattern - the magic is in the ghost notes
    const PATTERNS = {
        kick: {
            ambition:  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            hardships: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            prevail:   [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0]
        },
        snare: {
            ambition:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            hardships: [0, 0, 0, 0, 1, 0, 0.3, 0, 0, 0, 0.3, 0, 1, 0, 0, 0.3],  // Ghost notes
            prevail:   [0, 0.2, 0, 0, 1, 0.3, 0.2, 0.3, 0, 0.2, 0.3, 0, 1, 0.3, 0.2, 0.3]
        },
        hat: {
            ambition:  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            hardships: [1, 0.5, 1, 0.3, 1, 0.5, 1, 0.3, 1, 0.5, 1, 0.3, 1, 0.5, 1, 0.3],
            prevail:   [1, 0.7, 1, 0.5, 1, 0.7, 1, 0.5, 1, 0.7, 1, 0.5, 1, 0.7, 1, 0.5]
        }
    };

    function init(audioContext, destination) {
        ctx = audioContext;
        masterGain = ctx.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(destination || ctx.destination);

        console.log('[Groove] Initialized - ready to descend');
    }

    function start(tempo = 85) {
        state.tempo = tempo;
        state.playing = true;
        state.currentBeat = 0;
        state.lastBeatTime = ctx.currentTime;

        scheduleBeats();
        console.log('[Groove] Started at', tempo, 'BPM');
    }

    function stop(fadeTime = 0.5) {
        state.playing = false;

        const now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.linearRampToValueAtTime(0, now + fadeTime);

        // Clear scheduled events
        state.scheduledEvents.forEach(id => clearTimeout(id));
        state.scheduledEvents = [];
    }

    function scheduleBeats() {
        if (!state.playing) return;

        const now = ctx.currentTime;
        const beatDuration = 60 / state.tempo / 4;  // 16th notes

        // Schedule next 16 beats (1 bar)
        for (let i = 0; i < 16; i++) {
            const beatNum = (state.currentBeat + i) % 16;
            let beatTime = now + i * beatDuration;

            // Apply swing to off-beats (Purdie shuffle feel)
            if (beatNum % 2 === 1) {
                beatTime += beatDuration * state.swing;
            }

            scheduleBeat(beatNum, beatTime);
        }

        state.currentBeat = (state.currentBeat + 16) % 16;

        // Schedule next bar
        const barDuration = beatDuration * 16;
        const timeoutId = setTimeout(() => scheduleBeats(), barDuration * 1000 * 0.9);
        state.scheduledEvents.push(timeoutId);
    }

    function scheduleBeat(beatNum, time) {
        const act = getActName();
        const kickPattern = PATTERNS.kick[act] || PATTERNS.kick.ambition;
        const snarePattern = PATTERNS.snare[act] || PATTERNS.snare.ambition;
        const hatPattern = PATTERNS.hat[act] || PATTERNS.hat.ambition;

        // Kick
        if (kickPattern[beatNum] > 0) {
            play808Kick(time, kickPattern[beatNum] * state.intensity);
        }

        // Snare (including ghosts)
        if (snarePattern[beatNum] > 0) {
            play808Snare(time, snarePattern[beatNum] * state.intensity);
        }

        // Hi-hat
        if (hatPattern[beatNum] > 0) {
            playHat(time, hatPattern[beatNum] * state.intensity * 0.6);
        }
    }

    function getActName() {
        if (typeof GumpArc !== 'undefined') {
            const act = GumpArc.getCurrentAct();
            return act?.name || 'ambition';
        }
        return 'ambition';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 808 SOUNDS
    // ═══════════════════════════════════════════════════════════════════════

    function play808Kick(time, velocity = 0.8) {
        const now = time || ctx.currentTime;

        // Sub oscillator - the weight
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(150, now);
        sub.frequency.exponentialRampToValueAtTime(35, now + 0.1);

        // Click for attack
        const click = ctx.createOscillator();
        click.type = 'triangle';
        click.frequency.setValueAtTime(400, now);
        click.frequency.exponentialRampToValueAtTime(60, now + 0.02);

        // Gain envelopes
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(velocity * 0.9, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(velocity * 0.5, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        // Soft distortion for warmth
        const distortion = ctx.createWaveShaper();
        distortion.curve = makeDistortionCurve(20);

        sub.connect(subGain);
        click.connect(clickGain);
        subGain.connect(distortion);
        clickGain.connect(distortion);
        distortion.connect(masterGain);

        sub.start(now);
        sub.stop(now + 0.6);
        click.start(now);
        click.stop(now + 0.05);
    }

    function play808Snare(time, velocity = 0.7) {
        const now = time || ctx.currentTime;

        // Body (pitched component)
        const body = ctx.createOscillator();
        body.type = 'triangle';
        body.frequency.setValueAtTime(220, now);
        body.frequency.exponentialRampToValueAtTime(120, now + 0.05);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(velocity * 0.4, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        // Noise (snare wires)
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 2000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(velocity * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        body.connect(bodyGain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        bodyGain.connect(masterGain);
        noiseGain.connect(masterGain);

        body.start(now);
        body.stop(now + 0.2);
        noise.start(now);
        noise.stop(now + 0.2);
    }

    function playHat(time, velocity = 0.5) {
        const now = time || ctx.currentTime;

        // Metallic noise
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 8000;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noise.start(now);
        noise.stop(now + 0.05);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HEAVEN GATES (Detuned pad synth)
    // ═══════════════════════════════════════════════════════════════════════

    function playHeavenGates(notes, duration = 4) {
        if (!ctx) return;

        const now = ctx.currentTime;
        const voices = [];

        notes.forEach((note, i) => {
            const freq = 220 * Math.pow(2, note / 12);

            // Multiple detuned oscillators per note
            for (let u = 0; u < 4; u++) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                osc.detune.value = (u - 1.5) * 15;  // Detune spread

                const gain = ctx.createGain();
                gain.gain.value = 0;

                // Slow attack, sustain, slow release
                gain.gain.linearRampToValueAtTime(0.08 * state.intensity, now + 1);
                gain.gain.setValueAtTime(0.08 * state.intensity, now + duration - 1);
                gain.gain.linearRampToValueAtTime(0, now + duration);

                // Low pass for warmth
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 2000 + i * 500;

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(masterGain);

                osc.start(now);
                osc.stop(now + duration + 0.1);

                voices.push(osc);
            }
        });

        return voices;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) /
                       (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    function setIntensity(intensity) {
        state.intensity = intensity;
        masterGain.gain.linearRampToValueAtTime(
            intensity * 0.8,
            ctx.currentTime + 0.1
        );
    }

    function setTempo(bpm) {
        state.tempo = bpm;
    }

    function setSwing(amount) {
        state.swing = amount;
    }

    return Object.freeze({
        init,
        start,
        stop,
        setIntensity,
        setTempo,
        setSwing,
        playHeavenGates,
        play808Kick,
        play808Snare,
        playHat,
        get isPlaying() { return state.playing; },
        get tempo() { return state.tempo; }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpGroove = GumpGroove;
}
