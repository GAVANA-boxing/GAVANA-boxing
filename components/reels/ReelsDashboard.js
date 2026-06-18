"use client";

import { useState, useEffect } from "react";
import { RED } from "@/lib/tokens";
import { getCreatorName, getCreatorPhoto, cleanCaption } from "@/lib/reelHelpers";
import QuickPostBar from "@/components/reels/QuickPostBar";
import DesktopReelCard from "@/components/reels/DesktopReelCard";
import RightPanel from "@/components/reels/RightPanel";
import d from "@/components/reels/reelsDashboardStyles";

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

  const [desktopSound, setDesktopSound] = useState(() => {
    try { return localStorage.getItem("reel-sound-on") === "1"; } catch { return false; }
  });
  const handleDesktopSoundChange = (next) => {
    setDesktopSound(next);
    try { localStorage.setItem("reel-sound-on", next ? "1" : "0"); } catch {}
  };

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
                  soundEnabled={desktopSound}
                  onSoundChange={handleDesktopSoundChange}
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
