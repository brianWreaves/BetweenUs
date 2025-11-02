import Link from "next/link";
import { StorageStatusCard } from "./components/storage-status-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-12">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
            BetweenUs · Phase 4
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-14">
        <StorageStatusCard />

        <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-8 shadow-lg shadow-slate-950/40 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-white">Phase snapshot</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Training now captures real audio on-device, stores it in IndexedDB, and
              makes it exportable for biasing transcription in future releases.
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
              <p>Audio capture with live timers, IndexedDB storage, and export actions.</p>
            </li>
            <li className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-white">Next up</h3>
              <p>Phase 5 builds the conversation surface and introduces streaming STT.</p>
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
              4. In the training workspace, press <em>Record</em>, then <em>Stop</em>; confirm the timer stops, the phrase is marked complete, and the <em>Next phrase</em> button unlocks. Move to the next phrase and refresh to confirm progress persists.
            </li>
            <li>
              5. Back on the dashboard, try <em>Export training data</em> to download a ZIP, then use <em>Clear counter</em> and confirm everything resets.
            </li>
            <li>
              6. Toggle offline mode; the landing page and saved preferences should remain available.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
