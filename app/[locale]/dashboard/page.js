import { WORKOUTS } from "@/lib/data";
import WorkoutCard from "@/components/WorkoutCard";
import ComboCard from "@/components/ComboCard";
import Leaderboard from "@/components/Leaderboard";
import { getLocale, translate } from "@/lib/i18n";

export default function Dashboard({ params }) {
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  return (
    <div className="p-6">
      <h1 className="text-3xl">{t("dashboardTitle")}</h1>

      <Leaderboard locale={locale} />

      <ComboCard locale={locale} />

      <div className="grid grid-cols-2 gap-4 mt-6">
        {WORKOUTS.map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </div>
    </div>
  );
}
