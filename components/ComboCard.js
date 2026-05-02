import { DAILY_COMBOS } from "@/lib/data";
import { translate } from "@/lib/i18n";

export default function ComboCard({ locale = "en" }) {
  const t = (key) => translate(locale, key);
  const today = new Date().getDate() % DAILY_COMBOS.length;
  const combo = DAILY_COMBOS[today];

  return (
    <div className="bg-gray-900 p-4 rounded mt-6">
      <h2 className="text-red-600">{t("todaysCombo")}</h2>
      <p>{combo}</p>
    </div>
  );
}