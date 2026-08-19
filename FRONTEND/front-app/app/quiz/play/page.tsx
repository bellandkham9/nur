"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

import { useQuiz } from "../../../hooks/useQuiz";

import QuizCard from "../../../components/quiz/QuizCard";
import QuizProgress from "../../../components/quiz/QuizProgress";
import QuizResult from "../../../components/quiz/QuizResult";

import { useQuizMusic } from "@/lib/quiz/useQuizMusic";

// ============================================================
// TYPES
// ============================================================

type Celebration = {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
};

// ============================================================
// CONFIGURATION
// ============================================================

const TIME_PER_QUESTION = 30;

// ============================================================
// PAGE
// ============================================================

export default function QuizPlayPage() {
  const searchParams = useSearchParams();

  // ==========================================================
  // PARAMÈTRES URL
  // ==========================================================

  const categoryParam = searchParams.get("category");
  const countParam = searchParams.get("count");

  const category = categoryParam
    ? Number(categoryParam)
    : undefined;

  const questionCount = countParam
    ? Number(countParam)
    : 10;

  // ==========================================================
  // QUIZ
  // ==========================================================

  const {
    session,
    questions,
    currentIndex,
    currentQuestion,
    selectedAnswerId,
    answerResult,
    progress,
    loading,
    answering,
    error,
    start,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    complete,
    abandon,
  } = useQuiz();

  // ==========================================================
  // MUSIQUE
  // ==========================================================

  const {
    isPlaying,
    toggleMusic,
    playEffect,
  } = useQuizMusic();

  // ==========================================================
  // ÉTATS
  // ==========================================================

  const [started, setStarted] = useState(false);

  const [celebrations, setCelebrations] =
    useState<Celebration[]>([]);

  const [
    questionAnimation,
    setQuestionAnimation,
  ] = useState("animate-quiz-enter");

  const [
    showCorrectCelebration,
    setShowCorrectCelebration,
  ] = useState(false);

  // ==========================================================
  // TIMER
  // ==========================================================

  const [timeRemaining, setTimeRemaining] =
    useState(TIME_PER_QUESTION);

  const [timeUp, setTimeUp] =
    useState(false);

  // ==========================================================
  // TRACKERS AUDIO
  // ==========================================================

  const previousQuestionId =
    useRef<number | null>(null);

  const tickPlayedRef =
    useRef(false);

  const startSoundPlayedRef =
    useRef(false);

  const completeSoundPlayedRef =
    useRef(false);

  // ==========================================================
  // INITIALISATION
  // ==========================================================

  useEffect(() => {
    if (started) {
      return;
    }

    let cancelled = false;

    async function initQuiz() {
      try {
        await start(
          category,
          questionCount
        );

        if (cancelled) {
          return;
        }

        setStarted(true);

        setTimeRemaining(
          TIME_PER_QUESTION
        );

        setTimeUp(false);
      } catch (error) {
        console.error(
          "Erreur initialisation quiz :",
          error
        );
      }
    }

    initQuiz();

    return () => {
      cancelled = true;
    };
  }, [
    category,
    questionCount,
    started,
    start,
  ]);

  // ==========================================================
  // SON DE DÉMARRAGE
  // ==========================================================

  useEffect(() => {
    if (!started) {
      return;
    }

    if (startSoundPlayedRef.current) {
      return;
    }

    startSoundPlayedRef.current = true;

    playEffect("start");
  }, [
    started,
    playEffect,
  ]);

  // ==========================================================
  // PROPRIÉTÉS
  // ==========================================================

  const isLastQuestion =
    currentIndex ===
    questions.length - 1;

  const canGoNext =
    selectedAnswerId !== null;

  // ==========================================================
  // PROGRESSION
  // ==========================================================

  const progressPercentage =
    useMemo(() => {
      if (!questions.length) {
        return 0;
      }

      return Math.round(
        ((currentIndex + 1) /
          questions.length) *
          100
      );
    }, [
      currentIndex,
      questions.length,
    ]);

  // ==========================================================
  // TIMER
  // ==========================================================

 useEffect(() => {
  if (!started) {
    return;
  }

  if (!currentQuestion) {
    return;
  }

  if (session?.status === "COMPLETED") {
    return;
  }

  if (timeUp) {
    return;
  }

  // Une réponse a déjà été donnée :
  // le timer n'a plus besoin de tourner.
  if (answerResult) {
    return;
  }

  const interval = window.setInterval(() => {
    setTimeRemaining((previous) => {
      if (previous <= 1) {
        window.clearInterval(interval);

        setTimeRemaining(0);
        setTimeUp(true);

        return 0;
      }

      return previous - 1;
    });
  }, 1000);

  return () => {
    window.clearInterval(interval);
  };
}, [
  started,
  currentQuestion?.id,
  session?.status,
  answerResult,
  timeUp,
]);

// ==========================================================
// TEMPS ÉCOULÉ → QUESTION SUIVANTE
// ==========================================================

useEffect(() => {
  if (!timeUp) {
    return;
  }

  if (!currentQuestion) {
    return;
  }

  if (session?.status === "COMPLETED") {
    return;
  }

  const timeout = window.setTimeout(() => {
    playEffect("click");

    // ------------------------------------------------------
    // DERNIÈRE QUESTION
    // ------------------------------------------------------

    if (currentIndex >= questions.length - 1) {
      if (!completeSoundPlayedRef.current) {
        completeSoundPlayedRef.current = true;

        playEffect("complete");
      }

      complete();

      return;
    }

    // ------------------------------------------------------
    // QUESTION SUIVANTE
    // ------------------------------------------------------

    setQuestionAnimation(
      "animate-quiz-exit"
    );

    window.setTimeout(() => {
      nextQuestion();

      setQuestionAnimation(
        "animate-quiz-enter"
      );
    }, 180);

  }, 500);

  return () => {
    window.clearTimeout(timeout);
  };
}, [
  timeUp,
  currentQuestion,
  currentIndex,
  questions.length,
  session?.status,
  nextQuestion,
  complete,
  playEffect,
]);

  // ==========================================================
  // SON TICK
  // ==========================================================

  useEffect(() => {
    if (
      timeRemaining <= 5 &&
      timeRemaining > 0 &&
      !answerResult &&
      !timeUp
    ) {
      if (!tickPlayedRef.current) {
        tickPlayedRef.current = true;

        playEffect("tick");
      }
    } else {
      tickPlayedRef.current = false;
    }
  }, [
    timeRemaining,
    answerResult,
    timeUp,
    playEffect,
  ]);

  // ==========================================================
  // RESET TIMER
  // ==========================================================

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    setTimeRemaining(
      TIME_PER_QUESTION
    );

    setTimeUp(false);

    tickPlayedRef.current = false;
  }, [
    currentQuestion?.id,
  ]);

  // ==========================================================
  // SON NOUVELLE QUESTION
  // ==========================================================

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    if (
      previousQuestionId.current ===
      null
    ) {
      previousQuestionId.current =
        currentQuestion.id;

      return;
    }

    if (
      previousQuestionId.current !==
      currentQuestion.id
    ) {
      playEffect("next");

      previousQuestionId.current =
        currentQuestion.id;
    }
  }, [
    currentQuestion?.id,
    playEffect,
  ]);

  // ==========================================================
  // CÉLÉBRATION
  // ==========================================================

  function createCelebration() {
    const emojis = [
      "🎉",
      "✨",
      "🌸",
      "⭐",
      "💫",
      "🎊",
      "🌟",
      "💚",
    ];

    const particles: Celebration[] =
      Array.from(
        { length: 24 },
        (_, index) => ({
          id:
            Date.now() +
            index,

          emoji:
            emojis[
              Math.floor(
                Math.random() *
                  emojis.length
              )
            ],

          left:
            Math.random() *
            100,

          delay:
            Math.random() *
            0.35,

          duration:
            1.4 +
            Math.random() *
              1.4,
        })
      );

    setCelebrations(
      particles
    );

    setShowCorrectCelebration(
      true
    );

    window.setTimeout(() => {
      setShowCorrectCelebration(
        false
      );
    }, 1100);

    window.setTimeout(() => {
      setCelebrations([]);
    }, 3000);
  }

  // ==========================================================
  // RÉPONSE
  // ==========================================================

  useEffect(() => {
    if (!answerResult) {
      return;
    }

    if (answerResult.correct) {
      playEffect("correct");

      createCelebration();
    } else {
      playEffect("wrong");
    }
  }, [
    answerResult,
    playEffect,
  ]);

  // ==========================================================
  // QUESTION SUIVANTE
  // ==========================================================

  const handleNext = () => {
    if (!canGoNext) {
      return;
    }

    if (answering) {
      return;
    }

    playEffect("click");

    if (isLastQuestion) {
      if (
        !completeSoundPlayedRef.current
      ) {
        completeSoundPlayedRef.current =
          true;

        playEffect("complete");
      }

      complete();

      return;
    }

    setQuestionAnimation(
      "animate-quiz-exit"
    );

    window.setTimeout(() => {
      nextQuestion();

      setQuestionAnimation(
        "animate-quiz-enter"
      );
    }, 180);
  };

  // ==========================================================
  // QUESTION PRÉCÉDENTE
  // ==========================================================

  const handlePrevious = () => {
    if (currentIndex === 0) {
      return;
    }

    playEffect("click");

    setQuestionAnimation(
      "animate-quiz-exit"
    );

    window.setTimeout(() => {
      previousQuestion();

      setQuestionAnimation(
        "animate-quiz-enter"
      );
    }, 180);
  };

  // ==========================================================
  // RETOUR AU MENU
  // ==========================================================

  const handleBack = () => {
    playEffect("click");

    window.location.href =
      "/quiz";
  };

  // ==========================================================
  // ABANDON
  // ==========================================================

  const handleAbandon =
    async () => {
      const confirmed =
        window.confirm(
          "Voulez-vous vraiment abandonner ce quiz ?\n\nVotre progression dans cette partie ne sera pas comptabilisée."
        );

      if (!confirmed) {
        return;
      }

      playEffect("click");

      try {
        await abandon();

        window.location.href =
          "/quiz";
      } catch (error) {
        console.error(
          "Erreur abandon quiz :",
          error
        );
      }
    };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading &&
    !session
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f8f5] px-6">
        <div className="w-full max-w-sm text-center">

          <div className="relative mx-auto mb-7 h-28 w-28">

            <div className="absolute inset-0 animate-ping rounded-4xl bg-emerald-100 opacity-60" />

            <div className="relative flex h-28 w-28 items-center justify-center rounded-4xl border border-emerald-100 bg-white text-6xl shadow-xl">
              🧠
            </div>

          </div>

          <div className="rounded-4xl border border-slate-100 bg-white p-7 shadow-sm">

            <h1 className="text-xl font-black text-slate-900">
              Préparation du quiz...
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Prépare-toi à apprendre
              en t'amusant ✨
            </p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" />
            </div>

          </div>

        </div>
      </main>
    );
  }

  // ==========================================================
  // ERREUR
  // ==========================================================

  if (error) {
    return (
      <main className="min-h-screen bg-[#f4f8f5] px-6 py-12">

        <div className="mx-auto max-w-lg">

          <div className="rounded-4xl border border-red-100 bg-white p-8 shadow-xl">

            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-4xl bg-red-50 text-5xl">
              😕
            </div>

            <h1 className="text-center text-2xl font-black text-slate-900">
              Une erreur est survenue
            </h1>

            <p className="mt-3 text-center text-sm leading-6 text-slate-500">
              {error}
            </p>

            <div className="mt-7 space-y-3">

              <button
                type="button"
                onClick={() => {
                  playEffect(
                    "click"
                  );

                  window.location.reload();
                }}
                className="w-full rounded-2xl bg-emerald-500 px-5 py-4 font-black text-white shadow-[0_4px_0_#059669] transition hover:bg-emerald-600 active:translate-y-1 active:shadow-none"
              >
                Réessayer 🔄
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-600 transition hover:bg-slate-50"
              >
                ← Retour aux quiz
              </button>

            </div>

          </div>

        </div>

      </main>
    );
  }

  // ==========================================================
  // RÉSULTAT
  // ==========================================================

  if (
    session?.status ===
    "COMPLETED"
  ) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f4f8f5] px-4 py-8 sm:py-12">

        {/* DÉCOR */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />

          <div className="absolute -right-32 top-40 h-80 w-80 rounded-full bg-yellow-100/60 blur-3xl" />

          <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-100/40 blur-3xl" />

        </div>

        <div className="relative mx-auto max-w-4xl">

          {/* TOP BAR */}

          <div className="mb-6 flex items-center justify-between">

            <button
              type="button"
              onClick={handleBack}
              className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <span className="text-lg transition group-hover:-translate-x-1">
                ←
              </span>

              Retour
            </button>

            <button
              type="button"
              onClick={() => {
                playEffect(
                  "click"
                );

                toggleMusic();
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              {isPlaying
                ? "🔊 Son activé"
                : "🔇 Son coupé"}
            </button>

          </div>

          {/* HERO */}

          <div className="mb-7 text-center">

            <div className="mx-auto mb-5 flex h-28 w-28 animate-bounce items-center justify-center rounded-4xl border-4 border-white bg-linear-to-br from-yellow-100 to-amber-50 text-6xl shadow-xl">
              🏆
            </div>

            <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
              Quiz terminé
            </p>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Bravo ! 🎉
            </h1>

            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-500">
              Tu viens de terminer ton
              quiz. Découvre ton résultat
              et continue ton parcours.
            </p>

          </div>

          {/* RESULTAT */}

          <div className="rounded-4xl border border-white/80 bg-white/90 p-5 shadow-xl backdrop-blur sm:p-8">

            <QuizResult
              session={session}
              progress={progress}
              onRestart={() => {
                playEffect(
                  "click"
                );

                window.location.href =
                  "/quiz";
              }}
            />

          </div>

          {/* BOUTON RETOUR */}

          <div className="mt-6 flex justify-center">

            <button
              type="button"
              onClick={handleBack}
              className="group flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-slate-500 transition hover:bg-white hover:text-emerald-600"
            >
              <span className="transition group-hover:-translate-x-1">
                ←
              </span>

              Choisir un autre quiz
            </button>

          </div>

        </div>

      </main>
    );
  }

  // ==========================================================
  // QUESTION INDISPONIBLE
  // ==========================================================

  if (!currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f8f5] px-6">

        <div className="rounded-4xl border border-slate-100 bg-white p-8 text-center shadow-xl">

          <div className="mb-5 text-6xl">
            🤔
          </div>

          <p className="font-black text-slate-800">
            Chargement de la question...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Encore un petit instant ✨
          </p>

        </div>

      </main>
    );
  }

  // ==========================================================
  // TIMER
  // ==========================================================

  const minutes =
    Math.floor(
      timeRemaining / 60
    )
      .toString()
      .padStart(2, "0");

  const seconds =
    (
      timeRemaining %
      60
    )
      .toString()
      .padStart(2, "0");

  const timerDanger =
    timeRemaining <= 10;

  // ==========================================================
  // RENDU PRINCIPAL
  // ==========================================================

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8f5]">

      {/* ====================================================
          DÉCOR
      ==================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-100/70 blur-3xl" />

        <div className="absolute -right-24 top-72 h-80 w-80 rounded-full bg-yellow-100/70 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-100/50 blur-3xl" />

      </div>

      {/* ====================================================
          CONFETTIS
      ==================================================== */}

      {celebrations.map(
        (particle) => (
          <span
            key={particle.id}
            className="pointer-events-none fixed z-50 text-2xl"
            style={{
              left: `${particle.left}%`,
              top: "-40px",
              animation: `quiz-confetti ${particle.duration}s ease-out ${particle.delay}s forwards`,
            }}
          >
            {particle.emoji}
          </span>
        )
      )}

      {/* ====================================================
          CONTENU
      ==================================================== */}

      <div className="relative mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8">

        {/* ==================================================
            TOP BAR
        ================================================== */}

        <div className="mb-5 flex items-center justify-between gap-3">

          {/* RETOUR */}

          <button
            type="button"
            onClick={handleBack}
            className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 sm:px-4"
          >
            <span className="text-lg transition group-hover:-translate-x-1">
              ←
            </span>

            <span className="hidden sm:inline">
              Retour
            </span>
          </button>

          {/* CENTRE */}

          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm sm:flex">
            🧠 Quiz Bahá'í
          </div>

          {/* SON */}

          <button
            type="button"
            onClick={() => {
              playEffect(
                "click"
              );

              toggleMusic();
            }}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-lg shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            aria-label={
              isPlaying
                ? "Désactiver la musique"
                : "Activer la musique"
            }
          >
            <span>
              {isPlaying
                ? "🔊"
                : "🔇"}
            </span>

            <span className="hidden text-xs font-black text-slate-600 sm:inline">
              {isPlaying
                ? "Son"
                : "Muet"}
            </span>
          </button>

        </div>

        {/* ==================================================
            HEADER QUIZ
        ================================================== */}

        <header className="mb-6">

          <div className="rounded-4xl border border-white/80 bg-white/90 p-5 shadow-lg backdrop-blur sm:p-6">

            <div className="flex items-center justify-between gap-4">

              {/* QUESTION */}

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  🧠
                </div>

                <div className="min-w-0">

                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
                    Quiz Bahá'í
                  </p>

                  <p className="mt-1 truncate text-lg font-black text-slate-900">
                    {currentIndex + 1}

                    <span className="ml-1 font-semibold text-slate-400">
                      /{" "}
                      {questions.length}
                    </span>
                  </p>
                   <div className="rounded-3xl border border-white bg-white p-4 shadow-sm">

                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xl">
                      ⭐
                    </span>

                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      XP
                    </span>
                  </div>

                  <p className="text-2xl font-black text-emerald-600">
                    {session?.xp_earned ?? 0}
                  </p>

                </div>

                </div>
                

              </div>

              {/* TIMER */}

              <div
                className={`shrink-0 rounded-2xl border px-4 py-3 text-center shadow-sm transition-all ${
                  timerDanger
                    ? "animate-pulse border-red-200 bg-red-50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >

                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Temps
                </p>

                <p
                  className={`mt-0.5 font-mono text-xl font-black ${
                    timerDanger
                      ? "text-red-600"
                      : "text-slate-800"
                  }`}
                >
                  {minutes}:
                  {seconds}
                </p>

              </div>

            </div>

            {/* PROGRESSION */}

            <div className="mt-6">

              <div className="mb-2 flex items-center justify-between">

                <span className="text-xs font-black text-slate-400">
                  Progression
                </span>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-600">
                  {progressPercentage}%
                </span>

              </div>

              <div className="overflow-hidden rounded-full bg-slate-100 p-1">

                <div
                  className="h-2 rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />

              </div>

            

            </div>

          </div>

        </header>

        {/* ==================================================
            TEMPS ÉCOULÉ
        ================================================== */}

        {timeUp &&
          selectedAnswerId ===
            null && (
            <div className="mb-6 overflow-hidden rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
                  ⏱️
                </div>

                <div>

                  <p className="font-black text-orange-800">
                    Le temps est écoulé !
                  </p>

                  <p className="mt-1 text-sm font-medium text-orange-600">
                    Tu ne peux plus répondre à cette question.
                  </p>

                </div>

              </div>

            </div>
          )}

        {/* ==================================================
            QUESTION
        ================================================== */}

        <section
          key={
            currentQuestion.id
          }
          className={questionAnimation}
        >

          <div className="rounded-4xl border border-white/80 bg-white/95 p-2 shadow-xl backdrop-blur sm:p-3">

            <QuizCard
              question={
                currentQuestion
              }
              selectedAnswerId={
                selectedAnswerId
              }
              result={
                answerResult
              }
              onAnswer={
                selectAnswer
              }
              disabled={
                answering ||
                timeUp
              }
            />

          </div>

        </section>

        {/* ==================================================
            CÉLÉBRATION
        ================================================== */}

        {showCorrectCelebration &&
          answerResult?.correct && (
            <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-5">

              <div className="animate-quiz-pop w-full max-w-xs rounded-4xl border-4 border-emerald-100 bg-white p-7 text-center shadow-2xl">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-5xl">
                  🎉
                </div>

                <div className="mt-4 text-2xl font-black text-emerald-600">
                  Excellent !
                </div>

                <div className="mt-1 text-sm font-bold text-slate-500">
                  +
                  {
                    answerResult.points_earned
                  }{" "}
                  XP
                </div>

              </div>

            </div>
          )}

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <div className="mt-7 flex gap-3">

          {/* PRÉCÉDENTE */}

          <button
            type="button"
            onClick={
              handlePrevious
            }
            disabled={
              currentIndex === 0
            }
            className="group flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-600 shadow-[0_3px_0_#e2e8f0] transition hover:bg-slate-50 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Question précédente"
          >
            <span className="transition group-hover:-translate-x-1">
              ←
            </span>
          </button>

          {/* SUIVANTE */}

          <button
            type="button"
            onClick={
              handleNext
            }
            disabled={
              !canGoNext ||
              answering
            }
            className="group flex h-14 flex-1 items-center justify-center rounded-2xl bg-emerald-500 px-6 font-black text-white shadow-[0_4px_0_#059669] transition hover:-translate-y-0.5 hover:bg-emerald-600 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >

            {answering ? (
              <>
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Vérification...
              </>
            ) : isLastQuestion ? (
              <>
                Terminer le quiz

                <span className="ml-2 text-xl transition group-hover:scale-110">
                  🏆
                </span>
              </>
            ) : (
              <>
                Continuer

                <span className="ml-2 text-xl transition group-hover:translate-x-1">
                  →
                </span>
              </>
            )}

          </button>

        </div>

        {/* ==================================================
            INDICATEUR
        ================================================== */}

        <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-center">

          <p className="text-xs font-bold text-slate-400">

            {selectedAnswerId !==
            null
              ? answerResult?.correct
                ? "🎉 Bonne réponse ! Continue pour avancer."
                : "💡 Réponse enregistrée. Continue pour découvrir la suite."
              : timeUp
                ? "⏱️ Le temps est écoulé."
                : "👉 Choisis une réponse pour continuer."}

          </p>

        </div>

        {/* ==================================================
            ABANDON
        ================================================== */}

        <div className="mt-8 flex justify-center">

          <button
            type="button"
            onClick={
              handleAbandon
            }
            className="group flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <span>
              🚪
            </span>

            Quitter le quiz

          </button>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-5 text-center">

          <p className="text-[11px] font-semibold text-slate-300">
            Bahá'í Companion • Apprendre en s'amusant ✨
          </p>

        </div>

      </div>

      {/* ====================================================
          ANIMATIONS
      ==================================================== */}

      <style jsx global>{`

        @keyframes quiz-enter {

          0% {
            opacity: 0;
            transform:
              translateY(18px)
              scale(0.98);
          }

          100% {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }

        }

        @keyframes quiz-exit {

          0% {
            opacity: 1;
            transform:
              translateX(0);
          }

          100% {
            opacity: 0;
            transform:
              translateX(-18px);
          }

        }

        @keyframes quiz-pop {

          0% {
            opacity: 0;
            transform:
              scale(0.5)
              rotate(-8deg);
          }

          60% {
            opacity: 1;
            transform:
              scale(1.08)
              rotate(2deg);
          }

          100% {
            opacity: 1;
            transform:
              scale(1)
              rotate(0);
          }

        }

        @keyframes quiz-confetti {

          0% {
            opacity: 0;
            transform:
              translateY(0)
              rotate(0deg)
              scale(0.7);
          }

          10% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform:
              translateY(100vh)
              rotate(720deg)
              scale(1.2);
          }

        }

        .animate-quiz-enter {

          animation:
            quiz-enter
            0.35s
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            );

        }

        .animate-quiz-exit {

          animation:
            quiz-exit
            0.18s
            ease-in
            forwards;

        }

        .animate-quiz-pop {

          animation:
            quiz-pop
            0.45s
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            );

        }

      `}</style>

    </main>
  );
}