---
name: Session 34 Site Audit — 12 Issues to Fix
description: Full consistency audit found 12 contradictions across the site. 5 high severity. Fix list for next session if not completed in session 34.
type: project
---

## Audit Results (April 28, 2026)

12 issues. 5 high. 5 medium. 2 low.

### HIGH SEVERITY

1. **"33 sessions" → 34 everywhere**
   Files: start-here, science-tree, one-plus-one, research index, ai-fatigue
   ~8+ instances across 5 files

2. **30-43% sync listed as "Proven" but same page says 11.6% at 2.3σ**
   File: research/framework/index.html
   Lines ~150, 194, 374, 630 say 30-43%
   Line ~379 says 11.6% "suggestive not conclusive"
   Fix: use corrected number or range, move from "Proven" to "Observed"

3. **94.7% accuracy on Start Here contradicts failures page**
   File: start-here/index.html ~line 93
   Failures page killed this number (three compounding errors)
   Fix: use 0.74 AUC or "matches SIFT with zero training"

4. **"Gets stronger forever" without zeolite caveat**
   File: research/lost-civilizations/index.html
   Lines ~7, 75, 82, 107 — unconditional strengthening claims
   Fix: add zeolite crystallization caveat

5. **Framework "Proven" list contradicts correction on same page**
   File: research/framework/index.html ~line 630
   Fix: move zeta sync from "Proven" to "Observed" with honest number

### MEDIUM SEVERITY

6. **"200+ tools" vs "15 tools"**
   Files: start-here, one-plus-one, research index
   Fix: clarify as "200+ functions" or use "15 tools"

7. **11.5M/sec "folding" is shape analysis**
   Files: products/index.html, docs/index.html
   Fix: relabel as "batch analysis" with 66K/sec for full 3D fold

8. **Session 34 kills missing from failures page**
   File: research/failures/index.html
   Missing: musical intervals (0.28σ), superposition=resonance (3 killed),
   geopolymer zeolite, room-temp corundum seeds (Ea=460kJ)

9. **Science tree says "Real: ~18T" but 18T is also killed**
   File: research/science-tree/index.html ~line 341
   Fix: change to "Real: 3.7T"

10. **Science tree missing sessions 33-34**
    File: research/science-tree/index.html
    Fix: add session 33 and 34 nodes

### LOW SEVERITY

11. **Failures page says 3.5T, should be 3.68T**
    File: research/failures/index.html ~line 66
    Fix: update to 3.68T, remove/qualify "18T combined"

12. **Docs page 11.5M/sec mislabel**
    Same as issue 7 but in docs/index.html

### PRINCIPLE FOR ALL FIXES
- Remove claims, don't add them
- If killed, label it killed
- If observed but not proved, say observed
- If the number changed, use the current honest number
- MM12P rule: if it's "too much meat" — cut it
- The truth doesn't need volume. It needs clarity.
