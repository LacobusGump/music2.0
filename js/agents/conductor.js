/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - CONDUCTOR AGENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The meta-agent that coordinates all musical agents.
 * Manages the overall musical direction, transitions, and agent orchestration.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpConductor = (function() {
    'use strict';

    // Ensure base agent is loaded
    if (typeof GumpAgentBase === 'undefined') {
        console.error('[GumpConductor] GumpAgentBase not found');
        return {};
    }

    const { Agent, registerAgentType, registerAgent } = GumpAgentBase;

    // ═══════════════════════════════════════════════════════════════════════
    // MUSICAL STRUCTURES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Musical form templates - high-level song structures
     */
    const MUSICAL_FORMS = {
        ambient: {
            name: 'Ambient',
            sections: ['intro', 'body', 'body', 'body', 'outro'],
            sectionLengths: { intro: 16, body: 32, outro: 16 },
            dynamics: { intro: 0.3, body: 0.5, outro: 0.2 },
            transitions: 'smooth'
        },
        buildUp: {
            name: 'Build Up',
            sections: ['intro', 'build', 'build', 'peak', 'release'],
            sectionLengths: { intro: 8, build: 16, peak: 8, release: 16 },
            dynamics: { intro: 0.2, build: 0.5, peak: 1.0, release: 0.3 },
            transitions: 'gradual'
        },
        cyclical: {
            name: 'Cyclical',
            sections: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'],
            sectionLengths: { verse: 16, chorus: 16, bridge: 8 },
            dynamics: { verse: 0.5, chorus: 0.8, bridge: 0.6 },
            transitions: 'cut'
        },
        meditation: {
            name: 'Meditation',
            sections: ['arrival', 'settling', 'depth', 'depth', 'emergence'],
            sectionLengths: { arrival: 24, settling: 32, depth: 48, emergence: 24 },
            dynamics: { arrival: 0.4, settling: 0.3, depth: 0.5, emergence: 0.3 },
            transitions: 'smooth'
        },
        journey: {
            name: 'Journey',
            sections: ['departure', 'path', 'obstacle', 'breakthrough', 'arrival'],
            sectionLengths: { departure: 16, path: 32, obstacle: 16, breakthrough: 8, arrival: 24 },
            dynamics: { departure: 0.4, path: 0.6, obstacle: 0.8, breakthrough: 1.0, arrival: 0.5 },
            transitions: 'dramatic'
        },
        ritual: {
            name: 'Ritual',
            sections: ['gathering', 'invocation', 'trance', 'trance', 'peak', 'resolution'],
            sectionLengths: { gathering: 16, invocation: 16, trance: 32, peak: 16, resolution: 16 },
            dynamics: { gathering: 0.3, invocation: 0.5, trance: 0.7, peak: 1.0, resolution: 0.4 },
            transitions: 'gradual'
        }
    };

    /**
     * Mood definitions - emotional states for the music
     */
    const MOODS = {
        // Peaceful states
        serene: {
            tempo: 0.4,      // Slow
            energy: 0.3,
            complexity: 0.3,
            brightness: 0.5,
            tension: 0.1,
            agents: {
                drums: { active: false },
                bass: { active: true, type: 'sub' },
                harmony: { active: true, type: 'pad' },
                melody: { active: true, type: 'ethereal' }
            }
        },
        contemplative: {
            tempo: 0.35,
            energy: 0.25,
            complexity: 0.4,
            brightness: 0.4,
            tension: 0.2,
            agents: {
                drums: { active: false },
                bass: { active: true, type: 'drone' },
                harmony: { active: true, type: 'sustained' },
                melody: { active: true, type: 'sparse' }
            }
        },
        mystical: {
            tempo: 0.45,
            energy: 0.4,
            complexity: 0.5,
            brightness: 0.6,
            tension: 0.3,
            agents: {
                drums: { active: true, type: 'subtle' },
                bass: { active: true, type: 'resonant' },
                harmony: { active: true, type: 'open' },
                melody: { active: true, type: 'ornamental' }
            }
        },

        // Active states
        flowing: {
            tempo: 0.5,
            energy: 0.5,
            complexity: 0.5,
            brightness: 0.6,
            tension: 0.3,
            agents: {
                drums: { active: true, type: 'groove' },
                bass: { active: true, type: 'walking' },
                harmony: { active: true, type: 'moving' },
                melody: { active: true, type: 'lyrical' }
            }
        },
        energetic: {
            tempo: 0.7,
            energy: 0.8,
            complexity: 0.6,
            brightness: 0.7,
            tension: 0.5,
            agents: {
                drums: { active: true, type: 'driving' },
                bass: { active: true, type: 'punchy' },
                harmony: { active: true, type: 'rhythmic' },
                melody: { active: true, type: 'aggressive' }
            }
        },
        ecstatic: {
            tempo: 0.85,
            energy: 1.0,
            complexity: 0.7,
            brightness: 0.9,
            tension: 0.6,
            agents: {
                drums: { active: true, type: 'intense' },
                bass: { active: true, type: '808_deep' },
                harmony: { active: true, type: 'euphoric' },
                melody: { active: true, type: 'soaring' }
            }
        },

        // Dark states
        somber: {
            tempo: 0.35,
            energy: 0.3,
            complexity: 0.4,
            brightness: 0.3,
            tension: 0.4,
            agents: {
                drums: { active: false },
                bass: { active: true, type: 'low' },
                harmony: { active: true, type: 'minor' },
                melody: { active: true, type: 'melancholic' }
            }
        },
        ominous: {
            tempo: 0.4,
            energy: 0.5,
            complexity: 0.5,
            brightness: 0.2,
            tension: 0.7,
            agents: {
                drums: { active: true, type: 'sparse' },
                bass: { active: true, type: 'rumble' },
                harmony: { active: true, type: 'dissonant' },
                melody: { active: false }
            }
        },
        intense: {
            tempo: 0.65,
            energy: 0.9,
            complexity: 0.8,
            brightness: 0.5,
            tension: 0.9,
            agents: {
                drums: { active: true, type: 'aggressive' },
                bass: { active: true, type: 'distorted' },
                harmony: { active: true, type: 'dense' },
                melody: { active: true, type: 'angular' }
            }
        },

        // Transitional
        building: {
            tempo: 0.55,
            energy: 0.6,
            complexity: 0.5,
            brightness: 0.6,
            tension: 0.5,
            agents: {
                drums: { active: true, type: 'building' },
                bass: { active: true, type: 'ascending' },
                harmony: { active: true, type: 'layering' },
                melody: { active: true, type: 'rising' }
            }
        },
        releasing: {
            tempo: 0.5,
            energy: 0.4,
            complexity: 0.4,
            brightness: 0.5,
            tension: 0.2,
            agents: {
                drums: { active: true, type: 'unwinding' },
                bass: { active: true, type: 'descending' },
                harmony: { active: true, type: 'resolving' },
                melody: { active: true, type: 'settling' }
            }
        }
    };

    /**
     * Transition types
     */
    const TRANSITIONS = {
        cut: {
            duration: 0,
            method: 'immediate'
        },
        smooth: {
            duration: 8,  // beats
            method: 'crossfade'
        },
        gradual: {
            duration: 16,
            method: 'morph'
        },
        dramatic: {
            duration: 4,
            method: 'break-drop'
        },
        filter: {
            duration: 8,
            method: 'filter-sweep'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CONDUCTOR AGENT CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class ConductorAgent extends Agent {
        constructor(id = 'conductor', config = {}) {
            super(id, 'conductor', {
                updateRate: 100,  // Slower updates, strategic level
                ...config
            });

            // Musical state
            this.musicalState = {
                form: null,
                currentSection: 0,
                currentSectionName: 'intro',
                sectionBeat: 0,
                totalBeats: 0,
                mood: 'serene',
                targetMood: null,
                moodTransition: null,
                dynamics: 0.5,
                targetDynamics: 0.5,
                tension: 0,
                release: 0
            };

            // Timing
            this.timing = {
                bpm: 90,
                beatsPerMeasure: 4,
                currentBeat: 0,
                lastBeatTime: 0
            };

            // Agent coordination
            this.managedAgents = new Map();
            this.agentInstructions = new Map();

            // Event tracking
            this.significantEvents = [];
            this.userActivity = {
                zones: new Map(),
                patterns: [],
                lastZone: null,
                lastPattern: null,
                activityLevel: 0.5
            };

            // Planned actions
            this.plannedTransitions = [];
            this.pendingInstructions = [];
        }

        // ═══════════════════════════════════════════════════════════════════
        // LIFECYCLE
        // ═══════════════════════════════════════════════════════════════════

        _onStart() {
            // Subscribe to relevant events
            if (typeof GumpEvents !== 'undefined') {
                GumpEvents.on('beat', (data) => this.onBeat(data));
                GumpEvents.on('zone.enter', (data) => this.onZoneEnter(data));
                GumpEvents.on('zone.dwell', (data) => this.onZoneDwell(data));
                GumpEvents.on('pattern.detected', (data) => this.onPattern(data));
                GumpEvents.on('unlock.complete', (data) => this.onUnlock(data));
                GumpEvents.on('era.change', (data) => this.onEraChange(data));
            }

            // Initialize musical form
            this.setForm('ambient');

            // Set initial mood based on era
            const era = GumpState?.get('era.current') || 'genesis';
            this.setMoodForEra(era);
        }

        _onStop() {
            // Release all agents
            for (const [id, agent] of this.managedAgents) {
                this.releaseAgent(id);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // PERCEPTION
        // ═══════════════════════════════════════════════════════════════════

        perceive() {
            const perceptions = {};

            // Get global state
            if (typeof GumpState !== 'undefined') {
                perceptions.era = GumpState.get('era.current') || 'genesis';
                perceptions.zone = GumpState.get('grid.currentZone') || 'center';
                perceptions.bpm = GumpState.get('music.bpm') || 90;
                perceptions.energy = GumpState.get('music.energy') || 0.5;
            }

            // Calculate user activity level
            perceptions.userActivity = this.calculateActivityLevel();

            // Get agent states
            perceptions.agentStates = this.getAgentStates();

            // Current musical state
            perceptions.mood = this.musicalState.mood;
            perceptions.section = this.musicalState.currentSectionName;
            perceptions.dynamics = this.musicalState.dynamics;
            perceptions.tension = this.musicalState.tension;

            // Time in section
            perceptions.sectionProgress = this.getSectionProgress();

            return perceptions;
        }

        calculateActivityLevel() {
            // Decay existing activity
            this.userActivity.activityLevel *= 0.95;

            // Boost from recent zone changes
            const recentZoneChanges = this.significantEvents
                .filter(e => e.type === 'zone' && e.time > performance.now() - 5000)
                .length;

            this.userActivity.activityLevel += recentZoneChanges * 0.1;

            // Boost from patterns
            const recentPatterns = this.significantEvents
                .filter(e => e.type === 'pattern' && e.time > performance.now() - 10000)
                .length;

            this.userActivity.activityLevel += recentPatterns * 0.15;

            return Math.min(1, this.userActivity.activityLevel);
        }

        getSectionProgress() {
            if (!this.musicalState.form) return 0;

            const form = MUSICAL_FORMS[this.musicalState.form];
            const sectionName = this.musicalState.currentSectionName;
            const sectionLength = form.sectionLengths[sectionName] || 16;

            return this.musicalState.sectionBeat / sectionLength;
        }

        getAgentStates() {
            const states = {};
            for (const [id, agent] of this.managedAgents) {
                states[id] = {
                    active: agent.state?.active || false,
                    energy: agent.state?.energy || 0,
                    confidence: agent.state?.confidence || 0.5
                };
            }
            return states;
        }

        // ═══════════════════════════════════════════════════════════════════
        // DECISION MAKING
        // ═══════════════════════════════════════════════════════════════════

        getPossibleActions() {
            const actions = [];

            // Section transitions
            if (this.shouldTransitionSection()) {
                actions.push({
                    type: 'section_transition',
                    priority: 0.9
                });
            }

            // Mood changes based on user activity
            const suggestedMood = this.suggestMoodChange();
            if (suggestedMood) {
                actions.push({
                    type: 'mood_change',
                    mood: suggestedMood,
                    priority: 0.7
                });
            }

            // Dynamics adjustments
            const dynamicsChange = this.suggestDynamicsChange();
            if (Math.abs(dynamicsChange) > 0.1) {
                actions.push({
                    type: 'dynamics_adjust',
                    change: dynamicsChange,
                    priority: 0.5
                });
            }

            // Agent instructions
            const agentInstructions = this.generateAgentInstructions();
            for (const instruction of agentInstructions) {
                actions.push({
                    type: 'agent_instruction',
                    instruction,
                    priority: 0.6
                });
            }

            // Tension/release
            if (this.shouldBuildTension()) {
                actions.push({
                    type: 'build_tension',
                    amount: 0.1,
                    priority: 0.6
                });
            } else if (this.shouldRelease()) {
                actions.push({
                    type: 'release_tension',
                    amount: 0.2,
                    priority: 0.7
                });
            }

            return actions;
        }

        evaluateAction(action) {
            let score = action.priority || 0.5;

            // Adjust based on musical context
            switch (action.type) {
                case 'section_transition':
                    // Higher score near section boundaries
                    const progress = this.getSectionProgress();
                    score *= progress > 0.9 ? 1.5 : 0.5;
                    break;

                case 'mood_change':
                    // Score based on how different the mood is
                    const currentMood = MOODS[this.musicalState.mood];
                    const targetMood = MOODS[action.mood];
                    const energyDiff = Math.abs(currentMood.energy - targetMood.energy);
                    score *= 0.5 + (energyDiff > 0.3 ? 0.3 : energyDiff);
                    break;

                case 'dynamics_adjust':
                    // Smooth changes preferred
                    score *= Math.abs(action.change) < 0.2 ? 1.2 : 0.8;
                    break;
            }

            // Adjust based on user activity
            const activity = this.userActivity.activityLevel;
            if (action.type === 'mood_change' && action.mood.includes('energetic')) {
                score *= 0.5 + activity;  // Boost energetic moods when user is active
            }

            return Math.min(1, score);
        }

        think(selectedActions, dt) {
            // Prioritize and filter actions
            const prioritized = selectedActions.sort((a, b) => b.priority - a.priority);

            // Limit to prevent too many simultaneous changes
            return prioritized.slice(0, 3);
        }

        // ═══════════════════════════════════════════════════════════════════
        // ACTION EXECUTION
        // ═══════════════════════════════════════════════════════════════════

        executeAction(action) {
            switch (action.type) {
                case 'section_transition':
                    return this.executeTransitionSection();

                case 'mood_change':
                    return this.executeMoodChange(action.mood);

                case 'dynamics_adjust':
                    return this.executeDynamicsAdjust(action.change);

                case 'agent_instruction':
                    return this.executeAgentInstruction(action.instruction);

                case 'build_tension':
                    return this.executeBuildTension(action.amount);

                case 'release_tension':
                    return this.executeReleaseTension(action.amount);

                default:
                    this.log('Unknown action type:', action.type);
                    return null;
            }
        }

        executeTransitionSection() {
            const form = MUSICAL_FORMS[this.musicalState.form];
            if (!form) return null;

            // Move to next section
            this.musicalState.currentSection++;

            if (this.musicalState.currentSection >= form.sections.length) {
                // Loop or end
                this.musicalState.currentSection = 0;
                this.emit('form.complete', { form: this.musicalState.form });
            }

            const newSection = form.sections[this.musicalState.currentSection];
            this.musicalState.currentSectionName = newSection;
            this.musicalState.sectionBeat = 0;

            // Set target dynamics from form
            this.musicalState.targetDynamics = form.dynamics[newSection] || 0.5;

            // Notify
            this.emit('section.change', {
                section: newSection,
                dynamics: form.dynamics[newSection]
            });

            // Trigger transition in agents
            this.broadcastToAgents('section.change', {
                section: newSection,
                dynamics: form.dynamics[newSection],
                transitionType: form.transitions
            });

            return { section: newSection };
        }

        executeMoodChange(mood) {
            if (!MOODS[mood]) return null;

            const prevMood = this.musicalState.mood;
            this.musicalState.targetMood = mood;

            // Start transition
            this.musicalState.moodTransition = {
                from: prevMood,
                to: mood,
                progress: 0,
                duration: 16  // beats
            };

            this.emit('mood.transition', {
                from: prevMood,
                to: mood
            });

            // Update agent configurations
            const moodConfig = MOODS[mood];
            this.applyMoodToAgents(moodConfig);

            return { mood };
        }

        executeDynamicsAdjust(change) {
            this.musicalState.dynamics = Math.max(0, Math.min(1,
                this.musicalState.dynamics + change
            ));

            // Propagate to agents
            this.broadcastToAgents('dynamics.change', {
                dynamics: this.musicalState.dynamics
            });

            if (typeof GumpState !== 'undefined') {
                GumpState.set('music.dynamics', this.musicalState.dynamics);
            }

            return { dynamics: this.musicalState.dynamics };
        }

        executeAgentInstruction(instruction) {
            const agent = this.managedAgents.get(instruction.agentId);
            if (agent) {
                agent.inbox.push({
                    from: this.id,
                    type: 'instruction',
                    data: instruction
                });
            }
            return instruction;
        }

        executeBuildTension(amount) {
            this.musicalState.tension = Math.min(1, this.musicalState.tension + amount);

            // Communicate to agents
            this.broadcastToAgents('tension.change', {
                tension: this.musicalState.tension
            });

            return { tension: this.musicalState.tension };
        }

        executeReleaseTension(amount) {
            this.musicalState.tension = Math.max(0, this.musicalState.tension - amount);
            this.musicalState.release = amount;

            // Communicate to agents
            this.broadcastToAgents('tension.release', {
                tension: this.musicalState.tension,
                releaseAmount: amount
            });

            return { tension: this.musicalState.tension };
        }

        // ═══════════════════════════════════════════════════════════════════
        // DECISION HELPERS
        // ═══════════════════════════════════════════════════════════════════

        shouldTransitionSection() {
            const progress = this.getSectionProgress();
            return progress > 0.95;
        }

        suggestMoodChange() {
            const activity = this.userActivity.activityLevel;
            const currentMood = MOODS[this.musicalState.mood];

            // Find mood that matches current activity level
            let bestMood = null;
            let bestMatch = Infinity;

            for (const [name, mood] of Object.entries(MOODS)) {
                if (name === this.musicalState.mood) continue;

                const energyDiff = Math.abs(mood.energy - activity);
                if (energyDiff < bestMatch && energyDiff < Math.abs(currentMood.energy - activity) - 0.1) {
                    bestMatch = energyDiff;
                    bestMood = name;
                }
            }

            // Only suggest if significantly better match
            if (bestMood && bestMatch < 0.2) {
                return bestMood;
            }

            return null;
        }

        suggestDynamicsChange() {
            // Gradually move toward target
            const diff = this.musicalState.targetDynamics - this.musicalState.dynamics;

            // Also consider user activity
            const activityDiff = (this.userActivity.activityLevel - 0.5) * 0.3;

            return diff * 0.1 + activityDiff;
        }

        generateAgentInstructions() {
            const instructions = [];

            // Check each managed agent
            for (const [id, agent] of this.managedAgents) {
                const moodConfig = MOODS[this.musicalState.mood]?.agents?.[agent.type];
                if (moodConfig) {
                    // Check if agent should be active
                    if (moodConfig.active !== agent.state?.active) {
                        instructions.push({
                            agentId: id,
                            action: moodConfig.active ? 'activate' : 'deactivate'
                        });
                    }

                    // Check if agent should change type
                    if (moodConfig.type && agent.recall?.('soundType') !== moodConfig.type) {
                        instructions.push({
                            agentId: id,
                            action: 'change_type',
                            type: moodConfig.type
                        });
                    }
                }
            }

            return instructions;
        }

        shouldBuildTension() {
            // Build tension during build sections or increasing activity
            const sectionName = this.musicalState.currentSectionName;
            const progress = this.getSectionProgress();

            if (sectionName === 'build' && progress > 0.3) {
                return this.musicalState.tension < 0.8;
            }

            if (this.userActivity.activityLevel > 0.7 && this.musicalState.tension < 0.6) {
                return true;
            }

            return false;
        }

        shouldRelease() {
            // Release at the end of peak sections or after high tension
            const sectionName = this.musicalState.currentSectionName;
            const progress = this.getSectionProgress();

            if (sectionName === 'peak' && progress > 0.9) {
                return true;
            }

            if (sectionName === 'release' || sectionName === 'resolution') {
                return this.musicalState.tension > 0.2;
            }

            // Release if user becomes inactive
            if (this.userActivity.activityLevel < 0.2 && this.musicalState.tension > 0.4) {
                return true;
            }

            return false;
        }

        // ═══════════════════════════════════════════════════════════════════
        // AGENT MANAGEMENT
        // ═══════════════════════════════════════════════════════════════════

        registerManagedAgent(agent) {
            this.managedAgents.set(agent.id, agent);
            agent.subscribe('conductor');
        }

        releaseAgent(id) {
            const agent = this.managedAgents.get(id);
            if (agent) {
                agent.unsubscribe('conductor');
                this.managedAgents.delete(id);
            }
        }

        broadcastToAgents(type, data) {
            for (const [id, agent] of this.managedAgents) {
                agent.inbox.push({
                    from: this.id,
                    type,
                    data,
                    time: performance.now()
                });
            }
        }

        applyMoodToAgents(moodConfig) {
            for (const [type, config] of Object.entries(moodConfig.agents || {})) {
                // Find agents of this type
                for (const [id, agent] of this.managedAgents) {
                    if (agent.type === type) {
                        agent.inbox.push({
                            from: this.id,
                            type: 'mood.apply',
                            data: config,
                            time: performance.now()
                        });
                    }
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // MUSICAL STRUCTURE CONTROL
        // ═══════════════════════════════════════════════════════════════════

        setForm(formName) {
            const form = MUSICAL_FORMS[formName];
            if (!form) {
                this.log('Unknown form:', formName);
                return;
            }

            this.musicalState.form = formName;
            this.musicalState.currentSection = 0;
            this.musicalState.currentSectionName = form.sections[0];
            this.musicalState.sectionBeat = 0;
            this.musicalState.targetDynamics = form.dynamics[form.sections[0]] || 0.5;

            this.emit('form.set', { form: formName });
        }

        setMood(moodName) {
            if (MOODS[moodName]) {
                this.executeMoodChange(moodName);
            }
        }

        setMoodForEra(era) {
            const eraMoods = {
                genesis: 'serene',
                primordial: 'mystical',
                tribal: 'flowing',
                sacred: 'contemplative',
                modern: 'energetic'
            };

            this.setMood(eraMoods[era] || 'serene');
        }

        setTempo(bpm) {
            this.timing.bpm = Math.max(40, Math.min(200, bpm));

            if (typeof GumpState !== 'undefined') {
                GumpState.set('music.bpm', this.timing.bpm);
            }

            this.emit('tempo.change', { bpm: this.timing.bpm });
        }

        // ═══════════════════════════════════════════════════════════════════
        // EVENT HANDLERS
        // ═══════════════════════════════════════════════════════════════════

        onBeat(data) {
            this.timing.currentBeat = data.beat || 0;
            this.timing.lastBeatTime = performance.now();

            // Update section beat
            this.musicalState.sectionBeat++;
            this.musicalState.totalBeats++;

            // Progress mood transition
            if (this.musicalState.moodTransition) {
                this.musicalState.moodTransition.progress++;
                if (this.musicalState.moodTransition.progress >= this.musicalState.moodTransition.duration) {
                    this.musicalState.mood = this.musicalState.moodTransition.to;
                    this.musicalState.moodTransition = null;
                    this.emit('mood.complete', { mood: this.musicalState.mood });
                }
            }

            // Smooth dynamics toward target
            const dynamicsDiff = this.musicalState.targetDynamics - this.musicalState.dynamics;
            this.musicalState.dynamics += dynamicsDiff * 0.05;
        }

        onZoneEnter(data) {
            const zone = data.zone;
            this.userActivity.lastZone = zone;

            // Track zone activity
            const count = this.userActivity.zones.get(zone) || 0;
            this.userActivity.zones.set(zone, count + 1);

            // Record event
            this.significantEvents.push({
                type: 'zone',
                zone,
                time: performance.now()
            });

            // Trim old events
            const cutoff = performance.now() - 30000;
            this.significantEvents = this.significantEvents.filter(e => e.time > cutoff);

            // Boost activity
            this.userActivity.activityLevel = Math.min(1, this.userActivity.activityLevel + 0.1);
        }

        onZoneDwell(data) {
            // Extended dwell might indicate user wants more from this zone
            const zone = data.zone;
            const time = data.time;

            if (time > 3) {
                // Strong focus on this zone
                this.emit('user.focus', { zone, duration: time });
            }
        }

        onPattern(data) {
            this.userActivity.lastPattern = data.pattern;
            this.userActivity.patterns.push({
                pattern: data.pattern,
                time: performance.now()
            });

            // Record event
            this.significantEvents.push({
                type: 'pattern',
                pattern: data.pattern,
                time: performance.now()
            });

            // Boost activity significantly for patterns
            this.userActivity.activityLevel = Math.min(1, this.userActivity.activityLevel + 0.2);

            // Trim pattern history
            while (this.userActivity.patterns.length > 20) {
                this.userActivity.patterns.shift();
            }
        }

        onUnlock(data) {
            // New unlock - celebrate with dynamics boost
            this.musicalState.targetDynamics = Math.min(1, this.musicalState.dynamics + 0.2);

            // Record event
            this.significantEvents.push({
                type: 'unlock',
                unlock: data.id,
                time: performance.now()
            });

            this.emit('unlock.celebration', { unlock: data.id });
        }

        onEraChange(data) {
            const era = data.to;

            // Adapt musical form for era
            const eraForms = {
                genesis: 'meditation',
                primordial: 'ambient',
                tribal: 'ritual',
                sacred: 'journey',
                modern: 'buildUp'
            };

            this.setForm(eraForms[era] || 'ambient');
            this.setMoodForEra(era);

            // Adjust tempo for era
            const eraTempos = {
                genesis: 60,
                primordial: 75,
                tribal: 100,
                sacred: 90,
                modern: 120
            };

            this.setTempo(eraTempos[era] || 90);

            this.emit('era.adapted', { era, form: eraForms[era] });
        }

        // ═══════════════════════════════════════════════════════════════════
        // MESSAGE HANDLING
        // ═══════════════════════════════════════════════════════════════════

        handleMessage(message) {
            switch (message.type) {
                case 'request.permission':
                    // Agent requesting permission for action
                    this.handlePermissionRequest(message);
                    break;

                case 'report.state':
                    // Agent reporting its state
                    this.handleStateReport(message);
                    break;

                case 'suggest.change':
                    // Agent suggesting a musical change
                    this.handleSuggestion(message);
                    break;

                default:
                    this.log('Unhandled message type:', message.type);
            }
        }

        handlePermissionRequest(message) {
            // Evaluate if the action fits the current musical direction
            const action = message.data?.action;
            const granted = this.evaluatePermission(action);

            // Reply
            this.sendMessage(message.from, 'permission.response', {
                action,
                granted,
                conditions: granted ? this.getActionConditions(action) : null
            });
        }

        evaluatePermission(action) {
            // Most actions allowed unless they conflict with current mood/section
            return true;
        }

        getActionConditions(action) {
            return {
                dynamics: this.musicalState.dynamics,
                tension: this.musicalState.tension,
                mood: this.musicalState.mood
            };
        }

        handleStateReport(message) {
            // Update our knowledge of agent state
            const agentId = message.from;
            const agent = this.managedAgents.get(agentId);
            if (agent) {
                // Could store additional state info
            }
        }

        handleSuggestion(message) {
            // Consider agent suggestions for future actions
            const suggestion = message.data;
            this.pendingInstructions.push({
                source: message.from,
                suggestion,
                time: performance.now()
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // LEARNING
        // ═══════════════════════════════════════════════════════════════════

        calculateReward() {
            // Reward based on:
            // 1. User engagement (activity level)
            // 2. Musical coherence (smooth transitions)
            // 3. Appropriate response to user

            const engagement = this.userActivity.activityLevel;
            const coherence = 1 - Math.abs(this.musicalState.dynamics - this.musicalState.targetDynamics);
            const responsiveness = this.evaluateResponsiveness();

            return (engagement * 0.4 + coherence * 0.3 + responsiveness * 0.3);
        }

        evaluateResponsiveness() {
            // How well did we respond to user actions?
            const recentEvents = this.significantEvents.filter(
                e => e.time > performance.now() - 5000
            );

            if (recentEvents.length === 0) return 0.5;

            // Check if we took actions in response
            const recentActions = this.actionHistory.filter(
                a => a.time > performance.now() - 5000
            );

            return Math.min(1, recentActions.length / Math.max(1, recentEvents.length));
        }

        // ═══════════════════════════════════════════════════════════════════
        // STATUS
        // ═══════════════════════════════════════════════════════════════════

        getStatus() {
            return {
                ...super.getStatus(),
                musical: {
                    form: this.musicalState.form,
                    section: this.musicalState.currentSectionName,
                    sectionProgress: this.getSectionProgress(),
                    mood: this.musicalState.mood,
                    dynamics: this.musicalState.dynamics,
                    tension: this.musicalState.tension,
                    bpm: this.timing.bpm
                },
                user: {
                    activity: this.userActivity.activityLevel,
                    lastZone: this.userActivity.lastZone,
                    lastPattern: this.userActivity.lastPattern
                },
                agents: this.getAgentStates()
            };
        }
    }

    // Register the agent type
    registerAgentType('conductor', ConductorAgent);

    // ═══════════════════════════════════════════════════════════════════════
    // SINGLETON INSTANCE
    // ═══════════════════════════════════════════════════════════════════════

    let instance = null;

    function getInstance() {
        if (!instance) {
            instance = new ConductorAgent('conductor');
            registerAgent(instance);
        }
        return instance;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        ConductorAgent,
        getInstance,
        MUSICAL_FORMS,
        MOODS,
        TRANSITIONS
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpConductor;
}
