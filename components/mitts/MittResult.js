"use client";

import { loc } from "@/lib/loc";
import { btnPrimary, btnSecondary, displayTitle, kickerDot, kickerPill, sectionLabel } from "@/components/ui/brand";
import { RED, GOLD, GREEN, whiteAlpha, redAlpha } from "@/lib/tokens";
import { MITT_CALL_NAME } from "@/components/mitts/MittCall";

const GRADE = {
  sharp: { color: GREEN, label: ["Хурц!", "날카로워요!", "Sharp!"] },
  solid: { color: GOLD, label: ["Сайн", "좋아요", "Solid"] },
  work: { color: RED, label: ["Дахиад", "더 연습", "Keep at it"] },
};

const TIP = {
  "1": ["Жэб: урд гараа шууд, хөнгөн шид — бодолгүйгээр.", "잽: 앞손을 곧게, 가볍게 — 생각하지 말고.", "Jab: lead hand straight and light — don't think, fire."],
  "2": ["Кросс: хойд хөлөөрөө түлхэж, ташаагаа эргүүл.", "크로스: 뒷발로 밀고 골반을 돌리세요.", "Cross: push off the back foot and turn the hips."],
  "1-1": ["Давхар жэб: хоёр дахь жэбийг эхнийхээс хурдан.", "더블 잽: 두 번째 잽을 더 빠르게.", "Double jab: make the second jab quicker than the first."],
  "1-2": ["1-2: жэб буцахтай зэрэг кросс эхэлнэ.", "1-2: 잽이 돌아오는 순간 크로스 출발.", "1-2: the cross leaves as the jab comes back."],
  slip: ["Бултах: өвдгөө бага нугалж толгойгоо 10–15 см хажуу тийш.", "슬립: 무릎을 살짝 굽혀 머리를 10–15cm 옆으로.", "Slip: bend the knees a little, move the head 10–15 cm to the side."],
  roll: ["Шумбах: өвдгөөр доош, U хэлбэрээр гар.", "롤: 무릎으로 내려가 U자로 빠져나오세요.", "Roll: drop with the knees, come out in a U."],
};

export default function MittResult({ summary, best = null, locale = "en", onAgain, onExit }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const s = summary;
  const g = GRADE[s.grade];
  const pct = Math.round(s.accuracy * 100);

  return (
    <div data-testid="mitt-result" style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ ...kickerPill, alignSelf: "flex-start" }}><span style={kickerDot} />{L("Лапны дасгал · хариу үйлдэл", "미트 드릴 · 반응", "Mitt drill · reaction")}</p>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...displayTitle, fontSize: 64, color: g.color }}>{pct}%</span>
        <span style={{ fontSize: 15, color: whiteAlpha(0.7) }}>{s.hits}/{s.total} {L("зөв", "성공", "hit")} · <b style={{ color: g.color }}>{loc(locale, ...g.label)}</b></span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          [L("Дундаж хариу", "평균 반응", "Avg reaction"), s.avgReactionMs != null ? `${s.avgReactionMs} ${L("мс", "ms", "ms")}` : "—"],
          [L("Хамгийн хурдан", "최고 반응", "Fastest"), s.bestReactionMs != null ? `${s.bestReactionMs} ${L("мс", "ms", "ms")}` : "—"],
          [L("Дараалсан зөв", "연속 성공", "Best streak"), String(s.bestStreak)],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: "12px 10px", borderRadius: 16, background: whiteAlpha(0.04), border: `1px solid ${whiteAlpha(0.08)}` }}>
            <div style={{ fontSize: 12, color: whiteAlpha(0.6) }}>{label}</div>
            <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Personal best for this level (kept on this device) */}
      {best?.best && (
        <div data-testid="mitt-best" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", borderRadius: 16, background: best.isNew ? "rgba(245,196,81,0.12)" : whiteAlpha(0.04), border: `1px solid ${best.isNew ? "rgba(245,196,81,0.45)" : whiteAlpha(0.08)}` }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: best.isNew ? GOLD : whiteAlpha(0.75) }}>
            {best.isNew ? L("🏆 Шинэ рекорд", "🏆 새 기록", "🏆 New best") : L("Таны шилдэг", "내 최고 기록", "Your best")}
          </span>
          <span style={{ fontSize: 16, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(best.best.accuracy * 100)}%{best.best.avgReactionMs != null ? ` · ${best.best.avgReactionMs} ${L("мс", "ms", "ms")}` : ""}
          </span>
        </div>
      )}

      {s.weakestCall && (
        <div style={{ padding: 16, borderRadius: 20, background: redAlpha(0.1), border: `1px solid ${redAlpha(0.35)}` }}>
          <div style={{ ...sectionLabel, color: "#ff7a72", marginBottom: 8 }}>{L("Эхлээд үүнийг засна", "먼저 이것부터", "Work on this first")}</div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.45 }}>{loc(locale, ...TIP[s.weakestCall])}</div>
        </div>
      )}

      <div style={{ borderRadius: 20, border: `1px solid ${whiteAlpha(0.08)}`, overflow: "hidden", background: whiteAlpha(0.03) }}>
        {Object.entries(s.byCall).map(([call, v], i) => (
          <div key={call} style={{ display: "flex", justifyContent: "space-between", padding: "11px 14px", borderTop: i ? `1px solid ${whiteAlpha(0.06)}` : "none", fontSize: 14 }}>
            <span style={{ color: whiteAlpha(0.8) }}>{/^\d/.test(call) ? `${call} · ` : ""}{loc(locale, ...MITT_CALL_NAME[call])}</span>
            <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", color: v.hits === v.total ? GREEN : v.hits === 0 ? RED : "#fff" }}>{v.hits}/{v.total}</span>
          </div>
        ))}
      </div>

      <button type="button" onClick={onAgain} style={{ ...btnPrimary, fontFamily: "inherit" }}>{L("Дахин раунд", "다시 라운드", "Another round")}</button>
      <button type="button" onClick={onExit} style={{ ...btnSecondary, fontFamily: "inherit", color: whiteAlpha(0.8) }}>{L("Бэлтгэл рүү буцах", "훈련으로", "Back to Train")}</button>
    </div>
  );
}
