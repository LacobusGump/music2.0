/**
 * WEATHER — Environmental Awareness
 *
 * Fetches current conditions via Open-Meteo (free, no key).
 * Exposes state + music modification parameters.
 * Visual rendering lives in wx.js.
 */

var Weather = (function () {

  // ── STATE ──────────────────────────────────────────────────────────────
  var _condition = 'clear';   // 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm'
  var _isDay     = true;
  var _tempC     = 20;
  var _intensity = 0.5;        // 0-1, rainfall/snowfall intensity
  var _loaded    = false;
  var _hour      = new Date().getHours();

  // Music mods: Follow reads these each frame and applies them.
  // Grounded in climate-prosody research (Wang & Wichmann 2023 PNAS Nexus,
  // Everett 2015 PNAS, Schafer 1977 acoustic ecology):
  // - Temperature → interval width (warm = wider pitch excursions)
  // - Humidity → timbral openness (humid = open filter, dry = constricted)
  // - Precipitation → articulation (rain = legato, clear = staccato)
  // - Wind → density (still = sparse, windy = layered)
  var _mods = {
    reverbBoost:    0,     // added to lens reverbMix
    filterShift:    0,     // Hz added/subtracted from ceiling freq
    noiseVol:       0,     // ambient weather noise volume
    tempoScale:     1.0,   // noteInterval multiplier
    shimmerVol:     0,     // high shimmer layer
    intervalScale:  1.0,   // multiplier on pitch interval width (warm = wider)
    articulationLegato: 0, // 0-1, how much notes connect vs separate
  };

  // ── WMO WEATHER CODE → CONDITION ──────────────────────────────────────
  // https://open-meteo.com/en/docs — WMO 4677 codes
  function parseCode(code, isDay, temp) {
    var c;
    if      (code === 0)                     c = 'clear';
    else if (code <= 3)                      c = 'cloudy';
    else if (code <= 48)                     c = 'fog';
    else if (code <= 67 || (code >= 80 && code <= 82)) c = 'rain';
    else if (code <= 77)                     c = 'snow';
    else if (code >= 95)                     c = 'storm';
    else                                     c = 'cloudy';

    _condition = c;
    _isDay     = isDay;
    _tempC     = temp;

    // Intensity: light drizzle = 0.3, heavy rain = 0.9
    _intensity = (code === 51 || code === 71) ? 0.3
               : (code === 53 || code === 73) ? 0.6
               : (code === 55 || code === 75 || code === 65 || code === 66 || code === 67) ? 0.9
               : (code >= 95) ? 1.0
               : 0.5;
  }

  function buildMods() {
    _mods = {
      reverbBoost: 0, filterShift: 0, noiseVol: 0,
      tempoScale: 1.0, shimmerVol: 0,
      intervalScale: 1.0, articulationLegato: 0,
    };

    // ── TEMPERATURE → INTERVAL WIDTH ──────────────────────────────────
    // Warm climates produce wider pitch excursions in speech (PNAS Nexus 2023).
    // Cold compresses more than heat expands (asymmetric — Wang & Wichmann).
    // Range: 0.75 (freezing) to 1.25 (hot). Neutral at ~18°C.
    var tempNorm = Math.max(-10, Math.min(40, _tempC));
    _mods.intervalScale = 0.85 + (tempNorm + 10) * 0.008;  // -10°C=0.85, 18°C=1.07, 40°C=1.25
    // Cold compresses harder — apply asymmetric curve
    if (_tempC < 10) _mods.intervalScale *= 0.95;

    // ── TEMPERATURE → FILTER ──────────────────────────────────────────
    // Warm = brighter (open vowels carry more high harmonics). Cold = darker.
    _mods.filterShift = (_tempC - 18) * 12;  // ±250Hz around 18°C neutral

    // ── PRECIPITATION → ARTICULATION ──────────────────────────────────
    // Rain = legato (notes connect, portamento between). Clear = staccato.
    switch (_condition) {
      case 'rain':
        _mods.reverbBoost = 0.10 + _intensity * 0.08;
        _mods.noiseVol = 0.015 + _intensity * 0.020;
        _mods.articulationLegato = 0.4 + _intensity * 0.3;  // notes flow into each other
        break;
      case 'storm':
        _mods.reverbBoost = 0.18;
        _mods.noiseVol = 0.04;
        _mods.articulationLegato = 0.7;
        _mods.filterShift -= 300;  // storms compress the spectrum
        break;
      case 'snow':
        _mods.reverbBoost = 0.18;
        _mods.tempoScale = 1.15;
        _mods.articulationLegato = 0.5;  // snow = gentle legato
        break;
      case 'fog':
        _mods.reverbBoost = 0.25;
        _mods.filterShift -= 400;  // fog = everything muffled
        _mods.articulationLegato = 0.3;
        break;
      case 'cloudy':
        _mods.reverbBoost = 0.04;
        _mods.filterShift -= 80;
        break;
      case 'clear':
        if (_isDay) {
          _mods.shimmerVol = 0.015;
          _mods.filterShift += 150;
        }
        break;
    }

    // ── NIGHT ─────────────────────────────────────────────────────────
    // Nighttime soundscapes are lower-frequency dominant (Schafer 1977).
    if (!_isDay) {
      _mods.reverbBoost += 0.08;
      _mods.filterShift -= 200;
      _mods.intervalScale *= 0.95;  // night compresses expression slightly
    }
  }

  // ── FETCH ──────────────────────────────────────────────────────────────
  function fetchAt(lat, lon) {
    var url = 'https://api.open-meteo.com/v1/forecast'
            + '?latitude='  + lat.toFixed(4)
            + '&longitude=' + lon.toFixed(4)
            + '&current=weather_code,temperature_2m,is_day'
            + '&timezone=auto';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 8000;
    xhr.onload = function () {
      if (xhr.status !== 200) return;
      try {
        var data = JSON.parse(xhr.responseText);
        var cur  = data.current;
        parseCode(cur.weather_code, cur.is_day === 1, cur.temperature_2m);
        buildMods();
        _loaded = true;
        // Tell audio engine about weather
        try { if (typeof Audio !== 'undefined') Audio.setWeather(_condition, _intensity); } catch(e) {}
      } catch (e) {}
    };
    xhr.onerror = function () {};
    xhr.send();
  }

  // ── INIT ───────────────────────────────────────────────────────────────
  function init() {
    // Set isDay immediately from clock — API refines it
    _hour  = new Date().getHours();
    _isDay = _hour >= 6 && _hour < 20;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (pos) { fetchAt(pos.coords.latitude, pos.coords.longitude); },
        function ()    { fetchAt(40.0385, -74.6971); }   // Columbus NJ fallback
      );
    } else {
      fetchAt(40.0385, -74.6971);
    }
  }

  // ── PUBLIC ─────────────────────────────────────────────────────────────
  return {
    init: init,
    get condition()  { return _condition; },
    get isDay()      { return _isDay; },
    get isNight()    { return !_isDay; },
    get tempC()      { return _tempC; },
    get intensity()  { return _intensity; },
    get loaded()     { return _loaded; },
    get mods()       { return _mods; },
    get hour()       { return _hour; },
  };
})();
