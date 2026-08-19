"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// ============================================================
// TYPES
// ============================================================

export type QuizSoundType =
  | "start"
  | "background"
  | "correct"
  | "wrong"
  | "tick"
  | "next"
  | "complete"
  | "click";

// ============================================================
// FICHIERS AUDIO
// ============================================================
//
// IMPORTANT :
// Les fichiers doivent être dans :
//
// public/sounds/quiz/
//
// Exemple :
// public/sounds/quiz/quiz-correct.mp3
//
// Dans Next.js, ils sont accessibles avec :
// /sounds/quiz/quiz-correct.mp3
//
// ============================================================

export const QUIZ_SOUNDS: Record<
  QuizSoundType,
  string
> = {
  start: "/sounds/quiz/quiz-start.mp3",

  background:
    "/sounds/quiz/quiz-background.mp3",

  correct:
    "/sounds/quiz/quiz-correct.mp3",

  wrong:
    "/sounds/quiz/quiz-wrong.mp3",

  tick:
    "/sounds/quiz/quiz-tick.mp3",

  next:
    "/sounds/quiz/quiz-next.mp3",

  complete:
    "/sounds/quiz/quiz-complete.mp3",

  click:
    "/sounds/quiz/quiz-click.mp3",
};

// ============================================================
// CONFIGURATION
// ============================================================

const MUSIC_VOLUME = 0.25;

const EFFECTS_VOLUME = 0.65;

const FADE_DURATION = 1200;

// ============================================================
// HOOK
// ============================================================

export function useQuizMusic() {
  // ==========================================================
  // AUDIO BACKGROUND
  // ==========================================================

  const backgroundAudioRef =
    useRef<HTMLAudioElement | null>(null);

  // ==========================================================
  // ÉTAT
  // ==========================================================

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [isMuted, setIsMuted] =
    useState(false);

  const [volume, setVolumeState] =
    useState(MUSIC_VOLUME);

  // ==========================================================
  // FADE
  // ==========================================================

  const fadeIntervalRef =
    useRef<number | null>(null);

  // ==========================================================
  // EMPÊCHER LES DOUBLONS
  // ==========================================================

  const effectAudioRefs =
    useRef<HTMLAudioElement[]>([]);

  // ==========================================================
  // VOLUME EFFECTIF
  // ==========================================================

  const effectiveVolume = isMuted
    ? 0
    : volume;

  // ==========================================================
  // NETTOYER LE FADE
  // ==========================================================

  const clearFade = useCallback(() => {
    if (
      fadeIntervalRef.current !== null
    ) {
      window.clearInterval(
        fadeIntervalRef.current
      );

      fadeIntervalRef.current = null;
    }
  }, []);

  // ==========================================================
  // CRÉATION AUDIO BACKGROUND
  // ==========================================================

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const audio =
      new Audio(
        QUIZ_SOUNDS.background
      );

    audio.preload = "auto";

    audio.loop = true;

    audio.volume = effectiveVolume;

    backgroundAudioRef.current =
      audio;

    // --------------------------------------------------------
    // ERREUR
    // --------------------------------------------------------

    const handleError = () => {
      console.warn(
        "⚠️ Impossible de charger la musique de fond du quiz :",
        QUIZ_SOUNDS.background
      );
    };

    audio.addEventListener(
      "error",
      handleError
    );

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      clearFade();

      audio.pause();

      audio.currentTime = 0;

      audio.removeEventListener(
        "error",
        handleError
      );

      backgroundAudioRef.current =
        null;
    };
  }, [clearFade]);

  // ==========================================================
  // MISE À JOUR VOLUME
  // ==========================================================

  useEffect(() => {
    const audio =
      backgroundAudioRef.current;

    if (!audio) {
      return;
    }

    audio.volume =
      effectiveVolume;
  }, [effectiveVolume]);

  // ==========================================================
  // FADE IN
  // ==========================================================

  const fadeIn = useCallback(
    async () => {
      const audio =
        backgroundAudioRef.current;

      if (!audio) {
        return false;
      }

      if (isMuted) {
        return false;
      }

      clearFade();

      audio.volume = 0;

      try {
        await audio.play();

        setIsPlaying(true);
      } catch (error) {
        console.warn(
          "⚠️ Lecture musique bloquée ou fichier introuvable :",
          QUIZ_SOUNDS.background,
          error
        );

        setIsPlaying(false);

        audio.volume =
          effectiveVolume;

        return false;
      }

      // ------------------------------------------------------
      // FADE
      // ------------------------------------------------------

      const steps = 20;

      const stepVolume =
        effectiveVolume / steps;

      const intervalTime =
        FADE_DURATION / steps;

      let currentVolume = 0;

      fadeIntervalRef.current =
        window.setInterval(() => {
          const currentAudio =
            backgroundAudioRef.current;

          if (!currentAudio) {
            clearFade();
            return;
          }

          currentVolume +=
            stepVolume;

          if (
            currentVolume >=
            effectiveVolume
          ) {
            currentVolume =
              effectiveVolume;

            clearFade();
          }

          currentAudio.volume =
            currentVolume;
        }, intervalTime);

      return true;
    },
    [
      clearFade,
      effectiveVolume,
      isMuted,
    ]
  );

  // ==========================================================
  // PLAY MUSIC
  // ==========================================================

  const playMusic =
    useCallback(async () => {
      if (isPlaying) {
        return;
      }

      if (isMuted) {
        return;
      }

      await fadeIn();
    }, [
      fadeIn,
      isPlaying,
      isMuted,
    ]);

  // ==========================================================
  // PAUSE MUSIC
  // ==========================================================

  const pauseMusic =
    useCallback(() => {
      const audio =
        backgroundAudioRef.current;

      if (!audio) {
        return;
      }

      clearFade();

      audio.pause();

      audio.volume =
        effectiveVolume;

      setIsPlaying(false);
    }, [
      clearFade,
      effectiveVolume,
    ]);

  // ==========================================================
  // TOGGLE MUSIC
  // ==========================================================

  const toggleMusic =
    useCallback(async () => {
      if (isPlaying) {
        pauseMusic();
      } else {
        await playMusic();
      }
    }, [
      isPlaying,
      pauseMusic,
      playMusic,
    ]);

  // ==========================================================
  // STOP MUSIC
  // ==========================================================

  const stopMusic =
    useCallback(() => {
      const audio =
        backgroundAudioRef.current;

      if (!audio) {
        return;
      }

      clearFade();

      audio.pause();

      audio.currentTime = 0;

      audio.volume =
        effectiveVolume;

      setIsPlaying(false);
    }, [
      clearFade,
      effectiveVolume,
    ]);

  // ==========================================================
  // MUTE
  // ==========================================================

  const muteMusic =
    useCallback(() => {
      setIsMuted(true);

      const audio =
        backgroundAudioRef.current;

      if (audio) {
        audio.volume = 0;
      }
    }, []);

  // ==========================================================
  // UNMUTE
  // ==========================================================

  const unmuteMusic =
    useCallback(async () => {
      setIsMuted(false);

      const audio =
        backgroundAudioRef.current;

      if (!audio) {
        return;
      }

      audio.volume = volume;

      if (!isPlaying) {
        try {
          await audio.play();

          setIsPlaying(true);
        } catch (error) {
          console.warn(
            "⚠️ Impossible de reprendre la musique :",
            error
          );
        }
      }
    }, [
      isPlaying,
      volume,
    ]);

  // ==========================================================
  // TOGGLE MUTE
  // ==========================================================

  const toggleMute =
    useCallback(async () => {
      if (isMuted) {
        await unmuteMusic();
      } else {
        muteMusic();
      }
    }, [
      isMuted,
      muteMusic,
      unmuteMusic,
    ]);

  // ==========================================================
  // VOLUME
  // ==========================================================

  const setVolume =
    useCallback(
      (newVolume: number) => {
        const safeVolume =
          Math.max(
            0,
            Math.min(
              1,
              newVolume
            )
          );

        setVolumeState(
          safeVolume
        );

        const audio =
          backgroundAudioRef.current;

        if (audio && !isMuted) {
          audio.volume =
            safeVolume;
        }

        if (safeVolume > 0) {
          setIsMuted(false);
        }
      },
      [isMuted]
    );

  // ==========================================================
  // EFFETS SONORES
  // ==========================================================

  const playEffect =
    useCallback(
      (
        type: QuizSoundType
      ) => {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        // ----------------------------------------------------
        // Si mute
        // ----------------------------------------------------

        if (isMuted) {
          return;
        }

        const source =
          QUIZ_SOUNDS[type];

        if (!source) {
          return;
        }

        // ----------------------------------------------------
        // CRÉER LE SON
        // ----------------------------------------------------

        const sound =
          new Audio(source);

        sound.preload = "auto";

        sound.volume =
          EFFECTS_VOLUME;

        // ----------------------------------------------------
        // CONSERVER LA RÉFÉRENCE
        // ----------------------------------------------------

        effectAudioRefs.current.push(
          sound
        );

        // ----------------------------------------------------
        // NETTOYAGE
        // ----------------------------------------------------

        const cleanup = () => {
          effectAudioRefs.current =
            effectAudioRefs.current.filter(
              (item) =>
                item !== sound
            );

          sound.remove();
        };

        sound.addEventListener(
          "ended",
          cleanup,
          { once: true }
        );

        sound.addEventListener(
          "error",
          () => {
            cleanup();
          },
          { once: true }
        );

        // ----------------------------------------------------
        // LECTURE
        // ----------------------------------------------------

        sound
          .play()
          .catch(() => {
            // On évite de polluer la console.
            //
            // Si le fichier existe mais que le navigateur
            // bloque temporairement l'audio, l'application
            // continue normalement.
            cleanup();
          });
      },
      [isMuted]
    );

  // ==========================================================
  // NETTOYAGE GLOBAL
  // ==========================================================

  useEffect(() => {
    return () => {
      clearFade();

      // Background
      const background =
        backgroundAudioRef.current;

      if (background) {
        background.pause();
        background.currentTime = 0;
      }

      // Effets
      effectAudioRefs.current.forEach(
        (audio) => {
          audio.pause();
          audio.currentTime = 0;
          audio.remove();
        }
      );

      effectAudioRefs.current =
        [];
    };
  }, [clearFade]);

  // ==========================================================
  // RETOUR
  // ==========================================================

  return {
    // --------------------------------------------------------
    // État
    // --------------------------------------------------------

    isPlaying,
    isMuted,
    volume,

    // --------------------------------------------------------
    // Musique
    // --------------------------------------------------------

    playMusic,
    pauseMusic,
    toggleMusic,
    stopMusic,

    // --------------------------------------------------------
    // Volume
    // --------------------------------------------------------

    setVolume,

    // --------------------------------------------------------
    // Mute
    // --------------------------------------------------------

    muteMusic,
    unmuteMusic,
    toggleMute,

    // --------------------------------------------------------
    // Effets
    // --------------------------------------------------------

    playEffect,
  };
}