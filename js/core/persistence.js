/**
 * GUMP Persistence - Session Storage System
 * Saves phrases, patterns, and preferences to localStorage
 */

const GumpPersistence = (function() {
    'use strict';

    const STORAGE_KEYS = {
        phrases: 'gump_phrases',
        patterns: 'gump_patterns',
        preferences: 'gump_prefs',
        audioCache: 'gump_audio_cache',
        session: 'gump_session'
    };

    const MAX_PHRASES = 32;
    const MAX_AUDIO_CACHE_MB = 2;
    const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

    let autoSaveTimer = null;
    let isDirty = false;

    // In-memory state
    const state = {
        phrases: [],
        patterns: [],
        preferences: {
            volume: 0.8,
            lastWorld: null,
            gridSize: 6,
            visualsEnabled: true
        },
        sessionStart: Date.now()
    };

    // ========== PHRASES ==========

    function savePhrases(phrases) {
        if (!phrases || !Array.isArray(phrases)) return false;

        // Keep only the most recent phrases
        const trimmed = phrases.slice(-MAX_PHRASES);
        state.phrases = trimmed;

        try {
            const data = trimmed.map(p => ({
                notes: p.notes,
                contour: p.contour,
                energy: p.energy,
                timestamp: p.timestamp,
                // Don't store raw audio in phrases - use audio cache
                hasAudio: !!p.audio
            }));
            localStorage.setItem(STORAGE_KEYS.phrases, JSON.stringify(data));
            isDirty = false;
            return true;
        } catch (e) {
            console.warn('Failed to save phrases:', e);
            return false;
        }
    }

    function loadPhrases() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.phrases);
            if (data) {
                state.phrases = JSON.parse(data);
                return state.phrases;
            }
        } catch (e) {
            console.warn('Failed to load phrases:', e);
        }
        return [];
    }

    function addPhrase(phrase) {
        if (!phrase || !phrase.notes || phrase.notes.length === 0) return;

        state.phrases.push({
            notes: phrase.notes,
            contour: phrase.contour || extractContour(phrase.notes),
            energy: phrase.energy || calculateEnergy(phrase.notes),
            timestamp: Date.now(),
            hasAudio: !!phrase.audio
        });

        // Trim if over limit
        if (state.phrases.length > MAX_PHRASES) {
            state.phrases.shift();
        }

        isDirty = true;
    }

    function extractContour(notes) {
        if (!notes || notes.length < 2) return 'static';

        let direction = 0;
        for (let i = 1; i < notes.length; i++) {
            direction += Math.sign(notes[i].note - notes[i-1].note);
        }

        if (direction > notes.length / 2) return 'ascending';
        if (direction < -notes.length / 2) return 'descending';
        if (Math.abs(direction) < 2) return 'static';
        return 'undulating';
    }

    function calculateEnergy(notes) {
        if (!notes || notes.length === 0) return 0;

        const avgVelocity = notes.reduce((sum, n) => sum + (n.velocity || 0.5), 0) / notes.length;
        const density = notes.length / ((notes[notes.length-1].timestamp - notes[0].timestamp) / 1000 || 1);

        return Math.min(1, (avgVelocity * 0.6 + density * 0.05));
    }

    // ========== PATTERNS ==========

    function savePatterns(patterns) {
        if (!patterns || !Array.isArray(patterns)) return false;

        state.patterns = patterns;

        try {
            localStorage.setItem(STORAGE_KEYS.patterns, JSON.stringify(patterns));
            return true;
        } catch (e) {
            console.warn('Failed to save patterns:', e);
            return false;
        }
    }

    function loadPatterns() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.patterns);
            if (data) {
                state.patterns = JSON.parse(data);
                return state.patterns;
            }
        } catch (e) {
            console.warn('Failed to load patterns:', e);
        }
        return [];
    }

    // ========== PREFERENCES ==========

    function savePreferences(prefs) {
        if (!prefs) return false;

        Object.assign(state.preferences, prefs);

        try {
            localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(state.preferences));
            return true;
        } catch (e) {
            console.warn('Failed to save preferences:', e);
            return false;
        }
    }

    function loadPreferences() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.preferences);
            if (data) {
                Object.assign(state.preferences, JSON.parse(data));
            }
        } catch (e) {
            console.warn('Failed to load preferences:', e);
        }
        return state.preferences;
    }

    function getPreference(key) {
        return state.preferences[key];
    }

    function setPreference(key, value) {
        state.preferences[key] = value;
        isDirty = true;
    }

    // ========== AUDIO CACHE ==========

    function saveAudioPhrase(id, audioData) {
        if (!audioData) return false;

        try {
            // Get current cache
            let cache = {};
            const existing = localStorage.getItem(STORAGE_KEYS.audioCache);
            if (existing) {
                cache = JSON.parse(existing);
            }

            // Convert Float32Array to base64 for storage
            const compressed = compressAudio(audioData);
            cache[id] = {
                data: compressed,
                timestamp: Date.now()
            };

            // Check size and prune if needed
            const cacheStr = JSON.stringify(cache);
            if (cacheStr.length > MAX_AUDIO_CACHE_MB * 1024 * 1024) {
                pruneAudioCache(cache);
            }

            localStorage.setItem(STORAGE_KEYS.audioCache, JSON.stringify(cache));
            return true;
        } catch (e) {
            console.warn('Failed to save audio phrase:', e);
            return false;
        }
    }

    function loadAudioPhrase(id) {
        try {
            const cache = localStorage.getItem(STORAGE_KEYS.audioCache);
            if (cache) {
                const parsed = JSON.parse(cache);
                if (parsed[id]) {
                    return decompressAudio(parsed[id].data);
                }
            }
        } catch (e) {
            console.warn('Failed to load audio phrase:', e);
        }
        return null;
    }

    function compressAudio(float32Array) {
        // Simple compression: convert to 8-bit and base64
        const int8 = new Int8Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            int8[i] = Math.round(float32Array[i] * 127);
        }

        // Convert to base64
        let binary = '';
        const bytes = new Uint8Array(int8.buffer);
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function decompressAudio(base64) {
        // Decompress from base64 back to Float32Array
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const int8 = new Int8Array(bytes.buffer);
        const float32 = new Float32Array(int8.length);
        for (let i = 0; i < int8.length; i++) {
            float32[i] = int8[i] / 127;
        }
        return float32;
    }

    function pruneAudioCache(cache) {
        // Remove oldest entries until under size limit
        const entries = Object.entries(cache).sort((a, b) => a[1].timestamp - b[1].timestamp);

        while (entries.length > 0 && JSON.stringify(cache).length > MAX_AUDIO_CACHE_MB * 1024 * 1024) {
            const oldest = entries.shift();
            delete cache[oldest[0]];
        }
    }

    // ========== SESSION MANAGEMENT ==========

    function loadSession() {
        loadPhrases();
        loadPatterns();
        loadPreferences();

        console.log(`[Persistence] Loaded session: ${state.phrases.length} phrases, ${state.patterns.length} patterns`);

        return {
            phrases: state.phrases,
            patterns: state.patterns,
            preferences: state.preferences
        };
    }

    function saveSession() {
        savePhrases(state.phrases);
        savePatterns(state.patterns);
        savePreferences(state.preferences);

        console.log(`[Persistence] Saved session: ${state.phrases.length} phrases`);
    }

    function clearSession() {
        state.phrases = [];
        state.patterns = [];
        state.preferences = {
            volume: 0.8,
            lastWorld: null,
            gridSize: 6,
            visualsEnabled: true
        };

        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        console.log('[Persistence] Session cleared');
    }

    // ========== AUTO-SAVE ==========

    function startAutoSave() {
        if (autoSaveTimer) return;

        autoSaveTimer = setInterval(() => {
            if (isDirty) {
                saveSession();
            }
        }, AUTO_SAVE_INTERVAL);

        // Also save on page unload
        window.addEventListener('beforeunload', () => {
            if (isDirty) {
                saveSession();
            }
        });

        // Save on visibility change (mobile background)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && isDirty) {
                saveSession();
            }
        });

        console.log('[Persistence] Auto-save started');
    }

    function stopAutoSave() {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
        }
    }

    // ========== STORAGE INFO ==========

    function getStorageInfo() {
        let totalSize = 0;

        Object.values(STORAGE_KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                totalSize += item.length * 2; // UTF-16 = 2 bytes per char
            }
        });

        return {
            phrases: state.phrases.length,
            patterns: state.patterns.length,
            sizeMB: (totalSize / 1024 / 1024).toFixed(2),
            isDirty: isDirty
        };
    }

    // ========== PUBLIC API ==========

    return {
        // Phrases
        savePhrases,
        loadPhrases,
        addPhrase,
        getPhrases: () => [...state.phrases],

        // Patterns
        savePatterns,
        loadPatterns,
        getPatterns: () => [...state.patterns],

        // Preferences
        savePreferences,
        loadPreferences,
        getPreference,
        setPreference,
        getPreferences: () => ({ ...state.preferences }),

        // Audio
        saveAudioPhrase,
        loadAudioPhrase,

        // Session
        loadSession,
        saveSession,
        clearSession,

        // Auto-save
        startAutoSave,
        stopAutoSave,

        // Utils
        getStorageInfo,
        markDirty: () => { isDirty = true; }
    };

})();

// Auto-export for module systems
if (typeof window !== 'undefined') {
    window.GumpPersistence = GumpPersistence;
}
