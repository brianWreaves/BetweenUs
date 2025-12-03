import { DeepgramService } from "./deepgram-service";
import { MicrophoneService } from "./microphone-service";
import type { SpeechServiceOptions, SpeechServiceKey } from "./types";

export function getSpeechService(service: SpeechServiceKey, options: SpeechServiceOptions) {
  if (service === "deepgram") {
    return new DeepgramService(options as any);
  }

  return new MicrophoneService(options);
}
