// GAVANA cinematic intro — sound design, synthesized live with Web Audio.
// Ported unchanged from the owner's canvas intro (gavana-cinematic-intro.html);
// the picture is now a Blender-rendered video (tools/blender/intro.py) on the
// same 8-second timeline, so schedule(run, T0) lines up with video time 0.
// Client-only; create it inside a user gesture (browsers block audio otherwise).

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);

// Same timeline constants and wordmark layout as the video.
const HT = 4.67, LOGO_T = 7.22, SETTLE0 = 5.42;
const GLYPH_W = { G: 170, A: 180, V: 184, N: 168 };
const LS = 0.82, GAP = 22, WORD_CX = 70;
const LET = (() => {
  const word = "GAVANA";
  const total = [...word].reduce((s, c) => s + GLYPH_W[c], 0) + GAP * (word.length - 1);
  let x = WORD_CX - (total * LS) / 2;
  return [...word].map((ch) => { const L = { ch, w: GLYPH_W[ch], x }; x += (GLYPH_W[ch] + GAP) * LS; return L; });
})();
const WORD_LEFT = LET[0].x;

const A = { ctx: null, run: null, muted: false };
function impulse(sec, decay) {
  const c = A.ctx, rate = c.sampleRate, len = (rate * sec) | 0, buf = c.createBuffer(2, len, rate);
  const fade = rate * 0.012;
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < fade ? i / fade : 1);
  }
  return buf;
}
function ensureAudio() {
  if (A.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try { A.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { A.ctx = new AC(); } catch (e2) { A.ctx = null; return; } }
  const c = A.ctx;
  A.comp = c.createDynamicsCompressor();
  A.comp.threshold.value = -16; A.comp.knee.value = 10; A.comp.ratio.value = 4;
  A.comp.attack.value = 0.002; A.comp.release.value = 0.22;
  A.master = c.createGain(); A.master.gain.value = A.muted ? 0 : 0.9;
  A.comp.connect(A.master); A.master.connect(c.destination);
  A.verb = c.createConvolver(); A.verb.buffer = impulse(2.8, 3.2);
  A.verbLP = c.createBiquadFilter(); A.verbLP.type = 'lowpass'; A.verbLP.frequency.value = 4200;
  A.verbOut = c.createGain(); A.verbOut.gain.value = 0.55;
  A.verb.connect(A.verbLP); A.verbLP.connect(A.verbOut); A.verbOut.connect(A.comp);
  const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  A.noise = nb;
}
function unlockAudio() {
  try { const b = A.ctx.createBuffer(1, 1, 22050), s = A.ctx.createBufferSource(); s.buffer = b; s.connect(A.ctx.destination); s.start(0); } catch (e) {}
}
function makeRun() {
  const dry = A.ctx.createGain(), wet = A.ctx.createGain();
  dry.connect(A.comp); wet.connect(A.verb);
  return { dry, wet };
}
function killRun(R) {
  const n = A.ctx.currentTime;
  try { R.dry.gain.setTargetAtTime(0, n, 0.015); R.wet.gain.setTargetAtTime(0, n, 0.015); } catch (e) {}
  setTimeout(() => { try { R.dry.disconnect(); R.wet.disconnect(); } catch (e) {} }, 260);
}
const gainN = v => { const n = A.ctx.createGain(); n.gain.value = v; return n; };
function envG(gn, T, a, peak, d) {
  gn.gain.setValueAtTime(0, T);
  gn.gain.linearRampToValueAtTime(peak, T + a);
  gn.gain.exponentialRampToValueAtTime(0.0001, T + a + d);
}
function out(node, R, pan, wet) {
  let last = node;
  if (pan && A.ctx.createStereoPanner) { const p = A.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); last = p; }
  last.connect(R.dry);
  if (wet > 0) { const w = gainN(wet); last.connect(w); w.connect(R.wet); }
}
function tone(R, T, type, f0, f1, glide, a, d, peak, pan = 0, wet = 0) {
  const o = A.ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, T);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, T + glide);
  const gn = gainN(0); envG(gn, T, a, peak, d);
  o.connect(gn); out(gn, R, pan, wet);
  o.start(T); o.stop(T + a + d + 0.05);
}
function noise(R, T, dur, ft, f0, f1, q, a, d, peak, pan = 0, wet = 0, panTo) {
  const c = A.ctx, s = c.createBufferSource(); s.buffer = A.noise; s.loop = true;
  const f = c.createBiquadFilter(); f.type = ft; f.Q.value = q;
  f.frequency.setValueAtTime(f0, T);
  if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, T + dur);
  const gn = gainN(0); envG(gn, T, a, peak, d);
  s.connect(f); f.connect(gn);
  let node = gn;
  if (panTo !== undefined && c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.setValueAtTime(clamp(pan, -1, 1), T); p.pan.linearRampToValueAtTime(clamp(panTo, -1, 1), T + a + d);
    gn.connect(p); node = p; pan = 0;
  }
  out(node, R, pan, wet);
  s.start(T, Math.random() * 1.5); s.stop(T + Math.max(dur, a + d) + 0.05);
}
function metal(R, T, base, ratios, gains, decays, mul, pan, wet, a = 0.002) {
  ratios.forEach((r, i) => tone(R, T, 'sine', base * r, 0, 0, a, decays[i], gains[i] * mul, pan, wet));
}
const panX = x => clamp(x / 800, -0.9, 0.9);

function sClunk(R, T, s) {
  tone(R, T, 'sine', 120, 42, 0.14, 0.004, 0.22, 0.55 * s, 0, 0.25);
  noise(R, T, 0.03, 'bandpass', 2600, 2600, 0.9, 0.002, 0.03, 0.22 * s, 0, 0.2);
  noise(R, T, 0.25, 'lowpass', 260, 120, 0.7, 0.005, 0.25, 0.18 * s, 0, 0.3);
}
function sBed(R, T) {
  const c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator();
  o.type = 'sine'; o.frequency.value = 36.71; o2.type = 'triangle'; o2.frequency.value = 73.42;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
  const g2 = gainN(0.35), gn = gainN(0);
  gn.gain.setValueAtTime(0, T); gn.gain.linearRampToValueAtTime(0.32, T + 1.0);
  gn.gain.linearRampToValueAtTime(0.14, T + 2.2); gn.gain.setValueAtTime(0.14, T + 6.9);
  gn.gain.linearRampToValueAtTime(0.0, T + 7.24);
  o.connect(gn); o2.connect(g2); g2.connect(lp); lp.connect(gn);
  out(gn, R, 0, 0.1);
  o.start(T); o2.start(T); o.stop(T + 7.4); o2.stop(T + 7.4);
}
function sFoot(R, T, s, pan) {
  tone(R, T, 'sine', 100, 46, 0.09, 0.003, 0.12, 0.5 * s, pan, 0.12);
  noise(R, T, 0.05, 'lowpass', 800, 300, 0.7, 0.002, 0.06, 0.22 * s, pan, 0.1);
  noise(R, T + 0.004, 0.03, 'bandpass', 1700, 1700, 2.2, 0.001, 0.035, 0.08 * s, pan, 0.1);
}
function sCreak(R, T, dur, s, pan) {
  const c = A.ctx, o = c.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(34, T); o.frequency.linearRampToValueAtTime(52, T + dur * 0.5); o.frequency.linearRampToValueAtTime(30, T + dur);
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 5;
  const gn = gainN(0);
  gn.gain.setValueAtTime(0, T); gn.gain.linearRampToValueAtTime(0.09 * s, T + dur * 0.3);
  gn.gain.linearRampToValueAtTime(0.05 * s, T + dur * 0.7); gn.gain.linearRampToValueAtTime(0, T + dur);
  o.connect(bp); bp.connect(gn); out(gn, R, pan, 0.15);
  o.start(T); o.stop(T + dur + 0.05);
  noise(R, T, dur, 'bandpass', 2200, 3000, 2.5, dur * 0.4, dur * 0.6, 0.035 * s, pan, 0.1);
}
function sWhoosh(R, T, dur, s, p0, p1, f0 = 450, f1 = 2600) {
  noise(R, T, dur, 'bandpass', f0, f1, 1.0, dur * 0.6, dur * 0.55, 0.42 * s, p0, 0.15, p1);
  noise(R, T, dur, 'lowpass', 300, 300, 0.7, dur * 0.6, dur * 0.5, 0.15 * s, p0, 0.05, p1);
}
function sPunch(R, T, s, pan) {
  tone(R, T, 'sine', 165, 52, 0.13, 0.002, 0.2, 0.75 * s, pan, 0.12);
  noise(R, T, 0.05, 'lowpass', 4200, 1800, 0.7, 0.001, 0.07, 0.55 * s, pan, 0.15);
  noise(R, T, 0.12, 'bandpass', 420, 300, 1.2, 0.002, 0.13, 0.4 * s, pan, 0.15);
  metal(R, T + 0.003, 196, [1, 2.32, 4.25, 6.63], [0.07, 0.045, 0.03, 0.016], [0.9, 0.7, 0.5, 0.32], s, pan, 0.45);
}
function sBigImpact(R, T) {
  noise(R, T - 0.34, 0.34, 'lowpass', 160, 3000, 0.8, 0.33, 0.03, 0.22, -0.6, 0.2);
  tone(R, T, 'sine', 82, 26, 1.1, 0.003, 1.7, 1.0, 0, 0.15);
  tone(R, T, 'triangle', 180, 55, 0.2, 0.002, 0.25, 0.6, -0.4, 0.1);
  noise(R, T, 0.5, 'lowpass', 380, 90, 0.8, 0.003, 0.55, 0.8, -0.3, 0.3);
  noise(R, T, 0.06, 'highpass', 1400, 1400, 0.7, 0.001, 0.07, 0.55, -0.45, 0.2);
  metal(R, T, 98, [1, 2.02, 2.74, 3.93, 5.41, 7.1], [0.12, 0.08, 0.06, 0.04, 0.025, 0.015], [3.0, 2.4, 2.0, 1.5, 1.1, 0.8], 1, -0.2, 0.8);
  noise(R, T + 0.02, 0.7, 'bandpass', 1400, 180, 0.9, 0.05, 0.65, 0.22, -0.7, 0.5, 0.8);
}
function sLock(R, T, pan, i) {
  tone(R, T, 'sine', 2600 + i * 90, 0, 0, 0.001, 0.05, 0.05, pan, 0.25);
  noise(R, T, 0.015, 'bandpass', 5200, 5200, 2, 0.001, 0.014, 0.09, pan, 0.15);
  tone(R, T, 'sine', 240, 180, 0.04, 0.001, 0.06, 0.09, pan, 0.05);
}
function sSweep(R, T, dur) {
  const c = A.ctx, lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4;
  lp.frequency.setValueAtTime(260, T); lp.frequency.exponentialRampToValueAtTime(2400, T + dur * 0.6);
  lp.frequency.exponentialRampToValueAtTime(500, T + dur + 0.4);
  const gn = gainN(0);
  gn.gain.setValueAtTime(0, T); gn.gain.linearRampToValueAtTime(0.07, T + dur * 0.5); gn.gain.linearRampToValueAtTime(0, T + dur + 0.35);
  lp.connect(gn);
  let node = gn;
  if (c.createStereoPanner) {
    const p = c.createStereoPanner(); p.pan.setValueAtTime(-0.7, T); p.pan.linearRampToValueAtTime(0.7, T + dur);
    gn.connect(p); node = p;
  }
  out(node, R, 0, 0.5);
  [146.83, 220, 293.66].forEach(f => [-9, 9].forEach(dt => {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt;
    o.connect(lp); o.start(T); o.stop(T + dur + 0.5);
  }));
  tone(R, T + dur * 0.3, 'sine', 1174.66, 0, 0, 0.25, 0.9, 0.014, 0.3, 0.7);
}
function sLogo(R, T) {
  const c = A.ctx;
  tone(R, T, 'sine', 64, 31, 1.3, 0.003, 1.8, 0.95, 0, 0.15);
  noise(R, T, 0.35, 'lowpass', 600, 100, 0.8, 0.002, 0.4, 0.55, 0, 0.35);
  noise(R, T, 0.04, 'highpass', 2000, 2000, 0.7, 0.001, 0.045, 0.35, 0, 0.2);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(3200, T); lp.frequency.exponentialRampToValueAtTime(380, T + 1.6);
  const gn = gainN(0);
  gn.gain.setValueAtTime(0, T); gn.gain.linearRampToValueAtTime(0.13, T + 0.012);
  gn.gain.exponentialRampToValueAtTime(0.05, T + 0.5); gn.gain.exponentialRampToValueAtTime(0.0001, T + 2.6);
  lp.connect(gn); out(gn, R, 0, 0.45);
  [73.42, 110, 146.83, 220].forEach(f => [-7, 7].forEach(dt => {
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt;
    o.connect(lp); o.start(T); o.stop(T + 2.7);
  }));
  metal(R, T + 0.01, 587.33, [1, 2, 2.76, 4.07, 5.4], [0.045, 0.03, 0.022, 0.012, 0.007], [2.6, 2.0, 1.5, 1.0, 0.7], 1, 0.15, 0.75, 0.003);
  tone(R, T + 0.4, 'sine', 36.71, 0, 0, 0.3, 2.2, 0.18, 0, 0.1);
}

function schedule(R, T0) {
  const at = s => T0 + s;
  const gp = panX(-520), lp = panX(WORD_LEFT + 60);
  sBed(R, at(0));
  noise(R, at(0), 1.0, 'lowpass', 140, 1500, 0.6, 0.85, 0.5, 0.07, 0, 0.5);
  sClunk(R, at(0.18), 1.0);
  sClunk(R, at(0.30), 0.8);
  LET.forEach((L, i) => metal(R, at(0.42 + i * 0.085), 880 + i * 41, [1, 2.76, 5.4], [0.022, 0.012, 0.006], [1.6, 1.0, 0.6], 1, panX(L.x + 70), 0.7, 0.03));
  [[1.00, 1.28, -860, 0.7], [1.32, 1.60, -734, 0.75], [1.64, 1.92, -598, 0.95]].forEach(([a, b, x, s]) => {
    sWhoosh(R, at(a), 0.18, 0.22, panX(x), panX(x + 120), 300, 1200);
    sFoot(R, at(b), s, panX(x + 130));
  });
  sCreak(R, at(2.06), 0.14, 0.5, gp);
  sFoot(R, at(2.58), 0.35, gp);
  sFoot(R, at(2.70), 0.32, gp);
  sCreak(R, at(2.80), 0.22, 1.0, gp);
  sWhoosh(R, at(3.04), 0.13, 0.85, gp - 0.1, lp);
  sPunch(R, at(3.11), 0.75, lp);
  sCreak(R, at(3.39), 0.10, 0.5, gp);
  sWhoosh(R, at(3.47), 0.15, 1.0, gp - 0.12, lp);
  sPunch(R, at(3.552), 1.0, lp);
  sCreak(R, at(4.02), 0.24, 1.1, gp);
  sFoot(R, at(4.25), 0.6, gp);
  sWhoosh(R, at(4.25), 0.32, 0.6, gp, gp, 200, 1100);
  sWhoosh(R, at(4.57), 0.11, 1.25, gp - 0.1, lp);
  sBigImpact(R, at(HT));
  sFoot(R, at(5.05), 1.2, panX(-548));
  sCreak(R, at(5.08), 0.12, 0.6, panX(-548));
  LET.forEach((L, i) => sLock(R, at(SETTLE0 + 0.4 + i * 0.06), panX(L.x + 70), i));
  sSweep(R, at(6.10), 0.9);
  sFoot(R, at(6.28), 0.35, gp);
  sWhoosh(R, at(7.0), 0.2, 0.35, gp, gp, 300, 1400);
  sFoot(R, at(LOGO_T), 0.9, gp);
  sLogo(R, at(LOGO_T));
}

/** Start the intro soundtrack `lead` seconds from now (aligned with video time 0). */
export function playIntroSound(lead = 0.08) {
  ensureAudio();
  if (!A.ctx) return null;
  unlockAudio();
  if (A.ctx.state !== "running") { const p = A.ctx.resume(); if (p && p.catch) p.catch(() => {}); }
  if (A.run) killRun(A.run);
  A.run = makeRun();
  schedule(A.run, A.ctx.currentTime + lead);
  return A.ctx;
}
export function stopIntroSound() { if (A.ctx && A.run) { killRun(A.run); A.run = null; } }
export function pauseIntroSound() { if (A.ctx && A.ctx.state === "running") A.ctx.suspend(); }
export function resumeIntroSound() { if (A.ctx && A.ctx.state === "suspended") A.ctx.resume(); }
export function setIntroMuted(m) {
  A.muted = !!m;
  if (A.ctx && A.master) A.master.gain.setTargetAtTime(A.muted ? 0 : 0.9, A.ctx.currentTime, 0.03);
}
