---
name: Water bottle physics for sensor smoothing
description: James's insight — tilt response should feel like water sloshing in a half-full bottle. Momentum, overshoot, damping. Not a spring that stops — water that sloshes.
type: feedback
---

The water bottle is not just smoothing — it's the ENTIRE motion-to-music response model. Half-full bottle held longways:

**Three regimes from one physics:**
1. **Slow tilt** — water rises evenly on one side. Music responds smoothly, proportionally.
2. **Fast tilt** — water STACKS against the wall, builds pressure. Music accumulates intensity in one direction.
3. **Rapid oscillation** — water crashes chaotically, sloshes wildly. Music goes wild.

**Three signals from one gesture:**
- **Level** (where water is) → pitch position, filter cutoff
- **Velocity** (how fast it flows) → energy, intensity
- **Turbulence** (how chaotic) → tremolo, fills, distortion, wildness

**The walls = musical limits.** Water pressed against the wall = tension building, filter at extreme, about to break. The edges of the screen should reflect this — the "splash" against the boundary.

**Why:** Lerp (value += (target - value) * rate) has no momentum, no accumulation, no chaos. It slides and stops. Dead. Water has mass — it overshoots, stacks, crashes. That's what makes movement feel like dancing.

**How to apply:**
- Replace ALL tilt-to-pitch and tilt-to-filter mappings with fluid dynamics
- `velocity += tilt * gravity * dt; velocity *= damping; level += velocity * dt`
- Wall collisions bounce/reflect energy
- Different parameters get different viscosity: pitch = responsive, filter = more slosh, intensity = momentum carries
- Turbulence (abs velocity) drives chaotic musical events (tremolo, drum fills)
- Replaces the 5 competing filter modulators in Ascension with ONE physics model
- Replaces the linear beta → degree mapping in Journey with fluid pitch
