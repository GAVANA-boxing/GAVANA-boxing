import { WORKOUTS } from "@/lib/data";
import WorkoutCard from "@/components/WorkoutCard";
import ComboCard from "@/components/ComboCard";
import Leaderboard from "@/components/Leaderboard";
import { useTranslations } from "next-intl";

export default function Dashboard() {
  const t = useTranslations("dashboard");

  return (
    <div className="p-6">
      <h1 className="text-3xl">{t("title")}</h1>

      <Leaderboard />

      <ComboCard />

      <div className="grid grid-cols-2 gap-4 mt-6">
        {WORKOUTS.map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </div>
    </div>
  );
}