"use client";

import { useState } from "react";
import { RED, GOLD, redAlpha, goldAlpha, blackAlpha, whiteAlpha, RADIUS } from "@/lib/tokens";
import { loc } from "@/lib/loc";
import { FIGHTERS } from "@/lib/fighters";
import { getPersonalConnection, FIGHTER_TEACHES } from "@/lib/fighterPersonalConnection";

const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};

function SkillChip({ area }) {
  const col = AREA_COLOR[area] || GOLD;
  return (
    <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: RADIUS.full, background: `${col}15`, border: `1px solid ${col}28`, fontSize: 10, fontWeight: 800, color: col, margin: "2px 3px 2px 0" }}>
      {area}
    </span>
  );
}

function FighterCol({ fighter, connection, isMatch, locale }) {
  const mn = locale === "mn";
  const teaches = FIGHTER_TEACHES[fighter.id] || [];
  const acc = fighter.accent || GOLD;

  return (
    <div style={{
      flex: 1, padding: "14px 12px",
      background: isMatch ? `${acc}08` : "rgba(255,255,255,0.02)",
      border: `1px solid ${isMatch ? acc + "30" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 14, position: "relative",
    }}>
      {isMatch && (
        <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: acc, color: "#000", fontSize: 8, fontWeight: 900, padding: "3px 10px", borderRadius: RADIUS.full, letterSpacing: 1, whiteSpace: "nowrap" }}>
          {mn ? "ТАНД ТОХИРСОН" : "BEST MATCH"}
        </div>
      )}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>🥊</div>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 2 }}>{fighter.name}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{fighter.style || fighter.nationality}</div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>
          {mn ? "Заадаг чадварууд" : "Teaches"}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {teaches.map((a) => <SkillChip key={a} area={a} />)}
        </div>
      </div>

      {connection?.focusDrills?.length > 0 && (
        <div>
          <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>
            {mn ? "Гол дасгал" : "Key Drill"}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4, padding: "7px 9px", background: "rgba(0,0,0,0.3)", borderRadius: 9 }}>
            {connection.focusDrills[0]}
          </div>
        </div>
      )}

      {connection?.isDirectlyRelevant && (
        <div style={{ marginTop: 10, padding: "6px 9px", borderRadius: 9, background: `${acc}10`, border: `1px solid ${acc}20` }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: acc }}>
            {mn ? `Таны ${connection.primaryFocus} сайжруулна` : `Trains your ${connection.primaryFocus}`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function FighterCompareModal({ fighterIds, snapshot, locale, router, onClose }) {
  const mn = locale === "mn";
  const [f1, f2] = fighterIds.map((id) => FIGHTERS.find((f) => f.id === id)).filter(Boolean);

  if (!f1 || !f2) return null;

  const mini = snapshot ? { weakAreas: snapshot.weakAreas, radarStats: snapshot.radarStats } : null;
  const conn1 = mini ? getPersonalConnection(mini, f1) : null;
  const conn2 = mini ? getPersonalConnection(mini, f2) : null;

  // Determine best match: more relevant weak areas covered wins
  const score1 = (conn1?.relevantWeak?.length || 0) + (conn1?.isDirectlyRelevant ? 1 : 0);
  const score2 = (conn2?.relevantWeak?.length || 0) + (conn2?.isDirectlyRelevant ? 1 : 0);
  const isMatch1 = snapshot ? score1 >= score2 : false;
  const isMatch2 = snapshot ? score2 > score1 : false;

  // Areas that only one fighter covers
  const t1 = new Set(FIGHTER_TEACHES[f1.id] || []);
  const t2 = new Set(FIGHTER_TEACHES[f2.id] || []);
  const only1 = [...t1].filter((a) => !t2.has(a));
  const only2 = [...t2].filter((a) => !t1.has(a));
  const shared = [...t1].filter((a) => t2.has(a));

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9500,
        background: blackAlpha(0.88),
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
        padding: "max(env(safe-area-inset-top),16px) 16px max(env(safe-area-inset-bottom),16px)",
        overflowY: "auto",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, textTransform: "uppercase" }}>
            {mn ? "Харьцуулалт" : "Fighter Comparison"}
          </p>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 20, cursor: "pointer", padding: 4 }}>×</button>
        </div>

        {/* Side by side */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, paddingTop: 12 }}>
          <FighterCol fighter={f1} connection={conn1} isMatch={isMatch1} locale={locale} />
          <FighterCol fighter={f2} connection={conn2} isMatch={isMatch2} locale={locale} />
        </div>

        {/* Shared skills */}
        {shared.length > 0 && (
          <div style={{ padding: "10px 13px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 10 }}>
            <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
              {mn ? "Хоёулаа заадаг" : "Both Teach"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {shared.map((a) => <SkillChip key={a} area={a} />)}
            </div>
          </div>
        )}

        {/* Exclusive skills */}
        {(only1.length > 0 || only2.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[{ fighter: f1, only: only1 }, { fighter: f2, only: only2 }].map(({ fighter, only }) => (
              only.length > 0 && (
                <div key={fighter.id} style={{ padding: "9px 11px", borderRadius: 11, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.25)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>
                    {fighter.name.split(" ")[1] || fighter.name} {mn ? "л заадаг" : "only"}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {only.map((a) => <SkillChip key={a} area={a} />)}
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Study buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[f1, f2].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => { onClose(); router.push(`/${locale}/fighters/${f.id}`); }}
              style={{ padding: "11px 0", borderRadius: 12, background: redAlpha(0.1), border: `1px solid ${redAlpha(0.25)}`, color: RED, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
            >
              {mn ? `${f.name.split(" ")[1] || f.name} судлах` : `Study ${f.name.split(" ")[0]}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
