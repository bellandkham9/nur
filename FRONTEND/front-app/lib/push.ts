const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

/**
 * Vérifie si le navigateur supporte Web Push.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Enregistre/récupère le Service Worker.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isPushSupported()) {
    throw new Error(
      "Les notifications Push ne sont pas supportées par ce navigateur.",
    );
  }

  const registration =
    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

  console.log("✅ Service Worker prêt :", registration.scope);

  return registration;
}

/**
 * Demande la permission d'afficher des notifications.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error(
      "Les notifications ne sont pas supportées.",
    );
  }

  const permission = await Notification.requestPermission();

  console.log(
    "🔔 Permission notification :",
    permission,
  );

  return permission;
}

/**
 * Convertit la clé VAPID en Uint8Array.
 */
function urlBase64ToUint8Array(
  base64String: string,
): ArrayBuffer {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4,
  );

  const base64 = (
    base64String +
    padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer;
}

/**
 * Récupère l'abonnement Push actuel.
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  const registration =
    await registerServiceWorker();

  return registration.pushManager.getSubscription();
}

/**
 * Crée un abonnement Push.
 */
export async function subscribeToPush(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error(
      "Web Push non supporté.",
    );
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error(
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY est manquante.",
    );
  }

  const registration =
    await registerServiceWorker();

  let subscription =
    await registration.pushManager.getSubscription();

  if (subscription) {
    console.log(
      "ℹ️ Abonnement Push déjà existant.",
    );

    return subscription;
  }

  subscription =
    await registration.pushManager.subscribe({
      userVisibleOnly: true,

      applicationServerKey:
        urlBase64ToUint8Array(
          VAPID_PUBLIC_KEY,
        ),
    });

  console.log(
    "✅ Nouvel abonnement Push créé.",
  );

  return subscription;
}


/**
 * Envoie l'abonnement à Django.
 */

/**
 * Retourne un access token valide.
 *
 * Si l'access token est expiré, le refresh token
 * est utilisé automatiquement.
 */
async function getValidAccessToken(): Promise<string> {
  let accessToken =
    localStorage.getItem("access_token");

  const refreshToken =
    localStorage.getItem("refresh_token");

  if (!accessToken) {
    throw new Error(
      "Utilisateur non authentifié : access_token introuvable."
    );
  }

  // ------------------------------------------------------
  // Vérification de l'expiration du JWT
  // ------------------------------------------------------

  try {
    const payload = JSON.parse(
      atob(
        accessToken
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    const expiration =
      payload.exp * 1000;

    const now = Date.now();

    // On considère le token comme expiré
    // 30 secondes avant sa vraie expiration.
    const isExpired =
      expiration <= now + 30_000;

    if (!isExpired) {
      return accessToken;
    }

    console.log(
      "⏰ Access token expiré → renouvellement..."
    );
  } catch (error) {
    console.warn(
      "⚠️ Impossible de lire le JWT.",
      error
    );
  }

  // ------------------------------------------------------
  // Refresh token
  // ------------------------------------------------------

  if (!refreshToken) {
    localStorage.removeItem("access_token");

    throw new Error(
      "Session expirée : refresh_token introuvable."
    );
  }

  const response = await fetch(
    `${API_URL}/api/token/refresh/`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        refresh: refreshToken,
      }),
    }
  );

  if (!response.ok) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    throw new Error(
      "Session expirée. Veuillez vous reconnecter."
    );
  }

  const data = await response.json();

  if (!data.access || typeof data.access !== 'string') {
    throw new Error(
      "Impossible de renouveler le token."
    );
  }

  const newAccessToken = data.access;
  accessToken = newAccessToken;

  localStorage.setItem(
    "access_token",
    newAccessToken
  );

  console.log(
    "✅ Access token renouvelé avec succès."
  );

  return newAccessToken;
}

export async function sendSubscriptionToBackend(
  subscription: PushSubscription,
): Promise<void> {
  const json = subscription.toJSON();

  if (
    !json.endpoint ||
    !json.keys?.p256dh ||
    !json.keys?.auth
  ) {
    throw new Error("Abonnement Push invalide.");
  }

  const token =
  await getValidAccessToken();

  console.log(
    "🔐 Token JWT valide pour l'abonnement Push."
  );

  console.log("🔐 Token JWT trouvé pour l'abonnement Push.");

  const response = await fetch(
    `${API_URL}/api/notifications/push-subscriptions/subscribe/`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },

      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Erreur API Push (${response.status}) : ${text}`,
    );
  }

  const data = await response.json();

  console.log(
    "✅ Abonnement enregistré dans Django :",
    data,
  );
}
/**
 * Abonnement complet :
 *
 * Service Worker
 *      ↓
 * Permission
 *      ↓
 * PushManager
 *      ↓
 * Django
 */
export async function enablePushNotifications(): Promise<PushSubscription> {
  const permission =
    await requestNotificationPermission();

  if (permission !== "granted") {
    throw new Error(
      "Permission de notification refusée.",
    );
  }

  const subscription =
    await subscribeToPush();

  await sendSubscriptionToBackend(
    subscription,
  );

  return subscription;
}

/**
 * Désabonne le navigateur du Push
 * et informe Django.
 */

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getPushSubscription();

  if (!subscription) {
    console.log("ℹ️ Aucun abonnement Push.");
    return;
  }

  const endpoint = subscription.endpoint;

  // 🔐 Récupération du JWT
const token =
  await getValidAccessToken();

  if (!token) {
    throw new Error(
      "Utilisateur non authentifié : access_token introuvable.",
    );
  }

  const response = await fetch(
    `${API_URL}/api/notifications/push-subscriptions/unsubscribe/`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },

      body: JSON.stringify({
        endpoint,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Erreur suppression abonnement (${response.status}) : ${text}`,
    );
  }

  await subscription.unsubscribe();

  console.log("✅ Abonnement Push supprimé.");
}

