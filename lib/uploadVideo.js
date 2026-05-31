async function getVideoDuration(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      const d = Number.isFinite(vid.duration) && vid.duration > 0 ? Math.round(vid.duration) : null;
      resolve(d);
      URL.revokeObjectURL(url);
    };
    vid.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
    vid.src = url;
    vid.load();
  });
}

export async function uploadVideoToFeed({ videoBlob, thumbnailBlob, userId }) {
  if (!videoBlob || !userId) throw new Error("missing required data");

  const { storage } = await import("@/lib/firebase");
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

  const ts = Date.now();
  const ext = videoBlob.type?.includes("mp4") ? "mp4" : "webm";

  const videoRef = ref(storage, `reels/videos/${userId}/${ts}.${ext}`);
  await uploadBytes(videoRef, videoBlob, { contentType: videoBlob.type || "video/webm" });
  const videoURL = await getDownloadURL(videoRef);

  let thumbnailURL = null;
  if (thumbnailBlob) {
    try {
      const thumbRef = ref(storage, `reels/thumbnails/${userId}/${ts}.jpg`);
      await uploadBytes(thumbRef, thumbnailBlob, { contentType: "image/jpeg" });
      thumbnailURL = await getDownloadURL(thumbRef);
    } catch { /* thumbnail non-critical */ }
  }

  const durationSeconds = await getVideoDuration(videoBlob);

  return { videoURL, thumbnailURL, durationSeconds };
}
