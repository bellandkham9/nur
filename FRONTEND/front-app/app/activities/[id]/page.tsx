"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";

import ActivityTypeBadge from "@/components/activities/ActivityTypeBadge";

type Activity = {
  id: number;
  title: string;
  description?: string | null;

  activity_type: number;
  activity_type_name?: string | null;
  activity_type_code?: string | null;
  activity_type_icon?: string | null;

  community: number;
  community_name?: string | null;

  start_datetime: string;
  end_datetime?: string | null;

  location_name?: string | null;
  address?: string | null;

  organizer?: number;
  organizer_username?: string | null;

  status?: string;

  is_online?: boolean;
  meeting_url?: string | null;

  max_participants?: number | null;
  participants_count?: number;

  my_participation_status?: string | null;
};

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;

  const [activity, setActivity] =
    useState<Activity | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  // =====================================================
  // CHARGER L'ACTIVITÉ
  // =====================================================

  async function loadActivity() {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch(
        `/api/activities/${id}/`
      );

      setActivity(data);

    } catch (err) {
      console.error(
        "❌ Erreur chargement activité :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger cette activité."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, [id]);

  // =====================================================
  // SUPPRIMER
  // =====================================================

  async function handleDelete() {
    if (!activity) return;

    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer l'activité « ${activity.title} » ?\n\nCette action supprimera également ses notifications.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await apiFetch(
        `/api/activities/${activity.id}/`,
        {
          method: "DELETE",
        }
      );

      alert("Activité supprimée avec succès.");

      router.push("/activities");

    } catch (err) {
      console.error(
        "❌ Erreur suppression activité :",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer l'activité."
      );

    } finally {
      setDeleting(false);
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">

        <div className="mx-auto max-w-3xl">

          <div className="animate-pulse rounded-3xl bg-white p-6 shadow-sm">

            <div className="h-6 w-1/3 rounded bg-slate-200" />

            <div className="mt-5 h-10 w-3/4 rounded bg-slate-200" />

            <div className="mt-4 h-20 rounded bg-slate-100" />

            <div className="mt-6 h-12 rounded bg-slate-100" />

          </div>

        </div>

      </main>
    );
  }

  // =====================================================
  // ERREUR
  // =====================================================

  if (error || !activity) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">

        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

            <div className="text-4xl">
              ⚠️
            </div>

            <h1 className="mt-4 text-xl font-bold text-red-800">
              Activité introuvable
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error ??
                "Cette activité n'existe pas ou n'est plus disponible."}
            </p>

            <Link
              href="/activities"
              className="mt-5 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              ← Retour aux activités
            </Link>

          </div>

        </div>

      </main>
    );
  }

  // =====================================================
  // DATES
  // =====================================================

  const startDate = new Date(
    activity.start_datetime
  );

  const startDateLabel =
    startDate.toLocaleDateString(
      "fr-FR",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  const startTimeLabel =
    startDate.toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  let endDateLabel = null;

  if (activity.end_datetime) {
    const endDate = new Date(
      activity.end_datetime
    );

    endDateLabel =
      endDate.toLocaleTimeString(
        "fr-FR",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
  }

  // =====================================================
  // AFFICHAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-50 pb-24">

      {/* HEADER */}

      <header className="border-b bg-white px-5 py-5">

        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">

          <Link
            href="/activities"
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            ← Activités
          </Link>

          <span className="text-sm text-slate-500">
            Détails
          </span>

        </div>

      </header>

      {/* CONTENU */}

      <div className="mx-auto max-w-3xl px-4 py-6">

        {/* CARTE PRINCIPALE */}

        <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

          {/* HERO */}

          <div className="bg-emerald-600 p-6 text-white">

            <ActivityTypeBadge
              name={activity.activity_type_name}
              icon={activity.activity_type_icon}
              code={activity.activity_type_code}
            />

            <h1 className="mt-4 text-3xl font-bold">
              {activity.title}
            </h1>

            {activity.status && (
              <span className="mt-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                {activity.status}
              </span>
            )}

          </div>

          {/* INFORMATIONS */}

          <div className="space-y-6 p-6">

            {/* DESCRIPTION */}

            {activity.description && (
              <section>

                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Description
                </h2>

                <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">
                  {activity.description}
                </p>

              </section>
            )}

            {/* DATE */}

            <section className="rounded-2xl bg-slate-50 p-4">

              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Date et heure
              </h2>

              <p className="mt-2 font-semibold text-slate-900">
                📅{" "}
                {startDateLabel}
              </p>

              <p className="mt-1 text-slate-600">
                🕐 {startTimeLabel}
                {endDateLabel &&
                  ` → ${endDateLabel}`}
              </p>

            </section>

            {/* COMMUNAUTÉ */}

            {activity.community_name && (
              <section>

                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Communauté
                </h2>

                <p className="mt-2 text-slate-800">
                  🌿 {activity.community_name}
                </p>

              </section>
            )}

            {/* LIEU */}

            <section>

              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Lieu
              </h2>

              {activity.is_online ? (

                <div className="mt-2">

                  <p className="text-slate-800">
                    💻 Activité en ligne
                  </p>

                  {activity.meeting_url && (
                    <a
                      href={activity.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Rejoindre en ligne →
                    </a>
                  )}

                </div>

              ) : (

                <div className="mt-2">

                  {activity.location_name && (
                    <p className="font-medium text-slate-800">
                      📍 {activity.location_name}
                    </p>
                  )}

                  {activity.address && (
                    <p className="mt-1 text-sm text-slate-500">
                      {activity.address}
                    </p>
                  )}

                  {!activity.location_name &&
                    !activity.address && (
                      <p className="text-slate-500">
                        Lieu non précisé.
                      </p>
                    )}

                </div>
              )}

            </section>

            {/* ORGANISATEUR */}

            {activity.organizer_username && (
              <section>

                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Organisateur
                </h2>

                <p className="mt-2 text-slate-800">
                  👤 {activity.organizer_username}
                </p>

              </section>
            )}

            {/* PARTICIPANTS */}

            <section className="rounded-2xl bg-emerald-50 p-4">

              <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                Participants
              </h2>

              <p className="mt-2 text-lg font-bold text-slate-900">

                👥{" "}
                {activity.participants_count ?? 0}

                {activity.max_participants
                  ? ` / ${activity.max_participants}`
                  : ""}

              </p>

            </section>

            {/* PARTICIPATION */}

            {activity.my_participation_status && (
              <section>

                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Ma participation
                </h2>

                <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  ✓{" "}
                  {activity.my_participation_status}
                </span>

              </section>
            )}

          </div>

        </article>

        {/* ACTIONS */}

        <div className="mt-5 space-y-3">

          {/* RETOUR */}

          <Link
            href="/activities"
            className="flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            ← Retour aux activités
          </Link>

          {/* SUPPRESSION */}

          {activity.organizer && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex w-full items-center justify-center rounded-2xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting
                ? "Suppression..."
                : "🗑️ Supprimer cette activité"}
            </button>
          )}

        </div>

      </div>

      {/* NAVIGATION */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur">

        <div className="mx-auto flex max-w-2xl items-center justify-around">

          <Link
            href="/"
            className="flex flex-col items-center px-3 py-2 text-slate-500 hover:text-slate-900"
          >
            <span className="text-xl">
              🏠
            </span>

            <span className="mt-1 text-[11px]">
              Accueil
            </span>
          </Link>

          <Link
            href="/calendar"
            className="flex flex-col items-center px-3 py-2 text-slate-500 hover:text-slate-900"
          >
            <span className="text-xl">
              📅
            </span>

            <span className="mt-1 text-[11px]">
              Calendrier
            </span>
          </Link>

          <Link
            href="/communities"
            className="flex flex-col items-center px-3 py-2 text-slate-500 hover:text-slate-900"
          >
            <span className="text-xl">
              👥
            </span>

            <span className="mt-1 text-[11px]">
              Communautés
            </span>
          </Link>

          <Link
            href="/activities"
            className="flex flex-col items-center px-3 py-2 text-emerald-600"
          >
            <span className="text-xl">
              📅
            </span>

            <span className="mt-1 text-[11px] font-semibold">
              Activités
            </span>
          </Link>

          <Link
            href="/notifications"
            className="flex flex-col items-center px-3 py-2 text-slate-500 hover:text-slate-900"
          >
            <span className="text-xl">
              🔔
            </span>

            <span className="mt-1 text-[11px]">
              Notifications
            </span>
          </Link>

        </div>

      </nav>

    </main>
  );
}