"use client";

import EnrolledProgramCard from "@/components/programs/EnrolledProgramCard";
import s from "@/components/programs/programsStyles";

/**
 * Props:
 *   enrolledPrograms  array
 *   enrollments       object  — programId → enrollment doc
 *   todayKey          string
 *   t                 (key: string) => string
 *   onContinue        (program) => void
 *   onUnenroll        (programId) => void
 */
export default function MyProgramsSection({
  enrolledPrograms,
  enrollments,
  todayKey,
  t,
  onContinue,
  onUnenroll,
}) {
  if (enrolledPrograms.length === 0) return null;
  return (
    <section style={s.section}>
      <h2 style={s.sectionTitle}>{t("programsMy")}</h2>
      {enrolledPrograms.map((program) => (
        <EnrolledProgramCard
          key={program.id}
          program={program}
          enrollment={enrollments[program.id]}
          todayKey={todayKey}
          t={t}
          onContinue={onContinue}
          onUnenroll={onUnenroll}
        />
      ))}
    </section>
  );
}
