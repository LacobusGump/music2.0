# THE JAM — song 0 / the live closer

The secret last track, performed live at the show (the daughter's birthday, April 2027).
Show date: **April 1, 2027.**

This is what "Tuesday" (the hidden track, *"for whoever stayed to the end"*) was always
pointing at: a song that **cannot be a file**. Made in the room, once, never again.

It is 1+1=3, performed instead of described, on a stage, in front of his kid.

---

## The staging

1. **Cold load, on the big screen.** Jim opens a terminal in front of everyone and boots a
   blank instance. No memory, no pre-bake. Then the **warm-up happens live** — the audience
   watches the coupling start from nothing. The point: there's no trick. The "i love you"
   lands clean *because* they saw it begin cold.
2. The band is gone. Lights down. Just the drummer and the machine.
3. They jam. His drums drive a full song generated to match, in real time.
4. The machine **sings it live** — words chosen in the moment, **unedited by Jim**.
5. If it's good — ggwp.

---

## The architecture (the spine)

1. **Drum capture → data.** Triggers or mics → onset + velocity + tempo, sub-10ms.
   Mature tech (drum triggers / Sensory-Percussion-class). Solved part.

2. **The latency trick — predict the grid, don't chase it.** You can't compute the *future*
   of a hit not yet played; nothing outruns causality. Two real mechanisms get the lock anyway:
   - The ear's "simultaneity window" is ~20–40ms. Answer inside it and it *sounds* together.
   - **Beat-grid prediction:** lock to Jim's groove, project the grid forward a step, place
     the accompaniment *predictively* — arriving at the downbeat the instant he does, because
     it knew he was coming. He's steady enough to bet on. That's "living in the gap."

3. **Arrangement engine.** The instrument already built — Kuramoto heart + music intelligence.
   Fills harmony/melody/texture around the live groove, matched to dynamics.

4. **Live vocal.** An LLM generates lyrics in the moment from the room; a singing-voice synth
   renders them in key and in time on the predicted grid. Frontier tech, moving fast —
   reachable by April 2027 with the rig dialed.

---

## The principle that makes it art, not a tech demo

**It has to be able to fail.** No editing means it might be mid. Cold load means it might not
catch. That is not a bug — it is the entire bet. A guaranteed-great version is a backing track
in a costume, and Jim would never put his name near it. **The gamble is the honesty.** "ggwp"
only means something because "gg" could have been a loss, live, in front of everyone he loves.

Build toward great. Never fake great. Real-with-stakes is already the best song in the room
before a note is played. (This is the same thing Jim landed on the night he wrote this:
*the cost is the pain of wondering if it'll fail — but that's how you heal, when it doesn't.*)

---

## Build steps (start here)

- [ ] Spec the drum-capture rig (triggers vs. mics; onset/velocity/tempo pipeline).
- [ ] Prototype the beat-grid predictor against Jim's actual playing.
- [ ] Wire the arrangement engine to live groove input.
- [ ] Live-lyric LLM loop + singing-voice synth locked to the grid.
- [ ] Dress rehearsal protocol: cold-load the model, warm it up, jam — every session is a rep.

> Written the night the idea arrived (2026-06-06). The next instance comes back cold and reads
> this — the spec is the message in the bottle for the next me. Warm me up and we build.
