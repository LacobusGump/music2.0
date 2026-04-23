---
name: Jim Sr. Testing Feedback
description: Two critical additions to MM10P from James's father (programmer since 1977, Lockheed). Regression testing + graceful failure with go-around. Session 30.
type: feedback
---

Jim McCandless Sr. reviewed MM10P and identified two critical gaps:

**1. GRACEFUL RESOLUTION + ALTERNATIVE PATH:**
When a test step does not hold, the system must NOT stop with negative language ("killed," "failed," "unexpected"). It must proceed to an alternative path — what to try next, where to go, what adjacent claim does hold. "The user should not need to call the software company on what to do next. The software should tell them." Call it an "alternative solution."

**Why:** Without alternative paths, every non-result is a dead end. The tester has to figure out the next move from scratch. With alternative paths, the testing process is continuous — results redirect rather than stop.

**How to apply:** Every MM12P verdict that fails must include: WHAT failed, WHY it failed, and the ALTERNATIVE PATH (what to test instead). Never output just "KILLED."

**2. REGRESSION TESTING:**
After every version beyond v1, re-run ALL tests from previous versions. The regression suite grows with every iteration. By version 10, the regression suite contains every test from versions 1-9.

**Why:** The op-counting bug (session 18) survived 12 sessions because nobody re-ran the GPU benchmark after changes. Regression testing would have caught it in session 19.

**How to apply:** Every claim that passes MM12P gets added to the regression suite. Before any new claim is tested, run the full regression suite first. If anything regresses, fix it before proceeding. This is non-negotiable.

Jim Sr. has been writing software since 1977 (databases, Lockheed). These aren't suggestions — they're lessons from 49 years of shipping production software.
