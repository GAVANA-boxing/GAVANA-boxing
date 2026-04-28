"use client";
import { useParams } from "next/navigation";
import { WORKOUTS } from "@/lib/data";
import { useState } from "react";

export default function WorkoutDetail() {
  const { id } = useParams();
  const workout = WORKOUTS.find(
    (w) => w.id === Number(id)
  );

  const [done, setDone] = useState({});

  if (!workout) return <div>Not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl text-red-600 mb-4">
        {workout.title}
      </h1>

      {workout.exercises.map((ex, i) => (
        <div
          key={i}
          onClick={() =>
            setDone({ ...done, [i]: !done[i] })
          }
          className={`p-4 mb-2 rounded cursor-pointer ${
            done[i]
              ? "bg-red-900"
              : "bg-gray-900"
          }`}
        >
          {ex.name} - {ex.details}
        </div>
      ))}
    </div>
  );
}