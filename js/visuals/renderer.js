/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - VISUAL RENDERER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Core rendering engine for the GUMP visual system.
 * Manages canvas, layers, effects, and visual composition.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpRenderer = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        targetFPS: 60,
        minFPS: 30,
        fadeSpeed: 0.02,
        trailAlpha: 0.1,
        particleLimit: 1000,
        glowIterations: 3,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    let canvas = null;
    let ctx = null;
    let width = 0;
    let height = 0;

    // Layers for compositing
    const layers = {
        background: null,
        grid: null,
        zones: null,
        particles: null,
        connections: null,
        ui: null
    };

    // Animation state
    let isRunning = false;
    let animationId = null;
    let lastFrameTime = 0;
    let deltaTime = 0;
    let frameCount = 0;

    // Visual state
    const visualState = {
        backgroundColor: { r: 0, g: 0, b: 0 },
        targetBackgroundColor: { r: 0, g: 0, b: 0 },
        globalAlpha: 1,
        blur: 0,
        shake: { x: 0, y: 0 },
        zoom: 1,
        rotation: 0
    };

    // Render queue
    const renderQueue = [];

    // Effects
    const activeEffects = [];

    // Performance tracking
    const performance = {
        fps: 60,
        frameTime: 16.67,
        renderTime: 0,
        frames: []
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');

        // Set up canvas size
        resize();

        // Create offscreen layers
        createLayers();

        // Listen for resize
        window.addEventListener('resize', resize);

        console.log('[GumpRenderer] Initialized', width, 'x', height);

        return true;
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;

        // Set canvas size with DPR
        canvas.width = width * CONFIG.dpr;
        canvas.height = height * CONFIG.dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        // Scale context
        ctx.setTransform(CONFIG.dpr, 0, 0, CONFIG.dpr, 0, 0);

        // Resize layers
        for (const name in layers) {
            if (layers[name]) {
                layers[name].canvas.width = width * CONFIG.dpr;
                layers[name].canvas.height = height * CONFIG.dpr;
                layers[name].ctx.setTransform(CONFIG.dpr, 0, 0, CONFIG.dpr, 0, 0);
            }
        }
    }

    function createLayers() {
        for (const name in layers) {
            const offscreen = document.createElement('canvas');
            offscreen.width = width * CONFIG.dpr;
            offscreen.height = height * CONFIG.dpr;

            const offscreenCtx = offscreen.getContext('2d');
            offscreenCtx.setTransform(CONFIG.dpr, 0, 0, CONFIG.dpr, 0, 0);

            layers[name] = {
                canvas: offscreen,
                ctx: offscreenCtx,
                visible: true,
                alpha: 1,
                blendMode: 'source-over'
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function start() {
        if (isRunning) return;
        isRunning = true;
        lastFrameTime = performance.now();
        loop();
    }

    function stop() {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function loop(timestamp = 0) {
        if (!isRunning) return;

        // Calculate delta time
        deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;

        // Track performance
        trackPerformance(deltaTime);

        // Clear main canvas
        clearCanvas();

        // Update visual state
        updateVisualState(deltaTime);

        // Process render queue
        processRenderQueue();

        // Update effects
        updateEffects(deltaTime);

        // Render layers
        renderLayers();

        // Composite to main canvas
        compositeLayers();

        frameCount++;

        // Schedule next frame
        animationId = requestAnimationFrame(loop);
    }

    function trackPerformance(dt) {
        performance.frames.push(dt);
        if (performance.frames.length > 60) {
            performance.frames.shift();
        }

        const avg = performance.frames.reduce((a, b) => a + b, 0) / performance.frames.length;
        performance.fps = Math.round(1000 / avg);
        performance.frameTime = avg;
    }

    function clearCanvas() {
        const { r, g, b } = visualState.backgroundColor;

        // Use trail effect for fade
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${CONFIG.trailAlpha})`;
        ctx.fillRect(0, 0, width, height);
    }

    function updateVisualState(dt) {
        const speed = CONFIG.fadeSpeed * (dt / 16.67);

        // Interpolate background color
        visualState.backgroundColor.r += (visualState.targetBackgroundColor.r - visualState.backgroundColor.r) * speed;
        visualState.backgroundColor.g += (visualState.targetBackgroundColor.g - visualState.backgroundColor.g) * speed;
        visualState.backgroundColor.b += (visualState.targetBackgroundColor.b - visualState.backgroundColor.b) * speed;

        // Decay shake
        visualState.shake.x *= 0.9;
        visualState.shake.y *= 0.9;

        // Interpolate zoom
        visualState.zoom += (1 - visualState.zoom) * speed * 0.5;
    }

    function processRenderQueue() {
        while (renderQueue.length > 0) {
            const item = renderQueue.shift();
            item.render(layers[item.layer]?.ctx || ctx);
        }
    }

    function updateEffects(dt) {
        for (let i = activeEffects.length - 1; i >= 0; i--) {
            const effect = activeEffects[i];

            effect.update(dt);

            if (effect.isComplete) {
                activeEffects.splice(i, 1);
            }
        }
    }

    function renderLayers() {
        // Clear layers
        for (const name in layers) {
            const layer = layers[name];
            layer.ctx.clearRect(0, 0, width, height);
        }

        // Render each layer's content
        for (const effect of activeEffects) {
            const layer = layers[effect.layer];
            if (layer) {
                effect.render(layer.ctx);
            }
        }
    }

    function compositeLayers() {
        ctx.save();

        // Apply global transforms
        if (visualState.shake.x !== 0 || visualState.shake.y !== 0) {
            ctx.translate(visualState.shake.x, visualState.shake.y);
        }

        if (visualState.zoom !== 1) {
            ctx.translate(width / 2, height / 2);
            ctx.scale(visualState.zoom, visualState.zoom);
            ctx.translate(-width / 2, -height / 2);
        }

        if (visualState.rotation !== 0) {
            ctx.translate(width / 2, height / 2);
            ctx.rotate(visualState.rotation);
            ctx.translate(-width / 2, -height / 2);
        }

        // Draw layers in order
        const layerOrder = ['background', 'grid', 'zones', 'particles', 'connections', 'ui'];

        for (const name of layerOrder) {
            const layer = layers[name];
            if (layer && layer.visible) {
                ctx.globalAlpha = layer.alpha * visualState.globalAlpha;
                ctx.globalCompositeOperation = layer.blendMode;
                ctx.drawImage(layer.canvas, 0, 0, width, height);
            }
        }

        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DRAWING UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function drawCircle(context, x, y, radius, color, alpha = 1) {
        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    function drawRing(context, x, y, innerRadius, outerRadius, color, alpha = 1) {
        context.save();
        context.globalAlpha = alpha;
        context.strokeStyle = color;
        context.lineWidth = outerRadius - innerRadius;
        context.beginPath();
        context.arc(x, y, (innerRadius + outerRadius) / 2, 0, Math.PI * 2);
        context.stroke();
        context.restore();
    }

    function drawLine(context, x1, y1, x2, y2, color, width = 1, alpha = 1) {
        context.save();
        context.globalAlpha = alpha;
        context.strokeStyle = color;
        context.lineWidth = width;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.restore();
    }

    function drawGradientLine(context, x1, y1, x2, y2, color1, color2, width = 1, alpha = 1) {
        const gradient = context.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        context.save();
        context.globalAlpha = alpha;
        context.strokeStyle = gradient;
        context.lineWidth = width;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.restore();
    }

    function drawRect(context, x, y, w, h, color, alpha = 1) {
        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = color;
        context.fillRect(x, y, w, h);
        context.restore();
    }

    function drawRoundedRect(context, x, y, w, h, radius, color, alpha = 1) {
        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = color;
        context.beginPath();
        context.roundRect(x, y, w, h, radius);
        context.fill();
        context.restore();
    }

    function drawText(context, text, x, y, options = {}) {
        const {
            color = '#ffffff',
            font = '12px monospace',
            align = 'left',
            baseline = 'top',
            alpha = 1
        } = options;

        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = color;
        context.font = font;
        context.textAlign = align;
        context.textBaseline = baseline;
        context.fillText(text, x, y);
        context.restore();
    }

    function drawGlow(context, x, y, radius, color, intensity = 1) {
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);

        // Parse color
        const rgb = parseColor(color);
        if (!rgb) return;

        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity})`);
        gradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * 0.5})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        context.save();
        context.globalCompositeOperation = 'screen';
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    function parseColor(color) {
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            return {
                r: parseInt(hex.substr(0, 2), 16),
                g: parseInt(hex.substr(2, 2), 16),
                b: parseInt(hex.substr(4, 2), 16)
            };
        }

        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1]),
                g: parseInt(rgbMatch[2]),
                b: parseInt(rgbMatch[3])
            };
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════════════════

    function addEffect(effect) {
        activeEffects.push(effect);
    }

    function clearEffects(layer = null) {
        if (layer) {
            for (let i = activeEffects.length - 1; i >= 0; i--) {
                if (activeEffects[i].layer === layer) {
                    activeEffects.splice(i, 1);
                }
            }
        } else {
            activeEffects.length = 0;
        }
    }

    function setBackgroundColor(r, g, b) {
        visualState.targetBackgroundColor = { r, g, b };
    }

    function shake(intensity = 10, duration = 200) {
        const startTime = performance.now();
        const effect = {
            layer: 'background',
            isComplete: false,
            update(dt) {
                const elapsed = performance.now() - startTime;
                if (elapsed >= duration) {
                    this.isComplete = true;
                    visualState.shake.x = 0;
                    visualState.shake.y = 0;
                } else {
                    const decay = 1 - (elapsed / duration);
                    visualState.shake.x = (Math.random() - 0.5) * intensity * decay;
                    visualState.shake.y = (Math.random() - 0.5) * intensity * decay;
                }
            },
            render() {}
        };

        addEffect(effect);
    }

    function flash(color = '#ffffff', duration = 100) {
        const startTime = performance.now();
        const rgb = parseColor(color) || { r: 255, g: 255, b: 255 };

        const effect = {
            layer: 'ui',
            isComplete: false,
            update(dt) {
                const elapsed = performance.now() - startTime;
                if (elapsed >= duration) {
                    this.isComplete = true;
                }
            },
            render(context) {
                const elapsed = performance.now() - startTime;
                const alpha = 1 - (elapsed / duration);
                drawRect(context, 0, 0, width, height, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.3})`);
            }
        };

        addEffect(effect);
    }

    function pulse(x, y, radius, color, duration = 500) {
        const startTime = performance.now();
        const rgb = parseColor(color) || { r: 255, g: 255, b: 255 };

        const effect = {
            layer: 'particles',
            isComplete: false,
            update(dt) {
                const elapsed = performance.now() - startTime;
                if (elapsed >= duration) {
                    this.isComplete = true;
                }
            },
            render(context) {
                const elapsed = performance.now() - startTime;
                const progress = elapsed / duration;
                const currentRadius = radius * progress;
                const alpha = 1 - progress;

                drawRing(context, x, y, currentRadius - 2, currentRadius + 2,
                    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
            }
        };

        addEffect(effect);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function setLayerVisible(layerName, visible) {
        if (layers[layerName]) {
            layers[layerName].visible = visible;
        }
    }

    function setLayerAlpha(layerName, alpha) {
        if (layers[layerName]) {
            layers[layerName].alpha = alpha;
        }
    }

    function setLayerBlendMode(layerName, blendMode) {
        if (layers[layerName]) {
            layers[layerName].blendMode = blendMode;
        }
    }

    function getLayerContext(layerName) {
        return layers[layerName]?.ctx || null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER QUEUE
    // ═══════════════════════════════════════════════════════════════════════

    function queueRender(layer, renderFn) {
        renderQueue.push({
            layer,
            render: renderFn
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // Lifecycle
        init,
        start,
        stop,
        resize,

        // Drawing utilities
        drawCircle,
        drawRing,
        drawLine,
        drawGradientLine,
        drawRect,
        drawRoundedRect,
        drawText,
        drawGlow,

        // Effects
        addEffect,
        clearEffects,
        setBackgroundColor,
        shake,
        flash,
        pulse,

        // Layers
        setLayerVisible,
        setLayerAlpha,
        setLayerBlendMode,
        getLayerContext,
        queueRender,

        // Getters
        get width() { return width; },
        get height() { return height; },
        get ctx() { return ctx; },
        get isRunning() { return isRunning; },
        get fps() { return performance.fps; },
        get frameCount() { return frameCount; },
        get deltaTime() { return deltaTime; },

        // Config
        CONFIG
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpRenderer;
}
