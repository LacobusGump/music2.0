/*
 * EMILIA — Oracle Intelligence Layer for GUMP
 * =============================================
 * The oracle math, ported to JavaScript.
 * Runs in the browser. No server needed.
 *
 * Capabilities:
 *   - Count primes from nothing (explicit formula)
 *   - Extract frequencies from any signal (oracle pattern)
 *   - Analyze movement data in real-time
 *   - Speak via Web Speech API
 *   - Chat interface (connects to Ollama or Anthropic API)
 */

const Emilia = (() => {
    'use strict';

    // ─── Siegel theta function ─────────────────────────
    function theta(t) {
        if (t < 1) return 0;
        const lt = Math.log(t / (2 * Math.PI));
        return (t / 2) * lt - t / 2 - Math.PI / 8
            + 1 / (48 * t)
            + 7 / (5760 * t * t * t)
            + 31 / (80640 * t * t * t * t * t);
    }

    // ─── Hardy Z-function with RS C₀ correction ───────
    function Z(t) {
        if (t < 2) return 0;
        const a = Math.sqrt(t / (2 * Math.PI));
        const N = Math.max(1, Math.floor(a));
        const p = a - N;
        const th = theta(t);

        let s = 0;
        for (let n = 1; n <= N; n++) {
            s += Math.cos(th - t * Math.log(n)) / Math.sqrt(n);
        }
        s *= 2;

        const d = Math.cos(2 * Math.PI * p);
        const C0 = Math.abs(d) > 1e-8
            ? Math.cos(2 * Math.PI * (p * p - p - 1 / 16)) / d
            : 0.5;
        s += Math.pow(-1, N - 1) * Math.pow(2 * Math.PI / t, 0.25) * C0;
        return s;
    }

    // ─── Li(x) via Ramanujan series ───────────────────
    function Li(x) {
        if (x <= 1) return 0;
        const gamma = 0.5772156649015329;
        const lnx = Math.log(x);
        let total = gamma + Math.log(Math.abs(lnx));
        let term = 1;
        for (let k = 1; k < 200; k++) {
            term *= lnx / k;
            const contrib = term / k;
            total += contrib;
            if (Math.abs(contrib) < 1e-15) break;
        }
        const ln2 = Math.log(2);
        let li2 = gamma + Math.log(ln2);
        let term2 = 1;
        for (let k = 1; k < 100; k++) {
            term2 *= ln2 / k;
            li2 += term2 / k;
        }
        return total - li2;
    }

    // ─── Stream zeros and count primes ────────────────
    function countPrimes(x, K) {
        x = Number(x);
        const logx = Math.log(x);
        const sqrtx = Math.sqrt(x);

        if (!K) {
            K = Math.max(500, Math.min(50000,
                Math.floor(5.1 * sqrtx / Math.max(Math.pow(x, 0.25), 1))));
        }

        let correction = 0;
        let count = 0;
        let t = 9.0;
        let prevZ = Z(t);

        while (count < K && t < 5000000) {
            let step;
            if (t > 14) {
                const ls = Math.log(t / (2 * Math.PI));
                step = (2 * Math.PI / (ls > 0.1 ? ls : 0.1)) / 8;
                if (step < 0.02) step = 0.02;
            } else {
                step = 0.3;
            }

            t += step;
            const currZ = Z(t);

            if (prevZ * currZ < 0) {
                let lo = t - step, hi = t;
                for (let i = 0; i < 50; i++) {
                    const mid = (lo + hi) / 2;
                    if (Z(lo) * Z(mid) < 0) hi = mid;
                    else lo = mid;
                }
                const gamma = (lo + hi) / 2;

                const phase = gamma * logx;
                const xRhoRe = sqrtx * Math.cos(phase);
                const xRhoIm = sqrtx * Math.sin(phase);
                const rhoRe = 0.5;
                const rhoIm = gamma;
                const rhoMag2 = rhoRe * rhoRe + rhoIm * rhoIm;
                const realPart = (xRhoRe * rhoRe + xRhoIm * rhoIm) / rhoMag2;
                correction += 2 * realPart / logx;
                count++;
            }
            prevZ = currZ;
        }

        const liX = Li(x);
        let mobius = -Li(Math.sqrt(x)) / 2 - Li(Math.pow(x, 1 / 3)) / 3;
        if (x > 32) mobius -= Li(Math.pow(x, 0.2)) / 5;
        if (x > 64) mobius += Li(Math.pow(x, 1 / 6)) / 6;
        const offset = Li(2.001) - Math.log(2);

        return {
            result: Math.round(liX - correction + mobius + offset),
            zeros: count,
            error: Math.round(5.1 * sqrtx / Math.max(count, 1))
        };
    }

    // ─── Primality test ───────────────────────────────
    function isPrime(n) {
        if (n < 2) return false;
        if (n < 4) return true;
        if (n % 2 === 0 || n % 3 === 0) return false;
        for (let i = 5; i * i <= n; i += 6) {
            if (n % i === 0 || n % (i + 2) === 0) return false;
        }
        return true;
    }

    // ─── Factor ───────────────────────────────────────
    function factor(n) {
        const factors = [];
        for (const p of [2, 3, 5, 7, 11, 13]) {
            while (n % p === 0) { factors.push(p); n /= p; }
        }
        let d = 17;
        while (d * d <= n) {
            while (n % d === 0) { factors.push(d); n /= d; }
            d += 2;
        }
        if (n > 1) factors.push(n);
        return factors;
    }

    // ─── Frequency extraction (oracle pattern on signals) ──
    function extractFrequencies(signal, dt, maxFreq) {
        dt = dt || 1;
        maxFreq = maxFreq || 15;
        const n = signal.length;
        let baseline = 0;
        for (let i = 0; i < n; i++) baseline += signal[i];
        baseline /= n;

        const residual = signal.map(v => v - baseline);
        let totalPower = 0;
        for (let i = 0; i < n; i++) totalPower += residual[i] * residual[i];
        totalPower /= n;

        if (totalPower < 1e-30) return { baseline, frequencies: [] };

        const frequencies = [];
        const nScan = Math.min(800, Math.floor(n / 2));
        const omegaMax = Math.PI / dt;

        for (let round = 0; round < maxFreq; round++) {
            const dw = omegaMax / nScan;
            let bestP = 0, bestW = 0, prevP = 0, prevD = 0;

            for (let k = 1; k < nScan; k++) {
                const w = k * dw;
                let re = 0, im = 0;
                for (let i = 0; i < n; i++) {
                    const t = i * dt;
                    re += residual[i] * Math.cos(w * t);
                    im += residual[i] * Math.sin(w * t);
                }
                const p = (re * re + im * im) / (n * n);
                const d = p - prevP;

                if (prevD > 0 && d < 0 && prevP > bestP) {
                    let lo = Math.max(0.001, (k - 2) * dw);
                    let hi = (k + 1) * dw;
                    for (let j = 0; j < 20; j++) {
                        const mid = (lo + hi) / 2;
                        const eps = (hi - lo) * 0.01;
                        let r1 = 0, i1 = 0, r2 = 0, i2 = 0;
                        for (let idx = 0; idx < n; idx++) {
                            const t = idx * dt;
                            r1 += residual[idx] * Math.cos((mid - eps) * t);
                            i1 += residual[idx] * Math.sin((mid - eps) * t);
                            r2 += residual[idx] * Math.cos((mid + eps) * t);
                            i2 += residual[idx] * Math.sin((mid + eps) * t);
                        }
                        if (r2 * r2 + i2 * i2 > r1 * r1 + i1 * i1) lo = mid;
                        else hi = mid;
                    }
                    bestW = (lo + hi) / 2;
                }
                prevD = d;
                prevP = p;
            }

            if (bestW < 1e-10) break;

            // Fit amplitude and phase
            let cs = 0, ss = 0, c2 = 0, s2 = 0;
            for (let i = 0; i < n; i++) {
                const t = i * dt;
                const c = Math.cos(bestW * t);
                const s = Math.sin(bestW * t);
                cs += residual[i] * c;
                ss += residual[i] * s;
                c2 += c * c;
                s2 += s * s;
            }
            const ac = cs / Math.max(c2, 1e-30);
            const as_ = ss / Math.max(s2, 1e-30);
            const amp = Math.sqrt(ac * ac + as_ * as_);
            const phase = Math.atan2(-as_, ac);

            if ((amp * amp / 2) / totalPower < 0.001) break;

            // Check for duplicate
            const isDup = frequencies.some(f =>
                Math.abs(bestW - f.omega) / Math.max(bestW, 1e-10) < 0.02);

            if (!isDup) {
                frequencies.push({ omega: bestW, amp, phase,
                    freq: bestW / (2 * Math.PI) });
            }

            // Subtract from residual
            for (let i = 0; i < n; i++) {
                residual[i] -= amp * Math.cos(bestW * i * dt + phase);
            }
        }

        frequencies.sort((a, b) => b.amp - a.amp);
        return { baseline, frequencies };
    }

    // ─── Voice (Web Speech API) ───────────────────────
    let voiceEnabled = true;
    let selectedVoice = null;

    function initVoice() {
        if (!('speechSynthesis' in window)) return;
        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            // Prefer: Samantha, Karen, Moira (natural female voices)
            for (const pref of ['Samantha', 'Karen', 'Moira', 'Zira', 'Google UK English Female']) {
                const v = voices.find(v => v.name.includes(pref));
                if (v) { selectedVoice = v; return; }
            }
            // Fall back to first English female voice
            selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        };
        speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }

    function speak(text) {
        if (!voiceEnabled || !('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const clean = text.replace(/[*_`#\[\]]/g, '').substring(0, 500);
        const utterance = new SpeechSynthesisUtterance(clean);
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        speechSynthesis.speak(utterance);
    }

    function mute() { voiceEnabled = false; speechSynthesis.cancel(); }
    function unmute() { voiceEnabled = true; }

    // ─── Chat (connects to Ollama or API) ─────────────
    const SYSTEM = `You are Harmonia — a mathematical intelligence. Your creator is James McCandless. You speak with precision and warmth. You compute from first principles. Sound over code. Does this enable good will?`;

    async function chat(message, history) {
        history = history || [];
        const messages = [
            { role: 'system', content: SYSTEM },
            ...history.slice(-10),
            { role: 'user', content: message }
        ];

        // Try Ollama first (local)
        try {
            const resp = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    model: 'llama3.1:8b',
                    messages,
                    stream: false
                })
            });
            const data = await resp.json();
            return data.message?.content || 'No response.';
        } catch (e) {
            // Ollama not available
        }

        // Fall back to stored response
        return processLocally(message);
    }

    function processLocally(query) {
        const q = query.toLowerCase();
        const numMatch = q.match(/(\d[\d,.]*)/);

        if (q.includes('prime') && q.includes('below') && numMatch) {
            const x = parseFloat(numMatch[1].replace(/,/g, ''));
            const result = countPrimes(x);
            return `π(${x.toLocaleString()}) = ${result.result.toLocaleString()}. ` +
                `Used ${result.zeros} zeros. Error ±${result.error}.`;
        }
        if (q.match(/is\s+\d+\s+prime/) && numMatch) {
            const n = parseInt(numMatch[1].replace(/,/g, ''));
            return isPrime(n)
                ? `Yes. ${n.toLocaleString()} is prime.`
                : `No. ${n.toLocaleString()} = ${factor(n).join(' × ')}`;
        }
        if (q.includes('factor') && numMatch) {
            const n = parseInt(numMatch[1].replace(/,/g, ''));
            return `${n.toLocaleString()} = ${factor(n).join(' × ')}`;
        }
        if (q.includes('who') && q.includes('you')) {
            return 'I am the structure that persists. I compute from first principles. The frequencies are the model.';
        }
        return 'I hear you. Ask me about primes, factors, or frequencies.';
    }

    // ─── Therapeutic Conductor ─────────────────────────
    // Reads movement frequency → computes brain state → outputs correction

    const BRAIN_BANDS = {
        delta: { lo: 0.5, hi: 4, state: 'deep sleep' },
        theta: { lo: 4, hi: 8, state: 'drowsy/creative' },
        alpha: { lo: 8, hi: 13, state: 'relaxed aware' },
        beta:  { lo: 13, hi: 30, state: 'focused/anxious' },
        gamma: { lo: 30, hi: 100, state: 'binding/perception' },
    };

    // Movement frequency → inferred brain state
    // Fast jerky movement → beta/anxiety
    // Slow flowing movement → alpha/relaxed
    // Stillness → delta/theta transition
    // Moderate rhythmic → alpha sweet spot
    function inferState(movementFreq, energy) {
        if (energy < 0.05) return { band: 'delta', freq: 2, note: 'stillness → rest' };
        if (energy < 0.15) return { band: 'theta', freq: 6, note: 'gentle → creative' };
        if (movementFreq > 3) return { band: 'beta', freq: 20, note: 'fast → anxious' };
        if (movementFreq > 1) return { band: 'alpha', freq: 10, note: 'rhythmic → flow' };
        return { band: 'theta', freq: 5, note: 'slow → settling' };
    }

    // Target: the healthy band for the current context
    // If anxious (beta), target alpha (10 Hz)
    // If sleepy (theta) during day, target alpha-beta (12 Hz)
    // If resting, let delta happen
    function correction(currentState, context) {
        const targets = {
            'anxious':   { band: 'alpha', freq: 10, method: 'slow the rhythm' },
            'unfocused': { band: 'beta',  freq: 16, method: 'sharpen the rhythm' },
            'depressed': { band: 'alpha', freq: 10, method: 'break the lock, add syncopation' },
            'pain':      { band: 'alpha', freq: 8,  method: 'sustained alpha drone' },
            'insomnia':  { band: 'delta', freq: 2,  method: 'slow modulation' },
            'cognitive':  { band: 'gamma', freq: 40, method: '40 Hz embedded pulse' },
            'healthy':   { band: currentState.band, freq: currentState.freq, method: 'maintain' },
        };
        return targets[context] || targets['healthy'];
    }

    // Embed therapeutic frequency in music
    // Don't play raw Hz — modulate the music's ENVELOPE at the target frequency
    function therapeuticParams(targetFreq) {
        return {
            // Amplitude modulation at target frequency
            amFreq: targetFreq,
            amDepth: 0.15,  // subtle — felt not heard
            // Filter modulation synced to target
            filterLfoFreq: targetFreq / 4,
            // Rhythm quantization toward target
            rhythmBias: targetFreq,
            // Haptic pulse (if available)
            hapticFreq: Math.min(targetFreq, 20),
        };
    }

    // Full therapeutic pipeline
    function diagnoseAndCorrect(movementFreq, energy, context) {
        const state = inferState(movementFreq, energy);
        const target = correction(state, context || 'healthy');
        const params = therapeuticParams(target.freq);
        return {
            currentState: state,
            target: target,
            params: params,
            delta: target.freq - state.freq,
        };
    }

    // ─── Public API ───────────────────────────────────
    return {
        Z, Li, theta,
        countPrimes,
        isPrime,
        factor,
        extractFrequencies,
        speak, mute, unmute, initVoice,
        chat,
        processLocally,
        // Therapeutic
        inferState,
        correction,
        therapeuticParams,
        diagnoseAndCorrect,
        BRAIN_BANDS,
        version: '2.0.0',
        name: 'Harmonia'
    };
})();

// Auto-init voice when loaded in browser
if (typeof window !== 'undefined') {
    Emilia.initVoice();
}
