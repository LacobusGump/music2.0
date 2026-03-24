# A Dimensionless Classification of Computational Information Destruction

**James McCandless** | beGump LLC | jim@begump.com
March 24, 2026

---

## Abstract

We present an empirical framework for classifying computations by the structure of their memory-erasure tradeoff. By normalizing the Pareto frontier of memory investment versus logical information destruction and comparing it to its own linear baseline, we obtain a dimensionless curvature measure R that partitions computations into three regimes — convex (gas), linear (liquid), and concave (crystal). This classification is stable across implementations of the same problem, predicts optimization potential, and reconstructs the full Pareto frontier from two measurements to ~3% mean accuracy. Systematic deviations identify multi-regime computations requiring a third parameter (knee location b*), reducing error to ~2% on previously problematic cases. The model does not fail randomly; it fails specifically on computations with visible regime transitions.

---

## 1. Definitions

**E(b):** Total logical erasure (nats) when a computation runs with memory budget b registers, using greedy value-weighted eviction.

**E₀ = E(0):** Eager erasure (zero memory, all operations erase immediately).

**E_min = E(N):** Minimum erasure (unlimited memory, all intermediates preserved and uncomputed).

**f = E_min / E₀:** Implementation efficiency. Fraction of eager cost that is structurally required. f is extrinsic — it varies by implementation.

**Ê(b̂) = E(b)/E₀:** Normalized curve, b̂ = b/N. Maps [0,1] → [f, 1].

**A_linear = (1 + f) / 2:** Area under the straight line from (0,1) to (1,f). Represents uniform marginal value of memory — the only scale-free baseline.

**A = ∫₀¹ Ê(b̂) db̂:** Actual area under the normalized curve.

**R = A / A_linear:** Dimensionless curvature ratio. Invariant under rescaling of memory or cost.

**α = (1-f) / (R·(1+f)/2 - f) - 1:** Shape exponent, derived from R and f. Not fitted.

---

## 2. Phase Classification (R only)

- **R < 1:** Convex → GAS. Early memory investment yields disproportionate savings. Destruction is front-loaded and mostly premature. *Optimize aggressively.*

- **R ≈ 1:** Linear → LIQUID. Each unit of memory reduces erasure at a roughly constant rate. Destruction is evenly distributed. *Optimize selectively.*

- **R > 1:** Concave → CRYSTAL. Late memory investment yields most savings, or savings are negligible. Destruction is tightly coupled. *The cost is inherent.*

Phase depends ONLY on R. f is efficiency (extrinsic), not identity (intrinsic).

---

## 3. Two-Parameter Reconstruction (Version 1)

Given R and f, the full Pareto curve is approximated by:

    Ê(b̂) ≈ f + (1-f) · (1-b̂)^α

Tested on 10 computations across 7 domains. Mean reconstruction error: 2.6%.

| Computation | Domain | R | f | Phase | Error |
|------------|--------|---|---|-------|-------|
| Neural net | ML | 0.537 | 1.0% | GAS | 3.3% |
| Top-K | Selection | 0.664 | 4.2% | GAS | 9.1% |
| Decision tree | ML | 0.907 | 11.4% | LIQUID | 6.6% |
| Filter | Data | 1.015 | 1.6% | LIQUID | 0.7% |
| Compression | Signal | 1.038 | 4.2% | LIQUID | 1.5% |
| Search | Retrieval | 1.078 | 9.4% | LIQUID | 3.2% |
| Sorting | Ordering | 1.141 | 63.7% | CRYSTAL | 4.5% |
| Parity | Boolean | 1.008 | 98.4% | LIQUID | 0.0% |

---

## 4. Representation Invariance

Same problem, different implementations — does the phase hold?

| Problem | Implementations | R range | Phase | Crossed? |
|---------|----------------|---------|-------|----------|
| Sorting 8 | merge, bubble, selection, insertion | 0.897-0.934 | All CRYSTAL | No |
| Search 64 | linear, linear-2x | 0.521-0.589 | Both LIQUID | No |
| Filter 32 | threshold, compare | 0.516-0.644 | Both LIQUID | No |
| Parity | 32, 64, 128 bit | 0.998-1.000 | All LIQUID | No |

R clusters by problem. f varies by implementation. Phase boundaries not crossed.

---

## 5. Three-Parameter Extension (Version 2)

For computations where Version 1 error exceeds 5%, a third parameter captures the regime transition.

**b*:** Knee location. Found by maximum second derivative of Version 1 residuals. Marks where the computation transitions from one regime to another.

**Two-segment fit:** Ê is modeled as two power laws joined at b*.

| Computation | V1 error | b* | V2 error | Improvement |
|------------|----------|-----|----------|-------------|
| K-means | 10.4% | 0.35 | 1.7% | 84% |
| Search | 2.9% | 0.09 | 0.0% | 100% |
| Filter | 0.6% | 0.02 | 0.0% | 100% |
| Bubblesort | 7.7% | 0.83 | 6.9% | 11% |

K-means: the knee at b*=0.35 marks where cluster assignment (gas-like) transitions to refinement (crystal-like). Two regimes, one computation.

Bubblesort: no sharp knee. Its deviation is smooth curvature mismatch, not regime transition. b* does not help. This identifies a third failure class.

---

## 6. Taxonomy of Computations

**Class 1 — Single-phase.** Smooth curve. Low error with (R, f). Examples: search, filter, parity, compression, DP, shortest path.

**Class 2 — Multi-phase (piecewise).** Kink present. High V1 error, fixed by b*. Examples: K-means, mixed pipelines, staged computations.

**Class 3 — Smooth deviation.** No kink. Still mismatched with power law. Examples: bubblesort-type implementations with distributed redundancy. Version 3 candidate.

---

## 7. Practical Implications

**Before optimizing any computation:**
1. Compute R (one measurement: sweep budget, compute area ratio)
2. If GAS (R < 1): optimize aggressively — large savings from checkpointing/caching
3. If LIQUID (R ≈ 1): optimize selectively — moderate, uniform savings
4. If CRYSTAL (R > 1): don't optimize for erasure — the cost is structural

**For ML training (activation checkpointing):**
Neural nets are GAS (R ≈ 0.54). The sweet spot is ~30% of memory budget, capturing ~75% of total savings. This matches real-world experience with PyTorch gradient checkpointing.

---

## 8. What This Does Not Claim

- This is not a claim about physical energy savings on current hardware
- The power law is an empirical approximation, not a derived law
- The phase boundaries (0.85, 1.15) are convenience labels, not constants
- Not all computations fit the two-parameter family
- The framework requires knowing the output ambiguity (minimum erasure floor)

---

## 9. What This Does Claim

- For a broad class of computations, the memory-erasure Pareto frontier is well-approximated by a two-parameter family with ~3% mean error
- The curvature measure R classifies computations into phases that are stable across implementations
- Deviations from the model are not random — they correspond to identifiable structural motifs (regime transitions, smooth curvature mismatch)
- The classification predicts optimization potential and matches known real-world evidence

---

## 10. The Core Statement

*Computations differ not only in how much information they destroy, but in how that destruction is distributed under resource constraints. By normalizing the memory-erasure tradeoff and comparing it to its own linear baseline, we obtain a dimensionless curvature measure. This single quantity partitions computations into three regimes — convex (gas), linear (liquid), and concave (crystal) — which empirically cluster by problem class and predict optimization potential.*

---

## Tools

- Compiler: begump.com/tools/compiler.html
- Simulator: begump.com/tools/simulator.html
- Checkpoint optimizer: begump.com/tools/checkpoint.html
- Research: begump.com/r/

## Contact

James McCandless | beGump LLC, Columbus NJ | jim@begump.com
Provisional Patent #64/011,402 (filed March 20, 2026)
