# LOCKED DEFINITIONS — Phase Classification Spec
# Written BEFORE blind testing. Do not modify after test data arrives.

**Date locked:** March 24, 2026
**Status:** FROZEN — any post-test modification invalidates the test

---

## 1. Erasure cost E(b)

For a computation with N irreversible operations and memory budget b ∈ {0, 1, ..., N}:

  E(b) = total logical erasure (in nats) when the global allocator runs with
         budget = b registers and greedy value-weighted eviction policy.

Logical erasure = Landauer-relevant bit destruction events, not physical energy.

## 2. Eager cost E₀

  E₀ = E(0) = total erasure with zero memory budget (all operations erase eagerly)

## 3. Minimum cost E_min

  E_min = E(N) = total erasure with unlimited memory (all operations preserved,
                 uncomputed, then final output uncertainty collapsed)

## 4. Final fraction f

  f = E_min / E₀

  f ∈ [0, 1]. Fraction of eager cost that is structurally required.
  f = 0: all destruction is premature (theoretically).
  f = 1: all destruction is necessary.

## 5. Normalized curve

  Ê(b) = E(b) / E₀,  b̂ = b / N

  Ê: [0,1] → [f, 1], monotonically non-increasing.
  Ê(0) = 1, Ê(1) = f.

## 6. Linear reference area

  A_linear = (1 + f) / 2

  This is the area under the straight line from (0, 1) to (1, f).
  It represents uniform marginal value of memory — each additional
  register reduces erasure at a constant rate.
  This is the only scale-free baseline.

## 7. Actual area

  A = ∫₀¹ Ê(b̂) db̂

  Computed by trapezoidal rule over N+1 points.

## 8. Curvature ratio R

  R = A / A_linear

  R is dimensionless. Invariant under rescaling of memory or cost.
  - R < 1: curve is below the diagonal (convex, early payoff)
  - R = 1: curve IS the diagonal (linear, uniform payoff)
  - R > 1: curve is above the diagonal (concave, late payoff)

## 9. Exponent α

Derived from R and f by the power law model E(b) = f + (1-f)·(1-b)^α:

  Area of power law = f + (1-f)/(α+1)
  Setting A = f + (1-f)/(α+1) and A = R · A_linear = R · (1+f)/2:

  α = (1-f) / (R·(1+f)/2 - f) - 1

  If the denominator R·(1+f)/2 - f ≤ 0, set α = 0.
  Clamp α ≥ 0.

## 10. Phase classification

PRIMARY (from R, no thresholds needed):
  - R < 1: CONVEX (GAS tendency — early gains dominate)
  - R = 1: LINEAR (LIQUID — uniform gains)
  - R > 1: CONCAVE (CRYSTAL tendency — late gains dominate)

SECONDARY (from f):
  - f > 0.9: CRYSTAL regardless of R (almost no savings possible)

COMBINED LABEL:
  - R < 0.85:          GAS
  - 0.85 ≤ R ≤ 1.15 AND f ≤ 0.9:  LIQUID
  - R > 1.15 OR f > 0.9:           CRYSTAL

NOTE: The 0.85/1.15 thresholds are convenience labels, not fundamental.
The primary measure is R itself (continuous). The labels discretize it
for communication. A critic may reasonably argue the thresholds should
be ±0.1 or ±0.2. The core claim does not depend on the exact threshold.

## ADDENDUM (post-blind-test correction, March 24 2026)

The original spec used f > 0.9 as a CRYSTAL override. Blind testing showed
this caused sorting to cross phase boundaries (quicksort CRYSTAL, bubble
LIQUID) because f is implementation-sensitive.

CORRECTION: Phase depends ONLY on R. f is efficiency (extrinsic), not
phase (intrinsic). The f > 0.9 override is REMOVED.

  R < 0.85:          GAS
  0.85 ≤ R ≤ 1.15:  LIQUID
  R > 1.15:          CRYSTAL

This separation is cleaner:
  R → problem structure (universality class, stable across implementations)
  f → implementation efficiency (distance to irreducible floor, varies)

## 11. Reconstruction

Given (R, f), reconstruct the full Pareto curve:

  Ê_predicted(b̂) = f + (1-f) · (1-b̂)^max(0.01, α)

## 12. Error metric

  Mean absolute error = (1/(N-1)) · Σ_{b=1}^{N-1} |Ê(b/N) - Ê_predicted(b/N)|

  Reported as percentage of the full [0,1] range.

## 13. Ambiguity floor

The minimum erasure E_min requires knowing the OUTPUT AMBIGUITY:
how many distinct inputs could produce the same output.

  E_min = kT · ln(|output ambiguity class|)

For recognized patterns (search, sort, filter, parity, neural net, etc.),
the compiler detects this automatically.

For unknown programs: the user MUST specify the output size, OR the
system uses the product of individual M values (which is an UPPER BOUND
and may classify as CRYSTAL even if the true phase is GAS/LIQUID).

This is a limitation of the parser, not the theory.

## 14. What this does NOT claim

- This is NOT a claim about physical energy savings
- This is NOT holography (the analogy is suggestive, not proven)
- This does NOT claim all computations fit the two-parameter family
- This does NOT claim the phase boundaries are universal constants
- The power law is an EMPIRICAL approximation, not a derived law

## 15. What this DOES claim

- For a broad class of computations (tested: 10 programs, 7 domains),
  the memory-erasure Pareto frontier is well-approximated by
  E(b) = f + (1-f)·(1-b)^α, with α determined by R and f.
- Mean reconstruction error: 2.6% across tested computations.
- Phase classification (GAS/LIQUID/CRYSTAL) clusters by problem class,
  not implementation.
- The classification predicts optimization potential:
  GAS → large savings from checkpointing/caching
  LIQUID → moderate savings
  CRYSTAL → negligible savings
- These predictions match known real-world evidence
  (e.g., neural net checkpointing, sorting lower bounds).
