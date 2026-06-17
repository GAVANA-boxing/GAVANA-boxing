"use client";

import styles from "@/components/reels/reelStyles";

const COPY = {
  mn: {
    label: "FOLLOWING",
    title: "Feed хоосон байна",
    body: "Тулаанчдыг дага — тэдний видео энд гарч ирнэ.",
    btn: "FOR YOU руу очих",
  },
  ko: {
    label: "FOLLOWING",
    title: "피드가 비어 있습니다",
    body: "파이터를 팔로우하면 그들의 릴이 여기에 표시됩니다.",
    btn: "추천 피드 보기",
  },
  en: {
    label: "FOLLOWING",
    title: "YOUR FEED IS QUIET",
    body: "Follow fighters — their reels will appear here.",
    btn: "BROWSE FOR YOU",
  },
};

/**
 * Empty state shown inside the feed scroller when the Following feed has no reels.
 *
 * Props:
 *   currentLocale — locale string
 *   setFeedMode   — state setter to switch back to "forYou"
 */
export default function FollowingEmptyState({ currentLocale, setFeedMode }) {
  const copy = COPY[currentLocale] || COPY.en;

  return (
    <div style={{ ...styles.videoContainer, ...styles.followingEmpty }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          marginBottom: 4,
        }}
      >
        {copy.label}
      </div>
      <div style={styles.followingEmptyTitle}>{copy.title}</div>
      <div style={styles.followingEmptyText}>{copy.body}</div>
      <button
        type="button"
        onClick={() => setFeedMode("forYou")}
        style={styles.uploadBtn}
      >
        {copy.btn}
      </button>
    </div>
  );
}
