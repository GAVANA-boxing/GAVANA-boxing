"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { translate } from "@/lib/i18n";
import { redAlpha } from "@/lib/tokens";
import Image from "next/image";

const STORY_TYPES = [
  { key: "training_clip", emoji: "🥊", labelKey: "storyTrainingClip" },
  { key: "gym_mood", emoji: "🏋️", labelKey: "storyGymMood" },
  { key: "mitt_work", emoji: "🎯", labelKey: "storyMittWork" },
  { key: "progress_update", emoji: "📈", labelKey: "storyProgressUpdate" },
  { key: "challenge_result", emoji: "🏆", labelKey: "storyChallengeResult" },
  { key: "motivational", emoji: "🔥", labelKey: "storyMotivational" },
];

const PROGRESS_TYPES = [
  { key: "score_improvement", labelKey: "progressTypeScore", icon: "📊" },
  { key: "streak_milestone", labelKey: "progressTypeStreak", icon: "🔥" },
  { key: "new_best", labelKey: "progressTypeBest", icon: "🏆" },
  { key: "weight_update", labelKey: "progressTypeWeight", icon: "⚖️" },
];

export default function StoryUpload({ locale, initialType = "training_clip" }) {
  const router = useRouter();
  const { user } = useAuth();
  const t = (key) => translate(locale, key);
  const fileRef = useRef(null);

  const [storyType, setStoryType] = useState(initialType);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [progressType, setProgressType] = useState("score_improvement");
  const [progressValue, setProgressValue] = useState("");
  const [progressImprovement, setProgressImprovement] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isProgressType = storyType === "progress_update";

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview({ url: URL.createObjectURL(f), type: f.type.startsWith("video") ? "video" : "image" });
  };

  const handlePost = async () => {
    if (!user) { router.push(`/${locale}/login`); return; }
    if (!isProgressType && !file) { setError(t("storyChooseMedia")); return; }
    if (isProgressType && !progressValue.trim()) { setError(t("storyProgressValueRequired")); return; }
    setUploading(true); setError("");

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (!isProgressType && file) {
        const ext = file.name.split(".").pop();
        const path = `stories/${user.uid}/${Date.now()}.${ext}`;
        const sRef = storageRef(storage, path);
        await new Promise((res, rej) => {
          const task = uploadBytesResumable(sRef, file);
          task.on("state_changed",
            snap => setUploadPct(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            rej,
            async () => { mediaUrl = await getDownloadURL(task.snapshot.ref); mediaType = file.type.startsWith("video") ? "video" : "image"; res(); }
          );
        });
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const progressLabel = PROGRESS_TYPES.find(p => p.key === progressType)?.label || progressType;

      await addDoc(collection(db, "stories"), {
        userId: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Boxer",
        photoURL: user.photoURL || null,
        type: storyType,
        mediaUrl,
        mediaType,
        caption: caption.trim(),
        progressType: isProgressType ? progressType : null,
        progressData: isProgressType ? {
          progressType: progressLabel,
          value: progressValue.trim(),
          improvement: progressImprovement.trim(),
          caption: caption.trim(),
        } : null,
        createdAt: serverTimestamp(),
        expiresAt,
      });

      setSuccess(true);
      setTimeout(() => router.back(), 1400);
    } catch (e) {
      setError(t("storyPostError"));
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div style={s.successPage}>
        <div style={{ fontSize: 52 }}>⚡</div>
        <p style={s.successText}>{t("storyPostSuccess")}</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{`.story-type-row::-webkit-scrollbar{display:none}`}</style>
      {/* Header */}
      <div style={s.header}>
        <button type="button" style={s.closeBtn} aria-label="Close" onClick={() => router.back()}>✕</button>
        <span style={s.title}>{t("storyAdd")}</span>
        <button
          type="button"
          style={uploading ? s.postBtnGray : s.postBtn}
          onClick={handlePost}
          disabled={uploading}
        >
          {uploading ? `${uploadPct}%` : t("storyPost")}
        </button>
      </div>

      {/* Story type chips */}
      <div style={s.typeRow} className="story-type-row">
        {STORY_TYPES.map(st => (
          <button
            key={st.key}
            type="button"
            style={storyType === st.key ? s.typeActive : s.typeChip}
            onClick={() => setStoryType(st.key)}
          >
            <span>{st.emoji}</span>
            <span>{t(st.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      {isProgressType ? (
        <div style={s.progressArea}>
          <p style={s.fieldLabel}>{t("storyProgressType")}</p>
          <div style={s.progressGrid}>
            {PROGRESS_TYPES.map(pt => (
              <button
                key={pt.key}
                type="button"
                style={progressType === pt.key ? s.ptActive : s.ptBtn}
                onClick={() => setProgressType(pt.key)}
              >
                <span style={{ fontSize: 28 }}>{pt.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 900, textAlign: "center", lineHeight: 1.2 }}>{t(pt.labelKey)}</span>
              </button>
            ))}
          </div>
          <p style={s.fieldLabel}>{t("storyProgressValue")}</p>
          <input
            type="text"
            style={s.input}
            placeholder={t("storyProgressValuePlaceholder")}
            value={progressValue}
            onChange={e => setProgressValue(e.target.value)}
          />
          <p style={s.fieldLabel}>{t("storyProgressImprovement")}</p>
          <input
            type="text"
            style={s.input}
            placeholder={t("storyProgressImprovementPlaceholder")}
            value={progressImprovement}
            onChange={e => setProgressImprovement(e.target.value)}
          />
        </div>
      ) : (
        <div style={s.mediaArea}>
          {preview ? (
            <div style={s.previewWrap}>
              {preview.type === "video"
                ? <video src={preview.url} style={s.previewMedia} controls muted playsInline />
                : <Image src={preview.url} alt="" width={400} height={360} style={{ width: "100%", maxHeight: 360, objectFit: "cover", display: "block" }} unoptimized />
              }
              <button type="button" style={s.changeBtn} onClick={() => fileRef.current?.click()}>Change</button>
            </div>
          ) : (
            <button type="button" style={s.uploadZone} onClick={() => fileRef.current?.click()}>
              <span style={{ fontSize: 44 }}>⚡</span>
              <span style={s.zoneTxt}>{t("storyChooseMedia")}</span>
              <span style={s.zoneSub}>Photo or short video</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFile} />
        </div>
      )}

      {/* Caption */}
      <div style={s.captionWrap}>
        <p style={s.fieldLabel}>{t("storyCaption")}</p>
        <textarea
          style={s.captionInput}
          placeholder={t("storyCaptionPlaceholder")}
          value={caption}
          rows={2}
          onChange={e => setCaption(e.target.value)}
        />
      </div>

      {error && <p style={s.error}>{error}</p>}
    </div>
  );
}

const s = {
  page: { minHeight: "100dvh", background: "#0B0B0C", color: "#fff", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(16px + env(safe-area-inset-top)) max(88px, calc(12px + 76px)) 14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(11,11,12,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: 0.3 },
  postBtn: { background: "linear-gradient(135deg, #FF3B30, #cc2820)", border: "none", borderRadius: 999, padding: "9px 22px", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 16px ${redAlpha(0.35)}` },
  postBtnGray: { background: `${redAlpha(0.2)}`, border: `1px solid ${redAlpha(0.2)}`, borderRadius: 999, padding: "9px 22px", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "not-allowed" },
  typeRow: { display: "flex", flexWrap: "nowrap", gap: 6, overflowX: "auto", padding: "10px 16px", paddingRight: 88, scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  typeChip: { flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  typeActive: { flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999, border: `1px solid ${redAlpha(0.5)}`, background: `${redAlpha(0.12)}`, color: "#ff6b6b", fontSize: 12, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" },
  mediaArea: { flex: 1, padding: "16px 16px 0" },
  uploadZone: { width: "100%", minHeight: 240, border: `2px dashed ${redAlpha(0.35)}`, borderRadius: 18, background: `${redAlpha(0.03)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxSizing: "border-box", transition: "border-color 200ms ease, background 200ms ease" },
  zoneTxt: { fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.55)" },
  zoneSub: { fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: -4 },
  previewWrap: { position: "relative", width: "100%", maxHeight: 360, borderRadius: 14, overflow: "hidden", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)" },
  previewMedia: { width: "100%", maxHeight: 360, objectFit: "cover", display: "block" },
  changeBtn: { position: "absolute", top: 10, right: 10, padding: "6px 14px", borderRadius: 999, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", backdropFilter: "blur(8px)" },
  progressArea: { flex: 1, padding: "16px 16px 0" },
  progressGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 },
  ptBtn: { padding: "16px 10px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 160ms ease" },
  ptActive: { padding: "16px 10px", borderRadius: 14, border: `1px solid ${redAlpha(0.45)}`, background: `${redAlpha(0.1)}`, color: "#ff6b6b", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: `0 0 20px ${redAlpha(0.12)}` },
  captionWrap: { padding: "14px 16px 24px" },
  captionInput: { width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.5 },
  fieldLabel: { margin: "0 0 8px", fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5 },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "inherit" },
  error: { margin: "0 16px 16px", padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.25)", color: "#F87171", fontSize: 13 },
  successPage: { minHeight: "100dvh", background: "#0B0B0C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 },
  successText: { fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 },
};
