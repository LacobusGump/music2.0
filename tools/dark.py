# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
DARK MATTER — The Deaf Oscillator
===================================
Hole 8: 95% of the universe.

Dark matter couples gravitationally (K_grav > 0) but not
electromagnetically (K_em = 0). In Kuramoto terms: it's a
deaf oscillator. It feels the mean field but doesn't
contribute to the electromagnetic order parameter.

The evidence: galaxy rotation curves. Stars at the edge
orbit too fast for visible mass alone. Something adds K_grav
without adding K_em. That's dark matter.

Prediction: the rotation curve shape IS the Kuramoto
coupling profile. Where K_visible + K_dark = K_total,
the rotation velocity follows v ∝ √(K_total × r).

Grand Unified Music Project — March 2026
"""
import math

G = 6.674e-11
M_SUN = 1.989e30
KPC = 3.086e19  # meters per kiloparsec

# ═══════════════════════════════════════════════════════════
# MILKY WAY ROTATION CURVE — measured velocities
# Sources: Sofue 2009, Eilers+ 2019
# ═══════════════════════════════════════════════════════════

ROTATION = [
    # (r_kpc, v_obs_km_s, v_visible_km_s)
    # v_visible from baryonic mass models (disk + bulge + gas)
    (1.0,   220,  200),
    (2.0,   225,  210),
    (3.0,   220,  200),
    (4.0,   225,  185),
    (5.0,   230,  170),
    (6.0,   230,  155),
    (7.0,   228,  145),
    (8.0,   230,  138),   # Sun's position
    (10.0,  230,  120),
    (12.0,  228,  105),
    (15.0,  225,   88),
    (20.0,  220,   70),
    (25.0,  218,   58),
    (30.0,  215,   50),
]


def nfw_profile(r_kpc, rho_0, r_s):
    """NFW dark matter density profile.
    ρ(r) = ρ_0 / (r/r_s × (1 + r/r_s)²)
    Standard for CDM halos.
    """
    x = r_kpc / r_s
    if x < 1e-10: x = 1e-10
    return rho_0 / (x * (1 + x)**2)


def dark_mass_enclosed(r_kpc, rho_0, r_s):
    """Mass enclosed within r for NFW profile.
    M(r) = 4π ρ_0 r_s³ [ln(1+r/r_s) - (r/r_s)/(1+r/r_s)]
    """
    x = r_kpc / r_s
    return 4 * math.pi * rho_0 * (r_s * KPC)**3 * (math.log(1 + x) - x/(1 + x))


def rotation_velocity(r_kpc, M_visible, rho_0, r_s):
    """Total rotation velocity from visible + dark matter."""
    r = r_kpc * KPC
    # Visible contribution (simplified: exponential disk)
    v_vis_sq = G * M_visible * (1 - math.exp(-r_kpc/3.0)) / r

    # Dark matter contribution
    M_dark = dark_mass_enclosed(r_kpc, rho_0, r_s)
    v_dark_sq = G * M_dark / r

    v_total = math.sqrt(max(0, v_vis_sq + v_dark_sq))
    return v_total / 1000  # m/s → km/s


def optimize_dark():
    """Find best NFW parameters for Milky Way."""
    M_vis = 5e10 * M_SUN
    best_err = float('inf')
    best_params = (1e-21, 20, M_vis)  # reasonable default

    # Grid search over rho_0 and r_s
    for log_rho_10 in range(-240, -190):
        rho_0 = 10 ** (log_rho_10 / 10.0)
        for r_s in range(8, 35, 3):
            err = 0
            for r_kpc, v_obs, v_vis in ROTATION:
                v_pred = rotation_velocity(r_kpc, M_vis, rho_0, r_s)
                err += (v_pred - v_obs)**2
            if err < best_err:
                best_err = err
                best_params = (rho_0, r_s, M_vis)

    # Fine-tune
    rho_0, r_s, M_vis = best_params
    for _ in range(10):
        for factor in [0.7, 0.85, 1.0, 1.15, 1.3]:
            for dr in [-2, -1, 0, 1, 2]:
                r_s_try = r_s + dr
                if r_s_try < 3: continue
                rho_try = rho_0 * factor
                err = sum((rotation_velocity(r, M_vis, rho_try, r_s_try) - v)**2
                          for r, v, _ in ROTATION)
                if err < best_err:
                    best_err = err
                    best_params = (rho_try, r_s_try, M_vis)
        rho_0, r_s, M_vis = best_params

    return best_params


def main():
    print()
    print("  DARK MATTER — THE DEAF OSCILLATOR")
    print("  ════════════════════════════════════")
    print()
    print("  Dark matter: K_grav > 0, K_em = 0.")
    print("  It feels gravity but doesn't shine.")
    print("  A deaf oscillator in the Kuramoto lattice.")
    print()

    rho_0, r_s, M_vis = optimize_dark()

    print("  MILKY WAY ROTATION CURVE")
    print("  " + "─" * 55)
    print("  %5s  %6s  %6s  %6s  %6s  %5s" % (
        "r(kpc)", "v_obs", "v_vis", "v_pred", "v_dark", "err%"))
    print("  " + "─" * 55)

    total_err = 0
    n = 0

    for r_kpc, v_obs, v_vis in ROTATION:
        v_pred = rotation_velocity(r_kpc, M_vis, rho_0, r_s)
        r = r_kpc * KPC
        M_dark = dark_mass_enclosed(r_kpc, rho_0, r_s)
        v_dark = math.sqrt(max(0, G * M_dark / r)) / 1000

        err = abs(v_pred - v_obs) / v_obs * 100
        total_err += err
        n += 1

        marker = " ◄ Sun" if abs(r_kpc - 8) < 0.5 else ""
        grade = "✓" if err < 5 else "~" if err < 10 else " "
        print("  %5.1f  %6.0f  %6.0f  %6.0f  %6.0f  %4.1f%% %s%s" % (
            r_kpc, v_obs, v_vis, v_pred, v_dark, err, grade, marker))

    mean_err = total_err / n

    print("  " + "─" * 55)
    print()
    print("  NFW halo: ρ₀ = %.1e kg/m³, r_s = %d kpc" % (rho_0, r_s))
    print("  Mean error: %.1f%%" % mean_err)

    # Dark matter fraction
    r_sun = 8 * KPC
    M_dark_sun = dark_mass_enclosed(8, rho_0, r_s)
    M_vis_sun = M_vis * (1 - math.exp(-8/3.0))
    f_dark = M_dark_sun / (M_dark_sun + M_vis_sun)

    print("  Dark matter fraction at Sun: %.0f%%" % (f_dark * 100))
    print()

    print("  THE KURAMOTO INTERPRETATION")
    print("  ───────────────────────────")
    print()
    print("  Visible matter: oscillators coupled by K_grav AND K_em.")
    print("  Dark matter: oscillators coupled by K_grav ONLY.")
    print()
    print("  The rotation curve is flat because dark matter")
    print("  adds gravitational coupling (K_grav) at large r")
    print("  where visible matter's K falls off.")
    print()
    print("  In Kuramoto terms: the dark oscillators maintain")
    print("  the mean field at large radius. They keep R > 0")
    print("  (bound orbit) where visible K alone would give R → 0")
    print("  (escape velocity).")
    print()
    print("  Dark matter doesn't break Everything is K.")
    print("  It completes it: some oscillators only couple")
    print("  through one channel. That's not mysterious.")
    print("  That's a selection rule on K.")


if __name__ == '__main__':
    main()
