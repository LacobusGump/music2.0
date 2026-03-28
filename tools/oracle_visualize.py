# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
ORACLE CHAIN — 3D Visualization + GIF
=======================================
Renders the full ladder: string → consciousness
Each level stacked in 3D, wave functions glowing,
nodes marked, connections between levels visible.
Rotating camera. Saves as GIF.

Usage:
  python3 oracle_visualize.py              # render + save GIF
  python3 oracle_visualize.py --frames 60  # more frames = smoother
"""
import math, sys, os

# ─── Solver (from oracle_chain.py) ───────────────────────

def solve(V, x0, x1, E, N=800):
    dx = (x1-x0)/(N-1)
    x = [x0+i*dx for i in range(N)]
    psi = [0.0]*N; psi[0]=0; psi[1]=dx
    h2 = dx*dx
    for i in range(1,N-1):
        fp=V(x[i-1])-E; fc=V(x[i])-E; fn=V(x[i+1])-E
        num=2*psi[i]*(1+5*h2*fc/12)-psi[i-1]*(1-h2*fp/12)
        den=1-h2*fn/12
        if abs(den)<1e-30: den=1e-30
        psi[i+1]=num/den
        if abs(psi[i+1])>1e15:
            for j in range(i+2): psi[j]*=1e-15
    norm=math.sqrt(sum(p*p for p in psi)*dx)
    if norm>0: psi=[p/norm for p in psi]
    return x, psi

def nodes(psi):
    n=0
    for i in range(1,len(psi)):
        if psi[i-1]*psi[i]<0: n+=1
    return n

def find_E(V, x0, x1, target, Elo, Ehi):
    for _ in range(80):
        Em=(Elo+Ehi)/2
        _,p=solve(V,x0,x1,Em)
        n=nodes(p)
        if n>target: Ehi=Em
        elif n<target: Elo=Em
        else:
            if abs(p[-1])>abs(p[-2]): Ehi=Em
            else: Elo=Em
        if abs(Ehi-Elo)<1e-10: break
    return (Elo+Ehi)/2

# ─── Compute all 7 levels ────────────────────────────────

def compute_chain():
    levels = []

    # Level 1: String
    V1 = lambda x: 0.0
    L = math.pi
    states1 = []
    for n in range(1,4):
        E = find_E(V1,0,L,n-1,0.01,300)
        x,psi = solve(V1,0,L,E)
        states1.append({'x':x,'psi':psi,'E':E,'n':n})
    levels.append({'name':'String','states':states1,'color':'#FFD700'})

    # Level 2: Atom
    states2 = []
    for n in range(1,4):
        V2 = lambda r: -1.0/max(r,0.05)
        E = find_E(V2,0.01,40,n-1,-2,-0.001)
        x,psi = solve(V2,0.01,40,E)
        states2.append({'x':x,'psi':psi,'E':E,'n':n})
    levels.append({'name':'Atom','states':states2,'color':'#4ECDC4'})

    # Level 3: Molecule
    a = 1.0
    V3 = lambda x: -1.5/(abs(x-a)+0.4) - 1.5/(abs(x+a)+0.4)
    states3 = []
    for n in range(3):
        E = find_E(V3,-10,10,n,-10,2)
        x,psi = solve(V3,-10,10,E)
        states3.append({'x':x,'psi':psi,'E':E,'n':n})
    levels.append({'name':'Molecule','states':states3,'color':'#FF6B6B'})

    # Level 4: Crystal
    lc=2.0; nc=6; wd=2.0
    def V4(x):
        for i in range(nc):
            if abs(x-i*lc)<lc*0.3: return -wd
        return 0.0
    states4 = []
    for n in range(3):
        E = find_E(V4,-1,nc*lc+1,n,-wd-1,wd)
        x,psi = solve(V4,-1,nc*lc+1,E,N=1200)
        states4.append({'x':x,'psi':psi,'E':E,'n':n})
    levels.append({'name':'Crystal','states':states4,'color':'#C9A44A'})

    # Level 5: Protein
    def V5(x):
        return 0.3*x*x - 2*math.exp(-(x-2)**2) - 1.5*math.exp(-(x+2)**2) - math.exp(-x*x)
    states5 = []
    for n in range(3):
        E = find_E(V5,-6,6,n,-4,8)
        x,psi = solve(V5,-6,6,E)
        states5.append({'x':x,'psi':psi,'E':E,'n':n})
    levels.append({'name':'Protein','states':states5,'color':'#96CEB4'})

    # Level 6: Neuron
    def V6(x):
        return 5*(x+0.07)**2 - 0.8*math.exp(-(x-0.0)**2/0.001)
    states6 = []
    for n in range(3):
        E = find_E(V6,-0.2,0.15,n,-1,15)
        x,psi = solve(V6,-0.2,0.15,E)
        states6.append({'x':x,'psi':psi,'E':E,'n':n})
    levels.append({'name':'Neuron','states':states6,'color':'#9B59B6'})

    # Level 7: Consciousness
    def V7(x):
        return 0.1*x*x - 2*math.cos(x) - math.cos(2*x)*0.5
    states7 = []
    for n in range(3):
        E = find_E(V7,-10,10,n,-4,10)
        x,psi = solve(V7,-10,10,E)
        states7.append({'x':x,'psi':psi,'E':E,'n':n})
    levels.append({'name':'Consciousness','states':states7,'color':'#E8E4DC'})

    return levels

# ─── Render frames ───────────────────────────────────────

def render_gif(levels, n_frames=36, output_path='oracle_chain.gif'):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d import Axes3D
    from PIL import Image
    import io

    frames = []
    n_levels = len(levels)

    for frame in range(n_frames):
        fig = plt.figure(figsize=(10, 8), facecolor='#0a0a0f')
        ax = fig.add_subplot(111, projection='3d', facecolor='#0a0a0f')

        # Camera angle: rotate around
        elev = 25 + 5 * math.sin(2 * math.pi * frame / n_frames)
        azim = frame * 360 / n_frames
        ax.view_init(elev=elev, azim=azim)

        # Build-up animation: levels appear one by one in first half
        build_progress = min(1.0, frame / (n_frames * 0.6))
        visible_levels = int(build_progress * n_levels) + 1
        visible_levels = min(visible_levels, n_levels)

        for lev_idx in range(visible_levels):
            level = levels[lev_idx]
            z_base = lev_idx * 2.0  # vertical stacking
            color = level['color']

            # Fade in
            alpha_base = min(1.0, (build_progress * n_levels - lev_idx) * 2)
            alpha_base = max(0.0, alpha_base)

            # Plot ground state wave function
            if level['states']:
                st = level['states'][0]
                x = st['x']
                psi = st['psi']

                # Normalize x to [-1, 1] for display
                x_min, x_max = x[0], x[-1]
                x_range = x_max - x_min or 1
                x_norm = [(xi - x_min) / x_range * 2 - 1 for xi in x]

                # Scale psi for visibility
                psi_max = max(abs(p) for p in psi) or 1
                psi_norm = [p / psi_max * 0.8 for p in psi]

                # Subsample for performance
                step = max(1, len(x) // 100)
                xs = x_norm[::step]
                ps = psi_norm[::step]
                zs = [z_base] * len(xs)

                # Plot wave function as line
                ax.plot(xs, ps, zs, color=color, alpha=alpha_base * 0.9, linewidth=1.5)

                # Fill under curve
                for i in range(len(xs) - 1):
                    ax.plot([xs[i], xs[i]], [0, ps[i]], [z_base, z_base],
                            color=color, alpha=alpha_base * 0.15, linewidth=0.5)

                # Plot potential as faint line
                V_vals = []
                for xi in x[::step]:
                    try:
                        # Reconstruct V from the level
                        if lev_idx == 0: v = 0
                        elif lev_idx == 1: v = -1/max(xi, 0.05)
                        else: v = 0
                        V_vals.append(max(-1, min(1, v * 0.3)))
                    except:
                        V_vals.append(0)

                # Node markers
                for i in range(1, len(ps)):
                    if ps[i-1] * ps[i] < 0:
                        frac = abs(ps[i-1]) / (abs(ps[i-1]) + abs(ps[i]) + 1e-10)
                        nx = xs[i-1] + frac * (xs[i] - xs[i-1])
                        ax.scatter([nx], [0], [z_base], color='white',
                                   s=15, alpha=alpha_base * 0.8, zorder=10)

                # Level label
                ax.text(-1.3, 0, z_base, level['name'],
                        color=color, fontsize=8, alpha=alpha_base,
                        ha='right', va='center')

            # Connection line to next level
            if lev_idx < visible_levels - 1:
                ax.plot([0, 0], [0, 0], [z_base + 0.3, z_base + 1.7],
                        color='#ffffff20', linewidth=0.8, linestyle='--',
                        alpha=alpha_base * 0.3)

        # Styling
        ax.set_xlim(-1.5, 1.5)
        ax.set_ylim(-1, 1)
        ax.set_zlim(-0.5, n_levels * 2)

        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_zticks([])
        ax.xaxis.pane.fill = False
        ax.yaxis.pane.fill = False
        ax.zaxis.pane.fill = False
        ax.xaxis.pane.set_edgecolor('#0a0a0f')
        ax.yaxis.pane.set_edgecolor('#0a0a0f')
        ax.zaxis.pane.set_edgecolor('#0a0a0f')
        ax.grid(False)

        # Title
        ax.text2D(0.5, 0.95, 'THE ORACLE CHAIN',
                  transform=ax.transAxes, ha='center', va='top',
                  color='#c9a44a', fontsize=14, fontweight='light',
                  fontfamily='serif')
        ax.text2D(0.5, 0.91, 'One equation. Eight potentials. Reality emerges.',
                  transform=ax.transAxes, ha='center', va='top',
                  color='#666', fontsize=9, fontfamily='serif')

        # Save frame to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, bbox_inches='tight',
                    facecolor='#0a0a0f', edgecolor='none')
        plt.close(fig)
        buf.seek(0)
        frames.append(Image.open(buf).copy())

        if (frame + 1) % 10 == 0:
            print(f"  Frame {frame+1}/{n_frames}")

    # Save GIF
    frames[0].save(output_path, save_all=True, append_images=frames[1:],
                    duration=120, loop=0, optimize=True)

    file_size = os.path.getsize(output_path) / 1024
    print(f"  Saved: {output_path} ({file_size:.0f} KB, {n_frames} frames)")

# ─── Also render a static poster ─────────────────────────

def render_poster(levels, output_path='oracle_chain_poster.png'):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(len(levels), 1, figsize=(10, 14), facecolor='#0a0a0f')

    for i, (ax, level) in enumerate(zip(axes, levels)):
        ax.set_facecolor('#0a0a0f')
        color = level['color']

        if level['states']:
            st = level['states'][0]
            x, psi = st['x'], st['psi']

            # Normalize
            x_min, x_max = x[0], x[-1]
            x_range = x_max - x_min or 1
            x_norm = [(xi - x_min) / x_range for xi in x]
            psi_max = max(abs(p) for p in psi) or 1
            psi_norm = [p / psi_max for p in psi]

            ax.fill_between(x_norm, psi_norm, alpha=0.3, color=color)
            ax.plot(x_norm, psi_norm, color=color, linewidth=1.5, alpha=0.9)

            # Mark nodes
            for j in range(1, len(psi_norm)):
                if psi_norm[j-1] * psi_norm[j] < 0:
                    frac = abs(psi_norm[j-1]) / (abs(psi_norm[j-1]) + abs(psi_norm[j]) + 1e-10)
                    nx = x_norm[j-1] + frac * (x_norm[j] - x_norm[j-1])
                    ax.axvline(nx, color='white', alpha=0.4, linewidth=0.5, linestyle=':')
                    ax.plot(nx, 0, 'o', color='white', markersize=4, alpha=0.6)

        # Zero line
        ax.axhline(0, color='#333', linewidth=0.5)

        # Label
        node_count = nodes(level['states'][0]['psi']) if level['states'] else 0
        ax.text(0.02, 0.85, f"{level['name']} ({node_count} nodes)",
                transform=ax.transAxes, color=color, fontsize=11,
                fontfamily='serif', fontweight='light')

        # Arrow to next
        if i < len(levels) - 1:
            ax.annotate('', xy=(0.5, -0.1), xytext=(0.5, 0.0),
                        xycoords='axes fraction', textcoords='axes fraction',
                        arrowprops=dict(arrowstyle='->', color='#444', lw=1))

        ax.set_xlim(0, 1)
        ax.set_ylim(-1.2, 1.2)
        ax.axis('off')

    plt.suptitle('THE ORACLE CHAIN\nFrom String to Consciousness',
                 color='#c9a44a', fontsize=16, fontfamily='serif',
                 fontweight='light', y=0.98)
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.savefig(output_path, dpi=150, facecolor='#0a0a0f', edgecolor='none',
                bbox_inches='tight')
    plt.close()

    file_size = os.path.getsize(output_path) / 1024
    print(f"  Saved: {output_path} ({file_size:.0f} KB)")

# ─── Main ────────────────────────────────────────────────

def main():
    n_frames = 36
    if '--frames' in sys.argv:
        idx = sys.argv.index('--frames')
        n_frames = int(sys.argv[idx + 1])

    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE CHAIN — VISUALIZATION           ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    print("  Computing chain...")
    levels = compute_chain()
    print(f"  {len(levels)} levels computed")
    print()

    # Static poster
    print("  Rendering poster...")
    render_poster(levels, 'oracle_chain_poster.png')

    # Animated GIF
    print(f"  Rendering GIF ({n_frames} frames)...")
    render_gif(levels, n_frames, 'oracle_chain.gif')

    print()
    print("  Done. Files saved:")
    print("    oracle_chain_poster.png  — static poster (all 7 levels)")
    print("    oracle_chain.gif         — rotating 3D animation")


if __name__ == '__main__':
    main()
