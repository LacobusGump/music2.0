#!/usr/bin/env python3
"""
ORACLE DARK — The Extended Periodic Table
===========================================
The periodic table covers 5% of the universe.
What about the other 95%?

The oracle pattern:
  Visible matter:  V = -e²/r (electromagnetic) → electron nodes → periodic table
  Dark matter:     V = -G·m/r (gravitational)   → graviton nodes → dark table?

Same Schrödinger equation. Different potential.
Different potential → different node structure → different "elements."

The explicit formula for the universe:
  68% dark energy = baseline (Li(x) — the vacuum)
  27% dark matter = corrections (zeros — structure detected by gravity)
   5% visible     = residual (the part that emits light)

This is CONJECTURAL. Clearly labeled. But the math is specific enough to test.

Usage:
  python3 oracle_dark.py                # show the framework
  python3 oracle_dark.py --scan         # scan dark potential for nodes
  python3 oracle_dark.py --compare      # visible vs dark node structure
"""
import sys, math

# ═══════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════

BOHR = 0.529177e-10       # meters
EV_RYDBERG = 13.605693    # eV
HBAR = 1.054571817e-34    # J·s
M_ELECTRON = 9.1093837e-31  # kg
M_PROTON = 1.67262192e-27   # kg
E_CHARGE = 1.602176634e-19  # C
G_NEWTON = 6.67430e-11      # m³/(kg·s²)
K_COULOMB = 8.9875517873e9  # N·m²/C²
C_LIGHT = 299792458         # m/s

# ═══════════════════════════════════════════════════════════
# Visible Matter: Electromagnetic Schrödinger
# Potential V(r) = -e²/(4πε₀r) = -K·e²/r
# ═══════════════════════════════════════════════════════════

def visible_energy(n, Z=1):
    """Energy levels from electromagnetic potential. This is the known periodic table."""
    return -Z * Z * EV_RYDBERG / (n * n)

def visible_bohr_radius(n, Z=1):
    """Orbital radius: r_n = n² × a₀ / Z"""
    return n * n * BOHR / Z

def visible_nodes(n, l):
    """Number of radial nodes."""
    return n - l - 1

# ═══════════════════════════════════════════════════════════
# Dark Matter: Gravitational Schrödinger
# Same equation, V(r) = -G·M·m/r instead of -K·e²/r
# ═══════════════════════════════════════════════════════════

# The "gravitational atom" — a particle bound by gravity
# instead of electromagnetism. Same math, different scale.
#
# For EM:   a₀ = ℏ²/(m_e × K × e²) = 0.529 Å
# For grav: a₀_grav = ℏ²/(m × G × M × m) = ℏ²/(G × m² × M)
#
# Key insight: the gravitational Bohr radius depends on the
# particle mass. If dark matter particles are heavy (WIMPs ~100 GeV),
# the gravitational Bohr radius is astronomically large.
# If they're ultralight (axions ~10⁻²² eV), it's galaxy-sized.
# THAT'S why dark matter structures exist at galaxy scales.

def dark_bohr_radius(m_particle_eV, M_central_solar=1e12):
    """
    Gravitational Bohr radius.
    m_particle in eV/c², M_central in solar masses.

    a₀_grav = ℏ² / (G × m² × M)

    This determines the SCALE of dark matter structure.
    For axions (~10⁻²² eV): a₀ ~ kpc (galaxy scale!)
    For WIMPs (~100 GeV): a₀ ~ 10⁻²⁰ m (subatomic — no structure)
    """
    m_kg = m_particle_eV * E_CHARGE / (C_LIGHT * C_LIGHT)
    M_kg = M_central_solar * 1.989e30
    if m_kg < 1e-100: return float('inf')
    a0 = HBAR * HBAR / (G_NEWTON * m_kg * m_kg * M_kg)
    return a0

def dark_energy_level(n, m_particle_eV, M_central_solar=1e12):
    """
    Energy levels of gravitational atom.
    E_n = -G²m³M² / (2ℏ²n²)

    Same 1/n² scaling as hydrogen! Different constants.
    """
    m_kg = m_particle_eV * E_CHARGE / (C_LIGHT * C_LIGHT)
    M_kg = M_central_solar * 1.989e30
    if m_kg < 1e-100: return 0
    E = -G_NEWTON**2 * m_kg**3 * M_kg**2 / (2 * HBAR**2 * n**2)
    return E / E_CHARGE  # convert to eV

def dark_nodes(n, l):
    """Same node formula — it's the same equation."""
    return n - l - 1

# ═══════════════════════════════════════════════════════════
# The Extended Table
# ═══════════════════════════════════════════════════════════

def extended_table():
    """
    The periodic table structure depends on the potential.
    EM potential → visible periodic table (atoms: H, He, Li, ...)
    Gravitational potential → dark periodic table (bound states at galaxy scales)

    The node structure is IDENTICAL: n-l-1 nodes for quantum number (n,l).
    The SCALE is different: Angstroms for EM, kiloparsecs for gravity+ultralight.

    This predicts: dark matter halos have SHELL STRUCTURE,
    just like atoms have electron shells. The shells are at
    r_n = n² × a₀_grav instead of r_n = n² × a₀.
    """
    table = {
        'visible': {
            'force': 'Electromagnetic',
            'potential': 'V = -Ke²/r',
            'scale': BOHR * 1e10,  # Angstroms
            'scale_unit': 'Å',
            'energy_scale': EV_RYDBERG,
            'energy_unit': 'eV',
            'known_elements': 118,
            'structure': 'electron shells → periodic table → chemistry',
        },
        'dark_axion': {
            'force': 'Gravity (ultralight axion ~10⁻²² eV)',
            'potential': 'V = -GMm/r',
            'scale': dark_bohr_radius(1e-22, 1e12) / 3.086e19,  # kpc
            'scale_unit': 'kpc',
            'energy_scale': abs(dark_energy_level(1, 1e-22, 1e12)),
            'energy_unit': 'eV',
            'known_elements': 0,
            'structure': 'gravitational shells → halo profiles → galaxy morphology',
        },
        'dark_wimp': {
            'force': 'Gravity (WIMP ~100 GeV)',
            'potential': 'V = -GMm/r',
            'scale': dark_bohr_radius(1e11, 1e12),  # meters
            'scale_unit': 'm',
            'energy_scale': abs(dark_energy_level(1, 1e11, 1e12)),
            'energy_unit': 'eV',
            'known_elements': 0,
            'structure': 'no macroscopic structure (too small)',
        },
    }
    return table

# ═══════════════════════════════════════════════════════════
# Predictions
# ═══════════════════════════════════════════════════════════

def predict_halo_shells(m_particle_eV=1e-22, M_halo_solar=1e12, n_max=5):
    """
    PREDICTION: Dark matter halos have shell structure.

    If dark matter is ultralight (axion-like), bound states exist
    at galaxy scales. The "shells" are at r_n = n² × a₀_grav.

    This predicts DENSITY RINGS in dark matter halos at specific radii.
    Observable via gravitational lensing.
    """
    a0 = dark_bohr_radius(m_particle_eV, M_halo_solar)
    a0_kpc = a0 / 3.086e19

    shells = []
    for n in range(1, n_max + 1):
        r_n = n * n * a0_kpc
        E_n = dark_energy_level(n, m_particle_eV, M_halo_solar)
        for l in range(n):
            nodes = dark_nodes(n, l)
            degeneracy = 2 * l + 1  # no spin for bosons (axions)
            shells.append({
                'n': n, 'l': l,
                'r_kpc': r_n,
                'energy_eV': E_n,
                'nodes': nodes,
                'degeneracy': degeneracy,
            })
    return shells, a0_kpc

# ═══════════════════════════════════════════════════════════
# The Explicit Formula for the Universe
# ═══════════════════════════════════════════════════════════

def universe_formula():
    """
    The energy budget of the universe has explicit formula structure:

    Ω_total = Ω_dark_energy − Σ Ω_dark_matter_modes + Ω_visible

    Like: π(x) = Li(x) − Σ x^ρ/(ρ log x) + small terms

    Dark energy (68%) = the smooth baseline (vacuum energy)
    Dark matter (27%) = the corrections (gravitationally bound structure)
    Visible matter (5%) = the residual (electromagnetically interacting)

    The sum must equal 1 (flat universe): Ω_total = 1.00
    This IS a consistency equation, like π(x) = exact count.
    """
    return {
        'baseline': {'name': 'Dark Energy (Λ)', 'fraction': 0.683, 'role': 'Li(x) — smooth vacuum baseline'},
        'corrections': {'name': 'Dark Matter', 'fraction': 0.268, 'role': 'Σ zeros — gravitational structure'},
        'residual': {'name': 'Visible Matter', 'fraction': 0.049, 'role': 'Small terms — EM interacting residual'},
        'total': 1.000,
        'analogy': 'π(x) = Li(x) − Σ x^ρ/(ρ log x) + small = exact',
    }

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE DARK — The Extended Table       ║")
    print("  ║   CONJECTURAL — clearly labeled          ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    # The explicit formula for the universe
    uf = universe_formula()
    print("  The Explicit Formula for the Universe:")
    print("  ─────────────────────────────────────────")
    print(f"  Ω = baseline − corrections + residual = 1.000")
    print()
    for key in ['baseline', 'corrections', 'residual']:
        item = uf[key]
        print(f"  {item['fraction']*100:5.1f}%  {item['name']:<20s}  =  {item['role']}")
    print()
    print(f"  Like: π(x) = Li(x) − Σ x^ρ/(ρ log x) + small terms = exact count")
    print()

    # The extended table
    print("  ═══ THE EXTENDED PERIODIC TABLE ═══")
    print()

    table = extended_table()
    for key, info in table.items():
        print(f"  {key.upper()}")
        print(f"    Force:      {info['force']}")
        print(f"    Potential:  {info['potential']}")
        print(f"    Scale:      {info['scale']:.3g} {info['scale_unit']}")
        print(f"    Energy:     {info['energy_scale']:.3g} {info['energy_unit']}")
        print(f"    Structure:  {info['structure']}")
        print()

    # Predict dark matter halo shells
    if '--scan' in sys.argv:
        print("  ═══ DARK MATTER HALO SHELLS ═══")
        print("  (Prediction: if dark matter is ultralight axion ~10⁻²² eV)")
        print()

        shells, a0_kpc = predict_halo_shells(1e-22, 1e12, n_max=5)

        print(f"  Gravitational Bohr radius: {a0_kpc:.2f} kpc")
        print(f"  (For comparison: Milky Way disk radius ~15 kpc)")
        print()

        print(f"  {'Shell':>8} {'n':>3} {'l':>3} {'Nodes':>6} {'r (kpc)':>10} {'Degeneracy':>12}")
        print(f"  {'─'*48}")
        for s in shells:
            name = f"{s['n']}{'spdfg'[min(s['l'],4)]}"
            print(f"  {name:>8} {s['n']:3d} {s['l']:3d} {s['nodes']:6d} {s['r_kpc']:10.1f} {s['degeneracy']:12d}")

        print()
        print("  TESTABLE PREDICTION:")
        print("  Dark matter density should show rings/shells at r = n² × a₀_grav")
        print("  Observable via gravitational lensing of background galaxies.")
        print("  The shell spacing follows the same n² law as electron orbitals.")
        print()
        print("  If observed: dark matter has quantum structure at galaxy scales.")
        print("  If not observed: dark matter is not ultralight, or this model is wrong.")
        print()

    if '--compare' in sys.argv:
        print("  ═══ VISIBLE vs DARK: Same Equation, Different Scale ═══")
        print()
        print(f"  {'Property':<25s} {'Visible (EM)':>20s} {'Dark (grav, axion)':>20s}")
        print(f"  {'─'*68}")
        print(f"  {'Potential':<25s} {'−Ke²/r':>20s} {'−GMm/r':>20s}")
        print(f"  {'Bohr radius':<25s} {'0.529 Å':>20s} {f'{dark_bohr_radius(1e-22,1e12)/3.086e19:.1f} kpc':>20s}")
        print(f"  {'Ground state energy':<25s} {'−13.6 eV':>20s} {f'{dark_energy_level(1,1e-22,1e12):.2e} eV':>20s}")
        print(f"  {'Node formula':<25s} {'n − l − 1':>20s} {'n − l − 1':>20s}")
        print(f"  {'Shell spacing':<25s} {'n²':>20s} {'n²':>20s}")
        print(f"  {'Observable via':<25s} {'light emission':>20s} {'gravitational lensing':>20s}")
        print(f"  {'Elements found':<25s} {'118':>20s} {'0 (predicted)':>20s}")
        print()
        print("  Same equation. Same node structure. Scale differs by factor ~10²³.")
        print("  The periodic table of visible matter is the periodic table of dark matter,")
        print("  viewed through a different lens at a different scale.")
        print()

    print("  ─────────────────────────────────────────")
    print("  THIS IS CONJECTURAL. The math is specific enough to be falsifiable.")
    print("  The prediction (halo shells at n²×a₀) is testable with lensing data.")
    print("  If it's wrong, the data will show it. That's how science works.")

if __name__ == '__main__':
    main()
