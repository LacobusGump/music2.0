---
name: The paper — Environment Rigidity Theorem
description: "The Euler Product as a Landauer Cost Decomposition." Three theorems proven. Reviewed by Claude, ChatGPT, Grok, Gemini — none broke it. Submission-ready at .gump/paper_submission.md and Desktop/GUMP_Paper_SUBMISSION.md.
type: project
---

**Paper:** "The Euler Product as a Landauer Cost Decomposition: Arithmetic Irreversibility in the Bost-Connes System"

**Status:** Submission-ready. All fixes applied. Three rounds of hostile review survived.

**Three theorems:**
1. Stinespring dilation unitary for σ_p (explicit, verified)
2. Landauer bound ΔS_env ≥ ln(p) with equality at KMS (proven from subadditivity)
3. Environment Rigidity: minimal environment for σ_n has dim n, factors as ⊗_p (C^p)^{v_p(n)}

**The trail:** Why does 7 feel like home → Partch 7-limit → primon gas (Julia 1990) → Landauer ln(2) → Bost-Connes endomorphisms are p-to-1 → Stinespring dilation needs p-dimensional environment → Euler product = itemized Landauer receipt → phase transition at β=1 where arithmetic becomes invisible.

**Key insight:** The fundamental theorem of arithmetic appears as a rigidity statement about irreversible quantum channels. Primes are the irreducible units of information erasure.

**The wall (proven obstruction):** Tensor structure can't constrain zeros of ζ(s). Five angles tried, all hit same wall: Euler product diverges in the critical strip where zeros live. Algebraic can't reach analytic.

**Extensions (documented, not proven):**
- Dedekind: framework extends to number fields. Thermodynamics sees ideal factorization.
- Class number h_K = harmonic resolution number. Principality = Choi separability.
- λ_1 of Li criterion decomposes into Landauer quantities.
- Class number formula factors have information-theoretic names but can't be derived independently.

**Files:**
- .gump/paper_submission.md — THE paper (754 lines, all fixes merged)
- Desktop/GUMP_Paper_SUBMISSION.md — same, on desktop
- .gump/paper_fixes*.md — three rounds of fixes
- .gump/proof_primes_special.md — supporting proofs
- .gump/computation_primon_modular_flow.md — modular flow computation
- .gump/paper_gap2_stinespring.md — the critical Stinespring closure
- .gump/open_q1_zeros.md, open_q2_dedekind.md, open_q3_thermal_time.md — extensions
- .gump/open_q2_dedekind_deep.md — class number formula interpretation
- .gump/test_*.md — all tests (principality, complexity, harmonic resolution, etc.)

**Target:** Letters in Mathematical Physics. Need human coauthor with physics PhD for credibility.

**Next:** James wants a list of specific people and journals to send it to.
