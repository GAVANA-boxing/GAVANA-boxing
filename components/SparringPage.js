"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, query, where, onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { startConversation } from "@/lib/messaging";
import { getFighterRank } from "@/lib/xp";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";

const ARCHETYPE_KEYS = ["all", "pressure", "counter", "technical", "brawler"];
const WEIGHT_OPTS = [
  "all",
  "Flyweight", "Bantamweight", "Featherweight", "Lightweight",
  "Welterweight", "Middleweight", "Light Heavyweight", "Heavyweight",
];

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

// ─── Fighter card ──────────────────────────────────────────────────────────────
function FighterCard({ post, isMe, onMessage, messaging, locale }) {
  const arch = ARCHETYPE_DISPLAY[post.archetype];
  const t = (key) => translate(locale, key);

  return (
    <div style={{
      ...c.card,
      borderLeft: `2.5px solid ${arch?.color || "#C1121F"}`,
      opacity: isMe ? 0.55 : 1,
    }}>
      {/* Top row: avatar + info */}
      <div style={c.cardTop}>
        <div style={c.avatarWrap}>
          {post.photoURL
            ? <img src={post.photoURL} alt="" style={c.avatar} />
            : <div style={{ ...c.avatarFallback, background: arch?.color ? `${arch.color}22` : "#1a1a1a" }}>
                {(post.displayName || "?").charAt(0).toUpperCase()}
              </div>
          }
          {arch && (
            <span style={{
              position: "absolute", bottom: -3, right: -3,
              fontSize: 13, lineHeight: 1,
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))",
            }}>{arch.emoji}</span>
          )}
        </div>

        <div style={c.infoBlock}>
          <div style={c.name}>{post.displayName || "Fighter"}</div>
          <div style={c.chips}>
            {post.rankKey && (
              <span style={{ ...c.chip, color: post.rankColor || "#fff", borderColor: `${post.rankColor || "#fff"}44` }}>
                {t(post.rankKey)}
              </span>
            )}
            {post.weightClass && (
              <span style={c.chip}>{post.weightClass.split(" ")[0]}</span>
            )}
            {arch && (
              <span style={{ ...c.chip, color: arch.color, borderColor: `${arch.color}44` }}>
                {arch.name}
              </span>
            )}
          </div>
          {post.location && (
            <div style={c.location}>📍 {post.location}</div>
          )}
          {post.bio && (
            <div style={c.bio}>{post.bio.slice(0, 72)}{post.bio.length > 72 ? "…" : ""}</div>
          )}
        </div>
      </div>

      {/* Action */}
      {!isMe && (
        <button
          type="button"
          onClick={() => onMessage(post)}
          disabled={messaging === post.userId}
          style={{
            ...c.msgBtn,
            opacity: messaging === post.userId ? 0.55 : 1,
            background: arch?.color
              ? `linear-gradient(135deg, ${arch.color}, ${arch.color}bb)`
              : "linear-gradient(135deg, #C1121F, #8f0d17)",
          }}
        >
          {messaging === post.userId
            ? "..."
            : <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Sparring хүс
              </>
          }
        </button>
      )}
      {isMe && (
        <div style={c.myLabel}>👆 Таны бичлэг</div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function SparringPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);

  const [posts, setPosts] = useState([]);
  const [myPost, setMyPost] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [messaging, setMessaging] = useState(null);
  const [filterArchetype, setFilterArchetype] = useState("all");
  const [filterWeight, setFilterWeight] = useState("all");

  // Load own user data for archetype / weight class / rank
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) setUserData(snap.data());
    }).catch(() => {});
  }, [user?.uid]);

  // Real-time sparring posts
  useEffect(() => {
    const q = query(collection(db, "sparring_posts"), where("lookingForSparring", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const uid = user?.uid;
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
      setMyPost(uid ? (all.find((p) => p.userId === uid) || null) : null);
      setPosts(all.filter((p) => p.userId !== uid));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user?.uid]);

  const handleToggle = async () => {
    if (!user) { router.push(`/${locale}/login`); return; }
    if (toggling) return;
    setToggling(true);
    try {
      const ref = doc(db, "sparring_posts", user.uid);
      if (myPost) {
        await deleteDoc(ref);
      } else {
        const xp = Number(userData?.xp) || 0;
        const rank = getFighterRank(xp);
        await setDoc(ref, {
          userId: user.uid,
          displayName: user.displayName || userData?.username || userData?.displayName || "",
          photoURL: user.photoURL || userData?.profileImageUrl || userData?.photoURL || "",
          archetype: userData?.fighterArchetype || null,
          weightClass: userData?.weightClass || null,
          bio: userData?.bio || "",
          rankKey: rank.key,
          rankColor: rank.color,
          location: userData?.location || null,
          lookingForSparring: true,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error("Sparring toggle error:", e);
    } finally {
      setToggling(false);
    }
  };

  const handleMessage = async (post) => {
    if (!user) { router.push(`/${locale}/login`); return; }
    setMessaging(post.userId);
    try {
      const convoId = await startConversation(user, post.userId, {
        displayName: post.displayName,
        photoURL: post.photoURL,
      });
      router.push(`/${locale}/inbox/${convoId}`);
    } catch (e) {
      console.error("Message error:", e);
      setMessaging(null);
    }
  };

  const filtered = posts.filter((p) => {
    if (filterArchetype !== "all" && p.archetype !== filterArchetype) return false;
    if (filterWeight !== "all" && !p.weightClass?.includes(filterWeight)) return false;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div style={s.loadWrap}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.spinner} />
      </div>
    );
  }

  const isOn = !!myPost;

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={s.header}>
        <button type="button" onClick={() => router.back()} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div style={s.headerCenter}>
          <div style={s.headerKicker}>GAVANA</div>
          <div style={s.headerTitle}>Sparring Matchmaking</div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Availability toggle banner */}
      {user && (
        <div style={{ ...s.toggleBanner, background: isOn ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)", borderColor: isOn ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.07)" }}>
          <div style={s.toggleLeft}>
            <div style={{ ...s.toggleDot, background: isOn ? "#34D399" : "rgba(255,255,255,0.2)", boxShadow: isOn ? "0 0 8px #34D399" : "none" }} />
            <div>
              <div style={{ ...s.toggleTitle, color: isOn ? "#34D399" : "rgba(255,255,255,0.7)" }}>
                {isOn ? "Та sparring хайж байна" : "Sparring хайж байна уу?"}
              </div>
              <div style={s.toggleSub}>
                {isOn ? "Бусад тулаанчид таны бичлэгийг харж мессеж илгээх боломжтой" : "Идэвхжүүлбэл тулаанчид чамайг харна"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            style={{
              ...s.toggleBtn,
              background: isOn ? "rgba(52,211,153,0.15)" : "linear-gradient(135deg, #C1121F, #8f0d17)",
              border: isOn ? "1px solid rgba(52,211,153,0.3)" : "none",
              color: isOn ? "#34D399" : "#fff",
              opacity: toggling ? 0.6 : 1,
            }}
          >
            {toggling ? "..." : isOn ? "Унтраах" : "Идэвхжүүлэх"}
          </button>
        </div>
      )}

      {/* My card preview if ON */}
      {myPost && (
        <div style={{ padding: "0 16px 4px" }}>
          <FighterCard post={myPost} isMe onMessage={() => {}} messaging={null} locale={locale} />
        </div>
      )}

      {/* Filters */}
      <div style={s.filterSection}>
        {/* Archetype filter */}
        <div style={s.filterRow}>
          {ARCHETYPE_KEYS.map((key) => {
            const arch = ARCHETYPE_DISPLAY[key];
            const active = filterArchetype === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterArchetype(key)}
                style={{
                  ...s.filterChip,
                  ...(active ? {
                    background: arch ? `${arch.color}18` : "rgba(193,18,31,0.15)",
                    border: `1px solid ${arch ? arch.color : "#C1121F"}55`,
                    color: arch ? arch.color : "#fff",
                  } : {}),
                }}
              >
                {key === "all" ? "Бүгд" : `${arch?.emoji} ${arch?.name.split(" ")[0]}`}
              </button>
            );
          })}
        </div>

        {/* Weight filter */}
        <select
          value={filterWeight}
          onChange={(e) => setFilterWeight(e.target.value)}
          style={s.weightSelect}
        >
          {WEIGHT_OPTS.map((w) => (
            <option key={w} value={w}>{w === "all" ? "Жингийн ангилал — Бүгд" : w}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      <div style={s.countBar}>
        <span style={s.countTxt}>
          {filtered.length === 0
            ? "Sparring хайж байгаа тулаанч байхгүй"
            : `${filtered.length} тулаанч sparring хайж байна`}
        </span>
      </div>

      {/* List */}
      <div style={s.list}>
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>🥊</div>
            <p style={s.emptyTitle}>
              {filterArchetype !== "all" || filterWeight !== "all"
                ? "Энэ filter-тэй тулаанч алга"
                : "Одоогоор хэн ч sparring хайж байхгүй"}
            </p>
            <p style={s.emptySub}>
              Та эхлээд "Идэвхжүүлэх" товч дарж өөрийгөө бүртгүүлэх боломжтой.
            </p>
          </div>
        ) : (
          filtered.map((post) => (
            <div key={post.id} style={{ padding: "0 16px 8px" }}>
              <FighterCard
                post={post}
                isMe={false}
                onMessage={handleMessage}
                messaging={messaging}
                locale={locale}
              />
            </div>
          ))
        )}
        <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: "100dvh", background: "#070707", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" },
  loadWrap: { minHeight: "100dvh", background: "#070707", display: "flex", alignItems: "center", justifyContent: "center" },
  spinner: { width: 26, height: 26, border: "2px solid #C1121F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  header: {
    position: "sticky", top: 0, zIndex: 20,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(14px + env(safe-area-inset-top)) 16px 12px",
    background: "rgba(7,7,7,0.96)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.7)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  headerCenter: { textAlign: "center" },
  headerKicker: { fontSize: 9, fontWeight: 900, color: "rgba(193,18,31,0.7)", letterSpacing: 3, textTransform: "uppercase" },
  headerTitle: { fontSize: 15, fontWeight: 900, color: "#fff" },
  toggleBanner: {
    margin: "12px 16px 4px", borderRadius: 14,
    border: "1px solid",
    padding: "12px 14px",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    transition: "all 300ms ease",
  },
  toggleLeft: { display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 },
  toggleDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 4, transition: "all 300ms ease" },
  toggleTitle: { fontSize: 13, fontWeight: 800, marginBottom: 2, transition: "color 300ms ease" },
  toggleSub: { fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.45 },
  toggleBtn: {
    flexShrink: 0, padding: "8px 14px", borderRadius: 999,
    fontSize: 12, fontWeight: 900, cursor: "pointer",
    whiteSpace: "nowrap", transition: "all 200ms ease",
  },
  filterSection: { padding: "10px 16px 0", display: "flex", flexDirection: "column", gap: 8 },
  filterRow: { display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" },
  filterChip: {
    flexShrink: 0, padding: "6px 12px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.38)", fontSize: 12, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap",
  },
  weightSelect: {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.55)", fontSize: 12, outline: "none",
    appearance: "none",
  },
  countBar: { padding: "10px 16px 4px" },
  countTxt: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: 0.4 },
  list: { flex: 1, display: "flex", flexDirection: "column", padding: "4px 0 0" },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "48px 32px", gap: 10,
  },
  emptyTitle: { margin: 0, fontSize: 16, fontWeight: 900, color: "#fff", textAlign: "center" },
  emptySub: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 1.55, maxWidth: 280 },
};

const c = {
  card: {
    background: "linear-gradient(145deg, #111012 0%, #0a0a0a 100%)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "3px 14px 14px 3px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
    padding: "13px 13px 10px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  cardTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: { width: 48, height: 48, borderRadius: "50%", objectFit: "cover", display: "block" },
  avatarFallback: {
    width: 48, height: 48, borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 900, color: "#fff",
  },
  infoBlock: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 5, lineHeight: 1 },
  chips: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 4 },
  chip: {
    fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.45)",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 999, padding: "2px 8px",
  },
  location: { fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 3 },
  bio: { fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.45 },
  msgBtn: {
    width: "100%", padding: "10px", borderRadius: 10, border: "none",
    color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    boxShadow: "0 4px 16px rgba(193,18,31,0.25)",
  },
  myLabel: {
    textAlign: "center", fontSize: 11, fontWeight: 700,
    color: "rgba(255,255,255,0.28)", padding: "2px 0",
  },
};
