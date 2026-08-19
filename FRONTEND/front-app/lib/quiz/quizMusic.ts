// ============================================================
// MUSIQUES DU QUIZ
// ============================================================

export const QUIZ_MUSIC_TRACKS = [
  "/sounds/quiz-background.mp3",
];


// ============================================================
// EFFETS SONORES
// ============================================================

export const QUIZ_SOUNDS = {
  start: "/sounds/quiz-start.mp3",
  correct: "/sounds/quiz-correct.mp3",
  wrong: "/sounds/quiz-wrong.mp3",
  tick: "/sounds/quiz-tick.mp3",
  next: "/sounds/quiz-next.mp3",
  complete: "/sounds/quiz-complete.mp3",
  click: "/sounds/quiz-click.mp3",
} as const;


// ============================================================
// CONFIGURATION AUDIO
// ============================================================

export const QUIZ_AUDIO_CONFIG = {
  musicVolume: 0.18,
  effectsVolume: 0.65,

  fadeDuration: 1200,
  fadeStep: 0.02,
};