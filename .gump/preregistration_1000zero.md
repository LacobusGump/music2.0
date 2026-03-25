# PREREGISTRATION: 1000-Zero Validation Experiment
# Written March 25, 2026. FROZEN before any 1000-zero results are computed.

---

## 1. Operator Definition (LOCKED)

Rainbow operator from frozen spec (spec_rainbow_operator.md).

**Moduli:** [211, 223, 227, 229, 233, 239, 241, 251, 257, 263]
**Primes acting:** [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41]
**N_colors:** 3
**Matrix size:** 7092 × 7092

### Laplacian L_arith
Block diagonal over moduli. For each modulus q, on (Z/qZ)*:
  L_{x,y} = Σ_p [δ(y, px mod q) + δ(y, p⁻¹x mod q) - 2δ(x,y)] / ln(p)
Symmetrized: L = (L + L^T) / 2

### Rainbow coupling
For each prime p (index pi = 0..12):
  φ₁ = 2π·pi/13, φ₂ = 2π·(3·pi+1)/13, w = 1/ln(p)
  C_p: 3×3 Hermitian with entries [0,1]=w·e^{iφ₁}, [0,2]=0.7w·e^{iφ₂}, [1,2]=0.5w·e^{i(φ₁+φ₂)}
  Hermitized: C_p = (C_p + C_p†)/2
  U_p: NA×NA interlayer coupling (cross-modulus multiplication by p), symmetrized
  C_total = Σ_p kron(U_p, C_p)

### Normalization
  λ = 5.0
  L_rainbow = kron(L_arith, I_3) + λ · C_total · (||L0||_F / ||C_total||_F) · 0.1
  Hermitized.

### Landscape
  center = mean(moduli)/2
  u(x) = ln(x) - ln(center)
  V(x) = 0.1·u²/4 + 0.3·Σ_p ln(p)/√p · cos(u·ln(p))
  Replicated across colors. Normalized: V_diag · (||L_rainbow||_F / ||V_diag||_F)

### Eigenvalues
  eigs = eigvalsh(L_total), sorted ascending.

---

## 2. Unfolding Procedure (LOCKED)

1. Select positive eigenvalues: eigs[eigs > 0.01]
2. Fit polynomial of degree 5 to cumulative count: np.polyfit(pos_eigs, arange(1,N+1), 5)
3. Evaluate: unfolded = polyval(coeffs, pos_eigs)
4. This is done ONCE. No tuning of threshold or polynomial degree.

---

## 3. Target Zeros (LOCKED)

First 1000 nontrivial zeros of ζ(s), imaginary parts.
Source: Andrew Odlyzko's tables (first 1000 zeros, 9 decimal places minimum).
URL: https://www.andrew.cmu.edu/course/15-355/Zeros (or equivalent standard table)

If exact Odlyzko tables are unavailable, use the LMFDB or mpmath.zetazero() with 15+ digits.

Normalized spacings: zn = diff(zeros) / mean(diff(zeros)), giving 999 values.

---

## 4. Score Definitions (LOCKED)

### PRIMARY SCORE: Mean correlation over fixed shifts
  - Divide unfolded spectrum into non-overlapping windows of length 1000
  - For each window: compute 999 normalized spacings, compute Pearson r against zn
  - Primary score = mean(r) over all complete windows
  - This eliminates shift-search freedom entirely.

### SECONDARY SCORE (exploratory only): Best single-window correlation
  - Slide window of length 1000 across unfolded spectrum in steps of 100
  - Report max Pearson r
  - This is reported for transparency but NOT used for significance testing.

### TERTIARY SCORE: Kolmogorov-Smirnov on spacing distributions
  - Compare empirical CDF of all unfolded spacings (bulk middle 50%) against
    empirical CDF of normalized zeta zero spacings
  - KS statistic + p-value
  - This tests distributional match, not sequential pattern match.

---

## 5. Null Families (LOCKED)

Each null family uses the SAME operator construction, SAME unfolding, SAME scoring.
Only the primes acting are swapped.

| Label | Frequency set | Count | Purpose |
|---|---|---|---|
| N1: Real primes | [2,3,5,7,11,13,17,19,23,29,31,37,41] | 13 | Baseline |
| N2: Composites | [4,6,9,15,21,25,33,35,39,45,49,51,55] | 13 | Arithmetic specificity |
| N3: Random odd A | 13 random odd numbers in [3,55], seed=2026 | 13 | Density control |
| N4: Random odd B | 13 random odd numbers in [3,55], seed=2027 | 13 | Density control |
| N5: Random odd C | 13 random odd numbers in [3,55], seed=2028 | 13 | Density control |
| N6: Random odd D | 13 random odd numbers in [3,55], seed=2029 | 13 | Density control |
| N7: Random odd E | 13 random odd numbers in [3,55], seed=2030 | 13 | Density control |
| N8: Shifted primes | [4,5,8,10,14,16,20,22,26,32,34,40,44] | 13 | Prime+1 (breaks primality) |
| N9: Log-matched | 13 values with same ln-spacing as primes, non-prime | 13 | Spectral density control |
| N10: Small primes only | [2,3,5,7,11] | 5 | Subset test |
| N11: Large primes only | [23,29,31,37,41,43,47] | 7 | Subset test |

### Surrogate spectra (no operator rebuild needed):
| Label | Method | Purpose |
|---|---|---|
| S1: GUE surrogate | Wigner-surmise spacings (100 draws) | Universality-only explanation |
| S2: Shuffled spacings | Permute zn (1000 draws) | Sequence specificity |
| S3: Poisson surrogate | Exponential spacings (100 draws) | Uncorrelated baseline |

---

## 6. Significance Tests (LOCKED)

### Test A: Permutation test on primary score
  - Compute primary score for real primes (N1)
  - Generate 1000 permuted-zn targets (shuffle the 999 spacings)
  - Compute primary score for each permuted target
  - p-value = fraction of permuted scores >= real score

### Test B: Null family comparison
  - Compute primary score for all 11 null families (N1-N11)
  - Rank N1 (real primes) among all families
  - One-sided: is N1 the best? By how much?

### Test C: Bootstrap CI on primary score
  - Resample non-overlapping windows with replacement (500 draws)
  - Report 95% CI on primary score

### Test D: Bonferroni correction
  - Correct for: 11 null families tested
  - If primary score p-value × 11 < 0.05, declare significance

### Test E: KS test (tertiary score)
  - Report KS statistic and p-value for N1 vs zeta spacing distribution
  - Compare to KS statistics for N2-N11

---

## 7. Decision Criteria (LOCKED)

### SUCCESS (zeta-specificity demonstrated):
  ALL of the following must hold:
  1. N1 primary score > all null family scores (N2-N11)
  2. Permutation p-value < 0.01 (survives at raw level)
  3. Bonferroni-corrected p-value < 0.05
  4. Bootstrap 95% CI lower bound > mean of null family scores
  5. N1 primary score > mean(S1 GUE surrogate scores) + 2·std(S1)

### PARTIAL (suggestive but not conclusive):
  At least 3 of the 5 criteria above hold.

### FAILURE (no demonstrated zeta-specificity):
  Fewer than 3 criteria hold.
  Interpretation: operator produces GUE-class statistics via universality,
  without specific zeta-zero alignment. Still a valid toy Hecke model.

---

## 8. What Will NOT Be Done After Seeing Results

- No changing the unfolding procedure
- No changing the polynomial degree
- No changing the positive-eigenvalue threshold
- No changing the window size or step
- No adding or removing null families
- No changing significance thresholds
- No re-running with different moduli or primes
- No "exploratory" analyses that become primary

The secondary (best-window) score is reported but never tested for significance.
Any post-hoc observations are labeled as such.

---

## 9. Implementation Notes

- Zeros sourced via mpmath.zetazero(n) for n=1..1000 at 20+ digit precision
- All random seeds fixed and recorded
- Full source code committed BEFORE results are computed
- Results appended to a separate file (research_1000zero_results.md)

---

## Signed
Preregistered March 25, 2026, before any 1000-zero computation.
Operator construction verified against frozen spec (baseline r=0.860 on 10-zero held-out).
