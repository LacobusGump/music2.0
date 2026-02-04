/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - LEAD MIND AGENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * AI agent specialized in melodic decision-making.
 * Manages lead lines, melodic phrases, ornaments, and expression.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpLeadMind = (function() {
    'use strict';

    if (typeof GumpAgentBase === 'undefined') {
        console.error('[GumpLeadMind] GumpAgentBase not found');
        return {};
    }

    const { Agent, registerAgentType, registerAgent } = GumpAgentBase;

    // ═══════════════════════════════════════════════════════════════════════
    // MELODIC PATTERNS
    // ═══════════════════════════════════════════════════════════════════════

    const MELODIC_PATTERNS = {
        genesis: {
            single_tone: {
                notes: [0],
                rhythm: [16],
                intensity: 0.2
            },
            breath: {
                notes: [0, 2, 0],
                rhythm: [8, 4, 4],
                intensity: 0.25
            },
            rise: {
                notes: [0, 2, 4, 7],
                rhythm: [4, 4, 4, 4],
                intensity: 0.3
            }
        },
        primordial: {
            call: {
                notes: [0, 5, 3, 0],
                rhythm: [4, 4, 4, 4],
                intensity: 0.35
            },
            response: {
                notes: [7, 5, 3, 2, 0],
                rhythm: [2, 2, 4, 4, 4],
                intensity: 0.35
            },
            bird: {
                notes: [12, 14, 12, 10, 12],
                rhythm: [1, 1, 2, 2, 2],
                intensity: 0.4
            },
            wind: {
                notes: [0, 2, 5, 7, 5, 2, 0],
                rhythm: [2, 2, 2, 2, 2, 2, 4],
                intensity: 0.35
            }
        },
        tribal: {
            chant: {
                notes: [0, 0, 3, 5, 3, 0],
                rhythm: [2, 2, 2, 2, 2, 6],
                intensity: 0.5
            },
            ritual: {
                notes: [0, 3, 5, 7, 5, 3, 0],
                rhythm: [2, 2, 2, 2, 2, 2, 4],
                intensity: 0.55
            },
            dance: {
                notes: [0, 0, 5, 0, 7, 5, 0],
                rhythm: [2, 2, 2, 2, 2, 2, 4],
                intensity: 0.6
            },
            trance: {
                notes: [0, 2, 3, 5, 7, 5, 3, 2],
                rhythm: [2, 2, 2, 2, 2, 2, 2, 2],
                intensity: 0.55
            }
        },
        sacred: {
            hymn: {
                notes: [0, 2, 4, 7, 4, 2, 0],
                rhythm: [4, 4, 4, 4, 4, 4, 8],
                intensity: 0.4
            },
            prayer: {
                notes: [0, 4, 7, 12, 7, 4, 0],
                rhythm: [4, 2, 2, 4, 2, 2, 8],
                intensity: 0.45
            },
            ascent: {
                notes: [0, 2, 4, 5, 7, 9, 11, 12],
                rhythm: [2, 2, 2, 2, 2, 2, 2, 4],
                intensity: 0.5
            },
            descend: {
                notes: [12, 11, 9, 7, 5, 4, 2, 0],
                rhythm: [2, 2, 2, 2, 2, 2, 2, 4],
                intensity: 0.45
            }
        },
        modern: {
            riff: {
                notes: [0, 3, 5, 7, 5, 3, 0, 0],
                rhythm: [2, 2, 2, 2, 2, 2, 2, 2],
                intensity: 0.6
            },
            hook: {
                notes: [0, 5, 7, 12, 10, 7, 5, 0],
                rhythm: [2, 2, 2, 4, 2, 2, 2, 4],
                intensity: 0.65
            },
            arpeggio: {
                notes: [0, 4, 7, 12, 7, 4, 0, -5],
                rhythm: [1, 1, 1, 1, 1, 1, 1, 1],
                intensity: 0.55
            },
            synth: {
                notes: [0, 0, 5, 7, 5, 3, 0, 2],
                rhythm: [2, 2, 2, 2, 2, 2, 2, 2],
                intensity: 0.6
            },
            acid: {
                notes: [0, 12, 7, 0, 5, 0, 3, 0],
                rhythm: [2, 1, 1, 2, 1, 1, 2, 2],
                intensity: 0.7
            },
            chip: {
                notes: [0, 12, 7, 12, 0, 12, 5, 7],
                rhythm: [1, 1, 1, 1, 1, 1, 1, 1],
                intensity: 0.55
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ORNAMENT LIBRARY
    // ═══════════════════════════════════════════════════════════════════════

    const ORNAMENTS = {
        trill: {
            pattern: [0, 1, 0, 1, 0],
            timing: [1, 1, 1, 1, 1],
            duration: 5
        },
        mordent: {
            pattern: [0, 1, 0],
            timing: [1, 1, 2],
            duration: 4
        },
        turn: {
            pattern: [1, 0, -1, 0],
            timing: [1, 1, 1, 1],
            duration: 4
        },
        grace: {
            pattern: [-2, 0],
            timing: [1, 7],
            duration: 8
        },
        slide_up: {
            pattern: [-7, -5, -3, -1, 0],
            timing: [1, 1, 1, 1, 4],
            duration: 8
        },
        slide_down: {
            pattern: [7, 5, 3, 1, 0],
            timing: [1, 1, 1, 1, 4],
            duration: 8
        },
        bend: {
            pattern: [0, 1, 2, 2, 1, 0],
            timing: [1, 1, 2, 2, 1, 1],
            duration: 8
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EXPRESSION CURVES
    // ═══════════════════════════════════════════════════════════════════════

    const EXPRESSION_CURVES = {
        flat: (t) => 0.7,
        crescendo: (t) => 0.3 + t * 0.6,
        decrescendo: (t) => 0.9 - t * 0.5,
        swell: (t) => 0.4 + Math.sin(t * Math.PI) * 0.5,
        accent_start: (t) => Math.max(0.4, 1 - t * 0.6),
        accent_end: (t) => 0.4 + t * 0.5,
        tremolo: (t) => 0.5 + Math.sin(t * Math.PI * 8) * 0.3
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LEAD MIND AGENT CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class LeadMindAgent extends Agent {
        constructor(id = 'lead-mind', config = {}) {
            super(id, 'lead', {
                updateRate: 25,
                ...config
            });

            // Melodic state
            this.melodicState = {
                currentPhrase: null,
                phraseIndex: 0,
                phraseStep: 0,
                noteIndex: 0,
                stepAccum: 0,
                era: 'genesis',
                playing: false
            };

            // Pitch state
            this.pitch = {
                root: 440,
                octave: 4,
                scale: 'minor',
                scaleNotes: [0, 2, 3, 5, 7, 8, 10],
                currentNote: null,
                targetNote: null,
                bend: 0
            };

            // Expression
            this.expression = {
                velocity: 0.7,
                vibrato: 0,
                curve: 'flat',
                attack: 0.05,
                release: 0.3
            };

            // Sound
            this.sound = {
                type: 'primordial_tone',
                portamento: 0.05
            };

            // Active notes
            this.activeNotes = new Map();

            // Zone-based melody
            this.zoneInput = {
                active: false,
                currentZone: 'center',
                lastZone: null
            };

            // Phrase memory
            this.phraseMemory = [];
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

            perceptions.playing = this.melodicState.playing;
            perceptions.phrase = this.melodicState.currentPhrase?.name;
            perceptions.noteIndex = this.melodicState.noteIndex;

            return perceptions;
        }

        // ═══════════════════════════════════════════════════════════════════
        // DECISION MAKING
        // ═══════════════════════════════════════════════════════════════════

        getPossibleActions() {
            const actions = [];
            const perceptions = this.perceptions.current;

            // Start/change phrase
            if (this.shouldStartPhrase()) {
                const era = perceptions.era || 'genesis';
                const phrases = Object.keys(MELODIC_PATTERNS[era] || {});

                for (const phrase of phrases) {
                    actions.push({
                        type: 'start_phrase',
                        phrase,
                        era,
                        priority: this.evaluatePhrasefit(phrase, era)
                    });
                }
            }

            // Add ornament
            if (this.shouldAddOrnament()) {
                const ornaments = Object.keys(ORNAMENTS);
                const ornament = ornaments[Math.floor(Math.random() * ornaments.length)];

                actions.push({
                    type: 'add_ornament',
                    ornament,
                    priority: 0.4
                });
            }

            // Change expression
            if (this.shouldChangeExpression()) {
                const curves = Object.keys(EXPRESSION_CURVES);
                const curve = curves[Math.floor(Math.random() * curves.length)];

                actions.push({
                    type: 'change_expression',
                    curve,
                    priority: 0.35
                });
            }

            // Change sound
            if (this.shouldChangeSound()) {
                actions.push({
                    type: 'change_sound',
                    priority: 0.3
                });
            }

            // Zone-based note
            if (this.zoneInput.active && this.hasChanged('zone')) {
                actions.push({
                    type: 'zone_note',
                    zone: perceptions.zone,
                    priority: 0.6
                });
            }

            return actions;
        }

        evaluateAction(action) {
            let score = action.priority || 0.5;
            const perceptions = this.perceptions.current;

            switch (action.type) {
                case 'start_phrase':
                    const pattern = MELODIC_PATTERNS[action.era]?.[action.phrase];
                    if (pattern) {
                        const intensityMatch = 1 - Math.abs(pattern.intensity - (perceptions.dynamics || 0.5));
                        score *= 0.5 + intensityMatch * 0.5;
                    }
                    break;

                case 'add_ornament':
                    score *= perceptions.energy > 0.5 ? 1.2 : 0.8;
                    break;
            }

            return Math.min(1, score);
        }

        // ═══════════════════════════════════════════════════════════════════
        // ACTION EXECUTION
        // ═══════════════════════════════════════════════════════════════════

        executeAction(action) {
            switch (action.type) {
                case 'start_phrase':
                    return this.executeStartPhrase(action.era, action.phrase);

                case 'add_ornament':
                    return this.executeAddOrnament(action.ornament);

                case 'change_expression':
                    return this.executeChangeExpression(action.curve);

                case 'change_sound':
                    return this.executeChangeSound();

                case 'zone_note':
                    return this.executeZoneNote(action.zone);

                default:
                    return null;
            }
        }

        executeStartPhrase(era, phraseName) {
            const pattern = MELODIC_PATTERNS[era]?.[phraseName];
            if (!pattern) return null;

            this.melodicState.currentPhrase = { name: phraseName, ...pattern };
            this.melodicState.phraseIndex++;
            this.melodicState.noteIndex = 0;
            this.melodicState.stepAccum = 0;
            this.melodicState.era = era;
            this.melodicState.playing = true;

            this.emit('phrase.start', { phrase: phraseName, era });

            return { phrase: phraseName };
        }

        executeAddOrnament(ornamentName) {
            const ornament = ORNAMENTS[ornamentName];
            if (!ornament) return null;

            // Queue ornament for next note
            this.remember('pendingOrnament', ornamentName);

            return { ornament: ornamentName };
        }

        executeChangeExpression(curve) {
            if (EXPRESSION_CURVES[curve]) {
                this.expression.curve = curve;
            }

            return { curve };
        }

        executeChangeSound() {
            const era = this.perceptions.current.era || 'genesis';

            const eraSounds = {
                genesis: ['primordial_tone', 'first_voice', 'ethereal_whistle'],
                primordial: ['breath_lead', 'wind_voice', 'water_song', 'bird_call'],
                tribal: ['chant_voice', 'flute_primitive', 'horn_call', 'spirit_whistle'],
                sacred: ['organ_lead', 'choir_lead', 'string_lead', 'flute_sacred'],
                modern: ['saw_lead', 'supersaw_lead', 'acid_lead', 'fm_lead', 'pluck_lead']
            };

            const sounds = eraSounds[era] || eraSounds.modern;
            const dynamics = this.perceptions.current.dynamics || 0.5;
            const index = Math.floor(dynamics * (sounds.length - 0.01));

            this.sound.type = sounds[index];

            if (typeof GumpMelody !== 'undefined') {
                GumpMelody.setLeadType(this.sound.type);
            }

            return { sound: this.sound.type };
        }

        executeZoneNote(zone) {
            const zoneNotes = {
                'top-left': 7,
                'top-center': 5,
                'top-right': 4,
                'center-left': 2,
                'center': 0,
                'center-right': -2,
                'bottom-left': -4,
                'bottom-center': -5,
                'bottom-right': -7
            };

            const noteOffset = zoneNotes[zone] || 0;
            this.playNote(noteOffset);

            return { zone, note: noteOffset };
        }

        // ═══════════════════════════════════════════════════════════════════
        // NOTE PLAYING
        // ═══════════════════════════════════════════════════════════════════

        playNote(scaleOffset, duration = 4, velocity = null) {
            const frequency = this.getFrequencyForOffset(scaleOffset);
            const vel = velocity || this.getExpressionVelocity();

            // Stop previous note if monophonic
            this.stopAll();

            this.pitch.currentNote = scaleOffset;

            if (typeof GumpMelody !== 'undefined') {
                const noteId = GumpMelody.noteOn(
                    frequency,
                    vel * this.state.energy,
                    this.sound.type
                );

                this.activeNotes.set(scaleOffset, {
                    id: noteId,
                    frequency,
                    startTime: performance.now()
                });
            }

            this.emit('note.on', {
                offset: scaleOffset,
                frequency,
                velocity: vel
            });
        }

        stopNote(scaleOffset) {
            const note = this.activeNotes.get(scaleOffset);

            if (note && typeof GumpMelody !== 'undefined') {
                GumpMelody.noteOff(note.id);
            }

            this.activeNotes.delete(scaleOffset);

            this.emit('note.off', { offset: scaleOffset });
        }

        stopAll() {
            for (const [offset, _] of this.activeNotes) {
                this.stopNote(offset);
            }
        }

        getFrequencyForOffset(offset) {
            // Convert scale degree offset to frequency
            const octave = Math.floor(offset / 7);
            const degree = ((offset % 7) + 7) % 7;
            const semitone = this.pitch.scaleNotes[degree];

            const totalSemitones = semitone + octave * 12;

            return this.pitch.root * Math.pow(2, this.pitch.octave - 4) *
                   Math.pow(2, totalSemitones / 12);
        }

        getExpressionVelocity() {
            if (!this.melodicState.currentPhrase) {
                return this.expression.velocity;
            }

            const phrase = this.melodicState.currentPhrase;
            const totalSteps = phrase.rhythm.reduce((a, b) => a + b, 0);
            const progress = this.melodicState.stepAccum / totalSteps;

            const curve = EXPRESSION_CURVES[this.expression.curve] || EXPRESSION_CURVES.flat;

            return curve(progress) * this.expression.velocity;
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP HANDLING
        // ═══════════════════════════════════════════════════════════════════

        onStep(data) {
            if (!this.melodicState.playing || !this.melodicState.currentPhrase) return;

            const phrase = this.melodicState.currentPhrase;
            const stepDuration = phrase.rhythm[this.melodicState.noteIndex];

            this.melodicState.stepAccum++;

            // Check if it's time for next note
            if (this.melodicState.stepAccum >= stepDuration) {
                // Stop current note
                if (this.pitch.currentNote !== null) {
                    this.stopNote(this.pitch.currentNote);
                }

                // Move to next note
                this.melodicState.noteIndex++;
                this.melodicState.stepAccum = 0;

                if (this.melodicState.noteIndex >= phrase.notes.length) {
                    // Phrase complete
                    this.melodicState.playing = false;
                    this.melodicState.currentPhrase = null;
                    this.emit('phrase.complete');
                } else {
                    // Play next note
                    const offset = phrase.notes[this.melodicState.noteIndex];
                    const nextDuration = phrase.rhythm[this.melodicState.noteIndex];

                    // Check for ornament
                    const pendingOrnament = this.recall('pendingOrnament');
                    if (pendingOrnament) {
                        this.playOrnament(offset, pendingOrnament);
                        this.forget('pendingOrnament');
                    } else {
                        this.playNote(offset, nextDuration);
                    }
                }
            }
        }

        onBeat(data) {
            // Could trigger phrase on beat
        }

        onEraChange(data) {
            this.melodicState.era = data.to;
            this.executeChangeSound();
        }

        onZoneEnter(data) {
            this.zoneInput.lastZone = this.zoneInput.currentZone;
            this.zoneInput.currentZone = data.zone;

            // If zone input is active, play note
            if (this.zoneInput.active) {
                this.executeZoneNote(data.zone);
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // ORNAMENTS
        // ═══════════════════════════════════════════════════════════════════

        playOrnament(baseOffset, ornamentName) {
            const ornament = ORNAMENTS[ornamentName];
            if (!ornament) {
                this.playNote(baseOffset);
                return;
            }

            let step = 0;
            const playOrnamentNote = (index) => {
                if (index >= ornament.pattern.length) return;

                const offset = baseOffset + ornament.pattern[index];
                const duration = ornament.timing[index];

                this.playNote(offset, duration, this.getExpressionVelocity() * 0.8);

                step += duration;
                const nextDelay = duration * (60000 / 120 / 4);  // Assuming 120 BPM

                setTimeout(() => {
                    this.stopNote(offset);
                    playOrnamentNote(index + 1);
                }, nextDelay);
            };

            playOrnamentNote(0);
        }

        // ═══════════════════════════════════════════════════════════════════
        // DECISION HELPERS
        // ═══════════════════════════════════════════════════════════════════

        shouldStartPhrase() {
            if (this.melodicState.playing) return false;

            const dynamics = this.perceptions.current.dynamics || 0.5;
            return dynamics > 0.3 && Math.random() < 0.3;
        }

        shouldAddOrnament() {
            if (!this.melodicState.playing) return false;

            const energy = this.perceptions.current.energy || 0.5;
            return energy > 0.5 && Math.random() < 0.15;
        }

        shouldChangeExpression() {
            return this.melodicState.phraseIndex > 0 &&
                   this.melodicState.phraseIndex % 4 === 0;
        }

        shouldChangeSound() {
            return this.hasChanged('era');
        }

        evaluatePhrasefit(phraseName, era) {
            const pattern = MELODIC_PATTERNS[era]?.[phraseName];
            if (!pattern) return 0;

            const dynamics = this.perceptions.current.dynamics || 0.5;
            return 1 - Math.abs(pattern.intensity - dynamics);
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
                    this.expression.velocity = 0.4 + message.data.dynamics * 0.5;
                    break;

                case 'tension.change':
                    this.expression.vibrato = message.data.tension * 0.8;
                    if (typeof GumpMelody !== 'undefined') {
                        GumpMelody.setModWheel(this.expression.vibrato);
                    }
                    break;

                case 'mood.apply':
                    if (message.data.active !== undefined) {
                        this.setEnergy(message.data.active ? 0.5 : 0);
                        if (!message.data.active) {
                            this.stopAll();
                        }
                    }
                    break;

                case 'harmony.change':
                    if (message.data.root) {
                        this.pitch.root = message.data.root;
                    }
                    break;
            }
        }

        handleInstruction(instruction) {
            switch (instruction.action) {
                case 'activate':
                    this.setEnergy(0.5);
                    this.zoneInput.active = true;
                    break;
                case 'deactivate':
                    this.setEnergy(0);
                    this.stopAll();
                    this.zoneInput.active = false;
                    break;
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // LEARNING
        // ═══════════════════════════════════════════════════════════════════

        calculateReward() {
            const playing = this.melodicState.playing || this.activeNotes.size > 0;
            const dynamics = this.perceptions.current.dynamics || 0.5;

            return playing ? (0.5 + dynamics * 0.5) : 0.3;
        }

        // ═══════════════════════════════════════════════════════════════════
        // PUBLIC METHODS
        // ═══════════════════════════════════════════════════════════════════

        setRoot(frequency) {
            this.pitch.root = frequency;
        }

        setScale(scale) {
            const scales = {
                major: [0, 2, 4, 5, 7, 9, 11],
                minor: [0, 2, 3, 5, 7, 8, 10],
                pentatonic: [0, 2, 4, 7, 9],
                blues: [0, 3, 5, 6, 7, 10]
            };

            if (scales[scale]) {
                this.pitch.scale = scale;
                this.pitch.scaleNotes = scales[scale];
            }
        }

        enableZoneInput(enabled = true) {
            this.zoneInput.active = enabled;
        }

        getStatus() {
            return {
                ...super.getStatus(),
                melodic: {
                    phrase: this.melodicState.currentPhrase?.name,
                    playing: this.melodicState.playing,
                    noteIndex: this.melodicState.noteIndex
                },
                pitch: {
                    root: this.pitch.root,
                    currentNote: this.pitch.currentNote
                },
                expression: { ...this.expression },
                sound: this.sound.type,
                zoneInput: this.zoneInput.active
            };
        }
    }

    // Register the agent type
    registerAgentType('lead', LeadMindAgent);

    // Singleton
    let instance = null;

    function getInstance() {
        if (!instance) {
            instance = new LeadMindAgent('lead-mind');
            registerAgent(instance);
        }
        return instance;
    }

    return {
        LeadMindAgent,
        getInstance,
        MELODIC_PATTERNS,
        ORNAMENTS,
        EXPRESSION_CURVES
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpLeadMind;
}
