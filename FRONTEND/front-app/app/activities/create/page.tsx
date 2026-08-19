"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";

/* =========================================================
TYPES
========================================================= */

type ActivityType = {
id: number;
name: string;
code: string;
description?: string;
icon?: string;
color?: string;
requires_confirmation?: boolean;
active?: boolean;
};

type Community = {
id: number;
name: string;
city?: string;
country?: string;
};

type ActivityForm = {
title: string;
description: string;
activity_type: string;
community: string;
start_datetime: string;
end_datetime: string;
location_name: string;
address: string;
is_online: boolean;
meeting_url: string;
max_participants: string;
requires_confirmation: boolean;
};

/* =========================================================
PAGE
========================================================= */

export default function CreateActivityPage() {
const [types, setTypes] = useState<ActivityType[]>([]);
const [communities, setCommunities] = useState<Community[]>([]);

const [loadingOptions, setLoadingOptions] = useState(true);
const [submitting, setSubmitting] = useState(false);

const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

const [form, setForm] = useState<ActivityForm>({
title: "",
description: "",
activity_type: "",
community: "",
start_datetime: "",
end_datetime: "",
location_name: "",
address: "",
is_online: false,
meeting_url: "",
max_participants: "",
requires_confirmation: false,
});

/* =======================================================
CHARGEMENT DES OPTIONS
======================================================= */

useEffect(() => {
async function loadOptions() {
try {
setLoadingOptions(true);
setError(null);

    const [typesData, communitiesData] =
      await Promise.all([
        apiFetch("/api/activities/types/"),
        apiFetch("/api/activities/communities/my/"),
      ]);

    const normalizedTypes: ActivityType[] =
      Array.isArray(typesData)
        ? typesData
        : Array.isArray(typesData?.results)
          ? typesData.results
          : [];

    const normalizedCommunities: Community[] =
      Array.isArray(communitiesData)
        ? communitiesData
        : Array.isArray(communitiesData?.results)
          ? communitiesData.results
          : [];

    setTypes(normalizedTypes);
    setCommunities(normalizedCommunities);

    if (normalizedTypes.length === 0) {
      setError(
        "Aucun type d'activité n'est disponible."
      );
    }

    if (normalizedCommunities.length === 0) {
      setError(
        "Vous n'appartenez encore à aucune communauté."
      );
    }
  } catch (err) {
    console.error(
      "❌ Erreur chargement options activité :",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Impossible de charger les options."
    );
  } finally {
    setLoadingOptions(false);
  }
}

loadOptions();

}, []);

/* =======================================================
CHANGEMENT FORMULAIRE
======================================================= */

function updateField<K extends keyof ActivityForm>(
field: K,
value: ActivityForm[K]
) {
setForm((previous) => ({
...previous,
[field]: value,
}));
}

/* =======================================================
TYPE SÉLECTIONNÉ
======================================================= */

const selectedType = types.find(
(type) =>
String(type.id) === form.activity_type
);

/* =======================================================
SOUMISSION
======================================================= */

async function handleSubmit(
event: FormEvent<HTMLFormElement>
) {
event.preventDefault();


setError(null);
setSuccess(null);

if (!form.title.trim()) {
  setError("Le titre est obligatoire.");
  return;
}

if (!form.activity_type) {
  setError(
    "Veuillez sélectionner un type d'activité."
  );
  return;
}

if (!form.community) {
  setError(
    "Veuillez sélectionner une communauté."
  );
  return;
}

if (!form.start_datetime) {
  setError(
    "La date et l'heure de début sont obligatoires."
  );
  return;
}

if (
  form.is_online &&
  !form.meeting_url.trim()
) {
  setError(
    "Le lien de réunion est obligatoire pour une activité en ligne."
  );
  return;
}

if (
  !form.is_online &&
  !form.location_name.trim()
) {
  setError(
    "Veuillez indiquer le lieu de l'activité."
  );
  return;
}

try {
  setSubmitting(true);

  const payload = {
    title: form.title.trim(),

    description:
      form.description.trim(),

    activity_type:
      Number(form.activity_type),

    community:
      Number(form.community),

    start_datetime:
      form.start_datetime,

    end_datetime:
      form.end_datetime || null,

    location_name:
      form.is_online
        ? ""
        : form.location_name.trim(),

    address:
      form.is_online
        ? ""
        : form.address.trim(),

    is_online:
      form.is_online,

    meeting_url:
      form.is_online
        ? form.meeting_url.trim()
        : "",

    max_participants:
      form.max_participants
        ? Number(form.max_participants)
        : null,

    requires_confirmation:
      form.requires_confirmation,
  };

  const activity = await apiFetch(
    "/api/activities/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  console.log(
    "✅ Activité créée :",
    activity
  );

  setSuccess(
    "Activité créée avec succès."
  );

  setForm({
    title: "",
    description: "",
    activity_type: "",
    community: "",
    start_datetime: "",
    end_datetime: "",
    location_name: "",
    address: "",
    is_online: false,
    meeting_url: "",
    max_participants: "",
    requires_confirmation: false,
  });

} catch (err) {
  console.error(
    "❌ Erreur création activité :",
    err
  );

  setError(
    err instanceof Error
      ? err.message
      : "Impossible de créer l'activité."
  );
} finally {
  setSubmitting(false);
}

}

/* =======================================================
CHARGEMENT
======================================================= */

if (loadingOptions) {
return ( <main className="min-h-screen bg-slate-50 pb-24"> <div className="mx-auto max-w-3xl px-4 py-8">

```
      <div className="animate-pulse">

        <div className="h-10 w-32 rounded-xl bg-slate-200" />

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="h-8 w-2/3 rounded bg-slate-200" />

          <div className="mt-6 space-y-4">
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-2xl bg-slate-100" />
            <div className="h-12 rounded-2xl bg-slate-100" />
          </div>
        </div>

      </div>

    </div>
  </main>
);

}

/* =======================================================
RENDU
======================================================= */

return ( <main className="min-h-screen bg-slate-50 pb-24">

```
  {/* HEADER */}

  <header className="border-b bg-white px-4 pb-5 pt-6">
    <div className="mx-auto max-w-3xl">

      <Link
        href="/activities"
        className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
      >
        ← Activités
      </Link>

      <div className="mt-5">

        <p className="text-sm font-medium text-emerald-600">
          Vie communautaire
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Créer une activité
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Organisez une activité pour l'une de vos communautés.
        </p>

      </div>

    </div>
  </header>

  {/* CONTENU */}

  <div className="mx-auto max-w-3xl px-4 py-6">

    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >

      {/* INFORMATIONS */}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">

        <h2 className="text-lg font-bold text-slate-900">
          Informations générales
        </h2>

        <div className="mt-5 space-y-4">

          {/* TITRE */}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Titre *
            </label>

            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value
                )
              }
              placeholder="Ex. Réunion de dévotion"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          {/* TYPE */}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Type d'activité *
            </label>

            <select
              value={form.activity_type}
              onChange={(event) =>
                updateField(
                  "activity_type",
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">
                Sélectionner un type
              </option>

              {types.map((type) => (
                <option
                  key={type.id}
                  value={type.id}
                >
                  {type.icon || "📅"}{" "}
                  {type.name}
                </option>
              ))}
            </select>

            {selectedType?.description && (
              <p className="mt-2 text-xs text-slate-500">
                {selectedType.description}
              </p>
            )}
          </div>

          {/* COMMUNAUTÉ */}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Communauté *
            </label>

            <select
              value={form.community}
              onChange={(event) =>
                updateField(
                  "community",
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">
                Sélectionner une communauté
              </option>

              {communities.map(
                (community) => (
                  <option
                    key={community.id}
                    value={community.id}
                  >
                    {community.name}
                    {community.city
                      ? ` — ${community.city}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>

          {/* DESCRIPTION */}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
              placeholder="Décrivez l'activité..."
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

        </div>

      </section>

      {/* DATE */}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">

        <h2 className="text-lg font-bold text-slate-900">
          Date et horaires
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Début *
            </label>

            <input
              type="datetime-local"
              value={form.start_datetime}
              onChange={(event) =>
                updateField(
                  "start_datetime",
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Fin
            </label>

            <input
              type="datetime-local"
              value={form.end_datetime}
              onChange={(event) =>
                updateField(
                  "end_datetime",
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

        </div>

      </section>

      {/* LIEU */}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">

        <div className="flex items-center justify-between gap-4">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Lieu
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Indiquez où aura lieu l'activité.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">

            <input
              type="checkbox"
              checked={form.is_online}
              onChange={(event) =>
                updateField(
                  "is_online",
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />

            En ligne

          </label>

        </div>

        <div className="mt-5 space-y-4">

          {form.is_online ? (

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Lien de réunion *
              </label>

              <input
                type="url"
                value={form.meeting_url}
                onChange={(event) =>
                  updateField(
                    "meeting_url",
                    event.target.value
                  )
                }
                placeholder="https://..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

          ) : (

            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nom du lieu
                </label>

                <input
                  type="text"
                  value={form.location_name}
                  onChange={(event) =>
                    updateField(
                      "location_name",
                      event.target.value
                    )
                  }
                  placeholder="Ex. Centre bahá'í"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Adresse
                </label>

                <input
                  type="text"
                  value={form.address}
                  onChange={(event) =>
                    updateField(
                      "address",
                      event.target.value
                    )
                  }
                  placeholder="Adresse complète"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </>

          )}

        </div>

      </section>

      {/* PARTICIPATION */}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">

        <h2 className="text-lg font-bold text-slate-900">
          Participation
        </h2>

        <div className="mt-5 space-y-4">

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Nombre maximal de participants
            </label>

            <input
              type="number"
              min="1"
              value={form.max_participants}
              onChange={(event) =>
                updateField(
                  "max_participants",
                  event.target.value
                )
              }
              placeholder="Illimité"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4">

            <input
              type="checkbox"
              checked={form.requires_confirmation}
              onChange={(event) =>
                updateField(
                  "requires_confirmation",
                  event.target.checked
                )
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-800">
                Confirmation obligatoire
              </span>

              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Les participants devront confirmer leur présence.
              </span>
            </span>

          </label>

        </div>

      </section>

      {/* MESSAGES */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          ✅ {success}
        </div>
      )}

      {/* ACTIONS */}

      <div className="flex gap-3">

        <Link
          href="/activities"
          className="flex-1 rounded-2xl bg-slate-100 px-5 py-3.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-200"
        >
          Annuler
        </Link>

        <button
          type="submit"
          disabled={
            submitting ||
            communities.length === 0 ||
            types.length === 0
          }
          className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Création..."
            : "Créer l'activité"}
        </button>

      </div>

    </form>

  </div>

  {/* NAVIGATION PWA */}

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
        href="/activities"
        className="flex flex-col items-center px-3 py-2 text-emerald-600"
      >
        <span className="text-xl">📅</span>
        <span className="mt-1 text-[11px] font-semibold">
          Activités
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
