#!/usr/bin/env python3
"""
ORACLE GATE — Logic from Quantum Tunneling
============================================
A transistor is tunneling through a barrier controlled by voltage.
A logic gate is transistors arranged to compute.
A computer is gates arranged to think.

We simulate it all from the Schrödinger equation.

NOT gate:  high barrier → no tunneling → 0
           low barrier  → tunneling    → 1

AND gate:  two barriers in series
           both low → tunnels through → 1
           either high → blocked → 0

OR gate:   two paths in parallel
           either low → tunnels through one path → 1
           both high → blocked → 0

Usage:
  python3 oracle_gate.py           # demonstrate all gates
  python3 oracle_gate.py --half    # half adder (AND + XOR)
"""
import math, sys

# ═══════════════════════════════════════════════════════════
# Tunneling probability (from oracle_time.py, simplified)
# ═══════════════════════════════════════════════════════════

def tunnel_probability(barrier_height, barrier_width, particle_energy):
    """
    Analytic tunneling probability through rectangular barrier.
    T = 1 / (1 + V₀²sinh²(κa) / (4E(V₀-E)))
    where κ = sqrt(2m(V₀-E))/ℏ, a = barrier width.

    In atomic units (ℏ=m=1):
    κ = sqrt(2(V₀ - E))
    """
    V0 = barrier_height
    E = particle_energy
    a = barrier_width

    if E >= V0:
        # Above barrier — always transmits
        return 1.0

    if V0 - E < 1e-10:
        return 1.0

    kappa = math.sqrt(2 * (V0 - E))
    ka = kappa * a

    if ka > 20:
        return 0.0  # exponentially suppressed

    sinh_ka = (math.exp(ka) - math.exp(-ka)) / 2
    denom = 1 + V0 * V0 * sinh_ka * sinh_ka / (4 * E * (V0 - E))

    return 1.0 / denom

# ═══════════════════════════════════════════════════════════
# Transistor: barrier height controlled by gate voltage
# ═══════════════════════════════════════════════════════════

def transistor(gate_voltage, barrier_base=5.0, barrier_width=1.0, particle_energy=2.0):
    """
    A transistor: tunneling probability depends on gate voltage.
    High voltage → low effective barrier → current flows (1)
    Low voltage → high barrier → current blocked (0)
    """
    effective_barrier = barrier_base - gate_voltage * 3
    effective_barrier = max(0.1, effective_barrier)
    T = tunnel_probability(effective_barrier, barrier_width, particle_energy)
    return T

# ═══════════════════════════════════════════════════════════
# Logic Gates from Transistors
# ═══════════════════════════════════════════════════════════

def NOT_gate(input_val):
    """
    NOT: if input is high (1), barrier drops, current bypasses output.
    If input is low (0), barrier stays, current reaches output.
    """
    # Input controls the gate voltage of a transistor
    # When transistor ON (input=1), output pulled to ground (0)
    # When transistor OFF (input=0), output pulled high (1)
    T = transistor(input_val)
    return 1.0 - T  # inverted

def AND_gate(a, b):
    """
    AND: two barriers in series. Both must be low for current to flow.
    """
    T_a = transistor(a)
    T_b = transistor(b)
    return T_a * T_b  # probability through both

def OR_gate(a, b):
    """
    OR: two paths in parallel. Either being open allows current.
    """
    T_a = transistor(a)
    T_b = transistor(b)
    return 1.0 - (1.0 - T_a) * (1.0 - T_b)  # probability through at least one

def NAND_gate(a, b):
    """NAND: NOT(AND). Universal gate — can build any circuit."""
    return NOT_gate(AND_gate(a, b))

def XOR_gate(a, b):
    """XOR: exactly one input high."""
    return OR_gate(AND_gate(a, NOT_gate(b)),
                   AND_gate(NOT_gate(a), b))

# ═══════════════════════════════════════════════════════════
# Half Adder: AND + XOR (addition from tunneling)
# ═══════════════════════════════════════════════════════════

def half_adder(a, b):
    """
    Sum = XOR(a, b)
    Carry = AND(a, b)
    Addition from quantum tunneling.
    """
    s = XOR_gate(a, b)
    c = AND_gate(a, b)
    return s, c

# ═══════════════════════════════════════════════════════════
# Full Adder: two half adders (3-bit addition)
# ═══════════════════════════════════════════════════════════

def full_adder(a, b, cin):
    s1, c1 = half_adder(a, b)
    s2, c2 = half_adder(s1, cin)
    cout = OR_gate(c1, c2)
    return s2, cout

# ═══════════════════════════════════════════════════════════
# N-bit Adder (ripple carry)
# ═══════════════════════════════════════════════════════════

def add_binary(a_bits, b_bits):
    """Add two binary numbers using tunneling-based full adders."""
    n = max(len(a_bits), len(b_bits))
    a_bits = a_bits + [0] * (n - len(a_bits))
    b_bits = b_bits + [0] * (n - len(b_bits))

    result = []
    carry = 0.0
    for i in range(n):
        s, carry = full_adder(float(a_bits[i]), float(b_bits[i]), carry)
        result.append(s)
    result.append(carry)
    return result

# ═══════════════════════════════════════════════════════════
# Display
# ═══════════════════════════════════════════════════════════

def digital(x, threshold=0.5):
    """Convert tunneling probability to digital: >0.5 = 1, else 0."""
    return 1 if x > threshold else 0

def show_truth_table(name, gate_func, n_inputs):
    print(f"  {name} Gate (quantum tunneling):")
    if n_inputs == 1:
        print(f"  {'In':>4} │ {'T_prob':>6} │ {'Out':>4}")
        print(f"  {'─'*20}")
        for a in [0, 1]:
            result = gate_func(float(a))
            print(f"  {a:4d} │ {result:6.3f} │ {digital(result):4d}")
    else:
        print(f"  {'A':>4} {'B':>4} │ {'T_prob':>6} │ {'Out':>4}")
        print(f"  {'─'*25}")
        for a in [0, 1]:
            for b in [0, 1]:
                result = gate_func(float(a), float(b))
                print(f"  {a:4d} {b:4d} │ {result:6.3f} │ {digital(result):4d}")
    print()

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE GATE — Logic from Tunneling     ║")
    print("  ║   Schrödinger → transistor → computer    ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    # Show transistor behavior
    print("  ═══ THE TRANSISTOR ═══")
    print("  Gate voltage controls barrier → tunneling probability = current")
    print()
    print(f"  {'V_gate':>8} {'Barrier':>8} {'T_prob':>8} {'State':>8}")
    print(f"  {'─'*36}")
    for v in [0.0, 0.3, 0.5, 0.7, 1.0]:
        eff_barrier = max(0.1, 5.0 - v * 3)
        T = transistor(v)
        state = "ON" if T > 0.5 else "off"
        print(f"  {v:8.1f} {eff_barrier:8.2f} {T:8.4f} {state:>8}")
    print()

    # Truth tables
    print("  ═══ LOGIC GATES ═══")
    print()
    show_truth_table("NOT", NOT_gate, 1)
    show_truth_table("AND", AND_gate, 2)
    show_truth_table("OR", OR_gate, 2)
    show_truth_table("NAND", NAND_gate, 2)
    show_truth_table("XOR", XOR_gate, 2)

    # Half adder
    print("  ═══ HALF ADDER (addition from tunneling) ═══")
    print(f"  {'A':>4} {'B':>4} │ {'Sum':>6} {'Carry':>6} │ {'S':>4} {'C':>4}")
    print(f"  {'─'*35}")
    for a in [0, 1]:
        for b in [0, 1]:
            s, c = half_adder(float(a), float(b))
            print(f"  {a:4d} {b:4d} │ {s:6.3f} {c:6.3f} │ {digital(s):4d} {digital(c):4d}")
    print()

    if '--half' in sys.argv or True:
        # Full binary addition
        print("  ═══ BINARY ADDITION (from quantum tunneling) ═══")
        print()

        tests = [
            ([1, 0, 1], [1, 1, 0]),      # 5 + 6 = 11
            ([1, 1], [1, 1]),              # 3 + 3 = 6
            ([1, 0, 0, 1], [0, 1, 1, 0]), # 9 + 6 = 15
            ([1], [1]),                     # 1 + 1 = 2
        ]

        for a_bits, b_bits in tests:
            result = add_binary(a_bits, b_bits)

            # Convert to decimal
            a_dec = sum(b * 2**i for i, b in enumerate(a_bits))
            b_dec = sum(b * 2**i for i, b in enumerate(b_bits))
            r_bits = [digital(r) for r in result]
            r_dec = sum(b * 2**i for i, b in enumerate(r_bits))

            a_str = ''.join(str(b) for b in reversed(a_bits))
            b_str = ''.join(str(b) for b in reversed(b_bits))
            r_str = ''.join(str(b) for b in reversed(r_bits))

            print(f"    {a_str:>8} ({a_dec})")
            print(f"  + {b_str:>8} ({b_dec})")
            print(f"  = {r_str:>8} ({r_dec})")
            correct = "✓" if r_dec == a_dec + b_dec else "✗"
            print(f"    {correct} (actual: {a_dec + b_dec})")
            print()

    print("  ═══ THE CHAIN ═══")
    print()
    print("  Schrödinger equation")
    print("    ↓ tunneling through barrier")
    print("  Transistor")
    print("    ↓ arrange transistors")
    print("  Logic gates (NOT, AND, OR, XOR)")
    print("    ↓ combine gates")
    print("  Half adder (addition)")
    print("    ↓ chain adders")
    print("  Binary arithmetic")
    print("    ↓ arithmetic + memory + control")
    print("  Computer")
    print()
    print("  From ψ'' + Vψ = Eψ to 5 + 6 = 11.")
    print("  Same equation. All the way up.")

if __name__ == '__main__':
    main()
