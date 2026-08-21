/* =========================================================
   NUR / BAHÁ'Í COMPANION — SERVICE WORKER
   ========================================================= */

/*
 * IMPORTANT :
 * next-pwa / Workbox remplace automatiquement
 * self.__WB_MANIFEST pendant le build.
 */
self.__WB_MANIFEST;


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker : installation");

  self.skipWaiting();
});


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker : activation");

  event.waitUntil(
    self.clients.claim()
  );
});


/* =========================================================
   PUSH
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
      error
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
      url:
        data.url ||
        "/",

      notification_id:
        data.notification_id ||
        null,

      event_id:
        data.event_id ||
        null,

      quote_id:
        data.quote_id ||
        null
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});


/* =========================================================
   NOTIFICATION CLICK
   ========================================================= */

self.addEventListener(
  "notificationclick",
  (event) => {

    console.log(
      "🔔 Notification cliquée"
    );

    event.notification.close();

    const action =
      event.action;

    const data =
      event.notification.data || {};

    /* -----------------------------------------------------
       URL DE BASE
       ----------------------------------------------------- */

    let url =
      data.url || "/";


    /* -----------------------------------------------------
       NOTIFICATION ID
       ----------------------------------------------------- */

    if (data.notification_id) {

      const separator =
        url.includes("?")
          ? "&"
          : "?";

      url =
        `${url}${separator}notification_id=${encodeURIComponent(
          data.notification_id
        )}`;

      console.log(
        "🔔 Notification ID transmis :",
        data.notification_id
      );
    }


    /* -----------------------------------------------------
       DAILY QUOTE ID
       ----------------------------------------------------- */

    if (data.quote_id) {

      const separator =
        url.includes("?")
          ? "&"
          : "?";

      url =
        `${url}${separator}quote_id=${encodeURIComponent(
          data.quote_id
        )}`;

      console.log(
        "📖 Quote ID transmis :",
        data.quote_id
      );
    }


    /* -----------------------------------------------------
       EVENT ID
       ----------------------------------------------------- */

    if (data.event_id) {

      const separator =
        url.includes("?")
          ? "&"
          : "?";

      url =
        `${url}${separator}event_id=${encodeURIComponent(
          data.event_id
        )}`;

      console.log(
        "📅 Event ID transmis :",
        data.event_id
      );
    }


    /* -----------------------------------------------------
       ACTION OUVRIR
       ----------------------------------------------------- */

    if (
      action === "" ||
      action === "open"
    ) {

      event.waitUntil(

        self.clients
          .matchAll({
            type: "window",
            includeUncontrolled: true
          })

          .then((clientList) => {

            /* ---------------------------------------------
               FENÊTRE EXISTANTE
               --------------------------------------------- */

            for (
              const client of clientList
            ) {

              if (
                "navigate" in client &&
                "focus" in client
              ) {

                return client
                  .navigate(url)
                  .then(() =>
                    client.focus()
                  );
              }
            }


            /* ---------------------------------------------
               AUCUNE FENÊTRE
               --------------------------------------------- */

            if (
              self.clients.openWindow
            ) {

              return self.clients.openWindow(
                url
              );

            }

          })

      );
    }

  }
);