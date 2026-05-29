/**
 * Intent-Based Combo Sequencer with Validation + Quality Scoring
 *
 * Architecture: Pose → Punch Detection → Punch Events → ComboSequencer → Combat Intelligence
 *
 * Intent gate: combo continues while prevPunch.recoilMs has not elapsed.
 * Fast boxer (short recoil) → tighter window. Slower boxer → wider window.
 *
 * Extensibility hooks (for future phases):
 *   - PATTERNS: add { seq, name, category } — no logic changes needed
 *   - category field: "pressure" | "counter" | "defensive" | null
 *   - combo.validation.issues: array, can gate defensive-reaction windows
 *   - combo.quality scores: feed directly into counter-window detection
 */

// ── Timing ────────────────────────────────────────────────────────────────────
const COMBO_BUFFER_MS   = 150;   // grace window added to recoilMs
const COMBO_MAX_GAP_MS  = 900;   // hard ceiling
const COMBO_MIN_GAP_MS  = 150;   // dedup floor
const NOMINAL_RECOIL_MS = 500;   // fallback when recoilMs unavailable
const COMBO_MIN_LENGTH  = 2;

// ── Quality thresholds ────────────────────────────────────────────────────────
const FEINT_CONF_THRESH = 0.40;  // punch confidence below this = likely feint
const GOOD_RECOIL_MS    = 300;   // excellent recovery
const OK_RECOIL_MS      = 500;   // acceptable recovery

// ── Pattern dictionary — longest first so first match wins ───────────────────
// category: "pressure" = forward combos, "counter" = reactive combos
// Future: add "defensive", "slipping", "pull-counter" etc.
const PATTERNS = [
  { seq: ["jab","cross","hook","cross"],  name: "1-2-3-2",     category: "pressure" },
  { seq: ["jab","cross","hook","hook"],   name: "1-2-3-3",     category: "pressure" },
  { seq: ["jab","jab","cross","hook"],    name: "1-1-2-3",     category: "pressure" },
  { seq: ["jab","cross","hook"],          name: "1-2-3",       category: "pressure" },
  { seq: ["jab","jab","cross"],           name: "1-1-2",       category: "pressure" },
  { seq: ["cross","hook","cross"],        name: "2-3-2",       category: "counter"  },
  { seq: ["hook","cross","hook"],         name: "3-2-3",       category: "counter"  },
  { seq: ["jab","cross"],                 name: "1-2",         category: "pressure" },
  { seq: ["jab","jab"],                   name: "double jab",  category: "pressure" },
  { seq: ["cross","hook"],                name: "2-3",         category: "pressure" },
  { seq: ["hook","cross"],                name: "3-2",         category: "counter"  },
  { seq: ["hook","hook"],                 name: "double hook", category: "counter"  },
];

const TYPE_NUM = { jab: "1", cross: "2", hook: "3", uppercut: "4" };

function _matchPattern(types) {
  for (const { seq, name, category } of PATTERNS) {
    if (seq.length > types.length) continue;
    const tail = types.slice(-seq.length);
    if (tail.every((t, i) => t === seq[i])) return { name, category };
  }
  return { name: types.map((t) => TYPE_NUM[t] ?? "?").join("-"), category: null };
}

// ── Quality scoring ───────────────────────────────────────────────────────────

function _scoreQuality(buffer, gaps) {
  if (gaps.length === 0) return { smoothness: 100, recovery: 100, continuity: 100, rhythm: 100, overall: 100 };

  const meanGap  = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  const variance = gaps.reduce((s, g) => s + (g - meanGap) ** 2, 0) / gaps.length;
  const stdDev   = Math.sqrt(variance);
  const cv       = meanGap > 0 ? stdDev / meanGap : 0;

  // Rhythm: how consistent inter-punch timing is (low CV = high score)
  const rhythm = Math.round(Math.max(0, Math.min(100, 100 - cv * 120)));

  // Smoothness: penalty for the single worst transition deviation
  const maxDev   = gaps.reduce((m, g) => Math.max(m, Math.abs(g - meanGap)), 0);
  const smoothness = Math.round(Math.max(0, Math.min(100, 100 - (maxDev / Math.max(meanGap, 1)) * 80)));

  // Recovery: average recoilMs of all punches except the last (still recovering)
  const recoilSamples = buffer.slice(0, -1).map((e) => e.recoilMs ?? NOMINAL_RECOIL_MS);
  let recovery = 70;
  if (recoilSamples.length) {
    const avgRecoil = recoilSamples.reduce((s, r) => s + r, 0) / recoilSamples.length;
    recovery = avgRecoil <= GOOD_RECOIL_MS ? 95
             : avgRecoil <= OK_RECOIL_MS   ? 75
             : avgRecoil <= 700            ? 50 : 25;
  }

  // Continuity: how close each gap was to breaking the combo (gap/gate ratio)
  const contScores = buffer.slice(1).map((_, i) => {
    const recoil = buffer[i].recoilMs ?? NOMINAL_RECOIL_MS;
    const gate   = Math.min(recoil + COMBO_BUFFER_MS, COMBO_MAX_GAP_MS);
    const ratio  = gaps[i] / gate;
    return ratio < 0.50 ? 100 : ratio < 0.70 ? 80 : ratio < 0.85 ? 60 : ratio < 0.95 ? 40 : 20;
  });
  const continuity = contScores.length
    ? Math.round(contScores.reduce((s, v) => s + v, 0) / contScores.length)
    : 100;

  const overall = Math.round(smoothness * 0.20 + recovery * 0.30 + continuity * 0.25 + rhythm * 0.25);
  return { smoothness, recovery, continuity, rhythm, overall };
}

// ── Confidence ────────────────────────────────────────────────────────────────

function _computeConfidence(buffer, quality) {
  const avgPunchConf = buffer.reduce((s, e) => s + (e.confidence ?? 0.70), 0) / buffer.length;
  const raw = avgPunchConf * 0.50 + (quality.rhythm / 100) * 0.30 + (quality.continuity / 100) * 0.20;
  return Math.round(Math.max(0, Math.min(1, raw)) * 100) / 100;
}

// ── Validation ────────────────────────────────────────────────────────────────

function _validate(buffer, quality) {
  const issues = [];
  const feints = buffer.filter((e) => (e.confidence ?? 1) < FEINT_CONF_THRESH);
  if (feints.length >= Math.ceil(buffer.length / 2)) issues.push("likely_feints");
  else if (feints.length > 0)                         issues.push("low_conf_punch");
  if (quality.rhythm < 30)                            issues.push("inconsistent_rhythm");
  return { valid: issues.length === 0, issues };
}

// ── Coaching ──────────────────────────────────────────────────────────────────

function _generateCoaching(buffer, gaps, quality) {
  const types   = buffer.map((e) => e.type);
  const meanGap = gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : 0;
  const msgs    = [];

  // Positive: excellent rhythm first — skip negatives when quality is high
  // Thresholds account for 10fps detection lag: real 300ms combo → detected ~400ms gap
  if (quality.rhythm >= 85 && meanGap < 500 && quality.overall >= 75) {
    return ["Excellent rhythm"];
  }
  if (quality.overall >= 70 && quality.continuity >= 70 && meanGap < 650) {
    return ["Good flow between punches"];
  }

  // Pattern-specific: jab → cross transition
  // 680ms accounts for detection overhead on top of real throw timing
  if (types.length >= 2 && gaps.length >= 1 && types[0] === "jab" && types[1] === "cross" && gaps[0] > 680) {
    msgs.push("Cross arrives too late after jab");
  }

  // Last-transition disconnect: final punch arrives much later than the mean
  if (gaps.length >= 2) {
    const lastGap = gaps[gaps.length - 1];
    if (lastGap > meanGap * 1.65 && lastGap > 600) {
      const t     = types[types.length - 1];
      const label = t.charAt(0).toUpperCase() + t.slice(1);
      msgs.push(`${label} disconnects from combo`);
    }
  }

  // Rhythm and recovery
  if (quality.rhythm < 45 && !msgs.some((m) => m.includes("rhythm"))) {
    msgs.push("Work on rhythm consistency");
  } else if (quality.rhythm < 68 && msgs.length === 0) {
    msgs.push("Tighten the transitions");
  }
  if (quality.recovery < 40 && msgs.length < 2) {
    msgs.push("Snap back to guard faster");
  }
  if (quality.continuity < 45 && msgs.length === 0) {
    msgs.push("Push the pace — nearly broke the combo");
  }

  return msgs.slice(0, 2);
}

// ── Public API ────────────────────────────────────────────────────────────────

export class ComboSequencer {
  constructor() {
    this._buffer         = [];
    this._comboCount     = 0;
    this._maxComboLength = 0;
    this._sessionCombos  = [];
  }

  reset() {
    this._buffer         = [];
    this._comboCount     = 0;
    this._maxComboLength = 0;
    this._sessionCombos  = [];
  }

  addPunch(event) {
    const last = this._buffer[this._buffer.length - 1];
    if (last) {
      const gap   = event.ts - last.ts;
      const gate  = Math.min((last.recoilMs ?? NOMINAL_RECOIL_MS) + COMBO_BUFFER_MS, COMBO_MAX_GAP_MS);
      if (gap > gate || gap < COMBO_MIN_GAP_MS) {
        this._finalize("gap_exceeded");
        this._buffer = [];
      }
    }
    this._buffer.push(event);
  }

  tick(now = Date.now()) {
    if (!this._buffer.length) return;
    const last = this._buffer[this._buffer.length - 1];
    const gate = Math.min((last.recoilMs ?? NOMINAL_RECOIL_MS) + COMBO_BUFFER_MS, COMBO_MAX_GAP_MS);
    if (now - last.ts > gate) {
      this._finalize("gap_exceeded");
      this._buffer = [];
    }
  }

  finalize() {
    this._finalize("session_end");
    this._buffer = [];
  }

  getCurrentCombo() {
    if (!this._buffer.length) return null;
    const types = this._buffer.map((e) => e.type);
    const { name, category } = this._buffer.length >= 2 ? _matchPattern(types) : { name: null, category: null };
    const gaps = [];
    for (let i = 1; i < this._buffer.length; i++) gaps.push(this._buffer[i].ts - this._buffer[i - 1].ts);
    const avgGapMs = gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;
    return { length: this._buffer.length, types, name, category, avgGapMs };
  }

  getStats() {
    const cur = this.getCurrentCombo();
    return {
      comboCount:     this._comboCount + ((cur?.length ?? 0) >= COMBO_MIN_LENGTH ? 1 : 0),
      maxComboLength: Math.max(this._maxComboLength, cur?.length ?? 0),
      sessionCombos:  [...this._sessionCombos],
      currentCombo:   cur,
      lastCombo:      this._sessionCombos[this._sessionCombos.length - 1] ?? null,
    };
  }

  _finalize(breakReason) {
    if (this._buffer.length < COMBO_MIN_LENGTH) return;

    const types = this._buffer.map((e) => e.type);
    const { name, category } = _matchPattern(types);
    const gaps = [];
    for (let i = 1; i < this._buffer.length; i++) gaps.push(this._buffer[i].ts - this._buffer[i - 1].ts);
    const avgGapMs = gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;

    const quality    = _scoreQuality(this._buffer, gaps);
    const confidence = _computeConfidence(this._buffer, quality);
    const validation = _validate(this._buffer, quality);
    const coaching   = _generateCoaching(this._buffer, gaps, quality);

    const combo = {
      length: this._buffer.length,
      types,
      name,
      category,
      avgGapMs,
      gaps,
      quality,
      confidence,
      validation,
      coaching,
      breakReason,
      startTs: this._buffer[0].ts,
      endTs:   this._buffer[this._buffer.length - 1].ts,
    };

    this._comboCount++;
    if (combo.length > this._maxComboLength) this._maxComboLength = combo.length;
    this._sessionCombos.push(combo);
  }
}
