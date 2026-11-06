// Which bottom-nav tab a URL belongs to. One nav everywhere:
// Home · Progress · Train · Coach · Me.
export function getActiveTab(pathname = "") {
  const seg = pathname.split("/").filter(Boolean)[1] || "";
  if (seg === "home") return "home";
  if (["rank", "history", "dashboard", "fighter-profile", "progress"].includes(seg)) return "progress";
  if (["train", "ghost"].includes(seg)) return "train";
  if (["coach", "drills"].includes(seg)) return "coach";
  if (["profile", "notifications", "inbox"].includes(seg)) return "profile";
  if (seg === "feed") return "feed";
  return "";
}
