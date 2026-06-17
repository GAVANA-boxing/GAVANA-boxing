"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import styles from "@/components/gyms/gymsDashboardStyles";
import { useGymDashboardData } from "@/hooks/useGymDashboardData";
import { useGymDashboardActions } from "@/hooks/useGymDashboardActions";

import DashboardLoadingSkeleton from "@/components/gyms/DashboardLoadingSkeleton";
import GymRegisterForm from "@/components/gyms/GymRegisterForm";
import GymRegisterSuccess from "@/components/gyms/GymRegisterSuccess";
import GymProfileCompleteness from "@/components/gyms/GymProfileCompleteness";
import GymStatsPanel from "@/components/gyms/GymStatsPanel";
import GymDashTabs from "@/components/gyms/GymDashTabs";
import GymJoinRequests from "@/components/gyms/GymJoinRequests";
import GymMembersList from "@/components/gyms/GymMembersList";
import GymDNADistribution from "@/components/gyms/GymDNADistribution";
import GymSessionsTab from "@/components/gyms/GymSessionsTab";
import GymAnnouncementsTab from "@/components/gyms/GymAnnouncementsTab";

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
    return <DashboardLoadingSkeleton router={router} user={user} locale={locale} />;
  }
  if (!user) return null;

  // Registration form (no gym yet)
  if (!gym && !registerSuccess) {
    return (
      <GymRegisterForm
        router={router}
        user={user}
        locale={locale}
        t={t}
        logoInputRef={logoInputRef}
        logoPreview={logoPreview}
        handleLogoSelect={handleLogoSelect}
        registerError={registerError}
        gymName={gymName} setGymName={setGymName}
        gymDesc={gymDesc} setGymDesc={setGymDesc}
        country={country} setCountry={setCountry}
        city={city} setCity={setCity}
        district={district} setDistrict={setDistrict}
        address={address} setAddress={setAddress}
        gymType={gymType} setGymType={setGymType}
        specialties={specialties} toggleSpecialty={toggleSpecialty}
        amenities={amenities} toggleAmenity={toggleAmenity}
        phone={phone} setPhone={setPhone}
        instagram={instagram} setInstagram={setInstagram}
        website={website} setWebsite={setWebsite}
        uploading={uploading}
        uploadProgress={uploadProgress}
        submitting={submitting}
        handleRegister={handleRegister}
      />
    );
  }

  if (registerSuccess && gym) {
    return <GymRegisterSuccess router={router} user={user} locale={locale} t={t} gym={gym} />;
  }

  // Owner dashboard
  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.content}>
        <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}>← {gym.gymName}</button>

        <div style={styles.dashHeader}>
          <p style={styles.kicker}>COMBAT · GYM</p>
          <h1 style={styles.title}>{t("gymDashboard")}</h1>
          <GymProfileCompleteness gym={gym} t={t} />
        </div>

        <GymStatsPanel
          gym={gym}
          joinRequests={joinRequests}
          t={t}
          locale={locale}
          router={router}
          setActiveTab={setActiveTab}
        />

        <GymDashTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          joinRequests={joinRequests}
          members={members}
          locale={locale}
          t={t}
        />

        {activeTab === "requests" && (
          <GymJoinRequests
            joinRequests={joinRequests}
            requesterUsers={requesterUsers}
            updatingId={updatingId}
            handleJoinAction={handleJoinAction}
            t={t}
          />
        )}

        {activeTab === "members" && (
          <GymMembersList
            members={members}
            requesterUsers={requesterUsers}
            locale={locale}
            router={router}
            t={t}
          />
        )}

        {activeTab === "dna" && (
          <GymDNADistribution
            members={members}
            requesterUsers={requesterUsers}
            locale={locale}
            router={router}
          />
        )}

        {activeTab === "sessions" && (
          <GymSessionsTab
            members={members}
            requesterUsers={requesterUsers}
            locale={locale}
            router={router}
            t={t}
            gym={gym}
          />
        )}

        {activeTab === "announce" && (
          <GymAnnouncementsTab
            annTitle={annTitle} setAnnTitle={setAnnTitle}
            annBody={annBody} setAnnBody={setAnnBody}
            annPosting={annPosting}
            annSuccess={annSuccess}
            annError={annError}
            handlePostAnnouncement={handlePostAnnouncement}
            announcements={announcements}
            t={t}
          />
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}
