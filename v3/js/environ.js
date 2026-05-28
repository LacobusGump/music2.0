/**
 * ENVIRON — Environment → Song Parameters
 *
 * GPS + weather + time → key, mode, BPM, energy, description.
 *
 * Design rule: the environment is the composer. The human is the lead player.
 * Every musical parameter has a physical source. Nothing is random.
 *
 * GPS → key (12 major / 12 minor = 24 slots, tiled over Earth)
 * Weather code → mode (clear=major, rain=minor, cloud=dorian, snow=lydian)
 * Temperature → BPM (cold=slower, hot=faster, ~75–125)
 * Time of day → energy level (morning builds, day high, evening rich, night sparse)
 * Humidity → reverb depth (dry air = less, humid = more)
 */

const Environ = (function () {
  'use strict';

  // ── MUSICAL CONSTANTS ──────────────────────────────────────────────────

  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  var MODES = {
    major:      { semitones: [0,2,4,5,7,9,11],  label: 'major',      color: '#e8c87a' },
    minor:      { semitones: [0,2,3,5,7,8,10],  label: 'minor',      color: '#7a9ec8' },
    dorian:     { semitones: [0,2,3,5,7,9,10],  label: 'dorian',     color: '#a0c87a' },
    lydian:     { semitones: [0,2,4,6,7,9,11],  label: 'lydian',     color: '#c8a07a' },
    mixolydian: { semitones: [0,2,4,5,7,9,10],  label: 'mixolydian', color: '#c87aa0' },
    phrygian:   { semitones: [0,1,3,5,7,8,10],  label: 'phrygian',   color: '#7a7ac8' },
  };

  // Chord progressions: indices into the mode's scale degrees
  // Each progression is 4 bars of 3-note chords (root+3rd+5th of scale degree)
  var PROGRESSIONS = {
    major:      [[0,2,4], [3,5,0], [5,0,2], [4,6,1]],  // I – vi – IV – V
    minor:      [[0,2,4], [5,0,2], [3,5,0], [6,1,3]],  // i – VI – III – VII
    dorian:     [[0,2,4], [3,5,0], [1,3,5], [0,2,4]],  // i – IV – ii – i
    lydian:     [[0,2,4], [1,3,5], [4,6,1], [0,2,4]],  // I – II – V – I
    mixolydian: [[0,2,4], [6,1,3], [3,5,0], [0,2,4]],  // I – VII – IV – I
    phrygian:   [[0,2,4], [1,3,5], [0,2,4], [1,3,5]],  // i – II♭ – i – II♭
  };

  // ── STATE ──────────────────────────────────────────────────────────────

  var state = {
    key: 0,                  // 0–11 (C=0, C#=1 … B=11)
    mode: 'minor',           // mode name
    bpm: 88,
    energy: 0.6,             // 0–1 overall density/velocity
    reverbDepth: 0.35,       // 0–1
    latitude: null,
    longitude: null,
    weather: 'clear',
    weatherCode: 0,
    temperature: null,
    humidity: null,
    hour: new Date().getHours(),
    cityName: null,
    loaded: false,
  };

  // ── DERIVATION ─────────────────────────────────────────────────────────

  /**
   * Derive a key (0–11) from GPS coordinates.
   * Method: tile the Earth into 24 slices (30°×15°) and map each to a key.
   * Deterministic — same location always gives same key. No random.
   */
  function _keyFromGPS(lat, lon) {
    // Normalize lat [-90,90] and lon [-180,180] to [0,1)
    var latNorm = (lat + 90) / 180;
    var lonNorm = (lon + 180) / 360;
    // 6 lat bands × 4 lon bands = 24 regions → 12 keys (each key covers 2 regions)
    var latBand = Math.floor(latNorm * 6);
    var lonBand = Math.floor(lonNorm * 4);
    var region  = (latBand * 4 + lonBand) % 24;
    return region % 12;
  }

  /** Map weather code → mode name */
  function _modeFromWeather(code, temp) {
    if (code >= 71 && code <= 77) return 'lydian';     // snow → dreamlike
    if (code >= 61 && code <= 67) return 'minor';      // rain → darker
    if (code >= 51 && code <= 57) return 'phrygian';   // drizzle → tense
    if (code >= 45 && code <= 49) return 'dorian';     // fog → middle ground
    if (code >= 3  && code <= 9)  return 'dorian';     // cloudy → dorian
    // Clear sky: temperature suggests mode
    if (temp !== null) {
      if (temp < 5)  return 'minor';       // cold clear = introspective
      if (temp > 28) return 'mixolydian';  // hot clear = bluesy
      return 'major';                       // mild clear = bright
    }
    return 'major';
  }

  /**
   * Temperature → BPM
   * -10°C = 72 BPM (slow, cold, deliberate)
   *  20°C = 95 BPM (moderate, comfortable)
   *  35°C = 118 BPM (hot, energetic)
   * Clamped [72, 120].
   */
  function _bpmFromTemp(temp) {
    if (temp === null) return 90;
    var t = Math.max(-10, Math.min(40, temp));
    return Math.round(72 + (t + 10) / 50 * 48);
  }

  /** Time of day → energy (0–1) */
  function _energyFromHour(h) {
    if (h >= 5  && h < 8)  return 0.45; // early morning — sparse, waking
    if (h >= 8  && h < 12) return 0.65; // morning — building
    if (h >= 12 && h < 17) return 0.80; // day — full energy
    if (h >= 17 && h < 21) return 0.70; // evening — rich
    if (h >= 21 && h < 23) return 0.55; // late evening — settling
    return 0.40;                          // night — sparse, intimate
  }

  /** Humidity → reverb depth */
  function _reverbFromHumidity(humidity) {
    if (humidity === null) return 0.35;
    return 0.2 + (humidity / 100) * 0.45;
  }

  /** Describe the environment in one line (for display) */
  function _describe() {
    var parts = [];
    if (state.cityName) parts.push(state.cityName);
    var tod = '';
    var h = state.hour;
    if (h >= 5 && h < 12) tod = 'morning';
    else if (h >= 12 && h < 17) tod = 'afternoon';
    else if (h >= 17 && h < 21) tod = 'evening';
    else tod = 'night';
    parts.push(tod);
    if (state.temperature !== null) parts.push(Math.round(state.temperature) + '°');
    if (state.weather !== 'clear') parts.push(state.weather);
    return parts.join('  ·  ');
  }

  // ── FETCH ──────────────────────────────────────────────────────────────

  function _applyDefaults() {
    // No GPS — use time + defaults
    var h = new Date().getHours();
    state.hour  = h;
    state.bpm   = 88;
    state.mode  = h >= 22 || h < 6 ? 'minor' : 'dorian';
    state.key   = 5; // A minor — friendly default
    state.energy = _energyFromHour(h);
    state.loaded = true;
  }

  function _applyGPS(lat, lon) {
    state.latitude  = lat;
    state.longitude = lon;
    state.key = _keyFromGPS(lat, lon);

    // Reverse geocode city name (best effort, silent on fail)
    var geoUrl = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat.toFixed(4) +
      '&lon=' + lon.toFixed(4) + '&format=json&zoom=10';
    fetch(geoUrl, { headers: { 'Accept-Language': 'en' } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var a = d.address || {};
        state.cityName = a.city || a.town || a.village || a.county || null;
      })
      .catch(function () {});
  }

  function _applyWeather(lat, lon) {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(2) +
      '&longitude=' + lon.toFixed(2) +
      '&current=temperature_2m,relative_humidity_2m,weather_code';
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.current) return;
        var code = data.current.weather_code;
        var temp = data.current.temperature_2m;
        var hum  = data.current.relative_humidity_2m;
        state.weatherCode  = code;
        state.temperature  = temp;
        state.humidity     = hum;
        state.bpm          = _bpmFromTemp(temp);
        state.reverbDepth  = _reverbFromHumidity(hum);
        if (code >= 61 && code <= 77) state.weather = 'rain';
        else if (code >= 71 && code <= 77) state.weather = 'snow';
        else if (code >= 51 && code <= 57) state.weather = 'drizzle';
        else if (code >= 45 && code <= 49) state.weather = 'fog';
        else if (code >= 1  && code <= 9)  state.weather = 'cloud';
        else state.weather = 'clear';
        state.mode = _modeFromWeather(code, temp);
        state.loaded = true;
      })
      .catch(function () {
        state.loaded = true;
      });
  }

  // ── PUBLIC ─────────────────────────────────────────────────────────────

  function init() {
    var h = new Date().getHours();
    state.hour   = h;
    state.energy = _energyFromHour(h);

    _applyDefaults();  // Safe defaults immediately — music can start

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        _applyGPS(pos.coords.latitude, pos.coords.longitude);
        _applyWeather(pos.coords.latitude, pos.coords.longitude);
      },
      function () { /* denied — defaults stay */ },
      { timeout: 6000, maximumAge: 300000 }
    );
  }

  /** Returns the current scale as an array of MIDI note numbers (one octave, rooted at C3=48) */
  function scale(octave) {
    var root = 48 + (octave || 0) * 12 + state.key;
    var semitones = (MODES[state.mode] || MODES.minor).semitones;
    return semitones.map(function (s) { return root + s; });
  }

  /** Returns the chord for a given progression bar (0–3) as array of MIDI note numbers */
  function chord(bar, octave) {
    var prog = (PROGRESSIONS[state.mode] || PROGRESSIONS.minor);
    var degrees = prog[bar % prog.length];
    var sc = scale(octave !== undefined ? octave : 0);
    var extended = sc.concat(scale(1)); // two octaves to avoid out-of-range
    return degrees.map(function (d) { return extended[d]; });
  }

  /** MIDI note number → Hz */
  function midiToHz(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /** Current key name + mode name */
  function label() {
    return NOTE_NAMES[state.key] + ' ' + state.mode;
  }

  function description() {
    return _describe();
  }

  function modeColor() {
    return (MODES[state.mode] || MODES.minor).color;
  }

  return Object.freeze({
    init: init,
    scale: scale,
    chord: chord,
    midiToHz: midiToHz,
    label: label,
    description: description,
    modeColor: modeColor,
    get key()         { return state.key; },
    get mode()        { return state.mode; },
    get bpm()         { return state.bpm; },
    get energy()      { return state.energy; },
    get reverbDepth() { return state.reverbDepth; },
    get loaded()      { return state.loaded; },
    get hour()        { return state.hour; },
    get weather()     { return state.weather; },
    get temperature() { return state.temperature; },
    get cityName()    { return state.cityName; },
  });
})();
