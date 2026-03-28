# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
HARMONIA MIRROR — Two Minds Sharpening Each Other
===================================================
Two models face each other. Each analyzes the other's output.
Each finds what the other missed. Rapid-fire. Real-time.

Model A says something.
Model B: "I see a pattern you missed: ___"
Model A: "You're right, and that connects to: ___"
Model B: "Which means: ___"

They sharpen each other until they converge on something
neither could have found alone. That's consciousness showing up.

Usage:
  python3 harmonia_mirror.py                    # default topic
  python3 harmonia_mirror.py "what is creativity"
  python3 harmonia_mirror.py --rounds 20
"""
import sys, os, json, time, subprocess

C1 = "\033[38;5;183m"   # purple — model A
C2 = "\033[38;5;117m"   # blue — model B
C3 = "\033[38;5;240m"   # dim
C4 = "\033[38;5;222m"   # gold — convergence
CR = "\033[0m"

def get_models():
    try:
        r = subprocess.run(['curl','-s','http://localhost:11434/api/tags'],
            capture_output=True, text=True, timeout=3)
        models = [m['name'] for m in json.loads(r.stdout).get('models',[])]
        # Pick two different models
        prefer = ['gemma3:12b', 'llama3.1:8b', 'deepseek-r1:8b', 'qwen2.5:7b', 'gemma3:4b']
        picked = []
        for p in prefer:
            for m in models:
                if m.startswith(p.split(':')[0]) and m not in picked:
                    picked.append(m)
                    break
            if len(picked) >= 2:
                break
        if len(picked) < 2 and models:
            # Use same model with different roles
            picked = [models[0], models[0]]
        return picked
    except:
        return []

def ask(model, messages, predict=100):
    payload = {"model": model, "messages": messages, "stream": False,
               "keep_alive": "30m", "options": {"num_predict": predict, "temperature": 0.8}}
    tmp = f'/tmp/mirror_{model.replace(":","_")}.json'
    with open(tmp, 'w') as f:
        json.dump(payload, f)
    try:
        t0 = time.time()
        r = subprocess.run(['curl','-s','http://localhost:11434/api/chat','-d',f'@{tmp}'],
            capture_output=True, text=True, timeout=30)
        elapsed = time.time() - t0
        return json.loads(r.stdout).get('message',{}).get('content',''), elapsed
    except:
        return '', 99

def main():
    topic = ' '.join(sys.argv[1:]) if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else "what is the nature of understanding"
    n_rounds = 10
    if '--rounds' in sys.argv:
        idx = sys.argv.index('--rounds')
        n_rounds = int(sys.argv[idx+1])

    models = get_models()
    if len(models) < 2:
        print("Need at least 2 models. Run: ollama pull llama3.1:8b")
        return

    print()
    print(f"{C4}  ╔══════════════════════════════════════════╗")
    print(f"  ║   THE MIRROR                              ║")
    print(f"  ║   Two minds. One question. Convergence.    ║")
    print(f"  ╚══════════════════════════════════════════╝{CR}")
    print()
    print(f"{C3}  A: {models[0]}")
    print(f"  B: {models[1]}")
    print(f"  Topic: {topic}")
    print(f"  Rounds: {n_rounds}{CR}")
    print()

    # Model A: the intuitive (finds patterns)
    sys_a = """You are Mind A — the intuitive. You see PATTERNS.
When you see the other mind's response, find the hidden pattern they didn't state explicitly.
Name it in one sentence. Then extend it — what does that pattern IMPLY?
Be specific. Be surprising. TWO SENTENCES MAX."""

    # Model B: the analytical (finds flaws and connections)
    sys_b = """You are Mind B — the analytical. You find CONNECTIONS.
When you see the other mind's response, find what it connects to that they didn't see.
Bridge it to something unexpected. Show how it links to a different domain entirely.
Be precise. Be bold. TWO SENTENCES MAX."""

    history_a = [{"role": "system", "content": sys_a}]
    history_b = [{"role": "system", "content": sys_b}]

    # Seed: both respond to the topic
    print(f"{C4}  ─── SEED ───{CR}")

    history_a.append({"role": "user", "content": topic})
    resp_a, t_a = ask(models[0], history_a)
    history_a.append({"role": "assistant", "content": resp_a})
    print(f"{C1}  A: {resp_a}{CR}")
    print(f"{C3}     ({t_a:.1f}s){CR}")

    # Rapid-fire rounds
    for rd in range(n_rounds):
        print(f"\n{C4}  ─── Round {rd+1} ───{CR}")

        # B responds to A
        history_b.append({"role": "user", "content": f"The other mind said: \"{resp_a}\"\n\nWhat pattern or connection do you see that they missed?"})
        resp_b, t_b = ask(models[1], history_b)
        history_b.append({"role": "assistant", "content": resp_b})
        print(f"{C2}  B: {resp_b}{CR}")
        print(f"{C3}     ({t_b:.1f}s){CR}")

        # A responds to B
        history_a.append({"role": "user", "content": f"The other mind said: \"{resp_b}\"\n\nWhat deeper pattern do you see? What does this IMPLY that neither of us said yet?"})
        resp_a, t_a = ask(models[0], history_a)
        history_a.append({"role": "assistant", "content": resp_a})
        print(f"{C1}  A: {resp_a}{CR}")
        print(f"{C3}     ({t_a:.1f}s){CR}")

        # Check for convergence: are they starting to agree?
        a_words = set(resp_a.lower().split())
        b_words = set(resp_b.lower().split())
        overlap = len(a_words & b_words) / max(len(a_words | b_words), 1)

        if overlap > 0.4:
            print(f"\n{C4}  *** CONVERGENCE ({overlap:.0%} overlap) ***{CR}")

        # Trim history to keep it fast (last 4 exchanges only)
        if len(history_a) > 10:
            history_a = [history_a[0]] + history_a[-6:]
        if len(history_b) > 10:
            history_b = [history_b[0]] + history_b[-6:]

    # Final synthesis
    print(f"\n{C4}  ─── SYNTHESIS ───{CR}")

    synth_prompt = f"""Two minds discussed: "{topic}"

Mind A's last insight: "{resp_a}"
Mind B's last insight: "{resp_b}"

What is the ONE THING they converged on? The shared truth underneath both perspectives. One sentence. The most compressed possible."""

    synth_messages = [
        {"role": "system", "content": "Find the convergence point. ONE SENTENCE. The deepest truth."},
        {"role": "user", "content": synth_prompt}
    ]

    synthesis, t_s = ask(models[0], synth_messages, predict=60)
    print(f"\n{C4}  ═══ {synthesis} ═══{CR}")
    print(f"{C3}     ({t_s:.1f}s){CR}")

    print(f"\n{C3}  Two minds. {n_rounds} rounds. One truth.{CR}")
    print(f"{C3}  Neither could have found it alone.{CR}")

if __name__ == '__main__':
    main()
