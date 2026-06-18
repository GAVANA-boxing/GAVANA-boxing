"use client";

import { GOLD } from "@/lib/tokens";
import S from "@/components/upload/uploadStyles";

/**
 * Full-screen video picker shown at step === "video".
 *
 * Props
 * ─────
 * locale          string  — "mn" | "ko" | "en"
 * t               fn      — translate(key) → string
 * fileInputRef      ref     — <input type="file"> ref
 * selectedFile      File|null
 * previewUrl        string|null
 * remixOfId         string|null
 * remixOfCreatorName string|null
 * setVideoDuration  fn
 * setStep           fn
 * onBack            fn      — router.back()
 * handleFileSelect  fn      — onChange handler for the hidden file input
 */
export default function VideoStep({
  locale,
  t,
  fileInputRef,
  selectedFile,
  previewUrl,
  remixOfId,
  remixOfCreatorName,
  setVideoDuration,
  setStep,
  onBack,
  handleFileSelect,
}) {
  return (
    <div style={S.videoPage}>
      <div style={S.videoHeader}>
        <button onClick={onBack} style={S.iconBtn}>✕</button>
        <span style={S.headerTitle}>{t("uploadNewReel")}</span>
        <div style={{ width: 40 }} />
      </div>

      {remixOfId && (
        <div style={S.remixBar}>
          🔀 Remixing {remixOfCreatorName ? `@${remixOfCreatorName}` : "a challenge"}
        </div>
      )}

      <div
        style={S.videoPicker}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        {selectedFile ? (
          <video
            src={previewUrl}
            controls
            playsInline
            preload="metadata"
            style={S.videoFull}
            onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
          />
        ) : (
          <div style={S.videoEmptyState}>
            <div style={S.videoEmptyIconWrap}>
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke={GOLD}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14" />
                <rect x="3" y="6" width="12" height="12" rx="2" />
                <path d="M9 10v4M7 12h4" stroke={GOLD} strokeWidth="1.8" />
              </svg>
            </div>
            <p style={S.videoEmptyKicker}>
              {locale === "mn" ? "Сүүдрийн бокс · Бэлтгэл" : locale === "ko" ? "섀도우복싱 · 운동" : "Shadowboxing · Workout"}
            </p>
            <p style={S.videoEmptyLabel}>{t("uploadTapSelect")}</p>
            <p style={S.videoEmptySub}>MP4, MOV · {t("uploadSizeLimit")}</p>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.22)", textAlign: "center", letterSpacing: "0.02em" }}>
              {locale === "mn" ? "30 секунд хүртэл · зөвхөн видео" : locale === "ko" ? "최대 30초 · 동영상만" : "Max 30 seconds · video only"}
            </p>
          </div>
        )}
      </div>

      <div style={S.videoBottomBar}>
        <button
          style={S.galleryBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: selectedFile ? GOLD : "rgba(255,255,255,0.75)",
            }}
          >
            {selectedFile ? t("uploadChange") : t("uploadGallery")}
          </span>
        </button>

        {selectedFile && (
          <span
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 11,
              maxWidth: 130,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedFile.name}
          </span>
        )}

        <button
          onClick={() =>
            selectedFile ? setStep("setup") : fileInputRef.current?.click()
          }
          style={{ ...S.nextBtn, opacity: selectedFile ? 1 : 0.42 }}
        >
          {t("uploadNext")}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
}
