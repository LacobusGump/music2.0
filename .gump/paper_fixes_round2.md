# Paper Fixes — Round 2 (ChatGPT review)

## Fix 1: Cite Paulsen for tensor factorization of dilations

Add to the tensor factorization proof (Section 6, Step 3):

"The fact that the minimal Stinespring dilation of a tensor product of channels equals the tensor product of their minimal dilations is a standard result in quantum information theory; see Paulsen, *Completely Bounded Maps and Operator Algebras* (Cambridge, 2002), Theorem 8.1, or Wilde, *Quantum Information Theory* (Cambridge, 2nd ed., 2017), Section 5.2.2."

## Fix 2: Choi rank forces independence for prime powers

Add after the prime powers argument (Section 6, Step 4):

"The Choi rank of σ_p^a restricted to B_{p^a} equals p^a. Since the Choi rank is the minimum number of linearly independent Kraus operators, and the minimal dilation environment dimension equals the Choi rank (Stinespring), the environment C^{p^a} cannot be compressed to a smaller space without losing the ability to implement the channel. In particular, no environment register can be 'reused' across successive applications of σ_p: each application erases one independent coset label, contributing an independent C^p factor to the environment. This is not a physical argument — it follows from the algebraic fact that the Choi rank of the a-fold composition is p^a, not p. The information destroyed by the k-th application of σ_p is linearly independent of the information destroyed by the j-th application for j ≠ k."

## Fix 3: Tighten Φ_{pq} = Φ_p ⊗ Φ_q

Replace the assertion with an explicit proof:

"**Proposition.** For distinct primes p and q, the channel Φ_{pq} on B_{pq} equals Φ_p ⊗ Φ_q under the identification B_{pq} ≅ B_p ⊗ B_q.

*Proof.* By the Chinese Remainder Theorem, Z/pqZ ≅ Z/pZ × Z/qZ (as rings, since gcd(p,q) = 1). This induces an isomorphism of the function algebras:

B_{pq} = C[Z/pqZ] ≅ C[Z/pZ] ⊗ C[Z/qZ] = B_p ⊗ B_q

Under this isomorphism, the generator e(k/pq) maps to e(k_p/p) ⊗ e(k_q/q), where k_p = k mod p and k_q = k mod q.

The endomorphism σ_{pq} acts as σ_{pq}(e(k/pq)) = e(pqk/pq) = e(k) = e(0) = 1 for all k (since pqk ≡ 0 mod pq). This annihilates B_{pq} entirely.

Now consider σ_p ⊗ σ_q acting on B_p ⊗ B_q:
- σ_p annihilates B_p: σ_p(e(k_p/p)) = e(pk_p/p) = e(k_p) = 1 for all k_p
- σ_q annihilates B_q: σ_q(e(k_q/q)) = e(qk_q/q) = e(k_q) = 1 for all k_q
- So (σ_p ⊗ σ_q)(e(k_p/p) ⊗ e(k_q/q)) = 1 ⊗ 1 = 1

Both Φ_{pq} and Φ_p ⊗ Φ_q send every basis element to 1. Since they agree on a basis and are linear, they are equal. □

*Note:* This factorization is specific to the Bost-Connes algebra. It fails for channels on generic C*-algebras where the subsystems do not decompose as a tensor product. The CRT provides the tensor decomposition of the algebra; the Automorphism Lemma ensures the channels respect it."

## Additional reference to add:

Paulsen, V. (2002). *Completely Bounded Maps and Operator Algebras*. Cambridge University Press.
Wilde, M.M. (2017). *Quantum Information Theory*. 2nd edition. Cambridge University Press.
