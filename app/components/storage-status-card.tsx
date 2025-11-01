"use client";

import { useMemo } from "react";
import { useIndexedDb } from "@/app/hooks/use-indexed-db";
import { usePreferences } from "@/app/hooks/use-preferences";

const FONT_SCALE_RANGE = {
  min: 0.9,
  max: 1.6,
  step: 0.05,
};

export function StorageStatusCard() {
  const indexedDbStatus = useIndexedDb();
  const [preferences, updatePreferences] = usePreferences();

  const statusCopy = useMemo(() => {
    switch (indexedDbStatus) {
      case "ready":
        return "IndexedDB ready — training audio will be stored on this device.";
      case "unavailable":
        return "IndexedDB unavailable — training will fall back to in-memory storage.";
      default:
        return "Checking storage support…";
    }
  }, [indexedDbStatus]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
      <h2 className="text-base font-semibold text-white">
        Device storage status
      </h2>
      <p className="mt-3 text-sm text-slate-300">{statusCopy}</p>

      <div className="mt-6 space-y-6">
        <label
          className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
          htmlFor="fontScaleSlider"
        >
          Message size preview
          <span className="text-slate-200">
            {(preferences.fontScale * 100).toFixed(0)}%
          </span>
        </label>
        <input
          id="fontScaleSlider"
          type="range"
          min={FONT_SCALE_RANGE.min}
          max={FONT_SCALE_RANGE.max}
          step={FONT_SCALE_RANGE.step}
          value={preferences.fontScale}
          onChange={(event) =>
            updatePreferences({
              fontScale: Number.parseFloat(event.target.value),
            })
          }
          className="mt-2 w-full accent-emerald-400"
        />
        <p
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200"
          style={{ fontSize: `${preferences.fontScale}rem` }}
        >
          “Thank you for being here. Flip the device to share this view.”
        </p>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Training progress snapshot
          </h3>
          <p className="mt-2 text-slate-200">
            {preferences.trainingCompletedCount} phrases marked complete in this device
            session.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Progress will later sync with recorded audio stored in IndexedDB.
          </p>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Region vocabulary hint
          <input
            className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-400 focus:outline-none"
            placeholder="e.g. Melbourne, Mornington Peninsula"
            defaultValue={preferences.preferredRegion ?? ""}
            onBlur={(event) =>
              updatePreferences({ preferredRegion: event.target.value || null })
            }
          />
          <span className="mt-2 block text-xs text-slate-400">
            We’ll use this to boost local vocabulary when generating keyword lists.
          </span>
        </label>
      </div>
    </div>
  );
}
