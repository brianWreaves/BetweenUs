"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { StorageStatusCard } from "./components/storage-status-card";
import { getSpeechService } from "@/lib/speech/factory";
import { useConversation } from "./hooks/use-conversation";

const sampleTranscripts: string[] = [];

export default function Home() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPartnerView, setIsPartnerView] = useState(false);
  const [enforcePortrait, setEnforcePortrait] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const micButtonRef = useRef<HTMLButtonElement | null>(null);

  const deepgramEnabled =
    process.env.NEXT_PUBLIC_DEEPGRAM_ENABLED === "true";
  const [modelOverride, setModelOverride] = useState(
    process.env.NEXT_PUBLIC_MODEL_OVERRIDE ?? "",
  );
  const [pendingModelOverride, setPendingModelOverride] = useState(
    process.env.NEXT_PUBLIC_MODEL_OVERRIDE ?? "nova-3",
  );

  const speechService = useMemo(
    () =>
      getSpeechService({
        fallbackScript: sampleTranscripts,
        modelOverride: modelOverride || undefined,
      }),
    [modelOverride],
  );

  const {
    messages,
    draft,
    status,
    isListening,
    lastUpdatedAt,
    lastMessage,
    lastError,
    lastRequestId,
    start,
    stop,
    clear,
  } = useConversation(speechService, {
    initialMessages: deepgramEnabled ? [] : sampleTranscripts,
  });

  const handleContinueTraining = useCallback(() => {
    router.push("/training");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const evaluate = () => {
      const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
      setEnforcePortrait(coarseQuery.matches || hasTouchPoints);
    };
    evaluate();

    if (typeof coarseQuery.addEventListener === "function") {
      coarseQuery.addEventListener("change", evaluate);
      return () => coarseQuery.removeEventListener("change", evaluate);
    }
    coarseQuery.addListener(evaluate);
    return () => coarseQuery.removeListener(evaluate);
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
    const prefersPrecisePointer = (() => {
      if (typeof window === "undefined") {
        return false;
      }
      return window.matchMedia("(pointer: fine)").matches;
    })();

    if (prefersPrecisePointer && micButtonRef.current) {
      micButtonRef.current.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    const prefersPrecisePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches;
    if (prefersPrecisePointer && micButtonRef.current) {
      micButtonRef.current.focus({ preventScroll: true });
    }
  }, [isListening]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      const container = menuContainerRef.current;
      if (!container || container.contains(target)) {
        return;
      }
      setIsMenuOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      void stop();
    } else {
      void start();
    }
  }, [isListening, start, stop]);

  const handleClear = useCallback(() => {
    clear();
  }, [clear]);

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {enforcePortrait && !isPortrait ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-slate-950 px-8 text-center text-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Portrait only
          </p>
          <p className="max-w-xs text-sm text-slate-300">
            Rotate your device upright to continue using BetweenUs.
          </p>
        </div>
      ) : null}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="relative" ref={menuContainerRef}>
            <button
              type="button"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-haspopup="dialog"
              aria-expanded={isMenuOpen}
              ref={menuButtonRef}
            >
              Menu
            </button>
            {isMenuOpen ? (
              <div className="absolute left-0 top-full z-30 mt-3 w-80 max-w-[calc(100vw-3rem)] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/60">
                <div className="max-h-[70vh] overflow-y-auto p-4">
                  <StorageStatusCard />
                </div>
              </div>
            ) : null}
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-300">
            Logo
          </span>
          <button
            type="button"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            onClick={() => setIsPartnerView((current) => !current)}
            aria-pressed={isPartnerView}
          >
            Flip
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 py-10">
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-200">
              Debug Controls
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <p>Model override</p>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
                <input
                  type="radio"
                  className="text-emerald-400 focus:ring-emerald-400"
                  checked={pendingModelOverride === "nova-3"}
                  onChange={() => setPendingModelOverride("nova-3")}
                />
                <span>Nova-3 (default)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
                <input
                  type="radio"
                  className="text-emerald-400 focus:ring-emerald-400"
                  checked={pendingModelOverride === "nova-2"}
                  onChange={() => setPendingModelOverride("nova-2")}
                />
                <span>Nova-2</span>
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-full border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-600/20"
                onClick={() =>
                  setModelOverride(
                    pendingModelOverride === "nova-3"
                      ? ""
                      : pendingModelOverride.trim(),
                  )
                }
              >
                Apply
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-800/50"
                onClick={() => {
                  setModelOverride("");
                  setPendingModelOverride("nova-3");
                }}
              >
                Reset
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Current: {modelOverride ? modelOverride : "default (nova-3)"}.
            </p>
            {lastError ? (
              <p className="mt-3 rounded-lg border border-rose-800 bg-rose-900/50 px-3 py-2 text-xs text-rose-100">
                {lastError}
              </p>
            ) : null}
            {lastRequestId ? (
              <p className="mt-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-[11px] text-slate-200">
                Request ID: {lastRequestId}
              </p>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            "mx-auto flex h-full w-full max-w-5xl flex-col transition-transform duration-300 ease-out",
            isPartnerView ? "rotate-180" : "rotate-0",
          )}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>
              {status === "connecting"
                ? "Connecting…"
                : status === "listening"
                  ? "Listening"
                  : status === "error"
                    ? "Microphone error"
                    : "Tap start to begin"}
            </span>
            {lastUpdatedAt ? (
              <span>
                Updated {new Date(lastUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : null}
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto py-6">
            {messages.map((message) => (
              <p
                key={message.id}
                className="text-4xl font-semibold leading-tight text-white"
              >
                {message.text}
              </p>
            ))}
            {draft ? (
              <p className="text-4xl font-semibold leading-tight text-emerald-200">
                {draft}
              </p>
            ) : messages.length === 0 ? (
              <p className="text-lg text-slate-400">
                Press MIC Start to capture speech here. Text will appear live as you speak.
              </p>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 z-20 border-t border-slate-800 bg-slate-950/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-full border border-slate-700 px-4 py-3 text-sm font-semibold transition hover:border-slate-500 hover:text-white"
            onClick={handleContinueTraining}
          >
            Continue Training
          </button>
          <div className="flex items-center gap-3">
            {messages.length > 0 || draft ? (
              <button
                type="button"
                className="rounded-full border border-slate-700 px-4 py-3 text-sm font-semibold transition hover:border-slate-500 hover:text-white"
                onClick={handleClear}
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              className={cn(
                "rounded-full px-4 py-3 text-sm font-semibold transition",
                isListening
                  ? "bg-rose-600 text-white hover:bg-rose-500"
                  : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
              )}
              onClick={handleMicToggle}
              ref={micButtonRef}
            >
              {isListening ? "MIC Stop" : "MIC Start"}
            </button>
          </div>
          <div className="flex flex-1 flex-col items-end">
            {status === "error" ? (
              <p className="text-xs text-rose-300">
                Microphone unavailable — check permissions and try again.
              </p>
            ) : null}
            {lastMessage ? (
              <p className="mt-2 text-right text-xs text-slate-400">
                Last message: {lastMessage}
              </p>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
