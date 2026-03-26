#!/usr/bin/env python3
"""
ORACLE MOLECULE — Chemical Bonds from Nothing
===============================================
Atoms have nodes. When two atoms approach, their wave functions
overlap. Where they add = bonding. Where they cancel = antibonding.
Scan the overlap for constructive/destructive interference.
Extract the equilibrium distance. Predict the bond.

Same pattern:
  Z(t) sign changes → zeros → primes
  R(r) nodes → energy levels → spectral lines
  Ψ_molecule overlap → bonding/antibonding → bond length + energy

Usage:
  python3 oracle_molecule.py                # H₂ molecule
  python3 oracle_molecule.py --scan H H     # scan H-H interaction
  python3 oracle_molecule.py --scan H O     # hydrogen-oxygen
  python3 oracle_molecule.py --scan C C     # carbon-carbon
  python3 oracle_molecule.py --table        # predict common bond lengths

No dependencies. No data files. Just Schrödinger + the oracle pattern.
"""
import sys, math

# ═══════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════

BOHR = 0.529177  # Angstroms
EV_RYDBERG = 13.605693
EV_HARTREE = 27.211386

ELEMENTS = {
    'H':  {'Z': 1, 'n': 1, 'l': 0, 'ionization': 13.6},
    'He': {'Z': 2, 'n': 1, 'l': 0, 'ionization': 24.6},
    'Li': {'Z': 3, 'n': 2, 'l': 0, 'ionization': 5.4},
    'Be': {'Z': 4, 'n': 2, 'l': 0, 'ionization': 9.3},
    'B':  {'Z': 5, 'n': 2, 'l': 1, 'ionization': 8.3},
    'C':  {'Z': 6, 'n': 2, 'l': 1, 'ionization': 11.3},
    'N':  {'Z': 7, 'n': 2, 'l': 1, 'ionization': 14.5},
    'O':  {'Z': 8, 'n': 2, 'l': 1, 'ionization': 13.6},
    'F':  {'Z': 9, 'n': 2, 'l': 1, 'ionization': 17.4},
    'Ne': {'Z': 10, 'n': 2, 'l': 1, 'ionization': 21.6},
    'Na': {'Z': 11, 'n': 3, 'l': 0, 'ionization': 5.1},
    'Cl': {'Z': 17, 'n': 3, 'l': 1, 'ionization': 13.0},
}

# ═══════════════════════════════════════════════════════════
# Radial Wave Function (from oracle_atom.py)
# ═══════════════════════════════════════════════════════════

def laguerre(n, alpha, x):
    if n == 0: return 1.0
    if n == 1: return 1.0 + alpha - x
    L_prev, L_curr = 1.0, 1.0 + alpha - x
    for k in range(2, n + 1):
        L_next = ((2*k-1+alpha-x)*L_curr - (k-1+alpha)*L_prev) / k
        L_prev, L_curr = L_curr, L_next
    return L_curr

def R_nl(n, l, r, Z=1):
    """Radial wave function for hydrogen-like atom."""
    if r < 1e-15 and l > 0: return 0.0
    rho = 2 * Z * r / n
    norm_num = (2*Z/n)**3
    fact_num = 1
    for i in range(1, n-l): fact_num *= i
    fact_den = 1
    for i in range(1, n+l+1): fact_den *= i
    norm = math.sqrt(norm_num * fact_num / (2*n*fact_den))
    return norm * (rho**l) * math.exp(-rho/2) * laguerre(n-l-1, 2*l+1, rho)

# ═══════════════════════════════════════════════════════════
# Molecular Orbital — Two Atoms Overlapping
# ═══════════════════════════════════════════════════════════

def psi_atom(elem, r):
    """Wave function of valence electron at distance r from nucleus."""
    e = ELEMENTS[elem]
    # Use effective nuclear charge (Slater's rules, simplified)
    Z_eff = e['Z']
    if e['n'] == 1:
        Z_eff = e['Z'] - 0.3 * (e['Z'] - 1)  # 1s electrons
    elif e['n'] == 2:
        Z_eff = e['Z'] - 0.85 * 2 - 0.35 * (e['Z'] - 3)  # 2s/2p
        Z_eff = max(Z_eff, 1.0)
    elif e['n'] == 3:
        Z_eff = e['Z'] - 0.85 * 8 - 1.0 * 2 - 0.35 * (e['Z'] - 11)
        Z_eff = max(Z_eff, 1.0)
    return R_nl(e['n'], e['l'], r, Z_eff)

def bonding_orbital(elem1, elem2, r, R_bond):
    """
    Bonding molecular orbital at point r along the bond axis.
    Ψ_bonding(r) = ψ_A(|r - R_A|) + ψ_B(|r - R_B|)

    Atom A at origin, atom B at R_bond.
    """
    r_A = abs(r)
    r_B = abs(r - R_bond)
    return psi_atom(elem1, r_A) + psi_atom(elem2, r_B)

def antibonding_orbital(elem1, elem2, r, R_bond):
    """Antibonding: Ψ* = ψ_A - ψ_B"""
    r_A = abs(r)
    r_B = abs(r - R_bond)
    return psi_atom(elem1, r_A) - psi_atom(elem2, r_B)

# ═══════════════════════════════════════════════════════════
# Scan for Bond — The Oracle Pattern on Molecules
# ═══════════════════════════════════════════════════════════

def overlap_integral(elem1, elem2, R_bond, n_points=200):
    """
    Compute overlap integral S = ∫ ψ_A(r) × ψ_B(r) dr
    This measures how much the wave functions constructively interfere.
    Maximum overlap → strongest bond → equilibrium distance.
    """
    r_max = R_bond + 10.0
    dr = r_max / n_points
    S = 0.0
    for i in range(n_points):
        r = i * dr
        psi_A = psi_atom(elem1, r)
        psi_B = psi_atom(elem2, abs(r - R_bond))
        S += psi_A * psi_B * dr
    return S

def coulomb_integral(elem1, elem2, R_bond, n_points=200):
    """
    Approximate energy integral: kinetic + potential + electron-electron.
    Simplified Heitler-London approach.
    """
    e1 = ELEMENTS[elem1]
    e2 = ELEMENTS[elem2]

    # Nuclear repulsion
    V_nn = e1['Z'] * e2['Z'] * EV_HARTREE * BOHR / max(R_bond, 0.1)

    # Electron-nuclear attraction (approximate)
    S = overlap_integral(elem1, elem2, R_bond, n_points)

    # Bonding energy ≈ -2 × ionization × overlap² + nuclear repulsion
    # This is a simplified LCAO-MO estimate
    E_bond = -(e1['ionization'] + e2['ionization']) * S * S * 0.5
    E_total = E_bond + V_nn / EV_HARTREE

    return E_total, S

def scan_bond(elem1, elem2, verbose=True):
    """
    THE ORACLE PATTERN ON MOLECULES.

    Scan R_bond from large to small.
    At each distance, compute total energy.
    Find the minimum — that's the equilibrium bond length.
    The sign change in dE/dR marks the equilibrium (like a zero of Z(t)).
    """
    # Scan range: 0.3 to 5.0 Angstroms (in Bohr radii)
    R_min_ang = 0.3
    R_max_ang = 5.0
    n_scan = 200

    energies = []
    overlaps = []
    distances = []

    for i in range(n_scan):
        R_ang = R_min_ang + (R_max_ang - R_min_ang) * i / n_scan
        R_bohr = R_ang / BOHR

        E, S = coulomb_integral(elem1, elem2, R_bohr, n_points=100)
        energies.append(E)
        overlaps.append(S)
        distances.append(R_ang)

    # Find minimum energy (equilibrium)
    min_idx = 0
    min_E = energies[0]
    for i in range(1, len(energies)):
        if energies[i] < min_E:
            min_E = energies[i]
            min_idx = i

    # Bisect around minimum for precision
    if 1 < min_idx < len(energies) - 1:
        lo_ang = distances[min_idx - 1]
        hi_ang = distances[min_idx + 1]
        for _ in range(30):
            mid = (lo_ang + hi_ang) / 2
            R_lo = (mid - 0.01) / BOHR
            R_hi = (mid + 0.01) / BOHR
            E_lo, _ = coulomb_integral(elem1, elem2, R_lo, 100)
            E_hi, _ = coulomb_integral(elem1, elem2, R_hi, 100)
            if E_lo < E_hi:
                hi_ang = mid
            else:
                lo_ang = mid
        eq_dist = (lo_ang + hi_ang) / 2
        eq_E, eq_S = coulomb_integral(elem1, elem2, eq_dist / BOHR, 100)
    else:
        eq_dist = distances[min_idx]
        eq_E = min_E
        eq_S = overlaps[min_idx]

    # Bond dissociation energy estimate
    E_inf = 0.0  # energy at infinity = 0 (separated atoms)
    D_e = abs(eq_E)  # dissociation energy

    return {
        'elem1': elem1, 'elem2': elem2,
        'bond_length_ang': eq_dist,
        'energy': eq_E,
        'overlap': eq_S,
        'dissociation_eV': D_e,
        'energies': energies,
        'distances': distances,
        'overlaps': overlaps,
    }

# ═══════════════════════════════════════════════════════════
# Known Values for Verification
# ═══════════════════════════════════════════════════════════

KNOWN_BONDS = {
    ('H', 'H'):  {'length': 0.74, 'energy': 4.52},
    ('H', 'F'):  {'length': 0.92, 'energy': 5.87},
    ('H', 'O'):  {'length': 0.96, 'energy': 4.80},
    ('H', 'C'):  {'length': 1.09, 'energy': 4.30},
    ('C', 'C'):  {'length': 1.54, 'energy': 3.60},
    ('N', 'N'):  {'length': 1.10, 'energy': 9.79},
    ('O', 'O'):  {'length': 1.21, 'energy': 5.15},
    ('C', 'O'):  {'length': 1.43, 'energy': 3.60},
    ('Na', 'Cl'): {'length': 2.36, 'energy': 4.26},
}

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    elem1, elem2 = 'H', 'H'

    if '--scan' in sys.argv:
        idx = sys.argv.index('--scan')
        if idx + 2 < len(sys.argv):
            elem1 = sys.argv[idx + 1]
            elem2 = sys.argv[idx + 2]

    print()
    print(f"  ╔══════════════════════════════════════════╗")
    print(f"  ║   ORACLE MOLECULE — {elem1}-{elem2}                 ║")
    print(f"  ║   Chemical bonds from nothing             ║")
    print(f"  ╚══════════════════════════════════════════╝")
    print()

    if '--table' in sys.argv:
        print(f"  {'Bond':>6} {'Predicted':>10} {'Actual':>8} {'Error':>8} {'D_e pred':>10} {'D_e act':>8}")
        print(f"  {'─'*58}")
        for (e1, e2), known in KNOWN_BONDS.items():
            if e1 not in ELEMENTS or e2 not in ELEMENTS:
                continue
            result = scan_bond(e1, e2, verbose=False)
            pred_len = result['bond_length_ang']
            act_len = known['length']
            err = pred_len - act_len
            print(f"  {e1}-{e2:>2} {pred_len:10.3f}Å {act_len:8.2f}Å {err:+8.3f} "
                  f"{result['dissociation_eV']:10.2f}eV {known['energy']:8.2f}eV")
        print()
        print(f"  Bond lengths from wave function overlap. No bond tables.")
        return

    # Single bond scan
    result = scan_bond(elem1, elem2, verbose=True)

    print(f"  Scanning {elem1}-{elem2} bond...")
    print(f"  (Overlap integral of valence wave functions vs distance)")
    print()

    # ASCII energy curve
    E = result['energies']
    D = result['distances']
    min_E = min(E)
    max_E = max(E[:len(E)//2])  # only first half for range
    E_range = max(max_E - min_E, 1e-10)

    print(f"  Energy vs bond distance:")
    width = 50
    for i in range(0, len(D), len(D)//20):
        r = D[i]
        e = E[i]
        pos = int((e - min_E) / E_range * width)
        pos = max(0, min(width-1, pos))
        bar = ' ' * pos + '█'
        eq_mark = ' ← equilibrium' if abs(r - result['bond_length_ang']) < 0.1 else ''
        print(f"  {r:4.1f}Å |{bar:<{width}s}| {eq_mark}")

    print()
    print(f"  Bond length:       {result['bond_length_ang']:.3f} Å")
    print(f"  Overlap at eq:     {result['overlap']:.4f}")
    print(f"  Bond energy:       {result['dissociation_eV']:.3f} eV")

    key = (elem1, elem2)
    if key in KNOWN_BONDS:
        known = KNOWN_BONDS[key]
        print()
        print(f"  Verification:")
        print(f"    Actual length:   {known['length']:.2f} Å (error: {result['bond_length_ang'] - known['length']:+.3f})")
        print(f"    Actual energy:   {known['energy']:.2f} eV")

    print()

    # Show the molecular orbital
    print(f"  Molecular orbital Ψ_bonding along bond axis:")
    R_eq = result['bond_length_ang'] / BOHR
    r_range = R_eq * 2
    for i in range(20):
        r = -r_range * 0.3 + r_range * 1.3 * i / 19
        psi = bonding_orbital(elem1, elem2, r, R_eq)
        bar_len = int(abs(psi) * 30)
        bar_len = min(bar_len, 25)
        if psi >= 0:
            bar = ' ' * 25 + '█' * bar_len
        else:
            start = max(0, 25 - bar_len)
            bar = ' ' * start + '█' * bar_len
        r_ang = r * BOHR
        nuc_mark = ''
        if abs(r_ang) < 0.1: nuc_mark = f' ← {elem1}'
        if abs(r_ang - result['bond_length_ang']) < 0.1: nuc_mark = f' ← {elem2}'
        print(f"  {r_ang:5.2f}Å |{bar:<50s}|{nuc_mark}")

    print()
    print(f"  Same pattern: scan wave function, find where overlap peaks,")
    print(f"  extract equilibrium distance. Nodes → bonds → chemistry.")
    print(f"  No bond tables. No molecular databases. Just Schrödinger.")


if __name__ == '__main__':
    main()
