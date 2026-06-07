"use client";

import { useParams, useRouter } from "next/navigation";
import { getLocale } from "@/lib/i18n";
import { GOLD, RED } from "@/lib/tokens";

const T = {
  en: {
    back: "← Back",
    badge: "Legal",
    title: "Privacy Policy",
    updated: "Last updated: June 6, 2025",
    intro:
      'GAVANA Boxing ("GAVANA", "we", "our") is committed to protecting your privacy. This policy explains what data we collect, why we collect it, and how we use it when you use our boxing training application.',

    sections: [
      {
        heading: "1. Data We Collect",
        body: [
          "Account information: email address, display name, and profile photo when you create an account.",
          "Training data: session records, punch counts, accuracy scores, round data, and XP points generated during your training sessions.",
          "DNA archetype: your fighter identity classification (pressure, outboxer, counter, explosive, technician) determined from your training patterns.",
          "Device information: device type, operating system, and app version for technical support purposes.",
          "Usage data: pages visited, features used, and time spent in the app to improve the product.",
        ],
      },
      {
        heading: "2. How We Use Your Data",
        body: [
          "Provide and improve the GAVANA training platform and AI coaching features.",
          "Generate your Fighter DNA profile and training prescriptions.",
          "Display leaderboards and ranking systems.",
          "Send push notifications about training reminders and achievements (only with your permission).",
          "Analyze aggregate, anonymized usage patterns to improve app features.",
        ],
      },
      {
        heading: "3. AI & Movement Analysis",
        body: [
          "GAVANA uses on-device movement analysis (MediaPipe) to track your boxing technique. This processing happens on your device — raw video is not transmitted to our servers.",
          "AI coaching responses are generated via OpenAI's API. Your chat messages may be processed by OpenAI subject to their privacy policy. We do not store conversation history on our servers beyond the current session.",
          "Training metrics submitted to AI analysis are anonymized before processing.",
        ],
      },
      {
        heading: "4. Third-Party Services",
        body: [
          "Firebase (Google): Authentication, database storage, and push notifications. Subject to Google's Privacy Policy.",
          "OpenAI: AI coaching responses. Subject to OpenAI's Privacy Policy.",
          "Stripe: Payment processing for premium subscriptions. We never store your full card details — Stripe handles all payment data.",
        ],
      },
      {
        heading: "5. Data Sharing",
        body: [
          "We do not sell your personal data to third parties.",
          "We do not share your individual training data with other users without your explicit consent.",
          "Leaderboard display name and rank are visible to other users by default. You may adjust this in your profile settings.",
          "We may share anonymized, aggregated statistics (e.g., average session length) for research or marketing purposes.",
        ],
      },
      {
        heading: "6. Data Retention",
        body: [
          "Your account data is retained for as long as your account is active.",
          "You may request deletion of your account and all associated data by contacting us at privacy@gavana.app.",
          "After account deletion, your data will be permanently removed within 30 days.",
        ],
      },
      {
        heading: "7. Children's Privacy",
        body: [
          "GAVANA is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.",
          "If you believe a child under 13 has provided us with personal information, please contact us immediately.",
        ],
      },
      {
        heading: "8. Your Rights",
        body: [
          "Access: You may request a copy of your personal data at any time.",
          "Correction: You may update your account information directly in the app or by contacting us.",
          "Deletion: You may delete your account from profile settings or by emailing privacy@gavana.app.",
          "Portability: You may request an export of your training data in a standard format.",
        ],
      },
      {
        heading: "9. Security",
        body: [
          "We use industry-standard security measures including encrypted data transmission (HTTPS) and Firebase's built-in security rules.",
          "No method of transmission over the internet is 100% secure. We cannot guarantee absolute security but are committed to protecting your data.",
        ],
      },
      {
        heading: "10. Changes to This Policy",
        body: [
          "We may update this Privacy Policy from time to time. We will notify you of significant changes via the app or by email.",
          "Continued use of GAVANA after changes constitutes acceptance of the updated policy.",
        ],
      },
      {
        heading: "11. Contact",
        body: [
          "Questions about this Privacy Policy? Contact us at:",
          "Email: privacy@gavana.app",
          "GAVANA Boxing",
        ],
      },
    ],
  },

  mn: {
    back: "← Буцах",
    badge: "Хууль эрх зүй",
    title: "Нууцлалын бодлого",
    updated: "Сүүлд шинэчилсэн: 2025 оны 6-р сарын 6",
    intro:
      'GAVANA Boxing ("GAVANA", "бид") таны нууцлалыг хамгаалахад үүрэг хүлээнэ. Энэхүү бодлого нь боксын дасгалжуулалтын програм ашиглах үед ямар мэдээлэл цуглуулах, яагаад, хэрхэн ашиглах талаар тайлбарлана.',

    sections: [
      {
        heading: "1. Цуглуулах мэдээлэл",
        body: [
          "Бүртгэлийн мэдээлэл: и-мэйл хаяг, нэвтрэх нэр, профайл зураг.",
          "Дасгалын мэдээлэл: сессийн бичлэг, цохилтын тоо, нарийвчлалын оноо, раундын мэдээлэл, XP оноо.",
          "DNA архетип: дасгалын загвараас тодорхойлогдсон тулаанчийн шинж (pressure, outboxer, counter, explosive, technician).",
          "Төхөөрөмжийн мэдээлэл: төхөөрөмжийн төрөл, үйлдлийн систем, апп-ийн хувилбар.",
          "Хэрэглээний мэдээлэл: зочилсон хуудас, ашигласан функц, апп-д зарцуулсан хугацаа.",
        ],
      },
      {
        heading: "2. Мэдээллийг хэрхэн ашиглах вэ",
        body: [
          "GAVANA дасгалжуулалтын платформ болон AI коучийн функцуудыг хангах, сайжруулах.",
          "Тулаанчийн DNA профайл болон дасгалын жор гаргах.",
          "Тэргүүний самбар болон зэрэглэлийн систем харуулах.",
          "Дасгалжуулалтын сануулга, амжилтын мэдэгдэл илгээх (зөвшөөрлийнхөө дагуу).",
          "Апп-ийн функцуудыг сайжруулах зорилгоор нэгтгэсэн, нэргүй хэрэглээний мэдээлэл шинжлэх.",
        ],
      },
      {
        heading: "3. AI болон хөдөлгөөний шинжилгээ",
        body: [
          "GAVANA нь MediaPipe ашиглан боксын техникийг хянадаг. Энэхүү боловсруулалт таны төхөөрөмж дээр хийгдэх тул бид бичлэг сервер рүү дамжуулдаггүй.",
          "AI коучийн хариулт OpenAI API-аар үүсгэгдэнэ. Чат мессежийг OpenAI боловсруулж болно. Бид одоогийн сессийн дараа чатын түүхийг хадгалдаггүй.",
          "AI шинжилгээнд илгээх дасгалын мэдээлэл боловсруулахаас өмнө нэргүй болгодог.",
        ],
      },
      {
        heading: "4. Гуравдагч талын үйлчилгээ",
        body: [
          "Firebase (Google): Нэвтрэлт, өгөгдлийн сан, push мэдэгдэл. Google-ийн нууцлалын бодлогод хамаарна.",
          "OpenAI: AI коучийн хариулт. OpenAI-ийн нууцлалын бодлогод хамаарна.",
          "Stripe: Үнэт захиалгын төлбөр боловсруулалт. Бид таны картын дэлгэрэнгүй мэдээллийг хэзээ ч хадгалдаггүй.",
        ],
      },
      {
        heading: "5. Мэдээлэл хуваалцах",
        body: [
          "Бид таны хувийн мэдээллийг гуравдагч талд зардаггүй.",
          "Таны зөвшөөрөлгүйгээр дасгалын мэдээллийг бусад хэрэглэгчтэй хуваалцдаггүй.",
          "Тэргүүний самбар дээрх нэвтрэх нэр болон зэрэглэл бусад хэрэглэгчдэд харагдана. Профайл тохиргооноос өөрчилж болно.",
        ],
      },
      {
        heading: "6. Мэдээлэл хадгалах хугацаа",
        body: [
          "Бүртгэлийн мэдээллийг таны данс идэвхтэй байх хугацаанд хадгална.",
          "Бүртгэл болон холбогдох бүх мэдээллийг устгах хүсэлтийг privacy@gavana.app хаягт илгээнэ.",
          "Бүртгэл устгасны дараа 30 хоногийн дотор мэдээллийг бүрмөсөн устгана.",
        ],
      },
      {
        heading: "7. Хүүхдийн нууцлал",
        body: [
          "GAVANA нь 13 нас хүрээгүй хэрэглэгчдэд зориулагдаагүй. Бид 13-аас доош насны хүүхдийн мэдээллийг мэдсэн хамт цуглуулдаггүй.",
          "13-аас доош насны хүүхэд мэдээлэл өгсөн гэж үзвэл бидэнтэй нэн даруй холбогдоно уу.",
        ],
      },
      {
        heading: "8. Таны эрх",
        body: [
          "Хандах эрх: Хэдийд ч хувийн мэдээллийнхаа хуулбарыг хүсэж болно.",
          "Засах эрх: Бүртгэлийн мэдээллийг апп-д шууд эсвэл холбогдосноор засна.",
          "Устгах эрх: Профайл тохиргооноос эсвэл privacy@gavana.app-д имэйл илгээж данс устгана.",
          "Дамжуулах эрх: Дасгалын мэдээллийг стандарт форматаар экспортлохыг хүсэж болно.",
        ],
      },
      {
        heading: "9. Аюулгүй байдал",
        body: [
          "HTTPS шифрлэгдсэн холбоо болон Firebase-ийн аюулгүй байдлын дүрэм ашигладаг.",
          "Интернэтээр дамжуулах аргачлал 100% аюулгүй биш. Гэхдээ бид таны мэдээллийг хамгаалахад үүрэг хүлээнэ.",
        ],
      },
      {
        heading: "10. Бодлогын өөрчлөлт",
        body: [
          "Энэхүү бодлогыг цаг үе дамжуулан шинэчилж болно. Томоохон өөрчлөлтийг апп эсвэл имэйлээр мэдэгдэнэ.",
          "Өөрчлөлтийн дараа GAVANA-г үргэлжлүүлэн ашигласнаар шинэчилсэн бодлогыг хүлээн зөвшөөрсөнд тооцно.",
        ],
      },
      {
        heading: "11. Холбоо барих",
        body: [
          "Нууцлалын бодлоготой холбоотой асуулт байвал:",
          "И-мэйл: privacy@gavana.app",
          "GAVANA Boxing",
        ],
      },
    ],
  },

  ko: {
    back: "← 뒤로",
    badge: "법적 고지",
    title: "개인정보 처리방침",
    updated: "최종 업데이트: 2025년 6월 6일",
    intro:
      'GAVANA Boxing("GAVANA", "당사")은 귀하의 개인정보 보호에 최선을 다합니다. 이 방침은 복싱 트레이닝 앱 이용 시 수집하는 데이터, 수집 이유, 활용 방법을 설명합니다.',

    sections: [
      {
        heading: "1. 수집하는 데이터",
        body: [
          "계정 정보: 계정 생성 시 이메일 주소, 표시 이름, 프로필 사진.",
          "트레이닝 데이터: 세션 기록, 펀치 횟수, 정확도 점수, 라운드 데이터, XP 포인트.",
          "DNA 아키타입: 트레이닝 패턴으로 결정된 파이터 유형 (압박형, 아웃복서, 카운터, 폭발형, 테크니션).",
          "기기 정보: 기기 유형, 운영 체제, 앱 버전.",
          "사용 데이터: 방문 페이지, 사용 기능, 앱 내 시간.",
        ],
      },
      {
        heading: "2. 데이터 활용 방법",
        body: [
          "GAVANA 트레이닝 플랫폼 및 AI 코칭 기능 제공 및 개선.",
          "파이터 DNA 프로필 및 트레이닝 처방 생성.",
          "리더보드 및 랭킹 시스템 표시.",
          "트레이닝 알림 및 달성 알림 푸시 전송 (허가 시에만).",
          "앱 기능 개선을 위한 익명화된 집계 사용 패턴 분석.",
        ],
      },
      {
        heading: "3. AI 및 동작 분석",
        body: [
          "GAVANA는 MediaPipe를 사용하여 복싱 기술을 분석합니다. 이 처리는 기기 내에서 이루어지며 원본 영상은 서버로 전송되지 않습니다.",
          "AI 코칭 응답은 OpenAI API를 통해 생성됩니다. 채팅 메시지는 OpenAI에서 처리될 수 있습니다. 현재 세션 이후 대화 기록은 서버에 저장되지 않습니다.",
          "AI 분석에 제출된 트레이닝 지표는 처리 전 익명화됩니다.",
        ],
      },
      {
        heading: "4. 제3자 서비스",
        body: [
          "Firebase (Google): 인증, 데이터베이스 저장, 푸시 알림. Google 개인정보 처리방침 적용.",
          "OpenAI: AI 코칭 응답. OpenAI 개인정보 처리방침 적용.",
          "Stripe: 프리미엄 구독 결제 처리. 카드 정보는 당사 서버에 저장되지 않습니다.",
        ],
      },
      {
        heading: "5. 데이터 공유",
        body: [
          "당사는 귀하의 개인 데이터를 제3자에게 판매하지 않습니다.",
          "명시적 동의 없이 개인 트레이닝 데이터를 다른 사용자와 공유하지 않습니다.",
          "리더보드의 표시 이름과 랭크는 기본적으로 다른 사용자에게 공개됩니다. 프로필 설정에서 변경 가능합니다.",
        ],
      },
      {
        heading: "6. 데이터 보존",
        body: [
          "계정 데이터는 계정이 활성 상태인 동안 보존됩니다.",
          "계정 및 관련 데이터 삭제 요청은 privacy@gavana.app으로 연락하세요.",
          "계정 삭제 후 30일 이내에 데이터가 영구 삭제됩니다.",
        ],
      },
      {
        heading: "7. 아동 개인정보",
        body: [
          "GAVANA는 13세 미만 사용자를 대상으로 하지 않습니다. 13세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.",
          "13세 미만 아동이 정보를 제공했다고 판단되면 즉시 연락해 주세요.",
        ],
      },
      {
        heading: "8. 귀하의 권리",
        body: [
          "열람권: 언제든지 개인 데이터 사본을 요청할 수 있습니다.",
          "정정권: 앱에서 직접 또는 연락을 통해 계정 정보를 업데이트할 수 있습니다.",
          "삭제권: 프로필 설정에서 또는 privacy@gavana.app 이메일로 계정을 삭제할 수 있습니다.",
          "이동권: 표준 형식으로 트레이닝 데이터 내보내기를 요청할 수 있습니다.",
        ],
      },
      {
        heading: "9. 보안",
        body: [
          "암호화된 데이터 전송(HTTPS) 및 Firebase 보안 규칙을 포함한 업계 표준 보안 조치를 사용합니다.",
          "인터넷을 통한 전송 방법은 100% 안전하지 않습니다. 그러나 데이터 보호에 최선을 다합니다.",
        ],
      },
      {
        heading: "10. 방침 변경",
        body: [
          "이 개인정보 처리방침은 수시로 업데이트될 수 있습니다. 중요한 변경 사항은 앱 또는 이메일로 알립니다.",
          "변경 후 GAVANA를 계속 사용하면 업데이트된 방침에 동의한 것으로 간주합니다.",
        ],
      },
      {
        heading: "11. 문의",
        body: [
          "이 개인정보 처리방침에 대한 문의:",
          "이메일: privacy@gavana.app",
          "GAVANA Boxing",
        ],
      },
    ],
  },
};

export default function PrivacyPage() {
  const { locale } = useParams();
  const router = useRouter();
  const lang = getLocale(locale);
  const t = T[lang] || T.en;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0a0809",
      color: "#fff",
      fontFamily: "var(--font-sans, system-ui, sans-serif)",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(10,8,9,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.5)",
            fontSize: 15, cursor: "pointer", padding: "4px 0",
          }}
        >
          {t.back}
        </button>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 9, fontWeight: 900, letterSpacing: 1.5,
          color: GOLD, background: `${GOLD}15`,
          border: `1px solid ${GOLD}30`,
          borderRadius: 6, padding: "3px 8px", textTransform: "uppercase",
        }}>
          {t.badge}
        </span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 1000, color: "#fff", margin: "0 0 8px",
            fontFamily: "var(--font-display, 'Anton', sans-serif)",
            textTransform: "uppercase", letterSpacing: "-0.01em",
          }}>
            {t.title}
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 0.3 }}>
            {t.updated}
          </p>
        </div>

        {/* Intro */}
        <p style={{
          fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.7,
          margin: "0 0 32px",
          padding: "16px 18px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          borderLeft: `3px solid ${GOLD}60`,
        }}>
          {t.intro}
        </p>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {t.sections.map((section, i) => (
            <div key={i}>
              <h2 style={{
                fontSize: 13, fontWeight: 900, color: GOLD,
                margin: "0 0 10px", letterSpacing: 0.3,
                textTransform: "uppercase",
              }}>
                {section.heading}
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                {section.body.map((item, j) => (
                  <li key={j} style={{
                    fontSize: 13.5, color: "rgba(255,255,255,0.62)",
                    lineHeight: 1.65, paddingLeft: 16, position: "relative",
                  }}>
                    <span style={{
                      position: "absolute", left: 0, top: "0.55em",
                      width: 4, height: 4, borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)", display: "block",
                    }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 40, padding: "16px 18px", borderRadius: 12,
          background: `${RED}08`, border: `1px solid ${RED}20`,
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
            © 2025 GAVANA Boxing. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
