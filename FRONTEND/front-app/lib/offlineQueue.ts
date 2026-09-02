// ============================================================
// NUR / BAHÁ'Í COMPANION
// FILE D'ATTENTE ANALYTICS — INDEXEDDB
// ============================================================

export interface OfflineAnalyticsEvent {
  id?: number;

  event_type: string;
  path?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
  client_id?: string;
  created_at: string;
}


// ============================================================
// CONFIGURATION INDEXEDDB
// ============================================================

const DB_NAME = "nur-offline-db";

// IMPORTANT :
// On passe de 1 à 2 afin de déclencher onupgradeneeded
// sur les installations où la base existe déjà.
const DB_VERSION = 2;

const STORE_NAME = "analytics";


let dbPromise: Promise<IDBDatabase> | null = null;


// ============================================================
// OUVERTURE INDEXEDDB
// ============================================================

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error(
        "IndexedDB indisponible côté serveur.",
      ),
    );
  }


  if (dbPromise) {
    return dbPromise;
  }


  dbPromise = new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION,
        );


      // ======================================================
      // MIGRATION / CRÉATION
      // ======================================================

      request.onupgradeneeded = () => {

        const db =
          request.result;


        console.log(
          `🗄️ Migration IndexedDB ${DB_NAME} → version ${DB_VERSION}`,
        );


        // ----------------------------------------------------
        // STORE ANALYTICS
        // ----------------------------------------------------

        if (
          !db.objectStoreNames.contains(
            STORE_NAME,
          )
        ) {

          console.log(
            `➕ Création du store "${STORE_NAME}"`,
          );


          db.createObjectStore(
            STORE_NAME,
            {
              keyPath: "id",
              autoIncrement: true,
            },
          );

        }

      };


      // ======================================================
      // SUCCÈS
      // ======================================================

      request.onsuccess = () => {

        const db =
          request.result;


        // ----------------------------------------------------
        // SÉCURITÉ
        // ----------------------------------------------------

        if (
          !db.objectStoreNames.contains(
            STORE_NAME,
          )
        ) {

          console.error(
            `❌ Le store IndexedDB "${STORE_NAME}" est introuvable.`,
          );


          db.close();

          dbPromise = null;


          reject(
            new Error(
              `Le store IndexedDB "${STORE_NAME}" est introuvable.`,
            ),
          );

          return;
        }


        // ----------------------------------------------------
        // GESTION DES CHANGEMENTS DE VERSION
        // ----------------------------------------------------

        db.onversionchange = () => {

          console.log(
            "🔄 Changement de version IndexedDB détecté.",
          );


          db.close();

          dbPromise = null;

        };


        console.log(
          `✅ IndexedDB "${DB_NAME}" prête.`,
        );


        resolve(db);

      };


      // ======================================================
      // ERREUR
      // ======================================================

      request.onerror = () => {

        dbPromise = null;


        reject(
          request.error ??
            new Error(
              "Impossible d'ouvrir IndexedDB.",
            ),
        );

      };


      // ======================================================
      // VERSION BLOQUÉE
      // ======================================================

      request.onblocked = () => {

        console.warn(
          "⚠️ Migration IndexedDB bloquée. Fermez les anciens onglets de l'application.",
        );

      };

    },
  );


  return dbPromise;
}


// ============================================================
// AJOUTER UN ÉVÉNEMENT
// ============================================================

export async function enqueueAnalyticsEvent(
  event: OfflineAnalyticsEvent,
): Promise<void> {

  const db =
    await openDatabase();


  return new Promise(
    (resolve, reject) => {

      try {

        const transaction =
          db.transaction(
            STORE_NAME,
            "readwrite",
          );


        const store =
          transaction.objectStore(
            STORE_NAME,
          );


        store.add(event);


        transaction.oncomplete =
          () => {
            resolve();
          };


        transaction.onerror =
          () => {

            reject(
              transaction.error ??
                new Error(
                  "Impossible d'enregistrer l'événement.",
                ),
            );

          };

      } catch (error) {

        reject(error);

      }

    },
  );
}


// ============================================================
// RÉCUPÉRER LES ÉVÉNEMENTS
// ============================================================

export async function getQueuedAnalyticsEvents(): Promise<
  OfflineAnalyticsEvent[]
> {

  const db =
    await openDatabase();


  return new Promise(
    (resolve, reject) => {

      try {

        const transaction =
          db.transaction(
            STORE_NAME,
            "readonly",
          );


        const store =
          transaction.objectStore(
            STORE_NAME,
          );


        const request =
          store.getAll();


        request.onsuccess =
          () => {

            resolve(
              request.result as OfflineAnalyticsEvent[],
            );

          };


        request.onerror =
          () => {

            reject(
              request.error ??
                new Error(
                  "Impossible de lire la file Analytics.",
                ),
            );

          };

      } catch (error) {

        reject(error);

      }

    },
  );
}


// ============================================================
// SUPPRIMER UN ÉVÉNEMENT
// ============================================================

export async function removeAnalyticsEvent(
  id: number,
): Promise<void> {

  const db =
    await openDatabase();


  return new Promise(
    (resolve, reject) => {

      try {

        const transaction =
          db.transaction(
            STORE_NAME,
            "readwrite",
          );


        const store =
          transaction.objectStore(
            STORE_NAME,
          );


        store.delete(id);


        transaction.oncomplete =
          () => {
            resolve();
          };


        transaction.onerror =
          () => {

            reject(
              transaction.error ??
                new Error(
                  "Impossible de supprimer l'événement.",
                ),
            );

          };

      } catch (error) {

        reject(error);

      }

    },
  );
}


// ============================================================
// NOMBRE D'ÉVÉNEMENTS EN ATTENTE
// ============================================================

export async function getPendingAnalyticsCount(): Promise<number> {

  const db =
    await openDatabase();


  return new Promise(
    (resolve, reject) => {

      try {

        const transaction =
          db.transaction(
            STORE_NAME,
            "readonly",
          );


        const store =
          transaction.objectStore(
            STORE_NAME,
          );


        const request =
          store.count();


        request.onsuccess =
          () => {

            resolve(
              request.result,
            );

          };


        request.onerror =
          () => {

            reject(
              request.error ??
                new Error(
                  "Impossible de compter les événements.",
                ),
            );

          };

      } catch (error) {

        reject(error);

      }

    },
  );
}


// ============================================================
// VIDER LA FILE
// ============================================================

export async function clearAnalyticsQueue(): Promise<void> {

  const db =
    await openDatabase();


  return new Promise(
    (resolve, reject) => {

      try {

        const transaction =
          db.transaction(
            STORE_NAME,
            "readwrite",
          );


        const store =
          transaction.objectStore(
            STORE_NAME,
          );


        store.clear();


        transaction.oncomplete =
          () => {
            resolve();
          };


        transaction.onerror =
          () => {

            reject(
              transaction.error ??
                new Error(
                  "Impossible de vider la file Analytics.",
                ),
            );

          };

      } catch (error) {

        reject(error);

      }

    },
  );
}