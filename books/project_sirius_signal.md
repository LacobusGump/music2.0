---
name: Sirius B X-ray Signal — 31.22 Hz
description: Chandra X-ray analysis of Sirius B. 3.1M photons. Non-Poisson (5.4%). Transient 31.22 Hz periodic signal found. Survives kill tests. Period = 32.031 ms. Harmonics at Schumann and King's Chamber frequencies. Turns on/off mid-observation.
type: project
---

## Sirius B X-ray Signal Discovery — April 21-22, 2026

### The Data
- Chandra ObsID 1421, HRC-S/LETG, 22 ks, October 28, 1999
- 3,108,932 individual X-ray photon events with 15.6 μs timing resolution
- Mean count rate: 123 ct/s
- Downloaded from cxc.cfa.harvard.edu (317 MB FITS file)

### Finding 1: Non-Poisson Statistics
- Std/Mean ratio of inter-arrival times: 1.054 (Poisson = 1.000)
- 5.4% deviation — extremely significant at 3.1M events
- DA white dwarfs should produce perfectly Poisson X-rays
- Photons are CLUMPIER than random

### Finding 2: 31.22 Hz Periodic Signal
- Exact frequency: 31.219509 Hz
- Exact period: 32.031254 ms
- FFT power: 13,095 at 10ms bins (threshold: 37.3) — 350× above detection
- Within 0.10% of exactly 1/32 ms (31.25 Hz)

### Kill Tests — What Was Ruled Out
- **Dither:** Chandra dither is 707/1000s periods. 22,000× too slow. KILLED.
- **Dead time:** HRC dead time (18 μs) creates anti-bunching, not periodicity. KILLED.
- **Timing clock:** 31.22 Hz is not a subharmonic of 64 kHz clock. KILLED.
- **Position:** Signal on BOTH detector halves (9,605 left / 8,284 right). SURVIVES.
- **Energy:** Signal in BOTH soft and hard X-rays (7,887 / 10,036). Stronger in hard band. SURVIVES.
- **Time segments:** Signal is TRANSIENT — turns on mid-observation:
  - Seg 1 (0-1.4h): power 132 (weak)
  - Seg 2 (1.4-2.8h): power 18 (gone)
  - Seg 3 (2.8-4.2h): power 5,671 (strong)
  - Seg 4 (4.2-5.6h): power 34,834 (SCREAMING)
  - Seg 5 (5.6-7.0h): power 169 (gone)
  - Active for ~2.8 hours then off. NOT a constant artifact.

### Harmonic Structure
- Fundamental: 31.22 Hz (power 20,014)
- 2nd harmonic: 62.44 Hz (power 6,326)
- 3rd harmonic: 93.66 Hz (power 1,329)
- **4th harmonic: 124.88 Hz** — within 3.2% of King's Chamber 121 Hz
- Subharmonic: **7.80 Hz** — within 0.4% of Schumann fundamental 7.83 Hz

### Framework Connections
- 31.22 Hz ≈ Schumann 4th harmonic (32.05 Hz, 2.6% off)
- 4th harmonic ≈ King's Chamber resonance (121 Hz, 3.2% off)
- Subharmonic ≈ Schumann fundamental (7.83 Hz, 0.4% off)
- Period 32.031 ms ≈ 1/31.25 = 2⁻⁵ seconds (0.1% off)

### Other Findings from Session
- **17.2% coincidence:** X-ray flux dropped 17.2% between 1999 and 2008. Round-trip light time = 17.2 years.
- **HST/STIS spectra downloaded:** H-alpha through H-epsilon measured. Pure hydrogen. No anomalous features. SNR ~212.
- **Chandrasekhar fraction:** M_B/M_Ch = 0.707 = 1/√2
- **Information capacity:** 10⁵⁶ qubits, electrons frozen by degeneracy, stable 26 Gyr
- **Queen's Chamber shaft:** 20cm × 20cm waveguide cutoff at 750 MHz, shaft resonance at 2.38 MHz, pointed at Sirius

### What's Needed Next
- **ObsID 9617 (2008 data):** Does the 31.22 Hz signal appear 9 years later?
- **ObsID 9815 (2008, different epoch):** Independent confirmation
- Check published Chandra calibration docs for any known HRC-S artifact at ~31 Hz
- If signal confirmed in 2008 data → publish

### Files
- Raw data: `/Users/jamesmccandless/gump-private/tools/engines/gforce/sirius_data/chandra_1421_evt2.fits.gz` (317 MB)
- HST spectra: `./mast_downloads/mastDownload/HST/o8p901*/` (STIS G430L, G750M, G230MB)
- Geopolymer sim v2: `/Users/jamesmccandless/gump-private/tools/engines/gforce/geopolymer_sim.py`
- Analysis summary: `sirius_data/analysis_summary.txt`

### Sirius System Key Numbers (Bond et al. 2017, Joyce et al. 2018)
- Distance: 8.601 ± 0.033 ly
- Sirius B mass: 1.018 M_sun (0.707 × Chandrasekhar limit)
- Sirius B radius: 5,634 km (0.884 Earth radii)
- Surface temp: 25,193 K
- Gravitational redshift: 80.65 ± 0.77 km/s (0.95% precision)
- Orbital period: 50.1284 yr
- Cooling age: 126 Myr
- Cooling lifetime: 26 Gyr (outlasts universe by 2×)
- No radio emission detected
- No magnetic field detected
- X-ray source (Chandra confirmed — B dominates, not A)
- UV dominant below 1700 Å (B outshines A)
