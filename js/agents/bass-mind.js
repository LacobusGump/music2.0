/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - BASS MIND AGENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * AI agent specialized in bass line decision-making.
 * Manages bass patterns, 808 control, harmonic foundation, and groove.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpBassMind = (function() {
    'use strict';

    // Ensure dependencies are loaded
    if (typeof GumpAgentBase === 'undefined') {
        console.error('[GumpBassMind] GumpAgentBase not found');
        return {};
    }

    const { Agent, registerAgentType, registerAgent } = GumpAgentBase;

    // ═══════════════════════════════════════════════════════════════════════
    // BASS PATTERNS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Pattern library for bass lines
     * Each pattern is 16 steps with note values:
     * null = rest, number = semitone offset from root (0 = root)
     */
    const PATTERN_LIBRARY = {
        // ─────────────────────────────────────────────────────────────────
        // GENESIS ERA - Drones and fundamental tones
        // ─────────────────────────────────────────────────────────────────
        genesis: {
            void: {
                notes: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                durations: [16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                type: 'sub',
                intensity: 0.2
            },
            pulse: {
                notes: [0, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null],
                durations: [8, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0],
                type: 'sub',
                intensity: 0.25
            },
            breath: {
                notes: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                durations: [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                type: 'sine',
                filterSweep: true,
                intensity: 0.2
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // PRIMORDIAL ERA - Natural bass movement
        // ─────────────────────────────────────────────────────────────────
        primordial: {
            earth: {
                notes: [0, null, null, null, null, null, 0, null, null, null, null, null, 0, null, null, null],
                durations: [6, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 4, 0, 0, 0],
                type: 'sub',
                intensity: 0.35
            },
            water: {
                notes: [0, null, null, null, 5, null, null, null, 7, null, null, null, 5, null, null, null],
                durations: [4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0],
                type: 'sine',
                glide: 0.1,
                intensity: 0.4
            },
            heartbeat: {
                notes: [0, null, null, -12, null, null, null, null, 0, null, null, -12, null, null, null, null],
                durations: [3, 0, 0, 1, 0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 0, 0],
                type: 'sub',
                intensity: 0.35
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // TRIBAL ERA - Rhythmic bass
        // ─────────────────────────────────────────────────────────────────
        tribal: {
            ritual: {
                notes: [0, null, null, 0, null, null, 0, null, null, 0, null, null, 0, null, null, 0],
                durations: [3, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 2, 0, 0, 1],
                type: 'pluck',
                intensity: 0.5
            },
            trance: {
                notes: [0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null],
                durations: [4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0],
                type: 'sub',
                intensity: 0.55
            },
            dance: {
                notes: [0, null, 0, null, null, null, 0, null, 0, null, null, null, 0, null, 0, null],
                durations: [2, 0, 2, 0, 0, 0, 2, 0, 2, 0, 0, 0, 2, 0, 2, 0],
                type: 'pluck',
                intensity: 0.6
            },
            polyrhythm: {
                notes: [0, null, null, 0, null, 0, null, null, 0, null, null, 0, null, 0, null, null],
                durations: [3, 0, 0, 2, 0, 2, 0, 0, 3, 0, 0, 2, 0, 2, 0, 0],
                type: 'sub',
                glide: 0.05,
                intensity: 0.55
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // SACRED ERA - Harmonic bass
        // ─────────────────────────────────────────────────────────────────
        sacred: {
            processional: {
                notes: [0, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null],
                durations: [8, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0],
                type: 'sine',
                intensity: 0.35
            },
            hymnal: {
                notes: [0, null, null, null, 5, null, null, null, 7, null, null, null, 5, null, null, null],
                durations: [4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0],
                type: 'sine',
                glide: 0.08,
                intensity: 0.4
            },
            meditation: {
                notes: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                durations: [16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                type: 'sine',
                filterSweep: true,
                intensity: 0.25
            }
        },

        // ─────────────────────────────────────────────────────────────────
        // MODERN ERA - 808 and contemporary bass
        // ─────────────────────────────────────────────────────────────────
        modern: {
            trap_basic: {
                notes: [0, null, null, null, null, null, 0, null, 0, null, null, null, null, null, null, 0],
                durations: [6, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 0, 1],
                type: '808',
                glide: 0.1,
                intensity: 0.6
            },
            trap_bounce: {
                notes: [0, null, 0, null, null, 0, null, 0, null, null, 0, null, null, 0, null, 0],
                durations: [2, 0, 1, 0, 0, 1, 0, 1, 0, 0, 2, 0, 0, 1, 0, 1],
                type: '808',
                glide: 0.05,
                intensity: 0.7
            },
            deep_808: {
                notes: [0, null, null, null, null, null, null, null, 0, null, null, 0, null, null, null, null],
                durations: [8, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 2, 0, 0, 0, 0],
                type: '808_deep',
                intensity: 0.55
            },
            wobble: {
                notes: [0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null],
                durations: [4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0],
                type: 'wobble',
                lfoSync: true,
                intensity: 0.65
            },
            boom_bap: {
                notes: [0, null, null, null, null, null, null, 0, null, null, 0, null, null, null, null, null],
                durations: [7, 0, 0, 0, 0, 0, 0, 3, 0, 0, 4, 0, 0, 0, 0, 0],
                type: 'sub',
                intensity: 0.5
            },
            four_floor: {
                notes: [0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null],
                durations: [4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0],
                type: 'sub',
                intensity: 0.55
            },
            synth_bass: {
                notes: [0, null, 0, null, 5, null, null, 0, null, null, 7, null, null, null, 5, null],
                durations: [2, 0, 2, 0, 4, 0, 0, 2, 0, 0, 3, 0, 0, 0, 1, 0],
                type: 'saw',
                intensity: 0.6
            }
        }
    };

    /**
     * Chord progressions for bass movement
     */
    const PROGRESSIONS = {
        I: [0],
        IV: [5],
        V: [7],
        vi: [9],
        ii: [2],
        iii: [4],
        bVII: [10],

        // Common progressions (as arrays of roots)
        'I-V-vi-IV': [0, 7, 9, 5],
        'I-IV-V': [0, 5, 7],
        'i-bVII-bVI-V': [0, 10, 8, 7],
        'i-iv-v': [0, 5, 7],
        'I-vi-IV-V': [0, 9, 5, 7],
        'I-bVII-IV': [0, 10, 5],
        'drone': [0, 0, 0, 0]
    };

    // ═══════════════════════════════════════════════════════════════════════
    // BASS MIND AGENT CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class BassMindAgent extends Agent {
        constructor(id = 'bass-mind', config = {}) {
            super(id, 'bass', {
                updateRate: 25,
                ...config
            });

            // Current pattern state
            this.patternState = {
                currentPattern: null,
                currentPatternName: null,
                era: 'genesis',
                step: 0,
                bar: 0,
                currentNote: null,
                noteEndStep: 0
            };

            // Harmonic state
            this.harmony = {
                root: 55,        // A1 in Hz
                scale: 'minor',
                progression: [0],
                progressionIndex: 0,
                currentChord: 0
            };

            // Sound parameters
            this.sound = {
                type: 'sub',
                glide: 0,
                filterCutoff: 0.5,
                drive: 0,
                octave: 0
            };

            // Generation parameters
            this.generation = {
                density: 0.5,
                syncopation: 0.3,
                variation: 0.2,
                followKick: true
            };

            // Active notes for cleanup
            this.activeNotes = new Map();

            // Learned pattern preferences
            this.patternScores = new Map();
        }

        // ═══════════════════════════════════════════════════════════════════
        // LIFECYCLE
        // ═══════════════════════════════════════════════════════════════════

        _onStart() {
            if (typeof GumpEvents !== 'undefined') {
                GumpEvents.on('beat', (data) => this.onBeat(data));
                GumpEvents.on('step', (data) => this.onStep(data));
                GumpEvents.on('era.change', (data) => this.onEraChange(data));
                GumpEvents.on('agent.drum-mind.hit', (data) => this.onDrumHit(data));
            }

            // Set initial pattern
            this.selectPattern('genesis', 'void');
        }

        // ═══════════════════════════════════════════════════════════════════
        // PERCEPTION
        // ═══════════════════════════════════════════════════════════════════

        perceive() {
            const perceptions = {};

            if (typeof GumpState !== 'undefined') {
                perceptions.era = GumpState.get('era.current') || 'genesis';
                perceptions.zone = GumpState.get('grid.currentZone') || 'center';
                perceptions.bpm = GumpState.get('music.bpm') || 90;
                perceptions.dynamics = GumpState.get('music.dynamics') || 0.5;
                perceptions.energy = GumpState.get('music.energy') || 0.5;
            }

            perceptions.pattern = this.patternState.currentPatternName;
            perceptions.step = this.patternState.step;
            perceptions.bar = this.patternState.bar;
            perceptions.root = this.harmony.root;
            perceptions.chord = this.harmony.currentChord;

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

            // Chord change
            if (this.shouldChangeChord()) {
                actions.push({
                    type: 'change_chord',
                    priority: 0.5
                });
            }

            // Root change based on zone
            const suggestedRoot = this.suggestRootForZone(perceptions.zone);
            if (suggestedRoot !== this.harmony.root) {
                actions.push({
                    type: 'change_root',
                    root: suggestedRoot,
                    priority: 0.4
                });
            }

            // Sound type change
            if (this.shouldChangeSoundType()) {
                actions.push({
                    type: 'change_sound',
                    priority: 0.3
                });
            }

            // Octave shift
            if (this.shouldShiftOctave()) {
                const direction = perceptions.dynamics > 0.6 ? 1 : -1;
                actions.push({
                    type: 'shift_octave',
                    direction,
                    priority: 0.35
                });
            }

            // Filter modulation
            if (this.shouldModulateFilter()) {
                actions.push({
                    type: 'modulate_filter',
                    priority: 0.25
                });
            }

            return actions;
        }

        evaluateAction(action) {
            let score = action.priority || 0.5;
            const perceptions = this.perceptions.current;

            switch (action.type) {
                case 'change_pattern':
                    const pattern = this.getPattern(action.era, action.pattern);
                    if (pattern) {
                        const intensityMatch = 1 - Math.abs(
                            pattern.intensity - (perceptions.dynamics || 0.5)
                        );
                        score *= 0.5 + intensityMatch * 0.5;
                    }

                    const patternScore = this.patternScores.get(action.pattern);
                    if (patternScore) {
                        score *= 0.7 + patternScore * 0.3;
                    }
                    break;

                case 'change_chord':
                    // Higher score at musical boundaries
                    const barInPhrase = this.patternState.bar % 4;
                    if (barInPhrase === 0) score *= 1.3;
                    break;

                case 'change_root':
                    // Smoother transitions preferred
                    const currentRoot = this.harmony.root;
                    const newRoot = action.root;
                    const interval = Math.abs(Math.log2(newRoot / currentRoot) * 12);
                    score *= interval <= 7 ? 1.2 : 0.8;
                    break;
            }

            return Math.min(1, score);
        }

        think(selectedActions, dt) {
            // Prioritize pattern changes over other actions
            const hasPatternChange = selectedActions.some(a => a.type === 'change_pattern');

            return selectedActions.filter(action => {
                if (hasPatternChange && (action.type === 'change_sound' || action.type === 'shift_octave')) {
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

                case 'change_chord':
                    return this.executeChordChange();

                case 'change_root':
                    return this.executeRootChange(action.root);

                case 'change_sound':
                    return this.executeSoundChange();

                case 'shift_octave':
                    return this.executeOctaveShift(action.direction);

                case 'modulate_filter':
                    return this.executeFilterModulation();

                default:
                    return null;
            }
        }

        executePatternChange(era, patternName) {
            const success = this.selectPattern(era, patternName);

            if (success) {
                // Update sound type to match pattern
                const pattern = this.getPattern(era, patternName);
                if (pattern && pattern.type) {
                    this.sound.type = pattern.type;
                }
                if (pattern && pattern.glide !== undefined) {
                    this.sound.glide = pattern.glide;
                }
            }

            return { success, pattern: patternName };
        }

        executeChordChange() {
            // Move to next chord in progression
            this.harmony.progressionIndex =
                (this.harmony.progressionIndex + 1) % this.harmony.progression.length;

            this.harmony.currentChord = this.harmony.progression[this.harmony.progressionIndex];

            this.emit('chord.change', { chord: this.harmony.currentChord });

            return { chord: this.harmony.currentChord };
        }

        executeRootChange(newRoot) {
            const oldRoot = this.harmony.root;
            this.harmony.root = newRoot;

            this.emit('root.change', { from: oldRoot, to: newRoot });

            return { root: newRoot };
        }

        executeSoundChange() {
            const era = this.perceptions.current.era || 'genesis';
            const soundTypes = this.getSoundTypesForEra(era);

            // Pick based on dynamics
            const dynamics = this.perceptions.current.dynamics || 0.5;
            let newType;

            if (dynamics < 0.3) {
                newType = soundTypes.low;
            } else if (dynamics < 0.6) {
                newType = soundTypes.mid;
            } else {
                newType = soundTypes.high;
            }

            this.sound.type = newType;

            return { type: newType };
        }

        executeOctaveShift(direction) {
            this.sound.octave = Math.max(-1, Math.min(1, this.sound.octave + direction));

            return { octave: this.sound.octave };
        }

        executeFilterModulation() {
            // Modulate filter based on zone
            const zone = this.perceptions.current.zone || 'center';
            const filterMap = {
                'top-left': 0.7,
                'top-center': 0.8,
                'top-right': 0.9,
                'center-left': 0.5,
                'center': 0.6,
                'center-right': 0.7,
                'bottom-left': 0.3,
                'bottom-center': 0.4,
                'bottom-right': 0.5
            };

            this.sound.filterCutoff = filterMap[zone] || 0.5;

            if (typeof GumpBass !== 'undefined') {
                GumpBass.setFilterCutoff(this.sound.filterCutoff);
            }

            return { filter: this.sound.filterCutoff };
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
            return 1 - Math.abs(pattern.intensity - dynamics);
        }

        // ═══════════════════════════════════════════════════════════════════
        // DECISION HELPERS
        // ═══════════════════════════════════════════════════════════════════

        shouldChangePattern() {
            if (this.patternState.bar % 8 !== 7) return false;

            const currentIntensity = this.patternState.currentPattern?.intensity || 0.5;
            const targetDynamics = this.perceptions.current.dynamics || 0.5;

            return Math.abs(currentIntensity - targetDynamics) > 0.2;
        }

        shouldChangeChord() {
            // Change chords every 4 bars
            return this.patternState.bar % 4 === 3 && this.patternState.step >= 14;
        }

        suggestRootForZone(zone) {
            // Map zones to musical intervals
            const zoneRoots = {
                'center': 55,        // A1
                'top-center': 62,    // B1
                'bottom-center': 49, // G1
                'center-left': 52,   // G#1
                'center-right': 58,  // A#1
                'top-left': 65,      // C2
                'top-right': 73,     // D2
                'bottom-left': 44,   // F1
                'bottom-right': 55   // A1
            };

            return zoneRoots[zone] || 55;
        }

        shouldChangeSoundType() {
            return this.hasChanged('era') || (Math.random() < 0.1 && this.patternState.bar % 8 === 0);
        }

        shouldShiftOctave() {
            return this.patternState.bar % 16 === 15 && this.patternState.step >= 14;
        }

        shouldModulateFilter() {
            return this.hasChanged('zone');
        }

        getSoundTypesForEra(era) {
            const types = {
                genesis: { low: 'sine', mid: 'sub', high: 'sub' },
                primordial: { low: 'sine', mid: 'sub', high: 'pluck' },
                tribal: { low: 'sub', mid: 'pluck', high: 'saw' },
                sacred: { low: 'sine', mid: 'sub', high: 'saw' },
                modern: { low: 'sub', mid: '808', high: '808_deep' }
            };

            return types[era] || types.modern;
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP HANDLING
        // ═══════════════════════════════════════════════════════════════════

        onStep(data) {
            const step = data.step || 0;
            this.patternState.step = step % 16;

            if (step > 0 && step % 16 === 0) {
                this.patternState.bar++;
            }

            // Check if current note should end
            if (this.patternState.currentNote !== null &&
                step >= this.patternState.noteEndStep) {
                this.releaseNote();
            }

            // Play new note if pattern says so
            this.playStep(this.patternState.step);
        }

        onBeat(data) {
            // Could trigger chord changes on beat
        }

        onEraChange(data) {
            const era = data.to;
            this.patternState.era = era;

            // Select appropriate pattern
            const patterns = this.getPatternsForEra(era);
            if (patterns.length > 0) {
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
        }

        onDrumHit(data) {
            // Potentially sync with drums
            if (this.generation.followKick && data.instrument === 'kick') {
                // Could trigger bass on kick hits for tighter groove
            }
        }

        playStep(step) {
            const pattern = this.patternState.currentPattern;
            if (!pattern) return;

            const noteValue = pattern.notes[step];
            if (noteValue === null) return;

            // Calculate frequency
            const baseFreq = this.harmony.root * Math.pow(2, this.sound.octave);
            const chordOffset = this.harmony.currentChord;
            const totalOffset = noteValue + chordOffset;
            const frequency = baseFreq * Math.pow(2, totalOffset / 12);

            // Get duration
            const duration = pattern.durations[step] || 1;
            this.patternState.noteEndStep = (step + duration) % 16 + Math.floor(duration / 16) * 16;

            // Trigger note
            this.triggerNote(frequency, duration);
        }

        triggerNote(frequency, duration) {
            // Release any current note first
            if (this.patternState.currentNote !== null) {
                this.releaseNote();
            }

            this.patternState.currentNote = frequency;

            // Calculate velocity from dynamics
            const velocity = 0.5 + (this.perceptions.current.dynamics || 0.5) * 0.5;

            // Emit event
            this.emit('note', {
                frequency,
                velocity: velocity * this.state.energy,
                type: this.sound.type,
                glide: this.sound.glide,
                duration
            });

            // Trigger via GumpBass if available
            if (typeof GumpBass !== 'undefined') {
                const noteId = GumpBass.noteOn(this.sound.type, frequency, velocity * this.state.energy);
                this.activeNotes.set(frequency, noteId);
            }
        }

        releaseNote() {
            if (this.patternState.currentNote === null) return;

            const frequency = this.patternState.currentNote;

            // Release via GumpBass
            if (typeof GumpBass !== 'undefined') {
                const noteId = this.activeNotes.get(frequency);
                if (noteId !== undefined) {
                    GumpBass.noteOff(noteId);
                    this.activeNotes.delete(frequency);
                }
            }

            this.emit('note.off', { frequency });
            this.patternState.currentNote = null;
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

                case 'harmony.change':
                    this.handleHarmonyChange(message.data);
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
                    this.releaseNote();
                    break;
                case 'change_type':
                    this.sound.type = instruction.type;
                    break;
            }
        }

        handleSectionChange(data) {
            // Adjust for section
        }

        handleDynamicsChange(data) {
            this.setEnergy(data.dynamics);
        }

        handleTensionChange(data) {
            // Increase filter and drive with tension
            this.sound.filterCutoff = 0.3 + data.tension * 0.5;
            this.sound.drive = data.tension * 0.4;

            if (typeof GumpBass !== 'undefined') {
                GumpBass.setFilterCutoff(this.sound.filterCutoff);
                GumpBass.setDrive(this.sound.drive);
            }
        }

        handleMoodApply(config) {
            if (config.active !== undefined) {
                this.setEnergy(config.active ? 0.5 : 0);
                if (!config.active) {
                    this.releaseNote();
                }
            }

            if (config.type) {
                this.sound.type = config.type;
            }
        }

        handleHarmonyChange(data) {
            if (data.root) {
                this.harmony.root = data.root;
            }
            if (data.chord !== undefined) {
                this.harmony.currentChord = data.chord;
            }
            if (data.progression) {
                this.harmony.progression = data.progression;
                this.harmony.progressionIndex = 0;
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // LEARNING
        // ═══════════════════════════════════════════════════════════════════

        calculateReward() {
            const currentIntensity = this.patternState.currentPattern?.intensity || 0.5;
            const targetDynamics = this.perceptions.current.dynamics || 0.5;

            const intensityMatch = 1 - Math.abs(currentIntensity - targetDynamics);
            const engagement = this.perceptions.current.energy || 0.5;

            return intensityMatch * 0.6 + engagement * 0.4;
        }

        learn(reward) {
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

        setRoot(frequency) {
            this.harmony.root = frequency;
        }

        setProgression(progression) {
            if (PROGRESSIONS[progression]) {
                this.harmony.progression = PROGRESSIONS[progression];
            } else if (Array.isArray(progression)) {
                this.harmony.progression = progression;
            }
            this.harmony.progressionIndex = 0;
        }

        setSoundType(type) {
            this.sound.type = type;
        }

        setGlide(amount) {
            this.sound.glide = Math.max(0, Math.min(1, amount));
        }

        setDrive(amount) {
            this.sound.drive = Math.max(0, Math.min(1, amount));
            if (typeof GumpBass !== 'undefined') {
                GumpBass.setDrive(this.sound.drive);
            }
        }

        getStatus() {
            return {
                ...super.getStatus(),
                pattern: this.patternState.currentPatternName,
                era: this.patternState.era,
                bar: this.patternState.bar,
                step: this.patternState.step,
                root: this.harmony.root,
                chord: this.harmony.currentChord,
                sound: { ...this.sound }
            };
        }
    }

    // Register the agent type
    registerAgentType('bass', BassMindAgent);

    // ═══════════════════════════════════════════════════════════════════════
    // SINGLETON INSTANCE
    // ═══════════════════════════════════════════════════════════════════════

    let instance = null;

    function getInstance() {
        if (!instance) {
            instance = new BassMindAgent('bass-mind');
            registerAgent(instance);
        }
        return instance;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        BassMindAgent,
        getInstance,
        PATTERN_LIBRARY,
        PROGRESSIONS
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpBassMind;
}
