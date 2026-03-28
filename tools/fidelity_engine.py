# what is what? Does this preserve the wonder? The 0.002% is sacred.
"""
Arithmetic Fidelity Engine
Coordinate system + Diagnostic + Constant Improver

Three tools, one pipeline:
  Object → Euler Coordinates → Diagnostic → Improved Bound

Usage:
    from fidelity_engine import EulerCoordinates, FidelityDiagnostic, ConstantImprover

    ec = EulerCoordinates(100)
    diag = FidelityDiagnostic(ec)
    ci = ConstantImprover(diag)

    # Map a character to coordinates
    coords = ec.from_character(q=13)

    # Full diagnostic
    report = diag.diagnose(coords)

    # Improve a classical bound
    bound = ci.L1_bound(q=13)
"""

import numpy as np
from math import log, sqrt, pi, exp, gcd


def sieve_primes(N=10000):
    sieve = [True] * (N + 1)
    sieve[0] = sieve[1] = False
    for i in range(2, int(N**0.5) + 1):
        if sieve[i]:
            for j in range(i * i, N + 1, i):
                sieve[j] = False
    return [p for p in range(2, N + 1) if sieve[p]]


PRIMES = sieve_primes(10000)


def kronecker(D, p):
    if p == 2:
        if D % 2 == 0:
            return 0
        D8 = D % 8
        return 1 if D8 in [1, 7] else -1
    if D % p == 0:
        return 0
    r = pow(D % p, (p - 1) // 2, p)
    return -1 if r == p - 1 else r


class EulerCoordinates:
    """Map any arithmetic object to Euler product coordinates."""

    def __init__(self, num_primes=100):
        self.P = num_primes
        self.ps = PRIMES[:num_primes]
        self.mertens = np.cumsum([1 / p for p in self.ps])

    def from_character(self, q, D=None):
        if D is None:
            D = -q
        return np.array([kronecker(D, p) for p in self.ps], dtype=float)

    def from_multiplicative(self, f_values):
        return np.array(
            [f_values[p] if p < len(f_values) else 0 for p in self.ps],
            dtype=float,
        )

    def from_sequence(self, seq):
        n = min(len(seq), 5000)
        coords = []
        for p in self.ps:
            harmonic = np.array([(-1) ** (k // p) for k in range(n)], dtype=float)
            period = np.array(seq[:n], dtype=float)
            r = np.corrcoef(period, harmonic)[0, 1]
            coords.append(r if not np.isnan(r) else 0.0)
        return np.array(coords)

    def partial_euler_product(self, coords, s=1.0):
        prod = 1.0
        for i, p in enumerate(self.ps):
            factor = 1.0 - coords[i] / p**s
            if abs(factor) > 1e-15:
                prod *= 1.0 / factor
        return prod

    def mertens_rate(self, coords, known_value=None):
        if known_value is None:
            known_value = self.partial_euler_product(coords)
        errors, m_sums = [], []
        for k in range(5, self.P):
            partial = 1.0
            for i in range(k):
                factor = 1.0 - coords[i] / self.ps[i]
                if abs(factor) > 1e-15:
                    partial *= 1.0 / factor
            err = abs(partial - known_value)
            if err > 1e-15:
                errors.append(log(err))
                m_sums.append(self.mertens[k - 1])
        if len(errors) > 10:
            return np.corrcoef(m_sums, errors)[0, 1]
        return 0.0


class FidelityDiagnostic:
    """Complete diagnostic for any object in Euler coordinates."""

    def __init__(self, ec, sigma_W=0.5):
        self.ec = ec
        self.ps = ec.ps
        self.P = ec.P
        self.M = np.zeros((self.P, self.P))
        for i in range(self.P):
            for j in range(self.P):
                self.M[i, j] = (
                    log(self.ps[i])
                    * log(self.ps[j])
                    / sqrt(self.ps[i] * self.ps[j])
                    * exp(
                        -0.5
                        * log(self.ps[i] / self.ps[j]) ** 2
                        / sigma_W**2
                    )
                )
        self.F_max = np.sum(self.M)
        D_mat = np.diag(np.sum(self.M, axis=1))
        L = D_mat - self.M
        eigs = np.linalg.eigvalsh(L)
        self.lambda2 = eigs[1]

    def diagnose(self, coords, name="Object"):
        result = {}
        # Fidelity score
        diffs = np.diff(coords)
        nz = diffs[np.abs(diffs) > 1e-10]
        result["r1"] = np.corrcoef(nz[:-1], nz[1:])[0, 1] if len(nz) > 2 else 0.0
        # Coherence
        phases = np.where(
            coords > 0.5, 0, np.where(coords < -0.5, pi, pi / 2)
        )
        F = sum(
            self.M[i, j] * np.cos(phases[i] - phases[j])
            for i in range(self.P)
            for j in range(self.P)
        )
        result["F_ratio"] = F / self.F_max
        result["deficit"] = self.F_max - F
        # Pretentious distance
        result["pretentious_D2"] = sum(
            (1 - coords[i]) / self.ps[i] for i in range(self.P)
        )
        # L-value
        result["L_value"] = self.ec.partial_euler_product(coords)
        # Mertens rate
        result["mertens_r"] = self.ec.mertens_rate(coords, result["L_value"])
        # Suppression
        partial_sums = np.cumsum(coords / np.array(self.ps[: len(coords)]))
        var_actual = np.var(partial_sums)
        var_indep = sum(1 / p**2 for p in self.ps)
        result["suppression"] = var_actual / var_indep if var_indep > 0 else 1
        # Classification
        r = result["r1"]
        if r > 0.3:
            result["class"] = "SMOOTH"
        elif abs(r) < 0.15:
            result["class"] = "QUASI-RANDOM"
        elif -0.45 < r < -0.15:
            result["class"] = "WEAKLY ANTI-CORR"
        elif -0.55 < r <= -0.45:
            result["class"] = "GENERIC WALL"
        else:
            result["class"] = "STRONGLY ANTI-CORR"
        return result


class ConstantImprover:
    """Feed classical bounds, get explicit constants via fidelity."""

    def __init__(self, diag):
        self.diag = diag
        self.ec = diag.ec

    def L1_bound(self, q):
        coords = self.ec.from_character(q)
        d = self.diag.diagnose(coords)
        tail_err = sqrt(
            d["suppression"] * sum(1 / p**2 for p in PRIMES[50:200])
        )
        return {
            "q": q,
            "L1_actual": d["L_value"],
            "classical_bound": 1 / log(q),
            "effective_c": d["L_value"] * log(q),
            "tail_error_50primes": tail_err,
            "suppression": d["suppression"],
        }

    def zero_density(self, q, sigma=0.75):
        coords = self.ec.from_character(q)
        d = self.diag.diagnose(coords)
        T = q
        A_classical = 3.0
        N_classical = (q * T) ** (A_classical * (1 - sigma)) * log(q * T)
        S = d["suppression"]
        N_improved = sqrt(S) * N_classical
        return {
            "q": q,
            "sigma": sigma,
            "N_classical": N_classical,
            "N_improved": N_improved,
            "improvement_factor": N_classical / N_improved if N_improved > 0 else 1,
            "suppression": S,
        }

    def prime_counting_error(self, q, x):
        coords = self.ec.from_character(q)
        d = self.diag.diagnose(coords)
        classical_err = sqrt(x) * log(x) / (8 * pi)
        S = d["suppression"]
        improved_err = classical_err * sqrt(S) * (q - 1)
        return {
            "q": q,
            "x": x,
            "classical_error": classical_err,
            "improved_error": improved_err,
            "improvement": classical_err / improved_err if improved_err > 0 else 1,
        }


if __name__ == "__main__":
    ec = EulerCoordinates(50)
    diag = FidelityDiagnostic(ec)
    ci = ConstantImprover(diag)

    print("Fidelity Engine ready.")
    print(f"  {ec.P} primes, F_max = {diag.F_max:.1f}, λ₂ = {diag.lambda2:.3f}")
    print()

    for q in [3, 5, 7, 11, 13, 17, 23, 37, 53, 97]:
        b = ci.L1_bound(q)
        print(
            f"  q={q:>3}: L(1,χ)={b['L1_actual']:.4f}, "
            f"eff.c={b['effective_c']:.3f}, "
            f"suppress={b['suppression']:.6f}"
        )
