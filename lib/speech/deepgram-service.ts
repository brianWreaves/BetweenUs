import { Deepgram } from "@deepgram/sdk";
import type { SpeechService } from "./speech-service";
import type { DeepgramOptions } from "./types";

export class DeepgramService implements SpeechService {
  private dg: Deepgram;
  private onResultHandler: ((text: string) => void) | null = null;
  private onErrorHandler: ((err: Error) => void) | null = null;
  private onStopHandler: (() => void) | null = null;

  constructor(private options: DeepgramOptions) {
    this.dg = new Deepgram(options.apiKey);
  }

  async start() {
    // placeholder — Deepgram streaming goes here when needed
  }

  async stop() {
    if (this.onStopHandler) this.onStopHandler();
  }

  onResult(handler: (text: string) => void) {
    this.onResultHandler = handler;
  }

  onError(handler: (err: Error) => void) {
    this.onErrorHandler = handler;
  }

  onStop(handler: () => void) {
    this.onStopHandler = handler;
  }
}
