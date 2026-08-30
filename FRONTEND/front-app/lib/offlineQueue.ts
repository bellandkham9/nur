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

const DB_NAME = "nur-offline-db";
const DB_VERSION = 1;
const STORE_NAME = "analytics";

let dbPromise: Promise<IDBDatabase> | null = null;

// ============================================================
// OUVERTURE INDEXEDDB
// ============================================================

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("IndexedDB indisponible côté serveur."),
    );
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(
          STORE_NAME,
          {
            keyPath: "id",
            autoIncrement: true,
          },
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error(
            "Impossible d'ouvrir IndexedDB.",
          ),
      );
    };
  });

  return dbPromise;
}

// ============================================================
// AJOUTER UN ÉVÉNEMENT
// ============================================================

export async function enqueueAnalyticsEvent(
  event: OfflineAnalyticsEvent,
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    store.add(event);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(
        transaction.error ??
          new Error(
            "Impossible d'enregistrer l'événement.",
          ),
      );
    };
  });
}

// ============================================================
// RÉCUPÉRER LES ÉVÉNEMENTS
// ============================================================

export async function getQueuedAnalyticsEvents(): Promise<
  OfflineAnalyticsEvent[]
> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(
        request.result as OfflineAnalyticsEvent[],
      );
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error(
            "Impossible de lire la file Analytics.",
          ),
      );
    };
  });
}

// ============================================================
// SUPPRIMER UN ÉVÉNEMENT APRÈS SYNCHRONISATION
// ============================================================

export async function removeAnalyticsEvent(
  id: number,
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    store.delete(id);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(
        transaction.error ??
          new Error(
            "Impossible de supprimer l'événement.",
          ),
      );
    };
  });
}

// ============================================================
// NOMBRE D'ÉVÉNEMENTS EN ATTENTE
// ============================================================

export async function getPendingAnalyticsCount(): Promise<number> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error(
            "Impossible de compter les événements.",
          ),
      );
    };
  });
}

// ============================================================
// VIDER LA FILE
// ============================================================

export async function clearAnalyticsQueue(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    store.clear();

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(
        transaction.error ??
          new Error(
            "Impossible de vider la file Analytics.",
          ),
      );
    };
  });
}