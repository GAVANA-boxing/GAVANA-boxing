"use client";
import { useRouter } from "next/navigation";

export default function WorkoutCard({ workout }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/workout/${workout.id}`)}
      className="bg-gray-900 p-4 rounded cursor-pointer hover:border-red-600 border"
    >
      <h3 className="text-white font-bold">{workout.title}</h3>
      <p className="text-red-600 text-sm">{workout.level}</p>
    </div>
  );
}