"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { getPhraseDeck, TrainingPhrase } from "@/lib/training/phrase-deck";
import { usePreferences } from "@/app/hooks/use-preferences";
import { SpeechRecorder } from "@/lib/audio/recorder";
import {
  getTrainingPhrase,
  saveTrainingPhrase,
  TrainingPhraseRecord,
} from "@/lib/storage/indexed-db";

type SessionState = "idle" | "recording" | "completed";

const phrases = getPhraseDeck();
const TOTAL_PHRASES = phrases.length;
const MIN_RECORDING_DURATION_MS = 3000;

function computeNextIndex(current: number) {
  return (current + 1) % TOTAL_PHRASES;
}

function formatDuration(ms: number): string {
  if (!ms) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function TrainingHeader({
  current,
  totalCompleted,
}: {
  current: number;
  totalCompleted: number;
}) {
  const completed = Math.min(totalCompleted, TOTAL_PHRASES);
  return (
    <header className="border-b border-slate-800 px-6 py-4">
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
        Phase 4 · Training session
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-white">
          {completed} of {TOTAL_PHRASES} completed
        </h1>
        <span className="text-xs text-slate-500">
          Viewing phrase {current + 1}
        </span>
      </div>
    </header>
  );
}

function TrainingBody({
  phrase,
  isRecording,
  elapsedMs,
  saving,
  error,
  record,
}: {
  phrase: TrainingPhrase;
  isRecording: boolean;
  elapsedMs: number;
  saving: boolean;
  error: string | null;
  record: TrainingPhraseRecord | null;
}) {
  return (
    <section className="flex-1 overflow-y-auto px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-emerald-600/50 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            {phrase.category}
          </span>
          {record?.durationMs ? (
            <span className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
              Last capture {formatDuration(record.durationMs)}
            </span>
          ) : null}
        </div>
        <p className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
          {phrase.text}
        </p>
        <div className="space-y-2 text-sm">
          {isRecording ? (
            <p className="text-emerald-300">
              Recording… {formatDuration(elapsedMs)}
            </p>
          ) : record?.durationMs ? (
            <p className="text-slate-400">
              Last capture {formatDuration(record.durationMs)}
            </p>
          ) : null}
          {saving ? (
            <p className="text-xs text-slate-500">Saving recording…</p>
          ) : null}
          {error ? (
            <p className="text-xs text-rose-300">{error}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TrainingFooter({
  state,
  canAdvance,
  onRecordToggle,
  onNext,
  onExit,
  phraseId,
}: {
  state: SessionState;
  canAdvance: boolean;
  onRecordToggle: () => void;
  onNext: () => void;
  onExit: () => void;
  phraseId: string;
}) {
  const recordButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const button = recordButtonRef.current;
    if (!button || typeof window === "undefined") {
      return;
    }

    const prefersPrecisePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    if (prefersPrecisePointer) {
      button.focus({ preventScroll: true });
    }
  }, [phraseId, state]);

  const label =
    state === "recording"
      ? "Stop"
      : state === "completed"
        ? "Re-record"
        : "Record";

  return (
    <footer className="sticky bottom-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/95 px-4 py-4 backdrop-blur">
      <button
        type="button"
        className={cn(
          "rounded-full border px-3 py-2 text-sm font-medium transition",
          state === "recording"
            ? "border-slate-800 text-slate-600"
            : "border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white",
        )}
        onClick={onExit}
        disabled={state === "recording"}
      >
        Exit
      </button>
      <button
        type="button"
        className={cn(
          "rounded-full px-4 py-3 text-sm font-semibold transition",
          state === "recording"
            ? "bg-rose-600 text-white hover:bg-rose-500"
            : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
        )}
        onClick={onRecordToggle}
        ref={recordButtonRef}
      >
        {label}
      </button>
      <button
        type="button"
        className="rounded-full border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
        onClick={onNext}
        disabled={!canAdvance}
      >
        Next
      </button>
    </footer>
  );
}

export default function TrainingPage() {
  const router = useRouter();
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

  const localStateRef = useRef(localState);
  useEffect(() => {
    localStateRef.current = localState;
  }, [localState]);

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

  const recorderRef = useRef<SpeechRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const [enforcePortrait, setEnforcePortrait] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [phraseRecord, setPhraseRecord] = useState<TrainingPhraseRecord | null>(
    null,
  );

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPhraseRecord(null);
    setElapsedMs(0);
    setRecorderError(null);
    recorderRef.current?.reset();
    resetTimer();

    (async () => {
      const record = await getTrainingPhrase(currentPhrase.id);
      if (cancelled) return;
      setPhraseRecord(record);
      if (record?.durationMs) {
        setElapsedMs(record.durationMs);
      }
      if (record) {
        updatePreferences({
          trainingStage: "completed",
          trainingHasCounted: true,
        });
        dispatchLocal({
          type: "set",
          stage: "completed",
          hasCounted: true,
        });
      } else {
        updatePreferences({
          trainingStage: "idle",
          trainingHasCounted: false,
        });
        dispatchLocal({
          type: "set",
          stage: "idle",
          hasCounted: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPhrase.id, resetTimer, updatePreferences]);

  useEffect(() => {
    return () => {
      resetTimer();
      recorderRef.current?.reset();
    };
  }, [resetTimer]);

  const handleRecordToggle = () => {
    if (sessionState === "recording") {
      recorderRef.current?.stop();
      return;
    }

    if (sessionState === "completed") {
      updatePreferences((current) => ({
        trainingCompletedCount: localStateRef.current.hasCounted
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
      setPhraseRecord(null);
      setElapsedMs(0);
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
      setElapsedMs(0);
    }

    resetTimer();

    const recorder = new SpeechRecorder({
      onStart: () => {
        setRecorderError(null);
        const startedAt = Date.now();
        timerRef.current = window.setInterval(() => {
          setElapsedMs(Date.now() - startedAt);
        }, 100);
      },
      onStop: async (blob, durationMs) => {
        resetTimer();
        if (durationMs < MIN_RECORDING_DURATION_MS) {
          recorderRef.current?.reset();
          setElapsedMs(0);
          setSaving(false);
          setRecorderError("Recording too short — try speaking the full phrase.");
          updatePreferences({
            trainingStage: "idle",
            trainingHasCounted: localStateRef.current.hasCounted,
          });
          dispatchLocal({
            type: "set",
            stage: "idle",
            hasCounted: localStateRef.current.hasCounted,
          });
          return;
        }
        setElapsedMs(durationMs);
        setSaving(true);
        try {
          const alreadyCounted = localStateRef.current.hasCounted;
          const record: TrainingPhraseRecord = {
            id: currentPhrase.id,
            text: currentPhrase.text,
            category: currentPhrase.category,
            recordedAt: new Date().toISOString(),
            durationMs,
            audio: blob,
          };
          await saveTrainingPhrase(record);
          setPhraseRecord(record);
          updatePreferences((current) => ({
            trainingCompletedCount: alreadyCounted
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
        } catch (error) {
          console.error("BetweenUs failed to save recording", error);
          setRecorderError(
            error instanceof Error
              ? error.message
              : "Unable to save recording",
          );
          updatePreferences({
            trainingStage: "idle",
            trainingHasCounted: localStateRef.current.hasCounted,
          });
          dispatchLocal({
            type: "set",
            stage: "idle",
            hasCounted: localStateRef.current.hasCounted,
          });
        } finally {
          setSaving(false);
        }
      },
      onError: (error) => {
        resetTimer();
        setRecorderError(error.message);
        updatePreferences({
          trainingStage: "idle",
          trainingHasCounted: localStateRef.current.hasCounted,
        });
        dispatchLocal({
          type: "set",
          stage: "idle",
          hasCounted: localStateRef.current.hasCounted,
        });
      },
    });

    recorderRef.current = recorder;
    try {
      void recorder.start();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to access microphone";
      setRecorderError(message);
      updatePreferences({
        trainingStage: "idle",
        trainingHasCounted: localStateRef.current.hasCounted,
      });
      dispatchLocal({
        type: "set",
        stage: "idle",
        hasCounted: localStateRef.current.hasCounted,
      });
    }
  };

  const handleNextPhrase = useCallback(() => {
    const snapshot = localStateRef.current;
    if (snapshot.stage === "recording") {
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
    recorderRef.current?.reset();
    resetTimer();
    setElapsedMs(0);
    setPhraseRecord(null);
  }, [currentIndex, dispatchLocal, resetTimer, updatePreferences]);

  const handleExit = useCallback(() => {
    const snapshot = localStateRef.current;
    if (snapshot.stage === "recording") {
      return;
    }

    if (snapshot.hasCounted) {
      handleNextPhrase();
    } else {
      updatePreferences({
        trainingStage: "idle",
        trainingHasCounted: snapshot.hasCounted,
      });
      dispatchLocal({
        type: "set",
        stage: "idle",
        hasCounted: snapshot.hasCounted,
      });
    }

    router.push("/");
  }, [dispatchLocal, handleNextPhrase, router, updatePreferences]);

  const canAdvance = sessionState !== "recording";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => setEnforcePortrait(query.matches);
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  useEffect(() => {
    if (!enforcePortrait) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }
    const query = window.matchMedia("(orientation: portrait)");
    const update = () => setIsPortrait(query.matches);
    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, [enforcePortrait]);

  useEffect(() => {
    if (sessionState === "recording") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExit, sessionState]);

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-slate-950 text-slate-100">
      {enforcePortrait && !isPortrait ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-slate-950 px-8 text-center text-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Portrait only
          </p>
          <p className="max-w-xs text-sm text-slate-300">
            Rotate your device upright to continue training.
          </p>
        </div>
      ) : null}
      <div className="flex w-full max-w-5xl flex-1 flex-col">
        <TrainingHeader
          current={currentIndex}
          totalCompleted={preferences.trainingCompletedCount}
        />
        <TrainingBody
          phrase={currentPhrase}
          isRecording={sessionState === "recording"}
          elapsedMs={elapsedMs}
          saving={saving}
          error={recorderError}
          record={phraseRecord}
        />
        <TrainingFooter
          state={sessionState}
          canAdvance={canAdvance}
          onRecordToggle={handleRecordToggle}
          onNext={handleNextPhrase}
          onExit={handleExit}
          phraseId={currentPhrase.id}
        />
      </div>
    </div>
  );
}
