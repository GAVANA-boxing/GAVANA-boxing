"use client";

import BottomNav from "@/components/BottomNav";
import styles from "@/components/reels/reelStyles";

const COPY = {
  mn: {
    desc: "Эхний видеогоо оруул. AI техникийг чинь задлан тайлбарлана.",
    btn: "ЭХНИЙ ВИДЕОГОО ОРУУЛАХ",
    watch: "Бусдын бичлэг үзэх →",
  },
  ko: {
    desc: "첫 번째 영상을 올려 보세요. AI가 기술을 분석해 줍니다.",
    btn: "첫 릴 업로드",
    watch: "커뮤니티 릴스 보기 →",
  },
  en: {
    desc: "Upload your first video. AI breaks down your technique.",
    btn: "UPLOAD YOUR FIRST REEL",
    watch: "Watch community reels →",
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
          <button
            type="button"
            style={{
              marginTop: 10,
              background: "none",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding: "10px 24px",
              color: "rgba(255,255,255,0.45)",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
            onClick={() => router.push(`/${currentLocale}/discover`)}
          >
            {copy.watch}
          </button>
        </div>
      </div>
      <BottomNav router={router} user={user} currentLocale={currentLocale} />
    </div>
  );
}
