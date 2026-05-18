"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { translate } from "@/lib/i18n";
import { RED, GOLD , redAlpha} from "@/lib/tokens";

function getTypeLabel(type, locale) {
  const labels = {
    training_clip: { mn: "🥊 Дасгал", ko: "🥊 훈련 클립", en: "🥊 Training Clip" },
    gym_mood:      { mn: "🏋️ Gym", ko: "🏋️ 체육관", en: "🏋️ Gym Mood" },
    mitt_work:     { mn: "🎯 Митт ажил", ko: "🎯 미트 워크", en: "🎯 Mitt Work" },
    progress_update: { mn: "📈 Ахиц", ko: "📈 진척도", en: "📈 Progress" },
    challenge_result: { mn: "🏆 Шийдэл", ko: "🏆 챌린지", en: "🏆 Challenge" },
    motivational: { mn: "🔥 Урам зориг", ko: "🔥 동기부여", en: "🔥 Motivational" },
  };
  const l = labels[type];
  if (!l) return type;
  return l[locale] || l.en;
}

function ProgressCard({ data = {} }) {
  return (
    <div style={pc.wrap}>
      <p style={pc.type}>{data.progressType || "Progress Update"}</p>
      {data.value && <p style={pc.value}>{data.value}</p>}
      {data.improvement && <p style={pc.delta}>+{data.improvement}</p>}
      {data.caption && <p style={pc.caption}>{data.caption}</p>}
    </div>
  );
}

const pc = {
  wrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 32 },
  type: { margin: 0, fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 2 },
  value: { margin: 0, fontSize: 64, fontWeight: 1000, color: GOLD, lineHeight: 1 },
  delta: { margin: 0, fontSize: 22, fontWeight: 900, color: "#34D399" },
  caption: { margin: 0, fontSize: 15, color: "rgba(255,255,255,0.7)", textAlign: "center", maxWidth: 280, lineHeight: 1.4 },
};

const DURATION = 7000;

export default function StoryViewer({ stories, onClose, locale, currentUser }) {
  const t = (key) => translate(locale, key);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [replied, setReplied] = useState(false);
  const timerRef = useRef(null);
  const story = stories[idx];

  useEffect(() => {
    if (!currentUser?.uid || !story?.id) return;
    setUserReaction(null);
    getDocs(query(
      collection(db, "story_reactions"),
      where("storyId", "==", story.id),
      where("userId", "==", currentUser.uid)
    )).then(snap => {
      if (!snap.empty) setUserReaction(snap.docs[0].data().reaction);
    }).catch(() => {});
  }, [story?.id, currentUser?.uid]);

  useEffect(() => {
    setProgress(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + (100 / (DURATION / 100));
        if (next >= 100) {
          clearInterval(timerRef.current);
          setTimeout(() => {
            if (idx < stories.length - 1) setIdx(i => i + 1);
            else onClose();
          }, 80);
          return 100;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [idx, stories.length]);

  const react = async (reaction) => {
    if (!currentUser?.uid) return;
    setUserReaction(reaction);
    try {
      await addDoc(collection(db, "story_reactions"), {
        storyId: story.id, userId: currentUser.uid, reaction, createdAt: serverTimestamp(),
      });
    } catch { /* silent */ }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !currentUser?.uid) return;
    setSending(true);
    try {
      await addDoc(collection(db, "story_replies"), {
        storyId: story.id, fromUserId: currentUser.uid,
        text: replyText.trim(), createdAt: serverTimestamp(),
      });
      setReplied(true); setReplyText(""); setShowReply(false);
    } catch { /* silent */ } finally { setSending(false); }
  };

  if (!story) { onClose(); return null; }

  const isProgress = story.type === "progress_update" && !story.mediaUrl;
  const isVideo = story.mediaType === "video" || (story.mediaUrl && story.mediaUrl.match(/\.(mp4|mov|webm)/i));

  return (
    <div style={s.overlay}>
      <style>{`
        @keyframes storyFadeIn {
          from { opacity: 0; transform: scale(1.018); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes storySlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Tap zones */}
      <div style={s.tapL} onClick={() => !showReply && idx > 0 && setIdx(i => i - 1)} />
      <div style={s.tapR} onClick={() => !showReply && (idx < stories.length - 1 ? setIdx(i => i + 1) : onClose())} />

      {/* Background */}
      {story.mediaUrl ? (
        isVideo
          ? <video key={`v-${idx}`} src={story.mediaUrl} style={{ ...s.media, animation: "storyFadeIn 380ms ease forwards" }} autoPlay muted playsInline loop />
          : <img key={`i-${idx}`} src={story.mediaUrl} style={{ ...s.media, animation: "storyFadeIn 380ms ease forwards" }} alt="" />
      ) : isProgress
        ? <div key={`p-${idx}`} style={{ ...s.progressBg, animation: "storyFadeIn 380ms ease forwards" }}><ProgressCard data={story.progressData || {}} /></div>
        : <div key={`d-${idx}`} style={{ ...s.defaultBg, animation: "storyFadeIn 380ms ease forwards" }} />
      }

      {/* Gradients */}
      <div style={s.topGrad} />
      <div style={s.bottomGrad} />

      {/* Top bar */}
      <div style={s.topBar}>
        <div style={s.segsRow}>
          {stories.map((_, i) => (
            <div key={i} style={s.seg}>
              <div style={{ ...s.segFill, width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%" }} />
            </div>
          ))}
        </div>
        <div style={s.metaRow}>
          <div style={s.userRow}>
            {story.photoURL && <img src={story.photoURL} style={s.userAvatar} alt="" />}
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={s.userName}>{story.displayName || story.username || "Boxer"}</span>
              {story.type && (
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>
                  {getTypeLabel(story.type, locale)}
                </span>
              )}
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {/* Caption */}
      {story.caption && !isProgress && (
        <div key={`cap-${idx}`} style={{ ...s.captionWrap, animation: "storySlideUp 400ms ease forwards" }}>
          <p style={s.captionText}>{story.caption}</p>
        </div>
      )}

      {/* Bottom actions */}
      <div style={s.bottom}>
        {!showReply ? (
          <div style={s.actRow}>
            <div style={s.reactsRow}>
              <button
                style={{ ...s.reactBtn, ...(userReaction === "heart" ? s.reactActive : {}) }}
                onClick={() => react("heart")}
              >❤️</button>
              <button
                style={{ ...s.reactBtn, ...(userReaction === "fire" ? s.reactActive : {}) }}
                onClick={() => react("fire")}
              >🔥</button>
            </div>
            <button style={s.replyBtn} onClick={() => setShowReply(true)}>
              {replied ? t("storyReplySent") : t("storyReply")}
            </button>
          </div>
        ) : (
          <div style={s.replyRow}>
            <input
              autoFocus
              style={s.replyInput}
              placeholder={t("storyReply")}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendReply(); if (e.key === "Escape") setShowReply(false); }}
            />
            <button style={s.sendBtn} onClick={sendReply} disabled={sending}>
              {sending ? "…" : t("storySend")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 500,
    background: "#000",
    display: "flex", flexDirection: "column",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  tapL: { position: "absolute", left: 0, top: 0, width: "35%", height: "100%", zIndex: 10, cursor: "pointer" },
  tapR: { position: "absolute", right: 0, top: 0, width: "65%", height: "100%", zIndex: 10, cursor: "pointer" },
  media: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  progressBg: {
    position: "absolute", inset: 0,
    background: `radial-gradient(ellipse at 50% 35%, ${redAlpha(0.28)}, transparent 65%), linear-gradient(180deg, #0e0808 0%, #070707 100%)`,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  defaultBg: {
    position: "absolute", inset: 0,
    background: "linear-gradient(160deg, #0e0808 0%, #080808 50%, #050505 100%)",
  },
  // Stronger top gradient for better readability
  topGrad: {
    position: "absolute", top: 0, left: 0, right: 0, height: 200,
    background: "linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
    zIndex: 5, pointerEvents: "none",
  },
  bottomGrad: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 240,
    background: "linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
    zIndex: 5, pointerEvents: "none",
  },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    padding: "calc(env(safe-area-inset-top) + 12px) 14px 0",
    display: "flex", flexDirection: "column", gap: 10,
  },
  segsRow: { display: "flex", gap: 2.5 },
  seg: {
    flex: 1, height: 2, borderRadius: 1,
    background: "rgba(255,255,255,0.22)", overflow: "hidden",
  },
  segFill: {
    height: "100%",
    background: "linear-gradient(90deg, rgba(255,255,255,0.85), #fff)",
    borderRadius: 1,
    transition: "width 100ms linear",
    boxShadow: "0 0 6px rgba(255,255,255,0.3)",
  },
  metaRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "4px 0",
  },
  userRow: { display: "flex", alignItems: "center", gap: 9 },
  userAvatar: {
    width: 32, height: 32, borderRadius: "50%", objectFit: "cover",
    border: "1.5px solid rgba(255,255,255,0.6)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
  },
  userName: {
    fontSize: 13, fontWeight: 800, color: "#fff",
    textShadow: "0 1px 6px rgba(0,0,0,0.9)",
    letterSpacing: 0.1,
  },
  closeBtn: {
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(8px)",
    border: "none",
    color: "rgba(255,255,255,0.8)",
    width: 32, height: 32,
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  captionWrap: {
    position: "absolute", bottom: 118, left: 18, right: 80,
    zIndex: 20, pointerEvents: "none",
  },
  captionText: {
    margin: 0, fontSize: 15, fontWeight: 600, color: "#fff",
    textShadow: "0 2px 12px rgba(0,0,0,0.95)",
    lineHeight: 1.45,
  },
  bottom: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
    padding: "16px 16px calc(28px + env(safe-area-inset-bottom))",
  },
  actRow: { display: "flex", alignItems: "center", gap: 10 },
  reactsRow: { display: "flex", gap: 8 },
  reactBtn: {
    width: 44, height: 44, borderRadius: "50%",
    border: "1.5px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(10px)",
    fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "transform 150ms ease",
  },
  reactActive: {
    border: "1.5px solid rgba(255,255,255,0.6)",
    background: "rgba(255,255,255,0.12)",
    transform: "scale(1.12)",
  },
  replyBtn: {
    flex: 1, height: 44,
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 22,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
    color: "rgba(255,255,255,0.5)",
    fontSize: 13, fontWeight: 600,
    cursor: "pointer", textAlign: "left", paddingLeft: 18,
  },
  replyRow: { display: "flex", gap: 8, alignItems: "center" },
  replyInput: {
    flex: 1, height: 44,
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 22,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(10px)",
    color: "#fff", fontSize: 14, paddingLeft: 18, outline: "none", fontFamily: "inherit",
  },
  sendBtn: {
    height: 44, padding: "0 18px", border: "none", borderRadius: 22,
    background: RED, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
    boxShadow: `0 4px 16px ${redAlpha(0.4)}`,
  },
};
