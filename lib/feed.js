import { getFirebase } from "@/lib/lazyFirebase";

const FEED_CONTENT_TYPES = new Set(["training", "academy", "challenge", "challenge_response"]);

const ARCH_KEYWORDS = {
  pressure:   ["pressure", "forward", "body", "conditioning", "bag", "power", "heavy"],
  outboxer:   ["jab", "range", "distance", "footwork", "movement", "lateral"],
  counter:    ["counter", "counterpunch", "parry", "check", "timing", "read"],
  explosive:  ["explosive", "power", "knockout", "ko", "combination", "burst"],
  technician: ["technique", "technical", "precision", "form", "mechanics", "slip"],
};

function normalizeReel(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    contentType:  data.contentType || "training",
    videoUrl:     data.videoURL || data.videoUrl || data.url || "",
    thumbnailUrl: data.thumbnailURL || data.thumbnailUrl || data.thumbnail || "",
  };
}

function scoreReel(reel, archetypeKey, nowMs) {
  const likes    = Number(reel.likeCount  || reel.likes  || 0);
  const views    = Number(reel.viewCount  || reel.views  || 0);
  const comments = Number(reel.commentCount || 0);
  const ageSecs  = ((nowMs / 1000) - (reel.createdAt?.seconds || 0));
  const ageDays  = Math.max(ageSecs / 86400, 0.01);

  // Engagement score (HN-style gravity decay over 7 days)
  const engagement = likes * 3 + comments * 5 + views * 0.1;
  const decayed = engagement / Math.pow(ageDays + 2, 1.5);

  // DNA archetype boost (+40% if reel text matches user's style)
  let dnaBoost = 0;
  if (archetypeKey && ARCH_KEYWORDS[archetypeKey]) {
    const text = ((reel.caption || "") + " " + (reel.description || "") + " " + (reel.tags?.join(" ") || "")).toLowerCase();
    if (ARCH_KEYWORDS[archetypeKey].some((kw) => text.includes(kw))) dnaBoost = 0.4;
  }

  return decayed * (1 + dnaBoost);
}

export async function getFeedReels(limit = 20, archetypeKey = null) {
  const { db } = await getFirebase();
  const { collection, query, orderBy, getDocs, limit: fsLimit } = await import("firebase/firestore");

  const snap = await getDocs(
    query(collection(db, "reels"), orderBy("createdAt", "desc"), fsLimit(80))
  );

  const nowMs = Date.now();
  return snap.docs
    .map(normalizeReel)
    .filter((r) => !r.isDemo && FEED_CONTENT_TYPES.has(r.contentType))
    .sort((a, b) => scoreReel(b, archetypeKey, nowMs) - scoreReel(a, archetypeKey, nowMs))
    .slice(0, limit);
}

export async function getTrainingReels(limit = 20) {
  const { db } = await getFirebase();
  const { collection, query, orderBy, getDocs, limit: fsLimit } = await import("firebase/firestore");

  const snap = await getDocs(
    query(
      collection(db, "reels"),
      orderBy("createdAt", "desc"),
      fsLimit(limit * 4),
    )
  );

  return snap.docs
    .map(normalizeReel)
    .filter((r) => !r.isDemo && r.contentType === "training")
    .slice(0, limit);
}

export async function getFollowingReels(userId, limit = 20) {
  if (!userId) return [];
  const { db } = await getFirebase();
  const { collection, query, where, getDocs, limit: fsLimit } = await import("firebase/firestore");

  const followsSnap = await getDocs(
    query(collection(db, "follows"), where("followerId", "==", userId))
  );
  const followingIds = followsSnap.docs.map((d) => d.data().followingId);
  if (!followingIds.length) return [];

  // Firestore "in" max 10 per query — chunk if needed
  const chunks = [];
  for (let i = 0; i < followingIds.length; i += 10) chunks.push(followingIds.slice(i, i + 10));

  const results = await Promise.all(
    chunks.map((chunk) =>
      getDocs(query(collection(db, "reels"), where("userId", "in", chunk), fsLimit(limit)))
    )
  );

  return results
    .flatMap((snap) => snap.docs.map(normalizeReel))
    .filter((r) => !r.isDemo && FEED_CONTENT_TYPES.has(r.contentType))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, limit);
}

export async function getAcademyReels(limit = 20) {
  const { db } = await getFirebase();
  const { collection, query, orderBy, getDocs, limit: fsLimit } = await import("firebase/firestore");

  const snap = await getDocs(
    query(
      collection(db, "reels"),
      orderBy("createdAt", "desc"),
      fsLimit(limit * 4),
    )
  );

  return snap.docs
    .map(normalizeReel)
    .filter((r) => !r.isDemo && r.contentType === "academy")
    .slice(0, limit);
}
