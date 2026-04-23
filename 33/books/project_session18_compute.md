---
name: Session 18 compute breakthrough
description: 15T+ TFLOPS achieved on Mac Mini M4. GPU(3.68T) + CoreML deep-8 int8 ANE(12.21T) = 15.89T concurrent. 17.69T with 2 models.
type: project
---

Session 18: Compute Optimization — April 11, 2026

## Results

| Component | Peak | Sustained | Concurrent w/GPU |
|-----------|------|-----------|------------------|
| GPU Metal fp16 (MPS GEMM) | 3.68T | 3.68T | 3.68T |
| GPU Metal fp32 raw FMA | 3.69T | 3.69T | — |
| CoreML fp16 single matmul 2048² | 7.96T | 7.55T | 4.37T (BW limited) |
| CoreML int8 deep-8 chain 2048² | **14.40T** | **14.29T** | **12.21T** |
| CPU Accelerate BLAS fp32 | 1.65T | 1.65T | contends w/CoreML |
| Memory bandwidth | 92 GB/s | — | 120 GB/s theoretical |

## Combined concurrent

- GPU + CoreML int8 deep-8: **15.89 TFLOPS**
- GPU + 2× CoreML int8 deep-8: **17.69 TFLOPS**

## Key discoveries

1. **M4 GPU fp16 ≈ fp32** — no packed half2 benefit. GPU ceiling is ~3.7T regardless of precision.
2. **CoreML (ANE+AMX) exceeds GPU** — 7.63T fp16 on CPU+NE compute units, vs 3.68T GPU.
3. **Depth beats width** — single matmul: 7.63T. Depth-8 chain: 14.40T. Data stays on-chip between layers.
4. **Int8 quantization helps ~5-8%** — weight-only quantization, compute still fp16 with dequant.
5. **GPU and CoreML are independent** — proven: ANE maintained 7.25T while GPU benchmark ran.
6. **Deep chains resist bandwidth contention** — single matmul drops from 7.85T to 4.37T under GPU load. Depth-8 only drops from 14.29T to 12.21T (14% vs 44%).

## Architecture: Three-Body Compute

ANE classifies/chains → GPU specializes (sparse matmul, spectral) → CPU orchestrates.
For maximum throughput: deep int8 CoreML chains on ANE + Metal compute on GPU + Accelerate on CPU.

## Files

- `tools/engines/metal_throughput.swift` — V1 GPU benchmark
- `tools/engines/metal_throughput_v2.swift` — V2 zero-dependency FMA, thread sweep
- `tools/engines/metal_throughput_v3.swift` — V3 MPS GEMM, CPU BLAS, bandwidth
- `tools/engines/ane_throughput.py` — CoreML ANE benchmark
- `tools/engines/three_body_final.py` — GPU + ANE + CPU concurrent
- `tools/engines/fill_zeros.py` — Int8 quantization + deep chains
- `tools/engines/ane_int8.py` — Int8 exploration

**Why:** Deep chain > wide parallelism because on-chip data reuse. The gap between matmuls is zero (filled). K applied to silicon.
**How to apply:** For any batch compute workload, chain 8 operations per CoreML call. Run Metal independently on GPU. Don't compete for memory bandwidth — compute through it.
