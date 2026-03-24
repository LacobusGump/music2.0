# Modular Time in the Primon Gas: Prime Factorization of Thermal Time Evolution

**James McCandless**
beGump LLC, Columbus NJ
jim@begump.com

**Draft — March 24, 2026**

---

## Abstract

We compute the Connes-Rovelli modular flow for the primon gas (Julia 1990) and show that thermal time evolution decomposes as a tensor product of independent oscillations indexed by primes. Each prime p contributes an independent oscillator at frequency β·ln(p). This factorization is exact and follows from the Euler product representation of the Riemann zeta function. We verify the KMS condition and analyze the Hagedorn transition at β=1, where the thermal time interpretation breaks down. We note that this computation, while straightforward, does not appear in the existing literature connecting the thermal time hypothesis to number-theoretic quantum statistical mechanics. We discuss the physical interpretation and its limitations honestly.

---

## 1. Introduction

The primon gas, introduced by Julia (1990), is a quantum statistical mechanical system whose partition function is the Riemann zeta function. Independently, Connes and Rovelli (1994) proposed the thermal time hypothesis: in generally covariant quantum systems, time is not fundamental but emerges as the modular automorphism flow of the thermodynamic state, via the Tomita-Takesaki theorem.

Both constructions are well-established in their respective literatures. The primon gas has been studied by Julia (1990), Spector (1990), Bakas and Bowick (1991), and others. The thermal time hypothesis has been developed by Connes and Rovelli (1994) and further explored within loop quantum gravity.

To our knowledge, no published work computes the modular flow of the primon gas explicitly or interprets the result through the thermal time hypothesis. This paper performs that computation.

We emphasize at the outset: the primon gas is a mathematical construction, not a model of a known physical system. The results here are theorems about a specific mathematical object, not claims about the physical universe. Whether these results have physical significance beyond the model is an open question that we do not resolve.

---

## 2. Setup

### 2.1 The Primon Gas

The Hilbert space is:

**H** = ⊗_p **H**_p

where the tensor product runs over all primes p, and each **H**_p is a bosonic Fock space with occupation number N_p = 0, 1, 2, ...

A basis state |n⟩ corresponds to the integer n via its prime factorization:

n = ∏_p p^(a_p)  ⟹  |n⟩ = ⊗_p |a_p⟩

The Hamiltonian is:

H = ∑_p ln(p) · N_p

This gives eigenvalue H|n⟩ = ln(n)|n⟩, since ln(n) = ∑_p a_p · ln(p) by the fundamental theorem of arithmetic.

The partition function at inverse temperature β is:

Z(β) = Tr(e^(-βH)) = ∑_{n=1}^∞ n^(-β) = ζ(β)

This converges for β > 1 and equals the Riemann zeta function.

The Euler product representation is:

ζ(β) = ∏_p (1 - p^(-β))^(-1)

which follows from expanding each geometric series and using unique factorization.

### 2.2 The Thermal Time Hypothesis

Given a von Neumann algebra **M** acting on a Hilbert space, and a faithful normal state ω on **M**, the Tomita-Takesaki theorem guarantees the existence of a one-parameter automorphism group σ_t of **M**, called the modular automorphism group.

The Connes-Rovelli thermal time hypothesis (1994) proposes that this modular flow IS physical time — not a background parameter, but an emergent feature of the thermodynamic state.

For a KMS (Kubo-Martin-Schwinger) state at inverse temperature β, the modular Hamiltonian is:

K = βH

and the modular flow is:

σ_t(A) = e^(iKt) A e^(-iKt) = e^(iβHt) A e^(-iβHt)

This is a standard result (Haag, Hugenholtz, and Winnink, 1967; Takesaki, 1970).

---

## 3. The Computation

### 3.1 The KMS State

The primon gas at inverse temperature β > 1 has the KMS state:

ω_β(A) = Z(β)^(-1) · Tr(e^(-βH) A)

In the energy eigenbasis:

ρ_β = ζ(β)^(-1) · ∑_{n=1}^∞ n^(-β) |n⟩⟨n|

### 3.2 The Modular Flow

The modular Hamiltonian is K = βH. The modular flow acts on basis operators as:

σ_t(|n⟩⟨m|) = e^(iβHt) |n⟩⟨m| e^(-iβHt) = e^(iβ·ln(n)·t) · e^(-iβ·ln(m)·t) |n⟩⟨m|

Therefore:

**σ_t(|n⟩⟨m|) = (n/m)^(iβt) · |n⟩⟨m|**

This is the central equation.

### 3.3 Prime Factorization of the Flow

Since n = ∏_p p^(a_p), we have:

n^(iβt) = ∏_p p^(i·a_p·β·t)

The time evolution operator factors as:

**e^(-iβHt) = ∏_p e^(-iβ·ln(p)·N_p·t) = ∏_p p^(-iβ·N_p·t)**

This is a tensor product of independent unitary evolutions, one per prime. Each prime p generates an independent oscillation with fundamental angular frequency:

**ω_p = β · ln(p)**

The factorization is exact because the occupation number operators commute: [N_p, N_q] = 0 for all primes p ≠ q.

**Theorem 1.** The modular flow of the primon gas at inverse temperature β decomposes as a tensor product of independent oscillations indexed by primes:

σ_t = ⊗_p σ_t^(p)

where σ_t^(p) acts only on the p-th Fock space with frequency β·ln(p).

*Proof.* Follows immediately from H = ∑_p ln(p)·N_p, the commutativity [N_p, N_q] = 0, and the definition of the modular flow as σ_t(A) = e^(iKt) A e^(-iKt) with K = βH. □

### 3.4 Fundamental Frequencies

The first four prime frequencies are:

| Prime p | ω_p = β·ln(p) | Ratio to ω_2 |
|---------|---------------|---------------|
| 2 | 0.693β | 1.000 |
| 3 | 1.099β | 1.585 |
| 5 | 1.609β | 2.322 |
| 7 | 1.946β | 2.807 |

These ratios are irrational. No two prime oscillators are commensurate. The combined oscillation is quasi-periodic — it never exactly repeats.

---

## 4. Verification of the KMS Condition

The KMS condition at inverse temperature β requires:

ω_β(A · σ_(iβ)(B)) = ω_β(B · A)

for all operators A, B.

For A = |n⟩⟨n'| and B = |m⟩⟨m'|:

σ_(iβ)(B) = (m/m')^(iβ·(iβ)) · |m⟩⟨m'| = (m/m')^(-β²) · |m⟩⟨m'|

Wait — let us compute more carefully.

σ_t(B) = (m/m')^(iβt) · |m⟩⟨m'|

Analytically continuing t → iβ:

σ_(iβ)(B) = (m/m')^(iβ·iβ) · |m⟩⟨m'| = (m/m')^(-β²) · |m⟩⟨m'|

But this is not the standard form. The KMS condition uses the modular parameter, not the physical temperature. For the modular flow with K = βH, the KMS condition is at parameter 1 (not β):

ω_β(A · σ_i(B)) = ω_β(B · A)

σ_i(|m⟩⟨m'|) = (m/m')^(iβ·i) · |m⟩⟨m'| = (m/m')^(-β) · |m⟩⟨m'|

Let A = |k⟩⟨n| and B = |n⟩⟨k|:

Left side: ω_β(|k⟩⟨n| · (n/k)^(-β) · |n⟩⟨k|) = (n/k)^(-β) · ω_β(|k⟩⟨k|) = (n/k)^(-β) · k^(-β)/ζ(β)
= n^(-β) · k^(-β) · k^β / ζ(β) = n^(-β) / ζ(β)

Right side: ω_β(|n⟩⟨k| · |k⟩⟨n|) = ω_β(|n⟩⟨n|) = n^(-β) / ζ(β)

Left = Right. KMS verified. □

---

## 5. The Hagedorn Transition

The partition function Z(β) = ζ(β) has a simple pole at β = 1:

ζ(β) ~ 1/(β - 1) as β → 1+

As β → 1+:
- Z(β) → ∞
- The density matrix ρ_β spreads over all integers and ceases to be normalizable
- No KMS state exists at β ≤ 1

This is a Hagedorn transition: the density of states g(E) = #{n : ln(n) ≤ E} = ⌊e^E⌋ grows exponentially, overwhelming the Boltzmann suppression at β = 1.

**Interpretation within the thermal time framework:**

For β > 1: the KMS state exists, the modular flow is well-defined, and thermal time "runs." Each prime oscillates independently.

At β = 1: the state ceases to exist. The modular flow loses its thermodynamic interpretation. Thermal time breaks down.

For β < 1: no thermal state, no modular flow, no thermal time. The primon gas is in a "pre-time" regime where the partition function diverges and the prime decomposition of equilibrium is undefined.

**We note without interpreting:** The boundary β = 1 is determined by the prime number theorem — it is the density of primes that causes the divergence. The boundary of thermal time, in this model, is set by the distribution of primes.

---

## 6. Discussion

### 6.1 What This Computation Shows

The modular flow of the primon gas decomposes exactly over primes. This is Theorem 1 above. The computation is straightforward and the result is not surprising — it follows from the fundamental theorem of arithmetic. The contribution of this paper is performing the computation explicitly in the thermal time framework and noting that it does not appear in the existing literature.

### 6.2 What This Computation Does Not Show

The primon gas was constructed to have the integers as its spectrum. The prime factorization of the flow is therefore built into the model by construction. The dynamics does not "discover" primes — it inherits them from the Hamiltonian.

We cannot conclude from this computation that:
- Physical time factors over primes in the actual universe
- The primon gas describes any known physical system
- The Riemann hypothesis has physical significance for the flow of time

### 6.3 What Might Be Worth Investigating

Several questions arise from this computation that we cannot answer:

1. **Physical relevance.** Are there physically realized quantum systems whose partition functions have Euler-type products? If so, their thermal time would factor over the primes of that product. Candidate systems: those with multiplicative spectral structure arising from tensor product decomposition.

2. **The Hagedorn boundary.** The primon gas thermal time breaks down at β = 1, a boundary determined by the density of primes. In physical systems with Hagedorn transitions (string theory, QCD), does the location of the transition have number-theoretic structure?

3. **Continuous-spectrum limit.** As the spacing between energy levels approaches zero (the "thermodynamic limit" of a box growing to infinite size), the discrete prime structure of the spectrum blurs into a continuum. Does the prime factorization of the flow survive in any form in this limit, or does it genuinely disappear?

4. **Connection to the Riemann hypothesis.** The non-trivial zeros of ζ(s) control the fine structure of correlations in the primon gas. If the Riemann hypothesis is true, these zeros all lie on the critical line Re(s) = 1/2, which could be interpreted as a symmetry of the modular flow. Whether this interpretation yields new insight into RH or is merely a restatement is unclear.

### 6.4 Origin of This Work

This computation arose from a project to build a musical instrument controlled by body movement (GUMP — Grand Unified Music Project, begump.com). The question of why certain harmonic intervals (those corresponding to small primes) produce more stable and recognizable musical structure led to an investigation of the role of primes in physical systems, which led to the primon gas, which led to the thermal time connection.

The author is a drummer and drum teacher, not a mathematical physicist. This paper reports a computation and asks questions. It does not claim to answer them. If errors exist in the formalism, they are the author's responsibility, and corrections are welcome.

---

## References

1. Julia, B.L. (1990). "Statistical Theory of Numbers." In *Number Theory and Physics*, Les Houches 1989, Springer-Verlag, 276-293.

2. Connes, A. and Rovelli, C. (1994). "Von Neumann algebra automorphisms and time-thermodynamics relation in generally covariant quantum theories." *Classical and Quantum Gravity*, 11(12), 2899-2917. arXiv:gr-qc/9406019

3. Spector, D. (1990). "Supersymmetry and the Möbius inversion function." *Communications in Mathematical Physics*, 127(2), 239-252.

4. Takesaki, M. (1970). "Tomita's Theory of Modular Hilbert Algebras and Its Applications." *Lecture Notes in Mathematics*, Vol. 128, Springer-Verlag.

5. Haag, R., Hugenholtz, N.M., and Winnink, M. (1967). "On the Equilibrium States in Quantum Statistical Mechanics." *Communications in Mathematical Physics*, 5(3), 215-236.

6. Bakas, I. and Bowick, M.J. (1991). "Curiosities of arithmetic gases." *Journal of Mathematical Physics*, 32, 1881-1884.

7. Connes, A. (1999). "Trace formula in noncommutative geometry and the zeros of the Riemann zeta function." *Selecta Mathematica*, 5, 29-106.

8. Partch, H. (1949/1974). *Genesis of a Music*, 2nd edition. Da Capo Press.

---

## Appendix A: Notation

- ζ(s): Riemann zeta function
- β: inverse temperature (1/kT in natural units)
- H: Hamiltonian
- K: modular Hamiltonian (K = βH for KMS states)
- σ_t: modular automorphism group
- N_p: occupation number operator for prime p
- |n⟩: energy eigenstate labeled by integer n
- ω_β: KMS state at inverse temperature β

---

*Correspondence: jim@begump.com*
*Project: begump.com/r*
*This paper is available at: begump.com/paper*

---
