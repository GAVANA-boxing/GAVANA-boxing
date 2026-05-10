"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { translate } from "@/lib/i18n";

const STORY_TYPES = [
  { key: "training_clip", emoji: "🥊", labelKey: "storyTrainingClip" },
  { key: "gym_mood", emoji: "🏋️", labelKey: "storyGymMood" },
  { key: "mitt_work", emoji: "🎯", labelKey: "storyMittWork" },
  { key: "progress_update", emoji: "📈", labelKey: "storyProgressUpdate" },
  { key: "challenge_result", emoji: "🏆", labelKey: "storyChallengeResult" },
  { key: "motivational", emoji: "🔥", labelKey: "storyMotivational" },
];

const PROGRESS_TYPES = [
  { key: "score_improvement", label: "Score Improvement", icon: "📊" },
  { key: "streak_milestone", label: "Streak Milestone", icon: "🔥" },
  { key: "new_best", label: "New Best Score", icon: "🏆" },
  { key: "weight_update", label: "Weight Update", icon: "⚖️" },
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
      console.error(e);
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
      {/* Header */}
      <div style={s.header}>
        <button type="button" style={s.closeBtn} onClick={() => router.back()}>✕</button>
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
      <div style={s.typeRow}>
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
                <span style={{ fontSize: 26 }}>{pt.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{pt.label}</span>
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
                : <img src={preview.url} style={s.previewMedia} alt="" />
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
  page: { minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(16px + env(safe-area-inset-top)) 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  closeBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 18, cursor: "pointer", padding: "4px 8px" },
  title: { fontSize: 15, fontWeight: 700, color: "#fff" },
  postBtn: { background: "#C1121F", border: "none", borderRadius: 20, padding: "8px 20px", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  postBtnGray: { background: "rgba(193,18,31,0.35)", border: "none", borderRadius: 20, padding: "8px 20px", color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "not-allowed" },
  typeRow: { display: "flex", gap: 6, overflowX: "auto", padding: "12px 16px", scrollbarWidth: "none", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  typeChip: { flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, cursor: "pointer" },
  typeActive: { flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.1)", color: "#D4AF37", fontSize: 11, fontWeight: 900, cursor: "pointer" },
  mediaArea: { flex: 1, padding: 16 },
  uploadZone: { width: "100%", minHeight: 260, border: "2px dashed rgba(255,255,255,0.12)", borderRadius: 16, background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxSizing: "border-box" },
  zoneTxt: { fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.45)" },
  zoneSub: { fontSize: 12, color: "rgba(255,255,255,0.28)" },
  previewWrap: { position: "relative", width: "100%", maxHeight: 340, borderRadius: 12, overflow: "hidden", background: "#111" },
  previewMedia: { width: "100%", maxHeight: 340, objectFit: "cover", display: "block" },
  changeBtn: { position: "absolute", top: 10, right: 10, padding: "6px 12px", borderRadius: 20, background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  progressArea: { flex: 1, padding: "16px 16px 0" },
  progressGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 14 },
  ptBtn: { padding: "14px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  ptActive: { padding: "14px 8px", borderRadius: 12, border: "1px solid rgba(212,175,55,0.45)", background: "rgba(212,175,55,0.1)", color: "#D4AF37", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  captionWrap: { padding: "0 16px 20px" },
  captionInput: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 14, resize: "none", outline: "none", fontFamily: "inherit" },
  fieldLabel: { margin: "0 0 7px", fontSize: 11, fontWeight: 900, color: "#D4AF37", textTransform: "uppercase", letterSpacing: 1 },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 14, outline: "none", marginBottom: 12, fontFamily: "inherit" },
  error: { margin: "0 16px 16px", padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.28)", color: "#F87171", fontSize: 13 },
  successPage: { minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "system-ui, sans-serif" },
  successText: { fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 },
};
