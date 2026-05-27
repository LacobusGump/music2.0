import Mathlib.Tactic

/-!
# Killed Claims Ledger (honest negative results across the research)

A machine-readable record of ideas that were tested and falsified.
Useful for avoiding re-work and for formal epistemology.

Sources: multiple pages + private audits (derive_alpha, prime-bounce, quantum-harmonics, ALE ladder, etc.)
-/

namespace FineStructure.KilledClaimsLedger

-- From derive_alpha.md and E7 work
theorem sum_nm_33_prime_137_killed : True := by trivial   -- No variational principle forces it; cost min gives 34

theorem K_star_golden_ratio_killed : True := by trivial   -- Icosahedral, not octahedral; 1.38% off

-- From prime-bounce
theorem prime_11_dispatch_killed : True := by trivial   -- Exceeds M4 GPU core count (10), creates interference

theorem fibonacci_dispatch_killed : True := by trivial   -- Shares factors with hardware

theorem standing_wave_dispatch_killed : True := by trivial   -- Locks to harmonics instead of avoiding

-- From ALE spectral ladder
theorem An_ladder_to_E7_killed : True := by trivial   -- Diverges positive and grows after A1; abelian vs non-abelian

-- From quantum-harmonics
theorem factoring_via_coupled_oscillators_killed : True := by trivial   -- Three approaches dead; superposition ≠ resonance

theorem musical_intervals_in_zeta_phases_killed : True := by trivial   -- Density artifact

-- From other audits
theorem Kerr_vortex_analogy_killed : True := by trivial   -- No equations, no metric derived (early THE_THEORY audit)

-- Fresh from build-qft.md + kill_test_and_r.md audit (Layer 2 table + explicit QFT mechanisms)
theorem QFT_loop_corrections_do_not_yield_pi2_over_2N0_killed : True := by trivial   -- Seven mechanisms tested; none produce the required 0.036 correction from E7 data.
theorem instanton_phase_mismatch_killed : True := by trivial   -- 8π²/137 = 0.576 rad vs target 0.799 rad.
theorem Casimir_and_threshold_paths_killed : True := by trivial   -- Explicit high-precision mismatch on ALE spaces.
theorem standard_QFT_derivation_of_alpha_from_E7_killed : True := by trivial   -- All standard diagrams, instantons, and scattering channels cleared; only the full E7 ALE spectral determinant remains open.

end FineStructure.KilledClaimsLedger
