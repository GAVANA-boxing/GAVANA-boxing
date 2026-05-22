export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Dashboard | Gavana Boxing",
  description: "Your personal boxing training dashboard, progress, and stats.",
  openGraph: {
    title: "Dashboard | Gavana Boxing",
    description: "Your personal boxing training dashboard, progress, and stats.",
    type: "website",
  },
};

import AthleteDashboard from "@/components/AthleteDashboard";

export default function DashboardPage() {
  return <AthleteDashboard />;
}
