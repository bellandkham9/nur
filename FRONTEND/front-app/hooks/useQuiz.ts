"use client";

import { useCallback, useState } from "react";

import {
  startQuiz,
  submitQuizAnswer,
  completeQuiz,
  abandonQuiz,
} from "../services/quizApi";

import type {
  QuizQuestion,
  QuizSession,
  QuizAnswerResponse,
  QuizProgress,
} from "../types/quiz";

// ============================================================
// TYPES
// ============================================================

interface UseQuizReturn {
  session: QuizSession | null;
  questions: QuizQuestion[];

  currentIndex: number;
  currentQuestion: QuizQuestion | null;

  selectedAnswerId: number | null;
  answerResult: QuizAnswerResponse | null;

  progress: QuizProgress | null;

  loading: boolean;
  answering: boolean;
  error: string | null;

  start: (
    categoryId?: number,
    questionCount?: number
  ) => Promise<void>;

  selectAnswer: (
    answerId: number
  ) => Promise<void>;

  nextQuestion: () => void;
  previousQuestion: () => void;

  complete: () => Promise<void>;
  abandon: () => Promise<void>;

  resetAnswerState: () => void;
}

// ============================================================
// HOOK
// ============================================================

export function useQuiz(): UseQuizReturn {
  // ==========================================================
  // SESSION
  // ==========================================================

  const [session, setSession] =
    useState<QuizSession | null>(null);

  // ==========================================================
  // QUESTIONS
  // ==========================================================

  const [questions, setQuestions] =
    useState<QuizQuestion[]>([]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  // ==========================================================
  // RÉPONSE
  // ==========================================================

  const [selectedAnswerId, setSelectedAnswerId] =
    useState<number | null>(null);

  const [answerResult, setAnswerResult] =
    useState<QuizAnswerResponse | null>(null);

  // ==========================================================
  // PROGRESSION
  // ==========================================================

  const [progress, setProgress] =
    useState<QuizProgress | null>(null);

  // ==========================================================
  // ÉTATS
  // ==========================================================

  const [loading, setLoading] =
    useState(false);

  const [answering, setAnswering] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ==========================================================
  // QUESTION COURANTE
  // ==========================================================

  const currentQuestion =
    questions[currentIndex] ?? null;

  // ==========================================================
  // RESET ÉTAT RÉPONSE
  // ==========================================================

  const resetAnswerState = useCallback(() => {
    setSelectedAnswerId(null);
    setAnswerResult(null);
    setError(null);
  }, []);

  // ==========================================================
  // START QUIZ
  // ==========================================================

  const start = useCallback(
    async (
      categoryId?: number,
      questionCount: number = 10
    ) => {
      try {
        setLoading(true);
        setError(null);

        // ----------------------------------------------------
        // Nettoyage de l'ancien quiz
        // ----------------------------------------------------

        setSession(null);
        setQuestions([]);
        setCurrentIndex(0);
        setSelectedAnswerId(null);
        setAnswerResult(null);
        setProgress(null);

        // ----------------------------------------------------
        // Appel API
        // ----------------------------------------------------

        const result = await startQuiz(
          categoryId,
          questionCount
        );

        // ----------------------------------------------------
        // Session
        // ----------------------------------------------------

        setSession(result.session);

        // ----------------------------------------------------
        // Questions
        // ----------------------------------------------------

        setQuestions(
          Array.isArray(result.questions)
            ? result.questions
            : []
        );

        setCurrentIndex(0);

        // ----------------------------------------------------
        // État initial
        // ----------------------------------------------------

        setSelectedAnswerId(null);
        setAnswerResult(null);

      } catch (err: any) {
        console.error(
          "Erreur démarrage quiz :",
          err
        );

        setError(
          err?.message ||
          "Impossible de démarrer le quiz."
        );

        // On nettoie les données si le démarrage échoue
        setSession(null);
        setQuestions([]);
        setCurrentIndex(0);
        setSelectedAnswerId(null);
        setAnswerResult(null);
        setProgress(null);

      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ==========================================================
  // RÉPONDRE À UNE QUESTION
  // ==========================================================

  const selectAnswer = useCallback(
    async (answerId: number) => {
      // ------------------------------------------------------
      // Sécurités
      // ------------------------------------------------------

      if (!session) {
        return;
      }

      if (!currentQuestion) {
        return;
      }

      // Une seule réponse par question
      if (selectedAnswerId !== null) {
        return;
      }

      // Empêche les doubles clics
      if (answering) {
        return;
      }

      // Session déjà terminée
      if (
        session.status === "COMPLETED"
      ) {
        return;
      }

      try {
        setAnswering(true);
        setError(null);

        // ----------------------------------------------------
        // Affichage immédiat de la sélection
        // ----------------------------------------------------

        setSelectedAnswerId(answerId);

        // ----------------------------------------------------
        // Envoi au backend
        // ----------------------------------------------------

        const result =
          await submitQuizAnswer(
            session.id,
            currentQuestion.id,
            answerId
          );

        // ----------------------------------------------------
        // Résultat
        // ----------------------------------------------------

        setAnswerResult(result);

        // ----------------------------------------------------
        // Mise à jour session
        // ----------------------------------------------------

        if (result.session) {
          setSession(result.session);
        }

        // ----------------------------------------------------
        // Mise à jour progression
        // ----------------------------------------------------

        if (result.progress) {
          setProgress(result.progress);
        }

      } catch (err: any) {
        console.error(
          "Erreur réponse quiz :",
          err
        );

        // La réponse n'a pas été enregistrée
        setSelectedAnswerId(null);

        setAnswerResult(null);

        setError(
          err?.message ||
          "Impossible d'enregistrer la réponse."
        );

      } finally {
        setAnswering(false);
      }
    },
    [
      session,
      currentQuestion,
      selectedAnswerId,
      answering,
    ]
  );

  // ==========================================================
  // QUESTION SUIVANTE
  // ==========================================================

  const nextQuestion = useCallback(() => {
    // --------------------------------------------------------
    // Vérifier qu'il existe une question suivante
    // --------------------------------------------------------

    if (
      currentIndex >=
      questions.length - 1
    ) {
      return;
    }

    setCurrentIndex(
      (previousIndex) =>
        previousIndex + 1
    );

    // --------------------------------------------------------
    // Réinitialiser l'état de réponse
    // --------------------------------------------------------

    setSelectedAnswerId(null);
    setAnswerResult(null);
    setError(null);

  }, [
    currentIndex,
    questions.length,
  ]);

  // ==========================================================
  // QUESTION PRÉCÉDENTE
  // ==========================================================

  const previousQuestion = useCallback(() => {
    // --------------------------------------------------------
    // Première question
    // --------------------------------------------------------

    if (currentIndex <= 0) {
      return;
    }

    setCurrentIndex(
      (previousIndex) =>
        previousIndex - 1
    );

    // --------------------------------------------------------
    // Réinitialiser l'état d'affichage
    // --------------------------------------------------------

    setSelectedAnswerId(null);
    setAnswerResult(null);
    setError(null);

  }, [currentIndex]);

  // ==========================================================
  // TERMINER LE QUIZ
  // ==========================================================

  const complete = useCallback(
    async () => {
      if (!session) {
        return;
      }

      if (
        session.status === "COMPLETED"
      ) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // ----------------------------------------------------
        // Appel backend
        // ----------------------------------------------------

        const result =
          await completeQuiz(
            session.id
          );

        // ----------------------------------------------------
        // Session finale
        // ----------------------------------------------------

        setSession(result.session);

        // ----------------------------------------------------
        // Progression finale
        // ----------------------------------------------------

        if (result.progress) {
          setProgress(
            result.progress
          );
        }

      } catch (err: any) {
        console.error(
          "Erreur fin du quiz :",
          err
        );

        setError(
          err?.message ||
          "Impossible de terminer le quiz."
        );

      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // ==========================================================
  // ABANDONNER
  // ==========================================================

  const abandon = useCallback(
    async () => {
      if (!session) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // ----------------------------------------------------
        // Appel backend
        // ----------------------------------------------------

        const result =
          await abandonQuiz(
            session.id
          );

        // ----------------------------------------------------
        // Mise à jour session
        // ----------------------------------------------------

        setSession(
          result.session
        );

      } catch (err: any) {
        console.error(
          "Erreur abandon quiz :",
          err
        );

        setError(
          err?.message ||
          "Impossible d'abandonner le quiz."
        );

      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    // Session
    session,

    // Questions
    questions,
    currentIndex,
    currentQuestion,

    // Réponse
    selectedAnswerId,
    answerResult,

    // Progression
    progress,

    // États
    loading,
    answering,
    error,

    // Actions
    start,
    selectAnswer,

    nextQuestion,
    previousQuestion,

    complete,
    abandon,

    resetAnswerState,
  };
}