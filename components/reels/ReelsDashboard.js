"use client";

import { useState, useEffect, useRef } from "react";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import { getCreatorName, getCreatorPhoto, cleanCaption } from "@/lib/reelHelpers";

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
function Sidebar({ router, user, currentLocale }) {
  const NAV = [
    { icon: "🏠", label: "Нүүр", path: "" },
    { icon: "🎬", label: "Рилс", path: "reels", active: true },
    { icon: "🧠", label: "AI Коач", path: "train" },
    { icon: "🏆", label: "Чансаа", path: "rank" },
    { icon: "🎯", label: "Тренер", path: "coach" },
    { icon: "🥊", label: "Спарринг", path: "sparring" },
    { icon: "💬", label: "Мессеж", path: "inbox" },
  ];

  return (
    <aside style={d.sidebar}>
      {/* Logo */}
      <div style={d.sidebarLogo}>
        <span style={d.logoGavana}>GAVANA</span>
        <span style={d.logoBoxing}>BOXING</span>
      </div>

      {/* Nav */}
      <nav style={d.sidebarNav}>
        {NAV.map((item) => (
          <button
            key={item.path}
            className="dashboard-nav-btn"
            style={{ ...d.navBtn, ...(item.active ? d.navBtnActive : {}) }}
            onClick={() => router.push(`/${currentLocale}/${item.path}`)}
          >
            <span style={d.navIcon}>{item.icon}</span>
            <span style={d.navLabel}>{item.label}</span>
            {item.active && <div style={d.navActiveBar} />}
          </button>
        ))}
      </nav>

      {/* Create */}
      <button style={d.createBtn} onClick={() => router.push(`/${currentLocale}/upload`)}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> ҮҮСГЭХ
      </button>

      {/* Profile card */}
      {user && (
        <button
          style={d.sidebarProfile}
          onClick={() => router.push(`/${currentLocale}/profile/${user.uid}`)}
        >
          <div style={d.sidebarProfileAva}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : <span style={{ fontSize: 13, fontWeight: 900 }}>{(user.displayName || "U").charAt(0).toUpperCase()}</span>
            }
          </div>
          <div style={d.sidebarProfileInfo}>
            <div style={d.sidebarProfileName}>{user.displayName || user.email?.split("@")[0] || "Та"}</div>
            <div style={d.sidebarProfileSub}>Gavana Boxing</div>
          </div>
        </button>
      )}
    </aside>
  );
}

// ─── Quick Post Bar ───────────────────────────────────────────────────────────
function QuickPostBar({ user, router, currentLocale }) {
  return (
    <div style={d.quickPost}>
      <div style={d.quickAva}>
        {user?.photoURL
          ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          : <span style={{ fontSize: 12, fontWeight: 900 }}>{(user?.displayName || "U").charAt(0).toUpperCase()}</span>
        }
      </div>
      <button style={d.quickInput} onClick={() => router.push(`/${currentLocale}/upload`)}>
        Өнөөдрийн бэлтгэл ямар байв?
      </button>
      <button style={d.quickVideoBtn} onClick={() => router.push(`/${currentLocale}/upload`)}>
        🎬 Видео
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
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRefs.current[reel.id] = videoRef.current;
    }
  }, [reel.id, videoRefs]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (hovered) {
      el.muted = !soundEnabled;
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [hovered, soundEnabled]);

  const progress = videoProgress[reel.id] || 0;

  return (
    <div
      style={d.reelCard}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Video + Actions: side by side, actions OUTSIDE video */}
      <div style={d.reelRow}>
        {/* Video — portrait 9:16, max 520px tall, NO text overlay */}
        <div style={d.reelVideoWrap}>
          <video
            ref={videoRef}
            src={reel.videoURL}
            muted
            loop
            playsInline
            style={d.reelVideo}
          />
          {!hovered && (
            <div style={d.videoOverlay}>
              <div style={d.playCircle}>▶</div>
            </div>
          )}
          {hovered && progress > 0 && (
            <div style={d.progressBarWrap}>
              <div style={{ ...d.progressFill, width: `${progress * 100}%` }} />
            </div>
          )}
        </div>

        {/* Round action buttons — outside video, right side */}
        <div style={d.reelActions}>
          <button
            className="reel-action-btn"
            style={{ ...d.roundBtn, ...(isLiked ? d.roundBtnLiked : {}) }}
            onClick={() => onLike(reel.id)}
          >
            <span style={{ fontSize: 17 }}>❤️</span>
            {reel.likes > 0 && <span style={d.roundBtnCount}>{reel.likes}</span>}
          </button>

          <button
            className="reel-action-btn"
            style={d.roundBtn}
            onClick={() => onOpenComments(reel.id)}
          >
            <span style={{ fontSize: 17 }}>💬</span>
            {reel.commentsCount > 0 && <span style={d.roundBtnCount}>{reel.commentsCount}</span>}
          </button>

          <button
            className="reel-action-btn"
            style={d.roundBtn}
            onClick={() => onShare(reel.id)}
          >
            <span style={{ fontSize: 17 }}>🔗</span>
          </button>

          <button
            className="reel-action-btn"
            style={{ ...d.roundBtn, ...(isSaved ? d.roundBtnSaved : {}) }}
            onClick={() => onSave(reel.id)}
          >
            <span style={{ fontSize: 17 }}>💾</span>
          </button>

          <button
            className="reel-action-btn reel-ai-btn"
            style={d.aiRoundBtn}
            onClick={() => onGetFeedback(reel)}
          >
            <span style={{ fontSize: 15 }}>⚡</span>
            <span style={d.roundBtnCount}>AI</span>
          </button>
        </div>
      </div>

      {/* Creator info + caption — below video, clean */}
      <div style={d.reelInfo}>
        <button
          style={d.creatorBtn}
          onClick={() => router.push(`/${currentLocale}/profile/${reel.userId}`)}
        >
          <div style={d.creatorAva}>
            {creatorPhoto
              ? <img src={creatorPhoto} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : <span style={{ fontSize: 11, fontWeight: 900 }}>{creatorInitial}</span>
            }
          </div>
          <div>
            <div style={d.creatorName}>{creatorName}</div>
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

// ─── Right Panel ──────────────────────────────────────────────────────────────
function RightPanel({ user, router, currentLocale }) {
  const [sparring, setSparring] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, query, where, orderBy, limit, getDocs } = await import("firebase/firestore");
        if (!db) { setLoaded(true); return; }

        const tasks = [
          getDocs(query(
            collection(db, "sparring_requests"),
            where("status", "==", "open"),
            orderBy("createdAt", "desc"),
            limit(5)
          )).catch(() => ({ docs: [] })),
        ];

        if (user?.uid) {
          tasks.push(
            getDocs(query(
              collection(db, "sparring_requests"),
              where("fromUid", "==", user.uid),
              orderBy("createdAt", "desc"),
              limit(4)
            )).catch(() => ({ docs: [] }))
          );
        }

        const [sparringSnap, reqSnap] = await Promise.all(tasks);
        setSparring(sparringSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        if (reqSnap) setRequests(reqSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (_) {}
      setLoaded(true);
    }
    load();
  }, [user]);

  return (
    <aside style={d.rightPanel}>
      {/* Search */}
      <div style={d.searchBar}>
        <span style={{ fontSize: 15, opacity: 0.45 }}>🔍</span>
        <input
          placeholder="Тулаанч, заал хайх..."
          style={d.searchInput}
          readOnly
          onClick={() => router.push(`/${currentLocale}/rank`)}
        />
      </div>

      {/* Sparring Lobby */}
      <div style={d.rightCard}>
        <div style={d.rightCardHeader}>
          <div style={{ ...d.rightDot, background: RED, boxShadow: `0 0 6px ${RED}` }} />
          <span style={d.rightCardTitle}>СПАРРИНГ ЛОББИ</span>
          <span style={d.livePill}>● LIVE</span>
        </div>

        {!loaded ? (
          <div style={d.rightEmpty}>Ачааллаж байна...</div>
        ) : sparring.length === 0 ? (
          <div style={d.rightEmpty}>Одоогоор идэвхтэй зар алга</div>
        ) : (
          <div style={d.lobbyList}>
            {sparring.map((item) => (
              <div key={item.id} style={d.lobbyRow}>
                <div style={d.lobbyActiveDot} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={d.lobbyName}>{item.fromName || "Тулаанч"}</div>
                  <div style={d.lobbyMeta}>
                    {[item.weightClass, item.gym].filter(Boolean).join(" · ") || "Спарринг хайж байна"}
                  </div>
                </div>
                <button
                  style={d.joinBtn}
                  onClick={() => router.push(`/${currentLocale}/sparring`)}
                >
                  🥊
                </button>
              </div>
            ))}
          </div>
        )}

        <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/sparring`)}>
          Бүгдийг харах →
        </button>
      </div>

      {/* My Requests */}
      {user && (
        <div style={d.rightCard}>
          <div style={d.rightCardHeader}>
            <div style={{ ...d.rightDot, background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
            <span style={d.rightCardTitle}>МИНИЙ ХҮСЭЛТ</span>
          </div>

          {requests.length === 0 ? (
            <div style={d.rightEmpty}>Идэвхтэй хүсэлт алга</div>
          ) : (
            <div>
              {requests.map((req) => {
                const isAccepted = req.status === "accepted";
                const isDeclined = req.status === "declined";
                const color = isAccepted ? "#34D399" : isDeclined ? "#F87171" : "#F59E0B";
                const bg = isAccepted ? "rgba(52,211,153,0.1)" : isDeclined ? "rgba(248,113,113,0.1)" : "rgba(245,158,11,0.1)";
                const border = isAccepted ? "rgba(52,211,153,0.25)" : isDeclined ? "rgba(248,113,113,0.25)" : "rgba(245,158,11,0.25)";
                const label = isAccepted ? "✓ Зөвшөөрсөн" : isDeclined ? "✗ Татгалзсан" : "⏳ Хүлээж байна";
                return (
                  <div key={req.id} style={d.requestRow}>
                    <span style={d.requestTo}>{req.toName || "Тулаанч"}</span>
                    <span style={{ ...d.statusBadge, color, background: bg, border: `1px solid ${border}` }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <button style={d.viewAllBtn} onClick={() => router.push(`/${currentLocale}/sparring`)}>
            Спарринг хуудас →
          </button>
        </div>
      )}
    </aside>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ReelsDashboard({
  reels,
  feedMode, setFeedMode,
  videoRefs, soundEnabled, videoProgress,
  userLikes, savedReels, heartBursts,
  creatorProfiles, creatorStats, gymNames,
  isProfileSource,
  user, router, currentLocale, t,
  handleLike, handleOpenComments, handleShare, handleSave, handleGetFeedback,
  feedRef,
}) {
  return (
    <div style={d.page}>
      <Sidebar router={router} user={user} currentLocale={currentLocale} />

      <main style={d.center}>
        <div style={d.centerInner}>
        {/* Feed tabs — sticky */}
        {!isProfileSource && (
          <div style={d.tabs}>
            {[
              { key: "forYou", label: t("forYou") },
              { key: "following", label: t("following") },
            ].map(({ key, label }) => (
              <button
                key={key}
                style={{ ...d.tab, ...(feedMode === key ? d.tabActive : {}) }}
                onClick={() => {
                  if (key === "following" && !user?.uid) {
                    router.push(`/${currentLocale}/login`);
                    return;
                  }
                  setFeedMode(key);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Quick post */}
        <QuickPostBar user={user} router={router} currentLocale={currentLocale} />

        {/* Cards feed */}
        <div ref={feedRef} style={d.cardsFeed}>
          {reels.length === 0 ? (
            <div style={d.emptyFeed}>
              <span style={{ fontSize: 40 }}>🎬</span>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginTop: 10 }}>{t("noReelsYet")}</p>
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
    background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${redAlpha(0.1)} 0%, transparent 60%), #070707`,
    color: "#fff",
  },

  // ── Sidebar ──
  sidebar: {
    width: 260,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    padding: "28px 14px 24px",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.015)",
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
    letterSpacing: "0.05em",
    color: "#fff",
    lineHeight: 1,
    textShadow: `0 0 28px ${redAlpha(0.55)}, 0 2px 0 rgba(0,0,0,0.5)`,
  },
  logoBoxing: {
    fontSize: 9,
    fontWeight: 900,
    color: RED,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    opacity: 0.9,
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
    padding: "11px 12px",
    borderRadius: 12,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.42)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    position: "relative",
    transition: "background 150ms ease, color 150ms ease",
  },
  navBtnActive: {
    background: `${redAlpha(0.1)}`,
    color: "#fff",
    fontWeight: 700,
  },
  navIcon: {
    fontSize: 18,
    width: 22,
    textAlign: "center",
    flexShrink: 0,
  },
  navLabel: { flex: 1 },
  navActiveBar: {
    position: "absolute",
    left: 0,
    top: "22%",
    bottom: "22%",
    width: 3,
    borderRadius: "0 3px 3px 0",
    background: RED,
    boxShadow: `0 0 10px ${RED}`,
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
    background: `linear-gradient(135deg, ${RED}, #8f0d17)`,
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: "0.12em",
    cursor: "pointer",
    marginTop: 10,
    boxShadow: `0 6px 22px ${redAlpha(0.4)}`,
    transition: "box-shadow 200ms ease",
  },
  sidebarProfile: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 10px",
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
    background: "linear-gradient(135deg, #C1121F, #7d0812)",
    border: `2px solid ${goldAlpha(0.4)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  sidebarProfileInfo: { flex: 1, minWidth: 0 },
  sidebarProfileName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  sidebarProfileSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.32)",
    fontWeight: 600,
  },

  // ── Center column ──
  center: {
    flex: 1,
    overflowY: "auto",
    scrollbarWidth: "none",
    minWidth: 0,
  },
  centerInner: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "0 24px 40px",
  },
  tabs: {
    position: "sticky",
    top: 0,
    zIndex: 30,
    display: "flex",
    gap: 6,
    padding: "16px 0 14px",
    background: "rgba(7,7,7,0.75)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    marginBottom: 4,
  },
  tab: {
    padding: "7px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 150ms ease, color 150ms ease",
  },
  tabActive: {
    background: RED,
    border: `1px solid ${RED}`,
    color: "#fff",
    boxShadow: `0 4px 16px ${redAlpha(0.35)}`,
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
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
    marginBottom: 18,
  },
  quickAva: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #C1121F, #7d0812)",
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
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.32)",
    fontSize: 14,
    cursor: "text",
    textAlign: "left",
    transition: "border-color 150ms ease",
  },
  quickVideoBtn: {
    padding: "9px 14px",
    borderRadius: 12,
    border: `1px solid ${redAlpha(0.35)}`,
    background: `${redAlpha(0.08)}`,
    color: "#f87171",
    fontSize: 13,
    fontWeight: 700,
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
    padding: "80px 0",
  },

  // ── Reel card ──
  reelCard: {
    background: "rgba(255,255,255,0.025)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 8px 36px rgba(0,0,0,0.3)",
    transition: "border-color 200ms ease, box-shadow 200ms ease",
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
    border: "1.5px solid rgba(255,255,255,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    paddingLeft: 4,
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

  // ── Round action buttons (outside video) ──
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
    gap: 3,
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(18,18,20,0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    cursor: "pointer",
    justifyContent: "center",
    color: "rgba(255,255,255,0.7)",
    transition: "border-color 150ms ease, box-shadow 150ms ease, transform 100ms ease",
  },
  roundBtnLiked: {
    borderColor: "rgba(248,113,113,0.5)",
    background: "rgba(248,113,113,0.12)",
    boxShadow: "0 0 14px rgba(248,113,113,0.3)",
  },
  roundBtnSaved: {
    borderColor: `${goldAlpha(0.5)}`,
    background: `${goldAlpha(0.12)}`,
  },
  roundBtnCount: {
    fontSize: 10,
    fontWeight: 800,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1,
    marginTop: -2,
  },
  aiRoundBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: `1px solid ${redAlpha(0.5)}`,
    background: `${redAlpha(0.14)}`,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: RED,
    cursor: "pointer",
    fontWeight: 900,
    boxShadow: `0 0 10px ${redAlpha(0.2)}`,
    transition: "box-shadow 150ms ease, transform 100ms ease",
  },

  // ── Reel info (below video, clean) ──
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
    background: "linear-gradient(135deg, #C1121F, #7d0812)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
    border: `1.5px solid ${goldAlpha(0.3)}`,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
  },
  creatorStat: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    fontWeight: 600,
  },
  caption: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.55,
  },

  // ── Right panel ──
  rightPanel: {
    width: 360,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: "28px 16px 24px",
    borderLeft: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.015)",
    position: "sticky",
    top: 0,
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
    border: "1px solid rgba(255,255,255,0.08)",
  },
  searchInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "rgba(255,255,255,0.38)",
    fontSize: 13,
    cursor: "pointer",
  },
  rightCard: {
    background: "rgba(255,255,255,0.025)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
  },
  rightCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 14px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(0,0,0,0.18)",
  },
  rightDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  rightCardTitle: {
    flex: 1,
    fontSize: 10,
    fontWeight: 900,
    color: "rgba(255,255,255,0.52)",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  },
  livePill: {
    fontSize: 9,
    fontWeight: 900,
    color: RED,
    letterSpacing: "0.1em",
  },
  rightEmpty: {
    padding: "22px 14px",
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
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
  },
  lobbyActiveDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#34D399",
    boxShadow: "0 0 7px #34D399",
    flexShrink: 0,
  },
  lobbyName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#ddd",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  lobbyMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.32)",
    fontWeight: 600,
    marginTop: 1,
  },
  joinBtn: {
    padding: "6px 11px",
    borderRadius: 10,
    border: "none",
    background: `linear-gradient(135deg, ${RED}, #8f0d17)`,
    color: "#fff",
    fontSize: 15,
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: `0 3px 10px ${redAlpha(0.35)}`,
    transition: "box-shadow 150ms ease",
  },
  viewAllBtn: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    background: "none",
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.32)",
    fontSize: 12,
    cursor: "pointer",
    textAlign: "center",
    fontWeight: 700,
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
    fontSize: 13,
    fontWeight: 600,
    color: "#ccc",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 800,
    borderRadius: 999,
    padding: "3px 9px",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
};
