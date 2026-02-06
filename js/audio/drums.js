// ═══════════════════════════════════════════════════════════════════════════
// GUMP DRUM SYNTHESIS
// ═══════════════════════════════════════════════════════════════════════════
//
// Comprehensive drum synthesis including:
// - 808 kicks (deep, distorted, short, long)
// - Organic drums (tribal, wooden, skin)
// - Modern drums (trap hats, snares)
// - Percussion (shakers, clicks, toms)
//
// ═══════════════════════════════════════════════════════════════════════════

const GumpDrums = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // DRUM CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    const DRUM_TYPES = {
        // 808 Variants
        KICK_808_DEEP: '808_deep',
        KICK_808_SHORT: '808_short',
        KICK_808_DISTORTED: '808_dist',
        KICK_808_PUNCHY: '808_punchy',
        KICK_808_SUB: '808_sub',

        // Lofi Kicks (In Rainbows aesthetic)
        KICK_LOFI: 'kick_lofi',
        KICK_LOFI_WARM: 'kick_lofi_warm',

        // Organic Kicks
        KICK_ORGANIC: 'kick_organic',
        KICK_TRIBAL: 'kick_tribal',
        KICK_ACOUSTIC: 'kick_acoustic',

        // Snares
        SNARE_808: 'snare_808',
        SNARE_TRAP: 'snare_trap',
        SNARE_CLAP: 'snare_clap',
        SNARE_RIM: 'snare_rim',
        SNARE_ORGANIC: 'snare_organic',
        SNARE_LOFI: 'snare_lofi',

        // Hi-Hats
        HAT_CLOSED: 'hat_closed',
        HAT_OPEN: 'hat_open',
        HAT_PEDAL: 'hat_pedal',
        HAT_TRAP: 'hat_trap',
        HAT_LOFI: 'hat_lofi',

        // Percussion
        PERC_CLICK: 'perc_click',
        PERC_WOOD: 'perc_wood',
        PERC_STONE: 'perc_stone',
        PERC_SHAKER: 'perc_shaker',
        PERC_CONGA: 'perc_conga',
        PERC_BONGO: 'perc_bongo',
        PERC_TOM_HIGH: 'perc_tom_high',
        PERC_TOM_LOW: 'perc_tom_low',
    };

    // ═══════════════════════════════════════════════════════════════════════
    // DRUM STATE
    // ═══════════════════════════════════════════════════════════════════════

    const drumState = {
        ctx: null,
        output: null,
        distortion: null,

        // Cached buffers for repeated hits
        buffers: {},

        // Active one-shots
        activeHits: new Map(),

        // Pattern state
        patterns: {},
        currentPattern: null,
        stepIndex: 0,
        isPlaying: false,

        // Swing
        swing: 0.15,

        // Velocity layers
        velocityRange: [0.6, 1.0],

        // Global parameters
        drive: 0.3,
        tone: 0.5,
        attack: 1.0,
        release: 1.0,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(audioContext, outputNode) {
        drumState.ctx = audioContext;
        drumState.output = outputNode || audioContext.destination;

        // Create global distortion for drums
        drumState.distortion = createDistortion(drumState.drive);

        // Create global bitcrusher for lofi character
        drumState.bitcrusher = createBitcrusher(12);  // 12-bit default

        // Create tape saturation
        drumState.tapeSaturation = createTapeSaturation(0.3);

        console.log('[Drums] Synthesis initialized with lofi processing');
    }

    function createDistortion(amount = 0.3) {
        const ctx = drumState.ctx;
        const waveshaper = ctx.createWaveShaper();
        waveshaper.curve = makeDistortionCurve(amount * 400);
        waveshaper.oversample = '4x';
        return waveshaper;
    }

    function makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) /
                       (Math.PI + amount * Math.abs(x));
        }

        return curve;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOFI PROCESSING - Bitcrusher & Tape Saturation
    // ═══════════════════════════════════════════════════════════════════════

    function createBitcrusher(bits = 12) {
        const ctx = drumState.ctx;
        const bufferSize = 4096;

        // ScriptProcessor for bitcrushing
        const crusher = ctx.createScriptProcessor(bufferSize, 2, 2);
        const step = Math.pow(0.5, bits);

        crusher.bits = bits;
        crusher.onaudioprocess = function(e) {
            const inputL = e.inputBuffer.getChannelData(0);
            const inputR = e.inputBuffer.getChannelData(1);
            const outputL = e.outputBuffer.getChannelData(0);
            const outputR = e.outputBuffer.getChannelData(1);

            for (let i = 0; i < inputL.length; i++) {
                // Quantize to lower bit depth
                outputL[i] = Math.round(inputL[i] / step) * step;
                outputR[i] = Math.round(inputR[i] / step) * step;
            }
        };

        return crusher;
    }

    function createTapeSaturation(amount = 0.3) {
        const ctx = drumState.ctx;
        const waveshaper = ctx.createWaveShaper();

        // Soft tape-like saturation curve
        const samples = 44100;
        const curve = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            // Soft clipping with asymmetry for tape character
            curve[i] = Math.tanh(x * (1 + amount * 2)) * (1 - amount * 0.1);
        }

        waveshaper.curve = curve;
        waveshaper.oversample = '2x';
        return waveshaper;
    }

    // LOFI PRESETS - In Rainbows aesthetic
    const LOFI_PRESETS = {
        // Lofi kick - warm, round, less attack
        kick: {
            freq: 42,
            pitchDecay: 0.1,
            pitchAmount: 0.8,      // Less dramatic sweep
            bodyDecay: 0.5,
            sustain: 0.5,
            release: 0.6,
            clickAmount: 0.08,     // Very subtle click
            saturation: 0.4,
            bitcrush: 14,          // Light crushing
            filterFreq: 600        // Roll off highs
        },
        // Organic snare - more body, less snap
        snare: {
            toneFreq: 180,
            toneDecay: 0.2,
            noiseDecay: 0.15,
            noiseFilterFreq: 3500, // Darker
            bodyAmount: 0.7,       // More tone body
            saturation: 0.3
        },
        // Dark hi-hats
        hihat: {
            baseFreq: 300,
            brightness: 0.4,       // Much darker
            decay: 0.08,
            filterFreq: 4000
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LOFI DRUM FUNCTIONS - In Rainbows aesthetic
    // ═══════════════════════════════════════════════════════════════════════

    function playLofiKick(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;
        const preset = LOFI_PRESETS.kick;

        const {
            freq = preset.freq,
            pitchDecay = preset.pitchDecay,
            pitchAmount = preset.pitchAmount,
            bodyDecay = preset.bodyDecay,
            sustain = preset.sustain,
            release = preset.release,
            clickAmount = preset.clickAmount,
            saturation = preset.saturation,
            volume = 0.85,
            time = now
        } = options;

        // Fundamental - warm and round
        const fundamental = ctx.createOscillator();
        fundamental.type = 'sine';
        const startFreq = freq * Math.pow(2, pitchAmount);
        fundamental.frequency.setValueAtTime(startFreq, time);
        fundamental.frequency.exponentialRampToValueAtTime(freq, time + pitchDecay);

        const fundGain = ctx.createGain();
        fundGain.gain.setValueAtTime(0, time);
        fundGain.gain.linearRampToValueAtTime(volume, time + 0.005);
        fundGain.gain.linearRampToValueAtTime(volume * sustain, time + bodyDecay);
        fundGain.gain.exponentialRampToValueAtTime(0.001, time + bodyDecay + release);

        // Sub - deep foundation
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = freq * 0.5;

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0, time);
        subGain.gain.linearRampToValueAtTime(volume * 0.7, time + 0.01);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + bodyDecay + release * 1.3);

        // Warmth filter - roll off highs
        const warmFilter = ctx.createBiquadFilter();
        warmFilter.type = 'lowpass';
        warmFilter.frequency.value = 600;
        warmFilter.Q.value = 0.5;

        // Tape saturation
        const satCurve = new Float32Array(44100);
        for (let i = 0; i < 44100; i++) {
            const x = (i * 2) / 44100 - 1;
            satCurve[i] = Math.tanh(x * (1 + saturation * 2.5));
        }
        const saturator = ctx.createWaveShaper();
        saturator.curve = satCurve;
        saturator.oversample = '2x';

        // Output
        const output = ctx.createGain();
        output.gain.value = 1;

        // Routing
        fundamental.connect(fundGain);
        fundGain.connect(warmFilter);
        warmFilter.connect(saturator);
        saturator.connect(output);

        sub.connect(subGain);
        subGain.connect(output);

        output.connect(drumState.output);

        // Start
        fundamental.start(time);
        sub.start(time);

        const stopTime = time + bodyDecay + release + 0.3;
        fundamental.stop(stopTime);
        sub.stop(stopTime);

        setTimeout(() => {
            fundamental.disconnect();
            sub.disconnect();
            output.disconnect();
        }, (stopTime - now + 0.1) * 1000);
    }

    function playLofiSnare(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;
        const preset = LOFI_PRESETS.snare;

        const {
            toneFreq = preset.toneFreq,
            toneDecay = preset.toneDecay,
            noiseDecay = preset.noiseDecay,
            noiseFilterFreq = preset.noiseFilterFreq,
            bodyAmount = preset.bodyAmount,
            volume = 0.7,
            time = now
        } = options;

        // Tone body - more prominent
        const tone = ctx.createOscillator();
        tone.type = 'triangle';
        tone.frequency.setValueAtTime(toneFreq * 1.5, time);
        tone.frequency.exponentialRampToValueAtTime(toneFreq, time + 0.02);

        const toneGain = ctx.createGain();
        toneGain.gain.setValueAtTime(volume * bodyAmount, time);
        toneGain.gain.exponentialRampToValueAtTime(0.001, time + toneDecay);

        // Noise - subtle, filtered dark
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(volume * (1 - bodyAmount * 0.3), time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseDecay);

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = noiseFilterFreq;
        noiseFilter.Q.value = 1.5;

        // Output
        const output = ctx.createGain();

        tone.connect(toneGain);
        toneGain.connect(output);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(output);

        output.connect(drumState.output);

        tone.start(time);
        noise.start(time);

        tone.stop(time + toneDecay + 0.05);
        noise.stop(time + noiseDecay + 0.05);

        setTimeout(() => {
            output.disconnect();
        }, (noiseDecay + 0.2) * 1000);
    }

    function playLofiHat(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;
        const preset = LOFI_PRESETS.hihat;

        const {
            brightness = preset.brightness,
            decay = options.type === 'open' ? 0.25 : preset.decay,
            filterFreq = preset.filterFreq,
            volume = 0.5,
            time = now
        } = options;

        // Metallic oscillators - fewer, darker
        const freqs = [300, 400, 540, 700];
        const oscs = [];
        const gains = [];

        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = f * (1 + brightness);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(volume * (1 - i * 0.2) * 0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

            osc.connect(gain);
            oscs.push(osc);
            gains.push(gain);
        });

        // Dark filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 0.7;

        const output = ctx.createGain();

        gains.forEach(g => g.connect(filter));
        filter.connect(output);
        output.connect(drumState.output);

        oscs.forEach(o => {
            o.start(time);
            o.stop(time + decay + 0.05);
        });

        setTimeout(() => {
            output.disconnect();
        }, (decay + 0.2) * 1000);
    }

    // Lofi kick variant - extra warm
    function playLofiKickWarm(options = {}) {
        return playLofiKick({
            ...options,
            freq: 38,
            saturation: 0.5,
            release: 0.8
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 808 KICKS
    // ═══════════════════════════════════════════════════════════════════════

    function play808Kick(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 40,              // Lower fundamental for more sub
            pitchDecay = 0.12,      // Smooth pitch sweep
            pitchAmount = 1.2,      // Less dramatic sweep, more boom
            bodyDecay = 0.5,        // Longer body
            sustain = 0.4,          // More sustain
            release = 0.8,          // Long release for that boom tail
            clickFreq = 2500,       // Softer click
            clickDecay = 0.008,
            clickAmount = 0.15,     // Less click, more boom
            saturation = 0.3,       // Renamed from distortion - warm saturation
            volume = 0.9,
            time = now,
        } = options;

        // ─────────────────────────────────────────────────────────────────
        // FUNDAMENTAL OSCILLATOR - The chest thump
        // ─────────────────────────────────────────────────────────────────

        const fundamental = ctx.createOscillator();
        fundamental.type = 'sine';

        // Smooth pitch sweep - starts ~1 octave up, sweeps down
        const startFreq = freq * Math.pow(2, pitchAmount);
        fundamental.frequency.setValueAtTime(startFreq, time);
        fundamental.frequency.exponentialRampToValueAtTime(freq, time + pitchDecay);

        // Fundamental envelope - punchy attack, long sustain, smooth release
        const fundGain = ctx.createGain();
        fundGain.gain.setValueAtTime(0, time);
        fundGain.gain.linearRampToValueAtTime(volume, time + 0.003);  // Fast attack
        fundGain.gain.linearRampToValueAtTime(volume * 0.85, time + 0.003 + bodyDecay * sustain);
        fundGain.gain.exponentialRampToValueAtTime(0.001, time + bodyDecay + release);

        // ─────────────────────────────────────────────────────────────────
        // SUB OSCILLATOR - The earthquake
        // ─────────────────────────────────────────────────────────────────

        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = freq * 0.5;  // One octave below

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0, time);
        subGain.gain.linearRampToValueAtTime(volume * 0.8, time + 0.008);  // Slightly delayed
        subGain.gain.linearRampToValueAtTime(volume * 0.6, time + bodyDecay * 0.5);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + bodyDecay + release * 1.2);

        // ─────────────────────────────────────────────────────────────────
        // SECOND HARMONIC - Adds warmth and presence
        // ─────────────────────────────────────────────────────────────────

        const harmonic = ctx.createOscillator();
        harmonic.type = 'sine';
        harmonic.frequency.setValueAtTime(startFreq * 2, time);
        harmonic.frequency.exponentialRampToValueAtTime(freq * 2, time + pitchDecay * 0.8);

        const harmonicGain = ctx.createGain();
        harmonicGain.gain.setValueAtTime(0, time);
        harmonicGain.gain.linearRampToValueAtTime(volume * 0.25, time + 0.002);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, time + bodyDecay * 0.6);

        // ─────────────────────────────────────────────────────────────────
        // CLICK - Subtle attack transient
        // ─────────────────────────────────────────────────────────────────

        const click = ctx.createOscillator();
        click.type = 'triangle';  // Softer than square
        click.frequency.setValueAtTime(clickFreq, time);
        click.frequency.exponentialRampToValueAtTime(clickFreq * 0.3, time + clickDecay);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(volume * clickAmount, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + clickDecay);

        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'lowpass';
        clickFilter.frequency.value = 4000;  // Roll off harsh highs

        // ─────────────────────────────────────────────────────────────────
        // WARM SATURATION - Lo-fi character without killing the sub
        // ─────────────────────────────────────────────────────────────────

        // Parallel saturation - blend clean + saturated
        const saturationAmount = saturation;
        const cleanMix = ctx.createGain();
        cleanMix.gain.value = 1 - saturationAmount * 0.5;  // Keep most of the clean signal

        const satMix = ctx.createGain();
        satMix.gain.value = saturationAmount;

        // Soft saturation curve (tape-style)
        const saturator = ctx.createWaveShaper();
        const samples = 44100;
        const curve = new Float32Array(samples);
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            // Soft clipping - preserves low end better than hard clipping
            curve[i] = Math.tanh(x * (1 + saturationAmount * 2));
        }
        saturator.curve = curve;
        saturator.oversample = '2x';

        // ─────────────────────────────────────────────────────────────────
        // OUTPUT MIXING - Keep the sub clean and powerful
        // ─────────────────────────────────────────────────────────────────

        const output = ctx.createGain();
        output.gain.value = 1;

        // Fundamental goes through parallel saturation
        fundamental.connect(fundGain);
        fundGain.connect(cleanMix);
        fundGain.connect(saturator);
        saturator.connect(satMix);
        cleanMix.connect(output);
        satMix.connect(output);

        // Sub stays COMPLETELY clean - this is your chest thump
        sub.connect(subGain);
        subGain.connect(output);

        // Harmonic adds presence
        harmonic.connect(harmonicGain);
        harmonicGain.connect(output);

        // Click through filter
        click.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(output);

        output.connect(drumState.output);

        // ─────────────────────────────────────────────────────────────────
        // START AND CLEANUP
        // ─────────────────────────────────────────────────────────────────

        fundamental.start(time);
        sub.start(time);
        harmonic.start(time);
        click.start(time);

        const stopTime = time + bodyDecay + release + 0.2;
        fundamental.stop(stopTime);
        sub.stop(stopTime);
        harmonic.stop(time + bodyDecay * 0.7);
        click.stop(time + clickDecay + 0.01);

        // Schedule cleanup
        setTimeout(() => {
            fundamental.disconnect();
            sub.disconnect();
            harmonic.disconnect();
            click.disconnect();
            fundGain.disconnect();
            subGain.disconnect();
            harmonicGain.disconnect();
            clickGain.disconnect();
            output.disconnect();
        }, (stopTime - now) * 1000 + 100);

        return { fundamental, sub, harmonic, click, output };
    }

    function play808Deep(options = {}) {
        // The classic 808 boom - long tail, earthquake sub
        return play808Kick({
            freq: 32,               // Deep fundamental
            pitchDecay: 0.18,       // Smooth sweep
            pitchAmount: 1.0,       // Less pitch movement, more sub
            bodyDecay: 0.7,         // Long body
            sustain: 0.5,
            release: 1.2,           // That long tail
            clickAmount: 0.08,      // Minimal click
            saturation: 0.15,       // Light warmth
            volume: 1.0,
            ...options,
        });
    }

    function play808Short(options = {}) {
        // Punchy 808 - tight and controlled
        return play808Kick({
            freq: 48,               // Higher = tighter
            pitchDecay: 0.06,       // Fast sweep
            pitchAmount: 0.8,
            bodyDecay: 0.25,
            sustain: 0.15,
            release: 0.2,
            clickAmount: 0.25,      // More attack
            saturation: 0.2,
            ...options,
        });
    }

    function play808Distorted(options = {}) {
        // Lo-fi 808 - warm saturation, still has the sub
        return play808Kick({
            freq: 38,
            pitchDecay: 0.1,
            pitchAmount: 1.1,
            bodyDecay: 0.5,
            sustain: 0.35,
            release: 0.6,
            clickAmount: 0.12,
            saturation: 0.7,        // Heavy saturation but sub stays clean
            ...options,
        });
    }

    function play808Sub(options = {}) {
        // Pure sub bass - feel it in your chest
        return play808Kick({
            freq: 28,               // Earthquake territory
            pitchDecay: 0.25,
            pitchAmount: 0.6,       // Minimal pitch movement
            bodyDecay: 1.0,         // Very long
            sustain: 0.7,
            release: 1.5,           // Endless tail
            clickAmount: 0.02,      // Almost no click
            saturation: 0.05,       // Keep it clean
            volume: 1.0,
            ...options,
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ORGANIC KICKS
    // ═══════════════════════════════════════════════════════════════════════

    function playOrganicKick(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 60,
            pitchDecay = 0.1,
            bodyDecay = 0.25,
            skinFreq = 200,
            skinDecay = 0.08,
            noiseAmount = 0.15,
            noiseDecay = 0.03,
            volume = 0.7,
            time = now,
        } = options;

        // Body
        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(freq * 2, time);
        body.frequency.exponentialRampToValueAtTime(freq, time + pitchDecay);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(volume, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + bodyDecay);

        // Skin resonance
        const skin = ctx.createOscillator();
        skin.type = 'triangle';
        skin.frequency.setValueAtTime(skinFreq * 1.5, time);
        skin.frequency.exponentialRampToValueAtTime(skinFreq, time + skinDecay * 0.5);

        const skinGain = ctx.createGain();
        skinGain.gain.setValueAtTime(volume * 0.4, time);
        skinGain.gain.exponentialRampToValueAtTime(0.001, time + skinDecay);

        // Attack noise
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 400;
        noiseFilter.Q.value = 2;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(volume * noiseAmount, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseDecay);

        // Output
        const output = ctx.createGain();
        output.gain.value = 1;

        body.connect(bodyGain);
        bodyGain.connect(output);

        skin.connect(skinGain);
        skinGain.connect(output);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(output);

        output.connect(drumState.output);

        // Start
        body.start(time);
        skin.start(time);
        noise.start(time);

        body.stop(time + bodyDecay + 0.1);
        skin.stop(time + skinDecay + 0.1);
        noise.stop(time + noiseDecay + 0.1);

        setTimeout(() => {
            body.disconnect();
            skin.disconnect();
            noise.disconnect();
            output.disconnect();
        }, bodyDecay * 1000 + 200);

        return { body, skin, noise, output };
    }

    function playTribalKick(options = {}) {
        return playOrganicKick({
            freq: 70,
            pitchDecay: 0.15,
            bodyDecay: 0.35,
            skinFreq: 280,
            skinDecay: 0.12,
            noiseAmount: 0.25,
            noiseDecay: 0.05,
            ...options,
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SNARES
    // ═══════════════════════════════════════════════════════════════════════

    function playSnare808(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            toneFreq = 160,         // Lower body tone
            toneDecay = 0.15,       // Longer tone sustain
            noiseDecay = 0.25,
            noiseFilterFreq = 5000,
            noiseAmount = 0.5,      // Better balance
            bodyAmount = 0.4,       // More body
            volume = 0.7,
            time = now,
        } = options;

        // ─────────────────────────────────────────────────────────────────
        // BODY TONE - The thump of the snare
        // ─────────────────────────────────────────────────────────────────

        const body = ctx.createOscillator();
        body.type = 'sine';  // Clean fundamental
        body.frequency.setValueAtTime(toneFreq * 1.8, time);
        body.frequency.exponentialRampToValueAtTime(toneFreq, time + 0.015);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(volume * bodyAmount, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + toneDecay);

        // ─────────────────────────────────────────────────────────────────
        // HARMONIC TONE - Adds crack and presence
        // ─────────────────────────────────────────────────────────────────

        const harmonic = ctx.createOscillator();
        harmonic.type = 'triangle';
        harmonic.frequency.setValueAtTime(toneFreq * 3.5, time);
        harmonic.frequency.exponentialRampToValueAtTime(toneFreq * 2.5, time + 0.02);

        const harmonicGain = ctx.createGain();
        harmonicGain.gain.setValueAtTime(volume * 0.2, time);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, time + toneDecay * 0.6);

        // ─────────────────────────────────────────────────────────────────
        // SNARE WIRES - The sizzle
        // ─────────────────────────────────────────────────────────────────

        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        // Shape the noise to sound like snare wires
        const noiseHighpass = ctx.createBiquadFilter();
        noiseHighpass.type = 'highpass';
        noiseHighpass.frequency.value = 150;  // Keep some low end in noise

        const noisePeak = ctx.createBiquadFilter();
        noisePeak.type = 'peaking';
        noisePeak.frequency.value = 2500;     // Snare wire presence
        noisePeak.Q.value = 1;
        noisePeak.gain.value = 4;

        const noiseLowpass = ctx.createBiquadFilter();
        noiseLowpass.type = 'lowpass';
        noiseLowpass.frequency.value = noiseFilterFreq;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(volume * noiseAmount, time);
        noiseGain.gain.linearRampToValueAtTime(volume * noiseAmount * 0.6, time + 0.02);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + noiseDecay);

        // ─────────────────────────────────────────────────────────────────
        // OUTPUT
        // ─────────────────────────────────────────────────────────────────

        const output = ctx.createGain();
        output.gain.value = 1;

        body.connect(bodyGain);
        bodyGain.connect(output);

        harmonic.connect(harmonicGain);
        harmonicGain.connect(output);

        noise.connect(noiseHighpass);
        noiseHighpass.connect(noisePeak);
        noisePeak.connect(noiseLowpass);
        noiseLowpass.connect(noiseGain);
        noiseGain.connect(output);

        output.connect(drumState.output);

        body.start(time);
        harmonic.start(time);
        noise.start(time);

        body.stop(time + toneDecay + 0.1);
        harmonic.stop(time + toneDecay * 0.7);
        noise.stop(time + noiseDecay + 0.1);

        setTimeout(() => {
            body.disconnect();
            harmonic.disconnect();
            noise.disconnect();
            output.disconnect();
        }, noiseDecay * 1000 + 200);

        return { body, harmonic, noise, output };
    }

    function playClap(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            filterFreq = 1500,
            decay = 0.15,
            spread = 0.03,
            layers = 4,
            volume = 0.5,
            time = now,
        } = options;

        const output = ctx.createGain();
        output.gain.value = 1;

        // Multiple noise bursts for realistic clap
        for (let i = 0; i < layers; i++) {
            const layerTime = time + i * spread * Math.random();

            const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let j = 0; j < noiseData.length; j++) {
                noiseData[j] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = filterFreq + Math.random() * 500;
            filter.Q.value = 2;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, layerTime);
            gain.gain.linearRampToValueAtTime(volume / layers, layerTime + 0.002);
            gain.gain.exponentialRampToValueAtTime(0.001, layerTime + decay);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(output);

            noise.start(layerTime);
            noise.stop(layerTime + decay + 0.1);
        }

        output.connect(drumState.output);

        setTimeout(() => {
            output.disconnect();
        }, (decay + spread * layers) * 1000 + 200);

        return { output };
    }

    function playRimshot(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 800,
            decay = 0.05,
            volume = 0.5,
            time = now,
        } = options;

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 1.5, time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + 0.01);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 500;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(drumState.output);

        osc.start(time);
        osc.stop(time + decay + 0.1);

        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, decay * 1000 + 200);

        return { osc, gain };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HI-HATS
    // ═══════════════════════════════════════════════════════════════════════

    function playHiHat(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            type = 'closed',  // closed, open, pedal
            volume = 0.35,
            brightness = 0.6,  // 0-1, how bright/dark
            time = now,
        } = options;

        const decayTimes = {
            closed: 0.06,
            pedal: 0.1,
            open: 0.4,
        };

        const decay = decayTimes[type] || 0.06;

        // ─────────────────────────────────────────────────────────────────
        // METALLIC OSCILLATORS - Detuned for realistic cymbal sound
        // ─────────────────────────────────────────────────────────────────

        // Use inharmonic ratios for metallic character (not perfect harmonics)
        const ratios = [1.0, 1.34, 1.67, 2.0, 2.41, 2.83];
        const baseFreq = 400;

        const output = ctx.createGain();
        output.gain.value = 1;

        const mixer = ctx.createGain();
        mixer.gain.value = 0.15;  // Reduce overall level before filtering

        // ─────────────────────────────────────────────────────────────────
        // NOISE LAYER - The "shhh" of the hi-hat
        // ─────────────────────────────────────────────────────────────────

        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * decay * 2, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseHighpass = ctx.createBiquadFilter();
        noiseHighpass.type = 'highpass';
        noiseHighpass.frequency.value = 6000 + brightness * 3000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.7, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        // ─────────────────────────────────────────────────────────────────
        // METALLIC TONE LAYER - The "ting"
        // ─────────────────────────────────────────────────────────────────

        for (let i = 0; i < ratios.length; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = baseFreq * ratios[i] * (5 + brightness * 10);

            const oscGain = ctx.createGain();
            const level = (1 - i * 0.12) / ratios.length;  // Higher harmonics quieter
            oscGain.gain.setValueAtTime(level * volume * 0.3, time);
            oscGain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.7);

            osc.connect(oscGain);
            oscGain.connect(mixer);

            osc.start(time);
            osc.stop(time + decay + 0.1);
        }

        // ─────────────────────────────────────────────────────────────────
        // FILTERING - Shape the overall tone
        // ─────────────────────────────────────────────────────────────────

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 5000;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 10000 + brightness * 4000;
        lowpass.Q.value = 0.5;

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume, time);
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        // ─────────────────────────────────────────────────────────────────
        // ROUTING
        // ─────────────────────────────────────────────────────────────────

        // Metallic tones
        mixer.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(masterGain);

        // Noise layer
        noise.connect(noiseHighpass);
        noiseHighpass.connect(noiseGain);
        noiseGain.connect(output);

        masterGain.connect(output);
        output.connect(drumState.output);

        noise.start(time);
        noise.stop(time + decay + 0.1);

        setTimeout(() => {
            output.disconnect();
        }, decay * 1000 + 200);

        return { output };
    }

    function playTrapHat(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            roll = false,
            rollCount = 4,
            rollSpeed = 0.03,
            volume = 0.35,
            time = now,
        } = options;

        if (roll) {
            for (let i = 0; i < rollCount; i++) {
                playHiHat({
                    type: 'closed',
                    volume: volume * (0.7 + Math.random() * 0.3),
                    time: time + i * rollSpeed,
                });
            }
        } else {
            playHiHat({
                type: 'closed',
                volume,
                time,
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PERCUSSION
    // ═══════════════════════════════════════════════════════════════════════

    function playWoodBlock(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 800,
            decay = 0.08,
            resonance = 0.6,
            volume = 0.4,
            time = now,
        } = options;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.2, time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + 0.01);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2.4;

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(volume, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        const harmonicGain = ctx.createGain();
        harmonicGain.gain.setValueAtTime(volume * 0.3, time);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.5);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = freq;
        filter.Q.value = resonance * 10;

        osc.connect(bodyGain);
        bodyGain.connect(filter);

        osc2.connect(harmonicGain);
        harmonicGain.connect(filter);

        filter.connect(drumState.output);

        osc.start(time);
        osc2.start(time);
        osc.stop(time + decay + 0.1);
        osc2.stop(time + decay + 0.1);

        setTimeout(() => {
            osc.disconnect();
            osc2.disconnect();
            filter.disconnect();
        }, decay * 1000 + 200);

        return { osc, osc2 };
    }

    function playClick(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 3000,
            decay = 0.015,
            volume = 0.3,
            time = now,
        } = options;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 1.6;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(volume * 0.5, time);
        gain2.gain.exponentialRampToValueAtTime(0.001, time + decay * 0.8);

        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(drumState.output);
        gain2.connect(drumState.output);

        osc.start(time);
        osc2.start(time);
        osc.stop(time + decay + 0.05);
        osc2.stop(time + decay + 0.05);

        setTimeout(() => {
            osc.disconnect();
            osc2.disconnect();
        }, decay * 1000 + 100);

        return { osc, osc2 };
    }

    function playShaker(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            decay = 0.1,
            filterFreq = 8000,
            volume = 0.2,
            time = now,
        } = options;

        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = filterFreq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        noise.connect(highpass);
        highpass.connect(gain);
        gain.connect(drumState.output);

        noise.start(time);
        noise.stop(time + decay + 0.1);

        setTimeout(() => {
            noise.disconnect();
            gain.disconnect();
        }, decay * 1000 + 200);

        return { noise };
    }

    function playConga(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 200,
            slap = false,
            decay = 0.2,
            volume = 0.5,
            time = now,
        } = options;

        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(freq * 1.3, time);
        body.frequency.exponentialRampToValueAtTime(freq, time + 0.03);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(volume, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        body.connect(bodyGain);
        bodyGain.connect(drumState.output);

        if (slap) {
            const slapNoise = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
            const slapData = slapNoise.getChannelData(0);
            for (let i = 0; i < slapData.length; i++) {
                slapData[i] = Math.random() * 2 - 1;
            }

            const slap = ctx.createBufferSource();
            slap.buffer = slapNoise;

            const slapFilter = ctx.createBiquadFilter();
            slapFilter.type = 'bandpass';
            slapFilter.frequency.value = 2000;
            slapFilter.Q.value = 2;

            const slapGain = ctx.createGain();
            slapGain.gain.setValueAtTime(volume * 0.5, time);
            slapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

            slap.connect(slapFilter);
            slapFilter.connect(slapGain);
            slapGain.connect(drumState.output);

            slap.start(time);
            slap.stop(time + 0.05);
        }

        body.start(time);
        body.stop(time + decay + 0.1);

        setTimeout(() => {
            body.disconnect();
            bodyGain.disconnect();
        }, decay * 1000 + 200);

        return { body };
    }

    function playTom(options = {}) {
        const ctx = drumState.ctx;
        const now = ctx.currentTime;

        const {
            freq = 100,
            pitchDecay = 0.1,
            bodyDecay = 0.3,
            volume = 0.5,
            time = now,
        } = options;

        const body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(freq * 1.5, time);
        body.frequency.exponentialRampToValueAtTime(freq, time + pitchDecay);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(volume, time);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, time + bodyDecay);

        // Noise for attack
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = freq * 5;
        noiseFilter.Q.value = 1;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.2, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        body.connect(bodyGain);
        bodyGain.connect(drumState.output);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(drumState.output);

        body.start(time);
        noise.start(time);
        body.stop(time + bodyDecay + 0.1);
        noise.stop(time + 0.05);

        setTimeout(() => {
            body.disconnect();
            noise.disconnect();
        }, bodyDecay * 1000 + 200);

        return { body, noise };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UNIFIED PLAY FUNCTION
    // ═══════════════════════════════════════════════════════════════════════

    function play(drumType, options = {}) {
        switch (drumType) {
            // 808 Kicks
            case DRUM_TYPES.KICK_808_DEEP:
                return play808Deep(options);
            case DRUM_TYPES.KICK_808_SHORT:
                return play808Short(options);
            case DRUM_TYPES.KICK_808_DISTORTED:
                return play808Distorted(options);
            case DRUM_TYPES.KICK_808_PUNCHY:
                return play808Kick({ ...options, pitchDecay: 0.05, bodyDecay: 0.25 });
            case DRUM_TYPES.KICK_808_SUB:
                return play808Sub(options);

            // Lofi Kicks (In Rainbows aesthetic)
            case DRUM_TYPES.KICK_LOFI:
                return playLofiKick(options);
            case DRUM_TYPES.KICK_LOFI_WARM:
                return playLofiKickWarm(options);

            // Organic Kicks
            case DRUM_TYPES.KICK_ORGANIC:
                return playOrganicKick(options);
            case DRUM_TYPES.KICK_TRIBAL:
                return playTribalKick(options);
            case DRUM_TYPES.KICK_ACOUSTIC:
                return playOrganicKick({ ...options, noiseAmount: 0.3 });

            // Snares
            case DRUM_TYPES.SNARE_808:
                return playSnare808(options);
            case DRUM_TYPES.SNARE_TRAP:
                return playSnare808({ ...options, noiseDecay: 0.15, noiseFilterFreq: 4000 });
            case DRUM_TYPES.SNARE_CLAP:
                return playClap(options);
            case DRUM_TYPES.SNARE_RIM:
                return playRimshot(options);
            case DRUM_TYPES.SNARE_ORGANIC:
                return playSnare808({ ...options, toneDecay: 0.15, noiseAmount: 0.5 });
            case DRUM_TYPES.SNARE_LOFI:
                return playLofiSnare(options);

            // Hi-Hats
            case DRUM_TYPES.HAT_CLOSED:
                return playHiHat({ ...options, type: 'closed' });
            case DRUM_TYPES.HAT_OPEN:
                return playHiHat({ ...options, type: 'open' });
            case DRUM_TYPES.HAT_PEDAL:
                return playHiHat({ ...options, type: 'pedal' });
            case DRUM_TYPES.HAT_TRAP:
                return playTrapHat(options);
            case DRUM_TYPES.HAT_LOFI:
                return playLofiHat(options);

            // Percussion
            case DRUM_TYPES.PERC_CLICK:
                return playClick(options);
            case DRUM_TYPES.PERC_WOOD:
                return playWoodBlock(options);
            case DRUM_TYPES.PERC_STONE:
                return playClick({ ...options, freq: 4000 });
            case DRUM_TYPES.PERC_SHAKER:
                return playShaker(options);
            case DRUM_TYPES.PERC_CONGA:
                return playConga(options);
            case DRUM_TYPES.PERC_BONGO:
                return playConga({ ...options, freq: 300 });
            case DRUM_TYPES.PERC_TOM_HIGH:
                return playTom({ ...options, freq: 150 });
            case DRUM_TYPES.PERC_TOM_LOW:
                return playTom({ ...options, freq: 80 });

            default:
                console.warn(`Unknown drum type: ${drumType}`);
                return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATTERN PLAYBACK
    // ═══════════════════════════════════════════════════════════════════════

    function createPattern(name, steps = 16, sounds = {}) {
        drumState.patterns[name] = {
            name,
            steps,
            sounds,
            // sounds = { kick: [1,0,0,0,...], snare: [0,0,1,0,...], ... }
        };
        return drumState.patterns[name];
    }

    function setPattern(name) {
        if (drumState.patterns[name]) {
            drumState.currentPattern = drumState.patterns[name];
            drumState.stepIndex = 0;
        }
    }

    function triggerStep(stepIndex, time) {
        if (!drumState.currentPattern) return;

        const pattern = drumState.currentPattern;

        for (const [drumType, steps] of Object.entries(pattern.sounds)) {
            const step = steps[stepIndex % steps.length];

            if (step > 0) {
                const velocity = step * (drumState.velocityRange[0] +
                    Math.random() * (drumState.velocityRange[1] - drumState.velocityRange[0]));

                play(drumType, {
                    volume: velocity,
                    time,
                });
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return Object.freeze({
        // Constants
        TYPES: DRUM_TYPES,

        // Init
        init,

        // 808 Kicks
        play808Kick,
        play808Deep,
        play808Short,
        play808Distorted,
        play808Sub,

        // Organic Kicks
        playOrganicKick,
        playTribalKick,

        // Snares
        playSnare808,
        playClap,
        playRimshot,

        // Hi-Hats
        playHiHat,
        playTrapHat,

        // Percussion
        playWoodBlock,
        playClick,
        playShaker,
        playConga,
        playTom,

        // Unified
        play,

        // Patterns
        createPattern,
        setPattern,
        triggerStep,

        // State
        get state() { return drumState; },
    });
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpDrums;
}
