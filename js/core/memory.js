/**
 * GUMP NEUROMORPHIC MEMORY — Learn, Predict, Remember
 *
 * STDP: learns which gestures co-fire (the system discovers YOUR patterns).
 * Echo State Network: predicts next-moment intensity (surprise drives music).
 * Session + Cross-Session persistence: the machine remembers you.
 */

const GumpNeuromorphicMemory = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // STDP — Spike-Timing Dependent Plasticity
    // ═══════════════════════════════════════════════════════════════════════

    const NEURON_NAMES = ['stillness', 'shake', 'sweep', 'circle', 'pendulum', 'rock', 'toss'];
    const N = NEURON_NAMES.length;

    // Connection weight matrix: weights[i][j] = strength of i→j connection
    const weights = [];
    for (let i = 0; i < N; i++) {
        weights.push(new Float32Array(N)); // initialized to 0
    }

    // Last spike time per neuron (ms timestamp)
    const lastSpikeTime = new Float32Array(N);

    // STDP parameters
    const STDP = {
        tauPlus: 200,       // ms — causal window
        tauMinus: 200,      // ms — anti-causal window
        aPlus: 0.05,        // learning rate (strengthen)
        aMinus: 0.025,      // learning rate (weaken)
        weightDecay: 0.9999, // per-tick slow decay toward zero
        minWeight: -0.5,
        maxWeight: 1.0,
    };

    function updateSTDP(neuronName, timestamp) {
        const idx = NEURON_NAMES.indexOf(neuronName);
        if (idx === -1) return;

        // This neuron just fired at `timestamp`
        // Check all other neurons for timing-based learning
        for (let j = 0; j < N; j++) {
            if (j === idx) continue;

            const dt = timestamp - lastSpikeTime[j];

            if (dt > 0 && dt < STDP.tauPlus && lastSpikeTime[j] > 0) {
                // j fired before idx (causal): strengthen j→idx
                const dw = STDP.aPlus * Math.exp(-dt / STDP.tauPlus);
                weights[j][idx] = Math.min(STDP.maxWeight, weights[j][idx] + dw);
            }

            if (dt > 0 && dt < STDP.tauMinus && lastSpikeTime[j] > 0) {
                // idx fired before j would be anti-causal for idx→j
                // But since idx is firing NOW, weaken idx→j for neurons that fired recently
                const dw = STDP.aMinus * Math.exp(-dt / STDP.tauMinus);
                weights[idx][j] = Math.max(STDP.minWeight, weights[idx][j] - dw);
            }
        }

        lastSpikeTime[idx] = timestamp;
    }

    function decayWeights() {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                weights[i][j] *= STDP.weightDecay;
            }
        }
    }

    function getWeightSnapshot() {
        const snap = [];
        for (let i = 0; i < N; i++) {
            snap.push(Array.from(weights[i]));
        }
        return snap;
    }

    function loadWeightSnapshot(snap) {
        if (!snap || snap.length !== N) return;
        for (let i = 0; i < N; i++) {
            if (snap[i] && snap[i].length === N) {
                for (let j = 0; j < N; j++) {
                    weights[i][j] = snap[i][j];
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ECHO STATE NETWORK — Predict Next-Moment Intensity
    // ═══════════════════════════════════════════════════════════════════════

    const ESN = {
        reservoirSize: 32,
        inputSize: 5,       // [linearMag, energy, voidDepth, dominantNeuron, tiltMag]
        outputSize: 1,      // predicted intensity

        // Reservoir state
        state: null,
        // Reservoir weights (random, sparse, fixed)
        W: null,
        // Input weights (random, fixed)
        Win: null,
        // Output weights (trained online)
        Wout: null,

        spectralRadius: 0.9,
        sparsity: 0.8,      // 80% zeros = 20% density
        leakRate: 0.3,
        learningRate: 0.001,

        prediction: 0,
        actual: 0,
        surprise: 0,
        initialized: false,
    };

    function initESN() {
        const R = ESN.reservoirSize;
        const I = ESN.inputSize;

        ESN.state = new Float32Array(R);

        // Random sparse reservoir weights
        ESN.W = [];
        for (let i = 0; i < R; i++) {
            ESN.W.push(new Float32Array(R));
            for (let j = 0; j < R; j++) {
                if (Math.random() > ESN.sparsity) {
                    ESN.W[i][j] = (Math.random() * 2 - 1);
                }
            }
        }

        // Scale to spectral radius (approximate)
        // For sparse random matrices, max eigenvalue ~ sqrt(density * R)
        const approxEig = Math.sqrt((1 - ESN.sparsity) * R);
        const scale = ESN.spectralRadius / (approxEig || 1);
        for (let i = 0; i < R; i++) {
            for (let j = 0; j < R; j++) {
                ESN.W[i][j] *= scale;
            }
        }

        // Random input weights
        ESN.Win = [];
        for (let i = 0; i < R; i++) {
            ESN.Win.push(new Float32Array(I));
            for (let j = 0; j < I; j++) {
                ESN.Win[i][j] = (Math.random() * 2 - 1) * 0.5;
            }
        }

        // Output weights (initially zero, learned online)
        ESN.Wout = new Float32Array(R);

        ESN.initialized = true;
    }

    function stepESN(input) {
        if (!ESN.initialized) initESN();

        const R = ESN.reservoirSize;
        const newState = new Float32Array(R);

        // Reservoir update: state = (1-leak)*state + leak * tanh(Win*input + W*state)
        for (let i = 0; i < R; i++) {
            let activation = 0;

            // Input contribution
            for (let j = 0; j < ESN.inputSize; j++) {
                activation += ESN.Win[i][j] * (input[j] || 0);
            }

            // Recurrent contribution
            for (let j = 0; j < R; j++) {
                activation += ESN.W[i][j] * ESN.state[j];
            }

            newState[i] = (1 - ESN.leakRate) * ESN.state[i] +
                ESN.leakRate * Math.tanh(activation);
        }

        ESN.state = newState;

        // Compute prediction: Wout * state
        let pred = 0;
        for (let i = 0; i < R; i++) {
            pred += ESN.Wout[i] * ESN.state[i];
        }
        ESN.prediction = Math.max(0, Math.min(1, pred));

        return ESN.prediction;
    }

    function trainESN(actual) {
        if (!ESN.initialized) return;

        ESN.actual = actual;
        const error = actual - ESN.prediction;
        ESN.surprise = Math.abs(error);

        // Simple gradient descent on output weights
        const R = ESN.reservoirSize;
        for (let i = 0; i < R; i++) {
            ESN.Wout[i] += ESN.learningRate * error * ESN.state[i];
            // Clamp to prevent divergence
            ESN.Wout[i] = Math.max(-2, Math.min(2, ESN.Wout[i]));
        }
    }

    function getESNWeightSnapshot() {
        return ESN.initialized ? Array.from(ESN.Wout) : null;
    }

    function loadESNWeightSnapshot(snap) {
        if (!ESN.initialized) initESN();
        if (snap && snap.length === ESN.reservoirSize) {
            for (let i = 0; i < ESN.reservoirSize; i++) {
                ESN.Wout[i] = snap[i];
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SESSION MEMORY
    // ═══════════════════════════════════════════════════════════════════════

    const sessionMemory = {
        totalMotion: 0,
        peakEnergy: 0,
        dominantGestures: {},   // name -> count
        voidEntries: 0,
        gestureSequence: [],    // last 50 gesture names
        newGesturesDiscovered: [],
        startTime: Date.now(),
    };

    function recordGesture(name) {
        sessionMemory.dominantGestures[name] =
            (sessionMemory.dominantGestures[name] || 0) + 1;

        sessionMemory.gestureSequence.push(name);
        if (sessionMemory.gestureSequence.length > 50) {
            sessionMemory.gestureSequence.shift();
        }

        // Check if this is a new gesture for this user
        if (personalProfile.knownGestures &&
            !personalProfile.knownGestures.includes(name)) {
            personalProfile.knownGestures.push(name);
            sessionMemory.newGesturesDiscovered.push(name);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PERSONAL PROFILE — Cross-Session Persistence
    // ═══════════════════════════════════════════════════════════════════════

    const personalProfile = {
        lifetimeSessions: 0,
        gestureFrequency: {},   // name -> lifetime count
        knownGestures: [],
        favoriteGesture: null,
        connectionWeightsSnapshot: null,
        esnWeightsSnapshot: null,
        firstSeenTimestamp: null,
        lastSeenTimestamp: null,
        totalLifetimeMotion: 0,
    };

    let lastProfileSave = 0;
    const PROFILE_SAVE_INTERVAL = 30000;

    function loadProfile() {
        try {
            const saved = localStorage.getItem('gump_neuro_profile');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(personalProfile, parsed);

                // Restore STDP weights
                if (personalProfile.connectionWeightsSnapshot) {
                    loadWeightSnapshot(personalProfile.connectionWeightsSnapshot);
                }

                // Restore ESN output weights
                if (personalProfile.esnWeightsSnapshot) {
                    loadESNWeightSnapshot(personalProfile.esnWeightsSnapshot);
                }

                console.log('[NeuroMemory] Profile loaded —',
                    personalProfile.lifetimeSessions, 'sessions,',
                    personalProfile.knownGestures.length, 'known gestures');
                return true;
            }
        } catch (e) {
            // localStorage unavailable
        }
        return false;
    }

    function saveProfile() {
        try {
            personalProfile.lastSeenTimestamp = Date.now();
            personalProfile.connectionWeightsSnapshot = getWeightSnapshot();
            personalProfile.esnWeightsSnapshot = getESNWeightSnapshot();

            // Update lifetime gesture frequency from session
            for (const [name, count] of Object.entries(sessionMemory.dominantGestures)) {
                personalProfile.gestureFrequency[name] =
                    (personalProfile.gestureFrequency[name] || 0) + count;
            }

            // Find favorite gesture
            let maxCount = 0;
            for (const [name, count] of Object.entries(personalProfile.gestureFrequency)) {
                if (count > maxCount) {
                    maxCount = count;
                    personalProfile.favoriteGesture = name;
                }
            }

            localStorage.setItem('gump_neuro_profile', JSON.stringify(personalProfile));
        } catch (e) {
            // localStorage unavailable
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN BREAK DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function detectPatternBreak() {
        const seq = sessionMemory.gestureSequence;
        if (seq.length < 10) return false;

        // Compare last 3 gestures to previous 7
        const recent = seq.slice(-3);
        const previous = seq.slice(-10, -3);

        const previousTypes = new Set(previous);
        let novelCount = 0;

        for (const g of recent) {
            if (!previousTypes.has(g)) {
                novelCount++;
            }
        }

        return novelCount >= 2;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INIT + LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════

    let initialized = false;

    function init() {
        if (initialized) return;

        initESN();
        const hadProfile = loadProfile();

        if (!hadProfile) {
            personalProfile.firstSeenTimestamp = Date.now();
        }

        personalProfile.lifetimeSessions++;
        personalProfile.lastSeenTimestamp = Date.now();

        // Register spike listener to update STDP
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('motion.spike', function(data) {
                updateSTDP(data.neuron, Date.now());
                recordGesture(data.neuron);
                decayWeights();
            });

            // Track void entries
            GumpEvents.on('motion.void', function(data) {
                if (data.state >= 2) { // VOID or TRANSCENDENT
                    sessionMemory.voidEntries++;
                }
            });
        }

        // Save on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', function() {
                saveProfile();
            });

            // Also try visibilitychange for mobile
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    saveProfile();
                }
            });
        }

        initialized = true;
        console.log('[NeuroMemory] Initialized — STDP, ESN(32), session tracking',
            hadProfile ? '(returning user)' : '(new user)');
    }

    function tick(timestamp) {
        // Periodic profile save
        if (timestamp - lastProfileSave > PROFILE_SAVE_INTERVAL) {
            saveProfile();
            lastProfileSave = timestamp;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STDP PREDICTION — Expose learned gesture associations
    // ═══════════════════════════════════════════════════════════════════════

    function getPrediction(lastGestureName) {
        const idx = NEURON_NAMES.indexOf(lastGestureName);
        if (idx === -1) return { gesture: null, confidence: 0 };

        // Scan the STDP weight row for lastGesture: weights[idx][j]
        // The strongest positive weight indicates the most likely next gesture
        let bestIdx = -1;
        let bestWeight = 0;

        for (let j = 0; j < N; j++) {
            if (j === idx) continue; // skip self-connection
            if (weights[idx][j] > bestWeight) {
                bestWeight = weights[idx][j];
                bestIdx = j;
            }
        }

        if (bestIdx === -1 || bestWeight < 0.01) {
            return { gesture: null, confidence: 0 };
        }

        // Confidence = weight normalized to maxWeight
        const confidence = Math.min(1, bestWeight / STDP.maxWeight);
        return { gesture: NEURON_NAMES[bestIdx], confidence: confidence };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,
        tick,

        // STDP
        updateSTDP,
        getPrediction,

        // ESN
        stepESN,
        trainESN,

        // Session
        recordGesture,
        detectPatternBreak,

        // Getters
        get surprise() { return ESN.surprise; },
        get prediction() { return ESN.prediction; },
        get sessionMemory() { return sessionMemory; },
        get personalProfile() { return personalProfile; },
        get isReturningUser() { return personalProfile.lifetimeSessions > 1; },
        get newGesturesThisSession() { return sessionMemory.newGesturesDiscovered; },
        get weights() { return weights; },
        get neuronNames() { return NEURON_NAMES.slice(); },
    });

})();

if (typeof window !== 'undefined') {
    window.GumpNeuromorphicMemory = GumpNeuromorphicMemory;
}
