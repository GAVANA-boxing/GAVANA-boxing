"use client";

import S from "@/components/upload/uploadStyles";

/**
 * Thumbnail strip shown at the top of the setup step.
 *
 * Props
 * ─────
 * selectedFile   File|null
 * previewUrl     string|null
 * fileSizeMB     string|null  — e.g. "12.4"
 * videoDuration  number|null  — seconds
 * setVideoDuration fn
 * formatDuration fn           — (seconds) → "0:32"
 * onChangeVideo  fn           — () => setStep("video")
 * t              fn           — translate(key) → string
 */
export default function VideoStrip({
  selectedFile,
  previewUrl,
  fileSizeMB,
  videoDuration,
  setVideoDuration,
  formatDuration,
  onChangeVideo,
  t,
}) {
  return (
    <div style={S.videoStrip} className="section-reveal">
      <div style={{ position: "relative", flexShrink: 0 }}>
        <video
          src={previewUrl}
          muted
          playsInline
          style={S.videoThumb}
          onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
        />
        {videoDuration && (
          <div
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              background: "rgba(0,0,0,0.72)",
              borderRadius: 4,
              padding: "2px 5px",
              fontSize: 10,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {formatDuration(videoDuration)}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedFile?.name}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {fileSizeMB && (
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 6,
                padding: "2px 7px",
                fontWeight: 700,
              }}
            >
              {fileSizeMB} MB
            </span>
          )}
          {videoDuration && (
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.06)",
                borderRadius: 6,
                padding: "2px 7px",
                fontWeight: 700,
              }}
            >
              {formatDuration(videoDuration)}
            </span>
          )}
        </div>

        <button onClick={onChangeVideo} style={S.changeVideoBtn}>
          {t("uploadChangeVideo")}
        </button>
      </div>
    </div>
  );
}
