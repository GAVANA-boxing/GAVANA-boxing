"use client";

import { GOLD } from "@/lib/tokens";
import { isBeginnerUser, getCurrentBeginnerLesson, getBeginnerProgress } from "@/lib/beginnerPath";
import { getTodaysDNAMission } from "@/lib/dnaDailyMissions";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import { getFeaturedPackage, getPackageFighter } from "@/lib/experimentPackages";
import { getBelt, getBeltProgress, getNextBelt } from "@/lib/belts";

export default function DailyHub({
  locale,
  t,
  router,
  totalSessionCount,
  currentXP,
  userStreak,
  bestDailyStreak,
  userArchetype,
  weeklySessionCount,
  weeklyBestScore,
  lastSessionSec,
  missionCompletedToday,
  missionJustCompleted,
  currentExperiment,
  experimentSessionCount,
  wrappedHandleStart,
}) {
  const effectiveMissionDone = missionCompletedToday || missionJustCompleted;
  const isBeginner = isBeginnerUser(totalSessionCount ?? 999);
  const nextLesson = isBeginner ? getCurrentBeginnerLesson(totalSessionCount ?? 0) : null;
  const beginnerProg = isBeginner ? getBeginnerProgress(totalSessionCount ?? 0) : null;
  const belt = getBelt(currentXP);
  const beltPct = getBeltProgress(currentXP);
  const nextBelt = getNextBelt(currentXP);

  // Freshness
  const daysSince = lastSessionSec ? Math.floor((Date.now() / 1000 - lastSessionSec) / 86400) : null;
  const showFreshness = daysSince != null && daysSince >= 5;
  const freshnessColor = daysSince >= 14 ? "#EF4444" : daysSince >= 8 ? "#FB923C" : "#F59E0B";
  const freshnessLabel = daysSince >= 14
    ? (locale === "mn" ? "Дохио алдагдлаа" : locale === "ko" ? "신호 손실" : "DNA Signal Lost")
    : daysSince >= 8
    ? (locale === "mn" ? "Дохио буурч байна" : locale === "ko" ? "신호 저하 중" : "DNA Signal Degrading")
    : (locale === "mn" ? "Дохио суларч байна" : locale === "ko" ? "신호 약화 중" : "DNA Signal Weakening");
  const freshnessHint = daysSince >= 14
    ? (locale === "mn" ? `${daysSince} хоног дасгал хийгээгүй — дахин эхэл` : locale === "ko" ? `${daysSince}일 미훈련 — 다시 시작하세요` : `${daysSince} days without training — time to restart`)
    : (locale === "mn" ? `${daysSince} хоног завсарласан. ДНХ сэргээхийн тулд дасгал хий.` : locale === "ko" ? `${daysSince}일 쉬었습니다. DNA를 복구하세요.` : `${daysSince}-day gap. Train to keep your DNA signal strong.`);

  // Weekly digest
  const showDigest = weeklySessionCount >= 1 && weeklyBestScore != null;

  return (
    <div style={{ margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>

      {/* DNA Freshness Warning */}
      {showFreshness && (
        <div style={{ borderRadius: 12, padding: "10px 14px", background: `${freshnessColor}0a`, border: `1px solid ${freshnessColor}30`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: freshnessColor, marginBottom: 2 }}>{freshnessLabel}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{freshnessHint}</div>
          </div>
        </div>
      )}

      {/* Streak Recovery Mission */}
      {!showFreshness && userStreak === 0 && totalSessionCount > 0 && !effectiveMissionDone && (
        <div style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>💔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "#F87171", marginBottom: 2 }}>
              {locale === "mn" ? "STREAK ТАСАРСАН — СЭРГЭЭХ ДААЛГАВАР" : locale === "ko" ? "스트릭 종료 — 회복 미션" : "STREAK ENDED — RECOVERY MISSION"}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
              {locale === "mn" ? "Нэг хатуу тренинг хийж streak-ийгаа дахин эхлүүл." : locale === "ko" ? "힘든 훈련 한 번으로 스트릭을 다시 시작하세요." : "One hard session restarts your streak. Go all out."}
            </div>
            <button
              type="button"
              onClick={wrappedHandleStart}
              style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)", color: "#F87171", fontSize: 11, fontWeight: 900, cursor: "pointer" }}
            >
              {locale === "mn" ? "Сэргээх тренинг →" : locale === "ko" ? "회복 훈련 →" : "Recovery Session →"}
            </button>
          </div>
        </div>
      )}

      {/* Streak Risk Warning */}
      {!showFreshness && userStreak >= 3 && !effectiveMissionDone && (
        <div style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.28)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🔥</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "#FB923C", marginBottom: 2 }}>
              {locale === "mn" ? `${userStreak} ӨДРИЙН STREAK АЮУЛД БАЙНА` : locale === "ko" ? `${userStreak}일 스트릭 위험!` : `🔥 ${userStreak}-DAY STREAK AT RISK`}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
              {locale === "mn" ? "Өнөөдөр бэлтгэл хийж streak-ийг аврах" : locale === "ko" ? "오늘 훈련하여 스트릭을 지키세요" : "Train today to protect your streak"}
            </div>
          </div>
        </div>
      )}

      {/* DNA Building Progress — show after 1-2 sessions */}
      {totalSessionCount >= 1 && totalSessionCount < 3 && !userArchetype && (
        <div onClick={() => router.push(`/${locale}/fighter-profile`)} style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.22)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="#F5C451" strokeWidth="3"
                strokeDasharray="100.5"
                strokeDashoffset={100.5 * (1 - totalSessionCount / 3)}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#F5C451" }}>
              {totalSessionCount}/3
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(245,196,81,0.75)", marginBottom: 2 }}>
              🧬 {locale === "mn" ? "ДНХ ДОХИО БҮРДЭЖ БАЙНА" : locale === "ko" ? "DNA 신호 형성 중" : "DNA SIGNAL FORMING"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
              {locale === "mn"
                ? `${3 - totalSessionCount} дасгал дараа таны тулаанчийн архетип илчлэгдэнэ`
                : locale === "ko"
                ? `${3 - totalSessionCount}세션 후 파이터 아키타입이 공개됩니다`
                : `${3 - totalSessionCount} more session${3 - totalSessionCount !== 1 ? "s" : ""} until your Fighter Archetype reveals`}
            </div>
          </div>
        </div>
      )}

      {/* Weekly DNA Digest */}
      {!showFreshness && showDigest && (
        <div style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(245,196,81,0.05)", border: "1px solid rgba(245,196,81,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(245,196,81,0.7)", marginBottom: 2 }}>
              {locale === "mn" ? "ЭНЭ 7 ХОНОГ" : locale === "ko" ? "이번 주" : "THIS WEEK"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
              {weeklySessionCount} {locale === "mn" ? "тренинг" : locale === "ko" ? "세션" : `session${weeklySessionCount !== 1 ? "s" : ""}`}
              {userArchetype && <span style={{ color: ARCH_TRAINING_COLORS[userArchetype] || GOLD }}> · {({ pressure: { en: "Pressure", mn: "Дарамт", ko: "프레셔" }, outboxer: { en: "Outboxer", mn: "Аутбоксер", ko: "아웃복서" }, counter: { en: "Counter", mn: "Контр", ko: "카운터" }, explosive: { en: "Explosive", mn: "Тэсрэлт", ko: "폭발적" }, technician: { en: "Technician", mn: "Техникч", ko: "테크니션" } }[userArchetype]?.[locale] || userArchetype)}</span>}
              {weeklyBestScore != null && <span style={{ color: "rgba(255,255,255,0.35)" }}> · {locale === "mn" ? "Шилдэг" : locale === "ko" ? "최고" : "Best"} {weeklyBestScore.toFixed(1)}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Mission + streak + belt card */}
      <div style={{
        borderRadius: 14, overflow: "hidden",
        border: effectiveMissionDone ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(245,196,81,0.2)",
        background: effectiveMissionDone ? "rgba(52,211,153,0.04)" : "rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{effectiveMissionDone ? "✅" : "🥊"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: effectiveMissionDone ? "#34D399" : "rgba(245,196,81,0.8)", marginBottom: 2 }}>
              {effectiveMissionDone
                ? (locale === "mn" ? "ӨНӨӨДРИЙН ДААЛГАВАР ДУУССАН" : locale === "ko" ? "오늘 미션 완료" : "TODAY'S MISSION DONE")
                : (locale === "mn" ? "ӨНӨӨДРИЙН ДААЛГАВАР" : locale === "ko" ? "오늘의 미션" : "DAILY MISSION")}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.75)" }}>
              {effectiveMissionDone
                ? (locale === "mn" ? "Гайхалтай! Маргааш streak-ийг үргэлжлүүл." : locale === "ko" ? "훌륭해요! 내일도 스트릭을 이어가세요." : "Great work! Keep the streak alive tomorrow.")
                : (locale === "mn" ? "Дасгал хийж +50 XP ав" : locale === "ko" ? "훈련하고 +50 XP 획득" : "Train once today for +50 XP")}
            </div>
          </div>
          {/* Streak pill */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 10px", borderRadius: 10, background: userStreak >= 7 ? "rgba(251,146,60,0.15)" : userStreak >= 3 ? "rgba(251,146,60,0.1)" : "rgba(255,255,255,0.05)", border: userStreak >= 3 ? "1px solid rgba(251,146,60,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: userStreak > 0 ? "#FB923C" : "rgba(255,255,255,0.3)", lineHeight: 1 }}>{userStreak}</span>
            <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5, textTransform: "uppercase" }}>
              {locale === "mn" ? "өдөр" : locale === "ko" ? "일" : "day"}
            </span>
          </div>
        </div>

        {/* Belt progress row */}
        <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12 }}>🥋</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: belt.color }}>{t(belt.key)}</span>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ width: `${beltPct}%`, height: "100%", background: belt.gradient, transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 800, color: belt.color }}>{beltPct}%</span>
          {nextBelt && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.22)" }}>→ {t(nextBelt.key)}</span>}
        </div>

        {/* Streak milestones */}
        {userStreak > 0 && (
          <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 6 }}>
            {[1, 3, 7, 14, 30].map((m) => (
              <div key={m} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: userStreak >= m ? "#FB923C" : "rgba(255,255,255,0.1)", boxShadow: userStreak >= m ? "0 0 6px rgba(251,146,60,0.6)" : "none" }} />
                <span style={{ fontSize: 7, fontWeight: 700, color: userStreak >= m ? "#FB923C" : "rgba(255,255,255,0.2)" }}>{m}</span>
              </div>
            ))}
            <div style={{ flex: 1, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (userStreak / 30) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#FB923C,#F59E0B)", transition: "width 0.6s ease" }} />
            </div>
            {bestDailyStreak > 0 && (
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>
                {locale === "mn" ? `Хамгийн дээд: ${bestDailyStreak}` : locale === "ko" ? `최고: ${bestDailyStreak}일` : `Best: ${bestDailyStreak}d`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Beginner Path card — only for new users */}
      {isBeginner && nextLesson && (
        <div style={{ borderRadius: 14, border: "2px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.06)", padding: "14px 14px 12px" }}>
          {/* Header row: START HERE + lesson count + dots */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "#A78BFA", background: "rgba(139,92,246,0.2)", padding: "3px 8px", borderRadius: 20 }}>
                {t("beginnerStartHere")}
              </span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                {t("beginnerLessonCount").replace("{current}", beginnerProg.completed + 1).replace("{total}", beginnerProg.total)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {Array.from({ length: beginnerProg.total }).map((_, i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < beginnerProg.completed ? "#8B5CF6" : i === beginnerProg.completed ? "#A78BFA" : "rgba(255,255,255,0.1)", boxShadow: i === beginnerProg.completed ? "0 0 5px rgba(167,139,250,0.6)" : "none" }} />
              ))}
            </div>
          </div>

          {/* Lesson title + why */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{t(nextLesson.titleKey)}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              {t(nextLesson.whyKey)}
            </div>
          </div>

          {/* Dual CTA */}
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`/${locale}/programs${nextLesson.lessonId ? `?lesson=${nextLesson.lessonId}` : ""}`}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRadius: 10, background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.45)", color: "#C4B5FD", fontSize: 12, fontWeight: 900, textDecoration: "none" }}>
              📖 {t("beginnerCTALesson")}
            </a>
            <button type="button"
              onClick={wrappedHandleStart}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
              🎥 {t("beginnerCTARecord")}
            </button>
          </div>
        </div>
      )}

      {/* DNA Daily Focus — archetype-specific mission */}
      {userArchetype && (() => {
        const mission = getTodaysDNAMission(userArchetype);
        if (!mission) return null;
        const archColor = ARCH_TRAINING_COLORS[userArchetype] || GOLD;
        return (
          <div style={{
            borderRadius: 14, overflow: "hidden",
            border: `1px solid ${archColor}30`,
            background: `${archColor}08`,
          }}>
            <div style={{ height: 2, background: `linear-gradient(90deg, ${archColor}88, transparent)` }} />
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: archColor, marginBottom: 3 }}>
                    {locale === "mn" ? "ӨНӨӨДРИЙН DNA ФОКУС" : locale === "ko" ? "오늘의 DNA 포커스" : "TODAY'S DNA FOCUS"}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
                    {mission[locale] || mission.en}
                  </div>
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${archColor}18`, border: `1px solid ${archColor}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  🎯
                </div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, fontWeight: 600, marginBottom: 10 }}>
                {mission.hint[locale] || mission.hint.en}
              </div>
              <button
                type="button"
                onClick={wrappedHandleStart}
                style={{
                  width: "100%", padding: "9px 0", borderRadius: 10,
                  background: `${archColor}20`, border: `1px solid ${archColor}45`,
                  color: archColor, fontSize: 12, fontWeight: 900, cursor: "pointer",
                }}
              >
                {locale === "mn" ? "Одоо дасгал хий →" : locale === "ko" ? "지금 훈련하기 →" : "Train Now →"}
              </button>
            </div>
          </div>
        );
      })()}

      {/* DNA Evolution Progress */}
      {userArchetype && weeklySessionCount >= 1 && (() => {
        const ARCH_COLORS_EV = { pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981" };
        const acc = ARCH_COLORS_EV[userArchetype] || GOLD;
        const sessionsToNext = 5 - (totalSessionCount % 5);
        const cyclePct = ((totalSessionCount % 5) / 5) * 100;
        return (
          <div onClick={() => router.push(`/${locale}/fighter-profile`)} style={{ borderRadius: 12, padding: "10px 14px", background: `${acc}06`, border: `1px solid ${acc}20`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{ flexShrink: 0 }}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                <circle cx="16" cy="16" r="12" fill="none" stroke={acc} strokeWidth="2.5"
                  strokeDasharray="75.4"
                  strokeDashoffset={75.4 * (1 - cyclePct / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 16 16)"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: acc, marginBottom: 2 }}>
                {locale === "mn" ? "ДНХ ШИНЭЧЛЭЛТ" : locale === "ko" ? "DNA 업데이트" : "DNA EVOLUTION"}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                {sessionsToNext === 5
                  ? (locale === "mn" ? "Бэлтгэл хийж ДНХ-аа шинэчил" : locale === "ko" ? "훈련하여 DNA를 업데이트하세요" : "Train to start your next DNA cycle")
                  : (locale === "mn"
                    ? `${sessionsToNext} дасгал дараа ДНХ шинэчлэгдэнэ`
                    : locale === "ko"
                    ? `${sessionsToNext}세션 후 DNA 업데이트`
                    : `${sessionsToNext} session${sessionsToNext !== 1 ? "s" : ""} until DNA update`)}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Weak Dimension Drill — DNA-based */}
      {userArchetype && !isBeginner && (() => {
        const WEAK_DIMS = {
          pressure:   { dim: "outboxer",   en: "Footwork & Distance Control", mn: "Хөлийн ажил & Зай хянах", ko: "풋워크 & 거리 조절" },
          outboxer:   { dim: "pressure",   en: "Close-Range Power Shots", mn: "Ойрын зайн хүчтэй цохилт", ko: "근거리 파워 샷" },
          counter:    { dim: "explosive",  en: "Explosive First-Strike Speed", mn: "Тэсрэлтийн анхны цохилтын хурд", ko: "폭발적인 선제 속도" },
          explosive:  { dim: "technician", en: "Technical Precision & Economy", mn: "Техникийн нарийвчлал", ko: "기술적 정밀도" },
          technician: { dim: "counter",    en: "Counter-Punching Timing", mn: "Контр цохилтын цаг", ko: "카운터 타이밍" },
        };
        const DRILL_HINT = {
          pressure:   { en: "Work the jab-cross at long range. Reset after each combo.", mn: "Урт зайнаас жааб-кросс хий. Комбо болгоны дараа буц.", ko: "장거리에서 잽-크로스. 콤보 후 리셋." },
          outboxer:   { en: "Step in with a 3-punch burst. Stay tight, elbows in.", mn: "3 цохилтоор ор. Тогтуу бай, тохойгоо дотогш.", ko: "3펀치 버스트로 진입. 팔꿈치 안으로." },
          counter:    { en: "Explode first — don't wait for the bait. Fire in 0.5 sec.", mn: "Эхлээд тэсрэ — хүлээхгүй. 0.5 секундад цох.", ko: "먼저 터뜨려라 — 기다리지 마라. 0.5초 안에." },
          explosive:  { en: "Slow your combinations. Every punch has a purpose.", mn: "Комбиноо удаашруул. Цохилт бүр зорилготой.", ko: "콤비를 천천히. 모든 펀치에 목적이." },
          technician: { en: "Read the pattern, then fire back immediately. No hesitation.", mn: "Хэв маягийг уншиж, тэр даруй буцаж цох. Эргэлзэхгүй.", ko: "패턴을 읽고 즉시 반격. 망설임 없이." },
        };
        const weak = WEAK_DIMS[userArchetype];
        if (!weak) return null;
        const weakColor = ARCH_TRAINING_COLORS[weak.dim] || "#60A5FA";
        const dimLabel = weak[locale] || weak.en;
        const drillHint = DRILL_HINT[userArchetype]?.[locale] || DRILL_HINT[userArchetype]?.en || "";
        return (
          <div style={{ borderRadius: 14, border: `1px solid ${weakColor}28`, background: `${weakColor}07`, padding: "12px 14px" }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: weakColor, marginBottom: 6 }}>
              🎯 {locale === "mn" ? "СУЛ ТАЛ ДАСГАЛ" : locale === "ko" ? "약점 드릴" : "WEAK DIMENSION DRILL"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{dimLabel}</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, fontWeight: 600, marginBottom: 10 }}>{drillHint}</div>
            <button
              type="button"
              onClick={wrappedHandleStart}
              style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: `${weakColor}18`, border: `1px solid ${weakColor}40`, color: weakColor, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
            >
              {locale === "mn" ? "Одоо дасгал хий →" : locale === "ko" ? "지금 훈련하기 →" : "Train This Now →"}
            </button>
          </div>
        );
      })()}

      {/* Featured Experiment — show when no active experiment */}
      {!currentExperiment && userArchetype && (() => {
        const pkg = getFeaturedPackage();
        if (!pkg) return null;
        const fighter = getPackageFighter(pkg);
        if (!fighter) return null;
        return (
          <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${pkg.accent}30`, background: `${pkg.accent}08` }}>
            <div style={{ height: 2, background: `linear-gradient(90deg, ${pkg.accent}88, transparent)` }} />
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: pkg.accent, marginBottom: 3 }}>
                    {locale === "mn" ? "ЭНЭ ДОЛОО ХОНОГ" : locale === "ko" ? "이번 주 실험" : "THIS WEEK'S EXPERIMENT"}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>
                    {pkg.week[locale] || pkg.week.en}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: pkg.accent, fontStyle: "italic", marginTop: 2 }}>
                    "{pkg.theme[locale] || pkg.theme.en}"
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${pkg.accent}18`, border: `1px solid ${pkg.accent}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  ⚗️
                </div>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 10 }}>
                {pkg.focus[locale] || pkg.focus.en}
              </div>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
                style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: `${pkg.accent}20`, border: `1px solid ${pkg.accent}45`, color: pkg.accent, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
              >
                {locale === "mn" ? `${pkg.week[locale] || pkg.week.en} эхлэх →` : locale === "ko" ? `${pkg.week[locale] || pkg.week.en} 시작 →` : `Start ${pkg.week.en} →`}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Experiment Mode widget */}
      {currentExperiment && (() => {
        const exp = currentExperiment;
        const expAcc = exp.fighterAccent || "#F5C451";
        const startSec = exp.startDate?.seconds || Math.floor(Date.now() / 1000);
        const daysElapsed = Math.min(7, Math.floor((Date.now() / 1000 - startSec) / 86400));
        const daysLeft = Math.max(0, 7 - daysElapsed);
        const isDone = daysLeft === 0;
        return (
          <div style={{
            borderRadius: 14,
            border: `1px solid ${isDone ? "rgba(52,211,153,0.3)" : `${expAcc}35`}`,
            background: isDone ? "rgba(52,211,153,0.05)" : `${expAcc}08`,
            padding: "13px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>⚗️</span>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: isDone ? "#34D399" : expAcc, textTransform: "uppercase", marginBottom: 2 }}>
                    {isDone ? t("experimentDone") : t("experimentWeekly")}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{exp.fighterName}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/fighters/${exp.fighterId}`)}
                style={{ background: `${expAcc}18`, border: `1px solid ${expAcc}40`, borderRadius: 8, padding: "5px 11px", color: expAcc, fontSize: 10.5, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
              >
                {t("experimentView")}
              </button>
            </div>

            {/* Days progress bar */}
            <div style={{ marginBottom: isDone ? 10 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.4)" }}>
                  {daysElapsed}/{7} {t("experimentDaysOf")}
                  {experimentSessionCount > 0 && (
                    <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.28)" }}>
                      · {experimentSessionCount} {locale === "mn" ? "тренинг" : locale === "ko" ? "세션" : "sessions"}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: isDone ? "#34D399" : expAcc }}>
                  {isDone
                    ? `7 ${t("experimentDaysComplete")}`
                    : `${daysLeft} ${t("experimentDaysLeft")}`}
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (daysElapsed / 7) * 100)}%`, height: "100%", background: isDone ? "#34D399" : expAcc, transition: "width 0.6s ease" }} />
              </div>
            </div>

            {isDone && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/fighter-profile`)}
                style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34D399", fontSize: 12, fontWeight: 900, cursor: "pointer", marginTop: 2 }}
              >
                {t("experimentResultsCta")}
              </button>
            )}
          </div>
        );
      })()}

    </div>
  );
}
