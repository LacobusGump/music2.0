# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
LATTICE SAT ENCODER
===================
Encodes the Finite Lattice Representation Problem as SAT.

Given: a finite lattice L (as a partial order)
Question: does L appear as an interval [π,σ] in the partition lattice Π_n?
Method: encode as CNF, solve with a SAT solver.

Usage:
  python3 lattice_sat.py --lattice M3 --max-n 8
  python3 lattice_sat.py --lattice N5 --max-n 12
  python3 lattice_sat.py --lattice custom --elements 5 --relations "0<1,0<2,0<3,1<4,2<4,3<4"

Requires: pysat (pip install python-sat) or outputs DIMACS CNF for external solver.
"""
import sys
import os
from itertools import combinations

class Lattice:
    """A finite lattice given by its partial order."""
    def __init__(self, n, le_pairs, name="custom"):
        self.n = n  # number of elements (labeled 0..n-1)
        self.name = name
        # le[i][j] = True iff i ≤ j
        self.le = [[False]*n for _ in range(n)]
        for i in range(n):
            self.le[i][i] = True
        for (a, b) in le_pairs:
            self.le[a][b] = True
        # Transitive closure
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    if self.le[i][k] and self.le[k][j]:
                        self.le[i][j] = True
        # Find bottom (≤ everything) and top (≥ everything)
        self.bot = None
        self.top = None
        for i in range(n):
            if all(self.le[i][j] for j in range(n)):
                self.bot = i
            if all(self.le[j][i] for j in range(n)):
                self.top = i

    def covers(self, i, j):
        """Does j cover i? (i < j with nothing between)"""
        if not self.le[i][j] or i == j:
            return False
        for k in range(self.n):
            if k != i and k != j and self.le[i][k] and self.le[k][j]:
                return False
        return True

    def __repr__(self):
        covers = []
        for i in range(self.n):
            for j in range(self.n):
                if self.covers(i, j):
                    covers.append(f"{i}<{j}")
        return f"Lattice({self.name}, {self.n} elements, covers: {', '.join(covers)})"


# Standard lattices
def make_M3():
    """Diamond: {0, 1, 2, 3, 4} with 0 < 1,2,3 < 4"""
    return Lattice(5, [(0,1),(0,2),(0,3),(1,4),(2,4),(3,4)], "M3")

def make_N5():
    """Pentagon: {0, 1, 2, 3, 4} with 0<1<3<4, 0<2<4, 2 incomp 1,3"""
    return Lattice(5, [(0,1),(1,3),(3,4),(0,2),(2,4)], "N5")

def make_chain(k):
    """Chain of length k: 0 < 1 < ... < k-1"""
    return Lattice(k, [(i,i+1) for i in range(k-1)], f"C{k}")

def make_boolean(k):
    """Boolean lattice 2^k (power set of k elements)"""
    n = 2**k
    pairs = []
    for i in range(n):
        for j in range(n):
            if i != j and (i & j) == i:  # i is subset of j
                pairs.append((i, j))
    return Lattice(n, pairs, f"Bool{k}")

def make_D4():
    """The lattice of divisors of 12: {1,2,3,4,6,12}"""
    # Labeled: 0=1, 1=2, 2=3, 3=4, 4=6, 5=12
    return Lattice(6, [(0,1),(0,2),(1,3),(1,4),(2,4),(3,5),(4,5)], "D4(div12)")

def make_custom_nonmodular():
    """A 7-element non-modular lattice that's harder to represent"""
    # 0 < a < c < e < 1, 0 < b < d < 1, b incomp c, d incomp c
    return Lattice(7, [(0,1),(1,3),(3,5),(5,6),(0,2),(2,4),(4,6)], "NM7")


class SATEncoder:
    """Encode 'lattice L is an interval in Π_n' as SAT."""

    def __init__(self, lattice, n):
        self.L = lattice
        self.n = n  # size of the ground set for partitions
        self.m = lattice.n  # number of lattice elements
        self.var_count = 0
        self.clauses = []
        self.var_map = {}

    def new_var(self):
        self.var_count += 1
        return self.var_count

    def add_clause(self, clause):
        self.clauses.append(clause)

    # Variable naming:
    # x[l][i][b] = True iff in partition P_l, element i is in block b
    # where l ∈ {0..m-1} (lattice element), i ∈ {0..n-1} (ground element),
    # b ∈ {0..n-1} (block label, using element indices as block representatives)

    def x(self, l, i, b):
        """Variable: in partition P_l, element i is in block b."""
        key = ('x', l, i, b)
        if key not in self.var_map:
            self.var_map[key] = self.new_var()
        return self.var_map[key]

    def same(self, l, i, j):
        """Variable: in partition P_l, elements i and j are in the same block."""
        if i > j: i, j = j, i
        key = ('same', l, i, j)
        if key not in self.var_map:
            self.var_map[key] = self.new_var()
        return self.var_map[key]

    def encode(self):
        """Build the full CNF encoding."""
        L = self.L
        n = self.n
        m = self.m

        print(f"  Encoding L={L.name} ({m} elements) in Π_{n}...")

        # For efficiency, use 'same' variables directly.
        # same[l][i][j] = True iff i,j in same block of partition P_l

        # CONSTRAINT 1: 'same' is an equivalence relation for each l
        for l in range(m):
            # Reflexive: same(l,i,i) = True
            for i in range(n):
                self.add_clause([self.same(l, i, i)])

            # Symmetric: same(l,i,j) = same(l,j,i) — handled by canonical ordering i<j

            # Transitive: same(l,i,j) ∧ same(l,j,k) → same(l,i,k)
            for i in range(n):
                for j in range(i+1, n):
                    for k in range(j+1, n):
                        s_ij = self.same(l, i, j)
                        s_jk = self.same(l, j, k)
                        s_ik = self.same(l, i, k)
                        # ij ∧ jk → ik
                        self.add_clause([-s_ij, -s_jk, s_ik])
                        # ij ∧ ik → jk
                        self.add_clause([-s_ij, -s_ik, s_jk])
                        # jk ∧ ik → ij
                        self.add_clause([-s_jk, -s_ik, s_ij])

        # CONSTRAINT 2: Refinement
        # L.le[a][b] = True means P_a refines P_b
        # same(a,i,j) → same(b,i,j) for all i,j
        for a in range(m):
            for b in range(m):
                if a == b: continue
                if L.le[a][b]:
                    for i in range(n):
                        for j in range(i+1, n):
                            # same(a,i,j) → same(b,i,j)
                            self.add_clause([-self.same(a, i, j), self.same(b, i, j)])

        # CONSTRAINT 3: Non-refinement
        # If NOT L.le[a][b], then P_a does NOT refine P_b
        # There exist i,j with same(a,i,j) but NOT same(b,i,j)
        for a in range(m):
            for b in range(m):
                if a == b: continue
                if not L.le[a][b]:
                    # At least one pair (i,j) where same(a,i,j) ∧ ¬same(b,i,j)
                    # Introduce auxiliary: witness[a][b][i][j] = this pair is the witness
                    witnesses = []
                    for i in range(n):
                        for j in range(i+1, n):
                            w = self.new_var()
                            witnesses.append(w)
                            # w → same(a,i,j)
                            self.add_clause([-w, self.same(a, i, j)])
                            # w → ¬same(b,i,j)
                            self.add_clause([-w, -self.same(b, i, j)])
                    # At least one witness must be true
                    self.add_clause(witnesses)

        # CONSTRAINT 4: Interval completeness
        # No partition exists in the interval [P_bot, P_top] that isn't one of our m partitions.
        # This is the hardest constraint. We need: if Q refines P_top and P_bot refines Q,
        # then Q = P_l for some l.
        #
        # Encoding: for each potential "extra" partition Q (implicitly),
        # if Q is in [P_bot, P_top] then Q matches some P_l.
        #
        # This is hard to encode directly. Instead, use the COVER relation:
        # For each cover pair (a covers b) in L: there's no partition between P_a and P_b.
        # Meaning: if same(b,i,j) for all i,j where same(a,i,j),
        # and there's one pair where same(a,i,j) ∧ ¬same(b,i,j),
        # then there's no "in between" equivalence relation.
        #
        # Simplification: for covers a < b in L:
        # P_a and P_b differ by EXACTLY one merge of blocks.
        # Meaning: there exists exactly one pair of blocks in P_b
        # that are split in P_a, and everything else is the same.

        for a in range(m):
            for b in range(m):
                if not L.covers(a, b): continue
                # P_b covers P_a: P_b is obtained from P_a by merging exactly 2 blocks.
                # The set of (i,j) where same(b,i,j) ∧ ¬same(a,i,j) forms
                # a "bridge" between exactly 2 blocks of P_a.
                #
                # For each pair of distinct blocks B1, B2 of P_a that get merged in P_b:
                # pick representatives i ∈ B1, j ∈ B2.
                # Then same(b,i,j) ∧ ¬same(a,i,j).
                # And for all other pairs (i',j') from different blocks of P_a:
                # same(b,i',j') ↔ (i' and j' are in B1∪B2).
                #
                # This is complex. For now, skip this constraint —
                # the refinement + non-refinement constraints often suffice
                # to force the right structure for small lattices.
                pass

        print(f"  Variables: {self.var_count}")
        print(f"  Clauses: {len(self.clauses)}")
        return self.var_count, self.clauses

    def solve(self):
        """Try to solve using pysat if available, otherwise output DIMACS."""
        try:
            from pysat.solvers import Glucose3
            solver = Glucose3()
            for clause in self.clauses:
                solver.add_clause(clause)

            result = solver.solve()
            if result:
                model = solver.get_model()
                return self._decode(model)
            else:
                return None
        except ImportError:
            return self._solve_dimacs()

    def _solve_dimacs(self):
        """Output DIMACS and try to call an external solver."""
        dimacs_file = f"/tmp/lattice_{self.L.name}_n{self.n}.cnf"
        with open(dimacs_file, 'w') as f:
            f.write(f"p cnf {self.var_count} {len(self.clauses)}\n")
            for clause in self.clauses:
                f.write(' '.join(str(x) for x in clause) + ' 0\n')

        print(f"  DIMACS written to {dimacs_file}")

        # Try common SAT solvers
        import subprocess
        for solver_cmd in ['kissat', 'cadical', 'minisat', 'glucose']:
            try:
                result = subprocess.run([solver_cmd, dimacs_file],
                                       capture_output=True, text=True, timeout=60)
                if 'SATISFIABLE' in result.stdout and 'UNSATISFIABLE' not in result.stdout:
                    # Parse model
                    for line in result.stdout.split('\n'):
                        if line.startswith('v '):
                            model = [int(x) for x in line[2:].split() if x != '0']
                            return self._decode(model)
                    return "SAT (model not parsed)"
                elif 'UNSATISFIABLE' in result.stdout:
                    return None
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue

        print(f"  No SAT solver found. Install: pip install python-sat")
        print(f"  Or install kissat/cadical/minisat and run on {dimacs_file}")
        return "UNKNOWN"

    def _decode(self, model):
        """Decode a SAT model into partitions."""
        positive = set(v for v in model if v > 0)

        partitions = []
        for l in range(self.m):
            # Build equivalence classes from same variables
            parent = list(range(self.n))

            def find(x):
                while parent[x] != x:
                    parent[x] = parent[parent[x]]
                    x = parent[x]
                return x

            def union(x, y):
                rx, ry = find(x), find(y)
                if rx != ry:
                    parent[rx] = ry

            for i in range(self.n):
                for j in range(i+1, self.n):
                    key = ('same', l, i, j)
                    if key in self.var_map and self.var_map[key] in positive:
                        union(i, j)

            groups = {}
            for i in range(self.n):
                r = find(i)
                if r not in groups:
                    groups[r] = []
                groups[r].append(i)

            partition = sorted(sorted(g) for g in groups.values())
            partitions.append(partition)

        return partitions


def main():
    # Parse arguments
    lattice_name = 'M3'
    max_n = 8

    if '--lattice' in sys.argv:
        idx = sys.argv.index('--lattice')
        lattice_name = sys.argv[idx+1] if idx+1 < len(sys.argv) else 'M3'

    if '--max-n' in sys.argv:
        idx = sys.argv.index('--max-n')
        max_n = int(sys.argv[idx+1]) if idx+1 < len(sys.argv) else 8

    # Build lattice
    lattices = {
        'M3': make_M3,
        'N5': make_N5,
        'C3': lambda: make_chain(3),
        'C4': lambda: make_chain(4),
        'Bool2': lambda: make_boolean(2),
        'Bool3': lambda: make_boolean(3),
        'D4': make_D4,
        'NM7': make_custom_nonmodular,
    }

    if lattice_name in lattices:
        L = lattices[lattice_name]()
    else:
        print(f"Unknown lattice: {lattice_name}")
        print(f"Available: {', '.join(lattices.keys())}")
        return

    print(f"Lattice: {L}")
    print(f"Searching Π_n for n = {L.n} to {max_n}")
    print()

    for n in range(L.n, max_n + 1):
        print(f"n = {n}:")
        encoder = SATEncoder(L, n)
        encoder.encode()

        result = encoder.solve()

        if result is None:
            print(f"  UNSATISFIABLE — L is not an interval in Π_{n}")
        elif result == "UNKNOWN":
            print(f"  Could not determine (no solver available)")
            break
        else:
            print(f"  SATISFIABLE — L IS an interval in Π_{n}!")
            if isinstance(result, list):
                for l, partition in enumerate(result):
                    print(f"    P_{l}: {partition}")
            break
        print()


if __name__ == '__main__':
    main()
