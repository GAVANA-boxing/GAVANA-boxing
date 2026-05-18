"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection, getDocs, limit, query, where,
  addDoc, deleteDoc, doc, updateDoc,
  serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import SkeletonBlock from "@/components/SkeletonBlock";
import { RED, GOLD } from "@/lib/tokens";

const DEMO_PROGRAMS = [
  {
    id: "demo-1",
    title: "Boxing Fundamentals",
    description: "Master stance, jab, cross, and footwork in 30 days.",
    duration: 30,
    level: "beginner",
    category: "Boxing",
    emoji: "🥊",
    color: RED,
    sessions: [
      { name: "Warm-up & Footwork", duration: "10 min" },
      { name: "Jab–Cross Drill", duration: "15 min" },
      { name: "Shadow Boxing", duration: "10 min" },
    ],
  },
  {
    id: "demo-2",
    title: "Fighter Conditioning",
    description: "Build stamina and strength for peak performance.",
    duration: 21,
    level: "intermediate",
    category: "Conditioning",
    emoji: "💪",
    color: GOLD,
    sessions: [
      { name: "HIIT Cardio", duration: "15 min" },
      { name: "Core Circuit", duration: "12 min" },
      { name: "Cool-down Stretch", duration: "8 min" },
    ],
  },
  {
    id: "demo-3",
    title: "Advanced Combinations",
    description: "Elite combo sequences for experienced fighters.",
    duration: 14,
    level: "advanced",
    category: "Boxing",
    emoji: "⚡",
    color: "#34D399",
    sessions: [
      { name: "Combination Warm-up", duration: "10 min" },
      { name: "Combo Speed Drill", duration: "20 min" },
      { name: "Heavy Bag Work", duration: "15 min" },
    ],
  },
];

const LEVEL_COLOR = { beginner: "#34D399", intermediate: GOLD, advanced: RED };

function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ProgressRing({ pct = 0, size = 56, stroke = 5, color = RED }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, pct / 100));
  return (
    <svg width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize={11} fontWeight="900">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}


export default function ProgramsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState({});   // programId → {id, completedDays, streak, ...}
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [completingDay, setCompletingDay] = useState(false);
  const [todayChecked, setTodayChecked] = useState({});  // sessionIndex → bool

  const todayKey = getLocalDateKey();

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (authLoading || !user?.uid) return;
    let active = true;

    async function load() {
      try {
        const progSnap = await getDocs(query(collection(db, "training_programs"), limit(50)));
        const progDocs = progSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const allPrograms = progDocs.length > 0 ? progDocs : DEMO_PROGRAMS;
        if (!active) return;
        setPrograms(allPrograms);

        const enrollSnap = await getDocs(query(
          collection(db, "program_enrollments"),
          where("userId", "==", user.uid)
        ));
        const enrollMap = {};
        enrollSnap.forEach((d) => { enrollMap[d.data().programId] = { id: d.id, ...d.data() }; });
        if (!active) return;
        setEnrollments(enrollMap);
      } catch (err) {
        console.error("Programs load error:", err);
        if (active) setPrograms(DEMO_PROGRAMS);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [authLoading, user?.uid]);

  const handleEnroll = async (program) => {
    if (!user?.uid || enrolling) return;
    setEnrolling(program.id);
    try {
      const ref = await addDoc(collection(db, "program_enrollments"), {
        userId: user.uid,
        programId: program.id,
        enrolledAt: serverTimestamp(),
        completedDays: [],
        streak: 0,
        lastCompletedDate: null,
      });
      setEnrollments((prev) => ({
        ...prev,
        [program.id]: { id: ref.id, userId: user.uid, programId: program.id, completedDays: [], streak: 0 },
      }));
    } catch (err) {
      console.error("Enroll error:", err);
    } finally {
      setEnrolling(null);
    }
  };

  const handleUnenroll = async (programId) => {
    const enrollment = enrollments[programId];
    if (!enrollment?.id) return;
    try {
      await deleteDoc(doc(db, "program_enrollments", enrollment.id));
      setEnrollments((prev) => { const n = { ...prev }; delete n[programId]; return n; });
      if (selectedProgram?.id === programId) setSelectedProgram(null);
    } catch (err) {
      console.error("Unenroll error:", err);
    }
  };

  const handleCompleteDay = async () => {
    if (!selectedProgram || !user?.uid || completingDay) return;
    const enrollment = enrollments[selectedProgram.id];
    if (!enrollment?.id) return;

    setCompletingDay(true);
    try {
      const completedDays = enrollment.completedDays || [];
      const yesterday = getLocalDateKey(new Date(Date.now() - 86400000));
      const newStreak = completedDays.includes(yesterday) ? (enrollment.streak || 0) + 1 : 1;

      await updateDoc(doc(db, "program_enrollments", enrollment.id), {
        completedDays: arrayUnion(todayKey),
        streak: newStreak,
        lastCompletedDate: todayKey,
        updatedAt: serverTimestamp(),
      });

      setEnrollments((prev) => ({
        ...prev,
        [selectedProgram.id]: {
          ...prev[selectedProgram.id],
          completedDays: [...completedDays, todayKey],
          streak: newStreak,
          lastCompletedDate: todayKey,
        },
      }));
      setTodayChecked({});
      setSelectedProgram(null);
    } catch (err) {
      console.error("Complete day error:", err);
    } finally {
      setCompletingDay(false);
    }
  };

  const enrolledPrograms = useMemo(() => programs.filter((p) => enrollments[p.id]), [programs, enrollments]);
  const discoverPrograms = useMemo(() => programs.filter((p) => !enrollments[p.id]), [programs, enrollments]);

  const allSessionsDone = useMemo(() => {
    if (!selectedProgram?.sessions?.length) return false;
    return selectedProgram.sessions.every((_, i) => todayChecked[i]);
  }, [selectedProgram, todayChecked]);

  if (authLoading || (!user && !authLoading)) {
    return <div style={s.page}><div style={{ padding: 40, textAlign: "center", color: "#555" }}>...</div></div>;
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button type="button" style={s.backBtn} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div>
          <p style={s.kicker}>GAVANA BOXING</p>
          <h1 style={s.title}>
            {t("programsTitle")}
          </h1>
        </div>
      </header>

      <div style={s.content}>
        {/* AI Builder banner */}
        <button
          type="button"
          style={s.aiBuilderBanner}
          onClick={() => router.push(`/${locale}/workout/builder`)}
        >
          <span style={{ fontSize: 28 }}>🤖</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>
              {t("programsAiBuilder")}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
              {t("programsAiBuilderCta")}
            </div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 16, color: "rgba(212,175,55,0.7)" }}>›</span>
        </button>

        {loading ? (
          <>
            <SkeletonBlock height={24} radius={8} />
            <SkeletonBlock height={160} />
            <SkeletonBlock height={24} radius={8} />
            <SkeletonBlock height={100} />
            <SkeletonBlock height={100} />
          </>
        ) : (<>

          {/* ── My Programs ── */}
          {enrolledPrograms.length > 0 && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>
                {t("programsMy")}
              </h2>
              {enrolledPrograms.map((program) => {
                const enrollment = enrollments[program.id];
                const completedDays = enrollment?.completedDays || [];
                const total = program.duration || program.durationDays || 30;
                const pct = Math.round((completedDays.length / total) * 100);
                const streak = enrollment?.streak || 0;
                const doneToday = completedDays.includes(todayKey);
                const color = program.color || LEVEL_COLOR[program.level] || RED;

                return (
                  <div key={program.id} style={{ ...s.enrolledCard, borderLeft: `3px solid ${color}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 18 }}>{program.emoji || "🥊"}</p>
                        <p style={s.enrolledTitle}>{program.title}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>
                          {completedDays.length}/{total} {t("programsDaysUnit")}
                        </p>
                        {streak > 0 && (
                          <div style={s.streakBadge}>
                            🔥 {streak} {t("programsDayStreak")}
                          </div>
                        )}
                      </div>
                      <ProgressRing pct={pct} size={56} color={color} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        style={{
                          ...s.continueBtn,
                          background: doneToday ? "#1a3d2e" : color,
                          color: doneToday ? "#34D399" : "#fff",
                          cursor: doneToday ? "default" : "pointer",
                        }}
                        onClick={() => { if (!doneToday) { setTodayChecked({}); setSelectedProgram(program); } }}
                        disabled={doneToday}
                      >
                        {doneToday ? t("programsDoneToday") : t("programsContinue")}
                      </button>
                      <button type="button" style={s.unenrollBtn} onClick={() => handleUnenroll(program.id)}>
                        {t("programsLeave")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* ── Discover ── */}
          {discoverPrograms.length > 0 && (
            <section style={s.section}>
              <h2 style={s.sectionTitle}>
                {t("programsDiscover")}
              </h2>
              {discoverPrograms.map((program) => {
                const color = program.color || LEVEL_COLOR[program.level] || RED;
                const levelKeyMap = { beginner: "levelBeginner", intermediate: "levelIntermediate", advanced: "levelAdvanced" };
                const levelLabel = program.level ? t(levelKeyMap[program.level] || program.level) : "";
                return (
                  <div key={program.id} style={{ ...s.discoverCard, borderLeft: `3px solid ${color}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ ...s.programEmoji, background: color + "22" }}>{program.emoji || "🥊"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{program.title}</p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "5px 0" }}>
                          {levelLabel && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: color, background: color + "22", border: `1px solid ${color}44`, padding: "2px 8px", borderRadius: 999 }}>
                              {levelLabel}
                            </span>
                          )}
                          {program.category && (
                            <span style={s.metaChip}>{program.category}</span>
                          )}
                          <span style={s.metaChip}>
                            📅 {program.duration || program.durationDays || 30} {t("programsDayShort")}
                          </span>
                        </div>
                        {program.description && (
                          <p style={{ margin: 0, fontSize: 12, color: "#666", lineHeight: 1.4 }}>
                            {program.description.slice(0, 90)}{program.description.length > 90 ? "…" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{ ...s.enrollBtn, background: color, opacity: enrolling === program.id ? 0.6 : 1 }}
                      onClick={() => handleEnroll(program)}
                      disabled={!!enrolling}
                    >
                      {enrolling === program.id ? "…" : t("programsEnroll")}
                    </button>
                  </div>
                );
              })}
            </section>
          )}

          {programs.length === 0 && !loading && (
            <div style={s.empty}>
              <p style={{ fontSize: 40, margin: 0 }}>🥊</p>
              <p style={{ color: "#666", margin: "12px 0 0", fontSize: 14 }}>
                {t("programsNone")}
              </p>
            </div>
          )}
        </>)}
      </div>

      {/* ── Session Checklist Sheet ── */}
      {selectedProgram && (
        <div style={s.sheetWrap}>
          <div style={s.sheetOverlay} onClick={() => setSelectedProgram(null)} />
          <div style={s.sheet}>
            <div style={s.sheetHandle} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={s.sheetKicker}>
                  {t("programsTodaySessions")}
                </p>
                <p style={s.sheetTitle}>{selectedProgram.title}</p>
              </div>
              <button type="button" style={s.closeSheetBtn} onClick={() => setSelectedProgram(null)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {(selectedProgram.sessions || []).map((session, i) => (
                <label
                  key={i}
                  style={{
                    ...s.sessionRow,
                    background: todayChecked[i] ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.04)",
                    borderColor: todayChecked[i] ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!todayChecked[i]}
                    onChange={(e) => setTodayChecked((prev) => ({ ...prev, [i]: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: "#34D399", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: 0, fontSize: 14, fontWeight: 800,
                      color: todayChecked[i] ? "#34D399" : "#fff",
                      textDecoration: todayChecked[i] ? "line-through" : "none",
                    }}>
                      {session.name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>{session.duration}</p>
                  </div>
                  {todayChecked[i] && <span style={{ fontSize: 16, flexShrink: 0, color: "#34D399" }}>✓</span>}
                </label>
              ))}
            </div>

            <button
              type="button"
              style={{
                ...s.completeDayBtn,
                background: allSessionsDone ? "#34D399" : RED,
                opacity: completingDay ? 0.6 : 1,
              }}
              onClick={handleCompleteDay}
              disabled={completingDay}
            >
              {completingDay ? "…" : t("programsCompleteDay")}
            </button>
          </div>
        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}

const s = {
  aiBuilderBanner: { width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: "3px 14px 14px 3px", background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(212,175,55,0.18)", borderLeft: "2.5px solid #D4AF37", cursor: "pointer", marginBottom: 20, textAlign: "left" },
  page: {
    minHeight: "100dvh",
    background: "#050505",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    paddingBottom: "calc(64px + env(safe-area-inset-bottom))",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "calc(16px + env(safe-area-inset-top)) 16px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    position: "sticky",
    top: 0,
    background: "rgba(5,5,5,0.96)",
    backdropFilter: "blur(16px)",
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    borderRadius: 10,
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },
  kicker: {
    margin: 0,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: GOLD,
  },
  title: {
    margin: "2px 0 0",
    fontSize: 20,
    fontWeight: 900,
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    overflowY: "auto",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#888",
    paddingBottom: 2,
  },
  enrolledCard: {
    background: "linear-gradient(145deg, #111012, #0a0a0a)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "3px 14px 14px 3px",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  enrolledTitle: {
    margin: "6px 0 0",
    fontSize: 15,
    fontWeight: 900,
    color: "#fff",
  },
  streakBadge: {
    display: "inline-flex",
    alignSelf: "flex-start",
    marginTop: 7,
    padding: "3px 10px",
    borderRadius: 999,
    background: "rgba(251,146,60,0.12)",
    border: "1px solid rgba(251,146,60,0.28)",
    color: "#FB923C",
    fontSize: 11,
    fontWeight: 800,
  },
  continueBtn: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    fontSize: 13,
    fontWeight: 900,
    color: "#fff",
    transition: "opacity 0.15s",
  },
  unenrollBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  discoverCard: {
    background: "linear-gradient(145deg, #111012, #0a0a0a)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "3px 14px 14px 3px",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  programEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    flexShrink: 0,
  },
  metaChip: {
    fontSize: 10,
    fontWeight: 700,
    color: "#888",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 999,
    padding: "2px 8px",
  },
  enrollBtn: {
    padding: "10px 0",
    borderRadius: 10,
    border: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    width: "100%",
    transition: "opacity 0.15s",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  sheetWrap: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  sheetOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.62)",
    backdropFilter: "blur(8px)",
  },
  sheet: {
    position: "relative",
    width: "100%",
    maxWidth: 480,
    background: "linear-gradient(180deg, #151111, #080808)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px 24px 0 0",
    padding: "20px 20px calc(32px + env(safe-area-inset-bottom))",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    background: "rgba(255,255,255,0.18)",
    margin: "0 auto 16px",
  },
  sheetKicker: {
    margin: 0,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#888",
  },
  sheetTitle: {
    margin: "3px 0 0",
    fontSize: 16,
    fontWeight: 900,
    color: "#fff",
  },
  closeSheetBtn: {
    background: "rgba(255,255,255,0.07)",
    border: "none",
    color: "#fff",
    width: 32,
    height: 32,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    flexShrink: 0,
  },
  sessionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid",
    transition: "background 0.15s, border-color 0.15s",
  },
  completeDayBtn: {
    width: "100%",
    padding: "14px 0",
    borderRadius: 14,
    border: "none",
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    transition: "background 0.3s",
  },
};
