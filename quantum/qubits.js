// ═══════════════════════════════════════════════════════════════
// QUBITS.JS — Quantum computation in the browser
// ═══════════════════════════════════════════════════════════════
// A qubit is two complex amplitudes: α|0⟩ + β|1⟩
// |α|² + |β|² = 1 (probability conserved)
// Gates are 2×2 unitary matrices. Multi-qubit = tensor products.
// Everything runs from K. The coupling constant IS the physics.
//
// No server. No framework. Pure math in your browser.
// ═══════════════════════════════════════════════════════════════

var Q = (function() {

// ─── Complex number arithmetic ───
function C(re, im) { return { re: re || 0, im: im || 0 }; }
function cadd(a, b) { return C(a.re + b.re, a.im + b.im); }
function csub(a, b) { return C(a.re - b.re, a.im - b.im); }
function cmul(a, b) { return C(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re); }
function cscale(a, s) { return C(a.re * s, a.im * s); }
function cconj(a) { return C(a.re, -a.im); }
function cabs2(a) { return a.re*a.re + a.im*a.im; }
function cabs(a) { return Math.sqrt(cabs2(a)); }
function cexp(theta) { return C(Math.cos(theta), Math.sin(theta)); }
function cphase(a) { return Math.atan2(a.im, a.re); }

// ─── Qubit state: array of 2^n complex amplitudes ───
function Qubit(n) {
  this.n = n || 1;
  this.size = 1 << this.n;
  this.state = new Array(this.size);
  for (var i = 0; i < this.size; i++) this.state[i] = C(0, 0);
  this.state[0] = C(1, 0); // |00...0⟩
}

// Set to a specific basis state |k⟩
Qubit.prototype.setBasis = function(k) {
  for (var i = 0; i < this.size; i++) this.state[i] = C(0, 0);
  this.state[k] = C(1, 0);
  return this;
};

// Set single qubit to |0⟩ or |1⟩ (only for n=1)
Qubit.prototype.set = function(val) {
  if (this.n !== 1) return this;
  this.state[0] = C(val ? 0 : 1, 0);
  this.state[1] = C(val ? 1 : 0, 0);
  return this;
};

// Set to arbitrary state α|0⟩ + β|1⟩ (single qubit)
Qubit.prototype.setAmplitudes = function(alpha, beta) {
  if (this.n !== 1) return this;
  this.state[0] = typeof alpha === 'number' ? C(alpha, 0) : alpha;
  this.state[1] = typeof beta === 'number' ? C(beta, 0) : beta;
  return this;
};

// Probabilities
Qubit.prototype.probabilities = function() {
  var p = new Array(this.size);
  for (var i = 0; i < this.size; i++) p[i] = cabs2(this.state[i]);
  return p;
};

// Measure — collapses state, returns classical result
Qubit.prototype.measure = function() {
  var probs = this.probabilities();
  var r = Math.random();
  var cumulative = 0;
  for (var i = 0; i < this.size; i++) {
    cumulative += probs[i];
    if (r < cumulative) {
      // Collapse
      for (var j = 0; j < this.size; j++) this.state[j] = C(0, 0);
      this.state[i] = C(1, 0);
      return i;
    }
  }
  return this.size - 1;
};

// Measure single qubit in multi-qubit register
Qubit.prototype.measureQubit = function(target) {
  var prob0 = 0;
  for (var i = 0; i < this.size; i++) {
    if (((i >> target) & 1) === 0) prob0 += cabs2(this.state[i]);
  }
  var result = Math.random() < prob0 ? 0 : 1;
  // Collapse and renormalize
  var norm = 0;
  for (var i = 0; i < this.size; i++) {
    if (((i >> target) & 1) !== result) {
      this.state[i] = C(0, 0);
    } else {
      norm += cabs2(this.state[i]);
    }
  }
  if (norm > 1e-15) {
    var s = 1 / Math.sqrt(norm);
    for (var i = 0; i < this.size; i++) this.state[i] = cscale(this.state[i], s);
  }
  return result;
};

// Bloch sphere coordinates (single qubit only)
Qubit.prototype.bloch = function() {
  if (this.n !== 1) return null;
  var a = this.state[0], b = this.state[1];
  // |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
  var theta = 2 * Math.acos(Math.min(1, cabs(a)));
  var phi = cphase(b) - cphase(a);
  return {
    theta: theta,
    phi: phi,
    x: Math.sin(theta) * Math.cos(phi),
    y: Math.sin(theta) * Math.sin(phi),
    z: Math.cos(theta)
  };
};

// State as string
Qubit.prototype.toString = function() {
  var parts = [];
  for (var i = 0; i < this.size; i++) {
    var a = this.state[i];
    if (cabs2(a) < 1e-10) continue;
    var label = '';
    for (var b = this.n - 1; b >= 0; b--) label += ((i >> b) & 1);
    var coeff = '';
    if (Math.abs(a.im) < 1e-10) {
      coeff = a.re.toFixed(3);
    } else if (Math.abs(a.re) < 1e-10) {
      coeff = a.im.toFixed(3) + 'i';
    } else {
      coeff = '(' + a.re.toFixed(3) + (a.im >= 0 ? '+' : '') + a.im.toFixed(3) + 'i)';
    }
    parts.push(coeff + '|' + label + '⟩');
  }
  return parts.join(' + ') || '0';
};

// Clone
Qubit.prototype.clone = function() {
  var q = new Qubit(this.n);
  for (var i = 0; i < this.size; i++) q.state[i] = C(this.state[i].re, this.state[i].im);
  return q;
};

// ─── Single-qubit gates (apply to qubit #target in register) ───

function applyGate1(qreg, target, gate) {
  // gate = [[a,b],[c,d]] where each is a complex number
  var step = 1 << target;
  for (var i = 0; i < qreg.size; i += step * 2) {
    for (var j = i; j < i + step; j++) {
      var a = qreg.state[j];
      var b = qreg.state[j + step];
      qreg.state[j] = cadd(cmul(gate[0][0], a), cmul(gate[0][1], b));
      qreg.state[j + step] = cadd(cmul(gate[1][0], a), cmul(gate[1][1], b));
    }
  }
  return qreg;
}

// ─── Two-qubit gates (controlled) ───

function applyControlled(qreg, control, target, gate) {
  var step_t = 1 << target;
  var step_c = 1 << control;
  for (var i = 0; i < qreg.size; i++) {
    if (((i >> control) & 1) === 1 && ((i >> target) & 1) === 0) {
      var j = i;
      var k = i | step_t;
      var a = qreg.state[j];
      var b = qreg.state[k];
      qreg.state[j] = cadd(cmul(gate[0][0], a), cmul(gate[0][1], b));
      qreg.state[k] = cadd(cmul(gate[1][0], a), cmul(gate[1][1], b));
    }
  }
  return qreg;
}

// ─── Gate definitions ───

var S2 = 1 / Math.sqrt(2);

var Gates = {
  // Pauli gates
  X: [[C(0,0), C(1,0)], [C(1,0), C(0,0)]],       // NOT / bit flip
  Y: [[C(0,0), C(0,-1)], [C(0,1), C(0,0)]],       // Y rotation
  Z: [[C(1,0), C(0,0)], [C(0,0), C(-1,0)]],        // phase flip

  // Hadamard — creates superposition
  H: [[C(S2,0), C(S2,0)], [C(S2,0), C(-S2,0)]],

  // Phase gates
  S: [[C(1,0), C(0,0)], [C(0,0), C(0,1)]],         // π/2 phase
  T: [[C(1,0), C(0,0)], [C(0,0), cexp(Math.PI/4)]], // π/4 phase

  // Rotation gates
  Rx: function(theta) {
    var c = Math.cos(theta/2), s = Math.sin(theta/2);
    return [[C(c,0), C(0,-s)], [C(0,-s), C(c,0)]];
  },
  Ry: function(theta) {
    var c = Math.cos(theta/2), s = Math.sin(theta/2);
    return [[C(c,0), C(-s,0)], [C(s,0), C(c,0)]];
  },
  Rz: function(theta) {
    return [[cexp(-theta/2), C(0,0)], [C(0,0), cexp(theta/2)]];
  },

  // Phase gate (arbitrary)
  P: function(theta) {
    return [[C(1,0), C(0,0)], [C(0,0), cexp(theta)]];
  }
};

// ─── Circuit: sequence of gate operations ───

function Circuit(n) {
  this.n = n;
  this.ops = [];
}

Circuit.prototype.h = function(t) { this.ops.push({type:'g1', gate:Gates.H, target:t}); return this; };
Circuit.prototype.x = function(t) { this.ops.push({type:'g1', gate:Gates.X, target:t}); return this; };
Circuit.prototype.y = function(t) { this.ops.push({type:'g1', gate:Gates.Y, target:t}); return this; };
Circuit.prototype.z = function(t) { this.ops.push({type:'g1', gate:Gates.Z, target:t}); return this; };
Circuit.prototype.s = function(t) { this.ops.push({type:'g1', gate:Gates.S, target:t}); return this; };
Circuit.prototype.t = function(t) { this.ops.push({type:'g1', gate:Gates.T, target:t}); return this; };
Circuit.prototype.rx = function(t, theta) { this.ops.push({type:'g1', gate:Gates.Rx(theta), target:t}); return this; };
Circuit.prototype.ry = function(t, theta) { this.ops.push({type:'g1', gate:Gates.Ry(theta), target:t}); return this; };
Circuit.prototype.rz = function(t, theta) { this.ops.push({type:'g1', gate:Gates.Rz(theta), target:t}); return this; };
Circuit.prototype.p = function(t, theta) { this.ops.push({type:'g1', gate:Gates.P(theta), target:t}); return this; };

// Controlled gates
Circuit.prototype.cx = function(c, t) { this.ops.push({type:'cx', gate:Gates.X, control:c, target:t}); return this; };
Circuit.prototype.cz = function(c, t) { this.ops.push({type:'cx', gate:Gates.Z, control:c, target:t}); return this; };
Circuit.prototype.ch = function(c, t) { this.ops.push({type:'cx', gate:Gates.H, control:c, target:t}); return this; };
Circuit.prototype.cp = function(c, t, theta) { this.ops.push({type:'cx', gate:Gates.P(theta), control:c, target:t}); return this; };

// SWAP = 3 CNOTs
Circuit.prototype.swap = function(a, b) { return this.cx(a,b).cx(b,a).cx(a,b); };

// Toffoli (CCX) — control on two qubits
Circuit.prototype.ccx = function(c1, c2, t) { this.ops.push({type:'ccx', c1:c1, c2:c2, target:t}); return this; };

// Measure
Circuit.prototype.measure = function(t) { this.ops.push({type:'measure', target:t}); return this; };
Circuit.prototype.measureAll = function() { this.ops.push({type:'measureAll'}); return this; };

// Run circuit
Circuit.prototype.run = function(shots) {
  shots = shots || 1;
  var counts = {};
  for (var s = 0; s < shots; s++) {
    var q = new Qubit(this.n);
    var measurements = [];
    for (var i = 0; i < this.ops.length; i++) {
      var op = this.ops[i];
      if (op.type === 'g1') {
        applyGate1(q, op.target, op.gate);
      } else if (op.type === 'cx') {
        applyControlled(q, op.control, op.target, op.gate);
      } else if (op.type === 'ccx') {
        // Toffoli: apply X to target only when both controls are 1
        applyToffoli(q, op.c1, op.c2, op.target);
      } else if (op.type === 'measure') {
        measurements.push(q.measureQubit(op.target));
      } else if (op.type === 'measureAll') {
        var result = q.measure();
        var key = '';
        for (var b = this.n - 1; b >= 0; b--) key += ((result >> b) & 1);
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    if (measurements.length > 0 && !this.ops.some(function(o){return o.type==='measureAll';})) {
      var key = measurements.join('');
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return { counts: counts, shots: shots };
};

// Get final state vector (no measurement, single run)
Circuit.prototype.statevector = function() {
  var q = new Qubit(this.n);
  for (var i = 0; i < this.ops.length; i++) {
    var op = this.ops[i];
    if (op.type === 'g1') applyGate1(q, op.target, op.gate);
    else if (op.type === 'cx') applyControlled(q, op.control, op.target, op.gate);
    else if (op.type === 'ccx') applyToffoli(q, op.c1, op.c2, op.target);
  }
  return q;
};

// Toffoli gate implementation
function applyToffoli(qreg, c1, c2, target) {
  var step_t = 1 << target;
  for (var i = 0; i < qreg.size; i++) {
    if (((i >> c1) & 1) === 1 && ((i >> c2) & 1) === 1 && ((i >> target) & 1) === 0) {
      var j = i;
      var k = i | step_t;
      var tmp = qreg.state[j];
      qreg.state[j] = qreg.state[k];
      qreg.state[k] = tmp;
    }
  }
}

// ─── Pre-built circuits ───

var Algorithms = {
  // Bell state: |00⟩ → (|00⟩ + |11⟩)/√2
  bell: function() {
    return new Circuit(2).h(0).cx(0, 1);
  },

  // GHZ state: n-qubit entanglement
  ghz: function(n) {
    var c = new Circuit(n);
    c.h(0);
    for (var i = 1; i < n; i++) c.cx(0, i);
    return c;
  },

  // Quantum teleportation circuit
  teleport: function() {
    var c = new Circuit(3);
    // Create Bell pair between q1 and q2
    c.h(1).cx(1, 2);
    // Alice's operations (q0 is the qubit to teleport)
    c.cx(0, 1).h(0);
    // Measure q0 and q1
    c.measure(0).measure(1);
    // Bob's corrections (classically controlled — simplified)
    c.cx(1, 2).cz(0, 2);
    return c;
  },

  // Deutsch-Jozsa: determine if function is constant or balanced
  deutschJozsa: function(n, oracle) {
    // oracle is 'constant0', 'constant1', or 'balanced'
    var c = new Circuit(n + 1);
    // Prepare ancilla in |1⟩
    c.x(n);
    // Hadamard all
    for (var i = 0; i <= n; i++) c.h(i);
    // Oracle
    if (oracle === 'balanced') {
      for (var i = 0; i < n; i++) c.cx(i, n);
    } else if (oracle === 'constant1') {
      c.x(n);
    }
    // Hadamard input qubits
    for (var i = 0; i < n; i++) c.h(i);
    c.measureAll();
    return c;
  },

  // Quantum Fourier Transform
  qft: function(n) {
    var c = new Circuit(n);
    for (var i = 0; i < n; i++) {
      c.h(i);
      for (var j = i + 1; j < n; j++) {
        c.cp(j, i, Math.PI / (1 << (j - i)));
      }
    }
    // Swap for bit reversal
    for (var i = 0; i < Math.floor(n / 2); i++) {
      c.swap(i, n - 1 - i);
    }
    return c;
  },

  // Grover's search (2 qubits, searching for target state)
  grover2: function(target) {
    // target = 0,1,2,3 — which state to find
    var c = new Circuit(2);
    // Superposition
    c.h(0).h(1);
    // One Grover iteration is optimal for 2 qubits
    // Oracle: flip phase of target
    if (target === 3) { c.cz(0, 1); }
    else if (target === 0) { c.x(0).x(1).cz(0,1).x(0).x(1); }
    else if (target === 1) { c.x(0).cz(0,1).x(0); }
    else if (target === 2) { c.x(1).cz(0,1).x(1); }
    // Diffusion
    c.h(0).h(1).x(0).x(1).cz(0,1).x(0).x(1).h(0).h(1);
    c.measureAll();
    return c;
  },

  // Superdense coding: send 2 classical bits with 1 qubit
  superdense: function(bits) {
    // bits = '00', '01', '10', '11'
    var c = new Circuit(2);
    // Create Bell pair
    c.h(0).cx(0, 1);
    // Alice encodes 2 bits on her qubit (q0)
    if (bits[1] === '1') c.x(0);
    if (bits[0] === '1') c.z(0);
    // Bob decodes
    c.cx(0, 1).h(0);
    c.measureAll();
    return c;
  }
};

// ─── Entanglement measures ───

function vonNeumannEntropy(qreg, subsystem) {
  // Partial trace over complement of subsystem
  // Returns entanglement entropy in bits
  var n = qreg.n;
  var sub_size = 1 << subsystem.length;
  var comp = [];
  for (var i = 0; i < n; i++) {
    if (subsystem.indexOf(i) === -1) comp.push(i);
  }
  var comp_size = 1 << comp.length;

  // Build reduced density matrix (diagonal for quick entropy estimate)
  var rho_diag = new Array(sub_size);
  for (var i = 0; i < sub_size; i++) rho_diag[i] = 0;

  for (var i = 0; i < qreg.size; i++) {
    var sub_idx = 0;
    for (var b = 0; b < subsystem.length; b++) {
      sub_idx |= (((i >> subsystem[b]) & 1) << b);
    }
    rho_diag[sub_idx] += cabs2(qreg.state[i]);
  }

  // Shannon entropy of diagonal
  var S = 0;
  for (var i = 0; i < sub_size; i++) {
    if (rho_diag[i] > 1e-15) S -= rho_diag[i] * Math.log2(rho_diag[i]);
  }
  return S;
}

// ─── K-bridge: coupling constant connects to decoherence ───

function decohere(qreg, K, dt) {
  // Apply decoherence as random phase noise scaled by 1/K
  // High K = strong coupling = maintains coherence
  // Low K = weak coupling = phases randomize
  if (K > 1.868) K = 1.868; // ceiling
  var noise = (1.868 - K) / 1.868; // 0 at max K, 1 at K=0
  for (var i = 0; i < qreg.size; i++) {
    var phase_noise = (Math.random() - 0.5) * noise * dt * Math.PI;
    qreg.state[i] = cmul(qreg.state[i], cexp(phase_noise));
  }
  // Amplitude damping toward |0⟩
  var damping = noise * dt * 0.1;
  for (var i = 1; i < qreg.size; i++) {
    var leak = cscale(qreg.state[i], damping);
    qreg.state[0] = cadd(qreg.state[0], leak);
    qreg.state[i] = cscale(qreg.state[i], 1 - damping);
  }
  // Renormalize
  var norm = 0;
  for (var i = 0; i < qreg.size; i++) norm += cabs2(qreg.state[i]);
  if (norm > 1e-15) {
    var s = 1 / Math.sqrt(norm);
    for (var i = 0; i < qreg.size; i++) qreg.state[i] = cscale(qreg.state[i], s);
  }
  return qreg;
}

// ─── Public API ───

return {
  // Core
  Qubit: Qubit,
  Circuit: Circuit,
  Gates: Gates,

  // Algorithms
  Algorithms: Algorithms,

  // Analysis
  entropy: vonNeumannEntropy,
  decohere: decohere,

  // Complex arithmetic (exposed for advanced use)
  C: C, cadd: cadd, csub: csub, cmul: cmul, cabs: cabs, cexp: cexp,

  // Quick helpers
  bell: function() { return Algorithms.bell().statevector(); },
  ghz: function(n) { return Algorithms.ghz(n).statevector(); },
  grover: function(target) { return Algorithms.grover2(target).run(1000); },
  qft: function(n) { return Algorithms.qft(n); },

  // Info
  version: '1.0',
  about: 'Quantum computation from K. No server. No framework. Pure math.'
};

})();
