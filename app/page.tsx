import Link from "next/link";
import { StorageStatusCard } from "./components/storage-status-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-12">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
            BetweenUs · Phase 3
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Real-time speech becomes readable conversation.
          </h1>
          <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
            BetweenUs helps people living with Motor Neurone Disease share
            spoken words as large, flippable text so everyone around the table
            can follow along.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-16">
        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-8 shadow-lg shadow-slate-950/40 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-white">Why we’re here</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              The MVP focuses on clarity, speed, and reliability. We start with
              a standalone experience that runs entirely on-device, building the
              foundation for future integrations with the wider Waggie support
              platform.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-white">Phase 3 focus</h3>
              <p>Training workspace with phrase counter, phrase card, and footer controls.</p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-white">Phase 4 preview</h3>
              <p>Hook up recording, IndexedDB storage, and export packaging.</p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-white">Phase 5–8 preview</h3>
              <p>Conversation UI, Deepgram streaming, font controls, and flip UX.</p>
            </li>
          </ul>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8">
            <h2 className="text-xl font-semibold text-white">What’s ready now</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>✅ Training deck UI with phrase counter + stateful controls</li>
              <li>✅ PWA shell with IndexedDB + localStorage scaffolding</li>
              <li>✅ Region vocabulary hint stored in preferences</li>
              <li>✅ Phase-aware homepage, README, and testing guidance</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-emerald-700/40 bg-emerald-500/10 p-8 text-emerald-200">
            <h2 className="text-xl font-semibold text-emerald-100">
              Up next
            </h2>
            <p className="mt-4 text-sm leading-relaxed">
              Phase 4 deepens the training experience with actual audio capture,
              IndexedDB persistence, and ZIP export packaging.
            </p>
            <Link
              href="/training"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:text-white"
            >
              Open training workspace
            </Link>
          </div>
        </section>

        <StorageStatusCard />

        <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8">
          <h2 className="text-xl font-semibold text-white">Test checklist</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-300">
            <li>
              1. Install dependencies with <code>npm install</code>.
            </li>
            <li>
              2. Run <code>npm run dev</code> and open the forwarded preview URL.
            </li>
            <li>
              3. Use your browser’s install button (or “Add to Home Screen” on
              Android Firefox) — confirm the standalone app launches.
            </li>
            <li>
              4. Toggle offline mode: the shell should remain available, with the
              slider and storage status still visible.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
