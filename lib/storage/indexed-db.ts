const DB_NAME = "betweenus-training";
const DB_VERSION = 1;
const PHRASES_STORE = "phrases";
const METADATA_STORE = "metadata";

export type TrainingPhraseRecord = {
  id: string;
  text: string;
  category: string;
  recordedAt: string;
  durationMs?: number;
  audio?: Blob;
  keywords?: string[];
};

export type TrainingProgressRecord = {
  key: "progress";
  totalRecorded: number;
  recommendedTarget: number;
  categoryCounts: Record<string, number>;
  lastUpdated: string;
};

type MetadataValue = TrainingProgressRecord;

type MemoryDb = {
  phrases: Map<string, TrainingPhraseRecord>;
  metadata: Map<string, MetadataValue>;
};

const isBrowser =
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const memoryDb: MemoryDb = {
  phrases: new Map(),
  metadata: new Map(),
};

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IDB request failed"));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  if (!isBrowser) {
    throw new Error("IndexedDB is not available in the current environment");
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open BetweenUs database"));
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(PHRASES_STORE)) {
        db.createObjectStore(PHRASES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        const metadataStore = db.createObjectStore(METADATA_STORE, {
          keyPath: "key",
        });
        metadataStore.createIndex("key", "key", { unique: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

async function withTransaction<T>(
  stores: string[],
  mode: IDBTransactionMode,
  handler: (tx: IDBTransaction) => Promise<T>,
): Promise<T> {
  const db = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    try {
      const tx = db.transaction(stores, mode);
      handler(tx)
        .then((value) => {
          tx.oncomplete = () => resolve(value);
        })
        .catch((error) => {
          tx.abort();
          reject(error);
        });
      tx.onerror = () => reject(tx.error ?? new Error("IDB transaction failed"));
    } catch (error) {
      reject(error);
    }
  });
}

export async function saveTrainingPhrase(
  record: TrainingPhraseRecord,
): Promise<void> {
  if (!isBrowser) {
    memoryDb.phrases.set(record.id, record);
    return;
  }

  await withTransaction([PHRASES_STORE], "readwrite", async (tx) => {
    const store = tx.objectStore(PHRASES_STORE);
    await requestToPromise(store.put(record));
  });
}

export async function listTrainingPhrases(): Promise<TrainingPhraseRecord[]> {
  if (!isBrowser) {
    return Array.from(memoryDb.phrases.values());
  }

  return withTransaction([PHRASES_STORE], "readonly", async (tx) => {
    const store = tx.objectStore(PHRASES_STORE);
    return requestToPromise(store.getAll());
  });
}

export async function getTrainingPhrase(
  id: string,
): Promise<TrainingPhraseRecord | null> {
  if (!isBrowser) {
    return memoryDb.phrases.get(id) ?? null;
  }

  return withTransaction([PHRASES_STORE], "readonly", async (tx) => {
    const store = tx.objectStore(PHRASES_STORE);
    const result = await requestToPromise<TrainingPhraseRecord | undefined>(
      store.get(id),
    );
    return result ?? null;
  });
}

export async function deleteTrainingPhrase(id: string): Promise<void> {
  if (!isBrowser) {
    memoryDb.phrases.delete(id);
    return;
  }

  await withTransaction([PHRASES_STORE], "readwrite", async (tx) => {
    const store = tx.objectStore(PHRASES_STORE);
    await requestToPromise(store.delete(id));
  });
}

export async function clearTrainingData(): Promise<void> {
  if (!isBrowser) {
    memoryDb.phrases.clear();
    memoryDb.metadata.clear();
    return;
  }

  await withTransaction([PHRASES_STORE, METADATA_STORE], "readwrite", async (tx) => {
    await Promise.all([
      requestToPromise(tx.objectStore(PHRASES_STORE).clear()),
      requestToPromise(tx.objectStore(METADATA_STORE).clear()),
    ]);
  });
}

export async function upsertTrainingProgress(
  progress: Omit<TrainingProgressRecord, "key">,
): Promise<void> {
  const record: TrainingProgressRecord = {
    key: "progress",
    ...progress,
  };

  if (!isBrowser) {
    memoryDb.metadata.set(record.key, record);
    return;
  }

  await withTransaction([METADATA_STORE], "readwrite", async (tx) => {
    const store = tx.objectStore(METADATA_STORE);
    await requestToPromise(store.put(record));
  });
}

export async function getTrainingProgress(): Promise<TrainingProgressRecord | null> {
  if (!isBrowser) {
    return memoryDb.metadata.get("progress") ?? null;
  }

  return withTransaction([METADATA_STORE], "readonly", async (tx) => {
    const store = tx.objectStore(METADATA_STORE);
    const result = await requestToPromise<TrainingProgressRecord | undefined>(
      store.get("progress"),
    );
    return result ?? null;
  });
}

export async function ensureDatabaseReady(): Promise<boolean> {
  if (!isBrowser) {
    return false;
  }

  try {
    const db = await openDatabase();
    db.close();
    return true;
  } catch (error) {
    console.warn("BetweenUs IndexedDB initialisation failed", error);
    return false;
  }
}
