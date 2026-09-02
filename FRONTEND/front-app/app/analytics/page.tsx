"use client";

import { useEffect, useState } from "react";

import { getAnalyticsStats, type AnalyticsStats } from "@/lib/analytics";

import AnalyticsCard from "@/components/analytics/AnalyticsCard";
import AnalyticsChart from "@/components/analytics/AnalyticsChart";
import AnalyticsEventTable from "@/components/analytics/AnalyticsEventTable";
import AnalyticsPagesTable from "@/components/analytics/AnalyticsPagesTable";
import Link from "next/link";

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
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  const [days, setDays] = useState<number>(7);

  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const data = await getAnalyticsStats(days);

      setStats(data);
    } catch (error: any) {
      console.error("❌ Impossible de charger Analytics :", error);

      if (error?.message?.includes("403")) {
        setError("Accès refusé. Cette page est réservée aux administrateurs.");
      } else if (error?.message?.includes("401")) {
        setError("Votre session a expiré. Veuillez vous reconnecter.");
      } else {
        setError("Impossible de charger les statistiques.");
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
      <main className="min-h-screen bg-slate-50 px-4 pb-24 pt-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {/* HEADER SKELETON */}
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-3 h-9 w-56 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-200" />
          </div>

          {/* CARDS SKELETON */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-100"
              />
            ))}
          </div>

          {/* CHART SKELETON */}
          <div className="mt-6 h-80 animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-100" />
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERREUR
  // ==========================================================

  if (error && !stats) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pb-24 pt-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Analytics
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Vue d'ensemble de l'utilisation de Bahá'í Companion.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
            <div className="border-b border-red-100 bg-red-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-xl">
                  ⚠️
                </div>

                <div>
                  <h2 className="font-semibold text-red-900">
                    Impossible de charger les statistiques
                  </h2>

                  <p className="mt-1 text-sm text-red-700">
                    Une erreur est survenue lors de la récupération des données.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <p className="text-sm leading-6 text-slate-600">{error}</p>

              <button
                onClick={loadAnalytics}
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!stats) {
    return null;
  }

  const summary = stats.summary;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="rounded-4xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  📊
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Administration
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Analytics
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
                Vue d'ensemble de l'utilisation de Bahá'í Companion, de
                l'engagement des utilisateurs et des fonctionnalités les plus
                consultées.
              </p>
            </div>

            <Link
              href="/"
              className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
            >
              <span>⌂</span>
              <span className="hidden sm:inline">Accueil</span>
            </Link>
            {/* PÉRIODE */}

            <div className="shrink-0">
              <label
                htmlFor="analytics-period"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
              >
                Période
              </label>

              <div className="relative">
                <select
                  id="analytics-period"
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:w-40"
                >
                  {PERIODS.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ▾
                </span>
              </div>
            </div>
          </div>

          {/* PÉRIODE ACTIVE */}

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            <span className="flex h-8 items-center rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
              ● Période active
            </span>

            <span className="text-sm text-slate-500">
              Du{" "}
              <strong className="font-semibold text-slate-700">
                {stats.period.start}
              </strong>{" "}
              au{" "}
              <strong className="font-semibold text-slate-700">
                {stats.period.end}
              </strong>
            </span>

            {loading && (
              <span className="ml-auto text-xs font-medium text-emerald-600">
                Actualisation...
              </span>
            )}
          </div>
        </header>

        {/* ====================================================
            KPI PRINCIPAUX
        ==================================================== */}

        <section className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Vue générale
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Activité de l'application
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </section>

        {/* ====================================================
            ENGAGEMENT
        ==================================================== */}

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Engagement
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Fonctionnalités utilisées
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </section>

        {/* ====================================================
            PWA
        ==================================================== */}

        <section className="mt-8">
          <div className="rounded-3xl bg-linear-to-br from-emerald-600 to-emerald-700 p-5 text-white shadow-lg shadow-emerald-600/10 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                  📱
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-100">
                    Progressive Web App
                  </p>

                  <h2 className="mt-1 text-lg font-bold">Installations PWA</h2>

                  <p className="mt-1 text-sm text-emerald-100">
                    Nombre d'installations sur la période sélectionnée.
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-4xl font-bold tracking-tight">
                  {summary.pwa_installs}
                </p>

                <p className="mt-1 text-xs font-medium text-emerald-100">
                  installation{summary.pwa_installs !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            ÉVOLUTION
        ==================================================== */}

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Évolution
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Activité quotidienne
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Évolution des principales interactions avec l'application.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
            <div className="p-3 sm:p-5">
              <AnalyticsChart daily={stats.daily} />
            </div>
          </div>
        </section>

        {/* ====================================================
            TABLEAUX
        ==================================================== */}

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Analyse détaillée
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Utilisation par catégorie
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* =====================================================
      TYPES D'ÉVÉNEMENTS
  ===================================================== */}

            <div className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                    📊
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">
                      Types d'événements
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Répartition des interactions
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 overflow-x-auto p-3 sm:p-5">
                <div className="min-w-[320px]">
                  <AnalyticsEventTable events={stats.event_types} />
                </div>
              </div>
            </div>

            {/* =====================================================
      PAGES POPULAIRES
  ===================================================== */}

            <div className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
                    👁️
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">
                      Pages populaires
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Pages les plus consultées
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 overflow-x-auto p-3 sm:p-5">
                <div className="min-w-[320px]">
                  <AnalyticsPagesTable pages={stats.popular_pages} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            FOOTER INFO
        ==================================================== */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm">
          <p className="text-xs leading-5 text-slate-400">
            Les statistiques sont calculées à partir des interactions
            enregistrées dans Bahá'í Companion.
          </p>
        </div>
      </div>
    </main>
  );
}
