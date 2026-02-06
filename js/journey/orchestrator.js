/**
 * GUMP Journey Orchestrator
 *
 * Ties together the arc, conducting input, and instruments.
 * Listens to the user's conducting and translates it into music.
 *
 * The music dances to you.
 */

const GumpJourney = (function() {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let isInitialized = false;
    let animationFrame = null;
    let lastUpdateTime = 0;

    const state = {
        active: false,
        currentAct: null,
        activeStringVoices: [],
        lastConducting: null,
        lastNoteTime: 0,
        noteInterval: 200,  // Min ms between notes
        heavenGatesActive: false
    };

    // Scale progressions for each act
    const SCALES = {
        innocence: {
            scale: [0, 2, 4, 7, 9],  // Pentatonic - pure, simple
            root: 220
        },
        ambition: {
            scale: [0, 2, 4, 5, 7, 9, 11],  // Major - hopeful
            root: 220
        },
        hardships: {
            scale: [0, 2, 3, 5, 7, 8, 10],  // Natural minor - struggle
            root: 196
        },
        prevail: {
            scale: [0, 2, 4, 5, 7, 9, 11],  // Major - triumph
            root: 246.94  // B3 - brighter
        },
        fade: {
            scale: [0, 2, 4, 7, 9],  // Back to pentatonic
            root: 220
        }
    };

    function init(audioContext) {
        ctx = audioContext;

        // Create master output
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.7;
        masterGain.connect(ctx.destination);

        // Initialize subsystems
        GumpConductorInput.init();
        GumpArc.init();
        GumpStrings.init(ctx, masterGain);
        GumpGroove.init(ctx, masterGain);

        // Subscribe to events
        GumpEvents.on('act.change', onActChange);
        GumpEvents.on('arc.update', onArcUpdate);
        GumpEvents.on('gesture.start', onGestureStart);
        GumpEvents.on('gesture.move', onGestureMove);
        GumpEvents.on('gesture.end', onGestureEnd);

        isInitialized = true;
        console.log('[Journey] Orchestrator ready');
    }

    function start() {
        if (!isInitialized) {
            console.error('[Journey] Not initialized');
            return;
        }

        state.active = true;
        lastUpdateTime = performance.now();
        update();

        console.log('[Journey] Started - awaiting conductor');
    }

    function stop() {
        state.active = false;

        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        // Fade everything out
        GumpStrings.releaseAll(1);
        GumpGroove.stop(1);

        const now = ctx.currentTime;
        masterGain.gain.linearRampToValueAtTime(0, now + 1);
    }

    function update() {
        if (!state.active) return;

        const now = performance.now();
        const deltaTime = now - lastUpdateTime;
        lastUpdateTime = now;

        // Update arc (handles energy accumulation and act transitions)
        GumpArc.update(deltaTime);

        // Get current conducting input
        const conducting = GumpConductorInput.getConductingVector();
        state.lastConducting = conducting;

        // Update instruments based on act and conducting
        updateInstruments(conducting, deltaTime);

        animationFrame = requestAnimationFrame(update);
    }

    function updateInstruments(conducting, deltaTime) {
        const act = GumpArc.getCurrentAct();
        if (!act) return;

        // Update strings (always present in some form)
        GumpStrings.updateFromConducting(conducting);

        // Trigger notes based on conducting movement
        if (conducting.articulation > 0.1 && canPlayNote()) {
            triggerConductedNote(conducting, act);
        }
    }

    function canPlayNote() {
        return performance.now() - state.lastNoteTime > state.noteInterval;
    }

    function triggerConductedNote(conducting, act) {
        state.lastNoteTime = performance.now();

        const scaleConfig = SCALES[act.name] || SCALES.innocence;
        GumpStrings.setScale(scaleConfig.scale, scaleConfig.root);

        // Determine note from conducting position
        const noteIndex = Math.floor(conducting.section * scaleConfig.scale.length);
        const octave = Math.floor((1 - conducting.section) * 2);

        // Determine instrument based on section and act
        let instrument = 'violin';
        if (conducting.section < 0.25) instrument = 'bass';
        else if (conducting.section < 0.4) instrument = 'cello';
        else if (conducting.section < 0.6) instrument = 'viola';

        // In later acts, richer orchestration
        if (act.name === 'prevail') {
            // Full section plays
            ['violin', 'viola', 'cello'].forEach((inst, i) => {
                GumpStrings.play({
                    instrument: inst,
                    note: noteIndex + i * 2,
                    octave: octave - i,
                    dynamics: conducting.dynamics * (1 - i * 0.2),
                    articulation: conducting.articulation,
                    vibrato: conducting.expression?.vibrato || 0.3,
                    pan: (i - 1) * 0.5,
                    duration: 0.3 + (1 - conducting.articulation) * 1.5
                });
            });
        } else {
            // Single voice
            GumpStrings.play({
                instrument,
                note: noteIndex,
                octave,
                dynamics: conducting.dynamics,
                articulation: conducting.articulation,
                vibrato: conducting.expression?.vibrato || 0.3,
                pan: (conducting.section - 0.5) * 2,
                duration: 0.3 + (1 - conducting.articulation) * 2
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function onActChange(data) {
        const { from, to, energy } = data;

        console.log(`[Journey] Act: ${from?.name || 'none'} → ${to.name}`);

        // Update scale
        const scaleConfig = SCALES[to.name] || SCALES.innocence;
        GumpStrings.setScale(scaleConfig.scale, scaleConfig.root);

        // Handle act-specific transitions
        switch (to.name) {
            case 'innocence':
                // Pure strings, no beat
                GumpGroove.stop(0.5);
                state.noteInterval = 300;  // Slower, more deliberate
                break;

            case 'ambition':
                // Groove emerges
                if (!GumpGroove.isPlaying) {
                    GumpGroove.setTempo(85);
                    GumpGroove.setIntensity(0.5);
                    GumpGroove.start();
                }

                // Heaven gates pad
                if (!state.heavenGatesActive) {
                    state.heavenGatesActive = true;
                    GumpGroove.playHeavenGates([0, 4, 7, 11], 8);  // Maj7 chord
                }

                state.noteInterval = 200;
                break;

            case 'hardships':
                // Intensify
                GumpGroove.setTempo(90);
                GumpGroove.setIntensity(0.7);
                GumpGroove.playHeavenGates([0, 3, 7, 10], 6);  // min7 - tension
                state.noteInterval = 150;
                break;

            case 'prevail':
                // Full power
                GumpGroove.setTempo(95);
                GumpGroove.setIntensity(1.0);
                GumpGroove.playHeavenGates([0, 4, 7, 11, 14], 8);  // Maj9 - triumph
                state.noteInterval = 100;  // Fast response
                break;

            case 'fade':
                // Wind down
                GumpGroove.setIntensity(0.3);
                setTimeout(() => {
                    if (state.active && GumpArc.getCurrentAct()?.name === 'fade') {
                        GumpGroove.stop(3);
                    }
                }, 5000);
                state.noteInterval = 400;  // Slow, peaceful
                break;
        }

        // Emit for visuals
        GumpEvents.emit('journey.act', {
            act: to,
            energy,
            colors: to.colors
        });
    }

    function onArcUpdate(data) {
        const { act, energy, conducting } = data;

        // Continuous updates to groove intensity
        if (act.name !== 'innocence' && act.name !== 'fade') {
            GumpGroove.setIntensity(energy);
        }
    }

    function onGestureStart(data) {
        // First touch - awaken
        if (!state.active) {
            start();
        }

        // Brief silence before the first note
        state.lastNoteTime = performance.now();
    }

    function onGestureMove(data) {
        // Continuous conducting - handled in update loop
    }

    function onGestureEnd(data) {
        // Release sustained strings
        GumpStrings.releaseAll(0.5);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        init,
        start,
        stop,

        get isActive() { return state.active; },
        get currentAct() { return GumpArc.getCurrentAct(); },
        get energy() { return GumpArc.getEnergy(); },

        // Debug
        getState: () => ({ ...state })
    });

})();

if (typeof window !== 'undefined') {
    window.GumpJourney = GumpJourney;
}
