# Complexity Analysis: Entanglement Detection vs. Diophantine Methods for Class Numbers

**Status:** RESOLVED. The entanglement formulation offers NO classical computational advantage. It is strictly harder (exponential vs. polynomial). A quantum advantage exists but is already known (Hallgren 2005) and does not go through Choi state separability.

**Depends on:** test_principality_detection.md, test_functor_hk.md, test_class_number_derivation.md

**Date:** March 24, 2026

---

## 1. Complexity of the Diophantine Approach

For K = Q(sqrt{-d}), an ideal I of norm N is principal iff a^2 + db^2 = N has an integer solution.

### 1.1 Cornacchia's algorithm

Given m, determines whether x^2 + dy^2 = m has a solution and finds (x, y) if so.

- **Time complexity:** O(log^2(m)) arithmetic operations, using the extended Euclidean algorithm on m.
- **Bit complexity:** O(M(log m) * log(log m)) where M(n) is the cost of multiplying n-bit integers. With Schonhage-Strassen, M(n) = O(n log n log log n). So the total is O(log(m) * log(log(m))^2 * log(log(log(m)))).
- **Bottom line:** POLYNOMIAL in log(m). More precisely, nearly linear in the bit-length of m.

For the class number problem: check principality of each prime ideal p with N(p) <= Minkowski bound B_K = (4/pi) * sqrt(|D_K|) (for imaginary quadratic fields).

- Number of primes to check: O(B_K / log(B_K)) by the prime number theorem.
- B_K = O(sqrt(|D_K|)).
- Each check costs O(log^2(N(p))) = O(log^2(B_K)) = O(log^2(|D_K|)).
- Total: O(sqrt(|D_K|) * log(|D_K|)) operations.

This is **sub-exponential in log(|D_K|)** -- specifically, it is O(|D_K|^{1/2 + epsilon}).

For computing the full class group structure (not just h_K), the best unconditional classical algorithms:

- **Buchmann's algorithm (1990):** O(|D_K|^{1/4 + epsilon}) under GRH. Unconditionally, O(|D_K|^{1/2 + epsilon}).
- **Hafner-McCurley (1989):** Subexponential L(1/2, sqrt(2)) = exp(sqrt(2 * log(|D_K|) * log(log(|D_K|)))).

### 1.2 Summary

| Method | Complexity | Class |
|--------|-----------|-------|
| Cornacchia (single norm check) | O(log^2(N)) | P (polynomial in bit-length) |
| Brute-force class number | O(\|D_K\|^{1/2 + epsilon}) | Sub-exponential in log(\|D_K\|) |
| Buchmann (under GRH) | O(\|D_K\|^{1/4 + epsilon}) | Sub-exponential |
| Hafner-McCurley | L(1/2, sqrt(2)) | Sub-exponential |

---

## 2. Complexity of Entanglement Detection

### 2.1 The Choi state construction

For the endomorphism sigma_p^n associated to the n-th power of a prime ideal p, the Choi state lives on a Hilbert space of dimension:

    dim(H) = N(p)^n

The Choi matrix rho is a dim(H)^2 x dim(H)^2 = N(p)^{2n} x N(p)^{2n} matrix (viewing the Choi state as a bipartite state on H tensor H).

Just CONSTRUCTING the Choi matrix requires specifying N(p)^{2n} x N(p)^{2n} = N(p)^{4n} entries. This is exponential in n.

### 2.2 PPT criterion

The positive partial transpose test:

1. Form the partial transpose rho^{T_B} of the Choi state.
2. Check if rho^{T_B} is positive semidefinite.

Step 2 requires computing the eigenvalues of rho^{T_B}, which is an N(p)^{2n} x N(p)^{2n} matrix.

- **Eigenvalue computation:** O(d^3) for a d x d matrix (via QR algorithm or divide-and-conquer).
- **For our case:** d = N(p)^{2n}, so PPT costs O(N(p)^{6n}).

This is **EXPONENTIAL in n**.

### 2.3 PPT sufficiency

PPT is necessary and sufficient for separability only when the bipartite system has dimensions 2x2 or 2x3. For larger systems, PPT-entangled states exist (Horodecki 1997).

For our Choi state on C^{N(p)^n} tensor C^{N(p)^n}:

- If N(p)^n = 2: PPT is necessary and sufficient. This is the case n = 1, N(p) = 2.
- If N(p)^n = 3: PPT is necessary and sufficient (for 3x3, this is still a 2x3 sub-case in certain bipartitions, but in general 3x3 requires more than PPT).
- If N(p)^n >= 4: PPT is NECESSARY but NOT SUFFICIENT. Additional tests (realignment, entanglement witnesses, symmetric extensions) are needed.

### 2.4 General separability detection

**Theorem (Gurvits 2003).** The weak membership problem for the set of separable states is NP-hard. Specifically: given a density matrix rho on C^d tensor C^d and parameters epsilon_1 < epsilon_2, deciding whether rho is within epsilon_1 of a separable state or epsilon_2 from all separable states is NP-hard (with epsilon_2 - epsilon_1 = 1/poly(d)).

**Theorem (Gharibian 2010).** The strong membership problem (epsilon_2 - epsilon_1 = 1/exp(d)) is NP-hard.

For our Choi state, d = N(p)^n, so general separability detection is NP-hard in N(p)^n, which is doubly exponential in n.

### 2.5 Summary

| Method | Complexity | Class |
|--------|-----------|-------|
| Choi matrix construction | O(N(p)^{4n}) | EXP in n |
| PPT test | O(N(p)^{6n}) | EXP in n |
| General separability | NP-hard in N(p)^n | NP-hard (in the matrix dimension) |

---

## 3. The Direct Comparison

### 3.1 The question rephrased

We want to determine: is p^n principal? Equivalently: does a^2 + db^2 = N(p)^n have a solution?

- **Diophantine (Cornacchia):** O(log^2(N(p)^n)) = O(n^2 * log^2(N(p))). POLYNOMIAL in n.
- **PPT on Choi state:** O(N(p)^{6n}). EXPONENTIAL in n.
- **General separability of Choi state:** NP-hard in N(p)^n. At LEAST exponential in n.

**The entanglement detection approach is exponentially worse than the Diophantine approach.**

This is not even close. Cornacchia runs in time polynomial in the bit-length of the input. The entanglement approach requires constructing an exponentially large matrix and then performing at least a cubic computation on it.

### 3.2 The comparison for computing h_K

To compute the full class number, we must check principality of p^n for all primes p up to the Minkowski bound and all n from 1 to some bound.

- **Diophantine:** For each p, the smallest n with p^n principal is at most h_K (since [p]^{h_K} = [1]). Total cost: O(h_K * B_K * log^2(B_K)). For imaginary quadratic fields, h_K = O(sqrt(|D_K|) * log(|D_K|)) (Siegel's theorem, effective under GRH), and B_K = O(sqrt(|D_K|)). Total: O(|D_K| * log^3(|D_K|)).

- **Entanglement:** For each p, construct the Choi state for sigma_{p^n} with n up to h_K. The Choi matrix for sigma_{p^n} has dimension N(p)^n. Even for the smallest nontrivial case (N(p) = 2, n = h_K), the matrix has dimension 2^{h_K}. For h_K growing with |D_K|, this is DOUBLY EXPONENTIAL in the original input.

---

## 4. Does the BC Choi State Have Exploitable Special Structure?

### 4.1 The arithmetic structure

The Choi state of sigma_p^n is not an arbitrary density matrix. It comes from a specific channel determined by the ring structure of O_K/p^n. Potential structural features:

**a) The ring O_K/p^n is a local Artinian ring.** It has a unique maximal ideal (p/p^n) and a filtration:

    O_K/p^n => p/p^n => p^2/p^n => ... => p^{n-1}/p^n => 0

This filtration gives the Choi matrix a BLOCK structure. The partial transpose may respect this filtration, reducing the eigenvalue problem to smaller blocks.

**Size of the reduction:** The filtration has n layers, each of dimension N(p). The block structure could reduce the effective matrix dimension from N(p)^n to n * N(p). But the off-diagonal blocks (mixing different filtration levels) are constrained by the ring multiplication, and their structure is determined by the Teichmuller representatives and the p-adic digit structure.

**Best case for the reduction:** O(n^3 * N(p)^3) instead of O(N(p)^{6n}). This IS polynomial in n (cubic). But it requires proving that the block structure of the partial transpose is sufficient for determining separability.

**b) Symmetry group.** The multiplicative group (O_K/p^n)* acts on O_K/p^n by multiplication. This group has order N(p)^n * (1 - 1/N(p)) (Euler's formula for local rings). This symmetry could be used to reduce the Choi matrix to its irreducible representations.

By Schur's lemma, the Choi matrix decomposes into blocks indexed by irreducible representations of (O_K/p^n)*. The number of irreducible representations of this group is:

- For p unramified: N(p)^{n-1} * (N(p) - 1) representations.
- The trivial representation has multiplicity 1.
- The largest representation has dimension at most N(p) - 1 (for the characters of (O_K/p)* = F_{N(p)}*).

The symmetry reduction brings the problem down to checking positivity on blocks of size at most (N(p) - 1) x (N(p) - 1). This is O(N(p)^3) PER BLOCK, with O(N(p)^{n-1}) blocks. Total: O(N(p)^{n+2}).

This is STILL exponential in n. The symmetry helps by a polynomial factor but does not change the exponential scaling.

**c) Entanglement witnesses.** Instead of full separability detection, one could look for a specific observable W (an entanglement witness) such that Tr(W * rho) < 0 iff rho is entangled.

For the BC Choi state, a natural candidate for W would be constructed from the norm form: W encodes the constraint a^2 + db^2 = N(p)^n. But constructing this W requires solving the very Diophantine equation we are trying to avoid. The witness does not provide a shortcut; it IS the Diophantine problem in matrix language.

### 4.2 Verdict on special structure

The arithmetic structure of the BC Choi state does enable reductions:

| Reduction | Effect | Still exponential? |
|-----------|--------|-------------------|
| Block structure from filtration | N(p)^{6n} -> possibly n^3 * N(p)^3 | NO (if proven) but requires new theorem |
| Symmetry group reduction | N(p)^{6n} -> N(p)^{n+2} | YES |
| Entanglement witness | Depends on witness | Equivalent to Diophantine problem |

The filtration reduction is the only one that COULD bring the complexity down to polynomial. But even if it works, it gives O(n^3 * N(p)^3), which is WORSE than Cornacchia's O(n^2 * log^2(N(p))). Cornacchia is polynomial in log(N(p)); the best possible entanglement reduction is polynomial in N(p) itself -- an exponential gap in the prime size.

---

## 5. Quantum Algorithms

### 5.1 Hallgren's algorithm (2005)

**Theorem (Hallgren 2005).** There exists a polynomial-time quantum algorithm that, given a number field K of constant degree, computes:

- The unit group O_K* (including the fundamental unit for real quadratic fields)
- The class group Cl(O_K)
- The class number h_K

**Complexity:** Polynomial in log(|D_K|) on a quantum computer.

This is a genuine quantum advantage for real quadratic fields, where the best classical algorithm for finding the fundamental unit (equivalently, the regulator R_K) is subexponential.

For imaginary quadratic fields, the quantum advantage is less dramatic because computing h_K is already classically tractable via the class number formula and L-function evaluation.

### 5.2 How Hallgren's algorithm works

Hallgren's algorithm reduces the class group computation to the HIDDEN SUBGROUP PROBLEM (HSP) on a finitely generated abelian group.

The key steps:

1. Define a function f on a lattice L = Z^r (where r depends on the unit rank and class number) that is periodic under a sublattice Lambda.
2. The sublattice Lambda encodes the unit group and class group relations.
3. Use quantum Fourier transform on L to find Lambda.
4. From Lambda, extract the class group and unit group.

The quantum Fourier transform on a lattice L is the step that provides exponential speedup over classical methods. Classically, finding the period of f on a lattice is equivalent to lattice reduction (related to LLL, BKZ), which is subexponential. Quantum mechanically, it is polynomial (via the quantum Fourier transform).

### 5.3 Does Hallgren's algorithm compute Choi state separability?

**No.** Hallgren's algorithm does not construct any Choi state or test any entanglement. It works entirely within the framework of abelian HSP:

- The input is a description of the number field K (the minimal polynomial of a generator and the discriminant).
- The algorithm constructs a periodic function on a lattice.
- The quantum Fourier transform extracts the period.
- The output is the class group structure.

There is no step where a density matrix is formed, no partial transpose is computed, and no separability test is performed.

### 5.4 Could the Choi state formulation provide a NEW quantum algorithm?

For this to work, we would need:

1. A way to PREPARE the Choi state of sigma_p^n on a quantum computer in polynomial time.
2. A quantum separability test that runs in polynomial time.
3. The combination to compute h_K in polynomial time.

**Step 1: State preparation.** The Choi state is rho = (id tensor sigma_p^n)(|Omega><Omega|) where |Omega> = sum_j |j>|j> / sqrt(dim). Preparing this requires:
- Creating the maximally entangled state |Omega>: straightforward, O(dim) = O(N(p)^n) gates.
- Applying sigma_p^n to one subsystem: this requires implementing the arithmetic of O_K/p^n as a quantum circuit.

The issue: the dimension N(p)^n requires n * log(N(p)) qubits, and the circuit depth for implementing the ring multiplication of O_K/p^n is polynomial in n * log(N(p)). So state preparation is POLYNOMIAL in the number of qubits but the number of qubits is LINEAR in n. This is fine.

**Step 2: Quantum separability test.** There is no known polynomial-time quantum algorithm for general separability detection. The best known quantum algorithm for separability testing has complexity:

- **Quantum state tomography + classical post-processing:** O(d^2) copies of rho needed for full tomography, then classical separability (NP-hard). No advantage.
- **SWAP test for symmetric extensions (Doherty-Parrilo-Spedalieri hierarchy):** Each level of the hierarchy is an SDP of increasing size. The k-th level uses k copies of rho and has complexity O(d^{3k}). Convergence to exact separability may require k = O(d) levels. Total: O(d^{3d}), which is worse than exponential.
- **Entanglement witness measurement:** If you KNOW the witness W, measuring Tr(W * rho) requires O(1/epsilon^2) copies for precision epsilon. But choosing the right W is equivalent to the optimization problem that is NP-hard in general.

**Conclusion:** There is no known polynomial-time quantum algorithm for separability detection. The Choi state formulation does NOT provide a route to a quantum algorithm for class numbers.

### 5.5 The fundamental mismatch

Hallgren's algorithm works because the class number problem, when properly formulated, reduces to an ABELIAN hidden subgroup problem, which is efficiently solvable on a quantum computer.

The Choi state separability problem is NOT an instance of HSP. It is a convex optimization problem (deciding membership in the convex set of separable states). These are different computational problems with different complexity profiles:

| Problem | Classical | Quantum |
|---------|-----------|---------|
| Abelian HSP (includes class group) | Subexponential | POLYNOMIAL (Hallgren) |
| Separability detection | NP-hard (Gurvits) | No known polynomial algorithm |
| Cornacchia (single norm equation) | Polynomial | Polynomial (no speedup needed) |

The Choi state formulation maps a problem that is quantum-easy (via HSP) to a problem that is quantum-hard (separability). This is a COMPLEXITY REGRESSION, not an improvement.

---

## 6. Complexity-Theoretic Classification

### 6.1 Are the two formulations in different complexity classes?

**Diophantine formulation (single principality check):**
- Input: integers d, N (with bit-length n = O(log(N))).
- Question: does a^2 + db^2 = N have a solution?
- Complexity class: P (solvable in polynomial time by Cornacchia).

**Entanglement formulation:**
- Input: integers d, N(p), n (so that we check sigma_{p^n}).
- Question: is the Choi state of sigma_{p^n} separable?
- Complexity class: the Choi matrix has dimension N(p)^n, which is exponential in n. Just reading the input to the separability problem takes exponential time. The separability problem on the Choi state is in coNP with respect to the matrix dimension (a separating hyperplane / entanglement witness serves as a certificate for entanglement, checkable in polynomial time in the matrix dimension). But the matrix dimension is EXPONENTIAL in the natural input parameters.

**With respect to the natural parameters (d, N(p), n):**

- Diophantine: in P.
- Entanglement (even just constructing the Choi matrix): in EXP.
- Entanglement (full separability test): in NEXP (since the underlying separability problem is NP-hard in the matrix dimension, and the matrix dimension is exponential in the input).

These are PROVABLY in different complexity classes (P != EXP).

### 6.2 Are they polynomial-time equivalent?

In one direction: given an oracle for the separability problem on BC Choi states, you can solve the Diophantine problem (just construct the Choi state and ask the oracle). But the construction itself is exponential, so even with a free oracle, the reduction is exponential.

In the other direction: given an oracle for Cornacchia, you can determine separability of the BC Choi state (run Cornacchia on a^2 + db^2 = N(p)^n; if it has a solution, the ideal is principal, so p^n ~ (1), so the Choi state should be separable in a specific sense). This direction IS polynomial (Cornacchia is fast, and the answer determines separability).

So: Cornacchia POLYNOMIALLY REDUCES TO Choi separability, but NOT vice versa. The Diophantine problem is strictly easier. The two formulations are NOT polynomial-time equivalent.

### 6.3 Summary

| Formulation | Complexity class (natural parameters) | Relationship |
|-------------|--------------------------------------|-------------|
| Diophantine (Cornacchia) | P | Easiest |
| Class group computation | Sub-exponential (classical), P (quantum) | Intermediate |
| Choi state construction | EXP | Harder |
| Choi state separability | NEXP | Hardest |

---

## 7. What Would Change Everything (And Why It Probably Cannot)

### 7.1 The dream scenario

A polynomial-time algorithm (classical or quantum) that:
1. Takes (d, p, n) as input (O(log(d) + log(p) + log(n)) bits).
2. Without constructing the full Choi matrix, determines separability.
3. Thereby computes whether p^n is principal.

This would require an IMPLICIT separability test: determining separability of a matrix without constructing it, using only a compact description of the channel.

### 7.2 Why this almost certainly fails

The compact description of the channel sigma_{p^n} IS the arithmetic of O_K/p^n. Any algorithm that determines separability from this compact description must, at some point, solve the mathematical problem encoded in the arithmetic. The most efficient known way to do this is... Cornacchia's algorithm.

In other words: the compact description of the Choi state contains the same information as the Diophantine equation. Any shortcut through separability theory would need to extract the answer from this description faster than Cornacchia extracts it from the equation directly. Since Cornacchia already runs in O(log^2(N)) -- nearly linear in the bit-length -- there is essentially no room for improvement.

### 7.3 The information-theoretic argument

The Choi state of sigma_{p^n} is determined by the ring structure of O_K/p^n. This ring structure is determined by the minimal polynomial of sqrt(-d) modulo p^n, which is a polynomial of degree 2 with coefficients mod p^n. The total information content is O(n * log(p)) bits.

Cornacchia's algorithm operates on O(n * log(p)) bits (the number N(p)^n has n * log(p) bits) and runs in time O(n^2 * log^2(p)).

Any separability algorithm must read at least the O(n * log(p)) bits of input. Cornacchia adds only a logarithmic overhead beyond reading the input. You cannot beat "read the input and do a nearly-linear computation on it."

### 7.4 The quantum case

Hallgren's algorithm achieves polynomial time for the GLOBAL class group computation (all primes simultaneously). But for a SINGLE principality check (is p^n principal?), Cornacchia is already polynomial classically. There is no quantum advantage for individual principality checks because the classical algorithm is already efficient.

The quantum advantage appears only for the GLOBAL problem: computing the entire class group structure, including the regulator for real quadratic fields. This global problem is subexponential classically but polynomial quantumly. The Choi state formulation does not help with this global problem because it addresses individual ideals, not the global structure.

---

## 8. Conclusion

### 8.1 The definitive answer

**No. The entanglement detection formulation of the class number problem is computationally HARDER, not easier, than the Diophantine formulation.**

- Cornacchia (Diophantine): O(n^2 * log^2(N(p))). Class P.
- PPT on Choi state: O(N(p)^{6n}). Class EXP.
- Full separability of Choi state: NP-hard in N(p)^n. Class NEXP in natural parameters.

The entanglement formulation is an exponential blowup of a polynomial problem. It encodes a tractable question into an intractable framework.

### 8.2 No rescue from special structure

The arithmetic structure of the BC Choi state (filtration, symmetry group, specific ring structure) provides at most polynomial-factor reductions in the matrix dimension. These do not overcome the fundamental exponential gap between the matrix dimension N(p)^n and the natural parameter size n * log(N(p)).

### 8.3 No rescue from quantum algorithms

- Hallgren's algorithm solves the class group problem in polynomial time but does NOT go through Choi states or separability.
- No known quantum algorithm solves separability in polynomial time.
- The Choi state formulation maps a quantum-easy problem (HSP) to a quantum-hard problem (separability). This is a regression.

### 8.4 What the reformulation IS good for

The Choi state / entanglement reformulation is not computationally useful, but it is CONCEPTUALLY useful:

1. It reveals that principality (the Diophantine condition a^2 + db^2 = N) is equivalent to a quantum information condition (separability of a specific state). This is a structural insight about the relationship between number theory and quantum information.

2. It connects the class group to the entanglement structure of arithmetic channels, providing a new lens on why class numbers measure "how far O_K is from being a PID" -- in quantum terms, "how entangled the arithmetic channels are."

3. It may suggest new THEORETICAL (not computational) connections between algebraic number theory and quantum information theory.

But as a computational tool: Cornacchia wins. Definitively. By an exponential margin.

---

## References

- Cornacchia, G. (1908). "Su di un metodo per la risoluzione in numeri interi dell'equazione..." Giornale di Matematiche di Battaglini, 46, 33-90.
- Gurvits, L. (2003). "Classical deterministic complexity of Edmonds' problem and quantum entanglement." STOC 2003, 10-19.
- Gharibian, S. (2010). "Strong NP-hardness of the quantum separability problem." Quantum Information and Computation, 10(3), 343-360.
- Hallgren, S. (2005). "Fast quantum algorithms for computing the unit group and class group of a number field." STOC 2005, 468-474.
- Horodecki, M., Horodecki, P., Horodecki, R. (1996). "Separability of mixed states: necessary and sufficient conditions." Physics Letters A, 223(1-2), 1-8.
- Hafner, J.L., McCurley, K.S. (1989). "A rigorous subexponential algorithm for computation of class groups." Journal of the AMS, 2(4), 837-850.
- Buchmann, J. (1990). "A subexponential algorithm for the determination of class groups and regulators of algebraic number fields." Seminaire de Theorie des Nombres, Paris.
- Doherty, A.C., Parrilo, P.A., Spedalieri, F.M. (2004). "Complete family of separability criteria." Physical Review A, 69(2), 022308.

---

*Written 2026-03-24. Definitive complexity comparison: the entanglement formulation is exponentially harder than Cornacchia, and no structural shortcut or quantum algorithm rescues it.*
