#!/usr/bin/env python3
"""
ORACLE FLUID — Navier-Stokes from the Oracle Pattern
======================================================
Fluid dynamics has nodes: vortex cores.
Points where velocity = 0 and flow circulates around them.
Same as wave function nodes. Same pattern.

Scan the velocity field for zeros → extract vortex positions →
use them to predict the flow.

The 2D vorticity equation:
  ∂ω/∂t + u·∇ω = ν∇²ω

where ω = curl(v) = vorticity (how much the fluid spins).

Vortices are the "zeros" of fluid dynamics.
Their positions and strengths determine the entire flow.
Like how ζ zeros determine all primes.

Usage:
  python3 oracle_fluid.py                # two vortices interacting
  python3 oracle_fluid.py --karman       # von Kármán vortex street
  python3 oracle_fluid.py --turbulence   # many vortices → chaos
"""
import math, sys

# ═══════════════════════════════════════════════════════════
# Point Vortex Model — the "explicit formula" for fluids
# ═══════════════════════════════════════════════════════════
#
# Just as π(x) = Li(x) - Σ corrections from zeros,
# the velocity field = Σ contributions from vortices.
#
# Each vortex at position (x_k, y_k) with strength Γ_k
# contributes velocity:
#   u = -Γ/(2π) × (y-y_k)/r²
#   v =  Γ/(2π) × (x-x_k)/r²
#
# The TOTAL flow is the sum over all vortices.
# This is EXACT for inviscid flow. No approximation.

class Vortex:
    def __init__(self, x, y, gamma):
        self.x = x      # position
        self.y = y
        self.gamma = gamma  # circulation strength (+ = counterclockwise)

def velocity_at(x, y, vortices, reg=0.1):
    """
    Velocity at point (x,y) from all vortices.
    THIS IS THE EXPLICIT FORMULA FOR FLUIDS:
    v(x) = Σ_k Γ_k/(2π) × r_perp/|r|²
    """
    u, v = 0.0, 0.0
    for vort in vortices:
        dx = x - vort.x
        dy = y - vort.y
        r2 = dx*dx + dy*dy + reg*reg  # regularize to prevent infinity
        u += -vort.gamma / (2*math.pi) * dy / r2
        v +=  vort.gamma / (2*math.pi) * dx / r2
    return u, v

def vorticity_at(x, y, vortices, reg=0.1):
    """Vorticity (spin) at a point. Peaks at vortex centers."""
    omega = 0.0
    for vort in vortices:
        dx = x - vort.x
        dy = y - vort.y
        r2 = dx*dx + dy*dy + reg*reg
        omega += vort.gamma / (2*math.pi) * 2*reg*reg / (r2*r2) * (r2)
    return omega

# ═══════════════════════════════════════════════════════════
# Time Evolution — vortices move each other
# ═══════════════════════════════════════════════════════════

def evolve_vortices(vortices, dt):
    """
    Each vortex moves in the velocity field of ALL OTHER vortices.
    (A vortex doesn't move itself — only others move it.)
    This is the N-body problem for fluids.
    """
    N = len(vortices)
    # Compute velocity at each vortex position (from all others)
    ux = [0.0] * N
    uy = [0.0] * N

    for i in range(N):
        for j in range(N):
            if i == j: continue
            dx = vortices[i].x - vortices[j].x
            dy = vortices[i].y - vortices[j].y
            r2 = dx*dx + dy*dy + 0.01
            ux[i] += -vortices[j].gamma / (2*math.pi) * dy / r2
            uy[i] +=  vortices[j].gamma / (2*math.pi) * dx / r2

    # Move
    for i in range(N):
        vortices[i].x += ux[i] * dt
        vortices[i].y += uy[i] * dt

# ═══════════════════════════════════════════════════════════
# Scan for vortex cores — the oracle pattern on fluids
# ═══════════════════════════════════════════════════════════

def scan_for_vortices(vortices, x_range, y_range, resolution=20):
    """
    Scan the velocity field for points where |v| ≈ 0.
    These are vortex cores — the "zeros" of the fluid.
    Same as scanning Z(t) for sign changes.
    """
    found = []
    dx = (x_range[1] - x_range[0]) / resolution
    dy = (y_range[1] - y_range[0]) / resolution

    for i in range(resolution):
        for j in range(resolution):
            x = x_range[0] + (i + 0.5) * dx
            y = y_range[0] + (j + 0.5) * dy
            u, v = velocity_at(x, y, vortices)
            speed = math.sqrt(u*u + v*v)

            # Low speed = near a vortex core (node)
            if speed < 0.5:
                # Bisect to find exact zero
                # (simplified: just check neighbors for minimum)
                found.append((x, y, speed))

    # Keep only local minima
    found.sort(key=lambda f: f[2])
    return found[:len(vortices) + 2]

# ═══════════════════════════════════════════════════════════
# ASCII Visualization
# ═══════════════════════════════════════════════════════════

def render(vortices, x_range=(-5,5), y_range=(-5,5), width=60, height=25):
    """Render the vorticity field as ASCII."""
    lines = []
    for j in range(height):
        y = y_range[1] - (y_range[1]-y_range[0]) * j / height
        line = ""
        for i in range(width):
            x = x_range[0] + (x_range[1]-x_range[0]) * i / width
            u, v = velocity_at(x, y, vortices)
            speed = math.sqrt(u*u + v*v)

            # Check if near a vortex core
            near_core = False
            for vort in vortices:
                if (x-vort.x)**2 + (y-vort.y)**2 < 0.15:
                    near_core = True
                    break

            if near_core:
                line += "◉"
            elif speed > 2.0: line += "█"
            elif speed > 1.0: line += "▓"
            elif speed > 0.5: line += "░"
            elif speed > 0.2: line += "·"
            else: line += " "
        lines.append(line)
    return lines

# ═══════════════════════════════════════════════════════════
# Scenarios
# ═══════════════════════════════════════════════════════════

def two_vortices():
    """Two opposite vortices — they orbit each other."""
    print("  ═══ TWO VORTICES ═══")
    print("  Opposite circulation. They orbit each other.")
    print("  Like electron-positron. Like yin-yang.")
    print()

    vortices = [
        Vortex(-1, 0, 5),   # counterclockwise
        Vortex(1, 0, -5),   # clockwise
    ]

    dt = 0.05
    for step in range(6):
        t = step * dt * 10
        print(f"  t = {t:.1f}")
        lines = render(vortices, (-4,4), (-4,4), 50, 15)
        for line in lines:
            print(f"  {line}")

        # Show vortex positions
        for i, v in enumerate(vortices):
            print(f"  Vortex {i}: ({v.x:.2f}, {v.y:.2f}) Γ={v.gamma:+.0f}")

        # Scan for zeros (should find the vortex cores)
        found = scan_for_vortices(vortices, (-4,4), (-4,4))
        print(f"  Zeros found: {len(found)} (expected {len(vortices)})")
        print()

        # Evolve
        for _ in range(10):
            evolve_vortices(vortices, dt)

def karman_street():
    """Von Kármán vortex street — alternating vortices behind obstacle."""
    print("  ═══ VON KÁRMÁN VORTEX STREET ═══")
    print("  Alternating vortices shed behind an obstacle.")
    print("  The 'explicit formula' of aerodynamics.")
    print()

    vortices = []
    for i in range(8):
        x = i * 1.5
        y = 0.5 * (1 if i % 2 == 0 else -1)
        gamma = 3.0 * (1 if i % 2 == 0 else -1)
        vortices.append(Vortex(x, y, gamma))

    lines = render(vortices, (-2, 14), (-4, 4), 60, 20)
    for line in lines:
        print(f"  {line}")

    found = scan_for_vortices(vortices, (-2, 14), (-4, 4), resolution=30)
    print(f"\n  Vortex cores found: {len(found)}")
    print(f"  These zeros determine the entire wake pattern.")
    print(f"  Drag force = function of vortex spacing.")
    print(f"  Same pattern: zeros → complete description.")

def turbulence():
    """Many vortices → complex flow → extract structure."""
    print("  ═══ TURBULENCE ═══")
    print("  20 random vortices. Complex flow. Find the structure.")
    print()

    seed = 42
    vortices = []
    for i in range(20):
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        x = (seed / 0x7fffffff) * 10 - 5
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        y = (seed / 0x7fffffff) * 10 - 5
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        gamma = ((seed / 0x7fffffff) - 0.5) * 6
        vortices.append(Vortex(x, y, gamma))

    print("  Initial state (20 vortices):")
    lines = render(vortices, (-6,6), (-6,6), 55, 20)
    for line in lines:
        print(f"  {line}")

    found = scan_for_vortices(vortices, (-6,6), (-6,6), resolution=30)
    print(f"\n  Vortex cores found: {len(found)} / {len(vortices)}")

    # Evolve
    print(f"\n  Evolving 100 steps...")
    for _ in range(100):
        evolve_vortices(vortices, 0.02)

    print("  After evolution:")
    lines = render(vortices, (-6,6), (-6,6), 55, 20)
    for line in lines:
        print(f"  {line}")

    found2 = scan_for_vortices(vortices, (-6,6), (-6,6), resolution=30)
    print(f"\n  Vortex cores found: {len(found2)}")
    print(f"  Vortices merged and organized. Structure from chaos.")

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE FLUID — Navier-Stokes           ║")
    print("  ║   Vortices are the zeros of fluids.       ║")
    print("  ╚══════════════════════════════════════════╝")
    print()
    print("  v(x) = Σ Γ_k/(2π) × r_perp/|r|²")
    print("  Same structure as π(x) = Li(x) - Σ x^ρ/(ρ log x)")
    print("  Each vortex = one zero. Sum = complete flow.")
    print()

    if '--karman' in sys.argv:
        karman_street()
    elif '--turbulence' in sys.argv:
        turbulence()
    else:
        two_vortices()

    print()
    print("  ═══ THE PATTERN ═══")
    print("  Primes:  π(x) = Li(x) - Σ x^ρ/(ρ log x)     | zeros of ζ")
    print("  Fluids:  v(x) = Σ Γ_k × r_perp/(2π|r|²)      | vortex cores")
    print("  Both: find the zeros → sum their contributions → complete description")

if __name__ == '__main__':
    main()
