"use client";

import { useEffect, useRef, useState } from "react";
import { loc } from "@/lib/loc";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import KnowledgeLibrary from "@/components/KnowledgeLibrary";
import { RED, GOLD, PURPLE , blackAlpha} from "@/lib/tokens";
import styles from "@/components/aiCoachStyles";
import CoachResponseCard from "@/components/coach/CoachResponseCard";
import { auth } from "@/lib/firebase";

const BLUE = "#3B82F6";

export default function AICoach() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState("drill");
  const [activeSection, setActiveSection] = useState("library");
  const messagesEndRef = useRef(null);

  const personas = [
    {
      id: "drill",
      emoji: "🎯",
      name: t("drillSergeant"),
      tagline: t("drillTagline") || "Sharp. Zero fluff.",
      tags: [t("intense") || "Intense", t("direct") || "Direct"],
      color: RED,
      intro: t("drillIntro") || "Listen up. I don't do motivational speeches. Tell me your problem — I'll fix it. What are you working on?",
      quickActions: [t("drillQuick1"), t("drillQuick2"), t("drillQuick3")],
    },
    {
      id: "zen",
      emoji: "🌊",
      name: t("zenMaster"),
      tagline: t("zenTagline") || "Breathe first. Then punch.",
      tags: [t("calm") || "Calm", t("flow") || "Flow"],
      color: BLUE,
      intro: t("zenIntro") || "Close your eyes for a second. Feel your feet on the ground. Now — what do you want to work on today?",
      quickActions: [t("zenQuick1"), t("zenQuick2"), t("zenQuick3")],
    },
    {
      id: "analyst",
      emoji: "📊",
      name: t("analyst"),
      tagline: t("analystTagline") || "Data doesn't lie.",
      tags: [t("data") || "Data", t("patterns") || "Patterns"],
      color: GOLD,
      intro: t("analystIntro") || "Let's look at the numbers. Share your session data or describe what you're struggling with — I'll find the pattern.",
      quickActions: [t("analystQuick1"), t("analystQuick2"), t("analystQuick3")],
    },
    {
      id: "champion",
      emoji: "🥊",
      name: t("oldChampion") || "Old Champion",
      tagline: t("championTagline") || "I've been in that ring.",
      tags: [t("wisdom") || "Wisdom", t("stories") || "Stories"],
      color: PURPLE,
      intro: t("championIntro") || "I've taken every punch you're about to face. Ask me anything — there's nothing in that gym I haven't seen before.",
      quickActions: [
        t("championQuick1") || "How do I handle pressure?",
        t("championQuick2") || "What separates good from great?",
        t("championQuick3") || "How did you stay motivated?",
      ],
    },
  ];

  const activePersona = personas.find((p) => p.id === persona) || personas[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePersonaChange = (newPersona) => {
    setPersona(newPersona);
    setMessages([]);
  };

  const handleAskFromLibrary = (prompt) => {
    setActiveSection("chat");
    handleSend(prompt);
  };

  const handleSend = async (presetPrompt) => {
    const prompt = (typeof presetPrompt === "string" ? presetPrompt : input).trim();
    if (!prompt || loading) return;

    const userMessage = { role: "user", content: prompt };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: newMessages, persona, locale, json_mode: true }),
      });

      const data = await response.json();

      if (data.content && data.content[0]) {
        setMessages([...newMessages, {
          role: "assistant",
          content: data.content[0].text,
          structured: data.structured ?? null,
          _source: data._source ?? (data.aiError ? "error" : "openai"),
        }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: t("coachError") }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const DAILY_MISSIONS = [
    { emoji: "🥊", focus: loc(locale, "Доргиних тусгай дасгал", "잽 정밀도 훈련", "Jab Precision Day"), prompt: loc(locale, "Өнөөдрийн доргиний дасгал хийлгэж өгнө үү", "오늘 잽 정밀도 훈련 루틴을 짜줘", "Give me a jab precision drill routine for today") },
    { emoji: "👣", focus: loc(locale, "Хөлийн хөдөлгөөн & Өнцгийн дасгал", "풋워크와 앵글 훈련", "Footwork & Angles"), prompt: loc(locale, "Хөлийн хөдөлгөөн болон өнцгийн дасгал хийлгэнэ үү", "오늘 풋워크와 각도 훈련 루틴을 알려줘", "Coach me on footwork and angle drills today") },
    { emoji: "🛡️", focus: loc(locale, "Хамгааллын техник", "방어 기술 훈련", "Defense Focus"), prompt: loc(locale, "Ухрах болон бөхийх хамгааллын дасгал хийлгэнэ үү", "슬립과 롤을 중심으로 방어 훈련을 알려줘", "Coach me on slip and roll defense drills") },
    { emoji: "💥", focus: loc(locale, "Хүчтэй хослолын цуваа", "파워 콤비네이션 훈련", "Power Combinations"), prompt: loc(locale, "Хүч чадал нэмэх хослолын цуваа заана уу", "오늘 파워 콤비네이션 연습을 알려줘", "Give me power combination drills to build knockout power") },
    { emoji: "⚡", focus: loc(locale, "Хурд & Хэмнэл", "스피드와 리듬 훈련", "Speed & Rhythm"), prompt: loc(locale, "Хурд болон хэмнэлийн дасгал хийлгэнэ үү", "스피드와 리듬 훈련 루틴을 알려줘", "Give me speed and rhythm training drills") },
    { emoji: "🥋", focus: loc(locale, "Дүрслэлт раунд симуляци", "풀라운드 스파링 시뮬레이션", "Full Round Simulation"), prompt: loc(locale, "Бүтэн раундын дасгал симуляци хийлгэнэ үү", "풀라운드 스파링 시뮬레이션 훈련을 도와줘", "Coach me through a full round sparring simulation") },
    { emoji: "🔄", focus: loc(locale, "Нөхөн сэргэлт & Дүн шинжилгээ", "회복과 리뷰", "Recovery & Review"), prompt: loc(locale, "Нөхөн сэргэлт болон долоо хоногийн ахицаа шинжлэх дасгал хийлгэнэ үү", "회복 훈련과 이번 주 진행 상황을 리뷰해줘", "Help me with recovery techniques and review my week") },
  ];
  const todayMission = DAILY_MISSIONS[new Date().getDay()];

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.shell}>
        <div style={styles.header}>
          <p style={styles.kicker}>COMBAT · AI</p>
          <h1 style={styles.title}>{t("aiCoach")}</h1>
        </div>

        {/* Today's Mission banner */}
        <div
          style={{
            marginBottom: 12,
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(245,196,81,0.06)",
            border: "1px solid rgba(245,196,81,0.2)",
            borderLeft: "3px solid #F5C451",
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>{todayMission.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: "#F5C451", textTransform: "uppercase", marginBottom: 2 }}>
              {loc(locale, "ӨНӨӨДРИЙН ДААЛГАВАР", "오늘의 미션", "TODAY'S MISSION")}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>
              {todayMission.focus}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setActiveSection("chat"); handleSend(todayMission.prompt); }}
            style={{
              padding: "7px 12px", borderRadius: 10,
              background: "#F5C451", border: "none",
              color: "#000", fontSize: 11, fontWeight: 900,
              cursor: "pointer", flexShrink: 0, letterSpacing: 0.3,
            }}
          >
            {loc(locale, "Асуу", "물어보기", "Ask →")}
          </button>
        </div>

        {/* Section sub-tabs */}
        <div style={styles.sectionTabRow}>
          {[
            { key: "library", label: t("libraryTabLabel"), emoji: "📚" },
            { key: "chat",    label: t("chatTabLabel"),    emoji: "💬" },
          ].map(({ key, label, emoji }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              style={activeSection === key ? styles.sectionTabActive : styles.sectionTabInactive}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>

        {activeSection === "library" && (
          <KnowledgeLibrary locale={locale} onAsk={handleAskFromLibrary} />
        )}

        {activeSection === "chat" && (<>

          {/* ── Persona character cards ── */}
          <p style={styles.personaSectionLabel}>{loc(locale, "ДАСГАЛЖУУЛАГЧАА СОНГОНО УУ", "코치를 선택하세요", "CHOOSE YOUR COACH")}</p>
          <div style={styles.personaGrid}>
            {personas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePersonaChange(p.id)}
                style={{
                  ...styles.personaCard,
                  ...(persona === p.id ? {
                    ...styles.personaCardActive,
                    borderColor: p.color,
                    background: `linear-gradient(145deg, ${p.color}20, rgba(11,11,12,0.98))`,
                    boxShadow: `0 0 0 1px ${p.color}44, 0 8px 24px ${p.color}18`,
                  } : {}),
                }}
              >
                <span style={{ ...styles.personaAvatar, background: `${p.color}1A`, color: p.color }}>
                  {p.emoji}
                </span>
                <div style={styles.personaCardContent}>
                  <span style={styles.personaCardName}>{p.name}</span>
                  <span style={styles.personaCardTagline}>{p.tagline}</span>
                  <div style={styles.personaCardTags}>
                    {p.tags.map((tag) => (
                      <span key={tag} style={{ ...styles.personaCardTag, color: p.color, borderColor: `${p.color}40` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {persona === p.id && (
                  <span style={{ ...styles.personaCheckBadge, background: p.color }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Active coach banner ── */}
          <div style={{ ...styles.personaBanner, borderColor: `${activePersona.color}30`, background: `${activePersona.color}08` }}>
            <span style={{ ...styles.personaBannerEmoji, background: `${activePersona.color}1A` }}>
              {activePersona.emoji}
            </span>
            <div style={styles.personaBannerInfo}>
              <p style={{ ...styles.personaBannerName, color: activePersona.color }}>{activePersona.name}</p>
              <p style={styles.personaBannerSub}>{loc(locale, "Одоо дасгалжуулж байна", "지금 코칭 중", "Coaching you now")}</p>
            </div>
            <span style={styles.personaBannerDot} />
          </div>

          {/* ── Quick actions ── */}
          <div style={styles.quickActions}>
            {activePersona.quickActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => handleSend(action)}
                disabled={loading}
                style={{
                  ...styles.quickAction,
                  borderColor: `${activePersona.color}30`,
                  opacity: loading ? 0.45 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {action}
              </button>
            ))}
          </div>

          {/* ── Chat box ── */}
          <div style={styles.chatBox}>
            <div style={styles.messages}>
              {messages.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.introWrap}>
                    <div style={{
                      ...styles.introBubble,
                      borderLeftColor: activePersona.color,
                      boxShadow: `inset 2px 0 0 ${activePersona.color}`,
                    }}>
                      {activePersona.intro}
                    </div>
                    <p style={styles.introHint}>{loc(locale, "ДООРХ ТОВЧЛУУР ДАРАХ ЭСВЭЛ БИЧНЭ ҮҮ", "빠른 액션을 탭하거나 아래에 입력하세요", "TAP A QUICK ACTION OR TYPE BELOW")}</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: 16,
                      display: "flex",
                      justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        ...(message.role === "user" ? styles.userBubble : styles.assistantBubble),
                        ...(message.role === "assistant" ? {
                          borderLeftColor: activePersona.color,
                          boxShadow: `inset 3px 0 0 ${activePersona.color}, 0 14px 34px ${blackAlpha(0.24)}`,
                          whiteSpace: "normal",
                        } : {}),
                      }}
                    >
                      {message.role === "assistant" && message.structured
                        ? <CoachResponseCard structured={message.structured} accentColor={activePersona.color} locale={locale} />
                        : message.content
                      }
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputRow}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("coachPlaceholder")}
                disabled={loading}
                style={{ ...styles.input, borderColor: input ? `${activePersona.color}40` : "rgba(255,255,255,0.08)" }}
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                style={{
                  ...styles.sendButton,
                  background: loading ? "#4d1117" : activePersona.color,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !input.trim() ? 0.65 : 1,
                }}
                aria-label={t("sendMessage")}
              >
                {loading ? "…" : <SendIcon />}
              </button>
            </div>
          </div>

        </>)}
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12 20 5l-5.2 14-3.1-5.8L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
