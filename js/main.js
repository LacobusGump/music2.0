// ═══════════════════════════════════════════════════════════════════════════
// GUMP - THE EMERGENCE (v32 — Minimal Core)
// ═══════════════════════════════════════════════════════════════════════════
//
// Canvas + Grid + Patterns + Unlocks + Render.
// Audio lives in conductor.js. Motion intelligence in motion.js + memory.js.
// This file is ONLY the visual shell and grid interaction layer.
//
// ═══════════════════════════════════════════════════════════════════════════

const GUMP = (function() {
    'use strict';

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
    // INIT
    // ═══════════════════════════════════════════════════════════════════════

    async function init() {
        if (app.isInitialized) return true;

        try {
            setupCanvas();
            setupInput();

            GumpState.startSession();

            // Initialize audio
            try {
                const audioOk = await GumpAudio.init();
                if (audioOk && typeof GumpConductor !== 'undefined') {
                    GumpConductor.init(GumpAudio.context);
                    console.log('[GUMP] Conductor ready');
                }
            } catch (e) {
                console.error('Audio init failed:', e);
            }

            app.isInitialized = true;
            return true;
        } catch (e) {
            console.error('Init failed:', e);
            return false;
        }
    }

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
    // INPUT — Position tracking for grid. Sound handled by conductor.js.
    // ═══════════════════════════════════════════════════════════════════════

    function setupInput() {
        const c = app.canvas;
        c.addEventListener('mousemove', onMouseMove);
        c.addEventListener('mousedown', onMouseDown);
        c.addEventListener('mouseup', onMouseUp);
        c.addEventListener('touchstart', onTouchStart, { passive: false });
        c.addEventListener('touchmove', onTouchMove, { passive: false });
        c.addEventListener('touchend', onTouchEnd, { passive: false });

        // Motion for position (non-iOS auto-listen)
        if (window.DeviceMotionEvent) {
            if (typeof DeviceMotionEvent.requestPermission !== 'function') {
                window.addEventListener('devicemotion', onDeviceMotion);
            }
        }
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
        // iOS motion permission on first touch
        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(function(p) {
                if (p === 'granted') {
                    window.addEventListener('devicemotion', onDeviceMotion);
                }
            }).catch(function() {});
        }
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

    function onDeviceMotion(e) {
        const a = e.accelerationIncludingGravity;
        if (!a) return;
        app.targetX = Math.max(0, Math.min(1, 0.5 + (a.x || 0) / 12.5));
        app.targetY = Math.max(0, Math.min(1, 0.5 - (a.y || 0) / 12.5));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE — Grid + Patterns + Unlocks (no audio here)
    // ═══════════════════════════════════════════════════════════════════════

    function update(dt) {
        // Smooth position
        const prevX = app.x, prevY = app.y;
        app.x += (app.targetX - app.x) * 0.15;
        app.y += (app.targetY - app.y) * 0.15;
        app.vx = (app.x - prevX) / dt;
        app.vy = (app.y - prevY) / dt;

        GumpState.updateInput(app.x, app.y, dt);
        GumpState.updateSession(dt);

        // Grid
        const gridResult = GumpGrid.update(app.x, app.y, dt, GumpState);
        if (gridResult.transition) {
            if (typeof GumpEvents !== 'undefined') {
                GumpEvents.emit('zone.change', {
                    from: gridResult.transition.from,
                    to: gridResult.transition.to
                });
            }
        }

        // Patterns
        GumpPatterns.addPosition(app.x, app.y, app.vx, app.vy, Date.now());
        if (gridResult.transition) {
            GumpPatterns.addZoneVisit(
                gridResult.transition.from, Date.now(),
                GumpGrid.getZoneState(gridResult.transition.from)?.dwellTime || 0
            );
        }
        GumpPatterns.detectPatterns(new Set(GumpGrid.getActiveZones()), dt);

        // Unlocks
        GumpUnlocks.checkUnlocks({
            currentZone: gridResult.zone,
            zoneStates: GumpGrid.state.zones,
            activeZones: new Set(GumpGrid.getActiveZones()),
            patterns: GumpPatterns.getActivePatterns(),
            activePatterns: GumpPatterns.getActivePatterns(),
            currentEra: GumpUnlocks.currentEra,
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER — Minimal visuals. The void IS the canvas.
    // ═══════════════════════════════════════════════════════════════════════

    function render() {
        const c = app.ctx, w = app.width, h = app.height;

        // Fade to black
        c.fillStyle = 'rgba(0, 0, 0, 0.08)';
        c.fillRect(0, 0, w, h);

        drawGrid(c, w, h);
        drawZones(c, w, h);
        drawConnections(c, w, h);
        drawCursor(c, w, h);
        drawUI(c, w, h);

        if (app.debugMode) drawDebug(c, w, h);
    }

    function drawGrid(c, w, h) {
        c.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(w * 0.333, 0); c.lineTo(w * 0.333, h);
        c.moveTo(w * 0.666, 0); c.lineTo(w * 0.666, h);
        c.moveTo(0, h * 0.333); c.lineTo(w, h * 0.333);
        c.moveTo(0, h * 0.666); c.lineTo(w, h * 0.666);
        c.stroke();
    }

    function drawZones(c, w, h) {
        const zones = GumpGrid.state.zones;
        const zw = w / 3, zh = h / 3;

        for (const [id, zs] of Object.entries(zones)) {
            const props = GumpGrid.getZoneProperties(id);
            const x = props.coords.x * zw, y = props.coords.y * zh;
            const glow = zs.glowIntensity;

            if (glow > 0.01) {
                const g = c.createRadialGradient(
                    x + zw / 2, y + zh / 2, 0,
                    x + zw / 2, y + zh / 2, Math.min(zw, zh) / 2
                );
                g.addColorStop(0, 'rgba(255,255,255,' + (glow * 0.15) + ')');
                g.addColorStop(1, 'rgba(255,255,255,0)');
                c.fillStyle = g;
                c.fillRect(x, y, zw, zh);
            }

            if (zs.isActive) {
                c.strokeStyle = 'rgba(255,255,255,' + (0.1 + glow * 0.2) + ')';
                c.lineWidth = 2;
                c.strokeRect(x + 5, y + 5, zw - 10, zh - 10);
            }

            if (zs.isLocked) {
                c.fillStyle = 'rgba(255,215,0,' + (0.05 + glow * 0.1) + ')';
                c.fillRect(x + 10, y + 10, zw - 20, zh - 20);
            }
        }
    }

    function drawConnections(c, w, h) {
        const conns = GumpGrid.state.connections;
        const zw = w / 3, zh = h / 3;
        c.lineWidth = 2;

        for (const [key, strength] of conns.entries()) {
            const [z1, z2] = key.split('_');
            const p1 = GumpGrid.getZoneProperties(z1);
            const p2 = GumpGrid.getZoneProperties(z2);
            if (!p1 || !p2) continue;

            c.strokeStyle = 'rgba(255,255,255,' + (strength * 0.2) + ')';
            c.beginPath();
            c.moveTo(p1.coords.x * zw + zw / 2, p1.coords.y * zh + zh / 2);
            c.lineTo(p2.coords.x * zw + zw / 2, p2.coords.y * zh + zh / 2);
            c.stroke();
        }
    }

    function drawCursor(c, w, h) {
        const x = app.x * w, y = app.y * h;
        const energy = typeof GumpConductor !== 'undefined' ? GumpConductor.energy : 0;
        const zone = GumpState.get('grid.currentZone');
        const zs = GumpGrid.getZoneState(zone);
        const dwell = zs?.dwellTime || 0;
        const size = 6 + energy * 20;

        if (dwell > 0.5) {
            c.fillStyle = 'rgba(255,255,255,' + Math.min(0.3, dwell * 0.05) + ')';
            c.beginPath();
            c.arc(x, y, size + dwell * 10, 0, Math.PI * 2);
            c.fill();
        }

        c.fillStyle = 'rgba(255,255,255,' + (0.4 + energy * 0.4) + ')';
        c.beginPath();
        c.arc(x, y, size, 0, Math.PI * 2);
        c.fill();

        // Velocity trail
        if (Math.abs(app.vx) > 0.1 || Math.abs(app.vy) > 0.1) {
            c.strokeStyle = 'rgba(255,255,255,0.1)';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x - app.vx * 0.05 * w, y - app.vy * 0.05 * h);
            c.stroke();
        }
    }

    function drawUI(c, w, h) {
        const zone = GumpState.get('grid.currentZone');
        const zs = GumpGrid.getZoneState(zone);
        const dwell = zs?.dwellTime || 0;
        const energy = typeof GumpConductor !== 'undefined' ? GumpConductor.energy : 0;

        c.font = '10px monospace';

        // Void depth indicator (top center)
        if (typeof GumpMotionBrain !== 'undefined' && GumpMotionBrain.voidDepth > 0.1) {
            const depth = GumpMotionBrain.voidDepth;
            const alpha = depth * 0.4;
            c.textAlign = 'center';
            c.fillStyle = 'rgba(180,160,255,' + alpha + ')';
            const label = depth > 0.9 ? 'TRANSCENDENT' :
                          depth > 0.5 ? 'VOID' :
                          depth > 0.2 ? 'SETTLING' : '';
            if (label) c.fillText(label, w / 2, 30);
        }

        // Session time (top right)
        const mins = Math.floor(app.elapsedTime / 60);
        const secs = Math.floor(app.elapsedTime % 60);
        c.textAlign = 'right';
        c.fillStyle = 'rgba(255,255,255,0.1)';
        c.fillText(mins + ':' + secs.toString().padStart(2, '0'), w - 20, 30);

        // Zone (bottom right)
        c.fillText(zone, w - 20, h - 20);

        // Energy bar (top)
        c.fillStyle = 'rgba(255,255,255,0.02)';
        c.fillRect(0, 0, w, 2);
        c.fillStyle = 'rgba(255,200,100,' + (0.2 + energy * 0.3) + ')';
        c.fillRect(0, 0, w * energy, 2);

        // Dwell bar (bottom)
        c.fillStyle = 'rgba(255,255,255,0.02)';
        c.fillRect(0, h - 2, w, 2);
        c.fillStyle = 'rgba(255,255,255,0.2)';
        c.fillRect(0, h - 2, w * Math.min(1, dwell / 3), 2);
    }

    function drawDebug(c, w, h) {
        c.font = '10px monospace';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(255,255,255,0.5)';

        const lines = [
            'FPS: ' + (1 / app.deltaTime).toFixed(1),
            'Zone: ' + GumpState.get('grid.currentZone'),
            'Energy: ' + ((typeof GumpConductor !== 'undefined' ? GumpConductor.energy : 0) * 100).toFixed(0) + '%',
        ];

        if (typeof GumpMotionBrain !== 'undefined') {
            lines.push('Void: ' + GumpMotionBrain.voidDepth.toFixed(2));
            lines.push('Pattern: ' + (GumpConductor.motionPattern || 'none'));
        }
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            lines.push('Surprise: ' + GumpNeuromorphicMemory.surprise.toFixed(2));
            lines.push('Sessions: ' + GumpNeuromorphicMemory.personalProfile.lifetimeSessions);
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
        console.log('[GUMP] v32-NEUROMORPHIC — Conductor + MotionBrain + Memory');
    }

    return Object.freeze({
        init,
        start,
        stop: function() { app.isRunning = false; },
        pause: function() { app.isPaused = true; },
        resume: function() { app.isPaused = false; },
        toggleDebug: function() { app.debugMode = !app.debugMode; },
        get isInitialized() { return app.isInitialized; },
        get isRunning() { return app.isRunning; },
        get isPaused() { return app.isPaused; },
    });
})();
