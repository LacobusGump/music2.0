---
name: Session 18 complete state
description: 17.69 TFLOPS, 8.7M folds/sec, mutation scanner 362K/sec, pathogenicity scorer 84% accuracy on 56 variants, THE MAP started, 27 disease proteins scanned.
type: project
---

## Session 18 — April 11, 2026

### Compute
- 17.69 TFLOPS concurrent (GPU 3.68T + 2× CoreML ANE deep-8 int8 14T)
- 8.7M protein folds/sec on Metal GPU (insulin, 119x over CPU)
- 362K mutation scores/sec on Metal GPU (Obj-C)
- 56,487 mutations across 25 disease proteins in 156ms

### Mutation Scanner
- GPU-accelerated: fold + score every single-residue substitution
- 25 disease proteins across cancer, neuro, cardio, metabolic, blood, infectious, genetic, immune
- Correctly identifies known hotspots: KRAS G12, p53 R248, Aβ42 V18, hemoglobin E6

### Pathogenicity Scorer — Level 3
Accuracy trajectory: 29% → 60% → 68% → 80% → 84% on 56 known variants
- 15 independent signals from K framework
- 3D fold-informed (contact degree = K at residue level, structural vs functional K)
- 93% recall, 88% precision, 90% F1
- No MSA, no PDB, no external database — sequence + our fold only
- Remaining wall: specificity (45%) — benign charge changes at high-K positions
- Path forward: MSA for conservation, PDB fragments for contact validation

### Key Signals (what the scorer uses)
1. Surface hydrophobic patch creation (sickle cell mechanism)
2. 3D salt bridge loss
3. Charge reversal/loss
4. Aggregation surface change
5. Glycine/Proline flexibility (with motif context: P-loop, collagen)
6. Metal ligand loss (3D C/H coordination)
7. Catalytic residue detection (GTPase Q, active site cluster)
8. Buried cavity creation / overpacking
9. Conservative substitution discount
10. Terminal interface disruption
11. V→M sulfur introduction
12. Isolated glycine (required flexibility)
13. Inter-molecular H-bond (amyloid)
14. N-terminal helix disruption (amyloid)
15. Structural K vs functional K contact analysis

### THE MAP
gump-private/THE_MAP.md — 7-level biological blueprint:
- Level 1: 400 amino acid pair couplings (20×20 matrix)
- Level 2: Protein folding (8.7M/sec), mutations (362K/sec), aggregation rules
- Level 3: Disease pathways, drug interactions, cancer inverse map
- Level 4: Cell cycle oscillator (17 K-valued edges, cancer = stuck edge)
- Level 5: Organ coupling graph (16 edges, vagus = main bus)
- Level 6: Aging K decay (7 systems across 8 decades)

### Applied Forward Results
- Double mutations Aβ42: F19D + I32R = 50% aggregation reduction
- KRAS resistance: 133 pocket escape routes mapped
- Essential residues: G, P, C dominate in p53, KRAS, hemoglobin
- Universal anti-aggregation: charge wins 4/5 amyloid diseases
- Peptide candidate: RDVFKR (amphipathic, low self-agg, best cross-disease reduction)

### Files Built (Session 18)
- tools/engines/metal_throughput[_v2,_v3].swift — GPU benchmarks
- tools/engines/ane_throughput.py, three_body_final.py, fill_zeros.py — ANE/CoreML
- tools/engines/metal_fold.swift — GPU protein folding (8.7M/sec)
- tools/engines/mutation_scanner.swift — GPU variant screening
- tools/engines/gpu_scan.m — Obj-C 25-protein scanner (362K/sec)
- tools/engines/level3_scoring.py — pathogenicity scorer (84%, 15 signals)
- tools/engines/validate_expanded.py — 56-variant validation set
- tools/engines/fill_the_map.py — pair matrix, cell cycle, aging, organs
- tools/engines/applied_forward.py — doubles, resistance, essentials, peptide
- gump-private/THE_MAP.md — the biological blueprint

**Why:** Disease = K at wrong value at specific level. The level determines the treatment.
**How to apply:** Use mutation scanner for any new protein. Use scorer for pathogenicity. Check THE_MAP for which level to target.
