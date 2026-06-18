"use client";

import BottomNav from "@/components/BottomNav";
import styles from "@/components/reels/reelStyles";

const COPY = {
  mn: {
    desc: "Эхний видеогоо upload хий. AI техникийг задлан шинжилж, ахицыг чинь rank болгоно.",
    btn: "ЭХНИЙ ВИДЕОГОО UPLOAD ХИЙ",
  },
  ko: {
    desc: "첫 번째 릴을 업로드하세요. AI가 기술을 분석하고 발전을 랭크로 전환합니다.",
    btn: "첫 릴 업로드",
  },
  en: {
    desc: "Drop your first reel. AI breaks down your technique and turns your progress into rank.",
    btn: "UPLOAD YOUR FIRST REEL",
  },
};

/**
 * Full-screen "arena awaits" empty state when no reels exist yet.
 *
 * Props:
 *   router        — Next.js router
 *   user          — current auth user (may be null)
 *   currentLocale — locale string
 */
export default function ReelsEmptyArena({ router, user, currentLocale }) {
  const copy = COPY[currentLocale] || COPY.en;

  return (
    <div style={styles.container}>
      <div style={styles.arenaEmpty}>
        <div style={styles.arenaOrb} />
        <div style={styles.arenaFigure}>
          <div style={styles.arenaFigHead} />
          <div style={styles.arenaFigTorso} />
          <div style={styles.arenaFigGloveL} />
          <div style={styles.arenaFigGloveR} />
        </div>
        <div className="page-enter" style={styles.arenaCopy}>
          <span style={styles.arenaKicker}>YOUR TRAINING FEED</span>
          <h2 style={styles.arenaHeadline}>{`THE ARENA\nAWAITS`}</h2>
          <p style={styles.arenaDesc}>{copy.desc}</p>
          <button
            type="button"
            className="btn-red-glow"
            style={styles.arenaUploadBtn}
            onClick={() => router.push(`/${currentLocale}/upload`)}
          >
            {copy.btn}
          </button>
        </div>
      </div>
      <BottomNav router={router} user={user} currentLocale={currentLocale} />
    </div>
  );
}
