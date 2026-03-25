# Battlefield Map — March 25, 2026
# Where the wall is, why, and what vectors remain

---

## What was established

1. **The local atom**: θ_p(t) = -Im log(1 - p^{-1/2-it}). Verified to 10⁻⁹.

2. **Direct quantization**: Θ(t_n) = π(n - 1/2) predicts zeros to 4.5% of spacing with zero free parameters. Six kill shots confirm: out-of-sample, scaling law, phase scramble, frequency perturbation, leave-one-out, zero calibration.

3. **Why naive operators fail**: Differential operators process information additively. Primes process multiplicatively (Euler product). The object is a spectral shift function / scattering matrix, not a Hamiltonian.

4. **The balance condition**: |1 - p^{-σ-it}| = |1 - p^{-(1-σ)-it}| iff σ = 1/2. Algebraic. Holds for every prime independently. The critical line is the unique primewise unitarity locus.

5. **The imbalance functional**: B(σ,t) = Σ_p [log|1-p^{-s}| - log|1-p^{-(1-s)}|] = log|χ(s)|. Monotonically decreasing in σ. Crosses zero once at σ = 1/2.

## Where the wall is

B = log|χ(s)| is the functional equation in disguise. At a zero, both |ζ(s)| and |ζ(1-s)| vanish, so B = log(0/0) — unconstrained. The magnitude imbalance sees symmetry, not zero locations.

**RH cannot be reached by local Euler-factor balance alone, because zeros are a global analytic-continuation phenomenon.** The Euler product doesn't converge in the critical strip. A zero requires an infinite conspiracy among all primes. No finite truncation, no prime-by-prime argument can see it.

## Vectors that remain

### Vector 1: Regularized determinant
Define a renormalized det/transfer product whose phase AND zero set are controlled simultaneously inside the strip. Can its argument variation give something stronger than the functional equation?

### Vector 2: Argument / winding, not magnitude
Magnitude collapses to χ symmetry. The crack, if any, lives in:
- Branch structure of total phase
- Winding number of regularized Euler product
- Monotonicity/positivity of phase derivative after full continuation

### Vector 3: Whole-function positivity
RH proofs in this style need a global kernel, not a local prime statement:
- Weil positivity
- Li-type criteria
- de Branges positivity
- Explicit-formula kernels with test functions
These "feel" all primes at once.

### Vector 4: Build continuation into the primitive
The current atom -Im log(1-p^{-s}) is local. The next object must be global from birth — a regularized cumulative phase Θ_reg(s) whose definition already includes continuation, branch control, and completion.

## What this night produced

- Frozen computational result: direct quantization + 6 kill shots
- Complete identification: operator = spectral shift function with Euler product
- The identity: θ_p = -Im log(Euler factor)
- Landauer bridge: ln(p) = cost = frequency = weight
- Honest wall: primewise balance = log|χ|, doesn't constrain zeros
- Clean battlefield map for what's next

## The one-sentence version

The critical line is where every prime scatters unitarily, but proving zeros must live there requires a global object that survives analytic continuation — not the Euler product itself, but something built from its regularized phase that can be controlled by an argument principle.
