"use client";
import { useState, useEffect, useRef } from "react";
import { RED } from "@/lib/tokens";
import {
  IcoPlay, IcoVolume, IcoHeart, IcoComment, IcoShare, IcoBookmark, IcoZap,
} from "@/components/reels/DashboardIcons";
import d from "@/components/reels/reelsDashboardStyles";

export default function DesktopReelCard({
  reel, videoRefs, soundEnabled, onSoundChange, isLiked, isSaved,
  videoProgress, creatorName, creatorPhoto, creatorInitial,
  captionText, stats, currentLocale, router,
  onLike, onOpenComments, onShare, onSave, onGetFeedback,
}) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [heartBurst, setHeartBurst] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const heartTimerRef = useRef(null);
  const clickTimerRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRefs.current[reel.id] = videoRef.current;
  }, [reel.id, videoRefs]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (visible && playing) {
      el.muted = !soundEnabled;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [visible, playing, soundEnabled]);

  const handleMouseEnter = () => setHovered(true);
  const handleMouseLeave = () => setHovered(false);

  const handleVideoClick = (e) => {
    e.stopPropagation();
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => setPlaying((p) => !p), 220);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    clearTimeout(clickTimerRef.current);
    setHeartBurst(true);
    onLike(reel.id);
    clearTimeout(heartTimerRef.current);
    heartTimerRef.current = setTimeout(() => setHeartBurst(false), 800);
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
    onSoundChange(!soundEnabled);
  };

  const progress = videoProgress[reel.id] || 0;

  return (
    <div
      ref={containerRef}
      style={d.reelCard}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={d.reelRow}>
        <div
          style={d.reelVideoWrap}
          onClick={handleVideoClick}
          onDoubleClick={handleDoubleClick}
        >
          <video ref={videoRef} src={reel.videoUrl} poster={reel.thumbnailUrl || undefined} loop muted playsInline style={d.reelVideo} />
          {!playing && (
            <div style={d.videoOverlay}>
              <div style={d.playCircle}><IcoPlay /></div>
            </div>
          )}
          {heartBurst && (
            <div style={d.heartBurstWrap}>
              <svg className="heart-burst" width="76" height="76" viewBox="0 0 24 24" fill="#f87171" style={{ filter: "drop-shadow(0 0 18px rgba(248,113,113,0.9))" }}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
          )}
          {hovered && (
            <button style={d.muteBtn} onClick={handleToggleMute} aria-label={soundEnabled ? "Дуу унтраах" : "Дуу асаах"}>
              <IcoVolume muted={!soundEnabled} />
            </button>
          )}
          {hovered && progress > 0 && (
            <div style={d.progressBarWrap}>
              <div style={{ ...d.progressFill, width: `${progress * 100}%` }} />
            </div>
          )}
        </div>

        {/* Round SVG action buttons */}
        <div style={d.reelActions}>
          <button
            className="reel-action-btn"
            style={{ ...d.roundBtn, ...(isLiked ? d.roundBtnLiked : {}) }}
            onClick={() => onLike(reel.id)}
          >
            <IcoHeart filled={isLiked} />
            {reel.likes > 0 && <span style={d.roundBtnCount}>{reel.likes}</span>}
          </button>

          <button className="reel-action-btn" style={d.roundBtn} onClick={() => onOpenComments(reel.id)}>
            <IcoComment />
            {reel.commentsCount > 0 && <span style={d.roundBtnCount}>{reel.commentsCount}</span>}
          </button>

          <button className="reel-action-btn" style={d.roundBtn} onClick={() => onShare(reel.id)}>
            <IcoShare />
          </button>

          <button
            className="reel-action-btn"
            style={{ ...d.roundBtn, ...(isSaved ? d.roundBtnSaved : {}) }}
            onClick={() => onSave(reel.id)}
          >
            <IcoBookmark filled={isSaved} />
          </button>

          <button className="reel-action-btn reel-ai-btn" style={d.aiRoundBtn} onClick={() => onGetFeedback(reel)}>
            <IcoZap />
            <span style={{ ...d.roundBtnCount, color: RED, fontWeight: 900 }}>AI</span>
          </button>
        </div>
      </div>

      {/* Creator info + caption below video */}
      <div style={d.reelInfo}>
        <button style={d.creatorBtn} onClick={() => router.push(`/${currentLocale}/profile/${reel.userId}`)}>
          <div style={d.creatorAva}>
            {creatorPhoto
              ? <img src={creatorPhoto} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : <span style={{ fontSize: 11, fontWeight: 900 }}>{creatorInitial}</span>
            }
          </div>
          <div>
            <div style={d.creatorName}>{creatorName?.toUpperCase()}</div>
            {stats?.xp && <div style={d.creatorStat}>{stats.xp.toLocaleString()} XP</div>}
          </div>
        </button>
        {captionText && (
          <p style={d.caption}>
            {captionText.length > 140 ? captionText.slice(0, 140) + "…" : captionText}
          </p>
        )}
      </div>
    </div>
  );
}
