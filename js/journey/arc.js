/**
 * GUMP Journey Arc System
 *
 * The 5-act structure of every musical journey:
 * 1. INNOCENCE - Strings emerge, pure, ethereal
 * 2. AMBITION - Groove builds, 808s, reaching
 * 3. HARDSHIPS - Tension, struggle, dissonance
 * 4. PREVAIL - Triumph, full power, breakthrough
 * 5. FADE - Resolution, return to peace
 */

const GumpArc = (function() {
    'use strict';

    const ACTS = {
        INNOCENCE: {
            name: 'innocence',
            threshold: 0,
            duration: 30000,  // 30 seconds minimum
            description: 'Strings emerge from silence',
            instruments: ['strings'],
            tempo: null,  // Rubato - free time
            intensity: { min: 0, max: 0.3 },
            reverb: 0.8,
            colors: { primary: '#E8E4E1', secondary: '#C9B8A8' }
        },
        AMBITION: {
            name: 'ambition',
            threshold: 0.25,
            duration: 45000,
            description: 'Groove descends, reaching for more',
            instruments: ['strings', '808', 'pads'],
            tempo: 85,
            intensity: { min: 0.3, max: 0.6 },
            reverb: 0.5,
            colors: { primary: '#8B7355', secondary: '#4A3728' }
        },
        HARDSHIPS: {
            name: 'hardships',
            threshold: 0.5,
            duration: 40000,
            description: 'Tension rises, struggle emerges',
            instruments: ['strings', '808', 'pads', 'bass'],
            tempo: 90,
            intensity: { min: 0.5, max: 0.8 },
            reverb: 0.3,
            dissonance: 0.3,
            colors: { primary: '#3D2914', secondary: '#1A0F05' }
        },
        PREVAIL: {
            name: 'prevail',
            threshold: 0.75,
            duration: 35000,
            description: 'Breakthrough, triumph, full power',
            instruments: ['strings', '808', 'pads', 'bass', 'lead'],
            tempo: 95,
            intensity: { min: 0.8, max: 1.0 },
            reverb: 0.4,
            colors: { primary: '#FFD700', secondary: '#FF4500' }
        },
        FADE: {
            name: 'fade',
            threshold: 0.9,
            duration: 20000,
            description: 'Return to peace, resolution',
            instruments: ['strings', 'pads'],
            tempo: 75,
            intensity: { min: 0.1, max: 0.3 },
            reverb: 0.9,
            colors: { primary: '#E8E4E1', secondary: '#FFFFFF' }
        }
    };

    const state = {
        currentAct: null,
        energy: 0,
        actStartTime: 0,
        totalJourneyTime: 0,
        gestureAccumulator: 0,
        peakReached: false,
        isActive: false,
        lastGestureTime: 0,

        // Conducting input
        conducting: {
            intensity: 0,      // How energetic the gestures
            direction: 0,      // -1 to 1, left to right
            height: 0,         // 0 to 1, low to high
            velocity: 0,       // Speed of movement
            gyroTilt: { x: 0, y: 0, z: 0 }
        }
    };

    function init() {
        state.currentAct = ACTS.INNOCENCE;
        state.energy = 0;
        state.actStartTime = performance.now();
        state.isActive = false;
        state.peakReached = false;

        // Subscribe to events
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('gesture.start', onGestureStart);
            GumpEvents.on('gesture.move', onGestureMove);
            GumpEvents.on('gesture.end', onGestureEnd);
            GumpEvents.on('gyro.update', onGyroUpdate);
        }

        console.log('[Arc] Initialized - Journey awaits');
    }

    function start() {
        state.isActive = true;
        state.actStartTime = performance.now();
        state.currentAct = ACTS.INNOCENCE;
        state.energy = 0;
        state.peakReached = false;

        emit('arc.started', { act: state.currentAct });
        emit('act.change', {
            act: state.currentAct,
            from: null,
            to: ACTS.INNOCENCE
        });

        console.log('[Arc] Journey begun - Innocence');
    }

    function update(deltaTime) {
        if (!state.isActive) return;

        const now = performance.now();
        state.totalJourneyTime += deltaTime;

        // Energy decays when not conducting
        const timeSinceGesture = now - state.lastGestureTime;
        if (timeSinceGesture > 2000) {
            // Start fading energy after 2s of no input
            state.energy = Math.max(0, state.energy - deltaTime * 0.0001);
        }

        // Check for act transitions
        const nextAct = determineAct();
        if (nextAct !== state.currentAct) {
            transitionTo(nextAct);
        }

        // Emit continuous state for instruments to respond
        emit('arc.update', {
            act: state.currentAct,
            energy: state.energy,
            conducting: state.conducting,
            journeyTime: state.totalJourneyTime
        });
    }

    function determineAct() {
        // If we've peaked and energy is dropping, we're in FADE
        if (state.peakReached && state.energy < 0.5) {
            return ACTS.FADE;
        }

        // Otherwise, determine by energy level
        if (state.energy >= ACTS.PREVAIL.threshold) {
            state.peakReached = true;
            return ACTS.PREVAIL;
        } else if (state.energy >= ACTS.HARDSHIPS.threshold) {
            return ACTS.HARDSHIPS;
        } else if (state.energy >= ACTS.AMBITION.threshold) {
            return ACTS.AMBITION;
        } else {
            return ACTS.INNOCENCE;
        }
    }

    function transitionTo(newAct) {
        const oldAct = state.currentAct;
        state.currentAct = newAct;
        state.actStartTime = performance.now();

        console.log(`[Arc] ${oldAct.name} → ${newAct.name}`);

        emit('act.change', {
            from: oldAct,
            to: newAct,
            energy: state.energy,
            journeyTime: state.totalJourneyTime
        });
    }

    // Gesture handlers
    function onGestureStart(data) {
        if (!state.isActive) {
            start();
        }
        state.lastGestureTime = performance.now();
        updateConducting(data);
    }

    function onGestureMove(data) {
        state.lastGestureTime = performance.now();
        updateConducting(data);

        // Accumulate energy based on gesture intensity
        const intensity = state.conducting.velocity * 0.5 +
                         state.conducting.intensity * 0.5;
        state.energy = Math.min(1, state.energy + intensity * 0.002);
    }

    function onGestureEnd(data) {
        // Don't immediately kill - let it breathe
        state.conducting.velocity = 0;
    }

    function onGyroUpdate(data) {
        state.conducting.gyroTilt = {
            x: data.alpha || 0,
            y: data.beta || 0,
            z: data.gamma || 0
        };
    }

    function updateConducting(data) {
        const { x, y, velocityX, velocityY } = data;

        // Direction: -1 (left) to 1 (right)
        state.conducting.direction = (x - 0.5) * 2;

        // Height: 0 (bottom) to 1 (top)
        state.conducting.height = 1 - y;

        // Velocity: magnitude of movement
        if (velocityX !== undefined && velocityY !== undefined) {
            state.conducting.velocity = Math.min(1,
                Math.sqrt(velocityX * velocityX + velocityY * velocityY) / 500
            );
        }

        // Intensity: combination of velocity and position extremes
        state.conducting.intensity = Math.max(
            state.conducting.velocity,
            Math.abs(state.conducting.direction) * 0.5,
            Math.abs(state.conducting.height - 0.5) * 0.5
        );
    }

    function emit(event, data) {
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit(event, data);
        }
    }

    // Get current conducting parameters for instruments
    function getConducting() {
        return {
            ...state.conducting,
            act: state.currentAct,
            energy: state.energy,
            actProgress: getActProgress()
        };
    }

    function getActProgress() {
        const elapsed = performance.now() - state.actStartTime;
        return Math.min(1, elapsed / state.currentAct.duration);
    }

    function getCurrentAct() {
        return state.currentAct;
    }

    function getEnergy() {
        return state.energy;
    }

    function isActive() {
        return state.isActive;
    }

    return Object.freeze({
        init,
        start,
        update,
        getConducting,
        getCurrentAct,
        getEnergy,
        isActive,
        ACTS,

        // For debugging
        getState: () => ({ ...state })
    });

})();

if (typeof window !== 'undefined') {
    window.GumpArc = GumpArc;
}
