"use client";

import { useEffect, useState } from "react";

import {
  getAnalyticsStats,
  type AnalyticsStats,
} from "@/lib/analytics";

import AnalyticsCard from "@/components/analytics/AnalyticsCard";
import AnalyticsChart from "@/components/analytics/AnalyticsChart";
import AnalyticsEventTable from "@/components/analytics/AnalyticsEventTable";
import AnalyticsPagesTable from "@/components/analytics/AnalyticsPagesTable";


// ============================================================
// PÉRIODE
// ============================================================

const PERIODS = [
  {
    value: 7,
    label: "7 jours",
  },
  {
    value: 14,
    label: "14 jours",
  },
  {
    value: 30,
    label: "30 jours",
  },
  {
    value: 90,
    label: "90 jours",
  },
];


// ============================================================
// PAGE ANALYTICS
// ============================================================

export default function AnalyticsPage() {

  const [stats, setStats] =
    useState<AnalyticsStats | null>(null);

  const [days, setDays] =
    useState<number>(7);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);


  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  async function loadAnalytics() {

    try {

      setLoading(true);
      setError(null);

      const data =
        await getAnalyticsStats(days);

      setStats(data);

    } catch (error: any) {

      console.error(
        "❌ Impossible de charger Analytics :",
        error
      );

      if (
        error?.message?.includes("403")
      ) {

        setError(
          "Accès refusé. Cette page est réservée aux administrateurs."
        );

      } else if (
        error?.message?.includes("401")
      ) {

        setError(
          "Votre session a expiré. Veuillez vous reconnecter."
        );

      } else {

        setError(
          "Impossible de charger les statistiques."
        );
      }

    } finally {

      setLoading(false);

    }
  }


  // ==========================================================
  // CHARGEMENT INITIAL + CHANGEMENT PÉRIODE
  // ==========================================================

  useEffect(() => {

    loadAnalytics();

  }, [days]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading && !stats) {

    return (
      <main className="min-h-screen p-6">

        <div className="mx-auto max-w-7xl">

          <h1 className="text-3xl font-bold">
            📈 Analytics
          </h1>

          <p className="mt-2 text-gray-500">
            Chargement des statistiques...
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {Array.from({ length: 8 }).map(
              (_, index) => (

                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-gray-100"
                />

              )
            )}

          </div>

        </div>

      </main>
    );
  }


  // ==========================================================
  // ERREUR
  // ==========================================================

  if (error && !stats) {

    return (
      <main className="min-h-screen p-6">

        <div className="mx-auto max-w-7xl">

          <h1 className="text-3xl font-bold">
            📈 Analytics
          </h1>

          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">

            <p className="font-medium text-red-700">
              {error}
            </p>

            <button
              onClick={loadAnalytics}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-white"
            >
              Réessayer
            </button>

          </div>

        </div>

      </main>
    );
  }


  if (!stats) {
    return null;
  }


  const summary =
    stats.summary;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <main className="min-h-screen p-6">

      <div className="mx-auto max-w-7xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              📈 Analytics
            </h1>

            <p className="mt-1 text-gray-500">
              Vue d'ensemble de l'utilisation de Bahá'í Companion.
            </p>

          </div>


          {/* PÉRIODE */}

          <select
            value={days}
            onChange={(event) =>
              setDays(
                Number(event.target.value)
              )
            }
            className="rounded-xl border px-4 py-2"
          >

            {PERIODS.map((period) => (

              <option
                key={period.value}
                value={period.value}
              >
                {period.label}
              </option>

            ))}

          </select>

        </div>


        {/* ====================================================
            PÉRIODE ACTIVE
        ==================================================== */}

        <div className="mt-4 text-sm text-gray-500">

          Du{" "}
          <strong>
            {stats.period.start}
          </strong>{" "}
          au{" "}
          <strong>
            {stats.period.end}
          </strong>

        </div>


        {/* ====================================================
            CARTES PRINCIPALES
        ==================================================== */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <AnalyticsCard
            title="Événements"
            value={summary.total_events}
            icon="📊"
          />

          <AnalyticsCard
            title="Utilisateurs actifs"
            value={summary.active_users}
            icon="👥"
          />

          <AnalyticsCard
            title="Ouvertures"
            value={summary.app_opens}
            icon="🚀"
          />

          <AnalyticsCard
            title="Vues de pages"
            value={summary.page_views}
            icon="👁️"
          />

          <AnalyticsCard
            title="Quiz commencés"
            value={summary.quiz_starts}
            icon="🎯"
          />

          <AnalyticsCard
            title="Quiz terminés"
            value={summary.quiz_completes}
            icon="🏆"
          />

          <AnalyticsCard
            title="Citations consultées"
            value={summary.quotes_views}
            icon="📖"
          />

          <AnalyticsCard
            title="Notifications ouvertes"
            value={summary.notifications_opened}
            icon="🔔"
          />

        </section>


        {/* ====================================================
            INSTALLATIONS PWA
        ==================================================== */}

        <section className="mt-6">

          <AnalyticsCard
            title="Installations PWA"
            value={summary.pwa_installs}
            icon="📱"
          />

        </section>


        {/* ====================================================
            GRAPHIQUE
        ==================================================== */}

        <section className="mt-8">

          <AnalyticsChart
            daily={stats.daily}
          />

        </section>


        {/* ====================================================
            TABLEAUX
        ==================================================== */}

        <section className="mt-8 grid gap-8 lg:grid-cols-2">

          <AnalyticsEventTable
            events={stats.event_types}
          />

          <AnalyticsPagesTable
            pages={stats.popular_pages}
          />

        </section>

      </div>

    </main>
  );
}