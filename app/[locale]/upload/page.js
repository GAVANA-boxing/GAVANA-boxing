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

function UField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={S.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function UChips({ options, keyMap, t, selected, onSelect, colorMap }) {
  return (
    <div style={S.chipRow}>
      {options.map((opt) => {
        const active = selected === opt;
        const activeStyle = active ? (colorMap ? colorMap(opt) : S.chipActive) : {};
        return (
          <button key={opt} type="button" style={{ ...S.chip, ...(active ? activeStyle : {}) }} onClick={() => onSelect(opt)}>
            {t(keyMap[opt])}
          </button>
        );
      })}
    </div>
  );
}

function UToggle({ label, description, value, onChange, locked }) {
  return (
    <div style={S.toggleRow}>
      <div style={{ flex: 1 }}>
        <div style={S.toggleLabel}>{label}</div>
        {description && <div style={S.toggleDesc}>{description}</div>}
      </div>
      <button
        type="button"
        disabled={!!locked}
        onClick={() => !locked && onChange && onChange(!value)}
        aria-checked={value}
        role="switch"
        style={{
          flexShrink: 0,
          width: 46, height: 26, borderRadius: 999, border: "none", cursor: locked ? "default" : "pointer",
          background: value ? "#C1121F" : "rgba(255,255,255,0.12)",
          opacity: locked ? 0.45 : 1,
          position: "relative",
          transition: "background 180ms ease",
          padding: 0,
          outline: "none",
        }}
      >
        <span style={{
          position: "absolute",
          top: 3, left: value ? "calc(100% - 23px)" : 3,
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff", transition: "left 180ms ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }} />
      </button>
    </div>
  );
}

export default function UploadPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState("video"); // "video" | "setup"
  const [contentType, setContentType] = useState("training");

  const [remixOfId, setRemixOfId] = useState(null);
  const [remixOfCreatorId, setRemixOfCreatorId] = useState(null);
  const [remixOfCreatorName, setRemixOfCreatorName] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  // Common
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("boxing");
  const [difficulty, setDifficulty] = useState("beginner");
  const [tags, setTags] = useState("");

  // Challenge
  const [challengeLabel, setChallengeLabel] = useState("");
  const [targetHits, setTargetHits] = useState("");
  const [aiScoringEnabled, setAiScoringEnabled] = useState(true);
  const [challengeEnabled, setChallengeEnabled] = useState(false);

  // Educational
  const [techniqueTitle, setTechniqueTitle] = useState("");
  const [mistakeNote, setMistakeNote] = useState("");
  const [fixNote, setFixNote] = useState("");
  const [coachNote, setCoachNote] = useState("");
  const [eduChallengeEnabled, setEduChallengeEnabled] = useState(false);

  // Gym + AI caption
  const [gymId, setGymId] = useState("");
  const [gyms, setGyms] = useState([]);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [captionContext, setCaptionContext] = useState("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionError, setCaptionError] = useState("");
  const [captionResult, setCaptionResult] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (!user?.uid) return;
    import("firebase/firestore").then(({ collection: col, getDocs: gd, query: q }) => {
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
      setContentType("training");
    }
  }, []);

  if (authLoading) return <div style={S.loading}>...</div>;
  if (!user) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { alert(t("uploadSelectVideo")); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const isEdu = contentType === "educational";
    const isTraining = contentType === "training";
    if (isEdu && !techniqueTitle.trim()) { setError("Please add a technique title."); return; }
    if (!isEdu && !description.trim()) { setError(t("uploadMissingFields")); return; }

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
      const tagList = tags.split(",").map((tg) => tg.trim()).filter(Boolean);

      const reelDoc = {
        userId: user.uid,
        username: user.displayName || user.email?.split("@")[0] || "user",
        videoUrl,
        thumbnailUrl: videoUrl,
        description: isEdu ? (techniqueTitle.trim() || description.trim()) : description.trim(),
        type: isTraining ? "training" : "content",
        contentType,
        category,
        difficulty,
        tags: tagList,
        challengeEnabled: isTraining ? true : (isEdu ? eduChallengeEnabled : challengeEnabled),
        challengeLabel: isTraining ? (challengeLabel.trim() || description.trim().slice(0, 60)) : (isEdu ? techniqueTitle.trim() : ""),
        targetHits: isTraining && targetHits ? Number(targetHits) : null,
        aiScoringEnabled: isTraining ? aiScoringEnabled : false,
        likes: 0,
        commentsCount: 0,
        shares: 0,
        createdAt: serverTimestamp(),
      };

      if (isEdu) {
        if (mistakeNote.trim()) reelDoc.mistakeNote = mistakeNote.trim();
        if (fixNote.trim()) reelDoc.fixNote = fixNote.trim();
        if (coachNote.trim()) reelDoc.coachNote = coachNote.trim();
        reelDoc.ctaType = "save";
      }
      if (remixOfId) {
        reelDoc.remixOf = remixOfId;
        if (remixOfCreatorId) reelDoc.remixOfCreatorId = remixOfCreatorId;
        if (remixOfCreatorName) reelDoc.remixOfCreatorName = remixOfCreatorName;
      }
      if (gymId) reelDoc.gymId = gymId;

      const newReelRef = await addDoc(collection(db, "reels"), reelDoc);
      checkAndAwardBadges(user.uid, { hasUploaded: true }).catch(() => {});
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
    const typeLabel = isTraining ? "challenge" : isEdu ? "educational" : "lifestyle";
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
              "Generate a GAVANA boxing reel caption.",
              `Content type: ${typeLabel}. Context: ${context}`,
              "GAVANA tone: modern fighter/athlete social media — short, sharp, confident. No cringe, no over-explaining.",
              `Good hook examples: 'Sharp. Fast. Focused.' / 'Clean work.' / 'Ghost-оо давах хүртэл зогсохгүй.' / 'Tempo sain baina.'`,
              "Return exactly three plain-text sections, no markdown, no bullets:",
              "Hook: one punchy viral line, max 8 words.",
              "Caption: one tight fighter-voice caption, max 16 words.",
              "Hashtags: 5 to 7 relevant hashtags including #gavana.",
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

  const parsedCaption = captionResult ? parseAiCaptionResult(captionResult) : null;
  const isTraining = contentType === "training";
  const isEdu = contentType === "educational";
  const isLifestyle = contentType === "lifestyle";
  const diffColorMap = (d) => d === "beginner" ? S.chipGreen : d === "intermediate" ? S.chipGold : S.chipRed;

  // ── VIDEO STEP ─────────────────────────────────────────────────────────────
  if (step === "video") {
    return (
      <div style={S.videoPage}>
        <div style={S.videoHeader}>
          <button onClick={() => router.back()} style={S.iconBtn}>✕</button>
          <span style={S.headerTitle}>{locale === "mn" ? "Шинэ рилс" : locale === "ko" ? "새 릴스" : "New Reel"}</span>
          <div style={{ width: 40 }} />
        </div>

        {remixOfId && (
          <div style={S.remixBar}>
            🔀 Remixing {remixOfCreatorName ? `@${remixOfCreatorName}` : "a challenge"}
          </div>
        )}

        <div style={S.videoPicker} onClick={() => !selectedFile && fileInputRef.current?.click()}>
          {selectedFile ? (
            <video src={previewUrl} controls playsInline preload="metadata" style={S.videoFull} />
          ) : (
            <div style={S.videoEmptyState}>
              <div style={S.videoEmptyIcon}>▣</div>
              <p style={S.videoEmptyLabel}>{locale === "mn" ? "Видео сонгохын тулд дарна уу" : locale === "ko" ? "동영상을 선택하려면 탭하세요" : "Tap to select a video"}</p>
              <p style={S.videoEmptySub}>MP4, MOV · up to 500MB</p>
            </div>
          )}
        </div>

        <div style={S.videoBottomBar}>
          <button style={S.galleryBtn} onClick={() => fileInputRef.current?.click()}>
            <span style={{ fontSize: 13, fontWeight: 800, color: selectedFile ? "#D4AF37" : "rgba(255,255,255,0.75)" }}>
              {selectedFile
              ? (locale === "mn" ? "Солих" : locale === "ko" ? "변경" : "Change")
              : (locale === "mn" ? "Галерей" : locale === "ko" ? "갤러리" : "Gallery")}
            </span>
          </button>
          {selectedFile && (
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedFile.name}
            </span>
          )}
          <button
            onClick={() => selectedFile ? setStep("setup") : fileInputRef.current?.click()}
            style={{ ...S.nextBtn, opacity: selectedFile ? 1 : 0.42 }}
          >
            {locale === "mn" ? "Дараах →" : locale === "ko" ? "다음 →" : "Next →"}
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} style={{ display: "none" }} />
      </div>
    );
  }

  // ── SETUP STEP ─────────────────────────────────────────────────────────────
  return (
    <div style={S.setupPage}>
      <div style={S.setupHeader}>
        <button onClick={() => setStep("video")} style={S.iconBtn}>←</button>
        <span style={S.headerTitle}>{locale === "mn" ? "Рилс нийтлэх" : locale === "ko" ? "릴스 올리기" : "Post Reel"}</span>
        <button onClick={handleUpload} disabled={uploading} style={{ ...S.postBtn, opacity: uploading ? 0.6 : 1 }}>
          {uploading ? `${uploadProgress}%` : (locale === "mn" ? "Нийтлэх" : locale === "ko" ? "올리기" : "Post")}
        </button>
      </div>

      <div style={S.setupScroll}>
        {/* Video thumbnail strip */}
        <div style={S.videoStrip}>
          <video src={previewUrl} muted playsInline style={S.videoThumb} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 700, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedFile?.name}
            </div>
            <button onClick={() => setStep("video")} style={S.changeVideoBtn}>{locale === "mn" ? "Видео солих" : locale === "ko" ? "동영상 변경" : "Change video"}</button>
          </div>
        </div>

        {error && <div style={S.errBox}>{error}</div>}
        {remixOfId && (
          <div style={S.remixBox}>🔀 Remixing {remixOfCreatorName ? `@${remixOfCreatorName}` : "a challenge"}</div>
        )}

        {/* Content type tabs */}
        <div style={S.typeTabs}>
          {[
            { id: "training", emoji: "🥊", label: "Challenge", color: "#F87171", border: "rgba(193,18,31,0.5)" },
            { id: "lifestyle", emoji: "🎬", label: "Lifestyle", color: "#60A5FA", border: "rgba(96,165,250,0.45)" },
            { id: "educational", emoji: "📚", label: "Education", color: "#D4AF37", border: "rgba(212,175,55,0.5)" },
          ].map(({ id, emoji, label, color, border }) => {
            const active = contentType === id;
            return (
              <button
                key={id}
                onClick={() => setContentType(id)}
                style={{
                  ...S.typeTab,
                  ...(active ? { color, border: `1px solid ${border}`, background: `${color}1a` } : {}),
                }}
              >
                {emoji} {label}
              </button>
            );
          })}
        </div>

        <div style={S.fields}>
          {/* Primary field — caption or technique title (always visible) */}
          {(isTraining || isLifestyle) && (
            <UField label={t("caption")}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isTraining ? t("uploadChallengePlaceholder") : t("uploadLifestylePlaceholder")}
                style={{ ...S.textarea, minHeight: 96 }}
              />
            </UField>
          )}
          {isEdu && (
            <UField label={t("uploadTechniqueTitle")}>
              <input value={techniqueTitle} onChange={(e) => setTechniqueTitle(e.target.value)} placeholder={t("uploadTechniquePlaceholder")} style={S.input} />
            </UField>
          )}

          {/* Details accordion — advanced options collapsed by default */}
          <div style={S.detailsBox}>
            <button type="button" onClick={() => setDetailsOpen(!detailsOpen)} style={S.detailsToggle}>
              <span style={S.detailsLabel}>⚙ Details</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16, lineHeight: 1 }}>{detailsOpen ? "∧" : "∨"}</span>
            </button>
            {detailsOpen && (
              <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
                {isTraining && (
                  <>
                    <UField label={t("uploadChallengeLabel")}>
                      <input value={challengeLabel} onChange={(e) => setChallengeLabel(e.target.value)} placeholder={t("uploadChallengeLabelPlaceholder")} style={S.input} />
                    </UField>
                    <UField label={t("uploadTargetHits")}>
                      <input type="number" value={targetHits} onChange={(e) => setTargetHits(e.target.value)} placeholder="e.g. 100" style={{ ...S.input, width: 140 }} min={1} />
                    </UField>
                    <UField label={t("uploadDifficulty")}>
                      <UChips options={DIFFICULTIES} keyMap={DIFF_KEY} t={t} selected={difficulty} onSelect={setDifficulty} colorMap={diffColorMap} />
                    </UField>
                    <UToggle label={t("uploadAiScoring")} description={t("uploadAiScoringDesc")} value={aiScoringEnabled} onChange={setAiScoringEnabled} />
                    <UToggle label={t("uploadChallengeCta")} description={t("uploadChallengeCtaDesc")} value={true} locked />
                  </>
                )}
                {isLifestyle && (
                  <>
                    <UField label={t("uploadCategory")}>
                      <UChips options={CATEGORIES} keyMap={CAT_KEY} t={t} selected={category} onSelect={setCategory} colorMap={() => S.chipActive} />
                    </UField>
                    <UField label={t("uploadTags")}>
                      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("uploadTagsPlaceholder")} style={S.input} />
                    </UField>
                  </>
                )}
                {isEdu && (
                  <>
                    <UField label={t("uploadMistakeLabel")}>
                      <textarea value={mistakeNote} onChange={(e) => setMistakeNote(e.target.value)} placeholder={t("uploadMistakePlaceholder")} style={{ ...S.textarea, minHeight: 60 }} />
                    </UField>
                    <UField label={t("uploadFixLabel")}>
                      <textarea value={fixNote} onChange={(e) => setFixNote(e.target.value)} placeholder={t("uploadFixPlaceholder")} style={{ ...S.textarea, minHeight: 60 }} />
                    </UField>
                    <UField label={t("uploadCoachNoteLabel")}>
                      <textarea value={coachNote} onChange={(e) => setCoachNote(e.target.value)} placeholder={t("uploadCoachNotePlaceholder")} style={{ ...S.textarea, minHeight: 60 }} />
                    </UField>
                    <UField label={t("uploadDifficulty")}>
                      <UChips options={DIFFICULTIES} keyMap={DIFF_KEY} t={t} selected={difficulty} onSelect={setDifficulty} colorMap={diffColorMap} />
                    </UField>
                    <UToggle label={t("uploadSaveCta")} description={t("uploadSaveCtaDesc")} value={true} locked />
                    <UToggle label={t("uploadEduChallengeCta")} description={t("uploadEduChallengeCtaDesc")} value={eduChallengeEnabled} onChange={setEduChallengeEnabled} />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Gym tag */}
          {gyms.length > 0 && (
            <UField label={t("uploadGymTag")}>
              <div style={{ position: "relative" }}>
                <select
                  value={gymId}
                  onChange={(e) => setGymId(e.target.value)}
                  style={{ ...S.input, appearance: "none", WebkitAppearance: "none", paddingRight: 36, color: gymId ? "#fff" : "rgba(255,255,255,0.38)" }}
                >
                  <option value="" style={{ color: "#aaa" }}>{t("uploadGymNone")}</option>
                  {gyms.map((g) => <option key={g.id} value={g.id} style={{ color: "#fff", background: "#111" }}>{g.gymName}</option>)}
                </select>
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.38)", fontSize: 11 }}>▾</span>
              </div>
            </UField>
          )}

          {/* AI Caption accordion */}
          <div style={S.aiBox}>
            <button onClick={() => setCaptionOpen(!captionOpen)} style={S.aiBoxBtn}>
              <span style={S.aiBoxLabel}>✨ {t("aiCaptionGenerator")}</span>
              <span style={{ color: "#D4AF37", fontSize: 18, lineHeight: 1 }}>{captionOpen ? "∧" : "∨"}</span>
            </button>
            {captionOpen && (
              <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={S.aiBoxHelp}>{t("aiCaptionHelp")}</p>
                <input value={captionContext} onChange={(e) => setCaptionContext(e.target.value)} placeholder={t("captionContextPlaceholder")} style={S.input} />
                <button onClick={handleGenerateCaption} disabled={captionLoading} style={{ ...S.primaryBtn, marginTop: 4, opacity: captionLoading ? 0.6 : 1 }}>
                  {captionLoading ? t("generating") : t("generateCaption")}
                </button>
                {captionError && <p style={S.errTxt}>{captionError}</p>}
                {parsedCaption && (
                  <div style={S.captionResult}>
                    {parsedCaption.hook && <div style={S.captionSection}><span style={S.captionLbl}>{t("hook")}</span><div style={S.captionHook}>{parsedCaption.hook}</div></div>}
                    {parsedCaption.caption && <div style={S.captionSection}><span style={S.captionLbl}>{t("caption")}</span><div style={S.captionBody}>{parsedCaption.caption}</div></div>}
                    {parsedCaption.hashtags && <div style={S.captionSection}><span style={S.captionLbl}>{t("hashtags")}</span><div style={S.captionBody}>{parsedCaption.hashtags}</div></div>}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                      <button style={S.captionActionBtn} onClick={() => setDescription(parsedCaption.description)}>{t("useCaption")}</button>
                      <button style={{ ...S.captionActionBtn, background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }} onClick={() => navigator.clipboard?.writeText(parsedCaption.hashtags)}>{t("copyHashtags")}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {uploading && (
          <div style={S.progressWrap}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#aaa", fontSize: 12, fontWeight: 800 }}>
              <span>{t("uploading")}</span><span>{uploadProgress}%</span>
            </div>
            <div style={S.progressTrack}><div style={{ ...S.progressFill, width: `${uploadProgress}%` }} /></div>
          </div>
        )}

        <button onClick={handleUpload} disabled={uploading} style={{ ...S.primaryBtn, opacity: uploading ? 0.6 : 1, marginBottom: 32 }}>
          {uploading ? `${uploadProgress}%` : t("uploadPostReel")}
        </button>
      </div>
    </div>
  );
}

const S = {
  loading: { minHeight: "100vh", background: "#070707", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "sans-serif" },

  // ── Video step
  videoPage: { minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" },
  videoHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(16px + env(safe-area-inset-top)) 20px 16px",
    background: "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, transparent 100%)",
  },
  remixBar: {
    position: "absolute", top: 108, left: 0, right: 0, zIndex: 20,
    textAlign: "center", background: "rgba(193,18,31,0.2)",
    borderBottom: "1px solid rgba(193,18,31,0.3)",
    padding: "8px 16px", color: "#F87171", fontSize: 13, fontWeight: 800,
  },
  videoPicker: {
    flex: 1, position: "relative",
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: "calc(100vh - 88px)", cursor: "pointer",
  },
  videoFull: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover" },
  videoEmptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 40, zIndex: 1 },
  videoEmptyIcon: { fontSize: 72, color: "#D4AF37" },
  videoEmptyLabel: { margin: 0, color: "rgba(255,255,255,0.88)", fontSize: 20, fontWeight: 900, textAlign: "center" },
  videoEmptySub: { margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center" },
  videoBottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 24px 44px",
    background: "linear-gradient(0deg, rgba(0,0,0,0.82) 0%, transparent 100%)",
  },
  galleryBtn: { padding: "10px 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.4)", cursor: "pointer" },
  nextBtn: { padding: "12px 28px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, #C1121F, #8f0d17)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 20px rgba(193,18,31,0.45)" },

  // ── Setup step
  setupPage: { minHeight: "100vh", background: "#070707", display: "flex", flexDirection: "column", fontFamily: "sans-serif" },
  setupHeader: {
    position: "sticky", top: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(16px + env(safe-area-inset-top)) 20px 14px",
    background: "rgba(7,7,7,0.96)", backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  iconBtn: { width: 40, height: 40, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  headerTitle: { flex: 1, color: "#fff", fontSize: 16, fontWeight: 900, textAlign: "center" },
  postBtn: { padding: "10px 24px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, #C1121F, #8f0d17)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 16px rgba(193,18,31,0.35)" },
  setupScroll: { flex: 1, overflowY: "auto", padding: "20px 20px 40px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 600, width: "100%", margin: "0 auto", boxSizing: "border-box" },

  // Video strip
  videoStrip: { display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" },
  videoThumb: { width: 48, height: 64, borderRadius: 10, objectFit: "cover", background: "#111", flexShrink: 0 },
  changeVideoBtn: { background: "none", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999, color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, padding: "4px 12px", cursor: "pointer" },

  // Type tabs
  typeTabs: { display: "flex", gap: 6, padding: 5, background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" },
  typeTab: { flex: 1, padding: "10px 4px", borderRadius: 10, border: "1px solid transparent", background: "none", color: "rgba(255,255,255,0.38)", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" },

  // Fields
  fields: { display: "flex", flexDirection: "column", gap: 18 },
  fieldLabel: { fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 },
  input: { background: "#111", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
  textarea: { background: "#111", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 14, minHeight: 82, resize: "vertical", outline: "none", width: "100%", boxSizing: "border-box" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 800, cursor: "pointer" },
  chipActive: { background: "rgba(193,18,31,0.18)", border: "1px solid rgba(193,18,31,0.5)", color: "#F87171" },
  chipGreen: { background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.4)", color: "#34D399" },
  chipGold: { background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37" },
  chipRed: { background: "rgba(193,18,31,0.18)", border: "1px solid rgba(193,18,31,0.5)", color: "#F87171" },

  // Toggles
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" },
  toggleLabel: { fontSize: 14, fontWeight: 800, color: "#fff" },
  toggleDesc: { fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 3 },
  toggleBtn: { flexShrink: 0, minWidth: 52, padding: "7px 14px", borderRadius: 999, border: "none", color: "#fff", fontSize: 12, fontWeight: 900 },

  // Details accordion
  detailsBox: { borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", background: "rgba(255,255,255,0.02)" },
  detailsToggle: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" },
  detailsLabel: { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" },

  // AI box
  aiBox: { borderRadius: 16, background: "linear-gradient(145deg, rgba(193,18,31,0.08), rgba(11,11,11,0.9) 50%, rgba(212,175,55,0.05))", border: "1px solid rgba(255,255,255,0.07)" },
  aiBoxBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 16px", background: "none", border: "none", cursor: "pointer" },
  aiBoxLabel: { color: "#D4AF37", fontSize: 13, fontWeight: 900, letterSpacing: 0.6 },
  aiBoxHelp: { margin: 0, color: "#888", fontSize: 13, lineHeight: 1.5 },

  // Caption result
  captionResult: { display: "flex", flexDirection: "column", gap: 10, padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.14)" },
  captionSection: { display: "grid", gap: 4, padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.04)" },
  captionLbl: { color: "#D4AF37", fontSize: 10, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase" },
  captionHook: { color: "#fff", fontSize: 14, fontWeight: 900, lineHeight: 1.45 },
  captionBody: { color: "#fff", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" },
  captionActionBtn: { padding: "9px 14px", borderRadius: 999, border: "1px solid rgba(212,175,55,0.34)", background: "rgba(212,175,55,0.1)", color: "#D4AF37", fontSize: 13, fontWeight: 800, cursor: "pointer" },

  primaryBtn: { padding: "14px 20px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #C1121F, #8f0d17)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 24px rgba(193,18,31,0.28)" },

  errBox: { background: "#3a0a0a", border: "1px solid rgba(193,18,31,0.5)", color: "#ff8b8b", padding: "12px 14px", borderRadius: 10, fontSize: 13 },
  errTxt: { margin: 0, color: "#ff8b8b", fontSize: 13 },
  remixBox: { background: "rgba(193,18,31,0.12)", border: "1px solid rgba(193,18,31,0.35)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#F87171" },

  progressWrap: { display: "flex", flexDirection: "column", gap: 6 },
  progressTrack: { height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #C1121F, #D4AF37)", transition: "width 180ms ease" },
};
