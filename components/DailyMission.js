"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD, RADIUS} from "@/lib/tokens";

const DRAG_THRESHOLD = 8;
const EDGE_MARGIN = 12;

function formatDateKey(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().split("T")[0];
}

function snapPosition(rawX, rawY, elW, elH) {
  const centerX = rawX + elW / 2;
  const snappedX = centerX < window.innerWidth / 2
    ? EDGE_MARGIN
    : window.innerWidth - elW - EDGE_MARGIN;
  const snappedY = Math.max(
    EDGE_MARGIN + (typeof window !== "undefined" ? parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-top") || "0") : 0),
    Math.min(window.innerHeight - elH - EDGE_MARGIN, rawY)
  );
  return { x: snappedX, y: snappedY };
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
  const posRef = useRef(null);

  const [pos, setPos] = useState(() => {
    try {
      const saved = typeof window !== "undefined" && localStorage.getItem("gavana_mission_pos");
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.x === "number" && typeof p.y === "number") {
          posRef.current = p;
          return p;
        }
      }
    } catch {}
    const defaultPos = { x: EDGE_MARGIN, y: 60 };
    posRef.current = defaultPos;
    return defaultPos;
  });

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

  const startDrag = (e) => {
    // Ignore child button interactions (close, etc.)
    if (e.target !== e.currentTarget && e.target.closest("button") && e.target.closest("button") !== e.currentTarget) return;

    const startClientX = e.touches ? e.touches[0].clientX : e.clientX;
    const startClientY = e.touches ? e.touches[0].clientY : e.clientY;
    const startPosX = posRef.current?.x ?? EDGE_MARGIN;
    const startPosY = posRef.current?.y ?? 60;
    let moved = false;

    function onMove(ev) {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = cx - startClientX;
      const dy = cy - startClientY;

      if (!moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        moved = true;
      }

      if (moved) {
        ev.preventDefault();
        const el = containerRef.current;
        const w = el ? el.offsetWidth : 100;
        const h = el ? el.offsetHeight : 40;
        const newX = Math.max(0, Math.min(window.innerWidth - w, startPosX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - h, startPosY + dy));
        posRef.current = { x: newX, y: newY };
        if (el) { el.style.left = newX + "px"; el.style.top = newY + "px"; }
      }
    }

    function onEnd() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchend", onEnd);

      if (moved) {
        // Snap to nearest screen edge
        const el = containerRef.current;
        const w = el ? el.offsetWidth : 100;
        const h = el ? el.offsetHeight : 40;
        const snapped = snapPosition(posRef.current.x, posRef.current.y, w, h);

        if (el) {
          el.style.transition = "left 220ms cubic-bezier(0.34,1.56,0.64,1), top 220ms cubic-bezier(0.34,1.56,0.64,1)";
          el.style.left = snapped.x + "px";
          el.style.top = snapped.y + "px";
          setTimeout(() => { if (el) el.style.transition = ""; }, 240);
        }

        posRef.current = snapped;
        setPos(snapped);
        try { localStorage.setItem("gavana_mission_pos", JSON.stringify(snapped)); } catch {}
      } else {
        // Pure tap — toggle open
        setExpanded((v) => !v);
      }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
  };

  if (authLoading || !user?.uid) return null;

  const next3 = dailyStreak < 3 ? 3 - dailyStreak : null;
  const next7 = dailyStreak < 7 ? 7 - dailyStreak : null;
  const dynPos = { left: pos.x, top: pos.y };

  if (!expanded) {
    return (
      <div
        ref={containerRef}
        className={missionCompleted ? undefined : "fire-pulse"}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        style={{ ...pillStyles.fireButton, ...dynPos }}
        aria-label={t("todaysMission")}
        role="button"
        tabIndex={0}
      >
        <span style={pillStyles.fireEmoji}>{missionCompleted ? "✅" : "🎯"}</span>
        {dailyStreak > 0 && (
          <span style={{ ...pillStyles.fireStreak, color: missionCompleted ? "#34D399" : "#FB923C" }}>
            🔥{dailyStreak}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ ...pillStyles.pill, ...dynPos }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <div style={pillStyles.pillTop}>
        <span style={pillStyles.pillLabel}>{t("todaysMission")}</span>
        <button
          type="button"
          style={pillStyles.closeBtn}
          onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
          aria-label="close"
        >
          ✕
        </button>
      </div>

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

      <div style={pillStyles.milestoneRow}>
        <div style={{ ...pillStyles.milestone, borderColor: dailyStreak >= 3 ? "#34D399" : "rgba(255,255,255,0.1)" }}>
          <span style={{ color: dailyStreak >= 3 ? "#34D399" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 900 }}>
            {dailyStreak >= 3 ? "✓" : `${next3}d`} 3🔥 +100
          </span>
        </div>
        <div style={{ ...pillStyles.milestone, borderColor: dailyStreak >= 7 ? GOLD : "rgba(255,255,255,0.1)" }}>
          <span style={{ color: dailyStreak >= 7 ? GOLD : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 900 }}>
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
    display: "grid",
    gap: 8,
    cursor: "grab",
    userSelect: "none",
    touchAction: "none",
  },
  fireButton: {
    position: "fixed",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    gap: 4,
    height: 34,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: RADIUS.full,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.72)",
    color: "#fff",
    cursor: "grab",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    touchAction: "none",
    userSelect: "none",
  },
  fireEmoji: { fontSize: 15, lineHeight: 1 },
  fireStreak: { fontSize: 12, fontWeight: 900 },
  pillTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  pillLabel: { color: GOLD, fontSize: 9, fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase" },
  closeBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", padding: 0 },
  missionRow: { display: "flex", alignItems: "flex-start", gap: 8 },
  missionIcon: { fontSize: 18, lineHeight: 1, flexShrink: 0 },
  missionText: { display: "grid", gap: 2 },
  missionTitle: { fontSize: 12, fontWeight: 900, lineHeight: 1.3 },
  missionHint: { fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.3 },
  divider: { height: 1, background: "rgba(255,255,255,0.07)" },
  streakRow: { display: "flex", gap: 12 },
  streakStat: { display: "grid", gap: 2 },
  streakNum: { fontSize: 14, fontWeight: 1000, lineHeight: 1 },
  streakLbl: { fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 },
  milestoneRow: { display: "flex", gap: 6 },
  milestone: {
    flex: 1, padding: "5px 6px", borderRadius: 8, border: "1px solid",
    background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center",
  },
  warningBox: {
    padding: "5px 8px", borderRadius: 8,
    background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.22)",
  },
};
