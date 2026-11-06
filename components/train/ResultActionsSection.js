"use client";
import { useCallback, useEffect, useRef } from "react";
import { loc } from "@/lib/loc";
import { GOLD, RED, RADIUS, whiteAlpha, goldAlpha, redAlpha } from "@/lib/tokens";
import styles from "@/components/train/trainStyles";
import { CORE_MODE } from "@/lib/coreRoutes";


// Stored value (English, used in history/analytics) → label per locale (mn, ko, en).
const SESSION_TAGS = [
  ["Bag", ["Боксын уут", "샌드백", "Bag"]],
  ["Shadow", ["Сүүдрийн бокс", "섀도복싱", "Shadow"]],
  ["Mitts", ["Лап", "미트", "Mitts"]],
  ["Sparring", ["Спарринг", "스파링", "Sparring"]],
  ["Conditioning", ["Бие бялдар", "컨디셔닝", "Conditioning"]],
];

export default function ResultActionsSection({
  error,
  isLowConfidence,
  tooFewPunches,
  isGuest,
  activeChallenge,
  sessionTag,
  setSessionTag,
  saving,
  saved,
  savedAttemptNumber,
  feedSharing,
  feedShared,
  challengePosting,
  challengePosted,
  challengeResponsePosting,
  challengeResponsePosted,
  challengeSaving,
  challengeSaved,
  challengePostData,
  poseMetrics,
  events,
  academyLesson,
  recordedBlob,
  onTryAgain,
  onSave,
  onSaveChallengeResult,
  onShareChallenge,
  onShareTraining,
  onShareToFeed,
  onCreateChallengePost,
  onPostChallengeResponse,
  locale,
  t,
  router,
}) {
  const saveSession = useCallback(() => {
    const { motionHistory: _mh, punchEvents: _pe, coaching, ...poseMetricsForSave } = poseMetrics || {};
    const weaknesses = (coaching || []).filter(c => c.type === "improve").map(c => c.message).slice(0, 2);
    if (weaknesses.length) poseMetricsForSave.weaknesses = weaknesses;
    onSave({ movementEvents: events, tag: sessionTag, poseMetrics: poseMetrics ? poseMetricsForSave : null });
  }, [poseMetrics, events, sessionTag, onSave]);

  // Auto-credit progress (best-in-class apps never make you tap "Save" to get
  // your XP/streak). Only for a real, confident session by a signed-in user;
  // low-confidence sessions keep the manual "save anyway" choice. Fires once
  // per result — this section remounts for every new session.
  const autoSavedRef = useRef(false);
  useEffect(() => {
    if (autoSavedRef.current || saved || saving) return;
    if (tooFewPunches || activeChallenge || isGuest || isLowConfidence) return;
    // Give the pose summary a moment to attach so the saved session keeps it.
    const id = setTimeout(() => {
      if (autoSavedRef.current) return;
      autoSavedRef.current = true;
      saveSession();
    }, poseMetrics ? 300 : 1500);
    return () => clearTimeout(id);
  }, [saved, saving, tooFewPunches, activeChallenge, isGuest, isLowConfidence, poseMetrics, saveSession]);

  return (
    <div style={{ padding: "12px 20px 16px", flexShrink: 0, borderTop: `1px solid ${whiteAlpha(0.06)}` }}>
      {error && (
        <div style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 10, background: redAlpha(0.12), border: `1px solid ${redAlpha(0.28)}`, color: "#fca5a5", fontSize: 13, fontWeight: 700 }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        <button type="button"
          style={styles.tryAgainButton}
          onClick={onTryAgain}>
          {isLowConfidence ? t("confidenceTryAgain") : activeChallenge ? t("challengeTryAgain") : t("trainTryAgain")}
        </button>
        {!activeChallenge && !saved && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
            {SESSION_TAGS.map(([tag, label]) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSessionTag((prev) => prev === tag ? null : tag)}
                style={{
                  padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: sessionTag === tag ? goldAlpha(0.2) : "rgba(255,255,255,0.05)",
                  border: `1px solid ${sessionTag === tag ? goldAlpha(0.5) : "rgba(255,255,255,0.1)"}`,
                  color: sessionTag === tag ? GOLD : "rgba(255,255,255,0.4)",
                  transition: "all 0.15s",
                }}
              >{loc(locale, ...label)}</button>
            ))}
          </div>
        )}
        {!tooFewPunches && !activeChallenge && !isGuest && (
          <button
            type="button"
            style={{ ...styles.saveButton, ...(saved ? styles.saveButtonDone : {}), ...(isLowConfidence && !saved ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)", fontSize: 11 } : {}), opacity: saving || saved ? 0.65 : 1, cursor: saving || saved ? "default" : "pointer" }}
            onClick={saveSession}
            disabled={saving || saved}
          >
            {saving
              ? t("trainSaving")
              : saved && savedAttemptNumber
                ? t("trainAttemptSaved").replace("{n}", savedAttemptNumber)
                : saved
                  ? t("trainSavedShort")
                  : isLowConfidence
                    ? t("confidenceSaveAnyway")
                    : t("trainSaveProgress")}
          </button>
        )}
        {!tooFewPunches && isGuest && (
          <button
            type="button"
            style={{ ...styles.saveButton, borderColor: "rgba(245,196,81,0.45)", background: "rgba(245,196,81,0.10)", color: "#F5C451" }}
            onClick={() => router.push(`/${locale}/login?mode=signup&redirect=${encodeURIComponent(`/${locale}/train`)}`)}
          >
            {loc(locale, "Профайл үүсгэж streak болон дэвшлийг хадгал →", "프로필 생성 — 스트릭과 진행 저장 →", "Create profile to save streak and progress →")}
          </button>
        )}
        {activeChallenge && (
          <button
            type="button"
            style={{ ...styles.saveButton, ...(challengeSaved ? styles.saveButtonDone : {}), opacity: challengeSaving || challengeSaved ? 0.65 : 1, cursor: challengeSaving || challengeSaved ? "default" : "pointer" }}
            onClick={onSaveChallengeResult}
            disabled={challengeSaving || challengeSaved}
          >
            {challengeSaving ? t("trainSaving") : challengeSaved ? t("challengeResultSaved") : t("challengeSaveResult")}
          </button>
        )}
        {/* Social sharing (feed / challenge posts) — outside the core loop, hidden in CORE_MODE */}
        {!CORE_MODE && (
          <>
        {!tooFewPunches && !activeChallenge && !isGuest && (
          <>
            <button
              type="button"
              disabled={feedSharing || feedShared}
              onClick={onShareToFeed}
              style={{
                ...styles.saveButton,
                background: feedShared ? "#17664b" : "rgba(255,59,48,0.14)",
                border: feedShared ? "none" : "1px solid rgba(255,59,48,0.3)",
                color: feedShared ? "#34D399" : RED,
                boxShadow: "none",
                opacity: feedSharing || feedShared ? 0.75 : 1,
                cursor: feedSharing || feedShared ? "default" : "pointer",
              }}
            >
              {feedSharing
                ? loc(locale, "Нийтэлж байна…", "공유 중…", "Sharing…")
                : feedShared
                  ? loc(locale, "Feed-д нийтлэгдлээ ✓", "피드에 공유됨 ✓", "Shared to Feed ✓")
                  : academyLesson
                    ? loc(locale, "Academy дэвшлийг хуваалцах", "아카데미 진행 상황 공유하기", "Share Academy Progress")
                    : recordedBlob
                      ? loc(locale, "Видео Feed-д хуваалцах", "비디오 피드에 공유하기", "Share Video to Feed")
                      : loc(locale, "Feed-д хуваалцах", "피드에 공유하기", "Share to Feed")}
            </button>
            {feedShared && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/feed`)}
                style={{ width: "100%", minHeight: 40, background: "none", border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: RADIUS.md, color: whiteAlpha(0.45), fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}
              >
                {loc(locale, "Feed харах →", "피드 보기 →", "View Feed →")}
              </button>
            )}
          </>
        )}
        {!tooFewPunches && !activeChallenge && isGuest && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/login?mode=signup&redirect=${encodeURIComponent(`/${locale}/train`)}`)}
            style={{ width: "100%", minHeight: 38, background: "none", border: `1px solid ${whiteAlpha(0.07)}`, borderRadius: RADIUS.md, color: whiteAlpha(0.3), fontSize: 11, fontWeight: 800, cursor: "pointer" }}
          >
            {academyLesson
              ? loc(locale, "Профайл үүсгэж academy дэвшлийг хуваалцаарай →", "프로필 생성 후 아카데미 진행 상황 공유 →", "Create profile to share academy progress →")
              : loc(locale, "Профайл үүсгэж өөрийн дэвшлийг хуваалцаарай →", "프로필 생성 후 진행 상황 공유 →", "Create profile to share your progress →")}
          </button>
        )}
        {!tooFewPunches && !activeChallenge && !isGuest && (
          <>
            <button
              type="button"
              disabled={challengePosting || challengePosted}
              onClick={onCreateChallengePost}
              style={{
                ...styles.saveButton,
                background: challengePosted ? "#17664b" : "rgba(167,139,250,0.12)",
                border: challengePosted ? "none" : "1px solid rgba(167,139,250,0.28)",
                color: challengePosted ? "#34D399" : "#C084FC",
                boxShadow: "none",
                opacity: challengePosting || challengePosted ? 0.75 : 1,
                cursor: challengePosting || challengePosted ? "default" : "pointer",
              }}
            >
              {challengePosting
                ? loc(locale, "Challenge үүсгэж байна…", "챌린지 생성 중…", "Creating challenge…")
                : challengePosted
                  ? loc(locale, "Challenge үүслээ ✓", "챌린지 생성됨 ✓", "Challenge posted ✓")
                  : loc(locale, "Бусдыг challenge хий", "다른 사람에게 도전하기", "Challenge others")}
            </button>
            {challengePosted && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/feed`)}
                style={{ width: "100%", minHeight: 40, background: "none", border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: RADIUS.md, color: whiteAlpha(0.45), fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}
              >
                {loc(locale, "Feed харах →", "피드 보기 →", "View Feed →")}
              </button>
            )}
          </>
        )}
        {!tooFewPunches && !activeChallenge && isGuest && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/login?mode=signup&redirect=${encodeURIComponent(`/${locale}/train`)}`)}
            style={{ width: "100%", minHeight: 38, background: "none", border: `1px solid ${whiteAlpha(0.07)}`, borderRadius: RADIUS.md, color: whiteAlpha(0.3), fontSize: 11, fontWeight: 800, cursor: "pointer" }}
          >
            {loc(locale, "Профайл үүсгэж бусдыг challenge хийгээрэй →", "프로필 생성 후 다른 사람에게 도전 →", "Create profile to challenge others →")}
          </button>
        )}
          </>
        )}
        {challengePostData && !isGuest && (
          <>
            <button
              type="button"
              disabled={challengeResponsePosting || challengeResponsePosted}
              onClick={onPostChallengeResponse}
              style={{
                ...styles.saveButton,
                background: challengeResponsePosted ? "#17664b" : "rgba(167,139,250,0.12)",
                border: challengeResponsePosted ? "none" : "1px solid rgba(167,139,250,0.28)",
                color: challengeResponsePosted ? "#34D399" : "#C084FC",
                boxShadow: "none",
                opacity: challengeResponsePosting || challengeResponsePosted ? 0.75 : 1,
                cursor: challengeResponsePosting || challengeResponsePosted ? "default" : "pointer",
              }}
            >
              {challengeResponsePosting
                ? loc(locale, "Нийтэлж байна…", "게시 중…", "Posting…")
                : challengeResponsePosted
                  ? loc(locale, "Challenge хариу нийтлэгдлээ ✓", "챌린지 응답 게시됨 ✓", "Challenge response posted ✓")
                  : loc(locale, "Challenge үр дүнг нийтлэх", "챌린지 결과 게시하기", "Post Challenge Result")}
            </button>
            {challengeResponsePosted && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/feed`)}
                style={{ width: "100%", minHeight: 40, background: "none", border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: RADIUS.md, color: whiteAlpha(0.45), fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}
              >
                {loc(locale, "Feed харах →", "피드 보기 →", "View Feed →")}
              </button>
            )}
          </>
        )}
        {challengePostData && isGuest && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/login?mode=signup&redirect=${encodeURIComponent(`/${locale}/train`)}`)}
            style={{ ...styles.saveButton, background: "linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.08) 100%)", border: "1px solid rgba(167,139,250,0.35)", color: "#C084FC", boxShadow: "none" }}
          >
            {loc(locale, "Профайл үүсгэж challenge-д хариулаарай →", "프로필 생성 후 챌린지 응답 →", "Create profile to respond to challenge →")}
          </button>
        )}
        <button type="button" style={styles.shareResultButton} onClick={activeChallenge ? onShareChallenge : onShareTraining}>
          {t("share") || "Share"}
        </button>
        {(saved || challengeSaved) && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/fighter-profile`)}
            style={{ width: "100%", minHeight: 40, background: "none", border: `1px solid ${whiteAlpha(0.08)}`, borderRadius: RADIUS.md, color: whiteAlpha(0.35), fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}
          >
            View Fighter Profile →
          </button>
        )}
      </div>
    </div>
  );
}
