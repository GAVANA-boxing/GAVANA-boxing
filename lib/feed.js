import { getFirebase } from "@/lib/lazyFirebase";

const FEED_CONTENT_TYPES = new Set(["training", "academy", "challenge", "challenge_response"]);

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

export async function getFeedReels(limit = 20) {
  const { db } = await getFirebase();
  const { collection, query, orderBy, getDocs, limit: fsLimit } = await import("firebase/firestore");

  const snap = await getDocs(
    query(
      collection(db, "reels"),
      orderBy("createdAt", "desc"),
      fsLimit(60),
    )
  );

  return snap.docs
    .map(normalizeReel)
    .filter((r) => !r.isDemo && FEED_CONTENT_TYPES.has(r.contentType))
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
