"use client";

import { BRAND, kickerPill, kickerDot, displayTitle } from "@/components/ui/brand";
import { loc } from "@/lib/loc";

// Result hero: what kind of round it was, the score, and the punch mix — the
// three things a fighter looks at first. Same visual language as the landing.

const MIX = [
  { key: "jab", label: ["Жэб", "잽", "Jab"], color: "#60A5FA" },
  { key: "cross", label: ["Кросс", "크로스", "Cross"], color: BRAND.red },
  { key: "hook", label: ["Хук", "훅", "Hook"], color: BRAND.gold },
];

export default function ResultHeader({
  mode = "train",              // "train" | "challenge" | "pvp"
  tooFewPunches,
  effectivePunchCount,
  minPunches,
  identity,
  displayScore,
  finalScore = displayScore,   // the real score; displayScore is the count-up animation of it
  cameraOff = false,           // the round ran on the timer only (camera blocked / missing)
  scoreConf,
  punchBreakdown = null,
  locale,
  t,
}) {
  const kicker = mode === "pvp"
    ? loc(locale, "Тулааны дүн", "대결 결과", "Fight result")
    : mode === "challenge"
      ? loc(locale, "Сорилын дүн", "챌린지 결과", "Challenge result")
      : loc(locale, "Раундын дүн", "라운드 결과", "Round result");

  const conf = {
    high:   { label: t("scoreConfidenceHigh"),   color: BRAND.green },
    medium: { label: t("scoreConfidenceMedium"), color: BRAND.gold },
    low:    { label: t("scoreConfidenceLow"),    color: "#FB923C" },
  }[scoreConf];

  const mix = MIX.map((m) => ({ ...m, n: punchBreakdown?.[m.key]?.count || 0 }));
  const typed = mix.reduce((s, m) => s + m.n, 0);
  // From the final score, not the animated one: the count-up starts at 0, which used to flash
  // "Not enough data" before every valid result.
  const noData = tooFewPunches || finalScore <= 0;

  return (
    <div style={{ padding: "22px 20px 18px", textAlign: "left", borderBottom: `1px solid ${BRAND.line}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <p style={kickerPill}><span style={kickerDot} />{kicker}</p>
        {!noData && conf && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: conf.color }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: conf.color }} />
            {conf.label}
          </span>
        )}
      </div>

      {noData ? (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ ...displayTitle, fontSize: 30, color: BRAND.muted }}>
            {cameraOff
              ? loc(locale, "Раунд дууслаа", "라운드 완료", "Round done")
              : loc(locale, "Хангалтгүй өгөгдөл", "데이터 부족", "Not enough data")}
          </h2>
          <p style={{ margin: "10px 0 0", fontSize: 15, color: BRAND.muted, lineHeight: 1.55 }}>
            {cameraOff
              ? loc(locale,
                  "Камер унтраалттай байсан тул оноо гараагүй. Камераа зөвшөөрөөд дахин хий.",
                  "카메라가 꺼져 있어 점수가 없어요. 카메라를 허용하고 다시 해보세요.",
                  "The camera was off, so there is no score. Allow the camera and go again.")
              : tooFewPunches
              ? loc(locale,
                  `Шинжилгээнд хамгийн багадаа ${minPunches} цохилт хэрэгтэй — ${effectivePunchCount} бүртгэгдсэн. Бүтэн биеэ кадрт багтааж, дахин нэг раунд хий.`,
                  `분석하려면 최소 ${minPunches}번의 펀치가 필요해요 — ${effectivePunchCount}번 감지됨. 전신이 보이게 서서 다시 해보세요.`,
                  `Analysis needs at least ${minPunches} punches — ${effectivePunchCount} detected. Get your whole body in frame and go again.`)
              : loc(locale,
                  "Хөдөлгөөний өгөгдөл хангалтгүй байна. Илүү урт комбо хийж үзээрэй.",
                  "움직임 데이터가 부족해요. 더 긴 콤보를 시도해보세요.",
                  "Not enough movement data. Try a longer combination.")}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ ...displayTitle, fontSize: 68, lineHeight: 0.9 }}>{displayScore.toFixed(1)}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: BRAND.faint }}>/10</span>
            </div>
            <div style={{ minWidth: 0, paddingBottom: 4 }}>
              <div style={{ ...displayTitle, fontSize: 20, color: BRAND.text, overflowWrap: "anywhere" }}>{identity?.title}</div>
              {identity?.sub && <div style={{ marginTop: 4, fontSize: 13, color: BRAND.muted }}>{identity.sub}</div>}
            </div>
          </div>

          <div style={{ marginTop: 14, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(displayScore / 10) * 100}%`, borderRadius: 3, background: `linear-gradient(90deg, ${BRAND.red}, ${BRAND.gold})`, transition: "width 0.04s linear" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ ...displayTitle, fontSize: 28 }}>{effectivePunchCount}</div>
              <div style={{ fontSize: 12, color: BRAND.faint, marginTop: 3 }}>{loc(locale, "цохилт", "펀치", "punches")}</div>
            </div>
            {typed > 0 && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 2 }} aria-hidden="true">
                  {mix.filter((m) => m.n).map((m) => (
                    <div key={m.key} style={{ flex: m.n, background: m.color }} />
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 7 }}>
                  {mix.map((m) => (
                    <span key={m.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: m.n ? BRAND.muted : BRAND.faint }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: m.color, opacity: m.n ? 1 : 0.35 }} />
                      {loc(locale, ...m.label)} {m.n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
