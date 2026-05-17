"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  addDoc, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc,
  collection, query, where, onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { startConversation } from "@/lib/messaging";
import { createNotification } from "@/lib/notifications";
import { getFighterRank } from "@/lib/xp";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import BottomNav from "@/components/BottomNav";

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

function formatAgo(ts, locale) {
  const ms = getTs(ts);
  if (!ms) return "";
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 60) return locale === "mn" ? "Одоо" : locale === "ko" ? "방금" : "Just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return locale === "mn" ? `${m}мин өмнө` : locale === "ko" ? `${m}분 전` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return locale === "mn" ? `${h}ц өмнө` : locale === "ko" ? `${h}시간 전` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return locale === "mn" ? `${d} өдрийн өмнө` : locale === "ko" ? `${d}일 전` : `${d}d ago`;
}

// ─── Fighter card (Discover tab) ──────────────────────────────────────────────
function FighterCard({ post, isMe, onRequest, sent, requesting, locale }) {
  const arch = ARCHETYPE_DISPLAY[post.archetype];
  const t = (key) => translate(locale, key);
  const isBusy = requesting === post.userId;

  return (
    <div style={{
      ...c.card,
      borderLeft: `2.5px solid ${arch?.color || "#C1121F"}`,
      opacity: isMe ? 0.55 : 1,
    }}>
      <div style={c.cardTop}>
        <div style={c.avatarWrap}>
          {post.photoURL
            ? <img src={post.photoURL} alt="" style={c.avatar} />
            : <div style={{ ...c.avatarFallback, background: arch?.color ? `${arch.color}22` : "#1a1a1a" }}>
                {(post.displayName || "?").charAt(0).toUpperCase()}
              </div>
          }
          {arch && (
            <span style={{ position: "absolute", bottom: -3, right: -3, fontSize: 13, lineHeight: 1, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.7))" }}>
              {arch.emoji}
            </span>
          )}
        </div>

        <div style={c.infoBlock}>
          <div style={c.name}>{post.displayName || "Fighter"}</div>
          <div style={c.chips}>
            {post.rankKey && (
              <span style={{ ...c.chip, color: post.rankColor || "#fff", background: `${post.rankColor || "#fff"}14`, borderColor: `${post.rankColor || "#fff"}44` }}>
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
          {post.location && <div style={c.location}>📍 {post.location}</div>}
          {post.bio && <div style={c.bio}>{post.bio.slice(0, 72)}{post.bio.length > 72 ? "…" : ""}</div>}
        </div>
      </div>

      {!isMe && (
        <button
          type="button"
          onClick={() => !sent && !isBusy && onRequest(post)}
          disabled={sent || isBusy}
          style={{
            ...c.msgBtn,
            background: sent
              ? "rgba(52,211,153,0.1)"
              : isBusy
              ? "rgba(255,255,255,0.06)"
              : arch?.color
              ? `linear-gradient(135deg, ${arch.color}, ${arch.color}bb)`
              : "linear-gradient(135deg, #C1121F, #8f0d17)",
            border: sent ? "1px solid rgba(52,211,153,0.3)" : "none",
            color: sent ? "#34D399" : "#fff",
            cursor: sent ? "not-allowed" : isBusy ? "wait" : "pointer",
          }}
        >
          {isBusy ? "…"
            : sent
            ? (locale === "mn" ? "✓ Хүсэлт илгээсэн" : locale === "ko" ? "✓ 요청 전송됨" : "✓ Request Sent")
            : <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {locale === "mn" ? "Sparring хүс" : locale === "ko" ? "스파링 요청" : "Request Sparring"}
              </>
          }
        </button>
      )}
      {isMe && <div style={c.myLabel}>👆 {locale === "mn" ? "Таны бичлэг" : locale === "ko" ? "내 게시물" : "Your post"}</div>}
    </div>
  );
}

// ─── Incoming request card ─────────────────────────────────────────────────────
function IncomingRequestCard({ req, onAccept, onDecline, onMessage, accepting, declining, locale }) {
  const arch = ARCHETYPE_DISPLAY[req.fromArchetype];
  const isBusy = accepting === req.id || declining === req.id;
  const timeAgo = formatAgo(req.createdAt, locale);

  return (
    <div style={{
      ...c.card,
      borderLeft: "2.5px solid #D4AF37",
    }}>
      <div style={c.cardTop}>
        <div style={c.avatarWrap}>
          {req.fromPhotoURL
            ? <img src={req.fromPhotoURL} alt="" style={c.avatar} />
            : <div style={{ ...c.avatarFallback, background: "#1a1a1a" }}>
                {(req.fromDisplayName || "?").charAt(0).toUpperCase()}
              </div>
          }
          {arch && (
            <span style={{ position: "absolute", bottom: -3, right: -3, fontSize: 13, lineHeight: 1 }}>
              {arch.emoji}
            </span>
          )}
        </div>
        <div style={c.infoBlock}>
          <div style={c.name}>{req.fromDisplayName || "Fighter"}</div>
          <div style={c.chips}>
            {arch && <span style={{ ...c.chip, color: arch.color, borderColor: `${arch.color}44` }}>{arch.name}</span>}
            {req.fromWeightClass && <span style={c.chip}>{req.fromWeightClass.split(" ")[0]}</span>}
          </div>
          {timeAgo && <div style={c.location}>🕐 {timeAgo}</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => !isBusy && onAccept(req)}
          disabled={isBusy}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
            background: isBusy && accepting === req.id ? "rgba(52,211,153,0.08)" : "linear-gradient(135deg, #34D399, #22a870)",
            color: "#fff", fontSize: 13, fontWeight: 900,
            cursor: isBusy ? "wait" : "pointer",
            opacity: isBusy ? 0.7 : 1,
          }}
        >
          {accepting === req.id ? "…" : locale === "mn" ? "✓ Зөвшөөрөх" : locale === "ko" ? "✓ 수락" : "✓ Accept"}
        </button>
        <button
          type="button"
          onClick={() => !isBusy && onDecline(req)}
          disabled={isBusy}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10,
            border: "1px solid rgba(248,113,113,0.3)",
            background: "rgba(248,113,113,0.07)",
            color: "#F87171", fontSize: 13, fontWeight: 900,
            cursor: isBusy ? "wait" : "pointer",
            opacity: isBusy ? 0.7 : 1,
          }}
        >
          {declining === req.id ? "…" : locale === "mn" ? "✕ Татгалзах" : locale === "ko" ? "✕ 거절" : "✕ Decline"}
        </button>
      </div>
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

  const [tab, setTab] = useState("discover");
  const [posts, setPosts] = useState([]);
  const [myPost, setMyPost] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequestToIds, setSentRequestToIds] = useState(new Set());
  const [sentRequests, setSentRequests] = useState([]);
  const [requestsSubTab, setRequestsSubTab] = useState("received");
  const [cancelling, setCancelling] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [requesting, setRequesting] = useState(null);
  const [accepting, setAccepting] = useState(null);
  const [declining, setDeclining] = useState(null);
  const [filterArchetype, setFilterArchetype] = useState("all");
  const [filterWeight, setFilterWeight] = useState("all");
  const [matchHistory, setMatchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Own user data
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
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
      setMyPost(uid ? (all.find((p) => p.userId === uid) || null) : null);
      setPosts(all.filter((p) => p.userId !== uid));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user?.uid]);

  // Real-time incoming requests
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "sparring_requests"), where("toUserId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setIncomingRequests(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt))
      );
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

  // Real-time sent requests — track which users already have a request + full docs
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "sparring_requests"), where("fromUserId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
      setSentRequestToIds(new Set(docs.map((d) => d.toUserId)));
      setSentRequests(docs);
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

  // Load match history when history tab opened (challenger + opponent)
  useEffect(() => {
    if (tab !== "history" || !user?.uid) return;
    let active = true;
    setHistoryLoading(true);
    Promise.all([
      getDocs(query(collection(db, "pvp_results"), where("challengerId", "==", user.uid))),
      getDocs(query(collection(db, "pvp_results"), where("opponentId", "==", user.uid))),
    ]).then(([asChallenger, asOpponent]) => {
      if (!active) return;
      const fromChallenger = asChallenger.docs.map((d) => ({ id: d.id, ...d.data() }));
      const fromOpponent = asOpponent.docs.map((d) => {
        const data = d.data();
        const result = data.result === "win" ? "loss" : data.result === "loss" ? "win" : data.result;
        return {
          id: d.id,
          ...data,
          result,
          opponentName: data.challengerName || data.challengerDisplayName || "Opponent",
          challengerScore: data.opponentScore,
          opponentScore: data.challengerScore,
        };
      });
      const seen = new Set(fromChallenger.map((d) => d.id));
      const unique = [...fromChallenger, ...fromOpponent.filter((d) => !seen.has(d.id))];
      unique.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setMatchHistory(unique);
    }).catch(() => {}).finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [tab, user?.uid]);

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

  const handleRequest = async (post) => {
    if (!user) { router.push(`/${locale}/login`); return; }
    if (requesting) return;
    setRequesting(post.userId);
    try {
      const xp = Number(userData?.xp) || 0;
      const rank = getFighterRank(xp);
      await addDoc(collection(db, "sparring_requests"), {
        fromUserId: user.uid,
        fromDisplayName: user.displayName || userData?.username || userData?.displayName || "",
        fromPhotoURL: user.photoURL || userData?.profileImageUrl || userData?.photoURL || "",
        fromArchetype: userData?.fighterArchetype || null,
        fromWeightClass: userData?.weightClass || null,
        fromRankKey: rank.key,
        toUserId: post.userId,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      await createNotification({
        recipientId: post.userId,
        actorId: user.uid,
        actorName: user.displayName || userData?.username || "",
        actorPhotoURL: user.photoURL || userData?.photoURL || "",
        type: "sparring_request",
        text: locale === "mn"
          ? `${user.displayName || userData?.username || "Тулаанч"} sparring хүсэлт илгээлээ`
          : locale === "ko"
          ? `${user.displayName || userData?.username || "파이터"}님이 스파링을 요청했습니다`
          : `${user.displayName || userData?.username || "A fighter"} wants to spar with you`,
      });
    } catch (e) {
      console.error("Sparring request error:", e);
    } finally {
      setRequesting(null);
    }
  };

  const handleAccept = async (req) => {
    if (accepting) return;
    setAccepting(req.id);
    try {
      await updateDoc(doc(db, "sparring_requests", req.id), { status: "accepted" });
      // Mark both users as having a sparring partner (FighterPath step)
      await Promise.all([
        updateDoc(doc(db, "users", user.uid), { hasSparringPartner: true }),
        updateDoc(doc(db, "users", req.fromUserId), { hasSparringPartner: true }).catch(() => {}),
      ]);
      await createNotification({
        recipientId: req.fromUserId,
        actorId: user.uid,
        actorName: user.displayName || userData?.username || "",
        actorPhotoURL: user.photoURL || userData?.photoURL || "",
        type: "sparring_accepted",
        text: locale === "mn"
          ? `${user.displayName || userData?.username || "Тулаанч"} sparring хүсэлтийг зөвшөөрлөө`
          : locale === "ko"
          ? `${user.displayName || userData?.username || "파이터"}님이 스파링을 수락했습니다`
          : `${user.displayName || userData?.username || "A fighter"} accepted your sparring request`,
      });
      const convoId = await startConversation(user, req.fromUserId, {
        displayName: req.fromDisplayName,
        photoURL: req.fromPhotoURL,
      });
      router.push(`/${locale}/inbox/${convoId}`);
    } catch (e) {
      console.error("Accept sparring error:", e);
    } finally {
      setAccepting(null);
    }
  };

  const handleDecline = async (req) => {
    if (declining) return;
    setDeclining(req.id);
    try {
      await updateDoc(doc(db, "sparring_requests", req.id), { status: "declined" });
    } catch (e) {
      console.error("Decline sparring error:", e);
    } finally {
      setDeclining(null);
    }
  };

  const handleCancelSparringRequest = async (req) => {
    if (cancelling) return;
    setCancelling(req.id);
    try {
      await deleteDoc(doc(db, "sparring_requests", req.id));
    } catch (e) {
      console.error("Cancel sparring request error:", e);
    } finally {
      setCancelling(null);
    }
  };

  const filtered = posts.filter((p) => {
    if (filterArchetype !== "all" && p.archetype !== filterArchetype) return false;
    if (filterWeight !== "all" && !p.weightClass?.includes(filterWeight)) return false;
    return true;
  });

  const pendingIncoming = incomingRequests.filter((r) => r.status === "pending");
  const resolvedIncoming = incomingRequests.filter((r) => r.status !== "pending");

  if (authLoading || loading) {
    return (
      <div style={{ ...s.page, padding: "calc(60px + env(safe-area-inset-top)) 16px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3].map((i) => <div key={i} className="shimmer" style={{ height: 110, borderRadius: 14 }} />)}
        </div>
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
          <div style={s.headerTitle}>{t("sparringMatchmaking")}</div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Tab bar */}
      <div style={s.tabBar}>
        {[
          { key: "discover", label: locale === "mn" ? "🥊 Хайх"   : locale === "ko" ? "🥊 탐색"   : "🥊 Discover" },
          { key: "requests", label: locale === "mn" ? "📬 Хүсэлт" : locale === "ko" ? "📬 요청"   : "📬 Requests", badge: pendingIncoming.length },
          { key: "mine",     label: locale === "mn" ? "👤 Миний"   : locale === "ko" ? "👤 내 게시물" : "👤 Mine" },
          { key: "history",  label: locale === "mn" ? "📊 Түүх"   : locale === "ko" ? "📊 기록"   : "📊 History" },
        ].map(({ key, label, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{ ...s.tabBtn, ...(tab === key ? s.tabBtnActive : {}) }}
          >
            {label}
            {badge > 0 && (
              <span style={s.tabBadge}>{badge > 9 ? "9+" : badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── DISCOVER TAB ── */}
      {tab === "discover" && (
        <>
          {/* Filters */}
          <div style={s.filterSection}>
            <div style={s.filterRow}>
              {ARCHETYPE_KEYS.map((key) => {
                const arch = ARCHETYPE_DISPLAY[key];
                const active = filterArchetype === key;
                return (
                  <button key={key} type="button" onClick={() => setFilterArchetype(key)} style={{
                    ...s.filterChip,
                    ...(active ? { background: arch ? `${arch.color}18` : "rgba(193,18,31,0.15)", border: `1px solid ${arch ? arch.color : "#C1121F"}55`, color: arch ? arch.color : "#fff" } : {}),
                  }}>
                    {key === "all" ? (locale === "mn" ? "Бүгд" : locale === "ko" ? "전체" : "All") : `${arch?.emoji} ${arch?.name.split(" ")[0]}`}
                  </button>
                );
              })}
            </div>
            <select value={filterWeight} onChange={(e) => setFilterWeight(e.target.value)} style={s.weightSelect}>
              {WEIGHT_OPTS.map((w) => (
                <option key={w} value={w}>{w === "all" ? (locale === "mn" ? "Жингийн ангилал — Бүгд" : locale === "ko" ? "체급 — 전체" : "Weight Class — All") : w}</option>
              ))}
            </select>
          </div>

          <div style={s.countBar}>
            <span style={s.countTxt}>
              {filtered.length === 0
                ? (locale === "mn" ? "Sparring хайж байгаа тулаанч байхгүй" : locale === "ko" ? "스파링 중인 선수 없음" : "No fighters looking for sparring")
                : locale === "mn" ? `${filtered.length} тулаанч sparring хайж байна` : locale === "ko" ? `${filtered.length}명 스파링 중` : `${filtered.length} fighter${filtered.length > 1 ? "s" : ""} looking for sparring`}
            </span>
          </div>

          <div style={s.list}>
            {filtered.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 52, marginBottom: 8 }}>🥊</div>
                <p style={s.emptyTitle}>
                  {filterArchetype !== "all" || filterWeight !== "all"
                    ? (locale === "mn" ? "Энэ filter-тэй тулаанч алга" : locale === "ko" ? "해당 필터에 선수 없음" : "No fighters match this filter")
                    : (locale === "mn" ? "Одоогоор хэн ч sparring хайж байхгүй" : locale === "ko" ? "현재 스파링 파트너를 찾는 선수가 없습니다" : "No one looking for sparring yet")}
                </p>
                <p style={s.emptySub}>
                  {locale === "mn" ? `"Миний" табаас өөрийгөө бүртгүүлэх боломжтой.` : locale === "ko" ? `"내 게시물" 탭에서 본인을 등록하세요.` : `Go to "Mine" tab to add yourself.`}
                </p>
              </div>
            ) : (
              filtered.map((post) => (
                <div key={post.id} style={{ padding: "0 16px 8px" }}>
                  <FighterCard
                    post={post}
                    isMe={false}
                    onRequest={handleRequest}
                    sent={sentRequestToIds.has(post.userId)}
                    requesting={requesting}
                    locale={locale}
                  />
                </div>
              ))
            )}
            <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
          </div>
        </>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <div style={s.list}>
          {/* Sent / Received sub-tabs */}
          <div style={{ display: "flex", gap: 0, margin: "10px 16px 4px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
            {[
              { key: "received", label: locale === "mn" ? "📬 Ирсэн" : locale === "ko" ? "📬 받은" : "📬 Received", count: pendingIncoming.length },
              { key: "sent",     label: locale === "mn" ? "📤 Илгээсэн" : locale === "ko" ? "📤 보낸" : "📤 Sent", count: sentRequests.filter((r) => r.status === "pending").length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRequestsSubTab(key)}
                style={{
                  flex: 1, padding: "10px 8px", border: "none",
                  background: requestsSubTab === key ? "rgba(193,18,31,0.2)" : "transparent",
                  color: requestsSubTab === key ? "#fff" : "rgba(255,255,255,0.4)",
                  fontSize: 12, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{ minWidth: 16, height: 16, borderRadius: 999, background: "#C1121F", color: "#fff", fontSize: 9, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {!user ? (
            <div style={s.empty}>
              <p style={s.emptyTitle}>{locale === "mn" ? "Нэвтрэх шаардлагатай" : locale === "ko" ? "로그인이 필요합니다" : "Login required"}</p>
            </div>
          ) : requestsSubTab === "received" ? (
            pendingIncoming.length === 0 && resolvedIncoming.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📬</div>
                <p style={s.emptyTitle}>{locale === "mn" ? "Хүсэлт ирээгүй байна" : locale === "ko" ? "받은 요청 없음" : "No requests received"}</p>
                <p style={s.emptySub}>{locale === "mn" ? "Sparring post идэвхжүүлэхэд хүсэлтүүд энд гарч ирнэ." : locale === "ko" ? "스파링 게시물을 활성화하면 요청이 여기에 표시됩니다." : "Enable your sparring post and requests will appear here."}</p>
              </div>
            ) : (
              <>
                {pendingIncoming.length > 0 && (
                  <>
                    <div style={s.sectionLabel}>
                      {locale === "mn" ? "⏳ Хүлээгдэж байгаа хүсэлтүүд" : locale === "ko" ? "⏳ 대기 중인 요청" : "⏳ Pending requests"}
                    </div>
                    {pendingIncoming.map((req) => (
                      <div key={req.id} style={{ padding: "0 16px 8px" }}>
                        <IncomingRequestCard
                          req={req}
                          onAccept={handleAccept}
                          onDecline={handleDecline}
                          accepting={accepting}
                          declining={declining}
                          locale={locale}
                        />
                      </div>
                    ))}
                  </>
                )}
                {resolvedIncoming.length > 0 && (
                  <>
                    <div style={s.sectionLabel}>
                      {locale === "mn" ? "Дууссан хүсэлтүүд" : locale === "ko" ? "처리된 요청" : "Resolved requests"}
                    </div>
                    {resolvedIncoming.map((req) => {
                      const isAccepted = req.status === "accepted";
                      const col = isAccepted ? "#34D399" : "#F87171";
                      const ago = formatAgo(req.createdAt, locale);
                      return (
                        <div key={req.id} style={{ padding: "0 16px 8px" }}>
                          <div style={{ ...c.card, borderLeft: `2.5px solid ${col}`, opacity: 0.65 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {req.fromPhotoURL
                                  ? <img src={req.fromPhotoURL} alt="" style={{ ...c.avatar, width: 36, height: 36 }} />
                                  : <div style={{ ...c.avatarFallback, width: 36, height: 36, fontSize: 14 }}>{(req.fromDisplayName || "?").charAt(0).toUpperCase()}</div>
                                }
                                <div>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{req.fromDisplayName || "Fighter"}</span>
                                  {ago && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>🕐 {ago}</div>}
                                </div>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 900, color: col }}>
                                {isAccepted ? (locale === "mn" ? "✓ Зөвшөөрсөн" : locale === "ko" ? "✓ 수락됨" : "✓ Accepted") : (locale === "mn" ? "✕ Татгалзсан" : locale === "ko" ? "✕ 거절됨" : "✕ Declined")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )
          ) : (
            // Sent requests sub-tab
            sentRequests.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📤</div>
                <p style={s.emptyTitle}>{locale === "mn" ? "Илгээсэн хүсэлт байхгүй" : locale === "ko" ? "보낸 요청 없음" : "No requests sent"}</p>
                <p style={s.emptySub}>{locale === "mn" ? "Discover табаас тулаанч олж sparring хүсэлт илгээгээрэй." : locale === "ko" ? "탐색 탭에서 파이터를 찾아 스파링 요청을 보내세요." : "Find fighters in the Discover tab and send sparring requests."}</p>
              </div>
            ) : (
              <>
                {sentRequests.map((req) => {
                  const isPending = req.status === "pending";
                  const isAccepted = req.status === "accepted";
                  const col = isAccepted ? "#34D399" : isPending ? "#F59E0B" : "#F87171";
                  const ago = formatAgo(req.createdAt, locale);
                  const isBusy = cancelling === req.id;
                  return (
                    <div key={req.id} style={{ padding: "0 16px 8px" }}>
                      <div style={{ ...c.card, borderLeft: `2.5px solid ${col}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                              {locale === "mn" ? "Sparring хүсэлт илгээсэн" : locale === "ko" ? "스파링 요청 보냄" : "Sparring request sent"}
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: col }}>
                                {isAccepted ? (locale === "mn" ? "✓ Зөвшөөрсөн" : locale === "ko" ? "✓ 수락됨" : "✓ Accepted")
                                  : isPending ? (locale === "mn" ? "⏳ Хүлээгдэж байна" : locale === "ko" ? "⏳ 대기 중" : "⏳ Pending")
                                  : (locale === "mn" ? "✕ Татгалзсан" : locale === "ko" ? "✕ 거절됨" : "✕ Declined")}
                              </span>
                              {ago && <span style={{ fontSize: 10, color: "#666" }}>· {ago}</span>}
                            </div>
                          </div>
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => !isBusy && handleCancelSparringRequest(req)}
                              disabled={isBusy}
                              style={{
                                flexShrink: 0, padding: "7px 12px", borderRadius: 8,
                                border: "1px solid rgba(248,113,113,0.3)",
                                background: "rgba(248,113,113,0.07)",
                                color: "#F87171", fontSize: 11, fontWeight: 900,
                                cursor: isBusy ? "wait" : "pointer", opacity: isBusy ? 0.6 : 1,
                              }}
                            >
                              {isBusy ? "…" : (locale === "mn" ? "Цуцлах" : locale === "ko" ? "취소" : "Cancel")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )
          )}
          <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
        </div>
      )}

      {/* ── MINE TAB ── */}
      {tab === "mine" && (
        <div style={s.list}>
          {/* Toggle banner */}
          {user && (
            <div style={{ padding: "12px 16px 4px" }}>
              <div style={{ ...s.toggleBanner, background: isOn ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)", borderColor: isOn ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.07)" }}>
                <div style={s.toggleLeft}>
                  <div style={{ ...s.toggleDot, background: isOn ? "#34D399" : "rgba(255,255,255,0.2)", boxShadow: isOn ? "0 0 8px #34D399" : "none" }} />
                  <div>
                    <div style={{ ...s.toggleTitle, color: isOn ? "#34D399" : "rgba(255,255,255,0.7)" }}>
                      {isOn
                        ? (locale === "mn" ? "Та sparring хайж байна" : locale === "ko" ? "스파링 파트너 찾는 중" : "You're looking for sparring")
                        : (locale === "mn" ? "Sparring хайж байна уу?" : locale === "ko" ? "스파링 파트너를 찾고 있나요?" : "Looking for a sparring partner?")}
                    </div>
                    <div style={s.toggleSub}>
                      {isOn
                        ? (locale === "mn" ? "Бусад тулаанчид таны бичлэгийг харж хүсэлт илгээх боломжтой" : locale === "ko" ? "다른 선수들이 요청을 보낼 수 있습니다" : "Other fighters can see your post and send requests")
                        : (locale === "mn" ? "Идэвхжүүлбэл тулаанчид чамайг харна" : locale === "ko" ? "활성화하면 선수들이 볼 수 있습니다" : "Enable to let fighters find you")}
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
                  {toggling ? "…" : isOn
                    ? (locale === "mn" ? "Унтраах" : locale === "ko" ? "비활성화" : "Disable")
                    : (locale === "mn" ? "Идэвхжүүлэх" : locale === "ko" ? "활성화" : "Activate")}
                </button>
              </div>
            </div>
          )}

          {/* Own post preview */}
          {myPost && (
            <div style={{ padding: "8px 16px 0" }}>
              <div style={{ ...s.sectionLabel, marginBottom: 8 }}>
                {locale === "mn" ? "Таны зарлал" : locale === "ko" ? "내 게시물" : "Your listing"}
              </div>
              <FighterCard post={myPost} isMe onRequest={() => {}} sent={false} requesting={null} locale={locale} />
            </div>
          )}

          {!user && (
            <div style={s.empty}>
              <p style={s.emptyTitle}>{locale === "mn" ? "Нэвтрэх шаардлагатай" : locale === "ko" ? "로그인이 필요합니다" : "Login required"}</p>
            </div>
          )}

          {user && !myPost && (
            <div style={{ padding: "20px 16px 0" }}>
              <div style={{ textAlign: "center", padding: "32px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🥊</div>
                <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "#fff" }}>
                  {locale === "mn" ? "Post идэвхгүй байна" : locale === "ko" ? "게시물이 비활성화됨" : "Your post is inactive"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
                  {locale === "mn" ? "Дээрх товчийг дарж зарлалаа нийтлээрэй." : locale === "ko" ? "위 버튼을 눌러 게시물을 등록하세요." : "Press the button above to publish your listing."}
                </p>
              </div>
            </div>
          )}

          <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div style={{ ...s.list, padding: "8px 16px 0" }}>
          {historyLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
              {[1,2,3].map((i) => <div key={i} className="shimmer" style={{ height: 72, borderRadius: 12 }} />)}
            </div>
          ) : matchHistory.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
              <p style={s.emptyTitle}>{locale === "mn" ? "Тулааны түүх байхгүй" : locale === "ko" ? "매치 기록 없음" : "No match history yet"}</p>
              <p style={s.emptySub}>{locale === "mn" ? "PvP тулааны дараа энд гарч ирнэ" : locale === "ko" ? "PvP 매치 후 여기에 표시됩니다" : "Complete PvP training sessions to build your history"}</p>
            </div>
          ) : (
            <>
              {/* Win/loss summary strip */}
              {(() => {
                const wins = matchHistory.filter((m) => m.result === "win").length;
                const total = matchHistory.length;
                const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;
                return (
                  <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                    {[
                      { label: locale === "mn" ? "Нийт" : locale === "ko" ? "총" : "Matches", value: total, color: "#fff" },
                      { label: locale === "mn" ? "Ялалт" : locale === "ko" ? "승리" : "Wins", value: wins, color: "#34D399" },
                      { label: locale === "mn" ? "Ялалт %" : locale === "ko" ? "승률" : "Win rate", value: `${winPct}%`, color: "#D4AF37" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ flex: 1, minWidth: 80, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color }}>{value}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700, color: "#888" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {matchHistory.map((match) => {
                const won = match.result === "win";
                const col = won ? "#34D399" : "#F87171";
                const ago = formatAgo(match.createdAt, locale);
                return (
                  <div
                    key={match.id}
                    style={{ background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${col}`, borderRadius: "3px 12px 12px 3px", padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: match.reelId ? "pointer" : "default" }}
                    onClick={() => match.reelId && router.push(`/${locale}/reels?reelId=${match.reelId}&source=pvp`)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 3 }}>
                        vs {match.opponentName || "Opponent"}
                      </div>
                      <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#888", flexWrap: "wrap" }}>
                        <span style={{ color: col, fontWeight: 800 }}>{won ? (locale === "mn" ? "✓ Ялалт" : locale === "ko" ? "✓ 승리" : "✓ Win") : (locale === "mn" ? "✕ Ялагдлт" : locale === "ko" ? "✕ 패배" : "✕ Loss")}</span>
                        <span>{match.challengerScore?.toFixed(1)} vs {match.opponentScore?.toFixed(1)}</span>
                        {ago && <span>{ago}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: col, flexShrink: 0 }}>
                      {won ? "🏆" : "💪"}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div style={{ height: "calc(80px + env(safe-area-inset-bottom))" }} />
        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="reels" />
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
  tabBar: {
    display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(7,7,7,0.96)", position: "sticky", top: "calc(52px + env(safe-area-inset-top))", zIndex: 19,
  },
  tabBtn: {
    flex: 1, padding: "12px 4px", border: "none", background: "transparent",
    color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 800,
    cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    borderBottom: "2px solid transparent", transition: "all 200ms ease",
  },
  tabBtnActive: { color: "#fff", borderBottom: "2px solid #C1121F" },
  tabBadge: {
    minWidth: 16, height: 16, borderRadius: 999,
    background: "#C1121F", color: "#fff",
    fontSize: 9, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "0 4px",
  },
  toggleBanner: {
    borderRadius: 14, border: "1px solid",
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
    border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.38)", fontSize: 12, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap",
  },
  weightSelect: {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.55)", fontSize: 12, outline: "none", appearance: "none",
  },
  countBar: { padding: "10px 16px 4px" },
  countTxt: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", letterSpacing: 0.4 },
  list: { flex: 1, display: "flex", flexDirection: "column", padding: "4px 0 0" },
  sectionLabel: { padding: "12px 16px 4px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.28)", letterSpacing: 2, textTransform: "uppercase" },
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
  myLabel: { textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", padding: "2px 0" },
};
