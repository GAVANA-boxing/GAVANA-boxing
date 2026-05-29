/**
 * Intent-Based Combo Sequencer
 *
 * Architecture: Pose → Punch Detection → Punch Events Stream → ComboSequencer → Combat Intelligence
 *
 * Intent-based means: combo continues while the previous punch's recovery is
 * not complete. If the next valid strike arrives before recoilMs has elapsed,
 * it is chained into the same combo — NOT a fixed timer window.
 *
 * Gate = min(prevPunch.recoilMs + BUFFER, HARD_CEILING)
 * Fast boxer (short recoil) → tighter window. Slower boxer → wider window.
 */

// ── Timing constants ──────────────────────────────────────────────────────────
const COMBO_BUFFER_MS   = 150;  // grace on top of recoilMs before breaking combo
const COMBO_MAX_GAP_MS  = 900;  // hard ceiling — any gap > 900ms breaks combo
const COMBO_MIN_GAP_MS  = 150;  // floor — ignore suspicious same-punch duplicates
const NOMINAL_RECOIL_MS = 500;  // default when recoilMs unavailable (state timeout)
const COMBO_MIN_LENGTH  = 2;    // minimum punches to record as a completed combo

// ── Pattern dictionary — longest first so first match wins ───────────────────
// Extensible: add new patterns here, no logic changes needed elsewhere.
const PATTERNS = [
  { seq: ["jab", "cross", "hook", "cross"],  name: "1-2-3-2"     },
  { seq: ["jab", "cross", "hook", "hook"],   name: "1-2-3-3"     },
  { seq: ["jab", "jab",  "cross", "hook"],   name: "1-1-2-3"     },
  { seq: ["jab", "cross", "hook"],           name: "1-2-3"       },
  { seq: ["jab", "jab",  "cross"],           name: "1-1-2"       },
  { seq: ["cross", "hook", "cross"],         name: "2-3-2"       },
  { seq: ["hook", "cross", "hook"],          name: "3-2-3"       },
  { seq: ["jab", "cross"],                   name: "1-2"         },
  { seq: ["jab", "jab"],                     name: "double jab"  },
  { seq: ["cross", "hook"],                  name: "2-3"         },
  { seq: ["hook", "cross"],                  name: "3-2"         },
  { seq: ["hook", "hook"],                   name: "double hook" },
];

const TYPE_NUM = { jab: "1", cross: "2", hook: "3", uppercut: "4" };

function _matchPattern(types) {
  for (const { seq, name } of PATTERNS) {
    if (seq.length > types.length) continue;
    const tail = types.slice(-seq.length);
    if (tail.every((t, i) => t === seq[i])) return name;
  }
  return types.map((t) => TYPE_NUM[t] ?? "?").join("-");
}

function _timingCoach(avgGapMs, length) {
  if (length < 2) return null;
  if (avgGapMs < 250) return "Lightning rhythm";
  if (avgGapMs < 380) return "Excellent speed";
  if (avgGapMs < 520) return "Clean combo";
  if (avgGapMs < 700) return "Push the pace";
  return "Drill faster transitions";
}

// ── Public API ────────────────────────────────────────────────────────────────

export class ComboSequencer {
  constructor() {
    this._buffer         = [];  // current active punch sequence
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

  // Feed a new punch event. Called from detection loop for each new event.
  addPunch(event) {
    const last = this._buffer[this._buffer.length - 1];

    if (last) {
      const gap    = event.ts - last.ts;
      const recoil = last.recoilMs ?? NOMINAL_RECOIL_MS;
      const gate   = Math.min(recoil + COMBO_BUFFER_MS, COMBO_MAX_GAP_MS);

      if (gap > gate || gap < COMBO_MIN_GAP_MS) {
        // Combo broken — record what we have before starting fresh
        this._finalize();
        this._buffer = [];
      }
    }

    this._buffer.push(event);
  }

  // Call each detection frame — expires a stalled combo when no new punch arrives in time.
  tick(now = Date.now()) {
    if (!this._buffer.length) return;
    const last   = this._buffer[this._buffer.length - 1];
    const gap    = now - last.ts;
    const recoil = last.recoilMs ?? NOMINAL_RECOIL_MS;
    const gate   = Math.min(recoil + COMBO_BUFFER_MS, COMBO_MAX_GAP_MS);
    if (gap > gate) {
      this._finalize();
      this._buffer = [];
    }
  }

  // Call at session end to flush any open combo into history.
  finalize() {
    this._finalize();
    this._buffer = [];
  }

  // Live snapshot — current building combo (null if empty).
  getCurrentCombo() {
    if (!this._buffer.length) return null;
    const types  = this._buffer.map((e) => e.type);
    const name   = this._buffer.length >= 2 ? _matchPattern(types) : null;
    const gaps   = [];
    for (let i = 1; i < this._buffer.length; i++) gaps.push(this._buffer[i].ts - this._buffer[i - 1].ts);
    const avgGapMs = gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;
    return { length: this._buffer.length, types, name, avgGapMs };
  }

  // Session summary stats.
  getStats() {
    const cur            = this.getCurrentCombo();
    const inProgCount    = (cur?.length ?? 0) >= COMBO_MIN_LENGTH ? 1 : 0;
    const inProgMaxLen   = cur?.length ?? 0;
    return {
      comboCount:     this._comboCount + inProgCount,
      maxComboLength: Math.max(this._maxComboLength, inProgMaxLen),
      sessionCombos:  [...this._sessionCombos],
      currentCombo:   cur,
      lastCombo:      this._sessionCombos[this._sessionCombos.length - 1] ?? null,
    };
  }

  _finalize() {
    if (this._buffer.length < COMBO_MIN_LENGTH) return;
    const types    = this._buffer.map((e) => e.type);
    const name     = _matchPattern(types);
    const gaps     = [];
    for (let i = 1; i < this._buffer.length; i++) gaps.push(this._buffer[i].ts - this._buffer[i - 1].ts);
    const avgGapMs = gaps.length ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;

    const combo = {
      length:   this._buffer.length,
      types,
      name,
      avgGapMs,
      coaching: _timingCoach(avgGapMs, this._buffer.length),
      startTs:  this._buffer[0].ts,
      endTs:    this._buffer[this._buffer.length - 1].ts,
    };

    this._comboCount++;
    if (combo.length > this._maxComboLength) this._maxComboLength = combo.length;
    this._sessionCombos.push(combo);
  }
}
