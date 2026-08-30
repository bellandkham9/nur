// ============================================================
// NUR / BAHÁ'Í COMPANION
// SYNCHRONISATION ANALYTICS OFFLINE
// ============================================================

import { apiFetch } from "@/lib/api";

import {
  getQueuedAnalyticsEvents,
  removeAnalyticsEvent,
} from "@/lib/offlineQueue";

// ============================================================
// SYNCHRONISATION
// ============================================================

export async function syncAnalyticsQueue(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (!navigator.onLine) {
    console.log(
      "📴 Synchronisation impossible : hors ligne.",
    );

    return;
  }

  const events =
    await getQueuedAnalyticsEvents();

  if (events.length === 0) {
    return;
  }

  console.log(
    `🔄 Synchronisation de ${events.length} événement(s)...`,
  );

  for (const event of events) {
    try {
      await apiFetch(
        "/api/analytics/events/",
        {
          method: "POST",
          body: JSON.stringify({
            event_type: event.event_type,
            path: event.path,
            metadata: event.metadata,
            session_id: event.session_id,
            client_id: event.client_id,
            created_at: event.created_at,
          }),
        },
      );

      if (event.id !== undefined) {
        await removeAnalyticsEvent(
          event.id,
        );
      }

      console.log(
        "✅ Analytics synchronisé :",
        event.event_type,
      );
    } catch (error) {
      console.warn(
        "⚠️ Échec synchronisation Analytics :",
        event.event_type,
        error,
      );

      /*
       * IMPORTANT :
       * On arrête ici.
       *
       * L'événement reste dans IndexedDB
       * et sera retenté plus tard.
       */
      break;
    }
  }
}

// ============================================================
// INITIALISATION DE LA SYNCHRONISATION
// ============================================================

let initialized = false;

export function initializeOfflineSync(): void {
  if (
    typeof window === "undefined" ||
    initialized
  ) {
    return;
  }

  initialized = true;

  // Synchronisation immédiate
  syncAnalyticsQueue();

  // Retour Internet
  window.addEventListener(
    "online",
    () => {
      console.log(
        "🌐 Connexion rétablie.",
      );

      syncAnalyticsQueue();
    },
  );
}