"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";

function IcoChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}
function IcoBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10.5V9a6 6 0 0 0-12 0v1.5c0 2.7-1.2 3.8-2.2 5h16.4c-1-1.2-2.2-2.3-2.2-5Z"/>
      <path d="M9.7 18.5a2.5 2.5 0 0 0 4.6 0"/>
    </svg>
  );
}

export default function PageTopBar({
  title,
  kicker,
  user,
  currentLocale,
  showBack = false,
  backPath,
  unreadCount = 0,
}) {
  const router = useRouter();
  const [profilePhoto, setProfilePhoto] = useState(user?.photoURL || null);

  useEffect(() => {
    if (user?.photoURL) { setProfilePhoto(user.photoURL); return; }
    if (!user?.uid) return;
    import("@/lib/firebase").then(({ db }) => {
      if (!db) return;
      import("firebase/firestore").then(({ doc, getDoc }) => {
        getDoc(doc(db, "users", user.uid)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const photo = data.profileImageUrl || data.photoURL || data.avatarUrl || null;
            if (photo) setProfilePhoto(photo);
          }
        }).catch(() => {});
      });
    });
  }, [user?.uid, user?.photoURL]);

  const initial = (user?.displayName || user?.email || "U").charAt(0).toUpperCase();

  const handleBack = () => {
    if (backPath) router.push(backPath);
    else router.back();
  };

  return (
    <div style={s.bar}>
      {/* Left */}
      <div style={s.left}>
        {showBack ? (
          <button style={s.backBtn} onClick={handleBack} aria-label="Back">
            <IcoChevron />
          </button>
        ) : (
          <button style={s.logoBtn} onClick={() => router.push(`/${currentLocale}/reels`)}>
            <span style={s.logoG}>GAVANA</span>
            <span style={s.logoB}>BOXING</span>
          </button>
        )}
      </div>

      {/* Center */}
      <div style={s.center}>
        {kicker && <span style={s.kicker}>{kicker}</span>}
        {title && <span style={s.title}>{title}</span>}
      </div>

      {/* Right */}
      <div style={s.right}>
        {user && (
          <button
            style={{ ...s.iconBtn, position: "relative" }}
            onClick={() => router.push(`/${currentLocale}/notifications`)}
            aria-label="Notifications"
          >
            <IcoBell />
            {unreadCount > 0 && (
              <span style={s.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </button>
        )}
        <button
          style={s.avatarBtn}
          onClick={() => user?.uid
            ? router.push(`/${currentLocale}/profile/${user.uid}`)
            : router.push(`/${currentLocale}/login`)
          }
          aria-label="Profile"
        >
          {profilePhoto
            ? <img src={profilePhoto} alt="" style={s.avatarImg} />
            : <span style={s.avatarInitial}>{initial}</span>
          }
        </button>
      </div>
    </div>
  );
}

const s = {
  bar: {
    position: "sticky",
    top: 0,
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    padding: "0 16px",
    background: "rgba(11,11,12,0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingTop: "env(safe-area-inset-top)",
  },
  left: {
    display: "flex",
    alignItems: "center",
    minWidth: 80,
  },
  logoBtn: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    alignItems: "flex-start",
  },
  logoG: {
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: "0.06em",
    color: "#fff",
    lineHeight: 1,
    textShadow: `0 0 20px ${redAlpha(0.5)}`,
  },
  logoB: {
    fontSize: 7,
    fontWeight: 900,
    color: RED,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    lineHeight: 1,
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  kicker: {
    fontSize: 8,
    fontWeight: 900,
    color: RED,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    lineHeight: 1,
    marginBottom: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    lineHeight: 1.1,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 80,
    justifyContent: "flex-end",
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.55)",
    cursor: "pointer",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    padding: "0 3px",
    borderRadius: 7,
    background: RED,
    color: "#fff",
    border: "1.5px solid rgba(11,11,12,0.95)",
    fontSize: 8,
    fontWeight: 900,
    lineHeight: "11px",
    textAlign: "center",
    boxSizing: "border-box",
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    overflow: "hidden",
    border: `1.5px solid ${goldAlpha(0.2)}`,
    cursor: "pointer",
    background: `linear-gradient(135deg, ${RED}, #cc2820)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: 900,
    color: "#fff",
  },
};
