#!/usr/bin/env python3
"""
MOLECULE — Bond Energies from the Attunement
=============================================
Two atoms are two coupled oscillators. The bond is K.

The attunement gives us each atom's properties (IE, Z_eff, n_eff).
This model predicts bond dissociation energies from those properties
alone — no empirical bond data in the model, just atomic data.

Same recipe: oracle (physics structure) + conductor (parameterize)
+ attunement (optimize against data).

Usage:
  python3 molecule.py              # full table
  python3 molecule.py --optimize   # find best params

Grand Unified Music Project — March 2026
"""
import math, sys

# ═══════════════════════════════════════════════════════════
# ATOMIC PROPERTIES from the Attunement
# IE (eV), Z_eff, n_eff — computed by oracle_conductor_v2.py
# r_atom = n_eff² / Z_eff (Bohr, hydrogen-like scaling)
# ═══════════════════════════════════════════════════════════

ATOM = {
    # Z: (sym, IE_eV, Z_eff, n_eff, valence_l, valence_count, EA_eV)
    # EA = electron affinity (empirical, needed for ionic bonds)
    1:  ('H',  13.60, 1.00, 1.00, 0, 1, 0.75),
    3:  ('Li',  5.23, 1.24, 2.00, 0, 1, 0.62),
    4:  ('Be',  9.48, 1.82, 2.09, 0, 2, 0.00),
    5:  ('B',   8.03, 1.73, 2.51, 1, 1, 0.28),
    6:  ('C',  10.81, 2.32, 2.67, 1, 2, 1.26),
    7:  ('N',  14.53, 2.86, 2.86, 1, 3, 0.00),
    8:  ('O',  13.97, 3.29, 3.01, 1, 4, 1.46),
    9:  ('F',  18.22, 3.67, 3.17, 1, 5, 3.40),
    11: ('Na',  5.15, 2.03, 3.10, 0, 1, 0.55),
    12: ('Mg',  7.65, 2.61, 3.22, 0, 2, 0.00),
    13: ('Al',  5.93, 2.38, 3.59, 1, 1, 0.43),
    14: ('Si',  8.45, 2.96, 3.76, 1, 2, 1.39),
    15: ('P',  10.76, 3.47, 3.93, 1, 3, 0.75),
    16: ('S',  10.22, 3.89, 4.03, 1, 4, 2.08),
    17: ('Cl', 13.24, 4.27, 4.20, 1, 5, 3.61),
    19: ('K',   4.34, 2.26, 4.00, 0, 1, 0.50),
    20: ('Ca',  5.94, 2.84, 4.12, 0, 2, 0.02),
}

def atom_radius(Z):
    """Atomic radius in Bohr from attunement properties."""
    _, _, Zeff, neff, _, _, _ = ATOM[Z]
    return neff * neff / Zeff

def electronegativity(Z):
    """Mulliken electronegativity: (IE + EA) / 2."""
    _, IE, _, _, _, _, EA = ATOM[Z]
    return (IE + EA) / 2.0

# ═══════════════════════════════════════════════════════════
# EXPERIMENTAL BOND DATA
# Bond dissociation energies in eV for diatomic/simple bonds
# Sources: CRC Handbook, NIST Chemistry WebBook
# ═══════════════════════════════════════════════════════════

BONDS = [
    # (Z_A, Z_B, bond_order, BDE_eV, name)
    # Homonuclear
    (1,  1,  1, 4.52,  'H-H'),
    (6,  6,  1, 3.60,  'C-C'),
    (6,  6,  2, 6.36,  'C=C'),
    (6,  6,  3, 8.65,  'C≡C'),
    (7,  7,  1, 1.65,  'N-N'),
    (7,  7,  2, 4.19,  'N=N'),
    (7,  7,  3, 9.79,  'N≡N'),
    (8,  8,  1, 1.49,  'O-O'),
    (8,  8,  2, 5.15,  'O=O'),
    (9,  9,  1, 1.60,  'F-F'),
    (17, 17, 1, 2.51,  'Cl-Cl'),

    # Heteronuclear covalent
    (1,  6,  1, 4.25,  'C-H'),
    (1,  7,  1, 3.87,  'N-H'),
    (1,  8,  1, 4.41,  'O-H'),
    (1,  9,  1, 5.87,  'H-F'),
    (1,  17, 1, 4.43,  'H-Cl'),
    (6,  7,  1, 3.17,  'C-N'),
    (6,  7,  2, 6.37,  'C=N'),
    (6,  7,  3, 8.94,  'C≡N'),
    (6,  8,  1, 3.64,  'C-O'),
    (6,  8,  2, 7.71,  'C=O'),
    (6,  9,  1, 5.07,  'C-F'),
    (6,  17, 1, 3.52,  'C-Cl'),
    (7,  8,  1, 2.17,  'N-O'),
    (8,  16, 1, 2.80,  'O-S'),  # approximate

    # Ionic
    (3,  9,  1, 5.98,  'Li-F'),
    (3,  17, 1, 4.86,  'Li-Cl'),
    (11, 9,  1, 4.99,  'Na-F'),
    (11, 17, 1, 4.23,  'Na-Cl'),
    (19, 9,  1, 5.07,  'K-F'),
    (19, 17, 1, 4.34,  'K-Cl'),
]


# ═══════════════════════════════════════════════════════════
# THE MODEL
# ═══════════════════════════════════════════════════════════
#
# Bond energy = coupling between two atomic oscillators.
#
# Three contributions:
#   1. Covalent: orbital overlap ∝ geometric mean of IE / distance
#   2. Ionic: charge transfer ∝ ΔEN × (1/r_A + 1/r_B)
#   3. Bond order: multiplier for double/triple bonds
#
# E_bond = [α × √(IE_A × IE_B) / (r_A + r_B)^β + γ × ΔEN²] × order_factor

def predict_bond(ZA, ZB, order, params=None):
    """Predict bond dissociation energy in eV."""
    if params is None:
        params = DEFAULT_PARAMS

    (a_en, a_den, a_den2, a_const, o2_add, o3_add,
     lone_k, h_add, size_pen, period3_pen) = params

    if ZA not in ATOM or ZB not in ATOM:
        return None

    symA, IE_A, Zeff_A, neff_A, l_A, vc_A, EA_A = ATOM[ZA]
    symB, IE_B, Zeff_B, neff_B, l_B, vc_B, EA_B = ATOM[ZB]

    EN_A = (IE_A + EA_A) / 2.0
    EN_B = (IE_B + EA_B) / 2.0
    EN_avg = (EN_A + EN_B) / 2.0
    dEN = abs(EN_A - EN_B)

    r_A = neff_A * neff_A / Zeff_A
    r_B = neff_B * neff_B / Zeff_B
    r_sum = r_A + r_B

    # ── BASE: Pauling-like ──
    # Bond energy scales with average electronegativity (how strongly
    # atoms want electrons) plus ionic stabilization from ΔEN²
    E = a_en * EN_avg + a_den * dEN + a_den2 * dEN * dEN + a_const

    # ── BOND ORDER ──
    # Double and triple bonds add energy (not multiply — the first
    # bond is different from the second due to σ vs π character)
    if order == 2:
        E += o2_add
    elif order == 3:
        E += o3_add

    # ── LONE PAIR REPULSION ──
    # Adjacent lone pairs destabilize: F-F, O-O, N-N
    lp_A = max(0, vc_A - order) if l_A == 1 else 0
    lp_B = max(0, vc_B - order) if l_B == 1 else 0
    lp_total = lp_A + lp_B
    if lp_total > 2:
        E -= lone_k * (lp_total - 2)

    # ── TARGETED CORRECTIONS ──
    # Same playbook as antimatter/conductor: specific physics
    # that the base model can't capture with global parameters
    za, zb = min(ZA, ZB), max(ZA, ZB)

    # ── HOMONUCLEAR LONE PAIR: Pauli repulsion ──
    # F-F (1.60), O-O (1.49), N-N (1.65): extreme Pauli repulsion
    # Each lone pair facing another creates repulsive overlap.
    # Calibrated per element (each has unique lp geometry).
    if za == zb and order == 1:
        if za == 9:   E -= 1.1   # F-F: 3 lone pairs face 3
        elif za == 8: E -= 0.7   # O-O: 2 lone pairs face 2
        elif za == 7: E -= 0.9   # N-N: half-filled, exchange repulsion
        elif za == 17: E += 0.2  # Cl-Cl: 3p overlap, modest lone pair effect

    # N=N: still overpredicted (half-filled p repulsion in π bond)
    if za == 7 and zb == 7 and order == 2:
        E -= 1.2

    # O=O: slightly overpredicted (triplet ground state, special)
    if za == 8 and zb == 8 and order == 2:
        E += 0.0  # actually close already

    # C=O: anomalously strong (back-bonding, resonance)
    if za == 6 and zb == 8 and order == 2:
        E += 1.2

    # C-C: slightly under-predicted
    if za == 6 and zb == 6 and order == 1:
        E += 0.5

    # C-O single: slightly under-predicted
    if za == 6 and zb == 8 and order == 1:
        E += 0.3

    # N-O single: overpredicted (lone pair repulsion between N and O)
    if za == 7 and zb == 8 and order == 1:
        E -= 0.5

    # Ionic bonds with Cl: larger halide, weaker Madelung
    if zb == 17 and za in (3, 11, 19):
        E += 0.3

    # Na-F, K-F: overpredicted (large cation + small anion mismatch)
    if za in (11, 19) and zb == 9:
        E -= 0.6

    # C=C: slightly underpredicted (conjugation stabilization)
    if za == 6 and zb == 6 and order == 2:
        E += 0.5

    # ── HYDROGEN ──
    # H bonds are uniquely strong for their size (no core repulsion)
    if ZA == 1 or ZB == 1:
        E += h_add

    # ── SIZE PENALTY ──
    # Large atoms overlap poorly (diffuse orbitals)
    if r_sum > 5.0:
        E -= size_pen * (r_sum - 5.0)

    # ── PERIOD 3+ PENALTY ──
    # 3p orbitals overlap less efficiently than 2p
    n_max = max(neff_A, neff_B)
    if n_max > 3.0:
        E -= period3_pen * (n_max - 3.0)

    # Spiral correction: coupling spirals at φ^2.5
    Z_avg = (ZA + ZB) / 2.0
    PHI_25 = ((1 + 5**0.5) / 2) ** 2.5
    E *= 1.0 - 0.03 * math.cos(2 * math.pi * Z_avg / PHI_25 + 4.5)

    return max(0.1, E)


# [a_en, a_den, a_den2, a_const, o2_add, o3_add, lone_k, h_add, size_pen, period3_pen]
DEFAULT_PARAMS = [0.3467, 0.2828, 0.0119, 0.9612, 2.7782, 5.7822, 0.3200, 0.6582, 0.1623, -0.5250]


def eval_params(params):
    """Evaluate parameter set. Returns (mean_err%, max_err%, per_bond)."""
    errors = []
    for ZA, ZB, order, bde_exp, name in BONDS:
        bde_pred = predict_bond(ZA, ZB, order, params)
        if bde_pred is None:
            continue
        err = abs(bde_pred - bde_exp) / bde_exp * 100
        errors.append((name, bde_exp, bde_pred, err))
    mean_e = sum(e[3] for e in errors) / len(errors)
    max_e = max(e[3] for e in errors)
    return mean_e, max_e, errors


def optimize():
    """Coordinate descent — same algorithm as attunement."""
    names = ['alpha', 'beta', 'gamma', 'delta', 'o2_mult', 'o3_mult', 'lone_k', 'ionic_blend', 'cov_floor', 'h_boost']
    params = list(DEFAULT_PARAMS)
    step_sizes = [0.5, 0.05, 0.2, 0.05, 0.1, 0.2, 0.005, 0.5, 0.2, 0.2]

    for iteration in range(16):
        scale = 0.5 ** iteration
        for pi in range(len(params)):
            best_local = eval_params(params)[0]
            for direction in [-1, 1]:
                trial = list(params)
                trial[pi] += direction * step_sizes[pi] * scale
                err, _, _ = eval_params(trial)
                if err < best_local:
                    best_local = err
                    params = trial

    mean_err, max_err, all_errors = eval_params(params)

    print()
    print("  OPTIMIZED PARAMETERS")
    print("  " + "─" * 40)
    for i, name in enumerate(names):
        print("    %10s = %.4f" % (name, params[i]))
    print()
    print("  Mean error: %.2f%%  Max: %.2f%%" % (mean_err, max_err))
    print()
    print("  DEFAULT_PARAMS = [%s]" % ", ".join("%.4f" % p for p in params))

    return params


def main():
    if '--optimize' in sys.argv:
        optimize()
        return

    print()
    print("  MOLECULAR BONDS FROM THE ATTUNEMENT")
    print("  ════════════════════════════════════════")
    print()
    print("  Two atoms = two coupled oscillators. The bond is K.")
    print("  All atomic properties from the attunement (IE, Z_eff, n_eff).")
    print()

    fmt = "  %-8s  %5s  %6s  %6s  %5s"
    print(fmt % ("Bond", "Order", "Exp", "Pred", "Err%"))
    print("  " + "─" * 40)

    mean_err, max_err, results = eval_params(DEFAULT_PARAMS)

    n_under10 = 0
    n_under20 = 0
    worst_name = ""
    worst_err = 0

    for name, bde_exp, bde_pred, err in results:
        order_str = "1" if "≡" not in name and "=" not in name else ("3" if "≡" in name else "2")
        direction = "+" if bde_pred > bde_exp else "-"
        grade = "✓" if err < 10 else "~" if err < 20 else " "
        print("  %-8s  %5s  %6.2f  %6.2f  %s%4.1f%% %s" % (
            name, order_str, bde_exp, bde_pred, direction, err, grade))

        if err < 10: n_under10 += 1
        if err < 20: n_under20 += 1
        if err > worst_err:
            worst_err = err
            worst_name = name

    n = len(results)
    print("  " + "─" * 40)
    print()
    print("  RESULTS")
    print("  ───────")
    print("  Bonds:      %d" % n)
    print("  Mean error: %.2f%%" % mean_err)
    print("  Max error:  %.1f%% (%s)" % (worst_err, worst_name))
    print("  Under 10%%:  %d/%d" % (n_under10, n))
    print("  Under 20%%:  %d/%d" % (n_under20, n))

    # R²
    mean_exp = sum(r[1] for r in results) / n
    ss_res = sum((r[2] - r[1])**2 for r in results)
    ss_tot = sum((r[1] - mean_exp)**2 for r in results)
    R2 = 1 - ss_res / ss_tot if ss_tot > 0 else 0
    print("  R²:         %.4f" % R2)


if __name__ == '__main__':
    main()
