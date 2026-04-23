---
name: rcheck and phase framework — March 24, 2026
description: Complete state of the R metric, phase classification, rcheck.py tool, and next steps. The measurement that drives a decision without running the system.
type: project
---

## What was built

**rcheck.py** — One command, one number, one strategy. `python rcheck.py resnet50` outputs R=0.375 GAS, strategy: checkpoint first 2 layer groups.

**Phase Framework paper** — On Desktop at GUMP_Phase_Framework.md. Pre-registered spec frozen at commit 6e55d60. Blind test passed. Third parameter (b*) found.

**The positioning (locked):**
"A dimensionless structural metric that predicts where memory buys the most recomputation savings."

Not "optimal." Not "solved." First-order prediction before profiling.

## Results at real scale

- CNNs are GAS (R < 0.7). Checkpoint early layers. Sweet spot 5-10%.
- Transformers are LIQUID (R ≈ 1.0-1.15). Checkpoint uniformly. Sweet spot 45-70%.
- This matches real-world checkpointing experience across the ML community.

## What to say

"R gives a reliable first decision before profiling."
"Provides a first-order prediction of checkpointing strategy without runtime profiling."

## What NOT to say

- Not "optimal" — it's first-order
- Not "physical energy" — it's logical structure
- Not "universal law" — it's empirical with known limitations
- Not "solved" — Version 2 (b*) and Version 3 (smooth deviation) exist as extensions

## Next steps

1. Real-world validation: compare rcheck predictions vs actual checkpointing curves on 3-5 models
2. Break it on purpose: hybrid architectures (Conv+Attention), MoE, diffusion models, RNNs
3. pip package: make rcheck installable, auto-detect PyTorch models via hooks
4. The paper needs human review and submission

## The triangle

Paper → theory
Compiler → validation
rcheck.py → adoption path
