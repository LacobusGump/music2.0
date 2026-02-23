/**
 * GUMP CONTEXT — Weather + Time of Day
 *
 * v38-REBIRTH: Slow environmental modulation.
 * Weather from Open-Meteo (free, no API key).
 * Time of day shapes brightness/color.
 *
 * warmth: 0 (cold/dark) → 1 (warm/bright)
 * storminess: 0 (calm) → 1 (wild wind)
 * timeColor: 0.1 (night) → 0.9 (noon)
 */

const GumpContext = (function() {
    'use strict';

    var data = {
        warmth: 0.5,
        storminess: 0,
        clarity: 0.7,
        timeColor: 0.5,
        isDay: true
    };

    var loaded = false;

    function init() {
        updateTime();
        setInterval(updateTime, 60000); // every minute
        fetchWeather();
        setInterval(fetchWeather, 1800000); // every 30 min
    }

    function updateTime() {
        var h = new Date().getHours();
        // 0-6: night(0.1), 6-9: dawn(rising), 9-15: day(peak),
        // 15-18: afternoon(falling), 18-21: dusk(falling), 21-24: night(0.1)
        if (h < 6) {
            data.timeColor = 0.1;
        } else if (h < 9) {
            data.timeColor = 0.3 + (h - 6) / 3 * 0.3;
        } else if (h < 15) {
            data.timeColor = 0.7 + (h - 9) / 6 * 0.2;
        } else if (h < 18) {
            data.timeColor = 0.9 - (h - 15) / 3 * 0.4;
        } else if (h < 21) {
            data.timeColor = 0.5 - (h - 18) / 3 * 0.3;
        } else {
            data.timeColor = 0.1;
        }
        data.isDay = h >= 6 && h < 20;
    }

    function fetchWeather() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(function(pos) {
            var url = 'https://api.open-meteo.com/v1/forecast?latitude=' +
                pos.coords.latitude + '&longitude=' + pos.coords.longitude +
                '&current_weather=true';
            fetch(url).then(function(r) { return r.json(); }).then(function(w) {
                if (w.current_weather) {
                    var temp = w.current_weather.temperature;
                    data.warmth = Math.max(0, Math.min(1, (temp + 10) / 50)); // -10C=0, 40C=1
                    data.storminess = Math.min(1, w.current_weather.windspeed / 50);
                    data.clarity = 1 - data.storminess * 0.5;
                    loaded = true;
                    console.log('[Context] Weather: ' + temp + 'C, wind ' + w.current_weather.windspeed + 'km/h');
                }
            }).catch(function(e) {
                console.log('[Context] Weather fetch failed:', e.message);
            });
        }, function() {
            console.log('[Context] Geolocation denied, using defaults');
        });
    }

    function get() {
        return data;
    }

    return Object.freeze({
        init: init,
        get: get,
        get loaded() { return loaded; }
    });
})();

if (typeof window !== 'undefined') {
    window.GumpContext = GumpContext;
}
