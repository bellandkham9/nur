"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";

type Community = {
id: number;
name: string;
description?: string | null;
country: string;
city: string;
address?: string | null;
latitude?: number | string | null;
longitude?: number | string | null;
timezone?: string | null;
created_at?: string;
updated_at?: string;
};

type CommunityMember = {
id: number;
user: number;
username: string;
user_email?: string;
community: number;
community_name: string;
role: number;
role_name: string;
start_date: string;
end_date?: string | null;
created_at?: string;
};

type Membership = {
id: number;
user: number;
username: string;
user_email?: string;
community: number;
community_name: string;
role: number;
role_name: string;
start_date: string;
end_date?: string | null;
created_at?: string;
};

export default function CommunityDetailPage() {
const params = useParams();
const router = useRouter();

const communityId = Array.isArray(params.id)
? params.id[0]
: params.id;

const [community, setCommunity] =
useState<Community | null>(null);

const [members, setMembers] =
useState<CommunityMember[]>([]);

const [myMemberships, setMyMemberships] =
useState<Membership[]>([]);

const [loading, setLoading] = useState(true);
const [membersLoading, setMembersLoading] =
useState(true);

const [actionLoading, setActionLoading] =
useState(false);

const [error, setError] =
useState<string | null>(null);

const [actionError, setActionError] =
useState<string | null>(null);

/* =========================================================
CHARGEMENT DE LA COMMUNAUTÉ
========================================================= */

async function loadCommunity() {
try {
setLoading(true);
setError(null);

  const data = await apiFetch(
    `/api/communities/${communityId}/`
  );

  setCommunity(data);
} catch (err) {
  console.error(
    "❌ Erreur communauté :",
    err
  );

  setError(
    err instanceof Error
      ? err.message
      : "Impossible de charger la communauté."
  );
} finally {
  setLoading(false);
}

}

/* =========================================================
CHARGEMENT DES MEMBRES
========================================================= */

async function loadMembers() {
try {
setMembersLoading(true);


  const data = await apiFetch(
    `/api/communities/${communityId}/members/`
  );

  const normalized = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  setMembers(normalized);
} catch (err) {
  console.error(
    "❌ Erreur membres :",
    err
  );
} finally {
  setMembersLoading(false);
}

}

/* =========================================================
CHARGEMENT DE MES ADHÉSIONS
========================================================= */

async function loadMyMemberships() {
try {
const data = await apiFetch(
"/api/communities/memberships/my/"
);

  const normalized = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  setMyMemberships(normalized);
} catch (err) {
  console.error(
    "❌ Erreur mes adhésions :",
    err
  );
}

}

/* =========================================================
INITIALISATION
========================================================= */

useEffect(() => {
if (!communityId) {
return;
}


loadCommunity();
loadMembers();
loadMyMemberships();

// eslint-disable-next-line react-hooks/exhaustive-deps

}, [communityId]);

/* =========================================================
STATUT DE L'UTILISATEUR
========================================================= */

const currentMembership = useMemo(() => {
return myMemberships.find(
(membership) =>
Number(membership.community) ===
Number(communityId)
);
}, [myMemberships, communityId]);

const isMember = Boolean(
currentMembership
);

/* =========================================================
REJOINDRE
========================================================= */

async function handleJoin() {
try {
setActionLoading(true);
setActionError(null);

await apiFetch(
  "/api/communities/memberships/",
  {
    method: "POST",
    body: JSON.stringify({
      community: Number(communityId),
    }),
  }
);

await Promise.all([
  loadMembers(),
  loadMyMemberships(),
]);


} catch (err) {
console.error(
"❌ Erreur adhésion :",
err
);

setActionError(
  err instanceof Error
    ? err.message
    : "Impossible de rejoindre cette communauté."
);


} finally {
setActionLoading(false);
}
}


/* =========================================================
QUITTER
========================================================= */

async function handleLeave() {
const confirmed = window.confirm(
"Voulez-vous vraiment quitter cette communauté ?"
);

if (!confirmed) {
  return;
}

try {
  setActionLoading(true);
  setActionError(null);

  await apiFetch(
    "/api/communities/memberships/leave/",
    {
      method: "POST",
      body: JSON.stringify({
        community: Number(communityId),
      }),
    }
  );

  await Promise.all([
    loadMembers(),
    loadMyMemberships(),
  ]);
} catch (err) {
  console.error(
    "❌ Erreur départ communauté :",
    err
  );

  setActionError(
    err instanceof Error
      ? err.message
      : "Impossible de quitter cette communauté."
  );
} finally {
  setActionLoading(false);
}

}

/* =========================================================
CHARGEMENT
========================================================= */

if (loading) {
return ( <main className="min-h-screen bg-slate-50 pb-24"> <div className="mx-auto max-w-4xl px-4 py-6">

```
      <div className="animate-pulse">
        <div className="h-10 w-24 rounded-xl bg-slate-200" />

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="h-8 w-2/3 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-1/2 rounded bg-slate-100" />
          <div className="mt-6 h-20 rounded-2xl bg-slate-100" />
        </div>
      </div>

    </div>
  </main>
);

}

/* =========================================================
ERREUR
========================================================= */

if (error || !community) {
return ( <main className="min-h-screen bg-slate-50 pb-24"> <div className="mx-auto max-w-4xl px-4 py-6">

      <Link
        href="/communities"
        className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
      >
        ← Communautés
      </Link>

      <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
        <div className="text-3xl">
          ⚠️
        </div>

        <h1 className="mt-3 text-lg font-bold text-red-800">
          Impossible de charger la communauté
        </h1>

        <p className="mt-2 text-sm text-red-700">
          {error ||
            "Cette communauté n'existe pas ou n'est plus disponible."}
        </p>

        <button
          type="button"
          onClick={loadCommunity}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>

    </div>
  </main>
);


}

/* =========================================================
RENDU
========================================================= */

return ( <main className="min-h-screen bg-slate-50 pb-24">

```
  {/* =====================================================
      HEADER
  ===================================================== */}

  <header className="border-b bg-white px-4 pb-5 pt-6">
    <div className="mx-auto max-w-4xl">

      <Link
        href="/communities"
        className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
      >
        ← Communautés
      </Link>

    </div>
  </header>

  {/* =====================================================
      CONTENU
  ===================================================== */}

  <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">

    {/* ===================================================
        IDENTITÉ
    =================================================== */}

    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">

      <div className="bg-emerald-600 p-6 text-white">

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
              🌿
            </div>

            <h1 className="break-words text-2xl font-bold sm:text-3xl">
              {community.name}
            </h1>

            <p className="mt-2 text-sm text-emerald-50">
              📍 {community.city}
              {community.country
                ? `, ${community.country}`
                : ""}
            </p>

          </div>

          {isMember && (
            <span className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
              ✓ Membre
            </span>
          )}

        </div>

      </div>

      {/* DESCRIPTION */}

      <div className="p-6">

        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          À propos
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {community.description ||
            "Aucune description n'a encore été ajoutée à cette communauté."}
        </p>

        {/* INFORMATIONS */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">

          {community.address && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Adresse
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                📍 {community.address}
              </p>
            </div>
          )}

          {community.timezone && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Fuseau horaire
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                🕐 {community.timezone}
              </p>
            </div>
          )}

        </div>

        {/* ACTION */}

        <div className="mt-6">

          {actionError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              ⚠️ {actionError}
            </div>
          )}

          {!isMember ? (
            <button
              type="button"
              onClick={handleJoin}
              disabled={actionLoading}
              className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading
                ? "Adhésion..."
                : "🤝 Rejoindre la communauté"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLeave}
              disabled={actionLoading}
              className="w-full rounded-2xl bg-slate-100 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading
                ? "Traitement..."
                : "🚪 Quitter la communauté"}
            </button>
          )}

        </div>

      </div>

    </section>

    {/* ===================================================
        STATISTIQUES
    =================================================== */}

    <section className="grid grid-cols-2 gap-3">

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="text-2xl">
          👥
        </div>

        <p className="mt-2 text-2xl font-bold text-slate-900">
          {members.length}
        </p>

        <p className="text-sm text-slate-500">
          Membre
          {members.length > 1
            ? "s"
            : ""}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="text-2xl">
          🌿
        </div>

        <p className="mt-2 text-2xl font-bold text-slate-900">
          {isMember
            ? currentMembership?.role_name ||
              "Membre"
            : "Visiteur"}
        </p>

        <p className="text-sm text-slate-500">
          Votre statut
        </p>
      </div>

    </section>

    {/* ===================================================
        MEMBRES
    =================================================== */}

    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">

      <div className="flex items-center justify-between gap-4">

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Membres
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Les personnes qui font partie de cette communauté.
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          {members.length}
        </span>

      </div>

      {membersLoading ? (
        <div className="mt-5 space-y-3">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl bg-slate-50 p-4"
            >
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
            </div>
          ))}

        </div>
      ) : members.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center">
          <div className="text-3xl">
            👥
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-700">
            Aucun membre
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Cette communauté n'a pas encore de membre.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">

          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4"
            >

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                {member.username
                  ?.charAt(0)
                  ?.toUpperCase() || "?"}
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate font-semibold text-slate-900">
                  {member.username}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {member.role_name}
                </p>

              </div>

              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                Depuis{" "}
                {new Date(
                  member.start_date
                ).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </span>

            </div>
          ))}

        </div>
      )}

    </section>

    {/* ===================================================
        FUTURES FEATURES
    =================================================== */}

    <section className="grid gap-3 sm:grid-cols-2">

      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5">
        <div className="text-2xl">
          📅
        </div>

        <h3 className="mt-3 font-bold text-slate-900">
          Activités communautaires
        </h3>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          Les réunions, activités et événements de cette communauté apparaîtront ici.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5">
        <div className="text-2xl">
          📢
        </div>

        <h3 className="mt-3 font-bold text-slate-900">
          Annonces
        </h3>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          Les annonces importantes de la communauté apparaîtront ici.
        </p>
      </div>

    </section>

  </div>

  {/* =====================================================
      NAVIGATION PWA
  ===================================================== */}

  <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur">

    <div className="mx-auto flex max-w-2xl items-center justify-around">

      <Link
        href="/"
        className="flex flex-col items-center px-3 py-2 text-slate-500 transition hover:text-slate-900"
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
        className="flex flex-col items-center px-3 py-2 text-slate-500 transition hover:text-slate-900"
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
        className="flex flex-col items-center px-3 py-2 text-emerald-600"
      >
        <span className="text-xl">
          👥
        </span>

        <span className="mt-1 text-[11px] font-semibold">
          Communautés
        </span>
      </Link>

      <Link
        href="/notifications"
        className="flex flex-col items-center px-3 py-2 text-slate-500 transition hover:text-slate-900"
      >
        <span className="text-xl">
          🔔
        </span>

        <span className="mt-1 text-[11px]">
          Notifications
        </span>
      </Link>

      <Link
        href="/profile"
        className="flex flex-col items-center px-3 py-2 text-slate-500 transition hover:text-slate-900"
      >
        <span className="text-xl">
          👤
        </span>

        <span className="mt-1 text-[11px]">
          Profil
        </span>
      </Link>

    </div>

  </nav>

</main>


);
}
