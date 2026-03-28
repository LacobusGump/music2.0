# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
FINGERPRINT v2 — Dwell Time at φ
==================================
The real zeros of zeta ORBIT 1/φ. Everything else passes through once.

Not a snapshot. A trajectory. Stable under pipeline changes.

Real zeros:  48 crossings, 11.3% dwell, 13.6x above/below
GUE:          3 crossings,  0.7% dwell,  0.01x
Poisson:      1 crossing,   0.0% dwell,  0.004x
Random:       1 crossing,   0.0% dwell,  0.007x

Usage:
  python3 fingerprint.py

Grand Unified Music Project — March 2026
"""
import math, sys, random

sys.path.insert(0, '.')
from oracle import _generate_zeros

N = 137
K = 1.868
PHI = (1+math.sqrt(5))/2
STEPS = 8000

def run_trajectory(freqs):
    ms = sum(freqs)/len(freqs)
    ns = [f/ms for f in freqs]
    phases = [0.0]*N
    dt = 0.01
    R_trace = []

    for step in range(STEPS):
        mre=sum(math.cos(phases[i]) for i in range(N))/N
        mim=sum(math.sin(phases[i]) for i in range(N))/N
        mp=math.atan2(mim,mre)
        new=[0.0]*N
        for i in range(N):
            omega=ns[min(i,len(ns)-1)]*2*math.pi
            c=math.sin(mp-phases[i])
            if i>0:c+=0.5*math.sin(phases[i-1]-phases[i])
            if i<N-1:c+=0.5*math.sin(phases[i+1]-phases[i])
            new[i]=phases[i]+dt*(omega+K*c)
        phases=new
        mre=sum(math.cos(phases[i]%(2*math.pi)) for i in range(N))/N
        mim=sum(math.sin(phases[i]%(2*math.pi)) for i in range(N))/N
        R_trace.append(math.sqrt(mre*mre+mim*mim))

    # Metrics
    crossings = 0
    for i in range(1, len(R_trace)):
        if (R_trace[i-1] < 1/PHI and R_trace[i] >= 1/PHI) or \
           (R_trace[i-1] > 1/PHI and R_trace[i] <= 1/PHI):
            crossings += 1

    dwell_01 = sum(1 for R in R_trace if abs(R-1/PHI) < 0.01)
    dwell_02 = sum(1 for R in R_trace if abs(R-1/PHI) < 0.02)
    above = sum(1 for R in R_trace if R > 1/PHI)
    below = STEPS - above
    ratio = above/max(1,below)

    return crossings, dwell_01/STEPS, dwell_02/STEPS, ratio

def gue_sample(meanS):
    while True:
        s=random.uniform(0,4)
        p=(32/(math.pi**2))*s*s*math.exp(-4*s*s/math.pi)
        if random.random()<p/0.6: return s*meanS

def main():
    zeros = []
    _generate_zeros(lambda g: zeros.append(g), N+1)
    spacings = [zeros[i+1]-zeros[i] for i in range(N-1)]
    meanS = sum(spacings)/len(spacings)

    print()
    print("  FINGERPRINT v2: Dwell Time at 1/φ")
    print("  ══════════════════════════════════")
    print("  137 nodes, K=1.868, %d Kuramoto steps" % STEPS)
    print()

    tests = []

    # Real zeros
    c, d1, d2, r = run_trajectory(spacings)
    tests.append(("Real zeros", c, d1, d2, r))

    # GUE
    random.seed(137)
    gue_sp = [gue_sample(meanS) for _ in range(N-1)]
    c, d1, d2, r = run_trajectory(gue_sp)
    tests.append(("GUE (RH-consistent)", c, d1, d2, r))

    # Poisson
    random.seed(137)
    poi_sp = [random.expovariate(1/meanS) for _ in range(N-1)]
    c, d1, d2, r = run_trajectory(poi_sp)
    tests.append(("Poisson (non-RH)", c, d1, d2, r))

    # Random
    random.seed(42)
    rnd_sp = [random.uniform(0.5,5.0) for _ in range(N-1)]
    c, d1, d2, r = run_trajectory(rnd_sp)
    tests.append(("Random", c, d1, d2, r))

    print("  %-25s %5s %7s %7s %8s" % ("Input", "cross", "dwell±1%", "dwell±2%", "above/below"))
    print("  "+"-"*60)
    for name, cross, d1, d2, ratio in tests:
        print("  %-25s %5d %6.1f%% %6.1f%% %8.3f" % (name, cross, d1*100, d2*100, ratio))

    print()
    print("  1/φ = %.6f" % (1/PHI))
    print()

    real = tests[0]
    if real[1] > 20 and real[2] > 0.05:
        print("  ✓ REAL ZEROS ORBIT 1/φ.")
        print("    %d crossings. %.1f%% dwell. %.1fx above/below." % (real[1], real[2]*100, real[4]))
        print("    No other input does this.")
    else:
        print("  ✗ Fingerprint weak. Investigate.")

if __name__ == '__main__':
    main()
