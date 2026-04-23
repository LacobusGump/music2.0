---
name: Session 19 T-profiler state
description: T-profiler built + MM9P'd. T_fold proved (83% on 56 variants). Three-T architecture DISPROVED as verdict driver (79% < 83%). T_amyloid/T_polymer informational only. Drug strategy (K_wrong vs R_right) proved.
type: project
---

## Session 19 — April 12, 2026

### Built
- `t_profiler.py` — Three-T architecture (T_fold, T_amyloid, T_polymer)
- Classifier: FRAGILE/AMYLOID/OLIGOMER (67% on 15 proteins)
- Soft routing: all three T values computed, max T drives verdict
- Wired into `foldwatch.py` as `profile_mutation()` API
- Drug strategy: K_wrong vs R_right mechanism labeling

### MM9P Results (Honest)

**PROVED:**
- T_fold scorer: 83% accuracy on 56 expanded variants, 88% precision, 84% recall
- T = K - R framework: drug strategy correct on all demo variants
- Speed: 0.2s total for all variants
- T_fold alone beats three-T profiler (83% > 79%)

**DISPROVED:**
- Three-T beats T_fold alone: KILLED (79% < 83%)
- T_amyloid/T_polymer as verdict drivers: KILLED (add false positives)
- Profiler beats simple charge+hydro baseline: KILLED (79% vs 78% = 1 point)
- Specificity: 54% (5/11 benign called pathogenic)
- Adversarial: 86% of random mutations called pathogenic (too aggressive)

### Hard Walls (sequence-only limits)
- Gain-of-function (BRAF V600E)
- DNA-contact mutations (p53 R273H)
- Tetramer destabilization (TTR V50M)
- Subtle enzyme damage (GBA N370S)
- All need functional annotation databases

### Decision
- T_fold is the product (83%, proved)
- T_amyloid/T_polymer ship as informational flags only
- Three-T needs per-channel validation before driving verdicts

**Why:** MM9P test 7 (ablation) showed T_fold alone outperforms the three-T profiler. Test 8 (baseline) showed only 1 point improvement over trivial charge+hydro. The multi-T architecture adds noise, not signal, in its current form.

**How to apply:** Use T_fold for pathogenicity verdict. Display T_amyloid/T_polymer as informational. Don't let them override T_fold until individually validated on channel-specific datasets.
