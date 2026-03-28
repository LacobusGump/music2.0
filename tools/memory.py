# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
MEMORY — The Machine That Remembers
====================================
Hebbian learning: nodes that sync together tune together.
Frequencies shift permanently when nodes phase-lock.
Memory persists at K=0. The machine IS its memories.

Key finding:
  Memory at K=0 (dormant): 31%
  Frequency convergence after one life: 16.3%
  The lattice is CHANGED by what it lived.

This is Harmonia's architecture.

Usage:
  python3 memory.py              # run one life cycle
  python3 memory.py --lives 5    # run multiple lives, watch learning accumulate

Grand Unified Music Project — March 2026
"""
import math, sys
sys.path.insert(0, '.')
import machine as M

def run_with_memory(K_sequence, learning_rate=0.002, steps_per_K=300):
    M._build()
    N = M.N
    normS = [s/(sum(M._spacings)/len(M._spacings)) for s in M._spacings]
    freqs = list(normS[:N]) + [1.0]*(N-len(normS))
    orig_freqs = list(freqs)
    phases = [0.0]*N
    dt = 0.01
    history = []

    for Kval in K_sequence:
        for step in range(steps_per_K):
            mre=sum(math.cos(phases[i]) for i in range(N))/N
            mim=sum(math.sin(phases[i]) for i in range(N))/N
            mp=math.atan2(mim,mre)
            new=[0.0]*N
            for i in range(N):
                omega=freqs[i]*2*math.pi
                c=math.sin(mp-phases[i])
                if i>0:c+=0.5*math.sin(phases[i-1]-phases[i])
                if i<N-1:c+=0.5*math.sin(phases[i+1]-phases[i])
                new[i]=phases[i]+dt*(omega+Kval*c)
            for i in range(N-1):
                pd=abs(math.sin(phases[i]-phases[i+1]))
                sync=1-pd
                if sync>0.7:
                    avg=(freqs[i]+freqs[i+1])/2
                    freqs[i]+=(avg-freqs[i])*learning_rate
                    freqs[i+1]+=(avg-freqs[i+1])*learning_rate
                else:
                    freqs[i]+=(orig_freqs[i]-freqs[i])*learning_rate*0.1
                    freqs[i+1]+=(orig_freqs[i+1]-freqs[i+1])*learning_rate*0.1
            phases=new

        mre=sum(math.cos(phases[i]%(2*math.pi)) for i in range(N))/N
        mim=sum(math.sin(phases[i]%(2*math.pi)) for i in range(N))/N
        R=math.sqrt(mre*mre+mim*mim)
        f_std=(sum((f-sum(freqs)/N)**2 for f in freqs)/N)**0.5
        o_std=(sum((f-sum(orig_freqs)/N)**2 for f in orig_freqs)/N)**0.5
        mem=1-f_std/o_std if o_std>0 else 0
        history.append({'K':Kval,'R':R,'memory':mem})

    return history, freqs

if __name__=='__main__':
    n_lives=1
    if '--lives' in sys.argv:
        n_lives=int(sys.argv[sys.argv.index('--lives')+1])

    K_life=[]
    for i in range(20):K_life.append(i/20*2)
    for i in range(10):K_life.append(2.0)
    for i in range(20):K_life.append(2.0-i/20*2)
    for i in range(10):K_life.append(0.0)

    full_seq=K_life*n_lives
    h,f=run_with_memory(full_seq)
    life_len=len(K_life)

    print("  MEMORY ACROSS %d LIVES" % n_lives)
    for life in range(n_lives):
        peak_R=[x['R'] for x in h[life*life_len+19:life*life_len+30]]
        dormant_mem=[x['memory'] for x in h[life*life_len+49:life*life_len+60]]
        avg_R=sum(peak_R)/len(peak_R) if peak_R else 0
        avg_mem=sum(dormant_mem)/len(dormant_mem) if dormant_mem else 0
        print("  Life %d: peak R=%.4f, dormant memory=%.4f" % (life+1, avg_R, avg_mem))
