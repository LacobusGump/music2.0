#!/usr/bin/env python3
"""
ORACLE ATOM — Atomic Structure from Nothing
=============================================
The oracle pattern applied to quantum mechanics.

Z(t) sign changes → zeros → primes
R(r) sign changes → nodes → energy levels → spectral lines

The Schrödinger equation for hydrogen-like atoms is exactly solvable.
The radial wave function R_nl(r) has nodes. Those nodes encode
the entire electronic structure. Scan, extract, use.

Usage:
  python3 oracle_atom.py                    # hydrogen
  python3 oracle_atom.py --Z 2             # helium (He)
  python3 oracle_atom.py --Z 6             # carbon
  python3 oracle_atom.py --Z 26            # iron
  python3 oracle_atom.py --spectrum 1      # full hydrogen spectrum
  python3 oracle_atom.py --periodic        # derive the periodic table

No dependencies. No data files. Just the Schrödinger equation and math.
"""
import sys, math

# ═══════════════════════════════════════════════════════════
# Physical Constants
# ═══════════════════════════════════════════════════════════

BOHR = 0.529177  # Bohr radius in Angstroms
EV_RYDBERG = 13.605693  # Rydberg energy in eV
C_LIGHT = 299792458  # speed of light m/s
H_PLANCK = 4.135667696e-15  # Planck constant in eV·s

ELEMENT_NAMES = [
    '', 'H','He','Li','Be','B','C','N','O','F','Ne',
    'Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca',
    'Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn',
    'Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr',
    'Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn',
]

ORBITAL_NAMES = ['s','p','d','f','g','h']

# ═══════════════════════════════════════════════════════════
# The Radial Wave Function R_nl(r) — The Z(t) of Atoms
# ═══════════════════════════════════════════════════════════

def laguerre(n, alpha, x):
    """Associated Laguerre polynomial L_n^alpha(x)."""
    if n == 0: return 1.0
    if n == 1: return 1.0 + alpha - x
    L_prev = 1.0
    L_curr = 1.0 + alpha - x
    for k in range(2, n + 1):
        L_next = ((2*k - 1 + alpha - x) * L_curr - (k - 1 + alpha) * L_prev) / k
        L_prev = L_curr
        L_curr = L_next
    return L_curr

def radial_wave(n, l, r, Z=1):
    """
    Radial wave function R_nl(r) for hydrogen-like atom.

    This is the Z(t) of atomic physics. Its sign changes
    (nodes) encode the electronic structure.

    n = principal quantum number (1, 2, 3, ...)
    l = angular momentum quantum number (0, 1, ..., n-1)
    r = radial distance (in units of Bohr radius / Z)
    Z = atomic number
    """
    if r < 1e-15 and l > 0: return 0.0
    rho = 2 * Z * r / n
    # Normalization
    norm_num = (2 * Z / n) ** 3
    fact_num = 1
    for i in range(1, n - l):
        fact_num *= i
    fact_den = 1
    for i in range(1, n + l + 1):
        fact_den *= i
    norm = math.sqrt(norm_num * fact_num / (2 * n * fact_den))

    # R_nl(r) = norm × rho^l × exp(-rho/2) × L_{n-l-1}^{2l+1}(rho)
    lag = laguerre(n - l - 1, 2 * l + 1, rho)
    return norm * (rho ** l) * math.exp(-rho / 2) * lag

# ═══════════════════════════════════════════════════════════
# Scan for Nodes (Sign Changes) — Same as Zero Finding
# ═══════════════════════════════════════════════════════════

def find_nodes(n, l, Z=1, r_max=None):
    """
    Scan R_nl(r) for sign changes. Bisect to locate nodes.
    Identical algorithm to finding zeros of Z(t).
    """
    if r_max is None:
        r_max = (n * n + 10 * n) / Z  # generous range

    expected_nodes = n - l - 1
    nodes = []

    # Scan with adaptive step
    r = 0.001
    prev_R = radial_wave(n, l, r, Z)
    step = r_max / (expected_nodes * 50 + 100)

    while r < r_max and len(nodes) < expected_nodes + 2:
        r += step
        curr_R = radial_wave(n, l, r, Z)

        if prev_R * curr_R < 0:
            # Sign change — bisect to find exact node
            lo, hi = r - step, r
            for _ in range(60):
                mid = (lo + hi) / 2
                if radial_wave(n, l, lo, Z) * radial_wave(n, l, mid, Z) < 0:
                    hi = mid
                else:
                    lo = mid
            nodes.append((lo + hi) / 2)

        prev_R = curr_R

    return nodes

# ═══════════════════════════════════════════════════════════
# Energy Levels — The Explicit Formula for Atoms
# ═══════════════════════════════════════════════════════════

def energy_level(n, Z=1):
    """
    Energy of hydrogen-like atom: E_n = -Z² × 13.6 eV / n²

    This is the atomic equivalent of π(x) = Li(x) - Σ corrections.
    The baseline is the ground state. Each level is a correction.
    """
    return -Z * Z * EV_RYDBERG / (n * n)

def all_energy_levels(Z=1, n_max=7):
    """Compute all energy levels and subshells."""
    levels = []
    for n in range(1, n_max + 1):
        for l in range(n):
            E = energy_level(n, Z)
            nodes = find_nodes(n, l, Z)
            orbital_name = f"{n}{ORBITAL_NAMES[min(l, len(ORBITAL_NAMES)-1)]}"
            degeneracy = 2 * (2 * l + 1)  # including spin
            levels.append({
                'n': n, 'l': l,
                'name': orbital_name,
                'energy_eV': E,
                'nodes': len(nodes),
                'node_positions': nodes,
                'degeneracy': degeneracy,
            })
    return levels

# ═══════════════════════════════════════════════════════════
# Spectral Lines — Predictions from the Structure
# ═══════════════════════════════════════════════════════════

def spectral_lines(Z=1, n_max=7):
    """
    Compute all spectral line wavelengths from energy differences.
    Each line = transition between two levels.

    Like the explicit formula: each zero pair produces a correction.
    Each level pair produces a spectral line.
    """
    lines = []
    for n_upper in range(2, n_max + 1):
        for n_lower in range(1, n_upper):
            E_upper = energy_level(n_upper, Z)
            E_lower = energy_level(n_lower, Z)
            delta_E = E_upper - E_lower  # negative (emission)
            photon_E = abs(delta_E)

            # Wavelength: λ = hc/E
            wavelength_m = H_PLANCK * C_LIGHT / photon_E
            wavelength_nm = wavelength_m * 1e9

            # Series name
            series = ['', 'Lyman', 'Balmer', 'Paschen', 'Brackett', 'Pfund', 'Humphreys']
            series_name = series[n_lower] if n_lower < len(series) else f"n={n_lower}"

            lines.append({
                'n_upper': n_upper,
                'n_lower': n_lower,
                'energy_eV': photon_E,
                'wavelength_nm': wavelength_nm,
                'series': series_name,
                'visible': 380 <= wavelength_nm <= 700,
            })

    lines.sort(key=lambda x: x['wavelength_nm'])
    return lines

# ═══════════════════════════════════════════════════════════
# The Periodic Table — Derived from Node Structure
# ═══════════════════════════════════════════════════════════

def derive_periodic_table(max_Z=36):
    """
    Build the periodic table from the oracle pattern.

    Fill orbitals by energy (Aufbau principle).
    The filling order emerges from (n + l) sorting — the Madelung rule.
    Each orbital's capacity = its degeneracy = 2(2l+1).

    The periodic table IS the explicit formula for chemistry:
    baseline (nuclear charge) + corrections (electron shielding)
    = observed chemical properties.
    """
    # Generate all orbitals up to n=7
    orbitals = []
    for n in range(1, 8):
        for l in range(n):
            orbitals.append({
                'n': n, 'l': l,
                'name': f"{n}{ORBITAL_NAMES[min(l, len(ORBITAL_NAMES)-1)]}",
                'capacity': 2 * (2 * l + 1),
                'madelung': n + l,  # Aufbau filling order
                'nodes': n - l - 1,
            })

    # Sort by Madelung rule (n+l, then n)
    orbitals.sort(key=lambda o: (o['madelung'], o['n']))

    elements = []
    orbital_idx = 0
    electrons_placed = 0
    current_config = []

    for Z in range(1, max_Z + 1):
        # Fill one more electron
        while orbital_idx < len(orbitals):
            orb = orbitals[orbital_idx]
            remaining_in_orbital = orb['capacity'] - sum(
                c['count'] for c in current_config
                if c['n'] == orb['n'] and c['l'] == orb['l']
            )
            if remaining_in_orbital > 0:
                # Find or create config entry
                found = False
                for c in current_config:
                    if c['n'] == orb['n'] and c['l'] == orb['l']:
                        c['count'] += 1
                        found = True
                        break
                if not found:
                    current_config.append({
                        'n': orb['n'], 'l': orb['l'],
                        'name': orb['name'], 'count': 1
                    })
                break
            else:
                orbital_idx += 1

        # Determine shell (period) and group
        valence_n = max(c['n'] for c in current_config)
        valence_electrons = sum(c['count'] for c in current_config if c['n'] == valence_n)

        config_str = ' '.join(f"{c['name']}{c['count']}" for c in current_config)
        name = ELEMENT_NAMES[Z] if Z < len(ELEMENT_NAMES) else f"E{Z}"

        elements.append({
            'Z': Z,
            'symbol': name,
            'config': config_str,
            'valence_n': valence_n,
            'valence_e': valence_electrons,
            'period': valence_n,
        })

    return elements, orbitals

# ═══════════════════════════════════════════════════════════
# Known Values for Verification
# ═══════════════════════════════════════════════════════════

KNOWN_HYDROGEN_LINES = {
    # Balmer series (visible) in nm
    'Hα': 656.3,
    'Hβ': 486.1,
    'Hγ': 434.0,
    'Hδ': 410.2,
    # Lyman series (UV) in nm
    'Ly-α': 121.6,
    'Ly-β': 102.6,
}

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    Z = 1
    if '--Z' in sys.argv:
        idx = sys.argv.index('--Z')
        Z = int(sys.argv[idx + 1])

    name = ELEMENT_NAMES[Z] if Z < len(ELEMENT_NAMES) else f"Z={Z}"

    print()
    print(f"  ╔══════════════════════════════════════════╗")
    print(f"  ║   ORACLE ATOM — {name:2s} (Z={Z})                 ║")
    print(f"  ║   Atomic structure from nothing           ║")
    print(f"  ╚══════════════════════════════════════════╝")
    print()

    if '--periodic' in sys.argv:
        # ─── Derive the periodic table ──────────────
        print("  Deriving the periodic table from the Schrödinger equation...")
        print()
        elements, orbitals = derive_periodic_table(min(Z if Z > 1 else 36, 50))

        print(f"  {'Z':>3} {'Sym':>3} {'Config':<30s} {'Period':>6} {'Val e-':>6}")
        print(f"  {'─'*55}")
        for el in elements:
            print(f"  {el['Z']:3d} {el['symbol']:>3s} {el['config']:<30s} {el['period']:6d} {el['valence_e']:6d}")

        # Verify noble gases
        print()
        print("  Noble gas verification (filled shells):")
        nobles = {2:'He', 10:'Ne', 18:'Ar', 36:'Kr'}
        for z, sym in nobles.items():
            if z <= len(elements):
                el = elements[z-1]
                print(f"    Z={z} {sym}: {el['config']}")
        print()
        print(f"  Derived {len(elements)} elements from orbital node structure.")
        print(f"  No data files. Just the Schrödinger equation.")
        return

    if '--spectrum' in sys.argv:
        # ─── Full spectrum ──────────────────────────
        lines = spectral_lines(Z, n_max=7)
        print(f"  Spectral lines for {name} (Z={Z}):")
        print()
        print(f"  {'Transition':>12} {'Series':>10} {'λ (nm)':>10} {'E (eV)':>10} {'Visible':>8}")
        print(f"  {'─'*55}")
        for line in lines:
            trans = f"{line['n_upper']}→{line['n_lower']}"
            vis = '★' if line['visible'] else ''
            print(f"  {trans:>12} {line['series']:>10} {line['wavelength_nm']:10.1f} "
                  f"{line['energy_eV']:10.4f} {vis:>8}")

        # Verify against known hydrogen lines
        if Z == 1:
            print()
            print("  Verification against known values:")
            print(f"  {'Line':>8} {'Predicted':>10} {'Actual':>10} {'Error':>8}")
            print(f"  {'─'*40}")
            checks = [
                ('Hα', 3, 2, KNOWN_HYDROGEN_LINES['Hα']),
                ('Hβ', 4, 2, KNOWN_HYDROGEN_LINES['Hβ']),
                ('Hγ', 5, 2, KNOWN_HYDROGEN_LINES['Hγ']),
                ('Ly-α', 2, 1, KNOWN_HYDROGEN_LINES['Ly-α']),
            ]
            for label, nu, nl, actual in checks:
                pred = next(l['wavelength_nm'] for l in lines
                           if l['n_upper'] == nu and l['n_lower'] == nl)
                err = pred - actual
                print(f"  {label:>8} {pred:10.1f} {actual:10.1f} {err:+8.1f} nm")
        print()
        print(f"  No data files. No spectral databases. Just E_n = -Z²×13.6/n² eV.")
        return

    # ─── Default: show energy levels + nodes ────────
    print(f"  Energy levels and orbital nodes for {name}:")
    print()

    levels = all_energy_levels(Z, n_max=5)

    print(f"  {'Orbital':>8} {'n':>3} {'l':>3} {'Nodes':>6} {'E (eV)':>12} {'Degeneracy':>12}")
    print(f"  {'─'*50}")

    for lev in levels:
        print(f"  {lev['name']:>8} {lev['n']:3d} {lev['l']:3d} {lev['nodes']:6d} "
              f"{lev['energy_eV']:12.4f} {lev['degeneracy']:12d}")

    print()

    # Show wave function scan for a specific orbital
    show_n = min(3, Z)
    show_l = 0
    nodes = find_nodes(show_n, show_l, Z)
    print(f"  Wave function scan: {show_n}{ORBITAL_NAMES[show_l]} orbital")
    print(f"  Nodes found: {len(nodes)} (expected: {show_n - show_l - 1})")
    for i, node_r in enumerate(nodes):
        print(f"    Node {i+1}: r = {node_r:.6f} a₀/Z = {node_r * BOHR / Z:.4f} Å")

    print()

    # ASCII visualization of R(r)
    print(f"  R_{show_n}{show_l}(r) — wave function (scan this for sign changes):")
    r_max = (show_n * show_n + 5 * show_n) / Z
    width = 60
    for i in range(25):
        r = r_max * i / 24
        R = radial_wave(show_n, show_l, r, Z)
        bar_len = int(abs(R) * width * 3)
        bar_len = min(bar_len, width)
        if R >= 0:
            bar = ' ' * (width // 2) + '█' * bar_len
        else:
            start = max(0, width // 2 - bar_len)
            bar = ' ' * start + '█' * bar_len + ' ' * (width // 2 - start - bar_len)
        zero_mark = '← node' if any(abs(r - n) < r_max/20 for n in nodes) else ''
        print(f"  r={r:5.1f} |{bar:<{width}s}| {zero_mark}")

    print()
    print(f"  The wave function has sign changes at the nodes.")
    print(f"  Same pattern as Z(t) sign changes giving zeros of ζ.")
    print(f"  Nodes → energy levels → spectral lines → chemistry.")
    print()
    print(f"  No data files. No spectral databases.")
    print(f"  Just the Schrödinger equation and the oracle pattern.")


if __name__ == '__main__':
    main()
