"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function UploadPage() {
  const { locale } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [authLoading, user, router, locale]);

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff"
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      alert("Please select a video file");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !description.trim()) {
      alert("Please select a video and add a description");
      return;
    }

    setUploading(true);
    setError("");

    try {
      if (!user?.uid) return;

      // Upload video to Firebase Storage
      const videoRef = ref(storage, `reels/${user.uid}/${Date.now()}_${selectedFile.name}`);
      const snapshot = await uploadBytes(videoRef, selectedFile);
      const videoUrl = await getDownloadURL(snapshot.ref);

      // Create thumbnail (first frame)
      const thumbnailRef = ref(storage, `thumbnails/${user.uid}/${Date.now()}_thumb.jpg`);
      // For now, we'll use a placeholder thumbnail
      const thumbnailUrl = videoUrl; // In a real app, you'd generate a thumbnail

      // Save reel data to Firestore
      await addDoc(collection(db, "reels"), {
        userId: user.uid,
        username: user.email.split("@")[0],
        videoUrl,
        thumbnailUrl,
        description: description.trim(),
        likes: 0,
        commentsCount: 0,
        shares: 0,
        createdAt: serverTimestamp(),
        tags: [], // Could extract from description
      });

      // Clean up
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      router.push(`/${locale}/reels`);
    } catch (error) {
      console.error("Upload error:", error);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      padding: "20px",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "20px"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ margin: 0, color: "#E8002D", letterSpacing: 2, fontSize: 12, fontWeight: 700 }}>
            GAVANA BOXING
          </p>
          <h1 style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 900, color: "#fff" }}>
            Upload Reel
          </h1>
        </div>

        {error && (
          <div style={{
            background: "#3a0a0a",
            border: "1px solid #E8002D",
            color: "#ff8b8b",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed #333",
              borderRadius: 20,
              padding: 60,
              textAlign: "center",
              cursor: "pointer",
              background: "#0d0d0d",
              transition: "border-color 0.2s ease"
            }}
            onMouseEnter={(e) => e.target.style.borderColor = "#E8002D"}
            onMouseLeave={(e) => e.target.style.borderColor = "#333"}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
            <p style={{ color: "#888", fontSize: 16, margin: 0 }}>
              Click to select a boxing reel video
            </p>
            <p style={{ color: "#666", fontSize: 14, margin: "8px 0 0" }}>
              MP4, MOV, or other video formats
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              background: "#000"
            }}>
              <video
                src={previewUrl}
                controls
                style={{
                  width: "100%",
                  maxHeight: 400,
                  objectFit: "contain"
                }}
              />
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#888",
                  letterSpacing: 1.2,
                  textTransform: "uppercase"
                }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your boxing reel..."
                  style={{
                    width: "100%",
                    background: "#131313",
                    border: "1px solid #222",
                    borderRadius: 12,
                    padding: 14,
                    color: "#fff",
                    fontSize: 14,
                    minHeight: 80,
                    resize: "vertical",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleCancel}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: 12,
                    border: "1px solid #333",
                    background: "transparent",
                    color: "#888",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: uploading ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !description.trim()}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: 12,
                    border: "none",
                    background: uploading ? "#6d0f0f" : "#E8002D",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: uploading || !description.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
