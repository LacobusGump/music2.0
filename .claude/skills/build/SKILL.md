---
name: build
description: Build or rebuild a specific v2 module from the architecture spec
disable-model-invocation: true
---

Build or rebuild a GUMP v2 module. $ARGUMENTS specifies which module (e.g., "sound", "flow", "lens").

Steps:
1. Read the v2 architecture at `.gump/v2_architecture.md` — focus on the section for the requested module.
2. Read the current version of the module file to understand what exists.
3. If rebuilding from scratch, read the v1 predecessor (brain.js → body.js, audio.js → sound.js, follow.js → flow.js) for synthesis/logic to port.
4. Write the module following these standards:
   - Global namespace: `const ModuleName = (function() { ... })();`
   - Expose as `window.ModuleName`
   - Every public function wrapped in try/catch
   - Every design decision traceable to published research
   - No clocks make musical decisions
   - Data flows DOWN only
   - Clean, readable code
5. Run syntax check.
6. Report what was built, line count, and key APIs.

Reference the guiding principles in CLAUDE.md and .gump/v2_architecture.md for every decision.
