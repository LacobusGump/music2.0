// gump-unlock.js — single source of truth for the $30 annual pass's expiry.
// Everything else (the $3 research cookie/password, the $1 per-song key,
// per-song unlocks in gump_unlocks) is a one-time purchase with no expiry.
// Only the $30 "everything" pass (gump_unlocks.all) is a real subscription:
// exactly one year from purchase date, checked and purged on every read —
// no one bought this before 2026-07-07, so that date is a clean, honest
// starting line with zero legacy edge cases to grandfather in.
(function(){
  var YEAR_MS = 365*24*60*60*1000;
  window.gumpUnlockAll = function(){
    try{
      var u = JSON.parse(localStorage.getItem('gump_unlocks')||'{}');
      if(!u.all) return false;
      if(!u.purchasedAt || (Date.now()-u.purchasedAt) >= YEAR_MS){
        // real purge, not a soft lock — the stale grant is actually removed
        delete u.all; delete u.purchasedAt;
        localStorage.setItem('gump_unlocks', JSON.stringify(u));
        return false;
      }
      return true;
    }catch(e){ return false; }
  };
})();
