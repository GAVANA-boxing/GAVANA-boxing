import { getFirebase } from "@/lib/lazyFirebase";
import { generateTechniqueReview } from "@/lib/techniqueReview";

function buildCaption({ score, priorityWeakness, locale }) {
  const s = typeof score === "number" && isFinite(score) ? score.toFixed(1) : null;
  if (!s) {
    return locale === "mn" ? "Дасгал дуусч гүйцлээ." : locale === "ko" ? "훈련 완료." : "Training complete.";
  }
  const focus = priorityWeakness || "";
  if (locale === "mn") {
    return focus
      ? `Дасгал дууслаа — Оноо ${s}/10. Анхаарах зүйл: ${focus}.`
      : `Дасгал дууслаа — Оноо ${s}/10.`;
  }
  if (locale === "ko") {
    return focus
      ? `훈련 완료 — 점수 ${s}/10. 집중: ${focus}.`
      : `훈련 완료 — 점수 ${s}/10.`;
  }
  return focus
    ? `Training complete — Score ${s}/10. Focus: ${focus}.`
    : `Training complete — Score ${s}/10.`;
}

export async function shareTrainingToFeed({ user, result, poseMetrics, drillConfig, locale }) {
  if (!user?.uid || !result) throw new Error("missing required data");

  const { db } = await getFirebase();
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

  let techniqueTag = null;
  let priorityWeakness = null;
  if (poseMetrics) {
    try {
      const rev = generateTechniqueReview({ poseMetrics, result, locale });
      if (!rev.lowData) {
        techniqueTag    = rev.title            || null;
        priorityWeakness = rev.priorityWeakness || null;
      }
    } catch { /* non-critical */ }
  }

  const caption = buildCaption({ score: result.score, priorityWeakness, locale });

  let dnaProfile = null;
  if (poseMetrics?.boxingIntelligence) {
    const bi = poseMetrics.boxingIntelligence;
    const snap = {};
    if (bi.styleLabel) snap.styleLabel = bi.styleLabel;
    if (bi.weakness)   snap.weakness   = bi.weakness;
    if (Object.keys(snap).length) dnaProfile = snap;
  }

  const reelDoc = {
    userId:        user.uid,
    username:      user.displayName || user.email?.split("@")[0] || "Fighter",
    userPhotoURL:  user.photoURL || "",
    caption,
    contentType:   "training",
    createdAt:     serverTimestamp(),
    likesCount:    0,
    commentsCount: 0,
    viewsCount:    0,
    isDemo:        false,
  };

  if (typeof result.score === "number" && isFinite(result.score)) {
    reelDoc.sessionScore = result.score;
  }
  if (typeof drillConfig?.durationSeconds === "number") {
    reelDoc.durationSeconds = drillConfig.durationSeconds;
  }
  if (techniqueTag) reelDoc.techniqueTag = techniqueTag;
  if (dnaProfile)   reelDoc.dnaProfile   = dnaProfile;

  const ref = await addDoc(collection(db, "reels"), reelDoc);
  return ref.id;
}
