# Holographic Property of the Pareto Frontier

**Date:** March 24, 2026
**Origin:** James's Star of David / "infinity in a finite space" intuition

## The test

Can two surface numbers (R, final) reconstruct the entire Pareto curve?

## The model

E(b) = final + (1 - final) · (1 - b)^α

Where:
- b = budget fraction (0 to 1)
- final = minimum erasure / eager erasure
- α = (1 - final) / (R · (1 + final)/2 - final) - 1

α is computed from R and final alone. No fitting.

## The results

| Computation | R | final | α | Avg error | Holographic? |
|------------|---|-------|---|-----------|-------------|
| Filter | 1.015 | 1.6% | 0.97 | 0.7% | YES |
| Parity | 1.008 | 98.4% | 0.01 | 0.0% | YES (trivial) |
| Max pooling | 1.015 | 20.8% | 0.95 | 1.8% | YES |
| Search | 1.078 | 9.4% | 0.83 | 3.2% | YES |
| Neural net | 0.537 | 1.0% | 2.79 | 3.3% | YES |
| Sorting | 1.141 | 63.7% | 0.22 | 4.5% | YES |
| Decision tree | 0.907 | 11.4% | 1.27 | 6.6% | Partial |
| Top-K | 0.664 | 4.2% | 2.15 | 9.1% | Partial |

**Mean error: 3.6%**

## Interpretation

Two numbers (the "surface") reconstruct the full curve (the "volume") to 96.4% accuracy. This is holographic in the information-theoretic sense:

- Surface = (R, final) — two dimensionless numbers
- Volume = E(b) for all b ∈ [0,1] — the full Pareto frontier
- Encoding = the power law E(b) = final + (1-final)·(1-b)^α
- α is NOT a free parameter — it's determined by R and final

## The Star of David connection

James's intuition: "triangles can be broken down forever and yet never exceed the boundary."

The Pareto curve: infinite refinement (finer budget granularity, more schedules) but always bounded by the power law envelope. The envelope is determined by two boundary numbers. The interior is determined by the boundary. That's the star.

## What's real vs metaphor

REAL:
- Two numbers reconstruct the curve to 3.6% mean error
- The power law family E(b) = f + (1-f)·(1-b)^α describes Pareto curves well
- α is determined by R (the curvature measure), not fitted

METAPHOR:
- "Holographic" in the Bekenstein sense requires a physical area bound
- This is information-theoretic analogy, not AdS/CFT

HONEST STATEMENT:
The Pareto frontier of memory vs erasure is well-approximated by a one-parameter power law family. The parameter is determined by the dimensionless curvature measure R. Two boundary numbers (R, final) therefore serve as a compact encoding of the full optimization landscape, analogous to (but not identical with) holographic encoding.

## What this means practically

You don't need to sweep the full Pareto frontier. Compute R and final (two measurements), apply the formula, and you have the full curve. This makes the phase classification useful for PREDICTING optimization outcomes without running the full search.
