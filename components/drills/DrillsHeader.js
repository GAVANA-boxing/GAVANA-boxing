"use client";

import { redAlpha } from "@/lib/tokens";

const LABELS = {
  eyebrow: { mn: "GAVANA · ДАСГАЛ", ko: "GAVANA · 드릴", en: "GAVANA · DRILLS" },
  title: { mn: "AI Дасгал үүсгэгч", ko: "AI 드릴 생성기", en: "AI Drill Generator" },
};

/**
 * @param {{ locale: string, onBack: () => void }} props
 */
export default function DrillsHeader({ locale, onBack }) {
  const mn = locale === "mn";
  const ko = locale === "ko";

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      background: "rgba(10,10,11,0.9)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "14px 16px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 480, margin: "0 auto" }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "4px 2px", lineHeight: 1 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: redAlpha(0.65), letterSpacing: 2.5, textTransform: "uppercase" }}>
            {mn ? LABELS.eyebrow.mn : ko ? LABELS.eyebrow.ko : LABELS.eyebrow.en}
          </p>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
            {mn ? LABELS.title.mn : ko ? LABELS.title.ko : LABELS.title.en}
          </p>
        </div>
      </div>
    </div>
  );
}
