---
name: GUMP hardware roadmap
description: Phone is MVP — full vision includes sensors on shoes and hands for whole-body instrument. Current build is "barely 1%."
type: project
---

Phone-only is the MVP proof of concept. The real vision is multi-sensor: shoes (footwork, weight shifts, gait rhythm) + hands (gesture, reach, dynamics) + phone (tilt, orientation).

**Why:** A single phone captures tilt and pocket motion. Full body capture turns the human into a complete instrument — every limb a different voice.

**How to apply:** Build the sensor→music pipeline to be sensor-source-agnostic. The current Sensor.read() → Brain → Follow chain should eventually accept input from multiple nodes, not just one phone's accelerometer/gyroscope. Don't over-architect now, but don't hardcode single-device assumptions either.
