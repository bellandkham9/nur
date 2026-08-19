"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import { apiFetch } from "@/lib/api";

import ActivityCard, {
  Activity,
} from "@/components/activities/ActivityCard";

import ActivitySearch from "@/components/activities/ActivitySearch";

import ActivityTabs, {
  ActivityTab,
} from "@/components/activities/ActivityTabs";
import CreateActivityModal from "@/components/activities/CreateActivityModal";



export default function ActivitiesPage() {

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<ActivityTab>("all");

  const [showCreateModal, setShowCreateModal] =
    useState(false);


  async function loadActivities() {

    try {

      setLoading(true);
      setError(null);

      const data =
        await apiFetch("/api/activities/");

      const normalized: Activity[] =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

      setActivities(normalized);

    } catch (err) {

      console.error(
        "❌ Erreur activités :",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les activités.",
      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {
    loadActivities();
  }, []);

    const filteredActivities = useMemo(() => {
        let result = [...activities];

        const query = search.trim().toLowerCase();

        // =====================================================
        // RECHERCHE
        // =====================================================

        if (query) {
            result = result.filter((activity) => {
                const title =
                    activity.title?.toLowerCase() ?? "";

                const description =
                    activity.description?.toLowerCase() ?? "";

                const communityName = (() => {
                  const c = activity.community as any;
                  if (c && typeof c === "object" && c.name) {
                    return String(c.name).toLowerCase();
                  }
                  return "";
                })();

                const activityTypeName = (() => {
                  const at = activity.activity_type as any;
                  if (at && typeof at === "object" && at.name) {
                    return String(at.name).toLowerCase();
                  }
                  return "";
                })();

                return (
                    title.includes(query) ||
                    description.includes(query) ||
                    communityName.includes(query) ||
                    activityTypeName.includes(query)
                );
            });
        }

        // =====================================================
        // À VENIR
        // =====================================================

        if (activeTab === "upcoming") {
            const now = new Date();

            result = result.filter((activity) => {
                if (!activity.start_datetime) {
                    return false;
                }

                const startDate = new Date(
                    activity.start_datetime
                );

                if (Number.isNaN(startDate.getTime())) {
                    console.warn(
                        "⚠️ Date invalide :",
                        activity.start_datetime,
                        activity
                    );

                    return false;
                }

                return startDate >= now;
            });
        }

        // =====================================================
        // MES ACTIVITÉS
        // =====================================================

        if (activeTab === "mine") {
            result = result.filter((activity) => {
                const isOrganizer =
                    activity.organizer != null;

                const isParticipant =
                    Boolean(
                        activity.my_participation_status
                    );

                return (
                    isOrganizer ||
                    isParticipant
                );
            });
        }

        return result;

    }, [
        activities,
        search,
        activeTab,
    ]);
  function handleActivityCreated() {

    setShowCreateModal(false);

    loadActivities();

  }


  return (
    <main className="min-h-screen bg-slate-50 pb-24">

      {/* HEADER */}

      <header className="border-b bg-white px-5 pb-5 pt-7">

        <div className="mx-auto max-w-6xl">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-sm text-slate-500">
                Vie communautaire
              </p>

              <h1 className="text-2xl font-bold text-slate-900">
                Activités
              </h1>

            </div>

            <Link
              href="/"
              className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Accueil
            </Link>

          </div>

        </div>

      </header>


      <div className="mx-auto max-w-6xl px-4 py-6">


        {/* INTRO */}

        <section className="mb-6 rounded-3xl bg-emerald-600 p-6 text-white shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div>

              <div className="mb-3 text-3xl">
                📅
              </div>

              <h2 className="text-xl font-bold">
                Activités communautaires
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
                Découvrez les réunions, dévotions,
                cercles d'étude, fêtes et autres
                activités de vos communautés.
              </p>

            </div>


            <button
              type="button"
              onClick={() =>
                setShowCreateModal(true)
              }
              className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
            >
              + Créer
            </button>

          </div>

        </section>


        {/* TABS */}

        <ActivityTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />


        {/* SEARCH */}

        <div className="mt-4">

          <ActivitySearch
            value={search}
            onChange={setSearch}
          />

        </div>


        {/* COUNT */}

        {!loading && !error && (

          <div className="mt-5">

            <p className="text-sm text-slate-500">

              {filteredActivities.length} activité
              {filteredActivities.length > 1
                ? "s"
                : ""}

            </p>

          </div>

        )}


        {/* LOADING */}

        {loading && (

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="animate-pulse rounded-3xl bg-white p-5 shadow-sm"
                >

                  <div className="h-14 w-14 rounded-2xl bg-slate-200" />

                  <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />

                  <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />

                  <div className="mt-5 h-10 rounded-xl bg-slate-100" />

                </div>

              ),
            )}

          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">

            <div className="text-3xl">
              ⚠️
            </div>

            <h2 className="mt-3 font-bold text-red-800">
              Impossible de charger les activités
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadActivities}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Réessayer
            </button>

          </div>

        )}


        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredActivities.length === 0 && (

            <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm">

              <div className="text-5xl">
                📅
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Aucune activité trouvée
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">

                {search
                  ? "Aucune activité ne correspond à votre recherche."
                  : activeTab === "mine"
                    ? "Vous ne participez encore à aucune activité."
                    : "Aucune activité n'est disponible pour le moment."}

              </p>

            </div>

          )}


        {/* LIST */}

        {!loading &&
          !error &&
          filteredActivities.length > 0 && (

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {filteredActivities.map(
                (activity) => (

                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                  />

                ),
              )}

            </section>

          )}

      </div>


      {/* CREATE */}

      {showCreateModal && (

        <CreateActivityModal
          open={showCreateModal}
          onClose={() =>
            setShowCreateModal(false)
          }
          onCreated={handleActivityCreated}
        />

      )}


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