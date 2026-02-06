/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP PHRASE LIBRARY - Phrase Storage & Intelligence
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Stores recorded phrases and provides:
 * - Phrase similarity matching
 * - Call-and-response generation
 * - Phrase morphing/interpolation
 * - Compositional suggestions
 */

const GumpPhraseLibrary = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        phrases: [],
        maxPhrases: 32,

        // Active layers
        activeLayers: new Map(),
        maxLayers: 4,

        // Callbacks
        onPhraseAdded: null,
        onLayerChange: null
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PHRASE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    function addPhrase(phrase) {
        if (!phrase || !phrase.notes || phrase.notes.length === 0) {
            return;
        }

        // Add metadata
        const enriched = {
            ...phrase,
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            contour: phrase.contour || extractContour(phrase.notes),
            energy: phrase.energy || calculateEnergy(phrase.notes),
            avgPitch: calculateAveragePitch(phrase.notes),
            pitchRange: calculatePitchRange(phrase.notes),
            rhythmDensity: calculateRhythmDensity(phrase),
            timestamp: Date.now()
        };

        state.phrases.push(enriched);

        // Keep library bounded
        if (state.phrases.length > state.maxPhrases) {
            state.phrases.shift();
        }

        // Persist
        if (typeof GumpPersistence !== 'undefined') {
            GumpPersistence.savePhrases(state.phrases);
        }

        // Callback
        if (state.onPhraseAdded) {
            state.onPhraseAdded(enriched);
        }

        console.log(`[PhraseLibrary] Added phrase: ${enriched.id}`);

        return enriched;
    }

    function loadFromPersistence() {
        if (typeof GumpPersistence === 'undefined') return;

        const saved = GumpPersistence.getPhrases();
        if (saved && saved.length > 0) {
            state.phrases = saved;
            console.log(`[PhraseLibrary] Loaded ${saved.length} phrases from storage`);
        }
    }

    function clear() {
        state.phrases = [];
        state.activeLayers.clear();

        if (typeof GumpPersistence !== 'undefined') {
            GumpPersistence.savePhrases([]);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHRASE ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════

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
        if (ascending / total > 0.6) return 'ascending';
        if (descending / total > 0.6) return 'descending';
        if (ascending > 0 && descending > 0) return 'undulating';
        return 'static';
    }

    function calculateEnergy(notes) {
        if (!notes || notes.length === 0) return 0;
        return notes.reduce((sum, n) => sum + (n.velocity || 0.5), 0) / notes.length;
    }

    function calculateAveragePitch(notes) {
        if (!notes || notes.length === 0) return 60;
        return notes.reduce((sum, n) => sum + n.note, 0) / notes.length;
    }

    function calculatePitchRange(notes) {
        if (!notes || notes.length === 0) return 0;
        const pitches = notes.map(n => n.note);
        return Math.max(...pitches) - Math.min(...pitches);
    }

    function calculateRhythmDensity(phrase) {
        if (!phrase.notes || phrase.notes.length === 0 || !phrase.duration) return 0;
        return phrase.notes.length / (phrase.duration / 1000);  // Notes per second
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIMILARITY & MATCHING
    // ═══════════════════════════════════════════════════════════════════════

    function comparePhrases(phrase1, phrase2) {
        let score = 0;

        // Contour match (0.3 weight)
        if (phrase1.contour === phrase2.contour) {
            score += 0.3;
        } else if (
            (phrase1.contour === 'ascending' && phrase2.contour === 'undulating') ||
            (phrase1.contour === 'undulating' && phrase2.contour === 'ascending')
        ) {
            score += 0.15;
        }

        // Energy similarity (0.2 weight)
        const energyDiff = Math.abs(phrase1.energy - phrase2.energy);
        score += (1 - energyDiff) * 0.2;

        // Pitch range similarity (0.2 weight)
        const rangeDiff = Math.abs(phrase1.pitchRange - phrase2.pitchRange) / 24;  // Normalize to 2 octaves
        score += (1 - Math.min(1, rangeDiff)) * 0.2;

        // Note count similarity (0.15 weight)
        const countRatio = Math.min(phrase1.noteCount, phrase2.noteCount) /
                          Math.max(phrase1.noteCount, phrase2.noteCount);
        score += countRatio * 0.15;

        // Average pitch proximity (0.15 weight)
        const pitchDiff = Math.abs(phrase1.avgPitch - phrase2.avgPitch) / 24;
        score += (1 - Math.min(1, pitchDiff)) * 0.15;

        return score;
    }

    function findSimilar(phrase, count = 3) {
        return state.phrases
            .filter(p => p.id !== phrase.id)
            .map(p => ({
                phrase: p,
                similarity: comparePhrases(phrase, p)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, count);
    }

    function findContrasting(phrase, count = 3) {
        return state.phrases
            .filter(p => p.id !== phrase.id)
            .map(p => ({
                phrase: p,
                contrast: 1 - comparePhrases(phrase, p)
            }))
            .sort((a, b) => b.contrast - a.contrast)
            .slice(0, count);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHRASE TRANSFORMATION
    // ═══════════════════════════════════════════════════════════════════════

    function transposePhrase(phrase, semitones) {
        return {
            ...phrase,
            notes: phrase.notes.map(n => ({
                ...n,
                note: n.note + semitones
            })),
            avgPitch: phrase.avgPitch + semitones,
            id: phrase.id + '_t' + semitones
        };
    }

    function invertPhrase(phrase) {
        if (!phrase.notes || phrase.notes.length === 0) return phrase;

        const pivot = phrase.notes[0].note;
        return {
            ...phrase,
            notes: phrase.notes.map(n => ({
                ...n,
                note: pivot - (n.note - pivot)
            })),
            contour: phrase.contour === 'ascending' ? 'descending' :
                     phrase.contour === 'descending' ? 'ascending' :
                     phrase.contour,
            id: phrase.id + '_inv'
        };
    }

    function retrogradePhrase(phrase) {
        if (!phrase.notes || phrase.notes.length === 0) return phrase;

        const reversed = [...phrase.notes].reverse();
        const maxStep = Math.max(...phrase.notes.map(n => n.step || 0));

        return {
            ...phrase,
            notes: reversed.map((n, i) => ({
                ...n,
                step: maxStep - (phrase.notes[phrase.notes.length - 1 - i].step || 0)
            })),
            contour: phrase.contour === 'ascending' ? 'descending' :
                     phrase.contour === 'descending' ? 'ascending' :
                     phrase.contour,
            id: phrase.id + '_ret'
        };
    }

    function interpolate(phrase1, phrase2, amount) {
        if (!phrase1.notes || !phrase2.notes) return phrase1;

        // Use the longer phrase as base
        const basePhrase = phrase1.notes.length >= phrase2.notes.length ? phrase1 : phrase2;
        const otherPhrase = phrase1.notes.length >= phrase2.notes.length ? phrase2 : phrase1;

        const morphedNotes = basePhrase.notes.map((n, i) => {
            const otherNote = otherPhrase.notes[i % otherPhrase.notes.length];

            return {
                ...n,
                note: Math.round(n.note * (1 - amount) + otherNote.note * amount),
                velocity: n.velocity * (1 - amount) + otherNote.velocity * amount
            };
        });

        return {
            notes: morphedNotes,
            contour: amount < 0.5 ? phrase1.contour : phrase2.contour,
            energy: phrase1.energy * (1 - amount) + phrase2.energy * amount,
            id: phrase1.id + '_morph_' + phrase2.id
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CALL AND RESPONSE
    // ═══════════════════════════════════════════════════════════════════════

    function generateResponse(callPhrase, responseType = 'echo') {
        switch (responseType) {
            case 'echo':
                // Repeat with slight variation
                return transposePhrase(callPhrase, Math.random() < 0.5 ? 0 : 5);

            case 'answer':
                // Contrasting contour
                return invertPhrase(callPhrase);

            case 'continuation':
                // Find similar and morph
                const similar = findSimilar(callPhrase, 1);
                if (similar.length > 0) {
                    return interpolate(callPhrase, similar[0].phrase, 0.3);
                }
                return transposePhrase(callPhrase, 7);  // Up a fifth

            case 'contrast':
                // Find most different phrase
                const contrasting = findContrasting(callPhrase, 1);
                if (contrasting.length > 0) {
                    return contrasting[0].phrase;
                }
                return invertPhrase(retrogradePhrase(callPhrase));

            case 'development':
                // Combine transformations
                const developed = transposePhrase(
                    retrogradePhrase(callPhrase),
                    callPhrase.contour === 'ascending' ? -5 : 5
                );
                return developed;

            default:
                return callPhrase;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYERS
    // ═══════════════════════════════════════════════════════════════════════

    function addLayer(phrase, options = {}) {
        if (state.activeLayers.size >= state.maxLayers) {
            // Remove oldest layer
            const oldest = state.activeLayers.keys().next().value;
            state.activeLayers.delete(oldest);
        }

        const layerId = phrase.id || Date.now().toString();
        state.activeLayers.set(layerId, {
            phrase,
            volume: options.volume || 0.7,
            pan: options.pan || 0,
            muted: false,
            addedAt: Date.now()
        });

        if (state.onLayerChange) {
            state.onLayerChange(getActiveLayers());
        }

        return layerId;
    }

    function removeLayer(layerId) {
        state.activeLayers.delete(layerId);

        if (state.onLayerChange) {
            state.onLayerChange(getActiveLayers());
        }
    }

    function getActiveLayers() {
        return Array.from(state.activeLayers.entries()).map(([id, layer]) => ({
            id,
            ...layer
        }));
    }

    function clearLayers() {
        state.activeLayers.clear();

        if (state.onLayerChange) {
            state.onLayerChange([]);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMPOSITIONAL SUGGESTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function suggestNextMove(currentPhrase, analysis) {
        const suggestions = [];

        // If phrase library has content, suggest layering
        if (state.phrases.length > 2) {
            const similar = findSimilar(currentPhrase, 1);
            if (similar.length > 0 && similar[0].similarity > 0.5) {
                suggestions.push({
                    type: 'layer',
                    phrase: similar[0].phrase,
                    reason: 'Similar phrase available for layering'
                });
            }
        }

        // Based on contour, suggest contrast
        if (currentPhrase.contour === 'ascending') {
            suggestions.push({
                type: 'respond',
                responseType: 'answer',
                reason: 'Ascending phrase - answer with descent'
            });
        } else if (currentPhrase.contour === 'descending') {
            suggestions.push({
                type: 'respond',
                responseType: 'echo',
                transpose: 12,
                reason: 'Descending phrase - echo an octave up'
            });
        }

        // If energy is high, suggest development
        if (currentPhrase.energy > 0.7) {
            suggestions.push({
                type: 'develop',
                responseType: 'development',
                reason: 'High energy - develop the material'
            });
        }

        // If analysis shows regular rhythm, suggest harmonic shift
        if (analysis && analysis.onset) {
            suggestions.push({
                type: 'shift',
                transpose: 5,
                reason: 'Strong rhythm - try harmonic shift'
            });
        }

        return suggestions;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Phrase management
        addPhrase,
        loadFromPersistence,
        clear,
        get phrases() { return [...state.phrases]; },
        get count() { return state.phrases.length; },

        // Similarity
        comparePhrases,
        findSimilar,
        findContrasting,

        // Transformation
        transposePhrase,
        invertPhrase,
        retrogradePhrase,
        interpolate,

        // Call and response
        generateResponse,

        // Layers
        addLayer,
        removeLayer,
        getActiveLayers,
        clearLayers,

        // Suggestions
        suggestNextMove,

        // Callbacks
        onPhraseAdded: (callback) => { state.onPhraseAdded = callback; },
        onLayerChange: (callback) => { state.onLayerChange = callback; }
    });

})();

// Auto-export
if (typeof window !== 'undefined') {
    window.GumpPhraseLibrary = GumpPhraseLibrary;
}
