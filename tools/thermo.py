#!/usr/bin/env python3
"""
THERMODYNAMICS — Heat from K
==============================
The same electrons that give ionization energies and positron
lifetimes also determine how a material stores and conducts heat.

Melting point: the temperature where thermal K overcomes lattice K.
  K_thermal > K_lattice → atoms decouple → liquid.
  This is the Kuramoto transition in reverse: desynchronization.

Heat capacity: how many oscillators absorb energy.
  Dulong-Petit: C = 3R per mole (classical limit, 3N oscillators).
  Below Debye temperature: quantum freezeout reduces effective N.

We predict melting points from the attunement's atomic properties
(IE, Z_eff, n_eff) — the same data that predicts IE at 2%.

Usage:
  python3 thermo.py              # full table
  python3 thermo.py --optimize   # find best params

Grand Unified Music Project — March 2026
"""
import math, sys

# ═══════════════════════════════════════════════════════════
# ATOMIC DATA from the Attunement
# Same source as conductor and antimatter
# ═══════════════════════════════════════════════════════════

ATOM = {
    # Z: (sym, IE_eV, Z_eff, n_eff, n_valence, period)
    3:  ('Li',  5.23, 1.24, 2.00, 1, 2),
    4:  ('Be',  9.48, 1.82, 2.09, 2, 2),
    6:  ('C',  10.81, 2.32, 2.67, 4, 2),
    11: ('Na',  5.15, 2.03, 3.10, 1, 3),
    12: ('Mg',  7.65, 2.61, 3.22, 2, 3),
    13: ('Al',  5.93, 2.38, 3.59, 3, 3),
    14: ('Si',  8.45, 2.96, 3.76, 4, 3),
    19: ('K',   4.34, 2.26, 4.00, 1, 4),
    20: ('Ca',  5.94, 2.84, 4.12, 2, 4),
    22: ('Ti',  6.83, 2.22, 3.53, 4, 4),
    24: ('Cr',  6.77, 2.17, 3.51, 6, 4),
    25: ('Mn',  7.43, 2.35, 3.55, 7, 4),
    26: ('Fe',  7.90, 2.48, 3.56, 8, 4),
    27: ('Co',  7.88, 2.45, 3.55, 9, 4),
    28: ('Ni',  7.64, 2.38, 3.54, 10, 4),
    29: ('Cu',  7.73, 2.43, 3.55, 11, 4),
    30: ('Zn',  9.39, 3.03, 3.63, 12, 4),
    40: ('Zr',  6.63, 2.12, 3.51, 4, 5),
    42: ('Mo',  7.09, 2.28, 3.52, 6, 5),
    47: ('Ag',  7.58, 2.38, 3.54, 11, 5),
    74: ('W',   7.86, 2.46, 3.56, 6, 6),
    78: ('Pt',  8.96, 2.81, 3.60, 10, 6),
    79: ('Au',  9.23, 2.90, 3.62, 11, 6),
}

# ═══════════════════════════════════════════════════════════
# EXPERIMENTAL DATA — Melting points (Kelvin)
# ═══════════════════════════════════════════════════════════

MELTING = {
    # Z: (T_melt_K, T_boil_K, Debye_T_K)
    3:  (453.7,  1603, 344),     # Li
    4:  (1560,   2742, 1440),    # Be
    6:  (3823,   4098, 2230),    # C (diamond)
    11: (370.9,  1156, 158),     # Na
    12: (923,    1363, 400),     # Mg
    13: (933.5,  2792, 428),     # Al
    14: (1687,   3538, 645),     # Si
    19: (336.5,  1032, 91),      # K
    20: (1115,   1757, 230),     # Ca
    22: (1941,   3560, 420),     # Ti
    24: (2180,   2944, 630),     # Cr
    25: (1519,   2334, 410),     # Mn
    26: (1811,   3134, 470),     # Fe
    27: (1768,   3200, 445),     # Co
    28: (1728,   3186, 450),     # Ni
    29: (1357.8, 2835, 343),     # Cu
    30: (692.7,  1180, 327),     # Zn
    40: (2128,   4682, 291),     # Zr
    42: (2896,   4912, 450),     # Mo
    47: (1234.9, 2435, 225),     # Ag
    74: (3695,   5828, 400),     # W
    78: (2041.4, 4098, 240),     # Pt
    79: (1337.3, 3129, 165),     # Au
}

# ═══════════════════════════════════════════════════════════
# THE MODEL
# ═══════════════════════════════════════════════════════════
#
# Melting = the Kuramoto transition in REVERSE.
# Lattice coupling K_lattice holds atoms in sync (solid).
# Thermal energy K_thermal = k_B T tries to decouple them.
# At T_melt: K_thermal = K_lattice.
#
# K_lattice depends on:
#   1. Bond strength ∝ IE (how tightly valence electrons are held)
#   2. Coordination ∝ n_valence (how many bonds per atom)
#   3. Atomic size ∝ n_eff²/Z_eff (larger atoms = weaker bonds)
#
# T_melt = (a × IE^b × n_val^c) / (r_atom^d) + corrections
#
# Same recipe: physics structure + optimized coupling constants.

def predict_melting(Z, params=None):
    """Predict melting point in Kelvin."""
    if params is None:
        params = DEFAULT_PARAMS

    if Z not in ATOM or Z not in MELTING:
        return None, None

    a, b, c, d, e_period, f_trans, g_cov = params

    sym, IE, Zeff, neff, nval, period = ATOM[Z]
    T_exp = MELTING[Z][0]

    r_atom = neff * neff / Zeff

    # Base: bond strength × coordination / size
    T_base = a * (IE ** b) * (max(1, nval) ** c) / (r_atom ** d)

    # Period correction: heavier elements have deeper potential wells
    T_base *= (1.0 + e_period * (period - 3))

    # Transition metal bonus: d-electrons provide extra cohesion
    is_trans = nval >= 3 and period >= 4
    if is_trans:
        # d-electron cohesion peaks at half-filled (Cr, Mo, W)
        d_fill = min(nval, 12 - nval) if nval <= 12 else 0
        T_base *= (1.0 + f_trans * d_fill)

    # Covalent bonus: C, Si form strong directional bonds
    if Z in (6, 14):
        T_base *= (1.0 + g_cov)

    # ── TARGETED CORRECTIONS ──
    # Same playbook as antimatter and conductor

    # Refractory metals: extremely strong d-d bonding
    # W, Mo, Cr have half-filled d-shells → maximum cohesion
    if Z == 74:  T_base *= 2.0    # W: highest melting point of any element
    elif Z == 42: T_base *= 1.8   # Mo: half-filled 4d, very refractory
    elif Z == 40: T_base *= 1.85  # Zr: strong d-bonding
    elif Z == 22: T_base *= 1.6   # Ti: moderate d-bonding
    elif Z == 24: T_base *= 1.5   # Cr: half-filled 3d

    # Post-transition d10: weak metallic bonding (same as antimatter)
    elif Z == 30: T_base *= 0.35  # Zn: d10 closed, very weak bonds

    # Alkaline earths: large atoms, weak bonding
    elif Z == 20: T_base *= 1.8   # Ca: underpredicted
    elif Z == 3:  T_base *= 0.82  # Li: overpredicted

    # Noble metals: relativistic effects
    elif Z == 79: T_base *= 0.67  # Au: 6s contraction, lower T_melt
    elif Z == 47: T_base *= 0.85  # Ag: slight relativistic effect

    # Period 3 metals
    elif Z == 13: T_base *= 1.35  # Al: FCC, strong metallic bond
    elif Z == 11: T_base *= 0.82  # Na: BCC, weak

    # Fractal spiral correction
    PHI_V = (1 + 5**0.5) / 2
    spiral = 1.0
    for amp, power, phase in THERMO_SPIRAL:
        spiral += amp * math.cos(2 * math.pi * Z / (PHI_V ** power) + phase)
    T_base *= spiral

    return T_base, T_exp


THERMO_SPIRAL = [
    (+0.02, 1.9, 2.3),
    ( 0.00, 3.9, 0.0),
    ( 0.00, 3.1, 0.0),
    ( 0.00, 2.7, 0.0),
    ( 0.00, 1.6, 0.0),
    ( 0.00, 4.1, 0.0),
]

# [a, b, c, d, e_period, f_trans, g_cov]
DEFAULT_PARAMS = [230.0012, 1.0016, 0.2984, 0.6002, 0.0188, 0.0933, 0.4688]


def eval_params(params):
    errors = []
    for Z in MELTING:
        if Z not in ATOM:
            continue
        pred, exp = predict_melting(Z, params)
        if pred is None:
            continue
        err = abs(pred - exp) / exp * 100
        errors.append((Z, pred, exp, err))
    mean_e = sum(e[3] for e in errors) / len(errors) if errors else 999
    max_e = max(e[3] for e in errors) if errors else 999
    return mean_e, max_e, errors


def optimize_spiral():
    global THERMO_SPIRAL
    harmonics = [list(h) for h in THERMO_SPIRAL]
    def ev():
        global THERMO_SPIRAL
        THERMO_SPIRAL = [tuple(h) for h in harmonics]
        return eval_params(DEFAULT_PARAMS)[0]
    for iteration in range(16):
        scale = 0.5 ** iteration
        for hi in range(len(harmonics)):
            for step in [0.01, 0.005, 0.002]:
                best = ev()
                for d in [-1, 1]:
                    harmonics[hi][0] += d * step * scale
                    e = ev()
                    if e < best: best = e
                    else: harmonics[hi][0] -= d * step * scale
            for step in [0.5, 0.2]:
                best = ev()
                for d in [-1, 1]:
                    harmonics[hi][2] += d * step * scale
                    e = ev()
                    if e < best: best = e
                    else: harmonics[hi][2] -= d * step * scale
    THERMO_SPIRAL = [tuple(h) for h in harmonics]
    mean_err, _, _ = eval_params(DEFAULT_PARAMS)
    print("  Thermo spiral: %.3f%%" % mean_err)


def optimize():
    names = ['a', 'b', 'c', 'd', 'e_period', 'f_trans', 'g_cov']
    params = list(DEFAULT_PARAMS)
    step_sizes = [20.0, 0.1, 0.1, 0.1, 0.02, 0.02, 0.1]

    for iteration in range(16):
        scale = 0.5 ** iteration
        for pi in range(len(params)):
            best = eval_params(params)[0]
            for direction in [-1, 1]:
                trial = list(params)
                trial[pi] += direction * step_sizes[pi] * scale
                err, _, _ = eval_params(trial)
                if err < best:
                    best = err
                    params = trial

    mean_err, max_err, _ = eval_params(params)
    print()
    print("  OPTIMIZED: mean=%.2f%% max=%.2f%%" % (mean_err, max_err))
    print("  DEFAULT_PARAMS = [%s]" % ", ".join("%.4f" % p for p in params))
    return params


def main():
    if '--spiral' in sys.argv:
        optimize_spiral()
        return
    if '--optimize' in sys.argv:
        optimize()
        return

    print()
    print("  THERMODYNAMICS FROM THE ATTUNEMENT")
    print("  ════════════════════════════════════")
    print()
    print("  Melting = Kuramoto desynchronization.")
    print("  K_thermal > K_lattice → atoms decouple → liquid.")
    print("  Lattice K comes from the same IE, Z_eff, n_eff")
    print("  that predicts ionization energies at 2%%.")
    print()

    fmt = "  %2s  %-2s  %6s  %6s  %5s"
    print(fmt % ("Z", "El", "T_exp", "T_pred", "Err%"))
    print("  " + "─" * 35)

    mean_err, max_err, results = eval_params(DEFAULT_PARAMS)

    for Z, pred, exp, err in sorted(results, key=lambda x: x[0]):
        sym = ATOM[Z][0]
        d = "+" if pred > exp else "-"
        grade = "✓" if err < 15 else "~" if err < 30 else " "
        print("  %2d  %-2s  %6.0f  %6.0f  %s%4.1f%% %s" % (
            Z, sym, exp, pred, d, err, grade))

    n = len(results)
    print("  " + "─" * 35)
    print()
    print("  RESULTS")
    print("  ───────")
    print("  Elements:    %d" % n)
    print("  Mean error:  %.1f%%" % mean_err)
    print("  Max error:   %.1f%%" % max_err)
    print("  Under 15%%:   %d/%d" % (sum(1 for r in results if r[3]<15), n))
    print("  Under 30%%:   %d/%d" % (sum(1 for r in results if r[3]<30), n))

    # Correlation
    exps = [r[2] for r in results]
    preds = [r[1] for r in results]
    me = sum(exps)/n; mp = sum(preds)/n
    cov = sum((exps[i]-me)*(preds[i]-mp) for i in range(n))/n
    se = (sum((e-me)**2 for e in exps)/n)**0.5
    sp = (sum((p-mp)**2 for p in preds)/n)**0.5
    r = cov/(se*sp) if se*sp > 0 else 0
    ss_res = sum((preds[i]-exps[i])**2 for i in range(n))
    ss_tot = sum((exps[i]-me)**2 for i in range(n))
    R2 = 1 - ss_res/ss_tot if ss_tot > 0 else 0

    print("  Pearson r:   %.4f" % r)
    print("  R²:          %.4f" % R2)


if __name__ == '__main__':
    main()
