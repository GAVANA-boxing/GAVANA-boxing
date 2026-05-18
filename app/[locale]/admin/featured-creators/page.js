"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import { createFeaturedNotification } from "@/lib/notifications";
import { RED, GOLD , redAlpha, goldAlpha} from "@/lib/tokens";

export default function AdminFeaturedCreatorsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [featuredList, setFeaturedList] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Search / feature form
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason] = useState("");
  const [daysUntil, setDaysUntil] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(null);

  // Check admin status
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAdminChecked(true);
      return;
    }
    async function check() {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
        const data = snap.docs[0]?.data() || {};
        setIsAdmin(!!data.isAdmin || !!data.admin);
      } catch { /* silent */ }
      setAdminChecked(true);
    }
    check();
  }, [user, authLoading]);

  // Load current featured creators
  useEffect(() => {
    if (!adminChecked || !isAdmin) return;
    loadFeatured();
  }, [adminChecked, isAdmin]);

  async function loadFeatured() {
    setLoadingFeatured(true);
    try {
      const now = Timestamp.now();
      const snap = await getDocs(query(collection(db, "featured_creators"), where("featuredUntil", ">=", now)));
      const items = [];
      for (const d of snap.docs) {
        const data = d.data();
        // Load user profile
        const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", data.userId)));
        const profile = userSnap.docs[0]?.data() || {};
        items.push({
          docId: d.id,
          ...data,
          displayName: profile.displayName || profile.username || data.userId,
          photoURL: profile.photoURL || profile.profileImageUrl || "",
        });
      }
      setFeaturedList(items);
    } catch { /* silent */ }
    setLoadingFeatured(false);
  }

  async function handleSearch(e) {
    e.preventDefault();
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;
    try {
      const snap = await getDocs(collection(db, "users"));
      const results = [];
      snap.forEach((d) => {
        const data = d.data();
        const name = String(data.displayName || "").toLowerCase();
        const uname = String(data.username || "").toLowerCase();
        if (name.includes(term) || uname.includes(term)) {
          results.push({ id: d.id, ...data });
        }
      });
      setSearchResults(results.slice(0, 12));
    } catch { /* silent */ }
  }

  async function handleFeature() {
    if (!selectedUser || submitting) return;
    setSubmitting(true);
    try {
      const featuredUntil = Timestamp.fromDate(
        new Date(Date.now() + Number(daysUntil) * 24 * 60 * 60 * 1000)
      );
      await addDoc(collection(db, "featured_creators"), {
        userId: selectedUser.id,
        reason: reason.trim() || "",
        featuredUntil,
        createdAt: serverTimestamp(),
      });
      createFeaturedNotification({ creatorId: selectedUser.id }).catch(() => {});
      setSelectedUser(null);
      setReason("");
      setDaysUntil(7);
      setSearchResults([]);
      setSearchTerm("");
      await loadFeatured();
    } catch { /* silent */ }
    setSubmitting(false);
  }

  async function handleRemove(docId) {
    if (removing) return;
    setRemoving(docId);
    try {
      await deleteDoc(doc(db, "featured_creators", docId));
      setFeaturedList((prev) => prev.filter((f) => f.docId !== docId));
    } catch { /* silent */ }
    setRemoving(null);
  }

  if (authLoading || !adminChecked) {
    return <div style={styles.page}><p style={styles.msg}>Loading…</p></div>;
  }

  if (!user || !isAdmin) {
    return (
      <div style={styles.page}>
        <p style={styles.denied}>{t("adminAccessDenied")}</p>
        <button type="button" onClick={() => router.back()} style={styles.backBtn}>← Back</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button type="button" onClick={() => router.back()} style={styles.backLink}>←</button>
        <div>
          <p style={styles.kicker}>Admin</p>
          <h1 style={styles.title}>{t("featuredCreatorsAdmin")}</h1>
        </div>
      </div>

      {/* Feature a creator */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>{t("featureCreator")}</h2>
        <form onSubmit={handleSearch} style={styles.searchRow}>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("adminSearchUser")}
            style={styles.input}
          />
          <button type="submit" style={styles.searchBtn}>Search</button>
        </form>

        {searchResults.length > 0 && (
          <div style={styles.resultsList}>
            {searchResults.map((u) => {
              const initial = (u.displayName || u.username || "U").charAt(0).toUpperCase();
              const photo = u.photoURL || u.profileImageUrl || "";
              const isSelected = selectedUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUser(isSelected ? null : u)}
                  style={{ ...styles.resultItem, ...(isSelected ? styles.resultItemSelected : {}) }}
                >
                  <div style={styles.avatar}>
                    {photo ? <img src={photo} alt={initial} style={styles.avatarImg} /> : initial}
                  </div>
                  <div>
                    <div style={styles.resultName}>{u.displayName || u.username || "Unnamed"}</div>
                    {u.username ? <div style={styles.resultSub}>@{u.username}</div> : null}
                  </div>
                  {isSelected && <span style={styles.checkmark}>✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {selectedUser && (
          <div style={styles.featureForm}>
            <p style={styles.selectedLabel}>
              Selected: <strong>{selectedUser.displayName || selectedUser.username}</strong>
            </p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("featuredReason")}
              style={styles.input}
            />
            <div style={styles.daysRow}>
              <label style={styles.daysLabel}>{t("featuredUntilLabel")}:</label>
              <input
                type="number"
                min={1}
                max={90}
                value={daysUntil}
                onChange={(e) => setDaysUntil(Number(e.target.value) || 7)}
                style={{ ...styles.input, width: 80 }}
              />
              <span style={styles.daysLabel}>days</span>
            </div>
            <button
              type="button"
              onClick={handleFeature}
              disabled={submitting}
              style={styles.featureBtn}
            >
              {submitting ? "…" : t("featureCreator")}
            </button>
          </div>
        )}
      </section>

      {/* Current featured list */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>{t("featuredCreatorsAdmin")}</h2>
        {loadingFeatured ? (
          <p style={styles.msg}>Loading…</p>
        ) : featuredList.length === 0 ? (
          <p style={styles.msg}>{t("adminNoFeatured")}</p>
        ) : (
          <div style={styles.featuredList}>
            {featuredList.map((item) => {
              const initial = (item.displayName || "C").charAt(0).toUpperCase();
              const until = item.featuredUntil?.toDate?.() ?? null;
              return (
                <div key={item.docId} style={styles.featuredItem}>
                  <div style={styles.avatar}>
                    {item.photoURL
                      ? <img src={item.photoURL} alt={initial} style={styles.avatarImg} />
                      : initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.resultName}>{item.displayName}</div>
                    {item.reason ? <div style={styles.resultSub}>{item.reason}</div> : null}
                    {until ? (
                      <div style={styles.resultSub}>
                        {t("featuredUntilLabel")}: {until.toLocaleDateString()}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.docId)}
                    disabled={removing === item.docId}
                    style={styles.removeBtn}
                  >
                    {removing === item.docId ? "…" : t("removeFeatured")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #070707 0%, #090909 100%)",
    color: "#fff",
    padding: "28px 20px 60px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    maxWidth: 700,
    margin: "0 auto 28px",
  },
  backLink: {
    background: "none",
    border: "none",
    color: GOLD,
    fontSize: 22,
    cursor: "pointer",
    padding: "4px 0",
    lineHeight: 1,
    marginTop: 4,
  },
  kicker: {
    margin: 0,
    color: GOLD,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    margin: "4px 0 0",
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1.1,
  },
  section: {
    maxWidth: 700,
    margin: "0 auto 32px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: GOLD,
  },
  searchRow: {
    display: "flex",
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
  },
  searchBtn: {
    minHeight: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: RED,
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  resultsList: {
    display: "grid",
    gap: 8,
    marginBottom: 12,
  },
  resultItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    cursor: "pointer",
    color: "#fff",
    textAlign: "left",
    width: "100%",
  },
  resultItemSelected: {
    background: `${goldAlpha(0.1)}`,
    border: `1px solid ${goldAlpha(0.35)}`,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: `${redAlpha(0.3)}`,
    display: "grid",
    placeItems: "center",
    fontSize: 15,
    fontWeight: 900,
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  resultName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#eee",
  },
  resultSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  checkmark: {
    marginLeft: "auto",
    color: GOLD,
    fontWeight: 900,
    fontSize: 16,
  },
  featureForm: {
    display: "grid",
    gap: 10,
    padding: "14px",
    borderRadius: 14,
    background: `${goldAlpha(0.06)}`,
    border: `1px solid ${goldAlpha(0.2)}`,
    marginTop: 8,
  },
  selectedLabel: {
    margin: 0,
    fontSize: 13,
    color: "#ccc",
  },
  daysRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  daysLabel: {
    fontSize: 13,
    color: "#aaa",
    flexShrink: 0,
  },
  featureBtn: {
    padding: "11px 0",
    borderRadius: 12,
    border: "none",
    background: GOLD,
    color: "#000",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  featuredList: {
    display: "grid",
    gap: 10,
  },
  featuredItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 14,
    background: `${goldAlpha(0.05)}`,
    border: `1px solid ${goldAlpha(0.15)}`,
  },
  removeBtn: {
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${redAlpha(0.4)}`,
    background: `${redAlpha(0.12)}`,
    color: "#ff4444",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
  },
  msg: {
    color: "#888",
    fontSize: 14,
    margin: 0,
    padding: "8px 0",
  },
  denied: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 80,
  },
  backBtn: {
    display: "block",
    margin: "20px auto 0",
    padding: "10px 24px",
    borderRadius: 12,
    border: "none",
    background: "#333",
    color: "#fff",
    fontSize: 14,
    cursor: "pointer",
  },
};
