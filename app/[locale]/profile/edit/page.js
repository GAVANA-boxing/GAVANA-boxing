"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const locale = getLocale(params?.locale);
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let isActive = true;

    async function loadProfile() {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.exists() ? userSnap.data() : {};
        const fallbackName = data.username || user.email?.split("@")[0] || "fighter";

        if (!isActive) return;
        setDisplayName(data.displayName || fallbackName);
        setBio(data.bio || "");
        setPhotoURL(data.photoURL || data.profileImageUrl || "");
      } catch (error) {
        console.error("Failed to load profile:", error);
        if (isActive) setError("Could not load your profile.");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [authLoading, user?.uid, user?.email]);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const handleSave = async () => {
    if (!user?.uid || saving) return;

    const cleanName = displayName.trim();
    const cleanBio = bio.trim().slice(0, 160);

    if (!cleanName) {
      setError("Display name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let nextPhotoURL = photoURL;

      if (selectedFile) {
        try {
          const safeFileName = selectedFile.name.replace(/[^\w.-]/g, "_");
          const imageRef = ref(storage, `profile-images/${user.uid}/${safeFileName}`);
          const snapshot = await uploadBytes(imageRef, selectedFile);
          nextPhotoURL = await getDownloadURL(snapshot.ref);
        } catch (uploadError) {
          console.error("Profile image upload failed:", uploadError);
          throw new Error("profile-image-upload-failed");
        }
      }

      const username = user.email?.split("@")[0] || cleanName;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email || "",
        username,
        displayName: cleanName,
        bio: cleanBio,
        photoURL: nextPhotoURL,
        profileImageUrl: nextPhotoURL,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      router.push(`/${locale}/profile/${user.uid}`);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setError(
        error.message === "profile-image-upload-failed"
          ? "Could not upload image. Please try again."
          : "Could not save profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main style={styles.centered}>{locale === "mn" ? "Профайл ачааллаж байна..." : locale === "ko" ? "프로필 로딩 중..." : "Loading profile..."}</main>
    );
  }

  if (!user) return null;

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <button style={styles.backButton} onClick={() => router.back()}>
          Back
        </button>

        <header style={styles.header}>
          <p style={styles.kicker}>GAVANA BOXING</p>
          <h1 style={styles.title}>Edit Profile</h1>
        </header>

        <div style={styles.avatarBlock}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.avatarButton}
          >
            {previewUrl || photoURL ? (
              <img
                src={previewUrl || photoURL}
                alt="Profile preview"
                style={styles.avatarImage}
              />
            ) : (
              <span style={styles.avatarInitial}>
                {(displayName || user.email || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.photoButton}
          >
            Change profile image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        <div style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={40}
              style={styles.input}
              placeholder="Your fighter name"
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Bio</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value.slice(0, 160))}
              maxLength={160}
              style={styles.textarea}
              placeholder="Short bio, gym, goal, or fight style"
            />
            <span style={styles.count}>{bio.length}/160</span>
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.68 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 0%, rgba(193,18,31,0.16), transparent 32%), linear-gradient(180deg, #070707, #0B0B0B)",
    color: "#fff",
    padding: "calc(24px + env(safe-area-inset-top)) 16px 32px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  centered: {
    minHeight: "100vh",
    background: "#070707",
    color: "#fff",
    display: "grid",
    placeItems: "center",
  },
  shell: {
    width: "min(100%, 560px)",
    margin: "0 auto",
    display: "grid",
    gap: 22,
  },
  backButton: {
    justifySelf: "start",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.055)",
    color: "#fff",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  header: {
    textAlign: "center",
  },
  kicker: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 2,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 38,
    lineHeight: 1,
    fontWeight: 1000,
  },
  avatarBlock: {
    display: "grid",
    justifyItems: "center",
    gap: 12,
  },
  avatarButton: {
    width: 132,
    height: 132,
    borderRadius: "50%",
    border: "2px solid rgba(212,175,55,0.72)",
    background: "linear-gradient(145deg, #C1121F, #5b0710)",
    boxShadow: "0 0 0 7px rgba(193,18,31,0.16), 0 22px 60px rgba(0,0,0,0.38)",
    overflow: "hidden",
    cursor: "pointer",
    padding: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 48,
    fontWeight: 1000,
  },
  photoButton: {
    border: "1px solid rgba(212,175,55,0.28)",
    background: "rgba(212,175,55,0.08)",
    color: "#D4AF37",
    borderRadius: 999,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
  },
  form: {
    display: "grid",
    gap: 16,
    padding: 16,
    borderRadius: 20,
    background: "rgba(11,11,11,0.86)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.32)",
  },
  field: {
    display: "grid",
    gap: 8,
  },
  label: {
    color: "#AAAAAA",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    background: "rgba(7,7,7,0.86)",
    color: "#fff",
    padding: "14px 15px",
    fontSize: 15,
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    background: "rgba(7,7,7,0.86)",
    color: "#fff",
    padding: "14px 15px",
    fontSize: 15,
    lineHeight: 1.5,
    resize: "vertical",
    outline: "none",
  },
  count: {
    justifySelf: "end",
    color: "#777",
    fontSize: 12,
    fontWeight: 700,
  },
  error: {
    color: "#ff8b8b",
    background: "rgba(193,18,31,0.12)",
    border: "1px solid rgba(193,18,31,0.28)",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
  },
  saveButton: {
    border: "none",
    borderRadius: 14,
    background: "#C1121F",
    color: "#fff",
    minHeight: 50,
    fontSize: 15,
    fontWeight: 900,
    boxShadow: "0 16px 44px rgba(193,18,31,0.24)",
  },
};
