"use client";

// ============================================================
// QUIZ TYPES
// ============================================================

// ============================================================
// DIFFICULTÉ
// ============================================================

export type QuizDifficulty =
  | "EASY"
  | "MEDIUM"
  | "HARD";

// ============================================================
// STATUT SESSION
// ============================================================

export type QuizSessionStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABANDONED";

// ============================================================
// CATÉGORIE
// ============================================================

export interface QuizCategory {
  id: number;

  name: string;
  code: string;

  description: string;

  icon: string;
  color: string;

  question_count: number;
}

// ============================================================
// RÉPONSE
// ============================================================

export interface QuizAnswer {
  id: number;

  text: string;

  order: number;
}

// ============================================================
// QUESTION
// ============================================================

export interface QuizQuestion {
  id: number;

  category: number;
  category_name: string;

  question: string;

  difficulty: QuizDifficulty;

  image_url: string | null;
  audio_url: string | null;

  xp_reward: number;

  answers: QuizAnswer[];
}

// ============================================================
// SESSION
// ============================================================

export interface QuizSession {
  id: number;

  category: number | null;
  category_name?: string | null;

  status: QuizSessionStatus;
  status_display: string;

  total_questions: number;

  answered_questions: number;

  correct_answers: number;

  score: number;

  xp_earned: number;

  accuracy: number;

  started_at: string;

  completed_at: string | null;
}

// ============================================================
// START QUIZ
// ============================================================

export interface QuizStartResponse {
  session: QuizSession;

  questions: QuizQuestion[];
}

// ============================================================
// RÉPONSE À UNE QUESTION
// ============================================================

export interface QuizAnswerResponse {
  // ----------------------------------------------------------
  // Résultat
  // ----------------------------------------------------------

  correct: boolean;

  points_earned: number;

  explanation: string;

  // ----------------------------------------------------------
  // Bonne réponse
  // ----------------------------------------------------------

  correct_answer_id: number | null;

  // ----------------------------------------------------------
  // Session mise à jour
  // ----------------------------------------------------------

  session: QuizSession;

  // ----------------------------------------------------------
  // Le backend indique si cette réponse
  // a terminé automatiquement le quiz.
  // ----------------------------------------------------------

  completed: boolean;

  // ----------------------------------------------------------
  // Progression utilisateur
  //
  // Optionnelle pour rester compatible avec un backend
  // qui ne la renvoie pas encore après chaque réponse.
  // ----------------------------------------------------------

  progress?: QuizProgress | null;
}

// ============================================================
// PROGRESSION UTILISATEUR
// ============================================================

export interface QuizProgress {
  id: number;

  // ----------------------------------------------------------
  // XP / NIVEAU
  // ----------------------------------------------------------

  xp: number;

  level: number;

  // ----------------------------------------------------------
  // QUIZ
  // ----------------------------------------------------------

  total_quizzes: number;

  completed_quizzes: number;

  // ----------------------------------------------------------
  // QUESTIONS
  // ----------------------------------------------------------

  total_questions: number;

  correct_answers: number;

  accuracy: number;

  // ----------------------------------------------------------
  // SÉRIES
  // ----------------------------------------------------------

  current_streak: number;

  best_streak: number;

  // ----------------------------------------------------------
  // DERNIER QUIZ
  // ----------------------------------------------------------

  last_quiz_date: string | null;

  // ----------------------------------------------------------
  // DATES
  // ----------------------------------------------------------

  created_at: string;

  updated_at: string;
}

// ============================================================
// BADGE
// ============================================================

export interface QuizBadge {
  id: number;

  name: string;

  code: string;

  description: string;

  icon: string;

  xp_reward: number;
}

// ============================================================
// BADGE UTILISATEUR
// ============================================================

export interface QuizUserBadge {
  id: number;

  badge: QuizBadge;

  obtained_at: string;
}

// ============================================================
// FIN DE QUIZ
// ============================================================

export interface QuizCompleteResponse {
  session: QuizSession;

  progress: QuizProgress;

  message: string;
}

// ============================================================
// ABANDON
// ============================================================

export interface QuizAbandonResponse {
  message: string;

  session: QuizSession;
}

// ============================================================
// TIMEOUT
// ============================================================
//
// Type pratique pour documenter le résultat d'une question
// lorsque l'utilisateur n'a fourni aucune réponse.
//
// Le backend peut utiliser le même QuizAnswerResponse.
// Ce type n'est donc pas obligatoire dans les appels API,
// mais il rend le code plus clair.
// ============================================================

export interface QuizTimeoutResponse
  extends QuizAnswerResponse {
  correct: false;

  points_earned: number;

  correct_answer_id: number | null;
}