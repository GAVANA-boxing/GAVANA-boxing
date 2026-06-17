"use client";

import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import { GymFormField } from "@/components/gyms/GymFormField";
import { GYM_TYPES, GYM_TYPE_KEYS, SPECIALTIES, AMENITIES, AMENITY_KEYS } from "@/lib/gymConstants";
import styles from "@/components/gyms/gymsDashboardStyles";

export default function GymRegisterForm({
  router,
  user,
  locale,
  t,
  logoInputRef,
  logoPreview,
  handleLogoSelect,
  registerError,
  gymName, setGymName,
  gymDesc, setGymDesc,
  country, setCountry,
  city, setCity,
  district, setDistrict,
  address, setAddress,
  gymType, setGymType,
  specialties, toggleSpecialty,
  amenities, toggleAmenity,
  phone, setPhone,
  instagram, setInstagram,
  website, setWebsite,
  uploading, uploadProgress,
  submitting,
  handleRegister,
}) {
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
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder={locale === "mn" ? "Монгол" : locale === "ko" ? "몽골" : "Mongolia"} style={styles.input} />
            </GymFormField>
            <GymFormField label={t("gymRegisterCity")} style={{ flex: 1 }}>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder={locale === "mn" ? "Улаанбаатар" : locale === "ko" ? "울란바토르" : "Ulaanbaatar"} style={styles.input} />
            </GymFormField>
          </div>

          <GymFormField label={t("gymRegisterDistrict")}>
            <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder={locale === "mn" ? "Дүүрэг" : locale === "ko" ? "구/동" : "District"} style={styles.input} />
          </GymFormField>

          <GymFormField label={t("gymRegisterAddress")}>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={locale === "mn" ? "Гудамж, барилга..." : locale === "ko" ? "도로명, 건물..." : "Street, building..."} style={styles.input} />
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
