/**
 * GUMP Groove Engine v2
 *
 * 808s that hit. Purdie shuffle that swings. Heaven gates that soar.
 *
 * The beat that descends when you're ready.
 */

const GumpGroove = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let compressor = null;

    const state = {
        playing: false,
        tempo: 85,
        currentStep: 0,
        swing: 0.18,  // Purdie shuffle swing amount
        intensity: 0,
        nextStepTime: 0,
        timerID: null,

        // Active sounds for cleanup
        activeSounds: new Set()
    };

    // Purdie shuffle patterns - the magic is ghost notes and swing
    const PATTERNS = {
        // Velocity values: 0 = off, 0.3 = ghost, 0.6 = medium, 1 = full
        kick: {
            innocence: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],  // Nothing
            ambition:  [1,0,0,0, 0,0,0,0, 0.8,0,0,0, 0,0,0,0],
            hardships: [1,0,0,0.3, 0,0,0.7,0, 1,0,0,0.3, 0,0,0,0],
            prevail:   [1,0,0.5,0, 0,0,0.8,0, 1,0,0.5,0, 0.3,0,0.7,0]
        },
        snare: {
            innocence: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            ambition:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
            hardships: [0,0,0,0, 1,0,0.25,0.3, 0,0,0.25,0, 1,0,0.3,0.25],  // Ghost notes!
            prevail:   [0,0.2,0,0.15, 1,0.25,0.2,0.3, 0,0.15,0.25,0.15, 1,0.3,0.2,0.25]
        },
        hat: {
            innocence: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            ambition:  [0.7,0,0.5,0, 0.7,0,0.5,0, 0.7,0,0.5,0, 0.7,0,0.5,0],
            hardships: [0.8,0.4,0.6,0.35, 0.8,0.4,0.6,0.35, 0.8,0.4,0.6,0.35, 0.8,0.4,0.6,0.35],
            prevail:   [1,0.5,0.7,0.4, 1,0.5,0.7,0.4, 1,0.5,0.7,0.4, 1,0.5,0.8,0.5]
        },
        openHat: {
            innocence: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
            ambition:  [0,0,0,0, 0,0,0.5,0, 0,0,0,0, 0,0,0.5,0],
            hardships: [0,0,0,0, 0,0,0,0.6, 0,0,0,0, 0,0,0,0.6],
            prevail:   [0,0,0,0, 0,0,0.7,0, 0,0,0,0, 0,0,0,0.8]
        }
    };

    function init(audioContext, destination) {
        ctx = audioContext;

        // Compressor for punch
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.knee.value = 6;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.15;

        masterGain = ctx.createGain();
        masterGain.gain.value = 0;

        masterGain.connect(compressor);
        compressor.connect(destination || ctx.destination);

        console.log('[Groove] Ready to drop');
    }

    function start(tempo = 85) {
        if (state.playing) return;

        state.tempo = tempo;
        state.playing = true;
        state.currentStep = 0;
        state.nextStepTime = ctx.currentTime + 0.1;

        // Fade in
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(state.intensity * 0.9, ctx.currentTime + 0.5);

        scheduler();

        console.log('[Groove] Started at', tempo, 'BPM');
    }

    function stop(fadeTime = 0.5) {
        if (!state.playing) return;

        state.playing = false;

        if (state.timerID) {
            clearTimeout(state.timerID);
            state.timerID = null;
        }

        const now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0, now + fadeTime);

        console.log('[Groove] Stopping');
    }

    function scheduler() {
        if (!state.playing) return;

        const secondsPerStep = (60 / state.tempo) / 4;  // 16th notes

        // Schedule notes ahead (lookahead for accuracy)
        while (state.nextStepTime < ctx.currentTime + 0.1) {
            scheduleStep(state.currentStep, state.nextStepTime);

            // Apply swing to off-beats (Purdie magic)
            let stepDuration = secondsPerStep;
            if (state.currentStep % 2 === 0) {
                // Even steps are slightly longer
                stepDuration *= (1 + state.swing);
            } else {
                // Odd steps are slightly shorter
                stepDuration *= (1 - state.swing);
            }

            state.nextStepTime += stepDuration;
            state.currentStep = (state.currentStep + 1) % 16;
        }

        state.timerID = setTimeout(scheduler, 25);  // Check every 25ms
    }

    function scheduleStep(step, time) {
        const act = getCurrentAct();
        const vol = state.intensity;

        // Kick
        const kickVel = PATTERNS.kick[act]?.[step] || 0;
        if (kickVel > 0) {
            play808Kick(time, kickVel * vol);
        }

        // Snare
        const snareVel = PATTERNS.snare[act]?.[step] || 0;
        if (snareVel > 0) {
            play808Snare(time, snareVel * vol);
        }

        // Hi-hat
        const hatVel = PATTERNS.hat[act]?.[step] || 0;
        if (hatVel > 0) {
            playHiHat(time, hatVel * vol * 0.7, 'closed');
        }

        // Open hat
        const openVel = PATTERNS.openHat[act]?.[step] || 0;
        if (openVel > 0) {
            playHiHat(time, openVel * vol * 0.6, 'open');
        }
    }

    function getCurrentAct() {
        if (typeof GumpJourney !== 'undefined') {
            return GumpJourney.currentAct?.name || 'ambition';
        }
        return 'ambition';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 808 KICK - Deep sub with click
    // ═══════════════════════════════════════════════════════════════════════

    function play808Kick(time, velocity = 0.8) {
        const now = time || ctx.currentTime;

        // === SUB OSCILLATOR (the weight) ===
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(150, now);
        sub.frequency.exponentialRampToValueAtTime(32, now + 0.12);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(velocity * 0.95, now);
        subGain.gain.setValueAtTime(velocity * 0.9, now + 0.02);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        // === CLICK (attack transient) ===
        const click = ctx.createOscillator();
        click.type = 'triangle';
        click.frequency.setValueAtTime(800, now);
        click.frequency.exponentialRampToValueAtTime(100, now + 0.015);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(velocity * 0.6, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        // === HARMONIC (body) ===
        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(80, now);
        body.frequency.exponentialRampToValueAtTime(45, now + 0.08);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(velocity * 0.3, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        // === SATURATION ===
        const saturator = ctx.createWaveShaper();
        saturator.curve = makeSaturationCurve(8);
        saturator.oversample = '2x';

        // === ROUTING ===
        sub.connect(subGain);
        click.connect(clickGain);
        body.connect(bodyGain);

        subGain.connect(saturator);
        clickGain.connect(saturator);
        bodyGain.connect(saturator);
        saturator.connect(masterGain);

        // === START/STOP ===
        sub.start(now);
        sub.stop(now + 0.7);
        click.start(now);
        click.stop(now + 0.03);
        body.start(now);
        body.stop(now + 0.25);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 808 SNARE - Body + noise snares
    // ═══════════════════════════════════════════════════════════════════════

    function play808Snare(time, velocity = 0.7) {
        const now = time || ctx.currentTime;
        const isGhost = velocity < 0.4;

        // === BODY (pitched component) ===
        const body = ctx.createOscillator();
        body.type = 'triangle';
        body.frequency.setValueAtTime(isGhost ? 180 : 200, now);
        body.frequency.exponentialRampToValueAtTime(isGhost ? 100 : 80, now + 0.04);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(velocity * 0.45, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + (isGhost ? 0.08 : 0.12));

        // === NOISE (snare wires) ===
        const noiseLen = isGhost ? 0.06 : 0.15;
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = isGhost ? 3000 : 2500;
        noiseFilter.Q.value = 0.7;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(velocity * 0.55, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);

        // === ROUTING ===
        body.connect(bodyGain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        bodyGain.connect(masterGain);
        noiseGain.connect(masterGain);

        // === START/STOP ===
        body.start(now);
        body.stop(now + 0.15);
        noise.start(now);
        noise.stop(now + noiseLen);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HI-HAT - Metallic shimmer
    // ═══════════════════════════════════════════════════════════════════════

    function playHiHat(time, velocity = 0.5, type = 'closed') {
        const now = time || ctx.currentTime;
        const isOpen = type === 'open';
        const decay = isOpen ? 0.25 : 0.04;

        // === METALLIC NOISE ===
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * decay * 1.5, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        // === BANDPASS FOR METALLIC TONE ===
        const bp1 = ctx.createBiquadFilter();
        bp1.type = 'bandpass';
        bp1.frequency.value = 10000;
        bp1.Q.value = 1.2;

        const bp2 = ctx.createBiquadFilter();
        bp2.type = 'highpass';
        bp2.frequency.value = 7000;

        // === ENVELOPE ===
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

        // === ROUTING ===
        noise.connect(bp1);
        bp1.connect(bp2);
        bp2.connect(gain);
        gain.connect(masterGain);

        // === START ===
        noise.start(now);
        noise.stop(now + decay * 1.5);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HEAVEN GATES - Detuned unison pads
    // ═══════════════════════════════════════════════════════════════════════

    function playHeavenGates(notes, duration = 4) {
        if (!ctx) return;

        const now = ctx.currentTime;

        notes.forEach((note, noteIdx) => {
            const freq = 220 * Math.pow(2, note / 12);

            // Multiple detuned voices per note (unison heaven)
            const voiceCount = 6;
            for (let v = 0; v < voiceCount; v++) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;

                // Spread detune for width
                const detuneSpread = 20;
                osc.detune.value = (v - (voiceCount - 1) / 2) * (detuneSpread / voiceCount);
                osc.detune.value += (Math.random() - 0.5) * 5;  // Random drift

                // Filter for warmth
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 1800 + noteIdx * 300;
                filter.Q.value = 0.5;

                // Envelope
                const gain = ctx.createGain();
                gain.gain.value = 0;
                gain.gain.linearRampToValueAtTime(0.06 * state.intensity / voiceCount, now + 1.5);
                gain.gain.setValueAtTime(0.06 * state.intensity / voiceCount, now + duration - 2);
                gain.gain.linearRampToValueAtTime(0, now + duration);

                // Pan for stereo width
                const panner = ctx.createStereoPanner();
                panner.pan.value = (v / (voiceCount - 1)) * 1.4 - 0.7;  // Spread across stereo

                // Route
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(panner);
                panner.connect(masterGain);

                osc.start(now);
                osc.stop(now + duration + 0.1);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function makeSaturationCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
        }
        return curve;
    }

    function setIntensity(intensity) {
        state.intensity = Math.max(0, Math.min(1, intensity));
        if (state.playing) {
            const now = ctx.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.linearRampToValueAtTime(state.intensity * 0.9, now + 0.1);
        }
    }

    function setTempo(bpm) {
        state.tempo = bpm;
    }

    function setSwing(amount) {
        state.swing = Math.max(0, Math.min(0.3, amount));
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
        playHiHat,

        get isPlaying() { return state.playing; },
        get tempo() { return state.tempo; },
        get intensity() { return state.intensity; }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpGroove = GumpGroove;
}
