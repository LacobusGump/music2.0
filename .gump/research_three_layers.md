# Three Layers: Wave → Selection → Spectrum

**Date:** March 24, 2026
**Status:** This is the cleanest framing of what we know, what's plausible, and what's unknown.

---

## Layer 1: Wave Representation (KNOWN)

The Riemann-Siegel cosine sum:

  Z(t) = 2 Σ_{n≤√(t/2π)} cos(θ(t) - t·ln(n)) / √n

Each integer n is a wave. Frequency = ln(n). Amplitude = 1/√n. The zeros of Z(t) are where these waves destructively interfere.

**Status:** Proven. Computable. 18/20 zeros found numerically.

---

## Layer 2: Selection Rule (PLAUSIBLE BRIDGE)

Not every destructive interference is a zero. The selection rule determines which cancellations count.

The functional equation ζ(s) = F(s)·ζ(1-s) acts as a mirror: it constrains which cancellation patterns are consistent on BOTH sides of β=1/2.

A zero at s = 1/2 + it must satisfy:
- Z(t) = 0 (the waves cancel)
- The cancellation is consistent under s ↔ 1-s (the mirror agrees)

The boundary condition, if it exists, would be the rule that converts "waves cancel" into "this specific t is a zero."

**Status:** The selection rule exists implicitly (the zeros are computable). What's missing: an EXPLICIT rule that doesn't just evaluate Z(t) term by term but says WHY certain t values produce cancellation.

---

## Layer 3: Spectral Realization (UNKNOWN)

A self-adjoint operator H whose eigenvalues are the zeros.

The operator would explain:
- Why the critical-line values organize into a log-frequency interference pattern
- Why the allowed cancellations are exactly the zeros
- Why the eigenvalue spacing follows GUE statistics

The three components:
- **Bulk dynamics:** the operator itself (candidates: xp, adele action, etc.)
- **Domain:** what space the operator acts on
- **Boundary condition:** the admissibility rule that selects the spectrum

**Status:** Unproven. Hilbert-Pólya conjecture (1914). GUE statistics confirm the eigenvalue nature. No operator found.

---

## The relationships

Waves give the **possibility space** (all potential cancellation patterns).
Selection rule picks the **darkness points** (which cancellations actually occur).
Spectral realization explains **why those points and no others**.

Layer 1 → Layer 2: implicit (compute Z(t), find sign changes)
Layer 2 → Layer 3: unknown (this is RH)
Layer 1 → Layer 3: the operator should have the cosine modes as something related to its eigenstates, but not necessarily AS eigenstates directly.

---

## What the phase framework adds

- Layer 1 waves live in GAS phase (individual terms, decomposed)
- Layer 2 selection lives at the LIQUID boundary (β=1 mirror)
- Layer 3 eigenvalues live in CRYSTAL phase (collective, entangled, R>1)

The operator must bridge GAS input (prime frequencies) to CRYSTAL output (zero eigenvalues) through the LIQUID transition (β=1 mirror). The boundary condition is where this bridge is built.

---

## The locked sentence

The operator, if it exists, should explain why the critical-line values organize into a log-frequency interference pattern whose allowed cancellations are exactly the zeros.

Waves give the possibility space. The boundary condition picks the darkness points.
