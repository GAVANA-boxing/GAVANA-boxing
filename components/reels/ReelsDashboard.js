"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import { getCreatorName, getCreatorPhoto, cleanCaption } from "@/lib/reelHelpers";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcoHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcoPlay = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IcoBrain = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66Z"/>
  </svg>
);
const IcoTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);
const IcoTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IcoSwords = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" y1="11" x2="9" y2="15"/>
  </svg>
);
const IcoMessage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoBars = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IcoBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const IcoUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoFlash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcoHeart = ({ filled }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill={filled ? "#f87171" : "none"} stroke={filled ? "#f87171" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcoComment = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoShare = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const IcoBookmark = ({ filled }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill={filled ? GOLD : "none"} stroke={filled ? GOLD : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
);
const IcoZap = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IcoVolume = ({ muted }) => muted ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
const IcoSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

// ─── Fallback sparring data (shown when Firestore is empty) ───────────────────
const FALLBACK_SPARRING = [
  { id: "f1", fromName: "Бат-Эрдэнэ", weightClass: "75кг", gym: "Gavana Gym", time: "Өнөөдөр 19:00" },
  { id: "f2", fromName: "Анхбаяр", weightClass: "69кг", gym: "Khan Boxing", time: "Маргааш 10:00" },
  { id: "f3", fromName: "Дэлгэрмаа", weightClass: "60кг", gym: "Эрдэнэт Клуб", time: "Өнөөдөр 21:00" },
];

const GYMS = [
  { id: "g1", name: "GAVANA GYM", city: "Улаанбаатар", members: 142, accent: RED, bg: "linear-gradient(160deg,#3d0007 0%,#150002 100%)" },
  { id: "g2", name: "KHAN BOXING", city: "Дархан", members: 68, accent: "#3B82F6", bg: "linear-gradient(160deg,#0a1e3d 0%,#030a18 100%)" },
  { id: "g3", name: "ЭРДЭНЭТ КЛУБ", city: "Эрдэнэт хот", members: 34, accent: "#10B981", bg: "linear-gradient(160deg,#00200f 0%,#000d06 100%)" },
];

const COACHES = [
  { id: "c1", name: "ОЮУНАА БАГШ", sub: "Чемпион • 12 жил", rating: "5.0", accent: GOLD, bg: "linear-gradient(160deg,#2d1e00 0%,#100b00 100%)" },
  { id: "c2", name: "БОЛД ТРЕНЕР", sub: "ОХУ-ын экс-про", rating: "4.9", accent: "#A855F7", bg: "linear-gradient(160deg,#1e0833 0%,#0a0315 100%)" },
  { id: "c3", name: "МӨНХБАТ", sub: "Контр техник", rating: "4.8", accent: "#3B82F6", bg: "linear-gradient(160deg,#0a1e3d 0%,#030a18 100%)" },
];

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
function Sidebar({ router, user, profilePhotoUrl, currentLocale }) {
  const NAV = [
    { Icon: IcoHome,     label: "Нүүр",            path: "" },
    { Icon: IcoPlay,     label: "Рилс",             path: "reels", active: true },
    { Icon: IcoBrain,    label: "AI Коач",          path: "train" },
    { Icon: IcoTrophy,   label: "Чансаа",           path: "rank" },
    { Icon: IcoBars,     label: "Дэлхийн рейтинг",  path: "leaderboard" },
    { Icon: IcoTarget,   label: "Тренер",           path: "coach" },
    { Icon: IcoSwords,   label: "Спарринг",         path: "sparring" },
    { Icon: IcoBuilding, label: "Заал",             path: "gyms" },
    { Icon: IcoUsers,    label: "Тулаанчид",        path: "fighters" },
    { Icon: IcoFlash,    label: "Чэлэнж",           path: "challenges" },
    { Icon: IcoMessage,  label: "Мессеж",           path: "inbox" },
  ];

  return (
    <aside style={d.sidebar}>
      <div style={d.sidebarLogo}>
        <span style={d.logoGavana}>GAVANA</span>
        <span style={d.logoBoxing}>BOXING</span>
      </div>

      <nav style={d.sidebarNav}>
        {NAV.map(({ Icon, label, path, active }) => (
          <button
            key={path}
            className="dashboard-nav-btn"
            style={{ ...d.navBtn, ...(active ? d.navBtnActive : {}) }}
            onClick={() => router.push(`/${currentLocale}/${path}`)}
          >
            <span style={{ ...d.navIcon, color: active ? "#fff" : "rgba(255,255,255,0.38)" }}>
              <Icon />
            </span>
            <span style={d.navLabel}>{label}</span>
            <span style={d.navChevron}>›</span>
            {active && <div style={d.navActiveBar} />}
          </button>
        ))}
      </nav>

      <button style={d.createBtn} onClick={() => router.push(`/${currentLocale}/upload`)}>
        <span style={{ fontSize: 16, fontWeight: 300, lineHeight: 1 }}>+</span> ҮҮСГЭХ
      </button>

      {user && (
        <button
          style={{ ...d.sidebarProfile, position: "relative", zIndex: 2 }}
          onClick={() => router.push(`/${currentLocale}/profile/${user.uid}`)}
        >
          <div style={d.sidebarProfileAva}>
            {(profilePhotoUrl || user.photoURL)
              ? <img src={profilePhotoUrl || user.photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : <span style={{ fontSize: 13, fontWeight: 900 }}>{(user.displayName || user.email || "U").charAt(0).toUpperCase()}</span>
            }
          </div>
          <div style={d.sidebarProfileInfo}>
            <div style={d.sidebarProfileName}>{user.displayName || user.email?.split("@")[0] || "Та"}</div>
            <div style={d.sidebarProfileSub}>GAVANA BOXING</div>
          </div>
        </button>
      )}
    </aside>
  );
}

// ─── Quick Post Bar ───────────────────────────────────────────────────────────
function QuickPostBar({ user, profilePhotoUrl, router, currentLocale }) {
  const photo = profilePhotoUrl || user?.photoURL;
  return (
    <div style={d.quickPost}>
      <div style={d.quickAva}>
        {photo
          ? <img src={photo} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          : <span style={{ fontSize: 12, fontWeight: 900 }}>{(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}</span>
        }
      </div>
      <button style={d.quickInput} onClick={() => router.push(`/${currentLocale}/upload`)}>
        ӨНӨӨДРИЙН БЭЛТГЭЛ ЯМАР БАЙВ?
      </button>
      <button style={d.quickVideoBtn} onClick={() => router.push(`/${currentLocale}/upload`)}>
        <IcoPlay /> ВИДЕО
      </button>
    </div>
  );
}

// ─── Desktop Reel Card ────────────────────────────────────────────────────────
function DesktopReelCard({
  reel, videoRefs, soundEnabled, isLiked, isSaved,
  videoProgress, creatorName, creatorPhoto, creatorInitial,
  captionText, stats, currentLocale, router,
  onLike, onOpenComments, onShare, onSave, onGetFeedback,
}) {
  const [hovered, setHovered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [localMuted, setLocalMuted] = useState(true);
  const [heartBurst, setHeartBurst] = useState(false);
  const videoRef = useRef(null);
  const heartTimerRef = useRef(null);
  const clickTimerRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRefs.current[reel.id] = videoRef.current;
  }, [reel.id, videoRefs]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (hovered && playing) {
      el.muted = localMuted;
      el.play().catch(() => {});
    } else {
      el.pause();
      if (!hovered) el.currentTime = 0;
    }
  }, [hovered, playing, localMuted]);

  const handleMouseEnter = () => { setHovered(true); setPlaying(true); };
  const handleMouseLeave = () => { setHovered(false); setPlaying(false); };

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

  const toggleMute = (e) => {
    e.stopPropagation();
    const el = videoRef.current;
    const next = !localMuted;
    setLocalMuted(next);
    if (el) el.muted = next;
  };

  const progress = videoProgress[reel.id] || 0;

  return (
    <div
      style={d.reelCard}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={d.reelRow}>
        {/* Video — portrait 9:16, no text overlay */}
        <div
          style={d.reelVideoWrap}
          onClick={handleVideoClick}
          onDoubleClick={handleDoubleClick}
        >
          <video ref={videoRef} src={reel.videoUrl} poster={reel.thumbnailUrl || undefined} loop playsInline style={d.reelVideo} />
          {(!hovered || !playing) && (
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
            <button style={d.muteBtn} onClick={toggleMute} aria-label={localMuted ? "Дуу асаах" : "Дуу унтраах"}>
              <IcoVolume muted={localMuted} />
            </button>
          )}
          {hovered && progress > 0 && (
            <div style={d.progressBarWrap}>
              <div style={{ ...d.progressFill, width: `${progress * 100}%` }} />
            </div>
          )}
        </div>

        {/* Round SVG action buttons — outside video */}
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

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={d.skeletonRow}>
      <div style={{ ...d.skeletonPulse, width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ ...d.skeletonPulse, height: 11, width: "65%", borderRadius: 6 }} />
        <div style={{ ...d.skeletonPulse, height: 9, width: "45%", borderRadius: 6 }} />
      </div>
      <div style={{ ...d.skeletonPulse, width: 52, height: 28, borderRadius: 8 }} />
    </div>
  );
}

// ─── Coach Section ────────────────────────────────────────────────────────────
function CoachSection({ router, currentLocale }) {
  const [coaches, setCoaches] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, query, where, limit, getDocs } = await import("firebase/firestore");
        if (!db) { setCoaches(COACHES); return; }
        const snap = await getDocs(query(collection(db, "users"), where("isCoach", "==", true), limit(6))).catch(() => ({ docs: [] }));
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCoaches(data.length ? data : COACHES);
      } catch {
        setCoaches(COACHES);
      }
    }
    load();
  }, []);

  const ACCENT_COLORS = [GOLD, "#A855F7", "#3B82F6", "#10B981", "#F97316", "#EC4899"];
  const BG_COLORS = [
    "linear-gradient(160deg,#2d1e00 0%,#100b00 100%)",
    "linear-gradient(160deg,#1e0833 0%,#0a0315 100%)",
    "linear-gradient(160deg,#0a1e3d 0%,#030a18 100%)",
    "linear-gradient(160deg,#00200f 0%,#000d06 100%)",
    "linear-gradient(160deg,#2d1000 0%,#100600 100%)",
    "linear-gradient(160deg,#2d0027 0%,#100010 100%)",
  ];

  return (
    <div style={d.rightCard}>
      <div style={d.rightCardHeader}>
        <div style={{ ...d.liveDot, background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
        <span style={d.rightCardTitle}>САНАЛ БОЛГОХ КОАЧ</span>
      </div>

      <div className="no-scrollbar" style={d.hScroll}>
        {coaches === null ? (
          [0,1,2].map((i) => (
            <div key={i} style={{ ...d.hCardWide, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ ...d.skeletonPulse, height: 9, width: "60%", borderRadius: 5, marginBottom: 6 }} />
              <div style={{ ...d.skeletonPulse, height: 11, width: "80%", borderRadius: 5, marginBottom: 4 }} />
              <div style={{ ...d.skeletonPulse, height: 9, width: "55%", borderRadius: 5 }} />
            </div>
          ))
        ) : coaches.map((coach, i) => {
          const accent = coach.accent || ACCENT_COLORS[i % ACCENT_COLORS.length];
          const bg = coach.bg || BG_COLORS[i % BG_COLORS.length];
          const name = (coach.displayName || coach.username || coach.name || "КОАЧ").toUpperCase();
          const sub = coach.coachSpecialties?.[0] || coach.sub || "Тренер";
          const rating = coach.rating || "5.0";
          return (
            <button
              key={coach.id}
              className="featured-card"
              style={{ ...d.hCardWide, background: bg }}
              onClick={() => router.push(`/${currentLocale}/coach/${coach.id}`)}
            >
              <div style={{ ...d.hCardBadge, color: accent, borderColor: accent + "40", background: accent + "18" }}>
                КОАЧ
              </div>
              <div style={{ ...d.hCardStat, color: accent }}>★ {rating}</div>
              <div style={d.hCardName}>{name}</div>
              <div style={d.hCardSub}>{sub}</div>
              <div style={{ ...d.hCardLine, background: accent + "60" }} />
            </button>
          );
        })}
      </div>

      <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/coach`)}>
        БҮГДИЙГ ХАРАХ →
      </button>
    </div>
  );
}

// ─── Gym Section ─────────────────────────────────────────────────────────────
function GymSection({ router, currentLocale }) {
  const [gyms, setGyms] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, query, limit, getDocs, orderBy } = await import("firebase/firestore");
        if (!db) { setGyms(GYMS); return; }
        const snap = await getDocs(query(collection(db, "gyms"), orderBy("memberCount", "desc"), limit(6))).catch(() => ({ docs: [] }));
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGyms(data.length ? data : GYMS);
      } catch {
        setGyms(GYMS);
      }
    }
    load();
  }, []);

  const GYM_ACCENTS = [RED, "#3B82F6", "#10B981", GOLD, "#A855F7", "#F97316"];
  const GYM_BGS = [
    "linear-gradient(160deg,#3d0007 0%,#150002 100%)",
    "linear-gradient(160deg,#0a1e3d 0%,#030a18 100%)",
    "linear-gradient(160deg,#00200f 0%,#000d06 100%)",
    "linear-gradient(160deg,#2d1e00 0%,#100b00 100%)",
    "linear-gradient(160deg,#1e0833 0%,#0a0315 100%)",
    "linear-gradient(160deg,#2d1000 0%,#100600 100%)",
  ];

  return (
    <div style={d.rightCard}>
      <div style={d.rightCardHeader}>
        <span style={{ ...d.liveDot, background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
        <span style={d.rightCardTitle}>ОНЦЛОХ ЗААЛ</span>
      </div>

      <div className="no-scrollbar" style={d.hScroll}>
        {gyms === null ? (
          [0,1,2].map((i) => (
            <div key={i} style={{ ...d.hCardWide, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ ...d.skeletonPulse, height: 9, width: "60%", borderRadius: 5, marginBottom: 6 }} />
              <div style={{ ...d.skeletonPulse, height: 11, width: "80%", borderRadius: 5, marginBottom: 4 }} />
              <div style={{ ...d.skeletonPulse, height: 9, width: "55%", borderRadius: 5 }} />
            </div>
          ))
        ) : gyms.map((gym, i) => {
          const accent = gym.accent || GYM_ACCENTS[i % GYM_ACCENTS.length];
          const bg = gym.bg || GYM_BGS[i % GYM_BGS.length];
          const name = (gym.name || gym.gymName || "ЗААЛ").toUpperCase();
          const city = gym.city || gym.location || "";
          const members = gym.memberCount || gym.members || 0;
          return (
            <button
              key={gym.id}
              className="featured-card"
              style={{ ...d.hCardWide, background: bg }}
              onClick={() => router.push(`/${currentLocale}/gyms/${gym.id}`)}
            >
              <div style={{ ...d.hCardBadge, color: accent, borderColor: accent + "40", background: accent + "18" }}>
                ЗААЛ
              </div>
              <div style={{ ...d.hCardStat, color: accent }}>{members} гишүүн</div>
              <div style={d.hCardName}>{name}</div>
              <div style={d.hCardSub}>{city}</div>
              <div style={{ ...d.hCardLine, background: accent + "60" }} />
            </button>
          );
        })}
      </div>

      <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/gyms`)}>
        БҮГДИЙГ ХАРАХ →
      </button>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ user, router, currentLocale }) {
  const [sparring, setSparring] = useState(null);
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, query, where, orderBy, limit, getDocs } = await import("firebase/firestore");
        if (!db) { setSparring([]); setRequests([]); return; }

        const [sparringSnap, reqSnap] = await Promise.all([
          getDocs(query(
            collection(db, "sparring_posts"),
            where("lookingForSparring", "==", true),
            orderBy("createdAt", "desc"),
            limit(5)
          )).catch(() => ({ docs: [] })),
          user?.uid ? getDocs(query(
            collection(db, "sparring_requests"),
            where("fromUserId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(4)
          )).catch(() => ({ docs: [] })) : Promise.resolve({ docs: [] }),
        ]);

        setSparring(sparringSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setRequests(reqSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (_) {
        setSparring([]);
        setRequests([]);
      }
    }
    load();
  }, [user]);

  const displaySparring = sparring === null ? null : sparring.length > 0 ? sparring : FALLBACK_SPARRING;
  const isLoading = sparring === null;

  return (
    <aside style={d.rightPanel}>
      {/* Search */}
      <div style={d.searchBar}>
        <span style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}><IcoSearch /></span>
        <input
          placeholder="ТУЛААНЧ, ЗААЛ ХАЙХ..."
          style={d.searchInput}
          readOnly
          onClick={() => router.push(`/${currentLocale}/discover`)}
        />
      </div>

      {/* Sparring Lobby */}
      <div style={d.rightCard}>
        <div style={d.rightCardHeader}>
          <span style={d.liveDot} className="live-pulse" />
          <span style={d.rightCardTitle}>СПАРРИНГ ЛОББИ</span>
          <span style={d.liveBadge}>{isLoading ? "—" : `${displaySparring?.length || 0} LIVE`}</span>
        </div>

        <div className="no-scrollbar" style={d.hScroll}>
          {isLoading ? (
            [0,1,2].map((i) => (
              <div key={i} style={{ ...d.sparringCard, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ ...d.skeletonPulse, width: 7, height: 7, borderRadius: "50%", marginBottom: 6 }} />
                <div style={{ ...d.skeletonPulse, height: 9, width: "70%", borderRadius: 5, marginBottom: 4 }} />
                <div style={{ ...d.skeletonPulse, height: 11, width: "85%", borderRadius: 5, marginBottom: 4 }} />
                <div style={{ ...d.skeletonPulse, height: 9, width: "60%", borderRadius: 5, marginBottom: 6 }} />
                <div style={{ ...d.skeletonPulse, width: 52, height: 22, borderRadius: 7 }} />
              </div>
            ))
          ) : displaySparring.map((item) => (
            <div
              key={item.id}
              style={d.sparringCard}
              onClick={() => router.push(`/${currentLocale}/sparring`)}
            >
              <div style={d.sparringCardDot} />
              <div style={{ ...d.sparringCardWeight, color: RED }}>
                {item.weightClass || "—"}
              </div>
              <div style={d.sparringCardName}>
                {(item.displayName || item.fromName || "Тулаанч").toUpperCase()}
              </div>
              <div style={d.sparringCardMeta}>
                {item.location || item.gym || ""}
              </div>
              <div style={d.sparringCardJoin}>НЭГДЭХ</div>
            </div>
          ))}
        </div>

        <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/sparring`)}>
          БҮГДИЙГ ХАРАХ →
        </button>
      </div>

      {/* Coaches */}
      <CoachSection router={router} currentLocale={currentLocale} />

      {/* Gyms */}
      <GymSection router={router} currentLocale={currentLocale} />

      {/* My Requests */}
      {user && (
        <div style={d.rightCard}>
          <div style={d.rightCardHeader}>
            <div style={{ ...d.liveDot, background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
            <span style={d.rightCardTitle}>МИНИЙ ХҮСЭЛТ</span>
          </div>

          {requests === null ? (
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[0,1].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : requests.length === 0 ? (
            <div style={d.rightEmpty}>Одоогоор илгээсэн{"\n"}хүсэлт байхгүй байна</div>
          ) : (
            requests.map((req) => {
              const isAccepted = req.status === "accepted";
              const isDeclined = req.status === "declined";
              const color = isAccepted ? "#34D399" : isDeclined ? "#F87171" : "#F59E0B";
              const bg = isAccepted ? "rgba(52,211,153,0.1)" : isDeclined ? "rgba(248,113,113,0.1)" : "rgba(245,158,11,0.08)";
              const border = isAccepted ? "rgba(52,211,153,0.25)" : isDeclined ? "rgba(248,113,113,0.25)" : "rgba(245,158,11,0.22)";
              const label = isAccepted ? "ЗӨВШӨӨРСӨН" : isDeclined ? "ТАТГАЛЗСАН" : "ХҮЛЭЭЖ БАЙНА";
              return (
                <div key={req.id} style={d.requestRow}>
                  <span style={d.requestTo}>{(req.toDisplayName || req.toName || "Тулаанч").toUpperCase()}</span>
                  <span style={{ ...d.statusBadge, color, background: bg, border: `1px solid ${border}` }}>
                    {label}
                  </span>
                </div>
              );
            })
          )}

          <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/sparring`)}>
            СПАРРИНГ ХУУДАС →
          </button>
        </div>
      )}
    </aside>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ReelsDashboard({
  reels, feedMode, setFeedMode,
  videoRefs, soundEnabled, videoProgress,
  userLikes, savedReels, heartBursts,
  creatorProfiles, creatorStats, gymNames,
  isProfileSource,
  user, router, currentLocale, t,
  handleLike, handleOpenComments, handleShare, handleSave, handleGetFeedback,
  feedRef,
}) {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    if (user.photoURL) { setProfilePhotoUrl(user.photoURL); return; }
    import("@/lib/firebase").then(({ db }) => {
      if (!db) return;
      import("firebase/firestore").then(({ doc, getDoc }) => {
        getDoc(doc(db, "users", user.uid)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const photo = data.profileImageUrl || data.photoURL || data.avatarUrl || null;
            if (photo) setProfilePhotoUrl(photo);
          }
        }).catch(() => {});
      });
    });
  }, [user?.uid, user?.photoURL]);
  return (
    <div style={d.page} className="cinematic-bg">
      <main style={d.center}>
        <div style={d.centerInner}>
          {!isProfileSource && (
            <div style={d.tabs}>
              {[
                { key: "forYou", label: "ТАНД" },
                { key: "following", label: "ДАГАЖ БУЙ" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  style={{ ...d.tab, ...(feedMode === key ? d.tabActive : {}) }}
                  onClick={() => {
                    if (key === "following" && !user?.uid) { router.push(`/${currentLocale}/login`); return; }
                    setFeedMode(key);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <QuickPostBar user={user} profilePhotoUrl={profilePhotoUrl} router={router} currentLocale={currentLocale} />

          <div ref={feedRef} style={d.cardsFeed}>
            {reels.length === 0 ? (
              <div style={d.emptyFeed}>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase", color: RED, opacity: 0.55 }}>GAVANA BOXING</span>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.28)", fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
                  NO REELS FOUND
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.18)", letterSpacing: "0.04em" }}>
                  Try a different filter
                </p>
              </div>
            ) : reels.map((reel, index) => {
              const creatorProfile = reel.userId ? creatorProfiles[reel.userId] : null;
              const name = getCreatorName(reel, creatorProfile);
              const photo = getCreatorPhoto(creatorProfile);
              const initial = name.charAt(0).toUpperCase() || "U";
              const caption = cleanCaption(reel.description || reel.caption || "");
              const stats = reel.userId ? creatorStats[reel.userId] : null;

              return (
                <DesktopReelCard
                  key={reel.id}
                  reel={reel}
                  index={index}
                  videoRefs={videoRefs}
                  soundEnabled={soundEnabled}
                  videoProgress={videoProgress}
                  isLiked={userLikes.has(reel.id)}
                  isSaved={savedReels.has(reel.id)}
                  heartBursts={heartBursts.filter((b) => b.reelId === reel.id)}
                  creatorName={name}
                  creatorPhoto={photo}
                  creatorInitial={initial}
                  captionText={caption}
                  stats={stats}
                  gymName={reel.gymId ? gymNames[reel.gymId] : null}
                  currentLocale={currentLocale}
                  t={t}
                  router={router}
                  onLike={handleLike}
                  onOpenComments={handleOpenComments}
                  onShare={handleShare}
                  onSave={handleSave}
                  onGetFeedback={handleGetFeedback}
                />
              );
            })}
          </div>
        </div>
      </main>

      <RightPanel user={user} router={router} currentLocale={currentLocale} />
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const d = {
  page: {
    display: "flex",
    height: "100dvh",
    overflow: "hidden",
    background: `
      radial-gradient(ellipse 60% 70% at 38% 42%, ${redAlpha(0.05)} 0%, transparent 62%),
      radial-gradient(ellipse 35% 45% at 82% 18%, rgba(255,255,255,0.025) 0%, transparent 55%),
      radial-gradient(ellipse 30% 40% at 88% 88%, ${redAlpha(0.02)} 0%, transparent 55%),
      #0B0B0C
    `,
    color: "#fff",
  },

  // ── Sidebar ──
  sidebar: {
    width: 260,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    padding: "28px 14px 24px",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    background: `
      radial-gradient(ellipse 100% 40% at 50% 0%, ${redAlpha(0.04)} 0%, transparent 60%),
      rgba(11,11,12,0.96)
    `,
    position: "sticky",
    top: 0,
    height: "100dvh",
    overflowY: "auto",
    scrollbarWidth: "none",
  },
  sidebarLogo: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    marginBottom: 32,
    padding: "0 10px",
  },
  logoGavana: {
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    fontSize: 24,
    fontWeight: 400,
    letterSpacing: "0.06em",
    color: "#fff",
    lineHeight: 1,
    textShadow: `0 0 28px ${redAlpha(0.6)}, 0 2px 0 rgba(0,0,0,0.5)`,
  },
  logoBoxing: {
    fontSize: 9,
    fontWeight: 900,
    color: RED,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
  },
  sidebarNav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.38)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    position: "relative",
    transition: "background 150ms ease, color 150ms ease",
  },
  navBtnActive: {
    background: `${redAlpha(0.1)}`,
    color: "#fff",
  },
  navIcon: {
    width: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navLabel: { flex: 1 },
  navChevron: { fontSize: 12, color: "rgba(255,255,255,0.18)", flexShrink: 0 },
  navActiveBar: {
    position: "absolute",
    left: 0,
    top: "22%",
    bottom: "22%",
    width: 3,
    borderRadius: "0 3px 3px 0",
    background: RED,
    boxShadow: `0 0 8px ${redAlpha(0.7)}`,
  },
  createBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "13px",
    borderRadius: 14,
    border: "none",
    background: `linear-gradient(135deg, ${RED}, #cc2820)`,
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    cursor: "pointer",
    marginTop: 10,
    boxShadow: `0 6px 22px ${redAlpha(0.24)}`,
  },
  sidebarProfile: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    marginTop: 14,
    textAlign: "left",
    width: "100%",
  },
  sidebarProfileAva: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: RED,
    border: `2px solid ${goldAlpha(0.4)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  sidebarProfileInfo: { flex: 1, minWidth: 0 },
  sidebarProfileName: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.04em",
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
  },
  sidebarProfileSub: {
    fontSize: 9,
    color: RED,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    marginTop: 1,
  },

  // ── Center ──
  center: {
    flex: 1,
    overflowY: "auto",
    scrollbarWidth: "none",
    minWidth: 0,
  },
  centerInner: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "16px 24px 40px",
  },
  tabs: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    display: "flex",
    gap: 4,
    padding: "14px 0 12px",
    background: "rgba(11,11,12,0.92)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    marginBottom: 4,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  tab: {
    padding: "6px 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "transparent",
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 150ms ease",
  },
  tabActive: {
    background: RED,
    border: `1px solid ${RED}`,
    color: "#fff",
  },

  // ── Quick post ──
  quickPost: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.025)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
    marginBottom: 28,
  },
  quickAva: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: RED,
    border: `2px solid ${goldAlpha(0.35)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  quickInput: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    cursor: "text",
    textAlign: "left",
    textTransform: "uppercase",
  },
  quickVideoBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    borderRadius: 12,
    border: `1px solid ${redAlpha(0.35)}`,
    background: `${redAlpha(0.08)}`,
    color: "#f87171",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },

  // ── Cards feed ──
  cardsFeed: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  emptyFeed: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    gap: 10,
    borderRadius: 20,
    background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${redAlpha(0.08)} 0%, transparent 70%)`,
    border: "1px solid rgba(255,255,255,0.04)",
  },

  // ── Reel card ──
  reelCard: {
    background: "#141416",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
    transition: "border-color 180ms ease, box-shadow 180ms ease",
  },
  reelRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "14px 14px 0",
  },
  reelVideoWrap: {
    flex: 1,
    position: "relative",
    background: "#000",
    borderRadius: 18,
    overflow: "hidden",
    aspectRatio: "9/16",
    maxHeight: 520,
    cursor: "pointer",
  },
  reelVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  videoOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.22)",
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1.5px solid rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.85)",
    paddingLeft: 2,
  },
  muteBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    zIndex: 4,
  },
  heartBurstWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 5,
  },
  progressBarWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: "rgba(255,255,255,0.1)",
  },
  progressFill: {
    height: "100%",
    background: RED,
    transition: "width 200ms linear",
  },

  // ── Round action buttons ──
  reelActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
    flexShrink: 0,
  },
  roundBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(12,12,14,0.8)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    cursor: "pointer",
    color: "rgba(255,255,255,0.6)",
    transition: "border-color 150ms ease, box-shadow 150ms ease, transform 100ms ease",
  },
  roundBtnLiked: {
    borderColor: "rgba(248,113,113,0.5)",
    background: "rgba(248,113,113,0.1)",
    boxShadow: "0 0 14px rgba(248,113,113,0.3)",
  },
  roundBtnSaved: {
    borderColor: `${goldAlpha(0.5)}`,
    background: `${goldAlpha(0.1)}`,
  },
  roundBtnCount: {
    fontSize: 9,
    fontWeight: 900,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 1,
    letterSpacing: "0.04em",
  },
  aiRoundBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: `1px solid ${redAlpha(0.5)}`,
    background: `${redAlpha(0.12)}`,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: RED,
    cursor: "pointer",
    boxShadow: `0 0 12px ${redAlpha(0.14)}`,
    transition: "box-shadow 150ms ease, transform 100ms ease",
  },

  // ── Reel info ──
  reelInfo: {
    padding: "14px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  creatorBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
  },
  creatorAva: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: RED,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    border: `1.5px solid ${goldAlpha(0.3)}`,
  },
  creatorName: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#fff",
  },
  creatorStat: {
    fontSize: 10,
    color: "rgba(255,255,255,0.32)",
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  caption: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.58)",
    lineHeight: 1.55,
  },

  // ── Right panel ──
  rightPanel: {
    width: 320,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "20px 14px 20px",
    borderLeft: "1px solid rgba(255,255,255,0.05)",
    background: `
      radial-gradient(ellipse 100% 35% at 50% 100%, ${redAlpha(0.03)} 0%, transparent 60%),
      rgba(11,11,12,0.98)
    `,
    height: "100dvh",
    overflowY: "auto",
    scrollbarWidth: "none",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "rgba(255,255,255,0.32)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  rightCard: {
    background: "#141416",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    overflow: "clip",
  },
  rightCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
    background: RED,
    boxShadow: `0 0 8px ${RED}`,
  },
  rightCardTitle: {
    flex: 1,
    fontSize: 9,
    fontWeight: 900,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  },
  liveBadge: {
    fontSize: 9,
    fontWeight: 900,
    color: RED,
    letterSpacing: "0.1em",
    background: `${redAlpha(0.12)}`,
    border: `1px solid ${redAlpha(0.3)}`,
    borderRadius: 999,
    padding: "2px 8px",
  },
  rightEmpty: {
    margin: "12px 14px",
    padding: "16px 12px",
    border: "1px dashed rgba(255,255,255,0.1)",
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.28)",
    textAlign: "center",
    textTransform: "uppercase",
    lineHeight: 1.5,
  },
  lobbyList: {
    display: "flex",
    flexDirection: "column",
  },
  lobbyRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "background 150ms ease",
    cursor: "pointer",
  },
  lobbyActiveDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#34D399",
    boxShadow: "0 0 7px #34D399",
    flexShrink: 0,
  },
  lobbyName: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#ddd",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  lobbyMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    fontWeight: 700,
    marginTop: 2,
    letterSpacing: "0.04em",
  },
  joinBtn: {
    padding: "5px 10px",
    borderRadius: 9,
    border: `1px solid ${redAlpha(0.4)}`,
    background: `${redAlpha(0.1)}`,
    color: RED,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    flexShrink: 0,
    whiteSpace: "nowrap",
    transition: "background 150ms ease, box-shadow 150ms ease",
  },
  viewAllBtn: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    background: "none",
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    cursor: "pointer",
    textAlign: "center",
    transition: "color 150ms ease",
  },
  requestRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  requestTo: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#ccc",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderRadius: 6,
    padding: "3px 8px",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },

  // ── Horizontal scroll card styles ──
  hScroll: {
    display: "flex", gap: 8, padding: "8px 12px 12px",
    overflowX: "auto", scrollbarWidth: "none",
  },
  hCardWide: {
    width: 220, flexShrink: 0, height: 110, borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.07)", padding: "10px 10px 8px",
    display: "flex", flexDirection: "column", justifyContent: "flex-end",
    cursor: "pointer", position: "relative", overflow: "hidden",
    textAlign: "left", transition: "transform 180ms ease",
  },
  hCardBadge: {
    position: "absolute", top: 8, left: 8, fontSize: 8, fontWeight: 900,
    letterSpacing: "0.14em", textTransform: "uppercase",
    border: "1px solid", borderRadius: 5, padding: "2px 6px",
  },
  hCardStat: { fontSize: 9, fontWeight: 700, marginBottom: 2, letterSpacing: "0.02em" },
  hCardName: {
    fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em",
    lineHeight: 1.1, textTransform: "uppercase", marginBottom: 2,
  },
  hCardSub: { fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700 },
  hCardLine: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2 },
  sparringCard: {
    width: 130, flexShrink: 0, height: 130, borderRadius: 14,
    background: "linear-gradient(160deg, rgba(255,59,48,0.12) 0%, #0d0507 100%)",
    border: "1px solid rgba(255,59,48,0.18)", padding: "10px 10px 8px",
    display: "flex", flexDirection: "column", cursor: "pointer",
    position: "relative", overflow: "hidden", transition: "transform 180ms ease",
    textAlign: "left",
  },
  sparringCardDot: {
    width: 7, height: 7, borderRadius: "50%", background: "#34D399",
    boxShadow: "0 0 7px #34D399", marginBottom: 6, flexShrink: 0,
  },
  sparringCardWeight: {
    fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4,
  },
  sparringCardName: {
    fontSize: 11, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em",
    lineHeight: 1.2, flex: 1,
  },
  sparringCardMeta: { fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, marginBottom: 2 },
  sparringCardJoin: {
    alignSelf: "flex-start", padding: "3px 9px", borderRadius: 7,
    border: "1px solid rgba(255,59,48,0.4)", background: "rgba(255,59,48,0.1)",
    color: RED, fontSize: 8, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase",
  },

  // ── Coach rows ──
  coachRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    cursor: "pointer",
  },
  coachAva: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1.5px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  coachName: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.06em",
    color: "#ddd",
    textTransform: "uppercase",
  },
  coachMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.32)",
    fontWeight: 700,
    marginTop: 2,
    letterSpacing: "0.02em",
  },

  // ── Featured cards ──
  featuredScroll: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    padding: "12px",
  },
  featuredCard: {
    width: "100%",
    height: 88,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "10px 10px 8px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    textAlign: "left",
    transition: "transform 180ms ease, box-shadow 180ms ease",
  },
  featuredTopBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    border: "1px solid",
    borderRadius: 5,
    padding: "2px 6px",
  },
  featuredName: {
    fontSize: 10,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    lineHeight: 1.2,
    marginBottom: 3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  featuredSub: {
    fontSize: 9,
    color: "rgba(255,255,255,0.38)",
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
  featuredAccentLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: "0 0 14px 14px",
  },

  // ── Skeleton ──
  skeletonRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  skeletonPulse: {
    background: "rgba(255,255,255,0.07)",
    animation: "skeleton-pulse 1.6s ease-in-out infinite",
  },
};
