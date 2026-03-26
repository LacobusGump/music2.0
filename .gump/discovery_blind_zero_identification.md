# Blind Zero Identification

## The Problem
Given ONLY a height t on the critical line, identify which L-function the zero belongs to. No circular information allowed.

## Method
For each candidate character χ_q (q = 3 to 30) and for zeta, compute the 200-prime partial Euler product magnitude |P_200(1/2+it)|. The TRUE L-function should produce the deepest dip (smallest magnitude).

## Single-Zero Results
- Overall accuracy: 42% across 6 families (chance = 17%)
- Zeta: 65%, chi_3: 59%, chi_7: 42%, chi_11: 35%, chi_5: 28%, chi_4: 22%
- The argmin (which candidate dips deepest) is a noisy but real signal

## Window Voting (k consecutive zeros, majority vote)
| k | Accuracy |
|---|---|
| 1 | 42% |
| 3 | 49% |
| 5 | 62% |
| 7 | 69% |
| 9 | 83% |

At k=9: zeta 100%, chi_3 100%, chi_5 100%, chi_11 100%, chi_7 75%, chi_4 25%.

## What This Means
1. The inverse problem is SOLVABLE — zeros carry enough information to identify their L-function
2. The signal is noisy at single-zero level but amplifies with averaging
3. The chi_4/chi_25 confusion reflects genuine arithmetic proximity
4. The argmin coordinate is the simplest possible zero invariant: which L-function dips deepest?

## The Metric on L-Functions
The dip profile distance matrix defines a metric on L-functions:
- Closest pair: chi_5 and chi_11 (d = 1.964)
- Most distant: chi_3 and chi_4 (d = 3.258)

## Honest Boundary
- 42% single-zero accuracy is weak (but 2.5x chance)
- Window voting to 83% requires 9 consecutive zeros
- Chi_4 remains hard to identify (confused with chi_25)
- Higher heights degrade performance as zero density increases
