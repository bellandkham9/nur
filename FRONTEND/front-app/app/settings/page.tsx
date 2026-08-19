"use client";

import BottomNavigation from "@/components/navigation/BottomNavigation";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function SettingsPage() {
  const [preferences, setPreferences] =
    useState<UserPreferences | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] =
    useState<PreferenceKey | null>(null);

  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // CHARGEMENT DES PRÉFÉRENCES
  // ==========================================================

  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        setError(null);

        const prefs = await getUserPreferences();

        console.log(
          "⚙️ Préférences utilisateur :",
          prefs
        );

        setPreferences(prefs);
      } catch (err) {
        console.error(
          "❌ Impossible de charger les préférences :",
          err
        );

        setError(
          "Impossible de charger vos préférences."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  // ==========================================================
  // MODIFICATION D'UNE PRÉFÉRENCE
  // ==========================================================

  async function togglePreference(
    key: PreferenceKey
  ) {
    if (!preferences || saving) {
      return;
    }

    const oldValue = preferences[key];
    const newValue = !oldValue;

    // Mise à jour optimiste de l'interface
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

      console.log(
        "✅ Préférence sauvegardée :",
        updated
      );

      // On utilise la réponse réelle du backend
      setPreferences(updated);
    } catch (err) {
      console.error(
        "❌ Erreur sauvegarde préférence :",
        err
      );

      // Retour à l'ancienne valeur
      setPreferences({
        ...preferences,
        [key]: oldValue,
      });

      setError(
        "Impossible d'enregistrer cette modification."
      );
    } finally {
      setSaving(null);
    }
  }

  // ==========================================================
  // INTERRUPTEUR
  // ==========================================================

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
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled
            ? "bg-emerald-600"
            : "bg-slate-300"
        } ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    );
  }

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">
        <header className="border-b bg-white px-5 pb-6 pt-7">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-700"
              >
                ←
              </Link>

              <div>
                <p className="text-sm text-slate-500">
                  Mon espace
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  Paramètres
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

            <p className="text-sm text-slate-500">
              Chargement de vos préférences...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // ERREUR DE CHARGEMENT
  // ==========================================================

  if (!preferences) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24">
        <header className="border-b bg-white px-5 pb-6 pt-7">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-700"
              >
                ←
              </Link>

              <div>
                <p className="text-sm text-slate-500">
                  Mon espace
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  Paramètres
                </h1>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-red-100">
            <div className="text-3xl">
              ⚠️
            </div>

            <h2 className="mt-3 font-bold text-slate-900">
              Impossible de charger les préférences
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error ||
                "Une erreur est survenue."}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main className="min-h-screen bg-slate-50 pb-24">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white px-5 pb-6 pt-7">
        <div className="mx-auto max-w-5xl">

          <div className="flex items-center gap-4">

            <Link
              href="/profile"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-700 transition hover:bg-slate-200"
              aria-label="Retour au profil"
            >
              ←
            </Link>

            <div>
              <p className="text-sm text-slate-500">
                Mon espace
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Paramètres
              </h1>
            </div>

          </div>

        </div>
      </header>

      {/* =====================================================
          CONTENU
      ===================================================== */}

      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* ===================================================
            ERREUR
        =================================================== */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <span>⚠️</span>

            <span className="flex-1">
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        <section>

          <div className="mb-4">

            <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
              Notifications
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Préférences de notification
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choisissez les notifications que vous souhaitez recevoir.
            </p>

          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

            {/* =================================================
                PUSH
            ================================================= */}

            <div className="flex items-center gap-4 border-b border-slate-100 p-5">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                🔔
              </div>

              <div className="min-w-0 flex-1">

                <h3 className="font-semibold text-slate-900">
                  Notifications Push
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Recevoir les notifications directement sur votre appareil.
                </p>

                {saving ===
                  "push_notifications_enabled" && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
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
                    "push_notifications_enabled"
                  )
                }
                label="Activer ou désactiver les notifications Push"
              />

            </div>

            {/* =================================================
                RAPPELS ÉVÉNEMENTS
            ================================================= */}

            <div className="flex items-center gap-4 border-b border-slate-100 p-5">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                📅
              </div>

              <div className="min-w-0 flex-1">

                <h3 className="font-semibold text-slate-900">
                  Rappels d'événements
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Être averti avant le début de vos événements.
                </p>

                {saving ===
                  "event_reminders_enabled" && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
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
                    "event_reminders_enabled"
                  )
                }
                label="Activer ou désactiver les rappels d'événements"
              />

            </div>

            {/* =================================================
                RAPPEL QUOTIDIEN
            ================================================= */}

            <div className="flex items-center gap-4 p-5">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xl">
                🌅
              </div>

              <div className="min-w-0 flex-1">

                <h3 className="font-semibold text-slate-900">
                  Rappel quotidien
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Recevoir un rappel quotidien pour votre moment spirituel.
                </p>

                {saving ===
                  "daily_reminder_enabled" && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
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
                    "daily_reminder_enabled"
                  )
                }
                label="Activer ou désactiver le rappel quotidien"
              />

            </div>

          </div>

        </section>

        {/* ===================================================
            CENTRE DE NOTIFICATIONS
        =================================================== */}

        <section className="mt-8">

          <div className="mb-4">

            <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
              Centre de notifications
            </p>

          </div>

          <Link
            href="/notifications"
            className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
              🔔
            </div>

            <div className="min-w-0 flex-1">

              <h3 className="font-semibold text-slate-900">
                Mes notifications
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Consulter, lire ou supprimer vos notifications.
              </p>

            </div>

            <span className="text-xl text-slate-300 transition group-hover:text-slate-500">
              →
            </span>

          </Link>

        </section>

        {/* ===================================================
            COMPTE
        =================================================== */}

        <section className="mt-8">

          <div className="mb-4">

            <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
              Compte
            </p>

          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

            <Link
              href="/profile"
              className="flex items-center gap-4 border-b border-slate-100 p-5 transition hover:bg-slate-50"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
                👤
              </div>

              <div className="min-w-0 flex-1">

                <h3 className="font-semibold text-slate-900">
                  Profil
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Consulter votre profil.
                </p>

              </div>

              <span className="text-slate-300">
                →
              </span>

            </Link>

            <button
              type="button"
              className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50"
              onClick={() => {
                localStorage.removeItem(
                  "access_token"
                );

                localStorage.removeItem(
                  "refresh_token"
                );

                window.location.href =
                  "/login";
              }}
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl">
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

        {/* ===================================================
            À PROPOS
        =================================================== */}

        <section className="mt-8 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">

          <div className="text-3xl">
            🌿
          </div>

          <h2 className="mt-3 font-bold text-slate-900">
            Bahá'í Companion
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Votre compagnon spirituel.
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Version 1.0.0
          </p>

        </section>

      </div>

      {/* =====================================================
          NAVIGATION PWA
      ===================================================== */}

      <BottomNavigation />
    </main>
  );
}