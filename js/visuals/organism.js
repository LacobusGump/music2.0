/**
 * GUMP ORGANISM — The Living Visual
 *
 * The cursor is alive. It evolves from a spore into a complex organism
 * shaped by HOW you interact. Each gesture neuron drives a different
 * harmonic of the polar shape. Floats on black — no grid.
 *
 * Stages: Spore → Tendril → Bloom → Entity → Abyss
 *
 * v38-REBIRTH: Grid removed. Organism is the only visual.
 */

const GumpOrganism = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const STAGES = [
        { name: 'spore',   threshold: 0,   trailLen: 8,   glowAlpha: 0 },
        { name: 'tendril', threshold: 5,   trailLen: 30,  glowAlpha: 0.08 },
        { name: 'bloom',   threshold: 20,  trailLen: 60,  glowAlpha: 0.12 },
        { name: 'entity',  threshold: 60,  trailLen: 100, glowAlpha: 0.18 },
        { name: 'abyss',   threshold: 180, trailLen: 120, glowAlpha: 0.25 },
    ];

    const TRAIL_MAX = 120;
    const ANGULAR_STEPS = 120;
    const TWO_PI = Math.PI * 2;

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    let lifeForce = 0;
    let touchTime = 0;

    // DNA — the organism's genome, shaped by gestures
    const dna = {
        numArms: 0,
        armLength: 0,
        spikiness: 0,
        flowiness: 0,
        spiralness: 0,
        symmetry: 0,
        breathDepth: 0.3,
        intensity: 0,
        hue: 200,
        saturation: 0,
    };

    // Smoothed targets for DNA (we ease toward these)
    const dnaTarget = { ...dna };

    // Trail ring buffer
    const trail = [];

    // Mutations from surprise events
    const mutations = [];

    // Gesture variety tracking
    const seenGestures = new Set();

    // Internal time accumulator
    let time = 0;

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    function getStage() {
        for (let i = STAGES.length - 1; i >= 0; i--) {
            if (lifeForce >= STAGES[i].threshold) return i;
        }
        return 0;
    }

    function getStageProgress() {
        const s = getStage();
        if (s >= STAGES.length - 1) return 1;
        const lo = STAGES[s].threshold;
        const hi = STAGES[s + 1].threshold;
        return Math.min(1, (lifeForce - lo) / (hi - lo));
    }

    function smoothDna(dt) {
        const rate = 1 - Math.exp(-2.5 * dt);
        for (const key in dna) {
            dna[key] += (dnaTarget[key] - dna[key]) * rate;
        }
    }

    function hslToRgba(h, s, l, a) {
        s /= 100; l /= 100;
        const k = n => (n + h / 30) % 12;
        const f = n => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
        return `rgba(${Math.round(f(0)*255)},${Math.round(f(8)*255)},${Math.round(f(4)*255)},${a})`;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════════════════════

    function update(dt, app) {
        time += dt;

        // Accumulate life force from touch time
        if (app.gestureActive) {
            touchTime += dt;
        }

        // Energy from conductor
        const energy = typeof GumpConductor !== 'undefined' ? GumpConductor.energy : 0;

        // Life force = touch time + energy contribution + gesture variety bonus
        lifeForce = touchTime + energy * 2 + seenGestures.size * 3;

        // Read neuron firing rates
        const neurons = typeof GumpMotionBrain !== 'undefined' ? GumpMotionBrain.neurons : null;
        if (neurons) {
            const shake    = neurons.shake    ? neurons.shake.firingRate    : 0;
            const sweep    = neurons.sweep    ? neurons.sweep.firingRate    : 0;
            const circle   = neurons.circle   ? neurons.circle.firingRate   : 0;
            const pendulum = neurons.pendulum ? neurons.pendulum.firingRate : 0;
            const stillness= neurons.stillness? neurons.stillness.firingRate: 0;

            // Track gesture variety
            if (shake > 0.5)    seenGestures.add('shake');
            if (sweep > 0.5)    seenGestures.add('sweep');
            if (circle > 0.5)   seenGestures.add('circle');
            if (pendulum > 0.5) seenGestures.add('pendulum');
            if (stillness > 0.5) seenGestures.add('stillness');

            // Map neurons to DNA targets
            dnaTarget.spikiness  = shake * 0.8;
            dnaTarget.flowiness  = sweep * 0.7;
            dnaTarget.spiralness = circle * 0.6;
            dnaTarget.symmetry   = pendulum * 0.5;
            dnaTarget.breathDepth= 0.3 + stillness * 0.5;
            dnaTarget.numArms    = 3 + shake * 4 + sweep * 2 + circle * 3;
            dnaTarget.armLength  = 0.2 + energy * 0.6 + (shake + sweep) * 0.15;
        }

        // Intensity from energy
        dnaTarget.intensity = energy;

        // Color evolves with stage
        const stage = getStage();
        if (stage >= 1) {
            dnaTarget.hue = 200 + seenGestures.size * 25 + time * 3;
            dnaTarget.saturation = Math.min(70, 20 + stage * 12);
        }

        // Surprise → mutation
        if (typeof GumpNeuromorphicMemory !== 'undefined') {
            const surprise = GumpNeuromorphicMemory.surprise;
            if (surprise > 0.7) {
                mutations.push({
                    time: time,
                    freq: 5 + Math.random() * 10,
                    amp: surprise * 0.3,
                    decay: 3 + Math.random() * 4,
                    phase: Math.random() * TWO_PI,
                });
                // Permanent DNA shift
                dnaTarget.hue += (Math.random() - 0.5) * 30;
                dnaTarget.numArms += (Math.random() - 0.5) * 2;
            }
        }

        // Push trail position
        const px = app.x * app.width;
        const py = app.y * app.height;
        trail.push({ x: px, y: py, t: time });
        if (trail.length > TRAIL_MAX) trail.shift();

        // Smooth DNA
        smoothDna(dt);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POLAR RADIUS — 6 harmonic layers + mutation ripples
    // ═══════════════════════════════════════════════════════════════════════

    function polarRadius(theta, baseSize, t) {
        const stage = getStage();
        const progress = getStageProgress();

        let r = baseSize;

        // Only add harmonics after spore stage
        if (stage < 1 && progress < 0.3) {
            // Spore: just a subtle pulse
            r += baseSize * 0.05 * Math.sin(t * 3);
            return r;
        }

        const gate = stage < 1 ? progress * 3 : 1;

        // Harmonic 1: spikiness (shake) — high frequency crystalline
        r += baseSize * dna.spikiness * 0.4 * gate *
             Math.cos(dna.numArms * theta + t * 2);

        // Harmonic 2: flowiness (sweep) — low frequency organic
        r += baseSize * dna.flowiness * 0.35 * gate *
             Math.sin(2.3 * theta + t * 0.7);

        // Harmonic 3: spiralness (circle) — irrational ratio, nautilus
        r += baseSize * dna.spiralness * 0.3 * gate *
             Math.cos(Math.PI * theta + t * 1.3);

        // Harmonic 4: symmetry break (pendulum)
        r += baseSize * dna.symmetry * 0.25 * gate *
             Math.sin(1.5 * theta + 0.7 * t);

        // Harmonic 5: breath (stillness) — radial pulse
        r += baseSize * dna.breathDepth * 0.15 *
             Math.sin(t * 1.8);

        // Harmonic 6: intensity swell
        r += baseSize * dna.intensity * 0.2 *
             Math.cos(3 * theta - t * 4);

        // Mutation ripples (temporary high-freq that decay)
        for (let i = mutations.length - 1; i >= 0; i--) {
            const m = mutations[i];
            const age = t - m.time;
            if (age > m.decay * 2) {
                mutations.splice(i, 1);
                continue;
            }
            const envelope = Math.exp(-age / m.decay);
            r += baseSize * m.amp * envelope *
                 Math.sin(m.freq * theta + m.phase + t * 6);
        }

        return Math.max(baseSize * 0.3, r);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DRAW TRAIL — Catmull-Rom spline
    // ═══════════════════════════════════════════════════════════════════════

    function catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t, t3 = t2 * t;
        return 0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
    }

    function drawTrail(ctx, stage) {
        const len = Math.min(trail.length, STAGES[stage].trailLen);
        if (len < 4) return;

        const startIdx = trail.length - len;
        const isEntity = stage >= 3;

        // Main trail
        ctx.beginPath();
        for (let i = 0; i < len - 1; i++) {
            const idx = startIdx + i;
            const p0 = trail[Math.max(startIdx, idx - 1)];
            const p1 = trail[idx];
            const p2 = trail[Math.min(trail.length - 1, idx + 1)];
            const p3 = trail[Math.min(trail.length - 1, idx + 2)];

            const steps = 4;
            for (let s = 0; s < steps; s++) {
                const t = s / steps;
                const x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
                const y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
                if (i === 0 && s === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }

        const alpha = 0.1 + stage * 0.04;
        if (stage >= 1) {
            ctx.strokeStyle = hslToRgba(dna.hue % 360, dna.saturation, 60, alpha);
        } else {
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        }
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Entity+ double-line trail with sine offset
        if (isEntity && len > 6) {
            ctx.beginPath();
            for (let i = 0; i < len - 1; i++) {
                const idx = startIdx + i;
                const p0 = trail[Math.max(startIdx, idx - 1)];
                const p1 = trail[idx];
                const p2 = trail[Math.min(trail.length - 1, idx + 1)];
                const p3 = trail[Math.min(trail.length - 1, idx + 2)];

                const steps = 4;
                for (let s = 0; s < steps; s++) {
                    const t = s / steps;
                    const x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
                    const y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
                    const offset = Math.sin((i + s / steps) * 0.5 + time * 3) * 4;
                    if (i === 0 && s === 0) ctx.moveTo(x + offset, y + offset);
                    else ctx.lineTo(x + offset, y + offset);
                }
            }
            ctx.strokeStyle = hslToRgba((dna.hue + 30) % 360, dna.saturation, 50, alpha * 0.5);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DRAW ORGANISM
    // ═══════════════════════════════════════════════════════════════════════

    function drawOrganism(ctx, x, y, w, h, app) {
        const stage = getStage();
        const energy = typeof GumpConductor !== 'undefined' ? GumpConductor.energy : 0;
        const baseSize = 6 + energy * 20 + stage * 4;

        ctx.save();

        // 1. Trail
        drawTrail(ctx, stage);

        // 2. Outer glow (stage >= 1)
        if (stage >= 1) {
            const glowRadius = baseSize * (2.5 + dna.intensity * 2);
            const g = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
            const glowAlpha = STAGES[stage].glowAlpha;
            g.addColorStop(0, hslToRgba(dna.hue % 360, dna.saturation, 60, glowAlpha));
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, glowRadius, 0, TWO_PI);
            ctx.fill();
        }

        // 3. Polar harmonic body
        ctx.beginPath();
        for (let i = 0; i <= ANGULAR_STEPS; i++) {
            const theta = (i / ANGULAR_STEPS) * TWO_PI;
            const r = polarRadius(theta, baseSize, time);
            const px = x + Math.cos(theta) * r;
            const py = y + Math.sin(theta) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();

        // Fill
        if (stage >= 1) {
            const bodyAlpha = 0.06 + dna.intensity * 0.08;
            ctx.fillStyle = hslToRgba(dna.hue % 360, dna.saturation, 50, bodyAlpha);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
        }
        ctx.fill();

        // Stroke
        const strokeAlpha = 0.3 + energy * 0.4;
        if (stage >= 1) {
            ctx.strokeStyle = hslToRgba(dna.hue % 360, dna.saturation, 70, strokeAlpha);
        } else {
            ctx.strokeStyle = `rgba(255,255,255,${strokeAlpha})`;
        }
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4. Inner orbiting nodes (stage >= 2)
        if (stage >= 2) {
            const nodeCount = Math.min(7, 2 + stage);
            for (let i = 0; i < nodeCount; i++) {
                const angle = (i / nodeCount) * TWO_PI + time * (0.5 + i * 0.13);
                const dist = baseSize * (0.4 + 0.2 * Math.sin(time * 1.7 + i));
                const nx = x + Math.cos(angle) * dist;
                const ny = y + Math.sin(angle) * dist;
                const nodeSize = 1.5 + dna.intensity * 2;
                const nodeAlpha = 0.3 + 0.2 * Math.sin(time * 2.3 + i * 1.4);

                ctx.fillStyle = hslToRgba((dna.hue + i * 40) % 360, dna.saturation, 70, nodeAlpha);
                ctx.beginPath();
                ctx.arc(nx, ny, nodeSize, 0, TWO_PI);
                ctx.fill();
            }
        }

        // 5. Core dot (always white, energy-scaled)
        const coreSize = 2 + energy * 4;
        const coreAlpha = 0.5 + energy * 0.4 + 0.1 * Math.sin(time * 3);
        ctx.fillStyle = `rgba(255,255,255,${coreAlpha})`;
        ctx.beginPath();
        ctx.arc(x, y, coreSize, 0, TWO_PI);
        ctx.fill();

        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════

    return {
        update,
        drawOrganism,
        get stage() { return STAGES[getStage()].name; },
        get stageIndex() { return getStage(); },
        get lifeForce() { return lifeForce; },
        get dna() { return { ...dna }; },
    };

})();

if (typeof window !== 'undefined') {
    window.GumpOrganism = GumpOrganism;
}
