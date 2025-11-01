export type Preferences = {
  fontScale: number;
  autoRotate: boolean;
  lowPowerMode: boolean;
  lastPhaseCompleted: number;
  lastExportedAt?: string | null;
  trainingPhraseIndex: number;
  trainingCompletedCount: number;
  preferredRegion?: string | null;
  trainingStage: "idle" | "recording" | "completed";
  trainingHasCounted: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  fontScale: 1,
  autoRotate: true,
  lowPowerMode: false,
  lastPhaseCompleted: 1,
  lastExportedAt: null,
  trainingPhraseIndex: 0,
  trainingCompletedCount: 0,
  preferredRegion: null,
  trainingStage: "idle",
  trainingHasCounted: false,
};

const STORAGE_KEY = "betweenus.preferences";
const listeners = new Set<(preferences: Preferences) => void>();

const isBrowser = typeof window !== "undefined";

function readFromStorage(): Preferences {
  if (!isBrowser) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFERENCES };
    }
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.warn("BetweenUs preferences could not be parsed", error);
    return { ...DEFAULT_PREFERENCES };
  }
}

let cachedPreferences: Preferences = readFromStorage();

function persist(preferences: Preferences, writeToStorage: boolean) {
  cachedPreferences = preferences;
  if (isBrowser && writeToStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn("BetweenUs preferences could not be saved", error);
    }
  }
  listeners.forEach((listener) => listener(preferences));
}

export function getPreferences(): Preferences {
  return cachedPreferences;
}

export function setPreferences(next: Preferences): Preferences {
  persist({ ...DEFAULT_PREFERENCES, ...next }, true);
  return cachedPreferences;
}

export function updatePreferences(
  partial: Partial<Preferences> | ((current: Preferences) => Partial<Preferences>),
): Preferences {
  const current = getPreferences();
  const patch =
    typeof partial === "function" ? partial(current) : { ...partial };
  const next = { ...current, ...patch };
  persist(next, true);
  return next;
}

export function subscribeToPreferences(
  listener: (preferences: Preferences) => void,
): () => void {
  listeners.add(listener);
  listener(getPreferences());
  return () => listeners.delete(listener);
}

if (isBrowser) {
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY || event.newValue == null) {
      return;
    }
    try {
      const parsed = JSON.parse(event.newValue) as Partial<Preferences>;
      persist({ ...DEFAULT_PREFERENCES, ...parsed }, false);
    } catch (error) {
      console.warn("BetweenUs preferences sync failed", error);
    }
  });
}
