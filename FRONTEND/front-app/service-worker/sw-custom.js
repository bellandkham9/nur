/* =========================================================
   NUR / BAHÁ'Í COMPANION
   SERVICE WORKER
   OFFLINE + PUSH + PROTECTION CACHE PRIVÉ
   ========================================================= */

/*
 * IMPORTANT
 * ---------------------------------------------------------
 * next-pwa / Workbox injecte automatiquement le manifeste
 * dans self.__WB_MANIFEST lors du build.
 */

self.__WB_MANIFEST;

/* =========================================================
   VERSION DES CACHES
   ========================================================= */

const SW_VERSION = "v3";

const STATIC_CACHE = `nur-static-${SW_VERSION}`;
const API_CACHE = `nur-api-${SW_VERSION}`;

const OFFLINE_URL = "/offline";

/* =========================================================
   ROUTES PUBLIQUES
   ========================================================= */

const PUBLIC_PAGE_PATHS = [
  "/",
  "/login",
  "/register",
  "/offline",
];

/* =========================================================
   API PUBLIQUES
   ========================================================= */

/*
 * IMPORTANT
 * ---------------------------------------------------------
 * On ne met ici QUE des données réellement publiques.
 *
 * NE PAS AJOUTER :
 *
 * /api/token/
 * /api/token/refresh/
 * /api/events/
 * /api/calendar/
 * /api/notifications/
 * /api/communities/
 * /api/profile/
 * /api/settings/
 * /api/analytics/
 *
 * sauf si l'endpoint est explicitement démontré comme
 * totalement indépendant de l'utilisateur connecté.
 */

const CACHEABLE_PUBLIC_APIS = [
  "/api/bahai-calendar/",
  "/api/daily-quotes/",
];

/* =========================================================
   UTILITAIRES
   ========================================================= */

function isPublicPage(url) {
  return PUBLIC_PAGE_PATHS.some(
    (path) =>
      url.pathname === path ||
      (path !== "/" &&
        url.pathname.startsWith(`${path}/`)),
  );
}

function isPublicApi(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }

  return CACHEABLE_PUBLIC_APIS.some((pattern) =>
    url.pathname.startsWith(pattern),
  );
}

/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", (event) => {
  console.log(
    "🔧 NUR Service Worker : installation",
    SW_VERSION,
  );

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(async (cache) => {
        try {
          await cache.add(OFFLINE_URL);

          console.log(
            "✅ Page offline mise en cache",
          );
        } catch (error) {
          console.error(
            "❌ Impossible de mettre /offline en cache :",
            error,
          );
        }
      }),
  );

  self.skipWaiting();
});

/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", (event) => {
  console.log(
    "✅ NUR Service Worker : activation",
    SW_VERSION,
  );

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName.startsWith("nur-") &&
                cacheName !== STATIC_CACHE &&
                cacheName !== API_CACHE
              );
            })
            .map((cacheName) => {
              console.log(
                "🗑️ Suppression ancien cache :",
                cacheName,
              );

              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

/* =========================================================
   RÉPONSE OFFLINE API
   ========================================================= */

function createOfflineApiResponse() {
  return new Response(
    JSON.stringify({
      offline: true,
      message:
        "Données indisponibles hors connexion.",
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  /*
   * -------------------------------------------------------
   * Seulement GET
   * -------------------------------------------------------
   */

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /*
   * -------------------------------------------------------
   * Seulement notre domaine
   * -------------------------------------------------------
   */

  if (url.origin !== self.location.origin) {
    return;
  }

  /* =======================================================
     NEXT.JS INTERNAL
     ======================================================= */

  /*
   * IMPORTANT
   * -------------------------------------------------------
   * On ne touche PAS aux requêtes _next.
   *
   * Cela évite de mettre accidentellement en cache :
   *
   * - RSC
   * - Flight requests
   * - données de navigation
   * - réponses dépendant de l'utilisateur
   */

  if (url.pathname.startsWith("/_next/")) {
    return;
  }

  /* =======================================================
     API
     ======================================================= */

  if (url.pathname.startsWith("/api/")) {
    /*
     * Si l'API n'est pas explicitement publique :
     *
     * → réseau uniquement
     * → aucun cache
     */

    if (!isPublicApi(url)) {
      return;
    }

    /*
     * API PUBLIQUE
     *
     * Network First
     */

    event.respondWith(
      caches
        .open(API_CACHE)
        .then(async (cache) => {
          try {
            const response =
              await fetch(request);

            if (response.ok) {
              await cache.put(
                request,
                response.clone(),
              );
            }

            return response;
          } catch (error) {
            console.log(
              "📴 API publique hors ligne :",
              url.pathname,
            );

            const cached =
              await cache.match(request);

            if (cached) {
              return cached;
            }

            return createOfflineApiResponse();
          }
        }),
    );

    return;
  }

  /* =======================================================
     NAVIGATION
     ======================================================= */

  if (request.mode === "navigate") {
    /*
     * =====================================================
     * ROUTE PRIVÉE
     * =====================================================
     */

    if (!isPublicPage(url)) {
      /*
       * RÈGLE DE SÉCURITÉ ABSOLUE :
       *
       * On ne cherche JAMAIS la page privée dans un cache.
       */

      event.respondWith(
        fetch(request).catch(async () => {
          console.log(
            "🔐 Route privée indisponible hors ligne :",
            url.pathname,
          );

          /*
           * Une page privée ne doit jamais être servie
           * depuis le cache.
           *
           * On affiche uniquement /offline.
           */

          const offlinePage =
            await caches.match(OFFLINE_URL);

          if (offlinePage) {
            return offlinePage;
          }

          return new Response(
            `
              <!DOCTYPE html>
              <html lang="fr">
                <head>
                  <meta charset="UTF-8">
                  <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                  >
                  <title>Hors connexion</title>
                </head>

                <body>
                  <h1>Connexion requise</h1>

                  <p>
                    Cette page nécessite une connexion
                    Internet et une authentification.
                  </p>
                </body>
              </html>
            `,
            {
              status: 503,
              headers: {
                "Content-Type":
                  "text/html; charset=utf-8",
              },
            },
          );
        }),
      );

      return;
    }

    /*
     * =====================================================
     * ROUTE PUBLIQUE
     * =====================================================
     *
     * Les pages publiques peuvent être récupérées
     * depuis le cache.
     */

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone =
              response.clone();

            caches
              .open(STATIC_CACHE)
              .then((cache) =>
                cache.put(request, clone),
              )
              .catch(() => {});
          }

          return response;
        })
        .catch(async () => {
          const cachedPage =
            await caches.match(request);

          if (cachedPage) {
            return cachedPage;
          }

          const offlinePage =
            await caches.match(OFFLINE_URL);

          if (offlinePage) {
            return offlinePage;
          }

          return new Response(
            "Vous êtes hors connexion.",
            {
              status: 503,
              headers: {
                "Content-Type":
                  "text/plain; charset=utf-8",
              },
            },
          );
        }),
    );

    return;
  }

  /*
   * =======================================================
   * TOUT LE RESTE
   * =======================================================
   *
   * On laisse le navigateur / Workbox gérer.
   *
   * C'est volontaire.
   */

  return;
});

/* =========================================================
   PUSH NOTIFICATIONS
   ========================================================= */

self.addEventListener("push", (event) => {
  console.log("📨 Push reçu");

  let data = {};

  try {
    data = event.data
      ? event.data.json()
      : {};
  } catch (error) {
    console.error(
      "❌ Impossible de lire le payload Push :",
      error,
    );

    data = {};
  }

  const title =
    data.title ||
    "Bahá'í Companion";

  const options = {
    body:
      data.body ||
      data.message ||
      "Vous avez une nouvelle notification.",

    icon:
      data.icon ||
      "/icons/notification.png",

    badge:
      data.badge ||
      "/icons/notification.png",

    tag:
      data.tag ||
      "bahai-companion",

    renotify: true,

    data: {
      url: data.url || "/",

      notification_id:
        data.notification_id || null,

      event_id:
        data.event_id || null,

      quote_id:
        data.quote_id || null,
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options,
    ),
  );
});

/* =========================================================
   NOTIFICATION CLICK
   ========================================================= */

self.addEventListener(
  "notificationclick",
  (event) => {
    console.log(
      "🔔 Notification cliquée",
    );

    event.notification.close();

    const action =
      event.action;

    const data =
      event.notification.data || {};

    let url =
      data.url || "/";

    /* =====================================================
       NOTIFICATION ID
       ===================================================== */

    if (data.notification_id) {
      const separator =
        url.includes("?")
          ? "&"
          : "?";

      url =
        `${url}${separator}` +
        `notification_id=${encodeURIComponent(
          data.notification_id,
        )}`;
    }

    /* =====================================================
       QUOTE ID
       ===================================================== */

    if (data.quote_id) {
      const separator =
        url.includes("?")
          ? "&"
          : "?";

      url =
        `${url}${separator}` +
        `quote_id=${encodeURIComponent(
          data.quote_id,
        )}`;
    }

    /* =====================================================
       EVENT ID
       ===================================================== */

    if (data.event_id) {
      const separator =
        url.includes("?")
          ? "&"
          : "?";

      url =
        `${url}${separator}` +
        `event_id=${encodeURIComponent(
          data.event_id,
        )}`;
    }

    /* =====================================================
       OUVERTURE
       ===================================================== */

    if (
      action === "" ||
      action === "open"
    ) {
      event.waitUntil(
        self.clients
          .matchAll({
            type: "window",
            includeUncontrolled: true,
          })
          .then((clientList) => {
            for (
              const client
              of clientList
            ) {
              if (
                "navigate" in client &&
                "focus" in client
              ) {
                return client
                  .navigate(url)
                  .then(() =>
                    client.focus(),
                  );
              }
            }

            if (
              self.clients.openWindow
            ) {
              return self.clients.openWindow(
                url,
              );
            }

            return undefined;
          }),
      );
    }
  },
);

