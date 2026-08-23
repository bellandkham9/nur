"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { apiFetch, getNotifications } from "@/lib/api";
import type { CalendarEvent } from "@/types/event";
import { Brain } from "lucide-react";
import DailyQuoteSection
  from "@/components/daily-quotes/DailyQuoteSection";
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
  if (!time) {
    return "";
  }

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

function getCommunityName(community: number | Community): string {
  return typeof community === "number" ? "Ma communauté" : community.name;
}

/* =========================================================
   PAGE
========================================================= */

export default function HomePage() {

  const today = new Date();
  const todayString = dateToString(today);

  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  /* =======================================================
     ÉVÉNEMENTS
  ======================================================= */

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [notificationsLoading, setNotificationsLoading] = useState(true);

  /* =======================================================
     COMMUNAUTÉS
  ======================================================= */

  const [communities, setCommunities] = useState<Community[]>([]);

  const [memberships, setMemberships] = useState<CommunityMembership[]>([]);

  const [communitiesLoading, setCommunitiesLoading] = useState(true);

  /* =======================================================
     CHARGEMENT DES ÉVÉNEMENTS
  ======================================================= */

  
 useEffect(() => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    router.replace("/login");
  }
  setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">
            Vérification de la connexion...
          </p>
        </div>
      </main>
    );
  }

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
        console.error("❌ Impossible de charger les événements :", error);
      } finally {
        setEventsLoading(false);
      }
    }

    loadEvents();
  }, []);

  /* =======================================================
     CHARGEMENT DES NOTIFICATIONS
  ======================================================= */

  useEffect(() => {
    async function loadNotifications() {
      try {
        setNotificationsLoading(true);

        const data = await getNotifications();

        const normalizedNotifications: NotificationItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.notifications)
              ? data.notifications
              : [];

        setNotifications(normalizedNotifications);
      } catch (error) {
        console.error("❌ Impossible de charger les notifications :", error);
      } finally {
        setNotificationsLoading(false);
      }
    }

    loadNotifications();
  }, []);

  /* =======================================================
     CHARGEMENT DES COMMUNAUTÉS
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
        console.error("❌ Impossible de charger les communautés :", error);
      } finally {
        setCommunitiesLoading(false);
      }
    }

    loadCommunities();
  }, []);

  /* =======================================================
     CALCULS
  ======================================================= */

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => notification.status !== "READ",
    ).length;
  }, [notifications]);

  const todayEvents = useMemo(() => {
    return events
      .filter((event) => event.date === todayString)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }, [events, todayString]);

  const upcomingEvent = useMemo(() => {
    return (
      [...events]
        .filter((event) => event.date >= todayString)
        .sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
          }

          return (a.start_time || "").localeCompare(b.start_time || "");
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

  const primaryCommunity = communities[0] ?? null;

  const primaryMembership = memberships.find((membership) => {
    if (!primaryCommunity) {
      return false;
    }

    return getCommunityId(membership.community) === primaryCommunity.id;
  });

  /* =======================================================
     RENDU
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b bg-white px-5 pb-6 pt-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Bienvenue sur Bahá'í Companion
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Votre espace pour la vie spirituelle, communautaire et personnelle.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-6">
        {/* =================================================
            PROCHAIN ÉVÉNEMENT
        ================================================= */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                Agenda
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Prochaine activité
              </h2>
            </div>

            <Link
              href="/calendar"
              className="text-sm font-semibold text-emerald-600 hover:underline"
            >
              Calendrier →
            </Link>
          </div>

          {eventsLoading ? (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                Chargement de l'agenda...
              </p>
            </div>
          ) : upcomingEvent ? (
            <div className="rounded-3xl bg-emerald-600 p-5 text-white shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize text-emerald-100">
                    {upcomingEvent.date === todayString
                      ? `Aujourd'hui${
                          upcomingEvent.start_time
                            ? ` · ${formatTime(upcomingEvent.start_time)}`
                            : ""
                        }`
                      : `${formatEventDate(upcomingEvent.date)}${
                          upcomingEvent.start_time
                            ? ` · ${formatTime(upcomingEvent.start_time)}`
                            : ""
                        }`}
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    {upcomingEvent.title}
                  </h3>

                  {upcomingEvent.location && (
                    <p className="mt-2 text-sm text-emerald-100">
                      📍 {upcomingEvent.location}
                    </p>
                  )}

                  {upcomingEvent.responsible && (
                    <p className="mt-1 text-sm text-emerald-100">
                      👤 {upcomingEvent.responsible}
                    </p>
                  )}
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                  📅
                </div>
              </div>

              <Link
                href="/calendar"
                className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Voir le calendrier
              </Link>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
              <div className="text-4xl">🌿</div>

              <h3 className="mt-3 font-bold text-slate-900">
                Aucun événement à venir
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Votre agenda est actuellement libre.
              </p>
            </div>
          )}
        </section>

        {/* =================================================
            RÉSUMÉ
        ================================================= */}

        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/calendar"
            className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-2xl">📅</div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {eventsLoading ? "—" : todayEvents.length}
            </p>

            <p className="text-sm text-slate-500">Activités aujourd'hui</p>
          </Link>

          <Link
            href="/notifications"
            className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="text-2xl">🔔</div>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {notificationsLoading ? "—" : unreadCount}
            </p>

            <p className="text-sm text-slate-500">Notifications non lues</p>
          </Link>
        </section>

        {/* =================================================
            MA COMMUNAUTÉ
        ================================================= */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                Vie communautaire
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Ma communauté
              </h2>
            </div>

            <Link
              href="/communities"
              className="text-sm font-semibold text-emerald-600 hover:underline"
            >
              Voir tout →
            </Link>
          </div>

          {communitiesLoading ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">
                Chargement des communautés...
              </p>
            </div>
          ) : primaryCommunity ? (
            <Link
              href={`/communities/${primaryCommunity.id}`}
              className="block rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  👥
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-slate-900">
                    {primaryCommunity.name}
                  </h3>

                  {(primaryCommunity.city || primaryCommunity.country) && (
                    <p className="mt-1 text-sm text-slate-500">
                      📍{" "}
                      {[primaryCommunity.city, primaryCommunity.country]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}

                  {primaryMembership?.role &&
                    typeof primaryMembership.role !== "number" && (
                      <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {primaryMembership.role.name}
                      </span>
                    )}
                </div>

                <span className="text-xl text-slate-400">→</span>
              </div>
            </Link>
          ) : (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  👥
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900">
                    Vous n'avez pas encore de communauté
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Rejoignez une communauté pour rester connecté à la vie
                    bahá'íe locale.
                  </p>

                  <Link
                    href="/communities"
                    className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Découvrir les communautés
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            ÉVÉNEMENTS À VÉRIFIER
        ================================================= */}

        {events.filter((event) => event.source === "document").length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Documents
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Événements détectés
                </h2>
              </div>

              <Link
                href="/events"
                className="text-sm font-semibold text-emerald-600 hover:underline"
              >
                Tout voir →
              </Link>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">
                  ⚠️
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {
                      events.filter((event) => event.source === "document")
                        .length
                    }{" "}
                    événement
                    {events.filter((event) => event.source === "document")
                      .length > 1
                      ? "s"
                      : ""}{" "}
                    détecté
                    {events.filter((event) => event.source === "document")
                      .length > 1
                      ? "s"
                      : ""}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    Des événements provenant de vos documents peuvent nécessiter
                    une vérification.
                  </p>

                  <Link
                    href="/events"
                    className="mt-3 inline-block text-sm font-semibold text-amber-700"
                  >
                    Vérifier les événements →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        {upcomingNotifications.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Rappels
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  À ne pas oublier
                </h2>
              </div>

              <Link
                href="/notifications"
                className="text-sm font-semibold text-emerald-600 hover:underline"
              >
                Tout voir →
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={`/notifications?notification_id=${notification.id}`}
                  className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                      🔔
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {notification.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* =================================================
            ACCÈS RAPIDES
        ================================================= */}

        <section>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Explorer
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Accès rapides
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/calendar"
              className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">📅</span>

              <p className="mt-3 font-semibold text-slate-900">Calendrier</p>

              <p className="mt-1 text-xs text-slate-500">Voir mes activités</p>
            </Link>

            <Link
              href="/communities"
              className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">👥</span>

              <p className="mt-3 font-semibold text-slate-900">Communautés</p>

              <p className="mt-1 text-xs text-slate-500">
                Rejoindre et participer
              </p>
            </Link>

            <Link
              href="/documents"
              className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">📄</span>

              <p className="mt-3 font-semibold text-slate-900">Documents</p>

              <p className="mt-1 text-xs text-slate-500">
                Importer et consulter
              </p>
            </Link>
            <Link
              href="/activities"
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-2xl">📅</div>

              <p className="mt-2 font-semibold text-slate-900">Activités</p>

              <p className="mt-1 text-xs text-slate-500">
                Réunions, dévotions et événements
              </p>
            </Link>
            <Link href="/quiz">
              <div className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-transform group-hover:scale-110">
                  <Brain size={26} />
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  Quiz bahá'í
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Teste tes connaissances et gagne de l'XP.
                </p>
              </div>
            </Link>
            <Link
              href="/events"
              className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl">🔍</span>

              <p className="mt-3 font-semibold text-slate-900">Événements</p>

              <p className="mt-1 text-xs text-slate-500">
                Vérifier les détections
              </p>
            </Link>
          </div>
        </section>

        {/* =================================================
            CITATION / PENSÉE
        ================================================= */}

        <DailyQuoteSection />
      </div>

      {/* =================================================
          NAVIGATION COMMUNE
      ================================================= */}

      <BottomNavigation />
    </main>
  );
}
