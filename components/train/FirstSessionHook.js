"use client";

import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import { GOLD } from "@/lib/tokens";

const ARCH_FIGHTER = {
  pressure:   "Mike Tyson",
  outboxer:   "Muhammad Ali",
  counter:    "Floyd Mayweather",
  explosive:  "Naoya Inoue",
  technician: "Dmitry Bivol",
};

const ARCH_DISPLAY_S = {
  en: { pressure: "Pressure Fighter", outboxer: "Outboxer", counter: "Counter Fighter", explosive: "Explosive Fighter", technician: "Technician" },
  mn: { pressure: "Дарамт тулаанч",   outboxer: "Аутбоксер", counter: "Контр тулаанч", explosive: "Тэсрэмтгий тулаанч", technician: "Техникч" },
  ko: { pressure: "프레셔 파이터",     outboxer: "아웃복서",  counter: "카운터 파이터", explosive: "폭발적 파이터",        technician: "테크니션" },
};

const SIG_L = {
  en: {
    aggr: "Aggression", range: "Range", counter: "Counter", volume: "Volume",
    high: "HIGH", medium: "MED", low: "LOW", long: "LONG", mid: "MID", close: "CLOSE", building: "BUILDING", emerging: "EMERGING",
    firstSignals: "YOUR FIRST SIGNALS", like: "Like ",
    mightBe:       "You might be a...",
    signalGrowing: "SIGNAL GROWING",
    archEmerging:  "YOUR ARCHETYPE IS EMERGING",
    dnaUnlocked:   "DNA ANALYSIS UNLOCKED",
    dnaReady:      "Your fighter identity is taking shape. Visit your profile to see the full analysis.",
    session2hint:  "1 more session unlocks your Fighter DNA",
    session3hint:  "3 sessions complete. Your DNA is ready to view.",
    trainAgain: "Train Again →", viewDNA: "View Your DNA →", viewProfile: "View Profile",
    title1: "SESSION 1 COMPLETE", title2: "SESSION 2 COMPLETE", title3: "DNA ANALYSIS UNLOCKED",
    dnaJourney: "DNA JOURNEY",
  },
  mn: {
    aggr: "Түрэмгийлэл", range: "Зай", counter: "Контр", volume: "Хэмжээ",
    high: "ӨНДӨР", medium: "ДУНД", low: "БАГ", long: "УРТ", mid: "ДУНД", close: "ОЙРХОН", building: "БҮРДЭЖ БАЙНА", emerging: "ГАРЧ ИРЭХ",
    firstSignals: "АНХНЫ ДОХИО", like: "Жишээ нь: ",
    mightBe:       "Та магадгүй...",
    signalGrowing: "ДОХИО ӨСЧ БАЙНА",
    archEmerging:  "ТАНЫ ARCHETYPE ГАРЧ ИРЭЖ БАЙНА",
    dnaUnlocked:   "ДНХ ШИНЖИЛГЭЭ НЭЭГДЛАА",
    dnaReady:      "Тулаанчийн мөн чанар тодорч байна. Профайлаа зочлоод бүрэн шинжилгээгээ харна уу.",
    session2hint:  "1 тренинг нэмбэл таны ДНХ нээгдэнэ",
    session3hint:  "3 тренинг дууслаа. ДНХ харахад бэлэн боллоо.",
    trainAgain: "Дахин бэлтгэл хий →", viewDNA: "ДНХ харах →", viewProfile: "Профайл харах",
    title1: "1-Р ТРЕНИНГ ДУУСЛАА", title2: "2-Р ТРЕНИНГ ДУУСЛАА", title3: "ДНХ ШИНЖИЛГЭЭ НЭЭГДЛАА",
    dnaJourney: "ДНХ АЯЛАЛ",
  },
  ko: {
    aggr: "공격성", range: "레인지", counter: "카운터", volume: "볼륨",
    high: "높음", medium: "중간", low: "낮음", long: "롱", mid: "미드", close: "클로즈", building: "구축 중", emerging: "성장 중",
    firstSignals: "첫 번째 신호", like: "예: ",
    mightBe:       "당신은...",
    signalGrowing: "신호 성장 중",
    archEmerging:  "아키타입이 형성되고 있습니다",
    dnaUnlocked:   "DNA 분석 잠금 해제",
    dnaReady:      "파이터 정체성이 형태를 갖추고 있습니다. 프로필을 방문하여 전체 분석을 확인하세요.",
    session2hint:  "1회 더 훈련하면 파이터 DNA가 잠금 해제됩니다",
    session3hint:  "3세션 완료. DNA를 확인할 준비가 되었습니다.",
    trainAgain: "다시 훈련 →", viewDNA: "DNA 보기 →", viewProfile: "프로필 보기",
    title1: "세션 1 완료", title2: "세션 2 완료", title3: "DNA 분석 잠금 해제",
    dnaJourney: "DNA 여정",
  },
};

const BAR_W = { high: 80, medium: 50, low: 20, long: 75, mid: 45, close: 30, building: 18, emerging: 40 };

export default function FirstSessionHook({ locale, firstSessionHook, setFirstSessionHook, handleTryAgain, router }) {
  const pb = firstSessionHook.poseMetrics?.punchBreakdown;
  const jabC   = pb?.jab?.count   || 0;
  const crossC = pb?.cross?.count || 0;
  const hookC  = pb?.hook?.count  || 0;
  const total  = jabC + crossC + hookC;

  const jabPct   = total > 0 ? Math.round((jabC   / total) * 100) : 0;
  const crossPct = total > 0 ? Math.round((crossC / total) * 100) : 0;
  const hookPct  = total > 0 ? 100 - jabPct - crossPct : 0;
  const hasSignals = total >= 3;

  let archKey = "pressure";
  if (hasSignals) {
    if      (jabPct >= 45)   archKey = "outboxer";
    else if (crossPct >= 35) archKey = "counter";
    else if (hookPct >= 35)  archKey = "pressure";
    else if (total >= 25)    archKey = "explosive";
    else                     archKey = "technician";
  }

  const acc = ARCH_TRAINING_COLORS[archKey] || GOLD;
  const AD  = ARCH_DISPLAY_S[locale] || ARCH_DISPLAY_S.en;
  const SL  = SIG_L[locale] || SIG_L.en;
  const sessionNum = firstSessionHook.sessionNum || 1;

  const aggrLevel    = hookPct >= 35 ? "high"  : hookPct >= 20  ? "medium"   : "low";
  const rangeLevel   = jabPct  >= 45 ? "long"  : hookPct >= 30  ? "close"    : "mid";
  const counterLevel = crossPct >= 35 ? "high" : crossPct >= 22 ? "emerging" : "low";
  const volumeLevel  = total >= 25    ? "high"  : total >= 12    ? "medium"   : "building";

  const signals = hasSignals ? [
    { label: SL.aggr,    level: SL[aggrLevel],    w: BAR_W[aggrLevel]    },
    { label: SL.range,   level: SL[rangeLevel],   w: BAR_W[rangeLevel]   },
    { label: SL.counter, level: SL[counterLevel], w: BAR_W[counterLevel] },
    { label: SL.volume,  level: SL[volumeLevel],  w: BAR_W[volumeLevel]  },
  ] : [];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(4,4,6,0.98)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Header — varies by session */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>
            {sessionNum === 3 ? "🧬" : "🥊"}
          </div>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: acc, textTransform: "uppercase", marginBottom: 6 }}>
            {sessionNum === 1 ? SL.title1 : sessionNum === 2 ? SL.title2 : SL.title3}
          </div>
          {firstSessionHook.score != null && (
            <div style={{ fontSize: 32, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>
              {firstSessionHook.score.toFixed(1)}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>/10</span>
            </div>
          )}
        </div>

        {/* Signals — session 1 & 2 */}
        {sessionNum < 3 && signals.length > 0 && (
          <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "16px", marginBottom: 16 }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 12 }}>
              {sessionNum === 1 ? SL.firstSignals : SL.signalGrowing}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {signals.map(({ label, level, w }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 70, fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${w}%`, height: "100%", background: acc, borderRadius: 3, boxShadow: `0 0 8px ${acc}55`, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
                  </div>
                  <span style={{ width: 56, textAlign: "right", fontSize: 8.5, fontWeight: 900, color: acc, letterSpacing: 0.8, flexShrink: 0 }}>{level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Archetype card — all sessions */}
        <div style={{ borderRadius: 16, background: `${acc}10`, border: `1px solid ${acc}30`, padding: "16px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
            {sessionNum === 3 ? SL.archEmerging : SL.mightBe}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: sessionNum === 3 ? 10 : 8, height: sessionNum === 3 ? 10 : 8, borderRadius: "50%", background: acc, boxShadow: `0 0 ${sessionNum === 3 ? 14 : 10}px ${acc}` }} />
            <span style={{ fontSize: sessionNum === 3 ? 26 : 20, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
              {AD[archKey]}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
            {SL.like}{ARCH_FIGHTER[archKey]}
          </div>
          {sessionNum === 3 && (
            <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, lineHeight: 1.5 }}>
              {SL.dnaReady}
            </div>
          )}
        </div>

        {/* DNA Journey progress bar */}
        <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${sessionNum === 3 ? `${acc}25` : "rgba(255,255,255,0.05)"}`, padding: "14px 16px", marginBottom: 24 }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", marginBottom: 10 }}>
            {SL.dnaJourney}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 3,
                background: i < sessionNum ? acc : "rgba(255,255,255,0.07)",
                boxShadow: i < sessionNum ? `0 0 8px ${acc}66` : "none",
              }} />
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, lineHeight: 1.4 }}>
            {sessionNum === 1 ? SL.session2hint : sessionNum === 2 ? SL.session2hint.replace("1", "2") : SL.session3hint}
          </div>
        </div>

        {/* CTAs — session 3 swaps primary/secondary */}
        {sessionNum === 3 ? (
          <>
            <button
              type="button"
              onClick={() => { setFirstSessionHook(null); router.push(`/${locale}/fighter-profile`); }}
              style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: acc, border: "none", color: "#000", fontSize: 15, fontWeight: 900, letterSpacing: 0.5, cursor: "pointer", marginBottom: 12, boxShadow: `0 4px 24px ${acc}44` }}
            >
              {SL.viewDNA}
            </button>
            <button
              type="button"
              onClick={() => { setFirstSessionHook(null); handleTryAgain?.(); }}
              style={{ width: "100%", padding: "11px 0", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            >
              {SL.trainAgain}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { setFirstSessionHook(null); handleTryAgain?.(); }}
              style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: acc, border: "none", color: "#000", fontSize: 15, fontWeight: 900, letterSpacing: 0.5, cursor: "pointer", marginBottom: 12, boxShadow: `0 4px 24px ${acc}44` }}
            >
              {SL.trainAgain}
            </button>
            <button
              type="button"
              onClick={() => { setFirstSessionHook(null); router.push(`/${locale}/fighter-profile`); }}
              style={{ width: "100%", padding: "11px 0", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            >
              {SL.viewProfile}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
