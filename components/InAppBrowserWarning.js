"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";

function detectInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Instagram, Facebook, TikTok, Twitter/X, LinkedIn, Snapchat, WeChat
  return /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Instagram|TikTok|BytedanceWebview|Twitter|LinkedInApp|Snapchat|MicroMessenger|Line\/|KAKAOTALK/i.test(ua);
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iP(hone|od|ad)/i.test(navigator.userAgent);
}

const STRINGS = {
  en: {
    badge: "Instagram / In-App Browser Detected",
    title: "Open in Safari or Chrome",
    body: "GAVANA uses your camera for AI punch scoring. Instagram's in-app browser blocks camera access and crashes the app.",
    step1: 'Tap the  ···  menu (top-right corner)',
    step2: 'Choose "Open in Safari" or "Open in Browser"',
    step3: "Use GAVANA with full performance",
    safari: "Open in Safari",
    copy: "Copy Link",
    copied: "Copied!",
    skip: "Continue anyway (limited features)",
  },
  mn: {
    badge: "Instagram / Аппын дотоод хөтөч илрэв",
    title: "Safari эсвэл Chrome-д нээнэ үү",
    body: "GAVANA камерыг ашиглан AI цохилтын оноог тооцдог. Instagram-ийн дотоод хөтөч камерын хандалтыг хааж, апп ажиллахгүй болгодог.",
    step1: "Баруун дээд буланд байгаа  ···  цэсийг дарна уу",
    step2: '"Хөтөч дээр нээх" гэсэн сонголтыг сонгоно уу',
    step3: "GAVANA-г бүрэн хурдаар ашиглаарай",
    safari: "Safari-д нээх",
    copy: "Холбоос хуулах",
    copied: "Хуулагдлаа!",
    skip: "Үргэлжлүүлэх (хязгаарлагдмал горим)",
  },
  ko: {
    badge: "Instagram / 인앱 브라우저 감지됨",
    title: "Safari 또는 Chrome에서 열어주세요",
    body: "GAVANA는 AI 펀치 스코어링을 위해 카메라를 사용합니다. Instagram 인앱 브라우저는 카메라 접근을 차단하여 앱이 제대로 작동하지 않습니다.",
    step1: "오른쪽 상단의  ···  메뉴를 탭하세요",
    step2: '"브라우저에서 열기"를 선택하세요',
    step3: "GAVANA를 최고 성능으로 사용하세요",
    safari: "Safari에서 열기",
    copy: "링크 복사",
    copied: "복사됨!",
    skip: "계속하기 (기능 제한)",
  },
};

export default function InAppBrowserWarning() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) || "en";
  const s = STRINGS[locale] || STRINGS.en;

  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!detectInAppBrowser()) return;
    // Don't show if user explicitly dismissed in this session
    const sessionDismissed = sessionStorage.getItem("gavana_iab_skip");
    if (!sessionDismissed) setVisible(true);
  }, []);

  const handleCopy = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleSafari = () => {
    // Safari deep link — works on iOS
    window.location.href = window.location.href;
  };

  const handleSkip = () => {
    sessionStorage.setItem("gavana_iab_skip", "1");
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || dismissed) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div style={overlay}>
      {/* Background blur */}
      <div style={backdrop} />

      <div style={card}>
        {/* Badge */}
        <div style={badgeRow}>
          <span style={badgeDot} />
          <span style={badgeText}>{s.badge}</span>
        </div>

        {/* Icon */}
        <div style={iconWrap}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="rgba(229,57,53,0.12)" />
            <path d="M24 14v12M24 32v2" stroke="#E53935" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <h2 style={titleStyle}>{s.title}</h2>
        <p style={bodyStyle}>{s.body}</p>

        {/* Steps */}
        <div style={stepsWrap}>
          {[s.step1, s.step2, s.step3].map((step, i) => (
            <div key={i} style={stepRow}>
              <div style={stepNum}>{i + 1}</div>
              <span style={stepText}>{step}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={btnGroup}>
          {isIOS() && (
            <a
              href={`x-web-search://?${encodeURIComponent(currentUrl)}`}
              style={primaryBtn}
              onClick={(e) => {
                e.preventDefault();
                // Try to trigger Safari open — works in some Instagram versions
                window.location.href = currentUrl.replace(/^https?/, "safari-https").replace(/^https?/, "safari-http") || currentUrl;
              }}
            >
              {s.safari}
            </a>
          )}
          <button type="button" onClick={handleCopy} style={copyBtn}>
            {copied ? s.copied : s.copy}
          </button>
        </div>

        <button type="button" onClick={handleSkip} style={skipBtn}>
          {s.skip}
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  zIndex: 99999,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: "0 0 env(safe-area-inset-bottom, 16px)",
};

const backdrop = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.88)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const card = {
  position: "relative",
  width: "min(480px, 100vw)",
  background: "#111113",
  borderRadius: "24px 24px 0 0",
  border: "1px solid rgba(255,255,255,0.08)",
  borderBottom: "none",
  padding: "28px 24px 32px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0,
  textAlign: "center",
};

const badgeRow = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 20,
  background: "rgba(229,57,53,0.1)",
  border: "1px solid rgba(229,57,53,0.25)",
  borderRadius: 100,
  padding: "4px 10px",
};

const badgeDot = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#E53935",
  flexShrink: 0,
  animation: "pulse 1.8s ease-in-out infinite",
};

const badgeText = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "#E53935",
  textTransform: "uppercase",
};

const iconWrap = {
  marginBottom: 16,
};

const titleStyle = {
  fontSize: 22,
  fontWeight: 900,
  color: "#fff",
  margin: "0 0 10px",
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
};

const bodyStyle = {
  fontSize: 13,
  color: "rgba(255,255,255,0.55)",
  lineHeight: 1.6,
  margin: "0 0 24px",
  maxWidth: 340,
};

const stepsWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  width: "100%",
  marginBottom: 28,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 14,
  padding: "16px 14px",
};

const stepRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  textAlign: "left",
};

const stepNum = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "rgba(229,57,53,0.15)",
  border: "1px solid rgba(229,57,53,0.3)",
  color: "#E53935",
  fontSize: 11,
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const stepText = {
  fontSize: 13,
  color: "rgba(255,255,255,0.75)",
  lineHeight: 1.5,
  paddingTop: 2,
};

const btnGroup = {
  display: "flex",
  gap: 10,
  width: "100%",
  marginBottom: 12,
};

const primaryBtn = {
  flex: 1,
  padding: "14px 16px",
  background: "#E53935",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const copyBtn = {
  flex: 1,
  padding: "14px 16px",
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const skipBtn = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.3)",
  fontSize: 12,
  cursor: "pointer",
  padding: "4px 8px",
  textDecoration: "underline",
};
