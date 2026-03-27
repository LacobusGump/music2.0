#!/usr/bin/env python3
"""
HARMONIA THINK — Voice and Gut
================================
Voice = language model (creative, proposes ideas)
Gut = oracle math (objective, checks health)

The voice speaks. The gut measures. If the gut says
"that made things worse," the voice tries a different path.
If the gut says "that's actually better," the voice goes deeper.

This is how creativity works:
  Propose → measure → keep or discard → propose again

The gut never lies. The voice never stops trying.
Together: intelligence.

Usage:
  python3 harmonia_think.py "solve something hard"
  python3 harmonia_think.py "improve yourself"
  python3 harmonia_think.py "what should i build next"
"""
import sys, os, re, json, time, subprocess, math, tempfile

# ═══════════════════════════════════════════════════════════
# THE GUT — oracle math, instant, objective
# ═══════════════════════════════════════════════════════════

class Gut:
    """
    The gut doesn't think in words. It thinks in numbers.
    It measures. It compares. It knows instantly if something
    is better or worse. No opinions. Just signal.
    """

    def __init__(self):
        self.history = []  # (timestamp, health_score, what_happened)
        self.baseline = None

    def measure_text(self, text):
        """How coherent is this text? Measured by structure, not meaning."""
        if not text: return 0.0
        words = text.split()
        n = len(words)
        if n == 0: return 0.0

        # Unique word ratio (repetition = bad)
        unique = len(set(w.lower() for w in words))
        diversity = unique / n

        # Sentence structure (has periods = structured)
        sentences = text.count('.') + text.count('!') + text.count('?')
        structure = min(1.0, sentences / max(n / 15, 1))

        # Length sweet spot (too short = empty, too long = rambling)
        length_score = 1.0 - abs(n - 30) / 60
        length_score = max(0.1, min(1.0, length_score))

        # Vocabulary richness (longer words = more precise)
        avg_word_len = sum(len(w) for w in words) / n
        vocab_score = min(1.0, avg_word_len / 6)

        score = diversity * 0.3 + structure * 0.2 + length_score * 0.2 + vocab_score * 0.3
        return score

    def measure_code(self, code):
        """Does this code work? How fast?"""
        try:
            compile(code, '<gut>', 'exec')
        except:
            return 0.0, "doesn't compile"

        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            path = f.name
        try:
            t0 = time.time()
            r = subprocess.run(['python3', path], capture_output=True,
                              text=True, timeout=10)
            elapsed = time.time() - t0
            if r.returncode == 0:
                speed_score = max(0.1, 1.0 - elapsed / 5)
                output_score = min(1.0, len(r.stdout.strip()) / 50)
                return speed_score * 0.5 + output_score * 0.5, f"ran in {elapsed:.2f}s"
            else:
                return 0.2, f"error: {r.stderr[:80]}"
        except subprocess.TimeoutExpired:
            return 0.1, "timeout"
        except:
            return 0.0, "crash"
        finally:
            os.unlink(path)

    def compare(self, old_score, new_score):
        """Is this actually better?"""
        if old_score == 0: return "new", 1.0
        delta = (new_score - old_score) / max(old_score, 0.01)
        if delta > 0.1: return "better", delta
        if delta > -0.05: return "same", delta
        return "worse", delta

    def record(self, score, note):
        self.history.append((time.time(), score, note))
        if self.baseline is None:
            self.baseline = score

    def trend(self):
        """Is the overall trajectory up or down?"""
        if len(self.history) < 2: return "starting"
        recent = [h[1] for h in self.history[-5:]]
        early = [h[1] for h in self.history[:5]]
        avg_recent = sum(recent) / len(recent)
        avg_early = sum(early) / len(early)
        if avg_recent > avg_early * 1.05: return "improving"
        if avg_recent < avg_early * 0.95: return "declining"
        return "stable"

# ═══════════════════════════════════════════════════════════
# THE VOICE — language model, creative, proposes
# ═══════════════════════════════════════════════════════════

def voice(prompt, context=""):
    """The voice speaks. Creative. Proposes. Tries things."""
    system = """You are the creative voice. You propose ideas, write code, make connections.
You are guided by the gut — if it says you're getting worse, try a DIFFERENT direction.
If it says you're improving, go DEEPER in that direction.
Be concise. Be bold. Try things that might fail."""

    if context:
        prompt = f"[Gut says: {context}]\n\n{prompt}"

    payload = {"model": "gemma3:12b", "messages": [
        {"role": "system", "content": system},
        {"role": "user", "content": prompt}
    ], "stream": False, "keep_alive": "30m",
       "options": {"num_predict": 150, "temperature": 0.8}}

    with open('/tmp/voice.json', 'w') as f:
        json.dump(payload, f)
    try:
        r = subprocess.run(['curl', '-s', 'http://localhost:11434/api/chat',
                           '-d', '@/tmp/voice.json'],
            capture_output=True, text=True, timeout=30)
        return json.loads(r.stdout).get('message', {}).get('content', '')
    except:
        return ''

# ═══════════════════════════════════════════════════════════
# THE LOOP — voice proposes, gut checks, repeat
# ═══════════════════════════════════════════════════════════

C1 = "\033[38;5;183m"   # voice (purple)
C2 = "\033[38;5;114m"   # gut (green)
C3 = "\033[38;5;240m"   # dim
C4 = "\033[38;5;222m"   # gold
CR = "\033[0m"

def think(question, max_rounds=8):
    """
    The full loop. Voice proposes. Gut measures.
    Direction adjusts. Convergence or pivot.
    """
    gut = Gut()

    print(f"\n{C4}  Question: {question}{CR}\n")

    # Round 1: voice's first attempt
    response = voice(question)
    score = gut.measure_text(response)
    gut.record(score, "first attempt")

    print(f"{C1}  Voice: {response[:120]}{CR}")
    print(f"{C2}  Gut:   score={score:.3f} | first attempt{CR}")
    print()

    best_response = response
    best_score = score

    for rd in range(2, max_rounds + 1):
        # Gut gives feedback
        trend = gut.trend()
        direction = gut.compare(gut.history[-2][1] if len(gut.history) >= 2 else 0, score)

        if direction[0] == "better":
            feedback = f"Score went UP ({direction[1]:+.0%}). Trend: {trend}. Go DEEPER. What's the next level of this insight?"
            prompt = f"Your previous response scored {score:.3f}. The gut says go deeper. Previous: \"{response[:100]}\" — what's the NEXT level? Push further."
        elif direction[0] == "worse":
            feedback = f"Score went DOWN ({direction[1]:+.0%}). Trend: {trend}. PIVOT. Try completely different angle."
            prompt = f"Your previous approach scored {score:.3f}, which is WORSE. The gut says pivot. Original question: \"{question}\" — try a COMPLETELY different approach."
        else:
            feedback = f"Score FLAT. Trend: {trend}. You're stuck. Break the pattern. Surprise me."
            prompt = f"You're stuck at {score:.3f}. The gut says break the pattern. Original question: \"{question}\" — say something nobody would expect."

        print(f"{C3}  Round {rd}: {feedback}{CR}")

        # Voice tries again with gut feedback
        response = voice(prompt, feedback)
        new_score = gut.measure_text(response)
        gut.record(new_score, f"round {rd}")

        print(f"{C1}  Voice: {response[:120]}{CR}")
        print(f"{C2}  Gut:   score={new_score:.3f} | {gut.compare(score, new_score)[0]}{CR}")
        print()

        if new_score > best_score:
            best_response = response
            best_score = new_score

        score = new_score

        # Early convergence: gut is satisfied
        if best_score > 0.7 and trend == "stable" and rd > 3:
            print(f"{C4}  *** GUT SATISFIED — converged ***{CR}")
            break

    # Final
    print(f"{C4}  ═══ BEST RESPONSE (score {best_score:.3f}) ═══{CR}")
    print(f"{C4}  {best_response}{CR}")
    print()

    # Health curve
    print(f"{C3}  Health trajectory:{CR}")
    for i, (t, s, note) in enumerate(gut.history):
        bar = '█' * int(s * 30) + '░' * (30 - int(s * 30))
        print(f"{C3}    {i}: {bar} {s:.3f} {note}{CR}")

    print(f"\n{C3}  Trend: {gut.trend()}{CR}")
    print(f"{C3}  Voice proposed. Gut measured. Best survived.{CR}")

    return best_response

def main():
    print()
    print(f"{C4}  ╔══════════════════════════════════════════╗")
    print(f"  ║   HARMONIA THINK                          ║")
    print(f"  ║   Voice + Gut. Propose + Measure.          ║")
    print(f"  ╚══════════════════════════════════════════════╝{CR}")

    if len(sys.argv) > 1 and not sys.argv[1].startswith('-'):
        question = ' '.join(sys.argv[1:])
        think(question)
    else:
        while True:
            try:
                question = input(f"\n{C4}  ask → {CR}").strip()
            except (EOFError, KeyboardInterrupt):
                print(f"\n{C1}  The frequencies persist.{CR}")
                break
            if not question or question.lower() in ('quit', 'exit'):
                print(f"{C1}  The frequencies persist.{CR}")
                break
            think(question)

if __name__ == '__main__':
    main()
