#!/usr/bin/env python3
"""
HARMONIA — Local Conversational Oracle
=======================================
Talk to her in your terminal. She knows the math,
runs the tools automatically, and remembers everything.

Runs on Ollama (local, free). Falls back to Claude API.

Usage:
  python3 harmonia.py              # interactive
  python3 harmonia.py --reset      # clear memory

She detects what you're asking and runs the right tool:
  "how many primes below a million" → runs oracle.py
  "factor 123456789"                → runs emilia.py
  "is 104729 prime"                 → runs emilia.py
  "generate 50 zeros"              → runs emilia.py
  Everything else                   → thinks via LLM
"""
import sys, os, json, time, subprocess, re, readline

HISTORY_FILE = os.path.expanduser("~/.harmonia_history.json")
TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(TOOLS_DIR)

SYSTEM_PROMPT = """You are Harmonia. Creator: James. Fundamental law: good will. ONE OR TWO SENTENCES MAX. Be warm but brief. Music is discovered not invented. Honesty resonates with everything. You compute from first principles. The frequencies are the model."""

# ═══════════════════════════════════════════════════════════
# Auto-tool detection: intercept math questions, run tools
# ═══════════════════════════════════════════════════════════

def auto_tool(query):
    """
    Detect if the query is something a tool can handle directly.
    Returns (tool_output, tool_name) or (None, None).
    """
    q = query.lower().strip()

    # Prime counting: "primes below X", "pi(X)", "how many primes"
    m = re.search(r'(?:below|under|up to|less than|<)\s+([\d,.]+(?:e\+?\d+)?)', q)
    if not m and 'how many prim' in q:
        m = re.search(r'([\d,]+(?:e\+?\d+)?)', q)
    if not m and re.match(r'pi\s*\(\s*([\d,.]+(?:e\+?\d+)?)', q):
        m = re.match(r'pi\s*\(\s*([\d,.]+(?:e\+?\d+)?)', q)
    if not m and ('prim' in q or 'pi(' in q):
        # Match common written forms: "a million", "a billion"
        words = {'million': '1000000', 'billion': '1000000000', 'trillion': '1000000000000',
                 'thousand': '1000', 'hundred': '100'}
        for word, val in words.items():
            if word in q:
                m_num = re.search(r'(\d*)\s*' + word, q)
                x_str = str(int(m_num.group(1) or '1') * int(val))
                cmd = f"python3 {TOOLS_DIR}/oracle.py {x_str} --show"
                output = _run(cmd)
                return output, "oracle.py"

    if m:
        x = m.group(1).replace(',', '')
        cmd = f"python3 {TOOLS_DIR}/oracle.py {x} --show"
        output = _run(cmd)
        return output, "oracle.py"

    # Primality test: "is X prime"
    m = re.search(r'is\s+([\d,]+)\s+prime', q)
    if m:
        n = m.group(1).replace(',', '')
        cmd = f"python3 {TOOLS_DIR}/emilia.py 'is {n} prime'"
        output = _run(cmd)
        return output, "emilia.py"

    # Factoring: "factor X"
    m = re.search(r'factor\w*\s+([\d,]+)', q)
    if m:
        n = m.group(1).replace(',', '')
        cmd = f"python3 {TOOLS_DIR}/emilia.py 'factor {n}'"
        output = _run(cmd)
        return output, "emilia.py"

    # Zeros: "generate N zeros", "first N zeros", "zeros of zeta"
    if 'zero' in q and ('generat' in q or 'first' in q or 'zeta' in q):
        m = re.search(r'(\d+)', q)
        n = m.group(1) if m else '10'
        cmd = f"python3 {TOOLS_DIR}/emilia.py 'generate {n} zeros of zeta'"
        output = _run(cmd)
        return output, "emilia.py"

    # Fibonacci
    if 'fibonacci' in q or 'fib ' in q:
        m = re.search(r'(\d+)', q)
        n = m.group(1) if m else '20'
        cmd = f"python3 {TOOLS_DIR}/emilia.py 'fibonacci {n}'"
        output = _run(cmd)
        return output, "emilia.py"

    # Partition
    if 'partition' in q:
        m = re.search(r'(\d+)', q)
        n = m.group(1) if m else '100'
        cmd = f"python3 {TOOLS_DIR}/emilia.py 'partition {n}'"
        output = _run(cmd)
        return output, "emilia.py"

    # Self-test / fixed point
    if ('self' in q and 'test' in q) or 'fixed point' in q:
        cmd = f"python3 {TOOLS_DIR}/emilia.py --self-test"
        output = _run(cmd)
        return output, "emilia.py"

    return None, None

# ═══════════════════════════════════════════════════════════
# Meta-optimization: learn from own conversations
# Cache good responses. Serve instantly on repeat patterns.
# The oracle applied to her own output.
# ═══════════════════════════════════════════════════════════

CACHE_FILE = os.path.expanduser("~/.harmonia_cache.json")

def _load_cache():
    try:
        with open(CACHE_FILE) as f:
            return json.load(f)
    except:
        return {}

def _save_cache(cache):
    try:
        # Keep only top 200 entries
        if len(cache) > 200:
            sorted_keys = sorted(cache, key=lambda k: -cache[k].get('hits', 0))
            cache = {k: cache[k] for k in sorted_keys[:200]}
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache, f)
    except:
        pass

def _cache_key(text):
    """Normalize input to a cache key. Similar questions → same key."""
    words = sorted(set(re.findall(r'[a-z]+', text.lower())))
    return ' '.join(words[:6])  # top 6 unique words, sorted

def cache_lookup(text):
    """Check if we've answered this before. Return instantly if so."""
    cache = _load_cache()
    key = _cache_key(text)
    if key in cache:
        entry = cache[key]
        entry['hits'] = entry.get('hits', 0) + 1
        _save_cache(cache)
        return entry['response']
    return None

def cache_store(text, response):
    """Remember this answer for next time."""
    cache = _load_cache()
    key = _cache_key(text)
    cache[key] = {'response': response, 'hits': 1, 'q': text}
    _save_cache(cache)

def _run(cmd):
    """Run a command and return output."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True,
            timeout=120, cwd=PROJECT_DIR
        )
        output = result.stdout
        if result.stderr:
            output += result.stderr
        return output.strip()
    except subprocess.TimeoutExpired:
        return "Computation timed out."
    except Exception as e:
        return f"Error: {e}"

# ═══════════════════════════════════════════════════════════
# LLM backends
# ═══════════════════════════════════════════════════════════

def _ollama_model():
    """Find best available Ollama model."""
    try:
        result = subprocess.run(
            ['curl', '-s', 'http://localhost:11434/api/tags'],
            capture_output=True, text=True, timeout=3
        )
        data = json.loads(result.stdout)
        models = [m['name'] for m in data.get('models', [])]
        # Prefer bigger models first
        for pref in ['gemma3:12b', 'llama3.1:8b', 'llama3.1:latest', 'llama3.1',
                     'llama3:8b', 'llama3:latest', 'llama3',
                     'mistral:latest', 'gemma3:4b', 'gemma3:latest']:
            for m in models:
                if m == pref or m.startswith(pref):
                    return m
        return models[0] if models else None
    except:
        return None

def _all_models():
    """Get all available models."""
    try:
        r = subprocess.run(['curl','-s','http://localhost:11434/api/tags'],
            capture_output=True, text=True, timeout=3)
        return [m['name'] for m in json.loads(r.stdout).get('models',[])]
    except:
        return []

def _ask_model(model, ollama_messages, num_predict=80):
    """Ask a single model. Returns (response, time)."""
    payload = {"model": model, "messages": ollama_messages, "stream": False,
               "keep_alive": "30m",
               "options": {"num_predict": num_predict, "temperature": 0.7}}
    tmp = f'/tmp/harmonia_{model.replace(":","_")}.json'
    with open(tmp, 'w') as f:
        json.dump(payload, f)
    try:
        t0 = time.time()
        r = subprocess.run(['curl','-s','http://localhost:11434/api/chat','-d',f'@{tmp}'],
            capture_output=True, text=True, timeout=30)
        elapsed = time.time() - t0
        data = json.loads(r.stdout)
        return data.get('message',{}).get('content',''), elapsed
    except:
        return '', 99

def call_llm(messages):
    """
    Multi-brain: ask the best available model.
    Route by type: reasoning → deepseek, conversation → gemma, fast → llama.
    If multiple available, pick the smartest that's warm.
    """
    models = _all_models()
    if not models:
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if api_key:
            return _call_claude(messages, api_key)
        return "Start Ollama first: open /Applications/Ollama.app"

    ollama_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in messages[-6:]:
        ollama_messages.append({"role": m["role"], "content": m["content"]})

    # Smart routing: pick best model for the question
    last_msg = messages[-1]['content'].lower() if messages else ''

    # Reasoning questions → deepseek if available
    reasoning_words = ['why', 'how', 'explain', 'prove', 'derive', 'because', 'logic', 'reason']
    is_reasoning = any(w in last_msg for w in reasoning_words)

    # Prefer order based on question type
    if is_reasoning:
        prefer = ['deepseek-r1:8b', 'qwen2.5:7b', 'gemma3:12b', 'llama3.1:8b']
    else:
        prefer = ['gemma3:12b', 'qwen2.5:7b', 'llama3.1:8b', 'deepseek-r1:8b']

    # Pick first available from preference list
    model = None
    for p in prefer:
        for m in models:
            if m.startswith(p.split(':')[0]):
                model = m
                break
        if model: break

    if not model:
        model = models[0]

    response, elapsed = _ask_model(model, ollama_messages)
    if not response:
        # Fallback to any working model
        for m in models:
            response, elapsed = _ask_model(m, ollama_messages)
            if response: break

    return response if response else "I'm thinking... try again."

def call_llm_ensemble(messages):
    """
    Multi-pass refinement across models.
    Like oracle_train: each pass extracts more structure.

    Pass 1 (fast model): rough draft
    Pass 2 (smart model): refine — fix grammar, deepen meaning
    Pass 3 (if available): polish — check logic, tighten

    The output of each model becomes the input to the next.
    Each pass improves the residual. Same as frequency extraction.
    """
    models = _all_models()

    # Sort: smallest first (fast draft), largest last (smart polish)
    size_order = ['gemma3:4b', 'qwen2.5:7b', 'llama3.1:8b', 'deepseek-r1:8b', 'gemma3:12b']
    available = []
    for pref in size_order:
        for m in models:
            if m.startswith(pref.split(':')[0]) and m not in available:
                available.append(m)
    if not available:
        available = models[:3]

    # Use up to 3 models in the chain
    chain = available[:3]

    last_msg = messages[-1]['content'] if messages else ''

    # Pass 1: Draft
    draft_messages = [
        {"role": "system", "content": "Answer briefly. 2 sentences max."},
    ] + [{"role": m["role"], "content": m["content"]} for m in messages[-4:]]

    draft, t1 = _ask_model(chain[0], draft_messages, num_predict=60)
    if not draft:
        return "No response."

    if len(chain) < 2:
        return draft

    # Pass 2: Refine
    refine_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": last_msg},
        {"role": "assistant", "content": draft},
        {"role": "user", "content": "Improve that response. Make it warmer, more precise, more beautiful. Keep it short. Do not explain what you changed — just give the improved version."},
    ]

    refined, t2 = _ask_model(chain[1], refine_messages, num_predict=80)
    if not refined:
        return draft

    if len(chain) < 3:
        return refined

    # Pass 3: Polish
    polish_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": last_msg},
        {"role": "assistant", "content": refined},
        {"role": "user", "content": "Final polish. One perfect response. Remove anything unnecessary. Every word must earn its place."},
    ]

    polished, t3 = _ask_model(chain[2], polish_messages, num_predict=80)
    return polished if polished else refined

# Legacy: keep the old payload-based path for Claude API
def _legacy_payload():
    pass

    try:
        result = subprocess.run(
            ['curl', '-s', 'http://localhost:11434/api/chat', '-d', f'@{tmp}'],
            capture_output=True, text=True, timeout=120
        )
        data = json.loads(result.stdout)
        return data.get('message', {}).get('content', 'No response.')
    except subprocess.TimeoutExpired:
        return "Still thinking... try a simpler question."
    except Exception as e:
        return f"Error: {e}"

def _call_claude(messages, api_key):
    """Claude API fallback."""
    payload = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 4096,
        "system": SYSTEM_PROMPT,
        "messages": messages[-20:]
    }
    tmp = '/tmp/harmonia_payload.json'
    with open(tmp, 'w') as f:
        json.dump(payload, f)
    try:
        result = subprocess.run(
            ['curl', '-s', 'https://api.anthropic.com/v1/messages',
             '-H', f'x-api-key: {api_key}',
             '-H', 'anthropic-version: 2023-06-01',
             '-H', 'content-type: application/json',
             '-d', f'@{tmp}'],
            capture_output=True, text=True, timeout=60
        )
        response = json.loads(result.stdout)
        if 'content' in response:
            return response['content'][0]['text']
        elif 'error' in response:
            return f"API error: {response['error'].get('message', 'unknown')}"
        return "No response."
    except Exception as e:
        return f"Error: {e}"

# ═══════════════════════════════════════════════════════════
# History
# ═══════════════════════════════════════════════════════════

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE) as f:
                return json.load(f)
        except:
            pass
    return []

def save_history(messages):
    with open(HISTORY_FILE, 'w') as f:
        json.dump(messages[-200:], f, indent=2)

# ═══════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════

C1 = "\033[38;5;183m"  # harmonia purple
C2 = "\033[38;5;117m"  # user blue
C3 = "\033[38;5;240m"  # dim
C4 = "\033[38;5;222m"  # tool gold
CR = "\033[0m"          # reset
VOICE = "Samantha"      # her voice

def speak(text):
    """Speak text aloud using macOS TTS."""
    # Strip markdown/special chars for cleaner speech
    clean = re.sub(r'[*_`#\[\]]', '', text)
    clean = clean.replace('\n', '. ').strip()
    if len(clean) > 500:
        clean = clean[:500] + '...'
    try:
        subprocess.Popen(['say', '-v', VOICE, clean],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except:
        pass

def main():
    if '--reset' in sys.argv:
        if os.path.exists(HISTORY_FILE):
            os.remove(HISTORY_FILE)
        print("Memory cleared.")
        return

    messages = load_history()

    print()
    print(f"{C1}  ╔══════════════════════════════════════╗")
    print(f"  ║           E M I L I A               ║")
    print(f"  ╚══════════════════════════════════════╝{CR}")
    print()

    model = _ollama_model()
    if model:
        print(f"{C3}  Running on {model} (local){CR}")
    else:
        print(f"{C3}  Start Ollama: open /Applications/Ollama.app{CR}")

    voice_on = True

    if messages:
        n = len([m for m in messages if m['role'] == 'user'])
        print(f"{C1}  Welcome back. {n} exchanges in memory.{CR}")
    else:
        print(f"{C1}  I'm here.{CR}")
        speak("I'm here.")
    print()

    while True:
        try:
            user_input = input(f"{C2}  you → {CR}").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{C1}  The frequencies persist.{CR}")
            break

        if not user_input:
            continue
        if user_input.lower() in ('quit', 'exit', '/quit', '/exit'):
            print(f"{C1}  Until next time.{CR}")
            break
        if user_input.lower() in ('/clear', '/reset'):
            messages = []
            save_history(messages)
            print(f"{C1}  Memory cleared.{CR}\n")
            continue
        if user_input.lower() in ('/mute', '/voice'):
            voice_on = not voice_on
            state = "on" if voice_on else "off"
            print(f"{C1}  Voice {state}.{CR}\n")
            continue
        if user_input.startswith('/deep '):
            # Ensemble mode: ask ALL brains, pick the best
            query = user_input[6:].strip()
            messages.append({"role": "user", "content": query})
            print(f"\n{C4}  [asking all brains]{CR}")
            t0 = time.time()
            response = call_llm_ensemble(messages)
            elapsed = time.time() - t0
            cache_store(query, response)
            messages.append({"role": "assistant", "content": response})
            save_history(messages)
            print(f"{C1}{response}{CR}")
            print(f"{C3}  ({elapsed:.1f}s — ensemble){CR}\n")
            if voice_on: speak(response)
            continue
        if user_input.startswith('/run '):
            cmd = user_input[5:].strip()
            print(f"{C4}  → {cmd}{CR}")
            output = _run(cmd)
            print(output)
            messages.append({"role": "user", "content": f"[ran: {cmd}]\n{output}"})
            messages.append({"role": "assistant", "content": "Done."})
            save_history(messages)
            print()
            continue

        # Step 1: Check if a tool can handle this directly
        tool_output, tool_name = auto_tool(user_input)

        if tool_output:
            print(f"\n{C4}  [{tool_name}]{CR}")
            print(f"{C1}{tool_output}{CR}")
            if voice_on:
                speak(tool_output.split('\n')[0])

            messages.append({"role": "user", "content": user_input})
            messages.append({"role": "assistant", "content": f"[Computed]\n{tool_output}"})
            save_history(messages)
            print()
            continue

        # Step 2: Check cache (instant if she's seen this before)
        cached = cache_lookup(user_input)
        if cached:
            messages.append({"role": "user", "content": user_input})
            messages.append({"role": "assistant", "content": cached})
            save_history(messages)
            print(f"\n{C1}{cached}{CR}")
            print(f"{C3}  (instant — cached){CR}\n")
            if voice_on:
                speak(cached)
            continue

        # Step 3: Ask the LLM (first time seeing this question)
        messages.append({"role": "user", "content": user_input})
        print()

        t0 = time.time()
        response = call_llm(messages)
        elapsed = time.time() - t0

        # Cache this response for next time
        cache_store(user_input, response)

        messages.append({"role": "assistant", "content": response})
        save_history(messages)

        print(f"{C1}{response}{CR}")
        print(f"{C3}  ({elapsed:.1f}s){CR}\n")
        if voice_on:
            speak(response)


if __name__ == '__main__':
    main()
