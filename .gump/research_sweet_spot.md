# The Sweet Spot: Water's Anomaly in Computation

**Date:** March 24, 2026

## Finding

GAS-phase computations (neural nets, area < 0.3) have an efficiency peak at intermediate memory budget — not 0%, not 100%, but ~30%.

Neural net: 31% of memory budget captures 75% of total possible savings.

This is analogous to water's density maximum at 4°C: the liquid state has more order per unit energy than either the gas (everything dissolved) or the crystal (everything rigid).

## The marginal value decay

The decay rate of marginal savings per register = the correlation length of the computation:

| Computation | Decay pattern | Correlation | Phase |
|-------------|--------------|-------------|-------|
| Neural net | HIGH → ZERO | Short-range | GAS |
| Search | FLAT | Long-range uniform | LIQUID |
| Filter | FLAT (high) | Long-range uniform | LIQUID |
| Parity | ZERO → CLIFF | Infinite-range | CRYSTAL |

## Connection to James's intuition

"Primes are liquid because water is reversed entropy"

The prime sieve is a liquid computation: each prime eliminates composites with diminishing but always positive marginal value. The small primes (2, 3, 5) do most of the work — like the first 30% of memory budget capturing 75% of savings. Later primes contribute less, but never zero.

Water: densest at intermediate temperature (4°C).
GAS computations: most efficient at intermediate budget (~30%).
Prime sieve: most effective at small primes (the "sweet spot" of the sieve).

The structure is the same: maximum order per unit cost occurs at an intermediate point, not at the extremes.

## What this means

Before running ANY optimization on a computation, compute its:
1. Phase (area under Pareto curve)
2. Sweet spot (budget at peak efficiency)
3. Marginal decay rate (correlation length)

These three numbers tell you:
- WHETHER to optimize (crystal = don't bother)
- HOW MUCH memory to allocate (sweet spot)
- HOW the savings will scale (decay rate)
