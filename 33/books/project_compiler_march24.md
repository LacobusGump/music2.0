---
name: Entropy-aware compiler state — March 24, 2026
description: Full state of the compiler, simulator, checkpoint optimizer, and tools. What was built, what was proven, what was killed.
type: project
---

## What was built this session

1. **Entropy-aware simulator** (tools/simulator.html) — 5 panels: search, sorting, multiply, primitives, optimizer. Pareto frontier, timeline charts, garbage tracking, cost surface sliders.

2. **Entropy-aware compiler** (tools/compiler.html) — 14 presets across 5 industries. Global allocator with liveness analysis, value-weighted eviction, memory budget constraint. Information flow graph. Pipeline mode with MATERIALIZE boundaries.

3. **Checkpoint optimizer** (tools/checkpoint.html) — Real models (ResNet-18/50, VGG-16, GPT-2, BERT, U-Net). Real activation sizes (MB). Real recompute costs (ms). Pareto-optimal checkpoint placement. Generated PyTorch code.

4. **Test model upgraded** (tools/test-model.html) — Added adder vs multiplier test (Test 4).

5. **Paper hardened** (.gump/paper_submission.md) — σ_p→Φ_p bridge fixed (correspondence not derivation), automorphism lemma fixed (permutation lemma), channel factorization via Kraus operators, repeated-prime uniqueness weakened, 5 vulnerabilities armored, degeneracy reframe, 3 new references.

6. **Novelty slider** — In the music engine. Familiar↔Novel controls cure time, phrase resolution, timing jitter, degree heat decay.

7. **R page tools grid** — All tools linked at bottom of research page.

## The thesis

**computation ≠ destruction — only the final result entropy matters**

Compiler savings = gap between Σ log(M_i) (independent) and log(|output|) (correlated). The gap = premature erasure. The compiler eliminates premature erasure, not necessary erasure.

## Stress test results

| Preset | Eager | Minimum | Savings | Why |
|---|---|---|---|---|
| Linear search | 64 bits | 6 bits | 90.6% | Redundant — all asking same question |
| Binary search | 6 bits | 6 bits | 0% | Already optimal — control case |
| Parity | 64 bits | 63 bits | 1.6% | Adversarial — almost no correlation |
| Sorting | 24 bits | 15.3 bits | 36.3% | Partial correlation |
| Neural net | 480 bits | 3.3 bits | 99.3% | Heavy many-to-one at every layer |
| SQL query | 20,782 bits | 4.3 bits | ~100% | Massive filtering cascade |

## The logarithmic unity

ln appears in Shannon, Boltzmann, Landauer, primes, and the compiler for the same reason: it converts multiplicative structure to additive structure. The compiler's savings = the correlation gap in the multiplicative structure of the computation. Documented in .gump/research_logarithmic_unity.md.

## What was killed

- Dark matter as Landauer heat (energy conservation)
- "Primes = cost" (reframed: lost degeneracy = cost)
- Universal energy claims (disclaimer on every tool page)
- σ_p → Φ_p as derivation (now: correspondence, 3-layer bridge in Appendix A)

## What's next

- PyTorch plugin (pip installable checkpoint optimizer)
- SQL query optimizer plugin
- Streaming pipeline plugin
- The paper needs human mathematician review
- Gov summary sent to congressional rep
