# Additive vs Multiplicative Transform of the Prime Signal

**Date:** March 24, 2026
**Origin:** James's insight that math is the refactoring of space between numbers

## The test

Same data (von Mangoldt function Λ(n)), two different bases:
- Additive: e^{-2πi f n} (standard Fourier, measures periodic structure)
- Multiplicative: n^{-it} (Mellin/Dirichlet, measures scaling structure)

## Results

Additive transform: sees primes mod n (arithmetic progressions, Dirichlet characters). Few huge spikes at rational frequencies.

Multiplicative transform: sees zeros of ζ. 15/20 peaks match known zeros to < 0.3 error.

Same data. Different basis. Completely different structure visible.

## The insight

The "illusion" is the choice of basis:
- Additive basis: primes look pseudorandom (no obvious pattern)
- Multiplicative basis: primes reveal zeros (structured resonances)

The zeros are not IN the primes. They are in the RELATIONSHIP between the additive and multiplicative ways of measuring the primes.

The refactoring IS the change of basis. Going from additive to multiplicative transforms the "noise" into "resonance."

## What this means for the operator

The operator should be the MAP between these two bases. It takes the additive world (where primes are random) and converts it to the multiplicative world (where zeros are visible). The eigenvalues of this map would be the zeros — the resonances of the transformation itself.

This is essentially what the Mellin transform does: it converts additive Fourier analysis into multiplicative scaling analysis. The operator might be a dressed version of the Mellin transform, with boundary conditions that select the zeros.

## Status

CONJECTURE. The dual-transform picture is well-known (Fourier vs Mellin). What's new: framing it as "the zeros are the resonances of the refactoring itself" rather than "the zeros are properties of ζ."
