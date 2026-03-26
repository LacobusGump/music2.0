/**
 * WEATHER — Climate-Prosody Mappings (v2)
 *
 * Takes weather data from sensor.js and produces adjustments to harmonic
 * and timbral parameters. Proven science only — no "rain = sad" metaphors.
 *
 * Research basis:
 *   Temperature → interval width (Wang & Wichmann 2023, PNAS Nexus, 9179 languages)
 *   Humidity → filter openness (Everett 2015, PNAS, 3750+ languages)
 *   Rain → legato articulation (Schafer 1977, acoustic ecology)
 *   Altitude → phrase length (physiological inference — thinner air, shorter breath)
 *
 * NOT implemented (no evidence):
 *   Warm = major keys, temperature = tempo, rain = sadness, season = mode
 *
 * All adjustments are MULTIPLICATIVE, centered at 1.0. The lens sets the base.
 * Weather modifies it. The user's tilt makes the final choice. No one ever
 * hears "the weather chose this note."
 */

var Weather = (function () {

  // ── HELPERS ──────────────────────────────────────────────────────────────

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // ── PROSODIC DNA REGIONS ─────────────────────────────────────────────────
  // From prosodic_dna_map.md — GPS Music lookup table.
  // Each entry: center lat/lon, radius (degrees), scale, rhythm type.
  // Scales expressed as semitone offsets from root.

  var REGIONS = [
    // AFRICA
    { name: 'West Africa',        lat:   9.0, lon:   -2.0, r: 12,
      scale: [0, 3, 5, 7, 10],                             // anhemitonic pentatonic
      rhythm: 'syllable-timed' },
    { name: 'East Africa',        lat:   1.0, lon:   37.0, r: 12,
      scale: [0, 2, 3, 5, 7, 9, 10],                       // pentatonic modal (dorian flavor)
      rhythm: 'syllable-timed' },
    // MIDDLE EAST / NORTH AFRICA
    { name: 'North Africa',       lat:  30.0, lon:   10.0, r: 10,
      scale: [0, 1, 4, 5, 7, 8, 10],                       // maqam Hijaz approximation
      rhythm: 'stress-timed' },
    { name: 'Middle East',        lat:  33.0, lon:   44.0, r: 10,
      scale: [0, 1, 4, 5, 7, 8, 10],                       // maqam Hijaz
      rhythm: 'stress-timed' },
    { name: 'Persia',             lat:  32.5, lon:   53.0, r:  8,
      scale: [0, 1, 4, 5, 7, 8, 11],                       // dastgah Shur approximation
      rhythm: 'stress-timed' },
    { name: 'Turkey',             lat:  39.0, lon:   35.0, r:  6,
      scale: [0, 1, 4, 5, 7, 8, 10],                       // makam approximation
      rhythm: 'stress-timed' },
    // SOUTH ASIA
    { name: 'South Asia',         lat:  22.0, lon:   78.0, r: 14,
      scale: [0, 2, 4, 5, 7, 9, 11],                       // raga Bilawal (Ionian) base
      rhythm: 'syllable-timed' },
    // EAST ASIA
    { name: 'China',              lat:  35.0, lon:  105.0, r: 16,
      scale: [0, 2, 4, 7, 9],                              // gong pentatonic
      rhythm: 'syllable-timed' },
    { name: 'Japan',              lat:  36.0, lon:  138.0, r:  7,
      scale: [0, 1, 5, 7, 8],                              // in scale (Miyako-bushi)
      rhythm: 'mora-timed' },
    { name: 'Korea',              lat:  36.5, lon:  128.0, r:  5,
      scale: [0, 2, 5, 7, 9],                              // Korean pentatonic
      rhythm: 'syllable-timed' },
    // SOUTHEAST ASIA
    { name: 'Thailand',           lat:  15.0, lon:  101.0, r:  6,
      scale: [0, 2, 3, 5, 7, 9, 10],                       // 7-equidistant approximation
      rhythm: 'syllable-timed' },
    { name: 'Java',               lat:  -7.5, lon:  110.0, r:  5,
      scale: [0, 2, 5, 7, 10],                             // slendro approximation
      rhythm: 'syllable-timed' },
    { name: 'Vietnam',            lat:  16.0, lon:  107.0, r:  5,
      scale: [0, 2, 4, 7, 9],                              // pentatonic (Chinese influence)
      rhythm: 'syllable-timed' },
    // PACIFIC
    { name: 'Pacific Islands',    lat: -15.0, lon: -170.0, r: 25,
      scale: [0, 2, 4],                                    // narrow chant (2-4 pitches)
      rhythm: 'syllable-timed' },
    { name: 'Hawaii',             lat:  20.0, lon: -156.0, r:  5,
      scale: [0, 2, 4],                                    // narrow chant
      rhythm: 'syllable-timed' },
    // NORTHERN EUROPE
    { name: 'Scandinavia',        lat:  62.0, lon:   15.0, r:  8,
      scale: [0, 2, 3, 5, 7, 9, 10],                       // dorian
      rhythm: 'stress-timed' },
    { name: 'Finland',            lat:  63.0, lon:   26.0, r:  5,
      scale: [0, 2, 3, 5, 7],                              // pentachord
      rhythm: 'stress-timed' },
    // WESTERN EUROPE
    { name: 'British Isles',      lat:  53.5, lon:   -2.0, r:  5,
      scale: [0, 2, 4, 5, 7, 9, 11],                       // major/Ionian
      rhythm: 'stress-timed' },
    { name: 'Ireland',            lat:  53.5, lon:   -8.0, r:  4,
      scale: [0, 2, 3, 5, 7, 9, 10],                       // dorian/mixolydian
      rhythm: 'stress-timed' },
    { name: 'France',             lat:  46.5, lon:    2.5, r:  5,
      scale: [0, 2, 4, 5, 7, 9, 11],                       // major
      rhythm: 'syllable-timed' },
    { name: 'Germany',            lat:  51.0, lon:   10.0, r:  5,
      scale: [0, 2, 4, 5, 7, 9, 11],                       // major
      rhythm: 'stress-timed' },
    // SOUTHERN EUROPE
    { name: 'Italy',              lat:  42.0, lon:   12.5, r:  5,
      scale: [0, 2, 4, 5, 7, 9, 11],                       // major (bel canto)
      rhythm: 'syllable-timed' },
    { name: 'Spain',              lat:  40.0, lon:   -3.5, r:  5,
      scale: [0, 1, 4, 5, 7, 8, 10],                       // phrygian dominant
      rhythm: 'syllable-timed' },
    { name: 'Portugal',           lat:  39.5, lon:   -8.0, r:  3,
      scale: [0, 2, 3, 5, 7, 8, 11],                       // harmonic minor (fado)
      rhythm: 'stress-timed' },
    { name: 'Greece',             lat:  39.0, lon:   22.0, r:  4,
      scale: [0, 1, 4, 5, 7, 8, 10],                       // dromoi / maqam influence
      rhythm: 'stress-timed' },
    // EASTERN EUROPE
    { name: 'Russia',             lat:  56.0, lon:   40.0, r: 14,
      scale: [0, 2, 3, 5, 7, 8, 10],                       // aeolian
      rhythm: 'stress-timed' },
    { name: 'Poland',             lat:  52.0, lon:   19.5, r:  4,
      scale: [0, 2, 4, 5, 7, 9, 11],                       // major/modal
      rhythm: 'syllable-timed' },
    { name: 'Hungary',            lat:  47.0, lon:   19.5, r:  3,
      scale: [0, 2, 5, 7, 9],                              // pentatonic
      rhythm: 'stress-timed' },
    // CELTIC
    { name: 'Scotland',           lat:  57.0, lon:   -4.0, r:  3,
      scale: [0, 2, 3, 5, 7, 9, 10],                       // dorian/mixolydian
      rhythm: 'stress-timed' },
    // AMERICAS
    { name: 'Appalachia',         lat:  37.0, lon:  -81.0, r:  5,
      scale: [0, 2, 4, 7, 9],                              // major pentatonic
      rhythm: 'stress-timed' },
    { name: 'US South',           lat:  33.0, lon:  -88.0, r:  6,
      scale: [0, 3, 5, 6, 7, 10],                          // blues scale
      rhythm: 'stress-timed' },
    { name: 'Andes',              lat: -13.5, lon:  -72.0, r: 10,
      scale: [0, 2, 4, 7, 9],                              // Andean pentatonic
      rhythm: 'syllable-timed' },
    { name: 'Brazil',             lat: -14.0, lon:  -51.0, r: 14,
      scale: [0, 2, 4, 5, 7, 9, 11],                       // major (bossa nova)
      rhythm: 'syllable-timed' },
    { name: 'Caribbean',          lat:  18.0, lon:  -72.0, r:  8,
      scale: [0, 2, 4, 5, 7, 9, 10],                       // mixolydian
      rhythm: 'syllable-timed' },
    { name: 'Mexico',             lat:  23.0, lon: -102.0, r:  8,
      scale: [0, 2, 4, 5, 7, 9, 11],                       // major (ranchera)
      rhythm: 'syllable-timed' },
    { name: 'Navajo',             lat:  36.0, lon: -109.5, r:  4,
      scale: [0, 2, 4, 7, 9],                              // 5-6 equidistant
      rhythm: 'stress-timed' },
    // AUSTRALIA
    { name: 'Aboriginal Australia', lat: -25.0, lon:  134.0, r: 18,
      scale: [0, 2, 5],                                    // narrow 3-pitch
      rhythm: 'stress-timed' },
    // INNER ASIA
    { name: 'Mongolia',           lat:  47.0, lon:  104.0, r:  8,
      scale: [0, 2, 4, 7, 9],                              // pentatonic (overtone)
      rhythm: 'stress-timed' },
    // NORTHEAST US fallback (home base — James is in Columbus NJ)
    { name: 'Northeast US',       lat:  40.7, lon:  -74.0, r:  6,
      scale: [0, 2, 4, 5, 7, 9, 11],                       // major / standard Western
      rhythm: 'stress-timed' },
  ];

  // ── PROSODIC REGION LOOKUP ───────────────────────────────────────────────
  // Haversine great-circle distance in degrees (fast approximation).
  // True Haversine is overkill — we just need nearest-region ordering.

  function distDeg(lat1, lon1, lat2, lon2) {
    var dLat = lat1 - lat2;
    var dLon = (lon1 - lon2) * Math.cos((lat1 + lat2) * 0.5 * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLon * dLon);
  }

  function findRegion(lat, lon) {
    if (lat === null || lon === null) return null;
    var best = null;
    var bestScore = Infinity;
    for (var i = 0; i < REGIONS.length; i++) {
      var reg = REGIONS[i];
      var d = distDeg(lat, lon, reg.lat, reg.lon);
      // Score: distance normalized by region radius — smaller = better fit
      var score = d / reg.r;
      if (score < bestScore) {
        bestScore = score;
        best = reg;
      }
    }
    return best;
  }

  // ── CORE MAPPINGS ────────────────────────────────────────────────────────

  /**
   * Temperature → interval scale
   * Wang & Wichmann 2023: warm climates produce wider pitch excursions.
   * Cold compresses MORE than heat expands (asymmetric).
   * Range: -20C → 0.7, 10C → 1.0 (neutral), 40C → 1.3
   */
  function temperatureToIntervalScale(tempC) {
    if (tempC === null) return 1.0;
    var normalized = clamp((tempC + 20) / 60, 0, 1);  // -20C=0, 40C=1
    // Asymmetric curve: cold side compresses harder
    if (normalized < 0.5) return 0.7 + normalized * 0.6;   // 0.7 → 1.0
    return 1.0 + (normalized - 0.5) * 0.6;                 // 1.0 → 1.3
  }

  /**
   * Humidity → filter openness
   * Everett 2015: humid air keeps vocal folds elastic, enabling tonal complexity.
   * Dry air stiffens them. Tonal languages cluster almost exclusively in humid regions.
   * Range: 20% → 0.7, 55% → 1.0, 90% → 1.3
   */
  function humidityToFilterOpenness(humidPct) {
    if (humidPct === null) return 1.0;
    var normalized = clamp((humidPct - 20) / 70, 0, 1);   // 20%=0, 90%=1
    return 0.7 + normalized * 0.6;
  }

  /**
   * Weather condition → legato articulation
   * Schafer 1977: wet soundscapes produce more connected, flowing speech.
   * Range: 0.0 (fully staccato) to 1.0 (fully legato)
   */
  function weatherToArticulation(weather) {
    if (weather === 'rain')  return 0.8;   // legato — notes connect and flow
    if (weather === 'snow')  return 0.6;   // connected but hushed
    if (weather === 'cloud') return 0.4;   // slightly connected
    return 0.2;                            // clear = articulate, separated
  }

  /**
   * Altitude → phrase length
   * Physiological: thinner air reduces breath capacity, shortening phrases
   * and favoring percussive articulation.
   * For now, default to 1.0 (sea level). Altitude data requires either
   * elevation API or barometric sensor — future enhancement.
   */
  function altitudeToPhraseLength() {
    return 1.0;
  }

  // ── STATE ────────────────────────────────────────────────────────────────

  var _state = {
    // Adjustments (multiplicative, centered at 1.0)
    intervalScale:      1.0,
    filterOpenness:     1.0,
    articulationLegato: 0.2,
    phraseLength:       1.0,

    // Prosodic DNA (for GPS Music, Phase 3)
    prosodicRegion:     null,
    regionalScale:      null,
    regionalRhythm:     null,

    // Source data
    temperature:        null,
    humidity:           null,
    weather:            'clear',
    isLoaded:           false,
  };

  // Track whether we have done the initial region lookup
  var _regionResolved = false;

  // ── UPDATE ───────────────────────────────────────────────────────────────
  // Called once per frame from the main loop with the current SensorState.
  // Self-gating: recomputes only when source data has actually arrived.

  function update(sensorState) {
    if (!sensorState) return;

    // Only recompute when sensor has weather data
    var hasWeather = sensorState.weatherLoaded === true;
    if (!hasWeather && _state.isLoaded) return;   // already computed, no new data
    if (!hasWeather) return;                       // nothing to compute yet

    // ── Source data ──────────────────────────────────────────────────────
    _state.temperature = sensorState.temperature;
    _state.humidity    = sensorState.humidity;
    _state.weather     = sensorState.weather || 'clear';
    _state.isLoaded    = true;

    // ── Core mappings ────────────────────────────────────────────────────
    _state.intervalScale      = temperatureToIntervalScale(sensorState.temperature);
    _state.filterOpenness     = humidityToFilterOpenness(sensorState.humidity);
    _state.articulationLegato = weatherToArticulation(sensorState.weather);
    _state.phraseLength       = altitudeToPhraseLength();

    // ── Prosodic DNA lookup (once) ───────────────────────────────────────
    if (!_regionResolved && sensorState.latitude !== null) {
      var region = findRegion(sensorState.latitude, sensorState.longitude);
      if (region) {
        _state.prosodicRegion = region.name;
        _state.regionalScale  = region.scale;
        _state.regionalRhythm = region.rhythm;
      }
      _regionResolved = true;
    }
  }

  // ── INIT ─────────────────────────────────────────────────────────────────
  // Weather.init() — nothing to set up. sensor.js owns the API fetch.
  // The module activates on the first update() call that carries data.

  function init() {
    // Reset to defaults in case of re-init
    _state.intervalScale      = 1.0;
    _state.filterOpenness     = 1.0;
    _state.articulationLegato = 0.2;
    _state.phraseLength       = 1.0;
    _state.prosodicRegion     = null;
    _state.regionalScale      = null;
    _state.regionalRhythm     = null;
    _state.temperature        = null;
    _state.humidity           = null;
    _state.weather            = 'clear';
    _state.isLoaded           = false;
    _regionResolved           = false;
  }

  // ── PUBLIC API ───────────────────────────────────────────────────────────

  return {
    init:   init,
    update: update,

    // Full state object
    get state() { return _state; },

    // Convenience accessors (the three proven mappings)
    get intervalScale()      { return _state.intervalScale; },
    get filterOpenness()     { return _state.filterOpenness; },
    get articulationLegato() { return _state.articulationLegato; },
    get phraseLength()       { return _state.phraseLength; },

    // Prosodic DNA
    get prosodicRegion()     { return _state.prosodicRegion; },
    get regionalScale()      { return _state.regionalScale; },
    get regionalRhythm()     { return _state.regionalRhythm; },

    // Source data
    get temperature()        { return _state.temperature; },
    get humidity()           { return _state.humidity; },
    get weather()            { return _state.weather; },
    get isLoaded()           { return _state.isLoaded; },
  };

})();

window.Weather = Weather;
