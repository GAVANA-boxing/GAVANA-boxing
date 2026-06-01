"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, GOLD, BG, redAlpha, pageBg } from "@/lib/tokens";
import Image from "next/image";

const SPECIALTIES = [
  "Jab", "Footwork", "Defense", "Conditioning",
  "Technique", "Sparring", "Amateur", "Pro",
];

export default function CoachApplyPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);

  const [checking, setChecking] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [isCoach, setIsCoach] = useState(false);

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [certifications, setCertifications] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    async function check() {
      try {
        // Check if already a coach
        const { getDoc, doc } = await import("firebase/firestore");
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.exists() ? userSnap.data() : {};
        if (active && userData.isCoach) { setIsCoach(true); setChecking(false); return; }

        // Pre-fill name
        if (active && userData.displayName) setFullName(userData.displayName);

        // Check existing application
        const appSnap = await getDocs(query(
          collection(db, "coach_applications"),
          where("userId", "==", user.uid)
        ));
        if (!active) return;
        if (!appSnap.empty) setAlreadyApplied(true);
      } catch { /* silent */ } finally {
        if (active) setChecking(false);
      }
    }
    check();
    return () => { active = false; };
  }, [user?.uid]);

  const toggleSpecialty = (s) => {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !bio.trim()) {
      setError("Please fill in your full name and bio.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      let profileImageUrl = "";
      if (photoFile) {
        setUploading(true);
        const storageRef = ref(storage, `coach_applications/${user.uid}/${Date.now()}_${photoFile.name}`);
        const snapshot = await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, photoFile);
          task.on("state_changed", (s) => setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)), reject, () => resolve(task.snapshot));
        });
        profileImageUrl = await getDownloadURL(snapshot.ref);
        setUploading(false);
      }

      await addDoc(collection(db, "coach_applications"), {
        userId: user.uid,
        fullName: fullName.trim(),
        country: country.trim(),
        city: city.trim(),
        specialties: selectedSpecialties,
        yearsExperience: Number(yearsExperience) || 0,
        certifications: certifications.trim(),
        instagram: instagram.trim(),
        youtube: youtube.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        profileImage: profileImageUrl,
        submittedAt: serverTimestamp(),
        status: "pending",
      });

      setSubmitted(true);
    } catch (e) {
      setError(t("coachApplyError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checking) {
    return <div style={styles.loading}>{t("loading")}</div>;
  }
  if (!user) return null;

  if (isCoach) {
    return (
      <div style={styles.page}>
        <div style={styles.inner}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>🥊</div>
            <h2 style={styles.successTitle}>{t("verifiedCoach")}</h2>
            <p style={styles.successDesc}>{t("coachAlreadyVerified")}</p>
            <button type="button" style={styles.submitBtn} onClick={() => router.push(`/${locale}/coach/dashboard`)}>
              {t("coachDashboard")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyApplied && !submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.inner}>
          <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/coach`)}>← {t("back")}</button>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>⏳</div>
            <h2 style={styles.successTitle}>{t("coachApplicationPending")}</h2>
            <p style={styles.successDesc}>{t("coachApplySuccessDesc")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.inner}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✅</div>
            <h2 style={styles.successTitle}>{t("coachApplySuccess")}</h2>
            <p style={styles.successDesc}>{t("coachApplySuccessDesc")}</p>
            <button type="button" style={styles.submitBtn} onClick={() => router.push(`/${locale}/coach`)}>
              {t("coachMarketplace")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.inner}>
        <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/coach`)}>
          ← {t("back")}
        </button>

        <div style={styles.header}>
          <p style={styles.eyebrow}>COMBAT · TRAINING</p>
          <h1 style={styles.title}>{t("coachApplyTitle")}</h1>
          <p style={styles.subtitle}>{t("coachApplySubtitle")}</p>
        </div>

        {error && <div style={styles.errBox}>{error}</div>}

        {/* Profile Photo */}
        <div style={styles.photoSection}>
          <div
            style={styles.photoCircle}
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <Image src={photoPreview} alt="" width={80} height={80} style={{ objectFit: "cover" }} unoptimized />
            ) : (
              <span style={styles.photoPlus}>+</span>
            )}
          </div>
          <button type="button" style={styles.photoLabel} onClick={() => fileInputRef.current?.click()}>
            {t("coachApplyProfilePhoto")}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
        </div>

        <div style={styles.fields}>
          <div style={styles.field}>
            <label style={styles.fieldLabel}>{t("coachApplyFullName")} *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("coachApplyFullNamePlaceholder")}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldRow}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.fieldLabel}>{t("coachApplyCountry")}</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Mongolia" style={styles.input} />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.fieldLabel}>{t("coachApplyCity")}</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ulaanbaatar" style={styles.input} />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>{t("coachApplySpecialties")}</label>
            <div style={styles.specialtyGrid}>
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  style={selectedSpecialties.includes(s) ? styles.specialtyActive : styles.specialtyBtn}
                  onClick={() => toggleSpecialty(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>{t("coachApplyExperience")}</label>
            <input
              type="number"
              min="0"
              max="50"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder={t("coachApplyExperiencePlaceholder")}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>{t("coachApplyCertifications")}</label>
            <input
              type="text"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder={t("coachApplyCertificationsPlaceholder")}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldRow}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.fieldLabel}>{t("coachApplyInstagram")}</label>
              <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourhandle" style={styles.input} />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.fieldLabel}>{t("coachApplyYoutube")}</label>
              <input type="text" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="channel URL" style={styles.input} />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>{t("coachPhoneLabel")}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+976 9999 0000" style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.fieldLabel}>{t("coachApplyBio")} *</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("coachApplyBioPlaceholder")}
              style={styles.textarea}
              rows={4}
            />
          </div>
        </div>

        {uploading && (
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${uploadProgress}%` }} />
          </div>
        )}

        <button
          type="button"
          style={submitting ? styles.submitBtnDisabled : styles.submitBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? t("coachApplySubmitting") : t("coachApplySubmit")}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100dvh", background: pageBg(), color: "#fff" },
  inner: { maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" },
  backBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer", padding: "10px 14px", display: "inline-flex", alignItems: "center", borderRadius: 10, marginTop: "calc(16px + env(safe-area-inset-top))" },
  header: { textAlign: "center", padding: "8px 0 24px" },
  eyebrow: { fontSize: 10, letterSpacing: 2, color: RED, textTransform: "uppercase", margin: "0 0 8px", fontWeight: 900 },
  title: { fontSize: 28, fontWeight: 1000, margin: "0 0 8px", color: "#fff", fontFamily: "var(--font-display, 'Anton', sans-serif)", textTransform: "uppercase", letterSpacing: "-0.02em" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 },
  errBox: { background: `${redAlpha(0.15)}`, border: `1px solid ${redAlpha(0.4)}`, borderRadius: 10, padding: "10px 14px", color: "#F87171", fontSize: 13, marginBottom: 16 },
  photoSection: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24 },
  photoCircle: { width: 80, height: 80, borderRadius: 40, background: "rgba(255,255,255,0.07)", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" },
  photoImg: { width: "100%", height: "100%", objectFit: "cover" },
  photoPlus: { fontSize: 28, color: "rgba(255,255,255,0.55)" },
  photoLabel: { background: "none", border: "none", color: "rgba(255,255,255,0.65)", fontSize: 13, cursor: "pointer", padding: 0 },
  fields: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldRow: { display: "flex", gap: 12 },
  fieldLabel: { fontSize: 10, fontWeight: 900, color: RED, letterSpacing: 2, textTransform: "uppercase" },
  input: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" },
  textarea: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15, outline: "none", width: "100%", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  specialtyGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  specialtyBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "6px 14px", color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", transition: "all 140ms ease" },
  specialtyActive: { background: `${redAlpha(0.25)}`, border: "2px solid #FF3B30", borderRadius: 20, padding: "5px 13px", color: "#ff6b6b", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: `0 0 10px ${redAlpha(0.25)}`, transition: "all 140ms ease" },
  progressWrap: { height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 16, overflow: "hidden" },
  progressBar: { height: "100%", background: RED, borderRadius: 2, transition: "width 0.2s" },
  submitBtn: { width: "100%", padding: "16px", background: `linear-gradient(145deg, ${RED}, #cc2820)`, border: "none", borderRadius: 12, color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5, boxShadow: `0 8px 24px ${redAlpha(0.32)}, inset 0 1px 0 rgba(255,255,255,0.1)` },
  submitBtnDisabled: { width: "100%", padding: "16px", background: `${redAlpha(0.4)}`, border: "none", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: 700, cursor: "not-allowed", letterSpacing: 0.5 },
  successCard: { textAlign: "center", padding: "60px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 },
  successIcon: { fontSize: 56 },
  successTitle: { fontSize: 24, fontWeight: 700, margin: 0, color: "#fff" },
  successDesc: { fontSize: 15, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.6 },
};
