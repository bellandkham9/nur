"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { DetectedEvent } from "@/types/document";
import BottomNavigation from "@/components/navigation/BottomNavigation";

interface DocumentDetail {
  id: number;
  original_name: string;
  document_type: string;
  status: string;
  page_count: number;
  error_message: string;
  created_at: string;
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [document, setDocument] = useState<DocumentDetail | null>(null);

  const [events, setEvents] = useState<DetectedEvent[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [processingEvent, setProcessingEvent] = useState<number | null>(null);

  const [showConfirmForm, setShowConfirmForm] = useState(false);

  const [confirmDate, setConfirmDate] = useState("");

  const [confirming, setConfirming] = useState(false);

  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [confirmingEvent, setConfirmingEvent] = useState<DetectedEvent | null>(
    null,
  );

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


  const [confirmForm, setConfirmForm] = useState({
    title: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    responsible: "",
    description: "",
    reminder_enabled: true,
    reminder_minutes: 30,
  });

  const [notifications, setNotifications] = useState<
      NotificationItem[]
    >([]);


   const unreadCount = useMemo(() => {
      return notifications.filter(
        (notification) =>
          notification.status !== "READ"
      ).length;
    }, [notifications]);
  

  useEffect(() => {
    async function load() {
      try {
        const { id } = await params;

        setLoading(true);
        setError(null);

        const documentData = await apiFetch(`/api/document-imports/${id}/`);

        setDocument(documentData);

        /*
         * Les événements détectés appartiennent
         * au document.
         */
        const eventsData = await apiFetch(
          `/api/document-imports/${id}/detected-events/`,
        );

        setEvents(
          Array.isArray(eventsData) ? eventsData : (eventsData.results ?? []),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger le document.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params]);

  function openConfirmation(event: DetectedEvent) {
    setConfirmError(null);

    setConfirmForm({
      title: event.title ?? "",
      date: event.event_date ?? "",
      start_time: event.start_time ?? "",
      end_time: event.end_time ?? "",
      location: event.location ?? "",
      responsible: event.responsible ?? "",
      description: event.description ?? "",
      reminder_enabled: (event as any).reminder_enabled ?? true,
      reminder_minutes: 30,
    });

    setConfirmingEvent(event);
  }

  async function confirmEvent(eventId: number) {
    try {
      setConfirming(true);
      setConfirmError(null);

      // La date est obligatoire
      if (!confirmForm.date) {
        setConfirmError("Veuillez sélectionner une date.");
        return;
      }

      const body = {
        title: confirmForm.title,
        date: confirmForm.date,
        start_time: confirmForm.start_time || null,
        end_time: confirmForm.end_time || null,
        location: confirmForm.location,
        responsible: confirmForm.responsible,
        description: confirmForm.description,
        reminder_enabled: confirmForm.reminder_enabled,
        reminder_minutes: confirmForm.reminder_minutes,
      };

      console.log("CONFIRMATION ÉVÉNEMENT :", body);

      await apiFetch(
        `/api/document-imports/detected-events/${eventId}/confirm/`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      // Mettre immédiatement l'événement comme confirmé
      setEvents((current) =>
        current.map((event) =>
          event.id === eventId
            ? {
                ...event,
                status: "CONFIRMED",
                event_date: confirmForm.date,
                start_time: confirmForm.start_time || null,
                end_time: confirmForm.end_time || null,
                location: confirmForm.location,
                responsible: confirmForm.responsible,
                description: confirmForm.description,
              }
            : event,
        ),
      );

      // Fermer la fenêtre
      setConfirmingEvent(null);

      // Nettoyer l'erreur
      setConfirmError(null);

    } catch (err) {
      setConfirmError(
        err instanceof Error
          ? err.message
          : "Impossible de confirmer l'événement.",
      );
    } finally {
      setConfirming(false);
    }
  }



  async function rejectEvent(eventId: number) {
    try {
      setProcessingEvent(eventId);

      await apiFetch(
        `/api/document-imports/detected-events/${eventId}/reject/`,
        {
          method: "POST",
        },
      );

      setEvents((current) =>
        current.map((event) =>
          event.id === eventId
            ? {
                ...event,
                status: "REJECTED",
              }
            : event,
        ),
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Impossible de rejeter l'événement.",
      );
    } finally {
      setProcessingEvent(null);
    }
  }

  function formatDate(date: string | null) {
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

  function formatTime(time: string | null) {
    if (!time) {
      return null;
    }

    return time.substring(0, 5);
  }

  function statusLabel(status: string) {
    switch (status) {
      case "DETECTED":
        return "Détecté";

      case "REVIEW":
        return "À vérifier";

      case "CONFIRMED":
        return "Confirmé";

      case "REJECTED":
        return "Rejeté";

      default:
        return status;
    }
  }

  function statusClass(status: string) {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-100 text-emerald-700";

      case "REJECTED":
        return "bg-red-100 text-red-700";

      case "REVIEW":
        return "bg-amber-100 text-amber-700";

      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center">
          <div className="text-4xl">⏳</div>

          <p className="mt-3 text-sm text-slate-500">
            Chargement du document...
          </p>
        </div>
      </main>
    );
  }

  if (error || !document) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
            <div className="text-4xl">⚠️</div>

            <h1 className="mt-4 text-xl font-bold text-red-800">
              Impossible de charger le document
            </h1>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <Link
              href="/documents"
              className="mt-5 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              ← Retour aux documents
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const confirmedCount = events.filter(
    (event) => event.status === "CONFIRMED",
  ).length;

  const pendingCount = events.filter(
    (event) => event.status !== "CONFIRMED" && event.status !== "REJECTED",
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-5 py-5">
          <Link
            href="/documents"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Documents
          </Link>

          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              📄
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-slate-900">
                {document.original_name}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {document.document_type}
                {" • "}
                {document.page_count} page
                {document.page_count > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENU */}

      <div className="mx-auto max-w-5xl px-5 py-6">
        {/* RÉSUMÉ */}

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Événements
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {events.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              À vérifier
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Confirmés
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {confirmedCount}
            </p>
          </div>
        </section>

        {/* ÉVÉNEMENTS */}

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
              Analyse automatique
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Événements détectés
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Vérifiez les informations avant de les ajouter à votre calendrier.
            </p>
          </div>

          {events.length === 0 && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">🔍</div>

              <h3 className="mt-4 font-bold text-slate-900">
                Aucun événement détecté
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                L'analyse du document n'a trouvé aucun événement exploitable.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {events.map((event) => {
              const startTime = formatTime(event.start_time);

              const endTime = formatTime(event.end_time);

              const isProcessing = processingEvent === event.id;

              return (
                <article
                  key={event.id}
                  className="rounded-3xl bg-white p-6 shadow-sm"
                >
                  {/* TITRE */}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl">
                        📅
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {event.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(event.event_date)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        event.status,
                      )}`}
                    >
                      {statusLabel(event.status)}
                    </span>
                  </div>

                  {/* INFORMATIONS */}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {startTime && (
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Heure</p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {startTime}
                          {endTime && ` → ${endTime}`}
                        </p>
                      </div>
                    )}

                    {event.location && (
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Lieu</p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          📍 {event.location}
                        </p>
                      </div>
                    )}

                    {event.responsible && (
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Responsable</p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          👤 {event.responsible}
                        </p>
                      </div>
                    )}

                    {event.category && (
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Catégorie</p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {event.category}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* DESCRIPTION */}

                  {event.description && (
                    <div className="mt-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Description
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* OBJECTIF */}

                  {event.objective && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Objectif
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {event.objective}
                      </p>
                    </div>
                  )}

                  {/* CONFIANCE */}

                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        Confiance de la détection
                      </span>

                      <span className="text-xs font-bold text-emerald-600">
                        {Math.round(event.confidence * 100)}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.min(
                            Math.max(event.confidence * 100, 0),
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* ACTIONS */}

                  {event.status !== "CONFIRMED" &&
                    event.status !== "REJECTED" && (
                      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => openConfirmation(event)}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          ✓ Confirmer
                        </button>

                        {confirmingEvent && (
                          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-5">
                            <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-2xl sm:rounded-3xl">
                              {/* HEADER */}

                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium text-emerald-600">
                                    Vérification
                                  </p>

                                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                                    Confirmer l'événement
                                  </h2>

                                  <p className="mt-1 text-sm text-slate-500">
                                    Vérifiez les informations détectées avant de
                                    les ajouter à votre calendrier.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setConfirmingEvent(null)}
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
                                    value={confirmForm.title}
                                    onChange={(e) =>
                                      setConfirmForm({
                                        ...confirmForm,
                                        title: e.target.value,
                                      })
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
                                  />
                                </div>

                                {/* DATE */}

                                <div>
                                  <label className="text-sm font-semibold text-slate-700">
                                    Date *
                                  </label>

                                  <input
                                    type="date"
                                    value={confirmForm.date}
                                    onChange={(e) =>
                                      setConfirmForm({
                                        ...confirmForm,
                                        date: e.target.value,
                                      })
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
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
                                      value={confirmForm.start_time}
                                      onChange={(e) =>
                                        setConfirmForm({
                                          ...confirmForm,
                                          start_time: e.target.value,
                                        })
                                      }
                                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-sm font-semibold text-slate-700">
                                      Heure de fin
                                    </label>

                                    <input
                                      type="time"
                                      value={confirmForm.end_time}
                                      onChange={(e) =>
                                        setConfirmForm({
                                          ...confirmForm,
                                          end_time: e.target.value,
                                        })
                                      }
                                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
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
                                    value={confirmForm.location}
                                    onChange={(e) =>
                                      setConfirmForm({
                                        ...confirmForm,
                                        location: e.target.value,
                                      })
                                    }
                                    placeholder="Lieu de l'activité"
                                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                                  />
                                </div>

                                {/* RESPONSABLE */}

                                <div>
                                  <label className="text-sm font-semibold text-slate-700">
                                    Responsable
                                  </label>

                                  <input
                                    type="text"
                                    value={confirmForm.responsible}
                                    onChange={(e) =>
                                      setConfirmForm({
                                        ...confirmForm,
                                        responsible: e.target.value,
                                      })
                                    }
                                    placeholder="Nom du responsable"
                                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                                  />
                                </div>

                                {/* DESCRIPTION */}

                                <div>
                                  <label className="text-sm font-semibold text-slate-700">
                                    Description
                                  </label>

                                  <textarea
                                    rows={4}
                                    value={confirmForm.description}
                                    onChange={(e) =>
                                      setConfirmForm({
                                        ...confirmForm,
                                        description: e.target.value,
                                      })
                                    }
                                    className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3"
                                  />
                                </div>

                                {/* RAPPEL */}

                                <div className="rounded-2xl bg-slate-50 p-4">
                                  <label className="flex cursor-pointer items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={confirmForm.reminder_enabled}
                                      onChange={(e) =>
                                        setConfirmForm({
                                          ...confirmForm,
                                          reminder_enabled: e.target.checked,
                                        })
                                      }
                                      className="h-5 w-5 rounded"
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

                                  {confirmForm.reminder_enabled && (
                                    <div className="mt-4">
                                      <label className="text-sm font-medium text-slate-700">
                                        Rappel
                                      </label>

                                      <select
                                        value={confirmForm.reminder_minutes}
                                        onChange={(e) =>
                                          setConfirmForm({
                                            ...confirmForm,
                                            reminder_minutes: Number(
                                              e.target.value,
                                            ),
                                          })
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                                      >
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

                              {/* ERREUR */}

                              {confirmError && (
                                <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                                  ⚠️ {confirmError}
                                </div>
                              )}

                              {/* ACTIONS */}

                              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                  type="button"
                                  onClick={() => setConfirmingEvent(null)}
                                  disabled={confirming}
                                  className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700"
                                >
                                  Annuler
                                </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirmingEvent) {
                                        confirmEvent(confirmingEvent.id);
                                      }
                                    }}
                                    disabled={confirming || !confirmForm.date}
                                    className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {confirming
                                      ? "Confirmation..."
                                      : "✓ Confirmer l'événement"}
                                  </button>


                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => rejectEvent(event.id)}
                          className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ✕ Rejeter
                        </button>
                      </div>
                    )}

                  {event.status === "CONFIRMED" && (
                    <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                      ✓ Cet événement a été ajouté à votre calendrier.
                    </div>
                  )}

                  {event.status === "REJECTED" && (
                    <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
                      Cet événement a été rejeté.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {/* NAVIGATION */}

    <BottomNavigation />
    </main>
  );
}
