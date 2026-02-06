/**
 * GUMP Voice Manager - Active Voice Tracking & Interruption
 *
 * Tracks all playing audio voices and provides mechanisms to:
 * - Fade out voices when gestures end
 * - Kill voices when zones change
 * - Prevent drone buildup
 */

const GumpVoiceManager = (function() {
    'use strict';

    const state = {
        ctx: null,
        activeVoices: new Map(),  // id -> { source, gain, zone, startTime, type }
        voiceCounter: 0,
        maxVoices: 12,
        gestureActive: false,
        currentZone: null,

        // Fade settings
        gestureEndFade: 0.15,    // 150ms fade on gesture end
        zoneChangeFade: 0.1,     // 100ms fade on zone change
        maxVoiceAge: 10000,      // Kill voices older than 10s
    };

    function init(audioContext) {
        state.ctx = audioContext;

        // Subscribe to gesture events
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('gesture.start', onGestureStart);
            GumpEvents.on('gesture.end', onGestureEnd);
            GumpEvents.on('zone.change', onZoneChange);
        }

        // Periodic cleanup of stale voices
        setInterval(cleanupStaleVoices, 2000);

        console.log('[VoiceManager] Initialized');
    }

    // Register a new voice for tracking
    function register(source, gain, options = {}) {
        if (!state.ctx) return null;

        const id = `voice_${++state.voiceCounter}`;
        const voice = {
            id,
            source,
            gain,
            zone: options.zone || state.currentZone,
            type: options.type || 'unknown',
            startTime: performance.now(),
            baseVolume: gain.gain.value
        };

        state.activeVoices.set(id, voice);

        // Enforce max voices
        if (state.activeVoices.size > state.maxVoices) {
            killOldestVoice();
        }

        return id;
    }

    // Fade out a specific voice
    function fadeOut(voiceId, duration = 0.1) {
        const voice = state.activeVoices.get(voiceId);
        if (!voice || !voice.gain || !state.ctx) return;

        const now = state.ctx.currentTime;

        try {
            voice.gain.gain.cancelScheduledValues(now);
            voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
            voice.gain.gain.linearRampToValueAtTime(0, now + duration);

            // Stop source after fade
            setTimeout(() => {
                try {
                    if (voice.source && voice.source.stop) {
                        voice.source.stop();
                    }
                } catch (e) {
                    // Source may already be stopped
                }
                state.activeVoices.delete(voiceId);
            }, duration * 1000 + 50);
        } catch (e) {
            // Voice may be in invalid state
            state.activeVoices.delete(voiceId);
        }
    }

    // Fade out all voices
    function fadeOutAll(duration = 0.15) {
        for (const [id, voice] of state.activeVoices) {
            fadeOut(id, duration);
        }
    }

    // Fade out voices from a specific zone
    function fadeOutZone(zone, duration = 0.1) {
        for (const [id, voice] of state.activeVoices) {
            if (voice.zone === zone) {
                fadeOut(id, duration);
            }
        }
    }

    // Fade out voices of a specific type
    function fadeOutType(type, duration = 0.1) {
        for (const [id, voice] of state.activeVoices) {
            if (voice.type === type) {
                fadeOut(id, duration);
            }
        }
    }

    // Kill the oldest voice
    function killOldestVoice() {
        let oldest = null;
        let oldestTime = Infinity;

        for (const [id, voice] of state.activeVoices) {
            if (voice.startTime < oldestTime) {
                oldestTime = voice.startTime;
                oldest = id;
            }
        }

        if (oldest) {
            fadeOut(oldest, 0.05);
        }
    }

    // Cleanup voices that have been playing too long
    function cleanupStaleVoices() {
        const now = performance.now();

        for (const [id, voice] of state.activeVoices) {
            if (now - voice.startTime > state.maxVoiceAge) {
                fadeOut(id, 0.2);
            }
        }
    }

    // Event handlers
    function onGestureStart(data) {
        state.gestureActive = true;
        if (data.zone) {
            state.currentZone = data.zone;
        }
    }

    function onGestureEnd(data) {
        state.gestureActive = false;

        // Fade out all voices when gesture ends
        fadeOutAll(state.gestureEndFade);
    }

    function onZoneChange(data) {
        const { from, to } = data;

        // Fade out voices from the zone we're leaving
        if (from) {
            fadeOutZone(from, state.zoneChangeFade);
        }

        state.currentZone = to;
    }

    // Set current zone without triggering fade (for initialization)
    function setCurrentZone(zone) {
        state.currentZone = zone;
    }

    // Get status
    function getStatus() {
        return {
            activeVoices: state.activeVoices.size,
            gestureActive: state.gestureActive,
            currentZone: state.currentZone
        };
    }

    return Object.freeze({
        init,
        register,
        fadeOut,
        fadeOutAll,
        fadeOutZone,
        fadeOutType,
        setCurrentZone,
        getStatus,

        // Config
        setGestureEndFade: (ms) => { state.gestureEndFade = ms / 1000; },
        setZoneChangeFade: (ms) => { state.zoneChangeFade = ms / 1000; },
        setMaxVoices: (n) => { state.maxVoices = n; },

        get activeCount() { return state.activeVoices.size; },
        get isGestureActive() { return state.gestureActive; }
    });

})();

// Auto-export
if (typeof window !== 'undefined') {
    window.GumpVoiceManager = GumpVoiceManager;
}
