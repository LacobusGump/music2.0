# The Paper
# March 26, 2026

---

## What it would prove

**Theorem.** Every nontrivial zero of ζ(s) has real part 1/2.

## What the proof would need (the architecture)

The proof constructs a self-adjoint operator whose spectral theory forces the conclusion. Not by guessing an operator and checking its eigenvalues (that failed five times). By building the operator FROM the three rigidity constraints, in a way that makes self-adjointness EQUIVALENT to RH.

### The three constraints

**C1. Euler product.** ζ(s) = Π_p (1-p^{-s})^{-1} for Re(s) > 1. This determines ζ everywhere by analytic continuation. The value of ζ at any point is uniquely fixed by the primes.

**C2. Functional equation.** ξ(s) = ξ(1-s) where ξ(s) = (1/2)s(s-1)π^{-s/2}Γ(s/2)ζ(s). This is not independent of C1 — it's a consequence — but it manifests the symmetry s ↔ 1-s geometrically.

**C3. Growth.** ξ is entire of order 1. This controls the zero density: N(T) ~ (T/2π)ln(T/2πe).

### Why these three together should suffice

Functions satisfying C2 + C3 alone CAN have off-line zeros (Epstein zeta functions). Functions satisfying C1 + C3 alone don't have a functional equation and aren't constrained. Functions satisfying C1 + C2 automatically satisfy C3 (the Euler product determines the growth).

So the real content is: C1 alone (the Euler product) determines ξ completely, and ξ happens to satisfy C2 and C3. The question: does the specific analytic function defined by C1 have all zeros on σ = 1/2?

The Euler product's specific content: the factors (1-p^{-s})^{-1} are INDEPENDENT (distinct primes), MULTIPLICATIVE (product not sum), and ORDERED (by the specific sequence 2, 3, 5, 7, ...). No other sequence of factors gives the same function.

### The operator

The construction that HAS NOT BEEN TRIED (and might work):

**Step 1.** Define the Hilbert space H = L²(ℝ⁺, dx/x) (multiplicative measure — the natural home of the Euler product).

**Step 2.** Define the operator A by its action on Mellin transforms:

(Af)^∧(s) = ξ(s)/ξ(1-s) · f̂(s)

On the critical line (s = 1/2+it): ξ(s)/ξ(1-s) = 1 (by C2). So A = identity on the critical line.

Off the critical line: ξ(s)/ξ(1-s) = χ(s) (the functional equation factor). This is a KNOWN function (ratio of Gamma factors × power of π). It's not 1 for σ ≠ 1/2.

**Step 3.** The operator A is unitary iff ξ(s)/ξ(1-s) has modulus 1 for all s on the line of evaluation. On the critical line: yes (|χ(1/2+it)| = 1). Off the critical line: |χ(σ+it)| ≠ 1. So A is unitary specifically on the critical line.

**Step 4.** The zeros of ζ appear as the points where A becomes singular (ξ vanishes in the numerator or denominator). On the critical line, both ξ(s) and ξ(1-s) vanish simultaneously (because s and 1-s have the same zeros on the line), so the singularity is removable — A stays well-defined.

Off the critical line: ξ(s) vanishes but ξ(1-s) doesn't (they're at different points). So A has a genuine zero, breaking unitarity.

**Step 5.** The CLAIM: the Euler product structure forces A to be unitary on its natural domain. An off-line zero would break unitarity, contradicting the Euler product's multiplicative structure.

### Where this argument fails (currently)

The ratio ξ(s)/ξ(1-s) = χ(s) is determined by Gamma functions, not by the Euler product directly. The Euler product enters through ζ, but χ(s) is the SAME regardless of whether ζ has off-line zeros. So A's definition doesn't actually use the Euler product in a way that could detect off-line zeros.

The operator A is just multiplication by χ(s) in Mellin space, which is independent of the zero locations. The zeros of ζ create poles/zeros in ξ, but these cancel in the ratio ξ/ξ(1-s) by the functional equation.

So this operator is NOT the answer. It's the functional equation in operator language, and the functional equation doesn't constrain zero locations.

### What the RIGHT operator would need

The operator must involve the EULER PRODUCT DIRECTLY — not through ζ (which is the whole function including zeros) but through the individual prime factors.

Define: for each prime p, the local operator A_p on H:

(A_p f)^∧(s) = (1-p^{-s})/(1-p^{-(1-s)}) · f̂(s)

This is the RATIO of the p-th Euler factor at s and 1-s.

The full operator: A = Π_p A_p (product over all primes).

Formally: A = ζ(1-s)/ζ(s) · (Gamma ratio). But the product Π A_p doesn't converge in the strip — this is the same Euler product divergence problem.

### The REAL gap

The product Π_p A_p converges for Re(s) > 1 (where the Euler product converges) and can be analytically continued. But in the strip 0 < Re(s) < 1, the product must be REGULARIZED.

The regularization choice IS the analytic continuation of ζ. And the analytic continuation is what determines the zero locations. So we're back to: the operator is ζ itself, and asking whether it has off-line zeros is asking about ζ.

## The actual theorem (what it really looks like)

The theorem doesn't construct an operator. It constructs an INEQUALITY.

**Theorem (shape).** Let f be a Schwartz function with f̂ ≥ 0 and f̂ supported in [-Δ, Δ]. Let P_f = Σ_n Λ(n)/√n · f̂(ln n) (the prime side). Let Z_f = Σ_ρ |ĝ(ρ-1/2)|² (the zero side, where g is determined by f). Let S_f be the smooth/Gamma contribution. Then:

Z_f = P_f + S_f

and there exists a specific sequence of test functions {f_n} (determined by the EXTREMAL PROBLEM of minimizing P_f subject to Z_f = 1, or similar) such that:

- P_{f_n} + S_{f_n} ≥ 0 for all n (because Λ ≥ 0 and f̂ ≥ 0)
- Z_{f_n} ≥ 0 trivially (sum of |·|²)
- The EQUALITY P + S = Z forces: if any ρ has Re(ρ) ≠ 1/2, then for some n, Z_{f_n} < P_{f_n} + S_{f_n}

The third point is where the actual mathematics lives. It requires showing that the off-line zero contributions to Z create a DEFICIT that the prime side can't compensate.

The per-zero deficit is proven (our result): for f̂ ≥ 0, Re ĝ(a+iγ) < ĝ(iγ) when a ≠ 0.

The obstacle is the counting: a quartet uses 4 zero slots while contributing 4 Re ĝ(...), and the extra 2 slots can compensate the per-zero deficit.

The theorem that would close this: a SHARPENED deficit inequality that accounts for the counting, using the specific structure of Λ(n). Not just Λ ≥ 0, but the specific values: Λ(p^k) = ln(p), and the specific distribution of primes (PNT + error term).

## What the paper actually says (the honest version)

The paper does not prove RH. It does:

1. Identify θ_p = -Im log(1-p^{-s}) as the primitive object connecting Euler product, Hadamard product, functional equation, and Weil positivity.

2. Prove D_on = 2π (per-zero curvature constant for on-line zeros).

3. Prove the per-zero deficit: h(iγ) - Re h(a+iγ) > 0 for ĥ ≥ 0 (external inequality from Fourier analysis).

4. Demonstrate direct quantization (15 primes → 1000 zeros at 4.5% accuracy, zero parameters, six kill shots).

5. Show why single test functions are insufficient (quartet counting absorbs the deficit).

6. Map every approach (curvature, scattering, Weil, Li, Nyman-Beurling, de Branges) to the same quantitative gap.

7. State precisely what the closing theorem would need: a sharpened deficit inequality that uses the specific distribution of primes, not just Λ ≥ 0.

## The one sentence

RH would follow from a proof that the Euler product's multiplicative structure — the independence and specific distribution of prime factors — creates a phase rigidity that prevents the completed zeta function from vanishing off the critical line: not by making off-line zeros improbable, but by making them analytically impossible through the overconstrained relationship between the multiplicative input (primes) and the additive output (zeros).
