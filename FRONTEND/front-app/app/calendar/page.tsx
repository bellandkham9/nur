"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
// JOURS
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
// OUTILS
// ============================================================

function formatTime(time: string | null) {
  if (!time) return "Heure non définie";
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
// PAGE CONTENT
// ============================================================

function CalendarPageContent() {

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
  // EVENTS
  // ==========================================================

  const [events, setEvents] =
    useState<CalendarEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [notificationsLoading, setNotificationsLoading] =
    useState(false);

  const [notificationsError, setNotificationsError] =
    useState<string | null>(null);

  const [markingAllRead, setMarkingAllRead] =
    useState(false);


  // ==========================================================
  // MONTH
  // ==========================================================

  const [currentMonth, setCurrentMonth] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );

  const [selectedDate, setSelectedDate] =
    useState(todayString);


  // ==========================================================
  // BAHÁ'Í
  // ==========================================================

  const [bahaiDate, setBahaiDate] =
    useState<BahaiDate | null>(null);

  const [nextBahaiEvent, setNextBahaiEvent] =
    useState<BahaiEvent | null>(null);

  const [bahaiCalendarLoading, setBahaiCalendarLoading] =
    useState(true);

  const [bahaiCalendarError, setBahaiCalendarError] =
    useState<string | null>(null);


  const [bahaiEvents, setBahaiEvents] =
    useState<BahaiEvent[]>([]);

  const [bahaiEventsLoading, setBahaiEventsLoading] =
    useState(false);

  const [bahaiEventsError, setBahaiEventsError] =
    useState<string | null>(null);


  // ==========================================================
  // CHARGEMENT CALENDRIER BAHÁ'Í
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
  // CHARGEMENT EVENTS
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

        setEvents(normalizedEvents);

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
  // CHARGEMENT EVENTS BAHÁ'ÍS
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
  // NOTIFICATION PUSH
  // ==========================================================

  useEffect(() => {

    if (!notificationId) return;

    const id =
      Number(notificationId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return;
    }

    async function markAsRead() {

      try {
        await markNotificationAsRead(id);
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
  // NOTIFICATIONS
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
  // MARQUER LU
  // ==========================================================

  async function handleMarkNotificationAsRead(
    notificationId: number,
  ) {

    try {

      await markNotificationAsRead(
        notificationId,
      );

      setNotifications(
        previous =>
          previous.map(
            notification =>
              notification.id === notificationId
                ? {
                    ...notification,
                    status: "READ",
                    read_at:
                      new Date().toISOString(),
                  }
                : notification,
          ),
      );

    } catch (error) {

      console.error(
        "❌ Impossible de marquer la notification comme lue :",
        error,
      );

    }

  }


  // ==========================================================
  // MARQUER TOUT LU
  // ==========================================================

  async function handleMarkAllNotificationsAsRead() {

    try {

      setMarkingAllRead(true);

      await markAllNotificationsAsRead();

      setNotifications(
        previous =>
          previous.map(
            notification => ({
              ...notification,
              status: "READ",
              read_at:
                notification.read_at ??
                new Date().toISOString(),
            }),
          ),
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
  // CALENDAR DAYS
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
  // SELECTED EVENTS
  // ==========================================================

  const selectedEvents =
    useMemo(() => {

      return events
        .filter(
          event =>
            event.date === selectedDate,
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


  const selectedBahaiEvents =
    useMemo(() => {

      return bahaiEvents
        .filter(
          event =>
            event.date === selectedDate,
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
  // UPCOMING
  // ==========================================================

  const upcomingEvents =
    useMemo(() => {

      return [...events]
        .filter(
          event =>
            event.date >= todayString,
        )
        .sort(
          (a, b) => {

            if (
              a.date !== b.date
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


  const upcomingBahaiEvents =
    useMemo(() => {

      return [...bahaiEvents]
        .filter(
          event =>
            event.date >= todayString,
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
  // DATE EVENTS
  // ==========================================================

  function getEventsForDate(
    targetDate: Date,
  ) {

    const dateString =
      dateToString(
        targetDate,
      );

    return events.filter(
      event =>
        event.date === dateString,
    );

  }


  function getBahaiEventsForDate(
    targetDate: Date,
  ) {

    const dateString =
      dateToString(
        targetDate,
      );

    return bahaiEvents.filter(
      event =>
        event.date === dateString,
    );

  }


  // ==========================================================
  // MONTH NAVIGATION
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
  // NOTIFICATIONS
  // ==========================================================

  const unreadCount =
    notifications.filter(
      notification =>
        notification.status !== "READ",
    ).length;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <main className="min-h-screen bg-[#f6f8f7] pb-28 text-slate-900">


      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="relative overflow-hidden bg-white">

        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="mx-auto max-w-6xl px-5 pb-7 pt-7">

          <div className="relative flex items-center justify-between">

            <div>

              <div className="mb-2 flex items-center gap-2">

                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                  🌿
                </span>

                <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                  Bahá'í Companion
                </span>

              </div>

              <h1 className="text-3xl font-black tracking-tight">
                Calendrier
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Ton agenda et les temps forts bahá'ís.
              </p>

            </div>


            <Link
              href="/"
              className="flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
            >
              <span>⌂</span>
              <span className="hidden sm:inline">
                Accueil
              </span>
            </Link>

          </div>

        </div>

      </header>


      {/* ====================================================
          CONTENT
      ==================================================== */}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5">


        {/* ==================================================
            CALENDAR
        ================================================== */}

        <section className="overflow-hidden rounded-4xl bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">


          {/* CALENDAR HEADER */}

          <div className="border-b border-slate-100 px-4 py-5 sm:px-6">

            <div className="flex items-center justify-between">

              <button
                onClick={previousMonth}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl font-medium text-slate-600 transition hover:bg-slate-200 active:scale-95"
                aria-label="Mois précédent"
              >
                ‹
              </button>


              <div className="text-center">

                <h2 className="text-xl font-black capitalize tracking-tight">
                  {getMonthName(
                    currentMonth,
                  )}
                </h2>

                <button
                  onClick={goToToday}
                  className="mt-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Revenir à aujourd'hui
                </button>

              </div>


              <button
                onClick={nextMonth}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl font-medium text-slate-600 transition hover:bg-slate-200 active:scale-95"
                aria-label="Mois suivant"
              >
                ›
              </button>

            </div>

          </div>


          {/* WEEK */}

          <div className="grid grid-cols-7 border-b border-slate-100 px-2 py-3 sm:px-4">

            {WEEK_DAYS.map(day => (

              <div
                key={day}
                className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 sm:text-xs"
              >
                {day}
              </div>

            ))}

          </div>


          {/* DAYS */}

          <div className="grid grid-cols-7 gap-1 p-2 sm:gap-2 sm:p-4">

            {calendarDays.map(
              (date, index) => {

                if (!date) {

                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-18 sm:min-h-24"
                    />
                  );

                }


                const dateString =
                  dateToString(date);

                const dayEvents =
                  getEventsForDate(date);

                const dayBahaiEvents =
                  getBahaiEventsForDate(date);

                const isToday =
                  dateString === todayString;

                const isSelected =
                  dateString === selectedDate;

                const hasPersonalEvents =
                  dayEvents.length > 0;

                const hasBahaiEvents =
                  dayBahaiEvents.length > 0;


                return (

                  <button
                    key={dateString}
                    onClick={() =>
                      setSelectedDate(
                        dateString,
                      )
                    }
                    className={`
                      group relative min-h-18 rounded-2xl p-1.5 text-left transition-all sm:min-h-24 sm:p-2.5
                      ${
                        isSelected
                          ? "bg-emerald-600 shadow-lg shadow-emerald-600/20"
                          : "bg-slate-50 hover:bg-emerald-50"
                      }
                    `}
                  >

                    <div
                      className={`
                        flex h-8 w-8 items-center justify-center rounded-full text-sm font-black sm:h-9 sm:w-9
                        ${
                          isSelected
                            ? "bg-white/15 text-white"
                            : isToday
                              ? "bg-emerald-100 text-emerald-700"
                              : "text-slate-800"
                        }
                      `}
                    >
                      {date.getDate()}
                    </div>


                    {(hasPersonalEvents ||
                      hasBahaiEvents) && (

                      <div className="absolute bottom-2 left-2 right-2 space-y-1">

                        {hasBahaiEvents && (

                          <div className="flex items-center gap-1">

                            <span
                              className={`
                                h-1.5 w-1.5 rounded-full
                                ${
                                  isSelected
                                    ? "bg-amber-200"
                                    : "bg-amber-500"
                                }
                              `}
                            />

                            <span
                              className={`
                                hidden truncate text-[9px] font-bold sm:block
                                ${
                                  isSelected
                                    ? "text-white/80"
                                    : "text-amber-700"
                                }
                              `}
                            >
                              {dayBahaiEvents.length} bahá'í
                            </span>

                          </div>

                        )}


                        {hasPersonalEvents && (

                          <div className="flex items-center gap-1">

                            <span
                              className={`
                                h-1.5 w-1.5 rounded-full
                                ${
                                  isSelected
                                    ? "bg-emerald-100"
                                    : "bg-emerald-500"
                                }
                              `}
                            />

                            <span
                              className={`
                                hidden truncate text-[9px] font-bold sm:block
                                ${
                                  isSelected
                                    ? "text-white/80"
                                    : "text-emerald-700"
                                }
                              `}
                            >
                              {dayEvents.length} activité
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


          {/* LEGEND */}

          <div className="flex flex-wrap gap-5 border-t border-slate-100 px-5 py-4">

            <div className="flex items-center gap-2">

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <span className="text-xs font-medium text-slate-500">
                Activité
              </span>

            </div>

            <div className="flex items-center gap-2">

              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />

              <span className="text-xs font-medium text-slate-500">
                Événement bahá'í
              </span>

            </div>

          </div>

        </section>


        {/* ==================================================
            SELECTED DATE
        ================================================== */}

        <section className="relative mt-5 overflow-hidden rounded-4xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10">

          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl" />

          <div className="relative">

            <div className="flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Date sélectionnée
              </p>

            </div>

            <h2 className="mt-2 text-xl font-black capitalize sm:text-2xl">
              {formatDate(selectedDate)}
            </h2>

          </div>

        </section>


        {/* ==================================================
            BAHÁ'Í EVENTS
        ================================================== */}

        <section className="mt-10">

          <div className="mb-5 flex items-end justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-amber-500" />

                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                  Calendrier sacré
                </p>

              </div>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Événements bahá'ís
              </h2>

            </div>

            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-amber-100 px-3 text-xs font-black text-amber-700">
              {selectedBahaiEvents.length}
            </span>

          </div>


          {bahaiEventsLoading && (

            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
                ⏳
              </div>

              <p className="mt-3 text-sm font-medium text-slate-500">
                Chargement...
              </p>

            </div>

          )}


          {!bahaiEventsLoading &&
            bahaiEventsError && (

              <div className="rounded-3xl border border-red-100 bg-red-50 p-6">

                <div className="flex gap-4">

                  <div className="text-2xl">
                    ⚠️
                  </div>

                  <div>

                    <h3 className="font-bold text-red-800">
                      Impossible de charger les événements
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {bahaiEventsError}
                    </p>

                  </div>

                </div>

              </div>

            )}


          {!bahaiEventsLoading &&
            !bahaiEventsError &&
            selectedBahaiEvents.length === 0 && (

              <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-3xl">
                  🌿
                </div>

                <h3 className="mt-4 font-black">
                  Aucun événement bahá'í
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Aucun événement bahá'í n'est prévu pour cette date.
                </p>

              </div>

            )}


          {!bahaiEventsLoading &&
            !bahaiEventsError &&
            selectedBahaiEvents.length > 0 && (

              <div className="space-y-3">

                {selectedBahaiEvents.map(
                  event => (

                    <article
                      key={event.code}
                      className={`
                        overflow-hidden rounded-3xl border p-5 shadow-sm
                        ${
                          event.is_holy_day
                            ? "border-amber-200 bg-linear-to-br from-amber-50 to-white"
                            : "border-emerald-100 bg-white"
                        }
                      `}
                    >

                      <div className="flex gap-4">

                        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-100">
                          {event.icon || "🌿"}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-black">
                              {event.name}
                            </h3>

                            {event.is_holy_day && (

                              <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[9px] font-black tracking-wide text-amber-800">
                                JOUR SAINT
                              </span>

                            )}

                            {event.event_type === "FEAST" && (

                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-black tracking-wide text-emerald-700">
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

                            <div className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
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


        {/* ==================================================
            DAILY ACTIVITIES
        ================================================== */}

        <section className="mt-10">

          <div className="mb-5 flex items-end justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Mon agenda
                </p>

              </div>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Activités du jour
              </h2>

            </div>

            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-emerald-100 px-3 text-xs font-black text-emerald-700">
              {selectedEvents.length}
            </span>

          </div>


          {loading && (

            <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">

              <div className="text-3xl">
                ⏳
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Chargement des activités...
              </p>

            </div>

          )}


          {!loading && error && (

            <div className="rounded-3xl border border-red-100 bg-red-50 p-6">

              <div className="flex gap-4">

                <span className="text-2xl">
                  ⚠️
                </span>

                <div>

                  <h3 className="font-bold text-red-800">
                    Impossible de charger les activités
                  </h3>

                  <p className="mt-1 text-sm text-red-700">
                    {error}
                  </p>

                </div>

              </div>

            </div>

          )}


          {!loading &&
            !error &&
            selectedEvents.length === 0 && (

              <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-3xl">
                  📅
                </div>

                <h3 className="mt-4 font-black">
                  Journée libre
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Aucune activité n'est prévue pour cette date.
                </p>

              </div>

            )}


          {!loading &&
            !error &&
            selectedEvents.length > 0 && (

              <div className="space-y-3">

                {selectedEvents.map(
                  event => (

                    <article
                      key={`${event.source}-${event.id}`}
                      className="group rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
                    >

                      <div className="flex gap-4">

                        <div className="w-16 shrink-0">

                          <p className="text-sm font-black text-emerald-600">
                            {formatTime(
                              event.start_time,
                            )}
                          </p>

                          {event.end_time && (

                            <p className="mt-1 text-xs font-medium text-slate-400">
                              → {formatTime(event.end_time)}
                            </p>

                          )}

                        </div>


                        <div className="min-w-0 flex-1 border-l border-slate-100 pl-4">

                          <div className="flex items-start justify-between gap-3">

                            <h3 className="font-black">
                              {event.title}
                            </h3>

                            <span
                              className={
                                event.source === "document"
                                  ? "rounded-full bg-purple-100 px-2.5 py-1 text-[9px] font-black text-purple-700"
                                  : "rounded-full bg-blue-100 px-2.5 py-1 text-[9px] font-black text-blue-700"
                              }
                            >
                              {event.source === "document"
                                ? "DOCUMENT"
                                : "PERSONNEL"}
                            </span>

                          </div>


                          {event.location && (

                            <p className="mt-2 text-sm text-slate-500">
                              📍 {event.location}
                            </p>

                          )}


                          {event.responsible && (

                            <p className="mt-1 text-sm text-slate-500">
                              👤 {event.responsible}
                            </p>

                          )}


                          {event.description && (

                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {event.description}
                            </p>

                          )}


                          {event.source === "document" && (

                            <div className="mt-3 flex items-center gap-2">

                              <span className="text-[11px] text-slate-400">
                                Confiance
                              </span>

                              <span className="text-xs font-black text-emerald-600">
                                {Math.round(
                                  event.confidence * 100,
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


        {/* ==================================================
            UPCOMING PERSONAL
        ================================================== */}

        {!loading &&
          !error &&
          upcomingEvents.length > 0 && (

            <section className="mt-10">

              <div className="mb-5">

                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  À venir
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Prochains événements
                </h2>

              </div>

              <div className="space-y-3">

                {upcomingEvents.map(
                  event => (

                    <article
                      key={`${event.source}-upcoming-${event.id}`}
                      className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
                    >

                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                          {event.source === "document"
                            ? "📄"
                            : "📅"}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-bold">
                              {event.title}
                            </h3>

                            <span
                              className={
                                event.source === "document"
                                  ? "rounded-full bg-purple-100 px-2 py-1 text-[9px] font-black text-purple-700"
                                  : "rounded-full bg-blue-100 px-2 py-1 text-[9px] font-black text-blue-700"
                              }
                            >
                              {event.source === "document"
                                ? "DOCUMENT"
                                : "PERSONNEL"}
                            </span>

                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(event.date)}
                            {event.start_time
                              ? ` · ${formatTime(event.start_time)}`
                              : ""}
                          </p>

                        </div>

                        <span className="text-slate-300">
                          →
                        </span>

                      </div>

                    </article>

                  ),
                )}

              </div>

            </section>

          )}


        {/* ==================================================
            UPCOMING BAHÁ'Í
        ================================================== */}

        {!bahaiEventsLoading &&
          upcomingBahaiEvents.length > 0 && (

            <section className="mt-10">

              <div className="mb-5">

                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-500">
                  Calendrier sacré
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Prochains événements bahá'ís
                </h2>

              </div>

              <div className="space-y-3">

                {upcomingBahaiEvents.map(
                  event => (

                    <article
                      key={`bahai-upcoming-${event.code}`}
                      className={`
                        rounded-3xl border p-5 shadow-sm
                        ${
                          event.is_holy_day
                            ? "border-amber-200 bg-amber-50"
                            : "border-slate-100 bg-white"
                        }
                      `}
                    >

                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                          {event.icon || "🌿"}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="font-bold">
                              {event.name}
                            </h3>

                            {event.is_holy_day && (

                              <span className="rounded-full bg-amber-200 px-2 py-1 text-[9px] font-black text-amber-800">
                                JOUR SAINT
                              </span>

                            )}

                            {event.event_type === "FEAST" && (

                              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700">
                                FÊTE
                              </span>

                            )}

                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(event.date)}
                          </p>

                        </div>

                      </div>

                    </article>

                  ),
                )}

              </div>

            </section>

          )}


        {/* ==================================================
            BAHÁ'Í TODAY
        ================================================== */}

        <section className="relative mt-10 overflow-hidden rounded-4xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-7">

          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />


          <div className="relative">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur">
                🌿
              </div>

              <div>

                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  Calendrier bahá'í
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Aujourd'hui
                </h2>

              </div>

            </div>


            {bahaiCalendarLoading && (

              <div className="mt-6 rounded-2xl bg-white/5 p-6 text-center">

                <div className="text-2xl">
                  ⏳
                </div>

                <p className="mt-2 text-sm text-slate-300">
                  Calcul de la date bahá'íe...
                </p>

              </div>

            )}


            {!bahaiCalendarLoading &&
              bahaiCalendarError && (

                <div className="mt-6 rounded-2xl bg-red-500/10 p-5">

                  <p className="font-bold text-red-200">
                    Impossible de charger le calendrier.
                  </p>

                  <p className="mt-1 text-sm text-red-300">
                    {bahaiCalendarError}
                  </p>

                </div>

              )}


            {!bahaiCalendarLoading &&
              !bahaiCalendarError &&
              bahaiDate && (

                <div className="mt-6">

                  <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">

                    <p className="text-sm text-slate-400">
                      Année bahá'íe {bahaiDate.year}
                    </p>

                    <div className="mt-3 flex items-end gap-4">

                      <span className="text-6xl font-black leading-none">
                        {bahaiDate.day}
                      </span>

                      <div className="pb-1">

                        <p className="text-2xl font-black">
                          {bahaiDate.month_name}
                        </p>

                        <p className="text-sm text-emerald-300">
                          {bahaiDate.month_meaning}
                        </p>

                      </div>

                    </div>

                    <p className="mt-5 text-sm text-slate-400">
                      {bahaiDate.day}ᵉ jour du mois de{" "}
                      {bahaiDate.month_name}
                    </p>

                  </div>


                  {nextBahaiEvent && (

                    <div className="mt-4 rounded-3xl bg-white p-5 text-slate-900">

                      <div className="flex gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                          {nextBahaiEvent.icon || "🌿"}
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                            Prochain événement
                          </p>

                          <h3 className="mt-1 font-black">
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

                            <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                              🕊️ Suspension du travail
                            </span>

                          )}

                        </div>

                      </div>

                    </div>

                  )}

                </div>

              )}

          </div>

        </section>


        {/* ==================================================
            NOTIFICATIONS
        ================================================== */}

        <section className="mt-10">

          <div className="mb-5 flex items-end justify-between">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Rappels
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Notifications
              </h2>

            </div>

            {unreadCount > 0 && (

              <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-black text-red-700">
                {unreadCount} non lue
                {unreadCount > 1 ? "s" : ""}
              </span>

            )}

          </div>


          {notificationsLoading && (

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">

              <div className="text-2xl">
                🔔
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Chargement...
              </p>

            </div>

          )}


          {!notificationsLoading &&
            notificationsError && (

              <div className="rounded-3xl border border-red-100 bg-red-50 p-5">

                <p className="text-sm font-medium text-red-700">
                  {notificationsError}
                </p>

              </div>

            )}


          {!notificationsLoading &&
            !notificationsError &&
            notifications.length === 0 && (

              <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-3xl">
                  🔕
                </div>

                <h3 className="mt-4 font-black">
                  Tout est calme
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Tu n'as aucune notification.
                </p>

              </div>

            )}


          {!notificationsLoading &&
            !notificationsError &&
            notifications.length > 0 && (

              <div className="space-y-3">

                {unreadCount > 0 && (

                  <div className="flex justify-end">

                    <button
                      onClick={
                        handleMarkAllNotificationsAsRead
                      }
                      disabled={markingAllRead}
                      className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-700 disabled:opacity-50"
                    >
                      {markingAllRead
                        ? "Traitement..."
                        : "Tout marquer comme lu"}
                    </button>

                  </div>

                )}


                {notifications
                  .slice(0, 5)
                  .map(notification => {

                    const isUnread =
                      notification.status !== "READ";


                    return (

                      <article
                        key={notification.id}
                        className={`
                          rounded-3xl border p-5 transition
                          ${
                            isUnread
                              ? "border-emerald-200 bg-emerald-50/70"
                              : "border-slate-100 bg-white"
                          }
                        `}
                      >

                        <div className="flex gap-4">

                          <div className={`
                            flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl
                            ${
                              isUnread
                                ? "bg-white shadow-sm"
                                : "bg-slate-100"
                            }
                          `}>
                            {isUnread ? "🔔" : "✓"}
                          </div>


                          <div className="min-w-0 flex-1">

                            <div className="flex items-start gap-3">

                              <div className="min-w-0 flex-1">

                                <div className="flex items-center gap-2">

                                  <h3 className="font-black">
                                    {notification.title}
                                  </h3>

                                  {isUnread && (

                                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

                                  )}

                                </div>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                  {notification.message}
                                </p>

                              </div>

                            </div>


                            <div className="mt-3 flex flex-wrap items-center gap-2">

                              {notification.event_source && (

                                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-100">
                                  {notification.event_source}
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
                                className="mt-3 text-xs font-black text-emerald-700 hover:text-emerald-900"
                              >
                                ✓ Marquer comme lue
                              </button>

                            )}

                          </div>

                        </div>

                      </article>

                    );

                  })}

              </div>

            )}

        </section>

      </div>


      {/* ====================================================
          BOTTOM NAVIGATION
      ==================================================== */}

      <BottomNavigation />

    </main>

  );
}


// ============================================================
// PAGE
// ============================================================

export default function CalendarPage() {

  return (

    <Suspense
      fallback={

        <main className="min-h-screen bg-[#f6f8f7] pb-24">

          <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                📅
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Chargement du calendrier...
              </p>

            </div>

          </div>

        </main>

      }
    >

      <CalendarPageContent />

    </Suspense>
  );

}
