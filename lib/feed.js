import { getFirebase } from "@/lib/lazyFirebase";

const FEED_CONTENT_TYPES = new Set(["training", "academy", "challenge"]);

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
