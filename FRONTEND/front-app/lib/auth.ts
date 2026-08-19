const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

// =====================================================
// LOGIN
// =====================================================

export async function login(
  username: string,
  password: string
) {
  const response = await fetch(
    `${API_URL}/api/token/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        `Erreur HTTP ${response.status}`
    );
  }

  if (!data?.access || !data?.refresh) {
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

  console.log("✅ Connexion réussie.");

  return data;
}

// =====================================================
// API FETCH AVEC REFRESH AUTOMATIQUE
// =====================================================

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  let accessToken =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const refreshToken =
    typeof window !== "undefined"
      ? localStorage.getItem("refresh_token")
      : null;

  // ===================================================
  // Fonction interne pour effectuer une requête
  // ===================================================

  const makeRequest = async (
    token: string | null
  ) => {
    const headers = new Headers(
      options.headers
    );

    if (
      options.body &&
      !headers.has("Content-Type")
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    if (token) {
      headers.set(
        "Authorization",
        `Bearer ${token}`
      );
    }

    return fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );
  };

  // ===================================================
  // 1. Première requête
  // ===================================================

  let response =
    await makeRequest(accessToken);

  // ===================================================
  // 2. Access token expiré
  // ===================================================

  if (
    response.status === 401 &&
    refreshToken
  ) {
    console.log(
      "🔄 Access token expiré..."
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
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      );

    // =================================================
    // 3. Refresh réussi
    // =================================================

    if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();

        const newAccessToken = refreshData.access;

        if (!newAccessToken) {
            throw new Error(
            "Le serveur n'a pas renvoyé de nouvel access_token."
            );
        }

        localStorage.setItem(
            "access_token",
            newAccessToken
        );

        if (refreshData.refresh) {
            localStorage.setItem(
            "refresh_token",
            refreshData.refresh
            );
        }

        console.log(
            "✅ Nouveau access_token obtenu."
        );

        response = await makeRequest(
            newAccessToken
        );
        } else {
      // ===============================================
      // 5. Refresh expiré/invalide
      // ===============================================

      console.error(
        "❌ Refresh token invalide ou expiré."
      );

      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "refresh_token"
      );
    }
  }

  // ===================================================
  // 6. Lecture de la réponse
  // ===================================================

  const text =
    await response.text();

  let data: any = null;

  try {
    data = text
      ? JSON.parse(text)
      : null;
  } catch {
    data = text;
  }

  // ===================================================
  // 7. Gestion des erreurs
  // ===================================================

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `Erreur HTTP ${response.status}`
    );
  }

  return data;
}

// =====================================================
// LOGOUT
// =====================================================

export function logout() {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );
}

// =====================================================
// AUTHENTIFICATION
// =====================================================

export function isAuthenticated() {
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

