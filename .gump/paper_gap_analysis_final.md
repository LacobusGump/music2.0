# Paper Gap Analysis — Final (March 24, 2026)

Critical review identified 4 structural faults in the proof chain. This document maps each fault, assesses severity, and outlines the fix.

---

## Fault 1: σ_p → Φ_p Bridge (CRITICAL)

**The claim:** σ_p on A induces, by duality with respect to KMS, a CPTP channel Φ_p on B_p ≅ C^p.

**The problem:** σ_p maps into the corner e_p A e_p, not back to B_p. The dual map is:
  Tr[Φ_p(ρ) · b] = Tr[ρ · σ_p(b)]

For b = P_0: σ_p(P_0) = e_p, so Tr[Φ_p(ρ) · P_0] = Tr[ρ · e_p].
For b = P_j (j≠0): σ_p(P_j) = 0, so Tr[Φ_p(ρ) · P_j] = 0.

Trace preservation requires Tr[Φ_p(ρ)] = 1, which means Tr[ρ · e_p] must equal 1.
But φ_β(e_p) = p^{1-β} ≠ 1 for β ≠ 1.

**Severity:** This is where the channel is born. Without this, the paper defines Φ_p by hand.

**Fix options:**
(a) Normalize: Φ_p(ρ)(b) = Tr[ρ · σ_p(b)] / Tr[ρ · σ_p(1)] — but this makes the channel input-dependent.
(b) Work in a representation where e_p is absorbed — need to specify which.
(c) **Define Φ_p directly as the complete erasure channel on C^p, then argue that it is the canonical channel CORRESPONDING to σ_p rather than derived from it.** This is honest and the channel is still well-defined.

**Recommended:** Option (c). The paper becomes "motivated by Bost-Connes" rather than "derived from Bost-Connes."

---

## Fault 2: Automorphism Lemma (BROKEN)

**The claim:** σ_p restricted to B_q (q≠p, coprime) is a *-automorphism of B_q.

**The problem:** σ_p(e(k/q)) = e((pk mod q)/q) · e_p. This lands in B_q · e_p, not in B_q.

**Severity:** The tensor factorization of environments depends on this. If σ_p can't selectively erase B_p while preserving B_q, the independence argument breaks.

**Fix options:**
(a) Work in a representation where e_p = 1. But no such representation exists for β > 1.
(b) Show that the e_p factor is "harmless" in some precise sense — i.e., that the induced action on states of B_q is still a permutation. This might work: since e_p commutes with B_q in certain representations, the e_p factor might be absorbable into the normalization.
(c) **Abandon the automorphism lemma. Prove the channel factorization directly from the Kraus operators + CRT, without routing through σ_p.**

**Recommended:** Option (c). The Kraus operator factorization IS provable directly.

---

## Fault 3: Channel Factorization (TOO QUICK)

**The claim:** Φ_{pq} = Φ_p ⊗ Φ_q on B_{pq} ≅ B_p ⊗ B_q.

**The problem:** The proof says "both send everything to 1, so they're equal." That's insufficient.

**The actual proof (which works):**
Under CRT: Z/pqZ ≅ Z/pZ × Z/qZ, so C^{pq} ≅ C^p ⊗ C^q.
The basis identification: |k⟩_{pq} ↔ |k mod p⟩_p ⊗ |k mod q⟩_q.
In particular: |0⟩_{pq} ↔ |0⟩_p ⊗ |0⟩_q.

Kraus operators of Φ_{pq}: K_j = |0⟩⟨j|_{pq} for j = 0,...,pq-1.
Under CRT, j ↔ (a,b) where a = j mod p, b = j mod q.
So: K_{(a,b)} = |0⟩_{pq}⟨(a,b)|_{pq} = (|0⟩_p ⊗ |0⟩_q)(⟨a|_p ⊗ ⟨b|_q) = K_a^{(p)} ⊗ K_b^{(q)}.

Therefore: Φ_{pq}(ρ) = Σ_{a,b} (K_a^{(p)} ⊗ K_b^{(q)}) ρ (K_a^{(p)} ⊗ K_b^{(q)})* = (Φ_p ⊗ Φ_q)(ρ). □

**Severity:** Medium. The result is TRUE and provable. The paper just needs to write the proof properly.

**Fix:** Replace the hand-wave with the explicit Kraus factorization proof above.

---

## Fault 4: Repeated-Prime Tensor Uniqueness (OVERCLAIMED)

**The claim:** Minimal environment for σ_{p^a} has dimension p^a and factors uniquely as (C^p)^{⊗a}.

**The problem:**
- Z/p²Z ≇ Z/pZ × Z/pZ (CRT requires coprimality)
- C^{p^a} has MANY tensor decompositions (it's just a vector space)
- The "unique" factorization claim needs additional structure beyond dimension counting

**What IS true:**
- Kraus rank of Φ_{p^a} = p^a (dimension of minimal environment) — this is just a fact about complete erasure on C^{p^a}
- One CAN decompose C^{p^a} = C^p ⊗ C^p ⊗ ... ⊗ C^p (a times)
- The Bost-Connes semigroup DOES give σ_{p^a} = σ_p^a (composition), suggesting iterated erasure

**What is NOT proved:**
- That the tensor decomposition is unique or canonical
- That each factor corresponds to an "independent" erasure event
- That the composition σ_p ∘ σ_p gives a tensor product on environments (it gives an environment of dim ≤ p², but the minimum for the composition could equal the minimum for the composed channel, which is p²)

**Fix:** Weaken the claim. State:
- Dimension of minimal environment = n (provable, Kraus rank)
- For squarefree n: unique tensor factorization via CRT (provable)
- For general n: a natural tensor factorization exists corresponding to iterated composition, but uniqueness is not claimed

---

## Summary: What Survives

| Component | Status |
|-----------|--------|
| Φ_p defined directly on C^p | ✅ Solid |
| Stinespring dilation | ✅ Solid |
| Landauer bound (Thm 2) | ✅ Solid |
| KMS saturation | ✅ Solid (for the directly-defined channel) |
| Coprime channel factorization | ✅ Provable via Kraus + CRT |
| Euler product interpretation | ✅ Follows from above |
| σ_p → Φ_p derivation | ❌ Gap (e_p normalization) |
| Automorphism lemma | ❌ Broken as stated |
| Repeated-prime uniqueness | ⚠️ Overclaimed |
| Env Rigidity (headline) | ⚠️ Needs weakening for non-squarefree case |

## Recommended Restructure

1. Define channels Φ_n directly as complete erasure on C^n
2. Prove Stinespring, Landauer, CRT factorization cleanly
3. State Environment Rigidity for squarefree n (where CRT gives honest tensor factorization)
4. For general n, state dimension = n and natural (not unique) tensor decomposition
5. Connect to Bost-Connes in a "Motivation and Context" section — explain that σ_p IS the algebraic shadow of Φ_p, but the derivation requires careful handling of the e_p projection
6. Be honest about what the paper proves vs motivates
