/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - DRUM MIND AGENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * AI agent specialized in rhythmic decision-making.
 * Manages drum patterns, fills, variations, and rhythmic evolution.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpDrumMind = (function() {
    'use strict';

    // Ensure dependencies are loaded
    if (typeof GumpAgentBase === 'undefined') {
        console.error('[GumpDrumMind] GumpAgentBase not found');
        return {};
    }

    const { Agent, registerAgentType, registerAgent } = GumpAgentBase;

    // ═══════════════════════════════════════════════════════════════════════
    // RHYTHM PATTERNS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Pattern library organized by era and intensity
     * Each pattern is an array of 16 steps (16th notes)
     * Values: 0 = silent, 1 = normal hit, 2 = accent
     */
    const PATTERN_LIBRARY = {
        // ─────────────────────────────────────────────────────────────────
        // GENESIS ERA - Minimal, primordial
        // ─────────────────────────────────────────────────────────────────
        genesis: {
            pulse: {
                kick: [2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                intensity: 0.2
            },
            breath: {
                kick: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                hihat: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                intensity: 0.15
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // PRIMORDIAL ERA - Natural rhythms
        // ─────────────────────────────────────────────────────────────────
        primordial: {
            heartbeat: {
                kick: [2, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                perc: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                intensity: 0.3
            },
            water: {
                kick: [2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                hihat: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
                intensity: 0.35
            },
            footsteps: {
                kick: [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                perc: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                intensity: 0.4
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // TRIBAL ERA - Ritualistic patterns
        // ─────────────────────────────────────────────────────────────────
        tribal: {
            ritual: {
                kick: [2, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 2, 0, 0, 1],
                snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                perc: [0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
                intensity: 0.5
            },
            trance: {
                kick: [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
                snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                perc: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
                intensity: 0.6
            },
            ceremony: {
                kick: [2, 0, 1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 2, 0, 1, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2],
                hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                perc: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
                intensity: 0.55
            },
            polyrhythm: {
                kick: [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
                snare: [0, 0, 0, 1, 0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0],
                hihat: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
                perc: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
                intensity: 0.65
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // SACRED ERA - Measured, devotional
        // ─────────────────────────────────────────────────────────────────
        sacred: {
            processional: {
                kick: [2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                intensity: 0.35
            },
            hymnal: {
                kick: [2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                hihat: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                intensity: 0.4
            },
            meditation: {
                kick: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                perc: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                intensity: 0.2
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // MODERN ERA - Contemporary production
        // ─────────────────────────────────────────────────────────────────
        modern: {
            basic808: {
                kick: [2, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                intensity: 0.5
            },
            trap: {
                kick: [2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 1],
                snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                hihatRolls: [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0],
                intensity: 0.7
            },
            boom: {
                kick: [2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 1],
                snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                intensity: 0.55
            },
            four_on_floor: {
                kick: [2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0],
                snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
                hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                openHat: [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                intensity: 0.6
            },
            halftime: {
                kick: [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
                hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                intensity: 0.45
            },
            breakbeat: {
                kick: [2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 1],
                hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
                intensity: 0.75
            }
        }
    };

    /**
     * Fill patterns for transitions
     */
    const FILL_LIBRARY = {
        subtle: [
            {
                duration: 4,
                pattern: {
                    snare: [0, 0, 1, 0, 0, 0, 1, 1],
                    hihat: [1, 1, 1, 1, 1, 1, 1, 1]
                }
            }
        ],
        medium: [
            {
                duration: 4,
                pattern: {
                    kick: [1, 0, 0, 0, 1, 0, 0, 0],
                    snare: [0, 0, 1, 0, 0, 1, 1, 2],
                    hihat: [1, 1, 1, 1, 1, 1, 1, 1]
                }
            },
            {
                duration: 4,
                pattern: {
                    snare: [0, 1, 0, 1, 0, 1, 1, 2],
                    tom: [1, 0, 1, 0, 1, 0, 0, 0]
                }
            }
        ],
        intense: [
            {
                duration: 4,
                pattern: {
                    snare: [1, 1, 1, 1, 1, 1, 2, 2],
                    tom: [0, 1, 0, 1, 1, 1, 0, 0]
                }
            },
            {
                duration: 8,
                pattern: {
                    kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 2],
                    snare: [0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2],
                    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]
                }
            }
        ],
        drop: [
            {
                duration: 4,
                pattern: {
                    kick: [0, 0, 0, 0, 0, 0, 0, 0],
                    snare: [0, 0, 0, 0, 0, 0, 0, 0],
                    hihat: [0, 0, 0, 0, 0, 0, 0, 0]
                },
                isSilent: true
            }
        ]
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DRUM MIND AGENT CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class DrumMindAgent extends Agent {
        constructor(id = 'drum-mind', config = {}) {
            super(id, 'drums', {
                updateRate: 25,  // Fast updates for rhythmic accuracy
                ...config
            });

            // Current pattern state
            this.patternState = {
                currentPattern: null,
                currentPatternName: null,
                era: 'genesis',
                step: 0,
                bar: 0,
                variation: 0,
                fill: null,
                fillStep: 0
            };

            // Rhythm tracking
            this.rhythm = {
                bpm: 90,
                swing: 0,
                humanize: 0.1,
                groove: 0.5
            };

            // Pattern generation state
            this.generation = {
                complexity: 0.5,
                density: 0.5,
                syncopation: 0.3,
                variation: 0.2
            };

            // Variation buffers
            this.variations = {
                current: null,
                next: null,
                transitionBar: -1
            };

            // Sound type preferences
            this.soundTypes = {
                kick: '808_deep',
                snare: '808',
                hihat: 'closed',
                openHat: 'open',
                perc: 'click'
            };

            // Event timing
            this.lastStepTime = 0;
            this.stepDuration = 0;

            // Learning - which patterns work well
            this.patternScores = new Map();
        }

        // ═══════════════════════════════════════════════════════════════════
        // LIFECYCLE
        // ═══════════════════════════════════════════════════════════════════

        _onStart() {
            // Subscribe to events
            if (typeof GumpEvents !== 'undefined') {
                GumpEvents.on('beat', (data) => this.onBeat(data));
                GumpEvents.on('step', (data) => this.onStep(data));
                GumpEvents.on('era.change', (data) => this.onEraChange(data));
            }

            // Set initial pattern
            this.selectPattern('genesis', 'pulse');
        }

        // ═══════════════════════════════════════════════════════════════════
        // PERCEPTION
        // ═══════════════════════════════════════════════════════════════════

        perceive() {
            const perceptions = {};

            // Get state from global
            if (typeof GumpState !== 'undefined') {
                perceptions.era = GumpState.get('era.current') || 'genesis';
                perceptions.zone = GumpState.get('grid.currentZone') || 'center';
                perceptions.bpm = GumpState.get('music.bpm') || 90;
                perceptions.dynamics = GumpState.get('music.dynamics') || 0.5;
                perceptions.energy = GumpState.get('music.energy') || 0.5;
            }

            // Current pattern state
            perceptions.pattern = this.patternState.currentPatternName;
            perceptions.step = this.patternState.step;
            perceptions.bar = this.patternState.bar;
            perceptions.inFill = this.patternState.fill !== null;

            // Rhythm state
            perceptions.complexity = this.generation.complexity;
            perceptions.density = this.generation.density;

            return perceptions;
        }

        // ═══════════════════════════════════════════════════════════════════
        // DECISION MAKING
        // ═══════════════════════════════════════════════════════════════════

        getPossibleActions() {
            const actions = [];
            const perceptions = this.perceptions.current;

            // Pattern change
            if (this.shouldChangePattern()) {
                const era = perceptions.era || 'genesis';
                const patterns = this.getPatternsForEra(era);

                for (const patternName of patterns) {
                    actions.push({
                        type: 'change_pattern',
                        pattern: patternName,
                        era: era,
                        priority: this.evaluatePatternFit(patternName, era)
                    });
                }
            }

            // Add variation
            if (this.shouldAddVariation()) {
                actions.push({
                    type: 'add_variation',
                    amount: 0.1 + Math.random() * 0.2,
                    priority: 0.5
                });
            }

            // Trigger fill
            if (this.shouldTriggerFill()) {
                const intensity = this.getFillIntensity();
                actions.push({
                    type: 'trigger_fill',
                    intensity,
                    priority: 0.7
                });
            }

            // Adjust parameters
            const densityChange = this.suggestDensityChange();
            if (Math.abs(densityChange) > 0.05) {
                actions.push({
                    type: 'adjust_density',
                    change: densityChange,
                    priority: 0.4
                });
            }

            // Sound type changes
            if (this.shouldChangeSounds()) {
                actions.push({
                    type: 'change_sounds',
                    priority: 0.3
                });
            }

            return actions;
        }

        evaluateAction(action) {
            let score = action.priority || 0.5;

            const perceptions = this.perceptions.current;

            switch (action.type) {
                case 'change_pattern':
                    // Prefer patterns that match current dynamics
                    const patternDef = this.getPattern(action.era, action.pattern);
                    if (patternDef) {
                        const intensityMatch = 1 - Math.abs(
                            patternDef.intensity - (perceptions.dynamics || 0.5)
                        );
                        score *= 0.5 + intensityMatch * 0.5;
                    }

                    // Check learned preferences
                    const patternScore = this.patternScores.get(action.pattern);
                    if (patternScore) {
                        score *= 0.7 + patternScore * 0.3;
                    }
                    break;

                case 'trigger_fill':
                    // Higher priority near section boundaries
                    const barInSection = this.patternState.bar % 8;
                    if (barInSection >= 6) {
                        score *= 1.5;
                    }
                    break;

                case 'add_variation':
                    // Less variation when energy is low
                    score *= 0.5 + (perceptions.energy || 0.5) * 0.5;
                    break;
            }

            return Math.min(1, score);
        }

        think(selectedActions, dt) {
            // Filter conflicting actions
            const hasPatternChange = selectedActions.some(a => a.type === 'change_pattern');

            return selectedActions.filter(action => {
                // Don't add variation if changing pattern
                if (hasPatternChange && action.type === 'add_variation') {
                    return false;
                }
                return true;
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // ACTION EXECUTION
        // ═══════════════════════════════════════════════════════════════════

        executeAction(action) {
            switch (action.type) {
                case 'change_pattern':
                    return this.executePatternChange(action.era, action.pattern);

                case 'add_variation':
                    return this.executeAddVariation(action.amount);

                case 'trigger_fill':
                    return this.executeTriggerFill(action.intensity);

                case 'adjust_density':
                    return this.executeAdjustDensity(action.change);

                case 'change_sounds':
                    return this.executeChangeSounds();

                default:
                    return null;
            }
        }

        executePatternChange(era, patternName) {
            // Schedule for next bar boundary
            this.variations.next = {
                era,
                pattern: patternName
            };
            this.variations.transitionBar = this.patternState.bar + 1;

            this.log('Scheduled pattern change:', patternName);
            return { scheduled: patternName };
        }

        executeAddVariation(amount) {
            if (!this.patternState.currentPattern) return null;

            // Create variation of current pattern
            const variation = this.createVariation(
                this.patternState.currentPattern,
                amount
            );

            this.variations.current = variation;

            return { variation: amount };
        }

        executeTriggerFill(intensity) {
            // Select appropriate fill
            let fillCategory;
            if (intensity < 0.3) {
                fillCategory = 'subtle';
            } else if (intensity < 0.6) {
                fillCategory = 'medium';
            } else if (intensity < 0.9) {
                fillCategory = 'intense';
            } else {
                fillCategory = 'drop';
            }

            const fills = FILL_LIBRARY[fillCategory];
            const fill = fills[Math.floor(Math.random() * fills.length)];

            this.patternState.fill = fill;
            this.patternState.fillStep = 0;

            this.emit('fill.start', { category: fillCategory });

            return { fill: fillCategory };
        }

        executeAdjustDensity(change) {
            this.generation.density = Math.max(0, Math.min(1,
                this.generation.density + change
            ));

            return { density: this.generation.density };
        }

        executeChangeSounds() {
            const era = this.perceptions.current.era || 'genesis';

            // Select appropriate sounds for era
            this.soundTypes = this.getSoundTypesForEra(era);

            this.emit('sounds.change', { types: this.soundTypes });

            return { sounds: this.soundTypes };
        }

        // ═══════════════════════════════════════════════════════════════════
        // PATTERN MANAGEMENT
        // ═══════════════════════════════════════════════════════════════════

        selectPattern(era, patternName) {
            const pattern = this.getPattern(era, patternName);
            if (!pattern) {
                this.log('Pattern not found:', era, patternName);
                return false;
            }

            this.patternState.currentPattern = pattern;
            this.patternState.currentPatternName = patternName;
            this.patternState.era = era;
            this.patternState.step = 0;
            this.patternState.variation = 0;

            this.emit('pattern.change', { era, pattern: patternName });

            return true;
        }

        getPattern(era, patternName) {
            const eraPatterns = PATTERN_LIBRARY[era];
            if (!eraPatterns) return null;

            return eraPatterns[patternName] || null;
        }

        getPatternsForEra(era) {
            const eraPatterns = PATTERN_LIBRARY[era];
            if (!eraPatterns) return [];
            return Object.keys(eraPatterns);
        }

        evaluatePatternFit(patternName, era) {
            const pattern = this.getPattern(era, patternName);
            if (!pattern) return 0;

            const dynamics = this.perceptions.current.dynamics || 0.5;
            const energy = this.perceptions.current.energy || 0.5;

            // Match intensity to dynamics
            const intensityMatch = 1 - Math.abs(pattern.intensity - dynamics);

            // Energy affects preference for complex patterns
            const complexityFit = pattern.intensity > 0.5 ?
                energy * 0.5 + 0.5 :
                (1 - energy) * 0.5 + 0.5;

            return (intensityMatch * 0.6 + complexityFit * 0.4);
        }

        createVariation(pattern, amount) {
            const variation = {};

            for (const [instrument, steps] of Object.entries(pattern)) {
                if (instrument === 'intensity') continue;
                if (!Array.isArray(steps)) continue;

                variation[instrument] = steps.map((step, i) => {
                    // Random chance to modify
                    if (Math.random() < amount) {
                        if (step > 0) {
                            // Chance to remove or shift
                            return Math.random() < 0.5 ? 0 : step;
                        } else {
                            // Chance to add ghost note
                            return Math.random() < 0.3 ? 1 : 0;
                        }
                    }
                    return step;
                });
            }

            return variation;
        }

        // ═══════════════════════════════════════════════════════════════════
        // DECISION HELPERS
        // ═══════════════════════════════════════════════════════════════════

        shouldChangePattern() {
            // Change patterns at musical boundaries
            if (this.patternState.bar % 8 !== 7) return false;

            // Also check if dynamics have changed significantly
            const currentIntensity = this.patternState.currentPattern?.intensity || 0.5;
            const targetDynamics = this.perceptions.current.dynamics || 0.5;

            return Math.abs(currentIntensity - targetDynamics) > 0.2;
        }

        shouldAddVariation() {
            // Add variation occasionally
            if (this.patternState.bar % 4 !== 3) return false;

            return this.state.creativity > 0.3 && Math.random() < this.generation.variation;
        }

        shouldTriggerFill() {
            // Fills at section boundaries
            const barInSection = this.patternState.bar % 8;
            if (barInSection !== 7) return false;

            // Step needs to be near end of bar
            return this.patternState.step >= 12;
        }

        getFillIntensity() {
            const dynamics = this.perceptions.current.dynamics || 0.5;
            const energy = this.perceptions.current.energy || 0.5;

            // Blend dynamics and energy
            return dynamics * 0.6 + energy * 0.4;
        }

        suggestDensityChange() {
            const energy = this.perceptions.current.energy || 0.5;
            return (energy - this.generation.density) * 0.2;
        }

        shouldChangeSounds() {
            // Check if era has changed
            return this.hasChanged('era');
        }

        getSoundTypesForEra(era) {
            const eraSounds = {
                genesis: {
                    kick: 'sine',
                    snare: 'click',
                    hihat: 'click',
                    perc: 'click'
                },
                primordial: {
                    kick: 'tribal',
                    snare: 'organic',
                    hihat: 'closed',
                    perc: 'wood'
                },
                tribal: {
                    kick: 'tribal',
                    snare: 'organic',
                    hihat: 'closed',
                    openHat: 'open',
                    perc: 'conga'
                },
                sacred: {
                    kick: 'acoustic',
                    snare: 'rim',
                    hihat: 'closed',
                    perc: 'shaker'
                },
                modern: {
                    kick: '808_deep',
                    snare: '808',
                    hihat: 'closed',
                    openHat: 'open',
                    perc: 'click'
                }
            };

            return eraSounds[era] || eraSounds.modern;
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP/BEAT HANDLING
        // ═══════════════════════════════════════════════════════════════════

        onStep(data) {
            const step = data.step || 0;
            this.patternState.step = step % 16;

            // Check for bar change
            if (step > 0 && step % 16 === 0) {
                this.patternState.bar++;
                this.onBarChange();
            }

            // Play current step
            this.playStep(this.patternState.step);
        }

        onBeat(data) {
            // Update timing
            this.rhythm.bpm = data.bpm || this.rhythm.bpm;
            this.stepDuration = (60000 / this.rhythm.bpm) / 4;  // 16th notes
        }

        onBarChange() {
            // Clear fill
            if (this.patternState.fill) {
                this.patternState.fill = null;
                this.emit('fill.end');
            }

            // Check for scheduled pattern change
            if (this.variations.next && this.patternState.bar >= this.variations.transitionBar) {
                this.selectPattern(
                    this.variations.next.era,
                    this.variations.next.pattern
                );
                this.variations.next = null;
                this.variations.transitionBar = -1;
            }
        }

        onEraChange(data) {
            const era = data.to;
            this.patternState.era = era;

            // Select appropriate pattern for new era
            const patterns = this.getPatternsForEra(era);
            if (patterns.length > 0) {
                // Choose based on current dynamics
                const dynamics = this.perceptions.current.dynamics || 0.5;

                let bestPattern = patterns[0];
                let bestMatch = 0;

                for (const patternName of patterns) {
                    const pattern = this.getPattern(era, patternName);
                    if (pattern) {
                        const match = 1 - Math.abs(pattern.intensity - dynamics);
                        if (match > bestMatch) {
                            bestMatch = match;
                            bestPattern = patternName;
                        }
                    }
                }

                this.executePatternChange(era, bestPattern);
            }

            // Update sounds
            this.executeChangeSounds();
        }

        playStep(step) {
            // Determine which pattern to use
            let pattern;

            if (this.patternState.fill) {
                // Playing fill
                pattern = this.patternState.fill.pattern;
                this.patternState.fillStep++;
            } else if (this.variations.current) {
                // Playing variation
                pattern = this.variations.current;
            } else {
                // Playing main pattern
                pattern = this.patternState.currentPattern;
            }

            if (!pattern) return;

            // Get hits for this step
            const hits = this.getHitsForStep(pattern, step);

            // Trigger sounds
            for (const hit of hits) {
                this.triggerHit(hit);
            }
        }

        getHitsForStep(pattern, step) {
            const hits = [];

            for (const [instrument, steps] of Object.entries(pattern)) {
                if (instrument === 'intensity') continue;
                if (!Array.isArray(steps)) continue;

                const value = steps[step % steps.length];
                if (value > 0) {
                    hits.push({
                        instrument,
                        velocity: value === 2 ? 1.0 : 0.7,
                        accent: value === 2
                    });
                }
            }

            // Apply humanization
            if (this.rhythm.humanize > 0) {
                hits.forEach(hit => {
                    hit.velocity *= (1 - this.rhythm.humanize * 0.2 + Math.random() * this.rhythm.humanize * 0.4);
                    hit.timing = (Math.random() - 0.5) * this.rhythm.humanize * 20;  // ms
                });
            }

            return hits;
        }

        triggerHit(hit) {
            // Get sound type for instrument
            const soundType = this.soundTypes[hit.instrument] || hit.instrument;

            // Emit for drum engine
            this.emit('hit', {
                instrument: hit.instrument,
                type: soundType,
                velocity: hit.velocity * this.state.energy,
                accent: hit.accent,
                timing: hit.timing || 0
            });

            // Trigger via GumpDrums if available
            if (typeof GumpDrums !== 'undefined') {
                const delay = Math.max(0, hit.timing || 0);

                setTimeout(() => {
                    switch (hit.instrument) {
                        case 'kick':
                            GumpDrums.playKick(soundType, hit.velocity);
                            break;
                        case 'snare':
                            GumpDrums.playSnare(soundType, hit.velocity);
                            break;
                        case 'hihat':
                            GumpDrums.playHiHat(hit.accent ? 'open' : 'closed', hit.velocity);
                            break;
                        case 'openHat':
                            GumpDrums.playHiHat('open', hit.velocity);
                            break;
                        case 'perc':
                            GumpDrums.playPercussion(soundType, hit.velocity);
                            break;
                    }
                }, delay);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // MESSAGE HANDLING
        // ═══════════════════════════════════════════════════════════════════

        handleMessage(message) {
            switch (message.type) {
                case 'instruction':
                    this.handleInstruction(message.data);
                    break;

                case 'section.change':
                    this.handleSectionChange(message.data);
                    break;

                case 'dynamics.change':
                    this.handleDynamicsChange(message.data);
                    break;

                case 'tension.change':
                    this.handleTensionChange(message.data);
                    break;

                case 'mood.apply':
                    this.handleMoodApply(message.data);
                    break;
            }
        }

        handleInstruction(instruction) {
            switch (instruction.action) {
                case 'activate':
                    this.setEnergy(0.5);
                    break;
                case 'deactivate':
                    this.setEnergy(0);
                    break;
                case 'change_type':
                    this.remember('soundType', instruction.type);
                    break;
            }
        }

        handleSectionChange(data) {
            // Trigger fill for section change
            this.executeTriggerFill(data.dynamics || 0.5);
        }

        handleDynamicsChange(data) {
            // Adjust energy based on dynamics
            this.setEnergy(data.dynamics);
        }

        handleTensionChange(data) {
            // Increase complexity with tension
            this.generation.complexity = 0.3 + data.tension * 0.5;
            this.generation.density = 0.3 + data.tension * 0.4;
        }

        handleMoodApply(config) {
            if (config.active !== undefined) {
                this.setEnergy(config.active ? 0.5 : 0);
            }

            if (config.type) {
                this.remember('soundType', config.type);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // LEARNING
        // ═══════════════════════════════════════════════════════════════════

        calculateReward() {
            // Reward based on:
            // 1. Appropriate intensity for dynamics
            // 2. User engagement during pattern

            const currentIntensity = this.patternState.currentPattern?.intensity || 0.5;
            const targetDynamics = this.perceptions.current.dynamics || 0.5;

            const intensityMatch = 1 - Math.abs(currentIntensity - targetDynamics);

            // Could also factor in user activity if available
            const engagement = this.perceptions.current.energy || 0.5;

            return intensityMatch * 0.6 + engagement * 0.4;
        }

        learn(reward) {
            // Update pattern score
            const pattern = this.patternState.currentPatternName;
            if (pattern) {
                const current = this.patternScores.get(pattern) || 0.5;
                const alpha = 0.1;
                this.patternScores.set(pattern, current * (1 - alpha) + reward * alpha);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // PUBLIC METHODS
        // ═══════════════════════════════════════════════════════════════════

        setComplexity(value) {
            this.generation.complexity = Math.max(0, Math.min(1, value));
        }

        setDensity(value) {
            this.generation.density = Math.max(0, Math.min(1, value));
        }

        setSwing(value) {
            this.rhythm.swing = Math.max(0, Math.min(1, value));
        }

        setHumanize(value) {
            this.rhythm.humanize = Math.max(0, Math.min(1, value));
        }

        triggerFill(intensity = 0.5) {
            this.executeTriggerFill(intensity);
        }

        getStatus() {
            return {
                ...super.getStatus(),
                pattern: this.patternState.currentPatternName,
                era: this.patternState.era,
                bar: this.patternState.bar,
                step: this.patternState.step,
                inFill: this.patternState.fill !== null,
                generation: { ...this.generation },
                rhythm: { ...this.rhythm }
            };
        }
    }

    // Register the agent type
    registerAgentType('drums', DrumMindAgent);

    // ═══════════════════════════════════════════════════════════════════════
    // SINGLETON INSTANCE
    // ═══════════════════════════════════════════════════════════════════════

    let instance = null;

    function getInstance() {
        if (!instance) {
            instance = new DrumMindAgent('drum-mind');
            registerAgent(instance);
        }
        return instance;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        DrumMindAgent,
        getInstance,
        PATTERN_LIBRARY,
        FILL_LIBRARY
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpDrumMind;
}
