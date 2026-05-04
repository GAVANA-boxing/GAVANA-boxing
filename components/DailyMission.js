"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";

function formatDateKey(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().split("T")[0];
}

export default function DailyMission({ locale = "en" }) {
  const safeLocale = getLocale(locale);
  const t = (key) => translate(safeLocale, key);
  const { user, loading: authLoading } = useAuth();
  const [dailyStreak, setDailyStreak] = useState(0);
  const [bestDailyStreak, setBestDailyStreak] = useState(0);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);

  const todayKey = useMemo(() => formatDateKey(), []);

  useEffect(() => {
    if (authLoading || !user?.uid) return;
    let active = true;

    async function load() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!active) return;
        const data = snap.exists() ? snap.data() : {};
        setDailyStreak(Number(data.dailyStreak) || 0);
        setBestDailyStreak(Number(data.bestDailyStreak) || 0);
        setMissionCompleted(data.dailyMissionCompleted === todayKey);
      } catch (e) {
        console.error("DailyMission load error:", e);
      }
    }

    load();
    return () => { active = false; };
  }, [authLoading, user?.uid, todayKey]);

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

  if (authLoading || !user?.uid) return null;

  const next3 = dailyStreak < 3 ? 3 - dailyStreak : null;
  const next7 = dailyStreak < 7 ? 7 - dailyStreak : null;

  if (!expanded) {
    return (
      <button
        ref={containerRef}
        type="button"
        className={missionCompleted ? undefined : "fire-pulse"}
        onClick={() => setExpanded(true)}
        style={pillStyles.fireButton}
        aria-label={t("todaysMission")}
      >
        <span style={pillStyles.fireEmoji}>{missionCompleted ? "✅" : "🎯"}</span>
        {dailyStreak > 0 && (
          <span style={{ ...pillStyles.fireStreak, color: missionCompleted ? "#34D399" : "#FB923C" }}>
            🔥{dailyStreak}
          </span>
        )}
      </button>
    );
  }

  return (
    <div ref={containerRef} style={pillStyles.pill}>
      <div style={pillStyles.pillTop}>
        <span style={pillStyles.pillLabel}>{t("todaysMission")}</span>
        <button type="button" style={pillStyles.closeBtn} onClick={() => setExpanded(false)} aria-label="close">✕</button>
      </div>

      {/* Mission status */}
      <div style={pillStyles.missionRow}>
        <span style={pillStyles.missionIcon}>{missionCompleted ? "✅" : "🎯"}</span>
        <div style={pillStyles.missionText}>
          <span style={{ ...pillStyles.missionTitle, color: missionCompleted ? "#34D399" : "#fff" }}>
            {missionCompleted ? t("missionCompleteLabel") : t("missionTarget")}
          </span>
          {!missionCompleted && (
            <span style={pillStyles.missionHint}>{t("missionPendingHint")}</span>
          )}
          {missionCompleted && (
            <span style={{ ...pillStyles.missionHint, color: "#34D399" }}>+50 XP {t("reward")}</span>
          )}
        </div>
      </div>

      <div style={pillStyles.divider} />

      {/* Streak stats */}
      <div style={pillStyles.streakRow}>
        <div style={pillStyles.streakStat}>
          <span style={{ ...pillStyles.streakNum, color: "#FB923C" }}>🔥{dailyStreak}</span>
          <span style={pillStyles.streakLbl}>{t("missionCurrentStreak")}</span>
        </div>
        <div style={pillStyles.streakStat}>
          <span style={pillStyles.streakNum}>{bestDailyStreak}</span>
          <span style={pillStyles.streakLbl}>{t("missionBestStreak")}</span>
        </div>
      </div>

      {/* Milestone pills */}
      <div style={pillStyles.milestoneRow}>
        <div style={{ ...pillStyles.milestone, borderColor: dailyStreak >= 3 ? "#34D399" : "rgba(255,255,255,0.1)" }}>
          <span style={{ color: dailyStreak >= 3 ? "#34D399" : "#888", fontSize: 10, fontWeight: 900 }}>
            {dailyStreak >= 3 ? "✓" : `${next3}d`} 3🔥 +100
          </span>
        </div>
        <div style={{ ...pillStyles.milestone, borderColor: dailyStreak >= 7 ? "#D4AF37" : "rgba(255,255,255,0.1)" }}>
          <span style={{ color: dailyStreak >= 7 ? "#D4AF37" : "#888", fontSize: 10, fontWeight: 900 }}>
            {dailyStreak >= 7 ? "✓" : `${next7}d`} 7🔥 +250
          </span>
        </div>
      </div>

      {!missionCompleted && dailyStreak >= 2 && (
        <div style={pillStyles.warningBox}>
          <span style={{ fontSize: 10, color: "#FB923C", fontWeight: 800 }}>⚠️ {t("streakAtRisk")}</span>
        </div>
      )}
    </div>
  );
}

const pillStyles = {
  pill: {
    position: "fixed",
    top: "calc(12px + env(safe-area-inset-top))",
    left: "max(12px, env(safe-area-inset-left))",
    zIndex: 100,
    width: "min(88vw, 240px)",
    padding: "10px 12px",
    borderRadius: 18,
    background: "rgba(10,10,10,0.95)",
    border: "1px solid rgba(255,255,255,0.11)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    boxShadow: "0 10px 36px rgba(0,0,0,0.6)",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "grid",
    gap: 8,
  },
  fireButton: {
    position: "fixed",
    top: "calc(12px + env(safe-area-inset-top))",
    left: "max(12px, env(safe-area-inset-left))",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    gap: 4,
    height: 34,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.72)",
    color: "#fff",
    cursor: "pointer",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  fireEmoji: { fontSize: 15, lineHeight: 1 },
  fireStreak: { fontSize: 12, fontWeight: 900 },
  pillTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pillLabel: {
    color: "#D4AF37",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
  },
  missionRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },
  missionIcon: { fontSize: 18, lineHeight: 1, flexShrink: 0 },
  missionText: { display: "grid", gap: 2 },
  missionTitle: { fontSize: 12, fontWeight: 900, lineHeight: 1.3 },
  missionHint: { fontSize: 10, color: "#888", lineHeight: 1.3 },
  divider: { height: 1, background: "rgba(255,255,255,0.07)" },
  streakRow: { display: "flex", gap: 12 },
  streakStat: { display: "grid", gap: 2 },
  streakNum: { fontSize: 14, fontWeight: 1000, lineHeight: 1 },
  streakLbl: { fontSize: 9, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 },
  milestoneRow: { display: "flex", gap: 6 },
  milestone: {
    flex: 1,
    padding: "5px 6px",
    borderRadius: 8,
    border: "1px solid",
    background: "rgba(255,255,255,0.03)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  warningBox: {
    padding: "5px 8px",
    borderRadius: 8,
    background: "rgba(251,146,60,0.1)",
    border: "1px solid rgba(251,146,60,0.22)",
  },
};
