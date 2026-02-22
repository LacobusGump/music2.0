/**
 * GUMP LENS — Musical Personality System
 *
 * v37: A lens is a JSON configuration that seeds MusicalDNA traits,
 * constrains their evolution, and overrides derived bias values.
 * The conductor never changes — it keeps reading getBias() as usual.
 *
 * Tap the version indicator (bottom-left) to cycle through built-in lenses.
 * Each lens shapes how the engine interprets your movement.
 */

const GumpLens = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // BUILT-IN PRESETS
    // ═══════════════════════════════════════════════════════════════════════

    var PRESETS = [
        {
            name: "College Dropout",
            displayName: "COLLEGE DROPOUT",
            description: "Kanye soul warmth",
            traits: { aggression: 0.35, fluidity: 0.05, rhythm: 0.40, contemplation: 0.05, exploration: 0.15 },
            traitBounds: { rhythm: { floor: 0.20 }, contemplation: { ceiling: 0.20 } },
            overrides: { scale: [0,3,5,6,7,10], grooveThreshold: { max: 0.15 }, drumGain: { min: 1.5 }, padVolume: { max: 0.3 } }
        },
        {
            name: "Ambient Sunday",
            displayName: "AMBIENT SUNDAY",
            description: "Brian Eno in a snow globe",
            traits: { aggression: 0.02, fluidity: 0.35, rhythm: 0.03, contemplation: 0.45, exploration: 0.15 },
            traitBounds: { aggression: { ceiling: 0.15 }, rhythm: { ceiling: 0.15 } },
            overrides: { scale: [0,2,4,6,8,10], padVolume: { min: 0.8 }, drumGain: { max: 0.5 }, grooveThreshold: { min: 0.55 } }
        },
        {
            name: "Dark Explorer",
            displayName: "DARK EXPLORER",
            description: "Radiohead's Kid A deconstructed",
            traits: { aggression: 0.30, fluidity: 0.10, rhythm: 0.10, contemplation: 0.10, exploration: 0.40 },
            overrides: { scale: [0,1,2,3,4,5,6,7,8,9,10,11], baseTension: { min: 0.35 }, filterQ: { min: 3.0 } }
        },
        {
            name: "Pocket Drummer",
            displayName: "POCKET DRUMMER",
            description: "J Dilla's ghost",
            traits: { aggression: 0.10, fluidity: 0.05, rhythm: 0.60, contemplation: 0.05, exploration: 0.20 },
            traitBounds: { rhythm: { floor: 0.35 } },
            overrides: { scale: [0,3,5,6,7,10], grooveThreshold: { max: 0.08 }, drumGain: { min: 1.8 }, padVolume: { max: 0.15 } }
        }
    ];

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    var currentIndex = -1;  // -1 = no lens
    var activeLens = null;
    var tapped = false;     // debounce touch/click double-fire

    var STORAGE_KEY = 'gump_lens_index';

    // ═══════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════

    function init() {
        var el = document.getElementById('version');
        if (!el) return;

        // Mobile-friendly tap target — padding expands hit area
        el.style.padding = '10px 14px';
        el.style.margin = '-10px -14px';
        el.style.cursor = 'pointer';
        el.style.webkitTapHighlightColor = 'transparent';

        // Touch handler — immediate response on iOS, no 300ms delay
        el.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!tapped) {
                tapped = true;
                cycleLens();
                setTimeout(function() { tapped = false; }, 300);
            }
        }, { passive: false });

        // Click handler — desktop fallback
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!tapped) {
                tapped = true;
                cycleLens();
                setTimeout(function() { tapped = false; }, 300);
            }
        });

        // Restore last lens from storage
        restoreFromStorage();

        console.log('[Lens] Initialized — tap version to cycle lenses');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LENS LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════

    function cycleLens() {
        currentIndex++;
        if (currentIndex >= PRESETS.length) {
            currentIndex = -1;
        }

        if (currentIndex === -1) {
            clearLens();
        } else {
            loadLens(PRESETS[currentIndex]);
        }
    }

    function loadLens(lensData) {
        if (!lensData || !lensData.traits) {
            console.warn('[Lens] Invalid lens data');
            return;
        }

        activeLens = lensData;

        // Apply to Musical DNA
        if (typeof GumpMusicalDNA !== 'undefined' && GumpMusicalDNA.applyLens) {
            GumpMusicalDNA.applyLens(lensData);
        }

        // Update version display
        var el = document.getElementById('version');
        if (el) {
            el.textContent = lensData.displayName || lensData.name.toUpperCase();
            el.style.color = '#ff0';
        }

        // Show notification
        showLensNotification(lensData.displayName || lensData.name.toUpperCase());

        // Persist
        saveToStorage();

        console.log('[Lens] Loaded: ' + lensData.name);
    }

    function clearLens() {
        activeLens = null;

        // Tell DNA to release constraints (traits stay as residue)
        if (typeof GumpMusicalDNA !== 'undefined' && GumpMusicalDNA.clearLens) {
            GumpMusicalDNA.clearLens();
        }

        // Restore version display
        var el = document.getElementById('version');
        if (el) {
            el.textContent = 'v37-MUSICAL-LENS';
            el.style.color = '#0f0';
        }

        showLensNotification('LENS OFF');

        // Clear storage
        saveToStorage();

        console.log('[Lens] Cleared — DNA retains residue');
    }

    function getActiveLens() {
        return activeLens;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NOTIFICATION
    // ═══════════════════════════════════════════════════════════════════════

    function showLensNotification(text) {
        var el = document.getElementById('notification');
        if (!el) return;
        el.textContent = text;
        el.classList.add('visible');
        setTimeout(function() {
            el.classList.remove('visible');
        }, 2000);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════

    function saveToStorage() {
        try {
            if (activeLens && currentIndex >= 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ index: currentIndex }));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {}
    }

    function restoreFromStorage() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                var data = JSON.parse(saved);
                if (data.index !== undefined && data.index >= 0 && data.index < PRESETS.length) {
                    currentIndex = data.index;
                    loadLens(PRESETS[currentIndex]);
                }
            }
        } catch (e) {
            console.log('[Lens] No saved lens found');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT / IMPORT — Future lens sharing
    // ═══════════════════════════════════════════════════════════════════════

    function exportLens() {
        if (!activeLens) return null;
        return JSON.stringify(activeLens);
    }

    function importLens(json) {
        try {
            var data = typeof json === 'string' ? JSON.parse(json) : json;
            if (!data || !data.traits) {
                console.warn('[Lens] Invalid lens JSON');
                return;
            }
            currentIndex = -1; // custom lens, outside preset cycle
            loadLens(data);
        } catch (e) {
            console.warn('[Lens] Failed to parse lens JSON');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init: init,
        cycleLens: cycleLens,
        loadLens: loadLens,
        clearLens: clearLens,
        getActiveLens: getActiveLens,
        exportLens: exportLens,
        importLens: importLens,
        get activeLens() { return activeLens; },
        get presets() { return PRESETS.slice(); }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpLens = GumpLens;
}
