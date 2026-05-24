"use client";

import { useState, useEffect, useRef } from "react";
import { RED, GOLD, redAlpha, goldAlpha, RADIUS } from "@/lib/tokens";

const CACHE_KEY = (uid, sessionId) => `gavana_recap_${uid}_${sessionId}`;

export default function LastSessionRecap({ trainingSessions, coachSnapshot, coachContextStr, locale, router, userId }) {
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const fetchedRef = useRef(false);

  const mn = locale === "mn";
  const ko = locale === "ko";

  const lastSession = trainingSessions?.[0];
  const prevScore = trainingSessions?.[1] ? Number(trainingSessions[1].score) : null;
  const lastScore = lastSession ? Number(lastSession.score) : null;

  // Only show if last session was within 24h
  const lastTs = lastSession?.createdAt
    ? (typeof lastSession.createdAt.toMillis === "function"
        ? lastSession.createdAt.toMillis()
        : Number(lastSession.createdAt?.seconds || 0) * 1000)
    : 0;
  const isRecent = lastTs > 0 && Date.now() - lastTs < 24 * 3600 * 1000;

  const delta = (lastScore != null && prevScore != null) ? lastScore - prevScore : null;
  const deltaColor = delta == null ? "#fff" : delta >= 0.2 ? "#4ade80" : delta <= -0.2 ? "#FB923C" : GOLD;
  const deltaLabel = delta == null ? "" : delta >= 0.2 ? (mn ? "▲ Сайжрав" : "▲ Improved") : delta <= -0.2 ? (mn ? "▼ Буурав" : "▼ Dropped") : (mn ? "→ Тогтвортой" : "→ Steady");

  // Check dismiss
  useEffect(() => {
    if (!isRecent || !lastSession?.id) return;
    try {
      if (localStorage.getItem(`gavana_recap_dismissed_${lastSession.id}`) === "1") return;
    } catch { /* */ }
    setShown(true);
  }, [isRecent, lastSession?.id]);

  const dismiss = () => {
    setShown(false);
    try { localStorage.setItem(`gavana_recap_dismissed_${lastSession.id}`, "1"); } catch { /* */ }
  };

  const fetchRecap = async () => {
    if (!userId || !lastSession || fetchedRef.current) return;
    const ckey = CACHE_KEY(userId, lastSession.id);
    try {
      const cached = localStorage.getItem(ckey);
      if (cached) { setRecap(cached); return; }
    } catch { /* */ }

    fetchedRef.current = true;
    setLoading(true);
    try {
      const { auth } = await import("@/lib/firebase");
      const token = await auth.currentUser?.getIdToken();
      const prevStr = prevScore != null ? ` Previous: ${prevScore.toFixed(1)}.` : "";
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `${coachContextStr ? coachContextStr + "\n\n" : ""}Session score: ${lastScore?.toFixed(1)}/10.${prevStr} Give a 1-2 sentence personalized recap: what this score means for their development and one specific focus for next session. Be direct and fighter-like.`,
          }],
          persona: "analyst",
          locale,
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || data.message || null;
      if (text) {
        setRecap(text);
        try { localStorage.setItem(ckey, text); } catch { /* */ }
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  if (!isRecent || !shown || lastScore == null) return null;

  const weakArea = coachSnapshot?.weakAreas?.[0]?.[0];

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(145deg, rgba(245,196,81,0.06) 0%, rgba(0,0,0,0) 100%)",
      border: `1px solid ${goldAlpha(0.18)}`,
      borderLeft: `3px solid ${GOLD}`,
      borderRadius: "3px 16px 16px 3px",
      padding: "14px 14px 12px",
      marginBottom: 20,
    }}>
      <button
        type="button"
        onClick={dismiss}
        style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0 }}
      >×</button>

      <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, color: goldAlpha(0.65), letterSpacing: 2.5, textTransform: "uppercase" }}>
        {mn ? "⭐ Сүүлийн дасгал" : ko ? "⭐ 마지막 세션" : "⭐ Last Session"}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em" }}>
            {lastScore.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>/10</div>
        </div>
        <div style={{ flex: 1 }}>
          {delta != null && (
            <div style={{ fontSize: 12, fontWeight: 900, color: deltaColor, marginBottom: 4 }}>
              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} pts · {deltaLabel}
            </div>
          )}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
            {mn ? `평균: ${coachSnapshot?.avgScore?.toFixed(1) || "—"}/10` : `Avg: ${coachSnapshot?.avgScore?.toFixed(1) || "—"}/10`}
          </div>
        </div>
      </div>

      {!recap && !loading && (
        <button
          type="button"
          onClick={fetchRecap}
          style={{
            width: "100%", padding: "9px 0", borderRadius: 10,
            background: goldAlpha(0.1), border: `1px solid ${goldAlpha(0.3)}`,
            color: GOLD, fontSize: 12, fontWeight: 900, cursor: "pointer",
            marginBottom: weakArea ? 8 : 0,
          }}
        >
          {mn ? "🧠 AI шинжилгээ авах" : "🧠 Get AI Recap"}
        </button>
      )}

      {loading && (
        <div style={{ padding: "9px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
          {mn ? "Шинжилж байна..." : "Analyzing..."}
        </div>
      )}

      {recap && (
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.55, fontStyle: "italic", borderLeft: `2px solid ${goldAlpha(0.3)}`, paddingLeft: 10 }}>
          {recap}
        </p>
      )}

      {weakArea && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/drills`)}
          style={{
            width: "100%", padding: "8px 0", borderRadius: 10,
            background: redAlpha(0.1), border: `1px solid ${redAlpha(0.25)}`,
            color: RED, fontSize: 11, fontWeight: 900, cursor: "pointer", letterSpacing: 0.3,
          }}
        >
          {mn ? `⚡ ${weakArea} дасгал үүсгэх` : `⚡ Train ${weakArea} now`}
        </button>
      )}
    </div>
  );
}
