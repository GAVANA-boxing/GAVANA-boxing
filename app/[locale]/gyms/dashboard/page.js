"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db, storage } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";

const GYM_TYPES = [
  "Boxing", "MMA", "Muay Thai", "Fitness",
  "Crossfit", "Street Workout", "Powerlifting", "Running Club",
];
const GYM_TYPE_KEYS = {
  Boxing: "gymTypeBoxing", MMA: "gymTypeMMA", "Muay Thai": "gymTypeMuayThai",
  Fitness: "gymTypeFitness", Crossfit: "gymTypeCrossfit",
  "Street Workout": "gymTypeStreetWorkout", Powerlifting: "gymTypePowerlifting",
  "Running Club": "gymTypeRunningClub",
};
const SPECIALTIES = ["Boxing", "MMA", "Muay Thai", "Kickboxing", "Jab", "Footwork", "Defense", "Conditioning", "Sparring", "Strength"];
const AMENITIES = ["Showers", "Lockers", "Parking", "WiFi", "Punching Bags", "Boxing Ring", "Weights", "Cardio"];
const AMENITY_KEYS = {
  Showers: "gymAmenityShowers", Lockers: "gymAmenityLockers", Parking: "gymAmenityParking",
  WiFi: "gymAmenityWifi", "Punching Bags": "gymAmenityBag", "Boxing Ring": "gymAmenityRing",
  Weights: "gymAmenityWeights", Cardio: "gymAmenityCardio",
};

export default function GymDashboardPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const logoInputRef = useRef(null);

  const [checking, setChecking] = useState(true);
  const [gym, setGym] = useState(null); // null = not registered yet
  const [joinRequests, setJoinRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState("requests"); // requests | announce | manage

  // Register form state
  const [gymName, setGymName] = useState("");
  const [gymDesc, setGymDesc] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [gymType, setGymType] = useState("Boxing");
  const [specialties, setSpecialties] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Announcement form
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annPosting, setAnnPosting] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);
  const [annError, setAnnError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    async function check() {
      try {
        const gymSnap = await getDocs(query(collection(db, "gyms"), where("ownerId", "==", user.uid)));
        if (!active) return;
        if (!gymSnap.empty) {
          const gymDoc = { id: gymSnap.docs[0].id, ...gymSnap.docs[0].data() };
          setGym(gymDoc);
          // Load join requests and announcements for this gym
          const [reqSnap, annSnap] = await Promise.all([
            getDocs(query(collection(db, "gym_join_requests"), where("gymId", "==", gymDoc.id), where("status", "==", "pending"))),
            getDocs(query(collection(db, "gym_announcements"), where("gymId", "==", gymDoc.id))),
          ]);
          if (active) {
            setJoinRequests(reqSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setAnnouncements(annSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
          }
        }
      } catch (e) {
        console.error("gym dashboard check error", e);
      } finally {
        if (active) setChecking(false);
      }
    }
    check();
    return () => { active = false; };
  }, [user?.uid]);

  const toggleSpecialty = (s) => setSpecialties((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleAmenity = (a) => setAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRegister = async () => {
    if (!gymName.trim()) { setRegisterError(t("gymRegisterName") + " is required."); return; }
    setRegisterError("");
    setSubmitting(true);
    try {
      let logoUrl = "";
      if (logoFile) {
        setUploading(true);
        const storageRef = ref(storage, `gyms/${user.uid}/${Date.now()}_logo`);
        const snapshot = await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, logoFile);
          task.on("state_changed", (s) => setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)), reject, () => resolve(task.snapshot));
        });
        logoUrl = await getDownloadURL(snapshot.ref);
        setUploading(false);
      }
      const gymDoc = await addDoc(collection(db, "gyms"), {
        ownerId: user.uid,
        gymName: gymName.trim(),
        description: gymDesc.trim(),
        country: country.trim(),
        city: city.trim(),
        district: district.trim(),
        address: address.trim(),
        gymType,
        specialties,
        amenities,
        phone: phone.trim(),
        instagram: instagram.trim(),
        website: website.trim(),
        logo: logoUrl,
        images: logoUrl ? [logoUrl] : [],
        verified: false,
        rating: 0,
        totalReviews: 0,
        memberCount: 0,
        subscriptionTier: "free",
        createdAt: serverTimestamp(),
      });
      setGym({ id: gymDoc.id, gymName: gymName.trim(), ownerId: user.uid });
      setRegisterSuccess(true);
    } catch (e) {
      console.error("gym register error", e);
      setRegisterError(t("gymRegisterError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinAction = async (req, action) => {
    setUpdatingId(req.id);
    try {
      await updateDoc(doc(db, "gym_join_requests", req.id), {
        status: action,
        reviewedAt: serverTimestamp(),
      });
      if (action === "approved") {
        await updateDoc(doc(db, "gyms", gym.id), { memberCount: (gym.memberCount || 0) + 1 });
        setGym((g) => ({ ...g, memberCount: (g.memberCount || 0) + 1 }));
      }
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (e) {
      console.error("join action error", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!annTitle.trim()) return;
    setAnnPosting(true);
    setAnnError("");
    try {
      const newAnn = await addDoc(collection(db, "gym_announcements"), {
        gymId: gym.id,
        ownerId: user.uid,
        title: annTitle.trim(),
        body: annBody.trim(),
        createdAt: serverTimestamp(),
      });
      setAnnouncements((prev) => [{ id: newAnn.id, title: annTitle.trim(), body: annBody.trim(), createdAt: null }, ...prev]);
      setAnnTitle("");
      setAnnBody("");
      setAnnSuccess(true);
      setTimeout(() => setAnnSuccess(false), 3000);
    } catch {
      setAnnError(t("gymAnnouncementError"));
    } finally {
      setAnnPosting(false);
    }
  };

  if (authLoading || checking) {
    return <div style={styles.loading}>{t("loading")}</div>;
  }
  if (!user) return null;

  // Registration form (no gym yet)
  if (!gym && !registerSuccess) {
    return (
      <div style={styles.page}>
        <div style={styles.inner}>
          <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/gyms`)}>← {t("back")}</button>
          <div style={styles.pageHeader}>
            <p style={styles.kicker}>GAVANA</p>
            <h1 style={styles.title}>{t("gymRegisterTitle")}</h1>
            <p style={styles.subtitle}>{t("gymRegisterSubtitle")}</p>
          </div>

          {/* Logo */}
          <div style={styles.logoSection}>
            <div style={styles.logoCircle} onClick={() => logoInputRef.current?.click()}>
              {logoPreview ? (
                <img src={logoPreview} alt="" style={styles.logoImg} />
              ) : (
                <span style={{ fontSize: 32 }}>🥊</span>
              )}
            </div>
            <button type="button" style={styles.logoLabel} onClick={() => logoInputRef.current?.click()}>
              Upload Logo
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: "none" }} />
          </div>

          {registerError && <div style={styles.errBox}>{registerError}</div>}

          <div style={styles.fields}>
            <FormField label={t("gymRegisterName") + " *"}>
              <input type="text" value={gymName} onChange={(e) => setGymName(e.target.value)} placeholder={t("gymRegisterNamePlaceholder")} style={styles.input} />
            </FormField>

            <FormField label={t("gymRegisterDesc")}>
              <textarea value={gymDesc} onChange={(e) => setGymDesc(e.target.value)} placeholder={t("gymRegisterDescPlaceholder")} style={styles.textarea} rows={3} />
            </FormField>

            <div style={styles.fieldRow}>
              <FormField label={t("gymRegisterCountry")} style={{ flex: 1 }}>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Mongolia" style={styles.input} />
              </FormField>
              <FormField label={t("gymRegisterCity")} style={{ flex: 1 }}>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ulaanbaatar" style={styles.input} />
              </FormField>
            </div>

            <FormField label={t("gymRegisterDistrict")}>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Bayangol" style={styles.input} />
            </FormField>

            <FormField label={t("gymRegisterAddress")}>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, building..." style={styles.input} />
            </FormField>

            <FormField label={t("gymRegisterType")}>
              <select value={gymType} onChange={(e) => setGymType(e.target.value)} style={styles.select}>
                {GYM_TYPES.map((gt) => (
                  <option key={gt} value={gt}>{t(GYM_TYPE_KEYS[gt])}</option>
                ))}
              </select>
            </FormField>

            <FormField label={t("gymRegisterSpecialties")}>
              <div style={styles.pillsGrid}>
                {SPECIALTIES.map((s) => (
                  <button key={s} type="button"
                    style={specialties.includes(s) ? styles.pillActive : styles.pillBtn}
                    onClick={() => toggleSpecialty(s)}
                  >{s}</button>
                ))}
              </div>
            </FormField>

            <FormField label={t("gymRegisterAmenities")}>
              <div style={styles.pillsGrid}>
                {AMENITIES.map((a) => (
                  <button key={a} type="button"
                    style={amenities.includes(a) ? styles.pillActive : styles.pillBtn}
                    onClick={() => toggleAmenity(a)}
                  >{t(AMENITY_KEYS[a])}</button>
                ))}
              </div>
            </FormField>

            <div style={styles.fieldRow}>
              <FormField label={t("gymRegisterPhone")} style={{ flex: 1 }}>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+976..." style={styles.input} />
              </FormField>
              <FormField label={t("gymRegisterInstagram")} style={{ flex: 1 }}>
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" style={styles.input} />
              </FormField>
            </div>

            <FormField label={t("gymRegisterWebsite")}>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." style={styles.input} />
            </FormField>
          </div>

          {uploading && (
            <div style={styles.progressWrap}>
              <div style={{ ...styles.progressBar, width: `${uploadProgress}%` }} />
            </div>
          )}

          <button type="button" style={submitting ? styles.submitBtnDisabled : styles.submitBtn} onClick={handleRegister} disabled={submitting}>
            {submitting ? t("gymRegisterSubmitting") : t("gymRegisterSubmit")}
          </button>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
      </div>
    );
  }

  if (registerSuccess && gym) {
    return (
      <div style={styles.page}>
        <div style={styles.inner}>
          <div style={styles.successCard}>
            <div style={{ fontSize: 52 }}>🏋️</div>
            <h2 style={styles.successTitle}>{t("gymRegisterSuccess")}</h2>
            <button type="button" style={styles.submitBtn} onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}>
              View Gym
            </button>
          </div>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
      </div>
    );
  }

  // Owner dashboard
  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}>← {gym.gymName}</button>

        <div style={styles.dashHeader}>
          <p style={styles.kicker}>{t("gymDashboardKicker")}</p>
          <h1 style={styles.title}>{t("gymDashboard")}</h1>
        </div>

        {/* Stats panel */}
        <div style={styles.statsPanel}>
          <div style={styles.statCell}>
            <span style={styles.statNum}>{gym.memberCount || 0}</span>
            <span style={styles.statLbl}>{t("gymMembers")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={styles.statNum}>{gym.totalReviews || 0}</span>
            <span style={styles.statLbl}>{t("gymReviews")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={styles.statNum}>{gym.rating ? gym.rating.toFixed(1) : "—"}</span>
            <span style={styles.statLbl}>{t("gymRating")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={styles.statNum}>{joinRequests.length}</span>
            <span style={styles.statLbl}>{t("gymJoinRequests")}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { key: "requests", label: `${t("gymJoinRequests")} (${joinRequests.length})` },
            { key: "announce", label: t("gymPostAnnouncement") },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              style={activeTab === key ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Join Requests */}
        {activeTab === "requests" && (
          <div>
            {joinRequests.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ fontSize: 40, opacity: 0.4 }}>👥</span>
                <p style={styles.emptyText}>{t("gymNoJoinRequests")}</p>
              </div>
            ) : (
              <div style={styles.cardList}>
                {joinRequests.map((req) => (
                  <div key={req.id} style={styles.requestCard}>
                    <div style={styles.requestTop}>
                      <div style={styles.reqAvatar}>👤</div>
                      <div style={styles.reqInfo}>
                        <p style={styles.reqUserId}>{req.userId?.slice(0, 10)}...</p>
                        <p style={styles.reqDate}>
                          {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    {req.message && <p style={styles.reqMessage}>"{req.message}"</p>}
                    <div style={styles.reqActions}>
                      <button
                        type="button"
                        style={styles.declineBtn}
                        disabled={updatingId === req.id}
                        onClick={() => handleJoinAction(req, "declined")}
                      >
                        {t("gymDecline")}
                      </button>
                      <button
                        type="button"
                        style={styles.approveBtn}
                        disabled={updatingId === req.id}
                        onClick={() => handleJoinAction(req, "approved")}
                      >
                        {updatingId === req.id ? "…" : t("gymApprove")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Announcements */}
        {activeTab === "announce" && (
          <div>
            <div style={styles.annForm}>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder={t("gymAnnouncementTitle")}
                style={styles.input}
              />
              <textarea
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder={t("gymAnnouncementBody")}
                style={styles.textarea}
                rows={4}
              />
              {annError && <p style={styles.errorText}>{annError}</p>}
              {annSuccess && <p style={styles.successText}>{t("gymAnnouncementSuccess")}</p>}
              <button
                type="button"
                style={annPosting ? styles.submitBtnDisabled : styles.submitBtn}
                onClick={handlePostAnnouncement}
                disabled={annPosting}
              >
                {annPosting ? t("gymAnnouncementPosting") : t("gymAnnouncementSubmit")}
              </button>
            </div>

            {announcements.length > 0 && (
              <div style={styles.annList}>
                <p style={styles.sectionLabel}>Posted announcements</p>
                {announcements.map((ann) => (
                  <div key={ann.id} style={styles.annCard}>
                    <p style={styles.annTitle}>{ann.title}</p>
                    <p style={styles.annBody}>{ann.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
    </div>
  );
}

function FormField({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

const fieldLabelStyle = { fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 700 };

const styles = {
  loading: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "system-ui, sans-serif" },
  page: { minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "system-ui, sans-serif" },
  inner: { maxWidth: 480, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  content: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 14, cursor: "pointer", padding: "16px 0", display: "block" },
  pageHeader: { textAlign: "center", paddingBottom: 20 },
  dashHeader: { paddingTop: "calc(18px + env(safe-area-inset-top))", paddingBottom: 16 },
  kicker: { margin: "0 0 4px", fontSize: 11, letterSpacing: 2, color: "#D4AF37", textTransform: "uppercase", fontWeight: 900 },
  title: { margin: "0 0 4px", fontSize: 26, fontWeight: 1000, lineHeight: 1.1 },
  subtitle: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)" },
  logoSection: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 20 },
  logoCircle: { width: 80, height: 80, borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" },
  logoImg: { width: "100%", height: "100%", objectFit: "cover" },
  logoLabel: { background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer" },
  errBox: { background: "rgba(193,18,31,0.12)", border: "1px solid rgba(193,18,31,0.35)", borderRadius: 10, padding: "10px 14px", color: "#F87171", fontSize: 13, marginBottom: 14 },
  fields: { display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 },
  fieldRow: { display: "flex", gap: 10 },
  input: { width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 15, outline: "none" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" },
  select: { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark" },
  pillsGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  pillBtn: { padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  pillActive: { padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(193,18,31,0.5)", background: "rgba(193,18,31,0.15)", color: "#F87171", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  progressWrap: { height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 14, overflow: "hidden" },
  progressBar: { height: "100%", background: "#C1121F", borderRadius: 2, transition: "width 0.2s" },
  submitBtn: { width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#C1121F,#7d0812)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer" },
  submitBtnDisabled: { width: "100%", padding: "15px", borderRadius: 12, border: "none", background: "rgba(193,18,31,0.35)", color: "rgba(255,255,255,0.45)", fontSize: 15, fontWeight: 900, cursor: "not-allowed" },
  successCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "60px 24px", textAlign: "center" },
  successTitle: { margin: 0, fontSize: 22, fontWeight: 1000, color: "#fff" },
  statsPanel: { display: "flex", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20, overflow: "hidden" },
  statCell: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "14px 6px" },
  statNum: { fontSize: 18, fontWeight: 1000, color: "#fff" },
  statLbl: { fontSize: 9, color: "rgba(255,255,255,0.38)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, textAlign: "center" },
  statDivider: { width: 1, background: "rgba(255,255,255,0.07)", alignSelf: "stretch" },
  tabs: { display: "flex", gap: 8, marginBottom: 16 },
  tab: { flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  tabActive: { flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.08)", color: "#D4AF37", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "50px 0", textAlign: "center" },
  emptyText: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.35)" },
  cardList: { display: "flex", flexDirection: "column", gap: 10 },
  requestCard: { borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", padding: "14px" },
  requestTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  reqAvatar: { width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  reqInfo: { flex: 1 },
  reqUserId: { margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" },
  reqDate: { margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" },
  reqMessage: { margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.55)", fontStyle: "italic", borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: 10 },
  reqActions: { display: "flex", gap: 8 },
  declineBtn: { flex: 1, minHeight: 36, border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, background: "rgba(248,113,113,0.07)", color: "#F87171", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  approveBtn: { flex: 2, minHeight: 36, border: "none", borderRadius: 10, background: "linear-gradient(135deg,#166534,#15803d)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" },
  annForm: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  annList: { display: "flex", flexDirection: "column", gap: 8 },
  sectionLabel: { margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  annCard: { borderRadius: 12, border: "1px solid rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.05)", padding: "12px 14px" },
  annTitle: { margin: "0 0 4px", fontSize: 14, fontWeight: 900, color: "#D4AF37" },
  annBody: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" },
  errorText: { margin: 0, fontSize: 13, color: "#F87171" },
  successText: { margin: 0, fontSize: 13, color: "#34D399", fontWeight: 700 },
};
