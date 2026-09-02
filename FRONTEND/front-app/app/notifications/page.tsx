"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
getNotifications,
markNotificationAsRead,
deleteNotification,
markAllNotificationsAsRead,
} from "@/lib/api";

import BottomNavigation from "@/components/navigation/BottomNavigation";

/* =========================================================
TYPES
========================================================= */

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

/* =========================================================
OUTILS
========================================================= */

function formatDate(date: string | null) {
if (!date) {
return "";
}

const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) {
return "";
}

return new Intl.DateTimeFormat("fr-FR", {
day: "numeric",
month: "long",
year: "numeric",
}).format(parsedDate);
}

function formatTime(date: string | null) {
if (!date) {
return "";
}

const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) {
return "";
}

return new Intl.DateTimeFormat("fr-FR", {
hour: "2-digit",
minute: "2-digit",
}).format(parsedDate);
}

function formatRelativeDate(date: string | null) {
if (!date) {
return "";
}

const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) {
return "";
}

const now = new Date();
const difference = now.getTime() - parsedDate.getTime();

const minutes = Math.floor(difference / 60000);
const hours = Math.floor(difference / 3600000);
const days = Math.floor(difference / 86400000);

if (minutes < 1) {
return "À l'instant";
}

if (minutes < 60) {
return `Il y a ${minutes} min`;
}

if (hours < 24) {
return `Il y a ${hours} h`;
}

if (days === 1) {
return "Hier";
}

if (days < 7) {
return `Il y a ${days} jours`;
}

return formatDate(date);
}

/* =========================================================
PAGE
========================================================= */

export default function NotificationsPage() {
const [notifications, setNotifications] = useState<
NotificationItem[]

> ([]);

const [loading, setLoading] = useState(true);

const [refreshing, setRefreshing] = useState(false);

const [error, setError] = useState<string | null>(null);

const [markingAllRead, setMarkingAllRead] =
useState(false);

const [markingReadId, setMarkingReadId] =
useState<number | null>(null);

const [deletingId, setDeletingId] =
useState<number | null>(null);

/* =======================================================
CHARGEMENT
======================================================= */

const loadNotifications = useCallback(
async (showFullLoader = true) => {
try {
if (showFullLoader) {
setLoading(true);
} else {
setRefreshing(true);
}

    setError(null);

    const data = await getNotifications();

    console.log(
      "🔔 Notifications reçues :",
      data
    );

    const normalizedNotifications: NotificationItem[] =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.notifications)
            ? data.notifications
            : [];

    setNotifications(
      normalizedNotifications
    );
  } catch (error) {
    console.error(
      "❌ Erreur chargement notifications :",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Impossible de charger les notifications."
    );
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
},
[]

);

useEffect(() => {
loadNotifications();
}, [loadNotifications]);

/* =======================================================
STATISTIQUES
======================================================= */

const unreadCount = useMemo(() => {
return notifications.filter(
(notification) =>
notification.status !== "READ"
).length;
}, [notifications]);

const readCount = useMemo(() => {
return notifications.filter(
(notification) =>
notification.status === "READ"
).length;
}, [notifications]);

const totalCount = notifications.length;

/* =======================================================
MARQUER UNE NOTIFICATION COMME LUE
======================================================= */

async function handleMarkAsRead(
notificationId: number
) {
try {
setMarkingReadId(notificationId);

  await markNotificationAsRead(
    notificationId
  );

  console.log(
    "✅ Notification marquée comme lue :",
    notificationId
  );

  setNotifications(
    (previous) =>
      previous.map(
        (notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                status: "READ",
                read_at:
                  new Date().toISOString(),
              }
            : notification
      )
  );
} catch (error) {
  console.error(
    "❌ Erreur marquage notification :",
    error
  );

  alert(
    error instanceof Error
      ? error.message
      : "Impossible de marquer la notification comme lue."
  );
} finally {
  setMarkingReadId(null);
}

}

/* =======================================================
TOUT MARQUER COMME LU
======================================================= */

async function handleMarkAllAsRead() {
if (unreadCount === 0) {
return;
}

try {
  setMarkingAllRead(true);

  await markAllNotificationsAsRead();

  console.log(
    "✅ Toutes les notifications sont lues."
  );

  const readAt =
    new Date().toISOString();

  setNotifications(
    (previous) =>
      previous.map(
        (notification) => ({
          ...notification,
          status: "READ",
          read_at:
            notification.read_at ??
            readAt,
        })
      )
  );
} catch (error) {
  console.error(
    "❌ Erreur marquage global :",
    error
  );

  alert(
    error instanceof Error
      ? error.message
      : "Impossible de marquer toutes les notifications comme lues."
  );
} finally {
  setMarkingAllRead(false);
}

}

/* =======================================================
SUPPRESSION
======================================================= */

async function handleDeleteNotification(
notificationId: number
) {
const confirmed = window.confirm(
"Voulez-vous vraiment supprimer cette notification ?"
);

if (!confirmed) {
  return;
}

try {
  setDeletingId(notificationId);

  await deleteNotification(notificationId);

  setNotifications(
    (current) =>
      current.filter(
        (notification) =>
          notification.id !== notificationId
      )
  );

  console.log(
    "🗑️ Notification supprimée :",
    notificationId
  );
} catch (error) {
  console.error(
    "❌ Impossible de supprimer la notification :",
    error
  );

  alert(
    error instanceof Error
      ? error.message
      : "Impossible de supprimer cette notification."
  );
} finally {
  setDeletingId(null);
}

}

/* =======================================================
RENDU
======================================================= */

return ( <main className="min-h-screen bg-slate-50 pb-28">
{/* =====================================================
HEADER
===================================================== */}

  <header className="relative overflow-hidden border-b bg-white">
    <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-emerald-100/60 blur-3xl" />

    <div className="absolute -left-24 bottom-0 h-40 w-40 rounded-full bg-teal-100/40 blur-3xl" />

    <div className="relative mx-auto max-w-5xl px-5 pb-7 pt-7">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            Centre d'information
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Notifications
            </h1>

            {unreadCount > 0 && (
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Restez informé de vos rappels et événements.
          </p>
        </div>

        <Link
          href="/"
          className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-95"
        >
          ← Accueil
        </Link>
      </div>
    </div>
  </header>

  {/* =====================================================
      CONTENU
  ===================================================== */}

  <div className="mx-auto max-w-5xl px-4 py-6 sm:px-5">
    {/* ===================================================
        STATISTIQUES
    =================================================== */}

    {!loading && !error && (
      <section className="mb-6 grid grid-cols-3 gap-3">
        {/* Total */}

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
            🔔
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {totalCount}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Total
          </p>
        </div>

        {/* Non lues */}

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg">
            🔴
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {unreadCount}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Non lues
          </p>
        </div>

        {/* Lues */}

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg">
            ✓
          </div>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {readCount}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Lues
          </p>
        </div>
      </section>
    )}

    {/* ===================================================
        BARRE D'ACTIONS
    =================================================== */}

    {!loading && !error && notifications.length > 0 && (
      <section className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                État des notifications
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {unreadCount === 0
                  ? "Tout est à jour."
                  : `${unreadCount} notification${
                      unreadCount > 1
                        ? "s"
                        : ""
                    } à consulter.`}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {totalCount} notification
                {totalCount > 1 ? "s" : ""} au total.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  loadNotifications(false)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                >
                  ↻
                </span>

                {refreshing
                  ? "Actualisation..."
                  : "Actualiser"}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAllRead}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {markingAllRead ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      ✓ Tout marquer comme lu
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    )}

    {/* ===================================================
        CHARGEMENT
    =================================================== */}

    {loading && (
      <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <span className="text-3xl">
              🔔
            </span>
          </div>

          <div className="mx-auto mt-5 h-5 w-48 animate-pulse rounded-lg bg-slate-200" />

          <div className="mx-auto mt-3 h-4 w-64 animate-pulse rounded-lg bg-slate-100" />

          <div className="mt-6 space-y-2">
            <div className="h-2 rounded-full bg-slate-100" />
            <div className="mx-auto h-2 w-4/5 rounded-full bg-slate-100" />
          </div>
        </div>
      </section>
    )}

    {/* ===================================================
        ERREUR
    =================================================== */}

    {!loading && error && (
      <section className="overflow-hidden rounded-[2rem] border border-red-200 bg-white shadow-sm">
        <div className="bg-red-50 p-6 sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl">
            ⚠️
          </div>

          <h2 className="mt-5 text-xl font-bold text-red-900">
            Impossible de charger les notifications
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadNotifications()
            }
            className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
          >
            ↻ Réessayer
          </button>
        </div>
      </section>
    )}

    {/* ===================================================
        AUCUNE NOTIFICATION
    =================================================== */}

    {!loading &&
      !error &&
      notifications.length === 0 && (
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-4xl">
              🔕
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-900">
              Tout est calme
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Tu n'as aucune notification pour le moment.
              Les nouveaux rappels apparaîtront ici.
            </p>

            <Link
              href="/calendar"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              📅 Voir le calendrier
            </Link>
          </div>
        </section>
      )}

    {/* ===================================================
        LISTE DES NOTIFICATIONS
    =================================================== */}

    {!loading &&
      !error &&
      notifications.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Votre activité
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Notifications récentes
              </h2>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              {totalCount}
            </span>
          </div>

          <div className="space-y-3">
            {notifications.map(
              (notification) => {
                const isRead =
                  notification.status ===
                  "READ";

                const isMarking =
                  markingReadId ===
                  notification.id;

                const isDeleting =
                  deletingId ===
                  notification.id;

                return (
                  <article
                    key={notification.id}
                    className={`group relative overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 transition hover:shadow-md ${
                      isRead
                        ? "ring-slate-200"
                        : "ring-emerald-200"
                    }`}
                  >
                    {/* Barre latérale pour notification non lue */}

                    {!isRead && (
                      <div className="absolute bottom-0 left-0 top-0 w-1 bg-emerald-500" />
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex gap-4">
                        {/* ICÔNE */}

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
                            isRead
                              ? "bg-slate-100"
                              : "bg-emerald-100"
                          }`}
                        >
                          {isRead
                            ? "🔔"
                            : "🔔"}
                        </div>

                        {/* CONTENU */}

                        <div className="min-w-0 flex-1">
                          {/* TITRE + STATUT */}

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  className={`text-base font-bold leading-6 ${
                                    isRead
                                      ? "text-slate-800"
                                      : "text-slate-950"
                                  }`}
                                >
                                  {
                                    notification.title
                                  }
                                </h3>

                                {!isRead && (
                                  <span className="rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                                    Nouvelle
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-slate-400">
                                {formatRelativeDate(
                                  notification.created_at
                                )}
                              </p>
                            </div>

                            {/* SUPPRESSION */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteNotification(
                                  notification.id
                                )
                              }
                              disabled={
                                isDeleting
                              }
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Supprimer"
                              aria-label="Supprimer la notification"
                            >
                              {isDeleting ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
                              ) : (
                                "🗑️"
                              )}
                            </button>
                          </div>

                          {/* MESSAGE */}

                          <p className="mt-4 text-sm leading-6 text-slate-600">
                            {
                              notification.message
                            }
                          </p>

                          {/* MÉTADONNÉES */}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-100">
                              📅
                              {formatDate(
                                notification.created_at
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-100">
                              🕐
                              {formatTime(
                                notification.created_at
                              )}
                            </span>
                          </div>

                          {/* SOURCE */}

                          {notification.event_source && (
                            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
                              <p className="text-xs text-slate-500">
                                <span className="font-semibold text-slate-600">
                                  Source :
                                </span>{" "}
                                {
                                  notification.event_source
                                }

                                {notification.event_id && (
                                  <>
                                    {" "}
                                    · événement #
                                    {
                                      notification.event_id
                                    }
                                  </>
                                )}
                              </p>
                            </div>
                          )}

                          {/* ACTIONS */}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {!isRead && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkAsRead(
                                    notification.id
                                  )
                                }
                                disabled={
                                  isMarking
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isMarking ? (
                                  <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Marquage...
                                  </>
                                ) : (
                                  <>
                                    ✓ Marquer comme lue
                                  </>
                                )}
                              </button>
                            )}

                            {notification.event_id && (
                              <Link
                                href={`/calendar?event_id=${notification.event_id}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]"
                              >
                                📅 Voir l'événement
                              </Link>
                            )}

                            {isRead && (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700">
                                ✓ Déjà lue
                              </span>
                            )}
                          </div>

                          {/* DATE DE LECTURE */}

                          {notification.read_at && (
                            <p className="mt-3 text-[11px] text-slate-400">
                              Lue le{" "}
                              {formatDate(
                                notification.read_at
                              )}{" "}
                              à{" "}
                              {formatTime(
                                notification.read_at
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>
      )}

    {/* ===================================================
        PETIT BLOC FINAL
    =================================================== */}

    {!loading &&
      !error &&
      notifications.length > 0 && (
        <section className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg shadow-emerald-100">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
              🌿
            </div>

            <div>
              <p className="text-sm font-medium text-emerald-100">
                Bahá'í Companion
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Restez connecté à vos rappels
              </h2>

              <p className="mt-2 text-sm leading-6 text-emerald-50">
                Vos notifications vous permettent de
                ne pas manquer vos événements et rappels
                importants.
              </p>
            </div>
          </div>
        </section>
      )}
  </div>

  {/* =====================================================
      NAVIGATION PWA
  ===================================================== */}

  <BottomNavigation />
</main>

);
}
