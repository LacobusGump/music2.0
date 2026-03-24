# Paper Fixes — Round 3 (Final polish)

## Fix 1: Tighten Section 3.2

Move the detailed GNS construction to Appendix A. In the main text, replace with:

"The *-endomorphism σ_p on A induces, by restriction and duality with respect to the KMS state φ_β, a completely positive trace-preserving (CPTP) map Φ_p on the state space of B_p ≅ C^p. The construction is standard; details are in Appendix A. The key properties are:

(i) Φ_p has Kraus operators K_j = |0⟩⟨j| for j = 0, ..., p-1
(ii) Φ_p maps every state to |0⟩⟨0| (total erasure of coset information)
(iii) Φ_p is CPTP: Σ_j K_j* K_j = Σ_j |j⟩⟨j| = I_p"

## Fix 2: Connect Choi rank ↔ Kraus rank ↔ environment dimension

Add one sentence after the Kraus rank computation:

"The Choi rank, the Kraus rank (minimum number of linearly independent Kraus operators), and the minimal Stinespring dilation dimension are equivalent characterizations of the same quantity (see Paulsen 2002, Ch. 8, or Wilde 2017, §5.2). We use them interchangeably."

## Fix 3: Concrete example — n = 6

Add as a new subsection (Section 6.3: Example) after the main theorem:

---

### 6.3 Concrete Example: n = 6

Let n = 6 = 2 × 3. We trace the full construction.

**The algebra.** B_6 = C*{e(k/6) : k = 0,...,5} ≅ C^6. The six basis states correspond to the cosets of Z/6Z.

**The factorization.** By CRT, Z/6Z ≅ Z/2Z × Z/3Z. The six states decompose as:

| k (mod 6) | k mod 2 | k mod 3 | Tensor label |
|-----------|---------|---------|-------------|
| 0 | 0 | 0 | \|0⟩ ⊗ \|0⟩ |
| 1 | 1 | 1 | \|1⟩ ⊗ \|1⟩ |
| 2 | 0 | 2 | \|0⟩ ⊗ \|2⟩ |
| 3 | 1 | 0 | \|1⟩ ⊗ \|0⟩ |
| 4 | 0 | 1 | \|0⟩ ⊗ \|1⟩ |
| 5 | 1 | 2 | \|1⟩ ⊗ \|2⟩ |

**The endomorphism σ_6.** Acts as e(k/6) ↦ e(6k/6) = e(k) = e(0) = 1 for all k. Total erasure: all six states collapse to one.

**The channel Φ_6.** Has Kraus operators K_j = |0⟩⟨j| for j = 0,...,5. Kraus rank = 6.

**The Stinespring dilation.** Minimal environment: H_E = C^6. The unitary:

U|j⟩_S |0⟩_E = |0⟩_S |j⟩_E

swaps the coset label into the environment.

**The tensor factorization.** By the Automorphism Lemma + CRT:

- σ_2 erases the Z/2Z part (collapses 2 cosets to 1) while permuting the Z/3Z part
- σ_3 erases the Z/3Z part (collapses 3 cosets to 1) while permuting the Z/2Z part

The environment factors: C^6 = C^2 ⊗ C^3

- C^2 absorbs the bit erased by σ_2 (which coset mod 2?)
- C^3 absorbs the trit erased by σ_3 (which coset mod 3?)

**The Landauer cost.** At temperature T:

- Erasing the 2-coset label: kT · ln(2)
- Erasing the 3-coset label: kT · ln(3)
- Total: kT · (ln 2 + ln 3) = kT · ln 6

**The Euler product factor.** The contribution of n = 6 to the partition function is:

6^{-β} = 2^{-β} · 3^{-β}

The Boltzmann weight of the composite state factorizes over primes, corresponding to the independent Landauer costs. The "receipt" for processing n = 6:

| Line item | Prime | Erasure | Cost | Environment |
|-----------|-------|---------|------|------------|
| 1 | p = 2 | 1 bit (which half of Z/6Z?) | kT ln 2 | C^2 |
| 2 | p = 3 | 1 trit (which third of Z/6Z?) | kT ln 3 | C^3 |
| **Total** | | **1 bit + 1 trit** | **kT ln 6** | **C^2 ⊗ C^3 = C^6** |

The fundamental theorem of arithmetic (6 = 2 × 3) appears as the tensor factorization of the minimal erasure environment (C^6 = C^2 ⊗ C^3) and the additive decomposition of the Landauer cost (ln 6 = ln 2 + ln 3).

---

*This example generalizes immediately to any n = ∏ p_i^{a_i} by Theorem 3.*
