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


// ============================================================
// QUIZ RESULT
// ============================================================

export default function QuizResult({
  session,
  progress,
  onRestart,
}: QuizResultProps) {

  // ==========================================================
  // CALCULS
  // ==========================================================

  const accuracy =
    Number(session.accuracy ?? 0);

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


  // ==========================================================
  // MESSAGE SELON LE SCORE
  // ==========================================================

  let title = "Quiz terminé !";
  let message =
    "Bravo pour tes efforts ! Continue à apprendre et à progresser.";

  let emoji = "🏆";

  let performanceLabel =
    "Belle progression";

  if (accuracy >= 90) {

    title = "Exceptionnel !";
    message =
      "Une performance remarquable. Tu maîtrises vraiment bien ce sujet !";

    emoji = "🏆";

    performanceLabel =
      "Performance exceptionnelle";

  } else if (accuracy >= 75) {

    title = "Excellent !";
    message =
      "Très belle performance ! Continue sur cette magnifique lancée.";

    emoji = "🎉";

    performanceLabel =
      "Très belle performance";

  } else if (accuracy >= 50) {

    title = "Bien joué !";
    message =
      "Tu progresses bien. Chaque quiz te rapproche un peu plus de la maîtrise.";

    emoji = "👏";

    performanceLabel =
      "Continue comme ça";

  } else {

    title = "Continue !";
    message =
      "Chaque erreur est une occasion d'apprendre et de progresser.";

    emoji = "💪";

    performanceLabel =
      "Chaque effort compte";

  }


  // ==========================================================
  // VALEURS DÉRIVÉES
  // ==========================================================

  const wrongAnswers =
    Math.max(
      totalQuestions - correctAnswers,
      0,
    );


  const safeAccuracy =
    Math.min(
      Math.max(accuracy, 0),
      100,
    );


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handleHome = () => {

    window.location.href = "/";

  };


  // ==========================================================
  // RENDU
  // ==========================================================

  return (

    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">


      <div className="mx-auto w-full max-w-4xl">


        {/* ====================================================
            HERO RESULT
        ==================================================== */}

        <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-xl sm:rounded-[2.5rem]">


          {/* BACKGROUND */}

          <div className="absolute inset-0">

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800" />

            <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl" />

            <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

          </div>


          {/* CONTENT */}

          <div className="relative px-5 py-8 text-center sm:px-10 sm:py-12">


            {/* BADGE */}

            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">

              <span className="h-2 w-2 rounded-full bg-emerald-300" />

              Résultat du quiz

            </div>


            {/* TROPHY */}

            <div className="relative mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/30 bg-white/15 text-6xl shadow-2xl backdrop-blur-md sm:h-28 sm:w-28 sm:text-7xl">

              {emoji}

            </div>


            {/* TITLE */}

            <h1 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-5xl">

              {title}

            </h1>


            {/* MESSAGE */}

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">

              {message}

            </p>


            {/* PERFORMANCE */}

            <div className="mx-auto mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">


              {/* ACCURACY */}

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-md">

                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">

                  Précision

                </p>

                <p className="mt-1 text-3xl font-black text-white">

                  {safeAccuracy}%

                </p>

              </div>


              {/* SCORE */}

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-md">

                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">

                  Score

                </p>

                <p className="mt-1 text-3xl font-black text-white">

                  {score}

                </p>

              </div>


              {/* XP */}

              <div className="col-span-2 rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-md sm:col-span-1">

                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">

                  XP gagnés

                </p>

                <p className="mt-1 text-3xl font-black text-white">

                  +{xpEarned}

                </p>

              </div>


            </div>

          </div>

        </section>


        {/* ====================================================
            CONTENU
        ==================================================== */}

        <div className="space-y-6 py-6 sm:py-8">


          {/* ==================================================
              RÉSUMÉ
          ================================================== */}

          <section>


            <div className="mb-4 flex items-end justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">

                  Résumé

                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">

                  Tes résultats

                </h2>

              </div>


              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 sm:block">

                {performanceLabel}

              </span>

            </div>


            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">


              {/* BONNES RÉPONSES */}

              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition sm:p-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-xl">

                  ✓

                </div>

                <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">

                  {correctAnswers}

                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">

                  Bonnes réponses

                </p>

              </div>


              {/* MAUVAISES RÉPONSES */}

              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition sm:p-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-xl">

                  ✕

                </div>

                <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">

                  {wrongAnswers}

                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">

                  À revoir

                </p>

              </div>


              {/* QUESTIONS */}

              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition sm:p-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-xl">

                  ?

                </div>

                <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">

                  {totalQuestions}

                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">

                  Questions

                </p>

              </div>


              {/* XP */}

              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition sm:p-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-xl">

                  ✦

                </div>

                <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">

                  +{xpEarned}

                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">

                  XP gagnés

                </p>

              </div>


            </div>

          </section>


          {/* ==================================================
              PERFORMANCE
          ================================================== */}

          <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">


            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">


              <div className="flex items-center justify-between gap-4">


                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xl">

                    🎯

                  </div>


                  <div>

                    <h2 className="font-bold text-slate-900">

                      Niveau de précision

                    </h2>

                    <p className="text-xs text-slate-500">

                      {performanceLabel}

                    </p>

                  </div>

                </div>


                <div className="text-right">

                  <p className="text-2xl font-black tracking-tight text-emerald-600">

                    {safeAccuracy}%

                  </p>

                </div>


              </div>

            </div>


            <div className="p-5 sm:p-6">


              {/* PROGRESS */}

              <div className="relative h-4 overflow-hidden rounded-full bg-slate-100">


                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 transition-all duration-1000"
                  style={{
                    width: `${safeAccuracy}%`,
                  }}
                />

              </div>


              {/* LABELS */}

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">

                <span>

                  0%

                </span>

                <span>

                  50%

                </span>

                <span>

                  100%

                </span>

              </div>


              {/* MESSAGE */}

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">

                <p className="text-sm font-semibold text-slate-700">

                  {accuracy >= 90
                    ? "🔥 Une performance exceptionnelle !"
                    : accuracy >= 75
                      ? "👏 Excellent travail, continue comme ça !"
                      : accuracy >= 50
                        ? "📚 Tu progresses bien, continue ton apprentissage."
                        : "💪 Ne baisse pas les bras, chaque quiz te fait progresser."}

                </p>

              </div>


            </div>

          </section>


          {/* ==================================================
              PROGRESSION JOUEUR
          ================================================== */}

          {progress && (

            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-lg sm:p-7">


              {/* DECOR */}

              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

              <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-black/10 blur-2xl" />


              <div className="relative">


                {/* HEADER */}

                <div className="flex items-start justify-between gap-4">


                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">

                      Ta progression

                    </p>

                    <h2 className="mt-2 text-3xl font-black">

                      Niveau {level}

                    </h2>

                    <p className="mt-1 text-sm text-white/75">

                      Continue à jouer pour gagner encore plus d'expérience.

                    </p>

                  </div>


                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-2xl font-black backdrop-blur-sm">

                    {level}

                  </div>


                </div>


                {/* STATS */}

                <div className="mt-7 grid grid-cols-2 gap-3">


                  {/* XP TOTAL */}

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">

                    <p className="text-xl">

                      ✨

                    </p>

                    <p className="mt-2 text-2xl font-black">

                      {totalXp}

                    </p>

                    <p className="mt-1 text-xs font-medium text-white/65">

                      XP total

                    </p>

                  </div>


                  {/* SÉRIE */}

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">

                    <p className="text-xl">

                      🔥

                    </p>

                    <p className="mt-2 text-2xl font-black">

                      {currentStreak}

                    </p>

                    <p className="mt-1 text-xs font-medium text-white/65">

                      Série actuelle

                    </p>

                  </div>


                </div>


              </div>

            </section>

          )}


          {/* ==================================================
              MESSAGE MOTIVATION
          ================================================== */}

          <section className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 sm:p-6">


            <div className="flex gap-4">


              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">

                🌟

              </div>


              <div>

                <h3 className="font-bold text-slate-900">

                  Continue ton apprentissage

                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">

                  Chaque quiz est une nouvelle occasion de découvrir,
                  apprendre et approfondir ta connaissance des enseignements
                  de la Foi bahá'íe.

                </p>

              </div>


            </div>

          </section>


          {/* ==================================================
              ACTIONS
          ================================================== */}

          <section className="space-y-3 pt-2">


            {/* RETOUR AUX QUIZ */}

            {onRestart && (

              <button
                type="button"
                onClick={onRestart}
                className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl active:translate-y-0"
              >

                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-lg transition group-hover:rotate-180">

                  🔄

                </span>

                <span>

                  Retour aux quiz

                </span>

              </button>

            )}


            {/* ACCUEIL */}

            <button
              type="button"
              onClick={handleHome}
              className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >

              <span>

                🏠

              </span>

              Retour à l'accueil

            </button>


          </section>


        </div>


        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="pb-4 text-center">

          <p className="text-xs font-medium text-slate-400">

            Bahá'í Companion

            <span className="mx-2 text-slate-300">

              •

            </span>

            Quiz

          </p>

        </footer>


      </div>

    </main>

  );

}