"use client";

import { useState } from "react";
import { RED, redAlpha } from "@/lib/tokens";
import { useAuth } from "@/lib/AuthContext";

const REASONS = [
  { key: "spam",        labelKey: "reportReasonSpam" },
  { key: "violence",    labelKey: "reportReasonViolence" },
  { key: "harassment",  labelKey: "reportReasonHarassment" },
  { key: "misinform",   labelKey: "reportReasonMisinform" },
  { key: "other",       labelKey: "reportReasonOther" },
];

export default function ReportModal({ targetId, targetType = "reel", onClose, t }) {
  const { user } = useAuth();
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason || submitting || !user) return;
    setSubmitting(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetId, targetType, reason, note }),
      });
      setDone(true);
    } catch {
      // silent — still close
      setDone(true);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9800, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#111", borderRadius: "24px 24px 0 0", padding: "24px 20px 36px", boxShadow: "0 -8px 40px rgba(0,0,0,0.6)" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{t("reportSubmitted")}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{t("reportSubmittedSub")}</div>
            <button type="button" onClick={onClose} style={{ marginTop: 20, padding: "10px 28px", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              {t("reportClose")}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>
                🚩 {t("reportTitle")}
              </h2>
              <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", padding: 4 }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {REASONS.map(({ key, labelKey }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReason(key)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${reason === key ? RED : "rgba(255,255,255,0.1)"}`,
                    background: reason === key ? redAlpha(0.12) : "transparent",
                    color: reason === key ? "#fff" : "rgba(255,255,255,0.55)",
                    fontSize: 13,
                    fontWeight: reason === key ? 800 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
            {reason === "other" && (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("reportNotePlaceholder")}
                rows={3}
                style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, padding: "10px 12px", resize: "none", boxSizing: "border-box", marginBottom: 12, outline: "none" }}
              />
            )}
            <button
              type="button"
              disabled={!reason || submitting}
              onClick={submit}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background: reason ? RED : "rgba(255,255,255,0.07)",
                color: reason ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 14,
                fontWeight: 900,
                cursor: reason ? "pointer" : "not-allowed",
                transition: "background 0.2s",
              }}
            >
              {submitting ? t("reportSubmitting") : t("reportSubmitBtn")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
