

// ============================================================
// CONFIGURATION API
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL n'est pas définie."
  );
}

// ============================================================
// API FETCH CENTRALISÉ
// ============================================================

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const headers = new Headers(options.headers);

  // JSON automatiquement pour les requêtes avec body
  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  // JWT
  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const url = `${API_URL}${endpoint}`;

  console.log("🌐 API REQUEST");
  console.log("➡️ URL :", url);
  console.log(
    "🔐 Token :",
    token ? "PRÉSENT" : "ABSENT"
  );
  console.log(
    "🔑 Authorization :",
    headers.get("Authorization")
      ? "Bearer [TOKEN]"
      : "ABSENT"
  );

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log(
    "⬅️ HTTP STATUS :",
    response.status
  );

  const text = await response.text();

  let data: any = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = text;
  }

  console.log(
    "📦 API RESPONSE :",
    data
  );

  if (!response.ok) {
    throw new Error(
      data?.detail ||
      data?.message ||
      `Erreur HTTP ${response.status}`
    );
  }

  return data;
}



// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getNotifications() {
  return apiFetch(
    "/api/notifications/"
  );
}


export async function markNotificationAsRead(
  notificationId: number
) {
  return apiFetch(
    `/api/notifications/${notificationId}/read/`,
    {
      method: "POST",
    }
  );
}


export async function markAllNotificationsAsRead() {
  return apiFetch(
    "/api/notifications/read-all/",
    {
      method: "POST",
    }
  );
}


export async function deleteNotification(
  notificationId: number
) {
  return apiFetch(
    `/api/notifications/${notificationId}/`,
    {
      method: "DELETE",
    }
  );
}


// ============================================================
// PRÉFÉRENCES UTILISATEUR
// ============================================================

export async function getUserPreferences() {
  return apiFetch(
    "/api/accounts/preferences/"
  );
}


export async function updateUserPreferences(
  preferences: {
    push_notifications_enabled?: boolean;
    event_reminders_enabled?: boolean;
    daily_reminder_enabled?: boolean;
  }
) {
  return apiFetch(
    "/api/accounts/preferences/",
    {
      method: "PATCH",
      body: JSON.stringify(preferences),
    }
  );
}


// ============================================================
// COMMUNAUTÉS
// ============================================================

/**
 * Toutes les communautés.
 */
export async function getCommunities() {
  return apiFetch(
    "/api/communities/"
  );
}


/**
 * Communautés auxquelles
 * l'utilisateur appartient.
 */
export async function getMyCommunities() {
  return apiFetch(
    "/api/communities/my/"
  );
}


/**
 * Adhésions de l'utilisateur connecté.
 */
export async function getMyMemberships() {
  return apiFetch(
    "/api/communities/memberships/my/"
  );
}


/**
 * Membres d'une communauté.
 */
export async function getCommunityMembers(
  communityId: number
) {
  return apiFetch(
    `/api/communities/${communityId}/members/`
  );
}


/**
 * Quitter une communauté.
 */
export async function leaveCommunity(
  communityId: number
) {
  return apiFetch(
    "/api/communities/memberships/leave/",
    {
      method: "POST",
      body: JSON.stringify({
        community: communityId,
      }),
    }
  );
}


