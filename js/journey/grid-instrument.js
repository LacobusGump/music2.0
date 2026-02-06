/**
 * GUMP Grid Instrument
 *
 * The grid squares are your instrument:
 * - TAP = trigger sound (MIDI-style)
 * - HOLD = enter edit mode (tilt to pitch bend, move to modulate)
 * - RAPID TAP = system learns your rhythm
 * - MOVE BETWEEN = conductor mode
 *
 * Each square can be:
 * - A drum pad
 * - A melodic note
 * - A texture trigger
 * - A loop point
 */

const GumpGridInstrument = (function() {
    'use strict';

    let ctx = null;

    const state = {
        // Current interaction
        mode: 'idle',  // 'idle', 'tap', 'hold', 'edit', 'conduct'
        currentSquare: null,
        lastSquare: null,
        squareEnterTime: 0,

        // Tap detection
        tapHistory: [],
        tapThreshold: 200,      // ms - taps faster than this are "rapid"
        holdThreshold: 300,     // ms - holding longer than this enters edit mode

        // Edit mode state
        editBaseFreq: 440,
        editBasePitch: 0,
        editModulation: { pitch: 0, filter: 0, volume: 0 },

        // Pattern detection
        rhythmPattern: [],
        patternStartTime: 0,

        // Active sounds per square
        activeSounds: new Map(),

        // Motion permission
        motionGranted: false
    };

    // 3x3 grid layout - each square has its own character
    const SQUARES = {
        'nw': { type: 'pad', sound: 'hihat', note: null, color: '#2a4858' },
        'n':  { type: 'pad', sound: 'clap', note: null, color: '#3a5868' },
        'ne': { type: 'pad', sound: 'perc', note: null, color: '#4a6878' },
        'w':  { type: 'melodic', sound: 'bass', note: 36, color: '#1a3848' },
        'center': { type: 'melodic', sound: 'lead', note: 48, color: '#5a8898' },
        'e':  { type: 'melodic', sound: 'pad', note: 60, color: '#3a5868' },
        'sw': { type: 'pad', sound: 'kick', note: null, color: '#0a2838' },
        's':  { type: 'pad', sound: 'snare', note: null, color: '#2a4858' },
        'se': { type: 'pad', sound: 'sub', note: null, color: '#1a3848' }
    };

    function init(audioContext) {
        ctx = audioContext;

        // Subscribe to grid events
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('gesture.start', onGestureStart);
            GumpEvents.on('gesture.move', onGestureMove);
            GumpEvents.on('gesture.end', onGestureEnd);
            GumpEvents.on('zone.change', onZoneChange);
        }

        // Request motion permission
        requestMotionPermission();

        console.log('[GridInstrument] Ready - tap, hold, conduct');
    }

    async function requestMotionPermission() {
        // Check if we need to request (iOS 13+)
        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {

            // We need user gesture to request - will happen on first tap
            console.log('[GridInstrument] Motion permission required - will request on first tap');

            // Add one-time listener for first interaction
            const requestOnTap = async () => {
                try {
                    const permission = await DeviceMotionEvent.requestPermission();
                    if (permission === 'granted') {
                        state.motionGranted = true;
                        setupMotionListeners();
                        showNotification('Motion enabled!');
                        console.log('[GridInstrument] Motion permission granted!');
                    }
                } catch (e) {
                    console.error('[GridInstrument] Motion permission error:', e);
                }
                document.removeEventListener('touchstart', requestOnTap);
            };

            document.addEventListener('touchstart', requestOnTap, { once: true });
        } else {
            // Non-iOS or older - just set up listeners
            state.motionGranted = true;
            setupMotionListeners();
        }
    }

    function setupMotionListeners() {
        window.addEventListener('deviceorientation', onDeviceOrientation, true);
        window.addEventListener('devicemotion', onDeviceMotion, true);
        console.log('[GridInstrument] Motion listeners active');
    }

    function showNotification(msg) {
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit('notification', { message: msg });
        }
        // Also try direct DOM update
        const notif = document.getElementById('notification');
        if (notif) {
            notif.textContent = msg;
            notif.classList.add('visible');
            setTimeout(() => notif.classList.remove('visible'), 2000);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GESTURE HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function onGestureStart(data) {
        const { x, y, zone } = data;
        const now = performance.now();

        state.currentSquare = zone;
        state.squareEnterTime = now;
        state.mode = 'tap';

        // Record tap
        state.tapHistory.push({
            zone,
            time: now,
            x, y
        });

        // Trim old taps
        state.tapHistory = state.tapHistory.filter(t => now - t.time < 2000);

        // Trigger immediate sound
        triggerSquareSound(zone, { velocity: 0.8, x, y });

        // Check for hold after threshold
        setTimeout(() => {
            if (state.mode === 'tap' && state.currentSquare === zone) {
                enterEditMode(zone);
            }
        }, state.holdThreshold);

        // Analyze tap pattern
        analyzeRhythm();
    }

    function onGestureMove(data) {
        const { x, y, velocityX, velocityY } = data;

        if (state.mode === 'edit') {
            // In edit mode - modulate the sound
            updateEditModulation(x, y);
        } else if (state.mode === 'conduct') {
            // Conducting between squares
            // Let the main conductor system handle this
        }
    }

    function onGestureEnd(data) {
        const duration = performance.now() - state.squareEnterTime;

        if (state.mode === 'edit') {
            exitEditMode();
        }

        // Check if this was a quick tap
        if (duration < state.tapThreshold) {
            // Quick tap - already triggered on start
        }

        state.mode = 'idle';
        state.currentSquare = null;
    }

    function onZoneChange(data) {
        const { from, to } = data;

        // Moving between squares = conductor mode
        if (from && to && from !== to) {
            state.mode = 'conduct';
            state.lastSquare = from;
            state.currentSquare = to;
            state.squareEnterTime = performance.now();

            // Trigger the new square sound
            triggerSquareSound(to, { velocity: 0.6 });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EDIT MODE
    // ═══════════════════════════════════════════════════════════════════════

    function enterEditMode(zone) {
        state.mode = 'edit';
        const square = SQUARES[zone];

        console.log('[GridInstrument] Edit mode:', zone);

        // Start sustained sound
        if (square.type === 'melodic') {
            state.editBaseFreq = 440 * Math.pow(2, (square.note - 69) / 12);
            state.editBasePitch = square.note;

            // Play sustained note that we'll modulate
            playEditableNote(zone, state.editBaseFreq);
        }

        showNotification('EDIT: tilt to bend');
    }

    function updateEditModulation(x, y) {
        // Use position for modulation
        // X = filter/timbre
        // Y = pitch bend (in edit mode)

        const pitchBend = (0.5 - y) * 12;  // +/- 6 semitones
        const filterMod = x;  // 0-1

        state.editModulation = {
            pitch: pitchBend,
            filter: filterMod,
            volume: 0.5 + y * 0.3
        };

        // Apply to active sound
        applyModulation(state.currentSquare, state.editModulation);
    }

    function exitEditMode() {
        // Fade out the sustained note
        const zone = state.currentSquare;
        if (state.activeSounds.has(zone)) {
            const sound = state.activeSounds.get(zone);
            fadeOutSound(sound);
            state.activeSounds.delete(zone);
        }

        state.mode = 'idle';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SOUND TRIGGERING
    // ═══════════════════════════════════════════════════════════════════════

    function triggerSquareSound(zone, options = {}) {
        const square = SQUARES[zone];
        if (!square) return;

        const { velocity = 0.8, x = 0.5, y = 0.5 } = options;

        if (square.type === 'pad') {
            triggerDrumSound(square.sound, velocity);
        } else if (square.type === 'melodic') {
            triggerMelodicSound(zone, square, velocity, x, y);
        }
    }

    function triggerDrumSound(sound, velocity) {
        if (!ctx) return;

        switch (sound) {
            case 'kick':
                playKick(velocity);
                break;
            case 'snare':
                playSnare(velocity);
                break;
            case 'hihat':
                playHiHat(velocity, 'closed');
                break;
            case 'clap':
                playClap(velocity);
                break;
            case 'perc':
                playPerc(velocity);
                break;
            case 'sub':
                playSub(velocity);
                break;
        }
    }

    function triggerMelodicSound(zone, square, velocity, x, y) {
        if (!ctx) return;

        const baseNote = square.note;
        // Y position can shift the note within a scale
        const noteOffset = Math.floor((1 - y) * 7);  // 0-7 semitones
        const freq = 440 * Math.pow(2, (baseNote + noteOffset - 69) / 12);

        playMelodicNote(freq, velocity, square.sound);
    }

    function playEditableNote(zone, freq) {
        if (!ctx) return;

        const now = ctx.currentTime;

        // Create oscillators
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.value = freq;
        osc2.frequency.value = freq * 1.005;  // Slight detune

        // Filter for modulation
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 2;

        // Gain
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1);

        // Connect
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);

        // Store for modulation
        state.activeSounds.set(zone, {
            oscs: [osc1, osc2],
            filter,
            gain,
            baseFreq: freq
        });
    }

    function applyModulation(zone, mod) {
        const sound = state.activeSounds.get(zone);
        if (!sound) return;

        const now = ctx.currentTime;

        // Pitch bend
        const newFreq = sound.baseFreq * Math.pow(2, mod.pitch / 12);
        sound.oscs.forEach(osc => {
            osc.frequency.setTargetAtTime(newFreq, now, 0.05);
        });

        // Filter
        const filterFreq = 500 + mod.filter * 4000;
        sound.filter.frequency.setTargetAtTime(filterFreq, now, 0.05);
    }

    function fadeOutSound(sound, time = 0.3) {
        if (!sound || !ctx) return;

        const now = ctx.currentTime;
        sound.gain.gain.setTargetAtTime(0, now, time / 3);

        setTimeout(() => {
            sound.oscs.forEach(osc => {
                try { osc.stop(); } catch (e) {}
            });
        }, time * 1000);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DRUM SOUNDS
    // ═══════════════════════════════════════════════════════════════════════

    function playKick(velocity = 0.8) {
        const now = ctx.currentTime;

        // Sub
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        // Click
        const click = ctx.createOscillator();
        click.frequency.setValueAtTime(1000, now);
        click.frequency.exponentialRampToValueAtTime(100, now + 0.02);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(velocity * 0.5, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        osc.connect(gain);
        click.connect(clickGain);
        gain.connect(ctx.destination);
        clickGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
        click.start(now);
        click.stop(now + 0.03);
    }

    function playSnare(velocity = 0.7) {
        const now = ctx.currentTime;

        // Body
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(velocity * 0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        // Noise
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 2000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(velocity * 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(oscGain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        oscGain.connect(ctx.destination);
        noiseGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
        noise.start(now);
        noise.stop(now + 0.15);
    }

    function playHiHat(velocity = 0.5, type = 'closed') {
        const now = ctx.currentTime;
        const decay = type === 'open' ? 0.3 : 0.05;

        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * decay, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 10000;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + decay);
    }

    function playClap(velocity = 0.6) {
        const now = ctx.currentTime;

        // Multiple noise bursts
        for (let i = 0; i < 3; i++) {
            const noise = ctx.createBufferSource();
            const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let j = 0; j < data.length; j++) data[j] = Math.random() * 2 - 1;
            noise.buffer = noiseBuffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1500;
            filter.Q.value = 0.5;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(velocity * 0.4, now + i * 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.015 + 0.1);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noise.start(now + i * 0.015);
            noise.stop(now + i * 0.015 + 0.1);
        }
    }

    function playPerc(velocity = 0.5) {
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    function playSub(velocity = 0.8) {
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(velocity * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
    }

    function playMelodicNote(freq, velocity, type) {
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = type === 'bass' ? 'sawtooth' : 'triangle';
        osc.frequency.value = freq;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000 + velocity * 3000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RHYTHM ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════

    function analyzeRhythm() {
        if (state.tapHistory.length < 3) return;

        const recent = state.tapHistory.slice(-8);
        const intervals = [];

        for (let i = 1; i < recent.length; i++) {
            intervals.push(recent[i].time - recent[i-1].time);
        }

        // Check for consistent rhythm
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;

        if (variance < avgInterval * 0.3) {
            // Consistent rhythm detected
            const bpm = 60000 / avgInterval;
            console.log('[GridInstrument] Rhythm detected:', Math.round(bpm), 'BPM');

            emit('rhythm.detected', {
                bpm: Math.round(bpm),
                pattern: recent.map(t => t.zone),
                intervals
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MOTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function onDeviceOrientation(e) {
        if (state.mode !== 'edit') return;

        // Use tilt for pitch bend in edit mode
        const pitchBend = (e.gamma || 0) / 45;  // -1 to 1
        const intensity = Math.abs(e.beta - 45) / 45;  // Forward/back tilt

        state.editModulation.pitch = pitchBend * 12;  // +/- 12 semitones max
        state.editModulation.filter = 0.5 + intensity * 0.5;

        if (state.currentSquare) {
            applyModulation(state.currentSquare, state.editModulation);
        }
    }

    function onDeviceMotion(e) {
        // Shake detection for fills/accents
        const accel = e.accelerationIncludingGravity || {};
        const magnitude = Math.sqrt(
            (accel.x || 0) ** 2 +
            (accel.y || 0) ** 2 +
            (accel.z || 0) ** 2
        );

        if (magnitude > 20) {
            emit('shake.detected', { intensity: magnitude / 30 });
        }
    }

    function emit(event, data) {
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit(event, data);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,
        requestMotionPermission,

        get mode() { return state.mode; },
        get currentSquare() { return state.currentSquare; },
        get motionGranted() { return state.motionGranted; },

        getSquareConfig: (zone) => SQUARES[zone],

        // Manual trigger for testing
        trigger: (zone, velocity) => triggerSquareSound(zone, { velocity })
    });

})();

if (typeof window !== 'undefined') {
    window.GumpGridInstrument = GumpGridInstrument;
}
