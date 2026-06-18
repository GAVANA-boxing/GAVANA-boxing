"use client";

import { GOLD, RED } from "@/lib/tokens";
import S from "@/components/upload/uploadStyles";

const UPLOAD_STAGES = [
  {
    min: 0,  max: 20,
    label: { mn: "Видео шахаж байна",    ko: "동영상 압축 중",    en: "Compressing video" },
  },
  {
    min: 21, max: 62,
    label: { mn: "Видео байршуулж байна", ko: "동영상 업로드 중",  en: "Uploading video" },
  },
  {
    min: 63, max: 84,
    label: { mn: "Thumbnail үүсгэж байна", ko: "썸네일 생성 중",   en: "Generating thumbnail" },
  },
  {
    min: 85, max: 100,
    label: { mn: "Нийтлэж байна",         ko: "게시 중",           en: "Publishing reel" },
  },
];

/**
 * Full-screen overlay displayed while uploading.
 * Renders nothing when `uploading` is false.
 *
 * Props
 * ─────
 * uploading        boolean
 * uploadProgress   number   — 0–100
 * uploadTimedOut   boolean
 * locale           string   — "mn" | "ko" | "en"
 * t                fn       — translate(key) → string
 * onCancel         fn       — handleCancelUpload
 * onRetry          fn       — handleUpload (retry after timeout)
 */
export default function UploadProgressOverlay({
  uploading,
  uploadProgress,
  uploadTimedOut,
  locale,
  t,
  onCancel,
  onRetry,
}) {
  const lang = locale === "mn" ? "mn" : locale === "ko" ? "ko" : "en";
  const activeIdx = UPLOAD_STAGES.findIndex(
    (s) => uploadProgress >= s.min && uploadProgress <= s.max
  );

  return (
    <>
      {uploading && (
        <div
          className="page-enter"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.94)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: 32,
          }}
        >
          <div style={{ fontSize: 44 }}>🥊</div>

          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            {t("uploadUploading")}
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: 300,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {UPLOAD_STAGES.map((stage, i) => {
              const done = i < activeIdx;
              const active = i === activeIdx;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 900,
                      background: done
                        ? `${GOLD}22`
                        : active
                        ? `${GOLD}18`
                        : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${
                        done ? GOLD : active ? `${GOLD}80` : "rgba(255,255,255,0.1)"
                      }`,
                      color: done ? GOLD : active ? "#fff" : "rgba(255,255,255,0.25)",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 800 : 500,
                      color: done ? GOLD : active ? "#fff" : "rgba(255,255,255,0.28)",
                    }}
                  >
                    {stage.label[lang]}
                  </span>

                  {active && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        fontWeight: 800,
                        color: GOLD,
                      }}
                    >
                      {uploadProgress}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ width: "100%", maxWidth: 300 }}>
            <div style={{ ...S.progressTrack, height: 4 }}>
              <div
                style={{
                  ...S.progressFill,
                  width: `${uploadProgress}%`,
                  background: `linear-gradient(90deg, ${RED}, ${GOLD})`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              textAlign: "center",
            }}
          >
            {t("uploadDontClose")}
          </p>

          <button
            onClick={onCancel}
            style={{
              marginTop: 4,
              padding: "10px 24px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.65)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("uploadCancel")}
          </button>
        </div>
      )}

      {uploadTimedOut && !uploading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              padding: "18px 20px",
              borderRadius: 14,
              background: "rgba(0,0,0,0.92)",
              border: "1px solid rgba(248,113,113,0.4)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxWidth: 320,
              width: "100%",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "#F87171", fontWeight: 700 }}>
              {t("uploadTimeout")}
            </p>
            <button
              onClick={onRetry}
              style={{ ...S.primaryBtn, background: RED, padding: "10px 20px", fontSize: 13 }}
            >
              {t("uploadRetry")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
