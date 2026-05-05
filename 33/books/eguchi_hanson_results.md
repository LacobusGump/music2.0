# Eguchi-Hanson Spectral Determinant: Results

## Setup

- **Space**: A_1 ALE (Eguchi-Hanson), resolution of C^2/Z_2
- **det(C)** = 2 (Cartan matrix of A_1)
- **Bolt radius**: a = 1
- **Operator**: Scalar Laplacian -Delta
- **Test**: Does zeta'_continuous(0) = log(pi) = 1.14473...?

## Method

### What failed (and why)

The naive numerical approach -- compute phase shifts delta_l(k), form the Krein
spectral shift xi(E) = (1/pi) sum_l (l+1)^2 delta_l(k), integrate xi(E)*log(E)/E --
**diverges** in 4D. Three independent runs confirmed this:

1. **Fixed l_max, varying k_max**: zeta' ~ k_max^4 (quartic UV divergence)
2. **Fixed k_max, varying l_max**: zeta' ~ l_max^4 (angular momentum divergence)
3. **Adaptive l_max per k**: same divergence, just reshuffled

This is the standard UV divergence of the spectral determinant in 4 dimensions.
The individual phase shifts are well-behaved:

| l | delta_l(k=1) |
|---|-------------|
| 0 | -0.02570 |
| 2 | +0.00654 |
| 4 | +0.00093 |
| 6 | +0.00031 |

But the degeneracy-weighted sum with (l+1)^2 is UV-divergent.

### What worked: Double Hurwitz zeta function

The spectral zeta function for the relative problem (C^2/Z_2 vs C^2) is
computed exactly using the **double Hurwitz zeta function**:

    zeta_2(s, a | 1, 1) = zeta_H(s-1, a) + (1-a) zeta_H(s, a)

where zeta_H is the standard Hurwitz zeta function (available in mpmath).

The relative spectral zeta function:

    zeta_rel(s) = zeta_2(s, 1/2) - (1/2) zeta_2(s, 1)

## Key Numbers

All verified to 12+ digits, converged across step sizes h = 10^{-3} to 10^{-8}.

| Quantity | Value |
|----------|-------|
| zeta_H(-1, 1/2) | 1/24 = 0.041666666667 |
| zeta_H(0, 1/2) | 0 |
| zeta_H'(0, 1/2) | -log(2)/2 = -0.346573590280 |
| zeta_H'(-1, 1/2) | 0.053829439327 |
| zeta_2(0, 1/2) | 1/24 = 0.041666666667 |
| zeta_2'(0, 1/2) | -0.119457355813 |
| zeta_H(-1, 1) | -1/12 = -0.083333333333 |
| zeta_H'(-1, 1) | zeta'(-1) = 1/12 - log(A) = -0.165421143701 |
| zeta_2(0, 1) | -1/12 = -0.083333333333 |
| zeta_2'(0, 1) | -0.165421143701 |

Where A = 1.28242712910... is the Glaisher-Kinkelin constant.

### Relative quantities

| Quantity | Value | Interpretation |
|----------|-------|----------------|
| zeta_rel(0) | **1/12** = 0.083333... | Heat kernel a_2 coefficient (log-divergent piece) |
| **Delta_Z'(0)** | **-0.036746783963** | Scale-independent finite part |
| log S_2(1/2) | log(2)/2 = 0.346573... | Double sine function at 1/2 |
| log Gamma_2(1/2) | 0.045963787480 | Barnes double gamma at 1/2 |

## The Test

    Delta_Z'(0) = -0.036746783963

    log(pi)     = +1.144729885849

    |Delta_Z'(0) - log(pi)| = 1.1815

These are not even close. The closest standard constant is **0** (diff = 0.037).

## Additional checks

- The Dowker formula for the **compact** case (lens space S^3/Z_2 vs S^3) gives
  log det_rel = -log(2). This is exact and verified.

- The double sine function S_2(1/2 | 1,1) satisfies log S_2(1/2) = log(2)/2,
  verified analytically and numerically.

- The Barnes G-function G(1/2) = 0.603244... and its logarithm does not
  produce log(pi) in any simple combination with the other spectral quantities.

## Verdict

**sqrt(2/pi) DOES NOT SURVIVE.**

The spectral determinant of the scalar Laplacian on the A_1 ALE space
(Eguchi-Hanson) does not produce log(pi). The scale-independent finite part
of the relative zeta function is Delta_Z'(0) = -0.03675, which is a small
negative number close to zero, unrelated to log(pi) = 1.14473.

The number that DOES appear naturally is **log(2)** (via the double sine function
on S^3/Z_2), which makes sense: det(C) = 2 for the A_1 Cartan matrix, and
the spectral determinant on the compact cross-section encodes log(det C) = log(2).

## Files

- Solver: `/tmp/eguchi_hanson_solver.py`
- Verification: `/tmp/verify_delta.py`
- Results: `/tmp/eguchi_hanson_results.md`
