"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  apiFetch,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api";

import type { CalendarEvent } from "@/types/event";

import BottomNavigation from "@/components/navigation/BottomNavigation";

import {
  getTodayCalendar,
  getNextBahaiEvent,
  getBahaiEvents,
} from "@/services/calendarApi";

import type {
  BahaiDate,
  BahaiEvent,
} from "@/types/calendar";


// ============================================================
// TYPES
// ============================================================

type NotificationItem = {
  id: number;

  title: string;

  message: string;

  event_source: string;

  event_id: number | null;

  scheduled_for: string;

  created_at: string;

  status: "PENDING" | "READ" | string;

  read_at: string | null;
};


// ============================================================
// JOURS DE LA SEMAINE
// ============================================================

const WEEK_DAYS = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
];


// ============================================================
// MOIS BAHÁ'ÍS
// ============================================================

const BAHÁI_MONTHS = [
  ["Bahá", "Splendeur"],
  ["Jalál", "Gloire"],
  ["Jamál", "Beauté"],
  ["'Azamat", "Grandeur"],
  ["Núr", "Lumière"],
  ["Rahmat", "Miséricorde"],
  ["Kalimát", "Paroles"],
  ["Kamál", "Perfection"],
  ["Asmá'", "Noms"],
  ["'Izzat", "Puissance"],
  ["Mashíyyat", "Volonté"],
  ["'Ilm", "Connaissance"],
  ["Qudrat", "Pouvoir"],
  ["Qawl", "Parole"],
  ["Masá'il", "Questions"],
  ["Sharaf", "Honneur"],
  ["Sultán", "Souveraineté"],
  ["Mulk", "Domination"],
  ["'Alá", "Élévation"],
] as const;


// ============================================================
// OUTILS
// ============================================================

function formatTime(time: string | null) {
  if (!time) {
    return "Heure non définie";
  }

  return time.substring(0, 5);
}


function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}


function dateToString(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function getMonthName(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
}


// ============================================================
// PAGE
// ============================================================

export default function CalendarPage() {

  const searchParams = useSearchParams();

  const notificationId =
    searchParams.get("notification_id");


  // ==========================================================
  // DATES
  // ==========================================================

  const today = new Date();

  const todayString =
    dateToString(today);


  // ==========================================================
  // ÉVÉNEMENTS PERSONNELS / DOCUMENTS
  // ==========================================================

  const [
    events,
    setEvents,
  ] = useState<CalendarEvent[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<string | null>(null);


  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const [
    notifications,
    setNotifications,
  ] = useState<NotificationItem[]>([]);


  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);


  const [
    notificationsError,
    setNotificationsError,
  ] = useState<string | null>(null);


  const [
    markingAllRead,
    setMarkingAllRead,
  ] = useState(false);


  // ==========================================================
  // MOIS COURANT
  // ==========================================================

  const [
    currentMonth,
    setCurrentMonth,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    ),
  );


  const [
    selectedDate,
    setSelectedDate,
  ] = useState(todayString);


  // ==========================================================
  // CALENDRIER BAHÁ'Í
  // ==========================================================

  const [
    bahaiDate,
    setBahaiDate,
  ] = useState<BahaiDate | null>(null);


  const [
    nextBahaiEvent,
    setNextBahaiEvent,
  ] = useState<BahaiEvent | null>(null);


  const [
    bahaiCalendarLoading,
    setBahaiCalendarLoading,
  ] = useState(true);


  const [
    bahaiCalendarError,
    setBahaiCalendarError,
  ] = useState<string | null>(null);


  // ==========================================================
  // ÉVÉNEMENTS BAHÁ'ÍS DE L'ANNÉE
  // ==========================================================

  const [
    bahaiEvents,
    setBahaiEvents,
  ] = useState<BahaiEvent[]>([]);


  const [
    bahaiEventsLoading,
    setBahaiEventsLoading,
  ] = useState(false);


  const [
    bahaiEventsError,
    setBahaiEventsError,
  ] = useState<string | null>(null);


  // ==========================================================
  // CHARGEMENT DU CALENDRIER BAHÁ'Í
  // ==========================================================

  useEffect(() => {

    async function loadBahaiCalendar() {

      try {

        setBahaiCalendarLoading(true);

        setBahaiCalendarError(null);


        const [
          todayResponse,
          nextEventResponse,
        ] = await Promise.all([
          getTodayCalendar(),
          getNextBahaiEvent(),
        ]);


        setBahaiDate(
          todayResponse.bahai_date,
        );


        setNextBahaiEvent(
          nextEventResponse.event,
        );

      } catch (error) {

        console.error(
          "❌ Impossible de charger le calendrier bahá'í :",
          error,
        );


        setBahaiCalendarError(
          error instanceof Error
            ? error.message
            : "Impossible de charger le calendrier bahá'í.",
        );

      } finally {

        setBahaiCalendarLoading(false);

      }

    }


    loadBahaiCalendar();

  }, []);


  // ==========================================================
  // CHARGEMENT DES ÉVÉNEMENTS PERSONNELS / DOCUMENTS
  // ==========================================================

  useEffect(() => {

    async function loadEvents() {

      try {

        setLoading(true);

        setError(null);


        const data =
          await apiFetch("/api/events/");


        const normalizedEvents: CalendarEvent[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.events)
              ? data.events
              : [];


        setEvents(
          normalizedEvents,
        );

      } catch (err) {

        console.error(
          "❌ Impossible de charger les événements :",
          err,
        );


        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les événements.",
        );

      } finally {

        setLoading(false);

      }

    }


    loadEvents();

  }, []);


  // ==========================================================
  // CHARGEMENT DES ÉVÉNEMENTS BAHÁ'ÍS
  // ==========================================================

  useEffect(() => {

    async function loadBahaiEvents() {

      try {

        setBahaiEventsLoading(true);

        setBahaiEventsError(null);


        const year =
          currentMonth.getFullYear();


        const response =
          await getBahaiEvents(year);


        setBahaiEvents(
          response.events ?? [],
        );

      } catch (error) {

        console.error(
          "❌ Impossible de charger les événements bahá'ís :",
          error,
        );


        setBahaiEventsError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les événements bahá'ís.",
        );

      } finally {

        setBahaiEventsLoading(false);

      }

    }


    loadBahaiEvents();

  }, [currentMonth]);


  // ==========================================================
  // NOTIFICATION OUVERTE DEPUIS UNE NOTIFICATION PUSH
  // ==========================================================

  useEffect(() => {

    if (!notificationId) {
      return;
    }


    const id =
      Number(notificationId);


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      console.warn(
        "⚠️ notification_id invalide :",
        notificationId,
      );

      return;
    }


    async function markAsRead() {

      try {

        console.log(
          "📖 Marquage notification comme lue :",
          id,
        );


        await markNotificationAsRead(id);


        console.log(
          "✅ Notification marquée comme lue :",
          id,
        );

      } catch (error) {

        console.error(
          "❌ Impossible de marquer la notification comme lue :",
          error,
        );

      }

    }


    markAsRead();

  }, [notificationId]);


  // ==========================================================
  // CHARGEMENT DES NOTIFICATIONS
  // ==========================================================

  useEffect(() => {

    async function loadNotifications() {

      try {

        setNotificationsLoading(true);

        setNotificationsError(null);


        const data =
          await getNotifications();


        const normalizedNotifications:
          NotificationItem[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : Array.isArray(data?.notifications)
                ? data.notifications
                : [];


        setNotifications(
          normalizedNotifications,
        );

      } catch (error) {

        console.error(
          "❌ Impossible de charger les notifications :",
          error,
        );


        setNotificationsError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les notifications.",
        );

      } finally {

        setNotificationsLoading(false);

      }

    }


    loadNotifications();

  }, []);


  // ==========================================================
  // MARQUER UNE NOTIFICATION COMME LUE
  // ==========================================================

  async function handleMarkNotificationAsRead(
    notificationId: number,
  ) {

    try {

      await markNotificationAsRead(
        notificationId,
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
                : notification,
          ),
      );


      console.log(
        "✅ Notification marquée comme lue :",
        notificationId,
      );

    } catch (error) {

      console.error(
        "❌ Impossible de marquer la notification comme lue :",
        error,
      );

    }

  }


  // ==========================================================
  // MARQUER TOUTES LES NOTIFICATIONS COMME LUES
  // ==========================================================

  async function handleMarkAllNotificationsAsRead() {

    try {

      setMarkingAllRead(true);


      await markAllNotificationsAsRead();


      setNotifications(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              status: "READ",
              read_at:
                notification.read_at ??
                new Date().toISOString(),
            }),
          ),
      );


      console.log(
        "✅ Toutes les notifications sont marquées comme lues.",
      );

    } catch (error) {

      console.error(
        "❌ Impossible de marquer toutes les notifications comme lues :",
        error,
      );

    } finally {

      setMarkingAllRead(false);

    }

  }


  // ==========================================================
  // JOURS DU MOIS
  // ==========================================================

  const calendarDays = useMemo(() => {

    const year =
      currentMonth.getFullYear();

    const month =
      currentMonth.getMonth();


    const firstDay =
      new Date(
        year,
        month,
        1,
      );


    const lastDay =
      new Date(
        year,
        month + 1,
        0,
      );


    /*
     * JavaScript :
     *
     * Dimanche = 0
     * Lundi = 1
     *
     * Nous voulons :
     *
     * Lundi = 0
     * ...
     * Dimanche = 6
     */

    const firstWeekDay =
      (firstDay.getDay() + 6) % 7;


    const totalDays =
      lastDay.getDate();


    const cells:
      (Date | null)[] = [];


    for (
      let i = 0;
      i < firstWeekDay;
      i++
    ) {

      cells.push(null);

    }


    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {

      cells.push(
        new Date(
          year,
          month,
          day,
        ),
      );

    }


    while (
      cells.length % 7 !== 0
    ) {

      cells.push(null);

    }


    return cells;

  }, [currentMonth]);


  // ==========================================================
  // ÉVÉNEMENTS DE LA DATE SÉLECTIONNÉE
  // ==========================================================

  const selectedEvents =
    useMemo(() => {

      return events
        .filter(
          (event) =>
            event.date ===
            selectedDate,
        )
        .sort(
          (a, b) =>
            (
              a.start_time || ""
            ).localeCompare(
              b.start_time || "",
            ),
        );

    }, [
      events,
      selectedDate,
    ]);


  // ==========================================================
  // ÉVÉNEMENTS BAHÁ'ÍS DE LA DATE SÉLECTIONNÉE
  // ==========================================================

  const selectedBahaiEvents =
    useMemo(() => {

      return bahaiEvents
        .filter(
          (event) =>
            event.date ===
            selectedDate,
        )
        .sort(
          (a, b) =>
            a.name.localeCompare(
              b.name,
            ),
        );

    }, [
      bahaiEvents,
      selectedDate,
    ]);


  // ==========================================================
  // PROCHAINS ÉVÉNEMENTS PERSONNELS
  // ==========================================================

  const upcomingEvents =
    useMemo(() => {

      return [...events]
        .filter(
          (event) =>
            event.date >=
            todayString,
        )
        .sort(
          (a, b) => {

            if (
              a.date !==
              b.date
            ) {

              return a.date.localeCompare(
                b.date,
              );

            }


            return (
              a.start_time || ""
            ).localeCompare(
              b.start_time || "",
            );

          },
        )
        .slice(0, 5);

    }, [
      events,
      todayString,
    ]);


  // ==========================================================
  // PROCHAINS ÉVÉNEMENTS BAHÁ'ÍS
  // ==========================================================

  const upcomingBahaiEvents =
    useMemo(() => {

      return [...bahaiEvents]
        .filter(
          (event) =>
            event.date >=
            todayString,
        )
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date,
            ),
        )
        .slice(0, 5);

    }, [
      bahaiEvents,
      todayString,
    ]);


  // ==========================================================
  // ÉVÉNEMENTS D'UNE DATE
  // ==========================================================

  function getEventsForDate(
    targetDate: Date,
  ) {

    const dateString =
      dateToString(
        targetDate,
      );


    return events.filter(
      (event) =>
        event.date ===
        dateString,
    );

  }


  // ==========================================================
  // ÉVÉNEMENTS BAHÁ'ÍS D'UNE DATE
  // ==========================================================

  function getBahaiEventsForDate(
    targetDate: Date,
  ) {

    const dateString =
      dateToString(
        targetDate,
      );


    return bahaiEvents.filter(
      (event) =>
        event.date ===
        dateString,
    );

  }


  // ==========================================================
  // NAVIGATION MOIS
  // ==========================================================

  function previousMonth() {

    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1,
      ),
    );

  }


  function nextMonth() {

    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      ),
    );

  }


  function goToToday() {

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );


    setSelectedDate(
      todayString,
    );

  }


  // ==========================================================
  // NOTIFICATIONS NON LUES
  // ==========================================================

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        notification.status !==
        "READ",
    );


  const unreadCount =
    unreadNotifications.length;


  // ==========================================================
  // RENDU
  // ==========================================================

  return (

    <main className="min-h-screen bg-slate-50 pb-24">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-white px-5 pb-5 pt-7">

        <div className="mx-auto max-w-6xl">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500">
                Mon agenda
              </p>

              <h1 className="text-2xl font-bold text-slate-900">
                Calendrier
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


      {/* =====================================================
          CONTENU
      ===================================================== */}

      <div className="mx-auto max-w-6xl px-4 py-6">


        {/* ===================================================
            CALENDRIER MENSUEL
        =================================================== */}

        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">


          {/* NAVIGATION */}

          <div className="mb-6 flex items-center justify-between gap-3">

            <button
              onClick={previousMonth}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-lg text-slate-700 transition hover:bg-slate-300"
              aria-label="Mois précédent"
            >
              ←
            </button>


            <div className="text-center">

              <h2 className="text-xl font-bold capitalize text-slate-900">
                {getMonthName(
                  currentMonth,
                )}
              </h2>


              <button
                onClick={goToToday}
                className="mt-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                Aujourd'hui
              </button>

            </div>


            <button
              onClick={nextMonth}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-lg text-slate-700 transition hover:bg-slate-300"
              aria-label="Mois suivant"
            >
              →
            </button>

          </div>


          {/* JOURS DE LA SEMAINE */}

          <div className="grid grid-cols-7 border-b border-slate-200 pb-2">

            {WEEK_DAYS.map(
              (day) => (

                <div
                  key={day}
                  className="text-center text-xs font-bold uppercase tracking-wide text-slate-700"
                >
                  {day}
                </div>

              ),
            )}

          </div>


          {/* GRILLE */}

          <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">

            {calendarDays.map(
              (date, index) => {

                if (!date) {

                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-16 rounded-xl sm:min-h-24"
                    />
                  );

                }


                const dateString =
                  dateToString(
                    date,
                  );


                const dayEvents =
                  getEventsForDate(
                    date,
                  );


                const dayBahaiEvents =
                  getBahaiEventsForDate(
                    date,
                  );


                const isToday =
                  dateString ===
                  todayString;


                const isSelected =
                  dateString ===
                  selectedDate;


                const hasPersonalEvents =
                  dayEvents.length >
                  0;


                const hasBahaiEvents =
                  dayBahaiEvents.length >
                  0;


                return (

                  <button
                    key={dateString}
                    onClick={() =>
                      setSelectedDate(
                        dateString,
                      )
                    }
                    className={`
                      relative min-h-16 rounded-xl p-2 text-left transition sm:min-h-24
                      ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-slate-50 hover:bg-emerald-50"
                      }
                    `}
                  >

                    {/* NUMÉRO */}

                    <div
                      className={`
                        flex h-8 w-8 items-center justify-center
                        rounded-full
                        text-sm font-bold
                        ${
                          isSelected
                            ? "text-white"
                            : "text-slate-900"
                        }
                        ${
                          isToday &&
                          !isSelected
                            ? "bg-emerald-100 text-emerald-700"
                            : ""
                        }
                      `}
                    >
                      {date.getDate()}
                    </div>


                    {/* INDICATEURS */}

                    {(hasPersonalEvents ||
                      hasBahaiEvents) && (

                      <div className="mt-2 space-y-1">


                        {/* ÉVÉNEMENTS BAHÁ'ÍS */}

                        {hasBahaiEvents && (

                          <div className="flex items-center gap-1">

                            <span
                              className={`
                                h-1.5 w-1.5 shrink-0 rounded-full
                                ${
                                  isSelected
                                    ? "bg-white"
                                    : "bg-amber-500"
                                }
                              `}
                            />

                            <span
                              className={`
                                truncate text-[9px] font-semibold
                                ${
                                  isSelected
                                    ? "text-white"
                                    : "text-amber-700"
                                }
                              `}
                            >
                              {dayBahaiEvents.length}
                              {" "}
                              bahá'í
                            </span>

                          </div>

                        )}


                        {/* ÉVÉNEMENTS PERSONNELS */}

                        {hasPersonalEvents && (

                          <div className="flex items-center gap-1">

                            <span
                              className={`
                                h-1.5 w-1.5 shrink-0 rounded-full
                                ${
                                  isSelected
                                    ? "bg-white"
                                    : "bg-emerald-500"
                                }
                              `}
                            />

                            <span
                              className={`
                                truncate text-[9px] font-semibold
                                ${
                                  isSelected
                                    ? "text-white"
                                    : "text-emerald-700"
                                }
                              `}
                            >
                              {dayEvents.length}
                              {" "}
                              activité
                              {dayEvents.length >
                              1
                                ? "s"
                                : ""}
                            </span>

                          </div>

                        )}

                      </div>

                    )}

                  </button>

                );

              },
            )}

          </div>


          {/* LÉGENDE */}

          <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs text-slate-500">
                Activité
              </span>

            </div>


            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-amber-500" />

              <span className="text-xs text-slate-500">
                Événement bahá'í
              </span>

            </div>

          </div>

        </section>


        {/* ===================================================
            DATE SÉLECTIONNÉE
        =================================================== */}

        <section className="mt-6 rounded-3xl bg-emerald-600 p-5 text-white shadow-sm">

          <p className="text-sm text-emerald-100">
            Date sélectionnée
          </p>

          <h2 className="mt-1 text-xl font-bold capitalize">
            {formatDate(
              selectedDate,
            )}
          </h2>

        </section>


        {/* ===================================================
            ÉVÉNEMENTS BAHÁ'ÍS DE LA DATE
        =================================================== */}

        <section className="mt-6">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <p className="text-sm font-medium uppercase tracking-[0.15em] text-amber-500">
                Calendrier bahá'í
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Événements bahá'ís
              </h2>

            </div>


            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {selectedBahaiEvents.length}
            </span>

          </div>


          {bahaiEventsLoading && (

            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

              <div className="text-3xl">
                ⏳
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Chargement des événements bahá'ís...
              </p>

            </div>

          )}


          {!bahaiEventsLoading &&
            bahaiEventsError && (

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                <div className="text-2xl">
                  ⚠️
                </div>

                <h3 className="mt-2 font-semibold text-red-800">
                  Impossible de charger les événements bahá'ís
                </h3>

                <p className="mt-1 text-sm text-red-700">
                  {bahaiEventsError}
                </p>

              </div>

            )}


          {!bahaiEventsLoading &&
            !bahaiEventsError &&
            selectedBahaiEvents.length === 0 && (

              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">

                <div className="text-4xl">
                  🌿
                </div>

                <h3 className="mt-3 font-bold text-slate-900">
                  Aucun événement bahá'í
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Aucun événement bahá'í n'est prévu pour cette date.
                </p>

              </div>

            )}


          {!bahaiEventsLoading &&
            !bahaiEventsError &&
            selectedBahaiEvents.length >
              0 && (

              <div className="space-y-3">

                {selectedBahaiEvents.map(
                  (event) => (

                    <article
                      key={event.code}
                      className={`
                        rounded-2xl border p-5 shadow-sm
                        ${
                          event.is_holy_day
                            ? "border-amber-200 bg-amber-50"
                            : "border-emerald-100 bg-emerald-50"
                        }
                      `}
                    >

                      <div className="flex gap-4">


                        {/* ICÔNE */}

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                          {event.icon ||
                            "🌿"}
                        </div>


                        {/* CONTENU */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-bold text-slate-900">
                              {event.name}
                            </h3>


                            {event.is_holy_day && (

                              <span className="rounded-full bg-amber-200 px-2 py-1 text-[10px] font-bold text-amber-800">
                                JOUR SAINT
                              </span>

                            )}


                            {event.event_type ===
                              "FEAST" && (

                              <span className="rounded-full bg-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-800">
                                FÊTE
                              </span>

                            )}

                          </div>


                          {event.description && (

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {event.description}
                            </p>

                          )}


                          {event.work_suspension && (

                            <div className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              🕊️ Suspension du travail
                            </div>

                          )}

                        </div>

                      </div>

                    </article>

                  ),
                )}

              </div>

            )}

        </section>


        {/* ===================================================
            ACTIVITÉS DU JOUR
        =================================================== */}

        <section className="mt-10">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
                Agenda
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Activités du jour
              </h2>

            </div>


            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {selectedEvents.length}
            </span>

          </div>


          {loading && (

            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

              <div className="text-3xl">
                ⏳
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Chargement des événements...
              </p>

            </div>

          )}


          {!loading && error && (

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

              <div className="text-2xl">
                ⚠️
              </div>

              <h2 className="mt-2 font-semibold text-red-800">
                Impossible de charger les événements
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

            </div>

          )}


          {!loading &&
            !error &&
            selectedEvents.length === 0 && (

              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">

                <div className="text-5xl">
                  📅
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Aucune activité
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Aucun événement n'est prévu pour cette date.
                </p>

              </div>

            )}


          {!loading &&
            !error &&
            selectedEvents.length >
              0 && (

              <div className="space-y-3">

                {selectedEvents.map(
                  (event) => (

                    <article
                      key={`${event.source}-${event.id}`}
                      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
                    >

                      <div className="flex gap-4">


                        {/* HEURE */}

                        <div className="w-16 shrink-0">

                          <p className="text-sm font-bold text-emerald-600">
                            {formatTime(
                              event.start_time,
                            )}
                          </p>


                          {event.end_time && (

                            <p className="mt-1 text-xs text-slate-400">
                              →
                              {" "}
                              {formatTime(
                                event.end_time,
                              )}
                            </p>

                          )}

                        </div>


                        {/* CONTENU */}

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-3">

                            <h3 className="font-bold text-slate-900">
                              {event.title}
                            </h3>


                            <span
                              className={
                                event.source ===
                                "document"
                                  ? "rounded-full bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700"
                                  : "rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700"
                              }
                            >
                              {event.source ===
                              "document"
                                ? "DOCUMENT"
                                : "PERSONNEL"}
                            </span>

                          </div>


                          {event.location && (

                            <p className="mt-2 text-sm text-slate-500">
                              📍{" "}
                              {event.location}
                            </p>

                          )}


                          {event.responsible && (

                            <p className="mt-1 text-sm text-slate-500">
                              👤{" "}
                              {event.responsible}
                            </p>

                          )}


                          {event.description && (

                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {event.description}
                            </p>

                          )}


                          {event.source ===
                            "document" && (

                            <div className="mt-3">

                              <span className="text-xs text-slate-400">
                                Confiance
                              </span>

                              <span className="ml-2 text-xs font-semibold text-emerald-600">
                                {Math.round(
                                  event.confidence *
                                    100,
                                )}
                                %
                              </span>

                            </div>

                          )}

                        </div>

                      </div>

                    </article>

                  ),
                )}

              </div>

            )}

        </section>


        {/* ===================================================
            PROCHAINS ÉVÉNEMENTS PERSONNELS
        =================================================== */}

        {!loading &&
          !error &&
          upcomingEvents.length >
            0 && (

            <section className="mt-10">

              <div className="mb-5">

                <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
                  À venir
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Prochains événements
                </h2>

              </div>


              <div className="space-y-3">

                {upcomingEvents.map(
                  (event) => (

                    <article
                      key={`${event.source}-upcoming-${event.id}`}
                      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
                    >

                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                          {event.source ===
                          "document"
                            ? "📄"
                            : "📅"}
                        </div>


                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-semibold text-slate-900">
                              {event.title}
                            </h3>


                            <span
                              className={
                                event.source ===
                                "document"
                                  ? "rounded-full bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700"
                                  : "rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700"
                              }
                            >
                              {event.source ===
                              "document"
                                ? "DOCUMENT"
                                : "PERSONNEL"}
                            </span>

                          </div>


                          <p className="mt-1 text-sm text-slate-500">

                            {formatDate(
                              event.date,
                            )}

                            {event.start_time
                              ? ` · ${formatTime(
                                  event.start_time,
                                )}`
                              : ""}

                          </p>

                        </div>

                      </div>

                    </article>

                  ),
                )}

              </div>

            </section>

          )}


        {/* ===================================================
            PROCHAINS ÉVÉNEMENTS BAHÁ'ÍS
        =================================================== */}

        {!bahaiEventsLoading &&
          upcomingBahaiEvents.length >
            0 && (

            <section className="mt-10">

              <div className="mb-5">

                <p className="text-sm font-medium uppercase tracking-[0.15em] text-amber-500">
                  Calendrier bahá'í
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Prochains événements bahá'ís
                </h2>

              </div>


              <div className="space-y-3">

                {upcomingBahaiEvents.map(
                  (event) => (

                    <article
                      key={`bahai-upcoming-${event.code}`}
                      className={`
                        rounded-2xl border p-5 shadow-sm
                        ${
                          event.is_holy_day
                            ? "border-amber-200 bg-amber-50"
                            : "border-emerald-100 bg-white"
                        }
                      `}
                    >

                      <div className="flex items-center gap-4">


                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                          {event.icon ||
                            "🌿"}
                        </div>


                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-semibold text-slate-900">
                              {event.name}
                            </h3>


                            {event.is_holy_day && (

                              <span className="rounded-full bg-amber-200 px-2 py-1 text-[10px] font-bold text-amber-800">
                                JOUR SAINT
                              </span>

                            )}


                            {event.event_type ===
                              "FEAST" && (

                              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                FÊTE
                              </span>

                            )}

                          </div>


                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(
                              event.date,
                            )}
                          </p>

                        </div>

                      </div>

                    </article>

                  ),
                )}

              </div>

            </section>

          )}


        {/* ===================================================
            CALENDRIER BAHÁ'Í — AUJOURD'HUI
        =================================================== */}

        <section className="mt-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">


          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              🌿
            </div>


            <div>

              <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
                Calendrier bahá'í
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Aujourd'hui dans le calendrier bahá'í
              </h2>

            </div>

          </div>


          {/* CHARGEMENT */}

          {bahaiCalendarLoading && (

            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">

              <div className="text-3xl">
                ⏳
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Calcul de la date bahá'íe...
              </p>

            </div>

          )}


          {/* ERREUR */}

          {!bahaiCalendarLoading &&
            bahaiCalendarError && (

              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">

                <div className="text-2xl">
                  ⚠️
                </div>

                <h3 className="mt-2 font-semibold text-red-800">
                  Impossible de charger le calendrier
                </h3>

                <p className="mt-1 text-sm text-red-700">
                  {bahaiCalendarError}
                </p>

              </div>

            )}


          {/* DATE BAHÁ'ÍE */}

          {!bahaiCalendarLoading &&
            !bahaiCalendarError &&
            bahaiDate && (

              <div className="mt-6">


                <div className="rounded-3xl bg-emerald-600 p-6 text-white">

                  <p className="text-sm text-emerald-100">
                    Année bahá'íe{" "}
                    {bahaiDate.year}
                  </p>


                  <div className="mt-3 flex items-end gap-3">

                    <span className="text-5xl font-bold">
                      {bahaiDate.day}
                    </span>


                    <div className="pb-1">

                      <p className="text-xl font-bold">
                        {bahaiDate.month_name}
                      </p>

                      <p className="text-sm text-emerald-100">
                        {bahaiDate.month_meaning}
                      </p>

                    </div>

                  </div>


                  <p className="mt-4 text-sm text-emerald-100">
                    {bahaiDate.day}ᵉ jour du mois de{" "}
                    {bahaiDate.month_name}
                  </p>

                </div>


                {/* PROCHAIN ÉVÉNEMENT */}

                {nextBahaiEvent && (

                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

                    <div className="flex items-start gap-4">


                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                        {nextBahaiEvent.icon ||
                          "🌿"}
                      </div>


                      <div className="min-w-0 flex-1">

                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                          Prochain événement bahá'í
                        </p>


                        <h3 className="mt-1 font-bold text-slate-900">
                          {nextBahaiEvent.name}
                        </h3>


                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(
                            nextBahaiEvent.date,
                          )}
                        </p>


                        {nextBahaiEvent.description && (

                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {nextBahaiEvent.description}
                          </p>

                        )}


                        {nextBahaiEvent.work_suspension && (

                          <div className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            🕊️ Jour de suspension du travail
                          </div>

                        )}

                      </div>

                    </div>

                  </div>

                )}

              </div>

            )}

        </section>


        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        <section className="mt-10">


          <div className="mb-5 flex items-center justify-between">

            <div>

              <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
                Rappels
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Notifications
              </h2>

            </div>


            {unreadCount > 0 && (

              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                {unreadCount} non lue
                {unreadCount > 1
                  ? "s"
                  : ""}
              </span>

            )}

          </div>


          {/* CHARGEMENT */}

          {notificationsLoading && (

            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">

              <div className="text-2xl">
                🔔
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Chargement des notifications...
              </p>

            </div>

          )}


          {/* ERREUR */}

          {!notificationsLoading &&
            notificationsError && (

              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                <div className="text-2xl">
                  ⚠️
                </div>

                <p className="mt-2 text-sm text-red-700">
                  {notificationsError}
                </p>

              </div>

            )}


          {/* AUCUNE NOTIFICATION */}

          {!notificationsLoading &&
            !notificationsError &&
            notifications.length === 0 && (

              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">

                <div className="text-4xl">
                  🔕
                </div>

                <h3 className="mt-3 font-bold text-slate-900">
                  Aucune notification
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Tu es à jour.
                </p>

              </div>

            )}


          {/* NOTIFICATIONS */}

          {!notificationsLoading &&
            !notificationsError &&
            notifications.length > 0 && (

              <div className="space-y-3">


                {/* TOUT MARQUER COMME LU */}

                {unreadCount > 0 && (

                  <div className="mb-3 flex justify-end">

                    <button
                      onClick={
                        handleMarkAllNotificationsAsRead
                      }
                      disabled={
                        markingAllRead
                      }
                      className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                    >
                      {markingAllRead
                        ? "Traitement..."
                        : "Tout marquer comme lu"}
                    </button>

                  </div>

                )}


                {/* LISTE */}

                {notifications
                  .slice(0, 5)
                  .map(
                    (
                      notification,
                    ) => {

                      const isUnread =
                        notification.status !==
                        "READ";


                      return (

                        <article
                          key={
                            notification.id
                          }
                          className={`
                            rounded-2xl border p-5 transition
                            ${
                              isUnread
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-100 bg-white"
                            }
                          `}
                        >

                          <div className="flex gap-4">


                            {/* ICÔNE */}

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                              {isUnread
                                ? "🔔"
                                : "🔕"}
                            </div>


                            {/* CONTENU */}

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-3">

                                <div>

                                  <h3 className="font-bold text-slate-900">
                                    {
                                      notification.title
                                    }
                                  </h3>


                                  <p className="mt-1 text-sm leading-6 text-slate-600">
                                    {
                                      notification.message
                                    }
                                  </p>

                                </div>


                                {isUnread && (

                                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

                                )}

                              </div>


                              <div className="mt-3 flex flex-wrap items-center gap-2">

                                {notification.event_source && (

                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                    {
                                      notification.event_source
                                    }
                                  </span>

                                )}


                                <span className="text-xs text-slate-400">
                                  {notification.scheduled_for
                                    ? formatDate(
                                        notification.scheduled_for.slice(
                                          0,
                                          10,
                                        ),
                                      )
                                    : "Date non définie"}
                                </span>

                              </div>


                              {isUnread && (

                                <button
                                  onClick={() =>
                                    handleMarkNotificationAsRead(
                                      notification.id,
                                    )
                                  }
                                  className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                                >
                                  ✓ Marquer comme lue
                                </button>

                              )}

                            </div>

                          </div>

                        </article>

                      );

                    },
                  )}

              </div>

            )}

        </section>

      </div>


      {/* =====================================================
          NAVIGATION PWA
      ===================================================== */}

      <BottomNavigation />

    </main>

  );

}