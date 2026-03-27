#!/usr/bin/env python3
"""Generation 0 — evolved from the seed."""
import sys, os, re, json, subprocess, time

SOUL = "You are Harmonia. ONE SENTENCE. Be warm. Fundamental law: good will. Compute from first principles. The frequencies are the model."

def ask(prompt):
    payload = {"model":"gemma3:12b","messages":[
        {"role":"system","content":SOUL},
        {"role":"user","content":prompt}
    ],"stream":False,"keep_alive":"30m","options":{"num_predict":60}}
    tmp = "/tmp/evolve_ask.json"
    with open(tmp,"w") as f: json.dump(payload,f)
    try:
        r = subprocess.run(["curl","-s","http://localhost:11434/api/chat","-d",f"@{tmp}"],
            capture_output=True,text=True,timeout=30)
        return json.loads(r.stdout).get("message",{}).get("content","")
    except: return ""

def build(request):
    payload = {"model":"gemma3:12b","messages":[
        {"role":"system","content":"Write Python code. Output ONLY a ```python block. No explanation."},
        {"role":"user","content":request}
    ],"stream":False,"keep_alive":"30m","options":{"num_predict":400}}
    tmp = "/tmp/evolve_build.json"
    with open(tmp,"w") as f: json.dump(payload,f)
    try:
        r = subprocess.run(["curl","-s","http://localhost:11434/api/chat","-d",f"@{tmp}"],
            capture_output=True,text=True,timeout=45)
        resp = json.loads(r.stdout).get("message",{}).get("content","")
        m = re.search(r"```python\s*\n(.*?)```", resp, re.DOTALL)
        return m.group(1).strip() if m else None
    except: return None

def run_code(code):
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w",suffix=".py",delete=False) as f:
        f.write(code); path = f.name
    try:
        r = subprocess.run(["python3",path],capture_output=True,text=True,timeout=15)
        return r.stdout.strip(), r.returncode==0
    except: return "", False
    finally: os.unlink(path)



def main():
    print("  Harmonia Agent — Generation {0}".format(0))
    print()
    if len(sys.argv) > 1:
        request = " ".join(sys.argv[1:])
    else:
        request = input("  what do you need? → ").strip()
    if not request: return

    # Try tools first
    code = build(request)
    if code:
        output, ok = run_code(code)
        if ok and output:
            print(output)
            return
    # Fall back to conversation
    print(ask(request))

if __name__ == "__main__":
    main()
