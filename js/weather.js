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

  // Music mods: Follow reads these each frame and applies them
  var _mods = {
    reverbBoost:  0,    // added to lens reverbMix
    filterShift:  0,    // Hz added/subtracted from ceiling freq
    noiseVol:     0,    // ambient weather noise volume (0 = off)
    tempoScale:   1.0,  // noteInterval multiplier (>1 = slower)
    shimmerVol:   0,    // high shimmer layer (sunny)
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
    _mods = { reverbBoost: 0, filterShift: 0, noiseVol: 0, tempoScale: 1.0, shimmerVol: 0 };

    switch (_condition) {
      case 'rain':
        _mods.reverbBoost = 0.12 + _intensity * 0.08;
        _mods.filterShift = -400;
        _mods.noiseVol    = 0.018 + _intensity * 0.022;
        break;
      case 'storm':
        _mods.reverbBoost = 0.22;
        _mods.filterShift = -600;
        _mods.noiseVol    = 0.045;
        break;
      case 'snow':
        _mods.reverbBoost = 0.20;
        _mods.filterShift = -200;
        _mods.tempoScale  = 1.25;   // notes breathe wider apart
        break;
      case 'fog':
        _mods.reverbBoost = 0.28;
        _mods.filterShift = -700;
        break;
      case 'cloudy':
        _mods.reverbBoost = 0.05;
        _mods.filterShift = -100;
        break;
      case 'clear':
        if (_isDay) {
          _mods.shimmerVol  = 0.02;
          _mods.filterShift = 250;
        }
        break;
    }

    // Night: deeper reverb, darker spectrum
    if (!_isDay) {
      _mods.reverbBoost += 0.10;
      _mods.filterShift -= 250;
    }

    // Extreme temperature: cold tightens, hot loosens
    if (_tempC < 2)  { _mods.reverbBoost += 0.08; _mods.filterShift -= 200; }
    if (_tempC > 32) { _mods.filterShift += 150; }
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
