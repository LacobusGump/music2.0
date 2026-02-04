/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - INPUT HANDLING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Unified input handling for touch, mouse, device motion, and orientation.
 * Normalizes all input sources into a consistent state format.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpInput = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        // Touch
        touchSensitivity: 1.0,
        multiTouchLimit: 5,
        tapThreshold: 200,          // ms
        longPressThreshold: 500,    // ms
        swipeThreshold: 50,         // pixels
        swipeVelocityThreshold: 0.5,

        // Motion
        motionSensitivity: 1.0,
        motionSmoothing: 0.3,
        shakeThreshold: 15,
        shakeTimeout: 500,

        // Orientation
        orientationSmoothing: 0.2,
        tiltDeadzone: 5,            // degrees

        // General
        updateRate: 16,             // ms
        historyLength: 60
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    // Normalized position (0-1)
    const position = {
        x: 0.5,
        y: 0.5,
        pressure: 0
    };

    // Previous position for velocity
    const prevPosition = { x: 0.5, y: 0.5 };

    // Velocity
    const velocity = { x: 0, y: 0, magnitude: 0 };

    // Acceleration (from device motion)
    const acceleration = {
        x: 0,
        y: 0,
        z: 0,
        magnitude: 0
    };

    // Smoothed acceleration
    const smoothAcceleration = { x: 0, y: 0, z: 0 };

    // Orientation (from device orientation)
    const orientation = {
        alpha: 0,    // Z-axis rotation (compass)
        beta: 0,     // X-axis rotation (front-back tilt)
        gamma: 0     // Y-axis rotation (left-right tilt)
    };

    // Smoothed orientation
    const smoothOrientation = { alpha: 0, beta: 0, gamma: 0 };

    // Normalized tilt
    const tilt = {
        x: 0,        // -1 to 1 (left-right)
        y: 0         // -1 to 1 (forward-backward)
    };

    // Touch state
    const touches = new Map();
    let primaryTouch = null;
    let touchCount = 0;
    let isPressed = false;

    // Gesture state
    const gesture = {
        type: null,           // 'tap', 'longtap', 'swipe', 'pinch', etc.
        direction: null,      // 'up', 'down', 'left', 'right'
        distance: 0,
        velocity: 0,
        scale: 1,
        rotation: 0
    };

    // History for analysis
    const history = {
        position: [],
        acceleration: [],
        velocity: []
    };

    // Shake detection
    let shakeState = {
        count: 0,
        lastShakeTime: 0,
        isShaking: false
    };

    // Device capabilities
    const capabilities = {
        touch: false,
        motion: false,
        orientation: false,
        multiTouch: false
    };

    // Event listeners
    const listeners = {
        touch: [],
        move: [],
        release: [],
        gesture: [],
        shake: [],
        tilt: []
    };

    // Update timer
    let updateTimer = null;
    let lastUpdateTime = 0;

    // Screen dimensions
    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init() {
        // Detect capabilities
        detectCapabilities();

        // Set up event listeners
        setupEventListeners();

        // Start update loop
        startUpdateLoop();

        // Handle resize
        window.addEventListener('resize', onResize);

        console.log('[GumpInput] Initialized', capabilities);

        return capabilities;
    }

    function detectCapabilities() {
        capabilities.touch = 'ontouchstart' in window ||
                            navigator.maxTouchPoints > 0;

        capabilities.motion = 'DeviceMotionEvent' in window;

        capabilities.orientation = 'DeviceOrientationEvent' in window;

        capabilities.multiTouch = navigator.maxTouchPoints > 1;
    }

    function setupEventListeners() {
        // Touch events
        if (capabilities.touch) {
            document.addEventListener('touchstart', onTouchStart, { passive: false });
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd, { passive: false });
            document.addEventListener('touchcancel', onTouchEnd, { passive: false });
        }

        // Mouse events (fallback)
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Device motion
        if (capabilities.motion) {
            requestMotionPermission();
        }

        // Device orientation
        if (capabilities.orientation) {
            requestOrientationPermission();
        }
    }

    async function requestMotionPermission() {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('devicemotion', onDeviceMotion);
                }
            } catch (e) {
                console.warn('[GumpInput] Motion permission denied');
            }
        } else {
            window.addEventListener('devicemotion', onDeviceMotion);
        }
    }

    async function requestOrientationPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', onDeviceOrientation);
                }
            } catch (e) {
                console.warn('[GumpInput] Orientation permission denied');
            }
        } else {
            window.addEventListener('deviceorientation', onDeviceOrientation);
        }
    }

    function startUpdateLoop() {
        updateTimer = setInterval(update, CONFIG.updateRate);
    }

    function stopUpdateLoop() {
        if (updateTimer) {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TOUCH HANDLING
    // ═══════════════════════════════════════════════════════════════════════

    function onTouchStart(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            const touchData = createTouchData(touch);
            touches.set(touch.identifier, touchData);

            if (!primaryTouch) {
                primaryTouch = touchData;
                updatePositionFromTouch(touchData);
                isPressed = true;

                emitEvent('touch', {
                    x: position.x,
                    y: position.y,
                    pressure: position.pressure
                });
            }
        }

        touchCount = touches.size;
    }

    function onTouchMove(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            const touchData = touches.get(touch.identifier);
            if (touchData) {
                updateTouchData(touchData, touch);

                if (touchData === primaryTouch) {
                    updatePositionFromTouch(touchData);

                    emitEvent('move', {
                        x: position.x,
                        y: position.y,
                        velocity: velocity.magnitude
                    });
                }
            }
        }

        // Check for gestures
        detectGestures();
    }

    function onTouchEnd(e) {
        for (const touch of e.changedTouches) {
            const touchData = touches.get(touch.identifier);
            if (touchData) {
                finalizeTouchData(touchData);

                if (touchData === primaryTouch) {
                    // Detect tap
                    if (touchData.duration < CONFIG.tapThreshold &&
                        touchData.distance < CONFIG.swipeThreshold) {
                        emitEvent('gesture', {
                            type: 'tap',
                            x: position.x,
                            y: position.y
                        });
                    }
                    // Detect long press
                    else if (touchData.duration >= CONFIG.longPressThreshold &&
                             touchData.distance < CONFIG.swipeThreshold) {
                        emitEvent('gesture', {
                            type: 'longtap',
                            x: position.x,
                            y: position.y
                        });
                    }
                    // Detect swipe
                    else if (touchData.distance >= CONFIG.swipeThreshold) {
                        const direction = getSwipeDirection(touchData);
                        emitEvent('gesture', {
                            type: 'swipe',
                            direction,
                            velocity: touchData.velocity
                        });
                    }

                    primaryTouch = null;
                    isPressed = false;

                    emitEvent('release', {
                        x: position.x,
                        y: position.y
                    });
                }

                touches.delete(touch.identifier);
            }
        }

        touchCount = touches.size;

        // Reassign primary touch if needed
        if (!primaryTouch && touches.size > 0) {
            primaryTouch = touches.values().next().value;
        }
    }

    function createTouchData(touch) {
        const x = touch.clientX / screenWidth;
        const y = touch.clientY / screenHeight;

        return {
            id: touch.identifier,
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
            previousX: x,
            previousY: y,
            startTime: performance.now(),
            lastTime: performance.now(),
            duration: 0,
            distance: 0,
            velocity: 0,
            pressure: touch.force || 0
        };
    }

    function updateTouchData(data, touch) {
        data.previousX = data.currentX;
        data.previousY = data.currentY;

        data.currentX = touch.clientX / screenWidth;
        data.currentY = touch.clientY / screenHeight;

        const now = performance.now();
        const dt = now - data.lastTime;
        data.lastTime = now;
        data.duration = now - data.startTime;

        // Calculate distance
        const dx = data.currentX - data.startX;
        const dy = data.currentY - data.startY;
        data.distance = Math.sqrt(dx * dx + dy * dy) * Math.max(screenWidth, screenHeight);

        // Calculate velocity
        const vx = (data.currentX - data.previousX) / dt * 1000;
        const vy = (data.currentY - data.previousY) / dt * 1000;
        data.velocity = Math.sqrt(vx * vx + vy * vy);

        data.pressure = touch.force || 0;
    }

    function finalizeTouchData(data) {
        data.duration = performance.now() - data.startTime;
    }

    function updatePositionFromTouch(touchData) {
        prevPosition.x = position.x;
        prevPosition.y = position.y;

        position.x = touchData.currentX;
        position.y = touchData.currentY;
        position.pressure = touchData.pressure;

        updateVelocity();
    }

    function getSwipeDirection(touchData) {
        const dx = touchData.currentX - touchData.startX;
        const dy = touchData.currentY - touchData.startY;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MOUSE HANDLING
    // ═══════════════════════════════════════════════════════════════════════

    function onMouseDown(e) {
        if (capabilities.touch && touchCount > 0) return;

        const x = e.clientX / screenWidth;
        const y = e.clientY / screenHeight;

        prevPosition.x = position.x;
        prevPosition.y = position.y;
        position.x = x;
        position.y = y;
        position.pressure = 1;

        isPressed = true;

        emitEvent('touch', {
            x: position.x,
            y: position.y,
            pressure: 1
        });
    }

    function onMouseMove(e) {
        if (capabilities.touch && touchCount > 0) return;

        const x = e.clientX / screenWidth;
        const y = e.clientY / screenHeight;

        prevPosition.x = position.x;
        prevPosition.y = position.y;
        position.x = x;
        position.y = y;

        updateVelocity();

        if (isPressed) {
            emitEvent('move', {
                x: position.x,
                y: position.y,
                velocity: velocity.magnitude
            });
        }
    }

    function onMouseUp(e) {
        if (capabilities.touch && touchCount > 0) return;

        isPressed = false;
        position.pressure = 0;

        emitEvent('release', {
            x: position.x,
            y: position.y
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEVICE MOTION
    // ═══════════════════════════════════════════════════════════════════════

    function onDeviceMotion(e) {
        const accel = e.accelerationIncludingGravity || e.acceleration;

        if (accel) {
            // Update raw acceleration
            acceleration.x = accel.x || 0;
            acceleration.y = accel.y || 0;
            acceleration.z = accel.z || 0;
            acceleration.magnitude = Math.sqrt(
                acceleration.x ** 2 +
                acceleration.y ** 2 +
                acceleration.z ** 2
            );

            // Smooth acceleration
            const smoothing = CONFIG.motionSmoothing;
            smoothAcceleration.x = smoothAcceleration.x * smoothing + acceleration.x * (1 - smoothing);
            smoothAcceleration.y = smoothAcceleration.y * smoothing + acceleration.y * (1 - smoothing);
            smoothAcceleration.z = smoothAcceleration.z * smoothing + acceleration.z * (1 - smoothing);

            // Detect shake
            detectShake();
        }
    }

    function detectShake() {
        const magnitude = acceleration.magnitude;
        const now = performance.now();

        if (magnitude > CONFIG.shakeThreshold) {
            if (now - shakeState.lastShakeTime > CONFIG.shakeTimeout) {
                shakeState.count = 0;
            }

            shakeState.count++;
            shakeState.lastShakeTime = now;

            if (shakeState.count >= 3) {
                shakeState.isShaking = true;
                emitEvent('shake', {
                    intensity: magnitude,
                    count: shakeState.count
                });
                shakeState.count = 0;
            }
        } else {
            shakeState.isShaking = false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEVICE ORIENTATION
    // ═══════════════════════════════════════════════════════════════════════

    function onDeviceOrientation(e) {
        // Update raw orientation
        orientation.alpha = e.alpha || 0;
        orientation.beta = e.beta || 0;
        orientation.gamma = e.gamma || 0;

        // Smooth orientation
        const smoothing = CONFIG.orientationSmoothing;
        smoothOrientation.alpha = lerpAngle(smoothOrientation.alpha, orientation.alpha, 1 - smoothing);
        smoothOrientation.beta = lerpAngle(smoothOrientation.beta, orientation.beta, 1 - smoothing);
        smoothOrientation.gamma = lerpAngle(smoothOrientation.gamma, orientation.gamma, 1 - smoothing);

        // Calculate normalized tilt
        updateTilt();
    }

    function updateTilt() {
        // Beta: front-back tilt (-180 to 180, 0 is flat)
        // Gamma: left-right tilt (-90 to 90, 0 is flat)

        // Normalize to -1 to 1 with deadzone
        const beta = smoothOrientation.beta;
        const gamma = smoothOrientation.gamma;

        // Left-right tilt (gamma)
        if (Math.abs(gamma) < CONFIG.tiltDeadzone) {
            tilt.x = 0;
        } else {
            tilt.x = Math.max(-1, Math.min(1, gamma / 45));
        }

        // Front-back tilt (beta - adjust for holding position)
        const adjustedBeta = beta - 45;  // Assume phone held at ~45 degrees
        if (Math.abs(adjustedBeta) < CONFIG.tiltDeadzone) {
            tilt.y = 0;
        } else {
            tilt.y = Math.max(-1, Math.min(1, adjustedBeta / 45));
        }

        emitEvent('tilt', {
            x: tilt.x,
            y: tilt.y,
            beta: smoothOrientation.beta,
            gamma: smoothOrientation.gamma
        });
    }

    function lerpAngle(a, b, t) {
        let diff = b - a;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        return a + diff * t;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GESTURE DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    function detectGestures() {
        if (touches.size >= 2) {
            const touchArray = Array.from(touches.values());

            // Pinch detection
            if (touchArray.length >= 2) {
                const t1 = touchArray[0];
                const t2 = touchArray[1];

                // Current distance
                const currentDist = Math.hypot(
                    t1.currentX - t2.currentX,
                    t1.currentY - t2.currentY
                );

                // Previous distance
                const prevDist = Math.hypot(
                    t1.previousX - t2.previousX,
                    t1.previousY - t2.previousY
                );

                if (prevDist > 0) {
                    gesture.scale = currentDist / prevDist;

                    if (Math.abs(gesture.scale - 1) > 0.01) {
                        emitEvent('gesture', {
                            type: 'pinch',
                            scale: gesture.scale
                        });
                    }
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function update() {
        const now = performance.now();
        const dt = now - lastUpdateTime;
        lastUpdateTime = now;

        // Update history
        addToHistory();

        // Emit state to global state if available
        if (typeof GumpState !== 'undefined') {
            GumpState.update('input', {
                x: position.x,
                y: position.y,
                pressure: position.pressure,
                isPressed,
                velocity: velocity.magnitude,
                tiltX: tilt.x,
                tiltY: tilt.y
            });
        }

        // Emit input event
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit('input.update', {
                position: { ...position },
                velocity: { ...velocity },
                tilt: { ...tilt },
                acceleration: { ...smoothAcceleration },
                isPressed,
                touchCount
            });
        }
    }

    function updateVelocity() {
        const now = performance.now();
        const dt = Math.max(1, now - lastUpdateTime);

        velocity.x = (position.x - prevPosition.x) / dt * 1000;
        velocity.y = (position.y - prevPosition.y) / dt * 1000;
        velocity.magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    }

    function addToHistory() {
        history.position.push({ ...position, time: performance.now() });
        history.acceleration.push({ ...smoothAcceleration, time: performance.now() });
        history.velocity.push({ ...velocity, time: performance.now() });

        // Trim history
        while (history.position.length > CONFIG.historyLength) {
            history.position.shift();
        }
        while (history.acceleration.length > CONFIG.historyLength) {
            history.acceleration.shift();
        }
        while (history.velocity.length > CONFIG.historyLength) {
            history.velocity.shift();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    function on(event, callback) {
        if (listeners[event]) {
            listeners[event].push(callback);
            return () => off(event, callback);
        }
        return null;
    }

    function off(event, callback) {
        if (listeners[event]) {
            const index = listeners[event].indexOf(callback);
            if (index >= 0) {
                listeners[event].splice(index, 1);
            }
        }
    }

    function emitEvent(event, data) {
        // Call local listeners
        if (listeners[event]) {
            for (const callback of listeners[event]) {
                try {
                    callback(data);
                } catch (e) {
                    console.error('[GumpInput] Event callback error:', e);
                }
            }
        }

        // Emit via global event system
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit('input.' + event, data);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function onResize() {
        screenWidth = window.innerWidth;
        screenHeight = window.innerHeight;
    }

    function getPosition() {
        return { ...position };
    }

    function getVelocity() {
        return { ...velocity };
    }

    function getTilt() {
        return { ...tilt };
    }

    function getAcceleration() {
        return { ...smoothAcceleration };
    }

    function getOrientation() {
        return { ...smoothOrientation };
    }

    function getHistory(type = 'position', count = 10) {
        return history[type]?.slice(-count) || [];
    }

    function getState() {
        return {
            position: { ...position },
            velocity: { ...velocity },
            tilt: { ...tilt },
            acceleration: { ...smoothAcceleration },
            orientation: { ...smoothOrientation },
            isPressed,
            touchCount,
            gesture: { ...gesture },
            capabilities: { ...capabilities }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        init,

        // Events
        on,
        off,

        // Getters
        getPosition,
        getVelocity,
        getTilt,
        getAcceleration,
        getOrientation,
        getHistory,
        getState,

        // Direct access
        get position() { return position; },
        get velocity() { return velocity; },
        get tilt() { return tilt; },
        get acceleration() { return smoothAcceleration; },
        get orientation() { return smoothOrientation; },
        get isPressed() { return isPressed; },
        get touchCount() { return touchCount; },
        get capabilities() { return capabilities; },

        // Config
        CONFIG
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpInput;
}
