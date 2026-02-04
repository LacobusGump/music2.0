/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - HARMONY MIND AGENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * AI agent specialized in harmonic decision-making.
 * Manages chords, pads, progressions, and harmonic texture.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpHarmonyMind = (function() {
    'use strict';

    if (typeof GumpAgentBase === 'undefined') {
        console.error('[GumpHarmonyMind] GumpAgentBase not found');
        return {};
    }

    const { Agent, registerAgentType, registerAgent } = GumpAgentBase;

    // ═══════════════════════════════════════════════════════════════════════
    // HARMONIC STRUCTURES
    // ═══════════════════════════════════════════════════════════════════════

    const CHORD_TYPES = {
        power: [0, 7],
        major: [0, 4, 7],
        minor: [0, 3, 7],
        sus2: [0, 2, 7],
        sus4: [0, 5, 7],
        maj7: [0, 4, 7, 11],
        min7: [0, 3, 7, 10],
        dom7: [0, 4, 7, 10],
        add9: [0, 4, 7, 14],
        madd9: [0, 3, 7, 14],
        dim: [0, 3, 6],
        aug: [0, 4, 8]
    };

    const PROGRESSIONS = {
        genesis: {
            drone: { chords: ['power'], durations: [32] },
            breath: { chords: ['power', 'power'], durations: [16, 16] }
        },
        primordial: {
            natural: { chords: ['power', 'sus2', 'power', 'sus4'], durations: [8, 8, 8, 8] },
            water: { chords: ['minor', 'sus2', 'minor'], durations: [12, 8, 12] }
        },
        tribal: {
            ritual: { chords: ['minor', 'power', 'minor', 'sus4'], durations: [8, 8, 8, 8] },
            trance: { chords: ['minor', 'minor', 'power', 'sus2'], durations: [8, 8, 8, 8] }
        },
        sacred: {
            hymn: { chords: ['major', 'minor', 'sus4', 'major'], durations: [8, 8, 8, 8] },
            prayer: { chords: ['major', 'add9', 'minor', 'sus2'], durations: [8, 8, 8, 8] }
        },
        modern: {
            pop: { chords: ['major', 'dom7', 'minor', 'sus4'], durations: [8, 8, 8, 8] },
            ambient: { chords: ['maj7', 'add9', 'min7', 'madd9'], durations: [8, 8, 8, 8] },
            dark: { chords: ['minor', 'dim', 'minor', 'power'], durations: [8, 8, 8, 8] }
        }
    };

    const PAD_PRESETS = {
        genesis: ['void_drone', 'first_light', 'shimmer_pad'],
        primordial: ['breath_texture', 'wind_pad', 'earth_hum'],
        tribal: ['ritual_drone', 'chant_pad', 'fire_texture'],
        sacred: ['organ_pad', 'choir_pad', 'string_pad'],
        modern: ['analog_pad', 'supersaw_pad', 'ambient_pad', 'warm_pad']
    };

    // ═══════════════════════════════════════════════════════════════════════
    // HARMONY MIND AGENT CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class HarmonyMindAgent extends Agent {
        constructor(id = 'harmony-mind', config = {}) {
            super(id, 'harmony', {
                updateRate: 50,
                ...config
            });

            // Harmonic state
            this.harmonyState = {
                root: 220,           // A3
                scale: 'minor',
                currentChord: null,
                chordType: 'power',
                inversion: 0,
                voicing: 'close'
            };

            // Progression state
            this.progression = {
                name: 'drone',
                chords: ['power'],
                durations: [32],
                index: 0,
                beatCount: 0
            };

            // Pad state
            this.padState = {
                type: 'void_drone',
                playing: false,
                voiceIds: [],
                filterCutoff: 0.5,
                reverbMix: 0.5
            };

            // Drone state
            this.droneState = {
                active: false,
                voiceId: null,
                frequency: 110
            };

            // Timing
            this.timing = {
                bar: 0,
                beat: 0,
                step: 0
            };

            // Zone reactive
            this.zoneHarmony = {
                lastZone: 'center',
                zoneRoot: 220
            };
        }

        // ═══════════════════════════════════════════════════════════════════
        // LIFECYCLE
        // ═══════════════════════════════════════════════════════════════════

        _onStart() {
            if (typeof GumpEvents !== 'undefined') {
                GumpEvents.on('beat', (data) => this.onBeat(data));
                GumpEvents.on('step', (data) => this.onStep(data));
                GumpEvents.on('era.change', (data) => this.onEraChange(data));
                GumpEvents.on('zone.enter', (data) => this.onZoneEnter(data));
            }

            // Start with drone
            this.startDrone();
        }

        _onStop() {
            this.stopAll();
        }

        // ═══════════════════════════════════════════════════════════════════
        // PERCEPTION
        // ═══════════════════════════════════════════════════════════════════

        perceive() {
            const perceptions = {};

            if (typeof GumpState !== 'undefined') {
                perceptions.era = GumpState.get('era.current') || 'genesis';
                perceptions.zone = GumpState.get('grid.currentZone') || 'center';
                perceptions.dynamics = GumpState.get('music.dynamics') || 0.5;
                perceptions.energy = GumpState.get('music.energy') || 0.5;
                perceptions.tension = GumpState.get('music.tension') || 0;
            }

            perceptions.chord = this.harmonyState.chordType;
            perceptions.pad = this.padState.type;
            perceptions.droneActive = this.droneState.active;
            perceptions.bar = this.timing.bar;

            return perceptions;
        }

        // ═══════════════════════════════════════════════════════════════════
        // DECISION MAKING
        // ═══════════════════════════════════════════════════════════════════

        getPossibleActions() {
            const actions = [];
            const perceptions = this.perceptions.current;

            // Chord progression advance
            if (this.shouldAdvanceProgression()) {
                actions.push({
                    type: 'advance_progression',
                    priority: 0.7
                });
            }

            // Change progression
            if (this.shouldChangeProgression()) {
                const era = perceptions.era || 'genesis';
                const progressions = Object.keys(PROGRESSIONS[era] || {});

                for (const prog of progressions) {
                    actions.push({
                        type: 'change_progression',
                        progression: prog,
                        era: era,
                        priority: 0.5
                    });
                }
            }

            // Change pad type
            if (this.shouldChangePad()) {
                actions.push({
                    type: 'change_pad',
                    priority: 0.4
                });
            }

            // Root change based on zone
            const zoneRoot = this.getRootForZone(perceptions.zone);
            if (Math.abs(zoneRoot - this.harmonyState.root) > 10) {
                actions.push({
                    type: 'change_root',
                    root: zoneRoot,
                    priority: 0.35
                });
            }

            // Filter modulation
            if (this.hasChanged('zone') || this.hasChanged('dynamics')) {
                actions.push({
                    type: 'modulate_filter',
                    priority: 0.3
                });
            }

            // Voicing change
            if (this.timing.bar % 8 === 7) {
                actions.push({
                    type: 'change_voicing',
                    priority: 0.25
                });
            }

            return actions;
        }

        evaluateAction(action) {
            let score = action.priority || 0.5;
            const perceptions = this.perceptions.current;

            switch (action.type) {
                case 'advance_progression':
                    score *= perceptions.dynamics > 0.3 ? 1.2 : 0.8;
                    break;

                case 'change_pad':
                    if (this.hasChanged('era')) {
                        score *= 1.5;
                    }
                    break;

                case 'change_root':
                    const rootDiff = Math.abs(Math.log2(action.root / this.harmonyState.root));
                    score *= rootDiff < 0.5 ? 1.2 : 0.7;
                    break;
            }

            return Math.min(1, score);
        }

        // ═══════════════════════════════════════════════════════════════════
        // ACTION EXECUTION
        // ═══════════════════════════════════════════════════════════════════

        executeAction(action) {
            switch (action.type) {
                case 'advance_progression':
                    return this.executeAdvanceProgression();

                case 'change_progression':
                    return this.executeChangeProgression(action.era, action.progression);

                case 'change_pad':
                    return this.executeChangePad();

                case 'change_root':
                    return this.executeChangeRoot(action.root);

                case 'modulate_filter':
                    return this.executeModulateFilter();

                case 'change_voicing':
                    return this.executeChangeVoicing();

                default:
                    return null;
            }
        }

        executeAdvanceProgression() {
            this.progression.index = (this.progression.index + 1) % this.progression.chords.length;
            this.progression.beatCount = 0;

            const chordType = this.progression.chords[this.progression.index];
            this.playChord(chordType);

            this.emit('chord.change', { chord: chordType, index: this.progression.index });

            return { chord: chordType };
        }

        executeChangeProgression(era, progressionName) {
            const eraProgressions = PROGRESSIONS[era];
            if (!eraProgressions || !eraProgressions[progressionName]) return null;

            const prog = eraProgressions[progressionName];
            this.progression = {
                name: progressionName,
                chords: prog.chords,
                durations: prog.durations,
                index: 0,
                beatCount: 0
            };

            // Play first chord
            this.playChord(prog.chords[0]);

            this.emit('progression.change', { progression: progressionName });

            return { progression: progressionName };
        }

        executeChangePad() {
            const era = this.perceptions.current.era || 'genesis';
            const pads = PAD_PRESETS[era] || PAD_PRESETS.genesis;
            const dynamics = this.perceptions.current.dynamics || 0.5;

            // Choose pad based on dynamics
            const index = Math.floor(dynamics * (pads.length - 0.01));
            const newPad = pads[index];

            this.padState.type = newPad;

            // If currently playing, morph to new pad
            if (this.droneState.active && typeof GumpHarmony !== 'undefined') {
                GumpHarmony.morphDrone(newPad, 2.0);
            }

            this.emit('pad.change', { type: newPad });

            return { pad: newPad };
        }

        executeChangeRoot(newRoot) {
            const oldRoot = this.harmonyState.root;
            this.harmonyState.root = newRoot;

            // Update drone frequency
            if (this.droneState.active && typeof GumpHarmony !== 'undefined') {
                GumpHarmony.shiftDroneFrequency(newRoot, 1.0);
            }

            // Re-play current chord at new root
            this.playChord(this.harmonyState.chordType);

            this.emit('root.change', { from: oldRoot, to: newRoot });

            return { root: newRoot };
        }

        executeModulateFilter() {
            const zone = this.perceptions.current.zone || 'center';
            const dynamics = this.perceptions.current.dynamics || 0.5;

            // Zone affects filter
            const zoneFilter = {
                'top-left': 0.7, 'top-center': 0.8, 'top-right': 0.9,
                'center-left': 0.5, 'center': 0.6, 'center-right': 0.7,
                'bottom-left': 0.3, 'bottom-center': 0.4, 'bottom-right': 0.5
            };

            this.padState.filterCutoff = (zoneFilter[zone] || 0.5) * (0.5 + dynamics * 0.5);

            if (typeof GumpHarmony !== 'undefined') {
                GumpHarmony.setFilterCutoff(this.padState.filterCutoff);
            }

            return { filter: this.padState.filterCutoff };
        }

        executeChangeVoicing() {
            const voicings = ['close', 'open', 'drop2', 'spread'];
            const current = voicings.indexOf(this.harmonyState.voicing);
            const next = (current + 1) % voicings.length;

            this.harmonyState.voicing = voicings[next];

            // Re-play chord with new voicing
            this.playChord(this.harmonyState.chordType);

            return { voicing: this.harmonyState.voicing };
        }

        // ═══════════════════════════════════════════════════════════════════
        // HARMONY OPERATIONS
        // ═══════════════════════════════════════════════════════════════════

        playChord(chordType) {
            // Stop current chord
            this.stopChord();

            this.harmonyState.chordType = chordType;

            if (typeof GumpHarmony !== 'undefined') {
                const velocity = 0.5 + (this.perceptions.current.dynamics || 0.5) * 0.3;

                this.padState.voiceIds = GumpHarmony.playChord(
                    'chord',
                    this.padState.type,
                    this.harmonyState.root,
                    chordType,
                    this.harmonyState.voicing,
                    velocity * this.state.energy
                );

                this.padState.playing = true;
            }
        }

        stopChord() {
            if (typeof GumpHarmony !== 'undefined' && this.padState.voiceIds.length > 0) {
                GumpHarmony.stopChord(this.padState.voiceIds);
                this.padState.voiceIds = [];
                this.padState.playing = false;
            }
        }

        startDrone() {
            if (this.droneState.active) return;

            const frequency = this.harmonyState.root / 2;  // Octave below

            if (typeof GumpHarmony !== 'undefined') {
                this.droneState.voiceId = GumpHarmony.startDrone(
                    this.padState.type,
                    frequency,
                    0.3 * this.state.energy
                );
                this.droneState.frequency = frequency;
                this.droneState.active = true;
            }

            this.emit('drone.start', { frequency });
        }

        stopDrone() {
            if (!this.droneState.active) return;

            if (typeof GumpHarmony !== 'undefined') {
                GumpHarmony.stopDrone();
            }

            this.droneState.active = false;
            this.droneState.voiceId = null;

            this.emit('drone.stop');
        }

        stopAll() {
            this.stopChord();
            this.stopDrone();
        }

        // ═══════════════════════════════════════════════════════════════════
        // DECISION HELPERS
        // ═══════════════════════════════════════════════════════════════════

        shouldAdvanceProgression() {
            this.progression.beatCount++;
            const duration = this.progression.durations[this.progression.index];

            return this.progression.beatCount >= duration;
        }

        shouldChangeProgression() {
            return this.timing.bar % 16 === 15 && this.timing.beat === 3;
        }

        shouldChangePad() {
            return this.hasChanged('era') || (this.timing.bar % 16 === 0 && Math.random() < 0.2);
        }

        getRootForZone(zone) {
            const zoneRoots = {
                'center': 220,       // A3
                'top-center': 247,   // B3
                'bottom-center': 196, // G3
                'center-left': 208,  // G#3
                'center-right': 233, // A#3
                'top-left': 262,     // C4
                'top-right': 294,    // D4
                'bottom-left': 175,  // F3
                'bottom-right': 220  // A3
            };

            return zoneRoots[zone] || 220;
        }

        // ═══════════════════════════════════════════════════════════════════
        // EVENT HANDLERS
        // ═══════════════════════════════════════════════════════════════════

        onBeat(data) {
            this.timing.beat = data.beat || 0;
        }

        onStep(data) {
            this.timing.step = data.step || 0;

            if (data.step > 0 && data.step % 16 === 0) {
                this.timing.bar++;
            }
        }

        onEraChange(data) {
            const era = data.to;

            // Select appropriate progression
            const eraProgs = PROGRESSIONS[era];
            if (eraProgs) {
                const progNames = Object.keys(eraProgs);
                const prog = progNames[0];
                this.executeChangeProgression(era, prog);
            }

            // Update pad
            this.executeChangePad();
        }

        onZoneEnter(data) {
            this.zoneHarmony.lastZone = data.zone;

            // Subtle root adjustment
            const newRoot = this.getRootForZone(data.zone);
            if (Math.abs(newRoot - this.harmonyState.root) > 20) {
                this.executeChangeRoot(newRoot);
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
                    this.startDrone();
                    break;
                case 'deactivate':
                    this.setEnergy(0);
                    this.stopAll();
                    break;
            }
        }

        handleDynamicsChange(data) {
            this.setEnergy(data.dynamics);

            // Adjust reverb with dynamics
            this.padState.reverbMix = 0.3 + (1 - data.dynamics) * 0.5;

            if (typeof GumpHarmony !== 'undefined') {
                GumpHarmony.setReverbMix(this.padState.reverbMix);
            }
        }

        handleTensionChange(data) {
            // Higher tension = brighter, more dissonant
            this.padState.filterCutoff = 0.3 + data.tension * 0.5;

            if (typeof GumpHarmony !== 'undefined') {
                GumpHarmony.setFilterCutoff(this.padState.filterCutoff);
            }
        }

        handleMoodApply(config) {
            if (config.active !== undefined) {
                if (config.active) {
                    this.setEnergy(0.5);
                    this.startDrone();
                } else {
                    this.setEnergy(0);
                    this.stopAll();
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // LEARNING
        // ═══════════════════════════════════════════════════════════════════

        calculateReward() {
            const dynamics = this.perceptions.current.dynamics || 0.5;
            const playing = this.padState.playing || this.droneState.active;

            // Reward for maintaining appropriate activity
            return playing ? (0.5 + dynamics * 0.5) : 0.3;
        }

        // ═══════════════════════════════════════════════════════════════════
        // PUBLIC METHODS
        // ═══════════════════════════════════════════════════════════════════

        setRoot(frequency) {
            this.executeChangeRoot(frequency);
        }

        setPadType(type) {
            this.padState.type = type;
            if (this.droneState.active) {
                this.executeChangePad();
            }
        }

        getStatus() {
            return {
                ...super.getStatus(),
                harmony: {
                    root: this.harmonyState.root,
                    chord: this.harmonyState.chordType,
                    voicing: this.harmonyState.voicing
                },
                progression: {
                    name: this.progression.name,
                    index: this.progression.index
                },
                pad: {
                    type: this.padState.type,
                    playing: this.padState.playing
                },
                drone: this.droneState.active
            };
        }
    }

    // Register the agent type
    registerAgentType('harmony', HarmonyMindAgent);

    // Singleton
    let instance = null;

    function getInstance() {
        if (!instance) {
            instance = new HarmonyMindAgent('harmony-mind');
            registerAgent(instance);
        }
        return instance;
    }

    return {
        HarmonyMindAgent,
        getInstance,
        CHORD_TYPES,
        PROGRESSIONS,
        PAD_PRESETS
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpHarmonyMind;
}
