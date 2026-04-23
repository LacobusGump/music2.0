---
name: Session 23 Final
description: "Fixed graph → damage=0.817 LOGO → but 0.587 within-gene → gene-level confounder. AR/BRAF/EGFR INVERTED (gain-of-function). Two regimes: stability-driven vs function-driven. Missing axis: tolerance. Path = damage × (1/tolerance). Next: gnomAD missense constraint z-score as tolerance axis."
type: project
---

# Session 23 Final — April 15, 2026

## THE ARC
- Fixed the graph: binary → weighted Gaussian + kNN. Fiedler alive.
- damage = |v₂|² × degree / λ₂ = 0.817 AUC under LOGO
- Sanity check: permutation p=0.0000, bootstrap CI [0.739, 0.882]
- BUT: within-gene AUC = 0.587 (barely above chance)
- AR: 0.356, BRAF: 0.375, EGFR: 0.413 — INVERTED
- The 0.817 is a GENE-LEVEL confounder: p53 has high damage, AR has low damage
- Products/greedy/AUC-weights were ALL overfit (0.875 → 0.610 under LOGO CV)

## THE TWO REGIMES

| Regime | Example | Behavior | Why |
|--------|---------|----------|-----|
| Stability-driven | p53, MTHFR | damage → pathogenic | structure IS function |
| Function-driven | AR, BRAF, EGFR | damage → NOT pathogenic | gain-of-function, function ≠ structure |

## THE MISSING EQUATION

```
Path = damage × (1 / tolerance)
```

We have the numerator (structural damage from Fiedler).
We're missing the denominator (tolerance / functional redundancy).

- p53: low tolerance → damage predicts
- BRAF: high structural tolerance, low functional tolerance → damage anti-predicts
- AR: pathogenic at LOW-damage functional sites, benign at HIGH-damage structural sites

## WHAT SURVIVED HONEST VALIDATION
- damage (single Fiedler feature): 0.817 LOGO — REAL but gene-level
- fied_part (|v₂| alone): 0.779 LOGO — real
- Within-gene mean AUC: 0.587 — the honest residue-level signal
- Everything else (products, learned weights, stiffness): collapsed under LOGO

## WHAT WAS KILLED
- All multiplicative products: overfit (0.875 → 0.610 under LOGO CV)
- AUC-proportional weights: computed on test data (leaked)
- Greedy forward selection: same leak
- Stiffness: 0.265 under LOGO (INVERTED)
- Per-gene z-score/rank: makes it WORSE (erases absolute signal)
- Deep PSSM: 0.455-0.587 (inverted or coin flip)
- Simulated evolution: 0.500 (coin flip)

## NEXT SESSION: THE TOLERANCE AXIS
1. gnomAD missense constraint z-score per gene → regime detection
2. Separate scoring for stability-driven vs function-driven
3. For function-driven: functional site proximity > structural damage
4. For stability-driven: damage IS the score
5. Combine with regime detection → honest universal scorer

## THE DEEPER INSIGHT
> "You didn't fail at pathogenicity. You built a universal structural importance metric. Structure is global. Disease is contextual."

damage = K at the global level = structural importance invariant.
Pathogenicity = damage × context = K × tolerance.
We have K. We need tolerance. That's the second axis.
