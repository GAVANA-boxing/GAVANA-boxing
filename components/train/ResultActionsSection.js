"use client";
import { GOLD, RED, RADIUS, whiteAlpha, goldAlpha, redAlpha } from "@/lib/tokens";
import styles from "@/components/train/trainStyles";

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
  return (
    <div style={{ padding: "12px 20px 16px", flexShrink: 0, borderTop: `1px solid ${whiteAlpha(0.06)}` }}>
      {error && (
        <div style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 10, background: redAlpha(0.12), border: `1px solid ${redAlpha(0.28)}`, color: "#fca5a5", fontSize: 13, fontWeight: 700 }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        <button type="button"
          style={{ ...styles.tryAgainButton, ...(isLowConfidence ? { background: "linear-gradient(135deg,#FB923C,#F59E0B)", color: "#000", fontWeight: 900 } : {}) }}
          onClick={onTryAgain}>
          {isLowConfidence ? t("confidenceTryAgain") : activeChallenge ? t("challengeTryAgain") : t("trainTryAgain")}
        </button>
        {!activeChallenge && !saved && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
            {["Bag", "Shadow", "Mitts", "Sparring", "Conditioning"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSessionTag((prev) => prev === tag ? null : tag)}
                style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, cursor: "pointer",
                  background: sessionTag === tag ? goldAlpha(0.2) : "rgba(255,255,255,0.05)",
                  border: `1px solid ${sessionTag === tag ? goldAlpha(0.5) : "rgba(255,255,255,0.1)"}`,
                  color: sessionTag === tag ? GOLD : "rgba(255,255,255,0.4)",
                  transition: "all 0.15s",
                }}
              >{tag}</button>
            ))}
          </div>
        )}
        {!tooFewPunches && !activeChallenge && !isGuest && (
          <button
            type="button"
            style={{ ...styles.saveButton, ...(saved ? styles.saveButtonDone : {}), ...(isLowConfidence && !saved ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)", fontSize: 11 } : {}), opacity: saving || saved ? 0.65 : 1, cursor: saving || saved ? "default" : "pointer" }}
            onClick={() => {
              const { motionHistory: _mh, punchEvents: _pe, coaching, ...poseMetricsForSave } = poseMetrics || {};
              const weaknesses = (coaching || []).filter(c => c.type === "improve").map(c => c.message).slice(0, 2);
              if (weaknesses.length) poseMetricsForSave.weaknesses = weaknesses;
              onSave({ movementEvents: events, tag: sessionTag, poseMetrics: poseMetrics ? poseMetricsForSave : null });
            }}
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
            style={{ ...styles.saveButton, background: "linear-gradient(135deg, #F5C451 0%, #FF3B30 100%)", color: "#000", fontWeight: 900 }}
            onClick={() => router.push(`/${locale}/login?mode=signup&redirect=${encodeURIComponent(`/${locale}/train`)}`)}
          >
            {locale === "mn" ? "Профайл үүсгэж streak болон дэвшлийг хадгал →" : locale === "ko" ? "프로필 생성 — 스트릭과 진행 저장 →" : "Create profile to save streak and progress →"}
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
                ? (locale === "mn" ? "Нийтэлж байна…" : locale === "ko" ? "공유 중…" : "Sharing…")
                : feedShared
                  ? (locale === "mn" ? "Feed-д нийтлэгдлээ ✓" : locale === "ko" ? "피드에 공유됨 ✓" : "Shared to Feed ✓")
                  : academyLesson
                    ? (locale === "mn" ? "Academy дэвшлийг хуваалцах" : locale === "ko" ? "아카데미 진행 상황 공유하기" : "Share Academy Progress")
                    : recordedBlob
                      ? (locale === "mn" ? "Видео Feed-д хуваалцах" : locale === "ko" ? "비디오 피드에 공유하기" : "Share Video to Feed")
                      : (locale === "mn" ? "Feed-д хуваалцах" : locale === "ko" ? "피드에 공유하기" : "Share to Feed")}
            </button>
            {feedShared && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/feed`)}
                style={{ width: "100%", minHeight: 40, background: "none", border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: RADIUS.md, color: whiteAlpha(0.45), fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}
              >
                {locale === "mn" ? "Feed харах →" : locale === "ko" ? "피드 보기 →" : "View Feed →"}
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
              ? (locale === "mn" ? "Профайл үүсгэж academy дэвшлийг хуваалцаарай →" : locale === "ko" ? "프로필 생성 후 아카데미 진행 상황 공유 →" : "Create profile to share academy progress →")
              : (locale === "mn" ? "Профайл үүсгэж өөрийн дэвшлийг хуваалцаарай →" : locale === "ko" ? "프로필 생성 후 진행 상황 공유 →" : "Create profile to share your progress →")}
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
                ? (locale === "mn" ? "Challenge үүсгэж байна…" : locale === "ko" ? "챌린지 생성 중…" : "Creating challenge…")
                : challengePosted
                  ? (locale === "mn" ? "Challenge үүслээ ✓" : locale === "ko" ? "챌린지 생성됨 ✓" : "Challenge posted ✓")
                  : (locale === "mn" ? "Бусдыг challenge хий" : locale === "ko" ? "다른 사람에게 도전하기" : "Challenge others")}
            </button>
            {challengePosted && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/feed`)}
                style={{ width: "100%", minHeight: 40, background: "none", border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: RADIUS.md, color: whiteAlpha(0.45), fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}
              >
                {locale === "mn" ? "Feed харах →" : locale === "ko" ? "피드 보기 →" : "View Feed →"}
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
            {locale === "mn" ? "Профайл үүсгэж бусдыг challenge хийгээрэй →" : locale === "ko" ? "프로필 생성 후 다른 사람에게 도전 →" : "Create profile to challenge others →"}
          </button>
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
                ? (locale === "mn" ? "Нийтэлж байна…" : locale === "ko" ? "게시 중…" : "Posting…")
                : challengeResponsePosted
                  ? (locale === "mn" ? "Challenge хариу нийтлэгдлээ ✓" : locale === "ko" ? "챌린지 응답 게시됨 ✓" : "Challenge response posted ✓")
                  : (locale === "mn" ? "Challenge үр дүнг нийтлэх" : locale === "ko" ? "챌린지 결과 게시하기" : "Post Challenge Result")}
            </button>
            {challengeResponsePosted && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/feed`)}
                style={{ width: "100%", minHeight: 40, background: "none", border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: RADIUS.md, color: whiteAlpha(0.45), fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}
              >
                {locale === "mn" ? "Feed харах →" : locale === "ko" ? "피드 보기 →" : "View Feed →"}
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
            {locale === "mn" ? "Профайл үүсгэж challenge-д хариулаарай →" : locale === "ko" ? "프로필 생성 후 챌린지 응답 →" : "Create profile to respond to challenge →"}
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
