# GUMP Roadmap: Static → Dynamic

## Phase 1: RESPONSIVE (Current)
**Goal**: Music that reacts to you

### Must Work
- [ ] Touch a zone → sound plays immediately (<15ms)
- [ ] Release touch → sound fades gracefully (100-200ms)
- [ ] Change zones → previous sounds fade, new sounds begin
- [ ] Stop touching → music winds down to silence (3-5s)

### Key Metrics
- Audio latency: <15ms
- Gesture-to-sound: <30ms
- Active voices: <12 at any time
- Memory usage: <100MB

### Assigned
- eng-1: Voice manager, latency
- eng-3: iOS audio unlock, touch handling
- front-1: Zone feedback visuals

---

## Phase 2: EXPRESSIVE
**Goal**: Music that understands your intent

### Must Work
- [ ] Soft touch → soft sound
- [ ] Fast gesture → energetic response
- [ ] Slow gesture → ambient response
- [ ] Shake → chaos/intensity
- [ ] Stillness → space/ambient

### Key Metrics
- Gesture recognition accuracy: >80%
- Expression mapping feels natural (user testing)
- No false positives on gesture detection

### Assigned
- eng-2: Gesture classification
- music-1: Mapping gestures to musical responses
- prod-1: Is expression feeling honest?

---

## Phase 3: LEARNING
**Goal**: Music that remembers you

### Must Work
- [ ] Play a phrase → system records it
- [ ] System responds with variation (echo, invert, harmonize)
- [ ] Phrases persist across sessions
- [ ] "Call and response" feels like conversation

### Key Metrics
- Phrase detection accuracy: >90%
- Response feels musical (not random)
- Library grows meaningfully over sessions

### Assigned
- eng-2: Phrase detection, Magenta integration
- music-1: Musical transformations (invert, retrograde, augment)
- prod-2: Is it creating, or just reacting?

---

## Phase 4: COMPOSING
**Goal**: Music that creates with you

### Must Work
- [ ] System suggests next phrase based on context
- [ ] Long-form structure emerges (intro → build → climax → resolution)
- [ ] System develops motifs over time
- [ ] Multiple "movements" or "scenes" possible

### Key Metrics
- Compositions feel like they "go somewhere"
- User feels like co-creator, not just trigger
- 3+ minute coherent pieces possible

### Assigned
- prod-3: Musical form, arrangement
- eng-2: Long-term memory, compositional AI
- music-3: Rhythmic development

---

## Phase 5: EVOLVING
**Goal**: Music that grows

### Must Work
- [ ] System learns user preferences over time
- [ ] New sounds/patterns unlock based on usage
- [ ] System can surprise user with novel ideas
- [ ] Each user's GUMP becomes unique

### Key Metrics
- No two users have same experience after 1 week
- Users report "it knows me"
- Surprises feel delightful, not random

### Assigned
- eng-2: User modeling, preference learning
- prod-2: Generative systems
- prod-1: Is it still honest? Still has soul?

---

## Current Sprint

### This Week's Focus
1. **Stop the droning** - When I stop touching, music stops
2. **Punch the drums** - Kicks hit, snares crack
3. **iOS stability** - No audio dropouts on iPhone

### Blockers
- iOS Safari cache aggressively caches old versions
- Voice manager may not be receiving gesture events
- Conductor update rate may still be too slow

### Next Session's First Task
Debug why v19 changes aren't visible. Check:
1. Are gesture events firing?
2. Is voice manager receiving them?
3. Is conductor responding?

---

## Success Definition

**We've succeeded when:**

A non-musician picks up GUMP, moves for 5 minutes, and:
1. Creates something they're proud of
2. Feels like they made music, not triggered samples
3. Wants to do it again

That's dynamic music.
