"use client";

import type {
  QuizSession,
  QuizProgress,
} from "../../types/quiz";

interface QuizResultProps {
  session: QuizSession;
  progress: QuizProgress | null;
  onRestart?: () => void;
}

export default function QuizResult({
  session,
  progress,
  onRestart,
}: QuizResultProps) {
  // ============================================================
  // CALCULS
  // ============================================================

  const accuracy = Number(session.accuracy ?? 0);

  const totalQuestions =
    Number(session.total_questions ?? 0);

  const correctAnswers =
    Number(session.correct_answers ?? 0);

  const score =
    Number(session.score ?? 0);

  const xpEarned =
    Number(session.xp_earned ?? 0);

  const level =
    Number(progress?.level ?? 1);

  const totalXp =
    Number(progress?.xp ?? 0);

  const currentStreak =
    Number(progress?.current_streak ?? 0);

  // ============================================================
  // MESSAGE SELON LE SCORE
  // ============================================================

  let title = "Quiz terminé !";
  let message = "Bravo pour tes efforts !";
  let emoji = "🏆";

  if (accuracy >= 90) {
    title = "Exceptionnel !";
    message = "Tu maîtrises vraiment bien ce sujet !";
    emoji = "🏆";
  } else if (accuracy >= 75) {
    title = "Excellent !";
    message = "Très belle performance ! Continue comme ça.";
    emoji = "🎉";
  } else if (accuracy >= 50) {
    title = "Bien joué !";
    message = "Tu progresses, continue ton apprentissage.";
    emoji = "👏";
  } else {
    title = "Courage !";
    message = "Chaque question est une occasion d'apprendre.";
    emoji = "💪";
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleHome = () => {
    window.location.href = "/";
  };

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="mx-auto w-full max-w-3xl">

      {/* ======================================================
          CARTE PRINCIPALE
      ====================================================== */}

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 py-10 text-center sm:px-10">

          {/* Décor */}

          <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

          <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-yellow-300/10 blur-2xl" />

          {/* Médaille */}

          <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-white/15 text-6xl shadow-2xl backdrop-blur-sm">
            {emoji}
          </div>

          <h1 className="relative text-3xl font-black tracking-tight text-white sm:text-4xl">
            {title}
          </h1>

          <p className="relative mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-white/85 sm:text-base">
            {message}
          </p>

          {/* Score principal */}

          <div className="relative mx-auto mt-7 max-w-xs rounded-3xl border border-white/20 bg-white/10 px-6 py-5 backdrop-blur-md">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              Score final
            </p>

            <div className="mt-1 text-5xl font-black text-white">
              {score}
            </div>

            <p className="mt-1 text-sm font-medium text-white/70">
              {correctAnswers}
              {totalQuestions > 0
                ? ` / ${totalQuestions}`
                : ""}{" "}
              bonnes réponses
            </p>
          </div>
        </div>

        {/* ====================================================
            CONTENU
        ==================================================== */}

        <div className="space-y-6 bg-[#f8faf7] p-5 sm:p-8">

          {/* ==================================================
              STATISTIQUES
          ================================================== */}

          <div>
            <h2 className="mb-4 text-lg font-black text-slate-800">
              📊 Tes résultats
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

              {/* BONNES RÉPONSES */}

              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="mb-2 text-2xl">
                  ✅
                </div>

                <div className="text-2xl font-black text-emerald-600">
                  {correctAnswers}
                </div>

                <div className="mt-1 text-xs font-bold text-slate-500">
                  Bonnes réponses
                </div>
              </div>

              {/* PRÉCISION */}

              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="mb-2 text-2xl">
                  🎯
                </div>

                <div className="text-2xl font-black text-blue-600">
                  {accuracy}%
                </div>

                <div className="mt-1 text-xs font-bold text-slate-500">
                  Précision
                </div>
              </div>

              {/* SCORE */}

              <div className="rounded-2xl border border-yellow-100 bg-white p-4 shadow-sm">
                <div className="mb-2 text-2xl">
                  ⭐
                </div>

                <div className="text-2xl font-black text-yellow-600">
                  {score}
                </div>

                <div className="mt-1 text-xs font-bold text-slate-500">
                  Score
                </div>
              </div>

              {/* XP */}

              <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
                <div className="mb-2 text-2xl">
                  ✨
                </div>

                <div className="text-2xl font-black text-purple-600">
                  +{xpEarned}
                </div>

                <div className="mt-1 text-xs font-bold text-slate-500">
                  XP gagnés
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              BARRE DE PRÉCISION
          ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-3 flex items-center justify-between">

              <span className="text-sm font-black text-slate-700">
                🎯 Précision
              </span>

              <span className="text-sm font-black text-emerald-600">
                {accuracy}%
              </span>

            </div>

            <div className="h-4 overflow-hidden rounded-full bg-slate-100">

              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000"
                style={{
                  width: `${Math.min(
                    Math.max(accuracy, 0),
                    100
                  )}%`,
                }}
              />

            </div>

            <p className="mt-3 text-xs font-medium text-slate-500">
              {accuracy >= 90
                ? "🔥 Performance exceptionnelle !"
                : accuracy >= 75
                  ? "👏 Très bon travail !"
                  : accuracy >= 50
                    ? "📚 Continue à apprendre !"
                    : "💪 Ne baisse pas les bras !"}
            </p>
          </div>

          {/* ==================================================
              PROGRESSION DU JOUEUR
          ================================================== */}

          {progress && (
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Ta progression
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-800">
                    Niveau {level}
                  </h2>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-black text-white shadow-[0_4px_0_#059669]">
                  {level}
                </div>

              </div>

              <div className="grid grid-cols-2 gap-3">

                {/* XP TOTAL */}

                <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">

                  <div className="text-xl">
                    ✨
                  </div>

                  <div className="mt-1 text-xl font-black text-emerald-600">
                    {totalXp}
                  </div>

                  <div className="text-xs font-bold text-slate-500">
                    XP total
                  </div>

                </div>

                {/* SÉRIE */}

                <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">

                  <div className="text-xl">
                    🔥
                  </div>

                  <div className="mt-1 text-xl font-black text-orange-500">
                    {currentStreak}
                  </div>

                  <div className="text-xs font-bold text-slate-500">
                    Série actuelle
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ==================================================
              MESSAGE FINAL
          ================================================== */}

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-center">

            <div className="text-3xl">
              🌟
            </div>

            <p className="mt-2 font-black text-yellow-800">
              Continue ton apprentissage !
            </p>

            <p className="mt-1 text-sm font-medium leading-6 text-yellow-700">
              Chaque quiz te permet de mieux connaître
              les enseignements de la Foi bahá'íe.
            </p>

          </div>

          {/* ==================================================
              BOUTONS
          ================================================== */}

          <div className="space-y-3">

            {/* REJOUER */}

              <button
                type="button"
                onClick={onRestart}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 font-black text-white shadow-[0_4px_0_#059669] transition hover:bg-emerald-600 active:translate-y-1 active:shadow-none"
              >
                <span className="mr-2 text-xl">
                  🔄
                </span>

                Retour aux quiz
              </button>
            

            {/* RETOUR AUX QUIZ */}

            {/* ACCUEIL */}

            <button
              type="button"
              onClick={handleHome}
              className="flex h-12 w-full items-center justify-center rounded-2xl px-6 font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              🏠 Retour à l'accueil
            </button>

          </div>

        </div>
      </div>

      {/* ======================================================
          PETIT TEXTE
      ====================================================== */}

      <p className="mt-5 text-center text-xs font-medium text-slate-400">
        Bahá'í Companion • Quiz
      </p>

    </div>
  );
}