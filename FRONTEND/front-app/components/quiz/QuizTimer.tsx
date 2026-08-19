"use client";

import { useEffect, useState } from "react";

interface QuizTimerProps {
  duration?: number;
  running?: boolean;
  onTimeUp?: () => void;
}

export default function QuizTimer({
  duration = 30,
  running = true,
  onTimeUp,
}: QuizTimerProps) {
  const [timeLeft, setTimeLeft] =
    useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!running) return;

    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(
        (previous) =>
          previous - 1
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [
    running,
    timeLeft,
    onTimeUp,
  ]);

  const percentage =
    (timeLeft / duration) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 w-32 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <span
        className={`font-bold ${
          timeLeft <= 5
            ? "text-red-500"
            : "text-gray-700"
        }`}
      >
        {timeLeft}s
      </span>
    </div>
  );
}