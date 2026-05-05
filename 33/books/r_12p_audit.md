# MM12P AUDIT: r = arctan(sqrt(19/18))

**Claim:** r = arctan(sqrt(19/18)) = arctan(sqrt(dim(E7)/roots(E7))) = 0.798913...
**Purpose:** "Complete the derivation of alpha from E7 topology with zero free parameters."
**Date:** 2026-05-04
**Tool:** mpmath, 80 decimal places

---

## STEP 0: DISCRIMINATE

**Is this coupling or correlation?**

The Lie algebra identification is real: dim(E7) = 133, roots(E7) = 126, and 133/126 = 19/18 exactly (cross-multiply: 133 x 18 = 2394 = 126 x 19). That part is not numerology.

The problem is the function wrapping it. arctan(sqrt(dim/roots)) is not a standard Lie algebra invariant. It does not appear in Casimir eigenvalue formulas, Weyl dimension formulas, anomaly coefficients, or any known representation-theoretic quantity. The function arctan(sqrt(x)) for x near 1 produces values near pi/4 = 0.7854, which is close to r = 0.7989 regardless of input. This is the "near-1 compression zone" where many ratios produce similar outputs.

**STRUCTURAL REDUCTION (discovered during audit):** For any simply-laced Lie algebra, dim = rank + roots and roots = rank x h (Coxeter number). Therefore dim/roots = (1+h)/h for ALL simply-laced algebras. The claim is not "E7 topology" -- it is arctan(sqrt((h+1)/h)) where h=18 happens to be the Coxeter number of E7. Scanning h = 2 through 50, only h=18 gives a match within 1e-3. The nearest neighbors h=17 (diff 7.8e-4) and h=19 (diff 6.9e-4) are ~100x worse.

**Assessment: The identification 19/18 = dim(E7)/roots(E7) = (h+1)/h is structurally real but universal to all simply-laced algebras. The formula arctan(sqrt(...)) wrapping it is ungrounded. The claim reduces to "h = 18 is special" -- which is true (it IS E7's Coxeter number), but arctan(sqrt(19/18)) is not how Coxeter numbers enter physics.**

---

## STEP 1: STATE PRECISELY

- **Claim:** r = arctan(sqrt(19/18)) = 0.79891332263258752093...
- **Target:** r_exact = 0.79890659495533744806... (from CODATA 2022 alpha)
- **Match precision:** 4 decimal places (0.7989)
- **Absolute error:** 6.728 x 10^-6
- **Relative error:** 8.42 ppm
- **CODATA alpha^-1 uncertainty:** 1.5 x 10^-10 relative
- **This claim is 56,000x less precise than CODATA.**

For "zero free parameters" to hold, the formula must match r_exact to at least the precision of CODATA (10+ digits). It matches 4.

---

## STEP 2: DISPROOF TEST

What would kill this claim?

1. **Match precision worse than ~1e-8:** YES. Match is 6.7 x 10^-6. KILLED.
2. **Another Lie algebra closer:** No. E7 is the closest among all tested algebras.
3. **Structureless fractions beat it:** YES. 147/184 = 0.79891304... has diff 6.45 x 10^-6, which is CLOSER than arctan(sqrt(19/18)). A fraction with no algebraic meaning outperforms the E7 formula.

**Disproof conditions (1) and (3) are met.**

---

## STEP 3: GROUND TRUTH

Computed with mpmath at 80 decimal places:

```
arctan(sqrt(19/18)) = 0.7989133226325875209261426218941010827757184842238165658
r_exact (given)     = 0.79890659495533744806
```

Digit-by-digit comparison:
```
claim: 0.7989|1332263258...
exact: 0.7989|0659495534...
             ^
             MISMATCH at 5th decimal digit
```

Matching decimal digits: 4 (the string "0.7989")

---

## STEP 4: ADVERSARIAL

arctan(sqrt(dim/roots)) = arctan(sqrt((h+1)/h)) for all exceptional and classical Lie algebras:

| Algebra | dim | roots | h (Coxeter) | arctan(sqrt((h+1)/h)) | diff from r |
|---------|-----|-------|-------------|----------------------|-------------|
| G2      | 14  | 12    | 6           | 0.82390              | 2.50 x 10^-2 |
| F4      | 52  | 48    | 12          | 0.80540              | 6.50 x 10^-3 |
| E6      | 78  | 72    | 12          | 0.80540              | 6.50 x 10^-3 |
| **E7**  | **133** | **126** | **18** | **0.79891**          | **6.73 x 10^-6** |
| E8      | 248 | 240   | 30          | 0.79360              | 5.31 x 10^-3 |
| A2=su3  | 8   | 6     | 3           | 0.85707              | 5.82 x 10^-2 |
| A4=su5  | 24  | 20    | 5           | 0.83092              | 3.20 x 10^-2 |
| B4=so9  | 36  | 32    | 8           | 0.81483              | 1.59 x 10^-2 |
| D5=so10 | 45  | 40    | 8           | 0.81483              | 1.59 x 10^-2 |
| D6=so12 | 66  | 60    | 10          | 0.80922              | 1.03 x 10^-2 |

E7 is the closest by a wide margin (~1000x better than E6/F4). This is the strongest point in the claim's favor. However, 6.73 x 10^-6 precision does not constitute a derivation.

Note: F4 and E6 share the same Coxeter number h=12, so they give identical results. The formula only depends on h.

---

## STEP 5: EDGE CASES

Using different E7 counting conventions:

| Formula | Value | diff from r |
|---------|-------|-------------|
| dim/roots = 133/126 | 0.79891 | 6.73 x 10^-6 |
| dim/pos_roots = 133/63 | 0.96800 | 0.169 |
| roots/rank = 126/7 | 1.33932 | 0.540 |
| dim/rank = 133/7 | 1.34528 | 0.546 |

Only dim/roots works. The formula is fragile: changing the counting convention destroys it. A real derivation should be robust to equivalent formulations.

---

## STEP 6: OPPOSITE CLAIM

Assume r is NOT arctan(sqrt(19/18)).

Residual: r_claim - r_exact = +6.72768 x 10^-6

Checked against: 1/(2 pi 137^2), alpha/pi, 1/(18 x 19 x pi), alpha^2, and other combinations. None yield clean ratios. The residual is not recognizable as any known constant.

**The residual is noise, not signal.**

---

## STEP 7: ABLATION

Which component does the work?

- **Raw 19/18 = 1.0556:** diff from r = 0.257. Terrible.
- **sqrt(19/18) = 1.0274:** diff from r = 0.228. Terrible.
- **arctan(sqrt(19/18)) = 0.79891:** diff from r = 6.7 x 10^-6. The only good one.

The real question is: how close is tan(r_exact)^2 to 19/18?

```
tan(r_exact)^2 = 1.05552713981449816...
19/18          = 1.05555555555555556...
gap            = 2.84 x 10^-5
```

All three operations (ratio, sqrt, arctan) are needed. But the "compression" from x^2 domain (2.84e-5 gap) to angle domain (6.73e-6 gap) is just the derivative of arctan(sqrt(x)), not deep structure. The function is monotone and smooth near x=1; any input close to tan(r)^2 will produce output close to r.

---

## STEP 8: NEXT BEST

**Competing formulas at similar or better precision:**

| Formula | Value | diff from r | ppm |
|---------|-------|-------------|-----|
| 147/184 (plain fraction) | 0.79891304... | 6.45 x 10^-6 | 8.07 |
| arctan(sqrt(19/18)) | 0.79891332... | 6.73 x 10^-6 | 8.42 |

147/184 is a structureless fraction that BEATS the E7 formula.

Within the arctan(sqrt(a/b)) family for a,b <= 100, only multiples of 19/18 appear within 1e-4. So E7 is the best Lie algebra, but 147/184 shows the precision level is not discriminating.

**The E7 formula is not uniquely good. A random fraction outperforms it.**

---

## STEP 9: REGRESSION

- **sqrt(2/pi) kill:** sqrt(2/pi) = 0.79788..., diff = 1.022 x 10^-3 (1279 ppm). That was killed.
- **arctan(sqrt(19/18)):** diff = 6.73 x 10^-6 (8.4 ppm). This is 152x better than sqrt(2/pi).

Does the new claim contradict the sqrt(2/pi) kill? No -- they are independent claims. Both can be wrong. sqrt(2/pi) was killed at ~1000 ppm. This new claim is at ~8 ppm. Better, but 8 ppm is still 56,000x worse than CODATA.

No previously proven results are contradicted.

---

## STEP 10: VERDICT

```
============================================================
VERDICT: KILLED
============================================================
```

**What's real:**
1. 133/126 = 19/18 = (h+1)/h exactly. The E7 Coxeter number identification is arithmetically valid.
2. E7 gives the closest match among all exceptional Lie algebras by ~1000x.
3. 152x better than the previously killed sqrt(2/pi).

**What kills it:**
1. Match precision is 8.4 ppm (4 decimal places). For "zero free parameters," we need 10+.
2. The claim is 56,000x less precise than CODATA.
3. A structureless fraction 147/184 beats it (8.07 ppm < 8.42 ppm).
4. arctan(sqrt(dim/roots)) has no foundation in representation theory, gauge theory, or any known physics formalism.
5. The residual 6.73 x 10^-6 is not recognizable as any known constant.
6. The formula is fragile -- only dim/roots works, not pos_roots, not rank-based variants.
7. The claim reduces to arctan(sqrt((h+1)/h)) for Coxeter number h=18. This is "h is special," not "E7 topology."

**Classification:** Suggestive correlation, not derivation. The E7 proximity is interesting but the wrapping function is ad hoc and the precision is insufficient by 4-5 orders of magnitude.

---

## ALTERNATIVE PATH

The structural reduction found during this audit is itself interesting:

```
For all simply-laced Lie algebras:
  dim/roots = (h+1)/h    where h = Coxeter number
```

This means:
- The claim is really about the Coxeter number h = 18, not about "E7 topology"
- E7 has the largest Coxeter number among the exceptionals before E8 (h=30)
- h = 18 gives the closest match, with h=17 and h=19 being ~100x worse

If E7 genuinely determines alpha, the relationship should emerge through:

1. **Casimir operators** of E7 representations (known eigenvalues in closed form)
2. **Anomaly cancellation** conditions in E7 gauge theory
3. **Root lattice geometry** -- the Coxeter number h=18 DOES appear naturally in lattice theta functions, heat kernels on E7 root lattices, and Weyl character denominators
4. **Weyl group** order |W(E7)| = 2,903,040 or invariant polynomial degrees
5. **Index of embedding** of the Standard Model group in E7

The Coxeter number h=18 is the right integer. The wrapping function arctan(sqrt((h+1)/h)) is the wrong delivery mechanism. If alpha comes from E7, it will come through a formula where h=18 enters via lattice sums, Casimir ratios, or anomaly polynomials -- not arbitrary transcendental wrapping.

---

*Audit complete. No shortcuts. No excitement. Just truth.*
