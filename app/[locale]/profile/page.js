import ProfileRedirectClient from "./ProfileRedirectClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ProfilePage() {
  return <ProfileRedirectClient />;
}
