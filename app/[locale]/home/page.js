"use client";

// Home — design v2 (from the owner's references): the fighter and the rank in one hero card with
// the one primary action, then this week and the scores as dials, then the next Academy lesson.
// Every number comes from lib/homeView.js (real rounds, real XP); nothing is shown for a value
// that is not known yet.
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { loc } from "@/lib/loc";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import { useRankData } from "@/hooks/useRankData";
import { useCoachMembership } from "@/hooks/useCoachMembership";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { homeView } from "@/lib/homeView";
import { dayStartMs, toMs } from "@/lib/coach/team";
import { BRAND } from "@/components/ui/brand";
import BottomNav from "@/components/BottomNav";
import CoachAssignmentCard from "@/components/coach/team/CoachAssignmentCard";
import AcademyNextCard from "@/components/train/AcademyNextCard";
import { HomeHero, HomeStats, homeBackground, glass } from "@/components/home/HomeHero";

const DISP = "var(--font-display, 'Anton', sans-serif)";
const WD = {
  mn: ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"],
  ko: ["월", "화", "수", "목", "금", "토", "일"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

const ICON = {
  dna: <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3c0 6 10 6 10 12M17 3c0 6-10 6-10 12"/><path d="M8 6h8M8 18h8"/><path d="M7 21v-3M17 21v-3"/></svg>,
  progress: <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16V8"/><path d="M17 16V5"/></svg>,
  history: <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
};

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();
  const { sessions } = useCombatMemory({ user });
  const coach = useCoachMembership(user);
  const academy = useAcademyProgress({ user });
  // Shared, single-subscription profile (no per-page user-doc fetch).
  const { profile: userData } = useUserProfile();
  // One XP number everywhere: the same account XP and rank ladder as /progress.
  const { xp: accountXp } = useRankData({ user, authLoading });
  const xp = accountXp ?? (Number(userData?.xp) || 0);

  // `now` and the avatar are read after mount: the server render has no clock or device storage
  // to agree with.
  const [now, setNow] = useState(null);
  const [avatar, setAvatar] = useState("m");
  useEffect(() => {
    setNow(new Date());
    try { if (localStorage.getItem("gavana_avatar") === "female") setAvatar("f"); } catch { /* default */ }
  }, []);

  const view = homeView({ xp, sessions, now: now || new Date(0) });
  const displayName = userData?.displayName || user?.displayName || loc(locale, "Тулаанч", "파이터", "Fighter");
  const streak = Number(userData?.dailyStreak) || 0;
  const today0 = dayStartMs(Date.now(), new Date().getTimezoneOffset());
  const roundsToday = sessions.filter((s) => (s.type == null || s.type === "training") && toMs(s.createdAt) >= today0).length;
  const go = (path) => router.push(`/${locale}${path}`);

  return (
    <div style={{ minHeight: "100dvh", background: homeBackground, color: "#fff", overflowX: "hidden", paddingBottom: "calc(110px + env(safe-area-inset-bottom))" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "calc(env(safe-area-inset-top) + 14px)" }}>
          <span style={{ fontFamily: DISP, fontSize: 20, letterSpacing: "0.08em" }}>GAVANA</span>
          <button type="button" aria-label={loc(locale, "Мэдэгдэл", "알림", "Notifications")} onClick={() => go("/notifications")}
            style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)", display: "grid", placeItems: "center", color: "#fff", cursor: "pointer" }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          </button>
        </div>

        <HomeHero
          locale={locale} name={displayName} rankName={t(view.rankKey)} xp={view.xp} rankPct={view.rankPct}
          nextRankName={view.nextRankKey ? t(view.nextRankKey) : null} xpToNext={view.xpToNext}
          streak={streak} avatar={avatar} onStart={() => go("/train")}
        />

        {/* COACH ASSIGNMENT — only when the student joined a coach's team */}
        {coach.team && (
          <div style={{ marginTop: 12 }}>
            <CoachAssignmentCard
              locale={locale} team={coach.team} todayCount={roundsToday}
              onStart={() => go(coach.team.drill ? `/train?drill=${coach.team.drill}` : "/train")}
            />
          </div>
        )}

        {/* THIS WEEK + SCORES — drawn once the clock is known (after mount) */}
        {now && (
          <div style={{ marginTop: 12 }}>
            <HomeStats
              locale={locale} week={view.week} weekLabels={WD[locale] || WD.en}
              rounds={view.rounds} avg={view.avg} best={view.best} trend={view.trend}
              onOpen={() => go("/progress")}
            />
          </div>
        )}

        {/* ACADEMY — the next lesson, one tap (nothing when all ten are done) */}
        {!authLoading && !academy.loading && (
          <div style={{ marginTop: 12 }}>
            <AcademyNextCard lessonProgress={academy.lessonProgress} locale={locale} router={router} compact accent={BRAND.gold} />
          </div>
        )}

        {/* The other places: three icons, no sentences */}
        <nav aria-label={loc(locale, "Бусад хэсэг", "다른 화면", "More")} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 12 }}>
          {[
            { label: loc(locale, "Тулаанчийн ДНХ", "파이터 DNA", "Fighter DNA"), path: "/fighter-profile", icon: ICON.dna },
            { label: loc(locale, "Дэвшил", "성장", "Progress"), path: "/progress", icon: ICON.progress },
            { label: loc(locale, "Түүх", "기록", "History"), path: "/history", icon: ICON.history },
          ].map((q) => (
            <button key={q.path} type="button" onClick={() => go(q.path)}
              style={{ ...glass, borderRadius: 20, minHeight: 84, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 6px", cursor: "pointer", color: "#fff", fontFamily: "inherit" }}>
              {q.icon}<span style={{ fontSize: 12.5, fontWeight: 700, textAlign: "center" }}>{q.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} />
    </div>
  );
}
