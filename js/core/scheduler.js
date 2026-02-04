/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUMP - SCHEDULER & SEQUENCER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Precise timing system for musical events.
 * Handles beats, steps, quantization, and scheduled callbacks.
 *
 * @version 2.0.0
 * @author GUMP Development Team
 */

const GumpScheduler = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const CONFIG = {
        defaultBPM: 90,
        minBPM: 40,
        maxBPM: 200,
        stepsPerBeat: 4,         // 16th notes
        beatsPerMeasure: 4,
        lookaheadTime: 25,       // ms
        scheduleAheadTime: 100,  // ms
        swingDefault: 0,
        humanizeDefault: 0
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    let audioContext = null;
    let isRunning = false;
    let isPaused = false;

    // Timing
    let bpm = CONFIG.defaultBPM;
    let swing = CONFIG.swingDefault;
    let humanize = CONFIG.humanizeDefault;

    // Position
    let currentStep = 0;
    let currentBeat = 0;
    let currentMeasure = 0;
    let totalSteps = 0;

    // Time tracking
    let startTime = 0;
    let pauseTime = 0;
    let nextStepTime = 0;
    let lastScheduleTime = 0;

    // Scheduling
    let schedulerTimer = null;
    let scheduledEvents = [];
    let repeatingEvents = [];

    // Callbacks
    const callbacks = {
        step: [],
        beat: [],
        measure: [],
        tick: []
    };

    // Transport state
    const transport = {
        playing: false,
        recording: false,
        looping: false,
        loopStart: 0,
        loopEnd: 16
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function init(ctx) {
        audioContext = ctx || (typeof GumpAudio !== 'undefined' ? GumpAudio.getContext() : null);

        if (!audioContext) {
            console.warn('[GumpScheduler] No audio context provided');
        }

        console.log('[GumpScheduler] Initialized at', bpm, 'BPM');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSPORT CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function start() {
        if (isRunning && !isPaused) return;

        if (isPaused) {
            // Resume from pause
            const pauseDuration = audioContext ?
                audioContext.currentTime - pauseTime :
                (performance.now() - pauseTime) / 1000;

            startTime += pauseDuration;
            nextStepTime += pauseDuration;
            isPaused = false;
        } else {
            // Fresh start
            startTime = audioContext ? audioContext.currentTime : performance.now() / 1000;
            nextStepTime = startTime;
            currentStep = 0;
            currentBeat = 0;
            currentMeasure = 0;
            totalSteps = 0;
        }

        isRunning = true;
        transport.playing = true;

        // Start scheduler loop
        scheduler();

        emit('transport.start');
        console.log('[GumpScheduler] Started');
    }

    function stop() {
        if (!isRunning) return;

        isRunning = false;
        isPaused = false;
        transport.playing = false;

        if (schedulerTimer) {
            clearTimeout(schedulerTimer);
            schedulerTimer = null;
        }

        // Reset position
        currentStep = 0;
        currentBeat = 0;
        currentMeasure = 0;
        totalSteps = 0;

        // Clear scheduled events
        scheduledEvents = [];

        emit('transport.stop');
        console.log('[GumpScheduler] Stopped');
    }

    function pause() {
        if (!isRunning || isPaused) return;

        isPaused = true;
        transport.playing = false;
        pauseTime = audioContext ? audioContext.currentTime : performance.now() / 1000;

        if (schedulerTimer) {
            clearTimeout(schedulerTimer);
            schedulerTimer = null;
        }

        emit('transport.pause');
        console.log('[GumpScheduler] Paused');
    }

    function resume() {
        if (!isPaused) return;
        start();
        emit('transport.resume');
    }

    function toggle() {
        if (isRunning && !isPaused) {
            pause();
        } else {
            start();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULER LOOP
    // ═══════════════════════════════════════════════════════════════════════

    function scheduler() {
        if (!isRunning || isPaused) return;

        const currentTime = audioContext ?
            audioContext.currentTime :
            performance.now() / 1000;

        // Schedule events that fall within the lookahead window
        while (nextStepTime < currentTime + CONFIG.scheduleAheadTime / 1000) {
            scheduleStep(nextStepTime);
            advanceStep();
        }

        // Process any scheduled events
        processScheduledEvents(currentTime);

        // Schedule next iteration
        schedulerTimer = setTimeout(scheduler, CONFIG.lookaheadTime);
    }

    function scheduleStep(time) {
        const stepInBeat = currentStep % CONFIG.stepsPerBeat;
        const isDownbeat = stepInBeat === 0;
        const isMeasureStart = currentStep % (CONFIG.stepsPerBeat * CONFIG.beatsPerMeasure) === 0;

        // Apply swing to off-beats
        let actualTime = time;
        if (swing > 0 && stepInBeat === 1) {
            const swingAmount = getStepDuration() * swing * 0.5;
            actualTime += swingAmount;
        }

        // Apply humanization
        if (humanize > 0) {
            const humanizeAmount = (Math.random() - 0.5) * humanize * 0.02;
            actualTime += humanizeAmount;
        }

        // Emit step event
        const stepData = {
            step: currentStep,
            stepInBeat,
            beat: currentBeat,
            measure: currentMeasure,
            time: actualTime,
            isDownbeat,
            isMeasureStart,
            totalSteps
        };

        // Call step callbacks
        for (const cb of callbacks.step) {
            try {
                cb(stepData);
            } catch (e) {
                console.error('[GumpScheduler] Step callback error:', e);
            }
        }

        // Emit via event system
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit('step', stepData);

            if (isDownbeat) {
                GumpEvents.emit('beat', {
                    beat: currentBeat,
                    measure: currentMeasure,
                    time: actualTime,
                    bpm
                });

                // Call beat callbacks
                for (const cb of callbacks.beat) {
                    try {
                        cb({ beat: currentBeat, measure: currentMeasure, time: actualTime });
                    } catch (e) {
                        console.error('[GumpScheduler] Beat callback error:', e);
                    }
                }
            }

            if (isMeasureStart) {
                GumpEvents.emit('measure', {
                    measure: currentMeasure,
                    time: actualTime
                });

                // Call measure callbacks
                for (const cb of callbacks.measure) {
                    try {
                        cb({ measure: currentMeasure, time: actualTime });
                    } catch (e) {
                        console.error('[GumpScheduler] Measure callback error:', e);
                    }
                }
            }
        }

        // Process repeating events
        for (const event of repeatingEvents) {
            if (totalSteps % event.interval === event.offset) {
                event.callback(stepData);
            }
        }
    }

    function advanceStep() {
        currentStep++;
        totalSteps++;

        // Advance beat
        if (currentStep % CONFIG.stepsPerBeat === 0) {
            currentBeat++;

            // Advance measure
            if (currentBeat % CONFIG.beatsPerMeasure === 0) {
                currentMeasure++;
                currentBeat = 0;

                // Handle looping
                if (transport.looping && currentMeasure >= transport.loopEnd) {
                    jumpToMeasure(transport.loopStart);
                }
            }
        }

        // Calculate next step time
        nextStepTime += getStepDuration();
    }

    function processScheduledEvents(currentTime) {
        for (let i = scheduledEvents.length - 1; i >= 0; i--) {
            const event = scheduledEvents[i];

            if (event.time <= currentTime) {
                try {
                    event.callback(event.data);
                } catch (e) {
                    console.error('[GumpScheduler] Scheduled event error:', e);
                }

                scheduledEvents.splice(i, 1);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIMING CALCULATIONS
    // ═══════════════════════════════════════════════════════════════════════

    function getStepDuration() {
        return 60 / bpm / CONFIG.stepsPerBeat;
    }

    function getBeatDuration() {
        return 60 / bpm;
    }

    function getMeasureDuration() {
        return getBeatDuration() * CONFIG.beatsPerMeasure;
    }

    function stepsToTime(steps) {
        return steps * getStepDuration();
    }

    function timeToSteps(time) {
        return Math.floor(time / getStepDuration());
    }

    function beatsToTime(beats) {
        return beats * getBeatDuration();
    }

    function timeToBeats(time) {
        return time / getBeatDuration();
    }

    function getCurrentTime() {
        if (!isRunning) return 0;

        const now = audioContext ? audioContext.currentTime : performance.now() / 1000;
        return now - startTime;
    }

    function getPositionInMeasure() {
        const stepsPerMeasure = CONFIG.stepsPerBeat * CONFIG.beatsPerMeasure;
        return (currentStep % stepsPerMeasure) / stepsPerMeasure;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BPM CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function setBPM(newBPM) {
        const oldBPM = bpm;
        bpm = Math.max(CONFIG.minBPM, Math.min(CONFIG.maxBPM, newBPM));

        if (oldBPM !== bpm) {
            // Adjust next step time proportionally
            const ratio = oldBPM / bpm;
            const currentTime = audioContext ?
                audioContext.currentTime :
                performance.now() / 1000;
            const remaining = nextStepTime - currentTime;

            nextStepTime = currentTime + (remaining * ratio);

            emit('bpm.change', { from: oldBPM, to: bpm });

            if (typeof GumpState !== 'undefined') {
                GumpState.set('music.bpm', bpm);
            }
        }
    }

    function getBPM() {
        return bpm;
    }

    function tap() {
        // Tap tempo implementation
        const now = performance.now();

        if (!tap.times) tap.times = [];

        tap.times.push(now);

        // Keep only recent taps
        tap.times = tap.times.filter(t => now - t < 3000);

        if (tap.times.length >= 2) {
            const intervals = [];
            for (let i = 1; i < tap.times.length; i++) {
                intervals.push(tap.times[i] - tap.times[i - 1]);
            }

            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const tappedBPM = Math.round(60000 / avgInterval);

            setBPM(tappedBPM);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POSITION CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function jumpToStep(step) {
        const stepsPerMeasure = CONFIG.stepsPerBeat * CONFIG.beatsPerMeasure;

        currentStep = step % stepsPerMeasure;
        currentBeat = Math.floor(currentStep / CONFIG.stepsPerBeat);
        currentMeasure = Math.floor(step / stepsPerMeasure);
        totalSteps = step;

        // Recalculate next step time
        const currentTime = audioContext ?
            audioContext.currentTime :
            performance.now() / 1000;
        nextStepTime = currentTime;

        emit('position.change', {
            step: currentStep,
            beat: currentBeat,
            measure: currentMeasure
        });
    }

    function jumpToMeasure(measure) {
        const stepsPerMeasure = CONFIG.stepsPerBeat * CONFIG.beatsPerMeasure;
        jumpToStep(measure * stepsPerMeasure);
    }

    function jumpToBeat(beat) {
        jumpToStep(beat * CONFIG.stepsPerBeat);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SWING & HUMANIZE
    // ═══════════════════════════════════════════════════════════════════════

    function setSwing(amount) {
        swing = Math.max(0, Math.min(1, amount));
        emit('swing.change', swing);
    }

    function getSwing() {
        return swing;
    }

    function setHumanize(amount) {
        humanize = Math.max(0, Math.min(1, amount));
        emit('humanize.change', humanize);
    }

    function getHumanize() {
        return humanize;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOOP CONTROL
    // ═══════════════════════════════════════════════════════════════════════

    function setLoop(start, end) {
        transport.loopStart = Math.max(0, start);
        transport.loopEnd = Math.max(transport.loopStart + 1, end);
        emit('loop.change', { start: transport.loopStart, end: transport.loopEnd });
    }

    function enableLoop(enabled = true) {
        transport.looping = enabled;
        emit('loop.toggle', enabled);
    }

    function getLoopBounds() {
        return {
            start: transport.loopStart,
            end: transport.loopEnd,
            enabled: transport.looping
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT SCHEDULING
    // ═══════════════════════════════════════════════════════════════════════

    function scheduleEvent(callback, time, data = null) {
        const event = {
            callback,
            time,
            data,
            id: Date.now() + Math.random()
        };

        scheduledEvents.push(event);
        scheduledEvents.sort((a, b) => a.time - b.time);

        return event.id;
    }

    function scheduleAtStep(callback, step, data = null) {
        const currentTime = audioContext ?
            audioContext.currentTime :
            performance.now() / 1000;

        const stepsAhead = step - totalSteps;
        const time = currentTime + stepsToTime(stepsAhead);

        return scheduleEvent(callback, time, data);
    }

    function scheduleAtBeat(callback, beat, data = null) {
        return scheduleAtStep(callback, beat * CONFIG.stepsPerBeat, data);
    }

    function scheduleAtMeasure(callback, measure, data = null) {
        const stepsPerMeasure = CONFIG.stepsPerBeat * CONFIG.beatsPerMeasure;
        return scheduleAtStep(callback, measure * stepsPerMeasure, data);
    }

    function cancelEvent(eventId) {
        const index = scheduledEvents.findIndex(e => e.id === eventId);
        if (index >= 0) {
            scheduledEvents.splice(index, 1);
            return true;
        }
        return false;
    }

    function clearScheduledEvents() {
        scheduledEvents = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REPEATING EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    function every(interval, callback, offset = 0) {
        const event = {
            interval,
            offset: offset % interval,
            callback,
            id: Date.now() + Math.random()
        };

        repeatingEvents.push(event);
        return event.id;
    }

    function everyBeat(callback) {
        return every(CONFIG.stepsPerBeat, callback);
    }

    function everyMeasure(callback) {
        return every(CONFIG.stepsPerBeat * CONFIG.beatsPerMeasure, callback);
    }

    function cancelRepeating(eventId) {
        const index = repeatingEvents.findIndex(e => e.id === eventId);
        if (index >= 0) {
            repeatingEvents.splice(index, 1);
            return true;
        }
        return false;
    }

    function clearRepeatingEvents() {
        repeatingEvents = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CALLBACKS
    // ═══════════════════════════════════════════════════════════════════════

    function onStep(callback) {
        callbacks.step.push(callback);
        return () => {
            const index = callbacks.step.indexOf(callback);
            if (index >= 0) callbacks.step.splice(index, 1);
        };
    }

    function onBeat(callback) {
        callbacks.beat.push(callback);
        return () => {
            const index = callbacks.beat.indexOf(callback);
            if (index >= 0) callbacks.beat.splice(index, 1);
        };
    }

    function onMeasure(callback) {
        callbacks.measure.push(callback);
        return () => {
            const index = callbacks.measure.indexOf(callback);
            if (index >= 0) callbacks.measure.splice(index, 1);
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // QUANTIZATION
    // ═══════════════════════════════════════════════════════════════════════

    function quantize(time, division = 4) {
        const divisionDuration = getBeatDuration() / division;
        return Math.round(time / divisionDuration) * divisionDuration;
    }

    function quantizeToStep(time) {
        const stepDuration = getStepDuration();
        return Math.round(time / stepDuration) * stepDuration;
    }

    function quantizeToBeat(time) {
        const beatDuration = getBeatDuration();
        return Math.round(time / beatDuration) * beatDuration;
    }

    function getNextStep() {
        return nextStepTime;
    }

    function getNextBeat() {
        const stepsUntilBeat = CONFIG.stepsPerBeat - (currentStep % CONFIG.stepsPerBeat);
        return nextStepTime + stepsToTime(stepsUntilBeat - 1);
    }

    function getNextMeasure() {
        const stepsPerMeasure = CONFIG.stepsPerBeat * CONFIG.beatsPerMeasure;
        const stepsUntilMeasure = stepsPerMeasure - (currentStep % stepsPerMeasure);
        return nextStepTime + stepsToTime(stepsUntilMeasure - 1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    function emit(event, data = null) {
        if (typeof GumpEvents !== 'undefined') {
            GumpEvents.emit('scheduler.' + event, data);
        }
    }

    function getState() {
        return {
            isRunning,
            isPaused,
            bpm,
            swing,
            humanize,
            step: currentStep,
            beat: currentBeat,
            measure: currentMeasure,
            totalSteps,
            transport: { ...transport },
            scheduledEvents: scheduledEvents.length,
            repeatingEvents: repeatingEvents.length
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        // Lifecycle
        init,
        start,
        stop,
        pause,
        resume,
        toggle,

        // BPM
        setBPM,
        getBPM,
        tap,

        // Position
        jumpToStep,
        jumpToBeat,
        jumpToMeasure,
        getPositionInMeasure,

        // Swing & Humanize
        setSwing,
        getSwing,
        setHumanize,
        getHumanize,

        // Loop
        setLoop,
        enableLoop,
        getLoopBounds,

        // Scheduling
        scheduleEvent,
        scheduleAtStep,
        scheduleAtBeat,
        scheduleAtMeasure,
        cancelEvent,
        clearScheduledEvents,

        // Repeating
        every,
        everyBeat,
        everyMeasure,
        cancelRepeating,
        clearRepeatingEvents,

        // Callbacks
        onStep,
        onBeat,
        onMeasure,

        // Quantization
        quantize,
        quantizeToStep,
        quantizeToBeat,
        getNextStep,
        getNextBeat,
        getNextMeasure,

        // Timing
        getStepDuration,
        getBeatDuration,
        getMeasureDuration,
        stepsToTime,
        timeToSteps,
        beatsToTime,
        timeToBeats,
        getCurrentTime,

        // State
        getState,
        get isRunning() { return isRunning; },
        get isPaused() { return isPaused; },
        get currentStep() { return currentStep; },
        get currentBeat() { return currentBeat; },
        get currentMeasure() { return currentMeasure; },
        get totalSteps() { return totalSteps; },
        get bpm() { return bpm; },

        // Config
        CONFIG
    };

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GumpScheduler;
}
