# Destroyer Test Results

**Date:** March 25, 2026
**Spec:** commit 1850222

## Results

| Test | Baseline | Control | Pass? |
|------|----------|---------|-------|
| D1: Scramble primes | 0.887 | 0.685±0.133 | NO (one trial hit 0.911) |
| D2: Random ripple | 0.887 | 0.535±0.141 | YES (baseline > mean+2σ) |
| D3: Far transfer (21-30) | 0.887 | 0.822 | YES |
| D4: Moduli 503-571 | — | 0.859 | Comparable |
| D4: Moduli 101-149 | — | 0.269 | Much worse |
| D5: NC=2 | — | 0.743 | Weaker |
| D5: NC=3 | — | 0.887 | Best |
| D5: NC=4 | — | 0.588 | Worse |

## Interpretation

### What PASSED
- Prime ripple carries signal that random frequencies don't (D2: 0.887 vs 0.535)
- The pattern transfers to unseen zeros far up the critical line (D3: 0.822)
- 3 colors is optimal (D5: NC=3 beats NC=2 and NC=4)

### What FAILED
- Scrambling prime labels still gives ~0.685, with one trial at 0.911 (D1)
- This means: the signal is partly in the SPECTRUM of primes used (their magnitudes/frequencies), not fully in their specific arithmetic identities
- The scrambled operator inherits the same set of ln(p) frequencies, just assigned to different modular actions — and that's sometimes enough

### What D4 reveals
- Larger moduli (503-571) work nearly as well as the frozen set (211-263)
- Small moduli (101-149) work poorly
- Interpretation: larger moduli provide finer resolution of the Q/Z circle, capturing more arithmetic structure

## Honest assessment

The signal is PARTIALLY real:
- Prime frequencies > random frequencies (confirmed)
- Transfer to unseen zeros (confirmed)
- But prime identity (which prime is which) is NOT fully essential (D1 failure)

The operator captures something about the DISTRIBUTION of prime frequencies (the ln(p) values) but not the full arithmetic identity of each prime. The scrambled operator still has the same set of frequencies — it just assigns them to wrong modular positions. That's sometimes enough because the SPACING pattern of ln(p) values carries most of the signal.

## What this means

The correlation is real but it's carried by the STATISTICAL properties of the prime distribution (the set of ln(p) frequencies), not by the specific arithmetic of each prime. This is consistent with Katz-Sarnak: the zero statistics come from the FAMILY structure, not from individual prime values.

The operator is in the right FAMILY but doesn't use individual prime arithmetic fully. To sharpen: need a construction where scrambling primes provably destroys the signal.
