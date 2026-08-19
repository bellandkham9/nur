/* =========================================================
   BAHÁ'Í COMPANION — SERVICE WORKER PUSH
   ========================================================= */

self.addEventListener("install", (event) => {
  console.log(
    "🔧 Service Worker Push : installation"
  );

  self.skipWaiting();
});


self.addEventListener("activate", (event) => {
  console.log(
    "✅ Service Worker Push : activation"
  );

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


  /* -------------------------------------------------------
     LECTURE DU PAYLOAD
     ------------------------------------------------------- */

  try {

    data = event.data
      ? event.data.json()
      : {};

  } catch (error) {

    console.error(
      "❌ Impossible de lire les données Push",
      error
    );

    data = {
      title: "Bahá'í Companion",

      message:
        event.data?.text()
        || "Vous avez une nouvelle notification."
    };
  }


  /* -------------------------------------------------------
     TYPE
     ------------------------------------------------------- */

  const type =
    data.type || "EVENT";


  /* -------------------------------------------------------
     TITRE
     ------------------------------------------------------- */

  const title =
    data.title || "Bahá'í Companion";


  /* -------------------------------------------------------
     MESSAGE
     ------------------------------------------------------- */

  const body =
    data.message
    || data.body
    || "Vous avez un nouveau rappel.";


  /* -------------------------------------------------------
     URL
     ------------------------------------------------------- */

  const url =
    data.url || "/";


  /* -------------------------------------------------------
     OPTIONS NOTIFICATION
     ------------------------------------------------------- */

  const options = {

    body,

    icon:
      data.icon
      || "/icons/icon-192x192.png",

    badge:
      data.badge
      || "/icons/icon-192x192.png",

    data: {

      url,

      type,

      event_id:
        data.event_id
        || null,

      notification_id:
        data.notification_id
        || null,

      event_source:
        data.event_source
        || null,


      /* ================================================
         DAILY QUOTE
         ================================================ */

      quote_id:
        data.quote_id
        || null,

      quote_date:
        data.date
        || null,

      quote_moment:
        data.moment
        || null
    },


    requireInteraction:
      Boolean(
        data.requireInteraction
      ),


    vibrate:
      data.vibrate
      || [200, 100, 200],


    timestamp:
      Date.now(),


    actions: [
      {
        action: "open",
        title: "Ouvrir"
      }
    ]
  };


  /* -------------------------------------------------------
     AFFICHAGE
     ------------------------------------------------------- */

  event.waitUntil(

    self.registration.showNotification(
      title,
      options
    )

  );

});


/* =========================================================
   CLIC NOTIFICATION
   ========================================================= */

self.addEventListener(
  "notificationclick",
  (event) => {

    console.log(
      "🖱️ Notification cliquée"
    );


    event.notification.close();


    /* -----------------------------------------------------
       ACTION
       ----------------------------------------------------- */

    const action =
      event.action;


    /* -----------------------------------------------------
       DONNÉES
       ----------------------------------------------------- */

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
       ACTION OUVRIR
       ----------------------------------------------------- */

    if (
      action === ""
      || action === "open"
    ) {

      event.waitUntil(

        clients
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
                "navigate" in client
                && "focus" in client
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
              clients.openWindow
            ) {

              return clients.openWindow(
                url
              );

            }

          })

      );

    }

  }
);