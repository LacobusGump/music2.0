---
name: Suno strategy for GUMP
description: Use Suno as upstream production tool — generate stems/loops/one-shots, feed into GUMP's real-time engine. No official API exists; use manually or explore MusicGen/ElevenLabs Music for programmatic access.
type: project
---

Suno = best AI music generator but no official API. Batch only (20-30s per generation). Cannot replace real-time engine.

**Strategy:** Use Suno upstream to create raw material (stems, loops, one-shots) that GUMP's engine morphs in real-time via motion. Manual workflow: generate on suno.com → download stems → drop into GUMP.

**Alternatives with APIs:** Meta MusicGen (open source), Mubert (commercial API), ElevenLabs Music (already using ElevenLabs for voice).

**Why:** James's collaborator recommended Suno. James agrees it's advantageous. Enriches GUMP's sonic palette beyond pure synthesis.

**How to apply:** Build a sample loader into audio.js so GUMP can play pre-generated audio (from any source) alongside synth engine. Motion controls sample playback. Each lens can define its own sample palette.
