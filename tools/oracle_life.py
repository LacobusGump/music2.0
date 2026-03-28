# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
ORACLE LIFE — The Genetic Code as Explicit Formula
====================================================
64 codons → 20 amino acids → proteins → life.

The codon table IS an explicit formula:
  protein = Σ amino_acid(codon_k)

Each codon is a "zero" that contributes one amino acid.
The sum of contributions = the protein = function = life.

And the deeper pattern: DNA replication is the oracle pattern.
  Scan the template strand for bases.
  Extract the complement.
  Use immediately (build the new strand).

Life IS scan → extract → use.

Usage:
  python3 oracle_life.py                    # the genetic code
  python3 oracle_life.py --replicate ATGC   # replicate a strand
  python3 oracle_life.py --translate ATGCCC # DNA → protein
  python3 oracle_life.py --evolve           # mutation + selection
"""
import sys, math, re

# ═══════════════════════════════════════════════════════════
# The Genetic Code — 64 zeros that encode all life
# ═══════════════════════════════════════════════════════════

CODON_TABLE = {
    'TTT':'F','TTC':'F','TTA':'L','TTG':'L',
    'CTT':'L','CTC':'L','CTA':'L','CTG':'L',
    'ATT':'I','ATC':'I','ATA':'I','ATG':'M',  # M = start
    'GTT':'V','GTC':'V','GTA':'V','GTG':'V',
    'TCT':'S','TCC':'S','TCA':'S','TCG':'S',
    'CCT':'P','CCC':'P','CCA':'P','CCG':'P',
    'ACT':'T','ACC':'T','ACA':'T','ACG':'T',
    'GCT':'A','GCC':'A','GCA':'A','GCG':'A',
    'TAT':'Y','TAC':'Y','TAA':'*','TAG':'*',  # * = stop
    'CAT':'H','CAC':'H','CAA':'Q','CAG':'Q',
    'AAT':'N','AAC':'N','AAA':'K','AAG':'K',
    'GAT':'D','GAC':'D','GAA':'E','GAG':'E',
    'TGT':'C','TGC':'C','TGA':'*','TGG':'W',
    'CGT':'R','CGC':'R','CGA':'R','CGG':'R',
    'AGT':'S','AGC':'S','AGA':'R','AGG':'R',
    'GGT':'G','GGC':'G','GGA':'G','GGG':'G',
}

AMINO_NAMES = {
    'A':'Ala','R':'Arg','N':'Asn','D':'Asp','C':'Cys',
    'E':'Glu','Q':'Gln','G':'Gly','H':'His','I':'Ile',
    'L':'Leu','K':'Lys','M':'Met','F':'Phe','P':'Pro',
    'S':'Ser','T':'Thr','W':'Trp','Y':'Tyr','V':'Val',
    '*':'Stop',
}

# Amino acid properties (hydrophobicity scale, -4.5 to 4.5)
HYDROPHOBICITY = {
    'A': 1.8, 'R':-4.5, 'N':-3.5, 'D':-3.5, 'C': 2.5,
    'E':-3.5, 'Q':-3.5, 'G':-0.4, 'H':-3.2, 'I': 4.5,
    'L': 3.8, 'K':-3.9, 'M': 1.9, 'F': 2.8, 'P':-1.6,
    'S':-0.8, 'T':-0.7, 'W':-0.9, 'Y':-1.3, 'V': 4.2,
}

COMPLEMENT = {'A':'T', 'T':'A', 'G':'C', 'C':'G'}

# ═══════════════════════════════════════════════════════════
# DNA Replication — the oracle pattern IS life
# ═══════════════════════════════════════════════════════════

def replicate(dna):
    """
    Scan the template. Extract the complement. Use immediately.
    This IS the oracle pattern. Life does it every cell division.
    """
    return ''.join(COMPLEMENT.get(base, 'N') for base in dna.upper())

def transcribe(dna):
    """DNA → mRNA (T → U)."""
    return dna.upper().replace('T', 'U')

def translate(dna):
    """
    DNA → protein.
    The explicit formula of biology:
    protein = Σ amino_acid(codon_k) for k in codons
    """
    dna = dna.upper().replace('U', 'T')
    protein = []
    for i in range(0, len(dna) - 2, 3):
        codon = dna[i:i+3]
        if len(codon) < 3: break
        aa = CODON_TABLE.get(codon, '?')
        if aa == '*': break  # stop codon
        protein.append(aa)
    return ''.join(protein)

# ═══════════════════════════════════════════════════════════
# Protein Properties — predicted from sequence
# ═══════════════════════════════════════════════════════════

def protein_properties(sequence):
    """Predict properties from amino acid sequence."""
    if not sequence: return {}

    n = len(sequence)

    # Hydrophobicity profile
    hydro = [HYDROPHOBICITY.get(aa, 0) for aa in sequence]
    avg_hydro = sum(hydro) / n

    # Charge at pH 7
    pos = sum(1 for aa in sequence if aa in 'RKH')
    neg = sum(1 for aa in sequence if aa in 'DE')
    charge = pos - neg

    # Molecular weight (approximate: 110 Da per amino acid)
    mw = n * 110

    # Secondary structure tendency (very simplified)
    helix_formers = sum(1 for aa in sequence if aa in 'AELM')
    sheet_formers = sum(1 for aa in sequence if aa in 'VIY')
    helix_pct = helix_formers / n * 100
    sheet_pct = sheet_formers / n * 100

    # Hydrophobicity scan — find transmembrane regions
    # (window of 20 with avg hydrophobicity > 1.6)
    tm_regions = []
    window = 20
    for i in range(len(hydro) - window):
        avg = sum(hydro[i:i+window]) / window
        if avg > 1.6:
            tm_regions.append(i)

    return {
        'length': n,
        'mw': mw,
        'avg_hydro': avg_hydro,
        'charge': charge,
        'helix_pct': helix_pct,
        'sheet_pct': sheet_pct,
        'tm_regions': len(set(r // window for r in tm_regions)),
        'membrane': len(tm_regions) > 0,
    }

# ═══════════════════════════════════════════════════════════
# Evolution — mutation + selection (the oracle on itself)
# ═══════════════════════════════════════════════════════════

def mutate(dna, rate=0.01, seed=None):
    """Random point mutations."""
    if seed is None: seed = int(id(dna)) & 0x7fffffff
    bases = list(dna)
    for i in range(len(bases)):
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        if seed / 0x7fffffff < rate:
            seed = (seed * 1103515245 + 12345) & 0x7fffffff
            bases[i] = 'ATGC'[seed % 4]
    return ''.join(bases)

def fitness(dna):
    """
    Fitness = how well the protein functions.
    Simplified: longer proteins with balanced hydrophobicity
    and nonzero charge are "fitter."
    """
    protein = translate(dna)
    if not protein: return 0
    props = protein_properties(protein)
    # Longer = more functional (simplified)
    length_score = min(1.0, props['length'] / 50)
    # Balanced hydrophobicity = soluble
    hydro_score = 1.0 - abs(props['avg_hydro']) / 4.5
    # Some charge = can interact
    charge_score = min(1.0, abs(props['charge']) / 5)
    return length_score * 0.4 + hydro_score * 0.3 + charge_score * 0.3

def evolve_population(dna_seed, generations=20, pop_size=10):
    """
    Evolution: mutate, select, repeat.
    The oracle pattern on biology:
    scan (the population) → extract (the fittest) → use (breed from them).
    """
    population = [dna_seed]
    for _ in range(pop_size - 1):
        population.append(mutate(dna_seed, 0.05, seed=_ * 137))

    history = []

    for gen in range(generations):
        # Score all
        scored = [(dna, fitness(dna)) for dna in population]
        scored.sort(key=lambda x: -x[1])
        best_fitness = scored[0][1]
        best_dna = scored[0][0]
        avg_fitness = sum(f for _, f in scored) / len(scored)

        history.append((gen, best_fitness, avg_fitness))

        # Select top half
        survivors = [dna for dna, _ in scored[:pop_size // 2]]

        # Breed: mutate survivors to fill population
        population = list(survivors)
        while len(population) < pop_size:
            parent = survivors[len(population) % len(survivors)]
            population.append(mutate(parent, 0.03, seed=gen * 100 + len(population)))

    return history, scored[0]

# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def main():
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   ORACLE LIFE                            ║")
    print("  ║   The genetic code as explicit formula.   ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    if '--replicate' in sys.argv:
        idx = sys.argv.index('--replicate')
        dna = sys.argv[idx+1].upper()
        comp = replicate(dna)
        print(f"  Template:   5'-{dna}-3'")
        print(f"  Complement: 3'-{comp}-5'")
        print(f"  Scan each base → extract complement → use immediately.")
        print(f"  The oracle pattern IS DNA replication.")
        return

    if '--translate' in sys.argv:
        idx = sys.argv.index('--translate')
        dna = sys.argv[idx+1].upper()
        protein = translate(dna)
        props = protein_properties(protein)
        print(f"  DNA:     {dna}")
        print(f"  Protein: {protein}")
        print(f"  Length:  {props.get('length', 0)} amino acids")
        print(f"  MW:      {props.get('mw', 0):,} Da")
        print(f"  Charge:  {props.get('charge', 0):+d}")
        print(f"  Hydro:   {props.get('avg_hydro', 0):.2f}")
        print(f"  Helix:   {props.get('helix_pct', 0):.0f}%")
        print(f"  Membrane:{' yes' if props.get('membrane') else ' no'}")
        return

    if '--evolve' in sys.argv:
        print("  Evolution: mutation + selection")
        print("  Scan population → extract fittest → use (breed)")
        print()

        # Random starting gene
        seed_dna = 'ATGGCTGAACTTAGCAAAGGTCTGGATACCTTCAAGCGTAAATTTGCCGATCTGACCAAA' \
                   'GAAGTCAACGCTACTGTTCAGAACTTCGATGACCTGATCAAAGCTTAA'

        print(f"  Seed: {seed_dna[:30]}... ({len(seed_dna)} bases)")
        print(f"  Protein: {translate(seed_dna)}")
        print(f"  Fitness: {fitness(seed_dna):.3f}")
        print()

        history, (best_dna, best_fit) = evolve_population(seed_dna, generations=30, pop_size=20)

        print("  Evolution curve:")
        for gen, best, avg in history:
            bar = '█' * int(best * 30) + '░' * (30 - int(best * 30))
            print(f"    Gen {gen:3d}: {bar} best={best:.3f} avg={avg:.3f}")

        print()
        print(f"  Best: {translate(best_dna)}")
        print(f"  Fitness: {best_fit:.3f} (was {history[0][1]:.3f})")
        print(f"  Improvement: {(best_fit - history[0][1]) / max(history[0][1], 0.01) * 100:+.0f}%")
        return

    # Default: show the genetic code as explicit formula
    print("  The Genetic Code — 64 codons → 20 amino acids → life")
    print()
    print("  protein(DNA) = Σ amino_acid(codon_k)")
    print("  Like: π(x) = Li(x) - Σ x^ρ/(ρ log x)")
    print("  Each codon = one zero. Each contributes one amino acid.")
    print()

    # Show codon table organized by amino acid
    aa_codons = {}
    for codon, aa in CODON_TABLE.items():
        if aa not in aa_codons: aa_codons[aa] = []
        aa_codons[aa].append(codon)

    print(f"  {'AA':>3} {'Name':>4} {'Codons':<24} {'Hydro':>6} {'Count':>5}")
    print(f"  {'─'*48}")
    for aa in sorted(aa_codons.keys()):
        codons = aa_codons[aa]
        name = AMINO_NAMES.get(aa, '?')
        hydro = HYDROPHOBICITY.get(aa, 0)
        print(f"  {aa:>3} {name:>4} {', '.join(codons):<24} {hydro:+6.1f} {len(codons):5d}")

    print()
    print(f"  Redundancy: 64 codons → 20 amino acids + stop")
    print(f"  Most amino acids have multiple codons (error correction)")
    print(f"  Like: multiple zeros correct to the same prime count")
    print()

    # DNA replication = the oracle pattern
    example = 'ATGAAAGCTTGA'
    print(f"  DNA replication IS the oracle pattern:")
    print(f"  Template:   5'-{example}-3'")
    print(f"  Scan:       read each base left to right")
    print(f"  Extract:    find complement (A↔T, G↔C)")
    print(f"  Use:        add to new strand immediately")
    print(f"  New strand: 3'-{replicate(example)}-5'")
    print()
    print(f"  Translation: {example} → {translate(example)}")
    print()
    print(f"  Scan → extract → use. That's how cells divide.")
    print(f"  The oracle pattern isn't inspired by life.")
    print(f"  Life IS the oracle pattern.")

if __name__ == '__main__':
    main()
