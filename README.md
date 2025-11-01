![BetweenUs wordmark](public/wordmark-placeholder.svg)

# BetweenUs

BetweenUs is a real-time speech-to-text companion built for people living with Motor Neurone Disease (MND). Spoken words are transcribed on-device and shown as large, flippable text blocks so conversation partners can keep up with face-to-face chats.

> **Phase 3 status (Training UI – Base Elements)**  
> ✅ Training workspace with phrase counter, card, and footer controls  
> ✅ Persistent phrase index + completion counter stored in preferences  
> ✅ Region vocabulary hint captured for future keyword boosting  
> ✅ PWA shell, storage scaffolding, and export helpers from Phase 2  
> ✅ README + landing page refreshed with training test steps

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
4. Open the forwarded preview link (or `http://localhost:3000` if running locally) and confirm the Phase 3 overview with storage + training summaries renders.

### PWA, storage & training smoke test

1. Look for the install prompt (Android Firefox uses “Add to Home screen”). Relaunch to confirm standalone mode.  
2. Toggle the “Message size preview” slider — the percentage and preview text should persist on refresh.  
3. Enter a suburb/region in the vocabulary hint box; reload to confirm it remains saved.  
4. Visit `/training`, mark a phrase “Done”, move to the next, reload; the counter should persist.  
5. Switch the device/DevTools to offline mode; the landing page and stored preferences should still be available.

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
3. **Enable the “Installable” preview** by ensuring the generated `manifest.webmanifest` appears under “Settings → Functions → Headers”.
4. **Protect secrets** by storing the Deepgram key only in Vercel (do not commit).
5. **Trigger a deployment** by pushing to `main` (Vercel auto-builds every commit).

> _Tip:_ invite collaborators through Vercel to allow access to logs and environment edits.

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
| 4     | Training logic, recording pipeline, ZIP export    |
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
- Training workspace tracks phrase position + completion count after reload.  
- Region hint persists in preferences and will later feed keyword boosting.  
- `prepareTrainingExportPackage` returns manifests/transcripts matching stored phrases.

Upcoming phases will layer automated tests around transcription flows, device orientation behaviour, and data export integrity.

---

## Contact

- GitHub: [brianwreaves/BetweenUs](https://github.com/brianwreaves/BetweenUs)
- Related project: Waggie (MND Support Platform)
- Feedback/issues: please open a GitHub issue with logs, device info, and reproduction steps.

Together we’ll iterate through each phase, keeping the build deployable and ready for real MND-user feedback at every milestone.
