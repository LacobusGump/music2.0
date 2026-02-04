/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - DYNAMICS MIND AGENT
 * Overall dynamics, energy, and intensity management agent
 * ═══════════════════════════════════════════════════════════════════════════
 */

const DynamicsMind = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // DYNAMICS CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Energy states and their characteristics
     */
    const ENERGY_STATES = {
        dormant: {
            name: 'Dormant',
            level: 0,
            description: 'Silence or near-silence',
            characteristics: {
                volume: 0.1,
                density: 0.1,
                tempo: 0.5,
                complexity: 0.1,
                brightness: 0.2
            },
            agentConfig: {
                drums: { active: false, intensity: 0 },
                bass: { active: false, intensity: 0 },
                harmony: { active: true, intensity: 0.2 },
                lead: { active: false, intensity: 0 },
                texture: { active: true, intensity: 0.3 }
            },
            transitions: ['emerging', 'ambient'],
            dwellRange: [5, 20]
        },

        ambient: {
            name: 'Ambient',
            level: 1,
            description: 'Gentle textures and drones',
            characteristics: {
                volume: 0.25,
                density: 0.2,
                tempo: 0.6,
                complexity: 0.2,
                brightness: 0.3
            },
            agentConfig: {
                drums: { active: false, intensity: 0 },
                bass: { active: true, intensity: 0.2 },
                harmony: { active: true, intensity: 0.4 },
                lead: { active: false, intensity: 0 },
                texture: { active: true, intensity: 0.5 }
            },
            transitions: ['dormant', 'emerging', 'contemplative'],
            dwellRange: [10, 60]
        },

        emerging: {
            name: 'Emerging',
            level: 2,
            description: 'Elements beginning to form',
            characteristics: {
                volume: 0.35,
                density: 0.3,
                tempo: 0.7,
                complexity: 0.3,
                brightness: 0.4
            },
            agentConfig: {
                drums: { active: true, intensity: 0.3 },
                bass: { active: true, intensity: 0.4 },
                harmony: { active: true, intensity: 0.5 },
                lead: { active: false, intensity: 0 },
                texture: { active: true, intensity: 0.4 }
            },
            transitions: ['ambient', 'contemplative', 'building'],
            dwellRange: [8, 30]
        },

        contemplative: {
            name: 'Contemplative',
            level: 3,
            description: 'Reflective, steady groove',
            characteristics: {
                volume: 0.45,
                density: 0.4,
                tempo: 0.8,
                complexity: 0.4,
                brightness: 0.5
            },
            agentConfig: {
                drums: { active: true, intensity: 0.5 },
                bass: { active: true, intensity: 0.6 },
                harmony: { active: true, intensity: 0.6 },
                lead: { active: true, intensity: 0.3 },
                texture: { active: true, intensity: 0.3 }
            },
            transitions: ['emerging', 'ambient', 'building', 'flowing'],
            dwellRange: [15, 90]
        },

        flowing: {
            name: 'Flowing',
            level: 4,
            description: 'Smooth, continuous movement',
            characteristics: {
                volume: 0.55,
                density: 0.5,
                tempo: 0.85,
                complexity: 0.5,
                brightness: 0.55
            },
            agentConfig: {
                drums: { active: true, intensity: 0.6 },
                bass: { active: true, intensity: 0.7 },
                harmony: { active: true, intensity: 0.65 },
                lead: { active: true, intensity: 0.5 },
                texture: { active: true, intensity: 0.35 }
            },
            transitions: ['contemplative', 'building', 'intensifying'],
            dwellRange: [20, 120]
        },

        building: {
            name: 'Building',
            level: 5,
            description: 'Energy increasing, tension rising',
            characteristics: {
                volume: 0.65,
                density: 0.6,
                tempo: 0.9,
                complexity: 0.6,
                brightness: 0.65
            },
            agentConfig: {
                drums: { active: true, intensity: 0.75 },
                bass: { active: true, intensity: 0.8 },
                harmony: { active: true, intensity: 0.7 },
                lead: { active: true, intensity: 0.6 },
                texture: { active: true, intensity: 0.4 }
            },
            transitions: ['flowing', 'contemplative', 'intensifying', 'climactic'],
            dwellRange: [10, 45]
        },

        intensifying: {
            name: 'Intensifying',
            level: 6,
            description: 'High energy, approaching peak',
            characteristics: {
                volume: 0.75,
                density: 0.75,
                tempo: 0.95,
                complexity: 0.7,
                brightness: 0.75
            },
            agentConfig: {
                drums: { active: true, intensity: 0.85 },
                bass: { active: true, intensity: 0.9 },
                harmony: { active: true, intensity: 0.8 },
                lead: { active: true, intensity: 0.75 },
                texture: { active: true, intensity: 0.5 }
            },
            transitions: ['building', 'climactic', 'transcendent'],
            dwellRange: [8, 30]
        },

        climactic: {
            name: 'Climactic',
            level: 7,
            description: 'Peak energy moment',
            characteristics: {
                volume: 0.85,
                density: 0.85,
                tempo: 1.0,
                complexity: 0.8,
                brightness: 0.85
            },
            agentConfig: {
                drums: { active: true, intensity: 0.95 },
                bass: { active: true, intensity: 1.0 },
                harmony: { active: true, intensity: 0.9 },
                lead: { active: true, intensity: 0.9 },
                texture: { active: true, intensity: 0.6 }
            },
            transitions: ['intensifying', 'transcendent', 'releasing'],
            dwellRange: [5, 20]
        },

        transcendent: {
            name: 'Transcendent',
            level: 8,
            description: 'Beyond peak, ethereal',
            characteristics: {
                volume: 0.9,
                density: 0.7,
                tempo: 1.0,
                complexity: 0.9,
                brightness: 0.95
            },
            agentConfig: {
                drums: { active: true, intensity: 0.8 },
                bass: { active: true, intensity: 0.7 },
                harmony: { active: true, intensity: 1.0 },
                lead: { active: true, intensity: 1.0 },
                texture: { active: true, intensity: 0.8 }
            },
            transitions: ['climactic', 'releasing', 'dissolving'],
            dwellRange: [5, 15]
        },

        releasing: {
            name: 'Releasing',
            level: 6,
            description: 'Energy releasing, coming down',
            characteristics: {
                volume: 0.65,
                density: 0.5,
                tempo: 0.85,
                complexity: 0.5,
                brightness: 0.6
            },
            agentConfig: {
                drums: { active: true, intensity: 0.6 },
                bass: { active: true, intensity: 0.6 },
                harmony: { active: true, intensity: 0.7 },
                lead: { active: true, intensity: 0.5 },
                texture: { active: true, intensity: 0.5 }
            },
            transitions: ['climactic', 'transcendent', 'dissolving', 'flowing'],
            dwellRange: [10, 40]
        },

        dissolving: {
            name: 'Dissolving',
            level: 3,
            description: 'Fading into quietude',
            characteristics: {
                volume: 0.35,
                density: 0.25,
                tempo: 0.7,
                complexity: 0.3,
                brightness: 0.4
            },
            agentConfig: {
                drums: { active: true, intensity: 0.3 },
                bass: { active: true, intensity: 0.4 },
                harmony: { active: true, intensity: 0.5 },
                lead: { active: false, intensity: 0 },
                texture: { active: true, intensity: 0.4 }
            },
            transitions: ['releasing', 'ambient', 'dormant', 'contemplative'],
            dwellRange: [15, 60]
        }
    };

    /**
     * Transition curves for smooth changes
     */
    const TRANSITION_CURVES = {
        linear: t => t,
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        exponential: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
        elastic: t => {
            if (t === 0 || t === 1) return t;
            const p = 0.3;
            const s = p / 4;
            return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
        },
        bounce: t => {
            if (t < 1/2.75) return 7.5625 * t * t;
            if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
            if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
        }
    };

    /**
     * Era-specific dynamic profiles
     */
    const ERA_PROFILES = {
        genesis: {
            preferredStates: ['dormant', 'ambient', 'emerging'],
            maxEnergy: 'contemplative',
            transitionSpeed: 0.3,
            volatility: 0.1,
            defaultState: 'ambient'
        },
        primordial: {
            preferredStates: ['ambient', 'emerging', 'contemplative', 'flowing'],
            maxEnergy: 'building',
            transitionSpeed: 0.4,
            volatility: 0.2,
            defaultState: 'emerging'
        },
        tribal: {
            preferredStates: ['contemplative', 'flowing', 'building', 'intensifying'],
            maxEnergy: 'climactic',
            transitionSpeed: 0.6,
            volatility: 0.4,
            defaultState: 'contemplative'
        },
        sacred: {
            preferredStates: ['ambient', 'contemplative', 'building', 'transcendent'],
            maxEnergy: 'transcendent',
            transitionSpeed: 0.5,
            volatility: 0.3,
            defaultState: 'contemplative'
        },
        modern: {
            preferredStates: ['flowing', 'building', 'intensifying', 'climactic'],
            maxEnergy: 'transcendent',
            transitionSpeed: 0.7,
            volatility: 0.5,
            defaultState: 'flowing'
        }
    };

    /**
     * Zone influence on dynamics
     */
    const ZONE_DYNAMICS = {
        'top-left': { energyBias: 0.1, brightnessBoost: 0.1, densityMod: -0.1 },
        'top-center': { energyBias: 0.2, brightnessBoost: 0.15, densityMod: 0 },
        'top-right': { energyBias: 0.15, brightnessBoost: 0.2, densityMod: 0.05 },
        'middle-left': { energyBias: -0.1, brightnessBoost: -0.05, densityMod: -0.05 },
        'center': { energyBias: 0, brightnessBoost: 0, densityMod: 0 },
        'middle-right': { energyBias: 0.1, brightnessBoost: 0.05, densityMod: 0.1 },
        'bottom-left': { energyBias: -0.15, brightnessBoost: -0.1, densityMod: -0.1 },
        'bottom-center': { energyBias: 0.05, brightnessBoost: 0, densityMod: 0.15 },
        'bottom-right': { energyBias: 0.25, brightnessBoost: 0.1, densityMod: 0.2 }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DYNAMICS MIND CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class DynamicsMindAgent {
        constructor() {
            this.agentId = 'dynamics-mind';
            this.name = 'Dynamics Mind';
            this.type = 'dynamics';

            // Current state
            this.currentEra = 'genesis';
            this.currentState = 'ambient';
            this.targetState = 'ambient';
            this.stateStartTime = Date.now();

            // Transition state
            this.isTransitioning = false;
            this.transitionProgress = 0;
            this.transitionDuration = 4000;
            this.transitionCurve = 'easeInOut';
            this.fromState = null;

            // Current characteristics (interpolated)
            this.characteristics = {
                volume: 0.25,
                density: 0.2,
                tempo: 0.6,
                complexity: 0.2,
                brightness: 0.3
            };

            // Agent intensities (interpolated)
            this.agentIntensities = {
                drums: 0,
                bass: 0.2,
                harmony: 0.4,
                lead: 0,
                texture: 0.5
            };

            // Zone tracking
            this.currentZone = 'center';
            this.zoneInfluence = 0.3;

            // Activity tracking
            this.activityLevel = 0;
            this.activityHistory = [];
            this.activityDecay = 0.95;

            // Decision making
            this.decisionInterval = 3000;
            this.lastDecision = 0;
            this.autoTransition = true;

            // State history for patterns
            this.stateHistory = [];
            this.maxHistory = 50;

            // Learning
            this.statePreferences = {};
            this.transitionPreferences = {};
            this._initPreferences();

            // Callbacks
            this.onStateChange = null;
            this.onCharacteristicsChange = null;
        }

        /**
         * Initialize preferences
         */
        _initPreferences() {
            for (const state of Object.keys(ENERGY_STATES)) {
                this.statePreferences[state] = {
                    weight: 1,
                    dwellTotal: 0,
                    visits: 0,
                    avgDwell: 0
                };
                this.transitionPreferences[state] = {};
            }
        }

        /**
         * Set current era
         */
        setEra(era) {
            if (era === this.currentEra) return;

            this.currentEra = era;

            // Get era profile
            const profile = ERA_PROFILES[era];
            if (!profile) return;

            // Adjust transition speed
            this.transitionDuration = 4000 / profile.transitionSpeed;

            // Check if current state is valid for era
            if (!profile.preferredStates.includes(this.currentState)) {
                this.transitionTo(profile.defaultState);
            }
        }

        /**
         * Update zone position
         */
        updateZone(zone) {
            this.currentZone = zone;
        }

        /**
         * Register user activity
         */
        registerActivity(intensity = 1) {
            this.activityLevel = Math.min(1, this.activityLevel + intensity * 0.1);
            this.activityHistory.push({
                intensity,
                timestamp: Date.now()
            });

            // Keep history limited
            if (this.activityHistory.length > 100) {
                this.activityHistory.shift();
            }
        }

        /**
         * Transition to a new state
         */
        transitionTo(newState, duration = null) {
            if (!ENERGY_STATES[newState]) return;
            if (newState === this.currentState && !this.isTransitioning) return;

            // Record current state dwell time
            this._recordStateDwell();

            // Setup transition
            this.fromState = this.currentState;
            this.targetState = newState;
            this.isTransitioning = true;
            this.transitionProgress = 0;
            this.transitionDuration = duration || this._calculateTransitionDuration();
            this.transitionStartTime = Date.now();

            // Record in history
            this.stateHistory.push({
                from: this.fromState,
                to: newState,
                timestamp: Date.now()
            });

            if (this.stateHistory.length > this.maxHistory) {
                this.stateHistory.shift();
            }
        }

        /**
         * Calculate transition duration based on state distance
         */
        _calculateTransitionDuration() {
            const fromLevel = ENERGY_STATES[this.fromState]?.level || 0;
            const toLevel = ENERGY_STATES[this.targetState]?.level || 0;
            const levelDiff = Math.abs(toLevel - fromLevel);

            const profile = ERA_PROFILES[this.currentEra];
            const baseSpeed = profile?.transitionSpeed || 0.5;

            // Longer transitions for bigger jumps
            return (2000 + levelDiff * 500) / baseSpeed;
        }

        /**
         * Record state dwell time
         */
        _recordStateDwell() {
            const dwellTime = (Date.now() - this.stateStartTime) / 1000;
            const prefs = this.statePreferences[this.currentState];
            if (prefs) {
                prefs.dwellTotal += dwellTime;
                prefs.visits++;
                prefs.avgDwell = prefs.dwellTotal / prefs.visits;
            }
        }

        /**
         * Update dynamics (called each frame/tick)
         */
        update(deltaTime = 16) {
            // Decay activity
            this.activityLevel *= this.activityDecay;

            // Update transition
            if (this.isTransitioning) {
                this._updateTransition(deltaTime);
            }

            // Apply zone influence
            this._applyZoneInfluence();

            // Auto-decision making
            if (this.autoTransition) {
                this._makeDecision();
            }

            // Notify changes
            if (this.onCharacteristicsChange) {
                this.onCharacteristicsChange(this.characteristics, this.agentIntensities);
            }
        }

        /**
         * Update transition progress
         */
        _updateTransition(deltaTime) {
            const elapsed = Date.now() - this.transitionStartTime;
            this.transitionProgress = Math.min(1, elapsed / this.transitionDuration);

            // Get curve function
            const curveFn = TRANSITION_CURVES[this.transitionCurve] || TRANSITION_CURVES.linear;
            const curvedProgress = curveFn(this.transitionProgress);

            // Interpolate characteristics
            const fromState = ENERGY_STATES[this.fromState];
            const toState = ENERGY_STATES[this.targetState];

            if (fromState && toState) {
                // Interpolate each characteristic
                for (const key of Object.keys(this.characteristics)) {
                    const fromVal = fromState.characteristics[key];
                    const toVal = toState.characteristics[key];
                    this.characteristics[key] = fromVal + (toVal - fromVal) * curvedProgress;
                }

                // Interpolate agent intensities
                for (const agent of Object.keys(this.agentIntensities)) {
                    const fromConfig = fromState.agentConfig[agent];
                    const toConfig = toState.agentConfig[agent];
                    if (fromConfig && toConfig) {
                        this.agentIntensities[agent] =
                            fromConfig.intensity + (toConfig.intensity - fromConfig.intensity) * curvedProgress;
                    }
                }
            }

            // Complete transition
            if (this.transitionProgress >= 1) {
                this.isTransitioning = false;
                this.currentState = this.targetState;
                this.stateStartTime = Date.now();

                // Trigger callback
                if (this.onStateChange) {
                    this.onStateChange(this.currentState, this.fromState);
                }
            }
        }

        /**
         * Apply zone influence to characteristics
         */
        _applyZoneInfluence() {
            const zoneMod = ZONE_DYNAMICS[this.currentZone];
            if (!zoneMod) return;

            const influence = this.zoneInfluence;

            // Apply energy bias
            const energyMod = zoneMod.energyBias * influence;
            this.characteristics.volume = Math.max(0, Math.min(1,
                this.characteristics.volume + energyMod * 0.1
            ));

            // Apply brightness boost
            const brightMod = zoneMod.brightnessBoost * influence;
            this.characteristics.brightness = Math.max(0, Math.min(1,
                this.characteristics.brightness + brightMod
            ));

            // Apply density modification
            const densityMod = zoneMod.densityMod * influence;
            this.characteristics.density = Math.max(0, Math.min(1,
                this.characteristics.density + densityMod
            ));
        }

        /**
         * Make automatic transition decision
         */
        _makeDecision() {
            const now = Date.now();
            if (now - this.lastDecision < this.decisionInterval) return;
            if (this.isTransitioning) return;

            this.lastDecision = now;

            const decision = this._evaluateTransition();
            if (decision.shouldTransition) {
                this.transitionTo(decision.targetState);
            }
        }

        /**
         * Evaluate whether to transition
         */
        _evaluateTransition() {
            const result = {
                shouldTransition: false,
                targetState: null,
                reason: ''
            };

            const currentStateConfig = ENERGY_STATES[this.currentState];
            if (!currentStateConfig) return result;

            const profile = ERA_PROFILES[this.currentEra];
            const dwellTime = (Date.now() - this.stateStartTime) / 1000;
            const [minDwell, maxDwell] = currentStateConfig.dwellRange;

            // Check if we've dwelled long enough
            if (dwellTime < minDwell) return result;

            // Probability increases with dwell time
            const dwellProbability = Math.min(1, (dwellTime - minDwell) / (maxDwell - minDwell));

            // Factor in activity level
            const activityFactor = this.activityLevel * 2;

            // Factor in era volatility
            const volatility = profile?.volatility || 0.3;

            // Overall transition probability
            const transitionProbability = dwellProbability * 0.5 + activityFactor * 0.3 + volatility * 0.2;

            if (Math.random() < transitionProbability) {
                result.shouldTransition = true;
                result.targetState = this._selectTargetState();
                result.reason = `Dwell: ${dwellTime.toFixed(1)}s, Activity: ${this.activityLevel.toFixed(2)}`;
            }

            return result;
        }

        /**
         * Select target state for transition
         */
        _selectTargetState() {
            const currentStateConfig = ENERGY_STATES[this.currentState];
            const profile = ERA_PROFILES[this.currentEra];

            // Get valid transitions
            let candidates = currentStateConfig.transitions.filter(state => {
                // Check era max energy
                const stateLevel = ENERGY_STATES[state]?.level || 0;
                const maxLevel = ENERGY_STATES[profile?.maxEnergy]?.level || 10;
                return stateLevel <= maxLevel;
            });

            // If no valid candidates, stay in current state
            if (candidates.length === 0) {
                candidates = [this.currentState];
            }

            // Weight by preferences and activity
            const weights = candidates.map(state => {
                let weight = this.statePreferences[state]?.weight || 1;

                // Prefer higher energy states with more activity
                const stateLevel = ENERGY_STATES[state]?.level || 0;
                const currentLevel = ENERGY_STATES[this.currentState]?.level || 0;

                if (this.activityLevel > 0.5 && stateLevel > currentLevel) {
                    weight *= 1.5;
                } else if (this.activityLevel < 0.2 && stateLevel < currentLevel) {
                    weight *= 1.3;
                }

                // Prefer era-appropriate states
                if (profile?.preferredStates.includes(state)) {
                    weight *= 1.4;
                }

                return weight;
            });

            // Weighted random selection
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalWeight;

            for (let i = 0; i < candidates.length; i++) {
                random -= weights[i];
                if (random <= 0) return candidates[i];
            }

            return candidates[0];
        }

        /**
         * Get current state configuration
         */
        getCurrentStateConfig() {
            return ENERGY_STATES[this.currentState];
        }

        /**
         * Get agent configuration for current state
         */
        getAgentConfig() {
            const stateConfig = ENERGY_STATES[this.currentState];
            if (!stateConfig) return null;

            return {
                ...stateConfig.agentConfig,
                interpolated: this.agentIntensities
            };
        }

        /**
         * Get current characteristics
         */
        getCharacteristics() {
            return { ...this.characteristics };
        }

        /**
         * Perceive current state for AI
         */
        perceive() {
            return {
                era: this.currentEra,
                state: this.currentState,
                targetState: this.targetState,
                isTransitioning: this.isTransitioning,
                transitionProgress: this.transitionProgress,
                characteristics: { ...this.characteristics },
                agentIntensities: { ...this.agentIntensities },
                zone: this.currentZone,
                activityLevel: this.activityLevel,
                dwellTime: (Date.now() - this.stateStartTime) / 1000,
                stateLevel: ENERGY_STATES[this.currentState]?.level || 0
            };
        }

        /**
         * Force immediate state (no transition)
         */
        forceState(state) {
            if (!ENERGY_STATES[state]) return;

            this._recordStateDwell();
            this.currentState = state;
            this.targetState = state;
            this.isTransitioning = false;
            this.stateStartTime = Date.now();

            // Apply characteristics immediately
            const stateConfig = ENERGY_STATES[state];
            this.characteristics = { ...stateConfig.characteristics };

            for (const agent of Object.keys(this.agentIntensities)) {
                this.agentIntensities[agent] = stateConfig.agentConfig[agent]?.intensity || 0;
            }

            if (this.onStateChange) {
                this.onStateChange(state, this.fromState);
            }
        }

        /**
         * Set transition curve type
         */
        setTransitionCurve(curve) {
            if (TRANSITION_CURVES[curve]) {
                this.transitionCurve = curve;
            }
        }

        /**
         * Set zone influence amount
         */
        setZoneInfluence(amount) {
            this.zoneInfluence = Math.max(0, Math.min(1, amount));
        }

        /**
         * Enable/disable auto transitions
         */
        setAutoTransition(enabled) {
            this.autoTransition = enabled;
        }

        /**
         * Get available states
         */
        getAvailableStates() {
            return Object.keys(ENERGY_STATES);
        }

        /**
         * Get valid transitions from current state
         */
        getValidTransitions() {
            const currentConfig = ENERGY_STATES[this.currentState];
            const profile = ERA_PROFILES[this.currentEra];

            if (!currentConfig) return [];

            return currentConfig.transitions.filter(state => {
                const stateLevel = ENERGY_STATES[state]?.level || 0;
                const maxLevel = ENERGY_STATES[profile?.maxEnergy]?.level || 10;
                return stateLevel <= maxLevel;
            });
        }

        /**
         * Get energy level (0-1 normalized)
         */
        getEnergyLevel() {
            const level = ENERGY_STATES[this.currentState]?.level || 0;
            const maxLevel = 8;
            return level / maxLevel;
        }

        /**
         * Nudge energy up or down
         */
        nudgeEnergy(direction) {
            const currentLevel = ENERGY_STATES[this.currentState]?.level || 0;
            let targetLevel = currentLevel + (direction > 0 ? 1 : -1);
            targetLevel = Math.max(0, Math.min(8, targetLevel));

            // Find state with target level
            for (const [state, config] of Object.entries(ENERGY_STATES)) {
                if (config.level === targetLevel) {
                    const validTransitions = this.getValidTransitions();
                    if (validTransitions.includes(state)) {
                        this.transitionTo(state);
                        return state;
                    }
                }
            }

            return null;
        }

        /**
         * Build toward climax
         */
        buildToClimax(duration = 30000) {
            const buildStates = ['contemplative', 'flowing', 'building', 'intensifying', 'climactic'];
            const currentLevel = ENERGY_STATES[this.currentState]?.level || 0;

            let stateIndex = buildStates.findIndex(s =>
                (ENERGY_STATES[s]?.level || 0) > currentLevel
            );

            if (stateIndex === -1) return;

            const stepDuration = duration / (buildStates.length - stateIndex);

            const buildStep = () => {
                if (stateIndex >= buildStates.length) return;

                this.transitionTo(buildStates[stateIndex], stepDuration * 0.8);
                stateIndex++;

                if (stateIndex < buildStates.length) {
                    setTimeout(buildStep, stepDuration);
                }
            };

            buildStep();
        }

        /**
         * Gradually release energy
         */
        releaseEnergy(duration = 20000) {
            const releaseStates = ['releasing', 'dissolving', 'ambient', 'dormant'];
            let stateIndex = 0;
            const stepDuration = duration / releaseStates.length;

            const releaseStep = () => {
                if (stateIndex >= releaseStates.length) return;

                this.transitionTo(releaseStates[stateIndex], stepDuration * 0.8);
                stateIndex++;

                if (stateIndex < releaseStates.length) {
                    setTimeout(releaseStep, stepDuration);
                }
            };

            releaseStep();
        }

        /**
         * Reset to default state for era
         */
        reset() {
            const profile = ERA_PROFILES[this.currentEra];
            const defaultState = profile?.defaultState || 'ambient';
            this.forceState(defaultState);
            this.activityLevel = 0;
            this.activityHistory = [];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    // Create singleton instance
    const instance = new DynamicsMindAgent();

    // Register with agent factory if available
    if (typeof AgentFactory !== 'undefined') {
        AgentFactory.register('dynamics-mind', () => instance);
    }

    return {
        // Instance access
        instance,

        // Configuration access
        ENERGY_STATES,
        TRANSITION_CURVES,
        ERA_PROFILES,
        ZONE_DYNAMICS,

        // Methods
        setEra: (era) => instance.setEra(era),
        updateZone: (zone) => instance.updateZone(zone),
        registerActivity: (intensity) => instance.registerActivity(intensity),
        transitionTo: (state, duration) => instance.transitionTo(state, duration),
        update: (dt) => instance.update(dt),
        getCurrentStateConfig: () => instance.getCurrentStateConfig(),
        getAgentConfig: () => instance.getAgentConfig(),
        getCharacteristics: () => instance.getCharacteristics(),
        perceive: () => instance.perceive(),
        forceState: (state) => instance.forceState(state),
        setTransitionCurve: (curve) => instance.setTransitionCurve(curve),
        setZoneInfluence: (amount) => instance.setZoneInfluence(amount),
        setAutoTransition: (enabled) => instance.setAutoTransition(enabled),
        getAvailableStates: () => instance.getAvailableStates(),
        getValidTransitions: () => instance.getValidTransitions(),
        getEnergyLevel: () => instance.getEnergyLevel(),
        nudgeEnergy: (direction) => instance.nudgeEnergy(direction),
        buildToClimax: (duration) => instance.buildToClimax(duration),
        releaseEnergy: (duration) => instance.releaseEnergy(duration),
        reset: () => instance.reset(),

        // Callbacks
        onStateChange: (cb) => { instance.onStateChange = cb; },
        onCharacteristicsChange: (cb) => { instance.onCharacteristicsChange = cb; }
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicsMind;
}
