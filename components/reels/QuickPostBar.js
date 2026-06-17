"use client";
import d from "@/components/reels/reelsDashboardStyles";

export default function QuickPostBar({ user, profilePhotoUrl, router, currentLocale }) {
  const photo = profilePhotoUrl || user?.photoURL;
  return (
    <div style={d.quickPost}>
      <div style={d.quickAva}>
        {photo
          ? <img src={photo} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          : <span style={{ fontSize: 12, fontWeight: 900 }}>{(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}</span>
        }
      </div>
    </div>
  );
}
