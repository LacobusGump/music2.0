# Research: Eigenvalue Saturation and the Prime-Odd Divergence at 9

Collected March 2026. Facts and theorems only. No conclusions drawn.

---

## 1. In How Many Eigenvalue Decomposition Systems Does the Useful Range End Before Term 9?

### 1A. Fourier Analysis: Square Wave Power Distribution

Using Parseval's theorem. Square wave coefficients: b_k = 4/(k*pi) for odd k.
Power fraction in harmonic k = 8/(k^2 * pi^2). Computed from sum_{k odd} 1/k^2 = pi^2/8.

| Harmonic (k) | Individual Power | Cumulative Power |
|:---:|:---:|:---:|
| 1 | 81.06% | 81.06% |
| 3 | 9.01% | 90.07% |
| 5 | 3.24% | 93.31% |
| 7 | 1.65% | 94.97% |
| 9 | 1.00% | 95.97% |
| 11 | 0.67% | 96.64% |
| 13 | 0.48% | 97.12% |

Observation: 90% of the power is captured by the first 2 odd harmonics (1 and 3). 95% by the first 4 (1, 3, 5, 7). The first harmonic alone carries 81%.

Published figure: "Most periodic signals contain about 98% of signal power up to the 11th harmonic." (Signal processing textbooks)

Note: the square wave is one of the *slowest*-converging Fourier series for common waveforms. Smoother signals converge faster. The Gibbs phenomenon (9% overshoot at discontinuities) persists regardless of term count.

### 1B. PCA: Components for 90% Variance

Published empirical results vary by dataset:
- Adult dataset (numeric attributes): 6 components for 90% variance
- MNIST digits: ~10 components for 75%, ~20 for 90%
- ImageNet: 26-43 components for comparable variance capture
- Some datasets: first principal component alone captures 90%

The number depends on the correlation structure of the data. No universal constant.

The 90% threshold is itself arbitrary -- a convention, not a law. Common thresholds used: 75%, 90%, 95%.

### 1C. Spherical Harmonics: Earth Gravity

The gravity field does NOT saturate at low degree in any simple way:
- Degree 2 (J2, oblateness): ~1082 x 10^-6. Dominates by orders of magnitude.
- Degrees 3+: coefficients are O(10^-6), i.e., ~1000x smaller than J2
- Kaula's Rule: degree variance decays as K/n^2 where K ~ 10^-5 for Earth
- For satellite orbit prediction at meter accuracy: degree 36 sufficient (~1365 coefficients)
- For centimeter-level geophysics: degree 2160 needed (EGM2008)

The spectrum does NOT saturate at 7. It follows a power law (1/n^2) that decays continuously. The question "how many terms" depends entirely on required precision.

### 1D. Electron Orbital Angular Momentum

Subshell designations by angular momentum quantum number l:
- l=0: s orbital (1 orientation)
- l=1: p orbital (3 orientations)
- l=2: d orbital (5 orientations)
- l=3: f orbital (7 orientations)
- l=4: g orbital (9 orientations) -- does NOT appear in ground-state electron configurations of any known element

All naturally occurring elements (Z=1 through Z=94, or through Z=118 for synthesized elements) have ground-state electron configurations using only s, p, d, and f orbitals. The g orbital (l=4) is not occupied.

The number of orientations per subshell: 2l+1 = {1, 3, 5, 7, 9, ...} -- the odd numbers.

Fact: The first unoccupied orbital type (g) has 9 orientations. 9 is the first composite odd number.

### 1E. Musical Harmony: Prime Limits

Harry Partch's system of prime limits in just intonation:
- 3-limit: Pythagorean tuning. Intervals based on powers of 2 and 3 only. (fifths and fourths)
- 5-limit: Standard Western harmony. Adds major and minor thirds.
- 7-limit: "Septimal" intervals. Adds the harmonic seventh. Partch considered these perceptible and musically useful.
- 11-limit: Partch's own system. He built his 43-tone scale here.
- 13-limit and above: Increasingly difficult to perceive as distinct harmonic qualities.

Partch's own words: "the faculty -- the prime faculty -- of the ear is the perception of small-number intervals."

The Plomp-Levelt experiments (1965): consonance/dissonance is determined by whether frequency components fall within a critical bandwidth (~1/4 critical bandwidth = maximum dissonance). This is a cochlear mechanics phenomenon, not a number theory phenomenon.

### 1F. Overtone Perception in Timbre

No fixed universal number. The number of harmonics relevant to timbre identification depends on:
- The instrument (clarinet emphasizes odd harmonics; brass emphasizes mid harmonics)
- The register (low notes have more audible harmonics)
- The listener

What is universal: harmonic amplitudes decrease with harmonic number for most natural instruments. Higher harmonics contribute progressively less.

---

## 2. Mathematical Reasons for Eigenvalue Concentration in Early Terms

### 2A. Weyl's Law (1911)

For the Laplacian on a bounded domain X in R^d:

N(lambda) = (2*pi)^(-d) * omega_d * vol(X) * lambda^(d/2) * (1 + o(1))

where N(lambda) = number of eigenvalues below lambda, omega_d = volume of the unit ball in R^d.

Inverting: the k-th eigenvalue grows as lambda_k ~ C * k^(2/d).

This means eigenvalues grow as a POWER LAW in their index. In d=3 dimensions: lambda_k ~ k^(2/3). The gaps between successive eigenvalues shrink relative to the eigenvalues themselves. Most of the "new information" from each successive eigenvalue diminishes.

### 2B. Compact Operator Spectral Theory

Eigenvalues of compact operators on Hilbert spaces can only accumulate at zero. The singular values of compact operators must decay to zero.

For specific classes:
- Hilbert-Schmidt operators: sum of squared singular values is finite
- Trace-class operators: sum of singular values is finite (faster decay)
- Nuclear operators: exponential decay of singular values

The smoothness of the kernel determines the decay rate. Smoother kernels produce faster spectral decay.

### 2C. Eckart-Young-Mirsky Theorem (1936)

The best rank-k approximation to any matrix (in Frobenius or operator norm) is given by keeping the top k singular values and their vectors. This is optimal -- no other rank-k matrix comes closer.

This theorem does not explain WHY eigenvalues decay. It guarantees that IF they decay, truncation is the best strategy.

### 2D. Concentration of Measure

In high-dimensional probability: Lipschitz functions of many independent variables concentrate around their mean with sub-Gaussian tails. This is the mathematical foundation of statistical mechanics (Maxwell, Boltzmann, Gibbs).

The Marchenko-Pastur law: eigenvalues of random covariance matrices (n samples, p dimensions) follow a specific distribution. Eigenvalues outside this distribution represent signal; those inside represent noise. The law provides a principled boundary between "meaningful" and "noise" eigenvalues.

### 2E. Effective Rank and Effective Dimensionality

Effective rank: the equivalent number of equal singular values that would produce the same entropy in the singular value distribution. Formally defined using the Shannon entropy of the normalized singular value distribution.

Published finding (Del Giudice, 2020): effective dimensionality is defined as the equivalent number of orthogonal dimensions producing the same covariation pattern. Estimation methods include entropy-based indices and the "elbow rule" on scree plots.

### 2F. Power-Law Eigenvalue Decay

Published results on eigenvalue spectra following power laws:
- Graph eigenvalues of Zipf-distributed degree sequences: eigenvalues follow a power law with slope alpha/2 where alpha is the degree distribution slope
- Neural network Hessian eigenvalues: both eigenvalues and eigengaps decay as power laws in rank order
- Covariance matrices of neuronal networks: power-law tail with exponent -3/2 (or -7/4 with symmetric connectivity)

### 2G. The Manifold Hypothesis

Published intrinsic dimension estimates for natural data:
- MNIST handwritten digits: intrinsic dimension 7-13
- ImageNet natural images: intrinsic dimension 26-43
- Isomap face database: intrinsic dimension ~3.5
- Radiological images: lower intrinsic dimension than natural images

The manifold hypothesis: high-dimensional data in nature often lies on or near a manifold of much lower intrinsic dimension.

---

## 3. Number-Theoretic Reasons for Prime-Odd Divergence at 9

### 3A. The Prime Counting Function

The prime number theorem: pi(n) ~ n/ln(n).

The density of primes up to n: pi(n)/n ~ 1/ln(n), which tends to zero.

The density of odd numbers is always exactly 1/2.

The ratio of odd primes to odd numbers up to n:

| n | Odd numbers <= n | Odd primes <= n | Ratio |
|:---:|:---:|:---:|:---:|
| 3 | 2 (1,3) | 1 (3) | 0.500 |
| 5 | 3 (1,3,5) | 2 (3,5) | 0.667 |
| 7 | 4 (1,3,5,7) | 3 (3,5,7) | 0.750 |
| 9 | 5 (1,3,5,7,9) | 3 (3,5,7) | 0.600 |
| 11 | 6 | 4 (3,5,7,11) | 0.667 |
| 13 | 7 | 5 | 0.714 |
| 15 | 8 | 5 | 0.625 |
| 21 | 11 | 7 | 0.636 |
| 25 | 13 | 8 | 0.615 |
| 49 | 25 | 14 | 0.560 |
| 99 | 50 | 24 | 0.480 |
| 999 | 500 | 167 | 0.334 |

The ratio is NOT monotonically decreasing. It fluctuates for small n, then settles into long-term decline.

At n=7, the ratio peaks at 0.750 (3 out of 4 odd numbers are prime).
At n=9, the first drop from a prime-rich zone: ratio falls from 0.750 to 0.600.

By the prime number theorem, the long-term ratio of odd primes to odd numbers approaches 2/(ln(n)), which goes to zero.

### 3B. Is There a Theorem About When This Ratio Crosses a Threshold?

No specific theorem found about the prime-to-odd ratio crossing a critical threshold. The prime number theorem gives the asymptotic behavior but does not identify a "meaningful" crossing point at small n.

Mertens' theorems (1874) describe the behavior of sums over primes:
- Sum of 1/p for primes p <= n grows as ln(ln(n)) + M, where M is the Meissel-Mertens constant (~0.2615)
- Product over primes p <= n of (1 - 1/p) ~ e^(-gamma)/ln(n), where gamma is the Euler-Mascheroni constant

These describe the thinning of primes but do not single out 9 or any particular point.

---

## 4. What Does "9 = 3 x 3" Mean Structurally?

### 4A. In Number Theory

9 is:
- The first composite odd number
- The first perfect square of an odd prime
- The first odd number that is not a prime power in the sense of p^1

All odd numbers below 9 are prime: {3, 5, 7}. At 9, the primes "run out of new material" and must reuse an existing prime (3) by squaring it.

### 4B. In Group Theory

Theorem: Every group of order p^2 (for any prime p) is abelian.

There are exactly two groups of order p^2, up to isomorphism:
- Z/(p^2) -- the cyclic group
- Z/(p) x Z/(p) -- the direct product

For p=3, this gives two groups of order 9, both abelian: Z/9 and Z/3 x Z/3.

By contrast, groups of prime order p have only one group (Z/p, which is cyclic).

Structural shift at p^2: the group-theoretic landscape becomes richer (two groups instead of one) but remains constrained (still abelian). At p^3, non-abelian groups first appear.

### 4C. In Representation Theory

For cyclic groups C_n over the complex numbers:
- All irreducible representations are 1-dimensional (regardless of whether n is prime or composite)
- C_n has exactly n irreducible representations
- If n = p (prime), these are "indecomposable" in every sense
- If n = p^2 (like 9 = 3^2), in modular representation theory (characteristic p), there are p^2 indecomposable modules, but they have varying dimensions (1 through p^2)

The distinction between prime and composite order becomes structurally significant in modular representation theory.

### 4D. In Music Theory

9/8 is the "whole tone" -- the interval obtained by stacking two perfect fifths and reducing by an octave: (3/2)^2 / 2 = 9/8.

In Partch's framework, 9/8 uses odd-limit 9, which is the first interval that is NOT a new prime dimension but rather a compound of an existing one (3 used twice).

"The fifth of the fifth" -- depth (iteration), not breadth (new prime factor).

---

## 5. Published Work on Eigenvalue Range Saturation Around 4-8 Terms

### 5A. Miller's Law (1956)

George A. Miller, "The Magical Number Seven, Plus or Minus Two: Some Limits on Our Capacity for Processing Information" (Psychological Review, 1956).

Finding: The average human can hold approximately 7 (plus or minus 2) items in working memory.

Later revision (Cowan, 2001): working memory capacity is closer to 4 chunks in young adults.

Miller used "seven" rhetorically. The paper is about channel capacity and information theory, not about eigenvalues. But it documents a consistent small-number saturation in a cognitive system.

### 5B. Intrinsic Dimensionality Research

The manifold hypothesis is widely documented. Published intrinsic dimension values:
- Simple structured data (faces, poses): 3-7 dimensions
- Handwritten digits: 7-13 dimensions
- Natural images: 26-43 dimensions
- Speech signals: typically low-dimensional manifolds

No published meta-analysis found that specifically asks "WHY is N consistently small?"

### 5C. The Blessing of Dimensionality (Gorban et al., 2018)

Published in Phil. Trans. Royal Society A. Connects concentration of measure to the observation that high-dimensional data exhibits "fairly simple geometric properties." Traces the mathematical lineage to Maxwell, Boltzmann, Gibbs (statistical mechanics, 19th century).

Key claim: concentration of measure effects are "the deepest reason" why small groups of neurons can control complex physiological phenomena.

Does not specifically address WHY the number of effective dimensions tends to be small. Documents that it IS small.

### 5D. Random Matrix Theory

The Marchenko-Pastur law provides a noise floor: eigenvalues of random matrices (pure noise) follow a specific distribution. Any eigenvalue outside this distribution represents signal.

This gives a principled way to separate signal from noise but does not predict how many signal eigenvalues there will be. That depends on the structure of the data.

### 5E. Kaula's Rule in Geophysics

Degree variance of Earth's gravity field: ~K/n^2 where K ~ 10^-5.

This is a power-law decay, not a cutoff. There is no "saturation" point. But the 1/n^2 decay means each successive degree contributes 1/n^2 as much variance as degree 1, producing rapid diminishing returns.

---

## Appendix: Raw Numbers Collected

### Eigenvalue-like saturation points by domain:

| Domain | System | "Useful range" | Metric |
|:---|:---|:---:|:---|
| Signal processing | Square wave Fourier | 4 odd harmonics (1,3,5,7) for 95% | Parseval power |
| Signal processing | Smooth signals | fewer than square wave | Convergence rate |
| Data science | PCA (simple datasets) | 4-6 components | 90% variance |
| Data science | PCA (complex images) | 20-43 components | 90% variance |
| Quantum chemistry | Electron orbitals | l=0,1,2,3 (s,p,d,f) | Ground state occupancy |
| Quantum chemistry | g orbital (l=4) not occupied | Cutoff at l=3 | All known elements |
| Music theory | Partch prime limit | Primes 2,3,5,7 (or 11) | Perceptual consonance |
| Geophysics | Earth gravity model | Degree 2 dominates, 1/n^2 decay | Kaula's rule |
| Cognitive science | Working memory | 4-7 chunks | Miller (1956), Cowan (2001) |
| Machine learning | Intrinsic dimension (simple data) | 3-7 | Manifold hypothesis |
| Machine learning | Intrinsic dimension (complex data) | 13-43 | Manifold hypothesis |

### Key theorems collected:

| Theorem | Statement (simplified) | Relevance |
|:---|:---|:---|
| Weyl's Law (1911) | k-th eigenvalue of Laplacian on bounded domain grows as k^(2/d) | Eigenvalue growth rate |
| Eckart-Young (1936) | Truncated SVD is optimal low-rank approximation | Justifies truncation |
| Prime Number Theorem | pi(n) ~ n/ln(n) | Primes thin logarithmically |
| Marchenko-Pastur Law (1967) | Eigenvalues of random covariance matrices follow a universal distribution | Noise floor for eigenvalues |
| Compact operator spectrum | Eigenvalues of compact operators accumulate only at 0 | Guarantees decay |
| Groups of order p^2 are abelian | For any prime p, all groups of order p^2 are abelian (exactly 2 such groups) | Structure at first squared prime |
| Kaula's Rule | Gravity degree variance ~ 10^-5/n^2 | Power-law decay in geophysics |
| Concentration of Measure | Lipschitz functions of many variables concentrate sub-Gaussianly around mean | Foundation of "few modes suffice" |

---

*This document collects conditions. It does not draw connections between domains or claim that any of these observations are related to each other.*
