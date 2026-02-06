// ═══════════════════════════════════════════════════════════════════════════
// GUMP GRID SYSTEM v2 - 6x6 Expressive Grid
// ═══════════════════════════════════════════════════════════════════════════
//
// Revolutionary 6x6 grid where position = continuous musical expression.
// X-axis: Pitch register (left=bass, right=treble)
// Y-axis: Texture density (top=sparse, bottom=dense)
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpGrid = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // GRID CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const GRID_CONFIG = Object.freeze({
        rows: 6,
        cols: 6,
        zoneCount: 36,
        cellWidth: 1 / 6,
        cellHeight: 1 / 6
    });

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE BOUNDS - Algorithmically generated
    // ═══════════════════════════════════════════════════════════════════════

    function generateZoneBounds() {
        const bounds = {};
        const { rows, cols, cellWidth, cellHeight } = GRID_CONFIG;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const zoneId = `${col}-${row}`;
                bounds[zoneId] = {
                    x: [col * cellWidth, (col + 1) * cellWidth],
                    y: [row * cellHeight, (row + 1) * cellHeight]
                };
            }
        }

        return Object.freeze(bounds);
    }

    const ZONE_BOUNDS = generateZoneBounds();

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE PROPERTIES - Position-based musical mapping
    // ═══════════════════════════════════════════════════════════════════════

    function generateZoneProperties() {
        const properties = {};
        const { rows, cols } = GRID_CONFIG;

        // Musical characteristics based on position
        const getRoleFromPosition = (col, row) => {
            const x = col / (cols - 1);  // 0-1
            const y = row / (rows - 1);  // 0-1

            // Corners and edges have distinct roles
            if (row === 0 && col === 0) return 'breath';
            if (row === 0 && col === cols - 1) return 'sparkle';
            if (row === rows - 1 && col === 0) return 'sub';
            if (row === rows - 1 && col === cols - 1) return 'pulse';

            // Center area
            if (col >= 2 && col <= 3 && row >= 2 && row <= 3) return 'anchor';

            // Edges
            if (row === 0) return 'brightness';
            if (row === rows - 1) return 'depth';
            if (col === 0) return 'release';
            if (col === cols - 1) return 'attack';

            return 'expressive';
        };

        const getFrequencyFromPosition = (col, row) => {
            const x = col / (cols - 1);
            if (x < 0.2) return 'sub_bass';
            if (x < 0.4) return 'bass';
            if (x < 0.6) return 'mid';
            if (x < 0.8) return 'high_mid';
            return 'high';
        };

        const getColorFromPosition = (col, row) => {
            const x = col / (cols - 1);
            const y = row / (rows - 1);

            // HSL color mapping: x=hue rotation, y=saturation/lightness
            const hue = x * 360;
            const sat = 50 + y * 30;
            const light = 60 - y * 20;

            return `hsl(${hue}, ${sat}%, ${light}%)`;
        };

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const zoneId = `${col}-${row}`;
                const x = col / (cols - 1);  // 0-1 normalized
                const y = row / (rows - 1);  // 0-1 normalized

                properties[zoneId] = {
                    name: zoneId,
                    displayName: `Zone ${col},${row}`,
                    coords: { x: col, y: row },

                    // Continuous position for musical mapping
                    normalizedX: x,
                    normalizedY: y,

                    role: getRoleFromPosition(col, row),
                    frequency: getFrequencyFromPosition(col, row),
                    energy: y > 0.5 ? 'grounded' : 'ascending',
                    color: getColorFromPosition(col, row),

                    description: `Position ${col},${row}`,

                    // Musical meaning derived from position
                    musicalMeaning: {
                        // X-axis: harmonic brightness
                        harmonic: x < 0.3 ? 'dark' : x > 0.7 ? 'bright' : 'neutral',
                        // Y-axis: rhythmic density
                        rhythmic: y < 0.3 ? 'sparse' : y > 0.7 ? 'dense' : 'moderate',
                        // Combined: dynamic character
                        dynamic: (x + y) / 2 > 0.5 ? 'active' : 'passive',
                        // Texture from position
                        textural: x > 0.5 ? 'crisp' : 'warm'
                    },

                    // Unlock affinity based on position
                    unlockAffinity: getAffinityFromPosition(col, row)
                };
            }
        }

        return Object.freeze(properties);
    }

    function getAffinityFromPosition(col, row) {
        const affinities = [];
        const { cols, rows } = GRID_CONFIG;
        const x = col / (cols - 1);
        const y = row / (rows - 1);

        // Position-based affinities
        if (x < 0.3) affinities.push('bass', 'sub', 'warmth');
        if (x > 0.7) affinities.push('treble', 'brightness', 'sparkle');
        if (y < 0.3) affinities.push('sparse', 'breath', 'space');
        if (y > 0.7) affinities.push('dense', 'rhythm', 'pulse');

        // Center
        if (x > 0.3 && x < 0.7 && y > 0.3 && y < 0.7) {
            affinities.push('anchor', 'root', 'foundation');
        }

        // Corners
        if (col === 0 && row === 0) affinities.push('origin', 'breath');
        if (col === cols - 1 && row === 0) affinities.push('sparkle', 'chime');
        if (col === 0 && row === rows - 1) affinities.push('earthquake', '808');
        if (col === cols - 1 && row === rows - 1) affinities.push('groove', 'beat');

        return affinities.length > 0 ? affinities : ['expressive'];
    }

    const ZONE_PROPERTIES = generateZoneProperties();

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE ADJACENCY - Algorithmic
    // ═══════════════════════════════════════════════════════════════════════

    function generateZoneAdjacency() {
        const adjacency = {};
        const { rows, cols } = GRID_CONFIG;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const zoneId = `${col}-${row}`;
                const adjacent = [];

                // All 8 directions
                const directions = [
                    [-1, -1], [0, -1], [1, -1],
                    [-1, 0],          [1, 0],
                    [-1, 1],  [0, 1],  [1, 1]
                ];

                for (const [dx, dy] of directions) {
                    const nx = col + dx;
                    const ny = row + dy;
                    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                        adjacent.push(`${nx}-${ny}`);
                    }
                }

                adjacency[zoneId] = adjacent;
            }
        }

        return Object.freeze(adjacency);
    }

    const ZONE_ADJACENCY = generateZoneAdjacency();

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE TRANSITIONS - Dynamic based on movement
    // ═══════════════════════════════════════════════════════════════════════

    function getTransitionMeaning(fromZone, toZone) {
        if (!fromZone || !toZone) return null;

        const from = ZONE_PROPERTIES[fromZone];
        const to = ZONE_PROPERTIES[toZone];
        if (!from || !to) return null;

        const dx = to.normalizedX - from.normalizedX;
        const dy = to.normalizedY - from.normalizedY;

        let meaning = 'movement';
        let energy = 'neutral';

        // Horizontal movement = harmonic change
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                meaning = 'brighten';
                energy = 'opening';
            } else {
                meaning = 'darken';
                energy = 'closing';
            }
        }
        // Vertical movement = texture change
        else if (Math.abs(dy) > Math.abs(dx)) {
            if (dy > 0) {
                meaning = 'densify';
                energy = 'intensifying';
            } else {
                meaning = 'rarify';
                energy = 'relaxing';
            }
        }
        // Diagonal movement
        else {
            if (dx > 0 && dy > 0) {
                meaning = 'crescendo';
                energy = 'building';
            } else if (dx < 0 && dy < 0) {
                meaning = 'diminuendo';
                energy = 'fading';
            } else if (dx > 0 && dy < 0) {
                meaning = 'ascend_bright';
                energy = 'lifting';
            } else {
                meaning = 'descend_dark';
                energy = 'sinking';
            }
        }

        return { meaning, energy, dx, dy };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GRID STATE
    // ═══════════════════════════════════════════════════════════════════════

    const gridState = {
        // Zone runtime states
        zones: {},

        // Active connections between zones
        connections: new Map(),

        // Current position within zones (0-1 within each zone)
        localX: 0.5,
        localY: 0.5,

        // Global position (0-1 across entire grid)
        globalX: 0.5,
        globalY: 0.5,

        // Zone transition state
        lastTransition: null,
        transitionHistory: [],

        // Heat decay rate
        heatDecayRate: 0.02,

        // Energy accumulation rate
        energyRate: 0.1,

        // Dwell tracking
        currentDwellStart: 0,

        // Connection tracking
        connectionDecayRate: 0.01,

        // Movement tracking for gesture detection
        velocityX: 0,
        velocityY: 0,
        movementPath: [],
        lastPosition: { x: 0.5, y: 0.5 },
        lastPositionTime: 0
    };

    // Initialize zone states
    Object.keys(ZONE_PROPERTIES).forEach(zoneId => {
        gridState.zones[zoneId] = {
            energy: 0,
            heat: 0,
            dwellTime: 0,
            dwellProgress: 0,
            currentThreshold: 0,
            isActive: false,
            isLocked: false,
            lastVisit: 0,
            visitCount: 0,
            glowIntensity: 0,
            pulsePhase: Math.random() * Math.PI * 2
        };
    });

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function getZoneFromPosition(x, y) {
        // Clamp to valid range
        x = Math.max(0, Math.min(0.9999, x));
        y = Math.max(0, Math.min(0.9999, y));

        const col = Math.floor(x * GRID_CONFIG.cols);
        const row = Math.floor(y * GRID_CONFIG.rows);

        return `${col}-${row}`;
    }

    function getZoneCenter(zoneId) {
        const bounds = ZONE_BOUNDS[zoneId];
        if (!bounds) return { x: 0.5, y: 0.5 };

        return {
            x: (bounds.x[0] + bounds.x[1]) / 2,
            y: (bounds.y[0] + bounds.y[1]) / 2
        };
    }

    function getLocalPosition(x, y, zoneId) {
        const bounds = ZONE_BOUNDS[zoneId];
        if (!bounds) return { x: 0.5, y: 0.5 };

        return {
            x: (x - bounds.x[0]) / (bounds.x[1] - bounds.x[0]),
            y: (y - bounds.y[0]) / (bounds.y[1] - bounds.y[0])
        };
    }

    function getDistanceToZoneCenter(x, y, zoneId) {
        const center = getZoneCenter(zoneId);
        const dx = x - center.x;
        const dy = y - center.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getZoneDistance(zone1, zone2) {
        const c1 = ZONE_PROPERTIES[zone1]?.coords;
        const c2 = ZONE_PROPERTIES[zone2]?.coords;
        if (!c1 || !c2) return 999;
        return Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);
    }

    function areZonesAdjacent(zone1, zone2) {
        return ZONE_ADJACENCY[zone1]?.includes(zone2) || false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONTINUOUS EXPRESSION MAPPING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get musical expression values from current position.
     * This is the core of the 6x6 expressive grid.
     */
    function getExpression(x, y, velocity = 0) {
        // Clamp inputs
        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));
        velocity = Math.max(0, Math.min(1, velocity));

        return {
            // Pitch: X-axis maps to octave register
            octave: Math.floor(x * 4) + 1,  // Octaves 1-5
            pitchBend: (x % 0.25) * 4,       // 0-1 within octave

            // Rhythm: Y-axis maps to density
            density: y,                       // 0=sparse, 1=dense
            subdivisionLevel: Math.floor(y * 4),  // 0=whole, 1=half, 2=quarter, 3=16th

            // Swing increases with density
            swing: y > 0.5 ? (y - 0.5) * 0.4 : 0,

            // Dynamics from velocity (movement speed)
            velocity: velocity,
            attack: 0.005 + (1 - velocity) * 0.1,  // Faster = shorter attack

            // Texture from combined position
            filterCutoff: 200 + x * 4000,    // Hz: left=dark, right=bright
            filterResonance: 0.5 + y * 2,    // More resonance when dense

            // Spatial
            reverbMix: (1 - y) * 0.6,        // Sparse = more reverb
            delayMix: x * 0.3,               // Right = more delay

            // In Rainbows character
            detuneAmount: 10 + y * 40,       // More detune when dense
            chorusDepth: x * 0.4,            // More chorus on highs
            warmth: 1 - x,                   // Left = warmer

            // Raw position for custom mapping
            rawX: x,
            rawY: y
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE UPDATES
    // ═══════════════════════════════════════════════════════════════════════

    function update(x, y, dt, state) {
        const now = performance.now();

        // Store global position
        gridState.globalX = x;
        gridState.globalY = y;

        // Calculate velocity
        const timeDelta = (now - gridState.lastPositionTime) / 1000;
        if (timeDelta > 0 && timeDelta < 0.5) {
            const dx = x - gridState.lastPosition.x;
            const dy = y - gridState.lastPosition.y;
            gridState.velocityX = dx / timeDelta;
            gridState.velocityY = dy / timeDelta;
        }

        // Update movement path
        gridState.movementPath.push({ x, y, time: now });
        if (gridState.movementPath.length > 100) {
            gridState.movementPath = gridState.movementPath.slice(-50);
        }

        gridState.lastPosition = { x, y };
        gridState.lastPositionTime = now;

        // Get current zone
        const currentZone = getZoneFromPosition(x, y);
        const previousZone = state.get('grid.currentZone');

        // Update local position
        const localPos = getLocalPosition(x, y, currentZone);
        gridState.localX = localPos.x;
        gridState.localY = localPos.y;

        // Handle zone transition
        if (currentZone !== previousZone) {
            handleZoneTransition(previousZone, currentZone, state);
        }

        // Update current zone dwell
        if (currentZone && gridState.zones[currentZone]) {
            updateZoneDwell(currentZone, dt, state);
        }

        // Update all zone states
        updateAllZones(dt, currentZone, state);

        // Update connections
        updateConnections(dt);

        // Update state
        state.setCurrentZone(currentZone);

        // Calculate velocity magnitude for expression
        const velocityMag = Math.min(1, Math.sqrt(
            gridState.velocityX * gridState.velocityX +
            gridState.velocityY * gridState.velocityY
        ) * 2);

        return {
            zone: currentZone,
            localX: gridState.localX,
            localY: gridState.localY,
            globalX: x,
            globalY: y,
            velocity: velocityMag,
            expression: getExpression(x, y, velocityMag),
            transition: currentZone !== previousZone ? {
                from: previousZone,
                to: currentZone,
                meaning: getTransitionMeaning(previousZone, currentZone)
            } : null
        };
    }

    function handleZoneTransition(fromZone, toZone, state) {
        const now = Date.now();

        // Record dwell on previous zone
        if (fromZone && gridState.zones[fromZone]) {
            const zoneState = gridState.zones[fromZone];
            const dwellDuration = zoneState.dwellTime;

            state.addToZoneBuffer(fromZone, now, dwellDuration);

            // Reset dwell
            zoneState.dwellTime = 0;
            zoneState.dwellProgress = 0;
            zoneState.currentThreshold = 0;
        }

        // Create connection if zones are adjacent
        if (fromZone && areZonesAdjacent(fromZone, toZone)) {
            const connectionKey = [fromZone, toZone].sort().join('_');
            const currentStrength = gridState.connections.get(connectionKey) || 0;
            gridState.connections.set(connectionKey, Math.min(1, currentStrength + 0.2));
        }

        // Record transition
        const transitionInfo = getTransitionMeaning(fromZone, toZone);

        gridState.lastTransition = {
            from: fromZone,
            to: toZone,
            timestamp: now,
            meaning: transitionInfo?.meaning || 'movement',
            energy: transitionInfo?.energy || 'neutral'
        };

        gridState.transitionHistory.push(gridState.lastTransition);
        if (gridState.transitionHistory.length > 100) {
            gridState.transitionHistory = gridState.transitionHistory.slice(-50);
        }

        // Update visit counts
        if (gridState.zones[toZone]) {
            gridState.zones[toZone].visitCount++;
            gridState.zones[toZone].lastVisit = now;
            gridState.zones[toZone].heat = Math.min(1, gridState.zones[toZone].heat + 0.3);
        }

        gridState.currentDwellStart = now;
    }

    function updateZoneDwell(zoneId, dt, state) {
        const zoneState = gridState.zones[zoneId];
        if (!zoneState) return;

        const thresholds = GumpState.DWELL_THRESHOLDS;

        // Accumulate dwell time
        zoneState.dwellTime += dt;
        state.updateZone(zoneId, { dwellTime: zoneState.dwellTime });

        // Accumulate energy
        const energyGain = gridState.energyRate * dt * (1 + zoneState.dwellTime * 0.5);
        zoneState.energy = Math.min(1, zoneState.energy + energyGain);

        // Check thresholds
        const dwellTime = zoneState.dwellTime;

        if (dwellTime >= thresholds.ENLIGHTEN && zoneState.currentThreshold < 5) {
            zoneState.currentThreshold = 5;
            onDwellThreshold(zoneId, 'enlighten', state);
        } else if (dwellTime >= thresholds.TRANSCEND && zoneState.currentThreshold < 4) {
            zoneState.currentThreshold = 4;
            onDwellThreshold(zoneId, 'transcend', state);
        } else if (dwellTime >= thresholds.LOCK && zoneState.currentThreshold < 3) {
            zoneState.currentThreshold = 3;
            onDwellThreshold(zoneId, 'lock', state);
        } else if (dwellTime >= thresholds.ACTIVATE && zoneState.currentThreshold < 2) {
            zoneState.currentThreshold = 2;
            onDwellThreshold(zoneId, 'activate', state);
        } else if (dwellTime >= thresholds.TOUCH && zoneState.currentThreshold < 1) {
            zoneState.currentThreshold = 1;
            onDwellThreshold(zoneId, 'touch', state);
        }

        // Calculate progress toward next threshold
        if (dwellTime < thresholds.TOUCH) {
            zoneState.dwellProgress = dwellTime / thresholds.TOUCH;
        } else if (dwellTime < thresholds.ACTIVATE) {
            zoneState.dwellProgress = (dwellTime - thresholds.TOUCH) /
                                     (thresholds.ACTIVATE - thresholds.TOUCH);
        } else if (dwellTime < thresholds.LOCK) {
            zoneState.dwellProgress = (dwellTime - thresholds.ACTIVATE) /
                                     (thresholds.LOCK - thresholds.ACTIVATE);
        } else if (dwellTime < thresholds.TRANSCEND) {
            zoneState.dwellProgress = (dwellTime - thresholds.LOCK) /
                                     (thresholds.TRANSCEND - thresholds.LOCK);
        } else {
            zoneState.dwellProgress = Math.min(1, (dwellTime - thresholds.TRANSCEND) /
                                     (thresholds.ENLIGHTEN - thresholds.TRANSCEND));
        }
    }

    function onDwellThreshold(zoneId, threshold, state) {
        const zoneState = gridState.zones[zoneId];
        const zoneProps = ZONE_PROPERTIES[zoneId];

        console.log(`[Grid] Zone ${zoneId} reached ${threshold}`);

        switch (threshold) {
            case 'touch':
                zoneState.glowIntensity = 0.3;
                break;
            case 'activate':
                zoneState.isActive = true;
                zoneState.glowIntensity = 0.6;
                state.activateZone(zoneId);
                break;
            case 'lock':
                zoneState.isLocked = true;
                zoneState.glowIntensity = 0.9;
                break;
            case 'transcend':
            case 'enlighten':
                zoneState.glowIntensity = 1.0;
                break;
        }

        if (typeof window !== 'undefined' && window.GumpEvents) {
            window.GumpEvents.emit('zone.threshold', {
                zone: zoneId,
                threshold,
                zoneState
            });
        }
    }

    function updateAllZones(dt, currentZone, state) {
        for (const [zoneId, zoneState] of Object.entries(gridState.zones)) {
            // Heat decay (except current zone)
            if (zoneId !== currentZone) {
                zoneState.heat = Math.max(0, zoneState.heat - gridState.heatDecayRate * dt);
            }

            // Energy decay
            if (!zoneState.isLocked) {
                zoneState.energy = Math.max(0, zoneState.energy - 0.005 * dt);
            }

            // Glow decay
            const targetGlow = zoneState.isActive ? 0.4 : (zoneState.heat * 0.3);
            zoneState.glowIntensity += (targetGlow - zoneState.glowIntensity) * 0.1;

            // Pulse phase
            zoneState.pulsePhase += dt * 2;

            state.set(`visual.zoneGlows.${zoneId}`, zoneState.glowIntensity);
        }
    }

    function updateConnections(dt) {
        for (const [key, strength] of gridState.connections.entries()) {
            const newStrength = strength - gridState.connectionDecayRate * dt;
            if (newStrength <= 0) {
                gridState.connections.delete(key);
            } else {
                gridState.connections.set(key, newStrength);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    function getZoneProperties(zoneId) {
        return ZONE_PROPERTIES[zoneId];
    }

    function getZoneState(zoneId) {
        return gridState.zones[zoneId];
    }

    function getActiveZones() {
        return Object.entries(gridState.zones)
            .filter(([_, state]) => state.isActive)
            .map(([id]) => id);
    }

    function getLockedZones() {
        return Object.entries(gridState.zones)
            .filter(([_, state]) => state.isLocked)
            .map(([id]) => id);
    }

    function getHotZones(threshold = 0.5) {
        return Object.entries(gridState.zones)
            .filter(([_, state]) => state.heat >= threshold)
            .map(([id]) => id);
    }

    function getEnergizedZones(threshold = 0.5) {
        return Object.entries(gridState.zones)
            .filter(([_, state]) => state.energy >= threshold)
            .map(([id]) => id);
    }

    function getZoneConnections(zoneId) {
        const connections = [];
        for (const [key, strength] of gridState.connections.entries()) {
            const [z1, z2] = key.split('_');
            if (z1 === zoneId || z2 === zoneId) {
                connections.push({
                    zone: z1 === zoneId ? z2 : z1,
                    strength
                });
            }
        }
        return connections;
    }

    function getTotalEnergy() {
        return Object.values(gridState.zones)
            .reduce((sum, state) => sum + state.energy, 0) / GRID_CONFIG.zoneCount;
    }

    function getTotalHeat() {
        return Object.values(gridState.zones)
            .reduce((sum, state) => sum + state.heat, 0) / GRID_CONFIG.zoneCount;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MOVEMENT & GESTURE HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    function getRecentZoneSequence(count = 10) {
        return gridState.transitionHistory.slice(-count).map(t => t.to);
    }

    function getMovementDirection() {
        const vx = gridState.velocityX;
        const vy = gridState.velocityY;
        const speed = Math.sqrt(vx * vx + vy * vy);

        if (speed < 0.1) return { direction: 'still', speed: 0 };

        const angle = Math.atan2(vy, vx) * 180 / Math.PI;
        let direction;

        if (angle >= -22.5 && angle < 22.5) direction = 'right';
        else if (angle >= 22.5 && angle < 67.5) direction = 'down-right';
        else if (angle >= 67.5 && angle < 112.5) direction = 'down';
        else if (angle >= 112.5 && angle < 157.5) direction = 'down-left';
        else if (angle >= 157.5 || angle < -157.5) direction = 'left';
        else if (angle >= -157.5 && angle < -112.5) direction = 'up-left';
        else if (angle >= -112.5 && angle < -67.5) direction = 'up';
        else direction = 'up-right';

        return { direction, speed, angle };
    }

    function getRecentPath(durationMs = 500) {
        const now = performance.now();
        const cutoff = now - durationMs;
        return gridState.movementPath.filter(p => p.time >= cutoff);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    function getMusicalContext(zoneId) {
        const props = ZONE_PROPERTIES[zoneId];
        const state = gridState.zones[zoneId];

        if (!props || !state) return null;

        return {
            zone: zoneId,
            role: props.role,
            harmonic: props.musicalMeaning.harmonic,
            rhythmic: props.musicalMeaning.rhythmic,
            dynamic: props.musicalMeaning.dynamic,
            textural: props.musicalMeaning.textural,
            energy: state.energy,
            heat: state.heat,
            isActive: state.isActive,
            isLocked: state.isLocked,
            normalizedX: props.normalizedX,
            normalizedY: props.normalizedY
        };
    }

    function getGlobalMusicalState() {
        const activeZones = getActiveZones();
        const lockedZones = getLockedZones();

        // Calculate from global position
        const x = gridState.globalX;
        const y = gridState.globalY;

        return {
            activeZones,
            lockedZones,
            harmonicBalance: (x - 0.5) * 2,   // -1 to 1 (dark to bright)
            rhythmicBalance: (y - 0.5) * 2,    // -1 to 1 (sparse to dense)
            energyLevel: getTotalEnergy(),
            totalHeat: getTotalHeat(),
            totalEnergy: getTotalEnergy(),
            globalExpression: getExpression(x, y, Math.sqrt(
                gridState.velocityX ** 2 + gridState.velocityY ** 2
            ))
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEGACY COMPATIBILITY
    // ═══════════════════════════════════════════════════════════════════════

    // Map old zone names to new format for compatibility
    const LEGACY_ZONE_MAP = {
        'nw': '0-0', 'n': '2-0', 'ne': '5-0',
        'w': '0-2', 'center': '2-2', 'e': '5-2',
        'sw': '0-5', 's': '2-5', 'se': '5-5'
    };

    function legacyZoneToNew(legacyZone) {
        return LEGACY_ZONE_MAP[legacyZone] || legacyZone;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════════════════

    function reset() {
        Object.keys(ZONE_PROPERTIES).forEach(zoneId => {
            gridState.zones[zoneId] = {
                energy: 0,
                heat: 0,
                dwellTime: 0,
                dwellProgress: 0,
                currentThreshold: 0,
                isActive: false,
                isLocked: false,
                lastVisit: 0,
                visitCount: 0,
                glowIntensity: 0,
                pulsePhase: Math.random() * Math.PI * 2
            };
        });

        gridState.connections.clear();
        gridState.transitionHistory = [];
        gridState.lastTransition = null;
        gridState.movementPath = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Configuration
        GRID_CONFIG,
        ZONE_BOUNDS,
        ZONE_PROPERTIES,
        ZONE_ADJACENCY,

        // Core functions
        update,
        reset,
        getExpression,

        // Zone detection
        getZoneFromPosition,
        getZoneCenter,
        getLocalPosition,
        getDistanceToZoneCenter,
        getZoneDistance,
        areZonesAdjacent,

        // Zone queries
        getZoneProperties,
        getZoneState,
        getActiveZones,
        getLockedZones,
        getHotZones,
        getEnergizedZones,
        getZoneConnections,
        getTotalEnergy,
        getTotalHeat,

        // Movement helpers
        getRecentZoneSequence,
        getMovementDirection,
        getRecentPath,
        getTransitionMeaning,

        // Musical queries
        getMusicalContext,
        getGlobalMusicalState,

        // Legacy compatibility
        legacyZoneToNew,
        LEGACY_ZONE_MAP,

        // State access
        get state() { return gridState; }
    });
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpGrid;
}
