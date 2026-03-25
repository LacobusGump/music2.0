# FROZEN SPEC: Rainbow Operator
# Written March 25, 2026. Do not modify after destroyer tests.

---

## Exact construction

### Arithmetic base
- Moduli: [211, 223, 227, 229, 233, 239, 241, 251, 257, 263]
- Primes acting: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41]
- N_colors: 3
- NA = Σ(q_i - 1) = 2364
- NT = NA × 3 = 7092

### Block diagonal Laplacian L_arith
For each modulus q, on (Z/qZ)*:
  L_{x,y} = Σ_p [δ(y, px mod q) + δ(y, p⁻¹x mod q) - 2δ(x,y)] / ln(p)
Symmetrized: L = (L + L^T) / 2

### Rainbow coupling C
For each prime p (index pi = 0..12):
  φ₁ = 2π·pi / 13
  φ₂ = 2π·(3·pi + 1) / 13
  C_p (3×3 Hermitian):
    [0,            w·e^{iφ₁},        0.7w·e^{iφ₂}      ]
    [w·e^{-iφ₁},  0,                 0.5w·e^{i(φ₁+φ₂)} ]
    [0.7w·e^{-iφ₂}, 0.5w·e^{-i(φ₁+φ₂)}, 0              ]
  where w = 1/ln(p)
  C_p = (C_p + C_p†) / 2

  U_p (NA×NA): interlayer coupling
    For each pair (q_a, q_b): U[off_a+i, off_b+(p·x mod q_b)-1] = 1 (symmetric)

  C_total = Σ_p kron(U_p, C_p)

### Normalization
  cn = ||C_total||_F
  ln0 = ||L0||_F  where L0 = kron(L_arith, I_3)
  λ_rainbow = 5.0
  L_rainbow = L0 + λ_rainbow · C_total · (ln0/cn) · 0.1
  L_rainbow = (L_rainbow + L_rainbow†) / 2

### Diagonal landscape V
  center = mean(moduli) / 2
  For each arithmetic index idx (residue x in modulus q):
    u = ln(x) - ln(center)
    V(idx) = bg_str · u²/4 + rip_str · Σ_p ln(p)/√p · cos(u · ln(p))
  bg_str = 0.1
  rip_str = 0.3
  For each color c: V[idx·NC + c] = V(idx)

  V_diag = diag(V)
  V_norm = ||V_diag||_F
  R_norm = ||L_rainbow||_F
  L_total = L_rainbow + V_diag · (R_norm / V_norm)
  L_total = (L_total + L_total†) / 2

### Eigenvalues
  eigs = eigvalsh(L_total), sorted ascending

---

## Exact measurement procedure

### Small gap fraction
  nonzero = eigs where |eig| > 1e-8
  bulk = nonzero[N/4 : 3N/4]
  gaps = diff(bulk), filtered > 1e-10
  small_gap_% = mean(gaps/mean(gaps) < 0.5)

### Spacing correlation
  For start_frac in [0.10, 0.15, 0.20, ..., 0.55]:
    sample = nonzero[start:start+K+1] where K = len(target_zeros)
    eg = diff(sample)
    en = eg / mean(eg)
    corr = pearson(en[:K-1], zn[:K-1])
  Report: max positive correlation across all start fractions

### Target zero windows
  In-sample: zeros 1-10 = [14.135, 21.022, 25.011, 30.425, 32.935, 37.586, 40.919, 43.327, 48.005, 49.774]
  Held-out:  zeros 11-20 = [52.970, 56.446, 59.347, 60.832, 65.113, 67.080, 69.546, 72.067, 75.705, 77.145]
  Normalized spacings: zn = diff(zeros) / mean(diff(zeros))

---

## Locked headline numbers

| Metric | Value |
|--------|-------|
| Held-out correlation (real zeros 11-20) | **0.887** |
| In-sample correlation (real zeros 1-10) | 0.727 |
| vs GUE random spectrum | 0.467 |
| vs Poisson random spectrum | 0.404 |
| vs Scrambled zeros | 0.670 |
| Ablation: remove rainbow | -0.412 |
| Ablation: remove prime ripple | -0.327 |
| Ablation: remove landscape | -0.370 |
| Ablation: random diagonal | -0.142 |
| Small gap fraction | ~12-14% (GOE range) |
| Matrix size | 7092 × 7092 |

---

## Destroyer tests (to be run against this frozen spec)

1. Scramble prime labels (same spectrum size, wrong arithmetic)
2. Matched random ripple (same amplitude distribution, random phases)
3. Far held-out window (zeros 21-30, zeros 31-40)
4. Other L-function families (Dirichlet L-functions, elliptic curve L-functions)
5. Different modulus sets (same count, different primes)
6. Reduced color count (NC=2 vs NC=3 vs NC=4)

If 0.887 survives these: reproducible phenomenon.
If it doesn't: identifies which ingredient is carrying artifact vs signal.

---

## Non-claims

- This is NOT a proof of RH
- The eigenvalues are NOT the zeros of ζ
- The correlation is between SPACING PATTERNS, not eigenvalue-to-zero matching
- The operator is a TOY MODEL, not the Hilbert-Pólya operator
- All results are on a finite discrete space, not continuous

## Claims

- The operator's eigenvalue spacing correlates specifically with ζ zero spacing
- The correlation generalizes to held-out zeros (not overfitting)
- All three ingredients (rainbow, prime ripple, confinement) are essential
- Generic spectra (GUE, Poisson) produce significantly lower correlation
- The construction is reproducible from this spec
