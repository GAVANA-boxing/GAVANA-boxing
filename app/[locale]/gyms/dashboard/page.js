"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/gyms/gymsDashboardStyles";
import { GymFormField } from "@/components/gyms/GymFormField";
import { GYM_TYPES, GYM_TYPE_KEYS, SPECIALTIES, AMENITIES, AMENITY_KEYS, getCompleteness } from "@/lib/gymConstants";
import { useGymDashboardData } from "@/hooks/useGymDashboardData";
import { useGymDashboardActions } from "@/hooks/useGymDashboardActions";
import Image from "next/image";

export default function GymDashboardPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const { checking, gym, joinRequests, members, requesterUsers, announcements, setGym, setJoinRequests, setMembers, setAnnouncements } = useGymDashboardData({ user });
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState("requests");

  const {
    logoInputRef,
    gymName, setGymName, gymDesc, setGymDesc,
    country, setCountry, city, setCity, district, setDistrict, address, setAddress,
    gymType, setGymType, specialties, amenities, phone, setPhone, instagram, setInstagram, website, setWebsite,
    logoFile, logoPreview, uploading, uploadProgress, submitting, registerError, registerSuccess,
    annTitle, setAnnTitle, annBody, setAnnBody, annPosting, annSuccess, annError,
    toggleSpecialty, toggleAmenity,
    handleLogoSelect, handleRegister, handleJoinAction, handlePostAnnouncement,
  } = useGymDashboardActions({ gym, setGym, setJoinRequests, setAnnouncements, user, locale, t, setUpdatingId });

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  if (authLoading || checking) {
    return (
      <div style={styles.page}>
        <div style={styles.content}>
          <div style={{ height: 20, width: 80, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 8 }} className="shimmer" />
          <div style={{ height: 28, width: "60%", borderRadius: 8, background: "rgba(255,255,255,0.08)", marginBottom: 20 }} className="shimmer" />
          <div style={{ display: "flex", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
            {[1,2,3,4].map((i) => (
              <div key={i} style={{ flex: 1, padding: "14px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ height: 20, width: 32, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} className="shimmer" />
                <div style={{ height: 10, width: 44, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} className="shimmer" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[1,2,3,4].map((i) => <div key={i} style={{ flex: 1, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)" }} className="shimmer" />)}
          </div>
          {[1,2,3].map((i) => (
            <div key={i} style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} className="shimmer" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ height: 13, width: "50%", borderRadius: 6, background: "rgba(255,255,255,0.08)" }} className="shimmer" />
                  <div style={{ height: 11, width: "30%", borderRadius: 6, background: "rgba(255,255,255,0.05)" }} className="shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
      </div>
    );
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
                <Image src={logoPreview} alt="" width={80} height={80} style={{ objectFit: "cover" }} unoptimized />
              ) : (
                <span style={{ fontSize: 32 }}>🥊</span>
              )}
            </div>
            <button type="button" style={styles.logoLabel} onClick={() => logoInputRef.current?.click()}>
              {t("gymDashUploadLogo")}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: "none" }} />
          </div>

          {registerError && <div style={styles.errBox}>{registerError}</div>}

          <div style={styles.fields}>
            <GymFormField label={t("gymRegisterName") + " *"}>
              <input type="text" value={gymName} onChange={(e) => setGymName(e.target.value)} placeholder={t("gymRegisterNamePlaceholder")} style={styles.input} />
            </GymFormField>

            <GymFormField label={t("gymRegisterDesc")}>
              <textarea value={gymDesc} onChange={(e) => setGymDesc(e.target.value)} placeholder={t("gymRegisterDescPlaceholder")} style={styles.textarea} rows={3} />
            </GymFormField>

            <div style={styles.fieldRow}>
              <GymFormField label={t("gymRegisterCountry")} style={{ flex: 1 }}>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Mongolia" style={styles.input} />
              </GymFormField>
              <GymFormField label={t("gymRegisterCity")} style={{ flex: 1 }}>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ulaanbaatar" style={styles.input} />
              </GymFormField>
            </div>

            <GymFormField label={t("gymRegisterDistrict")}>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Bayangol" style={styles.input} />
            </GymFormField>

            <GymFormField label={t("gymRegisterAddress")}>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, building..." style={styles.input} />
            </GymFormField>

            <GymFormField label={t("gymRegisterType")}>
              <select value={gymType} onChange={(e) => setGymType(e.target.value)} style={styles.select}>
                {GYM_TYPES.map((gt) => (
                  <option key={gt} value={gt}>{t(GYM_TYPE_KEYS[gt])}</option>
                ))}
              </select>
            </GymFormField>

            <GymFormField label={t("gymRegisterSpecialties")}>
              <div style={styles.pillsGrid}>
                {SPECIALTIES.map((s) => (
                  <button key={s} type="button"
                    style={specialties.includes(s) ? styles.pillActive : styles.pillBtn}
                    onClick={() => toggleSpecialty(s)}
                  >{s}</button>
                ))}
              </div>
            </GymFormField>

            <GymFormField label={t("gymRegisterAmenities")}>
              <div style={styles.pillsGrid}>
                {AMENITIES.map((a) => (
                  <button key={a} type="button"
                    style={amenities.includes(a) ? styles.pillActive : styles.pillBtn}
                    onClick={() => toggleAmenity(a)}
                  >{t(AMENITY_KEYS[a])}</button>
                ))}
              </div>
            </GymFormField>

            <div style={styles.fieldRow}>
              <GymFormField label={t("gymRegisterPhone")} style={{ flex: 1 }}>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+976..." style={styles.input} />
              </GymFormField>
              <GymFormField label={t("gymRegisterInstagram")} style={{ flex: 1 }}>
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" style={styles.input} />
              </GymFormField>
            </div>

            <GymFormField label={t("gymRegisterWebsite")}>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." style={styles.input} />
            </GymFormField>
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
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
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
              {t("gymDashViewGym")}
            </button>
          </div>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
      </div>
    );
  }

  // Owner dashboard
  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.content}>
        <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}>← {gym.gymName}</button>

        <div style={styles.dashHeader}>
          <p style={styles.kicker}>COMBAT · GYM</p>
          <h1 style={styles.title}>{t("gymDashboard")}</h1>
          {(() => {
            const pct = getCompleteness(gym);
            const label = t("gymDashProfileComplete");
            const color = pct >= 80 ? "#34D399" : pct >= 50 ? GOLD : RED;
            return (
              <div style={{ marginTop: 12, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
                </div>
                {pct < 100 && (
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                    {t("gymDashProfileHint")}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Stats panel */}
        <div style={styles.statsPanel}>
          <button type="button" style={styles.statCellBtn} onClick={() => setActiveTab("members")}>
            <span style={styles.statNum}>{gym.memberCount || 0}</span>
            <span style={styles.statLbl}>{t("gymMembers")}</span>
          </button>
          <div style={styles.statDivider} />
          <button type="button" style={styles.statCellBtn} onClick={() => router.push(`/${locale}/gyms/${gym.id}#reviews`)}>
            <span style={styles.statNum}>{gym.totalReviews || 0}</span>
            <span style={styles.statLbl}>{t("gymReviews")}</span>
          </button>
          <div style={styles.statDivider} />
          <button type="button" style={styles.statCellBtn} onClick={() => router.push(`/${locale}/gyms/${gym.id}#reviews`)}>
            <span style={styles.statNum}>{gym.rating ? gym.rating.toFixed(1) : "—"}</span>
            <span style={styles.statLbl}>{t("gymRating")}</span>
          </button>
          <div style={styles.statDivider} />
          <button type="button" style={{ ...styles.statCellBtn, ...(joinRequests.length > 0 ? { color: RED } : {}) }} onClick={() => setActiveTab("requests")}>
            <span style={{ ...styles.statNum, ...(joinRequests.length > 0 ? { color: "#F87171" } : {}) }}>{joinRequests.length}</span>
            <span style={styles.statLbl}>{t("gymJoinRequests")}</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ ...styles.tabs, flexWrap: "wrap" }}>
          {[
            { key: "requests", label: t("gymJoinRequests"), badge: joinRequests.length > 0 ? joinRequests.length : null },
            { key: "members",  label: `${t("gymDashMembersTab")} (${members.length})` },
            { key: "dna",      label: locale === "mn" ? "ДНХ" : locale === "ko" ? "DNA" : "DNA" },
            { key: "sessions", label: t("gymDashSessionsTab") },
            { key: "announce", label: t("gymDashAnnounceTab") },
          ].map(({ key, label, badge }) => (
            <button
              key={key}
              type="button"
              style={{ ...(activeTab === key ? styles.tabActive : styles.tab), position: "relative" }}
              onClick={() => setActiveTab(key)}
            >
              {label}
              {badge && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  minWidth: 16, height: 16, borderRadius: 99,
                  background: RED, color: "#fff",
                  fontSize: 9, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 4px", lineHeight: 1,
                  boxShadow: "0 0 0 2px #0a0a0a",
                }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Join Requests */}
        {activeTab === "requests" && (
          <div>
            {joinRequests.length === 0 ? (
              <EmptyState emoji="👥" title={t("gymNoJoinRequests")} />
            ) : (
              <div style={styles.cardList}>
                {joinRequests.map((req) => {
                  const ru = requesterUsers[req.userId] || {};
                  const name = ru.displayName || ru.username || ru.name || "Fighter";
                  const photo = ru.photoURL || ru.profileImageUrl || "";
                  return (
                    <div key={req.id} style={styles.requestCard}>
                      <div style={styles.requestTop}>
                        <div style={styles.reqAvatar}>
                          {photo
                            ? <Image src={photo} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
                            : <span style={styles.reqAvatarInitial}>{name[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <div style={styles.reqInfo}>
                          <p style={styles.reqName}>{name}</p>
                          <p style={styles.reqDate}>
                            {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                      {req.message && <p style={styles.reqMessage}>&ldquo;{req.message}&rdquo;</p>}
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Members */}
        {activeTab === "members" && (
          <div>
            {members.length === 0 ? (
              <EmptyState emoji="👥" title={t("gymDashNoMembers")} />
            ) : (
              <div style={styles.cardList}>
                {members.map((mem) => {
                  const mu = requesterUsers[mem.userId] || {};
                  const name = mu.displayName || mu.username || mu.name || "Fighter";
                  const photo = mu.photoURL || mu.profileImageUrl || "";
                  const archetype = mu.archetype || "";
                  const weightClass = mu.weightClass || "";
                  const joinedAt = mem.reviewedAt?.toDate
                    ? mem.reviewedAt.toDate().toLocaleDateString()
                    : mem.createdAt?.toDate
                    ? mem.createdAt.toDate().toLocaleDateString()
                    : "";
                  return (
                    <button key={mem.id} type="button" style={{ ...styles.memberCard, width: "100%", textAlign: "left", cursor: "pointer" }} onClick={() => mem.userId && router.push(`/${locale}/profile/${mem.userId}`)}>
                      <div style={styles.requestTop}>
                        <div style={styles.reqAvatar}>
                          {photo
                            ? <Image src={photo} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
                            : <span style={styles.reqAvatarInitial}>{name[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <div style={styles.reqInfo}>
                          <p style={styles.reqName}>{name}</p>
                          <p style={styles.reqDate}>
                            {archetype && weightClass ? `${archetype} · ${weightClass}` : archetype || weightClass || "Fighter"}
                          </p>
                        </div>
                        <div style={styles.memberJoinedChip}>
                          <span style={styles.memberJoinedLabel}>
                            {t("gymDashJoined")}
                          </span>
                          <span style={styles.memberJoinedDate}>{joinedAt}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Fighter DNA Distribution */}
        {activeTab === "dna" && (() => {
          const ARCH_COLORS_GD = { pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981" };
          const ARCH_NAMES_GD  = {
            en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
            mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэмтгий", technician: "Техникийн" },
            ko: { pressure: "압박", outboxer: "아웃복싱", counter: "카운터", explosive: "폭발력", technician: "기술" },
          };
          const AL = ARCH_NAMES_GD[locale] || ARCH_NAMES_GD.en;
          const dist = {};
          members.forEach((m) => {
            const arch = requesterUsers[m.userId]?.fighterDNA?.archetypeKey;
            if (arch) dist[arch] = (dist[arch] || 0) + 1;
          });
          const total     = members.length;
          const confirmed = Object.values(dist).reduce((a, b) => a + b, 0);
          const building  = total - confirmed;
          const sorted    = Object.entries(dist).sort(([, a], [, b]) => b - a);
          const topArch   = sorted[0]?.[0];

          if (total === 0) return <EmptyState emoji="🧬" title={locale === "mn" ? "Гишүүд байхгүй байна" : locale === "ko" ? "멤버 없음" : "No members yet"} />;

          return (
            <div>
              {/* Summary stats */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: "12px 8px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{total}</div>
                  <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>{locale === "mn" ? "Нийт" : locale === "ko" ? "전체" : "Total"}</div>
                </div>
                <div style={{ flex: 1, padding: "12px 8px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 1000, color: "#34D399", fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{confirmed}</div>
                  <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>{locale === "mn" ? "ДНХ тогтсон" : locale === "ko" ? "DNA 확정" : "Confirmed"}</div>
                </div>
                {topArch && (
                  <div style={{ flex: 1, padding: "12px 8px", borderRadius: 12, background: `${ARCH_COLORS_GD[topArch]}10`, border: `1px solid ${ARCH_COLORS_GD[topArch]}30`, textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 1000, color: ARCH_COLORS_GD[topArch], lineHeight: 1.2 }}>{AL[topArch]}</div>
                    <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{locale === "mn" ? "Хамгийн олон" : locale === "ko" ? "최다" : "Top"}</div>
                  </div>
                )}
              </div>

              {/* Distribution bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sorted.map(([arch, count]) => (
                  <div key={arch} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 80, fontSize: 11, fontWeight: 800, color: ARCH_COLORS_GD[arch], flexShrink: 0 }}>{AL[arch]}</span>
                    <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${(count / total) * 100}%`, height: "100%", background: ARCH_COLORS_GD[arch], borderRadius: 4, boxShadow: `0 0 6px ${ARCH_COLORS_GD[arch]}55`, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
                    </div>
                    <span style={{ width: 30, textAlign: "right", fontSize: 14, fontWeight: 900, color: ARCH_COLORS_GD[arch], fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{count}</span>
                  </div>
                ))}
                {building > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 80, fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{locale === "mn" ? "Бүрдэж байна" : locale === "ko" ? "구축 중" : "Building"}</span>
                    <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${(building / total) * 100}%`, height: "100%", background: "rgba(255,255,255,0.12)", borderRadius: 4 }} />
                    </div>
                    <span style={{ width: 30, textAlign: "right", fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{building}</span>
                  </div>
                )}
              </div>

              {/* Top by archetype */}
              {sorted.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 12 }}>
                    {locale === "mn" ? "АРХЕТИПИЙН ТОП ГИШҮҮД" : locale === "ko" ? "아키타입별 TOP 멤버" : "TOP BY ARCHETYPE"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sorted.map(([arch]) => {
                      const topMember = members.find((m) => requesterUsers[m.userId]?.fighterDNA?.archetypeKey === arch);
                      if (!topMember) return null;
                      const mu = requesterUsers[topMember.userId] || {};
                      const name = mu.displayName || mu.username || mu.name || "Fighter";
                      const photo = mu.photoURL || mu.profileImageUrl || "";
                      const archColor = ARCH_COLORS_GD[arch];
                      return (
                        <button
                          key={arch}
                          type="button"
                          onClick={() => topMember.userId && router.push(`/${locale}/profile/${topMember.userId}`)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: `${archColor}08`, border: `1px solid ${archColor}22`, textAlign: "left", cursor: "pointer", color: "#fff" }}
                        >
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${archColor}20`, border: `1px solid ${archColor}40`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {photo
                              ? <img src={photo} alt="" width={34} height={34} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                              : <span style={{ fontSize: 13, fontWeight: 900, color: archColor }}>{name[0]?.toUpperCase()}</span>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                            <div style={{ fontSize: 9, fontWeight: 900, color: archColor, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 1 }}>{AL[arch]}</div>
                          </div>
                          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.15)" }}>›</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Sessions */}
        {activeTab === "sessions" && (
          <EmptyState
            emoji="📅"
            title={t("gymDashSessionSchedule")}
            hint={t("gymDashSessionHint")}
            action={
              <button type="button" style={{ padding: "11px 24px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, #FF3B30, #cc2820)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", marginTop: 4 }} onClick={() => router.push(`/${locale}/coach`)}>
                {t("gymDashFindCoaches")}
              </button>
            }
          />
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
                <p style={styles.sectionLabel}>{t("gymDashPostedAnnouncements")}</p>
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

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}


