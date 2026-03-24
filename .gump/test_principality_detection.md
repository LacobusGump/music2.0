# The Test: Can Stinespring Dilations Detect Principality?

## Setup

K = Q(sqrt{-5}), O_K = Z[sqrt{-5}], D_K = -20, h_K = 2.

Class group: Cl(K) = Z/2Z.
- Principal class [1]: contains (1), (3), (2+sqrt{-5}), (2-sqrt{-5}), (3+sqrt{-5}), ...
- Non-principal class [c]: contains (2, 1+sqrt{-5}), (3, 1+sqrt{-5}), (3, 1-sqrt{-5}), ...

Norm form: N(a + b*sqrt{-5}) = a^2 + 5b^2.

Key fact: an ideal I of O_K is principal iff N(I) is representable by a^2 + 5b^2.
(This is exactly what principality means: I = (alpha) iff there exists alpha with
N(alpha) = N(I), i.e., a^2 + 5b^2 = N(I) has an integer solution.)

---

## The Question

For each ideal I, construct:
1. The subalgebra B_I (functions on O_K/I)
2. The erasure channel Phi_I
3. The Stinespring dilation (U_I, H_E)
4. Some structural invariant of the dilation

Then: is there a property of (U_I, H_E) that distinguishes principal from
non-principal, WITHOUT solving the Diophantine equation a^2 + 5b^2 = N(I)?

---

## Step 1: The Erasure Channel for an Ideal

### General construction

For an ideal I with N(I) = n, the quotient ring O_K/I is a finite ring of order n.
The "multiplication by I" map sigma_I: O_K -> O_K sends the subalgebra B_I (the
functions distinguishing cosets of I) to the trivial subalgebra C*1.

Working in the GNS representation: H_S = C^n with basis {|j>_S : j = 0,...,n-1}
labeling the n cosets of I in O_K. The channel is:

    Phi_I(rho) = |0><0|_S    (sends every state to a fixed pure state)

This has n Kraus operators: K_j = |0><j|, j = 0,...,n-1.

### The key observation

At this level of description -- the channel Phi_I acting on the coset space --
EVERY ideal of the same norm n produces the SAME channel. The channel
Phi_I: M_n(C) -> M_n(C) depends only on n = N(I), not on the ideal class of I.

This is because the channel "erase which coset you're in" is the same map
regardless of how the cosets are organized algebraically. It always sends n
basis states to one.

---

## Step 2: The Stinespring Dilation

### Generic dilation (same for all ideals of norm n)

Environment: H_E = C^n. Initial state: |0>_E.

The "canonical" dilation from paper_gap2_stinespring.md is the SWAP-like unitary:

    U|j>_S|k>_E = |k>_S|(j+k) mod n>_E

This works for ANY ideal of norm n. The entropy accounting is:
- System: ln(n) -> 0
- Environment: 0 -> ln(n)
- Total: conserved

### But wait -- there is MORE structure available.

The coset space O_K/I is not just a set of n elements. It is a quotient RING.
For different ideals of the same norm, this ring can have different structure.
The unitary U should respect this ring structure, and THAT is where the
difference might appear.

---

## Step 3: The Ring Structure of O_K/I

This is where the computation gets concrete.

### Case A: I = (3), principal, N(I) = 9

O_K/(3) = Z[sqrt{-5}]/(3).

Since 3 splits in O_K as (3) = (3, 1+sqrt{-5})(3, 1-sqrt{-5}), the Chinese
Remainder Theorem gives:

    O_K/(3) = O_K/(3, 1+sqrt{-5}) x O_K/(3, 1-sqrt{-5}) = F_3 x F_3

where F_3 = Z/3Z. This is a product of two fields. As a ring, it has no
nilpotents. Every element is either a unit or a zero divisor.

The 9 elements are pairs (a, b) with a, b in {0, 1, 2}. The ring has
4 units (the pairs with both components nonzero) and 5 non-units (including
the two idempotents (1,0) and (0,1)).

### Case B: I = p_2^2 where p_2 = (2, 1+sqrt{-5}), principal, N(I) = 4

Wait -- let me reconsider the comparison. We want SAME norm, DIFFERENT class.

The problem identified in the setup is real: for a given norm n, principal
ideals have n representable as a^2 + 5b^2, and non-principal ideals have n
NOT so representable. These are disjoint sets of norms.

### The fundamental obstruction

**Theorem.** In Z[sqrt{-5}], an ideal I of norm n is principal if and only if
n is representable as a^2 + 5b^2 for non-negative integers a, b.

This means: there is NO norm n that has both a principal and a non-principal
ideal. The norm alone determines the class.

Norms of principal ideals: {1, 4, 5, 6, 9, 14, 16, 20, 21, 24, 25, 29, ...}
(values of a^2 + 5b^2)

Norms of non-principal ideals (in the class of (2, 1+sqrt{-5})):
{2, 3, 7, 8, 10, 12, 13, 15, 17, 18, 22, 23, 27, 28, ...}
(values of 2a^2 + 2ab + 3b^2)

These partition the positive integers (with multiplicity considerations).

**This means the direct comparison "same norm, different class" is IMPOSSIBLE
for a single ideal.** You cannot have a principal ideal and a non-principal
ideal with the same norm.

---

## Step 4: Reformulating the Test

Since we cannot compare at the same norm, we reformulate.

### Test A: Compare ideal PRODUCTS

Take p_2 = (2, 1+sqrt{-5}), non-principal, N(p_2) = 2.

Then p_2^2 = (2, 1+sqrt{-5})^2.

Compute: (2, 1+sqrt{-5})^2 = (4, 2(1+sqrt{-5}), (1+sqrt{-5})^2)
        = (4, 2+2*sqrt{-5}, 1+2*sqrt{-5}-5)
        = (4, 2+2*sqrt{-5}, -4+2*sqrt{-5})
        = (4, 2+2*sqrt{-5}, -4+2*sqrt{-5})

Note: -4 + 2*sqrt{-5} = 2(-2+sqrt{-5}) and 2+2*sqrt{-5} = 2(1+sqrt{-5}).
Also 4 = 2*2. So p_2^2 = (4, 2(1+sqrt{-5}), 2(-2+sqrt{-5})) = 2*(2, 1+sqrt{-5}, -2+sqrt{-5}).

But (2, 1+sqrt{-5}, -2+sqrt{-5}) = (2, 1+sqrt{-5}) since -2+sqrt{-5} =
-(1+sqrt{-5}) + (-1+2*sqrt{-5})... Let me just verify: N(p_2^2) = N(p_2)^2 = 4.

And p_2^2 is in the principal class (since [p_2]^2 = [1] in Z/2Z).

In fact, p_2^2 = (2). Verification: N(p_2^2) = 4 = N((2)), and (2) is
principal. Since there is a unique ideal of norm 4 in the principal class,
p_2^2 = (2).

So: the composition Phi_{p_2} . Phi_{p_2} implements the same coset-erasure
as Phi_{(2)}. But the DILATION ROUTES are different:

- Route 1: Dilate Phi_{(2)} directly. One unitary U_{(2)} on H_S tensor H_E
  with H_E = C^4.

- Route 2: Dilate Phi_{p_2} twice. Two sequential unitaries, each on
  H_S tensor C^2. Total environment: C^2 tensor C^2 = C^4.

### Explicit computation: Route 1

H_S = C^4 (cosets of (2) in O_K, which is O_K/2*O_K).

O_K/(2) = Z[sqrt{-5}]/(2) = Z[x]/(x^2+5, 2) = F_2[x]/(x^2+1) = F_2[x]/(x+1)^2.

(Since x^2+1 = (x+1)^2 over F_2.)

So O_K/(2) = F_2[x]/(x+1)^2, which is a LOCAL ring of order 4 with maximal
ideal m = ((x+1)) = (sqrt{-5}+1 mod 2). This has:
- 2 units: {1, 1+(x+1)} = {1, x} = {1, sqrt{-5} mod 2}...

Wait, let me be more careful. F_2[x]/(x+1)^2 has elements {0, 1, (x+1), 1+(x+1)}.
Units are those not in the maximal ideal (x+1), so: {1, 1+(x+1)}. That is 2 units.
And |(F_2[x]/(x+1)^2)*| = 2.

The ring is NOT semisimple. It has a nilpotent element: (x+1)^2 = 0.

The dilation U_{(2)}: H_S = C^4, H_E = C^4.

    U_{(2)}|j>_S|k>_E = |k>_S|(j+k) mod 4>_E

(Using the additive group structure of the coset space Z/4Z... but wait,
O_K/(2) as an additive group is (Z/2Z)^2, not Z/4Z.)

**Critical distinction:** O_K/(2) = F_2[x]/(x+1)^2 has additive group (Z/2Z)^2
(since char = 2, every element has order 2 under addition). So the 4 cosets form
the group (Z/2Z)^2, not Z/4Z.

Label the cosets as |00>, |01>, |10>, |11> (using the two F_2-coordinates).

The SWAP-type unitary on (Z/2Z)^2 is:

    U_{(2)}|j>_S|k>_E = |k>_S|j XOR k>_E

where XOR is componentwise addition mod 2. (This is the natural generalization
of |(j+k) mod n> to an arbitrary finite abelian group.)

### Explicit computation: Route 2

Step 1: Dilate Phi_{p_2} on the 2-element coset space O_K/p_2.

O_K/p_2 = O_K/(2, 1+sqrt{-5}) = F_2 (as computed: since 1+sqrt{-5} = 0 mod p_2
and 2 = 0 mod p_2, the quotient is F_2 with sqrt{-5} = 1 mod p_2... but
1^2 + 5 = 6 = 0 mod 2, consistent).

Wait -- O_K/p_2 has order N(p_2) = 2, so it is F_2.

H_S^{(1)} = C^2, H_E^{(1)} = C^2.

    U_{p_2}|j>_S|0>_E = |0>_S|j>_E,    j in {0,1}

Full unitary: U_{p_2}|j>|k> = |k>|(j+k) mod 2>.  (= |k>|j XOR k>)

Step 2: After erasing p_2 once, the remaining "which-coset" information lives
in H_E^{(1)}. Now erase again with a second copy of p_2.

But this is where it gets subtle. The second erasure acts on the QUOTIENT of the
first quotient. That is:

    O_K -> O_K/p_2 -> O_K/p_2^2

The first step erases the p_2-coset label (2 cosets). The second step erases
the p_2/p_2^2-coset label within O_K/p_2 (another 2 cosets).

So the total dilation is:

    U_total = (I_S tensor U_{p_2}^{(2)}) . (U_{p_2}^{(1)} tensor I_{E_2})

acting on H_S tensor H_{E_1} tensor H_{E_2} = C^4 tensor C^2 tensor C^2.

Hmm, but the system space changes dimension between steps. Let me be precise.

**Step 1:** The system is H_S = C^4 (the 4 cosets of (2) = p_2^2 in O_K).
The first erasure groups these into p_2-cosets-of-p_2^2-cosets, which is a
2-element quotient. Concretely:

The 4 cosets of p_2^2 in O_K map to 2 cosets of p_2 in O_K. So the map
O_K/p_2^2 -> O_K/p_2 is 2-to-1. Label the 4 cosets as {|0>, |1>, |2>, |3>}
such that |0>,|1> map to the first p_2-coset and |2>,|3> map to the second.

The first erasure channel Phi_1: M_4 -> M_4 maps:
    |0>,|1> -> |0>  (first p_2-coset)
    |2>,|3> -> |2>  (second p_2-coset)

This is a PARTIAL erasure: it erases the within-p_2-coset label but preserves
the between-p_2-coset label. It has 2 Kraus operators per coset...

Actually, this is getting complicated because the erasure is not total at each
step. Let me restructure.

### The clean comparison: tensor factored vs. unfactored dilation

The real question reduces to this:

**Dilation A (Direct):**
    Phi_{(2)}: C^4 -> C^4 is the total erasure channel (all 4 cosets -> one state).
    Kraus operators: K_j = |0><j|, j = 0,1,2,3.
    Dilation: one unitary U_A on C^4 tensor C^4.

**Dilation B (Factored through p_2 twice):**
    Phi_{(2)} = Phi_{p_2} . Phi_{p_2/p_2^2}
    where Phi_{p_2/p_2^2} erases the within-p_2-coset label (2 Kraus ops),
    and Phi_{p_2} erases the between-p_2-cosets label (2 Kraus ops).
    Dilation: two sequential unitaries, total environment C^2 tensor C^2 = C^4.

Both produce Phi_{(2)} as the reduced channel. Both use total environment
dimension 4. Are the dilations unitarily equivalent?

---

## Step 5: The Explicit Comparison

### Dilation A (direct, reflecting the principal generator alpha = 2)

Since (2) is generated by alpha = 2, the endomorphism sigma_{(2)} is
"multiplication by 2 mod cosets." On the coset space O_K/(2) = (Z/2Z)^2,
this maps everything to the zero coset.

Kraus operators: K_j = |0><j|, j in (Z/2Z)^2 = {00, 01, 10, 11}.

Unitary dilation (using the (Z/2Z)^2 group structure):

    U_A|j>_S|k>_E = |k>_S|j XOR k>_E

where j, k in (Z/2Z)^2 and XOR is componentwise.

Check: U_A|j>|00> = |00>|j>, so Tr_E[U_A(rho tensor |00><00|)U_A*] = |00><00|. Good.

**Structure of U_A:** This is a CONTROLLED-SWAP, or equivalently, a
controlled-NOT on each of the two qubit pairs. Writing j = (j_1, j_2) and
k = (k_1, k_2):

    U_A|(j_1,j_2)>_S|(k_1,k_2)>_E = |(k_1,k_2)>_S|(j_1 XOR k_1, j_2 XOR k_2)>_E

This is **CNOT_1 tensor CNOT_2** (two parallel CNOT gates), followed by a SWAP
of the system and environment registers.

Actually, more precisely: U_A = SWAP . (CNOT tensor CNOT) where each CNOT
acts on one qubit of S and the corresponding qubit of E.

But we can also write it as: U_A = SWAP_{SE} . XOR_{SE}, where XOR_{SE} means
"XOR the system register into the environment register."

**Key property of U_A:** It factors as a tensor product of two independent
2-dimensional operations:

    U_A = U_A^{(1)} tensor U_A^{(2)}

where U_A^{(i)} acts on the i-th qubit of S and the i-th qubit of E by:

    U_A^{(i)}|j_i>|k_i> = |k_i>|j_i XOR k_i>

This is because (Z/2Z)^2 = (Z/2Z) x (Z/2Z) and the group operation is
componentwise.

### Dilation B (factored through the non-principal ideal p_2)

Step 1: Erase the p_2-fiber. The quotient O_K/p_2^2 -> O_K/p_2 is 2-to-1.

The ideal p_2 = (2, 1+sqrt{-5}). The tower O_K/p_2^2 has a filtration:

    0 -> p_2/p_2^2 -> O_K/p_2^2 -> O_K/p_2 -> 0

As additive groups: p_2/p_2^2 = F_2 (1-dimensional over the residue field F_2),
and O_K/p_2 = F_2. So O_K/p_2^2 is a length-2 extension.

Concretely: O_K/p_2^2 = O_K/(2) = F_2[x]/(x+1)^2 where x = sqrt{-5}.
Write t = x+1 (so t^2 = 0). Elements: {0, 1, t, 1+t}. The maximal ideal is
(t) = {0, t} = p_2/p_2^2. The quotient by (t) is F_2 = O_K/p_2.

The map O_K/(2) -> O_K/p_2 sends each element to its class mod (t):
    0, t -> class 0
    1, 1+t -> class 1

So the 4 cosets of (2) split into two pairs under p_2:
    Fiber over 0: {|0>, |t>}     (= {|00>, |01>} if we write elements as (a,b) in F_2^2)
    Fiber over 1: {|1>, |1+t>}   (= {|10>, |11>})

**First erasure** (within fibers): erase the "t-component."

Kraus operators for the first step:
    K_0^{(1)} = |0><0| + |1><1|     (project out the t=0 component from each fiber)
    K_1^{(1)} = |0><t| + |1><1+t|   (project out the t=1 component)

Wait -- I need to be more careful. The first erasure should map each fiber
{|a>, |a+t>} to |a>. So:

    Phi_1: |a><a| -> (1/2)(something)...

No. The erasure channel sends the full 4x4 state to a 2x2 state (the
coset-of-p_2 labels). In terms of a channel on C^4:

    Phi_1(rho) = sum_j K_j^{(1)} rho (K_j^{(1)})* where K_j^{(1)} maps the
    fiber element to the base.

Let me use the ordered basis {|0>, |t>, |1>, |1+t>} = {|0>, |1>, |2>, |3>}
(relabeling for clarity):

    Fiber 0: {|0>, |1>} -> base point |0>
    Fiber 1: {|2>, |3>} -> base point |2>

Kraus operators:
    K_0^{(1)} = |0><0| + |2><2|    (picks the "first" element from each fiber)
    K_1^{(1)} = |0><1| + |2><3|    (picks the "second" element, maps to base)

Check: K_0 rho K_0* + K_1 rho K_1* projects onto the base subspace and sums
over fibers. For rho = |j><j|:
    j=0: K_0|0> = |0>, K_1|0> = 0 -> output |0><0|
    j=1: K_0|1> = 0, K_1|1> = |0> -> output |0><0|
    j=2: K_0|2> = |2>, K_1|2> = 0 -> output |2><2|
    j=3: K_0|3> = 0, K_1|3> = |2> -> output |2><2|

Good: fibers {0,1} -> |0><0|, fibers {2,3} -> |2><2|. The within-fiber
information is erased; the between-fiber information is preserved.

**Dilation of step 1:** Environment H_{E_1} = C^2.

    V_1|j>_S|0>_{E_1} = K_0^{(1)}|j> tensor |0>_{E_1} + K_1^{(1)}|j> tensor |1>_{E_1}

Explicitly:
    V_1|0>|0> = |0>|0>
    V_1|1>|0> = |0>|1>       (fiber info dumped to environment)
    V_1|2>|0> = |2>|0>
    V_1|3>|0> = |2>|1>       (fiber info dumped to environment)

Extend to a unitary on C^4 tensor C^2 (8-dimensional):
    V_1|0>|0> = |0>|0>     V_1|0>|1> = |1>|0>
    V_1|1>|0> = |0>|1>     V_1|1>|1> = |1>|1>
    V_1|2>|0> = |2>|0>     V_1|2>|1> = |3>|0>
    V_1|3>|0> = |2>|1>     V_1|3>|1> = |3>|1>

Check unitarity: the 8 output vectors are |0>|0>, |0>|1>, |1>|0>, |1>|1>,
|2>|0>, |2>|1>, |3>|0>, |3>|1> -- all distinct basis vectors. Unitary? Yes,
it is a permutation of the 8 basis states.

**Second erasure** (between fibers): the 2-dimensional base space {|0>, |2>}
(representing O_K/p_2 = F_2) is now erased to a single state.

Kraus operators:
    K_0^{(2)} = |0><0| (on the base space, restricted to {|0>, |2>})
    K_1^{(2)} = |0><2|

But these act on the full C^4, so:
    K_0^{(2)} = |0><0| (identity on |0>, kills |2>)
    K_1^{(2)} = |0><2| (maps |2> to |0>)

(On the off-fiber elements |1>, |3>, these give 0, but after step 1, the
system state is supported only on {|0>, |2>}.)

**Dilation of step 2:** Environment H_{E_2} = C^2.

    V_2|0>|0>_{E_2} = |0>|0>_{E_2}
    V_2|2>|0>_{E_2} = |0>|1>_{E_2}

(For states |1>, |3> which shouldn't appear after step 1, extend arbitrarily
to make V_2 unitary on C^4 tensor C^2.)

**Total dilation B:**

    U_B = (I_{E_1} tensor V_2) . (V_1 tensor I_{E_2})

acting on C^4_S tensor C^2_{E_1} tensor C^2_{E_2} = C^4 tensor C^4.

Tracing the action on |j>_S|0>_{E_1}|0>_{E_2}:

    |0>|00> -> V_1: |0>|0>|0>_{E_2} -> V_2: |0>|0>|0> = |0>|00>
    |1>|00> -> V_1: |0>|1>|0>_{E_2} -> V_2 on S,E_2: |0>|1>|0> = |0>|10>
    |2>|00> -> V_1: |2>|0>|0>_{E_2} -> V_2: |0>|0>|1>_{E_2} = |0>|01>
    |3>|00> -> V_1: |2>|1>|0>_{E_2} -> V_2: |0>|1>|1>_{E_2} = |0>|11>

So: U_B|j>_S|00>_E = |0>_S|f(j)>_E where:
    f(0) = 00, f(1) = 10, f(2) = 01, f(3) = 11

In other words, f is a PERMUTATION of the environment labels. The map j -> f(j) is:
    00 -> 00
    01 -> 10     (swap the two bits)
    10 -> 01     (swap the two bits)
    11 -> 11

This is the SWAP operation on the two environment qubits (swapping E_1 and E_2).

### Dilation A's action on |j>|00>:

    U_A|j>|00> = |00>|j XOR 00> = |00>|j> = |0>_S|j>_E

So U_A sends |j>|00> to |0>|j> with the IDENTITY map j -> j on the environment.

### Dilation B's action on |j>|00>:

    U_B|j>|00> = |0>|f(j)> where f = SWAP on the two qubits.

---

## Step 6: Are the Dilations Unitarily Equivalent?

Two dilations of the same channel are unitarily equivalent iff they are related
by a unitary W on the environment space such that:

    U_B|psi>_S|0>_E = (I_S tensor W) U_A|psi>_S|0>_E    for all |psi>

We need:

    |0>|f(j)> = (I tensor W)|0>|j> = |0> tensor W|j>

for all j. So W|j> = |f(j)>. Since f = SWAP, we need W = SWAP.

**SWAP is a unitary on C^2 tensor C^2.** Therefore:

    U_B = (I_S tensor SWAP_E) . U_A   (on the subspace H_S tensor |0>_E)

**The two dilations ARE unitarily equivalent**, related by the SWAP unitary on the
environment.

---

## Step 7: Why They Must Be Equivalent (General Argument)

This was inevitable. Here is why:

**Theorem (Uniqueness of minimal Stinespring dilation).** If two isometries
V_1, V_2: H -> H tensor K both dilate the same CPTP map Phi, and both are
minimal (i.e., the environment spaces have the same dimension = Kraus rank of Phi),
then there exists a unitary W on K such that V_2 = (I tensor W) V_1.

Both dilations A and B produce the SAME channel Phi_{(2)}: the total erasure
of 4 cosets. Both use environment dimension 4 (the Kraus rank). Therefore they
are unitarily equivalent by Stinespring uniqueness.

**The class structure of I is invisible in the dilation of the TOTAL channel
Phi_I.** This is because the dilation depends only on the channel, and the
channel depends only on the norm (how many cosets are erased).

---

## Step 8: Where IS the Principality Information?

If the dilation of the total channel cannot see principality, where does the
class group hide?

### Answer: in the FACTORIZATION of the channel.

The principal ideal (2) factors as p_2^2 where p_2 is non-principal.
The principal ideal (3) factors as q_1 * q_2 where q_1, q_2 are non-principal.

For a principal ideal (alpha), the factorization into prime ideals has the form:

    (alpha) = product of prime ideals

and the product of ideal classes equals the trivial class:

    [p_1]^{a_1} * [p_2]^{a_2} * ... = [1]   in Cl(K)

This is a CONSTRAINT on the exponents. For h_K = 2 (class group Z/2Z), it
means: the total number of non-principal prime factors (counted with multiplicity)
must be EVEN.

### Where this shows up in dilations:

The factored dilation U_B = V_2 . V_1 passes through intermediate channels:

    Phi_{(2)} = Phi_{p_2} . Phi_{p_2}

The intermediate space (after one application of Phi_{p_2}) carries the
PARTIAL information: the between-fiber label. This intermediate information
is the "which p_2-coset" label.

For a non-principal ideal of norm 4 (if one existed), we would need a
different factorization. But N(I) = 4 with I non-principal would require
4 = 2a^2 + 2ab + 3b^2 for some integers a,b. Checking: b=0 gives 2a^2 = 4,
a^2 = 2, no. b=1 gives 2a^2 + 2a + 3 = 4, 2a^2 + 2a = 1, no integer solution.
b=-1: same. So there IS no non-principal ideal of norm 4.

### The real invariant: the intermediate factorization structure.

Given a channel Phi of Kraus rank n, the ways to factor it as a composition
of smaller channels:

    Phi = Phi_k . Phi_{n/k}

correspond to intermediate subalgebras (equivalently, to factorizations of the
ideal I into products of smaller ideals). The CLASS of the intermediate ideal
is an invariant of the factorization path, not of the total channel.

**Analogy:** The total channel Phi_{(2)} is like a number (4). Its dilation is
like the number's magnitude. But the factorization 4 = 2 x 2 (through
non-principal intermediates) vs. 4 = 4 (directly, as a principal ideal with
generator 2) carries the arithmetic information. Both give the same product,
but the path through the class group is different.

---

## Step 9: The Verdict

### Can you detect principality from the Stinespring dilation of the total channel?

**NO.**

The Stinespring dilation of the erasure channel Phi_I depends only on N(I)
(the number of cosets erased). By Stinespring uniqueness, all minimal dilations
of the same channel are unitarily equivalent. Since the channel is determined by
N(I) alone, the dilation cannot distinguish ideal classes.

### What CAN detect principality?

The **factorization structure** of the channel through intermediate channels.

Specifically: given the total erasure Phi_I with N(I) = n, ask whether it factors as

    Phi_I = Phi_{I_1} . Phi_{I_2}    with N(I_1)*N(I_2) = n

and examine the DILATIONS OF THE INTERMEDIATE CHANNELS.

For the principal ideal (2):
- Direct: Phi_{(2)} has dilation U_A. The "single generator" alpha = 2
  means the erasure is implemented by ONE multiplication. The system
  qubit (j_1, j_2) -> (0, 0) is done in one step.

- Factored: Phi_{(2)} = Phi_{p_2} . Phi_{p_2}. Two successive non-principal
  erasures. Each intermediate dilation has its own environment qubit.
  The SWAP relating U_A to U_B reflects the fact that the two non-principal
  factors are conjugate (they swap roles under the class group involution).

For a truly non-principal ideal, say p_2 = (2, 1+sqrt{-5}) of norm 2:
- Its channel Phi_{p_2} has Kraus rank 2.
- It CANNOT be written as Phi_{p_2} = multiplication by a single alpha
  (no alpha in O_K has N(alpha) = 2).
- But the dilation of Phi_{p_2} is still just a 2-dimensional SWAP, same
  as any norm-2 erasure.

### The fundamental impossibility:

Principality is about the EXISTENCE of a generator: I = (alpha) for some
alpha in O_K. This is equivalent to the Diophantine equation N(alpha) = N(I),
i.e., a^2 + 5b^2 = N(I).

The Stinespring dilation sees only the DIMENSION of the erasure (= N(I)) and
the GROUP STRUCTURE of the coset space. It does not see whether that group
arises from a single generator or from multiple generators. The "shape" of the
dilation is determined by the abstract group O_K/I, not by the internal
structure of I as a submodule of O_K.

### The deeper point:

This is not a failure of the framework -- it is a THEOREM about what dilations
can see. The class group is a **global** invariant (it measures the obstruction
to all ideals being principal), while the Stinespring dilation is a **local**
construction (it depends only on the channel at hand).

To detect the class group from dilations, you would need to examine the
**space of all channels simultaneously** -- specifically, the monoidal
structure of the category of O_K-module channels, where tensor product
corresponds to ideal multiplication. The class group is pi_0 of the
invertible objects in this monoidal category. No single dilation can see it;
you need the entire category.

### Formal statement:

**Theorem.** Let K be a number field with ring of integers O_K. For ideals
I, J of O_K with N(I) = N(J), the minimal Stinespring dilations of the
erasure channels Phi_I, Phi_J are unitarily equivalent, regardless of
whether I and J are in the same ideal class.

**Proof.** Both channels erase to a single state from an n-dimensional space
(n = N(I) = N(J)). They have the same Kraus rank n. By Stinespring uniqueness,
their minimal dilations are unitarily equivalent. QED.

**Corollary.** Principality of an ideal cannot be detected from the Stinespring
dilation of its erasure channel alone.

**Corollary.** The class number h_K cannot be computed by examining individual
dilations. It requires examining the **multiplicative structure** of the
ideal monoid -- specifically, which compositions of channels factor through
intermediate channels of which dimensions.

---

## Step 10: What This Means for the Program

The test from `test_class_number_derivation.md` concluded that h_K = 2 cannot
be derived purely from Stinespring. This computation makes the obstruction
**precise**:

1. Individual dilations see only N(I). They cannot see [I] in Cl(K).

2. The class group lives in the **compositional structure**: which channels
   compose to give which other channels, and through what intermediaries.

3. To extract h_K from quantum information theory, you would need a theorem
   of the form: "The number of isomorphism classes of minimal factorizations
   of the identity channel on O_K equals h_K." This is just the definition
   of the class group in channel language.

4. The Diophantine equation a^2 + 5b^2 = n is equivalent to asking whether
   the norm-n channel factors as "multiplication by a single element." This
   is a question about the monoidal category of O_K-modules, not about any
   single object in it.

**Bottom line:** Stinespring dilation is the wrong level of structure to see
ideal classes. You need the **monoidal category of channels** (i.e., the
multiplicative structure of ideals). The class group is pi_0 of the Picard
groupoid of O_K-modules. No single dilation -- no matter how carefully
constructed -- can access this global invariant. It is like trying to determine
whether a manifold is simply connected by examining a single chart.

---

*Computed 2026-03-24. Explicit verification that Stinespring uniqueness forces
dilations to be class-blind, with the principality information residing instead
in the compositional/monoidal structure of the ideal category.*
