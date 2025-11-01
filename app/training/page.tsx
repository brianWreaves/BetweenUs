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
}: {
  current: number;
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
        Record the phrase in your natural speaking voice. We’ll use it to boost
        personal vocabulary during live transcription.
      </p>
    </section>
  );
}

function TrainingFooter({
  state,
  onRecordToggle,
  onMarkDone,
  onNext,
  onReRecord,
}: {
  state: SessionState;
  onRecordToggle: () => void;
  onMarkDone: () => void;
  onNext: () => void;
  onReRecord: () => void;
}) {
  const isRecording = state === "recording";
  const isCompleted = state === "completed";

  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 px-6 py-6">
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          onClick={onReRecord}
          disabled={state === "idle"}
        >
          Re-record
        </button>
        <button
          type="button"
          className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
          onClick={onNext}
        >
          Next phrase
        </button>
      </div>
      <div className="flex gap-3">
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
          className={cn(
            "rounded-full border px-6 py-3 text-sm font-semibold transition",
            isCompleted
              ? "border-emerald-500 text-emerald-200 hover:border-emerald-400 hover:text-emerald-100"
              : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200",
          )}
          onClick={onMarkDone}
          disabled={state === "idle"}
        >
          {isCompleted ? "Marked" : "Done"}
        </button>
      </div>
    </footer>
  );
}

export default function TrainingPage() {
  const [preferences, updatePreferences] = usePreferences();
  const [sessionState, setSessionState] = useState<SessionState>("idle");

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

  const handleRecordToggle = () => {
    setSessionState((state) => {
      if (state === "recording") {
        return "idle";
      }
      return "recording";
    });
  };

  const handleMarkDone = () => {
    setSessionState((state) => {
      if (state !== "completed") {
        updatePreferences((current) => ({
          trainingCompletedCount: current.trainingCompletedCount + 1,
        }));
      }
      return "completed";
    });
  };

  const handleNextPhrase = () => {
    setSessionState("idle");
    const nextIndex = computeNextIndex(currentIndex);
    updatePreferences({ trainingPhraseIndex: nextIndex });
  };

  const handleReRecord = () => {
    setSessionState("recording");
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <TrainingHeader current={currentIndex} />
      <TrainingBody phrase={currentPhrase} />
      <TrainingFooter
        state={sessionState}
        onRecordToggle={handleRecordToggle}
        onMarkDone={handleMarkDone}
        onNext={handleNextPhrase}
        onReRecord={handleReRecord}
      />
    </div>
  );
}
