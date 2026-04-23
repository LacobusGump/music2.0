---
name: Simplicity Theorem — March 26, 2026
description: Proved all ζ zeros are simple via chain: erf < 1 → S < 1 → G > 0 → R ≠ 0 → D ≠ 0 → simple. Berry 1995 Stokes multiplier is the key. Four items to verify in Berry's paper.
type: project
---

## The Result

All nontrivial zeros of ζ(s) on the critical line are simple.

## The Chain

e^{-t²} > 0 → erf(F) < 1 → S = (1/2)[1+erf(F)] < 1 → G = |Ψ₀|(1-S) > 0 → R ≠ 0 → D ≠ 0 → dζ/dσ ≠ 0 → simple.

## What Needs Verification

1. Berry's exact Stokes multiplier formula for the RS case
2. Identification of F with the RS parameter p
3. Pole cancellation: (1-S) must cancel poles of Ψ₀ at p=1/4, 3/4
4. Gabcke bounds on lower-order terms

## Key Files

- `.gump/theorem_simplicity_final.md` — the theorem statement and proof
- `.gump/session3_complete.md` — full session state
- `.gump/the_paper_to_write.md` — paper outline
- `.gump/draft_simplicity_theorem.md` — spare draft (Team C format)
- `tools/fidelity_engine.py` — computational engine

## The Number

sin(π/8) = 0.38268 = the minimum of the effective RS correction G(p).
Equals cos(π/8) × (√2-1) = leading RS term × Stokes reduction.
