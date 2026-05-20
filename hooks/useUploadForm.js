"use client";
import { useEffect, useRef, useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db, auth } from "@/lib/firebase";
import { checkAndAwardBadges } from "@/lib/badges";
import { createRemixNotification } from "@/lib/notifications";
import { parseAiCaptionResult } from "@/lib/captionHelpers";

export function useUploadForm({ user, locale, t, router }) {
  const fileInputRef = useRef(null);

  const [step, setStep] = useState("video");
  const [contentType, setContentType] = useState("training");

  const [remixOfId, setRemixOfId] = useState(null);
  const [remixOfCreatorId, setRemixOfCreatorId] = useState(null);
  const [remixOfCreatorName, setRemixOfCreatorName] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [videoDuration, setVideoDuration] = useState(null);

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { alert(t("uploadSelectVideo")); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setVideoDuration(null);
  };

  const formatDuration = (secs) => {
    if (!secs || isNaN(secs)) return null;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
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
    const isTraining = contentType === "training";
    const isEdu = contentType === "educational";
    const typeLabel = isTraining ? "challenge" : isEdu ? "educational" : "lifestyle";
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

  return {
    fileInputRef, step, setStep, contentType, setContentType,
    remixOfId, remixOfCreatorId, remixOfCreatorName,
    selectedFile, previewUrl, uploading, uploadProgress, error, videoDuration, setVideoDuration,
    description, setDescription, category, setCategory, difficulty, setDifficulty, tags, setTags,
    challengeLabel, setChallengeLabel, targetHits, setTargetHits, aiScoringEnabled, setAiScoringEnabled, challengeEnabled, setChallengeEnabled,
    techniqueTitle, setTechniqueTitle, mistakeNote, setMistakeNote, fixNote, setFixNote, coachNote, setCoachNote, eduChallengeEnabled, setEduChallengeEnabled,
    gymId, setGymId, gyms, captionOpen, setCaptionOpen, detailsOpen, setDetailsOpen,
    captionContext, setCaptionContext, captionLoading, captionError, captionResult, setCaptionResult,
    handleFileSelect, formatDuration, handleUpload, handleGenerateCaption,
    parsedCaption: captionResult ? parseAiCaptionResult(captionResult) : null,
    fileSizeMB: selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) : null,
  };
}
