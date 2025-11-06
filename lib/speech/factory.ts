import type { SpeechService } from "./service";
import { createMockSpeechService } from "./mock-service";
import { DeepgramSpeechService } from "./deepgram-service";

type SpeechServiceConfig = {
  fallbackScript: string[];
};

let cachedService: SpeechService | null = null;
let cachedIsMock = true;

export function getSpeechService(config: SpeechServiceConfig): SpeechService {
  if (cachedService) {
    return cachedService;
  }

  const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_DEEPGRAM_LISTEN_URL;

  if (typeof window !== "undefined" && apiKey) {
    cachedService = new DeepgramSpeechService({
      apiKey,
      apiUrl,
      language: process.env.NEXT_PUBLIC_DEEPGRAM_LANGUAGE ?? "en-AU",
      interimResults: true,
    });
    cachedIsMock = false;
    return cachedService;
  }

  cachedService = createMockSpeechService(config.fallbackScript);
  cachedIsMock = true;
  return cachedService;
}

export function isUsingMockSpeech() {
  return cachedIsMock;
}

export function resetSpeechService() {
  cachedService = null;
  cachedIsMock = true;
}
