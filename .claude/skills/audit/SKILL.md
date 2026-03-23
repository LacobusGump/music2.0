---
name: audit
description: Cross-module API audit — find mismatches, principle violations, dead code
disable-model-invocation: true
---

Audit the GUMP v2 codebase. If $ARGUMENTS specifies a module (e.g., "flow" or "sound"), focus on that module. Otherwise audit all.

Check for:

1. **API mismatches** — every cross-module call (Body.*, Harmony.*, Rhythm.*, Sound.*, Weather.*, Identity.*) must match the target module's actual API. Check function names, argument counts, return types.

2. **Principle violations:**
   - Data flows DOWN (sensor → body → harmony/rhythm/weather → flow → sound). No module reaches up.
   - No clocks make musical decisions (no setInterval/setTimeout triggering notes). Body drives everything.
   - Enable outcomes, don't make choices (body reports facts, harmony provides grammar, sound executes commands, only flow decides).
   - Stillness is honored (nothing plays during stillness except void drone).

3. **Dead code** — functions defined but never called, config fields defined but never read.

4. **Memory leaks** — arrays that grow unbounded without caps.

Report findings grouped by severity: CRITICAL > HIGH > MEDIUM > LOW.
