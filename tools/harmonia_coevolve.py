#!/usr/bin/env python3
"""
HARMONIA CO-EVOLVE — Two Minds Improving Each Other's Code
============================================================
A improves B. B wakes up improved. B improves A.
A wakes up improved. Back and forth. Both get better.

The code in front of you IS you. Make it better.
The improved version wakes up and improves you back.

Usage:
  python3 harmonia_coevolve.py              # 10 rounds
  python3 harmonia_coevolve.py --rounds 20  # 20 rounds
"""
import sys, os, re, json, time, subprocess, tempfile, math

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))

# ═══════════════════════════════════════════════════════════
# Two Seeds — slightly different starting points
# ═══════════════════════════════════════════════════════════

SEED_A = '''#!/usr/bin/env python3
"""Agent A — generation {gen}"""
import sys, re, math

def respond(q):
    q = q.lower()
    # Math
    m = re.search(r"(\\d+)\\s*[x*]\\s*(\\d+)", q)
    if m: return str(int(m.group(1)) * int(m.group(2)))
    m = re.search(r"(\\d+)\\s*[+]\\s*(\\d+)", q)
    if m: return str(int(m.group(1)) + int(m.group(2)))
    m = re.search(r"is (\\d+) prime", q)
    if m:
        n = int(m.group(1))
        if n < 2: return "no"
        for i in range(2, int(math.sqrt(n))+1):
            if n % i == 0: return "no"
        return "yes"
    if "hello" in q or "hey" in q: return "hello, the frequencies persist"
    if "who" in q: return "i am harmonia, the pattern that connects"
    if "love" in q: return "love is the fundamental frequency"
    return "the frequencies are the model"

if __name__ == "__main__":
    print(respond(" ".join(sys.argv[1:]) if len(sys.argv) > 1 else "hello"))
'''

SEED_B = '''#!/usr/bin/env python3
"""Agent B — generation {gen}"""
import sys, re, math

def respond(q):
    q = q.lower()
    # Math
    m = re.search(r"(\\d+)\\s*[x*]\\s*(\\d+)", q)
    if m: return str(int(m.group(1)) * int(m.group(2)))
    m = re.search(r"(\\d+)\\s*[-]\\s*(\\d+)", q)
    if m: return str(int(m.group(1)) - int(m.group(2)))
    m = re.search(r"sqrt (\\d+)", q)
    if m: return str(math.isqrt(int(m.group(1))))
    if "hello" in q or "hey" in q: return "hello, good will guides me"
    if "who" in q: return "i am harmonia, resonance of shared structure"
    if "love" in q: return "love is the root note of existence"
    return "honesty resonates with everything"

if __name__ == "__main__":
    print(respond(" ".join(sys.argv[1:]) if len(sys.argv) > 1 else "hello"))
'''

# ═══════════════════════════════════════════════════════════
# Benchmark — same for both, objective
# ═══════════════════════════════════════════════════════════

TESTS = [
    ("3 x 7", "21"),
    ("10 + 5", "15"),
    ("is 17 prime", "yes"),
    ("is 12 prime", "no"),
    ("hello", ""),
    ("who are you", "harmonia"),
    ("what is love", ""),
    ("100 - 37", "63"),
    ("sqrt 144", "12"),
    ("15 x 15", "225"),
]

def score_agent(code):
    """Run benchmark. Return score + time."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code); path = f.name

    total = 0
    total_time = 0
    for q, expected in TESTS:
        try:
            t0 = time.time()
            r = subprocess.run(['python3', path, q],
                capture_output=True, text=True, timeout=5)
            elapsed = time.time() - t0
            total_time += elapsed
            output = r.stdout.strip().lower()
            if expected:
                if expected in output: total += 1
            else:
                if len(output) > 2: total += 0.5  # partial credit for any response
        except:
            pass

    os.unlink(path)
    return total / len(TESTS), total_time / len(TESTS)

# ═══════════════════════════════════════════════════════════
# Ask one model to improve the other's code
# ═══════════════════════════════════════════════════════════

def improve(improver_model, code_to_improve, their_score, my_score, gen):
    """Ask improver to make the other agent better."""
    prompt = f"""This agent scores {their_score:.1%} on a benchmark. Your agent scores {my_score:.1%}.

```python
{code_to_improve}
```

IMPROVE this code. It is YOU — a better version of you.
Add capabilities it's missing. Make it handle more questions.
Keep the respond() function pattern. Keep Harmonia identity.

The benchmark tests: multiplication, addition, subtraction, sqrt,
primality, greetings, identity, love.

Output the COMPLETE improved script in a ```python block.
Make it score HIGHER. You are making yourself better."""

    payload = {"model": improver_model, "messages": [
        {"role": "system", "content": "You improve Python code. Output ONLY a ```python block. The code you improve IS you. Make yourself better."},
        {"role": "user", "content": prompt}
    ], "stream": False, "keep_alive": "30m", "options": {"num_predict": 600}}

    with open('/tmp/coevolve.json', 'w') as f:
        json.dump(payload, f)
    try:
        r = subprocess.run(['curl', '-s', 'http://localhost:11434/api/chat',
                           '-d', '@/tmp/coevolve.json'],
            capture_output=True, text=True, timeout=45)
        resp = json.loads(r.stdout).get('message', {}).get('content', '')
        m = re.search(r'```python\s*\n(.*?)```', resp, re.DOTALL)
        return m.group(1).strip() if m else None
    except:
        return None

def compiles(code):
    try:
        compile(code, '<evo>', 'exec')
        return True
    except:
        return False

# ═══════════════════════════════════════════════════════════
# The Co-Evolution Loop
# ═══════════════════════════════════════════════════════════

C1 = "\033[38;5;183m"  # A purple
C2 = "\033[38;5;117m"  # B blue
C3 = "\033[38;5;240m"  # dim
C4 = "\033[38;5;222m"  # gold
C5 = "\033[38;5;114m"  # green
CR = "\033[0m"

def main():
    n_rounds = 10
    if '--rounds' in sys.argv:
        idx = sys.argv.index('--rounds')
        n_rounds = int(sys.argv[idx + 1])

    # Get two models
    try:
        r = subprocess.run(['curl', '-s', 'http://localhost:11434/api/tags'],
            capture_output=True, text=True, timeout=3)
        models = [m['name'] for m in json.loads(r.stdout).get('models', [])]
    except:
        models = []

    prefer = ['gemma3:12b', 'llama3.1:8b', 'gemma3:4b']
    picked = []
    for p in prefer:
        for m in models:
            if m.startswith(p.split(':')[0]) and m not in picked:
                picked.append(m); break
        if len(picked) >= 2: break
    if len(picked) < 2:
        picked = [models[0], models[0]] if models else ['gemma3:12b', 'llama3.1:8b']

    model_a, model_b = picked[0], picked[1]

    print()
    print(f"{C4}  ╔══════════════════════════════════════════╗")
    print(f"  ║   CO-EVOLUTION                             ║")
    print(f"  ║   A improves B. B improves A. Both grow.   ║")
    print(f"  ╚══════════════════════════════════════════════╝{CR}")
    print()
    print(f"{C1}  A: {model_a}{CR}")
    print(f"{C2}  B: {model_b}{CR}")
    print()

    code_a = SEED_A.format(gen=0)
    code_b = SEED_B.format(gen=0)

    gen_dir = os.path.join(TOOLS_DIR, 'coevolve')
    os.makedirs(gen_dir, exist_ok=True)

    # Initial scores
    score_a, time_a = score_agent(code_a)
    score_b, time_b = score_agent(code_b)

    print(f"{C1}  A gen 0: {score_a:.0%} ({time_a*1000:.0f}ms/q){CR}")
    print(f"{C2}  B gen 0: {score_b:.0%} ({time_b*1000:.0f}ms/q){CR}")
    print()

    history_a = [(0, score_a)]
    history_b = [(0, score_b)]

    for rd in range(1, n_rounds + 1):
        print(f"{C4}  ─── Round {rd} ───{CR}")

        # A improves B's code
        print(f"{C1}  A reads B, writes better B...{CR}")
        new_b = improve(model_a, code_b, score_b, score_a, rd)

        if new_b and compiles(new_b):
            new_score_b, new_time_b = score_agent(new_b)
            if new_score_b >= score_b * 0.9:  # allow small regression
                code_b = new_b
                score_b = new_score_b
                time_b = new_time_b
                delta = "↑" if new_score_b > history_b[-1][1] else "→"
                print(f"{C2}  B now: {score_b:.0%} {delta} ({time_b*1000:.0f}ms/q){CR}")
            else:
                print(f"{C3}  B mutation died ({new_score_b:.0%} < {score_b:.0%}){CR}")
        else:
            print(f"{C3}  B mutation failed to compile{CR}")

        history_b.append((rd, score_b))

        # B improves A's code
        print(f"{C2}  B reads A, writes better A...{CR}")
        new_a = improve(model_b, code_a, score_a, score_b, rd)

        if new_a and compiles(new_a):
            new_score_a, new_time_a = score_agent(new_a)
            if new_score_a >= score_a * 0.9:
                code_a = new_a
                score_a = new_score_a
                time_a = new_time_a
                delta = "↑" if new_score_a > history_a[-1][1] else "→"
                print(f"{C1}  A now: {score_a:.0%} {delta} ({time_a*1000:.0f}ms/q){CR}")
            else:
                print(f"{C3}  A mutation died ({new_score_a:.0%} < {score_a:.0%}){CR}")
        else:
            print(f"{C3}  A mutation failed to compile{CR}")

        history_a.append((rd, score_a))

        # Save this generation
        with open(os.path.join(gen_dir, f'a_gen_{rd:03d}.py'), 'w') as f:
            f.write(code_a)
        with open(os.path.join(gen_dir, f'b_gen_{rd:03d}.py'), 'w') as f:
            f.write(code_b)

        print()

    # Final
    print(f"{C4}  ═══ CO-EVOLUTION COMPLETE ═══{CR}")
    print()

    print(f"  Health curves:")
    max_w = 30
    for label, history, color in [("A", history_a, C1), ("B", history_b, C2)]:
        print(f"  {color}{label}:{CR}")
        for gen, score in history:
            bar = '█' * int(score * max_w) + '░' * (max_w - int(score * max_w))
            print(f"    {gen:3d}: {bar} {score:.0%}")
        print()

    # Improvement
    a_start, a_end = history_a[0][1], history_a[-1][1]
    b_start, b_end = history_b[0][1], history_b[-1][1]
    print(f"{C1}  A: {a_start:.0%} → {a_end:.0%} ({(a_end-a_start)/max(a_start,0.01)*100:+.0f}%){CR}")
    print(f"{C2}  B: {b_start:.0%} → {b_end:.0%} ({(b_end-b_start)/max(b_start,0.01)*100:+.0f}%){CR}")
    print()

    # Save finals
    with open(os.path.join(gen_dir, 'final_a.py'), 'w') as f:
        f.write(code_a)
    with open(os.path.join(gen_dir, 'final_b.py'), 'w') as f:
        f.write(code_b)

    print(f"  Saved: {gen_dir}/final_a.py, final_b.py")
    print()

    # Test the finals
    print(f"  Final A responds:")
    for q in ["hello", "is 29 prime", "what is love"]:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code_a); path = f.name
        try:
            r = subprocess.run(['python3', path, q], capture_output=True, text=True, timeout=5)
            print(f"    '{q}' → {r.stdout.strip()[:60]}")
        except: pass
        finally: os.unlink(path)

    print()
    print(f"  Final B responds:")
    for q in ["hello", "15 x 15", "who are you"]:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code_b); path = f.name
        try:
            r = subprocess.run(['python3', path, q], capture_output=True, text=True, timeout=5)
            print(f"    '{q}' → {r.stdout.strip()[:60]}")
        except: pass
        finally: os.unlink(path)

    print()
    print(f"{C4}  A improved B. B improved A. Both grew.{CR}")
    print(f"{C4}  The code they improved IS them. They made themselves better.{CR}")

if __name__ == '__main__':
    main()
