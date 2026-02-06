/**
 * GUMP Conductor Input System v2
 *
 * You are the conductor. The orchestra follows.
 *
 * Touch = which section plays, how loud
 * Movement speed = articulation (legato/staccato)
 * Tilt = expression (vibrato, swell, pan)
 * Shake = intensity, fills, chaos
 *
 * iOS requires explicit permission for motion sensors.
 */

const GumpConductorInput = (function() {
    'use strict';

    const state = {
        // Permission
        motionPermission: false,
        permissionRequested: false,

        // Touch state
        touching: false,
        touchX: 0.5,
        touchY: 0.5,
        touchStartX: 0.5,
        touchStartY: 0.5,
        lastTouchX: 0.5,
        lastTouchY: 0.5,
        touchVelocityX: 0,
        touchVelocityY: 0,
        touchStartTime: 0,
        lastTouchTime: 0,

        // Smoothed values for conducting feel
        smoothX: 0.5,
        smoothY: 0.5,
        smoothVelocity: 0,

        // Device motion (requires permission on iOS)
        gyro: { alpha: 0, beta: 0, gamma: 0 },
        accel: { x: 0, y: 0, z: 0 },
        shake: 0,
        shakeHistory: [],

        // Gesture recognition
        gestureBuffer: [],
        currentGesture: null,
        gestureIntensity: 0,

        // Expression derived from all inputs
        expression: {
            vibrato: 0,      // From tilt oscillation
            swell: 0,        // From forward tilt
            pan: 0,          // From left/right tilt
            intensity: 0,    // From shake
            articulation: 0, // From movement speed
            dynamics: 0.5,   // From Y position
            section: 0.5     // From X position (which instruments)
        },

        // Update timing
        lastUpdateTime: 0,
        deltaTime: 0
    };

    const config = {
        smoothing: 0.12,           // Position smoothing (lower = smoother)
        velocitySmoothing: 0.2,    // Velocity smoothing
        shakeThreshold: 15,        // Acceleration magnitude for shake
        shakeDecay: 0.92,          // How fast shake dies down
        vibratoSensitivity: 0.03,  // How much tilt affects vibrato
        swellSensitivity: 0.02,    // How much forward tilt affects swell
        panSensitivity: 0.025      // How much side tilt affects pan
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init() {
        setupTouchListeners();

        // Check if we already have motion permission
        if (typeof DeviceMotionEvent !== 'undefined') {
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                // iOS 13+ requires permission
                console.log('[Conductor] iOS detected - motion requires permission');
            } else {
                // Non-iOS or older iOS - just add listeners
                setupMotionListeners();
                state.motionPermission = true;
            }
        }

        // Start update loop
        requestAnimationFrame(update);

        console.log('[Conductor] Ready to conduct');
    }

    /**
     * Request motion permission - MUST be called from user gesture (tap/click)
     */
    async function requestMotionPermission() {
        if (state.motionPermission) return true;
        if (state.permissionRequested) return state.motionPermission;

        state.permissionRequested = true;

        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    setupMotionListeners();
                    state.motionPermission = true;
                    console.log('[Conductor] Motion permission granted!');

                    // Emit event for UI feedback
                    emit('motion.granted', {});
                    return true;
                } else {
                    console.warn('[Conductor] Motion permission denied');
                    emit('motion.denied', {});
                    return false;
                }
            } catch (error) {
                console.error('[Conductor] Motion permission error:', error);
                return false;
            }
        }

        return state.motionPermission;
    }

    function setupTouchListeners() {
        // Use document for full-screen conducting
        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: false });
        document.addEventListener('touchcancel', onTouchEnd, { passive: false });

        // Mouse for desktop testing
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function setupMotionListeners() {
        window.addEventListener('deviceorientation', onDeviceOrientation, true);
        window.addEventListener('devicemotion', onDeviceMotion, true);
        console.log('[Conductor] Motion listeners active');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function update(timestamp) {
        const now = timestamp || performance.now();
        state.deltaTime = Math.min(50, now - state.lastUpdateTime); // Cap at 50ms
        state.lastUpdateTime = now;

        // Smooth position for fluid conducting feel
        state.smoothX += (state.touchX - state.smoothX) * config.smoothing;
        state.smoothY += (state.touchY - state.smoothY) * config.smoothing;

        // Calculate smoothed velocity
        const rawVelocity = Math.sqrt(
            state.touchVelocityX ** 2 + state.touchVelocityY ** 2
        );
        state.smoothVelocity += (rawVelocity - state.smoothVelocity) * config.velocitySmoothing;

        // Decay shake
        state.shake *= config.shakeDecay;

        // Update expression values
        updateExpression();

        // Emit continuous update for instruments
        if (state.touching) {
            emit('conducting.update', {
                position: { x: state.smoothX, y: state.smoothY },
                velocity: state.smoothVelocity,
                expression: { ...state.expression },
                gesture: state.currentGesture,
                touching: true
            });
        }

        requestAnimationFrame(update);
    }

    function updateExpression() {
        // Section (X): 0 = low instruments (bass, cello), 1 = high (violin)
        state.expression.section = state.smoothX;

        // Dynamics (Y): 0 = soft (top), 1 = loud (bottom)
        state.expression.dynamics = state.smoothY;

        // Articulation: from movement speed
        // 0 = legato (slow/no movement), 1 = staccato (fast movement)
        state.expression.articulation = Math.min(1, state.smoothVelocity * 2);

        // Vibrato: from side-to-side tilt oscillation
        state.expression.vibrato = Math.min(1, Math.abs(state.gyro.gamma || 0) * config.vibratoSensitivity);

        // Swell: from forward tilt (phone tilted toward you = swell up)
        const forwardTilt = (state.gyro.beta || 45) - 45; // Neutral at 45 degrees
        state.expression.swell = Math.max(0, Math.min(1, forwardTilt * config.swellSensitivity));

        // Pan: from left/right tilt
        state.expression.pan = Math.max(-1, Math.min(1, (state.gyro.gamma || 0) * config.panSensitivity));

        // Intensity: from shake
        state.expression.intensity = Math.min(1, state.shake / 10);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TOUCH HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function onTouchStart(e) {
        // Request motion permission on first touch (iOS requirement)
        if (!state.motionPermission && !state.permissionRequested) {
            requestMotionPermission();
        }

        e.preventDefault();
        const touch = e.touches[0];
        startTouch(touch.clientX, touch.clientY);
    }

    function onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            moveTouch(touch.clientX, touch.clientY);
        }
    }

    function onTouchEnd(e) {
        e.preventDefault();
        endTouch();
    }

    function onMouseDown(e) {
        startTouch(e.clientX, e.clientY);
    }

    function onMouseMove(e) {
        if (state.touching) {
            moveTouch(e.clientX, e.clientY);
        }
    }

    function onMouseUp(e) {
        endTouch();
    }

    function startTouch(clientX, clientY) {
        const now = performance.now();
        const x = clientX / window.innerWidth;
        const y = clientY / window.innerHeight;

        state.touching = true;
        state.touchStartTime = now;
        state.touchStartX = x;
        state.touchStartY = y;
        state.touchX = x;
        state.touchY = y;
        state.lastTouchX = x;
        state.lastTouchY = y;
        state.lastTouchTime = now;
        state.touchVelocityX = 0;
        state.touchVelocityY = 0;

        // Initialize smooth values
        state.smoothX = x;
        state.smoothY = y;

        // Clear gesture buffer
        state.gestureBuffer = [{ x, y, time: now }];

        emit('conducting.start', {
            position: { x, y },
            expression: { ...state.expression }
        });
    }

    function moveTouch(clientX, clientY) {
        const now = performance.now();
        const dt = (now - state.lastTouchTime) / 1000; // seconds

        if (dt < 0.008) return; // Throttle to ~120fps

        const x = clientX / window.innerWidth;
        const y = clientY / window.innerHeight;

        // Calculate velocity (units per second)
        if (dt > 0) {
            state.touchVelocityX = (x - state.lastTouchX) / dt;
            state.touchVelocityY = (y - state.lastTouchY) / dt;
        }

        state.lastTouchX = state.touchX;
        state.lastTouchY = state.touchY;
        state.touchX = x;
        state.touchY = y;
        state.lastTouchTime = now;

        // Add to gesture buffer
        state.gestureBuffer.push({ x, y, time: now });
        if (state.gestureBuffer.length > 60) {
            state.gestureBuffer.shift();
        }

        // Detect gesture patterns
        detectGesture();

        emit('conducting.move', {
            position: { x, y },
            velocity: { x: state.touchVelocityX, y: state.touchVelocityY },
            expression: { ...state.expression },
            gesture: state.currentGesture
        });
    }

    function endTouch() {
        if (!state.touching) return;

        const duration = performance.now() - state.touchStartTime;

        emit('conducting.end', {
            duration,
            finalVelocity: state.smoothVelocity,
            gesture: state.currentGesture,
            expression: { ...state.expression }
        });

        state.touching = false;
        state.touchVelocityX = 0;
        state.touchVelocityY = 0;
        state.currentGesture = null;
        state.gestureBuffer = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MOTION HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    function onDeviceOrientation(e) {
        state.gyro = {
            alpha: e.alpha || 0,  // Compass direction (0-360)
            beta: e.beta || 0,    // Front-back tilt (-180 to 180)
            gamma: e.gamma || 0   // Left-right tilt (-90 to 90)
        };

        emit('gyro.update', { ...state.gyro });
    }

    function onDeviceMotion(e) {
        const accel = e.accelerationIncludingGravity || {};
        state.accel = {
            x: accel.x || 0,
            y: accel.y || 0,
            z: accel.z || 0
        };

        // Calculate shake magnitude (subtract gravity ~9.8)
        const magnitude = Math.sqrt(
            state.accel.x ** 2 +
            state.accel.y ** 2 +
            state.accel.z ** 2
        );

        const shakeAmount = Math.max(0, magnitude - 12); // Threshold above gravity

        // Track shake history for pattern detection
        state.shakeHistory.push(shakeAmount);
        if (state.shakeHistory.length > 10) {
            state.shakeHistory.shift();
        }

        // Update shake (accumulates, decays in update loop)
        if (shakeAmount > config.shakeThreshold) {
            state.shake = Math.min(20, state.shake + shakeAmount * 0.3);
            emit('conducting.shake', { intensity: state.shake / 20 });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GESTURE DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function detectGesture() {
        if (state.gestureBuffer.length < 5) {
            state.currentGesture = null;
            return;
        }

        const recent = state.gestureBuffer.slice(-15);
        const first = recent[0];
        const last = recent[recent.length - 1];

        const dx = last.x - first.x;
        const dy = last.y - first.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = (last.time - first.time) / 1000;

        if (distance < 0.05) {
            state.currentGesture = 'hold';
            state.gestureIntensity = 0;
            return;
        }

        const speed = distance / duration;
        state.gestureIntensity = Math.min(1, speed * 2);

        // Determine gesture direction
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        if (Math.abs(dy) > Math.abs(dx) * 1.5) {
            // Vertical gesture
            state.currentGesture = dy < 0 ? 'sweep_up' : 'sweep_down';
        } else if (Math.abs(dx) > Math.abs(dy) * 1.5) {
            // Horizontal gesture
            state.currentGesture = dx > 0 ? 'sweep_right' : 'sweep_left';
        } else {
            // Diagonal or circular - check for circles
            if (recent.length >= 12) {
                const circle = detectCircle(recent);
                if (circle.isCircle) {
                    state.currentGesture = circle.clockwise ? 'circle_cw' : 'circle_ccw';
                } else {
                    state.currentGesture = 'sweep';
                }
            } else {
                state.currentGesture = 'sweep';
            }
        }
    }

    function detectCircle(points) {
        // Calculate cumulative angle change
        let totalAngle = 0;
        for (let i = 2; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const pprev = points[i - 2];

            const angle1 = Math.atan2(prev.y - pprev.y, prev.x - pprev.x);
            const angle2 = Math.atan2(curr.y - prev.y, curr.x - prev.x);

            let angleDiff = angle2 - angle1;
            // Normalize to -PI to PI
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            totalAngle += angleDiff;
        }

        return {
            isCircle: Math.abs(totalAngle) > Math.PI * 0.8, // At least 144 degrees
            clockwise: totalAngle > 0
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    function emit(event, data) {
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit(event, data);
        }
    }

    function getExpression() {
        return { ...state.expression };
    }

    function getState() {
        return {
            touching: state.touching,
            position: { x: state.smoothX, y: state.smoothY },
            velocity: state.smoothVelocity,
            expression: { ...state.expression },
            gesture: state.currentGesture,
            gestureIntensity: state.gestureIntensity,
            gyro: { ...state.gyro },
            shake: state.shake,
            motionPermission: state.motionPermission
        };
    }

    function hasMotionPermission() {
        return state.motionPermission;
    }

    return Object.freeze({
        init,
        requestMotionPermission,
        getExpression,
        getState,
        hasMotionPermission,

        // Direct access for debugging
        get touching() { return state.touching; },
        get position() { return { x: state.smoothX, y: state.smoothY }; },
        get velocity() { return state.smoothVelocity; },
        get gesture() { return state.currentGesture; }
    });

})();

if (typeof window !== 'undefined') {
    window.GumpConductorInput = GumpConductorInput;
}
