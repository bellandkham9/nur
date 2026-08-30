import { apiFetch } from "@/lib/api";
import { enqueueAnalyticsEvent } from "@/lib/offlineQueue";

// ============================================================
// TYPES — ANALYTICS
// ============================================================

export type AnalyticsEventType =
  | "PAGE_VIEW"
  | "APP_OPEN"
  | "QUIZ_START"
  | "QUIZ_COMPLETE"
  | "DAILY_QUOTE_VIEW"
  | "EVENT_VIEW"
  | "NOTIFICATION_OPEN"
  | "OFFLINE"
  | "ONLINE"
  | "PWA_INSTALL"
  | "CUSTOM";

// ============================================================
// PAYLOAD D'UN ÉVÉNEMENT
// ============================================================

export interface AnalyticsEventPayload {
  event_type: AnalyticsEventType;
  path?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
  client_id?: string;
  created_at?: string;
}

// ============================================================
// TYPES — DASHBOARD
// ============================================================

export interface AnalyticsSummary {
  total_events: number;
  active_users: number;
  app_opens: number;
  page_views: number;
  quiz_starts: number;
  quiz_completes: number;
  quotes_views: number;
  notifications_opened: number;
  pwa_installs: number;
}

export interface AnalyticsDailyStat {
  date: string;
  events: number;
  active_users: number;
}

export interface AnalyticsEventTypeStat {
  event_type: AnalyticsEventType;
  count: number;
}

export interface AnalyticsPopularPage {
  path: string;
  count: number;
}

export interface AnalyticsStats {
  period: {
    days: number;
    start: string;
    end: string;
  };

  summary: AnalyticsSummary;

  daily: AnalyticsDailyStat[];

  event_types: AnalyticsEventTypeStat[];

  popular_pages: AnalyticsPopularPage[];
}

// ============================================================
// CONFIGURATION
// ============================================================

const CLIENT_ID_KEY = "nur_analytics_client_id";
const SESSION_ID_KEY = "nur_analytics_session_id";

// ============================================================
// CLIENT ID
// ============================================================

function getClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);

  if (!clientId) {
    clientId = crypto.randomUUID();

    localStorage.setItem(
      CLIENT_ID_KEY,
      clientId,
    );
  }

  return clientId;
}

// ============================================================
// SESSION ID
// ============================================================

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();

    sessionStorage.setItem(
      SESSION_ID_KEY,
      sessionId,
    );
  }

  return sessionId;
}

// ============================================================
// ENVOI DIRECT AU BACKEND
// ============================================================

async function sendAnalyticsEvent(
  payload: AnalyticsEventPayload,
): Promise<void> {
  await apiFetch(
    "/api/analytics/events/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

// ============================================================
// TRACK EVENT
// ============================================================

export async function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const payload: AnalyticsEventPayload = {
    event_type: eventType,

    path: window.location.pathname,

    metadata,

    session_id: getSessionId(),

    client_id: getClientId(),
  };

  // ==========================================================
  // MODE HORS LIGNE
  // ==========================================================

  if (!navigator.onLine) {
    try {
      await enqueueAnalyticsEvent({
        ...payload,
        created_at: new Date().toISOString(),
      });

      console.log(
        "📴 Analytics enregistré hors ligne :",
        eventType,
      );
    } catch (error) {
      console.error(
        "❌ Impossible d'enregistrer l'analytics offline :",
        error,
      );
    }

    return;
  }

  // ==========================================================
  // MODE EN LIGNE
  // ==========================================================

  try {
    await sendAnalyticsEvent(payload);

    console.log(
      "📊 Analytics envoyé :",
      eventType,
    );
  } catch (error) {
    console.warn(
      "⚠️ Analytics indisponible, mise en file :",
      eventType,
      error,
    );

    // ========================================================
    // SERVEUR INDISPONIBLE
    // On conserve l'événement pour plus tard.
    // ========================================================

    try {
      await enqueueAnalyticsEvent({
        ...payload,
        created_at: new Date().toISOString(),
      });

      console.log(
        "💾 Analytics placé dans la file offline :",
        eventType,
      );
    } catch (queueError) {
      console.error(
        "❌ Impossible de mettre l'événement en file :",
        queueError,
      );
    }
  }
}

// ============================================================
// INITIALISATION ANALYTICS
// ============================================================

export function initializeAnalytics(): void {
  if (typeof window === "undefined") {
    return;
  }

  // ==========================================================
  // SYNCHRONISATION INITIALE
  // ==========================================================

  syncAnalyticsQueue();

  // ==========================================================
  // RETOUR EN LIGNE
  // ==========================================================

  window.addEventListener(
    "online",
    handleOnline,
  );

  // ==========================================================
  // PASSAGE HORS LIGNE
  // ==========================================================

  window.addEventListener(
    "offline",
    handleOffline,
  );
}

// ============================================================
// ONLINE
// ============================================================

async function handleOnline(): Promise<void> {
  console.log(
    "🌐 Connexion rétablie.",
  );

  // On synchronise d'abord
  // les anciens événements.

  await syncAnalyticsQueue();

  // Puis on enregistre le retour en ligne.

  await trackAnalyticsEvent(
    "ONLINE",
  );
}

// ============================================================
// OFFLINE
// ============================================================

function handleOffline(): void {
  console.log(
    "📴 Application hors ligne.",
  );

  trackAnalyticsEvent(
    "OFFLINE",
  );
}

// ============================================================
// SYNCHRONISATION DE LA FILE
// ============================================================

export async function syncAnalyticsQueue(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (!navigator.onLine) {
    console.log(
      "📴 Synchronisation Analytics impossible : hors ligne.",
    );

    return;
  }

  /*
   * La synchronisation réelle de la file est
   * gérée par offlineSync.ts.
   *
   * On importe dynamiquement pour éviter une
   * dépendance circulaire :
   *
   * analytics.ts
   *      ↓
   * offlineSync.ts
   *      ↓
   * analytics.ts
   */

  try {
    const { syncAnalyticsQueue: syncQueue } =
      await import("@/lib/offlineSync");

    await syncQueue();
  } catch (error) {
    console.warn(
      "⚠️ Impossible de synchroniser Analytics :",
      error,
    );
  }
}

// ============================================================
// NOMBRE D'ÉVÉNEMENTS EN ATTENTE
// ============================================================

export async function getPendingAnalyticsCount(): Promise<number> {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const { getPendingAnalyticsCount: getCount } =
      await import("@/lib/offlineQueue");

    return await getCount();
  } catch (error) {
    console.warn(
      "⚠️ Impossible de récupérer le nombre d'événements en attente :",
      error,
    );

    return 0;
  }
}

// ============================================================
// DASHBOARD — STATISTIQUES ADMIN
// ============================================================

export async function getAnalyticsStats(
  days: number = 7,
): Promise<AnalyticsStats> {
  const safeDays = Math.max(
    1,
    Math.min(days, 90),
  );

  return apiFetch(
    `/api/analytics/stats/?days=${safeDays}`,
  );
}

