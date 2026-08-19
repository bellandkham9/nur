import { apiFetch } from "@/lib/api";

import type {
  QuizCategory,
  QuizStartResponse,
  QuizQuestion,
  QuizAnswerResponse,
  QuizSession,
  QuizProgress,
  QuizBadge,
  QuizUserBadge,
  QuizCompleteResponse,
} from "../types/quiz";

// ============================================================
// CONFIGURATION
// ============================================================

const QUIZ_API_BASE = "/api/quiz";

// Nombre minimum / maximum de questions autorisé côté frontend.
// Le backend reste la source de vérité.
const MIN_QUESTION_COUNT = 1;
const MAX_QUESTION_COUNT = 100;

// ============================================================
// UTILITAIRES
// ============================================================

function normalizeQuestionCount(
  count: number
): number {
  if (!Number.isFinite(count)) {
    return 10;
  }

  return Math.max(
    MIN_QUESTION_COUNT,
    Math.min(
      MAX_QUESTION_COUNT,
      Math.floor(count)
    )
  );
}

function normalizeCategoryId(
  categoryId?: number
): number | undefined {
  if (
    categoryId === undefined ||
    categoryId === null
  ) {
    return undefined;
  }

  if (
    !Number.isFinite(categoryId) ||
    categoryId <= 0
  ) {
    return undefined;
  }

  return Math.floor(categoryId);
}

// ============================================================
// CATÉGORIES
// ============================================================

export async function getQuizCategories(): Promise<
  QuizCategory[]
> {
  const result =
    await apiFetch(
      `${QUIZ_API_BASE}/categories/`
    );

  return Array.isArray(result)
    ? result
    : [];
}

// ============================================================
// DÉMARRER UN QUIZ
// ============================================================

export async function startQuiz(
  categoryId?: number,
  questionCount: number = 10
): Promise<QuizStartResponse> {
  const safeQuestionCount =
    normalizeQuestionCount(
      questionCount
    );

  const safeCategoryId =
    normalizeCategoryId(
      categoryId
    );

  const body: {
    question_count: number;
    category_id?: number;
  } = {
    question_count:
      safeQuestionCount,
  };

  if (
    safeCategoryId !== undefined
  ) {
    body.category_id =
      safeCategoryId;
  }

  console.log(
    "🎯 Démarrage du quiz :",
    body
  );

  return apiFetch(
    `${QUIZ_API_BASE}/start/`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

// ============================================================
// RÉCUPÉRER UNE QUESTION
// ============================================================

export async function getQuizQuestion(
  sessionId: number,
  questionId: number
): Promise<QuizQuestion> {
  if (
    !sessionId ||
    !questionId
  ) {
    throw new Error(
      "Session ou question invalide."
    );
  }

  return apiFetch(
    `${QUIZ_API_BASE}/sessions/${sessionId}/question/${questionId}/`
  );
}

// ============================================================
// RÉPONDRE
// ============================================================

export async function submitQuizAnswer(
  sessionId: number,
  questionId: number,
  answerId: number
): Promise<QuizAnswerResponse> {
  if (!sessionId) {
    throw new Error(
      "Session de quiz invalide."
    );
  }

  if (!questionId) {
    throw new Error(
      "Question de quiz invalide."
    );
  }

  if (!answerId) {
    throw new Error(
      "Réponse de quiz invalide."
    );
  }

  const body = {
    question_id: questionId,
    answer_id: answerId,
  };

  console.log(
    "📝 Réponse envoyée :",
    body
  );

  return apiFetch(
    `${QUIZ_API_BASE}/sessions/${sessionId}/answer/`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

// ============================================================
// RÉPONSE APRÈS TEMPS ÉCOULÉ
// ============================================================
//
// Cette fonction est volontairement séparée de
// submitQuizAnswer().
//
// Elle permet de gérer proprement le cas :
//
//     ⏱️ temps écoulé
//     ↓
//     aucune réponse sélectionnée
//
// IMPORTANT : le backend doit accepter answer_id = null.
// Si ton endpoint actuel ne l'accepte pas encore,
// nous l'adapterons côté Django.
// ============================================================

export async function submitQuizTimeout(
  sessionId: number,
  questionId: number
): Promise<QuizAnswerResponse> {
  if (!sessionId) {
    throw new Error(
      "Session de quiz invalide."
    );
  }

  if (!questionId) {
    throw new Error(
      "Question de quiz invalide."
    );
  }

  const body = {
    question_id: questionId,
    answer_id: null,
  };

  console.log(
    "⏱️ Temps écoulé :",
    body
  );

  return apiFetch(
    `${QUIZ_API_BASE}/sessions/${sessionId}/answer/`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

// ============================================================
// TERMINER LE QUIZ
// ============================================================

export async function completeQuiz(
  sessionId: number
): Promise<QuizCompleteResponse> {
  if (!sessionId) {
    throw new Error(
      "Session de quiz invalide."
    );
  }

  console.log(
    "🏆 Finalisation du quiz :",
    sessionId
  );

  return apiFetch(
    `${QUIZ_API_BASE}/sessions/${sessionId}/complete/`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

// ============================================================
// ABANDONNER
// ============================================================

export async function abandonQuiz(
  sessionId: number
): Promise<{
  message: string;
  session: QuizSession;
}> {
  if (!sessionId) {
    throw new Error(
      "Session de quiz invalide."
    );
  }

  console.log(
    "🚪 Abandon du quiz :",
    sessionId
  );

  return apiFetch(
    `${QUIZ_API_BASE}/sessions/${sessionId}/abandon/`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

// ============================================================
// RÉCUPÉRER LA PROGRESSION
// ============================================================

export async function getQuizProgress(): Promise<
  QuizProgress
> {
  return apiFetch(
    `${QUIZ_API_BASE}/progress/`
  );
}

// ============================================================
// HISTORIQUE
// ============================================================

export async function getQuizHistory(): Promise<
  QuizSession[]
> {
  const result =
    await apiFetch(
      `${QUIZ_API_BASE}/history/`
    );

  return Array.isArray(result)
    ? result
    : [];
}

// ============================================================
// RÉCUPÉRER UNE SESSION
// ============================================================

export async function getQuizSession(
  sessionId: number
): Promise<QuizSession> {
  if (!sessionId) {
    throw new Error(
      "Session de quiz invalide."
    );
  }

  return apiFetch(
    `${QUIZ_API_BASE}/sessions/${sessionId}/`
  );
}

// ============================================================
// BADGES
// ============================================================

export async function getQuizBadges(): Promise<
  QuizBadge[]
> {
  const result =
    await apiFetch(
      `${QUIZ_API_BASE}/badges/`
    );

  return Array.isArray(result)
    ? result
    : [];
}

// ============================================================
// MES BADGES
// ============================================================

export async function getMyQuizBadges(): Promise<
  QuizUserBadge[]
> {
  const result =
    await apiFetch(
      `${QUIZ_API_BASE}/my-badges/`
    );

  return Array.isArray(result)
    ? result
    : [];
}