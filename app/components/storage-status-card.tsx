"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
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
  const regionInputRef = useRef<HTMLInputElement | null>(null);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Phase 3
          </p>
          <h2 className="text-base font-semibold text-white">
            Training progress
          </h2>
          <p className="text-sm text-slate-300">
            {preferences.trainingCompletedCount} phrases completed
          </p>
        </div>
        <Link
          href="/training"
          className="inline-flex items-center justify-center rounded-full border border-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:text-white"
        >
          Open training workspace
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Region vocabulary hint
          <div className="mt-2 flex gap-3">
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-400 focus:outline-none"
              placeholder="e.g. Melbourne, Mornington Peninsula"
              defaultValue={preferences.preferredRegion ?? ""}
              ref={regionInputRef}
              key={preferences.preferredRegion ?? ""}
            />
            <button
              type="button"
              className="rounded-full border border-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-400 hover:text-white"
              onClick={() => {
                const value = regionInputRef.current?.value ?? "";
                updatePreferences({
                  preferredRegion: value.trim() || null,
                });
              }}
            >
              Save
            </button>
          </div>
        </label>

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
          Thank you for being here. Flip the device to share this view.
        </p>

        <button
          type="button"
          onClick={() =>
            updatePreferences({
              trainingCompletedCount: 0,
              trainingPhraseIndex: 0,
              trainingStage: "idle",
              trainingHasCounted: false,
            })
          }
          className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Reset training counter
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Storage status
          </h3>
          <p className="mt-2 text-slate-200">{statusCopy}</p>
          <p className="mt-2 text-xs text-slate-400">
            Progress will later sync with recorded audio stored in IndexedDB.
          </p>
        </div>
      </div>
    </div>
  );
}
