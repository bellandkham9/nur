"use client";

import BottomNavigation from "@/components/navigation/BottomNavigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch, getCurrentUser } from "@/lib/api";

/* ============================================================
TYPES
============================================================ */

type CurrentUser = {
id: number;
username: string;
email: string;
};

type QuizProgress = {
id: number;
xp: number;
level: number;
total_quizzes: number;
completed_quizzes: number;
total_questions: number;
correct_answers: number;
accuracy: number;
current_streak: number;
best_streak: number;
last_quiz_date: string | null;
created_at: string;
updated_at: string;
};

type ProfileStats = {
notifications: number;
upcomingEvents: number;
documents: number;
};

const EMPTY_STATS: ProfileStats = {
notifications: 0,
upcomingEvents: 0,
documents: 0,
};

/* ============================================================
HELPERS
============================================================ */

/**

* Les endpoints DRF peuvent renvoyer :
*
* * directement un tableau
* * ou un objet paginé { count, results }
*
* Cette fonction permet de gérer les deux cas sans supposer
* un format unique.
  */
  function getCollectionCount(data: unknown): number {
  if (Array.isArray(data)) {
  return data.length;
  }

if (
data &&
typeof data === "object" &&
"count" in data &&
typeof (data as { count?: unknown }).count === "number"
) {
return (data as { count: number }).count;
}

if (
data &&
typeof data === "object" &&
"results" in data &&
Array.isArray((data as { results?: unknown }).results)
) {
return (data as { results: unknown[] }).results.length;
}

return 0;
}

/**

* Retourne une initiale propre pour l'avatar.
  */
  function getInitial(username: string): string {
  const value = username.trim();

if (!value) {
return "U";
}

return value.charAt(0).toUpperCase();
}

/* ============================================================
PAGE PROFIL
============================================================ */

export default function ProfilePage() {
const [username, setUsername] = useState("Utilisateur");
const [loadingUser, setLoadingUser] = useState(true);

const [stats, setStats] = useState<ProfileStats>(EMPTY_STATS);
const [quizProgress, setQuizProgress] = useState<QuizProgress | null>(
null
);

const [loadingStats, setLoadingStats] = useState(true);
const [statsError, setStatsError] = useState(false);

/* ==========================================================
CHARGEMENT DU PROFIL + STATISTIQUES
========================================================== */

useEffect(() => {
let mounted = true;

async function loadProfile() {
  try {
    setLoadingUser(true);
    setLoadingStats(true);
    setStatsError(false);

    const [
      userResult,
      notificationsResult,
      eventsResult,
      documentsResult,
      quizResult,
    ] = await Promise.allSettled([
      getCurrentUser(),

      apiFetch("/api/notifications/"),

      apiFetch("/api/events/upcoming/?limit=100"),

      apiFetch("/api/document-imports/"),

      apiFetch("/api/quiz/progress/"),
    ]);

    if (!mounted) {
      return;
    }

    /* ------------------------------------------------------
       UTILISATEUR
    ------------------------------------------------------ */

    if (userResult.status === "fulfilled") {
      const user = userResult.value as CurrentUser;

      setUsername(user.username || "Utilisateur");
    } else {
      console.error(
        "❌ Impossible de récupérer l'utilisateur :",
        userResult.reason
      );
    }

    /* ------------------------------------------------------
       NOTIFICATIONS
    ------------------------------------------------------ */

    let notificationsCount = 0;

    if (notificationsResult.status === "fulfilled") {
      notificationsCount = getCollectionCount(
        notificationsResult.value
      );
    } else {
      console.error(
        "❌ Impossible de récupérer les notifications :",
        notificationsResult.reason
      );
    }

    /* ------------------------------------------------------
       ÉVÉNEMENTS À VENIR
    ------------------------------------------------------ */

    let upcomingEventsCount = 0;

    if (eventsResult.status === "fulfilled") {
      upcomingEventsCount = getCollectionCount(
        eventsResult.value
      );
    } else {
      console.error(
        "❌ Impossible de récupérer les événements :",
        eventsResult.reason
      );
    }

    /* ------------------------------------------------------
       DOCUMENTS
    ------------------------------------------------------ */

    let documentsCount = 0;

    if (documentsResult.status === "fulfilled") {
      documentsCount = getCollectionCount(
        documentsResult.value
      );
    } else {
      console.error(
        "❌ Impossible de récupérer les documents :",
        documentsResult.reason
      );
    }

    /* ------------------------------------------------------
       PROGRESSION QUIZ
    ------------------------------------------------------ */

    if (quizResult.status === "fulfilled") {
      setQuizProgress(quizResult.value as QuizProgress);
    } else {
      /*
       * Un utilisateur peut ne pas encore avoir de
       * QuizProgress. Ce n'est donc pas forcément une
       * erreur bloquante pour toute la page.
       */
      console.warn(
        "⚠️ Progression quiz indisponible :",
        quizResult.reason
      );

      setQuizProgress(null);
    }

    setStats({
      notifications: notificationsCount,
      upcomingEvents: upcomingEventsCount,
      documents: documentsCount,
    });

    /*
     * Si au moins une requête principale a échoué,
     * on garde la page fonctionnelle mais on indique
     * qu'une partie des statistiques n'a pas pu être chargée.
     */
    const hasStatsError =
      notificationsResult.status === "rejected" ||
      eventsResult.status === "rejected" ||
      documentsResult.status === "rejected";

    setStatsError(hasStatsError);
  } catch (error) {
    console.error(
      "❌ Erreur lors du chargement du profil :",
      error
    );

    if (mounted) {
      setStatsError(true);
    }
  } finally {
    if (mounted) {
      setLoadingUser(false);
      setLoadingStats(false);
    }
  }
}

loadProfile();

return () => {
  mounted = false;
};

}, []);

/* ==========================================================
DONNÉES VISUELLES
========================================================== */

const initial = useMemo(
() => getInitial(username),
[username]
);

const quizAccuracy = quizProgress
? Number(quizProgress.accuracy || 0)
: 0;

const quizXp = quizProgress?.xp ?? 0;
const quizLevel = quizProgress?.level ?? 1;
const completedQuizzes =
quizProgress?.completed_quizzes ?? 0;
const currentStreak =
quizProgress?.current_streak ?? 0;
const bestStreak =
quizProgress?.best_streak ?? 0;

return ( <main className="min-h-screen bg-slate-50 pb-28">
{/* ======================================================
HEADER
====================================================== */}

  <header className="relative overflow-hidden border-b bg-white">
    <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-100/60 blur-3xl" />
    <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-teal-100/40 blur-3xl" />

    <div className="relative mx-auto max-w-5xl px-5 pb-7 pt-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Mon espace
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Profil
          </h1>
        </div>

        <Link
          href="/settings"
          aria-label="Paramètres"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl transition hover:bg-slate-200 active:scale-95"
        >
          ⚙️
        </Link>
      </div>
    </div>
  </header>

  <div className="mx-auto max-w-5xl px-4 py-6 sm:px-5">
    {/* ====================================================
        PROFIL UTILISATEUR
    ==================================================== */}

    <section className="relative overflow-hidden rounded-4xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-50" />

      <div className="relative flex items-center gap-4 sm:gap-5">
        {/* Avatar */}

        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-3xl font-bold text-white shadow-lg shadow-emerald-200 sm:h-24 sm:w-24 sm:text-4xl">
          {loadingUser ? (
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            initial
          )}
        </div>

        {/* User info */}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-emerald-600">
            Bienvenue 👋
          </p>

          <h2 className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">
            {loadingUser ? "Chargement..." : username}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Bahá'í Companion
          </p>

          {!loadingUser && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Niveau {quizLevel}
              </span>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                ⭐ {quizXp} XP
              </span>
            </div>
          )}
        </div>

        <Link
          href="/settings"
          className="hidden rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:block"
        >
          Modifier
        </Link>
      </div>
    </section>

    {/* ====================================================
        STATISTIQUES PRINCIPALES
    ==================================================== */}

    <section className="mt-6">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
          Mon activité
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Vue d'ensemble
        </h2>
      </div>

      {statsError && !loadingStats && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Certaines statistiques n'ont pas pu être chargées.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Notifications */}

        <Link
          href="/notifications"
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl">
            🔔
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {loadingStats ? (
              <span className="inline-block h-7 w-10 animate-pulse rounded-md bg-slate-200" />
            ) : (
              stats.notifications
            )}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Notifications
          </p>
        </Link>

        {/* Événements */}

        <Link
          href="/calendar"
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
            📅
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {loadingStats ? (
              <span className="inline-block h-7 w-10 animate-pulse rounded-md bg-slate-200" />
            ) : (
              stats.upcomingEvents
            )}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Événements à venir
          </p>
        </Link>

        {/* Documents */}

        <Link
          href="/documents"
          className="col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-1"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-xl">
            📄
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {loadingStats ? (
              <span className="inline-block h-7 w-10 animate-pulse rounded-md bg-slate-200" />
            ) : (
              stats.documents
            )}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Documents importés
          </p>
        </Link>
      </div>
    </section>

    {/* ====================================================
        STATISTIQUES QUIZ
    ==================================================== */}

    <section className="mt-8">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
          Progression
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Mon parcours quiz
        </h2>
      </div>

      <div className="overflow-hidden rounded-4xl bg-white shadow-sm ring-1 ring-slate-200">
        {/* Top */}

        <div className="bg-linear-to-r from-indigo-600 to-violet-600 p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-indigo-100">
                Niveau actuel
              </p>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {quizLevel}
                </span>

                <span className="text-sm text-indigo-100">
                  niveau
                </span>
              </div>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl">
              🧠
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
            <span className="text-sm text-indigo-100">
              XP accumulé
            </span>

            <span className="font-bold">
              {quizXp} XP
            </span>
          </div>
        </div>

        {/* Quiz metrics */}

        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">
          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {completedQuizzes}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Quiz terminés
            </p>
          </div>

          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {quizAccuracy}%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Précision
            </p>
          </div>

          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {currentStreak}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Série actuelle
            </p>
          </div>

          <div className="p-5 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {bestStreak}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Meilleure série
            </p>
          </div>
        </div>

        {/* Link */}

        <div className="border-t border-slate-100 p-4">
          <Link
            href="/quiz"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Continuer mon parcours
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>

    {/* ====================================================
        ACCÈS RAPIDES
    ==================================================== */}

    <section className="mt-8">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Mon espace
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Accès rapides
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Notifications */}

        <Link
          href="/notifications"
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-2xl">
              🔔
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">
                Notifications
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Consulter vos rappels et notifications.
              </p>
            </div>

            <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500">
              →
            </span>
          </div>
        </Link>

        {/* Calendrier */}

        <Link
          href="/calendar"
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
              📅
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">
                Calendrier
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Voir vos événements et activités.
              </p>
            </div>

            <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500">
              →
            </span>
          </div>
        </Link>

        {/* Documents */}

        <Link
          href="/documents"
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-2xl">
              📄
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">
                Documents
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Gérer vos documents importés.
              </p>
            </div>

            <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500">
              →
            </span>
          </div>
        </Link>

        {/* Quiz */}

        <Link
          href="/quiz"
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
              🧠
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">
                Quiz
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Tester vos connaissances et gagner de l'XP.
              </p>
            </div>

            <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500">
              →
            </span>
          </div>
        </Link>

        {/* Paramètres */}

        <Link
          href="/settings"
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-2"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
              ⚙️
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">
                Paramètres
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Notifications, compte et préférences.
              </p>
            </div>

            <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500">
              →
            </span>
          </div>
        </Link>
      </div>
    </section>

    {/* ====================================================
        INFORMATIONS SUPPLÉMENTAIRES
    ==================================================== */}

    <section className="mt-8 rounded-4xl bg-linear-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg shadow-emerald-100">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
          🌿
        </div>

        <div>
          <p className="text-sm font-medium text-emerald-100">
            Bahá'í Companion
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Votre compagnon spirituel
          </h2>

          <p className="mt-2 text-sm leading-6 text-emerald-50">
            Retrouvez vos écrits, prières, événements,
            rappels, quiz et calendrier bahá'í au même
            endroit.
          </p>
        </div>
      </div>
    </section>

    {/* ====================================================
        FOOTER DISCRET
    ==================================================== */}

    <p className="mt-8 text-center text-xs text-slate-400">
      Vos statistiques sont basées sur votre activité
      enregistrée dans Bahá'í Companion.
    </p>
  </div>

  <BottomNavigation />
</main>


);
}
