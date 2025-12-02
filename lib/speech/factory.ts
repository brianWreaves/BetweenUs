import { DeepgramService } from "./deepgram-service";
import { MicrophoneService } from "./microphone-service";
import { type SpeechService, type SpeechServiceOptions } from "./speech-service";

export const getSpeechService = (
  service: string,
  options: SpeechServiceOptions,
): SpeechService => {
  if (service === "microphone") {
    return new MicrophoneService(options);
  }

  if (
    service === "deepgram" &&
    process.env.NEXT_PUBLIC_DEEPGRAM_ENABLED === "true"
  ) {
    return new DeepgramService({ // <-- This line is the critical fix
      getSocketUrl: async () => {
        const buildRequest = () =>
          fetch(
            `${
              process.env.NEXT_PUBLIC_API_BASE_URL
            }/api/deepgram-socket?apiKey=${encodeURIComponent(
              options.apiKey || "",
            )}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${options.apiKey}`,
              },
            },
          );

        let request = buildRequest();

        if (options.retry?.shouldRetry) {
          const result = await options.retry.shouldRetry(request);
          request = result.request;
        }

        const response = await request;

        if (response.status === 200) {
          const data = await response.json();
          return data.url;
        }
        return null;
      },
      apiKey: options.apiKey,
      retry: options.retry,
    });
  }

  throw new Error(`Unknown speech service: ${service}`);
};
