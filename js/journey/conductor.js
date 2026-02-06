/**
 * GUMP CONDUCTOR - The Radiohead Version
 *
 * Dreamy strings + Purdie shuffle 808s + lo-fi warmth
 * Touch to play, tilt for expression
 */

const GumpConductor = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let compressor = null;

    const state = {
        initialized: false,
        touching: false,
        touchX: 0.5,
        touchY: 0.5,
        tiltX: 0,
        tiltY: 0,
        tiltGranted: false,
        energy: 0,
        groovePlaying: false,
        grooveStep: 0,
        nextStepTime: 0,
        tempo: 85,
        act: 'innocence'  // innocence -> ambition -> hardships -> prevail
    };

    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19];  // Extended pentatonic

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

        masterGain = ctx.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(compressor);

        // Touch
        document.addEventListener('touchstart', onTouch, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: false });
        document.addEventListener('mousedown', onMouse);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        state.initialized = true;

        // Start ambient pad
        playAmbientPad();

        // Start update loop
        update();

        console.log('[Conductor] Ready - tap for tilt permission');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TOUCH + TILT
    // ═══════════════════════════════════════════════════════════════════════

    async function onTouch(e) {
        // iOS tilt permission - must be first thing, before preventDefault
        if (!state.tiltGranted && typeof DeviceOrientationEvent !== 'undefined') {
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
            state.energy = Math.min(1, state.energy + dist);
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
            state.energy = Math.min(1, state.energy + dist);
        }
    }

    function onMouseUp() {
        state.touching = false;
    }

    function onTilt(e) {
        state.tiltX = (e.gamma || 0) / 45;  // -1 to 1
        state.tiltY = ((e.beta || 45) - 45) / 45;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOUNDS - Dreamy strings
    // ═══════════════════════════════════════════════════════════════════════

    function playNote(x, y, velocity) {
        const now = ctx.currentTime;

        // X = octave, Y = scale note
        const octave = 2 + Math.floor(x * 3);
        const noteIndex = Math.floor((1 - y) * scale.length);
        const note = scale[Math.min(noteIndex, scale.length - 1)];
        const freq = 110 * Math.pow(2, (note + octave * 12) / 12);

        // Detuned oscillators for warmth
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            osc.type = i === 0 ? 'sawtooth' : 'triangle';
            osc.frequency.value = freq;
            osc.detune.value = (i - 1) * 12 + Math.random() * 5;

            const gain = ctx.createGain();
            const vol = velocity * 0.15 / 3;
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + (1-velocity) * 0.3);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800 + x * 2000 + Math.max(0, state.tiltY) * 1500;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 0.6);
        }

        // Add vibrato from tilt
        if (Math.abs(state.tiltX) > 0.2) {
            // Subtle pitch wobble would go here
        }
    }

    function playAmbientPad() {
        if (!ctx) return;
        const now = ctx.currentTime;

        // Quiet drone that evolves
        const freqs = [110, 165, 220];
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 3);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GROOVE - Purdie shuffle 808s
    // ═══════════════════════════════════════════════════════════════════════

    function startGroove() {
        if (state.groovePlaying) return;
        state.groovePlaying = true;
        state.nextStepTime = ctx.currentTime + 0.1;
        showMsg('GROOVE');
    }

    function runGroove() {
        if (!state.groovePlaying) return;

        while (state.nextStepTime < ctx.currentTime + 0.1) {
            const step = state.grooveStep;
            const t = state.nextStepTime;
            const intensity = 0.4 + state.energy * 0.5;

            // Kick pattern
            const kicks = [1,0,0,0, 0,0,0.6,0, 1,0,0,0, 0,0,0,0];
            if (kicks[step]) playKick(t, kicks[step] * intensity);

            // Snare with ghosts (Purdie shuffle)
            const snares = [0,0,0,0, 1,0,0.2,0.3, 0,0,0.2,0, 1,0,0.3,0.2];
            if (snares[step]) playSnare(t, snares[step] * intensity);

            // Hats
            const hats = [1,0.4,0.7,0.3, 1,0.4,0.7,0.3, 1,0.4,0.7,0.3, 1,0.4,0.7,0.5];
            if (hats[step]) playHat(t, hats[step] * intensity * 0.4);

            // Swing
            const stepDur = (60 / state.tempo) / 4;
            const swing = step % 2 === 0 ? 1.18 : 0.82;
            state.nextStepTime += stepDur * swing;
            state.grooveStep = (step + 1) % 16;
        }
    }

    function playKick(time, vel) {
        const sub = ctx.createOscillator();
        sub.frequency.setValueAtTime(120, time);
        sub.frequency.exponentialRampToValueAtTime(30, time + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vel * 0.9, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        sub.connect(gain);
        gain.connect(masterGain);
        sub.start(time);
        sub.stop(time + 0.6);
    }

    function playSnare(time, vel) {
        // Body
        const body = ctx.createOscillator();
        body.type = 'triangle';
        body.frequency.setValueAtTime(180, time);
        body.frequency.exponentialRampToValueAtTime(80, time + 0.03);

        const bodyG = ctx.createGain();
        bodyG.gain.setValueAtTime(vel * 0.3, time);
        bodyG.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        // Noise
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buf;

        const noiseG = ctx.createGain();
        noiseG.gain.setValueAtTime(vel * 0.4, time);
        noiseG.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        const filt = ctx.createBiquadFilter();
        filt.type = 'highpass';
        filt.frequency.value = 2000;

        body.connect(bodyG);
        bodyG.connect(masterGain);
        noise.connect(filt);
        filt.connect(noiseG);
        noiseG.connect(masterGain);

        body.start(time);
        body.stop(time + 0.1);
        noise.start(time);
        noise.stop(time + 0.1);
    }

    function playHat(time, vel) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buf;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vel * 0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        const filt = ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 8000;

        noise.connect(filt);
        filt.connect(gain);
        gain.connect(masterGain);
        noise.start(time);
        noise.stop(time + 0.04);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function update() {
        // Energy decay
        if (!state.touching) {
            state.energy *= 0.995;
        }

        // Start groove when energy builds
        if (state.energy > 0.3 && !state.groovePlaying) {
            startGroove();
        }

        // Run groove
        if (state.groovePlaying) {
            runGroove();
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
        get energy() { return state.energy; },
        get tiltGranted() { return state.tiltGranted; }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpConductor = GumpConductor;
}
