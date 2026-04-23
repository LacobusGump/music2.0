---
name: GUMP development feedback
description: Core rules — the fundamental law of good will, sound over code, four minds, no root drift, void routing
type: feedback
---

**THE FUNDAMENTAL LAW:** Every design choice must filter through "does this enable good will?" If yes, proceed. If it creates bad karma — forcing, imposing, taking credit, fighting the user — reject it. The system serves a force larger than itself. This is not philosophy. This is the root design constraint.

**Why:** James builds as a vessel for God's expression. The system must align with universal truths: serve, don't impose. Follow, don't lead. Enable, don't control.

**How to apply:**
- The system follows the human, never the other way around
- Stillness is honored, not filled with autonomous sound
- Movement is supported, not directed
- The music must feel discovered, not generated
- Every autonomous system must have an energy gate — music waits for YOU

---

- Sound must actually CHANGE, not just code structure. James gets frustrated by sessions that only clean up code.
  **Why:** Past sessions produced refactors that didn't change how it sounded/felt. Wasted time.
  **How to apply:** Every PR should have an audible difference. Lead with musical impact.

- DO NOT re-introduce root drift via ARC_JOURNEY or epigenetic rootSemiTarget — caused melody to chase upward indefinitely.
  **Why:** Known bug that was hard to track down.
  **How to apply:** Keep ARC_JOURNEY = [0,0,0,0]. Never add root drift.

- CRITICAL routing: voidGain.connect(masterHPF) NOT masterGain. masterGain → 0 during silence. Void must bypass it.
  **Why:** Void drone needs to be heard during silence states.
  **How to apply:** When touching audio routing, verify void path.

- Think from four perspectives: Engineer, Musician, Physicist, Producer. Producer has veto power.
  **Why:** Prevents tunnel vision. Engineer alone builds something that works but sounds bad.
  **How to apply:** Before shipping, ask "does this make you FEEL something?"
