---
name: CPC Radiative Harvester
description: Compound Parabolic Concentrator for nighttime energy harvesting. Geometry concentrates cold sky view. Wall material is critical. Needs prior art search + physics validation before any build.
type: project
---

## CPC Radiative Harvester — Session 30 State

### THE IDEA
Use a Compound Parabolic Concentrator (Winston 1974) to geometrically concentrate the cold sky view onto a small base with TEG modules. The shape increases ΔT by eliminating warm-surroundings view factor. Same sky, same TEG, more power through geometry alone.

### WHAT THE MODEL SAYS (unverified)
- Aluminum CPC walls: ΔT=24°C (wall conduction kills benefit — 15W leak vs 5W cooling)
- Aluminized foam CPC: ΔT=82°C (modeled — likely too optimistic, needs verification)
- Published cavity-enhanced radiative cooling: 42°C ΔT (Chen 2016)
- Flat panel baseline: 11-23°C ΔT

### CRITICAL OPEN QUESTIONS (must answer before building)
1. **Prior art**: Who has tried CPC + radiative cooling + TEG? Must search literature thoroughly.
2. **Wall conduction model**: Is our lumped-parameter wall conduction correct? Need 1D heat transfer along CPC wall profile, not just linear gradient.
3. **Natural convection inside CPC**: We assumed stratified (cold sinks, stays at base). Is this true for a 1.3m tall enclosure? Rayleigh number determines if convection cells form.
4. **Aluminized foam IR properties**: What is the ACTUAL emissivity of aluminized Mylar at 8-13µm? We assumed 0.05. Could be higher for thin aluminum coating.
5. **Sky effective temperature model**: We used T_sky=60K for θ<30°. This depends on water vapor column, aerosol, altitude. Need local atmospheric model.
6. **Frost/condensation**: At ΔT>20°C, dew forms. At ΔT>30°C, frost. Sealed unit with desiccant needed but adds cost and complexity.
7. **TEG thermal resistance coupling**: TEG pulls heat through itself — this REDUCES ΔT at the emitter surface. The TEG-emitter thermal coupling needs careful modeling.
8. **Edge effects**: CPC theory assumes infinite 2D. Real 3D CPC has edge losses. How much?
9. **Étendue conservation**: Does concentrating the cold view actually help, or does thermodynamics prevent net benefit? Need to check against Kirchhoff's law carefully.

### THE EXPERIMENT (when ready, not now)
Side-by-side: flat panel vs CPC, same sky, same night.
Log: emitter temp, hot-side temp, sky temp/humidity, wind, OCV, loaded power.
Advisor approved this approach.
Cost: ~$350 for both builds.

### WHAT TO DO NEXT SESSION
1. Literature search: CPC radiative cooling, cavity-enhanced radiative cooling, nighttime thermoelectric generation, concentrated radiative cooling
2. Verify the wall conduction model against published thermal analyses of CPCs
3. Check étendue/Kirchhoff constraint — does geometric concentration actually help for diffuse thermal radiation?
4. Find the REAL emissivity of aluminized Mylar at 8-13µm (published data exists)
5. Model natural convection inside the CPC (Rayleigh number analysis)
6. Build a proper 1D thermal model of the CPC wall + base + TEG system
7. Compare against ALL published nighttime thermoelectric results
8. MM12P the corrected model

### FILES
- `gforce/spark_cad.py` — v2 simulator (Pareto sweep, optimal module count)
- `gforce/radiative_harvest.py` — flat panel analysis
- `gforce/pyramid.py` — pyramid as concentrator (related geometry)
- `Desktop/cpc_blueprint.html` — 1920s blueprint visualization
