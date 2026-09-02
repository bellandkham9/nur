"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";
import BottomNavigation from "@/components/navigation/BottomNavigation";

interface PersonalEvent {
  id: number;
  title: string;
  description: string;
  event_type: string;
  event_type_display: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  responsible: string;
  reminder_enabled: boolean;
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
  source_detected_event?: number | null;
}

type Filter = "all" | "today" | "upcoming";

interface EventForm {
  title: string;
  description: string;
  event_type: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  responsible: string;
  reminder_enabled: boolean;
  reminder_minutes: number;
}

const EMPTY_FORM: EventForm = {
  title: "",
  description: "",
  event_type: "OTHER",
  date: "",
  start_time: "",
  end_time: "",
  location: "",
  responsible: "",
  reminder_enabled: true,
  reminder_minutes: 30,
};

const EVENT_TYPES = [
  { value: "MEETING", label: "Réunion", icon: "🤝" },
  { value: "ACTIVITY", label: "Activité", icon: "✨" },
  { value: "DEVOTIONAL", label: "Réunion de prière", icon: "🙏" },
  { value: "STUDY", label: "Cercle d'étude", icon: "📖" },
  { value: "FEAST", label: "Fête des Dix-Neuf Jours", icon: "🌿" },
  { value: "HOLY_DAY", label: "Jour saint", icon: "🌟" },
  { value: "OTHER", label: "Autre", icon: "📅" },
];

function formatDate(date: string) {
  if (!date) {
    return "Date non définie";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatShortDate(date: string) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

function formatTime(time: string | null) {
  if (!time) {
    return null;
  }

  return time.substring(0, 5);
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTypeInfo(type: string) {
  return (
    EVENT_TYPES.find((item) => item.value === type) ??
    EVENT_TYPES[EVENT_TYPES.length - 1]
  );
}

function sortEvents(events: PersonalEvent[]) {
  return [...events].sort((a, b) => {
    const dateA = `${a.date}T${a.start_time || "00:00"}`;
    const dateB = `${b.date}T${b.start_time || "00:00"}`;

    return dateA.localeCompare(dateB);
  });
}

export default function EventsPage() {
  const [events, setEvents] = useState<PersonalEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>("all");

  const [showForm, setShowForm] = useState(false);

  const [editingEvent, setEditingEvent] =
    useState<PersonalEvent | null>(null);

  const [form, setForm] = useState<EventForm>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch("/api/personal-events/");

      const results = Array.isArray(data)
        ? data
        : data?.results ?? [];

      setEvents(sortEvents(results));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les événements.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function openCreateForm() {
    setEditingEvent(null);
    setForm({
      ...EMPTY_FORM,
      date: getToday(),
    });
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(event: PersonalEvent) {
    setEditingEvent(event);

    setForm({
      title: event.title ?? "",
      description: event.description ?? "",
      event_type: event.event_type ?? "OTHER",
      date: event.date ?? "",
      start_time: event.start_time?.substring(0, 5) ?? "",
      end_time: event.end_time?.substring(0, 5) ?? "",
      location: event.location ?? "",
      responsible: event.responsible ?? "",
      reminder_enabled: event.reminder_enabled ?? true,
      reminder_minutes: event.reminder_minutes ?? 30,
    });

    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingEvent(null);
    setFormError(null);
  }

  function updateForm<K extends keyof EventForm>(
    field: K,
    value: EventForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveEvent() {
    if (!form.title.trim()) {
      setFormError("Le titre est obligatoire.");
      return;
    }

    if (!form.date) {
      setFormError("La date est obligatoire.");
      return;
    }

    if (
      form.start_time &&
      form.end_time &&
      form.end_time < form.start_time
    ) {
      setFormError(
        "L'heure de fin doit être après l'heure de début.",
      );
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        event_type: form.event_type,
        date: form.date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        location: form.location.trim(),
        responsible: form.responsible.trim(),
        reminder_enabled: form.reminder_enabled,
        reminder_minutes: form.reminder_minutes,
      };

      if (editingEvent) {
        await apiFetch(
          `/api/personal-events/${editingEvent.id}/`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
      } else {
        await apiFetch("/api/personal-events/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      closeForm();

      await loadEvents();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer l'événement.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(event: PersonalEvent) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer "${event.title}" ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(event.id);

      await apiFetch(
        `/api/personal-events/${event.id}/`,
        {
          method: "DELETE",
        },
      );

      setEvents((current) =>
        current.filter((item) => item.id !== event.id),
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer l'événement.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredEvents = useMemo(() => {
    const today = getToday();

    if (filter === "today") {
      return events.filter((event) => event.date === today);
    }

    if (filter === "upcoming") {
      return events.filter((event) => event.date >= today);
    }

    return events;
  }, [events, filter]);

  const todayCount = events.filter(
    (event) => event.date === getToday(),
  ).length;

  const upcomingCount = events.filter(
    (event) => event.date >= getToday(),
  ).length;



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


  const [notifications, setNotifications] = useState<
      NotificationItem[]
    >([]);


   const unreadCount = useMemo(() => {
      return notifications.filter(
        (notification) =>
          notification.status !== "READ"
      ).length;
    }, [notifications]);
  

    

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-5 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-emerald-600">
                Mon agenda
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Mes événements
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Retrouvez ici vos événements personnels et ceux
                confirmés depuis vos documents.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="shrink-0 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              + Evénement
            </button>
          </div>
        </div>
      </header>

      {/* CONTENU */}

      <div className="mx-auto max-w-5xl px-5 py-6">
        {/* STATISTIQUES */}

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {events.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              événement{events.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Aujourd'hui
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {todayCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              prévu{todayCount > 1 ? "s" : ""} aujourd'hui
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              À venir
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {upcomingCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              événement{upcomingCount > 1 ? "s" : ""}
            </p>
          </div>
        </section>

        {/* FILTRES */}

        <section className="mt-8">
          <div className="flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
            {[
              ["all", "Tous"],
              ["today", "Aujourd'hui"],
              ["upcoming", "À venir"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as Filter)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === value
                    ? "bg-emerald-600 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ERREUR */}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 text-sm text-red-700">
            ⚠️ {error}

            <button
              type="button"
              onClick={loadEvents}
              className="ml-3 font-bold underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* CHARGEMENT */}

        {loading && (
          <div className="mt-8 rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="text-4xl">⏳</div>

            <p className="mt-3 text-sm text-slate-500">
              Chargement de vos événements...
            </p>
          </div>
        )}

        {/* LISTE */}

        {!loading && (
          <section className="mt-8">
            {filteredEvents.length === 0 ? (
              <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
                <div className="text-5xl">📅</div>

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  Aucun événement
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {filter === "today"
                    ? "Vous n'avez aucun événement prévu aujourd'hui."
                    : filter === "upcoming"
                      ? "Vous n'avez aucun événement à venir."
                      : "Commencez par créer votre premier événement personnel."}
                </p>

                {filter === "all" && (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    + Créer un événement
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => {
                  const type = getTypeInfo(event.event_type);

                  const start = formatTime(event.start_time);
                  const end = formatTime(event.end_time);

                  const isDeleting =
                    deletingId === event.id;

                  return (
                    <article
                      key={event.id}
                      className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"
                    >
                      {/* EN-TÊTE */}

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                            {type.icon}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-bold text-slate-900">
                                {event.title}
                              </h2>

                              {event.source_detected_event && (
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                  📄 Document
                                </span>
                              )}

                              {!event.source_detected_event && (
                                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                                  ✏️ Personnel
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm capitalize text-slate-500">
                              {formatDate(event.date)}
                            </p>
                          </div>
                        </div>

                        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {type.label}
                        </span>
                      </div>

                      {/* INFORMATIONS */}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {(start || end) && (
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              Heure
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              🕐 {start ?? "--:--"}
                              {end && ` → ${end}`}
                            </p>
                          </div>
                        )}

                        {event.location && (
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              Lieu
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              📍 {event.location}
                            </p>
                          </div>
                        )}

                        {event.responsible && (
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              Responsable
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              👤 {event.responsible}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* DESCRIPTION */}

                      {event.description && (
                        <div className="mt-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Description
                          </p>

                          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                            {event.description}
                          </p>
                        </div>
                      )}

                      {/* RAPPEL */}

                      {event.reminder_enabled && (
                        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-amber-600">
                          🔔 Rappel {event.reminder_minutes} minute
                          {event.reminder_minutes > 1 ? "s" : ""} avant
                        </div>
                      )}

                      {/* ACTIONS */}

                      <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => openEditForm(event)}
                          className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          ✏️ Modifier
                        </button>

                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => deleteEvent(event)}
                          className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {isDeleting
                            ? "Suppression..."
                            : "🗑 Supprimer"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* MODALE CRÉATION / MODIFICATION */}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-5">
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  {editingEvent
                    ? "Modification"
                    : "Nouvel événement"}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {editingEvent
                    ? "Modifier l'événement"
                    : "Créer un événement"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Ajoutez les informations de votre événement.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-full bg-slate-100 px-3 py-2 text-slate-500"
              >
                ✕
              </button>
            </div>

            {/* FORMULAIRE */}

            <div className="mt-6 space-y-5">
              {/* TITRE */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Titre *
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    updateForm("title", e.target.value)
                  }
                  placeholder="Ex. Réunion avec le comité"
                  className="mt-2 w-full rounded-xl border text-slate-700 border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* TYPE */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Type d'événement
                </label>

                <select
                  value={form.event_type}
                  onChange={(e) =>
                    updateForm("event_type", e.target.value)
                  }
                  className="mt-2 w-full  text-slate-700 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                >
                  {EVENT_TYPES.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATE */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Date *
                </label>

                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    updateForm("date", e.target.value)
                  }
                  className="mt-2 w-full text-slate-700 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              {/* HEURES */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Heure de début
                  </label>

                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) =>
                      updateForm(
                        "start_time",
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full text-slate-700 rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Heure de fin
                  </label>

                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) =>
                      updateForm(
                        "end_time",
                        e.target.value,
                      )
                    }
                    className="mt-2 w-full text-slate-700 rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>
              </div>

              {/* LIEU */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Lieu
                </label>

                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    updateForm("location", e.target.value)
                  }
                  placeholder="Ex. Centre bahá'í"
                  className="mt-2 w-full text-slate-700 rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              {/* RESPONSABLE */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Responsable
                </label>

                <input
                  type="text"
                  value={form.responsible}
                  onChange={(e) =>
                    updateForm(
                      "responsible",
                      e.target.value,
                    )
                  }
                  placeholder="Nom du responsable"
                  className="mt-2 w-full text-slate-700 rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    updateForm(
                      "description",
                      e.target.value,
                    )
                  }
                  placeholder="Ajoutez une description..."
                  className="mt-2 w-full resize-none rounded-xl text-slate-700 border border-slate-300 px-4 py-3"
                />
              </div>

              {/* RAPPEL */}

              <div className="rounded-2xl bg-slate-50 p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.reminder_enabled}
                    onChange={(e) =>
                      updateForm(
                        "reminder_enabled",
                        e.target.checked,
                      )
                    }
                    className="h-5 w-5 rounded text-slate-700"
                  />

                  <div>
                    <p className="font-semibold text-slate-800">
                      🔔 Activer le rappel
                    </p>

                    <p className="text-xs text-slate-500">
                      Recevoir une notification avant
                      l'événement.
                    </p>
                  </div>
                </label>

                {form.reminder_enabled && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-slate-700">
                      Rappeler
                    </label>

                    <select
                      value={form.reminder_minutes}
                      onChange={(e) =>
                        updateForm(
                          "reminder_minutes",
                          Number(e.target.value),
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value={1}>
                        1 minute avant
                      </option>

                      <option value={2}>
                        2 minutes avant
                      </option>

                      <option value={5}>
                        5 minutes avant
                      </option>

                      <option value={15}>
                        15 minutes avant
                      </option>

                      <option value={30}>
                        30 minutes avant
                      </option>

                      <option value={60}>
                        1 heure avant
                      </option>

                      <option value={120}>
                        2 heures avant
                      </option>

                      <option value={1440}>
                        1 jour avant
                      </option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* ERREUR FORMULAIRE */}

            {formError && (
              <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                ⚠️ {formError}
              </div>
            )}

            {/* ACTIONS */}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={saveEvent}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement..."
                  : editingEvent
                    ? "✓ Enregistrer les modifications"
                    : "✓ Créer l'événement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION */}
        <BottomNavigation />
    </main>
  );
}

