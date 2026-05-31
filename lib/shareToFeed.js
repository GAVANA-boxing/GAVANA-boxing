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

export async function shareTrainingToFeed({ user, result, poseMetrics, drillConfig, locale, videoURL = null, thumbnailURL = null, durationSeconds = null }) {
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
  if (techniqueTag)                                              reelDoc.techniqueTag    = techniqueTag;
  if (dnaProfile)                                                reelDoc.dnaProfile      = dnaProfile;
  if (videoURL)                                                  reelDoc.videoURL        = videoURL;
  if (thumbnailURL)                                              reelDoc.thumbnailURL    = thumbnailURL;
  if (typeof durationSeconds === "number" && durationSeconds > 0) reelDoc.durationSeconds = durationSeconds;

  const ref = await addDoc(collection(db, "reels"), reelDoc);
  return ref.id;
}

export async function shareAcademyToFeed({ user, result, poseMetrics, drillConfig, academyLesson, locale, videoURL = null, thumbnailURL = null, durationSeconds = null }) {
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
  if (videoURL)                                                    reelDoc.videoURL        = videoURL;
  if (thumbnailURL)                                                reelDoc.thumbnailURL    = thumbnailURL;

  const ref = await addDoc(collection(db, "reels"), reelDoc);
  return ref.id;
}

function buildChallengeTitle({ academyLesson, locale }) {
  const lessonTitle = academyLesson?.title || null;
  if (locale === "mn") {
    return lessonTitle
      ? `${lessonTitle} дээрх онооноос ялаарай`
      : "Дасгалын онооноос ялаарай";
  }
  if (locale === "ko") {
    return lessonTitle
      ? `내 ${lessonTitle} 점수를 이겨봐`
      : "내 트레이닝 점수를 이겨봐";
  }
  return lessonTitle
    ? `Beat my ${lessonTitle} score`
    : "Beat my training score";
}

function buildChallengeCaption({ score, challengeTitle, locale }) {
  const s = typeof score === "number" && isFinite(score) ? score.toFixed(1) : null;
  if (locale === "mn") {
    return s ? `⚔️ ${challengeTitle} — Зорилт: ${s}/10` : `⚔️ ${challengeTitle}`;
  }
  if (locale === "ko") {
    return s ? `⚔️ ${challengeTitle} — 목표: ${s}/10` : `⚔️ ${challengeTitle}`;
  }
  return s ? `⚔️ ${challengeTitle} — Target: ${s}/10` : `⚔️ ${challengeTitle}`;
}

export async function createChallengePost({ user, result, poseMetrics, academyLesson, locale }) {
  if (!user?.uid || !result) throw new Error("missing required data");

  const { db } = await getFirebase();
  const { collection, addDoc, serverTimestamp, Timestamp } = await import("firebase/firestore");

  let challengeTechniqueTag = null;
  if (poseMetrics) {
    try {
      const rev = generateTechniqueReview({ poseMetrics, result, locale });
      if (!rev.lowData) challengeTechniqueTag = rev.title || null;
    } catch { /* non-critical */ }
  }

  const challengeTitle = buildChallengeTitle({ academyLesson, locale });
  const caption        = buildChallengeCaption({ score: result.score, challengeTitle, locale });
  const expiresAt      = Timestamp.fromMillis(Date.now() + 72 * 60 * 60 * 1000);

  const reelDoc = {
    userId:               user.uid,
    username:             user.displayName || user.email?.split("@")[0] || "Fighter",
    userPhotoURL:         user.photoURL || "",
    caption,
    contentType:          "challenge",
    challengeTitle,
    challengeTargetScore: result.score,
    sourceSessionScore:   result.score,
    challengeExpiresAt:   expiresAt,
    createdAt:            serverTimestamp(),
    likesCount:           0,
    commentsCount:        0,
    viewsCount:           0,
    isDemo:               false,
  };

  if (challengeTechniqueTag) reelDoc.challengeTechniqueTag = challengeTechniqueTag;
  if (academyLesson?.id)     reelDoc.academyLessonId       = academyLesson.id;
  if (academyLesson?.title)  reelDoc.academyLessonTitle    = academyLesson.title;

  const ref = await addDoc(collection(db, "reels"), reelDoc);
  return ref.id;
}

function buildChallengeResponseCaption({ score, challengeTitle, beaten, locale }) {
  const s = typeof score === "number" && isFinite(score) ? score.toFixed(1) : null;
  if (locale === "mn") {
    return beaten
      ? (s ? `⚔️ Challenge ялав! ${challengeTitle} — ${s}/10` : `⚔️ Challenge ялав! ${challengeTitle}`)
      : (s ? `⚔️ Challenge хариулав — ${challengeTitle}. Оноо: ${s}/10` : `⚔️ Challenge хариулав — ${challengeTitle}`);
  }
  if (locale === "ko") {
    return beaten
      ? (s ? `⚔️ 챌린지 달성! ${challengeTitle} — ${s}/10` : `⚔️ 챌린지 달성! ${challengeTitle}`)
      : (s ? `⚔️ 챌린지 응답 — ${challengeTitle}. 점수: ${s}/10` : `⚔️ 챌린지 응답 — ${challengeTitle}`);
  }
  return beaten
    ? (s ? `⚔️ Challenge beaten! ${challengeTitle} — ${s}/10` : `⚔️ Challenge beaten! ${challengeTitle}`)
    : (s ? `⚔️ Challenge response — ${challengeTitle}. Score: ${s}/10` : `⚔️ Challenge response — ${challengeTitle}`);
}

export async function createChallengeResponse({ user, result, challengePostData, locale }) {
  if (!user?.uid || !result || !challengePostData?.id) throw new Error("missing required data");

  const { db } = await getFirebase();
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

  const challengeTitle   = challengePostData.challengeTitle || "";
  const targetScore      = typeof challengePostData.challengeTargetScore === "number"
    ? challengePostData.challengeTargetScore : null;
  const beaten           = targetScore != null && result.score > targetScore;
  const caption          = buildChallengeResponseCaption({ score: result.score, challengeTitle, beaten, locale });

  const reelDoc = {
    userId:               user.uid,
    username:             user.displayName || user.email?.split("@")[0] || "Fighter",
    userPhotoURL:         user.photoURL || "",
    caption,
    contentType:          "challenge_response",
    parentChallengeId:    challengePostData.id,
    challengeTitle,
    challengeTargetScore: targetScore,
    sourceSessionScore:   result.score,
    createdAt:            serverTimestamp(),
    likesCount:           0,
    commentsCount:        0,
    viewsCount:           0,
    isDemo:               false,
  };

  const ref = await addDoc(collection(db, "reels"), reelDoc);
  return ref.id;
}
