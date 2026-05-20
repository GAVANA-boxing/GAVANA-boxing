"use client";

import { useState, useEffect } from "react";
import { translate } from "@/lib/i18n";
import { auth } from "@/lib/firebase";

// ─── Skeleton shimmer row ────────────────────────────────────────────────────

function Shimmer({ width = "100%", height = 14, radius = 6, style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: "linear-gradient(90deg, #2a2a2a 25%, #333 50%, #2a2a2a 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style,
    }} />
  );
}

// ─── Small pill chip ─────────────────────────────────────────────────────────

function Chip({ emoji, label, bg = "#2a2a2a", color = "#fff", border = "#333" }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 11px",
      borderRadius: 20,
      background: bg,
      border: `1px solid ${border}`,
      fontSize: 12,
      fontWeight: 700,
      color,
      letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    }}>
      {emoji && <span style={{ fontSize: 14 }}>{emoji}</span>}
      {label}
    </div>
  );
}

// ─── Bullet row (strength / weakness) ───────────────────────────────────────

function BulletRow({ items, type = "strength" }) {
  const isGood = type === "strength";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 800,
            color: isGood ? "#4ade80" : "#f87171",
            marginTop: 1,
            flexShrink: 0,
          }}>
            {isGood ? "✓" : "✗"}
          </span>
          <span style={{ fontSize: 13, color: "#ccc", lineHeight: 1.45 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function LoadingState({ t }) {
  return (
    <div style={{ padding: "0 20px 20px" }}>
      <p style={{ fontSize: 12, color: "#666", margin: "0 0 18px", textAlign: "center" }}>
        {t("aiBreakdownLoading")}
      </p>
      {/* Style + technique chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Shimmer width={110} height={28} radius={20} />
        <Shimmer width={90} height={28} radius={20} />
      </div>
      {/* Section title */}
      <Shimmer width={100} height={11} style={{ marginBottom: 10 }} />
      <Shimmer width="90%" height={13} style={{ marginBottom: 6 }} />
      <Shimmer width="70%" height={13} style={{ marginBottom: 18 }} />
      <Shimmer width={100} height={11} style={{ marginBottom: 10 }} />
      <Shimmer width="85%" height={13} style={{ marginBottom: 6 }} />
      <Shimmer width="60%" height={13} style={{ marginBottom: 18 }} />
      {/* Key fix card */}
      <Shimmer width="100%" height={52} radius={10} style={{ marginBottom: 14 }} />
      {/* Drill card */}
      <Shimmer width="100%" height={58} radius={10} />
    </div>
  );
}

// ─── Breakdown content ───────────────────────────────────────────────────────

function BreakdownContent({ data, t }) {
  return (
    <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Style + Technique chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
        <Chip
          emoji={data.styleEmoji}
          label={data.style}
          bg="#1f0a0a"
          color="#f87171"
          border="#7f1d1d"
        />
        <Chip
          emoji={data.techniqueEmoji}
          label={data.technique}
          bg="#1a1200"
          color="#fbbf24"
          border="#78350f"
        />
        {data.isFallback && (
          <Chip
            label="AI estimated"
            bg="#1a1a1a"
            color="#555"
            border="#333"
          />
        )}
      </div>

      {/* Strengths */}
      <p style={sectionLabel}>{t("aiBreakdownStrengths")}</p>
      <div style={{ marginBottom: 16 }}>
        <BulletRow items={data.strengths || []} type="strength" />
      </div>

      {/* Weaknesses */}
      <p style={sectionLabel}>{t("aiBreakdownWeaknesses")}</p>
      <div style={{ marginBottom: 16 }}>
        <BulletRow items={data.weaknesses || []} type="weakness" />
      </div>

      {/* Technique cue */}
      {data.techniqueCue && (
        <div style={{
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: 10,
          padding: "11px 14px",
          marginBottom: 12,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#555", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {t("aiBreakdownTechniqueCue")}
          </p>
          <p style={{ fontSize: 13, color: "#bbb", margin: 0, lineHeight: 1.5 }}>
            {data.techniqueCue}
          </p>
        </div>
      )}

      {/* Key fix */}
      <div style={{
        background: "#1c1400",
        border: "1px solid #78350f",
        borderLeft: "3px solid #f59e0b",
        borderRadius: 10,
        padding: "11px 14px",
        marginBottom: 12,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("aiBreakdownImprove")}
        </p>
        <p style={{ fontSize: 13, color: "#fde68a", margin: 0, lineHeight: 1.5 }}>
          {data.improve}
        </p>
      </div>

      {/* Next drill */}
      <div style={{
        background: "#1a0000",
        border: "1px solid #7f1d1d",
        borderLeft: "3px solid #ef4444",
        borderRadius: 10,
        padding: "11px 14px",
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("aiBreakdownNextDrill")}
        </p>
        <p style={{ fontSize: 13, color: "#fca5a5", margin: 0, lineHeight: 1.5 }}>
          {data.nextDrill}
        </p>
      </div>
    </div>
  );
}

const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: "0 0 8px",
};

// ─── Main sheet ───────────────────────────────────────────────────────────────

export default function AIBreakdownSheet({ reel, locale, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const t = (key) => translate(locale, key);

  useEffect(() => {
    if (!reel || reel.isDemo) {
      // Demo reel — use built-in breakdown
      setData({
        style: "Pressure Fighter",
        styleEmoji: "💥",
        technique: "Combo",
        techniqueEmoji: "💥",
        strengths: ["Strong forward pressure", "High punch volume"],
        weaknesses: ["Guard drops after combos", "Recovers slow after missing"],
        improve: "Keep hands high as you press forward. Short punches over big swings.",
        techniqueCue: "End every combo with guard UP — don't admire the shot.",
        nextDrill: "3-punch combo → guard reset: 50 reps, focus on hand return",
        isFallback: true,
      });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setData(null);

    auth.currentUser?.getIdToken().then((token) =>
      fetch("/api/ai-breakdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reel, locale }),
      })
    ).then((r) => r?.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.style) {
          setData(json);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel?.id, locale]); // full reel object omitted — reel.id covers identity, adding reel causes excessive re-fetches

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 9000,
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "82vh",
        overflowY: "auto",
        background: "#111",
        borderRadius: "18px 18px 0 0",
        zIndex: 9001,
        animation: "slideUp 220ms ease",
        WebkitOverflowScrolling: "touch",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#333" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🧠</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
              {t("aiBreakdownTitle")}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              fontSize: 18,
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        {loading && <LoadingState t={t} />}
        {!loading && error && (
          <div style={{ padding: "12px 20px 24px", textAlign: "center" }}>
            <p style={{ color: "#555", fontSize: 14 }}>{t("aiBreakdownError")}</p>
          </div>
        )}
        {!loading && !error && data && <BreakdownContent data={data} t={t} />}
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
