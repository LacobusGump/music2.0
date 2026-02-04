/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - FX AUDIO MODULE
 * Special effects sounds: risers, sweeps, impacts, transitions
 * ═══════════════════════════════════════════════════════════════════════════
 */

const GumpFX = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // FX PRESETS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Riser presets - upward pitch sweeps for building tension
     */
    const RISER_PRESETS = {
        // White noise riser
        noise_riser: {
            name: 'Noise Riser',
            type: 'noise',
            noiseType: 'white',
            filterStart: 200,
            filterEnd: 8000,
            filterQ: 4,
            resonanceStart: 2,
            resonanceEnd: 12,
            duration: 4,
            curve: 'exponential',
            volume: 0.3
        },

        // Sine sweep riser
        sine_sweep: {
            name: 'Sine Sweep',
            type: 'tone',
            waveform: 'sine',
            freqStart: 100,
            freqEnd: 2000,
            duration: 4,
            curve: 'exponential',
            volume: 0.25
        },

        // Sawtooth riser with filter
        saw_riser: {
            name: 'Saw Riser',
            type: 'tone',
            waveform: 'sawtooth',
            freqStart: 80,
            freqEnd: 400,
            filterStart: 200,
            filterEnd: 4000,
            filterQ: 6,
            duration: 4,
            curve: 'exponential',
            volume: 0.2
        },

        // Harmonic riser
        harmonic_riser: {
            name: 'Harmonic Riser',
            type: 'harmonic',
            baseFreqStart: 50,
            baseFreqEnd: 200,
            harmonics: [1, 2, 3, 4, 5, 6],
            harmonicAmps: [1, 0.5, 0.3, 0.2, 0.15, 0.1],
            filterStart: 300,
            filterEnd: 6000,
            duration: 6,
            curve: 'exponential',
            volume: 0.25
        },

        // Tension riser with vibrato
        tension_riser: {
            name: 'Tension Riser',
            type: 'tone',
            waveform: 'sawtooth',
            freqStart: 60,
            freqEnd: 800,
            vibratoRate: 6,
            vibratoDepthStart: 0,
            vibratoDepthEnd: 30,
            filterStart: 400,
            filterEnd: 8000,
            duration: 8,
            curve: 'linear',
            volume: 0.2
        },

        // Sub bass riser
        sub_riser: {
            name: 'Sub Riser',
            type: 'tone',
            waveform: 'sine',
            freqStart: 30,
            freqEnd: 100,
            distortion: 0.3,
            duration: 4,
            curve: 'exponential',
            volume: 0.4
        },

        // Granular riser
        granular_riser: {
            name: 'Granular Riser',
            type: 'granular',
            pitchStart: 200,
            pitchEnd: 2000,
            density: 20,
            grainDuration: 0.1,
            scatter: 0.5,
            duration: 6,
            curve: 'exponential',
            volume: 0.25
        },

        // Era-specific risers
        genesis_emergence: {
            name: 'Genesis Emergence',
            type: 'harmonic',
            baseFreqStart: 30,
            baseFreqEnd: 120,
            harmonics: [1, 2, 3, 5, 7],
            harmonicAmps: [1, 0.6, 0.4, 0.2, 0.1],
            filterStart: 100,
            filterEnd: 800,
            duration: 10,
            curve: 'exponential',
            volume: 0.2
        },

        tribal_build: {
            name: 'Tribal Build',
            type: 'noise',
            noiseType: 'pink',
            filterStart: 300,
            filterEnd: 4000,
            filterQ: 8,
            pulse: {
                rate: 4,
                depth: 0.5
            },
            duration: 4,
            curve: 'exponential',
            volume: 0.25
        },

        modern_synth_riser: {
            name: 'Modern Synth Riser',
            type: 'supersaw',
            voices: 7,
            detune: 20,
            freqStart: 100,
            freqEnd: 800,
            filterStart: 500,
            filterEnd: 10000,
            filterQ: 4,
            duration: 4,
            curve: 'exponential',
            volume: 0.2
        }
    };

    /**
     * Downlifter presets - downward pitch sweeps for drops/transitions
     */
    const DOWNLIFTER_PRESETS = {
        // Noise downlifter
        noise_down: {
            name: 'Noise Down',
            type: 'noise',
            noiseType: 'white',
            filterStart: 8000,
            filterEnd: 200,
            filterQ: 4,
            duration: 2,
            curve: 'exponential',
            volume: 0.3
        },

        // Bass drop
        bass_drop: {
            name: 'Bass Drop',
            type: 'tone',
            waveform: 'sine',
            freqStart: 200,
            freqEnd: 30,
            distortion: 0.4,
            duration: 1.5,
            curve: 'exponential',
            volume: 0.5
        },

        // Laser down
        laser_down: {
            name: 'Laser Down',
            type: 'tone',
            waveform: 'sawtooth',
            freqStart: 2000,
            freqEnd: 50,
            filterStart: 8000,
            filterEnd: 200,
            duration: 0.5,
            curve: 'exponential',
            volume: 0.2
        },

        // Swoop down
        swoop_down: {
            name: 'Swoop Down',
            type: 'tone',
            waveform: 'sine',
            freqStart: 1000,
            freqEnd: 100,
            vibratoRate: 4,
            vibratoDepth: 50,
            duration: 2,
            curve: 'exponential',
            volume: 0.25
        },

        // Sub drop
        sub_drop: {
            name: 'Sub Drop',
            type: 'tone',
            waveform: 'sine',
            freqStart: 80,
            freqEnd: 25,
            distortion: 0.5,
            duration: 2,
            curve: 'exponential',
            volume: 0.6
        },

        // Metallic down
        metallic_down: {
            name: 'Metallic Down',
            type: 'harmonic',
            baseFreqStart: 800,
            baseFreqEnd: 100,
            harmonics: [1, 2.4, 3.2, 4.7, 5.8],
            harmonicAmps: [1, 0.4, 0.3, 0.2, 0.1],
            duration: 1,
            curve: 'exponential',
            volume: 0.2
        }
    };

    /**
     * Impact presets - percussive hits and crashes
     */
    const IMPACT_PRESETS = {
        // Deep impact
        deep_impact: {
            name: 'Deep Impact',
            layers: [
                { type: 'sine', freq: 40, decay: 0.8, amp: 1 },
                { type: 'noise', noiseType: 'white', filterFreq: 2000, decay: 0.3, amp: 0.3 }
            ],
            distortion: 0.3,
            volume: 0.6
        },

        // Crash
        crash: {
            name: 'Crash',
            layers: [
                { type: 'noise', noiseType: 'white', filterFreq: 6000, decay: 1.5, amp: 0.8 },
                { type: 'noise', noiseType: 'pink', filterFreq: 2000, decay: 2, amp: 0.4 }
            ],
            reverb: 0.6,
            volume: 0.4
        },

        // Thud
        thud: {
            name: 'Thud',
            layers: [
                { type: 'sine', freq: 60, decay: 0.4, amp: 1 },
                { type: 'sine', freq: 120, decay: 0.2, amp: 0.3 }
            ],
            distortion: 0.5,
            volume: 0.5
        },

        // Slam
        slam: {
            name: 'Slam',
            layers: [
                { type: 'sine', freq: 50, decay: 0.6, amp: 1 },
                { type: 'noise', noiseType: 'brown', filterFreq: 400, decay: 0.5, amp: 0.5 },
                { type: 'noise', noiseType: 'white', filterFreq: 4000, decay: 0.2, amp: 0.2 }
            ],
            distortion: 0.4,
            volume: 0.6
        },

        // Gong
        gong: {
            name: 'Gong',
            layers: [
                { type: 'sine', freq: 100, decay: 4, amp: 0.6 },
                { type: 'sine', freq: 150, decay: 3, amp: 0.4 },
                { type: 'sine', freq: 230, decay: 2, amp: 0.3 },
                { type: 'sine', freq: 350, decay: 1.5, amp: 0.2 }
            ],
            reverb: 0.8,
            volume: 0.4
        },

        // Punch
        punch: {
            name: 'Punch',
            layers: [
                { type: 'sine', freq: 80, pitchDecay: 60, decay: 0.2, amp: 1 },
                { type: 'noise', noiseType: 'white', filterFreq: 1000, decay: 0.1, amp: 0.4 }
            ],
            distortion: 0.6,
            volume: 0.5
        },

        // Cinematic hit
        cinematic_hit: {
            name: 'Cinematic Hit',
            layers: [
                { type: 'sine', freq: 35, decay: 1.5, amp: 1 },
                { type: 'sine', freq: 70, decay: 1, amp: 0.5 },
                { type: 'noise', noiseType: 'brown', filterFreq: 300, decay: 2, amp: 0.4 },
                { type: 'noise', noiseType: 'white', filterFreq: 3000, decay: 0.5, amp: 0.2 }
            ],
            distortion: 0.3,
            reverb: 0.7,
            volume: 0.5
        },

        // Sub boom
        sub_boom: {
            name: 'Sub Boom',
            layers: [
                { type: 'sine', freq: 30, decay: 1.2, amp: 1 },
                { type: 'sine', freq: 60, decay: 0.8, amp: 0.3 }
            ],
            distortion: 0.4,
            volume: 0.7
        }
    };

    /**
     * Sweep presets - filtered noise sweeps
     */
    const SWEEP_PRESETS = {
        // White sweep up
        white_sweep_up: {
            name: 'White Sweep Up',
            noiseType: 'white',
            filterStart: 200,
            filterEnd: 12000,
            filterQ: 8,
            duration: 2,
            curve: 'exponential',
            volume: 0.2
        },

        // White sweep down
        white_sweep_down: {
            name: 'White Sweep Down',
            noiseType: 'white',
            filterStart: 12000,
            filterEnd: 200,
            filterQ: 8,
            duration: 2,
            curve: 'exponential',
            volume: 0.2
        },

        // Pink sweep
        pink_sweep: {
            name: 'Pink Sweep',
            noiseType: 'pink',
            filterStart: 400,
            filterEnd: 8000,
            filterQ: 6,
            duration: 3,
            curve: 'linear',
            volume: 0.25
        },

        // Resonant sweep
        resonant_sweep: {
            name: 'Resonant Sweep',
            noiseType: 'white',
            filterStart: 500,
            filterEnd: 6000,
            filterQ: 20,
            duration: 4,
            curve: 'exponential',
            volume: 0.15
        },

        // Bandpass sweep
        bandpass_sweep: {
            name: 'Bandpass Sweep',
            noiseType: 'white',
            filterType: 'bandpass',
            filterStart: 200,
            filterEnd: 4000,
            filterQ: 12,
            duration: 3,
            curve: 'exponential',
            volume: 0.2
        }
    };

    /**
     * Transition FX organized by type
     */
    const TRANSITION_FX = {
        era_change: {
            genesis_to_primordial: {
                riser: 'genesis_emergence',
                impact: 'deep_impact',
                duration: 4
            },
            primordial_to_tribal: {
                riser: 'tribal_build',
                impact: 'slam',
                downlifter: 'bass_drop',
                duration: 3
            },
            tribal_to_sacred: {
                riser: 'harmonic_riser',
                impact: 'gong',
                duration: 5
            },
            sacred_to_modern: {
                riser: 'modern_synth_riser',
                impact: 'cinematic_hit',
                downlifter: 'sub_drop',
                duration: 4
            }
        },
        unlock: {
            minor: {
                impact: 'thud',
                sweep: 'white_sweep_up'
            },
            major: {
                impact: 'slam',
                riser: 'sine_sweep'
            },
            legendary: {
                riser: 'harmonic_riser',
                impact: 'cinematic_hit',
                sweep: 'resonant_sweep'
            }
        },
        section: {
            build_up: {
                riser: 'noise_riser',
                sweep: 'white_sweep_up'
            },
            drop: {
                downlifter: 'sub_drop',
                impact: 'sub_boom'
            },
            break_down: {
                downlifter: 'noise_down',
                sweep: 'white_sweep_down'
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // FX ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    let audioContext = null;
    let masterGain = null;
    let compressor = null;
    let reverbNode = null;
    let reverbBuffer = null;

    /**
     * Initialize FX engine
     */
    function init(ctx) {
        audioContext = ctx;
        _createMasterChain();
        _createReverbBuffer();
    }

    /**
     * Create master output chain
     */
    function _createMasterChain() {
        if (!audioContext) return;

        // Master gain
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.8;

        // Compressor for impact
        compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 20;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.1;

        // Connect
        masterGain.connect(compressor);
        compressor.connect(audioContext.destination);
    }

    /**
     * Create reverb impulse response
     */
    function _createReverbBuffer() {
        if (!audioContext) return;

        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * 3; // 3 second reverb
        const buffer = audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3);
            }
        }

        reverbBuffer = buffer;

        // Create reverb convolver
        reverbNode = audioContext.createConvolver();
        reverbNode.buffer = reverbBuffer;
    }

    /**
     * Create noise buffer
     */
    function _createNoiseBuffer(type, duration) {
        if (!audioContext) return null;

        const sampleRate = audioContext.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const buffer = audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);

            if (type === 'pink') {
                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                for (let i = 0; i < length; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                    b6 = white * 0.115926;
                }
            } else if (type === 'brown') {
                let lastOut = 0;
                for (let i = 0; i < length; i++) {
                    const white = Math.random() * 2 - 1;
                    data[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = data[i];
                    data[i] *= 3.5;
                }
            } else {
                // White noise
                for (let i = 0; i < length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
            }
        }

        return buffer;
    }

    /**
     * Create distortion curve
     */
    function _createDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const k = amount * 100;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2 / samples) - 1;
            curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) /
                       (Math.PI + k * Math.abs(x));
        }

        return curve;
    }

    /**
     * Get curve function
     */
    function _getCurveFunction(curveType) {
        switch (curveType) {
            case 'exponential':
                return (t) => t * t;
            case 'logarithmic':
                return (t) => Math.log10(1 + t * 9) / Math.log10(10);
            case 'sine':
                return (t) => Math.sin(t * Math.PI / 2);
            case 'linear':
            default:
                return (t) => t;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RISER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Play a riser effect
     */
    function playRiser(presetName, options = {}) {
        const preset = RISER_PRESETS[presetName];
        if (!preset || !audioContext) return null;

        const config = { ...preset, ...options };
        const now = audioContext.currentTime;
        const duration = config.duration || 4;

        let source;
        const nodes = [];

        // Create based on type
        switch (config.type) {
            case 'noise':
                source = _createNoiseRiser(config, now, duration);
                break;
            case 'tone':
                source = _createToneRiser(config, now, duration);
                break;
            case 'harmonic':
                source = _createHarmonicRiser(config, now, duration);
                break;
            case 'supersaw':
                source = _createSupersawRiser(config, now, duration);
                break;
            case 'granular':
                source = _createGranularRiser(config, now, duration);
                break;
            default:
                source = _createNoiseRiser(config, now, duration);
        }

        return source;
    }

    /**
     * Create noise-based riser
     */
    function _createNoiseRiser(config, startTime, duration) {
        const noiseBuffer = _createNoiseBuffer(config.noiseType || 'white', duration + 1);
        if (!noiseBuffer) return null;

        const source = audioContext.createBufferSource();
        source.buffer = noiseBuffer;

        // Filter
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(config.filterStart || 200, startTime);
        filter.Q.setValueAtTime(config.filterQ || 4, startTime);

        // Sweep filter
        const curveFn = _getCurveFunction(config.curve);
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const curvedT = curveFn(t);
            const freq = config.filterStart + (config.filterEnd - config.filterStart) * curvedT;
            const q = (config.resonanceStart || config.filterQ) +
                      ((config.resonanceEnd || config.filterQ) - (config.resonanceStart || config.filterQ)) * curvedT;
            filter.frequency.setValueAtTime(freq, startTime + (duration * t));
            filter.Q.setValueAtTime(q, startTime + (duration * t));
        }

        // Gain envelope
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(config.volume || 0.3, startTime + duration * 0.1);
        gain.gain.setValueAtTime(config.volume || 0.3, startTime + duration * 0.8);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        // Add pulse if specified
        if (config.pulse) {
            const lfo = audioContext.createOscillator();
            const lfoGain = audioContext.createGain();
            lfo.frequency.value = config.pulse.rate;
            lfoGain.gain.value = config.pulse.depth * (config.volume || 0.3);
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);
            lfo.start(startTime);
            lfo.stop(startTime + duration);
        }

        // Connect
        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(startTime);
        source.stop(startTime + duration);

        return { source, filter, gain };
    }

    /**
     * Create tone-based riser
     */
    function _createToneRiser(config, startTime, duration) {
        const osc = audioContext.createOscillator();
        osc.type = config.waveform || 'sine';
        osc.frequency.setValueAtTime(config.freqStart || 100, startTime);

        // Sweep frequency
        const curveFn = _getCurveFunction(config.curve);
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const curvedT = curveFn(t);
            const freq = config.freqStart + (config.freqEnd - config.freqStart) * curvedT;
            osc.frequency.setValueAtTime(freq, startTime + (duration * t));
        }

        // Vibrato if specified
        if (config.vibratoRate) {
            const vibLfo = audioContext.createOscillator();
            const vibGain = audioContext.createGain();
            vibLfo.frequency.value = config.vibratoRate;
            vibGain.gain.setValueAtTime(config.vibratoDepthStart || 0, startTime);
            vibGain.gain.linearRampToValueAtTime(config.vibratoDepthEnd || config.vibratoDepth || 10, startTime + duration);
            vibLfo.connect(vibGain);
            vibGain.connect(osc.frequency);
            vibLfo.start(startTime);
            vibLfo.stop(startTime + duration);
        }

        // Filter if specified
        let filterNode = null;
        if (config.filterStart) {
            filterNode = audioContext.createBiquadFilter();
            filterNode.type = 'lowpass';
            filterNode.frequency.setValueAtTime(config.filterStart, startTime);
            filterNode.Q.setValueAtTime(config.filterQ || 2, startTime);

            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const curvedT = curveFn(t);
                const freq = config.filterStart + (config.filterEnd - config.filterStart) * curvedT;
                filterNode.frequency.setValueAtTime(freq, startTime + (duration * t));
            }
        }

        // Distortion if specified
        let distortion = null;
        if (config.distortion) {
            distortion = audioContext.createWaveShaper();
            distortion.curve = _createDistortionCurve(config.distortion);
            distortion.oversample = '4x';
        }

        // Gain envelope
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(config.volume || 0.25, startTime + duration * 0.1);
        gain.gain.setValueAtTime(config.volume || 0.25, startTime + duration * 0.8);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        // Connect chain
        let lastNode = osc;
        if (filterNode) {
            lastNode.connect(filterNode);
            lastNode = filterNode;
        }
        if (distortion) {
            lastNode.connect(distortion);
            lastNode = distortion;
        }
        lastNode.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);

        return { osc, filter: filterNode, gain, distortion };
    }

    /**
     * Create harmonic riser
     */
    function _createHarmonicRiser(config, startTime, duration) {
        const harmonics = config.harmonics || [1, 2, 3, 4];
        const amps = config.harmonicAmps || harmonics.map((_, i) => 1 / (i + 1));
        const nodes = [];

        const merger = audioContext.createGain();

        for (let i = 0; i < harmonics.length; i++) {
            const osc = audioContext.createOscillator();
            const oscGain = audioContext.createGain();

            osc.type = 'sine';

            // Sweep frequency
            const curveFn = _getCurveFunction(config.curve);
            const steps = 100;
            for (let j = 0; j <= steps; j++) {
                const t = j / steps;
                const curvedT = curveFn(t);
                const baseFreq = config.baseFreqStart + (config.baseFreqEnd - config.baseFreqStart) * curvedT;
                osc.frequency.setValueAtTime(baseFreq * harmonics[i], startTime + (duration * t));
            }

            oscGain.gain.value = amps[i] * 0.2;

            osc.connect(oscGain);
            oscGain.connect(merger);

            osc.start(startTime);
            osc.stop(startTime + duration);

            nodes.push({ osc, gain: oscGain });
        }

        // Filter
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = config.filterQ || 2;

        const curveFn = _getCurveFunction(config.curve);
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const curvedT = curveFn(t);
            const freq = config.filterStart + (config.filterEnd - config.filterStart) * curvedT;
            filter.frequency.setValueAtTime(freq, startTime + (duration * t));
        }

        // Gain envelope
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(config.volume || 0.25, startTime + duration * 0.1);
        gain.gain.setValueAtTime(config.volume || 0.25, startTime + duration * 0.8);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        merger.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        return { nodes, filter, gain };
    }

    /**
     * Create supersaw riser
     */
    function _createSupersawRiser(config, startTime, duration) {
        const voices = config.voices || 7;
        const detune = config.detune || 15;
        const nodes = [];

        const merger = audioContext.createGain();

        for (let i = 0; i < voices; i++) {
            const osc = audioContext.createOscillator();
            const oscGain = audioContext.createGain();

            osc.type = 'sawtooth';
            const detuneAmount = ((i - (voices - 1) / 2) / ((voices - 1) / 2)) * detune;
            osc.detune.value = detuneAmount;

            // Sweep frequency
            const curveFn = _getCurveFunction(config.curve);
            const steps = 100;
            for (let j = 0; j <= steps; j++) {
                const t = j / steps;
                const curvedT = curveFn(t);
                const freq = config.freqStart + (config.freqEnd - config.freqStart) * curvedT;
                osc.frequency.setValueAtTime(freq, startTime + (duration * t));
            }

            oscGain.gain.value = 0.15 / voices;

            osc.connect(oscGain);
            oscGain.connect(merger);

            osc.start(startTime);
            osc.stop(startTime + duration);

            nodes.push({ osc, gain: oscGain });
        }

        // Filter
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = config.filterQ || 4;

        const curveFn = _getCurveFunction(config.curve);
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const curvedT = curveFn(t);
            const freq = config.filterStart + (config.filterEnd - config.filterStart) * curvedT;
            filter.frequency.setValueAtTime(freq, startTime + (duration * t));
        }

        // Gain envelope
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(config.volume || 0.2, startTime + duration * 0.1);
        gain.gain.setValueAtTime(config.volume || 0.2, startTime + duration * 0.8);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        merger.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        return { nodes, filter, gain };
    }

    /**
     * Create granular riser
     */
    function _createGranularRiser(config, startTime, duration) {
        const density = config.density || 20;
        const grainDuration = config.grainDuration || 0.1;

        // Schedule grains
        const grainCount = Math.floor(duration * density);
        const nodes = [];

        for (let i = 0; i < grainCount; i++) {
            const grainTime = startTime + (i / density);
            const progress = i / grainCount;
            const curveFn = _getCurveFunction(config.curve);
            const curvedProgress = curveFn(progress);

            const pitch = config.pitchStart + (config.pitchEnd - config.pitchStart) * curvedProgress;
            const scatter = config.scatter || 0.5;
            const actualPitch = pitch * (1 + (Math.random() - 0.5) * scatter * 0.5);

            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = actualPitch;

            // Grain envelope
            gain.gain.setValueAtTime(0, grainTime);
            gain.gain.linearRampToValueAtTime((config.volume || 0.25) * 0.5, grainTime + grainDuration * 0.1);
            gain.gain.linearRampToValueAtTime(0, grainTime + grainDuration);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(grainTime);
            osc.stop(grainTime + grainDuration);

            nodes.push({ osc, gain });
        }

        return { nodes };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DOWNLIFTER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Play a downlifter effect
     */
    function playDownlifter(presetName, options = {}) {
        const preset = DOWNLIFTER_PRESETS[presetName];
        if (!preset || !audioContext) return null;

        const config = { ...preset, ...options };
        const now = audioContext.currentTime;
        const duration = config.duration || 2;

        // Downlifters are similar to risers but with reversed parameters
        // We can reuse the riser functions with swapped start/end values

        if (config.type === 'noise') {
            return _createNoiseRiser({
                ...config,
                filterStart: config.filterStart,
                filterEnd: config.filterEnd
            }, now, duration);
        } else {
            return _createToneRiser({
                ...config,
                freqStart: config.freqStart,
                freqEnd: config.freqEnd
            }, now, duration);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // IMPACT FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Play an impact sound
     */
    function playImpact(presetName, options = {}) {
        const preset = IMPACT_PRESETS[presetName];
        if (!preset || !audioContext) return null;

        const config = { ...preset, ...options };
        const now = audioContext.currentTime;
        const nodes = [];

        // Master gain for this impact
        const impactGain = audioContext.createGain();
        impactGain.gain.value = config.volume || 0.5;

        // Distortion if specified
        let distortion = null;
        if (config.distortion) {
            distortion = audioContext.createWaveShaper();
            distortion.curve = _createDistortionCurve(config.distortion);
            distortion.oversample = '4x';
        }

        // Create each layer
        for (const layer of config.layers) {
            const layerNodes = _createImpactLayer(layer, now);
            if (layerNodes) {
                if (distortion) {
                    layerNodes.output.connect(distortion);
                } else {
                    layerNodes.output.connect(impactGain);
                }
                nodes.push(layerNodes);
            }
        }

        // Connect distortion if present
        if (distortion) {
            distortion.connect(impactGain);
        }

        // Reverb if specified
        if (config.reverb && reverbNode) {
            const reverbGain = audioContext.createGain();
            reverbGain.gain.value = config.reverb;
            impactGain.connect(reverbGain);
            reverbGain.connect(reverbNode);
            reverbNode.connect(masterGain);
        }

        impactGain.connect(masterGain);

        return { nodes, impactGain, distortion };
    }

    /**
     * Create a single impact layer
     */
    function _createImpactLayer(layer, startTime) {
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(layer.amp || 1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + (layer.decay || 0.5));

        let source;

        if (layer.type === 'noise') {
            const noiseBuffer = _createNoiseBuffer(layer.noiseType || 'white', layer.decay + 0.1);
            source = audioContext.createBufferSource();
            source.buffer = noiseBuffer;

            // Filter
            if (layer.filterFreq) {
                const filter = audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = layer.filterFreq;
                filter.Q.value = layer.filterQ || 1;

                source.connect(filter);
                filter.connect(gain);
            } else {
                source.connect(gain);
            }
        } else {
            // Sine/tone layer
            source = audioContext.createOscillator();
            source.type = layer.type || 'sine';
            source.frequency.setValueAtTime(layer.freq || 100, startTime);

            // Pitch decay if specified
            if (layer.pitchDecay) {
                source.frequency.exponentialRampToValueAtTime(
                    Math.max(20, layer.freq - layer.pitchDecay),
                    startTime + 0.1
                );
            }

            source.connect(gain);
        }

        source.start(startTime);
        source.stop(startTime + (layer.decay || 0.5) + 0.1);

        return { source, gain, output: gain };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SWEEP FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Play a sweep effect
     */
    function playSweep(presetName, options = {}) {
        const preset = SWEEP_PRESETS[presetName];
        if (!preset || !audioContext) return null;

        const config = { ...preset, ...options };
        const now = audioContext.currentTime;
        const duration = config.duration || 2;

        const noiseBuffer = _createNoiseBuffer(config.noiseType || 'white', duration + 0.5);
        const source = audioContext.createBufferSource();
        source.buffer = noiseBuffer;

        // Filter
        const filter = audioContext.createBiquadFilter();
        filter.type = config.filterType || 'lowpass';
        filter.Q.value = config.filterQ || 8;

        // Sweep filter
        const curveFn = _getCurveFunction(config.curve);
        const steps = 100;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const curvedT = curveFn(t);
            const freq = config.filterStart + (config.filterEnd - config.filterStart) * curvedT;
            filter.frequency.setValueAtTime(freq, now + (duration * t));
        }

        // Gain envelope
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(config.volume || 0.2, now + 0.1);
        gain.gain.setValueAtTime(config.volume || 0.2, now + duration - 0.2);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(now);
        source.stop(now + duration);

        return { source, filter, gain };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSITION FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Play era transition FX
     */
    function playEraTransition(fromEra, toEra) {
        const key = `${fromEra}_to_${toEra}`;
        const fx = TRANSITION_FX.era_change[key];
        if (!fx) return null;

        const results = {};

        if (fx.riser) {
            results.riser = playRiser(fx.riser);
        }

        // Delay impact until near end of riser
        if (fx.impact) {
            setTimeout(() => {
                results.impact = playImpact(fx.impact);
            }, (fx.duration || 4) * 800);
        }

        if (fx.downlifter) {
            setTimeout(() => {
                results.downlifter = playDownlifter(fx.downlifter);
            }, (fx.duration || 4) * 900);
        }

        return results;
    }

    /**
     * Play unlock FX
     */
    function playUnlockFX(tier = 'minor') {
        const fx = TRANSITION_FX.unlock[tier];
        if (!fx) return null;

        const results = {};

        if (fx.riser) {
            results.riser = playRiser(fx.riser, { duration: 1 });
        }

        if (fx.impact) {
            setTimeout(() => {
                results.impact = playImpact(fx.impact);
            }, 800);
        }

        if (fx.sweep) {
            results.sweep = playSweep(fx.sweep, { duration: 1.5 });
        }

        return results;
    }

    /**
     * Play section transition FX
     */
    function playSectionFX(type) {
        const fx = TRANSITION_FX.section[type];
        if (!fx) return null;

        const results = {};

        if (fx.riser) {
            results.riser = playRiser(fx.riser);
        }

        if (fx.downlifter) {
            results.downlifter = playDownlifter(fx.downlifter);
        }

        if (fx.impact) {
            results.impact = playImpact(fx.impact);
        }

        if (fx.sweep) {
            results.sweep = playSweep(fx.sweep);
        }

        return results;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // Initialization
        init,

        // Presets
        RISER_PRESETS,
        DOWNLIFTER_PRESETS,
        IMPACT_PRESETS,
        SWEEP_PRESETS,
        TRANSITION_FX,

        // Individual FX
        playRiser,
        playDownlifter,
        playImpact,
        playSweep,

        // Transitions
        playEraTransition,
        playUnlockFX,
        playSectionFX,

        // Utilities
        getRiserPresets: () => Object.keys(RISER_PRESETS),
        getDownlifterPresets: () => Object.keys(DOWNLIFTER_PRESETS),
        getImpactPresets: () => Object.keys(IMPACT_PRESETS),
        getSweepPresets: () => Object.keys(SWEEP_PRESETS)
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpFX;
}
