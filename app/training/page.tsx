"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer } from "react";
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
  onExit,
}: {
  state: SessionState;
  canAdvance: boolean;
  onRecordToggle: () => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const label =
    state === "recording"
      ? "Stop"
      : state === "completed"
        ? "Re-record"
        : "Record";

  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 px-6 py-6">
      <Link
        href="/"
        className={cn(
          "rounded-full border px-4 py-2 text-sm font-medium transition",
          state === "recording"
            ? "border-slate-800 text-slate-600"
            : "border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white",
        )}
        aria-disabled={state === "recording"}
        tabIndex={state === "recording" ? -1 : 0}
        onClick={(event) => {
          if (state === "recording") {
            event.preventDefault();
            return;
          }
          onExit();
        }}
      >
        Exit training
      </Link>
      <button
        type="button"
        className={cn(
          "rounded-full px-6 py-3 text-sm font-semibold transition",
          state === "recording"
            ? "bg-rose-600 text-white hover:bg-rose-500"
            : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
        )}
        onClick={onRecordToggle}
      >
        {label}
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
  const [localState, dispatchLocal] = useReducer(
    (
      state: { stage: SessionState; hasCounted: boolean },
      action:
        | { type: "sync"; stage: SessionState; hasCounted: boolean }
        | { type: "set"; stage: SessionState; hasCounted: boolean },
    ) => {
      if (action.type === "sync") {
        if (
          state.stage === action.stage &&
          state.hasCounted === action.hasCounted
        ) {
          return state;
        }
        return { stage: action.stage, hasCounted: action.hasCounted };
      }
      return { stage: action.stage, hasCounted: action.hasCounted };
    },
    {
      stage: preferences.trainingStage ?? "idle",
      hasCounted: preferences.trainingHasCounted ?? false,
    },
  );

  useEffect(() => {
    dispatchLocal({
      type: "sync",
      stage: preferences.trainingStage ?? "idle",
      hasCounted: preferences.trainingHasCounted ?? false,
    });
  }, [
    preferences.trainingStage,
    preferences.trainingHasCounted,
    preferences.trainingPhraseIndex,
  ]);

  useEffect(() => {
    if ((preferences.lastPhaseCompleted ?? 1) < 3) {
      const timeout = window.setTimeout(() => {
        updatePreferences({ lastPhaseCompleted: 3 });
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [preferences.lastPhaseCompleted, updatePreferences]);

  const currentIndex = useMemo(() => {
    const stored = preferences.trainingPhraseIndex ?? 0;
    return ((stored % TOTAL_PHRASES) + TOTAL_PHRASES) % TOTAL_PHRASES;
  }, [preferences.trainingPhraseIndex]);

  const currentPhrase = phrases[currentIndex] ?? phrases[0];
  const sessionState = localState.stage;
  const hasCounted = localState.hasCounted;

  const handleRecordToggle = () => {
    if (sessionState === "recording") {
      updatePreferences((current) => ({
        trainingCompletedCount: hasCounted
          ? current.trainingCompletedCount
          : current.trainingCompletedCount + 1,
        trainingStage: "completed",
        trainingHasCounted: true,
      }));
      dispatchLocal({
        type: "set",
        stage: "completed",
        hasCounted: true,
      });
    } else if (sessionState === "completed") {
      updatePreferences((current) => ({
        trainingCompletedCount: hasCounted
          ? Math.max(0, current.trainingCompletedCount - 1)
          : current.trainingCompletedCount,
        trainingStage: "recording",
        trainingHasCounted: false,
      }));
      dispatchLocal({
        type: "set",
        stage: "recording",
        hasCounted: false,
      });
    } else {
      updatePreferences({
        trainingStage: "recording",
        trainingHasCounted: false,
      });
      dispatchLocal({
        type: "set",
        stage: "recording",
        hasCounted: false,
      });
    }
  };

  const handleNextPhrase = () => {
    if (!hasCounted || sessionState !== "completed") {
      return;
    }
    const nextIndex = computeNextIndex(currentIndex);
    updatePreferences({
      trainingPhraseIndex: nextIndex,
      trainingStage: "idle",
      trainingHasCounted: false,
    });
    dispatchLocal({
      type: "set",
      stage: "idle",
      hasCounted: false,
    });
  };

  const canAdvance = hasCounted && sessionState === "completed";

  const handleExit = () => {
    if (sessionState === "completed" && hasCounted) {
      handleNextPhrase();
    }
  };

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
        onExit={handleExit}
      />
    </div>
  );
}
