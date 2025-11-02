"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useIndexedDb } from "@/app/hooks/use-indexed-db";
import { usePreferences } from "@/app/hooks/use-preferences";
import { clearTrainingData } from "@/lib/storage/indexed-db";
import { exportTrainingZip } from "@/lib/storage/training-export";

const FONT_SCALE_RANGE = {
  min: 0.9,
  max: 1.6,
  step: 0.05,
};

export function StorageStatusCard() {
  const indexedDbStatus = useIndexedDb();
  const [preferences, updatePreferences] = usePreferences();
  const regionInputRef = useRef<HTMLInputElement | null>(null);

  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const storageStatus = useMemo(() => {
    switch (indexedDbStatus) {
      case "ready":
        return "IndexedDB ready — training audio will be stored on this device.";
      case "unavailable":
        return "IndexedDB unavailable — training will fall back to in-memory storage.";
      default:
        return "Checking storage support…";
    }
  }, [indexedDbStatus]);

  const disabled = isClearing || isExporting;

  const handleExport = async () => {
    setActionMessage(null);
    setActionError(null);
    setIsExporting(true);
    try {
      const userId = preferences.preferredRegion?.replace(/\s+/g, "-") || "local";
      const { blob, fileName } = await exportTrainingZip(userId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.rel = "noopener";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setActionMessage(`Export ready: ${fileName}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to export training data.";
      setActionError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = async () => {
    setActionMessage(null);
    setActionError(null);
    setIsClearing(true);
    try {
      await clearTrainingData();
      updatePreferences({
        trainingCompletedCount: 0,
        trainingPhraseIndex: 0,
        trainingStage: "idle",
        trainingHasCounted: false,
      });
      setActionMessage("Training counter and recordings cleared.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to clear training data.";
      setActionError(message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 space-y-6">
      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              Phase 4
            </p>
            <h2 className="text-base font-semibold text-white">Storage status</h2>
          </div>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
              disabled
                ? "border-slate-800 text-slate-600"
                : "border-emerald-500 text-emerald-100 hover:border-emerald-400 hover:text-white",
            )}
            onClick={handleExport}
          >
            {isExporting ? "Preparing export…" : "Export training data"}
          </button>
        </div>
        <p className="text-slate-200">{storageStatus}</p>
        <p className="text-xs text-slate-400">
          Progress will later sync with recorded audio stored in IndexedDB.
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Training progress</h2>
          <p className="text-sm text-slate-300">
            {preferences.trainingCompletedCount} phrases completed
          </p>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "mt-3 inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
              disabled
                ? "border-slate-800 text-slate-600"
                : "border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white",
            )}
            onClick={handleClear}
          >
            {isClearing ? "Clearing…" : "Clear counter"}
          </button>
        </div>
        <Link
          href="/training"
          className="inline-flex items-center justify-center rounded-full border border-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:text-white"
        >
          Open training workspace
        </Link>
      </section>

      <section className="space-y-6">
        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Region vocabulary hint
          <div className="mt-2 flex gap-3">
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 outline-none focus:border-emerald-400 focus:outline-none"
              placeholder="e.g. Melbourne, Mornington Peninsula"
              defaultValue={preferences.preferredRegion ?? ""}
              ref={regionInputRef}
              key={preferences.preferredRegion ?? ""}
              disabled={disabled}
            />
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                disabled
                  ? "border-slate-800 text-slate-600"
                  : "border-emerald-500 text-emerald-100 hover:border-emerald-400 hover:text-white",
              )}
              onClick={() => {
                const value = regionInputRef.current?.value ?? "";
                updatePreferences({ preferredRegion: value.trim() || null });
                setActionMessage("Region hint saved.");
                setActionError(null);
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
          disabled={disabled}
          className="mt-2 w-full accent-emerald-400"
        />
        <p
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200"
          style={{ fontSize: `${preferences.fontScale}rem` }}
        >
          Thank you for being here. Flip the device to share this view.
        </p>

        {actionMessage ? (
          <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
            {actionMessage}
          </p>
        ) : null}
        {actionError ? (
          <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {actionError}
          </p>
        ) : null}
      </section>
    </div>
  );
}
