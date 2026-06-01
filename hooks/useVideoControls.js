"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SOUND_KEY = "reel-sound-on";

function readSoundPref() {
  try { return localStorage.getItem(SOUND_KEY) === "1"; } catch { return false; }
}
function writeSoundPref(val) {
  try { localStorage.setItem(SOUND_KEY, val ? "1" : "0"); } catch {}
}

export function useVideoControls({ reels, currentIndex }) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [videoLoading, setVideoLoading] = useState({});
  const [videoErrors, setVideoErrors] = useState({});
  const [videoProgress, setVideoProgress] = useState(0);
  const [heartBursts, setHeartBursts] = useState([]);
  const videoRefs = useRef({});
  const controlsTimer = useRef(null);
  const singleTapTimerRef = useRef(null);
  const loadingTimeoutRef = useRef({});

  // Restore sound preference from localStorage on mount
  useEffect(() => {
    setSoundEnabled(readSoundPref());
  }, []);

  // Listen for hardware volume-button presses (Android Chrome; silently ignored on iOS)
  useEffect(() => {
    const handleVolumeChange = () => {
      if (!readSoundPref()) {
        writeSoundPref(true);
        setSoundEnabled(true);
        // Unmute the current video immediately
        const activeId = reels[currentIndex]?.id;
        const video = videoRefs.current[activeId];
        if (video) { video.muted = false; video.volume = 1; }
      }
    };
    // Attach to a scratch audio element — only way to receive volumechange cross-browser
    const audio = document.createElement("audio");
    audio.addEventListener("volumechange", handleVolumeChange);
    return () => audio.removeEventListener("volumechange", handleVolumeChange);
  }, [currentIndex, reels]);

  const pauseInactiveVideos = useCallback((activeReelId, reset = true) => {
    Object.entries(videoRefs.current).forEach(([reelId, video]) => {
      if (!video || reelId === activeReelId) return;

      video.pause();
      video.muted = true;

      if (reset) {
        try {
          video.currentTime = 0;
        } catch {
          // Some mobile browsers can reject currentTime changes before metadata is ready.
        }
      }
    });
  }, []);

  // Play/pause current video
  const togglePlay = useCallback(() => {
    const video = videoRefs.current[reels[currentIndex]?.id];
    if (video) {
      if (video.paused) {
        video.play();
        setShowControls(false);
      } else {
        video.pause();
        setShowControls(true);
      }
    }
  }, [currentIndex, reels]);

  // Reset video progress when switching reels
  useEffect(() => { setVideoProgress(0); }, [currentIndex]);

  const clearControlsTimer = useCallback(() => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
      controlsTimer.current = null;
    }
  }, []);

  const scheduleControlsHide = useCallback(() => {
    clearControlsTimer();
    const video = videoRefs.current[reels[currentIndex]?.id];

    if (video && !video.paused) {
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
        controlsTimer.current = null;
      }, 2500);
    }
  }, [clearControlsTimer, currentIndex, reels]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleControlsHide();
  }, [scheduleControlsHide]);

  const enableSound = useCallback(() => {
    const activeReelId = reels[currentIndex]?.id;
    const video = videoRefs.current[activeReelId];

    setSoundEnabled(true);
    writeSoundPref(true);
    pauseInactiveVideos(activeReelId, false);

    if (video) {
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {
        // If a browser still blocks sound, the control remains visible for another tap.
      });
    }

    setShowControls(true);
    scheduleControlsHide();
  }, [currentIndex, pauseInactiveVideos, reels, scheduleControlsHide]);

  const muteAllVideos = useCallback(() => {
    setSoundEnabled(false);
    writeSoundPref(false);
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.muted = true;
      }
    });
    setShowControls(true);
  }, []);

  const handleVideoTap = useCallback(() => {
    revealControls();
    togglePlay();
  }, [revealControls, togglePlay]);

  useEffect(() => {
    const currentReel = reels[currentIndex];
    const activeReelId = currentReel?.isDemo ? null : currentReel?.id;

    pauseInactiveVideos(activeReelId);

    if (!currentReel || currentReel.isDemo || !activeReelId) return;

    const video = videoRefs.current[activeReelId];
    if (!video) return;

    setVideoErrors((prev) => ({ ...prev, [activeReelId]: false }));
    if (video.readyState < 3) {
      setVideoLoading((prev) => ({ ...prev, [activeReelId]: true }));
    }
    video.muted = !soundEnabled;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.play().catch(() => {
      // Browsers can still block autoplay; the tap-to-play overlay remains available.
    });
    setShowControls(true);
    scheduleControlsHide();
  }, [reels, currentIndex, pauseInactiveVideos, scheduleControlsHide, soundEnabled]);

  useEffect(() => {
    const ctRef = controlsTimer;
    const tapRef = singleTapTimerRef;
    const vidRef = videoRefs;
    const ltRef = loadingTimeoutRef;
    return () => {
      if (ctRef.current) clearTimeout(ctRef.current);
      if (tapRef.current) clearTimeout(tapRef.current);
      Object.values(vidRef.current).forEach((video) => {
        if (!video) return;
        video.pause();
        video.muted = true;
      });
      Object.values(ltRef.current).forEach(clearTimeout);
      ltRef.current = {};
    };
  }, [controlsTimer, singleTapTimerRef, videoRefs]);

  // Stale ref cleanup when reels array changes
  useEffect(() => {
    const currentIds = new Set(reels.map(r => r?.id).filter(Boolean));
    Object.keys(videoRefs.current).forEach(id => {
      if (!currentIds.has(id)) delete videoRefs.current[id];
    });
  }, [reels]);

  // Toggle global sound
  const toggleMute = useCallback(() => {
    if (soundEnabled) {
      muteAllVideos();
      return;
    }

    enableSound();
  }, [enableSound, muteAllVideos, soundEnabled]);

  // Handle video load start
  const handleVideoLoadStart = (reelId) => {
    setVideoLoading(prev => ({ ...prev, [reelId]: true }));
    setVideoErrors(prev => ({ ...prev, [reelId]: false }));
    if (loadingTimeoutRef.current[reelId]) clearTimeout(loadingTimeoutRef.current[reelId]);
    loadingTimeoutRef.current[reelId] = setTimeout(() => {
      setVideoLoading(prev => ({ ...prev, [reelId]: false }));
      delete loadingTimeoutRef.current[reelId];
    }, 8000);
  };

  // Handle video loaded
  const handleVideoLoaded = (reelId) => {
    setVideoLoading(prev => ({ ...prev, [reelId]: false }));
    setVideoErrors(prev => ({ ...prev, [reelId]: false }));
    if (loadingTimeoutRef.current[reelId]) { clearTimeout(loadingTimeoutRef.current[reelId]); delete loadingTimeoutRef.current[reelId]; }
  };

  const handleVideoError = (reelId) => {
    setVideoLoading(prev => ({ ...prev, [reelId]: false }));
    setVideoErrors(prev => ({ ...prev, [reelId]: true }));
    if (loadingTimeoutRef.current[reelId]) { clearTimeout(loadingTimeoutRef.current[reelId]); delete loadingTimeoutRef.current[reelId]; }
  };

  return {
    soundEnabled, showControls, setShowControls,
    videoLoading, videoErrors, videoProgress, setVideoProgress,
    heartBursts, setHeartBursts,
    videoRefs,
    singleTapTimerRef,
    pauseInactiveVideos, togglePlay, clearControlsTimer,
    scheduleControlsHide, revealControls, enableSound,
    muteAllVideos, handleVideoTap, toggleMute,
    handleVideoLoadStart, handleVideoLoaded, handleVideoError,
  };
}
