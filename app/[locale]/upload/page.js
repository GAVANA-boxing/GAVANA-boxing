"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";

function cleanCaptionLine(line) {
  return line
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^\s*[-*•]\s*/, "")
    .replace(/^\s*\d+[\).:-]\s*/, "")
    .trim();
}

function stripCaptionLabel(line) {
  return cleanCaptionLine(line)
    .replace(/^(hook|caption|hashtags?)\s*[:\-–—]\s*/i, "")
    .trim();
}

function extractHashtags(text) {
  return (text.match(/#[\p{L}\p{N}_]+/gu) || []).join(" ");
}

function removeHashtags(text) {
  return text.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/\s{2,}/g, " ").trim();
}

function parseAiCaptionResult(text = "") {
  const sections = {
    hook: "",
    caption: "",
    hashtags: "",
  };
  let currentSection = null;

  text
    .split(/\r?\n/)
    .map(cleanCaptionLine)
    .filter(Boolean)
    .forEach((line) => {
      const match = line.match(/^(hook|caption|hashtags?)\s*[:\-–—]\s*(.*)$/i);

      if (match) {
        const key = match[1].toLowerCase().startsWith("hashtag") ? "hashtags" : match[1].toLowerCase();
        const value = match[2].trim();

        if (key === "hashtags") {
          sections.hashtags = [sections.hashtags, extractHashtags(value) || stripCaptionLabel(value)].filter(Boolean).join(" ");
        } else {
          sections[key] = [sections[key], removeHashtags(value)].filter(Boolean).join(" ");
          const hashtags = extractHashtags(value);
          if (hashtags) {
            sections.hashtags = [sections.hashtags, hashtags].filter(Boolean).join(" ");
          }
        }

        currentSection = key;
        return;
      }

      if (line.includes("#")) {
        sections.hashtags = [sections.hashtags, extractHashtags(line) || stripCaptionLabel(line)].filter(Boolean).join(" ");
        return;
      }

      if (currentSection) {
        sections[currentSection] = [sections[currentSection], removeHashtags(stripCaptionLabel(line))].filter(Boolean).join(" ");
        return;
      }

      if (!sections.caption) {
        sections.caption = stripCaptionLabel(line);
      }
    });

  const fallbackClean = text
    .split(/\r?\n/)
    .map(stripCaptionLabel)
    .filter(Boolean)
    .join("\n")
    .trim();

  const description = [
    removeHashtags(sections.caption).trim(),
    (extractHashtags(sections.hashtags) || sections.hashtags).trim(),
  ].filter(Boolean).join("\n").trim();

  return {
    hook: removeHashtags(sections.hook).trim(),
    caption: removeHashtags(sections.caption).trim(),
    hashtags: (extractHashtags(sections.hashtags) || sections.hashtags).trim(),
    description: description || fallbackClean,
  };
}

export default function UploadPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [captionContext, setCaptionContext] = useState("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionError, setCaptionError] = useState("");
  const [captionResult, setCaptionResult] = useState("");

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
        background: "#070707",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff"
      }}>
        {t("loading")}
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

  const handleGenerateCaption = async () => {
    const context = captionContext.trim();

    if (!context) {
      setCaptionError("Add a short context first.");
      return;
    }

    setCaptionLoading(true);
    setCaptionError("");
    setCaptionResult("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona: "analyst",
          locale,
          messages: [
            {
              role: "user",
              content: [
                "Generate a premium boxing reel caption.",
                `Context: ${context}`,
                "Return exactly three plain-text sections with no markdown, no bullets, and no numbering:",
                "Hook: one short viral hook, maximum 8 words.",
                "Caption: one punchy caption, maximum 18 words.",
                "Hashtags: 5 to 8 relevant hashtags.",
                "Do not put hashtags in Hook or Caption. Put hashtags only in Hashtags.",
              ].join("\n"),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Caption request failed");
      }

      const data = await response.json();
      const text = data?.content?.find((item) => item?.type === "text")?.text || data?.content?.[0]?.text || "";

      if (!text.trim()) {
        throw new Error("Empty caption response");
      }

      setCaptionResult(text.trim());
    } catch (error) {
      console.error("Caption generation error:", error);
      setCaptionError("Could not generate a caption. Please try again.");
    } finally {
      setCaptionLoading(false);
    }
  };

  const handleUseCaption = () => {
    if (captionResult.trim()) {
      setDescription(parseAiCaptionResult(captionResult).description);
    }
  };

  const handleCopyHashtags = async () => {
    const hashtags = parseAiCaptionResult(captionResult).hashtags;
    if (!hashtags) return;

    try {
      await navigator.clipboard.writeText(hashtags);
    } catch (error) {
      console.error("Failed to copy hashtags:", error);
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
      background: "linear-gradient(180deg, #070707 0%, #0B0B0B 100%)",
      padding: "20px",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "20px"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ margin: 0, color: "#D4AF37", letterSpacing: 2, fontSize: 12, fontWeight: 800 }}>
            GAVANA BOXING
          </p>
          <h1 style={{ margin: "10px 0 0", fontSize: 42, fontWeight: 950, color: "#fff", letterSpacing: 0 }}>
            {t("uploadReel")}
          </h1>
        </div>

        {error && (
          <div style={{
            background: "#3a0a0a",
            border: "1px solid rgba(193,18,31,0.5)",
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
              border: "1px dashed rgba(212,175,55,0.36)",
              borderRadius: 18,
              padding: 60,
              textAlign: "center",
              cursor: "pointer",
              background: "#0B0B0B",
              boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
              transition: "border-color 0.2s ease, transform 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#D4AF37"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(212,175,55,0.36)"}
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
              background: "#000",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
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
                  {t("description")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your boxing reel..."
                  style={{
                    width: "100%",
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.12)",
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

              <div style={{
                display: "grid",
                gap: 12,
                padding: 16,
                borderRadius: 16,
                background: "linear-gradient(145deg, rgba(193,18,31,0.14), rgba(11,11,11,0.96) 46%, rgba(212,175,55,0.08))",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 18px 48px rgba(0,0,0,0.28)"
              }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <span style={{
                    color: "#D4AF37",
                    fontSize: 12,
                    fontWeight: 850,
                    letterSpacing: 1.4,
                    textTransform: "uppercase"
                  }}>
                    {t("aiCaptionGenerator")}
                  </span>
                  <p style={{
                    margin: 0,
                    color: "#AAAAAA",
                    fontSize: 13,
                    lineHeight: 1.5
                  }}>
                    {t("aiCaptionHelp")}
                  </p>
                </div>

                <input
                  value={captionContext}
                  onChange={(e) => setCaptionContext(e.target.value)}
                  placeholder={t("captionContextPlaceholder")}
                  style={{
                    width: "100%",
                    background: "rgba(7,7,7,0.72)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    padding: "13px 14px",
                    color: "#fff",
                    fontSize: 14,
                    outline: "none"
                  }}
                />

                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={captionLoading}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: captionLoading ? "#4d1117" : "linear-gradient(135deg, #C1121F, #8f0d17)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 850,
                    cursor: captionLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 12px 32px rgba(193,18,31,0.22)",
                    transition: "transform 0.18s ease, opacity 0.18s ease"
                  }}
                >
                  {captionLoading ? t("generating") : t("generateCaption")}
                </button>

                {captionError && (
                  <div style={{
                    color: "#ff8b8b",
                    fontSize: 13,
                    lineHeight: 1.5
                  }}>
                    {captionError}
                  </div>
                )}

                {captionResult && (() => {
                  const parsedCaption = parseAiCaptionResult(captionResult);

                  return (
                    <div style={{
                      display: "grid",
                      gap: 12,
                      padding: 14,
                      borderRadius: 14,
                      background: "rgba(0,0,0,0.34)",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}>
                      {parsedCaption.hook && (
                        <div style={styles.captionSection}>
                          <span style={styles.captionSectionLabel}>Hook</span>
                          <div style={styles.captionHookText}>{parsedCaption.hook}</div>
                        </div>
                      )}
                      {parsedCaption.caption && (
                        <div style={styles.captionSection}>
                          <span style={styles.captionSectionLabel}>Caption</span>
                          <div style={styles.captionResultText}>{parsedCaption.caption}</div>
                        </div>
                      )}
                      {parsedCaption.hashtags && (
                        <div style={styles.captionSection}>
                          <span style={styles.captionSectionLabel}>Hashtags</span>
                          <div style={styles.captionResultText}>{parsedCaption.hashtags}</div>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={handleUseCaption}
                          style={styles.captionActionButton}
                        >
                          Use caption
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyHashtags}
                          style={{
                            ...styles.captionActionButton,
                            background: "rgba(255,255,255,0.055)",
                            color: "#fff",
                            border: "1px solid rgba(255,255,255,0.12)"
                          }}
                        >
                          Copy hashtags
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleCancel}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: 12,
                    border: "1px solid rgba(212,175,55,0.25)",
                    background: "transparent",
                    color: "#D4AF37",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: uploading ? "not-allowed" : "pointer"
                  }}
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !description.trim()}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: 12,
                    border: "none",
                    background: uploading ? "#4d1117" : "#C1121F",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: uploading || !description.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  {uploading ? t("uploading") : t("upload")}
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

const styles = {
  captionSection: {
    display: "grid",
    gap: 6,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  captionSectionLabel: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  captionHookText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 900,
    lineHeight: 1.45,
  },
  captionResultText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  captionActionButton: {
    padding: "11px 14px",
    borderRadius: 999,
    border: "1px solid rgba(212,175,55,0.34)",
    background: "rgba(212,175,55,0.1)",
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
};
