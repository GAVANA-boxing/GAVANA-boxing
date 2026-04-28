import Link from "next/link";
import LangSwitch from "./LangSwitch";

export default function Header() {
  return (
    <div className="flex justify-between p-4 border-b border-red-600">
      <Link href="/en" className="text-red-600 font-bold">
        🥊 GAVANA
      </Link>
      <LangSwitch />
    </div>
  );
}