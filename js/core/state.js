// ═══════════════════════════════════════════════════════════════════════════
// GUMP STATE MANAGEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
//
// Central state store for the entire application.
// All systems read from and write to this shared state.
// Implements observer pattern for reactive updates.
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpState = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const ERAS = Object.freeze({
        GENESIS: 'genesis',
        PRIMORDIAL: 'primordial',
        TRIBAL: 'tribal',
        SACRED: 'sacred',
        MODERN: 'modern'
    });

    const ZONES = Object.freeze({
        NW: 'nw', N: 'n', NE: 'ne',
        W: 'w', CENTER: 'center', E: 'e',
        SW: 'sw', S: 's', SE: 'se'
    });

    const ZONE_COORDS = Object.freeze({
        nw: { x: 0, y: 0 }, n: { x: 1, y: 0 }, ne: { x: 2, y: 0 },
        w: { x: 0, y: 1 }, center: { x: 1, y: 1 }, e: { x: 2, y: 1 },
        sw: { x: 0, y: 2 }, s: { x: 1, y: 2 }, se: { x: 2, y: 2 }
    });

    const DWELL_THRESHOLDS = Object.freeze({
        TOUCH: 0.5,      // Brief touch
        ACTIVATE: 1.5,   // Activation
        LOCK: 3.0,       // Lock in
        TRANSCEND: 5.0,  // Deep dwell
        ENLIGHTEN: 10.0  // Ultimate
    });

    // ═══════════════════════════════════════════════════════════════════════
    // STATE STRUCTURE
    // ═══════════════════════════════════════════════════════════════════════

    const state = {
        // ─────────────────────────────────────────────────────────────────
        // SESSION
        // ─────────────────────────────────────────────────────────────────
        session: {
            id: null,
            startTime: null,
            frameCount: 0,
            deltaTime: 0,
            elapsedTime: 0,
            isActive: false,
            isPaused: false,
        },

        // ─────────────────────────────────────────────────────────────────
        // USER INPUT
        // ─────────────────────────────────────────────────────────────────
        input: {
            // Raw position (0-1 normalized)
            x: 0.5,
            y: 0.5,

            // Velocity
            vx: 0,
            vy: 0,
            speed: 0,

            // Acceleration
            ax: 0,
            ay: 0,

            // Derived
            angle: 0,           // Direction of movement
            energy: 0,          // Overall activity level (0-1)
            stillness: 0,       // How long stationary

            // Device
            hasTouch: false,
            hasMotion: false,
            hasMic: false,

            // Microphone
            micLevel: 0,
            micFrequency: 0,
            micOnset: false,
        },

        // ─────────────────────────────────────────────────────────────────
        // GRID STATE
        // ─────────────────────────────────────────────────────────────────
        grid: {
            // Current zone
            currentZone: ZONES.CENTER,
            previousZone: null,

            // Zone states (each zone has its own state)
            zones: {},  // Initialized below

            // Active zones (zones currently "lit up")
            activeZones: new Set(),

            // Zone connections (which zones are connected by user movement)
            connections: new Map(),

            // Aggregate stats
            totalActivations: 0,
            totalDwellTime: 0,

            // Heat map (how often each zone is visited)
            heatMap: {},
        },

        // ─────────────────────────────────────────────────────────────────
        // PATTERN STATE
        // ─────────────────────────────────────────────────────────────────
        patterns: {
            // Zone visit buffer
            zoneBuffer: [],         // Recent zones visited
            zoneTimestamps: [],     // When each zone was visited
            zoneDurations: [],      // How long in each zone

            // Movement buffer
            positionBuffer: [],     // Recent positions
            velocityBuffer: [],     // Recent velocities

            // Detected patterns
            activePatterns: new Map(),  // Currently detected patterns
            patternHistory: [],         // Past patterns

            // Combo tracking
            comboStack: [],         // Current combo being built
            comboTimer: 0,          // Time since last pattern

            // Stats
            totalPatterns: 0,
            patternCounts: {},      // Count of each pattern type

            // Buffer limits
            maxBufferSize: 100,
        },

        // ─────────────────────────────────────────────────────────────────
        // ERA STATE
        // ─────────────────────────────────────────────────────────────────
        era: {
            current: ERAS.GENESIS,
            previous: null,

            // Progress within current era
            progress: 0,            // 0-1
            threshold: 1.0,         // Required to advance

            // Era-specific state
            eraState: {},

            // Transition state
            isTransitioning: false,
            transitionProgress: 0,
            transitionDuration: 5.0, // seconds

            // History
            eraHistory: [],
            eraStartTimes: {},
        },

        // ─────────────────────────────────────────────────────────────────
        // UNLOCK STATE
        // ─────────────────────────────────────────────────────────────────
        unlocks: {
            // All unlocked items
            unlocked: new Set(),

            // Locked in items (permanent)
            locked: new Set(),

            // Active items (currently producing sound)
            active: new Set(),

            // Pending unlocks (being unlocked)
            pending: new Map(),  // unlock -> progress

            // History
            unlockHistory: [],

            // Counts per era
            unlockCounts: {},
        },

        // ─────────────────────────────────────────────────────────────────
        // MUSIC STATE
        // ─────────────────────────────────────────────────────────────────
        music: {
            // Tempo
            bpm: 90,
            targetBpm: 90,
            beatsPerBar: 4,
            currentBeat: 0,
            currentBar: 0,
            beatPhase: 0,           // 0-1 within current beat

            // Key
            rootNote: 36,           // MIDI note (C2)
            scale: [0, 2, 4, 5, 7, 9, 11], // Major scale intervals
            currentChord: [0, 4, 7], // Current chord intervals
            chordRoot: 0,           // Chord root relative to key

            // Dynamics
            masterVolume: 0.8,
            targetVolume: 0.8,
            intensity: 0,           // Overall intensity 0-1

            // Modulation
            filterCutoff: 2000,
            filterResonance: 0.5,
            reverbMix: 0.3,
            delayMix: 0.2,

            // State
            isPlaying: false,
            isMuted: false,

            // Layers (what's currently sounding)
            activeLayers: new Set(),
            layerVolumes: {},

            // Phrase tracking
            currentPhrase: 0,
            phraseLength: 4,        // bars

            // Build state
            buildState: 'neutral',  // building, dropping, neutral
            buildProgress: 0,
        },

        // ─────────────────────────────────────────────────────────────────
        // AGENT STATE
        // ─────────────────────────────────────────────────────────────────
        agents: {
            // Agent states
            drumMind: {
                active: false,
                lastDecision: null,
                decisionTime: 0,
                pattern: 'steady',
                intensity: 0.5,
                fills: false,
            },
            bassMind: {
                active: false,
                lastDecision: null,
                decisionTime: 0,
                pattern: 'root',
                octave: 0,
                movement: 'static',
            },
            harmonyMind: {
                active: false,
                lastDecision: null,
                decisionTime: 0,
                voicing: 'triad',
                density: 0.5,
                tension: 0,
            },
            leadMind: {
                active: false,
                lastDecision: null,
                decisionTime: 0,
                playing: false,
                phrase: null,
                rest: false,
            },
            textureMind: {
                active: false,
                lastDecision: null,
                decisionTime: 0,
                layers: [],
                density: 0.3,
            },
            dynamicsMind: {
                active: false,
                lastDecision: null,
                decisionTime: 0,
                state: 'neutral',
                target: 0.5,
            },
            conductor: {
                active: false,
                lastDecision: null,
                decisionTime: 0,
                directive: null,
                phase: 'explore',
            },
        },

        // ─────────────────────────────────────────────────────────────────
        // VISUAL STATE
        // ─────────────────────────────────────────────────────────────────
        visual: {
            // Canvas
            width: 0,
            height: 0,
            dpr: 1,

            // Position cursor
            cursorX: 0,
            cursorY: 0,
            cursorSize: 10,

            // Colors (updated per era)
            colorPrimary: '#ffffff',
            colorSecondary: '#000000',
            colorAccent: '#ffd700',
            backgroundColor: '#000000',

            // Effects
            glowIntensity: 0,
            trailLength: 20,
            particleCount: 0,

            // Grid visualization
            gridOpacity: 0.1,
            zoneGlows: {},
            connectionOpacities: {},
        },
    };

    // Initialize zone states
    Object.values(ZONES).forEach(zone => {
        state.grid.zones[zone] = {
            energy: 0,          // Accumulated energy
            heat: 0,            // Recent activity (decays)
            dwellTime: 0,       // Current dwell time
            totalDwell: 0,      // Total time spent in zone
            activations: 0,     // Times activated
            lastVisit: 0,       // Timestamp of last visit
            isActive: false,    // Currently active
            isLocked: false,    // Permanently locked
        };
        state.grid.heatMap[zone] = 0;
        state.visual.zoneGlows[zone] = 0;
    });

    // Initialize era unlock counts
    Object.values(ERAS).forEach(era => {
        state.unlocks.unlockCounts[era] = 0;
    });

    // ═══════════════════════════════════════════════════════════════════════
    // OBSERVERS
    // ═══════════════════════════════════════════════════════════════════════

    const observers = new Map();  // path -> Set of callbacks

    function subscribe(path, callback) {
        if (!observers.has(path)) {
            observers.set(path, new Set());
        }
        observers.get(path).add(callback);

        // Return unsubscribe function
        return () => {
            observers.get(path).delete(callback);
        };
    }

    function notify(path, value) {
        // Notify exact path
        if (observers.has(path)) {
            observers.get(path).forEach(cb => cb(value, path));
        }

        // Notify parent paths (for wildcard subscriptions)
        const parts = path.split('.');
        for (let i = parts.length - 1; i >= 0; i--) {
            const parentPath = parts.slice(0, i).join('.') + '.*';
            if (observers.has(parentPath)) {
                observers.get(parentPath).forEach(cb => cb(value, path));
            }
        }

        // Notify global subscribers
        if (observers.has('*')) {
            observers.get('*').forEach(cb => cb(value, path));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════════════════

    function get(path) {
        const parts = path.split('.');
        let value = state;
        for (const part of parts) {
            if (value === undefined) return undefined;
            value = value[part];
        }
        return value;
    }

    function getZone(zoneId) {
        return state.grid.zones[zoneId];
    }

    function getAgent(agentId) {
        return state.agents[agentId];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTERS
    // ═══════════════════════════════════════════════════════════════════════

    function set(path, value) {
        const parts = path.split('.');
        let target = state;
        for (let i = 0; i < parts.length - 1; i++) {
            target = target[parts[i]];
        }
        const oldValue = target[parts[parts.length - 1]];
        target[parts[parts.length - 1]] = value;

        if (oldValue !== value) {
            notify(path, value);
        }

        return value;
    }

    function update(path, updater) {
        const current = get(path);
        const newValue = updater(current);
        return set(path, newValue);
    }

    function merge(path, partial) {
        const current = get(path);
        const newValue = { ...current, ...partial };
        return set(path, newValue);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    function updateZone(zoneId, updates) {
        const zone = state.grid.zones[zoneId];
        Object.assign(zone, updates);
        notify(`grid.zones.${zoneId}`, zone);
        return zone;
    }

    function activateZone(zoneId) {
        const zone = state.grid.zones[zoneId];
        zone.isActive = true;
        zone.activations++;
        state.grid.activeZones.add(zoneId);
        state.grid.totalActivations++;
        notify('grid.activeZones', state.grid.activeZones);
        notify(`grid.zones.${zoneId}`, zone);
        return zone;
    }

    function deactivateZone(zoneId) {
        const zone = state.grid.zones[zoneId];
        zone.isActive = false;
        state.grid.activeZones.delete(zoneId);
        notify('grid.activeZones', state.grid.activeZones);
        notify(`grid.zones.${zoneId}`, zone);
        return zone;
    }

    function setCurrentZone(zoneId) {
        if (state.grid.currentZone !== zoneId) {
            state.grid.previousZone = state.grid.currentZone;
            state.grid.currentZone = zoneId;

            // Reset dwell on previous zone
            if (state.grid.previousZone) {
                const prevZone = state.grid.zones[state.grid.previousZone];
                prevZone.dwellTime = 0;
            }

            // Update heat map
            state.grid.heatMap[zoneId]++;

            notify('grid.currentZone', zoneId);
            notify('grid.previousZone', state.grid.previousZone);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    function addToZoneBuffer(zoneId, timestamp, duration) {
        state.patterns.zoneBuffer.push(zoneId);
        state.patterns.zoneTimestamps.push(timestamp);
        state.patterns.zoneDurations.push(duration);

        // Trim buffer
        while (state.patterns.zoneBuffer.length > state.patterns.maxBufferSize) {
            state.patterns.zoneBuffer.shift();
            state.patterns.zoneTimestamps.shift();
            state.patterns.zoneDurations.shift();
        }

        notify('patterns.zoneBuffer', state.patterns.zoneBuffer);
    }

    function addToPositionBuffer(x, y, vx, vy, timestamp) {
        state.patterns.positionBuffer.push({ x, y, vx, vy, t: timestamp });
        state.patterns.velocityBuffer.push({ vx, vy, speed: Math.sqrt(vx*vx + vy*vy) });

        // Trim buffer
        while (state.patterns.positionBuffer.length > state.patterns.maxBufferSize) {
            state.patterns.positionBuffer.shift();
            state.patterns.velocityBuffer.shift();
        }
    }

    function registerPattern(patternType, confidence, data) {
        state.patterns.activePatterns.set(patternType, {
            confidence,
            data,
            timestamp: Date.now(),
        });

        state.patterns.totalPatterns++;
        state.patterns.patternCounts[patternType] =
            (state.patterns.patternCounts[patternType] || 0) + 1;

        state.patterns.patternHistory.push({
            type: patternType,
            confidence,
            data,
            timestamp: Date.now(),
        });

        // Limit history
        if (state.patterns.patternHistory.length > 1000) {
            state.patterns.patternHistory = state.patterns.patternHistory.slice(-500);
        }

        notify('patterns.activePatterns', state.patterns.activePatterns);
        notify('patterns.detected', { type: patternType, confidence, data });
    }

    function clearPattern(patternType) {
        state.patterns.activePatterns.delete(patternType);
        notify('patterns.activePatterns', state.patterns.activePatterns);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ERA OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    function setEra(newEra) {
        if (state.era.current !== newEra) {
            state.era.previous = state.era.current;
            state.era.current = newEra;
            state.era.progress = 0;
            state.era.eraHistory.push({
                era: newEra,
                timestamp: Date.now(),
            });
            state.era.eraStartTimes[newEra] = Date.now();

            notify('era.current', newEra);
            notify('era.changed', { from: state.era.previous, to: newEra });
        }
    }

    function updateEraProgress(delta) {
        state.era.progress = Math.min(1, state.era.progress + delta);
        notify('era.progress', state.era.progress);

        if (state.era.progress >= state.era.threshold) {
            notify('era.thresholdReached', state.era.current);
        }
    }

    function startEraTransition(toEra, duration = 5.0) {
        state.era.isTransitioning = true;
        state.era.transitionProgress = 0;
        state.era.transitionDuration = duration;
        notify('era.transitionStart', { from: state.era.current, to: toEra });
    }

    function updateEraTransition(dt) {
        if (!state.era.isTransitioning) return;

        state.era.transitionProgress += dt / state.era.transitionDuration;
        notify('era.transitionProgress', state.era.transitionProgress);

        if (state.era.transitionProgress >= 1) {
            state.era.isTransitioning = false;
            notify('era.transitionComplete', state.era.current);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UNLOCK OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    function unlock(unlockId, era = state.era.current) {
        if (state.unlocks.unlocked.has(unlockId)) return false;

        state.unlocks.unlocked.add(unlockId);
        state.unlocks.unlockCounts[era]++;
        state.unlocks.unlockHistory.push({
            id: unlockId,
            era,
            timestamp: Date.now(),
        });

        notify('unlocks.unlocked', state.unlocks.unlocked);
        notify('unlocks.new', { id: unlockId, era });

        return true;
    }

    function lockIn(unlockId) {
        if (!state.unlocks.unlocked.has(unlockId)) return false;
        if (state.unlocks.locked.has(unlockId)) return false;

        state.unlocks.locked.add(unlockId);
        notify('unlocks.locked', state.unlocks.locked);
        notify('unlocks.lockedIn', unlockId);

        return true;
    }

    function activate(unlockId) {
        if (!state.unlocks.unlocked.has(unlockId)) return false;

        state.unlocks.active.add(unlockId);
        notify('unlocks.active', state.unlocks.active);

        return true;
    }

    function deactivate(unlockId) {
        state.unlocks.active.delete(unlockId);
        notify('unlocks.active', state.unlocks.active);
    }

    function isUnlocked(unlockId) {
        return state.unlocks.unlocked.has(unlockId);
    }

    function isLocked(unlockId) {
        return state.unlocks.locked.has(unlockId);
    }

    function isActive(unlockId) {
        return state.unlocks.active.has(unlockId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MUSIC OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    function setBpm(bpm) {
        state.music.bpm = Math.max(40, Math.min(200, bpm));
        notify('music.bpm', state.music.bpm);
    }

    function advanceBeat(dt) {
        const beatDuration = 60 / state.music.bpm;
        state.music.beatPhase += dt / beatDuration;

        if (state.music.beatPhase >= 1) {
            state.music.beatPhase -= 1;
            state.music.currentBeat++;

            if (state.music.currentBeat >= state.music.beatsPerBar) {
                state.music.currentBeat = 0;
                state.music.currentBar++;
                notify('music.newBar', state.music.currentBar);
            }

            notify('music.beat', {
                beat: state.music.currentBeat,
                bar: state.music.currentBar,
            });
        }
    }

    function setChord(intervals, root = 0) {
        state.music.currentChord = intervals;
        state.music.chordRoot = root;
        notify('music.chord', { intervals, root });
    }

    function setScale(intervals) {
        state.music.scale = intervals;
        notify('music.scale', intervals);
    }

    function setRootNote(midiNote) {
        state.music.rootNote = midiNote;
        notify('music.rootNote', midiNote);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    function updateAgent(agentId, updates) {
        if (!state.agents[agentId]) return;

        Object.assign(state.agents[agentId], updates);
        state.agents[agentId].decisionTime = Date.now();

        notify(`agents.${agentId}`, state.agents[agentId]);
    }

    function activateAgent(agentId) {
        if (!state.agents[agentId]) return;

        state.agents[agentId].active = true;
        notify(`agents.${agentId}.active`, true);
    }

    function deactivateAgent(agentId) {
        if (!state.agents[agentId]) return;

        state.agents[agentId].active = false;
        notify(`agents.${agentId}.active`, false);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SESSION OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    function startSession() {
        state.session.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        state.session.startTime = Date.now();
        state.session.isActive = true;
        state.session.frameCount = 0;
        state.session.elapsedTime = 0;

        notify('session.started', state.session);
    }

    function updateSession(dt) {
        state.session.frameCount++;
        state.session.deltaTime = dt;
        state.session.elapsedTime += dt;

        // Update music beat
        if (state.music.isPlaying) {
            advanceBeat(dt);
        }

        // Update era transition
        updateEraTransition(dt);
    }

    function pauseSession() {
        state.session.isPaused = true;
        notify('session.paused', true);
    }

    function resumeSession() {
        state.session.isPaused = false;
        notify('session.paused', false);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INPUT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    function updateInput(x, y, dt) {
        const prevX = state.input.x;
        const prevY = state.input.y;

        // Update position
        state.input.x = x;
        state.input.y = y;

        // Calculate velocity
        if (dt > 0) {
            const newVx = (x - prevX) / dt;
            const newVy = (y - prevY) / dt;

            // Smooth velocity
            state.input.vx = state.input.vx * 0.7 + newVx * 0.3;
            state.input.vy = state.input.vy * 0.7 + newVy * 0.3;

            // Calculate acceleration
            state.input.ax = (newVx - state.input.vx) / dt;
            state.input.ay = (newVy - state.input.vy) / dt;
        }

        // Calculate derived values
        state.input.speed = Math.sqrt(
            state.input.vx * state.input.vx +
            state.input.vy * state.input.vy
        );

        state.input.angle = Math.atan2(state.input.vy, state.input.vx);

        // Update energy (movement creates energy, stillness decays it)
        const movement = Math.sqrt(
            (x - prevX) * (x - prevX) +
            (y - prevY) * (y - prevY)
        );
        state.input.energy = Math.min(1, state.input.energy * 0.95 + movement * 10);

        // Update stillness
        if (state.input.speed < 0.01) {
            state.input.stillness += dt;
        } else {
            state.input.stillness = 0;
        }

        // Add to position buffer
        addToPositionBuffer(x, y, state.input.vx, state.input.vy, Date.now());

        notify('input.position', { x, y });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════════════════

    function reset() {
        // Reset to initial state
        state.session.isActive = false;
        state.era.current = ERAS.GENESIS;
        state.era.progress = 0;
        state.unlocks.unlocked.clear();
        state.unlocks.locked.clear();
        state.unlocks.active.clear();
        state.patterns.zoneBuffer = [];
        state.patterns.positionBuffer = [];
        state.patterns.activePatterns.clear();
        state.grid.activeZones.clear();

        Object.values(ZONES).forEach(zone => {
            state.grid.zones[zone] = {
                energy: 0,
                heat: 0,
                dwellTime: 0,
                totalDwell: 0,
                activations: 0,
                lastVisit: 0,
                isActive: false,
                isLocked: false,
            };
        });

        notify('state.reset', null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SERIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function serialize() {
        return JSON.stringify({
            era: state.era,
            unlocks: {
                unlocked: Array.from(state.unlocks.unlocked),
                locked: Array.from(state.unlocks.locked),
            },
            music: state.music,
            patterns: {
                totalPatterns: state.patterns.totalPatterns,
                patternCounts: state.patterns.patternCounts,
            },
        });
    }

    function deserialize(json) {
        try {
            const data = JSON.parse(json);

            if (data.era) {
                state.era.current = data.era.current;
                state.era.progress = data.era.progress;
            }

            if (data.unlocks) {
                state.unlocks.unlocked = new Set(data.unlocks.unlocked);
                state.unlocks.locked = new Set(data.unlocks.locked);
            }

            if (data.music) {
                Object.assign(state.music, data.music);
            }

            notify('state.loaded', data);
        } catch (e) {
            console.error('Failed to deserialize state:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════════════════

    function debug() {
        console.group('GUMP State');
        console.log('Era:', state.era.current, `(${(state.era.progress * 100).toFixed(1)}%)`);
        console.log('Zone:', state.grid.currentZone);
        console.log('Active zones:', Array.from(state.grid.activeZones));
        console.log('Unlocked:', Array.from(state.unlocks.unlocked));
        console.log('Locked:', Array.from(state.unlocks.locked));
        console.log('BPM:', state.music.bpm);
        console.log('Energy:', state.input.energy.toFixed(3));
        console.log('Patterns:', state.patterns.totalPatterns);
        console.groupEnd();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Constants
        ERAS,
        ZONES,
        ZONE_COORDS,
        DWELL_THRESHOLDS,

        // State access
        get,
        set,
        update,
        merge,
        subscribe,

        // Zone operations
        getZone,
        updateZone,
        activateZone,
        deactivateZone,
        setCurrentZone,

        // Pattern operations
        addToZoneBuffer,
        addToPositionBuffer,
        registerPattern,
        clearPattern,

        // Era operations
        setEra,
        updateEraProgress,
        startEraTransition,

        // Unlock operations
        unlock,
        lockIn,
        activate,
        deactivate,
        isUnlocked,
        isLocked,
        isActive,

        // Music operations
        setBpm,
        setChord,
        setScale,
        setRootNote,

        // Agent operations
        getAgent,
        updateAgent,
        activateAgent,
        deactivateAgent,

        // Session operations
        startSession,
        updateSession,
        pauseSession,
        resumeSession,

        // Input operations
        updateInput,

        // Utilities
        reset,
        serialize,
        deserialize,
        debug,

        // Direct state access (read-only reference)
        get state() { return state; },
    });
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpState;
}
