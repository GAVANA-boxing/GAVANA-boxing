"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIGHTERS } from "@/lib/fighters";
import { getPersonalConnection, FIGHTER_TEACHES } from "@/lib/fighterPersonalConnection";
import { GOLD, RED, redAlpha, goldAlpha, RADIUS } from "@/lib/tokens";

const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};
const AREA_MN = {
  Power: "Хүч", Speed: "Хурд", Timing: "Цаг",
  Footwork: "Хөл", Guard: "Хамгаалалт", Accuracy: "Нарийвчлал",
};

function rankFighters(coachSnapshot) {
  if (!coachSnapshot) return FIGHTERS.slice(0, 5);
  const mini = { weakAreas: coachSnapshot.weakAreas, radarStats: coachSnapshot.radarStats };
  return FIGHTERS
    .map((f) => {
      const conn = getPersonalConnection(mini, f);
      return { fighter: f, conn };
    })
    .sort((a, b) => {
      const scoreA = (a.conn?.relevantWeak?.length || 0) * 10 - (a.conn?.primaryValue ?? 10);
      const scoreB = (b.conn?.relevantWeak?.length || 0) * 10 - (b.conn?.primaryValue ?? 10);
      return scoreB - scoreA;
    })
    .slice(0, 5);
}

export default function FighterStudyRoadmap({ coachSnapshot, locale, router, userId }) {
  const [studied, setStudied] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const mn = locale === "mn";
  const ko = locale === "ko";

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getDoc(doc(db, "users", userId)).then((snap) => {
      if (active && snap.exists()) setStudied(snap.data().studiedFighters || []);
    }).catch(() => {});
    return () => { active = false; };
  }, [userId]);

  async function toggleStudied(fighterId) {
    const alreadyStudied = studied.includes(fighterId);
    setStudied((prev) =>
      alreadyStudied ? prev.filter((id) => id !== fighterId) : [...prev, fighterId]
    );
    if (!userId) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        studiedFighters: alreadyStudied ? arrayRemove(fighterId) : arrayUnion(fighterId),
      });
    } catch {
      setStudied((prev) =>
        alreadyStudied ? [...prev, fighterId] : prev.filter((id) => id !== fighterId)
      );
    }
  }

  const ranked = rankFighters(coachSnapshot);
  const studiedCount = ranked.filter((r) => studied.includes(r.fighter.id)).length;

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", padding: "0 0 10px", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, textTransform: "uppercase" }}>
            {mn ? "🥊 Судлах дайчид" : "🥊 Fighter Study Path"}
          </p>
          {studiedCount > 0 && (
            <span style={{ fontSize: 9, fontWeight: 900, color: GOLD, background: goldAlpha(0.12), border: `1px solid ${goldAlpha(0.3)}`, borderRadius: RADIUS.full, padding: "2px 7px" }}>
              {studiedCount}/{ranked.length}
            </span>
          )}
        </div>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", lineHeight: 1 }}>{collapsed ? "▸" : "▾"}</span>
      </button>

      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ranked.map(({ fighter, conn }, i) => {
            const isStudied = studied.includes(fighter.id);
            const acc = fighter.accent || GOLD;
            const teaches = FIGHTER_TEACHES[fighter.id] || [];
            const primaryArea = conn?.primaryFocus || teaches[0];
            const primaryColor = AREA_COLOR[primaryArea] || acc;
            const relevantCount = conn?.relevantWeak?.length || 0;

            return (
              <div
                key={fighter.id}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "11px 12px",
                  borderRadius: 14,
                  background: isStudied ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${isStudied ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`,
                  opacity: isStudied ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: i === 0 ? goldAlpha(0.15) : "rgba(255,255,255,0.05)",
                  border: `1px solid ${i === 0 ? goldAlpha(0.4) : "rgba(255,255,255,0.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 900, color: i === 0 ? GOLD : "rgba(255,255,255,0.3)",
                }}>
                  {i + 1}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: isStudied ? "#34D399" : "#fff" }}>
                      {isStudied ? "✓ " : ""}{fighter.name}
                    </span>
                    {relevantCount > 0 && (
                      <span style={{ fontSize: 8, fontWeight: 900, color: primaryColor, background: `${primaryColor}18`, border: `1px solid ${primaryColor}30`, borderRadius: RADIUS.full, padding: "1px 6px" }}>
                        {mn ? `Таны ${AREA_MN[primaryArea] || primaryArea}` : `Your ${primaryArea}`}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", fontWeight: 600, lineHeight: 1.3 }}>
                    {conn?.isDirectlyRelevant
                      ? (mn
                          ? `${AREA_MN[primaryArea] || primaryArea} ${conn.primaryValue?.toFixed(1)}/10 — ${conn.focusDrills?.[0] || conn.focusStudy?.[0] || ""}`
                          : `${primaryArea} ${conn.primaryValue?.toFixed(1)}/10 — ${conn.focusDrills?.[0] || conn.focusStudy?.[0] || ""}`)
                      : (mn ? teaches.map((a) => AREA_MN[a] || a).join(", ") + " заадаг" : teaches.join(", "))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/fighters/${fighter.id}`)}
                    style={{
                      padding: "6px 10px", borderRadius: 9,
                      background: `${acc}18`, border: `1px solid ${acc}35`,
                      color: acc, fontSize: 10, fontWeight: 900, cursor: "pointer",
                    }}
                  >
                    {mn ? "Үзэх" : "Study"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStudied(fighter.id)}
                    title={isStudied ? (mn ? "Тэмдэглэл арилгах" : "Mark as unread") : (mn ? "Судалсан" : "Mark studied")}
                    style={{
                      width: 30, height: 30, borderRadius: 9,
                      background: isStudied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isStudied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                      color: isStudied ? "#34D399" : "rgba(255,255,255,0.25)",
                      fontSize: 13, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {isStudied ? "✓" : "○"}
                  </button>
                </div>
              </div>
            );
          })}

          {studiedCount === ranked.length && ranked.length > 0 && (
            <div style={{ textAlign: "center", padding: "12px 0 4px", fontSize: 11, fontWeight: 900, color: "#34D399" }}>
              {mn ? "🏆 Бүх дайчид судаллаа! Шинэ зорилго тавь." : "🏆 All fighters studied! Set a new challenge."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
