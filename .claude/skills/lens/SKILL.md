---
name: lens
description: Create, edit, or inspect a lens preset
disable-model-invocation: true
---

Work with GUMP lens presets. $ARGUMENTS specifies the action:

- `/lens list` — show all 10 lenses with their pipeline, mode, and feel
- `/lens inspect <name>` — show full config for a specific lens
- `/lens create <name>` — create a new lens (interactive — ask James for the feel, mode, voices, etc.)
- `/lens edit <name> <field> <value>` — change a specific field in a lens
- `/lens compare <name1> <name2>` — diff two lenses side by side

When creating or editing lenses:
1. Every lens needs ALL config sections: harmony, rhythm, tone, space, palette, response, emotion, motion, weather, pipeline
2. Voice names must match Sound's registry: piano, mono, strings, organ, epiano, bell, pluck, stab, formant, massive, gridstack, unisonWall, upright, fm, glitch
3. Grid/Pulse lenses need an `edm` config block
4. Ascension lenses need an `ascension` config block
5. The lens should feel DISTINCT from existing lenses
6. Reference the four functions: dance (Grid/Pulse), love (Midnight), healing (Cathedral), lullabies (Still Water/Tundra)

Lens file: js/lens.js
