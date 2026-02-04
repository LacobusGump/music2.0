/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - VISUAL TRANSITIONS MODULE
 * Era transitions, unlock effects, and visual state changes
 * ═══════════════════════════════════════════════════════════════════════════
 */

const GumpTransitions = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSITION CONFIGURATIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Era color palettes for transitions
     */
    const ERA_PALETTES = {
        genesis: {
            primary: '#000000',
            secondary: '#0a0a0a',
            accent: '#1a1a2e',
            glow: 'rgba(100, 100, 255, 0.1)',
            particles: ['#1a1a2e', '#0f0f1e', '#050510']
        },
        primordial: {
            primary: '#0a0f0a',
            secondary: '#1a2f1a',
            accent: '#2d4a2d',
            glow: 'rgba(100, 200, 100, 0.15)',
            particles: ['#2d4a2d', '#1a2f1a', '#3d5a3d']
        },
        tribal: {
            primary: '#1a0f05',
            secondary: '#3d2a1a',
            accent: '#8b4513',
            glow: 'rgba(255, 150, 50, 0.2)',
            particles: ['#8b4513', '#cd853f', '#d2691e']
        },
        sacred: {
            primary: '#0f0a1a',
            secondary: '#1a1030',
            accent: '#4a3060',
            glow: 'rgba(200, 150, 255, 0.2)',
            particles: ['#4a3060', '#6a4080', '#8a60a0']
        },
        modern: {
            primary: '#050508',
            secondary: '#101015',
            accent: '#2a2a3a',
            glow: 'rgba(150, 200, 255, 0.15)',
            particles: ['#3a3a5a', '#4a4a6a', '#5a5a7a']
        }
    };

    /**
     * Era transition effects
     */
    const ERA_TRANSITIONS = {
        genesis_to_primordial: {
            name: 'Emergence',
            duration: 5000,
            effects: ['ripple_out', 'color_morph', 'particle_burst'],
            soundCue: 'emergence',
            intensity: 0.7
        },
        primordial_to_tribal: {
            name: 'Awakening',
            duration: 4000,
            effects: ['shatter', 'color_morph', 'pulse_wave'],
            soundCue: 'awakening',
            intensity: 0.8
        },
        tribal_to_sacred: {
            name: 'Transcendence',
            duration: 6000,
            effects: ['spiral_ascend', 'color_morph', 'light_rays'],
            soundCue: 'transcendence',
            intensity: 0.9
        },
        sacred_to_modern: {
            name: 'Evolution',
            duration: 4500,
            effects: ['glitch_dissolve', 'color_morph', 'data_stream'],
            soundCue: 'evolution',
            intensity: 1.0
        }
    };

    /**
     * Unlock effect presets
     */
    const UNLOCK_EFFECTS = {
        minor: {
            duration: 1000,
            effects: ['flash', 'particle_pop'],
            intensity: 0.5,
            color: '#ffff00'
        },
        major: {
            duration: 2000,
            effects: ['ring_expand', 'particle_burst', 'glow_pulse'],
            intensity: 0.75,
            color: '#00ffff'
        },
        legendary: {
            duration: 3000,
            effects: ['supernova', 'color_wave', 'particle_cascade'],
            intensity: 1.0,
            color: '#ff00ff'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSITION STATE
    // ═══════════════════════════════════════════════════════════════════════

    let canvas = null;
    let ctx = null;
    let isTransitioning = false;
    let currentTransition = null;
    let transitionProgress = 0;
    let transitionStartTime = 0;
    let activeEffects = [];

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize transitions module
     */
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas?.getContext('2d');
    }

    /**
     * Set canvas context
     */
    function setContext(context) {
        ctx = context;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ERA TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Start an era transition
     */
    function startEraTransition(fromEra, toEra, callback) {
        const key = `${fromEra}_to_${toEra}`;
        const config = ERA_TRANSITIONS[key];
        if (!config) {
            if (callback) callback();
            return;
        }

        isTransitioning = true;
        transitionStartTime = performance.now();
        transitionProgress = 0;

        currentTransition = {
            type: 'era',
            fromEra,
            toEra,
            config,
            callback,
            fromPalette: ERA_PALETTES[fromEra],
            toPalette: ERA_PALETTES[toEra]
        };

        // Initialize effects
        activeEffects = config.effects.map(effect => createEffect(effect, config));
    }

    /**
     * Create an effect instance
     */
    function createEffect(effectName, config) {
        switch (effectName) {
            case 'ripple_out':
                return new RippleOutEffect(config);
            case 'color_morph':
                return new ColorMorphEffect(config);
            case 'particle_burst':
                return new ParticleBurstEffect(config);
            case 'shatter':
                return new ShatterEffect(config);
            case 'pulse_wave':
                return new PulseWaveEffect(config);
            case 'spiral_ascend':
                return new SpiralAscendEffect(config);
            case 'light_rays':
                return new LightRaysEffect(config);
            case 'glitch_dissolve':
                return new GlitchDissolveEffect(config);
            case 'data_stream':
                return new DataStreamEffect(config);
            case 'flash':
                return new FlashEffect(config);
            case 'particle_pop':
                return new ParticlePopEffect(config);
            case 'ring_expand':
                return new RingExpandEffect(config);
            case 'glow_pulse':
                return new GlowPulseEffect(config);
            case 'supernova':
                return new SupernovaEffect(config);
            case 'color_wave':
                return new ColorWaveEffect(config);
            case 'particle_cascade':
                return new ParticleCascadeEffect(config);
            default:
                return null;
        }
    }

    /**
     * Update transition
     */
    function update(deltaTime) {
        if (!isTransitioning || !currentTransition) return;

        const elapsed = performance.now() - transitionStartTime;
        transitionProgress = Math.min(1, elapsed / currentTransition.config.duration);

        // Update all active effects
        for (const effect of activeEffects) {
            if (effect) {
                effect.update(transitionProgress, deltaTime);
            }
        }

        // Check completion
        if (transitionProgress >= 1) {
            completeTransition();
        }
    }

    /**
     * Render transition
     */
    function render() {
        if (!isTransitioning || !ctx || !currentTransition) return;

        // Render all active effects
        for (const effect of activeEffects) {
            if (effect) {
                effect.render(ctx, canvas.width, canvas.height, currentTransition);
            }
        }
    }

    /**
     * Complete transition
     */
    function completeTransition() {
        isTransitioning = false;
        const callback = currentTransition?.callback;
        currentTransition = null;
        activeEffects = [];
        transitionProgress = 0;

        if (callback) callback();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UNLOCK EFFECTS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Play unlock effect
     */
    function playUnlockEffect(tier, position, callback) {
        const config = UNLOCK_EFFECTS[tier] || UNLOCK_EFFECTS.minor;

        isTransitioning = true;
        transitionStartTime = performance.now();
        transitionProgress = 0;

        currentTransition = {
            type: 'unlock',
            tier,
            config,
            callback,
            position: position || { x: canvas.width / 2, y: canvas.height / 2 }
        };

        activeEffects = config.effects.map(effect => createEffect(effect, config));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECT CLASSES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Base effect class
     */
    class BaseEffect {
        constructor(config) {
            this.config = config;
            this.progress = 0;
        }

        update(progress, deltaTime) {
            this.progress = progress;
        }

        render(ctx, width, height, transition) {
            // Override in subclasses
        }

        easeInOut(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

        easeOut(t) {
            return t * (2 - t);
        }

        easeIn(t) {
            return t * t;
        }
    }

    /**
     * Ripple Out Effect - expanding circles
     */
    class RippleOutEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.ripples = [];
            this.lastRipple = 0;
        }

        update(progress, deltaTime) {
            super.update(progress, deltaTime);

            // Add new ripples
            if (progress < 0.8 && progress - this.lastRipple > 0.1) {
                this.ripples.push({
                    birth: progress,
                    x: Math.random(),
                    y: Math.random()
                });
                this.lastRipple = progress;
            }

            // Remove old ripples
            this.ripples = this.ripples.filter(r => progress - r.birth < 0.5);
        }

        render(ctx, width, height, transition) {
            ctx.save();

            for (const ripple of this.ripples) {
                const age = (this.progress - ripple.birth) / 0.5;
                const radius = age * Math.max(width, height) * 0.5;
                const alpha = (1 - age) * 0.3;

                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(ripple.x * width, ripple.y * height, radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    /**
     * Color Morph Effect - smooth color transition
     */
    class ColorMorphEffect extends BaseEffect {
        render(ctx, width, height, transition) {
            if (!transition.fromPalette || !transition.toPalette) return;

            ctx.save();

            const fromColor = transition.fromPalette.primary;
            const toColor = transition.toPalette.primary;

            // Create gradient overlay
            const gradient = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height)
            );

            const alpha = this.easeInOut(this.progress) * 0.5;
            gradient.addColorStop(0, this._interpolateColor(fromColor, toColor, this.progress, alpha * 0.5));
            gradient.addColorStop(1, this._interpolateColor(fromColor, toColor, this.progress, alpha));

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.restore();
        }

        _interpolateColor(from, to, t, alpha) {
            // Simple hex color interpolation
            const fromRgb = this._hexToRgb(from);
            const toRgb = this._hexToRgb(to);

            const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * t);
            const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * t);
            const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * t);

            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        _hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        }
    }

    /**
     * Particle Burst Effect
     */
    class ParticleBurstEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.particles = [];
            this.initialized = false;
        }

        update(progress, deltaTime) {
            super.update(progress, deltaTime);

            if (!this.initialized && progress > 0.1) {
                this._initParticles();
                this.initialized = true;
            }

            // Update particles
            for (const p of this.particles) {
                p.x += p.vx * deltaTime * 0.01;
                p.y += p.vy * deltaTime * 0.01;
                p.life -= deltaTime * 0.001;
            }

            this.particles = this.particles.filter(p => p.life > 0);
        }

        _initParticles() {
            const count = 50;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const speed = 2 + Math.random() * 3;
                this.particles.push({
                    x: 0.5,
                    y: 0.5,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 4,
                    life: 1 + Math.random() * 0.5,
                    color: Math.random() > 0.5 ? '#ffffff' : '#aaaaff'
                });
            }
        }

        render(ctx, width, height, transition) {
            ctx.save();

            for (const p of this.particles) {
                const alpha = p.life * 0.8;
                ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(');
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /**
     * Shatter Effect
     */
    class ShatterEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.shards = [];
            this._initShards();
        }

        _initShards() {
            const gridSize = 8;
            for (let x = 0; x < gridSize; x++) {
                for (let y = 0; y < gridSize; y++) {
                    const centerX = (x + 0.5) / gridSize;
                    const centerY = (y + 0.5) / gridSize;
                    const dx = centerX - 0.5;
                    const dy = centerY - 0.5;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    this.shards.push({
                        x: centerX,
                        y: centerY,
                        w: 1 / gridSize,
                        h: 1 / gridSize,
                        vx: dx * 2,
                        vy: dy * 2,
                        rotation: 0,
                        vr: (Math.random() - 0.5) * 0.2,
                        delay: dist * 0.5
                    });
                }
            }
        }

        render(ctx, width, height, transition) {
            ctx.save();

            for (const shard of this.shards) {
                const progress = Math.max(0, this.progress - shard.delay) / (1 - shard.delay);
                if (progress <= 0) continue;

                const x = shard.x + shard.vx * this.easeOut(progress) * 0.3;
                const y = shard.y + shard.vy * this.easeOut(progress) * 0.3;
                const rotation = shard.rotation + shard.vr * progress * 10;
                const alpha = 1 - this.easeIn(progress);

                ctx.save();
                ctx.translate(x * width, y * height);
                ctx.rotate(rotation);
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(-shard.w * width / 2, -shard.h * height / 2, shard.w * width, shard.h * height);
                ctx.restore();
            }

            ctx.restore();
        }
    }

    /**
     * Pulse Wave Effect
     */
    class PulseWaveEffect extends BaseEffect {
        render(ctx, width, height, transition) {
            ctx.save();

            const centerX = width / 2;
            const centerY = height / 2;
            const maxRadius = Math.sqrt(width * width + height * height);

            // Multiple pulses
            for (let i = 0; i < 3; i++) {
                const offset = i * 0.15;
                const pulseProgress = Math.max(0, Math.min(1, (this.progress - offset) / 0.5));
                if (pulseProgress <= 0 || pulseProgress >= 1) continue;

                const radius = pulseProgress * maxRadius;
                const alpha = (1 - pulseProgress) * 0.4;

                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = 3 + (1 - pulseProgress) * 5;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    /**
     * Spiral Ascend Effect
     */
    class SpiralAscendEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.particles = [];
            for (let i = 0; i < 30; i++) {
                this.particles.push({
                    angle: (i / 30) * Math.PI * 4,
                    radius: 0.1 + (i / 30) * 0.3,
                    speed: 0.5 + Math.random() * 0.5,
                    size: 2 + Math.random() * 3
                });
            }
        }

        render(ctx, width, height, transition) {
            ctx.save();

            const centerX = width / 2;
            const centerY = height / 2;

            for (const p of this.particles) {
                const angle = p.angle + this.progress * Math.PI * 4 * p.speed;
                const radius = p.radius * (1 - this.progress * 0.5) * Math.min(width, height) * 0.4;
                const y = centerY - this.progress * height * 0.3;

                const x = centerX + Math.cos(angle) * radius;
                const particleY = y + Math.sin(angle) * radius * 0.3;

                const alpha = (1 - this.progress) * 0.8;

                ctx.fillStyle = `rgba(200, 150, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, particleY, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /**
     * Light Rays Effect
     */
    class LightRaysEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.rays = [];
            for (let i = 0; i < 12; i++) {
                this.rays.push({
                    angle: (i / 12) * Math.PI * 2,
                    width: 0.05 + Math.random() * 0.1,
                    intensity: 0.5 + Math.random() * 0.5
                });
            }
        }

        render(ctx, width, height, transition) {
            ctx.save();

            const centerX = width / 2;
            const centerY = height / 2;
            const maxLength = Math.sqrt(width * width + height * height);

            for (const ray of this.rays) {
                const length = this.easeOut(this.progress) * maxLength;
                const alpha = ray.intensity * (1 - this.progress * 0.5) * 0.3;

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(ray.angle);

                const gradient = ctx.createLinearGradient(0, 0, length, 0);
                gradient.addColorStop(0, `rgba(255, 220, 150, ${alpha})`);
                gradient.addColorStop(1, 'rgba(255, 220, 150, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(length, -ray.width * length);
                ctx.lineTo(length, ray.width * length);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }

            ctx.restore();
        }
    }

    /**
     * Glitch Dissolve Effect
     */
    class GlitchDissolveEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.glitches = [];
        }

        update(progress, deltaTime) {
            super.update(progress, deltaTime);

            // Add random glitches
            if (Math.random() < 0.3 * this.config.intensity) {
                this.glitches.push({
                    x: Math.random(),
                    y: Math.random(),
                    w: 0.05 + Math.random() * 0.2,
                    h: 0.01 + Math.random() * 0.05,
                    life: 0.1 + Math.random() * 0.1,
                    offset: (Math.random() - 0.5) * 0.05
                });
            }

            // Update glitches
            this.glitches = this.glitches.filter(g => {
                g.life -= deltaTime * 0.01;
                return g.life > 0;
            });
        }

        render(ctx, width, height, transition) {
            ctx.save();

            for (const g of this.glitches) {
                const alpha = g.life * 10;

                // Glitch bar
                ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
                ctx.fillRect(
                    (g.x + g.offset) * width,
                    g.y * height,
                    g.w * width,
                    g.h * height
                );

                // Offset copy
                ctx.fillStyle = `rgba(255, 0, 255, ${alpha * 0.2})`;
                ctx.fillRect(
                    (g.x - g.offset) * width,
                    g.y * height,
                    g.w * width,
                    g.h * height
                );
            }

            ctx.restore();
        }
    }

    /**
     * Data Stream Effect
     */
    class DataStreamEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.streams = [];
            for (let i = 0; i < 20; i++) {
                this.streams.push({
                    x: Math.random(),
                    speed: 1 + Math.random() * 2,
                    chars: this._generateChars(),
                    offset: Math.random()
                });
            }
        }

        _generateChars() {
            const chars = [];
            const count = 5 + Math.floor(Math.random() * 10);
            for (let i = 0; i < count; i++) {
                chars.push(String.fromCharCode(0x30A0 + Math.random() * 96));
            }
            return chars;
        }

        render(ctx, width, height, transition) {
            ctx.save();
            ctx.font = '12px monospace';

            for (const stream of this.streams) {
                const y = ((this.progress * stream.speed + stream.offset) % 1) * height * 1.5 - height * 0.25;

                for (let i = 0; i < stream.chars.length; i++) {
                    const charY = y + i * 15;
                    const alpha = Math.max(0, 1 - i / stream.chars.length) * (1 - this.progress * 0.5);

                    ctx.fillStyle = `rgba(0, 255, 150, ${alpha})`;
                    ctx.fillText(stream.chars[i], stream.x * width, charY);
                }
            }

            ctx.restore();
        }
    }

    /**
     * Flash Effect
     */
    class FlashEffect extends BaseEffect {
        render(ctx, width, height, transition) {
            if (this.progress > 0.3) return;

            ctx.save();
            const alpha = (1 - this.progress / 0.3) * 0.8;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    }

    /**
     * Particle Pop Effect
     */
    class ParticlePopEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.particles = [];
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                this.particles.push({
                    x: 0.5,
                    y: 0.5,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 5
                });
            }
        }

        render(ctx, width, height, transition) {
            ctx.save();

            const pos = transition.position || { x: width / 2, y: height / 2 };

            for (const p of this.particles) {
                const x = pos.x / width + p.vx * this.progress * 0.2;
                const y = pos.y / height + p.vy * this.progress * 0.2;
                const alpha = 1 - this.progress;
                const size = p.size * (1 + this.progress);

                ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x * width, y * height, size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /**
     * Ring Expand Effect
     */
    class RingExpandEffect extends BaseEffect {
        render(ctx, width, height, transition) {
            ctx.save();

            const pos = transition.position || { x: width / 2, y: height / 2 };
            const maxRadius = Math.max(width, height) * 0.5;

            for (let i = 0; i < 3; i++) {
                const offset = i * 0.1;
                const ringProgress = Math.max(0, (this.progress - offset) / (1 - offset));
                const radius = ringProgress * maxRadius;
                const alpha = (1 - ringProgress) * 0.6;
                const lineWidth = (1 - ringProgress) * 4 + 1;

                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    /**
     * Glow Pulse Effect
     */
    class GlowPulseEffect extends BaseEffect {
        render(ctx, width, height, transition) {
            ctx.save();

            const pos = transition.position || { x: width / 2, y: height / 2 };
            const pulseIntensity = Math.sin(this.progress * Math.PI) * 0.5;
            const radius = 50 + pulseIntensity * 100;

            const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${pulseIntensity * 0.5})`);
            gradient.addColorStop(0.5, `rgba(0, 255, 255, ${pulseIntensity * 0.3})`);
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.restore();
        }
    }

    /**
     * Supernova Effect
     */
    class SupernovaEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.particles = [];
            this.initialized = false;
        }

        update(progress, deltaTime) {
            super.update(progress, deltaTime);

            if (!this.initialized && progress > 0.2) {
                this._initParticles();
                this.initialized = true;
            }

            for (const p of this.particles) {
                p.x += p.vx * deltaTime * 0.005;
                p.y += p.vy * deltaTime * 0.005;
                p.size *= 0.99;
            }
        }

        _initParticles() {
            for (let i = 0; i < 100; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 5;
                this.particles.push({
                    x: 0.5,
                    y: 0.5,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 5 + Math.random() * 10,
                    hue: Math.random() * 60 + 280
                });
            }
        }

        render(ctx, width, height, transition) {
            ctx.save();

            const pos = transition.position || { x: width / 2, y: height / 2 };

            // Core flash
            if (this.progress < 0.3) {
                const flashAlpha = Math.sin((this.progress / 0.3) * Math.PI);
                const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 200);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
                gradient.addColorStop(0.3, `rgba(255, 200, 255, ${flashAlpha * 0.5})`);
                gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }

            // Particles
            for (const p of this.particles) {
                const alpha = (1 - this.progress) * 0.8;
                ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    /**
     * Color Wave Effect
     */
    class ColorWaveEffect extends BaseEffect {
        render(ctx, width, height, transition) {
            ctx.save();

            const pos = transition.position || { x: width / 2, y: height / 2 };
            const hue = this.progress * 360;
            const radius = this.progress * Math.max(width, height);

            const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
            gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
            gradient.addColorStop(0.8, `hsla(${hue}, 100%, 50%, ${(1 - this.progress) * 0.3})`);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.restore();
        }
    }

    /**
     * Particle Cascade Effect
     */
    class ParticleCascadeEffect extends BaseEffect {
        constructor(config) {
            super(config);
            this.particles = [];
            for (let i = 0; i < 50; i++) {
                this.particles.push({
                    x: Math.random(),
                    y: -0.1 - Math.random() * 0.5,
                    speed: 0.5 + Math.random() * 1,
                    size: 2 + Math.random() * 4,
                    hue: Math.random() * 60 + 280
                });
            }
        }

        render(ctx, width, height, transition) {
            ctx.save();

            for (const p of this.particles) {
                const y = p.y + this.progress * p.speed * 1.5;
                if (y > 1.1) continue;

                const alpha = Math.min(1, (1 - Math.abs(y - 0.5)) * 2) * (1 - this.progress * 0.5);

                ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x * width, y * height, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // Initialization
        init,
        setContext,

        // State
        isTransitioning: () => isTransitioning,
        getProgress: () => transitionProgress,

        // Era transitions
        startEraTransition,

        // Unlock effects
        playUnlockEffect,

        // Update/render
        update,
        render,

        // Configuration
        ERA_PALETTES,
        ERA_TRANSITIONS,
        UNLOCK_EFFECTS,

        // Utilities
        completeTransition,
        cancelTransition: () => {
            isTransitioning = false;
            currentTransition = null;
            activeEffects = [];
        }
    };

})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpTransitions;
}
