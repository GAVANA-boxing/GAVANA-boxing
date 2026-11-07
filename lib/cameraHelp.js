import { loc } from "@/lib/loc";

// Where to turn the camera back on after the user (or the browser) blocked it.
// Kept per platform because the steps differ and a generic "allow the camera"
// leaves people stuck. Pure: pass navigator.userAgent in.
// `retryLabel` is the button the user taps afterwards (defaults to Train's
// "Retry camera"), so each screen names its own button.
export function cameraPermissionHelp(userAgent, locale, retryLabel) {
  const ua = String(userAgent || "");
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua));
  const isAndroid = /Android/i.test(ua);
  const retry = retryLabel || loc(locale, "Дахин оролдох", "다시 시도", "Retry camera");
  const then = loc(locale, `, дараа нь «${retry}».`, ` 후 «${retry}».`, `, then «${retry}».`);

  if (isIOS) {
    return loc(
      locale,
      "iPhone: хаягийн мөрний «аА» → Вэбсайтын тохиргоо → Камер → Зөвшөөрөх",
      "iPhone: 주소창의 «가가» → 웹 사이트 설정 → 카메라 → 허용",
      "iPhone: tap «aA» in the address bar → Website Settings → Camera → Allow",
    ) + then;
  }
  if (isAndroid) {
    return loc(
      locale,
      "Android: хаягийн мөрний цоожны дүрс → Зөвшөөрөл → Камер → Зөвшөөрөх",
      "Android: 주소창의 자물쇠 아이콘 → 권한 → 카메라 → 허용",
      "Android: tap the lock icon in the address bar → Permissions → Camera → Allow",
    ) + then;
  }
  return loc(
    locale,
    "Хаягийн мөрний цоожны дүрс → Камер → Зөвшөөрөх",
    "주소창의 자물쇠 아이콘 → 카메라 → 허용",
    "Click the lock icon in the address bar → Camera → Allow",
  ) + then;
}
