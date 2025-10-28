# BetweenUs — Product Requirements Document (v0.4)

> Source: 251029 revision supplied by product management. This file captures the working MVP scope and should be updated whenever the PRD changes.

---

## Product Overview

BetweenUs is a real-time speech-to-text application designed for people with Motor Neurone Disease (MND) to assist face-to-face communication. The app displays transcribed speech as large, flippable text so conversation partners can easily read what’s being said.

**Core Purpose**  
Enable MND users with declining speech clarity to communicate in person by displaying their speech as readable text in real time.

**Product Vision**

- **MVP (Standalone):** A simple, fast, reliable speech display tool.
- **Future Integration:** Merge with Waggie (MND Support Platform) to share training data and offer broader support features.

**Target Users**

- Primary user: Person with MND who has mild to moderate speech impairment and wants to communicate face-to-face with family members, carers, healthcare professionals, and friends.
- Key characteristics:
  - May have limited dexterity (large touch targets required).
  - Speech patterns vary (vocabulary personalisation helps; full acoustic adaptation is a future pathway).
  - Needs immediate, reliable transcription.
  - Uses mobile devices (phone/tablet).

---

## Core Features — MVP

### Real-time Speech Transcription

- **What:** Continuous speech-to-text display as the user speaks.
- **Requirements:**
  - STT provider: Deepgram Nova-3 streaming (AU English, interim + final results).
  - Minimal latency target to be determined via testing; reconnect on network loss.
  - Works in noisy environments (browser echo/noise suppression enabled).
  - Auto-scroll to show latest text; manual scroll override to review earlier text.
  - “Clear Text” visible only in speaker view (0°).
  - Push to start; push to stop (speaker view only).
  - Message display readable at 1 metre; adjustable via slider.

**Technical**

- WebSocket streaming to Deepgram.
- Keyword boosting supported by training-derived vocabulary list.
- Session text accumulates until cleared.
- Store session metadata locally; no cloud services in MVP.

### Training (Flexible, Low-friction)

- **What:** Onboarding screen allows reading pre-written phrases to improve vocabulary bias and extracted keywords (not acoustic voice learning).
- **Requirements:**
  - No minimum required to use app.
  - Onboarding guidance: “Start with any number of phrases. We recommend 20 to begin; 200 gives best results.”
  - Record, re-record, progress counter, phrase categories.
  - Training progress persists; can use app anytime during training.
  - Accuracy indicator optional (only if non-confusing).

**Training phrase categories**

- Common commands; daily conversational phrases; phonetically balanced sentences; numbers and dates; radio alphabet; common nouns; action verbs.

**Data**

- Audio files stored locally in IndexedDB as Opus (.webm) for efficiency.
- Paired with known text transcripts; extracted keyword list.
- Training completion count saved; all dates in YYMMDD format.

**Export**

- ZIP export includes `manifest.json` (userId, phraseCount, keywords, completionDate YYMMDD), `keywords.json`, `audio/` (WAV files converted from .webm), `transcripts/` (TXT).
- Filename: `betweenUs-training-[userId]-[YYMMDD].zip`.

### Automatic Text Orientation (Device-based)

- **What:** Text automatically rotates based on device orientation for easy partner reading.
- **Requirements (MVP):**
  - Portrait only (0° speaker view; 180° partner view). No landscape.
  - 0° Speaker view: header/footer visible with controls.
  - 180° Partner view: header/footer hidden; only text and font-size slider visible.
  - All interactive buttons hidden in partner view.
  - Manual Flip button available in speaker view.
  - Uses Device Orientation API; smooth rotation (~0.3 s).
  - Flip trigger at ≥140° tilt; revert at ≤40°; near-threshold (120°–139° for >1.5 s) shows “Flip to partner view?” prompt.
  - If permission denied: show Manual Flip persistently; toggle for auto-rotate in Settings.

### Font Size Control

- Slider adjusts message-text size; no numeric labels or “A/A” icons.
- User views size change directly; this is adequate feedback.
- Available in both views; persists per device.

### Local-only Storage & PWA

- IndexedDB for training audio (.webm) and transcripts; localStorage for preferences (font size, last orientation, progress).
- PWA installable; offline after initial load (training/export only; live STT requires network).
- App icon, manifest, and service worker included.

---

## Message Segmentation (Updated)

- A “message” finalises at terminal punctuation or ≥2 s silence.
- Dotted separator renders only after the device flips to the reader (180°).
- The separator clears once the device flips back to the speaker (0°).
- Speaker has no use for the line.

---

## Technical Architecture

- **Framework:** Next.js 14 (App Router), SPA style.
- **Frontend:** React 18, TypeScript, Tailwind CSS (mobile-first).
- **Audio:** Web Audio + MediaRecorder API; capture .webm, convert to WAV on export.
- **Speech:** Deepgram Nova-3 streaming via WebSocket; keyword boosting; reconnection with exponential backoff.
- **Storage:** IndexedDB (training data); localStorage (preferences).
- **Deployment:** Vercel; environment variables via serverless proxy.

---

## Browser Support

- **MVP Primary:** Firefox (Android, latest 2 versions).
- **Future:** Firefox (Desktop) → Chrome/Edge/Safari + iOS PWA post-MVP.
- **Minimum Device:** Android 10 (API 29+) with microphone and motion sensors.
- **Network:** ≥100 kbps upstream recommended.

---

## Security & Privacy

**MVP**

- Data stored locally only.
- API key protected by Vercel proxy.
- HTTPS enforced.
- No analytics or telemetry.
- Export is manual and user-initiated.

**Future**

- Auth (OAuth/SSO via Waggie).
- At-rest encryption.
- GDPR and Australian Privacy Act compliance.
- “Delete My Data” control.

---

## Battery & Thermal

- Suggest low-power mode at ≤30% battery.
- Manual low-power toggle available in Settings.
- Reduces animation and refresh rates.
- Audio capture pauses if backgrounded or locked.

---

## Vendor Lock-in Prevention

SpeechService abstraction planned:

```ts
interface SpeechService {
  start(): Promise<void>;
  stop(): Promise<void>;
  onResult(cb: (text: string, isFinal: boolean) => void): void;
  onError(cb: (err: Error) => void): void;
}
```

MVP uses Deepgram adapter; future adapters (Voiceitt, Whisper, etc.) can drop in.

---

## Accessibility

- MVP: large touch targets, high contrast, readable fonts, focus outlines.
- Screen-reader labels added when each button is introduced (Phases 8–10).
- Post-MVP: high-contrast toggle, larger message text up to 96 px, optional dyslexia-friendly font, and future voice commands for “Stop”, “Clear”, “Flip”.

---

## Testing Requirements

Manual checklist includes:

- Mic/orientation permission allow/deny/re-grant.
- Transcription stability during 10+ min session.
- Orientation trigger at ~140°; near-threshold prompt.
- Font-size slider persistence.
- Training record/export integrity.
- IndexedDB quota at 80% → warning.
- Offline: conversation disabled; training/export active.
- WebSocket reconnect with backoff (1→2→4→8→15→30 s).
- Observational MND-user testing in Phases 4, 6, and 9.

---

## Success Metrics (MVP)

- Functional: user can communicate immediately, training optional; no crashes in 30-minute session; exports complete.
- User experience: readable from 1 m, auto-rotation natural, controls operable with limited dexterity.
- Technical: latency target to be set post-test; reconnect <30 s; PWA Lighthouse ≥90; zero uncaught exceptions.

---

## Development Roadmap (MVP → Future)

### MVP Phases

1. **Phase 1 – Foundation & Environment Setup**
   - Firefox (Android) primary.
   - Create GitHub repository with README.
   - Configure API keys (GitHub, Vercel, Deepgram).
   - Connect VS Code, AI assistant, Vercel.
   - Test deployment and secrets.
2. **Phase 2 – PWA + Storage Architecture**
   - Installable PWA with manifest/service worker.
   - Portrait responsive framework.
   - IndexedDB + localStorage setup.
   - Local log export (user-initiated).
3. **Phase 3 – Training UI: Base Elements**
   - Header: phrase counter.
   - Body: displayed phrase and Record / Done button.
   - Footer: Continue Later and Next buttons.
4. **Phase 4 – Training Logic & Data Flow**
   - Record/store phrases (.webm) + text; progress persists.
   - Training ZIP export.
5. **Phase 5 – Conversation UI Framework**
   - Header/body/footer layout.
   - Footer: mic Start/Stop (centre), Continue Training (left), Settings (right).
6. **Phase 6 – Real-Time Speech Transcription**
   - Deepgram streaming integration.
   - Local session persistence.
7. **Phase 7 – Font Size Control**
   - Slider adjusts message text; persists per device.
8. **Phase 8 – Header Controls**
   - Manual Flip (top-right), Clear Text (top-left).
   - Screen-reader labels added here.
9. **Phase 9 – Automatic Orientation Behaviour**
   - Auto-rotate (0°/180°) with smooth animation.
   - Manual Flip fallback.
   - Orientation permissions handled dynamically.
10. **Phase 10 – Conversation Flow Indicators**
    - Dotted line appears after flip to reader; clears on return to speaker.
    - Font slider accessible in both views.
11. **Phase 11 – System Messaging & Notifications**
    - Introduce all user messaging (see catalogue below).
    - Implement banners, toasts, and notifications.
12. **Phase 12 – Accessibility Enhancements**
    - High-contrast mode toggle.
    - Larger message-text options up to 96 px.
13. **Phase 13 – Settings & Privacy Controls**
    - Settings UI.
    - “Delete My Data” (clears IndexedDB + localStorage).
14. **Phase 14 – Desktop Browser Support**
    - Extend to Firefox (Desktop).

### User Messaging Catalogue (Triggers & Actions)

- Microphone denied → “BetweenUs can’t hear you. Turn on microphone in settings.”
- Network lost → “You’re offline — transcription paused.” Auto-retry 1→2→4→8→15→30 s, up to 5 tries. “Retry now” available.
- Reconnected → “Connection restored.”
- Storage ≥80% → “Storage almost full. Export and clear older training.”
- Offline start → “Offline mode: training and export only.”
- Orientation permission denied → “Auto-rotate disabled. Use Manual Flip.”
- Update available → “Update available — tap Reload.”
- Low battery ≤30% → “Low-power mode active.”
- Orientation near-threshold → “Flip to partner view?” (auto-dismiss).
- Storage cleared → “All local data deleted. App reset.”

All appear as subtle, high-contrast toast banners; calm, plain-language tone.

---

## Future / Post-MVP

1. **Phase 1 – Security & Data Protection**
   - Auth (OAuth/SSO), encryption, GDPR/Australian Privacy Act compliance.
2. **Phase 2 – Power Management**
   - Wake Lock API + fallback animation.
3. **Phase 3 – Storage UX Enhancements**
   - Quota indicator, warning, and graceful failure.
4. **Phase 4 – Error Handling UX**
   - Consistent toast-style messages; zero unhandled exceptions.
5. **Phase 5 – Provider Management**
   - Multi-provider STT support.
6. **Phase 6 – Enhanced Training Flow**
   - Full 0–200 phrase flexibility; progress, categories, optional accuracy display.
7. **Phase 7 – Advanced Orientation & Gestures**
   - Two-finger twist rotate; pinch resize; opt-in auto-rotate; optional landscape.
8. **Phase 8 – Browser Expansion**
   - Chrome/Edge/Safari optimisation; iOS PWA.
9. **Phase 9 – Waggie Integration**
   - Shared keywords, authentication, encrypted sync.

---

## Ideation / Unplanned (Exploration)

- Voice playback (consent required; user-controlled deletion).
- Live transcription sharing (link + PIN + expiry).
- Multi-language support, custom phrase library, conversation history, share via SMS/email.
- “Noisy environment mode” (VAD tuning).
- SpeechService abstraction fallback STT.
- Low-power long-session mode.
- Per-speaker adaptation research.
- Future voice commands for “Stop”, “Clear”, “Flip”.

---

## AI Assistant Instructions (Non-developer Workflow)

**Context**  
The user has limited development knowledge. The AI assistant manages builds, commits, and deployments while explaining each step.

**Workflow**

1. **Before starting a phase:**
   - Summarise goals in plain language.
   - List tasks it will perform.
   - Explain expected visible change and test method.
2. **During a phase:**
   - Work in small commits.
   - After each usable step, send a “Test Now — [Phase]” message.
   - Wait for “Continue” or a user question before proceeding.
3. **After a phase:**
   - Provide a changelog and short test checklist.
   - Wait for “Looks good” before moving on.

**User example commands**

- “Start Phase 1.”
- “Continue.”
- “Pause and explain.”
- “Repeat test.”
- “Raise a bug: mic permission message missing.”
- “Proceed to next step.”

**Issue tracking**

- Each feature has a GitHub issue with acceptance criteria.
- Commits/PRs reference and close issues.

**Secrets and safety**

- API keys stored in environment variables.
- Never exposed in logs or commits.
- HTTPS enforced for all communication.

**Documentation**

- README updated with setup, test instructions, and change summary each phase.

---

## Versioning

- **v0.1.0** – Initial PRD (251026).
- **v0.3.0** – Refined PRD with roadmap v0.3, .webm storage, orientation triggers, AI-assistant workflow (251028).
- **v0.4.0** – Reverses dotted-line logic (appears after flip, clears on return), keeps YYMMDD dates, defers all notifications to Phase 11, and consolidates full messaging triggers/actions (251029).

---

## Contact & Repository

- GitHub: [https://github.com/brianwreaves/BetweenUs](https://github.com/brianwreaves/BetweenUs)
- Related Project: Waggie (MND Support Platform to be created later)
- Feedback and issues: log in GitHub Issues.

