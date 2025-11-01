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

      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-14">
        <StorageStatusCard />

        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-8 shadow-lg shadow-slate-950/40 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-white">Phase snapshot</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              We now have a dedicated training workspace so phrases can be practised
              and marked complete before real audio capture lands in Phase 4.
            </p>
            <Link
              href="/training"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400 hover:text-white"
            >
              Open training workspace
            </Link>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-white">Ready now</h3>
              <p>Training deck UI with phrase counter, re-record flow, and persistent progress.</p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-white">Next up</h3>
              <p>Phase 4 connects audio capture, IndexedDB storage, and export packaging.</p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-white">Looking ahead</h3>
              <p>Phases 5–8 build the conversation surface, Deepgram streaming, and flip UX.</p>
            </li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8">
          <h2 className="text-xl font-semibold text-white">Why we are here</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            The MVP focuses on clarity, speed, and reliability. We start with a standalone
            experience that runs entirely on-device, building the foundation for future
            integrations with the wider Waggie support platform.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8">
          <h2 className="text-xl font-semibold text-white">Test checklist</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-300">
            <li>
              1. Run <code>npm run dev</code> and open the forwarded preview URL.
            </li>
            <li>
              2. Use Add to Home Screen on Android Firefox (or the install prompt elsewhere) and confirm the standalone app loads.
            </li>
            <li>
              3. Adjust the message-size slider and region hint above — refresh to ensure both persist.
            </li>
            <li>
              4. In the training workspace, press <em>Record</em>, then <em>Stop</em> to mark the phrase complete; the <em>Next phrase</em> button should unlock. Move to the next phrase and refresh to confirm the position persists.
            </li>
            <li>
              5. Toggle offline mode; the landing page and saved preferences should remain available.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
