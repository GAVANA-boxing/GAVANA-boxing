"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection, getDocs, limit, query, where,
  addDoc, deleteDoc, doc, updateDoc,
  serverTimestamp, arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import SkeletonBlock from "@/components/SkeletonBlock";
import s from "@/components/programs/programsStyles";
import { snapToDocs } from "@/lib/firestore";
import { getLocalDateKey } from "@/lib/utils";

import ProgramsHeader from "@/components/programs/ProgramsHeader";
import AiBuilderBanner from "@/components/programs/AiBuilderBanner";
import EmptyPrograms from "@/components/programs/EmptyPrograms";
import MyProgramsSection from "@/components/programs/MyProgramsSection";
import DnaRecommendation from "@/components/programs/DnaRecommendation";
import DiscoverSection from "@/components/programs/DiscoverSection";
import SessionSheet from "@/components/programs/SessionSheet";

export default function ProgramsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState({});   // programId → {id, completedDays, streak, ...}
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [completingDay, setCompletingDay] = useState(false);
  const [todayChecked, setTodayChecked] = useState({});  // sessionIndex → bool
  const [userArchetype, setUserArchetype] = useState(null);

  const todayKey = getLocalDateKey();

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (authLoading || !user?.uid) return;
    let active = true;

    async function load() {
      try {
        const progSnap = await getDocs(query(collection(db, "training_programs"), limit(50)));
        const progDocs = snapToDocs(progSnap);
        if (!active) return;
        setPrograms(progDocs);

        const enrollSnap = await getDocs(query(
          collection(db, "program_enrollments"),
          where("userId", "==", user.uid)
        ));
        const enrollMap = {};
        enrollSnap.forEach((d) => { enrollMap[d.data().programId] = { id: d.id, ...d.data() }; });
        if (!active) return;
        setEnrollments(enrollMap);
      } catch {
        if (active) setPrograms([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { doc: docRef, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(docRef(db, "users", user.uid));
        if (active && snap.exists()) {
          const arch = snap.data()?.fighterDNA?.archetypeKey;
          if (arch) setUserArchetype(arch);
        }
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  const handleEnroll = async (program) => {
    if (!user?.uid || enrolling) return;
    setEnrolling(program.id);
    try {
      const ref = await addDoc(collection(db, "program_enrollments"), {
        userId: user.uid,
        programId: program.id,
        enrolledAt: serverTimestamp(),
        completedDays: [],
        streak: 0,
        lastCompletedDate: null,
      });
      setEnrollments((prev) => ({
        ...prev,
        [program.id]: { id: ref.id, userId: user.uid, programId: program.id, completedDays: [], streak: 0 },
      }));
    } catch { /* silent */ } finally {
      setEnrolling(null);
    }
  };

  const handleUnenroll = async (programId) => {
    const enrollment = enrollments[programId];
    if (!enrollment?.id) return;
    try {
      await deleteDoc(doc(db, "program_enrollments", enrollment.id));
      setEnrollments((prev) => { const n = { ...prev }; delete n[programId]; return n; });
      if (selectedProgram?.id === programId) setSelectedProgram(null);
    } catch { /* silent */ }
  };

  const handleCompleteDay = async () => {
    if (!selectedProgram || !user?.uid || completingDay) return;
    const enrollment = enrollments[selectedProgram.id];
    if (!enrollment?.id) return;

    setCompletingDay(true);
    try {
      const completedDays = enrollment.completedDays || [];
      const yesterday = getLocalDateKey(new Date(Date.now() - 86400000));
      const newStreak = completedDays.includes(yesterday) ? (enrollment.streak || 0) + 1 : 1;

      await updateDoc(doc(db, "program_enrollments", enrollment.id), {
        completedDays: arrayUnion(todayKey),
        streak: newStreak,
        lastCompletedDate: todayKey,
        updatedAt: serverTimestamp(),
      });

      setEnrollments((prev) => ({
        ...prev,
        [selectedProgram.id]: {
          ...prev[selectedProgram.id],
          completedDays: [...completedDays, todayKey],
          streak: newStreak,
          lastCompletedDate: todayKey,
        },
      }));
      setTodayChecked({});
      setSelectedProgram(null);
    } catch { /* silent */ } finally {
      setCompletingDay(false);
    }
  };

  const enrolledPrograms = useMemo(() => programs.filter((p) => enrollments[p.id]), [programs, enrollments]);
  const discoverPrograms = useMemo(() => programs.filter((p) => !enrollments[p.id]), [programs, enrollments]);

  const allSessionsDone = useMemo(() => {
    if (!selectedProgram?.sessions?.length) return false;
    return selectedProgram.sessions.every((_, i) => todayChecked[i]);
  }, [selectedProgram, todayChecked]);

  if (authLoading || (!user && !authLoading)) {
    return <div style={s.page}><div style={{ padding: 40, textAlign: "center", color: "#555" }}>...</div></div>;
  }

  return (
    <div style={s.page}>
      <ProgramsHeader
        onBack={() => router.back()}
        title={t("programsTitle")}
      />

      <div style={s.content}>
        <AiBuilderBanner
          locale={locale}
          onClick={() => router.push(`/${locale}/workout/builder`)}
        />

        {loading ? (
          <>
            <SkeletonBlock height={24} radius={8} />
            <SkeletonBlock height={160} />
            <SkeletonBlock height={24} radius={8} />
            <SkeletonBlock height={100} />
            <SkeletonBlock height={100} />
          </>
        ) : (
          <>
            {programs.length === 0 && (
              <EmptyPrograms
                locale={locale}
                onOpenBuilder={() => router.push(`/${locale}/workout/builder`)}
              />
            )}

            <MyProgramsSection
              enrolledPrograms={enrolledPrograms}
              enrollments={enrollments}
              todayKey={todayKey}
              t={t}
              onContinue={(program) => { setTodayChecked({}); setSelectedProgram(program); }}
              onUnenroll={handleUnenroll}
            />

            <DnaRecommendation
              userArchetype={userArchetype}
              discoverPrograms={discoverPrograms}
              locale={locale}
              enrolling={enrolling}
              onEnroll={handleEnroll}
            />

            <DiscoverSection
              discoverPrograms={discoverPrograms}
              t={t}
              enrolling={enrolling}
              onEnroll={handleEnroll}
            />
          </>
        )}
      </div>

      <SessionSheet
        program={selectedProgram}
        todayChecked={todayChecked}
        allSessionsDone={allSessionsDone}
        completingDay={completingDay}
        t={t}
        onToggleSession={(i, checked) => setTodayChecked((prev) => ({ ...prev, [i]: checked }))}
        onCompleteDay={handleCompleteDay}
        onClose={() => setSelectedProgram(null)}
      />

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}
