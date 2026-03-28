# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
THE MACHINE AS INSTRUMENT
=========================
The coupling constant K IS the instrument.
The body sweeps K. The machine finds its own chord.

K=0.3  → 12 clusters (chromatic chaos/silence)
K=1.37 → 7 clusters (full scale)           ← alpha × 100
K=1.85 → 5 clusters (pentatonic)           ← 3/phi fixed point
K=3.0  → 4 clusters (power chord)
K=5.0  → 3 clusters (triad/unison)

At the golden ratio fixed point: pentatonic.
The universal scale every culture found independently.

Usage:
  python3 instrument.py          # sweep K, show all chords
  python3 instrument.py 1.37     # chord at specific K

Grand Unified Music Project — March 2026
"""
import math, sys

sys.path.insert(0, '.')
import machine as M

def clusters_at_K(Kval, steps=2000):
    M._build()
    zeros = M._zeros
    spacings = M._spacings
    N = M.N
    meanS = sum(spacings)/len(spacings)
    normS = [s/meanS for s in spacings]

    phases = [0.0]*N
    dt = 0.01

    for step in range(steps):
        mre = sum(math.cos(phases[i]) for i in range(N))/N
        mim = sum(math.sin(phases[i]) for i in range(N))/N
        mp = math.atan2(mim, mre)
        new = [0.0]*N
        for i in range(N):
            omega = normS[min(i,len(normS)-1)]*2*math.pi
            c = math.sin(mp-phases[i])
            if i>0: c+=0.5*math.sin(phases[i-1]-phases[i])
            if i<N-1: c+=0.5*math.sin(phases[i+1]-phases[i])
            new[i] = phases[i]+dt*(omega+Kval*c)
        phases = new

    mre=sum(math.cos(phases[i]%(2*math.pi)) for i in range(N))/N
    mim=sum(math.sin(phases[i]%(2*math.pi)) for i in range(N))/N
    R=math.sqrt(mre*mre+mim*mim)

    wrapped=[(phases[i]%(2*math.pi)) for i in range(N)]
    bins=[0]*12
    for w in wrapped:
        b=int(w/(math.pi/6))%12
        bins[b]+=1

    note_names=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']
    peaks=[(note_names[i], bins[i]) for i in range(12) if bins[i]>=8]

    return R, peaks

if __name__=='__main__':
    phi=(1+math.sqrt(5))/2

    if len(sys.argv)>1:
        Kval=float(sys.argv[1])
        R, peaks = clusters_at_K(Kval)
        notes=' '.join(n for n,c in peaks)
        print(f"  K={Kval:.2f}  R={R:.3f}  {len(peaks)} notes: {notes}")
    else:
        print("  THE MACHINE AS INSTRUMENT")
        print()
        for Kval in [0.3,0.5,0.8,1.0,1.37,1.85,2.0,2.5,3.0,4.0,5.0]:
            R, peaks = clusters_at_K(Kval)
            notes=' '.join(n for n,c in peaks)
            m=""
            if abs(Kval-1.37)<0.01:m=" ← alpha"
            if abs(Kval-3/phi)<0.02:m=" ← 3/phi"
            print(f"  K={Kval:4.2f}  R={R:.3f}  {len(peaks):2d} notes: {notes:30s}{m}")
