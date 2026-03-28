#!/usr/bin/env python3
"""
THE SPIRAL CORRECTION — The Missing Geometry
==============================================
"The loop is a spiral in."

Our models are flat: constant coupling K, linear corrections.
But reality spirals. 1/φ never resolves. R orbits, never lands.

What if the coupling has a φ-phase? K isn't constant — it
spirals with position. Each element, each bond, each oscillator
sits at a different phase on the golden spiral.

K(Z) = K₀ × (1 + ε × cos(2πZ/φ²))

The correction is tiny (ε ~ 0.01-0.03) but it should account
for the residual 1-2% that flat models can't reach.

Test: apply spiral correction to conductor, antimatter, molecules.
See if the remaining error collapses.

Grand Unified Music Project — March 2026
"""
import math, sys

PHI = (1 + math.sqrt(5)) / 2
PHI2 = PHI * PHI  # φ² ≈ 2.618

# ═══════════════════════════════════════════════════════════
# RESIDUALS FROM OUR PROVEN MODELS
# (predicted - actual) / actual × 100
# Extracted from the model runs
# ═══════════════════════════════════════════════════════════

# Conductor (The Attunement) — 20 elements
CONDUCTOR_RESIDUALS = {
    1:  ('H',   0.0),   2: ('He',  0.0),   3: ('Li', -3.0),
    4:  ('Be',  1.7),   5: ('B',  -6.1),   6: ('C',  -4.0),
    7:  ('N',   0.0),   8: ('O',   2.6),   9: ('F',   4.6),
    10: ('Ne', -2.5),  11: ('Na',  0.2),  12: ('Mg',  0.0),
    13: ('Al', -1.0),  14: ('Si',  3.6),  15: ('P',   2.6),
    16: ('S',   0.0),  17: ('Cl',  2.1),  18: ('Ar', -4.4),
    19: ('K',   0.0),  20: ('Ca', -2.9),
}

# Antimatter — 31 elements (subset shown)
ANTIMATTER_RESIDUALS = {
    3:  ('Li', -1.6),   4: ('Be',  1.6),  11: ('Na', -0.2),
    12: ('Mg', -1.5),  13: ('Al',  1.9),  14: ('Si', -0.3),
    19: ('K',   2.3),  20: ('Ca', -1.7),  22: ('Ti',  3.0),
    23: ('V',   1.8),  24: ('Cr',  0.0),  25: ('Mn', -2.9),
    26: ('Fe',  0.1),  27: ('Co', -2.5),  28: ('Ni',  0.0),
    29: ('Cu',  0.0),  30: ('Zn',  0.2),  31: ('Ga',  0.6),
    32: ('Ge', -1.6),  33: ('As', -1.4),  34: ('Se',  1.6),
    37: ('Rb',  1.7),  38: ('Sr', -1.5),  40: ('Zr', -0.2),
    41: ('Nb',  2.2),  42: ('Mo',  1.2),  46: ('Pd',  2.3),
    47: ('Ag', -1.9),  74: ('W',   1.8),  78: ('Pt',  0.0),
    79: ('Au', -0.5),
}

# Molecule bond residuals
MOLECULE_RESIDUALS = [
    ('H-H',   -9.1),  ('C-C',   -6.5),  ('C=C',   -3.4),
    ('C≡C',    0.0),  ('N-N',   10.5),  ('N=N',   17.9),
    ('N≡N',   -6.6),  ('O-O',    6.0),  ('O=O',   10.6),
    ('F-F',    6.3),  ('Cl-Cl', -9.9),  ('C-H',   -0.1),
    ('N-H',    7.2),  ('O-H',   -8.3),  ('H-F',   -8.5),
    ('H-Cl',   5.3),  ('C-N',   -0.3),  ('C=N',   -1.7),
    ('C≡N',    3.6),  ('C-O',   -7.0),  ('C=O',   -0.1),
    ('C-F',  -11.2),  ('C-Cl',   0.1),  ('N-O',   -1.7),
    ('O-S',   -0.6),  ('Li-F',  -6.3),  ('Li-Cl', -2.2),
    ('Na-F',   7.9),  ('Na-Cl',  7.0),  ('K-F',    9.8),
    ('K-Cl',  -9.0),
]


def spiral_phase(Z, epsilon, phi_power=2):
    """Golden spiral correction factor."""
    phase = 2 * math.pi * Z / (PHI ** phi_power)
    return 1.0 + epsilon * math.cos(phase)


def test_spiral_correlation(residuals_dict, name):
    """Test if residuals correlate with golden spiral phase."""
    Zs = sorted(residuals_dict.keys())
    residuals = [residuals_dict[Z][1] for Z in Zs]
    n = len(Zs)

    # Test multiple φ-powers to find the best spiral
    best_r = 0
    best_power = 0
    best_shift = 0

    for phi_pow_10 in range(10, 40):  # φ^1.0 to φ^4.0
        phi_pow = phi_pow_10 / 10.0
        for shift_10 in range(0, 63):  # phase shifts 0 to 2π
            shift = shift_10 / 10.0

            spiral = [math.cos(2*math.pi*Z/(PHI**phi_pow) + shift) for Z in Zs]

            # Correlation
            mr = sum(residuals)/n; ms = sum(spiral)/n
            cov = sum((residuals[i]-mr)*(spiral[i]-ms) for i in range(n))/n
            sr = (sum((r-mr)**2 for r in residuals)/n)**0.5
            ss = (sum((s-ms)**2 for s in spiral)/n)**0.5
            r = cov/(sr*ss) if sr*ss > 1e-10 else 0

            if abs(r) > abs(best_r):
                best_r = r
                best_power = phi_pow
                best_shift = shift

    return best_r, best_power, best_shift


def apply_spiral_correction(residuals_dict, phi_power, shift, name):
    """Apply the spiral correction and compute new errors."""
    Zs = sorted(residuals_dict.keys())

    # Find optimal epsilon by minimizing corrected residuals
    best_eps = 0
    best_rms = sum(residuals_dict[Z][1]**2 for Z in Zs) / len(Zs)

    for eps_10 in range(-50, 51):
        eps = eps_10 / 10.0
        rms = 0
        for Z in Zs:
            orig = residuals_dict[Z][1]
            correction = eps * math.cos(2*math.pi*Z/(PHI**phi_power) + shift)
            corrected = orig - correction
            rms += corrected**2
        rms /= len(Zs)
        if rms < best_rms:
            best_rms = rms
            best_eps = eps

    # Apply
    print("    ε = %.2f, φ^%.1f, shift = %.1f" % (best_eps, phi_power, shift))
    print()

    orig_rms = (sum(residuals_dict[Z][1]**2 for Z in Zs) / len(Zs))**0.5
    new_residuals = []
    for Z in Zs:
        sym, orig = residuals_dict[Z]
        correction = best_eps * math.cos(2*math.pi*Z/(PHI**phi_power) + shift)
        corrected = orig - correction
        new_residuals.append(corrected)
        improved = "✓" if abs(corrected) < abs(orig) else " "
        print("    %2d %-2s  %+5.1f%%  → %+5.1f%%  %s" % (Z, sym, orig, corrected, improved))

    new_rms = (sum(r**2 for r in new_residuals) / len(new_residuals))**0.5
    reduction = (1 - new_rms/orig_rms) * 100 if orig_rms > 0 else 0

    print()
    print("    RMS: %.2f%% → %.2f%% (%.0f%% reduction)" % (orig_rms, new_rms, reduction))

    return new_rms, reduction


def main():
    print()
    print("  THE SPIRAL CORRECTION")
    print("  ════════════════════════")
    print()
    print("  Testing: do residuals follow a golden spiral?")
    print("  K(Z) = K₀ × (1 + ε × cos(2πZ/φⁿ + shift))")
    print()

    # Test conductor
    print("  ┌─ CONDUCTOR (The Attunement) ─────────────────")
    r, power, shift = test_spiral_correlation(CONDUCTOR_RESIDUALS, "conductor")
    print("  │  Best spiral correlation: r = %.4f" % r)
    print("  │  Spiral: cos(2πZ/φ^%.1f + %.1f)" % (power, shift))
    print("  │")
    if abs(r) > 0.3:
        print("  │  Applying correction:")
        cond_rms, cond_red = apply_spiral_correction(
            CONDUCTOR_RESIDUALS, power, shift, "conductor")
    else:
        print("  │  Correlation too weak (|r| < 0.3). No spiral signal.")
        cond_red = 0
    print("  └────────────────────────────────────────────")
    print()

    # Test antimatter
    print("  ┌─ ANTIMATTER (Positron Lifetimes) ────────────")
    r, power, shift = test_spiral_correlation(ANTIMATTER_RESIDUALS, "antimatter")
    print("  │  Best spiral correlation: r = %.4f" % r)
    print("  │  Spiral: cos(2πZ/φ^%.1f + %.1f)" % (power, shift))
    print("  │")
    if abs(r) > 0.3:
        print("  │  Applying correction:")
        anti_rms, anti_red = apply_spiral_correction(
            ANTIMATTER_RESIDUALS, power, shift, "antimatter")
    else:
        print("  │  Correlation too weak. No spiral signal.")
        anti_red = 0
    print("  └────────────────────────────────────────────")
    print()

    # Test molecules (use index as Z proxy)
    mol_dict = {}
    for i, (name, res) in enumerate(MOLECULE_RESIDUALS):
        mol_dict[i+1] = (name, res)

    print("  ┌─ MOLECULES (Bond Energies) ──────────────────")
    r, power, shift = test_spiral_correlation(mol_dict, "molecules")
    print("  │  Best spiral correlation: r = %.4f" % r)
    print("  │  Spiral: cos(2πn/φ^%.1f + %.1f)" % (power, shift))
    print("  │")
    if abs(r) > 0.3:
        print("  │  Applying correction:")
        mol_rms, mol_red = apply_spiral_correction(
            mol_dict, power, shift, "molecules")
    else:
        print("  │  Correlation too weak. No spiral signal.")
        mol_red = 0
    print("  └────────────────────────────────────────────")

    # Summary
    print()
    print("  ═══════════════════════════════════════════")
    print("  SUMMARY")
    print("  ═══════════════════════════════════════════")
    print()

    any_signal = False
    for name, red in [("Conductor", cond_red), ("Antimatter", anti_red), ("Molecules", mol_red)]:
        if red > 10:
            print("  %s: %.0f%% error reduction from spiral. THE GEOMETRY IS REAL." % (name, red))
            any_signal = True
        elif red > 0:
            print("  %s: %.0f%% reduction. Weak signal." % (name, red))
        else:
            print("  %s: no spiral signal detected." % name)

    print()
    if any_signal:
        print("  The residuals follow the golden spiral.")
        print("  The coupling isn't flat — it spirals with Z.")
        print("  The loop never closes because φ is irrational.")
        print("  That's why there's always a residual: the spiral")
        print("  correction is ALSO irrational. It never resolves.")
        print("  The 1%% isn't error. It's the spiral breathing.")
    else:
        print("  The residuals don't follow a simple golden spiral.")
        print("  The geometry may be deeper than cos(2πZ/φⁿ).")
        print("  Or the spiral is in a different variable than Z.")
        print("  The search continues.")


if __name__ == '__main__':
    main()
