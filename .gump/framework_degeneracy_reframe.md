# Framework Reframe: Degeneracy, Not Primes

**Date:** March 24, 2026
**Origin:** Grok review → collaborative hardening → this document

---

## The Rotation

**Old claim:** Landauer cost decomposes over primes. Primes are cost carriers.
**New claim:** Minimum irreversible cost = kT × conditional entropy of lost input structure.
**What primes actually are:** Zero-degeneracy endpoints, not cost carriers.

---

## One-Line Final Theory

For any deterministic computation f that outputs only y while discarding input information, the minimal expected thermodynamic cost is:

  E_min(y) ≥ kT · H(X | f(X)=y)

**Interpretation:** The energy tax is kT times the remaining uncertainty about which preimage (micro-history) produced the observed macro-output.

---

## Specialization to Multiplication

For f(x,y) = xy = n:

  F(n) = {(x,y) : xy = n}
  |F(n)| ~ d(n)/2  (half the divisor count, since order matters)

So:

  E_min(n) ≥ kT · ln|F(n)| ≈ kT · ln(d(n))

**Key insight:** Structure dominates size. Two numbers with the same bit-length but different divisor counts have different fundamental limits.

---

## Why Primes Look Special

If n = p (prime): only one factorization (1 × p). Degeneracy = 1. ln(1) = 0.

Primes are zero-degeneracy states — no ambiguity about how they were constructed.
Highly composite numbers (like 60 = 2²×3×5, d(60)=12) have high degeneracy → higher minimum cost.

---

## Hardened Predictions (Falsifiable)

### 1. Structure vs. Size
For two numbers with comparable bit length, the maximum possible bound is higher for high-d(n) composites than for primes. Actual realized cost tracks the conditional entropy of the input distribution, not raw d(n).

### 2. Operation Dependence
- Addition (x+y=n): degeneracy ~n/2 → potentially higher conditional-entropy bound
- Multiplication (xy=n): degeneracy ~d(n) ≪ n → structurally different fundamental limit
- Different operations have structurally different erasure floors.

### 3. Algorithm Independence (with caveat)
No deterministic algorithm that fully discards inputs can beat the conditional-entropy bound in the quasistatic limit. Fast or noisy algorithms pay extra dissipative costs beyond this floor (finite-time corrections from stochastic thermodynamics).

---

## Honest Remaining Limits

- **Distribution dependence:** Uniform gives clean ln(d(n)). Real multipliers have lower effective H.
- **Output-only requirement:** If inputs are retained, cost → 0 via reversible uncomputation.
- **Physical embedding:** Discrete→continuous mapping is nontrivial but standard. Bound holds in abstract resource theory.
- **Norton/Bennett debates:** Addressed by conditional-entropy formulation (widely accepted).
- **Practical irrelevance:** Landauer-scale costs negligible vs. switching/leakage in real computers. Framework is for fundamental limits.
- **Extensions:** Generalizes to quantum conditional entropy, nonequilibrium. We stay classical here.

---

## Connection to the Original Paper

The Environment Rigidity Theorem (Theorem 3) still holds exactly as proven. What changes:

1. The Euler product remains a valid decomposition of ln(n) into prime contributions
2. The Stinespring environment still factors as ⊗_p (C^p)^{v_p(n)}
3. But the PHYSICAL interpretation shifts: the decomposition describes the structure of the quantum channel, not a physical energy cost per prime

The paper's math is untouched. The interpretation gets sharper and more honest.

---

## The Proof Sketch

### Step 1 — Reversible embedding
(x, y, 0) → (x, y, xy) — no cost (Toffoli-style)

### Step 2 — Output-only requirement
(x, y, xy) → xy — this is many-to-one

### Step 3 — Information loss
All pairs in F(n) map to same output. Minimum information destroyed: H = ln|F(n)|

### Step 4 — Apply Landauer
E ≥ kT · ln|F(n)|

Done. Information-theoretic, not algorithm-dependent.

---

## ζ Connection (Tight Version)

Σ d(n) · n^{-β} = ζ(β)²

- ζ → counts numbers
- ζ² → counts factorizations (degeneracy)

The framework = thermodynamics over multiplicative microstates.
