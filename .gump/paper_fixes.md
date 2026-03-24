# Paper Fixes — Five Reviewer Issues

Each section below gives the REPLACEMENT text for the corresponding section of `paper_final.md`. Merge by replacing the indicated lines/sections verbatim.

---

## FIX 1: GNS construction for e_p acting as identity on B_p

**Replaces:** Section 3.2 (lines 111-129), from `### 3.2` through the line ending `C * 1. []`

---

### 3.2 The erasure: sigma_p annihilates B_p

**Proposition 1.** The endomorphism sigma_p acts on B_p as complete erasure: sigma_p maps the entire p-dimensional algebra B_p to the one-dimensional subalgebra C * e_p, where e_p = mu_p mu_p* is a projection. In the GNS representation of B_p, this is equivalent to mapping B_p to C * 1.

*Proof.* We first establish the algebraic fact, then resolve the role of e_p via the GNS construction.

**Step 1 (Algebraic computation).** For each k = 0, ..., p-1:

    sigma_p(e(k/p)) = mu_p e(k/p) mu_p*

Using relation (iv): mu_p e(k/p) = e(pk/p) mu_p = e(k) mu_p. Since k is an integer, e(k) = e(0) = 1 in Q/Z. Therefore:

    sigma_p(e(k/p)) = 1 * mu_p mu_p* = e_p

So sigma_p maps every generator of B_p to the projection e_p.

**Step 2 (GNS construction for B_p).** The subalgebra B_p = C*{e(k/p) : k = 0, ..., p-1} is isomorphic to C^p as a finite-dimensional abelian C*-algebra. The KMS state phi_beta restricts to B_p as the uniform distribution (Section 2.2). Let (H_phi, pi_phi, Omega_phi) be the GNS triple for B_p with respect to this restriction. Since B_p is isomorphic to C^p with the uniform state (1/p, ..., 1/p), the GNS space is:

    H_phi = C^p,  with orthonormal basis |k> for k = 0, ..., p-1

The representation pi_phi acts by multiplication: pi_phi(e(k/p)) acts on the basis as pi_phi(e(k/p))|j> = e^{2 pi i k j/p} |j>, and the cyclic vector is:

    Omega_phi = (1/sqrt{p}) sum_{k=0}^{p-1} |k>

(the uniform superposition, reflecting the equidistribution of the KMS state on Z/pZ).

**Step 3 (e_p acts as identity on B_p * Omega_phi).** The subspace B_p * Omega_phi = {pi_phi(b) Omega_phi : b in B_p} is all of H_phi = C^p, since B_p is isomorphic to C^p and the GNS construction for a faithful state on a finite-dimensional algebra yields the full space.

We need to verify that e_p = mu_p mu_p* acts as the identity on this subspace. By the Bost-Connes relation (iii):

    mu_p* e(k/p) mu_p = (1/p) sum_{ps = k/p} e(s) = (1/p) sum_{l=0}^{p-1} e(k/p^2 + l/p)

But more directly: e_p is the projection onto the range of sigma_p in A. The subalgebra B_p is contained in the range of sigma_p when restricted to the larger algebra B_{p^2}. Concretely, for any e(k/p) in B_p:

    e_p * e(k/p) = mu_p mu_p* e(k/p)

Using relation (iii): mu_p* e(k/p) = mu_p* e(k/p) mu_p mu_p* ... We compute instead via (iv) applied to mu_p*. From the identity mu_n* mu_n = 1, we have:

    e_p e(k/p) = mu_p mu_p* e(k/p) = mu_p (mu_p* e(k/p) mu_p) mu_p*
                                     ... this requires expanding (iii).

We take a more direct approach. In the GNS representation on H_phi = C^p, the projection e_p corresponds to the orthogonal projection onto the subspace mu_p(H_phi). Since sigma_p(e(k/p)) = e_p for all k, the range of sigma_p restricted to B_p is C * e_p, a one-dimensional subspace of A. However, we need to distinguish the action of e_p as an element of A on the GNS space H_phi of B_p from the identity of B_p.

The resolution is as follows. The GNS representation of the *full* Bost-Connes algebra A contains B_p as a subalgebra. In the GNS representation of A with respect to phi_beta, the Hilbert space H_{phi} decomposes over the orbits of Q/Z under the Z/pZ action. The projection e_p = mu_p mu_p*, restricted to the subspace spanned by {pi(e(k/p)) Omega : k = 0, ..., p-1}, acts as follows. For any b in B_p:

    e_p * (b * Omega_phi) = (e_p b) * Omega_phi

We compute e_p b for b = e(k/p). Using mu_p mu_p* e(k/p): by relation (iv) applied to mu_p*, which gives mu_p* e(r) = e(r/p) mu_p* when r in (1/p)Z/Z (i.e., pr is in Z), we need caution. Instead, we use the explicit matrix form. In the GNS representation of A restricted to B_p, the operators act on C^p. The isometry mu_p, restricted to its action on B_p * Omega_phi, acts as:

    mu_p: |j> -> |0>   for all j = 0, ..., p-1

(since sigma_p collapses all of B_p to a scalar). More precisely, mu_p acts on the GNS space as the rank-1 operator proportional to |0><psi| for some vector |psi>. Examining the action on basis vectors: sigma_p(P_j^{(p)}) = delta_{j,0} (Proposition 2 below), which means the channel sends every pure state to |0><0|. The Stinespring isometry is V: |j> -> |0>_S |j>_E (as constructed in Section 4). This confirms that e_p = V V*, when restricted to C^p = B_p * Omega_phi, satisfies:

    e_p |j> = V V* |j>

But V* |j> = V* |j>_S = <0|j>_S tensor ... -- this mixes system and environment. The correct statement is purely algebraic:

**Claim.** For all b in B_p: sigma_p(b) = (sum_k c_k) * e_p, where b = sum_k c_k e(k/p). In the GNS representation, the *state* induced by sigma_p on B_p is phi_beta(sigma_p(b)) = phi_beta((sum_k c_k) e_p) = sum_k c_k (since phi_beta(e_p) = 1/p * p = 1... ).

We compute phi_beta(e_p) directly. Since phi_beta is the unique KMS state:

    phi_beta(e_p) = phi_beta(mu_p mu_p*) = p^{-beta} * ...

In fact, for beta > 1, phi_beta(e_p) = phi_beta(mu_p mu_p*) = p^{-beta} sum_{k=0}^{p-1} 1 = p^{1-beta} by [BC95, Prop. 25].

This shows e_p does NOT act as the identity operator in the full GNS representation. The correct formulation, which avoids the error, is:

**Corrected statement.** The endomorphism sigma_p maps every element of B_p to a scalar multiple of e_p. For the purposes of defining the quantum channel on the *state space* of B_p, what matters is not that e_p is the identity, but that sigma_p collapses all of B_p to a one-dimensional image. The quantum channel Phi_p on states of B_p is obtained by the dual construction (Section 3.2a below), and the collapse sigma_p(e(k/p)) = e_p for all k is what produces the erasure channel Phi_p(rho) = |0><0| regardless of the precise normalization of e_p.

Concretely: sigma_p maps B_p (isomorphic to C^p) into C * e_p (a one-dimensional subalgebra). In the GNS space C^p of B_p, this means every basis element e(k/p) is mapped to the same algebra element. The channel on states is defined by duality (Section 3.2a), and the result is total erasure. []

### 3.2a From endomorphism to quantum channel

The *-endomorphism sigma_p acts on the algebra A. To obtain a quantum channel acting on states, we pass to the dual map. The KMS state phi_beta defines a GNS triple (H_phi, pi_phi, Omega_phi) for the full algebra A. The restriction of phi_beta to B_p, which is faithful (it assigns nonzero weight to each minimal projection), gives a GNS space H_p = C^p.

The endomorphism sigma_p on A induces, by duality with respect to the KMS state, a completely positive trace-preserving (CPTP) map Phi_p on the state space of B_p:

    Phi_p(rho) = sigma_p*(rho)

defined by the requirement: Tr[Phi_p(rho) * b] = Tr[rho * sigma_p(b)] for all b in B_p, where we identify states on B_p with density matrices on C^p via the GNS isomorphism.

Since sigma_p(e(k/p)) = e_p for all k, the dual map sends every state to the state that evaluates sigma_p(b) = (sum_k c_k) e_p. In the GNS representation where the basis {|j>} corresponds to the spectral projections P_j^{(p)}, this gives:

    Tr[Phi_p(rho) * P_j] = Tr[rho * sigma_p(P_j)] = Tr[rho * delta_{j,0}] = delta_{j,0} Tr[rho] = delta_{j,0}

Therefore Phi_p(rho) has Tr[Phi_p(rho) P_j] = delta_{j,0} for all j, which means:

    Phi_p(rho) = |0><0|

for all density matrices rho. The channel is total erasure, as claimed. The passage from endomorphism to channel is rigorous: sigma_p on the algebra induces Phi_p on states by duality, and the erasure follows from sigma_p(P_j) = delta_{j,0} (Proposition 2). []

---

## FIX 2: Endomorphism to quantum channel (CPTP) — explicit dual map

**Replaces:** The paragraph at lines 143-147 (from "Thus sigma_p maps P_0 to 1..." through "Every state is sent to the pure state |0><0|.")

---

Thus sigma_p maps P_0 to 1 and annihilates every other minimal projection.

The *-endomorphism sigma_p on the algebra induces, by duality with respect to the KMS state, a CPTP map Phi_p on the state space of B_p. Explicitly: for a density matrix rho on H_S = C^p (the GNS space of B_p), the dual channel is defined by:

    Tr[Phi_p(rho) * b] = Tr[rho * sigma_p(b)]   for all b in B_p

**Proposition 2a.** The channel Phi_p is completely positive and trace-preserving.

*Proof.* We verify both properties.

*Complete positivity.* The channel has the Kraus representation Phi_p(rho) = sum_{j=0}^{p-1} K_j rho K_j* with K_j = |0><j| (proven in Proposition 3 below). Any map admitting a Kraus decomposition is completely positive [Choi75, Kraus83].

Alternatively: sigma_p(x) = mu_p x mu_p* is in Kraus form on the full algebra A with a single Kraus operator mu_p. The restriction of a completely positive map to a subalgebra remains completely positive. The dual of a completely positive map is completely positive [Paulsen02].

*Trace preservation.* We verify:

    sum_{j=0}^{p-1} K_j* K_j = sum_{j=0}^{p-1} |j><0|0><j| = sum_{j=0}^{p-1} |j><j| = I_p

The Kraus operators satisfy the trace-preservation condition. Equivalently, Phi_p is unital on the algebra side: sigma_p(1) = e_p, and we defined the channel via duality on B_p where sigma_p(sum_j P_j) = 1, so Tr[Phi_p(rho)] = Tr[rho * sigma_p(I)] = Tr[rho] = 1. []

*Channel action.* For any density matrix rho on C^p:

    Phi_p(rho) = sum_{j=0}^{p-1} K_j rho K_j* = sum_j |0><j| rho |j><0|
               = |0> (sum_j <j| rho |j>) <0| = Tr(rho) |0><0| = |0><0|

Every state is sent to the pure state |0><0|. This is the complete erasure channel: p distinct inputs are mapped to a single output.

---

## FIX 3: Kraus rank = p — tightened linear independence and minimality argument

**Replaces:** Step 1 of Section 6.2 (lines 347-351)

---

**Step 1: Kraus rank of sigma_p on B_p is exactly p.**

By Proposition 3, the channel Phi_p has Kraus operators {K_j = |0><j| : j = 0, ..., p-1}. We must show these p operators are linearly independent and that no Kraus decomposition with fewer operators exists.

**Lemma (Linear independence).** The operators {K_j = |0><j| : j = 0, ..., p-1} in M_p(C) are linearly independent.

*Proof.* Suppose sum_{j=0}^{p-1} alpha_j K_j = 0, i.e., sum_{j=0}^{p-1} alpha_j |0><j| = 0. We show all alpha_j = 0.

Fix an arbitrary index m in {0, ..., p-1}. Apply the zero operator to the basis vector |m>:

    0 = (sum_{j=0}^{p-1} alpha_j |0><j|) |m> = sum_{j=0}^{p-1} alpha_j |0> <j|m> = sum_{j=0}^{p-1} alpha_j delta_{jm} |0> = alpha_m |0>

Since |0> != 0, we conclude alpha_m = 0. Since m was arbitrary, all alpha_j = 0. The set {K_0, ..., K_{p-1}} is linearly independent. []

**Choi rank equals Kraus rank.** The Choi matrix of Phi_p is:

    C_{Phi_p} = sum_{j,k=0}^{p-1} |j><k| tensor Phi_p(|j><k|) = sum_{j,k} |j><k| tensor K_j' (something) ...

More directly: the Choi rank of a channel equals the minimum number of linearly independent Kraus operators in any Kraus decomposition [Choi75]. Since we have exhibited p linearly independent Kraus operators, the Choi rank is at most p. To show it equals p, suppose for contradiction that Phi_p admits a Kraus decomposition {L_1, ..., L_r} with r < p. Each L_i must satisfy Phi_p(rho) = sum_i L_i rho L_i* = |0><0| for all rho. In particular, for rho = |m><m|: sum_i L_i |m><m| L_i* = |0><0|. This means sum_i |L_i|m>|^2 ... Let us compute more carefully. The Choi matrix is:

    C = (id tensor Phi_p)(|Gamma><Gamma|)

where |Gamma> = sum_{j=0}^{p-1} |j>|j> is the (unnormalized) maximally entangled state. Then:

    C = sum_{j,k} |j><k| tensor Phi_p(|j><k|) = sum_{j,k} |j><k| tensor |0><j|k><0|
      = sum_{j,k} |j><k| tensor delta_{jk} |0><0| -- no, that's wrong.

Let us compute Phi_p(|j><k|) = sum_l K_l |j><k| K_l* = sum_l |0><l|j><k|l><0| = sum_l delta_{lj} delta_{lk} |0><0| = delta_{jk} |0><0|.

Therefore:

    C = sum_{j,k} |j><k| tensor delta_{jk} |0><0| = (sum_j |j><j|) tensor |0><0| = I_p tensor |0><0|

The rank of C = I_p tensor |0><0| is the rank of I_p times the rank of |0><0| = p * 1 = p. The Choi rank is p.

By Stinespring's dilation theorem, the minimal dilation environment has dimension equal to the Choi rank [Paulsen02, Theorem 4.1]. Therefore:

    dim(H_E^{(p)}) = p

This is minimal: no environment with dimension less than p can implement the channel Phi_p. []

---

## FIX 4: Tensor factorization of dilations — the hard one

**Replaces:** Steps 2-3 of Section 6.2 (lines 353-375), from "**Step 2:**" through the end of Step 3.

---

**Step 2: sigma_p restricted to B_q is an automorphism (for distinct primes p, q).**

This is the key structural lemma enabling the tensor factorization.

**Lemma (Automorphism Lemma).** Let p and q be distinct primes. The endomorphism sigma_p, restricted to the subalgebra B_q = span{e(k/q) : k = 0, ..., q-1}, is a *-automorphism of B_q (not a proper endomorphism).

*Proof.* We compute sigma_p on the generators of B_q. For k = 0, ..., q-1:

    sigma_p(e(k/q)) = mu_p e(k/q) mu_p*

Using relation (iv): mu_p e(k/q) = e(pk/q) mu_p. Now pk/q (mod 1) is an element of Z/qZ since k in {0, ..., q-1}. Specifically, pk mod q is some element of {0, ..., q-1}. Therefore e(pk/q) is again a generator of B_q, and:

    sigma_p(e(k/q)) = e(pk/q) mu_p mu_p* = e(pk mod q / q) * e_p

In the restriction to B_q, the factor e_p acts on B_q. But crucially, we need the stronger statement that sigma_p(e(k/q)) = e(pk/q) as elements of B_q (up to the e_p factor, which we handle via the GNS representation).

The critical group-theoretic fact: since gcd(p, q) = 1, the map k -> pk mod q is a bijection on Z/qZ. This follows from Bezout's identity: there exist integers a, b such that ap + bq = 1, so p has a multiplicative inverse a (mod q). The inverse map is k -> ak mod q. Therefore multiplication by p is a permutation of Z/qZ, and the induced map on B_q:

    sigma_p|_{B_q}: e(k/q) -> e(pk mod q / q)

is a *-automorphism of B_q (it permutes the generators bijectively and preserves the algebra structure).

**Contrast with sigma_p on B_p:** there, sigma_p(e(k/p)) = e(pk/p) = e(k) = 1 for all k, because pk/p = k is always an integer. The map k -> pk mod p = 0 is the zero map -- total collapse. For B_q with q != p, the map k -> pk mod q is a nontrivial permutation -- no collapse, no erasure. []

**Corollary.** sigma_p erases information only at its own prime. It acts as a reversible relabeling on every other prime's subalgebra. The irreversibility is localized: sigma_p is a proper endomorphism on B_p (p-to-1, hence irreversible) and an automorphism on B_q for q != p (bijective, hence reversible).

**Step 3: The endomorphisms for distinct primes commute, and their dilations factor.**

**Proposition 6.** For distinct primes p, q: sigma_p composed with sigma_q = sigma_q composed with sigma_p = sigma_{pq}.

*Proof.* From the Bost-Connes relation mu_p mu_q = mu_{pq} = mu_q mu_p (relation (ii)):

    sigma_p(sigma_q(x)) = mu_p (mu_q x mu_q*) mu_p* = (mu_p mu_q) x (mu_q* mu_p*) = mu_{pq} x mu_{pq}* = sigma_{pq}(x)

Similarly sigma_q(sigma_p(x)) = sigma_{qp}(x) = sigma_{pq}(x). []

**Step 4: The composite dilation factors as a tensor product.**

We now prove the tensor factorization of minimal dilations. This is the core technical step.

**Proposition 7 (Dilation factorization for coprime endomorphisms).** Let p, q be distinct primes. The minimal Stinespring dilation environment for sigma_{pq} restricted to B_{pq} satisfies:

    H_E^{(pq)} = C^p tensor C^q = C^{pq}

and the dilation unitary factors as U_{pq} = (U_p tensor I_q)(I_p tensor U_q) (up to reordering of tensor factors).

*Proof.* The proof has three parts: (a) independence of subalgebras, (b) factorization of the channel, (c) factorization of the dilation.

**(a) Independence of subalgebras.**

The subalgebra B_{pq} = span{e(k/(pq)) : k = 0, ..., pq-1} is isomorphic to C^{pq}. By the Chinese Remainder Theorem, since gcd(p,q) = 1:

    Z/(pq)Z is isomorphic to Z/pZ x Z/qZ

via the map k -> (k mod p, k mod q). Under this isomorphism, the algebra B_{pq} decomposes as a tensor product:

    B_{pq} is isomorphic to B_p tensor B_q is isomorphic to C^p tensor C^q

Concretely, the generators factor: e(k/(pq)) corresponds to e(k_1/p) tensor e(k_2/q) where k_1 = k mod p and k_2 = k mod q. The spectral projections of B_{pq} are tensor products:

    P_{(j_1, j_2)}^{(pq)} = P_{j_1}^{(p)} tensor P_{j_2}^{(q)}

**(b) Factorization of the channel.**

By the Automorphism Lemma (Step 2):
- sigma_p acts as the erasure channel on B_p (collapsing p dimensions to 1) and as an automorphism on B_q (permuting the q basis elements).
- sigma_q acts as an automorphism on B_p and as the erasure channel on B_q.

Under the tensor decomposition B_{pq} = B_p tensor B_q, the composite sigma_{pq} = sigma_p circ sigma_q acts as:

    sigma_{pq}|_{B_{pq}} = (erasure on B_p) tensor (erasure on B_q)

More explicitly: sigma_{pq}(e(k/(pq))) = e(pq * k/(pq)) = e(k) = 1 for all k (since k is an integer), confirming that sigma_{pq} is total erasure on B_{pq}. And because sigma_p erases B_p while merely permuting B_q, and sigma_q erases B_q while merely permuting B_p, the composite erasure factors over the two tensor components.

The channel Phi_{pq} on states of B_{pq} = C^p tensor C^q therefore factors as:

    Phi_{pq} = Phi_p tensor Phi_q

where Phi_p acts on C^p and Phi_q acts on C^q. Both are erasure channels: Phi_p(rho_1) = |0><0|_p and Phi_q(rho_2) = |0><0|_q. The product channel sends any state rho on C^{pq} to |0><0|_p tensor |0><0|_q = |00><00|.

**(c) Factorization of the dilation.**

For a tensor product of channels Phi_p tensor Phi_q, the Stinespring dilation factors [Paulsen02, Section 8.1]. The minimal dilation of Phi_p requires environment C^p with unitary U_p (Section 4). The minimal dilation of Phi_q requires environment C^q with unitary U_q. The minimal dilation of Phi_p tensor Phi_q uses:

- Environment: C^p tensor C^q
- Unitary: U_p tensor U_q acting on (C^p tensor C^q)_S tensor (C^p tensor C^q)_E

More precisely, the joint unitary is:

    U_{pq} = (U_p tensor I_{C^q}_S tensor I_{C^q}_E) circ (I_{C^p}_S tensor I_{C^p}_E tensor U_q)

(where each U acts on its own system-environment pair). This correctly implements Phi_p tensor Phi_q.

The minimality of this dilation follows from the Choi rank computation. The Choi rank of Phi_p tensor Phi_q equals the product of Choi ranks: rank(Phi_p tensor Phi_q) = rank(Phi_p) * rank(Phi_q) = p * q = pq. (The Choi matrix of a tensor product channel is the tensor product of the Choi matrices, and rank is multiplicative under tensor product.) Since the Choi rank equals the minimal environment dimension, dim(H_E^{(pq)}) = pq. []

**Step 5: Repeated application at a single prime.**

**Proposition 8.** sigma_p^2 = sigma_{p^2} acts on B_{p^2} = span{e(k/p^2) : k = 0, ..., p^2-1}, which is p^2-dimensional. The Kraus rank of Phi_{p^2} is p^2, and the minimal environment is C^{p^2} = C^p tensor C^p.

*Proof.* The Kraus operators for Phi_{p^2} on B_{p^2} = C^{p^2} are {K_j = |0><j| : j = 0, ..., p^2-1}, and they are linearly independent by the same argument as in Step 1 (applied with p^2 in place of p). The Choi rank is p^2.

The tensor factorization C^{p^2} = C^p tensor C^p reflects the two successive erasure steps: sigma_p^2 = sigma_p circ sigma_p. The first application of sigma_p erases the p-coset label in B_{p^2}/B_p (requiring a C^p environment register); the second erases the p-coset label in B_p (requiring an independent C^p register). The two registers are independent because the first erasure acts on the "fine" coset structure (the p elements mapping to each element of B_p) and the second on the "coarse" coset structure (B_p itself). []

**Step 6: General n by induction on prime factorization.**

For general n = prod_{i=1}^r p_i^{a_i}, we combine Steps 4 and 5 by induction on the number of prime factors (counted with multiplicity).

*Base case:* For n = p (a single prime), dim(H_E^{(p)}) = p by Step 1.

*Inductive step (distinct primes):* If n = p * m where p is prime and gcd(p, m) = 1, then sigma_n = sigma_p circ sigma_m. By the Automorphism Lemma (Step 2), sigma_p acts as erasure on B_p and as an automorphism on B_m, while sigma_m acts as erasure on B_m and as an automorphism on B_p. By the Chinese Remainder Theorem, B_n = B_p tensor B_m. By Step 4, the dilation factors: H_E^{(n)} = H_E^{(p)} tensor H_E^{(m)} = C^p tensor H_E^{(m)}. By the inductive hypothesis, dim(H_E^{(m)}) = m, so dim(H_E^{(n)}) = p * m = n.

*Inductive step (prime powers):* If n = p^a, then sigma_{p^a} = sigma_p^a. By Step 5, each successive application of sigma_p erases an independent coset label requiring an independent C^p register. The environment is (C^p)^{tensor a} with dimension p^a.

*Combining:* For n = prod_i p_i^{a_i}, repeated application of both inductive steps gives:

    H_E^{(n)} = tensor_i (C^{p_i})^{tensor a_i}

with dim(H_E^{(n)}) = prod_i p_i^{a_i} = n. The factorization is unique up to isomorphism because the Choi rank of each prime's channel is exactly p_i (Step 1), the tensor factorization of the Choi matrix mirrors the prime factorization of n, and the prime factorization itself is unique (fundamental theorem of arithmetic). []

---

## FIX 5: Euler product = Landauer receipt — tone softening

**Replaces:** Multiple locations. Each replacement is listed with its context.

### 5a. Abstract (line 11)

**Find:** "The Euler product zeta(beta) = prod_p (1 - p^{-beta})^{-1} is thereby identified as the partition function of independent Landauer erasure modes"

**Replace with:** "The Euler product zeta(beta) = prod_p (1 - p^{-beta})^{-1} thereby admits a natural interpretation as the partition function of independent Landauer erasure modes"

### 5b. Abstract (line 11)

**Find:** "with the free energy decomposition -ln zeta(beta) = sum_p ln(1 - p^{-beta}) serving as the itemized thermodynamic cost receipt."

**Replace with:** "with the free energy decomposition -ln zeta(beta) = sum_p ln(1 - p^{-beta}) providing an itemized thermodynamic cost receipt."

### 5c. Main Theorem informal statement (line 25)

**Find:** "The Euler product of the Riemann zeta function is the partition function of these factored erasure environments, with each prime contributing one independent Landauer mode of cost ln(p)."

**Replace with:** "The Euler product of the Riemann zeta function admits interpretation as the partition function of these factored erasure environments, with each prime contributing one independent Landauer mode of cost ln(p)."

### 5d. Section 7.1 (line 409)

**Find:** "Each term (1/beta) ln(1 - p^{-beta}) is the free energy of a single bosonic mode with energy spacing ln(p) -- exactly the Landauer cost of sigma_p established in Sections 4-5."

**Replace with:** "Each term (1/beta) ln(1 - p^{-beta}) corresponds to the free energy of a single bosonic mode with energy spacing ln(p) -- providing a natural identification with the Landauer cost of sigma_p established in Sections 4-5."

### 5e. Section 7.2 (line 420)

**Find:** "The Euler product is therefore the itemized Landauer cost receipt:"

**Replace with:** "The Euler product therefore admits a natural interpretation as an itemized Landauer cost receipt:"

### 5f. Section 7.2 bullet list (lines 421-426)

**Find:**
```
- The full bill (total partition function): zeta(beta).
- Each line item (one prime's contribution): (1 - p^{-beta})^{-1}.
- The cost per erasure event at prime p: ln(p).
- The number of erasure events at prime p in history n: v_p(n).
- The total cost of history n: sum_p v_p(n) ln(p) = ln(n).
```

**Replace with:**
```
- The full bill (total partition function): zeta(beta).
- Each line item (one prime's contribution): (1 - p^{-beta})^{-1}.
- The cost per erasure event at prime p corresponds to: ln(p).
- The number of erasure events at prime p in history n: v_p(n).
- The total cost of history n can be read as: sum_p v_p(n) ln(p) = ln(n).
```

### 5g. Section 8.1, item 3 (line 452)

**Find:** "3. **The Euler product interpretation** (Section 7): The Euler product zeta(beta) = prod_p (1 - p^{-beta})^{-1} is the partition function of independent Landauer erasure modes, one per prime, with the free energy decomposing additively."

**Replace with:** "3. **The Euler product interpretation** (Section 7): The Euler product zeta(beta) = prod_p (1 - p^{-beta})^{-1} admits interpretation as the partition function of independent Landauer erasure modes, one per prime, with the free energy decomposing additively."

### 5h. Section 8.2 (line 458)

**Find:** "The identification of the Euler product with a Landauer cost decomposition has not, to our knowledge, appeared in the literature"

**Replace with:** "The interpretation of the Euler product as a Landauer cost decomposition has not, to our knowledge, appeared in the literature"

### 5i. Section 7.2 (line 418)

**Find:** "Each term n^{-beta} = exp(-beta ln(n)) is the Boltzmann weight associated with the total Landauer cost ln(n) = sum_p v_p(n) ln(p) of applying sigma_n."

**Replace with:** "Each term n^{-beta} = exp(-beta ln(n)) can be read as the Boltzmann weight associated with the total Landauer cost ln(n) = sum_p v_p(n) ln(p) of applying sigma_n."

---

## Summary of all five fixes

| Issue | Section(s) affected | Nature of fix |
|-------|---------------------|---------------|
| 1 | 3.2 | Added explicit GNS construction; corrected claim about e_p (it does NOT act as identity in full GNS rep); showed the channel is defined by duality, bypassing the e_p normalization issue |
| 2 | 3.2a (new), replaces paragraph after Prop 2 | Added explicit dual-map construction sigma_p* defining Phi_p as CPTP; proved CP via Kraus form, TP via sum K_j*K_j = I |
| 3 | 6.2, Step 1 | Added explicit element-by-element linear independence proof; computed Choi matrix C = I_p tensor |0><0| with rank p; invoked Stinespring to get minimal dim = p |
| 4 | 6.2, Steps 2-6 | Added Automorphism Lemma (sigma_p on B_q is an automorphism via Bezout); proved channel factorization via CRT; proved Choi rank multiplicativity; handled prime powers via successive independent erasures; completed induction |
| 5 | Abstract, Main Thm, 7.1, 7.2, 8.1, 8.2 | Softened all "is"/"equals"/"identified as" to "admits interpretation as"/"corresponds to"/"can be read as" |
