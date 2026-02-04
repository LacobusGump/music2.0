// ═══════════════════════════════════════════════════════════════════════════
// GUMP EVENT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
//
// Central event bus for communication between all systems.
// Supports typed events, wildcards, and event history.
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpEvents = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT TYPES
    // ═══════════════════════════════════════════════════════════════════════

    const EVENT_TYPES = Object.freeze({
        // Session events
        SESSION_START: 'session.start',
        SESSION_PAUSE: 'session.pause',
        SESSION_RESUME: 'session.resume',
        SESSION_END: 'session.end',

        // Input events
        INPUT_MOVE: 'input.move',
        INPUT_TOUCH_START: 'input.touch.start',
        INPUT_TOUCH_END: 'input.touch.end',
        INPUT_MOTION: 'input.motion',
        INPUT_MIC: 'input.mic',

        // Grid events
        ZONE_ENTER: 'zone.enter',
        ZONE_EXIT: 'zone.exit',
        ZONE_DWELL: 'zone.dwell',
        ZONE_THRESHOLD: 'zone.threshold',
        ZONE_ACTIVATE: 'zone.activate',
        ZONE_DEACTIVATE: 'zone.deactivate',
        ZONE_LOCK: 'zone.lock',

        // Pattern events
        PATTERN_DETECTED: 'pattern.detected',
        PATTERN_COMPLETED: 'pattern.completed',
        PATTERN_FAILED: 'pattern.failed',
        COMBO_START: 'combo.start',
        COMBO_COMPLETE: 'combo.complete',
        COMBO_BREAK: 'combo.break',

        // Era events
        ERA_PROGRESS: 'era.progress',
        ERA_THRESHOLD: 'era.threshold',
        ERA_TRANSITION_START: 'era.transition.start',
        ERA_TRANSITION_COMPLETE: 'era.transition.complete',
        ERA_CHANGE: 'era.change',

        // Unlock events
        UNLOCK_PENDING: 'unlock.pending',
        UNLOCK_COMPLETE: 'unlock.complete',
        UNLOCK_LOCK: 'unlock.lock',
        UNLOCK_ACTIVATE: 'unlock.activate',
        UNLOCK_DEACTIVATE: 'unlock.deactivate',

        // Music events
        MUSIC_START: 'music.start',
        MUSIC_STOP: 'music.stop',
        MUSIC_BEAT: 'music.beat',
        MUSIC_BAR: 'music.bar',
        MUSIC_PHRASE: 'music.phrase',
        MUSIC_CHORD: 'music.chord',
        MUSIC_KEY: 'music.key',
        MUSIC_TEMPO: 'music.tempo',
        MUSIC_LAYER_ADD: 'music.layer.add',
        MUSIC_LAYER_REMOVE: 'music.layer.remove',
        MUSIC_BUILD_START: 'music.build.start',
        MUSIC_BUILD_PEAK: 'music.build.peak',
        MUSIC_DROP: 'music.drop',

        // Agent events
        AGENT_ACTIVATE: 'agent.activate',
        AGENT_DEACTIVATE: 'agent.deactivate',
        AGENT_DECISION: 'agent.decision',
        AGENT_CONDUCTOR_DIRECTIVE: 'agent.conductor.directive',

        // Audio events
        AUDIO_READY: 'audio.ready',
        AUDIO_ERROR: 'audio.error',
        AUDIO_NOTE: 'audio.note',
        AUDIO_DRUM: 'audio.drum',
        AUDIO_EFFECT: 'audio.effect',

        // Visual events
        VISUAL_PARTICLE: 'visual.particle',
        VISUAL_FLASH: 'visual.flash',
        VISUAL_PULSE: 'visual.pulse',
        VISUAL_TRANSITION: 'visual.transition',

        // System events
        ERROR: 'error',
        WARNING: 'warning',
        DEBUG: 'debug',
    });

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT STATE
    // ═══════════════════════════════════════════════════════════════════════

    const eventState = {
        // Listeners
        listeners: new Map(),        // eventType -> Set of callbacks
        wildcardListeners: new Map(), // pattern -> Set of callbacks
        onceListeners: new Map(),    // eventType -> Set of callbacks (fire once)

        // History
        history: [],
        maxHistory: 1000,

        // Stats
        eventCounts: {},
        lastEventTime: {},

        // Middleware
        middleware: [],

        // Debug
        debugMode: false,
        debugFilter: null,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // SUBSCRIPTION
    // ═══════════════════════════════════════════════════════════════════════

    function on(eventType, callback, options = {}) {
        const { priority = 0, context = null } = options;

        // Wrap callback with context if provided
        const wrappedCallback = context ?
            (data, event) => callback.call(context, data, event) :
            callback;

        wrappedCallback._priority = priority;
        wrappedCallback._original = callback;

        // Handle wildcard subscriptions
        if (eventType.includes('*')) {
            if (!eventState.wildcardListeners.has(eventType)) {
                eventState.wildcardListeners.set(eventType, new Set());
            }
            eventState.wildcardListeners.get(eventType).add(wrappedCallback);
        } else {
            if (!eventState.listeners.has(eventType)) {
                eventState.listeners.set(eventType, new Set());
            }
            eventState.listeners.get(eventType).add(wrappedCallback);
        }

        // Return unsubscribe function
        return () => off(eventType, callback);
    }

    function once(eventType, callback, options = {}) {
        const wrappedCallback = (data, event) => {
            off(eventType, wrappedCallback);
            callback(data, event);
        };
        wrappedCallback._original = callback;

        if (!eventState.onceListeners.has(eventType)) {
            eventState.onceListeners.set(eventType, new Set());
        }
        eventState.onceListeners.get(eventType).add(wrappedCallback);

        return () => off(eventType, callback);
    }

    function off(eventType, callback) {
        // Remove from regular listeners
        if (eventState.listeners.has(eventType)) {
            const listeners = eventState.listeners.get(eventType);
            for (const listener of listeners) {
                if (listener === callback || listener._original === callback) {
                    listeners.delete(listener);
                    break;
                }
            }
        }

        // Remove from wildcard listeners
        if (eventState.wildcardListeners.has(eventType)) {
            const listeners = eventState.wildcardListeners.get(eventType);
            for (const listener of listeners) {
                if (listener === callback || listener._original === callback) {
                    listeners.delete(listener);
                    break;
                }
            }
        }

        // Remove from once listeners
        if (eventState.onceListeners.has(eventType)) {
            const listeners = eventState.onceListeners.get(eventType);
            for (const listener of listeners) {
                if (listener === callback || listener._original === callback) {
                    listeners.delete(listener);
                    break;
                }
            }
        }
    }

    function offAll(eventType) {
        eventState.listeners.delete(eventType);
        eventState.wildcardListeners.delete(eventType);
        eventState.onceListeners.delete(eventType);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EMISSION
    // ═══════════════════════════════════════════════════════════════════════

    function emit(eventType, data = {}) {
        const timestamp = Date.now();

        // Create event object
        const event = {
            type: eventType,
            data,
            timestamp,
            prevented: false,
            stopped: false,
        };

        // Run middleware
        for (const mw of eventState.middleware) {
            const result = mw(event);
            if (result === false) {
                return event; // Middleware blocked the event
            }
        }

        // Debug logging
        if (eventState.debugMode) {
            if (!eventState.debugFilter || eventType.match(eventState.debugFilter)) {
                console.log(`[Event] ${eventType}`, data);
            }
        }

        // Update stats
        eventState.eventCounts[eventType] = (eventState.eventCounts[eventType] || 0) + 1;
        eventState.lastEventTime[eventType] = timestamp;

        // Add to history
        eventState.history.push(event);
        if (eventState.history.length > eventState.maxHistory) {
            eventState.history = eventState.history.slice(-eventState.maxHistory / 2);
        }

        // Get all matching listeners
        const allListeners = [];

        // Direct listeners
        if (eventState.listeners.has(eventType)) {
            for (const listener of eventState.listeners.get(eventType)) {
                allListeners.push(listener);
            }
        }

        // Wildcard listeners
        for (const [pattern, listeners] of eventState.wildcardListeners.entries()) {
            if (matchesPattern(eventType, pattern)) {
                for (const listener of listeners) {
                    allListeners.push(listener);
                }
            }
        }

        // Once listeners
        if (eventState.onceListeners.has(eventType)) {
            for (const listener of eventState.onceListeners.get(eventType)) {
                allListeners.push(listener);
            }
            eventState.onceListeners.delete(eventType);
        }

        // Sort by priority
        allListeners.sort((a, b) => (b._priority || 0) - (a._priority || 0));

        // Call listeners
        for (const listener of allListeners) {
            if (event.stopped) break;

            try {
                listener(data, event);
            } catch (error) {
                console.error(`Error in event listener for ${eventType}:`, error);
                emit(EVENT_TYPES.ERROR, {
                    source: 'event_listener',
                    eventType,
                    error: error.message,
                });
            }
        }

        return event;
    }

    function emitAsync(eventType, data = {}) {
        return new Promise(resolve => {
            setTimeout(() => {
                const event = emit(eventType, data);
                resolve(event);
            }, 0);
        });
    }

    function matchesPattern(eventType, pattern) {
        // Convert pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(eventType);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MIDDLEWARE
    // ═══════════════════════════════════════════════════════════════════════

    function use(middleware) {
        eventState.middleware.push(middleware);

        // Return remove function
        return () => {
            const index = eventState.middleware.indexOf(middleware);
            if (index > -1) {
                eventState.middleware.splice(index, 1);
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    function getHistory(filter = null, limit = 50) {
        let history = eventState.history.slice(-limit);

        if (filter) {
            if (typeof filter === 'string') {
                history = history.filter(e => matchesPattern(e.type, filter));
            } else if (filter instanceof RegExp) {
                history = history.filter(e => filter.test(e.type));
            } else if (typeof filter === 'function') {
                history = history.filter(filter);
            }
        }

        return history;
    }

    function getEventCount(eventType) {
        return eventState.eventCounts[eventType] || 0;
    }

    function getLastEventTime(eventType) {
        return eventState.lastEventTime[eventType] || null;
    }

    function getListenerCount(eventType) {
        let count = 0;

        if (eventState.listeners.has(eventType)) {
            count += eventState.listeners.get(eventType).size;
        }

        if (eventState.onceListeners.has(eventType)) {
            count += eventState.onceListeners.get(eventType).size;
        }

        return count;
    }

    function getAllEventTypes() {
        const types = new Set();

        for (const type of eventState.listeners.keys()) {
            types.add(type);
        }

        for (const event of eventState.history) {
            types.add(event.type);
        }

        return Array.from(types).sort();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    function waitFor(eventType, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                off(eventType, handler);
                reject(new Error(`Timeout waiting for event: ${eventType}`));
            }, timeout);

            const handler = (data, event) => {
                clearTimeout(timeoutId);
                resolve({ data, event });
            };

            once(eventType, handler);
        });
    }

    function pipe(sourceType, targetType, transform = null) {
        return on(sourceType, (data, event) => {
            const transformedData = transform ? transform(data, event) : data;
            emit(targetType, transformedData);
        });
    }

    function debounce(eventType, callback, delay = 100) {
        let timeoutId = null;
        let lastData = null;
        let lastEvent = null;

        return on(eventType, (data, event) => {
            lastData = data;
            lastEvent = event;

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                callback(lastData, lastEvent);
                timeoutId = null;
            }, delay);
        });
    }

    function throttle(eventType, callback, interval = 100) {
        let lastCall = 0;
        let lastData = null;
        let lastEvent = null;
        let timeoutId = null;

        return on(eventType, (data, event) => {
            const now = Date.now();
            lastData = data;
            lastEvent = event;

            if (now - lastCall >= interval) {
                lastCall = now;
                callback(data, event);
            } else if (!timeoutId) {
                timeoutId = setTimeout(() => {
                    lastCall = Date.now();
                    callback(lastData, lastEvent);
                    timeoutId = null;
                }, interval - (now - lastCall));
            }
        });
    }

    function batch(eventType, callback, interval = 16) {
        let events = [];
        let timeoutId = null;

        return on(eventType, (data, event) => {
            events.push({ data, event });

            if (!timeoutId) {
                timeoutId = setTimeout(() => {
                    callback(events);
                    events = [];
                    timeoutId = null;
                }, interval);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════════════════

    function enableDebug(filter = null) {
        eventState.debugMode = true;
        eventState.debugFilter = filter;
    }

    function disableDebug() {
        eventState.debugMode = false;
        eventState.debugFilter = null;
    }

    function getStats() {
        return {
            totalEvents: Object.values(eventState.eventCounts).reduce((a, b) => a + b, 0),
            eventCounts: { ...eventState.eventCounts },
            listenerCounts: Object.fromEntries(
                Array.from(eventState.listeners.entries()).map(([k, v]) => [k, v.size])
            ),
            historyLength: eventState.history.length,
            middlewareCount: eventState.middleware.length,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════════════════

    function reset() {
        eventState.listeners.clear();
        eventState.wildcardListeners.clear();
        eventState.onceListeners.clear();
        eventState.history = [];
        eventState.eventCounts = {};
        eventState.lastEventTime = {};
        eventState.middleware = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Constants
        TYPES: EVENT_TYPES,

        // Core
        on,
        once,
        off,
        offAll,
        emit,
        emitAsync,

        // Middleware
        use,

        // Queries
        getHistory,
        getEventCount,
        getLastEventTime,
        getListenerCount,
        getAllEventTypes,

        // Helpers
        waitFor,
        pipe,
        debounce,
        throttle,
        batch,

        // Debug
        enableDebug,
        disableDebug,
        getStats,

        // Utilities
        reset,
    });
})();

// Make globally available
if (typeof window !== 'undefined') {
    window.GumpEvents = GumpEvents;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpEvents;
}
