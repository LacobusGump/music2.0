/**
 * GUMP MUSICAL DNA - RPG Character Build for Music Evolution
 *
 * v35: Your first movements build a "character" that dictates how music
 * unravels. Aggressive shaking -> one musical world. Slow circles ->
 * completely different world. The ORDER and CHAINING of gestures matters.
 *
 * 5 Traits (0-1 each):
 *   aggression  - shake, toss, chaotic motion, high energy
 *   fluidity    - sweep, circle, gentle motion
 *   rhythm      - pendulum, rock, rhythmic patterns
 *   contemplation - stillness, void states, long dwells
 *   exploration - gesture variety, zone changes, surprise
 *
 * Formative window (~60s) -> crystallization -> archetype locks in.
 * Cross-session persistence via localStorage.
 */

const GumpMusicalDNA = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // SCALE PALETTES — One per dominant trait
    // ═══════════════════════════════════════════════════════════════════════

    const SCALE_PALETTES = {
        aggression:    [0, 1, 3, 5, 7, 8, 10],          // Phrygian — dark, tense
        fluidity:      [0, 2, 4, 7, 9],                  // Major pentatonic — open, flowing
        rhythm:        [0, 3, 5, 6, 7, 10],              // Minor blues — groove-ready
        contemplation: [0, 2, 4, 6, 8, 10],              // Whole tone — floating, ambient
        exploration:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Chromatic — unpredictable
    };

    // Default scale (matches conductor v33 Maj7 pentatonic)
    const DEFAULT_SCALE = [0, 2, 4, 7, 9, 11, 12, 14, 16, 19, 23, 24];

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    const traits = {
        aggression: 0,
        fluidity: 0,
        rhythm: 0,
        contemplation: 0,
        exploration: 0,
    };

    let archetype = null;          // Set at crystallization
    let formativeTime = 0;         // Seconds accumulated
    let crystallized = false;
    let gestureHistory = [];       // Last 20 gestures with timestamps
    let lastScaleChoice = null;    // Cache current scale
    let scaleChangeTimer = 0;     // Throttle scale changes
    let uniqueGesturesThisWindow = new Set(); // For exploration trait
    let lastZone = null;
    let zoneChangeCount = 0;

    const FORMATIVE_DURATION = 60; // seconds
    const STORAGE_KEY = 'gump_musical_dna';

    // ═══════════════════════════════════════════════════════════════════════
    // INIT — Restore from localStorage
    // ═══════════════════════════════════════════════════════════════════════

    function loadFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.traits) {
                    traits.aggression = data.traits.aggression || 0;
                    traits.fluidity = data.traits.fluidity || 0;
                    traits.rhythm = data.traits.rhythm || 0;
                    traits.contemplation = data.traits.contemplation || 0;
                    traits.exploration = data.traits.exploration || 0;
                }
                if (data.archetype) {
                    archetype = data.archetype;
                    crystallized = true;
                    formativeTime = FORMATIVE_DURATION;
                    console.log('[MusicalDNA] Restored archetype: ' + archetype);
                }
            }
        } catch (e) {
            console.log('[MusicalDNA] No saved DNA found, starting fresh');
        }
    }

    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                traits: { ...traits },
                archetype: archetype,
                crystallized: crystallized,
            }));
        } catch (e) {}
    }

    // Load on module init
    loadFromStorage();

    // ═══════════════════════════════════════════════════════════════════════
    // TRAIT ACCUMULATION — Fed by gestures, motion, void state
    // ═══════════════════════════════════════════════════════════════════════

    function pushTrait(name, amount) {
        // Learning rate: fast pre-crystal, slow post-crystal
        const rate = crystallized ? 0.2 : 1.0;
        traits[name] = Math.min(1, Math.max(0, traits[name] + amount * rate));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE — Called every frame from main.js
    // ═══════════════════════════════════════════════════════════════════════

    function update(dt, app) {
        if (!dt || dt <= 0) return;

        // Accumulate formative time
        if (!crystallized) {
            formativeTime += dt;
        }

        // Read neuron firing rates -> push trait targets
        if (typeof GumpMotionBrain !== 'undefined') {
            const neurons = GumpMotionBrain.neurons;
            if (neurons) {
                // Shake/toss -> aggression
                if (neurons.shake && neurons.shake.firing) {
                    pushTrait('aggression', dt * 0.15 * (neurons.shake.firingRate || 1));
                }
                if (neurons.toss && neurons.toss.firing) {
                    pushTrait('aggression', dt * 0.12 * (neurons.toss.firingRate || 1));
                }

                // Sweep/circle -> fluidity
                if (neurons.sweep && neurons.sweep.firing) {
                    pushTrait('fluidity', dt * 0.15 * (neurons.sweep.firingRate || 1));
                }
                if (neurons.circle && neurons.circle.firing) {
                    pushTrait('fluidity', dt * 0.12 * (neurons.circle.firingRate || 1));
                }

                // Pendulum/rock -> rhythm
                if (neurons.pendulum && neurons.pendulum.firing) {
                    pushTrait('rhythm', dt * 0.15 * (neurons.pendulum.firingRate || 1));
                }
                if (neurons.rock && neurons.rock.firing) {
                    pushTrait('rhythm', dt * 0.10 * (neurons.rock.firingRate || 1));
                }

                // Stillness -> contemplation
                if (neurons.stillness && neurons.stillness.firing) {
                    pushTrait('contemplation', dt * 0.10 * (neurons.stillness.firingRate || 1));
                }
            }

            // Void depth -> contemplation (strong signal)
            const voidDepth = GumpMotionBrain.voidDepth || 0;
            if (voidDepth > 0.2) {
                pushTrait('contemplation', dt * 0.08 * voidDepth);
            }

            // Chaotic motion -> aggression
            const shortEnergy = GumpMotionBrain.short ? GumpMotionBrain.short.energy : 0;
            if (shortEnergy > 0.7) {
                pushTrait('aggression', dt * 0.05 * shortEnergy);
            }

            // Gentle motion -> fluidity
            if (shortEnergy > 0.1 && shortEnergy < 0.4) {
                pushTrait('fluidity', dt * 0.04);
            }
        }

        // Conductor energy -> aggression when high
        if (typeof GumpConductor !== 'undefined') {
            const energy = GumpConductor.energy || 0;
            if (energy > 0.6) {
                pushTrait('aggression', dt * 0.03 * energy);
            }

            // Motion pattern -> traits
            const pattern = GumpConductor.motionPattern;
            if (pattern === 'chaotic') pushTrait('aggression', dt * 0.06);
            else if (pattern === 'vigorous') pushTrait('aggression', dt * 0.03);
            else if (pattern === 'gentle') pushTrait('fluidity', dt * 0.04);
            else if (pattern === 'rhythmic') pushTrait('rhythm', dt * 0.06);
            else if (pattern === 'still') pushTrait('contemplation', dt * 0.03);
        }

        // STDP novelty -> exploration
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            const surprise = GumpNeuromorphicMemory.surprise || 0;
            if (surprise > 0.3) {
                pushTrait('exploration', dt * 0.06 * surprise);
            }

            // Track gesture variety for exploration
            const seq = GumpNeuromorphicMemory.sessionMemory ?
                GumpNeuromorphicMemory.sessionMemory.gestureSequence : [];
            if (seq.length > 0) {
                const latest = seq[seq.length - 1];
                if (!uniqueGesturesThisWindow.has(latest)) {
                    uniqueGesturesThisWindow.add(latest);
                    pushTrait('exploration', 0.03);
                }
            }
        }

        // Zone changes -> exploration
        if (typeof GumpState !== 'undefined') {
            const currentZone = GumpState.get('grid.currentZone');
            if (currentZone && currentZone !== lastZone) {
                if (lastZone !== null) {
                    zoneChangeCount++;
                    pushTrait('exploration', 0.02);
                }
                lastZone = currentZone;
            }
        }

        // Crystallization check
        if (formativeTime >= FORMATIVE_DURATION && !crystallized) {
            crystallize();
        }

        // Throttled scale updates
        scaleChangeTimer -= dt;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CRYSTALLIZATION — Lock traits into ratios, pick archetype
    // ═══════════════════════════════════════════════════════════════════════

    function crystallize() {
        // Normalize traits to sum=1
        const sum = traits.aggression + traits.fluidity + traits.rhythm +
                    traits.contemplation + traits.exploration;

        if (sum > 0) {
            traits.aggression /= sum;
            traits.fluidity /= sum;
            traits.rhythm /= sum;
            traits.contemplation /= sum;
            traits.exploration /= sum;
        } else {
            // No data — default balanced
            traits.aggression = 0.2;
            traits.fluidity = 0.2;
            traits.rhythm = 0.2;
            traits.contemplation = 0.2;
            traits.exploration = 0.2;
        }

        // Pick archetype = highest trait
        let maxVal = 0;
        let maxTrait = 'exploration';
        for (const [name, val] of Object.entries(traits)) {
            if (val > maxVal) {
                maxVal = val;
                maxTrait = name;
            }
        }
        archetype = maxTrait;
        crystallized = true;

        // Save to localStorage
        saveToStorage();

        // Show notification
        const archetypeNames = {
            aggression: 'THE WARRIOR',
            fluidity: 'THE DANCER',
            rhythm: 'THE DRUMMER',
            contemplation: 'THE MYSTIC',
            exploration: 'THE EXPLORER',
        };

        const el = document.getElementById('notification');
        if (el) {
            el.textContent = archetypeNames[archetype] || archetype.toUpperCase();
            el.classList.add('visible');
            setTimeout(function() { el.classList.remove('visible'); }, 3000);
        }

        console.log('[MusicalDNA] Crystallized as ' + archetypeNames[archetype] +
            ' | agg=' + traits.aggression.toFixed(2) +
            ' flu=' + traits.fluidity.toFixed(2) +
            ' rhy=' + traits.rhythm.toFixed(2) +
            ' con=' + traits.contemplation.toFixed(2) +
            ' exp=' + traits.exploration.toFixed(2));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCALE SELECTION — Blended from trait weights
    // ═══════════════════════════════════════════════════════════════════════

    function extendScale(baseScale) {
        // Extend a single-octave scale to ~2 octaves for playNote compatibility
        const extended = [];
        for (let oct = 0; oct < 3; oct++) {
            for (let i = 0; i < baseScale.length; i++) {
                extended.push(baseScale[i] + oct * 12);
            }
        }
        return extended;
    }

    function getScaleForContext() {
        // If no trait data yet, return default
        const sum = traits.aggression + traits.fluidity + traits.rhythm +
                    traits.contemplation + traits.exploration;
        if (sum < 0.01) return DEFAULT_SCALE;

        // Throttle: only recalculate every 2 seconds
        if (lastScaleChoice && scaleChangeTimer > 0) return lastScaleChoice;
        scaleChangeTimer = 2.0;

        // Find dominant and secondary traits
        const sorted = Object.entries(traits).sort(function(a, b) { return b[1] - a[1]; });
        const dominant = sorted[0];
        const secondary = sorted[1];

        // 60% dominant, 30% secondary, 10% exploration mutation
        const roll = Math.random();
        let chosenPalette;

        if (roll < 0.6) {
            chosenPalette = SCALE_PALETTES[dominant[0]];
        } else if (roll < 0.9) {
            chosenPalette = SCALE_PALETTES[secondary[0]];
        } else {
            // Exploration mutation — pick a random scale
            const keys = Object.keys(SCALE_PALETTES);
            chosenPalette = SCALE_PALETTES[keys[Math.floor(Math.random() * keys.length)]];
        }

        lastScaleChoice = extendScale(chosenPalette);
        return lastScaleChoice;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BIAS COMPUTATION — All parameters the conductor reads
    // ═══════════════════════════════════════════════════════════════════════

    function getBias() {
        const a = traits.aggression;
        const f = traits.fluidity;
        const r = traits.rhythm;
        const c = traits.contemplation;
        const e = traits.exploration;

        // Tempo: 75 + aggression*30 - contemplation*20 + rhythm*10
        const tempo = Math.max(55, Math.min(140,
            75 + a * 30 - c * 20 + r * 10
        ));

        // Filter base: 800 + fluidity*2000 + aggression*1500 - contemplation*1000
        const filterBase = Math.max(400, Math.min(8000,
            800 + f * 2000 + a * 1500 - c * 1000
        ));

        // Filter Q: 0.7 + aggression*4
        const filterQ = 0.7 + a * 4;

        // Drum velocity: 0.3 + aggression*0.6 + rhythm*0.3 - contemplation*0.4
        const drumVelocity = Math.max(0.1, Math.min(1.5,
            0.3 + a * 0.6 + r * 0.3 - c * 0.4
        ));

        // Groove entry threshold: lower for rhythm-heavy, higher for contemplation
        const grooveThreshold = Math.max(0.1, Math.min(0.6,
            0.3 - r * 0.15 + c * 0.2
        ));

        // Pad volume: 0.5 + contemplation*0.4 + fluidity*0.3 - aggression*0.2
        const padVolume = Math.max(0.1, Math.min(1.0,
            0.5 + c * 0.4 + f * 0.3 - a * 0.2
        ));

        // Drum bus gain: 0.6 + aggression*0.6 + rhythm*0.4 - contemplation*0.3
        const drumGain = Math.max(0.3, Math.min(2.0,
            0.6 + a * 0.6 + r * 0.4 - c * 0.3
        ));

        // Base tension: aggression*0.3 + exploration*0.2 - contemplation*0.15
        const baseTension = Math.max(0, Math.min(0.5,
            a * 0.3 + e * 0.2 - c * 0.15
        ));

        // Gesture response amplifiers
        const gestureAmplifiers = {
            shake:    1 + a,      // shake trill volume
            sweep:    1 + f,      // sweep glissando range
            pendulum: 1 + r,      // pendulum pulse sync precision
            void:     1 + c,      // void drone depth
            surprise: 1 + e,      // surprise harmonic shift
        };

        return {
            tempo: tempo,
            filterBase: filterBase,
            filterQ: filterQ,
            drumVelocity: drumVelocity,
            grooveThreshold: grooveThreshold,
            padVolume: padVolume,
            drumGain: drumGain,
            baseTension: baseTension,
            gestureAmplifiers: gestureAmplifiers,
            scale: getScaleForContext(),
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        update: update,
        getBias: getBias,
        getScaleForContext: getScaleForContext,

        get traits() { return { ...traits }; },
        get archetype() { return archetype; },
        get crystallized() { return crystallized; },
        get formativeTime() { return formativeTime; },
        get formativeProgress() { return Math.min(1, formativeTime / FORMATIVE_DURATION); },
    });

})();

if (typeof window !== 'undefined') {
    window.GumpMusicalDNA = GumpMusicalDNA;
}
