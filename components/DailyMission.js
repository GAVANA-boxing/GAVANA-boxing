"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";

const DAILY_TARGET = 50;

const STREAK_LEVELS = [
  { key: "levelAmateur",  threshold: 0,  color: "#9CA3AF", gradient: "linear-gradient(90deg,#4B5563,#9CA3AF)" },
  { key: "levelFighter",  threshold: 3,  color: "#60A5FA", gradient: "linear-gradient(90deg,#2563EB,#60A5FA)" },
  { key: "levelPro",      threshold: 7,  color: "#A78BFA", gradient: "linear-gradient(90deg,#7C3AED,#A78BFA)" },
  { key: "levelElite",    threshold: 14, color: "#FB923C", gradient: "linear-gradient(90deg,#EA580C,#FB923C)" },
  { key: "levelChampion", threshold: 30, color: "#D4AF37", gradient: "linear-gradient(90deg,#92400E,#D4AF37)" },
];

function getLevel(streak) {
  let level = STREAK_LEVELS[0];
  for (const l of STREAK_LEVELS) {
    if (streak >= l.threshold) level = l;
  }
  return level;
}

function getNextLevel(streak) {
  for (const l of STREAK_LEVELS) {
    if (streak < l.threshold) return l;
  }
  return null;
}

function getLevelProgressPercent(streak) {
  const current = getLevel(streak);
  const next = getNextLevel(streak);
  if (!next) return 100;
  const range = next.threshold - current.threshold;
  const done = streak - current.threshold;
  return Math.min(100, Math.round((done / range) * 100));
}

function formatDateKey(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().split("T")[0];
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export default function DailyMission({ locale = "en" }) {
  const safeLocale = getLocale(locale);
  const t = (key) => translate(safeLocale, key);
  const { user, loading: authLoading } = useAuth();
  const [streakCount, setStreakCount] = useState(0);
  const [dailyPunchCount, setDailyPunchCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const containerRef = useRef(null);

  const todayKey = useMemo(() => formatDateKey(), []);
  const yesterdayKey = useMemo(() => getYesterdayKey(), []);
  const progressPercent = Math.min(100, Math.round((dailyPunchCount / DAILY_TARGET) * 100));
  const complete = dailyPunchCount >= DAILY_TARGET;

  const level = getLevel(streakCount);
  const nextLevel = getNextLevel(streakCount);
  const levelProgressPercent = getLevelProgressPercent(streakCount);
  const daysToNext = nextLevel ? nextLevel.threshold - streakCount : 0;
  // Warning: active streak at risk (not completed today's mission)
  const showWarning = streakCount >= 2 && !complete;

  // Collapse after 3 s — never fully disappear
  useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Collapse on outside click/touch
  useEffect(() => {
    if (!expanded) return;
    function onOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [expanded]);

  useEffect(() => {
    if (authLoading || !user?.uid) return;
    let active = true;

    async function loadMission() {
      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);
        const data = snapshot.exists() ? snapshot.data() : {};
        const currentStreak = Number(data.streakCount) || 0;
        const lastActive = data.lastActiveDate || "";
        const savedMissionDate = data.dailyMissionDate || "";
        const savedPunches = Number(data.dailyPunchCount) || 0;

        let nextStreak = currentStreak;
        let nextPunchCount = savedPunches;
        const updates = {};

        if (lastActive !== todayKey) {
          nextStreak = lastActive === yesterdayKey ? Math.max(1, currentStreak + 1) : 1;
          updates.streakCount = nextStreak;
          updates.lastActiveDate = todayKey;
        }

        if (savedMissionDate !== todayKey) {
          nextPunchCount = 0;
          updates.dailyMissionDate = todayKey;
          updates.dailyPunchCount = 0;
        }

        if (Object.keys(updates).length > 0) {
          await setDoc(userRef, updates, { merge: true });
        }

        if (active) {
          setStreakCount(nextStreak);
          setDailyPunchCount(nextPunchCount);
        }
      } catch (err) {
        console.error("Daily mission load error:", err);
      }
    }

    loadMission();
    return () => { active = false; };
  }, [authLoading, user?.uid, todayKey, yesterdayKey]);

  const handleAddPunches = async () => {
    if (!user?.uid || saving) return;
    const userRef = doc(db, "users", user.uid);
    const nextCount = Math.min(DAILY_TARGET, dailyPunchCount + 10);
    setSaving(true);
    try {
      await updateDoc(userRef, {
        dailyPunchCount: nextCount,
        dailyMissionDate: todayKey,
        lastActiveDate: todayKey,
      });
      setDailyPunchCount(nextCount);
    } catch (err) {
      console.error("Failed to update daily punches:", err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user?.uid) return null;

  const levelName = t(level.key);
  const streakTitleText = t("streakTitle").replace("{n}", streakCount);
  const levelLabelText = t("levelLabel").replace("{level}", levelName.toUpperCase());
  const nextLevelText = nextLevel
    ? t("nextLevelIn").replace("{level}", t(nextLevel.key)).replace("{n}", daysToNext)
    : t("atMaxLevel");

  // ── Collapsed: persistent pulsing 🔥 button ──
  if (!expanded) {
    return (
      <button
        ref={containerRef}
        type="button"
        className="fire-pulse"
        onClick={() => setExpanded(true)}
        style={styles.fireButton}
        aria-label={`${streakTitleText} — ${levelName}`}
        title={`${levelLabelText} · ${nextLevelText}`}
      >
        <span style={styles.fireEmoji}>{"🔥"}</span>
        <span style={{ ...styles.fireStreak, color: level.color }}>{streakCount}</span>
      </button>
    );
  }

  // ── Expanded card ──
  return (
    <div ref={containerRef} style={styles.pill}>
      {/* Top row */}
      <div style={styles.pillTop}>
        <span style={styles.pillLabel}>{t("todaysMission")}</span>
        <button
          type="button"
          style={styles.closeBtn}
          onClick={() => setExpanded(false)}
          aria-label="close"
        >
          ✕
        </button>
      </div>

      {/* 🔥 N Day Streak + level badge */}
      <div style={styles.streakRow}>
        <span style={styles.streakBig}>{"🔥"} {streakTitleText}</span>
        <span style={{ ...styles.levelBadge, background: level.gradient }}>
          {levelName}
        </span>
      </div>

      {/* Level label */}
      <div style={{ ...styles.levelLabelText, color: level.color }}>
        {levelLabelText}
      </div>

      {/* Level progress bar */}
      <div style={styles.levelBarWrap}>
        <div style={styles.levelBar}>
          <div style={{ ...styles.levelBarFill, width: `${levelProgressPercent}%`, background: level.gradient }} />
        </div>
        <span style={styles.levelBarLabel}>{nextLevelText}</span>
      </div>

      {/* Keep-training tagline */}
      <div style={styles.tagline}>
        {t("keepTraining")} {"🔥"}
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Daily mission */}
      <div style={styles.pillMission}>{t("missionTarget")}</div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
      </div>

      <div style={styles.pillFooter}>
        <span style={styles.pillStat}>{dailyPunchCount}/{DAILY_TARGET}</span>
        <button
          type="button"
          onClick={handleAddPunches}
          disabled={saving || complete}
          style={{ ...styles.addBtn, ...(complete ? styles.addBtnDone : {}) }}
        >
          {complete ? t("completed") : t("addPunches")}
        </button>
      </div>

      {/* Reward message when mission complete */}
      {complete && (
        <div style={styles.rewardBox}>
          <div style={styles.rewardTitle}>{"🎁"} {t("rewardUnlocked")}</div>
          <div style={styles.rewardSub}>{t("rewardBadge")}</div>
        </div>
      )}

      {/* Warning when streak at risk and mission not done */}
      {showWarning && (
        <div style={styles.warningBox}>
          <div style={styles.warningTitle}>{"⚠️"} {t("streakAtRisk")}</div>
          <div style={styles.warningSub}>{t("trainNow")}</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pill: {
    position: "fixed",
    top: "calc(12px + env(safe-area-inset-top))",
    left: "max(12px, env(safe-area-inset-left))",
    zIndex: 100,
    width: "min(88vw, 256px)",
    padding: "10px 12px 10px",
    borderRadius: 18,
    background: "rgba(10,10,10,0.95)",
    border: "1px solid rgba(255,255,255,0.11)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    boxShadow: "0 10px 36px rgba(0,0,0,0.6)",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  fireButton: {
    position: "fixed",
    top: "calc(12px + env(safe-area-inset-top))",
    left: "max(12px, env(safe-area-inset-left))",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.72)",
    color: "#fff",
    cursor: "pointer",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  fireEmoji: { fontSize: 16, lineHeight: 1 },
  fireStreak: { fontSize: 13, fontWeight: 900 },
  pillTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pillLabel: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#777",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
  },
  streakRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 4,
  },
  streakBig: {
    fontSize: 15,
    fontWeight: 900,
    lineHeight: 1.2,
  },
  levelBadge: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    padding: "3px 7px",
    borderRadius: 999,
    color: "#fff",
    flexShrink: 0,
  },
  levelLabelText: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  levelBarWrap: { marginBottom: 4 },
  levelBar: {
    width: "100%",
    height: 5,
    borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 4,
  },
  levelBarFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 400ms ease",
  },
  levelBarLabel: {
    fontSize: 10,
    color: "#aaa",
    lineHeight: 1.3,
  },
  tagline: {
    fontSize: 10,
    color: "#888",
    marginBottom: 8,
    marginTop: 2,
    lineHeight: 1.3,
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.07)",
    marginBottom: 8,
  },
  pillMission: {
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 6,
    color: "#eee",
  },
  progressBar: {
    width: "100%",
    height: 5,
    borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg,#C1121F,#D4AF37)",
    transition: "width 320ms ease",
  },
  pillFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pillStat: { fontSize: 11, color: "#bbb", fontWeight: 700 },
  addBtn: {
    height: 26,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#C1121F",
    color: "#fff",
    fontSize: 10,
    fontWeight: 900,
    cursor: "pointer",
  },
  addBtnDone: {
    background: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.07)",
    color: "#888",
    cursor: "default",
  },
  rewardBox: {
    marginTop: 8,
    padding: "6px 8px",
    borderRadius: 10,
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.22)",
  },
  rewardTitle: {
    fontSize: 11,
    fontWeight: 900,
    color: "#D4AF37",
    marginBottom: 2,
  },
  rewardSub: { fontSize: 10, color: "#aaa" },
  warningBox: {
    marginTop: 8,
    padding: "6px 8px",
    borderRadius: 10,
    background: "rgba(251,146,60,0.1)",
    border: "1px solid rgba(251,146,60,0.22)",
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: 900,
    color: "#FB923C",
    marginBottom: 2,
  },
  warningSub: { fontSize: 10, color: "#aaa" },
};
