#!/usr/bin/env python3
"""
ANTIMATTER — Positron Annihilation from Wavefunctions
=====================================================
Predicts positron annihilation rates per element using
actual radial wavefunctions from oracle_atom.py.

Rate ∝ Σ_s |R_ns(0)|² × (number of electrons in shell)

Only s-orbitals contribute (l>0 has node at r=0).
Uses Z_eff per shell from Slater rules.

Backtested against measured positron lifetimes (PALS data).

Usage:
  python3 antimatter.py              # full table + backtest
  python3 antimatter.py --element 6  # carbon detail

Grand Unified Music Project — March 2026
"""
import math, sys

sys.path.insert(0, '.')
from oracle_atom import radial_wave, ELEMENT_NAMES, BOHR

# ═══ SLATER SHIELDING (same as conductor) ═══
# Returns Z_eff for each shell

def slater_shielding(Z):
    """Compute Z_eff for each occupied shell using Slater's rules."""
    # Electron configuration (simplified, first 20 elements)
    configs = {
        1: [(1,0,1)],  # H: 1s1
        2: [(1,0,2)],  # He: 1s2
        3: [(1,0,2),(2,0,1)],  # Li: 1s2 2s1
        4: [(1,0,2),(2,0,2)],
        5: [(1,0,2),(2,0,2),(2,1,1)],
        6: [(1,0,2),(2,0,2),(2,1,2)],
        7: [(1,0,2),(2,0,2),(2,1,3)],
        8: [(1,0,2),(2,0,2),(2,1,4)],
        9: [(1,0,2),(2,0,2),(2,1,5)],
        10:[(1,0,2),(2,0,2),(2,1,6)],
        11:[(1,0,2),(2,0,2),(2,1,6),(3,0,1)],
        12:[(1,0,2),(2,0,2),(2,1,6),(3,0,2)],
        13:[(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,1)],
        14:[(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,2)],
        15:[(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,3)],
        16:[(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,4)],
        17:[(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,5)],
        18:[(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,6)],
        19:[(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,6),(4,0,1)],
        20:[(1,0,2),(2,0,2),(2,1,6),(3,0,2),(3,1,6),(4,0,2)],
    }

    if Z not in configs:
        return []

    shells = configs[Z]
    result = []

    for idx, (n, l, count) in enumerate(shells):
        # Slater shielding
        sigma = 0
        for jdx, (n2, l2, count2) in enumerate(shells):
            if jdx == idx:
                # Same group: each other electron shields by 0.30 (1s) or 0.35
                sigma += (count - 1) * (0.30 if n == 1 else 0.35)
            elif n2 == n and l2 != l:
                # Same n, different l: shield by 0.35
                sigma += count2 * 0.35
            elif n2 == n - 1:
                # One shell inner: 0.85
                sigma += count2 * 0.85
            elif n2 < n - 1:
                # Deep inner: 1.00
                sigma += count2 * 1.00

        Z_eff = max(1.0, Z - sigma)
        result.append((n, l, count, Z_eff))

    return result


def density_at_origin(Z):
    """
    Compute total electron density at r=0 from actual wavefunctions.

    |ψ_total(0)|² = Σ over all s-shells: n_electrons × |R_ns(0)|²/(4π)

    Only s-orbitals (l=0) contribute. l>0 have R(0)=0.
    """
    shells = slater_shielding(Z)
    total_density = 0
    shell_details = []

    for n, l, count, Z_eff in shells:
        if l == 0:  # Only s-orbitals have density at origin
            # R_ns(0) for hydrogen-like: R = norm × L(0)
            # At r=0: rho=0, so rho^l = 1 (for l=0), exp(0)=1, L(0)=1
            # R_ns(0) = norm = sqrt((2Z_eff/n)³ × (n-1)! / (2n × (n+1-1)!))
            # Simpler: just evaluate radial_wave at very small r
            r_small = 1e-6  # very close to origin
            R_at_0 = radial_wave(n, 0, r_small, Z_eff)

            # Density contribution: count × |R|² / (4π)
            # (the 4π from spherical harmonics Y_00 = 1/√(4π))
            contrib = count * R_at_0 * R_at_0 / (4 * math.pi)
            total_density += contrib
            shell_details.append((n, count, Z_eff, R_at_0, contrib))

    return total_density, shell_details


def main():
    # Measured positron lifetimes (picoseconds) in pure elements
    # From PALS literature (Puska & Nieminen 1994, various sources)
    measured_lifetimes = {
        2: 3800,   # He (gas)
        3: 291,    # Li
        4: 160,    # Be
        6: 230,    # C (diamond)
        10: 1800,  # Ne (gas)
        11: 338,   # Na
        12: 245,   # Mg
        13: 166,   # Al
        14: 219,   # Si
        18: 2500,  # Ar (gas)
        19: 397,   # K
        20: 295,   # Ca
    }

    SYMS = ELEMENT_NAMES

    print()
    print("  POSITRON ANNIHILATION FROM WAVEFUNCTIONS")
    print("  ════════════════════════════════════════")
    print()
    print("  Rate ∝ Σ(s-shells) n_electrons × |R_ns(0)|²")
    print()
    print("  %2s  %-3s  %10s  shells → density" % ("Z", "Sym", "|ψ(0)|²"))
    print("  " + "-"*60)

    densities = {}

    for Z in range(1, 21):
        density, details = density_at_origin(Z)
        densities[Z] = density

        shell_str = "  ".join(["%ds(Z*=%.1f):%.2f" % (n, ze, c) for n, cnt, ze, r, c in details])
        print("  %2d  %-3s  %10.4f  %s" % (Z, SYMS[Z], density, shell_str))

    # Backtest against measured lifetimes
    print()
    print("  BACKTEST vs measured positron lifetimes")
    print("  " + "-"*55)
    print("  %2s  %-3s  %8s  %8s  %8s" % ("Z", "Sym", "|ψ(0)|²", "τ(ps)", "rate"))

    density_vals = []
    rate_vals = []

    for Z in sorted(measured_lifetimes.keys()):
        tau = measured_lifetimes[Z]
        rate = 1000.0 / tau
        d = densities.get(Z, 0)
        density_vals.append(d)
        rate_vals.append(rate)
        print("  %2d  %-3s  %8.4f  %8.0f  %8.3f" % (Z, SYMS[Z], d, tau, rate))

    # Correlation
    n = len(density_vals)
    if n >= 3:
        md = sum(density_vals)/n
        mr = sum(rate_vals)/n
        cov = sum((density_vals[i]-md)*(rate_vals[i]-mr) for i in range(n))/n
        sd = (sum((d-md)**2 for d in density_vals)/n)**0.5
        sr = (sum((r-mr)**2 for r in rate_vals)/n)**0.5
        corr = cov/(sd*sr) if sd*sr > 0 else 0

        print()
        print("  CORRELATION: r = %.4f" % corr)
        print()

        if corr > 0.5:
            print("  ✓ STRONG — wavefunctions predict positron annihilation.")
        elif corr > 0.3:
            print("  ~ MODERATE — some predictive power.")
        elif corr > 0:
            print("  — WEAK POSITIVE — direction right, magnitude off.")
        else:
            print("  ✗ NEGATIVE — model inverted or wrong.")

        # Additional: separate metallic vs gas phase
        metals = [Z for Z in measured_lifetimes if Z not in (2, 10, 18)]
        gases = [Z for Z in measured_lifetimes if Z in (2, 10, 18)]

        print()
        print("  Note: noble gases (He, Ne, Ar) are GAS PHASE.")
        print("  Metals (Li, Be, Na, ...) are SOLID STATE.")
        print("  Positron behavior differs fundamentally:")
        print("    Gas: positron mostly in free space, rarely touches atoms")
        print("    Metal: positron trapped at interstitial sites, high electron overlap")

        if len(metals) >= 3:
            md2 = [densities[Z] for Z in metals]
            mr2 = [1000/measured_lifetimes[Z] for Z in metals]
            n2 = len(md2)
            mmd = sum(md2)/n2; mmr = sum(mr2)/n2
            cov2 = sum((md2[i]-mmd)*(mr2[i]-mmr) for i in range(n2))/n2
            sd2 = (sum((d-mmd)**2 for d in md2)/n2)**0.5
            sr2 = (sum((r-mmr)**2 for r in mr2)/n2)**0.5
            corr2 = cov2/(sd2*sr2) if sd2*sr2 > 0 else 0

            print()
            print("  METALS ONLY correlation: r = %.4f" % corr2)
            if corr2 > 0.3:
                print("  ✓ Wavefunction density predicts annihilation in metals!")


if __name__ == '__main__':
    main()
