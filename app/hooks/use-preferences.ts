"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PREFERENCES,
  Preferences,
  subscribeToPreferences,
  updatePreferences,
} from "@/lib/storage/preferences";

type PreferencesUpdater =
  | Partial<Preferences>
  | ((current: Preferences) => Partial<Preferences>);

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(
    DEFAULT_PREFERENCES,
  );

  useEffect(() => {
    return subscribeToPreferences((next) => setPreferences(next));
  }, []);

  const mutate = (updater: PreferencesUpdater) => {
    updatePreferences(updater);
  };

  return [preferences, mutate] as const;
}
