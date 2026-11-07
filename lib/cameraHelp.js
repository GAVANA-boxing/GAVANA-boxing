import { loc } from "@/lib/loc";

// Where to turn the camera back on after the user (or the browser) blocked it.
// Kept per platform because the steps differ and a generic "allow the camera"
// leaves people stuck. Pure: pass navigator.userAgent in.
export function cameraPermissionHelp(userAgent, locale) {
  const ua = String(userAgent || "");
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua));
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    return loc(
      locale,
      "iPhone: хаягийн мөрний «аА» → Вэбсайтын тохиргоо → Камер → Зөвшөөрөх, дараа нь «Дахин оролдох».",
      "iPhone: 주소창의 «가가» → 웹 사이트 설정 → 카메라 → 허용 후 «다시 시도».",
      "iPhone: tap «aA» in the address bar → Website Settings → Camera → Allow, then «Retry camera».",
    );
  }
  if (isAndroid) {
    return loc(
      locale,
      "Android: хаягийн мөрний цоожны дүрс → Зөвшөөрөл → Камер → Зөвшөөрөх, дараа нь «Дахин оролдох».",
      "Android: 주소창의 자물쇠 아이콘 → 권한 → 카메라 → 허용 후 «다시 시도».",
      "Android: tap the lock icon in the address bar → Permissions → Camera → Allow, then «Retry camera».",
    );
  }
  return loc(
    locale,
    "Хаягийн мөрний цоожны дүрс → Камер → Зөвшөөрөх, дараа нь «Дахин оролдох».",
    "주소창의 자물쇠 아이콘 → 카메라 → 허용 후 «다시 시도».",
    "Click the lock icon in the address bar → Camera → Allow, then «Retry camera».",
  );
}
