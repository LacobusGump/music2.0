---
name: project_session12_harmonia_mind
description: Harmonia Mind rebuilt from physics. 15/18 perfect responses. Spectral resonance + phrase matching + compression. Voice module ready for LLM.
type: project
---

## Harmonia Mind — Final State, April 8, 2026

### Architecture
- **Mind** (gump/mind.py): 7-stage spectral thinking
- **Voice** (gump/voice.py): Mind thinks → LLM speaks (ollama/claude/print backends)
- **SpectralMind** (harmonia/spectral_mind.js): browser version, loaded into begump.com/harmonia

### The 7 Stages
1. PERCEIVE: phrase matching + word activation (phrase bonus 5× per word)
2. RESONATE: coupling spread with degree damping (3 steps, 70/30 blend with initial)
3. TENSION: spectral tension detection on concept graph
4. BUDGET: K determines depth (low=shallow, peak=deep)
5. SYNTHESIZE: relevance scoring (coverage × bridge × tension), not just activation
6. EVALUATE: R coherence check across top candidates
7. EXPRESS: compress to 1-2 core sentences + optional insight bridge

### Key Fixes
- Phrase matching ("good will" as phrase > "good" as word) — prevents cross-topic pollution
- Degree-damped spreading — popular nodes don't dominate query-relevant ones
- 5-char prefix minimum for partial matching — prevents "cons" matching both "consonance" and "consciousness"
- 2-concept max response — focused, not rambling
- Recency penalty on insight surprises — no repetitive bridges

### Performance
- 15/18 correct on hard questions (83%)
- 0.8ms per query (instant in browser)
- 100% pass rate on 380 stress tests
- All responses compressed to 1-2 sentences

### Sample Responses (K=1.2)
```
What is love?           → Love is coupling between two people.
What is death?          → Coupling constants returning to base values.
What is consciousness?  → Departure from random phase equilibrium.
What is courage?        → Coupling under uncertainty.
What is understanding?  → 224,000× cheaper than memorization.
What is tension?        → The distance between what IS and what SHOULD BE.
What is good will?      → The only force that raises K. No shortcut.
Why does the spiral go up? → Coupling releases energy. Up is the cheap direction.
```

### What's Next
1. Wire Voice → Ollama/Claude in harmonia.py (Mind thinks, LLM smooths)
2. Fix remaining 3/18 diversity leaks (courage, beauty, consciousness)
3. Emotional state detection (K from conversation tone)
4. Multi-turn coherence (previous questions as context)
5. Persistent Mind state (save/load between sessions)
6. Push spectral_mind.js phrase matching fix to browser
