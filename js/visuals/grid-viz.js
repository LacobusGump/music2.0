/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - GRID VISUALIZATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Visual representation of the 9-zone grid system.
 * Handles zone highlighting, transitions, patterns, and music visualization.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpGridViz = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        gridPadding: 40,
        lineWidth: 1,
        glowRadius: 100,
        pulseSpeed: 0.002,
        fadeSpeed: 0.03,
        beatPulseIntensity: 0.3,
        zoneGlowIntensity: 0.4
    };

    // Zone colors by era
    const ERA_COLORS = {
        genesis: {
            primary: '#1a1a2e',
            secondary: '#16213e',
            accent: '#0f3460',
            glow: '#e94560',
            text: '#ffffff'
        },
        primordial: {
            primary: '#1a1a1a',
            secondary: '#2d2d2d',
            accent: '#3d5a80',
            glow: '#98c1d9',
            text: '#e0fbfc'
        },
        tribal: {
            primary: '#1c1c1c',
            secondary: '#2e2e2e',
            accent: '#8b4513',
            glow: '#ff6b35',
            text: '#f7c59f'
        },
        sacred: {
            primary: '#0d0d1a',
            secondary: '#1a1a33',
            accent: '#4a148c',
            glow: '#ce93d8',
            text: '#e1bee7'
        },
        modern: {
            primary: '#0a0a0a',
            secondary: '#141414',
            accent: '#1f1f1f',
            glow: '#00ff88',
            text: '#00ff88'
        }
    };

    // Zone positions (normalized 0-1)
    const ZONE_LAYOUT = {
        'top-left': { x: 0, y: 0, w: 1/3, h: 1/3 },
        'top-center': { x: 1/3, y: 0, w: 1/3, h: 1/3 },
        'top-right': { x: 2/3, y: 0, w: 1/3, h: 1/3 },
        'center-left': { x: 0, y: 1/3, w: 1/3, h: 1/3 },
        'center': { x: 1/3, y: 1/3, w: 1/3, h: 1/3 },
        'center-right': { x: 2/3, y: 1/3, w: 1/3, h: 1/3 },
        'bottom-left': { x: 0, y: 2/3, w: 1/3, h: 1/3 },
        'bottom-center': { x: 1/3, y: 2/3, w: 1/3, h: 1/3 },
        'bottom-right': { x: 2/3, y: 2/3, w: 1/3, h: 1/3 }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    let width = 0;
    let height = 0;
    let gridX = 0;
    let gridY = 0;
    let gridWidth = 0;
    let gridHeight = 0;

    // Current visual state
    const zoneStates = {};
    for (const zone in ZONE_LAYOUT) {
        zoneStates[zone] = {
            active: false,
            intensity: 0,
            targetIntensity: 0,
            dwellProgress: 0,
            pulsePhase: Math.random() * Math.PI * 2,
            color: null,
            pattern: null
        };
    }

    // Active patterns
    const activePatterns = [];

    // Current era
    let currentEra = 'genesis';
    let colors = ERA_COLORS.genesis;

    // Animation state
    let time = 0;
    let beatPhase = 0;
    let lastBeatTime = 0;

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init() {
        updateDimensions();

        // Listen for events
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.on('zone.enter', onZoneEnter);
            GumpEvents.on('zone.exit', onZoneExit);
            GumpEvents.on('zone.dwell', onZoneDwell);
            GumpEvents.on('era.change', onEraChange);
            GumpEvents.on('beat', onBeat);
            GumpEvents.on('pattern.detected', onPatternDetected);
        }

        window.addEventListener('resize', updateDimensions);

        console.log('[GumpGridViz] Initialized');
    }

    function updateDimensions() {
        width = window.innerWidth;
        height = window.innerHeight;

        // Calculate grid bounds with padding
        const padding = CONFIG.gridPadding;
        const size = Math.min(width, height) - padding * 2;

        gridWidth = size;
        gridHeight = size;
        gridX = (width - size) / 2;
        gridY = (height - size) / 2;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════════

    function render(ctx, dt = 16.67) {
        time += dt;

        // Update zone states
        updateZoneStates(dt);

        // Update patterns
        updatePatterns(dt);

        // Render layers
        renderBackground(ctx);
        renderGrid(ctx);
        renderZones(ctx);
        renderPatterns(ctx);
        renderConnections(ctx);
        renderEffects(ctx);
    }

    function updateZoneStates(dt) {
        const speed = CONFIG.fadeSpeed * (dt / 16.67);

        for (const zone in zoneStates) {
            const state = zoneStates[zone];

            // Interpolate intensity
            state.intensity += (state.targetIntensity - state.intensity) * speed;

            // Update pulse phase
            state.pulsePhase += CONFIG.pulseSpeed * dt;
            if (state.pulsePhase > Math.PI * 2) {
                state.pulsePhase -= Math.PI * 2;
            }
        }
    }

    function updatePatterns(dt) {
        for (let i = activePatterns.length - 1; i >= 0; i--) {
            const pattern = activePatterns[i];
            pattern.age += dt;

            if (pattern.age >= pattern.duration) {
                activePatterns.splice(i, 1);
            }
        }
    }

    function renderBackground(ctx) {
        // Subtle gradient based on era
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 2
        );

        gradient.addColorStop(0, colors.secondary);
        gradient.addColorStop(1, colors.primary);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function renderGrid(ctx) {
        ctx.save();

        // Grid lines
        ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
        ctx.lineWidth = CONFIG.lineWidth;

        // Vertical lines
        for (let i = 0; i <= 3; i++) {
            const x = gridX + (gridWidth / 3) * i;
            ctx.beginPath();
            ctx.moveTo(x, gridY);
            ctx.lineTo(x, gridY + gridHeight);
            ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= 3; i++) {
            const y = gridY + (gridHeight / 3) * i;
            ctx.beginPath();
            ctx.moveTo(gridX, y);
            ctx.lineTo(gridX + gridWidth, y);
            ctx.stroke();
        }

        // Outer border
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.strokeRect(gridX, gridY, gridWidth, gridHeight);

        ctx.restore();
    }

    function renderZones(ctx) {
        ctx.save();

        for (const zoneName in ZONE_LAYOUT) {
            const layout = ZONE_LAYOUT[zoneName];
            const state = zoneStates[zoneName];

            const x = gridX + layout.x * gridWidth;
            const y = gridY + layout.y * gridHeight;
            const w = layout.w * gridWidth;
            const h = layout.h * gridHeight;

            const centerX = x + w / 2;
            const centerY = y + h / 2;

            // Base intensity with pulse
            const pulseIntensity = Math.sin(state.pulsePhase) * 0.5 + 0.5;
            const totalIntensity = state.intensity * (0.7 + pulseIntensity * 0.3);

            if (totalIntensity > 0.01) {
                // Zone glow
                const glowRadius = Math.min(w, h) * 0.6;
                const gradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, glowRadius
                );

                const glowColor = state.color || colors.glow;
                const rgb = parseColor(glowColor);

                if (rgb) {
                    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${totalIntensity * CONFIG.zoneGlowIntensity})`);
                    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${totalIntensity * CONFIG.zoneGlowIntensity * 0.3})`);
                    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, y, w, h);
                }

                // Zone border
                ctx.strokeStyle = `rgba(${rgb?.r || 255}, ${rgb?.g || 255}, ${rgb?.b || 255}, ${totalIntensity * 0.5})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
            }

            // Dwell progress indicator
            if (state.dwellProgress > 0) {
                renderDwellIndicator(ctx, centerX, centerY, Math.min(w, h) * 0.3, state.dwellProgress);
            }
        }

        ctx.restore();
    }

    function renderDwellIndicator(ctx, x, y, radius, progress) {
        ctx.save();

        // Background ring
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Progress arc
        const rgb = parseColor(colors.glow);
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();

        // Glow at end point
        if (progress > 0) {
            const endAngle = -Math.PI / 2 + progress * Math.PI * 2;
            const endX = x + Math.cos(endAngle) * radius;
            const endY = y + Math.sin(endAngle) * radius;

            const glowGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, 10);
            glowGradient.addColorStop(0, `rgba(${rgb?.r || 255}, ${rgb?.g || 255}, ${rgb?.b || 255}, 0.8)`);
            glowGradient.addColorStop(1, `rgba(${rgb?.r || 255}, ${rgb?.g || 255}, ${rgb?.b || 255}, 0)`);

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(endX, endY, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function renderPatterns(ctx) {
        ctx.save();

        for (const pattern of activePatterns) {
            const progress = pattern.age / pattern.duration;
            const alpha = 1 - progress;

            if (pattern.type === 'path') {
                renderPathPattern(ctx, pattern, alpha);
            } else if (pattern.type === 'shape') {
                renderShapePattern(ctx, pattern, alpha);
            }
        }

        ctx.restore();
    }

    function renderPathPattern(ctx, pattern, alpha) {
        if (!pattern.zones || pattern.zones.length < 2) return;

        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = alpha;

        ctx.beginPath();

        pattern.zones.forEach((zoneName, i) => {
            const layout = ZONE_LAYOUT[zoneName];
            if (!layout) return;

            const x = gridX + (layout.x + layout.w / 2) * gridWidth;
            const y = gridY + (layout.y + layout.h / 2) * gridHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points at each zone
        pattern.zones.forEach(zoneName => {
            const layout = ZONE_LAYOUT[zoneName];
            if (!layout) return;

            const x = gridX + (layout.x + layout.w / 2) * gridWidth;
            const y = gridY + (layout.y + layout.h / 2) * gridHeight;

            ctx.fillStyle = colors.glow;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function renderShapePattern(ctx, pattern, alpha) {
        if (!pattern.zones || pattern.zones.length < 3) return;

        ctx.fillStyle = colors.glow;
        ctx.globalAlpha = alpha * 0.2;

        ctx.beginPath();

        pattern.zones.forEach((zoneName, i) => {
            const layout = ZONE_LAYOUT[zoneName];
            if (!layout) return;

            const x = gridX + (layout.x + layout.w / 2) * gridWidth;
            const y = gridY + (layout.y + layout.h / 2) * gridHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.closePath();
        ctx.fill();

        // Stroke outline
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        ctx.stroke();
    }

    function renderConnections(ctx) {
        ctx.save();

        // Get active zones
        const activeZones = Object.entries(zoneStates)
            .filter(([_, state]) => state.intensity > 0.3)
            .map(([name, _]) => name);

        if (activeZones.length >= 2) {
            ctx.strokeStyle = colors.glow;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;

            for (let i = 0; i < activeZones.length - 1; i++) {
                for (let j = i + 1; j < activeZones.length; j++) {
                    const zone1 = ZONE_LAYOUT[activeZones[i]];
                    const zone2 = ZONE_LAYOUT[activeZones[j]];

                    if (zone1 && zone2) {
                        const x1 = gridX + (zone1.x + zone1.w / 2) * gridWidth;
                        const y1 = gridY + (zone1.y + zone1.h / 2) * gridHeight;
                        const x2 = gridX + (zone2.x + zone2.w / 2) * gridWidth;
                        const y2 = gridY + (zone2.y + zone2.h / 2) * gridHeight;

                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                }
            }
        }

        ctx.restore();
    }

    function renderEffects(ctx) {
        // Beat pulse effect
        if (beatPhase > 0) {
            ctx.save();

            const rgb = parseColor(colors.glow);
            ctx.fillStyle = `rgba(${rgb?.r || 255}, ${rgb?.g || 255}, ${rgb?.b || 255}, ${beatPhase * CONFIG.beatPulseIntensity})`;
            ctx.fillRect(gridX, gridY, gridWidth, gridHeight);

            beatPhase *= 0.9;
            if (beatPhase < 0.01) beatPhase = 0;

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function onZoneEnter(data) {
        const zone = data.zone;
        if (zoneStates[zone]) {
            zoneStates[zone].targetIntensity = 1;
            zoneStates[zone].active = true;
        }
    }

    function onZoneExit(data) {
        const zone = data.zone;
        if (zoneStates[zone]) {
            zoneStates[zone].targetIntensity = 0;
            zoneStates[zone].active = false;
            zoneStates[zone].dwellProgress = 0;
        }
    }

    function onZoneDwell(data) {
        const zone = data.zone;
        const progress = data.progress || 0;

        if (zoneStates[zone]) {
            zoneStates[zone].dwellProgress = Math.min(1, progress);
        }
    }

    function onEraChange(data) {
        currentEra = data.to;
        colors = ERA_COLORS[currentEra] || ERA_COLORS.genesis;
    }

    function onBeat(data) {
        beatPhase = 1;
        lastBeatTime = time;
    }

    function onPatternDetected(data) {
        activePatterns.push({
            type: data.pattern?.type || 'path',
            zones: data.pattern?.zones || [],
            age: 0,
            duration: 2000
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

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
    // PUBLIC METHODS
    // ═══════════════════════════════════════════════════════════════════════

    function setZoneActive(zone, active = true) {
        if (zoneStates[zone]) {
            zoneStates[zone].targetIntensity = active ? 1 : 0;
            zoneStates[zone].active = active;
        }
    }

    function setZoneColor(zone, color) {
        if (zoneStates[zone]) {
            zoneStates[zone].color = color;
        }
    }

    function highlightPattern(zones, duration = 2000) {
        activePatterns.push({
            type: 'path',
            zones: zones,
            age: 0,
            duration
        });
    }

    function getZoneBounds(zoneName) {
        const layout = ZONE_LAYOUT[zoneName];
        if (!layout) return null;

        return {
            x: gridX + layout.x * gridWidth,
            y: gridY + layout.y * gridHeight,
            width: layout.w * gridWidth,
            height: layout.h * gridHeight
        };
    }

    function getZoneCenter(zoneName) {
        const bounds = getZoneBounds(zoneName);
        if (!bounds) return null;

        return {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2
        };
    }

    function getZoneAtPosition(x, y) {
        for (const zoneName in ZONE_LAYOUT) {
            const bounds = getZoneBounds(zoneName);
            if (bounds &&
                x >= bounds.x && x < bounds.x + bounds.width &&
                y >= bounds.y && y < bounds.y + bounds.height) {
                return zoneName;
            }
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        init,
        render,
        updateDimensions,

        // Zone control
        setZoneActive,
        setZoneColor,
        highlightPattern,

        // Query
        getZoneBounds,
        getZoneCenter,
        getZoneAtPosition,

        // State
        get zoneStates() { return zoneStates; },
        get currentEra() { return currentEra; },
        get colors() { return colors; },

        // Config
        CONFIG,
        ERA_COLORS,
        ZONE_LAYOUT
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpGridViz;
}
