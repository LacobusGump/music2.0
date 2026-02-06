/**
 * GUMP Journey Orchestrator v2
 *
 * The conductor of conductors.
 * Listens to your gestures, guides the orchestra, shapes the journey.
 *
 * INNOCENCE → AMBITION → HARDSHIPS → PREVAIL → FADE
 *
 * The music dances to you.
 */

const GumpJourney = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let initialized = false;

    const state = {
        active: false,
        currentAct: null,
        energy: 0,
        lastConducting: null,
        actStartTime: 0,
        journeyStartTime: 0,

        // Energy accumulation
        gestureEnergy: 0,      // From movement
        sustainedEnergy: 0,    // From holding
        momentumEnergy: 0,     // Carries between gestures

        // Musical state
        intensity: 0,
        tension: 0,
        release: 0
    };

    // The five acts of every journey
    const ACTS = {
        innocence: {
            name: 'innocence',
            threshold: 0,
            minDuration: 15000,   // At least 15 seconds
            scale: [0, 2, 4, 7, 9],  // Pentatonic - pure
            root: 220,
            tempo: null,  // Rubato
            reverbMix: 0.7,
            description: 'Strings emerge from silence'
        },
        ambition: {
            name: 'ambition',
            threshold: 0.25,
            minDuration: 20000,
            scale: [0, 2, 4, 5, 7, 9, 11],  // Major - hopeful
            root: 220,
            tempo: 80,
            reverbMix: 0.5,
            description: 'Groove descends, reaching upward'
        },
        hardships: {
            name: 'hardships',
            threshold: 0.5,
            minDuration: 25000,
            scale: [0, 2, 3, 5, 7, 8, 10],  // Natural minor - struggle
            root: 196,  // G - darker
            tempo: 88,
            reverbMix: 0.4,
            description: 'Tension rises, the struggle'
        },
        prevail: {
            name: 'prevail',
            threshold: 0.75,
            minDuration: 20000,
            scale: [0, 2, 4, 5, 7, 9, 11],  // Major - triumph
            root: 247,  // B - bright
            tempo: 95,
            reverbMix: 0.45,
            description: 'Breakthrough, full power'
        },
        fade: {
            name: 'fade',
            threshold: 0,  // Triggered by energy drop after prevail
            minDuration: 15000,
            scale: [0, 2, 4, 7, 9],  // Back to pentatonic
            root: 220,
            tempo: 70,
            reverbMix: 0.8,
            description: 'Resolution, return to peace'
        }
    };

    let peakReached = false;

    function init(audioContext) {
        if (initialized) return;

        ctx = audioContext;

        // Master output
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.8;
        masterGain.connect(ctx.destination);

        // Initialize subsystems
        if (typeof GumpConductorInput !== 'undefined') {
            GumpConductorInput.init();
        }

        if (typeof GumpStrings !== 'undefined') {
            GumpStrings.init(ctx, masterGain);
        }

        if (typeof GumpGroove !== 'undefined') {
            GumpGroove.init(ctx, masterGain);
        }

        if (typeof GumpArc !== 'undefined') {
            GumpArc.init();
        }

        // Subscribe to conducting events
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('conducting.start', onConductingStart);
            GumpEvents.on('conducting.move', onConductingMove);
            GumpEvents.on('conducting.update', onConductingUpdate);
            GumpEvents.on('conducting.end', onConductingEnd);
            GumpEvents.on('conducting.shake', onConductingShake);
        }

        initialized = true;
        state.active = true;
        state.currentAct = ACTS.innocence;

        // Start the journey
        startJourney();

        console.log('[Journey] The orchestra awaits your command');
    }

    function startJourney() {
        state.journeyStartTime = performance.now();
        state.actStartTime = state.journeyStartTime;
        state.currentAct = ACTS.innocence;
        state.energy = 0;
        peakReached = false;

        // Set initial musical state
        applyActSettings(ACTS.innocence);

        // Start update loop
        requestAnimationFrame(update);

        emit('journey.started', { act: ACTS.innocence });
    }

    function update(timestamp) {
        if (!state.active) return;

        const now = timestamp || performance.now();
        const actDuration = now - state.actStartTime;

        // Energy decay when not conducting
        if (!state.lastConducting) {
            state.gestureEnergy *= 0.98;
            state.sustainedEnergy *= 0.99;
        }

        // Momentum energy decays slowly
        state.momentumEnergy *= 0.995;

        // Total energy
        state.energy = Math.min(1,
            state.gestureEnergy * 0.4 +
            state.sustainedEnergy * 0.3 +
            state.momentumEnergy * 0.3
        );

        // Check for act transitions
        checkActTransition(actDuration);

        // Update intensity based on energy and act
        updateIntensity();

        // Emit journey state
        emit('journey.update', {
            act: state.currentAct,
            energy: state.energy,
            intensity: state.intensity,
            journeyTime: now - state.journeyStartTime
        });

        requestAnimationFrame(update);
    }

    function checkActTransition(actDuration) {
        const act = state.currentAct;

        // Don't transition if minimum duration not met
        if (actDuration < act.minDuration) return;

        // Check for progression based on energy
        let nextAct = null;

        if (act === ACTS.innocence && state.energy >= ACTS.ambition.threshold) {
            nextAct = ACTS.ambition;
        } else if (act === ACTS.ambition && state.energy >= ACTS.hardships.threshold) {
            nextAct = ACTS.hardships;
        } else if (act === ACTS.hardships && state.energy >= ACTS.prevail.threshold) {
            nextAct = ACTS.prevail;
            peakReached = true;
        } else if (act === ACTS.prevail && peakReached && state.energy < 0.4) {
            // After reaching peak, energy drop triggers fade
            nextAct = ACTS.fade;
        }

        if (nextAct) {
            transitionToAct(nextAct);
        }
    }

    function transitionToAct(newAct) {
        const oldAct = state.currentAct;
        state.currentAct = newAct;
        state.actStartTime = performance.now();

        console.log(`[Journey] ${oldAct.name} → ${newAct.name}`);

        applyActSettings(newAct);

        emit('journey.act', {
            from: oldAct,
            to: newAct,
            energy: state.energy
        });

        emit('act.change', {
            from: oldAct,
            to: newAct,
            energy: state.energy
        });
    }

    function applyActSettings(act) {
        // Update strings
        if (typeof GumpStrings !== 'undefined') {
            GumpStrings.setScale(act.scale, act.root);
            GumpStrings.setReverbMix(act.reverbMix);
        }

        // Handle groove
        if (typeof GumpGroove !== 'undefined') {
            if (act === ACTS.innocence) {
                // No groove in innocence
                GumpGroove.stop(1);
            } else if (act === ACTS.ambition) {
                // Groove emerges
                if (!GumpGroove.isPlaying) {
                    GumpGroove.setTempo(act.tempo);
                    GumpGroove.setIntensity(0.4);
                    GumpGroove.start();

                    // Heaven gates chord
                    setTimeout(() => {
                        GumpGroove.playHeavenGates([0, 4, 7, 11], 6);
                    }, 2000);
                }
            } else if (act === ACTS.hardships) {
                GumpGroove.setTempo(act.tempo);
                GumpGroove.setIntensity(0.65);

                // Minor heaven gates
                setTimeout(() => {
                    GumpGroove.playHeavenGates([0, 3, 7, 10], 5);
                }, 1000);
            } else if (act === ACTS.prevail) {
                GumpGroove.setTempo(act.tempo);
                GumpGroove.setIntensity(1.0);

                // Triumphant chord
                setTimeout(() => {
                    GumpGroove.playHeavenGates([0, 4, 7, 11, 14], 8);
                }, 500);
            } else if (act === ACTS.fade) {
                // Gentle wind down
                GumpGroove.setIntensity(0.25);
                setTimeout(() => {
                    GumpGroove.stop(4);
                }, 8000);
            }
        }
    }

    function updateIntensity() {
        const act = state.currentAct;

        // Base intensity from act
        let baseIntensity = 0.2;
        if (act === ACTS.ambition) baseIntensity = 0.4;
        if (act === ACTS.hardships) baseIntensity = 0.6;
        if (act === ACTS.prevail) baseIntensity = 0.85;
        if (act === ACTS.fade) baseIntensity = 0.2;

        // Modulate with energy
        state.intensity = baseIntensity + (state.energy * 0.3);

        // Update groove intensity
        if (typeof GumpGroove !== 'undefined' && GumpGroove.isPlaying) {
            GumpGroove.setIntensity(state.intensity);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONDUCTING EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    function onConductingStart(data) {
        state.lastConducting = data;

        // Boost energy on gesture start
        state.gestureEnergy = Math.min(1, state.gestureEnergy + 0.1);
    }

    function onConductingMove(data) {
        state.lastConducting = data;

        const { velocity, expression } = data;

        // Accumulate energy from movement
        const movementEnergy = Math.min(1, velocity * 0.5);
        state.gestureEnergy = Math.min(1, state.gestureEnergy + movementEnergy * 0.02);

        // Articulation affects energy gain rate
        if (expression.articulation > 0.5) {
            state.gestureEnergy = Math.min(1, state.gestureEnergy + 0.01);
        }
    }

    function onConductingUpdate(data) {
        state.lastConducting = data;

        // Sustained conducting builds energy
        state.sustainedEnergy = Math.min(1, state.sustainedEnergy + 0.002);
    }

    function onConductingEnd(data) {
        // Transfer gesture energy to momentum
        state.momentumEnergy = Math.min(1, state.momentumEnergy + state.gestureEnergy * 0.5);
        state.gestureEnergy *= 0.5;

        state.lastConducting = null;
    }

    function onConductingShake(data) {
        const { intensity } = data;

        // Shake adds instant energy
        state.gestureEnergy = Math.min(1, state.gestureEnergy + intensity * 0.15);

        // Drum fill on strong shake
        if (intensity > 0.6 && typeof GumpGroove !== 'undefined' && GumpGroove.isPlaying) {
            // Could trigger a drum fill here
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function emit(event, data) {
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit(event, data);
        }
    }

    function stop() {
        state.active = false;

        if (typeof GumpStrings !== 'undefined') {
            GumpStrings.fadeOutAllVoices(2);
        }

        if (typeof GumpGroove !== 'undefined') {
            GumpGroove.stop(2);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,
        stop,

        get isActive() { return state.active; },
        get currentAct() { return state.currentAct; },
        get energy() { return state.energy; },
        get intensity() { return state.intensity; },

        getState() {
            return {
                active: state.active,
                act: state.currentAct?.name,
                energy: state.energy,
                intensity: state.intensity,
                peakReached
            };
        }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpJourney = GumpJourney;
}
