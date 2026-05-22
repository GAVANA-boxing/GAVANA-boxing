"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD , redAlpha, goldAlpha} from "@/lib/tokens";
import { useAdminFeaturedCreators } from "@/hooks/useAdminFeaturedCreators";
import Image from "next/image";

export default function AdminFeaturedCreatorsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const {
    isAdmin, adminChecked,
    featuredList, loadingFeatured,
    searchTerm, setSearchTerm,
    searchResults,
    selectedUser, setSelectedUser,
    reason, setReason,
    daysUntil, setDaysUntil,
    submitting, removing,
    handleSearch, handleFeature, handleRemove,
  } = useAdminFeaturedCreators({ user, authLoading });

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
                    {photo ? <Image src={photo} alt={initial} width={38} height={38} style={{ objectFit: "cover" }} /> : initial}
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
                      ? <Image src={item.photoURL} alt={initial} width={38} height={38} style={{ objectFit: "cover" }} />
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
    minHeight: "100dvh",
    background: "#0B0B0C",
    color: "#fff",
    padding: "28px 20px 60px",
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
