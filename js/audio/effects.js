/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - AUDIO EFFECTS ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Comprehensive effects processing for the GUMP audio system.
 * Includes reverb, delay, distortion, filters, modulation, and more.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpEffects = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        maxEffectChains: 8,
        defaultWetMix: 0.3,
        impulseLength: 3,       // seconds
        delayMaxTime: 2,        // seconds
        filterRange: { min: 20, max: 20000 }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECT PRESETS
    // ═══════════════════════════════════════════════════════════════════════

    const REVERB_PRESETS = {
        room: {
            decay: 0.8,
            damping: 0.5,
            size: 0.3,
            diffusion: 0.7,
            wet: 0.3
        },
        hall: {
            decay: 2.5,
            damping: 0.3,
            size: 0.8,
            diffusion: 0.9,
            wet: 0.4
        },
        chamber: {
            decay: 1.5,
            damping: 0.4,
            size: 0.5,
            diffusion: 0.8,
            wet: 0.35
        },
        cathedral: {
            decay: 4.0,
            damping: 0.2,
            size: 1.0,
            diffusion: 0.95,
            wet: 0.5
        },
        cave: {
            decay: 3.0,
            damping: 0.6,
            size: 0.9,
            diffusion: 0.6,
            wet: 0.6
        },
        plate: {
            decay: 1.8,
            damping: 0.2,
            size: 0.6,
            diffusion: 0.95,
            wet: 0.4
        },
        spring: {
            decay: 1.2,
            damping: 0.5,
            size: 0.4,
            diffusion: 0.5,
            wet: 0.35
        },
        ambient: {
            decay: 5.0,
            damping: 0.1,
            size: 1.0,
            diffusion: 1.0,
            wet: 0.6
        }
    };

    const DELAY_PRESETS = {
        slap: {
            time: 0.08,
            feedback: 0.1,
            filter: 4000,
            wet: 0.3
        },
        quarter: {
            time: 0.5,
            feedback: 0.4,
            filter: 3000,
            wet: 0.35
        },
        dotted_eighth: {
            time: 0.375,
            feedback: 0.45,
            filter: 2500,
            wet: 0.4
        },
        ping_pong: {
            time: 0.25,
            feedback: 0.5,
            filter: 3500,
            wet: 0.4,
            pingPong: true
        },
        tape: {
            time: 0.3,
            feedback: 0.55,
            filter: 2000,
            wet: 0.4,
            modulation: 0.02
        },
        dub: {
            time: 0.4,
            feedback: 0.7,
            filter: 1500,
            wet: 0.5
        },
        ambient: {
            time: 0.6,
            feedback: 0.6,
            filter: 2000,
            wet: 0.5
        }
    };

    const DISTORTION_PRESETS = {
        soft: {
            amount: 0.2,
            type: 'soft',
            tone: 0.5,
            wet: 0.8
        },
        warm: {
            amount: 0.3,
            type: 'tube',
            tone: 0.4,
            wet: 0.9
        },
        crunch: {
            amount: 0.5,
            type: 'hard',
            tone: 0.6,
            wet: 1.0
        },
        fuzz: {
            amount: 0.8,
            type: 'fuzz',
            tone: 0.5,
            wet: 1.0
        },
        bitcrush: {
            amount: 0.5,
            type: 'bitcrush',
            bits: 8,
            wet: 1.0
        },
        tube: {
            amount: 0.4,
            type: 'tube',
            tone: 0.5,
            wet: 0.9
        }
    };

    const FILTER_PRESETS = {
        lowpass_sweep: {
            type: 'lowpass',
            frequency: 1000,
            Q: 4,
            lfo: { rate: 0.2, depth: 0.5 }
        },
        highpass_sweep: {
            type: 'highpass',
            frequency: 500,
            Q: 2,
            lfo: { rate: 0.15, depth: 0.4 }
        },
        bandpass_wah: {
            type: 'bandpass',
            frequency: 1500,
            Q: 8,
            lfo: { rate: 2, depth: 0.6 }
        },
        resonant_low: {
            type: 'lowpass',
            frequency: 800,
            Q: 12
        },
        telephone: {
            type: 'bandpass',
            frequency: 2000,
            Q: 1
        },
        muffled: {
            type: 'lowpass',
            frequency: 400,
            Q: 1
        }
    };

    const MODULATION_PRESETS = {
        chorus: {
            type: 'chorus',
            rate: 1.5,
            depth: 0.005,
            wet: 0.5
        },
        flanger: {
            type: 'flanger',
            rate: 0.5,
            depth: 0.003,
            feedback: 0.7,
            wet: 0.5
        },
        phaser: {
            type: 'phaser',
            rate: 0.8,
            depth: 0.7,
            stages: 4,
            wet: 0.5
        },
        tremolo: {
            type: 'tremolo',
            rate: 6,
            depth: 0.8
        },
        vibrato: {
            type: 'vibrato',
            rate: 5,
            depth: 0.01
        },
        rotary: {
            type: 'rotary',
            rate: 1.5,
            depth: 0.3,
            wet: 0.6
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    let audioContext = null;
    const effectInstances = new Map();
    const effectChains = new Map();
    let nextEffectId = 0;

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(ctx) {
        audioContext = ctx;
        console.log('[GumpEffects] Initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REVERB
    // ═══════════════════════════════════════════════════════════════════════

    function createReverb(preset = 'room') {
        const settings = REVERB_PRESETS[preset] || REVERB_PRESETS.room;

        const convolver = audioContext.createConvolver();
        const wetGain = audioContext.createGain();
        const dryGain = audioContext.createGain();
        const outputGain = audioContext.createGain();

        // Generate impulse response
        convolver.buffer = generateImpulseResponse(settings);

        // Set wet/dry mix
        wetGain.gain.value = settings.wet;
        dryGain.gain.value = 1 - settings.wet;

        // Create input node
        const inputGain = audioContext.createGain();

        // Connect signal chain
        inputGain.connect(convolver);
        inputGain.connect(dryGain);
        convolver.connect(wetGain);
        wetGain.connect(outputGain);
        dryGain.connect(outputGain);

        const effect = {
            id: nextEffectId++,
            type: 'reverb',
            preset,
            settings: { ...settings },
            input: inputGain,
            output: outputGain,
            nodes: { convolver, wetGain, dryGain },

            setWet(value) {
                this.settings.wet = value;
                wetGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.05);
                dryGain.gain.setTargetAtTime(1 - value, audioContext.currentTime, 0.05);
            },

            setDecay(value) {
                this.settings.decay = value;
                convolver.buffer = generateImpulseResponse(this.settings);
            },

            dispose() {
                inputGain.disconnect();
                convolver.disconnect();
                wetGain.disconnect();
                dryGain.disconnect();
                outputGain.disconnect();
                effectInstances.delete(this.id);
            }
        };

        effectInstances.set(effect.id, effect);
        return effect;
    }

    function generateImpulseResponse(settings) {
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * settings.decay;
        const impulse = audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const decay = Math.exp(-3 * t / settings.decay);

                // Apply damping (high frequency rolloff)
                const damping = Math.exp(-settings.damping * t * 5);

                // Diffusion affects early reflection density
                const diffusion = settings.diffusion;
                let sample = (Math.random() * 2 - 1) * decay * damping;

                // Add early reflections
                if (t < 0.1) {
                    const earlyGain = (1 - t / 0.1) * 0.3;
                    const earlyReflections = Math.sin(t * 1000 * settings.size) * earlyGain;
                    sample += earlyReflections * diffusion;
                }

                // Stereo decorrelation
                if (channel === 1) {
                    sample *= (Math.random() * 0.1 + 0.95);
                }

                data[i] = sample * settings.size;
            }
        }

        return impulse;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELAY
    // ═══════════════════════════════════════════════════════════════════════

    function createDelay(preset = 'quarter') {
        const settings = DELAY_PRESETS[preset] || DELAY_PRESETS.quarter;

        const inputGain = audioContext.createGain();
        const outputGain = audioContext.createGain();
        const wetGain = audioContext.createGain();
        const dryGain = audioContext.createGain();

        const delayNode = audioContext.createDelay(CONFIG.delayMaxTime);
        const feedbackGain = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();

        // Configure nodes
        delayNode.delayTime.value = settings.time;
        feedbackGain.gain.value = settings.feedback;
        filterNode.type = 'lowpass';
        filterNode.frequency.value = settings.filter;

        wetGain.gain.value = settings.wet;
        dryGain.gain.value = 1 - settings.wet;

        // Connect signal chain
        inputGain.connect(delayNode);
        inputGain.connect(dryGain);

        delayNode.connect(filterNode);
        filterNode.connect(feedbackGain);
        feedbackGain.connect(delayNode);
        filterNode.connect(wetGain);

        wetGain.connect(outputGain);
        dryGain.connect(outputGain);

        // Add modulation if specified
        let modLFO = null;
        let modGain = null;
        if (settings.modulation) {
            modLFO = audioContext.createOscillator();
            modGain = audioContext.createGain();

            modLFO.frequency.value = 0.5;
            modGain.gain.value = settings.modulation;

            modLFO.connect(modGain);
            modGain.connect(delayNode.delayTime);
            modLFO.start();
        }

        const effect = {
            id: nextEffectId++,
            type: 'delay',
            preset,
            settings: { ...settings },
            input: inputGain,
            output: outputGain,
            nodes: { delayNode, feedbackGain, filterNode, wetGain, dryGain, modLFO, modGain },

            setTime(value) {
                this.settings.time = value;
                delayNode.delayTime.setTargetAtTime(value, audioContext.currentTime, 0.05);
            },

            setFeedback(value) {
                this.settings.feedback = Math.min(0.95, value);
                feedbackGain.gain.setTargetAtTime(this.settings.feedback, audioContext.currentTime, 0.05);
            },

            setFilter(value) {
                this.settings.filter = value;
                filterNode.frequency.setTargetAtTime(value, audioContext.currentTime, 0.05);
            },

            setWet(value) {
                this.settings.wet = value;
                wetGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.05);
                dryGain.gain.setTargetAtTime(1 - value, audioContext.currentTime, 0.05);
            },

            syncToBPM(bpm, division = 1) {
                const beatDuration = 60 / bpm;
                this.setTime(beatDuration * division);
            },

            dispose() {
                if (modLFO) modLFO.stop();
                inputGain.disconnect();
                delayNode.disconnect();
                feedbackGain.disconnect();
                filterNode.disconnect();
                wetGain.disconnect();
                dryGain.disconnect();
                outputGain.disconnect();
                effectInstances.delete(this.id);
            }
        };

        effectInstances.set(effect.id, effect);
        return effect;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DISTORTION
    // ═══════════════════════════════════════════════════════════════════════

    function createDistortion(preset = 'soft') {
        const settings = DISTORTION_PRESETS[preset] || DISTORTION_PRESETS.soft;

        const inputGain = audioContext.createGain();
        const outputGain = audioContext.createGain();
        const wetGain = audioContext.createGain();
        const dryGain = audioContext.createGain();

        const waveshaper = audioContext.createWaveShaper();
        const toneFilter = audioContext.createBiquadFilter();

        // Generate distortion curve
        waveshaper.curve = generateDistortionCurve(settings.amount, settings.type);
        waveshaper.oversample = '4x';

        // Tone control
        toneFilter.type = 'lowpass';
        toneFilter.frequency.value = 1000 + settings.tone * 10000;

        wetGain.gain.value = settings.wet;
        dryGain.gain.value = 1 - settings.wet;

        // Connect signal chain
        inputGain.connect(waveshaper);
        inputGain.connect(dryGain);

        waveshaper.connect(toneFilter);
        toneFilter.connect(wetGain);

        wetGain.connect(outputGain);
        dryGain.connect(outputGain);

        const effect = {
            id: nextEffectId++,
            type: 'distortion',
            preset,
            settings: { ...settings },
            input: inputGain,
            output: outputGain,
            nodes: { waveshaper, toneFilter, wetGain, dryGain },

            setAmount(value) {
                this.settings.amount = value;
                waveshaper.curve = generateDistortionCurve(value, this.settings.type);
            },

            setTone(value) {
                this.settings.tone = value;
                toneFilter.frequency.setTargetAtTime(
                    1000 + value * 10000,
                    audioContext.currentTime,
                    0.05
                );
            },

            setWet(value) {
                this.settings.wet = value;
                wetGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.05);
                dryGain.gain.setTargetAtTime(1 - value, audioContext.currentTime, 0.05);
            },

            dispose() {
                inputGain.disconnect();
                waveshaper.disconnect();
                toneFilter.disconnect();
                wetGain.disconnect();
                dryGain.disconnect();
                outputGain.disconnect();
                effectInstances.delete(this.id);
            }
        };

        effectInstances.set(effect.id, effect);
        return effect;
    }

    function generateDistortionCurve(amount, type = 'soft') {
        const samples = 44100;
        const curve = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const x = (i * 2 / samples) - 1;

            switch (type) {
                case 'soft':
                    curve[i] = Math.tanh(x * (1 + amount * 3));
                    break;

                case 'hard':
                    const threshold = 1 - amount * 0.9;
                    if (x > threshold) {
                        curve[i] = threshold + (x - threshold) * 0.1;
                    } else if (x < -threshold) {
                        curve[i] = -threshold + (x + threshold) * 0.1;
                    } else {
                        curve[i] = x;
                    }
                    break;

                case 'tube':
                    const k = amount * 50 + 1;
                    curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
                    break;

                case 'fuzz':
                    curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 1 - amount * 0.9);
                    break;

                case 'bitcrush':
                    const bits = Math.max(1, 16 - Math.floor(amount * 14));
                    const levels = Math.pow(2, bits);
                    curve[i] = Math.round(x * levels) / levels;
                    break;

                default:
                    curve[i] = Math.tanh(x * (1 + amount * 2));
            }
        }

        return curve;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILTER
    // ═══════════════════════════════════════════════════════════════════════

    function createFilter(preset = 'lowpass_sweep') {
        const settings = FILTER_PRESETS[preset] || {
            type: 'lowpass',
            frequency: 1000,
            Q: 1
        };

        const inputGain = audioContext.createGain();
        const outputGain = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();

        filterNode.type = settings.type;
        filterNode.frequency.value = settings.frequency;
        filterNode.Q.value = settings.Q;

        inputGain.connect(filterNode);
        filterNode.connect(outputGain);

        // Add LFO if specified
        let lfo = null;
        let lfoGain = null;
        if (settings.lfo) {
            lfo = audioContext.createOscillator();
            lfoGain = audioContext.createGain();

            lfo.frequency.value = settings.lfo.rate;
            lfoGain.gain.value = settings.frequency * settings.lfo.depth;

            lfo.connect(lfoGain);
            lfoGain.connect(filterNode.frequency);
            lfo.start();
        }

        const effect = {
            id: nextEffectId++,
            type: 'filter',
            preset,
            settings: { ...settings },
            input: inputGain,
            output: outputGain,
            nodes: { filterNode, lfo, lfoGain },

            setFrequency(value) {
                this.settings.frequency = value;
                filterNode.frequency.setTargetAtTime(value, audioContext.currentTime, 0.05);
                if (lfoGain && this.settings.lfo) {
                    lfoGain.gain.value = value * this.settings.lfo.depth;
                }
            },

            setQ(value) {
                this.settings.Q = value;
                filterNode.Q.setTargetAtTime(value, audioContext.currentTime, 0.05);
            },

            setType(type) {
                filterNode.type = type;
                this.settings.type = type;
            },

            setLFORate(rate) {
                if (lfo) {
                    lfo.frequency.setTargetAtTime(rate, audioContext.currentTime, 0.05);
                    if (this.settings.lfo) this.settings.lfo.rate = rate;
                }
            },

            setLFODepth(depth) {
                if (lfoGain && this.settings.lfo) {
                    this.settings.lfo.depth = depth;
                    lfoGain.gain.value = this.settings.frequency * depth;
                }
            },

            dispose() {
                if (lfo) lfo.stop();
                inputGain.disconnect();
                filterNode.disconnect();
                outputGain.disconnect();
                effectInstances.delete(this.id);
            }
        };

        effectInstances.set(effect.id, effect);
        return effect;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODULATION EFFECTS
    // ═══════════════════════════════════════════════════════════════════════

    function createChorus(settings = {}) {
        const config = {
            rate: settings.rate || 1.5,
            depth: settings.depth || 0.005,
            wet: settings.wet || 0.5,
            voices: settings.voices || 3
        };

        const inputGain = audioContext.createGain();
        const outputGain = audioContext.createGain();
        const wetGain = audioContext.createGain();
        const dryGain = audioContext.createGain();

        wetGain.gain.value = config.wet;
        dryGain.gain.value = 1 - config.wet;

        inputGain.connect(dryGain);
        dryGain.connect(outputGain);

        // Create chorus voices
        const voices = [];
        for (let i = 0; i < config.voices; i++) {
            const delay = audioContext.createDelay(0.1);
            const lfo = audioContext.createOscillator();
            const lfoGain = audioContext.createGain();
            const voiceGain = audioContext.createGain();

            const baseDelay = 0.02 + (i * 0.005);
            delay.delayTime.value = baseDelay;

            lfo.frequency.value = config.rate * (1 + i * 0.1);
            lfoGain.gain.value = config.depth;

            voiceGain.gain.value = 1 / config.voices;

            lfo.connect(lfoGain);
            lfoGain.connect(delay.delayTime);

            inputGain.connect(delay);
            delay.connect(voiceGain);
            voiceGain.connect(wetGain);

            lfo.start();

            voices.push({ delay, lfo, lfoGain, voiceGain });
        }

        wetGain.connect(outputGain);

        const effect = {
            id: nextEffectId++,
            type: 'chorus',
            settings: config,
            input: inputGain,
            output: outputGain,
            voices,

            setRate(value) {
                config.rate = value;
                voices.forEach((v, i) => {
                    v.lfo.frequency.setTargetAtTime(
                        value * (1 + i * 0.1),
                        audioContext.currentTime,
                        0.05
                    );
                });
            },

            setDepth(value) {
                config.depth = value;
                voices.forEach(v => {
                    v.lfoGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.05);
                });
            },

            setWet(value) {
                config.wet = value;
                wetGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.05);
                dryGain.gain.setTargetAtTime(1 - value, audioContext.currentTime, 0.05);
            },

            dispose() {
                voices.forEach(v => {
                    v.lfo.stop();
                    v.delay.disconnect();
                    v.lfoGain.disconnect();
                    v.voiceGain.disconnect();
                });
                inputGain.disconnect();
                wetGain.disconnect();
                dryGain.disconnect();
                outputGain.disconnect();
                effectInstances.delete(this.id);
            }
        };

        effectInstances.set(effect.id, effect);
        return effect;
    }

    function createPhaser(settings = {}) {
        const config = {
            rate: settings.rate || 0.8,
            depth: settings.depth || 0.7,
            stages: settings.stages || 4,
            feedback: settings.feedback || 0.5,
            wet: settings.wet || 0.5
        };

        const inputGain = audioContext.createGain();
        const outputGain = audioContext.createGain();
        const wetGain = audioContext.createGain();
        const dryGain = audioContext.createGain();
        const feedbackGain = audioContext.createGain();

        wetGain.gain.value = config.wet;
        dryGain.gain.value = 1 - config.wet;
        feedbackGain.gain.value = config.feedback;

        // Create allpass filter stages
        const filters = [];
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();

        lfo.frequency.value = config.rate;
        lfoGain.gain.value = 1000 * config.depth;

        let lastNode = inputGain;

        for (let i = 0; i < config.stages; i++) {
            const allpass = audioContext.createBiquadFilter();
            allpass.type = 'allpass';
            allpass.frequency.value = 1000 + i * 200;
            allpass.Q.value = 0.5;

            lfo.connect(lfoGain);
            lfoGain.connect(allpass.frequency);

            lastNode.connect(allpass);
            lastNode = allpass;
            filters.push(allpass);
        }

        lastNode.connect(wetGain);
        lastNode.connect(feedbackGain);
        feedbackGain.connect(inputGain);

        inputGain.connect(dryGain);
        wetGain.connect(outputGain);
        dryGain.connect(outputGain);

        lfo.start();

        const effect = {
            id: nextEffectId++,
            type: 'phaser',
            settings: config,
            input: inputGain,
            output: outputGain,
            nodes: { filters, lfo, lfoGain, feedbackGain },

            setRate(value) {
                config.rate = value;
                lfo.frequency.setTargetAtTime(value, audioContext.currentTime, 0.05);
            },

            setDepth(value) {
                config.depth = value;
                lfoGain.gain.setTargetAtTime(1000 * value, audioContext.currentTime, 0.05);
            },

            setFeedback(value) {
                config.feedback = Math.min(0.95, value);
                feedbackGain.gain.setTargetAtTime(config.feedback, audioContext.currentTime, 0.05);
            },

            setWet(value) {
                config.wet = value;
                wetGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.05);
                dryGain.gain.setTargetAtTime(1 - value, audioContext.currentTime, 0.05);
            },

            dispose() {
                lfo.stop();
                filters.forEach(f => f.disconnect());
                inputGain.disconnect();
                wetGain.disconnect();
                dryGain.disconnect();
                feedbackGain.disconnect();
                outputGain.disconnect();
                effectInstances.delete(this.id);
            }
        };

        effectInstances.set(effect.id, effect);
        return effect;
    }

    function createTremolo(settings = {}) {
        const config = {
            rate: settings.rate || 6,
            depth: settings.depth || 0.8,
            wave: settings.wave || 'sine'
        };

        const inputGain = audioContext.createGain();
        const outputGain = audioContext.createGain();
        const tremoloGain = audioContext.createGain();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        const dcOffset = audioContext.createConstantSource();

        lfo.type = config.wave;
        lfo.frequency.value = config.rate;

        // Tremolo modulates amplitude
        // LFO output: -1 to 1
        // We want gain to go from (1-depth) to 1
        lfoGain.gain.value = config.depth / 2;
        dcOffset.offset.value = 1 - config.depth / 2;

        lfo.connect(lfoGain);
        lfoGain.connect(tremoloGain.gain);
        dcOffset.connect(tremoloGain.gain);

        inputGain.connect(tremoloGain);
        tremoloGain.connect(outputGain);

        lfo.start();
        dcOffset.start();

        const effect = {
            id: nextEffectId++,
            type: 'tremolo',
            settings: config,
            input: inputGain,
            output: outputGain,
            nodes: { tremoloGain, lfo, lfoGain, dcOffset },

            setRate(value) {
                config.rate = value;
                lfo.frequency.setTargetAtTime(value, audioContext.currentTime, 0.05);
            },

            setDepth(value) {
                config.depth = value;
                lfoGain.gain.setTargetAtTime(value / 2, audioContext.currentTime, 0.05);
                dcOffset.offset.setTargetAtTime(1 - value / 2, audioContext.currentTime, 0.05);
            },

            setWave(wave) {
                config.wave = wave;
                lfo.type = wave;
            },

            dispose() {
                lfo.stop();
                dcOffset.stop();
                inputGain.disconnect();
                tremoloGain.disconnect();
                lfoGain.disconnect();
                outputGain.disconnect();
                effectInstances.delete(this.id);
            }
        };

        effectInstances.set(effect.id, effect);
        return effect;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMPRESSOR
    // ═══════════════════════════════════════════════════════════════════════

    function createCompressor(settings = {}) {
        const config = {
            threshold: settings.threshold || -24,
            knee: settings.knee || 30,
            ratio: settings.ratio || 12,
            attack: settings.attack || 0.003,
            release: settings.release || 0.25
        };

        const inputGain = audioContext.createGain();
        const outputGain = audioContext.createGain();
        const compressor = audioContext.createDynamicsCompressor();

        compressor.threshold.value = config.threshold;
        compressor.knee.value = config.knee;
        compressor.ratio.value = config.ratio;
        compressor.attack.value = config.attack;
        compressor.release.value = config.release;

        inputGain.connect(compressor);
        compressor.connect(outputGain);

        const effect = {
            id: nextEffectId++,
            type: 'compressor',
            settings: config,
            input: inputGain,
            output: outputGain,
            nodes: { compressor },

            setThreshold(value) {
                config.threshold = value;
                compressor.threshold.setTargetAtTime(value, audioContext.currentTime, 0.05);
            },

            setRatio(value) {
                config.ratio = value;
                compressor.ratio.setTargetAtTime(value, audioContext.currentTime, 0.05);
            },

            setAttack(value) {
                config.attack = value;
                compressor.attack.setTargetAtTime(value, audioContext.currentTime, 0.05);
            },

            setRelease(value) {
                config.release = value;
                compressor.release.setTargetAtTime(value, audioContext.currentTime, 0.05);
            },

            getReduction() {
                return compressor.reduction;
            },

            dispose() {
                inputGain.disconnect();
                compressor.disconnect();
                outputGain.disconnect();
                effectInstances.delete(this.id);
            }
        };

        effectInstances.set(effect.id, effect);
        return effect;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECT CHAINS
    // ═══════════════════════════════════════════════════════════════════════

    function createEffectChain(effects = []) {
        const chainId = nextEffectId++;
        const chain = {
            id: chainId,
            effects: [],
            input: audioContext.createGain(),
            output: audioContext.createGain()
        };

        let lastNode = chain.input;

        for (const effectDef of effects) {
            let effect;

            switch (effectDef.type) {
                case 'reverb':
                    effect = createReverb(effectDef.preset);
                    break;
                case 'delay':
                    effect = createDelay(effectDef.preset);
                    break;
                case 'distortion':
                    effect = createDistortion(effectDef.preset);
                    break;
                case 'filter':
                    effect = createFilter(effectDef.preset);
                    break;
                case 'chorus':
                    effect = createChorus(effectDef.settings);
                    break;
                case 'phaser':
                    effect = createPhaser(effectDef.settings);
                    break;
                case 'tremolo':
                    effect = createTremolo(effectDef.settings);
                    break;
                case 'compressor':
                    effect = createCompressor(effectDef.settings);
                    break;
                default:
                    continue;
            }

            if (effect) {
                lastNode.connect(effect.input);
                lastNode = effect.output;
                chain.effects.push(effect);
            }
        }

        lastNode.connect(chain.output);

        chain.dispose = function() {
            chain.effects.forEach(e => e.dispose());
            chain.input.disconnect();
            chain.output.disconnect();
            effectChains.delete(chainId);
        };

        chain.bypass = function(bypassed = true) {
            if (bypassed) {
                chain.input.disconnect();
                chain.input.connect(chain.output);
            } else {
                chain.input.disconnect();
                if (chain.effects.length > 0) {
                    chain.input.connect(chain.effects[0].input);
                } else {
                    chain.input.connect(chain.output);
                }
            }
        };

        effectChains.set(chainId, chain);
        return chain;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ERA-SPECIFIC EFFECT CHAINS
    // ═══════════════════════════════════════════════════════════════════════

    function createEraEffectChain(era) {
        const eraEffects = {
            genesis: [
                { type: 'reverb', preset: 'ambient' },
                { type: 'filter', preset: 'muffled' }
            ],
            primordial: [
                { type: 'reverb', preset: 'cave' },
                { type: 'delay', preset: 'ambient' }
            ],
            tribal: [
                { type: 'reverb', preset: 'chamber' },
                { type: 'delay', preset: 'slap' },
                { type: 'compressor', settings: { threshold: -18, ratio: 4 } }
            ],
            sacred: [
                { type: 'reverb', preset: 'cathedral' },
                { type: 'chorus', settings: { rate: 0.5, depth: 0.003 } }
            ],
            modern: [
                { type: 'compressor', settings: { threshold: -12, ratio: 8 } },
                { type: 'reverb', preset: 'plate' },
                { type: 'delay', preset: 'ping_pong' }
            ]
        };

        return createEffectChain(eraEffects[era] || eraEffects.modern);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function getEffect(id) {
        return effectInstances.get(id);
    }

    function getAllEffects() {
        return Array.from(effectInstances.values());
    }

    function disposeAll() {
        effectInstances.forEach(e => e.dispose());
        effectChains.forEach(c => c.dispose());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        init,

        // Effect creators
        createReverb,
        createDelay,
        createDistortion,
        createFilter,
        createChorus,
        createPhaser,
        createTremolo,
        createCompressor,

        // Chains
        createEffectChain,
        createEraEffectChain,

        // Management
        getEffect,
        getAllEffects,
        disposeAll,

        // Presets
        REVERB_PRESETS,
        DELAY_PRESETS,
        DISTORTION_PRESETS,
        FILTER_PRESETS,
        MODULATION_PRESETS,

        CONFIG
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpEffects;
}
