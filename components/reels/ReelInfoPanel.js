"use client";

import { GOLD, goldAlpha } from "@/lib/tokens";
import styles from "@/components/reels/reelStyles";
import ReelCreatorRow from "@/components/reels/ReelCreatorRow";

// Reputation badge content types
const BADGE_CHALLENGE_RESPONSE = "challenge_response";
const BADGE_ACADEMY = "academy";
const BADGE_TRAINING = "training";
const HIGH_SCORE_THRESHOLD = 8.5;

function ReputationBadge({ reel, t }) {
  if (reel.isDemo) return null;

  if (
    reel.contentType === BADGE_CHALLENGE_RESPONSE &&
    typeof reel.sourceSessionScore === "number" &&
    typeof reel.challengeTargetScore === "number" &&
    reel.sourceSessionScore > reel.challengeTargetScore
  ) {
    return (
      <span
        style={{
          display: "inline-block",
          marginBottom: 4,
          padding: "2px 8px",
          borderRadius: 20,
          fontSize: 10,
          fontWeight: 800,
          background: goldAlpha(0.12),
          border: `1px solid ${goldAlpha(0.35)}`,
          color: GOLD,
          letterSpacing: 0.3,
        }}
      >
        ⚔️ {t("repBadgeResponder")}
      </span>
    );
  }

  if (reel.contentType === BADGE_ACADEMY) {
    return (
      <span
        style={{
          display: "inline-block",
          marginBottom: 4,
          padding: "2px 8px",
          borderRadius: 20,
          fontSize: 10,
          fontWeight: 800,
          background: "rgba(251,191,36,0.12)",
          border: "1px solid rgba(251,191,36,0.3)",
          color: "#FCD34D",
          letterSpacing: 0.3,
        }}
      >
        🎓 {t("repBadgeAcademy")}
      </span>
    );
  }

  if (
    reel.contentType === BADGE_TRAINING &&
    typeof reel.sessionScore === "number" &&
    reel.sessionScore >= HIGH_SCORE_THRESHOLD
  ) {
    return (
      <span
        style={{
          display: "inline-block",
          marginBottom: 4,
          padding: "2px 8px",
          borderRadius: 20,
          fontSize: 10,
          fontWeight: 800,
          background: "rgba(248,113,113,0.12)",
          border: "1px solid rgba(248,113,113,0.3)",
          color: "#F87171",
          letterSpacing: 0.3,
        }}
      >
        🌟 {t("repBadgeTopScore")}
      </span>
    );
  }

  return null;
}

/**
 * ReelInfoPanel
 * The bottom-left overlay: creator row, reputation badge, caption,
 * primary CTA buttons (challenge / accept-challenge / learn more),
 * and remix origin banner.
 */
export default function ReelInfoPanel({
  reel,
  stats,
  captionText,
  // creator row props (forwarded to ReelCreatorRow)
  creatorName,
  creatorPhoto,
  creatorInitial,
  creatorStatLine,
  creatorStreakCount,
  gymName,
  hasStory,
  isFollowing,
  followLoading,
  onFollow,
  viewerUid,
  onOpenCreatorProfile,
  // CTA handlers
  onCaptionSheet,
  onChallengeClick,
  onAcceptChallengeClick,
  // translation
  t,
}) {
  const effectiveType = reel.contentType || reel.type || "lifestyle";
  const isChallenge = effectiveType === "training";
  const isFeedChallenge = effectiveType === "challenge";
  const isEducational = effectiveType === "educational";
  const showChallengeCta = isChallenge || reel.challengeEnabled;
  const showAcceptChallengeCta = isFeedChallenge;
  const showLearnCta = isEducational && !reel.challengeEnabled;

  return (
    <div style={styles.info}>
      <ReelCreatorRow
        reel={reel}
        creatorName={creatorName}
        creatorPhoto={creatorPhoto}
        creatorInitial={creatorInitial}
        creatorStatLine={creatorStatLine}
        creatorStreakCount={creatorStreakCount}
        gymName={gymName}
        hasStory={hasStory}
        isFollowing={isFollowing}
        followLoading={followLoading}
        onFollow={onFollow}
        viewerUid={viewerUid}
        onOpenCreatorProfile={onOpenCreatorProfile}
        t={t}
      />

      <ReputationBadge reel={reel} t={t} />

      {captionText && (
        <button
          type="button"
          style={styles.descriptionLine}
          onClick={() => onCaptionSheet(reel.id)}
          aria-label={t("captionExpand")}
        >
          {captionText}
        </button>
      )}
      {captionText && captionText.length > 60 && (
        <span style={styles.captionMoreHint} onClick={() => onCaptionSheet(reel.id)}>
          {t("captionMore") || "more"}
        </span>
      )}

      {/* Primary CTA buttons */}
      {!reel.isDemo && (showChallengeCta || showAcceptChallengeCta || showLearnCta) && (
        <div style={styles.trainButtonRow}>
          {showChallengeCta && (
            <button type="button" style={styles.tryThisButton} onClick={onChallengeClick}>
              {t("reelChallenge")}
            </button>
          )}
          {showAcceptChallengeCta && (
            <button
              type="button"
              style={{
                ...styles.tryThisButton,
                background: "rgba(167,139,250,0.18)",
                border: "1px solid rgba(167,139,250,0.4)",
                color: "#C084FC",
              }}
              onClick={onAcceptChallengeClick}
            >
              {t("acceptChallenge")}
            </button>
          )}
          {showLearnCta && (
            <button
              type="button"
              style={styles.learnButton}
              onClick={() => onCaptionSheet(reel.id)}
            >
              {t("reelLearnMore")}
            </button>
          )}
        </div>
      )}

      {/* Remix origin banner */}
      {!reel.isDemo && reel.remixOf && (
        <div style={styles.remixBanner}>
          🔀 {t("remixOf").replace("{username}", reel.remixOfCreatorName || "creator")}
        </div>
      )}
    </div>
  );
}
