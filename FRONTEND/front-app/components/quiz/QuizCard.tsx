"use client";

import type {
  QuizQuestion,
  QuizAnswer,
  QuizAnswerResponse,
} from "../../types/quiz";

interface QuizCardProps {
  question: QuizQuestion;
  selectedAnswerId: number | null;
  result: QuizAnswerResponse | null;
  onAnswer: (answerId: number) => void;
  disabled?: boolean;
}

export default function QuizCard({
  question,
  selectedAnswerId,
  result,
  onAnswer,
  disabled = false,
}: QuizCardProps) {
  const letters = ["A", "B", "C", "D", "E", "F"];

  // ==========================================================
  // STYLE RÉPONSE
  // ==========================================================

  const getAnswerClass = (answer: QuizAnswer) => {
    if (!result) {
      if (selectedAnswerId === answer.id) {
        return [
          "border-emerald-500",
          "bg-emerald-50",
          "shadow-[0_8px_25px_rgba(16,185,129,0.12)]",
          "ring-2",
          "ring-emerald-100",
        ].join(" ");
      }

      return [
        "border-slate-200",
        "bg-white",
        "hover:-translate-y-0.5",
        "hover:border-emerald-300",
        "hover:bg-emerald-50/40",
        "hover:shadow-lg",
      ].join(" ");
    }

    if (answer.id === result.correct_answer_id) {
      return [
        "border-emerald-400",
        "bg-emerald-50",
        "shadow-[0_8px_25px_rgba(16,185,129,0.10)]",
      ].join(" ");
    }

    if (
      answer.id === selectedAnswerId &&
      !result.correct
    ) {
      return [
        "border-red-400",
        "bg-red-50",
        "shadow-[0_8px_25px_rgba(239,68,68,0.10)]",
      ].join(" ");
    }

    return [
      "border-slate-100",
      "bg-slate-50/70",
      "opacity-60",
    ].join(" ");
  };

  // ==========================================================
  // STYLE LETTRE
  // ==========================================================

  const getLetterClass = (answer: QuizAnswer) => {
    if (!result) {
      if (selectedAnswerId === answer.id) {
        return [
          "border-emerald-500",
          "bg-emerald-500",
          "text-white",
          "shadow-sm",
        ].join(" ");
      }

      return [
        "border-slate-200",
        "bg-slate-50",
        "text-slate-500",
        "group-hover:border-emerald-300",
        "group-hover:bg-emerald-100",
        "group-hover:text-emerald-700",
      ].join(" ");
    }

    if (answer.id === result.correct_answer_id) {
      return [
        "border-emerald-500",
        "bg-emerald-500",
        "text-white",
      ].join(" ");
    }

    if (
      answer.id === selectedAnswerId &&
      !result.correct
    ) {
      return [
        "border-red-500",
        "bg-red-500",
        "text-white",
      ].join(" ");
    }

    return [
      "border-slate-200",
      "bg-white",
      "text-slate-400",
    ].join(" ");
  };

  // ==========================================================
  // COULEUR TEXTE
  // ==========================================================

  const getAnswerTextClass = (answer: QuizAnswer) => {
    if (
      result &&
      answer.id === result.correct_answer_id
    ) {
      return "text-emerald-900";
    }

    if (
      result &&
      answer.id === selectedAnswerId &&
      !result.correct
    ) {
      return "text-red-900";
    }

    if (
      selectedAnswerId === answer.id &&
      !result
    ) {
      return "text-emerald-900";
    }

    return "text-slate-800";
  };

  const hasImage = Boolean(question.image_url);

  return (
    <div className="space-y-5">
      {/* =====================================================
          QUESTION CARD
      ====================================================== */}

      <article className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        {/* ==================================================
            IMAGE
        ================================================== */}

        {hasImage && (
          <div className="relative overflow-hidden bg-slate-100">
            <div className="relative aspect-[16/9] max-h-[420px] w-full sm:aspect-[2/1]">
              <img
                src={question.image_url!}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />

              <div className="absolute inset-0 bg-linear-to-t from-slate-950/45 via-transparent to-transparent" />

              <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 shadow-lg backdrop-blur">
                  <span>📖</span>
                  Quiz Bahá&apos;í
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            QUESTION CONTENT
        ================================================== */}

        <div className="p-5 sm:p-8">
          {/* BADGES */}

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex max-w-full items-center rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
              <span className="truncate">
                {question.category_name ||
                  "Quiz Bahá&apos;í"}
              </span>
            </span>

            <span className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              Choisis la bonne réponse
            </span>
          </div>

          {/* QUESTION */}

          <h2 className="mt-5 text-xl font-black leading-8 tracking-tight text-slate-950 sm:text-2xl sm:leading-10">
            {question.question}
          </h2>

          {/* DECORATION */}

          <div className="mt-6 flex items-center gap-2">
            <span className="h-1.5 w-10 rounded-full bg-emerald-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
          </div>
        </div>
      </article>

      {/* =====================================================
          ANSWERS
      ====================================================== */}

      <section>
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Tes réponses
          </p>

          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-400 shadow-sm">
            {question.answers.length} choix
          </span>
        </div>

        <div className="space-y-3">
          {question.answers.map((answer, index) => {
            const isCorrect =
              Boolean(
                result &&
                  answer.id ===
                    result.correct_answer_id,
              );

            const isWrong =
              Boolean(
                result &&
                  answer.id ===
                    selectedAnswerId &&
                  !result.correct,
              );

            const isSelected =
              selectedAnswerId === answer.id;

            return (
              <button
                key={answer.id}
                type="button"
                disabled={
                  disabled ||
                  selectedAnswerId !== null
                }
                onClick={() => {
                  onAnswer(answer.id);
                }}
                className={`group flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all duration-200 sm:gap-4 sm:p-4 ${getAnswerClass(
                  answer,
                )} ${
                  !disabled && !result
                    ? "cursor-pointer active:scale-[0.985]"
                    : "cursor-default"
                }`}
                aria-label={`Réponse ${letters[index] ?? index + 1}: ${answer.text}`}
              >
                {/* LETTER */}

                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition-all duration-200 sm:h-12 sm:w-12 ${getLetterClass(
                    answer,
                  )}`}
                >
                  {letters[index] ??
                    index + 1}
                </span>

                {/* TEXT */}

                <span
                  className={`min-w-0 flex-1 text-sm font-bold leading-6 sm:text-base ${getAnswerTextClass(
                    answer,
                  )}`}
                >
                  {answer.text}
                </span>

                {/* STATUS */}

                {isCorrect && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-base font-black text-white shadow-sm sm:h-10 sm:w-10">
                    ✓
                  </span>
                )}

                {isWrong && !isCorrect && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-base font-black text-white shadow-sm sm:h-10 sm:w-10">
                    ✕
                  </span>
                )}

                {!result && isSelected && (
                  <span className="hidden h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 sm:block" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          RESULT
      ====================================================== */}

      {result && (
        <section
          className={`overflow-hidden rounded-[2rem] border shadow-sm ${
            result.correct
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          {/* TOP BAR */}

          <div
            className={`h-1.5 ${
              result.correct
                ? "bg-emerald-500"
                : "bg-red-500"
            }`}
          />

          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* ICON */}

              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-sm ${
                  result.correct
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              >
                {result.correct ? "✓" : "✕"}
              </div>

              {/* CONTENT */}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                        result.correct
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      Résultat
                    </p>

                    <h3
                      className={`mt-1 text-lg font-black ${
                        result.correct
                          ? "text-emerald-900"
                          : "text-red-900"
                      }`}
                    >
                      {result.correct
                        ? "Excellente réponse ! 🎉"
                        : "Pas cette fois 😅"}
                    </h3>
                  </div>

                  {/* XP */}

                  {result.correct && (
                    <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        Récompense
                      </p>

                      <p className="mt-0.5 text-lg font-black text-emerald-600">
                        +{result.points_earned} XP
                      </p>
                    </div>
                  )}
                </div>

                {/* EXPLANATION */}

                {result.explanation && (
                  <div className="mt-5 rounded-2xl border border-white/80 bg-white/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm">
                        💡
                      </span>

                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                        À retenir
                      </p>
                    </div>

                    <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
                      {result.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}