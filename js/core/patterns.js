// ═══════════════════════════════════════════════════════════════════════════
// GUMP PATTERN RECOGNITION ENGINE
// ═══════════════════════════════════════════════════════════════════════════
//
// Detects meaningful patterns in user movement through the grid.
// Patterns trigger musical events and unlock content.
//
// Pattern Types:
// - Dwell patterns (staying in zones)
// - Path patterns (moving between zones)
// - Shape patterns (complex paths)
// - Rhythm patterns (timing of movements)
// - Combo patterns (multiple simultaneous)
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpPatterns = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN DEFINITIONS
    // ═══════════════════════════════════════════════════════════════════════

    const PATTERN_TYPES = {
        // ─────────────────────────────────────────────────────────────────
        // DWELL PATTERNS - Staying in zones
        // ─────────────────────────────────────────────────────────────────
        DWELL_TOUCH: {
            id: 'dwell_touch',
            category: 'dwell',
            description: 'Brief touch in zone',
            duration: 0.5,
            musical: { effect: 'note_trigger', intensity: 0.3 },
        },
        DWELL_ACTIVATE: {
            id: 'dwell_activate',
            category: 'dwell',
            description: 'Zone activation',
            duration: 1.5,
            musical: { effect: 'layer_add', intensity: 0.6 },
        },
        DWELL_LOCK: {
            id: 'dwell_lock',
            category: 'dwell',
            description: 'Zone lock-in',
            duration: 3.0,
            musical: { effect: 'layer_lock', intensity: 0.9 },
        },
        DWELL_TRANSCEND: {
            id: 'dwell_transcend',
            category: 'dwell',
            description: 'Deep dwell',
            duration: 5.0,
            musical: { effect: 'transcend', intensity: 1.0 },
        },
        DWELL_ENLIGHTEN: {
            id: 'dwell_enlighten',
            category: 'dwell',
            description: 'Ultimate dwell',
            duration: 10.0,
            musical: { effect: 'enlighten', intensity: 1.0 },
        },

        // ─────────────────────────────────────────────────────────────────
        // PATH PATTERNS - Simple movements between zones
        // ─────────────────────────────────────────────────────────────────
        PATH_HORIZONTAL: {
            id: 'path_horizontal',
            category: 'path',
            description: 'Horizontal sweep',
            zones: [['w', 'center', 'e'], ['e', 'center', 'w']],
            musical: { effect: 'filter_sweep', direction: 'horizontal' },
        },
        PATH_VERTICAL: {
            id: 'path_vertical',
            category: 'path',
            description: 'Vertical sweep',
            zones: [['n', 'center', 's'], ['s', 'center', 'n']],
            musical: { effect: 'frequency_sweep', direction: 'vertical' },
        },
        PATH_DIAGONAL_DOWN: {
            id: 'path_diagonal_down',
            category: 'path',
            description: 'Diagonal sweep NW to SE',
            zones: [['nw', 'center', 'se'], ['se', 'center', 'nw']],
            musical: { effect: 'full_sweep', direction: 'diagonal_down' },
        },
        PATH_DIAGONAL_UP: {
            id: 'path_diagonal_up',
            category: 'path',
            description: 'Diagonal sweep SW to NE',
            zones: [['sw', 'center', 'ne'], ['ne', 'center', 'sw']],
            musical: { effect: 'cross_sweep', direction: 'diagonal_up' },
        },
        PATH_UP: {
            id: 'path_up',
            category: 'path',
            description: 'Upward movement',
            zones: [['s', 'center', 'n'], ['sw', 'w', 'nw'], ['se', 'e', 'ne']],
            musical: { effect: 'ascend', direction: 'up' },
        },
        PATH_DOWN: {
            id: 'path_down',
            category: 'path',
            description: 'Downward movement',
            zones: [['n', 'center', 's'], ['nw', 'w', 'sw'], ['ne', 'e', 'se']],
            musical: { effect: 'descend', direction: 'down' },
        },
        PATH_LEFT: {
            id: 'path_left',
            category: 'path',
            description: 'Leftward movement',
            zones: [['e', 'center', 'w'], ['ne', 'n', 'nw'], ['se', 's', 'sw']],
            musical: { effect: 'filter_close', direction: 'left' },
        },
        PATH_RIGHT: {
            id: 'path_right',
            category: 'path',
            description: 'Rightward movement',
            zones: [['w', 'center', 'e'], ['nw', 'n', 'ne'], ['sw', 's', 'se']],
            musical: { effect: 'filter_open', direction: 'right' },
        },

        // ─────────────────────────────────────────────────────────────────
        // SHAPE PATTERNS - Complex paths
        // ─────────────────────────────────────────────────────────────────
        SHAPE_CROSS_PLUS: {
            id: 'shape_cross_plus',
            category: 'shape',
            description: 'Plus sign through center',
            zones: [
                ['n', 'center', 's', 'center', 'e', 'center', 'w'],
                ['w', 'center', 'e', 'center', 'n', 'center', 's'],
            ],
            musical: { effect: 'chord_change', type: 'major' },
        },
        SHAPE_CROSS_X: {
            id: 'shape_cross_x',
            category: 'shape',
            description: 'X through center',
            zones: [
                ['nw', 'center', 'se', 'center', 'ne', 'center', 'sw'],
                ['sw', 'center', 'ne', 'center', 'se', 'center', 'nw'],
            ],
            musical: { effect: 'key_change', type: 'relative' },
        },
        SHAPE_TRIANGLE_TOP: {
            id: 'shape_triangle_top',
            category: 'shape',
            description: 'Triangle pointing up',
            zones: [['sw', 'n', 'se', 'sw'], ['se', 'n', 'sw', 'se']],
            musical: { effect: 'triad', voicing: 'root' },
        },
        SHAPE_TRIANGLE_DOWN: {
            id: 'shape_triangle_down',
            category: 'shape',
            description: 'Triangle pointing down',
            zones: [['nw', 's', 'ne', 'nw'], ['ne', 's', 'nw', 'ne']],
            musical: { effect: 'triad', voicing: 'first_inversion' },
        },
        SHAPE_SQUARE: {
            id: 'shape_square',
            category: 'shape',
            description: 'Square through corners',
            zones: [
                ['nw', 'ne', 'se', 'sw', 'nw'],
                ['ne', 'se', 'sw', 'nw', 'ne'],
                ['se', 'sw', 'nw', 'ne', 'se'],
                ['sw', 'nw', 'ne', 'se', 'sw'],
            ],
            musical: { effect: 'four_bar_phrase', type: 'complete' },
        },
        SHAPE_CIRCLE_CW: {
            id: 'shape_circle_cw',
            category: 'shape',
            description: 'Clockwise circle',
            zones: [
                ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw', 'n'],
                ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
            ],
            musical: { effect: 'build', direction: 'up' },
        },
        SHAPE_CIRCLE_CCW: {
            id: 'shape_circle_ccw',
            category: 'shape',
            description: 'Counter-clockwise circle',
            zones: [
                ['n', 'nw', 'w', 'sw', 's', 'se', 'e', 'ne', 'n'],
                ['ne', 'n', 'nw', 'w', 'sw', 's', 'se', 'e', 'ne'],
            ],
            musical: { effect: 'drop', direction: 'down' },
        },
        SHAPE_FIGURE_8: {
            id: 'shape_figure_8',
            category: 'shape',
            description: 'Figure 8 / infinity',
            zones: [
                ['center', 'n', 'ne', 'e', 'center', 's', 'sw', 'w', 'center'],
                ['center', 'w', 'sw', 's', 'center', 'e', 'ne', 'n', 'center'],
            ],
            musical: { effect: 'infinity_loop', type: 'polyrhythm' },
        },
        SHAPE_SPIRAL_IN: {
            id: 'shape_spiral_in',
            category: 'shape',
            description: 'Spiral toward center',
            zones: [
                ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'center'],
            ],
            musical: { effect: 'focus', direction: 'in' },
        },
        SHAPE_SPIRAL_OUT: {
            id: 'shape_spiral_out',
            category: 'shape',
            description: 'Spiral outward from center',
            zones: [
                ['center', 'w', 'sw', 's', 'se', 'e', 'ne', 'n', 'nw'],
            ],
            musical: { effect: 'expand', direction: 'out' },
        },

        // ─────────────────────────────────────────────────────────────────
        // RHYTHM PATTERNS - Timing-based
        // ─────────────────────────────────────────────────────────────────
        RHYTHM_PULSE_SLOW: {
            id: 'rhythm_pulse_slow',
            category: 'rhythm',
            description: 'Slow regular pulse',
            bpmRange: [40, 70],
            musical: { effect: 'tempo_slow', bpm: 60 },
        },
        RHYTHM_PULSE_MEDIUM: {
            id: 'rhythm_pulse_medium',
            category: 'rhythm',
            description: 'Medium pulse',
            bpmRange: [70, 110],
            musical: { effect: 'tempo_medium', bpm: 90 },
        },
        RHYTHM_PULSE_FAST: {
            id: 'rhythm_pulse_fast',
            category: 'rhythm',
            description: 'Fast pulse',
            bpmRange: [110, 150],
            musical: { effect: 'tempo_fast', bpm: 130 },
        },
        RHYTHM_ACCELERANDO: {
            id: 'rhythm_accelerando',
            category: 'rhythm',
            description: 'Speeding up',
            musical: { effect: 'accelerando' },
        },
        RHYTHM_RITARDANDO: {
            id: 'rhythm_ritardando',
            category: 'rhythm',
            description: 'Slowing down',
            musical: { effect: 'ritardando' },
        },
        RHYTHM_SYNCOPATION: {
            id: 'rhythm_syncopation',
            category: 'rhythm',
            description: 'Off-beat emphasis',
            musical: { effect: 'syncopation', swing: 0.3 },
        },
        RHYTHM_TRIPLET: {
            id: 'rhythm_triplet',
            category: 'rhythm',
            description: 'Triplet feel',
            musical: { effect: 'triplet', subdivision: 3 },
        },

        // ─────────────────────────────────────────────────────────────────
        // COMBO PATTERNS - Multiple simultaneous
        // ─────────────────────────────────────────────────────────────────
        COMBO_NS_SIMULTANEOUS: {
            id: 'combo_ns_simultaneous',
            category: 'combo',
            description: 'N and S zones both active',
            requires: ['n', 's'],
            musical: { effect: 'octave_layer' },
        },
        COMBO_EW_SIMULTANEOUS: {
            id: 'combo_ew_simultaneous',
            category: 'combo',
            description: 'E and W zones both active',
            requires: ['e', 'w'],
            musical: { effect: 'stereo_width' },
        },
        COMBO_CORNERS_ALL: {
            id: 'combo_corners_all',
            category: 'combo',
            description: 'All corners active',
            requires: ['nw', 'ne', 'sw', 'se'],
            musical: { effect: 'full_arrangement' },
        },
        COMBO_EDGES_ALL: {
            id: 'combo_edges_all',
            category: 'combo',
            description: 'All edge zones active',
            requires: ['n', 's', 'e', 'w'],
            musical: { effect: 'surround' },
        },
        COMBO_ALL_ZONES: {
            id: 'combo_all_zones',
            category: 'combo',
            description: 'All zones active',
            requires: ['nw', 'n', 'ne', 'w', 'center', 'e', 'sw', 's', 'se'],
            musical: { effect: 'transcendence' },
        },

        // ─────────────────────────────────────────────────────────────────
        // SPECIAL PATTERNS - Unique combinations
        // ─────────────────────────────────────────────────────────────────
        SPECIAL_PENDULUM_NS: {
            id: 'special_pendulum_ns',
            category: 'special',
            description: 'North-South pendulum',
            zones: [['n', 's', 'n', 's', 'n']],
            musical: { effect: 'pendulum', axis: 'vertical' },
        },
        SPECIAL_PENDULUM_EW: {
            id: 'special_pendulum_ew',
            category: 'special',
            description: 'East-West pendulum',
            zones: [['e', 'w', 'e', 'w', 'e']],
            musical: { effect: 'pendulum', axis: 'horizontal' },
        },
        SPECIAL_ZIGZAG_DOWN: {
            id: 'special_zigzag_down',
            category: 'special',
            description: 'Zigzag downward',
            zones: [
                ['nw', 'n', 'ne', 'e', 'se', 's', 'sw'],
                ['ne', 'n', 'nw', 'w', 'sw', 's', 'se'],
            ],
            musical: { effect: 'cascade', direction: 'down' },
        },
        SPECIAL_BOUNCE: {
            id: 'special_bounce',
            category: 'special',
            description: 'Bouncing off edges',
            zones: [
                ['center', 'n', 'center', 's', 'center'],
                ['center', 'e', 'center', 'w', 'center'],
            ],
            musical: { effect: 'bounce', type: 'delay' },
        },
        SPECIAL_STAR: {
            id: 'special_star',
            category: 'special',
            description: 'Star pattern from center',
            zones: [
                ['center', 'n', 'center', 'ne', 'center', 'e', 'center', 'se', 'center', 's', 'center', 'sw', 'center', 'w', 'center', 'nw', 'center'],
            ],
            musical: { effect: 'starburst' },
        },
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN STATE
    // ═══════════════════════════════════════════════════════════════════════

    const patternState = {
        // Detection buffers
        zoneBuffer: [],           // Recent zones visited
        zoneTimestamps: [],       // When each zone was visited
        zoneDurations: [],        // How long in each zone

        positionBuffer: [],       // Recent positions (x, y, timestamp)
        velocityBuffer: [],       // Recent velocities

        // Active pattern tracking
        activePatterns: new Map(), // patternId -> { confidence, data, timestamp }
        patternHistory: [],        // All detected patterns

        // Rhythm detection
        movementOnsets: [],        // Times when movement started
        zoneTransitions: [],       // Times of zone changes
        lastBeat: 0,
        detectedBpm: 0,
        bpmConfidence: 0,

        // Combo tracking
        activeZones: new Set(),    // Currently active zones
        comboTimer: 0,
        lastComboCheck: 0,

        // Buffer limits
        maxBufferSize: 100,
        maxPatternHistory: 500,

        // Detection thresholds
        pathMatchThreshold: 0.8,   // Required match percentage
        shapeMatchThreshold: 0.7,
        rhythmMatchThreshold: 0.6,
        comboTimeout: 2.0,         // Seconds before combo expires

        // Cooldowns
        patternCooldowns: new Map(), // patternId -> timestamp
        cooldownDuration: 1.0,       // Seconds between same pattern
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BUFFER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    function addZoneVisit(zoneId, timestamp, duration) {
        patternState.zoneBuffer.push(zoneId);
        patternState.zoneTimestamps.push(timestamp);
        patternState.zoneDurations.push(duration);

        // Trim buffer
        while (patternState.zoneBuffer.length > patternState.maxBufferSize) {
            patternState.zoneBuffer.shift();
            patternState.zoneTimestamps.shift();
            patternState.zoneDurations.shift();
        }

        // Add to zone transitions for rhythm detection
        patternState.zoneTransitions.push(timestamp);
        while (patternState.zoneTransitions.length > 50) {
            patternState.zoneTransitions.shift();
        }
    }

    function addPosition(x, y, vx, vy, timestamp) {
        patternState.positionBuffer.push({ x, y, t: timestamp });
        patternState.velocityBuffer.push({ vx, vy, speed: Math.sqrt(vx*vx + vy*vy), t: timestamp });

        // Detect movement onset
        const speed = Math.sqrt(vx*vx + vy*vy);
        const prevSpeed = patternState.velocityBuffer.length > 1 ?
            patternState.velocityBuffer[patternState.velocityBuffer.length - 2].speed : 0;

        if (speed > 0.1 && prevSpeed < 0.05) {
            patternState.movementOnsets.push(timestamp);
            while (patternState.movementOnsets.length > 50) {
                patternState.movementOnsets.shift();
            }
        }

        // Trim buffers
        while (patternState.positionBuffer.length > patternState.maxBufferSize) {
            patternState.positionBuffer.shift();
            patternState.velocityBuffer.shift();
        }
    }

    function getRecentZones(count) {
        return patternState.zoneBuffer.slice(-count);
    }

    function getRecentPositions(count) {
        return patternState.positionBuffer.slice(-count);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATH PATTERN DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function detectPathPatterns() {
        const recentZones = getRecentZones(10);
        const detectedPatterns = [];

        // Check each path pattern
        for (const pattern of Object.values(PATTERN_TYPES)) {
            if (pattern.category !== 'path') continue;
            if (isOnCooldown(pattern.id)) continue;

            const match = matchZoneSequence(recentZones, pattern.zones);
            if (match.confidence >= patternState.pathMatchThreshold) {
                detectedPatterns.push({
                    pattern,
                    confidence: match.confidence,
                    matchedSequence: match.sequence,
                    direction: match.direction,
                });
            }
        }

        return detectedPatterns;
    }

    function matchZoneSequence(zones, targetSequences) {
        let bestMatch = { confidence: 0, sequence: null, direction: null };

        for (const targetSeq of targetSequences) {
            // Try to find this sequence in the zone buffer
            for (let i = 0; i <= zones.length - targetSeq.length; i++) {
                const slice = zones.slice(i, i + targetSeq.length);
                const matchScore = calculateSequenceMatch(slice, targetSeq);

                if (matchScore > bestMatch.confidence) {
                    bestMatch = {
                        confidence: matchScore,
                        sequence: targetSeq,
                        direction: getSequenceDirection(targetSeq),
                    };
                }
            }
        }

        return bestMatch;
    }

    function calculateSequenceMatch(actual, target) {
        if (actual.length !== target.length) return 0;

        let matches = 0;
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] === target[i]) {
                matches++;
            }
        }

        return matches / target.length;
    }

    function getSequenceDirection(sequence) {
        if (sequence.length < 2) return 'none';

        const start = GumpGrid.ZONE_PROPERTIES[sequence[0]]?.coords;
        const end = GumpGrid.ZONE_PROPERTIES[sequence[sequence.length - 1]]?.coords;

        if (!start || !end) return 'none';

        const dx = end.x - start.x;
        const dy = end.y - start.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SHAPE PATTERN DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function detectShapePatterns() {
        const recentZones = getRecentZones(15);
        const detectedPatterns = [];

        for (const pattern of Object.values(PATTERN_TYPES)) {
            if (pattern.category !== 'shape') continue;
            if (isOnCooldown(pattern.id)) continue;

            const match = matchZoneSequence(recentZones, pattern.zones);
            if (match.confidence >= patternState.shapeMatchThreshold) {
                detectedPatterns.push({
                    pattern,
                    confidence: match.confidence,
                    matchedSequence: match.sequence,
                    isClockwise: isClockwiseSequence(match.sequence),
                });
            }
        }

        return detectedPatterns;
    }

    function isClockwiseSequence(sequence) {
        if (sequence.length < 3) return null;

        let sum = 0;
        for (let i = 0; i < sequence.length - 1; i++) {
            const c1 = GumpGrid.ZONE_PROPERTIES[sequence[i]]?.coords;
            const c2 = GumpGrid.ZONE_PROPERTIES[sequence[i + 1]]?.coords;

            if (c1 && c2) {
                sum += (c2.x - c1.x) * (c2.y + c1.y);
            }
        }

        return sum > 0;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RHYTHM PATTERN DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function detectRhythmPatterns() {
        const detectedPatterns = [];

        // Calculate BPM from movement onsets
        const bpmResult = calculateBpmFromOnsets();
        if (bpmResult.confidence > 0.5) {
            patternState.detectedBpm = bpmResult.bpm;
            patternState.bpmConfidence = bpmResult.confidence;

            // Match to rhythm patterns
            for (const pattern of Object.values(PATTERN_TYPES)) {
                if (pattern.category !== 'rhythm') continue;
                if (!pattern.bpmRange) continue;
                if (isOnCooldown(pattern.id)) continue;

                if (bpmResult.bpm >= pattern.bpmRange[0] && bpmResult.bpm <= pattern.bpmRange[1]) {
                    detectedPatterns.push({
                        pattern,
                        confidence: bpmResult.confidence,
                        bpm: bpmResult.bpm,
                    });
                }
            }
        }

        // Check for accelerando/ritardando
        const tempoChange = detectTempoChange();
        if (tempoChange) {
            if (tempoChange.direction === 'up' && !isOnCooldown('rhythm_accelerando')) {
                detectedPatterns.push({
                    pattern: PATTERN_TYPES.RHYTHM_ACCELERANDO,
                    confidence: tempoChange.confidence,
                    rate: tempoChange.rate,
                });
            } else if (tempoChange.direction === 'down' && !isOnCooldown('rhythm_ritardando')) {
                detectedPatterns.push({
                    pattern: PATTERN_TYPES.RHYTHM_RITARDANDO,
                    confidence: tempoChange.confidence,
                    rate: tempoChange.rate,
                });
            }
        }

        // Check for syncopation
        const syncopation = detectSyncopation();
        if (syncopation && !isOnCooldown('rhythm_syncopation')) {
            detectedPatterns.push({
                pattern: PATTERN_TYPES.RHYTHM_SYNCOPATION,
                confidence: syncopation.confidence,
                offbeatStrength: syncopation.strength,
            });
        }

        return detectedPatterns;
    }

    function calculateBpmFromOnsets() {
        const onsets = patternState.movementOnsets;
        if (onsets.length < 4) return { bpm: 0, confidence: 0 };

        // Calculate intervals between onsets
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i - 1]);
        }

        // Find median interval
        const sortedIntervals = [...intervals].sort((a, b) => a - b);
        const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];

        // Calculate BPM from median interval
        const bpm = 60000 / medianInterval;

        // Calculate confidence based on consistency
        let consistency = 0;
        for (const interval of intervals) {
            const ratio = interval / medianInterval;
            if (ratio >= 0.8 && ratio <= 1.2) {
                consistency++;
            }
        }
        const confidence = consistency / intervals.length;

        // Only return valid BPM range
        if (bpm >= 40 && bpm <= 200) {
            return { bpm, confidence };
        }

        return { bpm: 0, confidence: 0 };
    }

    function detectTempoChange() {
        const onsets = patternState.movementOnsets;
        if (onsets.length < 6) return null;

        // Compare recent intervals to older intervals
        const recentIntervals = [];
        const olderIntervals = [];

        const midpoint = Math.floor(onsets.length / 2);
        for (let i = 1; i < midpoint; i++) {
            olderIntervals.push(onsets[i] - onsets[i - 1]);
        }
        for (let i = midpoint + 1; i < onsets.length; i++) {
            recentIntervals.push(onsets[i] - onsets[i - 1]);
        }

        const avgOld = olderIntervals.reduce((a, b) => a + b, 0) / olderIntervals.length;
        const avgRecent = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;

        const changeRatio = avgRecent / avgOld;

        if (changeRatio < 0.85) {
            return {
                direction: 'up',
                rate: 1 - changeRatio,
                confidence: Math.min(1, (1 - changeRatio) * 5),
            };
        } else if (changeRatio > 1.15) {
            return {
                direction: 'down',
                rate: changeRatio - 1,
                confidence: Math.min(1, (changeRatio - 1) * 5),
            };
        }

        return null;
    }

    function detectSyncopation() {
        const transitions = patternState.zoneTransitions;
        if (transitions.length < 8) return null;

        // Check if movements tend to fall off the beat
        // This is a simplified check - real syncopation detection would need more context
        const intervals = [];
        for (let i = 1; i < transitions.length; i++) {
            intervals.push(transitions[i] - transitions[i - 1]);
        }

        // Look for irregular but consistent patterns
        const sortedIntervals = [...intervals].sort((a, b) => a - b);
        const shortInterval = sortedIntervals[Math.floor(sortedIntervals.length * 0.25)];
        const longInterval = sortedIntervals[Math.floor(sortedIntervals.length * 0.75)];

        const ratio = longInterval / shortInterval;

        // Syncopation often involves 2:1 or 3:1 ratios (dotted rhythms)
        if (ratio >= 1.8 && ratio <= 2.2) {
            return { strength: 0.5, confidence: 0.6 };
        } else if (ratio >= 2.8 && ratio <= 3.2) {
            return { strength: 0.7, confidence: 0.7 };
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMBO PATTERN DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function detectComboPatterns(activeZones) {
        const detectedPatterns = [];

        for (const pattern of Object.values(PATTERN_TYPES)) {
            if (pattern.category !== 'combo') continue;
            if (isOnCooldown(pattern.id)) continue;

            // Check if all required zones are active
            const allActive = pattern.requires.every(zone => activeZones.has(zone));

            if (allActive) {
                detectedPatterns.push({
                    pattern,
                    confidence: 1.0,
                    zones: [...activeZones],
                });
            }
        }

        return detectedPatterns;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SPECIAL PATTERN DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function detectSpecialPatterns() {
        const recentZones = getRecentZones(20);
        const detectedPatterns = [];

        for (const pattern of Object.values(PATTERN_TYPES)) {
            if (pattern.category !== 'special') continue;
            if (isOnCooldown(pattern.id)) continue;

            const match = matchZoneSequence(recentZones, pattern.zones);
            if (match.confidence >= patternState.shapeMatchThreshold) {
                detectedPatterns.push({
                    pattern,
                    confidence: match.confidence,
                    matchedSequence: match.sequence,
                });
            }
        }

        return detectedPatterns;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN DETECTION LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function detectPatterns(activeZones, dt) {
        const allDetected = [];

        // Update active zones for combo detection
        patternState.activeZones = activeZones;
        patternState.comboTimer += dt;

        // Detect all pattern types
        allDetected.push(...detectPathPatterns());
        allDetected.push(...detectShapePatterns());
        allDetected.push(...detectRhythmPatterns());
        allDetected.push(...detectComboPatterns(activeZones));
        allDetected.push(...detectSpecialPatterns());

        // Sort by confidence
        allDetected.sort((a, b) => b.confidence - a.confidence);

        // Register detected patterns
        for (const detected of allDetected) {
            registerPattern(detected);
        }

        // Clean up old patterns
        cleanupPatterns();

        return allDetected;
    }

    function registerPattern(detected) {
        const patternId = detected.pattern.id;
        const now = Date.now();

        // Add to active patterns
        patternState.activePatterns.set(patternId, {
            pattern: detected.pattern,
            confidence: detected.confidence,
            data: detected,
            timestamp: now,
        });

        // Add to history
        patternState.patternHistory.push({
            patternId,
            confidence: detected.confidence,
            timestamp: now,
            data: detected,
        });

        // Trim history
        if (patternState.patternHistory.length > patternState.maxPatternHistory) {
            patternState.patternHistory = patternState.patternHistory.slice(-patternState.maxPatternHistory / 2);
        }

        // Set cooldown
        patternState.patternCooldowns.set(patternId, now);

        // Emit event
        if (typeof window !== 'undefined' && window.GumpEvents) {
            window.GumpEvents.emit('pattern.detected', {
                patternId,
                pattern: detected.pattern,
                confidence: detected.confidence,
                data: detected,
            });
        }

        console.log(`Pattern detected: ${patternId} (${(detected.confidence * 100).toFixed(0)}%)`);
    }

    function cleanupPatterns() {
        const now = Date.now();
        const timeout = 5000; // 5 seconds

        for (const [patternId, data] of patternState.activePatterns.entries()) {
            if (now - data.timestamp > timeout) {
                patternState.activePatterns.delete(patternId);
            }
        }
    }

    function isOnCooldown(patternId) {
        const lastTime = patternState.patternCooldowns.get(patternId);
        if (!lastTime) return false;

        const cooldownMs = patternState.cooldownDuration * 1000;
        return Date.now() - lastTime < cooldownMs;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    function getActivePatterns() {
        return new Map(patternState.activePatterns);
    }

    function isPatternActive(patternId) {
        return patternState.activePatterns.has(patternId);
    }

    function getPatternHistory(count = 20) {
        return patternState.patternHistory.slice(-count);
    }

    function getPatternCounts() {
        const counts = {};
        for (const entry of patternState.patternHistory) {
            counts[entry.patternId] = (counts[entry.patternId] || 0) + 1;
        }
        return counts;
    }

    function getMostCommonPatterns(limit = 5) {
        const counts = getPatternCounts();
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([id, count]) => ({ id, count }));
    }

    function getDetectedBpm() {
        return {
            bpm: patternState.detectedBpm,
            confidence: patternState.bpmConfidence,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN INFO
    // ═══════════════════════════════════════════════════════════════════════

    function getPatternDefinition(patternId) {
        return PATTERN_TYPES[patternId.toUpperCase()] || null;
    }

    function getPatternsByCategory(category) {
        return Object.values(PATTERN_TYPES).filter(p => p.category === category);
    }

    function getAllPatternIds() {
        return Object.keys(PATTERN_TYPES);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════════════════

    function reset() {
        patternState.zoneBuffer = [];
        patternState.zoneTimestamps = [];
        patternState.zoneDurations = [];
        patternState.positionBuffer = [];
        patternState.velocityBuffer = [];
        patternState.activePatterns.clear();
        patternState.patternHistory = [];
        patternState.movementOnsets = [];
        patternState.zoneTransitions = [];
        patternState.detectedBpm = 0;
        patternState.bpmConfidence = 0;
        patternState.activeZones.clear();
        patternState.patternCooldowns.clear();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Constants
        PATTERN_TYPES,

        // Buffer management
        addZoneVisit,
        addPosition,
        getRecentZones,
        getRecentPositions,

        // Detection
        detectPatterns,
        detectPathPatterns,
        detectShapePatterns,
        detectRhythmPatterns,
        detectComboPatterns,
        detectSpecialPatterns,

        // Queries
        getActivePatterns,
        isPatternActive,
        getPatternHistory,
        getPatternCounts,
        getMostCommonPatterns,
        getDetectedBpm,

        // Pattern info
        getPatternDefinition,
        getPatternsByCategory,
        getAllPatternIds,

        // Utilities
        reset,

        // State access
        get state() { return patternState; },
    });
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpPatterns;
}
