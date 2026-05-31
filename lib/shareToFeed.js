import { getFirebase } from "@/lib/lazyFirebase";
import { generateTechniqueReview } from "@/lib/techniqueReview";

function buildAcademyCaption({ score, lessonTitle, locale }) {
  const s = typeof score === "number" && isFinite(score) ? score.toFixed(1) : null;
  const title = lessonTitle || "";
  if (locale === "mn") {
    return s
      ? `Academy хичээл дууслаа — ${title}. Оноо ${s}/10.`
      : `Academy хичээл дууслаа — ${title}.`;
  }
  if (locale === "ko") {
    return s
      ? `아카데미 레슨 완료 — ${title}. 점수 ${s}/10.`
      : `아카데미 레슨 완료 — ${title}.`;
  }
  return s
    ? `Academy lesson complete — ${title}. Score ${s}/10.`
    : `Academy lesson complete — ${title}.`;
}

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

export async function shareAcademyToFeed({ user, result, poseMetrics, drillConfig, academyLesson, locale }) {
  if (!user?.uid || !result || !academyLesson) throw new Error("missing required data");

  const { db } = await getFirebase();
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

  let techniqueTag = null;
  if (poseMetrics) {
    try {
      const rev = generateTechniqueReview({ poseMetrics, result, locale });
      if (!rev.lowData) techniqueTag = rev.title || null;
    } catch { /* non-critical */ }
  }

  const caption = buildAcademyCaption({ score: result.score, lessonTitle: academyLesson.title, locale });

  let dnaProfile = null;
  if (poseMetrics?.boxingIntelligence) {
    const bi = poseMetrics.boxingIntelligence;
    const snap = {};
    if (bi.styleLabel) snap.styleLabel = bi.styleLabel;
    if (bi.weakness)   snap.weakness   = bi.weakness;
    if (Object.keys(snap).length) dnaProfile = snap;
  }

  const reelDoc = {
    userId:             user.uid,
    username:           user.displayName || user.email?.split("@")[0] || "Fighter",
    userPhotoURL:       user.photoURL || "",
    caption,
    contentType:        "academy",
    academyLessonId:    academyLesson.id,
    academyLessonTitle: academyLesson.title,
    createdAt:          serverTimestamp(),
    likesCount:         0,
    commentsCount:      0,
    viewsCount:         0,
    isDemo:             false,
    completed:          typeof result.score === "number" && result.score >= 6.5,
  };

  if (academyLesson.pathId)     reelDoc.academyPathId  = academyLesson.pathId;
  if (academyLesson.difficulty) reelDoc.difficulty     = academyLesson.difficulty;
  if (typeof result.score === "number" && isFinite(result.score)) reelDoc.sessionScore = result.score;
  if (typeof drillConfig?.durationSeconds === "number")          reelDoc.durationSeconds = drillConfig.durationSeconds;
  if (techniqueTag) reelDoc.techniqueTag = techniqueTag;
  if (dnaProfile)   reelDoc.dnaProfile   = dnaProfile;

  const ref = await addDoc(collection(db, "reels"), reelDoc);
  return ref.id;
}
