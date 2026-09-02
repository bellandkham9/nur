"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import {
getUserPreferences,
updateUserPreferences,
} from "@/lib/api";

/* =========================================================
TYPES
========================================================= */

type UserPreferences = {
push_notifications_enabled: boolean;
event_reminders_enabled: boolean;
daily_reminder_enabled: boolean;
updated_at?: string;
};

type PreferenceKey =
| "push_notifications_enabled"
| "event_reminders_enabled"
| "daily_reminder_enabled";

/* =========================================================
COMPOSANT TOGGLE
========================================================= */

function Toggle({
enabled,
disabled,
onClick,
label,
}: {
enabled: boolean;
disabled?: boolean;
onClick: () => void;
label: string;
}) {
return (
<button
type="button"
disabled={disabled}
onClick={onClick}
aria-label={label}
aria-pressed={enabled}
className={`         relative h-7 w-12 shrink-0 rounded-full
        transition-all duration-200
        focus:outline-none focus:ring-4 focus:ring-emerald-100
        ${
          enabled
            ? "bg-emerald-600"
            : "bg-slate-200"
        }
        ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }
      `}
>
<span
className={`           absolute top-1 h-5 w-5 rounded-full
          bg-white shadow-sm
          transition-all duration-200
          ${
            enabled
              ? "left-6"
              : "left-1"
          }
        `}
/> </button>
);
}

/* =========================================================
PAGE
========================================================= */

export default function SettingsPage() {
const [preferences, setPreferences] =
useState<UserPreferences | null>(null);

const [loading, setLoading] = useState(true);

const [saving, setSaving] =
useState<PreferenceKey | null>(null);

const [error, setError] =
useState<string | null>(null);

/* =======================================================
CHARGEMENT
======================================================= */

useEffect(() => {
async function loadPreferences() {
try {
setLoading(true);
setError(null);

    const prefs = await getUserPreferences();

    setPreferences(prefs);
  } catch (err) {
    console.error(
      "❌ Impossible de charger les préférences :",
      err,
    );

    setError(
      "Impossible de charger vos préférences.",
    );
  } finally {
    setLoading(false);
  }
}

loadPreferences();

}, []);

/* =======================================================
MODIFICATION D'UNE PRÉFÉRENCE
======================================================= */

async function togglePreference(
key: PreferenceKey,
) {
if (!preferences || saving) {
return;
}

const oldValue = preferences[key];
const newValue = !oldValue;

/*
 * Mise à jour optimiste.
 */
setPreferences({
  ...preferences,
  [key]: newValue,
});

setSaving(key);
setError(null);

try {
  const updated =
    await updateUserPreferences({
      [key]: newValue,
    });

  setPreferences(updated);
} catch (err) {
  console.error(
    "❌ Erreur sauvegarde préférence :",
    err,
  );

  /*
   * Retour à l'ancienne valeur
   * si le backend échoue.
   */
  setPreferences({
    ...preferences,
    [key]: oldValue,
  });

  setError(
    "Impossible d'enregistrer cette modification.",
  );
} finally {
  setSaving(null);
}

}

/* =======================================================
CHARGEMENT
======================================================= */

if (loading) {
return ( <main className="min-h-screen bg-[#f7f8f6] pb-24">

    {/* Header */}

    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-4xl px-5 pb-6 pt-7">

        <div className="flex items-center gap-4">

          <Link
            href="/profile"
            aria-label="Retour au profil"
            className="
              flex h-11 w-11 items-center justify-center
              rounded-2xl bg-slate-100
              text-lg text-slate-600
              transition
              hover:bg-slate-200
            "
          >
            ←
          </Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Mon espace
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Paramètres
            </h1>
          </div>

        </div>

      </div>
    </header>

    {/* Loader */}

    <div className="mx-auto flex min-h-[65vh] max-w-4xl items-center justify-center px-5">

      <div className="text-center">

        <div className="
          mx-auto h-10 w-10 animate-spin
          rounded-full border-4
          border-slate-200
          border-t-emerald-600
        " />

        <p className="mt-4 text-sm text-slate-500">
          Chargement de vos préférences...
        </p>

      </div>

    </div>

    <BottomNavigation />
  </main>
);

}

/* =======================================================
ERREUR
======================================================= */

if (!preferences) {
return ( <main className="min-h-screen bg-[#f7f8f6] pb-24">
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-4xl px-5 pb-6 pt-7">

        <div className="flex items-center gap-4">

          <Link
            href="/profile"
            aria-label="Retour au profil"
            className="
              flex h-11 w-11 items-center justify-center
              rounded-2xl bg-slate-100
              text-lg text-slate-600
            "
          >
            ←
          </Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Mon espace
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Paramètres
            </h1>
          </div>

        </div>

      </div>
    </header>

    <div className="mx-auto max-w-4xl px-5 py-10">

      <div className="
        rounded-4xl
        border border-red-100
        bg-white
        p-8
        text-center
        shadow-sm
      ">

        <div className="
          mx-auto flex h-16 w-16
          items-center justify-center
          rounded-2xl bg-red-50
          text-3xl
        ">
          ⚠️
        </div>

        <h2 className="mt-5 text-lg font-bold text-slate-900">
          Impossible de charger les paramètres
        </h2>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          {error ||
            "Une erreur est survenue lors du chargement de vos préférences."}
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          className="
            mt-6 rounded-2xl
            bg-emerald-600
            px-6 py-3
            text-sm font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-emerald-700
            active:scale-[0.98]
          "
        >
          Réessayer
        </button>

      </div>

    </div>

    <BottomNavigation />
  </main>
);

}

/* =======================================================
PAGE PRINCIPALE
======================================================= */

return ( <main className="min-h-screen bg-[#f7f8f6] pb-24">

  {/* ===================================================
      HEADER
  =================================================== */}

  <header className="border-b border-slate-100 bg-white">

    <div className="mx-auto max-w-4xl px-5 pb-7 pt-7">

      <div className="flex items-center gap-4">

        <Link
          href="/profile"
          aria-label="Retour au profil"
          className="
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-2xl
            bg-slate-100
            text-lg text-slate-600
            transition
            hover:bg-slate-200
            active:scale-95
          "
        >
          ←
        </Link>

        <div className="min-w-0">

          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
            Mon espace
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Paramètres
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Personnalisez votre expérience.
          </p>

        </div>

      </div>

    </div>

  </header>

  {/* ===================================================
      CONTENU
  =================================================== */}

  <div className="mx-auto max-w-4xl space-y-8 px-5 py-7">

    {/* =================================================
        ERREUR
    ================================================= */}

    {error && (
      <div className="
        flex items-start gap-3
        rounded-2xl
        border border-red-100
        bg-red-50
        p-4
        text-sm text-red-700
      ">

        <span className="text-lg">
          ⚠️
        </span>

        <p className="flex-1 leading-6">
          {error}
        </p>

        <button
          type="button"
          onClick={() => setError(null)}
          aria-label="Fermer"
          className="font-bold text-red-400 hover:text-red-600"
        >
          ×
        </button>

      </div>
    )}

    {/* =================================================
        NOTIFICATIONS
    ================================================= */}

    <section>

      <div className="mb-4">

        <p className="
          text-xs font-semibold
          uppercase tracking-[0.16em]
          text-emerald-600
        ">
          Notifications
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Restez informé
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Choisissez les notifications que Bahá'í Companion
          peut vous envoyer.
        </p>

      </div>

      <div className="
        overflow-hidden
        rounded-4xl
        border border-slate-200/80
        bg-white
        shadow-sm
      ">

        {/* =================================================
            PUSH
        ================================================= */}

        <div className="
          flex items-center gap-4
          border-b border-slate-100
          p-5 sm:p-6
        ">

          <div className="
            flex h-12 w-12 shrink-0
            items-center justify-center
            rounded-2xl
            bg-emerald-50
            text-xl
          ">
            🔔
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2">

              <h3 className="font-semibold text-slate-900">
                Notifications Push
              </h3>

              {preferences.push_notifications_enabled && (
                <span className="
                  hidden rounded-full
                  bg-emerald-50
                  px-2 py-0.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-emerald-600
                  sm:inline-flex
                ">
                  Actif
                </span>
              )}

            </div>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Recevoir les notifications directement
              sur votre appareil.
            </p>

            {saving ===
              "push_notifications_enabled" && (
              <p className="mt-2 text-xs font-semibold text-emerald-600">
                Enregistrement...
              </p>
            )}

          </div>

          <Toggle
            enabled={
              preferences.push_notifications_enabled
            }
            disabled={saving !== null}
            onClick={() =>
              togglePreference(
                "push_notifications_enabled",
              )
            }
            label="Activer ou désactiver les notifications Push"
          />

        </div>

        {/* =================================================
            RAPPELS ÉVÉNEMENTS
        ================================================= */}

        <div className="
          flex items-center gap-4
          border-b border-slate-100
          p-5 sm:p-6
        ">

          <div className="
            flex h-12 w-12 shrink-0
            items-center justify-center
            rounded-2xl
            bg-blue-50
            text-xl
          ">
            📅
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2">

              <h3 className="font-semibold text-slate-900">
                Rappels d'événements
              </h3>

              {preferences.event_reminders_enabled && (
                <span className="
                  hidden rounded-full
                  bg-blue-50
                  px-2 py-0.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-blue-600
                  sm:inline-flex
                ">
                  Actif
                </span>
              )}

            </div>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Être averti avant le début de vos événements.
            </p>

            {saving ===
              "event_reminders_enabled" && (
              <p className="mt-2 text-xs font-semibold text-emerald-600">
                Enregistrement...
              </p>
            )}

          </div>

          <Toggle
            enabled={
              preferences.event_reminders_enabled
            }
            disabled={saving !== null}
            onClick={() =>
              togglePreference(
                "event_reminders_enabled",
              )
            }
            label="Activer ou désactiver les rappels d'événements"
          />

        </div>

        {/* =================================================
            RAPPEL QUOTIDIEN
        ================================================= */}

        <div className="
          flex items-center gap-4
          p-5 sm:p-6
        ">

          <div className="
            flex h-12 w-12 shrink-0
            items-center justify-center
            rounded-2xl
            bg-amber-50
            text-xl
          ">
            🌅
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2">

              <h3 className="font-semibold text-slate-900">
                Rappel quotidien
              </h3>

              {preferences.daily_reminder_enabled && (
                <span className="
                  hidden rounded-full
                  bg-amber-50
                  px-2 py-0.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-amber-600
                  sm:inline-flex
                ">
                  Actif
                </span>
              )}

            </div>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Recevoir un rappel quotidien pour
              votre moment spirituel.
            </p>

            {saving ===
              "daily_reminder_enabled" && (
              <p className="mt-2 text-xs font-semibold text-emerald-600">
                Enregistrement...
              </p>
            )}

          </div>

          <Toggle
            enabled={
              preferences.daily_reminder_enabled
            }
            disabled={saving !== null}
            onClick={() =>
              togglePreference(
                "daily_reminder_enabled",
              )
            }
            label="Activer ou désactiver le rappel quotidien"
          />

        </div>

      </div>

    </section>

    {/* =================================================
        CENTRE DE NOTIFICATIONS
    ================================================= */}

    <section>

      <div className="mb-4">

        <p className="
          text-xs font-semibold
          uppercase tracking-[0.16em]
          text-slate-400
        ">
          Centre
        </p>

      </div>

      <Link
        href="/notifications"
        className="
          group flex items-center gap-4
          rounded-4xl
          border border-slate-200/80
          bg-white
          p-5 sm:p-6
          shadow-sm
          transition-all
          hover:-translate-y-0.5
          hover:shadow-md
        "
      >

        <div className="
          flex h-12 w-12 shrink-0
          items-center justify-center
          rounded-2xl
          bg-red-50
          text-xl
        ">
          🔔
        </div>

        <div className="min-w-0 flex-1">

          <h3 className="font-semibold text-slate-900">
            Mes notifications
          </h3>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            Consultez, lisez et gérez vos notifications.
          </p>

        </div>

        <div className="
          flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-xl
          bg-slate-50
          text-slate-400
          transition
          group-hover:bg-emerald-50
          group-hover:text-emerald-600
        ">
          →
        </div>

      </Link>

    </section>

    {/* =================================================
        COMPTE
    ================================================= */}

    <section>

      <div className="mb-4">

        <p className="
          text-xs font-semibold
          uppercase tracking-[0.16em]
          text-slate-400
        ">
          Compte
        </p>

      </div>

      <div className="
        overflow-hidden
        rounded-4xl
        border border-slate-200/80
        bg-white
        shadow-sm
      ">

        {/* PROFIL */}

        <Link
          href="/profile"
          className="
            group flex items-center gap-4
            border-b border-slate-100
            p-5 sm:p-6
            transition
            hover:bg-slate-50
          "
        >

          <div className="
            flex h-12 w-12 shrink-0
            items-center justify-center
            rounded-2xl
            bg-slate-100
            text-xl
          ">
            👤
          </div>

          <div className="min-w-0 flex-1">

            <h3 className="font-semibold text-slate-900">
              Profil
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Consulter et gérer votre profil.
            </p>

          </div>

          <span className="
            text-lg text-slate-300
            transition
            group-hover:text-slate-500
          ">
            →
          </span>

        </Link>

        {/* DÉCONNEXION */}

        <button
          type="button"
          className="
            flex w-full items-center gap-4
            p-5 sm:p-6
            text-left
            transition
            hover:bg-red-50/40
          "
          onClick={() => {

            localStorage.removeItem(
              "access_token",
            );

            localStorage.removeItem(
              "refresh_token",
            );

            window.location.href = "/login";
          }}
        >

          <div className="
            flex h-12 w-12 shrink-0
            items-center justify-center
            rounded-2xl
            bg-red-50
            text-xl
          ">
            🚪
          </div>

          <div className="min-w-0 flex-1">

            <h3 className="font-semibold text-red-600">
              Se déconnecter
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Fermer votre session sur cet appareil.
            </p>

          </div>

        </button>

      </div>

    </section>

    {/* =================================================
        À PROPOS
    ================================================= */}

    <section className="
      relative overflow-hidden
      rounded-4xl
      border border-emerald-100
      bg-linear-to-br
      from-emerald-50
      via-white
      to-emerald-50/50
      p-7
      text-center
    ">

      <div className="
        absolute -right-10 -top-10
        h-28 w-28
        rounded-full
        bg-emerald-100/40
        blur-2xl
      " />

      <div className="
        relative mx-auto
        flex h-14 w-14
        items-center justify-center
        rounded-2xl
        bg-white
        text-2xl
        shadow-sm
        ring-1 ring-emerald-100
      ">
        🌿
      </div>

      <h2 className="
        relative mt-4
        text-lg font-bold
        text-slate-900
      ">
        Bahá'í Companion
      </h2>

      <p className="
        relative mt-1
        text-sm text-slate-500
      ">
        Votre compagnon pour la vie spirituelle,
        communautaire et personnelle.
      </p>

      <div className="
        relative mx-auto mt-5
        flex w-fit items-center
        gap-2 rounded-full
        bg-white/80
        px-3 py-1.5
        text-xs font-medium
        text-slate-400
        ring-1 ring-slate-100
      ">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Version 1.0.0
      </div>

    </section>

    {/* =================================================
        CITATION FINALE
    ================================================= */}

    <div className="pb-2 text-center">

      <p className="text-xs leading-5 text-slate-400">
        Que cette application vous accompagne
        dans chaque étape de votre cheminement.
      </p>

    </div>

  </div>

  {/* ===================================================
      NAVIGATION PWA
  =================================================== */}

  <BottomNavigation />

</main>


);
}
