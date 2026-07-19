// gump-unlock.js — single source of truth for album ownership (gump_unlocks.all).
// MODEL CHANGE 2026-07-19: listening is free everywhere — every song streams
// whole, no key needed. What the $30 buys now is the ALBUM AS FILES: all 33
// downloads, beats included, yours forever. So `all` is no longer an annual
// pass with an expiry purge — it's a one-time purchase that never lapses.
// (The $3 research cookie and per-song love-bug unlocks were always one-time.)
// Anyone who bought the old Universal Key keeps `all` and simply owns the album.
(function(){
  window.gumpUnlockAll = function(){
    try{
      var u = JSON.parse(localStorage.getItem('gump_unlocks')||'{}');
      return !!u.all;
    }catch(e){ return false; }
  };
})();
