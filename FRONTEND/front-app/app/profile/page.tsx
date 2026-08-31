"use client";

import BottomNavigation from "@/components/navigation/BottomNavigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getCurrentUser,} from "@/lib/api";

type NotificationItem = {
id: number;
title: string;
message: string;
event_source: string;
event_id: number | null;
scheduled_for: string;
created_at: string;
status: string;
read_at: string | null;
};


const [username, setUsername] = useState("Utilisateur");

useEffect(() => {

  async function loadUser() {

    try {

      const user =
        await getCurrentUser();


      setUsername(
        user.username
      );

    } catch (error) {

      console.error(
        "❌ Impossible de récupérer l'utilisateur :",
        error
      );
    }
  }


  loadUser();

}, []);
export default function ProfilePage() {
const [notifications] = useState<NotificationItem[]>([]);

const unreadCount = useMemo(() => {
return notifications.filter(
(notification) => notification.status !== "READ"
).length;
}, [notifications]);

return ( <main className="min-h-screen bg-slate-50 pb-24">

  {/* =====================================================
      HEADER
  ===================================================== */}

  <header className="border-b bg-white px-5 pb-6 pt-7">
    <div className="mx-auto max-w-5xl">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Mon espace
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Profil
          </h1>
        </div>

        <Link
          href="/settings"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl transition hover:bg-slate-200"
          aria-label="Paramètres"
        >
          ⚙️
        </Link>

      </div>

    </div>
  </header>

  {/* =====================================================
      CONTENU
  ===================================================== */}

  <div className="mx-auto max-w-5xl px-4 py-6">

    {/* ===================================================
        PROFIL UTILISATEUR
    =================================================== */}

    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

      <div className="flex items-center gap-5">

        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-4xl">
          👤
        </div>

        <div className="min-w-0 flex-1">

          <p className="text-sm font-medium text-slate-400">
            Bienvenue
          </p>

          <h2 className="mt-1 truncate text-xl font-bold text-slate-900">
            {username}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Bahá'í Companion
          </p>

        </div>

        <Link
          href="/settings"
          className="hidden rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:block"
        >
          Modifier
        </Link>

      </div>

    </section>

    {/* ===================================================
        STATISTIQUES
    =================================================== */}

    <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="text-2xl">
          🔔
        </div>

        <p className="mt-3 text-2xl font-bold text-slate-900">
          {unreadCount}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Notifications non lues
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="text-2xl">
          📅
        </div>

        <p className="mt-3 text-2xl font-bold text-slate-900">
          —
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Événements à venir
        </p>
      </div>

      <div className="col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:col-span-1">
        <div className="text-2xl">
          📄
        </div>

        <p className="mt-3 text-2xl font-bold text-slate-900">
          —
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Documents importés
        </p>
      </div>

    </section>

    {/* ===================================================
        ACCÈS RAPIDES
    =================================================== */}

    <section className="mt-8">

      <div className="mb-4">

        <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
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

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-2xl">
              🔔
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-2">

                <h3 className="font-semibold text-slate-900">
                  Notifications
                </h3>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Consulter vos rappels et notifications.
              </p>

            </div>

            <span className="text-slate-300 transition group-hover:text-slate-500">
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

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
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

            <span className="text-slate-300 transition group-hover:text-slate-500">
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

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-2xl">
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

            <span className="text-slate-300 transition group-hover:text-slate-500">
              →
            </span>

          </div>

        </Link>

        {/* Paramètres */}

        <Link
          href="/settings"
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
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

            <span className="text-slate-300 transition group-hover:text-slate-500">
              →
            </span>

          </div>

        </Link>

      </div>

    </section>

    {/* ===================================================
        À PROPOS
    =================================================== */}

    <section className="mt-8 rounded-3xl bg-emerald-600 p-6 text-white shadow-sm">

      <div className="flex items-start gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl">
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
            rappels et calendrier bahá'í au même endroit.
          </p>

        </div>

      </div>

    </section>

  </div>

  {/* =====================================================
      NAVIGATION PWA
  ===================================================== */}

  <BottomNavigation />
</main>


);
}
