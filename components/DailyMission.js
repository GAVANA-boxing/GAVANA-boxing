"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";

const DAILY_TARGET = 50;

function formatDateKey(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().split("T")[0];
}

function getYesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday.toISOString().split("T")[0];
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

  // Collapse to fire button after 3 seconds; never fully hide
  useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Collapse when tapping outside the widget
  useEffect(() => {
    if (!expanded) return;

    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
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
      } catch (error) {
        console.error("Daily mission load error:", error);
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

  const streakLabel = t("dayStreak").replace("{n}", streakCount);

  // Collapsed: show persistent 🔥 fire button at top-left
  if (!expanded) {
    return (
      <button
        ref={containerRef}
        type="button"
        onClick={() => setExpanded(true)}
        style={styles.fireButton}
        aria-label={t("todaysMission")}
        title={`${t("todaysMission")} — ${streakLabel}`}
      >
        <span style={styles.fireEmoji}>{"🔥"}</span>
        <span style={styles.fireStreak}>{streakCount}</span>
      </button>
    );
  }

  // Expanded: compact card at top-left
  return (
    <div ref={containerRef} style={styles.pill}>
      <div style={styles.pillTop}>
        <div style={styles.pillMeta}>
          <span style={styles.pillLabel}>{t("todaysMission")}</span>
          <span style={styles.pillStreak}>{"🔥"} {streakLabel}</span>
        </div>
        <button
          type="button"
          style={styles.closeBtn}
          onClick={() => setExpanded(false)}
          aria-label="close"
        >
          ✕
        </button>
      </div>
      <div style={styles.pillMission}>{t("missionTarget")}</div>
      <div style={styles.progressBar} aria-label={`${progressPercent}%`}>
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
    </div>
  );
}

const styles = {
  pill: {
    position: "fixed",
    top: "calc(12px + env(safe-area-inset-top))",
    left: "max(12px, env(safe-area-inset-left))",
    zIndex: 100,
    width: "min(88vw, 248px)",
    padding: "10px 12px",
    borderRadius: 18,
    background: "rgba(11,11,11,0.92)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
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
    background: "rgba(0,0,0,0.68)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
  },
  fireEmoji: {
    fontSize: 16,
    lineHeight: 1,
  },
  fireStreak: {
    fontSize: 12,
    color: "#F7E0A1",
    fontWeight: 900,
  },
  pillTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  pillMeta: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
    minWidth: 0,
  },
  pillLabel: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pillStreak: {
    fontSize: 11,
    fontWeight: 700,
    color: "#F7E0A1",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
  },
  pillMission: {
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 8,
  },
  progressBar: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #C1121F, #D4AF37)",
    transition: "width 320ms ease",
  },
  pillFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pillStat: {
    fontSize: 12,
    color: "#ccc",
    fontWeight: 700,
  },
  addBtn: {
    height: 28,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "#C1121F",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },
  addBtnDone: {
    background: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.08)",
    color: "#999",
    cursor: "default",
  },
};
