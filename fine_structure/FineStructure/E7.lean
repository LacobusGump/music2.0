import Mathlib.Tactic

/-!
# The E7 Uniqueness Theorem

**James McCandless**

Among all finite-dimensional simple Lie algebras of ADE type,
E7 is the unique algebra satisfying S(𝔤) = dim(𝔤) + max_kac(𝔤) = 137,
where max_kac denotes the largest Kac label of the untwisted affine extension.

## The invariant

  S(A_n) = n(n+2) + 1 = (n+1)²
  S(D_n) = n(2n−1) + 2        (n ≥ 4)
  S(E6)  = 78 + 3  = 81
  S(E7)  = 133 + 4 = 137  ← unique
  S(E8)  = 248 + 6 = 254

Kac labels (untwisted affine extension, Bourbaki convention):
  A_n^(1) : all labels = 1,  max = 1
  D_n^(1) : interior nodes = 2, endpoints = 1, max = 2
  E6^(1)  : (1,1,2,3,2,1,2), max = 3
  E7^(1)  : (1,2,3,4,3,2,1,2), max = 4
  E8^(1)  : (1,2,3,4,5,6,4,2,3), max = 6
-/

namespace E7Theorem

/-! ## Auxiliary lemmas -/

/-- 137 is not a perfect square (11² = 121 < 137 < 144 = 12²). -/
lemma not_sq_137 : ∀ k : ℕ, k ^ 2 ≠ 137 := by
  intro k h
  have hk : k ≤ 12 := by
    by_contra hlt
    push Not at hlt
    have h13 : 13 ≤ k := hlt
    have := Nat.pow_le_pow_left h13 2
    norm_num at this
    linarith
  interval_cases k <;> omega

/-- S(A_n) = (n+1)² is never 137, since 137 is not a perfect square. -/
lemma An_S_ne_137 : ∀ n : ℕ, n ≥ 1 → n * (n + 2) + 1 ≠ 137 := by
  intro n _ h
  have heq : (n + 1) ^ 2 = 137 := by
    have : n * (n + 2) + 1 = (n + 1) ^ 2 := by ring
    linarith
  exact not_sq_137 (n + 1) heq

/-- For n ≥ 4, n ≤ 2n − 1 (no truncation in ℕ since 2n ≥ 8 > 1). -/
lemma two_mul_sub_one_ge (n : ℕ) (hn : n ≥ 1) : n ≤ 2 * n - 1 := by omega

/-- S(D_n) = n(2n−1) + 2 skips 137: between n=8 (S=122) and n=9 (S=155). -/
lemma Dn_S_ne_137 : ∀ n : ℕ, n ≥ 4 → n * (2 * n - 1) + 2 ≠ 137 := by
  intro n hn h
  -- n * (2n−1) = 135
  have hprod : n * (2 * n - 1) = 135 := by omega
  -- Since n ≤ 2n−1, we have n² ≤ n(2n−1) = 135
  have hle : n ≤ 2 * n - 1 := two_mul_sub_one_ge n (by omega)
  have hnn : n * n ≤ n * (2 * n - 1) := Nat.mul_le_mul_left n hle
  -- n² ≤ 135 forces n ≤ 11
  have hn_upper : n ≤ 11 := by nlinarith [hnn, hprod]
  -- Exhaustive check on n ∈ {4, …, 11}
  interval_cases n <;> omega

/-! ## The theorem -/

/-- **E7 Uniqueness Theorem.**
Among all finite-dimensional simple Lie algebras of ADE type,
E7 is the unique algebra satisfying dim(𝔤) + max_kac(𝔤) = 137. -/
theorem e7_uniqueness :
    -- E7 achieves the invariant
    (133 + 4 = 137) ∧
    -- E6 does not
    (78 + 3 ≠ 137) ∧
    -- E8 does not
    (248 + 6 ≠ 137) ∧
    -- No A_n achieves it (dim = n(n+2), max_kac = 1)
    (∀ n : ℕ, n ≥ 1 → n * (n + 2) + 1 ≠ 137) ∧
    -- No D_n achieves it (dim = n(2n−1), max_kac = 2, n ≥ 4)
    (∀ n : ℕ, n ≥ 4 → n * (2 * n - 1) + 2 ≠ 137) :=
  ⟨by norm_num, by norm_num, by norm_num, An_S_ne_137, Dn_S_ne_137⟩

end E7Theorem
