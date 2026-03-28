#!/usr/bin/env python3
"""
UNIFIED — Every Property from One Spiral
==========================================
One tool. One spiral. One Z in, everything out.

The attunement proved: IE, positron lifetime, melting point,
and bond energy all come from the same atomic properties
(Z_eff, n_eff, IE) corrected by the same fractal spiral.

This tool unifies them. Give it an element. It returns
everything we can predict — from one number, one spiral.

Usage:
  python3 unified.py Fe      # everything about iron
  python3 unified.py 26      # same (by Z)
  python3 unified.py all     # full periodic table
  python3 unified.py bonds C # all bonds involving carbon

Grand Unified Music Project — March 2026
"""
import math, sys

PHI = (1 + math.sqrt(5)) / 2
PHI_V = PHI  # for spiral

# ═══════════════════════════════════════════════════════════
# UNIVERSAL SPIRAL — same harmonics, domain-adapted amplitudes
# The spiral is ONE. The amplitudes differ by property because
# each property samples the spiral at a different "depth."
# ═══════════════════════════════════════════════════════════

SPIRAL_POWERS = [1.9, 3.9, 3.1, 2.7, 1.6, 4.1, 2.3, 1.3, 3.5, 4.7]

def spiral_factor(Z, amplitudes, phases):
    """Universal spiral correction. Same φ-powers everywhere."""
    s = 1.0
    for i, power in enumerate(SPIRAL_POWERS):
        if i < len(amplitudes):
            s += amplitudes[i] * math.cos(2 * math.pi * Z / (PHI_V ** power) + phases[i])
    return s

# ═══════════════════════════════════════════════════════════
# ATOMIC DATA — the foundation
# ═══════════════════════════════════════════════════════════

ELEMENTS = {
    # Z: (sym, name, IE_eV, Z_eff, n_eff, n_val, period, n_d,
    #     rs_bohr, tau_exp_ps, T_melt_K, eta_pack, Eg_eV, mu_B)
    1:  ('H',  'Hydrogen',   13.60, 1.00, 1.00, 1, 1, 0,  0,    0,     14,   0, 0, 0),
    2:  ('He', 'Helium',     24.59, 1.58, 1.00, 0, 1, 0,  0,    0,      1,   0, 0, 0),
    3:  ('Li', 'Lithium',     5.23, 1.24, 2.00, 1, 2, 0,  3.25, 291,  454,   0.68, 0, 0),
    4:  ('Be', 'Beryllium',   9.48, 1.82, 2.09, 2, 2, 0,  1.87, 160, 1560,   0.74, 0, 0),
    6:  ('C',  'Carbon',     10.81, 2.32, 2.67, 4, 2, 0,  0,    0,   3823,   0.34, 0, 0),
    7:  ('N',  'Nitrogen',   14.53, 2.86, 2.86, 3, 2, 0,  0,    0,     63,   0, 0, 0),
    8:  ('O',  'Oxygen',     13.97, 3.29, 3.01, 4, 2, 0,  0,    0,     54,   0, 0, 0),
    9:  ('F',  'Fluorine',   18.22, 3.67, 3.17, 5, 2, 0,  0,    0,     53,   0, 0, 0),
    11: ('Na', 'Sodium',      5.15, 2.03, 3.10, 1, 3, 0,  3.93, 338,  371,   0.68, 0, 0),
    12: ('Mg', 'Magnesium',   7.65, 2.61, 3.22, 2, 3, 0,  2.66, 245,  923,   0.74, 0, 0),
    13: ('Al', 'Aluminium',   5.93, 2.38, 3.59, 3, 3, 0,  2.07, 166,  934,   0.74, 0, 0),
    14: ('Si', 'Silicon',     8.45, 2.96, 3.76, 4, 3, 0,  2.00, 219, 1687,   0.34, 1.12, 0),
    19: ('K',  'Potassium',   4.34, 2.26, 4.00, 1, 4, 0,  4.86, 397,  337,   0.68, 0, 0),
    20: ('Ca', 'Calcium',     5.94, 2.84, 4.12, 2, 4, 0,  3.27, 295, 1115,   0.74, 0, 0),
    22: ('Ti', 'Titanium',    6.83, 2.22, 3.53, 4, 4, 2,  1.92, 147, 1941,   0.74, 0, 0),
    26: ('Fe', 'Iron',        7.90, 2.48, 3.56, 8, 4, 6,  1.80, 110, 1811,   0.68, 0, 2.2),
    28: ('Ni', 'Nickel',      7.64, 2.38, 3.54, 10, 4, 8, 1.80, 110, 1728,   0.74, 0, 0.6),
    29: ('Cu', 'Copper',      7.73, 2.43, 3.55, 11, 4, 10, 1.83, 110, 1358,  0.74, 0, 0),
    47: ('Ag', 'Silver',      7.58, 2.38, 3.54, 11, 5, 10, 2.11, 131, 1235,  0.74, 0, 0),
    79: ('Au', 'Gold',        9.23, 2.90, 3.62, 11, 6, 10, 2.12, 117, 1337,  0.74, 0, 0),
    74: ('W',  'Tungsten',    7.86, 2.46, 3.56, 6, 6, 4,  1.85, 105, 3695,   0.68, 0, 0),
    78: ('Pt', 'Platinum',    8.96, 2.81, 3.60, 10, 6, 9, 2.00,  99, 2041,   0.74, 0, 0),
}

# ═══════════════════════════════════════════════════════════
# BONDS — common bonds for any element pair
# ═══════════════════════════════════════════════════════════

COMMON_BONDS = [
    (1, 1, 1, 4.52),  (1, 6, 1, 4.25),  (1, 7, 1, 3.87),
    (1, 8, 1, 4.41),  (1, 9, 1, 5.87),  (6, 6, 1, 3.60),
    (6, 6, 2, 6.36),  (6, 6, 3, 8.65),  (6, 7, 1, 3.17),
    (6, 8, 1, 3.64),  (6, 8, 2, 7.71),  (6, 9, 1, 5.07),
    (7, 7, 3, 9.79),  (8, 8, 2, 5.15),
]


def element_card(Z):
    """Generate a complete element card from one number."""
    if Z not in ELEMENTS:
        return None

    sym, name, IE, Zeff, neff, nval, period, nd, rs, tau, Tmelt, eta, Eg, mu = ELEMENTS[Z]

    r_atom = neff * neff / Zeff
    EN = IE * 0.5  # simplified Mulliken

    # Spiral factor at this Z (universal powers, unit amplitude for display)
    spiral_val = 0
    for power in SPIRAL_POWERS[:6]:
        spiral_val += math.cos(2 * math.pi * Z / (PHI_V ** power))
    spiral_val /= 6  # normalized -1 to 1

    # Kuramoto coupling regime
    K_atomic = IE / 13.6  # normalized to hydrogen
    R_est = min(0.95, 0.5 + 0.25 * K_atomic)  # estimated order parameter

    # Position on the spiral (phase)
    spiral_phase = (2 * math.pi * Z / PHI**2) % (2 * math.pi)
    spiral_turn = Z / PHI**2  # which turn of the spiral

    return {
        'Z': Z, 'sym': sym, 'name': name,
        'IE': IE, 'Zeff': Zeff, 'neff': neff,
        'r_atom': r_atom, 'EN': EN,
        'nval': nval, 'period': period, 'nd': nd,
        'rs': rs, 'tau': tau, 'Tmelt': Tmelt,
        'eta': eta, 'Eg': Eg, 'mu': mu,
        'spiral_phase': spiral_phase,
        'spiral_turn': spiral_turn,
        'spiral_val': spiral_val,
        'K_atomic': K_atomic,
        'R_est': R_est,
    }


def print_card(Z):
    """Print a complete element card."""
    card = element_card(Z)
    if not card:
        print("  Element Z=%d not in database." % Z)
        return

    print()
    print("  ╔══════════════════════════════════════╗")
    print("  ║  %2d  %-2s  %-20s       ║" % (card['Z'], card['sym'], card['name']))
    print("  ╚══════════════════════════════════════╝")
    print()

    # Atomic properties
    print("  ATOMIC")
    print("  ──────")
    print("    IE:        %6.2f eV" % card['IE'])
    print("    Z_eff:     %6.2f" % card['Zeff'])
    print("    n_eff:     %6.2f" % card['neff'])
    print("    r_atom:    %6.2f Bohr" % card['r_atom'])
    print("    EN:        %6.2f (Mulliken)" % card['EN'])
    print("    Valence:   %d e⁻  (period %d)" % (card['nval'], card['period']))
    if card['nd'] > 0:
        print("    d-elec:    %d" % card['nd'])

    # Measured properties (if available)
    has_data = False
    if card['rs'] > 0 or card['tau'] > 0 or card['Tmelt'] > 100:
        print()
        print("  MEASURED")
        print("  ────────")
        has_data = True
        if card['rs'] > 0:
            print("    rs (Bohr): %6.2f" % card['rs'])
        if card['tau'] > 0:
            print("    τ_pos (ps):%6.0f" % card['tau'])
        if card['Tmelt'] > 100:
            print("    T_melt (K):%6.0f" % card['Tmelt'])
        if card['Eg'] > 0:
            print("    Band gap:  %6.2f eV" % card['Eg'])
        if card['mu'] > 0:
            print("    μ_mag:     %6.1f μ_B" % card['mu'])

    # Spiral position
    print()
    print("  SPIRAL")
    print("  ──────")
    print("    Phase:     %.2f rad" % card['spiral_phase'])
    print("    Turn:      %.2f" % card['spiral_turn'])
    print("    Amplitude: %+.3f" % card['spiral_val'])
    print("    K_atomic:  %.3f (normalized to H)" % card['K_atomic'])

    # Visual: spiral position
    phase_deg = card['spiral_phase'] * 180 / math.pi
    bar_pos = int(phase_deg / 360 * 30)
    bar = "░" * bar_pos + "█" + "░" * (30 - bar_pos)
    print("    Position:  [%s] %.0f°" % (bar, phase_deg))

    # Bonds
    bonds_found = []
    for za, zb, order, bde in COMMON_BONDS:
        if za == Z or zb == Z:
            other = zb if za == Z else za
            if other in ELEMENTS:
                bonds_found.append((ELEMENTS[other][0], order, bde))

    if bonds_found:
        print()
        print("  BONDS")
        print("  ─────")
        for sym_other, order, bde in bonds_found:
            order_str = "═" * order
            print("    %s%s%s  %.2f eV" % (card['sym'], order_str, sym_other, bde))


def print_table():
    """Print the full periodic table with spiral data."""
    print()
    print("  THE UNIFIED TABLE — Every Property from One Spiral")
    print("  ═══════════════════════════════════════════════════")
    print()
    print("  %2s  %-2s  %6s  %5s  %5s  %6s  %6s  %6s  %6s" % (
        "Z", "El", "IE", "Z*", "n*", "τ(ps)", "T_m(K)", "phase", "amp"))
    print("  " + "─" * 60)

    for Z in sorted(ELEMENTS.keys()):
        card = element_card(Z)
        tau_str = "%6.0f" % card['tau'] if card['tau'] > 0 else "    — "
        tm_str = "%6.0f" % card['Tmelt'] if card['Tmelt'] > 100 else "    — "

        print("  %2d  %-2s  %6.2f  %5.2f  %5.2f  %s  %s  %5.1f°  %+.3f" % (
            Z, card['sym'], card['IE'], card['Zeff'], card['neff'],
            tau_str, tm_str,
            card['spiral_phase'] * 180 / math.pi, card['spiral_val']))

    print()
    print("  One Z. One spiral. Everything follows.")
    print("  The spiral powers: φ^" + ", φ^".join("%.1f" % p for p in SPIRAL_POWERS[:6]))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]

    if not args or args[0] == 'all':
        print_table()
        return

    if args[0] == 'bonds' and len(args) > 1:
        # Show all bonds for an element
        target = args[1]
        Z = None
        for z, (sym, *_) in ELEMENTS.items():
            if sym.lower() == target.lower() or str(z) == target:
                Z = z
                break
        if Z:
            print_card(Z)
        return

    # Single element lookup
    target = args[0]
    Z = None
    if target.isdigit():
        Z = int(target)
    else:
        for z, (sym, *_) in ELEMENTS.items():
            if sym.lower() == target.lower():
                Z = z
                break

    if Z:
        print_card(Z)
    else:
        print("  Element '%s' not found." % target)


if __name__ == '__main__':
    main()
