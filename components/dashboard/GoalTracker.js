"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RED, GOLD, redAlpha, goldAlpha, whiteAlpha, RADIUS } from "@/lib/tokens";
import { loc } from "@/lib/loc";

const AREAS = ["Power", "Speed", "Timing", "Footwork", "Guard", "Accuracy"];
const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};
const AREA_MN = { Power: "Хүч", Speed: "Хурд", Timing: "Цаг", Footwork: "Хөл", Guard: "Хамгаалалт", Accuracy: "Нарийвчлал" };

export default function GoalTracker({ userId, radarStats, locale, coachSnapshot }) {
  const [goal, setGoal] = useState(null); // { area, target, setAt }
  const [editing, setEditing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [draftArea, setDraftArea] = useState(null);
  const [draftTarget, setDraftTarget] = useState(7.0);
  const [saving, setSaving] = useState(false);

  const mn = locale === "mn";
  const ko = locale === "ko";

  // Load goal from Firestore
  useEffect(() => {
    if (!userId) return;
    let active = true;
    getDoc(doc(db, "users", userId)).then((snap) => {
      if (!active) return;
      const g = snap.data()?.goal;
      if (g?.area) setGoal(g);
    }).catch(() => { /* ignore */ });
    return () => { active = false; };
  }, [userId]);

  // Auto-suggest weakest area when opening edit
  const openEdit = () => {
    setDraftArea(goal?.area || coachSnapshot?.weakAreas?.[0]?.[0] || "Speed");
    setDraftTarget(goal?.target ?? 7.0);
    setEditing(true);
  };

  const saveGoal = async () => {
    if (!userId || !draftArea) return;
    setSaving(true);
    const g = { area: draftArea, target: Number(draftTarget), setAt: Date.now() };
    try {
      await setDoc(doc(db, "users", userId), { goal: g }, { merge: true });
      setGoal(g);
      setEditing(false);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const clearGoal = async () => {
    if (!userId) return;
    try {
      await setDoc(doc(db, "users", userId), { goal: null }, { merge: true });
      setGoal(null);
      setEditing(false);
    } catch { /* ignore */ }
  };

  const current = goal ? (radarStats?.[goal.area] ?? 0) : 0;
  const progress = goal ? Math.min(100, Math.max(0, (current / goal.target) * 100)) : 0;
  const acc = goal ? (AREA_COLOR[goal.area] || GOLD) : GOLD;
  const reached = goal && current >= goal.target;

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `2.5px solid ${GOLD}`,
      borderRadius: "3px 16px 16px 3px",
      marginBottom: 20,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px 8px",
        borderBottom: (collapsed || editing) ? "none" : "1px solid rgba(255,255,255,0.045)",
        background: "rgba(0,0,0,0.18)",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
        <span style={{ fontSize: 10, fontWeight: 900, flex: 1, color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {loc(locale, "Зорилго", "목표", "Goal")}
        </span>
        {goal && !editing && (
          <button type="button" onClick={openEdit} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 800, cursor: "pointer", padding: "0 4px" }}>
            {mn ? "Өөрчлөх" : "Edit"}
          </button>
        )}
        <button type="button" onClick={() => setCollapsed((c) => !c)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
          {collapsed ? "+" : "−"}
        </button>
      </div>

      {!collapsed && !editing && !goal && (
        <div style={{ padding: "16px 14px" }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            {mn ? "Radar-н нэг чиглэлд зорилго тавьж ахицаа хяна." : "Set a target for one radar area and track your progress."}
          </p>
          <button
            type="button"
            onClick={openEdit}
            style={{ width: "100%", padding: "11px 0", borderRadius: 11, background: goldAlpha(0.12), border: `1px solid ${goldAlpha(0.35)}`, color: GOLD, fontSize: 13, fontWeight: 900, cursor: "pointer" }}
          >
            {mn ? "🎯 Зорилго тавих" : "🎯 Set a Goal"}
          </button>
        </div>
      )}

      {!collapsed && !editing && goal && (
        <div style={{ padding: "12px 14px 14px" }}>
          {reached && (
            <div style={{ marginBottom: 10, padding: "8px 11px", borderRadius: 10, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", fontSize: 12, fontWeight: 800, color: "#34D399" }}>
              🏆 {mn ? "Зорилго биелсэн!" : "Goal Reached!"}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 900, color: acc }}>
                {mn ? (AREA_MN[goal.area] || goal.area) : goal.area}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 6, fontWeight: 700 }}>
                {current.toFixed(1)} → {goal.target.toFixed(1)}
              </span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 900, color: acc }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 8 }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: RADIUS.full,
              background: reached ? "#34D399" : acc,
              boxShadow: `0 0 8px ${acc}66`,
              transition: "width 800ms cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
          <p style={{ margin: 0, fontSize: 10.5, color: "rgba(255,255,255,0.28)", fontWeight: 700 }}>
            {reached
              ? (mn ? "Шинэ зорилго тавихад бэлэн" : "Ready to set a new goal")
              : (mn ? `${(goal.target - current).toFixed(1)} оноо хэрэгтэй` : `${(goal.target - current).toFixed(1)} pts to go`)}
          </p>
        </div>
      )}

      {editing && (
        <div style={{ padding: "12px 14px 14px" }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>
            {mn ? "Сайжруулах чиглэл:" : "Area to improve:"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
            {AREAS.map((area) => {
              const col = AREA_COLOR[area];
              const active = draftArea === area;
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => setDraftArea(area)}
                  style={{
                    padding: "6px 12px", borderRadius: RADIUS.full,
                    background: active ? `${col}22` : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${active ? col + "66" : "rgba(255,255,255,0.08)"}`,
                    color: active ? col : "rgba(255,255,255,0.45)",
                    fontSize: 11.5, fontWeight: 800, cursor: "pointer",
                  }}
                >
                  {mn ? (AREA_MN[area] || area) : area}
                  {radarStats?.[area] != null && (
                    <span style={{ marginLeft: 4, opacity: 0.6, fontSize: 10 }}>
                      {radarStats[area].toFixed(1)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>
            {mn ? "Зорилтот оноо:" : "Target score:"}{" "}
            <span style={{ color: AREA_COLOR[draftArea] || GOLD, fontWeight: 900 }}>{Number(draftTarget).toFixed(1)}</span>
          </p>
          <input
            type="range" min="4" max="10" step="0.5"
            value={draftTarget}
            onChange={(e) => setDraftTarget(e.target.value)}
            style={{ width: "100%", marginBottom: 14, accentColor: AREA_COLOR[draftArea] || GOLD }}
          />

          <div style={{ display: "grid", gridTemplateColumns: goal ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8 }}>
            <button type="button" onClick={() => setEditing(false)} style={{ padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
              {mn ? "Болих" : "Cancel"}
            </button>
            {goal && (
              <button type="button" onClick={clearGoal} style={{ padding: "10px 0", borderRadius: 10, background: redAlpha(0.08), border: `1px solid ${redAlpha(0.25)}`, color: RED, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                {mn ? "Устгах" : "Clear"}
              </button>
            )}
            <button type="button" onClick={saveGoal} disabled={saving || !draftArea} style={{ padding: "10px 0", borderRadius: 10, background: goldAlpha(0.15), border: `1px solid ${goldAlpha(0.4)}`, color: GOLD, fontSize: 12, fontWeight: 900, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "..." : (mn ? "Хадгалах" : "Save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
