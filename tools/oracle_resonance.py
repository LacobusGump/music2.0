# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
ORACLE RESONANCE — The Computation Bridge
===========================================
Input: tissue stiffness (from elastography)
Output: optimal ultrasound parameters (for therapy)

The missing software between diagnosis and treatment.

Scan: elastography measures stiffness (clinical, proven)
Extract: compute resonant frequency from stiffness (this tool)
Use: deliver ultrasound at that frequency (devices exist)

Usage:
  python3 oracle_resonance.py                     # interactive
  python3 oracle_resonance.py --stiffness 200     # cancer cell (Pa)
  python3 oracle_resonance.py --tissue liver       # known tissue
  python3 oracle_resonance.py --compare tumor healthy
"""
import math, sys

# ═══════════════════════════════════════════════════════════
# Physics: cell/tissue resonant frequency
# f = (1/πd) × √(E/ρ)
# E = Young's modulus (stiffness, Pascals)
# ρ = density (~1050 kg/m³ for biological tissue)
# d = characteristic dimension (cell diameter or structure size)
# ═══════════════════════════════════════════════════════════

def resonant_freq(E_Pa, d_um, rho=1050):
    """Resonant frequency of elastic structure."""
    d = d_um * 1e-6
    return (1 / (math.pi * d)) * math.sqrt(E_Pa / rho)

def ultrasound_params(f_target, depth_cm=5):
    """Compute ultrasound delivery parameters."""
    # Carrier frequency: must be high enough to focus, low enough to penetrate
    # Rule: penetration (cm) ≈ 30 / f_carrier(MHz) for soft tissue
    f_carrier_MHz = min(3.0, 30 / max(depth_cm, 1))

    # Pulse repetition frequency = the therapeutic frequency
    PRF = f_target

    # Duty cycle: lower for deeper targets (less heating)
    duty = min(0.5, 0.2 * (10 / max(depth_cm, 1)))

    # Intensity: LIPUS uses 30 mW/cm². Oncotripsy uses higher.
    # Scale with depth (attenuation)
    I_surface = 30 * math.exp(0.1 * depth_cm)  # mW/cm²

    # Pulse duration
    cycles_per_pulse = max(10, int(f_carrier_MHz * 1e6 / max(PRF, 1) * duty))

    return {
        'carrier_MHz': f_carrier_MHz,
        'PRF_Hz': PRF,
        'PRF_kHz': PRF / 1000,
        'duty_cycle': duty,
        'intensity_mW_cm2': I_surface,
        'cycles_per_pulse': cycles_per_pulse,
        'treatment_min': 20,  # standard LIPUS duration
    }

# ═══════════════════════════════════════════════════════════
# Tissue Database (published values)
# ═══════════════════════════════════════════════════════════

TISSUES = {
    # Normal tissues
    'brain':        {'E': 200,    'd': 15,  'desc': 'Brain parenchyma (very soft)'},
    'liver':        {'E': 2000,   'd': 20,  'desc': 'Liver tissue'},
    'breast':       {'E': 2000,   'd': 15,  'desc': 'Breast tissue (glandular)'},
    'muscle':       {'E': 10000,  'd': 50,  'desc': 'Skeletal muscle (along fiber)'},
    'cartilage':    {'E': 700,    'd': 13,  'desc': 'Articular cartilage'},
    'bone':         {'E': 15e9,   'd': 10,  'desc': 'Cortical bone'},
    'artery':       {'E': 10000,  'd': 30,  'desc': 'Arterial wall'},
    'skin':         {'E': 50000,  'd': 20,  'desc': 'Skin (dermis)'},
    'fat':          {'E': 500,    'd': 80,  'desc': 'Adipose tissue'},
    'kidney':       {'E': 5000,   'd': 20,  'desc': 'Kidney parenchyma'},
    'blood':        {'E': 4,      'd': 7,   'desc': 'Blood (RBC scale)'},

    # Disease states
    'tumor_soft':   {'E': 200,    'd': 18,  'desc': 'Soft tumor cell (many cancers)'},
    'tumor_stiff':  {'E': 5000,   'd': 18,  'desc': 'Stiff tumor (desmoplastic)'},
    'breast_cancer':{'E': 4000,   'd': 18,  'desc': 'Breast carcinoma'},
    'liver_fibrosis':{'E':12000,  'd': 20,  'desc': 'Fibrotic liver (F3-F4)'},
    'cirrhosis':    {'E': 25000,  'd': 20,  'desc': 'Cirrhotic liver'},
    'plaque_soft':  {'E': 50000,  'd': 100, 'desc': 'Soft atherosclerotic plaque'},
    'plaque_calc':  {'E': 1e8,    'd': 100, 'desc': 'Calcified plaque'},
    'amyloid':      {'E': 2e9,    'd': 0.1, 'desc': 'Amyloid fibril'},
    'kidney_stone': {'E': 5e10,   'd': 5000,'desc': 'Calcium oxalate stone'},
    'blood_clot':   {'E': 1000,   'd': 2000,'desc': 'Fibrin clot'},
    'scar':         {'E': 30000,  'd': 30,  'desc': 'Scar tissue (fibrosis)'},
}

# ═══════════════════════════════════════════════════════════
# Analysis functions
# ═══════════════════════════════════════════════════════════

def analyze_tissue(name, info):
    """Full analysis of one tissue."""
    f = resonant_freq(info['E'], info['d'])
    return {
        'name': name,
        'desc': info['desc'],
        'E': info['E'],
        'd': info['d'],
        'f_Hz': f,
        'f_kHz': f / 1000,
        'f_MHz': f / 1e6,
    }

def compare(disease_name, healthy_name):
    """Compare disease vs healthy tissue."""
    d = analyze_tissue(disease_name, TISSUES[disease_name])
    h = analyze_tissue(healthy_name, TISSUES[healthy_name])

    selectivity = max(d['f_Hz'], h['f_Hz']) / min(d['f_Hz'], h['f_Hz'])
    target = d if d['E'] != h['E'] else d

    # Which to target?
    if d['E'] < h['E']:
        approach = 'Disease is SOFTER → target at LOWER frequency'
        target_f = d['f_Hz']
    else:
        approach = 'Disease is STIFFER → target at HIGHER frequency'
        target_f = d['f_Hz']

    return {
        'disease': d,
        'healthy': h,
        'selectivity': selectivity,
        'approach': approach,
        'target_f': target_f,
    }

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE RESONANCE                       ║")
    print("  ║   Stiffness → Frequency → Treatment      ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    if '--stiffness' in sys.argv:
        idx = sys.argv.index('--stiffness')
        E = float(sys.argv[idx+1])
        d = float(sys.argv[idx+2]) if idx+2 < len(sys.argv) and not sys.argv[idx+2].startswith('-') else 18
        f = resonant_freq(E, d)
        params = ultrasound_params(f)
        print(f"  Stiffness: {E} Pa | Size: {d} μm")
        print(f"  Resonant frequency: {f/1000:.1f} kHz")
        print(f"  Ultrasound Rx:")
        print(f"    Carrier: {params['carrier_MHz']:.1f} MHz")
        print(f"    PRF: {params['PRF_kHz']:.1f} kHz")
        print(f"    Duty: {params['duty_cycle']*100:.0f}%")
        print(f"    Intensity: {params['intensity_mW_cm2']:.0f} mW/cm²")
        print(f"    Duration: {params['treatment_min']} min")
        return

    if '--tissue' in sys.argv:
        idx = sys.argv.index('--tissue')
        name = sys.argv[idx+1].lower()
        if name not in TISSUES:
            print(f"  Unknown tissue. Available: {', '.join(sorted(TISSUES.keys()))}")
            return
        a = analyze_tissue(name, TISSUES[name])
        print(f"  {a['desc']}")
        print(f"  Stiffness: {a['E']:,.0f} Pa | Size: {a['d']} μm")
        print(f"  Resonant frequency: {a['f_kHz']:.1f} kHz ({a['f_MHz']:.2f} MHz)")
        return

    if '--compare' in sys.argv:
        idx = sys.argv.index('--compare')
        d_name = sys.argv[idx+1].lower()
        h_name = sys.argv[idx+2].lower()
        if d_name not in TISSUES or h_name not in TISSUES:
            print(f"  Unknown tissue. Available: {', '.join(sorted(TISSUES.keys()))}")
            return
        c = compare(d_name, h_name)
        print(f"  {c['disease']['desc']} vs {c['healthy']['desc']}")
        print(f"  Disease:  {c['disease']['E']:>10,.0f} Pa → {c['disease']['f_kHz']:>8.1f} kHz")
        print(f"  Healthy:  {c['healthy']['E']:>10,.0f} Pa → {c['healthy']['f_kHz']:>8.1f} kHz")
        print(f"  Selectivity: {c['selectivity']:.1f}×")
        print(f"  {c['approach']}")
        params = ultrasound_params(c['target_f'])
        print(f"  Ultrasound Rx: {params['carrier_MHz']:.1f} MHz carrier, {params['PRF_kHz']:.1f} kHz PRF")
        return

    # Default: full table
    print("  TISSUE RESONANCE MAP")
    print(f"  {'Tissue':>20} {'E (Pa)':>12} {'d (μm)':>8} {'f (kHz)':>10} {'f (MHz)':>10}")
    print(f"  {'─'*64}")

    sorted_tissues = sorted(TISSUES.items(), key=lambda x: resonant_freq(x[1]['E'], x[1]['d']))
    for name, info in sorted_tissues:
        a = analyze_tissue(name, info)
        marker = '◀ target' if 'tumor' in name or 'plaque' in name or 'clot' in name or 'stone' in name or 'amyloid' in name else ''
        print(f"  {name:>20} {a['E']:>12,.0f} {a['d']:>8} {a['f_kHz']:>10.1f} {a['f_MHz']:>10.3f} {marker}")

    print()
    print("  THERAPEUTIC COMPARISONS:")
    print()

    pairs = [
        ('tumor_soft', 'breast', 'Soft tumor in breast'),
        ('breast_cancer', 'breast', 'Breast cancer vs healthy'),
        ('liver_fibrosis', 'liver', 'Liver fibrosis vs healthy'),
        ('plaque_calc', 'artery', 'Calcified plaque vs artery'),
        ('blood_clot', 'blood', 'Blood clot vs flowing blood'),
        ('amyloid', 'brain', 'Amyloid fibril vs brain'),
    ]

    for d_name, h_name, desc in pairs:
        c = compare(d_name, h_name)
        params = ultrasound_params(c['target_f'])
        print(f"  {desc}")
        print(f"    Selectivity: {c['selectivity']:.0f}× | Target: {c['disease']['f_kHz']:.0f} kHz | Rx: {params['carrier_MHz']:.1f} MHz / {params['PRF_kHz']:.0f} kHz PRF")
        print()

    print("  The conductor computes. The ultrasound delivers.")
    print("  Stiffness in → frequency out → treatment parameters.")

if __name__ == '__main__':
    main()
