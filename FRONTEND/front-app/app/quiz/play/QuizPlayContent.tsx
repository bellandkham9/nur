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
import QuizResult from "../../../components/quiz/QuizResult";

import { useQuizMusic } from "@/lib/quiz/useQuizMusic";

type Celebration = {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
};

const TIME_PER_QUESTION = 30;

export default function QuizPlayPage() {
  const searchParams = useSearchParams();

  // ============================================================
  // PARAMÈTRES
  // ============================================================

  const categoryParam = searchParams.get("category");
  const countParam = searchParams.get("count");

  const parsedCategory = categoryParam
    ? Number(categoryParam)
    : undefined;

  const category =
    parsedCategory !== undefined && Number.isFinite(parsedCategory)
      ? parsedCategory
      : undefined;

  const parsedCount = countParam ? Number(countParam) : 10;

  const questionCount =
    Number.isFinite(parsedCount) && parsedCount > 0
      ? parsedCount
      : 10;

  // ============================================================
  // QUIZ
  // ============================================================

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

  // ============================================================
  // AUDIO
  // ============================================================

  const {
    isPlaying,
    toggleMusic,
    playEffect,
  } = useQuizMusic();

  // ============================================================
  // ÉTATS
  // ============================================================

  const [started, setStarted] = useState(false);

  const [timeRemaining, setTimeRemaining] =
    useState(TIME_PER_QUESTION);

  const [timeUp, setTimeUp] =
    useState(false);

  const [questionAnimation, setQuestionAnimation] =
    useState("animate-quiz-enter");

  const [celebrations, setCelebrations] =
    useState<Celebration[]>([]);

  const [showCorrectCelebration, setShowCorrectCelebration] =
    useState(false);

  // ============================================================
  // REFS
  // ============================================================

  const previousQuestionId =
    useRef<number | null>(null);

  const tickPlayedRef =
    useRef(false);

  const startSoundPlayedRef =
    useRef(false);

  const completeSoundPlayedRef =
    useRef(false);

  // ============================================================
  // INITIALISATION
  // ============================================================

  useEffect(() => {
    if (started) {
      return;
    }

    let cancelled = false;

    async function initQuiz() {
      try {
        await start(category, questionCount);

        if (cancelled) {
          return;
        }

        setStarted(true);
        setTimeRemaining(TIME_PER_QUESTION);
        setTimeUp(false);
      } catch (err) {
        console.error(
          "Erreur initialisation quiz :",
          err,
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

  // ============================================================
  // SON START
  // ============================================================

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

  // ============================================================
  // INFORMATIONS
  // ============================================================

  const isLastQuestion =
    questions.length > 0 &&
    currentIndex === questions.length - 1;

  const canGoNext =
    selectedAnswerId !== null;

  const progressPercentage = useMemo(() => {
    if (!questions.length) {
      return 0;
    }

    return Math.round(
      ((currentIndex + 1) /
        questions.length) *
        100,
    );
  }, [
    currentIndex,
    questions.length,
  ]);

  const timerProgress =
    (timeRemaining / TIME_PER_QUESTION) * 100;

  const timerDanger =
    timeRemaining <= 10;

  const timerCritical =
    timeRemaining <= 5;

  // ============================================================
  // TIMER
  // ============================================================

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

    if (answerResult) {
      return;
    }

    const interval =
      window.setInterval(() => {
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

  // ============================================================
  // TEMPS ÉCOULÉ
  // ============================================================

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

    const timeout =
      window.setTimeout(() => {
        playEffect("click");

        if (currentIndex >= questions.length - 1) {
          if (!completeSoundPlayedRef.current) {
            completeSoundPlayedRef.current = true;
            playEffect("complete");
          }

          complete();
          return;
        }

        setQuestionAnimation(
          "animate-quiz-exit",
        );

        window.setTimeout(() => {
          nextQuestion();

          setQuestionAnimation(
            "animate-quiz-enter",
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

  // ============================================================
  // TICK
  // ============================================================

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

  // ============================================================
  // RESET TIMER
  // ============================================================

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    setTimeRemaining(TIME_PER_QUESTION);
    setTimeUp(false);

    tickPlayedRef.current = false;
  }, [
    currentQuestion?.id,
  ]);

  // ============================================================
  // NOUVELLE QUESTION
  // ============================================================

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    if (
      previousQuestionId.current === null
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

  // ============================================================
  // CÉLÉBRATION
  // ============================================================

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
          id: Date.now() + index,

          emoji:
            emojis[
              Math.floor(
                Math.random() *
                  emojis.length,
              )
            ],

          left:
            Math.random() * 100,

          delay:
            Math.random() * 0.35,

          duration:
            1.4 +
            Math.random() * 1.4,
        }),
      );

    setCelebrations(particles);
    setShowCorrectCelebration(true);

    window.setTimeout(() => {
      setShowCorrectCelebration(false);
    }, 1100);

    window.setTimeout(() => {
      setCelebrations([]);
    }, 3000);
  }

  // ============================================================
  // RÉPONSE
  // ============================================================

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

  // ============================================================
  // SUIVANTE
  // ============================================================

  const handleNext = () => {
    if (!canGoNext || answering) {
      return;
    }

    playEffect("click");

    if (isLastQuestion) {
      if (!completeSoundPlayedRef.current) {
        completeSoundPlayedRef.current = true;
        playEffect("complete");
      }

      complete();
      return;
    }

    setQuestionAnimation(
      "animate-quiz-exit",
    );

    window.setTimeout(() => {
      nextQuestion();

      setQuestionAnimation(
        "animate-quiz-enter",
      );
    }, 180);
  };

  // ============================================================
  // PRÉCÉDENTE
  // ============================================================

  const handlePrevious = () => {
    if (currentIndex === 0) {
      return;
    }

    playEffect("click");

    setQuestionAnimation(
      "animate-quiz-exit",
    );

    window.setTimeout(() => {
      previousQuestion();

      setQuestionAnimation(
        "animate-quiz-enter",
      );
    }, 180);
  };

  // ============================================================
  // RETOUR
  // ============================================================

  const handleBack = () => {
    playEffect("click");

    window.location.href = "/quiz";
  };

  // ============================================================
  // ABANDON
  // ============================================================

  const handleAbandon = async () => {
    const confirmed =
      window.confirm(
        "Voulez-vous vraiment abandonner ce quiz ?\n\nVotre progression dans cette partie ne sera pas comptabilisée.",
      );

    if (!confirmed) {
      return;
    }

    playEffect("click");

    try {
      await abandon();

      window.location.href = "/quiz";
    } catch (err) {
      console.error(
        "Erreur abandon quiz :",
        err,
      );
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading && !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5faf7] px-5">
        <div className="w-full max-w-sm text-center">
          <div className="relative mx-auto mb-7 h-24 w-24">
            <div className="absolute inset-0 animate-ping rounded-4xl bg-emerald-100 opacity-70" />

            <div className="relative flex h-24 w-24 items-center justify-center rounded-4xl border-4 border-white bg-linear-to-br from-emerald-400 to-emerald-600 text-5xl shadow-[0_7px_0_#159447]">
              🧠
            </div>
          </div>

          <div className="rounded-4xl border border-slate-100 bg-white p-7 shadow-xl">
            <h1 className="text-xl font-black text-slate-950">
              Préparation du quiz...
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Prépare-toi à relever le défi ✨
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // ERREUR
  // ============================================================

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5faf7] px-5 py-10">
        <div className="w-full max-w-lg rounded-4xl border border-red-100 bg-white p-7 shadow-xl sm:p-9">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-4xl bg-red-50 text-4xl">
            😕
          </div>

          <h1 className="mt-6 text-center text-2xl font-black text-slate-950">
            Une erreur est survenue
          </h1>

          <p className="mt-3 text-center text-sm leading-7 text-slate-500">
            {error}
          </p>

          <div className="mt-7 space-y-3">
            <button
              type="button"
              onClick={() => {
                playEffect("click");
                window.location.reload();
              }}
              className="w-full rounded-2xl bg-emerald-500 px-5 py-4 font-black text-white shadow-[0_4px_0_#059669] transition hover:bg-emerald-600 active:translate-y-1 active:shadow-none"
            >
              Réessayer 🔄
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-black text-slate-600 transition hover:bg-slate-50"
            >
              ← Retour aux quiz
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // RÉSULTAT
  // ============================================================

  if (session?.status === "COMPLETED") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f5faf7] px-4 py-6 sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -right-32 top-32 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* TOP */}
          <div className="mb-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-emerald-600"
            >
              <span className="transition-transform group-hover:-translate-x-1">
                ←
              </span>
              <span>Retour</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playEffect("click");
                toggleMusic();
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5"
              aria-label={
                isPlaying
                  ? "Désactiver le son"
                  : "Activer le son"
              }
            >
              <span>{isPlaying ? "🔊" : "🔇"}</span>
              <span className="hidden sm:inline">
                {isPlaying ? "Son" : "Muet"}
              </span>
            </button>
          </div>

          {/* HERO */}
          <section className="mb-8 text-center">
            <div className="relative mx-auto mb-6 w-fit">
              <div className="absolute inset-0 rounded-full bg-amber-200/60 blur-2xl" />

              <div className="relative flex h-28 w-28 animate-bounce items-center justify-center rounded-4xl border-4 border-white bg-linear-to-br from-amber-100 to-yellow-50 text-6xl shadow-xl">
                🏆
              </div>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">
              Quiz terminé
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Bravo ! 🎉
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
              Tu viens de terminer ton défi. Voici ton résultat.
            </p>
          </section>

          {/* RESULT CARD */}
          <div className="overflow-hidden rounded-4xl border border-white bg-white/90 p-4 shadow-2xl backdrop-blur sm:p-8">
            <QuizResult
              session={session}
              progress={progress}
              onRestart={() => {
                playEffect("click");
                window.location.href = "/quiz";
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="group mx-auto mt-6 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-slate-500 transition hover:bg-white hover:text-emerald-600"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
            Choisir un autre quiz
          </button>
        </div>
      </main>
    );
  }

  // ============================================================
  // QUESTION NON DISPONIBLE
  // ============================================================

  if (!currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5faf7] px-5">
        <div className="rounded-4xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          <div className="text-5xl">🤔</div>

          <p className="mt-4 font-black text-slate-800">
            Chargement de la question...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Encore un petit instant ✨
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // TIMER FORMAT
  // ============================================================

  const minutes = Math.floor(
    timeRemaining / 60,
  )
    .toString()
    .padStart(2, "0");

  const seconds = (
    timeRemaining % 60
  )
    .toString()
    .padStart(2, "0");

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5faf7]">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -right-28 top-64 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      {/* CONFETTIS */}
      {celebrations.map((particle) => (
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
      ))}

      <div className="relative mx-auto max-w-4xl px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-7">
        {/* =====================================================
            TOP BAR
        ====================================================== */}

        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="group flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-emerald-600 sm:px-4"
          >
            <span className="text-lg transition-transform group-hover:-translate-x-1">
              ←
            </span>

            <span className="hidden sm:inline">
              Retour
            </span>
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm sm:flex">
            🧠 Quiz Bahá&apos;í
          </div>

          <button
            type="button"
            onClick={() => {
              playEffect("click");
              toggleMusic();
            }}
            className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-lg shadow-sm transition hover:-translate-y-0.5 sm:px-4"
            aria-label={
              isPlaying
                ? "Désactiver la musique"
                : "Activer la musique"
            }
          >
            <span>
              {isPlaying ? "🔊" : "🔇"}
            </span>

            <span className="hidden text-xs font-black text-slate-600 sm:inline">
              {isPlaying ? "Son" : "Muet"}
            </span>
          </button>
        </div>

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-5">
          <div className="rounded-4xl border border-white bg-white/90 p-4 shadow-lg backdrop-blur sm:p-5">
            <div className="flex items-center gap-4">
              {/* QUESTION NUMBER */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  🧠
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                    Question
                  </p>

                  <p className="mt-0.5 text-xl font-black text-slate-950">
                    {currentIndex + 1}
                    <span className="ml-1 font-semibold text-slate-400">
                      / {questions.length}
                    </span>
                  </p>
                </div>
              </div>

              {/* XP */}
              <div className="hidden items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2.5 sm:flex">
                <span className="text-lg">⭐</span>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                    XP
                  </p>

                  <p className="text-lg font-black text-emerald-700">
                    {session?.xp_earned ?? 0}
                  </p>
                </div>
              </div>

              {/* TIMER */}
              <div
                className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-all sm:h-18 sm:w-18 ${
                  timerDanger
                    ? "bg-red-50"
                    : "bg-slate-50"
                }`}
              >
                <svg
                  className="absolute inset-0 h-full w-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    className="text-slate-100"
                  />

                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="276.46"
                    strokeDashoffset={
                      276.46 -
                      (276.46 *
                        timerProgress) /
                        100
                    }
                    className={`transition-all duration-1000 ${
                      timerDanger
                        ? "text-red-500"
                        : "text-emerald-500"
                    }`}
                  />
                </svg>

                <div
                  className={`relative text-center ${
                    timerCritical
                      ? "animate-pulse"
                      : ""
                  }`}
                >
                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                    Temps
                  </p>

                  <p
                    className={`font-mono text-sm font-black sm:text-base ${
                      timerDanger
                        ? "text-red-600"
                        : "text-slate-800"
                    }`}
                  >
                    {minutes}:{seconds}
                  </p>
                </div>
              </div>
            </div>

            {/* MOBILE XP */}
            <div className="mt-4 flex items-center justify-between sm:hidden">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                <span>⭐</span>

                <span className="text-xs font-black text-emerald-700">
                  {session?.xp_earned ?? 0} XP
                </span>
              </div>

              <span className="text-xs font-bold text-slate-400">
                {progressPercentage}% terminé
              </span>
            </div>

            {/* PROGRESS */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Progression
                </span>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600">
                  {progressPercentage}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* =====================================================
            TIME UP
        ====================================================== */}

        {timeUp &&
          selectedAnswerId === null && (
            <div className="mb-5 overflow-hidden rounded-3xl border border-orange-200 bg-orange-50 p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-xl">
                  ⏱️
                </div>

                <div>
                  <p className="font-black text-orange-800">
                    Temps écoulé !
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-orange-600 sm:text-sm">
                    Passage automatique à la question suivante...
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* =====================================================
            QUESTION
        ====================================================== */}

        <section
          key={currentQuestion.id}
          className={questionAnimation}
        >
          <QuizCard
            question={currentQuestion}
            selectedAnswerId={selectedAnswerId}
            result={answerResult}
            onAnswer={selectAnswer}
            disabled={answering || timeUp}
          />
        </section>

        {/* =====================================================
            CORRECT CELEBRATION
        ====================================================== */}

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
                  +{answerResult.points_earned} XP
                </div>
              </div>
            </div>
          )}

        {/* =====================================================
            NAVIGATION
        ====================================================== */}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="group flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-600 shadow-[0_3px_0_#e2e8f0] transition hover:bg-slate-50 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Question précédente"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext || answering}
            className="group flex h-14 flex-1 items-center justify-center rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 px-5 font-black text-white shadow-[0_4px_0_#059669] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_#059669] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {answering ? (
              <>
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Vérification...
              </>
            ) : isLastQuestion ? (
              <>
                <span>Terminer le quiz</span>
                <span className="ml-2 text-xl transition-transform group-hover:scale-110">
                  🏆
                </span>
              </>
            ) : (
              <>
                <span>Continuer</span>
                <span className="ml-2 text-xl transition-transform group-hover:translate-x-1">
                  →
                </span>
              </>
            )}
          </button>
        </div>

        {/* =====================================================
            HELPER
        ====================================================== */}

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 text-center">
          <p className="text-xs font-bold text-slate-400">
            {selectedAnswerId !== null
              ? answerResult?.correct
                ? "🎉 Bonne réponse ! Continue pour avancer."
                : "💡 Réponse enregistrée. Continue pour découvrir la suite."
              : timeUp
                ? "⏱️ Le temps est écoulé."
                : "👉 Choisis une réponse pour continuer."}
          </p>
        </div>

        {/* =====================================================
            ABANDON
        ====================================================== */}

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={handleAbandon}
            className="group flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-500"
          >
            <span>🚪</span>
            <span>Quitter le quiz</span>
          </button>
        </div>

        <p className="mt-5 text-center text-[10px] font-semibold text-slate-300">
          Bahá&apos;í Companion • Apprendre en s&apos;amusant ✨
        </p>
      </div>

      {/* =====================================================
          ANIMATIONS
      ====================================================== */}

      <style jsx global>{`
        @keyframes quiz-enter {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes quiz-exit {
          0% {
            opacity: 1;
            transform: translateX(0);
          }

          100% {
            opacity: 0;
            transform: translateX(-18px);
          }
        }

        @keyframes quiz-pop {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-8deg);
          }

          60% {
            opacity: 1;
            transform: scale(1.08) rotate(2deg);
          }

          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }

        @keyframes quiz-confetti {
          0% {
            opacity: 0;
            transform: translateY(0) rotate(0deg) scale(0.7);
          }

          10% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg) scale(1.2);
          }
        }

        .animate-quiz-enter {
          animation: quiz-enter 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .animate-quiz-exit {
          animation: quiz-exit 0.18s ease-in forwards;
        }

        .animate-quiz-pop {
          animation: quiz-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </main>
  );
}