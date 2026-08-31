/* =========================================================
   NUR / BAHÁ'Í COMPANION
   SERVICE WORKER — OFFLINE GLOBAL + PUSH
   ========================================================= */

/*
 * IMPORTANT
 * ---------------------------------------------------------
 * next-pwa / Workbox remplace automatiquement
 * self.__WB_MANIFEST pendant le build.
 *
 * Le Service Worker doit donc rester compatible
 * avec le manifeste généré par Workbox.
 */

self.__WB_MANIFEST;

/* =========================================================
   CONFIGURATION DES CACHES
   ========================================================= */

const STATIC_CACHE = "nur-static-v2";
const API_CACHE = "nur-api-v2";

const OFFLINE_URL = "/offline";

/* =========================================================
   ROUTES PUBLIQUES
   ========================================================= */

/*
 * Ces pages peuvent être mises en cache.
 *
 * Les autres pages sont considérées comme privées
 * et ne doivent jamais être stockées dans le cache
 * par le Service Worker.
 */

const PUBLIC_PAGE_PATHS = ["/", "/login", "/register", "/offline"];

/* =========================================================
   VÉRIFICATION ROUTE PUBLIQUE
   ========================================================= */

function isPublicPage(url) {
  return PUBLIC_PAGE_PATHS.some(
    (path) =>
      url.pathname === path ||
      (path !== "/" && url.pathname.startsWith(`${path}/`)),
  );
}

/* =========================================================
   API PUBLIQUES CACHEABLES
   ========================================================= */

/*
 * IMPORTANT :
 *
 * On ne met volontairement PAS ici :
 *
 * - /api/token/
 * - /api/token/refresh/
 * - /api/accounts/
 * - /api/notifications/
 * - /api/communities/memberships/
 * - /api/analytics/
 * - tout endpoint contenant des données privées.
 *
 * Ces données peuvent dépendre de l'utilisateur connecté.
 */

const CACHEABLE_API_PATTERNS = [
  "/api/bahai-calendar/",
  "/api/calendar/",
  "/api/events/",
  "/api/daily-quotes/",
];

/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", (event) => {
  console.log("🔧 NUR Service Worker : installation");

  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      try {
        /*
         * On pré-cache uniquement la page
         * de secours.
         *
         * Les autres ressources seront
         * mises en cache au fur et à mesure
         * de leur utilisation.
         */

        await cache.add(OFFLINE_URL);

        console.log("✅ Page offline mise en cache");
      } catch (error) {
        console.error("❌ Impossible de mettre en cache /offline :", error);
      }
    }),
  );

  /*
   * Active immédiatement le nouveau
   * Service Worker.
   */

  self.skipWaiting();
});

/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", (event) => {
  console.log("✅ NUR Service Worker : activation");

  event.waitUntil(
    caches
      .keys()

      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              /*
               * On supprime uniquement
               * les anciens caches NUR.
               */

              return (
                cacheName.startsWith("nur-") &&
                cacheName !== STATIC_CACHE &&
                cacheName !== API_CACHE
              );
            })

            .map((cacheName) => {
              console.log("🗑️ Suppression ancien cache :", cacheName);

              return caches.delete(cacheName);
            }),
        );
      })

      .then(() => {
        /*
         * Le nouveau SW prend immédiatement
         * le contrôle des pages ouvertes.
         */

        return self.clients.claim();
      }),
  );
});

/* =========================================================
   UTILITAIRE — API CACHEABLE
   ========================================================= */

function isCacheableApi(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }

  return CACHEABLE_API_PATTERNS.some((pattern) =>
    url.pathname.startsWith(pattern),
  );
}

/* =========================================================
   UTILITAIRE — RÉPONSE OFFLINE API
   ========================================================= */

function createOfflineApiResponse() {
  return new Response(
    JSON.stringify({
      offline: true,
      message: "Données indisponibles hors connexion.",
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

/*
 * UN SEUL fetch listener.
 *
 * Il gère :
 *
 * 1. API publiques
 * 2. navigation
 * 3. ressources statiques
 *
 * Les requêtes POST/PUT/PATCH/DELETE
 * passent directement au réseau.
 */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  /* =====================================================
       SEULEMENT GET
       ===================================================== */

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  /* =====================================================
       SEULEMENT NOTRE PROPRE DOMAINE
       ===================================================== */

  if (url.origin !== self.location.origin) {
    return;
  }

  /* =====================================================
       API
       ===================================================== */

  if (url.pathname.startsWith("/api/")) {
    /*
     * Seules les APIs publiques
     * explicitement autorisées
     * sont mises en cache.
     */

    if (!isCacheableApi(url)) {
      return;
    }

    event.respondWith(
      caches
        .open(API_CACHE)

        .then(async (cache) => {
          try {
            /*
             * NETWORK FIRST
             *
             * Internet disponible :
             * on récupère toujours
             * les données fraîches.
             */

            const response = await fetch(request);

            /*
             * On ne met en cache
             * que les réponses valides.
             */

            if (response.ok) {
              await cache.put(request, response.clone());
            }

            return response;
          } catch (error) {
            console.log("📴 API hors ligne :", url.pathname);

            /*
             * Internet indisponible :
             * on cherche les dernières
             * données connues.
             */

            const cached = await cache.match(request);

            if (cached) {
              console.log(
                "💾 Données API récupérées depuis le cache :",
                url.pathname,
              );

              return cached;
            }

            /*
             * Rien dans le cache.
             */

            return createOfflineApiResponse();
          }
        }),
    );

    return;
  }

  /* =====================================================
   NAVIGATION
===================================================== */

  if (request.mode === "navigate") {
    /*
     * ===================================================
     * ROUTES PRIVÉES
     * ===================================================
     *
     * IMPORTANT :
     *
     * Les pages privées ne doivent jamais être mises
     * en cache par notre Service Worker.
     *
     * Cela évite qu'une ancienne page comme :
     *
     * /profile
     * /notifications
     * /settings
     *
     * soit accessible depuis le cache après déconnexion.
     */

    if (!isPublicPage(url)) {
      event.respondWith(
        fetch(request).catch(() => {
          /*
           * Pas de réseau.
           *
           * On ne cherche PAS dans le cache.
           *
           * On affiche uniquement la page offline.
           */

          return caches
            .match(OFFLINE_URL)

            .then((offlinePage) => {
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

                  <title>
                    Bahá'í Companion
                  </title>

                </head>

                <body>

                  <h1>
                    Connexion requise
                  </h1>

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
                    "Content-Type": "text/html; charset=utf-8",
                  },
                },
              );
            });
        }),
      );

      return;
    }

    /*
     * ===================================================
     * ROUTES PUBLIQUES
     * ===================================================
     */

    event.respondWith(
      fetch(request)
        .then((response) => {
          /*
           * On met en cache uniquement les pages publiques.
           */

          if (response.ok) {
            const responseClone = response.clone();

            caches
              .open(STATIC_CACHE)

              .then((cache) => {
                return cache.put(request, responseClone);
              });
          }

          return response;
        })

        .catch(async () => {
          console.log("📴 Navigation publique hors ligne :", url.pathname);

          /*
           * 1. Page publique exacte.
           */

          const cachedPage = await caches.match(request);

          if (cachedPage) {
            console.log(
              "💾 Page publique récupérée depuis le cache :",
              url.pathname,
            );

            return cachedPage;
          }

          /*
           * 2. Page offline.
           */

          const offlinePage = await caches.match(OFFLINE_URL);

          if (offlinePage) {
            return offlinePage;
          }

          /*
           * 3. Dernier fallback.
           */

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

              <title>
                Bahá'í Companion
              </title>

            </head>

            <body>

              <h1>
                Bahá'í Companion
              </h1>

              <p>
                Vous êtes actuellement hors connexion.
              </p>

            </body>

          </html>
          `,

            {
              status: 503,

              headers: {
                "Content-Type": "text/html; charset=utf-8",
              },
            },
          );
        }),
    );

    return;
  }

  /* =====================================================
       RESSOURCES STATIQUES
       ===================================================== */

  /*
   * JS
   * CSS
   * images
   * fonts
   * sons
   * icônes
   * etc.
   *
   * Stratégie :
   *
   * CACHE FIRST
   * puis réseau.
   */

  event.respondWith(
    caches
      .match(request)

      .then(async (cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const response = await fetch(request);

          /*
           * On sauvegarde seulement
           * les réponses valides.
           */

          if (response.ok && response.status === 200) {
            const responseClone = response.clone();

            const cache = await caches.open(STATIC_CACHE);

            await cache.put(request, responseClone);
          }

          return response;
        } catch (error) {
          console.log("📴 Ressource indisponible hors ligne :", url.pathname);

          /*
           * Si la ressource n'existe pas
           * dans le cache et que le réseau
           * est indisponible, on laisse
           * le navigateur gérer l'erreur.
           */

          return new Response("", {
            status: 503,
            statusText: "Service Unavailable",
          });
        }
      }),
  );
});

/* =========================================================
   PUSH NOTIFICATIONS
   ========================================================= */

self.addEventListener("push", (event) => {
  console.log("📨 Push reçu");

  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error("❌ Impossible de lire le payload Push :", error);

    data = {};
  }

  const title = data.title || "Bahá'í Companion";

  const options = {
    body: data.body || data.message || "Vous avez une nouvelle notification.",

    icon: data.icon || "/icons/notification.png",

    badge: data.badge || "/icons/notification.png",

    tag: data.tag || "bahai-companion",

    renotify: true,

    data: {
      url: data.url || "/",

      notification_id: data.notification_id || null,

      event_id: data.event_id || null,

      quote_id: data.quote_id || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* =========================================================
   NOTIFICATION CLICK
   ========================================================= */

self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notification cliquée");

  event.notification.close();

  const action = event.action;

  const data = event.notification.data || {};

  /*
   * URL de base
   */

  let url = data.url || "/";

  /* =====================================================
       NOTIFICATION ID
       ===================================================== */

  if (data.notification_id) {
    const separator = url.includes("?") ? "&" : "?";

    url = `${url}${separator}notification_id=${encodeURIComponent(
      data.notification_id,
    )}`;

    console.log("🔔 Notification ID transmis :", data.notification_id);
  }

  /* =====================================================
       DAILY QUOTE ID
       ===================================================== */

  if (data.quote_id) {
    const separator = url.includes("?") ? "&" : "?";

    url = `${url}${separator}quote_id=${encodeURIComponent(data.quote_id)}`;

    console.log("📖 Quote ID transmis :", data.quote_id);
  }

  /* =====================================================
       EVENT ID
       ===================================================== */

  if (data.event_id) {
    const separator = url.includes("?") ? "&" : "?";

    url = `${url}${separator}event_id=${encodeURIComponent(data.event_id)}`;

    console.log("📅 Event ID transmis :", data.event_id);
  }

  /* =====================================================
       OUVERTURE DE L'APPLICATION
       ===================================================== */

  if (action === "" || action === "open") {
    event.waitUntil(
      self.clients

        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })

        .then((clientList) => {
          /*
           * Fenêtre existante
           */

          for (const client of clientList) {
            if ("navigate" in client && "focus" in client) {
              return client.navigate(url).then(() => client.focus());
            }
          }

          /*
           * Aucune fenêtre
           */

          if (self.clients.openWindow) {
            return self.clients.openWindow(url);
          }
        }),
    );
  }
});
