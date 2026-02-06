/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP AUDIO ANALYZER - Real-time Audio Analysis
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Analyzes audio in real-time for:
 * - Frequency bands (sub, bass, mid, high)
 * - Onset/transient detection
 * - Pitch estimation
 * - Energy levels
 * - Spectral characteristics
 *
 * Used to inform musical decisions and create call-and-response.
 */

const GumpAnalyzer = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        ctx: null,
        analyser: null,
        frequencyData: null,
        timeData: null,

        // Analysis results
        lastAnalysis: null,
        analysisHistory: [],
        historyMaxLength: 60,  // ~1 second at 60fps

        // Onset detection
        lastEnergy: 0,
        onsetThreshold: 0.3,
        onsetCallback: null,

        // Frequency band ranges (Hz)
        bands: {
            sub: [20, 60],
            bass: [60, 250],
            lowMid: [250, 500],
            mid: [500, 2000],
            highMid: [2000, 6000],
            high: [6000, 20000]
        },

        // Running
        running: false,
        animationFrame: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(audioContext, sourceNode) {
        state.ctx = audioContext;

        // Create analyser node
        state.analyser = audioContext.createAnalyser();
        state.analyser.fftSize = 2048;
        state.analyser.smoothingTimeConstant = 0.8;

        // Create data arrays
        state.frequencyData = new Uint8Array(state.analyser.frequencyBinCount);
        state.timeData = new Uint8Array(state.analyser.fftSize);

        // Connect to source
        if (sourceNode) {
            sourceNode.connect(state.analyser);
        }

        console.log('[Analyzer] Initialized');
    }

    function start() {
        if (state.running) return;
        state.running = true;
        analyze();
        console.log('[Analyzer] Started');
    }

    function stop() {
        state.running = false;
        if (state.animationFrame) {
            cancelAnimationFrame(state.animationFrame);
        }
        console.log('[Analyzer] Stopped');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ANALYSIS LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function analyze() {
        if (!state.running) return;

        // Get frequency and time data
        state.analyser.getByteFrequencyData(state.frequencyData);
        state.analyser.getByteTimeDomainData(state.timeData);

        // Perform analysis
        const analysis = {
            timestamp: performance.now(),

            // Frequency bands
            sub: getBandEnergy(state.bands.sub[0], state.bands.sub[1]),
            bass: getBandEnergy(state.bands.bass[0], state.bands.bass[1]),
            lowMid: getBandEnergy(state.bands.lowMid[0], state.bands.lowMid[1]),
            mid: getBandEnergy(state.bands.mid[0], state.bands.mid[1]),
            highMid: getBandEnergy(state.bands.highMid[0], state.bands.highMid[1]),
            high: getBandEnergy(state.bands.high[0], state.bands.high[1]),

            // Overall energy
            energy: calculateRMS(),

            // Spectral features
            brightness: calculateSpectralCentroid(),
            spread: calculateSpectralSpread(),

            // Pitch (dominant frequency)
            pitch: estimatePitch(),

            // Onset detection
            onset: false
        };

        // Detect onset
        const energyDelta = analysis.energy - state.lastEnergy;
        if (energyDelta > state.onsetThreshold) {
            analysis.onset = true;
            if (state.onsetCallback) {
                state.onsetCallback(analysis);
            }
        }
        state.lastEnergy = analysis.energy;

        // Store analysis
        state.lastAnalysis = analysis;
        state.analysisHistory.push(analysis);
        if (state.analysisHistory.length > state.historyMaxLength) {
            state.analysisHistory.shift();
        }

        // Continue loop
        state.animationFrame = requestAnimationFrame(analyze);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FREQUENCY ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════

    function getBandEnergy(lowHz, highHz) {
        if (!state.frequencyData || !state.ctx) return 0;

        const nyquist = state.ctx.sampleRate / 2;
        const binCount = state.analyser.frequencyBinCount;
        const binWidth = nyquist / binCount;

        const lowBin = Math.floor(lowHz / binWidth);
        const highBin = Math.min(Math.floor(highHz / binWidth), binCount - 1);

        let sum = 0;
        let count = 0;

        for (let i = lowBin; i <= highBin; i++) {
            sum += state.frequencyData[i];
            count++;
        }

        return count > 0 ? (sum / count) / 255 : 0;
    }

    function calculateRMS() {
        if (!state.timeData) return 0;

        let sum = 0;
        for (let i = 0; i < state.timeData.length; i++) {
            const sample = (state.timeData[i] - 128) / 128;
            sum += sample * sample;
        }

        return Math.sqrt(sum / state.timeData.length);
    }

    function calculateSpectralCentroid() {
        if (!state.frequencyData || !state.ctx) return 0;

        const nyquist = state.ctx.sampleRate / 2;
        const binCount = state.analyser.frequencyBinCount;

        let weightedSum = 0;
        let totalMagnitude = 0;

        for (let i = 0; i < binCount; i++) {
            const magnitude = state.frequencyData[i];
            const frequency = (i * nyquist) / binCount;
            weightedSum += magnitude * frequency;
            totalMagnitude += magnitude;
        }

        if (totalMagnitude === 0) return 0;

        // Normalize to 0-1 (based on max frequency of 10kHz for musical relevance)
        const centroid = weightedSum / totalMagnitude;
        return Math.min(1, centroid / 10000);
    }

    function calculateSpectralSpread() {
        if (!state.frequencyData || !state.ctx) return 0;

        const centroid = calculateSpectralCentroid() * 10000;
        const nyquist = state.ctx.sampleRate / 2;
        const binCount = state.analyser.frequencyBinCount;

        let spreadSum = 0;
        let totalMagnitude = 0;

        for (let i = 0; i < binCount; i++) {
            const magnitude = state.frequencyData[i];
            const frequency = (i * nyquist) / binCount;
            const diff = frequency - centroid;
            spreadSum += magnitude * diff * diff;
            totalMagnitude += magnitude;
        }

        if (totalMagnitude === 0) return 0;

        // Return normalized spread
        return Math.min(1, Math.sqrt(spreadSum / totalMagnitude) / 5000);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PITCH DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function estimatePitch() {
        if (!state.frequencyData || !state.ctx) return null;

        // Find the peak in the frequency spectrum
        let maxBin = 0;
        let maxValue = 0;

        // Focus on musical range (80Hz - 2000Hz)
        const nyquist = state.ctx.sampleRate / 2;
        const binCount = state.analyser.frequencyBinCount;
        const binWidth = nyquist / binCount;

        const lowBin = Math.floor(80 / binWidth);
        const highBin = Math.floor(2000 / binWidth);

        for (let i = lowBin; i < highBin; i++) {
            if (state.frequencyData[i] > maxValue) {
                maxValue = state.frequencyData[i];
                maxBin = i;
            }
        }

        // Only report if strong enough
        if (maxValue < 50) return null;

        const frequency = maxBin * binWidth;

        // Convert to MIDI note
        const midiNote = 12 * Math.log2(frequency / 440) + 69;

        return {
            frequency: frequency,
            midiNote: Math.round(midiNote),
            confidence: maxValue / 255
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL SUGGESTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Suggest what to play next based on current analysis
     */
    function suggestProgression() {
        const current = state.lastAnalysis;
        if (!current) return null;

        const suggestions = [];

        // If energy is building, suggest crescendo
        if (isEnergyBuilding()) {
            suggestions.push({
                type: 'crescendo',
                confidence: 0.8,
                reason: 'Energy increasing over time'
            });
        }

        // If brightness is high, suggest filter sweep down
        if (current.brightness > 0.6) {
            suggestions.push({
                type: 'darken',
                confidence: current.brightness,
                reason: 'High brightness - consider darkening'
            });
        }

        // If bass is dominant, suggest melodic counter
        if (current.bass > current.mid * 2) {
            suggestions.push({
                type: 'add_melody',
                confidence: 0.7,
                reason: 'Bass heavy - add melodic interest'
            });
        }

        // If sparse (low energy), suggest add layers
        if (current.energy < 0.2) {
            suggestions.push({
                type: 'add_layers',
                confidence: 0.6,
                reason: 'Low energy - opportunity to build'
            });
        }

        // If rhythm established (regular onsets), suggest harmonic shift
        if (hasRegularRhythm()) {
            suggestions.push({
                type: 'harmonic_shift',
                confidence: 0.7,
                reason: 'Rhythm established - ready for harmonic change'
            });
        }

        return suggestions;
    }

    function isEnergyBuilding() {
        if (state.analysisHistory.length < 10) return false;

        const recent = state.analysisHistory.slice(-10);
        let increasing = 0;

        for (let i = 1; i < recent.length; i++) {
            if (recent[i].energy > recent[i-1].energy) {
                increasing++;
            }
        }

        return increasing > 6;
    }

    function hasRegularRhythm() {
        if (state.analysisHistory.length < 30) return false;

        const onsets = state.analysisHistory
            .filter(a => a.onset)
            .map(a => a.timestamp);

        if (onsets.length < 4) return false;

        // Check for regular intervals
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i-1]);
        }

        // Calculate variance in intervals
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);

        // Low variance = regular rhythm
        return stdDev < avgInterval * 0.2;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    function getAnalysis() {
        return state.lastAnalysis;
    }

    function getHistory(count = 10) {
        return state.analysisHistory.slice(-count);
    }

    function getAverageEnergy(frames = 10) {
        const recent = state.analysisHistory.slice(-frames);
        if (recent.length === 0) return 0;

        return recent.reduce((sum, a) => sum + a.energy, 0) / recent.length;
    }

    function getAverageBrightness(frames = 10) {
        const recent = state.analysisHistory.slice(-frames);
        if (recent.length === 0) return 0;

        return recent.reduce((sum, a) => sum + a.brightness, 0) / recent.length;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,
        start,
        stop,

        // Analysis
        getAnalysis,
        getHistory,
        getAverageEnergy,
        getAverageBrightness,
        suggestProgression,

        // Onset detection
        onOnset: (callback) => { state.onsetCallback = callback; },
        setOnsetThreshold: (threshold) => { state.onsetThreshold = threshold; },

        // Direct access
        get analyser() { return state.analyser; },
        get isRunning() { return state.running; }
    });

})();

// Auto-export
if (typeof window !== 'undefined') {
    window.GumpAnalyzer = GumpAnalyzer;
}
