/**
 * OUTFIT — Music Identity + Social Dance Layer
 *
 * Two phones. One dance. P2P after the initial handshake.
 * No server for the music data — only the WebRTC signaling
 * handshake touches PeerJS's free relay, then it's device-to-device.
 *
 * Host:  generateCode() → createRoom() → QR shown
 * Guest: scans QR → URL with ?dance=CODE → joinRoom()
 * Both:  broadcast() ~12Hz — partner peaks seed your ANSWER voice
 */

const Outfit = (function () {
  'use strict';

  var peer          = null;
  var conn          = null;
  var _code         = null;
  var _connected    = false;
  var _partnerState = null;
  var _lastSend     = 0;
  var _onConnect    = null;
  var _onData       = null;
  var _onDisconnect = null;

  // ── UTILS ──────────────────────────────────────────────────────────────

  function generateCode() {
    // No confusable chars (0/O, 1/I/L)
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    for (var i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function hostId(code) {
    // Namespaced to avoid collisions with other PeerJS users
    return 'gump4-' + code;
  }

  // ── CONNECTION PLUMBING ────────────────────────────────────────────────

  function wireConn(c) {
    conn = c;
    c.on('open', function () {
      _connected = true;
      if (_onConnect) _onConnect();
    });
    c.on('data', function (d) {
      _partnerState = d;
      if (_onData) _onData(d);
    });
    c.on('close', function () {
      _connected    = false;
      _partnerState = null;
      conn          = null;
      if (_onDisconnect) _onDisconnect();
    });
    c.on('error', function (e) { console.warn('[Outfit conn]', e.type || e); });
  }

  // ── HOST: waits for partner to scan and join ───────────────────────────

  function createRoom(code, onConnect, onData, onDisconnect) {
    _code         = code;
    _onConnect    = onConnect;
    _onData       = onData;
    _onDisconnect = onDisconnect;

    peer = new Peer(hostId(code), { debug: 0 });
    peer.on('connection', function (c) { wireConn(c); });
    peer.on('error', function (e) { console.warn('[Outfit host]', e.type || e); });
  }

  // ── GUEST: connects to an existing room ────────────────────────────────

  function joinRoom(code, onConnect, onData, onDisconnect) {
    _code         = code;
    _onConnect    = onConnect;
    _onData       = onData;
    _onDisconnect = onDisconnect;

    peer = new Peer(null, { debug: 0 }); // auto-ID for guest
    peer.on('open', function () {
      wireConn(peer.connect(hostId(code), {
        reliable: false,
        serialization: 'json',
      }));
    });
    peer.on('error', function (e) { console.warn('[Outfit guest]', e.type || e); });
  }

  // ── BROADCAST ─────────────────────────────────────────────────────────

  function broadcast(state) {
    if (!_connected || !conn || !conn.open) return;
    var now = Date.now();
    if (now - _lastSend < 80) return; // ~12Hz ceiling
    _lastSend = now;
    try { conn.send(state); } catch (e) {}
  }

  // ── URL ───────────────────────────────────────────────────────────────

  function buildJoinURL(code) {
    return window.location.origin + window.location.pathname + '?dance=' + code;
  }

  function checkAutoJoin() {
    try {
      return new URLSearchParams(window.location.search).get('dance') || null;
    } catch (e) { return null; }
  }

  // ── CLEANUP ──────────────────────────────────────────────────────────

  function destroy() {
    if (conn) { try { conn.close(); } catch (e) {} conn = null; }
    if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
    _connected = false; _partnerState = null; _code = null;
  }

  // ── PUBLIC ────────────────────────────────────────────────────────────

  return Object.freeze({
    generateCode:  generateCode,
    createRoom:    createRoom,
    joinRoom:      joinRoom,
    broadcast:     broadcast,
    buildJoinURL:  buildJoinURL,
    checkAutoJoin: checkAutoJoin,
    destroy:       destroy,
    get connected()    { return _connected; },
    get partnerState() { return _partnerState; },
    get code()         { return _code; },
  });
})();
