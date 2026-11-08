import { redirect } from "next/navigation";

// The locale-less /reels used to render the feed directly, outside the proxy's
// /(mn|en|ko)/… matcher — so CORE_MODE couldn't hide it. Send it to the localized route,
// where the proxy decides (and core mode redirects to /home).
export default function ReelsRedirect() {
  redirect("/mn/reels");
}
