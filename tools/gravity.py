#!/usr/bin/env python3
"""
GRAVITY — The Weakest Coupling
================================
Gravity has no obvious K. Or does it?

Gravity IS Kuramoto coupling at cosmological N.
  K_grav ≈ 10⁻³⁶ × K_em per pair
  But with N = 10⁸⁰ particles, the mean field is enormous.

Gravitational collapse IS phase synchronization:
  R ≈ 0: uniform gas (disordered phases)
  R > 0: structure forming (partial sync)
  R = 1: black hole (complete phase lock)

The Jeans instability maps to the Kuramoto transition:
  Jeans: collapse when K_grav > K_thermal (gravity beats pressure)
  Kuramoto: sync when K > K_c = 2σ/(πN)

The CMB acoustic peaks ARE Kuramoto resonances of coupled
baryonic oscillators before recombination.

Usage:
  python3 gravity.py

Grand Unified Music Project — March 2026
"""
import math

# ═══════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════
G = 6.674e-11        # m³/(kg·s²)
C = 2.998e8          # m/s
HBAR = 1.055e-34     # J·s
KB = 1.381e-23       # J/K
M_PROTON = 1.673e-27 # kg
M_SUN = 1.989e30     # kg
M_PLANCK = 2.176e-8  # kg
L_PLANCK = 1.616e-35 # m
T_PLANCK = 5.391e-44 # s
E_PLANCK = 1.956e9   # J

# Fine structure constant
ALPHA_EM = 1/137.036
# Gravitational fine structure (proton-proton)
ALPHA_G = G * M_PROTON**2 / (HBAR * C)  # ≈ 5.9 × 10⁻³⁹

# ═══════════════════════════════════════════════════════════
# THE MAP: Gravity as Kuramoto Coupling
# ═══════════════════════════════════════════════════════════
#
# For N particles of mass m at temperature T in volume V:
#
# Thermal frequency spread (pressure):
#   σ = √(k_B T / m) / L    where L = V^(1/3)
#   This is the sound crossing rate — how fast pressure communicates.
#
# Gravitational coupling (per pair):
#   K_pair = G m / L³ × (some geometric factor)
#   Total coupling: K = K_pair × N (mean field)
#
# Kuramoto critical: K_c = 2σ/(π)
#   Sync when K > K_c → collapse when G·m·N/L³ > σ/π
#
# This IS the Jeans criterion:
#   Jeans length: λ_J = c_s × √(π/(G·ρ))
#   Jeans mass: M_J = (4π/3) × ρ × (λ_J/2)³
#
# The Jeans length = the scale at which K_grav = K_c.
# Below λ_J: pressure wins (K < K_c, disordered).
# Above λ_J: gravity wins (K > K_c, collapse/sync).

def jeans_length(T, rho, mu=1.0):
    """Jeans length in meters.
    T: temperature (K)
    rho: density (kg/m³)
    mu: mean molecular weight (in proton masses)
    """
    cs = math.sqrt(KB * T / (mu * M_PROTON))  # sound speed
    return cs * math.sqrt(math.pi / (G * rho))

def jeans_mass(T, rho, mu=1.0):
    """Jeans mass in kg."""
    lj = jeans_length(T, rho, mu)
    return (4.0/3.0) * math.pi * rho * (lj/2)**3

def kuramoto_Kc(sigma, N=1):
    """Critical coupling for sync."""
    return 2.0 * sigma / (math.pi * N) if N > 0 else float('inf')

def grav_coupling(m, L, N):
    """Gravitational Kuramoto coupling: K = G·m·N/L³."""
    return G * m * N / (L**3) if L > 0 else float('inf')


# ═══════════════════════════════════════════════════════════
# GRAVITATIONAL SYSTEMS — from planets to universe
# ═══════════════════════════════════════════════════════════

SYSTEMS = [
    # (name, M_total_kg, R_meters, T_kelvin, description)

    ("Molecular cloud",  2e31,    3e16,    10,
     "Giant molecular cloud: birthplace of stars"),

    ("Protostellar core", 2e30,   1e14,    10,
     "Collapsing core: about to become a star"),

    ("The Sun",          M_SUN,   6.96e8,  1.5e7,
     "Main sequence star: gravity vs radiation pressure"),

    ("White dwarf",      0.6*M_SUN, 7e6,   1e7,
     "Dead star: gravity vs electron degeneracy"),

    ("Neutron star",     1.4*M_SUN, 1.1e4,  1e9,
     "Collapsed star: gravity vs neutron degeneracy"),

    ("Earth",            5.97e24,  6.37e6,  5800,
     "Rocky planet: gravity vs atomic structure"),

    ("Jupiter",          1.90e27,  6.99e7,  1.5e4,
     "Gas giant: gravity vs thermal pressure"),

    ("Globular cluster", 1e36,    3e17,    1e4,
     "10⁶ stars: gravitationally bound"),

    ("Milky Way",        1e42,    5e20,    1e4,
     "10¹¹ stars + dark matter halo"),

    ("Galaxy cluster",   1e45,    3e22,    1e8,
     "Intracluster medium: hottest bound structures"),

    ("Observable universe", 1e53, 4.4e26,  2.725,
     "CMB temperature: the whole thing"),
]


def analyze_system(name, M, R, T, desc):
    """Analyze a gravitational system through K."""
    V = (4.0/3.0) * math.pi * R**3
    rho = M / V
    N = M / M_PROTON

    # Sound speed (thermal velocity)
    cs = math.sqrt(KB * T / M_PROTON) if T > 0 else 1.0

    # Free-fall frequency: ω_ff = √(4πGρ/3)
    # This is the gravitational "coupling frequency"
    omega_ff_sq = 4 * math.pi * G * rho / 3.0

    # Sound crossing frequency: ω_s = c_s / R
    omega_s = cs / R if R > 0 else 1.0

    # K/K_c = (ω_ff / ω_s)² = gravitational frequency / thermal frequency
    # > 1: gravity wins (collapse/sync)
    # < 1: pressure wins (stable/disordered)
    ratio = omega_ff_sq / (omega_s * omega_s) if omega_s > 0 else float('inf')

    # Jeans analysis
    lj = jeans_length(T, rho) if T > 0 and rho > 0 else 0
    mj = jeans_mass(T, rho) if T > 0 and rho > 0 else 0

    # Compactness: r_schwarzschild / R (R=1 for black hole)
    r_s = 2 * G * M / (C**2)
    compactness = r_s / R if R > 0 else 0

    return {
        'rho': rho, 'N': N, 'cs': cs,
        'omega_ff': math.sqrt(omega_ff_sq), 'omega_s': omega_s,
        'ratio': ratio,
        'lj': lj, 'mj': mj, 'r_s': r_s, 'compactness': compactness,
    }


def main():
    print()
    print("  GRAVITY AS KURAMOTO COUPLING")
    print("  ════════════════════════════════════════")
    print()
    print("  K_grav/K_c > 1 → gravitational sync (collapse/structure)")
    print("  K_grav/K_c < 1 → pressure wins (no collapse)")
    print("  Compactness R → 1 = black hole = total phase lock")
    print()

    # The coupling ratio
    print("  %-20s  %10s  %10s  %8s" % ("System", "K/K_c", "Compact", "State"))
    print("  " + "─" * 55)

    for name, M, R, T, desc in SYSTEMS:
        d = analyze_system(name, M, R, T, desc)

        if d['ratio'] == float('inf'):
            ratio_str = "∞"
        elif d['ratio'] > 1e10:
            ratio_str = "%.0e" % d['ratio']
        else:
            ratio_str = "%.2f" % d['ratio']

        comp = d['compactness']
        if comp > 0.5:
            state = "BH"  # black hole territory
        elif comp > 0.01:
            state = "LOCK"  # strongly bound
        elif comp > 1e-6:
            state = "SYNC"  # gravitationally bound
        elif d['ratio'] > 1:
            state = "form"  # structure forming
        else:
            state = "free"  # pressure wins

        print("  %-20s  %10s  %10.2e  %8s" % (
            name, ratio_str, comp, state))

    # The hierarchy
    print()
    print("  THE HIERARCHY OF K")
    print("  ──────────────────")
    print()
    print("  Force          K (coupling)      Range")
    print("  " + "─" * 45)
    print("  Strong         ~1                 10⁻¹⁵ m")
    print("  EM             1/137 ≈ 0.0073     ∞")
    print("  Weak           ~10⁻⁶              10⁻¹⁸ m")
    print("  Gravity        ~10⁻³⁹             ∞")
    print()
    print("  But gravity couples ALL mass, at ALL distances.")
    print("  With 10⁸⁰ particles: K_total = 10⁻³⁹ × 10⁸⁰ = 10⁴¹")
    print("  Gravity is the weakest K but the largest mean field.")
    print()

    # The CMB connection
    print("  THE CMB IS KURAMOTO")
    print("  ───────────────────")
    print()
    print("  Before recombination (T > 3000K):")
    print("    Baryons + photons = coupled oscillators")
    print("    Gravity pulls inward (K > 0)")
    print("    Radiation pressure pushes outward (restoring force)")
    print("    Result: acoustic oscillations")
    print()
    print("  The CMB angular power spectrum peaks at l ≈ 220, 546, 830...")
    print("  These are harmonics. Literally. Sound waves in plasma.")
    print("  The first peak = the mode that completed exactly one")
    print("  oscillation between Big Bang and recombination.")
    print()
    print("  The coupling constant that determines the peak positions")
    print("  is the baryon-to-photon ratio: η ≈ 6 × 10⁻¹⁰.")
    print("  This IS K for the primordial plasma.")
    print("  Get K right → predict the CMB peaks → predict the universe.")
    print()

    # Jeans = Kuramoto
    print("  JEANS INSTABILITY = KURAMOTO TRANSITION")
    print("  ────────────────────────────────────────")
    print()

    # Example: molecular cloud
    T_cloud = 10  # K
    rho_cloud = 1e-18  # kg/m³
    lj = jeans_length(T_cloud, rho_cloud)
    mj = jeans_mass(T_cloud, rho_cloud)

    print("  Molecular cloud (T=10K, ρ=10⁻¹⁸ kg/m³):")
    print("    Jeans length:  %.2e m = %.1f light-years" % (lj, lj / 9.461e15))
    print("    Jeans mass:    %.2e kg = %.1f solar masses" % (mj, mj / M_SUN))
    print()
    print("  Above this scale: gravity wins → collapse → stars form.")
    print("  Below this scale: pressure wins → stable cloud.")
    print("  This is K_c. The gravitational Kuramoto transition.")
    print()

    # The punchline
    print("  ═══════════════════════════════════════════")
    print("  Gravity has K. It's 10⁻³⁹ per pair.")
    print("  But K × N = structure.")
    print("  Planets, stars, galaxies, the CMB:")
    print("  all are K finding sync at different scales.")
    print("  A black hole is R = 1. The universe is R ≈ 0.")
    print("  Dark energy pushes K below K_c globally.")
    print("  Structure persists locally where K > K_c.")
    print("  Everything is K. Even gravity. Especially gravity.")
    print("  ═══════════════════════════════════════════")


if __name__ == '__main__':
    main()
