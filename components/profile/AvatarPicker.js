"use client";

import Image from "next/image";

/**
 * AvatarPicker
 *
 * Props:
 *   avatarSrc        – string | ""   current preview or saved photo URL
 *   displayName      – string        used for the fallback initial
 *   email            – string        fallback initial source
 *   selectedFile     – File | null   currently staged file (truthy = show tick)
 *   avatarHover      – boolean       hover state for overlay
 *   fileInputRef     – React ref     forwarded to the hidden <input>
 *   onPickerClick    – () => void    open file dialog
 *   onHoverEnter     – () => void
 *   onHoverLeave     – () => void
 *   onFileSelect     – (e) => void   change handler for hidden input
 *   t                – (mn,ko,en) => string
 */
export default function AvatarPicker({
  avatarSrc,
  displayName,
  email,
  selectedFile,
  avatarHover,
  fileInputRef,
  onPickerClick,
  onHoverEnter,
  onHoverLeave,
  onFileSelect,
  t,
}) {
  const initial = (displayName || email || "U").charAt(0).toUpperCase();

  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
      <button
        type="button"
        onClick={onPickerClick}
        style={{
          position: "relative",
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "2.5px solid rgba(245,196,81,0.6)",
          background: "#EF4444",
          boxShadow: "0 0 0 6px rgba(239,68,68,0.14), 0 20px 54px rgba(0,0,0,0.4)",
          overflow: "hidden",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "box-shadow 0.2s",
        }}
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverLeave}
        aria-label={t("Зураг солих", "사진 변경", "Change photo")}
      >
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt="Profile"
            width={120}
            height={120}
            style={{ objectFit: "cover" }}
            unoptimized
          />
        ) : (
          <span style={{ color: "#fff", fontSize: 44, fontWeight: 900 }}>
            {initial}
          </span>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.18s",
            pointerEvents: "none",
            opacity: avatarHover || selectedFile ? 1 : 0,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="1.8" />
          </svg>
        </div>
      </button>

      <button
        type="button"
        onClick={onPickerClick}
        style={{
          border: "1px solid rgba(245,196,81,0.28)",
          background: "rgba(245,196,81,0.08)",
          color: "#F5C451",
          borderRadius: 9999,
          padding: "9px 16px",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
          maxWidth: 260,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {selectedFile
          ? t("✓ Зураг сонгогдлоо", "✓ 사진 선택됨", `✓ ${selectedFile.name.slice(0, 20)}`)
          : t("Зураг солих", "사진 변경", "Change profile photo")}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
}
