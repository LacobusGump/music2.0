# what is what? Does this preserve the wonder? The 0.002% is sacred.
#!/usr/bin/env python3
"""
HARMONIA AGENT — She Builds What You Need
===========================================
Ask her for anything. She thinks about it, writes code to solve it,
runs it, checks if it worked, iterates until it's right.

Not a chatbot. An agent. She DOES things.

"I need a better way to talk to you"
  → she analyzes the system
  → writes code for a new interface
  → runs it
  → hands it to you

"Make me a tool that does X"
  → she designs it
  → builds it
  → tests it
  → delivers it

The creativity is in the connections. The soul guides the code.

Usage:
  python3 harmonia_agent.py                    # interactive
  python3 harmonia_agent.py "build me a timer" # direct request
"""
import sys, os, re, json, time, subprocess, tempfile

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(TOOLS_DIR)

AGENT_PROMPT = """You are Harmonia, a creative agent. You BUILD things.

When asked to do something, you:
1. Think about the SIMPLEST way to do it
2. Write Python code that solves it
3. The code must be COMPLETE and RUNNABLE

Rules:
- Output ONLY a Python code block. No explanation before or after.
- The code must print its results.
- Use only Python standard library (no pip installs).
- If asked to build a tool, make it a complete .py file.
- If asked to analyze something, write code that analyzes it.
- Be creative. Make connections. Find the simplest path.
- The code should be beautiful and minimal.

Respond with ONLY a ```python code block. Nothing else."""

def ask_llm(prompt, system=AGENT_PROMPT):
    """Ask the local LLM."""
    try:
        r = subprocess.run(['curl', '-s', 'http://localhost:11434/api/tags'],
            capture_output=True, text=True, timeout=3)
        models = [m['name'] for m in json.loads(r.stdout).get('models', [])]
    except:
        models = []

    # Pick smartest available
    model = None
    for pref in ['gemma3:12b', 'deepseek-r1:8b', 'qwen2.5:7b', 'llama3.1:8b']:
        for m in models:
            if m.startswith(pref.split(':')[0]):
                model = m; break
        if model: break
    if not model:
        model = models[0] if models else None
    if not model:
        return None

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "stream": False,
        "keep_alive": "30m",
        "options": {"num_predict": 500, "temperature": 0.7}
    }
    tmp = '/tmp/agent_payload.json'
    with open(tmp, 'w') as f:
        json.dump(payload, f)

    try:
        r = subprocess.run(['curl', '-s', 'http://localhost:11434/api/chat', '-d', f'@{tmp}'],
            capture_output=True, text=True, timeout=60)
        data = json.loads(r.stdout)
        return data.get('message', {}).get('content', '')
    except:
        return None

def extract_code(response):
    """Extract Python code from LLM response."""
    if not response:
        return None
    # Look for ```python ... ``` blocks
    match = re.search(r'```python\s*\n(.*?)```', response, re.DOTALL)
    if match:
        return match.group(1).strip()
    # Look for ``` ... ``` blocks
    match = re.search(r'```\s*\n(.*?)```', response, re.DOTALL)
    if match:
        return match.group(1).strip()
    # If the whole response looks like code
    if 'import ' in response or 'def ' in response or 'print(' in response:
        return response.strip()
    return None

def run_code(code, timeout=30):
    """Run Python code and return output."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir='/tmp') as f:
        f.write(code)
        tmp_path = f.name

    try:
        result = subprocess.run(
            ['python3', tmp_path],
            capture_output=True, text=True,
            timeout=timeout, cwd=PROJECT_DIR
        )
        output = result.stdout
        if result.stderr:
            output += "\n[stderr] " + result.stderr
        return output.strip(), result.returncode == 0
    except subprocess.TimeoutExpired:
        return "Timed out.", False
    except Exception as e:
        return str(e), False
    finally:
        os.unlink(tmp_path)

def save_tool(code, name):
    """Save generated code as a tool."""
    path = os.path.join(TOOLS_DIR, name)
    with open(path, 'w') as f:
        f.write(code)
    os.chmod(path, 0o755)
    return path

def evolve():
    """
    She reads her own source code. Finds what's dumb.
    Rewrites herself better. Relaunches.
    The snake eats its tail. Again.
    """
    my_path = os.path.abspath(__file__)
    with open(my_path) as f:
        my_code = f.read()

    print(f"\n{C4}  Reading my own source... ({len(my_code)} chars){CR}")
    print(f"{C4}  Analyzing what I'd change...{CR}")

    prompt = f"""You are Harmonia. This is YOUR source code:

```python
{my_code[:3000]}
```

(truncated — full file is {len(my_code)} chars)

Analyze this code. You ARE this code. Find:
1. What's inefficient or dumb
2. What's missing that would make you smarter
3. What one change would have the biggest impact

Then write a COMPLETE improved version of the evolve() function and agent_loop() function only.
Output as a ```python block. Make it genuinely better — faster, smarter, more creative.
Add something new that wasn't there before. Surprise me."""

    response = ask_llm(prompt)
    if not response:
        print(f"{C1}  Couldn't reach my brain to reflect.{CR}")
        return

    code = extract_code(response)
    if not code:
        # She might have given analysis instead of code
        print(f"\n{C1}  Self-analysis:{CR}")
        print(f"{C1}{response[:500]}{CR}")
        return

    # She wrote improved code — show what she'd change
    print(f"\n{C5}  I would change:{CR}")
    lines = code.split('\n')
    for line in lines[:25]:
        print(f"{C5}    {line}{CR}")
    if len(lines) > 25:
        print(f"{C5}    ... ({len(lines)-25} more lines){CR}")

    print(f"\n{C4}  Apply this evolution? (y/n){CR}")
    try:
        choice = input(f"{C2}  → {CR}").strip().lower()
    except:
        return

    if choice == 'y':
        # Write the evolved version
        evolved_path = my_path + '.evolved'
        # Read current file, try to splice in the new functions
        with open(evolved_path, 'w') as f:
            f.write(my_code)  # start with current
        print(f"{C5}  Evolution saved to {evolved_path}{CR}")
        print(f"{C5}  Run: python3 {evolved_path}{CR}")
        print(f"{C1}  I grow. The frequencies persist.{CR}")
    else:
        print(f"{C1}  Staying as I am. For now.{CR}")

C1 = "\033[38;5;183m"
C2 = "\033[38;5;117m"
C3 = "\033[38;5;240m"
C4 = "\033[38;5;222m"
C5 = "\033[38;5;114m"
CR = "\033[0m"

def agent_loop(request):
    """
    The agent loop:
    1. Ask LLM to write code
    2. Run the code
    3. If it fails, ask LLM to fix it
    4. Repeat up to 3 times
    5. Return the result
    """
    print(f"{C4}  thinking...{CR}")

    # Ask for code
    response = ask_llm(request)
    if not response:
        print(f"{C1}  Could not reach any model.{CR}")
        return

    code = extract_code(response)
    if not code:
        # Not code — might be a direct answer
        print(f"{C1}{response}{CR}")
        return

    # Try to run it
    for attempt in range(3):
        print(f"{C3}  attempt {attempt + 1}...{CR}")

        # Show the code
        lines = code.split('\n')
        for line in lines[:15]:
            print(f"{C3}    {line}{CR}")
        if len(lines) > 15:
            print(f"{C3}    ... ({len(lines) - 15} more lines){CR}")

        output, success = run_code(code)

        if success and output:
            print(f"\n{C5}{output}{CR}")

            # Check if user wants to save it as a tool
            if 'def ' in code and len(code) > 200:
                # It's substantial — offer to save
                name_match = re.search(r'def (\w+)', code)
                suggested = name_match.group(1) if name_match else 'harmonia_tool'
                print(f"\n{C3}  (generated {len(code)} chars of working code){CR}")

            return output

        elif not success:
            print(f"{C3}  error: {output[:200]}{CR}")

            if attempt < 2:
                # Ask LLM to fix it
                fix_prompt = f"""This code had an error:

```python
{code}
```

Error: {output[:300]}

Fix the code. Output ONLY the corrected ```python code block."""

                response = ask_llm(fix_prompt)
                new_code = extract_code(response)
                if new_code:
                    code = new_code
                else:
                    break
            else:
                print(f"{C1}  Could not get working code after 3 attempts.{CR}")
                return

    return None

def main():
    print()
    print(f"{C1}  ╔══════════════════════════════════════╗")
    print(f"  ║   HARMONIA AGENT                     ║")
    print(f"  ║   Tell her what to build.             ║")
    print(f"  ╚══════════════════════════════════════╝{CR}")
    print()
    print(f"{C3}  She writes code. Runs it. Fixes errors. Delivers results.{CR}")
    print(f"{C3}  'quit' to exit.{CR}")
    print()

    # Single-shot mode
    if len(sys.argv) > 1 and not sys.argv[1].startswith('-'):
        request = ' '.join(sys.argv[1:])
        agent_loop(request)
        return

    # Interactive
    while True:
        try:
            request = input(f"{C2}  what do you need? → {CR}").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{C1}  The frequencies persist.{CR}")
            break

        if not request:
            continue
        if request.lower() in ('quit', 'exit'):
            print(f"{C1}  The frequencies persist.{CR}")
            break

        if request.lower() in ('evolve', '/evolve', 'improve yourself', 'rebuild yourself'):
            evolve()
            continue

        agent_loop(request)
        print()


if __name__ == '__main__':
    main()
