import type { SpeechService } from "./service";
import { createMockSpeechService } from "./mock-service";
import { DeepgramSpeechService } from "./deepgram-service";

type SpeechServiceConfig = {
  fallbackScript: string[];
};

export function getSpeechService(config: SpeechServiceConfig): SpeechService {
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_DEEPGRAM_ENABLED === "true"
  ) {
    return new DeepgramSpeechService({
      getSocketUrl: async () => {
        const response = await fetch("/api/relay-token");
        if (!response.ok) {
          throw new Error("Unable to obtain relay URL.");
        }
        const data = (await response.json()) as { url?: string; error?: string };
        if (!data.url) {
          throw new Error(data.error ?? "Relay URL missing from response.");
        }
        return data.url;
      },
    });
  }

  return createMockSpeechService(config.fallbackScript);
}
