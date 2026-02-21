// ═══════════════════════════════════════════════════════════════════════════
// GUMP AUDIO ENGINE — Minimal AudioContext Provider
// ═══════════════════════════════════════════════════════════════════════════
//
// Provides AudioContext creation (including iOS pre-created context),
// resume/unlock, and music theory constants. All actual audio routing
// lives in conductor.js.
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpAudio = (function() {
    'use strict';

    // Music theory constants — used by multiple modules
    const SCALES = {
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10],
        pentatonic: [0, 2, 4, 7, 9],
        pentatonic_minor: [0, 3, 5, 7, 10],
        blues: [0, 3, 5, 6, 7, 10],
        dorian: [0, 2, 3, 5, 7, 9, 10],
        phrygian: [0, 1, 3, 5, 7, 8, 10],
        lydian: [0, 2, 4, 6, 7, 9, 11],
        mixolydian: [0, 2, 4, 5, 7, 9, 10],
    };

    const CHORDS = {
        major: [0, 4, 7],
        minor: [0, 3, 7],
        diminished: [0, 3, 6],
        augmented: [0, 4, 8],
        sus2: [0, 2, 7],
        sus4: [0, 5, 7],
        major7: [0, 4, 7, 11],
        minor7: [0, 3, 7, 10],
        dom7: [0, 4, 7, 10],
        add9: [0, 4, 7, 14],
        power: [0, 7, 12],
    };

    let ctx = null;
    let isInitialized = false;
    let isRunning = false;

    async function init() {
        if (isInitialized) return true;

        try {
            // Use pre-created iOS context if available
            if (window._iosAudioContext) {
                ctx = window._iosAudioContext;
                console.log('[Audio] Using pre-created iOS AudioContext');
            } else {
                ctx = new (window.AudioContext || window.webkitAudioContext)({
                    latencyHint: 'interactive',
                });
                console.log('[Audio] Created AudioContext — sr:', ctx.sampleRate);
            }

            isInitialized = true;

            if (typeof GumpEvents !== 'undefined') {
                GumpEvents.emit('audio.ready', {
                    sampleRate: ctx.sampleRate,
                    latency: ctx.baseLatency,
                });
            }

            return true;
        } catch (error) {
            console.error('[Audio] Init failed:', error);
            return false;
        }
    }

    async function start() {
        if (!isInitialized) await init();

        // iOS: resume suspended context
        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.log('[Audio] Resume failed:', e));
            await new Promise(r => setTimeout(r, 100));
        }

        // iOS silent buffer unlock
        try {
            const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start(0);
        } catch (e) { /* ignore */ }

        isRunning = true;
        console.log('[Audio] Started — state:', ctx.state);
    }

    function stop() {
        isRunning = false;
    }

    function midiToFreq(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    function freqToMidi(freq) {
        return Math.round(12 * Math.log2(freq / 440) + 69);
    }

    return Object.freeze({
        SCALES,
        CHORDS,
        init,
        start,
        stop,
        midiToFreq,
        freqToMidi,
        get context() { return ctx; },
        get isInitialized() { return isInitialized; },
        get isRunning() { return isRunning; },
    });
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpAudio;
}
