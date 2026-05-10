"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { translate } from "@/lib/i18n";

const TYPE_LABELS = {
  training_clip: "🥊 Training Clip",
  gym_mood: "🏋️ Gym Mood",
  mitt_work: "🎯 Mitt Work",
  progress_update: "📈 Progress",
  challenge_result: "🏆 Challenge",
  motivational: "🔥 Motivational",
};

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
  value: { margin: 0, fontSize: 64, fontWeight: 1000, color: "#D4AF37", lineHeight: 1 },
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
      {/* Tap zones */}
      <div style={s.tapL} onClick={() => !showReply && idx > 0 && setIdx(i => i - 1)} />
      <div style={s.tapR} onClick={() => !showReply && (idx < stories.length - 1 ? setIdx(i => i + 1) : onClose())} />

      {/* Background */}
      {story.mediaUrl ? (
        isVideo
          ? <video src={story.mediaUrl} style={s.media} autoPlay muted playsInline loop />
          : <img src={story.mediaUrl} style={s.media} alt="" />
      ) : isProgress
        ? <div style={s.progressBg}><ProgressCard data={story.progressData || {}} /></div>
        : <div style={s.defaultBg} />
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
            <span style={s.userName}>{story.displayName || story.username || "Boxer"}</span>
            {TYPE_LABELS[story.type] && <span style={s.typeBadge}>{TYPE_LABELS[story.type]}</span>}
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Caption */}
      {story.caption && !isProgress && (
        <div style={s.captionWrap}>
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
  overlay: { position: "fixed", inset: 0, zIndex: 500, background: "#000", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" },
  tapL: { position: "absolute", left: 0, top: 0, width: "35%", height: "100%", zIndex: 10, cursor: "pointer" },
  tapR: { position: "absolute", right: 0, top: 0, width: "65%", height: "100%", zIndex: 10, cursor: "pointer" },
  media: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  progressBg: { position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, rgba(193,18,31,0.22), transparent 58%), linear-gradient(180deg, #0e0808, #0a0a0a)", display: "flex", alignItems: "center", justifyContent: "center" },
  defaultBg: { position: "absolute", inset: 0, background: "linear-gradient(135deg, #0e0808, #0a0a0a)" },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 170, background: "linear-gradient(180deg, rgba(0,0,0,0.78), transparent)", zIndex: 5, pointerEvents: "none" },
  bottomGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(0deg, rgba(0,0,0,0.85), transparent)", zIndex: 5, pointerEvents: "none" },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, padding: "calc(env(safe-area-inset-top) + 10px) 12px 0", display: "flex", flexDirection: "column", gap: 8 },
  segsRow: { display: "flex", gap: 3 },
  seg: { flex: 1, height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.3)", overflow: "hidden" },
  segFill: { height: "100%", background: "#fff", borderRadius: 2, transition: "width 100ms linear" },
  metaRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" },
  userRow: { display: "flex", alignItems: "center", gap: 8 },
  userAvatar: { width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,255,255,0.5)" },
  userName: { fontSize: 13, fontWeight: 800, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.8)" },
  typeBadge: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)" },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", padding: "4px 8px", opacity: 0.8 },
  captionWrap: { position: "absolute", bottom: 110, left: 16, right: 16, zIndex: 20, pointerEvents: "none" },
  captionText: { margin: 0, fontSize: 15, fontWeight: 600, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.9)", lineHeight: 1.4 },
  bottom: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, padding: "16px 16px calc(24px + env(safe-area-inset-bottom))" },
  actRow: { display: "flex", alignItems: "center", gap: 10 },
  reactsRow: { display: "flex", gap: 8 },
  reactBtn: { width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  reactActive: { border: "1.5px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.15)", transform: "scale(1.15)" },
  replyBtn: { flex: 1, height: 44, border: "1.5px solid rgba(255,255,255,0.22)", borderRadius: 22, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", paddingLeft: 16 },
  replyRow: { display: "flex", gap: 8, alignItems: "center" },
  replyInput: { flex: 1, height: 44, border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 22, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 14, paddingLeft: 16, outline: "none", fontFamily: "inherit" },
  sendBtn: { height: 44, padding: "0 16px", border: "none", borderRadius: 22, background: "#C1121F", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" },
};
