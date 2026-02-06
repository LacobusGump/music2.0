/**
 * GUMP Conductor Input System
 *
 * Interprets touch + device motion as conducting gestures.
 * You're not pressing buttons - you're conducting an orchestra.
 *
 * Input dimensions:
 * - Touch X/Y position
 * - Touch velocity (speed of movement)
 * - Device tilt (gyroscope)
 * - Device shake (accelerometer)
 */

const GumpConductorInput = (function() {
    'use strict';

    const state = {
        // Touch state
        touching: false,
        touchX: 0.5,
        touchY: 0.5,
        lastTouchX: 0.5,
        lastTouchY: 0.5,
        touchVelocityX: 0,
        touchVelocityY: 0,
        touchStartTime: 0,

        // Device motion
        gyro: { alpha: 0, beta: 0, gamma: 0 },
        accel: { x: 0, y: 0, z: 0 },
        shake: 0,

        // Gesture detection
        gestureBuffer: [],
        gestureBufferSize: 30,  // ~0.5s at 60fps
        lastUpdateTime: 0,

        // Detected gestures
        currentGesture: null,
        gestureConfidence: 0
    };

    const GESTURES = {
        SWEEP_UP: { name: 'sweep_up', musical: 'crescendo' },
        SWEEP_DOWN: { name: 'sweep_down', musical: 'diminuendo' },
        SWEEP_LEFT: { name: 'sweep_left', musical: 'strings_low' },
        SWEEP_RIGHT: { name: 'sweep_right', musical: 'strings_high' },
        CIRCLE_CW: { name: 'circle_cw', musical: 'arpeggio_up' },
        CIRCLE_CCW: { name: 'circle_ccw', musical: 'arpeggio_down' },
        TAP: { name: 'tap', musical: 'staccato' },
        HOLD: { name: 'hold', musical: 'sustain' },
        SHAKE: { name: 'shake', musical: 'tremolo' },
        TILT_LEFT: { name: 'tilt_left', musical: 'pan_left' },
        TILT_RIGHT: { name: 'tilt_right', musical: 'pan_right' },
        TILT_FORWARD: { name: 'tilt_forward', musical: 'swell' },
        TILT_BACK: { name: 'tilt_back', musical: 'release' }
    };

    function init() {
        setupTouchListeners();
        setupMotionListeners();
        console.log('[ConductorInput] Ready to conduct');
    }

    function setupTouchListeners() {
        const canvas = document.getElementById('c');
        if (!canvas) {
            console.warn('[ConductorInput] No canvas found, using document');
        }
        const target = canvas || document;

        target.addEventListener('touchstart', onTouchStart, { passive: false });
        target.addEventListener('touchmove', onTouchMove, { passive: false });
        target.addEventListener('touchend', onTouchEnd, { passive: false });

        target.addEventListener('mousedown', onMouseDown);
        target.addEventListener('mousemove', onMouseMove);
        target.addEventListener('mouseup', onMouseUp);
    }

    function setupMotionListeners() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', onDeviceOrientation);
        }
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', onDeviceMotion);
        }
    }

    // Touch handlers
    function onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        startTouch(touch.clientX, touch.clientY);
    }

    function onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        moveTouch(touch.clientX, touch.clientY);
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
        state.touching = true;
        state.touchStartTime = performance.now();

        const x = clientX / window.innerWidth;
        const y = clientY / window.innerHeight;

        state.touchX = x;
        state.touchY = y;
        state.lastTouchX = x;
        state.lastTouchY = y;
        state.touchVelocityX = 0;
        state.touchVelocityY = 0;

        state.gestureBuffer = [];

        emit('gesture.start', {
            x, y,
            velocityX: 0,
            velocityY: 0,
            time: state.touchStartTime
        });
    }

    function moveTouch(clientX, clientY) {
        const now = performance.now();
        const dt = now - state.lastUpdateTime;
        if (dt < 8) return;  // Throttle to ~120fps max

        const x = clientX / window.innerWidth;
        const y = clientY / window.innerHeight;

        // Calculate velocity
        const dx = x - state.lastTouchX;
        const dy = y - state.lastTouchY;
        state.touchVelocityX = dx / (dt / 1000);
        state.touchVelocityY = dy / (dt / 1000);

        state.lastTouchX = state.touchX;
        state.lastTouchY = state.touchY;
        state.touchX = x;
        state.touchY = y;
        state.lastUpdateTime = now;

        // Add to gesture buffer
        state.gestureBuffer.push({ x, y, dx, dy, time: now });
        if (state.gestureBuffer.length > state.gestureBufferSize) {
            state.gestureBuffer.shift();
        }

        // Detect gesture pattern
        detectGesture();

        emit('gesture.move', {
            x, y,
            velocityX: state.touchVelocityX,
            velocityY: state.touchVelocityY,
            gesture: state.currentGesture,
            time: now
        });
    }

    function endTouch() {
        const touchDuration = performance.now() - state.touchStartTime;

        // Detect tap vs hold
        if (touchDuration < 200 && state.gestureBuffer.length < 5) {
            state.currentGesture = GESTURES.TAP;
        } else if (touchDuration > 500 && getAverageVelocity() < 0.1) {
            state.currentGesture = GESTURES.HOLD;
        }

        emit('gesture.end', {
            gesture: state.currentGesture,
            duration: touchDuration,
            finalVelocity: getAverageVelocity()
        });

        state.touching = false;
        state.currentGesture = null;
        state.gestureBuffer = [];
    }

    // Motion handlers
    function onDeviceOrientation(e) {
        state.gyro = {
            alpha: e.alpha || 0,  // Z-axis rotation (0-360)
            beta: e.beta || 0,    // X-axis tilt (-180 to 180)
            gamma: e.gamma || 0   // Y-axis tilt (-90 to 90)
        };

        // Detect tilt gestures
        if (Math.abs(state.gyro.gamma) > 20) {
            state.currentGesture = state.gyro.gamma > 0 ?
                GESTURES.TILT_RIGHT : GESTURES.TILT_LEFT;
        }
        if (Math.abs(state.gyro.beta - 45) > 30) {
            state.currentGesture = state.gyro.beta > 45 ?
                GESTURES.TILT_FORWARD : GESTURES.TILT_BACK;
        }

        emit('gyro.update', state.gyro);
    }

    function onDeviceMotion(e) {
        const accel = e.accelerationIncludingGravity || {};
        state.accel = {
            x: accel.x || 0,
            y: accel.y || 0,
            z: accel.z || 0
        };

        // Detect shake
        const magnitude = Math.sqrt(
            state.accel.x ** 2 +
            state.accel.y ** 2 +
            state.accel.z ** 2
        );

        // Subtract gravity (~9.8)
        const shake = Math.max(0, magnitude - 12);
        state.shake = shake * 0.3 + state.shake * 0.7;  // Smooth

        if (state.shake > 5) {
            state.currentGesture = GESTURES.SHAKE;
            emit('gesture.shake', { intensity: state.shake / 20 });
        }

        emit('accel.update', { ...state.accel, shake: state.shake });
    }

    function detectGesture() {
        if (state.gestureBuffer.length < 5) return;

        const recent = state.gestureBuffer.slice(-10);
        const totalDx = recent.reduce((sum, p) => sum + p.dx, 0);
        const totalDy = recent.reduce((sum, p) => sum + p.dy, 0);

        const absX = Math.abs(totalDx);
        const absY = Math.abs(totalDy);

        // Sweep detection
        if (absX > 0.1 || absY > 0.1) {
            if (absY > absX) {
                state.currentGesture = totalDy < 0 ?
                    GESTURES.SWEEP_UP : GESTURES.SWEEP_DOWN;
            } else {
                state.currentGesture = totalDx > 0 ?
                    GESTURES.SWEEP_RIGHT : GESTURES.SWEEP_LEFT;
            }
        }

        // Circle detection (simplified)
        if (state.gestureBuffer.length >= 20) {
            const isCircle = detectCircle(state.gestureBuffer.slice(-20));
            if (isCircle.detected) {
                state.currentGesture = isCircle.clockwise ?
                    GESTURES.CIRCLE_CW : GESTURES.CIRCLE_CCW;
            }
        }
    }

    function detectCircle(points) {
        // Calculate angular movement
        let totalAngle = 0;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const angle = Math.atan2(curr.dy, curr.dx) - Math.atan2(prev.dy, prev.dx);
            totalAngle += angle;
        }

        const detected = Math.abs(totalAngle) > Math.PI;  // At least half circle
        return {
            detected,
            clockwise: totalAngle > 0
        };
    }

    function getAverageVelocity() {
        if (state.gestureBuffer.length === 0) return 0;
        const velocities = state.gestureBuffer.map(p =>
            Math.sqrt(p.dx * p.dx + p.dy * p.dy)
        );
        return velocities.reduce((a, b) => a + b, 0) / velocities.length;
    }

    function emit(event, data) {
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit(event, data);
        }
    }

    // Public getters
    function getState() {
        return {
            touching: state.touching,
            position: { x: state.touchX, y: state.touchY },
            velocity: {
                x: state.touchVelocityX,
                y: state.touchVelocityY,
                magnitude: getAverageVelocity()
            },
            gyro: { ...state.gyro },
            accel: { ...state.accel },
            shake: state.shake,
            gesture: state.currentGesture
        };
    }

    function getConductingVector() {
        // Returns a normalized "conducting" interpretation
        return {
            // Horizontal position: which section of orchestra
            section: state.touchX,  // 0=low strings, 1=high strings

            // Vertical position: dynamics
            dynamics: 1 - state.touchY,  // 0=soft, 1=loud

            // Movement speed: articulation
            articulation: Math.min(1, getAverageVelocity() * 10),

            // Device tilt: expression
            expression: {
                vibrato: Math.abs(state.gyro.gamma || 0) / 45,
                swell: Math.max(0, (state.gyro.beta - 45) / 45),
                pan: (state.gyro.gamma || 0) / 45
            },

            // Shake: intensity/chaos
            intensity: state.shake / 10,

            // Current gesture for articulation
            gesture: state.currentGesture
        };
    }

    return Object.freeze({
        init,
        getState,
        getConductingVector,
        GESTURES
    });

})();

if (typeof window !== 'undefined') {
    window.GumpConductorInput = GumpConductorInput;
}
