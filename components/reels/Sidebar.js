"use client";
import {
  IcoHome, IcoPlay, IcoBrain, IcoTrophy, IcoTarget, IcoSwords,
  IcoMessage, IcoBars, IcoBuilding, IcoUsers, IcoFlash,
} from "@/components/reels/DashboardIcons";
import d from "@/components/reels/reelsDashboardStyles";

export default function Sidebar({ router, user, profilePhotoUrl, currentLocale }) {
  const NAV = [
    { Icon: IcoHome,     label: "Нүүр",            path: "" },
    { Icon: IcoPlay,     label: "Рилс",             path: "reels", active: true },
    { Icon: IcoBrain,    label: "AI Коач",          path: "train" },
    { Icon: IcoTrophy,   label: "Чансаа",           path: "rank" },
    { Icon: IcoBars,     label: "Дэлхийн рейтинг",  path: "leaderboard" },
    { Icon: IcoTarget,   label: "Тренер",           path: "coach" },
    { Icon: IcoSwords,   label: "Спарринг",         path: "sparring" },
    { Icon: IcoBuilding, label: "Заал",             path: "gyms" },
    { Icon: IcoUsers,    label: "Тулаанчид",        path: "fighters" },
    { Icon: IcoFlash,    label: "Чэлэнж",           path: "challenges" },
    { Icon: IcoMessage,  label: "Мессеж",           path: "inbox" },
  ];

  return (
    <aside style={d.sidebar}>
      <div style={d.sidebarLogo}>
        <span style={d.logoGavana}>GAVANA</span>
        <span style={d.logoBoxing}>BOXING</span>
      </div>

      <nav style={d.sidebarNav}>
        {NAV.map(({ Icon, label, path, active }) => (
          <button
            key={path}
            className="dashboard-nav-btn"
            style={{ ...d.navBtn, ...(active ? d.navBtnActive : {}) }}
            onClick={() => router.push(`/${currentLocale}/${path}`)}
          >
            <span style={{ ...d.navIcon, color: active ? "#fff" : "rgba(255,255,255,0.38)" }}>
              <Icon />
            </span>
            <span style={d.navLabel}>{label}</span>
            <span style={d.navChevron}>›</span>
            {active && <div style={d.navActiveBar} />}
          </button>
        ))}
      </nav>

      {user && (
        <button
          style={{ ...d.sidebarProfile, position: "relative", zIndex: 2 }}
          onClick={() => router.push(`/${currentLocale}/profile/${user.uid}`)}
        >
          <div style={d.sidebarProfileAva}>
            {(profilePhotoUrl || user.photoURL)
              ? <img src={profilePhotoUrl || user.photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : <span style={{ fontSize: 13, fontWeight: 900 }}>{(user.displayName || user.email || "U").charAt(0).toUpperCase()}</span>
            }
          </div>
          <div style={d.sidebarProfileInfo}>
            <div style={d.sidebarProfileName}>{user.displayName || user.email?.split("@")[0] || "Та"}</div>
            <div style={d.sidebarProfileSub}>GAVANA BOXING</div>
          </div>
        </button>
      )}
    </aside>
  );
}
