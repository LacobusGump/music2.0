# 1000-Zero Experiment Results
# Generated 2026-03-25 11:34:08
# Protocol: preregistration_1000zero.md

```

  STEP 0: Load 1000 zeta zeros
  Zeros: 1000, Spacings: 999
  Mean spacing: 1.406694
  Spacing range: [0.1148, 4.8961]

======================================================================
  STEP 1: Score All Null Families
======================================================================

  Family                              Freqs                   Primary  #Win  Secondary       KS       KS-p
  ------------------------------------------------------------------------------------------------------
  N1: Real primes                     [2, 3, 5, 7, 11]...    0.132888     1     0.1329   0.1188 1.1923e-07  (19s)
  N2: Composites                      [4, 6, 9, 15, 21]...   0.125019     2     0.1414   0.1101 2.4951e-06  (20s)
  N3: Random odd (seed=2026)          [3, 5, 7, 15, 19]...  -0.007322     2     0.1322   0.1127 9.8240e-07  (19s)
  N4: Random odd (seed=2027)          [3, 5, 7, 13, 15]...  -0.043956     2     0.0904   0.0997 2.2388e-05  (17s)
  N5: Random odd (seed=2028)          [11, 15, 17, 19, 23]...   0.100667     2     0.1470   0.1125 1.6073e-06  (18s)
  N6: Random odd (seed=2029)          [3, 7, 9, 11, 17]...   0.010942     2     0.1279   0.0945 7.5731e-05  (19s)
  N7: Random odd (seed=2030)          [3, 5, 9, 13, 15]...  -0.001060     2     0.1146   0.1107 1.3829e-06  (20s)
  N8: Shifted primes (p+1)            [4, 5, 8, 10, 14]...   0.125096     2     0.1468   0.0971 3.6218e-05  (20s)
  N9: Log-matched non-prime           [6, 9, 15, 21, 33]...   0.119133     2     0.1697   0.1124 3.0708e-06  (17s)
  N10: Small primes [2..11]           [2, 3, 5, 7, 11]      -0.038023     3     0.1674   0.1176 2.3050e-08  (17s)
  N11: Large primes [23..47]          [23, 29, 31, 37, 41]...   0.046855     2     0.0754   0.0928 1.5309e-04  (18s)

======================================================================
  STEP 2: Significance Tests (N1: Real Primes)
======================================================================

  ── Test A: Permutation Test (n=1000) ──
  N1 primary score:       0.132888
  Permutation mean:       0.002569 ± 0.031334
  Permutation max:        0.134760
  Permutation p-value:    0.0010  (1/1000)

  ── Test B: Rank Among Null Families ──
    1. N1: Real primes                       0.132888 ◄
    2. N8: Shifted primes (p+1)              0.125096
    3. N2: Composites                        0.125019
    4. N9: Log-matched non-prime             0.119133
    5. N5: Random odd (seed=2028)            0.100667
    6. N11: Large primes [23..47]            0.046855
    7. N6: Random odd (seed=2029)            0.010942
    8. N7: Random odd (seed=2030)           -0.001060
    9. N3: Random odd (seed=2026)           -0.007322
   10. N10: Small primes [2..11]            -0.038023
   11. N4: Random odd (seed=2027)           -0.043956

  N1 rank: 1 of 11

  ── Test C: Bootstrap 95% CI ──
  Per-window correlations: [0.1328882]
  Bootstrap 95% CI:       [nan, nan]

  ── Test D: Bonferroni Correction ──
  Raw p:                  0.0010
  Bonferroni (×11):       0.0110
  Significant at 0.05?    YES

  ── Test E: KS Test Comparison ──
  Family                                 KS stat      p-value
  ------------------------------------------------------------
  N11: Large primes [23..47]              0.0928   1.5309e-04
  N6: Random odd (seed=2029)              0.0945   7.5731e-05
  N8: Shifted primes (p+1)                0.0971   3.6218e-05
  N4: Random odd (seed=2027)              0.0997   2.2388e-05
  N2: Composites                          0.1101   2.4951e-06
  N7: Random odd (seed=2030)              0.1107   1.3829e-06
  N9: Log-matched non-prime               0.1124   3.0708e-06
  N5: Random odd (seed=2028)              0.1125   1.6073e-06
  N3: Random odd (seed=2026)              0.1127   9.8240e-07
  N10: Small primes [2..11]               0.1176   2.3050e-08
  N1: Real primes                         0.1188   1.1923e-07 ◄

======================================================================
  STEP 3: Surrogate Spectra
======================================================================

  S1: GUE:
    Mean:  -0.001230 ± 0.030987
    Range: [-0.087999, 0.068369]
    Fraction >= N1 score: 0.0000

  S2: Shuffled:
    Mean:  -0.000807 ± 0.031657
    Range: [-0.096157, 0.111459]
    Fraction >= N1 score: 0.0000

  S3: Poisson:
    Mean:  -0.003805 ± 0.031639
    Range: [-0.100375, 0.082306]
    Fraction >= N1 score: 0.0000

======================================================================
  DECISION (per preregistered criteria)
======================================================================

  Criterion 1 (N1 ranks #1 among families):        PASS  (rank=1)
  Criterion 2 (permutation p < 0.01):               PASS  (p=0.0010)
  Criterion 3 (Bonferroni p < 0.05):                PASS  (p=0.0110)
  Criterion 4 (CI lower > null mean):               FAIL  (CI_lo=nan, null_mean=0.0437)
  Criterion 5 (N1 > GUE mean + 2σ):                PASS  (0.1329 vs 0.0607)

  Criteria passed: 4/5
  VERDICT: PARTIAL — Suggestive but not conclusive.

  Total runtime: 5.8 minutes
```
