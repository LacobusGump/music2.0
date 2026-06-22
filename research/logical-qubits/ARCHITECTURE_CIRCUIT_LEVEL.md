# Circuit-Level Logical Qubits on Metal GPU

**Goal**: Simulate full circuit-level surface code error correction on top of the existing Apple Metal quantum state vector simulator, so that logical qubit performance can be studied and eventually run with the physical layer accelerated on GPU.

## Current State (as of May 2026)

- **Code-capacity layer**: Working (`surface_code_logical.py`). Monte Carlo on minimum logical strings. Good for quick distance selection.
- **Metal simulator**: Working state vector + basic gates (H, CNOT, etc.) in `quantum_metal` + Swift sources. Exposed via `quantum_server.py`.
- **ECHO engine**: Part of the higher-level "Machine" engine system for reversible/superfluid computation patterns.
- **No circuit-level yet**: No syndrome extraction circuits, no repeated rounds, no measurement noise model, no decoder.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User / Research Layer                     │
│  (distance sweeps, threshold curves, cost models)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│              Logical Qubit Engine (new)                      │
│  - RotatedSurfaceCode (d, rounds)                            │
│  - Circuit generation (stabilizer measurements)              │
│  - Noise model (circuit-level depolarizing + readout)        │
│  - Syndrome extraction loop                                  │
│  - Decoding graph builder                                    │
│  - MWPM / decoder interface                                  │
│  - Integration with ECHO (reversible error tracking?)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
┌─────────▼─────────┐  ┌───────▼───────┐  ┌────────▼────────┐
│  Physical Layer   │  │  Decoder      │  │  Analysis       │
│  (Metal GPU)      │  │  (CPU/FPGA)   │  │  (Python)       │
│  - State vector   │  │  - MWPM       │  │  - Stats        │
│  - Gate kernels   │  │  - Neural?    │  │  - Plots        │
│  - Noise injection│  │               │  │                 │
└───────────────────┘  └───────────────┘  └─────────────────┘
```

## Key Design Decisions

### 1. Separation of Concerns
- **Physical simulation** (applying noisy gates for syndrome extraction) → Metal hot path.
- **Classical decoding** (building graph from syndromes, running MWPM) → CPU for now (can move graph construction later).
- **Logical operations** on top of corrected qubits → higher layer.

### 2. Circuit Representation
Use a simple Python `Circuit` object that can be:
- Executed on the Metal simulator (via the existing server or direct).
- Used to build the detector error model.
- Serialized for analysis.

### 3. Noise Model
Start with standard circuit-level depolarizing noise:
- After every 2-qubit gate: depolarizing channel with probability p.
- Measurement: bit-flip with probability p.
- This matches the regime where the ~1000 physical per logical rule comes from.

### 4. Integration with Existing System
- Expose via the "Machine" engine system (similar to ECHO, GATE, etc.).
- The GATE engine (Metal) becomes the physical backend for the LOGICAL/SURFACE engine.
- ECHO's reversible nature may be useful for "undo on logical failure" ideas in the future.

### 5. Decoder
- Initial: Use `pymatching` (or implement lightweight blossom for small d) on CPU.
- Later: Note that real systems use custom hardware decoders. For simulation, CPU is fine until we want to study latency.

## Implementation Phases

**Phase 1 (complete 2026-05-30, all three pieces delivered)**: Full executable circuit-level layer.
- Correct explicit d=3 rotated stabilizers + proper CNOT schedule in the generator (real syndromes).
- Real min-weight decoder (wt≤2 enumeration per Pauli type on the actual 8 stabilizers) → first decoded p_L curves.
- First Metal bridge: `circuit_to_metal_sequence` + `first_metal_bridge_comparison` that exports the exact 50-op sequence for the existing quantum_metal kernels + runs the Python reference side-by-side.
- Full Monte Carlo CLI producing publishable tables (decoded_pL is the key number).
- Repro JSON artifacts + updated research page.

Run `python3 tools/circuit_level_surface_code.py` to see everything live. The ~1000 physical/logical planning number now has real software scaffolding underneath it.

**Phase 2**: Interface to existing Metal simulator.
- Map the syndrome extraction circuit to sequences of H/CNOT/measure calls on the Metal state vector.
- Add noise channels around the Metal execution (or inside shaders).
- Validate that Python reference + Metal execution give matching statistics.

**Phase 3**: Move hot loops to Metal shaders.
- Syndrome extraction is mostly CNOT ladders + measurements → can be a specialized shader or sequence of existing kernels + measurement support.
- Decoding graph construction can be partially GPU-accelerated.

**Phase 4**: Higher-level logical operations and composition with ECHO-style reversible patterns.

## File Layout (proposed)

```
gump-private/tools/
├── surface_code_logical.py          # existing code-capacity
├── circuit_level_surface_code.py    # new: circuit model + runner (Phase 1)
├── logical_qubits/
│   ├── __init__.py
│   ├── surface_code.py              # RotatedSurfaceCode class
│   ├── circuit.py                   # Circuit, Gate, Measurement
│   ├── noise.py
│   ├── decoder.py                   # MWPM wrapper
│   └── metal_bridge.py              # Glue to quantum_metal / server
└── engines/
    └── logical/                     # Future: expose as engine
        └── surface_code_engine.py
```

## Success Metrics (first milestone)

- For a distance-3 rotated surface code, produce logical error rate curve vs physical error rate under circuit-level depolarizing noise.
- Show that logical error rate drops below physical for p below ~1% (standard result).
- Reproducible script + data that can be published alongside the code-capacity page.

## Relation to Threshold Theorem

The ~1000 physical per logical is a rough hardware planning number that assumes:
- Circuit-level noise
- Good decoder
- Reasonable routing overhead
- Multiple rounds of error correction per logical gate

Our simulator will let us measure the actual logical error rate for given physical rate + distance + number of syndrome rounds, on the specific noise model we implement. This is the software truth underneath the planning number.

## Open Questions

- How to represent mid-circuit measurements and classical feedforward in the Metal simulator (current kernels are unitary).
- Whether ECHO's reversible model can give any advantage or new perspective on error correction (e.g., reversible decoding?).
- Best way to scale the Metal state vector simulation when we have hundreds or thousands of physical qubits (even d=5 is 49 data + 48 ancilla = 97 qubits — state vector is impossible; we will need stabilizer or tensor network methods for larger distances).

The initial goal is small distances (d=3,5) for validation and insight, not competing with Stim + pymatching on large scales.

---

This document will evolve as we build.
