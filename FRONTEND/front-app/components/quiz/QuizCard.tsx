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

  const getAnswerClass = (
    answer: QuizAnswer
  ) => {
    // ========================================================
    // AVANT RÉPONSE
    // ========================================================

    if (!result) {
      if (
        selectedAnswerId === answer.id
      ) {
        return [
          "border-emerald-500",
          "bg-emerald-50",
          "ring-2",
          "ring-emerald-100",
        ].join(" ");
      }

      return [
        "border-slate-200",
        "bg-white",
        "hover:border-emerald-400",
        "hover:bg-emerald-50/50",
        "hover:shadow-md",
      ].join(" ");
    }

    // ========================================================
    // BONNE RÉPONSE
    // ========================================================

    if (
      answer.id ===
      result.correct_answer_id
    ) {
      return [
        "border-emerald-500",
        "bg-emerald-50",
        "ring-2",
        "ring-emerald-100",
      ].join(" ");
    }

    // ========================================================
    // MAUVAISE RÉPONSE SÉLECTIONNÉE
    // ========================================================

    if (
      answer.id === selectedAnswerId &&
      !result.correct
    ) {
      return [
        "border-red-500",
        "bg-red-50",
        "ring-2",
        "ring-red-100",
      ].join(" ");
    }

    // ========================================================
    // AUTRES RÉPONSES
    // ========================================================

    return [
      "border-slate-200",
      "bg-slate-50",
      "opacity-70",
    ].join(" ");
  };

  const getLetterClass = (
    answer: QuizAnswer,
    index: number
  ) => {
    if (!result) {
      if (
        selectedAnswerId === answer.id
      ) {
        return "border-emerald-500 bg-emerald-500 text-white";
      }

      return "border-slate-200 bg-slate-50 text-slate-600 group-hover:border-emerald-400 group-hover:bg-emerald-100 group-hover:text-emerald-700";
    }

    if (
      answer.id ===
      result.correct_answer_id
    ) {
      return "border-emerald-500 bg-emerald-500 text-white";
    }

    if (
      answer.id === selectedAnswerId &&
      !result.correct
    ) {
      return "border-red-500 bg-red-500 text-white";
    }

    return "border-slate-200 bg-white text-slate-400";
  };

  return (
    <div className="space-y-5">
      {/* ======================================================
          CARTE PRINCIPALE
      ====================================================== */}

      <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">

        {/* ====================================================
            IMAGE
        ==================================================== */}

        {question.image_url && (
          <div className="relative overflow-hidden">
            <img
              src={question.image_url}
              alt=""
              className="max-h-80 w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/30 to-transparent" />
          </div>
        )}

        {/* ====================================================
            QUESTION
        ==================================================== */}

        <div className="p-5 sm:p-7">
          {/* CATÉGORIE */}

          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-emerald-700">
              {question.category_name ||
                "Quiz Bahá'í"}
            </span>

            <span className="text-xs font-bold text-slate-400">
              Question
            </span>
          </div>

          {/* TEXTE QUESTION */}

          <h2 className="text-xl font-black leading-8 text-slate-900 sm:text-2xl sm:leading-9">
            {question.question}
          </h2>
        </div>
      </div>

      {/* ======================================================
          RÉPONSES
      ====================================================== */}

      <div className="space-y-3">
        {question.answers.map(
          (answer, index) => (
            <button
              key={answer.id}
              type="button"
              disabled={
                disabled ||
                selectedAnswerId !== null
              }
              onClick={() =>
                onAnswer(answer.id)
              }
              className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left shadow-sm transition-all duration-200 ${getAnswerClass(
                answer
              )} ${
                !disabled &&
                !result
                  ? "cursor-pointer active:scale-[0.99]"
                  : "cursor-default"
              }`}
            >
              {/* LETTRE */}

              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black transition ${getLetterClass(
                  answer,
                  index
                )}`}
              >
                {letters[index] ??
                  index + 1}
              </span>

              {/* TEXTE */}

              <span
                className={`flex-1 text-base font-bold leading-6 ${
                  result &&
                  answer.id ===
                    result.correct_answer_id
                    ? "text-emerald-800"
                    : result &&
                        answer.id ===
                          selectedAnswerId &&
                        !result.correct
                      ? "text-red-800"
                      : "text-slate-800"
                }`}
              >
                {answer.text}
              </span>

              {/* INDICATEUR */}

              {result &&
                answer.id ===
                  result.correct_answer_id && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-lg text-white">
                    ✓
                  </span>
                )}

              {result &&
                answer.id ===
                  selectedAnswerId &&
                !result.correct &&
                answer.id !==
                  result.correct_answer_id && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-lg text-white">
                    ✕
                  </span>
                )}
            </button>
          )
        )}
      </div>

      {/* ======================================================
          RÉSULTAT
      ====================================================== */}

      {result && (
        <div
          className={`overflow-hidden rounded-3xl border-2 p-5 ${
            result.correct
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* ICÔNE */}

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                result.correct
                  ? "bg-emerald-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {result.correct
                ? "✓"
                : "✕"}
            </div>

            {/* CONTENU */}

            <div className="min-w-0 flex-1">
              <h3
                className={`text-lg font-black ${
                  result.correct
                    ? "text-emerald-800"
                    : "text-red-800"
                }`}
              >
                {result.correct
                  ? "Excellente réponse ! 🎉"
                  : "Pas cette fois 😅"}
              </h3>

              {result.correct && (
                <p className="mt-1 font-black text-emerald-600">
                  +{result.points_earned} XP
                </p>
              )}

              {result.explanation && (
                <div className="mt-4 rounded-xl border border-white/70 bg-white/70 p-4">
                  <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-400">
                    💡 Explication
                  </p>

                  <p className="text-sm font-medium leading-6 text-slate-700">
                    {result.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}