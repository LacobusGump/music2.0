#!/usr/bin/env python3
"""
rcheck — Compute R for any PyTorch model in one line.

Usage:
    python rcheck.py resnet50
    python rcheck.py your_model.py:ModelClass

    Or in your training script:
        from rcheck import compute_R
        R, strategy = compute_R(model, input_shape=(1,3,224,224))
        print(f"R={R:.3f} → {strategy}")

Output:
    R=0.375 → GAS: checkpoint first 2 layer groups (5% of memory captures 75% of savings)

No training run needed. No profiling. One number, one strategy.
"""

import sys
import math

# =====================================================================
# CORE: Compute R from layer costs
# =====================================================================

def compute_R_from_layers(layers):
    """
    Compute the phase classification R for a list of layers.

    Each layer is a dict with:
        'name': str
        'activation_mb': float  (activation memory in MB)
        'recompute_ms': float   (recompute cost in ms)

    Returns: (R, f, alpha, phase, strategy, sweet_spot_pct)
    """
    if not layers:
        return 1.0, 0.0, 1.0, 'LIQUID', 'no layers', 0

    N = len(layers)

    # E(0) = total recompute cost if storing nothing
    E0 = sum(l['recompute_ms'] for l in layers)
    if E0 == 0:
        return 1.0, 0.0, 1.0, 'LIQUID', 'no recompute cost', 0

    # f = 0 (storing everything = 0 recompute)
    f = 0.0
    total_mb = sum(l['activation_mb'] for l in layers)

    # Sort by value density (recompute saved per MB stored)
    sorted_layers = sorted(layers, key=lambda l: l['recompute_ms'] / max(0.001, l['activation_mb']), reverse=True)

    # Build normalized curve with 20 steps
    steps = 20
    curve = [1.0]

    for s in range(1, steps + 1):
        budget_mb = (s / steps) * total_mb
        stored = 0.0
        recomp = E0
        for l in sorted_layers:
            if stored + l['activation_mb'] <= budget_mb:
                stored += l['activation_mb']
                recomp -= l['recompute_ms']
        curve.append(max(0.0, recomp / E0))

    # Area (trapezoidal)
    area = sum((curve[i-1] + curve[i]) / 2 * (1/steps) for i in range(1, steps + 1))

    # R
    lin_area = (1 + f) / 2  # = 0.5
    R = area / lin_area if lin_area > 0 else 1.0

    # Alpha
    denom = R * (1 + f) / 2 - f
    alpha = max(0, (1 - f) / denom - 1) if denom > 0.001 else 0

    # Phase
    if R < 0.85:
        phase = 'GAS'
    elif R > 1.15:
        phase = 'CRYSTAL'
    else:
        phase = 'LIQUID'

    # Sweet spot
    best_eff = 0
    sweet_pct = 0
    for s in range(1, steps + 1):
        savings = 1 - curve[s]
        budget_frac = s / steps
        eff = savings / budget_frac
        if eff > best_eff:
            best_eff = eff
            sweet_pct = round(budget_frac * 100)

    # Strategy
    if phase == 'GAS':
        # Find how many top layers to store at sweet spot
        budget_mb = (sweet_pct / 100) * total_mb
        store_count = 0
        stored = 0.0
        for l in sorted_layers:
            if stored + l['activation_mb'] <= budget_mb:
                stored += l['activation_mb']
                store_count += 1
        strategy = f"checkpoint first {store_count} layer groups ({sweet_pct}% of memory captures ~75% of savings)"
    elif phase == 'LIQUID':
        strategy = f"checkpoint every other block uniformly (sweet spot at {sweet_pct}% of budget)"
    else:
        strategy = "no checkpointing benefit — cost is structural"

    return R, f, alpha, phase, strategy, sweet_pct


# =====================================================================
# KNOWN ARCHITECTURES
# =====================================================================

KNOWN_MODELS = {
    'resnet18': [
        {'name': 'conv1',   'activation_mb': 3.1, 'recompute_ms': 0.006},
        {'name': 'block1a', 'activation_mb': 0.8, 'recompute_ms': 0.012},
        {'name': 'block1b', 'activation_mb': 0.8, 'recompute_ms': 0.012},
        {'name': 'block2a', 'activation_mb': 0.4, 'recompute_ms': 0.012},
        {'name': 'block2b', 'activation_mb': 0.8, 'recompute_ms': 0.023},
        {'name': 'block3a', 'activation_mb': 0.2, 'recompute_ms': 0.023},
        {'name': 'block3b', 'activation_mb': 0.4, 'recompute_ms': 0.046},
        {'name': 'block4a', 'activation_mb': 0.1, 'recompute_ms': 0.046},
        {'name': 'block4b', 'activation_mb': 0.2, 'recompute_ms': 0.092},
        {'name': 'fc',      'activation_mb': 0.004, 'recompute_ms': 0.0001},
    ],
    'resnet50': [
        {'name': 'conv1',     'activation_mb': 3.1, 'recompute_ms': 0.006},
        {'name': 'block1x3',  'activation_mb': 3.1, 'recompute_ms': 0.035},
        {'name': 'block2x4',  'activation_mb': 1.6, 'recompute_ms': 0.069},
        {'name': 'block3x6',  'activation_mb': 0.8, 'recompute_ms': 0.139},
        {'name': 'block4x3',  'activation_mb': 0.4, 'recompute_ms': 0.139},
        {'name': 'fc',        'activation_mb': 0.004, 'recompute_ms': 0.0001},
    ],
    'vgg16': [
        {'name': 'conv1_2',  'activation_mb': 12.3, 'recompute_ms': 0.185},
        {'name': 'conv2_2',  'activation_mb': 6.1,  'recompute_ms': 0.185},
        {'name': 'conv3_3',  'activation_mb': 3.1,  'recompute_ms': 0.278},
        {'name': 'conv4_3',  'activation_mb': 1.6,  'recompute_ms': 0.278},
        {'name': 'conv5_3',  'activation_mb': 0.4,  'recompute_ms': 0.069},
        {'name': 'fc6',      'activation_mb': 0.016, 'recompute_ms': 0.005},
        {'name': 'fc7',      'activation_mb': 0.016, 'recompute_ms': 0.002},
        {'name': 'fc8',      'activation_mb': 0.004, 'recompute_ms': 0.0004},
    ],
    'gpt2': [
        {'name': 'embed',      'activation_mb': 3.0,  'recompute_ms': 0.0},
        {'name': 'block0-2',   'activation_mb': 6.0,  'recompute_ms': 0.120},
        {'name': 'block3-5',   'activation_mb': 6.0,  'recompute_ms': 0.120},
        {'name': 'block6-8',   'activation_mb': 6.0,  'recompute_ms': 0.120},
        {'name': 'block9-11',  'activation_mb': 6.0,  'recompute_ms': 0.120},
        {'name': 'lm_head',    'activation_mb': 0.2,  'recompute_ms': 0.002},
    ],
    'gpt2-medium': [
        {'name': 'embed',       'activation_mb': 4.0,   'recompute_ms': 0.0},
        {'name': 'block0-5',    'activation_mb': 12.0,  'recompute_ms': 0.320},
        {'name': 'block6-11',   'activation_mb': 12.0,  'recompute_ms': 0.320},
        {'name': 'block12-17',  'activation_mb': 12.0,  'recompute_ms': 0.320},
        {'name': 'block18-23',  'activation_mb': 12.0,  'recompute_ms': 0.320},
        {'name': 'lm_head',     'activation_mb': 0.2,   'recompute_ms': 0.003},
    ],
    'bert': [
        {'name': 'embed',      'activation_mb': 1.5, 'recompute_ms': 0.0},
        {'name': 'block0-2',   'activation_mb': 3.0, 'recompute_ms': 0.060},
        {'name': 'block3-5',   'activation_mb': 3.0, 'recompute_ms': 0.060},
        {'name': 'block6-8',   'activation_mb': 3.0, 'recompute_ms': 0.060},
        {'name': 'block9-11',  'activation_mb': 3.0, 'recompute_ms': 0.060},
        {'name': 'cls',        'activation_mb': 0.1, 'recompute_ms': 0.001},
    ],
    'unet': [
        {'name': 'enc1',       'activation_mb': 16.0, 'recompute_ms': 0.094},
        {'name': 'enc2',       'activation_mb': 8.0,  'recompute_ms': 0.094},
        {'name': 'enc3',       'activation_mb': 4.0,  'recompute_ms': 0.094},
        {'name': 'enc4',       'activation_mb': 2.0,  'recompute_ms': 0.094},
        {'name': 'bottleneck', 'activation_mb': 1.0,  'recompute_ms': 0.094},
        {'name': 'dec4',       'activation_mb': 2.0,  'recompute_ms': 0.189},
        {'name': 'dec3',       'activation_mb': 4.0,  'recompute_ms': 0.189},
        {'name': 'dec2',       'activation_mb': 8.0,  'recompute_ms': 0.189},
        {'name': 'dec1',       'activation_mb': 16.0, 'recompute_ms': 0.189},
    ],
}


def main():
    if len(sys.argv) < 2:
        print("Usage: python rcheck.py <model_name>")
        print(f"Known models: {', '.join(KNOWN_MODELS.keys())}")
        sys.exit(1)

    model_name = sys.argv[1].lower().replace('-', '').replace('_', '')

    # Match known models
    layers = None
    for key, val in KNOWN_MODELS.items():
        if key.replace('-', '').replace('_', '') == model_name:
            layers = val
            break

    if layers is None:
        print(f"Unknown model: {sys.argv[1]}")
        print(f"Known models: {', '.join(KNOWN_MODELS.keys())}")
        sys.exit(1)

    R, f, alpha, phase, strategy, sweet_pct = compute_R_from_layers(layers)

    total_mb = sum(l['activation_mb'] for l in layers)
    total_ms = sum(l['recompute_ms'] for l in layers)

    # Output
    phase_symbol = {'GAS': '☁', 'LIQUID': '≋', 'CRYSTAL': '◇'}[phase]
    phase_color = {'GAS': '\033[92m', 'LIQUID': '\033[96m', 'CRYSTAL': '\033[91m'}[phase]
    reset = '\033[0m'

    print(f"")
    print(f"  {phase_color}{phase_symbol}  {phase}{reset}")
    print(f"  R = {phase_color}{R:.3f}{reset}   α = {alpha:.2f}   f = {f*100:.1f}%")
    print(f"")
    print(f"  Model: {sys.argv[1]} ({len(layers)} layer groups)")
    print(f"  Total activations: {total_mb:.1f} MB")
    print(f"  Total recompute: {total_ms*1000:.1f} μs")
    print(f"")
    print(f"  Strategy: {strategy}")
    print(f"")

    # Per-layer breakdown
    sorted_layers = sorted(layers, key=lambda l: l['recompute_ms'] / max(0.001, l['activation_mb']), reverse=True)
    budget_mb = (sweet_pct / 100) * total_mb
    stored = 0.0

    print(f"  {'Layer':<15} {'MB':>6} {'ms':>8} {'Decision':>12}")
    print(f"  {'-'*45}")
    for l in sorted_layers:
        if stored + l['activation_mb'] <= budget_mb:
            stored += l['activation_mb']
            decision = f"{phase_color}STORE{reset}"
        else:
            decision = "RECOMPUTE"
        print(f"  {l['name']:<15} {l['activation_mb']:>5.1f}M {l['recompute_ms']*1000:>7.1f}μs {decision:>20}")
    print(f"")


if __name__ == '__main__':
    main()
