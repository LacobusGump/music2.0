---
name: test
description: Syntax check all v2 modules and report any failures
disable-model-invocation: true
---

Run `node -c` on all 10 GUMP v2 modules and report results:

```
js/sensor.js, js/body.js, js/harmony.js, js/rhythm.js,
js/sound.js, js/flow.js, js/weather.js, js/identity.js,
js/lens.js, js/app.js
```

Also check:
1. All 10 files exist and report line counts
2. index.html script tags reference the correct v2 modules
3. BUILD number in index.html matches expectations

Report a clear pass/fail table.
