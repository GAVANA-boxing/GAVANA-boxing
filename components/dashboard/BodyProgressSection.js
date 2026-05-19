"use client";

import { useState, useEffect } from "react";
import { collection, query, where, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WEIGHT_CLASSES } from "@/lib/dashboardHelpers";
import { labelStyle, inputStyle, primaryBtnStyle, ghostBtnStyle, InputField } from "./DashboardWidgets";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function formatDate(ts) {
  const ms = getTs(ts);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function BodyProgressSection({ userId, t }) {
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weight: "", height: "", reach: "", weightClass: "", notes: "" });

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function load() {
      try {
        const q = query(collection(db, "body_progress"), where("userId", "==", userId), limit(10));
        const snap = await getDocs(q);
        if (!active) return;
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setHistory(docs);
      } catch (e) {
        console.error("Body progress load error:", e);
      }
    }
    load();
    return () => { active = false; };
  }, [userId]);

  async function handleSave() {
    if (!form.weight || isNaN(Number(form.weight))) return;
    setSaving(true);
    try {
      const payload = { userId, weight: Number(form.weight), createdAt: serverTimestamp() };
      if (form.height) payload.height = Number(form.height);
      if (form.reach) payload.reach = Number(form.reach);
      if (form.weightClass) payload.weightClass = form.weightClass;
      if (form.notes.trim()) payload.notes = form.notes.trim();
      const ref = await addDoc(collection(db, "body_progress"), payload);
      const newEntry = { id: ref.id, ...payload, createdAt: { toMillis: () => Date.now() } };
      setHistory((prev) => [newEntry, ...prev].slice(0, 10));
      setForm({ weight: "", height: "", reach: "", weightClass: "", notes: "" });
      setShowForm(false);
    } catch (e) {
      console.error("Body progress save error:", e);
    } finally {
      setSaving(false);
    }
  }

  const latest = history[0];

  return (
    <div>
      {latest ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.055)",
          borderRadius: 12,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.7, flexShrink: 0 }}>
            {formatDate(latest.createdAt)}
          </span>
          {latest.weight && <span style={{ fontSize: 13, fontWeight: 800, color: "#ccc" }}>{latest.weight} kg</span>}
          {latest.height && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{latest.height} cm</span>}
          {latest.reach && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>reach {latest.reach}</span>}
          {latest.weightClass && (
            <span style={{ fontSize: 11, color: "#D4AF37", fontWeight: 700 }}>
              {latest.weightClass.split(" ")[0]}
            </span>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: "#333", margin: "0 0 10px" }}>{t("dashboardNoBodyData")}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: showForm || showHistory ? 12 : 0 }}>
        <button onClick={() => { setShowForm(!showForm); setShowHistory(false); }} style={ghostBtnStyle}>
          {showForm ? t("dashboardCancel") : `+ ${t("dashboardAddBodyStats")}`}
        </button>
        {history.length > 1 && (
          <button onClick={() => { setShowHistory(!showHistory); setShowForm(false); }} style={{ ...ghostBtnStyle, fontSize: 11, color: "#555" }}>
            {showHistory ? "Hide" : `${t("dashboardBodyHistory")} ›`}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <InputField label={t("dashboardWeight")} value={form.weight}
              onChange={(v) => setForm((f) => ({ ...f, weight: v }))} type="number" required />
            <InputField label={t("dashboardHeight")} value={form.height}
              onChange={(v) => setForm((f) => ({ ...f, height: v }))} type="number" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <InputField label={t("dashboardReach")} value={form.reach}
              onChange={(v) => setForm((f) => ({ ...f, reach: v }))} type="number" />
            <div>
              <label style={labelStyle}>{t("dashboardWeightClass")}</label>
              <select value={form.weightClass}
                onChange={(e) => setForm((f) => ({ ...f, weightClass: e.target.value }))}
                style={inputStyle}>
                <option value="">—</option>
                {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t("dashboardNotes")}</label>
            <textarea value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2} style={{ ...inputStyle, resize: "none", height: "auto" }}
              placeholder={t("dashboardNotesPlaceholder")} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
              {saving ? t("dashboardSaving") : t("dashboardSave")}
            </button>
            <button onClick={() => setShowForm(false)} style={ghostBtnStyle}>
              {t("dashboardCancel")}
            </button>
          </div>
        </div>
      )}

      {showHistory && history.length > 1 && (
        <div>
          {history.slice(1).map((entry) => (
            <div key={entry.id} style={{
              display: "flex", gap: 10, padding: "6px 0",
              borderBottom: "1px solid rgba(255,255,255,0.035)",
              fontSize: 11, color: "rgba(255,255,255,0.3)",
            }}>
              <span style={{ flexShrink: 0 }}>{formatDate(entry.createdAt)}</span>
              <span>{entry.weight} kg</span>
              {entry.height && <span>{entry.height} cm</span>}
              {entry.reach && <span>reach {entry.reach}</span>}
              {entry.weightClass && <span style={{ color: "rgba(255,255,255,0.22)" }}>{entry.weightClass.split(" ")[0]}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
