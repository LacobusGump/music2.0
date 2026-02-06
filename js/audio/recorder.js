/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP RECORDER - Note Sequence Capture
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Captures note sequences as you play, quantizes them, and extracts
 * melodic contours for phrase recognition and playback.
 *
 * Works with persistence.js to save phrases between sessions.
 */

const GumpRecorder = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        recording: false,
        currentPhrase: [],
        startTime: 0,

        // Config
        quantizeSteps: 16,          // Quantize to 16th notes
        minPhraseNotes: 3,          // Minimum notes for a valid phrase
        maxPhraseLength: 8000,      // Max phrase length in ms
        autoStopTimeout: null,

        // Callback
        onPhraseComplete: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RECORDING
    // ═══════════════════════════════════════════════════════════════════════

    function startPhrase() {
        if (state.recording) return;

        state.recording = true;
        state.startTime = performance.now();
        state.currentPhrase = [];

        // Auto-stop after max length
        if (state.autoStopTimeout) {
            clearTimeout(state.autoStopTimeout);
        }
        state.autoStopTimeout = setTimeout(() => {
            endPhrase();
        }, state.maxPhraseLength);

        console.log('[Recorder] Phrase recording started');
    }

    function endPhrase() {
        if (!state.recording) return null;

        state.recording = false;

        if (state.autoStopTimeout) {
            clearTimeout(state.autoStopTimeout);
            state.autoStopTimeout = null;
        }

        // Check if phrase is valid
        if (state.currentPhrase.length < state.minPhraseNotes) {
            console.log('[Recorder] Phrase too short, discarding');
            state.currentPhrase = [];
            return null;
        }

        // Process the phrase
        const processed = processPhrase(state.currentPhrase);

        console.log(`[Recorder] Phrase complete: ${processed.notes.length} notes`);

        // Callback
        if (state.onPhraseComplete) {
            state.onPhraseComplete(processed);
        }

        // Save to persistence if available
        if (typeof GumpPersistence !== 'undefined') {
            GumpPersistence.addPhrase(processed);
        }

        // Clear for next phrase
        state.currentPhrase = [];

        return processed;
    }

    function recordNote(note, velocity, position) {
        if (!state.recording) return;

        const timestamp = performance.now() - state.startTime;

        state.currentPhrase.push({
            note,                              // MIDI note number
            velocity: velocity || 0.8,         // 0-1
            position: position ? { x: position.x, y: position.y } : null,
            timestamp
        });
    }

    function recordEvent(type, data) {
        if (!state.recording) return;

        const timestamp = performance.now() - state.startTime;

        state.currentPhrase.push({
            type,
            data,
            timestamp
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHRASE PROCESSING
    // ═══════════════════════════════════════════════════════════════════════

    function processPhrase(rawNotes) {
        if (!rawNotes || rawNotes.length === 0) {
            return { notes: [], contour: 'static', energy: 0 };
        }

        // Filter to only note events (not other events)
        const notes = rawNotes.filter(n => typeof n.note === 'number');

        if (notes.length === 0) {
            return { notes: [], contour: 'static', energy: 0 };
        }

        // Calculate phrase duration
        const duration = notes[notes.length - 1].timestamp - notes[0].timestamp;

        // Quantize to beat grid
        const quantized = quantizeNotes(notes, duration);

        // Extract contour
        const contour = extractContour(notes);

        // Calculate energy
        const energy = calculateEnergy(notes, duration);

        // Calculate intervals
        const intervals = calculateIntervals(notes);

        return {
            notes: quantized,
            rawNotes: notes,
            contour,
            energy,
            intervals,
            duration,
            noteCount: notes.length,
            timestamp: Date.now()
        };
    }

    function quantizeNotes(notes, duration) {
        if (!notes || notes.length === 0) return [];

        const stepSize = duration / state.quantizeSteps;

        return notes.map(note => {
            const quantizedStep = Math.round(note.timestamp / stepSize);
            return {
                note: note.note,
                velocity: note.velocity,
                step: quantizedStep,
                originalTimestamp: note.timestamp,
                quantizedTimestamp: quantizedStep * stepSize,
                position: note.position
            };
        });
    }

    function extractContour(notes) {
        if (!notes || notes.length < 2) return 'static';

        let ascending = 0;
        let descending = 0;

        for (let i = 1; i < notes.length; i++) {
            const diff = notes[i].note - notes[i-1].note;
            if (diff > 0) ascending++;
            else if (diff < 0) descending++;
        }

        const total = notes.length - 1;
        const ascRatio = ascending / total;
        const descRatio = descending / total;

        if (ascRatio > 0.6) return 'ascending';
        if (descRatio > 0.6) return 'descending';
        if (ascRatio > 0.3 && descRatio > 0.3) return 'undulating';
        return 'static';
    }

    function calculateEnergy(notes, duration) {
        if (!notes || notes.length === 0) return 0;

        // Average velocity
        const avgVelocity = notes.reduce((sum, n) => sum + (n.velocity || 0.5), 0) / notes.length;

        // Note density (notes per second)
        const durationSec = duration / 1000;
        const density = durationSec > 0 ? notes.length / durationSec : 0;

        // Combine into energy score (0-1)
        return Math.min(1, (avgVelocity * 0.5) + (density * 0.1));
    }

    function calculateIntervals(notes) {
        if (!notes || notes.length < 2) return [];

        const intervals = [];
        for (let i = 1; i < notes.length; i++) {
            intervals.push(notes[i].note - notes[i-1].note);
        }
        return intervals;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHRASE UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Transpose a phrase by semitones
     */
    function transposePhrase(phrase, semitones) {
        return {
            ...phrase,
            notes: phrase.notes.map(n => ({
                ...n,
                note: n.note + semitones
            }))
        };
    }

    /**
     * Invert a phrase (flip intervals)
     */
    function invertPhrase(phrase, pivotNote = null) {
        if (!phrase.notes || phrase.notes.length === 0) return phrase;

        const pivot = pivotNote || phrase.notes[0].note;

        return {
            ...phrase,
            notes: phrase.notes.map(n => ({
                ...n,
                note: pivot - (n.note - pivot)
            })),
            contour: phrase.contour === 'ascending' ? 'descending' :
                     phrase.contour === 'descending' ? 'ascending' :
                     phrase.contour
        };
    }

    /**
     * Retrograde (reverse) a phrase
     */
    function retrogradePhrase(phrase) {
        if (!phrase.notes || phrase.notes.length === 0) return phrase;

        const reversed = [...phrase.notes].reverse();
        const maxStep = phrase.notes[phrase.notes.length - 1].step;

        return {
            ...phrase,
            notes: reversed.map((n, i) => ({
                ...n,
                step: maxStep - phrase.notes[phrase.notes.length - 1 - i].step
            })),
            contour: phrase.contour === 'ascending' ? 'descending' :
                     phrase.contour === 'descending' ? 'ascending' :
                     phrase.contour
        };
    }

    /**
     * Augment (slow down) a phrase
     */
    function augmentPhrase(phrase, factor = 2) {
        return {
            ...phrase,
            notes: phrase.notes.map(n => ({
                ...n,
                step: n.step * factor
            })),
            duration: phrase.duration * factor
        };
    }

    /**
     * Diminish (speed up) a phrase
     */
    function diminishPhrase(phrase, factor = 2) {
        return {
            ...phrase,
            notes: phrase.notes.map(n => ({
                ...n,
                step: Math.round(n.step / factor)
            })),
            duration: phrase.duration / factor
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT HANDLING
    // ═══════════════════════════════════════════════════════════════════════

    function init() {
        // Listen for touch start/end to auto-trigger recording
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('gesture.start', () => {
                startPhrase();
            });

            GumpEvents.on('gesture.end', () => {
                // Small delay to capture final notes
                setTimeout(() => endPhrase(), 100);
            });

            GumpEvents.on('note.played', (data) => {
                recordNote(data.note, data.velocity, data.position);
            });
        }

        console.log('[Recorder] Initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,

        // Recording
        startPhrase,
        endPhrase,
        recordNote,
        recordEvent,
        get isRecording() { return state.recording; },

        // Phrase processing
        processPhrase,
        transposePhrase,
        invertPhrase,
        retrogradePhrase,
        augmentPhrase,
        diminishPhrase,

        // Config
        setQuantizeSteps: (steps) => { state.quantizeSteps = steps; },
        setMinPhraseNotes: (min) => { state.minPhraseNotes = min; },
        onPhraseComplete: (callback) => { state.onPhraseComplete = callback; },

        // State
        get currentPhrase() { return [...state.currentPhrase]; }
    });

})();

// Auto-export
if (typeof window !== 'undefined') {
    window.GumpRecorder = GumpRecorder;
}
