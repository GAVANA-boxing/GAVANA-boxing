"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  doc, getDoc, getDocs, collection, query, where, setDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { RED, GOLD, redAlpha } from "@/lib/tokens";

const GOLD_C = GOLD;

// ── Step definitions ─────────────────────────────────────────────────────────
function getSteps(locale) {
  const mn = locale === "mn", ko = locale === "ko";
  return [
    {
      id: "style",
      icon: "🥊",
      title: mn ? "Өөрийн хэв маягаа сонго" : ko ? "스타일 선택" : "Choose Your Style",
      desc: mn ? "Чиний тулааны хэв маягийг тодорхойлно" : ko ? "당신의 전투 스타일을 정의합니다" : "Define your fighting identity",
      cta: mn ? "Хэв маяг сонгох" : ko ? "스타일 선택하기" : "Pick Your Style",
      ctaPath: "onboarding",
      xp: 50,
    },
    {
      id: "train",
      icon: "🎥",
      title: mn ? "Эхний дасгалаа хий" : ko ? "첫 훈련 완료" : "Complete First Training",
      desc: mn ? "30 секундын shadow boxing session хий" : ko ? "30초 섀도우복싱 세션 완료" : "Do a 30-second shadow boxing session",
      cta: mn ? "Дасгал эхлэх" : ko ? "훈련 시작" : "Start Training",
      ctaPath: "train",
      xp: 100,
    },
    {
      id: "feedback",
      icon: "🧠",
      title: mn ? "AI feedback аваарай" : ko ? "AI 피드백 받기" : "Get AI Feedback",
      desc: mn ? "Дасгалынхаа үр дүнг AI-аар дүгнүүл" : ko ? "AI로 훈련 결과를 분석하세요" : "Let AI analyse your training session",
      cta: mn ? "Үр дүн харах" : ko ? "결과 보기" : "View Results",
      ctaPath: "dashboard",
      xp: 150,
    },
    {
      id: "badge",
      icon: "🏆",
      title: mn ? "Эхний badge аваарай" : ko ? "첫 배지 획득" : "Earn Your First Badge",
      desc: mn ? "\"First Punch\" badge-ыг цуглуулаарай" : ko ? "\"First Punch\" 배지를 획득하세요" : "Collect the \"First Punch\" badge",
      cta: mn ? "Badge харах" : ko ? "배지 보기" : "View Badge",
      ctaPath: "profile",
      xp: 200,
    },
  ];
}

// ── Award first_session badge ─────────────────────────────────────────────────
async function awardFirstSessionBadge(userId) {
  const docId = `${userId}_first_session`;
  const ref = doc(db, "user_badges", docId);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return false;
    await setDoc(ref, { userId, badgeId: "first_session", earnedAt: serverTimestamp() });
    return true;
  } catch { return false; }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FirstMissionPage() {
  const pathname = usePathname();
  const locale   = getLocaleFromPathname(pathname);
  const router   = useRouter();
  const t        = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();

  const mn = locale === "mn", ko = locale === "ko";

  const [userData, setUserData]         = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [hasFeedback, setHasFeedback]   = useState(false);
  const [hasBadge, setHasBadge]         = useState(false);
  const [badgeJustEarned, setBadgeJustEarned] = useState(false);
  const [dataReady, setDataReady]       = useState(false);
  const [allDone, setAllDone]           = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const [uSnap, sessSnap, fbSnap, badgeSnap] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "ai_feedback"), where("userId", "==", user.uid))),
        getDoc(doc(db, "user_badges", `${user.uid}_first_session`)),
      ]);

      const uData = uSnap.exists() ? uSnap.data() : {};
      const sCount = sessSnap.docs.filter((d) => d.data().type === "training").length;
      const hasAiFeedback = fbSnap.size > 0 || sessSnap.docs.some((d) => {
        const s = d.data();
        return s.type === "training" && s.score != null;
      });
      const badge = badgeSnap.exists();

      setUserData(uData);
      setSessionCount(sCount);
      setHasFeedback(hasAiFeedback);
      setHasBadge(badge);
      setDataReady(true);

      // Auto-award badge when style+train+feedback are all done
      if (uData.fighterArchetype && sCount > 0 && hasAiFeedback && !badge) {
        const awarded = await awardFirstSessionBadge(user.uid);
        if (awarded) { setHasBadge(true); setBadgeJustEarned(true); }
      }

      if (uData.fighterArchetype && sCount > 0 && hasAiFeedback && (badge || true)) {
        // All 4 steps logically complete once badge exists or is awarded
      }
    } catch (e) {
      console.error("[FirstMission] load error", e);
      setDataReady(true);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (user?.uid) load();
  }, [user?.uid, load]);

  // Recheck when page gets focus (user returns from train)
  useEffect(() => {
    const handler = () => { if (user?.uid) load(); };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [user?.uid, load]);

  if (authLoading || !user || !dataReady) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0B0B0C", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: `2px solid ${RED}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const archetype    = userData?.fighterArchetype;
  const arch         = archetype ? ARCHETYPE_DISPLAY[archetype] : null;
  const stepsDone    = {
    style:    !!archetype,
    train:    sessionCount > 0,
    feedback: hasFeedback,
    badge:    hasBadge,
  };
  const steps        = getSteps(locale);
  const totalDone    = Object.values(stepsDone).filter(Boolean).length;
  const isAllDone    = totalDone === 4;
  const currentStepId = steps.find((s) => !stepsDone[s.id])?.id || "badge";

  const handleCta = (step) => {
    if (step.id === "style")    return router.push(`/${locale}/onboarding`);
    if (step.id === "train")    return router.push(`/${locale}/train`);
    if (step.id === "feedback") return router.push(`/${locale}/dashboard`);
    if (step.id === "badge")    return router.push(`/${locale}/profile`);
  };

  const totalXP = steps.reduce((sum, s) => stepsDone[s.id] ? sum + s.xp : sum, 0);

  return (
    <div style={{ minHeight: "100dvh", background: `radial-gradient(ellipse at 50% -5%, rgba(255,59,48,0.18) 0%, transparent 50%), #0B0B0C`, color: "#fff", padding: "0 0 40px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.18)} 100%{transform:scale(1);opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes xpFill { from{width:0} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 0", textAlign: "center" }}>
        <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 900, letterSpacing: 3, color: redAlpha(0.7), textTransform: "uppercase" }}>
          GAVANA · FIRST MISSION
        </p>

        {isAllDone ? (
          <div style={{ animation: "popIn 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both" }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em" }}>
              {mn ? "GAVANA-д тавтай морилно уу!" : ko ? "GAVANA에 오신 걸 환영합니다!" : "Welcome to GAVANA!"}
            </h1>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              {mn ? "Чи жинхэнэ тулаанч болж эхэллээ." : ko ? "진정한 파이터로 시작했습니다." : "You've started your journey as a fighter."}
            </p>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/train`)}
              style={{ padding: "14px 32px", borderRadius: 14, border: "none", background: RED, color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5, boxShadow: `0 12px 36px ${redAlpha(0.35)}` }}
            >
              {mn ? "🥊 Тулаанд орох" : ko ? "🥊 아레나 입장" : "🥊 Enter The Arena"}
            </button>
          </div>
        ) : (
          <>
            {/* Archetype tag */}
            {arch ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 999, background: `${arch.color}18`, border: `1px solid ${arch.color}35`, marginBottom: 16, animation: "slideUp 0.4s ease both" }}>
                <span style={{ fontSize: 18 }}>{arch.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: arch.color }}>{arch.name}</span>
              </div>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>🥊</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                  {mn ? "Хэв маяг сонгоогүй" : ko ? "스타일 미선택" : "Style not set"}
                </span>
              </div>
            )}

            <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>
              {mn ? "🥊 Эхний даалгавар" : ko ? "🥊 첫 번째 미션" : "🥊 Welcome Fighter"}
            </h1>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {mn ? `${totalDone}/4 дууссан · ${totalXP} XP цуглуулсан` : ko ? `${totalDone}/4 완료 · ${totalXP} XP 획득` : `${totalDone}/4 complete · ${totalXP} XP earned`}
            </p>

            {/* Overall progress bar */}
            <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 28, maxWidth: 320, margin: "0 auto 28px" }}>
              <div style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${RED}, ${GOLD_C})`, width: `${(totalDone / 4) * 100}%`, boxShadow: `0 0 12px ${redAlpha(0.5)}`, animation: "xpFill 0.8s cubic-bezier(0.16,1,0.3,1) both", transition: "width 0.6s ease" }} />
            </div>
          </>
        )}
      </div>

      {/* ── Mission Steps ── */}
      {!isAllDone && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12, maxWidth: 540, margin: "0 auto" }}>
          {steps.map((step, idx) => {
            const done    = stepsDone[step.id];
            const active  = step.id === currentStepId;
            const locked  = !done && !active;
            const isBadgeJust = step.id === "badge" && badgeJustEarned;

            return (
              <div
                key={step.id}
                style={{
                  position: "relative",
                  borderRadius: 18,
                  padding: "16px 18px",
                  background: done
                    ? "rgba(52,211,153,0.06)"
                    : active
                    ? `linear-gradient(135deg, ${redAlpha(0.12)}, rgba(0,0,0,0))`
                    : "rgba(255,255,255,0.025)",
                  border: done
                    ? "1px solid rgba(52,211,153,0.2)"
                    : active
                    ? `1px solid ${redAlpha(0.35)}`
                    : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: active ? `0 0 30px ${redAlpha(0.1)}` : "none",
                  opacity: locked ? 0.45 : 1,
                  transition: "all 0.3s",
                  animation: `slideUp ${0.2 + idx * 0.07}s ease both`,
                }}
              >
                {/* Active glow */}
                {active && !done && (
                  <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: `radial-gradient(ellipse at 20% 50%, ${redAlpha(0.1)}, transparent 60%)`, pointerEvents: "none" }} />
                )}

                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Step icon / status */}
                  <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 13, background: done ? "rgba(52,211,153,0.15)" : active ? redAlpha(0.15) : "rgba(255,255,255,0.05)", border: `1px solid ${done ? "rgba(52,211,153,0.3)" : active ? redAlpha(0.3) : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: done ? "checkPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both" : "none" }}>
                    {done ? "✅" : locked ? "🔒" : step.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Step number + XP */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: done ? "#34D399" : active ? RED : "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                        {mn ? `${idx + 1}-р алхам` : ko ? `${idx + 1}단계` : `Step ${idx + 1}`}
                        {done && (mn ? " · Дууссан" : ko ? " · 완료" : " · Done")}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 900, color: GOLD_C, opacity: done ? 1 : 0.5 }}>+{step.xp} XP</span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 900, color: done ? "rgba(255,255,255,0.55)" : "#fff", marginBottom: 3, textDecoration: done ? "line-through" : "none" }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{step.desc}</div>

                    {/* Badge just earned celebration */}
                    {isBadgeJust && (
                      <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: `${GOLD_C}18`, border: `1px solid ${GOLD_C}35`, fontSize: 12, fontWeight: 800, color: GOLD_C, animation: "popIn 0.5s ease both" }}>
                        🏆 {mn ? "Badge олгогдлоо!" : ko ? "배지 획득!" : "Badge awarded!"}
                      </div>
                    )}

                    {/* CTA button for active step */}
                    {active && !done && (
                      <button
                        type="button"
                        onClick={() => handleCta(step)}
                        style={{ marginTop: 12, padding: "11px 20px", borderRadius: 12, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5, boxShadow: `0 8px 24px ${redAlpha(0.3)}`, display: "block", width: "100%" }}
                      >
                        {step.cta} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bottom: skip / go to feed ── */}
      {!isAllDone && (
        <div style={{ textAlign: "center", marginTop: 24, padding: "0 16px" }}>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/reels`)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.28)", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3 }}
          >
            {mn ? "Дараа хийх →" : ko ? "나중에 →" : "Explore first →"}
          </button>
        </div>
      )}
    </div>
  );
}
