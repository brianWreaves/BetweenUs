import type { SpeechService } from "./speech-service";
import type { SpeechServiceOptions } from "./types";

export class MicrophoneService implements SpeechService {
  private onResultHandler: ((text: string) => void) | null = null;
  private onErrorHandler: ((err: Error) => void) | null = null;
  private onStopHandler: (() => void) | null = null;

  constructor(private options: SpeechServiceOptions) {}

  async start() {
    // placeholder microphone implementation
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
