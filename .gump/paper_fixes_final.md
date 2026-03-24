# Paper Fixes — Final (ChatGPT polished versions)

These are the clean, ready-to-insert versions. Drop them in directly.

---

## Fix 1: Tightened Section 3.2 (main text)

Replace the current detailed construction of Φ_p with:

"The *-endomorphism σ_p on A induces, by restriction and duality with respect to the KMS state φ_β, a completely positive trace-preserving (CPTP) map Φ_p on the state space of B_p ≅ ℂ^p. The construction is standard (details appear in Appendix A). The map Φ_p has the following key properties:

(i) Its Kraus operators are K_j = |0⟩⟨j| for j = 0, …, p−1;
(ii) Φ_p maps every state to |0⟩⟨0| (complete erasure of the coset label mod p);
(iii) Φ_p is CPTP, since ∑_j K_j* K_j = ∑_j |j⟩⟨j| = I_p."

---

## Fix 2: Connecting ranks (add after the Kraus-rank sentence)

"The Choi rank, the Kraus rank (i.e., the minimal number of linearly independent Kraus operators), and the minimal environment dimension in a Stinespring dilation are equivalent characterizations of the same quantity (Paulsen 2002, Chapter 8; Wilde 2017, §5.2). We use these notions interchangeably throughout."

---

## Fix 3: New Subsection 6.3 – Concrete Example for n = 6

#### 6.3 Concrete Example: n = 6

Let n = 6 = 2 × 3. We trace the full construction explicitly.

**The algebra.**
B_6 = C*{e(k/6) : k = 0, …, 5} ≅ ℂ^6. The six orthonormal basis states |k⟩ correspond to the cosets of ℤ/6ℤ in ℤ.

**The factorization.**
By the Chinese Remainder Theorem, ℤ/6ℤ ≅ ℤ/2ℤ × ℤ/3ℤ. The six states therefore factor as tensor products according to the following table:

| k (mod 6) | k mod 2 | k mod 3 | Tensor label |
|-----------|---------|---------|-------------|
| 0 | 0 | 0 | |0⟩₂ ⊗ |0⟩₃ |
| 1 | 1 | 1 | |1⟩₂ ⊗ |1⟩₃ |
| 2 | 0 | 2 | |0⟩₂ ⊗ |2⟩₃ |
| 3 | 1 | 0 | |1⟩₂ ⊗ |0⟩₃ |
| 4 | 0 | 1 | |0⟩₂ ⊗ |1⟩₃ |
| 5 | 1 | 2 | |1⟩₂ ⊗ |2⟩₃ |

**The endomorphism σ_6.**
σ_6(e(k/6)) = e(6k/6) = e(k) = 1 for all k. Thus σ_6 erases all coset information: every basis state is mapped to the unit.

**The induced channel Φ_6.**
The dual CPTP map Φ_6 : S(B_6) → S(B_6) has Kraus operators
K_j = |0⟩⟨j| for j = 0, …, 5.
It therefore has Kraus rank 6 and completely erases the input state to |0⟩⟨0|.

**Stinespring dilation.**
The minimal environment is H_E ≅ ℂ^6. A minimal dilation unitary U acts as
U |j⟩_S |0⟩_E = |0⟩_S |j⟩_E,
which simply swaps the coset label into the environment.

**Tensor factorization of the environment.**
By the Automorphism Lemma together with the Chinese Remainder Theorem, the single endomorphism σ_6 factors through the prime-power components:

- σ_2 erases the ℤ/2ℤ label (1 bit) while permuting the ℤ/3ℤ factor,
- σ_3 erases the ℤ/3ℤ label (1 trit) while permuting the ℤ/2ℤ factor.

Correspondingly, the minimal environment factors as
ℂ^6 ≅ ℂ^2 ⊗ ℂ^3,
where the ℂ^2 factor absorbs the bit erased by σ_2 and the ℂ^3 factor absorbs the trit erased by σ_3.

**Landauer cost at temperature T.**
- Erasing the mod-2 coset label costs kT ln 2,
- Erasing the mod-3 coset label costs kT ln 3.
The total thermodynamic cost is therefore
kT (ln 2 + ln 3) = kT ln 6.

**Euler-product structure.**
The contribution of n = 6 to the partition function is
6^{-β} = 2^{-β} · 3^{-β}.
This factorization of the Boltzmann weight mirrors the independent Landauer costs and the tensor product decomposition of the environment. In bookkeeping terms:

| Line item | Prime | Erasure | Thermodynamic cost | Environment subspace |
|-----------|-------|---------|--------------------|---------------------|
| 1 | p=2 | 1 bit (which half?) | kT ln 2 | ℂ² |
| 2 | p=3 | 1 trit (which third?) | kT ln 3 | ℂ³ |
| **Total** | | **1 bit + 1 trit** | **kT ln 6** | **ℂ² ⊗ ℂ³ = ℂ⁶** |

The Fundamental Theorem of Arithmetic (unique prime factorization 6 = 2 × 3) thus manifests directly as both (i) the tensor factorization of the minimal erasure environment and (ii) the additive decomposition of the total Landauer cost.

*This explicit n = 6 case generalizes immediately to arbitrary n = ∏_p p^{a_p} via Theorem 3.*
