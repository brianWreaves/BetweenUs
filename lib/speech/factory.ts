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

  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_DEEPGRAM_ENABLED === "true"
  ) {
    cachedService = new DeepgramSpeechService({
      getSocketUrl: async () => {
        const response = await fetch("/api/deepgram-socket");
        if (!response.ok) {
          throw new Error("Unable to obtain Deepgram URL.");
        }
        const data = (await response.json()) as { url?: string; error?: string };
        if (!data.url) {
          throw new Error(data.error ?? "Deepgram URL missing from response.");
        }
        return data.url;
      },
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
