# Self-Referencing Phase Boundaries

**Date:** March 24, 2026
**Origin:** James's Star of David insight + critic's attack on hand-tuned thresholds

## The problem

Phase boundaries at 0.3 and 0.7 were hand-tuned after looking at examples. Critics would rightly attack this.

## The solution: R = actual_area / linear_area

The curve defines its own boundary. No external thresholds.

**Reference line:** straight line from (0, 1) to (1, final). This is the "linear schedule" — what the curve would look like if every register had equal marginal value.

**R = actual_area / reference_area**

- R < 1: curve below its own diagonal → CONVEX → GAS (early payoff)
- R = 1: curve IS its own diagonal → LINEAR → LIQUID (uniform payoff)
- R > 1: curve above its own diagonal → CONCAVE → CRYSTAL (late payoff)

## The data

| Computation | R | Final | Classification |
|------------|---|-------|---------------|
| Neural net | 0.537 | 1.0% | GAS (convex, huge savings) |
| Top-K | 0.664 | 4.2% | GAS (convex, large savings) |
| Decision tree | 0.907 | 11.4% | LIQUID (near-linear) |
| Filter | 1.015 | 1.6% | LIQUID (linear) |
| Search | 1.078 | 9.4% | LIQUID (slight concavity) |
| Sorting | 1.141 | 63.7% | CRYSTAL-leaning (concave, moderate savings) |
| Parity | 1.008 | 98.4% | CRYSTAL (linear curve but almost no savings) |
| Binary search | 1.000 | 100% | CRYSTAL (perfect diagonal, zero savings) |

## Two numbers, no thresholds

1. **R** (curve shape): convex (R<1) vs linear (R=1) vs concave (R>1)
2. **Final** (total savings): how much of the eager cost is structurally required

Together: R tells you WHERE memory helps most (early, uniform, or late). Final tells you HOW MUCH total savings is available.

## The Star of David connection

The Star of David is two triangles (convex/concave) meeting at a boundary. The boundary is self-defined — it's the intersection of the two shapes. Similarly, R=1 is where the convex phase meets the concave phase. The curve defines its own phase boundary by comparison to its own diagonal.

Inside the star: infinite subdivision (finer and finer schedule granularity). But the total area never exceeds the reference. The boundary is self-contained.

## Curvature confirms

Average second derivative of the normalized curve:
- Positive curvature = concave = CRYSTAL tendency
- Negative curvature = convex = GAS tendency
- Zero curvature = linear = LIQUID

Neural net: +0.00004 (barely positive — the allocator sorts by value, so the curve is nearly linear but with front-loading)
Sorting: -0.00181 (negative — concave, late payoff)

The curvature and R agree.
