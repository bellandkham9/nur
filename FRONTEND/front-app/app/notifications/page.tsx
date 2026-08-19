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

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}


function formatTime(date: string | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}


/* =========================================================
   PAGE
========================================================= */

export default function NotificationsPage() {

  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [markingAllRead, setMarkingAllRead] =
    useState(false);

  const [markingReadId, setMarkingReadId] =
    useState<number | null>(null);


  /* =======================================================
     CHARGEMENT
  ======================================================= */

  const loadNotifications = useCallback(
    async () => {
      try {
        setLoading(true);
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
      }
    },
    []
  );


  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);


  /* =======================================================
     COMPTEUR NON LUES
  ======================================================= */

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) =>
        notification.status !== "READ"
    ).length;
  }, [notifications]);


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
              notification.id ===
              notificationId
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

      setNotifications(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              status: "READ",
              read_at:
                notification.read_at ??
                new Date().toISOString(),
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
    await deleteNotification(notificationId);

    setNotifications((current) =>
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
  }
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

        <div className="mx-auto max-w-4xl">

          <div className="flex items-center justify-between gap-4">

            <div>

              <p className="text-sm text-slate-500">
                Centre d'information
              </p>

              <div className="mt-1 flex items-center gap-3">

                <h1 className="text-2xl font-bold text-slate-900">
                  Notifications
                </h1>

                {unreadCount > 0 && (
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}

              </div>

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

      <div className="mx-auto max-w-4xl px-4 py-6">


        {/* =================================================
            BARRE D'ACTIONS
        ================================================= */}

        <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm text-slate-500">
                État des notifications
              </p>

              <p className="mt-1 font-semibold text-slate-900">

                {unreadCount === 0
                  ? "Toutes les notifications sont lues."
                  : `${unreadCount} notification${
                      unreadCount > 1
                        ? "s"
                        : ""
                    } non lue${
                      unreadCount > 1
                        ? "s"
                        : ""
                    }.`}

              </p>

            </div>


            <div className="flex gap-2">

              <button
                type="button"
                onClick={loadNotifications}
                disabled={loading}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              >
                🔄 Actualiser
              </button>


              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAllRead}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {markingAllRead
                    ? "Marquage..."
                    : "Tout marquer comme lu"}
                </button>
              )}

            </div>

          </div>

        </section>


        {/* =================================================
            CHARGEMENT
        ================================================= */}

        {loading && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">

            <div className="text-4xl">
              🔔
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Chargement des notifications...
            </p>

          </div>
        )}


        {/* =================================================
            ERREUR
        ================================================= */}

        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

            <div className="text-3xl">
              ⚠️
            </div>

            <h2 className="mt-3 font-bold text-red-800">
              Impossible de charger les notifications
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadNotifications}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Réessayer
            </button>

          </div>
        )}


        {/* =================================================
            AUCUNE NOTIFICATION
        ================================================= */}

        {!loading &&
          !error &&
          notifications.length === 0 && (

            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">

              <div className="text-6xl">
                🔕
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Aucune notification
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Tu n'as aucune notification
                pour le moment.
              </p>

            </div>
          )}


        {/* =================================================
            LISTE
        ================================================= */}

        {!loading &&
          !error &&
          notifications.length > 0 && (

            <section className="space-y-3">

              {notifications.map(
                (notification) => {

                  const isRead =
                    notification.status ===
                    "READ";

                  return (
                    <article
                      key={notification.id}
                      className={`
                        rounded-3xl p-5 shadow-sm ring-1 transition
                        ${
                          isRead
                            ? "bg-white ring-slate-200"
                            : "bg-emerald-50 ring-emerald-200"
                        }
                      `}
                    >

                      <div className="flex gap-4">


                        {/* ICÔNE */}

                        <div
                          className={`
                            flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl
                            ${
                              isRead
                                ? "bg-slate-100"
                                : "bg-emerald-100"
                            }
                          `}
                        >
                          {isRead
                            ? "🔔"
                            : "🔔"}
                        </div>


                        {/* CONTENU */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-start justify-between gap-3">

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <h2
                                  className={`
                                    font-bold
                                    ${
                                      isRead
                                        ? "text-slate-800"
                                        : "text-slate-900"
                                    }
                                  `}
                                >
                                  {notification.title}
                                </h2>


                                {!isRead && (
                                  <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">
                                    NON LUE
                                  </span>
                                )}

                              </div>

                            </div>


                            <span
                              className={`
                                rounded-full px-2 py-1 text-[10px] font-semibold
                                ${
                                  isRead
                                    ? "bg-slate-100 text-slate-500"
                                    : "bg-emerald-100 text-emerald-700"
                                }
                              `}
                            >
                              {isRead
                                ? "LUE"
                                : "NOUVELLE"}
                            </span>

                          </div>


                          {/* MESSAGE */}

                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {notification.message}
                          </p>


                          {/* DATE */}

                          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">

                            <span>
                              📅{" "}
                              {formatDate(
                                notification.created_at
                              )}
                            </span>

                            <span>
                              🕐{" "}
                              {formatTime(
                                notification.created_at
                              )}
                            </span>

                          </div>


                          {/* SOURCE */}

                          {notification.event_source && (
                            <p className="mt-2 text-xs text-slate-400">
                              Source :{" "}
                              {notification.event_source}
                              {notification.event_id
                                ? ` · événement #${notification.event_id}`
                                : ""}
                            </p>
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
                                  markingReadId ===
                                  notification.id
                                }
                                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-50 disabled:opacity-50"
                              >
                                {markingReadId ===
                                notification.id
                                  ? "Marquage..."
                                  : "✓ Marquer comme lu"}
                              </button>
                            )}


                            {notification.event_id && (
                              <Link
                                href={`/calendar?event_id=${notification.event_id}`}
                                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                              >
                                📅 Voir l'événement
                              </Link>
                            )}

                             <button
                                type="button"
                                onClick={() =>
                                handleDeleteNotification(notification.id)
                                }
                                className="shrink-0 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 transition hover:bg-red-100"
                                title="Supprimer"
                            >
                                🗑️
                            </button>

                          </div>
                          

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </section>
          )}

      </div>


      {/* =================================================
          NAVIGATION PWA
      ================================================= */}

      <BottomNavigation />
    </main>
  );
}