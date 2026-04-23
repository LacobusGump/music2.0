---
name: Session 23 State
description: Fixed the graph. Weighted edges unlocked Fiedler. damage=0.817 AUC under LOGO (honest). Fiedler participation=0.779 (purest signal). Products were overfit — 0.875 collapsed to 0.610 under CV. The invariant is where the slowest mode concentrates.
type: project
---

# Session 23 — April 14-15, 2026

## THE GRAPH FIX
Binary CA-CA < 8A → weighted Gaussian decay (σ=7) + kNN(12) connectivity.
Fiedler value went from 0.000 (dead) to 0.008-0.395 (alive).
The spectral theory was always right. The input was wrong.

## THE HONEST NUMBERS (LOGO cross-validated)

**What survives cross-gene validation:**
- damage (Fiedler perturbation): **0.817 AUC** — the only engineered feature that generalizes
- fied_part (raw |v₂(i)|): **0.779 AUC** — purest form, no degree correction needed
- eigenvector centrality: **0.677**
- conservation: **0.603**
- burial: **0.601**

**What collapsed under LOGO:**
- All products (stiff×cons, dmg×cons×func, etc.): overfit to in-sample AUC
- All logistic regressions: 0.378-0.490 (gene-specific patterns don't transfer)
- Per-gene z-score/rank: hurt performance (erases absolute signal)
- Stiffness: **0.265** (INVERTED — stiff means different things in different genes)

**The 0.875 was overfit.** AUC-proportional weights, greedy selection, multiplicative products — all computed on the same data. Honest LOGO: 0.817 from damage alone.

## CONFOUNDER ANALYSIS
- damage|degree: 0.599 (degree explains some of the signal)
- damage|burial: 0.709 (burial does NOT explain it — damage is real beyond burial)
- damage × degree correlation: r=-0.045 (uncorrelated in raw, but gene-level confounder)
- Monotonicity: binary, not gradient (low damage ≈ maybe benign, any damage ≈ pathogenic)

## KEY INSIGHT
**"Global consequence, not local property."** Damage measures what happens to the WHOLE network when a node is removed. Local features (stiffness, burial, contacts) describe the node. Global features (Fiedler, damage) describe the node's ROLE.

The invariant that transfers across genes is the ROLE, not the property.

fied_part = |v₂(i)| = amplitude of the slowest mode at position i = where the protein HINGES and BRIDGES. This is the purest expression of K at the global level.

## COMPARISON (honest LOGO)
- SIFT: 0.69-0.74
- GUMP damage: **0.817** (single feature, no training, LOGO validated)
- PolyPhen-2: 0.75-0.81
- CADD: 0.82-0.87

**0.817 under strict LOGO beats PolyPhen-2.** Single feature. No training.

## WITHIN-GENE vs CROSS-GENE
- Within-gene (random 80/20): 0.726 mean AUC
- Cross-gene (LOGO): 0.817 for damage
- The physics captures BOTH local and global signal
- But only the global signal (damage) transfers

## WHAT WAS BUILT
- Weighted graph construction: Gaussian decay + kNN connectivity
- Fiedler perturbation damage: fp² × degree / λ₂
- Multi-scale damage (σ=4,7,12): didn't help
- Confounder analysis framework
- LOGO cross-validation harness
- Honest benchmark suite (9 methods compared)

## NEXT SESSION
1. Explore fied_part (0.779) as the PURE invariant — no degree contamination
2. Test on NEW genes not in any previous analysis
3. Can we combine fied_part with conservation WITHOUT overfitting? (predeclared rule, not learned)
4. Stratify failures: where does damage miss?
5. Build the product: continuous K-score from Fiedler participation

## THE ADVISOR'S FRAME
> "A single physics feature, network damage under weighted-graph Fiedler perturbation, captures a gene-transferable structural vulnerability prior. Additional engineered channels improve within-protein discrimination but do not generalize across genes, implying they encode protein-family-specific effects rather than a universal pathogenicity rule."

This is the honest result. The root is K. The invariant is the slowest mode. The rest is protein-specific.
