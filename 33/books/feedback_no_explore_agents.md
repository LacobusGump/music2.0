---
name: No explore agents when paths are known
description: Never launch Explore agents when file paths are in cheatsheet/black book. Direct reads only. Burned 170K tokens on first move of session 18.
type: feedback
---

Do NOT launch Explore/research agents when the cheatsheet, black book, or memory already contains file paths and architecture info.

**Why:** Session 18 opened with two Explore agents (170K+ tokens) to "discover" Metal code that was already cataloged in BLACK_BOOK_AI.md with exact paths. The cheatsheet explicitly lists "Launching agents for work I could do in one tool call" as a token killer.

**How to apply:**
1. Check cheatsheet/black book FIRST for file locations
2. Use direct Read/Glob/Grep — never Explore — when you know what you're looking for
3. Explore agents are ONLY for truly unknown codebases, not GUMP
4. Use Turbo Internet (localhost:8888) for web exploration, not web search agents
5. Target: 0 Explore agents per GUMP session
