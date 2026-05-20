"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";
import { RED, redAlpha } from "@/lib/tokens";
import styles from "@/components/profile/editProfileStyles";
import Image from "next/image";

const WEIGHT_CLASSES = [
  { value: "-54", label: "-54kg" },
  { value: "-60", label: "-60kg" },
  { value: "-67", label: "-67kg" },
  { value: "-75", label: "-75kg" },
  { value: "-81", label: "-81kg" },
  { value: "+91", label: "+91kg" },
];

const ARCHETYPES = [
  { value: "pressure", emoji: "⚡", label: "Pressure", color: "#F87171" },
  { value: "counter",  emoji: "🎯", label: "Counter",  color: "#60A5FA" },
  { value: "technical",emoji: "🧠", label: "Technical",color: "#A78BFA" },
  { value: "brawler",  emoji: "🔥", label: "Brawler",  color: "#FB923C" },
];

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const locale = getLocale(params?.locale);
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername]       = useState("");
  const [bio, setBio]                 = useState("");
  const [photoURL, setPhotoURL]       = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [archetype, setArchetype]     = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState("");
  const [avatarHover, setAvatarHover]   = useState(false);
  const [error, setError]               = useState("");
  const [usernameError, setUsernameError] = useState("");

  const t = (mn, ko, en) => locale === "mn" ? mn : locale === "ko" ? ko : en;

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { setLoading(false); return; }
    let active = true;

    async function load() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.exists() ? snap.data() : {};
        if (!active) return;
        setDisplayName(d.displayName || d.username || user.email?.split("@")[0] || "");
        setUsername(d.username || user.email?.split("@")[0] || "");
        setBio(d.bio || "");
        setPhotoURL(d.photoURL || d.profileImageUrl || "");
        setWeightClass(d.weightClass || "");
        setArchetype(d.fighterArchetype || "");
      } catch (e) {
        if (active) setError(t("Профайл ачаалахад алдаа гарлаа", "프로필 로드 실패", "Could not load your profile"));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid]); // t omitted (recreated every render); user.email stable within session

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError(t("Зургийн файл сонгоно уу", "이미지 파일을 선택하세요", "Please choose an image file")); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const validateUsername = (val) => {
    if (!val) return t("Хэрэглэгчийн нэр оруулна уу", "사용자명을 입력하세요", "Username is required");
    if (!/^[a-z0-9_.]{3,20}$/.test(val)) return t("3-20 тэмдэгт, зөвхөн a-z 0-9 _ .", "3-20자, 영소문자·숫자·_·. 만", "3-20 chars, lowercase letters, numbers, _ or .");
    return "";
  };

  const handleSave = async () => {
    if (!user?.uid || saving) return;

    const cleanName = displayName.trim();
    const cleanUser = username.trim().toLowerCase();
    const cleanBio  = bio.trim().slice(0, 160);
    const uErr = validateUsername(cleanUser);

    if (!cleanName) { setError(t("Нэр оруулна уу", "이름을 입력하세요", "Display name is required")); return; }
    if (uErr) { setUsernameError(uErr); return; }

    setSaving(true);
    setError("");

    try {
      let nextPhotoURL = photoURL;
      if (selectedFile) {
        const safeFileName = selectedFile.name.replace(/[^\w.-]/g, "_");
        const imgRef = ref(storage, `profile-images/${user.uid}/${safeFileName}`);
        const snapshot = await uploadBytes(imgRef, selectedFile);
        nextPhotoURL = await getDownloadURL(snapshot.ref);
      }

      await setDoc(doc(db, "users", user.uid), {
        email: user.email || "",
        username: cleanUser,
        displayName: cleanName,
        bio: cleanBio,
        photoURL: nextPhotoURL,
        profileImageUrl: nextPhotoURL,
        ...(weightClass ? { weightClass } : {}),
        ...(archetype   ? { fighterArchetype: archetype } : {}),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setSaved(true);
      setTimeout(() => router.push(`/${locale}/profile/${user.uid}`), 900);
    } catch (e) {
      setError(t("Хадгалахад алдаа гарлаа. Дахин оролдоно уу.", "저장 실패. 다시 시도하세요.", "Could not save profile. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main style={styles.page}>
        <div style={{ width: "min(100%,560px)", margin: "0 auto", display: "grid", gap: 22 }}>
          <div className="shimmer" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div style={{ display: "grid", justifyItems: "center", gap: 12 }}>
            <div className="shimmer" style={{ width: 132, height: 132, borderRadius: "50%" }} />
            <div className="shimmer" style={{ width: 120, height: 36, borderRadius: 999 }} />
          </div>
          <div style={{ display: "grid", gap: 16, padding: 16, borderRadius: 20, background: "rgba(255,255,255,0.03)" }}>
            {[80, 80, 110, 56, 56, 50].map((h, i) => (
              <div key={i} className="shimmer" style={{ height: h, borderRadius: 14 }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const avatarSrc = previewUrl || photoURL;

  return (
    <main style={styles.page}>
      <section style={styles.shell}>

        {/* Back */}
        <button style={styles.backButton} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Header */}
        <header style={styles.header}>
          <p style={styles.kicker}>GAVANA BOXING</p>
          <h1 style={styles.title}>{t("Профайл засах", "프로필 수정", "Edit Profile")}</h1>
        </header>

        {/* Avatar */}
        <div style={styles.avatarBlock}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.avatarButton}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            aria-label={t("Зураг солих", "사진 변경", "Change photo")}
          >
            {avatarSrc ? (
              <Image src={avatarSrc} alt="Profile" width={120} height={120} style={{ objectFit: "cover" }} unoptimized />
            ) : (
              <span style={styles.avatarInitial}>
                {(displayName || user.email || "U").charAt(0).toUpperCase()}
              </span>
            )}
            <div style={{ ...styles.avatarOverlay, opacity: avatarHover || selectedFile ? 1 : 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="1.8"/>
              </svg>
            </div>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.photoButton}
          >
            {selectedFile
              ? t("✓ Зураг сонгогдлоо", "✓ 사진 선택됨", `✓ ${selectedFile.name.slice(0, 20)}`)
              : t("Зураг солих", "사진 변경", "Change profile photo")}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
        </div>

        {/* Form */}
        <div style={styles.form}>

          {/* Display name */}
          <div style={styles.field}>
            <label style={styles.label}>{t("Нэр", "이름", "Display name")}</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              style={styles.input}
              placeholder={t("Байлдааны нэр", "닉네임", "Your fighter name")}
            />
          </div>

          {/* Username */}
          <div style={styles.field}>
            <label style={styles.label}>{t("Хэрэглэгчийн нэр", "사용자명", "Username")}</label>
            <div style={styles.usernameWrap}>
              <span style={styles.usernameAt}>@</span>
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""));
                  setUsernameError("");
                }}
                maxLength={20}
                style={{ ...styles.input, paddingLeft: 32, borderColor: usernameError ? "rgba(248,113,113,0.6)" : undefined }}
                placeholder="fighter.name"
              />
            </div>
            {usernameError
              ? <span style={styles.fieldError}>{usernameError}</span>
              : <span style={styles.fieldHint}>{t("3-20 тэмдэгт, a-z 0-9 _ .", "3-20자, 소문자·숫자·_·.", "3-20 chars, a-z 0-9 _ .")}</span>
            }
          </div>

          {/* Bio */}
          <div style={styles.field}>
            <label style={styles.label}>{t("Танилцуулга", "자기소개", "Bio")}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              maxLength={160}
              rows={3}
              style={styles.textarea}
              placeholder={t("Жим, зорилго, тулааны стиль...", "짧은 소개, 체육관, 목표...", "Gym, goal, fight style...")}
            />
            <span style={{ ...styles.count, color: bio.length >= 140 ? "#F87171" : "#555" }}>{bio.length}/160</span>
          </div>

          {/* Weight class */}
          <div style={styles.field}>
            <label style={styles.label}>{t("Жингийн ангилал", "체급", "Weight class")}</label>
            <div style={styles.chips}>
              {WEIGHT_CLASSES.map(({ value, label }) => {
                const active = weightClass === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setWeightClass(active ? "" : value)}
                    style={{
                      ...styles.chip,
                      ...(active ? { background: "rgba(96,165,250,0.18)", border: "1px solid #60A5FA", color: "#60A5FA", fontWeight: 900 } : {}),
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fighting style */}
          <div style={styles.field}>
            <label style={styles.label}>{t("Тулааны стиль", "파이팅 스타일", "Fighting style")}</label>
            <div style={styles.chips}>
              {ARCHETYPES.map(({ value, emoji, label, color }) => {
                const active = archetype === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setArchetype(active ? "" : value)}
                    style={{
                      ...styles.chip,
                      ...(active ? { background: `${color}1a`, border: `1px solid ${color}`, color, fontWeight: 900 } : {}),
                    }}
                  >
                    {emoji} {label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            style={{
              ...styles.saveButton,
              ...(saved ? { background: "#16a34a", boxShadow: "0 16px 44px rgba(22,163,74,0.28)" } : {}),
              opacity: saving ? 0.7 : 1,
              cursor: saving || saved ? "default" : "pointer",
            }}
          >
            {saved
              ? `✓ ${t("Хадгалагдлаа", "저장됨", "Saved!")}`
              : saving
              ? t("Хадгалж байна...", "저장 중...", "Saving...")
              : t("Профайл хадгалах", "프로필 저장", "Save profile")}
          </button>
        </div>
      </section>
    </main>
  );
}

