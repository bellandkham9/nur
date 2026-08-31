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
// COOKIE AUTH
// ============================================================

function setAccessTokenCookie(
  token: string
): void {

  document.cookie =
    `access_token=${encodeURIComponent(token)}; ` +
    "path=/; " +
    `max-age=${60 * 60}; ` +
    "SameSite=Lax";
}


function removeAccessTokenCookie(): void {

  document.cookie =
    "access_token=; " +
    "path=/; " +
    "max-age=0; " +
    "SameSite=Lax";
}


// ============================================================
// NETTOYAGE AUTH
// ============================================================

function clearAuth(): void {

  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );

  removeAccessTokenCookie();
}


// ============================================================
// REDIRECTION LOGIN
// ============================================================

function redirectToLogin(): void {

  if (typeof window === "undefined") {
    return;
  }

  clearAuth();

  const currentPath =
    window.location.pathname;

  window.location.href =
    `/login?next=${encodeURIComponent(
      currentPath
    )}`;
}


// ============================================================
// LOGIN
// ============================================================

export async function login(
  username: string,
  password: string
) {

  const response = await fetch(
    `${API_URL}/api/token/`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        username,
        password,
      }),
    }
  );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data?.detail ||
      "Nom d'utilisateur ou mot de passe incorrect."
    );
  }


  if (
    !data?.access ||
    !data?.refresh
  ) {

    throw new Error(
      "La réponse du serveur ne contient pas les tokens JWT."
    );
  }


  localStorage.setItem(
    "access_token",
    data.access
  );


  localStorage.setItem(
    "refresh_token",
    data.refresh
  );


  setAccessTokenCookie(
    data.access
  );


  console.log(
    "✅ Connexion réussie."
  );


  return data;
}


// ============================================================
// REGISTER
// ============================================================

export async function register(
  username: string,
  email: string,
  password: string,
  passwordConfirm: string,
  country: string
) {

  const response = await fetch(
    `${API_URL}/api/accounts/register/`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        username,
        email,
        password,
        password_confirm:
          passwordConfirm,
        country,
      }),
    }
  );


  const data =
    await response.json();


  if (!response.ok) {

    const errorMessage =
      data?.username?.[0] ||
      data?.email?.[0] ||
      data?.password?.[0] ||
      data?.password_confirm?.[0] ||
      data?.country?.[0] ||
      data?.detail ||
      data?.message ||
      "Impossible de créer le compte.";


    throw new Error(
      errorMessage
    );
  }


  return data;
}


// ============================================================
// API FETCH CENTRALISÉ
// ============================================================

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {

  let accessToken =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "access_token"
        )
      : null;


  const refreshToken =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "refresh_token"
        )
      : null;


  // ==========================================================
  // EFFECTUER UNE REQUÊTE
  // ==========================================================

  const makeRequest = async (
    token: string | null
  ) => {

    const headers =
      new Headers(
        options.headers
      );


    // --------------------------------------------------------
    // JSON automatique
    // --------------------------------------------------------

    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers.has(
        "Content-Type"
      )
    ) {

      headers.set(
        "Content-Type",
        "application/json"
      );
    }


    // --------------------------------------------------------
    // JWT
    // --------------------------------------------------------

    if (token) {

      headers.set(
        "Authorization",
        `Bearer ${token}`
      );
    }


    const url =
      `${API_URL}${endpoint}`;


    console.log(
      "🌐 API REQUEST"
    );

    console.log(
      "➡️ URL :",
      url
    );

    console.log(
      "🔐 Token :",
      token
        ? "PRÉSENT"
        : "ABSENT"
    );


    return fetch(
      url,
      {
        ...options,
        headers,
      }
    );
  };


  // ==========================================================
  // 1. PREMIÈRE REQUÊTE
  // ==========================================================

  let response =
    await makeRequest(
      accessToken
    );


  // ==========================================================
  // 2. ACCESS TOKEN EXPIRÉ
  // ==========================================================

  if (
    response.status === 401 &&
    refreshToken
  ) {

    console.log(
      "🔄 Access token expiré. Tentative de refresh..."
    );


    const refreshResponse =
      await fetch(
        `${API_URL}/api/token/refresh/`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              refresh:
                refreshToken,
            }),
        }
      );


    // ========================================================
    // REFRESH RÉUSSI
    // ========================================================

    if (
      refreshResponse.ok
    ) {

      const refreshData =
        await refreshResponse.json();


      const newAccessToken =
        refreshData.access;


      if (!newAccessToken) {

        clearAuth();

        throw new Error(
          "Le serveur n'a pas renvoyé de nouvel access token."
        );
      }


      // Sauvegarde nouveau token

      localStorage.setItem(
        "access_token",
        newAccessToken
      );


      // Mise à jour cookie middleware

      setAccessTokenCookie(
        newAccessToken
      );


      // Rotation refresh token éventuelle

      if (
        refreshData.refresh
      ) {

        localStorage.setItem(
          "refresh_token",
          refreshData.refresh
        );
      }


      console.log(
        "✅ Nouveau access token obtenu."
      );


      // Nouvelle requête

      response =
        await makeRequest(
          newAccessToken
        );


    } else {

      // ======================================================
      // REFRESH EXPIRÉ / INVALIDE
      // ======================================================

      console.error(
        "❌ Session expirée."
      );


      clearAuth();


      if (
        typeof window !== "undefined"
      ) {

        window.location.href =
          `/login?next=${encodeURIComponent(
            window.location.pathname
          )}`;
      }


      throw new Error(
        "Votre session a expiré. Veuillez vous reconnecter."
      );
    }
  }


  // ==========================================================
  // LECTURE DE LA RÉPONSE
  // ==========================================================

  const text =
    await response.text();


  let data: any = null;


  try {

    data =
      text
        ? JSON.parse(text)
        : null;

  } catch {

    data = text;
  }


  // ==========================================================
  // ERREURS HTTP
  // ==========================================================

  if (!response.ok) {

    // --------------------------------------------------------
    // 401 sans refresh possible
    // --------------------------------------------------------

    if (
      response.status === 401
    ) {

      console.error(
        "❌ Non authentifié."
      );


      if (
        typeof window !== "undefined"
      ) {

        redirectToLogin();
      }
    }


    throw new Error(
      data?.detail ||
      data?.message ||
      `Erreur HTTP ${response.status}`
    );
  }


  return data;
}


// ============================================================
// LOGOUT
// ============================================================

export function logout(): void {

  clearAuth();


  window.location.href =
    "/login";
}


// ============================================================
// AUTHENTIFICATION
// ============================================================

export function isAuthenticated(): boolean {

  if (
    typeof window === "undefined"
  ) {

    return false;
  }


  return Boolean(
    localStorage.getItem(
      "access_token"
    )
  );
}


// ============================================================
// UTILISATEUR CONNECTÉ
// ============================================================

export interface CurrentUser {

  id: number;

  username: string;

  email: string;
}


export async function getCurrentUser():
  Promise<CurrentUser> {

  return apiFetch(
    "/api/accounts/me/"
  );
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

      body:
        JSON.stringify(
          preferences
        ),
    }
  );
}


// ============================================================
// COMMUNAUTÉS
// ============================================================

export async function getCommunities() {

  return apiFetch(
    "/api/communities/"
  );
}


export async function getMyCommunities() {

  return apiFetch(
    "/api/communities/my/"
  );
}


export async function getMyMemberships() {

  return apiFetch(
    "/api/communities/memberships/my/"
  );
}


export async function getCommunityMembers(
  communityId: number
) {

  return apiFetch(
    `/api/communities/${communityId}/members/`
  );
}


export async function leaveCommunity(
  communityId: number
) {

  return apiFetch(
    "/api/communities/memberships/leave/",
    {
      method: "POST",

      body:
        JSON.stringify({
          community:
            communityId,
        }),
    }
  );
}