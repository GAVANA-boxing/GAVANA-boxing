"use client";

import ScoreRing from "./ScoreRing";
import MetricBar from "./MetricBar";
import { redAlpha, goldAlpha } from "@/lib/tokens";

const CYAN = "#22D3EE";
const cA = (a) => `rgba(34,211,238,${a})`;

const METRIC_LABELS = ["GUARD", "COMBO FLOW", "FOOTWORK"];

const LOCALE_STRINGS = {
  noBoxingSubtitle: {
    mn: "Боксын бэлтгэлийн рилс оруулаад шинжилгээ авна уу",
    ko: "복싱 훈련 릴을 업로드하여 분석을 받으세요",
    en: "Upload a boxing training reel to get tactical analysis",
  },
};

/**
 * @param {{
 *   locale: string,
 *   t: (key: string) => string,
 *   isBoxing: boolean,
 *   loading: boolean,
 *   reel: object | null,
 *   aiData: object | null,
 *   aiLoading: boolean,
 *   score: number,
 *   guard: number,
 *   comboFlow: number,
 *   footwork: number,
 *   reelId: string,
 *   onUpload: () => void,
 *   onTrainThisMove: () => void,
 * }} props
 */
export default function AnalysisBody({
  locale,
  t,
  isBoxing,
  loading,
  reel,
  aiData,
  aiLoading,
  score,
  guard,
  comboFlow,
  footwork,
  onUpload,
  onTrainThisMove,
}) {
  const noBoxingSubtitle =
    LOCALE_STRINGS.noBoxingSubtitle[locale] ?? LOCALE_STRINGS.noBoxingSubtitle.en;

  return (
    <div style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20, paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>

      {/* Non-boxing empty state */}
      {!loading && reel && !isBoxing && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "40px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={12} cy={12} r={10} /><line x1={4.93} y1={4.93} x2={19.07} y2={19.07} />
            </svg>
          </div>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.7)", margin: 0 }}>{t("aiAnalysisNoBoxing")}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.5 }}>{noBoxingSubtitle}</p>
          </div>
          <button
            onClick={onUpload}
            style={{ padding: "12px 24px", borderRadius: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
          >
            {t("aiAnalysisUploadTraining")}
          </button>
        </div>
      )}

      {/* Score + Metrics */}
      {isBoxing && aiData ? (
        <div className="section-enter stagger-1" style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <ScoreRing score={score} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <MetricBar label="GUARD" value={guard} />
            <MetricBar label="COMBO FLOW" value={comboFlow} />
            <MetricBar label="FOOTWORK" value={footwork} />
          </div>
        </div>
      ) : isBoxing ? (
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: cA(0.06), border: `1px solid ${cA(0.15)}`, flexShrink: 0, animation: "pulse 1.5s infinite" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {METRIC_LABELS.map((l) => (
              <div key={l} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ height: 10, width: 70, borderRadius: 4, background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s infinite" }} />
                <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)" }} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Style + Technique tags */}
      {aiData && (aiData.style || aiData.technique) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {aiData.style && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: redAlpha(0.1), border: `1px solid ${redAlpha(0.3)}`, fontSize: 12, fontWeight: 800, color: "#FF3B30" }}>
              {aiData.styleEmoji && <span>{aiData.styleEmoji}</span>}
              {aiData.style}
            </div>
          )}
          {aiData.technique && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: cA(0.07), border: `1px solid ${cA(0.25)}`, fontSize: 12, fontWeight: 800, color: CYAN }}>
              {aiData.techniqueEmoji && <span>{aiData.techniqueEmoji}</span>}
              {aiData.technique}
            </div>
          )}
        </div>
      )}

      {/* Strengths */}
      {isBoxing && aiData?.strengths?.length > 0 && (
        <div className="section-enter stagger-2" style={{ borderRadius: 16, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "rgba(74,222,128,0.7)", marginBottom: 10, textTransform: "uppercase" }}>{t("aiBreakdownStrengths")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {aiData.strengths.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                <span style={{ color: "#4ade80", fontWeight: 800, flexShrink: 0 }}>+</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {isBoxing && aiData?.weaknesses?.length > 0 && (
        <div className="section-enter stagger-3" style={{ borderRadius: 16, background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "rgba(248,113,113,0.7)", marginBottom: 10, textTransform: "uppercase" }}>{t("aiBreakdownWeaknesses")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {aiData.weaknesses.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                <span style={{ color: "#f87171", fontWeight: 800, flexShrink: 0 }}>−</span>
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Fix */}
      {isBoxing && aiData?.improve && (
        <div className="section-enter stagger-4" style={{ borderRadius: 16, background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.25)}`, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: goldAlpha(0.7), marginBottom: 8, textTransform: "uppercase" }}>{t("aiBreakdownImprove")}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{aiData.improve}</div>
        </div>
      )}

      {/* Next Drill */}
      {isBoxing && aiData?.nextDrill && (
        <div className="section-enter stagger-5" style={{ borderRadius: 16, background: cA(0.05), border: `1px solid ${cA(0.2)}`, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: cA(0.7), marginBottom: 8, textTransform: "uppercase" }}>{t("aiBreakdownNextDrill")}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{aiData.nextDrill}</div>
        </div>
      )}

      {/* Technique cue */}
      {isBoxing && aiData?.techniqueCue && (
        <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px", fontStyle: "italic", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, textAlign: "center" }}>
          "{aiData.techniqueCue}"
        </div>
      )}

      {/* Loading state */}
      {isBoxing && aiLoading && !aiData && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "28px 0" }}>
          <div className="scan-load-bar" style={{ width: 180 }} />
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${cA(0.15)}`, borderTopColor: CYAN, animation: "spin 0.8s linear infinite" }} />
          <div className="scan-load-bar" style={{ width: 120 }} />
          <span style={{ fontSize: 11, color: cA(0.45), fontWeight: 900, letterSpacing: 1.5 }}>ANALYZING TECHNIQUE...</span>
        </div>
      )}

      {/* Coach CTA */}
      {isBoxing && (
        <button
          onClick={onTrainThisMove}
          style={{
            width: "100%", minHeight: 52, borderRadius: 16,
            background: "linear-gradient(135deg, rgba(255,59,48,0.85), rgba(204,40,32,0.85))",
            border: `1px solid ${redAlpha(0.4)}`,
            color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: 0.5,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: `0 8px 24px ${redAlpha(0.25)}`,
            backdropFilter: "blur(10px)",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {t("aiTrainThisMove")}
        </button>
      )}
    </div>
  );
}
