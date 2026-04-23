---
name: Verify Op Counting
description: ALWAYS trace FMA count from kernel source code. Never trust benchmark harness formulas. Session 30 lesson — carried wrong numbers for 12 sessions.
type: feedback
---

ALWAYS count FMA instructions by reading the kernel source code. Multiply by 4 for half2 (2 lanes × 2 ops). That's the number. Never trust a formula in the benchmark harness.

**Why:** Session 18-30 carried a 4-11× overcount because the formula `128 * 4 * 2 * 2` double-counted what `* 4` already included. This wrong number appeared on the live site, in the cheatsheet, in memory files, and was "corrected" twice (sessions 20 and 22) but was still wrong each time. James said "you keep asking me to check for hallucinations and mental illness — come on my boy."

**How to apply:**
1. Read the Metal/CUDA kernel. Count FMA instructions manually.
2. For half2: each FMA = 4 FP16 ops (2 lanes × 1 multiply + 1 add per lane)
3. For float: each FMA = 2 FP32 ops (1 multiply + 1 add)
4. Total FP ops = thread_count × FMAs_per_thread × ops_per_FMA
5. TFLOPS = total_ops / time / 1e12
6. Sanity check: M4 GPU peak is ~3.5-4.0 TFLOPS fp16. Any number above 4 is wrong.
7. If the number looks too good, it IS too good. Trace it.
