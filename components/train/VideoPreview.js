"use client";

export default function VideoPreview({ blobUrl, clipDuration, onDurationLoad }) {
  return (
    <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>
      <div style={{
        borderRadius: 12,
        overflow: "hidden",
        background: "#000",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
      }}>
        <video
          src={blobUrl}
          controls
          playsInline
          muted
          loop
          style={{ width: "100%", maxHeight: 220, display: "block", objectFit: "cover" }}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) onDurationLoad(Math.round(d));
          }}
        />
        {clipDuration != null && (
          <div style={{
            position: "absolute", bottom: 8, right: 10,
            padding: "2px 8px", borderRadius: 6,
            background: "rgba(0,0,0,0.7)",
            fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.8)",
            fontFamily: "monospace",
          }}>
            {Math.floor(clipDuration / 60)}:{String(clipDuration % 60).padStart(2, "0")}
          </div>
        )}
      </div>
    </div>
  );
}
