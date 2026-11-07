"use client";

import { CALLS, handsFor } from "@/lib/mittDrill";
import { loc } from "@/lib/loc";

// The coach's call drawn over the (mirrored) camera picture: pads where the
// punch should land — on the lead or rear side of the screen — or a head
// movement cue, with a ring that empties as the answer window runs out.
// Presentational only; the page decides what is on screen.

const LEAD = "#60A5FA";
const REAR = "#FF3B30";
const DEF = "#67e8f9";

const NAME = {
  "1": ["Жэб", "잽", "Jab"],
  "2": ["Кросс", "크로스", "Cross"],
  "1-1": ["Давхар жэб", "더블 잽", "Double jab"],
  "1-2": ["Жэб – кросс", "잽 – 크로스", "Jab – cross"],
  slip: ["Толгой хажуу тийш", "슬립", "Slip"],
  roll: ["Доош эргэ", "롤", "Roll under"],
};

function Pad({ label, color, left, size = 112, delayNum = null }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill={`${color}40`} stroke="rgba(255,255,255,0.25)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - left)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", fontSize: size * 0.42, fontWeight: 900, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
        {label}
      </div>
      {delayNum != null && (
        <span style={{ position: "absolute", top: -6, right: -6, width: 26, height: 26, borderRadius: "50%", background: "#000", border: `2px solid ${color}`, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>{delayNum}</span>
      )}
    </div>
  );
}

/**
 * @param {{ call: string, left: number }} current  the call on screen (null = none)
 * @param {"orthodox"|"southpaw"} stance
 * @param {{ outcome: "hit"|"wrong"|"miss", reactionMs: number|null } | null} feedback  the last judged call
 */
export default function MittCall({ current, stance = "orthodox", locale = "en", feedback = null }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const def = current ? CALLS[current.call] : null;
  // Selfie view is mirrored, so the user's left hand is on the left of the screen.
  const hands = handsFor(stance);
  const sideOf = (role) => (hands[role] === "left" ? "left" : "right");

  return (
    <div aria-live="polite" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {current && def && (
        <>
          <div data-testid="mitt-call-name" style={{ position: "absolute", top: "18%", left: 0, right: 0, textAlign: "center" }}>
            <span style={{ display: "inline-block", padding: "8px 18px", borderRadius: 999, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.18)", fontSize: 22, fontWeight: 900, letterSpacing: 0.5, color: "#fff" }}>
              {current.call.includes("-") || /^\d$/.test(current.call) ? `${current.call} · ` : ""}{loc(locale, ...NAME[current.call])}
            </span>
          </div>

          {def.kind === "punch" && (() => {
            // Group the sequence by side: "1-2" → lead pad "1", rear pad "2"; "1-1" → lead pad "1 1".
            const pads = { left: [], right: [] };
            def.seq.forEach((role, k) => pads[sideOf(role)].push({ role, n: k + 1 }));
            return ["left", "right"].map((side) => pads[side].length > 0 && (
              <div key={side} style={{ position: "absolute", top: "38%", [side]: "8%" }}>
                <Pad
                  label={pads[side].map((p) => (p.role === "lead" ? "1" : "2")).join(" ")}
                  color={pads[side][0].role === "lead" ? LEAD : REAR}
                  left={current.left}
                  delayNum={def.seq.length > 1 ? pads[side].map((p) => p.n).join("·") : null}
                />
              </div>
            ));
          })()}

          {def.kind !== "punch" && (
            <div style={{ position: "absolute", top: "36%", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <Pad label={def.kind === "slip" ? "⇆" : "⤵"} color={DEF} left={current.left} size={128} />
            </div>
          )}
        </>
      )}

      {feedback && (
        <div data-testid="mitt-feedback" style={{ position: "absolute", bottom: "22%", left: 0, right: 0, textAlign: "center" }}>
          <span style={{
            display: "inline-block", padding: "8px 16px", borderRadius: 999, fontSize: 17, fontWeight: 900,
            background: feedback.outcome === "hit" ? "rgba(52,211,153,0.92)" : "rgba(255,59,48,0.92)", color: feedback.outcome === "hit" ? "#04120c" : "#fff",
          }}>
            {feedback.outcome === "hit"
              ? `✓ ${feedback.reactionMs} ${L("мс", "ms", "ms")}`
              : feedback.outcome === "wrong"
                ? L("Буруу гар / хөдөлгөөн", "다른 손 / 동작", "Wrong hand / move")
                : L("Хоцорлоо", "늦었어요", "Too late")}
          </span>
        </div>
      )}
    </div>
  );
}

export { NAME as MITT_CALL_NAME };
