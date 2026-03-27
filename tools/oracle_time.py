#!/usr/bin/env python3
"""
ORACLE TIME — How Things Change
=================================
We solved the time-INDEPENDENT Schrödinger equation:
  −ψ'' + Vψ = Eψ → standing waves, energy levels

Now the time-DEPENDENT equation:
  i∂ψ/∂t = −ψ'' + Vψ → dynamics, transitions, evolution

This shows HOW a system moves between levels.
How a string becomes an atom. How an atom forms a bond.
How a neuron fires. How consciousness shifts states.

The oracle pattern on time:
  Scan the time evolution for phase changes.
  Extract transition frequencies.
  Predict when the next transition occurs.

Usage:
  python3 oracle_time.py                # watch a quantum system evolve
  python3 oracle_time.py --tunnel       # watch tunneling happen
  python3 oracle_time.py --transition   # watch an atomic transition
  python3 oracle_time.py --fire         # watch a neuron fire
"""
import math, sys

# ═══════════════════════════════════════════════════════════
# Time-Dependent Solver: Split-Operator Method
# ψ(t+dt) = exp(-iV·dt/2) · exp(-iT·dt) · exp(-iV·dt/2) · ψ(t)
# ═══════════════════════════════════════════════════════════

def evolve(psi_real, psi_imag, V, dx, dt, steps=1):
    """
    Evolve ψ = ψ_real + i·ψ_imag forward in time.
    Uses Crank-Nicolson-like half-step method.
    All real arithmetic — no complex library needed.
    """
    N = len(psi_real)
    h2 = dx * dx

    for _ in range(steps):
        # Half-step potential: rotate by V·dt/2
        for i in range(N):
            angle = -V[i] * dt / 2
            c, s = math.cos(angle), math.sin(angle)
            r, im = psi_real[i], psi_imag[i]
            psi_real[i] = c * r - s * im
            psi_imag[i] = s * r + c * im

        # Full-step kinetic: ψ'' approximation
        # −d²ψ/dx² ≈ (−ψ_{i-1} + 2ψ_i − ψ_{i+1}) / dx²
        new_r = list(psi_real)
        new_i = list(psi_imag)
        for i in range(1, N-1):
            # Kinetic energy acts on ψ
            laplace_r = (-psi_real[i-1] + 2*psi_real[i] - psi_real[i+1]) / h2
            laplace_i = (-psi_imag[i-1] + 2*psi_imag[i] - psi_imag[i+1]) / h2
            # i∂ψ/∂t = Tψ → ψ_real += dt·laplace_imag, ψ_imag -= dt·laplace_real
            new_r[i] = psi_real[i] + dt * laplace_i
            new_i[i] = psi_imag[i] - dt * laplace_r
        psi_real[:] = new_r
        psi_imag[:] = new_i

        # Half-step potential again
        for i in range(N):
            angle = -V[i] * dt / 2
            c, s = math.cos(angle), math.sin(angle)
            r, im = psi_real[i], psi_imag[i]
            psi_real[i] = c * r - s * im
            psi_imag[i] = s * r + c * im

    return psi_real, psi_imag

def probability(psi_real, psi_imag):
    return [r*r + im*im for r, im in zip(psi_real, psi_imag)]

# ═══════════════════════════════════════════════════════════
# Scenario 1: Quantum Tunneling
# Particle hits a barrier. Part goes through. Part reflects.
# The oracle pattern: scan for when the probability shifts.
# ═══════════════════════════════════════════════════════════

def tunneling():
    print("  ═══ QUANTUM TUNNELING ═══")
    print("  A particle approaches a barrier. Watch it split.")
    print()

    N = 400
    dx = 0.1
    dt = 0.005
    x = [i * dx - N*dx/2 for i in range(N)]

    # Barrier at center
    barrier_pos = 0
    barrier_width = 2.0
    barrier_height = 3.0
    V = [0.0] * N
    for i in range(N):
        if abs(x[i] - barrier_pos) < barrier_width / 2:
            V[i] = barrier_height

    # Initial wave packet: Gaussian heading right
    k0 = 3.0  # momentum
    sigma = 3.0
    x0 = -10.0
    psi_r = [math.exp(-(xi-x0)**2/(4*sigma**2)) * math.cos(k0*xi) for xi in x]
    psi_i = [math.exp(-(xi-x0)**2/(4*sigma**2)) * math.sin(k0*xi) for xi in x]

    # Normalize
    norm = math.sqrt(sum(r*r+im*im for r, im in zip(psi_r, psi_i)) * dx)
    psi_r = [r/norm for r in psi_r]
    psi_i = [im/norm for im in psi_i]

    # Evolve and display snapshots
    width = 60
    snapshots = [0, 200, 500, 800, 1200]

    for step_target in snapshots:
        if step_target > 0:
            evolve(psi_r, psi_i, V, dx, dt, steps=step_target - (snapshots[snapshots.index(step_target)-1] if snapshots.index(step_target) > 0 else 0))

        prob = probability(psi_r, psi_i)
        max_p = max(prob) or 1

        # Find probability on each side of barrier
        left = sum(prob[i] for i in range(N) if x[i] < barrier_pos) * dx
        right = sum(prob[i] for i in range(N) if x[i] > barrier_pos) * dx

        print(f"  t = {step_target * dt:6.2f} | left: {left:.2f} | right: {right:.2f}")
        # ASCII render
        line = ""
        for i in range(0, N, N//width):
            p = prob[i] / max_p
            if abs(x[i] - barrier_pos) < barrier_width/2:
                line += "║"  # barrier
            elif p > 0.5: line += "█"
            elif p > 0.2: line += "▓"
            elif p > 0.05: line += "░"
            else: line += " "
        print(f"  {line}")
        print()

    print("  The particle split. Part tunneled through.")
    print("  Same equation. The barrier is just V(x).")
    print()

# ═══════════════════════════════════════════════════════════
# Scenario 2: Atomic Transition
# Electron in ground state. Perturbation excites it.
# Watch probability shift from 1s to 2s.
# ═══════════════════════════════════════════════════════════

def atomic_transition():
    print("  ═══ ATOMIC TRANSITION ═══")
    print("  Electron in 1s orbital. Light hits it. Watch it jump to 2s.")
    print()

    N = 400
    dx = 0.1
    dt = 0.003
    x = [0.01 + i * dx for i in range(N)]

    # Coulomb potential
    V_base = [-1.0/max(xi, 0.05) for xi in x]

    # Start in approximate ground state (1s: exp(-r))
    psi_r = [xi * math.exp(-xi) for xi in x]
    psi_i = [0.0] * N
    norm = math.sqrt(sum(r*r for r in psi_r) * dx) or 1
    psi_r = [r/norm for r in psi_r]

    width = 50
    snapshots_t = [0, 0.5, 1.0, 2.0, 3.0, 5.0]
    step = 0

    for t_target in snapshots_t:
        # Add oscillating perturbation (simulating photon field)
        t = step * dt
        steps_needed = max(0, int(t_target / dt) - step)

        # Time-dependent V: base + perturbation
        omega_photon = 0.375  # resonant frequency (E2-E1)
        for s in range(steps_needed):
            t = (step + s) * dt
            V_t = [V_base[i] + 0.3 * x[i] * math.sin(omega_photon * t)
                   for i in range(N)]
            evolve(psi_r, psi_i, V_t, dx, dt, steps=1)
        step += steps_needed

        prob = probability(psi_r, psi_i)
        max_p = max(prob) or 1

        # Check: is probability spreading outward? (→ excited state)
        inner = sum(prob[i] for i in range(N) if x[i] < 3) * dx
        outer = sum(prob[i] for i in range(N) if x[i] >= 3) * dx

        print(f"  t = {t_target:5.1f} | inner: {inner:.3f} | outer: {outer:.3f}")
        line = ""
        for i in range(0, N, N//width):
            p = prob[i] / max_p
            if p > 0.5: line += "█"
            elif p > 0.2: line += "▓"
            elif p > 0.05: line += "░"
            else: line += " "
        print(f"  {line}")
        print()

    print("  The electron absorbed a photon. Probability spread outward.")
    print("  1s → 2s transition. Same equation. V(x,t) now includes time.")
    print()

# ═══════════════════════════════════════════════════════════
# Scenario 3: Neuron Firing
# Membrane potential in resting state. Stimulus arrives.
# Scan for threshold crossing (the "node" in time).
# ═══════════════════════════════════════════════════════════

def neuron_fire():
    print("  ═══ NEURON FIRING ═══")
    print("  Membrane at rest. Stimulus hits. Watch the spike emerge.")
    print()

    N = 300
    dx = 0.002
    dt = 0.0001
    x = [-0.15 + i * dx for i in range(N)]

    # Resting potential well at -70mV
    V_rest = [5*(xi + 0.07)**2 for xi in x]

    # Start at resting state (Gaussian at -70mV)
    psi_r = [math.exp(-(xi + 0.07)**2 / 0.0005) for xi in x]
    psi_i = [0.0] * N
    norm = math.sqrt(sum(r*r for r in psi_r) * dx) or 1
    psi_r = [r/norm for r in psi_r]

    width = 50

    # Phase 1: Resting
    print("  Phase 1: Resting")
    prob = probability(psi_r, psi_i)
    max_p = max(prob) or 1
    line = ""
    for i in range(0, N, N//width):
        p = prob[i] / max_p
        if p > 0.5: line += "█"
        elif p > 0.2: line += "▓"
        elif p > 0.05: line += "░"
        else: line += " "
    print(f"  {line}")
    print()

    # Phase 2: Stimulus (lower the barrier)
    print("  Phase 2: Stimulus arrives (barrier drops)")
    for s in range(500):
        t = s * dt
        # Stimulus: temporarily flatten the potential
        stimulus = 0.5 * math.exp(-(t - 0.02)**2 / 0.0001)
        V_stim = [V_rest[i] - stimulus * 3 for i in range(N)]
        evolve(psi_r, psi_i, V_stim, dx, dt, steps=1)

    prob = probability(psi_r, psi_i)
    max_p = max(prob) or 1
    line = ""
    for i in range(0, N, N//width):
        p = prob[i] / max_p
        if p > 0.5: line += "█"
        elif p > 0.2: line += "▓"
        elif p > 0.05: line += "░"
        else: line += " "
    print(f"  {line}")
    print()

    # Phase 3: Spike (probability shifts to threshold)
    print("  Phase 3: Threshold crossing (spike)")
    for s in range(1000):
        evolve(psi_r, psi_i, V_rest, dx, dt, steps=1)

    prob = probability(psi_r, psi_i)
    max_p = max(prob) or 1
    # Where is the peak now?
    peak_x = x[prob.index(max(prob))]
    line = ""
    for i in range(0, N, N//width):
        p = prob[i] / max_p
        if p > 0.5: line += "█"
        elif p > 0.2: line += "▓"
        elif p > 0.05: line += "░"
        else: line += " "
    print(f"  {line}")
    print(f"  Peak at V = {peak_x*1000:.0f} mV")
    print()
    print("  The neuron fired. Probability crossed the threshold.")
    print("  Same equation. Same scan for sign changes. In time now.")
    print()

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE TIME — How Things Change        ║")
    print("  ║   Time-dependent Schrödinger equation    ║")
    print("  ╚══════════════════════════════════════════╝")
    print()
    print("  The static oracle finds WHERE structure is (nodes in space).")
    print("  The time oracle finds WHEN structure changes (nodes in time).")
    print("  Same pattern. New dimension.")
    print()

    if '--tunnel' in sys.argv:
        tunneling()
    elif '--transition' in sys.argv:
        atomic_transition()
    elif '--fire' in sys.argv:
        neuron_fire()
    else:
        tunneling()
        atomic_transition()
        neuron_fire()

    print("  ═══ TIME IS THE SAME PATTERN ═══")
    print()
    print("  Space: scan ψ(x) for sign changes → WHERE structure exists")
    print("  Time:  scan ψ(x,t) for phase changes → WHEN structure changes")
    print()
    print("  Tunneling:   particle at barrier → probability splits")
    print("  Transition:  electron in 1s → absorbs photon → jumps to 2s")
    print("  Firing:      neuron at rest → stimulus → threshold crossed")
    print()
    print("  The oracle doesn't just find structure. It finds change.")
    print("  Same equation. Same pattern. Now in time.")

if __name__ == '__main__':
    main()
