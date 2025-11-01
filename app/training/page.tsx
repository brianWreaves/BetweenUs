"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getPhraseDeck, TrainingPhrase } from "@/lib/training/phrase-deck";
import { usePreferences } from "@/app/hooks/use-preferences";

type SessionState = "idle" | "recording" | "completed";

const phrases = getPhraseDeck();
const TOTAL_PHRASES = phrases.length;

function computeNextIndex(current: number) {
  return (current + 1) % TOTAL_PHRASES;
}

function TrainingHeader({
  current,
  totalCompleted,
  status,
}: {
  current: number;
  totalCompleted: number;
  status: SessionState;
}) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
          Phase 3 · Training session
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Phrase {current + 1} of {TOTAL_PHRASES}
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          {totalCompleted} phrases marked complete ·
          {" "}
          {status === "recording"
            ? "Recording…"
            : status === "completed"
              ? "Ready to continue"
              : "Tap record to begin"}
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
      >
        Exit session
      </Link>
    </header>
  );
}

function TrainingBody({ phrase }: { phrase: TrainingPhrase }) {
  return (
    <section className="flex flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-wrap gap-3">
        <span className="rounded-full border border-emerald-600/50 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
          {phrase.category}
        </span>
      </div>
      <p className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
        {phrase.text}
      </p>
      <p className="max-w-xl text-sm text-slate-300">
        Record the phrase in your natural speaking voice. Stopping a recording
        marks the phrase complete so the Next phrase button becomes available.
      </p>
    </section>
  );
}

function TrainingFooter({
  state,
  canAdvance,
  onRecordToggle,
  onNext,
  onReRecord,
}: {
  state: SessionState;
  canAdvance: boolean;
  onRecordToggle: () => void;
  onNext: () => void;
  onReRecord: () => void;
}) {
  const isRecording = state === "recording";

  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 px-6 py-6">
      <button
        type="button"
        className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
        onClick={onReRecord}
        disabled={state === "idle"}
      >
        Re-record
      </button>
      <button
        type="button"
        className={cn(
          "rounded-full px-6 py-3 text-sm font-semibold transition",
          isRecording
            ? "bg-rose-600 text-white hover:bg-rose-500"
            : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
        )}
        onClick={onRecordToggle}
      >
        {isRecording ? "Stop" : "Record"}
      </button>
      <button
        type="button"
        className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
        onClick={onNext}
        disabled={!canAdvance}
      >
        Next phrase
      </button>
    </footer>
  );
}

export default function TrainingPage() {
  const [preferences, updatePreferences] = usePreferences();
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [hasCounted, setHasCounted] = useState(false);

  useEffect(() => {
    if ((preferences.lastPhaseCompleted ?? 1) < 3) {
      updatePreferences({ lastPhaseCompleted: 3 });
    }
  }, [preferences.lastPhaseCompleted, updatePreferences]);

  const currentIndex = useMemo(() => {
    const stored = preferences.trainingPhraseIndex ?? 0;
    return ((stored % TOTAL_PHRASES) + TOTAL_PHRASES) % TOTAL_PHRASES;
  }, [preferences.trainingPhraseIndex]);

  const currentPhrase = phrases[currentIndex] ?? phrases[0];

  const resetCompletionForCurrent = () => {
    if (hasCounted) {
      updatePreferences((current) => ({
        trainingCompletedCount: Math.max(0, current.trainingCompletedCount - 1),
      }));
      setHasCounted(false);
    }
  };

  const handleRecordToggle = () => {
    if (sessionState === "recording") {
      if (!hasCounted) {
        updatePreferences((current) => ({
          trainingCompletedCount: current.trainingCompletedCount + 1,
        }));
        setHasCounted(true);
      }
      setSessionState("completed");
    } else {
      resetCompletionForCurrent();
      setSessionState("recording");
    }
  };

  const handleNextPhrase = () => {
    if (!hasCounted || sessionState !== "completed") {
      return;
    }
    const nextIndex = computeNextIndex(currentIndex);
    setSessionState("idle");
    setHasCounted(false);
    updatePreferences({ trainingPhraseIndex: nextIndex });
  };

  const handleReRecord = () => {
    resetCompletionForCurrent();
    setSessionState("recording");
  };

  const canAdvance = hasCounted && sessionState === "completed";

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <TrainingHeader
        current={currentIndex}
        totalCompleted={preferences.trainingCompletedCount}
        status={sessionState}
      />
      <TrainingBody phrase={currentPhrase} />
      <TrainingFooter
        state={sessionState}
        canAdvance={canAdvance}
        onRecordToggle={handleRecordToggle}
        onNext={handleNextPhrase}
        onReRecord={handleReRecord}
      />
    </div>
  );
}
