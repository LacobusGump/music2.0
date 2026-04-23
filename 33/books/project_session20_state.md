---
name: Session 20 State
description: Session 20 (April 13, 2026): Conservation engine, 1594 variants, 81.6% balanced accuracy (pre-Session 22 indexing fix → 94.7%), BLOSUM62 orthologs, gene intolerance
type: project
---

# Session 20 — Conservation Engine (April 13, 2026)

## The Push
- Expanded from 56 → 1,594 variants across 15 disease proteins
- Pulled deep orthologs (85-157 species per protein) for conservation
- Built BLOSUM62 local alignment conservation scoring
- Added gene-intolerance-aware rescue (prior-weighted)
- Length-corrected scoring for large proteins (BRCA1 1863aa)
- Wired score_enhanced() into level3_scoring.py and t_profiler.py

## Results (final, honest)
- 1,675 variants (1,594 pathogenic + 81 gnomAD benign)
- **81.6% balanced accuracy** (93.4% recall, 69.8% specificity)
- Laplace propagation was +6.8 points (74.8% → 81.6%)
- ΔK coupling sensitivity was +3.4 points
- gnomAD is the most load-bearing signal (+21.6% in ablation)
- Drumming insight: "more bouncing before going back to memory" → micro ping-pong

## Architecture (final)
1. K — AlphaFold contact degree (where)
2. Conservation — BLOSUM62 ortholog alignment (when)
3. ΔK — coupling sensitivity wt→mt (what — K's derivative)
4. Propagation — Laplace ∇²φ=0 on contact graph (K's integral)
5. gnomAD — 18,272 variants, auto-lookup (who)

Score = K × cons × (0.15 + ΔK × 2.5) × propagation × 0.5 + AF filter

It's all K. Conservation is evolution's memory of K. ΔK is K's derivative.
Propagation is K's integral. gnomAD is humanity's measurement of K.
Really 3 signals: K, its history, its test results.

## Key Insight
p53 is so intolerant that conservative substitutions (V→I, E→D) are pathogenic.
The conservative discount (0.4×) killed the signal. Conservation + gene prior rescues it.
cons * 0.28 at prior >= 0.99 catches the edge cases.

## Files Changed
- `tools/engines/bio/level3_scoring.py` — added score_enhanced(), BLOSUM62, compute_conservation()
- `tools/engines/bio/t_profiler.py` — T_profile() uses score_enhanced, accepts gene_prior
- `gump-package/gump/foldwatch.py` — profile_mutation() exposes gene_prior, ortholog_data
- `tools/engines/bio/T_PROFILER_SPEC.md` — updated with session 20 results

## Remaining Work
- Wire K_gradient signal for last 6 p53 FN (cons 0.44-0.50)
- Fix BRCA1 FP (18/29 benign called pathogenic — base scorer problem)
- Get AR orthologs (currently very low conservation in LBD)
- Push to PyPI
- Expand ClinVar set to 5,000+
