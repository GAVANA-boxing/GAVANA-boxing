import { DAILY_COMBOS } from "@/lib/data";

export default function ComboCard() {
  const today = new Date().getDate() % DAILY_COMBOS.length;
  const combo = DAILY_COMBOS[today];

  return (
    <div className="bg-gray-900 p-4 rounded mt-6">
      <h2 className="text-red-600">Today&apos;s Combo</h2>
      <p>{combo}</p>
    </div>
  );
}