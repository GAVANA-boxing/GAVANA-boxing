"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { checkAndAwardBadges } from "@/lib/badges";
import { createRemixNotification } from "@/lib/notifications";

const CATEGORIES = ["boxing", "gym", "running", "street_workout", "sparring"];
const DIFFICULTIES = ["beginner", "intermediate", "pro"];
const CAT_KEY = { boxing: "catBoxing", gym: "catGym", running: "catRunning", street_workout: "catStreetWorkout", sparring: "catSparring" };
const DIFF_KEY = { beginner: "diffBeginner", intermediate: "diffIntermediate", pro: "diffPro" };

function cleanCaptionLine(line) {
  return line.replace(/\*\*/g, "").replace(/__/g, "").replace(/^\s*[-*•]\s*/, "").replace(/^\s*\d+[\).:-]\s*/, "").trim();
}
function stripCaptionLabel(line) {
  return cleanCaptionLine(line).replace(/^(hook|caption|hashtags?)\s*[:\-–—]\s*/i, "").trim();
}
function extractHashtags(text) {
  return (text.match(/#[\p{L}\p{N}_]+/gu) || []).join(" ");
}
function removeHashtags(text) {
  return text.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/\s{2,}/g, " ").trim();
}
function parseAiCaptionResult(text = "") {
  const sections = { hook: "", caption: "", hashtags: "" };
  let currentSection = null;
  text.split(/\r?\n/).map(cleanCaptionLine).filter(Boolean).forEach((line) => {
    const match = line.match(/^(hook|caption|hashtags?)\s*[:\-–—]\s*(.*)$/i);
    if (match) {
      const key = match[1].toLowerCase().startsWith("hashtag") ? "hashtags" : match[1].toLowerCase();
      const value = match[2].trim();
      if (key === "hashtags") {
        sections.hashtags = [sections.hashtags, extractHashtags(value) || stripCaptionLabel(value)].filter(Boolean).join(" ");
      } else {
        sections[key] = [sections[key], removeHashtags(value)].filter(Boolean).join(" ");
        const ht = extractHashtags(value);
        if (ht) sections.hashtags = [sections.hashtags, ht].filter(Boolean).join(" ");
      }
      currentSection = key;
      return;
    }
    if (line.includes("#")) { sections.hashtags = [sections.hashtags, extractHashtags(line) || stripCaptionLabel(line)].filter(Boolean).join(" "); return; }
    if (currentSection) { sections[currentSection] = [sections[currentSection], removeHashtags(stripCaptionLabel(line))].filter(Boolean).join(" "); return; }
    if (!sections.caption) sections.caption = stripCaptionLabel(line);
  });
  const fallback = text.split(/\r?\n/).map(stripCaptionLabel).filter(Boolean).join("\n").trim();
  const description = [removeHashtags(sections.caption).trim(), (extractHashtags(sections.hashtags) || sections.hashtags).trim()].filter(Boolean).join("\n").trim();
  return {
    hook: removeHashtags(sections.hook).trim(),
    caption: removeHashtags(sections.caption).trim(),
    hashtags: (extractHashtags(sections.hashtags) || sections.hashtags).trim(),
    description: description || fallback,
  };
}

export default function UploadPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);

  // Step: "choose" | "form"
  const [step, setStep] = useState("choose");
  const [reelType, setReelType] = useState("training"); // "training" | "content"

  // Remix context (populated from ?remixOf URL param)
  const [remixOfId, setRemixOfId] = useState(null);
  const [remixOfCreatorId, setRemixOfCreatorId] = useState(null);
  const [remixOfCreatorName, setRemixOfCreatorName] = useState(null);

  // Video
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  // Common fields
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("boxing");
  const [difficulty, setDifficulty] = useState("beginner");
  const [tags, setTags] = useState("");

  // Training-only fields
  const [challengeLabel, setChallengeLabel] = useState("");
  const [targetHits, setTargetHits] = useState("");

  // Content-only fields
  const [challengeEnabled, setChallengeEnabled] = useState(false);

  // Gym tag
  const [gymId, setGymId] = useState("");
  const [gyms, setGyms] = useState([]);

  // AI caption
  const [captionContext, setCaptionContext] = useState("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionError, setCaptionError] = useState("");
  const [captionResult, setCaptionResult] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (!user?.uid) return;
    import("firebase/firestore").then(({ collection: col, getDocs: gd, query: q, where: wh }) => {
      gd(q(col(db, "gyms"))).then((snap) => {
        setGyms(snap.docs.map((d) => ({ id: d.id, gymName: d.data().gymName })));
      }).catch(() => {});
    });
  }, [user?.uid]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const rid = params.get("remixOf");
    if (rid) {
      setRemixOfId(rid);
      setRemixOfCreatorId(params.get("remixOfCreatorId") || null);
      setRemixOfCreatorName(params.get("remixOfCreatorName") || null);
      setReelType("training");
      setStep("form");
    }
  }, []);

  if (authLoading) return <div style={styles.loading}>{t("loading")}</div>;
  if (!user) return null;

  const handleTypeSelect = (type) => {
    setReelType(type);
    setStep("form");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      alert(t("uploadSelectVideo"));
    }
  };

  const handleCancel = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile || !description.trim()) { alert(t("uploadMissingFields")); return; }
    setUploading(true);
    setUploadProgress(0);
    setError("");
    try {
      const videoRef = ref(storage, `reels/${user.uid}/${Date.now()}_${selectedFile.name}`);
      const snapshot = await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(videoRef, selectedFile);
        task.on("state_changed", (s) => setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)), reject, () => resolve(task.snapshot));
      });
      const videoUrl = await getDownloadURL(snapshot.ref);
      const thumbnailUrl = videoUrl;

      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

      const reelDoc = {
        userId: user.uid,
        username: user.displayName || user.email?.split("@")[0] || "user",
        videoUrl,
        thumbnailUrl,
        description: description.trim(),
        type: reelType,
        category,
        difficulty,
        tags: tagList,
        challengeEnabled: reelType === "training" ? true : challengeEnabled,
        challengeLabel: reelType === "training" ? (challengeLabel.trim() || description.trim().slice(0, 60)) : "",
        targetHits: reelType === "training" && targetHits ? Number(targetHits) : null,
        likes: 0,
        commentsCount: 0,
        shares: 0,
        createdAt: serverTimestamp(),
      };
      if (remixOfId) {
        reelDoc.remixOf = remixOfId;
        if (remixOfCreatorId) reelDoc.remixOfCreatorId = remixOfCreatorId;
        if (remixOfCreatorName) reelDoc.remixOfCreatorName = remixOfCreatorName;
      }
      if (gymId) reelDoc.gymId = gymId;
      const newReelRef = await addDoc(collection(db, "reels"), reelDoc);

      // Award creator_starter badge (fire-and-forget)
      checkAndAwardBadges(user.uid, { hasUploaded: true }).catch(() => {});

      // Notify original creator when this is a remix
      if (remixOfId && remixOfCreatorId) {
        createRemixNotification({
          originalCreatorId: remixOfCreatorId,
          actorId: user.uid,
          actorName: user.displayName || user.email?.split("@")[0] || "Someone",
          actorPhotoURL: user.photoURL || "",
          originalReelId: remixOfId,
          newReelId: newReelRef.id,
        }).catch(() => {});
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      router.push(`/${locale}/reels`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(t("uploadFailed"));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleGenerateCaption = async () => {
    const context = captionContext.trim();
    if (!context) { setCaptionError(t("captionContextRequired")); return; }
    setCaptionLoading(true);
    setCaptionError("");
    setCaptionResult("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "analyst",
          locale,
          messages: [{
            role: "user",
            content: [
              "Generate a premium boxing reel caption.",
              `Context: ${context}`,
              "Return exactly three plain-text sections with no markdown, no bullets:",
              "Hook: one short viral hook, maximum 8 words.",
              "Caption: one punchy caption, maximum 18 words.",
              "Hashtags: 5 to 8 relevant hashtags.",
            ].join("\n"),
          }],
        }),
      });
      if (!res.ok) throw new Error("Caption request failed");
      const data = await res.json();
      const text = data?.content?.find((i) => i?.type === "text")?.text || data?.content?.[0]?.text || "";
      if (!text.trim()) throw new Error("Empty response");
      setCaptionResult(text.trim());
    } catch {
      setCaptionError(t("captionGenerateFailed"));
    } finally {
      setCaptionLoading(false);
    }
  };

  // ── Type-choose screen ─────────────────────────────────────────────────────
  if (step === "choose") {
    return (
      <div style={styles.page}>
        <div style={styles.inner}>
          <div style={styles.topBar}>
            <p style={styles.eyebrow}>GAVANA BOXING</p>
            <h1 style={styles.headline}>{t("uploadReel")}</h1>
            <p style={styles.chooseSubtitle}>{t("uploadTypeChoose")}</p>
          </div>
          <div style={styles.typeGrid}>
            <button type="button" style={styles.typeCard} onClick={() => handleTypeSelect("training")}>
              <span style={styles.typeCardEmoji}>🥊</span>
              <span style={styles.typeCardTitle}>{t("uploadTypeTraining")}</span>
              <span style={styles.typeCardDesc}>Challenge, score, compete</span>
            </button>
            <button type="button" style={{ ...styles.typeCard, borderColor: "rgba(96,165,250,0.4)" }} onClick={() => handleTypeSelect("content")}>
              <span style={styles.typeCardEmoji}>🎬</span>
              <span style={{ ...styles.typeCardTitle, color: "#60A5FA" }}>{t("uploadTypeContent")}</span>
              <span style={styles.typeCardDesc}>Share knowledge & technique</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form screen ────────────────────────────────────────────────────────────
  const parsedCaption = captionResult ? parseAiCaptionResult(captionResult) : null;
  const isTraining = reelType === "training";

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        {/* Header */}
        <div style={styles.topBar}>
          <button type="button" style={styles.backBtn} onClick={() => setStep("choose")}>← {t("back")}</button>
          <p style={styles.eyebrow}>GAVANA BOXING</p>
          <h1 style={styles.headline}>{t("uploadReel")}</h1>
          <span style={{ ...styles.typePill, background: isTraining ? "rgba(193,18,31,0.18)" : "rgba(96,165,250,0.12)", border: isTraining ? "1px solid rgba(193,18,31,0.4)" : "1px solid rgba(96,165,250,0.3)", color: isTraining ? "#F87171" : "#60A5FA" }}>
            {isTraining ? `🥊 ${t("uploadTypeTraining")}` : `🎬 ${t("uploadTypeContent")}`}
          </span>
        </div>

        {remixOfId && (
          <div style={{ background: "rgba(193,18,31,0.12)", border: "1px solid rgba(193,18,31,0.35)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#F87171" }}>
            🔀 {t("remixChallenge")}{remixOfCreatorName ? ` — ${t("remixOf").replace("{username}", remixOfCreatorName)}` : ""}
          </div>
        )}
        {error && <div style={styles.errBox}>{error}</div>}

        {/* Video picker / preview */}
        {!selectedFile ? (
          <div style={styles.dropZone} onClick={() => fileInputRef.current?.click()}>
            <div style={styles.dropIcon}>▣</div>
            <p style={styles.dropLabel}>{t("selectBoxingVideo")}</p>
            <p style={styles.dropSub}>{t("videoFormats")}</p>
          </div>
        ) : (
          <div style={styles.videoWrap}>
            <video src={previewUrl} controls muted playsInline style={styles.videoPreview} />
            <div style={styles.videoFooter}>
              <span style={styles.videoName}>{selectedFile.name}</span>
              <span style={styles.videoPreviewLabel}>Preview</span>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} style={{ display: "none" }} />

        {/* Form fields (only after video chosen) */}
        {selectedFile && (
          <div style={styles.fields}>
            {/* Description */}
            <div style={styles.field}>
              <label style={styles.fieldLabel}>{t("description")}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("describeReelPlaceholder")} style={styles.textarea} />
            </div>

            {/* Category */}
            <div style={styles.field}>
              <label style={styles.fieldLabel}>{t("uploadCategory")}</label>
              <div style={styles.chipRow}>
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }} onClick={() => setCategory(c)}>
                    {t(CAT_KEY[c])}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div style={styles.field}>
              <label style={styles.fieldLabel}>{t("uploadDifficulty")}</label>
              <div style={styles.chipRow}>
                {DIFFICULTIES.map((d) => (
                  <button key={d} type="button" style={{ ...styles.chip, ...(difficulty === d ? (d === "beginner" ? styles.chipGreen : d === "intermediate" ? styles.chipGold : styles.chipRed) : {}) }} onClick={() => setDifficulty(d)}>
                    {t(DIFF_KEY[d])}
                  </button>
                ))}
              </div>
            </div>

            {/* Training-specific fields */}
            {isTraining && (
              <>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>{t("uploadChallengeLabel")}</label>
                  <input value={challengeLabel} onChange={(e) => setChallengeLabel(e.target.value)} placeholder="e.g. 100 jabs in 60 seconds" style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>{t("uploadTargetHits")}</label>
                  <input type="number" value={targetHits} onChange={(e) => setTargetHits(e.target.value)} placeholder="e.g. 100" style={{ ...styles.input, width: 120 }} min={1} />
                </div>
              </>
            )}

            {/* Content-specific: challenge toggle + tags */}
            {!isTraining && (
              <>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>{t("uploadTags")}</label>
                  <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("uploadTagsPlaceholder")} style={styles.input} />
                </div>
                <div style={styles.toggleRow}>
                  <span style={styles.toggleLabel}>Enable challenge mode</span>
                  <button type="button" style={{ ...styles.toggleBtn, background: challengeEnabled ? "#166534" : "rgba(255,255,255,0.07)" }} onClick={() => setChallengeEnabled(!challengeEnabled)}>
                    {challengeEnabled ? "ON" : "OFF"}
                  </button>
                </div>
              </>
            )}

            {/* Gym tag */}
            {gyms.length > 0 && (
              <div style={styles.field}>
                <label style={styles.fieldLabel}>{t("uploadGymTag")}</label>
                <select value={gymId} onChange={(e) => setGymId(e.target.value)} style={styles.input}>
                  <option value="">{t("uploadGymNone")}</option>
                  {gyms.map((g) => <option key={g.id} value={g.id}>{g.gymName}</option>)}
                </select>
              </div>
            )}

            {/* AI Caption generator */}
            <div style={styles.aiBox}>
              <span style={styles.aiBoxLabel}>{t("aiCaptionGenerator")}</span>
              <p style={styles.aiBoxHelp}>{t("aiCaptionHelp")}</p>
              <input value={captionContext} onChange={(e) => setCaptionContext(e.target.value)} placeholder={t("captionContextPlaceholder")} style={styles.input} />
              <button type="button" onClick={handleGenerateCaption} disabled={captionLoading} style={{ ...styles.primaryBtn, opacity: captionLoading ? 0.6 : 1 }}>
                {captionLoading ? t("generating") : t("generateCaption")}
              </button>
              {captionError && <p style={styles.errTxt}>{captionError}</p>}
              {parsedCaption && (
                <div style={styles.captionResult}>
                  {parsedCaption.hook && <div style={styles.captionSection}><span style={styles.captionLbl}>{t("hook")}</span><div style={styles.captionHook}>{parsedCaption.hook}</div></div>}
                  {parsedCaption.caption && <div style={styles.captionSection}><span style={styles.captionLbl}>{t("caption")}</span><div style={styles.captionBody}>{parsedCaption.caption}</div></div>}
                  {parsedCaption.hashtags && <div style={styles.captionSection}><span style={styles.captionLbl}>{t("hashtags")}</span><div style={styles.captionBody}>{parsedCaption.hashtags}</div></div>}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                    <button type="button" style={styles.captionActionBtn} onClick={() => setDescription(parsedCaption.description)}>{t("useCaption")}</button>
                    <button type="button" style={{ ...styles.captionActionBtn, background: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.12)" }} onClick={() => navigator.clipboard?.writeText(parsedCaption.hashtags)}>{t("copyHashtags")}</button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={styles.actionsRow}>
              <button type="button" onClick={handleCancel} disabled={uploading} style={styles.cancelBtn}>{t("cancel")}</button>
              <button type="button" onClick={handleUpload} disabled={uploading || !description.trim()} style={{ ...styles.primaryBtn, flex: 1, opacity: (uploading || !description.trim()) ? 0.5 : 1 }}>
                {uploading ? t("uploading") : t("upload")}
              </button>
            </div>

            {uploading && (
              <div style={styles.progressWrap}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: 12, fontWeight: 800 }}>
                  <span>{t("uploading")}</span><span>{uploadProgress}%</span>
                </div>
                <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} /></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(180deg, #070707 0%, #0B0B0B 100%)", fontFamily: "sans-serif", padding: "20px 16px" },
  inner: { maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 },
  loading: { minHeight: "100vh", background: "#070707", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "sans-serif" },
  topBar: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" },
  eyebrow: { margin: 0, color: "#D4AF37", fontSize: 11, fontWeight: 900, letterSpacing: 2.2, textTransform: "uppercase" },
  headline: { margin: 0, fontSize: 36, fontWeight: 950, color: "#fff" },
  chooseSubtitle: { margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 14 },
  typePill: { alignSelf: "center", fontSize: 12, fontWeight: 900, borderRadius: 999, padding: "4px 14px", letterSpacing: 0.4 },
  backBtn: { alignSelf: "flex-start", background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#D4AF37", borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer" },
  typeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 },
  typeCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "28px 16px", borderRadius: 20, background: "linear-gradient(145deg, #131313, #0a0a0a)", border: "1px solid rgba(193,18,31,0.35)", cursor: "pointer", transition: "transform 0.15s" },
  typeCardEmoji: { fontSize: 40 },
  typeCardTitle: { fontSize: 15, fontWeight: 1000, color: "#F87171" },
  typeCardDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.4 },
  dropZone: { border: "1px dashed rgba(212,175,55,0.36)", borderRadius: 18, padding: "52px 24px", textAlign: "center", cursor: "pointer", background: "#0B0B0B" },
  dropIcon: { fontSize: 44, marginBottom: 12, color: "#D4AF37" },
  dropLabel: { color: "#888", fontSize: 15, margin: 0 },
  dropSub: { color: "#555", fontSize: 13, margin: "8px 0 0" },
  videoWrap: { position: "relative", borderRadius: 18, overflow: "hidden", background: "#000", border: "1px solid rgba(255,255,255,0.1)" },
  videoPreview: { width: "100%", aspectRatio: "9/16", maxHeight: "60vh", objectFit: "cover", display: "block" },
  videoFooter: { position: "absolute", left: 14, right: 14, bottom: 14, display: "flex", justifyContent: "space-between", pointerEvents: "none" },
  videoName: { color: "#fff", fontSize: 11, fontWeight: 800, textShadow: "0 2px 8px rgba(0,0,0,0.9)" },
  videoPreviewLabel: { color: "#D4AF37", fontSize: 11, fontWeight: 900 },
  fields: { display: "flex", flexDirection: "column", gap: 18 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1 },
  input: { background: "#111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none" },
  textarea: { background: "#111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 14, minHeight: 72, resize: "vertical", outline: "none" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 800, cursor: "pointer" },
  chipActive: { background: "rgba(193,18,31,0.18)", border: "1px solid rgba(193,18,31,0.5)", color: "#F87171" },
  chipGreen: { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.4)", color: "#34D399" },
  chipGold: { background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37" },
  chipRed: { background: "rgba(193,18,31,0.18)", border: "1px solid rgba(193,18,31,0.5)", color: "#F87171" },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" },
  toggleLabel: { fontSize: 14, fontWeight: 800, color: "#fff" },
  toggleBtn: { minWidth: 52, padding: "6px 12px", borderRadius: 999, border: "none", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer" },
  aiBox: { display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: 16, background: "linear-gradient(145deg, rgba(193,18,31,0.12), rgba(11,11,11,0.96) 46%, rgba(212,175,55,0.07))", border: "1px solid rgba(255,255,255,0.08)" },
  aiBoxLabel: { color: "#D4AF37", fontSize: 12, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase" },
  aiBoxHelp: { margin: 0, color: "#888", fontSize: 13, lineHeight: 1.5 },
  captionResult: { display: "flex", flexDirection: "column", gap: 10, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.14)" },
  captionSection: { display: "grid", gap: 4, padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.04)" },
  captionLbl: { color: "#D4AF37", fontSize: 10, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase" },
  captionHook: { color: "#fff", fontSize: 14, fontWeight: 900, lineHeight: 1.45 },
  captionBody: { color: "#fff", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" },
  captionActionBtn: { padding: "9px 14px", borderRadius: 999, border: "1px solid rgba(212,175,55,0.34)", background: "rgba(212,175,55,0.1)", color: "#D4AF37", fontSize: 13, fontWeight: 800, cursor: "pointer" },
  actionsRow: { display: "flex", gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, border: "1px solid rgba(212,175,55,0.25)", background: "transparent", color: "#D4AF37", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  primaryBtn: { padding: "14px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #C1121F, #8f0d17)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 24px rgba(193,18,31,0.28)" },
  errBox: { background: "#3a0a0a", border: "1px solid rgba(193,18,31,0.5)", color: "#ff8b8b", padding: 12, borderRadius: 8 },
  errTxt: { margin: 0, color: "#ff8b8b", fontSize: 13 },
  progressWrap: { display: "flex", flexDirection: "column", gap: 6 },
  progressTrack: { height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #C1121F, #D4AF37)", transition: "width 180ms ease" },
};
