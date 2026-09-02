"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { apiFetch, getNotifications } from "@/lib/api";
import type { CalendarEvent } from "@/types/event";
import {
ArrowRight,
Bell,
Brain,
CalendarDays,
CheckCircle2,
ChevronRight,
FileText,
Search,
Sparkles,
BarChart3,
Clock3,
MapPin,
UserRound,
} from "lucide-react";
import DailyQuoteSection from "@/components/daily-quotes/DailyQuoteSection";

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

type Community = {
id: number;
name: string;
city?: string | null;
country?: string | null;
description?: string | null;
};

type CommunityMembership = {
id: number;
community: number | Community;
role?:
| number
| {
id: number;
name: string;
};
start_date?: string | null;
end_date?: string | null;
};

/* =========================================================
OUTILS
========================================================= */

function dateToString(date: Date) {
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, "0");
const day = String(date.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

function formatTime(time: string | null | undefined) {
if (!time) return "";

return time.substring(0, 5);
}

function formatEventDate(date: string) {
return new Intl.DateTimeFormat("fr-FR", {
weekday: "long",
day: "numeric",
month: "long",
}).format(new Date(`${date}T12:00:00`));
}

function getCommunityId(community: number | Community): number {
return typeof community === "number" ? community : community.id;
}

/* =========================================================
PAGE
========================================================= */

export default function HomePage() {
const today = new Date();
const todayString = dateToString(today);

const router = useRouter();

const [authChecked, setAuthChecked] = useState(false);

const [events, setEvents] = useState<CalendarEvent[]>([]);
const [eventsLoading, setEventsLoading] = useState(true);

const [notifications, setNotifications] = useState<NotificationItem[]>([]);
const [notificationsLoading, setNotificationsLoading] = useState(true);

const [communities, setCommunities] = useState<Community[]>([]);
const [memberships, setMemberships] = useState<CommunityMembership[]>([]);
const [communitiesLoading, setCommunitiesLoading] = useState(true);

/* =======================================================
AUTHENTIFICATION
======================================================= */

useEffect(() => {
const token = localStorage.getItem("access_token");

if (!token) {
  router.replace("/login");
  return;
}

setAuthChecked(true);

}, [router]);

/* =======================================================
ÉVÉNEMENTS
======================================================= */

useEffect(() => {
async function loadEvents() {
try {
setEventsLoading(true);

    const data = await apiFetch("/api/events/");

    const normalizedEvents: CalendarEvent[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.events)
        ? data.events
        : [];

    setEvents(normalizedEvents);
  } catch (error) {
    console.error(
      "❌ Impossible de charger les événements :",
      error,
    );
  } finally {
    setEventsLoading(false);
  }
}

loadEvents();

}, []);

/* =======================================================
NOTIFICATIONS
======================================================= */

useEffect(() => {
async function loadNotifications() {
try {
setNotificationsLoading(true);

    const data = await getNotifications();

    const normalizedNotifications: NotificationItem[] =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.notifications)
            ? data.notifications
            : [];

    setNotifications(normalizedNotifications);
  } catch (error) {
    console.error(
      "❌ Impossible de charger les notifications :",
      error,
    );
  } finally {
    setNotificationsLoading(false);
  }
}

loadNotifications();

}, []);

/* =======================================================
COMMUNAUTÉS
======================================================= */

useEffect(() => {
async function loadCommunities() {
try {
setCommunitiesLoading(true);

    const [communitiesData, membershipsData] = await Promise.all([
      apiFetch("/api/communities/my/"),
      apiFetch("/api/communities/memberships/my/"),
    ]);

    const normalizedCommunities: Community[] = Array.isArray(
      communitiesData,
    )
      ? communitiesData
      : Array.isArray(communitiesData?.results)
        ? communitiesData.results
        : [];

    const normalizedMemberships: CommunityMembership[] = Array.isArray(
      membershipsData,
    )
      ? membershipsData
      : Array.isArray(membershipsData?.results)
        ? membershipsData.results
        : [];

    setCommunities(normalizedCommunities);
    setMemberships(normalizedMemberships);
  } catch (error) {
    console.error(
      "❌ Impossible de charger les communautés :",
      error,
    );
  } finally {
    setCommunitiesLoading(false);
  }
}

loadCommunities();

}, []);

/* =======================================================
DONNÉES CALCULÉES
======================================================= */

const unreadCount = useMemo(() => {
return notifications.filter(
(notification) => notification.status !== "READ",
).length;
}, [notifications]);

const todayEvents = useMemo(() => {
return events
.filter((event) => event.date === todayString)
.sort((a, b) =>
(a.start_time || "").localeCompare(b.start_time || ""),
);
}, [events, todayString]);

const upcomingEvent = useMemo(() => {
return (
[...events]
.filter((event) => event.date >= todayString)
.sort((a, b) => {
if (a.date !== b.date) {
return a.date.localeCompare(b.date);
}

      return (a.start_time || "").localeCompare(
        b.start_time || "",
      );
    })[0] ?? null
);


}, [events, todayString]);

const upcomingNotifications = useMemo(() => {
return notifications
.filter((notification) => notification.status !== "READ")
.sort(
(a, b) =>
new Date(a.scheduled_for).getTime() -
new Date(b.scheduled_for).getTime(),
)
.slice(0, 3);
}, [notifications]);

const detectedEventsCount = useMemo(() => {
return events.filter(
(event) => event.source === "document",
).length;
}, [events]);

const primaryCommunity = communities[0] ?? null;

const primaryMembership = memberships.find((membership) => {
if (!primaryCommunity) return false;

return (
  getCommunityId(membership.community) ===
  primaryCommunity.id
);


});

/* =======================================================
AUTH LOADING
======================================================= */

if (!authChecked) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#f7f9f8]"> <div className="text-center"> <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-100 border-t-emerald-600" />

      <p className="mt-4 text-sm font-medium text-slate-500">
        Vérification de la connexion...
      </p>
    </div>
  </main>
);


}

/* =======================================================
RENDU
======================================================= */

return ( <main className="min-h-screen bg-[#f7f9f8] pb-28">
{/* ===================================================
HEADER
=================================================== */}
  <header className="relative overflow-hidden bg-white">
    <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />
    <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-teal-100/40 blur-3xl" />

    <div className="relative mx-auto max-w-6xl px-5 pb-7 pt-8 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Sparkles size={14} />
            <span>Bahá'í Companion</span>
          </div>

          <h1 className="max-w-xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Bonjour 👋
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Votre espace pour nourrir votre vie spirituelle,
            organiser vos activités et rester connecté.
          </p>
        </div>

        <Link
          href="/notifications"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          aria-label="Notifications"
        >
          <Bell size={20} />

          {!notificationsLoading && unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  </header>

  <div className="mx-auto max-w-6xl space-y-7 px-5 py-6 sm:px-8">
    {/* =================================================
        STATISTIQUES
    ================================================= */}

    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Link
        href="/calendar"
        className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:scale-105">
          <CalendarDays size={20} />
        </div>

        <p className="mt-4 text-2xl font-bold text-slate-900">
          {eventsLoading ? "—" : todayEvents.length}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          Activités aujourd'hui
        </p>
      </Link>

      <Link
        href="/notifications"
        className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition group-hover:scale-105">
          <Bell size={20} />
        </div>

        <p className="mt-4 text-2xl font-bold text-slate-900">
          {notificationsLoading ? "—" : unreadCount}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          Notifications
        </p>
      </Link>

      <Link
        href="/events"
        className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:scale-105">
          <Search size={20} />
        </div>

        <p className="mt-4 text-2xl font-bold text-slate-900">
          {eventsLoading ? "—" : detectedEventsCount}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          Événements détectés
        </p>
      </Link>

      <Link
        href="/quiz"
        className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition group-hover:scale-105">
          <Brain size={20} />
        </div>

        <p className="mt-4 text-lg font-bold text-slate-900">
          Quiz
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          Tester mes connaissances
        </p>
      </Link>
    </section>

    {/* =================================================
        PROCHAINE ACTIVITÉ
    ================================================= */}

    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
            Agenda
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Votre prochaine activité
          </h2>
        </div>

        <Link
          href="/calendar"
          className="hidden items-center gap-1 text-sm font-semibold text-emerald-600 sm:flex"
        >
          Calendrier
          <ArrowRight size={15} />
        </Link>
      </div>

      {eventsLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex animate-pulse gap-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-100" />

            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-slate-100" />
              <div className="mt-3 h-6 w-2/3 rounded bg-slate-100" />
              <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ) : upcomingEvent ? (
        <div className="relative overflow-hidden rounded-[28px] bg-linear-to-br from-emerald-600 via-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-900/10 sm:p-7">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 left-1/2 h-40 w-40 rounded-full bg-teal-400/10 blur-2xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
                  <Clock3 size={13} />

                  {upcomingEvent.date === todayString
                    ? `Aujourd'hui${
                        upcomingEvent.start_time
                          ? ` · ${formatTime(
                              upcomingEvent.start_time,
                            )}`
                          : ""
                      }`
                    : `${formatEventDate(
                        upcomingEvent.date,
                      )}${
                        upcomingEvent.start_time
                          ? ` · ${formatTime(
                              upcomingEvent.start_time,
                            )}`
                          : ""
                      }`}
                </div>

                <h3 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
                  {upcomingEvent.title}
                </h3>

                <div className="mt-4 space-y-2">
                  {upcomingEvent.location && (
                    <div className="flex items-center gap-2 text-sm text-emerald-50">
                      <MapPin size={16} />
                      <span className="truncate">
                        {upcomingEvent.location}
                      </span>
                    </div>
                  )}

                  {upcomingEvent.responsible && (
                    <div className="flex items-center gap-2 text-sm text-emerald-50">
                      <UserRound size={16} />
                      <span className="truncate">
                        {upcomingEvent.responsible}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 sm:flex">
                <CalendarDays size={30} />
              </div>
            </div>

            <Link
              href="/calendar"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Voir le calendrier
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={28} />
          </div>

          <h3 className="mt-4 font-bold text-slate-900">
            Aucun événement à venir
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Votre agenda est actuellement libre.
          </p>

          <Link
            href="/calendar"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Ouvrir le calendrier
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>

    {/* =================================================
        NOTIFICATIONS
    ================================================= */}

    {upcomingNotifications.length > 0 && (
      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Rappels
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              À ne pas oublier
            </h2>
          </div>

          <Link
            href="/notifications"
            className="flex items-center gap-1 text-sm font-semibold text-emerald-600"
          >
            Tout voir
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingNotifications.map((notification) => (
            <Link
              key={notification.id}
              href={`/notifications?notification_id=${notification.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Bell size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-900">
                  {notification.title}
                </h3>

                <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                  {notification.message}
                </p>
              </div>

              <ChevronRight
                size={18}
                className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500"
              />
            </Link>
          ))}
        </div>
      </section>
    )}

    {/* =================================================
        ÉVÉNEMENTS DÉTECTÉS
    ================================================= */}

    {detectedEventsCount > 0 && (
      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">
              Documents
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Événements détectés
            </h2>
          </div>

          <Link
            href="/events"
            className="flex items-center gap-1 text-sm font-semibold text-emerald-600"
          >
            Vérifier
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <FileText size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900">
                  {detectedEventsCount} événement
                  {detectedEventsCount > 1 ? "s" : ""} à vérifier
                </h3>

                <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  Action requise
                </span>
              </div>

              <p className="mt-1.5 text-sm leading-5 text-slate-600">
                Des événements provenant de vos documents ont été
                détectés automatiquement.
              </p>

              <Link
                href="/events"
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amber-700"
              >
                Vérifier les événements
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    )}

    {/* =================================================
        EXPLORER
    ================================================= */}

    <section>
      <div className="mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Explorer
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Que souhaitez-vous faire ?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link
          href="/calendar"
          className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:scale-105">
            <CalendarDays size={21} />
          </div>

          <h3 className="mt-4 font-bold text-slate-900">
            Calendrier
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Voir mes activités
          </p>
        </Link>

        <Link
          href="/activities"
          className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105">
            <CalendarDays size={21} />
          </div>

          <h3 className="mt-4 font-bold text-slate-900">
            Activités
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Réunions, dévotions et événements
          </p>
        </Link>

        <Link
          href="/documents"
          className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition group-hover:scale-105">
            <FileText size={21} />
          </div>

          <h3 className="mt-4 font-bold text-slate-900">
            Documents
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Importer et consulter
          </p>
        </Link>

        <Link
          href="/quiz"
          className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition group-hover:scale-105">
            <Brain size={21} />
          </div>

          <h3 className="mt-4 font-bold text-slate-900">
            Quiz bahá'í
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Tester mes connaissances
          </p>
        </Link>

        <Link
          href="/events"
          className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:scale-105">
            <Search size={21} />
          </div>

          <h3 className="mt-4 font-bold text-slate-900">
            Événements
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Vérifier les détections
          </p>
        </Link>

        <Link
          href="/analytics"
          className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:scale-105">
            <BarChart3 size={21} />
          </div>

          <h3 className="mt-4 font-bold text-slate-900">
            Analytics
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Statistiques de l'application
          </p>
        </Link>
      </div>
    </section>

    {/* =================================================
        COMMUNAUTÉ
    ================================================= */}

    {!communitiesLoading && primaryCommunity && (
      <section>
        <div className="mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Vie communautaire
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Ma communauté
          </h2>
        </div>

        <Link
          href={`/communities/${primaryCommunity.id}`}
          className="group flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
            👥
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold text-slate-900">
              {primaryCommunity.name}
            </h3>

            {(primaryCommunity.city ||
              primaryCommunity.country) && (
              <p className="mt-1 text-sm text-slate-500">
                {[primaryCommunity.city, primaryCommunity.country]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            {primaryMembership?.role &&
              typeof primaryMembership.role !== "number" && (
                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {primaryMembership.role.name}
                </span>
              )}
          </div>

          <ChevronRight
            size={20}
            className="text-slate-300 transition group-hover:text-emerald-500"
          />
        </Link>
      </section>
    )}

    {/* =================================================
        CITATION DU JOUR
    ================================================= */}

    <section>
      <DailyQuoteSection />
    </section>

    {/* =================================================
        FOOTER
    ================================================= */}

    <div className="pb-3 pt-2 text-center">
      <p className="text-xs text-slate-400">
        Bahá'í Companion · Votre compagnon spirituel
      </p>
    </div>
  </div>

  {/* ===================================================
      NAVIGATION
  =================================================== */}

  <BottomNavigation />
</main>

);
}
