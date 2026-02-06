# Current State

*Last updated: February 6, 2026*

---

## GUMP v31-RADIOHEAD - Clean Slate

**The Reset:** Stripped back to essentials. Dreamy strings + Purdie shuffle 808s. Touch to play, tilt for expression. No more competing systems.

---

## WHAT'S NEW (February 6 - v31-RADIOHEAD)

### Complete Conductor Rewrite

Replaced 525 lines of complex articulation/zone logic with 212 lines of focused code:

**What We Kept:**
- Dreamy strings with detuned oscillators (lo-fi warmth)
- Purdie shuffle 808s with ghost notes
- iOS tilt permission (fixed: request BEFORE preventDefault)
- Energy-based groove triggering
- Touch/mouse input

**What We Removed:**
- Complex zone-based articulation
- Multi-layer system (melody, pad, bass, drums as separate concerns)
- Verbose pattern definitions
- Everything that made it "boxed and not intuitive"

### All Old Systems Disabled

Commented out in index.html:
- `js/audio/drums.js, bass.js, harmony.js, melody.js` (old audio)
- `js/agents/conductor.js, drum-mind.js, etc.` (AI musicians)
- `js/ai/musical-worlds.js` (BWAAAM, world transitions)
- `js/journey/strings.js, groove.js, etc.` (old journey files)

Only active: `js/journey/conductor.js` (the new simplified one)

---

## HOW IT WORKS NOW

```
Touch Screen → Play Note (position = pitch/octave)
              → Build Energy
              → Energy > 30% triggers groove

Groove = 16-step Purdie shuffle:
  - Kick: 1, 7(soft), 9
  - Snare: 5, 13 + ghost notes (3,7,11,15)
  - Hats: Every step with velocity variation
  - Swing: 18% on offbeats

Tilt (when granted):
  - Gamma → tiltX (-1 to 1)
  - Beta → tiltY (centered at 45°)
  - Used for filter cutoff modulation
```

---

## FILES

| File | Status |
|------|--------|
| `js/journey/conductor.js` | **ACTIVE** - The one true sound source |
| `js/main.js` | Active - Bootstrap only, no sound generation |
| `js/audio/engine.js` | Active - Provides AudioContext |
| All other audio/agent/ai | **DISABLED** (commented out) |

---

## iOS TILT FIX

The key fix for iOS tilt permission:

```javascript
async function onTouch(e) {
    // iOS tilt permission - MUST be first thing, BEFORE preventDefault
    if (!state.tiltGranted && typeof DeviceOrientationEvent !== 'undefined') {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const p = await DeviceOrientationEvent.requestPermission();
                if (p === 'granted') {
                    state.tiltGranted = true;
                    window.addEventListener('deviceorientation', onTilt);
                    showMsg('TILT ON');
                }
            } catch(err) {
                console.log('Tilt denied');
            }
        }
    }
    e.preventDefault();  // Only AFTER permission request
    // ... rest of touch handling
}
```

---

## SUCCESS CRITERIA

- [x] No more harp sounds from old system
- [x] No more BWAAAM from musical worlds
- [x] Touch plays notes instantly (no delay)
- [x] Groove triggers when energy builds
- [x] iOS tilt permission popup appears
- [ ] Tilt actually modulates sound (needs testing)
- [ ] Music feels "Radiohead" - dreamy, lo-fi, emotional

---

## NEXT STEPS

1. **Test on iOS** - Verify tilt permission and sound
2. **Add diversity** - Current sounds are samey, need evolution
3. **Add journey arc** - Innocence → Ambition → Hardships → Prevail
4. **Refine groove** - Maybe add variation based on touch patterns

---

*"Less is more. Start with silence. Let the music emerge."*

**Live at:** lacobusgump.github.io/music2.0/
