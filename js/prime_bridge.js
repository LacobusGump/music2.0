/**
 * PRIME BRIDGE — Connects the Prime Engine to GUMP's audio/sensor chain
 *
 * Hooks into:
 *   - Audio's existing AudioContext and masterGain chain
 *   - Brain's energy/void state
 *   - Sensor's accelerometer/orientation
 *
 * Creates a ScriptProcessorNode (or AudioWorklet) that runs
 * the Kuramoto coupled oscillator model in real-time audio.
 *
 * Usage in app.js main loop:
 *   PrimeBridge.update(Brain.short.energy(), sensorState);
 *
 * The old Follow.js pipeline still exists — PrimeBridge runs
 * IN PARALLEL and fades in/out via a crossfade gain.
 */

const PrimeBridge = (function () {
    'use strict';

    let engine = null;
    let scriptNode = null;
    let primeGain = null;
    let ctx = null;
    let active = false;

    // Smoothed sensor values
    let smoothEnergy = 0;
    let smoothTilt = 0;
    let smoothTiltX = 0;
    const SMOOTH = 0.92;

    // Current musical state
    let currentRoot = 220;
    let currentMood = 'neutral';

    function init(audioCtx, destinationNode) {
        ctx = audioCtx;

        // Create the engine
        engine = PrimeEngine.create({
            root: currentRoot,
            mood: currentMood,
            K_sweet: 5,
            K_high: 15,
        });

        // Gain node for crossfading with old engine
        primeGain = ctx.createGain();
        primeGain.gain.value = 0; // starts silent

        // ScriptProcessor for real-time Kuramoto synthesis
        // 2048 samples buffer, mono in, stereo out
        const bufferSize = 2048;
        scriptNode = ctx.createScriptProcessor(bufferSize, 0, 2);

        scriptNode.onaudioprocess = function (e) {
            if (!active || !engine) return;

            const outL = e.outputBuffer.getChannelData(0);
            const outR = e.outputBuffer.getChannelData(1);

            for (let i = 0; i < outL.length; i++) {
                // Update coupling from smoothed body data
                engine.bank.K = engine.body.getK(engine.bank.K_c);

                // Generate sample
                const sample = engine.bank.sample();

                // Subtle stereo from phase dispersion
                const state = engine.bank.getState();
                const meanPhase = state.phases.length > 0
                    ? Math.atan2(
                        state.phases.reduce((s, p) => s + Math.sin(p), 0),
                        state.phases.reduce((s, p) => s + Math.cos(p), 0)
                      )
                    : 0;

                // Pan follows the mean phase on S¹
                const pan = Math.sin(meanPhase) * 0.3;
                outL[i] = sample * (0.5 - pan * 0.5) * 0.5;
                outR[i] = sample * (0.5 + pan * 0.5) * 0.5;
            }
        };

        // Connect: scriptNode → primeGain → destination
        scriptNode.connect(primeGain);
        primeGain.connect(destinationNode);

        console.log('[PrimeBridge] Initialized. Kuramoto synthesis ready.');
    }

    function update(energy, sensorState) {
        if (!engine) return;

        // Smooth the sensor data (water bottle feel)
        const rawEnergy = energy || 0;
        smoothEnergy = SMOOTH * smoothEnergy + (1 - SMOOTH) * rawEnergy;

        // Tilt from sensor
        const beta = sensorState ? (sensorState.beta || 0) : 0;
        const gamma = sensorState ? (sensorState.gamma || 0) : 0;
        smoothTilt = SMOOTH * smoothTilt + (1 - SMOOTH) * (beta / 90);
        smoothTiltX = SMOOTH * smoothTiltX + (1 - SMOOTH) * (gamma / 90);

        // Update body mapper
        engine.body.energy = smoothEnergy;
        engine.body.tilt = smoothTilt;

        // Coupling K from energy
        // Stillness → K ≈ 0 (silence)
        // Movement → K increases toward and past K_c
        engine.bank.K = engine.body.getK(engine.bank.K_c);

        // Root frequency follows tilt
        const shift = engine.body.getRootShift();
        const newRoot = 220 * Math.max(0.25, Math.min(4, shift));
        if (Math.abs(newRoot - currentRoot) > 5) {
            currentRoot = newRoot;
            // Retune oscillators
            const ratios = engine.bank.oscillators.map((o, i) =>
                o.freq / (engine.bank.oscillators[0] ? engine.bank.oscillators[0].freq : 220)
            );
            engine.bank.oscillators.forEach((o, i) => {
                o.freq = currentRoot * (ratios[i] || 1);
                o.omega = o.freq * 2 * Math.PI;
            });
        }

        // Mood follows motion character
        const newMood = engine.body.getMood();
        if (newMood !== currentMood && smoothEnergy > 0.05) {
            currentMood = newMood;
            // Don't rebuild oscillators mid-stream, just note it
            // A more sophisticated version would crossfade between moods
        }
    }

    function engage() {
        if (!primeGain) return;
        active = true;
        primeGain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 2);
        console.log('[PrimeBridge] Engaged — coupling active');
    }

    function disengage() {
        if (!primeGain) return;
        primeGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
        setTimeout(() => { active = false; }, 2500);
        console.log('[PrimeBridge] Disengaged — returning to GUE');
    }

    function getState() {
        if (!engine) return null;
        return engine.state();
    }

    function isActive() { return active; }

    function toggle() {
        if (active) {
            disengage();
        } else {
            engage();
        }
        return active;
    }

    return {
        init,
        update,
        engage,
        disengage,
        toggle,
        getState,
        isActive,
    };
})();
