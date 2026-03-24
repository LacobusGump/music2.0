# The Functor Question: Ideals to Endomorphisms, and Whether h_K Falls Out

**Status:** PARTIALLY KNOWN. The key ingredients exist in the literature but have not been assembled into the theorem stated here. The inner/outer distinction is real and gives the class group. The Picard group path is the cleanest. The monoidal functor path works but does not bypass number theory.

**Depends on:** test_principality_detection.md, test_class_number_derivation.md, open_q2_dedekind_deep.md

**Date:** March 24, 2026

---

## 0. The Setup

We established (test_principality_detection.md) that single Stinespring dilations cannot see principality. The class group lives in the COMPOSITIONAL structure. The question now is: can we build a functor from arithmetic to quantum channels that preserves enough structure for h_K to be visible, and does it already exist?

Three paths were proposed. Here is what is known, what is new, and what remains.

---

## 1. Path 1: Inner vs. Outer Endomorphisms of the Bost-Connes Algebra

### 1.1 The observation

For a principal ideal I = (alpha) in O_K, the endomorphism sigma_I of the Bost-Connes algebra A_K is:

    sigma_{(alpha)}(x) = mu_alpha x mu_alpha*

This is conjugation by the isometry mu_alpha. It is an INNER endomorphism: implemented by a single element of the ambient algebra (or its multiplier algebra).

For a non-principal ideal I, there is no single element alpha with I = (alpha). The endomorphism sigma_I is defined using the ideal as a whole (via the Hecke algebra structure or the semigroup crossed product). It is not conjugation by any single isometry. It is OUTER in the sense that it cannot be written as Ad(mu_alpha) for any alpha.

### 1.2 What is known

This distinction IS present in the Bost-Connes literature, though not always stated in inner/outer language.

**Known fact 1 (Laca-Larsen-Neshveyev [LLN09]).** The Bost-Connes system for a number field K is a semigroup crossed product:

    A_K = C*(K/O_K) rtimes O_K^x

where O_K^x is the multiplicative semigroup of nonzero elements. The endomorphisms sigma_alpha for alpha in O_K^x are inner (conjugation by mu_alpha). These correspond to PRINCIPAL ideals only.

For non-principal ideals, the endomorphisms are constructed differently. In the Ha-Paugam formulation [HP05], one works with the groupoid of the adelic space, and the endomorphisms are indexed by ideals (not elements). The non-principal ones do not arise from conjugation by a single element.

**Known fact 2 (Connes-Marcolli [CM08, Ch. 3]).** The Bost-Connes system for K has endomorphisms indexed by the integral ideals of O_K. The map I -> sigma_I is a semigroup homomorphism from (Ideals(O_K), *) to (End(A_K), composition). This is essentially the functor F-tilde proposed in Path 3.

**Known fact 3 (General C*-algebra theory).** For any endomorphism sigma of a C*-algebra A, the distinction between inner (sigma = Ad(v) for some isometry v in A or M(A)) and outer (no such v exists) is a well-defined algebraic property. The quotient Out(A) = End(A) / Inn(A) (outer endomorphisms modulo inner ones) is a standard invariant.

### 1.3 What is new (or at least not explicitly stated)

The following appears not to be explicitly stated in the published literature:

**Claim.** Let A_K be the Bost-Connes algebra for a number field K. Define:

    End_arith(A_K) = {sigma_I : I is an integral ideal of O_K}
    Inn_arith(A_K) = {sigma_{(alpha)} : (alpha) is a principal ideal of O_K}

Then the quotient:

    End_arith(A_K) / Inn_arith(A_K) = Cl(O_K)

is the ideal class group of K, and |Cl(O_K)| = h_K.

### 1.4 Is this a theorem?

Almost. But not quite as stated. The issue is the precise definition of the equivalence relation.

Two endomorphisms sigma_I and sigma_J are in the same class iff I and J are in the same ideal class, i.e., I = alpha * J for some alpha in K*. This means sigma_I = sigma_{(alpha)} composed with sigma_J (up to the appropriate normalization). So the equivalence relation is:

    sigma_I ~ sigma_J  iff  sigma_I = sigma_{(alpha)} . sigma_J  for some alpha in K*

This is the right-coset relation by Inn_arith. The quotient is indeed Cl(O_K).

**But this is a TRANSLATION, not a derivation.** The quotient End_arith / Inn_arith = Cl(O_K) holds BY DEFINITION of the class group. We have:

- Ideals of O_K -> End_arith(A_K): the map I -> sigma_I is injective (different ideals give different endomorphisms, since sigma_I determines the image subalgebra sigma_I(A_K), which determines I).
- Principal ideals -> Inn_arith(A_K): the map (alpha) -> sigma_{(alpha)} = Ad(mu_alpha) identifies principal ideals with inner endomorphisms.
- The quotient Ideals / Principal = Cl(O_K) therefore maps isomorphically to End_arith / Inn_arith.

This tells us the class group IS the quotient of arithmetic endomorphisms by inner ones. That is a true statement. But to COMPUTE h_K from this, you still need to determine which endomorphisms are inner -- which requires knowing which ideals are principal -- which is the original number-theoretic problem.

### 1.5 Verdict on Path 1

**The inner/outer distinction correctly captures the class group.** The statement End_arith(A_K) / Inn_arith(A_K) = Cl(O_K) is TRUE and is implicit in the Bost-Connes literature (it follows from the construction in [LLN09] and [HP05]). But it does not give a NEW way to compute h_K. It gives a new LANGUAGE for the same computation.

The one potential advantage: the inner/outer distinction is ALGEBRAICALLY DETECTABLE. Given an endomorphism sigma of a C*-algebra, you can (in principle) determine whether it is inner by checking if there exists an isometry v with sigma = Ad(v). This is a question about the algebra, not about number theory. So the approach does REFORMULATE the class number problem as a C*-algebra problem. Whether that reformulation is easier is another question.

---

## 2. Path 2: The Picard Group

### 2.1 Background

The Picard group Pic(A) of a C*-algebra A (or more generally a ring) consists of isomorphism classes of invertible A-A bimodules, with tensor product over A as the group operation. The identity element is A itself (viewed as a bimodule over itself).

### 2.2 What is known

**Known fact 1 (Classical algebra).** For a Dedekind domain O_K, the Picard group Pic(O_K) is exactly the ideal class group Cl(O_K). Every fractional ideal I defines an O_K-O_K bimodule (it is a rank-1 projective module). Two ideals give isomorphic bimodules iff they are in the same ideal class. The tensor product of bimodules corresponds to the product of ideals. Principal ideals give the trivial bimodule (isomorphic to O_K itself).

This is a THEOREM of commutative algebra. Reference: Neukirch [Neu99, Ch. I, Thm. 3.11] or any algebraic number theory text.

**Known fact 2 (Morita theory).** Two rings (or C*-algebras) R, S are Morita equivalent iff there exists an invertible R-S bimodule. The Picard group Pic(R) classifies the self-Morita equivalences of R.

**Known fact 3 (Noncommutative geometry).** For the crossed product algebra C(X) rtimes G, the Picard group is related to the first cohomology H^1(G, Pic(C(X))). For commutative C*-algebras C(X), Pic(C(X)) is related to the group of line bundles on X.

### 2.3 The key result (KNOWN but perhaps underappreciated)

**Theorem (Classical).** Let O_K be the ring of integers of a number field K. Then:

    Pic(O_K) = Cl(O_K)

and in particular:

    |Pic(O_K)| = h_K

The proof is standard: every invertible O_K-module is isomorphic to a fractional ideal, and two fractional ideals are isomorphic as modules iff they differ by multiplication by an element of K*.

### 2.4 Lifting to the Bost-Connes algebra

The question is whether this lifts to the C*-algebraic level. Specifically:

**Question.** For the Bost-Connes algebra A_K (or an appropriate subalgebra or related algebra), is Pic(A_K) related to Cl(O_K)?

This is MORE SUBTLE than the commutative case because A_K is noncommutative. The Picard group of a noncommutative algebra can be much larger than the class group.

**What is known:** Cornelissen and Marcolli [CM10] proved that the Bost-Connes system A_K determines K up to isomorphism. This means ALL arithmetic invariants of K -- including h_K -- are encoded in A_K. But the question is whether h_K is encoded specifically in Pic(A_K).

**What appears to be unknown:** An explicit computation of Pic(A_K) for the Bost-Connes algebra. This would require understanding all invertible A_K-A_K bimodules, which is a hard problem for crossed product algebras.

### 2.5 The more tractable version

Instead of the full Bost-Connes algebra, consider the COMMUTATIVE subalgebra:

    B_K = C*(O_K) or C_0(Spec(O_K))

For this commutative algebra, Pic is well-understood:

    Pic(O_K) = Cl(O_K)   (as stated above)

The functor is:

    F: Ideals(O_K) -> Bimod(O_K)
    I |-> I (viewed as an O_K-O_K bimodule)

This functor is:
- Monoidal: F(I * J) = F(I) tensor_{O_K} F(J) (tensor product of bimodules = product of ideals)
- Faithful on classes: F(I) isomorphic to F(J) iff [I] = [J] in Cl(O_K)
- The identity: F(O_K) = O_K (the trivial bimodule)
- Principal ideals: F((alpha)) is isomorphic to O_K (the trivial bimodule), since multiplication by alpha gives the isomorphism

Therefore: ker(F up to isomorphism) = principal ideals, and the image of F in Pic(O_K) IS Cl(O_K).

### 2.6 Verdict on Path 2

**This is the cleanest path, and the key theorem (Pic(O_K) = Cl(O_K)) is CLASSICAL.** It is literally in every algebraic number theory textbook.

The functor F: Ideals -> Bimodules preserves the group structure, and h_K = |Pic(O_K)| falls out as the order of the Picard group.

**But the same caveat applies:** computing |Pic(O_K)| -- i.e., counting the isomorphism classes of rank-1 projective O_K-modules -- is THE class number problem. The functor gives you the right framework but does not compute the answer.

The value of this path is that it gives a CATEGORICAL home for h_K: the class number is the number of connected components of the groupoid of invertible bimodules. This is a statement about the category of modules over O_K, not about individual modules. It is the precise mathematical formulation of the observation from test_principality_detection.md that "the class group lives in the monoidal structure."

---

## 3. Path 3: The Monoidal Functor (Enriched)

### 3.1 The plain functor

    F: (Ideals(O_K), *) -> (CPTP(B), composition)
    I |-> Phi_I (the erasure channel on B = functions on O_K/I)

This was shown (test_principality_detection.md) to be CLASS-BLIND: F(I) depends only on N(I), so F cannot distinguish ideal classes.

### 3.2 The enriched functor

    F-tilde: (Ideals(O_K), *) -> (End(A_K), composition)
    I |-> sigma_I (the endomorphism of the Bost-Connes algebra)

This remembers not just the channel but its IMPLEMENTATION. The enrichment is:
- F-tilde(I) is inner iff I is principal (Path 1 analysis)
- F-tilde is a semigroup homomorphism: F-tilde(I * J) = F-tilde(I) . F-tilde(J)
- The kernel modulo inner endomorphisms is the class group

### 3.3 The precise theorem

**Theorem.** Let K be a number field with ring of integers O_K and class group Cl(O_K). Let A_K be the Bost-Connes C*-algebra for K, and let sigma_I denote the endomorphism of A_K associated to an integral ideal I of O_K. Then:

(i) The map I -> sigma_I is an injective semigroup homomorphism from (Ideals(O_K), *) to (End(A_K), composition).

(ii) sigma_I is inner (i.e., sigma_I = Ad(v) for some isometry v in M(A_K)) if and only if I is principal.

(iii) Two endomorphisms sigma_I, sigma_J satisfy sigma_I = sigma_{(alpha)} . sigma_J for some alpha in K* if and only if [I] = [J] in Cl(O_K).

(iv) The induced map on quotients

    Ideals(O_K) / Principal ideals  ->  End_arith(A_K) / Inn_arith(A_K)

is an isomorphism of groups, and both sides equal Cl(O_K).

(v) h_K = |Cl(O_K)| = |End_arith(A_K) / Inn_arith(A_K)|.

### 3.4 Proof status

**(i)** KNOWN. This is part of the construction of the Bost-Connes system for K. The endomorphisms sigma_I are indexed by ideals and respect multiplication. See [LLN09, Section 2] or [HP05].

**(ii)** This is the key claim. The forward direction (principal implies inner) is immediate: if I = (alpha), then sigma_I(x) = mu_alpha x mu_alpha* = Ad(mu_alpha)(x), which is inner by definition. The reverse direction (inner implies principal) requires:

**Claim.** If sigma_I = Ad(v) for some isometry v in M(A_K), then I is principal.

**Proof sketch.** The endomorphism sigma_I determines the ideal I (since it determines the image subalgebra, which determines the kernel of the dual map on the adelic space, which determines I). If sigma_I = Ad(v), then v is an isometry implementing a rank-1 endomorphism. In the Bost-Connes system, the isometries mu_alpha (for alpha in O_K, alpha != 0) are the canonical isometries, and they generate all inner endomorphisms of the form Ad(mu_alpha) = sigma_{(alpha)}. Any other isometry v implementing an arithmetic endomorphism must be of the form v = u * mu_alpha for some unitary u in A_K. But then Ad(v) = Ad(u * mu_alpha) = Ad(mu_alpha) (since Ad(u) is an automorphism, and composing an endomorphism with an automorphism gives the same ideal). So Ad(v) = sigma_{(alpha)}, meaning I = (alpha) is principal.

**This argument needs more care.** The claim that every isometry implementing an arithmetic endomorphism is of the form u * mu_alpha requires proof. In the Bost-Connes system, the isometries are the mu_n's and their products with unitaries, but the precise structure of the isometry semigroup of A_K (especially for non-principal ideal endomorphisms) is not trivially analyzed. This is where NEW WORK is needed.

**(iii)** Follows from (i) and (ii): sigma_I = sigma_{(alpha)} . sigma_J iff sigma_I = sigma_{alpha * J} (by the homomorphism property) iff I = alpha * J (by injectivity) iff [I] = [J].

**(iv)** Follows from (i)-(iii).

**(v)** Immediate from (iv).

### 3.5 What needs to be proven

The only non-trivial gap is in (ii), the reverse direction: inner implies principal. Specifically:

**Lemma (needed).** In the Bost-Connes algebra A_K, every isometry v in M(A_K) such that Ad(v) is an arithmetic endomorphism (i.e., Ad(v) = sigma_I for some ideal I) satisfies v = u * mu_alpha for some unitary u in M(A_K) and some alpha in O_K with I = (alpha).

This is a statement about the structure of the isometry semigroup of the Bost-Connes algebra. It says that "arithmetic isometries" are exhausted by the canonical ones mu_alpha (up to unitary equivalence). This is plausible -- the mu_alpha are built into the algebra's definition -- but a rigorous proof requires understanding the multiplier algebra M(A_K) in detail.

**Difficulty level:** This should be provable using the explicit structure of A_K as a semigroup crossed product. The key tool is the Pimsner-Voiculescu theory for crossed products by endomorphisms, or the more recent work on semigroup C*-algebras (Li [Li12], Cuntz-Echterhoff-Li [CEL13]). In these frameworks, the isometry semigroup is often well-understood.

---

## 4. The Bottom Line

### 4.1 Can we get h_K WITHOUT number-theoretic computation?

**No.** None of the three paths gives h_K for free. Here is why:

All three paths give the class group as a QUOTIENT:

    Cl(O_K) = Ideals / Principal = Out_arith(A_K) / trivial = Pic(O_K)

In every case, computing h_K = |Cl(O_K)| requires determining which ideals are principal (or equivalently, which endomorphisms are inner, or which bimodules are trivial). This is the CLASS NUMBER PROBLEM, and it is intrinsically arithmetic. You need:

- Minkowski's bound (to reduce to finitely many ideals)
- Norm equations (to check principality of each ideal below the bound)
- Group relations (to determine the group structure)

No amount of C*-algebraic reformulation avoids this. The functor is FAITHFUL (it preserves all the information) but not COMPUTATIONAL (it does not perform the computation for you).

### 4.2 What the functor DOES give

1. **A categorical framework.** The class group is pi_0(Pic(O_K)), the set of connected components of the Picard groupoid. This is the RIGHT mathematical object -- it explains WHY single dilations cannot see classes (they are local/pointwise), while the class group is global (it measures the failure of local-to-global).

2. **The inner/outer distinction as a C*-algebraic invariant.** The question "is sigma_I inner?" is a question about the C*-algebra A_K, not about number theory. In principle, this reformulates the class number problem as a problem in C*-algebra theory. Whether this is useful depends on whether C*-algebraic tools (K-theory, Picard groups, Ext groups) can be brought to bear.

3. **A monoidal functor preserving the group structure.** The functor F-tilde is a semigroup homomorphism. Its kernel (modulo inner) is the class group. The Euler product decomposes F-tilde over primes. This gives a precise sense in which the Euler product "knows about" the class group: the class group is the obstruction to factoring the global functor into local (prime-by-prime) pieces.

4. **A potential computational approach via K-theory.** The class group of O_K is isomorphic to the reduced K_0 group: Cl(O_K) = K_0-tilde(O_K). For C*-algebras, K_0 is computable in many cases. If K_0(A_K) can be computed by C*-algebraic methods (e.g., Pimsner-Voiculescu exact sequences for the crossed product), this WOULD give h_K without classical number-theoretic methods. This is a genuine research direction.

### 4.3 What exists in the literature

| Result | Known? | Reference |
|--------|--------|-----------|
| Pic(O_K) = Cl(O_K) | YES | Classical; Neukirch [Neu99], any ANT text |
| Bost-Connes endomorphisms indexed by ideals | YES | [LLN09], [HP05], [CMR05] |
| sigma_{(alpha)} = Ad(mu_alpha) is inner | YES | Direct from the construction |
| A_K determines K up to isomorphism | YES | Cornelissen-Marcolli [CM10] |
| End_arith(A_K) / Inn_arith(A_K) = Cl(O_K) | IMPLICIT | Follows from [LLN09] + the inner/outer observation, but not stated as a theorem |
| K_0 or K-theory computation of A_K giving h_K | OPEN | Not computed for the Bost-Connes algebra |
| Inner implies principal (the reverse direction) | NEEDS PROOF | Plausible, not formally proven in the literature |

### 4.4 The precise theorem to be proven

**Theorem (Arithmetic Endomorphism Class Group).** Let K be a number field with ring of integers O_K, class group Cl(O_K), and class number h_K. Let A_K be the Bost-Connes C*-algebra for K. Then:

(a) The arithmetic endomorphisms End_arith(A_K) = {sigma_I : I integral ideal of O_K} form a semigroup isomorphic to (Ideals(O_K), *).

(b) The inner arithmetic endomorphisms Inn_arith(A_K) = {sigma_I : I principal} form a sub-semigroup isomorphic to (Principal ideals, *).

(c) The quotient End_arith(A_K) / Inn_arith(A_K) is isomorphic to Cl(O_K) as a group, and its order is h_K.

(d) An arithmetic endomorphism sigma_I is inner in End(A_K) (not just in End_arith) if and only if I is principal.

Parts (a)-(c) are essentially known (from the Bost-Connes construction). Part (d) is the statement that requires new work -- it says that no "accidental" inner implementation exists for a non-principal ideal endomorphism.

### 4.5 What would make this significant

If part (d) can be proven, AND if there is a computable C*-algebraic criterion for "inner vs. outer" that does not reduce to checking principality of ideals, then the theorem provides a genuinely new computational approach to h_K. The most promising avenue is:

**K-theoretic approach.** The group of inner automorphisms / endomorphisms of a C*-algebra is related to its K_0 group. If K_0(A_K) can be computed using C*-algebraic exact sequences (Pimsner-Voiculescu, Mayer-Vietoris for groupoid C*-algebras, Baum-Connes), the class number would emerge from the computation.

**Connes' approach.** In Connes' noncommutative geometry program, the class field theory of K is encoded in the KMS states of A_K. The class number appears in the symmetry group of the KMS states at low temperature (beta > 1): the Galois group Gal(K^ab/K) acts on the extremal KMS states, and the class group is a quotient of this Galois group (by Artin reciprocity). Connes and Marcolli [CM08, Section 3.7] discuss this at length. The class number is thus visible in the PHASE TRANSITION, not in the endomorphisms per se.

---

## 5. Summary of the Three Paths

| Path | Functor | Target | h_K visible? | New? | Computable? |
|------|---------|--------|-------------|------|-------------|
| 1. Inner/outer | I -> sigma_I | End(A_K) | Yes, as quotient End/Inn | Implicit in literature; not stated as theorem | Requires checking principality |
| 2. Picard group | I -> bimodule | Pic(O_K) | Yes, as |Pic(O_K)| | CLASSICAL (well-known) | Requires counting module isomorphism classes |
| 3. Enriched monoidal | I -> sigma_I (with composition) | (End(A_K), .) | Yes, as quotient | Same as Path 1, with monoidal structure | Same obstruction |

**All three paths give the correct answer. None bypasses number theory. The value is in the reformulation, not the computation.**

The most promising direction for genuine computational novelty is the K-theory approach: compute K_0(A_K) using C*-algebraic exact sequences and extract h_K from the result. This would be a new method for computing class numbers, but it is a research program, not a solved problem.

---

## 6. The Honest Statement

**What we can state as a theorem (modulo the proof of part (d) above):**

The enriched functor F-tilde: Ideals(O_K) -> End(A_K), defined by F-tilde(I) = sigma_I, is a faithful monoidal functor whose image modulo inner endomorphisms is the ideal class group Cl(O_K). The class number h_K equals the number of orbits of Inn_arith(A_K) acting on End_arith(A_K) by composition.

**What we cannot state:**

That this gives a new way to COMPUTE h_K. The functor preserves structure perfectly but does not perform computation. Computing the quotient End/Inn is equivalent to computing the class group, which is the original problem.

**What would change the game:**

A C*-algebraic or K-theoretic method to compute the size of Out_arith(A_K) = End_arith(A_K) / Inn_arith(A_K) that does not reduce to checking principality of individual ideals. This would require leveraging the GLOBAL structure of A_K (its K-theory, its Picard group, its KMS state structure) rather than examining individual endomorphisms one at a time. Whether such a method exists is an open question.

---

## References

[BC95] J.-B. Bost and A. Connes, "Hecke algebras, type III factors and phase transitions with spontaneous symmetry breaking in number theory," Selecta Math. 1 (1995), 411-457.

[CEL13] J. Cuntz, S. Echterhoff, and X. Li, "On the K-theory of crossed products by automorphic semigroup actions," Q. J. Math. 64 (2013), 747-784.

[CM08] A. Connes and M. Marcolli, Noncommutative Geometry, Quantum Fields and Motives, AMS Colloquium Publications (2008).

[CM10] G. Cornelissen and M. Marcolli, "Quantum Statistical Mechanics, L-series and Anabelian Geometry," arXiv:1009.0736 (2010).

[CMR05] A. Connes, M. Marcolli, and N. Ramachandran, "KMS states and complex multiplication," Selecta Math. 11 (2005), 325-347.

[HP05] E. Ha and F. Paugam, "Bost-Connes-Marcolli systems for Shimura varieties. I." IMRP (2005), 237-286.

[Li12] X. Li, "Semigroup C*-algebras and amenability of semigroups," J. Funct. Anal. 262 (2012), 4302-4340.

[LLN09] M. Laca, N.S. Larsen, and S. Neshveyev, "On Bost-Connes type systems for number fields," J. Number Theory 129 (2009), 325-338.

[Neu99] J. Neukirch, Algebraic Number Theory, Springer (1999).

---

*Written 2026-03-24. Assessment of the functor from arithmetic to quantum channels: the structure exists, the class group is visible, but computation still requires number theory. The K-theory approach is the most promising direction for genuine novelty.*
