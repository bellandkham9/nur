"use client";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useSearchParams,
} from "next/navigation";

import {
  apiFetch,
  markNotificationAsRead,
} from "@/lib/api";




interface PersonalEvent {
  id: number;
  title: string;
  description: string;
  event_type: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  responsible: string | null;
  reminder_enabled: boolean;
  reminder_minutes: number;
}

export default function EventPage() {
  const params = useParams();

  const id = params.id as string;
  const router = useRouter();

  const [event, setEvent] = useState<PersonalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 
  const searchParams = useSearchParams();

  const notificationId =
    searchParams.get("notification_id");
    
  useEffect(() => {
    if (!id) return;

    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔎 Chargement de l'événement :", id);

        const data = await apiFetch(
          `/api/personal-events/${id}/`
        );

        console.log("✅ Événement récupéré :", data);

        setEvent(data);

        if (notificationId) {
          try {
            await markNotificationAsRead(
              Number(notificationId)
            );

            console.log(
              "✅ Notification marquée comme lue :",
              notificationId
            );
          } catch (error) {
            console.error(
              "❌ Impossible de marquer la notification comme lue :",
              error
            );
          }
        }

      } catch (err) {
        console.error(
          "❌ Erreur chargement événement :",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger l'événement."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id, notificationId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Chargement de l'événement...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-700 mb-2">
            Événement introuvable
          </h1>

          <p className="text-red-600">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Aucun événement trouvé.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* En-tête */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Événement personnel #{event.id}
          </p>

            <button
            onClick={() => router.push("/events")}
            className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
            ← Retour
            </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            {event.title}
          </h1>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">

          {/* Description */}
          {event.description && (
            <section>
              <h2 className="font-semibold text-gray-700 mb-2">
                Description
              </h2>

              <p className="text-gray-600">
                {event.description}
              </p>
            </section>
          )}

          {/* Date et heure */}
          <section>
            <h2 className="font-semibold text-gray-700 mb-2">
              📅 Date et heure
            </h2>

            <p className="text-gray-800">
              {event.date}
            </p>

            {(event.start_time || event.end_time) && (
              <p className="text-gray-600 mt-1">
                {event.start_time || ""}
                {event.end_time
                  ? ` → ${event.end_time}`
                  : ""}
              </p>
            )}
          </section>

          {/* Type */}
          <section>
            <h2 className="font-semibold text-gray-700 mb-2">
              Type
            </h2>

            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
              {event.event_type}
            </span>
          </section>

          {/* Lieu */}
          {event.location && (
            <section>
              <h2 className="font-semibold text-gray-700 mb-2">
                📍 Lieu
              </h2>

              <p className="text-gray-600">
                {event.location}
              </p>
            </section>
          )}

          {/* Responsable */}
          {event.responsible && (
            <section>
              <h2 className="font-semibold text-gray-700 mb-2">
                👤 Responsable
              </h2>

              <p className="text-gray-600">
                {event.responsible}
              </p>
            </section>
          )}

          {/* Rappel */}
          <section>
            <h2 className="font-semibold text-gray-700 mb-2">
              🔔 Rappel
            </h2>

            {event.reminder_enabled ? (
              <p className="text-green-600">
                Activé — {event.reminder_minutes} minute(s)
                avant l'événement
              </p>
            ) : (
              <p className="text-gray-500">
                Désactivé
              </p>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}

