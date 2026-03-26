#!/usr/bin/env python3
"""
ORACLE LADDER — From String to Consciousness
==============================================
One equation: ∇²ψ + V(x)ψ = Eψ
Different V at each level. Same node-scanning pattern.
Each level's nodes become the next level's structure.

Level 1: String          V = tension          → harmonics
Level 2: Quantum box     V = walls            → quantized modes
Level 3: Atom            V = -e²/r            → electron shells
Level 4: Molecule        V = multi-well       → chemical bonds
Level 5: Crystal         V = periodic lattice  → band structure
Level 6: Biomolecule     V = folding landscape → protein shape
Level 7: Neuron          V = ion channels      → action potentials
Level 8: Network         V = synaptic coupling  → oscillation modes

One equation. Eight potentials. The ladder of reality.

Usage:
  python3 oracle_ladder.py           # climb the whole ladder
  python3 oracle_ladder.py --level 3 # show one level
"""
import sys, math

# ═══════════════════════════════════════════════════════════
# The One Equation: −d²ψ/dx² + V(x)ψ = Eψ
# Numerov method solves it for ANY potential V(x)
# ═══════════════════════════════════════════════════════════

def solve_schrodinger(V_func, x_min, x_max, E, n_points=2000):
    """
    Solve −ψ'' + V(x)ψ = Eψ using Numerov's method.
    Returns (x_array, psi_array).
    Works for ANY potential V(x). One solver. Every level.
    """
    dx = (x_max - x_min) / (n_points - 1)
    x = [x_min + i * dx for i in range(n_points)]
    psi = [0.0] * n_points

    # Boundary: ψ(x_min) = 0, ψ(x_min+dx) = small
    psi[0] = 0.0
    psi[1] = 1e-6

    # f(x) = V(x) - E (the effective potential)
    f = [V_func(xi) - E for xi in x]

    # Numerov integration: ψ_{n+1} = (2ψ_n(1 - 5h²f_n/12) - ψ_{n-1}(1 + h²f_{n-1}/12)) / (1 + h²f_{n+1}/12)
    h2 = dx * dx
    for i in range(1, n_points - 1):
        num = 2 * psi[i] * (1 - 5*h2*f[i]/12) - psi[i-1] * (1 + h2*f[i-1]/12)
        den = 1 + h2*f[i+1]/12
        if abs(den) < 1e-30: den = 1e-30
        psi[i+1] = num / den

        # Prevent overflow
        if abs(psi[i+1]) > 1e10:
            scale = 1e-10
            for j in range(i+2):
                psi[j] *= scale

    # Normalize
    norm = math.sqrt(sum(p*p for p in psi) * dx)
    if norm > 1e-30:
        psi = [p / norm for p in psi]

    return x, psi

def count_nodes(psi):
    """Count sign changes = nodes. The oracle's core operation."""
    nodes = 0
    for i in range(1, len(psi)):
        if psi[i-1] * psi[i] < 0:
            nodes += 1
    return nodes

def find_eigenvalue(V_func, x_min, x_max, n_target, E_min, E_max, n_points=2000):
    """
    Find the energy eigenvalue with n_target nodes.
    Bisect on energy until node count matches.
    IDENTICAL to finding zeros of Z(t) by bisection.
    """
    for _ in range(80):
        E_mid = (E_min + E_max) / 2
        _, psi = solve_schrodinger(V_func, x_min, x_max, E_mid, n_points)
        n = count_nodes(psi)

        if n > n_target:
            E_max = E_mid
        elif n < n_target:
            E_min = E_mid
        else:
            # Right node count — refine by checking boundary value
            # Correct eigenvalue has ψ → 0 at boundary
            if psi[-1] * psi[-2] > 0:
                E_min = E_mid
            else:
                E_max = E_mid

        if abs(E_max - E_min) < 1e-12:
            break

    return (E_min + E_max) / 2

def find_node_positions(x, psi):
    """Find exact positions of nodes by linear interpolation."""
    positions = []
    for i in range(1, len(psi)):
        if psi[i-1] * psi[i] < 0:
            # Linear interpolation
            frac = abs(psi[i-1]) / (abs(psi[i-1]) + abs(psi[i]))
            pos = x[i-1] + frac * (x[i] - x[i-1])
            positions.append(pos)
    return positions

# ═══════════════════════════════════════════════════════════
# THE EIGHT LEVELS
# Each level: different V(x), same solver, same node scan
# ═══════════════════════════════════════════════════════════

def level_1_string():
    """
    LEVEL 1: VIBRATING STRING
    V(x) = 0 (free vibration between fixed endpoints)
    Solutions: sin(nπx/L), nodes at x = k/n
    Exact: E_n = (nπ/L)²
    """
    L = 1.0
    V = lambda x: 0.0

    print("  ═══ LEVEL 1: VIBRATING STRING ═══")
    print("  V(x) = 0 between fixed walls at x=0 and x=L")
    print("  What vibrates: a string")
    print("  What emerges: harmonics")
    print()

    results = []
    for n in range(1, 6):
        E_exact = (n * math.pi / L) ** 2
        E_found = find_eigenvalue(V, 0, L, n - 1, 0.1, (6*math.pi/L)**2)
        x, psi = solve_schrodinger(V, 0, L, E_found)
        nodes = find_node_positions(x, psi)
        n_nodes = len(nodes)

        results.append((n, E_found, E_exact, n_nodes, nodes))
        err = abs(E_found - E_exact) / E_exact * 100
        print(f"  Mode {n}: E = {E_found:8.3f} (exact: {E_exact:8.3f}, err: {err:.2f}%) | {n_nodes} nodes")
        if nodes:
            print(f"          nodes at: {', '.join(f'{p:.3f}' for p in nodes[:5])}")

    print()
    # ASCII visualization of first 3 modes
    for n in range(1, 4):
        E = results[n-1][1]
        x, psi = solve_schrodinger(V, 0, L, E)
        print(f"  Mode {n}:", end="")
        for i in range(0, len(x), len(x)//40):
            v = psi[i]
            if abs(v) < 0.01: print("|", end="")
            elif v > 0: print("▀", end="")
            else: print("▄", end="")
        print()
    print()

def level_2_quantum_box():
    """
    LEVEL 2: PARTICLE IN A BOX (quantum mechanics emerges)
    V(x) = 0 inside, ∞ outside
    Same equation as string, but now ψ² = probability
    The nodes mean: regions where the particle CANNOT be found
    """
    L = 1.0
    V = lambda x: 0.0

    print("  ═══ LEVEL 2: QUANTUM BOX ═══")
    print("  Same V(x) = 0, but now ψ² = probability density")
    print("  What vibrates: quantum probability amplitude")
    print("  What emerges: quantized energy, forbidden regions")
    print()

    for n in range(1, 5):
        E = find_eigenvalue(V, 0, L, n - 1, 0.1, (6*math.pi)**2)
        x, psi = solve_schrodinger(V, 0, L, E)
        nodes = find_node_positions(x, psi)
        # Probability
        prob = [p*p for p in psi]
        max_prob = max(prob)

        print(f"  n={n}: E={E:.2f} | {len(nodes)} nodes = {len(nodes)} forbidden zones")
        # Show probability density
        print(f"  P(x):", end="")
        for i in range(0, len(x), len(x)//40):
            p = prob[i] / max_prob
            if p > 0.7: print("█", end="")
            elif p > 0.3: print("▓", end="")
            elif p > 0.1: print("░", end="")
            else: print(" ", end="")
        print()
    print()

def level_3_atom():
    """
    LEVEL 3: ATOM (Coulomb potential)
    V(r) = -Z/r
    Nodes of R(r) → electron shell structure → periodic table
    """
    print("  ═══ LEVEL 3: ATOM ═══")
    print("  V(r) = -1/r (Coulomb attraction)")
    print("  What vibrates: electron wave function")
    print("  What emerges: shells, periodic table")
    print()

    Z = 1
    for n in range(1, 5):
        l = 0  # s orbitals
        # Effective potential for radial equation: V_eff = -Z/r + l(l+1)/r²
        V = lambda r, _Z=Z, _l=l: -_Z / max(r, 0.01) + _l*(_l+1) / max(r*r, 0.0001)

        E_exact = -Z*Z / (2.0 * n*n)
        E_found = find_eigenvalue(V, 0.001, 50.0, n - l - 1, -Z*Z/2 - 1, 0.0)
        x, psi = solve_schrodinger(V, 0.001, 50.0, E_found)
        nodes = find_node_positions(x, psi)

        err = abs(E_found - E_exact) / abs(E_exact) * 100 if E_exact != 0 else 0
        print(f"  {n}s: E = {E_found:.6f} Ha (exact: {E_exact:.6f}, err: {err:.1f}%) | {len(nodes)} nodes")
        if nodes:
            print(f"      nodes at r = {', '.join(f'{p:.2f}' for p in nodes[:4])} Bohr")

    print()
    print(f"  Node count (n-l-1) determines shell structure.")
    print(f"  1s: 0 nodes → ground state")
    print(f"  2s: 1 node  → first excited state")
    print(f"  3s: 2 nodes → second excited state")
    print(f"  Fill shells by energy → periodic table emerges.")
    print()

def level_4_molecule():
    """
    LEVEL 4: MOLECULE (double-well potential)
    V(x) = -A/(|x-a|+ε) - A/(|x+a|+ε) (two nuclei)
    Bonding: ψ symmetric (no node between nuclei)
    Antibonding: ψ antisymmetric (node between nuclei)
    """
    print("  ═══ LEVEL 4: MOLECULE ═══")
    print("  V(x) = two Coulomb wells (two nuclei)")
    print("  What vibrates: shared electron cloud")
    print("  What emerges: chemical bonds (bonding/antibonding)")
    print()

    a = 1.4  # half bond distance in Bohr (H₂ ≈ 1.4 Bohr)
    depth = 1.0

    V = lambda x: -depth / (abs(x - a) + 0.5) - depth / (abs(x + a) + 0.5)

    # Find bonding (0 nodes) and antibonding (1 node) states
    E_bond = find_eigenvalue(V, -10, 10, 0, -5, 0)
    E_anti = find_eigenvalue(V, -10, 10, 1, -5, 0)

    x_b, psi_b = solve_schrodinger(V, -10, 10, E_bond)
    x_a, psi_a = solve_schrodinger(V, -10, 10, E_anti)

    nodes_b = find_node_positions(x_b, psi_b)
    nodes_a = find_node_positions(x_a, psi_a)

    # Filter out boundary nodes
    nodes_b = [n for n in nodes_b if -8 < n < 8]
    nodes_a = [n for n in nodes_a if -8 < n < 8]

    print(f"  Bonding state:     E = {E_bond:.4f} | {len(nodes_b)} nodes between nuclei → BOND")
    print(f"  Antibonding state: E = {E_anti:.4f} | {len(nodes_a)} node(s) between nuclei → NO BOND")
    print(f"  Bond energy: {E_anti - E_bond:.4f} (splitting)")
    print()

    # Visualize
    print(f"  Bonding ψ (shared, no node between nuclei):")
    print(f"  ", end="")
    for i in range(0, len(x_b), len(x_b)//50):
        v = psi_b[i]
        xi = x_b[i]
        if abs(xi - a) < 0.3 or abs(xi + a) < 0.3:
            print("⚛", end="")
        elif abs(v) < 0.005: print("|", end="")
        elif v > 0: print("▀", end="")
        else: print("▄", end="")
    print()

    print(f"  Antibonding ψ (node between nuclei = no sharing):")
    print(f"  ", end="")
    for i in range(0, len(x_a), len(x_a)//50):
        v = psi_a[i]
        xi = x_a[i]
        if abs(xi - a) < 0.3 or abs(xi + a) < 0.3:
            print("⚛", end="")
        elif abs(v) < 0.005: print("|", end="")
        elif v > 0: print("▀", end="")
        else: print("▄", end="")
    print("\n")

def level_5_crystal():
    """
    LEVEL 5: CRYSTAL (periodic potential → band structure)
    V(x) = repeating wells (Kronig-Penney model)
    Nodes organize into BANDS of allowed energies
    """
    print("  ═══ LEVEL 5: CRYSTAL ═══")
    print("  V(x) = periodic array of wells (solid matter)")
    print("  What vibrates: electron through crystal lattice")
    print("  What emerges: energy bands, conductors vs insulators")
    print()

    n_wells = 8
    spacing = 3.0
    depth = 2.0
    width = 1.0

    def V_crystal(x):
        for i in range(n_wells):
            center = i * spacing
            if abs(x - center) < width / 2:
                return -depth
        return 0.0

    L = n_wells * spacing
    energies = []
    for n_nodes in range(n_wells * 2):
        try:
            E = find_eigenvalue(V_crystal, -1, L + 1, n_nodes, -depth - 1, 5.0, n_points=3000)
            energies.append((n_nodes, E))
        except:
            break

    # Group into bands (energies that are close together)
    if energies:
        bands = [[energies[0]]]
        for i in range(1, len(energies)):
            if energies[i][1] - energies[i-1][1] < 0.3:
                bands[-1].append(energies[i])
            else:
                bands.append([energies[i]])

        for i, band in enumerate(bands[:4]):
            E_min = band[0][1]
            E_max = band[-1][1]
            width_b = E_max - E_min
            print(f"  Band {i+1}: E = [{E_min:.3f}, {E_max:.3f}] width={width_b:.3f} | {len(band)} states")

        if len(bands) >= 2:
            gap = bands[1][0][1] - bands[0][-1][1]
            print(f"  Band gap: {gap:.3f}")
            if gap > 0.5:
                print(f"  → INSULATOR (large gap)")
            elif gap > 0.05:
                print(f"  → SEMICONDUCTOR (small gap)")
            else:
                print(f"  → CONDUCTOR (no gap)")
    print()

def level_6_protein():
    """
    LEVEL 6: BIOMOLECULE (multi-well landscape)
    V(x) = energy landscape with multiple minima
    Each minimum = a stable folding state
    Nodes between minima = transition states
    """
    print("  ═══ LEVEL 6: BIOMOLECULE ═══")
    print("  V(x) = folding energy landscape (multiple minima)")
    print("  What vibrates: molecular conformation")
    print("  What emerges: protein structure, enzyme function")
    print()

    # Simplified protein folding landscape: 3 stable conformations
    def V_fold(x):
        return 0.5*(x*x - 4)**2 - 2*math.exp(-(x-2)**2) - 1.5*math.exp(-(x+2)**2) - math.exp(-x*x)

    # Find energy levels
    for n_nodes in range(6):
        try:
            E = find_eigenvalue(V_fold, -5, 5, n_nodes, -3, 10)
            x, psi = solve_schrodinger(V_fold, -5, 5, E)
            nodes = find_node_positions(x, psi)
            nodes = [n for n in nodes if -4 < n < 4]
            print(f"  State {n_nodes}: E = {E:.4f} | {len(nodes)} nodes")
            if n_nodes == 0:
                print(f"    → Ground state: protein folded (lowest energy)")
            elif n_nodes == 1:
                print(f"    → Excited: partially unfolded")
            else:
                print(f"    → Higher: transition state / misfolded")
        except:
            break
    print()

def level_7_neuron():
    """
    LEVEL 7: NEURON (ion channel potential)
    V(x) = membrane potential landscape
    Nodes = threshold crossings = action potentials
    """
    print("  ═══ LEVEL 7: NEURON ═══")
    print("  V(x) = ion channel potential (asymmetric well)")
    print("  What vibrates: membrane potential")
    print("  What emerges: action potentials, neural code")
    print()

    # Hodgkin-Huxley style potential: resting + threshold + spike
    V_rest = -0.07  # -70mV in natural units
    def V_neuron(x):
        return 2*(x - V_rest)**2 - 0.5*math.exp(-(x-0.03)**2/0.001) + 0.1*x

    for n_nodes in range(5):
        try:
            E = find_eigenvalue(V_neuron, -0.2, 0.2, n_nodes, -0.1, 0.5)
            x, psi = solve_schrodinger(V_neuron, -0.2, 0.2, E)
            nodes = find_node_positions(x, psi)
            nodes = [n for n in nodes if -0.15 < n < 0.15]
            state = ['resting', 'threshold', 'spiking', 'bursting', 'oscillating'][min(n_nodes, 4)]
            print(f"  State {n_nodes} ({state}): E = {E:.6f} | {len(nodes)} nodes")
        except:
            break

    print()
    print(f"  0 nodes = resting potential (silence)")
    print(f"  1 node  = threshold crossing (single spike)")
    print(f"  2 nodes = burst (information packet)")
    print(f"  More nodes = oscillation (rhythm, entrainment)")
    print()

def level_8_network():
    """
    LEVEL 8: NEURAL NETWORK (coupled oscillators)
    V(x) = collective potential of N coupled neurons
    Nodes = phase transitions between brain states
    """
    print("  ═══ LEVEL 8: CONSCIOUSNESS ═══")
    print("  V(x) = coupled oscillator potential (collective brain state)")
    print("  What vibrates: synchronization order parameter")
    print("  What emerges: awareness, thought, music")
    print()

    # Kuramoto-like potential for order parameter
    # V(θ) = -K × r × cos(θ) where r = coherence
    K = 2.0  # coupling strength
    def V_brain(x):
        return -K * math.cos(x) + 0.3 * x * x  # confining + periodic

    for n_nodes in range(6):
        try:
            E = find_eigenvalue(V_brain, -3*math.pi, 3*math.pi, n_nodes, -K-1, K+5)
            x, psi = solve_schrodinger(V_brain, -3*math.pi, 3*math.pi, E)
            nodes = find_node_positions(x, psi)
            states = ['deep sleep', 'dreaming', 'resting', 'focused', 'flow', 'transcendent']
            state = states[min(n_nodes, 5)]
            print(f"  Mode {n_nodes} ({state}): E = {E:.4f} | {len(nodes)} phase transitions")
        except:
            break

    print()
    print(f"  Each mode = a brain state.")
    print(f"  Transitions between modes = changes in consciousness.")
    print(f"  The nodes are where one state becomes another.")
    print(f"  Same equation as the vibrating string. Same nodes. Same scan.")
    print()


# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    level = None
    if '--level' in sys.argv:
        idx = sys.argv.index('--level')
        level = int(sys.argv[idx + 1])

    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE LADDER                          ║")
    print("  ║   From string to consciousness            ║")
    print("  ║   One equation. Eight potentials.         ║")
    print("  ╚══════════════════════════════════════════╝")
    print()
    print("  The equation: −d²ψ/dx² + V(x)ψ = Eψ")
    print("  The pattern:  scan ψ for nodes → extract structure → use")
    print("  Change V(x) at each level. Everything else stays the same.")
    print()

    levels = [
        (1, level_1_string),
        (2, level_2_quantum_box),
        (3, level_3_atom),
        (4, level_4_molecule),
        (5, level_5_crystal),
        (6, level_6_protein),
        (7, level_7_neuron),
        (8, level_8_network),
    ]

    for num, func in levels:
        if level is not None and num != level:
            continue
        func()

    print("  ═══ THE LADDER ═══")
    print()
    print("  One equation. Swap the potential. Scan the nodes.")
    print()
    print("  String      → harmonics      (V = 0)")
    print("  Box         → quantization   (V = walls)")
    print("  Atom        → periodic table  (V = -1/r)")
    print("  Molecule    → chemical bonds  (V = double well)")
    print("  Crystal     → band structure  (V = periodic)")
    print("  Protein     → folding states  (V = landscape)")
    print("  Neuron      → action potential (V = ion channels)")
    print("  Brain       → consciousness   (V = coupled oscillators)")
    print()
    print("  The nodes at each level ARE the structure of the next level.")
    print("  Scan, extract, use. All the way up. All the way down.")
    print()
    print("  It works because it works. From a vibrating string to a thinking mind.")
    print("  Same math. Same pattern. Same equation.")


if __name__ == '__main__':
    main()
