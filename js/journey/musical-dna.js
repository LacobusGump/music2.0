/**
 * GUMP MUSICAL DNA - RPG Character Build for Music Evolution
 *
 * v35: Your first movements build a "character" that dictates how music
 * unravels. Aggressive shaking -> one musical world. Slow circles ->
 * completely different world.
 *
 * 5 Traits (0-1 each):
 *   aggression    - fast movement, rapid tapping, high velocity, shaking
 *   fluidity      - slow sweeping, smooth curves, gentle arcs
 *   rhythm        - regular intervals, consistent timing, pendulum
 *   contemplation - stillness, dwelling, not touching, void states
 *   exploration   - zone changes, gesture variety, surprise events
 *
 * WORKS ON DESKTOP: Reads touch/mouse velocity, position, timing, and
 * dwell patterns directly. No accelerometer needed.
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

    let archetype = null;
    let formativeTime = 0;
    let crystallized = false;
    let lastScaleChoice = null;
    let scaleChangeTimer = 0;
    let lastZone = null;
    let zoneChangeCount = 0;

    // Touch/mouse analysis state
    let lastTouchX = -1;
    let lastTouchY = -1;
    let lastTouchTime = 0;
    let touchVelocities = [];     // last 30 velocities
    let touchIntervals = [];      // last 20 intervals between touches
    let noTouchTime = 0;          // seconds without touching
    let touchActiveLastFrame = false;
    let touchStartTimes = [];     // timestamps of touch-starts for rhythm detection
    let uniqueZonesVisited = new Set();
    let directionChanges = 0;     // how often cursor reverses
    let lastVx = 0;
    let lastVy = 0;

    // Cached bias (computed once per frame)
    let cachedBias = null;
    let biasFrameId = -1;

    const FORMATIVE_DURATION = 60;
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

    loadFromStorage();

    // ═══════════════════════════════════════════════════════════════════════
    // TRAIT ACCUMULATION
    // ═══════════════════════════════════════════════════════════════════════

    function pushTrait(name, amount) {
        var rate = crystallized ? 0.2 : 1.0;
        traits[name] = Math.min(1, Math.max(0, traits[name] + amount * rate));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE — Called every frame. Reads app state directly.
    // ═══════════════════════════════════════════════════════════════════════

    function update(dt, app) {
        if (!dt || dt <= 0) return;

        // Invalidate cached bias
        cachedBias = null;

        if (!crystallized) {
            formativeTime += dt;
        }

        // ── PRIMARY INPUT: Touch/mouse velocity and behavior ──
        // This works on desktop AND mobile — no accelerometer needed.

        var touching = app.gestureActive;
        var vx = app.vx || 0;
        var vy = app.vy || 0;
        var speed = Math.sqrt(vx * vx + vy * vy);
        var now = Date.now();

        if (touching) {
            noTouchTime = 0;

            // Track velocity
            touchVelocities.push(speed);
            if (touchVelocities.length > 30) touchVelocities.shift();

            // ── AGGRESSION: Fast movement, rapid direction changes ──
            if (speed > 3.0) {
                pushTrait('aggression', dt * 0.5 * Math.min(speed / 5, 2));
            }
            if (speed > 6.0) {
                pushTrait('aggression', dt * 0.8); // extra for really fast
            }

            // Direction reversal detection → aggression (jerky motion)
            if ((vx * lastVx < -0.5) || (vy * lastVy < -0.5)) {
                directionChanges++;
                pushTrait('aggression', 0.02);
            }

            // ── FLUIDITY: Slow, smooth, consistent motion ──
            if (speed > 0.3 && speed < 2.5) {
                pushTrait('fluidity', dt * 0.4);
            }
            // Smooth = low velocity variance
            if (touchVelocities.length > 10) {
                var mean = 0;
                for (var i = 0; i < touchVelocities.length; i++) mean += touchVelocities[i];
                mean /= touchVelocities.length;
                var variance = 0;
                for (var i = 0; i < touchVelocities.length; i++) {
                    variance += (touchVelocities[i] - mean) * (touchVelocities[i] - mean);
                }
                variance /= touchVelocities.length;
                if (variance < 1.0 && mean > 0.5) {
                    pushTrait('fluidity', dt * 0.3); // consistent gentle movement
                }
            }

            // ── RHYTHM: Regular touch intervals ──
            if (!touchActiveLastFrame) {
                // New touch-start
                touchStartTimes.push(now);
                if (touchStartTimes.length > 20) touchStartTimes.shift();

                if (touchStartTimes.length >= 3) {
                    // Check regularity of last few intervals
                    var intervals = [];
                    for (var i = 1; i < Math.min(touchStartTimes.length, 8); i++) {
                        intervals.push(touchStartTimes[i] - touchStartTimes[i - 1]);
                    }
                    if (intervals.length >= 2) {
                        var iMean = 0;
                        for (var i = 0; i < intervals.length; i++) iMean += intervals[i];
                        iMean /= intervals.length;
                        var iVar = 0;
                        for (var i = 0; i < intervals.length; i++) {
                            iVar += (intervals[i] - iMean) * (intervals[i] - iMean);
                        }
                        iVar /= intervals.length;
                        var cv = iMean > 0 ? Math.sqrt(iVar) / iMean : 1;
                        if (cv < 0.35 && iMean > 150 && iMean < 3000) {
                            // Regular tapping detected!
                            pushTrait('rhythm', 0.06);
                        }
                    }
                }
            }

            lastVx = vx;
            lastVy = vy;

        } else {
            // ── CONTEMPLATION: Not touching = dwelling in stillness ──
            noTouchTime += dt;
            if (noTouchTime > 1.0) {
                // The longer you wait, the more contemplation builds
                pushTrait('contemplation', dt * 0.25 * Math.min(noTouchTime / 5, 1.5));
            }

            // Reset velocity tracking
            touchVelocities = [];
            lastVx = 0;
            lastVy = 0;
        }
        touchActiveLastFrame = touching;

        // ── EXPLORATION: Zone changes, position variety ──
        if (typeof GumpState !== 'undefined') {
            var currentZone = GumpState.get('grid.currentZone');
            if (currentZone && currentZone !== lastZone) {
                if (lastZone !== null) {
                    zoneChangeCount++;
                    pushTrait('exploration', 0.04);
                    if (!uniqueZonesVisited.has(currentZone)) {
                        uniqueZonesVisited.add(currentZone);
                        pushTrait('exploration', 0.06); // bonus for NEW zones
                    }
                }
                lastZone = currentZone;
            }
        }

        // ── BONUS: Accelerometer neurons (when available) ──
        if (typeof GumpMotionBrain !== 'undefined') {
            var neurons = GumpMotionBrain.neurons;
            if (neurons) {
                if (neurons.shake && neurons.shake.firing)
                    pushTrait('aggression', dt * 0.6);
                if (neurons.toss && neurons.toss.firing)
                    pushTrait('aggression', dt * 0.5);
                if (neurons.sweep && neurons.sweep.firing)
                    pushTrait('fluidity', dt * 0.6);
                if (neurons.circle && neurons.circle.firing)
                    pushTrait('fluidity', dt * 0.5);
                if (neurons.pendulum && neurons.pendulum.firing)
                    pushTrait('rhythm', dt * 0.6);
                if (neurons.rock && neurons.rock.firing)
                    pushTrait('rhythm', dt * 0.4);
                if (neurons.stillness && neurons.stillness.firing)
                    pushTrait('contemplation', dt * 0.4);
            }
            var voidDepth = GumpMotionBrain.voidDepth || 0;
            if (voidDepth > 0.2) {
                pushTrait('contemplation', dt * 0.3 * voidDepth);
            }
        }

        // ── BONUS: ESN surprise → exploration ──
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            var surprise = GumpNeuromorphicMemory.surprise || 0;
            if (surprise > 0.2) {
                pushTrait('exploration', dt * 0.2 * surprise);
            }
        }

        // ── Crystallization ──
        if (formativeTime >= FORMATIVE_DURATION && !crystallized) {
            crystallize();
        }

        scaleChangeTimer -= dt;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CRYSTALLIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function crystallize() {
        var sum = traits.aggression + traits.fluidity + traits.rhythm +
                  traits.contemplation + traits.exploration;

        if (sum > 0) {
            traits.aggression /= sum;
            traits.fluidity /= sum;
            traits.rhythm /= sum;
            traits.contemplation /= sum;
            traits.exploration /= sum;
        } else {
            traits.aggression = 0.2;
            traits.fluidity = 0.2;
            traits.rhythm = 0.2;
            traits.contemplation = 0.2;
            traits.exploration = 0.2;
        }

        var maxVal = 0;
        var maxTrait = 'exploration';
        for (var name in traits) {
            if (traits[name] > maxVal) {
                maxVal = traits[name];
                maxTrait = name;
            }
        }
        archetype = maxTrait;
        crystallized = true;

        saveToStorage();

        var archetypeNames = {
            aggression: 'THE WARRIOR',
            fluidity: 'THE DANCER',
            rhythm: 'THE DRUMMER',
            contemplation: 'THE MYSTIC',
            exploration: 'THE EXPLORER',
        };

        var el = document.getElementById('notification');
        if (el) {
            el.textContent = archetypeNames[archetype] || archetype.toUpperCase();
            el.classList.add('visible');
            setTimeout(function() { el.classList.remove('visible'); }, 3000);
        }

        console.log('[MusicalDNA] Crystallized as ' + archetypeNames[archetype] +
            ' | A=' + traits.aggression.toFixed(2) +
            ' F=' + traits.fluidity.toFixed(2) +
            ' R=' + traits.rhythm.toFixed(2) +
            ' C=' + traits.contemplation.toFixed(2) +
            ' E=' + traits.exploration.toFixed(2));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCALE SELECTION
    // ═══════════════════════════════════════════════════════════════════════

    function extendScale(baseScale) {
        var extended = [];
        for (var oct = 0; oct < 3; oct++) {
            for (var i = 0; i < baseScale.length; i++) {
                extended.push(baseScale[i] + oct * 12);
            }
        }
        return extended;
    }

    function getScaleForContext() {
        var sum = traits.aggression + traits.fluidity + traits.rhythm +
                  traits.contemplation + traits.exploration;
        if (sum < 0.05) return DEFAULT_SCALE;

        if (lastScaleChoice && scaleChangeTimer > 0) return lastScaleChoice;
        scaleChangeTimer = 2.0;

        // Sort traits to find dominant + secondary
        var sorted = [];
        for (var name in traits) {
            sorted.push([name, traits[name]]);
        }
        sorted.sort(function(a, b) { return b[1] - a[1]; });

        var roll = Math.random();
        var chosenPalette;

        if (roll < 0.6) {
            chosenPalette = SCALE_PALETTES[sorted[0][0]];
        } else if (roll < 0.9) {
            chosenPalette = SCALE_PALETTES[sorted[1][0]];
        } else {
            var keys = Object.keys(SCALE_PALETTES);
            chosenPalette = SCALE_PALETTES[keys[Math.floor(Math.random() * keys.length)]];
        }

        lastScaleChoice = extendScale(chosenPalette);
        return lastScaleChoice;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BIAS COMPUTATION — Cached once per frame
    // ═══════════════════════════════════════════════════════════════════════

    function getBias() {
        // Return cached if already computed this frame
        if (cachedBias) return cachedBias;

        var a = traits.aggression;
        var f = traits.fluidity;
        var r = traits.rhythm;
        var c = traits.contemplation;
        var e = traits.exploration;

        // Tempo: 75 + aggression*45 - contemplation*30 + rhythm*15
        var tempo = Math.max(50, Math.min(150,
            75 + a * 45 - c * 30 + r * 15
        ));

        // Filter base: 800 + fluidity*3000 + aggression*2500 - contemplation*1500
        var filterBase = Math.max(300, Math.min(10000,
            800 + f * 3000 + a * 2500 - c * 1500
        ));

        // Filter Q: 0.7 + aggression*6 (really acidic for warriors)
        var filterQ = 0.7 + a * 6;

        // Drum velocity: 0.3 + aggression*0.9 + rhythm*0.5 - contemplation*0.5
        var drumVelocity = Math.max(0.1, Math.min(2.0,
            0.3 + a * 0.9 + r * 0.5 - c * 0.5
        ));

        // Groove entry threshold: much lower for rhythm (0.08), much higher for contemplation (0.7)
        var grooveThreshold = Math.max(0.05, Math.min(0.7,
            0.3 - r * 0.22 + c * 0.4
        ));

        // Pad volume: contemplation makes pads LOUD, aggression kills them
        var padVolume = Math.max(0.05, Math.min(1.5,
            0.5 + c * 0.8 + f * 0.5 - a * 0.4
        ));

        // Drum bus gain: aggression cranks drums way up
        var drumGain = Math.max(0.3, Math.min(2.5,
            0.6 + a * 1.0 + r * 0.6 - c * 0.4
        ));

        // Base tension: aggression + exploration push tension
        var baseTension = Math.max(0, Math.min(0.6,
            a * 0.4 + e * 0.3 - c * 0.2
        ));

        // Gesture response amplifiers (up to 2x)
        var gestureAmplifiers = {
            shake:    1 + a * 1.5,
            sweep:    1 + f * 1.5,
            pendulum: 1 + r * 1.5,
            void:     1 + c * 1.5,
            surprise: 1 + e * 1.5,
        };

        cachedBias = {
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

        return cachedBias;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        update: update,
        getBias: getBias,
        getScaleForContext: getScaleForContext,

        get traits() { return { aggression: traits.aggression, fluidity: traits.fluidity, rhythm: traits.rhythm, contemplation: traits.contemplation, exploration: traits.exploration }; },
        get archetype() { return archetype; },
        get crystallized() { return crystallized; },
        get formativeTime() { return formativeTime; },
        get formativeProgress() { return Math.min(1, formativeTime / FORMATIVE_DURATION); },
    });

})();

if (typeof window !== 'undefined') {
    window.GumpMusicalDNA = GumpMusicalDNA;
}
