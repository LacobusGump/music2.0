import Mathlib.Data.Real.Basic
import Mathlib.Analysis.SpecialFunctions.Trigonometric.Basic
import Mathlib.Analysis.SpecialFunctions.Trigonometric.Arctan
import Mathlib.Analysis.SpecialFunctions.Sqrt
import Mathlib.Tactic

/-!
# CODATA 2026 Preregistration — Fine Structure Constant Candidates (E7-derived r)

This file contains the three preregistered candidates for the coefficient `r`
from the E7/McKay derivation work (begump.com/research/e7-theorem/ and theory/derive_alpha.md,
timestamped around May 2026).

The self-consistent equation is:
  1/α = 137 + (π² - r * α) / 274

C1 (arctan √(19/18)) has a derivation from the FOR-machine convergence on E7 root data + McKay.
C2's derivation was killed in audit.
C3 has none.

First successful Lean check after fixes.
-/

namespace FineStructure.E7AlphaPrereg

-- The main quadratic relation (from one-loop correction on E7 ALE space)
def fineStructureEquation (r α : ℝ) : Prop :=
  1 / α = 137 + (Real.pi ^ 2 - r * α) / 274

/-! ### Candidate definitions -/

-- C1: arctan(sqrt(19/18)) — derivation from McKay + E7 root system convergence (for-machine-e7.md)
noncomputable def r_C1 : ℝ := Real.arctan (Real.sqrt (19 / 18))

-- C2: sqrt(2/π) — original derivation killed in audit
noncomputable def r_C2 : ℝ := Real.sqrt (2 / Real.pi)

-- C3: 4/5 — no derivation
noncomputable def r_C3 : ℝ := 4 / 5

/-! ### Key algebraic fact for C1 -/

-- tan(arctan(x)) = x for x ≥ 0 (principal branch)
theorem tan_r_C1 : Real.tan r_C1 = Real.sqrt (19 / 18) := by
  rw [r_C1]
  exact Real.tan_arctan (Real.sqrt (19 / 18))

/-! ### Predicted 1/α values (high-precision from mpmath, version-controlled here)

These match the Layer-3 quadratic solutions in derive_alpha.md.
-/

def prediction_C1 : String :=
  "C1 (E7-derived): r = arctan(√(19/18)) → 1/α ≈ 137.035999176820824 (matches CODATA 2022 to ~0.009σ)"

def prediction_C2 : String :=
  "C2: r = √(2/π) → 1/α ≈ 137.035999204219506 (derivation killed in audit)"

def prediction_C3 : String :=
  "C3: r = 4/5 → 1/α ≈ 137.035999147879696 (no derivation)"

end FineStructure.E7AlphaPrereg
