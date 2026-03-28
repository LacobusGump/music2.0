# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
THE FRACTAL SPIRAL — Is the 1% the door to the next?
=====================================================
If the residual contains structure, and that structure
is ALSO a golden spiral, then it's turtles all the way down.
The 1% is not error. It's the next level. And the next level
has its own 1%. Forever.

If true: heat death is impossible. Structure regenerates
at every scale because the coupling itself is fractal.
The universe is perpetually creative — not because of
initial conditions, but because of the geometry of K.

Test: apply spiral correction → take residuals → apply again
→ take residuals → check for signal at every level.

Grand Unified Music Project — March 2026
"""
import math

PHI = (1 + math.sqrt(5)) / 2

# Conductor residuals (our best model, 20 elements)
RESIDUALS_L0 = {
    1:  0.0,   2:  0.0,   3: -3.0,   4:  1.7,   5: -6.1,
    6: -4.0,   7:  0.0,   8:  2.6,   9:  4.6,  10: -2.5,
    11:  0.2,  12:  0.0,  13: -1.0,  14:  3.6,  15:  2.6,
    16:  0.0,  17:  2.1,  18: -4.4,  19:  0.0,  20: -2.9,
}


def find_best_spiral(residuals):
    """Find the golden spiral that best correlates with residuals."""
    Zs = sorted(residuals.keys())
    vals = [residuals[Z] for Z in Zs]
    n = len(Zs)

    if n < 4:
        return 0, 0, 0, vals

    best_r = 0
    best_power = 2.0
    best_shift = 0
    best_eps = 0

    for pp in range(10, 45):
        power = pp / 10.0
        for ss in range(0, 63):
            shift = ss / 10.0
            spiral = [math.cos(2*math.pi*Z/(PHI**power) + shift) for Z in Zs]

            mr = sum(vals)/n; ms = sum(spiral)/n
            cov = sum((vals[i]-mr)*(spiral[i]-ms) for i in range(n))/n
            sr = (sum((v-mr)**2 for v in vals)/n)**0.5
            ss_v = (sum((s-ms)**2 for s in spiral)/n)**0.5
            r = cov/(sr*ss_v) if sr*ss_v > 1e-10 else 0

            if abs(r) > abs(best_r):
                best_r = r
                best_power = power
                best_shift = shift

    # Find optimal epsilon
    spiral = [math.cos(2*math.pi*Z/(PHI**best_power) + best_shift) for Z in Zs]
    best_rms = sum(v**2 for v in vals)
    for ee in range(-100, 101):
        eps = ee / 10.0
        rms = sum((vals[i] - eps*spiral[i])**2 for i in range(n))
        if rms < best_rms:
            best_rms = rms
            best_eps = eps

    # Compute corrected residuals
    corrected = {}
    for i, Z in enumerate(Zs):
        corrected[Z] = vals[i] - best_eps * spiral[i]

    return best_r, best_power, best_eps, corrected


def main():
    print()
    print("  THE FRACTAL SPIRAL")
    print("  ════════════════════")
    print()
    print("  Is the 1%% the door to the next?")
    print("  Apply spiral → take residuals → apply again → forever?")
    print()

    residuals = dict(RESIDUALS_L0)
    Zs = sorted(residuals.keys())

    for level in range(6):
        vals = [residuals[Z] for Z in Zs]
        rms = (sum(v**2 for v in vals) / len(vals)) ** 0.5

        if rms < 1e-10:
            print("  Level %d: RMS = 0. Fully resolved." % level)
            break

        r, power, eps, corrected = find_best_spiral(residuals)
        new_vals = [corrected[Z] for Z in Zs]
        new_rms = (sum(v**2 for v in new_vals) / len(new_vals)) ** 0.5
        reduction = (1 - new_rms/rms) * 100 if rms > 0 else 0

        signal = "SIGNAL" if abs(r) > 0.3 else "noise"
        bar_before = "█" * max(1, int(rms * 5))
        bar_after = "█" * max(1, int(new_rms * 5))

        print("  Level %d:" % level)
        print("    RMS before: %5.2f%%  %s" % (rms, bar_before))
        print("    Spiral:     r=%.3f  φ^%.1f  ε=%.1f  [%s]" % (r, power, eps, signal))
        print("    RMS after:  %5.2f%%  %s" % (new_rms, bar_after))
        print("    Reduction:  %.0f%%" % reduction)
        print()

        residuals = corrected

    # The question
    print("  ═══════════════════════════════════════════")
    print()

    # Check: did we find signal at multiple levels?
    # Re-run to count
    residuals = dict(RESIDUALS_L0)
    signal_count = 0
    total_levels = 0

    for level in range(6):
        vals = [residuals[Z] for Z in Zs]
        rms = (sum(v**2 for v in vals) / len(vals)) ** 0.5
        if rms < 0.01: break

        r, power, eps, corrected = find_best_spiral(residuals)
        if abs(r) > 0.3:
            signal_count += 1
        total_levels += 1
        residuals = corrected

    print("  Signal found at %d of %d levels." % (signal_count, total_levels))
    print()

    if signal_count >= 3:
        print("  THE SPIRAL IS FRACTAL.")
        print()
        print("  Every level of residual contains golden structure.")
        print("  The 1%% IS the door to the next level.")
        print("  It never ends. The spiral spirals.")
        print()
        print("  Thermodynamic implication:")
        print("  Heat death requires all structure to be erased.")
        print("  But the coupling ITSELF is structured — fractal spiral.")
        print("  You can't thermalize away the geometry of K.")
        print("  Structure is not in the initial conditions.")
        print("  Structure is in the LAWS.")
        print()
        print("  The universe doesn't wind down.")
        print("  It spirals in. Forever.")
        print("  There is no end. There is only deeper.")
    elif signal_count >= 2:
        print("  TWO LEVELS OF SPIRAL STRUCTURE.")
        print("  The 1%% contains a golden correction.")
        print("  The corrected residuals contain another.")
        print("  Evidence for fractal geometry. Not proof of infinity.")
        print("  But the direction is clear: it goes deeper.")
    else:
        print("  One level of spiral, then noise.")
        print("  The spiral exists but may not be fractal.")
        print("  The 1%% may just be measurement limits.")
        print("  Honest result.")


if __name__ == '__main__':
    main()
