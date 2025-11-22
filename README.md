![BetweenUs wordmark](public/wordmark-placeholder.svg)

# BetweenUs

BetweenUs is a real-time speech-to-text companion built for people living with difficulty speaking clearly from medical conditions such asMotor Neurone Disease (MND). Spoken words are transcribed on-device and shown as large, flippable text blocks so conversation partners can keep up with face-to-face chats.

> **Phase 4 status (Training Logic & Data Flow)**  
> ✅ MediaRecorder-powered audio capture with live timer feedback  
> ✅ Recordings stored per phrase in IndexedDB (webm → wav on export)  
> ✅ Clear + export actions available from the home dashboard  
> ✅ ZIP export bundling manifest, transcripts, keywords, and audio  
> ✅ README + landing page refreshed with recording/export tests

---

## Tech stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, custom theming
- **Tooling:** ESLint (flat config), npm scripts
- **Target platform:** Firefox on Android (primary), deploy via Vercel

Roadmap phases are tracked from the [PRD](./docs/PRD.md) and organised into GitHub issues/PRs. Each phase completes with a “Test Now” checklist you can run on your device.

---

## Getting started locally

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Copy the environment template and fill in secrets**
   ```bash
   cp .env.local.example .env.local
   ```
   Required values:
   - `DEEPGRAM_API_KEY` – create in the Deepgram dashboard (Nova-3 Streaming, AU English)
   - `NEXT_PUBLIC_APP_ENV` – set to `local`, `preview`, or `production`
3. **Run the dev server**
   ```bash
   npm run dev
   ```
4. Open the forwarded preview link (or `http://localhost:3000` if running locally) and confirm the Phase 4 overview with storage + training summaries renders.

### PWA, storage & training smoke test

1. Look for the install prompt (Android Firefox uses "Add to Home screen"). Relaunch to confirm standalone mode.  
2. Toggle the "Message size preview" slider — the percentage and preview text should persist on refresh.  
3. Enter a suburb/region in the vocabulary hint box; reload to confirm it remains saved.  
4. Visit `/training`, press **Record** then **Stop**; confirm the timer stops, the phrase is marked complete, and **Next phrase** unlocks. Move forward, reload, and check the progress persists.  
5. Trigger **Clear counter** on the home card; verify recordings reset and counters return to zero.  
6. Use **Export training data** and confirm a ZIP downloads with manifest, keywords, transcripts, and audio assets.  
7. Switch the device/DevTools to offline mode; the landing page and stored preferences should still be available.

### Available npm scripts

| Script            | Description                                |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Start the Next.js development server       |
| `npm run build`   | Create a production build                  |
| `npm run start`   | Run the built app in production mode       |
| `npm run lint`    | Lint the project with the shared ESLint config |

---

## Vercel deployment checklist

1. **Create a new Vercel project** and link it to this repository.
2. **Set required environment variables** under “Settings → Environment Variables”:
   - `DEEPGRAM_API_KEY`
   - `NEXT_PUBLIC_APP_ENV` (`preview` for Preview, `production` for Production)
   - `RELAY_SHARED_SECRET` (must match the Render relay)
   - `RELAY_WS_URL` (the Render relay WebSocket URL)
3. **Enable the “Installable” preview** by ensuring the generated `manifest.webmanifest` appears under “Settings → Functions → Headers”.
4. **Protect secrets** by storing the Deepgram key only in Vercel (do not commit).
5. **Trigger a deployment** by pushing to `main` (Vercel auto-builds every commit).

> _Tip:_ invite collaborators through Vercel to allow access to logs and environment edits.

## Render relay deployment

Live streaming requires a lightweight relay that keeps the Deepgram API key server-side. Deploy it on [Render](https://render.com) and point the frontend at its WebSocket endpoint.

1. **Create a Render Web Service** and link it to this repository.
   - Set **Root Directory** to `relay`.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free “Starter” is sufficient.
2. **Environment variables on Render**
   - `DEEPGRAM_API_KEY`
   - `DEEPGRAM_LANGUAGE` (optional, defaults to `en-AU`)
   - `RELAY_MODEL` (optional, defaults to `nova-3`; set to `nova-2` or legacy IDs if nova-3 isn’t available)
   - `RELAY_TIER` (optional, only needed for legacy models that still require a tier parameter)
   - `RELAY_ENCODING` (defaults to `linear16` for PCM streaming)
   - `RELAY_SAMPLE_RATE` (defaults to `16000`; must match the PCM stream)
   - `RELAY_AUDIO_DUMP_DIR` (optional, local path for writing full WAV captures while debugging)
   - `RELAY_SHARED_SECRET` (generate a strong random string; reuse the same value on Vercel/local).
3. **Grab the relay URL** once Render deploys (e.g. `wss://betweenus-relay.onrender.com/stream`) and set it as `RELAY_WS_URL` in `.env.local` and Vercel.
4. The Next.js client now requests signed URLs from `/api/relay-token`, connects to the Render relay, and the relay forwards audio to Deepgram with the required headers.

---

## Phase workflow

The development plan is structured as 14 MVP phases. Each phase follows the same loop:

1. **Before starting** – share goals and tasks in plain language.  
2. **During** – work in small commits and pause with a “Test Now — [Phase]” message.  
3. **After** – provide a changelog and short test checklist, wait for sign-off.

### Upcoming phases

| Phase | Focus                                             |
| ----- | ------------------------------------------------- |
| 2     | ✅ Done — PWA shell, storage scaffolding           |
| 3     | ✅ Done — Training UI base elements                |
| 4     | ✅ Done — Recording pipeline, IndexedDB + ZIP export |
| 5–8   | Conversation surface, Deepgram streaming, flip UX |
| 9–11  | Orientation logic, dotted separators, notifications |

Each phase will raise/close GitHub issues and PRs so the full history stays transparent.

---

## Repository structure

```
app/               # Next.js App Router routes, layouts, and styles
app/components/    # Client components shared across routes
app/hooks/         # React client hooks (PWA/storage integration)
docs/              # Product requirements, decisions, and user-facing notes
lib/storage/       # IndexedDB + preference utilities and export helpers
lib/training/      # Static phrase decks and future training helpers
public/            # Static assets (icons, manifest, service worker)
.env.local.example # Template for local environment variables
```

Additional folders (e.g., `app/(training)` or `packages/speech`) will be introduced as the roadmap progresses.

---

## Testing expectations

Current manual checklist:

- Landing page renders without console errors in Firefox (Android/Desktop).  
- `npm run lint` and `npm run build` succeed.  
- PWA installation succeeds and launches in standalone mode (Add to Home screen on Android).  
- Offline mode still displays the cached shell with stored preferences.  
- Training workspace records audio, shows timers, and stores progress after reload.  
- Region hint persists in preferences and feeds export metadata.  
- Export ZIP includes manifest, keywords, transcripts, and audio assets.

Upcoming phases will layer automated tests around transcription flows, device orientation behaviour, and data export integrity.

---

## Contact

- GitHub: [brianwreaves/BetweenUs](https://github.com/brianwreaves/BetweenUs)
- Related project: Waggie (MND Support Platform)
- Feedback/issues: please open a GitHub issue with logs, device info, and reproduction steps.

Together we’ll iterate through each phase, keeping the build deployable and ready for real MND-user feedback at every milestone.
