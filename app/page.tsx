"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StorageStatusCard } from "./components/storage-status-card";

const sampleTranscripts = [
  "Thanks for being patient while I set things up.",
  "Let’s start reading a few lines together to warm up.",
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isPartnerView, setIsPartnerView] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const micButtonRef = useRef<HTMLButtonElement | null>(null);

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
  }, [isMicActive]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !menuPanelRef.current ||
        !menuButtonRef.current ||
        menuPanelRef.current.contains(target) ||
        menuButtonRef.current.contains(target)
      ) {
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

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
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
          {isMenuOpen ? (
            <div
              ref={menuPanelRef}
              className="absolute left-0 top-full z-30 mt-3 w-80 max-w-[calc(100vw-3rem)] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/60"
            >
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <StorageStatusCard />
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 py-10">
        <div
          className={cn(
            "mx-auto flex h-full w-full max-w-5xl flex-col transition-transform duration-300 ease-out",
            isPartnerView ? "rotate-180" : "rotate-0",
          )}
        >
          <div className="flex-1 space-y-10 overflow-y-auto py-6">
            {sampleTranscripts.map((text, index) => (
              <p
                key={index}
                className="text-4xl font-semibold leading-tight text-white"
              >
                {text}
              </p>
            ))}
            {isMicActive ? (
              <p className="text-4xl font-semibold leading-tight text-emerald-200">
                …
              </p>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 z-20 border-t border-slate-800 bg-slate-950/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/training"
            className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold transition hover:border-slate-500 hover:text-white"
          >
            Continue Training
          </Link>
          <button
            type="button"
            className={cn(
              "rounded-full px-6 py-3 text-sm font-semibold transition",
              isMicActive
                ? "bg-rose-600 text-white hover:bg-rose-500"
                : "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
            )}
            onClick={() => setIsMicActive((current) => !current)}
            ref={micButtonRef}
          >
            {isMicActive ? "MIC Stop" : "MIC Start"}
          </button>
        </div>
      </footer>
    </div>
  );
}
