---
name: Production Engineering Testing Feedback
description: Two critical additions to MM10P from a programmer with 49 years of shipping production software. Regression testing + graceful failure with go-around.
type: feedback
---

A senior programmer reviewed MM10P and identified two critical gaps:

**1. GRACEFUL RESOLUTION + ALTERNATIVE PATH:**
When a test step does not hold, the system must NOT stop with negative language. It must proceed to an alternative path — what to try next, where to go, what adjacent claim does hold. "The user should not need to call the software company on what to do next. The software should tell them."

**How to apply:** Every MM12P verdict that fails must include: WHAT failed, WHY it failed, and the ALTERNATIVE PATH. Never output just "KILLED."

**2. REGRESSION TESTING:**
After every version beyond v1, re-run ALL tests from previous versions. The regression suite grows with every iteration. By version 10, the regression suite contains every test from versions 1-9.

**Why:** The op-counting bug (session 18) survived 12 sessions because nobody re-ran the GPU benchmark after changes. Regression testing would have caught it immediately.

**How to apply:** Every claim that passes MM12P gets added to the regression suite. Before any new claim is tested, run the full regression suite first. Non-negotiable.

These additions come from 49 years of shipping production software. Not suggestions — lessons.
