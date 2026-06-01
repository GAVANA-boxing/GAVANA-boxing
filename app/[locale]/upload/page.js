"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { GOLD, RED, redAlpha, goldAlpha } from "@/lib/tokens";
import S from "@/components/upload/uploadStyles";
import { UField, UChips, UToggle } from "@/components/upload/UploadFormFields";
import { useUploadForm } from "@/hooks/useUploadForm";

const CATEGORIES = ["boxing", "gym", "running", "street_workout", "sparring"];
const DIFFICULTIES = ["beginner", "intermediate", "pro"];
const CAT_KEY = { boxing: "catBoxing", gym: "catGym", running: "catRunning", street_workout: "catStreetWorkout", sparring: "catSparring" };
const DIFF_KEY = { beginner: "diffBeginner", intermediate: "diffIntermediate", pro: "diffPro" };

const CONTENT_TYPES = [
  { id: "training",     emoji: "🥊", labelKey: "ctFilterTraining",    color: "#F87171", border: redAlpha(0.5) },
  { id: "lifestyle",    emoji: "🎬", labelKey: "ctFilterLifestyle",   color: "#60A5FA", border: "rgba(96,165,250,0.45)" },
  { id: "educational",  emoji: "📚", labelKey: "ctFilterEducational", color: GOLD,      border: goldAlpha(0.5) },
];

export default function UploadPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  const {
    fileInputRef, step, setStep, contentType, setContentType,
    remixOfId, remixOfCreatorId, remixOfCreatorName,
    selectedFile, previewUrl, uploading, uploadProgress, error, videoDuration, setVideoDuration,
    description, setDescription, category, setCategory, difficulty, setDifficulty, tags, setTags,
    challengeLabel, setChallengeLabel, targetHits, setTargetHits, aiScoringEnabled, setAiScoringEnabled, challengeEnabled, setChallengeEnabled,
    techniqueTitle, setTechniqueTitle, mistakeNote, setMistakeNote, fixNote, setFixNote, coachNote, setCoachNote, eduChallengeEnabled, setEduChallengeEnabled,
    gymId, setGymId, gyms, captionOpen, setCaptionOpen, detailsOpen, setDetailsOpen,
    captionContext, setCaptionContext, captionLoading, captionError, captionResult, setCaptionResult,
    handleFileSelect, formatDuration, handleUpload, handleGenerateCaption, parsedCaption, fileSizeMB,
  } = useUploadForm({ user, locale, t, router });

  if (authLoading) return <div style={S.loading}>...</div>;
  if (!user) return null;

  const isTraining = contentType === "training";
  const isEdu = contentType === "educational";
  const isLifestyle = contentType === "lifestyle";
  const diffColorMap = (d) => d === "beginner" ? S.chipGreen : d === "intermediate" ? S.chipGold : S.chipRed;
  const activeType = CONTENT_TYPES.find((ct) => ct.id === contentType);

  // ── VIDEO STEP ─────────────────────────────────────────────────────────────
  if (step === "video") {
    return (
      <div style={S.videoPage}>
        <div style={S.videoHeader}>
          <button onClick={() => router.back()} style={S.iconBtn}>✕</button>
          <span style={S.headerTitle}>{t("uploadNewReel")}</span>
          <div style={{ width: 40 }} />
        </div>

        {remixOfId && (
          <div style={S.remixBar}>
            🔀 Remixing {remixOfCreatorName ? `@${remixOfCreatorName}` : "a challenge"}
          </div>
        )}

        <div style={S.videoPicker} onClick={() => !selectedFile && fileInputRef.current?.click()}>
          {selectedFile ? (
            <video
              src={previewUrl}
              controls
              playsInline
              preload="metadata"
              style={S.videoFull}
              onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
            />
          ) : (
            <div style={S.videoEmptyState}>
              <div style={S.videoEmptyIconWrap}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14"/>
                  <rect x="3" y="6" width="12" height="12" rx="2"/>
                  <path d="M9 10v4M7 12h4" stroke={GOLD} strokeWidth="1.8"/>
                </svg>
              </div>
              <p style={S.videoEmptyKicker}>
                {locale === "mn" ? "Рил бичлэг" : locale === "ko" ? "릴 영상" : "Reel Video"}
              </p>
              <p style={S.videoEmptyLabel}>{t("uploadTapSelect")}</p>
              <p style={S.videoEmptySub}>MP4, MOV · {t("uploadSizeLimit")}</p>
            </div>
          )}
        </div>

        <div style={S.videoBottomBar}>
          <button style={S.galleryBtn} onClick={() => fileInputRef.current?.click()}>
            <span style={{ fontSize: 13, fontWeight: 800, color: selectedFile ? GOLD : "rgba(255,255,255,0.75)" }}>
              {selectedFile ? t("uploadChange") : t("uploadGallery")}
            </span>
          </button>
          {selectedFile && (
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedFile.name}
            </span>
          )}
          <button
            onClick={() => selectedFile ? setStep("setup") : fileInputRef.current?.click()}
            style={{ ...S.nextBtn, opacity: selectedFile ? 1 : 0.42 }}
          >
            {t("uploadNext")}
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} style={{ display: "none" }} />
      </div>
    );
  }

  // ── SETUP STEP ─────────────────────────────────────────────────────────────
  return (
    <div style={S.setupPage}>
      <div style={S.setupHeader}>
        <button onClick={() => setStep("video")} style={S.iconBtn}>←</button>
        <span style={S.headerTitle}>{t("uploadPostReel")}</span>
        <button onClick={handleUpload} disabled={uploading} style={{ ...S.postBtn, opacity: uploading ? 0.6 : 1 }}>
          {uploading ? `${uploadProgress}%` : t("uploadPost")}
        </button>
      </div>

      <div style={S.setupScroll}>
        {/* Video thumbnail strip */}
        <div style={S.videoStrip} className="section-reveal">
          <div style={{ position: "relative", flexShrink: 0 }}>
            <video
              src={previewUrl}
              muted
              playsInline
              style={S.videoThumb}
              onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
            />
            {videoDuration && (
              <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.72)", borderRadius: 4, padding: "2px 5px", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                {formatDuration(videoDuration)}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedFile?.name}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {fileSizeMB && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>
                  {fileSizeMB} MB
                </span>
              )}
              {videoDuration && (
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>
                  {formatDuration(videoDuration)}
                </span>
              )}
            </div>
            <button onClick={() => setStep("video")} style={S.changeVideoBtn}>
              {t("uploadChangeVideo")}
            </button>
          </div>
        </div>

        {error && <div style={S.errBox}>{error}</div>}
        {remixOfId && <div style={S.remixBox}>🔀 Remixing {remixOfCreatorName ? `@${remixOfCreatorName}` : "a challenge"}</div>}

        {/* Section — Content Type */}
        <div className="stagger-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={S.sectionBlock}>
            <p style={S.sectionKicker}>
              {locale === "mn" ? "Контентын төрөл" : locale === "ko" ? "콘텐츠 유형" : "Content Type"}
            </p>
            <h2 style={S.sectionTitle}>
              {locale === "mn" ? "Юу нийтлэх вэ?" : locale === "ko" ? "무엇을 올리나요?" : "What are you posting?"}
            </h2>
          </div>

          <div style={S.typeTabs}>
            {CONTENT_TYPES.map(({ id, emoji, labelKey, color, border }) => {
              const label = t(labelKey);
              const active = contentType === id;
              return (
                <button
                  key={id}
                  onClick={() => setContentType(id)}
                  style={{
                    ...S.typeTab,
                    ...(active ? {
                      color,
                      border: `1px solid ${border}`,
                      background: `${color}18`,
                      boxShadow: `0 0 16px ${color}22`,
                    } : {}),
                  }}
                >
                  <span style={S.typeTabEmoji}>{emoji}</span>
                  <span style={S.typeTabLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section — Caption / Title */}
        <div className="stagger-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={S.sectionBlock}>
            <p style={S.sectionKicker}>
              {locale === "mn" ? "Тайлбар" : locale === "ko" ? "캡션" : "Description"}
            </p>
            <h2 style={S.sectionTitle}>
              {isEdu
                ? (locale === "mn" ? "Техникийн нэр" : locale === "ko" ? "기술 제목" : "Technique Title")
                : (locale === "mn" ? "Чиний хэлэх зүйл" : locale === "ko" ? "내용 작성" : "Tell Your Story")}
            </h2>
          </div>

          <div style={S.fields}>
            {(isTraining || isLifestyle) && (
              <UField label={t("caption")}>
                <div style={{ position: "relative" }}>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={isTraining ? t("uploadChallengePlaceholder") : t("uploadLifestylePlaceholder")}
                    maxLength={300}
                    style={{ ...S.textarea, minHeight: 96, paddingBottom: 28 }}
                  />
                  <span style={{ position: "absolute", bottom: 10, right: 12, fontSize: 11, color: description.length > 260 ? "#F87171" : "rgba(255,255,255,0.25)", fontWeight: 700, pointerEvents: "none" }}>
                    {description.length}/300
                  </span>
                </div>
              </UField>
            )}
            {isEdu && (
              <UField label={t("uploadTechniqueTitle")}>
                <input value={techniqueTitle} onChange={(e) => setTechniqueTitle(e.target.value)} placeholder={t("uploadTechniquePlaceholder")} style={S.input} />
              </UField>
            )}
          </div>
        </div>

        {/* Section — Details accordion */}
        <div className="stagger-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={S.sectionBlock}>
            <p style={S.sectionKicker}>
              {locale === "mn" ? "Дэлгэрэнгүй" : locale === "ko" ? "세부 정보" : "Details"}
            </p>
            <h2 style={S.sectionTitle}>
              {locale === "mn" ? "Нэмэлт тохиргоо" : locale === "ko" ? "추가 설정" : "Advanced Options"}
            </h2>
          </div>

          <div style={S.detailsBox}>
            <button type="button" onClick={() => setDetailsOpen(!detailsOpen)} style={S.detailsToggle}>
              <span style={S.detailsLabel}>⚙ {locale === "mn" ? "Тохиргоо" : locale === "ko" ? "설정" : "Settings"}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16, lineHeight: 1 }}>{detailsOpen ? "∧" : "∨"}</span>
            </button>
            {detailsOpen && (
              <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
                {isTraining && (
                  <>
                    <UField label={t("uploadChallengeLabel")}>
                      <input value={challengeLabel} onChange={(e) => setChallengeLabel(e.target.value)} placeholder={t("uploadChallengeLabelPlaceholder")} style={S.input} />
                    </UField>
                    <UField label={t("uploadTargetHits")}>
                      <input type="number" value={targetHits} onChange={(e) => setTargetHits(e.target.value)} placeholder="e.g. 100" style={{ ...S.input, width: 140 }} min={1} />
                    </UField>
                    <UField label={t("uploadDifficulty")}>
                      <UChips options={DIFFICULTIES} keyMap={DIFF_KEY} t={t} selected={difficulty} onSelect={setDifficulty} colorMap={diffColorMap} />
                    </UField>
                    <UToggle label={t("uploadAiScoring")} description={t("uploadAiScoringDesc")} value={aiScoringEnabled} onChange={setAiScoringEnabled} />
                    <UToggle label={t("uploadChallengeCta")} description={t("uploadChallengeCtaDesc")} value={true} locked />
                  </>
                )}
                {isLifestyle && (
                  <>
                    <UField label={t("uploadCategory")}>
                      <UChips options={CATEGORIES} keyMap={CAT_KEY} t={t} selected={category} onSelect={setCategory} colorMap={() => S.chipActive} />
                    </UField>
                    <UField label={t("uploadTags")}>
                      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("uploadTagsPlaceholder")} style={S.input} />
                    </UField>
                  </>
                )}
                {isEdu && (
                  <>
                    <UField label={t("uploadMistakeLabel")}>
                      <textarea value={mistakeNote} onChange={(e) => setMistakeNote(e.target.value)} placeholder={t("uploadMistakePlaceholder")} style={{ ...S.textarea, minHeight: 60 }} />
                    </UField>
                    <UField label={t("uploadFixLabel")}>
                      <textarea value={fixNote} onChange={(e) => setFixNote(e.target.value)} placeholder={t("uploadFixPlaceholder")} style={{ ...S.textarea, minHeight: 60 }} />
                    </UField>
                    <UField label={t("uploadCoachNoteLabel")}>
                      <textarea value={coachNote} onChange={(e) => setCoachNote(e.target.value)} placeholder={t("uploadCoachNotePlaceholder")} style={{ ...S.textarea, minHeight: 60 }} />
                    </UField>
                    <UField label={t("uploadDifficulty")}>
                      <UChips options={DIFFICULTIES} keyMap={DIFF_KEY} t={t} selected={difficulty} onSelect={setDifficulty} colorMap={diffColorMap} />
                    </UField>
                    <UToggle label={t("uploadSaveCta")} description={t("uploadSaveCtaDesc")} value={true} locked />
                    <UToggle label={t("uploadEduChallengeCta")} description={t("uploadEduChallengeCtaDesc")} value={eduChallengeEnabled} onChange={setEduChallengeEnabled} />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Gym tag */}
          {gyms.length > 0 && (
            <UField label={t("uploadGymTag")}>
              <div style={{ position: "relative" }}>
                <select
                  value={gymId}
                  onChange={(e) => setGymId(e.target.value)}
                  style={{ ...S.input, appearance: "none", WebkitAppearance: "none", paddingRight: 36, color: gymId ? "#fff" : "rgba(255,255,255,0.38)" }}
                >
                  <option value="" style={{ color: "#aaa" }}>{t("uploadGymNone")}</option>
                  {gyms.map((g) => <option key={g.id} value={g.id} style={{ color: "#fff", background: "#111" }}>{g.gymName}</option>)}
                </select>
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.38)", fontSize: 11 }}>▾</span>
              </div>
            </UField>
          )}
        </div>

        {/* Section — AI Caption */}
        <div className="stagger-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={S.sectionBlock}>
            <p style={S.sectionKicker}>
              {locale === "mn" ? "AI тусламж" : locale === "ko" ? "AI 도우미" : "AI Tools"}
            </p>
            <h2 style={S.sectionTitle}>
              {locale === "mn" ? "Caption үүсгэх" : locale === "ko" ? "캡션 생성" : "Generate Caption"}
            </h2>
          </div>

          <div style={S.aiBox}>
            <button onClick={() => setCaptionOpen(!captionOpen)} style={S.aiBoxBtn}>
              <span style={S.aiBoxLabel}>✨ {t("aiCaptionGenerator")}</span>
              <span style={{ color: GOLD, fontSize: 18, lineHeight: 1 }}>{captionOpen ? "∧" : "∨"}</span>
            </button>
            {captionOpen && (
              <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={S.aiBoxHelp}>{t("aiCaptionHelp")}</p>
                <input value={captionContext} onChange={(e) => setCaptionContext(e.target.value)} placeholder={t("captionContextPlaceholder")} style={S.input} />
                <button onClick={handleGenerateCaption} disabled={captionLoading} style={{ ...S.primaryBtn, marginTop: 4, opacity: captionLoading ? 0.6 : 1 }}>
                  {captionLoading ? t("generating") : t("generateCaption")}
                </button>
                {captionError && <p style={S.errTxt}>{captionError}</p>}
                {parsedCaption && (
                  <div style={S.captionResult}>
                    {parsedCaption.hook && <div style={S.captionSection}><span style={S.captionLbl}>{t("hook")}</span><div style={S.captionHook}>{parsedCaption.hook}</div></div>}
                    {parsedCaption.caption && <div style={S.captionSection}><span style={S.captionLbl}>{t("caption")}</span><div style={S.captionBody}>{parsedCaption.caption}</div></div>}
                    {parsedCaption.hashtags && <div style={S.captionSection}><span style={S.captionLbl}>{t("hashtags")}</span><div style={S.captionBody}>{parsedCaption.hashtags}</div></div>}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                      <button style={S.captionActionBtn} onClick={() => setDescription(parsedCaption.description)}>{t("useCaption")}</button>
                      <button style={{ ...S.captionActionBtn, background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }} onClick={() => navigator.clipboard?.writeText(parsedCaption.hashtags)}>{t("copyHashtags")}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post button */}
        <button onClick={handleUpload} disabled={uploading} style={{ ...S.primaryBtn, opacity: uploading ? 0.45 : 1, marginBottom: 32 }}>
          {t("uploadPostReel")}
        </button>
      </div>

      {/* Upload progress overlay */}
      {uploading && (() => {
        const stages = [
          { min: 0,  max: 20,  label: locale === "mn" ? "Видео шахаж байна" : locale === "ko" ? "동영상 압축 중" : "Compressing video" },
          { min: 21, max: 62,  label: locale === "mn" ? "Видео байршуулж байна" : locale === "ko" ? "동영상 업로드 중" : "Uploading video" },
          { min: 63, max: 84,  label: locale === "mn" ? "Thumbnail үүсгэж байна" : locale === "ko" ? "썸네일 생성 중" : "Generating thumbnail" },
          { min: 85, max: 100, label: locale === "mn" ? "Нийтлэж байна" : locale === "ko" ? "게시 중" : "Publishing reel" },
        ];
        const activeIdx = stages.findIndex(s => uploadProgress >= s.min && uploadProgress <= s.max);
        return (
          <div
            className="page-enter"
            style={{
              position: "fixed", inset: 0, zIndex: 999,
              background: "rgba(0,0,0,0.94)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 24, padding: 32,
            }}
          >
            <div style={{ fontSize: 44 }}>🥊</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em", marginBottom: 4 }}>
              {t("uploadUploading")}
            </div>
            <div style={{ width: "100%", maxWidth: 300, display: "flex", flexDirection: "column", gap: 12 }}>
              {stages.map((stage, i) => {
                const done = i < activeIdx;
                const active = i === activeIdx;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900,
                      background: done ? `${GOLD}22` : active ? `${GOLD}18` : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${done ? GOLD : active ? `${GOLD}80` : "rgba(255,255,255,0.1)"}`,
                      color: done ? GOLD : active ? "#fff" : "rgba(255,255,255,0.25)",
                    }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: active ? 800 : 500,
                      color: done ? GOLD : active ? "#fff" : "rgba(255,255,255,0.28)",
                    }}>
                      {stage.label}
                    </span>
                    {active && (
                      <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: GOLD }}>
                        {uploadProgress}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ width: "100%", maxWidth: 300 }}>
              <div style={{ ...S.progressTrack, height: 4 }}>
                <div style={{
                  ...S.progressFill,
                  width: `${uploadProgress}%`,
                  background: `linear-gradient(90deg, ${RED}, ${GOLD})`,
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
              {t("uploadDontClose")}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
