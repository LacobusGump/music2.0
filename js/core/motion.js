/**
 * GUMP MOTION BRAIN — Neuromorphic Motion Intelligence
 *
 * Raw sensor data → Kalman filtered → gravity subtracted → multi-timescale
 * ring buffers → LIF spiking neurons → void state machine → motion signature.
 *
 * Memory IS compute. Each buffer computes its own statistics locally.
 * Neurons fire events. The conductor listens and makes music.
 */

const GumpMotionBrain = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        // Kalman filter
        kalmanR: 0.5,       // measurement noise
        kalmanQ: 0.1,       // process noise

        // Gravity estimation (complementary filter)
        gravityAlpha: 0.98,

        // Deadzone for stillness
        deadzone: 0.15,

        // Buffer sizes — Fibonacci numbers (samples at ~60fps)
        microSize: 5,       // ~83ms (fib 5)
        shortSize: 34,      // ~567ms (fib 34)
        mediumSize: 233,    // ~3.9s (fib 233)
        longSize: 1597,     // ~26.6s (fib 1597)

        // Void state thresholds (seconds)
        voidSettleTime: 2,
        voidDeepTime: 5,
        voidTranscendTime: 15,

        // Signature save interval (ms)
        signatureSaveInterval: 30000,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // 1D KALMAN FILTER
    // ═══════════════════════════════════════════════════════════════════════

    function createKalman() {
        let x = 0;         // state estimate
        let p = 1;         // estimate covariance
        const R = CONFIG.kalmanR;
        const Q = CONFIG.kalmanQ;

        return {
            update(measurement) {
                // Predict
                p = p + Q;
                // Update
                const k = p / (p + R);
                x = x + k * (measurement - x);
                p = (1 - k) * p;
                return x;
            },
            get value() { return x; },
            reset() { x = 0; p = 1; }
        };
    }

    const kalmanX = createKalman();
    const kalmanY = createKalman();
    const kalmanZ = createKalman();

    // ═══════════════════════════════════════════════════════════════════════
    // GRAVITY ESTIMATION (complementary filter)
    // ═══════════════════════════════════════════════════════════════════════

    const gravity = { x: 0, y: 0, z: 9.81 };
    const linearAccel = { x: 0, y: 0, z: 0 };

    function subtractGravity(filtered) {
        const a = CONFIG.gravityAlpha;
        gravity.x = a * gravity.x + (1 - a) * filtered.x;
        gravity.y = a * gravity.y + (1 - a) * filtered.y;
        gravity.z = a * gravity.z + (1 - a) * filtered.z;

        linearAccel.x = filtered.x - gravity.x;
        linearAccel.y = filtered.y - gravity.y;
        linearAccel.z = filtered.z - gravity.z;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MULTI-TIMESCALE RING BUFFERS — Memory IS Compute
    // ═══════════════════════════════════════════════════════════════════════

    class MotionBuffer {
        constructor(size) {
            this.size = size;
            this.data = new Float32Array(size);
            this.head = 0;
            this.count = 0;
            this._sum = 0;
            this._sumSq = 0;
            this._peak = 0;
            this._peakDecay = 0.995;

            // For zero-crossing detection
            this._lastSign = 0;
            this._zeroCrossings = 0;
            this._zcWindow = Math.min(size, 60); // count over last ~1s max
            this._zcHistory = new Float32Array(this._zcWindow);
            this._zcHead = 0;
            this._zcCount = 0;
        }

        push(value) {
            // Remove oldest from running sums if buffer full
            if (this.count >= this.size) {
                const oldest = this.data[this.head];
                this._sum -= oldest;
                this._sumSq -= oldest * oldest;
            }

            // Write new value
            this.data[this.head] = value;
            this._sum += value;
            this._sumSq += value * value;

            // Peak tracking with decay
            const absVal = Math.abs(value);
            if (absVal > this._peak) {
                this._peak = absVal;
            } else {
                this._peak *= this._peakDecay;
            }

            // Zero-crossing detection
            const sign = value > 0.01 ? 1 : (value < -0.01 ? -1 : 0);
            let crossed = 0;
            if (sign !== 0 && this._lastSign !== 0 && sign !== this._lastSign) {
                crossed = 1;
            }
            if (sign !== 0) this._lastSign = sign;

            // Track zero crossings in sliding window
            if (this._zcCount >= this._zcWindow) {
                const oldestZc = this._zcHistory[this._zcHead];
                this._zeroCrossings -= oldestZc;
            }
            this._zcHistory[this._zcHead] = crossed;
            this._zeroCrossings += crossed;
            this._zcHead = (this._zcHead + 1) % this._zcWindow;
            if (this._zcCount < this._zcWindow) this._zcCount++;

            // Advance
            this.head = (this.head + 1) % this.size;
            if (this.count < this.size) this.count++;
        }

        get mean() {
            return this.count > 0 ? this._sum / this.count : 0;
        }

        get variance() {
            if (this.count < 2) return 0;
            const mean = this.mean;
            return Math.max(0, this._sumSq / this.count - mean * mean);
        }

        get energy() {
            // RMS
            return this.count > 0 ? Math.sqrt(this._sumSq / this.count) : 0;
        }

        get peak() {
            return this._peak;
        }

        get zeroCrossings() {
            return this._zeroCrossings;
        }

        getFrequencyEstimate() {
            // Frequency ≈ zeroCrossings / (2 * windowDuration)
            // At 60fps, zcWindow samples = zcWindow/60 seconds
            if (this._zcCount < 4) return 0;
            const windowSec = this._zcCount / 60;
            return this._zeroCrossings / (2 * windowSec);
        }

        // Get the last N values (newest first)
        recent(n) {
            const result = [];
            const count = Math.min(n, this.count);
            for (let i = 0; i < count; i++) {
                const idx = (this.head - 1 - i + this.size) % this.size;
                result.push(this.data[idx]);
            }
            return result;
        }
    }

    const micro = new MotionBuffer(CONFIG.microSize);
    const short = new MotionBuffer(CONFIG.shortSize);
    const medium = new MotionBuffer(CONFIG.mediumSize);
    const long = new MotionBuffer(CONFIG.longSize);

    // Axis-specific short buffers for cross-product computation
    const shortX = new MotionBuffer(CONFIG.shortSize);
    const shortY = new MotionBuffer(CONFIG.shortSize);
    const shortZ = new MotionBuffer(CONFIG.shortSize);

    // ═══════════════════════════════════════════════════════════════════════
    // LIF SPIKING NEURONS — Gesture Detection
    // ═══════════════════════════════════════════════════════════════════════

    class LIFNeuron {
        constructor(name, leak, threshold, refractoryPeriod) {
            this.name = name;
            this.membrane = 0;
            this.leak = leak;
            this.threshold = threshold;
            this.refractoryPeriod = refractoryPeriod;
            this.refractoryCounter = 0;
            this.spikeHistory = [];     // timestamps of recent spikes
            this.maxHistory = 30;
            this.lastSpikeTime = 0;
        }

        integrate(input, timestamp) {
            // Refractory period
            if (this.refractoryCounter > 0) {
                this.refractoryCounter--;
                this.membrane *= 0.5; // fast decay during refractory
                return false;
            }

            // Leaky integration
            this.membrane = this.membrane * this.leak + Math.max(0, input);

            // Fire?
            if (this.membrane >= this.threshold) {
                this.membrane = 0;
                this.refractoryCounter = this.refractoryPeriod;
                this.lastSpikeTime = timestamp;
                this.spikeHistory.push(timestamp);
                if (this.spikeHistory.length > this.maxHistory) {
                    this.spikeHistory.shift();
                }
                return true;
            }

            return false;
        }

        get firingRate() {
            // Spikes per second over last 2 seconds
            if (this.spikeHistory.length < 2) return 0;
            const now = this.spikeHistory[this.spikeHistory.length - 1];
            const cutoff = now - 2000;
            let count = 0;
            for (let i = this.spikeHistory.length - 1; i >= 0; i--) {
                if (this.spikeHistory[i] >= cutoff) count++;
                else break;
            }
            return count / 2;
        }

        get active() {
            return this.refractoryCounter > 0 || this.membrane > this.threshold * 0.5;
        }
    }

    // Seven neurons — seven gesture types
    const neurons = {
        stillness:  new LIFNeuron('stillness', 0.98, 0.5, 30),
        shake:      new LIFNeuron('shake', 0.90, 1.2, 15),
        sweep:      new LIFNeuron('sweep', 0.92, 0.8, 12),
        circle:     new LIFNeuron('circle', 0.93, 1.0, 20),
        pendulum:   new LIFNeuron('pendulum', 0.95, 1.0, 20),
        rock:       new LIFNeuron('rock', 0.96, 0.7, 25),
        toss:       new LIFNeuron('toss', 0.85, 1.5, 30),
    };

    // Previous acceleration vector for cross-product (circle detection)
    let prevAccelVec = { x: 0, y: 0, z: 0 };

    // Tilt tracking for rock detection
    let tiltAmplitude = 0;
    let lastOrientation = { alpha: 0, beta: 0, gamma: 0 };

    function computeNeuronInputs(magnitude, timestamp) {
        const freqEst = short.getFrequencyEstimate();
        const shortMean = short.mean;
        const shortVar = short.variance;
        const shortEnergy = short.energy;
        const medEnergy = medium.energy;

        // ── stillness: fires when nothing moves ──
        const stillnessInput = 1 - Math.min(1, shortEnergy / CONFIG.deadzone);

        // ── shake: high-frequency oscillation ──
        const shakeInput = shortVar * freqEst * 0.3;

        // ── sweep: smooth unidirectional motion ──
        const absMean = Math.abs(shortMean);
        const sweepInput = absMean > 0.01 ?
            absMean * (1 - Math.min(1, shortVar / (absMean + 0.001))) : 0;

        // ── circle: cross-product of successive accel vectors ──
        const cx = prevAccelVec.y * linearAccel.z - prevAccelVec.z * linearAccel.y;
        const cy = prevAccelVec.z * linearAccel.x - prevAccelVec.x * linearAccel.z;
        const cz = prevAccelVec.x * linearAccel.y - prevAccelVec.y * linearAccel.x;
        const crossMag = Math.sqrt(cx * cx + cy * cy + cz * cz);
        const circleInput = crossMag * 0.5;

        // ── pendulum: periodic back-and-forth ──
        const periodicity = freqEst > 0.3 && freqEst < 3.0 ? 1 : 0.2;
        const pendulumInput = shortEnergy * periodicity * 0.5;

        // ── rock: gentle periodic tilt ──
        const gentleEnough = medEnergy < 0.5 ? 1 : 0;
        const rockInput = tiltAmplitude * gentleEnough * 1.5;

        // ── toss: sudden spike then freefall ──
        const tossInput = (micro.peak > 3 && shortMean < 0.5) ? 2.0 : 0;

        // Integrate all neurons
        const inputs = {
            stillness: stillnessInput,
            shake: shakeInput,
            sweep: sweepInput,
            circle: circleInput,
            pendulum: pendulumInput,
            rock: rockInput,
            toss: tossInput,
        };

        for (const [name, neuron] of Object.entries(neurons)) {
            const fired = neuron.integrate(inputs[name], timestamp);
            if (fired && typeof GumpEvents !== 'undefined') {
                GumpEvents.emit('motion.spike', {
                    neuron: name,
                    firingRate: neuron.firingRate,
                    energy: shortEnergy,
                    magnitude: magnitude,
                });
            }
        }

        // Update previous accel vector
        prevAccelVec.x = linearAccel.x;
        prevAccelVec.y = linearAccel.y;
        prevAccelVec.z = linearAccel.z;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOID STATE MACHINE — Stillness as the Sacred
    // ═══════════════════════════════════════════════════════════════════════

    const VOID_STATES = { PRESENT: 0, SETTLING: 1, VOID: 2, TRANSCENDENT: 3 };

    const voidMachine = {
        state: VOID_STATES.PRESENT,
        stillnessTimer: 0,      // seconds of accumulated stillness
        depth: 0,               // 0-1 continuous void depth
        breathPhase: 0,         // 0-2π cyclic breath
        breathRate: 0.15,       // Hz — one breath every ~7 seconds
        lastUpdateTime: 0,
    };

    function updateVoidState(magnitude, timestamp) {
        const dt = voidMachine.lastUpdateTime > 0 ?
            (timestamp - voidMachine.lastUpdateTime) / 1000 : 0.016;
        voidMachine.lastUpdateTime = timestamp;

        const isStill = magnitude < CONFIG.deadzone;

        if (isStill) {
            // Accumulate stillness
            voidMachine.stillnessTimer += dt;
        } else {
            // Decay stillness (gradual exit, not instant reset)
            voidMachine.stillnessTimer *= 0.5;
        }

        // Clamp
        voidMachine.stillnessTimer = Math.max(0, Math.min(60, voidMachine.stillnessTimer));

        // State transitions
        const t = voidMachine.stillnessTimer;
        let newState = VOID_STATES.PRESENT;
        let targetDepth = 0;

        if (t >= CONFIG.voidTranscendTime) {
            newState = VOID_STATES.TRANSCENDENT;
            targetDepth = 1.0;
        } else if (t >= CONFIG.voidDeepTime) {
            newState = VOID_STATES.VOID;
            // Interpolate 0.5 to 1.0 over deep->transcend range
            const progress = (t - CONFIG.voidDeepTime) /
                (CONFIG.voidTranscendTime - CONFIG.voidDeepTime);
            targetDepth = 0.5 + progress * 0.5;
        } else if (t >= CONFIG.voidSettleTime) {
            newState = VOID_STATES.SETTLING;
            // Interpolate 0 to 0.5 over settle->deep range
            const progress = (t - CONFIG.voidSettleTime) /
                (CONFIG.voidDeepTime - CONFIG.voidSettleTime);
            targetDepth = progress * 0.5;
        }

        // Smooth depth changes
        voidMachine.depth += (targetDepth - voidMachine.depth) * 0.05;

        // Emit state change
        if (newState !== voidMachine.state) {
            const prevState = voidMachine.state;
            voidMachine.state = newState;
            if (typeof GumpEvents !== 'undefined') {
                GumpEvents.emit('motion.void', {
                    state: newState,
                    prevState: prevState,
                    depth: voidMachine.depth,
                    stillnessTime: t,
                });
            }
        }

        // Breath cycle (continuous, used for filter modulation in void)
        voidMachine.breathPhase =
            (voidMachine.breathPhase + dt * voidMachine.breathRate * Math.PI * 2) %
            (Math.PI * 2);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MOTION SIGNATURE — Personal Fingerprint
    // ═══════════════════════════════════════════════════════════════════════

    const signature = {
        avgEnergy: 0,
        avgFrequency: 0,
        peakVariance: 0,
        preferredAxis: 'none',
        gestureProfile: {},     // neuron name -> spike count
        sampleCount: 0,
        isReturning: false,
    };

    let lastSignatureSave = 0;

    function loadSignature() {
        try {
            const saved = localStorage.getItem('gump_motion_signature');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(signature, parsed);
                signature.isReturning = true;
                console.log('[MotionBrain] Returning user detected — signature loaded');
            }
        } catch (e) {
            // localStorage unavailable — that's fine
        }
    }

    function saveSignature() {
        try {
            localStorage.setItem('gump_motion_signature', JSON.stringify({
                avgEnergy: signature.avgEnergy,
                avgFrequency: signature.avgFrequency,
                peakVariance: signature.peakVariance,
                preferredAxis: signature.preferredAxis,
                gestureProfile: signature.gestureProfile,
                sampleCount: signature.sampleCount,
                isReturning: true,
            }));
        } catch (e) {
            // localStorage unavailable
        }
    }

    function updateSignature(timestamp) {
        signature.sampleCount++;
        const n = signature.sampleCount;
        const alpha = Math.min(0.01, 1 / n); // slow running average

        signature.avgEnergy = signature.avgEnergy * (1 - alpha) + short.energy * alpha;
        signature.avgFrequency = signature.avgFrequency * (1 - alpha) +
            short.getFrequencyEstimate() * alpha;

        const currentVar = short.variance;
        if (currentVar > signature.peakVariance) {
            signature.peakVariance = signature.peakVariance * 0.99 + currentVar * 0.01;
        }

        // Preferred axis
        const ax = Math.abs(linearAccel.x);
        const ay = Math.abs(linearAccel.y);
        const az = Math.abs(linearAccel.z);
        if (ax > ay && ax > az) signature.preferredAxis = 'x';
        else if (ay > ax && ay > az) signature.preferredAxis = 'y';
        else signature.preferredAxis = 'z';

        // Track neuron spikes in profile
        for (const [name, neuron] of Object.entries(neurons)) {
            if (neuron.refractoryCounter === neuron.refractoryPeriod) {
                // Just fired this frame
                signature.gestureProfile[name] =
                    (signature.gestureProfile[name] || 0) + 1;
            }
        }

        // Periodic save
        if (timestamp - lastSignatureSave > CONFIG.signatureSaveInterval) {
            saveSignature();
            lastSignatureSave = timestamp;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN PROCESS — Called every device motion event
    // ═══════════════════════════════════════════════════════════════════════

    let initialized = false;

    function init() {
        loadSignature();
        initialized = true;
        console.log('[MotionBrain] Initialized — 7 neurons, 4 timescales, void state machine');
    }

    function process(rawAccel, orientation, timestamp) {
        if (!initialized) init();

        // 1. Kalman filter each axis
        const filtered = {
            x: kalmanX.update(rawAccel.x || 0),
            y: kalmanY.update(rawAccel.y || 0),
            z: kalmanZ.update(rawAccel.z || 0),
        };

        // 2. Subtract gravity → linear acceleration
        subtractGravity(filtered);

        // 3. Compute magnitude
        const magnitude = Math.sqrt(
            linearAccel.x * linearAccel.x +
            linearAccel.y * linearAccel.y +
            linearAccel.z * linearAccel.z
        );

        // 4. Push to all buffers (magnitude for scalar, per-axis for vector ops)
        micro.push(magnitude);
        short.push(magnitude);
        medium.push(magnitude);
        long.push(magnitude);

        shortX.push(linearAccel.x);
        shortY.push(linearAccel.y);
        shortZ.push(linearAccel.z);

        // 5. Update tilt amplitude from orientation
        if (orientation) {
            const db = Math.abs((orientation.beta || 0) - lastOrientation.beta);
            const dg = Math.abs((orientation.gamma || 0) - lastOrientation.gamma);
            tiltAmplitude = tiltAmplitude * 0.9 + (db + dg) * 0.1;
            lastOrientation.alpha = orientation.alpha || 0;
            lastOrientation.beta = orientation.beta || 0;
            lastOrientation.gamma = orientation.gamma || 0;
        }

        // 6. Compute neuron inputs and integrate
        computeNeuronInputs(magnitude, timestamp);

        // 7. Update void state
        updateVoidState(magnitude, timestamp);

        // 8. Update motion signature
        updateSignature(timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,
        process,
        CONFIG,

        get neurons() { return neurons; },
        get micro() { return micro; },
        get short() { return short; },
        get medium() { return medium; },
        get long() { return long; },

        get voidState() { return voidMachine.state; },
        get voidDepth() { return voidMachine.depth; },
        get voidBreathPhase() { return voidMachine.breathPhase; },
        get voidStillnessTime() { return voidMachine.stillnessTimer; },
        VOID_STATES,

        get linearAccel() { return linearAccel; },
        get signature() { return signature; },
        get isReturningUser() { return signature.isReturning; },
    });

})();

if (typeof window !== 'undefined') {
    window.GumpMotionBrain = GumpMotionBrain;
}
