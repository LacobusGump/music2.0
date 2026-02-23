// ═══════════════════════════════════════════════════════════════════════════
// GUMP - THE INSTRUMENT (v38 — REBIRTH)
// ═══════════════════════════════════════════════════════════════════════════
//
// Minimal loop: canvas + input + organism + conductor.
// No grid, no zones, no unlocks, no patterns, no state store.
// Pick up the phone, tilt it, music responds. Touch adds a second axis.
//
// ═══════════════════════════════════════════════════════════════════════════

const GUMP = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // APP STATE
    // ═══════════════════════════════════════════════════════════════════════

    const app = {
        isInitialized: false,
        isRunning: false,
        isPaused: false,
        lastTime: 0,
        deltaTime: 0,
        elapsedTime: 0,
        frameCount: 0,
        canvas: null,
        ctx: null,
        width: 0,
        height: 0,
        dpr: 1,
        x: 0.5,
        y: 0.5,
        targetX: 0.5,
        targetY: 0.5,
        vx: 0,
        vy: 0,
        gestureActive: false,
        debugMode: false,
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CANVAS SETUP
    // ═══════════════════════════════════════════════════════════════════════

    function setupCanvas() {
        app.canvas = document.getElementById('c');
        app.ctx = app.canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        app.dpr = window.devicePixelRatio || 1;
        app.width = window.innerWidth;
        app.height = window.innerHeight;
        app.canvas.width = app.width * app.dpr;
        app.canvas.height = app.height * app.dpr;
        app.canvas.style.width = app.width + 'px';
        app.canvas.style.height = app.height + 'px';
        app.ctx.setTransform(app.dpr, 0, 0, app.dpr, 0, 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INPUT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function setupInput() {
        var c = app.canvas;
        c.addEventListener('mousemove', onMouseMove);
        c.addEventListener('mousedown', onMouseDown);
        c.addEventListener('mouseup', onMouseUp);
        c.addEventListener('touchstart', onTouchStart, { passive: false });
        c.addEventListener('touchmove', onTouchMove, { passive: false });
        c.addEventListener('touchend', onTouchEnd, { passive: false });

        // Motion/tilt permissions handled by conductor.js exclusively
    }

    function onMouseMove(e) {
        app.targetX = e.clientX / app.width;
        app.targetY = e.clientY / app.height;
    }
    function onMouseDown() { app.gestureActive = true; }
    function onMouseUp() { app.gestureActive = false; }

    function onTouchStart(e) {
        e.preventDefault();
        app.gestureActive = true;
        if (e.touches.length > 0) {
            app.targetX = e.touches[0].clientX / app.width;
            app.targetY = e.touches[0].clientY / app.height;
        }
        // NOTE: Motion/tilt permissions handled EXCLUSIVELY by conductor.js
        // (must request before preventDefault — Radiohead fix)
    }
    function onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            app.targetX = e.touches[0].clientX / app.width;
            app.targetY = e.touches[0].clientY / app.height;
        }
    }
    function onTouchEnd(e) {
        e.preventDefault();
        app.gestureActive = false;
    }

    // devicemotion handled by conductor.js — feeds G7 flywheel + MotionBrain

    // ═══════════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════════

    async function init() {
        if (app.isInitialized) return true;

        try {
            setupCanvas();
            setupInput();

            // Initialize audio
            try {
                var audioOk = await GumpAudio.init();
                if (audioOk && typeof GumpConductor !== 'undefined') {
                    GumpConductor.init(GumpAudio.context);
                    console.log('[GUMP] Conductor ready');
                }
            } catch (e) {
                console.error('Audio init failed:', e);
            }

            // Initialize context (weather + time)
            if (typeof GumpContext !== 'undefined') {
                GumpContext.init();
                console.log('[GUMP] Context ready');
            }

            app.isInitialized = true;
            return true;
        } catch (e) {
            console.error('Init failed:', e);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE — Position smoothing + organism + DNA. No grid/zones/unlocks.
    // ═══════════════════════════════════════════════════════════════════════

    function update(dt) {
        // Smooth position
        var prevX = app.x, prevY = app.y;
        app.x += (app.targetX - app.x) * 0.15;
        app.y += (app.targetY - app.y) * 0.15;
        app.vx = (app.x - prevX) / dt;
        app.vy = (app.y - prevY) / dt;

        // Musical DNA reads motion directly (has typeof guards)
        if (typeof GumpMusicalDNA !== 'undefined') GumpMusicalDNA.update(dt, app);

        // Organism evolution
        if (typeof GumpOrganism !== 'undefined') GumpOrganism.update(dt, app);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER — Black canvas + organism. That's it.
    // ═══════════════════════════════════════════════════════════════════════

    function render() {
        var c = app.ctx, w = app.width, h = app.height;

        // Fade to black (trail effect)
        c.fillStyle = 'rgba(0, 0, 0, 0.08)';
        c.fillRect(0, 0, w, h);

        // Draw organism (the only visual)
        drawCursor(c, w, h);

        // Minimal UI
        drawUI(c, w, h);

        if (app.debugMode) drawDebug(c, w, h);
    }

    function drawCursor(c, w, h) {
        if (typeof GumpOrganism !== 'undefined') {
            GumpOrganism.drawOrganism(c, app.x * w, app.y * h, w, h, app);
            return;
        }
        // Fallback: simple cursor
        var x = app.x * w, y = app.y * h;
        var energy = typeof GumpConductor !== 'undefined' ? GumpConductor.energy : 0;
        var size = 6 + energy * 20;

        c.fillStyle = 'rgba(255,255,255,' + (0.4 + energy * 0.4) + ')';
        c.beginPath();
        c.arc(x, y, size, 0, Math.PI * 2);
        c.fill();
    }

    function drawUI(c, w, h) {
        c.font = '10px monospace';

        // Void depth indicator (top center)
        if (typeof GumpMotionBrain !== 'undefined' && GumpMotionBrain.voidDepth > 0.1) {
            var depth = GumpMotionBrain.voidDepth;
            var alpha = depth * 0.4;
            c.textAlign = 'center';
            c.fillStyle = 'rgba(180,160,255,' + alpha + ')';
            var label = depth > 0.9 ? 'TRANSCENDENT' :
                        depth > 0.5 ? 'VOID' :
                        depth > 0.2 ? 'SETTLING' : '';
            if (label) c.fillText(label, w / 2, 30);
        }

        // Session time (top right)
        var mins = Math.floor(app.elapsedTime / 60);
        var secs = Math.floor(app.elapsedTime % 60);
        c.textAlign = 'right';
        c.fillStyle = 'rgba(255,255,255,0.1)';
        c.fillText(mins + ':' + secs.toString().padStart(2, '0'), w - 20, 30);
    }

    function drawDebug(c, w, h) {
        c.font = '10px monospace';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(255,255,255,0.5)';

        var lines = [
            'FPS: ' + (1 / app.deltaTime).toFixed(1),
            'Pos: ' + app.x.toFixed(2) + ', ' + app.y.toFixed(2),
        ];

        // Expression values
        if (typeof GumpConductor !== 'undefined') {
            var mc = GumpConductor.musicalContext;
            lines.push('Energy: ' + (GumpConductor.energy * 100).toFixed(0) + '%');
            lines.push('Tension: ' + (mc.harmonicTension || 0).toFixed(2));
            lines.push('Depth: ' + (mc.expressionDepth || 0).toFixed(2));
            lines.push('Arc: ' + (mc.emotionalArc || 0).toFixed(2));
            lines.push('Pattern: ' + (GumpConductor.motionPattern || 'none'));
        }

        // Tilt
        if (typeof GumpConductor !== 'undefined') {
            lines.push('Tilt: ' + (GumpConductor.tiltGranted ? 'ON' : 'off'));
            lines.push('Motion: ' + (GumpConductor.motionGranted ? 'ON' : 'off'));
        }

        // Motion brain
        if (typeof GumpMotionBrain !== 'undefined') {
            lines.push('Void: ' + GumpMotionBrain.voidDepth.toFixed(2));
        }
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            lines.push('Surprise: ' + GumpNeuromorphicMemory.surprise.toFixed(2));
        }

        // DNA
        if (typeof GumpMusicalDNA !== 'undefined') {
            var t = GumpMusicalDNA.traits;
            lines.push('DNA: A' + t.aggression.toFixed(2) +
                ' F' + t.fluidity.toFixed(2) +
                ' R' + t.rhythm.toFixed(2) +
                ' C' + t.contemplation.toFixed(2) +
                ' E' + t.exploration.toFixed(2));
            lines.push('Archetype: ' + (GumpMusicalDNA.archetype || 'forming(' +
                Math.floor(GumpMusicalDNA.formativeProgress * 100) + '%)'));
            if (GumpMusicalDNA.activeLens) {
                lines.push('Lens: ' + (GumpMusicalDNA.activeLens.name || 'custom'));
            }
        }

        // Weather/context
        if (typeof GumpContext !== 'undefined') {
            var ctx = GumpContext.get();
            lines.push('Weather: warmth=' + ctx.warmth.toFixed(2) +
                ' storm=' + ctx.storminess.toFixed(2));
            lines.push('Time: color=' + ctx.timeColor.toFixed(2) +
                ' day=' + ctx.isDay);
        }

        lines.forEach(function(line, i) {
            c.fillText(line, 10, 20 + i * 14);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function frame(timestamp) {
        if (!app.isRunning) return;

        if (app.lastTime === 0) app.lastTime = timestamp;
        app.deltaTime = Math.min(0.1, (timestamp - app.lastTime) / 1000);
        app.lastTime = timestamp;
        app.elapsedTime += app.deltaTime;
        app.frameCount++;

        if (!app.isPaused) {
            update(app.deltaTime);
            render();
        }

        requestAnimationFrame(frame);
    }

    async function start() {
        if (!app.isInitialized) await init();

        try {
            if (GumpAudio.isInitialized) {
                await GumpAudio.start();
            }
        } catch (e) {
            console.error('Audio start failed:', e);
        }

        app.isRunning = true;
        app.lastTime = 0;
        requestAnimationFrame(frame);
        console.log('[GUMP] v38 — fixing motion');

        // Initialize lens system
        if (typeof GumpLens !== 'undefined') {
            GumpLens.init();
        }
    }

    return Object.freeze({
        init: init,
        start: start,
        stop: function() { app.isRunning = false; },
        pause: function() { app.isPaused = true; },
        resume: function() { app.isPaused = false; },
        toggleDebug: function() { app.debugMode = !app.debugMode; },
        get isInitialized() { return app.isInitialized; },
        get isRunning() { return app.isRunning; },
        get isPaused() { return app.isPaused; },
    });
})();
