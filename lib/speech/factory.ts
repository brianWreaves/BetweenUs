import type { SpeechService } from "./service";
import { createMockSpeechService } from "./mock-service";
import { DeepgramSpeechService } from "./deepgram-service";

type SpeechServiceConfig = {
  fallbackScript: string[];
  modelOverride?: string;
};

export function getSpeechService(config: SpeechServiceConfig): SpeechService {
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_DEEPGRAM_ENABLED === "true"
  ) {
    return new DeepgramSpeechService({
      getSocketUrl: async () => {
        const buildRequest = () =>
          fetch(
            config.modelOverride
              ? `/api/relay-token?model=${encodeURIComponent(config.modelOverride)}`
              : "/api/relay-token",
          );

        const tryFetch = async (): Promise<string> => {
          const response = await buildRequest();
          if (!response.ok) {
            throw new Error("Unable to obtain relay URL.");
          }
          const data = (await response.json()) as { url?: string; error?: string };
          if (!data.url) {
            throw new Error(data.error ?? "Relay URL missing from response.");
          }
          return data.url;
        };

        const url = await tryFetch();
        return url;
      },
      onRequestId: (id) => {
        console.info("Deepgram request id:", id);
        // Expose to UI via onStreamError/onFatalError is handled in page.tsx through useConversation.
      },
      onFatalError: (error) => {
        console.error("Deepgram fatal error:", error);
      },
    });
  }

  return createMockSpeechService(config.fallbackScript);
}
