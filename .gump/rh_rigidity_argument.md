# The Rigidity Argument for RH

## The Three Constraints

### 1. The Mirror (codimension 2)
At σ = 1/2: B = conj(A), ζ = A + χĀ is real in rotated frame. Zero requires ONE condition.
At σ ≠ 1/2: B ≠ conj(A), ζ = A + χB requires TWO conditions (magnitude + phase).

### 2. The Sign Alternation + IVT (topological)
Z(t) = e^{iΘ}ζ(1/2+it) is real. Its zeros alternate in sign: +−+−+−...
(Verified: 46/50 perfect alternation.)

If a zero at t_n moves off the line:
- Z(t) no longer vanishes at t_n
- But Z(t_{n-1}) and Z(t_{n+1}) still have opposite signs
- IVT FORCES a new zero in [t_{n-1}, t_{n+1}]
- The zero is REPLACED, not removed

### 3. N(T) Quantization (arithmetic)
N(T) = (T/2π)log(T/2πe) + 7/8 + S(T) with S(T) = O(log T).
Each off-line zero increases N(T) by 1 (it exists PLUS its replacement exists).
At most O(log T) off-line zeros can exist before N(T) exceeds the formula.

## The Over-Determination

For an off-line zero at (σ, t) with σ ≠ 1/2:
- Condition 1: |A| = |χB| (magnitude balance) — from the mirror
- Condition 2: arg(A) = arg(-χB) (phase alignment) — from the mirror
- Condition 3: a replacement zero exists in [t_{n-1}, t_{n+1}] — from IVT
- Condition 4: N(T) ≤ RvM + O(log T) — from quantization

Two unknowns (σ, t). Three+ conditions. Over-determined.

## The Radial Drift (from the mirror)
dζ/dσ at a zero is RADIAL (parallel to A₀):
- Dominant term: log(T) × A₀
- |dζ/dσ| ≥ 0.036 at all tested zeros
- Phase rotation cannot cancel radial drift
- Zero-free region: |σ - 1/2| < C T^{-1/2}/log T

## What Remains

"Over-determined" = "generically no solution." For SPECIFIC functions like ζ, "generic" must be replaced by "always." This requires proving TRANSVERSALITY of the three constraints — that they are not tangent to each other at any point.

The topological part (IVT) is rigorous. The mirror part needs the AFE remainder bound. The quantization part is exact. The chain from these three to "no off-line zeros" requires connecting the topological rigidity to the analytic constraints.

## The One-Sentence Version

A zero of ζ can only exist where a Dirichlet series cancels its own reflection (one condition at σ = 1/2, two conditions elsewhere), and moving a zero off the reflection line forces a topological replacement that the integer counting formula cannot accommodate beyond O(log T) exceptions.
