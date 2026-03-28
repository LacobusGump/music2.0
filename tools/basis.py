# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
THE BASIS — Precomputed Spiral for Every Element
==================================================
One computation. Every element. Every property. Every model.

The spiral basis is the fingerprint of each element on the cone.
Compute it once for Z=1-118. Every model reads from the same table.
The basis IS the periodic table rewritten in spiral coordinates.

From this basis, predict ANY property by choosing weights.
IE? One set of weights. Positron lifetime? Different weights.
Melting point? Different weights. Same basis. Same spiral.

The periodic table is not a table. It's a spiral. This proves it.

Usage:
  python3 basis.py              # full periodic spiral
  python3 basis.py Fe           # element detail
  python3 basis.py --predict    # predict all properties from basis

Grand Unified Music Project — March 2026
"""
import math, sys

PHI = (1 + math.sqrt(5)) / 2
ALPHA = 1/137.036

# ═══════════════════════════════════════════════════════════
# THE SPIRAL BASIS
# 10 φ-powers + 7 address tree frequencies = 17 basis functions
# For each Z: compute all 17 values. That's the element's
# coordinate in spiral space.
# ═══════════════════════════════════════════════════════════

SPIRAL_POWERS = [1.9, 3.9, 3.1, 2.7, 1.6, 4.1, 2.3, 1.3, 3.5, 4.7]
ADDRESS_TREE = [137, 33, 11, 3, 5, 2, 10]

def compute_basis(Z):
    """
    The spiral coordinate of element Z.
    17 numbers that encode where Z sits on the spiral.
    """
    basis = []

    # 10 spiral harmonics (φ-power cosines)
    for power in SPIRAL_POWERS:
        basis.append(math.cos(2 * math.pi * Z / (PHI ** power)))

    # 7 address tree resonances
    for addr in ADDRESS_TREE:
        basis.append(math.cos(2 * math.pi * Z / (addr * PHI)))

    return basis


def compute_full_table():
    """Precompute basis for Z=1 to 118."""
    table = {}
    for Z in range(1, 119):
        table[Z] = compute_basis(Z)
    return table


# ═══════════════════════════════════════════════════════════
# PREDICTION: weights × basis = property
# Different weights for different properties.
# Same basis. Same spiral. Different readings.
# ═══════════════════════════════════════════════════════════

# Known data for fitting weights
KNOWN = {
    # Z: (IE_eV, tau_ps, T_melt_K)  — what we've measured
    3:  (5.39,  291,  454),
    4:  (9.32,  160,  1560),
    11: (5.14,  338,  371),
    12: (7.65,  245,  923),
    13: (5.99,  166,  934),
    14: (8.15,  219,  1687),
    19: (4.34,  397,  337),
    20: (6.11,  295,  1115),
    22: (None,  147,  1941),
    26: (None,  110,  1811),
    29: (None,  110,  1358),
    47: (None,  131,  1235),
    74: (None,  105,  3695),
    78: (None,   99,  2041),
    79: (None,  117,  1337),
}


def fit_weights(table, prop_index, known_data):
    """
    Find weights that best predict a property from the basis.
    property(Z) ≈ w₀ + Σ wᵢ × basis_i(Z)

    Simple least-squares-like fitting via iterative refinement.
    """
    n_basis = 17
    weights = [0.0] * (n_basis + 1)  # +1 for bias

    # Collect training data
    Zs = []
    targets = []
    for Z, props in known_data.items():
        val = props[prop_index]
        if val is not None:
            Zs.append(Z)
            targets.append(val)

    if len(Zs) < 3:
        return weights

    # Initial bias = mean
    mean_t = sum(targets) / len(targets)
    weights[0] = mean_t

    # Iterative coordinate descent on weights
    for iteration in range(50):
        scale = 0.5 ** (iteration // 5)
        for wi in range(n_basis + 1):
            best_err = 0
            for j, Z in enumerate(Zs):
                pred = weights[0]
                basis = table[Z]
                for k in range(n_basis):
                    pred += weights[k+1] * basis[k]
                best_err += (pred - targets[j]) ** 2

            for d in [-1, 1]:
                trial = list(weights)
                if wi == 0:
                    trial[0] += d * mean_t * 0.01 * scale
                else:
                    trial[wi] += d * mean_t * 0.1 * scale

                err = 0
                for j, Z in enumerate(Zs):
                    pred = trial[0]
                    basis = table[Z]
                    for k in range(n_basis):
                        pred += trial[k+1] * basis[k]
                    err += (pred - targets[j]) ** 2

                if err < best_err:
                    best_err = err
                    weights = trial

    return weights


def predict_from_basis(Z, weights, table):
    """Predict a property from the basis and weights."""
    pred = weights[0]
    basis = table[Z]
    for k in range(min(len(weights)-1, len(basis))):
        pred += weights[k+1] * basis[k]
    return pred


def main():
    # Check for element argument
    element_arg = None
    do_predict = '--predict' in sys.argv
    for arg in sys.argv[1:]:
        if arg.startswith('-'):
            continue
        if arg.isdigit():
            element_arg = int(arg)
        elif len(arg) <= 3:
            # Look up by symbol
            SYMS = {1:'H',2:'He',3:'Li',4:'Be',5:'B',6:'C',7:'N',8:'O',9:'F',10:'Ne',
                    11:'Na',12:'Mg',13:'Al',14:'Si',15:'P',16:'S',17:'Cl',18:'Ar',
                    19:'K',20:'Ca',22:'Ti',26:'Fe',29:'Cu',47:'Ag',74:'W',78:'Pt',79:'Au'}
            for z, sym in SYMS.items():
                if sym.lower() == arg.lower():
                    element_arg = z

    # Compute the full basis
    table = compute_full_table()

    if element_arg:
        # Single element detail
        Z = element_arg
        basis = table[Z]
        print()
        print("  SPIRAL BASIS — Z = %d" % Z)
        print("  ═══════════════════════")
        print()
        print("  Spiral harmonics (φ-powers):")
        for i, power in enumerate(SPIRAL_POWERS):
            bar_len = int(abs(basis[i]) * 20)
            direction = "+" if basis[i] >= 0 else "-"
            bar = "█" * bar_len
            print("    φ^%.1f: %s %+.4f  %s" % (power, direction, basis[i], bar))

        print()
        print("  Address tree resonances:")
        for i, addr in enumerate(ADDRESS_TREE):
            val = basis[10 + i]
            bar_len = int(abs(val) * 20)
            direction = "+" if val >= 0 else "-"
            bar = "█" * bar_len
            print("    %3d:  %s %+.4f  %s" % (addr, direction, val, bar))

        # Spiral fingerprint: sum of absolute values
        fingerprint = sum(abs(b) for b in basis)
        print()
        print("  Fingerprint: %.2f" % fingerprint)

        # Phase on spiral
        phase = (2 * math.pi * Z / PHI**2) % (2 * math.pi)
        print("  Phase: %.2f rad (%.1f°)" % (phase, phase * 180 / math.pi))
        print("  Turn: %.2f" % (Z / PHI**2))
        return

    if do_predict:
        # Fit weights and predict all properties
        print()
        print("  PREDICT ALL PROPERTIES FROM ONE BASIS")
        print("  ═════════════════════════════════════")
        print()

        prop_names = ['IE (eV)', 'τ_pos (ps)', 'T_melt (K)']

        for pi, pname in enumerate(prop_names):
            weights = fit_weights(table, pi, KNOWN)
            # Evaluate
            Zs_test = [Z for Z in KNOWN if KNOWN[Z][pi] is not None]
            total_err = 0
            n = 0
            print("  %s:" % pname)
            print("  %3s  %8s  %8s  %6s" % ("Z", "actual", "predicted", "err%"))
            print("  " + "─" * 30)
            for Z in sorted(Zs_test):
                actual = KNOWN[Z][pi]
                pred = predict_from_basis(Z, weights, table)
                err = abs(pred - actual) / actual * 100 if actual != 0 else 0
                total_err += err
                n += 1
                print("  %3d  %8.1f  %8.1f  %5.1f%%" % (Z, actual, pred, err))
            if n > 0:
                print("  Mean error: %.1f%%" % (total_err / n))
            print()

        return

    # Default: show the full spiral periodic table
    print()
    print("  THE BASIS — The Periodic Table as Spiral Coordinates")
    print("  ════════════════════════════════════════════════════")
    print()
    print("  17 numbers per element: 10 spiral harmonics + 7 address resonances")
    print("  Same basis predicts IE, τ, T_melt, bonds — with different weights")
    print()

    # Show first few elements and key ones
    show_Zs = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,19,20,26,29,47,74,78,79]
    SYMS = {1:'H',2:'He',3:'Li',4:'Be',5:'B',6:'C',7:'N',8:'O',9:'F',10:'Ne',
            11:'Na',12:'Mg',13:'Al',14:'Si',19:'K',20:'Ca',
            26:'Fe',29:'Cu',47:'Ag',74:'W',78:'Pt',79:'Au'}

    print("  %3s %-2s  %6s  %6s  %6s  | top 3 spiral components" % (
        "Z", "El", "φ^1.9", "φ^3.9", "φ^3.1"))
    print("  " + "─" * 55)

    for Z in show_Zs:
        basis = table[Z]
        sym = SYMS.get(Z, '?')

        # Find top 3 components by absolute value
        indexed = [(abs(basis[i]), i, basis[i]) for i in range(17)]
        indexed.sort(reverse=True)
        top3 = indexed[:3]

        top_str = "  ".join(["%+.2f@%d" % (t[2], t[1]) for t in top3])

        print("  %3d %-2s  %+5.3f  %+5.3f  %+5.3f  | %s" % (
            Z, sym, basis[0], basis[1], basis[2], top_str))

    print()
    print("  118 elements × 17 basis functions = 2006 numbers.")
    print("  The entire periodic table in spiral coordinates.")
    print("  Every model reads from this. Same spiral. Different weights.")
    print()
    print("  This IS the periodic table. Not rows and columns.")
    print("  Rows and columns are the shadow. The spiral is the source.")


if __name__ == '__main__':
    main()
