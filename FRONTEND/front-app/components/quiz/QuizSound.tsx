"use client";

import { useEffect, useRef, useState } from "react";

interface QuizSoundProps {
  enabled?: boolean;
  musicSrc?: string;
}

export default function QuizSound({
  enabled = true,
  musicSrc = "/sounds/quiz-background.mp3",
}: QuizSoundProps) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const [muted, setMuted] =
    useState(false);

  useEffect(() => {
    const audio =
      new Audio(musicSrc);

    audio.loop = true;
    audio.volume = 0.25;

    audioRef.current = audio;

    if (enabled) {
      audio
        .play()
        .catch(() => {
          // Le navigateur peut bloquer
          // l'autoplay avant une interaction.
        });
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [musicSrc, enabled]);

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.muted =
      muted;
  }, [muted]);

  return (
    <button
      type="button"
      onClick={() =>
        setMuted((value) => !value)
      }
      className="rounded-full px-3 py-2 text-sm"
      aria-label={
        muted
          ? "Activer le son"
          : "Couper le son"
      }
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}