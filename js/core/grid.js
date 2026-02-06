// ═══════════════════════════════════════════════════════════════════════════
// GUMP GRID SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
//
// The 9-zone grid that tracks user movement and creates musical meaning.
// Each zone has specific properties and musical associations.
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpGrid = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════

    // Zone boundaries (normalized 0-1)
    const ZONE_BOUNDS = {
        nw: { x: [0, 0.333], y: [0, 0.333] },
        n:  { x: [0.333, 0.666], y: [0, 0.333] },
        ne: { x: [0.666, 1], y: [0, 0.333] },
        w:  { x: [0, 0.333], y: [0.333, 0.666] },
        center: { x: [0.333, 0.666], y: [0.333, 0.666] },
        e:  { x: [0.666, 1], y: [0.333, 0.666] },
        sw: { x: [0, 0.333], y: [0.666, 1] },
        s:  { x: [0.333, 0.666], y: [0.666, 1] },
        se: { x: [0.666, 1], y: [0.666, 1] },
    };

    // Zone musical properties
    const ZONE_PROPERTIES = {
        center: {
            name: 'center',
            displayName: 'The Center',
            coords: { x: 1, y: 1 },
            role: 'anchor',
            frequency: 'root',
            energy: 'grounding',
            color: '#ffffff',
            description: 'The root, the anchor, the source',
            musicalMeaning: {
                harmonic: 'tonic',
                rhythmic: 'downbeat',
                dynamic: 'sustain',
                textural: 'foundation',
            },
            unlockAffinity: ['fundamental', 'root', 'anchor'],
        },
        n: {
            name: 'n',
            displayName: 'The Heights',
            coords: { x: 1, y: 0 },
            role: 'brightness',
            frequency: 'high',
            energy: 'ascending',
            color: '#87ceeb',
            description: 'High frequencies, overtones, light',
            musicalMeaning: {
                harmonic: 'brightness',
                rhythmic: 'offbeat_high',
                dynamic: 'crescendo',
                textural: 'shimmer',
            },
            unlockAffinity: ['overtones', 'shimmer', 'light'],
        },
        s: {
            name: 's',
            displayName: 'The Depths',
            coords: { x: 1, y: 2 },
            role: 'depth',
            frequency: 'low',
            energy: 'descending',
            color: '#4a0080',
            description: 'Sub bass, foundation, gravity',
            musicalMeaning: {
                harmonic: 'depth',
                rhythmic: 'downbeat_heavy',
                dynamic: 'weight',
                textural: 'rumble',
            },
            unlockAffinity: ['sub', 'bass', 'foundation', '808'],
        },
        e: {
            name: 'e',
            displayName: 'The Attack',
            coords: { x: 2, y: 1 },
            role: 'attack',
            frequency: 'transient',
            energy: 'forward',
            color: '#ff6b35',
            description: 'Attack, transients, energy burst',
            musicalMeaning: {
                harmonic: 'brightness_burst',
                rhythmic: 'accent',
                dynamic: 'attack',
                textural: 'percussive',
            },
            unlockAffinity: ['attack', 'transient', 'energy', 'hit'],
        },
        w: {
            name: 'w',
            displayName: 'The Decay',
            coords: { x: 0, y: 1 },
            role: 'release',
            frequency: 'filtered',
            energy: 'retreating',
            color: '#2e4057',
            description: 'Decay, sustain, space, reverb',
            musicalMeaning: {
                harmonic: 'darkness',
                rhythmic: 'sustained',
                dynamic: 'release',
                textural: 'ambient',
            },
            unlockAffinity: ['decay', 'space', 'reverb', 'pad'],
        },
        ne: {
            name: 'ne',
            displayName: 'The Sparkle',
            coords: { x: 2, y: 0 },
            role: 'arpeggio',
            frequency: 'high_rhythmic',
            energy: 'dancing',
            color: '#ffd700',
            description: 'Arpeggios, harmonics, glitter',
            musicalMeaning: {
                harmonic: 'upper_harmonics',
                rhythmic: 'arpeggio',
                dynamic: 'flutter',
                textural: 'crystalline',
            },
            unlockAffinity: ['arp', 'sparkle', 'chime', 'bell'],
        },
        nw: {
            name: 'nw',
            displayName: 'The Breath',
            coords: { x: 0, y: 0 },
            role: 'modulation',
            frequency: 'lfo_high',
            energy: 'breathing',
            color: '#90ee90',
            description: 'LFO, breath, slow movement',
            musicalMeaning: {
                harmonic: 'modulated',
                rhythmic: 'polyrhythm',
                dynamic: 'swell',
                textural: 'organic',
            },
            unlockAffinity: ['breath', 'lfo', 'swell', 'pulse'],
        },
        se: {
            name: 'se',
            displayName: 'The Pulse',
            coords: { x: 2, y: 2 },
            role: 'rhythm',
            frequency: 'rhythmic',
            energy: 'driving',
            color: '#ff4444',
            description: 'Drums, rhythm, pulse',
            musicalMeaning: {
                harmonic: 'percussive',
                rhythmic: 'groove',
                dynamic: 'driving',
                textural: 'rhythmic',
            },
            unlockAffinity: ['drums', 'rhythm', 'beat', 'groove'],
        },
        sw: {
            name: 'sw',
            displayName: 'The Foundation',
            coords: { x: 0, y: 2 },
            role: 'sub',
            frequency: 'sub_bass',
            energy: 'heavy',
            color: '#330066',
            description: 'Sub bass, 808, floor-shaking lows',
            musicalMeaning: {
                harmonic: 'sub_harmonic',
                rhythmic: 'slow_pulse',
                dynamic: 'massive',
                textural: 'deep',
            },
            unlockAffinity: ['808', 'sub', 'bass_drop', 'earthquake'],
        },
    };

    // Zone adjacency map
    const ZONE_ADJACENCY = {
        nw: ['n', 'w', 'center'],
        n: ['nw', 'ne', 'center', 'w', 'e'],
        ne: ['n', 'e', 'center'],
        w: ['nw', 'sw', 'center', 'n', 's'],
        center: ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'],
        e: ['ne', 'se', 'center', 'n', 's'],
        sw: ['w', 's', 'center'],
        s: ['sw', 'se', 'center', 'w', 'e'],
        se: ['s', 'e', 'center'],
    };

    // Zone transition musical meanings
    const ZONE_TRANSITIONS = {
        // Horizontal
        'w_to_e': { meaning: 'filter_open', energy: 'expanding' },
        'e_to_w': { meaning: 'filter_close', energy: 'contracting' },
        'nw_to_ne': { meaning: 'shimmer_sweep', energy: 'gliding_high' },
        'sw_to_se': { meaning: 'bass_sweep', energy: 'rumbling' },

        // Vertical
        'n_to_s': { meaning: 'frequency_descend', energy: 'falling' },
        's_to_n': { meaning: 'frequency_ascend', energy: 'rising' },
        'nw_to_sw': { meaning: 'filter_descend', energy: 'darkening' },
        'ne_to_se': { meaning: 'energy_descend', energy: 'grounding' },

        // Diagonal
        'nw_to_se': { meaning: 'full_sweep', energy: 'complete' },
        'ne_to_sw': { meaning: 'cross_fade', energy: 'inverting' },
        'sw_to_ne': { meaning: 'bass_to_treble', energy: 'liberating' },
        'se_to_nw': { meaning: 'rhythm_to_breath', energy: 'relaxing' },

        // Center transitions
        'center_to_n': { meaning: 'root_to_bloom', energy: 'opening' },
        'center_to_s': { meaning: 'root_to_depth', energy: 'sinking' },
        'center_to_e': { meaning: 'root_to_attack', energy: 'striking' },
        'center_to_w': { meaning: 'root_to_space', energy: 'expanding' },
        'n_to_center': { meaning: 'bloom_to_root', energy: 'grounding' },
        's_to_center': { meaning: 'depth_to_root', energy: 'rising' },
        'e_to_center': { meaning: 'attack_to_root', energy: 'resolving' },
        'w_to_center': { meaning: 'space_to_root', energy: 'focusing' },
    };

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
    };

    // Initialize zone states
    Object.keys(ZONE_PROPERTIES).forEach(zoneId => {
        gridState.zones[zoneId] = {
            energy: 0,
            heat: 0,
            dwellTime: 0,
            dwellProgress: 0,      // 0-1 progress toward next threshold
            currentThreshold: 0,   // Which threshold we're working toward
            isActive: false,
            isLocked: false,
            lastVisit: 0,
            visitCount: 0,
            glowIntensity: 0,
            pulsePhase: Math.random() * Math.PI * 2,
        };
    });

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function getZoneFromPosition(x, y) {
        // Clamp to valid range
        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));

        for (const [zoneId, bounds] of Object.entries(ZONE_BOUNDS)) {
            if (x >= bounds.x[0] && x < bounds.x[1] &&
                y >= bounds.y[0] && y < bounds.y[1]) {
                return zoneId;
            }
        }

        // Edge case: exactly at 1.0
        if (x >= 0.666) {
            if (y >= 0.666) return 'se';
            if (y >= 0.333) return 'e';
            return 'ne';
        }

        return 'center'; // Fallback
    }

    function getZoneCenter(zoneId) {
        const bounds = ZONE_BOUNDS[zoneId];
        return {
            x: (bounds.x[0] + bounds.x[1]) / 2,
            y: (bounds.y[0] + bounds.y[1]) / 2,
        };
    }

    function getLocalPosition(x, y, zoneId) {
        const bounds = ZONE_BOUNDS[zoneId];
        return {
            x: (x - bounds.x[0]) / (bounds.x[1] - bounds.x[0]),
            y: (y - bounds.y[0]) / (bounds.y[1] - bounds.y[0]),
        };
    }

    function getDistanceToZoneCenter(x, y, zoneId) {
        const center = getZoneCenter(zoneId);
        const dx = x - center.x;
        const dy = y - center.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getZoneDistance(zone1, zone2) {
        const c1 = ZONE_PROPERTIES[zone1].coords;
        const c2 = ZONE_PROPERTIES[zone2].coords;
        return Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y);
    }

    function areZonesAdjacent(zone1, zone2) {
        return ZONE_ADJACENCY[zone1].includes(zone2);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ZONE UPDATES
    // ═══════════════════════════════════════════════════════════════════════

    function update(x, y, dt, state) {
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
        updateZoneDwell(currentZone, dt, state);

        // Update all zone states (heat decay, etc.)
        updateAllZones(dt, currentZone, state);

        // Update connections
        updateConnections(dt);

        // Update state
        state.setCurrentZone(currentZone);

        return {
            zone: currentZone,
            localX: gridState.localX,
            localY: gridState.localY,
            transition: currentZone !== previousZone ? {
                from: previousZone,
                to: currentZone,
            } : null,
        };
    }

    function handleZoneTransition(fromZone, toZone, state) {
        const now = Date.now();

        // Record dwell on previous zone
        if (fromZone && gridState.zones[fromZone]) {
            const zoneState = gridState.zones[fromZone];
            const dwellDuration = zoneState.dwellTime;

            // Add to zone buffer
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
        const transitionKey = `${fromZone}_to_${toZone}`;
        const transitionInfo = ZONE_TRANSITIONS[transitionKey];

        gridState.lastTransition = {
            from: fromZone,
            to: toZone,
            timestamp: now,
            meaning: transitionInfo?.meaning || 'movement',
            energy: transitionInfo?.energy || 'neutral',
        };

        gridState.transitionHistory.push(gridState.lastTransition);
        if (gridState.transitionHistory.length > 100) {
            gridState.transitionHistory = gridState.transitionHistory.slice(-50);
        }

        // Update visit counts
        gridState.zones[toZone].visitCount++;
        gridState.zones[toZone].lastVisit = now;

        // Add heat to new zone
        gridState.zones[toZone].heat = Math.min(1, gridState.zones[toZone].heat + 0.3);

        // Start dwell tracking
        gridState.currentDwellStart = now;
    }

    function updateZoneDwell(zoneId, dt, state) {
        const zoneState = gridState.zones[zoneId];
        const thresholds = GumpState.DWELL_THRESHOLDS;

        // Accumulate dwell time
        zoneState.dwellTime += dt;
        state.updateZone(zoneId, { dwellTime: zoneState.dwellTime });

        // Accumulate energy (faster when dwelling longer)
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
        let nextThreshold;
        if (dwellTime < thresholds.TOUCH) {
            zoneState.dwellProgress = dwellTime / thresholds.TOUCH;
            nextThreshold = 'touch';
        } else if (dwellTime < thresholds.ACTIVATE) {
            zoneState.dwellProgress = (dwellTime - thresholds.TOUCH) /
                                     (thresholds.ACTIVATE - thresholds.TOUCH);
            nextThreshold = 'activate';
        } else if (dwellTime < thresholds.LOCK) {
            zoneState.dwellProgress = (dwellTime - thresholds.ACTIVATE) /
                                     (thresholds.LOCK - thresholds.ACTIVATE);
            nextThreshold = 'lock';
        } else if (dwellTime < thresholds.TRANSCEND) {
            zoneState.dwellProgress = (dwellTime - thresholds.LOCK) /
                                     (thresholds.TRANSCEND - thresholds.LOCK);
            nextThreshold = 'transcend';
        } else {
            zoneState.dwellProgress = Math.min(1, (dwellTime - thresholds.TRANSCEND) /
                                     (thresholds.ENLIGHTEN - thresholds.TRANSCEND));
            nextThreshold = 'enlighten';
        }
    }

    function onDwellThreshold(zoneId, threshold, state) {
        const zoneState = gridState.zones[zoneId];
        const zoneProps = ZONE_PROPERTIES[zoneId];

        console.log(`Zone ${zoneId} reached ${threshold} threshold`);

        switch (threshold) {
            case 'touch':
                // Brief activation - temporary effect
                zoneState.glowIntensity = 0.3;
                break;

            case 'activate':
                // Full activation
                zoneState.isActive = true;
                zoneState.glowIntensity = 0.6;
                state.activateZone(zoneId);

                // Try to unlock zone-associated content
                zoneProps.unlockAffinity.forEach(unlockId => {
                    // This will be handled by the unlock system
                });
                break;

            case 'lock':
                // Permanent lock
                zoneState.isLocked = true;
                zoneState.glowIntensity = 0.9;
                break;

            case 'transcend':
                // Deep connection - special effects
                zoneState.glowIntensity = 1.0;
                break;

            case 'enlighten':
                // Ultimate - era-specific special event
                zoneState.glowIntensity = 1.0;
                break;
        }

        // Emit event for other systems
        if (typeof window !== 'undefined' && window.GumpEvents) {
            window.GumpEvents.emit('zone.threshold', {
                zone: zoneId,
                threshold,
                zoneState,
            });
        }
    }

    function updateAllZones(dt, currentZone, state) {
        for (const [zoneId, zoneState] of Object.entries(gridState.zones)) {
            // Heat decay (except current zone)
            if (zoneId !== currentZone) {
                zoneState.heat = Math.max(0, zoneState.heat - gridState.heatDecayRate * dt);
            }

            // Energy decay (slower than heat)
            if (!zoneState.isLocked) {
                zoneState.energy = Math.max(0, zoneState.energy - 0.005 * dt);
            }

            // Glow decay
            const targetGlow = zoneState.isActive ? 0.4 : (zoneState.heat * 0.3);
            zoneState.glowIntensity += (targetGlow - zoneState.glowIntensity) * 0.1;

            // Pulse phase
            zoneState.pulsePhase += dt * 2;

            // Update visual state in main state
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
                    strength,
                });
            }
        }
        return connections;
    }

    function getTotalEnergy() {
        return Object.values(gridState.zones)
            .reduce((sum, state) => sum + state.energy, 0) / 9;
    }

    function getTotalHeat() {
        return Object.values(gridState.zones)
            .reduce((sum, state) => sum + state.heat, 0) / 9;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    function getRecentZoneSequence(count = 10) {
        return gridState.transitionHistory.slice(-count).map(t => t.to);
    }

    function getZonePath(zones) {
        // Calculate the "shape" formed by a sequence of zones
        if (zones.length < 2) return null;

        const coords = zones.map(z => ZONE_PROPERTIES[z].coords);

        // Check for various shapes
        if (isLine(coords)) return { shape: 'line', direction: getLineDirection(coords) };
        if (isTriangle(coords)) return { shape: 'triangle', clockwise: isClockwise(coords) };
        if (isSquare(coords)) return { shape: 'square', clockwise: isClockwise(coords) };
        if (isCross(zones)) return { shape: 'cross', type: getCrossType(zones) };
        if (isCircle(zones)) return { shape: 'circle', clockwise: isClockwise(coords) };

        return { shape: 'freeform', zones };
    }

    function isLine(coords) {
        if (coords.length < 3) return true;

        // Check if all points are collinear
        const dx = coords[1].x - coords[0].x;
        const dy = coords[1].y - coords[0].y;

        for (let i = 2; i < coords.length; i++) {
            const ddx = coords[i].x - coords[0].x;
            const ddy = coords[i].y - coords[0].y;

            // Cross product should be zero for collinear points
            if (Math.abs(dx * ddy - dy * ddx) > 0.01) return false;
        }

        return true;
    }

    function getLineDirection(coords) {
        const start = coords[0];
        const end = coords[coords.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'east' : 'west';
        } else {
            return dy > 0 ? 'south' : 'north';
        }
    }

    function isTriangle(coords) {
        // Need exactly 3 or 4 points (returning to start)
        const uniqueCoords = getUniqueCoords(coords);
        return uniqueCoords.length === 3;
    }

    function isSquare(coords) {
        const uniqueCoords = getUniqueCoords(coords);
        return uniqueCoords.length === 4 &&
               isRectangular(uniqueCoords);
    }

    function isCross(zones) {
        // Check if zones form a + or X pattern
        const hasCenter = zones.includes('center');
        if (!hasCenter) return false;

        const hasNS = zones.includes('n') && zones.includes('s');
        const hasEW = zones.includes('e') && zones.includes('w');
        const hasDiag1 = zones.includes('nw') && zones.includes('se');
        const hasDiag2 = zones.includes('ne') && zones.includes('sw');

        return (hasNS && hasEW) || (hasDiag1 && hasDiag2);
    }

    function getCrossType(zones) {
        const hasNS = zones.includes('n') && zones.includes('s');
        const hasEW = zones.includes('e') && zones.includes('w');
        if (hasNS && hasEW) return 'plus';

        return 'x';
    }

    function isCircle(zones) {
        // Check if the path forms a rough circle through corners
        const corners = ['nw', 'ne', 'se', 'sw'];
        const cornerCount = zones.filter(z => corners.includes(z)).length;
        return cornerCount >= 3 && zones[0] === zones[zones.length - 1];
    }

    function isClockwise(coords) {
        // Calculate signed area
        let sum = 0;
        for (let i = 0; i < coords.length - 1; i++) {
            sum += (coords[i + 1].x - coords[i].x) * (coords[i + 1].y + coords[i].y);
        }
        return sum > 0;
    }

    function isRectangular(coords) {
        if (coords.length !== 4) return false;

        // Check if we have 2 distinct x values and 2 distinct y values
        const xs = [...new Set(coords.map(c => c.x))];
        const ys = [...new Set(coords.map(c => c.y))];

        return xs.length === 2 && ys.length === 2;
    }

    function getUniqueCoords(coords) {
        const seen = new Set();
        return coords.filter(c => {
            const key = `${c.x},${c.y}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    function getMusicalContext(zoneId) {
        const props = ZONE_PROPERTIES[zoneId];
        const state = gridState.zones[zoneId];

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
        };
    }

    function getGlobalMusicalState() {
        const activeZones = getActiveZones();
        const lockedZones = getLockedZones();

        // Calculate dominant characteristics
        let harmonicBalance = 0;  // -1 = dark, 1 = bright
        let rhythmicBalance = 0;  // -1 = sustained, 1 = percussive
        let energyLevel = 0;

        for (const zoneId of activeZones) {
            const props = ZONE_PROPERTIES[zoneId];
            const state = gridState.zones[zoneId];

            // Harmonic balance
            if (['n', 'ne', 'e'].includes(zoneId)) {
                harmonicBalance += state.energy * 0.5;
            } else if (['s', 'sw', 'w'].includes(zoneId)) {
                harmonicBalance -= state.energy * 0.5;
            }

            // Rhythmic balance
            if (['e', 'se', 's'].includes(zoneId)) {
                rhythmicBalance += state.energy * 0.5;
            } else if (['w', 'nw', 'n'].includes(zoneId)) {
                rhythmicBalance -= state.energy * 0.5;
            }

            energyLevel += state.energy;
        }

        return {
            activeZones,
            lockedZones,
            harmonicBalance: Math.max(-1, Math.min(1, harmonicBalance)),
            rhythmicBalance: Math.max(-1, Math.min(1, rhythmicBalance)),
            energyLevel: energyLevel / 9,
            totalHeat: getTotalHeat(),
            totalEnergy: getTotalEnergy(),
        };
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
                pulsePhase: Math.random() * Math.PI * 2,
            };
        });

        gridState.connections.clear();
        gridState.transitionHistory = [];
        gridState.lastTransition = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Constants
        ZONE_BOUNDS,
        ZONE_PROPERTIES,
        ZONE_ADJACENCY,
        ZONE_TRANSITIONS,

        // Core functions
        update,
        reset,

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

        // Pattern helpers
        getRecentZoneSequence,
        getZonePath,

        // Musical queries
        getMusicalContext,
        getGlobalMusicalState,

        // State access
        get state() { return gridState; },
    });
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpGrid;
}
