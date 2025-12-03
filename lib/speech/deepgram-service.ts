"use client";

import { Deepgram } from "@deepgram/sdk";
import type { SpeechService } from "./speechService";
import type { DeepgramOptions } from "./types";
import { type DeepgramLiveTranscriptionEvents } from "@deepgram/sdk/dist/main/lib/types";

export class DeepgramService implements SpeechService {
  private readonly deepgram: Deepgram;
  private readonly apiKey: string;

  constructor(options: DeepgramOptions) {
    if (options.apiKey) {
      this.deepgram = new Deepgram(options.apiKey);
      this.apiKey = options.apiKey;
    } else {
      throw new Error("Deepgram API key is missing");
    }
  }

  // Implementation placeholders for the SpeechService interface
  public start() {
    console.log("DeepgramService: start called (Placeholder)");
  }

  public stop() {
    console.log("DeepgramService: stop called (Placeholder)");
  }

  public onResult(handler: (data: any) => void) {
    console.log("DeepgramService: onResult handler registered (Placeholder)");
  }

  public onError(handler: (error: Error) => void) {
    console.log("DeepgramService: onError handler registered (Placeholder)");
  }

  public onStop(handler: () => void) {
    console.log("DeepgramService: onStop handler registered (Placeholder)");
  }
}
