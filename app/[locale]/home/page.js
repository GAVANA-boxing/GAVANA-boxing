"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { loc } from "@/lib/loc";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import { computeFighterDNA } from "@/lib/fighterDNA";
import { getFighterRank } from "@/lib/xp";
import { useRankData } from "@/hooks/useRankData";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import { DAILY_MISSIONS } from "@/components/ai-coach/TodayMissionBanner";
import { getFeaturedPackage } from "@/lib/experimentPackages";
import { getLocalDateKey } from "@/lib/utils";
import { RED, GOLD, whiteAlpha } from "@/lib/tokens";
import BottomNav from "@/components/BottomNav";
import ProgressGlance from "@/components/progress/ProgressGlance";
import CoachAssignmentCard from "@/components/coach/team/CoachAssignmentCard";
import AcademyNextCard from "@/components/train/AcademyNextCard";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { useCoachMembership } from "@/hooks/useCoachMembership";
import { dayStartMs, toMs } from "@/lib/coach/team";
import { CORE_MODE } from "@/lib/coreRoutes";

const COND = "var(--font-condensed, 'Barlow Condensed', sans-serif)";
const DISP = "var(--font-display, 'Anton', sans-serif)";

const WD = {
  mn: ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"],
  ko: ["월", "화", "수", "목", "금", "토", "일"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

function sessionMs(s) {
  const ts = s.createdAt;
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (ts.seconds) return ts.seconds * 1000;
  return Number(ts) || 0;
}

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();
  const { sessions } = useCombatMemory({ user });
  const coach = useCoachMembership(user);
  const academy = useAcademyProgress({ user });
  const today0 = dayStartMs(Date.now(), new Date().getTimezoneOffset());
  const roundsToday = sessions.filter((s) => (s.type == null || s.type === "training") && toMs(s.createdAt) >= today0).length;

  // Shared, single-subscription profile (no per-page user-doc fetch).
  const { profile: userData } = useUserProfile();
  const [tribeCount, setTribeCount] = useState(null);

  const dna = computeFighterDNA({ sessions, locale });
  // One XP number everywhere: the same account XP and rank ladder as /progress.
  const { xp: accountXp } = useRankData({ user, authLoading });
  const xp = accountXp ?? (Number(userData?.xp) || 0);
  const rank = getFighterRank(xp);
  const accent = (!dna.building && ARCH_TRAINING_COLORS[dna.archetypeKey]) || RED;
  const displayName = userData?.displayName || user?.displayName || loc(locale, "Тулаанч", "파이터", "Fighter");
  const streak = Number(userData?.dailyStreak) || 0;
  const confidencePct = dna.building ? null : Math.round((dna.confidence || 0) * 100);
  const wins = Number(userData?.wins);
  const losses = Number(userData?.losses);
  const hasRecord = Number.isFinite(wins) && Number.isFinite(losses);
  const pkg = getFeaturedPackage();

  useEffect(() => {
    if (!dna.archetypeKey || dna.building) return;
    let active = true;
    (async () => {
      try {
        // A count, not the documents: nobody's profile is downloaded just to show a number.
        const { collection, getCountFromServer, query, where } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getCountFromServer(query(collection(db, "users"), where("fighterDNA.archetypeKey", "==", dna.archetypeKey)));
        if (active) setTribeCount(snap.data().count);
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [dna.archetypeKey, dna.building]);

  const mission = DAILY_MISSIONS[new Date().getDay()];
  const missionFocus = locale === "mn" ? mission.mn : locale === "ko" ? mission.ko : mission.en;

  const weekTrained = (() => {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(now.getDate() - dow);
    const keys = new Set(sessions.map((s) => { const ms = sessionMs(s); return ms ? getLocalDateKey(new Date(ms)) : null; }).filter(Boolean));
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return keys.has(getLocalDateKey(d)); });
  })();
  const todayIdx = (new Date().getDay() + 6) % 7;


  const go = (path) => router.push(`/${locale}${path}`);

  const S = {
    wrap: { minHeight: "100dvh", background: "#060607", color: "#fff", overflowX: "hidden", paddingBottom: "calc(92px + env(safe-area-inset-bottom))" },
    gut: { paddingLeft: "max(18px, env(safe-area-inset-left))", paddingRight: "max(18px, env(safe-area-inset-right))" },
    lbl: { fontFamily: COND, fontWeight: 700, fontSize: 11, letterSpacing: 2.4, textTransform: "uppercase", color: whiteAlpha(0.55), marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" },
    link: { color: accent, fontSize: 12, cursor: "pointer" },
    sec: { marginTop: 24 },
  };

  return (
    <div style={S.wrap}>
      <div style={S.gut}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "calc(env(safe-area-inset-top) + 16px)", marginBottom: 18 }}>
          <span style={{ fontFamily: DISP, fontSize: 19, letterSpacing: 2 }}>GAVANA</span>
          <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            {streak > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: COND, fontWeight: 700, fontSize: 14, color: GOLD, background: "rgba(245,196,81,0.14)", padding: "5px 11px", borderRadius: 20 }}>🔥 {streak}</span>}
            <button type="button" aria-label={loc(locale, "Мэдэгдэл", "알림", "Notifications")} onClick={() => go("/notifications")} style={{ width: 42, height: 42, borderRadius: 13, background: whiteAlpha(0.05), display: "grid", placeItems: "center", color: whiteAlpha(0.58), border: "none", cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
            </button>
          </div>
        </div>

        {/* FIGHTER CARD */}
        <div style={{ position: "relative", borderRadius: 26, overflow: "hidden", padding: 22, isolation: "isolate", background: `radial-gradient(120% 80% at 50% -10%, ${accent}55, transparent 58%), linear-gradient(160deg,#141416 0%,#0a0a0b 60%,#050506 100%)`, boxShadow: `0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08), inset 0 0 0 1px ${accent}38` }}>
          <div className="card-sheen" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,.10) 45%, transparent 60%)", backgroundSize: "250% 250%", backgroundPosition: "120% 0" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: COND, fontWeight: 700, fontSize: 12, letterSpacing: 2.4, textTransform: "uppercase", color: whiteAlpha(0.55) }}>
              <span>GAVANA · Fighter</span><span>{new Date().getFullYear()}</span>
            </div>
            {dna.building ? (
              <>
                <div style={{ marginTop: 40, fontFamily: COND, fontWeight: 700, fontSize: 13, letterSpacing: 1.8, textTransform: "uppercase", color: whiteAlpha(0.4) }}>{loc(locale, "ДНХ бүрдэж байна", "DNA 구축 중", "Building DNA")}</div>
                <div style={{ margin: "4px 0 0", fontFamily: DISP, fontSize: "clamp(42px,13vw,56px)", lineHeight: 0.9, textTransform: "uppercase" }}>{displayName}</div>
                <div style={{ marginTop: 16, fontFamily: COND, fontWeight: 600, fontSize: 13.5, color: whiteAlpha(0.58) }}>{loc(locale, `Fighter DNA нээхэд ${dna.sessionsNeeded ?? 3} бэлтгэл дутуу`, `파이터 DNA까지 ${dna.sessionsNeeded ?? 3}회 더`, `Train ${dna.sessionsNeeded ?? 3} more sessions to unlock your Fighter DNA`)}</div>
              </>
            ) : (
              <>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 40, fontFamily: COND, fontWeight: 700, fontSize: 13, letterSpacing: 1.8, textTransform: "uppercase", color: accent }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: `0 0 12px ${accent}` }} />{dna.archetype}
                </div>
                <div style={{ margin: "4px 0 0", fontFamily: DISP, fontSize: "clamp(46px,14vw,62px)", lineHeight: 0.9, letterSpacing: "-0.01em", textTransform: "uppercase", textShadow: `0 0 60px ${accent}72` }}>{displayName}</div>
                <div style={{ height: 1, background: whiteAlpha(0.08), margin: "20px 0 16px" }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
                  {[
                    { k: loc(locale, "Цол", "등급", "Rank"), v: <span style={{ color: rank.color }}>{(t(rank.key) || "").split(" ")[0] || t(rank.key)}</span> },
                    { k: "Fighter DNA", v: <>{confidencePct}<small style={{ fontFamily: COND, fontSize: 13, color: whiteAlpha(0.58) }}>%</small></> },
                    ...(hasRecord ? [{ k: loc(locale, "Рекорд", "전적", "Record"), v: <>{wins}<small style={{ fontFamily: COND, fontSize: 13, color: whiteAlpha(0.58) }}>–{losses}</small></> }] : [{ k: "XP", v: xp.toLocaleString() }]),
                  ].map((c, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: i ? 16 : 0, borderLeft: i ? `1px solid ${whiteAlpha(0.08)}` : "none" }}>
                      <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 11.5, letterSpacing: 1.6, textTransform: "uppercase", color: whiteAlpha(0.55) }}>{c.k}</span>
                      <span style={{ fontFamily: DISP, fontSize: 22, lineHeight: 1 }}>{c.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
                  <span style={{ fontFamily: COND, fontWeight: 600, fontSize: 12.5, color: whiteAlpha(0.58) }}>
                    {dna.bestWeaponLabel ? <>{loc(locale, "Онцлох зэвсэг", "시그니처", "Signature")}: <b style={{ color: "#fff" }}>{dna.bestWeaponLabel}</b></> : <>{loc(locale, "Цол", "등급", "Rank")} <b style={{ color: "#fff" }}>{t(rank.key)}</b></>}
                  </span>
                  <span style={{ fontFamily: COND, fontWeight: 700, fontSize: 11.5, letterSpacing: 2, color: whiteAlpha(0.18) }}>GAVANA.APP</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* PRIMARY ACTION */}
        <button type="button" onClick={() => go("/train")} style={{ width: "100%", marginTop: 16, display: "flex", alignItems: "center", gap: 14, borderRadius: 18, background: whiteAlpha(0.05), border: `1px solid ${whiteAlpha(0.08)}`, padding: "14px 16px", cursor: "pointer", textAlign: "left", color: "#fff" }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: accent, display: "grid", placeItems: "center", flexShrink: 0, boxShadow: `0 8px 20px ${accent}5c` }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 12, letterSpacing: 1.8, textTransform: "uppercase", color: accent }}>{loc(locale, "Өнөөдрийн бэлтгэл", "오늘의 훈련", "Today's training")}</div>
            <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 18, marginTop: 2 }}>{missionFocus}</div>
            <div style={{ fontFamily: COND, fontWeight: 600, fontSize: 12, color: whiteAlpha(0.58) }}>{loc(locale, "Камертай эхлэх", "카메라로 시작", "Start with camera")}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={whiteAlpha(0.58)} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
        </button>

        {/* COACH ASSIGNMENT — only when the student joined a coach's team */}
        {coach.team && (
          <section style={S.sec}>
            <CoachAssignmentCard
              locale={locale} team={coach.team} todayCount={roundsToday}
              onStart={() => go(coach.team.drill ? `/train?drill=${coach.team.drill}` : "/train")}
            />
          </section>
        )}

        {/* PROGRESS — am I getting better? one glance (first rounds → latest rounds) */}
        {sessions.length > 0 && (
          <section style={S.sec}>
            <div style={S.lbl}><span>{loc(locale, "Чиний ахиц", "내 성장", "Your progress")}</span></div>
            <ProgressGlance locale={locale} sessions={sessions} streak={streak} onOpen={() => go("/progress")} />
          </section>
        )}

        {/* ACADEMY — the next lesson, one tap (nothing when all ten are done) */}
        {!academy.loading && (
          <section style={S.sec}>
            <AcademyNextCard lessonProgress={academy.lessonProgress} locale={locale} router={router} compact />
          </section>
        )}

        {/* QUICK */}
        <section style={S.sec}>
          <div style={S.lbl}><span>{loc(locale, "Хаашаа явах вэ", "어디로", "Where to go")}</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {(CORE_MODE ? [
              // Core loop: every quick action leads back into Train → Feedback → Progress.
              { label: loc(locale, "Тулаанчийн ДНХ", "파이터 DNA", "Fighter DNA"), path: "/fighter-profile", icon: <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3c0 6 10 6 10 12M17 3c0 6-10 6-10 12"/><path d="M8 6h8M8 18h8"/><path d="M7 21v-3M17 21v-3"/></svg> },
              { label: loc(locale, "Дэвшил", "성장", "Progress"), path: "/progress", icon: <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16V8"/><path d="M17 16V5"/></svg> },
              { label: loc(locale, "Түүх", "기록", "History"), path: "/history", icon: <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg> },
            ] : [
              { label: loc(locale, "Фийд", "피드", "Feed"), path: "/feed", icon: <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> },
              { label: loc(locale, "Академи", "아카데미", "Academy"), path: "/programs", icon: <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10 12 5l10 5-10 5z"/><path d="M6 12v5c0 1 3 2 6 2s6-1 6-2v-5"/></svg> },
              { label: loc(locale, "Сорилт", "챌린지", "Challenges"), path: "/challenges", icon: <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1 0-4h2m12 4h2a2 2 0 0 0 0-4h-2"/><path d="M6 5h12v5a6 6 0 0 1-12 0z"/><path d="M9 21h6m-3-4v4"/></svg> },
            ]).map((q) => (
              <button key={q.path} type="button" onClick={() => go(q.path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: "15px 8px", borderRadius: 15, background: whiteAlpha(0.05), border: `1px solid ${whiteAlpha(0.08)}`, cursor: "pointer", color: "#fff" }}>
                {q.icon}<span style={{ fontFamily: COND, fontWeight: 700, fontSize: 12.5 }}>{q.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* FIGHT CULTURE */}
        <section style={S.sec}>
          <div style={S.lbl}><span>{loc(locale, "Долоо хоногийн сорилт", "이번 주 챌린지", "This week")}</span></div>
          <button type="button" onClick={() => go(CORE_MODE ? "/train" : "/challenges")} style={{ width: "100%", textAlign: "left", background: whiteAlpha(0.05), border: `1px solid ${whiteAlpha(0.08)}`, borderRadius: 18, padding: 16, cursor: "pointer", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(245,196,81,0.16)", display: "grid", placeItems: "center", color: GOLD, flexShrink: 0 }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 16 3 5l5 4 4-6 4 6 5-4-2 11z"/><path d="M5 20h14"/></svg>
              </span>
              <div><div style={{ fontFamily: DISP, fontSize: 19, textTransform: "uppercase", lineHeight: 1 }}>{pkg.week[locale] || pkg.week.en}</div><div style={{ fontFamily: COND, fontWeight: 600, fontSize: 12, color: whiteAlpha(0.58), marginTop: 3 }}>{pkg.theme[locale] || pkg.theme.en}</div></div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              {(WD[locale] || WD.en).map((d, i) => {
                const done = weekTrained[i]; const today = i === todayIdx;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: COND, fontWeight: 600, fontSize: 12, color: whiteAlpha(0.55), textTransform: "uppercase" }}>{d}</span>
                    <span style={{ width: "100%", aspectRatio: "1", maxWidth: 36, borderRadius: 11, display: "grid", placeItems: "center", background: done ? "rgba(245,196,81,0.2)" : whiteAlpha(0.05), color: done ? GOLD : whiteAlpha(0.32), boxShadow: today ? `inset 0 0 0 2px ${accent}` : "none" }}>
                      {done && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
                    </span>
                  </div>
                );
              })}
            </div>
          </button>

          {tribeCount != null && tribeCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 15, background: whiteAlpha(0.05), border: `1px solid ${whiteAlpha(0.08)}`, marginTop: 12 }}>
              <span style={{ fontFamily: COND, fontWeight: 600, fontSize: 13, color: whiteAlpha(0.58) }}>
                <b style={{ color: "#fff", fontWeight: 700 }}>{tribeCount.toLocaleString()} {dna.archetype}</b> {loc(locale, "GAVANA дээр", "GAVANA에서", "on GAVANA")}
              </span>
            </div>
          )}
        </section>
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} />

      <style>{`@media (prefers-reduced-motion: no-preference){.card-sheen{animation:homeSheen 6s ease-in-out infinite}@keyframes homeSheen{0%,100%{background-position:120% 0}50%{background-position:-20% 0}}}`}</style>
    </div>
  );
}
