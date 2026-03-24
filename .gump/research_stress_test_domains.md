# Stress Test: New Domains

**Date:** March 24, 2026

## Results across 10 computations, 7 domains

Mean reconstruction error: 2.6% (two numbers → full Pareto curve)
α mapping stability: 9/10 pass (Δα < 0.3)

| Domain | Computation | R | Phase | Error | α Δ |
|--------|-------------|---|-------|-------|-----|
| Graph | BFS | 0.787 | GAS | 3.4% | 0.43 ✗ |
| Pipeline | Filter+reduce | 0.948 | LIQUID | 4.4% | 0.11 ✓ |
| Compression | Quantize | 1.038 | LIQUID | 1.5% | 0.02 ✓ |
| DP | Wide | 1.055 | LIQUID | 2.1% | 0.02 ✓ |
| Search | Linear | 1.078 | LIQUID | 3.0% | 0.03 ✓ |
| Reduction | Tree 64→1 | 1.107 | LIQUID | 2.8% | 0.14 ✓ |
| DP | Chain | 1.114 | LIQUID | 4.6% | 0.03 ✓ |
| SAT | 20 vars | 1.134 | LIQUID | 4.2% | 0.20 ✓ |
| Parity | XOR | 1.008 | CRYSTAL | 0.0% | 0.01 ✓ |
| Voting | Majority | 1.015 | CRYSTAL | 0.0% | 0.02 ✓ |

## The one failure

Graph BFS: Δα = 0.43. The BFS curve has a kink — early nodes are cheap, late nodes are expensive. The power law misses this phase mixture. This is the "third parameter" candidate: kink location for hybrid-phase computations.

## The locked claim

For a broad class of computations across 7 domains, the memory–erasure tradeoff lies close to a two-parameter family E(b) = f + (1-f)·(1-b)^α, where α is determined by R and f. Mean reconstruction error: 2.6%. Phase clustering holds by problem class. The mapping α(R,f) is stable (9/10 within Δα < 0.3).

## Key limitation (honest)

The output ambiguity must be known or specified. The compiler's automatic detection only handles recognized patterns. For unknown programs, the user must specify the output size — or the system falls back to the upper bound (which makes everything look crystal).

This is not a flaw in the theory — it's a flaw in the parser. The phase classification is correct given the right ambiguity; it just needs the right input.
