
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";

import CommunityCard from "@/components/communities/CommunityCard";
import CommunitySearch from "@/components/communities/CommunitySearch";
import CommunityTabs from "@/components/communities/CommunityTabs";
import CreateCommunityModal from "@/components/communities/CreateCommunityModal";

/* =========================================================
   TYPES
========================================================= */

export type Community = {
  id: number;
  name: string;
  description?: string | null;
  country: string;
  city: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Tab = "all" | "mine";

/* =========================================================
   PAGE
========================================================= */

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const [showCreateModal, setShowCreateModal] = useState(false);

  /* =======================================================
     CHARGEMENT
  ======================================================= */

  async function loadCommunities(tab: Tab = activeTab) {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        tab === "mine"
          ? "/api/communities/my/"
          : "/api/communities/";

      const data = await apiFetch(endpoint);

      const normalized: Community[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.communities)
            ? data.communities
            : [];

      setCommunities(normalized);
    } catch (err) {
      console.error("❌ Erreur communautés :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les communautés.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommunities("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     CHANGEMENT D'ONGLET
  ======================================================= */

  async function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSearch("");

    await loadCommunities(tab);
  }

  /* =======================================================
     RECHERCHE
  ======================================================= */

  const filteredCommunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return communities;
    }

    return communities.filter((community) => {
      return (
        community.name?.toLowerCase().includes(query) ||
        community.city?.toLowerCase().includes(query) ||
        community.country?.toLowerCase().includes(query) ||
        community.description?.toLowerCase().includes(query)
      );
    });
  }, [communities, search]);

  /* =======================================================
     CRÉATION
  ======================================================= */

  function handleCommunityCreated(community?: Community) {
    if (community) {
      setCommunities((previous) => [
        community,
        ...previous,
      ]);
    }

    setShowCreateModal(false);
  }

  /* =======================================================
     RENDU
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-50 pb-24">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b bg-white px-5 pb-5 pt-7">
        <div className="mx-auto max-w-6xl">

          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-sm text-slate-500">
                Vie communautaire
              </p>

              <h1 className="text-2xl font-bold text-slate-900">
                Communautés
              </h1>
            </div>

            <Link
              href="/"
              className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Accueil
            </Link>

          </div>

        </div>
      </header>

      {/* =================================================
          CONTENU
      ================================================= */}

      <div className="mx-auto max-w-6xl px-4 py-6">

        {/* =================================================
            INTRODUCTION
        ================================================= */}

        <section className="mb-6 rounded-3xl bg-emerald-600 p-6 text-white shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div>

              <div className="mb-3 text-3xl">
                🌿
              </div>

              <h2 className="text-xl font-bold">
                Votre vie communautaire
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
                Découvrez les communautés bahá'íes,
                rejoignez celles qui vous correspondent
                et restez connecté avec leurs membres.
              </p>

            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              + Créer
            </button>

          </div>

        </section>

        {/* =================================================
            ONGLETS
        ================================================= */}

        <CommunityTabs
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        {/* =================================================
            RECHERCHE
        ================================================= */}

        <div className="mt-4">

          <CommunitySearch
            value={search}
            onChange={setSearch}
          />

        </div>

        {/* =================================================
            STATISTIQUES
        ================================================= */}

        {!loading && !error && (
          <div className="mt-5 flex items-center justify-between">

            <p className="text-sm text-slate-500">
              {filteredCommunities.length} communauté
              {filteredCommunities.length > 1 ? "s" : ""}
            </p>

            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Effacer la recherche
              </button>
            )}

          </div>
        )}

        {/* =================================================
            CHARGEMENT
        ================================================= */}

        {loading && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              >

                <div className="h-12 w-12 rounded-2xl bg-slate-200" />

                <div className="mt-4 h-5 w-3/4 rounded bg-slate-200" />

                <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />

                <div className="mt-5 h-10 w-full rounded-xl bg-slate-100" />

              </div>
            ))}

          </div>
        )}

        {/* =================================================
            ERREUR
        ================================================= */}

        {!loading && error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">

            <div className="text-3xl">
              ⚠️
            </div>

            <h2 className="mt-3 font-bold text-red-800">
              Impossible de charger les communautés
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              onClick={() => loadCommunities(activeTab)}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Réessayer
            </button>

          </div>
        )}

        {/* =================================================
            AUCUNE COMMUNAUTÉ
        ================================================= */}

        {!loading &&
          !error &&
          filteredCommunities.length === 0 && (
            <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">

              <div className="text-5xl">
                🌱
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Aucune communauté trouvée
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                  ? "Aucune communauté ne correspond à votre recherche."
                  : activeTab === "mine"
                    ? "Vous ne faites encore partie d'aucune communauté."
                    : "Aucune communauté n'est disponible pour le moment."}
              </p>

              {activeTab === "mine" && (
                <button
                  onClick={() => handleTabChange("all")}
                  className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Découvrir les communautés
                </button>
              )}

            </div>
          )}

        {/* =================================================
            LISTE
        ================================================= */}

        {!loading &&
          !error &&
          filteredCommunities.length > 0 && (
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {filteredCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                />
              ))}

            </section>
          )}

      </div>

      {/* =================================================
          MODAL CRÉATION
      ================================================= */}

      {showCreateModal && (
        <CreateCommunityModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleCommunityCreated}
        />
        )}

      {/* =================================================
          NAVIGATION PWA
      ================================================= */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur">

        <div className="mx-auto flex max-w-2xl items-center justify-around">

          <Link
            href="/"
            className="flex flex-col items-center px-3 py-2 text-slate-500 transition hover:text-slate-900"
          >
            <span className="text-xl">🏠</span>
            <span className="mt-1 text-[11px]">
              Accueil
            </span>
          </Link>

          <Link
            href="/calendar"
            className="flex flex-col items-center px-3 py-2 text-slate-500 transition hover:text-slate-900"
          >
            <span className="text-xl">📅</span>
            <span className="mt-1 text-[11px]">
              Calendrier
            </span>
          </Link>

          <Link
            href="/communities"
            className="flex flex-col items-center px-3 py-2 text-emerald-600"
          >
            <span className="text-xl">👥</span>
            <span className="mt-1 text-[11px] font-semibold">
              Communautés
            </span>
          </Link>

          <Link
            href="/notifications"
            className="flex flex-col items-center px-3 py-2 text-slate-500 transition hover:text-slate-900"
          >
            <span className="text-xl">🔔</span>
            <span className="mt-1 text-[11px]">
              Notifications
            </span>
          </Link>

          <Link
            href="/profile"
            className="flex flex-col items-center px-3 py-2 text-slate-500 transition hover:text-slate-900"
          >
            <span className="text-xl">👤</span>
            <span className="mt-1 text-[11px]">
              Profil
            </span>
          </Link>

        </div>

      </nav>

    </main>
  );
}

