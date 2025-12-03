"use client";

import { type SpeechService, type SpeechServiceOptions } from "./speech-service";

export class MicrophoneService implements SpeechService {
  constructor(options: SpeechServiceOptions) {
    // Microphone service specific initialization if needed
    console.log("MicrophoneService initialized with options:", options);
  }

  // Required by SpeechService interface
  public start() {
    console.log("MicrophoneService: start called (Placeholder)");
    // TODO: Add logic to start microphone access
  }

  // Required by SpeechService interface
  public stop() {
    console.log("MicrophoneService: stop called (Placeholder)");
    // TODO: Add logic to stop microphone access
  }

  // Required by SpeechService interface
  public onResult(handler: (data: any) => void) {
    console.log("MicrophoneService: onResult handler registered (Placeholder)");
    // TODO: Add logic to register the result handler
  }

  // Required by SpeechService interface
  public onError(handler: (error: Error) => void) {
    console.log("MicrophoneService: onError handler registered (Placeholder)");
    // TODO: Add logic to register the error handler
  }

  // Required by SpeechService interface
  public onStop(handler: () => void) {
    console.log("MicrophoneService: onStop handler registered (Placeholder)");
    // TODO: Add logic to register the stop handler
  }
}
