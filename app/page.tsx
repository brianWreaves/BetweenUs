"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StorageStatusCard } from "./components/storage-status-card";

type ConversationMessage = {
  id: string;
  text: string;
  speaker: "user" | "partner";
  final: boolean;
};

const demoMessages: ConversationMessage[] = [
  {
    id: "msg-001",
    text: "Thanks for being patient — I’m loading the latest phrases.",
    speaker: "user",
    final: true,
  },
  {
    id: "msg-002",
    text: "All good! Ready when you are.",
    speaker: "partner",
    final: true,
  },
  {
    id: "msg-003",
    text: "Let’s start reading a few lines together to warm up.",
    speaker: "user",
    final: true,
  },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isPartnerView, setIsPartnerView] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <button
            type="button"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            onClick={() => setIsMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
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
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex-1 px-6 py-10">
          <div
            className={cn(
              "mx-auto flex h-full w-full max-w-5xl flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/40 transition-transform duration-300 ease-out",
              isPartnerView ? "rotate-180" : "rotate-0",
            )}
          >
            <header className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>{isMicActive ? "Listening…" : "Tap start to begin"}</span>
              <span>{demoMessages.length} messages</span>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto pb-4">
              {demoMessages.map((message) => (
                <p
                  key={message.id}
                  className={cn(
                    "max-w-xl rounded-3xl border px-5 py-4 text-2xl font-semibold leading-tight",
                    message.speaker === "user"
                      ? "ml-auto border-emerald-700/40 bg-emerald-500/10 text-emerald-100"
                      : "mr-auto border-slate-700/60 bg-slate-900/60 text-slate-100",
                    message.final ? "" : "opacity-80",
                  )}
                >
                  {message.text}
                </p>
              ))}
              {isMicActive ? (
                <p className="ml-auto max-w-xl rounded-3xl border border-emerald-500/60 bg-emerald-500/10 px-5 py-4 text-2xl font-semibold leading-tight text-emerald-100">
                  …
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="sticky bottom-0 z-20 border-t border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-4">
          <Link
            href="/training"
            className="rounded-3xl border border-slate-700 px-6 py-5 text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Continue Training
          </Link>
          <button
            type="button"
            className={cn(
              "rounded-3xl px-6 py-5 text-center text-sm font-semibold uppercase tracking-[0.3em] transition",
              isMicActive
                ? "border border-rose-600 bg-rose-500 text-rose-950 hover:bg-rose-400"
                : "border border-emerald-500 bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
            )}
            onClick={() => setIsMicActive((current) => !current)}
          >
            Mic {isMicActive ? "Stop" : "Start"}
          </button>
        </div>
      </footer>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-30 flex">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            aria-label="Close settings"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            className="relative ml-auto flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                Settings
              </h2>
              <button
                type="button"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <StorageStatusCard />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
