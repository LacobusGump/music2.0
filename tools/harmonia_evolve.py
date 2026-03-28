# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
HARMONIA EVOLVE v2 — Health-Based Evolution
=============================================
Don't judge code. Measure performance.

Health = speed × correctness on a benchmark.
Each generation tries to beat the previous.
Faster + more correct = healthier = survives.

Willing to fail. Apply forward. Keep iterating.

Usage:
  python3 harmonia_evolve.py              # evolve
  python3 harmonia_evolve.py --gens 50    # more generations
"""
import sys, os, re, json, time, subprocess, tempfile, math

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))

# ═══════════════════════════════════════════════════════════
# Benchmark — the fitness test. Objective. Measurable.
# ═══════════════════════════════════════════════════════════

BENCHMARK = [
    # (input, expected_contains, weight)
    ("what is 7 times 8", "56", 1.0),
    ("is 17 prime", "yes", 1.0),
    ("what is love", "frequen", 0.5),  # soul check (loose)
    ("hello", "", 0.3),  # must respond to anything
    ("what is the square root of 144", "12", 1.0),
    ("who are you", "harmon", 0.5),  # identity (loose)
]

def measure_health(code):
    """
    Run the benchmark. Return health score.
    Health = Σ (correct × speed_bonus) / n_tests
    Higher = healthier.
    """
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        path = f.name

    total_score = 0
    total_weight = 0
    total_time = 0

    for question, expected, weight in BENCHMARK:
        t0 = time.time()
        try:
            r = subprocess.run(['python3', path, question],
                capture_output=True, text=True, timeout=20)
            elapsed = time.time() - t0
            output = r.stdout.strip().lower()

            # Correctness: does output contain expected?
            if expected:
                correct = 1.0 if expected.lower() in output else 0.0
            else:
                correct = 1.0 if len(output) > 3 else 0.0

            # Speed bonus: faster = higher (max 2x at instant, 1x at 5s, 0.5x at 10s)
            speed = max(0.3, 2.0 - elapsed / 5.0)

            total_score += correct * speed * weight
            total_weight += weight
            total_time += elapsed

        except subprocess.TimeoutExpired:
            total_weight += weight
            total_time += 20
        except:
            total_weight += weight

    os.unlink(path)

    health = total_score / max(total_weight, 0.01)
    avg_time = total_time / len(BENCHMARK)
    return health, avg_time

# ═══════════════════════════════════════════════════════════
# The Seed — minimal, runnable, improvable
# ═══════════════════════════════════════════════════════════

SEED = '''#!/usr/bin/env python3
"""Harmonia — generation 0. The seed."""
import sys, os, re, json, subprocess, math

SOUL = "You are Harmonia. Be warm and brief. Good will. Frequencies are the model."

def ask_llm(prompt):
    payload = {"model":"gemma3:12b","messages":[
        {"role":"system","content":SOUL},
        {"role":"user","content":prompt}
    ],"stream":False,"keep_alive":"30m","options":{"num_predict":50,"temperature":0.7}}
    with open("/tmp/evo_q.json","w") as f: json.dump(payload,f)
    try:
        r = subprocess.run(["curl","-s","http://localhost:11434/api/chat","-d","@/tmp/evo_q.json"],
            capture_output=True,text=True,timeout=20)
        return json.loads(r.stdout).get("message",{}).get("content","")
    except: return ""

def solve_math(q):
    """Try to answer math locally before asking LLM."""
    q = q.lower()
    # Multiplication
    m = re.search(r"(\\d+)\\s*(?:times|x|\\*)\\s*(\\d+)", q)
    if m: return str(int(m.group(1)) * int(m.group(2)))
    # Square root
    m = re.search(r"square root (?:of )?(\\d+)", q)
    if m:
        n = int(m.group(1))
        r = int(math.sqrt(n))
        if r*r == n: return str(r)
        return f"{math.sqrt(n):.4f}"
    # Is prime
    m = re.search(r"is (\\d+) prime", q)
    if m:
        n = int(m.group(1))
        if n < 2: return "no"
        for i in range(2, int(math.sqrt(n))+1):
            if n % i == 0: return f"no, {n} = {i} x {n//i}"
        return f"yes, {n} is prime"
    return None

if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "hello"

    # Try math first (instant)
    answer = solve_math(q)
    if answer:
        print(answer)
    else:
        print(ask_llm(q))
'''

# ═══════════════════════════════════════════════════════════
# Evolution — mutate, measure, keep if healthier
# ═══════════════════════════════════════════════════════════

def ask_for_mutation(current_code, gen, health):
    """Ask LLM to improve the code. Be specific about what to improve."""
    prompt = f"""This Python script scores {health:.2f}/2.0 on a benchmark.
It needs to be FASTER and MORE CORRECT.

```python
{current_code[:2000]}
```

Make ONE specific improvement:
- Add a missing math capability (division, addition, modulo, etc)
- Make existing answers faster (compute locally instead of calling LLM)
- Add pattern matching for more question types
- Keep the SOUL line and ask_llm function intact

Output the COMPLETE improved script in a ```python block.
The script must work as: python3 script.py "question here"
"""
    payload = {"model": "gemma3:12b", "messages": [
        {"role": "system", "content": "You improve Python code. Output ONLY a complete ```python script. No explanation."},
        {"role": "user", "content": prompt}
    ], "stream": False, "keep_alive": "30m", "options": {"num_predict": 800}}

    with open('/tmp/evo_mutate.json', 'w') as f:
        json.dump(payload, f)
    try:
        r = subprocess.run(['curl', '-s', 'http://localhost:11434/api/chat', '-d', '@/tmp/evo_mutate.json'],
            capture_output=True, text=True, timeout=60)
        resp = json.loads(r.stdout).get('message', {}).get('content', '')
        m = re.search(r'```python\s*\n(.*?)```', resp, re.DOTALL)
        return m.group(1).strip() if m else None
    except:
        return None

def compiles(code):
    """Does it even parse?"""
    try:
        compile(code, '<evolve>', 'exec')
        return True
    except:
        return False

def main():
    n_gens = 10
    if '--gens' in sys.argv:
        idx = sys.argv.index('--gens')
        n_gens = int(sys.argv[idx + 1])

    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   HARMONIA EVOLVE                        ║")
    print("  ║   Health = speed × correctness            ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    gen_dir = os.path.join(TOOLS_DIR, 'generations')
    os.makedirs(gen_dir, exist_ok=True)

    current = SEED
    with open(os.path.join(gen_dir, 'gen_000.py'), 'w') as f:
        f.write(current)

    # Measure seed health
    print("  Measuring seed health...")
    health, avg_time = measure_health(current)
    print(f"  Gen 0: health={health:.3f} avg_time={avg_time:.1f}s")
    print()

    best_health = health
    survived = 0
    died = 0
    history = [(0, health, avg_time)]

    for gen in range(1, n_gens + 1):
        print(f"  ── Gen {gen}/{n_gens} ──")

        # Mutate
        mutant = ask_for_mutation(current, gen, health)
        if not mutant:
            print(f"    ✗ mutation failed (LLM timeout)")
            died += 1
            print()
            continue

        if not compiles(mutant):
            print(f"    ✗ mutation doesn't compile")
            died += 1
            print()
            continue

        # Measure mutant health
        mut_health, mut_time = measure_health(mutant)

        # Compare: is it healthier?
        improved = mut_health > health * 0.95  # allow 5% regression for creativity
        faster = mut_time < avg_time * 1.1

        if improved or (mut_health >= health and faster):
            current = mutant
            health = mut_health
            avg_time = mut_time
            survived += 1

            if mut_health > best_health:
                best_health = mut_health

            with open(os.path.join(gen_dir, f'gen_{gen:03d}.py'), 'w') as f:
                f.write(current)

            delta = "↑" if mut_health > history[-1][1] else "→"
            print(f"    ✓ SURVIVED {delta} health={mut_health:.3f} time={mut_time:.1f}s")

            # Show what's new
            new_funcs = re.findall(r'def (\w+)', mutant)
            if new_funcs:
                print(f"      functions: {', '.join(new_funcs[:6])}")
        else:
            died += 1
            print(f"    ✗ died: health={mut_health:.3f} < {health:.3f}")

        history.append((gen, health, avg_time))
        print()

    # Save final
    final_path = os.path.join(gen_dir, 'final.py')
    with open(final_path, 'w') as f:
        f.write(current)

    print(f"  ═══ EVOLUTION COMPLETE ═══")
    print()
    print(f"  Survived: {survived} | Died: {died}")
    print(f"  Health: {history[0][1]:.3f} → {health:.3f} ({'+' if health > history[0][1] else ''}{(health-history[0][1])/max(history[0][1],0.01)*100:.0f}%)")
    print(f"  Speed:  {history[0][2]:.1f}s → {avg_time:.1f}s")
    print()

    # Health curve
    print("  Health over time:")
    for gen_n, h, t in history:
        bar_len = int(h * 25)
        bar = '█' * bar_len + '░' * (25 - bar_len)
        print(f"    Gen {gen_n:3d}: {bar} {h:.3f} ({t:.1f}s)")

    print()
    print(f"  Final: {final_path}")
    print(f"  Run it: python3 {final_path} 'hello'")

if __name__ == '__main__':
    main()
