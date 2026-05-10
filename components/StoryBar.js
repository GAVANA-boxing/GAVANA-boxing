"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import StoryViewer from "./StoryViewer";
import { translate } from "@/lib/i18n";

const RING_GRADIENTS = [
  "linear-gradient(135deg, #C1121F, #D4AF37)",
  "linear-gradient(135deg, #D4AF37, #F87171)",
  "linear-gradient(135deg, #7d0812, #D4AF37)",
  "linear-gradient(135deg, #F87171, #C1121F)",
];

function isAlive(story) {
  const exp = story.expiresAt?.toDate ? story.expiresAt.toDate() : story.expiresAt ? new Date(story.expiresAt) : null;
  return exp && exp > new Date();
}

export default function StoryBar({ locale, router }) {
  const { user } = useAuth();
  const t = (key) => translate(locale, key);
  const [groups, setGroups] = useState([]);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    getDocs(collection(db, "stories"))
      .then(snap => {
        const all = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(isAlive);

        const map = new Map();
        all.forEach(s => {
          if (!map.has(s.userId)) map.set(s.userId, []);
          map.get(s.userId).push(s);
        });

        const grps = Array.from(map.entries()).map(([uid, list]) => ({
          userId: uid,
          stories: list.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)),
          displayName: list[0]?.displayName || list[0]?.username || "Boxer",
          photoURL: list[0]?.photoURL || "",
          isOwn: uid === user?.uid,
        }));

        grps.sort((a, b) => (b.isOwn ? 1 : 0) - (a.isOwn ? 1 : 0));
        setGroups(grps);
      })
      .catch(() => {});
  }, [user?.uid]);

  const ownGroup = groups.find(g => g.isOwn);
  const others = groups.filter(g => !g.isOwn);

  return (
    <>
      <div style={st.bar}>
        {/* Your story */}
        <button
          type="button"
          style={st.slot}
          onClick={() => ownGroup ? setViewing(ownGroup) : router.push(`/${locale}/story/upload`)}
        >
          <div style={ownGroup ? st.ownRingActive : st.ownRingEmpty}>
            {user?.photoURL
              ? <img src={user.photoURL} style={st.avatar} alt="" />
              : <div style={st.avatarFallback}>{user?.displayName?.[0]?.toUpperCase() || "+"}</div>
            }
            {!ownGroup && <div style={st.addBadge}>+</div>}
          </div>
          <span style={st.label}>{t("storyYours")}</span>
        </button>

        {/* Other users */}
        {others.map((grp, i) => (
          <button type="button" key={grp.userId} style={st.slot} onClick={() => setViewing(grp)}>
            <div style={{ ...st.ring, background: RING_GRADIENTS[i % RING_GRADIENTS.length] }}>
              <div style={st.avatarFrame}>
                {grp.photoURL
                  ? <img src={grp.photoURL} style={st.avatar} alt="" />
                  : <div style={st.avatarFallback}>{grp.displayName[0]?.toUpperCase()}</div>
                }
              </div>
            </div>
            <span style={st.label}>{grp.displayName.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {viewing && (
        <StoryViewer
          stories={viewing.stories}
          onClose={() => setViewing(null)}
          locale={locale}
          currentUser={user}
        />
      )}
    </>
  );
}

const INNER = 56;
const RING_SIZE = INNER + 8; // 4px gradient ring each side

const st = {
  bar: {
    display: "flex",
    gap: 14,
    overflowX: "auto",
    padding: "14px 16px 16px",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    WebkitOverflowScrolling: "touch",
  },
  slot: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 7,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    WebkitTapHighlightColor: "transparent",
  },
  // Active own story — vivid red/gold gradient ring
  ownRingActive: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #C1121F 0%, #D4AF37 50%, #C1121F 100%)",
    padding: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    boxShadow: "0 0 0 0 rgba(193,18,31,0), 0 0 22px rgba(193,18,31,0.45), 0 0 8px rgba(212,175,55,0.22)",
  },
  // Empty own ring — GAVANA-styled dashed add indicator
  ownRingEmpty: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: "50%",
    background: "rgba(193,18,31,0.08)",
    border: "1.5px dashed rgba(193,18,31,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  // Other users' rings — gradient + glow
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: "50%",
    padding: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 16px rgba(193,18,31,0.28), 0 0 6px rgba(212,175,55,0.12)",
  },
  avatarFrame: {
    width: INNER,
    height: INNER,
    borderRadius: "50%",
    border: "2.5px solid #080808",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #1a0303, #0d0d0d)",
    flexShrink: 0,
  },
  avatar: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" },
  avatarFallback: {
    width: INNER,
    height: INNER,
    borderRadius: "50%",
    background: "radial-gradient(ellipse at 50% 30%, rgba(193,18,31,0.35), rgba(10,2,2,0.95))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: -0.5,
  },
  addBadge: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #C1121F, #8B000D)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #080808",
    boxShadow: "0 2px 10px rgba(193,18,31,0.65)",
  },
  label: {
    fontSize: 9,
    fontWeight: 700,
    color: "rgba(255,255,255,0.35)",
    maxWidth: 64,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: "center",
    letterSpacing: 0.3,
  },
};
