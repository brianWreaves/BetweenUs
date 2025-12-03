// lib/speech/types.ts

export type SpeechServiceKey = "microphone" | "deepgram";

export interface SpeechService {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  onResult: (cb: (text: string) => void) => void;
  onError: (cb: (err: Error) => void) => void;
  onStop: (cb: () => void) => void;
}
