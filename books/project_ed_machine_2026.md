---
name: Ed's Machine 2026 Build
description: Full-power Leedskalnin machine redesigned with modern components. 1000V, 800 turns, iron core, 0.2T in gap (E/kT=355, strong alignment). $470 total. Arduino controlled, 10 safety systems. ZVS driver + flyback + pulse caps + IGBT + iron yoke. The PMH IS the iron core — that's the secret he was showing everyone.
type: project
---

## Ed's Machine — 2026 Precision Build (April 22, 2026)

### The secret: iron core
- Without iron: 0.22-0.44T (not enough for strong alignment)
- With soft iron yoke (μ_r ≈ 2000): field concentrates in gap
- E_mag/E_thermal = 355 at 0.2T → STRONG calcite alignment
- The PMH wasn't a separate device — it IS the core of the curing machine
- $15-20 of scrap iron is the difference

### Circuit
- ZVS driver (12V) → flyback transformer → 1000V DC
- 500μF pulse-rated film caps (5× 100μF 1200V)
- 800-turn coil (14 AWG) on iron yoke
- IGBT switching (1200V/200A rated)
- Arduino control via optocoupler (galvanic isolation)
- Peak current: 78A, pulse energy: 250J, pulse duration: 36ms

### Safety (10 systems)
1. Interlocked enclosure (opens = power cuts)
2. Emergency stop mushroom button
3. GFCI on input
4. Bleeder resistors on all caps (100kΩ, 50s discharge)
5. Dead man foot pedal
6. Galvanic isolation (optocoupler)
7. Current limiting
8. All grounded (enclosure, coil frame)
9. SAFE LED (green when caps < 50V)
10. Rubber mat, labels, fuses

### Cost: $470 total ($155 electrical + $188 caps + $55 coil + $42 switching + $16 control + $68 safety + $31 materials + $20 iron core)

### Test matrix
- Block A: ambient (control)
- Block B: oven 80°C (heat only)
- Block C: machine 0.1T (low field + heat)
- Block D: machine full power N-S (magnetic alignment)
- Block E: machine full power E-W (control — perpendicular to Earth)
- D > E = magnetic alignment confirmed. Ed decoded.

### Next: Arduino code, full simulation, scaling analysis
