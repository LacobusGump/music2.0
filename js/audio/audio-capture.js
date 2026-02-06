/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP AUDIO CAPTURE - Raw Audio Phrase Recording
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Captures raw audio output for phrase storage and playback.
 * Works with persistence.js to save audio between sessions.
 */

const GumpAudioCapture = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        ctx: null,
        captureNode: null,
        capturing: false,

        // Ring buffer for continuous capture
        bufferSize: 4096,
        ringBuffer: [],
        ringBufferMaxSeconds: 10,

        // Current phrase capture
        phraseBuffers: [],
        phraseStartTime: 0,

        // Callbacks
        onPhraseCapture: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(audioContext, sourceNode) {
        state.ctx = audioContext;

        // Calculate max buffer entries
        const samplesPerSecond = audioContext.sampleRate;
        const buffersPerSecond = samplesPerSecond / state.bufferSize;
        const maxBuffers = Math.ceil(buffersPerSecond * state.ringBufferMaxSeconds);

        // Create capture node
        state.captureNode = audioContext.createScriptProcessor(state.bufferSize, 2, 2);

        state.captureNode.onaudioprocess = function(event) {
            // Always keep a ring buffer of recent audio
            const left = new Float32Array(event.inputBuffer.getChannelData(0));
            const right = new Float32Array(event.inputBuffer.getChannelData(1));

            state.ringBuffer.push({
                left: left,
                right: right,
                time: performance.now()
            });

            // Keep ring buffer size limited
            while (state.ringBuffer.length > maxBuffers) {
                state.ringBuffer.shift();
            }

            // Also capture to phrase buffer if actively recording
            if (state.capturing) {
                state.phraseBuffers.push({
                    left: new Float32Array(left),
                    right: new Float32Array(right),
                    time: performance.now()
                });
            }

            // Pass through audio unchanged
            event.outputBuffer.getChannelData(0).set(left);
            event.outputBuffer.getChannelData(1).set(right);
        };

        // Connect the capture node into the audio chain
        if (sourceNode) {
            sourceNode.connect(state.captureNode);
            state.captureNode.connect(audioContext.destination);
        }

        console.log('[AudioCapture] Initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHRASE CAPTURE
    // ═══════════════════════════════════════════════════════════════════════

    function startCapture() {
        state.capturing = true;
        state.phraseBuffers = [];
        state.phraseStartTime = performance.now();

        console.log('[AudioCapture] Capture started');
    }

    function stopCapture() {
        if (!state.capturing) return null;

        state.capturing = false;

        if (state.phraseBuffers.length === 0) {
            return null;
        }

        // Concatenate buffers into single audio data
        const result = concatenateBuffers(state.phraseBuffers);

        console.log(`[AudioCapture] Captured ${result.duration.toFixed(2)}s of audio`);

        // Callback
        if (state.onPhraseCapture) {
            state.onPhraseCapture(result);
        }

        // Clear phrase buffers
        state.phraseBuffers = [];

        return result;
    }

    function concatenateBuffers(buffers) {
        if (!buffers || buffers.length === 0) {
            return null;
        }

        const totalSamples = buffers.length * state.bufferSize;
        const left = new Float32Array(totalSamples);
        const right = new Float32Array(totalSamples);

        let offset = 0;
        for (const buffer of buffers) {
            left.set(buffer.left, offset);
            right.set(buffer.right, offset);
            offset += state.bufferSize;
        }

        const duration = totalSamples / state.ctx.sampleRate;

        return {
            left,
            right,
            sampleRate: state.ctx.sampleRate,
            duration,
            samples: totalSamples,
            timestamp: Date.now()
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RECENT AUDIO ACCESS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get the last N seconds of audio from the ring buffer
     */
    function getRecentAudio(seconds = 2) {
        const now = performance.now();
        const cutoff = now - (seconds * 1000);

        const recentBuffers = state.ringBuffer.filter(b => b.time >= cutoff);

        if (recentBuffers.length === 0) return null;

        return concatenateBuffers(recentBuffers);
    }

    /**
     * Get audio from a specific time window
     */
    function getAudioWindow(startTime, endTime) {
        const buffers = state.ringBuffer.filter(b =>
            b.time >= startTime && b.time <= endTime
        );

        if (buffers.length === 0) return null;

        return concatenateBuffers(buffers);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AUDIO PLAYBACK
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Play back captured audio
     */
    function playAudio(audioData, options = {}) {
        if (!audioData || !state.ctx) return null;

        const {
            volume = 0.8,
            playbackRate = 1.0,
            startTime = state.ctx.currentTime
        } = options;

        // Create buffer
        const buffer = state.ctx.createBuffer(
            2,
            audioData.samples,
            audioData.sampleRate
        );

        buffer.getChannelData(0).set(audioData.left);
        buffer.getChannelData(1).set(audioData.right);

        // Create source
        const source = state.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;

        // Gain for volume
        const gain = state.ctx.createGain();
        gain.gain.value = volume;

        source.connect(gain);
        gain.connect(state.ctx.destination);

        source.start(startTime);

        return {
            source,
            gain,
            stop: () => source.stop()
        };
    }

    /**
     * Create a loopable audio buffer source
     */
    function createLoop(audioData, options = {}) {
        if (!audioData || !state.ctx) return null;

        const {
            volume = 0.6,
            fadeIn = 0.1,
            fadeOut = 0.1
        } = options;

        // Create buffer
        const buffer = state.ctx.createBuffer(
            2,
            audioData.samples,
            audioData.sampleRate
        );

        buffer.getChannelData(0).set(audioData.left);
        buffer.getChannelData(1).set(audioData.right);

        const source = state.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gain = state.ctx.createGain();
        gain.gain.value = 0;

        // Fade in
        const now = state.ctx.currentTime;
        gain.gain.linearRampToValueAtTime(volume, now + fadeIn);

        source.connect(gain);
        gain.connect(state.ctx.destination);

        source.start();

        return {
            source,
            gain,
            stop: (fadeTime = fadeOut) => {
                const stopTime = state.ctx.currentTime + fadeTime;
                gain.gain.linearRampToValueAtTime(0, stopTime);
                source.stop(stopTime + 0.01);
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMPRESSION FOR STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Compress audio for localStorage storage
     */
    function compressForStorage(audioData) {
        if (!audioData) return null;

        // Downsample to 22kHz
        const ratio = Math.floor(audioData.sampleRate / 22050);
        const newLength = Math.floor(audioData.samples / ratio);

        const compressed = new Float32Array(newLength);

        // Average samples for downsampling
        for (let i = 0; i < newLength; i++) {
            let sum = 0;
            for (let j = 0; j < ratio; j++) {
                sum += audioData.left[i * ratio + j] || 0;
            }
            compressed[i] = sum / ratio;
        }

        // Convert to 8-bit for storage
        const int8 = new Int8Array(compressed.length);
        for (let i = 0; i < compressed.length; i++) {
            int8[i] = Math.round(compressed[i] * 127);
        }

        // Base64 encode
        let binary = '';
        const bytes = new Uint8Array(int8.buffer);
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }

        return {
            data: btoa(binary),
            sampleRate: 22050,
            samples: newLength,
            originalDuration: audioData.duration
        };
    }

    /**
     * Decompress audio from storage
     */
    function decompressFromStorage(compressed) {
        if (!compressed || !compressed.data) return null;

        const binary = atob(compressed.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const int8 = new Int8Array(bytes.buffer);
        const float32 = new Float32Array(int8.length);

        for (let i = 0; i < int8.length; i++) {
            float32[i] = int8[i] / 127;
        }

        return {
            left: float32,
            right: float32,  // Mono
            sampleRate: compressed.sampleRate,
            samples: compressed.samples,
            duration: compressed.originalDuration
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,

        // Capture
        startCapture,
        stopCapture,
        get isCapturing() { return state.capturing; },

        // Recent audio
        getRecentAudio,
        getAudioWindow,

        // Playback
        playAudio,
        createLoop,

        // Storage
        compressForStorage,
        decompressFromStorage,

        // Callbacks
        onPhraseCapture: (callback) => { state.onPhraseCapture = callback; },

        // Node access for routing
        get captureNode() { return state.captureNode; }
    });

})();

// Auto-export
if (typeof window !== 'undefined') {
    window.GumpAudioCapture = GumpAudioCapture;
}
