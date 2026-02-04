/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - PARTICLE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Particle effects for visual feedback and music visualization.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpParticles = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        maxParticles: 500,
        defaultLifespan: 2000,
        gravity: 0.1,
        friction: 0.98,
        fadeSpeed: 0.02
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PARTICLE PRESETS
    // ═══════════════════════════════════════════════════════════════════════

    const PRESETS = {
        spark: {
            count: 10,
            lifespan: 800,
            size: { min: 2, max: 5 },
            speed: { min: 2, max: 8 },
            gravity: 0.05,
            friction: 0.95,
            color: '#ffffff',
            glow: true,
            trail: false
        },
        burst: {
            count: 30,
            lifespan: 1000,
            size: { min: 3, max: 8 },
            speed: { min: 3, max: 10 },
            gravity: 0,
            friction: 0.92,
            color: '#00ff88',
            glow: true,
            trail: true
        },
        ambient: {
            count: 1,
            lifespan: 5000,
            size: { min: 1, max: 3 },
            speed: { min: 0.2, max: 1 },
            gravity: -0.01,
            friction: 0.99,
            color: '#ffffff',
            glow: false,
            trail: false
        },
        beat: {
            count: 20,
            lifespan: 600,
            size: { min: 4, max: 10 },
            speed: { min: 5, max: 15 },
            gravity: 0,
            friction: 0.88,
            color: '#ff00ff',
            glow: true,
            trail: true
        },
        unlock: {
            count: 50,
            lifespan: 1500,
            size: { min: 3, max: 8 },
            speed: { min: 2, max: 8 },
            gravity: -0.05,
            friction: 0.96,
            color: '#ffd700',
            glow: true,
            trail: true
        },
        rain: {
            count: 1,
            lifespan: 3000,
            size: { min: 1, max: 2 },
            speed: { min: 3, max: 6 },
            gravity: 0.2,
            friction: 1,
            color: '#4488ff',
            glow: false,
            trail: true
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    let particles = [];
    let emitters = [];
    let width = 0;
    let height = 0;
    let currentColor = '#00ff88';

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init() {
        width = window.innerWidth;
        height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = window.innerWidth;
            height = window.innerHeight;
        });

        // Listen for events
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('beat', onBeat);
            GumpEvents.on('unlock.complete', onUnlock);
            GumpEvents.on('zone.enter', onZoneEnter);
            GumpEvents.on('era.change', onEraChange);
        }

        console.log('[GumpParticles] Initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PARTICLE CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class Particle {
        constructor(x, y, options = {}) {
            this.x = x;
            this.y = y;

            const speed = randomRange(options.speed?.min || 1, options.speed?.max || 5);
            const angle = options.angle !== undefined ? options.angle : Math.random() * Math.PI * 2;

            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;

            this.size = randomRange(options.size?.min || 2, options.size?.max || 5);
            this.originalSize = this.size;

            this.color = options.color || currentColor;
            this.alpha = 1;

            this.lifespan = options.lifespan || CONFIG.defaultLifespan;
            this.age = 0;

            this.gravity = options.gravity !== undefined ? options.gravity : CONFIG.gravity;
            this.friction = options.friction || CONFIG.friction;

            this.glow = options.glow || false;
            this.trail = options.trail || false;
            this.trailPositions = [];

            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;

            this.isAlive = true;
        }

        update(dt) {
            if (!this.isAlive) return;

            // Store trail position
            if (this.trail) {
                this.trailPositions.push({ x: this.x, y: this.y, alpha: this.alpha });
                if (this.trailPositions.length > 10) {
                    this.trailPositions.shift();
                }
            }

            // Apply physics
            this.vy += this.gravity;
            this.vx *= this.friction;
            this.vy *= this.friction;

            this.x += this.vx * (dt / 16.67);
            this.y += this.vy * (dt / 16.67);

            this.rotation += this.rotationSpeed;

            // Age
            this.age += dt;
            const lifeProgress = this.age / this.lifespan;

            // Fade out
            this.alpha = 1 - lifeProgress;

            // Shrink
            this.size = this.originalSize * (1 - lifeProgress * 0.5);

            // Check death
            if (this.age >= this.lifespan) {
                this.isAlive = false;
            }

            // Check bounds
            if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
                this.isAlive = false;
            }
        }

        render(ctx) {
            if (!this.isAlive || this.alpha <= 0) return;

            ctx.save();

            // Render trail
            if (this.trail && this.trailPositions.length > 1) {
                ctx.beginPath();
                ctx.moveTo(this.trailPositions[0].x, this.trailPositions[0].y);

                for (let i = 1; i < this.trailPositions.length; i++) {
                    ctx.lineTo(this.trailPositions[i].x, this.trailPositions[i].y);
                }

                ctx.lineTo(this.x, this.y);
                ctx.strokeStyle = this.color;
                ctx.globalAlpha = this.alpha * 0.3;
                ctx.lineWidth = this.size * 0.5;
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            // Render glow
            if (this.glow) {
                const rgb = parseColor(this.color);
                if (rgb) {
                    const gradient = ctx.createRadialGradient(
                        this.x, this.y, 0,
                        this.x, this.y, this.size * 3
                    );
                    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.alpha * 0.5})`);
                    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Render particle
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EMITTER CLASS
    // ═══════════════════════════════════════════════════════════════════════

    class Emitter {
        constructor(x, y, options = {}) {
            this.x = x;
            this.y = y;
            this.options = options;

            this.rate = options.rate || 10;  // Particles per second
            this.accumulator = 0;

            this.active = true;
            this.duration = options.duration || Infinity;
            this.age = 0;

            this.spread = options.spread !== undefined ? options.spread : Math.PI * 2;
            this.direction = options.direction || 0;

            this.preset = options.preset ? PRESETS[options.preset] : null;
        }

        update(dt) {
            if (!this.active) return;

            this.age += dt;

            if (this.age >= this.duration) {
                this.active = false;
                return;
            }

            this.accumulator += (this.rate / 1000) * dt;

            while (this.accumulator >= 1) {
                this.emit();
                this.accumulator -= 1;
            }
        }

        emit() {
            const angle = this.direction + (Math.random() - 0.5) * this.spread;

            const particleOptions = {
                ...this.preset,
                ...this.options.particleOptions,
                angle
            };

            const particle = new Particle(this.x, this.y, particleOptions);
            addParticle(particle);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function update(dt = 16.67) {
        // Update emitters
        for (let i = emitters.length - 1; i >= 0; i--) {
            emitters[i].update(dt);

            if (!emitters[i].active) {
                emitters.splice(i, 1);
            }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(dt);

            if (!particles[i].isAlive) {
                particles.splice(i, 1);
            }
        }
    }

    function render(ctx) {
        for (const particle of particles) {
            particle.render(ctx);
        }
    }

    function addParticle(particle) {
        if (particles.length >= CONFIG.maxParticles) {
            // Remove oldest
            particles.shift();
        }
        particles.push(particle);
    }

    function addEmitter(emitter) {
        emitters.push(emitter);
        return emitter;
    }

    function clear() {
        particles = [];
        emitters = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECT FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function burst(x, y, presetName = 'burst', options = {}) {
        const preset = PRESETS[presetName] || PRESETS.burst;
        const count = options.count || preset.count;
        const color = options.color || preset.color || currentColor;

        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, {
                ...preset,
                color,
                ...options
            });
            addParticle(particle);
        }
    }

    function spark(x, y, options = {}) {
        burst(x, y, 'spark', options);
    }

    function ambientEmitter(x, y, options = {}) {
        const emitter = new Emitter(x, y, {
            preset: 'ambient',
            rate: 2,
            duration: Infinity,
            ...options
        });

        return addEmitter(emitter);
    }

    function beatPulse(x, y, intensity = 1) {
        burst(x, y, 'beat', {
            count: Math.floor(10 * intensity),
            speed: { min: 5 * intensity, max: 15 * intensity }
        });
    }

    function unlockCelebration(x, y) {
        burst(x, y, 'unlock', { count: 50 });

        // Add rising particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 100;
                burst(x + offsetX, y, 'unlock', {
                    count: 3,
                    angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.5
                });
            }, i * 50);
        }
    }

    function zoneGlow(zoneBounds) {
        const x = zoneBounds.x + zoneBounds.width / 2;
        const y = zoneBounds.y + zoneBounds.height / 2;

        // Emit particles from zone center
        burst(x, y, 'spark', {
            count: 5,
            color: currentColor
        });
    }

    function trail(fromX, fromY, toX, toY, options = {}) {
        const distance = Math.hypot(toX - fromX, toY - fromY);
        const count = Math.floor(distance / 20);
        const angle = Math.atan2(toY - fromY, toX - fromX);

        for (let i = 0; i < count; i++) {
            const t = i / count;
            const x = fromX + (toX - fromX) * t;
            const y = fromY + (toY - fromY) * t;

            setTimeout(() => {
                const particle = new Particle(x, y, {
                    ...PRESETS.spark,
                    angle: angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5,
                    speed: { min: 1, max: 3 },
                    color: options.color || currentColor
                });
                addParticle(particle);
            }, i * 20);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function onBeat(data) {
        // Pulse from center
        beatPulse(width / 2, height / 2, 0.3);
    }

    function onUnlock(data) {
        // Celebration at center
        unlockCelebration(width / 2, height / 2);
    }

    function onZoneEnter(data) {
        const zone = data.zone;

        // Get zone center
        if (typeof GumpGridViz !== 'undefined') {
            const center = GumpGridViz.getZoneCenter(zone);
            if (center) {
                spark(center.x, center.y, { color: currentColor });
            }
        }
    }

    function onEraChange(data) {
        const eraColors = {
            genesis: '#e94560',
            primordial: '#98c1d9',
            tribal: '#ff6b35',
            sacred: '#ce93d8',
            modern: '#00ff88'
        };

        currentColor = eraColors[data.to] || '#ffffff';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function parseColor(color) {
        if (!color) return null;

        if (color.startsWith('#')) {
            const hex = color.slice(1);
            return {
                r: parseInt(hex.substr(0, 2), 16),
                g: parseInt(hex.substr(2, 2), 16),
                b: parseInt(hex.substr(4, 2), 16)
            };
        }

        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        init,
        update,
        render,
        clear,

        // Effects
        burst,
        spark,
        beatPulse,
        unlockCelebration,
        zoneGlow,
        trail,

        // Emitters
        addEmitter,
        ambientEmitter,

        // Classes
        Particle,
        Emitter,

        // State
        get count() { return particles.length; },
        get particles() { return particles; },
        get emitters() { return emitters; },

        // Config
        CONFIG,
        PRESETS,

        // Color
        setColor(color) { currentColor = color; },
        get color() { return currentColor; }
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpParticles;
}
