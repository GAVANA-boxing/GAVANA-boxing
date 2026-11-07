"use client";

import { useMemo, useState } from "react";
import { loc } from "@/lib/loc";
import { RED, GOLD, GREEN, RADIUS, FONT_WEIGHT, whiteAlpha, redAlpha, blackAlpha } from "@/lib/tokens";
import { teardownAll, phaseAt, PHASES } from "@/lib/punchTeardown";
import MotionReplay3D from "@/components/train/MotionReplay3D";

// Punch Teardown: pick one punch from the round and see it taken apart —
// Load → Rotate → Extend → Return in slow 3D, with what a coach measures
// (shoulder / hip turn, elbow, reach, the other hand's guard, return speed).
// The numbers come from lib/punchTeardown.js; this file only draws them.

const PHASE_LABEL = {
  load: ["Бэлтгэл", "장전", "Load"],
  rotate: ["Эргэлт", "회전", "Rotate"],
  extend: ["Сунгалт", "뻗기", "Extend"],
  return: ["Буцаалт", "회수", "Return"],
};
const TYPE_LABEL = {
  jab: ["Жэб", "잽", "Jab"],
  cross: ["Кросс", "크로스", "Cross"],
  hook: ["Хук", "훅", "Hook"],
  uppercut: ["Апперкот", "어퍼컷", "Uppercut"],
  punch: ["Цохилт", "펀치", "Punch"],
};
const GRADE = {
  good: { color: GREEN, label: ["Сайн", "좋음", "Good"] },
  ok: { color: GOLD, label: ["Бараг", "거의", "Almost"] },
  fix: { color: RED, label: ["Засах", "교정", "Fix"] },
};

function tipText(tip, m, L) {
  switch (tip.key) {
    case "fullExtension":
      return tip.ok
        ? L(`Гар бүрэн сунасан (тохой ${m.elbowDeg}°)`, `팔을 끝까지 뻗음 (팔꿈치 ${m.elbowDeg}°)`, `Arm fully extended (elbow ${m.elbowDeg}°)`)
        : L(`Гараа бүрэн сун — тохой ${m.elbowDeg}°, 150°+ хэрэгтэй`, `팔을 끝까지 뻗으세요 — 팔꿈치 ${m.elbowDeg}°, 150°+ 필요`, `Extend fully — elbow ${m.elbowDeg}°, aim for 150°+`);
    case "shoulderTurn":
      return tip.ok
        ? L(`Мөр эргэлт сайн (${m.shoulderTurnDeg}°)`, `어깨 회전 좋음 (${m.shoulderTurnDeg}°)`, `Good shoulder turn (${m.shoulderTurnDeg}°)`)
        : L(`Мөрөө илүү эргүүл — ${m.shoulderTurnDeg}°, 15°+ хэрэгтэй`, `어깨를 더 돌리세요 — ${m.shoulderTurnDeg}°, 15°+ 필요`, `Turn the shoulder more — ${m.shoulderTurnDeg}°, aim for 15°+`);
    case "hipTurn":
      return tip.ok
        ? L(`Ташаа эргэлтэд орсон (${m.hipTurnDeg}°)`, `골반이 회전함 (${m.hipTurnDeg}°)`, `Hips turned in (${m.hipTurnDeg}°)`)
        : L(`Ташаагаа эргүүл — хүч хөлөөс гарна (${m.hipTurnDeg}°)`, `골반을 돌리세요 — 힘은 다리에서 (${m.hipTurnDeg}°)`, `Turn the hips — power comes from the legs (${m.hipTurnDeg}°)`);
    case "guardHand":
      return tip.ok
        ? L("Нөгөө гар эрүүн дээрээ байсан", "반대 손이 턱을 지킴", "Other hand stayed on the chin")
        : L("Нөгөө гар доошилсон — эрүүгээ хамгаал", "반대 손이 내려감 — 턱을 지키세요", "Other hand dropped — protect the chin");
    case "fastReturn":
      return tip.ok
        ? L(`Гараа хурдан буцаасан (${m.returnMs}мс)`, `빠르게 회수 (${m.returnMs}ms)`, `Snapped back fast (${m.returnMs} ms)`)
        : L(`Гараа хурдан буцаа — ${m.returnMs}мс`, `더 빨리 회수하세요 — ${m.returnMs}ms`, `Bring it back faster — ${m.returnMs} ms`);
    default:
      return "";
  }
}

export default function PunchTeardown({ replay, locale, onClose }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const pick = (arr) => loc(locale, arr[0], arr[1], arr[2]);
  const items = useMemo(() => teardownAll(replay), [replay]);
  // Start on the punch that needs the most work (most failed checks), else the first.
  const [sel, setSel] = useState(() => {
    let best = 0, worst = -1;
    items.forEach((it, i) => {
      const misses = it.teardown.tips.filter((t) => !t.ok).length;
      if (misses > worst) { worst = misses; best = i; }
    });
    return best;
  });
  const current = items[sel];
  const td = current?.teardown;
  const focus = useMemo(() => (td ? { startT: td.startT, endT: td.endT } : null), [td]);

  if (!replay || !td) {
    return (
      <div role="dialog" aria-label={L("Цохилт задлал", "펀치 분석", "Punch teardown")} style={{ position: "fixed", inset: 0, zIndex: 1200, background: blackAlpha(0.94), color: "#fff", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <div>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: whiteAlpha(0.8) }}>
            {L("Задлах цохилт олдсонгүй — камерын өмнө бүтэн биеэрээ харагдаж цохиод дахин оролдоорой.", "분석할 펀치가 없습니다 — 카메라에 전신이 보이게 하고 다시 시도하세요.", "No punch to take apart — stand fully in view and try another round.")}
          </p>
          <button type="button" onClick={onClose} style={{ marginTop: 12, minHeight: 44, padding: "0 20px", borderRadius: RADIUS.md, border: `1px solid ${whiteAlpha(0.2)}`, background: whiteAlpha(0.06), color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {L("Хаах", "닫기", "Close")}
          </button>
        </div>
      </div>
    );
  }

  const m = td.metrics;
  const grade = GRADE[td.grade];
  const handLabel = td.hand === "left" ? L("зүүн гар", "왼손", "left hand") : L("баруун гар", "오른손", "right hand");

  const failed = (key) => td.tips.some((tip) => tip.key === key && !tip.ok);

  const hud = (t, seek) => {
    const active = phaseAt(td, t);
    return (
      <>
        {/* Phase strip — tap a phase to freeze the fighter in it. */}
        <div data-testid="teardown-phases" style={{ position: "absolute", top: 8, left: 12, right: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, pointerEvents: "auto" }}>
          {PHASES.map((key, i) => {
            const on = active === key;
            const ph = td.phases[i];
            return (
              <button key={key} type="button" aria-pressed={on} onClick={() => seek(key === "extend" ? ph.endT : (ph.startT + ph.endT) / 2)} style={{
                minHeight: 40, padding: "6px 4px", borderRadius: 8, textAlign: "center", cursor: "pointer", fontFamily: "inherit",
                background: on ? redAlpha(0.85) : blackAlpha(0.55),
                border: `1px solid ${on ? RED : whiteAlpha(0.14)}`,
                color: on ? "#fff" : whiteAlpha(0.7), fontSize: 11, fontWeight: FONT_WEIGHT.black, letterSpacing: 0.4,
                transition: "background 120ms",
              }}>
                <span style={{ opacity: 0.75 }}>{i + 1}</span> {pick(PHASE_LABEL[key])}
              </button>
            );
          })}
        </div>
        {/* Measurement panels */}
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
          {[
            [L("Мөр эргэлт", "어깨 회전", "Shoulder turn"), `${m.shoulderTurnDeg}°`, failed("shoulderTurn")],
            [L("Ташаа эргэлт", "골반 회전", "Hip turn"), `${m.hipTurnDeg}°`, failed("hipTurn")],
            [L("Тохой", "팔꿈치", "Elbow"), `${m.elbowDeg}°`, failed("fullExtension")],
            [L("Сунгалт", "리치", "Reach"), `${m.reachPct}%`, false],
            [L("Хамгаалалт", "가드", "Guard"), m.guardUp ? L("Дээр", "업", "Up") : L("Доор", "다운", "Down"), failed("guardHand")],
            [L("Буцаалт", "회수", "Return"), `${m.returnMs} ${L("мс", "ms", "ms")}`, failed("fastReturn")],
          ].map(([label, value, bad]) => (
            <div key={label} style={{ padding: "4px 8px", borderRadius: 8, background: blackAlpha(0.5), border: `1px solid ${whiteAlpha(0.12)}` }}>
              <div style={{ fontSize: 11, color: whiteAlpha(0.7), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
              <div style={{ fontSize: 14, lineHeight: 1.2, fontWeight: FONT_WEIGHT.black, fontVariantNumeric: "tabular-nums", color: bad ? RED : "#fff" }}>{value}</div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const extra = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Punch picker */}
      <div role="radiogroup" aria-label={L("Цохилт сонгох", "펀치 선택", "Pick a punch")} style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {items.map((it, i) => {
          const g = GRADE[it.teardown.grade];
          const on = i === sel;
          return (
            <button key={it.index} type="button" role="radio" aria-checked={on} onClick={() => setSel(i)} style={{
              flexShrink: 0, minHeight: 40, padding: "0 12px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
              border: `1px solid ${on ? redAlpha(0.6) : whiteAlpha(0.14)}`,
              background: on ? redAlpha(0.16) : whiteAlpha(0.04), color: on ? "#fff" : whiteAlpha(0.8),
            }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: g.color }} />
              {i + 1} · {pick(TYPE_LABEL[it.teardown.type] || TYPE_LABEL.punch)}
            </button>
          );
        })}
      </div>
      {/* What to keep / fix */}
      <ul data-testid="teardown-tips" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
        {td.tips.map((tip) => (
          <li key={tip.key} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, lineHeight: 1.4, color: tip.ok ? whiteAlpha(0.8) : "#fff" }}>
            <span aria-hidden="true" style={{ color: tip.ok ? GREEN : RED, fontWeight: 900, width: 14, flexShrink: 0 }}>{tip.ok ? "✓" : "!"}</span>
            {tipText(tip, m, L)}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <MotionReplay3D
      replay={replay}
      locale={locale}
      onClose={onClose}
      focus={focus}
      hud={hud}
      extra={extra}
      title={L("Цохилт задлал", "펀치 분석", "Punch teardown")}
      subtitle={
        <>
          {sel + 1}/{items.length} · {pick(TYPE_LABEL[td.type] || TYPE_LABEL.punch)} · {handLabel} ·{" "}
          <span style={{ color: grade.color, fontWeight: 800 }}>{pick(grade.label)}</span>
        </>
      }
    />
  );
}
