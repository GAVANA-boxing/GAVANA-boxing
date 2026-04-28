"use client";
import { useRouter } from "next/navigation";

export default function LangSwitch() {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <button onClick={() => router.push("/en")}>EN</button>
      <button onClick={() => router.push("/mn")}>MN</button>
      <button onClick={() => router.push("/ko")}>KO</button>
    </div>
  );
}