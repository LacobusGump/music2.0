/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - AGENT BASE CLASS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Foundation for all AI agents in the GUMP system.
 * Provides common functionality for perception, decision-making, and action.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpAgentBase = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT REGISTRY
    // ═══════════════════════════════════════════════════════════════════════

    const registry = new Map();
    let globalConfig = {
        updateRate: 50,      // ms between agent updates
        historyLength: 100,  // Number of state snapshots to keep
        learningRate: 0.1,   // How fast agents adapt
        explorationRate: 0.1 // Chance to try random actions
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BASE AGENT CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class Agent {
        /**
         * Create a new agent
         * @param {string} id - Unique identifier
         * @param {string} type - Agent type (drum, bass, harmony, etc.)
         * @param {Object} config - Configuration options
         */
        constructor(id, type, config = {}) {
            this.id = id;
            this.type = type;
            this.config = { ...this._getDefaultConfig(), ...config };

            // State
            this.state = {
                active: false,
                energy: 0.5,       // 0-1, current activity level
                mood: 'neutral',   // Current emotional state
                focus: 0.5,        // 0-1, how focused on task
                creativity: 0.5,  // 0-1, tendency to experiment
                confidence: 0.5   // 0-1, certainty in decisions
            };

            // Memory systems
            this.memory = {
                shortTerm: [],      // Recent observations
                workingMemory: {},  // Current task context
                patterns: new Map(), // Learned patterns
                preferences: new Map() // What works well
            };

            // Perception buffer
            this.perceptions = {
                current: {},
                previous: {},
                changes: []
            };

            // Action queue
            this.actionQueue = [];
            this.lastAction = null;
            this.actionHistory = [];

            // Learning state
            this.learning = {
                enabled: true,
                experiences: [],
                rewards: [],
                avgReward: 0
            };

            // Communication
            this.inbox = [];
            this.outbox = [];
            this.subscriptions = new Set();

            // Timing
            this.updateInterval = null;
            this.lastUpdate = 0;
            this.tickCount = 0;

            // Callbacks
            this.onStateChange = null;
            this.onAction = null;
            this.onMessage = null;
        }

        _getDefaultConfig() {
            return {
                updateRate: globalConfig.updateRate,
                historyLength: globalConfig.historyLength,
                learningRate: globalConfig.learningRate,
                explorationRate: globalConfig.explorationRate,
                energyDecay: 0.01,
                focusDecay: 0.005,
                reactionTime: 50,  // ms
                planningHorizon: 8, // beats ahead
                maxActions: 10,     // per update
                verbose: false
            };
        }

        // ═══════════════════════════════════════════════════════════════════
        // LIFECYCLE
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Start the agent
         */
        start() {
            if (this.state.active) return;

            this.state.active = true;
            this.lastUpdate = performance.now();

            this.updateInterval = setInterval(() => {
                this._update();
            }, this.config.updateRate);

            this._onStart();
            this.log('Started');
        }

        /**
         * Stop the agent
         */
        stop() {
            if (!this.state.active) return;

            this.state.active = false;

            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            this._onStop();
            this.log('Stopped');
        }

        /**
         * Pause agent without full stop
         */
        pause() {
            this.state.paused = true;
            this.log('Paused');
        }

        /**
         * Resume from pause
         */
        resume() {
            this.state.paused = false;
            this.lastUpdate = performance.now();
            this.log('Resumed');
        }

        /**
         * Main update loop
         */
        _update() {
            if (!this.state.active || this.state.paused) return;

            const now = performance.now();
            const dt = now - this.lastUpdate;
            this.lastUpdate = now;
            this.tickCount++;

            try {
                // 1. Perceive
                this._perceive();

                // 2. Process messages
                this._processMessages();

                // 3. Think/Decide
                const decisions = this._think(dt);

                // 4. Act
                this._act(decisions);

                // 5. Learn
                if (this.learning.enabled) {
                    this._learn();
                }

                // 6. Decay states
                this._decay(dt);

                // 7. Custom update
                this._onUpdate(dt);

            } catch (error) {
                console.error(`[Agent:${this.id}] Update error:`, error);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // PERCEPTION
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Perceive the environment - override in subclass
         */
        _perceive() {
            // Store previous perceptions
            this.perceptions.previous = { ...this.perceptions.current };
            this.perceptions.changes = [];

            // Get new perceptions from environment
            const newPerceptions = this.perceive();
            this.perceptions.current = newPerceptions;

            // Detect changes
            for (const key in newPerceptions) {
                if (this.perceptions.previous[key] !== newPerceptions[key]) {
                    this.perceptions.changes.push({
                        key,
                        from: this.perceptions.previous[key],
                        to: newPerceptions[key]
                    });
                }
            }

            // Add to short-term memory
            this.memory.shortTerm.push({
                time: performance.now(),
                perceptions: { ...newPerceptions },
                changes: [...this.perceptions.changes]
            });

            // Trim memory
            while (this.memory.shortTerm.length > this.config.historyLength) {
                this.memory.shortTerm.shift();
            }
        }

        /**
         * Override this to define what the agent perceives
         * @returns {Object} Current perceptions
         */
        perceive() {
            return {};
        }

        /**
         * Get perception value with optional default
         */
        getPerception(key, defaultValue = null) {
            return this.perceptions.current[key] ?? defaultValue;
        }

        /**
         * Check if a perception changed this tick
         */
        hasChanged(key) {
            return this.perceptions.changes.some(c => c.key === key);
        }

        /**
         * Get the change for a perception
         */
        getChange(key) {
            return this.perceptions.changes.find(c => c.key === key);
        }

        // ═══════════════════════════════════════════════════════════════════
        // THINKING / DECISION MAKING
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Main thinking process
         */
        _think(dt) {
            // Get possible actions
            const possibleActions = this.getPossibleActions();

            if (possibleActions.length === 0) {
                return [];
            }

            // Evaluate each action
            const evaluatedActions = possibleActions.map(action => ({
                action,
                score: this.evaluateAction(action),
                random: Math.random()
            }));

            // Sort by score
            evaluatedActions.sort((a, b) => b.score - a.score);

            // Exploration vs exploitation
            let selectedActions = [];

            if (Math.random() < this.config.explorationRate * (1 - this.state.confidence)) {
                // Explore: pick random action
                const randomIdx = Math.floor(Math.random() * evaluatedActions.length);
                selectedActions = [evaluatedActions[randomIdx].action];
                this.log('Exploring:', selectedActions[0].type);
            } else {
                // Exploit: pick best actions
                const threshold = evaluatedActions[0].score * 0.7;
                selectedActions = evaluatedActions
                    .filter(e => e.score >= threshold)
                    .slice(0, this.config.maxActions)
                    .map(e => e.action);
            }

            // Let subclass refine decisions
            return this.think(selectedActions, dt);
        }

        /**
         * Override this to return possible actions
         * @returns {Array} List of possible actions
         */
        getPossibleActions() {
            return [];
        }

        /**
         * Override this to evaluate an action's value
         * @param {Object} action - Action to evaluate
         * @returns {number} Score from 0-1
         */
        evaluateAction(action) {
            return 0.5;
        }

        /**
         * Override this to refine action selection
         * @param {Array} selectedActions - Pre-selected actions
         * @param {number} dt - Time delta
         * @returns {Array} Final actions to take
         */
        think(selectedActions, dt) {
            return selectedActions;
        }

        // ═══════════════════════════════════════════════════════════════════
        // ACTION
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Execute actions
         */
        _act(actions) {
            if (!actions || actions.length === 0) return;

            for (const action of actions) {
                try {
                    // Execute the action
                    const result = this.executeAction(action);

                    // Record
                    this.lastAction = {
                        action,
                        result,
                        time: performance.now()
                    };

                    this.actionHistory.push(this.lastAction);

                    // Trim history
                    while (this.actionHistory.length > this.config.historyLength) {
                        this.actionHistory.shift();
                    }

                    // Callback
                    if (this.onAction) {
                        this.onAction(action, result);
                    }

                    // Emit event
                    this.emit('action', { action, result });

                } catch (error) {
                    console.error(`[Agent:${this.id}] Action error:`, error);
                }
            }
        }

        /**
         * Override this to execute an action
         * @param {Object} action - Action to execute
         * @returns {*} Result of the action
         */
        executeAction(action) {
            return null;
        }

        /**
         * Queue an action for later execution
         */
        queueAction(action, delay = 0) {
            if (delay > 0) {
                setTimeout(() => {
                    this.actionQueue.push(action);
                }, delay);
            } else {
                this.actionQueue.push(action);
            }
        }

        /**
         * Clear the action queue
         */
        clearActionQueue() {
            this.actionQueue = [];
        }

        // ═══════════════════════════════════════════════════════════════════
        // LEARNING
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Learning update
         */
        _learn() {
            // Record experience if we took action
            if (this.lastAction) {
                const reward = this.calculateReward();
                this.learning.rewards.push(reward);

                // Update running average
                const alpha = this.config.learningRate;
                this.learning.avgReward = (1 - alpha) * this.learning.avgReward + alpha * reward;

                // Record experience
                this.learning.experiences.push({
                    perceptions: { ...this.perceptions.previous },
                    action: this.lastAction.action,
                    result: this.lastAction.result,
                    reward,
                    nextPerceptions: { ...this.perceptions.current }
                });

                // Trim experiences
                while (this.learning.experiences.length > this.config.historyLength * 2) {
                    this.learning.experiences.shift();
                }

                // Update patterns and preferences
                this.updatePatterns();
                this.updatePreferences();

                // Adjust exploration based on learning
                if (this.learning.avgReward > 0.7) {
                    // Doing well, reduce exploration
                    this.state.confidence = Math.min(1, this.state.confidence + 0.01);
                } else if (this.learning.avgReward < 0.3) {
                    // Not doing well, increase exploration
                    this.state.confidence = Math.max(0, this.state.confidence - 0.02);
                }

                // Custom learning
                this.learn(reward);
            }
        }

        /**
         * Override this to calculate reward for last action
         * @returns {number} Reward from 0-1
         */
        calculateReward() {
            return 0.5;
        }

        /**
         * Override this for custom learning logic
         * @param {number} reward - Current reward
         */
        learn(reward) {}

        /**
         * Update learned patterns
         */
        updatePatterns() {
            // Extract patterns from recent experiences
            if (this.learning.experiences.length < 5) return;

            const recent = this.learning.experiences.slice(-10);

            // Look for action sequences that led to high rewards
            for (let i = 0; i < recent.length - 1; i++) {
                const exp = recent[i];
                const nextExp = recent[i + 1];

                if (exp.reward > 0.7) {
                    const pattern = {
                        context: this._hashPerceptions(exp.perceptions),
                        action: exp.action.type,
                        outcome: exp.reward
                    };

                    const key = `${pattern.context}:${pattern.action}`;
                    const existing = this.memory.patterns.get(key);

                    if (existing) {
                        existing.count++;
                        existing.avgReward = (existing.avgReward * (existing.count - 1) + exp.reward) / existing.count;
                    } else {
                        this.memory.patterns.set(key, {
                            ...pattern,
                            count: 1,
                            avgReward: exp.reward
                        });
                    }
                }
            }
        }

        /**
         * Update action preferences
         */
        updatePreferences() {
            if (this.learning.experiences.length < 3) return;

            const recent = this.learning.experiences.slice(-20);

            // Calculate average reward per action type
            const actionRewards = new Map();

            for (const exp of recent) {
                const type = exp.action.type;
                const existing = actionRewards.get(type) || { total: 0, count: 0 };
                existing.total += exp.reward;
                existing.count++;
                actionRewards.set(type, existing);
            }

            // Update preferences
            for (const [type, data] of actionRewards) {
                const avgReward = data.total / data.count;
                const existing = this.memory.preferences.get(type) || 0.5;

                // Smoothly update preference
                const newPref = existing * 0.8 + avgReward * 0.2;
                this.memory.preferences.set(type, newPref);
            }
        }

        /**
         * Hash perceptions for pattern matching
         */
        _hashPerceptions(perceptions) {
            const keys = Object.keys(perceptions).sort();
            const values = keys.map(k => {
                const v = perceptions[k];
                if (typeof v === 'number') {
                    return Math.round(v * 10) / 10;
                }
                return v;
            });
            return keys.map((k, i) => `${k}:${values[i]}`).join('|');
        }

        /**
         * Get preference for an action type
         */
        getPreference(actionType) {
            return this.memory.preferences.get(actionType) || 0.5;
        }

        /**
         * Check if a pattern matches current context
         */
        matchPattern(actionType) {
            const contextHash = this._hashPerceptions(this.perceptions.current);
            const key = `${contextHash}:${actionType}`;
            return this.memory.patterns.get(key);
        }

        // ═══════════════════════════════════════════════════════════════════
        // STATE MANAGEMENT
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Decay states over time
         */
        _decay(dt) {
            const seconds = dt / 1000;

            // Energy decay
            this.state.energy = Math.max(0, this.state.energy - this.config.energyDecay * seconds);

            // Focus decay
            this.state.focus = Math.max(0, this.state.focus - this.config.focusDecay * seconds);
        }

        /**
         * Set agent energy level
         */
        setEnergy(value) {
            this.state.energy = Math.max(0, Math.min(1, value));
            this.emit('state.energy', this.state.energy);
        }

        /**
         * Set agent mood
         */
        setMood(mood) {
            const prevMood = this.state.mood;
            this.state.mood = mood;
            if (prevMood !== mood) {
                this.emit('state.mood', { from: prevMood, to: mood });
            }
        }

        /**
         * Set agent focus
         */
        setFocus(value) {
            this.state.focus = Math.max(0, Math.min(1, value));
            this.emit('state.focus', this.state.focus);
        }

        /**
         * Set creativity level
         */
        setCreativity(value) {
            this.state.creativity = Math.max(0, Math.min(1, value));
        }

        /**
         * Boost energy
         */
        boost(amount = 0.2) {
            this.state.energy = Math.min(1, this.state.energy + amount);
        }

        // ═══════════════════════════════════════════════════════════════════
        // COMMUNICATION
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Process incoming messages
         */
        _processMessages() {
            while (this.inbox.length > 0) {
                const message = this.inbox.shift();

                try {
                    this.handleMessage(message);

                    if (this.onMessage) {
                        this.onMessage(message);
                    }
                } catch (error) {
                    console.error(`[Agent:${this.id}] Message error:`, error);
                }
            }
        }

        /**
         * Override this to handle messages
         * @param {Object} message - Incoming message
         */
        handleMessage(message) {}

        /**
         * Send a message to another agent
         */
        sendMessage(targetId, type, data) {
            const message = {
                from: this.id,
                to: targetId,
                type,
                data,
                time: performance.now()
            };

            this.outbox.push(message);

            // Deliver via registry
            const target = registry.get(targetId);
            if (target) {
                target.inbox.push(message);
            }
        }

        /**
         * Broadcast a message to all agents
         */
        broadcast(type, data) {
            for (const [id, agent] of registry) {
                if (id !== this.id) {
                    this.sendMessage(id, type, data);
                }
            }
        }

        /**
         * Subscribe to a topic
         */
        subscribe(topic) {
            this.subscriptions.add(topic);
        }

        /**
         * Unsubscribe from a topic
         */
        unsubscribe(topic) {
            this.subscriptions.delete(topic);
        }

        // ═══════════════════════════════════════════════════════════════════
        // EVENTS
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Emit an event
         */
        emit(type, data) {
            if (typeof GumpEvents !== 'undefined') {
                GumpEvents.emit(`agent.${this.id}.${type}`, data);
                GumpEvents.emit(`agent.*.${type}`, { agentId: this.id, ...data });
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // WORKING MEMORY
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Store value in working memory
         */
        remember(key, value) {
            this.memory.workingMemory[key] = value;
        }

        /**
         * Get value from working memory
         */
        recall(key, defaultValue = null) {
            return this.memory.workingMemory[key] ?? defaultValue;
        }

        /**
         * Forget a value
         */
        forget(key) {
            delete this.memory.workingMemory[key];
        }

        /**
         * Clear working memory
         */
        clearMemory() {
            this.memory.workingMemory = {};
        }

        // ═══════════════════════════════════════════════════════════════════
        // UTILITIES
        // ═══════════════════════════════════════════════════════════════════

        /**
         * Log a message
         */
        log(...args) {
            if (this.config.verbose) {
                console.log(`[Agent:${this.id}]`, ...args);
            }
        }

        /**
         * Get agent status
         */
        getStatus() {
            return {
                id: this.id,
                type: this.type,
                active: this.state.active,
                paused: this.state.paused,
                state: { ...this.state },
                tickCount: this.tickCount,
                actionCount: this.actionHistory.length,
                avgReward: this.learning.avgReward,
                patternCount: this.memory.patterns.size,
                preferenceCount: this.memory.preferences.size
            };
        }

        /**
         * Export agent state for persistence
         */
        export() {
            return {
                id: this.id,
                type: this.type,
                config: this.config,
                state: this.state,
                memory: {
                    patterns: Array.from(this.memory.patterns.entries()),
                    preferences: Array.from(this.memory.preferences.entries())
                },
                learning: {
                    avgReward: this.learning.avgReward
                }
            };
        }

        /**
         * Import agent state
         */
        import(data) {
            if (data.config) {
                this.config = { ...this.config, ...data.config };
            }

            if (data.state) {
                this.state = { ...this.state, ...data.state };
            }

            if (data.memory) {
                if (data.memory.patterns) {
                    this.memory.patterns = new Map(data.memory.patterns);
                }
                if (data.memory.preferences) {
                    this.memory.preferences = new Map(data.memory.preferences);
                }
            }

            if (data.learning) {
                this.learning.avgReward = data.learning.avgReward || 0.5;
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // LIFECYCLE HOOKS - Override these
        // ═══════════════════════════════════════════════════════════════════

        _onStart() {}
        _onStop() {}
        _onUpdate(dt) {}
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REGISTRY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function registerAgent(agent) {
        registry.set(agent.id, agent);
        console.log(`[AgentRegistry] Registered: ${agent.id}`);
    }

    function unregisterAgent(id) {
        const agent = registry.get(id);
        if (agent) {
            agent.stop();
            registry.delete(id);
            console.log(`[AgentRegistry] Unregistered: ${id}`);
        }
    }

    function getAgent(id) {
        return registry.get(id);
    }

    function getAllAgents() {
        return Array.from(registry.values());
    }

    function getAgentsByType(type) {
        return Array.from(registry.values()).filter(a => a.type === type);
    }

    function startAllAgents() {
        for (const agent of registry.values()) {
            agent.start();
        }
    }

    function stopAllAgents() {
        for (const agent of registry.values()) {
            agent.stop();
        }
    }

    function pauseAllAgents() {
        for (const agent of registry.values()) {
            agent.pause();
        }
    }

    function resumeAllAgents() {
        for (const agent of registry.values()) {
            agent.resume();
        }
    }

    function setGlobalConfig(config) {
        globalConfig = { ...globalConfig, ...config };
    }

    function getGlobalConfig() {
        return { ...globalConfig };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AGENT FACTORY
    // ═══════════════════════════════════════════════════════════════════════

    const agentTypes = new Map();

    function registerAgentType(type, AgentClass) {
        agentTypes.set(type, AgentClass);
    }

    function createAgent(type, id, config = {}) {
        const AgentClass = agentTypes.get(type);
        if (!AgentClass) {
            console.warn(`[AgentFactory] Unknown agent type: ${type}`);
            return null;
        }

        const agent = new AgentClass(id, config);
        registerAgent(agent);
        return agent;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // Base class
        Agent,

        // Registry
        registerAgent,
        unregisterAgent,
        getAgent,
        getAllAgents,
        getAgentsByType,
        startAllAgents,
        stopAllAgents,
        pauseAllAgents,
        resumeAllAgents,

        // Factory
        registerAgentType,
        createAgent,

        // Config
        setGlobalConfig,
        getGlobalConfig,

        // Direct registry access
        registry
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpAgentBase;
}
