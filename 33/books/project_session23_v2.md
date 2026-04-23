---
name: Session 23 v2
description: "0.736 within-gene regime-optimal. D×F×S×E (LoF) + F×T×E (GoF). MI/DCA anti-predicts (0.302). MSA tolerance is the biggest single gain (+0.074). EGFR=0.924, AR=0.600 floor. Next: substitution-specific environment interaction."
type: project
---

# Session 23 v2 — The Ladder

## THE HONEST NUMBERS (within-gene AUC, no cross-gene confounder)

```
D alone:                0.587  (Fiedler damage)
D × F:                  0.646  (+0.059 functional proximity)
D × F × S × E:          0.668  (+0.022 substitution + environment)
F × T × E:              0.720  (+0.052 MSA tolerance, GoF path)
Regime-optimal:         0.736  (+0.016 LoF/GoF mechanism labels)
```

## PER-GENE RESULTS

| Gene | Mechanism | LoF formula | GoF formula | Best |
|------|-----------|-------------|-------------|------|
| p53 | LoF | 0.662 | 0.568 | 0.662 |
| MTHFR | LoF | 0.632 | 0.632 | 0.632 |
| RET | mixed | 0.847 | 0.847 | 0.847 |
| AR | GoF | 0.510 | 0.600 | 0.600 |
| BRAF | GoF | 0.500 | 0.750 | 0.750 |
| EGFR | GoF | 0.859 | 0.924 | 0.924 |

## WHAT WAS KILLED
- MI/DCA (coevolution): 0.302 mean AUC — ANTI-predicts. High-MI = structural core = benign.
- Multi-mode damage (modes 2+): each additional mode added noise
- Exact Δλ₂: 0.369 — the approximation (0.817) is BETTER because it's two signals (topology × connectivity)
- Products with AUC-derived weights: ALL overfit (0.875 → 0.610 under LOGO)
- Per-gene z-score: erases the absolute signal

## THE INGREDIENTS (six total)
1. D = Fiedler damage (|v₂|² × degree / λ₂) from weighted graph
2. F = functional proximity (distance to catalytic/binding/PTM sites)
3. S = substitution penalty (Grantham + Pro/Gly/Cys special cases)
4. E = environment gate (burial × charge/hydro flip)
5. T = MSA intolerance (1 - frequency of mutant AA at this position, ColabFold ~5000 seqs)
6. Mechanism = LoF/GoF from disease databases

## TWO FORMULAS
- LoF: D × F × S × E (damage-driven)
- GoF: F × T × E (tolerance-driven, no damage — it inverts)

## THE KEY INSIGHT
> "Damage measures structural importance. Pathogenicity is functional consequence under tolerance constraints. Path = damage × (1/tolerance). We have the numerator. The denominator is mechanism-dependent."

## DEEPER MSA: TESTED AND KILLED
- Shallow 2K: 0.648 mean (F×T×E)
- Full uncapped: 0.641 (flat — 2K already saturated)
- Deep env (BFD/MGnify): 0.567 (WORSE — metagenomic noise)
- Sequence depth is NOT the bottleneck. 2K curated is optimal.

## CONTEXT DISRUPTION (CD): TESTED, GENE-SPECIFIC
- BRAF: CD=0.875 (excellent for kinase GoF)
- MTHFR: CD=0.105 (catastrophically inverted for LoF enzyme)
- Not universal. Helps specific families, hurts others.

## MI/DCA (coevolution): KILLED
- Mean AUC 0.302 — ANTI-predicts
- High MI = structural core = benign
- Allosteric control knobs are LOW-MI positions

## THE HONEST CEILING
0.736 within-gene regime-optimal. Matches SIFT. Approaches PolyPhen-2.
From one eigenvalue + one MSA + one annotation + one chemistry table + one mechanism label.
No training. Fully interpretable. The ceiling for physics-only scoring.

To go beyond 0.75: needs supervised calibration or fundamentally new data
(MD dynamics, PPI data, tissue expression). Not more of the same features.
