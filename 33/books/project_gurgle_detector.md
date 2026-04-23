---
name: Gurgle Detector Development
description: The one surviving ToE tool. Spectral flatness metric works for anomaly detection, needs bothsides (input-output transfer) for onset detection. Cooking.
type: project
---

## Status: COOKING (Session 29)

### The Principle (SURVIVES EVERYTHING)
"Find the minimum coupling that produces coherence."
"Tighten only until it stops gurgling."
One strategy. Every domain. The drum tuner's algorithm.

### What Works
- Anomaly detection (coherence LOSS): SF jumps from 0.013 to 0.490. Clean. 25 samples delay.
- The concept: start loose, increase coupling, detect transition.

### What Doesn't Work (Yet)
- Onset detection (coherence GAIN): SF can't distinguish "silent" from "in tune" from "overdamped" — all produce peaked spectra.
- Learning rate finder: SF ~0.03 at all useful lr values.
- Kuramoto K_c: not detected.
- Ising: SF was BACKWARDS (low at high T, high at low T) because it measures fluctuations not order.

### The Bothsides Insight (James, Session 29)
The metric measures ONE SIDE — the output spectrum. But gurgle is about the RELATIONSHIP between input and output. The TRANSFER FUNCTION.

A drum that gurgles: input energy splits across many modes (1 → 1/5 + 1/5 + 1/5 + 1/5 + 1/5). Each mode gets a fraction. Scattered.

A drum in tune: input energy goes to ONE mode (1 → ~1). Coherent transfer.

The metric should be: WHAT FRACTION OF INPUT ENERGY ENDS UP IN THE DOMINANT OUTPUT MODE?

This is the bothsides measurement:
- Stimulate the system (hit the drum / perturb the state)
- Measure the RESPONSE (how does the energy distribute?)
- Coherence = fraction of response energy in the dominant mode
- Gurgle = energy scattered across many modes

This fixes the Ising problem: at low T, PERTURB the system and measure the response. The response is coherent (one relaxation mode). At high T, the response is scattered (many modes). The RESTING signal is misleading — the RESPONSE is what matters.

### The 1/5th Energy
If the system has N competing modes and the input energy distributes evenly, each mode gets 1/N. The spectral flatness of a uniform-N distribution is high. As coupling increases, the dominant mode captures more energy. At the gurgle threshold, the dominant mode captures ENOUGH that the sound is "clean."

The threshold might be related to 1/φ — the golden ratio as the fraction where coherence begins. But DON'T import the specific number (lesson from 8 killed engines). Find the threshold EMPIRICALLY for each system.

### v6 (Active Perturbation) — KILLED
Built and tested. Amplitude × organization × recovery metric.
2/5 — WORSE than v5 (4/5). Active perturbation introduces artificial
complexity. The sub-metrics fight each other (amplitude vs recovery
anti-correlated in damped systems). The drummer doesn't hit with a
separate stick to test — they play and listen. Passive > active.

### FINAL: v5 SHIPS
Attack + decay coherence. Passive observation. 4/5 domains.
`from gump.tune import detect, coherence, anomaly_detect`
10/10 tests. The damped oscillator failure is acceptable —
critical damping is not a coherence problem.

### 8 Killed Engines — The Lesson
All 8 failed because they used SPECIFIC NUMBERS from physics as FIXED VALUES in engineering. The principle survives. The numbers don't. Don't import α, φ, λ into the tool. Import the STRATEGY: start loose, find minimum coherent coupling, for YOUR specific system.
